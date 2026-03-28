const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const agents = ['scout', 'scribe', 'sentry', 'sage', 'scholar'];

app.get('/', (req, res) => {
    res.json({
        service: 'Acquisition Agents',
        agents: agents,
        status: 'running'
    });
});

agents.forEach(agent => {
    app.post(`/${agent}`, (req, res) => {
        res.json({
            agent: agent,
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    });
});

app.listen(port, () => {
    console.log(`Acquisition Agents service running on port ${port}`);
});
