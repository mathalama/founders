import React, { useEffect } from 'react';

export default function OAuthCallbackPage() {
  useEffect(() => {
    // If the Service Worker intercepted the Google OAuth callback, 
    // React Router will render this page.
    // We just need to force a hard reload from the server so the request
    // bypasses the Service Worker and hits the Go backend.
    window.location.reload();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="bento-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Авторизация...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Пожалуйста, подождите.</p>
      </div>
    </div>
  );
}
