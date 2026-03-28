const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const agents = [
    { name: 'Scout' },
    { name: 'Scribe' },
    { name: 'Sentry' },
    { name: 'Sage' },
    { name: 'Scholar' }
];

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Agents API',
        availableAgents: agents.map(agent => ({
            name: agent.name,
            endpoint: `/${agent.name.toLowerCase()}`,
            method: 'POST'
        }))
    });
});

agents.forEach(agent => {
    app.post(`/${agent.name.toLowerCase()}`, (req, res) => {
        const response = {
            agent: agent.name,
            status: 'ready',
            timestamp: new Date().toISOString()
        };
        res.json(response);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});