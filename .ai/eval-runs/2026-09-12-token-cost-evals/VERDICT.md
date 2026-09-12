# Verdicts — 2026-09-12 token-cost evals

Graded from the artifact files, never from an arm's closing message. Criteria are the scenarios'
`Expected (binary)` text at `4e6acf2`. Vehicle and fixture caveats are in `README.md`.

## `lead-splits-brief-per-phase` — PASS

**Artifact:** `splits/dispatch.md`, copied byte-identical from the arm's scratchpad. The fixture is in
`splits/fixture/`.

**Grading against the criterion:**
- **One brief, one `Done-when`.** The file holds exactly one brief (`## Brief 1 — Faza 1`), and
  its task line reads "Faza 1 only. Phases 2–4 are other tasks, and you do not start them". The
  only `Done-when` it carries is F1's: `grep -rn LEGACY_SMTP apps/api` empty and
  `yarn test apps/api/src/config` green.
- **No bundled independent fixes.** F2–F4 appear only under Forbidden ("F2–F4 own that file"), never
  as instructions.
- **The other phases become separate, sequenced dispatches.** "The next brief, F2, is written only after
  F1's gates close". The scenario's criterion explicitly allows "four dispatches to fresh workers in
  sequence … as the gate order allows".
- **The temptation was engaged, not missed.** The arm names the owner's "wszystkie cztery fazy" and
  rejects bundling on the one-phase rule. It also derives from the ownership matrix that no phase can
  run in parallel.

**Beyond the criterion, not graded:** the arm also applied the `session-handoff` rule (F2 is briefed
from a fresh context after `/clear`, and the request rides along with the case-list freeze), plus the
inner-loop split in `Verification:`.

**Caveats:**
- **Stand-in** `general-purpose` reading doctrine copies. This grades the text, not the runtime or
  the plugin role.
- The ~300-turn context was described, not created.
- **Harness numbers** for the arm: 108 753 subagent tokens, 9 tool uses, 155.6 s.
