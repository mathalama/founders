package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mathalama/nucla-backend/internal/model"
)

type MessageRepo struct {
	db *pgxpool.Pool
}

func NewMessageRepo(db *pgxpool.Pool) *MessageRepo {
	return &MessageRepo{db: db}
}

func (r *MessageRepo) SendMessage(ctx context.Context, senderID, receiverID, content string) (*model.Message, error) {
	query := `INSERT INTO messages (sender_id, receiver_id, content) 
			  VALUES ($1, $2, $3) RETURNING id, sender_id, receiver_id, content, is_read, created_at`
	var m model.Message
	err := r.db.QueryRow(ctx, query, senderID, receiverID, content).Scan(
		&m.ID, &m.SenderID, &m.ReceiverID, &m.Content, &m.IsRead, &m.CreatedAt,
	)
	return &m, err
}

func (r *MessageRepo) GetChatHistory(ctx context.Context, userID1, userID2 string) ([]model.Message, error) {
	query := `SELECT id, sender_id, receiver_id, content, is_read, created_at 
			  FROM messages 
			  WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
			  ORDER BY created_at ASC`
	rows, err := r.db.Query(ctx, query, userID1, userID2)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.Content, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	
	// Mark messages from the other user as read
	if len(messages) > 0 {
		updateQuery := `UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`
		r.db.Exec(ctx, updateQuery, userID1, userID2)
	}
	
	return messages, nil
}

// GetConversations returns the last message of each conversation for the user
type Conversation struct {
	OtherUserID   string    `json:"otherUserId"`
	OtherUserName string    `json:"otherUserName"`
	OtherUserAvatar *string `json:"otherUserAvatar,omitempty"`
	LastMessage   string    `json:"lastMessage"`
	LastMessageAt time.Time `json:"lastMessageAt"`
	UnreadCount   int       `json:"unreadCount"`
}

func (r *MessageRepo) GetConversations(ctx context.Context, userID string) ([]Conversation, error) {
	// Query gets the latest message for each conversation and joins with users table to get details
	query := `
		WITH RankedMessages AS (
			SELECT 
				m.id, m.sender_id, m.receiver_id, m.content, m.created_at, m.is_read,
				CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
				ROW_NUMBER() OVER (
					PARTITION BY CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END 
					ORDER BY m.created_at DESC
				) as rn
			FROM messages m
			WHERE m.sender_id = $1 OR m.receiver_id = $1
		),
		UnreadCounts AS (
			SELECT sender_id as other_user_id, COUNT(*) as unread_count
			FROM messages
			WHERE receiver_id = $1 AND is_read = false
			GROUP BY sender_id
		)
		SELECT 
			rm.other_user_id, 
			u.name, 
			u.avatar_url, 
			rm.content, 
			rm.created_at,
			COALESCE(uc.unread_count, 0)
		FROM RankedMessages rm
		JOIN users u ON rm.other_user_id = u.id
		LEFT JOIN UnreadCounts uc ON rm.other_user_id = uc.other_user_id
		WHERE rm.rn = 1
		ORDER BY rm.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convos []Conversation
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(&c.OtherUserID, &c.OtherUserName, &c.OtherUserAvatar, &c.LastMessage, &c.LastMessageAt, &c.UnreadCount); err != nil {
			return nil, err
		}
		convos = append(convos, c)
	}
	return convos, nil
}
