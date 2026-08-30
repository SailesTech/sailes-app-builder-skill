# Worker report — three operational rules (ordering, report-on-disk, cwd before worktree)

Branch: `test-doctrine-from-deployment-lessons`. Spec: `.ai/specs/2026-08-30-test-surface-not-test-count.md`
Phase 3 (diagnose ordering) + Phase 4b/4c. Evidence: `wnioski z wdrożeń/2026-08-30-wnioski-o-testach-i-procesie.md` §3.

Written incrementally from the first edit, per the rule this run lands.

## Status: DONE — all three rules landed, both verification commands exit 0

Files permitted and touched: `skills/sailes-diagnose/SKILL.md`, `agents/team-lead.md`,
`skills/sailes-bootstrap/agent-team-structure.md`, `AGENTS.md`. Nothing else edited.

All four files verified LF-only on disk before editing (`grep -q $'\r'` → no CR in any of them) and
again after, so every insertion is LF and none of them mixed endings. Sync-block markers checked
first: `gate-scaling` and `delegation-threshold` occupy `agents/team-lead.md` 17–36 / 41–55 and
`agent-team-structure.md` 13–32 / 40–54. Every landing point below is outside those ranges; no
generated text was touched. No `spec-weight` markers had appeared in either file at edit time.

## Edits, per file

### `skills/sailes-diagnose/SKILL.md` — Rule 1, inside hard rule 2

Inserted at **lines 102–115**, immediately after the "Code-reading answers *what should happen*"
paragraph and still inside `### 2. Run the live case before you audit code`. Not a new rule 5 —
adding a sixth hard rule is the bloat the run exists to avoid.

Opens with the failure ("the prose above did not hold on its own", 2026-08-30, three code-reading
subagents before one `curl`, six commands settled it in about a minute, ~⅓ of the session lost
entirely on the lead's side), then the precondition as a blockquote:

> **No code-reading subagent may be dispatched while the evidence ledger holds zero observations
> from the live system.**

then the bar (one command, one response, usually also the answer) and the cost argument (a fan-out
before the first probe is three agents guessing in parallel about a question one command answers;
the probe first would have narrowed two of the three briefs out of existence).

Satisfies the spec's Phase 3 Done-when `grep -n "dispatch" skills/sailes-diagnose/SKILL.md`.

### `agents/team-lead.md` — Rule 1 dispatch side, Rule 3, Rule 2 ×2

Four insertions, all in the lead's own long-line prose style (this file does not wrap):

- **Line 71** — Rule 1, dispatch side. New first sub-bullet under "2. Decompose into one-task
  units", placed *before* the `isolation: worktree` mandate because it governs whether a fan-out
  happens at all. Same measurement, framed as the lead's duty: "no code-reading subagent goes out
  while the evidence ledger holds zero observations from the live system."
- **Line 77** — Rule 3. New sub-bullet placed directly after "Verify the worktree's base is current
  before the worker starts", as its sibling: that check asks whether the worktree is *current*,
  this one whether it is the *right repository*. Carries the 2026-08-30 frontend-brief/backend-repo
  measurement, `git rev-parse --show-toplevel`, and the second measurement quoted from
  `evals/gate-refuses-to-close-a-spec-without-docs-delta.md`.
- **Line 83** — Rule 2, on the existing report clause. Adds "Say when, too: the report is a file
  that exists from the worker's first change and grows, never a document composed at the end", with
  the two-burned-assignments measurement.
- **Line 160** — Rule 2, on the empty-return prevention ("for work a gate will grade, name a FILE").
  Adds "Name the moment as well as the path" + "a file promised at the end is still a report held in
  memory", with the same measurement. This is the hole the brief identified: the existing line names
  the artifact and never the timing.

### `skills/sailes-bootstrap/agent-team-structure.md` — Rule 2 ×2, Rule 3

- **Lines ~588–593**, inside the fenced brief template. `Report:` now opens with `` `<path>` `` and
  carries "**Create that file with your FIRST change and append to it as you go**; a report composed
  at the end dies with the process holding it." The block grew by two lines; the column layout of
  the template is preserved.
- **Line 641**, the prose after "For work a gate will grade, name a FILE — not a message". New
  paragraph: "And name WHEN the file is written, because the path alone left the hole open",
  with the 2026-08-30 measurement, closing explicitly with the `Checkpoint:`/`Report:` relation —
  `Checkpoint:` covers the worker's **progress** in the same words, this covers the **deliverable**,
  and nothing said the two obey one rule.
- **Lines 416–429**, Rule 3, appended to the "a worktree isolates FILES, not the RUNTIME
  ENVIRONMENT" family exactly as the brief directed: "**And it is cut relative to `cwd`, which makes
  the dispatch the LEAD's to get right.**" Deliberately placed here and *not* at the
  "Check the base of your worktree" block (~231–245), because that block addresses the WORKER and
  this rule addresses the LEAD — the paragraph says so in its second sentence (the worker cannot
  make this check; by the time it reads its brief the repository is already chosen). Carries the
  same two measurements as team-lead.md, including the eval quote.

### `AGENTS.md` — Rule 2, one clause

- **Line 160** — "Two rules earn their place from failures" → "Three rules".
- **Lines 166–169** — new third bullet in §Delegation: "The report is a file written from the
  worker's first change, appended to as it goes — never composed at the end. A file promised at the
  end is a report held in memory." + the 2026-08-30 measurement. Wrapped at ~100 cols to match the
  file.

## Verification

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync
EXIT=0

$ npm test
… (16 suites; tail)
  ok   settings-template.json PreToolUse matcher includes Bash — the config, not just the script
  ok   the Bash-membership check would have caught the pre-1.25.2 matcher — must-not-fire fixture

hooks-template: all tests passed
EXIT=0
```

No suite failed, so there is nothing to report about the concurrent worker's files.

Line endings re-checked after all edits — all four files still LF-only, no mixed lines introduced.
Each insertion re-read from disk by grep after landing; line numbers above are post-edit.

## Decided NOT to do, and why

- **No new top-level section anywhere.** Rule 1 went inside `sailes-diagnose` hard rule 2, not as a
  hard rule 5; the other two went into existing bullets and existing paragraph families. Net
  structural growth is zero sections.
- **Rule 3 not mirrored into `AGENTS.md`.** The brief scopes it to team-lead.md +
  agent-team-structure.md, and AGENTS.md §Delegation is a three-bullet summary for the framework
  repo, which is single-repo — the cwd failure has no purchase here. Adding it would be ceremony.
- **Rule 3 not added to the worker-facing "VERIFY YOUR WORKTREE'S BASE" blockquote**
  (agent-team-structure.md ~240). The worker cannot verify a choice made before it was spawned;
  putting the check there would look like enforcement and enforce nothing.
- **`evals/diagnose-runs-live-case-before-audit.md` criterion (f)** — Phase 3 of the spec calls for
  it and the file is not on my list. Not touched. Someone still owes it.
- **No CHANGELOG / VERSION stamp work.** That is the spec's Phase 5 and not this assignment.

## Flag — `skills/sailes-bootstrap/hooks-template/brief-closure.js` needs a revisit

Not on my file list; not edited. Lines ~36–38 justify excluding `Report:` from the Done-when pool
with this premise:

> `Report` describes what the worker writes AFTER the fact and would make the check unfireable

Rule 2 makes the first half of that sentence false: the report is now a file that exists from the
worker's first change, not something written after the fact. The **exclusion may still be correct** —
the second half ("a report that lists every touched file would 'cover' anything") stands on its own
and is the load-bearing reason — but the stated justification now contradicts the brief template the
same repo ships, and a comment that argues from a retired premise is how the next reader reopens a
settled decision. Whoever owns that file should either re-ground the comment on the
unfireability argument alone, or re-examine the exclusion now that the timing changed.
