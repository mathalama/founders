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
	*model.PublicUserDTO
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
		PublicUserDTO: &model.PublicUserDTO{
			ID:           user.ID,
			Name:         user.Name,
			AvatarURL:    user.AvatarURL,
			RoleTitle:    user.RoleTitle,
			Skills:       user.Skills,
			Experience:   user.Experience,
			Github:       user.Github,
			Telegram:     user.Telegram,
			Bio:          user.Bio,
			CreatedAt:    user.CreatedAt,
			OpenToOffers: user.OpenToOffers,
		},
		Projects: projects,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *UserHandler) GetDirectoryUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.GetDirectoryUsers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dtos := make([]model.PublicUserDTO, 0, len(users))
	for _, u := range users {
		dtos = append(dtos, model.PublicUserDTO{
			ID:           u.ID,
			Name:         u.Name,
			AvatarURL:    u.AvatarURL,
			RoleTitle:    u.RoleTitle,
			Skills:       u.Skills,
			Experience:   u.Experience,
			Github:       u.Github,
			Telegram:     u.Telegram,
			Bio:          u.Bio,
			CreatedAt:    u.CreatedAt,
			OpenToOffers: u.OpenToOffers,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dtos)
}

