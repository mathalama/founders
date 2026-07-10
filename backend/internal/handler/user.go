package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type UserHandler struct {
	userRepo    *repository.UserRepo
	projectRepo *repository.ProjectRepo
}

func NewUserHandler(userRepo *repository.UserRepo, projectRepo *repository.ProjectRepo) *UserHandler {
	return &UserHandler{userRepo: userRepo, projectRepo: projectRepo}
}

type UserProfileResponse struct {
	*model.User
	Projects []model.Project `json:"projects"`
}

func (h *UserHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	projects, err := h.projectRepo.GetPublicProjectsByOwner(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if projects == nil {
		projects = []model.Project{}
	}

	resp := UserProfileResponse{
		User:     user,
		Projects: projects,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
