# Worker brief — tier scales the list, and the ratchet gets a reverse gear

Spec: `.ai/specs/2026-08-30-the-suite-is-a-one-way-ratchet.md`, Phases 1 and 2.
Branch: `test-doctrine-from-deployment-lessons`. No commit, no push, no checkout — edited in place.
Files owned by this worker (only these three):
`skills/sailes-test/SKILL.md`, `skills/sailes-test/test-plan-template.md`, `agents/tester.md`.

## Baseline, measured before the first edit

```
skills/sailes-test/SKILL.md               16233 bytes   crlf=246  bare_lf=0
skills/sailes-test/test-plan-template.md   3043 bytes   crlf=67   bare_lf=0
agents/tester.md                           7069 bytes   crlf=74   bare_lf=0
                                    total 26345 bytes
```

All three are pure CRLF. No sync-block markers in any of them (`grep -n "SYNC"` → empty), and no
tool under `tools/` asserts on their content, so the byte edits are free of machine coupling.
`codex-agents/parity.test.js` DOES assert on `agents/tester.md` — six regexes (`/shared branch/i`,
`/own worktree/i`, `/before reading|code UNREAD|unread/i`, `/weaken/i`, `/report/i`,
`/\.claude\/status\/tester/i`). All six survive; the file's Codex twin `codex-agents/tester.toml`
is outside this worker's file list and needed no change, because parity is invariant-based rather
than byte-based for these roles. Verified: `node codex-agents/parity.test.js` → exit 0.

---

## Phase 1 — the tier conditions the CASE LIST, not only the proof

### `skills/sailes-test/SKILL.md`

**Inserted — the third column** (§ Step 5, now lines 100–115). The tier table went from
`| Tier | Trigger | Proof required |` to `| Tier | Trigger | Case list | Proof required |`, and the
lead-in gained one clause: *"It conditions **two** things: how long the case list is, and how hard
detection must be proven."* Column contents, one distinct instruction per row:

- **A** — *Enumerate.* The cross-products stand: every field × {valid, invalid, empty-when-required,
  boundary}, every action × every role, every boundary walked min−1…max+1, every illegal transition.
- **B** — *One case per equivalence partition, invalid partitions included* — plus every boundary the
  spec actually names, walked in full. A cross-product collapses to one case per distinct outcome,
  **never to the happy one alone.** That last clause is the authz-matrix guard: the matrix may
  compress, it may not lose its deny rows.
- **C** — *One case per partition, invalid ones included.* A boundary only where the spec states one;
  form coverage becomes one valid + one invalid + required-empty.

**Inserted — the anti-misreading paragraph** (lines 110–114), because "tier C takes fewer cases" is
one careless read away from "tier C tests less":

> **The Case list column is equivalence partitioning applied, not permission to write fewer tests.**
> `references/techniques.md` § Equivalence partitioning already says the discipline is "enumerating
> the invalid classes too", not one test per class: the *classes* never shrink, only the repetition
> inside one — six boundary values where the spec names a single edge, thirty form cases over three
> partitions. A list that drops the invalid partitions is not short, it is untested. Raising a tier
> grows the list with it; no tier is ever lowered to shorten one.

The ratchet-up rule is therefore restated inside the new text rather than left three lines above it,
where a reader arriving at the new column would not meet it.

**Inserted — the form-coverage mandate is now tier-conditioned** (line 159). It was the one volume
mandate inside this file that the tier did not reach: `SKILL.md:144-145` applied 6 × fields at tier C
and tier A alike. It now reads *"Form coverage, at the tier's width (step 5)"* with the A and C
widths named, and the resulting-state assertion kept unconditional for every tier — that assertion is
detection, not enumeration, so it was never a candidate for scaling.

**Inserted — a `Gate` column on the protocol table** (line 39): step 5's gate now reads *"the tier
sets the list *and* the proof; dead cases named"*. See the Quick Reference cut below for why the
column exists at all.

### `skills/sailes-test/test-plan-template.md`

Three lines added to the tier blockquote at the top (lines 11–13), beside the existing "raising is
allowed, lowering is not":

> **The tier sets the length of the list below, not only the proof at the end** — A enumerates the
> cross-products; B and C take one case per equivalence partition, **invalid ones included**, B also
> walking every boundary the spec names. A dropped partition is an untested feature, not a short list.

### `agents/tester.md`

Step 5 of "The order is the whole point" (lines 30–36) rewritten from three lines to seven: the tier
now sets the case list as well as the proof, each tier's list width named, and *"A dropped partition
is an untested feature, not a short list."* The report clause additionally now requires the tier, its
triggers, and any raise with its reason.

---

## Phase 2 — the reverse gear

### `skills/sailes-test/SKILL.md` — § Step 5, immediately after the survivors paragraph (lines 143–149)

> **A case that survives its own mutant — stays green while the behavior it owns is broken — has
> failed the only test that matters.** Name it on the detection-proof table as `DEAD`, with the
> mutant that survived it, and carry it to the human as a strike candidate — `tester` names, the
> human strikes, the same route the deployed-probe trade uses. Until 2026-08-30 this exit did not
> exist: `techniques.md` § Mutation testing named the symptom — 80%+ line coverage under a 50%
> mutation score is tautological assertions — while both dispositions it offered, kill it or explain
> it, *add* text, so a suite could only grow. A dead case and an equivalent mutant never collapse:
> an equivalent is one no test should kill, and naming it stays a valid outcome; a dead case kills
> nothing. **None of this touches step 4 — a RED test is never deleted to reach green**, which
> remains the violation, one keystroke from this exit.

All three constraints from the brief are literally present and checkable:

1. *`tester` names, the human strikes* — named as the same route as the deployed-probe trade.
   `agents/tester.md:24`'s prohibition on quietly removing a frozen assertion is untouched.
2. *Dead ≠ equivalent* — stated as "never collapse", with the equivalent explicitly kept as a valid
   outcome. The 2026-08-01 survivors paragraph (six real gaps, five equivalents) sits directly above
   it, unchanged, so the two findings are adjacent and distinguished rather than merged.
3. *No licence to delete a RED test* — restated in the same paragraph, and reachable three other
   ways: step 4 (line 94), the protocol table's step-4 gate (line 38), `tester.md:54`.

**Placement.** Deliberately inside § Step 5 as a clause, not a new top-level section — the detection
proof, the survivor accounting and the disposal of a dead case are one procedure.

**Wording note.** The brief's sentence was *"A case whose own mutant it cannot kill…"*; the spec's
Done-when is `grep -n "survives its own mutant" → present`. The final wording satisfies both and is
semantically precise about which thing survives: the *case* survives (stays green) the mutation it
should have died on. `grep -c "survives its own mutant" skills/sailes-test/SKILL.md` → `1`.

### `skills/sailes-test/test-plan-template.md` — the detection-proof table (lines 65–73)

Fifth column `Verdict` added, plus a second example row so the failing shape is visible in the
template rather than described:

```
| ID | Mutation applied | Test went red | Reverted, suite green | Verdict |
|---|---|---|---|---|
| B<n> | <the specific break, dictated by this behavior> | ✅ | ✅ | detects |
| B<m> | <the break this case did not notice> | ❌ | — | **DEAD** — strike candidate |
```

The trailing note now carries the definition, the naming/striking split, the dead-vs-equivalent
distinction and the never-delete-a-RED-test restatement.

### `agents/tester.md` — report clause (lines 67–74)

*"every `DEAD` case with the mutant that survived it, and the mocked assertions the pair makes
redundant — both named for the human to strike"*, keeping the existing parenthetical *"a frozen ID
is struck by the human, never quietly by you"*. The two strike candidates now travel the same route
in the same sentence, which is the point: dead cases and probe-superseded mocks are both
`tester`-names/human-strikes.

---

## Budget — what was cut to pay for it

Every cut is duplication removal. Nothing removed states a rule that is not still stated somewhere a
reader on that path reaches: either elsewhere in the same file, or in the reference file the
surviving pointer names. No mandate, no measurement date and no incident was deleted outright.

| # | File | What was cut | Where it still lives |
|---|---|---|---|
| 1 | `SKILL.md` | **CloudFront anecdote**, retold in the § External systems paragraph | one clause + `references/external-systems.md` rule 6, which carries the `route.fulfill({status: 404})`, the 44-assertions ratio and the internal/external test |
| 2 | `SKILL.md` | the same anecdote's **third telling** in the `Never` list bullet | the § External systems paragraph, three paragraphs above it in the same file |
| 3 | `SKILL.md` | its **fourth telling** in Red Flags | one line, retained as a stop-signal |
| 4 | `test-plan-template.md` | the **CloudFront blockquote** under `Requires you` | shortened to the trade + the measurement date + a pointer to rule 6 (the template had no pointer at all before) |
| 5 | `agents/tester.md` | the **1002-byte single-line bullet** retelling the whole incident | the trade, the test for "external", the measurement and a pointer to rule 6 — 40% shorter |
| 6 | `SKILL.md:53` | the **boundary-value six**, restated verbatim from `techniques.md:37` | `- **Boundary values** — the six at each partition edge (references/techniques.md).` |
| 7 | `SKILL.md` | the **anti-flake block** — a 5-bullet list + citation paragraph immediately above `Details: references/browser-e2e.md` | all five rules survive inline as one sentence; `browser-e2e.md` carries each with its reason, plus selectors |
| 8 | `SKILL.md` | the **proven-writer retelling** — six lines of the 2026-07-30 incident directly above a pointer to the section that owns it | `techniques.md` § The proven writer, in full; the mandate, the date, "three gates, each right", the registry-derivation and the canary all stay in `SKILL.md` |
| 9 | `SKILL.md` | the **Quick Reference table** (11 lines) — a second stage→gate summary of the same seven steps as § The protocol | folded into § The protocol as a fourth column, `Gate`. Every row's content survives; one table now instead of two |
| 10 | `SKILL.md` | Stryker-absence paragraph: *"standing it up yourself is the same stack decision the no-test-infrastructure rule above reserves for the human"* | step 2, ~40 lines above, states it in full |
| 11 | `SKILL.md` | Overview: *"the presence of tests raises a reviewer's confidence exactly when it should lower it"* | the `Never gate on line coverage` bullet, which says the same sentence |
| 12 | `SKILL.md` | the arXiv paragraph, rewrapped from 5 lines to 4 (no claim lost) · `Never` `it.fails` bullet, 5 lines to 4 (`techniques.md` § Recording deliberate debt carries the reasons) · `When to Use` blank line | — |
| 13 | `SKILL.md` frontmatter | the trailing summary sentence *"…freezes a case list with the human, then writes tests that actually detect faults instead of mirroring the code"* trimmed to *"…then freezes a case list with the human"* | the Overview says it, twice. Skill descriptions load in **every** session's index, not only when the skill fires, so bytes here are worth more than body bytes |
| 14 | `agents/tester.md` | step 4's *"Your Write/Edit is for test files only — touching feature code to reach green is be-dev's lane"* | the `You never` list two sections down states it as its own bullet |

### Result — NET POSITIVE, stated plainly

```
skills/sailes-test/SKILL.md                before=16233 after=16779 delta= +546
skills/sailes-test/test-plan-template.md   before= 3043 after= 3482 delta= +439
agents/tester.md                           before= 7069 after= 7151 delta=  +82
TOTAL                                      before=26345 after=27412 NET=+1067  (+4.05%)
```

**The net-zero target was not met.** Additions ≈ 2.6 KB, cuts ≈ 1.5 KB. The two new rules are
structurally expensive: a table column costs three cells and the tier table's cells are long, and a
new disposal route in this repo's house style costs its provenance sentence. I stopped cutting at the
point where the next candidates were measured incidents rather than restatements — the 2026-08-01
mutation-delta measurement, the 2026-07-30 proven-writer mandate, the step-2 freeze rationale. Those
carry detection, and the brief's hard constraint says a cut that makes a suite catch fewer faults is
a failure regardless of the byte count. +1067 bytes is what those two rules cost after all the
duplication I could find was gone.

For context on scale: this is +4.05% on the three files, against 1.30.0's +11% of total model-facing
context. `sailes-test/SKILL.md` is loaded only when the skill fires; the one always-loaded byte in
this set is the frontmatter `description`, and that one went **down** by 72 bytes (cut #13, measured).

### The one fork I did not take, left for the human

**Red Flags vs `Never` in `SKILL.md` overlap by roughly 60%**, and three pairs are near-verbatim:
"Never claim a manual step was performed" / "You reported a manual step as done"; "Never mock inside
your own app" / "You mocked something you own…"; "Never leave a mock of an EXTERNAL boundary
unpaired" / "You mocked an external boundary and nothing probes it…". Deleting those three Red Flags
entries costs ~320 bytes and loses no rule — the `Never` list sits directly above them. I did not
take it: `Never` states rules and Red Flags states symptoms for self-audit, they are two instruments,
and I had already removed one section (Quick Reference) on budget grounds. Removing a second
standard instrument on a worker's own judgment is a doctrine decision, not a compression decision.
Taking it would land the release at ≈ +750.

**Related, and worth flagging with it:** the Quick Reference removal (cut #9) is itself the larger
version of that same call. I took it because it was a literal second summary of the same seven steps
and the fold into § The protocol preserved every row's content — but if the reviewer wants the
section back as a distinct instrument, restoring it costs ~380 bytes and the `Gate` column would
then come back out of the protocol table.

---

## Verification — pasted

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync
SYNC EXIT=0

$ npm test
NPM TEST EXIT=0

$ node codex-agents/parity.test.js
PARITY EXIT=0

$ grep -c "survives its own mutant" skills/sailes-test/SKILL.md
1

$ python -c "d=open(f,'rb').read(); print(len(d), d.count(b'\r\n'), d.count(b'\n')-d.count(b'\r\n'))"
skills/sailes-test/SKILL.md                after=16779  crlf=234  bare_lf=0
skills/sailes-test/test-plan-template.md   after= 3482  crlf= 72  bare_lf=0
agents/tester.md                           after= 7151  crlf= 78  bare_lf=0
```

`bare_lf=0` on all three: no mixed line endings were introduced. Checked at byte level, not with
grep, per the house rule. Every edited region was re-read from disk after the edit; two over-long
lines produced by re-wrapping (`SKILL.md` 112 and 149) were caught by a >110-column scan and fixed.

## What this worker did NOT establish

- **That the shorter tier-B/C lists still detect as well.** That is Phase 6's A/B against the
  `scratchpad/faultab/` mutant harness, and it is not this worker's phase. Everything here is
  doctrine text; nothing was measured against a suite.
- **Phases 3, 4 and 5** — `checker`'s surplus mirror, the unqualified "NEVER delete tests" in
  `agents-md-template.md` / `sailes-bootstrap/SKILL.md`, and the ceremony deletions. Those files
  belong to other workers. Note for the integrator: **Phase 4 is now load-bearing for Phase 2** —
  this change adds a second legitimate deletion route, so the unqualified prohibition shipping into
  every client repo now contradicts two rules rather than one.
- **The volume mandates outside these three files** — the authz matrix
  (`security-checklist.md:41`, `sailes-implement/SKILL.md:41`) and "every affected API path gets a
  test" (`sailes-spec/SKILL.md:43,136,167,194`) are still unconditioned by tier. The new Case list
  column names both cross-products, so a `tester` reading `sailes-test` will scale them; a reader
  arriving from `sailes-spec` or `security-checklist.md` will not see the tier at all. Whether those
  files get the mirroring clause is a scope call for the lead.
