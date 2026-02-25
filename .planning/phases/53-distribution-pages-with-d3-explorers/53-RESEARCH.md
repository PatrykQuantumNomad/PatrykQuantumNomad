# Phase 53: Distribution Pages with D3 Explorers - Research

**Researched:** 2026-02-25
**Domain:** Astro 5 dynamic routes + React island with D3 interactive distribution parameter explorers
**Confidence:** HIGH

## Summary

Phase 53 creates 19 distribution pages (15 continuous + 2 discrete + Tukey-Lambda + landing page), each with static SVG fallbacks rendered at build time and an interactive DistributionExplorer.tsx React island that uses D3 micro-modules to let users adjust distribution parameters via sliders and see PDF/CDF curves update in real time.

The codebase already has substantial infrastructure in place: D3 micro-modules installed and bundle-isolated (Phase 48), a `DistributionExplorerStub.tsx` proving the `client:visible` pattern works, `distributions.json` with all 19 entries including parameter definitions and formulas, `distribution-curve.ts` with PDF/CDF math for 6 of 19 distributions, `plot-base.ts` with the PALETTE and shared SVG primitives, `routes.ts` with `distributionUrl()`, `schema.ts` with `edaDistributionSchema`, and `edaDistributions` collection registered in `content.config.ts`. The Astro dynamic route pattern (`[slug].astro` with `getStaticPaths()`) is well-established from techniques and quantitative pages.

The primary work is: (1) extend `distribution-curve.ts` to cover all 19 distributions for static SVG fallback, (2) build `DistributionExplorer.tsx` replacing the stub with a full interactive component featuring parameter sliders + dual PDF/CDF D3 charts, (3) create `src/pages/eda/distributions/[slug].astro` dynamic route, (4) create `src/pages/eda/distributions/index.astro` landing page with a browsable grid, and (5) handle discrete distributions (binomial, Poisson) differently from continuous ones (bar stems vs smooth curves).

**Primary recommendation:** Build a single generic `DistributionExplorer.tsx` React island that receives distribution metadata (parameters, type) as props, computes PDF/CDF client-side via a `distribution-math.ts` module, and renders dual D3 charts. The same math module should be reused for both the interactive explorer and the extended static SVG generator.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-01 | Normal distribution page at /eda/distributions/normal/ | Dynamic route [slug].astro + distributions.json data; math already in distribution-curve.ts |
| DIST-02 | Uniform distribution page at /eda/distributions/uniform/ | Same pattern; math exists |
| DIST-03 | Exponential distribution page at /eda/distributions/exponential/ | Same pattern; math exists |
| DIST-04 | Weibull distribution page at /eda/distributions/weibull/ | Math needs adding to distribution-math.ts |
| DIST-05 | Lognormal distribution page at /eda/distributions/lognormal/ | Math needs adding; uses erf from existing code |
| DIST-06 | Gamma distribution page at /eda/distributions/gamma/ | Same pattern; math exists |
| DIST-07 | Chi-square distribution page at /eda/distributions/chi-square/ | Same pattern; math exists |
| DIST-08 | Student's t-distribution page at /eda/distributions/t-distribution/ | Same pattern; math exists |
| DIST-09 | F-distribution page at /eda/distributions/f-distribution/ | Math needs adding; uses beta function + incomplete beta |
| DIST-10 | Tukey-Lambda page at /eda/distributions/tukey-lambda/ | Special case: quantile-defined, needs numerical inversion for PDF |
| DIST-11 | Extreme Value (Gumbel) page at /eda/distributions/extreme-value/ | Math needs adding; closed-form PDF/CDF |
| DIST-12 | Beta distribution page at /eda/distributions/beta/ | Math needs adding; uses incomplete beta function |
| DIST-13 | Binomial distribution page at /eda/distributions/binomial/ | Discrete: PMF bar stems + step CDF; uses binomial coefficient |
| DIST-14 | Poisson distribution page at /eda/distributions/poisson/ | Discrete: PMF bar stems + step CDF; uses factorial |
| DIST-15 | Cauchy distribution page at /eda/distributions/cauchy/ | Math needs adding; simple closed-form |
| DIST-16 | Lognormal (duplicate of DIST-05) | Single page; same as DIST-05 |
| DIST-17 | DistributionExplorer.tsx React island | Core interactive component with sliders + D3 dual charts |
| DIST-18 | Static build-time SVG fallback for each distribution | Extend distribution-curve.ts to handle all 19 distributions |
| DIST-19 | Distribution landing page with browsable grid | index.astro at /eda/distributions/ with thumbnail grid |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site framework | Already installed; drives the build |
| react | ^19.2.4 | Island component runtime | Already installed; DistributionExplorer is a React island |
| d3-selection | ^3.0.0 | DOM manipulation for charts | Already installed; proven in stub |
| d3-scale | ^4.0.2 | Axis scaling (linear) | Already installed; used in distribution-curve.ts |
| d3-shape | ^3.2.0 | Line/area path generators | Already installed; used in distribution-curve.ts |
| d3-axis | ^3.0.0 | Axis tick rendering | Already installed; proven in stub |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| katex | (installed) | Build-time formula rendering | Render KaTeX formulas on distribution pages (pdfFormula, cdfFormula from JSON) |
| d3-array | ^3.2.4 | Array utilities (range, extent) | Already installed; useful for tick generation |
| d3-path | ^3.1.0 | SVG path serialization | Already installed; internal dependency |

### No New Dependencies Needed
All required libraries are already installed from Phase 48. No new npm installs are necessary.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/eda/
    DistributionExplorer.tsx        # React island: interactive D3 parameter explorer (replaces Stub)
    DistributionPage.astro          # Distribution page template (like TechniquePage.astro)
  lib/eda/
    math/
      distribution-math.ts          # All 19 PDF/CDF implementations (shared by explorer + SVG gen)
    svg-generators/
      distribution-curve.ts         # Extended to use distribution-math.ts for all 19 distributions
  pages/eda/distributions/
    [slug].astro                    # Dynamic route for 19 distribution pages
    index.astro                     # Landing page with browsable grid
```

### Pattern 1: Dynamic Route with getStaticPaths (existing pattern)
**What:** Astro `getStaticPaths()` generates static pages from `edaDistributions` collection.
**When to use:** All 19 distribution pages use the same template but different data.
**Example:**
```typescript
// src/pages/eda/distributions/[slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const distributions = await getCollection('edaDistributions');
  return distributions.map(dist => ({
    params: { slug: dist.data.slug },
    props: { distribution: dist.data },
  }));
}
```

### Pattern 2: React Island with client:visible (established in Phase 48)
**What:** DistributionExplorer loads via `client:visible` -- D3 JavaScript downloads only when the component scrolls into the viewport.
**When to use:** Every distribution page embeds the explorer island.
**Example:**
```astro
<DistributionExplorer
  client:visible
  distribution={distribution.id}
  parameters={distribution.parameters}
  title={distribution.title}
/>
```

### Pattern 3: Static SVG Fallback with Progressive Enhancement
**What:** Build-time SVG is visible immediately (SSR); React island replaces/overlays it on hydration.
**When to use:** Every distribution page. The static SVG (DIST-18) shows default-parameter curves for no-JS users.
**Example:**
```astro
---
const pdfSvg = generateDistributionCurve({
  type: 'pdf', distribution: dist.id, params: defaultParams
});
const cdfSvg = generateDistributionCurve({
  type: 'cdf', distribution: dist.id, params: defaultParams
});
---
<!-- Static fallback visible before JS loads -->
<div class="distribution-static-fallback" set:html={pdfSvg + cdfSvg} />
<!-- Interactive explorer replaces/overlays on hydration -->
<DistributionExplorer client:visible ... />
```

### Pattern 4: Shared Math Module (distribution-math.ts)
**What:** Extract all PDF/CDF computation functions into a pure-math module with no D3/DOM imports. Both the build-time SVG generator and the client-side React island import from it.
**When to use:** Avoids duplicating math. The module exports a single dispatch function:
```typescript
export function evalDistribution(
  id: string, type: 'pdf' | 'cdf', x: number, params: Record<string, number>
): number
```
This replaces the inline switch-case in `distribution-curve.ts` and is reused by `DistributionExplorer.tsx`.

### Pattern 5: Discrete Distribution Rendering
**What:** Binomial and Poisson are discrete. They use vertical bar stems for PMF (not smooth curves) and a step function for CDF.
**When to use:** When `distribution.id` is `'binomial'` or `'poisson'`.
**Implementation:**
- PMF: D3 vertical lines (rect or line elements) at integer k values
- CDF: Staircase path using `d3-shape` `curveStepAfter`
- X-axis domain: integer range from 0 to reasonable upper bound (e.g., n for binomial, lambda + 4*sqrt(lambda) for Poisson)

### Pattern 6: Tukey-Lambda Special Handling
**What:** Tukey-Lambda has no closed-form PDF/CDF. It is defined by its quantile function Q(F).
**When to use:** Distribution id `'tukey-lambda'`.
**Implementation:**
- Generate curve by sweeping F from 0.001 to 0.999, computing x = Q(F)
- PDF at each x approximated as f(x) = 1/Q'(F) where Q'(F) = F^(lambda-1) + (1-F)^(lambda-1)
- Plot pairs (x, f(x)) sorted by x
- This approach is already documented in distributions.json's pdfFormula field

### Anti-Patterns to Avoid
- **Importing full d3 package:** NEVER `import * as d3 from 'd3'`. Only import the 4-6 micro-modules already installed. This is a locked decision.
- **Creating separate React components per distribution:** Do NOT create 19 separate React components. Use a single parameterized `DistributionExplorer.tsx` that receives the distribution ID and parameters as props.
- **Hardcoding distribution math in the React component:** Extract to `distribution-math.ts` for sharing with SVG generator.
- **Using client:load instead of client:visible:** Locked decision from Phase 48. Distribution explorer must use `client:visible`.
- **Forgetting SVG cleanup on mount/unmount:** Critical for view transition safety. The `svg.selectAll('*').remove()` pattern in the useEffect is mandatory (confirmed in 48-03).
- **Using fixed width/height on SVG:** Use viewBox for responsive sizing. No fixed width/height attributes (SVG-12).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gamma function | Custom implementation | Lanczos approximation already in distribution-curve.ts | The 9-coefficient Lanczos with reflection formula is accurate and battle-tested |
| Error function (erf) | Custom implementation | Abramowitz & Stegun 7.1.26 already in distribution-curve.ts | Max error 1.5e-7, confirmed decision |
| Incomplete beta function | Full implementation from scratch | Series expansion + continued fraction (same pattern as lowerIncompleteGammaRatio) | Edge cases in convergence are tricky |
| Slider UI | Custom slider component | Native HTML `<input type="range">` with CSS styling | Works on mobile, accessible, no extra JS |
| Responsive SVG | Manual resize handlers | CSS `width: 100%; height: auto` + viewBox | Proven pattern from all existing SVG generators |
| D3 axis rendering | Manual tick mark placement | d3-axis `axisBottom`/`axisLeft` | Handles tick formatting, spacing, and label placement |
| Touch gesture handling | Custom touch event management | Native range input events (input/change) | Range inputs are inherently touch-friendly |

**Key insight:** The existing math infrastructure (`erf`, `gammaFn`, `lnGamma`, `lowerIncompleteGammaRatio`) handles the hardest parts. New distributions mostly compose these existing functions. The biggest new math is `regularizedBeta` for beta and F distributions (follows the same series-expansion + continued-fraction pattern as `lowerIncompleteGammaRatio`).

## Common Pitfalls

### Pitfall 1: D3 Creates Duplicate Elements on Re-render
**What goes wrong:** React re-renders trigger useEffect, but old D3-created DOM elements remain, causing overlapping charts.
**Why it happens:** D3's imperative DOM manipulation doesn't participate in React's virtual DOM reconciliation.
**How to avoid:** Always `svg.selectAll('*').remove()` at the start of the useEffect. Use a stable SVG ref. Return cleanup function from useEffect.
**Warning signs:** Charts appear doubled or overlaid after parameter changes.

### Pitfall 2: Slider onChange vs onInput Performance
**What goes wrong:** Using `onChange` on range inputs causes laggy updates because it only fires on mouse release in some browsers.
**Why it happens:** Browser inconsistency between `change` and `input` events on range elements.
**How to avoid:** Use the `onInput` event (React's `onChange` actually maps to `input` in React, so `onChange` is correct in React). Throttle D3 re-renders to ~60fps using requestAnimationFrame if needed.
**Warning signs:** Curve doesn't update smoothly while dragging sliders.

### Pitfall 3: Numerical Overflow in Gamma/Factorial for Large Parameters
**What goes wrong:** Computing `gammaFn(n)` for large n (e.g., binomial with n=50) or `n!` causes Infinity.
**Why it happens:** JavaScript number overflow beyond ~170!.
**How to avoid:** Use `lnGamma` (log-gamma) and work in log-space: `exp(lnGamma(n+1) - lnGamma(k+1) - lnGamma(n-k+1))` for binomial coefficients.
**Warning signs:** NaN or Infinity in chart rendering for large parameter values.

### Pitfall 4: Tukey-Lambda Degeneracy at lambda=0
**What goes wrong:** Q(F) = (F^lambda - (1-F)^lambda) / lambda is 0/0 at lambda=0.
**Why it happens:** The limit at lambda=0 is the logistic quantile function Q(F) = ln(F/(1-F)).
**How to avoid:** Special-case lambda near 0 (|lambda| < 1e-10): use `Math.log(F / (1-F))`.
**Warning signs:** NaN or flat line at lambda=0 in Tukey-Lambda explorer.

### Pitfall 5: Cauchy Distribution Viewport Blowout
**What goes wrong:** Cauchy has such heavy tails that the PDF can look flat if the x-range is too narrow, or the peak dominates if too wide.
**Why it happens:** Cauchy PDF peak is 1/(pi*gamma) but tails decay as 1/x^2 (much slower than Gaussian).
**How to avoid:** Use adaptive x-domain: center on x0, extend to x0 +/- 10*gamma. Clamp y-axis to prevent extreme peaks from compressing other features.
**Warning signs:** Chart appears as a single spike or a flat line.

### Pitfall 6: View Transitions Creating Orphaned D3 Instances
**What goes wrong:** Astro view transitions clone DOM nodes. If D3 creates elements in the old page, they persist as ghosts.
**Why it happens:** View transition API snapshots old DOM before cleanup, React unmount may not fire.
**How to avoid:** SVG cleanup on both mount AND unmount (confirmed pattern from 48-03). Use `client:visible` which naturally handles this since the island is recreated on each navigation.
**Warning signs:** Chart elements from previous page visible briefly during transition.

### Pitfall 7: ResizeObserver Causing Infinite Loops
**What goes wrong:** Resizing the chart container triggers a ResizeObserver callback that itself changes the container size, creating an infinite loop.
**Why it happens:** D3 re-render changes SVG height, which triggers ResizeObserver again.
**How to avoid:** Only respond to width changes (use `Math.round(entry.contentRect.width)` comparison). Debounce the handler. Never change the container's width in the callback.
**Warning signs:** Browser performance warning: "ResizeObserver loop limit exceeded".

### Pitfall 8: Discrete PMF Rendering Misalignment
**What goes wrong:** Bar stems for binomial/Poisson PMF are offset from integer tick marks.
**Why it happens:** D3 scaleLinear maps continuous values. If the x domain doesn't align with integer tick positions, bars shift.
**How to avoid:** Use `scaleBand` or ensure `scaleLinear` domain starts/ends at integers. Render bars at exact integer positions `x(k)`.
**Warning signs:** PMF bars not centered on integer x-axis ticks.

## Code Examples

### DistributionExplorer.tsx Core Structure
```typescript
// Source: Synthesized from existing DistributionExplorerStub.tsx pattern + distributions.json schema
import { useEffect, useRef, useState, useCallback } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line, area, curveBasis, curveStepAfter } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { evalDistribution, getXDomain } from '../../lib/eda/math/distribution-math';

interface Parameter {
  name: string;
  symbol: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

interface Props {
  distributionId: string;
  parameters: Parameter[];
  title: string;
  isDiscrete?: boolean;
}

export default function DistributionExplorer({ distributionId, parameters, title, isDiscrete }: Props) {
  const pdfRef = useRef<SVGSVGElement>(null);
  const cdfRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize state from parameter defaults
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(parameters.map(p => [p.name, p.default]))
  );

  const updateParam = useCallback((name: string, value: number) => {
    setParams(prev => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    if (!pdfRef.current || !cdfRef.current) return;
    // Render both PDF and CDF charts using D3
    renderChart(pdfRef.current, 'pdf', distributionId, params, isDiscrete);
    renderChart(cdfRef.current, 'cdf', distributionId, params, isDiscrete);
    return () => {
      // Cleanup on unmount (view transition safety)
      if (pdfRef.current) select(pdfRef.current).selectAll('*').remove();
      if (cdfRef.current) select(cdfRef.current).selectAll('*').remove();
    };
  }, [params, distributionId, isDiscrete]);

  return (
    <div ref={containerRef}>
      {/* Parameter sliders */}
      <div className="flex flex-wrap gap-4 mb-4">
        {parameters.map(p => (
          <label key={p.name} className="flex flex-col gap-1 text-sm min-w-[140px]">
            <span>{p.symbol}: {params[p.name]}</span>
            <input
              type="range"
              min={p.min} max={p.max} step={p.step}
              value={params[p.name]}
              onChange={e => updateParam(p.name, parseFloat(e.target.value))}
            />
          </label>
        ))}
      </div>
      {/* Dual chart layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4>PDF</h4>
          <svg ref={pdfRef} viewBox="0 0 400 250" style={{ width: '100%', maxWidth: 500 }} />
        </div>
        <div>
          <h4>CDF</h4>
          <svg ref={cdfRef} viewBox="0 0 400 250" style={{ width: '100%', maxWidth: 500 }} />
        </div>
      </div>
    </div>
  );
}
```

### distribution-math.ts Dispatch Pattern
```typescript
// Source: Extension of existing distribution-curve.ts math functions
// Reuses erf, gammaFn, lnGamma, lowerIncompleteGammaRatio from distribution-curve.ts

export function evalDistribution(
  id: string,
  type: 'pdf' | 'cdf',
  x: number,
  params: Record<string, number>,
): number {
  switch (id) {
    case 'normal':
      return type === 'pdf' ? normalPDF(x, params.mu, params.sigma)
                            : normalCDF(x, params.mu, params.sigma);
    case 'cauchy':
      return type === 'pdf' ? cauchyPDF(x, params.x0, params.gamma)
                            : cauchyCDF(x, params.x0, params.gamma);
    // ... all 19 distributions
    default:
      return 0;
  }
}

// New distributions to implement:
function cauchyPDF(x: number, x0: number, gamma: number): number {
  return 1 / (Math.PI * gamma * (1 + ((x - x0) / gamma) ** 2));
}
function cauchyCDF(x: number, x0: number, gamma: number): number {
  return Math.atan((x - x0) / gamma) / Math.PI + 0.5;
}
// ... similar for weibull, lognormal, beta, f-distribution, etc.
```

### Dynamic Route Pattern (from existing [slug].astro)
```astro
---
import { getCollection } from 'astro:content';
import katex from 'katex';
import DistributionPage from '../../../components/eda/DistributionPage.astro';
import DistributionExplorer from '../../../components/eda/DistributionExplorer.tsx';
import { generateDistributionCurve } from '../../../lib/eda/svg-generators';
import { distributionUrl } from '../../../lib/eda/routes';

export async function getStaticPaths() {
  const distributions = await getCollection('edaDistributions');
  return distributions.map(dist => ({
    params: { slug: dist.data.slug },
    props: { distribution: dist.data },
  }));
}

const { distribution } = Astro.props;
const isDiscrete = ['binomial', 'poisson'].includes(distribution.id);
const defaultParams = Object.fromEntries(
  distribution.parameters.map(p => [p.name, p.default])
);

// Static SVG fallback (DIST-18)
const pdfSvg = generateDistributionCurve({
  type: 'pdf', distribution: distribution.id, params: defaultParams
});
const cdfSvg = generateDistributionCurve({
  type: 'cdf', distribution: distribution.id, params: defaultParams
});

// Pre-render KaTeX formulas at build time
const pdfFormulaHtml = katex.renderToString(distribution.pdfFormula, {
  displayMode: true, throwOnError: false
});
const cdfFormulaHtml = katex.renderToString(distribution.cdfFormula, {
  displayMode: true, throwOnError: false
});
---
<DistributionPage ...>
  <Fragment slot="fallback">
    <div class="distribution-fallback" set:html={pdfSvg + cdfSvg} />
  </Fragment>
  <Fragment slot="explorer">
    <DistributionExplorer
      client:visible
      distributionId={distribution.id}
      parameters={distribution.parameters}
      title={distribution.title}
      isDiscrete={isDiscrete}
    />
  </Fragment>
  <Fragment slot="formulas">
    <div set:html={pdfFormulaHtml} />
    <div set:html={cdfFormulaHtml} />
  </Fragment>
</DistributionPage>
```

### Landing Page Grid Pattern (from existing technique landing pattern)
```astro
---
import { getCollection } from 'astro:content';
import { generateDistributionCurve } from '../../lib/eda/svg-generators';
import { distributionUrl } from '../../lib/eda/routes';

const distributions = await getCollection('edaDistributions');
---
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
  {distributions.map(dist => {
    const defaultParams = Object.fromEntries(
      dist.data.parameters.map(p => [p.name, p.default])
    );
    const thumbSvg = generateDistributionCurve({
      type: 'pdf',
      distribution: dist.data.id,
      params: defaultParams,
      config: { width: 200, height: 140, margin: { top: 10, right: 10, bottom: 20, left: 25 } },
    });
    return (
      <a href={distributionUrl(dist.data.slug)} class="...">
        <div set:html={thumbSvg} />
        <span>{dist.data.title}</span>
      </a>
    );
  })}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full d3 import (280KB) | D3 micro-modules (17KB gzipped) | ESM standard since d3 v5+ | 94% smaller bundle for distribution pages |
| client:load | client:visible | Established in Phase 48 | D3 JS only downloads when user scrolls to chart |
| Inline distribution math | Shared distribution-math.ts | Phase 53 (new) | Single source of truth for 19 distributions |
| DistributionExplorerStub.tsx | DistributionExplorer.tsx | Phase 53 (new) | Stub was proof-of-concept, full explorer replaces it |

**Deprecated/outdated:**
- `DistributionExplorerStub.tsx`: Will be replaced by the full `DistributionExplorer.tsx`. The test page at `/eda/test-d3-isolation.astro` can remain for regression testing or be updated to use the real component.

## Math Implementation Inventory

### Already Implemented (in distribution-curve.ts)
| Distribution | PDF | CDF | Notes |
|-------------|-----|-----|-------|
| Normal | normalPDF | normalCDF | Uses erf (A&S 7.1.26) |
| Exponential | exponentialPDF | exponentialCDF | Simple closed-form |
| Chi-square | chiSquarePDF | chiSquareCDF | Uses gammaFn + lowerIncompleteGammaRatio |
| Uniform | uniformPDF | uniformCDF | Piecewise closed-form |
| Student's t | tPDF | tCDF | gammaFn for PDF; Simpson integration for CDF |
| Gamma | gammaPDF | gammaCDF | Uses gammaFn + lowerIncompleteGammaRatio |

### Need Implementation (new in distribution-math.ts)
| Distribution | PDF Complexity | CDF Complexity | Key Dependencies |
|-------------|----------------|----------------|-----------------|
| Cauchy | Trivial (closed-form) | Trivial (arctan) | None |
| Weibull | Simple (closed-form) | Simple (closed-form) | None |
| Lognormal | Simple | Simple | erf (existing) |
| Extreme Value (Gumbel) | Simple (closed-form) | Simple (exp-exp) | None |
| Double Exponential (Laplace) | Simple (closed-form) | Simple (piecewise) | None |
| Beta | Medium | Medium | gammaFn + regularizedBeta (NEW) |
| F-distribution | Medium | Medium | gammaFn + regularizedBeta (NEW) |
| Power Normal | Simple | Simple | normalPDF + normalCDF (existing) |
| Power Lognormal | Simple | Simple | normalPDF + normalCDF (existing) |
| Fatigue Life (Birnbaum-Saunders) | Medium | Simple | normalPDF + normalCDF (existing) |
| Tukey-Lambda | Medium (numerical) | Medium (inversion) | Quantile function sweep |
| Binomial | Medium | Medium (summation) | lnGamma for log-binomial coefficient |
| Poisson | Simple | Simple (summation) | lnGamma for log-factorial |

### New Math Functions Required
1. **regularizedBeta(x, a, b)**: Regularized incomplete beta function I_x(a,b). Follow same pattern as existing `lowerIncompleteGammaRatio` -- series expansion for small x, continued fraction (Lentz's method) for large x. Needed by beta and F distributions.
2. **lnBinomialCoeff(n, k)**: `lnGamma(n+1) - lnGamma(k+1) - lnGamma(n-k+1)`. For binomial PMF.
3. **tukeyLambdaQuantile(F, lambda)**: `(F^lambda - (1-F)^lambda) / lambda` with lambda=0 special case (logistic).

## Open Questions

1. **Static fallback hiding strategy**
   - What we know: The static SVG (DIST-18) must be visible before JS loads. The D3 explorer replaces it on hydration.
   - What's unclear: Should the static SVG be hidden via a class toggle when the React island mounts, or should they be in separate containers where the explorer naturally overlays?
   - Recommendation: Use a pattern where the static SVG has a data attribute like `data-distribution-fallback`, and the React island's useEffect adds a `hidden` class to it. This ensures no-JS users always see the static version. Simple CSS: `.distribution-fallback:has(+ .distribution-explorer.hydrated) { display: none; }` or explicit DOM manipulation in the React component.

2. **t-distribution CDF accuracy**
   - What we know: Current implementation uses Simpson's rule with 400 steps from -40 to x. This works for build-time rendering.
   - What's unclear: Is 400 steps performant enough for real-time slider updates at 60fps?
   - Recommendation: Profile it. If too slow, switch to the regularized incomplete beta approach: `t_CDF(x,nu) = 1 - 0.5 * I_{nu/(nu+x^2)}(nu/2, 0.5)` for x >= 0, which converges faster. Since regularizedBeta is needed anyway for beta/F distributions, this is a natural optimization.

3. **ResizeObserver for responsive chart width**
   - What we know: Charts use viewBox so they scale automatically via CSS.
   - What's unclear: Do we need ResizeObserver at all, or is CSS-based responsive sizing sufficient?
   - Recommendation: Start without ResizeObserver. The viewBox approach (proven across all 13 existing generators) handles responsive sizing via CSS. Only add ResizeObserver if aspect ratio needs to change based on container width (unlikely for this use case).

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Direct reading of all relevant source files:
  - `src/components/eda/DistributionExplorerStub.tsx` -- proven D3 React island pattern
  - `src/data/eda/distributions.json` -- all 19 distribution entries with parameters
  - `src/lib/eda/svg-generators/distribution-curve.ts` -- existing 6-distribution math + SVG generation
  - `src/lib/eda/math/statistics.ts` -- pure math functions
  - `src/lib/eda/schema.ts` -- Zod schemas for distribution data
  - `src/content.config.ts` -- edaDistributions collection registered
  - `src/pages/eda/techniques/[slug].astro` -- established dynamic route pattern
  - `src/pages/eda/quantitative/[slug].astro` -- established dynamic route with KaTeX
  - `src/layouts/EDALayout.astro` -- conditional KaTeX CSS loading
  - `src/components/eda/TechniquePage.astro` -- slot-based page template
  - `src/lib/eda/routes.ts` -- distributionUrl() already defined
  - `package.json` -- all D3 micro-modules already installed
  - `astro.config.mjs` -- React integration configured

### Secondary (MEDIUM confidence)
- **Phase 48 Plan 03** - D3 bundle isolation verification confirmed all D3 patterns work
- **STATE.md decisions** - Locked decisions about D3 micro-modules, client:visible, SVG cleanup, Lanczos gamma, A&S erf

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed, no new packages needed
- Architecture: HIGH - follows established patterns from 4 prior phases (48, 50, 51, 52) with clear analogues
- Pitfalls: HIGH - D3+React lifecycle issues well-documented in codebase (cleanup pattern proven in stub)
- Math: HIGH for 6 existing distributions, MEDIUM for 13 new (follows same patterns but untested)

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable domain -- distribution math and D3 APIs don't change frequently)
