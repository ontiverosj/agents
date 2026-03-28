app.get('/', (req, res) => {
    res.json({
        service: 'Acquisition Agents',
        agents: ['scout', 'scribe', 'sentry', 'sage', 'scholar'],
        status: 'running'
    });
});
