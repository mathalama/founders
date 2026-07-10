package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type MessageHandler struct {
	repo *repository.MessageRepo
}

func NewMessageHandler(repo *repository.MessageRepo) *MessageHandler {
	return &MessageHandler{repo: repo}
}

func (h *MessageHandler) GetConversations(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	convos, err := h.repo.GetConversations(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if convos == nil {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	json.NewEncoder(w).Encode(convos)
}

func (h *MessageHandler) GetChatHistory(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	otherUserID := chi.URLParam(r, "userId")

	if otherUserID == "" {
		http.Error(w, "Missing other user ID", http.StatusBadRequest)
		return
	}

	messages, err := h.repo.GetChatHistory(r.Context(), userID, otherUserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if messages == nil {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}
	json.NewEncoder(w).Encode(messages)
}

type SendMessageRequest struct {
	Content string `json:"content"`
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	otherUserID := chi.URLParam(r, "userId")

	if otherUserID == "" {
		http.Error(w, "Missing other user ID", http.StatusBadRequest)
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "Message content cannot be empty", http.StatusBadRequest)
		return
	}

	msg, err := h.repo.SendMessage(r.Context(), userID, otherUserID, req.Content)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(msg)
}
