ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS is_email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_pin;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expires;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expires;
ALTER TABLE users ALTER COLUMN google_id SET NOT NULL;
