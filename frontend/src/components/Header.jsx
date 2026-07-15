import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.webp';
import styles from './Header.module.css';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiPlus, FiHome, FiFolder, FiFileText, FiBookmark, FiUser, FiLogOut } from 'react-icons/fi';
import LogoutModal from './LogoutModal';

function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerContent}`}>
          <Link to="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={logoImg} alt="Nucla Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            <span>Nucla</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.desktopNav}>
            {user ? (
              <>
                <Link to="/dashboard" className={styles.navLink}>Мои проекты</Link>
                <Link to="/applications" className={styles.navLink}>Мои отклики</Link>
                <Link to="/bookmarks" className={styles.navLink}>Сохраненное</Link>
                <Link to="/profile" className={`btn btn-outline btn-sm`}>{user.name}</Link>
                <button onClick={() => setShowLogoutModal(true)} className="btn btn-ghost btn-sm">Выйти</button>
                <Link to="/new" className="btn btn-primary btn-sm">
                  <FiPlus size={14} /> Создать проект
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Войти</Link>
                <Link to="/login" className="btn btn-primary btn-sm">Создать проект</Link>
              </>
            )}
          </nav>

          {/* Mobile burger */}
          <button
            className={styles.burgerBtn}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Открыть меню"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </header>

      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)}>
          <div
            ref={drawerRef}
            className={styles.drawer}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <Link to="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={logoImg} alt="Nucla Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                <span>Nucla</span>
              </Link>
              <button className={styles.burgerBtn} onClick={() => setMenuOpen(false)}>
                <FiX size={22} />
              </button>
            </div>

            <nav className={styles.drawerNav}>
              {user ? (
                <>
                  <Link to="/" className={styles.drawerLink}><FiHome style={{marginRight: '8px'}} /> Лента</Link>
                  <Link to="/dashboard" className={styles.drawerLink}><FiFolder style={{marginRight: '8px'}} /> Мои проекты</Link>
                  <Link to="/applications" className={styles.drawerLink}><FiFileText style={{marginRight: '8px'}} /> Мои отклики</Link>
                  <Link to="/bookmarks" className={styles.drawerLink}><FiBookmark style={{marginRight: '8px'}} /> Сохраненное</Link>
                  <Link to="/profile" className={styles.drawerLink}><FiUser style={{marginRight: '8px'}} /> Профиль: {user.name}</Link>
                  <div className={styles.drawerDivider} />
                  <Link to="/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    <FiPlus size={14} /> Создать проект
                  </Link>
                  <button onClick={() => { setMenuOpen(false); setShowLogoutModal(true); }} className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link to="/" className={styles.drawerLink}><FiHome style={{marginRight: '8px'}} /> Лента</Link>
                  <div className={styles.drawerDivider} />
                  <Link to="/login" className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }}>
                    Войти
                  </Link>
                  <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                    Создать проект
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
