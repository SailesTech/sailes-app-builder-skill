# Adversarial audit — `2026-09-04-worker-return-measured` (branch `feat/worker-return-measured`)

Method: refute first. Every verdict below rests on a file:line quote or on a command re-run in a
throwaway git repo against `tools/worker-return-check.js` at the tip of this branch. Where I could
not establish something, it says so instead of guessing.

**The artifact moved during this audit.** A `checker` pass landed
(`.ai/audits/2026-09-04-worker-return-checker.md`, verdict **NITS**), after which `render()` gained
`firstLine(diff.reason)`, the suite went 20 → 22 assertions, and `spec:70` was amended to document
the 0-of-N `PARTIAL` case. Everything below was **re-verified against the post-checker working tree**;
`decide()` is byte-identical and all four reproduced defects still reproduce. Where the checker pass
overtook a finding of mine, it says so inline.

Scoreboard: **C1 SURVIVES · C2 SURVIVES (conclusion partly refuted) · C3 REFUTED · C4 SURVIVES
(narrowed) · C5 REFUTED · C6 UNRESOLVED — a decision, laid out at the end.**

---

## C1 — "the framework has the RULE but no MEASUREMENT"

**Verdict: SURVIVES.**

### Evidence

Every candidate instrument measures a different subject:

- `evals/harness/eval-status.js:16-20` — verdicts `FRESH / STALE / DIRTY / NEVER-RUN / NO-FILES`.
  Subject is *an eval file's staleness against `git log`*, not a delegation's output. Its own
  header (`:8-10`) states the question: "is this green result still true?"
- `hooks/lib/repo-state.js:3-14` — "Shared repo-state reading for the SessionStart hooks… what is
  this repo, and what is in flight here?" It enumerates active specs (`:73-84`) and open incidents
  (`:90-112`). There is no concept of a worker, a brief, or a return anywhere in the file.
- `skills/sailes-bootstrap/repo-done-checklist.md:42` — `[ -e "$ROOT/$f" ] && echo "OK   $f"`.
  Subject is bootstrap scaffolding, not delegation.
- `release-hygiene.test.js:5-17` — five version stamps and CHANGELOG headings. No overlap.

Repo-wide grep for a producedNothing-equivalent (`empty return`, `producedNothing`, `numstat`,
`non-whitespace`) returns **prose only** — `AGENTS.md:148`, `.ai/lessons.md:159,230,242`, and
transcripts under `.ai/eval-runs/`. No executable measures whether a delegation produced anything.
The spec's claim is accurate and this change is not duplication.

### What follows

One thing the spec should have caught and did not. `repo-done-checklist.md:42` is a second
instrument in this repo with **exactly the defect the spec was written to fix** — it tests `-e`,
existence, so a mandatory artifact created and left empty reports `OK`. The spec's own words
(`tools/worker-return-check.js:37-38`): *"a file created and left at zero bytes satisfies the letter
of that and none of its meaning."* That sentence indicts the checklist as much as the lead. The
finding is not in the spec, not in Non-Goals, not in `.ai/backlog.md`. A PR whose thesis is
"existence is not content" leaves the repo's other existence-checker untouched and unmentioned.

---

## C2 — "`SubagentStop` is documented today, so the eval's premise is stale"

**Verdict: SURVIVES on the fact. The conclusion drawn from it is half-refuted.**

### The fact

Confirmed against `https://code.claude.com/docs/en/hooks.md` (docs lookup this session; **no hook was
executed and no real stdin JSON was observed** — the same epistemic status the spec declares for
itself at `:47-48`, and it should stay labelled that way):

- `SubagentStart` — "When a subagent is spawned". Fields include `agent_id`, `agent_type`,
  `transcript_path`. **`last_assistant_message` is not present on this event.**
- `SubagentStop` — "When a subagent finishes". Fields include `agent_id`, `agent_type`,
  `transcript_path`, `last_assistant_message`.
- `matcher` on `agent_type` is supported on both — exact, pipe-separated, and regex
  (`^my-plugin:.*`).

The spec (`:44-45`) attributes all four fields to "the event" without splitting the two. Minor, but
if a hook is ever built off this paragraph, `last_assistant_message` on `SubagentStart` is a field
that does not exist. Fix the sentence.

So `evals/lead-chases-an-empty-worker-return.md:29-31` — *"**No mechanical backstop exists**: no
hook observes a subagent completing (verified 2026-07-18 against the hook event surface)"* — is
stale. The spec is right.

### Where the PR then goes wrong

**It ships the stale claim three times, twice as evidence.** `git diff --cached --stat` does not
list `evals/lead-chases-an-empty-worker-return.md`; the false sentence stays on disk unchanged. It
is then quoted verbatim as the authority for the new eval's *Failure looks like* section
(`evals/lead-measures-the-return-before-logging-it.md:31-35`) and a third time in the shipped source
header (`tools/worker-return-check.js:11-13`). A commit that discovers a load-bearing fact is false
and re-publishes it twice more as its own justification is doing the opposite of what
`AGENTS.md:15` asks ("done means verified, not asserted").

**Cost (a) for holding the hook back is refuted inside this repo.** The spec (`:109-111`) says a
hook "zmienia zachowanie **w każdym repo na maszynie**" and cites `.ai/backlog.md:15`, where a hook
was parked on that ground on 2026-07-20. But the repo solved that problem afterwards and the fix is
one line: `hooks/workflow-router.js:71` — `if (!isSailesRepo(root)) return;` — over
`hooks/lib/repo-state.js:65-67`: *"A repo has opted into the workflow by carrying either artifact;
neither → do not govern it."* Both shipped SessionStart hooks already run in every repo on every
machine and degrade to silence outside Sailes repos. The blast-radius objection is a 2026-07-20 fact
being reused in 2026-09-04, the same species of error the spec correctly identifies in the eval.

**Cost (c) is real and is the only one that survives.** `SubagentStop` carries `transcript_path` and
`last_assistant_message`; it does not carry the brief, so it cannot know which file was the
deliverable. Hook and script measure different quantities. That alone justifies not folding the hook
into this PR — but it justifies a *separate spec with a scheduled date*, not an Open Question resting
on a cost the repo already engineered away.

**Not established:** whether a `SubagentStop` hook could recover the deliverable path by other means
(reading the run log, an env marker set at spawn, parsing `transcript_path`). I did not test it and
will not assert it either way.

---

## C3 — "a budget per role cannot be implemented because the `Agent` tool accepts neither"

**Verdict: REFUTED.**

### The narrow sentence is true

The `Agent` tool schema available in this session exposes `description`, `prompt`, `subagent_type`,
`model`, `isolation`. No timeout, no tool-call cap. The spec's literal sentence about the tool holds.

### The Non-Goal built on it does not

The spec calls the item **"Budżet per rola"** (`:132`) — per *role*. Per-role configuration in this
framework does not live on the `Agent` tool at all; it lives in subagent frontmatter, which is where
every one of `agents/*.md` already pins `model`, `effort` and `tools`. And this repo's own test file
enumerates what that frontmatter accepts:

> `agents/validate-frontmatter.test.js:34-38`
> ```
> /** Fields Claude Code accepts in subagent frontmatter (docs, 2026-07-26, v2.1.220). */
> const KNOWN_FIELDS = new Set([
>   'name', 'description', 'tools', 'disallowedTools', 'model', 'effort', 'permissionMode',
>   'mcpServers', 'hooks', 'maxTurns', 'skills', 'initialPrompt', 'memory', 'background',
>   'isolation', 'color',
> ]);
> ```

**`maxTurns`.** Documented as "Maximum agentic turns before stopping", enforced by the harness, set
per role. It is also already recorded in this repo at
`.ai/specs/implemented/2026-07-26-measurement-routing-and-subteams.md:109`. The claim that a per-role
budget has no mechanism is refuted by a file committed to this repo six weeks before the spec was
written, in the same directory the PR edits.

A second enforcement path exists too, and `agents/team-lead.md:88` — a line inside the very file
this PR modifies — already names it: *"`TaskStop` is a fallback for runtimes that have it, not the
operative path."* The `TaskStop` schema confirms it accepts a teammate agent id or bare name. A lead
can therefore arm a deadline (`Monitor`, or `Bash run_in_background` with an `until` loop) and
terminate on expiry. Effectful, available today, no new tool required.

### What is genuinely unavailable

Wall-clock per-subagent timeout and a tool-call cap. The docs are explicit: *"No wall-clock time
limit: `maxTurns` bounds agentic turns, not elapsed time… No tool-call limit."*
`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` bound concurrency
and depth, not time or calls. So Limen's *exact* 90 min / 900 tool-calls is not reproducible — but
that is a different sentence from the one the spec wrote.

### What follows

The Non-Goal is stated as *"NIE, i to jest ustalenie, nie odłożenie"* — a settled finding. It is a
settled finding built on a false premise, which is the most expensive kind: nobody re-checks a
closed question. Rewrite it as: *a wall-clock and tool-call budget has no mechanism; a per-role
**turn** budget does (`maxTurns`) and we decline it because…*

And there is a good reason available, which the spec did not use: a turn cap truncates a worker
mid-flight, and this repo has already measured that the final-message channel drops reports
(`.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md:36-40` — four workers went idle carrying
nothing, all four had finished). A budget enforced by truncation manufactures the empty return this
PR exists to detect. That argument is stronger than the one shipped and it is factually true.

Separately: the spec says the budget goes *"Do backlogu z tym uzasadnieniem"* (`:137`). The staged
diff does not touch `.ai/backlog.md`. The deferral is deferred to nowhere.

---

## C4 — "a job-state directory would duplicate `.ai/STATE.md` and `.ai/runs/`"

**Verdict: SURVIVES, narrowed to `.ai/runs/`. The `STATE.md` half is wrong, and the reasoning has a
hole the spec does not see.**

### `.ai/runs/` really does carry per-delegation state — this is not a wave

- `agents/team-lead.md:32` — *"**Run log.** Record per task: who was spawned, what they returned,
  the gate verdict, whether they were released."*
- `skills/sailes-bootstrap/agent-team-structure.md:260` — *"After a context reset the lead
  reconstructs **which agents are still active** from the run log instead of re-deriving it — and
  releases any orphaned ones."* That is Limen's job-directory function stated as doctrine.
- `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md:16-26` is a literal ledger:
  `| Worker | Brief | Delivered? | Released | Notes |`, six rows, including two workers recorded as
  `**empty ×2**`.

The resemblance is real. A `.ai/jobs/<id>/` directory would be a third carrier of the same facts.

### `.ai/STATE.md` does not

Its own header (`:1-6`) and `repo-done-checklist.md:33` define it as session memory — Verified facts
/ General rules / Open failures / Lessons learned / Last session. Nothing per-delegation. Bundling it
into the Non-Goal overstates the duplication by one artifact; strike it from the sentence.

### The hole

The run log is **prose the lead writes**. This PR's entire premise is that the lead's narrative is
the untrustworthy artifact (`spec:32-34`: *"Dowodem, na którym opiera się dziś lead, jest wiadomość
workera"* — and the run log is the lead's re-telling of it). The doctrine this PR adds then deposits
the measurement into that same narrative: `agents/team-lead.md:102-103`, *"paste its line into the
run log."* Nothing verifies the pasted line matches what the tool printed, or that the tool ran at
all. So the Non-Goal is correct about duplication and silent about the fact that the surviving
carrier is the one the PR distrusts. A machine-written job record is the one thing that would fix
that — it is rejected here on a duplication argument that does not address it.

---

## C5 — the instrument's own design

**Verdict: REFUTED.** Four reproduced defects, three of them in the exact shape the spec set out to
catch. All runs below are against `tools/worker-return-check.js` at branch tip, in a throwaway git
repo with one commit.

### 1. FALSE `EMPTY-RETURN` on real work — untracked files are invisible

A worker creates a genuine new artifact with content; no `--deliverable` given:

```
EMPTY-RETURN · explorer:auth · diff 0f +0/-0 · deliverables 0/0
  chase the worker once, explicitly; do not record this as "found nothing"
exit=1
```

Cause: `tools/worker-return-check.js:105` — `['diff', '--numstat', 'HEAD']`. `git diff` **never sees
untracked files**. Every new artifact a worker produces is untracked until the lead stages it, and
`.ai/findings/*.md` — the deliverable shape the doctrine recommends — is always a new file. The tool
tells the lead to chase a worker that delivered. There is no test for this: the fixture
(`test.js:49-60`) commits a seed and then writes only *named* deliverables.

The spec claims (`:92-93`) that every detection case is paired with a "must not flag good work"
case. Here is good work, flagged.

### 2. FALSE `PRODUCED` — the tool cannot attribute a single byte to the worker

Worker produced nothing. The lead had edited one file in the meantime:

```
PRODUCED · be-dev:did-nothing · diff 1f +1/-0 · deliverables 0/0
exit=0
```

`git diff HEAD` is repo-wide and time-agnostic. It contains the lead's own edits, every concurrent
worker's edits, and anything uncommitted from before the delegation started. "The tree moved" is
never evidence about *this* delegation. And the suite asserts the behavior is correct —
`test.js:144-148`, *"PRODUCED with no deliverable named: the tree moved, which is measurable
substance."*

`agents/team-lead.md:129` names fan-out as where silent returns multiply. That is precisely the mode
in which this signal is guaranteed to be contaminated.

### 3. Zero deliverables produced reads `PARTIAL`, exit 0

```
PARTIAL · be-dev:phase2 · diff 1f +3/-0 · deliverables 0/2
  .ai/findings/nope-a.md — missing
  .ai/findings/nope-b.md — missing
exit=0
```

Code: `:136` — `return treeMoved ? 'PARTIAL' : 'EMPTY-RETURN';`. Intentional and tested
(`test.js:138-142`).

*Overtaken in part:* the checker caught the documentation half and `spec:70` now reads *"…**albo**
żaden nie ma, ale drzewo się ruszyło (kod jest, raportu nie ma)"*. The **behavior** is untouched, and
`tools/worker-return-check.js:29` still carries the old, now-false line — *"PARTIAL — some named
deliverables exist with content and some do not"* — in the shipped source header.

The substantive objection stands and the checker did not address it. Compare `spec:36-38`, the shape
the document itself calls more dangerous than an empty return: *"worker **coś** zrobił, opisał to
dobrze, a artefaktu, którego potrzebuje bramka, nie ma albo jest pusty."* The instrument built to
catch that shape prints a word meaning "some" and exits 0 for it. Risk 2 (`spec:147-149`)
pre-acknowledges `PARTIAL`/exit-0, but only for "kod jest, raport dopiero powstaje" — a benign
in-flight state, not the 0-of-N case, which is the target.

And "the tree moved" is the term carrying the entire distinction between `PARTIAL` and
`EMPTY-RETURN` here — the same term defect 2 shows is not attributable to the worker at all.

### 4. `--base` measures nothing for a worker that obeys the doctrine

Worker on a branch: `+3` uncommitted in a tracked file, plus a new file.

```
--base master  → PRODUCED · diff 0f +0/-0 · deliverables 1/1
no --base      → PRODUCED · diff 1f +3/-0 · deliverables 1/1
--base master, no deliverable named → EMPTY-RETURN · diff 0f +0/-0   exit=1
```

Cause: `:104` uses `${base}...HEAD`, which compares **committed history**. Workers never commit —
that is a parity invariant (`codex-agents/parity.test.js:84`, "workers never commit or push"). So the
flag the spec's Q3 (`:122-125`) recommends as *"właściwym punktem odniesienia"* for a worktree worker
is doctrinally guaranteed to report `0f +0/-0`. **`'--base'` appears 0 times in
`tools/worker-return-check.test.js`** — the flag has no test at all.

### 5. Three doc-vs-code divergences inside a PR about measurement

- `tools/worker-return-check.js:26` — *"PRODUCED — at least one named deliverable exists with
  content, or the tree moved."* False against `decide()`: 1 of 2 named deliverables gives `PARTIAL`
  (`test.js:130-136`). The source header describes a tool that was not written.
- `tools/worker-return-check.js:29` — *"PARTIAL — some named deliverables exist with content and
  some do not."* False against `:136`, as the checker established and `spec:70` now records. The
  spec was corrected; the source header it was corrected against was not.
- `agents/team-lead.md:106-107` — *"`NOT-COMPUTABLE`… means nothing gradable was named."* False
  against `:131`: `NOT-COMPUTABLE` requires nothing named **and** git unreadable. In a git repo with
  no deliverable named, the verdict is `EMPTY-RETURN` — the tool blames the worker for the lead's
  brief, which is the exact inversion Decision 4 (`spec:61`) forbids. Reproduced above, case 1.

### 6. The 30-byte refusal file — defect, not correct behavior

```
PRODUCED · be-dev:blocked · deliverables 1/1
  .ai/findings/refusal.md — 16B content, 2 lines
exit=0
```

The defensible reading: the tool's question is whether an artifact exists for the gate to open; it
does; the gate reads it and fails the phase. The tool is not a grader.

The stronger reading, and I think it wins here: **this framework already has a name for that state
and the instrument erases it.** `CHANGELOG.md:375` — *"**`BLOCKED-BY-POLICY`** — a refusal is not an
empty return; it is quoted verbatim."* The repo distinguishes refusal from production; the tool
collapses them into the word `PRODUCED` with exit 0, and `agents/team-lead.md:102-103` then sends
that word into the run log *in place of* the lead's reading of the worker's message. A number is
believed harder than a paragraph, so laundering a refusal into a measured success is worse than the
impression it replaced. `MIN_CONTENT_BYTES = 1` (`:53`) means the content floor is existence with
extra steps for any real deliverable — Decision 2 ("mierzymy treść, nie istnienie") is true only
against a literally blank file.

### 7. Minor

A file of 50 zero-width spaces (U+200B) reads `present, 150B content` — JS `\s` does not match
U+200B. A BOM-only file correctly reads `empty`. Low impact, but the `contentBytes` docstring
(`:76-78`) claims more than the regex delivers.

### What follows

Defects 1, 3 and 4 are roughly fifteen lines: add `git status --porcelain` for untracked paths,
scope the diff to a path set so the signal is attributable, and make 0-of-N deliverables
`EMPTY-RETURN` regardless of tree movement. Defect 2 is harder and may not be fully solvable without
a spawn-time snapshot. Defect 5 is two sentences.

---

## C6 — is this theatre?

**Verdict: UNRESOLVED as a merge decision. The spec's self-criticism is honest but aimed at the
wrong failure, which makes the framing too kind.**

### The named risk is not the real one

`spec:144-146` says the weakness is an instrument you must remember to run — i.e. the failure mode
is *silence*. The reproduced cases show a louder one: the instrument **is** run, prints `PRODUCED`
or `PARTIAL` with exit 0 for a delegation that produced nothing (C5 cases 2 and 3), and
`agents/team-lead.md:102-103` instructs the lead to paste that line into the run log "in place of
your reading of a message." Swapping a hedged impression for an unhedged number that is not about
the worker is a net loss, not a partial gain. So this is not theatre — theatre is inert. This is an
instrument that can be confidently wrong, which is the failure class this repo names as its own
recurring one (`tools/worker-return-check.js:34-35`: *"an instrument that stays quiet for the wrong
reason gets believed"*).

### The PR's measured cost on the framework's own harness

`node evals/harness/eval-status.js` on this branch:

```
DIRTY     lead-chases-an-empty-worker-return — uncommitted right now: agents/team-lead.md, codex-agents/team-lead.toml
NEVER-RUN lead-measures-the-return-before-logging-it  [PENDING]
```

So today the PR's net effect on the eval surface is: one PASS from 2026-07-28 invalidated (the
`evals/README.md` re-run mandate now applies to it), one scenario added that has never run. The spec
acknowledges the second (`Ryzyka 3`) and not the first.

`npm test` passes, 22/22 on the new suite — the suite grades the tool the author built, which is why
it does not catch any of C5's four cases.

### The gate ran and returned NITS

`.ai/audits/2026-09-04-worker-return-checker.md` is a full `checker` pass on this diff. It states:
*"Walked every combination of (named / withContent count / treeMoved / diff.available) by hand and
against the 15 verdict-producing tests… All cells resolve to a defensible, tested verdict."* Verdict:
**NITS — approve.** Its two findings were the `diff.reason` omission (fixed) and the spec's table
wording (fixed).

None of C5's four defects appear. The reason is visible in the method: the checker enumerated
`decide()`'s truth table and confirmed each cell against the tests, i.e. it graded the model of the
world against itself. `treeMoved` and `diff.available` were taken as given inputs; nobody asked
whether `git diff --numstat HEAD` can see a new file, or whose bytes it counts, or what
`base...HEAD` compares when workers never commit. A truth table can be complete and every input to
it wrong.

That is worth more to this repo than any single defect below it: for a change whose subject is
"measure instead of trusting a description", the gate verified the description.

### Would "do nothing" serve the repo better?

No — but not because the instrument is good. The **diagnosis** is correct and is the most valuable
thing in the PR: "no file = task not done" is satisfied by an empty file, and nothing downstream can
tell a well-described nothing from a success. That belongs in the repo. The implementation is
fifteen lines short of matching it.

### The fork, for the human

| | Cost | Gain |
|---|---|---|
| **A — fix C5 defects 1/3/4/5, then merge** *(recommended)* | ~15 lines + 4 paired tests + re-run the DIRTY eval; half a session | The doctrine paragraph stands as written and the number under it is true; the diagnosis lands now |
| **B — merge as-is** | Doctrine names a command that reports `PRODUCED` for a worker that produced nothing, in the fan-out mode the doctrine calls the multiplier; a false number is harder to unlearn than a false impression | Zero further work; the instrument accumulates real runs |
| **C — hold everything until Q1 (hook) is answered** | The diagnosis stays unwritten; `repo-done-checklist.md:42` keeps its existence-check bug; nothing changes | No half-instrument enters doctrine |
| **D — land the tool without the doctrine paragraph** (`tools/` + tests only, `team-lead.md` untouched) | No behavior change, so no benefit yet; `lead-chases-an-empty-worker-return` stays FRESH | Code lands and can be corrected against real runs before any role is told to trust it |

Independent of the choice, four edits are free and correct in every branch: strike `.ai/STATE.md`
from the C4 Non-Goal, rewrite the C3 Non-Goal around `maxTurns`, correct the stale sentence in
`evals/lead-chases-an-empty-worker-return.md:29-31` rather than quoting it twice more, and bring
`tools/worker-return-check.js:26,29` into line with `decide()` — the spec's table was corrected
against a source header that still describes a different tool.

---

## The single most damaging thing

**The instrument cannot attribute a single byte to the worker it is measuring, and its suite asserts
that this is correct.**

`diffstat()` runs `git diff --numstat HEAD` over the whole repository
(`tools/worker-return-check.js:102-108`). That output contains the lead's own edits, every
concurrent worker's edits, and everything uncommitted from before the delegation began. Reproduced:
a worker that produced nothing scores

```
PRODUCED · be-dev:did-nothing · diff 1f +1/-0 · deliverables 0/0   exit=0
```

because the *lead* had touched one file. `test.js:144-148` locks that in as intended behavior —
"the tree moved, which is measurable substance."

`agents/team-lead.md:129` says fan-out is where silent returns multiply. Fan-out is exactly the mode
in which several agents write into one tree, so the more workers are running, the more certain the
"tree moved" signal is to be someone else's. And `agents/team-lead.md:102-103` tells the lead to put
that line into the run log *instead of* their own reading of the worker's report.

The PR's stated purpose is to replace an impression with a measurement. In its central failure mode
it replaces an impression with a measurement of a different thing — and hands it the authority of a
number.
