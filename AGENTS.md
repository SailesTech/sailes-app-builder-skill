# Agents Guidelines — sailes-app-builder framework repo

> Single source of truth for how agents work in **this** repo. CLAUDE.md imports this via @AGENTS.md.
> Framework-Version: 1.22.1
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
- `npm test` — hook tests (`hooks/*.test.js`), the Codex TOML validator, the Claude role-frontmatter
  validator, the eval provenance reporter's tests, and release hygiene (five stamps + CHANGELOG
  heading). No framework, no deps, and **nothing external**: every step is deterministic.
- `npm run test:browser` — the design probe's fixtures, kept out of the default gate on purpose.
  It self-SKIPs when no browser is present, but it fails under browser *contention* ("the browser
  never exposed a CDP target"), which is a failure with nothing to do with the code. Measured twice
  on 2026-07-26 during heavy concurrent agent activity, and clean across six consecutive runs
  otherwise. A gate that fails for an unrelated reason gets argued with once and ignored after that,
  so it runs on demand and in `npm run test:all`.
- Deterministic behavior (a hook reads disk and prints text) gets a **real test**. Model behavior
  (does the agent *honor* the mandate?) gets an **eval** in `evals/` — they are not interchangeable,
  and a green test says nothing about whether the instruction lands.
- Drive the hook the way Claude Code does: JSON on stdin, JSON or nothing on stdout. Beware
  MSYS-style paths (`/c/Users/…`) in fixtures — Node on Windows does not resolve them, and the
  hook will "pass" by staying silent for the wrong reason.

## Release
`VERSION` + `package.json` + `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` +
**this file's own `Framework-Version:` stamp** all carry the same number — five files, not four.
The marketplace one has drifted twice and the stamp twice (1.13.0, 1.14.0); a stale stamp makes
`hooks/framework-version-check.js` tell every session that the framework repo is behind the
framework. Every standard change needs a `CHANGELOG.md`
entry, because `adopt-existing-repo.md` Upgrade mode computes what an older-stamped repo is missing
by reading that file: a change with no entry is a change no repo will ever be told about.

**Self-docs regenerate at every release** (spec 2026-07-28-archify-gated-docs, D4): before the
stamps, `docs-author` refreshes any of the five `docs/architecture/` diagrams the release
changed, and the delta receipt lands in `.ai/docs-deltas/`. `release-hygiene.test.js` checks
presence; freshness is this procedure's job — the framework eats the same rule it ships.

**There is no post-merge step.** Distribution is the marketplace: a push to `main` is the deploy,
and every machine that ran `enable-plugin.sh` once picks up `skills/`, `agents/` and `hooks/` from
the plugin with `autoUpdate: true`. This corrects a line that stood here until 2026-07-26 telling
you to run `./install.sh --force` after merging — eight lines below the paragraph stating there is
no install step, in the same file.

`install.sh` is the **pre-plugin path** and it is not a sync: it copies `skills/` only — a third of
what the plugin ships — into `~/.claude/skills/`, where it stays frozen at whatever version you last
ran it. Running both leaves two copies of the same skill names on one machine, one of them auto-
updating from `main` and the other silently ageing, with nothing comparing them. Use it only on a
machine that deliberately wants skills **without** the plugin, and know that it shadows rather than
supplements.

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
  Make the script `throw` when the pattern is missing, and re-read the file afterwards to confirm.
- **Prose goes through the file-writing tools, never through a shell argument.** Write/Edit for
  anything with sentences in it — CHANGELOG entries, docs, eval records. The mechanism, because a
  rule you cannot feel is one you break when tired: **an apostrophe closes a single-quoted shell
  string.** Prose is full of them (`scenario's`, `don't`, `nie mam`), so the quote ends mid-sentence,
  the rest of your text becomes shell syntax, and any backtick in it turns into command substitution
  — `bash: line 15: \`Last: command not found`. It fails loudly, but only after mangling the command.
  If prose genuinely must pass through Bash, the **only** safe form is a heredoc with a quoted
  delimiter (`<<'EOF'`), which suspends all expansion; a single-quoted `-c` / `-e` argument is not a
  safe form and never becomes one. Recorded 2026-07-20 as a mitigation and left in a STATE.md
  narrative instead of here — where its two sibling mitigations went — and then broken three times in
  one session on 2026-07-26. **The promotion is the fix; the prose was not.**
- **Line endings: match the file, don't assume the repo.** A regex ending in `\n` will not match
  `\r\n`, and the failure mode is a no-op that looks like success — it has cost two edits already.
  Use `\r?\n` for *reading*, always. For *writing*, read the file's existing endings first: this repo
  is mostly CRLF in the working tree but **not uniformly** — measured 2026-07-26, at least
  `evals/diagnose-runs-live-case-before-audit.md` and `evals/session-start-routes-from-repo-state.md`
  are LF on disk, and inserting a `\r\n` line into them produces a single mixed line that git then
  normalizes away, so the diff looks clean and the file is wrong. Two independent sub-teams caught
  this by disbelieving a brief that asserted CRLF; the brief was mine and it was wrong.
  Note also that `.gitattributes` sets `* text=auto`, so **git stores LF** and checks out CRLF here:
  `git show HEAD:<file>` returns the normalized LF blob. Comparing that against the working tree to
  "detect" an ending change reports every file as changed — a false alarm that also cost time on
  2026-07-26. Compare disk against disk, or check a file for internal consistency.
- `.ai/` is memory, not scratch: STATE.md, lessons.md and backlog.md are read by the next session.

## Task router
| Situation | Go to |
|---|---|
| Something is broken in a running system | `sailes-diagnose` — read-only, ends at a proven mechanism |
| Porting an existing codebase to another language/stack at scale | `sailes-migrate` — domain sibling, judge-before-translation, behavior-parity gate |
| New scope, not covered by a live spec | `sailes-discovery` |
| A live spec covers it | continue its phase — `sailes-pre-implement`, then `sailes-implement` |
| Changing a skill / hook / agent definition | spec first; the blast radius is every repo on the machine |
