package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicationRepo struct {
	db *pgxpool.Pool
}

func NewApplicationRepo(db *pgxpool.Pool) *ApplicationRepo {
	return &ApplicationRepo{db: db}
}

func (r *ApplicationRepo) CreateApplication(ctx context.Context, roleID, userID, message string) error {
	query := `
		INSERT INTO applications (role_id, user_id, message)
		VALUES ($1, $2, $3)
	`
	_, err := r.db.Exec(ctx, query, roleID, userID, message)
	return err
}

func (r *ApplicationRepo) GetRoleDetails(ctx context.Context, roleID string) (string, string, string, string, string, string, error) {
	query := `
		SELECT ro.title, p.title, u.email, u.name, u.id, p.id
		FROM open_roles ro
		JOIN projects p ON ro.project_id = p.id
		JOIN users u ON p.owner_id = u.id
		WHERE ro.id = $1
	`
	var roleTitle, projectName, ownerEmail, ownerName, ownerID, projectID string
	err := r.db.QueryRow(ctx, query, roleID).Scan(&roleTitle, &projectName, &ownerEmail, &ownerName, &ownerID, &projectID)
	return roleTitle, projectName, ownerEmail, ownerName, ownerID, projectID, err
}

type UserApplication struct {
	ID          string `json:"id"`
	RoleID      string `json:"role_id"`
	RoleTitle   string `json:"role_title"`
	ProjectID   string `json:"project_id"`
	ProjectTitle string `json:"project_title"`
	Message     string `json:"message"`
	Status      string `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

func (r *ApplicationRepo) GetMyApplications(ctx context.Context, userID string) ([]UserApplication, error) {
	query := `
		SELECT a.id, a.role_id, ro.title as role_title, p.id as project_id, p.title as project_title, a.message, a.status, a.created_at
		FROM applications a
		JOIN open_roles ro ON a.role_id = ro.id
		JOIN projects p ON ro.project_id = p.id
		WHERE a.user_id = $1
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []UserApplication
	for rows.Next() {
		var a UserApplication
		err := rows.Scan(&a.ID, &a.RoleID, &a.RoleTitle, &a.ProjectID, &a.ProjectTitle, &a.Message, &a.Status, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, nil
}
