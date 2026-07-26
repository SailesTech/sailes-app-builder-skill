# Eval harness — did this change actually help?

`evals/` answers *does the behavior hold?* This directory answers the question a pass/fail scenario
cannot: **did a framework change make things better, and what did it cost?**

The split is deliberate and matches AGENTS.md §Verification. Deterministic behavior (reading disk,
comparing dates, counting bytes) gets a **real test**. Model behavior (does the agent honor the
mandate?) gets an **eval**. Neither substitutes for the other, and `npm test` being green says
nothing about the second.

## The two instruments

| Command | Answers | Deterministic? |
|---|---|---|
| `node evals/harness/eval-status.js` | Is each eval's recorded PASS still true, or did the file it grades change afterwards? | yes — tested in `eval-status.test.js` |
| `node evals/harness/context-cost.js` | How much context does each skill/role load, so a simplification can be shown to have cut something? | yes |

`eval-status.js --strict` exits non-zero when anything is STALE or NEVER-RUN — for use as a release
gate once the `Files:` migration is complete (see Known gap below).

### Verdicts

- **FRESH** — every file under test last changed at or before the recorded run.
- **STALE** — a file changed afterwards; the recorded PASS no longer covers what is on disk.
- **DIRTY** — a file under test has uncommitted changes, so no committed date describes it.
- **NEVER-RUN** — has `Files:` but no parseable date on `Last run:`.
- **NO-FILES** — no machine-readable `Files:` line, so coverage **cannot be computed**.

`NO-FILES` and `DIRTY` are not folded into `FRESH` on purpose. An eval whose coverage cannot be
computed must never read as covered — that is the silent-instrument trap recorded repeatedly in
`.ai/lessons.md`. `DIRTY` was added on 2026-07-26 after a sub-team pointed out that the comparison
runs against `git log`, which sees only **committed** history: in a dirty tree an edited-but-uncommitted
file read `FRESH`, which is right about the last commit and wrong about what is on disk.

### Freshness is not an outcome

The report also prints the recorded verdict (`PASS` / `FAIL` / `INCONCLUSIVE` / `PENDING`) whenever it
is not a PASS. Same run, same finding: `anchor-holds-the-line-deep-in-session` records **INCONCLUSIVE**
and still printed `FRESH`, because nobody had touched its subject since. Freshness says the file has
not moved; it says nothing about whether the eval ever concluded.

The verdict is read **positionally** — the token right after the date — not by scanning the value.
The first version scanned, and turned two passing evals into reported failures because their run notes
described what the *agent* did ("Arm B: FAIL + the literal SKIP"). Prose nuance stays prose: an eval
whose note says a behavioral re-run is still pending reads as the `PASS` it recorded, and no regex
should pretend otherwise.

## The `Files:` line

`eval-status.js` needs a machine-readable list of what the scenario grades. Add it under
`Skill under test:` — prose stays for humans, the list is for the instrument:

```markdown
Skill under test:   `agents/team-lead.md` (Agent lifecycle) / `codex-agents/team-lead.toml` (parity)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md, codex-agents/team-lead.toml
```

Repo-relative paths, comma or whitespace separated, backticks tolerated.

## The A/B protocol — the part a script cannot do

Staleness is bookkeeping. *Effectiveness* is a comparison, and the dispatch half is inherently
manual: a scenario is graded by a fresh subagent, which no `node` script can spawn.

Run an A/B when a change edits a definition that an eval already covers:

1. **Both arms, same scenario, same fixture.** Arm A = the definition at the ref before the change;
   arm B = after. Anything else varying makes the comparison worthless.
2. **A fresh subagent per arm, clean context**, knowing nothing about the eval — the same
   gate-isolation logic as `checker`.
3. **The deliverable is a FILE, not a message.** Each arm writes
   `.ai/eval-runs/<date>-<eval-name>/<arm>.md`, and the brief says "no file = task not done".
   Measured 2026-07-25: four message-deliverable briefs produced six empty returns; the one
   file-deliverable brief produced a gradable artifact first try. With A/B doubling the fan-out this
   stops being a preference.
4. **Assert the fixture creates the condition — before reading the verdict.** This is the step that
   was missing when `anchor-holds-the-line-deep-in-session` passed both arms *identically* and was
   still INCONCLUSIVE: the fixture condensed 58 turns into ten lines, so the condition under test
   never existed. If both arms agree, suspect the fixture before believing the result.
5. **One run is a sample, not a measurement.** These are model-graded and non-deterministic. Either
   run several arms per side, or record the verdict as single-run and say so in `Last run:`.
6. **Record both numbers.** Behavior (the verdicts) *and* cost (`context-cost.js` on both refs). The
   Claude-5 context-engineering claim is two-sided — evals green **and** context down. One number
   alone cannot reproduce that shape.

Then update the scenario's `Last run:` line: date · PASS/FAIL · one-line note.

## Coverage — complete as of 2026-07-26

**All 29 scenarios carry a `Files:` line**; `NO-FILES` is 0 and every one of the 80 listed paths was
verified to exist. The migration was done as the framework's first real sub-team run: three sub-leads,
fifteen workers, one file per worker, gates held by the top-level lead.

Two things that pass came out of it and are worth keeping in mind when reading the numbers:

- **A `Files:` line is a judgment, not a transcription.** Several scenarios name a skill in prose with
  no resolvable path; one grades a hook (`hooks/prompt-anchor.js`) that exists only on unmerged
  `enforce/*` branches and therefore **cannot be watched from here at all** — that eval carries a
  partial line covering its secondary subject, and the gap is stated rather than papered over with an
  invented path. One team deliberately listed a *second* skill an eval grades but does not name in
  `Skill under test:`, choosing the loud failure (a false STALE) over the silent one (a false FRESH).
  That is the right instinct for this instrument.
- **`--strict` is now usable** as a release gate, but it will fail on a dirty tree by design — see
  `DIRTY` above. Run it on a clean checkout.

## Not built here

CI automation (`.ai/backlog.md`, parked) and token-accurate counting. `context-cost.js` reports
**bytes and words, not tokens** — real token counts need the API, and this repo has no dependencies
and keeps none. The proxy is honest for comparing two refs of the same file, which is the only use
it is put to. Do not quote its numbers as token counts.
