package repository

import (
	"context"
	"time"

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
	// First, check if a user with the same email already exists
	var existingUser model.User
	queryCheck := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
		FROM users WHERE email = $1
	`
	err := r.db.QueryRow(ctx, queryCheck, email).Scan(
		&existingUser.ID, &existingUser.GoogleID, &existingUser.Name, &existingUser.Email, &existingUser.AvatarURL, &existingUser.RoleTitle, &existingUser.Skills, &existingUser.EmailNotifications, &existingUser.Github, &existingUser.Telegram, &existingUser.Bio, &existingUser.IsAdmin, &existingUser.IsBanned, &existingUser.CreatedAt, &existingUser.OpenToOffers,
		&existingUser.PasswordHash, &existingUser.IsEmailVerified, &existingUser.EmailVerificationPin, &existingUser.EmailVerificationExpires, &existingUser.ResetToken, &existingUser.ResetTokenExpires,
	)

	if err == nil {
		// User exists with this email!
		// If google_id is NULL or empty, link it!
		if existingUser.GoogleID == nil || *existingUser.GoogleID == "" {
			updateQuery := `
				UPDATE users
				SET google_id = $1, is_email_verified = TRUE
				WHERE id = $2
				RETURNING id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
			`
			var u model.User
			err = r.db.QueryRow(ctx, updateQuery, googleID, existingUser.ID).Scan(
				&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
				&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
			)
			if err != nil {
				return nil, err
			}
			return &u, nil
		}
		// If google_id is already set and is different, update it to match the incoming googleID
		if *existingUser.GoogleID != googleID {
			updateQuery := `
				UPDATE users
				SET google_id = $1
				WHERE id = $2
				RETURNING id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
			`
			var u model.User
			err = r.db.QueryRow(ctx, updateQuery, googleID, existingUser.ID).Scan(
				&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
				&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
			)
			if err != nil {
				return nil, err
			}
			return &u, nil
		}
		return &existingUser, nil
	} else if err != pgx.ErrNoRows {
		return nil, err
	}

	// No user exists with this email, do a clean insert
	insertQuery := `
		INSERT INTO users (google_id, name, email, is_admin, is_email_verified)
		VALUES ($1, $2, $3, $4, TRUE)
		ON CONFLICT (google_id) DO UPDATE
		SET name = EXCLUDED.name, email = EXCLUDED.email, is_admin = users.is_admin OR EXCLUDED.is_admin
		RETURNING id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
	`
	var u model.User
	err = r.db.QueryRow(ctx, insertQuery, googleID, name, email, isAdmin).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
		&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
		FROM users WHERE id = $1
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
		&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
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
		SET role_title = $1, skills = $2, email_notifications = $3, github = $4, telegram = $5, bio = $6, open_to_offers = $7, name = $8
		WHERE id = $9
	`
	_, err := r.db.Exec(ctx, query, u.RoleTitle, u.Skills, u.EmailNotifications, u.Github, u.Telegram, u.Bio, u.OpenToOffers, u.Name, u.ID)
	return err
}

func (r *UserRepo) GetAllUsers(ctx context.Context) ([]model.User, error) {
	query := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
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
			&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
			&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
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
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var isBanned bool
	err = tx.QueryRow(ctx, "SELECT is_banned FROM users WHERE id = $1", id).Scan(&isBanned)
	if err != nil {
		return err
	}

	newBanned := !isBanned
	_, err = tx.Exec(ctx, "UPDATE users SET is_banned = $1 WHERE id = $2", newBanned, id)
	if err != nil {
		return err
	}

	if newBanned {
		// Cascade delete all user's content when they are banned
		_, err = tx.Exec(ctx, `DELETE FROM applications WHERE user_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM team_members WHERE user_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM projects WHERE owner_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM posts WHERE user_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM notifications WHERE user_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM bookmarks WHERE user_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1`, id)
		if err != nil { return err }

		_, err = tx.Exec(ctx, `DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1`, id)
		if err != nil { return err }
	}

	return tx.Commit(ctx)
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

func (r *UserRepo) GetAdminStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

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

	var totalEmails int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM sent_emails_log`).Scan(&totalEmails); err != nil {
		totalEmails = 0
	}
	stats["totalEmails"] = totalEmails

	type DailyStat struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}

	// 1. Daily signups
	dailySignups := make([]DailyStat, 0)
	signupQuery := `
		SELECT TO_CHAR(d, 'YYYY-MM-DD') AS day, COUNT(u.id) AS count
		FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
		LEFT JOIN users u ON DATE(u.created_at) = DATE(d)
		GROUP BY d
		ORDER BY d ASC
	`
	rows, err := r.db.Query(ctx, signupQuery)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var ds DailyStat
			if err := rows.Scan(&ds.Date, &ds.Count); err == nil {
				dailySignups = append(dailySignups, ds)
			}
		}
	}
	stats["dailySignups"] = dailySignups

	// 2. Daily projects
	dailyProjects := make([]DailyStat, 0)
	projectQuery := `
		SELECT TO_CHAR(d, 'YYYY-MM-DD') AS day, COUNT(p.id) AS count
		FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
		LEFT JOIN projects p ON DATE(p.created_at) = DATE(d)
		GROUP BY d
		ORDER BY d ASC
	`
	prows, err := r.db.Query(ctx, projectQuery)
	if err == nil {
		defer prows.Close()
		for prows.Next() {
			var ds DailyStat
			if err := prows.Scan(&ds.Date, &ds.Count); err == nil {
				dailyProjects = append(dailyProjects, ds)
			}
		}
	}
	stats["dailyProjects"] = dailyProjects

	// 3. Daily emails
	dailyEmails := make([]DailyStat, 0)
	emailQuery := `
		SELECT TO_CHAR(d, 'YYYY-MM-DD') AS day, COUNT(e.id) AS count
		FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
		LEFT JOIN sent_emails_log e ON DATE(e.sent_at) = DATE(d)
		GROUP BY d
		ORDER BY d ASC
	`
	erows, err := r.db.Query(ctx, emailQuery)
	if err == nil {
		defer erows.Close()
		for erows.Next() {
			var ds DailyStat
			if err := erows.Scan(&ds.Date, &ds.Count); err == nil {
				dailyEmails = append(dailyEmails, ds)
			}
		}
	}
	stats["dailyEmails"] = dailyEmails

	return stats, nil
}

func (r *UserRepo) BlockUser(ctx context.Context, blockerID, blockedID string) error {
	query := `
		INSERT INTO blocked_users (blocker_id, blocked_id)
		VALUES ($1, $2)
		ON CONFLICT (blocker_id, blocked_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, blockerID, blockedID)
	return err
}

func (r *UserRepo) UnblockUser(ctx context.Context, blockerID, blockedID string) error {
	query := `
		DELETE FROM blocked_users
		WHERE blocker_id = $1 AND blocked_id = $2
	`
	_, err := r.db.Exec(ctx, query, blockerID, blockedID)
	return err
}

func (r *UserRepo) IsBlocked(ctx context.Context, blockerID, blockedID string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM blocked_users
			WHERE blocker_id = $1 AND blocked_id = $2
		)
	`
	var exists bool
	err := r.db.QueryRow(ctx, query, blockerID, blockedID).Scan(&exists)
	return exists, err
}

func (r *UserRepo) GetBlockedUsers(ctx context.Context, blockerID string) ([]model.PublicUserDTO, error) {
	query := `
		SELECT u.id, u.name, u.avatar_url, u.role_title
		FROM blocked_users b
		JOIN users u ON b.blocked_id = u.id
		WHERE b.blocker_id = $1
		ORDER BY b.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, blockerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.PublicUserDTO
	for rows.Next() {
		var u model.PublicUserDTO
		err := rows.Scan(&u.ID, &u.Name, &u.AvatarURL, &u.RoleTitle)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if users == nil {
		users = []model.PublicUserDTO{}
	}
	return users, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
		FROM users WHERE email = $1
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
		&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) CreateLocalUser(ctx context.Context, name, email, passwordHash, pin string, pinExpires time.Time) (*model.User, error) {
	query := `
		INSERT INTO users (name, email, password_hash, email_verification_pin, email_verification_expires, is_email_verified)
		VALUES ($1, $2, $3, $4, $5, FALSE)
		RETURNING id, google_id, name, email, avatar_url, role_title, skills, email_notifications, github, telegram, bio, is_admin, is_banned, created_at, open_to_offers, password_hash, is_email_verified, email_verification_pin, email_verification_expires, reset_token, reset_token_expires
	`
	var u model.User
	err := r.db.QueryRow(ctx, query, name, email, passwordHash, pin, pinExpires).Scan(
		&u.ID, &u.GoogleID, &u.Name, &u.Email, &u.AvatarURL, &u.RoleTitle, &u.Skills, &u.EmailNotifications, &u.Github, &u.Telegram, &u.Bio, &u.IsAdmin, &u.IsBanned, &u.CreatedAt, &u.OpenToOffers,
		&u.PasswordHash, &u.IsEmailVerified, &u.EmailVerificationPin, &u.EmailVerificationExpires, &u.ResetToken, &u.ResetTokenExpires,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) VerifyEmail(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET is_email_verified = TRUE, email_verification_pin = NULL, email_verification_expires = NULL
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *UserRepo) UpdateVerificationPIN(ctx context.Context, email, pin string, pinExpires time.Time) error {
	query := `
		UPDATE users
		SET email_verification_pin = $1, email_verification_expires = $2
		WHERE email = $3
	`
	_, err := r.db.Exec(ctx, query, pin, pinExpires, email)
	return err
}

func (r *UserRepo) UpdateResetToken(ctx context.Context, email, token string, expires time.Time) error {
	query := `
		UPDATE users
		SET reset_token = $1, reset_token_expires = $2
		WHERE email = $3
	`
	_, err := r.db.Exec(ctx, query, token, expires, email)
	return err
}

func (r *UserRepo) ResetPassword(ctx context.Context, email, newPasswordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
		WHERE email = $2
	`
	_, err := r.db.Exec(ctx, query, newPasswordHash, email)
	return err
}

