-- Up
ALTER TABLE users 
    ALTER COLUMN experience TYPE VARCHAR(255) USING experience::VARCHAR(255),
    ADD COLUMN email_notifications BOOLEAN DEFAULT true;
