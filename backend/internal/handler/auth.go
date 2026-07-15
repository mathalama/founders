package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/mathalama/nucla-backend/internal/middleware"
	"github.com/mathalama/nucla-backend/internal/repository"
	"github.com/mathalama/nucla-backend/internal/service"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthHandler struct {
	userRepo    *repository.UserRepo
	emailSvc    *service.EmailService
	oauthConfig *oauth2.Config
}

func NewAuthHandler(userRepo *repository.UserRepo, emailSvc *service.EmailService) *AuthHandler {
	conf := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  getRedirectURL(),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &AuthHandler{
		userRepo:    userRepo,
		emailSvc:    emailSvc,
		oauthConfig: conf,
	}
}

func getRedirectURL() string {
	domain := os.Getenv("BACKEND_DOMAIN")
	if domain == "" {
		log.Fatal("Missing required environment variable: BACKEND_DOMAIN")
	}
	return "https://" + domain + "/api/auth/google/callback"
}
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	// Typically you'd generate a random state string and store it in a cookie to prevent CSRF
	state := "random-state-string"
	url := h.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	if state != "random-state-string" {
		http.Error(w, "Invalid state", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	token, err := h.oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
		return
	}

	client := h.oauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		http.Error(w, "Failed to decode user info", http.StatusInternalServerError)
		return
	}

	adminEmailsEnv := os.Getenv("ADMIN_EMAILS")
	isAdmin := false
	if adminEmailsEnv != "" {
		emails := strings.Split(adminEmailsEnv, ",")
		for _, e := range emails {
			if strings.TrimSpace(e) == userInfo.Email {
				isAdmin = true
				break
			}
		}
	}

	user, err := h.userRepo.UpsertByGoogleID(r.Context(), userInfo.ID, userInfo.Name, userInfo.Email, isAdmin)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if user.IsBanned {
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
		}
		http.Redirect(w, r, fmt.Sprintf("%s/login?error=banned", frontendURL), http.StatusTemporaryRedirect)
		return
	}

	secret := []byte(os.Getenv("JWT_SECRET"))
	if len(secret) == 0 {
		log.Fatal("Missing required environment variable: JWT_SECRET")
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"is_admin": user.IsAdmin,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := jwtToken.SignedString(secret)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Set HttpOnly Cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    tokenString,
		Path:     "/",
		MaxAge:   int(72 * time.Hour / time.Second),
		HttpOnly: true,
		Secure:   true, // Requires HTTPS, Caddy provides this
		SameSite: http.SameSiteLaxMode,
	})

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		log.Fatal("Missing required environment variable: FRONTEND_URL")
	}
	http.Redirect(w, r, fmt.Sprintf("%s/", frontendURL), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	
	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	if user.IsBanned {
		http.Error(w, "Your account has been banned by an administrator.", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	if req.Email == "" || req.Name == "" || len(req.Password) < 6 {
		http.Error(w, "Имя, почта и пароль (мин. 6 символов) обязательны", http.StatusBadRequest)
		return
	}

	// Check if user already exists
	existingUser, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if existingUser != nil {
		http.Error(w, "Пользователь с такой почтой уже существует", http.StatusConflict)
		return
	}

	// Hash password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	passwordHash := string(hashedBytes)

	// Generate 6-digit verification PIN
	pin, err := generatePIN()
	if err != nil {
		http.Error(w, "Failed to generate PIN", http.StatusInternalServerError)
		return
	}
	pinExpires := time.Now().Add(15 * time.Minute)

	// Create user
	_, err = h.userRepo.CreateLocalUser(r.Context(), req.Name, req.Email, passwordHash, pin, pinExpires)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Send verification email
	h.emailSvc.SendVerificationPIN(req.Email, pin)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "PIN sent to email. Please verify.",
	})
}

func (h *AuthHandler) VerifyPIN(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
		PIN   string `json:"pin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.PIN = strings.TrimSpace(req.PIN)

	if req.Email == "" || req.PIN == "" {
		http.Error(w, "Email and PIN code are required", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "Пользователь не найден", http.StatusNotFound)
		return
	}

	if user.IsEmailVerified {
		http.Error(w, "Почта уже подтверждена", http.StatusBadRequest)
		return
	}

	if user.EmailVerificationPin == nil || *user.EmailVerificationPin != req.PIN {
		http.Error(w, "Неверный PIN-код", http.StatusBadRequest)
		return
	}

	if user.EmailVerificationExpires == nil || user.EmailVerificationExpires.Before(time.Now()) {
		http.Error(w, "Срок действия PIN-кода истек. Пожалуйста, запросите новый.", http.StatusBadRequest)
		return
	}

	// Verify email
	err = h.userRepo.VerifyEmail(r.Context(), user.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set login session cookie
	h.setAuthCookie(w, user.ID, user.IsAdmin)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "Неверная почта или пароль", http.StatusUnauthorized)
		return
	}

	if user.PasswordHash == nil || *user.PasswordHash == "" {
		http.Error(w, "Этот аккаунт зарегистрирован через Google. Войдите через Google.", http.StatusBadRequest)
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Неверная почта или пароль", http.StatusUnauthorized)
		return
	}

	if !user.IsEmailVerified {
		http.Error(w, "Пожалуйста, подтвердите вашу почту перед входом.", http.StatusForbidden)
		return
	}

	if user.IsBanned {
		http.Error(w, "Ваш аккаунт заблокирован администратором.", http.StatusForbidden)
		return
	}

	// Set login session cookie
	h.setAuthCookie(w, user.ID, user.IsAdmin)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) ResendPIN(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if user.IsEmailVerified {
		http.Error(w, "Email is already verified", http.StatusBadRequest)
		return
	}

	pin, err := generatePIN()
	if err != nil {
		http.Error(w, "Failed to generate PIN", http.StatusInternalServerError)
		return
	}
	pinExpires := time.Now().Add(15 * time.Minute)

	err = h.userRepo.UpdateVerificationPIN(r.Context(), user.Email, pin, pinExpires)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.emailSvc.SendVerificationPIN(user.Email, pin)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Новый PIN-код отправлен на вашу почту.",
	})
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Если пользователь существует, ссылка для восстановления отправлена на почту.",
		})
		return
	}

	if user.PasswordHash == nil || *user.PasswordHash == "" {
		http.Error(w, "Этот аккаунт зарегистрирован через Google. Используйте вход через Google.", http.StatusBadRequest)
		return
	}

	// Generate secure token
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	token := hex.EncodeToString(b)
	expires := time.Now().Add(1 * time.Hour)

	err = h.userRepo.UpdateResetToken(r.Context(), user.Email, token, expires)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s&email=%s", frontendURL, token, user.Email)

	h.emailSvc.SendPasswordResetLink(user.Email, resetLink)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Ссылка для сброса пароля отправлена на вашу почту.",
	})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email       string `json:"email"`
		Token       string `json:"token"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Token = strings.TrimSpace(req.Token)

	if req.Email == "" || req.Token == "" || len(req.NewPassword) < 6 {
		http.Error(w, "Email, token, and new password (min 6 characters) are required", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if user.ResetToken == nil || *user.ResetToken != req.Token {
		http.Error(w, "Неверный или недействительный токен восстановления", http.StatusBadRequest)
		return
	}

	if user.ResetTokenExpires == nil || user.ResetTokenExpires.Before(time.Now()) {
		http.Error(w, "Срок действия ссылки восстановления истек. Запросите новую.", http.StatusBadRequest)
		return
	}

	// Hash new password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	newPasswordHash := string(hashedBytes)

	// Save new password
	err = h.userRepo.ResetPassword(r.Context(), user.Email, newPasswordHash)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Пароль успешно изменен.",
	})
}

func (h *AuthHandler) setAuthCookie(w http.ResponseWriter, userID string, isAdmin bool) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	if len(secret) == 0 {
		log.Fatal("Missing required environment variable: JWT_SECRET")
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  userID,
		"is_admin": isAdmin,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := jwtToken.SignedString(secret)
	if err != nil {
		log.Printf("Error signing JWT: %v", err)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    tokenString,
		Path:     "/",
		MaxAge:   int(72 * time.Hour / time.Second),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func generatePIN() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}
