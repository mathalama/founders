package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/model"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type ProjectHandler struct {
	repo *repository.ProjectRepo
}

func NewProjectHandler(repo *repository.ProjectRepo) *ProjectHandler {
	return &ProjectHandler{repo: repo}
}

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	stage := r.URL.Query().Get("stage")
	city := r.URL.Query().Get("city")
	role := r.URL.Query().Get("role")
	search := r.URL.Query().Get("search")
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10 // Default limit

	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	projects, err := h.repo.GetAll(r.Context(), category, stage, city, role, search, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if projects == nil {
		projects = []model.Project{} // Return [] instead of null
	}
	json.NewEncoder(w).Encode(projects)
}

func getOptionalUserID(r *http.Request) *string {
	cookie, err := r.Cookie("token")
	if err != nil || cookie.Value == "" {
		return nil
	}
	tokenString := cookie.Value

	secret := []byte(os.Getenv("JWT_SECRET"))
	if len(secret) == 0 {
		return nil
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil || !token.Valid {
		return nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return nil
	}
	return &userID
}

func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing project ID", http.StatusBadRequest)
		return
	}

	project, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if project == nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	// Record Project View (excluding owner)
	var viewerID *string
	optUID := getOptionalUserID(r)
	if optUID == nil || *optUID != project.OwnerID {
		viewerID = optUID
		_ = h.repo.RecordView(r.Context(), id, viewerID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	var p model.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	p.OwnerID = userID

	if err := h.repo.Create(r.Context(), &p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing project ID", http.StatusBadRequest)
		return
	}

	var p model.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	p.ID = id

	if err := h.repo.Update(r.Context(), &p, userID); err != nil {
		if err.Error() == "forbidden" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func (h *ProjectHandler) UpdateProjectStatus(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing project ID", http.StatusBadRequest)
		return
	}

	var payload struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateStatus(r.Context(), id, userID, payload.Status); err != nil {
		if err.Error() == "forbidden or not found" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *ProjectHandler) UpdateRoleStatus(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	roleID := chi.URLParam(r, "roleId")
	if roleID == "" {
		http.Error(w, "Missing role ID", http.StatusBadRequest)
		return
	}

	var payload struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateRoleStatus(r.Context(), roleID, userID, payload.Status); err != nil {
		if err.Error() == "forbidden or not found" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
