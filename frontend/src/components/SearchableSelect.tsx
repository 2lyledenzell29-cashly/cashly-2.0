import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  onCreateNew?: (searchTerm: string) => void;
  createNewLabel?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  className = "",
  disabled = false,
  allowEmpty = true,
  emptyLabel = "None",
  onCreateNew,
  createNewLabel = "Create new"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add empty option if allowed
  let allOptions = allowEmpty 
    ? [{ value: '', label: emptyLabel }, ...filteredOptions]
    : filteredOptions;

  // Add "Create new" option if onCreateNew is provided and search term doesn't match any existing option
  const showCreateNew = onCreateNew && searchTerm.trim() && 
    !options.some(option => option.label.toLowerCase() === searchTerm.toLowerCase());
  
  if (showCreateNew) {
    allOptions = [...allOptions, { value: `__create_new__${searchTerm}`, label: `${createNewLabel}: "${searchTerm}"` }];
  }

  // Get display value
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : (value === '' && allowEmpty ? emptyLabel : '');

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < allOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : allOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
          handleSelect(allOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    // Handle "Create new" option
    if (selectedValue.startsWith('__create_new__') && onCreateNew) {
      const newItemName = selectedValue.replace('__create_new__', '');
      onCreateNew(newItemName);
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      return;
    }

    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(0);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`
          relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm 
          focus-within:border-blue-500 focus-within:outline-none focus-within:ring-1 focus-within:ring-blue-500 
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onClick={handleInputClick}
      >
        <input
          ref={inputRef}
          type="text"
          className="w-full border-none bg-transparent p-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm"
          placeholder={isOpen ? "Type to search..." : (displayValue || placeholder)}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={!isOpen}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {allOptions.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              No options found
            </div>
          ) : (
            allOptions.map((option, index) => (
              <div
                key={option.value}
                className={`
                  relative cursor-pointer select-none py-2 pl-3 pr-9 
                  ${index === highlightedIndex ? 'bg-blue-600 text-white' : 'text-gray-900 hover:bg-gray-100'}
                  ${option.value === value ? 'font-semibold' : 'font-normal'}
                  ${option.value.startsWith('__create_new__') ? 'border-t border-gray-200 bg-gray-50 italic' : ''}
                `}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="block truncate">
                  {option.value.startsWith('__create_new__') ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {option.label}
                    </span>
                  ) : (
                    option.label
                  )}
                </span>
                {option.value === value && !option.value.startsWith('__create_new__') && (
                  <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${index === highlightedIndex ? 'text-white' : 'text-blue-600'}`}>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;