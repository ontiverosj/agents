import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApp } from './server.mjs';

test('setup gate, OAuth PKCE, replay protection, protected MCP and restart persistence', async t => {
  let upstreamCalls = 0;
  const cfg = { origin: 'http://localhost:38991', apiKey: 'ff_live_test', password: 'test-password-123456789', signingKey: 'test-signing-key-with-at-least-32-characters' };
  const upstream = async () => ({
    listTools: async () => ({ tools: [{ name:'list_formats', inputSchema:{type:'object'} }, { name:'generate_script', inputSchema:{type:'object'} }, { name:'unwanted', inputSchema:{type:'object'} }] }),
    callTool: async () => { upstreamCalls++; return {content:[{type:'text',text:'ok'}]}; }
  });
  let srv = createApp(cfg, upstream).listen(38991);
  t.after(()=>srv.close());
  const get = (path,opts={}) => fetch(cfg.origin+path, {redirect:'manual',...opts});
  const post = (path,body,extra={}) => get(path,{ method:'POST', headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body) });
  assert.equal((await post('/mcp', {})).status,401);
  assert.equal(upstreamCalls,0);
  assert.equal((await post('/register',{redirect_uris:['https://evil.example/callback']})).status,400);
  const redirect='https://chatgpt.com/connector_platform_oauth_redirect';
  const client=await (await post('/register',{redirect_uris:[redirect],token_endpoint_auth_method:'none'})).json();
  assert.ok(client.client_id);
  const verifier='a'.repeat(64);
  const query=new URLSearchParams({client_id:client.client_id,redirect_uri:redirect,response_type:'code',code_challenge_method:'S256',
    code_challenge:createHash('sha256').update(verifier).digest('base64url'),resource:cfg.origin+'/mcp',scope:'format:read format:generate',state:'test-state'});
  const consent=await get('/authorize?'+query);
  assert.equal(consent.status,200);
  // Browser form POSTs under no-referrer use Origin: null and fail CSRF validation.
  assert.equal(consent.headers.get('referrer-policy'),'same-origin');
  const cookie=consent.headers.get('set-cookie').split(';')[0];
  const html=await consent.text();
  const request=/name="request" value="([^"]+)"/.exec(html)[1];
  assert.equal((await post('/authorize',{request,password:cfg.password})).status,400);
  assert.equal((await post('/authorize',{request,password:cfg.password},{cookie,origin:'null'})).status,400);
  assert.equal((await post('/authorize',{request,password:cfg.password},{cookie,origin:'https://evil.example'})).status,400);
  assert.equal((await post('/authorize',{request,password:cfg.password},{origin:cfg.origin})).status,400);
  assert.equal((await post('/authorize',{request,password:'wrong'},{cookie,origin:cfg.origin})).status,403);
  const login=await post('/authorize',{request,password:cfg.password},{cookie,origin:cfg.origin});
  assert.equal(login.status,302);
  const callback=new URL(login.headers.get('location'));
  assert.equal(callback.searchParams.get('iss'),cfg.origin);
  assert.equal(callback.searchParams.get('state'),'test-state');
  const exchange={grant_type:'authorization_code',client_id:client.client_id,code:callback.searchParams.get('code'),redirect_uri:redirect,resource:cfg.origin+'/mcp',code_verifier:verifier};
  assert.equal((await post('/token',{...exchange,code_verifier:'b'.repeat(64)})).status,400);
  assert.equal((await post('/token',{...exchange,resource:'https://evil.example'})).status,400);
  const token=await (await post('/token',exchange)).json();
  assert.ok(token.access_token);
  assert.equal((await post('/token',exchange)).status,400);
  const headers={authorization:'Bearer '+token.access_token,accept:'application/json, text/event-stream'};
  const result=await post('/mcp',{jsonrpc:'2.0',id:1,method:'tools/list'},headers);
  assert.equal(result.status,200);
  const tools=(await result.json()).result.tools;
  assert.deepEqual(tools.map(t=>t.name),['list_formats','generate_script']);
  assert.equal(tools[1].annotations.readOnlyHint,false);
  assert.equal(upstreamCalls,0);
  assert.equal((await post('/mcp',{jsonrpc:'2.0',id:2,method:'tools/list'},{...headers,authorization:headers.authorization+'x'})).status,401);
  await new Promise(r=>srv.close(r));
  srv=createApp(cfg,upstream).listen(38991);
  // Public-client registration and access tokens survive a free-service restart.
  assert.equal((await get('/authorize?'+query)).status,200);
  assert.equal((await post('/mcp',{jsonrpc:'2.0',id:3,method:'tools/list'},headers)).status,200);
});

test('service without secrets is healthy but cannot authorize clients', async t=>{
  const srv=createApp({origin:'http://localhost:38992'},async()=>{throw Error('must not call upstream');}).listen(38992);
  t.after(()=>srv.close());
  const health=await (await fetch('http://localhost:38992/health')).json();
  assert.equal(health.status,'setup_required');
  const register=await fetch('http://localhost:38992/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(register.status,503);
});
