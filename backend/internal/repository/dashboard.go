package repository

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type DashboardRepo struct {
	db *pgxpool.Pool
}

func NewDashboardRepo(db *pgxpool.Pool) *DashboardRepo {
	return &DashboardRepo{db: db}
}

// Struct specifically for the dashboard response
type DashboardProject struct {
	model.Project
	Applications []Application `json:"applications"`
}

type Application struct {
	ID        string      `json:"id"`
	RoleID    string      `json:"role_id"`
	RoleTitle string      `json:"role_title"`
	UserID    string      `json:"user_id"`
	Applicant *model.User `json:"applicant"`
	Message   string      `json:"message"`
	Status    string      `json:"status"`
}

func (r *DashboardRepo) GetMyProjectsWithApplications(ctx context.Context, ownerID string) ([]DashboardProject, error) {
	// Fetch projects
	query := `
		SELECT p.id, p.title, p.description, p.category, p.stage, p.city, p.created_at,
		       (SELECT COUNT(*) FROM project_views pv WHERE pv.project_id = p.id) as views_count
		FROM projects p
		WHERE p.owner_id = $1
		ORDER BY p.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []DashboardProject
	for rows.Next() {
		var dp DashboardProject
		err := rows.Scan(&dp.ID, &dp.Title, &dp.Description, &dp.Category, &dp.Stage, &dp.City, &dp.CreatedAt, &dp.ViewsCount)
		if err != nil {
			return nil, err
		}
		projects = append(projects, dp)
	}
	rows.Close() // Close early before doing sub-queries

	// Fetch roles and applications for each project
	for i := range projects {
		rolesQuery := `SELECT id, title, skills, slots, status FROM open_roles WHERE project_id = $1`
		rRows, _ := r.db.Query(ctx, rolesQuery, projects[i].ID)
		
		for rRows.Next() {
			var role model.OpenRole
			rRows.Scan(&role.ID, &role.Title, &role.Skills, &role.Slots, &role.Status)
			projects[i].Roles = append(projects[i].Roles, role)
		}
		rRows.Close()

		appsQuery := `
			SELECT a.id, a.role_id, r.title, a.user_id, u.name, u.email, u.avatar_url, u.telegram, u.github, a.message, a.status
			FROM applications a
			JOIN open_roles r ON a.role_id = r.id
			JOIN users u ON a.user_id = u.id
			WHERE r.project_id = $1
			ORDER BY a.created_at DESC
		`
		aRows, _ := r.db.Query(ctx, appsQuery, projects[i].ID)
		
		for aRows.Next() {
			var app Application
			var applicant model.User
			aRows.Scan(&app.ID, &app.RoleID, &app.RoleTitle, &app.UserID, &applicant.Name, &applicant.Email, &applicant.AvatarURL, &applicant.Telegram, &applicant.Github, &app.Message, &app.Status)
			app.Applicant = &applicant
			projects[i].Applications = append(projects[i].Applications, app)
		}
		aRows.Close()
	}

	return projects, nil
}

func (r *DashboardRepo) UpdateRoleStatus(ctx context.Context, ownerID, roleID, status string) error {
	// First ensure the user owns the project this role belongs to
	query := `
		UPDATE open_roles
		SET status = $1
		FROM projects p
		WHERE open_roles.project_id = p.id
		  AND open_roles.id = $2
		  AND p.owner_id = $3
	`
	_, err := r.db.Exec(ctx, query, status, roleID, ownerID)
	return err
}

func (r *DashboardRepo) UpdateApplicationStatus(ctx context.Context, ownerID, appID, status string) (string, string, string, error) {
	query := `
		UPDATE applications
		SET status = $1
		FROM open_roles ro
		JOIN projects p ON ro.project_id = p.id
		WHERE applications.role_id = ro.id
		  AND applications.id = $2
		  AND p.owner_id = $3
		RETURNING applications.user_id, p.id, p.title
	`
	var applicantID, projectID, projectTitle string
	err := r.db.QueryRow(ctx, query, status, appID, ownerID).Scan(&applicantID, &projectID, &projectTitle)
	return applicantID, projectID, projectTitle, err
}
