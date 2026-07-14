package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
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

func (h *UserHandler) BlockUser(w http.ResponseWriter, r *http.Request) {
	blockerID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || blockerID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	blockedID := chi.URLParam(r, "userId")

	if blockedID == "" {
		http.Error(w, "Missing user ID to block", http.StatusBadRequest)
		return
	}

	if blockerID == blockedID {
		http.Error(w, "You cannot block yourself", http.StatusBadRequest)
		return
	}

	err := h.userRepo.BlockUser(r.Context(), blockerID, blockedID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

func (h *UserHandler) UnblockUser(w http.ResponseWriter, r *http.Request) {
	blockerID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || blockerID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	blockedID := chi.URLParam(r, "userId")

	if blockedID == "" {
		http.Error(w, "Missing user ID to unblock", http.StatusBadRequest)
		return
	}

	err := h.userRepo.UnblockUser(r.Context(), blockerID, blockedID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

func (h *UserHandler) GetBlockedUsers(w http.ResponseWriter, r *http.Request) {
	blockerID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || blockerID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	users, err := h.userRepo.GetBlockedUsers(r.Context(), blockerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *UserHandler) GetBlockStatus(w http.ResponseWriter, r *http.Request) {
	blockerID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || blockerID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	blockedID := chi.URLParam(r, "userId")
	if blockedID == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		return
	}

	blockedByMe, err := h.userRepo.IsBlocked(r.Context(), blockerID, blockedID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	blockedByThem, err := h.userRepo.IsBlocked(r.Context(), blockedID, blockerID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{
		"blockedByMe":   blockedByMe,
		"blockedByThem": blockedByThem,
	})
}


