# Agents Guidelines — sailes-app-builder framework repo

> Single source of truth for how agents work in **this** repo. CLAUDE.md imports this via @AGENTS.md.
> Framework-Version: 1.9.2
>
> This repo is not a product — it is the framework that generates and governs product repos.
> `skills/sailes-bootstrap/agents-md-template.md` is what a *client* repo gets; this file is what
> the framework itself runs on. Where they differ, the difference is deliberate: there is no app
> to boot here, no database, no UI.

## The spine
**SPEC → HUMAN → VERIFIED → GATED** — the four hard rules, in the words every other instrument uses.
- **SPEC** — no feature code before an approved spec exists on disk. A one-line fix is exempt; a feature is not.
- **HUMAN** — the human owns every key decision. Recommend with trade-offs, then let them choose.
- **VERIFIED** — done means verified, not asserted. Drive the real flow; a passing typecheck is not evidence.
- **GATED** — phases are gated. Do not cross a gate because the next phase looks obvious.

<!-- Repeated verbatim by hooks/workflow-router.js and by agents-md-template.md. Change all three
     or none — reworded copies compete for the same slot instead of reinforcing each other. -->

## `main` is production — read this before you push
The live plugin does **not** run from this working directory. It runs from a clone at
`~/.claude/plugins/marketplaces/sailes` that tracks **`main`** with `autoUpdate: true`.

- Local edits reach no session. Edit freely.
- **A push to `main` deploys** — automatically, to this machine and every other that ran
  `enable-plugin.sh`. There is no install step and no confirmation.
- Branches reach nobody. They are the isolation, and they are where experiments live until
  their eval returns a verdict. `main` is not a staging area.

## Before writing code
1. Check `.ai/specs/` (root = live; `implemented/` and `archived/` are done).
2. A change to a skill, hook, or agent definition changes behavior in **every repo on the
   machine**. That blast radius is the reason the spec gate applies here at least as hard as
   it does in a client repo.
3. Non-trivial work gets a spec with an Open Questions gate — skeleton first, then STOP until
   the human answers (`skills/sailes-bootstrap/spec-writing-template.md`).

## Verification
- `npm test` — hook tests (`hooks/*.test.js`) + the Codex TOML validator. No framework, no deps.
- Deterministic behavior (a hook reads disk and prints text) gets a **real test**. Model behavior
  (does the agent *honor* the mandate?) gets an **eval** in `evals/` — they are not interchangeable,
  and a green test says nothing about whether the instruction lands.
- Drive the hook the way Claude Code does: JSON on stdin, JSON or nothing on stdout. Beware
  MSYS-style paths (`/c/Users/…`) in fixtures — Node on Windows does not resolve them, and the
  hook will "pass" by staying silent for the wrong reason.

## Release
`VERSION` + `package.json` + `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` all
carry the same number — the fourth has drifted twice. Every standard change needs a `CHANGELOG.md`
entry, because `adopt-existing-repo.md` Upgrade mode computes what an older-stamped repo is missing
by reading that file: a change with no entry is a change no repo will ever be told about.
After merging: `./install.sh --force`.

## Delegation
Delegation is the lead's default (`agents/team-lead.md`). Two rules earn their place from failures:
- **An empty return is a failure, not a completion.** It is indistinguishable from "looked and
  found nothing", so accepting it records a false negative as a result. Chase once, then escalate.
  "The agent found no issues" may be said only if an agent actually said so.
- **Every brief carries the report clause** — including for built-in agent types, whose definitions
  cannot be edited and which are where this has actually gone wrong.

## Hard safety rules
- Never push to `main` without tests green and a CHANGELOG entry — it is a live deploy.
- Never use `git checkout <branch> -- <path>` to move an uncommitted edit; it destroys the working
  copy silently. Never mask a recovery command with `|| true`.
- Never let a scripted edit report success without verifying it landed — `String.replace()` on a
  pattern that is absent is a silent no-op, and it has already produced a green commit with no change.
- `.ai/` is memory, not scratch: STATE.md, lessons.md and backlog.md are read by the next session.

## Task router
| Situation | Go to |
|---|---|
| Something is broken in a running system | `sailes-diagnose` — read-only, ends at a proven mechanism |
| New scope, not covered by a live spec | `sailes-discovery` |
| A live spec covers it | continue its phase — `sailes-pre-implement`, then `sailes-implement` |
| Changing a skill / hook / agent definition | spec first; the blast radius is every repo on the machine |
