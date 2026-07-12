package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type ProjectRepo struct {
	db *pgxpool.Pool
}

func NewProjectRepo(db *pgxpool.Pool) *ProjectRepo {
	return &ProjectRepo{db: db}
}

func (r *ProjectRepo) GetAll(ctx context.Context, category, stage, city, role, search string, page, limit int) ([]model.Project, error) {
	query := `
		SELECT p.id, p.owner_id, p.title, p.description, p.category, p.stage, p.city, p.website, p.github, p.telegram, p.status, p.created_at, p.is_hidden,
		       u.name as owner_name, u.avatar_url as owner_avatar
		FROM projects p
		JOIN users u ON p.owner_id = u.id
		WHERE p.is_hidden = false
	`
	var args []interface{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND (p.title ILIKE $%d OR p.description ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if category != "" {
		query += fmt.Sprintf(" AND p.category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if stage != "" {
		query += fmt.Sprintf(" AND p.stage = $%d", argIdx)
		args = append(args, stage)
		argIdx++
	}
	if city != "" {
		query += fmt.Sprintf(" AND p.city = $%d", argIdx)
		args = append(args, city)
		argIdx++
	}
	if role != "" {
		query += fmt.Sprintf(" AND EXISTS (SELECT 1 FROM open_roles ro WHERE ro.project_id = p.id AND ro.title ILIKE $%d)", argIdx)
		args = append(args, "%"+role+"%")
		argIdx++
	}

	query += " ORDER BY p.created_at DESC"

	if limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
		args = append(args, limit, (page-1)*limit)
		argIdx += 2
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		var owner model.User
		err := rows.Scan(
			&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.Category, &p.Stage, &p.City, &p.Website, &p.Github, &p.Telegram, &p.Status, &p.CreatedAt, &p.IsHidden,
			&owner.Name, &owner.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		
		// Fetch open roles for feed card
		rolesQuery := `SELECT id, project_id, title, skills, slots, status FROM open_roles WHERE project_id = $1 AND status = 'open'`
		rolesRows, rErr := r.db.Query(ctx, rolesQuery, p.ID)
		if rErr == nil {
			defer rolesRows.Close()
			for rolesRows.Next() {
				var role model.OpenRole
				rolesRows.Scan(&role.ID, &role.ProjectID, &role.Title, &role.Skills, &role.Slots, &role.Status)
				p.Roles = append(p.Roles, role)
			}
		}

		// Fetch roadmap for progress bar
		rmQuery := `SELECT id, project_id, title, done, sort_order FROM roadmap_items WHERE project_id = $1 ORDER BY sort_order`
		rmRows, rmErr := r.db.Query(ctx, rmQuery, p.ID)
		if rmErr == nil {
			defer rmRows.Close()
			for rmRows.Next() {
				var rm model.RoadmapItem
				rmRows.Scan(&rm.ID, &rm.ProjectID, &rm.Title, &rm.Done, &rm.SortOrder)
				p.Roadmap = append(p.Roadmap, rm)
			}
		}

		p.Owner = &owner
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *ProjectRepo) GetPublicProjectsByOwner(ctx context.Context, ownerID string) ([]model.Project, error) {
	query := `
		SELECT id, owner_id, title, description, category, stage, city, website, github, telegram, status, created_at, is_hidden,
		       (SELECT COUNT(*) FROM project_views pv WHERE pv.project_id = id) as views_count
		FROM projects
		WHERE owner_id = $1 AND is_hidden = false
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.Category, &p.Stage, &p.City, &p.Website, &p.Github, &p.Telegram, &p.Status, &p.CreatedAt, &p.IsHidden, &p.ViewsCount); err != nil {
			return nil, err
		}
		
		rolesQuery := `SELECT id, project_id, title, skills, slots, status FROM open_roles WHERE project_id = $1 AND status = 'open'`
		rolesRows, rErr := r.db.Query(ctx, rolesQuery, p.ID)
		if rErr == nil {
			defer rolesRows.Close()
			for rolesRows.Next() {
				var role model.OpenRole
				rolesRows.Scan(&role.ID, &role.ProjectID, &role.Title, &role.Skills, &role.Slots, &role.Status)
				p.Roles = append(p.Roles, role)
			}
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *ProjectRepo) GetByID(ctx context.Context, id string) (*model.Project, error) {
	query := `
		SELECT p.id, p.owner_id, p.title, p.description, p.category, p.stage, p.city, p.website, p.github, p.telegram, p.status, p.created_at, p.is_hidden,
		       u.name as owner_name, u.avatar_url as owner_avatar,
		       (SELECT COUNT(*) FROM project_views pv WHERE pv.project_id = p.id) as views_count
		FROM projects p
		JOIN users u ON p.owner_id = u.id
		WHERE p.id = $1
	`
	var p model.Project
	var owner model.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.Category, &p.Stage, &p.City, &p.Website, &p.Github, &p.Telegram, &p.Status, &p.CreatedAt, &p.IsHidden,
		&owner.Name, &owner.AvatarURL, &p.ViewsCount,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	p.Owner = &owner

	// Fetch Roles
	rolesQuery := `SELECT id, project_id, title, skills, slots, status FROM open_roles WHERE project_id = $1`
	rolesRows, err := r.db.Query(ctx, rolesQuery, id)
	if err == nil {
		defer rolesRows.Close()
		for rolesRows.Next() {
			var role model.OpenRole
			rolesRows.Scan(&role.ID, &role.ProjectID, &role.Title, &role.Skills, &role.Slots, &role.Status)
			p.Roles = append(p.Roles, role)
		}
	}

	// Fetch Team Members
	teamQuery := `SELECT id, project_id, user_id, name, role FROM team_members WHERE project_id = $1`
	teamRows, err := r.db.Query(ctx, teamQuery, id)
	if err == nil {
		defer teamRows.Close()
		for teamRows.Next() {
			var tm model.TeamMember
			teamRows.Scan(&tm.ID, &tm.ProjectID, &tm.UserID, &tm.Name, &tm.Role)
			p.Team = append(p.Team, tm)
		}
	}

	// Fetch Roadmap
	roadmapQuery := `SELECT id, project_id, title, done, sort_order FROM roadmap_items WHERE project_id = $1 ORDER BY sort_order`
	roadmapRows, err := r.db.Query(ctx, roadmapQuery, id)
	if err == nil {
		defer roadmapRows.Close()
		for roadmapRows.Next() {
			var rm model.RoadmapItem
			roadmapRows.Scan(&rm.ID, &rm.ProjectID, &rm.Title, &rm.Done, &rm.SortOrder)
			p.Roadmap = append(p.Roadmap, rm)
		}
	}

	return &p, nil
}

func (r *ProjectRepo) Create(ctx context.Context, p *model.Project) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO projects (owner_id, title, description, category, stage, city, website, github, telegram, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at
	`
	err = tx.QueryRow(ctx, query, p.OwnerID, p.Title, p.Description, p.Category, p.Stage, p.City, p.Website, p.Github, p.Telegram, p.Status).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return err
	}

	for i := range p.Roles {
		roleQuery := `INSERT INTO open_roles (project_id, title, skills, slots) VALUES ($1, $2, $3, $4) RETURNING id`
		err = tx.QueryRow(ctx, roleQuery, p.ID, p.Roles[i].Title, p.Roles[i].Skills, p.Roles[i].Slots).Scan(&p.Roles[i].ID)
		if err != nil {
			return err
		}
		p.Roles[i].ProjectID = p.ID
	}

	for i := range p.Team {
		teamQuery := `INSERT INTO team_members (project_id, name, role) VALUES ($1, $2, $3) RETURNING id`
		err = tx.QueryRow(ctx, teamQuery, p.ID, p.Team[i].Name, p.Team[i].Role).Scan(&p.Team[i].ID)
		if err != nil {
			return err
		}
		p.Team[i].ProjectID = p.ID
	}

	for i := range p.Roadmap {
		rmQuery := `INSERT INTO roadmap_items (project_id, title, done, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`
		err = tx.QueryRow(ctx, rmQuery, p.ID, p.Roadmap[i].Title, p.Roadmap[i].Done, p.Roadmap[i].SortOrder).Scan(&p.Roadmap[i].ID)
		if err != nil {
			return err
		}
		p.Roadmap[i].ProjectID = p.ID
	}

	return tx.Commit(ctx)
}

func (r *ProjectRepo) Update(ctx context.Context, p *model.Project, ownerID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Verify ownership
	var dbOwnerID string
	err = tx.QueryRow(ctx, "SELECT owner_id FROM projects WHERE id = $1", p.ID).Scan(&dbOwnerID)
	if err != nil {
		return err
	}
	if dbOwnerID != ownerID {
		return fmt.Errorf("forbidden")
	}

	// Update main project fields
	_, err = tx.Exec(ctx, `
		UPDATE projects SET
			title = $1, description = $2, category = $3, stage = $4,
			city = $5, website = $6, github = $7, telegram = $8, status = $9
		WHERE id = $10
	`, p.Title, p.Description, p.Category, p.Stage, p.City, p.Website, p.Github, p.Telegram, p.Status, p.ID)
	if err != nil {
		return err
	}

	// Replace roles: delete all then re-insert
	_, err = tx.Exec(ctx, "DELETE FROM open_roles WHERE project_id = $1", p.ID)
	if err != nil {
		return err
	}
	for i := range p.Roles {
		roleQuery := `INSERT INTO open_roles (project_id, title, skills, slots) VALUES ($1, $2, $3, $4) RETURNING id`
		err = tx.QueryRow(ctx, roleQuery, p.ID, p.Roles[i].Title, p.Roles[i].Skills, p.Roles[i].Slots).Scan(&p.Roles[i].ID)
		if err != nil {
			return err
		}
		p.Roles[i].ProjectID = p.ID
	}

	// Replace roadmap
	_, err = tx.Exec(ctx, "DELETE FROM roadmap_items WHERE project_id = $1", p.ID)
	if err != nil {
		return err
	}
	for i := range p.Roadmap {
		rmQuery := `INSERT INTO roadmap_items (project_id, title, done, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`
		err = tx.QueryRow(ctx, rmQuery, p.ID, p.Roadmap[i].Title, p.Roadmap[i].Done, i).Scan(&p.Roadmap[i].ID)
		if err != nil {
			return err
		}
		p.Roadmap[i].ProjectID = p.ID
	}

	return tx.Commit(ctx)
}

func (r *ProjectRepo) UpdateStatus(ctx context.Context, id, ownerID, status string) error {
	query := `UPDATE projects SET status = $1 WHERE id = $2 AND owner_id = $3`
	res, err := r.db.Exec(ctx, query, status, id, ownerID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("forbidden or not found")
	}
	return nil
}

func (r *ProjectRepo) UpdateRoleStatus(ctx context.Context, roleID, ownerID, status string) error {
	// First verify that the owner owns the project this role belongs to
	query := `
		UPDATE open_roles 
		SET status = $1 
		WHERE id = $2 
		AND EXISTS (SELECT 1 FROM projects WHERE id = open_roles.project_id AND owner_id = $3)
	`
	res, err := r.db.Exec(ctx, query, status, roleID, ownerID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("forbidden or not found")
	}
	return nil
}

func (r *ProjectRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM projects WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *ProjectRepo) GetAllAdmin(ctx context.Context) ([]model.Project, error) {
	query := `
		SELECT p.id, p.owner_id, p.title, p.description, p.category, p.stage, p.city, p.website, p.github, p.telegram, p.status, p.created_at, p.is_hidden,
		       u.name as owner_name, u.avatar_url as owner_avatar
		FROM projects p
		JOIN users u ON p.owner_id = u.id
		ORDER BY p.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		var owner model.User
		err := rows.Scan(
			&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.Category, &p.Stage, &p.City, &p.Website, &p.Github, &p.Telegram, &p.Status, &p.CreatedAt, &p.IsHidden,
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

func (r *ProjectRepo) ToggleHide(ctx context.Context, id string) error {
	query := `UPDATE projects SET is_hidden = NOT is_hidden WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *ProjectRepo) RecordView(ctx context.Context, projectID string, viewerID *string) error {
	query := `INSERT INTO project_views (project_id, viewer_id) VALUES ($1, $2)`
	_, err := r.db.Exec(ctx, query, projectID, viewerID)
	return err
}
