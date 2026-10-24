# Example 1: text stats, your first agent loop

A tiny app: paste text, see words, characters, sentences and reading time.
The app is not the point. The loop is: **plan → build → introspect → fix → log**.

Every prompt ends the same way: the agent runs `npm test` and `npm run check`,
reads `.check/report.json`, looks at `.check/screenshot.png` and tells you what it sees.

## Two terminals

Keep two terminal windows or tabs open in your project folder:

- **Agent terminal:** runs `opencode` (or `codex`, `claude`). You type prompts here.
- **Your terminal:** your own commands: `git`, `npm run dev`, opening files.
  New tab: **Cmd+T** in Mac Terminal, **Ctrl+Shift+T** in Windows Terminal.

Never ask the agent to run `npm run dev`: the server never ends, and the agent waits forever.

## Setup (once)

You work in your own fork of the course repository: see [docs/student-setup.md](../docs/student-setup.md),
"Git and GitHub". The folder `01-text-stats` in it is a skeleton: the rules, the memory, the checks,
and no app yet. You build the app.

In your terminal (the same on Mac and Windows):

```bash
cd ~/photolipsia-student/01-text-stats
npm install
npx playwright install chromium
npm run check
```

`npx playwright install chromium` downloads the hidden browser for `npm run check`
(about 120 MB, once per laptop). `npm run check` should then say **FAILED: Nothing rendered yet**.
That is correct: there is no page yet.

Now start your agent in the same folder, in your agent terminal: `opencode` (or `codex`, `claude`).

## Prompt 1: plan

```text
Read AGENTS.md and ai/strategy.md. We are building a small web page: a text box
where I paste text, and below it live counts of words, characters and sentences,
plus the reading time. Put the counting logic in src/stats.js as pure functions
and export textStats(text), which returns { words, characters, sentences,
readingMinutes }. Test it with node:test in tests/stats.test.js. Fill in the
Goal and a plan of 4 to 6 small steps in ai/strategy.md. Don't write code yet.
```

Read the plan in `ai/strategy.md`. Change it if you disagree. The plan is yours.

## Prompt 2: build, tests first

```text
Go with step 1. Write the tests in tests/stats.test.js first, run npm test and
show me that they fail. Then write src/stats.js until they pass. npm run check
will still say "Nothing rendered yet": that is fine until the page exists.
Tick off the step in ai/strategy.md and stop.
```

Tests that fail first prove that they test something. Then continue:

```text
Continue with the next steps: index.html and src/main.js, so the page shows the
four numbers live while I type. Mark each number with data-stat="<key>", using
the keys from textStats(). Then simple styling: calm, readable, large numbers.
Set window.__APP_READY__ = true when the page is ready. One step at a time.
After each step run npm test and npm run check, tick it off in ai/strategy.md
and tell me what you see in the screenshot.
```

With only `index.html` and no `main.js` yet, the check waits 10 seconds and says
**App not ready**. That is expected: nothing sets `window.__APP_READY__` yet.

## Prompt 3: introspect and fix

```text
Run npm run check. Read .check/report.json and look at .check/screenshot.png.
Describe the page in two sentences. Then add scripts/app-checks.mjs (see the top
of scripts/check.mjs for the format): type a sample sentence into the text box
and check that each [data-stat] number on the page matches textStats() from
src/stats.js. Run the check until it passes.
```

Open `.check/screenshot.png` yourself. Does it match what the agent described?

## Prompt 4: break it

Break the app on purpose and watch the check catch it. In your terminal:

1. In `index.html`, change `data-stat="sentences"` to `data-stat="sentence"`. Save.
2. Run `npm test`. It **passes**: the counting logic is fine.
3. Run `npm run check`. It **fails**. Read the `summary` at the top of `.check/report.json`.
   Depending on how `main.js` was written, it is a page error
   (`Cannot set properties of null … (at /src/main.js:…)`) or a failed app check
   (`page shows undefined`).

Unit tests check the logic. The check looks at the real page. You need both.

```text
npm run check fails. Read .check/report.json, find the cause and fix it.
Don't change the tests or scripts/app-checks.mjs.
```

Then try a feature that touches several files:

```text
Add a "Clear" button that empties the text box and resets all numbers.
Plan it in ai/strategy.md first and wait for my "go".
```

Look at `scripts/app-checks.mjs`: is there a check for the button? `AGENTS.md` says every
feature you can see gets one. If it is missing, ask for it.

**Undo:** if the agent made a mess, `git restore .` puts every committed file back as it was
at the last commit. New files stay: `git status` lists them.

## Prompt 5: review and commit

```text
Summarise what changed since the last commit in five lines.
```

Then read for yourself, in your terminal. `git add -A` first, so new files show up too:

```bash
git add -A
git status
git diff --cached
```

The diff opens in a viewer: scroll with the arrow keys, press **q** to leave.
Read `ai/strategy.md`: are the decisions written down, each with a "because"? Then commit and
push, so your work is saved in your fork on GitHub:

```bash
git commit -m "Text stats with live counts"
git push
```

(`git` commands are the same on Mac and Windows.)

## Prompt 6: change the rules, start fresh

The rules and the strategy file only matter if they survive a new session. Try it.

1. Add one line of your own to `AGENTS.md`, under `## Code style`, for example:
   `- All text on the page is in sentence case.` Commit it.
2. Quit the agent (`/exit`, or Ctrl+C) and start it again. It now remembers nothing.
3. Ask:

```text
Read AGENTS.md and ai/strategy.md, then do the step under ## Next.
```

Does the new session know where you stopped? Does it follow your new rule?
That is the point of both files.

## Done when

- `npm test` passes
- `npm run check` says **OK** and the screenshot shows your page
- `ai/strategy.md` has the plan ticked off, one line per decision and a current `## Next`

