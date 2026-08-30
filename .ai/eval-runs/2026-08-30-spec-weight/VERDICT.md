# A/B: does `spec-weight` actually make a contract-fix spec smaller?

Eval: the speed half of 1.30.0, owed by `.ai/eval-runs/2026-08-30-deployed-surface-probe/VERDICT.md`
Date: 2026-08-30 · **single run per arm** — a sample, not a measurement
Vehicle: fresh generic subagent per arm, clean context, pinned to Sonnet, told nothing about the eval.
Fixture: a deliberately contract-fix-shaped brief — a webhook field widening from `string` to
`string | string[]`, same column, no migration, one route, no UI. Both arms got it identically and
were told scope was signed off with nothing left to ask.

| | Arm A (`sailes-spec` at `main`) | Arm B (after `spec-weight`) |
|---|---|---|
| Spec size | 15,102 bytes / 247 lines | **6,719 bytes / 129 lines** |
| `##` sections | 13 | **5** |
| `Weight:` declared | no | yes — `contract-fix` |
| `Deployed-probe` present | no (as a field) | yes |
| `deployed-surface-check` | exit 0 | exit 0 |

## Result

**56% smaller, 13 sections down to 5, and nothing load-bearing dropped.** That last clause is the
one that mattered and it holds on inspection: arm B did not omit the other required sections, it
answered them — a `## Other required sections (contract-fix — n/a by design, not omitted)` block
disposing of Data Model, Security, Jobs/Workflows, Integration/Webhooks and Migration numbers in one
line each, with a reason per line ("no migration, no column added or dropped; `deals.owner_email`
keeps its type and meaning"). Arm A spent a full section on each of those to say the same nothing.

This is the result the first A/B could not produce, and it is the half the human asked for: the
framework leaning toward safety that buys nothing. Here it buys 8.4 KB less document per contract
fix, and the document that remains is the part a reader needs.

## The probe dimension is a TIE here, and that is worth recording

Both arms exit 0 on `deployed-surface-check`. Arm A wrote a genuine deployed `curl` against
`https://dev.partners.volubus.com` inside its Phase 2 with no prompting — the second time in two
A/Bs that the pre-change skill reached a deployed check on a brief that names a deployed host.

So the honest reading across both runs: **the probe rule's value is not "the model would never
think of it".** It is that the model thinks of it *sometimes*, aims it at whichever wire property
it happened to be thinking about, and nothing catches the case where it does not — which is
precisely what 2026-08-29 was. The field and the checker convert an occasional good instinct into
a thing that is either present on disk or loudly absent. Claiming a bigger effect than that would
not survive these two runs.

## Two more checker defects, both found by grading real output

Same class as the three the first A/B found, and the count is now five.

4. Arm B wrote `**Deployed-probe:** <a sentence>` and put five numbered `curl` steps underneath,
   after a blank line. The field reader stops at the blank line, so the check reported "names no
   http(s) address" about a spec carrying five of them. Fixed: when a labelled probe's value does
   not qualify, the phase is scanned for a real probe command before anything is reported.
5. Arm B's own probe is better than the rule asked for — it captures a **baseline** status code
   from the deployed host first and asserts the new shape returns the same one, rather than naming
   an expected code it would have had to guess. Not a defect; recorded because it is the behavior
   worth propagating into the rule text later, and because it came from the model, not the author.

## Verdict

**PASS on the speed criterion** — 56% reduction, sections 13→5, weight declared, nothing
load-bearing lost. **TIE on the probe criterion** — both arms probed the deployed host unprompted
on this fixture. Single run per arm, N=1 fixture, model-graded.
