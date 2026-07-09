package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	mymiddleware "github.com/mathalama/founders-backend/internal/middleware"
	"github.com/mathalama/founders-backend/internal/handler"
	"github.com/mathalama/founders-backend/internal/repository"
	"github.com/mathalama/founders-backend/internal/service"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it, relying on system environment variables")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "postgres://founders:founders@localhost:5432/founders" // Default for local dev
	}

	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	// Init Repos
	userRepo := repository.NewUserRepo(pool)
	projectRepo := repository.NewProjectRepo(pool)
	appRepo := repository.NewApplicationRepo(pool)
	dashboardRepo := repository.NewDashboardRepo(pool)
	bookmarkRepo := repository.NewBookmarkRepo(pool)
	
	// Init Services
	emailSvc := service.NewEmailService()

	// Init Handlers
	authHandler := handler.NewAuthHandler(userRepo)
	projectHandler := handler.NewProjectHandler(projectRepo)
	profileHandler := handler.NewProfileHandler(userRepo)
	applicationHandler := handler.NewApplicationHandler(appRepo, userRepo, emailSvc)
	dashboardHandler := handler.NewDashboardHandler(dashboardRepo)
	bookmarkHandler := handler.NewBookmarkHandler(bookmarkRepo)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:8080", "http://localhost"}
	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Auth routes
	r.Get("/api/auth/google/login", authHandler.GoogleLogin)
	r.Get("/api/auth/google/callback", authHandler.GoogleCallback)
	
	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(mymiddleware.RequireAuth)
		r.Get("/api/auth/me", authHandler.Me)
		r.Post("/api/projects", projectHandler.CreateProject)
		r.Put("/api/projects/{id}", projectHandler.UpdateProject)
		r.Put("/api/profile", profileHandler.UpdateProfile)
		r.Post("/api/projects/{id}/roles/{roleId}/apply", applicationHandler.ApplyToRole)
		
		r.Get("/api/dashboard/projects", dashboardHandler.GetMyProjects)
		r.Put("/api/dashboard/roles/{roleId}/status", dashboardHandler.UpdateRoleStatus)
		r.Put("/api/dashboard/applications/{appId}/status", dashboardHandler.UpdateApplicationStatus)
		r.Get("/api/applications/my", applicationHandler.GetMyApplications)
		
		r.Get("/api/bookmarks", bookmarkHandler.GetMyBookmarks)
		r.Post("/api/projects/{id}/bookmark", bookmarkHandler.ToggleBookmark)
	})

	// Public routes
	r.Get("/api/projects", projectHandler.ListProjects)
	r.Get("/api/projects/{id}", projectHandler.GetProject)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
