# Test plan — 2026-09-16-workflow-first-orchestration, Phase P1

Status: DERIVED
Lane: middle (tier C) — no human freeze STOP per phase `Lane:` line; moved DRAFT → DERIVED by `tester`.
Scope: `tools/token-report.js` — `discoverTranscripts()` workflow-layout recognition (P1.1) and
`--cost` USD computation (P1.2), as specified in spec section "### P1 — `token-report.js` rozumie
workflow" and "### Narzędzia".

Derived with the implementation of `tools/token-report.js` **UNREAD**. Only
`tools/fixtures/token-report-workflow/**` (test data, already `Owns`-enforced by P1.1, committed at
the reset SHA) was inspected to ground fixture-based test cases in concrete, already-existing input
shapes — no source code was opened.

## Open questions (could not derive from the read spec sections alone)

These do not block writing (middle lane, no STOP) — each is resolved below by testing a
spec-stated **relationship** instead of an absolute value I have no source for, or is carried
forward as an explicit UNVERIFIED item.

1. **Absolute USD price table values** are not in the two read spec sections, and `research/costs.md`
   (cited in Done-when) does not exist in this repo. I cannot derive real per-model USD/token rates
   from spec + vendor docs alone (the model names — `claude-haiku-4-5-20251001` etc. — are
   repo-fictional/future and not in any public pricing table I can cite). Resolution: P1-B7/P1-B8
   test the spec-stated **ratio** (cache-read = 0.1× input rate, cache-write = 1.25× input rate)
   using same-model, same-token-count fixtures, which is provable without knowing the absolute rate.
2. **Exact taxonomy of "rola" and "tier"** (what values these fields take) is not defined in the read
   sections. Resolution: P1-B9 tests that aggregation buckets by whatever `agentType`/label values
   the fixtures carry sum consistently (structural correctness), not against a fixed enum.
3. **The Done-when acceptance check** (`node tools/token-report.js
   ~/.claude/projects/.../wf_4eb1edf7-db8 --json --cost` → `transcriptCount` = 12, USD within 1% of
   $18.33) reads a real, machine-local transcript directory outside the repo — not a committed
   fixture, not portable to another machine or CI. This is **not** added to the committed automated
   suite. Listed as **UNVERIFIED (manual, machine-local)** below; I confirmed the directory exists
   on this machine (`ls` returned `wf_4eb1edf7-db8` among sibling `wf_*` dirs) but running the exact
   command and checking its output is `be-dev`'s Done-when, not a graded test-suite assertion.

## Equivalence partitions and behavior IDs

### P1.1 — `discoverTranscripts()` workflow layout

| ID | Partition | Behavior |
|---|---|---|
| P1-B1 | valid — nested workflow layout | Session dir with `subagents/workflows/wf_*/agent-*.jsonl` → each such file classified as a **subagent** (not leader), associated with its `wf_*` id; the session's own leader transcript and any pre-existing flat `subagents/agent-*.jsonl` are still classified correctly (regression alongside the new recognition). |
| P1-B2 | valid — direct `wf_*` dir | Passing a `wf_*` directory itself (containing only `agent-*.jsonl` files, no leader file) → **all** files inside classified as subagents; none treated as a leader transcript. |
| P1-B3 | valid — metadata present | For a workflow subagent with a sibling `.meta.json`, `description` → label, `agentType`, and `workflowPhase` are all read and exposed on the discovered entry. |
| P1-B4 | invalid — metadata absent | A workflow subagent transcript with **no** `.meta.json` at all does not crash discovery; the entry is still discovered as a subagent (graceful absence of label/agentType/workflowPhase, not an error). |
| P1-B5 | valid — model precedence, alias present but different | The subagent's resolved model comes from the transcript's own `message.model` (e.g. `claude-haiku-4-5-20251001`), not from `.meta.json`'s alias field (e.g. `"model":"haiku"`) — spec: "model rzeczywisty z `message.model`... `meta.model` to tylko alias". |
| P1-B6 | invalid — alias absent entirely | When there is no `model`/meta alias field at all (or no `.meta.json` at all), the resolved model is still correctly read from `message.model` — not left blank/undefined. |

### P1.2 — `--cost`

| ID | Partition | Behavior |
|---|---|---|
| P1-B7 | valid — cache-read multiplier | Cache-read tokens are priced at **0.1×** the same model's input-token rate (spec: "cache read 0,1×... wejścia"), verified as a ratio between two same-model, same-token-count usages (one all-input, one all-cache-read). |
| P1-B8 | valid — cache-write multiplier | Cache-write (`cache_creation_input_tokens`) tokens are priced at **1.25×** the same model's input-token rate, verified the same way. |
| P1-B9 | valid — aggregation | `--cost` aggregates per-transcript USD into per-label / per-role / per-tier buckets whose sums equal the sum of the individual transcript costs that belong to them (no double counting, no dropped transcript), using the two-subagent `wf_test1` fixture (distinct labels F1/F2, distinct `agentType`). |

## Detection proof (tier C: one case per partition)

For each ID: temporarily break exactly that behavior in `tools/token-report.js`, run
`node tools/token-report.test.js`, paste the red output, `git checkout -- tools/token-report.js`,
confirm green again. Done in Step 4/5 of the authoring pass, after tests are written from this
frozen list.

## UNVERIFIED / manual

- Done-when real-transcript acceptance check (`wf_4eb1edf7-db8`, transcriptCount=12, $18.33±1%) —
  machine-local, not in the committed automated suite. `be-dev`'s Done-when, not this suite's gate.
