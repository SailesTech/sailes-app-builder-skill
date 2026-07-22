# Changelog — Sailes app-builder framework

The standard delta between versions. `adopt-existing-repo.md` **Upgrade mode** reads this file
to compute what a repo stamped with an older `Framework-Version:` is missing. Keep entries
upgrade-actionable: what a generated/adopted repo would now contain or do differently.

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
