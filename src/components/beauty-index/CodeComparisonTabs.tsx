import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { activeTab, setActiveTab } from '../../stores/tabStore';

interface CodeComparisonTabsProps {
  /** Array of feature names to display as tab labels */
  features: string[];
  /** Tab panel content rendered by Astro (server-side) */
  children: React.ReactNode;
}

/**
 * CodeComparisonTabs — React island for the code comparison page.
 *
 * Implements the WAI-ARIA Tabs pattern with:
 * - role="tablist" container with individual role="tab" buttons
 * - aria-selected, aria-controls, and roving tabindex
 * - Keyboard navigation: ArrowLeft, ArrowRight, Home, End
 * - Panel visibility via hidden attribute on [data-tab-panel] elements
 *
 * Usage with client:load in an Astro page for immediate interactivity.
 */
export default function CodeComparisonTabs({ features, children }: CodeComparisonTabsProps) {
  const currentTab = useStore(activeTab);
  const tablistRef = useRef<HTMLDivElement>(null);

  // Sync panel visibility when active tab changes
  useEffect(() => {
    const panels = document.querySelectorAll<HTMLElement>('[data-tab-panel]');
    panels.forEach((panel) => {
      const index = Number(panel.dataset.tabPanel);
      if (index === currentTab) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }, [currentTab]);

  // Focus the newly active tab button after keyboard navigation
  const focusTab = useCallback((index: number) => {
    setActiveTab(index);
    const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[index]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const count = features.length;
      let newIndex: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
          newIndex = (currentTab + 1) % count;
          break;
        case 'ArrowLeft':
          newIndex = (currentTab - 1 + count) % count;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = count - 1;
          break;
        default:
          return; // Let other keys pass through
      }

      e.preventDefault();
      focusTab(newIndex);
    },
    [currentTab, features.length, focusTab]
  );

  return (
    <div className="code-comparison-tabs">
      {/* Tab list */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Code feature comparison"
        className="flex overflow-x-auto border-b border-[var(--color-border)] mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin"
      >
        {features.map((name, index) => (
          <button
            key={name}
            role="tab"
            id={`tab-${index}`}
            aria-selected={currentTab === index}
            aria-controls={`panel-${index}`}
            tabIndex={currentTab === index ? 0 : -1}
            onClick={() => setActiveTab(index)}
            onKeyDown={handleKeyDown}
            className={`
              whitespace-nowrap px-3 py-2 text-sm font-medium
              border-b-2 transition-colors shrink-0
              ${
                currentTab === index
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }
            `}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Tab panels container — children rendered by Astro at build time */}
      <div className="tab-panels">
        {children}
      </div>
    </div>
  );
}
