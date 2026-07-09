import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiLayout, FiPlusCircle, FiUser,
  FiBookmark, FiFileText, FiLogOut, FiLogIn,
  FiMenu, FiX
} from 'react-icons/fi';
import styles from './Sidebar.module.css';

const NAV_ITEMS_AUTH = [
  { to: '/',             icon: <FiHome size={18} />,       label: 'Лента' },
  { to: '/dashboard',   icon: <FiLayout size={18} />,     label: 'Мои проекты' },
  { to: '/applications',icon: <FiFileText size={18} />,   label: 'Мои отклики' },
  { to: '/bookmarks',   icon: <FiBookmark size={18} />,   label: 'Сохранённое' },
];

const NAV_ITEMS_GUEST = [
  { to: '/', icon: <FiHome size={18} />, label: 'Лента' },
];

function Sidebar({ collapsed, mobileOpen, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;

  const handleLogout = () => {
    logout();
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
            <span className={styles.logoMark}>Q</span>
            <span className={styles.logoText}>oldau</span>
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
              onClick={handleLogout}
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
      </div>
    </aside>
  );
}

export default Sidebar;
