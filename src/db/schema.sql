CREATE TABLE IF NOT EXISTS niches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  hashtags TEXT NOT NULL,           -- JSON array of hashtag strings (no #)
  keywords TEXT,                    -- JSON array
  status TEXT NOT NULL DEFAULT 'tracked',  -- tracked | archived
  created_at TEXT NOT NULL,
  last_refreshed_at TEXT
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  niche_id INTEGER NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  url TEXT,
  author_handle TEXT,
  author_followers INTEGER,
  caption TEXT,
  hashtags TEXT,                    -- JSON array
  duration_seconds INTEGER,
  posted_at TEXT,
  first_seen_at TEXT NOT NULL,
  UNIQUE(niche_id, external_id)
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  captured_at TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_snapshots_video_time ON metric_snapshots(video_id, captured_at);

CREATE TABLE IF NOT EXISTS niche_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  niche_id INTEGER NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  computed_at TEXT NOT NULL,
  median_views REAL,
  avg_engagement_rate REAL,
  view_velocity REAL,
  creator_saturation REAL,
  est_watch_score REAL,
  opportunity_score REAL,
  video_count INTEGER
);
CREATE INDEX IF NOT EXISTS idx_scores_niche_time ON niche_scores(niche_id, computed_at);

CREATE TABLE IF NOT EXISTS game_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  niche_id INTEGER NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  generated_at TEXT NOT NULL,
  generator TEXT NOT NULL,          -- claude | rules
  model TEXT,
  plan_json TEXT NOT NULL
);
