# Pitfalls Research

**Domain:** Adding a long-form thought-leadership blog post ("Dark Code") to an existing Astro 5 portfolio site with 26 existing blog posts, 1160+ pages, and established content patterns.
**Researched:** 2026-04-14
**Confidence:** HIGH (grounded in direct analysis of the existing blog collection schema, MDX authoring patterns, OG image pipeline, JSON-LD schema components, tag taxonomy, LLMs.txt generators, and cross-link architecture in `[slug].astro`)

## Critical Pitfalls

### Pitfall 1: Source Hallucination and Dead Citation Links in a Research-Heavy Essay

**What goes wrong:**
The Dark Code essay draws from 48 research sources (SpinRoot/JPL data, GitClear reports, Anthropic RCT, supply chain studies). When writing a research-backed essay with AI assistance or even by hand at this density, three citation failures occur:

1. **Hallucinated citations:** AI-generated or misremembered source URLs that return 404. A Nature analysis found 2.6% of papers in 2025 had at least one hallucinated citation, up from 0.3% in 2024. Blog posts face the same risk when source URLs are constructed from memory rather than verified.
2. **Stale URLs:** Research papers, blog posts, and reports move. A URL that worked when the essay was drafted may 404 by publication day or shortly after. JPL technical reports are particularly fragile -- NASA reorganizes its web properties frequently.
3. **Misattributed statistics:** Citing "GitClear found 4x code clones" without linking to the actual report, or citing a secondary source that paraphrased the original data with distortion. The reader follows the link and finds a different number or a different claim.

In a thought-leadership essay, a single dead link or misattributed statistic destroys the authority the entire piece is trying to build. Readers click through citations specifically to validate bold claims.

**Why it happens:**
Research-backed essays require holding dozens of source URLs in context simultaneously. When drafting at 3000-5000 words, it is natural to "remember" a statistic and insert a plausible URL rather than re-verifying every source. The temptation increases with AI-assisted drafting because the model may confidently produce a URL that does not exist.

**How to avoid:**
1. Create a `sources.md` reference file BEFORE writing the essay. Each source gets: actual URL (verified by clicking), exact claim being cited, date accessed. This is the single source of truth for all citations.
2. Every external link in the final MDX must trace back to an entry in `sources.md`. No link gets added ad-hoc during writing.
3. After the essay is complete, run a link-checker against all external URLs. Tools: `npx linkinator` or manual verification.
4. For fragile sources (NASA/JPL, conference proceedings, preprints), include the Wayback Machine URL as a fallback or cite the DOI rather than a direct URL.
5. Every statistic must include inline attribution: "GitClear's 2024 report found..." not "studies show..." or "research indicates..."

**Warning signs:**
- A citation URL looks plausible but was never actually clicked during writing
- A statistic is cited without naming the specific source (e.g., "research shows 40% of code is never executed")
- The same source is cited with slightly different numbers in different sections
- A URL points to a homepage or search results page rather than the specific report

**Phase to address:**
Research and source verification phase (before content authoring). Must be a separate, completed phase -- not interleaved with writing.

---

### Pitfall 2: Word Count Bloat -- Losing the Reader Before the Framework

**What goes wrong:**
The project context states 3000-5000 words and a three-act arc: wake-up call, framework, practical defense. Previous companion blog posts have had "word count bloat" issues. In a thought-leadership essay, bloat almost always concentrates in Act 1 (the wake-up call) because the writer has 48 sources of alarming data and wants to deploy all of them. The result: the reader gets 2000 words of doom, loses energy, and never reaches the framework or defense sections -- which are the actual value of the piece.

The existing site demonstrates tight essays: "Death by a Thousand Arrows" is approximately 2500 words with a tight argument arc. "The Beauty Index" runs longer but earns its length with a scoring framework and 26 language evaluations. The Dark Code essay risks becoming a "data dump" -- a term used in thought-leadership writing criticism -- where facts accumulate without narrative progression.

**Why it happens:**
Research-backed essays create a sunk-cost problem. After gathering 48 sources, the writer feels obligated to cite all of them. Each source adds a sentence or paragraph. The wake-up call section swells because every data point seems important in isolation. The result is an essay that is comprehensive but unreadable.

Additionally, the project targets a broad audience ("not just senior engineers"), which tempts the writer to over-explain foundational concepts like supply chain dependencies or code churn metrics, adding length without advancing the argument.

**How to avoid:**
1. Set a hard word budget per section BEFORE writing:
   - Wake-up call: maximum 800-1000 words (set the stakes, cite 5-8 best sources, not all 48)
   - Framework: 1200-1500 words (the core intellectual contribution)
   - Practical defense: 800-1200 words (actionable, specific)
   - Opening/closing: 300-400 words total
2. Apply the "cite the best, reference the rest" rule: the strongest 8-10 sources get inline citations with discussion. The remaining 38 sources can be listed in a "Further Reading" section or footnotes.
3. Each section must advance the argument, not just present data. The test: "If I remove this paragraph, does the argument still hold?" If yes, remove it.
4. Use the `<TldrSummary>` component (which the site already has) to give readers a 5-bullet preview. This gives readers who want the conclusion a way to decide whether to invest in the full read.
5. Compare word count against "Death by a Thousand Arrows" -- if the Dark Code essay is more than 2x the length of that essay, it needs cutting.

**Warning signs:**
- The "wake-up call" section is longer than the "framework" section
- The essay has more than 10 inline citations in a single section
- Paragraphs start with "Additionally..." or "Furthermore..." (filler connectors indicating the previous paragraph should have been the last on that point)
- The reading time estimate exceeds 15 minutes for the target audience

**Phase to address:**
Content authoring phase. The outline must include section word budgets. The editing/review phase must explicitly check section balance.

---

### Pitfall 3: Tag Taxonomy Mismatch Creating Orphaned Tag Pages

**What goes wrong:**
The site generates tag pages dynamically via `src/pages/blog/tags/[tag].astro`. Tags are derived from all blog posts at build time using `getStaticPaths()`. The existing tag taxonomy (extracted from all 50+ blog posts) includes: `ai`, `code-quality`, `software-aesthetics`, `programming-languages`, `devops`, `kubernetes`, `cloud-native`, `security`, `docker`, `python`, `data-science`, `llm`, `platform-engineering`, among others.

If the Dark Code essay introduces new tags that do not overlap with the existing taxonomy (e.g., `dark-code`, `technical-debt`, `code-inflation`, `software-maintenance`), three problems occur:
1. **Orphaned tag pages:** A tag page like `/blog/tags/dark-code/` is generated with only one post. This is a thin page from an SEO perspective and provides no value to readers.
2. **Missed related-post connections:** The `[slug].astro` layout computes related posts by tag overlap (`relatedPosts` computed in lines 26-35). If the Dark Code essay uses entirely novel tags, it will have zero or minimal overlap with existing posts, and the "Related Articles" section will be empty or weak.
3. **Inconsistent tag naming:** The existing taxonomy uses lowercase kebab-case (`code-quality`, not `codeQuality`; `ai`, not `AI`). Introducing a tag with different casing or formatting creates a separate tag page for what is conceptually the same topic.

**Why it happens:**
Each blog post defines its own tags in frontmatter with no validation against a central registry. Astro's content collection schema only validates that `tags` is `z.array(z.string()).default([])` -- any string is accepted. There is no build-time warning for novel tags.

**How to avoid:**
1. Review the existing tag taxonomy before selecting tags. Prefer reusing existing tags over creating new ones.
2. Recommended tags for the Dark Code essay that maximize existing overlap:
   - `code-quality` (overlaps with "Death by a Thousand Arrows" and "The Beauty Index" -- creates a content cluster)
   - `ai` (overlaps with 12+ existing posts)
   - `software-aesthetics` (overlaps with "Death by a Thousand Arrows" and "The Beauty Index")
   - `security` (overlaps with DevOps/K8s posts -- supply chain dimension connects)
3. At most ONE new tag is acceptable if it names the essay's core concept (e.g., `dark-code`), but only alongside 3-4 established tags.
4. Verify tag selection by mentally checking: "Will the Related Articles sidebar show strong results for these tags?"

**Warning signs:**
- More than half of the essay's tags are novel (not used by any existing post)
- The `relatedPosts` section in the rendered blog post shows fewer than 3 related articles
- A tag page exists with only the Dark Code essay listed

**Phase to address:**
Content authoring phase (frontmatter definition). Must be verified in the integration/QA phase by building the site and checking the tag pages and related posts sidebar.

---

### Pitfall 4: LLMs.txt Not Updated After Publishing

**What goes wrong:**
The site generates `llms.txt` and `llms-full.txt` dynamically via `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts`. These files read from `getCollection('blog')` and list all posts. Because the generation is dynamic (reading from the content collection at build time), the new Dark Code blog post WILL automatically appear in `llms.txt` after build.

However, the project context notes "LLMs.txt not updated" as a previous issue. The risk is not that the post is missing from the auto-generated list, but that:
1. **The LLMs.txt generation was last verified on a certain date** -- if the build breaks, the stale `dist/llms.txt` from the previous build remains deployed, and the new post is silently missing.
2. **The blog post description in LLMs.txt inherits from frontmatter.** If the `description` field is weak, vague, or truncated, LLMs and AI crawlers get a poor summary. For a thought-leadership essay, the LLMs.txt description should clearly convey the essay's thesis, not just its topic.
3. **Citation guidance in llms.txt** -- the existing `How to Cite` section has examples for tools, guides, and the Beauty Index, but NOT for standalone blog essays. A thought-leadership essay about Dark Code may be cited by LLMs; having a citation example helps.

**Why it happens:**
The dynamic generation creates a false sense of safety. Developers assume "it auto-generates, so I don't need to check." But the quality of the auto-generated entry depends entirely on the frontmatter quality, and the generation itself depends on a clean build.

**How to avoid:**
1. Write the frontmatter `description` as a genuine thesis statement, not a topic summary. Good: "48 research sources reveal that code nobody understands is the industry's fastest-growing vulnerability -- and most teams are making it worse." Bad: "A blog post about dark code in production."
2. After building the site locally, verify the post appears in `dist/llms.txt` with its correct title and description.
3. Consider adding a citation example to the `How to Cite` section of `llms.txt.ts` for the Dark Code essay if it introduces a reusable framework.
4. Deploy and verify the live `llms.txt` URL after publishing.

**Warning signs:**
- The `description` field is generic or topic-oriented rather than thesis-oriented
- The site builds without errors but `dist/llms.txt` has not been checked
- The essay introduces a named framework (e.g., "Dark Code Index" or "Dark Code Defense") but LLMs.txt has no citation guidance for it

**Phase to address:**
Integration and verification phase (post-build QA). Explicitly include "verify llms.txt output" as a checklist item.

---

### Pitfall 5: Missing or Broken OG Image for Social Sharing

**What goes wrong:**
The site has an OG image generation pipeline (`src/pages/open-graph/[...slug].png.ts`) that automatically generates OG images for blog posts using `generateOgImage()`. The blog slug layout (`[slug].astro` line 37) constructs the OG image URL as `/open-graph/blog/POST_ID.png?cb=20260216`. Two failure modes:

1. **Cache-buster query param is stale:** The URL includes `?cb=20260216` -- a cache-buster tied to February 16, 2026. If the OG image generation changes (fonts, layout, colors) but the cache-buster is not updated, social platforms serve the old cached image. For a NEW post this is less of a concern (no prior cache), but if the post is published and then the title or description changes, the old OG image persists on Twitter/LinkedIn/Slack until the cache-buster is bumped.

2. **Cover image not created:** The OG image generator checks for `coverImage` in frontmatter. 8 of 10 native blog posts have a `coverImage` field pointing to an SVG in `/images/`. If the Dark Code essay does not have a cover image, the OG generator still produces an image (title + description + tags layout), but it will look different from other posts in the feed -- no visual identity. Some of the most impactful posts on the site (Beauty Index, Database Compass, Death by a Thousand Arrows) all have custom SVG covers.

3. **SVG cover image rendering:** The OG image pipeline uses `sharp` to convert SVG covers to PNG for the OG image. SVGs with external CSS imports, complex filters, or browser-dependent rendering may produce unexpected results when rasterized by sharp on the server side. This is the same class of bug identified in the cheatsheet SVG pitfall from the Claude Code Guide refresh research.

**Why it happens:**
OG images are invisible during local development. Authors test the blog post in the browser and see a beautiful rendered page, but never check what the post looks like when shared on LinkedIn, Twitter, or Slack. The OG image generation happens at build time and requires visiting `/open-graph/blog/dark-code.png` to verify.

**How to avoid:**
1. Create a cover image SVG for the Dark Code essay (consistent with the site's existing pattern of custom SVG covers for flagship posts).
2. Verify the OG image renders correctly by visiting the OG endpoint locally: `http://localhost:4321/open-graph/blog/dark-code.png`
3. After deployment, use a social card debugger (Twitter Card Validator, LinkedIn Post Inspector, opengraph.xyz) to verify the OG image, title, and description display correctly.
4. If the cover SVG uses external fonts or complex CSS, test rasterization with sharp separately before relying on the build pipeline.

**Warning signs:**
- No `coverImage` field in the Dark Code essay's frontmatter
- The OG image endpoint 404s during local build
- The post is published and shared on social media without checking the social card preview

**Phase to address:**
Asset creation phase (cover image) and integration/QA phase (OG image verification). Social card testing should be an explicit step in the publish checklist.

---

### Pitfall 6: JSON-LD Schema Incomplete or Incorrect for Thought-Leadership Content

**What goes wrong:**
The blog post layout (`[slug].astro`) has a sophisticated JSON-LD pipeline. It passes `articleSection`, `wordCount`, and `about` to `BlogPostingJsonLd.astro`. However, the `articleSection` and `about` properties are currently hardcoded for specific post IDs (lines 40-69 in `[slug].astro`):

```typescript
const isBeautyIndexPost = post.id === 'the-beauty-index';
const isK8sPost = post.id === 'kubernetes-manifest-best-practices';
// ... etc.
const articleSection = isBeautyIndexPost ? 'Programming Languages' : ...
const aboutDataset = isBeautyIndexPost ? { type: 'Dataset', ... } : ...
```

If no condition matches the Dark Code post's ID, both `articleSection` and `about` will be `undefined`. The JSON-LD output will be valid but incomplete -- missing the `articleSection` and `about` properties that enrich the schema for Google's rich results.

Additionally, many of the existing posts have FAQPageJsonLd entries (Beauty Index has 3 FAQs, K8s has 6, Claude Code Guide has 6). If the Dark Code essay introduces a named framework or answers common questions ("What is dark code?", "How do I find dark code in my codebase?"), missing the FAQ schema means missing Google's FAQ rich result snippet.

**Why it happens:**
The `articleSection` and `about` mappings in `[slug].astro` use a pattern of explicit post-ID matching. This is a design that worked when only a few flagship posts needed enriched schema, but it means EVERY new post with enriched schema needs manual additions to this file. The pattern is not self-documenting -- there is no comment saying "add your post here."

**How to avoid:**
1. Add the Dark Code post to the `articleSection` and `about` mappings in `[slug].astro`:
   - `articleSection`: "Software Engineering" or "Code Quality"
   - `about`: `{ type: 'Article', name: 'Dark Code', url: 'https://patrykgolabek.dev/blog/dark-code/' }` (or `CreativeWork` if more appropriate)
2. If the essay includes a framework with clear questions and answers, add FAQPageJsonLd entries. Good candidates: "What is dark code?", "How much dark code exists in production?", "How do you find dark code?"
3. Verify the JSON-LD output by viewing the page source and validating with Google's Rich Results Test (https://search.google.com/test/rich-results).
4. Consider whether the hardcoded pattern should be replaced with frontmatter-driven schema (a future improvement, not a blocker for this milestone).

**Warning signs:**
- The Dark Code essay is published but its JSON-LD output has no `articleSection` or `about` field
- Google Search Console shows the page is indexed but not eligible for rich results
- The post ID does not appear anywhere in `[slug].astro`

**Phase to address:**
Integration phase. The JSON-LD additions should be part of the same PR that adds the blog post MDX file.

---

### Pitfall 7: Missing Internal Cross-Links That Waste the Content Cluster Opportunity

**What goes wrong:**
The site has established a strong pattern of internal cross-linking. "Death by a Thousand Arrows" links to "The Beauty Index" blog post and the Beauty Index tool pages. "The Beauty Index" links extensively to individual language pages. The Claude Code Guide blog posts link to guide chapter pages.

The Dark Code essay has natural cross-link opportunities to existing site content:
- **"Death by a Thousand Arrows"** -- both essays are about code quality deterioration
- **"The Beauty Index"** -- Dark Code is in some ways the anti-Beauty Index (ugly code that nobody maintains)
- **AI Landscape Explorer** -- if Dark Code discusses AI copilots (GitClear 4x code clones, Anthropic RCT), it can link to relevant AI concept pages
- **Claude Code Guide** -- if Dark Code discusses AI-assisted coding tools, it can reference the guide

Missing these cross-links wastes the SEO "topic cluster" benefit and fails to drive readers deeper into the site. The `relatedPosts` sidebar (computed by tag overlap) handles discovery, but in-content cross-links are more powerful for SEO and reader engagement.

**Why it happens:**
Cross-linking requires the writer to know what other content exists on the site. When focused on writing a standalone essay with 48 external sources, it is easy to forget about internal linking opportunities. The existing blog posts were written months apart and may not feel connected during drafting.

**How to avoid:**
1. Before writing, create a list of all possible internal links from Dark Code to existing site content. Map each source/theme to an existing page.
2. During writing, aim for 3-5 natural internal cross-links (not forced). The "Death by a Thousand Arrows" post achieves 2 internal links organically.
3. After the Dark Code essay is published, update "Death by a Thousand Arrows" to add a reciprocal cross-link to Dark Code (if a natural insertion point exists). Bidirectional cross-links are strongest for topic clustering.
4. Do NOT add cross-links that feel forced. "For more on JavaScript arrow functions, see..." does not belong in an essay about dark code.

**Warning signs:**
- The final essay has zero internal links to other site content
- The essay discusses AI coding tools without linking to the Claude Code Guide or AI Landscape Explorer
- The essay discusses code quality without linking to "Death by a Thousand Arrows" or "The Beauty Index"

**Phase to address:**
Content authoring phase (outline should identify cross-link targets) and editing/review phase (verify cross-links are present and natural).

---

### Pitfall 8: Essay Reads Like an AI-Generated Literature Review, Not a Human Perspective

**What goes wrong:**
The Dark Code essay draws from 48 sources and is being written with AI assistance. The highest risk for thought-leadership content in 2026 is producing an essay that sounds like a well-organized literature review rather than a person with 17 years of experience sharing a hard-won perspective. The Animalz content strategy team calls this "assembled vs. considered" content -- audiences can tell the difference.

Symptoms of the literature-review trap:
- Every paragraph starts by citing a source rather than making a claim
- The essay presents facts without interpretation ("Source A found X. Source B found Y.")
- The writer's own experience and judgment are absent
- The tone is objective and detached rather than opinionated
- Section headings describe topics rather than arguments ("Code Inflation" vs. "Your Codebase is Growing Faster Than Your Team Can Read It")

The existing thought-leadership posts on the site demonstrate the opposite pattern. "Death by a Thousand Arrows" opens with "Arrow functions are not easier to read or write. There, I said it." and "The Beauty Index" opens with "None of them tell you which one is the most beautiful." Both lead with an opinionated claim, then support it with evidence. They are considered, not assembled.

**Why it happens:**
When you have 48 sources, the temptation is to let the sources do the arguing. Each source is a crutch that delays the moment when the writer must stake a personal claim. AI-assisted drafting amplifies this because AI defaults to balanced, hedged, neutral prose. The result is an essay that is technically accurate but lacks the voice that makes readers share it.

**How to avoid:**
1. Write the opening paragraph and thesis statement BEFORE consulting any sources. What does the author actually believe about dark code? Start there.
2. Every section must make a claim first, then support it with evidence. Never start a section with a citation.
3. Include at least 2-3 first-person experience observations. "In 17 years of production engineering, I have never seen a team audit dark code proactively." This is what the sources cannot provide.
4. Use the `<OpeningStatement>` component (already in the site's component library) for a bold, opinionated opening line. This forces the essay to lead with a claim.
5. During editing, highlight every paragraph that starts with a citation or a hedging phrase ("It should be noted that...", "Research suggests..."). Rewrite those paragraphs to lead with the author's interpretation.
6. The "framework" section (Act 2) is where the author's original contribution lives. This section should cite fewer external sources and present more original thinking.

**Warning signs:**
- More than 3 consecutive paragraphs start with source citations
- The word "suggests" appears more than twice in the essay
- The essay could have been written by anyone with access to the same 48 sources -- there is no perspective that is unique to a 17-year production engineering veteran
- The essay has no first-person claims or experience-based observations
- Section headings are nouns/topics rather than arguments/claims

**Phase to address:**
Content authoring phase (drafting guidelines must enforce voice) and editing/review phase (explicit check for voice and perspective).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping cover image SVG | Saves 2-4 hours of design work | Every social share lacks visual identity; post looks second-class compared to existing flagship posts | Never for a flagship thought-leadership essay |
| Using all 48 sources inline | Demonstrates research depth | Unreadable essay; reader fatigue; "data dump" pattern | Never -- use "cite the best, reference the rest" |
| Inventing 4+ new tags | More precise topic categorization | Orphaned tag pages; broken related-posts; thin pages for SEO | Acceptable for ONE genuinely new tag alongside 3-4 existing tags |
| Skipping JSON-LD enrichment | Saves 15 minutes of `[slug].astro` editing | Missing Google rich results; inconsistency with other flagship posts | Never for a post expected to rank for competitive keywords |
| Not cross-linking to existing posts | Essay is self-contained | Wasted topic cluster SEO benefit; missed reader engagement | Never when natural cross-link opportunities exist |
| Hardcoding statistics without source links | Faster drafting | Any reader who wants to verify a claim cannot; trust erodes | Never in a research-backed essay |

## Integration Gotchas

Common mistakes when adding a new blog post to this specific site.

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| Blog collection schema | Adding fields not in the schema (e.g., `author`, `series`, `footnotes`) causing build failure | Check `src/content.config.ts` -- the blog schema allows: `title`, `description`, `publishedDate`, `updatedDate`, `tags`, `draft`, `coverImage`, `externalUrl`, `source`. Nothing else. |
| MDX component imports | Using relative paths that break when directory structure changes (e.g., `import X from '../components/...'` instead of the established `../../components/blog/` pattern) | Follow the import pattern from existing posts: `import TldrSummary from '../../components/blog/TldrSummary.astro';` |
| File naming | Using spaces or uppercase in the MDX filename (e.g., `Dark Code.mdx` or `DarkCode.mdx`) | Use lowercase kebab-case: `dark-code.mdx`. The filename becomes the slug via `post.id`. |
| External links | Using `[text](url)` for external links without `target="_blank"` and `rel="noopener noreferrer"` | For external links in MDX, use raw HTML: `<a href="url" target="_blank" rel="noopener noreferrer">text</a>`. Internal links use standard Markdown: `[text](/path/)` |
| Cover image path | Placing the cover image SVG in `src/` instead of `public/` | Cover images must be in `public/images/` and referenced in frontmatter as `/images/dark-code-cover.svg`. The OG image generator reads from `public/`. |
| Trailing slashes | Linking to `/blog/dark-code` without trailing slash | The site uses trailing slashes consistently: `/blog/dark-code/`. Missing the trailing slash can cause redirect or 404 depending on Astro config. |

## UX Pitfalls

Common user experience mistakes for long-form thought-leadership content.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No TldrSummary component at the top | Readers cannot assess whether the 15-minute read is worth their time | Use `<TldrSummary>` with 4-5 bullet points summarizing the thesis and key findings, following the pattern of every other flagship post on the site |
| Wall of statistics without visual breaks | Reader fatigue sets in after 500 words of continuous text | Break up data-heavy sections with `<KeyTakeaway>` callouts, code blocks, or inline figures. The site already uses all three patterns. |
| Argument headings that are topics, not claims | Reader cannot skim the table of contents to understand the argument arc | Write headings as arguments: "Your Codebase Has a Shadow" not "Dark Code Overview". The table of contents becomes a standalone summary. |
| No practical takeaways | Reader finishes the essay alarmed but unsure what to do | The "practical defense" section (Act 3) must include numbered, actionable steps -- not just principles |
| Footnotes or endnotes for key claims | Reader must scroll to the bottom to verify a claim, breaking flow | Use inline hyperlinks for source citations. The site has no footnote rendering system; using Markdown footnotes would produce unstyled or broken output in MDX. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Frontmatter tags:** Often new tags are created without checking existing taxonomy -- verify all tags exist in at least one other post (except at most one new tag)
- [ ] **Cover image:** Blog post renders fine without one, but social shares look bare -- verify `coverImage` field is set and the SVG exists in `public/images/`
- [ ] **OG image rendering:** Blog post looks great in browser but OG image was never checked -- visit `/open-graph/blog/dark-code.png` locally
- [ ] **JSON-LD `articleSection`:** Post renders correctly but has no `articleSection` in JSON-LD -- check `[slug].astro` for the post-ID mapping
- [ ] **JSON-LD `about`:** Post has no `about` property in its JSON-LD -- check if an `about` mapping was added for the Dark Code post
- [ ] **FAQPageJsonLd:** Post introduces a framework with answerable questions but has no FAQ schema -- check if FAQ entries were added
- [ ] **Internal cross-links:** Essay reads as standalone but misses 3-5 natural links to existing site content -- verify cross-links to "Death by a Thousand Arrows", "The Beauty Index", and AI-related content exist
- [ ] **External link attributes:** All external links have `target="_blank"` and `rel="noopener noreferrer"` -- grep for `http` in the MDX and verify
- [ ] **LLMs.txt verification:** Blog post appears in `dist/llms.txt` after build with a good description -- build locally and check
- [ ] **Description field:** Frontmatter `description` is a thesis statement, not a topic summary -- read it standalone and verify it could be a tweet
- [ ] **Reading time:** Build and check the reading time estimate -- if over 15 minutes, the essay needs cutting
- [ ] **Related posts sidebar:** Build and check that the "Related Articles" section shows 3-5 relevant posts -- if fewer than 3, reconsider tags
- [ ] **Source URLs verified:** Every external link in the essay was clicked and verified to resolve to the expected content

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dead citation links discovered post-publish | LOW | Replace with Wayback Machine URLs or updated URLs. Rebuild and redeploy. |
| Word count bloat (essay exceeds 5000 words) | MEDIUM | Identify the longest section (usually Act 1). Extract 30-40% of citations to a "Further Reading" section. Rewrite topic sentences to maintain flow. |
| Tag taxonomy mismatch | LOW | Update frontmatter tags, rebuild. Tag pages regenerate automatically. |
| LLMs.txt missing the post | LOW | Rebuild site. The generation is automatic from the content collection. If the build broke silently, fix the build error. |
| Missing OG image | LOW | Add `coverImage` to frontmatter, create the SVG, rebuild. Social platform caches clear within 24-48 hours (or use cache-buster param). |
| JSON-LD incomplete | LOW | Add post-ID mapping to `[slug].astro`, rebuild. Google re-crawls within days. |
| Essay reads like AI literature review | HIGH | Requires substantive rewrite of opening, section leads, and injection of personal perspective. Cannot be fixed with surface edits. Must be caught in drafting phase. |
| Missing internal cross-links | LOW | Add cross-links to the MDX, rebuild. Optionally update existing posts to add reciprocal links. |
| Hallucinated citations | HIGH | Requires re-verification of all 48 sources. Each suspect citation must be traced back to its actual source. If a statistic was misattributed, the surrounding argument may need rewriting. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Source hallucination / dead citations | Research phase (source verification) | All URLs clicked and verified; `sources.md` completed before writing begins |
| Word count bloat | Content authoring phase (outline with word budgets) | Each section within its word budget; total essay 3000-5000 words |
| Tag taxonomy mismatch | Content authoring phase (frontmatter) | Build site; check tag pages; verify related posts sidebar shows 3+ posts |
| LLMs.txt not updated | Integration/QA phase | Build site; check `dist/llms.txt` for post entry with good description |
| Missing OG image | Asset creation phase + Integration/QA | Cover SVG created; OG endpoint visited locally; social card debugger used post-deploy |
| JSON-LD incomplete | Integration phase | `[slug].astro` updated; Rich Results Test passes; `articleSection` and `about` present |
| Missing cross-links | Content authoring + editing phase | 3-5 internal links present; reciprocal link from "Death by a Thousand Arrows" considered |
| AI literature review voice | Content authoring + editing phase | Opening uses `<OpeningStatement>` with a bold claim; first-person experience present; no 3+ consecutive citation-led paragraphs |

## Sources

- Direct analysis of `src/content.config.ts` (blog schema definition)
- Direct analysis of `src/pages/blog/[slug].astro` (JSON-LD, related posts, OG image logic)
- Direct analysis of `src/pages/open-graph/[...slug].png.ts` (OG image generation)
- Direct analysis of `src/pages/llms.txt.ts` (LLMs.txt auto-generation)
- Direct analysis of `src/pages/blog/tags/[tag].astro` (tag page generation)
- Direct analysis of all existing blog post frontmatter (tag taxonomy extraction)
- Direct analysis of `src/components/BlogPostingJsonLd.astro` (JSON-LD schema)
- [Hallucinated citations in scientific literature (Nature, 2026)](https://www.nature.com/articles/d41586-026-00969-z)
- [Thought leadership mistakes (iResearch Services)](https://iresearchservices.com/blog/the-most-common-thought-leadership-mistakes/)
- [Thought leadership content strategy (Animalz)](https://www.animalz.co/blog/thought-leadership-content)
- [Thought leadership in 2026 (Articulate Marketing)](https://www.articulatemarketing.com/blog/thought-leadership-that-succeeds)
- [SEO content length best practices 2026 (WordCount AI)](https://wordcountai.com/blog/how-many-words-for-seo)
- Prior pitfalls research from Claude Code Guide Refresh (`.planning/research/PITFALLS.md`, 2026-04-12)

---
*Pitfalls research for: Dark Code thought-leadership blog post*
*Researched: 2026-04-14*
