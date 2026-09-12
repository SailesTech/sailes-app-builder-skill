# Test plan — token cost of running, P1a (`session-start.sh`)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P1 (Q1, F1, F2, F3) — hook part only.
Files under test: `skills/sailes-bootstrap/hooks-template/session-start.sh` (new extraction logic,
not yet written at base `ec1b13c`) · `skills/sailes-bootstrap/hooks-template/hooks-template.test.js`
(existing suite, must not regress).
Risk tier: **B** (raised from C — reason below)
Status: DRAFT
Frozen: — (pending human)

> `DRAFT` means no test may be written yet. The human moves it to `FROZEN`.

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

❓ **Q-2 — single line longer than the whole budget (P1a-21).** Head mode "cuts at a line boundary"
per the brief; the byte budget ("stays < 9 500", "never splits UTF-8") is stated as inviolable. These
conflict when the very first line alone exceeds 9 500 B. Three readings: (a) emit zero content lines
plus the truncation notice, (b) hard-cut mid-line at a UTF-8-safe boundary, breaking "line boundary"
only in this one pathological case, (c) something else not stated. I've written P1a-21 to assert only
the invariant that's unambiguous (stdout stays under budget, no split UTF-8 byte) and left the
content-shape assertion UNVERIFIED pending this answer.

❓ **Q-3 — `Last-commit:` absent in a section-mode file.** The contract says section mode "emits
Last-commit line + those sections" as if unconditional, but `Last-commit:` could be missing even when
both trigger headings are present (a repo that adopted the 5-section shape before the drift-check
convention existed). Omit the line silently (matching the existing drift-check's "field absent →
silence" precedent), or emit some placeholder? Needed for P1a-07's negative variant.

❓ **Q-4 — literal text vs. substring for the notice lines.** Must the truncation line and the two
size-warning lines match a frozen literal string, or is "contains the path + `.ai/archive/`" /
"contains the byte count" (regex/substring, the existing suite's own style — `/WARNING/`,
`/PRODUCTION markers/`) sufficient? I've written every case below as substring/regex, which leaves
wording free for the implementer; say so explicitly if literal text should be frozen instead.

❓ **Q-5 — does the hook WRITE to `.ai/archive/`, or only NAME it?** Q1/F3's retrieval model is
`grep` on demand against an archive that some other process (Upgrade mode, a human) populates. P1's
own file list for this phase does not include an archive-writer. I've assumed `session-start.sh` is
read-only and only prints a pointer line naming the archive path — it does not itself move overflow
content to disk. If that's wrong, P1a-04 needs an added filesystem assertion (the excess content
actually lands at the named path), not just a stdout check.

❓ **Q-6 — `>` vs `≥` at the three named boundaries.** I've read "STATE.md ≤ 20 KB" / "lessons.md ≤
40 KB" / "stays < 9 500" as: exactly-at-the-limit is the last **silent** value, one byte over is the
first **warned/truncated** value. That reading drives every paired boundary case below (P1a-15/16,
17/18, 19/20). Please confirm — the alternative (warn *at* the limit, not just past it) flips four
expected outcomes.

❓ **Q-7 — 1000-based or 1024-based "KB".** The task brief gives exact decimal figures (9500, 20000,
40000) which I've taken as literal byte counts, not `9500*1.024` etc. Flagging since the spec prose
itself says "KB" throughout.

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
| P1a-07 | Section mode triggers, `Last-commit:` field present and **non-stale** (matches HEAD) | stdout still carries the section-mode Last-commit info line, independent of the (silent) staleness-warning mechanism, which stays silent since not stale | unit — **depends on Q-3 for the negative variant, not this one** |

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
| P1a-21 | A single line inside `STATE.md`, in head mode, longer than the entire 9 500 B budget by itself | Unambiguous part only: total stdout stays under budget and contains no split/invalid UTF-8 byte sequence. Content-shape part UNVERIFIED pending Q-2. | unit |
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

## Detection proof (filled at step 5, after the suite exists)

| ID | Mutation applied | Test went red | Reverted, suite green | Verdict |
|---|---|---|---|---|
| P1a-02, P1a-04 | Done-when (f), spec-mandated: restore `cat "$STATE"` in place of the extraction logic | pending | pending | pending |
| P1a-06 | Remove the "General rules optional" branch (require all three headings) | pending | pending | pending |
| P1a-08 / P1a-09 | Change the AND to an OR in mode selection (either heading alone triggers section mode) | pending | pending | pending |
| P1a-11 / P1a-12 | Loosen heading match to a substring/prefix test instead of exact-line match | pending | pending | pending |
| P1a-15–P1a-20 | Off-by-one the comparison operator at each boundary (`>` ↔ `>=`) | pending | pending | pending |
| P1a-23 | Replace the UTF-8-safe cut with a raw byte-offset `cut -c`/`head -c` truncation | pending | pending | pending |

> This table is structurally present per the template but intentionally unfilled — the suite does
> not exist yet in this assignment (Step 1 only). It records the mutation each case is *designed* to
> catch, for the human to review before freeze; the red/green columns are completed when the suite is
> written and run (next assignment).
