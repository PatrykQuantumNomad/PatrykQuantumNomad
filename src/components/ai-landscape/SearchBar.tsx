import { useState, useMemo, useRef } from 'react';
import type { AiNode } from '../../lib/ai-landscape/schema';

interface SearchBarProps {
  nodes: AiNode[];
  onSelect: (node: AiNode) => void;
}

/**
 * Search autocomplete component with ARIA combobox pattern.
 *
 * Filters nodes by case-insensitive substring match and renders
 * a dropdown with keyboard navigation (ArrowUp/Down, Enter, Escape).
 */
export function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (query === '') return [];
    return nodes
      .filter((n) => n.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, nodes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault();
          onSelect(filtered[activeIndex]);
          setQuery('');
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleItemSelect = (node: AiNode) => {
    onSelect(node);
    setQuery('');
    setIsOpen(false);
  };

  const showDropdown = isOpen && filtered.length > 0;
  const activeDescendant =
    activeIndex >= 0 ? `search-option-${activeIndex}` : undefined;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="search-listbox"
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        aria-label="Search AI landscape concepts"
        placeholder="Search concepts..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="rounded-lg border px-3 py-2 text-sm w-full bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"
      />
      {showDropdown && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filtered.map((node, i) => (
            <li
              key={node.id}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleItemSelect(node)}
              className={`px-3 py-2 cursor-pointer text-sm text-[var(--color-text-primary)] ${
                i === activeIndex ? 'bg-[var(--color-accent)]/10' : ''
              }`}
            >
              <span className="block">{node.name}</span>
              <span className="block text-xs text-[var(--color-text-secondary)]">
                {node.cluster}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
