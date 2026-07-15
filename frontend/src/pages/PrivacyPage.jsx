import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

function PrivacyPage() {
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
        <h1 style={{ marginBottom: '1.5rem', fontSize: '2.25rem' }}>Политика конфиденциальности (Privacy Policy)</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Последнее обновление: 15 июля 2026 г.</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Какую информацию мы собираем</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Мы собираем только те данные, которые необходимы для функционирования платформы Nucla:
          </p>
          <ul style={{ color: 'var(--text-primary)', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Ваше имя, адрес электронной почты и фотографию профиля (при входе через Google).</li>
            <li>Информацию, которую вы добровольно указываете в своем профиле: роль, навыки, опыт работы, ссылки на GitHub и Telegram, биографию.</li>
            <li>Данные о созданных вами проектах и отправленных откликах.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Как мы используем информацию</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Собранные данные используются исключительно для:
          </p>
          <ul style={{ color: 'var(--text-primary)', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Предоставления услуг мэтчинга фаундеров и специалистов.</li>
            <li>Отправки вам важных сервисных уведомлений (например, о новых откликах на ваш проект).</li>
            <li>Модерации и предотвращения спама или мошеннических действий на платформе.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Защита данных</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Мы предпринимаем все необходимые технические и организационные меры безопасности для защиты ваших персональных данных от несанкционированного доступа, изменения или удаления. Пароли пользователей шинируются с использованием сильного алгоритма хеширования (bcrypt).
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. Передача данных третьим лицам</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Мы не продаем, не обмениваем и не передаем ваши личные данные третьим лицам. Ваши контактные данные (например, логин Telegram) становятся видимыми для других пользователей только тогда, когда вы сами публикуете проект или откликаетесь на роль, требующую связи.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>5. Права пользователей</h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Вы можете в любой момент изменить или дополнить свои данные через вкладку «Профиль». Если вы хотите полностью удалить свой аккаунт с платформы Nucla, вы можете обратиться в поддержку или воспользоваться функцией удаления в настройках (при наличии).
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;
