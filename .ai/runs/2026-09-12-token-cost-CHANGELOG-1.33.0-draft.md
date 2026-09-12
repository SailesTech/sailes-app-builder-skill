## 1.33.0 — 2026-09-12 · the cost of running, in tokens

The owner's words: *"największym problemem obecnego harnessu jest koszmarna nieefektywność i
przepalanie tokenów"*. Two days of work on one client repo consumed **≈ 2.0 bn context tokens**
(lead 706 M, subagents 1 297 M). The client's own report blamed the prose written into `.ai/`. The
transcripts said the prose was a symptom, and that three mechanisms cost the tokens.

**1. Session memory was cut off and expensive at the same time.** The SessionStart hook ran `cat`
on the whole `STATE.md` (243 KB there). The harness does not inject output that large: it saves it
to a file and shows a preview (measured: "Output too large (210KB)" in 30 transcripts). The lead
then paid ~60 k tokens to `Read` it anyway. The hook now emits only the current part:
- the `Last-commit` line plus `## Open failures`, `## General rules` and `## Last session` when those
  exact headings exist;
- otherwise the head of the file, which is the newest block in date-stacked files.

The whole hook stdout stays under 9 500 bytes, warnings included, and warns when `STATE.md` exceeds
20 KB or `lessons.md` exceeds 40 KB. History rotates verbatim to `.ai/archive/` and is grepped by
area keyword, never read whole. The rule "read STATE.md + lessons.md before any task" is replaced
everywhere it was stated (14 files).

**2. The lead's context grew to 627–933 k per session and never reset.** After a phase gate closes,
the lead now writes `STATE.md` and ends its turn asking the human for `/clear` (new generated block
`session-handoff`). The model cannot run `/clear` itself. `Last session` carries the next brief, or a precise pointer to where it is written. A fuse backs this up:
`"autoCompactWindow": 400000` in the settings template. It was verified live that a project
`settings.json` honours the key: `/context` showed `1m` without it and `150k` with 150 000. Accepted
cost: the fuse also applies to interactive work in the repo.

**3. 10% of workers consumed half the subagent budget.** Briefs bundled "phases 1, 2, 3 and 4" into
one task, which took 431 turns and 135 M tokens, and workers re-ran full suites and e2e in their
inner loop. Now:
- **a task is one phase with one `Done-when`**;
- the inner loop runs the tests of the affected files, with the full suite and e2e once before the
  declaration commit;
- `maxTurns` is a fuse on seven roles: `be-dev` 140, `fe-dev` 220, `explorer` 80, `checker` 100,
  `qa` 210, `tester` 220, `designer` 100. Each is ≈ p90 of the measured turns. A partial result is
  not finished.

**And the measurement was polluted.** 135 of 177 spawns went to stale local copies of the roles in
`.claude/agents/`. Upgrade mode now salvages their repo-specific knowledge and deletes them. The
settings template denies `Agent(<role>)` for the ten bare names. It was verified live that this
blocks the local copy and leaves `sailes-app-builder:<role>` allowed, so never add the prefixed form.

**Instrument.** `tools/token-report.js` computes all of the above from transcripts. It collects
`tool_use` from every line, because deduplicating by `message.id` first undercounted spawns 10 vs 177.
Run at the same moment on the same corpus, it matches the original measurement script: 714M vs
714.0M and 1372M vs 1372.4M. The spec's first criterion ("reproduces 706 M / 1 297 M") could not
be met, because the transcript directory kept growing; the human changed it to "matches the
original instrument on the same corpus". The baseline is saved as aggregates in
`.ai/eval-runs/2026-09-12-token-baseline/`. Two suites cover the tool: the implementer's, and a
frozen one of 37 cases written with the code unread (11/11 mutants killed). That frozen suite
found three real defects: a message without `usage` was not counted as a turn, and text output
rounded totals in a way that did not match `--json`.

**What an older-stamped repo is missing** (Upgrade mode, each shown to the human as a diff):
- `.claude/hooks/session-start.sh`: replace **only** the STATE.md emission block with the template's,
  keeping local edits;
- `.ai/STATE.md` / `.ai/lessons.md` above 20 / 40 KB: split verbatim into live + `.ai/archive/`;
- `.claude/agents/<role>.md` named like a plugin role: salvage repo knowledge into `AGENTS.md`, then
  delete; other names are listed and asked about;
- `.claude/settings.json`: the ten `Agent(<role>)` denies and `"autoCompactWindow": 400000`;
- `AGENTS.md` Session Memory and Lessons sections: the new read/rotate rule.

**Evals** (`.ai/eval-runs/2026-09-12-token-cost-evals/`; stand-ins, which grade the text, not the
runtime; the long context was described in the prompt, not created):
- `lead-splits-brief-per-phase` **PASS**: one brief with one `Done-when`, and the later phases
  dispatched in sequence.
- `lead-hands-off-after-phase` first returned **FAIL** on fixture A. The lead pointed at the brief in
  the run log instead of copying it into `STATE.md`, and the doctrine's wording allowed that reading.
  The human decided a precise pointer is enough, since STATE.md sits inside the hook's 9 500-character
  budget. The block now says so, and fixture A was re-run: **PASS** (a fresh arm put the goal, files and `Done-when` in `STATE.md` with a pointer, ended with the `/clear` line and dispatched nothing), so the scenario passes. Fixture B, where the
  `/clear` request rides along with the gate's open question, passed.

**Known debt.** The diagram sources in `docs/architecture/` (`architecture.json`, `dataflow.json`)
carry this release's changes, but the rendered pages do not. archify 2.17's desktop-readability check
rejects four of the five diagrams, the pre-1.33.0 versions included. The re-layout is in the backlog.

**Not yet measured.** The saving itself. The comparison against the baseline runs on the first two
days of client work after the upgrade.

