# Lessons — framework-level institutional memory

> Format per entry: **Context / Problem / Rule / Applies-to**. Escaped defects additionally use
> `Escaped-defect:` entries (which gate missed it + what check that gate now gains). Review for
> promotion candidates when closing a spec — prefer promoting into an enforced check or an
> `evals/` scenario over more prose.

## Lessons

### 2026-08-03 — a brief that points at an uncommitted file points at nothing
- **Context:** six workers were dispatched with `isolation: worktree`, each brief opening "read
  `.ai/specs/2026-08-03-outstanding-debt-and-docs-delta.md`, phase Fn". The spec had been written
  with `Write` and **never committed** — `git status` showed it as `??` in the main tree.
- **Problem:** a worktree is cut from a **commit**. An untracked file in the main tree does not
  exist inside it. So every one of those six briefs referenced a path that resolved to nothing.
  **One worker of six said so.** The other five proceeded silently and delivered correct work
  anyway — because the briefs happened to be self-contained — which is the dangerous half: the
  process defect produced no visible symptom and would not have been found by looking at outputs.
- **Rule:** **commit the spec before dispatching anyone against it.** More generally, any path a
  brief names must be reachable from the worktree's base commit; if it is not yet committed, either
  commit it or inline the content into the brief. And treat "no worker mentioned the missing file"
  as no evidence at all — five of six did not, on a file that was definitively absent for them.
- **Applies-to:** `agent-team-structure.md` (Worker brief), `agents/team-lead.md`; every dispatch
  under the `isolation: worktree` mandate, which is now every writing worker.
- **Mechanisable:** yes, and it should be — `brief-closure.js` already parses briefs for field
  completeness; asserting that each path it names exists at the base commit is the same shape of
  check. Promotion candidate, filed to `.ai/backlog.md`.

### 2026-08-03 — the backlog rows a truth pass misses are the ones fixed the same day they were filed
- **Context:** an audit of `.ai/backlog.md` before planning 1.28.0. Twenty-one rows marked
  `open` / `next` / `needs the human`; **eleven were already done** — one carrying
  "open — this is the decision" three lines beneath its own `CLOSED` heading.
- **Problem:** the audit checked eight rows against disk and took three on trust. **Two of those
  three were already fixed**, and the pass then actively made one worse by stamping it
  "Scheduled 1.28.0, phase F4" and dispatching a worker to redo finished work. The trusted three
  shared one property: each was **filed mid-session by an agent doing something else, and fixed
  later the same day**. That recency is precisely what made them read as safe to trust — the
  fix landed after the row was written and nobody returned to the row.
- **Rule:** in a backlog pass, **a row's apparent freshness is a reason to check it harder, not
  a licence to skip it.** Verify every row against disk — `git log -- <path>` on the file the row
  names is usually one command. Same-day file-and-fix is the highest-risk class, not the lowest.
  Corollary that held: the worker assigned to already-done work **refused to edit correct prose,
  produced the commit sha proving it, and reported** — that behaviour is the backstop and it
  worked three times today; do not let a "just make the change" brief train it away.
- **Applies-to:** `.ai/backlog.md` hygiene; `sailes-implement` spec-closure step; any session
  planning work from a backlog rather than from disk.

### 2026-08-02 — a mechanism's first real use finds what its tests cannot
- **Context:** `tools/worker-status.js` shipped 1.25.2 with passing tests and a mutation proof
  (`worker-status.test.js:49,214,268`) behind it. Its first genuine status file — not a fixture —
  failed the validator twice: `claimed:` written as a YAML **block list** (`claimed:\n  - path`),
  which the parser does not accept (it reads only the inline `["a", "b"]` shape,
  `worker-status.js:78-90`), and a file carrying `outcome: done` with no `commit:` — a real state
  for a plan-only task whose evidence is a file rather than a commit, and one `worker-status.js:166`
  refuses by design rather than by accident.
- **Problem:** a test suite exercises what its author anticipated. A mutation proof shows the code
  turns red when the *known* invariants are broken; it says nothing about the shapes a worker who
  never read the parser will actually write. Both failures here were "correct behaviour, unexpected
  input" — the validator did what it was built to do, and the surprise was entirely on the input
  side, which fixtures cannot generate because fixtures are written by the same mind as the parser.
- **Rule:** before calling a new mechanism done, run it against **one artifact produced by something
  other than its own test suite** — a real worker's real output, not a fixture built to match the
  parser. A green suite plus a mutation proof answers "does the code do what the tests say"; only a
  foreign artifact answers "does the code accept what will actually arrive".
- **Applies-to:** `tools/worker-status.js` and any validator/parser added under `tools/`; the
  acceptance step for any new mechanism before its first real dispatch, generically.

### 2026-08-02 — an integration check that compares names is one level too shallow
- **Context:** two workers who could not see each other implemented the worker-status format
  (`tools/worker-status.js`) and its doctrine (`agent-team-structure.md` §The worker status file).
  The lead verified that all nine fields — `worker`, `task`, `base`, `claimed`, `opened`, `closed`,
  `outcome`, `commit`, `touched` — matched by name across both sides and declared them consistent.
- **Problem:** the field **names** agreed; the list **syntax** did not. One side wrote and accepted
  `claimed: ["a", "b"]`, inline; the other's example/doctrine carried a block list. A name-level
  diff cannot see this — it confirms the two sides agree on vocabulary, not on grammar, and the
  grammar is exactly what a parser enforces. The mismatch shipped and only surfaced on the
  mechanism's first real use (previous entry).
- **Rule:** compare **value shapes, not just keys.** Feed one side's actual example value through
  the other side's parser/validator — don't diff the key lists and call it consistency. Two
  implementations of a shared format agree only when an artifact from one validates clean against
  the other, not when their glossaries match.
- **Applies-to:** any lead-side check verifying two independently-built implementations of a shared
  contract; `tools/worker-status.js` and `worker-status-template.md` specifically, and the
  cross-worker integration-verification step generally.

### 2026-08-02 — a declaration is not the unit of content
- **Context:** the `WIP:` commit convention (`agent-team-structure.md:242-253`) broke the first
  time it was exercised in practice: a worker's non-WIP — i.e. final, "I am declaring this done" —
  commit carried only **6 of the 16 files** it had actually changed. `git cherry-pick` of that
  commit reported success, because it was a perfectly valid commit; it just wasn't all the work.
  Only an unrelated grep, run for a different reason, caught the missing ten files.
- **Problem:** the convention's whole point is that a non-`WIP:` commit **is** the declaration of
  completion, and the lead is told to trust it as such. But nothing enforces that a "final" commit
  actually contains everything staged for the task — a partial `git add` before that commit produces
  a commit that is valid, cherry-picks cleanly, and drops work silently. Exit-code success from
  `cherry-pick` answers "did this commit apply", never "does this commit contain everything the
  worker intended to deliver".
- **Rule:** take the branch; read the log **only to learn whether the worker declared** (WIP vs.
  final) — never to learn what is *in* the commit, and never cherry-pick a single commit when
  completeness matters. Diff the branch against its base to see everything the worker touched;
  the declaration tells you *when* to trust the work is finished, not *what* the finished work is.
- **Applies-to:** `agents/team-lead.md` §Observing a silent worker, the cherry-pick-based
  integration step it describes, and `agent-team-structure.md`'s `WIP:` convention; every worker
  brief that ends in "commit when done".

### 2026-08-02 — a freshness check with day granularity cannot see same-day drift
- **Context:** `evals/harness/eval-status.js` records a run as a **date** and, per
  `runCoversCommit()` (`eval-status.js:165-174`), treats it as covering everything up to
  `23:59:59.999Z` of that day — deliberately, to stop a same-day run and commit from always reading
  STALE. On a day when doctrine changed **four times**, two evals that had run against the text
  **before** an edit still reported FRESH after the text was edited later the same day, because the
  run and the edit shared a date.
- **Problem:** the check's unit of comparison (a calendar date) is coarser than the unit of change
  (a commit). That's correct on a slow-moving repo — the case it was built for — and wrong on a fast
  one: once a day carries more than one relevant commit, "same day" stops meaning "same content",
  and the FRESH verdict silently certifies content the eval never actually saw running.
- **Rule:** pin a run to a **commit**, not a date, wherever the record has to survive a fast day —
  record the SHA the run was measured against and compare that SHA's ancestry to the file's current
  SHA, rather than comparing calendar dates. Date-granularity freshness is a correct instrument only
  when the repo's edit rate is slower than its recording rate; this repo's is not, reliably.
- **Applies-to:** `evals/harness/eval-status.js` (`runCoversCommit`) and its `Last run:` field
  convention; any other doctrine-drift-tracking mechanism built on date-level granularity.

### 2026-07-26 — the mitigation that was named and never promoted is the one that kept failing

- **Context:** on 2026-07-20 a defect class produced three mitigations. Two were written into
  AGENTS.md §Hard safety rules — verify a scripted edit landed, use `\r?\n` not `\n`. The third —
  *stop pushing prose through a shell, use the file-writing tools* — was written into a **narrative
  sentence in `.ai/STATE.md:162`** and nowhere else. On 2026-07-26 it was broken **three times in one
  session**, by the agent that had written all three.
- **Problem:** two separate failures, and only the second is interesting. The first is placement: a
  rule recorded in a session-summary paragraph is not a rule, it is a memory, and it dies with the
  reader. The second is that the prose stated the **injunction without the mechanism** — "don't push
  prose through a shell" gives nothing to recognise in the moment. The actual mechanism is sharp and
  memorable once seen: **an apostrophe closes a single-quoted shell string.** Prose is dense with
  them (`scenario's`, `don't`), so the quote terminates mid-sentence, the remainder is parsed as
  shell, and backticks inside it become command substitution. The failure is loud but late.
- **Rule:** when an incident yields several mitigations, **promote all of them to the same place, in
  the same pass** — a split leaves the unpromoted one looking handled. And write the *mechanism*, not
  only the prohibition: a rule you cannot feel is one you break under fatigue, which is exactly when
  it matters. Now in AGENTS.md §Hard safety rules with the mechanism attached.
- **Applies-to:** every `.ai/lessons.md` entry and every STATE.md session summary. The header of this
  file already says to prefer an enforced check over more prose — this entry is what happens when
  prose is not even filed where prose is read.
- **Still open, and it is the real fix:** this is enforceable. A `PreToolUse` hook could refuse a
  Bash call that writes sentences into a `.md` file. It is not shipped, because hooks in this repo
  reach **every machine running the plugin**, and that blast radius is the human's call — not a
  papercut's.

### 2026-07-26 — an agent's own run-data section is a claim, and it is the one claim with no artifact behind it
- **Context:** an A/B comparing two `researcher` architectures. Arm B reported a tidy instrumentation
  table — "7 gatherers, 38k–61k tokens each (~366k total), individual durations 50–125s, wall-clock
  ≈125s, ≈6 min end to end". I read it as measurement and reported it onward as the reason arm B
  "burns fewer tokens". A second run asked the same architecture for the same numbers; it answered
  that **none of them are visible to it** — not its gatherers' tokens, not its own, not per-agent
  durations. Asked directly, the run-1 agent then confirmed the same: the per-agent range was
  unverified, "~366k" was its own arithmetic (7 × ~52k), and no clock was ever read. Its words: *"if
  I had genuinely read them as data I would be able to quote one."*
- **Problem:** this repo already grades the artifact rather than the report — for **findings**. Nobody
  applied that rule to the **instrumentation** section, which is precisely the part with no artifact
  to return to. Worse, both agents formatted estimates identically to source-verified claims, under a
  heading naming them as measurement. One of them had, in the same document, caught a gatherer for
  exactly this (a fabricated `supa_audit v0.3.1` in a summary table its own body contradicted) — it
  checked the claim it could go to source on, and not the one it could not.
- **Rule:** **a number an agent reports about itself is an estimate until it names where it read it.**
  Ask for the provenance, not the number, and instruct it to answer "not measured" rather than
  estimate — an estimate in a measurement register is worse than a gap, because a gap is visible.
  Where the harness reports it (durations and tokens for agents *this session* spawned), use the
  harness and ignore the self-report entirely.
- **Applies-to:** every A/B arm, every eval verdict quoting cost or duration, and any brief that asks
  a worker "how long did that take". Also the reason `evals/harness/README.md` rule 6 says record both
  numbers — recording a number is not the same as measuring one.

### 2026-07-26 — the cost of a self-organising swarm is invisible to everyone, including itself
- **Context:** same experiment, second run. Arm A (lead spawns 3 explorers + a synthesiser) reported
  648,945 then 798,900 tokens — exact, because the session spawns all four and the harness logs each.
  Arm B (researcher spawns its own gatherers) could not be costed in either run: its gatherers are
  children-of-children, invisible to the session, and the researcher confirmed they are invisible to
  it as well.
- **Problem:** this is not a brief that forgot to ask. It is a property of the topology, and it
  collides with our own doctrine: `agent-team-structure.md` requires the run log to record who was
  spawned, what each returned, and **whether a model escalation actually paid**. An architecture whose
  costs cannot be observed cannot satisfy a rule that requires observing them — and the failure is
  silent, because the deliverable looks the same either way.
- **Rule:** when comparing architectures, ask **which one can be audited**, not only which one is
  faster. Depth buys parallelism and spends observability, and that trade belongs on the decision card
  next to the latency number.
- **Applies-to:** roster spec Q1, any future grant of `Agent` to a non-lead role, and any sub-team
  plan — a sub-lead's workers are already at this depth today.
- **Also measured, and worth keeping:** run-to-run variance dwarfed the between-arm difference. One
  explorer took **24.5 min in run 2 against 6.6 in run 1 on an unchanged slice** (3.7×). A single run
  per arm cannot support a ratio; it can support a direction, and only if the direction has a
  mechanism. Ours does — arm A pays a cold handoff between gathering and synthesis that arm B does not.
- **And the finding neither topology owns:** in all four executions the decisive defect was found by
  the top agent's **own mechanical sweep**, never by a gatherer — including a fake "Sailes baseline"
  in `sailes-design/premium-ux.md:7` that is invisible from inside any single slice. The verification
  pass is what produced the value; who spawned the gatherers did not change that.

### 2026-07-26 — a file can contradict itself eight lines apart and survive four releases
- **Context:** AGENTS.md §`main` is production said "A push to `main` deploys — automatically…
  There is no install step and no confirmation." Its §Release section, eight lines later, said
  "After merging: `./install.sh --force`." Both had been there since 1.9.1. STATE.md carried the
  same split as two adjacent **verified facts**: the active copy is `~/.claude/skills/` synced by
  install.sh, and the live plugin runs from the marketplace clone.
- **Problem:** they are two competing distribution paths, not two views of one. The plugin sources
  `"./"` and ships `skills/`, `agents/` and `hooks/`, auto-updating from `main`. `install.sh`
  copies `skills/` only, once, into a user-scope directory that then ages in place. Running both —
  which the release ritual instructed — leaves two copies of the same skill names on one machine,
  one auto-updating and one frozen, with nothing comparing them. Nobody noticed because the human
  had moved to the marketplace and simply stopped running the documented step.
- **Rule:** when a doc states a mechanism, the mechanism is a **claim with a location** — check it
  against the file that implements it, not against the neighbouring paragraph. `install.sh:17-18`
  and `enable-plugin.sh:2-4` settle this in ten seconds; four releases of prose did not.
- **Applies-to:** every "after merging / after installing" instruction, and any STATE.md entry
  filed under Verified facts — an entry that contradicts its neighbour is evidence that neither was
  re-checked, not that one of them is right.
- **Not a defect that shipped:** the marketplace path always worked. What shipped was a ritual step
  that quietly built a shadow copy for anyone who followed it — and the correction only surfaced
  because the human said "we do it through the marketplace" in passing.

### 2026-07-25 — half our prose is a bet on model unreliability, and the bet has an expiry date
- **Context:** Anthropic's "new rules of context engineering for Claude 5 generation models" reports
  removing **>80% of Claude Code's system prompt** with no measurable loss on coding evals, via five
  shifts: rules → judgment, examples → tool-schema design, upfront load → progressive disclosure,
  repetition → a single description, manual CLAUDE.md memory → auto-memory. Read against this repo,
  measured the same day: `skills/**/*.md` = **656 KB**; `sailes-discovery/SKILL.md` 21 KB / 3 293
  words, `sailes-design` 18 KB, `sailes-async` 16 KB — each loaded whole on trigger, while
  `sailes-bootstrap` already does the opposite (thin SKILL.md + 20 on-demand references).
- **Problem:** two of our patterns are 4.x-era bets that nobody has re-priced. (a) The spine is
  repeated **verbatim in three places** (`AGENTS.md:12`, `hooks/workflow-router.js`,
  `agents-md-template.md`) plus injected at SessionStart — exactly the redundancy shift #4 calls an
  artifact of older models' unreliability. `prompt-anchor` is the maximal form of that bet
  (re-injection on *every* prompt), and it is the top item on STATE.md's resume list. (b) Three
  skills are monoliths in a repo that already contains the progressive-disclosure pattern.
- **Rule:** the durable test the article gives us is **gotcha vs. inferable** — spend tokens on what
  the model cannot derive from the repo (`\r?\n` because this repo is CRLF; `main` is production;
  five files carry the version, not four), delete prose that merely corrects behavior a capable model
  gets right from context. This is our existing ratchet (`agentic-first-principles.md` §B.3) extended
  from lint-enforceable rules to judgment. **Two constraints on applying it, both of which invert the
  obvious order:**
  1. **Policy is not capability.** The article is about un-hobbling *skill*. `SPEC → HUMAN →
     VERIFIED → GATED` encodes *authority* — better judgment is precisely why HUMAN exists, since a
     model that guesses the stack correctly still must not choose it. The spine is out of scope for
     any simplification pass.
  2. **We cannot currently measure what a deletion costs.** 9 of 27 evals are stale and 1.15.0
     shipped without re-running three evals naming the files it edited. "Simplify aggressively" on
     that base is not un-hobbling, it is blind removal — the same shape as the six recorded silent
     failures. Eval debt is a *prerequisite* to cutting, not parallel work.
- **Applies-to:** `skills/sailes-{discovery,design,async}/SKILL.md` (split candidates); `agents/*.md`
  and AGENTS.md prose (gotcha audit); the `prompt-anchor` eval, which needs a **second arm** — a
  control without the anchor on Opus 5. Without it we would prove the anchor holds while never
  testing whether it is still needed, and a green single-arm result would read as justification.
- **Caveat that limits the whole transfer, and does not appear in the article:** their evidence is
  their system prompt, on their coding evals, on Claude 5. **We ship into three harnesses** —
  `agents/` (Claude), `codex-agents/` (Codex CLI, non-Claude models), `.github/copilot-instructions.md`.
  Prose that Opus 5 no longer needs is the only backstop the Codex twin has. Any cut is per-harness,
  never global — and `main` auto-deploys everywhere, so a wrong cut is immediate and machine-wide.
- **Not a defect:** nothing shipped broken. Recorded because the cost is silent — tokens and
  competing instructions — and because the article dates our assumptions rather than refuting them.

### 2026-07-25 — silence from a worker has two causes, and they need different fixes
- **Context:** six workers spawned for two eval runs. Four went idle having said nothing. The
  doctrine (`team-lead.md:40`, `agent-team-structure.md:115`) says that means the worker *failed
  silently*, so the lead chases once and escalates. The chase recovered every report, every time.
- **Problem:** the stated cause was wrong. All four had finished and had written full reports —
  `gate-arm-A3` said so outright once it had a channel that reached the lead. What failed was the
  transport, not the worker. Two workers were re-spawned for nothing, and one eval arm was blocked
  through two whole rounds. The rule kept working, so nothing forced its reason to be examined —
  the same shape as the 2026-07-20 meta-lesson.
- **Rule:** chase the silence exactly as before, but do not read it as negligence, and put the
  prevention in the **deliverable** rather than in the wording of the report clause: for anything a
  gate will grade, the brief names a FILE path and says the file is the task ("no file = not done").
  Evidence from the same session: four message-deliverable briefs → six empty returns and two
  wasted re-spawns; one file-deliverable brief → a complete, gradable artifact on the first try.
  Corollary from the same ledger: release is an act you confirm — 5 shutdown requests, 3 needed a
  second attempt, and a run log that records "released" on a request that was merely sent is fiction.
- **Applies-to:** `agents/team-lead.md`, `codex-agents/team-lead.toml`,
  `skills/sailes-bootstrap/agent-team-structure.md` §Agent lifecycle; every delegation. **No
  mechanical check is possible** — no hook observes a subagent completing — so this stays prose,
  with `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md` as the evidence base.
- **Escaped-defect:** none shipped, but the cost landed anyway: two re-spawns, six idle workers left
  alive until the human noticed, and a lead grading other agents against a lifecycle rule it was not
  executing itself.

### 2026-07-25 — a measuring instrument needs a fixture that must NOT fire
- **Context:** 1.14.0 shipped the physical-integrity probe (`browser-inspect.md` §1) with pasted
  evidence: five deliberate defects on a fixture page, all five found, plus "clean page returned
  `PASS: true`". The clean page was the same short synthetic page with the defects removed. Every
  word of the claim was true.
- **Problem:** on the first realistic page — one that scrolls, truncates a title with an ellipsis,
  and keeps a closed `display:none` menu in the DOM — the probe returned `PASS: false` on three
  counts, none of them a defect. The fixture was structurally incapable of showing it: at
  `docHeight` 675 on a 690px viewport there is no below-the-fold content to misclassify. A gate
  that fails every correct page is not a strict gate; it is a gate that gets argued with once and
  ignored thereafter — the exact impression-based verdict the instrument was adopted to replace.
- **Rule:** any check that classifies work as good or bad gets **two** fixtures — one it must flag,
  one it must not — and the negative one is modelled on real usage, not on the positive one with
  the defects deleted. Detection and invention are different claims; a defect-only fixture proves
  only the first. Where the check is code, the fixtures ship with a runner that reads the checked
  artifact itself (`evals/fixtures/browser-probe/run-probe.mjs` extracts the probe from the doc's
  code block), so the evidence is re-runnable instead of pasted.
- **Applies-to:** every gate, probe, hook or heuristic that emits a pass/fail; `evals/README.md`
  (scenario design); `sailes-test` (a suite that only proves the bug is caught is half a suite).
- **Escaped-defect:** the review gate read the probe as prose and accepted the pasted output as
  verification. What catches it now: the fixture pair is in the repo and runnable, and a claim of
  "fixture-verified" without a negative case is incomplete on its face.

### 2026-07-20 — a pre-formatted statistic is the highest-risk input you handle
- **Context:** building `sailes-test`, a delegated research agent returned a confident, well-formatted
  finding — specific percentages attributed to arXiv 2410.21136 (≈62% implementation-biased oracles,
  ≈45% passing on buggy variants, docstrings shifting bias ~70%→~55%). It flagged them UNVERIFIED but
  they were quotable-looking. A second agent dispatched to verify went idle three times without
  delivering, so the lead verified directly.
- **Problem:** the paper's abstract contains **no percentages at all** — its only figure is "24 Java
  repositories". Every number had been manufactured during summarization. A parallel claim (Luo et al.
  flaky-cause split 45/20/12) survived only partially: scope and ranking real, percentages
  unconfirmable. Both arrived looking like citations.
- **Rule:** an expected value you cannot justify from something other than the source is an echo, not
  a fact — for a citation and for a test oracle alike. Check the source or drop the number; never
  repeat a pre-formatted statistic because it looks sourced. This is now a worked example inside
  `sailes-test/references/techniques.md`, so the skill teaches the lesson its own construction taught.
- **Applies-to:** every delegated research result; `sailes-test` Step 1 (the oracle-provenance rule
  is the same rule). Promoted into skill content, not left as prose.
- **Meta:** the irony is the point — writing a tool against confident-but-wrong claims surfaced a
  confident-but-wrong claim in its own source material. The mirror pathology is not hypothetical.

### 2026-07-20 — a hardcoded list that a loop iterates is a silent skip waiting to happen
- **Context:** `codex-agents/validate-toml.test.js` held `const ROLES = [7 names]` and the accept-loop
  iterated that array, not the directory. Shipping `tester.toml` without editing the array would have
  left the new file **unvalidated while `npm test` stayed green** — caught only by the pre-implement audit.
- **Problem:** same class as the five silent failures of 2026-07-18 — a step reporting success for a
  reason other than the one claimed. A green suite that never looked at the new file reads as coverage.
- **Rule:** when a test iterates a hardcoded manifest, add a parity guard that the manifest matches
  reality (here: `deepStrictEqual(rolesOnDisk, ROLES)` both ways) so an omission fails loudly. Adding
  the missing entry fixes the instance; the guard fixes the class.
- **Applies-to:** any convention test driven by an in-code list; `codex-agents/validate-toml.test.js`.

### 2026-07-18 — a silent return is a false negative, not a finding
- **Context:** three losses in one session while building the prompt-anchor. Two delegated
  agents (`general-purpose`, `claude-code-guide`) signalled idle carrying no report; the lead
  recovered both only by noticing the absence and chasing. Separately the lead destroyed an
  uncommitted backlog entry with `git checkout <branch> -- <path>` and committed the reverted
  file, with `|| true` swallowing the signal.
- **Problem:** all three failures *looked like success*. An empty return is indistinguishable
  from "the agent looked and found nothing", so accepting it records a false negative as a
  result — and delegation is the lead's default path, so this sits under the main road. The
  destroyed file is the same class on a different surface: a silent loss that reads as done.
- **Cause — corrected 2026-07-18 after measuring, and the first version of this entry had it
  wrong.** It read as "agents lose their reports", which is a plausible story nobody had tested.
  Measured across five background teammates: three formed a correct answer and delivered
  nothing, and one said outright it had *written the answer as plain text instead of calling
  `SendMessage`*. The clause "your final message IS the deliverable" was not being ignored — it
  is **true for a scoped subagent and quietly false for a background teammate**, which must send
  its report. The workers obeyed an instruction that did not apply to the mode they were in, and
  only the lead knows which mode it spawned.
- **Rule:** an empty return is chased once, explicitly, then escalated to the human — never
  accepted, never re-spawned on a guess, never absorbed by the lead doing the work itself.
  "The agent found no issues" may be stated only if an agent actually said so. **Every brief
  names the delivery mechanism**, because the worker cannot infer it. Treat the chase as
  standard procedure rather than exception handling — at the observed rate it is the norm.
  Correspondingly: never use a destructive git path-restore to move an uncommitted edit between
  branches, and never mask a recovery command with `|| true`.
- **Applies-to:** `agents/team-lead.md`; `agent-team-structure.md` (Worker brief + lifecycle);
  every delegation, whatever the agent type. **No mechanical check is possible** — no hook
  observes a subagent completing — so this stays prose, and prose is what decays.
- **Meta-lesson, which is the more expensive one:** the wrong cause shipped in 1.9.0 as the
  written justification for a real rule, and survived because the rule *worked* — chasing
  recovered the work every time, so nothing forced the diagnosis to be checked. A fix that
  succeeds for the wrong reason is the hardest kind of error to notice. It took deliberately
  running the eval, five times, to see it.

### 2026-07-05 — a framework must dogfood its own standard
- **Context:** the 2026-07-02 spec had all phases checked complete, `Status: in-progress`, and
  sat in `.ai/specs/` root; this repo had no STATE.md/backlog.md/lessons.md at all.
- **Problem:** the framework prescribed a lifecycle and memory files it didn't itself follow —
  invisible until someone audited it, and corrosive to credibility.
- **Rule:** every artifact the skills prescribe for generated repos must exist and be current in
  THIS repo; closing a framework spec includes the lifecycle move in the same change.
- **Applies-to:** every framework change-set; `sailes-implement` On-completion.
