import React from 'react';
import { motion } from 'framer-motion';
import ThreadsTab from '../components/ThreadsTab';

function ThreadsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <ThreadsTab />
    </motion.div>
  );
}

export default ThreadsPage;
