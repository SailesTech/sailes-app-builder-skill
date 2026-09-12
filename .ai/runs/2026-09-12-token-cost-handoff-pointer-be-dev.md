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

See final report message for pasted command output.
