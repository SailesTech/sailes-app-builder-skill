# Measured cost of past multi-agent runs

Sources actually read: workflow definitions `~/.claude/projects/-home-charlie/646d3e6d-dc3d-40c8-a58a-be9228a5fafd/workflows/wf_{d7e47752-0f8,2fb79243-84e,3227fe3d-ad3,4eb1edf7-db8}.json`;
subagent transcripts+meta under `.../subagents/workflows/wf_*/agent-*.jsonl` (+`.meta.json`) and `journal.jsonl` for the same four runs;
lead-session transcripts `~/.claude/projects/-home-charlie/afbf8f27-bc47-4e25-8596-9601a9b2f847.jsonl` and `.../d83d7fb8-ea6b-450e-aad2-a5cebcc6e927.jsonl`.
`tools/token-report.js` was read (not usable as-is here — see "Instrument note" below); all numbers below come from a custom parser applying the **same accounting rules** the instrument documents (turns = distinct `message.id`; context tokens = `input+cache_creation+cache_read`, deduped by id; `tool_use` blocks counted unconditionally).

**Instrument note:** `token-report.js discoverTranscripts()` only recognizes `<dir>/<session>.jsonl` (lead) and `<dir>/<session>/subagents/agent-*.jsonl` (subagent) — confirmed by reading `tools/token-report.js:156-200`. The four target runs live at `.../subagents/workflows/wf_X/agent-*.jsonl`, one directory level deeper (`subagents/workflows/wf_X/` not `<session>/subagents/`). Run directly: `node tools/token-report.js .../subagents/workflows/wf_d7e47752-0f8 --json` → miscounts every `agent-*.jsonl` as a **lead** transcript (`"lead":{"transcriptCount":5,...}`, `"subagents":{"transcriptCount":0}` — verified, command output above). The instrument was not usable unmodified on this layout; I wrote `/tmp/.../scratchpad/agg.py`, a ~90-line parser applying the identical dedup/turn-counting rules token-report.js documents, and ran it directly against each `agent-*.jsonl` and `journal.jsonl`.

Pricing used (input/output per 1M, USD): opus 5/25, sonnet 2/10, haiku 1/5, fable 10/50. Cache read = 0.1× input rate; cache write = 1.25× input rate (as instructed).

## Exact commands run
```
node ~/Work/Internal/sailes-app-builder-skill/tools/token-report.js <dir> --json   # layout mismatch, see above
python3 agg.py <workflow-dir> > research/<wf>.json      # per-agent parse, all 4 target workflows
python3 -c "from agg import cost; ..."                  # cost calc, cache-share calc, hypothetical scenarios
python3 -c "... per_turn(path) ..."                      # per-turn context/cost growth, lead + F2 subagent
```
`workflows/wf_X.json` also carries the harness's own precomputed `totalTokens`/`totalToolCalls`/`durationMs`/`agentCount`/`status` — read directly (`python3 -c "json.load(...)"`), used below to cross-check and to find the killed/failed runs.

## Per-agent table

### wf_d7e47752-0f8 — diagnosis fan-out, retry (5 collectors, sonnet), status=completed, durationMs=830114
| label | model | turns | tools | input | cache_read | cache_write | output | dur(s) | USD |
|---|---|---|---|---|---|---|---|---|---|
| kolektor:historia | sonnet | 45 | 44 | 90 | 4,271,637 | 123,336 | 629 | 465 | 1.1691 |
| kolektor:logi | sonnet | 53 | 52 | 106 | 5,222,542 | 136,284 | 163 | 824 | 1.3871 |
| kolektor:kod | sonnet | 29 | 33 | 58 | 2,508,036 | 126,347 | 8,798 | 414 | 0.9056 |
| kolektor:tozsamosc | sonnet | 21 | 36 | 42 | 1,897,833 | 104,462 | 90 | 320 | 0.6417 |
| kolektor:sdk | sonnet | 12 | 29 | 24 | 727,403 | 53,593 | 38 | 268 | 0.2799 |
Subtotal: **$4.3834**, task type = recon (4) + log analysis (1).

### wf_3227fe3d-ad3 — diagnosis fan-out, FIRST attempt (5 collectors, opus), status=**killed**, durationMs=106928
| label | model | turns | tools | input | cache_read | cache_write | output | dur(s) | USD |
|---|---|---|---|---|---|---|---|---|---|
| kolektor:kod | opus | 19 | 22 | 38 | 1,383,106 | 91,178 | 986 | 104 | 1.2863 |
| kolektor:historia | opus | 16 | 19 | 32 | 1,113,576 | 82,089 | 1,343 | 104 | 1.1036 |
| kolektor:sdk | opus | 15 | 23 | 30 | 804,510 | 44,110 | 990 | 104 | 0.7028 |
| kolektor:tozsamosc | opus | 18 | 19 | 36 | 1,209,008 | 78,432 | 1,333 | 104 | 1.1282 |
| kolektor:logi | opus | 12 | 11 | 24 | 721,106 | 84,665 | 804 | 105 | 0.9099 |
Subtotal: **$5.1308** — **entirely wasted**: run `status:"killed"` (`workflows/wf_3227fe3d-ad3.json`), re-run minutes later as wf_d7e47752-0f8 on sonnet instead of opus.

### wf_2fb79243-84e — implementation, F1 ONLY, status=completed but agent **failed** (`journal.jsonl`: `{"type":"failed","agentId":"af34ec5960a09cce6"}`)
| label | model | turns | tools | input | cache_read | cache_write | output | dur(s) | USD |
|---|---|---|---|---|---|---|---|---|---|
| F1 | sonnet | 140 | 140 | 280 | 27,485,200 | 326,467 | 16,027 | 1,599 | 6.4740 |
Entirely wasted: a failed F1 attempt burned 140 turns / $6.47 before the real F1 ran (see next table, 28 turns / $0.32).

### wf_4eb1edf7-db8 — implementation F1-F5 + tester + checker×2 + qa, status=completed, durationMs=7,221,207 (~2h), agentCount=12
| label | role | model | turns | tools | input | cache_read | cache_write | output | dur(s) | USD | task type |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | be-dev | sonnet | 28 | 28 | 56 | 932,313 | 45,323 | 2,191 | 203 | 0.3218 | implementation |
| F1-bramka | be-dev | sonnet | 14 | 18 | 28 | 283,551 | 20,967 | 160 | 128 | 0.1108 | implementation |
| F1.5 | be-dev | sonnet | 35 | 37 | 70 | 1,353,151 | 53,453 | 1,615 | 216 | 0.4206 | implementation |
| F2 | fe-dev | sonnet | 157 | 157 | 314 | 19,135,412 | 205,429 | 12,282 | 1,132 | 4.4641 | implementation |
| F3 | be-dev | sonnet | 120 | 120 | 240 | 14,096,609 | 183,999 | 5,628 | 1,012 | 3.3361 | implementation |
| F4 | be-dev | sonnet | 140 | 140 | 280 | 16,059,201 | 214,368 | 9,398 | 1,589 | 3.8423 | implementation |
| F5 | general-purpose | **haiku-4.5** | 34 | 34 | 274 | 1,633,651 | 79,668 | 58 | 149 | 0.2635 | implementation |
| tester | tester | sonnet | 51 | 51 | 102 | 2,688,129 | 74,264 | 898 | 394 | 0.7325 | test authoring |
| checker-r1 | checker | sonnet | 47 | 58 | 94 | 4,887,305 | 176,202 | 566 | 564 | 1.4238 | review |
| fix-r1 | be-dev | sonnet | 26 | 31 | 52 | 788,564 | 45,396 | 2,135 | 263 | 0.2927 | implementation (rework) |
| checker-r2 | checker | sonnet | 68 | 86 | 136 | 7,638,695 | 181,173 | 661 | 866 | 1.9876 | review |
| qa | qa | sonnet | 55 | 60 | 110 | 4,101,482 | 122,379 | 1,076 | 860 | 1.1372 | QA |
Subtotal: **$18.3330**. Note F5 is the only non-sonnet, non-opus subagent measured anywhere in these runs (meta.json declared `"model":"haiku"`, transcript confirms `claude-haiku-4-5-20251001`) — it is also by far the cheapest per-turn implementation agent ($0.0078/turn vs sonnet F1's $0.0115/turn, F2's $0.0284/turn).

### Lead/orchestrator sessions (separate scope note below)
| session | model | turns | tool calls | input | cache_read | cache_write | output | dur(s) | USD |
|---|---|---|---|---|---|---|---|---|---|
| afbf8f27-...-f847 | opus | 179 | 340 | 4,518 | 83,205,807 | 1,572,232 | 489,807 | 26,516 (~7.4h) | **63.6971** |
| d83d7fb8-...-6927 | opus | 139 | 130 | 280 | 24,562,002 | 524,083 | 150,190 | 13,253 (~3.7h) | **19.3127** |
**Scope caveat:** these two lead sessions' own `subagents/workflows/` dirs (`wf_3dbc5b63-ac5`, `wf_5de2ebe4-eca`, `wf_77d7c353-4d5`, `wf_b3ebe4a2-47e` under afbf8f27; `wf_2a2a84d5-da4`, `wf_6545c224-6cd` under d83d7fb8) are **different runIds** from the four named in the brief — the four named workflows live under session `646d3e6d-dc3d-40c8-a58a-be9228a5fafd` (reachable from two project-dir aliases: `-home-charlie` and `-home-charlie-Work-Idealny-wzrok-Custom-Overlay-App`, confirmed via `workflows/wf_d7e47752-0f8.json` field `scriptPath`). I did not expand into afbf8f27/d83d7fb8's own sub-workflows (budget); their numbers above are lead-conversation-only cost, reported as a separate data point, not merged into the four-workflow subtotal below.

## Aggregate — subagents only, the 4 named workflows
- **Total: $34.3211** (rows above, 23 subagent transcripts across 4 workflow runs; `journal.jsonl` files carry zero LLM usage — they are the orchestrator's own event log, not a model transcript).
- Harness's own `totalTokens` field (`workflows/wf_X.json`) for cross-check: d7e47752=650,874; 2fb79243=326,472; 3227fe3d=472,737; 4eb1edf7=1,457,292 (sum 2,907,375) — consistent order of magnitude with my per-agent context-token sums (I did not reconcile the exact token-counting method behind this field; it is not decomposed by input/cache/output so cannot itself be used to compute cost).

### By model tier
| model | n agents | USD | share |
|---|---|---|---|
| sonnet | 17 | 28.9267 | 84.3% |
| opus | 5 | 5.1308 | 15.0% |
| haiku | 1 | 0.2635 | 0.8% |

All opus usage measured in these four workflows is the killed wf_3227fe3d-ad3 collector run — i.e., **100% of subagent-level opus spend here was on a run that was thrown away.**

### By task type
| task type | n | USD |
|---|---|---|
| implementation | 9 | 19.5258 |
| recon | 8 | 7.2172 |
| review | 2 | 3.4114 |
| log analysis | 2 | 2.2970 |
| QA | 1 | 1.1372 |
| test authoring | 1 | 0.7325 |

## Cache read vs fresh input vs output (cost share, subagent totals, 4 workflows)
Token totals: input=2,516 · cache_read=120,942,020 · cache_write=2,653,584 · output=67,869.
Cost decomposition (applying each row's own model rate before summing):
- cache read: **$25.5944 (74.6%)**
- cache write: **$7.9612 (23.2%)**
- output: **$0.7602 (2.2%)**
- fresh input: **$0.0052 (0.0%)**
Fresh input is negligible everywhere measured — Claude Code subagents re-read nearly all context from cache after the first turn; cache *read*, not output tokens, is the dominant cost driver by a wide margin.

## Cost-per-turn growth as context grows
Measured directly (not estimated) on two long transcripts, bucketed by 20-turn windows:

**Lead session afbf8f27 (opus, 179 turns):**
| turns | avg context tokens | avg cost/turn (USD) |
|---|---|---|
| 0-20 | 74,456 | 0.0864 |
| 40-60 | 268,440 | 0.2536 |
| 80-100 | 487,484 | 0.3742 |
| 120-140 | 693,227 | 0.4585 |
| 160-179 | 836,423 | 0.4800 |
→ **5.6×** growth in per-turn cost from the first to the last window.

**Subagent F2 (sonnet, 157 turns, wf_4eb1edf7-db8):**
| turns | avg cost/turn (USD) |
|---|---|
| 0-20 | 0.0157 |
| 60-80 | 0.0232 |
| 100-120 | 0.0355 |
| 140-157 | 0.0431 |
→ **2.7×** growth, same pattern at subagent scale.

**Finding: yes, cost grows superlinearly with turn count.** Per-turn cost tracks accumulated context (each turn re-sends the growing conversation as cache read), and context itself grows roughly linearly with turn index in both transcripts measured. So a 140-turn agent's *total* cost is worse than 140× its first-turn cost — turn 140 alone costs 3-5.6× what turn 1-20 cost on average, not the same. This is directly visible in the per-agent table above too: F1 (28 turns, sonnet) = $0.32 = $0.0115/turn; F2 (157 turns, sonnet) = $4.46 = $0.0284/turn — 2.5× the per-turn rate for a 5.6× longer run.

## Hypothetical: recon on haiku, nothing on opus
Recomputed the 23 subagent rows with: task type `recon`/`log analysis` re-priced at haiku rates; any row actually run on opus re-priced at sonnet rates (all other rows unchanged).
- Actual: **$34.3211**
- Hypothetical: **$28.0247**
- Savings: **$6.2963 (18.3%)**
Most of the saving is the opus→sonnet reprice of the killed wf_3227fe3d-ad3 batch ($5.13→~$2.05, i.e. that portion alone), not the recon→haiku switch — the sonnet collectors in wf_d7e47752-0f8 are already cheap ($4.38 total for 5 agents); haiku pricing (1/5 vs sonnet 2/10, i.e. exactly half) would cut that further but the bulk of the 18.3% figure is avoiding opus on recon-shaped work, not the haiku switch per se. This does NOT touch the two opus lead sessions (see below) — those are out of the 4-workflow subtotal by construction of this hypothetical.

## Where the waste was
1. **Killed diagnosis run, opus, 100% waste: $5.1308.** wf_3227fe3d-ad3 (`status:"killed"` in `workflows/wf_3227fe3d-ad3.json`), 5 collector agents on opus, re-run as wf_d7e47752-0f8 on sonnet for $4.38 minutes later. The retry not only redid the work, it also switched off opus — meaning the original model choice (opus for recon/log-reading) was itself the thing corrected.
2. **Failed F1, sonnet, 100% waste: $6.4740.** wf_2fb79243-84e ran F1 for 140 turns and the agent is recorded `"type":"failed"` in its `journal.jsonl`. The real F1 (inside wf_4eb1edf7-db8) succeeded in 28 turns for $0.32 — the failed attempt cost >20× what the successful one did.
3. **Context exhaustion inside implementation agents:** F2 (157 turns) and F4 (140 turns) both hit the ~140-turn range noted as the "at most ~70 tool calls" budget doubled-and-over in the workflow script's own rules text (`workflows/wf_4eb1edf7-db8.json` → `script` field: `"LIMIT: najwyzej ~70 wywolan narzedzi"`). F2 made 157 tool calls, F4 made 140 — both roughly 2× the stated budget, and per the growth measurement above, tool call 140 costs several times what tool call 20 costs, so running past budget is disproportionately expensive, not just "a bit more."
4. **Two review rounds (checker-r1 $1.42 + checker-r2 $1.99 + fix-r1 $0.29 = $3.71) plus qa ($1.14) after already-expensive F2-F4** — not "waste" in the sense of thrown-away work (both checker rounds presumably found real issues, not measured/verified here — I did not read their report content, only usage), but it is $3.71 of review cost stacked on top of $11.64 of F1-F4 implementation cost, i.e. review is ~24% of the F1-F4+review subtotal.
5. **Lead-session cost dwarfs everything measured at the subagent level.** afbf8f27 alone ($63.70, opus, 179 turns) is nearly 2× the entire $34.32 subagent total across all 4 named workflows combined. Not fully attributable to the four named workflows (scope caveat above), but it establishes that orchestrator-side opus usage, not subagent fan-out, is where the largest single cost concentration was actually measured.

## Could not establish
- Exact reconciliation between the harness's `workflows/wf_X.json` `totalTokens` field and my per-agent context-token sums (different token-counting methodology, not decomposed by input/cache/output, so not directly convertible to a USD figure to cross-check my totals against).
- Whether afbf8f27/d83d7fb8's own sub-workflows (`wf_3dbc5b63-ac5`, `wf_5de2ebe4-eca`, `wf_77d7c353-4d5`, `wf_b3ebe4a2-47e`, `wf_2a2a84d5-da4`, `wf_6545c224-6cd`) overlap in content with the four named workflows — not opened (budget).
- Whether checker-r1/checker-r2's findings were genuine (justifying the 2-round cost) or redundant — did not read report content, only usage/turns.
