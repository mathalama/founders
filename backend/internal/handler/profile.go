package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type ProfileHandler struct {
	userRepo *repository.UserRepo
}

func NewProfileHandler(userRepo *repository.UserRepo) *ProfileHandler {
	return &ProfileHandler{userRepo: userRepo}
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	var req model.User
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.ID = userID

	if err := h.userRepo.UpdateProfile(r.Context(), &req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
