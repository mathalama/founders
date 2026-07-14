package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type AuditLogRepo struct {
	db *pgxpool.Pool
}

func NewAuditLogRepo(db *pgxpool.Pool) *AuditLogRepo {
	return &AuditLogRepo{db: db}
}

func (r *AuditLogRepo) Create(ctx context.Context, adminID *string, action, targetType, targetID, details string) error {
	query := `
		INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(ctx, query, adminID, action, targetType, targetID, details)
	return err
}

func (r *AuditLogRepo) GetAll(ctx context.Context) ([]model.AuditLog, error) {
	query := `
		SELECT a.id, a.admin_id, u.name as admin_name, a.action, a.target_type, a.target_id, a.details, a.created_at
		FROM audit_logs a
		LEFT JOIN users u ON a.admin_id = u.id
		ORDER BY a.created_at DESC
		LIMIT 100
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []model.AuditLog
	for rows.Next() {
		var l model.AuditLog
		err := rows.Scan(&l.ID, &l.AdminID, &l.AdminName, &l.Action, &l.TargetType, &l.TargetID, &l.Details, &l.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []model.AuditLog{}
	}
	return logs, nil
}
