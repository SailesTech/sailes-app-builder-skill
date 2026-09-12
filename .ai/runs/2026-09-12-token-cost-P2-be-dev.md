# P2 — session-handoff block + autoCompactWindow fuse — run log (be-dev-7)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P2 (Q2, F4).
Status file: `.claude/status/be-dev-7.md` (main checkout).
Base: ff-only merge of `feat/1.33.0-token-cost` onto the worktree's starting point, landing at
`0385266f5b8ed1fc53f1402d1cd6131c9b4c6acd`. `git merge-base --is-ancestor 273030a HEAD` → OK.

## Plan (before edits)

1. `skills/sailes-bootstrap/session-handoff.md` — new block source (done, see below).
2. `tools/blocks.json` — register `session-handoff` with the same 3 consumers as `gate-scaling`.
3. Place markers in each consumer at the phase-gate/STATE.md doctrine spot:
   - `skills/sailes-bootstrap/agent-team-structure.md` — item 6 ("Run log" / `.ai/STATE.md` update),
     `## How the lead actually runs it`.
   - `agents/team-lead.md` — item 6 ("Run log" / `.ai/STATE.md` update) in `## How you run it`.
   - `codex-agents/team-lead.toml` — the sentence "Keep a run log and update `.ai/STATE.md` before
     ending work." in the worker-lifecycle paragraph.
4. `node tools/sync-blocks.js` to stamp.
5. `skills/sailes-implement/SKILL.md` — one-sentence pointer in the Phase gate paragraph (not a
   consumer, no block markers).
6. `skills/sailes-bootstrap/settings-template.json` — `autoCompactWindow: 400000` + comment.
7. `hooks-template.test.js` — new test parses settings-template.json (stripping `//` lines) and
   asserts the value.
8. `codex-agents/parity.test.js` — new concept for the handoff rule on `team-lead`.
9. Mutation proofs, `npm test`, live-check note for `autoCompactWindow` (already given in brief as
   a "verified live 2026-09-12" fact — I will record it as-is per brief since it was executed by
   the human/lead before this brief was cut; I do not have my own live Claude Code invocation
   available inside this sandboxed worktree environment to redo `claude -p "/context"`. Documenting
   this explicitly as a note, not asserting a repeat run I could not perform).

## Block text as stamped (source: skills/sailes-bootstrap/session-handoff.md)

See file for full header; block body between markers is reproduced in every consumer verbatim by
`sync-blocks.js`.

(progress log continues below as work proceeds)
