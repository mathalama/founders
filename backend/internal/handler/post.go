package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type PostHandler struct {
	repo *repository.PostRepo
}

func NewPostHandler(repo *repository.PostRepo) *PostHandler {
	return &PostHandler{repo: repo}
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var p model.Post
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if p.Content == "" {
		http.Error(w, "Content cannot be empty", http.StatusBadRequest)
		return
	}

	p.UserID = userID

	if err := h.repo.Create(r.Context(), &p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (h *PostHandler) ListThreads(w http.ResponseWriter, r *http.Request) {
	posts, err := h.repo.GetThreads(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if posts == nil {
		posts = []model.Post{}
	}
	json.NewEncoder(w).Encode(posts)
}

type ThreadDetailsResponse struct {
	*model.Post
	Replies []model.Post `json:"replies"`
}

func (h *PostHandler) GetThreadDetails(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing thread ID", http.StatusBadRequest)
		return
	}

	post, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if post == nil {
		http.Error(w, "Thread not found", http.StatusNotFound)
		return
	}

	replies, err := h.repo.GetReplies(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if replies == nil {
		replies = []model.Post{}
	}

	resp := ThreadDetailsResponse{
		Post:    post,
		Replies: replies,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
