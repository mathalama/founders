package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type PostRepo struct {
	db *pgxpool.Pool
}

func NewPostRepo(db *pgxpool.Pool) *PostRepo {
	return &PostRepo{db: db}
}

func (r *PostRepo) Create(ctx context.Context, p *model.Post) error {
	query := `
		INSERT INTO posts (user_id, parent_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query, p.UserID, p.ParentID, p.Content).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return err
	}

	// Fetch author details to return a hydrated Post object
	userQuery := `SELECT name, avatar_url, role_title FROM users WHERE id = $1`
	var u model.PublicUserDTO
	err = r.db.QueryRow(ctx, userQuery, p.UserID).Scan(&u.Name, &u.AvatarURL, &u.RoleTitle)
	if err == nil {
		p.User = &u
	}

	return nil
}

func (r *PostRepo) GetThreads(ctx context.Context) ([]model.Post, error) {
	query := `
		SELECT p.id, p.user_id, p.parent_id, p.content, p.created_at,
		       u.name, u.avatar_url, u.role_title
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.parent_id IS NULL
		ORDER BY p.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []model.Post
	for rows.Next() {
		var p model.Post
		var u model.PublicUserDTO
		err := rows.Scan(
			&p.ID, &p.UserID, &p.ParentID, &p.Content, &p.CreatedAt,
			&u.Name, &u.AvatarURL, &u.RoleTitle,
		)
		if err != nil {
			return nil, err
		}
		p.User = &u
		posts = append(posts, p)
	}

	if posts == nil {
		posts = []model.Post{}
	}

	return posts, nil
}

func (r *PostRepo) GetReplies(ctx context.Context, parentID string) ([]model.Post, error) {
	query := `
		SELECT p.id, p.user_id, p.parent_id, p.content, p.created_at,
		       u.name, u.avatar_url, u.role_title
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.parent_id = $1
		ORDER BY p.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []model.Post
	for rows.Next() {
		var p model.Post
		var u model.PublicUserDTO
		err := rows.Scan(
			&p.ID, &p.UserID, &p.ParentID, &p.Content, &p.CreatedAt,
			&u.Name, &u.AvatarURL, &u.RoleTitle,
		)
		if err != nil {
			return nil, err
		}
		p.User = &u
		posts = append(posts, p)
	}

	if posts == nil {
		posts = []model.Post{}
	}

	return posts, nil
}

func (r *PostRepo) GetByID(ctx context.Context, id string) (*model.Post, error) {
	query := `
		SELECT p.id, p.user_id, p.parent_id, p.content, p.created_at,
		       u.name, u.avatar_url, u.role_title
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = $1
	`
	var p model.Post
	var u model.PublicUserDTO
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.UserID, &p.ParentID, &p.Content, &p.CreatedAt,
		&u.Name, &u.AvatarURL, &u.RoleTitle,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	p.User = &u
	return &p, nil
}
