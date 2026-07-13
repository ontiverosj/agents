import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { api } from './api.js';
import Overview from './pages/Overview.jsx';
import NicheDetail from './pages/NicheDetail.jsx';
import GamePlan from './pages/GamePlan.jsx';
import AddNiche from './pages/AddNiche.jsx';

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="brand">📈 TikTok Niche Finder</Link>
        <nav>
          {health && (
            <span
              className="mode-pill"
              title={
                health.providers.data === 'mock'
                  ? 'Running on realistic sample data. Set APIFY_TOKEN for live TikTok data.'
                  : 'Fetching live TikTok data via Apify.'
              }
            >
              data: {health.providers.data === 'mock' ? 'sample' : 'live'} · plans:{' '}
              {health.providers.planner === 'claude' ? 'AI' : 'template'}
            </span>
          )}
          <Link to="/add" className="btn primary">+ Track niche</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/add" element={<AddNiche />} />
        <Route path="/niche/:id" element={<NicheDetail />} />
        <Route path="/niche/:id/plan" element={<GamePlan />} />
      </Routes>
    </div>
  );
}
