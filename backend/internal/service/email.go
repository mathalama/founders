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

	if host == "" || portStr == "" || user == "" || pass == "" || from == "" {
		log.Fatal("Missing required SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)")
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		log.Fatalf("Invalid SMTP_PORT: %v", err)
	}

	d := gomail.NewDialer(host, port, user, pass)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: false, ServerName: host}

	return &EmailService{
		dialer: d,
		from:   from,
	}
}

func (s *EmailService) SendApplicationNotification(toEmail, projectName, roleName, applicantName, message string) {
	go func() {
		m := gomail.NewMessage()
		m.SetHeader("From", s.from)
		m.SetHeader("To", toEmail)
		m.SetHeader("Subject", fmt.Sprintf("Новый отклик на Nucla: %s", projectName))
		
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
		}
	}()
}

func (s *EmailService) SendNewsletterEmail(toEmail, subject, bodyContent string) {
	go func() {
		m := gomail.NewMessage()
		m.SetHeader("From", s.from)
		m.SetHeader("To", toEmail)
		m.SetHeader("Subject", subject)

		// Since we expect HTML body from the admin
		m.SetBody("text/html", bodyContent)

		if err := s.dialer.DialAndSend(m); err != nil {
			log.Printf("Failed to send newsletter email to %s: %v", toEmail, err)
		}
	}()
}
