package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/repository"
	"github.com/mathalama/nucla-backend/internal/service"
)

type ApplicationHandler struct {
	appRepo   *repository.ApplicationRepo
	userRepo  *repository.UserRepo
	emailSvc  *service.EmailService
	notifRepo *repository.NotificationRepo
	pushSvc   *service.PushService
}

func NewApplicationHandler(appRepo *repository.ApplicationRepo, userRepo *repository.UserRepo, emailSvc *service.EmailService, notifRepo *repository.NotificationRepo, pushSvc *service.PushService) *ApplicationHandler {
	return &ApplicationHandler{
		appRepo:   appRepo,
		userRepo:  userRepo,
		emailSvc:  emailSvc,
		notifRepo: notifRepo,
		pushSvc:   pushSvc,
	}
}

type ApplyRequest struct {
	Message string `json:"message"`
}

func (h *ApplicationHandler) ApplyToRole(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	roleID := chi.URLParam(r, "roleId")

	var req ApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.appRepo.CreateApplication(r.Context(), roleID, userID, req.Message); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch details for email notification
	roleTitle, projectName, ownerEmail, _, ownerID, _, err := h.appRepo.GetRoleDetails(r.Context(), roleID)
	if err != nil {
		http.Error(w, "Failed to get role details for notification", http.StatusInternalServerError)
		return
	}

	applicant, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil || applicant == nil {
		http.Error(w, "Failed to get applicant details", http.StatusInternalServerError)
		return
	}

	// Send email in background if owner has email notifications enabled
	if owner, _ := h.userRepo.GetByID(r.Context(), ownerID); owner != nil && (owner.EmailNotifications == nil || *owner.EmailNotifications) {
		h.emailSvc.SendApplicationNotification(ownerEmail, projectName, roleTitle, applicant.Name, req.Message)
	}

	// Create In-App Notification for Project Owner
	notifMsg := "Новый отклик от " + applicant.Name + " на роль: " + roleTitle + " (Проект: " + projectName + ")"
	notifLink := "/dashboard"
	h.notifRepo.Create(r.Context(), ownerID, "new_application", notifMsg, &notifLink)

	// Trigger Push Notification
	go h.pushSvc.SendPush(context.Background(), ownerID, map[string]interface{}{
		"title": "Новый отклик!",
		"body":  notifMsg,
		"url":   notifLink,
	})

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"status":"success"}`))
}

func (h *ApplicationHandler) GetMyApplications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	apps, err := h.appRepo.GetMyApplications(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if apps == nil {
		apps = []repository.UserApplication{}
	}
	json.NewEncoder(w).Encode(apps)
}
