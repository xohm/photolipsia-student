# Student setup

Photolipsia · ZHdK · MA Interaction Design · HS 2026

You will use an AI coding agent in the terminal. It reads your project, plans, edits files,
runs commands and checks its own work. This page gets you from an empty laptop to a working agent.

Plan about 45 minutes. Do the steps in order. Commands are shown for **Mac** (Terminal, zsh)
and **Windows** (PowerShell). Where they are the same, there is one block.

Contents

1. [Prerequisites](#1-prerequisites)
2. [Your API key](#2-your-api-key)
3. [OpenCode (recommended)](#3-opencode-recommended)
4. [Codex CLI](#4-codex-cli)
5. [Claude Code](#5-claude-code)
6. [Smoke test](#6-smoke-test)
7. [The project skeleton, explained](#7-the-project-skeleton-explained)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### Terminal basics

- **Mac:** open *Terminal* (Spotlight: Terminal).
- **Windows:** open *Terminal* (Start menu: Terminal). It starts PowerShell.

You need four commands: `cd folder` (go into a folder), `cd ..` (go up), `ls` (list files,
works in PowerShell too) and `pwd` (where am I?). Stop a running program with **Ctrl+C**.

In the course you keep **two terminals** open: one for the agent, one for your own commands
(`git`, `npm run dev`). New tab: **Cmd+T** in Mac Terminal, **Ctrl+Shift+T** in Windows Terminal.

### Windows only: allow npm to run

PowerShell blocks scripts by default, which breaks `npm`. Run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Node.js (LTS) and Git

**Mac**
```bash
xcode-select --install
```
This installs Git and other developer tools (a dialog opens; click Install). Then install
Node.js LTS with the installer from https://nodejs.org (the "LTS" button). If you use
Homebrew, `brew install node` works too.

**Windows**
```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```
The first time, winget asks you to accept the source agreements: type **Y** and Enter.

**Close the terminal and open a new one** after installing. Then check:

```bash
node -v
npm -v
git --version
```

You want Node `v22.12` or newer (the current LTS is fine), npm 10 or newer, and any Git version.

Tell Git who you are (once, same on both):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### VS Code (optional)

A good editor to read what the agent writes.
**Mac:** download from https://code.visualstudio.com.
**Windows:** `winget install --id Microsoft.VisualStudioCode -e`

### Git and GitHub: your own fork

You keep your work on GitHub, in your own copy of the course repository: a **fork**.
Every `git push` saves your progress there, and your teacher can follow it.

1. Make a free account on https://github.com.
2. Install the GitHub command-line tool, then open a new terminal.
   **Mac:** the installer from https://cli.github.com (or `brew install gh`).
   **Windows:**
   ```powershell
   winget install --id GitHub.cli -e
   ```
3. Log in, once. Answer: GitHub.com, HTTPS, yes, log in with a web browser.
   ```bash
   gh auth login
   ```
4. Fork the course repository and download your fork into your home folder:
   ```bash
   cd ~
   gh repo fork xohm/photolipsia-student --clone
   cd photolipsia-student
   ```
   If the command still says TEACHER, ask your teacher for the right name.

You now have the folder `photolipsia-student`: the skeletons `01-text-stats` and
`02-splat-viewer`, the guides in `guides/` and these docs in `docs/`. The skeletons have no app
in them: you build the apps with your agent.

When your teacher updates the course repository, get the changes with `git pull upstream main`.

`npm run check` also needs a hidden browser (Chromium, about 120 MB). You install it once,
during the Example 1 setup.

---

## 2. Your API key

All agents talk to one model provider, OpenRouter, through a shared course key.
Your teacher gives you the key privately. It looks like `sk-or-v1-…`.

**Rules for the key**

- Put it only in your environment (below) or in your personal tool config in your home folder.
- **Never** put it in a project folder, a commit, a screenshot, a chat or a prompt.
- Never ask the agent to print it.

Don't type the key into a command: commands are saved in your shell history.

**Mac**: open your shell settings file in TextEdit:
```bash
touch ~/.zshrc
open -e ~/.zshrc
```
Add this line at the end, with the real key, save, close TextEdit, then reload:
```text
export OPENROUTER_API_KEY="sk-or-..."
```
```bash
source ~/.zshrc
```

**Windows**: this asks for the key and stores it for your user. Paste the key when asked:
```powershell
[Environment]::SetEnvironmentVariable('OPENROUTER_API_KEY', (Read-Host 'Paste the key'), 'User')
```
Then **open a new terminal**: old ones don't see it. (`setx OPENROUTER_API_KEY "sk-or-..."` does the
same, but leaves the key in your PowerShell history.)

Then test it, in your fork:

```bash
cd ~/photolipsia-student
node tools/check-openrouter.mjs
```

You want: the course model answers (`200 OK`) and another model is blocked (`403 OK`).

> **If the key changes** (your teacher hands out a new one), update it everywhere you put it:
> the line in `~/.zshrc` (Mac) or the command above again (Windows), `ANTHROPIC_AUTH_TOKEN` in
> `~/.claude/settings.json` if you use Claude Code, and `/connect` in OpenCode if you used it.
> Then open a new terminal.

---

## 3. OpenCode (recommended)

OpenCode works well with the course model (GLM) and is the primary tool in this course.

### Install

Same on both:
```bash
npm install -g opencode-ai@1
opencode --version
```

You want version 1.x: `@1` makes sure of that. This course was prepared with OpenCode 1.14 to 1.19.

> Don't use `brew install opencode`: it installs OpenCode 2, which works differently
> from what this course shows.

### Config file

Create the config file and open it in a text editor.

**Mac**
```bash
mkdir -p ~/.config/opencode
touch ~/.config/opencode/opencode.json
open -e ~/.config/opencode/opencode.json
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\.config\opencode"
notepad "$HOME\.config\opencode\opencode.json"
```

Paste this and save:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/z-ai/glm-5.3-flash",
  "small_model": "openrouter/z-ai/glm-5.3-flash",
  "provider": {
    "openrouter": {
      "models": {
        "z-ai/glm-5.3-flash": { "options": { "reasoning": { "effort": "high" } } },
        "z-ai/glm-5.3": { "options": { "reasoning": { "effort": "high" } } }
      }
    }
  }
}
```

- `model` is the default model: GLM-5.3 Flash. Cheap, fast and it can look at screenshots.
- `small_model` is used for small background jobs such as session titles. Without it, OpenCode
  picks another model, which the course key blocks.
- `effort: "high"` keeps thinking shorter than the default (`max`). Use `"low"` for faster answers.

On Windows, Notepad asks whether to create the new file: click **Yes**. The same happens for the
Codex and Claude Code config files below.

### Connect the key

OpenCode reads `OPENROUTER_API_KEY` from your environment. If it still asks for a key,
start `opencode` and type `/connect`, choose **OpenRouter** and paste the key.

### First run

In a project folder:

```bash
opencode
```

Type `/models` and check that **GLM 5.3 Flash** (OpenRouter) is selected. For a hard problem,
switch to GLM 5.3 with `/models` and switch back afterwards: it can cost up to about ten times
more and **cannot see images**. Quit with `/exit` or **Ctrl+C**.

The project's `opencode.json` makes OpenCode ask before shell commands, except the loop
commands (`npm test`, `npm run check`, `node`, `git status`, `git diff`). Read what it wants to
run before you allow it.

---

## 4. Codex CLI

### Install

Same on both:
```bash
npm install -g @openai/codex
codex --version
```

### Config file

Codex only reads providers from your user config, never from a project folder.

**Mac**
```bash
mkdir -p ~/.codex
touch ~/.codex/config.toml
open -e ~/.codex/config.toml
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\.codex"
notepad "$HOME\.codex\config.toml"
```

Paste and save:

```toml
model = "z-ai/glm-5.3-flash"
model_provider = "openrouter"
model_reasoning_effort = "high"

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
wire_api = "responses"
env_key = "OPENROUTER_API_KEY"

[tui]
auto_recap = false
```

- `wire_api = "responses"` is the only value Codex supports.
- `env_key` reads the key from your environment, so nothing secret is in this file.
- `auto_recap = false` stops Codex from writing summaries in the background, which costs tokens.
- Codex may warn about an "unknown model" and use default settings for it. That is fine.

### First run

```bash
codex
```

Codex asks whether you trust the folder: yes, for your project folders.
Switch models with `/model`. Quit with `/quit` or **Ctrl+C**.

Codex runs commands in a **sandbox without network**. `npm install` and `npm run check`
(it starts a local server and a browser) may need to run outside it: when Codex asks,
approve. For `npm run check`, choose the option that stops it asking again.

---

## 5. Claude Code

Claude Code is built for Anthropic's models. OpenRouter only guarantees it with those,
so with GLM some features may not work. **OpenCode is the safer choice in this course.**

### Install

**Mac**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows**
```powershell
irm https://claude.ai/install.ps1 | iex
```

Open a new terminal, then `claude --version`.

### Settings file

**Mac**
```bash
mkdir -p ~/.claude
touch ~/.claude/settings.json
open -e ~/.claude/settings.json
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\.claude"
notepad "$HOME\.claude\settings.json"
```

Paste and save. If the file already has content, add the `env` block to it instead.

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_AUTH_TOKEN": "sk-or-...",
    "ANTHROPIC_API_KEY": "",
    "ANTHROPIC_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_FABLE_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "z-ai/glm-5.3-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "z-ai/glm-5.3-flash"
  }
}
```

- Replace `sk-or-...` with the course key. This file is in your home folder, not in a
  project, so that is fine. Never copy it into a project.
- `ANTHROPIC_API_KEY` must stay an empty string.
- Every model name points to GLM-5.3 Flash, so background jobs and helpers also use it.

### First run

```bash
claude
```

- If you ever logged in with an Anthropic account: type `/logout`, quit, start `claude` again.
- Type `/status`: it should show the OpenRouter base URL and an auth token.
- Effort settings (`/effort`) are made for Anthropic models and probably have no effect on GLM.
- On Windows, Claude Code runs commands in PowerShell. Git for Windows is optional.

Quit with `/exit` or **Ctrl+C**.

---

## 6. Smoke test

Make an empty folder and start your agent in it.

**Mac**
```bash
mkdir ~/hello-agent
cd ~/hello-agent
opencode
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\hello-agent"
cd "$HOME\hello-agent"
opencode
```

(Use `codex` or `claude` instead of `opencode` to test those.) Type:

```text
Create hello.js that prints "Hello from GLM", then run it with node.
```

The agent creates the file and runs `node hello.js`. Some tools ask first: allow it.
You should see `Hello from GLM`. If that works, you're set up.

---

## 7. The project skeleton, explained

Every project in this course, however small, has the same few files. They keep the agent
on track, keep secrets and big files away from it, and let it check its own work.

```
project/
├── AGENTS.md              rules for the agent
├── CLAUDE.md              one line: @AGENTS.md
├── ai/strategy.md         goal, plan, decisions, next step
├── .gitignore             what git never stores
├── .ignore                what agent search skips
├── .claude/settings.json  files Claude Code may not read or edit
├── opencode.json          files OpenCode may not read or edit
├── package.json           npm run dev, npm test, npm run check
├── scripts/check.mjs      opens the app, reports, takes a screenshot
├── scripts/app-checks.mjs checks for this app only (optional)
├── src/                   your app, in small modules
├── tests/                 unit tests for pure logic
└── index.html             the page
```

**`AGENTS.md`** holds the rules, written once and read by every tool. Read the plan first,
work in small steps, run the checks after every change, never touch secrets. Codex and
OpenCode read it on their own.

**`CLAUDE.md`** contains one line, `@AGENTS.md`. Claude Code reads `CLAUDE.md`, and the line
imports the same rules. One source of truth, no copies to keep in sync.

**`ai/strategy.md`** is the agent's memory, and you can read it: the goal in one sentence,
the plan as checkboxes, one line per decision ("because …") and the next step. A new session
starts by reading it. When you come back tomorrow, so do you.

**`.gitignore`** lists what git never stores: `node_modules/` (reinstall with `npm install`),
`.check/` (generated), `.env*` (secrets), `dist/`, system files and large assets like
`public/splats/*`.

**`.ignore`** lists what agent search skips. Search tools built on ripgrep read it.
It also works in folders that are not git repositories, where `.gitignore` is ignored by search.
Here it hides `package-lock.json`: committed, but only noise when searching.

**`.claude/settings.json`** and **`opencode.json`** are hard rules. They deny reading and
editing `.env*`, `node_modules/` and `public/splats/`. Rules in `AGENTS.md` are polite
requests; these are enforced by the tool.

**`package.json`** has three scripts: `npm run dev` starts the local server, `npm test` runs
the unit tests and `npm run check` checks the real page.

**`scripts/check.mjs`** is the agent's eyes. It starts the app, opens it in a hidden browser,
waits until the app says it is ready, then writes `.check/report.json` (errors, warnings,
failed requests, colours on screen, the page text) and `.check/screenshot.png`. The agent
reads both and fixes what it sees. **`scripts/app-checks.mjs`** adds checks only this app
needs, such as "the canvas is not blank".

### What each tool reads and searches

| | OpenCode | Codex CLI | Claude Code |
|---|---|---|---|
| Rules file | `AGENTS.md` (falls back to `CLAUDE.md`) | `AGENTS.md` | `CLAUDE.md`, which imports `AGENTS.md` |
| Search skips `.gitignore` files | Yes, inside git repositories | `@` file search: yes, inside git repositories | Grep tool and `@` file picker: yes. Glob tool: no |
| Search skips `.ignore` files | Yes | `@` file search: yes | Grep tool: yes. Bash `grep`: no |
| Can open an ignored file by its path | Yes, unless denied | Yes, with shell commands | Yes, unless denied |
| Hard deny rules | `opencode.json` → `permission.read` / `edit` | Beta "permission profiles" only, not used here | `.claude/settings.json` → `permissions.deny` |
| `.env` files by default | Asks before reading | Readable | Readable |

What this means:

- **Ignore files hide things from search. They don't lock anything.** The agent can still open
  an ignored file by name. That is on purpose: it must read `.check/report.json`, which git ignores.
- **Deny rules lock files**, but only in OpenCode and Claude Code, and not perfectly: a script
  the agent runs can still open anything. Keep secrets out of projects altogether.
- **Codex** relies on `AGENTS.md`, `.gitignore` and `.ignore`, and on its sandbox.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `403` "permission denied" or a model "not allowed" | The tool asked for a model the course key doesn't allow. Check the model name in your config. OpenCode: is `small_model` set? Claude Code: are all model variables set? |
| `403` "Budget limit exceeded" | Today's course budget is used up. It resets at midnight UTC (1 or 2 am in Zurich). Tell your teacher. |
| `401` "User not found" or "invalid key" | Typo in the key, or the terminal doesn't see it. Windows: open a new terminal after `setx`. Mac: `source ~/.zshrc`. Run `node tools/check-openrouter.mjs`. |
| `model_not_found`, `404` | Typo in the model name. OpenCode needs `openrouter/z-ai/glm-5.3-flash`, Codex and Claude Code need `z-ai/glm-5.3-flash`. |
| Images are rejected or ignored | GLM-5.3 can't see images. Switch back to GLM-5.3 Flash. |
| Codex: "wire_api = chat is no longer supported" | Use `wire_api = "responses"`. |
| Codex ignores your provider | It must be in `~/.codex/config.toml` (Windows `%USERPROFILE%\.codex\config.toml`), not in a project's `.codex/config.toml`. |
| Codex: `npm run check` fails with "EPERM", "listen" or browser errors | The sandbox blocks the local server or the browser. Approve running it outside the sandbox. |
| Claude Code still uses your Anthropic login | `/logout`, quit, start again. `/status` must show `https://openrouter.ai/api`. |
| Windows: "running scripts is disabled on this system" | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then a new terminal. |
| `node` or `npm` "not recognized" / "command not found" | Open a new terminal after installing Node. Still not found: reinstall Node LTS. |
| `npm run check`: "Chromium for Playwright is missing" | `npx playwright install chromium` |
| `npm run dev`: "Port 5173 is in use" | Another dev server is still running. Find its terminal and press Ctrl+C. Vite also tries 5174 by itself: read the URL it prints. |
| The agent hangs after starting `npm run dev` | The server never ends, so the agent waits. Press Esc (or Ctrl+C) in the agent, and run `npm run dev` in your own terminal. |
| `npm run check`: "App not ready … within 10000 ms" | The page never set `window.__APP_READY__ = true`. Look for a page error above it in the report. |
| A big scan is slow or jerky | Convert it to `.rad` and/or lower the detail with `?detail=0.5`. See [big-scans.md](big-scans.md). |
| No **Enter VR** button in the splat viewer | The browser can't do VR. Mac browsers never can: use the Quest browser with `npm run dev:vr`. On Windows, Quest Link plus Chrome or Edge also works. See Example 2, prompt 7. |
| The Quest can't open the `https://…` address from `npm run dev:vr` | Same Wi-Fi? University Wi-Fi often isolates devices: try a phone hotspot. Allow `node` through the firewall (Mac), or private networks (Windows). |
| `npm install` fails with "Cannot read properties of null (reading 'edgesOut')" | Old npm with a newer package. Update Node to the current LTS. |
| Windows: a firewall prompt when starting `npm run dev` | Allow on private networks, or cancel: the local page still works on your own laptop. |
