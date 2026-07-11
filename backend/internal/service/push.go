package service

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/mathalama/nucla-backend/internal/repository"
)

type PushService struct {
	notifRepo *repository.NotificationRepo
}

func NewPushService(notifRepo *repository.NotificationRepo) *PushService {
	return &PushService{notifRepo: notifRepo}
}

func (s *PushService) SendPush(ctx context.Context, userID string, payload interface{}) {
	subs, err := s.notifRepo.GetPushSubscriptions(ctx, userID)
	if err != nil || len(subs) == 0 {
		return
	}

	b, err := json.Marshal(payload)
	if err != nil {
		return
	}

	vapidPublicKey := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")
	if vapidPublicKey == "" || vapidPrivateKey == "" {
		log.Println("Missing VAPID keys, skipping push notification")
		return
	}

	for _, sub := range subs {
		// Send Notification
		_, err := webpush.SendNotification(b, &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.P256dh,
				Auth:   sub.Auth,
			},
		}, &webpush.Options{
			Subscriber:      os.Getenv("ADMIN_EMAILS"),
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             30,
		})

		if err != nil {
			log.Printf("Failed to send push to user %s: %v", userID, err)
			// optionally remove dead subscriptions
		}
	}
}
