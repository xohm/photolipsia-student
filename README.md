# Photolipsia · Agentic coding

ZHdK · MA Interaction Design · HS 2026

This is your copy of the course repository. In it you build two small apps together with an AI
coding agent. You get **skeletons, not apps**: rules for the agent, a memory file and a check that
looks at the result. You and your agent write the code.

## Start here

1. **Setup:** [docs/student-setup.md](docs/student-setup.md): the tools, the API key, your fork.
2. **Example 1, your first agent loop:** [guides/01-text-stats.md](guides/01-text-stats.md)
3. **Example 2, a viewer for your own 3D scans:**
   - in class: [guides/02-splat-viewer.md](guides/02-splat-viewer.md)
   - on your own, step by step: [guides/02-splat-viewer-alone.md](guides/02-splat-viewer-alone.md)
4. **Big scans:** [docs/big-scans.md](docs/big-scans.md)

## Slides

- [Agentic Coding · Your first agent loop](https://xohm.github.io/photolipsia-student/slides/01-agentic-coding-basics.html)
- [Radiance Fields in the Browser](https://xohm.github.io/photolipsia-student/slides/02-radiance-field-viewer.html)

Arrow keys or space to move, F for full screen, P to save as PDF. They are also in `slides/` in
your fork: double-click to open them without internet access to GitHub.

## What's here

```
01-text-stats/      skeleton for example 1
02-splat-viewer/    skeleton for example 2
guides/             what to type into your agent, step by step
docs/               setup and background
slides/             the two slide decks
tools/              check-openrouter.mjs: tests your API key
```

Each skeleton has the same few files:

- `AGENTS.md`: the rules every agent reads
- `ai/strategy.md`: the plan and the decisions, the agent's memory
- `scripts/check.mjs`: `npm run check` opens your page in a hidden browser and writes a report and a screenshot

## The loop

**Plan → build → check → fix → log.** Small steps, every time.

## Save your work

After every step that works, in your terminal:

```bash
git add -A
git commit -m "What you did"
git push
```

`git push` saves it in your fork on GitHub, where your teacher can follow it.
