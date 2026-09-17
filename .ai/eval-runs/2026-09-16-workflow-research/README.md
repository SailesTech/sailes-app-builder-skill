# Research 2026-09-16 — Sailes roles on the Workflow tool, model and cost optimisation

Workflow `wf_c7c25bee-3b3` (8 agents, none on Opus): 3 model-resolution probes, 4 gatherers with disjoint sources,
1 synthesiser (`researcher` overridden to sonnet). Source feedback: `source-feedback-idealny-wzrok.md`
(copy of `~/Work/Internal/sailes-feedback/2026-09-16-idealny-wzrok-diagnoza-i-workflow.md`).

| File | Content |
|---|---|
| `findings.md` | synthesis: model resolution, cost model, practice mapping, spec format, trade-offs, could-not-establish |
| `costs.md` | per-agent cost of past runs `wf_d7e47752-0f8`, `wf_2fb79243-84e`, `wf_3227fe3d-ad3`, `wf_4eb1edf7-db8` + lead sessions |
| `practices.md` | every Sailes practice → KEEP / TRANSLATE / CONFLICT / LOST in Workflow |
| `spec.md` | how the "zawsze popup" spec was turned into a workflow script, what the script had to invent |
| `external.md` | Claude Code / Anthropic docs, verbatim quotes with fetch method |

## CORRECTION (2026-09-16, found in P1 of spec 2026-09-16-workflow-first-orchestration)

The cost parser behind `costs.md` and `findings.md` §2 kept the **first** `usage` line per `message.id`. In a streamed
transcript that line carries partial `output_tokens` (F2 of `wf_4eb1edf7-db8`: 12,282 recorded vs 73,705 final).
Corrected with the last `usage` per id (independent lead parser and `tools/token-report.js --cost` agree to the cent):

| Figure | In these files | Corrected |
|---|---|---|
| 4 workflows, subagents | $34.32 | **$41.28** |
| `wf_4eb1edf7-db8` | $18.33 | **$22.19** |
| cost split cache read / cache write / output | 75% / 23% / 2% | **62% / 19% / 19%** |
| lead sessions `afbf8f27`, `d83d7fb8` | $63.70, $19.31 | unchanged |

Conclusions stand: the Opus lead session costs more than all subagents of four workflows; turn count and context length
are the main cost lever; the two wasted runs were spec-completeness and turn-limit failures, not tier failures.

## What followed

- Spec `.ai/specs/2026-09-16-workflow-first-orchestration.md` (1.35.0), decisions D1–D8, Q1–Q6.
- Harness facts measured: `.ai/eval-runs/2026-09-16-workflow-facts/VERDICT.md` (P0).
- Gate placement A/B/C: `.ai/eval-runs/2026-09-16-gate-placement/VERDICT-round1.md` (D8).
- Run log: `.ai/runs/2026-09-16-workflow-first.md`.
