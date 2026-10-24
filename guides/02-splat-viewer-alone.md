# Build your own splat viewer with an agent

You build a viewer for your own 3D scans, step by step, together with an AI agent.
At the end you can open your scan in the browser, look around, and step into it with a Quest 3.

You don't write the code. You plan, decide and check. The agent writes the code.
Plan about three hours. It works with OpenCode and GLM-5.3 Flash, the course model.

---

## 1. Set up the project

Your setup must work first, including your own fork of the course repository:
[docs/student-setup.md](../docs/student-setup.md), "Git and GitHub".

The folder `02-splat-viewer` in your fork is a **skeleton**: rules for the agent, a memory file,
the check, the build steps. There is no app in it. You and your agent build the app.

Open two terminals:

- **Agent terminal:** here you talk to the agent.
- **Your terminal:** here you type your own commands.

In **your terminal** (the same on Mac and Windows):

```bash
cd ~/photolipsia-student/02-splat-viewer
npm install
npx playwright install chromium
npm run check
```

**You should see:** `check: FAILED … Nothing rendered yet`. That is right: there is no page yet.

In the **agent terminal**, go to the same folder and start the agent:

```bash
cd ~/photolipsia-student/02-splat-viewer
opencode
```

Type `/models` and choose **GLM 5.3 Flash**.

---

## 2. The first prompt

Copy this into the agent:

```text
Read AGENTS.md, ai/strategy.md, ai/steps.md and ai/spark-facts.md.
Write the goal and the 8 steps from ai/steps.md into ai/strategy.md as
the plan, unticked. Write "Step 1" under ## Next. Don't write code yet.
```

Open `ai/strategy.md`. You should see the goal and 8 steps.

---

## 3. The loop: plan, go, check

You do every step the same way, with the same three prompts. Only the step number changes.

**A. Plan.** Copy, and change the number:

```text
Plan step 1. Read step 1 in ai/steps.md and ai/spark-facts.md. Write 3 to
5 small tasks for it into ai/strategy.md. Don't write code yet.
```

Read the tasks in `ai/strategy.md`. Do they make sense? If not, say what to change.

**B. Go.**

```text
Go. Do the tasks of step 1, one at a time. After each change run npm test
and npm run check, and fix errors yourself.
```

**C. Check.**

```text
Show me the result: the summary line from .check/report.json, and two
sentences about .check/screenshot.png. Then tick off step 1 in
ai/strategy.md and write the next step under ## Next.
```

Now look yourself: open `.check/screenshot.png`. Does it match "You should see" in the table
below? Then save your work in **your terminal**, one commit per step:

```bash
git add -A
git commit -m "Step 1"
git push
```

`git push` saves the step in your fork on GitHub. And on to the next step: A, B, C again, with the
next number.

---

## 4. The 8 steps

| Step | What you build | You should see |
|---|---|---|
| 1 | An empty page | `check: OK`. The screenshot is an empty dark page |
| 2 | The test splat | A rainbow sphere with a ring, **red on top** |
| 3 | Errors and app checks | `check: OK … 2/2 app checks` |
| 4 | A camera you can move | The sphere fills the window, seen from slightly above |
| 5 | Your file, clear errors | `check: OK`. A wrong file name gives "File not found" |
| 6 | Open file, drag and drop | `check: OK … 3/3 app checks` |
| 7 | Big scans | `check: OK`. The splat count is a bit higher than 6,500 |
| 8 | VR | `check: OK … 4/4 app checks`. No VR button on your laptop |

After step 6, look at your own scan: in **your terminal** (never in the agent) run `npm run dev`,
open http://localhost:5173 and drag your scan onto the page. Stop the server with Ctrl+C.

---

## 5. Your scan, big scans, VR

- **Big scan, slow?** Convert it to a `.rad` file: [docs/big-scans.md](../docs/big-scans.md).
  Put it in `public/splats/`, run `npm run dev`, open http://localhost:5173/?file=my-scan-lod.rad.
- **VR on Windows** (PC + Quest Link): in the Meta Horizon Link app set Link as the active OpenXR
  runtime, connect the cable, run `npm run dev`, open http://localhost:5173 in Chrome,
  press Enter VR and allow VR **on the monitor**.
- **VR from a Mac** (the Quest renders by itself): run `npm run dev:vr`, open the `https://…`
  address it prints in the **Quest browser**, accept the warning, press Enter VR.
  Same Wi-Fi for both.

---

## 6. When something goes wrong

**The check says OK, but the picture is wrong** (empty, upside down, too small).
```text
The check says OK, but the screenshot doesn't show <what you expected>.
Read "visual" in .check/report.json and tell me what is missing.
```

**The check fails.**
```text
The check fails. Read the summary in .check/report.json and explain the
cause in two sentences before you change code.
```

**It goes in circles.**
```text
Stop. Tell me what you tried. Don't change code.
```
Then undo everything since your last commit, in **your terminal**: `git restore .`
Try the step again, in smaller tasks.

**It wants to read `node_modules`.**
```text
Don't read node_modules. Use ai/spark-facts.md.
```

**It gets slow or forgets things.** Quit the agent (`/exit`), start it again, and write:
```text
Read AGENTS.md, ai/strategy.md, ai/steps.md and ai/spark-facts.md. Then
continue with the step under ## Next: plan it first.
```
A new session every two or three steps keeps the agent fast and cheap.

**It says it can't see images.** Choose GLM 5.3 **Flash** again with `/models`.

**Really stuck?** Ask the agent to explain the problem in simple words:
```text
Explain in simple words what doesn't work and why. Don't change code.
```
Then show your teacher: push, and send the link to your fork.

---

Done when `npm test` passes, `npm run check` says OK, and your own scan opens when you drop it on
the page. Push, and send your teacher the link to your fork.
