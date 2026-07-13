import { useState } from 'react';
import { fmt } from '../api.js';

const COLUMNS = [
  { key: 'views', label: 'Views' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'velocity', label: 'Views/hr' },
  { key: 'watch', label: 'Est. retention' },
];

export default function VideoTable({ videos, onSort, sort }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? videos : videos.slice(0, 10);

  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Top videos</h2>
        <span className="estimate-tag" title="Retention is estimated from public engagement signals, not actual watch-time data.">
          retention is estimated
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Video</th>
              <th>Creator</th>
              <th className="num">Followers</th>
              <th className="num">Length</th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`num sortable`}
                  onClick={() => onSort(c.key)}
                  title={`Sort by ${c.label.toLowerCase()}`}
                >
                  {c.label} {sort === c.key ? '▾' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((v) => (
              <tr key={v.id}>
                <td style={{ maxWidth: 320 }}>
                  {v.url ? (
                    <a href={v.url} target="_blank" rel="noreferrer">
                      {(v.caption || '(no caption)').slice(0, 80)}
                    </a>
                  ) : (
                    (v.caption || '(no caption)').slice(0, 80)
                  )}
                </td>
                <td style={{ color: 'var(--ink-2)' }}>{v.authorHandle || '—'}</td>
                <td className="num">{fmt.num(v.authorFollowers)}</td>
                <td className="num">{v.durationSeconds ? `${v.durationSeconds}s` : '—'}</td>
                <td className="num">{fmt.num(v.latest.views)}</td>
                <td className="num">{fmt.pct(v.engagementRate)}</td>
                <td className="num">{fmt.num(v.viewVelocity)}</td>
                <td className="num">{Math.round(v.estWatchScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {videos.length > 10 && (
        <button className="btn" style={{ marginTop: 10 }} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show all ${videos.length}`}
        </button>
      )}
    </div>
  );
}
