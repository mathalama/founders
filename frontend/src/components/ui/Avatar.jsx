import React from 'react';

function Avatar({ name, url, size = 'md', className = '', style = {} }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
    
  const sizeClass = size === 'md' ? '' : `avatar--${size}`;

  return (
    <div className={`avatar ${sizeClass} ${className}`} style={style}>
      {url ? <img src={url} alt={name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  );
}

export default Avatar;
