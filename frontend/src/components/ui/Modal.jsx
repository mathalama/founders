import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, children, maxWidth = '400px' }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ zIndex: 9999 }}
          />
          <div className={`modal-wrapper ${isMobile ? 'bottom-sheet' : 'centered-modal'}`} style={{ zIndex: 10000, pointerEvents: 'none' }}>
            <motion.div
              className="modal"
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: isMobile ? '100%' : maxWidth, pointerEvents: 'auto' }}
              drag={isMobile ? "y" : false}
              dragConstraints={isMobile ? { top: 0, bottom: 0 } : undefined}
              dragElastic={isMobile ? { top: 0, bottom: 0.5 } : false}
              onDragEnd={(e, info) => {
                if (isMobile && info.offset.y > 100) {
                  onClose();
                }
              }}
            >
              {isMobile && (
                <div className="bottom-sheet-handle-wrap" onClick={onClose}>
                   <div className="bottom-sheet-handle" />
                </div>
              )}
              
              {!isMobile && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                  <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ padding: '4px' }}>
                    <FiX size={20} />
                  </button>
                </div>
              )}
              
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
