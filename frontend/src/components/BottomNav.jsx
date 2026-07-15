import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiLayout, FiPlusCircle, FiUser, FiBookmark } from 'react-icons/fi';
import styles from './BottomNav.module.css';

function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className={styles.nav} aria-label="Нижнее меню">
      <Link to="/" className={`${styles.item} ${isActive('/') ? styles.active : ''}`}>
        <FiHome size={20} />
        <span>Лента</span>
      </Link>
      <Link to="/dashboard" className={`${styles.item} ${isActive('/dashboard') ? styles.active : ''}`}>
        <FiLayout size={20} />
        <span>Проекты</span>
      </Link>
      <Link to="/new" className={styles.createBtn} aria-label="Создать проект">
        <FiPlusCircle size={28} />
      </Link>
      <Link to="/bookmarks" className={`${styles.item} ${isActive('/bookmarks') ? styles.active : ''}`}>
        <FiBookmark size={20} />
        <span>Закладки</span>
      </Link>
      <Link to="/profile" className={`${styles.item} ${isActive('/profile') ? styles.active : ''}`}>
        <FiUser size={20} />
        <span>Профиль</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
