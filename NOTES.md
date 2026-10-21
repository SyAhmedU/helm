# helm — project notes

> Offloaded from the root `CLAUDE.md` to keep that index lean. Canonical detailed reference — read before editing.

### Project — Helm (**standalone pitch project, NOT a suite surface**)

**What this is:** a from-scratch redesign of **FACE Prep's own internal Authoring Portal** (admin.faceprep.in / admin-dev.faceprep.in) — the tool the Campus Manager uses to manage AMET's institutions/batches/students/assessments inside FACE Prep's real system. Commissioned 2026-08-24 from the CM sharing a live `admin.faceprep.in/c/batch?...institution_id=college1459` link and asking for "a new project… make this portal better." Scope decided via clarifying questions: **the whole Authoring Portal** (not just Batches), reusing the **existing SPEC.md description + campusdesk's already-built schema** as ground truth rather than fresh screenshots.

**Grounding / No-fab:** the schema (Institutions/Batches/Users/Questions/Assessments/Configured Assessments/Courses·Modules·Learning Units/Administrations/Attempts/Tags/Logs — every field name) is real, reverse-engineered from `campusdesk/SPEC.md` (56 real screenshots of the actual product, shared by the CM in July). **This project has NO connection to the real system** — it's a standalone client-heavy app with its own tiny backend and its own demo data. Every institution/batch/student/question/attempt inside is **simulated** (seeded procedurally, `lib/seed.js`, seed `20260824`) — labelled as such on the login screen and here. Two exceptions, both just NAMES, not data: (1) six institution names (Meadow Institute, Greenfield Institute of Technology, Stonebridge Academy, Silverstone Academy, Northgate College, Maplewood College of Science) are FACE Prep's own real UAT/demo institutions, observed verbatim in the SPEC.md screenshots; (2) "AMET University" is added as a 7th institution because that's the real context this was commissioned from — everything under it (batches/students/scores) is still fabricated demo content, never real AMET/FACE Prep records.

**Stack:** Express (`app.js` default-export, `server.js` local :4001, `api/index.js` Vercel) + `lib/store.js` (Upstash Redis when `UPSTASH_REDIS_REST_URL`/`_TOKEN` set, else flat JSON `data/db.json`, same pattern as campusdesk/task-manager) + JWT auth (`lib/auth.js`, scrypt password hashing, no bcrypt dep) + generic CRUD (`CRUD` config table in `app.js`, mirrors campusdesk's pattern). React 19 + Vite 6 + Tailwind 4 (`client/`, CSS-first `@theme` tokens in `index.css` — no `tailwind.config.js`). `npm run install:all` · `dev` (API :4001 + Vite :5173, proxied) · `build`/`start`.

**Design identity — deliberately NOT Syed-fire:** this is a redesign of FACE Prep's OWN product, so it carries FACE Prep's own red (`--color-brand-500 #E31B23`) on a dark-ink "operations control center" ground, Sora (display) + Inter (body) + JetBrains Mono (ids), rather than the suite's warm-gradient S-mark. No `syed-gate`/`syed-pwa`/`syed-dynamic`/brand-bar tooling applied (same stance as amet-ceii — standalone identity). Demo login pre-filled: `admin@helm.demo` / `helm@demo123` (Super Admin).

**What's deep vs. scaffolded (be honest about this when asked "is it done"):**
- **Deep, the headline pitch:** `admin/Dashboard.jsx` (a real rollup — the original has literally no home dashboard, you land straight in a collection list) + `admin/Batches.jsx` (a genuine hierarchical tree explorer — institution rail → parent/subgroup tree → inline student roster, replacing the original's flat data-grid + "VIEW SUBGROUPS"/"VIEW STUDENTS" modal popups) + `admin/Institutions.jsx` + `admin/Users.jsx` (paginated, filterable). These four got the most design iteration.
- **Solid, working, less exhaustive:** `admin/Questions.jsx` (MCQ + RC create/edit, plain textareas — **no markdown split-view editor or Monaco coding-language support**, unlike the real portal's Coding question type); `admin/Assessments.jsx` (assessment + its configured-assessment delivery settings shown inline as one flow — Shuffle/Integrity/Result/Retake toggles — instead of two separate collections to hunt down); `admin/Courses.jsx` (Course → Module → Learning Unit tree, reuses the same drill-down instinct as Batches); `admin/Delivery.jsx` (a publish wizard + Scheduled/Live/Completed status board instead of a flat administrations list); `admin/Attempts.jsx` (score-distribution histogram + status breakdown + a violations panel ABOVE the paginated raw log, not instead of it); `admin/Tags.jsx` / `admin/Logs.jsx` (System — deliberately light).
- **Not built (documented roadmap, not silently dropped):** Coding-question Monaco editor + test cases + "Test Solution" runner; Reading-Comprehension multi-sub-question authoring beyond one; Bulk Upload TSV pipeline (all 6 targets from SPEC.md); Image Storage folder tree; Logs → Custom Export field-picker/CSV; SEB config-key generation; scheduled-result-date UI; per-student attempt drill-down / retake tracking; light/dark toggle + i18n icon the real portal has.

**Bugs fixed during build (kept here so they're not re-introduced):** percentage `height` on a flex-column child doesn't resolve without an explicit parent height — the score-distribution bars in both Dashboard and Attempts were invisible until switched to a pixel-height formula (`Math.max(v?4:0,(v/max)*N)+'px'`). A `<button>` nested inside another `<button>` (Courses' `ModuleCard` header) is invalid HTML and breaks click targeting — the outer element must be a `role="button"` div, never a real button, when it contains its own action buttons.

**Command palette** (`components/Shell.jsx`, ⌘K/Ctrl-K) — fuzzy-free substring jump to any of the 11 modules; the one piece of "world-class speed layer" carried over in spirit from other suite projects, since the original has zero cross-module search.

Verified end-to-end with a headless Playwright pass (login → every module → forms → pagination → command palette) — **0 console/page errors** on the final build.

Repo: **SyAhmedU/helm** (public — matches amet-ceii's stance; no real data ever touches it). Deploy: **Vercel** → see root `CLAUDE.md` project entry for the live URL once deployed.


## Campus operations polish — 2026-10-04
Responsive mobile sidebar with Escape, focus containment and focus return; persistent simulated-data notice; Launchpad return link. Login labels/autocomplete, clearer copy. Dashboard handles failed/incomplete responses with retry instead of indefinite loading/crash. Client build and browser checks cover failed request/retry/mobile overflow/menu focus using explicitly simulated fixtures. Existing npm test references a missing test/api.verify.mjs; no claim of that suite passing.


## UI/UX review — 2026-10-10

Shared mobile form sizing and focus/readability baseline. Existing navigation and demo labeling retained. Browser and build evidence is recorded in `../output/design-review-2026-10-10/`. This is a heuristic/interaction review, not a complete accessibility certification or user study.


## Upstash DB deleted → moved onto faceprep's DB (2026-10-21)

Own free DB `clever-yeti-89002` was deleted by Upstash (NXDOMAIN; every route hung 60 s+ in the seed middleware). Production now sets `UPSTASH_REDIS_REST_URL/_TOKEN` (sensitive; `lib/store.js` prefers them over the integration's stale `KV_*` vars) → faceprep-campus's DB, keys `helm:*`; demo data re-seeded on first request. ⚠ Shared DB (also holds real faceprep/campusdesk data) — never FLUSHDB.
