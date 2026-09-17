# Sailes orchestration practices vs Workflow primitives

Scope: agents/*.md (10 role files), skills/sailes-bootstrap/{agent-team-structure,gate-scaling,
delegation-threshold,worker-status-template}.md, skills/sailes-implement/SKILL.md,
skills/sailes-test/SKILL.md, AGENTS.md (Delegation section),
~/.claude/projects/-home-charlie/memory/workflow-orchestration-lessons.md.
All citations are file:line in ~/Work/Internal/sailes-app-builder-skill unless marked (memory).

## Practice → Workflow mapping table

| Practice | Source | Verdict | How |
|---|---|---|---|
| Roles & model pins (10 files, each `model:`/`effort:` in frontmatter) | agents/*.md:1-7 each; roster table agent-team-structure.md:89-99 | TRANSLATE | `agent(prompt,{agentType:'be-dev', model:'claude-sonnet-5', effort:'high'})` — the script must pass model/effort explicitly per call; there is no frontmatter auto-load unless the harness's `agentType` resolution reads agents/*.md itself (not established here — see could-not-establish). |
| One task = one `Done-when` | team-lead.md:92 ("A task is one phase with one `Done-when`... measured 2026-09-12: 431 turns/135M tokens") | KEEP | This is a planning discipline for whoever writes the workflow script — it constrains how the script's author slices `agent()` calls, not a runtime primitive. No Workflow primitive enforces it; violating it still runs, just expensively (as the cited measurement shows for a live subagent run, not a Workflow run). |
| File-disjoint slicing + `ownership-check.js` | sailes-implement/SKILL.md:23-32 (`tools/ownership-check.js` exits 1 on overlapping path sets) | TRANSLATE | Script author runs `ownership-check.js` (or equivalent logic) before calling `parallel()`/fanning out `agent()` calls, since Workflow's `parallel()` barrier does not itself check file ownership — it only resolves throws to null (per brief's stated fact). The check must be a Bash step in the script, not a Workflow-native gate. |
| Worktree isolation + declaration commit + `WIP:` checkpoints | team-lead.md:95-104; agent-team-structure.md:229-319 | KEEP | Directly maps to `isolation:'worktree'` per agent() call for writing roles (be-dev, fe-dev, tester, designer, docs-author); read-only roles (explorer, checker, researcher) omit it, matching agent-team-structure.md:233-234. workflow-orchestration-lessons.md (memory) confirms worktree agents "cannot run git in the main repo" — merging must be a separate step/agent. |
| Worker status file `.claude/status/<worker-id>.md` | worker-status-template.md (whole file); team-lead.md:102-105 | CONFLICT | This mechanism exists because a scoped-subagent/live-teammate harness gives no other way to observe a silent worker (ladder in agent-team-structure.md:410-449: SendMessage → transcript tail → git log → status file). A Workflow script instead gets a direct return value or `null` from `agent()` (per brief: "agent returns null on death") — the death signal is already structural, so the elaborate claim/append/sweep protocol built to distinguish "never started / died mid-run / finished" collapses to simpler cases under Workflow's synchronous return. The file-based mechanism was built against a harness asymmetry (`Bash` reaches outside a worktree, `Write` does not, per team-lead.md:103) that may or may not exist inside a Workflow script's sandbox — not established here. |
| `maxTurns` fuses (per role) | agents/be-dev.md:6 (140), fe-dev.md:6 (220), tester.md:6 (220), checker.md:6 (100), qa.md:6 (210), explorer.md:5 (80); "A `maxTurns` fuse backs this up... A result the harness marks partial... partial counts as not finished" team-lead.md:93 | LOST / TRANSLATE (partial) | `maxTurns` is a Claude Code subagent-tool concept (partial-result marking, per team-lead.md:10-14, explicitly contrasted with the main session which "carries no maxTurns fuse" because "the harness's partial-result marking... does not apply"). The brief states Workflow's `agent()` has no declared `maxTurns` parameter in the primitives listed (only label/phase/schema/model/effort/isolation/agentType) — **could not establish** whether Workflow exposes an equivalent turn cap or timeout; if it does not, the per-role fuse values are LOST and must be reimplemented as a wrapper (timeout + retry logic) around `agent()`, which is a different mechanism from turn-count partial-marking. |
| Lanes `full` / `middle` (tier-scaled pipeline) | gate-scaling.md (whole file, canonical); team-lead.md:43-59 | TRANSLATE | This is pure control flow — `if tier==A: run full pipeline steps (tester human-freeze STOP, qa screenshots+vision-verify) else: run middle (tester DERIVED no-STOP, qa live-run only)`. Scripts natively express this as an `if` branch selecting which `agent()` calls/`pipeline()` stages run. No conflict — it's exactly the kind of branching a script does well. |
| Tester-before-checker informational isolation | team-lead.md:192 ("tester derives... with the implementation unread, the human freezes... then it writes"); sailes-test/SKILL.md:43-72 (Steps 1-2) | KEEP (serial) | Structural: tester's `agent()` call must receive a prompt/context that excludes the implementation diff — enforced by what the script passes into the brief, not by any Workflow primitive. This is a hard-serial step: tester step 1 (derive) must complete and be frozen before tester step 3 (write) begins, and the human-freeze STOP (full lane) is a genuine human-in-the-loop break (see STOP section below). |
| Checker sees diff + spec only (clean context) | checker.md:9-10 ("receives ONLY the diff, the spec/contract... Never forward the worker's report"); agent-team-structure.md:521 | TRANSLATE | Maps directly to constructing the checker's `agent()` prompt from only {diff, spec, checklist} — the script must NOT pass be-dev/fe-dev's returned message/report into the checker call. This is a prompt-construction discipline the script author owns; no primitive enforces it, but nothing conflicts either. |
| qa exclusive env + full suite once pre-push | qa.md:23-51 (env-lock via `.ai/ENV-LOCK`, `holder`/`since`/`token`); team-lead.md:110 (2b) | CONFLICT | Environment exclusivity is a claim about the *runtime* (DB, containers, ports) shared across the whole machine, not about files — worktree/isolation does nothing here (explicit in text: "File isolation does nothing here"). A Workflow script running phases in `parallel()` has no built-in primitive for holding a non-file resource lock; the script must serialize any step that touches the live stack/DB relative to a qa `agent()` call (e.g., run qa in `pipeline()`, not `parallel()`, with respect to any other DB-touching agent), or implement the `.ai/ENV-LOCK` file convention itself. This is the same lock-around-a-non-clonable-resource problem team-lead.md:108 half-solves for the toolchain (pnpm store) — "do not start a gate while a worker is standing up a worktree." |
| Report-clause: gate roles (checker/qa/tester) write an incrementally-growing report FILE; implementer roles (be-dev/fe-dev) report a fixed-field MESSAGE (<=40 lines) | team-lead.md:106 (spelled out); tester.md report section:80-88; be-dev.md report section:61-71; AGENTS.md Delegation section (quoted in full in system prompt) | KEEP | `schema` (StructuredOutput) on `agent()` is the Workflow-native way to force a fixed-field return for implementer roles — maps well onto the "message in fixed fields" convention. For gate roles the incremental-file requirement is stronger than what a single `agent()` return buys: the doctrine exists specifically because "its report IS the deliverable... not a document composed at the end" and because a dying process loses an in-memory report (team-lead.md:106, 210: "one assignment burned... died with its process holding an unwritten report"). Under Workflow, `agent({schema})` throwing on death (per brief) already gets caught by try/catch per the lessons file — but a file written incrementally during the agent's run is still the only way to recover PARTIAL findings from a dead gate agent, since a thrown/null result carries nothing. So: keep the incremental-file convention for checker/qa/tester regardless of `schema` use; `schema` alone does not replace it. |
| Empty return = failure, never a completion | team-lead.md:202-208 ("An idle signal carrying no report is never a completion... Chase it once... Still empty → escalate to the human") | TRANSLATE | Maps to: `agent()` returning `null` (per brief: "agent returns null on death") or an empty/malformed schema result must be treated by the script as unfinished, not as "no issues found" — this is exactly the null-death signal the brief already names. The "chase once, then escalate to human" two-step needs the script to make one retry `agent()` call before surfacing to the human — ordinary script logic, not a primitive. |
| Human freeze of test plan (`.ai/test-plans/<spec>.md`, `full` lane) | sailes-test/SKILL.md:64-70 ("Hard stop, full lane only. Step 3 may not begin while plan says DRAFT... ratifying after the tests exist is a rubber stamp") | CONFLICT — must split into separate workflows | A single Workflow script runs end-to-end without a human turn in the middle (no primitive for "pause script, wait for a human message, then resume the same script" was described in the brief). The freeze STOP is a genuine blocking human decision point mid-pipeline (`full` lane only — `middle` lane explicitly removes it, sailes-test/SKILL.md:72-73). This forces the orchestration into **two workflow scripts**: Workflow A runs tester step 1 (derive) and stops, emitting the DRAFT plan as an artifact for the human; Workflow B (invoked after the human edits/approves the plan file) resumes from tester step 3 onward. The brief's fact "resume by cached prefix" suggests a single script *could* be resumed after external human edit to a file it reads, but the human's edit must happen strictly between two `agent()` calls that are in two different script invocations, not two steps of one running script — could not fully establish whether a single script invocation can literally suspend for a human response versus needing to end and be re-invoked. |
| Escalation of key decisions (stack/contract/data-model/auth/roles) — "the human owns every key decision" | team-lead.md:113-115, 195, 199; AGENTS.md spine "HUMAN" | CONFLICT — same split as above | Any point where a worker or the lead-equivalent script hits a key decision must stop and surface to the human before continuing (team-lead.md:113: "escalate to the human, get the answer, then freeze... Never silently pick the architecture mid-pipeline"). Same structural problem as the test-plan freeze: a Workflow script that cannot block-and-wait for a human turn must instead **end** at the decision point (report the options as its artifact) and a **second workflow** picks up post-decision. Unlike the test-plan freeze, this STOP is not tied to a lane — it can occur at any point the lead's planning logic reaches an unresolved architectural fork (team-lead.md:113, 146-156 "escalate with a measurement, not a guess"). |
| Substitute decisions for non-key blockers (be-dev/fe-dev take one after one round, mark in code) | be-dev.md:17; fe-dev.md:18; team-lead.md:115 | KEEP | This does NOT require a human stop — it's an in-`agent()`-call behavior instruction in the worker's own brief/prompt ("Blocked longer than one round... take a substitute decision and mark it"). No Workflow primitive involvement; purely prompt content. |

## Specific questions

### Which gates stay serial in the lead vs. can be scripted

- **Scriptable (ordinary control flow, no human needed mid-gate):**
  - `checker` verdict branch (APPROVE/NITS → continue; CHANGES-REQUIRED → loop back to a fresh
    worker, checker.md:22, team-lead.md:195 "CHANGES-REQUIRED loops back to the relevant dev with a
    fresh worker") — an `if` on the returned verdict field (via `schema`).
  - `qa` PASS/CHANGES-REQUIRED/ENV-DEFECT branch (qa.md:58-61) — same shape.
  - Lane selection (`full` vs `middle`) — gate-scaling.md, computed once at spec time from triggers,
    then read as a flag the whole script branches on.
  - Pre-existing-red establishment (`comm -23` between branch-red and base-red test names) —
    checker.md:16-17, qa.md:13-14 — this is exactly a Bash step (`git worktree add --detach`, run,
    `comm`) a script can run directly, not agent judgment.
- **Stays serial and gated by something the lead (or the script's control logic) must hold, not
  parallelize away:**
  - BE contract freeze before `fe-dev` starts — team-lead.md:111, agent-team-structure.md:179. A
    hard sequential dependency: fe-dev's `agent()` call must not fire until the contract artifact is
    committed.
  - `tester` step 1→2→3 ordering (derive unread → freeze → write) — sailes-test/SKILL.md:33-42;
    cannot be parallelized against the very code it must not have read.
  - `qa` environment exclusivity — qa.md:23-27, team-lead.md:110 (2b): no other DB/container-touching
    agent may run concurrently with qa; this is a scheduling constraint the script must enforce
    (serialize, not `parallel()`) since Workflow's `parallel()` barrier (per brief) has no notion of
    non-file resource locks.
  - docs-delta step before `git mv` to `implemented/`, with the lead "showing the receipt and
    STOPping" (sailes-implement/SKILL.md:72-76) — a human-visible checkpoint, not a hard human-input
    block, but still sequenced strictly after all phases close.

### Where a human STOP breaks a single workflow and must split it into several

Two distinct STOP classes, both requiring the running script to **end** rather than block-and-wait
(per the CONFLICT rows above):
1. **Test-plan freeze**, `full` lane only (sailes-test/SKILL.md:64-70) — script ends after emitting
   the DRAFT plan; a second script resumes at tester step 3 once the plan file shows `FROZEN`.
2. **Key decisions** (team-lead.md:113, 195, 199) — script ends at the point of the unresolved fork,
   surfacing options (team-lead.md:146-156's escalation-with-a-measurement format for cases with no
   clear recommendation); a second script resumes post-decision. Unlike (1), this can occur at *any*
   pipeline point, not just after tester step 1, so the number of possible split points in a given
   task is not fixed in advance — the script author has to anticipate likely fork points (contract
   shape, data-model, auth) and end the phase's script at whichever one actually triggers rather than
   architecting the whole run as one continuous script from the start. **Could not establish** from
   the brief's primitive list whether Workflow supports any notion of a paused/suspended run a human
   can inject an answer into and then "resume"; the brief's "resume by cached prefix" was the closest
   candidate but its scope (rerunning a workflow from a cache after a code change, vs. suspending for
   live human input) was not established here.

### How model pins interact with `agent({agentType})` and model override

- team-lead.md:166 gives the resolution order for the *live subagent tool*: `CLAUDE_CODE_SUBAGENT_MODEL`
  env → per-invocation `model` param → role frontmatter pin. Whether Workflow's `agent()` honors the
  same three-way resolution, or reads role frontmatter (agents/*.md `model:` lines) automatically when
  given `agentType:'be-dev'`, was **not established** — the brief lists `agentType` and `model(alias
  only)` as separate, independent parameters of `agent()`, which suggests the script author must pass
  both explicitly (`agentType` for tool-allowlist/identity, `model` for the actual model) rather than
  `agentType` alone pulling the frontmatter pin.
- **Alias-only constraint carries over and matters more under Workflow than under the live tool.**
  team-lead.md:176 and agent-team-structure.md:129-131 both state, as a measured fact (2026-07-26),
  that the Agent tool's `model` param accepts ONLY `sonnet`/`opus`/`haiku`/`fable` aliases and rejects
  a full ID (`claude-sonnet-5`) with `InputValidationError`. The brief states Workflow's `model()` is
  likewise "alias only" — so **the doctrine's own stated preference for pinning full model IDs on the
  roster table (agent-team-structure.md:109: "Model IDs are pinned, not aliases... An alias silently
  follows whatever the tier's default becomes") is structurally impossible to honor through this
  parameter in either the live tool or Workflow.** The script can only pass an alias; keeping the pin
  precise then requires NOT passing `model` at all when a role's default alias is already what's
  wanted (mirroring team-lead.md:176 "omitting model is how you keep the pin"), and logging exactly
  which alias resolved, per the same accountability the doctrine already demands.
- `effort` fails silently in the live Agent tool (team-lead.md:176: "not a declared parameter of the
  Agent tool, yet passing it raises no error... treat effort as frontmatter-only"). The brief lists
  `effort` as a declared `agent()` option for Workflow, which is a **different fact** from the live
  tool — if accurate, Workflow's `effort` parameter may actually take effect where the Agent tool's
  silently does not; this reverses part of the doctrine's advice (that escalation-by-effort is
  unreliable) but **could not be verified against Workflow's actual runtime behavior** from static
  docs alone — the doctrine's own methodology (team-lead.md:176) insists this class of claim be
  checked "against the live tool," which this recon did not do.

### What effort each role should run at

From the roster table (agent-team-structure.md:89-99) and individual frontmatters:

| Role | Model (pin) | Effort | Note |
|---|---|---|---|
| team-lead | claude-opus-5 | high | team-lead.md:4-5 |
| explorer | claude-haiku-4-5 | *(none — unsupported on Haiku 4.5)* | explorer.md:5; agent-team-structure.md:163-164, 182 |
| researcher | claude-opus-5 | high | researcher.md:4-5 |
| designer | claude-sonnet-5 | high | designer.md:4-5 |
| be-dev | claude-sonnet-5 | high | be-dev.md:4-5 |
| fe-dev | claude-sonnet-5 | high | fe-dev.md:4-5 |
| tester | claude-sonnet-5 | high | tester.md:4-5 |
| checker | claude-sonnet-5 | high | checker.md:4-5 |
| qa | claude-sonnet-5 | high | qa.md:4-5 |
| docs-author | claude-sonnet-5 | medium | docs-author.md:4-5 (only role pinned to `medium`) |

Doctrine's downgrade rule: "A `Done-when` is a pass/fail read of exact commands against expected
output... a lightweight model grades it. Raising effort on a binary read buys nothing" (team-lead.md:172,
agent-team-structure.md:122-123) — this argues for routing the mechanical `Done-when` command-running
sub-step (not full checker/qa judgment) to a cheaper model/effort than the pinned `high`, but no role
file actually implements this split; it is stated as available headroom, not as a current pin.
Escalation triggers (to opus, or effort up) are named only for: contract/data-model/auth/tenancy
surfaces, migration-parity judgment, diagnosis with no reproducible mechanism, entangled changes with
no clean slice (team-lead.md:170), and for `checker`/`qa` specifically when the defect risk is
"what the diff omits" rather than what it contains (team-lead.md:174).

### Where `maxTurns` vs prompt call-limit vs `schema` interact

- `maxTurns` (agents/*.md frontmatter, e.g. be-dev.md:6 `140`, checker.md:6 `100`) is explicitly a
  **live-subagent-harness** concept: team-lead.md:10-14 states the lead itself "carries no maxTurns
  fuse" specifically because it "runs as the main session, not a spawned subagent, so the harness's
  partial-result marking... does not apply" — i.e. `maxTurns` is coupled to the harness's
  partial-result marking mechanism, not a generic timeout. **Could not establish** whether Workflow's
  `agent()` exposes an equivalent (the brief's fact list for `agent()` options does not name one), so
  whether this maps at all is unresolved; if Workflow has no per-call turn cap, the 80–220 range of
  values across roles has no destination and the script would need its own external timeout/retry
  wrapper to reproduce "partial result = not finished."
- `schema` **forces `StructuredOutput`** (per brief) — this directly satisfies the report-clause's
  fixed-field requirement for implementer roles (be-dev.md:61-67, fe-dev.md:60-67: "A message in
  fixed fields, at most 40 lines, in this order...") and could plausibly replace prose-parsing of
  those reports. It does NOT by itself satisfy the gate-role incremental-report-FILE requirement
  (team-lead.md:106, 210) — `schema` only shapes the *final* return value; a checker/qa/tester agent
  that dies before returning still loses everything unless it was also separately writing to a file
  during its run, so `schema` and the incremental-file convention are complementary, not substitutes.
- "Prompt call-limit" (a cap on how many tool calls a single agent prompt may issue) was named in the
  broader research brief's framing but **no source in this slice defines such a limit** — the closest
  analog is `maxTurns` itself (frontmatter) and the informal move-budget instruction the explorer's
  own brief carries elsewhere in this framework (not part of the cited files). Not established from
  this slice's sources.

## Could not establish

- Whether Workflow's `agent({agentType:'be-dev'})` automatically loads that role's frontmatter
  (`model`, `effort`, `tools`) the way the live Agent tool does per agent-team-structure.md:530-546
  ("Every worker is spawned as its own agent type... it carries the pinned model and effort, the
  tool allow-list, and the name"), or whether the Workflow script must pass all of those explicitly
  per call. Not stated in the brief's primitive list.
- Whether Workflow exposes any per-call turn/step cap or timeout equivalent to `maxTurns`, and
  whether a Workflow `agent()` call that exceeds it produces a partial/degraded result the caller can
  detect (vs. only the stated null-on-death and thrown-schema-failure outcomes).
- Whether a running Workflow script can genuinely pause and wait for a human response mid-script
  (a live "STOP" as the test-plan freeze and key-decision escalation require), or whether every
  human-in-the-loop point necessarily ends one script invocation and starts another. The brief names
  "resume by cached prefix" but its exact semantics (cache-based rerun after external change vs.
  true suspend/resume for a live human answer) were not confirmed from the sources read.
- Whether Workflow's `effort` parameter actually takes effect at runtime (the live Agent tool's
  `effort` param is documented in this framework as accepted but silently inert — team-lead.md:176 —
  and the brief's fact sheet describes Workflow's `effort` as a distinct, apparently functioning
  parameter, but this recon did not verify Workflow's behavior against a live run).
- Whether Workflow's `isolation:'worktree'` reproduces the exact worktree-branch/cherry-pick/commit
  semantics this framework's doctrine assumes (worktreePath/worktreeBranch tool-result fields,
  shared `.git` visibility) — the brief states isolation:'worktree' exists as an option but this
  slice's sources describe the *live Claude Code Agent tool's* worktree mechanics specifically, not
  Workflow's.
- Whether `.claude/status/<worker-id>.md`'s harness-asymmetry rationale (`Bash` reaches outside a
  worktree where `Write` refuses to, team-lead.md:103) holds inside a Workflow-orchestrated agent's
  sandbox at all — not established.
