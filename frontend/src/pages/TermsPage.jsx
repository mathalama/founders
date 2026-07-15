import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-outline btn-sm" 
        style={{ marginBottom: '2rem', gap: '0.5rem' }}
      >
        <FiArrowLeft size={16} /> Назад
      </button>

      <div className="bento-card" style={{ padding: '3rem 2.5rem', lineHeight: '1.8' }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '2.25rem' }}>Условия использования (Terms of Use)</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Последнее обновление: 15 июля 2026 г.</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Общие положения</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Добро пожаловать на Nucla. Настоящие Условия использования регулируют ваш доступ к веб-сайту и его использование. 
            Регистрируясь на нашей платформе, вы соглашаетесь соблюдать эти правила.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Регистрация аккаунта</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Для полноценного использования платформы Nucla (поиск кофаундеров, публикация проектов и отправка откликов) 
            необходимо создать учетную запись через Google Auth или адрес электронной почты. Вы обязуетесь указывать 
            достоверную информацию о себе и своих профессиональных навыках.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Размещение контента и проекты</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Пользователи несут личную ответственность за любые материалы, опубликованные ими на платформе (включая описание проектов, 
            требования к открытым ролям и сообщения в чате). Запрещается размещение мошеннических проектов, спама, нелегального 
            контента или материалов, нарушающих авторские права.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. Права и ответственность Nucla</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Администрация Nucla оставляет за собой право модерировать контент, скрывать подозрительные проекты и блокировать 
            учетные записи пользователей, нарушающих данные Условия использования, без предварительного уведомления.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>5. Изменение условий</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Мы можем время от времени обновлять настоящие Условия. Изменения вступают в силу с момента их публикации на этой странице. 
            Продолжая использовать Nucla после обновления Условий, вы подтверждаете свое согласие с ними.
          </p>
        </section>
      </div>
    </div>
  );
}

export default TermsPage;
