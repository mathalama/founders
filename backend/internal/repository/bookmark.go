package repository

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type BookmarkRepo struct {
	db *pgxpool.Pool
}

func NewBookmarkRepo(db *pgxpool.Pool) *BookmarkRepo {
	return &BookmarkRepo{db: db}
}

func (r *BookmarkRepo) ToggleBookmark(ctx context.Context, userID, projectID string) (bool, error) {
	// Check if exists
	var exists bool
	err := r.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = $1 AND project_id = $2)", userID, projectID).Scan(&exists)
	if err != nil {
		return false, err
	}

	if exists {
		_, err = r.db.Exec(ctx, "DELETE FROM bookmarks WHERE user_id = $1 AND project_id = $2", userID, projectID)
		return false, err // returns false indicating it was removed
	} else {
		_, err = r.db.Exec(ctx, "INSERT INTO bookmarks (user_id, project_id) VALUES ($1, $2)", userID, projectID)
		return true, err // returns true indicating it was added
	}
}

func (r *BookmarkRepo) GetMyBookmarks(ctx context.Context, userID string) ([]model.Project, error) {
	query := `
		SELECT p.id, p.owner_id, p.title, p.description, p.category, p.stage, p.city, p.website, p.github, p.telegram, p.created_at,
		       u.name as owner_name, u.avatar_url as owner_avatar
		FROM projects p
		JOIN bookmarks b ON p.id = b.project_id
		JOIN users u ON p.owner_id = u.id
		WHERE b.user_id = $1
		ORDER BY b.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		var owner model.PublicUserDTO
		err := rows.Scan(
			&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.Category, &p.Stage, &p.City, &p.Website, &p.Github, &p.Telegram, &p.CreatedAt,
			&owner.Name, &owner.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		
		p.Owner = &owner
		projects = append(projects, p)
	}
	return projects, nil
}
