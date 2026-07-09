-- Добавляем статус для откликов
ALTER TABLE applications ADD COLUMN status VARCHAR(50) DEFAULT 'pending';

-- Добавляем статус для ролей
ALTER TABLE open_roles ADD COLUMN status VARCHAR(50) DEFAULT 'open';

-- Таблица для закладок (сохраненных проектов)
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, project_id)
);
