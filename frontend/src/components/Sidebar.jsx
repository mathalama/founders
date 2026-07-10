import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiLayout, FiPlusCircle, FiUser,
  FiBookmark, FiFileText, FiLogOut, FiLogIn,
  FiMenu, FiX, FiMoon, FiSun, FiBell, FiMessageSquare
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS_GUEST = [
  { to: '/', icon: <FiHome size={18} />, label: 'Лента' },
];

import { fetchWithAuth } from '../api/client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import LogoutModal from './LogoutModal';

function Sidebar({ collapsed, mobileOpen, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/notifications');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NAV_ITEMS_AUTH = [
    { to: '/',             icon: <FiHome size={18} />,       label: 'Лента' },
    { to: '/dashboard',   icon: <FiLayout size={18} />,     label: 'Мои проекты' },
    { to: '/applications',icon: <FiFileText size={18} />,   label: 'Мои отклики' },
    { to: '/messages',    icon: <FiMessageSquare size={18} />, label: 'Сообщения' },
    { to: '/bookmarks',   icon: <FiBookmark size={18} />,   label: 'Сохранённое' },
    { to: '/notifications',icon: <div style={{position:'relative'}}><FiBell size={18} />{unreadCount > 0 && <span className="badge--count" style={{position:'absolute', top:'-6px', right:'-8px', fontSize:'9px', padding:'2px 4px'}}>{unreadCount}</span>}</div>, label: 'Уведомления' },
  ];

  const navItems = user ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  return (
    <aside className={[
      styles.sidebar,
      collapsed ? styles.collapsed : '',
      mobileOpen ? styles.mobileOpen : '',
    ].join(' ')}>
      {/* Logo + toggle */}
      <div className={styles.header}>
        {!collapsed && (
          <Link to="/" className={styles.logo}>
            <span className={styles.logoText}>Nucla</span>
          </Link>
        )}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? <FiMenu size={20} /> : <FiX size={18} />}
        </button>
      </div>

      {/* Create project button */}
      {user && (
        <div className={styles.createWrap}>
          <Link to="/new" className={`${styles.createBtn} ${collapsed ? styles.createBtnCollapsed : ''}`}>
            <FiPlusCircle size={18} />
            {!collapsed && <span>Создать проект</span>}
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''} ${collapsed ? styles.navItemCollapsed : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className={styles.bottom}>
        {user ? (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''} ${collapsed ? styles.navItemCollapsed : ''}`
              }
              title={collapsed ? 'Профиль' : undefined}
            >
              <div className={`avatar avatar--sm ${styles.navIcon}`}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.name} />
                  : user.name?.[0]?.toUpperCase() || '?'}
              </div>
              {!collapsed && (
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  {user.roleTitle && <div className={styles.userRole}>{user.roleTitle}</div>}
                </div>
              )}
            </NavLink>
            <button
              className={`${styles.navItem} ${styles.logoutBtn} ${collapsed ? styles.navItemCollapsed : ''}`}
              onClick={() => setShowLogoutModal(true)}
              title={collapsed ? 'Выйти' : undefined}
            >
              <span className={styles.navIcon}><FiLogOut size={18} /></span>
              {!collapsed && <span className={styles.navLabel}>Выйти</span>}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`${styles.navItem} ${collapsed ? styles.navItemCollapsed : ''}`}
            title={collapsed ? 'Войти' : undefined}
          >
            <span className={styles.navIcon}><FiLogIn size={18} /></span>
            {!collapsed && <span className={styles.navLabel}>Войти</span>}
          </Link>
        )}
        <button
          className={`${styles.navItem} ${collapsed ? styles.navItemCollapsed : ''}`}
          onClick={toggleTheme}
          title={collapsed ? 'Сменить тему' : undefined}
          style={{ marginTop: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        >
          <span className={styles.navIcon}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </span>
          {!collapsed && <span className={styles.navLabel}>{theme === 'light' ? 'Темная тема' : 'Светлая тема'}</span>}
        </button>
      </div>
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
    </aside>
  );
}

export default Sidebar;
