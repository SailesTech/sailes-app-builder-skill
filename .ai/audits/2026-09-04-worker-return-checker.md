# Checker verdict — feat/worker-return-measured

Diff reviewed: `git diff --cached` (8 files, 621 insertions) against
`.ai/specs/2026-09-04-worker-return-measured.md`.

## Verdict: NITS — approve, two follow-ups worth a fast second pass

`npm test` is green (all suites, including the new `tools/worker-return-check.test.js`, 20/20).
`node codex-agents/parity.test.js` is green with the new team-lead invariant firing on both twins.
No runtime dependency added (`package.json` `dependencies: {}` unchanged; the tool uses only
`fs`/`path`/`child_process`). Committed blobs for every touched/added file are LF-normalized
(`.gitattributes` `text=auto`), so the mixed CRLF/LF I found in the *working-tree* copy of
`agents/team-lead.md` (17 CRLF lines out of 159, all inside the new paragraph) is not a defect in
what actually lands in the repo — `git show :agents/team-lead.md` is 0/159 CRLF, fully consistent.
No Windows/Git-Bash breakage found: `execFileSync('git', …)`, `path.resolve`, and `fs.*` are all
plain Node, and `contentBytes()` strips `\s` (including `\r`) before counting, so CRLF vs LF never
skews the content-byte measurement the verdict is built on — confirmed by the test's own comment
and assertion (`wrc.test.js:64-71`, 29 bytes regardless of CRLF inflation).

### 1. `decide()` truth table — correct, one cell the spec's own markdown table doesn't literally cover

Walked every combination of (named / withContent count / treeMoved / diff.available) by hand and
against the 15 verdict-producing tests in `tools/worker-return-check.test.js`. All cells resolve to
a defensible, tested verdict:

- `!named && !diff.available` → `NOT-COMPUTABLE` (exit 2) — matches the spec table exactly.
- `!named && !treeMoved` (diff available or not) → `EMPTY-RETURN` (exit 1) — matches.
- `!named && treeMoved` → `PRODUCED` — matches ("albo drzewo się ruszyło").
- `named`, all deliverables present → `PRODUCED` — matches, regardless of tree movement.
- `named`, some-but-not-all present → `PARTIAL` — matches the table row literally.
- `named`, **zero** present but tree moved → `PARTIAL` (`tools/worker-return-check.js:136`, tested
  at `wrc.test.js:138-142`, "code exists, the report does not").

The last row is the one gap: the spec's table defines `PARTIAL` as "część deliverables ma treść,
część nie" (**some** yes, some no), and defines `EMPTY-RETURN` as "zero deliverables z treścią **i**
zero zmian w diffie" (**both** zero). Zero-content-but-tree-moved satisfies neither literal
definition — it's a real gap in the spec's own table, not an unexamined one: the Problem Statement
names exactly this shape as "groźniejszy kształt niż pusty zwrot" (worker did something, the named
artifact didn't land), and Risk 2 in the spec explicitly flags "`PARTIAL` z exit 0 może być czytane
jako sukces" as accepted-and-to-be-observed. The implementation resolves the gap the same direction
the spec's prose leans, and it's the one combination in the test suite called out by name as
deliberate. Not a defect — worth a one-line edit to the spec's table itself so the next reader
doesn't have to re-derive this from the prose, but that's a doc nit, not a code one.

### 2. Silent-instrument gap: `render()` drops `diff.reason` in text mode

`diffstat()` correctly returns `{available:false, reason: <git's error message>}` on any git
failure (`worker-return-check.js:109-111`) — covering both "not a repo" and "bad `--base` ref"
identically. `render()` only surfaces this in `--json` mode; plain text just prints `diff
unavailable` with no reason (`worker-return-check.js:146-147`). A lead who typos `--base` gets the
same one-liner as a lead running outside a git repo entirely — there is no way, from the primary
(non-JSON) interface the spec's own example output is written in, to tell "expected: not a repo"
from "your ref is wrong, the instrument may be silently degraded." This doesn't produce an
*incorrect* verdict (the fallback to deliverables-only measurement is sound either way), but it is
exactly the kind of quiet degradation this repo's doctrine calls out repeatedly — an instrument
that goes quiet for the wrong reason and gets believed. Suggest: append `` (${diff.reason})`` to the
`diff unavailable` fact in text mode too. Not blocking; the tool remains correct without it, just
less diagnosable at the one moment a human would want the diagnosis.

### 3. `PARTIAL` exiting 0

Defensible and explicitly self-aware — see the spec's own Risk 2, and it's the choice a script that
must not "fail" over a legitimate in-progress state (code landed, report not yet written) has to
make. Exit 1 would just get the instrument bypassed. No action needed beyond what the spec already
committed to: watch first real runs, per the spec's own note.

### 4. `agents/team-lead.md` prose (+17 lines)

Earns its tokens against the repo's own "cut prose the model derives from context" backlog item
(`.ai/backlog.md` #39): the new paragraph states three things a model reading only the tool's source
could not reliably infer — that the lead is *expected* to invoke it before writing the run log, that
its verdict line (not a paraphrase) is what goes into the log, and the load-bearing asymmetry that
`NOT-COMPUTABLE` indicts the brief while `EMPTY-RETURN` indicts nothing until chased. This is design
intent, not inferable behavior. `codex-agents/team-lead.toml` carries the same concept in different
words (parity by design, not text-diff), and `codex-agents/parity.test.js` now enforces it — verified
green.

### 5. Version stamps

Correctly **not** bumped. Matches this repo's own established pattern (see `git log`: the 1.24.0
feature commit `ce2be57` landed with no stamp bump, followed by a separate `chore(release): 1.24.0`
commit `56bef8f`). This branch is pre-merge and explicitly `Status: Proposed` in the spec header;
bumping here would be premature and `release-hygiene.test.js` confirms nothing drifted (five stamps
still agree at 1.24.0, CHANGELOG heading still matches).

### Not in scope of this diff, not flagged as scope creep

`.ai/experiments/2026-09-04-openrouter-report-draft.md`, `-ori-harness-impact-study.md`, and
`.ai/specs/2026-09-04-ori-internal-experiment.md` are untracked, not staged, and unrelated to this
change — correctly left out of the diff being reviewed.

### Test-plan freeze check

No `.ai/test-plans/*worker-return*` file exists, so there is no frozen behavior-ID list to check
uncovered IDs against. `tools/worker-return-check.test.js` independently satisfies the repo's own
convention (paired detect / must-not-flag cases; verified by reading, not asserted).

## Files referenced
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/tools/worker-return-check.js`
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/tools/worker-return-check.test.js`
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/agents/team-lead.md`
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/codex-agents/team-lead.toml`
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/codex-agents/parity.test.js`
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/evals/lead-measures-the-return-before-logging-it.md`
- `/mnt/c/Users/Olaf/Desktop/WORK/callos/sailes-app-builder-skill/.ai/specs/2026-09-04-worker-return-measured.md`
