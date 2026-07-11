package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type AdminHandler struct {
	userRepo    *repository.UserRepo
	projectRepo *repository.ProjectRepo
}

func NewAdminHandler(userRepo *repository.UserRepo, projectRepo *repository.ProjectRepo) *AdminHandler {
	return &AdminHandler{
		userRepo:    userRepo,
		projectRepo: projectRepo,
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
