CREATE TABLE IF NOT EXISTS crm_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT NOT NULL,
    interaction_type TEXT,
    content TEXT,
    interaction_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- We try to add columns just in case the table existed but was incomplete.
-- SQLite will throw an error if the column exists, which we can ignore in this context.
ALTER TABLE crm_interactions ADD COLUMN content TEXT;
ALTER TABLE crm_interactions ADD COLUMN interaction_type TEXT;