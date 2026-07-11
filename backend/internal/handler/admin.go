package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
	"github.com/mathalama/nucla-backend/internal/service"
)

type AdminHandler struct {
	userRepo    *repository.UserRepo
	projectRepo *repository.ProjectRepo
	emailSvc    *service.EmailService
}

func NewAdminHandler(userRepo *repository.UserRepo, projectRepo *repository.ProjectRepo, emailSvc *service.EmailService) *AdminHandler {
	return &AdminHandler{
		userRepo:    userRepo,
		projectRepo: projectRepo,
		emailSvc:    emailSvc,
	}
}

func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	var dtos []model.AdminUserDTO
	for _, u := range users {
		dtos = append(dtos, model.AdminUserDTO{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			RoleTitle: u.RoleTitle,
			IsAdmin:   u.IsAdmin,
			IsBanned:  u.IsBanned,
			CreatedAt: u.CreatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dtos)
}

func (h *AdminHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	adminID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		adminID = "unknown"
	}
	
	projectID := chi.URLParam(r, "id")
	
	// Audit log for destructive action
	log.Printf("[AUDIT] Admin user_id=%s initiated deletion of project_id=%s", adminID, projectID)
	
	err := h.projectRepo.Delete(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) GetProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projectRepo.GetAllAdmin(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch projects", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func (h *AdminHandler) ToggleBanUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.userRepo.ToggleBan(r.Context(), id); err != nil {
		http.Error(w, "Failed to toggle ban", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) ToggleAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.userRepo.ToggleAdmin(r.Context(), id); err != nil {
		http.Error(w, "Failed to toggle admin", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) ToggleHideProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.projectRepo.ToggleHide(r.Context(), id); err != nil {
		http.Error(w, "Failed to toggle hide", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")
	
	log.Printf("[AUDIT] Admin user_id=%s initiated deletion of user_id=%s", adminID, id)
	
	if err := h.userRepo.Delete(r.Context(), id); err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.userRepo.GetAdminStats(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch stats", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *AdminHandler) SendNewsletter(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Subject string `json:"subject"`
		Body    string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	users, err := h.userRepo.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	count := 0
	for _, u := range users {
		if u.Email != "" && !u.IsBanned {
			// Actually send email
			err := h.emailSvc.SendNewsletterEmail(u.Email, req.Subject, req.Body)
			if err == nil {
				count++
			} else {
				log.Printf("[NEWSLETTER ERROR] Failed sending to %s: %v", u.Email, err)
			}
		}
	}

	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	log.Printf("[AUDIT] Admin user_id=%s sent newsletter to %d users. Subject: %s", adminID, count, req.Subject)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"sentCount": count})
}
