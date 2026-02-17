# Phase 19: Code Comparison Page - Research

**Researched:** 2026-02-17
**Domain:** Static site tab navigation with build-time syntax highlighting
**Confidence:** HIGH

## Summary

Phase 19 requires a code comparison page displaying 10 feature tabs, with each tab showing syntax-highlighted code blocks for all 25 languages (250 total code blocks). The critical architectural challenge is reconciling Astro's build-time code rendering with client-side tab switching while maintaining Lighthouse 90+ performance on mobile devices.

Research reveals that the Astro `<Code />` component and Expressive Code both render at BUILD TIME, producing static HTML with inline styles and zero client-side JavaScript. This means all 250 code blocks must exist in the DOM at page load. The performance solution is NOT lazy rendering (impossible with build-time rendering), but strategic DOM management using CSS visibility patterns combined with modern browser optimizations.

**Primary recommendation:** Use build-time rendering for all code blocks with CSS-based tab switching (hidden attribute or display:none), implement content-visibility:auto for off-screen content, manage tab state with Nanostores (286 bytes), and follow WAI-ARIA tab pattern specifications for accessibility.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro `<Code />` | Built-in | Build-time syntax highlighting with Shiki | Already used in project, zero runtime overhead, native Astro component |
| Nanostores | ^0.11.3 | Client-side tab state management | Official Astro recommendation for island state, 286 bytes, framework-agnostic |
| @nanostores/react | ^0.8.0 | React hooks for Nanostores | Pairs with existing @astrojs/react integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS content-visibility | Native | Performance optimization for large DOM | Essential for 250-element DOM, provides 7x rendering boost |
| hidden attribute | Native HTML | Tab panel visibility control | Accessibility-first hiding, works without CSS |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Astro `<Code />` | Expressive Code `<Code />` component | Same build-time architecture, but Expressive Code component requires separate config file to avoid JSON serialization issues with Astro integration already using Expressive Code in pipeline |
| Nanostores | Zustand | Zustand is 3KB vs 286 bytes, more popular but heavier for simple tab state |
| CSS visibility | React conditional rendering | React can't lazy-load build-time content, only hide/show what already exists |

**Installation:**
```bash
npm install nanostores @nanostores/react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/beauty-index/
│   └── code/
│       └── index.astro          # Main comparison page
├── components/beauty-index/
│   ├── CodeComparisonTabs.tsx   # React island for tab UI (client:load)
│   └── FeatureMatrix.astro      # Build-time support matrix table
├── data/beauty-index/
│   └── code-features.ts         # 10 features × 25 languages data structure
└── stores/
    └── tabStore.ts              # Nanostore for active tab state
```

### Pattern 1: Build-Time Code Rendering with Client-Side Tab Switching

**What:** Generate all 250 code blocks at build time, control visibility with CSS and tab state managed by Nanostores

**When to use:** When you have static code content that doesn't change per-user, but need interactive UI to navigate it

**Example:**
```typescript
// src/pages/beauty-index/code/index.astro
---
import { Code } from 'astro:components';
import type { BuiltinLanguage } from 'shiki';
import CodeComparisonTabs from '../../components/beauty-index/CodeComparisonTabs.tsx';
import { CODE_FEATURES } from '../../data/beauty-index/code-features';

const languages = await getCollection('languages');
const features = CODE_FEATURES; // Array of 10 features
---

<Layout>
  <CodeComparisonTabs features={features.map(f => f.name)} client:load>
    {features.map((feature, featureIndex) => (
      <div
        data-tab-panel={featureIndex}
        hidden={featureIndex !== 0}
        role="tabpanel"
        aria-labelledby={`tab-${featureIndex}`}
        style="content-visibility: auto; contain-intrinsic-size: 0 500px;"
      >
        <h2>{feature.name}</h2>
        {languages.map((lang) => {
          const snippet = feature.snippets[lang.data.id];
          return snippet ? (
            <div class="language-block">
              <h3>{lang.data.name}</h3>
              <Code code={snippet.code} lang={snippet.lang as BuiltinLanguage} />
            </div>
          ) : (
            <div class="language-block language-unsupported">
              <h3>{lang.data.name}</h3>
              <p class="text-muted">Feature not supported</p>
            </div>
          );
        })}
      </div>
    ))}
  </CodeComparisonTabs>
</Layout>
```

### Pattern 2: Nanostores Tab State Management

**What:** Minimal state store for tracking active tab index, shared between tab buttons and panel visibility logic

**When to use:** When you need client-side state across Astro islands without React Context

**Example:**
```typescript
// src/stores/tabStore.ts
// Source: https://github.com/nanostores/nanostores
import { atom } from 'nanostores';

export const activeTab = atom<number>(0);

export function setActiveTab(index: number) {
  activeTab.set(index);
}
```

```typescript
// src/components/beauty-index/CodeComparisonTabs.tsx
import { useStore } from '@nanostores/react';
import { activeTab, setActiveTab } from '../../stores/tabStore';

export default function CodeComparisonTabs({
  features,
  children
}: {
  features: string[];
  children: React.ReactNode;
}) {
  const currentTab = useStore(activeTab);

  // Sync hidden attribute on tab panels when state changes
  React.useEffect(() => {
    document.querySelectorAll('[data-tab-panel]').forEach((panel, index) => {
      if (index === currentTab) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }, [currentTab]);

  return (
    <div>
      <div role="tablist" aria-label="Code feature comparison">
        {features.map((feature, index) => (
          <button
            key={index}
            id={`tab-${index}`}
            role="tab"
            aria-selected={currentTab === index}
            aria-controls={`panel-${index}`}
            tabIndex={currentTab === index ? 0 : -1}
            onClick={() => setActiveTab(index)}
            onKeyDown={(e) => handleKeyboardNav(e, index, features.length)}
          >
            {feature}
          </button>
        ))}
      </div>
      <div class="tab-content">{children}</div>
    </div>
  );
}

function handleKeyboardNav(e: React.KeyboardEvent, current: number, total: number) {
  let newIndex = current;
  if (e.key === 'ArrowRight') newIndex = (current + 1) % total;
  if (e.key === 'ArrowLeft') newIndex = (current - 1 + total) % total;
  if (e.key === 'Home') newIndex = 0;
  if (e.key === 'End') newIndex = total - 1;

  if (newIndex !== current) {
    e.preventDefault();
    setActiveTab(newIndex);
    document.getElementById(`tab-${newIndex}`)?.focus();
  }
}
```

### Pattern 3: Data Structure for Code Features

**What:** TypeScript data structure mapping 10 features to 25 languages with optional snippet support

**When to use:** When not all languages support all features (e.g., C doesn't have pattern matching)

**Example:**
```typescript
// src/data/beauty-index/code-features.ts
export interface CodeSnippet {
  lang: string;
  code: string;
}

export interface CodeFeature {
  name: string;
  description: string;
  snippets: Record<string, CodeSnippet | undefined>;
}

export const CODE_FEATURES: CodeFeature[] = [
  {
    name: 'Variable Declaration',
    description: 'How languages declare and initialize variables',
    snippets: {
      haskell: { lang: 'haskell', code: 'let x = 42\ny = "hello"' },
      rust: { lang: 'rust', code: 'let x: i32 = 42;\nlet y = "hello";' },
      // ... all 25 languages
    },
  },
  {
    name: 'Pattern Matching',
    description: 'Native pattern matching constructs',
    snippets: {
      haskell: { lang: 'haskell', code: 'case x of\n  Nothing -> 0\n  Just n -> n' },
      rust: { lang: 'rust', code: 'match x {\n  Some(n) => n,\n  None => 0,\n}' },
      c: undefined, // C doesn't support pattern matching
      java: undefined, // Java < 21 doesn't have native pattern matching
      // ... partial language support
    },
  },
  // ... 8 more features
];
```

### Pattern 4: Feature Support Matrix Table

**What:** Quick-reference grid showing which languages support which features

**When to use:** Complements detailed code comparison, satisfies CODE-05 requirement

**Example:**
```astro
---
// src/components/beauty-index/FeatureMatrix.astro
import { CODE_FEATURES } from '../../data/beauty-index/code-features';
import { getCollection } from 'astro:content';

const languages = await getCollection('languages');
const features = CODE_FEATURES;
---

<table class="feature-matrix">
  <thead>
    <tr>
      <th>Language</th>
      {features.map(f => <th>{f.name}</th>)}
    </tr>
  </thead>
  <tbody>
    {languages.map(lang => (
      <tr>
        <td><strong>{lang.data.name}</strong></td>
        {features.map(feature => (
          <td class="text-center">
            {feature.snippets[lang.data.id] ? '✓' : '—'}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

### Anti-Patterns to Avoid

- **DON'T use client-side syntax highlighting:** Shiki/Prism on client adds 250KB+ bundle, slow mobile performance, defeats build-time optimization
- **DON'T conditionally render code blocks with React:** Build-time components can't be lazy-loaded, only hidden/shown
- **DON'T use `visibility: hidden` for tabs:** Takes up layout space, use `hidden` attribute or `display: none` instead
- **DON'T skip ARIA roles:** Screen readers need `role="tab"`, `role="tablist"`, `role="tabpanel"`, `aria-selected`, `aria-controls`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom tokenizer with regex | Astro `<Code />` with Shiki | Shiki uses TextMate grammar (VS Code engine), handles 185+ languages, escaping, themes, edge cases like nested strings |
| State management across islands | Global variables or window events | Nanostores | Type-safe, reactive, 286 bytes, works across frameworks, official Astro recommendation |
| Tab keyboard navigation | Custom arrow key logic | WAI-ARIA tab pattern | Handles focus management, roving tabindex, Home/End keys, screen reader announcements |
| Performance measurement | Manual testing | Lighthouse CI / PageSpeed Insights | Automated, consistent device simulation, Core Web Vitals tracking |

**Key insight:** Syntax highlighting is deceptively complex. Prism is 7x faster than Shiki, but Shiki produces VS Code-quality accuracy using TextMate grammars. Since this project renders at BUILD TIME, Shiki's runtime slowness doesn't matter—it's a compile-time cost, not user-facing.

## Common Pitfalls

### Pitfall 1: Assuming Build-Time Content Can Be Lazy-Loaded

**What goes wrong:** Developer tries to implement "only render active tab's code blocks" using React conditional rendering, but all blocks render anyway because Astro generates them at build time

**Why it happens:** Confusion between server/build rendering (Astro components) and client rendering (React islands). `<Code />` is a build-time component—it doesn't exist as JavaScript in the browser

**How to avoid:** Accept that all 250 code blocks will be in the HTML. Focus on hiding inactive tabs efficiently with `hidden` attribute and optimizing rendering with `content-visibility: auto`

**Warning signs:**
- Trying to pass code snippets as props to React component expecting to render `<Code />` conditionally
- Seeing all code blocks render despite conditional logic
- Error messages about using Astro components in React islands

### Pitfall 2: CSS `display: none` vs `hidden` Attribute Confusion

**What goes wrong:** Using only CSS `display: none` for tab panels, which fails if CSS doesn't load, and missing the accessibility benefits of `hidden` attribute

**Why it happens:** Developers reach for familiar CSS solution without considering progressive enhancement

**How to avoid:** Use `hidden` attribute as primary hiding mechanism (works without CSS, respected by screen readers), optionally reinforce with CSS for styling control

**Warning signs:**
- Tab panels visible when CSS fails to load
- Screen readers announcing all tab panels simultaneously
- Accessibility audit failures

### Pitfall 3: Forgetting `content-visibility: auto` for Performance

**What goes wrong:** Page with 250 code blocks has slow initial render and layout shift issues, Lighthouse performance drops below 90

**Why it happens:** Browser attempts to render and style all 250 blocks immediately, even those far below viewport

**How to avoid:** Apply `content-visibility: auto` to tab panels with `contain-intrinsic-size` placeholder height to prevent layout shift

**Warning signs:**
- Initial page load takes >3 seconds on mobile
- Layout shift when scrolling (CLS metric degradation)
- Lighthouse performance score 60-80 range
- Browser DevTools showing long layout/paint times

### Pitfall 4: Incomplete ARIA Tab Implementation

**What goes wrong:** Tabs work with mouse but fail keyboard navigation, screen readers don't announce tab count or selected state

**Why it happens:** Partial ARIA implementation—adding roles but missing states, properties, and keyboard handlers

**How to avoid:** Follow complete WAI-ARIA tab pattern: `role="tab"`, `role="tablist"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`, arrow key navigation, roving tabindex

**Warning signs:**
- Can't navigate tabs with keyboard arrow keys
- Tab key jumps to all tabs instead of just active one
- Screen reader says "button" instead of "tab 3 of 10"
- Accessibility audit shows ARIA violations

### Pitfall 5: Not Handling Languages Without Feature Support

**What goes wrong:** App crashes or shows broken code blocks for languages that don't support a feature (e.g., pattern matching in C)

**Why it happens:** Assuming all 25 languages support all 10 features uniformly

**How to avoid:** Data structure uses `Record<string, CodeSnippet | undefined>`, template checks for undefined before rendering `<Code />`, shows "Feature not supported" message instead

**Warning signs:**
- Build errors referencing null/undefined snippets
- Empty code blocks rendering
- TypeScript errors about missing properties

## Code Examples

Verified patterns from official sources:

### Astro Code Component Build-Time Rendering
```astro
---
// Source: https://docs.astro.build/en/guides/syntax-highlighting/
import { Code } from 'astro:components';
import type { BuiltinLanguage } from 'shiki';

const pythonSnippet = `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b`;
---

<Code code={pythonSnippet} lang="python" />
```

### WAI-ARIA Tab Pattern (Simplified)
```jsx
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
<div>
  <div role="tablist" aria-label="Programming features">
    <button
      role="tab"
      aria-selected="true"
      aria-controls="panel-1"
      id="tab-1"
      tabindex="0"
    >
      Variables
    </button>
    <button
      role="tab"
      aria-selected="false"
      aria-controls="panel-2"
      id="tab-2"
      tabindex="-1"
    >
      Functions
    </button>
  </div>
  <div id="panel-1" role="tabpanel" aria-labelledby="tab-1">
    {/* Content */}
  </div>
  <div id="panel-2" role="tabpanel" aria-labelledby="tab-2" hidden>
    {/* Content */}
  </div>
</div>
```

### content-visibility CSS Performance Optimization
```css
/* Source: https://web.dev/articles/content-visibility */
.tab-panel {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* Placeholder height */
}

/* Provides 7x rendering performance boost for off-screen content */
```

### Nanostores React Integration
```typescript
// Source: https://github.com/nanostores/react
import { useStore } from '@nanostores/react';
import { activeTab } from '../stores/tabStore';

function TabButton({ index, label }) {
  const current = useStore(activeTab);
  return (
    <button
      aria-selected={current === index}
      onClick={() => activeTab.set(index)}
    >
      {label}
    </button>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side syntax highlighting (Prism.js, highlight.js) | Build-time rendering (Shiki via Astro) | Astro 2.0+ (2023) | Zero runtime JS for syntax highlighting, faster page loads, but longer builds |
| React Context for state | Nanostores for Astro islands | Astro 1.0+ (2022) | Can't use React Context across partial hydration boundaries, Nanostores works across frameworks |
| CSS `display: none` alone | `hidden` attribute + CSS | HTML5 (widespread adoption 2015+) | Progressive enhancement, screen reader support without CSS dependency |
| Manual viewport intersection for lazy render | `content-visibility: auto` | Chrome 85+ (Aug 2020), Safari 18+ (Sept 2024) | Native browser optimization, simpler API, better performance than IntersectionObserver |

**Deprecated/outdated:**
- **Expressive Code `<Code />` component in .astro files:** Requires separate `ec.config.mjs` due to JSON serialization issues when Expressive Code integration already in pipeline. Use Astro's built-in `<Code />` component instead.
- **Client-side Shiki:** Shiki is 250KB+ and 7x slower than Prism. Only use client-side highlighting for user-generated content; use build-time for static code.

## Open Questions

1. **Safari support for content-visibility**
   - What we know: Safari 18+ supports it (Sept 2024), older Safari versions ignore the property
   - What's unclear: Fallback behavior impact on iOS 16-17 users
   - Recommendation: Progressive enhancement—works without it, faster with it. Monitor Safari 18 adoption metrics before assuming universal support

2. **Build time with 250+ code blocks**
   - What we know: Astro can handle hundreds of pages with code highlighting, but each `<Code />` component invokes Shiki's tokenizer
   - What's unclear: Whether 250 blocks on a single page causes noticeable build slowdown
   - Recommendation: Measure build time before/after. If >30 seconds, consider caching strategy or splitting into separate pages

3. **Feature support matrix data source**
   - What we know: Need to manually define which languages support which features
   - What's unclear: Should this live in code-features.ts or be inferred from presence/absence of snippets
   - Recommendation: Infer from data (snippet exists = supported) to maintain single source of truth and avoid drift

## Sources

### Primary (HIGH confidence)
- Astro Syntax Highlighting Docs - https://docs.astro.build/en/guides/syntax-highlighting/
- Expressive Code Component Docs - https://expressive-code.com/key-features/code-component/
- WAI-ARIA Tab Pattern Specification - https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Nanostores GitHub - https://github.com/nanostores/nanostores
- Nanostores React Integration - https://github.com/nanostores/react
- content-visibility CSS (MDN) - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility
- content-visibility Performance Article - https://web.dev/articles/content-visibility

### Secondary (MEDIUM confidence)
- Astro Share State Between Islands - https://docs.astro.build/en/recipes/sharing-state-islands/
- Astro Islands Architecture - https://docs.astro.build/en/concepts/islands/
- WebAIM Invisible Content - https://webaim.org/techniques/css/invisiblecontent/
- Syntax Highlighting Comparison - https://npm-compare.com/highlight.js,prismjs,react-syntax-highlighter,shiki
- Astro Performance Optimization Guide - https://eastondev.com/blog/en/posts/dev/20251202-astro-performance-optimization/

### Tertiary (LOW confidence)
- Tab Component Lazy Loading Example - https://learnersbucket.com/examples/interview/tab-component-with-lazy-loading-in-react/
- Programming Language Feature Comparison - https://en.wikipedia.org/wiki/Comparison_of_programming_languages

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro `<Code />` is documented, project already uses it, Nanostores is official Astro recommendation
- Architecture: HIGH - Build-time rendering verified in official docs, tab patterns from W3C specification
- Pitfalls: MEDIUM-HIGH - Build-time vs client-side confusion is common (verified in GitHub issues), ARIA pitfalls from W3C best practices, content-visibility benefits verified but Safari adoption rate unclear

**Research date:** 2026-02-17
**Valid until:** 2026-03-31 (45 days - Astro and browser standards move slowly, but Nanostores and CSS features are stable)
