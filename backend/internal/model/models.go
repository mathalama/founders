package model

import (
	"time"
)

type User struct {
	ID         string    `json:"id"`
	GoogleID   string    `json:"-"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	AvatarURL  *string   `json:"avatarUrl,omitempty"`
	RoleTitle  *string   `json:"roleTitle,omitempty"`
	Skills     []string  `json:"skills,omitempty"`
	Experience         *string   `json:"experience,omitempty"`
	EmailNotifications *bool     `json:"emailNotifications,omitempty"`
	Github             *string   `json:"github,omitempty"`
	Telegram   *string   `json:"telegram,omitempty"`
	Bio        *string   `json:"bio,omitempty"`
	IsAdmin    bool      `json:"isAdmin"`
	CreatedAt  time.Time `json:"createdAt"`
}

type AdminUserDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	RoleTitle *string   `json:"roleTitle,omitempty"`
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
}

type Project struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"ownerId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Stage       string    `json:"stage"`
	City        string    `json:"city"`
	Website     *string   `json:"website,omitempty"`
	Github      *string   `json:"github,omitempty"`
	Telegram    string    `json:"telegram"`
	CreatedAt   time.Time `json:"createdAt"`
	Owner       *User     `json:"owner,omitempty"`
	Team        []TeamMember `json:"team,omitempty"`
	Roles       []OpenRole   `json:"roles,omitempty"`
	Roadmap     []RoadmapItem `json:"roadmap,omitempty"`
}

type TeamMember struct {
	ID        string  `json:"id"`
	ProjectID string  `json:"projectId"`
	UserID    *string `json:"userId,omitempty"`
	Name      string  `json:"name"`
	Role      string  `json:"role"`
}

type OpenRole struct {
	ID        string `json:"id"`
	ProjectID string `json:"project_id"`
	Title     string `json:"title"`
	Skills    string `json:"skills"`
	Slots     int    `json:"slots"`
	Status    string `json:"status"`
}

type RoadmapItem struct {
	ID        string `json:"id"`
	ProjectID string `json:"projectId"`
	Title     string `json:"title"`
	Done      bool   `json:"done"`
	SortOrder int    `json:"sortOrder"`
}

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Link      *string   `json:"link,omitempty"`
	IsRead    bool      `json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}

type Message struct {
	ID         string    `json:"id"`
	SenderID   string    `json:"senderId"`
	ReceiverID string    `json:"receiverId"`
	Content    string    `json:"content"`
	IsRead     bool      `json:"isRead"`
	CreatedAt  time.Time `json:"createdAt"`
}
