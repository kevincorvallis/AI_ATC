# Release verification — 2026-09-29

## Current release — Guided departure lesson

Published at https://klee.page/projects/wilco/ and linked from
https://klee.page/projects. Deployment: `dpl_7UFEXoWG7uKWqwJdqAqJLguyQCwm`
(`website-xkefdhxfd-kevin-lees-projects-e0039a73.vercel.app`).

- Six exchanges for student pilots: ground contact, taxi readback, tower handoff,
  tower contact, holding short, and takeoff-clearance readback.
- Examples fade to hints and independent responses. Feedback prioritizes critical
  information; the debrief offers targeted practice without the original hints.
- Optional controller playback and microphone input with an editable draft and
  explicit Transmit. Say again replays the instruction without a failed attempt.
  Microphone disclosure precedes activation; browser speech services may process
  audio. Wilco saves aggregate progress only, not speech recordings or transcripts.
- The original 20 individual scenarios remain available. No live AI backend or
  new native feature was deployed. The broader release limits below still apply.

### Current verification

- **95 tests passed:** 61 JavaScript and 34 Python. The nested-route packaging
  regression also passed after adding the explicit deployment base path.
- Built **18 allowlisted public assets**. The website upload contained 279 files,
  all matched against the live baseline or the 15 intended changed/new files.
- Chrome and WebKit each completed the six-exchange lesson with normal and blocked
  storage, locally and on the public URL. Tests covered corrections, repeat requests,
  targeted drills, aggregate persistence, simulated microphone denial, editable
  speech drafts, and rejection of stale voice events. No runtime errors or paid AI
  requests were observed. Real microphone quality was not tested on physical devices.
- Unsupported-voice fallback completed all six exchanges by typing in both browsers.
- All 20 existing scenarios passed in Chrome and WebKit; four focused browser
  combinations also passed legacy dialog, keyboard, cancellation and storage checks.
- Both slash/no-slash paths completed six exchanges in four local browser simulations
  using the exact release files and deployed security headers. Public Chrome also
  verified the no-slash route, microphone permission, and Projects-to-demo navigation.
- **20/20 candidate and 20/20 public HTTP checks passed:** changed content hashes,
  security headers, scoped microphone permission, private-source 404s, and unchanged
  authentication guards. The rest of the website keeps microphone access disabled.
- **10 focused website tests passed.** Unrelated local website edits were excluded.
- Source remains uncommitted; no Git push or backend resource change. Both project
  notes were updated. Evidence: `test-results/departure/`,
  `test-results/lesson-unsupported-voice/`, `test-results/lesson-basepath-simulation/`,
  and `../website/test-results/wilco-departure-release/`.

The following sections retain evidence from the earlier hardening release.

## Release scope

The public release is a self-contained, scripted web demo linked from
`https://klee.page/projects` at `https://klee.page/projects/wilco/`. It makes no
paid AI requests. Production readiness is established for that demo only; the
live AI service and native distribution have the remaining checks below.

## Changes

- Fixed nonfunctional Demo/Help buttons, demo-to-scenario navigation, autoplay
  cleanup, duplicate sends, and replies arriving after a session ended.
- Made demo mode explicit and default; bounded live requests and history,
  rejected invalid replies, and disclosed fallback to scripted responses.
- Hardened saved settings/progress against corrupt or unavailable storage;
  added keyboard access, dialog focus handling, and input limits.
- Corrected feedback to evaluate the previous controller instruction, match
  readback values instead of digits in a callsign, and always show critical
  feedback. Fixed terminal training states and visual reset.
- Replaced host-dependent backend packaging with standard-library HTTPS;
  validated request bodies/history, bounded upstream work, hid upstream errors,
  and added a separate authenticated deployment path.
- Added a working development server, public-asset allowlist build, regression
  suite, and CI verification. Private source and configuration are excluded
  from demo artifacts.

## Evidence

- Browser smoke checks exercised all 20 scenarios on desktop Chrome and mobile
  WebKit: zero runtime errors, zero paid API requests, no horizontal overflow,
  saved settings and progress persisted across reload.
- Frontend, phraseology/state, public-build, and backend tests are run with
  `npm test`. Final test and deployment results are recorded below after release.
- Native Release simulator build was tested with Xcode 27. A second build
  verifies the lifecycle fixes before completion.
- Website release starts with the SHA-1-verified source manifest of the live
  Vercel deployment, changing only the Wilco listing, its locale strings, and
  the new demo assets. Unrelated local website work is excluded.

## Remaining checks before broader production use

- Integrate user sign-in/token refresh in web/native clients and verify the
  authenticated backend with real tokens and provider failures. No authenticated
  cloud stack or new model was deployed in this pass.
- The old AWS endpoint still uses `AuthorizationType: NONE`. Coordinate its
  migration/retirement with existing clients; do not put it behind the public demo.
- Validate native microphone/speech behavior, interruptions, offline transitions,
  and accessibility on physical iOS devices before distribution.
- Have a qualified aviation instructor review the scenario content. Scores and
  diagrams are illustrative heuristics and do not certify communication proficiency.

## Initial local verification

- `npm test`: **57 passing tests** (23 JavaScript and 34 Python).
- `npm run build`: **14 public assets**, with all referenced scripts present and
  syntactically valid. No runtime dependency installation is required.
- Chromium desktop and WebKit mobile: **all 20 scenarios passed in each browser**,
  including under the website's nested `/projects/wilco/` route.
- Focused frontend browser checks passed in four combinations: Chrome/WebKit
  with normal/blocked browser storage. Dialog focus, Escape, autoplay cleanup,
  demo launch, and keyboard category activation were exercised.
- Native: **6 scripted-response checks passed**; Release simulator builds for
  arm64 and x86_64 succeeded. Physical-device and signed-archive tests remain.
- Backend: Python compilation, deployment shell syntax, and AWS CloudFormation
  server-side template validation passed. No backend cloud resources were changed.
- Website: **10 focused projects-page checks passed**. The unrelated full local
  website suite was stopped after 565 passes and 8 failures in newsletter/gallery,
  chat, and backcountry behavior (1 interrupted, 568 not run). Those changed files
  were excluded from this release by starting from the verified live source.
- Candidate deployment: **23/23 HTTP checks passed**, including exact SHA-1 content
  checks for every changed/new file, CSP on the demo, 404s for private-source paths,
  and unchanged authentication guards on the website's private page and API.

## Initial published release

- Production: https://klee.page/projects/wilco/; listing verified at
  https://klee.page/projects.
- Deployment: `dpl_2xu4PRBnd43q6PJoYCykXdXuAma1`
  (`website-3dtvihyll-kevin-lees-projects-e0039a73.vercel.app`).
- Post-promotion: **23/23 HTTP/content/security checks passed** on klee.page.
  Public browser verification again passed **all 20 scenarios in Chrome and
  WebKit**, with zero runtime errors or paid API calls.
- Source remains uncommitted in AI_ATC and the website checkout. No push or
  backend deployment occurred. Wilco and klee.page Obsidian notes were updated.
- Website source snapshot and reports:
  `../website/test-results/wilco-release/`. Browser screenshots/results:
  `test-results/browser/` (ignored local artifacts).

No claim is made that the historical live AI endpoint or native App Store
release is production-ready; see the remaining checks above.
