const crypto = require('crypto');
const axios = require('axios');

const API_BASE = 'https://api.elevenlabs.io';

const client = axios.create({
    baseURL: API_BASE,
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    timeout: 30000,
});

/**
 * Verify the ElevenLabs post-call webhook signature.
 * Header format: "t=<unix seconds>,v0=<hmac-sha256 hex of `${t}.${rawBody}`>"
 */
const verifyWebhookSignature = (rawBody, signatureHeader, secret) => {
    if (!signatureHeader || !secret) return false;
    const parts = signatureHeader.split(',');
    const timestamp = parts.find((p) => p.startsWith('t='))?.substring(2);
    const signature = parts.find((p) => p.startsWith('v0='));
    if (!timestamp || !signature) return false;

    // Reject events older than 30 minutes to limit replay
    const ageSeconds = Math.floor(Date.now() / 1000) - Number(timestamp);
    if (!Number.isFinite(ageSeconds) || ageSeconds > 30 * 60 || ageSeconds < -5 * 60) return false;

    const digest =
        'v0=' +
        crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
        return false;
    }
};

/**
 * Place a single outbound call through a Twilio-connected agent phone number.
 * dynamicVariables become {{...}} substitutions in the agent's prompts.
 */
const startOutboundCall = async ({ agentId, agentPhoneNumberId, toNumber, dynamicVariables = {} }) => {
    const { data } = await client.post('/v1/convai/twilio/outbound-call', {
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: toNumber,
        conversation_initiation_client_data: {
            dynamic_variables: dynamicVariables,
        },
    });
    return data;
};

/**
 * Submit a batch calling job (Sentry sweeps).
 * recipients: [{ phone_number, conversation_initiation_client_data: { dynamic_variables } }]
 */
const submitBatchCall = async ({ callName, agentId, agentPhoneNumberId, recipients }) => {
    const { data } = await client.post('/v1/convai/batch-calling/submit', {
        call_name: callName,
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        scheduled_time_unix: Math.floor(Date.now() / 1000),
        recipients,
    });
    return data;
};

module.exports = { verifyWebhookSignature, startOutboundCall, submitBatchCall };
