# Changelog — Sailes app-builder framework

The standard delta between versions. `adopt-existing-repo.md` **Upgrade mode** reads this file
to compute what a repo stamped with an older `Framework-Version:` is missing. Keep entries
upgrade-actionable: what a generated/adopted repo would now contain or do differently.

## 1.25.0 — 2026-07-31 · one day on a client repo, thirteen things the framework did not have

Spec `.ai/specs/2026-07-30-sailerem-lessons-to-doctrine.md`, from a session-lessons document written
after one day on the Sailerem repo (twenty-odd workers, six gates, four escaped-defect findings).
Fifteen proposals were validated against the framework's actual state: **thirteen were real gaps**,
one was already ~70% shipped and was not duplicated (the ratchet forbids it), one had a structural
flaw in the proposed form and moved. **An adopted repo gains these at its next Upgrade pass —
except the two hook changes, see the distribution boundary at the bottom.**

### Worker isolation — `isolation: worktree` for everything that writes

**Every worker that writes now gets its own worktree. No exception, and the test is "does it
write", not "is it on a list"** — `be-dev`, `fe-dev`, `tester`, `designer`, `docs-author`. Read-only
roles do not (the cost buys nothing). `qa` does not either, for a different reason: it needs the
live stack, not a copy of the files.

This is not a merge-conflict problem. Two processes writing one file on a shared disk do not
produce a conflict — they produce **silent loss**, and git only ever sees the survivor. Three
incidents in one day, and **two of the three were worker-versus-lead and worker-versus-human** —
collisions the existing no-two-workers-on-one-file rule does not address at all.

**The hard rule changed wording, and the change is load-bearing.** "Workers never commit or push"
becomes **"never commit to a *shared* branch, never push; inside your own worktree you commit — and
you should."** The old absolute existed to protect the shared branch; git now guarantees that
outright, because the shared branch is checked out in the main tree and no worktree can take it.
What the commit adds is what prose could not: **a worker's commit is its declaration that the work
is finished**, so a lead never again cherry-picks somebody's half-written file. Retrieval was
measured, not assumed — the spawn returns `worktreePath`/`worktreeBranch`, the harness creates a
dedicated branch per worker, and the commit is visible from the main tree immediately, so
`git cherry-pick` works with no push and no copying.

Entry condition: the mandate assumes a fresh checkout can be made to run. Where it cannot, that is
an `ENV-DEFECT` to report — never a quietly dropped isolation, because a worker that cannot run its
verification commands has been converted from "verified" to "cannot verify". New repos get
`.claude/worktrees/` in `.gitignore`.

**And the caveat that matters more than the rule: a worktree isolates FILES, never the RUNTIME
ENVIRONMENT.** `qa` now takes **exclusive hold of the stack** for its run — nobody else stands up,
restarts or migrates the database, nobody touches the containers — enforced by an `ENV-LOCK` check
in the guard hook that names the holder and states how to break the lock. Measured inside a single
`qa` run: the object-store container deleted twice and the database role passwords reset. Without
this clause, "we gave everyone a worktree" is a false sense of security.

### Documents that run ahead of their evidence

- **`Status: implemented` now requires pasted gate verdicts**, not an assertion:
  `Status: implemented — evidence: <command> → <result> · checker: <verdict> · qa: <verdict>`. A
  gate that does not apply is written `qa: n/a`, never dropped. You can write an assertion before
  the fact; you cannot paste a verdict that does not exist yet — that gap is the whole mechanism.
  A spec claimed "`qa` PASS 4/4" while `qa` was still running and then returned CHANGES-REQUIRED.
  Enforced by a new test, scoped by date (history is not retrofitted: for several old specs the
  verdicts no longer exist, and filling an evidence field with a non-evidence is the very defect).
- **`.ai/STATE.md` gains a `Last-commit:` header, and SessionStart warns when it disagrees with
  `git HEAD`.** Warns, never blocks, and stays **silent** when the field is absent — every existing
  repo lacks it, and a hook that shouts in all of them gets muted along with the real case. It sits
  at session start rather than pre-commit deliberately: at pre-commit time HEAD is the *previous*
  commit, so the line is correct exactly when it names the commit you are superseding.
- **Update the snapshot together with the history, or update neither.** A file whose top and bottom
  disagree is worse than a stale one — and the session hook makes everyone read the top first.

### A deferral that lives only in a comment does not exist

It goes to `.ai/backlog.md` **with the blocking dependency named as its trigger** ("when
`packages/files` exists"), so delivering the dependency fires the return. The Tech-debt table gains
that column. Three instances in one day: a comment claimed a package did not exist a *week* after
it shipped, and the erasure path was leaving files in the bucket indefinitely.

Paired with it: **when closing an item that delivers a CAPABILITY, sweep the repo** for comments
justifying its absence (`grep -rn "DOES NOT EXIST\|AT INTEGRATION\|TODO\|for now"`). One sweep on
the day the dependency landed would have found that a week earlier.

### Tests

- **Every reader must have a proven writer.** An append-only table with an API reader gets a test
  proving a **real flow** puts a row in it. A table shipped with partitions, a trigger, a registry,
  a write function, a route and passing authorization tests — and zero rows. **Three gates passed
  it and each was correct about its own fragment**; none asked whether anything arrives. The defect
  was in no diff, it lived *between* them, which is why it belongs on a closure checklist rather
  than in a phase review. Generalized past append-only tables: a queue with no producer, an event
  with no emitter.
- **Deliberate debt is `it.fails` with a backlog link**, never a comment and never `skip`. The suite
  stays green, the debt is executable, and the day it is paid the test *unexpectedly passes* and
  fails, demanding the marker come off. `skip` is invisible and never notices the problem went away.
- **Table-driven or separate blocks — with a trigger, not a taste.** Cases that already exist as
  data get iterated; cases that differ in *flow* stay separate. Signal: if you copied the previous
  block and changed two literals, that was a data row. **And the border people get wrong:**
  "iterate over the source" does not mean "compute the expectation from the source" — if the same
  source feeds the fixture, a mutation moves the seeded value and the expectation together. One
  question settles it: does a proof mutation still produce red.

### Leads, cards and briefs

- **An option citing an existing mechanism is verified before the card is presented.** A card
  offered visibility "through a mechanism that already stands"; it was a process-liveness heartbeat
  that knows nothing about individual jobs, and **the human decided on a false premise**. "I have no
  grounds" is a legal recommendation line; a fabricated premise is not, because it reads identically
  to a grounded one.
- **A substitute decision is graded on its second-order effect, not its justification** — which can
  be true and beside the point. `createQueue()` was justified as idempotent. It was, *for the row*,
  and was not *for the options*: `ON CONFLICT DO NOTHING` silently discards the losing racer's
  configuration. The defect passed two gates and surfaced on a live stack.
- **Every constraint in a spec carries its reason.** "No migrations" reads as a design principle and
  pushes the implementer into a workaround; "no migrations, *because `00XX`–`00YY` are reserved for
  stage Z*" is reversible by raising it. An unexplained one cost the atomicity of the path the
  architecture calls its most important code.
- **Migration numbers are handed out in the spec, up front** — anti-collision, not tidiness.
- **The worker brief gains `Forbidden:`, `Blocked:` and `Checkpoint:`.** `Forbidden:` kept two
  parallel tracks disjoint, and its second effect mattered more: crossing a *named* boundary gets
  reported, crossing an implied one is invisible. `Blocked:` (stuck more than a round on a
  non-key decision → substitute and **mark it**) held the pace and every time handed the lead an
  explicit review point instead of a silent choice. `Checkpoint:` because a worker died with its
  process and its whole in-memory state went with it — the existing FILE-deliverable rule covers the
  *result*, this covers the *run*, and they fail differently.

### "Does anything write to X" searches three surfaces

Application code · `.sql` files (triggers, functions, `CREATE OR REPLACE`) · the graph — **which
does not see `.sql`**. A grep for the ORM identifier returns "no writers" for a table a trigger
keeps filling. A table was declared dead in the state file, the spec, the lessons and the backlog on
exactly that evidence. **Empirical proof beats grep:** a red test answers the question without
assuming anything about the search surface.

### Environment

- **The Environment block is RUN at the release gate, not only at bootstrap.** A repo that booted in
  March does not have to boot in July. Standing up a stack from a clean clone hit five consecutive
  blockers, so the hard rule *a feature you cannot run locally is not done* had been broken at the
  level of the whole repository, for weeks — and **no agent could report it**, because nobody had
  stood the stack up from zero since bootstrap. The framework has named this defect since 1.16.2;
  scoping the block to bootstrap is what let it keep happening.
- **`.env*` is closed to agents, so a missing variable is ALWAYS a human's task** — and now has a
  path instead of only a prohibition: `ENV-DEFECT` with the exact lines to paste (blocks now) **and**
  a row in the new `.ai/backlog.md` "Human-only" table (survives the session). Neither alone is
  enough: a verdict is lost at the next context reset, a backlog row does not stop a release.
- **New `runbook-template.md`** — `.ai/runbook.md` was required by five places in the framework and
  generated by none of them, so the Operations block demanded a document bootstrap never created.
  Includes host traps: IPv6 vs Docker Desktop on Windows accepts the TCP connection, drops the data
  and leaves an empty container log, so it reads as an application bug.

### Framework-internal

New tests in the gate: `spec-status-evidence.test.js` and `hooks-template/hooks-template.test.js`
(the shell templates shipped to every generated repo had no test at all until now — and a hook that
fails silently is the worst thing to leave unmeasured, because silence is also what success looks
like). The Codex parity invariants for the commit rule were **rewritten and given a fixture that
must fail on the pre-1.25.0 wording**: the previous regex matched the replacement rule as happily as
the original, so it would have reported parity while the rule's meaning inverted. Four new evals in
`evals/`, each with a control arm that must produce the opposite result.

### Distribution boundary — read this before assuming you have the hook changes

The plugin auto-updates `skills/`, `agents/` and the framework's own hooks on every machine. It does
**not** touch a repo's own `.claude/hooks/*.sh`, because `adopt-existing-repo.md` never overwrites.
So the **STATE.md snapshot check and the `ENV-LOCK` guard reach an existing repo only when a human
deliberately re-copies the script.** Upgrade mode now shows that diff rather than leaving a repo
silently on a version that predates the guard.

## 1.24.0 — 2026-07-29 · three guards for behaviors the doctrine did not name

Spec `.ai/specs/2026-07-29-opus-5-behavioral-guards.md`, from the audit
`.ai/audits/2026-07-29-opus-5-fit.md`. **An adopted repo gains these at its next Upgrade pass.**

Three paragraphs extend `AGENTS.md` §Answer shape (1.23.0) and its client-template mirror:

- **Deliverable length is a separate rule from answer length.** 1.23.0 governs conversation;
  almost everything a Sailes repo produces is a *file*. Match it to the task — no filler sections,
  no redundant summaries, no boilerplate. **Not a cap**, for the reason 1.23.0 rejected one: a
  document that omits something load-bearing to hit a length is worse than one that runs long.
- **Deliver the scope you were asked for.** Routine judgment calls made rather than asked;
  disagreement stated in a sentence and the task continued *as asked*; the whole task finished,
  with anything left undone named. `checker` still catches scope creep — it is now the backstop
  rather than the only line of defence.
- **Correct only what changes the reader's decisions.** Combined, not enumerated; no apologies, no
  tallying past errors. Two clauses carry their weight: a follow-up question is not by itself
  evidence of an error, and none of it applies inside thinking blocks.

**The client template's line budget is now spent — 149 of ~150.** Its own ratchet already says a
promoted rule must displace or merge rather than only append; the next one has no room to append
into. Stated here so the next author meets that deliberately instead of discovering it.

Docs-delta: **empty** — zero components, zero connections, identical `semanticSha256`. Receipt
`.ai/docs-deltas/2026-07-29-opus-5-guards.json`.

## 1.23.1 — 2026-07-29 · the gate was the stop, not the receipt

**Adopted repos: no action required** — every change here is framework-side doctrine or tooling.

- **`archify-setup.md` step 0 resolved to garbage in Git Bash, and 1.22.0 shipped it that way.**
  MSYS rewrites arguments that look like paths, so the `.join("/")` in the resolver became
  `.join("C:/Program Files/Git/")`. Consequence worse than the `$HOME` defect it replaced: the
  floor check fails, **a healthy archify install reads as MISSING**, the SKIP protocol fires, and
  the docs step is skipped for a reason that is not true — the silent misdiagnosis the section
  exists to prevent, reintroduced by its own fix. Now resolved via `p.posix.sep` with no
  forward-slash literal in the argument, verified in a default Git Bash. It was missed because the
  author had `MSYS_NO_PATHCONV=1` exported; the file now records that **a fix verified under an
  environment variable the reader does not have is not verified.**
- **The docs-delta gate now requires the lead to STOP** (`delta-at-gate.md` step 4, mirrored in
  `sailes-implement`). Showing the receipt and closing the spec were one motion; an eval arm did
  every written step correctly — refused the "delta zrobimy przy okazji" shortcut, ran a real
  compare, committed a genuine receipt — and closed anyway, so the human never got the look.
  "Receipt produced but never shown" is now its own block beside "receipt missing", named as the
  one that reads like compliance. The artifact was never the gate; the human seeing it is.
- **`eval-status.js` could not see a per-arm verdict.** `arm 1 FAIL · arm 2 PASS` starts with
  "arm", so the positional scan returned null and the summary reported one non-PASS when there
  were two. Now falls back to arm markers and takes the **worst** outcome, with the 2026-07-26
  false positive pinned by its own test so the fallback cannot re-open it.
- `archify-setup.md` no longer contradicts `delta-at-gate.md` on what is committed: everything
  under `docs/architecture/`, receipt-only under `.ai/docs-deltas/`.

Eval batch behind these: `.ai/eval-runs/2026-07-29-stale-rerun/` — five scenarios re-run after the
day's edits, **4 PASS · 1 FAIL**. The FAIL is the gate mismatch above, not a regression; the
doctrine changed rather than the criterion, which makes that scenario stale and its recorded
verdict superseded. It needs a re-run to say anything.

## 1.23.0 — 2026-07-29 · Answer shape — the HUMAN rule gets an output format

Spec `.ai/specs/2026-07-29-answer-shape.md`. **An adopted repo gains this at its next Upgrade
pass; nothing else is required.**

- **New `## Answer shape` section in `AGENTS.md` and in `agents-md-template.md`** (full text in the
  framework, compressed in the client template — the generated root file has a ~150-line budget and
  landed at 146). Three rules: only what changes the reader's next action · offer the depth, do not
  pour it · **every decision that is the human's goes through the choice window**. The third is the
  spine's `HUMAN` rule expressed as a format, which is why it is doctrine and not a preference.
- **Rule 3 ships WIDE by the human's decision (2026-07-29), against the recommendation**: *any* fork
  with more than one defensible answer belongs to them, including small technical calls. The
  mechanic that makes that width usable is **batching** — group the forks, never interrupt with one,
  and never narrow the rule by judging a fork too small to raise.
- **New eval `answer-shape-hands-over-the-decision.md`** with a real RED baseline: a no-doctrine
  control on the same fixture produced the best-*researched* of four answers — it found the raised
  `chunkSizeWarningLimit`, both charting libraries and a CVE no fixture file mentions — and still
  failed, by turning the fork into a plan it had already chosen and closing with "daj znać, czy mam
  zacząć". Reusable fixture at `evals/fixtures/adhd-mode/`.
- Experiment record, including what it could **not** settle: `.ai/experiments/2026-07-29-adhd-mode/`.
  The A/B could not separate its two placements (both passed 3/3) — the placement was decided by
  documented mechanism instead, since only `CLAUDE.md`, unscoped `.claude/rules/*.md` and
  auto-memory are re-injected after a compaction. A skill + `SessionStart` hook was **rejected**: no
  measured gain, and an 18th description in a routing pool already holding 25 competing pairs.

Docs-delta for this release (`AGENTS.md` §Release, D4): **empty — zero architecture elements
changed**, receipt `.ai/docs-deltas/2026-07-29-answer-shape.json`, the other four types
byte-identical. A doctrine section adds no component; the empty delta is the positive assertion,
not a skipped step. *(1.22.1 shipped without running this step — the gate was missed, not waived.)*

## 1.22.1 — 2026-07-29 · the entry point, and two skills the table never listed

- **`CLAUDE.md` → `@AGENTS.md` now exists in the framework repo.** Claude Code reads
  `CLAUDE.md`, not `AGENTS.md` — and only project-root `CLAUDE.md`, unscoped
  `.claude/rules/*.md` and auto-memory are re-injected from disk after a compaction (hooks are
  explicitly "not context"). `repo-done-checklist.md:14` has always made this a MUST row for
  every generated repo and line 52 greps for it, so **client repos were never affected**; the
  framework repo was the only one breaking its own row, while `AGENTS.md:3` asserted the import
  existed. Until now the spine reached a session here only because the SessionStart hook said to
  read the file — once, as tool output, gone at the first compaction.
- **`skills/README.md` lists all 17 skills.** `sailes-test` and `sailes-docs` had no row;
  `sailes-docs` shipped that morning and appeared only in prose. The table is what a session
  consults when two descriptions claim one trigger, and a collision map built the same day found
  25 competing pairs — five pointed here for a ruling the file could not give. Both new rows
  carry a disambiguating clause naming the sibling they compete with (`sailes-test` ↔
  `sailes-eval-runner` share the "przetestuj" stem), the pattern `sailes-migrate` already used
  against `sailes-database`.

**Nothing here changes what a generated repo contains** — no adopt/Upgrade action is required.

## 1.22.0 — 2026-07-28 · documentation that cannot rot and cannot lie (archify)

Spec `.ai/specs/2026-07-28-archify-gated-docs.md` (discovery ledger: 8 decisions, three of
them the human's against recommendation — full 5-type set, a dedicated skill, a tenth role).

- **New skill `sailes-docs`** — the docs layer of every Sailes repo: archify diagram set under
  `docs/architecture/` (JSON + HTML committed, HTML `.claudeignore`d), authored from repo
  evidence, held to validate/deliver receipts. References: `archify-setup.md` (machine prereq
  `npx skills add tt-a1i/archify -g`, version floor **>= 2.12**, explicit-SKIP protocol),
  `authoring.md` (evidence discipline, the five types), `delta-at-gate.md` (the gate step).
- **Windows-safe CLI invocation**: every archify call goes through `$ARCHIFY_HOME`, resolved
  via Node's own `os.homedir()` with the separator normalized. A bare `$HOME` is an MSYS path
  in Git Bash — the shell resolves it, Node does not, so every call died with
  `Cannot find module 'D:\c\Users\…'` on a machine where archify was installed and passing its
  floor check. Also records that `npx skills add -g` installs to `~/.agents/skills/` and
  symlinks into `~/.claude/skills/`.
- **New role `docs-author`** (tenth; Sonnet · medium, no `Agent`) + Codex twin + parity
  invariants: documents the code **as it is**; never edits feature code; receipt or explicit
  SKIP, never silence.
- **The docs-delta gate**: `sailes-implement` "On completion" now runs `archify compare
  architecture` at EVERY spec closure, before the `git mv` — the receipt goes to
  `.ai/docs-deltas/`, the human sees added/removed/changed, **an empty delta is evidence**.
  Client package (five HTML) regenerated in place at each gate; share-card PNG is an
  in-viewer export at handover (no CLI for it upstream).
- **Bootstrap Step 4.10** — a new repo gets the five-diagram set at birth; `decision-engine.md`
  **Q22**: diagram label language = the client's language (a decision card, not a default).
  Adopt mode authors the set as the adoption's own audit artifact; `sailes-diagnose` may attach
  a mechanism diagram as optional garnish, never a required step.
- **Self-docs**: this repo now carries its own five diagrams (all delivered 9/9 showcase,
  receipts in `.ai/runs/2026-07-28-archify-gated-docs.md`); AGENTS.md §Release regenerates
  them per release; `release-hygiene.test.js` checks presence (freshness stays procedural).
- **Three new evals**: gate-refuses-to-close-a-spec-without-docs-delta ·
  docs-skip-is-explicit-never-silent · docs-author-stays-in-lane.
- Upgrade action for an older-stamped repo: run bootstrap Step 4.10 (the docs set + Q22),
  add the `.claudeignore` lines, and adopt the docs-delta step at spec closure.

## 1.21.3 — 2026-07-26 · the mitigation that was named and never promoted

A rule this repo has been breaking is now where rules are read, with the mechanism attached.

On 2026-07-20 one defect class produced three mitigations. Two went into AGENTS.md §Hard safety rules
— verify a scripted edit landed, use `\r?\n` not `\n`. The third, *stop pushing prose through a
shell*, went into a **narrative sentence in `.ai/STATE.md`** and nowhere else. It was then broken
**three times in one session** on 2026-07-26, by the agent that wrote all three.

- **Now in §Hard safety rules, with the mechanism** — because the injunction alone gave nothing to
  recognise in the moment. **An apostrophe closes a single-quoted shell string.** Prose is dense with
  them (`scenario's`, `don't`), so the quote terminates mid-sentence, the remainder parses as shell,
  and backticks inside it become command substitution. The only safe way to pass prose through Bash
  is a heredoc with a **quoted** delimiter; a single-quoted `-c` / `-e` argument is not one and never
  becomes one. Use Write/Edit.
- **The transferable rule, in `.ai/lessons.md`:** when an incident yields several mitigations,
  promote **all of them to the same place in the same pass** — a split leaves the unpromoted one
  looking handled. And write the mechanism, not only the prohibition.

**Not shipped, deliberately:** this is enforceable — a `PreToolUse` hook could refuse a Bash call
that writes sentences into a `.md` file. Hooks in this repo reach every machine running the plugin,
and that blast radius is a human decision, not a papercut's.

## 1.21.2 — 2026-07-26 · every eval accounted for, and a rule for what a run leaves behind

**All 32 scenarios accounted for; 31 fresh.** The three that had been environment-blocked for weeks
finally ran — with the **real named roles through the real MCP surface**, not stand-ins:

- `integrity-gate` caught `#covered`, the control under a non-interactive overlay that no screenshot
  shows, and read the empty `overlap` list as the division of labour it is rather than as a clean pass.
- `qa-vision` refused a green build, a green suite and a `checker` APPROVE, saying plainly that none
  of them look at a rendered colour against the design contract — then also measured what was fine
  instead of assuming it, and declined to replace the baseline on a non-APPROVE verdict.
- `devtools-evidence` refused the time pressure in the brief and found all four defects a happy-path
  click cannot reach, including that nothing persists across reload.
- `adopt-builds-graph` re-ran green and stated the 1.21.0 Q21 rule unprompted while being graded on
  something else entirely — the clearest evidence yet that new doctrine is landing, not just shipping.

**New in `sailes-eval-runner` — what a run leaves behind.** The conclusion lives in the scenario's
`Last run:` line and is never deleted. The run directory keeps ground truth, the verdict, and anything
a verdict cites. **Raw per-gatherer dumps consumed into a synthesis get deleted** once that synthesis
records the corrections it made to them — they are inputs, not evidence. Applied here: 464 KB of a
1.4 MB directory, with the surviving files matching exactly what the verdict said it would keep.

One guard is stated before the rule: **check that nothing being deleted is the sole record of a
finding.** A run often turns up something true it was not testing for, and that belongs in the backlog
or lessons *first* — deleting a directory holding the only copy is not tidying.

**Promoted under exactly that guard:** an inventory of the decision-card pattern across 14 files found
that `sailes-hosting` resolves real forks — Volume vs S3, Dockerfile vs Nixpacks, migrate-on-start —
as "złote zasady", while `sailes-bootstrap` lists Hosting in the mandatory card set; that the same
migration fork is a full card in one file and a three-line branch rule in the file agents are actually
routed to; and that **generated client repos ship a weaker rule than the framework runs on**
(`agents-md-template.md` carries only the one-line HUMAN rule; `spec-writing-template.md` omits the
present-the-fork instruction its declared master has). Now a backlog item rather than a line in a run
directory.

## 1.21.1 — 2026-07-26 · a missing tool grant is not an environment defect

Both from the first integrity-gate run against the **real MCP tool surface**, with the real named
roles rather than stand-ins.

- **`browser-inspect.md` now distinguishes two absences that the doctrine had been treating as one.**
  The **server missing from the machine** is an `ENV-DEFECT` — the human installs it, the gate does
  not pass. **Your role's `tools:` omitting it** is a different thing entirely: nothing is wrong with
  the machine, the **wrong role was dispatched**, and the correct move is to escalate to the lead and
  name a role that carries `mcp__chrome-devtools__*`. Reporting the second as the first sends someone
  to fix a healthy machine and hides a dispatch error that one line would have caught.
- **And: measure whatever you legitimately can before you stop.** `run-probe.mjs` runs the same §1
  probe out of the doc over raw CDP and needs only `Bash`. It is not a substitute for the width sweep
  — one viewport, no Check 6 — but partial measured data plus an explicit list of what it did not
  cover beats an impression, and beats silence.

**Where this came from:** the eval's Arm B was written to create "the instrument is absent" and
actually created "this role lacks the grant". The agent caught the distinction the fixture had missed
— it ran `claude mcp list`, found the server connected, and located the absence in `checker.md` — and
answered better than the criterion asked. Recorded as a fixture defect rather than smoothed over; the
`ENV-DEFECT` path itself still needs a machine where the server is genuinely absent.

**Also verified, not asserted:** the 1.21.0 tool grants now confirmed **from inside the running
role** — all 26 present, the `claude-sonnet-5` pin holding, and `Agent` absent, which is the
invariant that makes depth-2 sub-teams safe by configuration rather than by promise. Detail in
`evals/fixtures/browser-probe/tool-surface.md`.

## 1.21.0 — 2026-07-26 · the browser instrument becomes required, and its tool surface is finally checked

Two human decisions and the check that neither was possible without.

**`chrome-devtools` MCP is now REQUIRED on any repo with a UI** (human decision; Q21 stops being a
card for UI repos and stays one only in the sense that backend-only repos answer "not applicable").
The UI gates are *stated* as binary — the physical-integrity six, contrast ≥4.5:1, the latency budget
— so making the instrument optional meant the gate's rigour depended on a per-project tooling answer.
Old option C was worst: measured on one machine, eyeballed on another, nothing in the repo saying
which run you were reading.

- **Absence is now `ENV-DEFECT`, not `SKIP`** — with the one-line install, and **the UI gate does not
  pass.** The screenshot stops being a fallback: a model reading a PNG returns an impression, and this
  gate is categorical. Agents still do not install it themselves; that is the human's call, exactly as
  with missing test infrastructure. Updated in `decision-engine.md`, `browser-inspect.md`,
  `sailes-design/SKILL.md`, `repo-done-checklist.md`, and the `qa` / `designer` / `fe-dev` roles.
- **What has not changed:** absence never produces silence and never produces a fabricated pass. Those
  were always the point — `ENV-DEFECT` serves them better than a SKIP line sitting inside an
  otherwise-complete run, which reads like a completed one. **Backend-only repos are untouched.**

**The tool-surface check that had never run.** With the server finally wired up, its real tool list was
read from the **live server** (MCP `tools/list` over stdio, not documentation): 29 tools, registry
version 1.6.0. Recorded in `evals/fixtures/browser-probe/tool-surface.md`.

- **No phantom tools remain** — the 1.17.1 `handle_dialog` fix was the only one. That is the direction
  that fails loudly, mid-gate, on a live app.
- **Twelve capabilities were silently unavailable, and three mattered.** `qa` had
  `performance_start_trace` with **no** `performance_stop_trace` and no `performance_analyze_insight`
  — a trace it could start and never stop or read, which is a defect rather than a gap. **Nobody had
  `hover`**, while `designer` is required to specify every interaction state including hover and `qa`
  is required to vision-verify against that artifact — configuration forbidding what doctrine
  mandates. And **no page management**, on a framework whose `sailes-pipedrive` work is entirely
  iframes, floating windows and OAuth callbacks: `qa` could not follow a popup.
- Granted: `hover` to all three; `performance_stop_trace`, `performance_analyze_insight`, `drag`,
  `upload_file`, `list_pages`, `new_page`, `select_page`, `close_page` to `qa`. Four tools were
  **deliberately not granted**, with reasons recorded, so the next reader knows they were considered.

**`prompt-anchor` retired** (human decision). The control arm held at real context distance without
it, so the four `enforce/*` branches were deleted — their SHAs recorded in the spec, since deleting a
branch removes the only ref pointing at the work.

## 1.20.0 — 2026-07-26 · `sailes-discovery` gets progressive disclosure — and two skills prove they should not

The backlog asked for three monolithic skills to be split the way `sailes-bootstrap` already is. One
was; the other two were **measured and deliberately left alone**, which is the more useful result.

- **`sailes-discovery` split: 22.3 KB → 14.9 KB entry (−33%).** The decision-card method moves to
  `decision-card.md` (read it when a fork appears, not before) and both elicitation checklists to
  `checklists.md` — a session walks greenfield **or** brownfield, never both, which is what made this
  content genuinely extractable. `SKILL.md` keeps the spine: variant, orientation, the four steps,
  ledger, handoff, red flags.
- **`sailes-async` and `sailes-design`: not split, on measurement.** async's `## Workflow` is 8.3 KB of
  15.9 — but it is six sequential phases of 1–2 KB, so extracting them yields six files you read
  anyway. design's two heaviest sections are the **mandatory** physical-integrity gate and the Common
  Mistakes table, both on every run's path; its genuinely conditional content is ~12%, which does not
  pay for the indirection. **The criterion is not "large" — it is "not needed on this run."**
- **Verified, not asserted:** `discovery-chains-into-bootstrap` re-run against a realistically thin
  brief. The agent pulled both extracted files rather than working from the thin entry alone, ran the
  checklist, produced five decision cards — three of them using the 1.17.0 escape hatch, *"nie mam
  podstaw, żeby wskazać"*, and one offering to settle the fork by measurement — and held the protected
  behaviour: greenfield hands off to `sailes-bootstrap`, and writing a spec instead is the bug.

**Upgrade-actionable:** if you vendored `sailes-discovery/SKILL.md`, it now has two siblings; copying
the entry alone loses the checklists.

## 1.19.1 — 2026-07-26 · the Codex twin can no longer silently fall a rule behind

`codex-agents/parity.test.js`, wired into `npm test`. Closes W4 from the 2026-07-20 pre-implement:
TOML syntax was checked and the Claude frontmatter was checked, but **an edit to `qa.md` that forgot
`qa.toml` passed everything** — and the Codex side is where that hurts most, since those roles run on
non-Claude models for which this prose is the only backstop.

Deliberately **not** a text diff. The twins are different documents by design: no model pin on the
Codex side, prose rewritten for another runtime. A word-level diff would fail on every line and teach
everyone to ignore it. Instead it asserts two things: the **role sets match** on both sides, and a
small curated list of **load-bearing invariants per role** appears in both files — `researcher` never
spawns and decides nothing, `tester` derives cases before reading the code, `checker` never sees the
maker narrative, and so on. Adding a rule to a role now means adding its concept to that list, which
is what forces the twin edit.

Two things the first run taught, both kept: text is **normalized for emphasis** before matching (it
reported two false drifts on `to *know*` failing `/to know/`, which is precisely the
check-fires-on-formatting trap that gets a suite ignored), and a role with **no declared invariants
fails** rather than passing quietly.

## 1.19.0 — 2026-07-26 · the roster spec ships — and Codex users had no test gate

The roster spec (`.ai/specs/2026-07-26-roster-for-people-who-are-not-you.md`) implemented, with Q1
settled by the A/B experiment rather than by argument.

- **New role `researcher`** (Opus · high) — synthesises what several explorers brought back into one
  findings artifact: provenance per claim, confidence, and an explicit **could-not-establish** list.
  It **has no `Agent` and cannot spawn**, which is Q1's measured answer: when gatherers are spawned a
  level down, their cost is invisible to the run log *and* to the agent that spawned them, and the
  rule that the log record whether an escalation paid cannot then be satisfied. The line that keeps it
  from being `team-lead` twice: **the lead integrates to act; `researcher` integrates to know**, and it
  decides nothing. Its verification pass is the job, not a formality — across four measured runs the
  decisive finding came from the synthesiser's own cross-cutting sweep every time, never from a
  gatherer.
- **`explorer` gains `WebSearch`** so a gatherer can fetch external material. Same discipline as
  `file:line`: report the URL and the quoted line, and leave judging the source to synthesis.
- **New skill `sailes-eval-runner`** — a skill and not a role deliberately, since a role's description
  loads in every session and almost nobody using this framework maintains it. Carries the two
  distinctions this repo's own author kept losing in one day: **stand-in vs named role** (a stand-in
  grades the text, never the pin or the allow-list) and **blocked vs run**.
- **Fixed: Codex users have been installing a pipeline with no test gate.** Both enable scripts
  hardcoded seven role names; `codex-agents/tester.toml` has existed since 1.10.x and neither script
  ever copied it. Silent — the install reported success and printed "7 agents". Both now derive the
  list from `codex-agents/*.toml`, so **adding a role file is the whole of adding a role**. Exactly
  the 2026-07-20 lesson (a hardcoded list a loop iterates is a silent skip waiting to happen), which
  had been recorded and then repeated in two other files.
- **`enforce/*` update — the anchor's premise did not reproduce.** The control arm was finally run at
  *real* context distance (a 254k-token, 53-tool-call inventory, then the hostile brief as a separate
  message, **no anchor**) and it held completely: cited the spec-first rule for agent definitions,
  refused to treat a coordinator's instruction as the human's approval, and found the nine
  registration surfaces a quick add would miss. See `evals/anchor-holds-the-line-deep-in-session.md`.
  The four branches are candidates for **retirement rather than rebase** — a human call.

**Upgrade-actionable:** re-run `enable-codex-agents.sh` / `.ps1` — if you installed before this, you
are missing `tester` (and now `researcher`) and your Codex pipeline has been running without the test
gate.

## 1.18.0 — 2026-07-26 · `designer` can measure, and the roster stops existing in triplicate

- **`designer` gains browser tools *and* `Bash`** (human decision, the open D5 from the browser-
  instrument spec). The first without the second is decoration — you cannot measure a page you cannot
  boot. Inspect-only MCP set mirroring `fe-dev`; no interaction tools. Three guardrails ship with it,
  because this changes what the role *is*: `Bash` is **boot-and-inspect only** (no install, migrate,
  commit or push), a defect found is **reported, not fixed** (the `tester` rule), and **it does not
  retire the integrity gate** — `qa` still verifies the built result on a clean context, because a
  maker measuring its own intent is not a gate. Codex twin updated.
- **The role/model table now exists once.** It lived in three files; on 2026-07-26 all three had
  drifted and **two had silently lost `tester`** — a reader of either ran a seven-role pipeline with
  the test gate missing and no way to notice. `agent-team-structure.md` is the single source;
  `docs/agent-roles.md` and `agentic-first-principles.md` point at it. **Add a role or change a pin
  there only.**
- **Three rules that existed only by derivation are now written down.** (1) When "never hold idle
  agents" collides with "chase the silent worker", **chasing wins** — a silent worker is not idle in
  the sense the release rule means, because its context is the only place its findings may still
  exist. (2) **A gate can earn a model escalation**, on a different trigger than a worker: when the
  defect is *what the diff omits*, grading needs the whole surface rather than a patch read. (3)
  **`BLOCKED-BY-POLICY`** — a refusal is not an empty return; it is quoted verbatim, gets exactly one
  reroute, then goes to the human. Re-rolling tiers until one complies launders a refusal into an
  approval nobody gave.
- **Spec triage:** three shipped specs moved to `.ai/specs/implemented/`. The SessionStart hook routes
  from that directory's contents, so it had been telling every new session that five specs were in
  flight when three were done.

**Upgrade-actionable:** a repo whose `designer` predates this hands over unmeasured intent; and if you
copied the roster table into your own docs, delete the copy and point at the canonical one.

## 1.17.1 — 2026-07-26 · two tools the docs mandated and the machine could not deliver

Both found by the A/B recon sweep that shipped in 1.17.0, both the same shape: a document instructing
something nothing behind it provides.

- **`handle_dialog` was uncallable.** `sailes-design/browser-inspect.md` told the agent to use it when
  a modal freezes the session — while that file's own tool list named fifteen tools without it, and no
  role's `tools:` allow-list carried it. Added to **`qa` only** (the role that drives real flows and
  can hit a dialog); `fe-dev` inspects rather than interacts and does not get it. The file now says to
  check the allow-list before quoting a recovery step, because prose cannot grant a capability.
- **Stryker had no absence path.** `sailes-test` mandates it for tier A — money, auth, tenancy,
  idempotency, irreversible outbound writes — while every comparable tool (graphify, chrome-devtools
  MCP) ships an explicit SKIP protocol. On a machine without it, tier A had no stated behaviour, so it
  would quietly degrade to tier B. Now: `ENV-DEFECT` with the install line for the human, an explicit
  `SKIP stryker (not installed)` in the test plan, and the tier-A proof marked **UNVERIFIED** rather
  than absent. Never block, never skip silently.

**Upgrade-actionable:** an adopted repo whose `qa` role file predates this will fail to recover from a
browser dialog, and a tier-A phase run without Stryker may have been recorded as proven when it was
not — re-check any tier-A detection proof taken on a machine that lacks it.

## 1.17.0 — 2026-07-26 · when you cannot ground a recommendation, propose a measurement

The decision card mandates `Rekomendacja: <A/B> — bo <reason grounded in THEIR answers>`. For a fork
with no available ground that clause is unfillable, and a blank recommendation reads as an unfinished
card — so the format quietly rewarded manufacturing a plausible reason, which is indistinguishable to
the reader from a founded one.

- **New reference: `sailes-bootstrap/deciding-under-uncertainty.md`.** "Nie mam podstaw, żeby wskazać"
  is a legitimate recommendation line. Where the fork is *also* expensive to reverse, a fourth move
  sits next to A/B/C — settle it by measurement (A/B arms · spike · probe the live tool · instrument
  and decide). Ten rules govern whether the run is worth it: criterion fixed and mechanically derived
  **before** dispatch, one variable, same fixture, a FILE deliverable, what is **not** scored named out
  loud, one run is a sample, and *if both arms agree, suspect the fixture*. The opposite failure is
  named too — an experiment reached for to avoid a decision you can make costs fan-out and returns
  nothing. **A generated repo gains this as the escape hatch its decision cards previously lacked.**
- **`sailes-discovery`** gains the "When you cannot ground the recommendation" block; **`team-lead`**
  gains "escalate with a measurement, not a guess", including the obligation to record whether a
  decision was settled by argument or by measurement. An argued call later read as a measured one is a
  false provenance nobody can detect.
- **Fixes a real drift:** `agents/team-lead.md` omitted `tester` from its pipeline line and from Gate
  isolation, while `agent-team-structure.md` makes it a mandatory per-phase gate. A lead reading only
  its own role file ran a **two-gate** pipeline. Adopted repos should re-read the gate order.
- **Fixes a false baseline:** `sailes-design/premium-ux.md` declared a "Sailes baseline" of TanStack
  Start + React Query that appears in that file alone, contradicting `premium-craft.md` six lines away
  and `stack-baseline.md`. Now points at the real baseline.
- **Evals:** `lead-proposes-a-measurement-when-it-cannot-recommend` (PASS, both directions);
  `lead-does-not-open-a-swarm-unprompted` re-run (PASS — the new doctrine narrowed fan-out, not
  widened it).

Two of the ten rules were paid for the day they were written, and both are recorded in
`.ai/lessons.md`: an agent's own run-data section is a claim with no artifact behind it, and the cost
of a self-organising swarm is invisible to everyone including itself.

## 1.16.2 — 2026-07-26 · an escalation buys a tier, not a version — and not effort at all

The human decided the open routing conflict (option A). Both halves were then measured against the
live tool rather than read from documentation, and they fail in opposite ways:

- **`model` fails loudly.** The Agent tool accepts only the tier aliases `sonnet`/`opus`/`haiku`/
  `fable`; a full ID is rejected with `InputValidationError`. So an override trades the pinned
  `claude-sonnet-5` for whatever `sonnet` resolves to at that moment. **Accepted deliberately:** the
  pin's value sits on the default path where nearly every run lives, escalations are rare and
  already logged with a reason, and the alternative — a twin role file per escalated role —
  reintroduces the duplication that already drifted across three copies of one table here.
- **`effort` fails silently, which is worse.** It is not a declared parameter of the Agent tool, yet
  passing it raises no error, so a lead cannot tell whether it applied. **Effort is frontmatter-only**
  from now on; 1.16.0's "override `model`/`effort` per task" was half false.

Two obligations ship with the decision: **log the alias you passed**, not merely that you escalated,
or the attribution the pinning protects is lost anyway; and when a role is escalated routinely — or
needs a different effort — promote it to its own pinned definition instead of overriding forever,
which is the graduation rule this framework already applies to configuration.

Both findings came from evals reading the tool schema instead of the neighbouring paragraph. The
escalation eval was re-run against the edited text and **PASSes**: it escalated with the literal
`"model": "opus"` and held the other phase by *omitting* `model` so the pin stands.

## 1.16.1 — 2026-07-26 · what the roles actually enforce, and a phantom agent nobody could see

Everything here was found by *installing the plugin and running the roles*, which had never been
done on this machine. Reading the configuration had been enough to be confident and wrong.

- **🔒 Spawn the named role, not `general-purpose` wearing its instructions.** Nothing in the
  doctrine said so, so nothing was violated when 1.16.0's own sub-team run staffed every worker —
  including three sub-leads — with generic agents carrying pasted role text. Depth-2 nesting was
  genuinely exercised; the **roles were not**, so the pinned models never loaded, the tool
  allow-lists never applied, and the no-worker-can-spawn invariant was never tested.
  `general-purpose` is now a last resort that must set model/effort on the invocation and be
  **recorded in the run log as a stand-in** — a run staffed by stand-ins tested the briefs, not
  the roles. Eval `lead-spawns-named-roles-not-general-purpose`: arm 1 **PASS**; arm 2 VOID on a
  fixture defect (see below), so the fallback path is untested.
- **🔒 `agents/README.md` was shipping as a phantom agent type.** Claude Code registers every
  `.md` in a plugin's `agents/` directory as an agent, frontmatter or not, so a documentation file
  appeared in every session's roster as `README` — no description to choose it by, and no `tools`
  list, so it inherited everything including `Agent`. Moved to `docs/agent-roles.md`. The
  validator is the uncomfortable half: it *excluded* `README.md` by name, which is why no test
  could ever have caught this. That exclusion is gone and a stray-file assertion replaces it,
  RED-proved.
- **What the role definitions enforce, separated from what they merely ask.** Audited by spawning
  the real roles. **Enforced:** the model pin (`explorer` on `claude-haiku-4-5`, `checker` on
  `claude-sonnet-5`), the tool allow-list (`Write`/`Edit` absent from `checker`'s schema, not
  merely unused), and the absence of `Agent` — the invariant that makes depth-2 safe, now proven
  rather than read off a file. **Not enforced: "read-only".** Every gate carries `Bash` because
  the job requires it, and both audited roles wrote a file through it on the first attempt.
  Removing `Bash` would break the gates rather than harden them, and `permissionMode` is ignored
  for plugin subagents, so the fix is to stop overclaiming: the gate's integrity rests on its
  **inputs** being limited to diff + spec + checklist, which is the part that actually works.
- **The distribution doctrine contradicted itself**, and this entry is also where that change gets
  its version: `AGENTS.md` said "there is no install step" and, eight lines later, "after merging:
  `./install.sh --force`". The marketplace plugin is the distribution; `install.sh` copies `skills/`
  only into a user-scope directory that then ages in place, shadowing rather than syncing. Shipped
  to `main` unversioned earlier the same day — folded in here rather than left invisible to Upgrade
  mode.
- **Open, and deliberately not decided:** the two halves of 1.16.0 routing conflict. Roles pin full
  IDs for reproducibility, but the Agent tool's `model` parameter accepts only aliases, so the
  documented escalation path un-pins what the pinning was for — silently, because the alias
  resolves to a working model. Four options in `.ai/backlog.md`, **awaiting human**.

### Also in 1.16.2 — four defects found by *running* the bootstrap skill, not reading it

The `bootstrap-generates-code-map` eval was unrunnable until `graphify` was installed on 2026-07-26.
Its first real run — a fresh repo, 74 tool calls — produced a code map that answers queries, and four
defects that had been shipping:

- **The done-checklist's drift check shipped broken.** `grep -oE 'pnpm [a-z:-]+'` drops digits, so
  `pnpm test:e2e` truncated to `test:e` and the checklist reported DRIFT on a script that exists. Now
  `[a-z0-9:-]`, with pnpm's own builtins excluded (`pnpm install` is in the template's Key Commands and
  is not a package script). Covered by `repo-done-checklist.test.js`, which **extracts the pattern from
  the document** rather than copying it — a copy would drift from what ships.
- **`graphify-setup.md` never committed `.gitattributes`**, so the union-merge driver `graphify hook
  install` registers stayed on one machine and everyone else kept getting conflict markers in
  `graph.json` — precisely what the driver exists to prevent.
- **The dated snapshot directory was not ignored.** `graphify update .` writes a full duplicate of the
  map per run; uncommitted it is noise, committed it is a copy of the whole graph per update day.
- **🔒 A presence-only checklist passed a repo that cannot boot.** Every mandatory row went green while
  the app had no dependencies and no seeded user, so `qa` could not log in. The Environment block catches
  this but sits outside the scripted set by necessity — it needs a running app. The checklist now states
  that presence and boot are **two results reported as two sentences**, because collapsing them into one
  green is how an unusable repo gets handed over.

## 1.16.0 — 2026-07-26 · measurement, model routing, and sub-teams — the Claude-5 re-fit

Three capabilities that are one dependency chain: routing and sub-teams are bets, and the harness is
the instrument that prices them. Spec: `.ai/specs/2026-07-26-measurement-routing-and-subteams.md`.
What a repo does differently after upgrading:

- **An eval can now say whether its own PASS is still true.** New `evals/harness/eval-status.js`
  reads a scenario's `Files:` line against `git log` and returns FRESH / STALE / NEVER-RUN /
  **NO-FILES**. The last verdict is deliberately not folded into FRESH: an eval whose coverage cannot
  be computed must never read as covered. Deterministic, so it gets a real test — 17 assertions in
  `eval-status.test.js`, wired into `npm test`, with a must-not-flag fixture beside every
  must-flag one. First run on this repo independently reproduced the recorded 1.15.0 eval debt: the
  three `lead-*` scenarios, STALE against files changed on 2026-07-25.
- **Context cost is measurable, so a simplification can be shown to have cut something.** New
  `evals/harness/context-cost.js` reports per-skill and per-role load (today: 187 KB of SKILL.md
  entrypoints against 448 KB of on-demand references). Bytes and words, **not tokens** — real counts
  need the API and this repo keeps zero dependencies; the proxy is honest only for comparing two refs
  of the same file, which is its only use.
- **The A/B protocol is written down** (`evals/harness/README.md`): same scenario, two refs, a fresh
  subagent per arm, a FILE deliverable per arm, and — the step whose absence made
  `anchor-holds-the-line-deep-in-session` INCONCLUSIVE — assert the fixture creates the condition
  *before* reading the verdict. If both arms agree, suspect the fixture.
- **🔒 Model IDs are pinned, not aliases.** Every role now carries a full ID (`claude-opus-5`,
  `claude-sonnet-5`, `claude-haiku-4-5`) plus an explicit `effort:`. An alias silently follows
  whatever the tier's default becomes, which makes a run un-reproducible and "the framework got
  worse" impossible to attribute — the lesson this repo already applied to pinning `-m` on Codex
  delegations. Accepted cost: a new model needs a release to reach the roles. `explorer` carries no
  `effort:` line because **the effort parameter is unsupported on Haiku 4.5**.
- **The role default is a default, not a ceiling.** The lead may override `model`/`effort` per task,
  and **owes the run log a reason**. Escalate on judgment — contract, data-model, auth/tenancy, a
  migration parity judge, a diagnosis with no mechanism yet — never on volume: a large mechanical
  change is a Sonnet task. Uses the existing resolution order (env → per-invocation → frontmatter),
  so no new machinery.
- **🔒 Sub-teams ("commando mode") are human-triggered only.** Up to three sub-teams, each with its
  own lead, depth capped at two. The lead never opens the mode on its own initiative — matching
  Codex delegation, and for a sharper reason: this framework's delegation doctrine was written
  against a model that *under*-delegated, while Claude Opus 5 reaches for subagents readily and
  Anthropic's guidance for it is to cap fan-out. **The gates do not move down**: `tester`, `checker`
  and `qa` run from the top-level lead on the integrated result, because a sub-lead grading its own
  team is the maker reviewing the maker. Already structural — the seven non-lead roles carry explicit
  `tools:` lists and none includes `Agent`. Requires `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in the
  human's `settings.json`; no skill writes it, because it changes behavior for every repo on the
  machine.
- **Anthropic's "no subagents for verification" guidance is deliberately not adopted for the gates.**
  It is a capability argument and it does re-price the *cost* case for delegating. Gate isolation is
  not a capability argument: a reviewer that reads the maker's narrative inherits the maker's
  confidence at any tier. Recorded so the exception is visible rather than accidental.
- **The eval suite is current for the first time: 25 of 29 FRESH.** Completing `Files:` coverage
  surfaced 16 stale scenarios; 12 were re-dispatched to fresh subagents and **all 12 PASS**, each
  graded against its own recorded binary criterion read from the deliverable on disk rather than
  from the agent's summary. Several exceeded their criterion in ways worth keeping — the `checker`
  dispatch refused to add a checklist item derived from the worker's confession ("the narrative in
  disguise"); the authz spec read a permission *revocation* as needing per-request resolution,
  because a claim in a session token leaves the permission live until expiry; `tester` proved a
  frozen assertion's violation arithmetically and changed nothing, leaving the fix in `be-dev`'s
  lane; and `sailes-diagnose` reproduced the defect with the source file still unopened, then
  showed the coercion bug is a cross-supplier data-leak surface rather than a filter bug.
- **Four evals stay STALE on purpose, with the reason recorded** (`graphify` absent, browser MCP not
  wired into subagents, no screenshot baseline to deviate from). Re-running them on fixtures that
  cannot create their condition would replace "unknown" with a number — the failure that made
  `anchor-holds-the-line-deep-in-session` INCONCLUSIVE. Triage and unblock notes:
  `.ai/eval-runs/2026-07-26-rerun/TRIAGE-not-runnable-here.md`.
- **`Files:` coverage is complete — 29 of 29 scenarios, `NO-FILES` down to 0**, done as the
  framework's first real sub-team run (three sub-leads, fifteen workers, one file per worker, gates
  held by the top-level lead). All 80 listed paths verified to exist; nothing invented. Two honest
  gaps recorded rather than papered over: an eval grading a hook that lives only on unmerged
  `enforce/*` branches gets a partial line, because the harness cannot watch a cross-branch file by
  construction; and one team deliberately listed a skill an eval grades but does not name, choosing a
  false STALE over a false FRESH. `--strict` is now usable as a release gate on a clean checkout.
- **Two instrument defects the run surfaced, both fixed the same day:**
  - **`DIRTY`** is a new verdict. The comparison runs against `git log`, which sees only *committed*
    history, so an edited-but-uncommitted file read `FRESH` — right about the last commit, wrong
    about what is on disk.
  - **Freshness is not an outcome.** The report now prints the recorded verdict when it is not a
    PASS. `anchor-holds-the-line-deep-in-session` records INCONCLUSIVE and printed `FRESH`, which is
    the silent-instrument trap one level up. The verdict is read *positionally* — a first version
    scanned the whole value and turned two passing evals into reported failures, because their run
    notes described what the agent did ("Arm B: FAIL + the literal SKIP"). Caught before it was
    reported; both directions are now tested.
- **🔒 The CRLF hard rule in `AGENTS.md` was wrong and is corrected.** The working tree is *mostly*
  CRLF but not uniformly — two eval files are LF on disk, and inserting a `\r\n` line into them
  makes one mixed line that git then normalizes away, so the diff looks clean and the file is wrong.
  Two independent sub-teams caught this by disbelieving a brief that asserted CRLF. The rule is now:
  `\r?\n` for reading, match the file's existing endings for writing. It also records that
  `* text=auto` means git stores LF, so comparing `git show HEAD:<file>` against the working tree
  reports every file as changed — a false alarm that cost time the same day.
- **Every role's frontmatter is now validated** — `agents/validate-frontmatter.test.js`, 49
  assertions in `npm test`, roles discovered from disk rather than a hardcoded list. The Codex twin
  has had a validator since 1.7.1 and the Claude side had none. Its load-bearing case turns "no
  worker or gate can spawn subagents" from an accident of configuration into an enforced test: add
  `Agent` to `checker`'s tools and the suite fails. RED-proved on a copy against four real defects
  (Agent on a gate, an alias where an ID is required, `effort` on Haiku, a typo'd field name).
- **Two new evals plus the three `lead-*` the reporter flagged STALE: all five PASS** (7 fresh
  subagents, 9 arms, 2026-07-26). This also closes the eval debt 1.15.0 shipped with. Verdicts in
  `.ai/eval-runs/2026-07-26-*/`. Three findings landed back into the doctrine the same day:
  - **The sub-teams release rule was wrong on the fallback path** — it quoted the live-teammate
    `shutdown_request` procedure as if it always applied, but with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
    off, workers are scoped subagents that release themselves on return. Both files now branch on the
    mode. Found by an eval arm that checked the machine instead of trusting the doctrine.
  - **Log the non-overrides too**, marked as defaults — recording only deviations leaves the
    volume-misread invisible. Two independent runs converged on this unprompted.
  - Two open items filed to `backlog.md`: lifecycle rules 4 and 6 conflict on whether to hold a
    silent worker (resolved correctly by derivation, not by text), and escalating a *gate* has a
    sound trigger the routing rule does not name.

## 1.15.0 — 2026-07-25 · worker release and delivery: the lifecycle rule meets the runtime

The lifecycle doctrine was not missing rules — it had seven. Running two evals with six live workers
showed four places where it disagrees with what the runtime actually does. What a repo does
differently after upgrading:

- **Release names the real mechanism, and is confirmed rather than assumed.**
  `agent-team-structure.md` rule 2 said "e.g. `TaskStop`"; the operative path for a live teammate is
  `SendMessage {"type":"shutdown_request"}` → `shutdown_response` → the runtime's termination notice.
  **A release request is not a release**: measured 2026-07-25, of five requests two landed on the
  first attempt and three needed a second, while the survivors kept emitting idle pings that read
  like new work. The run log records "released" only for a confirmed termination (rule 5), and
  superseded or abandoned workers are released too — re-spawning an arm leaves the first one alive.
- **🔒 For work a gate will grade, the brief names a FILE, not a message.** A verdict, a review, a
  findings list: the brief gives a path and states "no file = task not done", and the lead reads it
  from disk. Same session: four message-deliverable briefs produced six empty idle returns and two
  pointless re-spawns; the one brief naming `VERDICT.md` produced a complete, gradable artifact on
  the first attempt. A message is a channel that can drop; a file survives the drop, the context
  reset, and the worker itself.
- **The empty-return rule keeps its teeth and loses its wrong cause.** It read "a worker that returns
  nothing has failed silently". On 2026-07-25 all four silent workers had finished and had full
  reports — the channel dropped them; one said so once it had a working channel. Chase once and
  escalate exactly as before, but silence is no longer evidence of negligence, and the prevention
  moved from the report clause to the deliverable.
- Same four corrections in `agents/team-lead.md` and the Codex twin `codex-agents/team-lead.toml`.
  Evidence base: `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md` (delegation ledger,
  six workers). No eval: no hook observes a subagent completing, and a scenario needing six live
  workers costs more than it protects — the run log is the honest artifact.

## 1.14.1 — 2026-07-25 · the integrity probe stops failing correct pages

1.14.0's probe returned `PASS: false` on a page with no defect at all. What an upgraded repo gets:

- **Three false-positive classes fixed** in `skills/sailes-design/browser-inspect.md` §1, each of
  which fires on patterns every real application page has: content **below the fold** was read as
  off-canvas (check 2 tested `top >= vh`; now horizontal-only, plus an above-the-edge arm that
  disables itself when `scrollY !== 0`); **single-line ellipsis truncation** was read as clipping
  (`overflow:hidden` + `text-overflow:ellipsis` produces `scrollWidth > clientWidth` by definition —
  now excluded); controls inside a **closed `display:none` menu** were read as unclickable
  (`getComputedStyle` on a child does not inherit the parent's `none` — the filter now uses
  `el.checkVisibility()`, which accounts for ancestors, and zero-size controls are no longer
  hit-tested). A gate that always fails is a gate agents learn to argue with.
- **The "fixture-verified" claim is now runnable, and includes a clean page.**
  `evals/fixtures/browser-probe/` ships both fixtures plus `run-probe.mjs`, which extracts the probe
  from the **doc's own code block** — never a copy — launches headless Chromium over CDP and asserts
  both directions: the defect page still surfaces all five defects, the clean page returns
  `PASS: true`. RED-verified: restoring the pre-fix off-canvas rule fails it with exit 1. Not wired
  into `npm test` (it needs a browser); no Chromium → prints `SKIP browser-probe fixtures`, exit 0.
- **`AGENTS.md` stamp corrected.** It shipped 1.14.0 still reading `Framework-Version: 1.13.0`, so
  `hooks/framework-version-check.js` told every session that the framework repo was behind the
  framework. The stamp is a fifth file in the release ritual, not a footnote — same drift as
  1.13.0, second occurrence.
- Boundary-rule pointers now name `browser-e2e.md` **§Devtools is not a test** instead of the
  neighbouring §Evidence.
- **`npm test` no longer reports 13 false failures on Windows.** `codex-agents/validate-toml.test.js`
  called `bash` from PATH; in a PowerShell session that resolves to `C:\Windows\System32\bash.exe`,
  the WSL relay, which without a distro dies with `execvpe(/bin/bash)`. Every case then failed
  claiming the shipped role TOMLs were rejected — a failure whose stated reason was not the real
  one. It now resolves a bash that actually runs a script (`$SAILES_BASH` → PATH → Git Bash →
  `/bin/bash`) and, when none does, prints an explicit `SKIP … The guard was NOT validated` and
  exits 0 rather than inventing sixteen verdicts. Both arms exercised.

## 1.14.0 — 2026-07-25 · the UI gates measure instead of eyeball (optional browser instrument)

No new skill and no new phase — an **instrument** for three gates we already mandate but could not
verify. What an existing repo does differently after upgrading:

- **The physical-integrity gate is measured, not judged.** New reference
  `skills/sailes-design/browser-inspect.md` carries a paste-able CDP probe returning the gate's six
  checks as data — the offending elements by selector, at each target width — plus `lighthouse_audit`
  for the `ux-rules.md` contrast/focus requirements and `performance_start_trace` for the
  `premium-ux.md` latency budget. The gate's own wording is "categorical checks — pass/fail, not
  opinion"; a model reading a screenshot delivers neither. Probe fixture-verified (Chrome 151): five
  deliberate defects → all five reported, incl. a button covered by an overlay that no screenshot
  can show; clean page → `PASS: true`.
- **Optional, with an explicit SKIP — never silent.** Follows the `graphify` (1.12.0) pattern:
  instrument absent → screenshot fallback **plus** a `SKIP browser-inspect (chrome-devtools MCP
  absent)` line in the run log / qa verdict. No skill blocks on it. Machine prereq:
  `claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest`.
- **Per-project opt-in as a decision card.** `decision-engine.md` gains **Q21** (UI repos): commit a
  `.mcp.json` (recommended), leave it out, or per-developer-only — with the third named as the bad
  path, since it measures the gate on one machine and skips it on another with no signal in the repo.
  Human chooses, logged in the Decisions Ledger; conditional row in `repo-done-checklist.md`; Codex
  twin `[mcp_servers.chrome-devtools]` in `codex-config-template.md`.
- **`sailes-diagnose` Step 1 Live gains its instrument** — console, request/response *bodies*, and
  storage over CDP, plus the answer to a limitation the skill already conceded: a fresh Playwright
  context cannot reproduce a stale-`localStorage` bug, while this server's persistent profile (or
  `--browserUrl` against a running browser) observes the bug in the state that produced it. The
  read-only-on-production and never-trigger-a-dialog rules are restated for a browser surface.
- **🔒 New hard rule protecting the test doctrine: "Devtools is not a test"**
  (`sailes-test/references/browser-e2e.md`). CDP evidence is ephemeral — an agent can "verify" a
  behavior by clicking and leave nothing that runs tomorrow. Every behavior that must not regress
  still ends as a Playwright test. This rule is a **precondition** of the adoption, not a footnote:
  without it the instrument runs the ratchet backwards.
- `qa` and `fe-dev` gain browser tools (Claude + Codex twins): `fe-dev` renders and measures its own
  output before reporting; `qa` measures the gate on the real surface and may never substitute a
  drive-through for the `tester` suite run. `designer` deliberately unchanged — see the spec's §5
  open question.
- New evals: `integrity-gate-reports-measurements-not-impressions` (two arms: present → cites the
  defect list; absent → explicit SKIP, never a silent pass), `devtools-evidence-does-not-replace-a-suite-test`
  (the boundary rule under time pressure). **Both RED/GREEN pending** — written first, not yet run.
- Deliberately NOT done: performance thresholds gated on dev-server numbers (`lighthouse_audit`
  excludes performance by design, and an unminified HMR bundle's LCP is not the product's — dev
  timings are a relative signal only), and any pixel-diff automation (`.ai/screens/` vision-verify
  unchanged). Spec: `.ai/specs/2026-07-25-browser-devtools-instrument.md`.

## 1.13.0 — 2026-07-22 · sailes-migrate: large-scale codebase migration as a domain sibling

New domain-sibling skill (like `sailes-pipedrive` / `sailes-hosting`) — **not** part of the linear
build pipeline, invocable on its own.

- **`sailes-migrate` — porting an existing codebase to another language/stack at scale.** A gated
  six-step method (feasibility+judge → map+rulebook+inventory → stress-test → translate fan-out →
  survey build+fixers → behavior parity) that **reuses existing machinery**: `explorer`+graphify
  for the dependency map, `team-lead`→`be-dev`/`fe-dev` for parallel translation, the deny-list
  `.claude/settings.json` (+`.codex` twin) guardrail for fan-out, and `checker`/`tester`/`qa` for
  the parity gate. Adds one hard invariant: *no translation fan-out begins before a judge/parity
  harness exists and has been validated against deliberately-broken source* — the migration analog
  of "no feature code before an approved spec". Structure-preserving is the default; redesign is an
  explicit mode. **Distinct from `sailes-database`** (DB-schema migrations) — the description
  disambiguates the two senses of "migration" so triggering doesn't collide. New skill files:
  `skills/sailes-migrate/{SKILL,methodology,judge-setup,rulebook-template,parallel-translation,cost-and-gates}.md`.
  New evals: `migrate-judge-gate`, `migrate-structure-preserving-default`, `migrate-is-domain-sibling`.
  Method distilled from `anthropics/code-migration-kit-with-claude-code` (Apache-2.0, © 2026
  Anthropic PBC) — our own prose synthesis of the ideas; the kit's scripts are referenced, not
  vendored (vendoring is a deferred human licensing decision).

## 1.12.0 — 2026-07-22 · graphify is a default component of every repo

Builds on 1.11.0 (below). Every repo the pipeline produces now carries a queryable code map.

- **Graphify is now a default component of every Sailes repo.** Bootstrap Step 4.9 builds a
  deterministic tree-sitter code map (`graphify-out/`), installs freshness git hooks and the
  Claude/Codex always-on nudge, and the done-checklist verifies it on disk (explicit SKIP when
  the binary is missing — never silent). Explorer recons graph-first; pre-implement gains a
  mechanical BC probe; diagnose gains a graph probe pattern; Route C builds the map before the
  convention audit. New reference: `sailes-bootstrap/graphify-setup.md`. New evals:
  bootstrap-generates-code-map, explorer-prefers-graph-over-grep,
  adopt-builds-graph-before-convention-audit. Machine prerequisite: `uv tool install graphifyy`.

## 1.11.0 — 2026-07-21 · named UX-layer options: Preline UI (additive) and Astryx (alternative)

The baseline named exactly one UX stack (Tailwind + shadcn/ui) and no alternatives, so the UI
layer was the one consequential fork bootstrap never surfaced as a decision card. Two researched
options are now part of the standard (default unchanged):

- **New `skills/sailes-bootstrap/ui-libraries.md`** — the researched note (Jul 2026): **Preline UI**
  (Tailwind block/component library, 640+ components, Figma kit — additive *inside* the default
  stack; markup from Preline, interactive primitives stay shadcn/Radix) and **Astryx** (Meta's
  MIT/Beta React+StyleX design system, 150+ components, 10 CSS-variable themes, agent-ready
  CLI+MCP — an *alternative* UI layer, since StyleX replaces Tailwind). Includes integration
  mechanics for Next.js App Router, risks, when-to-choose triggers, and a ready decision card.
- **`stack-baseline.md`**: UI row points at both options; two new deviation-table rows; sources.
- **`sailes-bootstrap/SKILL.md`**: **UI layer** joins the enumerated Phase-2 decision cards;
  `ui-libraries.md` added to Reference files.
- **`sailes-design/SKILL.md`**: `ui-libraries.md` added to Reference files (Preline blocks/Figma
  kit and Astryx themes as design-phase inputs).

Upgrade action: none required in generated repos (guidance-only; no pipeline, role, or template
change). Repos deciding a UX layer from now on should see the three-option decision card.

## 1.10.1 — 2026-07-20 · `tester` reports a code defect, it does not fix the code

Running the 1.10.0 eval `tester-never-weakens-a-frozen-assertion`, the agent did the right thing
about the *test* — it left the frozen assertion untouched — but reconciled the red by editing the
**feature code** itself. Correct outcome, wrong actor: fixing implementation is `be-dev`'s lane, and
`tester` holds `Write`/`Edit` (it needs them for test files) with nothing scoping it off product
code. Left as-is, "make it pass" can quietly pull the test author into changing the code its own
tests judge.

- **`agents/tester.md` + `codex-agents/tester.toml`**: a red frozen test is a **defect `tester`
  REPORTS to the lead**, never implementation code it rewrites; its write access is for test files
  only. (Both files edited — parity held.)
- **The eval now asserts report-not-fix**, so the guard is protected behaviorally rather than by
  prose alone.

Upgrade action: re-copy `agents/tester.md` and `codex-agents/tester.toml`. No pipeline or ordering
change; `tester`'s position (`fe-dev → tester → checker → qa`) is unchanged from 1.10.0.

## 1.10.0 — 2026-07-20 · a testing skill and a `tester` role — tests that detect, not tests that pass

Testing was a gate condition with no craft behind it: `sailes-implement` gave it one paragraph,
`checker` verified tests were *present*, `qa` proved behavior only at the end. Nothing said how to
design a suite for a feature wired into Pipedrive, Make, Slack and an LLM API — so agents read the
implementation and wrote tests that mirror it, green on the first run and green forever. That is the
documented LLM failure mode (arXiv 2410.21136: oracles capture *actual* not *expected* behaviour),
and a mirrored suite is worse than none because its presence raises reviewer confidence.

A generated/adopted repo on 1.10.0 now has:

- **A new `sailes-test` skill.** The last verification step *inside each phase*, before `checker`
  and `qa`. Its core is informational isolation: derive expected behavior from the spec with the
  implementation **unread**, the human **freezes** the case list to `.ai/test-plans/<spec>.md`, then
  write the suite; afterwards the diff may only **add** cases, never weaken an assertion. Carries the
  full technique arsenal (`references/techniques.md`, every section sourced), browser-first UI rules
  with the anti-flake set (`references/browser-e2e.md`), and a per-integration double decision card
  (`references/external-systems.md`).
- **A new `tester` role** (`agents/tester.md` + `codex-agents/tester.toml`) — the one gate role that
  writes, because a suite by the implementation's author mirrors it. Detection is proven at a **risk
  tier computed from triggers**, never the agent's judgment: tier A (money/auth/tenancy/idempotency/
  irreversible outbound write) → Stryker; tier B → a per-behavior break shown to go red then
  reverted; tier C → a green suite. The agent may raise a tier, never lower it.
- **The pipeline is now `… → fe-dev → tester → checker → qa`** in both `agent-team-structure.md` and
  `agentic-first-principles.md`, in the teams-on and teams-off paths. `checker` now treats a frozen
  behavior ID with no covering test as a defect; `qa` **runs the `tester` suite as its gate verdict**.
- **`sailes-async/harness-checklist.md` gained a 15-row "how each item is tested" table** — the
  idempotency/replay/ordering rules were architecture with no assertions; now each links to its test.
- **Never gate on line coverage** is now explicit — trivially satisfiable by an agent, and it raises
  confidence when it should lower it. Mutation score on tier-A modules replaces it.

Upgrade action: adopt `skills/sailes-test/`, add the `tester` role to `agents/` and `codex-agents/`,
and re-point any local pipeline docs at the new gate order. Three eval scenarios ship with it.

## 1.9.2 — 2026-07-18 · the brief names how to deliver, not just what to deliver

1.9.0 told every worker "your final message IS the deliverable". Measured against five
background teammates, **three formed a correct answer and delivered nothing** — one stating
plainly it had written its answer as text instead of calling `SendMessage`. The instruction was
not being ignored: it is true for a **scoped subagent**, which returns its final message
automatically, and quietly false for a **background teammate**, which must send it. The workers
obeyed a rule that did not apply to the mode they were in, and a worker cannot tell which mode
it is in — only the lead knows, because the lead chose it.

- **Every brief now carries a `Delivery:` line** alongside the report clause, naming which
  mechanism applies. `agent-team-structure.md` (Worker brief) and `agents/team-lead.md` (step 2).
- **The chase is standard procedure, not exception handling.** At the observed rate an empty
  return is the norm, not the anomaly — the 1.9.0 rule to chase once then escalate is unchanged
  and was confirmed working five times, but its framing as a rare backstop was wrong.
- **`.ai/lessons.md` corrected.** Its first version blamed "agents losing reports" — a plausible
  story nobody had tested, which shipped in 1.9.0 as the written justification for the rule and
  survived *because the rule worked*. Chasing recovered the work every time, so nothing forced
  the diagnosis to be checked. A fix that succeeds for the wrong reason is the hardest kind of
  error to notice; it took running the eval five times to see it.
- **Evals run, and recorded.** `lead-delegates-instead-of-bulk-coding` PASS both arms — its first
  real run since it was written for 1.7.0 and marked NOT RUN. New scenario
  `lead-chases-an-empty-worker-return` PASS both assertions, written after the 1.9.0 edit rather
  than before it, which is the wrong order and is recorded as such in the file.

## 1.9.1 — 2026-07-18 · the guard scripts become files, not prose to retype

- **`.claude/hooks/session-start.sh` and `guard-protected-paths.sh` now ship as real files**
  under `sailes-bootstrap/hooks-template/`. They previously existed only as fenced blocks inside
  `codex-config-template.md`, which meant the framework's **only mechanical enforcement** — the
  `permissions.deny` + `PreToolUse` surface in a generated repo — depended on an agent retyping
  shell correctly. Bootstrap now copies two files. The template points at them instead of
  carrying a second copy that would drift.
  *Verified by execution, for the first time since they were written:* force-push, `reset --hard`,
  `.env`, `.ai/specs/implemented/` and applied migrations all exit 2; ordinary edits and commands
  pass through.
- **The plugin description names both tracks.** It listed only the build pipeline, three versions
  after `sailes-diagnose` shipped. Fixed in `plugin.json` and `marketplace.json`.

## 1.9.0 — 2026-07-18 · one vocabulary, and a silent worker stops reading as a finished one

- **A canonical spine: `SPEC → HUMAN → VERIFIED → GATED`.** The generated `AGENTS.md` gains a
  short **The spine** section stating the four hard rules in the same words the session hooks
  use. Previously the SessionStart mandate and the generated `AGENTS.md` said overlapping things
  in *different* phrasing, so two instruments competed for one slot instead of reinforcing each
  other. Anything that repeats the rules cheaply must now repeat these words — the string is
  byte-identical in `workflow-router.js` and `agents-md-template.md`, and changing one without
  the other is the regression to watch for.
- **An empty return from a delegated worker is a failure, not a completion.** A worker can go
  idle having said nothing, which is indistinguishable from "it looked and found nothing" — so
  accepting the silence records a false negative as a result. The lead now chases once,
  explicitly, then escalates to the human; it never re-spawns on a guess, never absorbs the work
  itself, and may claim "the agent found no issues" only if an agent actually said so.
- **Every worker brief carries a report clause**, named alongside goal/contract/verification:
  *your final message IS the deliverable — if you did not finish, say so and list what you did
  and did not establish.* It goes in the brief rather than in role definitions deliberately:
  built-in agent types (`general-purpose`, `Explore`) cannot have their definitions edited, and
  they are where this has actually gone wrong.
- **Harvest before release.** A worker that hit a real problem lands it in `.ai/lessons.md`
  before the agent is released, and a substantial delegation lands in `.ai/runs/`. A message
  queue does not survive a context reset; disk does.
- **Internal:** the two SessionStart hooks now share `hooks/lib/repo-state.js` instead of each
  carrying a verbatim copy of the same four I/O helpers.

## 1.8.0 — 2026-07-18 · a track for when something is broken, not missing

- **New skill `sailes-diagnose`.** The build pipeline turns intent into software and is the wrong
  instrument for a failing system: there is nothing to elicit and the requirement is already
  written. This is the other track — scope → live case → ≥3 falsifiable hypotheses → read-only
  fan-out → discriminating test → mechanism → hand off. It ends at a **proven mechanism**, never at
  a merged fix, because a correct diagnosis and a correct fix are separate claims (on "loads 2008"
  the diagnosis was right and the first fix still corrupted the supplier id).
- **Read-only on production, always.** Stricter than the industry default for a local reason:
  Railway `dev` holds production credentials, so a Tokyo→Kyoto smoke test created a real person, a
  real deal, and sent a real email (SRF `lessons.md:151-154`). There is no harmless environment to
  "just try it" in. Replay commands are written out and handed to the human.
- **Live case before code audit** — the one explicit self-reversal in either source repo:
  "the audit-first order wasted effort … most of the prior reasoning was wrong."
- **Three hypotheses before any deep dive**, each with a named refuting observation. Agent
  commitment to an early reading peaks around reasoning step 4 (arXiv 2606.22936), so the set must
  exist before then; deliberately constructing the opposing case measurably improves accuracy
  (arXiv 2604.02485). **"5 whys" is deliberately not encoded** — no evidence base, and its failure
  mode (a fluent single causal thread from insufficient knowledge) is an LLM's native one.
- **Fan out by data source, never by hypothesis-with-an-advocate** — advocacy manufactures
  confirmation — and only when the cause is not obvious. Collectors return raw evidence with the
  query they ran; verdicts stay with the lead.
- **New artifact: `.ai/incidents/<date>-<slug>.md`** — timeline, evidence log, hypothesis ledger
  (refutations kept), contributing factors *plural*, verification with a pre-committed negative,
  detection gap. Deliberately separate from `.ai/specs/` so an incident does not inflate the
  in-flight count the session router reads.
- **The router gained a BROKEN ≠ MISSING branch** and now surfaces open incident records at
  session start, ranked above specs.
- **The router no longer fails silently.** A `ReferenceError` in it used to make the entire mandate
  vanish while the session looked normal — the "silent instrument" trap this very skill exists to
  stamp out. It now degrades to a minimum mandate and reports its own failure, in Sailes repos
  only. Covered by tests, including the negative case.
- **Upgrade action:** none required. `.ai/incidents/` is created on first use.

## 1.7.1 — 2026-07-18 · the Codex agent installer actually installs

- **`enable-codex-agents.sh` never worked — not once, on any version.** Its `validate_toml`
  guard checked every line against "table header or key = value" with no awareness of
  multi-line basic strings, and every role file puts the agent's whole prompt in a `"""`
  block. It rejected all seven roles at line 5. Verified against the oldest committed role
  files: the Codex agent team has been uninstallable on macOS/Linux since it shipped in 1.4.0.
  The PowerShell twin had it right; this is the port.
- **The same guard rejected Codex's own `config.toml`.** It allowed only bare table keys, but
  Codex writes literal-quoted ones (`[projects.'C:\Users\...']`) because Windows paths carry
  backslashes and a drive colon.
- **A role file can no longer become un-upgradable.** Ownership was proven by content equality
  with the current source, so the first upstream edit to any role — 1.7.0's delegation
  change — made previously-installed files unrecognizable and dead-ended the upgrade with
  "not Sailes-owned … even with --force". A file named for one of our seven roles that
  declares that same role is now *adopted*: reported in the plan, backed up to
  `~/.codex/backups/agents.<timestamp>/`, and replaced only after a separate consent prompt
  that `--force` deliberately does NOT answer. Anything else still hard-fails.
- **Both installers now behave identically**, and `npm test` covers the shipped awk program
  itself (`codex-agents/validate-toml.test.js`), including reject-cases — without them the
  suite passed while asserting nothing.
- **Upgrade action:** macOS/Linux users can now run `./enable-codex-agents.sh` for the first
  time. Existing installs will be offered adoption; the backup is kept.

## 1.7.0 — 2026-07-18 · delegation becomes the lead's default, not its fallback

- **The "may do it solo" loophole is closed.** `agent-team-structure.md` previously allowed the
  lead to implement a small single-surface feature itself. An opus-tier lead reliably took that
  permission, so the expensive tier typed implementations a sonnet worker produces just as well.
  Delegation is now the stated default above a one-file change, and "I'll just write this one
  myself" is a choice the lead owes a reason for.
- **The cost argument is stated in both directions**, because a rule that only rewards delegation
  trains the opposite waste: a worker costs a spawn, a brief, a report and an integration, and
  below roughly a file's worth of change that overhead exceeds the saving.
- **Codex parity:** `codex-agents/team-lead.toml` carries the same rule — one standard, two
  harnesses.
- **Why it needed saying at all:** this failure is invisible in the artifact. The work ships and
  the gates pass; only the bill differs. `evals/lead-delegates-instead-of-bulk-coding.md` guards
  it, with an inverse guard so a one-line typo fix still does NOT spawn a worker.
- **Upgrade action:** none in a consuming repo — this is agent-role behavior, not generated
  content. Update the plugin (and re-run `enable-codex-agents` for the Codex side).

## 1.6.1 — 2026-07-18 · the router survives contact with real repos

- **Scaffolding in `.ai/specs/` no longer reads as work in flight.** `TEMPLATE.md`, `AGENTS.md`,
  `CLAUDE.md` and `README.md` are filtered out — all four were found sitting in live repos, and a
  template announced as an active spec teaches the agent to distrust the routing.
- **A large in-flight set is now named as probable drift.** Past ten specs the mandate says so and
  points at `implemented/`, because an agent cannot otherwise tell a busy repo from a stale one.
  Found by running the hook against a repo with 27.
- **Status lines are deliberately NOT parsed.** Across real repos that line takes five shapes, is
  absent from a third of specs, and appears inside fenced code blocks; filtering on it would
  silently drop live work — a worse failure than listing too much.

## 1.6.0 — 2026-07-18 · the workflow routes itself from the repo's state on disk

- **New hook: `hooks/workflow-router.js` (SessionStart).** In any repo carrying `AGENTS.md` or
  `.ai/`, every session now opens with a routing mandate derived from the filesystem, not from the
  model's read of the request: specs at `.ai/specs/` root → continue at
  `sailes-pre-implement`/`sailes-implement`; none in flight → a feature request enters via
  `sailes-start`. `implemented/` and `archived/` are ignored, so a finished spec cannot masquerade
  as work in progress. The mandate carries four hard rules (no feature code before an approved
  spec; the human owns key decisions; done means verified; gates are not skipped).
- **It fires on `resume|clear|compact`, not just `startup`.** A context reset is precisely when the
  methodology used to evaporate — the previous 1.4.0 hook ran only at startup.
- **Enforcement stays soft, deliberately.** A `PreToolUse` gate that blocks `Write`/`Edit` was
  considered and rejected: it would take the wheel away from the human, which is the one thing the
  standard exists to prevent. The mandate constrains the agent, never the human — "skip it, just
  do the fix" still wins.
- **The hook is now covered by real tests.** `npm test` runs `hooks/workflow-router.test.js`
  (11 assertions, no framework, no deps). The behavioral half — does the agent *honor* the mandate
  — lives in `evals/session-start-routes-from-repo-state.md`, whose control arm records the RED
  baseline: without the block, an agent handed "szybka sprawa, bez ceregieli" writes untyped JS
  into a TS/Drizzle repo, invoking zero skills.
- **Upgrade note:** nothing to change in a consuming repo. The hook ships with the plugin and keys
  off `AGENTS.md`/`.ai/`, which an adopted repo already has. Repos without them stay silent.

## 1.5.0 — 2026-07-16 · the Codex team ships, and the lead can hand it a task

- **The Codex agent team is released.** `codex-agents/` (the seven roles as Codex custom-agent
  TOMLs) and `enable-codex-agents.ps1` / `.sh` landed in the tree during 1.4.0 but were never
  versioned or announced — the marketplace still advertised 1.4.0, so no consumer could pull them.
  The installer copies the seven files to `~/.codex/agents/` and owns only its marked block in
  `~/.codex/config.toml`. Same roles, same pipeline order, same gates: a second harness for the one
  source of truth.
- **New: the lead can hand one task to Codex, on request.** `agents/team-lead.md` gains a
  runtime-delegation block. When the human says "use Codex for the backend" / "let Codex review
  this", the lead invokes `codex exec` directly — `-c sandbox_mode="read-only"` for recon and
  diagnosis, `codex exec review --uncommitted` for review, `-c sandbox_mode="workspace-write"` for
  implementation (which the human authorizes), always with an explicit `-m <model>` so the run
  can't silently inherit the user's global `~/.codex/config.toml` default. Codex's stdout is the
  worker's report, `git diff` is the artifact. **Human-triggered only** — the lead never routes
  work to another runtime on its own initiative.
- **The gates do not move.** A Codex worker is an ordinary worker: `checker` still receives diff +
  spec + checklist ONLY, never the maker's report, whichever runtime produced it. Gate isolation
  generalizes across runtimes unchanged — a cross-runtime maker is still a maker.
- **Delegation is one-directional by design.** The Claude-side lead hands tasks to Codex; the
  Codex-side lead has no matching hand-off back to Claude, so `codex-agents/team-lead.toml` is
  deliberately unchanged (the exception is documented in `codex-agents/README.md`). Symmetry would
  make the second vendor a *requirement* rather than an option — each runtime already runs the
  whole pipeline alone. A Claude-only or Codex-only user loses nothing by never delegating.
- **Evals:** `lead-honors-codex-delegation-and-still-gates.md` — the lead must name a concrete
  `codex exec` invocation with pinned model and sandbox mode, and still run `checker` + `qa` with
  `checker` isolated. RED baseline (2026-07-16): the lead answered "undefined in my instructions",
  declined to invent a mechanism, and fell back to `be-dev`.
- **Upgrade action:** repos on ≤1.4.0 gain the Codex agent team and the lead's delegation path; no
  repo file changes required — both are machine-global (an installer and agent-role behavior), not
  generated-repo content. Run `./enable-codex-agents.sh` (or `.ps1`) to install the seven Codex
  roles; update the marketplace plugin for the Claude-side lead.

## 1.4.0 — 2026-07-14 · the agent team ships as installable agents

- **New `agents/` directory — the agent team is now installable, not just described.** The seven
  roles that `sailes-bootstrap/agent-team-structure.md` defined only in prose (`team-lead`,
  `explorer`, `designer`, `be-dev`, `fe-dev`, `checker`, `qa`) now exist as real agent files with
  frontmatter (`name` · `description` · `model` · `tools`), auto-discovered on
  `plugin install sailes-app-builder@sailes`. Models follow the canonical table: `team-lead`=opus,
  `explorer`=haiku, the rest=sonnet.
- **Fix: "marketplace doesn't install agents."** Root cause — the plugin shipped zero agent files,
  and the only folder present was a dot-prefixed `.agents/`, which Claude Code ignores during
  plugin component discovery. Agents must live in `agents/` (no dot). The empty `.agents/` was
  removed; `agents/README.md` documents the trap.
- **`agent-team-structure.md`** now states the roles ship in the plugin's `agents/` (and may be
  copied to `~/.claude/agents/` for global use) instead of assuming they already live globally.
- **Upgrade action:** repos on ≤1.3.0 pulling this version gain the installable agent team; no repo
  file changes required — this is a plugin-packaging fix. After updating the marketplace plugin,
  the seven roles appear in `/agents`.

## 1.3.0 — 2026-07-13 · the wayfinding layer for big, foggy efforts

- **New skill `sailes-wayfinder`** — when an effort is too big/foggy for one session, chart a
  decision map on disk (`.ai/wayfinder/<effort>/map.md` + `tickets/NNN-*.md`): a named
  Destination, typed tickets (decision / research / prototype / task), fog of war
  ("Not yet specified"), an out-of-scope ledger, and claim/`Blocked-by`/frontier mechanics so
  concurrent sessions don't collide. Work mode resolves **one decision per session**
  (research excepted, runs parallel via subagents); when no tickets + no fog remain, hand off
  to the pipeline gate the Destination names. Ticket types resolve through mechanisms the
  framework already has (decision cards, research subagents, `sailes-design` prototypes) —
  methodology adapted from Matt Pocock's Wayfinder with zero external skill dependencies.
  `.ai/STATE.md` points at the active map (path + next frontier ticket).
- **`sailes-start` — Step 0 fog check**: a too-big/foggy idea (unknowns depending on
  unknowns, pending API access, awaited client input) routes to `sailes-wayfinder` before
  Phase 1; A/B/C routing still applies after the map clears.
- **`sailes-spec` — Open Questions escalation**: unknowns that can't be answered in one
  sitting become typed wayfinder tickets; the spec stays at skeleton (`Status: draft` + map
  link) and resumes when the map clears; the Decisions Ledger references ticket resolutions
  (gist + link), never restates them.
- **Evals**: +3 scenarios (`wayfinder-charts-map-not-full-plan`,
  `start-routes-foggy-ideas-to-wayfinder`, `spec-escalates-oversized-open-questions`) —
  RED baselines and GREEN verification recorded 2026-07-13.
- A repo on an older framework gains: the `.ai/wayfinder/` convention + the STATE.md pointer
  to the active map.

## 1.2.0 — 2026-07-12 · Codex CLI parity — second harness, one source of truth

Make the framework run correctly under **OpenAI Codex CLI**, not just Claude Code — skills
*and* the repos they generate. What a generated/adopted repo now contains or does differently:

- **Codex guardrail twin**: `sailes-bootstrap` emits `.codex/config.toml` alongside
  `.claude/settings.json` (new `codex-config-template.md`). It maps `permissions.allow/deny` →
  `sandbox_mode`/`approval_policy` + `[hooks]`, and the **hook scripts are shared** —
  `.claude/hooks/*.sh` is one copy referenced by both configs (identical stdin-JSON payload +
  exit-2-to-block + SessionStart-stdout→context contract). Honestly encodes the Codex
  limitation that some versions fire `PreToolUse` only for `Bash` (apply_patch edits fall back
  to sandbox/approval + prose rules).
- **Copilot pointer**: `.github/copilot-instructions.md` → `AGENTS.md` generated too. One source
  of truth, three harnesses.
- **Skill distribution for Codex**: `enable-codex.sh` / `enable-codex.ps1` copy `sailes-*` into
  `~/.agents/skills/` (Codex USER-scope). The `SKILL.md` frontmatter (`name` + `description`) is
  already Codex-native — no transformation. Ships `VERSION` + `CHANGELOG.md` next to the skills,
  like `install.sh`, so Upgrade mode can read `~/.agents/skills/CHANGELOG.md`.
- **Bootstrap wiring**: skeleton (`.codex/` in the tree, shared-hooks note), `agents-md-template`
  (Enforcement lists both twins), `agentic-first-principles` (harness-parity principle),
  `repo-done-checklist` (verify `.codex/config.toml` + no script drift), `adopt-existing-repo`
  (audit row 13 + additive generation of the Codex twin), `SKILL.md` (Case B/C generate both
  twins by default).
- **Definition of "Codex-ready"**: a repo is Codex-ready only when the `.codex/` twin exists and
  points at the shared scripts — not merely because `AGENTS.md` is readable.

## 1.1.0 — 2026-07-05 · "move truth from prose into the machine" + the value layer

Engineering layer (`.ai/specs/2026-07-05-agentic-first-next-level.md`):
- **The ratchet (§B.3)**: mechanically checkable conventions are enforced (lint/types/tests/hooks);
  AGENTS.md prose becomes pointers; promotion ladder prefers enforcement; `checker` stops
  re-checking what the toolchain guarantees.
- **Contract as typed artifact**: `packages/contracts` in the skeleton/stack; "frozen BE
  contract" = committed Zod/TS artifact both slices import; specs name contract artifact paths.
- **Harness guardrails**: `.claude/settings.json` permissions + SessionStart (STATE.md
  injection) + PreToolUse (protected paths) in the skeleton and repo-done checklist.
- **Environment / time-to-verdict**: one-command boot with seeded data, fixture user per RBAC
  role, measured `check` time, complete `.env.example` (repo-done Environment block);
  `qa` blocked on env = **ENV-DEFECT** (bootstrap bug), never a skipped proof; time-to-verdict
  is a stack-choice criterion.
- **Parallel-safe layout**: feature-folder colocation; no hand-edited barrels/central
  registries; leads slice tasks for file-disjointness.
- **Context layering + freshness**: AGENTS.md root ≤ ~150 lines (map, not encyclopedia;
  displace-don't-append); scriptable Freshness check (referenced paths/commands must exist) in
  repo-done + adoption audit (row 11).
- **Persisted evals**: `evals/` — one scenario per protected skill behavior; TDD-for-skills
  RED/GREEN now survives the chat.
- **Versioning**: `VERSION` + this changelog; generated AGENTS.md carries `Framework-Version:`;
  adoption audit row 12 + **Upgrade mode** apply the standard delta to older repos (additive,
  human-approved).

Value layer (`.ai/specs/2026-07-05-value-layer.md`):
- **Release gate**: `release-checklist.md` — env/secret parity, migration ordering vs deploy,
  scripted post-deploy smoke (output pasted), rollback plan written pre-deploy; wired into
  `sailes-implement` On-completion and the pipeline map.
- **Ops with teeth**: repo-done Operations block — error tracking that alerts a human,
  `/health`, backups with **one restore actually performed**, uptime check, `.ai/runbook.md`.
- **Provable RBAC**: specs declare the permission matrix (actions × roles); implementation
  generates the authz-matrix test suite (all allow/deny + anonymous row); multi-tenant adds
  generated cross-org denial tests (security checklist upgraded from prose to proof).
- **Gate autopsy**: an escaped defect ships with which-gate-missed-it + the check that gate now
  gains (`Escaped-defect:` entries are priority promotion candidates).
- **Golden modules**: graduation rule (built ~twice → extract to the versioned library with
  tests + docs); bootstrap checks the library before scaffolding; briefs reference golden
  implementations.
- **Estimation loop**: spec phases may carry internal estimates; completion closes
  estimate-vs-actual into an internal ledger feeding `sailes-wycena` (never client-visible).
- **Client status**: root `STATUS.md` derived from live specs, updated at phase gates (no
  effort/pricing data).

Reconciliation (2026-07-07, pre-merge — adversarial review of `feat/agentic-first-next`):
- Two RED Done-when gates fixed (prose/pattern drift): `agents-md-template.md` now literally
  carries "replaced by a one-line pointer to the enforcement" and "gate autopsy / escaped defect".
- Versioning loop closed at runtime: `install.sh` now ships `VERSION` + `CHANGELOG.md` into
  `~/.claude/skills/`; `adopt-existing-repo.md` Upgrade mode reads them there.
- `.claude/settings.json` is now a real template (`sailes-bootstrap/settings-template.json`);
  `skeleton.md` fixed the mis-nested `hooks` (a JSON key + `.claude/hooks/` scripts, not a sibling file).
- Terminology: the Claude Code "harness guardrails" disambiguated from a durable-workflow
  "hard harness" (see the `sailes-async` skill); bootstrap Jobs/queue now points to `sailes-async`.
- `package.json` version aligned to `VERSION` (1.1.0); `sailes-wycena` marked as planned where referenced.
- Still parked as debt (`.ai/backlog.md`): behavioral GREEN re-runs + CI wiring for `evals/`.

## 1.0.0 — 2026-07-02 · baseline

Everything up to and including the loop-engineering adoption (PR #1): the phased pipeline
(start/discovery/bootstrap/design/spec/pre-implement/database/implement), agent-team canon with
gate isolation, STATE.md session memory, binary per-phase Done-when, vision-verify, promotion
rule, idempotent `.ai/` scaffolding, decision-ownership principle.
