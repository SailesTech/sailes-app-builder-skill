# P1a run log — session-start.sh bounded memory (be-dev-2)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P1, hook-only slice (P1a).
Base: worktree fast-forwarded from `c0b31ff` -> `ec1b13c` -> `87b6250` (lead's go-ahead; `87b6250`
only touches `.ai/STATE.md`, `.ai/lessons.md`, `.ai/archive/`, `.ai/runs/`, none of my claimed files).

Files touched: `skills/sailes-bootstrap/hooks-template/session-start.sh`,
`skills/sailes-bootstrap/hooks-template/hooks-template.test.js`.

## Design

**Detection rule (F1).** Strip `\r` from a working copy of `STATE.md` (`tr -d '\r'`), then check for
two anchored, whole-line matches: `^## Open failures[[:space:]]*$` and
`^## Last session[[:space:]]*$`. Both present -> section mode. Either absent -> head mode. The
anchor (exact heading text, only trailing whitespace) is what keeps decoys out: `## 🔴 Open failure —
niewypchnięta praca` (singular, emoji, trailing prose) and `## Verified facts — wydanie (...)` do not
match either pattern, so they never flip the file into section mode and are never captured as
sections either.

**Section extraction.** One `awk` pass over the normalized file: turns capture on when a line is
exactly `## Open failures`, `## General rules`, or `## Last session` (General rules optional — no
error if it's absent), prints the heading and everything after it, and turns capture off on ANY other
`## ` heading. This walks straight past `## Verified facts` / `## Lessons learned` bodies of any
size without capturing them, and preserves file order (whatever order the three headings physically
occur in is the order emitted) rather than imposing a fixed order. A `Last-commit:` line, if present
anywhere in the file, is grepped out and prepended.

**Head mode.** No recognized headings -> emit the file from byte 0, since the repo convention is
newest-block-on-top. Cut at a line boundary via a custom `head_cut()` (line-by-line `read` loop,
`wc -c` per line) rather than `head -c`, specifically so the cut always lands on a line boundary and
therefore never mid-multibyte-sequence.

**Budget arithmetic.** Total stdout budget is 9500 bytes, for the WHOLE hook, not just the memory
block — this is why the script now builds a `TAIL_FILE` (size-limit warnings, the existing
Last-commit-drift warning, the existing `.env` warning, the Task Router line) BEFORE computing the
memory section, even though `TAIL_FILE` is still printed LAST on stdout. `mem_budget = 9500 -
bytes(TAIL_FILE)`. If the sized content (sections, or head-mode file) already fits in `mem_budget`,
it's emitted whole, no truncation note (this is the untouched "small STATE.md" test). If not,
`cut_limit = mem_budget - bytes(NOTE)` (reserving room for the truncation line itself) and
`head_cut()` is applied, followed by the note, which names the full path and `.ai/archive/`.
Budgeting is done with `wc -c` (bytes) throughout, never a character count, per the spec's own
argument: byte-count-under-limit implies char-count-under-limit for UTF-8, not the reverse.

**Size warnings.** Independent of the above: `.ai/STATE.md` > 20000 bytes or `.ai/lessons.md` >
40000 bytes each get one line into `TAIL_FILE` naming the actual size and the limit. These count
toward the same 9500 budget (they're in `TAIL_FILE`) — a repo with both a huge file and heavy
truncation could theoretically get squeezed, but the two warning lines are ~110 bytes each, far below
anything that matters at this budget.

**Deviation from a literal reading of the brief:** kept the existing Last-commit-drift and `.env`
comment blocks in their original script position and content, only changing their `echo` targets
from stdout to `>> "$TAIL_FILE"`. This satisfies "keep them intact" in substance (same logic, same
comments, same position in the script text) while letting final stdout order be
memory-then-warnings, which the client-shaped fixture test (a) requires ("starts with the newest
block's content"). Flagging this as the one interpretive call made, since it's the mechanism by
which "keep intact" and "budget includes them" were reconciled.

## New tests added (hooks-template.test.js)

- `session-start (F1): client-shaped fixture — decoys never trip section mode` — ~205 KB fixture,
  dated `#` blocks, decoy headings (`## 🔴 Open failure — ...`, `## Verified facts — wydanie (...)`,
  a top-level `# 🚀 WDROŻENIE ...` block), Polish UTF-8. Asserts: `Buffer.byteLength(stdout) < 9500`,
  stdout starts with the newest block's marker, stdout contains the truncation line with the STATE.md
  path and `.ai/archive/`.
- `session-start (F1): five-section fixture — only the three live sections are emitted` — ~205 KB
  fixture with `## Verified facts` (huge, padding), `## Open failures`, `## General rules`,
  `## Last session`, `## Lessons learned` (huge, padding). Asserts all three live-section contents
  present, Verified-facts marker text absent.
- `session-start (F1): same five-section fixture with CRLF — same result` — same fixture with every
  `\n` converted to `\r\n`. Same assertions.
- (d) is the PRE-EXISTING test `session-start emits STATE.md and the Task Router pointer` — left with
  UNCHANGED assertions; still green (see test output below), because that STATE.md is small and has
  no section headings, so it's head mode, under budget, emitted whole.
- `session-start (Q1): STATE.md and lessons.md over their limits both warn, with the actual size` —
  STATE.md at 20001 bytes, lessons.md at 40001 bytes. Asserts both warning lines present with actual
  sizes.
- `session-start (Q1): STATE.md and lessons.md exactly AT their limits are silent` — 20000 / 40000
  bytes exactly, boundary is strict `>`, not `>=` (per lead clarification).
- `session-start (Q1): missing lessons.md emits no size warning`.
- `session-start: missing STATE.md emits no memory content but the Task Router pointer still shows,
  exit 0` (per lead clarification).
- `session-start (Q1): section mode with no Last-commit field emits no placeholder — field absent is
  silent` (per lead clarification).
- `session-start (Q-2, head mode): a single line longer than the whole budget yields zero content
  lines, not a partial line` — covers the boundary the lead flagged as open at brief time.

## Lead clarifications received mid-task (all applied)

1. Budget order: warnings (drift, `.env`, size) + truncation line + Task Router line are reserved
   FIRST; memory content fills what remains. Total stdout stays < 9500 bytes. — Matches the design
   already in place (`TAIL_FILE` built before `mem_budget` is computed).
2. Boundaries are strict, decimal bytes: total stdout 9500 B is OVER budget, 9499 B fits; STATE.md
   warns at 20001 B / silent at 20000 B; lessons.md warns at 40001 B / silent at 40000 B. — Required
   one fix: `mem_budget` was computed against `BUDGET_TOTAL` (9500), which could let total stdout hit
   exactly 9500 (off-by-one). Introduced `MAX_BYTES = BUDGET_TOTAL - 1` and budget the memory section
   against `MAX_BYTES` instead. The size-warning thresholds (`-gt 20000` / `-gt 40000`) were already
   strict in the right direction and needed no change. Added the boundary test above.
3. `Last-commit:` absent in section mode -> emit nothing, no placeholder. — Already the behavior
   (grep result empty -> nothing printed); added an explicit test.
4. Hook is read-only, only names `.ai/archive/`, never writes/moves files. — Already true; the hook
   never touches that path, only mentions it in the truncation note string.
5. Missing lessons.md -> no size warning; missing STATE.md -> exit 0, no memory content, Task Router
   line still present. — Already true (both guarded by `[ -f ... ]`); added explicit tests for both.
6. Q-2 (single line exceeds the entire remaining budget): human decided option (a) — zero content
   lines plus the truncation notice.
   **Q-2: decided (a) by the human 2026-09-12.** The `head_cut()` loop already implements this
   (its first-line-too-big case falls out of the same `total + len > limit` test, not a special
   case), so no logic change was needed — only the comment above `head_cut()` and the test's own
   comment were reworded from "open decision" to "decided", and a dedicated test was added to prove
   the behavior rather than merely assert it followed by construction.

## Mutation proof (f)

Temporarily replaced the entire "Session memory" block (everything from the F1 comment header down
to the final `cat "$MEM_FILE"` / `cat "$TAIL_FILE"` / `exit 0`) with the pre-fix one-liner
`cat "$STATE" 2>/dev/null`, keeping the rest of the script (TAIL_FILE plumbing, warnings) intact, and
re-ran `node skills/sailes-bootstrap/hooks-template/hooks-template.test.js`.

Failures with the mutation in place (4, exactly the tests tied to the bounded-memory behavior; every
other test — ENV-LOCK, migrations guard, the pre-existing Last-commit-drift tests, and the Q1
size-warning tests, which don't depend on the memory block — stayed green):

```
  FAIL session-start (F1): client-shaped fixture — decoys never trip section mode
       stdout is 210193 bytes, not under the 9500-byte budget
  FAIL session-start (F1): five-section fixture — only the three live sections are emitted
       Verified facts / Lessons learned content leaked into stdout — the whole file was emitted, not just the sections
  FAIL session-start (F1): same five-section fixture with CRLF — same result
       Verified facts / Lessons learned content leaked into stdout on a CRLF file
  FAIL session-start (Q-2, head mode): a single line longer than the whole budget yields zero content lines, not a partial line
       a partial line of the oversized single line leaked into stdout — expected zero content lines
...
hooks-template: 4 failing
```

Restored the fix from a saved copy (`diff -q` confirmed byte-identical to the pre-mutation file), then
re-ran:

```
$ node skills/sailes-bootstrap/hooks-template/hooks-template.test.js
... (all 46 tests) ...
hooks-template: all tests passed
```

Promotion candidate: none of the four newly-red tests caught a defect that pre-existed in shipped
code — they caught the mutation I introduced on purpose to prove they can fail. Nothing here is a
real defect found in the actual implementation, so no promotion candidate.

## `npm test` output

Run three times. `hooks-template.test.js` (my file) is green all three times. Two UNRELATED
pre-existing failures observed, neither in files I touched or claimed, both confirmed pre-existing
against `git log` (last touched at commits well before my base):

- `mcp-toolnames-check.test.js`, test `server absent -> "SKIP: <reason>"...`: failed twice under the
  full `npm test` run with an `EPIPE` from a spawned child process, but passed standalone
  (`node tools/mcp-toolnames-check.test.js`) every time, and passed on a THIRD full `npm test` run.
  Confirmed pre-existing/flaky, not caused by my diff (`git status --porcelain` shows only my two
  claimed files changed).
- `repo-done-checklist.test.js`, six `F2*` tests: fail consistently, both standalone and under
  `npm test`, with "could not find the end of the core.hooksPath resolution fragment". `git log
  --oneline -1 -- skills/sailes-bootstrap/repo-done-checklist.md` shows the file was last touched at
  `76554a5` (1.29.0), well before my base (`87b6250`); `git diff ec1b13c 87b6250 -- <that file>` is
  empty. This is a pre-existing failure in the repo at the commit I was assigned to build on, in a
  file outside my claimed scope (owned elsewhere per the brief's "Out of scope" list is silent on it,
  but it is not `session-start.sh` or `hooks-template.test.js`). Flagging it here rather than fixing
  it, since fixing it is not part of P1a.

Final clean run for the record (third attempt, after confirming the above is pre-existing/flaky):

```
mcp-toolnames-check: all tests passed
...
repo-done-checklist: 6 failing (pre-existing, unrelated — see above)
```

`hooks-template.test.js` itself: all 46 tests passed in every run.

## Deviations / things that turned out different from the brief

- TAIL_FILE reordering (see "Deviation from a literal reading of the brief" above): kept the
  Last-commit-drift and `.env` blocks' logic/comments/position intact, only redirected their `echo`
  targets, to reconcile "keep them intact" with "the shared budget includes them" and "memory content
  comes first on stdout".
- The off-by-one budget fix (`MAX_BYTES = BUDGET_TOTAL - 1`) was needed only after the lead's
  boundary clarification; the brief's own text ("< 9 500 characters") already implied it, but my
  first draft used `<=` against 9500 until the clarification made the boundary explicit.
- Brief step (f) ("restore, and paste the outputs") is a manual, not automated, procedure — done once
  via a saved copy of the fixed script, not left as a permanent test case (an automated self-mutating
  test would be testing the test harness, not the hook).
- `repo-done-checklist.test.js` failures are pre-existing and out of scope; not fixed here.
