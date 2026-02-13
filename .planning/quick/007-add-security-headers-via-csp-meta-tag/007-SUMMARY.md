---
phase: quick-007
plan: 01
subsystem: security
tags: [csp, content-security-policy, referrer-policy, permissions-policy, security-headers, github-pages]

# Dependency graph
requires:
  - phase: none
    provides: none
provides:
  - Content-Security-Policy meta tag on all pages
  - Referrer-Policy meta tag (strict-origin-when-cross-origin)
  - Permissions-Policy meta tag restricting unused browser APIs
  - Documentation of GitHub Pages security header limitations
affects: [Layout.astro, all pages via shared layout]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSP via meta tags for static hosting, defense-in-depth security headers]

key-files:
  created: []
  modified:
    - src/layouts/Layout.astro

key-decisions:
  - "Used frame-src 'none' instead of frame-ancestors 'self' because frame-ancestors is not supported in meta CSP tags"
  - "Added fonts.googleapis.com and fonts.gstatic.com to connect-src for preconnect compatibility"
  - "Documented X-Content-Type-Options and frame-ancestors limitations as HTML comments"

patterns-established:
  - "Security meta tags placed early in <head>, after charset and viewport"

# Metrics
duration: 2min
completed: 2026-02-13
---

# Quick Task 007: Add Security Headers via CSP Meta Tag Summary

**CSP, Referrer-Policy, and Permissions-Policy meta tags added to Layout.astro addressing Nikto scan findings on GitHub Pages static hosting**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-13T15:42:25Z
- **Completed:** 2026-02-13T15:44:03Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added Content-Security-Policy meta tag with directives allowing Google Fonts and Astro inline scripts/styles
- Added Referrer-Policy meta tag (strict-origin-when-cross-origin) for privacy
- Added Permissions-Policy meta tag restricting camera, microphone, geolocation, payment, USB, magnetometer, gyroscope, and accelerometer APIs
- Documented GitHub Pages limitations (frame-ancestors unsupported in meta tags, X-Content-Type-Options requires HTTP header)
- Verified security tags propagate to all pages (index, blog, about, projects, contact)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add security meta tags to Layout.astro** - `94633d0` (feat)
2. **Task 2: Dev server smoke test** - no changes (verification-only task)

## Files Created/Modified
- `src/layouts/Layout.astro` - Added security meta tags (CSP, Referrer-Policy, Permissions-Policy) early in `<head>` with documentation comments

## Decisions Made
- **frame-src instead of frame-ancestors:** The `frame-ancestors` directive is not supported in `<meta http-equiv="Content-Security-Policy">` tags (per W3C CSP spec, only HTTP headers support it). Used `frame-src 'none'` to block outbound framing. Documented that inbound clickjacking protection (X-Frame-Options equivalent) requires server-level headers not available on GitHub Pages.
- **Added Google Fonts to connect-src:** The plan's CSP only had `connect-src 'self'`, but `<link rel="preconnect">` tags for Google Fonts domains need `connect-src` permission. Added `https://fonts.googleapis.com https://fonts.gstatic.com` to prevent font loading failures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced frame-ancestors with frame-src in CSP meta tag**
- **Found during:** Task 1 (Add security meta tags)
- **Issue:** Plan specified `frame-ancestors 'self'` in the CSP meta tag, but the frame-ancestors directive is not supported in meta CSP tags per the W3C specification -- browsers silently ignore it
- **Fix:** Used `frame-src 'none'` to block outbound framing; documented the limitation that inbound clickjacking protection requires HTTP headers
- **Files modified:** src/layouts/Layout.astro
- **Verification:** Build succeeds, CSP tag renders correctly in all pages
- **Committed in:** 94633d0 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added Google Fonts domains to connect-src**
- **Found during:** Task 1 (Add security meta tags)
- **Issue:** Plan's CSP had `connect-src 'self'` but the site uses `<link rel="preconnect">` to Google Fonts domains, which requires connect-src permission
- **Fix:** Added `https://fonts.googleapis.com https://fonts.gstatic.com` to the connect-src directive
- **Files modified:** src/layouts/Layout.astro
- **Verification:** Build succeeds, Google Fonts preconnect will not be blocked by CSP
- **Committed in:** 94633d0 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. frame-ancestors would be silently ignored; missing connect-src origins could block font loading. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Security headers are in place for all pages via shared layout
- For full clickjacking protection, a server-level X-Frame-Options or CSP frame-ancestors header would be needed (not possible on GitHub Pages)
- Consider Cloudflare or similar CDN for custom HTTP response headers in the future

## Self-Check: PASSED

- FOUND: src/layouts/Layout.astro
- FOUND: 007-SUMMARY.md
- FOUND: commit 94633d0

---
*Quick Task: 007-add-security-headers-via-csp-meta-tag*
*Completed: 2026-02-13*
