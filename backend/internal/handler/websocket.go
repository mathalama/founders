package handler

import (
	"log"
	"net/http"
	"sync"

	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now
	},
}

// Hub manages active WebSocket connections
type Hub struct {
	sync.RWMutex
	// clients maps user_id to a slice of websocket connections
	clients map[string][]*websocket.Conn
}

// WSHub is the global hub for the server
var WSHub = &Hub{
	clients: make(map[string][]*websocket.Conn),
}

// AddClient registers a new connection for a user
func (h *Hub) AddClient(userID string, conn *websocket.Conn) {
	h.Lock()
	defer h.Unlock()
	h.clients[userID] = append(h.clients[userID], conn)
}

// RemoveClient removes a connection for a user
func (h *Hub) RemoveClient(userID string, conn *websocket.Conn) {
	h.Lock()
	defer h.Unlock()
	conns := h.clients[userID]
	for i, c := range conns {
		if c == conn {
			h.clients[userID] = append(conns[:i], conns[i+1:]...)
			break
		}
	}
	if len(h.clients[userID]) == 0 {
		delete(h.clients, userID)
	}
}

// BroadcastToUser sends a JSON message to all active connections of a user
func (h *Hub) BroadcastToUser(userID string, message interface{}) {
	h.RLock()
	defer h.RUnlock()
	conns := h.clients[userID]
	for _, conn := range conns {
		err := conn.WriteJSON(message)
		if err != nil {
			log.Printf("WS write error for user %s: %v", userID, err)
			conn.Close()
		}
	}
}

// WSConnect upgrades the HTTP connection to a WebSocket
func WSConnect(w http.ResponseWriter, r *http.Request) {
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "token required", http.StatusUnauthorized)
		return
	}

	secret := []byte(os.Getenv("JWT_SECRET"))
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

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WS upgrade error: %v", err)
		return
	}

	WSHub.AddClient(userID, conn)
	defer func() {
		WSHub.RemoveClient(userID, conn)
		conn.Close()
	}()

	// Keep the connection alive and listen for "isTyping" events
	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WS read error: %v", err)
			}
			break
		}

		// Handle incoming messages from WS (like typing indicator)
		if action, ok := msg["action"].(string); ok && action == "typing" {
			if receiverID, ok := msg["receiverId"].(string); ok {
				// Broadcast typing indicator to the receiver
				WSHub.BroadcastToUser(receiverID, map[string]interface{}{
					"type":     "typing",
					"senderId": userID,
				})
			}
		}
	}
}
