package repository

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type NotificationRepo struct {
	db *pgxpool.Pool
}

func NewNotificationRepo(db *pgxpool.Pool) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) Create(ctx context.Context, userID, notifType, message string, link *string) error {
	query := `INSERT INTO notifications (user_id, type, message, link) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(ctx, query, userID, notifType, message, link)
	return err
}

func (r *NotificationRepo) GetMyNotifications(ctx context.Context, userID string) ([]model.Notification, error) {
	query := `SELECT id, user_id, type, message, link, is_read, created_at 
			  FROM notifications 
			  WHERE user_id = $1 
			  ORDER BY created_at DESC 
			  LIMIT 50`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []model.Notification
	for rows.Next() {
		var n model.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Message, &n.Link, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, nil
}

func (r *NotificationRepo) MarkAsRead(ctx context.Context, notificationID, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, notificationID, userID)
	return err
}

func (r *NotificationRepo) MarkAllAsRead(ctx context.Context, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE user_id = $1`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}
