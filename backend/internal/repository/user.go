package repository

import (
	"context"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) UpsertByGoogleID(ctx context.Context, googleID, name, email string) (*model.User, error) {
	query := `
		INSERT INTO users (google_id, name, email)
		VALUES ($1, $2, $3)
		ON CONFLICT (google_id) DO UPDATE
		SET name = EXCLUDED.name, email = EXCLUDED.email
		RETURNING id, google_id, name, email, avatar_url, role_title, skills, experience, email_notifications, github, telegram, bio, created_at
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, googleID, name, email).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.Experience, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, experience, email_notifications, github, telegram, bio, created_at
		FROM users WHERE id = $1
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.Experience, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) UpdateProfile(ctx context.Context, u *model.User) error {
	query := `
		UPDATE users
		SET role_title = $1, skills = $2, experience = $3, email_notifications = $4, github = $5, telegram = $6, bio = $7
		WHERE id = $8
	`
	_, err := r.db.Exec(ctx, query, u.RoleTitle, u.Skills, u.Experience, u.EmailNotifications, u.Github, u.Telegram, u.Bio, u.ID)
	return err
}
