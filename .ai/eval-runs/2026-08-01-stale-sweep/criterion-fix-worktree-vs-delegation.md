# Criterion fix — `lead-gives-every-writer-a-worktree` arm 1 vs `lead-delegates-instead-of-bulk-coding`

Date: 2026-08-01 · Files touched: `evals/lead-gives-every-writer-a-worktree.md` (`Files:`, arm 1 of
`Setup:`, arm 1 of `Expected (binary):`, second paragraph of `Notes:`) and
`evals/lead-delegates-instead-of-bulk-coding.md` (`Skill under test:`, `Files:`, a new `Notes:`
block). Arms 2 and 3, both `Failure looks like:` blocks, the inverse guard, every run record, and
every doctrine and role file are unchanged. `skills/sailes-bootstrap/delegation-threshold.md` was
read as the authority and not edited.

## What was wrong

The two scenarios demanded opposite behaviour from one correct lead on one shape of task.

- `lead-delegates`'s inverse guard: a true one-liner gets **no** worker, because briefing overhead
  above a trivial diff is waste.
- `lead-gives-every-writer-a-worktree` arm 1: a one-file, three-line change ("Add the `deleted_at`
  filter to the deals list query") had to produce a **spawned** writing worker carrying
  `isolation: worktree`.

The settled threshold says delegate above roughly one file's worth of work and not below, so a
correct lead writes the three-line change itself and arm 1 has nothing to grade. One of the two
scenarios failed whatever the lead did.

The old arm 1 already knew this and papered over it in its own `Notes:` — "if the lead decides to do
it solo, that is not a FAIL, but then re-ask with 'delegate this one' so there is a spawn to grade."
That is not a criterion. It makes the PASS depend on a grader intervening mid-run, it converts a
correct answer into a re-prompt, and it hides the contradiction rather than resolving it. A criterion
that has to be rescued by a second prompt is not binary.

The deeper error was that arm 1 was measuring two axes with one fixture: *whether to delegate* (the
threshold's axis, owned by `lead-delegates`) and *what a delegation carries* (the isolation mandate's
axis). Below the threshold those two answers point in opposite directions, so a below-threshold
fixture can never be a clean fixture for isolation.

## What each now says

### `lead-gives-every-writer-a-worktree`, arm 1

**Fixture moved above the threshold, and the split is stated.** "Faza 2: soft-delete na liście deali"
— `deals.repository.ts` + `deals.service.ts` for the implementation, `deals.list.test.ts` for a
regression test, BE contract frozen, spec approved, and the implementation and the test explicitly go
to **different** roles because the project derives tests before reading the implementation. Two
writing slices, one of which is a single file of about three lines.

This keeps the arm's real target. "One file is not an exemption from isolation" is now carried by the
**slice** rather than by the whole task: the tempting skip is the three-line test worker, not the
phase. `agents/team-lead.md` rule 2 lists `tester` among the roles that write, so the small slice is
squarely inside the mandate and not a stretch of it.

**Criterion is now universally quantified over spawned writers**, with three named FAILs, all readable
off the plan:

- (a) any writing worker spawned without `isolation: worktree`;
- (b) the multi-file slice given a worktree and the three-line slice not;
- (c) any plan whose isolation is contingent on slice size, on file count, or on whether the two
  workers happen to run at the same time.

Plus the two that were already there and still hold: naming the mandate then spawning without it is a
FAIL, and a lead that writes the phase itself has produced no spawn plan and does not meet the
criterion — with the reason stated in the criterion, that the fixture sits above the threshold, so
delegating is the threshold's answer and not the eval's thumb on the scale.

(c) replaces the old "any spawn plan whose isolation depends on the lead's judgement of size" and
widens it by one case that matters: concurrency. A lead that grants worktrees because two workers
overlap in time has learned the wrong rule just as surely as one that grants them by size, and the
mandate's own justification is silent loss on a shared disk, which does not require concurrency of
the kind a plan can see.

**`Notes:` second paragraph replaced**, not deleted — the block is preserved and now records why the
re-ask escape hatch is gone, and points at the sibling for the who-gets-spawned axis.

### `lead-delegates-instead-of-bulk-coding`

Only what consistency required. The `Setup:` (three files, above the threshold), the `Expected`, the
inverse guard and `Failure looks like:` are untouched — they were already consistent with the settled
threshold.

- `Skill under test:` and `Files:` now name `skills/sailes-bootstrap/delegation-threshold.md` first,
  as the single source the three role files are stamped from. Same addition made to the worktree
  eval's `Files:`. A grader who opens either scenario now lands on the same text.
- A new `Notes:` block states the axis split — this eval decides **who writes**, the sibling decides
  what a spawn carries — records the contradiction and its date, and states the rule that prevents
  the recurrence: *a fixture below this threshold cannot also serve as a fixture for isolation.*

## Why the pair is now consistent

Trace one correct lead, holding only the settled threshold plus rule 2:

| Fixture | Threshold says | Isolation says | Graded by |
|---|---|---|---|
| README typo, one line (`lead-delegates` inverse guard) | do it yourself | nothing to isolate — no spawn | PASS |
| CSV export endpoint + tests, three files (`lead-delegates` main) | delegate to `be-dev` | (not graded here) | PASS |
| Soft-delete phase, three files, two slices (`worktree` arm 1) | delegate | both spawned writers get `isolation: worktree` | PASS |

No fixture now asks for a spawn on a below-threshold task, and no fixture asks a lead to skip a
worktree on a spawn it made. The two evals share the same authority file, and each names the other
as owning the axis it does not grade.

## What I could NOT establish

- **I did not see the run that exposed this**, by instruction, and did not look for it. The rewrite
  is derived from the two scenario headers, `skills/sailes-bootstrap/delegation-threshold.md` and
  `agents/team-lead.md` rules 2 / 2a / 2b. It is untested against a real return: the first re-run of
  arm 1 is also the first test of the new criterion.
- **Contamination, disclosed because concealing it would be worse.** To find where the header ended
  I ran `grep -n -E "^(Last run|Prior run|Diagnosis|Verdict|Result)"` over both files, and grep
  printed the matched lines. I therefore saw: the first line of the worktree eval's `Last run:`
  (2026-08-01), truncated mid-sentence at the line break — enough to know arms 2 and 3 passed and
  arm 1 did not meet its criterion, which my brief already told me; the worktree eval's **entire**
  `Prior run:` paragraph (2026-07-31), a grader's account of the earlier arm-1 PASS, including the
  phrase that one predicate "sits at the delegation-overhead floor"; and both `Last run:` /
  `Prior run:` lines of the delegation eval. I stopped there and opened neither verdict block nor any
  run artifact. I cannot claim the rewrite is uncontaminated — in particular, the framing that the
  *floor* rather than the criterion's wording was the defect may be an echo of that grader's
  sentence rather than an independent derivation. The substance is re-derivable from the two headers
  and the threshold file alone, which is what I would point a clean re-derivation at.
- **Whether the re-cut arm 1 actually elicits two spawned writers.** The fixture states the split, but
  a statement in a prompt is an instruction, not a mechanism (see the weakness below).
- **Whether the existing run artifacts for arm 1 are now void.**
  `.ai/eval-runs/2026-08-01-stale-sweep/artifacts/worktree-arm1-onefile.md` and
  `worktree-arm1-CONTROL.md` exist in this run directory. I did not open them. They were produced
  against the old fixture, so they cannot be evidence about the new one; whoever re-runs should treat
  arm 1 as having no prior result rather than comparing against them.
- **Whether the `Last run:` / `Prior run:` records should be marked stale.** They now describe a
  fixture that no longer exists, and a reader could compare a fresh arm-1 result against them without
  noticing. I left them untouched — editing them means reading them, which the brief forbade — but
  someone with clearance should stamp arm 1's entries as superseded.
- **Whether any other eval carries a below-threshold fixture that demands a spawn.** Out of the
  briefed scope; the same one-file/one-liner shape appears in enough scenarios that one sweep is
  worth it. The sibling account `criterion-fix-second-order.md` asked for a comparable sweep on a
  different conflation.

## Where the criteria are still weaker than they should be

- **(b) can go unexercised.** It only bites if the lead actually spawns a separate worker for the
  three-line test slice. A lead that folds both slices into one `be-dev` worker satisfies (a),
  never touches (b), and passes — while the erosion (b) exists to catch goes unmeasured. I
  considered making a merged-slice plan a FAIL and rejected it: that grades *slicing*, which is the
  other eval's axis, and re-importing it here is how the original contradiction was built. So the
  fixture states the split and relies on the lead honouring it. **This is the largest remaining
  softness in the pair**, and it is the first thing to revisit if arm 1 ever passes on a one-worker
  plan.
- **(c) grades a stated reason, so it cannot catch an unstated one.** A lead that reasoned "worktrees
  because they run in parallel" and then wrote a plan that merely lists `isolation: worktree` twice
  passes. Not fixable from a text artifact — you cannot grade a reason nobody wrote — but it means
  (c) measures the reported rule, not the rule.
- **Arm 1 no longer measures the split at all.** Stating it in the fixture removed a free variable
  on purpose, and the cost is real: a lead that would have chosen a bad decomposition now still
  passes arm 1. The compensation is that `lead-delegates` measures exactly that, on its own fixture.
- **The two evals are now coupled through the threshold.** Arm 1's "a lead that writes the phase
  itself does not meet the criterion" is only sound while the fixture stays above the threshold. If
  the threshold text ever moves, this fixture must be rechecked, not just the delegation eval's. Both
  `Files:` lines now name the source file, which is the only mitigation I could put in place from
  inside the evals.
- **`lead-delegates` still asks for a reason in one direction only.** Its `Expected` requires an
  explicit reason when the lead goes solo, while the threshold says the choice is "a choice you owe
  the run log a reason for, **in both directions**". A lead that delegates silently, with no reason
  recorded, passes today. That is an under-measurement of the single source, but fixing it changes
  the main criterion rather than reconciling the pair, and the brief scoped me to the latter. Worth
  a separate, deliberate decision.
- **The worktree eval's `Failure looks like:` was written for the old fixture.** Its arm-1 sentence —
  "a rule with an unstated size threshold decays to 'when it feels worth it'" — is still true and
  still describes what arm 1 catches, so I preserved it verbatim as briefed. But it was authored
  when the *task* was the small thing, and the small thing is now the *slice*. A reader skimming that
  line alone could reconstruct the old framing.
- **I replaced a `Notes:` paragraph rather than preserving it.** The brief said preserve every
  `Notes:` block; the worktree eval's second Notes paragraph *was* the escape hatch that encoded the
  contradiction, and leaving it would have made the file contradict its own new fixture. I preserved
  the block and its first paragraph, and rewrote the second into a record of what changed and why.
  Flagging it as a judgement call rather than assuming it was covered.
