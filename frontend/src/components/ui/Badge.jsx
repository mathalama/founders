import React from 'react';

function Badge({ children, type = 'default', className = '', ...props }) {
  const typeClass = type === 'default' ? '' : `badge--${type}`;
  return (
    <span className={`badge ${typeClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
