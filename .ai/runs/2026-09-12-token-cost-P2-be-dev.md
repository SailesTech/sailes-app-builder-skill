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

Verbatim, between `<!-- BEGIN session-handoff -->` / `<!-- END session-handoff -->`, identical in
`agent-team-structure.md`, `agents/team-lead.md`, `codex-agents/team-lead.toml`:

```
**A closed phase ends the lead's turn — the next phase does not continue on the same context.**

- The instant a phase's `Done-when` gate closes, the lead writes `.ai/STATE.md` — verified facts,
  open failures, and **Last session** naming the next phase and its brief — before anything else.
- The lead then **ends its turn with one line for the human**: the phase is closed, run `/clear`,
  then "kontynuuj". The model does not run `/clear` itself — built-in commands are the human's to
  invoke, never the model's.
- The next phase starts from the `SessionStart` hook's summary, which fires on `clear` — not from
  whatever the lead still remembers, so the resume path is never "trust the model's own recall" of a
  plan that is also, separately, written to disk.
- **Named exception:** when the phase gate is already waiting on the human for something else — a
  key decision, an open question — the `/clear` request rides along with that same question instead
  of adding a second stop. One thing for the human to answer, not two.

Why this is mandatory rather than a suggestion, in one number: lead context measured 11–12.09 grew to
**627–933 k per session and never reset on its own** — one session alone cost **305 M tokens**.
Handing off after every closed phase is the cheapest point in the whole loop to reset, because the
phase's state is already on disk in `STATE.md` before the turn ends, so nothing is lost by clearing.
```

## Where each consumer's markers were placed

- `skills/sailes-bootstrap/agent-team-structure.md` — end of item 6 ("Run log") in
  `## How the lead actually runs it`, immediately after the existing sentence about writing
  `.ai/STATE.md` at session end. This is the file's existing phase-gate/STATE.md doctrine spot;
  the block sits right after it, not folded into the numbered item's own text.
- `agents/team-lead.md` — same spot, end of item 6 ("Run log") in `## How you run it`, before
  item 7 ("Harvest what the workers hit").
- `codex-agents/team-lead.toml` — right after the sentence "Keep a run log and update
  `.ai/STATE.md` before ending work." in the worker-lifecycle paragraph, before the `qa` exclusive-
  hold paragraph.

`skills/sailes-implement/SKILL.md` (not a consumer, no markers) — one sentence appended to the end
of the **Phase gate (binary stop condition)** paragraph: "Once the gate closes, the lead does not
carry straight on into the next phase on the same context — see the `session-handoff` rule in
`agent-team-structure.md` for what closes the turn."

## settings-template.json fuse

Added `"autoCompactWindow": 400000` as a top-level key (sibling of `"permissions"`/`"hooks"`), plus
a `//` comment paragraph in the header block:

```
// "autoCompactWindow"  — the lead-context safety fuse (Q2/F4, spec 2026-09-12-token-cost-of-running).
//                        Average lead call context measured ≈ 420 k on 11–12.09, with peaks of
//                        627–933 k; 400 k cuts every measured lead session and still leaves room
//                        above the worker p90 peak (262 k). Accepted cost: this key is "Scope: Any
//                        file", so it also compacts the owner's own interactive work in the client
//                        repo, not just the lead's coordination sessions.
```

**Live-check note (deviation from the brief, flagged explicitly):** the brief states as an
already-established fact that `claude -p "/context"` was verified live 2026-09-12 to show
`13.1k / 1m` without the key and `13.1k / 150k` with `autoCompactWindow: 150000`. I attempted to
reproduce this independently from inside my worktree (a scratch dir with its own
`.claude/settings.json` and a nested `claude -p "/context"` call), and the harness's own auto-mode
classifier blocked the nested invocation ("Permission for this action was denied by the Claude Code
auto mode classifier"). This is a reasonable sandbox restriction on spawning a nested agent session,
not something to work around, so I did not attempt a bypass. The comment text above states the fact
as given in the brief (it is consistent with the audit's citation of `settings-reference.md`,
"Scope: Any file", in `.ai/audits/2026-09-12-pre-implement-token-cost.md:107`) — I have not
personally re-run the `claude -p "/context"` comparison in this session. Flagging this so the lead
can decide whether an independent re-verification is still wanted before the gate closes.

## Mutation proof (1) — remove the handoff rule from `codex-agents/team-lead.toml`

Removed the `<!-- BEGIN session-handoff -->…<!-- END session-handoff -->` block from
`codex-agents/team-lead.toml` only (left `agents/team-lead.md` and `agent-team-structure.md`
untouched), then:

```
$ node codex-agents/parity.test.js
  ...
  FAIL team-lead: "a closed phase ends the lead session; the human runs /clear before the next phase starts" survives in BOTH twins
       missing from codex-agents/team-lead.toml — the twin is behind
  ...
codex parity: 1 failing          # exit 1

$ node tools/sync-blocks.js --check
sync-blocks: OUT OF SYNC
  ../codex-agents/team-lead.toml: no markers for "session-handoff" — the block is not enforced in this file

  Fix with: node tools/sync-blocks.js       # exit 1 — expected and noted per brief
```

Restored `codex-agents/team-lead.toml` from the pre-mutation copy, then:

```
$ node codex-agents/parity.test.js
  ... codex parity: all tests passed (10 roles, both sides)   # exit 0

$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync   # exit 0
```

## Mutation proof (2) — change `400000` to `300000` in `settings-template.json`

```
$ sed -i 's/"autoCompactWindow": 400000,/"autoCompactWindow": 300000,/' skills/sailes-bootstrap/settings-template.json
$ node skills/sailes-bootstrap/hooks-template/hooks-template.test.js
  ...
  FAIL settings-template.json sets autoCompactWindow to the lead-context safety fuse (Q2/F4)
       settings-template.json autoCompactWindow must be 400000 — the lead-context safety fuse from Q2/F4 (spec 2026-09-12-token-cost-of-running); a different value, or none, has no grounding in the 11-12.09 measurement it is supposed to cut
       300000 !== 400000
  ...
hooks-template: 1 failing          # exit 1
```

Restored `settings-template.json` from the pre-mutation copy, then:

```
$ node skills/sailes-bootstrap/hooks-template/hooks-template.test.js
  ...
  ok   settings-template.json sets autoCompactWindow to the lead-context safety fuse (Q2/F4)
hooks-template: all tests passed   # exit 0
```

`git status --porcelain` / `git diff --stat` after both restores showed exactly the intended 8
modified + 2 new files — no residue from either mutation.

## Inner-loop checks

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync

$ node codex-agents/parity.test.js
... codex parity: all tests passed (10 roles, both sides)

$ node skills/sailes-bootstrap/hooks-template/hooks-template.test.js
... hooks-template: all tests passed
```

All three exit 0.

## `npm test`

First and second attempts (`try 1`, plus two standalone reruns of `tools/mcp-toolnames-check.test.js`)
hit the documented flake in `AGENTS.md`/the brief: `mcp-toolnames-check`'s "server absent" case
crashed the process with `Error: write EPIPE` on an MCP child-process pipe, unrelated to this
diff — `tools/mcp-toolnames-check.js`/`.test.js` are untouched by this task. Reran the standalone
file 5 times back to back: exit 1, 1, 0, 0, 1 — nondeterministic, confirming it is the known flake
and not a regression from this change.

A subsequent full `npm test` (try 2) completed clean:

```
$ npm test
... (511 "ok" lines across all 19 chained suites, including sync-blocks, ownership-check,
     worker-status, mcp-toolnames-check, business-logic-check, deployed-surface-check,
     brief-closure, workflow-router, framework-version-check, validate-toml, parity, eval-status,
     validate-frontmatter, release-hygiene, spec-status-evidence, repo-done-checklist,
     hooks-template, session-start-memory, token-report)
exit 0
```

`grep -in "FAIL"` on that log's output matched only test-case *names* that describe a failure
scenario under test (e.g. "parseOutcome is not fooled by 'FAIL' describing what the agent did"),
never an actual `FAIL` result line.

## Contract shape honored

No typed contract in this phase — the "contract" here is the generated-block mechanism itself
(`tools/blocks.json` + `tools/sync-blocks.js`), imitated exactly from `gate-scaling`/
`delegation-threshold`: same 3 consumers, same marker format (HTML comments, including inside the
TOML triple-quoted string), same "edit the source, not the copy" trailer comment in the two
markdown consumers. `codex-agents/team-lead.toml` did not carry a source-provenance trailer comment
for `gate-scaling` either (only `agent-team-structure.md`/`team-lead.md` do), so `session-handoff`
follows that same asymmetry rather than introducing a new convention.

## Per-file diff summary

- `skills/sailes-bootstrap/session-handoff.md` (new) — block source, header + `<!-- BEGIN/END
  session-handoff -->`.
- `tools/blocks.json` — new `session-handoff` entry, same 3 consumers as `gate-scaling`.
- `skills/sailes-bootstrap/agent-team-structure.md` — block + trailer comment inserted after item 6
  ("Run log") in `## How the lead actually runs it`.
- `agents/team-lead.md` — block + trailer comment inserted after item 6 ("Run log") in
  `## How you run it`.
- `codex-agents/team-lead.toml` — block inserted after the "Keep a run log…" sentence.
- `skills/sailes-implement/SKILL.md` — one sentence appended to the Phase gate paragraph.
- `skills/sailes-bootstrap/settings-template.json` — `autoCompactWindow: 400000` + header comment.
- `skills/sailes-bootstrap/hooks-template/hooks-template.test.js` — new test asserting
  `autoCompactWindow === 400000` after stripping `//` lines and parsing the template as JSON
  (reused the file's existing `readTemplateJson`/`SETTINGS_TEMPLATE` helpers, added nothing new
  there).
- `codex-agents/parity.test.js` — new `team-lead` invariant: `/\/clear/` must appear in both
  `agents/team-lead.md` and `codex-agents/team-lead.toml`.

## Deviations / things worth the lead's attention

1. **Live `/context` re-verification not independently reproduced** (see note above) — sandbox
   blocked a nested `claude -p` call. Not a substitute decision on scope/contract, just an
   unperformed verification step; flagging rather than asserting I redid it.
2. Everything else in the brief was implemented as specified; no other deviations, no substitute
   decisions, no scope questions.

## Final verification (re-run once more before the declaration commit)

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync

$ node codex-agents/parity.test.js
... codex parity: all tests passed (10 roles, both sides)

$ node skills/sailes-bootstrap/hooks-template/hooks-template.test.js
... hooks-template: all tests passed

$ npm test
exit 1   # hit the mcp-toolnames-check "server absent" flake again (EPIPE crash), same as before
$ node tools/mcp-toolnames-check.test.js
... mcp-toolnames-check: all tests passed   # exit 0, standalone rerun confirms it's the flake

$ npm test          # retry
... 511 "ok" lines, zero FAIL lines
exit 0
```

`npm test` was flaky exactly the way `AGENTS.md`/the brief describe (`mcp-toolnames-check`'s
"server absent" case, unrelated to any file this task touched) across this session: standalone
reruns of that one file returned exit 1, 1, 0, 0, 1, 0 across six attempts, and two of the four full
`npm test` runs failed on it while the other two passed clean. Every failure traced to that single
file/test; nothing else in the suite ever failed.

## Status

Declared done. Status file `.claude/status/be-dev-7.md` closed with `outcome: done`.

