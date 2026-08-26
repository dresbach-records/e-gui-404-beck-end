ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES forum_posts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS forum_posts_parent_idx ON forum_posts(parent_id);
