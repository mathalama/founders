package handler

import (
	"encoding/json"
	"fmt"
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
	postRepo    *repository.PostRepo
	auditRepo   *repository.AuditLogRepo
	emailSvc    *service.EmailService
}

func NewAdminHandler(userRepo *repository.UserRepo, projectRepo *repository.ProjectRepo, postRepo *repository.PostRepo, auditRepo *repository.AuditLogRepo, emailSvc *service.EmailService) *AdminHandler {
	return &AdminHandler{
		userRepo:    userRepo,
		projectRepo: projectRepo,
		postRepo:    postRepo,
		auditRepo:   auditRepo,
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
	
	log.Printf("[AUDIT] Admin user_id=%s initiated deletion of project_id=%s", adminID, projectID)

	p, _ := h.projectRepo.GetByID(r.Context(), projectID)
	var details string
	if p != nil {
		details = fmt.Sprintf("Deleted project: %s (owner: %s)", p.Title, p.OwnerID)
	} else {
		details = "Deleted project: " + projectID
	}
	
	err := h.projectRepo.Delete(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	_ = h.auditRepo.Create(r.Context(), &adminID, "delete_project", "project", projectID, details)
	
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
	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")

	u, _ := h.userRepo.GetByID(r.Context(), id)
	var details, action string
	if u != nil {
		action = "ban_user"
		details = "Banned user: " + u.Name + " (" + u.Email + ")"
		if u.IsBanned {
			action = "unban_user"
			details = "Unbanned user: " + u.Name + " (" + u.Email + ")"
		}
	} else {
		action = "toggle_ban"
		details = "Toggled user ban state: " + id
	}

	if err := h.userRepo.ToggleBan(r.Context(), id); err != nil {
		http.Error(w, "Failed to toggle ban", http.StatusInternalServerError)
		return
	}

	_ = h.auditRepo.Create(r.Context(), &adminID, action, "user", id, details)

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) ToggleAdmin(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")

	u, _ := h.userRepo.GetByID(r.Context(), id)
	var details, action string
	if u != nil {
		action = "make_admin"
		details = "Granted admin access to user: " + u.Name + " (" + u.Email + ")"
		if u.IsAdmin {
			action = "remove_admin"
			details = "Revoked admin access from user: " + u.Name + " (" + u.Email + ")"
		}
	} else {
		action = "toggle_admin"
		details = "Toggled user admin status: " + id
	}

	if err := h.userRepo.ToggleAdmin(r.Context(), id); err != nil {
		http.Error(w, "Failed to toggle admin", http.StatusInternalServerError)
		return
	}

	_ = h.auditRepo.Create(r.Context(), &adminID, action, "user", id, details)

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) ToggleHideProject(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")

	p, _ := h.projectRepo.GetByID(r.Context(), id)
	var details, action string
	if p != nil {
		action = "hide_project"
		details = "Hid project from feed: " + p.Title
		if p.IsHidden {
			action = "show_project"
			details = "Showed project in feed: " + p.Title
		}
	} else {
		action = "toggle_hide_project"
		details = "Toggled project hidden status: " + id
	}

	if err := h.projectRepo.ToggleHide(r.Context(), id); err != nil {
		http.Error(w, "Failed to toggle hide", http.StatusInternalServerError)
		return
	}

	_ = h.auditRepo.Create(r.Context(), &adminID, action, "project", id, details)

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	id := chi.URLParam(r, "id")
	
	log.Printf("[AUDIT] Admin user_id=%s initiated deletion of user_id=%s", adminID, id)

	u, _ := h.userRepo.GetByID(r.Context(), id)
	var details string
	if u != nil {
		details = "Deleted user: " + u.Name + " (" + u.Email + ")"
	} else {
		details = "Deleted user: " + id
	}

	if err := h.userRepo.Delete(r.Context(), id); err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	_ = h.auditRepo.Create(r.Context(), &adminID, "delete_user", "user", id, details)

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
			h.emailSvc.SendNewsletterEmail(u.Email, req.Subject, req.Body)
			count++
		}
	}

	adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
	log.Printf("[AUDIT] Admin user_id=%s started sending newsletter to %d users. Subject: %s", adminID, count, req.Subject)

	_ = h.auditRepo.Create(r.Context(), &adminID, "send_newsletter", "newsletter", "global", fmt.Sprintf("Sent newsletter to %d users. Subject: %s", count, req.Subject))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"sentCount": count})
}

func (h *AdminHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.postRepo.GetAllAdmin(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *AdminHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	adminID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		adminID = "unknown"
	}
	
	postID := chi.URLParam(r, "id")
	
	log.Printf("[AUDIT] Admin user_id=%s initiated deletion of post_id=%s", adminID, postID)

	post, _ := h.postRepo.GetByID(r.Context(), postID)
	var details string
	if post != nil {
		details = fmt.Sprintf("Deleted post by user_id=%s. Content: %s", post.UserID, post.Content)
	} else {
		details = "Deleted post: " + postID
	}
	
	err := h.postRepo.Delete(r.Context(), postID)
	if err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	_ = h.auditRepo.Create(r.Context(), &adminID, "delete_post", "post", postID, details)
	
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := h.auditRepo.GetAll(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch audit logs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
