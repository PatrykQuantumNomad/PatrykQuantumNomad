# Feature Research: Dockerfile Analyzer Tool

**Domain:** Interactive browser-based Dockerfile linting and analysis tool on a portfolio site
**Researched:** 2026-02-20
**Confidence:** HIGH
**Scope:** Paste-and-analyze Dockerfile tool at /tools/dockerfile-analyzer with CodeMirror 6 editor, inline annotations, overall score, summary panel, 40 rules based on Hadolint DL codes

---

## Existing Infrastructure (Already Built)

These capabilities exist on patrykgolabek.dev and directly inform what the Dockerfile analyzer can leverage:

| Capability | Where | Reuse Potential |
|------------|-------|-----------------|
| **OG image generation** | `src/lib/og-image.ts` using Satori + Sharp | EXTEND -- generate OG image with score badge or tool branding |
| **SEO component** | `src/components/SEOHead.astro` | DIRECT -- accepts ogImage, ogType, tags, description |
| **JSON-LD structured data** | Multiple JsonLd components | EXTEND -- add SoftwareApplication or WebApplication schema |
| **Tailwind CSS** | Already configured with typography plugin | DIRECT -- style all tool components |
| **Sitemap + RSS** | @astrojs/sitemap, @astrojs/rss | DIRECT -- new page auto-included |
| **Astro island architecture** | React integration via @astrojs/react | DIRECT -- CodeMirror + analyzer as a React island (client:load) |
| **GSAP animations** | ScrollTrigger, scroll-animations | OPTIONAL -- could animate score reveal, but keep tool functional-first |
| **BreadcrumbJsonLd** | `src/components/BreadcrumbJsonLd.astro` | DIRECT -- breadcrumbs for /tools/dockerfile-analyzer/ |

---

## How Dockerfile Linters Work (Ecosystem Analysis)

### Parsing Approach

All major Dockerfile linters follow the same fundamental pattern:

1. **Parse Dockerfile into AST** -- The Dockerfile text is parsed into an Abstract Syntax Tree representing each instruction (FROM, RUN, COPY, etc.) with line numbers, arguments, and metadata.
2. **Run rules against AST nodes** -- Each rule inspects specific instruction types. A "pin your base image version" rule checks FROM nodes. A "don't use sudo" rule checks RUN nodes for sudo commands.
3. **Collect diagnostics** -- Each violation produces a diagnostic with: line number, rule code, severity, human-readable message, and optionally a fix suggestion.
4. **Present results** -- Diagnostics are displayed to the user grouped by severity, annotated inline, or both.

**Key technical insight:** The `dockerfile-ast` npm package (by rcjsuen, used in the Dockerfile Language Server for VS Code) parses Dockerfiles into an AST in TypeScript and is browser-compatible when bundled. This is the correct parser for this project -- it handles multi-stage builds, comments, escape characters, and all standard Dockerfile instructions.

### Existing Tools Analyzed

| Tool | Engine | Rules | Browser? | Scoring? | UX Pattern |
|------|--------|-------|----------|----------|------------|
| **Hadolint** (hadolint.github.io) | Haskell binary, AST + ShellCheck | 34+ DL codes, 6 severity levels | Web wrapper only | No score | Two-pane: editor left, results right. Paste, click Lint, see list. |
| **fromlatest.io** (dockerfilelint) | Node.js, instruction-level parsing | ~20 rules, all enabled by default | Yes (React SPA) | No score | Two-pane: editor left, annotated results right. Click "Lint" button. |
| **EaseCloud Linter** | JavaScript, client-side only | 20+ rules | Yes (fully browser-based) | No score | Single-pane: editor with color-coded results below. Real-time as-you-type. Severity: error (red), warning (yellow), info (blue). |
| **DockAdvisor** | Go, AST-based | 60+ rules | WASM module available | **Yes: 0-100** | CLI primary. Score = 100 - (errors x 15) - (warnings x 5). Floor at 0. |
| **Hadolint commercial** (hadolint.com) | Same Haskell engine | Same DL codes | Online demo | No score | Marketing site with paste-and-lint demo. Same two-pane pattern. |

**Key findings:**
- Only DockAdvisor provides a numerical score. Every other tool just lists issues.
- No existing tool provides inline annotations IN the editor (gutter markers or underlines). They all use a separate results panel.
- No existing tool provides the "expert explanation" angle -- they all give generic rule descriptions.
- ShellCheck integration (linting bash inside RUN) is what makes Hadolint stand out from other Dockerfile linters, but it requires a Haskell runtime not available in-browser.

---

## Result Presentation Patterns (UX Research)

### Pattern 1: Two-Pane Split (Hadolint, fromlatest.io)

```
+------------------+------------------+
|                  |                  |
|   Dockerfile     |    Results       |
|   Editor         |    List          |
|                  |                  |
+------------------+------------------+
```

**How it works:** Editor on the left, results panel on the right. Each result shows line number, rule code, severity icon, and message. Clicking a result does NOT highlight the corresponding line in the editor (missed opportunity).

**Pros:** Clean separation, familiar IDE layout, results always visible.
**Cons:** Disconnected -- users must mentally map line numbers to code. No inline feedback.

### Pattern 2: Stacked Results Below (EaseCloud)

```
+------------------------------------+
|          Dockerfile Editor         |
+------------------------------------+
|          Results Panel             |
|  [Error] Line 3: Use specific tag |
|  [Warn]  Line 7: Pin versions     |
+------------------------------------+
```

**How it works:** Editor on top, scrollable results below. Results are color-coded by severity. Each result is expandable for detailed recommendations.

**Pros:** Full-width editor, natural top-to-bottom reading flow, mobile-friendly.
**Cons:** Results push below the fold on smaller screens.

### Pattern 3: Inline Annotations (VS Code / CodeMirror pattern -- NOT used by any existing Dockerfile web linter)

```
+------------------------------------+
| 1  FROM ubuntu:latest              |
|    ~~~~~ [warn] Pin base image tag |
| 2  RUN apt-get update              |
|    ~~~~~~ [error] Combine with     |
|           apt-get install          |
+------------------------------------+
```

**How it works:** Squiggly underlines directly on problematic code, gutter icons per line, hover for details. This is the VS Code / IDE pattern users know from their daily editors.

**Pros:** Immediate spatial connection between code and feedback. Most intuitive. Highest information density.
**Cons:** Can feel cluttered with many issues. Requires a proper code editor component (CodeMirror 6 provides this natively).

### Pattern 4: Score + Summary + Inline (The Differentiator -- What We Should Build)

```
+------+-----------------------------+
| 72/A |     Dockerfile Editor       |
| Score|  (with inline annotations)  |
+------+-----------------------------+
|  Summary Panel                     |
|  Security: 3 issues | Perf: 2     |
|  [Expandable issue list]           |
+------------------------------------+
```

**How it works:** Prominent score badge at top, editor with inline CodeMirror diagnostics, collapsible summary panel below grouped by category. This combines the best of all patterns and is what NO existing Dockerfile linter does.

---

## Scoring Algorithm Approaches

### Approach 1: Flat Penalty (DockAdvisor)

**Formula:** `Score = 100 - (errors * 15) - (warnings * 5)`, floor at 0.

| Aspect | Assessment |
|--------|------------|
| Simplicity | HIGH -- trivial to implement and explain |
| Fairness | LOW -- a 3-line Dockerfile with 1 error scores 85, a 50-line Dockerfile with 1 error also scores 85. Penalizes complex Dockerfiles unfairly. |
| Gaming | Easy to game -- add no-op lines and the score doesn't change |
| Recommendation | **Do not use.** Too simplistic for a tool positioning itself as expert-level. |

### Approach 2: Statement-Normalized (Pylint)

**Formula:** `Score = 10.0 - ((5 * errors + warnings + refactors + conventions) / total_statements) * 10`

| Aspect | Assessment |
|--------|------------|
| Simplicity | MEDIUM -- requires counting "statements" (instructions in Dockerfile context) |
| Fairness | MEDIUM -- normalizes by code size, so larger Dockerfiles aren't penalized more |
| Gaming | Harder to game -- adding empty lines doesn't change statement count |
| Recommendation | **Better, but still one-dimensional.** A single number doesn't tell users WHERE to focus. |

### Approach 3: Category-Weighted Score (Recommended)

**Formula:** Score = weighted average of category sub-scores, where each category has a weight reflecting its importance.

```
Categories (recommended for Dockerfiles):
  Security     (weight: 30%) -- running as root, secrets in ENV, sudo usage
  Efficiency   (weight: 25%) -- layer consolidation, multi-stage builds, cache optimization
  Reliability  (weight: 20%) -- version pinning, deterministic builds
  Maintainability (weight: 15%) -- deprecated instructions, formatting, clarity
  Best Practice (weight: 10%) -- metadata, healthchecks, minor conventions

Per-category score = 100 * (1 - (category_violations / category_total_rules_applicable))
Overall score = sum(category_weight * category_score)
```

| Aspect | Assessment |
|--------|------------|
| Simplicity | MEDIUM -- more implementation work, but the output is richer |
| Fairness | HIGH -- categories normalize by rule applicability, not just raw count |
| Informativeness | HIGH -- users see "Security: 95%, Efficiency: 60%" and know exactly where to focus |
| Recommendation | **Use this.** It provides the richest feedback and matches the "expert architect" positioning. |

### Approach 4: Letter Grade with Thresholds

Layer on top of any numerical score. Maps numbers to letters for instant comprehension.

```
A+ = 95-100    A = 90-94    A- = 85-89
B+ = 80-84     B = 75-79    B- = 70-74
C+ = 65-69     C = 60-64    C- = 55-59
D  = 40-54     F  = 0-39
```

**Recommendation:** Use letter grades as the primary display WITH the numerical score as secondary detail. "B+ (82/100)" is more memorable and shareable than just "82". People share "I got an A on the Dockerfile analyzer" not "I got 93 on the Dockerfile analyzer."

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that visitors to a Dockerfile linting tool assume exist. Missing any of these makes the tool feel amateur or incomplete. Reference points: Hadolint online, fromlatest.io, EaseCloud Linter, DockAdvisor.

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| T1 | **Paste-and-analyze workflow** | Every online linter follows this pattern: paste code, click button, see results. This is the core interaction. Without a clear "Analyze" action, users don't know how to use the tool. | LOW | CodeMirror editor | Single button click. No account, no config, no friction. |
| T2 | **Syntax-highlighted editor** | Users expect a code editor, not a plain textarea. Syntax highlighting for Dockerfiles (FROM, RUN, COPY keywords colored) establishes credibility and makes the tool feel professional. CodeMirror 6 provides this out of the box with its Dockerfile language mode or a simple custom highlighter. | MEDIUM | CodeMirror 6, @codemirror/lang-dockerfile or custom mode | CodeMirror 6 has a Docker language support package. Verify availability; if not, a custom StreamLanguage highlighter for Dockerfile keywords is ~50 lines. |
| T3 | **Results list with severity levels** | Every linter categorizes findings by severity. Users expect at minimum error/warning/info distinctions with color coding (red/yellow/blue). Without severity, all issues look equally important and users don't know what to fix first. | LOW | Rule engine output | 3 severity levels: error (red), warning (amber), info (blue). Match CodeMirror 6's built-in severity: "error", "warning", "hint". |
| T4 | **Line number association** | Each finding must reference the specific line(s) in the Dockerfile where the issue occurs. Every existing tool does this. Without line numbers, users have to manually search for the problematic instruction. | LOW | dockerfile-ast parser (provides line ranges) | dockerfile-ast gives `Range` objects with start/end line and character positions -- maps directly to CodeMirror Diagnostic `from`/`to`. |
| T5 | **Rule code identifiers** | Hadolint's DL codes (DL3000-DL3034) are industry standard. Users who know Hadolint expect to see familiar codes. DevOps teams reference these codes in CI configs and `.hadolint.yaml` ignore lists. Using compatible codes builds trust. | LOW | Rule definitions | Use DL-prefixed codes matching Hadolint where rules overlap. Add custom codes (e.g., PG-XXX for Patryk-original rules) for rules beyond Hadolint's coverage. |
| T6 | **Actionable fix suggestions** | EaseCloud and DockAdvisor provide specific "what to do instead" guidance for each finding. A rule saying "Don't use latest tag" is less useful than "Pin to a specific version like ubuntu:22.04 instead of ubuntu:latest." | LOW | Content authoring per rule | Each of the 40 rules needs: title, description, fix suggestion, severity, category. This is content work, not code work. |
| T7 | **Category grouping in results** | DockAdvisor groups rules by instruction type (FROM, RUN, COPY, etc.) or concern (security, performance). EaseCloud groups by severity. Users need some organizational structure when viewing 10+ findings. | LOW | Rule metadata | Group by concern category (Security, Efficiency, Reliability, Maintainability, Best Practice) -- aligns with the scoring algorithm and the "architect perspective" brand. |
| T8 | **Responsive layout** | The tool must work on tablets and phones. A DevOps engineer might pull up the tool on their phone during a code review discussion. Two-pane layouts must collapse to stacked on mobile. | MEDIUM | Tailwind responsive utilities | Editor stacks above results on mobile. Score badge stays visible at top. |
| T9 | **Client-side only execution** | Every modern browser-based linter emphasizes "your code never leaves your browser" for privacy/security. EaseCloud prominently displays this. For a Dockerfile tool where users may paste production configs with hostnames, ports, or even secrets, this is essential trust-building. | LOW (architectural decision) | No backend needed | Static site architecture enforces this. Prominent "Analyzed in your browser. Your Dockerfile never leaves your device." message. |
| T10 | **Clear empty state** | When the user first lands on the page, the editor should not be blank and confusing. Show a sample Dockerfile with intentional issues, or a clear placeholder prompt explaining what to do. fromlatest.io shows a sample Dockerfile by default. | LOW | Sample Dockerfile content | Pre-populate with a ~15 line Dockerfile containing 5-6 deliberate issues across all categories. "Paste your Dockerfile here or analyze this example." |

### Differentiators (Competitive Advantage)

Features that set this tool apart from Hadolint online, fromlatest.io, and EaseCloud. These are what make the tool worth bookmarking, sharing, and returning to. The core differentiator is the "expert Kubernetes architect" perspective -- not generic rule descriptions, but the kind of feedback you'd get from a senior engineer reviewing your Dockerfile in a PR.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D1 | **Inline CodeMirror annotations** | NO existing Dockerfile web linter puts squiggly underlines directly in the editor. They all use separate result panels. CodeMirror 6's `@codemirror/lint` provides gutter markers, inline underlines, and a diagnostics panel natively. This is the VS Code experience in a browser -- instantly more professional than any competitor. | MEDIUM | CodeMirror 6 @codemirror/lint extension | Return `Diagnostic[]` from analyzer. CodeMirror handles rendering: red/yellow/blue underlines, gutter dots, hover tooltips, Ctrl+Shift+M panel. The analyzer just needs to return `{from, to, severity, message}` objects. |
| D2 | **Overall quality score (0-100 + letter grade)** | Only DockAdvisor provides a score, and it's a simplistic flat penalty. A category-weighted score with a letter grade (A+ through F) is immediately shareable. "I got a B+ on the Dockerfile analyzer" is a conversation starter. The score is the primary hook for repeat visits ("let me improve my score"). | MEDIUM | Category-weighted scoring algorithm, all rules implemented | Display prominently: large letter grade badge + numeric score. Color-coded (green for A, yellow for B, orange for C, red for D/F). Animate score reveal on analysis. |
| D3 | **Category breakdown panel** | Show sub-scores per category: "Security: 95% | Efficiency: 60% | Reliability: 80%". No existing tool does this. Users see exactly where their Dockerfile is strong and weak. This is the "architect's perspective" -- not just "here are your issues" but "here's how your Dockerfile profiles across dimensions that matter in production." | LOW | D2 (scoring algorithm), rule categorization | 5 horizontal bars or radial segments. Each category shows: score, issue count, and can expand to show the individual findings in that category. |
| D4 | **Expert-voice explanations** | Instead of generic "Don't use latest tag," provide the architect's perspective: "In production Kubernetes clusters, :latest causes non-deterministic deployments. When a node auto-scales and pulls a different version than what's running, you get subtle runtime failures that are hell to debug. Pin your image to a specific SHA digest for critical services, or at minimum a semver tag." THIS is the content differentiator. | LOW (per-rule content authoring, not code) | T6 (fix suggestions) | Each rule has two levels: (1) short message for inline display, (2) expanded "Why this matters" expert explanation for the detail panel. The expert voice is the SEO goldmine -- these explanations become indexable content. |
| D5 | **Shareable score badge** | Generate a visual score badge (SVG or canvas-rendered PNG) that users can download or copy. "Dockerfile Score: A+ (97/100)" with the site URL watermark. Similar to how Website Grader, Lighthouse, and PageSpeed Insights provide shareable score cards. This is the viral loop. | MEDIUM | D2 (score), html-to-image or SVG generation | Render a styled card: score badge + category breakdown + "Analyzed by patrykgolabek.dev/tools/dockerfile-analyzer". Download as PNG button. Same html-to-image pattern as Beauty Index share controls. |
| D6 | **Pre-loaded example Dockerfiles** | Instead of just one empty editor, offer 3-4 clickable examples: "Basic Web App," "Multi-stage Go Build," "Python ML Pipeline," "Bad Practices (everything wrong)." Users can instantly see the tool in action without pasting their own code. Each example showcases different rule categories. This lowers the barrier to first interaction. | LOW | Sample Dockerfile content | Dropdown or button group above the editor: "Try an example: [Web App] [Go Build] [ML Pipeline] [Anti-patterns]". Clicking loads the example and auto-analyzes. |
| D7 | **Rule documentation pages** | Each of the 40 rules gets a permanent URL: `/tools/dockerfile-analyzer/rules/DL3006`. These pages explain the rule, show before/after code, provide the expert explanation, and link to official Docker docs. This is a massive SEO play -- 40 indexable pages targeting long-tail queries like "dockerfile pin base image version" or "hadolint DL3006 explained." | HIGH | 40 rule content pages, Astro routing | Content collection for rules. Each rule: code, title, severity, category, short description, expert explanation, before/after code examples, related rules, external references. Can be phased -- launch tool first, add rule pages later. |
| D8 | **Keyboard-first interaction** | Ctrl+Enter (or Cmd+Enter) to analyze. Ctrl+Shift+M to toggle diagnostics panel. Tab through findings. This is the power-user UX that makes the tool feel like an IDE extension, not a toy web app. CodeMirror 6 supports custom keybindings natively. | LOW | CodeMirror keymap extension | Define keybindings: Cmd/Ctrl+Enter = analyze, Escape = clear results. Show keyboard shortcut hints in the UI. |
| D9 | **URL state for sharing** | Encode the Dockerfile content (or a hash/compressed version) in the URL so users can share links to specific analysis results. "Check out this Dockerfile analysis: [link]." This enables sharing in Slack, GitHub issues, and blog posts. | MEDIUM | URL compression (lz-string or similar) | Use `lz-string` to compress Dockerfile text into URL hash. On page load, decompress and auto-analyze. Keep URLs under 2000 chars for compatibility. Show "Copy link to results" button. |
| D10 | **Dark/light theme matching** | The tool should respect the site's existing theme toggle. CodeMirror 6 supports theming. The editor should feel native to the site, not like an embedded third-party widget. | LOW | Existing ThemeToggle component, CodeMirror theme extension | Use CodeMirror's `oneDark` theme for dark mode, a light theme for light mode. React to the site's theme change event. |

### Anti-Features (Explicitly NOT Building)

| # | Anti-Feature | Why Tempting | Why Avoid | What to Do Instead |
|---|--------------|-------------|-----------|-------------------|
| A1 | **AI-powered analysis** | "Use AI to provide context-aware feedback!" | Contradicts the core positioning: "professional feedback from a 17+ year Kubernetes architect, not AI." The moment you add AI, the tool becomes one of dozens. The human expertise angle is the differentiator. Also requires API calls (backend, costs, latency). | Every rule explanation is hand-authored by a human expert. State this prominently: "40 rules based on 17 years of production Kubernetes experience." |
| A2 | **ShellCheck integration for RUN commands** | "Hadolint's killer feature is linting bash inside RUN instructions." | ShellCheck is a Haskell binary. There is no browser-compatible JavaScript implementation. WASM ports exist but are heavy (~2MB) and add complexity. The ROI is low for a portfolio tool vs. the engineering effort. | Focus on Dockerfile-level rules only. Mention in the tool description that for shell script linting inside RUN, users should use Hadolint CLI or ShellCheck directly. Link to both. |
| A3 | **Auto-fix / one-click repair** | "Let users click 'Fix' and automatically rewrite the Dockerfile." | Dramatically increases complexity. Each rule needs a safe AST transformation. Edge cases are numerous (multi-line RUN commands, heredoc syntax, build args). Risk of generating broken Dockerfiles erodes trust more than manual fixes. | Show "before/after" code snippets in the fix suggestion. Users copy-paste the fix. This is safer and still helpful. |
| A4 | **User accounts and saved Dockerfiles** | "Let users save their Dockerfiles and track improvement over time." | Requires a backend, database, authentication. Transforms a simple static tool into a SaaS product. Way out of scope for a portfolio project. | URL state (D9) provides the sharing use case. For tracking improvement, users can re-paste and re-analyze. The score is the tracking mechanism. |
| A5 | **Real-time linting as you type** | "Lint on every keystroke for immediate feedback!" | Creates a jarring experience when the user is mid-edit. Constant red squigglies appearing while typing is distracting. Also creates performance pressure -- analysis on every keystroke must be <16ms to avoid frame drops. | Analyze on button click (or Ctrl+Enter). This gives the user control over when they see feedback. The "Analyze" button is a deliberate UX choice that creates a satisfying "moment of truth." |
| A6 | **CI/CD integration or API endpoint** | "Let users call the analyzer from their pipelines." | Static site cannot serve API endpoints. Would require a separate service. Hadolint already owns the CI/CD Dockerfile linting space completely. | Position the tool as a learning/review tool, not a CI gate. "Review your Dockerfile before committing" not "Add to your pipeline." Link to Hadolint for CI use. |
| A7 | **Dockerfile generation or scaffolding** | "Generate a Dockerfile from user inputs." | Completely different tool with different UX. Dockerfile generators already exist (EaseCloud has one). Dilutes the analyzer's focused value proposition. | Stay focused: analyze and educate. If users need to generate Dockerfiles, link to existing generators. |

---

## Feature Dependencies

```
[CodeMirror 6 Editor Setup] (foundation -- everything renders here)
    |
    +---> [dockerfile-ast Parser Integration]
    |         |
    |         +---> [Rule Engine (40 rules)]
    |         |         |
    |         |         +---> [T3: Severity Levels]
    |         |         +---> [T4: Line Number Association]
    |         |         +---> [T5: Rule Codes]
    |         |         +---> [T6: Fix Suggestions]
    |         |         +---> [T7: Category Grouping]
    |         |         +---> [D4: Expert Explanations]
    |         |         |
    |         |         +---> [D2: Category-Weighted Score]
    |         |         |         +---> [D3: Category Breakdown Panel]
    |         |         |         +---> [D5: Shareable Score Badge]
    |         |         |
    |         |         +---> [D1: Inline CodeMirror Annotations]
    |         |
    |         +---> [T1: Paste-and-Analyze Workflow]
    |                   +---> [D6: Pre-loaded Examples]
    |                   +---> [D8: Keyboard Shortcuts]
    |                   +---> [D9: URL State for Sharing]
    |
    +---> [T2: Syntax Highlighting] (CodeMirror lang mode)
    +---> [D10: Dark/Light Theme] (CodeMirror theme extension)

[T8: Responsive Layout] -- cross-cutting concern
[T9: Client-Side Only] -- architectural decision, not a feature to build
[T10: Empty State / Sample Dockerfile] -- content, loaded into editor

[D7: Rule Documentation Pages] -- INDEPENDENT, can ship after tool launch
    (40 Astro pages, content collection, SEO play)
```

### Dependency Notes

- **CodeMirror 6 is the foundation.** Every visual feature depends on the editor being set up with the correct extensions (@codemirror/lint, language mode, theme, keybindings). Get this right first.
- **dockerfile-ast + Rule Engine is the core logic.** The 40 rules and their categorization drive everything downstream: diagnostics, scores, categories, and all content.
- **D2 (Scoring) is the engagement hook.** The score is what makes users come back, share, and improve. It should be prominent and satisfying.
- **D7 (Rule Documentation Pages) is the biggest SEO payoff but fully independent.** These 40 pages can ship weeks after the tool launches. They represent 40 new indexable URLs targeting long-tail DevOps search queries.
- **D1 (Inline Annotations) is the key UX differentiator** but comes "free" with CodeMirror 6's @codemirror/lint extension once the rule engine returns proper Diagnostic objects.

---

## What Makes a Linter Tool "Sticky" vs Forgettable

Based on analysis of successful developer tools (ESLint, Pylint, Lighthouse, Website Grader, PageSpeed Insights):

### Sticky Patterns

1. **A score to beat.** Lighthouse's 0-100 score per category drives repeat visits. People share "I got 100 on Lighthouse" like a badge of honor. The Dockerfile score serves the same purpose. Users will paste, improve, re-paste, and chase the A+.

2. **Shareable results.** Website Grader built its entire marketing flywheel on shareable score reports. HubSpot reports analyzing over 2 million sites. The viral loop: user pastes -> gets score -> shares score -> friend clicks link -> pastes their own Dockerfile -> shares their score.

3. **Expert-level explanations that teach.** ESLint's rule documentation pages are some of the most-linked developer resources on the web. Each rule page is a mini-tutorial. The 40 rule documentation pages (D7) serve this purpose -- they become the long-tail SEO entry points that bring users to the tool.

4. **Instant gratification.** The analysis must complete in <500ms. No loading spinners, no "processing" messages. Paste, click, results. The speed itself is a feature. Browser-based analysis with dockerfile-ast + 40 rules should complete in <50ms.

5. **"Copy link to results" for team sharing.** When a DevOps engineer finds an issue in a colleague's Dockerfile, they want to send a link, not a screenshot. URL state (D9) enables this.

### Forgettable Patterns

1. **Generic advice.** "Use specific tags" without explaining WHY or what the production consequences are. This is what every existing tool does.
2. **No score.** Without a number, there's nothing to improve toward and nothing to share.
3. **Results on a separate page.** If the user has to navigate away from their code to see results, the tool feels broken.
4. **Slow analysis.** Any perceptible delay kills the "tool" feel and makes it feel like a "service."

---

## CodeMirror 6 Lint Integration (Technical Pattern)

CodeMirror 6's `@codemirror/lint` extension provides three display mechanisms out of the box:

1. **Inline underlines** -- squiggly underlines on problematic text ranges (error=red, warning=orange, hint=blue)
2. **Gutter markers** -- colored dots in the editor gutter indicating lines with diagnostics
3. **Diagnostics panel** -- a panel below the editor listing all diagnostics (toggled via Ctrl+Shift+M)

**Diagnostic object structure:**
```typescript
interface Diagnostic {
  from: number;      // Start position (character offset)
  to: number;        // End position (character offset)
  severity: "error" | "warning" | "hint";  // CM6 severity levels
  message: string;   // Human-readable description
  actions?: Action[];  // Optional fix actions (buttons in tooltip)
  source?: string;    // Rule source identifier (e.g., "DL3006")
}
```

**Integration pattern:**
```typescript
import { linter, lintGutter, Diagnostic } from "@codemirror/lint";

const dockerfileLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const text = view.state.doc.toString();
  const ast = DockerfileParser.parse(text);
  // Run rules against AST, push Diagnostic objects
  return diagnostics;
});

// Extensions to add to editor
const extensions = [dockerfileLinter, lintGutter()];
```

**Severity mapping (Hadolint -> CodeMirror 6):**

| Hadolint Severity | CodeMirror 6 Severity | Color | Use For |
|---|---|---|---|
| error | "error" | Red | Build failures, security vulnerabilities, invalid syntax |
| warning | "warning" | Amber/Orange | Best practice violations, performance issues |
| info, style | "hint" | Blue | Optimization suggestions, minor conventions |

CodeMirror 6 does NOT have an "info" severity -- use "hint" for informational findings.

---

## Dockerfile Rule Categories (Mapped to Hadolint DL Codes)

Based on analysis of Hadolint's 34+ DL rules, Docker official best practices, OWASP Docker Security Cheat Sheet, and Sysdig's Top 20 Dockerfile best practices:

### Security (Weight: 30% of score)

| Rule Code | Check | Severity | Source |
|-----------|-------|----------|--------|
| DL3002 | Last USER should not be root | error | Hadolint |
| DL3004 | Do not use sudo | warning | Hadolint |
| PG1001 | Secrets in ENV/ARG instructions | error | Custom |
| PG1002 | Running as root without USER instruction | error | Custom |
| PG1003 | Using ADD for remote URLs (use COPY + curl instead) | warning | Docker best practices |
| PG1004 | Exposing privileged ports (<1024) without justification | warning | Custom |

### Efficiency (Weight: 25% of score)

| Rule Code | Check | Severity | Source |
|-----------|-------|----------|--------|
| DL3009 | Delete apt-get lists after install | warning | Hadolint |
| DL3015 | Avoid additional packages with apt-get | warning | Hadolint |
| DL3019 | Use --no-install-recommends with apt-get | warning | Hadolint |
| DL3020 | Use COPY instead of ADD for files | warning | Hadolint |
| DL3025 | Use JSON notation for CMD/ENTRYPOINT | warning | Hadolint |
| PG2001 | Multiple RUN apt-get commands (should combine) | warning | Custom |
| PG2002 | COPY before RUN package install (cache invalidation) | hint | Custom |
| PG2003 | Not using multi-stage builds when build tools detected | hint | Custom |

### Reliability (Weight: 20% of score)

| Rule Code | Check | Severity | Source |
|-----------|-------|----------|--------|
| DL3006 | Always tag the version of an image explicitly | warning | Hadolint |
| DL3007 | Using latest tag | warning | Hadolint |
| DL3008 | Pin versions in apt-get install | warning | Hadolint |
| DL3013 | Pin versions in pip install | warning | Hadolint |
| DL3016 | Pin versions in npm install | warning | Hadolint |
| DL3018 | Pin versions in apk add | warning | Hadolint |
| PG3001 | No HEALTHCHECK instruction | hint | Custom |

### Maintainability (Weight: 15% of score)

| Rule Code | Check | Severity | Source |
|-----------|-------|----------|--------|
| DL3000 | Use absolute WORKDIR | warning | Hadolint |
| DL3003 | Use WORKDIR to switch directories | warning | Hadolint |
| DL3001 | Invalid Dockerfile instruction found | error | Hadolint |
| DL3021 | Use COPY instead of ADD for local files | warning | Hadolint |
| PG4001 | Using deprecated MAINTAINER (use LABEL instead) | hint | Custom |
| PG4002 | Missing LABEL for maintainer metadata | hint | Custom |
| PG4003 | Inconsistent instruction casing | hint | Custom |

### Best Practice (Weight: 10% of score)

| Rule Code | Check | Severity | Source |
|-----------|-------|----------|--------|
| DL3011 | Valid UNIX ports | error | Hadolint |
| DL3012 | Multiple HEALTHCHECK instructions | error | Hadolint |
| DL3022 | COPY --from should reference a named stage | warning | Hadolint |
| DL3023 | COPY --from cannot reference own stage | error | Hadolint |
| PG5001 | Missing .dockerignore advice | hint | Custom |
| PG5002 | CMD and ENTRYPOINT should not both be shell form | warning | Custom |

**Note:** The above is a representative sample. The full 40-rule set should be defined during implementation. Rules prefixed with DL match Hadolint codes. Rules prefixed with PG are custom rules reflecting the architect's experience.

---

## Competitor Feature Matrix

| Feature | Hadolint Online | fromlatest.io | EaseCloud | DockAdvisor | **Dockerfile Analyzer** |
|---------|-----------------|---------------|-----------|-------------|------------------------|
| Browser-based | Yes (web demo) | Yes (React SPA) | Yes (client-side) | WASM option | **Yes (client-side only)** |
| Code editor | Basic textarea | Basic textarea | Textarea | CLI | **CodeMirror 6 with syntax highlighting** |
| Inline annotations | No | No | No | No | **Yes (squiggly underlines + gutter)** |
| Severity levels | 6 levels | 3 levels | 3 levels | 2 levels | **3 levels (error/warning/hint)** |
| Quality score | No | No | No | Yes (0-100) | **Yes (0-100 + letter grade)** |
| Category breakdown | No | No | No | Partial | **Yes (5 categories with sub-scores)** |
| Expert explanations | No | No | Basic | Basic | **Yes (architect-level "why this matters")** |
| Pre-loaded examples | Sample Dockerfile | Sample Dockerfile | No | No | **Yes (4 scenario examples)** |
| Shareable results | No | No | No | No | **Yes (URL state + score badge)** |
| Rule documentation | GitHub wiki | GitHub README | None | Go docs | **Yes (40 dedicated pages, SEO play)** |
| Keyboard shortcuts | No | No | No | N/A (CLI) | **Yes (Cmd+Enter, Ctrl+Shift+M)** |
| Theme support | No | No | No | N/A | **Yes (dark/light matching site theme)** |
| Privacy messaging | No | Minimal | Yes (prominent) | N/A | **Yes (prominent, trust-building)** |

---

## MVP Definition

### Launch With (v1 -- Core Analyzer Tool)

The minimum set to launch a complete, useful Dockerfile analyzer:

- [x] **CodeMirror 6 editor** with Dockerfile syntax highlighting and lint extension
- [x] **T1: Paste-and-analyze** with "Analyze" button and Cmd/Ctrl+Enter shortcut
- [x] **T2: Syntax highlighting** via CodeMirror language mode
- [x] **T3: Severity levels** -- error (red), warning (amber), hint (blue)
- [x] **T4: Line number association** -- each finding linked to source line
- [x] **T5: Rule codes** -- DL and PG prefixed codes
- [x] **T6: Fix suggestions** -- actionable "what to do instead" for each rule
- [x] **T7: Category grouping** -- findings organized by Security/Efficiency/Reliability/Maintainability/Best Practice
- [x] **T8: Responsive layout** -- stacked editor + results on mobile
- [x] **T9: Client-side only** -- prominent privacy message
- [x] **T10: Sample Dockerfile** -- pre-populated example with deliberate issues
- [x] **D1: Inline annotations** -- CodeMirror squiggly underlines + gutter markers
- [x] **D2: Quality score** -- 0-100 with letter grade, category-weighted
- [x] **D3: Category breakdown** -- 5 category sub-scores in summary panel
- [x] **D4: Expert explanations** -- architect-level "why this matters" for each rule
- [x] **D6: Pre-loaded examples** -- 3-4 clickable example Dockerfiles
- [x] **D8: Keyboard shortcuts** -- Cmd+Enter to analyze
- [x] **D10: Dark/light theme** -- match site theme

### Add After Launch (v1.1 -- Shareability & Polish)

Features that maximize the viral loop:

- [ ] **D5: Shareable score badge** -- download PNG of score card
- [ ] **D9: URL state** -- shareable links to specific analysis results
- [ ] **OG image** -- custom OG image showing the tool branding/example score

### Add Later (v2 -- SEO Content Expansion)

The massive long-tail SEO play:

- [ ] **D7: Rule documentation pages** -- 40 dedicated URLs at /tools/dockerfile-analyzer/rules/[code]
- [ ] **Blog post:** "I Analyzed 100 Open Source Dockerfiles -- Here's What I Found" (content marketing)
- [ ] **Cross-links** from existing blog posts about Kubernetes/Docker to the analyzer tool

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| CodeMirror 6 editor setup | CRITICAL | MEDIUM | P0 | v1 |
| dockerfile-ast integration | CRITICAL | MEDIUM | P0 | v1 |
| Rule engine (40 rules) | CRITICAL | HIGH (content + logic) | P0 | v1 |
| T1: Paste-and-analyze | HIGH | LOW | P0 | v1 |
| T2: Syntax highlighting | HIGH | LOW-MEDIUM | P0 | v1 |
| D1: Inline annotations | HIGH | LOW (CM6 provides this) | P0 | v1 |
| D2: Quality score | HIGH | MEDIUM | P1 | v1 |
| D3: Category breakdown | MEDIUM | LOW | P1 | v1 |
| D4: Expert explanations | HIGH | LOW (content authoring) | P1 | v1 |
| T6: Fix suggestions | HIGH | LOW (content authoring) | P1 | v1 |
| T7: Category grouping | MEDIUM | LOW | P1 | v1 |
| D6: Pre-loaded examples | MEDIUM | LOW | P1 | v1 |
| D8: Keyboard shortcuts | MEDIUM | LOW | P1 | v1 |
| D10: Theme matching | MEDIUM | LOW | P1 | v1 |
| T8: Responsive layout | HIGH | MEDIUM | P1 | v1 |
| T9: Client-side messaging | HIGH | LOW | P1 | v1 |
| T10: Sample Dockerfile | MEDIUM | LOW | P1 | v1 |
| T3: Severity levels | HIGH | LOW | P1 | v1 |
| T4: Line association | HIGH | LOW | P1 | v1 |
| T5: Rule codes | MEDIUM | LOW | P1 | v1 |
| D5: Score badge | MEDIUM | MEDIUM | P2 | v1.1 |
| D9: URL state | MEDIUM | MEDIUM | P2 | v1.1 |
| D7: Rule doc pages | HIGH (SEO) | HIGH (40 pages content) | P3 | v2 |

---

## Scoring Algorithm Recommendation (Detailed)

### Recommended: Category-Weighted with Letter Grade

```typescript
interface AnalysisResult {
  score: number;          // 0-100
  grade: string;          // "A+", "A", "B+", etc.
  categories: {
    security:        CategoryScore;
    efficiency:      CategoryScore;
    reliability:     CategoryScore;
    maintainability: CategoryScore;
    bestPractice:    CategoryScore;
  };
  findings: Finding[];
}

interface CategoryScore {
  score: number;          // 0-100
  weight: number;         // 0.30, 0.25, 0.20, 0.15, 0.10
  passed: number;         // rules that passed
  failed: number;         // rules that triggered
  total: number;          // total applicable rules
}

// Scoring formula:
// Per category: score = 100 * (passed / total_applicable)
// If no rules in category apply: score = 100 (no penalty)
// Overall: score = sum(category.score * category.weight)
// Grade: mapped from score using threshold table
```

**Why this approach:**
1. **Normalizes by applicability.** A simple Dockerfile using apk (not apt-get) isn't penalized for not having apt-get cleanup rules pass.
2. **Provides actionable category feedback.** "Your security is great but efficiency needs work" is more useful than "you have 7 warnings."
3. **Weights reflect production impact.** Security issues in production Kubernetes clusters cause actual incidents. Maintainability issues cause developer annoyance. The weights reflect this.
4. **Letter grades are shareable.** "I got a B+" is more memorable than "I got 82."

---

## Sources

### Dockerfile Linter Tools
- [Hadolint GitHub](https://github.com/hadolint/hadolint) -- most popular open-source Dockerfile linter, DL rule codes, 34+ rules
- [Hadolint Online](https://hadolint.github.io/hadolint/) -- web interface, two-pane UX pattern
- [fromlatest.io](https://www.fromlatest.io/) -- browser-based React SPA Dockerfile linter
- [dockerfilelint GitHub](https://github.com/replicatedhq/dockerfilelint) -- Node.js engine behind fromlatest.io
- [EaseCloud Dockerfile Linter](https://www.easecloud.io/tools/docker/dockerfile-linter/) -- client-side only, severity color coding, 20+ rules
- [DockAdvisor GitHub](https://github.com/deckrun/dockadvisor) -- Go linter with 0-100 scoring, 60+ rules
- [Analysis Tools - Dockerfile](https://analysis-tools.dev/tag/dockerfile) -- curated list of 8+ Dockerfile static analysis tools

### Dockerfile Best Practices
- [Docker Official Best Practices](https://docs.docker.com/build/building/best-practices/) -- authoritative source for all rule definitions
- [Sysdig Top 20 Dockerfile Best Practices](https://www.sysdig.com/learn-cloud-native/dockerfile-best-practices) -- production-focused best practices
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) -- security-focused rules
- [Snyk 10 Docker Image Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/) -- security and supply chain practices

### Scoring Methodologies
- [Pylint Scoring FAQ](https://docs.pylint.org/en/1.6.0/faq.html) -- formula: 10 - ((5*error + warning + refactor + convention) / statements) * 10
- [SonarQube Metrics Definition](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition) -- multi-dimensional quality metrics
- [Real Python - Pylint Score](https://realpython.com/lessons/pylints-code-quality-score/) -- score ranges, weighted deductions

### CodeMirror 6
- [CodeMirror Lint Example](https://codemirror.net/examples/lint/) -- official lint integration guide, Diagnostic API
- [@codemirror/lint npm](https://www.npmjs.com/package/@codemirror/lint) -- lint extension package
- [CodeMirror Severity Discussion](https://discuss.codemirror.net/t/additional-severity-level-for-linting-and-custom-class-names/6769) -- severity levels: error, warning, hint

### Dockerfile Parser
- [dockerfile-ast npm](https://www.npmjs.com/package/dockerfile-ast) -- TypeScript Dockerfile parser, browser-bundlable
- [dockerfile-ast GitHub](https://github.com/rcjsuen/dockerfile-ast) -- by rcjsuen, used in VS Code Docker extension

### UX Patterns for Developer Tools
- [Hadolint Usage Guide (Bell SW)](https://bell-sw.com/blog/how-to-use-a-dockerfile-linter/) -- severity levels, configuration, CI integration
- [DevOpsCube Hadolint Guide](https://devopscube.com/lint-dockerfiles-using-hadolint/) -- rule categories, severity customization
- [HubSpot Website Grader](https://website.grader.com/) -- shareable score model, 2M+ sites analyzed

---
*Feature research for: Dockerfile Analyzer Tool*
*Researched: 2026-02-20*
