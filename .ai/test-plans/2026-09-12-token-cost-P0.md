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
Status: **FROZEN 2026-09-12 (human)**
Frozen: 2026-09-12 by the human, answering Q1–Q7 below. Amended same day to fold the answers into the
case table; no ID was renumbered, no expectation was weakened — only filled in.

> Implementation files (`tools/token-report.js`, `tools/token-report.test.js`) were confirmed
> **absent** from the worktree before this list was derived (`ls tools/` on base `ec1b13c`, fast-
> forwarded to `87b6250` per the lead's correction — that commit only rotates this repo's own
> `.ai/STATE.md` / `.ai/lessons.md` memory files, untouched by anything below). Nothing under `tools/`
> was open while deriving this list. The one exception, taken under explicit lead instruction for Q1
> only: the **on-disk transcript format** at `~/.claude/projects/-home-charlie-Work-partner-portal-v3`
> was inspected for **file names, sibling meta files and JSON key names only** — no message content,
> no implementer code. See Q1's resolution below for exactly what that inspection found.

## I could not derive this from the spec — please decide

> These blocked writing several cases precisely. Marked inline on the behavior table as **[Qn]**
> while open; **all seven are now resolved** — each entry below keeps the original question (audit
> trail) and appends the human's answer.

❓ **Q1 — how is a subagent transcript file attributed to a role?** The contract gives the path shape
(`<session>/subagents/agent-*.jsonl`) but the glob carries no role in the filename, and the spec's
"per-role distribution" and "unprefixed non-built-in spawns by name" both need one. Candidates: (a)
match each `agent-*.jsonl` back to the `Task` tool_use block in the parent `<session>.jsonl` that
spawned it (by tool_use id / result correlation) and read `subagent_type` from there; (b) read a role
marker embedded in the subagent transcript's own first line. Affects **P0-22, P0-23**: without
an answer I can specify the *properties* (role buckets sum to the subagent total; an unattributable
transcript goes to an explicit `unknown` bucket, never silently dropped) but not the exact fixture
shape that exercises the real mechanism.

→ **Resolved 2026-09-12 (human):** derive the mechanism from the on-disk format itself, file names /
sibling meta files / key names only, no message content, no implementer code. Inspected
`~/.claude/projects/-home-charlie-Work-partner-portal-v3` under that constraint and found: every
`<session>/subagents/agent-<id>.jsonl` has a sibling `<session>/subagents/agent-<id>.meta.json`
(176 of 176 on this machine, 1:1). That file's keys are `agentType`, `description`, `model`,
`requestNonInteractive`, `requestShape`, `spawnDepth`, `spawnedWithWorktree`, `toolUseId`,
`worktreeBranch`, `worktreePath` — no message content among them. `agentType` carries exactly the
value needed: observed values include prefixed (`sailes-app-builder:explorer`,
`sailes-app-builder:be-dev`, `sailes-app-builder:tester`, `sailes-app-builder:qa`,
`sailes-app-builder:checker`), unprefixed-non-built-in (`be-dev`, `explorer`, `be-checker`, `qa`,
`fe-dev`, `tester`, `designer`), and built-in (`general-purpose`, `claude`). **Mechanism for the
suite:** role = the sibling `.meta.json`'s `agentType`, with the `sailes-app-builder:` prefix
stripped before bucketing (so a role's turns land in one bucket regardless of prefix — a corollary of
this answer, not separately asked; flagged here rather than silently assumed). Missing/unparsable
`.meta.json` → `unknown` bucket, per the human's explicit fallback instruction. Note: this reuses the
**same** on-disk fact for the spawn-tally cases (P0-24–28), which independently already used
`agentType`-shaped values scanned from `Task` `tool_use` blocks — the two metrics read from
different places (parent transcript vs. sibling meta file) but the field's vocabulary is now
confirmed consistent between them.

❓ **Q2 — the "built-in" exclusion list for "unprefixed non-built-in spawns."** The spec cites
`sub-agents.md` docs for `Explore` and `Plan`, and the harness fact sheet also names `general-purpose`
as a plugin-independent type elsewhere in this repo's conventions. Is the exact exclusion set exactly
`{general-purpose, Explore, Plan}`, case-sensitive, or is there a fourth I'm not aware of? Affects
**P0-26**.

→ **Resolved 2026-09-12 (human, from the implementer's brief):** the exclusion set is exactly
`general-purpose`, `Explore`, `Plan`, `claude`, `statusline-setup`, `claude-code-guide` — six names,
case-sensitive. (The on-disk inspection for Q1 independently observed `general-purpose` and `claude`
among real `agentType` values, consistent with this list.)

❓ **Q3 — `--since` / `--until` semantics.** The measurement's corpus selection used file **mtime**
("mtime ≥ 2026-09-11"), and the Done-when example (`--since 2026-09-11 --until 2026-09-13`) matches
that same window. Is filtering by file mtime (my working assumption, used in P0-29/30/31/32), or by a
timestamp embedded in the transcript content (first/last message timestamp)? Also: is `--since`
inclusive and `--until` exclusive (my assumption, matching a `[since, until)` window), or are both
inclusive? Affects **P0-29, P0-30**.

→ **Resolved 2026-09-12 (human decision):** file mtime. `--since D` includes mtime ≥ `D 00:00` local;
`--until D` excludes mtime ≥ `D 00:00` local — a half-open `[since 00:00, until 00:00)` window in
local time, confirming my working assumption on both filtering basis and boundary direction.

❓ **Q4 — "peak" definition.** Is peak-per-session the maximum single assistant-call context-token
value anywhere in the transcript (my assumption — matches "kontekst… nigdy się nie resetuje", i.e. a
ceiling reached), or a cumulative/running sum across calls? These usually coincide when context only
grows, but a session containing a compaction event would tell them apart. Affects **P0-18**.

→ **Resolved 2026-09-12 (human):** peak = the maximum context of a single call. Confirms the working
assumption.

❓ **Q5 — "turns" unit.** Is one turn one deduped assistant message (my assumption — consistent with
the measured p50 of 367 for a 6-session lead sample, which only makes sense per-response, not per
human-exchange), or one full human-then-assistant round trip? Affects **P0-13**.

→ **Resolved 2026-09-12 (human):** turn = one distinct assistant `message.id`. Confirms the working
assumption.

❓ **Q6 — top-10% rounding rule with non-multiple-of-10 sample sizes.** The real lead bucket has 6
sessions; "top 10%" of 6 cannot be a whole number under a naive `n * 0.1`. Ceiling (→ 1), rounding, or
"at least 1 if n ≥ 1"? The real measurement's own 43%/52% figures depend on whichever rule was used
(6 lead, 160 subagent sessions) — Done-when's "reproduces 706M/1297M ±1%" line is silent on whether
that ±1% also covers the percentage figures, or only the two totals. Affects **P0-19, P0-20, P0-21**.

→ **Resolved 2026-09-12 (human):** `top 10% = ceil(n × 0.1)` transcripts, minimum 1. Derived check
against the spec's own published numbers: 6 lead sessions → `ceil(0.6) = 1` session →
305 M / 706 M = 43% — matches the spec's table exactly, so this rule is now testable with concrete
expected values rather than a property-only assertion.

❓ **Q7 — malformed-line handling: skip-and-warn, or hard-fail?** Neither behavior is stated. A silent
skip risks under-counting without anyone noticing (the exact failure shape this whole tool exists to
catch, per the named 10-vs-177 regression); a hard fail risks an unrelated single corrupt line — from,
say, a Claude Code version bump — blocking the whole baseline run. I default the case to "skip the
line, continue, and say so on stderr" as the reading consistent with this repo's stated preference
(`session-start never blocks`) elsewhere, but this tool is a measurement instrument, not a session
gate, so that precedent may not transfer. Affects **P0-35**.

→ **Resolved 2026-09-12 (human decision):** skip the malformed line and count it. The count is
reported on stderr, in the human-readable report, and as a `--json` field. Exit code is unaffected
(stays 0 on this trigger alone). **Naming note (tester's call, not spec-mandated):** the human's
answer names three surfaces but not a JSON key. The suite below asserts a top-level `--json` field
named `malformedLines` (integer). This is the suite *fixing* that part of the contract, in the
absence of a named key — if the implementation exposes the same count under a different key, that is
a legitimate red test and a naming disagreement to raise, not something to silently reinterpret away.

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
| P0-18 | A session with calls of 5k, 50k, 30k context tokens in that order | Peak reported for that session = 50k — the maximum single call (Q4), not cumulative, not last | unit |
| P0-19 | Fixture of 10 sessions with known, distinct totals | Top 10% = `ceil(10 × 0.1) = 1` session (Q6). Reported share equals that top session's total ÷ grand total, exactly | unit |
| P0-22 | Two subagent transcripts with sibling `.meta.json` carrying `agentType: "be-dev"` and `agentType: "sailes-app-builder:qa"` respectively (Q1 mechanism) | Report groups turn counts per role, bucketed by `agentType` with any `sailes-app-builder:` prefix stripped (`be-dev`, `qa`); one role's turns never appear in another role's bucket | unit |
| P0-24 | A `Task` tool_use with `subagent_type: "be-dev"` (no prefix) in a lead transcript | Counted once under name `"be-dev"` in the unprefixed non-built-in spawn tally | unit |
| P0-25 | A `Task` tool_use with `subagent_type: "sailes-app-builder:be-dev"` (prefixed) | **Not** counted in the unprefixed tally (excluded specifically for carrying the prefix) | unit |
| P0-27 | "be-dev" spawned 3 times, "explorer" spawned 2 times, across different sessions | Tally reports per-name counts (`be-dev: 3, explorer: 2`), matching the real measurement's own per-name breakdown shape | unit |
| P0-29 | Fixture of 3 sessions dated (by mtime, local midnight) 09-10, 09-11, 09-13; run with `--since 2026-09-11 --until 2026-09-13` | Only the 09-11 session is included — Q3's `[since 00:00, until 00:00)` window excludes both 09-10 and 09-13 | unit |
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
| P0-13 | A session with 5 assistant lines where 2 share one `message.id` (the P0-06 shape) | Turns for that session = 4, not 5 (Q5: turn = one distinct `message.id`) — turn-counting respects the same dedup as token totals | unit |
| P0-20 | Fixture of 10 sessions where ranks 1 and 2 (at the top-10% boundary, `ceil(10×0.1)=1`) have **identical** totals | Reported share = that (shared) top value ÷ grand total; re-running against the same fixture reproduces the identical number every time (tied totals make the value order-independent by construction — this proves determinism, not a hidden ambiguity, now that Q6 fixes the count) | unit |
| P0-21 | Fixture of exactly 6 lead sessions, reusing the spec's own published totals (one session = 305 M of a 706 M grand total — public numbers already in the spec prose, not client content) | `ceil(6×0.1)=1` (Q6, minimum-1 rule) → reported top-10% share = 305/706 ≈ 43%, matching the spec's own table exactly | unit |
| P0-23 | A subagent transcript with **no** sibling `.meta.json` file (or one that fails to parse) | Placed in an explicit `unknown` bucket per the Q1 fallback, not silently dropped — sum of all per-role buckets + `unknown` == the overall subagent total from P0-14/15 | unit |
| P0-26 | A `Task` tool_use with `subagent_type: "general-purpose"` (built-in per Q2's six-name list, carries no prefix) | **Not** counted in the unprefixed non-built-in tally, despite carrying no prefix, because it is on the Q2 exclusion list | unit |
| P0-26b | A `Task` tool_use with `subagent_type` set to each of the other five Q2 built-ins in turn (`Explore`, `Plan`, `claude`, `statusline-setup`, `claude-code-guide`) | None of the six counted in the unprefixed non-built-in tally — full enumeration of the frozen exclusion list, not just its most-cited member | unit |
| P0-28 | A `Task` `tool_use` block appears on a line whose `message.id` duplicates an already-seen usage line (the P0-06 shape, restated as a spawn-tally assertion) | The spawn is still counted — this is the named historical regression, proven from the spawn side rather than the token side | unit |
| P0-30 | One session's mtime exactly equals `--since D` at `D 00:00` local; another session's mtime exactly equals `--until D` at `D 00:00` local | Per Q3: the `--since` session is **included** (`≥` boundary); the `--until` session is **excluded** (`≥` boundary excludes on the until side) — the two boundaries use the same comparator in opposite directions, guarding an off-by-one that would treat them the same | unit |
| P0-31 | No `--since`/`--until` given at all | All sessions in the directory included regardless of mtime | unit |
| P0-32 | `--since` given alone, no `--until` | Open-ended upper bound — everything from that date forward is included | unit |
| P0-35 | One line in an otherwise-valid transcript file is malformed JSON (truncated / not parseable) | Per Q7: no crash, exit code 0; all other valid lines in that file still counted; stderr contains a message naming the malformed-line count; `--json` output carries a top-level `malformedLines: 1` field (tester-named field, see Q7 resolution) | unit |
| P0-36 | A `.jsonl` file present but 0 bytes (fully empty, no lines at all) | Treated as "no data for this session" — same non-crashing outcome as P0-10, distinct trigger (total absence of lines vs. presence of usage-less lines) | unit |

> No **promoted** row yet — this is Step 1 (behavior derivation), written with the implementation
> unread and before any inner-loop check exists to promote from. A promoted case, if the implementer's
> report names one, is folded in at Step 4, after the diff is read.

---

## Detection proof (filled at step 5, after the suite exists)

Run 2026-09-12, against the fixed implementation merged at `feat/1.33.0-token-cost` (`5272da4`,
frozen suite wired into `npm test` at `6d3c3bd`). Method per mechanism, exactly as tier B requires:
plant the mutant in `tools/token-report.js` only, run `node tools/token-report.frozen.test.js`,
record which frozen IDs went red, revert (`git checkout -- tools/token-report.js`), confirm
`sha256sum` matches the pre-mutation baseline (`93c31930…f847d`) before the next mutant. All eleven
mutants below were reverted; the file is byte-identical to baseline at the end of this table.

| # | Mutant (mechanism) | Mutation applied | Frozen IDs that went red | Reverted, suite green | Verdict |
|---|---|---|---|---|---|
| 1 | Usage dedup by `message.id` removed | `if (!seenUsageIds.has(message.id))` → `if (true)` | **P0-07, P0-13** | ✅ | detects |
| 2 | `tool_use` collected only from the deduped first line (10-vs-177 bug) | moved the `tool_use` collection loop inside the usage-dedupe `if` block | **P0-06, P0-28** | ✅ | detects |
| 3 | A turn counted only when `usage` exists (P0-09 regression) | `if (!seenUsageIds.has(message.id))` → `if (!seenUsageIds.has(message.id) && message.usage)` | **P0-09, P0-10** | ✅ | detects |
| 4 | Peak = cumulative instead of max | `peakContext = Math.max(peakContext, ctx)` → `peakContext += ctx` | **P0-18** | ✅ | detects |
| 5 | Top 10% floor instead of ceil / no minimum 1 | `Math.max(1, Math.ceil(n * 0.1))` → `Math.floor(n * 0.1)` | **P0-21** | ✅ | detects |
| 6 | `--until` inclusive instead of exclusive | `mtimeMs >= untilMs` → `mtimeMs > untilMs` | **P0-29, P0-30** | ✅ | detects |
| 7 | `--since`/`--until` by UTC instead of local midnight | `new Date(year, month-1, day)` → `new Date(Date.UTC(year, month-1, day))` | **P0-29, P0-30** | ✅ | detects |
| 8 | Built-in exclusion missing one name | dropped `'claude-code-guide'` from `BUILTIN_SUBAGENT_TYPES` | **P0-26b** | ✅ | detects |
| 9 | `plugin:` prefix not stripped for role bucketing | `roleFromAgentType` returns `agentType` unstripped | **P0-22** | ✅ | detects |
| 10 | Malformed line throws instead of skip-and-count | `catch { malformedLines += 1; continue; }` → `catch (e) { throw e; }` | **P0-35** | ✅ | detects |
| 11 | Text output humanizing a total again (P0-34 regression) | `context tokens total` line reverted to `fmtTotal(...)` only, dropping the exact-value prefix | **P0-34** (only after strengthening below) | ✅ | detects, after fix |

**Finding on mutant 11 — a mutant no test killed, per the rule in the brief.** The frozen P0-34 test
originally asserted `text.includes(String(json.lead.contextTokensTotal))` against the **whole** text
blob. Mutant 11 still passed that assertion: the `lead-subagent-totals` fixture's lead total (15000)
happens to equal its `firstTurnContext`/`peakContext` values (one assistant call, so all three
metrics coincide), and *those* lines still print the raw number via `dualCount`, even with the
"context tokens total" line reverted to humanized-only ("15.0k"). Per the brief's instruction —
"strengthen the test for its frozen ID without changing any expected value, or report a plan-level
gap instead of inventing a new case" — P0-34 was strengthened, not replaced: a `contextTotalLine()`
helper now scopes the substring check to the specific "context tokens total" line inside each
section ("Lead sessions:" / "Subagent transcripts:"), instead of the whole output. **No expected
value changed** — both assertions still compare against the same `json.lead.contextTokensTotal` /
`json.subagents.contextTokensTotal`, and no fixture was touched. Re-verified: mutant 11 now turns
P0-34 red (confirmed above); the full suite is green with the mutant reverted. No `DEAD` case and no
plan-level gap resulted — the fix was containable inside P0-34's own test body.

No survivors: all eleven planted mutants, one per requested mechanism, were killed by at least one
frozen ID, and every kill matched the mechanism intentionally targeted (no case caught a mutant by
accident from an unrelated assertion, except the now-fixed P0-34 coincidence above, which is
recorded rather than hidden). `tools/token-report.js` confirmed byte-identical
(`sha256sum 93c31930a2f1737a42f23b6bf9b6d44f34fac7eb362987b92ee3aa212b2f847d`) to the pre-mutation
merge throughout; `node tools/token-report.frozen.test.js` and `node tools/token-report.test.js` both
green at the end of this run.

**Unrelated finding, out of scope for this suite:** `tools/mcp-toolnames-check.test.js`'s "server
absent -> SKIP" case is flaky independent of anything here — an unhandled async `EPIPE` when writing
to an already-exited MCP-server subprocess's stdin, reproduced 1 of 3 `npm test` runs and 1 of 2
standalone runs during this session, with `tools/token-report.js` untouched throughout each. Reported
to the lead; not fixed here (not a file this suite owns).
