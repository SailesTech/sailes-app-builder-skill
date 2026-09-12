# Test plan — token cost of running, P1a (`session-start.sh`)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P1 (Q1, F1, F2, F3) — hook part only.
Files under test: `skills/sailes-bootstrap/hooks-template/session-start.sh` (new extraction logic,
not yet written at base `ec1b13c`) · `skills/sailes-bootstrap/hooks-template/hooks-template.test.js`
(existing suite, must not regress).
Risk tier: **B** (raised from C — reason below)
Status: **FROZEN 2026-09-12 (human)**
Frozen: 2026-09-12 by human, answers relayed by lead. See "Resolved" below each open question.

> `DRAFT` means no test may be written yet. The human moves it to `FROZEN`. **This plan is now
> frozen — the case list below (P1a-01..25) is what the suite implements. No ID's expectation may
> be edited to reach green; a red frozen test is a defect to report, not to fix here.**

**Tier and why it's raised.** None of the standard triggers fire (no money, auth, tenancy,
idempotency, or irreversible outbound write — this hook is a read-only local-filesystem summarizer).
Judgment alone would put it at C. Raising to **B** anyway, on two facts the spec itself states, not
on my own judgment:
1. The spec's own Done-when (f) mandates a mutation-based proof (`cat "$STATE"` restored → cases (a)
   and (b) must redden, then revert to green) — that IS the tier-B detection proof, already written
   into the phase gate.
2. This hook's stdout is what every session, in every generated repo, believes about project memory
   at the moment it is least equipped to question it (`AGENTS.md`'s own framing of the bug this spec
   fixes). Blast radius, not complexity, is doing the raising.
Tier B requires: one case per equivalence partition, invalid ones included, every boundary the spec
names, and a break-the-code/red/revert/green proof per behavior. That shape is below.

## Working material — mode-selection decision table (not itself frozen, informs the cases)

| `## Open failures` (exact, `\r`/trailing-space tolerant) | `## Last session` (same tolerance) | Mode |
|---|---|---|
| present | present | **section** — emit Last-commit line + Open failures (+ General rules if present) + Last session |
| present | absent | **head** |
| absent | present | **head** |
| absent | absent | **head** |

Decoys (`## Open failure` singular, `## 🔴 Open failure — …`, `## Verified facts — wydanie`, a
trigger heading with trailing text like `## Open failures (resolved)`) are **not** the exact string
and count as "absent" in the table above. Head mode always: beginning of file, cut at a line
boundary, further clipped as needed to respect the global byte budget.

## I could not derive this from the spec — please decide

> The most valuable section. Real ambiguities, not padding.

❓ **Q-1 — truncation arithmetic under composition.** When drift warning + size warnings + extracted
content + Task Router line would together land past 9 500 B, is the byte budget for warnings fixed
first (extraction gets whatever remains), or is extraction computed first and warnings appended
after (risking the *total* exceeding budget)? Drives the exact expected byte count in P1a-15/16/24.
My assumption for the case list below: warnings are fixed-size and reserved first, extraction fills
the remainder — please confirm before freeze.

**Resolved (human, 2026-09-12):** the drift warning, the `.env` warning, the two size warnings, the
truncation line and the Task Router line are always emitted **intact** and are reserved **first**;
memory content (section or head extraction) fills whatever remains. The invariant that must hold in
every case is simply: the whole stdout is < 9 500 B. My original assumption stands — P1a-15/16/24 as
written are correct and need no rewrite.

❓ **Q-2 — single line longer than the whole budget (P1a-21).** Head mode "cuts at a line boundary"
per the brief; the byte budget ("stays < 9 500", "never splits UTF-8") is stated as inviolable. These
conflict when the very first line alone exceeds 9 500 B. Three readings: (a) emit zero content lines
plus the truncation notice, (b) hard-cut mid-line at a UTF-8-safe boundary, breaking "line boundary"
only in this one pathological case, (c) something else not stated. I've written P1a-21 to assert only
the invariant that's unambiguous (stdout stays under budget, no split UTF-8 byte) and left the
content-shape assertion UNVERIFIED pending this answer.

**Resolved (human, 2026-09-12) — decision (a).** A single line longer than the budget produces
**zero content lines** plus the truncation notice. P1a-21 is now fully specified below: no bytes of
that line (or any content) appear in stdout, the truncation notice is present, and the invariant
(stdout < 9 500 B, no split UTF-8 byte) still holds.

❓ **Q-3 — `Last-commit:` absent in a section-mode file.** The contract says section mode "emits
Last-commit line + those sections" as if unconditional, but `Last-commit:` could be missing even when
both trigger headings are present (a repo that adopted the 5-section shape before the drift-check
convention existed). Omit the line silently (matching the existing drift-check's "field absent →
silence" precedent), or emit some placeholder? Needed for P1a-07's negative variant.

**Resolved (human, 2026-09-12):** absent → silent, no placeholder. Added as its own case, P1a-25
(below), since P1a-07 only covers the present-and-non-stale side.

❓ **Q-4 — literal text vs. substring for the notice lines.** Must the truncation line and the two
size-warning lines match a frozen literal string, or is "contains the path + `.ai/archive/`" /
"contains the byte count" (regex/substring, the existing suite's own style — `/WARNING/`,
`/PRODUCTION markers/`) sufficient? I've written every case below as substring/regex, which leaves
wording free for the implementer; say so explicitly if literal text should be frozen instead.

**Resolved (human, 2026-09-12):** substring/regex assertions, as written. No case needs rewording.

❓ **Q-5 — does the hook WRITE to `.ai/archive/`, or only NAME it?** Q1/F3's retrieval model is
`grep` on demand against an archive that some other process (Upgrade mode, a human) populates. P1's
own file list for this phase does not include an archive-writer. I've assumed `session-start.sh` is
read-only and only prints a pointer line naming the archive path — it does not itself move overflow
content to disk. If that's wrong, P1a-04 needs an added filesystem assertion (the excess content
actually lands at the named path), not just a stdout check.

**Resolved (human, 2026-09-12):** the hook is read-only and only names `.ai/archive/`. My assumption
stands — P1a-04 stays a stdout-only check, no filesystem assertion added.

❓ **Q-6 — `>` vs `≥` at the three named boundaries.** I've read "STATE.md ≤ 20 KB" / "lessons.md ≤
40 KB" / "stays < 9 500" as: exactly-at-the-limit is the last **silent** value, one byte over is the
first **warned/truncated** value. That reading drives every paired boundary case below (P1a-15/16,
17/18, 19/20). Please confirm — the alternative (warn *at* the limit, not just past it) flips four
expected outcomes.

**Resolved (human, 2026-09-12):** strict boundaries, confirmed exactly as assumed. Total stdout:
9 500 B is over budget, 9 499 B fits. `STATE.md`: silent at 20 000 B, warns at 20 001 B. `lessons.md`:
silent at 40 000 B, warns at 40 001 B. P1a-15/16/17/18/19/20 need no rewrite.

❓ **Q-7 — 1000-based or 1024-based "KB".** The task brief gives exact decimal figures (9500, 20000,
40000) which I've taken as literal byte counts, not `9500*1.024` etc. Flagging since the spec prose
itself says "KB" throughout.

**Resolved (human, 2026-09-12):** decimal bytes. Confirmed as assumed — no case needs rewriting.

## NOT testing (deliberately)

- The 12 other doctrine files that carry the "read STATE.md + lessons.md" rule
  (`sailes-implement/SKILL.md`, `agent-team-structure.md`, etc.) — a grep-based doc check, not hook
  behavior, and out of this P1a scope per the assignment (hook only).
- Upgrade mode's hook-patching mechanics (F2: "only the STATE.md emission block is replaced") —
  belongs to whichever worker owns `adopt-existing-repo.md`, not `session-start.sh` itself.
- The actual rotation of old content into `.ai/archive/` (who writes it, when) — see Q-5; if the
  answer is "the hook doesn't write it," this is out of scope for P1a entirely.
- `lessons.md` *content* extraction/printing — Q1 is explicit that lessons never get printed at
  session start, only size-checked. No case here asserts on lessons.md's body appearing in stdout.
- Non-POSIX shells / GNU-only `sed`/`awk` extensions — the brief mandates POSIX only; portability to
  a specific BSD/GNU divergence is a `sh` availability concern already handled by the existing
  `shAvailable()` skip, not a new case.

## Requires you

- 🔀 external boundary: **n/a — this hook touches only the local filesystem and a local `git
  rev-parse`/`rev-list`; nothing here is a CDN, proxy, gateway, CRM, payments, or auth provider.** No
  mock is used, so no pair is owed.
- 🔑 credentials: none.
- 👉 manual steps: none — every case below is a deterministic fixture run through `sh` with `spawnSync`,
  matching the existing suite's own harness.

## Behaviors

### Happy path — spec-mandated (Done-when a–e)

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| P1a-01 | Small `STATE.md` (well under every threshold) | Emitted in full, byte-identical content present in stdout; Task Router line present. Regression carryover of the existing "emits STATE.md" test — same assertion, unchanged. | unit |
| P1a-02 | Real 5-section fixture ≥200 KB, LF line endings: `## Open failures`, `## General rules`, `## Last session`, plus `## Verified facts` and `## Lessons learned` elsewhere in the file | stdout contains a Last-commit line and the Open failures / General rules / Last session section bodies; stdout does **not** contain the Verified facts or Lessons learned section bodies; total stdout < 9 500 B | unit |
| P1a-03 | Same fixture as P1a-02, but the three trigger/optional heading lines end in `\r\n` (CRLF) | Byte-for-byte identical extraction outcome to P1a-02 (same sections in, same sections out) | unit |
| P1a-04 | Client-shape fixture: dated `#` blocks newest-first, `## Verified facts` / `## Open failure` (singular) repeated as sub-headings inside multiple blocks, no exact trigger heading anywhere, ≥200 KB | Head mode: stdout < 9 500 B, begins with the newest (topmost) block's content, contains a truncation line naming the file's real path and `.ai/archive/` | unit |
| P1a-05 | `STATE.md` > 20 000 B **and** `lessons.md` > 40 000 B in the same repo | stdout contains a size-warning line naming `STATE.md` and its byte count, **and** a separate size-warning line naming `lessons.md` and its byte count | unit |

### Happy path — added (named boundaries/partitions from the contract, not literally in Done-when)

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| P1a-06 | Both trigger headings present, `## General rules` **absent** | Section mode still triggers: Last-commit line + Open failures + Last session present; no crash, no phantom "General rules" text required | unit |
| P1a-07 | Section mode triggers, `Last-commit:` field present and **non-stale** (matches HEAD) | stdout still carries the section-mode Last-commit info line, independent of the (silent) staleness-warning mechanism, which stays silent since not stale | unit |
| P1a-25 | Section mode triggers (both required headings present), `STATE.md` has **no** `Last-commit:` field at all | No Last-commit line appears anywhere in stdout — silent, no placeholder (Q-3, resolved); no crash, section extraction proceeds normally | unit |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| P1a-08 | Only `## Open failures` present, `## Last session` absent | Falls to head mode (both headings required) | unit |
| P1a-09 | Only `## Last session` present, `## Open failures` absent | Falls to head mode (symmetric case) | unit |
| P1a-10 | Both trigger headings present, `## Open failures` body is empty (heading immediately followed by the next heading, zero content lines between) | Section mode still triggers; Open failures heading appears with an empty body; no crash, no content leaked in from an adjacent section | unit |
| P1a-11 | File contains only decoys: `## 🔴 Open failure — …` and `## Verified facts — wydanie`, no exact trigger heading anywhere | Head mode; decoy lines pass through verbatim as ordinary head content, not treated as section starts | unit |
| P1a-12 | `## Open failures (resolved 2026-09-01)` (trailing text) paired with a bare `## Last session` | The decorated line does not count as an exact match → mode falls to head (exactness boundary) | unit |
| P1a-13 | `STATE.md` does not exist at all | Hook exits 0; stdout has no section/head content from `STATE.md`; Task Router line still present (regression of current silent-`cat` behavior under the new code path) | unit |
| P1a-14 | `STATE.md` present and small, `lessons.md` does not exist | No lessons size-warning line appears (mirrors the existing `.env`-absent-is-silent pattern); exit 0 | unit |
| P1a-15 | Fixture engineered so the **unclipped** total output would be exactly 9 500 B | Output is truncated to strictly under 9 500 B, and the truncation notice itself is counted inside that budget | unit — **boundary named in brief; exact arithmetic per Q-1** |
| P1a-16 | Fixture engineered so the unclipped total is exactly 9 499 B | Emitted whole, no truncation line added (pairs with P1a-15 to prove the off-by-one lands on the correct side both ways) | unit |
| P1a-17 | `STATE.md` exactly 20 000 B | No size-warning line (boundary is the last compliant value per Q-6) | unit |
| P1a-18 | `STATE.md` exactly 20 001 B | Size-warning line appears, names the size | unit |
| P1a-19 | `lessons.md` exactly 40 000 B | No size-warning line | unit |
| P1a-20 | `lessons.md` exactly 40 001 B | Size-warning line appears, names the size | unit |
| P1a-21 | A single line inside `STATE.md`, in head mode (no exact trigger headings present), longer than the entire 9 500 B budget by itself | Q-2 resolved (a): **zero content lines** from `STATE.md` appear in stdout; the truncation notice (naming the path and `.ai/archive/`) is present; total stdout < 9 500 B; no split/invalid UTF-8 byte sequence | unit |
| P1a-22 | `STATE.md` with `## Open failures\r\n` (CRLF) and `## Last session\n` (LF) mixed in the same file | Section mode triggers on both regardless of which line ending each one uses; extraction unaffected by the mismatch | unit |
| P1a-23 | A multibyte UTF-8 character (e.g. `ą` or an emoji) placed exactly at the byte offset where a naive truncation would cut | Cut moves to before the character (or after it, whole), never through it; stdout contains no lone continuation byte and stays under budget | unit |
| P1a-24 | Stale `Last-commit:` (drift warning fires) **and** `STATE.md` > 20 000 B, five-section shape, together | stdout contains the drift WARNING, the size-warning, and the extracted sections, all three, and the combined stdout is still < 9 500 B (extraction is what shrinks, not the warnings) | unit |

### Regression carryover — must stay green, unmodified assertions (not new IDs)

The following six existing tests in `hooks-template.test.js` exercise the pre-P1a drift-check and
`.env` mechanisms, which this phase does not touch; they are load-bearing evidence the extraction
change does not regress them and must not be edited to reach green:
`session-start emits STATE.md and the Task Router pointer` (superseded in shape by P1a-01, same
intent), `ONE commit behind because STATE.md was just committed is SILENT`, `HEAD moved and STATE.md
was NOT touched → warning, with the distance`, `an unknown Last-commit sha is silent`, `a Last-commit
that AGREES with HEAD is silent`, `NO Last-commit field is silent`, `session-start never blocks`,
`session-start WARNS when the local .env carries production markers`, `a clean local .env is
SILENT`, `no .env at all is SILENT`.

---

## Detection proof — tier B, step 5 (run against implementation `54661c4`/`87b6250` base)

All nine mutants below were planted **one at a time in `session-start.sh` only**, run, reverted, and
`git diff -- skills/sailes-bootstrap/hooks-template/session-start.sh` confirmed empty before the
next. Final state: diff empty, `session-start-memory.test.js` 25/25 green,
`hooks-template.test.js` untouched and green (re-verified after every revert cycle, not just once
at the end).

| # | Mutant (lead's list) | Concrete change | IDs that went red | Verdict |
|---|---|---|---|---|
| 1 | Section detection matches a decoy (`## 🔴 Open failure — …`) | Line 206 `Open failures` gate loosened to `^## .*Open failure` | **P1a-12** only | detects — see finding below |
| 2 | `## Verified facts` emitted | Added a capture rule for `## Verified facts` to the awk block | **P1a-02, P1a-03** | detects |
| 3 | Budget off by one (`<= 9500`) | `MAX_BYTES=$BUDGET_TOTAL` instead of `$((BUDGET_TOTAL - 1))` | **P1a-15** | detects |
| 4 | Warnings not reserved, total exceeds budget | `mem_budget=$MAX_BYTES` (no `- tail_bytes`) | **P1a-15** | detects — see finding below |
| 5 | Size-warning threshold `>=` instead of `>` | `-gt 20000` → `-ge 20000` (also spot-checked lessons.md's `-gt 40000` → `-ge`) | **P1a-17** (STATE.md variant), **P1a-19** (lessons.md variant, spot-check) | detects |
| 6 | CRLF heading not recognised | `tr -d '\r' < "$STATE" > "$NORM"` → `cat "$STATE" > "$NORM"` | **none**, until strengthened — see finding below; after strengthening: **P1a-03, P1a-22** | detects (after fix) |
| 7 | Head mode splits mid-line (generic, any overflow line) | `head_cut` hard-cuts to `_hc_remaining` bytes instead of `break`-ing, on every overflow line | **P1a-21** (clean), **P1a-23** (coupled — see note) | detects |
| 8 | Q-2(a) replaced by a mid-line cut (narrow: only the very first line) | Same hard-cut, gated to `[ "$_hc_total" -eq 0 ]` only | **P1a-21** (clean), **P1a-23** (coupled — see note) | detects |
| 9 | `Last-commit` placeholder emitted when absent | `[ -z "$lastcommit_line" ] && lastcommit_line="Last-commit: unknown"` | **P1a-25** | detects |

**Findings — mutants that were not cleanly caught, and what changed as a result:**

- **#1 (decoy detection).** Only P1a-12 catches it, and by a different decoy than the one named
  (a decorated exact-prefix heading, not the emoji one). P1a-04 and P1a-11 — the fixtures that
  actually carry `## 🔴 Open failure — …` — structurally **cannot** observe this mutant on their own:
  both lack a real `## Last session` heading anywhere, so the `&&` gate stays false regardless of how
  loose the `Open failures` side is. This is not a suite defect to fix by adding a heading to those
  fixtures (that would turn them into a different, already-covered case); it is a **plan-level gap**:
  no frozen ID pairs the literal emoji decoy with a real second heading. Flagging for the human/lead
  rather than silently adding a 26th case outside the frozen list.
- **#4 (warnings not reserved).** Only P1a-15 catches it. I initially expected P1a-05 and P1a-24 to
  also react and added a universal-budget assertion to P1a-05 (kept — it is a real, always-true
  invariant per Q-1's resolution), but confirmed by direct debug run that P1a-05's fixture is a
  single unbroken line: `head_cut` always emits zero content lines regardless of correct or buggy
  `mem_budget` arithmetic, so the output is byte-identical either way. P1a-24 doesn't reach the
  truncation branch at all (its excluded Lessons-learned filler absorbs the size, its included
  sections are tiny). Both are legitimate non-catches, not defects — the credit for #4 belongs to
  P1a-15 alone, which uses a calibrated fixture that actually crosses the truncation-branch decision.
- **#6 (CRLF heading not recognised) — a real surviving mutant, now fixed.** Disabling the dedicated
  CR-normalization step (`tr -d '\r'`) was killed by **no test at all**. Root cause, confirmed with a
  bare `grep` probe: the heading anchor's own `[[:space:]]*$` tolerance already absorbs a trailing
  `\r` independently of the normalization step (POSIX `[:space:]` includes CR), and my body-marker
  substring checks (`.includes('OPEN_FAILURES_BODY_MARKER')`) don't notice a `\r` trailing the
  marker. **Strengthened P1a-03 and P1a-22** to additionally assert the extracted body does NOT
  contain `'OPEN_FAILURES_BODY_MARKER\r'` — the implementation's own comment states section-mode
  output is built from the CR-stripped copy, so a clean (no-`\r`) body is the correct, provable
  observable. Re-ran the mutant after strengthening: both IDs now redden. This is the one true
  `strengthen, don't fabricate` case step 5 exists to find.
- **#7 / #8 (mid-line splits) — P1a-23 rebuilt; its catch of these two is coupled, not independent.**
  Before this step, P1a-23 used a single unbroken line to place a multibyte character "at the cut
  point" — but Q-2(a) means a single-line-over-budget file always yields **zero** content lines
  regardless of where the character sits, so the fixture could never actually route a byte through a
  mid-line cut. Rebuilt it with a calibrated two-line fixture (line 1 sized to leave exactly the
  measured `cut_limit - 1` bytes of headroom, line 2 opening with the multibyte character) so a real
  mid-line hard-cut would slice its first byte. This now correctly reddens under #7 and #8 — but by
  inspecting the actual failure messages, its OWN calibration sub-step (a single first-line-overflow
  probe, structurally identical to P1a-21's fixture) trips first under both mutants, before the
  intended "no U+FFFD replacement character" assertion is even reached. So P1a-23's reaction to #7/#8
  is real (the test goes genuinely red, not a harness error) but **not independent signal** — P1a-21
  is the clean, on-topic catcher for both; P1a-23's is collateral from shared calibration machinery.
  Recorded here rather than claimed as two separate proofs.
- **#2, #3, #5, #9** were each killed cleanly, by exactly the ID the plan named for them, on the
  first attempt, with the failure message naming the mutated behavior directly.

**Checker finding folded in (same commit):** P1a-21 asserted `.ai/archive/` but never the file path,
though the frozen plan requires "naming the path AND `.ai/archive/`" (P1a-04 already checked the path
half). Added `assert.ok(r.stdout.includes('STATE.md'), ...)` to P1a-21 — strengthening toward the
already-frozen expectation, not a new one.

## Suite written — `skills/sailes-bootstrap/hooks-template/session-start-memory.test.js`

25 tests, one per frozen ID (P1a-01..P1a-25), run against base `87b6250` where `session-start.sh`
line 6 is still `cat "$STATE" 2>/dev/null` — no extraction, no truncation, no size-check exists.
`node skills/sailes-bootstrap/hooks-template/session-start-memory.test.js`:

```
  ok   P1a-01: small STATE.md, well under every threshold, is emitted in full
  FAIL P1a-02: real 5-section fixture >=200KB, LF headings — section mode extracts 3, excludes 2
       Verified facts leaked into stdout
  FAIL P1a-03: same 5-section fixture, CRLF headings — identical extraction outcome
       Verified facts leaked under CRLF
  FAIL P1a-04: client-shape fixture (dated blocks, decoys, no exact heading) — head mode, truncated
       stdout is 250268B, over the 9500B budget
  FAIL P1a-05: STATE.md >20000B AND lessons.md >40000B together — both size-warnings fire
       no size-warning names STATE.md and its byte count
  ok   P1a-06 · P1a-07 · P1a-25 · P1a-08 · P1a-09 · P1a-10 · P1a-11 · P1a-12 · P1a-13 · P1a-14
  FAIL P1a-15: unclipped total would be exactly 9500B — truncated to stay under budget
       stdout is 9500B — an unclipped-9500B fixture must still be truncated below budget
  ok   P1a-16 · P1a-17
  FAIL P1a-18: STATE.md exactly 20001B — size-warning fires, names the size
       no STATE.md size-warning at 20001B, one byte over the limit
  ok   P1a-19
  FAIL P1a-20: lessons.md exactly 40001B — size-warning fires, names the size
       no lessons.md size-warning at 40001B, one byte over the limit
  FAIL P1a-21: a single line longer than the whole budget — zero content lines, truncation notice only
       stdout is 15036B, over budget
  ok   P1a-22
  FAIL P1a-23: a multibyte UTF-8 char sitting at the would-be cut point — cut never splits it
       stdout is 13500B, over budget
  FAIL P1a-24: drift warning + STATE.md >20000B together — drift, size-warning and sections all present, under budget
       STATE.md size-warning missing alongside the drift warning

session-start-memory: 10 failing
```

**All 10 reds are behavioral, confirmed against the base hook's three-line reality (`cat`, drift-check,
`.env`-check — nothing else):**
- P1a-02, P1a-03 — no section extraction exists, so excluded sections leak (`cat` shows everything).
- P1a-04, P1a-15, P1a-21, P1a-23 — no truncation/byte-budget logic exists, so oversized output passes
  through unclipped.
- P1a-05, P1a-18, P1a-20, P1a-24 — no size-check exists, so no size-warning ever fires.

None are stack traces, `TypeError`s, or assertions on the wrong code path — every failure message is
one of this suite's own, naming the missing mechanism directly. The 15 greens are consistent with the
old `cat`-only hook by coincidence (e.g. P1a-06/07/08/09/10/11/12/13/14/16/17/19/22/25 don't happen to
exercise exclusion or a triggered threshold on their own fixture), not because any P1 logic is
present — confirmed by grepping `session-start.sh` for `# ---` section markers: only the pre-existing
drift-check and `.env`-check blocks exist, nothing for extraction, truncation, or size limits.
`hooks-template.test.js` (untouched) still passes in full — no regression on the pre-existing suite.

The lead's detection-proof (break each behavior's own code, red, revert, green) runs after the
implementation lands; this run is the pre-implementation baseline it will be compared against.
