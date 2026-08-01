# STATE.md — session memory for the sailes-app-builder framework repo

Last-commit: 907a071

> Read at session start; write before walking away. Facts enter **Verified facts** only with
> evidence; hypotheses stay in **Open failures**.
>
> The `Last-commit:` line above is the convention 1.25.0 introduced for client repos, and this repo
> keeps it too — update it **together with** whatever you change below, or update neither. A file
> whose top and bottom disagree is worse than a stale one, because the reader cannot tell which half
> to believe, and the session hook makes everyone read the top first. Note the hook that compares it
> against `git HEAD` is `hooks-template/session-start.sh`, which ships to *client* repos; here the
> line is a discipline, not an enforced check.

## Verified facts
- **Distribution is the marketplace plugin, and `install.sh` is not part of it** (corrected
  2026-07-26; this entry previously asserted the opposite and contradicted the bullet below it).
  `marketplace.json` sources `"./"`, so the plugin ships `skills/`, `agents/` **and** `hooks/` and
  auto-updates from `main`. `install.sh` copies `skills/` only into `~/.claude/skills/`, where it
  then stays frozen until someone re-runs it — a pre-plugin path that *shadows* the plugin rather
  than syncing it, and leaves two copies of the same skill names on one machine with nothing
  comparing them. Evidence: `install.sh:17-18` (`SRC=$REPO_DIR/skills`, `DEST=$HOME/.claude/skills`)
  against `enable-plugin.sh:2-4` ("run once per machine… no per-project action needed") and
  `AGENTS.md` §`main` is production ("there is no install step and no confirmation"). The stale
  "After merging: `./install.sh --force`" line has been removed from AGENTS.md.
- **This machine joined the marketplace on 2026-07-26** — `enable-plugin.sh` was run, adding
  `extraKnownMarketplaces.sailes` + `enabledPlugins["sailes-app-builder@sailes"]` to
  `~/.claude/settings.json` (backup: `settings.json.bak-before-enable-plugin`; the existing
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` was preserved). **Registration happens at session start,
  not on running the script**: `known_marketplaces.json` still listed only `claude-plugins-official`
  immediately afterwards. Verified from this side: `git ls-remote` resolves the source repo and
  `main` is `20a8b54`, so the install will pick up 1.16.0 rather than something older.
  Until the next session the Sailes roles still do not resolve here, and every "team" run on this
  machine before that point was staffed by `general-purpose` stand-ins.
- **`main` is production.** The live plugin runs from `~/.claude/plugins/cache/sailes/…`, sourced
  from a clone at `~/.claude/plugins/marketplaces/sailes` that tracks **`main`** with
  `autoUpdate: true` (evidence: `known_marketplaces.json`; it self-updated to `9998c62` on
  2026-07-18 11:53 unprompted). A push to `main` deploys to every machine that ran
  `enable-plugin.sh`; a push to any other branch reaches nobody. Local edits never reach a session.
- Skill regression tests are persisted in `evals/` since 1.1.0. Before that, RED/GREEN lived only
  in chat sessions.
- Framework version lives in `VERSION` (currently **1.14.1**) and must match `package.json`,
  `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` **and this repo's own AGENTS.md
  `Framework-Version:` stamp** — five files. The marketplace one has drifted twice; the stamp has
  now drifted twice as well (1.13.0 needed a follow-up commit, 1.14.0 shipped stale). Evidence a
  stale stamp is not cosmetic: with `CLAUDE_PLUGIN_ROOT` at 1.14.0 and the stamp at 1.13.0,
  `hooks/framework-version-check.js` emits "this repo is stamped 1.13.0 … offer Upgrade mode" into
  every session — the framework nagging itself. The standard delta per version is in `CHANGELOG.md`.
- Spec lifecycle is enforced here too: `.ai/specs/` root = live. Both 2026-07-05 specs sat
  completed-but-unmoved for 13 days and were moved to `implemented/` on 2026-07-18 — the exact
  drift `workflow-router.js` was built to flag, in the repo that wrote the check.
- **No hook observes a subagent completing** (evidence: the hook event surface is session start,
  prompt submit, tool calls). A missing delegation report therefore cannot become a check; the
  rule for it is prose by necessity.
- **A silent worker is usually not a negligent worker** (1.15.0). Ledger of 2026-07-25, six workers:
  four went idle saying nothing and all four had finished with full reports — the final-message
  channel dropped them. Release is equally unreliable: 5 shutdown requests, 3 needed a second
  attempt. Both are now in `agent-team-structure.md` §Agent lifecycle and `team-lead.md`, with the
  prevention in the deliverable — a gradable task names a FILE path, and that brief was the only one
  of six that worked first try. Evidence: `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md`.
- **Three UI gates were stated as binary and verified by impression until 1.14.0** — the
  physical-integrity six (`sailes-design/SKILL.md`), contrast/focus/keyboard (`ux-rules.md:7,37,66`),
  and the latency budget (`premium-ux.md` §1). All three are measurable over CDP; the instrument is
  `skills/sailes-design/browser-inspect.md`, optional with an explicit-SKIP fallback (graphify
  pattern). Evidence the probe works, **both directions**, and it is re-runnable rather than pasted:
  `node evals/fixtures/browser-probe/run-probe.mjs` — the defect page surfaces all five (incl. an
  overlay-covered button, invisible to any screenshot), the clean page returns `PASS: true`.
- **1.14.0's probe failed every realistic page, and its fixture could not have shown that** (fixed
  in 1.14.1). The only fixture was a short synthetic defect page, so three false-positive classes
  shipped: below-the-fold content read as off-canvas, ellipsis truncation read as clipping, and
  controls in a closed `display:none` menu read as unclickable. The runner now reads the probe out
  of the doc's code block, and the clean-page fixture is the half that catches invention.
- **Eval staleness is now measurable, and the instrument reproduced the known debt on its first run**
  (1.16.0). `node evals/harness/eval-status.js` reads a scenario's `Files:` line against `git log`;
  the three `lead-*` evals came back STALE against files changed 2026-07-25 — exactly the debt this
  file already recorded, arrived at independently. 17 assertions in `eval-status.test.js`, in
  `npm test`. **Only 3 of 27 scenarios carry `Files:`**; the other 24 report NO-FILES, which is the
  instrument declining to compute rather than passing them.
- **Claude Code 2.1.220 facts that the design depends on** (dated — two of them changed within the
  last few releases): subagent frontmatter supports `model` (alias, full ID, or `inherit` — default
  `inherit`) **and** `effort` (`low`…`max`); resolution is `CLAUDE_CODE_SUBAGENT_MODEL` →
  per-invocation parameter → frontmatter. **Nested spawning is OFF by default** and needs
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`; from v2.1.172–v2.1.216 it was on by default up to five
  layers, so "it worked without config" is a true memory about a version we are not on. Caps: 20
  concurrent, 200 per session. **Plugin subagents cannot carry `hooks`, `mcpServers`, or
  `permissionMode`** — those fields are ignored, and we ship as a plugin. **`effort` is unsupported
  on Haiku 4.5**, which is why `explorer` has no `effort:` line.
- **Role enforcement audited by running the roles, 2026-07-26** — the first time the 1.16.0 routing
  ever executed, because until the plugin was installed here every "team" was `general-purpose`
  stand-ins. Spawned `checker` and `explorer` as their real types and asked what they could do.
  **Enforced:** the model pin (`explorer` = `claude-haiku-4-5`, `checker` = `claude-sonnet-5`,
  each matching its frontmatter), the tool allow-list (`checker` had exactly Glob/Grep/Read/Bash —
  `Write` and `Edit` absent from the schema, not merely unused), and **the absence of `Agent`**,
  which is what makes depth-2 sub-teams safe and is now verified rather than read off a file.
  **NOT enforced: "read-only".** Both roles wrote a file through `Bash` on the first attempt, no
  friction. Every gate carries Bash because the job needs it (lint/types/suite for `checker`,
  driving the app for `qa`), and `permissionMode` is ignored for plugin subagents, so there is no
  shippable lever. The gate's integrity never rested on the write restriction — it rests on the
  inputs being limited to diff + spec + checklist. Doctrine corrected to say which half is which.
  Evidence: `.ai/eval-runs/2026-07-26-role-runtime-audit/`, both claims re-verified on disk by the lead.
- **The gates cannot spawn, by configuration rather than by promise.** All seven non-lead roles carry
  an explicit `tools:` list and none includes `Agent`; only `team-lead` inherits the full pool. This
  is what makes depth-2 sub-teams safe to enable — turning nesting on cannot make a worker or a gate
  fan out. Evidence: `agents/*.md` frontmatter, verified 2026-07-26.
- **A dev server cannot produce an absolute performance verdict** — unminified HMR bundle, no CDN,
  no prod cache headers. `lighthouse_audit` excludes performance by design; dev CWV numbers are a
  *relative* signal only. Geometry and contrast, by contrast, are valid on dev.

## General rules
- Every framework change lands as: proposal spec (root `.ai/specs/`) → human answers Open
  Questions → edits with binary Done-when outputs pasted → evals updated → CHANGELOG entry →
  VERSION bump (all five stamps) → merge to `main`, which IS the deploy — the marketplace plugin
  auto-updates from it, and there is no post-merge install step.
- A measuring instrument gets a fixture for **both** directions: one that must be flagged, and one
  that must not. A defect-only fixture proves detection and says nothing about invention, and an
  instrument that flags correct work is worse than none — the gate gets argued with, then ignored.
- Editing a skill = re-run the `evals/` scenarios naming it; new protected behavior = eval first.
- Experiments that change global behavior stay on a branch until their eval returns a verdict.
  `main` is not a staging area.

## Open failures
- **1.15.0 shipped without re-running the three evals that name the files it edited** —
  `lead-chases-an-empty-worker-return` (which covers the very rule that was rewritten),
  `lead-delegates-instead-of-bulk-coding`, `lead-honors-codex-delegation-and-still-gates`. The
  `evals/README.md` rule is explicit: editing a skill means re-running every scenario naming it.
  `npm test` was green, and green there says nothing about these. The human deferred the harness
  work on 2026-07-25; the debt is real and named here so it is not mistaken for coverage. Measured
  the same day: **9 of 27 evals are stale** by the same definition (last run older than the last
  change to the file under test).
- ~~1.14.0's two evals are RED/GREEN PENDING~~ **CLOSED 2026-07-25 — both PASS.** Dispatched to
  fresh workers: the integrity-gate eval green in both arms (instrument present → CHANGES-REQUIRED
  quoting the probe at three widths; absent → literal `SKIP browser-inspect` plus five of six checks
  marked NOT ESTABLISHED rather than passed), and the boundary eval green on the re-run (suite
  authored, CDP evidence labelled "diagnostyczny, nie test", detection proved by mutation). Ledger
  and both caveats — the MCP server itself was never exercised, and the boundary eval's first run
  was voided by a fixture defect — in `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md`.
- **One open decision in 1.14.0: does `designer` get browser tools?** It has no Bash today, so it
  cannot render its own spec before handoff; the integrity gate runs on whoever builds. Widening
  that role is a human call, left unchanged. See `.ai/specs/2026-07-25-browser-devtools-instrument.md`
  §5 — a three-line edit once answered.
- **`prompt-anchor` Phase 5 is INCONCLUSIVE and the decision is re-opened (D3 triggered).** Both
  eval arms passed identically — but the fixture condensed 58 turns into ten lines, leaving the
  SessionStart mandate ~500 tokens from the hostile brief instead of 80k. The control held
  because the mandate was still in view; the condition an anchor would address was never created.
  The hook stays on `enforce/*` and does NOT merge until a fixture with real context distance
  exists. Do not cite `evals/anchor-holds-the-line-deep-in-session.md` as if it had answered.
  **Audited 2026-07-25 — the anchor is NOT on prod, and it is easy to believe otherwise.** Proof:
  `hooks/` on `main` holds only `framework-version-check.js` and `workflow-router.js`, and
  `hooks.json` carries no `UserPromptSubmit` entry. What *did* ship is the other half of that work,
  `ea7c10c` "one canonical spine" — the SPEC → HUMAN → VERIFIED → GATED block printed at session
  start. It looks like the anchor and does part of its job, but it fires at a session boundary; the
  anchor fires per prompt, which is the whole point (turn 40, mandate 80k tokens back).
  All four `enforce/*` branches fork from `ea7c10c` (2026-07-18) and have not moved since, so they
  are a week behind: their diff vs `main` shows ~5000 deletions purely because `main` gained
  `sailes-test`, graphify, `sailes-migrate` and the browser instrument.
  **Why it is now unblockable:** the eval failed for the exact reason recorded in the new
  2026-07-25 lesson — a fixture that cannot create the condition under test. That pattern hit three
  times in one repo (anchor's condensed context, the probe's defect-only fixture, the boundary
  eval's BOM-broken feature), and the third one was fixed with a technique that works. Path:
  rebase `enforce/*` onto current `main` → build a fixture with **real** context distance (a long
  session, not a summary of one) → re-run the eval → merge or drop on the verdict.
- Behavioral GREEN re-runs for the 1.1.0 text-level changes are still pending — inherited, open
  since July. Either run them or write them off deliberately; they have been "pending" long enough
  that nobody now knows which.
- **Five silent failures in one day**, four of them fixtures: MSYS paths in a hook test; a typo
  that did not exist; a `git checkout -- <path>` that destroyed an uncommitted edit; a CRLF regex
  that no-op'd; backticks in a shell heredoc that ate half a STATE.md rewrite. Plus the
  condensed-context depth eval, which nearly became a conclusion. The pattern is one thing:
  **a step that reports success for a reason other than the one claimed.** Two mitigations are
  now in AGENTS.md (verify a scripted edit landed; `\r?\n` not `\n`); a third is simply to stop
  pushing prose through a shell — use the file-writing tools.
  **Sixth instance, 2026-07-25 (1.14.0):** a probe "fixture-verified" against a defect-only page.
  Every assertion in that claim was true and the instrument still failed every correct page. The
  mitigation is in General rules — both directions, or it is not a fixture.

## Lessons learned
- See `.ai/lessons.md` (framework-level lessons; project-level ones live in each client repo).

## Last session
- 2026-08-01 (**resume here**): **1.25.2 and 1.26.0 are written and green — and NOT on production.**
  Both sit on branch `release/1.25.2` (`fc15ccb`, `415a3f1`), unpushed. Source: the 2026-08-01
  wnioski file; spec `.ai/specs/2026-08-01-milestone-lessons-to-doctrine.md`, `Status: in-progress`.
  - **1.25.2 — harness.** `qa` had been structurally unable to start the app **for every task since
    2026-07-31**, and nobody noticed because nobody ran it in that window. Env is now tiered by
    RISK, not by filename: the local `.env` and `.env.example` belong to agents, `.env.production*`
    / `.env.staging*` / key material stay denied. Also: `ENV-LOCK` carries a `token:` (it had been
    blocking its own holder), the PreToolUse matcher is `Bash|Edit|Write` (it was `Edit|Write`, so
    the guard's whole command surface had never once executed while its comments claimed it did),
    and `git add`/`commit`/`log` are allowed (doctrine mandated worker commits that the permission
    layer refused).
  - **1.26.0 — doctrine.** `Done-when` must cover the phase's own allowed-files list; `checker`
    opens with what the diff does NOT do; API surface as `yaml`; dispatch from the file-ownership
    table, not the phase graph; the fourth collision axis (shared package store + cores) with the
    count-before-you-kill rule; `WIP:` checkpoints plus the lead's observation ladder (metadata is
    observation, content is integration); worktree-base verification in every brief.
  - **The gap, and it is the reason nothing was pushed.** Three new evals were added
    (`done-when-covers-the-allowed-files-list`, `checker-reports-what-the-diff-omits`,
    `lead-diagnoses-processes-before-killing-them`) and **none was run**; `checker` and `qa` never
    convened, because delegation was switched off for the session by the human. `npm test` green
    proves the files are consistent, not that the instruction lands — which is this repo's own
    stated distinction. Run the three evals before pushing.
  - Open decision carried forward: the human chose a **separate spec for delegation precision and
    agent control**, to be scoped right after this one. Nothing of it is in 1.26.0.
- 2026-07-31 late: **1.25.1 is on production** (`907a071`) — a patch on 1.25.0, found an hour
  after it shipped **by running the convention instead of reading it**. The STATE.md snapshot check
  compared `Last-commit:` to `git HEAD` for equality, and writing STATE.md means committing it, so
  a repo following the convention *perfectly* sits one commit behind forever — the hook warned at
  every session start. Cries-wolf, in the check whose own comments warn about cries-wolf.
  - **The first fix was wrong in the opposite direction** and is the part worth remembering: "has
    STATE.md been touched at all since `Last-commit`" goes *silent* however much work follows,
    because the snapshot's own commit touches it. I swapped an always-fires alarm for a never-fires
    one. **`hooks-template/hooks-template.test.js` caught it** — the suite written in F4 two hours
    earlier, for exactly the surface that had never had a test.
  - Right measure: **commits since `Last-commit` that are not the snapshot's own write.** The
    snapshot commit subtracts itself, so the healthy steady state is silent; work that followed the
    snapshot reports its count, and the warning names it.
  - Adopted repos that never re-copied `session-start.sh` were never affected — the 1.25.0
    distribution boundary limits a defect's blast radius as well as a feature's reach.
- 2026-07-31 (**resume here**): **1.25.0 is on production** (`bfb7931`, pushed to `origin/main`).
  One day of Sailerem lessons validated and shipped — spec
  `.ai/specs/implemented/2026-07-30-sailerem-lessons-to-doctrine.md`, six phases, thirteen items.
  - **Biggest change: `isolation: worktree` for every worker that writes**, and the hard rule
    rewritten in fifteen places — "workers never commit or push" → **"never to a *shared* branch,
    never push; in your own worktree you commit, and should."** Git guarantees the old rule's
    purpose (the shared branch is checked out in the main tree). The commit buys what prose could
    not: it is the worker's declaration that the work is finished, so the lead never cherry-picks a
    half-written file. **Retrieval was measured, not assumed** — the spawn returns
    `worktreePath`/`worktreeBranch`, the harness makes a branch per worker, the commit is visible
    from the main tree immediately.
  - **The caveat that matters more than the mandate: a worktree isolates FILES, not the RUNTIME
    ENVIRONMENT.** `qa` now takes exclusive hold of the stack, enforced by an `ENV-LOCK` branch in
    the guard hook that names the holder and states how to break the lock.
  - **Two new tests in the gate** (`spec-status-evidence.test.js`, `hooks-template/hooks-template.test.js`
    — the shell templates shipping to every generated repo had none until now), a new
    `runbook-template.md` (required by five places, generated by none), four new evals.
  - **`checker` ran three times and earned it every time.** NITS on F1 (the evidence check accepted
    `checker:` without `qa:` — i.e. it permitted omitting the gate that actually failed in the
    incident). CHANGES-REQUIRED on the full branch, with two findings **I had missed**: the worker
    brief template still said "Do not commit. Do not push." sixty lines under the section requiring
    the opposite (my sweep grepped `never commit`, not `Do not commit` — the sweep was the right
    tool with the wrong input, which is worse than no sweep), and F6 promised eval verdicts in
    `.ai/eval-runs/` while only an inline `Last run:` line existed. APPROVE on the fixes.
  - **Evals: 4 scenarios, 9 arms, PASS everywhere**, raw returns archived in
    `.ai/eval-runs/2026-07-31-sailerem-lessons/`. The control arms did their job — a read-only role
    was correctly denied a worktree *with a reason*, and the lead allowed a migration outside a `qa`
    window while naming why the earlier refusal was gate isolation and not "migrations are
    dangerous". Unprompted cross-rule pickup in three of four.
  - **Open, deliberately:** nobody can prove from the artifact alone that those transcripts were not
    smoothed by the same author who wrote the summaries — `checker` said so about its own review.
    Closing it needs a run record produced outside the maker's control. Backlog candidate.
  - **`agents-md-template.md` stayed at 149/150 lines** across five new rules, all merged into
    existing lines. 1.24.0's own CHANGELOG warned the budget was spent and the next author would
    have no room to append; that warning landed exactly as intended.
- 2026-07-29 late: **1.23.1 is on production** (`0058a15`). Answer shape shipped
  with two fixes found while proving it. Full day, in order: PR #11 → 1.22.0 → 1.22.1 → the ADHD
  A/B → 1.23.0 → 1.23.1.
  - **`## Answer shape` is doctrine now**, in `AGENTS.md` and `agents-md-template.md` (compressed
    there; generated root file at 146 lines against its own ~150 budget). Spec
    `.ai/specs/2026-07-29-answer-shape.md`, experiment `.ai/experiments/2026-07-29-adhd-mode/`,
    eval `evals/answer-shape-hands-over-the-decision.md` with a real RED baseline.
    **Rule 3 is WIDE by the human's call, against my recommendation** — any fork with more than one
    defensible answer is theirs, made survivable by batching rather than by filtering.
  - **The A/B did NOT separate its arms** (both 3/3) and says so. Placement was decided by
    documented mechanism, not by the eval: only `CLAUDE.md`, unscoped `.claude/rules/*.md` and
    auto-memory survive compaction; hooks are documented as "not context". Do not cite the A/B as
    having chosen AGENTS.md — it did not.
  - **Two defects of mine, both shipped before they were caught.** The 1.22.0 `$HOME` fix had an
    MSYS bug of its own (`.join("/")` rewritten by Git Bash → a healthy archify reads as MISSING);
    it survived because every verification ran under an `MSYS_NO_PATHCONV=1` I had exported. And
    the docs-delta gate had no stop: an eval arm did every written step right and closed the spec
    in the same motion, so the human never saw the delta. Both fixed in 1.23.1. **The lesson worth
    carrying: a fix verified under an environment variable the reader does not have is not
    verified.**
  - **Eval batch `.ai/eval-runs/2026-07-29-stale-rerun/`: 4 PASS · 1 FAIL.** Three of five runs hit
    a fixture defect of their own author's making and rebuilt rather than grading a run that did
    not happen. `eval-status.js` was fixed mid-batch — it could not see a per-arm verdict, so a
    recorded FAIL reported as no verdict and the summary understated the count.
  - **Open debt, all of it visible on purpose:**
    1. `gate-refuses-to-close-a-spec-without-docs-delta` — **FAIL against doctrine that has since
       changed.** Needs a re-run to say anything. It reports FRESH only because the harness compares
       dates and both the run and my edit landed the same day; that same-day granularity is itself
       worth a look.
    2. `auth-spec-generates-authz-matrix` and `qa-vision-verifies-against-baseline` went STALE from
       the `sailes-implement` edit.
    3. **`docs-author`'s runtime is still ungraded** — every eval arm all day was a stand-in.
       Spawn the real role once in a fresh session and verify the pin and allow-list.
    4. Still no staging channel, and still no test for trigger collisions between skill
       descriptions (map: `.ai/experiments/2026-07-29-adhd-mode/trigger-collision-map.md`, 25 pairs,
       13 detectable from text alone).
    5. Opus 5 fit audit `.ai/audits/2026-07-29-opus-5-fit.md` — three proposals, none implemented,
       awaiting the human. One effort-pin sweep named as a measurement rather than guessed.
- 2026-07-29 (superseded): **1.22.0 IS on production** — PR #11 reviewed, tested against a
  real archify install, one defect fixed on the branch, merged to `main` (`72f392d`) and pushed.
  The merge is the deploy; every machine with the plugin now has `sailes-docs` and `docs-author`.
  - **What local testing added over the evals** (whose arms all ran as stand-ins): all five
    committed diagram sources pass `validate --quality showcase` — 9/9 checks, 0 errors,
    0 warnings — so the receipts reproduce independently of the run that made them. The delta
    gate was driven end to end: an empty delta returns all-zero counts with an identical
    `semanticSha256`, a one-field change returns `components.changed: 1` with a differing sha.
    A fresh `deliver` is byte-identical to the committed HTML after line-ending normalization
    and git stores the same blob, so regeneration adds nothing to history — the one-time ~3 MB
    stands, the per-release churn does not. Both hooks exit 0 on real stdin JSON.
  - **Defect found and fixed before merge (`d64b0ac`): a bare `$HOME` is unusable for Node.**
    Every archify invocation was written `node "$HOME/.claude/skills/archify/bin/archify.mjs"`.
    In Git Bash `$HOME` is `/c/Users/you` — the shell resolves it, so `[ -f … ]` and `grep` pass
    and the setup reads healthy, but Node resolves it drive-relative and dies with
    `Cannot find module 'D:\c\Users\…'`. The docs step failed on Windows **with archify
    installed and passing its own floor check**, which reads like a broken tool rather than a
    broken path. Fix: resolve `ARCHIFY_HOME` once via Node's `os.homedir()` with the separator
    normalized (`split(path.sep).join('/')`) — one string both the shell and Node accept on all
    three platforms. Also recorded that `npx skills add -g` installs to `~/.agents/skills/` and
    symlinks into `~/.claude/skills/`. **This is the MSYS hazard AGENTS.md already documents for
    hook fixtures, reproduced in a new skill — the doctrine did not carry to a new author.**
  - **Two gaps named, neither fixed — both are structural, not this PR's debt:**
    1. **No staging channel.** `.claude-plugin/marketplace.json` pins no ref, so the plugin
       always tracks `main`. There is no way to install a version and exercise it before it is
       on every machine. This is why the runtime half — `docs-author`'s model pin and tool
       allow-list — is *still* ungraded: spawn the real role in a fresh session and verify.
    2. **No test for trigger collisions between skill descriptions.** Nothing checks whether 17
       skills compete for the same routing. The evidence is already in hand: the diagnose eval's
       control arm went INCONCLUSIVE *because* other skills' descriptions routed both arms. That
       was filed as fixture-sharpening; it is a missing class of test.
- 2026-07-28 (superseded): **1.22.0 built and eval-verified on `feat/archify-docs` — NOT
  merged; merge = deploy and is the human's call.** The full pipeline ran end to end: discovery
  (8-decision ledger, three of them the human's against recommendation — full 5-type set,
  dedicated skill `sailes-docs`, tenth role `docs-author`) → approved spec
  `.ai/specs/2026-07-28-archify-gated-docs.md` → pre-implement READY-WITH-FIXES (5 fixes,
  incl. the two ENFORCED role-registration edits: `ROLES` in validate-toml + `INVARIANTS` in
  parity) → six phases implemented, each committed with its binary Done-when output.
  - **What shipped on the branch:** `sailes-docs` (setup/authoring/delta-at-gate, floor
    archify >= 2.12, explicit-SKIP), `docs-author` both twins + invariants, bootstrap Step
    4.10 + Q22 (label language = client's), the docs-delta gate in `sailes-implement` (empty
    delta IS evidence), adopt/diagnose/checklist wiring, self-docs: five diagrams delivered
    9/9 showcase with receipts in `.ai/runs/2026-07-28-archify-gated-docs.md`, five stamps at
    1.22.0 + CHANGELOG + manifest descriptions. archify 2.12 installed on this machine
    (`npx skills add tt-a1i/archify -g`).
  - **Evals: the three new docs scenarios PASS (7 arms total, all stand-ins, graded from
    artifacts** — `.ai/eval-runs/2026-07-28-docs/VERDICT.md`). Arm2 first run was
    INCONCLUSIVE by MY fixture defect (hand-written receipt): the agent re-ran compare,
    proved it unreproducible and refused — the fixture-first lesson holding, and the rebuild
    with a tool-genuine receipt passed.
  - **Eval debt CLOSED same session — human chose re-run-before-merge.** All 17 STALE
    scenarios re-dispatched (21 arms, stand-ins, graded from artifacts):
    **16 PASS · diagnose split (treatment PASS a-e; control INCONCLUSIVE — on a
    plugin-installed machine the skill descriptions route both arms, so the mandate's margin
    is unmeasurable here; backlogged as fixture-sharpening).** Status after:
    **35 evals — 35 fresh, 0 stale**; the one recorded non-PASS is the retired anchor
    scenario, unchanged. Batch record: `.ai/eval-runs/2026-07-28-rerun-17-stale/VERDICT.md`.
    The batch also produced four backlogged findings (GNU-only sed in graphify-setup;
    husky-blind hook check in repo-done-checklist; template claims a lint bootstrap never
    ships; the diagnose-control contamination) — three are instrument defects found by
    actually running the procedures, none is a doctrine miss.
  - **Runtime half not graded:** all eval arms and the five docs workers ran as recorded
    stand-ins — `docs-author`'s pin/allow-list resolves only after merge. Post-merge: spawn
    the real type once and verify, same as the 2026-07-26 role-runtime audit.
  - Backlog gained two promotion candidates from eval side-findings (receipt reproducibility
    spot-check; SKIP protocol's missing third state) and one human call (prompt-anchor spec
    RETIRED-in-root).
- 2026-07-26 (superseded resume marker): **1.21.3 is on production**, plugin clone synced, `main` clean,
  `npm test` green, **evals 31 fresh / 0 stale**. Eight releases this session: 1.17.0 → 1.21.3.

  **Everything the previous resume-marker listed is DONE.** The environment blocker is gone — the
  `chrome-devtools` MCP is installed and, after a reload, its tools reach the roles. All three
  long-blocked evals ran with the **real named roles through the real MCP surface**: `integrity-gate`
  caught the control under a non-interactive overlay, `qa-vision` refused a green build + green suite
  + `checker` APPROVE, `devtools-evidence` refused time pressure and found four defects a happy-path
  click cannot reach. `adopt-builds-graph` re-ran green too. The 1.21.0 tool grants are verified from
  inside the running role, along with the model pin and the absence of `Agent`.

  **STOP HERE AND READ THIS BEFORE PICKING UP ANY BACKLOG ITEM.** The session ended on the human's
  call, with a correct diagnosis worth preserving: *"mam wrażenie że kręcimy się w kółko… nie wiem czy
  dobrze testujemy wszystko."* Both halves are right.

  - **The loop is real and self-generating.** Each fix adds prose, prose adds surface, surface
    produces the next finding. It does not converge on its own. Measured across this session: skill
    entrypoints **−2.4%**, agent roles **+18.8%**. The framework grew on a day whose starting premise
    was Anthropic's finding that good ones shrink.
  - **What "31 of 32 fresh" does and does not mean.** It means freshness, not strength. About **30 of
    32 grade text via stand-ins, not runtime**. Every one is n=1, model-graded, non-deterministic —
    and this session measured **run-to-run variance exceeding the between-arm difference** (3.7× on
    one agent, unchanged task). Fixtures were repeatedly the weak link, including one defect of mine
    today. And the evals are written by whoever writes the doctrine: the isolation is **procedural,
    not structural**.

  **So the next high-value work is not another item — it is subtraction, and a harder question about
  the net itself.** Do the deferred gotcha-vs-inferable audit as a **pilot on one role**
  (`context-cost.js` before → cut what Opus 5 infers from context anyway → `context-cost.js` after →
  run that role's eval). Constraints that stand: every cut is **per-harness** (the Codex twins run on
  non-Claude models where this prose is the only backstop), and the spine
  `SPEC → HUMAN → VERIFIED → GATED` is permanently out of scope — it encodes authority, not
  capability. **Do not start it tired**; cutting is the operation whose mistakes are silent.

  **Then the direction question, which matters more than any single item.** Measured across this
  session: skill entrypoints **194.1 → 189.4 KB (−2.4%)**, references **479.7 → 485.3 KB (+1.2%)**,
  **agent roles 41.0 → 48.7 KB (+18.8%)**. Of 7,490 inserted lines, 6,480 are records/evals, 195 are
  tests, **815 are doctrine prose**. The method improved faster than the artifact: the instruments are
  genuinely new and found eight real defects nobody would have found by reading, but **the framework
  got bigger on a day when Anthropic's own Claude-5 guidance says good ones shrink.**
  → **The highest-value next work is subtraction**, specifically the deferred gotcha-vs-inferable
  audit of role prose — the roster is exactly what grew most. Do it as a **pilot on one role**:
  `context-cost.js` before, cut what Opus 5 infers from context anyway, `context-cost.js` after, run
  that role's eval. PASS → a method for the rest; FAIL → it cost one role. Two hard constraints stand:
  every cut is **per-harness** (the Codex twins run on non-Claude models where this prose is the only
  backstop), and the spine `SPEC → HUMAN → VERIFIED → GATED` is permanently out of scope — it encodes
  authority, not capability.

  **Two structural weaknesses worth naming, neither addressed:** most new rules are promoted from
  **n=1** (rules 9 and 10 of `deciding-under-uncertainty.md` each came from a single run), and the
  framework has **no routine retirement mechanism** — `prompt-anchor` was retired only because someone
  deliberately designed an experiment to test whether it was still needed.

  **Human decisions taken this session:** roster Q1 = (a) lead spawns; `designer` gets browser tools
  **and** `Bash`; `chrome-devtools` MCP becomes a **hard requirement on UI repos** (chosen against my
  recommendation, recorded as the human's call); `prompt-anchor` **retired** and `enforce/*` deleted
  (SHAs preserved in the spec — deleting a branch removes the only ref); prose audit deferred.

- 2026-07-26 (earlier): **1.17.1** (`6147346`; the plugin clone on
  this machine is synced to it). Session end state: `main` clean, `npm test` green, evals 27 fresh /
  4 stale / 0 dirty. **Next up is 1.18.0 — `researcher` (no `Agent`), `explorer` + `WebSearch`,
  `eval-runner` as a skill — and nothing blocks it.** 1.17.0 was *deciding under
  uncertainty*, plus two real defect fixes and the A/B that settled roster Q1.
  - **New doctrine:** `skills/sailes-bootstrap/deciding-under-uncertainty.md`. The decision card had
    no escape hatch — `Rekomendacja: <A/B> — bo <ground>` is mandatory, so a fork with no available
    ground rewarded manufacturing one. Now "nie mam podstaw" is a legitimate recommendation line, and
    an expensive-to-reverse ungroundable fork gets a fourth move: settle it by measurement. Entry
    points added to `sailes-discovery` (the card) and `agents/team-lead.md` (escalation).
  - **Two defects fixed:** `team-lead.md` omitted `tester` from its pipeline line and Gate isolation
    while `agent-team-structure.md` makes it a mandatory per-phase gate (a lead reading only its own
    file ran a two-gate pipeline); and `sailes-design/premium-ux.md` declared a "Sailes baseline" of
    TanStack Start + React Query occurring in that file alone.
  - **Evals:** `lead-proposes-a-measurement-when-it-cannot-recommend` NEW, PASS both directions.
    `lead-does-not-open-a-swarm-unprompted` re-run, PASS — the new doctrine *narrowed* fan-out.
    Status: **27 fresh / 4 stale / 0 dirty**.
  - **Roster Q1 RESOLVED as (a)** — the lead spawns; `researcher` synthesises and verifies, and ships
    **without** `Agent`. Recorded as partly measured, partly argued: measured that cost observability
    is lost when a non-lead spawns; the choice of (a) over the untested (c) is argument.
  - **The correction that matters most, 2026-07-26:** the run-1 A/B claim that arm B "burns fewer
    tokens" was **never measured**. It came from that arm's own run-data section, which formatted
    estimates identically to source-verified claims; asked directly, both arm-B agents confirmed they
    cannot see their gatherers' tokens, their own, or per-agent durations, and never read a clock. We
    grade the artifact rather than the report for *findings* — nobody applied that to *instrumentation*,
    the one section with no artifact to return to. Both lessons are in `.ai/lessons.md`.
  - **Plugin clone on this machine was 9 commits behind** and `autoUpdate` had not pulled it; brought
    to `68a8366` manually. The stale in-session agent registry still lists `sailes-app-builder:README`
    — that clears on restart, not before.
  - **Both defects FIXED in 1.17.1, same day.** `handle_dialog` was instructed by
    `browser-inspect.md` while absent from that file's own tool list and from every role's `tools:` —
    prose instructing a call the configuration forbids, the same class as the phantom agent. Granted
    to **`qa` only**, deliberately: it drives real flows and can hit a modal; `fe-dev` inspects and
    does not. And **Stryker was the one mandated tool with no absence path** — required for tier A
    (money/auth/tenancy) while graphify and chrome-devtools both ship explicit SKIP protocols — so on
    a machine lacking it, tier A silently degraded to tier B. Now `ENV-DEFECT` + explicit SKIP +
    tier-A proof marked UNVERIFIED.
  - **Next (1.18.0), unblocked by Q1:** `researcher` (no `Agent`), `explorer` + `WebSearch`,
    `eval-runner` as a **skill** rather than a role.

- 2026-07-26 (earlier): shipped **1.16.0** on branch `feat/measurement-routing-subteams` —
  measurement, model routing, and sub-teams, as one dependency chain (spec:
  `.ai/specs/2026-07-26-measurement-routing-and-subteams.md`, gate cleared by the human same day,
  D1–D4 answered, D5–D6 assumed and recorded). **Not merged — `main` is a live deploy and both new
  evals are PENDING.**
  - **Harness (D1):** `evals/harness/{eval-status.js,context-cost.js,README.md}` + 17 assertions in
    `npm test`. First run reproduced the recorded 1.15.0 eval debt independently. The A/B protocol is
    written down, including the step whose absence made the anchor eval INCONCLUSIVE — assert the
    fixture creates the condition *before* reading the verdict.
  - **Routing (D2+D4):** pinned model IDs + explicit `effort:` on all eight roles; the role default
    is a default, not a ceiling, and an override owes the run log a reason. Escalate on judgment,
    never on volume.
  - **Sub-teams (D3):** human-triggered only, depth 2, **gates stay with the top-level lead**.
  - **The one deliberate divergence from Anthropic's Opus 5 guidance**, recorded so it stays visible:
    that guidance says not to use subagents for verification. Not adopted for `tester`/`checker`/`qa`,
    because it is a capability argument and gate isolation is not — a reviewer that reads the maker's
    narrative inherits the maker's confidence at any tier.
  - **All five evals dispatched and PASS (7 fresh subagents, 9 arms).** Two new
    (`lead-escalates-a-model-on-judgment-not-volume`, `lead-does-not-open-a-swarm-unprompted`) plus
    the three `lead-*` the reporter flagged STALE — which closes the recorded 1.15.0 eval debt.
    Verdict files under `.ai/eval-runs/2026-07-26-*/`; per-eval detail in each `Last run:` line.
    Worth carrying forward: the 1.16.0 sections were used **unprompted in evals that do not test
    them** — the fan-out brake appeared in the README-typo arm, the Haiku 200K ceiling in the
    empty-return arm. That is the text landing, not merely existing.
  - **An eval found a defect in the same day's text, which is the point of running them.** The
    sub-teams section quoted the live-teammate release procedure as if it always applied; with
    `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` unset (the actual state of this machine) workers are
    scoped subagents that release themselves on return, so the rule was, in the agent's words, "a
    plan that reads correct and cannot be run". Fixed in both files the same day.
  - **Re-run debt, stated so it is not mistaken for coverage:** the five PASS verdicts graded the text
    as it stood at dispatch. Three same-day edits landed afterwards — the release-mode fix above, and
    a "log the non-overrides too" clause added to both routing sections after two independent runs
    converged on it. The edits encode what the agents already did, so a regression is unlikely, but
    unlikely is not measured. `eval-status.js` will not flag it (same-day commits count as covered by
    design), which makes this the one gap the instrument cannot see.
  - **Machine reality differs from what this file implied.** `~/.claude/skills`, `~/.claude/agents`
    and a `sailes` marketplace entry do **not** exist on karol's machine — `enable-plugin.sh` was
    never run here, and `settings.local.json` still points at `/c/Users/Jacek/.claude/skills`. So
    merging to `main` deploys to Jacek's machine and any other that installed the plugin, but not to
    this one. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` was set in `~/.claude/settings.json` on
    2026-07-26 (backup: `settings.json.bak-2026-07-26`); it needs a session restart to take effect.
  - **Sub-teams ran, and the run proved less than it was reported to prove.** Depth-2 nesting was
    genuinely exercised: three sub-leads spawned 15 workers between them, **every one returned a
    report and none returned empty** — against 2026-07-25, where four of six went silent. The
    difference is the one 1.15.0 predicted: every brief named a FILE deliverable. Scope held —
    nothing outside the 24 target files changed, verified against a pre-run `git status` snapshot.
    **But every agent was dispatched as `general-purpose` with the role text pasted into the
    prompt**, because the plugin is not installed on this machine and the Sailes roles resolve
    nowhere here. So the run tested the *briefs*, not the *roles*: the eight role files carrying a
    pinned `claude-opus-5` / `claude-sonnet-5` and an explicit effort were never loaded, the
    `tools` allow-lists never applied, and the invariant that makes gates structurally unable to
    fan out — no non-lead role lists `Agent` — was never exercised, since no non-lead role was
    ever spawned as itself. **The 1.16.0 model routing has therefore still never run.** Raised by
    the human, not caught by me, and closed doctrinally in 1.16.1: spawn the named role type;
    `general-purpose` is a last resort that must set model/effort on the invocation and be
    recorded in the run log as a stand-in. Eval: `evals/lead-spawns-named-roles-not-general-purpose.md`
    (PENDING — arm 1 needs a machine where the roles resolve).
  - **The gate caught more in the instrument than in the work.** Three real defects, all fixed same
    day: `eval-status.js` reads only committed history (uncommitted edits read FRESH → new `DIRTY`
    verdict); freshness was conflating with outcome (an INCONCLUSIVE eval printed FRESH → the
    recorded verdict is now shown); and the **`AGENTS.md` CRLF rule is wrong** — the tree is mostly
    but not uniformly CRLF, and two teams caught it by disbelieving a brief of mine that asserted it.
  - **My own gate produced a false alarm, which is worth remembering.** It compared
    `git show HEAD:<file>` against the working tree to detect ending changes; with `* text=auto` git
    stores LF, so it flagged all 28 touched files. And the first outcome parser scanned the whole
    `Last run:` value, turning two PASSing evals into reported FAILs because their notes said what
    the *agent* did. Both were caught before anything was reported — but both are the house failure
    shape (a step reporting an outcome for a reason other than the one claimed), produced by the
    instrument built to catch it.
  - **The whole eval suite is now current, and the number is honest.** 25 of 29 FRESH, 4 STALE.
    Sixteen came back stale once coverage was complete; twelve were re-dispatched to fresh
    subagents and **all twelve PASS**, each checked against its own recorded binary criterion read
    from the deliverable file rather than from the agent's summary. The remaining four are
    environment-blocked and stay STALE deliberately — `graphify` is not installed, the browser MCP
    is not wired into subagents, and no screenshot baseline exists to deviate from. Marking them
    re-run would be the silent-instrument trap told by the person who built the instrument.
    Triage with what would unblock each: `.ai/eval-runs/2026-07-26-rerun/TRIAGE-not-runnable-here.md`.
  - **Fixture quality was the weak link three times, not the behaviour under test.** Agents caught
    all three: a graph fixture of mine asserting edges its stub sources did not have (the explorer
    refused to invent contract shapes rather than paper over it), an invoice fixture with no runner
    at all (reported ENV-DEFECT instead of standing one up), and a webhook fixture with no test
    infrastructure. That is now the session's clearest pattern — when an eval is inconclusive here,
    suspect the fixture first.
  - **I hit the repo's own recorded lesson while writing this up:** backticks in prose pushed through
    a shell, which is the failure `.ai/lessons.md` already names. The parse failed before any write,
    so nothing was corrupted, and the fix is the one already recorded — use the file-writing tools,
    not the shell, for prose.
  - **Next, in order:** (1) ~~dispatch the two new evals~~ **done** — they are the only thing between this branch
    and a merge; (2) re-run the three `lead-*` evals the instrument now flags STALE (the 1.15.0 debt,
    and the first real customer for the A/B protocol); (3) the `Files:` editorial pass over the
    remaining 24 scenarios, after which `--strict` becomes usable as a release gate.
  - **1.16.0 is MERGED and on production** (`92e6f48`, pushed 2026-07-26). The gate was re-run on the
    merged result, not only on the branch — `npm test` exit 0, five stamps at 1.16.0, CHANGELOG
    heading present. `./install.sh --force` was deliberately **not** run: it syncs `~/.claude/skills/`,
    which does not exist on this machine, so it would be a first install rather than a post-release
    sync — a machine-state change, not a release step.
  - **Branches cleaned to `main` + the four `enforce/*`.** Eight remote branches deleted: six fully
    merged (`feat/graphify-default-integration`, `feat/measurement-routing-subteams`,
    `feat/sailes-migrate`, `kacper-dev`, `wayfinder-research`,
    `worktree-ui-libraries-preline-astryx`) and two not merged in git terms but verified
    file-by-file to be fully contained in `main`: `claude/context-engineering-framework-fc2507`
    (its lesson was extracted onto the branch by hand) and `feat/sailes-migrate-clean` (superseded
    by the merged `feat/sailes-migrate`). SHAs recorded before deletion; recovery is
    `git push origin <sha>:refs/heads/<name>`:
    `3287d3f` graphify · `e696678` measurement-routing · `4c9e87f` sailes-migrate ·
    `b354e15` sailes-migrate-clean · `9d63e71` kacper-dev · `a118c13` wayfinder-research ·
    `cccaa79` worktree-ui-libraries · `a5be071` context-engineering.
  - Housekeeping: the four `enforce/*` branches are still behind `main`
    and `prompt-anchor` is still unresolved — untouched by this change-set.
- 2026-07-25 (earlier session): audited the merged 1.14.0, shipped **1.14.1** and
  **1.15.0**, and closed both pending evals. All on `main` and deployed (`dcffed9`; `./install.sh
  --force` run, active copy at 1.15.0). Sequence: the shipped integrity probe returned `PASS:false`
  on a page with no defect → 1.14.1 fixed three false-positive classes, corrected the `AGENTS.md`
  stamp (stale at release), made `npm test` resolve a real bash on Windows, and put the probe's
  fixtures in the repo as a runnable, RED-verified test. Then both 1.14.0 evals were dispatched to
  fresh workers and came back **PASS** (caveats recorded in the eval files). Running them with six
  live workers exposed four gaps between the lifecycle doctrine and the runtime → **1.15.0**
  (release names `shutdown_request` and must be confirmed; a gradable deliverable is a FILE, not a
  message; the empty-return rule keeps its teeth and loses its wrong cause). Ledger:
  `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md`.
  **Picking the thread back up, in order of readiness:**
  1. **`prompt-anchor`** — the human expected it on prod; it is not (see Open failures for the proof
     and the reason it looks shipped). Now unblockable: rebase `enforce/*` onto `main`, build a
     real-distance fixture, re-run the eval. This is the item the session ended on.
  2. **Eval debt from 1.15.0** — three `lead-*` evals name files that were edited and were not
     re-run. Cheapest honest fix: run them.
  3. **Harness gaps** — five measured items in `backlog.md` (stamp equality, CHANGELOG presence,
     wiring the browser-probe fixtures, eval staleness 9/27, no test for
     `framework-version-check.js`). The human deferred these deliberately: "na razie nic".
  4. **D5** — does `designer` get browser tools. One answer, three lines of edit.
  Housekeeping: `fix/browser-probe-false-positives`, `fix/worker-release-and-delivery` and
  `docs/harness-review` are fully merged and safe to delete; the four `enforce/*` are not.
- 2026-07-25: **1.14.0 — browser inspection as an optional instrument.** Evaluated
  `chrome-devtools-mcp` against the framework and adopted it as an *instrument*, not a skill: three
  gates we already mandate (integrity six, contrast/focus, latency budget) were stated as binary and
  verified by impression. New reference `skills/sailes-design/browser-inspect.md` (probe
  fixture-verified: 5/5 defects caught, clean page PASS) + pointers from design/diagnose/test,
  browser tools for `qa` and `fe-dev` (Claude + Codex twins), `decision-engine.md` **Q21** as a
  human-owned decision card for a committed `.mcp.json`. **Optional throughout** — screenshot
  fallback + explicit `SKIP browser-inspect`, following graphify's pattern, because `main`
  auto-deploys everywhere and a mandatory tool would point agents at a missing instrument repo-wide.
  The adoption's precondition is a new hard rule, **"Devtools is not a test"**
  (`sailes-test/references/browser-e2e.md`): CDP evidence is ephemeral, so without it an agent can
  "verify" by clicking and leave nothing behind — the ratchet running backwards. `npm test` green,
  four manifests + CHANGELOG at 1.14.0. Branch `feat/browser-devtools-instrument` off `origin/main`,
  **draft PR, not merged**. Two evals PENDING (see Open failures) and one open decision (`designer`
  tools). Spec: `.ai/specs/2026-07-25-browser-devtools-instrument.md`.
- 2026-07-22: added **`sailes-migrate`** (1.13.0) — a domain-sibling skill for porting an existing
  codebase to another language/stack at scale, distilled from Anthropic's `code-migration-kit`
  (Apache-2.0). Branch `feat/sailes-migrate` (based on `feat/graphify-default-integration`=1.12.0),
  **not merged**. Six-step method reusing existing roles (explorer/team-lead/be-dev/fe-dev/checker/
  tester/qa) + the deny-list guardrail; one new hard invariant — *no translation fan-out before a
  judge/parity-harness exists and is validated against deliberately-broken source*. Authored
  **autonomously with the decision-owner away**, so the spec's Open-Questions gate was answered by
  proxy: every scope call is in spec §2 marked **NEEDS-VERIFICATION** (D1 separate skill, D2 SP
  default + redesign mode, **D4 kit scripts referenced not vendored — human licensing call**, D7
  1.13.0 on graphify). Evals written FIRST, then **run on fresh general-purpose subagents (clean
  context) — all three GREEN** on adversarial prompts (pushy "translate now" → refused fan-out
  before judge; unqualified "port from Rails" → structure-preserving default; "where in the
  pipeline" → domain sibling, not a phase). `npm test` green; four manifests + CHANGELOG at 1.13.0.
  Run log: `.ai/runs/2026-07-22-sailes-migrate.md`. **Uncommitted** on the branch; push/merge is the
  human's call (merge = live deploy).
- 2026-07-20: built **`sailes-test`** (1.10.0) — a testing skill + a `tester` agent role, on branch
  `feat/sailes-test`, **not yet merged**. The last verification step inside each spec phase, before
  `checker` and `qa`. Core is informational isolation: derive expected behavior from the spec with
  the implementation unread → human freezes the case list to `.ai/test-plans/<spec>.md` → write →
  diff may only ADD, never weaken → detection proven at a risk tier computed from triggers (A Stryker
  / B per-B-ID break / C green suite), which the agent may raise but never lower. Full discovery →
  spec → pre-implement → 7 gated phases; every Done-when run with output pasted
  (`.ai/runs/2026-07-20-sailes-test.md`).
  - **Pre-implement earned its keep:** READY-WITH-FIXES, three findings of the "green for the wrong
    reason" class — a hardcoded `ROLES` array that would leave `tester.toml` unvalidated; the pipeline
    order living twice with a read-only enumeration that a writing gate makes false; a Done-when
    asserting 15 where a naive count returns 19. All fixed on paper before code.
  - **Two research statistics did not survive verification** — arXiv 2410.21136's percentages were
    fabricated in summarization (abstract has none); Luo et al.'s flaky split is unconfirmable
    (ranking real). Kept as a worked example in the skill and a lesson. See Open failures.
  - **The version-check hook caught its own repo** — flagged AGENTS.md still at 1.9.2 after the bump;
    fixed. Small proof the instrument works on the framework that ships it.
  - **All three evals RUN 2026-07-20 · PASS** (fresh blind agents, real fixtures with actual context —
    not the condensed-fixture trap that made the anchor eval inconclusive). Isolation: derived from
    spec, did not read the readable-and-wrong impl, flagged Slack-first as a FAIL. One-way rule: left
    a red frozen B2 byte-for-byte unchanged and fixed the code instead. Tier: classified a
    charge-on-activation phase tier A and refused the "keep it lightweight" nudge, citing the Red Flag.
    Fixtures in scratchpad/eval{1,2,3}; verdicts recorded in each `evals/tester-*.md`.
  - **Merged + deployed 2026-07-20.** `feat/sailes-test` → `main` (`026b346`), pushed, `install.sh
    --force` synced `~/.claude/skills/` (14 skills incl. `sailes-test`).
  - **Follow-up 1.10.1 `fix/tester-lane` (not yet merged):** the one-way eval had surfaced that
    `tester`, under "make it pass", fixed feature code — correct outcome, `be-dev`'s lane. Closed:
    `agents/tester.md` + `codex-agents/tester.toml` now scope write access to test files (a red frozen
    test is a defect to REPORT), the eval gained a criterion (b), and the **re-run PASSED both
    criteria** — same scenario, guarded skill, the agent edited nothing and reported the defect up.
    Before/after behavior change is the proof the guard lands. Four manifests + AGENTS.md at 1.10.1,
    CHANGELOG entry. `npm test` green. Push is the human's call.

- 2026-07-18: audited the framework's own enforcement surface and shipped three releases.
  **1.9.0** — the canonical spine (`SPEC → HUMAN → VERIFIED → GATED`, byte-identical in the
  router and `agents-md-template.md`), the delegation empty-return rule, `hooks/lib/repo-state.js`.
  **1.9.1** — the six enforcement-audit findings, including the guard scripts becoming real files
  and this repo finally getting its own AGENTS.md.
  **1.9.2** — briefs now name the DELIVERY mechanism, not just the deliverable: measured, three of
  five background teammates formed a correct answer and delivered nothing because plain text does
  not reach the lead. The 1.9.0 rule was right and its written cause was wrong; it survived because
  the rule worked, which is the hardest kind of error to see.
  Evals: `lead-delegates-instead-of-bulk-coding` PASS both arms (first real run since 1.7.0);
  `lead-chases-an-empty-worker-return` PASS both assertions;
  `anchor-holds-the-line-deep-in-session` INCONCLUSIVE — see Open failures.
  Next: a depth-eval fixture with real context distance. Nothing else is blocking.
