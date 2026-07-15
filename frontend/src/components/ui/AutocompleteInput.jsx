import React, { useState, useEffect, useRef } from 'react';

function AutocompleteInput({
  name,
  value = '',
  onChange,
  suggestions = [],
  placeholder = 'Выберите или введите...',
  required = false,
  className = 'input',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  // Filter suggestions based on typed input
  const safeValue = typeof value === 'string' ? value : '';
  const filtered = suggestions.filter(item =>
    item.toLowerCase().includes(safeValue.toLowerCase().trim())
  );

  // Handle clicking outside to close
  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleInputChange = (e) => {
    onChange(e);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSuggestionClick = (item) => {
    // Mimic standard HTML input change event so existing onChange works
    const event = {
      target: {
        name,
        value: item
      }
    };
    onChange(event);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault();
        handleSuggestionClick(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="suggestions-dropdown-wrapper" style={style}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        className={className}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="suggestions-dropdown">
          {filtered.map((item, idx) => (
            <li
              key={idx}
              className={`suggestion-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => handleSuggestionClick(item)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AutocompleteInput;
