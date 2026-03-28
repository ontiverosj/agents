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