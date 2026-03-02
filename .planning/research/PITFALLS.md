# Pitfalls Research

**Domain:** Adding 2 new Dockerfile Analyzer lint rules (PG011, PG012)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: PG011/DL3002 Rule Overlap

**What goes wrong:**
DL3002 already flags `USER root`. If PG011 (missing USER directive) also fires when `USER root` is present, the user sees two violations for the same underlying issue — one saying "don't use root" and another saying "no USER found." This creates confusion and double-penalizes the score.

**Why it happens:**
DL3002 checks for the *presence* of `USER root`. PG011 checks for the *absence* of any USER instruction. Without careful boundary logic, a Dockerfile with `USER root` would trigger both rules.

**How to avoid:**
PG011 should ONLY fire when there is NO USER instruction at all in the final build stage. If any USER instruction exists (even `USER root`), PG011 stays silent and DL3002 handles the root case. Clear boundary: PG011 = "no USER directive exists", DL3002 = "USER directive exists but sets root."

**Phase to address:** Rule implementation phase.

---

### Pitfall 2: Multi-Stage Build False Positives (PG011)

**What goes wrong:**
In a multi-stage build, only the final stage runs in production. Builder stages often intentionally run as root. If PG011 flags builder stages for missing USER, it generates noise that makes the tool less useful.

**Why it happens:**
Iterating all FROM instructions without filtering to the final stage.

**How to avoid:**
Only check the final build stage for USER directive presence. Use `dockerfile-ast`'s `getFROMs()` to identify stages and only flag the last one. Skip `FROM scratch` entirely (no user system). This pattern is already used by PG009 (remove unnecessary tools) which also only checks the final stage.

**Phase to address:** Rule implementation phase.

---

### Pitfall 3: PG012 Node.js Image Detection Scope

**What goes wrong:**
The rule checks for `FROM node:*` but misses variant naming patterns:
- `FROM node:25-bookworm-slim` (standard)
- `FROM node:25-alpine` (Alpine variant)
- `FROM docker.io/library/node:25` (fully qualified)
- `FROM myregistry.com/node:25` (private registry mirror)

Conversely, it might false-positive on images that contain "node" in the name but aren't Node.js: `FROM mycompany/auth-node:latest`.

**Why it happens:**
Image name matching requires understanding Docker's image naming conventions — registry prefix, namespace, and repository name are all optional parts.

**How to avoid:**
Match on the image name being exactly `node` (after stripping registry prefix). This means:
- `node:25` matches (official image, no prefix)
- `library/node:25` matches (explicit Docker Hub library)
- `docker.io/library/node:25` matches (fully qualified)
- `mycompany/node:25` does NOT match (different namespace — this is likely a custom image)
- `mycompany/auth-node:25` does NOT match (node is substring, not full name)

For info-severity, erring on the side of precision (fewer false positives) is better than recall.

**Phase to address:** Rule implementation phase.

---

### Pitfall 4: Stale Rule Count References

**What goes wrong:**
PROJECT.md, the Dockerfile Analyzer landing page, blog post, homepage callout, JSON-LD, and LLMs.txt all reference a rule count. The codebase currently says "39 rules" in some places even though there are actually 44. Adding 2 more makes 46 — but if we only update "39" to "46" and miss places that already say "44", we'll have inconsistent counts.

**Why it happens:**
Rule counts were hardcoded at v1.4 launch (39 rules) and some references were updated while others weren't when PG006-PG010 were added.

**How to avoid:**
Do a comprehensive grep for rule count references (39, 44, and variations like "39 expert rules", "39 rule documentation pages"). Update all to the new count (46). Use the actual `allRules.length` where possible rather than hardcoded numbers.

**Phase to address:** Site-wide count update phase.

---

### Pitfall 5: node-caged Version Limitation Not Communicated

**What goes wrong:**
PG012 suggests `platformatic/node-caged` but doesn't mention it only supports Node 25+. Users on Node 18 LTS or Node 20 LTS see the suggestion and try to switch, only to find no compatible image exists.

**Why it happens:**
The V8 pointer compression feature requires the `--experimental-enable-pointer-compression` compile flag, which is only available in Node.js 25+ builds.

**How to avoid:**
The rule explanation should clearly state the Node 25+ requirement. The rule should ideally only fire for Node 25+ tags (if detectable from the tag), or include the version constraint prominently in the message. Since tags like `node:lts` or `node:latest` don't clearly indicate the version, the message should always mention the Node 25+ requirement regardless.

**Phase to address:** Rule implementation phase.

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `rules/index.ts` registry | Adding import but forgetting to add to `allRules` array | Add both import AND array entry in same edit |
| Rule documentation pages | Rule generates but link from violation panel is broken | Verify rule ID lowercase matches the `[code].astro` params pattern |
| Scoring impact | New rules change existing scores for sample Dockerfiles | Expected behavior — document that rule count changed |
| Related rules | PG011 should show DL3002, PG007 as related (same security category) | Verify `getRelatedRules()` returns sensible neighbors |

## "Looks Done But Isn't" Checklist

- [ ] PG011 only fires when NO USER instruction exists (not when USER root exists)
- [ ] PG011 only checks final build stage (not builder stages)
- [ ] PG011 skips FROM scratch
- [ ] PG012 matches `node:*` images correctly (not substrings)
- [ ] PG012 explanation mentions Node 25+ requirement
- [ ] Both rules added to `allRules` array in index.ts
- [ ] Rule counts updated across all site references
- [ ] Full production build passes
- [ ] Rule documentation pages render at /tools/dockerfile-analyzer/rules/pg011/ and /rules/pg012/

---
*Pitfalls research for: Dockerfile Analyzer rule expansion (PG011, PG012)*
*Researched: 2026-03-02*
