package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireAdmin(t *testing.T) {
	// Dummy handler that just returns 200 OK
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handlerToTest := RequireAdmin(nextHandler)

	t.Run("User is not admin", func(t *testing.T) {
		req := httptest.NewRequest("GET", "http://example.com/foo", nil)
		// Mock the context as if RequireAuth had run but user is not admin
		ctx := context.WithValue(req.Context(), IsAdminKey, false)
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()
		handlerToTest.ServeHTTP(w, req)

		if w.Result().StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden, got %d", w.Result().StatusCode)
		}
	})

	t.Run("User is admin", func(t *testing.T) {
		req := httptest.NewRequest("GET", "http://example.com/foo", nil)
		// Mock the context as if RequireAuth had run and user is admin
		ctx := context.WithValue(req.Context(), IsAdminKey, true)
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()
		handlerToTest.ServeHTTP(w, req)

		if w.Result().StatusCode != http.StatusOK {
			t.Errorf("Expected 200 OK, got %d", w.Result().StatusCode)
		}
	})

	t.Run("Context has no admin key", func(t *testing.T) {
		req := httptest.NewRequest("GET", "http://example.com/foo", nil)
		// No context set

		w := httptest.NewRecorder()
		handlerToTest.ServeHTTP(w, req)

		if w.Result().StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden, got %d", w.Result().StatusCode)
		}
	})
}
