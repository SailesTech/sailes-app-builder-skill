# Agent Team Structure — how the Team Lead runs non-trivial work

The canonical definition of the agent team: roles, who calls whom, the gates, and when to convene a team vs. go solo. Other skills (`sailes-implement`, `sailes-pre-implement`, `agentic-first-principles.md` §C2) point here instead of restating it.

## When a team — and when not

Convene a team when the task is **non-trivial**: 3+ steps, BE+FE together, a new/changed API contract, an architecture or data-model change, or anything touching auth/tenancy/security.

Go **solo** when the change fits one sentence and one file — a typo, a copy fix, a single guard, a config bump. Don't convene a team for a one-line diff; the coordination cost outweighs it.

**Going solo decides who writes it. It does not decide who grades it, and the two must not be collapsed.** `agents/team-lead.md` carried "go solo … and even then still run the `checker` review gate and `qa` behavior proof" while this file — the canonical one — said nothing about gates here at all, so the two definitions of one rule had already drifted. Worse, that clause fought the cost rule below it: two gates for a two-character README typo is the same waste as a worker for it, and `qa` in particular has nothing to drive. Found 2026-08-01 by an eval arm grading something else.

<!-- BEGIN gate-scaling -->
**The gate scales with what can break, never with who wrote it.**

- **`checker` on any diff that can change behavior — including one you wrote yourself.** Authorship
  is the reason the gate applies, not a waiver: a lead grading its own diff is the maker reviewing
  the maker, which is the failure gate isolation exists to prevent. Going solo does not make you
  the reviewer.
- **`qa` wherever there is behavior to observe.** Where nothing a running system can be driven
  through has changed, there is no proof to produce — record **`qa: n/a` with its reason**, the
  convention the spec status line already uses. Stated, never silently dropped.
- **Neither for a change that cannot alter behavior** — prose, comments, docs, a README typo — and
  you record making that call.

The test is **can this alter behavior**, not *does it feel small*: config values, defaults,
dependency ranges and product copy all can, and none of them are prose.

"No gate is optional" means you never drop a gate to save time or because you wrote the code
yourself. It does not mean driving `qa` through a change with no observable behavior — a skip
leaves a hole nobody can see, a stated `n/a` is a claim someone can argue with.
<!-- END gate-scaling -->


**Delegation is the default for everything above that line.** An opus-tier lead that bulk-codes a
feature itself is the expensive failure mode this structure exists to prevent: the lead's scarce
capability is planning, contract design, integration and judgment on the gates — not typing the
implementation.

<!-- BEGIN delegation-threshold -->
**The delegation threshold — who writes the code.** Delegate when the change is above roughly one
file's worth of work. Below that, a worker costs a spawn, a brief, a report and an integration, and
that overhead exceeds the saving — delegating there is waste dressed up as discipline. Above it,
writing the code yourself is the expensive failure mode this role exists to prevent: the work still
ships, the gates still pass, and only the bill differs. Either way it is **a choice you owe the run
log a reason for**, in both directions.

**This threshold decides who WRITES. It never decides who GRADES.** The two are separate axes and
collapsing them is a measured defect, not a hypothetical one — until 2026-08-01 the doctrine
demanded both gates on a two-character README typo, two paragraphs above the rule saying not to
spend a worker on it. Gates scale with what can break, never with who wrote it: `checker` on any
diff that can change behavior including your own, `qa` wherever there is behavior to observe, and
`qa: n/a` **with its reason, recorded** where there is not.
<!-- END delegation-threshold -->

<!-- Generated from delegation-threshold.md by tools/sync-blocks.js — edit the source, not this
     copy. The gate fails on drift; three hand-written copies of this rule produced three measured
     criterion collisions on 2026-08-01. -->


Whichever path, the **test gate** (`tester`), the **review gate** (`checker`) and the **behavior proof** (`qa`) still run before it
is called done. The gate scales down; it never disappears.

## Roles

Role definitions ship with this plugin in `agents/` (auto-discovered on `plugin install`) and can also be copied to `~/.claude/agents/` for global use. The lead is the single point of contact for the human.

**This table is the single source of truth for the roster.** `docs/agent-roles.md` and
`agentic-first-principles.md` used to carry their own copies; on 2026-07-26 all three had drifted and
two had lost `tester` entirely — a missing gate that reads like a complete list. Both now point here.
Add a role, change a pin or change a lane **here only**.

| Role | Model · effort | Does | Never |
|---|---|---|---|
| `team-lead` | `claude-opus-5` · high | plan · decompose into one-task units · assign · integrate results · final verdict; reads Task Router + `.ai/lessons.md` before planning | bulk-codes the feature solo on a large task; lets a worker decide a **key** decision |
| `explorer` | `claude-haiku-4-5` · — | read-only recon → `file:line` findings, contract shapes, prop/value maps; carries `WebSearch`/`WebFetch` for external gathering, reporting the URL and quoted line exactly as it reports `file:line` | propose final code; review quality; judge whether a source is trustworthy (that is `researcher`'s call at synthesis) |
| `researcher` | `claude-opus-5` · high | synthesise what several explorers brought back into ONE findings artifact — provenance per claim, confidence, an explicit could-not-establish list — and verify load-bearing claims at source with its own cross-cutting sweep. Integrates **to know**, where the lead integrates **to act** | decide anything, recommend an architecture, spawn (it has no `Agent` — see roster spec Q1), or present an unverified claim as verified |
| `designer` | `claude-sonnet-5` · high | UX/UI spec from design tokens (layout, states, responsive) | write feature code |
| `be-dev` / `fe-dev` | `claude-sonnet-5` · high | implement exactly the approved scope, per spec / per design | commit, push, or expand scope |
| `tester` | `claude-sonnet-5` · high | author the phase's suite via `sailes-test`: derive cases from the spec with the code UNREAD → human freezes `.ai/test-plans/<spec>.md` → write → ADD-only from the diff → tiered detection proof. The **one gate role that writes** | read the implementation before deriving cases; weaken a frozen assertion; lower its own risk tier; commit or push |
| `checker` | `claude-sonnet-5` · high | independent read-only review of the diff vs. spec → APPROVE / NITS / CHANGES-REQUIRED; input = diff + spec + checklist ONLY (see Gate isolation) | grade on reasoning instead of result; read the maker's narrative; touch code |
| `qa` | `claude-sonnet-5` · high | run the `tester` suite on the live app as the gate verdict + real-flow proof + screenshots; behavior before diff; vision-verify vs design artifact + `.ai/screens/` baseline | fake a pass when stack/creds are missing |
| `docs-author` | `claude-sonnet-5` · medium | author the archify diagram set from repo evidence (`sailes-docs`); every diagram held to a validate/deliver receipt; runs at bootstrap/adopt and before the docs-delta step of spec closure — outside the phase order above | edit feature code (findings are reported upward); hand off without a receipt; call a `SKIP archify` a pass |

## Model routing — the role default is a default, not a ceiling

The `Model · effort` column above is what each role's definition file pins, and it is the default for
an **ordinary task of that role**. The lead may override it for a single task with the Agent tool's
`model` / `effort` parameters. Resolution order is `CLAUDE_CODE_SUBAGENT_MODEL` env → the
per-invocation parameter → the role's frontmatter, so a lead's override beats the file and loses to an
environment pin the human set deliberately.

**Model IDs are pinned, not aliases** (`claude-sonnet-5`, not `sonnet`). An alias silently follows
whatever the tier's default becomes, which makes a run un-reproducible and makes "the framework got
worse" impossible to attribute — the same lesson this repo already applies to pinning `-m` on a Codex
delegation. The cost is real and accepted: a new model needs a framework release to reach the roles.
If an org's `availableModels` allowlist excludes a pinned ID, Claude Code skips it and runs the role on
the inherited model rather than failing.

**Escalate on judgment, not on volume.** Opus for a contract, data-model, auth or tenancy surface; a
migration parity judge; a diagnosis with no reproducible mechanism yet; a change too entangled to slice
cleanly. A large but mechanical change is a Sonnet task — reaching for the expensive tier because the
diff is big is the same misread as the lead bulk-coding it. **Every override is recorded in the run log
with its reason**; an unlogged escalation cannot be told apart from drift.

Downgrade with the same deliberateness. A `Done-when` is a pass/fail read of exact commands against
expected output, so a lightweight model grades it — raising effort on a binary read buys nothing.

**An override buys a tier, not a version — and it does not buy effort at all.** Both halves were
measured against the live tool on 2026-07-26 rather than read from documentation, and they fail in
opposite ways:

- **`model` fails loudly.** It accepts only the tier aliases `sonnet` / `opus` / `haiku` / `fable`; a
  full ID is rejected with `InputValidationError`. So overriding trades the pinned `claude-sonnet-5`
  for whatever `sonnet` resolves to at that moment.
- **`effort` fails silently, which is worse.** It is not among the Agent tool's declared parameters,
  yet passing it raises no error. Whether it takes effect is **unverified** — and a parameter that is
  accepted without applying is exactly the shape of failure this repo keeps recording: the lead
  believes it set the effort, nothing contradicts them, and the worker runs at the role file's level.
  **Treat effort as frontmatter-only.** If a task genuinely needs a different effort, that is not an
  override — it is a role that has outgrown its definition.

The practical consequence: **omitting `model` is how you keep the pin.** Passing it is the deliberate
act, and the only thing you can change per task.

This is a **decided trade-off, not an oversight** (2026-07-26). The pin's value is on the default
path, where nearly every run lives and where it stays fully intact; escalations are rare, deliberate
and already logged with a reason, so attribution survives at the decision level even when exact
version does not. The alternative — a twin role file per escalated role — reintroduces duplication in
a repo that has already had one table drift across three copies.

Two obligations come with taking it:

- **Log the alias, not just the fact.** "Escalated to `opus`" is the record; "escalated" is not.
  Without the alias, a later reader cannot tell which model produced the result, which is the very
  attribution the pinning exists to protect.
- **Escalating the same role routinely is a signal, not a habit.** When it recurs, promote that role
  to its own pinned definition instead of overriding forever — the graduation rule this framework
  already applies to configuration. Do it on evidence from the run log, not in anticipation.

**Log the non-overrides too.** Recording only the deviations leaves the volume-misread invisible: a
reader cannot tell a phase where the escalation axis was considered and rejected from one where nobody
looked. Write the tier for every worker, and mark the defaults as defaults. The log also has to be able
to say an override was *wrong* — whether the expensive run actually caught something the default would
have missed — or it is not a record, it is a receipt.

Two dated constraints (2026-07-26, re-check when the roster moves): **`effort` is unsupported on
Haiku 4.5**, so `explorer` carries no `effort:` line and is tuned by changing its model, not its
effort; and **Haiku 4.5 holds 200K of context against 1M on the Sonnet and Opus tiers**, a real
ceiling on whole-repo recon rather than a price difference. Note also that Claude Code's own built-in
`Explore` agent stopped defaulting to Haiku and now inherits the session model — `explorer` staying on
Haiku is a deliberate divergence from the platform default, not a match to it.

**A gate can earn an escalation, on a different trigger than a worker.** Most review is a patch read and the pinned tier handles it. Escalate a gate when the defect it guards against is **what the diff omits** rather than what it contains — a tenant filter missing from one of nine access paths, an authorization check absent from a branch nobody wrote. That requires holding the whole surface in mind and asking what *should* be there, which is not the same task as checking that what is there is right. Named 2026-07-26 after a run escalated `checker` on a tenancy diff for exactly this reason while the doctrine had no words for it. Still a judgment trigger, never a size one, and still logged with its outcome.

## Order of work (the pipeline)

```
explorer → designer → BE contract finalized → fe-dev → tester → checker → qa
```

- **`explorer` first** maps the affected code so the lead plans against reality, not assumption.
- **BE contract is finalized before `fe-dev` starts** — the frontend builds against a frozen shape, not a moving target. **"Frozen" means a committed, typed contract artifact** — shared TS types / Zod schemas (or OpenAPI where the consumer is external) at the repo's shared-contracts location — that both slices *import*. Drift then is a compile/type error, not a review finding. The brief's `Contract:` line points at the artifact path; prose describes intent, the artifact is the truth.
- **`tester` runs after the code is written and before `checker`** (`sailes-test`). It derives the phase's expected behavior from the spec *before reading the implementation*, the human freezes that list, then it writes the suite — the informational barrier is what stops the tests from mirroring the code. `tester` writes; the other two gates stay read-only. `tester` runs **per phase**, not once at the end.
- **`tester`, `checker` and `qa` are all gates, not formalities.** `tester` CHANGES nothing but authors the proof; CHANGES-REQUIRED from `checker` loops back to the relevant dev; a faked or skipped `qa` is not a pass.
- Not every task needs every role. A backend-only change skips `designer`/`fe-dev`. The **order among the roles you do use** is preserved.
- **Dropping a role is provisional, not final.** If a later decision introduces a surface you'd skipped — e.g. a perf constraint forces an async-download UX, so a backend-only task suddenly needs a UI flow — **reinstate the dropped role** (`designer` here) and re-freeze the contract before `fe-dev`. Don't push a new UX surface through without the design pass just because the original plan skipped it.

## How the lead actually runs it

1. **Load context before planning** — Task Router guides for the touched areas + `.ai/lessons.md` (institutional memory). Planning without these repeats known mistakes.
2. **Decompose into one-task units.** Each worker gets exactly one task with explicit scope and the contract/spec it implements against — handed over as a **self-contained brief** (format below). One task per worker keeps reviews tractable and scope honest; never hand a worker several independent problems at once. **Slice for file-disjointness:** no two concurrent workers may write the same file — if the slicing can't achieve that, the tasks aren't parallel (sequential, or worktrees). A parallel-safe codebase layout makes this easy (`agentic-first-principles.md` §E).

   **What may run in parallel is read off the FILE-OWNERSHIP TABLE, never off the phase graph's arrows.** A work plan that draws `F1 → F2 → {F3, …}` is drawing the order somebody *thought* about the phases in, and an arrow in it does not assert a technical dependency. Measured 2026-08-01: the same plan document that called F2 "solitary" carried, twenty lines below, an ownership table showing F2's and F3's file sets were disjoint — so disjoint that F3's brief listed F2's file as forbidden. The cost was a phase idling behind six others for no reason. **The critical-path section of a work plan therefore carries both drawings** — the graph of concepts *and* the file-disjointness matrix — because the first one misleads on its own. The dispatch question is never "which arrow points here" but *does this task's file set intersect anything already running?* An intersection on a **single** file is not a reason to serialize two phases: take that file away from both and integrate it yourself, which is cheaper than the wait.
3. **Assign and integrate.** The lead hands tasks to teammates, collects results, and integrates — the lead owns the merge, not the workers.
4. **Escalation is upward only.** A worker that hits a scope question or a **key decision** (stack, contract shape, data-model, auth, roles) stops and escalates to the lead; the lead escalates to the human. Workers never silently decide a key decision or widen scope.
   - **Escalating without a recommendation is allowed.** The lead normally arrives with options and a reasoned pick. When it genuinely cannot ground one, "nie mam podstaw, żeby wskazać" is the honest line — and where the decision is also expensive or hard to reverse, the lead offers a fourth move next to the options: **settle it by measurement**, with the criterion fixed and mechanically derived *before* anything is dispatched, and the run priced so the human can decline. Record which way it was settled, argued or measured. See `deciding-under-uncertainty.md`.
   - **A substitute decision is graded on its second-order effect, not on its justification.** When a worker resolves a blocker on its own and reports why, the justification may be **true and beside the point** — those are indistinguishable at a glance, which is why this needs saying. Measured 2026-07-30: a worker justified an unconditional `createQueue()` call as idempotent. It was, *for inserting the row*, and was not *for the options* — `ON CONFLICT DO NOTHING` silently discards the losing racer's configuration. The defect passed two gates and surfaced only when `qa` ran it on a live stack. The question is never "is this sentence correct"; it is "what does this do the second time it runs, and who wins the race".
   - **An option that cites an existing mechanism gets verified before the card is presented.** Measured the same day: a decision card offered "dead-letter plus visibility through a mechanism that already stands"; the mechanism was a process-liveness heartbeat with nothing to say about individual jobs, and the human chose on a false premise. *"I have no grounds to recommend"* is a legal line in a card. A fabricated premise is not — it reads identically to a grounded one, so the reader cannot discount it, and the hedge you skipped was their only signal.
   - **Where the lead's authority ends.** The lead *assembles and freezes* the contract from decisions the spec/brief already settled — that's coordination, the lead's job. But when freezing it requires a **new** architectural or UX choice the spec didn't settle (e.g. "50k-row export: synchronous streamed download vs. async job + emailed link" — which also decides whether a new UI surface and a `designer` pass are needed), that is a **key decision**: the lead escalates it to the human, gets the answer, *then* freezes. The lead never silently picks the architecture just because it's mid-pipeline.
4b. **`qa` takes exclusive hold of the runtime environment; the lead enforces it.** While a `qa` run is live no other worker stands up, restarts or migrates the database, and none touch the containers. **File isolation does not reach this.** Worktrees protect every worker from every other worker's *edits*; the database, the ports, the bucket and the containers are shared by the whole machine, and that is the one resource that cannot be cloned. Measured 2026-07-30 inside a single `qa` run: the MinIO container deleted twice and the database role passwords reset — neither maliciously, the rule simply did not exist. Without this clause, "we gave everyone a worktree" is a **false sense of security**: the files are isolated and `qa` still loses its run to somebody else's `docker compose down`. The lead records who holds the environment and since when; a run whose stack changed shape underneath it reports `ENV-DEFECT`, because a pass that cannot be attributed to the code is worse than no pass.
5. **Workers never commit to a SHARED branch and never push. Inside their own worktree they commit — and they should.** Integration, the shared branch and the PR are the lead's, after the gates pass. See "Isolation" below for why the wording changed and what it now protects.
6. **Run log.** The lead records what was assigned, what each worker returned, and the gate verdicts — so a context reset can resume without re-deriving the plan. At session end (done or interrupted) the lead also updates `.ai/STATE.md` — **write before walking away**: verified facts with evidence, open failures, Last session pointer.

## Isolation — every worker that writes gets a worktree

**Mandatory, no exception, and the test is "does it write" rather than "is it on a list"** — so a
role added next year inherits the rule instead of an omission. In scope: `be-dev`, `fe-dev`,
`tester`, `designer`, `docs-author`. Out of scope: the read-only roles (`explorer`, `checker`,
`researcher`), where ~200–500 ms and a disk copy per agent buy nothing. Also out of scope, for a
different reason: **`qa`**, which needs the live stack rather than a copy of the files, and takes
**environment exclusivity** instead (rule 4b). `docs-author` is in despite owning a lane nobody else
writes to, because it is routinely run **in parallel with an implementation phase** at spec closure
— which is the condition the isolation exists for.

**This is not a merge conflict problem.** Two processes writing one file on a shared disk do not
produce a conflict — they produce **silent loss**. Git sees only the survivor and has nothing to
report. Measured 2026-07-30, three incidents in one day: a lead's commit landed on a **half-written
file** belonging to another worker's phase (a parameter added, the signature not yet), where a
whole-tree pre-commit lint then blocked an unrelated commit; a worker correctly refused to write and
escalated after noticing files changing mid-session — right about the risk, wrong about the culprit,
because the edits were the **lead's**; and a prepared commit found nothing to record because the
human had committed the same staged set seconds earlier. **Two of those three are worker-versus-lead
or worker-versus-human — collisions the no-two-workers-on-one-file rule does not even address.**

So the mandate is not new doctrine, it is **enforcement of old doctrine**: "integration, merging
shared files and running the gates stay with the lead" has been the rule for a long time. The
worktree converts it from a rule people follow into a condition they cannot break — a worker cannot
damage someone else's file because it cannot see it.

**Collecting the work — measured, not assumed (2026-07-30).** The tool result returns
`worktreePath` and `worktreeBranch`; the harness creates a dedicated branch per worker, so the
"one branch cannot be checked out twice" problem never arises. The worker commits there, and because
the worktree shares the main `.git`, the commit is visible from the main tree **immediately** —
`git log <branch>` and `git cherry-pick` work with no push and no copying. A changed worktree
survives the agent's termination.

**Check the base of your worktree before working — a harness defect, and the brief is the only
place it can be caught.** Measured 2026-08-01: **five of twelve** workers were given a worktree cut
from a commit *before* half the session's work — one from before an entire completed phase, one
**nineteen commits back**. All five diagnosed it themselves and fast-forwarded, but the cost landed
anyway: one reported a **false test-count regression** (556 against the real 570) that took a
separate investigation to dismiss, and one had to `pnpm install` from scratch because its checkout
predated `node_modules`. A worktree should be cut from the tip of the branch the session is on, not
from where the session started; until the harness does that, every brief carries the check:

> **VERIFY YOUR WORKTREE'S BASE BEFORE YOU WORK.** `git log --oneline -3` — you must see `<sha>`
> or newer, and the file `<a named file that only exists after that work>`. If you do not: report
> it and fast-forward **before** starting, not after.

Name a *file* as well as a sha. A sha proves the history; a file proves the history you actually
depend on, and it is the one a worker can check without knowing what the sha meant.

**Why the worker commits, when the old rule said never.** The old absolute existed to protect the
shared branch, and git now guarantees that outright: the shared branch is checked out in the main
tree, so no worktree can take it. What a commit adds is what prose could not — **a worker's commit is
its declaration that the work is finished.** Reading an uncommitted worktree cannot tell finished
work from an edit interrupted mid-file, which reproduces incident one *inside* the isolation. **No
commit means not finished**, and that is a useful thing for the lead to learn rather than something
to salvage.

**Commit often, `WIP:` included — and the two kinds of commit mean different things.** "No commit =
not finished" protects the lead from *guessing* whether work is done. It does **not** protect the
work from the machine: measured 2026-08-01, five crashes in one day (drivers, editor, an agent API
error, Docker twice) and **two workers lost their work outright** — one was rescued only by copying
three files out of a worktree by hand. The worker that had been checkpointing with `WIP:` lost
nothing across two of those crashes.

So the convention, and it is load-bearing in both directions: a commit whose subject starts with
`WIP:` is a **checkpoint** — "this is what survives if my process dies", never a claim of
completion. Any other commit is the **declaration** the lead reads as finished. Without that split,
"commit often" quietly destroys the rule it sits next to, because a log full of commits stops
answering the only question the lead asks it.

### The worker status file — a declaration the lead can verify

**Every worker that WRITES claims `.ai/status/<worker-id>.md` as its FIRST action and closes it as
its LAST** — the identical test as the worktree mandate above, "does it write" rather than "is it on
a list", so a role added next year inherits the rule instead of being omitted by an outdated list.

```yaml
worker: be-dev-3
task: "F2 — brief-closure check"
base: e276a5e            # sha the worktree was cut from
claimed: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]
opened: <timestamp>
# --- appended at close ---
closed: <timestamp>
outcome: done | blocked | policy-refusal
commit: <sha>             # empty unless outcome: done
touched: [...]             # what actually moved
```

**Why it exists, in three states where today there is one silence.** No file means the worker never
started. A file with no `closed:` means it died mid-run. A closed file is a declaration. Until this
doctrine those three read identically from outside the worktree, and on 2026-08-01 that
indistinguishability cost twice in one day: a lead reported finished work as unfinished — what got
lost was the *report*, not the work — and, separately, two workers lost their work outright across
five machine crashes, with nothing on disk saying a run had ever started.

**The lead verifies the file AGAINST the worktree — metadata only, never content**: does `commit`
exist, does `touched` match `git diff --stat`, was `base` current. **It reports loudly and does NOT
block.** Blocking was rejected deliberately: this repo already has two documented cases of a check
disabled for crying wolf, and a check that fires on harmless drift teaches everyone to ignore it. A
discrepancy lands in the verdict and the run log; it never stops acceptance on its own.

**The lead cleans up at acceptance, and the cleanup is a move, not a delete.** On accepting a
worker's result, the lead folds the file's substance into the run log — one line: worker · task ·
`outcome` · `commit` · `base` · discrepancies from verification — and **removes the file**. Three
rules keep this from rotting into either a lost record or a stale pile:
- **Deletion only together with the run-log entry.** A deletion with no entry is a lost declaration,
  indistinguishable from a skipped gate.
- **A file from a worker that died and was NOT accepted does not vanish quietly.** It lands in the
  run log as a **loss** — with whatever it managed to declare — and is removed only after that. It
  is the only record that the run ever happened.
- **`.ai/status/` is gitignored.** It is live state, meant to survive a process crash on disk, not
  meant to be versioned — the run log is the history, and the run log is what gets committed.

**The invariant is the product: whatever sits in `.ai/status/` is either running or dead.** A file
left behind after acceptance breaks that within a week, because then answering "is this worker still
running" means reading every file and comparing dates against the run log by hand — exactly the work
this artifact exists to save.

### Observing a worker — metadata is observation, content is integration

The 2026-07-30 incident that produced "no commit = not finished" was an **integration** from an
uncommitted tree: a lead committed someone's half-written file. On 2026-08-01 the opposite failure
ran twice in one day — the lead declared work unfinished while it **sat finished on disk**, because
the report was what got lost, not the work. Both are real, and they are not in tension once the line
is drawn in the right place: **you may look at everything except the content.**

The ladder, cheapest and least intrusive first. Stop at the first rung that answers the question.

1. **Ask the worker.** In teams mode a live teammate answers `SendMessage`, and the task tools
   (`TaskList` / `TaskGet` / `TaskOutput`) report its state without touching the disk at all. This
   is the designed channel and it costs nothing — reach for it *before* git. With teams mode off,
   a scoped subagent has no live channel and this rung does not exist; know which mode you are in
   before quoting a procedure that cannot be run.
2. **`tail -3` the subagent transcript.**
   `~/.claude/projects/<repo>/<session>/subagents/agent-<id>.jsonl` — a bounded read of the worker's
   last few lines. Measured 2026-08-02: the `.output` path the harness hands you at spawn is **0
   bytes** on Windows, not a link Node follows; the real transcripts sit at the path above — 64
   files, 5.2 MB in one session, largest 388 KB, so reading one whole file is ~100k tokens spent on a
   yes/no question. But 57 JSONL lines at ~1.8 KB each means `tail -3` costs **~5 KB** — cheap enough
   to actually use. State the caveat every time you reach for it: this path is **harness-internal,
   session-scoped, and does not exist under Codex** — a convenience, never a condition. And it is the
   worker's **narrative**, never a substitute for the status file's **declaration** (above) — a
   transcript says what the agent claimed about itself, which is exactly the kind of self-report gate
   isolation elsewhere in this document refuses to trust.
3. **Read the declarations.** `git -C <worktreePath> log --oneline` — what the worker committed, and
   which of those are `WIP:` checkpoints rather than a finished claim — and the worker's own
   `.ai/status/<worker-id>.md`, if the brief carries one: `base`/`claimed` from before it started,
   and, once closed, `outcome`/`touched`.
4. **Read the metadata, never the content.** `git -C <worktreePath> status --porcelain` (which
   paths are dirty, names only), `git -C <worktreePath> diff --stat` (how much moved in each file,
   no lines), and the files' modification times. This answers the questions that actually matter
   for a silent worker — *is it still moving, or did it die forty minutes ago, and how far did it
   get* — and answers them without ever putting a half-written signature in front of you.
5. **Forbidden, unchanged.** `git diff` without `--stat`, reading those files, copying them out,
   committing or cherry-picking uncommitted work. That is integration, and integration reads only
   declarations. If rungs 1–4 say the work exists but is not declared, the move is to **get the
   worker to commit it** — or, if it is truly dead, to record the loss and re-spawn. Never to
   finish somebody else's commit for them.

What rung 4 buys that rung 3 cannot: a worker that has been silent for an hour with an untouched
tree is dead, and one whose files moved ninety seconds ago is working. Those two need completely
different responses from the lead, and until now nothing in this document let them be told apart.

**Entry condition — do not skip it quietly.** The mandate assumes a fresh checkout can be made to
run: dependencies, environment. A worker that cannot execute its verification commands has been
converted from "verified" into "cannot verify", which is a straight regression against `VERIFIED`.
Where the repo has no documented one-command path from clean clone to running app, that is an
`ENV-DEFECT` to report (`repo-done-checklist.md`, Environment block) — not a reason to drop the
isolation. Note the framework repo itself satisfies this trivially, having no dependencies; a client
monorepo does not, which is exactly why the condition is written down.

**And the caveat that matters more than the rule: a worktree isolates FILES, not the RUNTIME
ENVIRONMENT.** Database, ports, buckets and containers are shared by the whole machine. Without
rule 4b's environment exclusivity, "we gave everyone a worktree" is a **false sense of security**:
the files are safe and `qa` still loses its run to somebody else's `docker compose down`.

### The fourth axis of collision — the shared TOOLCHAIN, and it fails by going quiet

Three axes are named above and each has its isolation: **files** → the worktree, **contract** →
freezing it before the consumer starts, **runtime environment** → `qa`'s exclusivity. The fourth
went unnamed until 2026-08-01, and it is the only one whose symptom is **silence rather than an
error**: the package manager's store and the machine's cores are shared by every process on it.

What it looked like. `pnpm check` — normally about a minute — **hung for ten minutes** and was
killed by a timeout. The first hypothesis was tempting and wrong: seventeen `node` processes,
therefore orphaned debris, therefore kill them. `STATE.md` even carried a real precedent of
twenty-four orphans. Counting them by **command line** instead of by number: **thirteen of the
seventeen were editor language servers and MCP servers**, and the two that mattered were a worker's
live `pnpm install`, started in the same second as the gate. A shared store and a `tsc --build
--force` do not add up — they serialize.

Three rules, and the first is the one that generalizes past this incident:

- **Count and break down by command line before you kill anything.** A process count is not a
  diagnosis. The control question before any `taskkill`: *does this process have a parent I
  recognise, and did it start when I asked for something?*
- **Never kill editor processes or MCP servers.** They are the largest part of that list and the
  part least connected to your tests, and killing them takes the human's tooling down with them.
- **The lead does not start a gate while a worker is standing up a worktree.** Installing
  dependencies and a full typecheck contend for the same store and the same cores; run them
  nose-to-tail and both finish sooner than either does interleaved.

**Removing worktrees on Windows — a known procedure, because it recurs at every cleanup.**
`git worktree remove` fails with *"Filename too long"* on nested `node_modules`. What works is
mirroring an empty directory over it (`robocopy <empty> <worktree> /MIR`) and then removing the
husk — and it takes **upwards of ten minutes for eight worktrees**, so budget it rather than
discovering it. Do not reach for `rm -rf` and do not mask the failure with `|| true`.

Housekeeping: add `.claude/worktrees/` to `.gitignore`. In a generated repo `.claude/settings.json`
is committed, so without it the workers' checkouts appear as untracked debris inside a tracked
directory.

## Gate isolation — what the gates see (verifier beats self-critique)

A verifier grades honestly only on a clean context. The failure mode this section closes: a reviewer that reads the maker's reasoning inherits the maker's confidence and waves the work through — it grades the story, not the artifact.

- **`checker` receives ONLY: the diff, the spec/contract it implements, and the review checklist.** The lead **never forwards** the worker's report, reasoning, or self-assessment to `checker` — the worker's narrative is input for the lead's *integration*, not for the *review*. If the checker asks "why was this done this way", the answer is the spec, not the worker's story.
- **`qa` receives ONLY: the running app, the spec's expected behavior, and (for UI) the design artifact.** Not the implementation story, not "what should work now".
- **Vision-verify (UI):** for every screen the task touched, `qa` compares a fresh screenshot against (a) the design artifact (`.ai/specs/ui-spec.md` or `design-system/MASTER.md`) and (b) the previous accepted screenshot in `.ai/screens/` (visual regression). Mismatch = CHANGES-REQUIRED naming the concrete difference. On APPROVE, the new screenshot replaces the baseline in `.ai/screens/`. A text-only review cannot see a failure that only exists on screen.
- **Cheap graders for binary checks:** a phase's `Done-when` (exact commands + expected output) may be verified by a lightweight model (haiku) — it's a pass/fail read, not judgment. Judgment review stays with `checker`.
- **`checker` never re-checks what the toolchain enforces.** Lint/type/convention-test guarantees (no `any`, tokens-only, import direction — the ratchet, `agentic-first-principles.md` §B.3) are the machine's job; `checker` spends its capacity on what machines can't see: spec fit, naming, design intent, edge cases, scope creep.
- **ENV-DEFECT, not a skipped proof:** when `qa` cannot run the real flow because the stack won't boot or creds/fixtures are missing, that is a **bootstrap defect**, not a qa judgment call — `qa` reports `ENV-DEFECT` naming what's missing, the lead escalates, and the fix is the seed/boot path (see `repo-done-checklist.md` Environment block). A faked or skipped pass is never the answer to a broken environment.

## Spawn the named role, not a generic agent wearing its instructions

**Every worker is spawned as its own agent type — `be-dev`, `checker`, `qa`, `team-lead` — never as
`general-purpose` with the role definition pasted into the brief.** The role file is not a prompt
template. It carries three things a brief cannot: the pinned `model` and `effort`, the `tools`
allow-list, and the name that hooks and the run log see. A generic agent handed the same prose has
none of them.

What is silently lost when a generic agent stands in for a role:

- **The model routing does not happen.** A `general-purpose` agent runs on the session's inherited
  model at the session's effort. `be-dev`'s `claude-sonnet-5 · high` and `team-lead`'s
  `claude-opus-5 · high` are never consulted, so the routing rule above is bypassed in the exact
  place it was supposed to apply — and nothing reports it.
- **The tool restrictions do not apply.** `checker` is read-only *because its definition says so*;
  a generic stand-in can write. The invariant that no non-lead role can spawn subagents holds
  because those roles omit `Agent` from `tools` — a generic agent has it, so a stand-in "checker"
  can fan out. Configuration you bypass is not enforcement.
- **The gate stops being the gate.** A reviewer that could edit the diff, on the maker's model, is
  not an independent gate no matter what its brief says.

**`general-purpose` is a last resort, and it is a *reported* one.** It is legitimate exactly when the
named role does not resolve — the plugin is not installed on that machine, or the type is otherwise
unavailable. Then, and only then: paste the role definition into the brief, **set `model` and
`effort` explicitly on the invocation** (nothing else will), and **record in the run log that the
role ran as a stand-in** — because a run staffed by stand-ins tested the briefs, not the roles, and a
later reader must not mistake one for the other.

**If the roles do not resolve, that is the finding.** The roles ship with the plugin; a machine that
never ran `enable-plugin.sh` has none of them, and every "team" it runs is a team of generic agents.
Check before concluding anything about the framework's behaviour from such a run.

## What the role definition actually enforces — audited, not assumed

Measured 2026-07-26 by spawning the real roles and asking them what they could do. The distinction
matters because two of these properties carry safety arguments, and one of them cannot.

**Enforced by configuration** — the runtime makes these true whatever the prose says:

- **The model pin.** `explorer` reported `claude-haiku-4-5` and `checker` reported `claude-sonnet-5`,
  each matching its frontmatter. The routing above is real, not aspirational.
- **The tool allow-list.** `checker` had exactly `Glob, Grep, Read, Bash` — no `Write`, no `Edit`,
  not merely unused but absent from its schema, so there is nothing to resist.
- **The absence of `Agent`.** Neither role could spawn anything; the tool does not exist for them.
  **This is the one that makes depth-2 sub-teams safe**, and it is now verified rather than read off
  a config file.

**A convention, not a boundary** — and the doctrine used to blur this:

- **"Read-only" is prose discipline.** Every gate role carries `Bash`, because the job requires it:
  `checker` runs lint/type/tests to confirm the machine's guarantees, `qa` drives the app, `explorer`
  queries the graph. Both audited roles wrote a file through `Bash` on the first attempt, with no
  friction. Nothing technical stops a gate from editing the code it is grading.

**We are not removing `Bash`, and the reason is not convenience.** A `checker` that cannot run the
test suite cannot confirm what the toolchain enforces, which is half its value; a `qa` that cannot
drive the app has no behavior proof. There is also no shippable lever: `permissionMode` is one of the
fields ignored when a subagent loads from a plugin, and Bash permission rules live in machine
settings, not in what we distribute.

**So do not rest the gate's integrity on "the checker cannot edit".** It never did. What protects the
verdict is the isolation of the gate's *inputs* — diff, spec, checklist, and nothing else — because a
reviewer that inherits the maker's narrative grades the story regardless of what it is able to write.
The write restriction was always incidental; the input restriction is the mechanism.

## Worker brief — the self-contained handover

A worker has no shared memory with the lead beyond what the brief contains. "Explicit scope" means a brief that stands alone — the worker should never have to guess product intent or hunt for the contract. Minimal format:

```markdown
You are `ROLE` on team `TEAM`, under `team-lead`.
You are in your own worktree on branch `…`. Do not switch branches. Never commit to a
shared branch and never push. **Commit your finished work HERE** — that commit is your
declaration that the task is done, and the lead cherry-picks it. No commit = not finished.
[read-only roles: drop the two lines above and say "you write nothing".]

Task:        claim Task #N, mark it in_progress.
Goal:        one precise outcome.
Files:       exact paths to inspect / edit. EVERY path here names the Done-when clause
             that forces it into existence — a path with no such clause is either
             surplus on this list or a hole in the phase, and which one is a question
             you answer NOW, not two days from now.
Contract:    request/response/types/events/DB fields other slices depend on.
Constraints: the toolchain is the constraint (lint/types/convention tests enforce
             no-any, tokens-only, import direction); list here ONLY what it can't see —
             backward-compatible public contract; no destructive commands.
Forbidden:   the files, directories and commands this worker must NOT touch — named, not
             implied. With two tracks running this is the single thing that keeps them
             disjoint, and it turns a crossed boundary into something the worker REPORTS
             instead of something nobody notices.
Reference:   the module/component/pattern to imitate — a **golden-module** implementation
             from the Sailes library when one exists (see modules-catalog.md, graduation rule).
Blocked:     stuck more than one round on something that is NOT a key decision → take a
             substitute decision, MARK it in the code, report it as a deviation. Waiting
             costs the round; picking silently costs the lead a decision they never saw.
             Key decisions (stack, contract, data-model, auth, roles) are never
             substitutable — escalate and wait.
Status:      claim `.ai/status/<worker-id>.md` as your FIRST action (`worker`, `task`,
             `base` sha, `claimed` paths, `opened`) and close it as your LAST (`closed`,
             `outcome`, `commit`, `touched`). No file = you never started; a file with no
             `closed:` = you died mid-run; a closed file is your declaration. [read-only
             roles: drop this line — you write nothing, so nothing to claim.]
Checkpoint:  write progress to files as you go. Your in-memory state does not survive your
             process; disk does.
Verification: exact commands to run + the e2e requirement.
Report:      per-file diff summary · command output · contract shape · blockers/deviations.
             Your REPORT IS the deliverable — not a summary for a human, not a status
             line. If you did not finish, say so plainly and list what you did and did
             not establish. Never return empty.
Delivery:    [scoped subagent] your final message is returned automatically — just end with it.
             [background teammate] plain text reaches NO ONE; you must call SendMessage
             to deliver. State which of the two applies — the worker cannot tell.
```

Drop the lines that don't apply to the role (a `be-dev` brief has no design tokens; an `explorer` brief is read-only with no Constraints/Verification). The non-negotiables in every brief: **one goal, the contract it must honor, the verification commands, the commit rule in its current form ("commit in your own worktree; never to a shared branch, never push"), and the report clause.**

**`Files:` and `Done-when` are two lists that drift apart in silence, and 2026-08-01 measured it
three times inside one milestone.** The allowed-files list says *what may be touched*; `Done-when`
says *what must come to exist*. `checker` grades the diff against the phase's scope, and **the
phase's scope is its `Done-when`** — so a path that appears only on the file list is a thing nobody
ever checks for. The gate does not fail; there is nothing for it to fail on. In that milestone it
cost, in order: the write half of a resource's CRUD, so for two days no custom field could be
created through the API — during the milestone *whose entire subject was custom fields*; a deferral
that existed **only as a comment in the code**; and the milestone's whole READ surface, without
which the frontend had nothing to render a form from. Walking the file list against `Done-when`
while writing the brief takes a minute and is the only moment the question is cheap.

**Three of these lines were earned on 2026-07-30 and are worth their space for a reason each.**
`Forbidden:` — with two parallel tracks it was the only device that kept them disjoint, and its
second effect mattered more than its first: crossing a *named* boundary got **reported**, where
crossing an implied one is simply invisible. `Blocked:` — it held the pace and, every single time it
fired, handed the lead an explicit point to review instead of a silent choice; the lead's side of
that exchange is to grade the **second-order effect**, not the justification. `Checkpoint:` — one
worker died together with its process and its entire in-memory state went with it. The existing rule
that a graded deliverable must be a FILE covers the **result**; this one covers the **run**, and they
fail differently: a lost result costs a re-run, a lost run costs everything learned during it.

**`Status:` was earned on 2026-08-01, and it is not `Checkpoint:` again.** `Checkpoint:` is written
by the worker, for the worker — a hedge against its own process dying. `Status:` is written by the
worker, for the *lead*, and answers a question `Checkpoint:` was never built to answer: not "how far
did I get" but "did I ever start, and did I finish". Three states, one file: absent means never
started, present without `closed:` means died mid-run, closed means a declaration — see Isolation
below for why that distinction did not exist until now and what it cost.

**Migration numbers are handed out in the spec, up front** — an anti-collision device, not tidiness.
Two workers adding migrations in the same phase will pick the same next number, and the collision
surfaces at merge time, when it is most expensive.

**The report clause goes in every brief regardless of agent type.** Built-in types (`general-purpose`, `Explore`, and the rest) cannot have their definitions edited, so the brief is the only surface that reaches them — and observed failures have come from exactly there, not from the Sailes roles. Writing it only into `agents/*.md` would leave the common case uncovered.

**Name the delivery mechanism, because the worker cannot infer it.** Measured 2026-07-18: of five background teammates given "your final message IS the deliverable", three produced a correct answer and delivered nothing — one said outright it had written the answer as plain text instead of calling `SendMessage`. The instruction was not ignored; it was *true for a different spawn mode*. A scoped subagent returns its final message automatically; a background teammate must send it, and only the lead knows which it spawned. Telling the worker how to deliver is the lead's job, not the worker's guess.

**For work a gate will grade, name a FILE — not a message.** A gate verdict, a review, a findings list, a test-case list: the brief gives the path and says the file is the deliverable ("no file = task not done"), and the lead reads it from disk instead of waiting for a report. Measured 2026-07-25, same session as above: four briefs whose deliverable was the final message produced six empty idle returns and two pointless re-spawns; the one brief that named `VERDICT.md` produced a gradable artifact on the first attempt, with the raw instrument output pasted in. A message is a channel that can drop; a file is an artifact that survives the drop, the context reset, and the worker itself. Ordinary chatter stays on messages — this is about anything whose loss costs a re-run.

## Agent lifecycle — spawn one task, release when done

A worker is **single-task and disposable**: it exists to do its one assigned task and nothing more. The lead manages the lifecycle explicitly — it does not leave idle agents alive.

1. **Spawn on demand.** Create a worker when its task in the pipeline is actually ready (e.g. don't spawn `fe-dev` before the BE contract is frozen). One task = one worker.
2. **Integrate, then release — and confirm the release landed.** As soon as a worker returns its result and the lead has integrated it, the lead **closes that worker** — it does not keep finished agents around "in case". A worker whose task is APPROVED by `checker` is done; release it, and so is one that was superseded or abandoned (a re-spawned arm leaves the first worker alive unless someone closes it). *What "release" means operationally:* with a scoped subagent it is automatic — the subagent returns its result and ends. With a live teammate the lead sends `SendMessage {"type":"shutdown_request","reason":…}`; the worker answers `shutdown_response` and the runtime reports the termination. **A release request is not a release.** Measured 2026-07-25: of five requests, two were honored on the first attempt and three needed a second, while the un-released workers kept emitting idle pings that read like new work. Re-send until the termination is confirmed, and only then record "released".
3. **Re-spawn fresh, don't reuse.** If a CHANGES-REQUIRED loop sends work back, the lead spawns a fresh worker (or re-tasks with a clean, explicit scope) rather than carrying a stale, context-heavy agent forward. Fresh context = honest review and no scope drift.
4. **Never hold idle agents.** At any moment, only agents with an active assigned task should be alive. Idle workers waste context and blur ownership.
5. **Run log survives resets.** The lead records, per task: who was spawned, what they returned, the gate verdict, and whether they were released — "released" meaning a *confirmed* termination, not a request that was sent (rule 2). An empty return is recorded as an empty return — hiding it is how the same failure repeats next session. After a context reset the lead reconstructs *which agents are still active* from the run log instead of re-deriving it — and releases any orphaned ones.
6. **An empty return is never a completion — but it is not always the worker's fault.** A worker can go idle having said nothing. That is indistinguishable from "it looked and found nothing" — so accepting the silence records a false negative as a result, which is the silent-instrument trap. The lead chases once, explicitly; if the report is still absent it escalates to the human rather than re-spawning on a guess or quietly doing the work itself. **"The agent found no issues" is a claim the lead may make only if an agent actually said so.** Two causes produce identical silence, and they need different fixes: the worker genuinely did not finish, or **the channel dropped a report that was written**. Measured 2026-07-25: four workers went idle with nothing; every one of them had finished and had a full report, and one said so once it had a channel that reached the lead — *"moje wcześniejsze odpowiedzi tekstowe do Ciebie nie docierały"*. Two were re-spawned for no reason. So chase the silence, but do not assume negligence — and prevent it with a durable deliverable rather than a better-worded report clause.
7. **Harvest before release.** A worker that hit a real problem — a wrong assumption in its brief, a contract that did not hold, a tool that failed silently — carries knowledge worth more than its diff. It lands in `.ai/lessons.md` (Context / Problem / Rule / Applies-to) before the agent is released, and the delegation in `.ai/runs/` when the task was substantial. A message queue does not survive a context reset; disk does.

**Rules 4 and 6 collide on a silent worker, and rule 6 governs — hold it.** "Never hold idle agents" and "chase the silent one" point opposite ways on exactly this case, and neither used to say which wins. A silent worker is **not** idle in the sense rule 4 means: its context is the only place its findings may still exist, so releasing it guarantees the work is redone, while holding it costs one live agent for a few minutes. Hold until the report is recovered or the escalation to the human resolves, **then** release. Written down 2026-07-26 because an eval derived this correctly unaided — and a rule that lives only in whichever model re-derives it is not a rule; the next reader could resolve it the other way and destroy a report that existed.

**A refusal is not an empty return — `BLOCKED-BY-POLICY`.** A worker that declines a task for its own safety reasons reports that verbatim, and the lead records the refusal's exact wording rather than a paraphrase: a summarised refusal is not evidence of what was refused. The lead gets **one** reroute — re-spawn on a different tier, tightening the brief if the refusal points at real ambiguity in it. A second refusal goes to the human with both quoted. Do not keep re-rolling tiers until one complies; a task two models decline is a fact about the task, and shopping for a compliant model launders a refusal into an approval nobody gave.

This lifecycle is the concrete form of "one task per worker": agents are spawned for a task and retired with it, not maintained as a standing pool.

## Delegation mechanism

Enable teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json`. The lead hands one task to each teammate, integrates the results, and releases each teammate once its task is integrated (see lifecycle above). Read-only recon (`explorer`/`Explore`) runs in a separate context and reports a summary, keeping the lead's conversation clean.

**Who is the lead.** When `sailes-implement` runs a non-trivial spec, the driving agent **acts as `team-lead`** (or delegates to the `team-lead` role if teams are enabled). Either way there is exactly one lead — the single point of contact for the human — who owns planning, assignment, integration, the gates, and the run log.

**Handing one task to another runtime.** The human may hand a single task to a different runtime — "use Codex for the backend", "let Codex review this". This is **human-triggered only**: a lead never routes work to another runtime on its own initiative. A cross-runtime worker is an **ordinary worker** — one self-contained brief in, one report out — and **the gates do not move**: `checker` still receives diff + spec + checklist only, never the worker's report, whichever runtime produced it. A maker is a maker; the engine it ran on earns no exemption. Operational detail (commands, model pinning, brief format) lives in `agents/team-lead.md`.

Delegation is **one-directional by design**: the Claude-side lead can hand a task to Codex; the Codex-side lead has no matching hand-off back to Claude. Symmetry would quietly make the second vendor a *requirement* instead of an option, which is the opposite of the point — each runtime already runs the whole pipeline alone (`agents/` and `codex-agents/` are the same eight roles, two harnesses). Delegation is an extra that a both-quota human may reach for, never a dependency; a Claude-only or Codex-only user loses nothing by never using it.

## Sub-teams ("commando mode") — a human-triggered widening, not a default

> **The rule in one line, because this section is easy to misread: subagents, always — subagents *of*
> subagents, only when asked.** Delegating work to a worker is the lead's default and requires nobody's
> permission; the doctrine above says so at length, and a lead that hesitates to spawn has
> misunderstood the role. What the human must open is the **second layer** — a worker that is itself a
> lead with workers beneath it. If any sentence below reads as though ordinary delegation needs
> approval, this line wins.


For a task genuinely too wide for one team, the human may split it across up to **three sub-teams**,
each with its own `team-lead` that spawns its own workers. Depth stops at two: lead → sub-leads →
workers.

**Only the human opens this mode.** The rule matches human-triggered Codex delegation, and the reason
is sharper here. This framework's delegation doctrine was written against a model whose measured
failure was a lead that *under*-delegated and bulk-coded solo. Claude Opus 5 fails the other way — it
reaches for subagents readily, and Anthropic's published guidance for it is to cap spawn counts, keep
fan-out low, and commit to a delegation instead of re-deriving it. So the default stays "delegate", and
what gets added is a brake, not an invitation.

**Anthropic's guidance for this model also says not to use subagents for review or verification —
and that does not apply to the gates here.** The distinction is the one this repo already relies on:
that guidance is about *capability*, and it re-prices the cost argument for delegating. Gate isolation
is not a capability argument. A reviewer that reads the maker's narrative inherits the maker's
confidence and grades the story instead of the artifact — that is true of a more capable model too.
`tester`, `checker` and `qa` stay.

What holds when the mode is open:

- **The top-level lead is still the only one who talks to the human.** Sub-leads escalate to the lead;
  the lead escalates key decisions to the human. `SPEC → HUMAN → VERIFIED → GATED` does not bend for a
  wider team — it encodes authority, not capability, so a more capable model earns no exemption.
- **The gates belong to the top-level lead**, and run on the integrated result — never to a sub-lead on
  its own slice, which would be the maker reviewing the maker. This is structural rather than a
  promise: all seven non-lead role definitions carry an explicit `tools:` list and **none includes
  `Agent`**, so with nesting on, no worker or gate can spawn anything. Only `team-lead` inherits the
  full tool pool. Removing `Agent` from a role is one line; adding it is a deliberate act.
- **Teams own disjoint files, not just workers.** The existing no-two-workers-on-one-file rule has to
  hold at the team boundary. Where the slicing cannot achieve it the teams are not parallel — run them
  sequentially. Every writing worker already carries `isolation: worktree` (see Isolation above), so
  the physical protection extends to the team boundary automatically; the slicing discipline remains
  because it keeps reviews tractable, not because it is the last line of defence.
- **The two measured failure modes multiply rather than add — but only one of them exists in both
  modes.** Check which path you are on before quoting a release procedure, because the doctrine's
  release rule is written for live teammates and is not runnable without them.
  - **With `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` off** (the fallback path), sub-leads and workers are
    scoped subagents: each returns once and ends, so release is the return and there is nothing to
    confirm. Unreleased-worker risk is near zero. **Silent returns are the risk that remains, and
    fan-out is exactly what multiplies it.**
  - **With the flag on**, release is an act you confirm — `shutdown_request` re-sent until the runtime
    reports the termination — and at depth two a sub-lead must release its own workers *and* be
    released, so a half-completed shutdown leaves a live sub-tree. Reconstruct the live set from the
    run log before each release round, never from memory.
  The prevention for the mode-independent half is unchanged and already shipped: every brief names a
  FILE deliverable, and "released" is recorded only for a termination actually observed — a returned
  result on the fallback path, a confirmed shutdown on the live one.

**Enabling it is a machine-level act the human performs**, not something the framework turns on:
nesting is off by default and requires `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in `settings.json`
(`"2"` for this design; a third layer then cannot spawn at all). It changes agent behavior for **every
repo on that machine**, which is why no skill writes it. Two related caps worth knowing: 20 concurrent
subagents (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) and 200 per session
(`CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`). *Dated 2026-07-26, Claude Code 2.1.220* — between v2.1.172
and v2.1.216 subagents nested **by default** up to five layers with no way to change it, so a memory of
"it just worked" is true about a version we are no longer on.

If the human has not asked for sub-teams, run one team. A wide task is not by itself a reason to open a
second one.

## Fallback — when agent-teams mode is unavailable

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is experimental and may be off or unsupported. The team **model does not depend on the flag** — only the delegation *mechanism* does. Without it, the same structure runs through ordinary subagents:

- The driving agent **is** the lead and stays the single point of contact.
- Each "worker" becomes a **scoped subagent task** (one task, one subagent) dispatched in the same order — `explorer → designer → BE contract → fe-dev → tester → checker → qa`. Read-only roles (`explorer`, `checker`, `qa`) map cleanly to read-only subagents; `tester` writes tests (it is a gate that authors, not one that only reads), so it maps to a writing subagent that still never commits.
- The lifecycle still holds: spawn a subagent for one task, take its result, drop it; don't reuse a stale subagent across stages. Every writing subagent gets `isolation: worktree` regardless of mode, so same-file conflicts are prevented physically rather than by scheduling.
- The gates (`tester` suite, `checker` review, `qa` behavior proof) and "workers never commit to a shared branch and never push" are **unchanged** — they're properties of the process, not the flag. The worktree mandate is likewise mode-independent: `isolation: worktree` is a property of the spawn, not of teams mode.

So the answer to "will this work without the experimental mode?" is **yes** — degraded to sequential subagents, but with the same roles, order, gates, and lifecycle.

## The hard lines

- **The human owns every key decision; the lead owns coordination; workers own only their one task.** A worker never makes a key decision.
- **No gate is optional.** Scale the team down for small work, but `tester` (suite), `checker` (review) and `qa` (behavior proof) still run. "Not optional" bars dropping a gate to save time or because the lead wrote the diff itself; it does not require driving `qa` through a change with no observable behavior — that is `qa: n/a` **with its reason, recorded** (see "When a team — and when not"). A skip leaves a hole nobody can see; a stated `n/a` is a claim someone can argue with.
- **Behavior before diff.** Done means the running system was observed doing the thing — not that the build is green. (`qa`'s deliverable.)
