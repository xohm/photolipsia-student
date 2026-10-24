# Rules for coding agents

## Before you code
- Read `ai/strategy.md` first.
- New task? Write the plan into `ai/strategy.md`, then stop and wait for "go".

## Work loop
- Work in small steps: one plan step at a time.
- After every change, run `npm test` and `npm run check`.
- Read `.check/report.json` and look at `.check/screenshot.png`. If you cannot see images, say so and use `visual` and `page` in the report. Never describe what you did not see.
- Fix errors yourself before you report. Never say "done" without a passing check.
- Every feature you can see on the page gets a check in `scripts/app-checks.mjs`.
- The app sets `window.__APP_READY__ = true` once it has drawn, or `window.__APP_ERROR__ = 'message'`.
- Tick off plan steps in `ai/strategy.md`, log each decision in one line, and update `## Next` before you stop.

## Never
- Never read or edit `.env*`, `node_modules/` or large binaries such as `public/splats/*`.
- Never print secrets or API keys.
- Never edit `.check/`. It is generated output: read it.
- Never start `npm run dev` or other commands that do not exit. Use `npm run check` to see the app.

## Code style
- Plain ES modules. Small files, one job each.
- No new dependencies without asking.

## When stuck
- After two failed attempts, stop and explain what you tried.
