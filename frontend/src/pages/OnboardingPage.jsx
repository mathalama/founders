import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/client';
import { useToast } from '../context/ToastContext';
import TagInput from '../components/ui/TagInput';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import { ROLE_SUGGESTIONS } from '../constants/suggestions';

function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    roleTitle: '',
    skills: [],
    bio: '',
    openToOffers: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roleTitle.trim()) {
      showToast('Пожалуйста, укажите вашу роль', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        roleTitle: formData.roleTitle,
        skills: formData.skills,
        bio: formData.bio,
        openToOffers: formData.openToOffers,
        // Preserve existing user fields that we aren't editing here
        emailNotifications: user?.emailNotifications ?? true,
        github: user?.github || '',
        telegram: user?.telegram || '',
      };

      const res = await fetchWithAuth('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        showToast('Добро пожаловать!', 'success');
        navigate('/');
      } else {
        showToast('Ошибка при сохранении профиля', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка соединения', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bento-card"
        style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Добро пожаловать в Nucla!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Прежде чем мы начнем, расскажите немного о себе. Это поможет фаундерам и командам лучше вас узнать.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ваша основная роль *</label>
            <AutocompleteInput
              name="roleTitle"
              value={formData.roleTitle}
              onChange={handleChange}
              suggestions={ROLE_SUGGESTIONS}
              placeholder="Frontend Developer, Product Manager..."
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Навыки</label>
            <TagInput 
              tags={formData.skills} 
              onChange={(newSkills) => setFormData(prev => ({ ...prev, skills: newSkills }))} 
              placeholder="Введите навык (например, React) и нажмите Enter..." 
            />
          </div>



          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>О себе</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              className="textarea" 
              rows="3" 
              placeholder="Пару слов о том, чем вы занимаетесь и какие проекты ищете"
            ></textarea>
          </div>



          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Продолжить'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default OnboardingPage;
