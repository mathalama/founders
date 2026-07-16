CREATE TABLE IF NOT EXISTS sent_emails_log (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type TEXT NOT NULL,
    recipient  TEXT NOT NULL,
    sent_at    TIMESTAMPTZ DEFAULT now()
);
