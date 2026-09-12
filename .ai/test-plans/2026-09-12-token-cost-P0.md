# Test plan — token cost of running, P0 (`tools/token-report.js`)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`
Phase: P0 — measurement tool and baseline (Q4, before other changes)
Risk tier: **B** (triggers fired: none of {money, auth/permissions/tenancy, idempotency, irreversible
outbound write} — Tier A does not apply. Fired instead: "ordinary business logic" — the tool computes
dedup-by-`message.id`, percentile/rank statistics, boundary-sensitive date filtering and role/spawn
attribution, none of which is a pure read or pure formatting. That rules out Tier C. No trigger in
this assignment argues for raising above B; if the human judges the P5 header number ("dowód
oszczędności") money-adjacent enough to raise to A, that is their call to make at freeze time, not
mine to assume.)
Status: **DRAFT**
Frozen: — (awaiting human)

> `DRAFT` means no test may be written yet. This assignment stops here — Step 1 of `sailes-test`
> only. Implementation files (`tools/token-report.js`, `tools/token-report.test.js`) were confirmed
> **absent** from the worktree before this list was derived (`ls tools/` on base `ec1b13c`, fast-
> forwarded to `87b6250` per the lead's correction — that commit only rotates this repo's own
> `.ai/STATE.md` / `.ai/lessons.md` memory files, untouched by anything below). Nothing under `tools/`
> was open while deriving this list.

## I could not derive this from the spec — please decide

> These block writing several cases precisely. Marked inline on the behavior table as **[Qn]**.

❓ **Q1 — how is a subagent transcript file attributed to a role?** The contract gives the path shape
(`<session>/subagents/agent-*.jsonl`) but the glob carries no role in the filename, and the spec's
"per-role distribution" and "unprefixed non-built-in spawns by name" both need one. Candidates: (a)
match each `agent-*.jsonl` back to the `Task` tool_use block in the parent `<session>.jsonl` that
spawned it (by tool_use id / result correlation) and read `subagent_type` from there; (b) read a role
marker embedded in the subagent transcript's own first line. Affects **P0-22, P0-23, P0-27**: without
an answer I can specify the *properties* (role buckets sum to the subagent total; an unattributable
transcript goes to an explicit `unknown` bucket, never silently dropped) but not the exact fixture
shape that exercises the real mechanism.

❓ **Q2 — the "built-in" exclusion list for "unprefixed non-built-in spawns."** The spec cites
`sub-agents.md` docs for `Explore` and `Plan`, and the harness fact sheet also names `general-purpose`
as a plugin-independent type elsewhere in this repo's conventions. Is the exact exclusion set exactly
`{general-purpose, Explore, Plan}`, case-sensitive, or is there a fourth I'm not aware of? Affects
**P0-26**.

❓ **Q3 — `--since` / `--until` semantics.** The measurement's corpus selection used file **mtime**
("mtime ≥ 2026-09-11"), and the Done-when example (`--since 2026-09-11 --until 2026-09-13`) matches
that same window. Is filtering by file mtime (my working assumption, used in P0-29/30/31/32), or by a
timestamp embedded in the transcript content (first/last message timestamp)? Also: is `--since`
inclusive and `--until` exclusive (my assumption, matching a `[since, until)` window), or are both
inclusive? Affects **P0-29, P0-30**.

❓ **Q4 — "peak" definition.** Is peak-per-session the maximum single assistant-call context-token
value anywhere in the transcript (my assumption — matches "kontekst… nigdy się nie resetuje", i.e. a
ceiling reached), or a cumulative/running sum across calls? These usually coincide when context only
grows, but a session containing a compaction event would tell them apart. Affects **P0-18**.

❓ **Q5 — "turns" unit.** Is one turn one deduped assistant message (my assumption — consistent with
the measured p50 of 367 for a 6-session lead sample, which only makes sense per-response, not per
human-exchange), or one full human-then-assistant round trip? Affects **P0-13**.

❓ **Q6 — top-10% rounding rule with non-multiple-of-10 sample sizes.** The real lead bucket has 6
sessions; "top 10%" of 6 cannot be a whole number under a naive `n * 0.1`. Ceiling (→ 1), rounding, or
"at least 1 if n ≥ 1"? The real measurement's own 43%/52% figures depend on whichever rule was used
(6 lead, 160 subagent sessions) — Done-when's "reproduces 706M/1297M ±1%" line is silent on whether
that ±1% also covers the percentage figures, or only the two totals. Affects **P0-19, P0-20, P0-21**.

❓ **Q7 — malformed-line handling: skip-and-warn, or hard-fail?** Neither behavior is stated. A silent
skip risks under-counting without anyone noticing (the exact failure shape this whole tool exists to
catch, per the named 10-vs-177 regression); a hard fail risks an unrelated single corrupt line — from,
say, a Claude Code version bump — blocking the whole baseline run. I default the case to "skip the
line, continue, and say so on stderr" as the reading consistent with this repo's stated preference
(`session-start never blocks`) elsewhere, but this tool is a measurement instrument, not a session
gate, so that precedent may not transfer. Affects **P0-35**.

## NOT testing (deliberately)

- **Reproducing the real 706M/1297M ±1% baseline inside the automated suite** — the source data is
  `partner-portal-v3`'s real transcripts: confidential (this repo goes to GitHub) and due to age out
  around 2026-10-11 (`cleanupPeriodDays` default). The unit suite instead proves the arithmetic on
  synthetic fixtures with hand-computed expected values (P0-06 through P0-21). The real-corpus run
  stays a one-time, human-run verification — see **Requires you** below.
- **The Q3 `maxTurns` threshold table itself** (be-dev 140, qa 210, …) — that is P3's decision,
  computed *from* this tool's output on real data; P0 only has to prove the tool's arithmetic is
  right, not reproduce P3's numbers.
- **Money, auth, tenancy** — none apply; the tool reads local `.jsonl` files and prints aggregates.
- **Windows/POSIX shell portability** — `token-report.js` is Node, not the `sh`/`awk`/`sed` hook from
  P1; the portability risk named in the spec's harness-facts section is specific to that hook.
- **Performance at real scale** (500+ MB of transcripts, thousands of files) — the spec names no
  performance requirement for this tool; only correctness.

## Requires you

👉 **Real-corpus reproduction** — run `node tools/token-report.js
~/.claude/projects/-home-charlie-Work-partner-portal-v3 --since 2026-09-11 --until 2026-09-13` on the
machine that still holds those transcripts, and confirm lead/subagent totals land within ±1% of
706 M / 1 297 M, before ~2026-10-11 (Done-when's own deadline for this figure). This cannot be
scripted into the frozen suite (confidential, machine-specific, time-limited data) — report
**UNVERIFIED** until a human runs it and pastes the observed totals into the baseline record.
👉 **`grep` confidentiality check on the real baseline artifact** — after the run above,
`grep`-search the written `.ai/eval-runs/2026-09-12-token-baseline/` output for any snippet of message
prose; Done-when requires it find none. Same reason: only executable against the real, ephemeral,
confidential corpus, not a repo fixture. The synthetic version of this property (P0-33) *is* in the
frozen suite and is not a substitute for this step — it proves the mechanism, not the actual artifact.

🔀 **External boundaries: none.** `token-report.js` reads only local files under a given directory
argument — no network call, no CDN/proxy/gateway/CRM/payment/auth-provider boundary anywhere in its
contract. No mock, no pair, nothing to trade away here.

## Behaviors

> Fixtures throughout are synthetic — invented session/subagent JSONL content with placeholder text
> (e.g. `"assistant text placeholder"`), never a quotation from any real client transcript.

### Happy path

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| P0-14 | One lead session (N context tokens) with one subagent under it (M context tokens) | Report shows lead total = N and subagent total = M in **separate** buckets, never summed into one figure | unit |
| P0-15 | Multiple lead sessions, multiple subagents nested under different sessions | Lead total = sum over all `<session>.jsonl` files; subagent total = sum over **all** `agent-*.jsonl` under any `subagents/` dir, regardless of which session owns them | unit |
| P0-16 | A session with 3 assistant calls of context tokens 10k, 40k, 25k in that chronological order | First-turn context reported for that session = 10k (the first call, not the max/last/average) | unit |
| P0-17 | Fixture of 3 lead sessions with known first-turn values 10k / 20k / 30k | Aggregate first-turn p50 across sessions = 20k, proving the percentile method, not just single-session extraction | unit |
| P0-18 [Q4] | A session with calls of 5k, 50k, 30k context tokens in that order | Peak reported for that session = 50k (max single call, not cumulative, not last) | unit |
| P0-19 | Fixture of 10 sessions with known, distinct totals | Reported top-10% share equals the hand-computed percentage from the top-ranked session's total ÷ grand total, exactly | unit |
| P0-22 [Q1] | Subagent transcripts attributable to distinct roles by the resolved mechanism | Report groups turn counts per role; one role's turns never appear in another role's bucket | unit |
| P0-24 | A `Task` tool_use with `subagent_type: "be-dev"` (no prefix) in a lead transcript | Counted once under name `"be-dev"` in the unprefixed non-built-in spawn tally | unit |
| P0-25 | A `Task` tool_use with `subagent_type: "sailes-app-builder:be-dev"` (prefixed) | **Not** counted in the unprefixed tally (excluded specifically for carrying the prefix) | unit |
| P0-27 [Q1] | "be-dev" spawned 3 times, "explorer" spawned 2 times, across different sessions | Tally reports per-name counts (`be-dev: 3, explorer: 2`), matching the real measurement's own per-name breakdown shape | unit |
| P0-29 [Q3] | Fixture of 3 sessions dated (by mtime) 09-10, 09-11, 09-13; run with `--since 2026-09-11 --until 2026-09-13` | Only the 09-11 session is included in the report | unit |
| P0-33 | Synthetic fixture whose assistant text contains a marker string (`SECRET-MARKER-TEXT`) standing in for real prose | Neither default text output nor `--json` output contains that string anywhere — aggregates only | unit |
| P0-34 | Same fixture run once with default output, once with `--json` | Every numeric metric (lead total, subagent total, turns, peaks, top-10% shares) is identical between the two formats | unit |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| P0-01 | Empty transcript directory (exists, zero `.jsonl` files) | Exits 0; all totals report as zero; no crash, no `NaN`/`Infinity` from percentile math over an empty set | unit |
| P0-02 | `<projectTranscriptDir>` path does not exist on disk | Exits non-zero, clear error on stderr, no partial/misleading output — distinguishable from P0-01's valid-but-empty case | unit |
| P0-03 | No positional directory argument given at all | Usage/help text printed, non-zero exit, no stack trace | unit |
| P0-04 | One lead session, no `subagents/` directory present at all (never spawned anyone) | Subagent totals report as zero/empty; no crash on the missing subdirectory | unit |
| P0-05 | A `<session>/subagents/agent-*.jsonl` exists with **no** matching `<session>.jsonl` beside it (orphaned group, e.g. lead file already rotated away) | Orphaned subagent transcripts still count toward subagent totals; no crash on the missing parent file | unit |
| P0-06 | **Split message** (named in spec Done-when): one `message.id` appears on two JSONL lines — first line carries `usage`, no `tool_use`; second line repeats the same `message.id`, carries a `Task` `tool_use`, no new usage | Context tokens for that `message.id` counted **once**; the `tool_use` on the second line **is** counted toward the spawn tally. This is the named 2026-09-12 regression (spawns undercounted 10 vs 177) restated as a case | unit |
| P0-07 | **Repeated usage** (named in spec Done-when): same `message.id` appears twice, both lines carrying identical non-zero `usage` | Context tokens counted **once**, not twice — opposite defect direction from P0-06 | unit |
| P0-08 | Two distinct `message.id`s in one session, each with its own distinct usage | Both counted separately — guards against an over-eager dedup keyed on usage-value equality instead of `message.id` | unit |
| P0-09 | An assistant message present with no `usage` field at all | Contributes 0 to context tokens; no crash; not reported as `NaN` anywhere | unit |
| P0-10 | A transcript whose every assistant line lacks `usage` | Session contributes 0 to totals; excluded from / zero-valued in peak and percentile aggregates without producing `NaN`/`Infinity` | unit |
| P0-11 | An assistant message with an empty `tool_use` array (or no `tool_use` key at all) | No crash; contributes 0 to spawn tally; its `usage` still counts normally toward context tokens | unit |
| P0-12 | A usage object with only `input` present (no `cache_creation`/`cache_read` keys at all) | Context tokens = `input` alone; missing cache fields treated as 0, not an error | unit |
| P0-13 [Q5] | A session with 5 assistant lines where 2 share one `message.id` (the P0-06 shape) | Turns for that session = 4, not 5 — turn-counting respects the same dedup as token totals | unit |
| P0-20 [Q6] | Fixture of 10 sessions where ranks 1 and 2 (at the top-10% boundary) have **identical** totals | The tool's tie-break is deterministic — re-running against the same fixture produces the same share every time, never flipping between two different valid answers | unit |
| P0-21 [Q6] | Fixture of exactly 6 lead sessions (matching the real corpus's own lead-session count) | Top-10%-of-6 never rounds down to 0 sessions/0% — the real baseline had 6 lead sessions and reported a nonzero 43% share | unit |
| P0-23 [Q1] | A subagent transcript whose role cannot be resolved by the chosen mechanism (missing/malformed marker) | Placed in an explicit `unknown` bucket, not silently dropped — sum of all per-role buckets + `unknown` == the overall subagent total from P0-14/15 | unit |
| P0-26 [Q2] | A `Task` tool_use with `subagent_type: "general-purpose"` (documented Claude Code built-in, carries no prefix) | **Not** counted in the unprefixed non-built-in tally, despite carrying no prefix, because it is built-in | unit |
| P0-28 | A `Task` `tool_use` block appears on a line whose `message.id` duplicates an already-seen usage line (the P0-06 shape, restated as a spawn-tally assertion) | The spawn is still counted — this is the named historical regression, proven from the spawn side rather than the token side | unit |
| P0-30 [Q3] | One session's mtime exactly equals `--since`; another session's mtime exactly equals `--until` | The `--since` session is **included** (inclusive lower bound); the `--until` session is **excluded** (exclusive upper bound) — the two boundaries are asymmetric, guarding an off-by-one that would treat them the same | unit |
| P0-31 | No `--since`/`--until` given at all | All sessions in the directory included regardless of mtime | unit |
| P0-32 | `--since` given alone, no `--until` | Open-ended upper bound — everything from that date forward is included | unit |
| P0-35 [Q7] | One line in an otherwise-valid transcript file is malformed JSON (truncated / not parseable) | No crash; all other valid lines in that file still counted; malformed line's fate (silent skip vs stderr warning) pinned to whichever the human picks for Q7 | unit |
| P0-36 | A `.jsonl` file present but 0 bytes (fully empty, no lines at all) | Treated as "no data for this session" — same non-crashing outcome as P0-10, distinct trigger (total absence of lines vs. presence of usage-less lines) | unit |

> No **promoted** row yet — this is Step 1 (behavior derivation), written with the implementation
> unread and before any inner-loop check exists to promote from. A promoted case, if the implementer's
> report names one, is folded in at Step 4, after the diff is read.

---

## Detection proof (filled at step 5, after the suite exists)

Not yet applicable — this plan is `DRAFT`. Once frozen and the suite is written (Step 3), Tier B
requires, per ID: break exactly that behavior in a scratch copy, show that ID's test go red, revert,
confirm the whole suite is green again. That table lands in the tester's Step 5 report, not here.
