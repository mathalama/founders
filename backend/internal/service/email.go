package service

import (
	"crypto/tls"
	"fmt"
	"log"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

type EmailService struct {
	dialer *gomail.Dialer
	from   string
}

func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" {
		host = "smtp.mathalama.dev"
	}
	port := 465
	if portStr != "" {
		port, _ = strconv.Atoi(portStr)
	}
	if from == "" {
		from = "no-reply@mathalama.dev"
	}

	d := gomail.NewDialer(host, port, user, pass)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: false, ServerName: host}

	return &EmailService{
		dialer: d,
		from:   from,
	}
}

func (s *EmailService) SendApplicationNotification(toEmail, projectName, roleName, applicantName, message string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.from)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", fmt.Sprintf("Новый отклик на Qoldau: %s", projectName))
	
	body := fmt.Sprintf(`
		<h2>У вас новый отклик!</h2>
		<p><strong>Проект:</strong> %s</p>
		<p><strong>Роль:</strong> %s</p>
		<p><strong>От кого:</strong> %s</p>
		<hr>
		<p>%s</p>
	`, projectName, roleName, applicantName, message)

	m.SetBody("text/html", body)

	if err := s.dialer.DialAndSend(m); err != nil {
		log.Printf("Failed to send email to %s: %v", toEmail, err)
		return err
	}
	return nil
}
