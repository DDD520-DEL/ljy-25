import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PawPrint } from 'lucide-react';
import { PRESET_BREEDS } from '@/types';

interface BreedAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  existingBreeds?: string[];
  placeholder?: string;
  className?: string;
}

export function BreedAutocomplete({
  value,
  onChange,
  existingBreeds = [],
  placeholder = '如：金毛',
  className = '',
}: BreedAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    const allBreeds = Array.from(new Set([...existingBreeds, ...PRESET_BREEDS]));

    if (!query) {
      return existingBreeds.length > 0
        ? [...existingBreeds, ...PRESET_BREEDS.filter((b) => !existingBreeds.includes(b))]
        : [...PRESET_BREEDS];
    }

    const startsWith: string[] = [];
    const contains: string[] = [];

    allBreeds.forEach((breed) => {
      const breedLower = breed.toLowerCase();
      if (breedLower.startsWith(query)) {
        startsWith.push(breed);
      } else if (breedLower.includes(query)) {
        contains.push(breed);
      }
    });

    return [...startsWith, ...contains].slice(0, 10);
  }, [value, existingBreeds]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightIndex >= 0 && isOpen) {
      const item = document.getElementById(`breed-suggestion-${highlightIndex}`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        e.preventDefault();
        onChange(suggestions[highlightIndex]);
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const handleSelect = (breed: string) => {
    onChange(breed);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const isExistingBreed = (breed: string) => existingBreeds.includes(breed);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-amber-200 rounded-lg shadow-lg overflow-hidden"
          >
            <ul className="max-h-56 overflow-y-auto py-1">
              {suggestions.map((breed, index) => (
                <li
                  key={breed}
                  id={`breed-suggestion-${index}`}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(breed);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                    highlightIndex === index
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PawPrint
                    size={14}
                    className={
                      highlightIndex === index ? 'text-amber-500' : 'text-gray-400'
                    }
                  />
                  <span className="flex-1">{breed}</span>
                  {isExistingBreed(breed) && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      已使用
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
