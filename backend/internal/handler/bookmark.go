package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type BookmarkHandler struct {
	repo *repository.BookmarkRepo
}

func NewBookmarkHandler(repo *repository.BookmarkRepo) *BookmarkHandler {
	return &BookmarkHandler{repo: repo}
}

func (h *BookmarkHandler) ToggleBookmark(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	projectID := chi.URLParam(r, "id")

	added, err := h.repo.ToggleBookmark(r.Context(), userID, projectID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"bookmarked": added})
}

func (h *BookmarkHandler) GetMyBookmarks(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	projects, err := h.repo.GetMyBookmarks(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if projects == nil {
		projects = []model.Project{}
	}
	json.NewEncoder(w).Encode(projects)
}
