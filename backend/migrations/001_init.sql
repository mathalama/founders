CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id   TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    avatar_url  TEXT,
    role_title  TEXT,           -- "Backend Developer", "Designer", etc.
    skills      TEXT[],         -- tags
    experience  INT,            -- years
    github      TEXT,
    telegram    TEXT,
    bio         TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID REFERENCES users(id) NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,  -- "AI", "SaaS", "EdTech", etc.
    stage       TEXT NOT NULL,  -- "Идея", "MVP", "Есть пользователи", "Есть выручка"
    city        TEXT NOT NULL,
    website     TEXT,
    github      TEXT,
    telegram    TEXT NOT NULL,  -- founder's TG for applications
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id),
    name        TEXT NOT NULL,
    role        TEXT NOT NULL
);

CREATE TABLE open_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,       -- "Frontend Developer"
    skills      TEXT NOT NULL,       -- "React, TypeScript"
    slots       INT DEFAULT 1
);

CREATE TABLE applications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id     UUID REFERENCES open_roles(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id),
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roadmap_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    done        BOOLEAN DEFAULT false,
    sort_order  INT DEFAULT 0
);
