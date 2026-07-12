import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef(null);
  const controls = useAnimation();

  const maxPull = 120;
  const threshold = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && !refreshing) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling) return;
    const y = e.touches[0].clientY;
    const deltaY = y - startY;

    if (deltaY > 0) {
      // Only prevent default if we are actually pulling down at the top of the page
      if (e.cancelable) {
         e.preventDefault();
      }
      setCurrentY(Math.min(deltaY * 0.4, maxPull)); // friction
    } else {
      setPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    setPulling(false);

    if (currentY >= threshold) {
      setRefreshing(true);
      controls.start({ y: 50 }); // keep spinner visible
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setCurrentY(0);
        controls.start({ y: 0 });
      }
    } else {
      setCurrentY(0);
      controls.start({ y: 0 });
    }
  };

  useEffect(() => {
    if (pulling) {
      controls.set({ y: currentY });
    }
  }, [currentY, pulling, controls]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', overflow: 'hidden', touchAction: pulling ? 'none' : 'auto' }}
    >
      <motion.div
        animate={controls}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
      
      {/* Refresh Indicator */}
      {(pulling || refreshing) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateY(-100%)' // above the container initially
          }}
        >
           <motion.div
              animate={{ rotate: refreshing ? 360 : currentY }}
              transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
              style={{
                 width: 24,
                 height: 24,
                 borderRadius: '50%',
                 border: '2px solid var(--accent)',
                 borderTopColor: 'transparent'
              }}
           />
        </div>
      )}
    </div>
  );
}
