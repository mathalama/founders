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

func (s *EmailService) SendVerificationPIN(toEmail, pin string) {
	go func() {
		m := gomail.NewMessage()
		m.SetHeader("From", s.from)
		m.SetHeader("To", toEmail)
		m.SetHeader("Subject", "Nucla: Код верификации почты")
		
		body := fmt.Sprintf(`
			<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
				<h2 style="color: #0f172a; margin-bottom: 10px;">Добро пожаловать в Nucla!</h2>
				<p style="color: #64748b; font-size: 16px; line-height: 1.5;">Для подтверждения вашего адреса электронной почты введите следующий PIN-код:</p>
				<div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
					<span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #6366f1;">%s</span>
				</div>
				<p style="color: #94a3b8; font-size: 12px;">Код действителен в течение 15 минут.</p>
			</div>
		`, pin)

		m.SetBody("text/html", body)

		if err := s.dialer.DialAndSend(m); err != nil {
			log.Printf("Failed to send verification email to %s: %v", toEmail, err)
		}
	}()
}

func (s *EmailService) SendPasswordResetLink(toEmail, resetLink string) {
	go func() {
		m := gomail.NewMessage()
		m.SetHeader("From", s.from)
		m.SetHeader("To", toEmail)
		m.SetHeader("Subject", "Nucla: Сброс пароля")
		
		body := fmt.Sprintf(`
			<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
				<h2 style="color: #0f172a; margin-bottom: 10px;">Сброс пароля</h2>
				<p style="color: #64748b; font-size: 16px; line-height: 1.5;">Вы получили это письмо, потому что запросили сброс пароля для вашей учетной записи.</p>
				<p style="color: #64748b; font-size: 16px; line-height: 1.5;">Для установки нового пароля нажмите на кнопку ниже:</p>
				<div style="text-align: center; margin: 25px 0;">
					<a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">Сбросить пароль</a>
				</div>
				<p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это сообщение.</p>
			</div>
		`, resetLink)

		m.SetBody("text/html", body)

		if err := s.dialer.DialAndSend(m); err != nil {
			log.Printf("Failed to send password reset email to %s: %v", toEmail, err)
		}
	}()
}
