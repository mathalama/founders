package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/repository"
	"github.com/mathalama/nucla-backend/internal/service"
)

type DashboardHandler struct {
	repo      *repository.DashboardRepo
	notifRepo *repository.NotificationRepo
	pushSvc   *service.PushService
}

func NewDashboardHandler(repo *repository.DashboardRepo, notifRepo *repository.NotificationRepo, pushSvc *service.PushService) *DashboardHandler {
	return &DashboardHandler{repo: repo, notifRepo: notifRepo, pushSvc: pushSvc}
}

func (h *DashboardHandler) GetMyProjects(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	projects, err := h.repo.GetMyProjectsWithApplications(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if projects == nil {
		projects = []repository.DashboardProject{}
	}
	json.NewEncoder(w).Encode(projects)
}

func (h *DashboardHandler) UpdateRoleStatus(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	roleID := chi.URLParam(r, "roleId")

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateRoleStatus(r.Context(), userID, roleID, req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

func (h *DashboardHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	appID := chi.URLParam(r, "appId")

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	applicantID, projectID, projectTitle, err := h.repo.UpdateApplicationStatus(r.Context(), userID, appID, req.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Trigger In-App Notification
	statusRu := "принят"
	if req.Status == "rejected" {
		statusRu = "отклонен"
	}
	notifMsg := "Твой отклик на проект «" + projectTitle + "» был " + statusRu + "."
	notifLink := "/project/" + projectID
	h.notifRepo.Create(r.Context(), applicantID, "application_status", notifMsg, &notifLink)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}
