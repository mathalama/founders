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

func (r *UserRepo) UpsertByGoogleID(ctx context.Context, googleID, name, email string, isAdmin bool) (*model.User, error) {
	query := `
		INSERT INTO users (google_id, name, email, is_admin)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (google_id) DO UPDATE
		SET name = EXCLUDED.name, email = EXCLUDED.email, is_admin = users.is_admin OR EXCLUDED.is_admin
		RETURNING id, google_id, name, email, avatar_url, role_title, skills, experience, email_notifications, github, telegram, bio, is_admin, is_banned, created_at
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, googleID, name, email, isAdmin).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.Experience, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, experience, email_notifications, github, telegram, bio, is_admin, is_banned, created_at
		FROM users WHERE id = $1
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.Experience, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt,
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

func (r *UserRepo) GetAllUsers(ctx context.Context) ([]model.User, error) {
	query := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, experience, email_notifications, github, telegram, bio, is_admin, is_banned, created_at
		FROM users
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		err := rows.Scan(
			&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.Experience, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepo) ToggleAdmin(ctx context.Context, id string) error {
	// Flip the is_admin boolean
	query := `UPDATE users SET is_admin = NOT is_admin WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *UserRepo) ToggleBan(ctx context.Context, id string) error {
	query := `UPDATE users SET is_banned = NOT is_banned WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *UserRepo) Delete(ctx context.Context, id string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Delete related records to satisfy foreign key constraints
	_, err = tx.Exec(ctx, `DELETE FROM applications WHERE user_id = $1`, id)
	if err != nil { return err }

	_, err = tx.Exec(ctx, `DELETE FROM team_members WHERE user_id = $1`, id)
	if err != nil { return err }

	_, err = tx.Exec(ctx, `DELETE FROM projects WHERE owner_id = $1`, id)
	if err != nil { return err }

	// Finally, delete the user
	_, err = tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil { return err }

	return tx.Commit(ctx)
}

func (r *UserRepo) GetAdminStats(ctx context.Context) (map[string]int, error) {
	stats := make(map[string]int)

	var totalUsers int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&totalUsers); err != nil {
		return nil, err
	}
	stats["totalUsers"] = totalUsers

	var totalProjects int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM projects`).Scan(&totalProjects); err != nil {
		return nil, err
	}
	stats["totalProjects"] = totalProjects

	var usersLast7 int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`).Scan(&usersLast7); err != nil {
		return nil, err
	}
	stats["usersLast7"] = usersLast7

	var projectsLast7 int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM projects WHERE created_at >= NOW() - INTERVAL '7 days'`).Scan(&projectsLast7); err != nil {
		return nil, err
	}
	stats["projectsLast7"] = projectsLast7

	var openRoles int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM open_roles WHERE status = 'open'`).Scan(&openRoles); err != nil {
		return nil, err
	}
	stats["openRoles"] = openRoles

	var totalApplications int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM applications`).Scan(&totalApplications); err != nil {
		return nil, err
	}
	stats["totalApplications"] = totalApplications

	return stats, nil
}
