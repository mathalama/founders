ALTER TABLE users ADD COLUMN open_to_offers BOOLEAN DEFAULT false NOT NULL;

CREATE TABLE posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    parent_id   UUID REFERENCES posts(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_posts_parent_id ON posts(parent_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
