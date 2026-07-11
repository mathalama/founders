import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/users');
        if (!res.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-[var(--color-text)]">Панель администратора</h1>
      
      <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">Тестовый запрос к API</h2>
        
        {loading ? (
          <p className="text-[var(--color-text-secondary)]">Загрузка данных...</p>
        ) : error ? (
          <p className="text-red-500">Ошибка: {error}</p>
        ) : (
          <pre className="bg-[var(--color-bg)] p-4 rounded-lg overflow-x-auto text-[var(--color-text-secondary)] text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
