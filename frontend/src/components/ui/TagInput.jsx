import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

const DEFAULT_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Go', 'Python', 'Figma', 'UI/UX Design',
  'PostgreSQL', 'Docker', 'Git', 'HTML/CSS', 'JavaScript', 'Vue.js', 'Angular',
  'NestJS', 'Express', 'Django', 'FastAPI', 'Spring Boot', 'MongoDB', 'Redis',
  'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'REST API', 'GraphQL', 'Tailwind CSS',
  'Swift', 'Kotlin', 'Flutter', 'React Native', 'Product Management', 'Scrum',
  'Agile', 'Marketing', 'SEO', 'QA Testing'
];

function TagInput({ tags = [], onChange, placeholder = 'Добавить навык...', suggestions = DEFAULT_SUGGESTIONS }) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter suggestions based on typed input and already selected tags
  const filteredSuggestions = suggestions.filter(item => {
    const isAlreadyAdded = tags.some(t => t.toLowerCase() === item.toLowerCase());
    const matchesInput = item.toLowerCase().includes(inputValue.toLowerCase().trim());
    return matchesInput && !isAlreadyAdded;
  });

  // Handle clicking outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const addTag = (tag) => {
    const cleanedTag = tag.trim();
    if (!cleanedTag) return;

    // Prevent duplicates
    const exists = tags.some(t => t.toLowerCase() === cleanedTag.toLowerCase());
    if (!exists) {
      const updatedTags = [...tags, cleanedTag];
      onChange(updatedTags);
    }
    
    setInputValue('');
    setActiveIndex(-1);
  };

  const removeTag = (indexToRemove) => {
    const updatedTags = tags.filter((_, idx) => idx !== indexToRemove);
    onChange(updatedTags);
  };

  const handleKeyDown = (e) => {
    // Arrow Down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
    }
    // Arrow Up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    }
    // Enter / Comma / Tab
    else if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      
      // If a suggestion is highlighted, add it
      if (isOpen && activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[activeIndex]);
      } 
      // Else, add raw typed value
      else if (inputValue.trim()) {
        addTag(inputValue);
      }
      
      setIsOpen(false);
    }
    // Backspace (delete last tag if input is empty)
    else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      removeTag(tags.length - 1);
    }
    // Escape
    else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="tag-input-container" 
      onClick={handleContainerClick}
    >
      {/* Visual tags list */}
      {tags.map((tag, idx) => (
        <span key={idx} className="tag-badge">
          {tag}
          <button 
            type="button" 
            className="tag-badge-remove" 
            onClick={(e) => {
              e.stopPropagation();
              removeTag(idx);
            }}
          >
            <FiX size={12} />
          </button>
        </span>
      ))}

      {/* Input element */}
      <input
        ref={inputRef}
        type="text"
        className="tag-input-field"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={tags.length === 0 ? placeholder : ''}
      />

      {/* Suggestions dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <ul className="tag-suggestions-dropdown">
          {filteredSuggestions.map((item, idx) => (
            <li
              key={idx}
              className={`tag-suggestion-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                addTag(item);
                setIsOpen(false);
              }}
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

export default TagInput;
