ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_pin TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMPTZ;
