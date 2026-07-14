package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type CommentRepo struct {
	db *pgxpool.Pool
}

func NewCommentRepo(db *pgxpool.Pool) *CommentRepo {
	return &CommentRepo{db: db}
}

func (r *CommentRepo) Create(ctx context.Context, c *model.Comment) error {
	query := `
		INSERT INTO comments (project_id, user_id, parent_id, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query, c.ProjectID, c.UserID, c.ParentID, c.Content).Scan(&c.ID, &c.CreatedAt)
	if err != nil {
		return err
	}

	// Fetch author details to return a hydrated comment object
	userQuery := `SELECT name, avatar_url FROM users WHERE id = $1`
	var u model.PublicUserDTO
	err = r.db.QueryRow(ctx, userQuery, c.UserID).Scan(&u.Name, &u.AvatarURL)
	if err == nil {
		c.User = &u
	}

	return nil
}

func (r *CommentRepo) GetByProjectID(ctx context.Context, projectID string) ([]model.Comment, error) {
	query := `
		SELECT c.id, c.project_id, c.user_id, c.parent_id, c.content, c.created_at,
		       u.name, u.avatar_url
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.project_id = $1
		ORDER BY c.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []model.Comment
	for rows.Next() {
		var c model.Comment
		var u model.PublicUserDTO
		err := rows.Scan(
			&c.ID, &c.ProjectID, &c.UserID, &c.ParentID, &c.Content, &c.CreatedAt,
			&u.Name, &u.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		c.User = &u
		comments = append(comments, c)
	}

	if comments == nil {
		comments = []model.Comment{}
	}

	return comments, nil
}
