-- Index for querying generations by user (e.g. for history)
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

-- Index for querying generations by project (e.g. for project thumbnails)
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON generations(project_id);

-- Index for querying generations by status (e.g. finding completed ones)
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

-- Composite index for the specific query used in projects.py fallback
-- .eq("project_id", item["id"]).eq("status", "COMPLETED").order("created_at", desc=True)
CREATE INDEX IF NOT EXISTS idx_generations_project_status_created ON generations(project_id, status, created_at DESC);
