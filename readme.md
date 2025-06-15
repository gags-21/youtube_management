CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,   -- info, error, warn
  message TEXT NOT NULL,     -- event message
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);