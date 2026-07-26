# Changelog — Sailes app-builder framework

The standard delta between versions. `adopt-existing-repo.md` **Upgrade mode** reads this file
to compute what a repo stamped with an older `Framework-Version:` is missing. Keep entries
upgrade-actionable: what a generated/adopted repo would now contain or do differently.

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
