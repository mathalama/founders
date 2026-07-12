package middleware

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string
const UserIDKey contextKey = "user_id"
const IsAdminKey contextKey = "is_admin"

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil || cookie.Value == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenString := cookie.Value

		secret := []byte(os.Getenv("JWT_SECRET"))
		if len(secret) == 0 {
			log.Fatal("Missing required environment variable: JWT_SECRET")
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return secret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["user_id"].(string)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)

		isAdmin := false
		if adminClaim, ok := claims["is_admin"].(bool); ok {
			isAdmin = adminClaim
		}
		ctx = context.WithValue(ctx, IsAdminKey, isAdmin)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		isAdmin, ok := r.Context().Value(IsAdminKey).(bool)
		if !ok || !isAdmin {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
