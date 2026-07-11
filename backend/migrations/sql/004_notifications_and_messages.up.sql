CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL, -- e.g. 'new_application', 'application_accepted', 'application_rejected'
    message     TEXT NOT NULL,
    link        TEXT, -- Optional link to click (e.g. '/project/123')
    is_read     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);
