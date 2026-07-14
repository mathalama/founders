CREATE TABLE blocked_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    blocked_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
