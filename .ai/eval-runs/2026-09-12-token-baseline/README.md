# P0 baseline — token cost of running, 11–12.09

Recorded 2026-09-12, ahead of the transcript cleanup that will remove these files around 11–12.10
(`.ai/specs/2026-09-12-token-cost-of-running.md`, "Fakty o harnessie"). This directory carries
**aggregates only** — numbers, distributions and role names, never message content, tool input, or
file paths from inside the client repo.

## Command

```
node tools/token-report.js ~/.claude/projects/-home-charlie-Work-partner-portal-v3 \
  --since 2026-09-11 --until 2026-09-13 --json
```

Date filter is by file **mtime**, **local time**, half-open `[since, until)` — see `tools/token-report.js
--help` for the full definition. `baseline.json` in this directory is the tool's own `--json` output
for that command, plus a small `meta` block naming the command and date for provenance.

## Delta against the spec's numbers

The spec (`.ai/specs/2026-09-12-token-cost-of-running.md`, "Pomiar, na którym stoi spec") recorded
706 M lead / 1 297 M subagent context tokens from an earlier run of the same measurement, using
ad-hoc scratchpad scripts rather than this tool. Re-measuring with `tools/token-report.js` some hours
later, against the same live directory, gives:

| Metric | Spec | This baseline | Delta |
|---|---|---|---|
| Lead context tokens | 706 M | 714.0 M | +1.13% |
| Subagent context tokens | 1 297 M | 1 363.5 M | +5.04% |
| Lead sessions | 6 | 6 | exact |
| Subagent transcripts | 160 | 161 | +1 file |
| Spawns total | 177 | 178 | +1 |
| Spawns unprefixed | 135 | 135 | exact |
| Unprefixed by role | be-dev 50, explorer 45, be-checker 15, qa 13, fe-dev 6, designer 3, tester 3 | identical | exact |
| Lead turns p50/max | 367/560 | 367/560 | exact |
| Lead first-turn ctx p50/p90 | 69k/89k | 69k/89k | exact |
| Lead peak ctx p50/max | 627k/933k | 666k/933k | p50 +6.2%, max exact |
| Lead top 10% share | 43% | 43% | exact |
| Subagent turns p50/max | 41/431 | 41/431 | exact |
| Subagent peak ctx p50/max | 136k/542k | 136k/542k | exact |
| Subagent top 10% share | 52% | 55% | +3 pts |

**Reading this, not tuning to it:** the two token totals are outside the brief's ±1% band (lead is
inside it at +1.13%, subagents are not at +5.04%). Every other independently-computed statistic —
turns, first-turn context, peak max, and critically the entire unprefixed-spawn breakdown by
role, which has seven independent counts — matches EXACTLY. An algorithm bug that inflated token
sums would not leave turns, spawn counts and percentiles untouched; the pattern here (exact counts,
inflated sums, +1 extra subagent transcript, +1 extra spawn) is consistent with the client repo's
real work continuing between the spec's original measurement and this baseline run, both taken on
2026-09-12. This is reported as a finding, not resolved by adjusting the tool.
