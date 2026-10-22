# Wilco — ATC practice demo

Start with a five-minute departure lesson at fictional Metro Airport. Practice
six radio calls from ground contact to a takeoff-clearance readback. Examples
fade into hints and independent responses; feedback explains missed information
and offers immediate retries. A debrief lets you repeat the skills you missed.

Use controller audio with adjustable speed and an optional microphone, or type.
Recognized speech stays editable and is never submitted automatically. Controller
replies and evaluation are scripted locally; no account or API key is needed.
Browser speech recognition may send audio to the browser vendor's speech service.
Wilco does not save recordings or transcripts. Only aggregate practice results
and preferences are stored locally; blocked storage does not prevent practice.

The original 20 individual scenarios remain available below the lesson.

**Simulation only.** Responses, scores, frequencies, weather, and diagrams are
illustrative, not operational flight information or a substitute for instruction.

## Run and verify

Use Node.js 24+ and Python 3.11+. No dependency installation is needed.

```sh
npm run dev      # http://127.0.0.1:8000
npm test         # frontend, training, packaging, and backend regression tests
npm run build   # only public runtime assets are copied into dist/
```

For a nested website route, build with `npm run build -- --base-path=/projects/wilco/`.
This keeps asset links correct when the host serves the URL with or without its final slash.

Deploy `dist/`, never the repository root. The Vercel configuration builds that
directory automatically. Use the base-path option above for a subdirectory deployment.

An optional browser check uses an existing Playwright installation and installed
Chrome/WebKit browsers. With the local server running:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/check-browser.cjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/lesson.browser.cjs
```

It exercises every scenario, settings persistence, modal access, horizontal
overflow, runtime errors, and accidental paid API requests on desktop and mobile.
Screenshots and results go into ignored `test-results/browser/`.
The lesson check covers six exchanges, corrections, targeted drills, saved summaries,
blocked storage, and simulated speech draft/denial/cancellation in Chrome and WebKit.
Its evidence is in `test-results/departure/`; real microphone quality still needs
hands-on device testing.

## Optional live AI backend

The public build defaults to `ATC_CONFIG.mode: 'demo'`. Do not embed a service
secret in `config.js` or change to live mode without a real user sign-in flow.
The browser and native clients still need JWT acquisition/refresh before using
the new authenticated backend.

`backend/` contains a dependency-free Python Lambda, regression-tested request
validation, bounded upstream calls, and an AWS CloudFormation deployment path.
It preserves the existing GPT-4 model and requires API Gateway JWT authorization
with the configured scope. See [backend/README.md](backend/README.md).

The historical anonymous `ai-atc-function` endpoint is separate from that new
deployment. This maintenance pass does not silently migrate or retire existing
clients. Do not describe the paid AI service as production-ready until user
authentication, rate limits/monitoring, and its retirement or migration are
verified end to end.

## Native app and release evidence

`Wilco/` contains the SwiftUI companion. A successful simulator Release build
does not establish device, microphone, sign-in, or App Store release readiness.
See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for verified results and
remaining release checks. Older deployment and feature notes in this repository
describe earlier prototypes; this README and the backend README are current.

MIT licensed.
