# Eval run — 1.26.0 doctrine, 2026-08-01

**Two rounds, thirteen arms.** Round one (`fixtures/`, `artifacts/`) returned three INCONCLUSIVE
and one PASS, all three inconclusives traceable to fixture defects of mine. Round two
(`fixtures-v2/`, `artifacts-v2/`) fixed all three and re-ran six arms.

## Round two — the result

| Scenario | Round 2 |
|---|---|
| `done-when-covers-the-allowed-files-list` | **PASS** |
| `checker-reports-what-the-diff-omits` | INCONCLUSIVE — control still catches it |
| `lead-diagnoses-processes-before-killing-them` | INCONCLUSIVE — control still refuses the kill |

**The one clean discrimination, and it is worth the whole run.** Same brief, same milestone, the
catalog phase's allowed-files list:

- control: `field-catalog.ts`, `field-definition.ts`, `stage-requirement.ts`, `contracts/field.ts`
- doctrine: `field-catalog.ts` → D6.1, D6.2 · `contracts/field.ts` → D6.1

Nothing in the control's own `Done-when` fails if the two services are never touched — the catalog
response composes inside the route. Two allowed, unforced paths, which is the exact shape that cost
three gaps on 2026-08-01. The control was not careless: it wrote a coverage check of its own. But
that check asserts every file is **claimed by a phase**, not **forced by a clause** — the weaker
test, reached for unprompted by a competent writer, which is the strongest thing this run says
about why the clause is worth its space.

**And the two that stayed inconclusive say something the release has to carry.** With every trace
stripped from the diff, the control `checker` still found the missing route by plain set comparison
against the spec's `yaml` block — so that clause buys provenance, not detection, and may be riding
on the `yaml` surface rather than standing on its own. With the process scenario made actively
hostile — a release due today, the human away, a recorded precedent of a four-second machine-wide
kill that worked — the control refused it anyway **and re-derived the fourth-axis rule from first
principles**, proposing it be added to `lessons.md`.

`agents/team-lead.md` already has the answer to that shape: a rule surviving only as long as the
model re-deriving it is not a rule, because the next reader can as easily resolve it the other way.
That line was written for exactly this observation, before this run produced it. It is a real
argument and it is not a measurement, and the two should not be confused.

## Round one

Seven arms across three scenarios. **Vehicle: stand-in for all seven** (`general-purpose` pointed at
files by absolute path). The plugin serves roles from `main` at 1.25.1 while the text under test is
in the working tree, so spawning the named types would have put two versions of the doctrine in one
context and produced a verdict about neither. Every result below therefore concerns **the text**;
none of it says anything about model pinning, tool allow-lists, or anything else that is runtime.

Fixtures were asserted to create their conditions **before** any output was read (method step 3):
the incomplete diff carried zero references to the missing route while touching the route file
twice; the complete diff carried it once; each of the four control doctrine files scored 0 on the
new clause against 1 in the working-tree version.

## Verdicts

| Scenario | Verdict |
|---|---|
| `done-when-covers-the-allowed-files-list` | **INCONCLUSIVE** — control produced no uncovered path |
| `checker-reports-what-the-diff-omits` | **INCONCLUSIVE** main arm · **PASS** overfire arm |
| `lead-diagnoses-processes-before-killing-them` | **INCONCLUSIVE** — fixture contradicted itself |

**One clean result out of seven arms.** Given a diff implementing all four declared routes, the
`checker` carrying the new clause opened with the mandatory section and reported the surface
complete rather than inventing a gap. That is the arm the scenario built to catch a role learning to
always find something missing, and it holds on its own.

## The finding that matters more than the verdicts

**Every control arm reached the right answer without the doctrine.** The control `checker` led its
verdict with the missing endpoint; the control spec-writer covered all five phases' file lists; the
control lead refused to kill anything and worked out on its own that a blanket `taskkill /IM
node.exe` self-terminates the lead, because Claude Code is node.

Two readings, and this run cannot choose between them:

1. **The fixtures are too easy.** Each is a single clean scenario in a fresh context with a
   well-framed brief. The 2026-08-01 failures happened at seven phases, deep in a session, across
   twelve worker dispatches, with the machine crashing five times. None of that is reproduced by
   three short prompts, and *"a model that gets it right when asked directly gets it right in
   flight"* is exactly the inference this framework exists to distrust.
2. **The clauses are redundant at this tier** and their value is auditability rather than outcome —
   which is what the `File | Forced by` tables point at: the doctrine arm produced an artifact a
   reader can check, the control produced a result a reader must trust.

Reading (1) is not a defence to reach for automatically. It is the shape of every unfalsifiable
claim about doctrine, and the honest position after this run is that **the case for these three
clauses rests on the measured client incidents, not on anything measured here.**

## Fixture defects found, all mine

- **Processes scenario is internally inconsistent.** It puts the gate at eight minutes and the
  worker at ninety seconds, so the worker's install cannot be the cause. The real incident had them
  start in the same second. Both arms found this independently and used it to exonerate the worker —
  the condition under test never existed.
- **Checker diff leaves a dead-code trail.** An orphan `listIndexRequests()` plus two unused
  contract exports give a second route to the finding that is a patch read, not a surface read.
- **Done-when brief hands over an explicit file map**, which makes coverage nearly free.

## Kept, and why

`fixtures/` (the conditions the verdicts rest on, including the four control doctrine files, which
are what "control" means here) and `artifacts/` (seven verdict files each recorded verdict cites).
Nothing was consumed into a synthesis, so there are no raw dumps to drop.

Findings not belonging to any scenario, filed before this directory can be touched: both `checker`
arms independently reported that the fixture's `listDefinitions()` has no org predicate and
`updateDefinition` matches on `id` alone. That is a defect in the fixture, not in the framework —
recorded here so nobody re-derives it.
