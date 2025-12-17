CREATE TABLE IF NOT EXISTS crm_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT NOT NULL,
    interaction_type TEXT,
    interaction_summary TEXT,
    interaction_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);