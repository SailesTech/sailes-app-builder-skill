# 2026-09-12 — session-handoff either/or wording (be-dev-8)

Task: make the `session-handoff.md` first bullet's "naming the next phase and its brief" wording
explicit that either the brief itself, or a precise pointer to where it lives on disk, satisfies it —
and name a vague pointer as not enough. Follow-up to P2, per the eval-run finding in
`.ai/eval-runs/2026-09-12-token-cost-evals/VERDICT.md` (`lead-hands-off-after-phase`, fixture A,
condition (i) FAIL).

## Base

Merged `feat/1.33.0-token-cost` (fast-forward, `03ad03b`). Confirmed
`git merge-base --is-ancestor bcdf994 HEAD` → ancestor OK.

## Bullet: before → after

Before:
```
- The instant a phase's `Done-when` gate closes, the lead writes `.ai/STATE.md` — verified facts,
  open failures, and **Last session** naming the next phase and its brief — before anything else.
```

After:
```
- The instant a phase's `Done-when` gate closes, the lead writes `.ai/STATE.md` — verified facts,
  open failures, and **Last session** naming the next phase and its brief — before anything else.
  Either the brief itself (goal, files, `Done-when`) or a precise pointer to where it is written on
  disk (file plus section) satisfies this; a vague "continue with phase N" does not.
```

Two lines added, matching the block's existing wrap width and voice. No other bullet touched.

## sync-blocks

Ran `node tools/sync-blocks.js` to stamp the three consumers
(`skills/sailes-bootstrap/agent-team-structure.md`, `agents/team-lead.md`,
`codex-agents/team-lead.toml`). None hand-edited.

## Verification (outputs below)

- `node tools/sync-blocks.js --check`
- `node codex-agents/parity.test.js`
- `node codex-agents/validate-toml.test.js`
- `grep -n "precise pointer" ...` across the three consumers

### `node tools/sync-blocks.js --check`
```
sync-blocks: all blocks in sync
```
Exit 0.

### `node codex-agents/parity.test.js`
All 74 lines `ok`, closing `codex parity: all tests passed (10 roles, both sides)`. Exit 0.

### `node codex-agents/validate-toml.test.js`
All 18 lines `ok`, closing `all passing`. Exit 0.

### `grep -n "precise pointer\|pointer" skills/sailes-bootstrap/agent-team-structure.md agents/team-lead.md codex-agents/team-lead.toml`
```
codex-agents/team-lead.toml:38:  Either the brief itself (goal, files, `Done-when`) or a precise pointer to where it is written on
agents/team-lead.md:106:  Either the brief itself (goal, files, `Done-when`) or a precise pointer to where it is written on
skills/sailes-bootstrap/agent-team-structure.md:182:6. **Run log.** ... Last session pointer.
skills/sailes-bootstrap/agent-team-structure.md:189:  Either the brief itself (goal, files, `Done-when`) or a precise pointer to where it is written on
```
The line-182 hit is a pre-existing unrelated occurrence of "pointer" (`Last session pointer`); the
new sentence is line 189 there, line 106 in `team-lead.md`, line 38 in `team-lead.toml` — present in
all three consumers.

## Commits

- `ec72fc8` WIP: session-handoff either/or pointer wording, pre sync-blocks
- `ec591ed` docs(session-handoff): make either/or for 'next phase and its brief' explicit — the
  declaration commit.

## Scope check

Only the one bullet in `skills/sailes-bootstrap/session-handoff.md` was hand-edited; the three
consumers were touched exclusively via `tools/sync-blocks.js`. No file outside the brief's allowed
list was written, other than this run log and the status file. `evals/` untouched.

