# Scentscape Website Revision Plan

Updated: 2026-09-10

## Purpose and execution rules

Improve visual coherence, navigation, readability, and the presentation of fragrance data while preserving the interactive olfactory atlas and optional AI interpretation.

This document records the discussion and defines subsequent work; it does not mark proposed features as implemented. Repository content is written in English under `AGENTS.md`.

- Reuse the existing D3 wheel, search, detail, timeline, and AI components.
- Implement in the phases below, with a reviewable result after each phase.
- Confirm the pending visual direction before implementing the Home and background redesign. The user requested both changes, but has not selected the proposed palette or exact composition.
- Read the relevant installed Next.js documentation before changing routing or framework code.
- Preserve fragrance records, family IDs, search behavior, and AI service contracts unless an explicit phase requires a change.
- Do not introduce new dependencies, fabricated product images, testimonials, measured-performance claims, or additional product features for this revision.
- Keep unrelated local changes, including the existing `AGENTS.md` edit, intact.

## Decision register

| Item | Status | Execution implication |
| --- | --- | --- |
| Improve the wheel palette; avoid muddy colors and preserve scent identities | Requested; implemented in working tree | Review visually before calling complete |
| Replace the current default background | Confirmed; implemented in first milestone | Warm paper is now the stable reading surface |
| Add a Home page | Confirmed; implemented in first milestone | Home introduces the project and links into the existing Atlas |
| Warm paper palette across Home, Atlas, and details | Confirmed; implemented in first milestone | Visual browser review remains pending |
| English functional UI with original perfume names preserved | Proposed | Confirm audience/language preference before replacing existing UI copy |
| Responsive layout, search improvements, detail restructuring, data explanations | Recommended backlog | Execute in the agreed phases; do not imply these are already delivered |

## Evidence and current issues

Evidence consists of source inspection, two desktop screenshots supplied on 2026-09-09, and a responsive browser acceptance pass completed on 2026-09-10.

- The default `MoodCanvas` uses the Fresh family parameters. Changing only the global CSS background will not replace the visible blue-gray canvas.
- The desktop screenshot shows the wheel cut off at the bottom and low-emphasis text against a bright blue-gray background.
- The detail screenshot shows a near-black dialog over the lighter Atlas, creating a strong visual discontinuity.
- The layout uses a fixed 320px sidebar and a horizontal, overflow-hidden container without a mobile layout alternative.
- Many functional labels are 8–11px; search input text is 12px. Chinese, English, and French are mixed across controls.
- Search returns at most seven suggestions; family/subfamily lists stop at 120 entries without access to subsequent entries.
- Search and list requests need explicit loading, empty, and failure states.
- Mood scores and intensity curves are heuristic. Time labels such as `30min`, `+6h`, and infinity can imply measured longevity.

## Phase 0 — Wheel palette: implemented, visual review pending

Files: `lib/fragranceData.ts`, `components/FragranceWheel/useFragranceWheel.ts`.

| Family | Color identity | Current color |
| --- | --- | --- |
| Oriental | Amber | `#D39A67` |
| Woody | Cedar green | `#6CA68B` |
| Fougere | Fern green | `#92AF6D` |
| Leather | Plum | `#A38CB9` |
| Gourmand | Apricot | `#D98E79` |
| Citrus | Lemon gold | `#E4BF64` |
| Fresh | Mint teal | `#73BBB0` |
| Aquatic | Marine blue | `#79AACC` |
| Floral | Rose | `#D694AD` |

- [x] Update nine family colors and 30 subfamily colors with related variations.
- [x] Use opaque segment fills to prevent the mood background from muddying colors.
- [x] Set wheel labels to dark ink `#20211F`.
- [x] Keep expansion and border cues for selection; remove opacity-based fading of sibling segments.
- [x] Check all 39 swatches against the label color: minimum computed contrast 4.83:1.
- [x] Run TypeScript and diff whitespace checks successfully.
- [ ] Review the actual wheel at default, hover, family-selected, and subfamily-selected states.
- [ ] Review shared family colors in list headings, badges, and tooltips, especially if their surfaces become light.

Validation limitation: targeted ESLint reports an existing `react-hooks/refs` error at `optionsRef.current = options` in `useFragranceWheel.ts`. The same error was verified in HEAD. Browser visual verification is still pending; numeric contrast does not establish rendered legibility at every scale.

## Phase 1 — Confirm and apply the surface system

Recommended direction: a warm, editorial fragrance archive with clear botanical colors and restrained motion.

| Role | Proposed token |
| --- | --- |
| Page background | `#F3EFE7` |
| List and detail surfaces | `#FAF7F1` |
| Primary text | `#292722` |
| Secondary text | `#716B61` |
| Action accent | `#795B38` |
| Dividers | `#DCD5C9` |

Alternative discussed: warm charcoal `#201E1A` if a dark direction is preferred. It is not a requirement to implement a theme switcher.

- [x] Confirm the recommended surface palette through the 2026-09-09 execution instruction.
- [x] Update global surface/text tokens and the actual default `MoodCanvas` behavior together.
- [x] Replace the primary hardcoded dark surfaces and pale text in search, lists, details, and the timeline.
- [x] Confine scent-responsive color to a subtle tint; maintain stable reading surfaces.
- [x] Keep full-screen AI visuals free to use a separate immersive dark treatment.
- [x] Retain Cormorant for branding and perfume titles; retain DM Mono for functional and compact data text in this milestone.
- [x] Raise body/search and primary list text sizes; further secondary-label normalization remains in Phase 5.
- [ ] Use approximately 44px primary control hit areas; verify text contrast on actual surfaces.

Primary files: `app/globals.css`, `app/layout.tsx`, `components/MoodCanvas/index.tsx`, `components/SearchBar/index.tsx`, `components/PerfumeDetail/index.tsx`.

Acceptance: default and selected-perfume states remain readable; Home, Atlas, and details share a coherent surface system; no accidental blue-gray default remains behind the new tokens.

## Phase 2 — Add Home and preserve direct Atlas access

Proposed routes and file structure:

```text
app/
  layout.tsx            Shared provider, fonts, and global shell
  globals.css           Shared visual tokens
  page.tsx              New Home
  atlas/
    page.tsx            Existing exploration interface
components/
  FragranceWheel/      Reused wheel and taxonomy
  SearchBar/           Reused search
  PerfumeDetail/       Reused lists and details
  MoodCanvas/         Route-appropriate atmosphere
```

- [x] Add navigation with Scentscape, Home, and Atlas; make the active location clear.
- [x] Build a compact Home of roughly two desktop screens, with direct entry to exploration in the first viewport.
- [x] Use a first-screen split of approximately 45% text and 55% visual, stacked on mobile.
- [x] Use the headline “A landscape for every scent.”
- [x] Use the description “Explore fragrance families, discover perfume notes, and see scent translated into visual form.”
- [x] Add the primary action “Explore the Atlas”.
- [x] Use a restrained wheel-derived spectrum on Home without loading the interactive explorer for decoration.
- [x] Add nine “Start with a scent family” entries using existing family IDs, each with a color marker, name, and short description.
- [x] Make family entries open `/atlas` with that family selected through a validated query parameter.
- [x] Add a concise project/data explanation in the footer.
- [x] Keep `/atlas` directly accessible without an intro animation or mandatory onboarding.
- [x] Ensure the Home background does not inherit a stale perfume selection from Atlas.

Acceptance: Home → Atlas, Home → selected family, Atlas → Home, browser Back, and direct route reload work. Homepage framing does not delay access to the product.

## Phase 3 — Responsive Atlas and accessible navigation

- [x] At desktop widths around 1024px and above, retain two columns with a 360px list panel.
- [x] Below the desktop breakpoint, stack search, wheel, and results with natural vertical scrolling.
- [x] Fit the complete wheel into the available initial viewport; retain a visible “Reset view” control for zoom/pan.
- [x] Add clickable family-name alternatives for touch and keyboard users; do not make hover the only way to access information.
- [x] Convert mobile perfume details to a full-screen view with an obvious return action.
- [x] Add visible focus states, keyboard-operable selection, dialog naming, focus containment/restoration, and Escape close behavior.
- [x] Respect reduced-motion preferences for transitions and ambient effects.

Acceptance: check 360px, 390px, 768px, and 1440px widths plus a short desktop viewport. There is no unintended horizontal overflow, initial wheel clipping, inaccessible close control, or hover-only essential content.

Completed 2026-09-10. Browser acceptance passed at 360×800, 390×844, 768×1024, 1440×900, and 1280×720. The wheel remained square and fully contained, the 360px and 390px layouts had no horizontal overflow, and the 360px Reset and family controls measured at least 44px high. Keyboard family selection, mobile full-screen details, dialog naming, focus containment, Escape close, and focus restoration were verified. Reduced-motion handling is implemented in CSS and D3 transitions. The production browser console reported no errors or warnings.

## Phase 4 — Search and result browsing

- [x] Add distinct loading, empty, and request-failure states with a retry action.
- [x] Prevent outdated requests from replacing the latest results; preserve input while reporting errors.
- [x] Keep seven quick suggestions and provide a working “View all results” path.
- [x] Add pagination or “Load more” to family/subfamily lists; update the API as well as the UI.
- [x] Display shown/total counts and prevent duplicates or skipped records across pages.
- [x] Prioritize perfume name and brand; make year and gender secondary.
- [x] Convert empty-state family labels into useful clickable starting points.
- [x] Align Atlas functional copy with Chinese labels while preserving perfume names and editorial French labels.

Primary files: `components/SearchBar/index.tsx`, `components/PerfumeDetail/index.tsx`, `app/api/perfumes/route.ts`.

Acceptance: a broad query and a family with more than 120 entries expose later results; no-match, failed-request, rapid-typing, keyboard-selection, and retry cases behave clearly. Add one focused runnable check for new pagination/request logic.

Completed 2026-09-10. Search retains seven quick suggestions, exposes the total through “查看全部”, and loads additional results in pages of 40. Family and subfamily listings use the same API pagination and show loaded/total counts. Requests use `AbortController`; appended pages deduplicate perfume IDs. The focused `npm run check:pagination` check covers first, last, invalid, and default pagination parameters. Production browser checks verified rapid typing uses the latest query, keyboard selection opens the selected perfume, 62 Adidas results through the complete search path, 40 → 80 of 4,434 Oriental-family results, and the no-match state.

## Phase 5 — Detail hierarchy and honest sensory interpretation

Recommended order: identity → note composition → scent profile → evolution → optional AI visual.

- [ ] Put name, brand, and family first, followed by Top / Heart / Base notes when those stages are actually known.
- [ ] Emphasize the three strongest estimated scent characteristics; expose the remainder only as needed.
- [ ] Consolidate duplicate static and timeline note displays; highlight stages in one coherent composition.
- [ ] Use Opening / Heart / Drydown instead of precise time labels unless measurement evidence becomes available.
- [ ] Label mood scores “Estimated from listed notes” and AI output “Artistic interpretation”.
- [ ] Keep unstructured notes unstructured throughout the timeline; do not present unknown stages as confirmed top notes.
- [ ] Add concise data-source and heuristic-method explanations accessible from details and Home.
- [ ] Use an understandable AI action label, explain its output, and preserve existing error/retry and close behavior.

Primary files: `components/PerfumeDetail/index.tsx`, `components/SillageTimeline/`, `components/AIVisualOverlay/index.tsx`, and relevant note-mapping helpers.

Acceptance: structured, flat-note, missing-note, and missing-metadata records render honestly; no invented descriptions, stage assignments, or longevity claims appear. Core browsing remains usable without AI credentials.

## Phase 6 — Final verification and documentation

- [ ] Run appropriate lint/type/build checks; distinguish pre-existing failures from regressions and resolve or explicitly track outstanding blockers.
- [ ] Run the responsive and interaction acceptance cases above, recording actual results rather than marking visual completion from a build.
- [ ] Check wheel labels and shared family accents against their final surfaces; color must not be the sole selection cue.
- [ ] Review Home, default Atlas, selected family, search results, perfume details, and AI loading/error/close states.
- [x] Update README routing, feature/status descriptions, and remaining limitations to match the delivered behavior.
- [ ] Record final visual evidence only after reviewing the implemented pages.

## Handoff and next action

First milestone implemented on 2026-09-09: Phase 1 surface system and Phase 2 Home/Atlas structure. Phase 3 responsive/accessibility and Phase 4 search/result work were completed and browser-tested on 2026-09-10. README status was synchronized on 2026-09-11. `npm run build`, `npm run lint`, TypeScript, pagination, and whitespace checks pass.

Next: complete the remaining Phase 0 visual-state review, then continue with Phase 5 detail hierarchy and honest sensory interpretation.

For each future phase, record changed files, checks run, results, unresolved issues, and any approved design changes here. Do not mark a phase complete until its acceptance conditions have been checked.
