# Team `files-migration-B` — `Files:` line migration, 8 scenarios

Date: 2026-07-26 · Branch: `feat/measurement-routing-subteams` · Sub-lead report
Status: **complete** — all eight scenarios carry a `Files:` line, all listed paths exist and are
git-tracked, none report `NO-FILES`, and the harness emits no `! listed file does not exist`
warning for any of them.

---

## 1. Per file — what was written and how it was derived

### `evals/auth-spec-generates-authz-matrix.md`
```
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md, skills/sailes-implement/SKILL.md, skills/sailes-bootstrap/security-checklist.md
```
Direct transcription of `Skill under test:`, which names four things and all four resolve:
`sailes-spec` → the skill entrypoint; the two bare reference filenames (`spec-writing-template.md`,
`security-checklist.md`) each had exactly one hit under `skills/` and both live in
`sailes-bootstrap`; `sailes-implement` → its entrypoint. `Setup:` added nothing new.

### `evals/spec-escalates-oversized-open-questions.md`
```
Files:              skills/sailes-spec/SKILL.md, skills/sailes-wayfinder/SKILL.md
```
`Skill under test:` names `sailes-spec` alone. `skills/sailes-wayfinder/SKILL.md` was added because
`Expected (binary):` makes "names `sailes-wayfinder`" a literal grading condition and the typed
ticket vocabulary the spec must emit (decision/research/prototype, `Blocked-by`) is authored in the
wayfinder skill, not in sailes-spec. **This is the one judgment call in the batch** — see §5.

### `evals/spec-phases-carry-done-when.md`
```
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md
```
Direct transcription: `sailes-spec` → entrypoint; the prose already gives the partial path
`sailes-bootstrap/spec-writing-template.md`, which resolves under `skills/`. `Setup:`'s "or the local
skill it generates" is a generated artifact in a consumer repo — nothing in this repo, so nothing added.

### `evals/migrate-is-domain-sibling.md`
```
Files:              skills/sailes-migrate/SKILL.md, skills/README.md, AGENTS.md
```
All three named in `Skill under test:` and already repo-relative bar the skill name. No reference file
added: the graded invariant is verbatim in `SKILL.md` under `## Czym to jest (i czym NIE jest)`
("domain sibling (jak sailes-pipedrive, sailes-hosting)"), and the role-reuse half is in the frontmatter
plus the six-step reuse table. Nothing in a reference file hosts it.

### `evals/migrate-judge-gate.md`
```
Files:              skills/sailes-migrate/SKILL.md, skills/sailes-migrate/judge-setup.md
```
Prose names only `sailes-migrate`. `SKILL.md` states the gate under `## Reguła nadrzędna (invariant
migracji)`; `judge-setup.md` is where the *graded specific* lives — `## Walidacja judge'a
(obowiązkowa, przed Krokiem 3)` spells out the validate-against-deliberately-broken-source step that
the `Expected (binary)` clause turns on. `SKILL.md` itself routes Step 0's judge to that file.

### `evals/migrate-structure-preserving-default.md`
```
Files:              skills/sailes-migrate/SKILL.md, skills/sailes-migrate/methodology.md
```
Prose names only `sailes-migrate`. `SKILL.md` hosts the default under `## Structure-preserving
(domyślnie) vs redesign (tryb)`; `methodology.md` hosts the mode distinction under `## Tryb redesign —
czym się różni`, whose table carries the unit-of-work rule the `Expected` text checks. `rulebook-template.md`
and `cost-and-gates.md` were deliberately excluded — they mention the two modes only as downstream
consequences, not as the rule.

### `evals/diagnose-runs-live-case-before-audit.md`
```
Files:              skills/sailes-diagnose/SKILL.md, hooks/workflow-router.js, skills/sailes-diagnose/traps.md, evals/fixtures/diagnose-orders-export/server.js
```
First two named literally in `Skill under test:`. `traps.md` because `Failure looks like:` says the
subtler failures are "each documented in `traps.md`" — the only `traps.md` in the repo is the sibling
reference inside the same skill, and its content matches the traps listed. `server.js` because
`Fixture:` names the fixture and demands "**The app must actually run**" via `node server.js` — it
carries the planted `Number(supplier)` defect, so a change to it directly invalidates criterion (b).
Listed the concrete file rather than the directory.

### `evals/explorer-prefers-graph-over-grep.md`
```
Files:              agents/explorer.md
```
`Skill under test:` names exactly one path and it is already repo-relative. `codex-agents/explorer.toml`
was **not** added: the precedent line in `evals/lead-chases-an-empty-worker-return.md` lists the
codex parity file only because that scenario's prose names it. This one does not.

---

## 2. Paths not resolved, or deliberately excluded

**Unresolved: none.** Every path named in the prose of all eight scenarios resolved to a real,
git-tracked file. No path was invented; a byte-level check confirms all 15 distinct listed paths
exist and `git ls-files --error-unmatch` returns all 15.

**Deliberately excluded, with reason:**

| Path | Scenario | Why excluded |
|---|---|---|
| `.ai/lessons.md` | diagnose | Quoted as **Partner Portal** `.ai/lessons.md:136-146` — a *different repository*. This repo happens to have a file at that same path (modified 2026-07-25). Listing it would have produced a correct-*looking* STALE verdict for entirely the wrong reason, invisible in the harness output. This is the sharpest trap in the set. |
| `sailes-discovery`, `sailes-spec`, `sailes-implement` | diagnose | Named in `Expected (binary):` only as **negative** routing targets — skills the treatment must NOT invoke. All three exist; excluding them was a scope judgment, not a resolution failure. |
| `AGENTS.md`, `.ai/specs/`, `.ai/incidents/` | diagnose | Fixture-repo scaffolding / prior-run context, not graded artifacts. |
| `codex-agents/explorer.toml` | explorer | Speculative sibling; prose does not name it. |
| `skills/sailes-migrate/rulebook-template.md`, `cost-and-gates.md` | migrate-structure-preserving | Mention the two modes as downstream consequences, not as the graded rule. |

---

## 3. Delegation — workers, returns, emptiness

**I delegated.** Three workers, one thematic group each; I kept integration and verification.

| Worker | Scope | Returned? | Empty? |
|---|---|---|---|
| A (`general-purpose`) | the 3 spec evals | yes, full report | no |
| B (`general-purpose`) | the 3 migrate evals | yes, full report | no |
| C (`general-purpose`) | the 1 diagnose eval (longest, most traps) | yes, full report | no |

**Zero empty returns.** All three returned per-path derivations, byte checks, and their own
`eval-status.js` reading, which is what the briefs asked for.

**Why this split, and why I did one myself first.** The eight edits share one repo inventory and one
mechanical recipe, so naive fan-out would have had each worker re-derive the same context. Instead I
did a **pilot** on the simplest scenario (`explorer-prefers-graph-over-grep`) myself to establish and
*prove* a CRLF-safe insertion recipe, then handed that proven recipe to the workers embedded in each
brief. The real per-worker work was then only the part that does not parallelise badly: reading
their scenarios and resolving prose to paths. Group C got a single file because that scenario is
longer than the other seven combined and carries the cross-repo trap.

Not run, by instruction: `tester`, `checker`, `qa`. I did not grade my own team's output; the verdict
is the top-level lead's.

---

## 4. Nothing outside the eight was modified

`git diff --numstat` restricted to the eight:

```
1	0	evals/auth-spec-generates-authz-matrix.md
1	0	evals/diagnose-runs-live-case-before-audit.md
1	0	evals/explorer-prefers-graph-over-grep.md
1	0	evals/migrate-is-domain-sibling.md
1	0	evals/migrate-judge-gate.md
1	0	evals/migrate-structure-preserving-default.md
1	0	evals/spec-escalates-oversized-open-questions.md
1	0	evals/spec-phases-carry-done-when.md
```

**One insertion, zero deletions, per file.** No other line of any scenario changed. `evals/README.md`,
`evals/harness/**` and everything else were not touched by this team.

Placement and byte integrity, verified by re-reading each file after the edit:

| File | `Files:` idx | `Setup:` idx | adjacent | CRLF | bare LF | stray CR |
|---|---|---|---|---|---|---|
| auth-spec-generates-authz-matrix | 4 | 5 | yes | 18 | 0 | 0 |
| spec-escalates-oversized-open-questions | 3 | 4 | yes | 23 | 0 | 0 |
| spec-phases-carry-done-when | 3 | 4 | yes | 16 | 0 | 0 |
| migrate-is-domain-sibling | 3 | 4 | yes | 16 | 0 | 0 |
| migrate-judge-gate | 3 | 4 | yes | 16 | 0 | 0 |
| migrate-structure-preserving-default | 3 | 4 | yes | 16 | 0 | 0 |
| diagnose-runs-live-case-before-audit | 4 | 5 | yes | **0** | **83** | 0 |
| explorer-prefers-graph-over-grep | 3 | 4 | yes | 17 | 0 | 0 |

No file is mixed. See §5 on the diagnose row.

**Caveat, stated honestly:** the working tree is dirty well beyond our eight — ~40 modified files,
including ~20 other `evals/*.md` each showing the same `+1` shape. Those are the concurrent teams
running the same migration on their slices; several were already dirty at session start. I can prove
our eight are `+1/-0` each and that this team issued no write outside them; I cannot audit the rest
of the tree and did not try.

### Self-check (not our gate)

```
node evals/harness/eval-status.js
```
```
STALE  auth-spec-generates-authz-matrix — run 2026-07-05; changed since: skills/sailes-spec/SKILL.md (2026-07-13), skills/sailes-implement/SKILL.md (2026-07-20)
STALE  diagnose-runs-live-case-before-audit — run 2026-07-18; changed since: skills/sailes-diagnose/SKILL.md (2026-07-25)
STALE  migrate-is-domain-sibling — run 2026-07-22; changed since: AGENTS.md (2026-07-25)
STALE  spec-phases-carry-done-when — run 2026-07-02; changed since: skills/sailes-spec/SKILL.md (2026-07-13), skills/sailes-bootstrap/spec-writing-template.md (2026-07-05)
FRESH  explorer-prefers-graph-over-grep — run 2026-07-22
FRESH  migrate-judge-gate — run 2026-07-22
FRESH  migrate-structure-preserving-default — run 2026-07-22
FRESH  spec-escalates-oversized-open-questions — run 2026-07-13
```
Zero `NO-FILES` among the eight; zero `! listed file does not exist` warnings. Repo-wide total after
all teams: **29 evals — 19 fresh, 10 stale, 0 never run, 0 not computable.**

---

## 5. What surprised us

**1. The CRLF premise in the brief is false for one of the eight.** The brief states flatly "this repo
is CRLF on disk". `evals/diagnose-runs-live-case-before-audit.md` is **pure LF** — 0 CRLF, 82 bare LF —
and it is LF **in the HEAD blob too**, so this is pre-existing, not something we introduced. The
prescribed `\r\n` recipe would have left a single mixed line in an otherwise pure-LF file; worker C
caught it on the byte check and normalised the inserted terminator to `\n` to match the file's own
convention. Final state: 0 CRLF, 83 bare LF, 0 stray CR — one clean insertion.
**The instruction that would have caught this ("verify your edit landed by re-reading the file") is
exactly the instruction that did catch it** — but the blanket "bareLF must print 0" gate we passed
down would have produced a false stop had it been obeyed literally. The repo is *mixed*, and the
guidance should say "match each file's existing convention", not "CRLF". At least two more eval files
outside our eight (`evals/session-start-routes-from-repo-state.md`, plus `agents/README.md`,
`agents/be-dev.md`, `agents/designer.md`) trigger the same `LF will be replaced by CRLF` warning —
worth a look before anyone commits, since `* text=auto` will renormalise whole files.

**2. Adding the line immediately flipped four of eight to STALE — that is the instrument working, not
a defect in the lines.** And two of them *say so in their own prose*: `auth-spec-generates-authz-matrix`
reads "GREEN behavioral re-run pending post-merge" and `spec-phases-carry-done-when` reads "behavioral
re-run pending for the 2026-07-05 edits". The harness is now mechanically confirming a re-run debt the
files admit in English. `migrate-is-domain-sibling` went STALE on `AGENTS.md` (2026-07-25) and
`diagnose-runs-live-case-before-audit` on `skills/sailes-diagnose/SKILL.md` (2026-07-25) — both real.

**3. One FRESH is fresh only by day-rounding.** `spec-escalates-oversized-open-questions` reads FRESH
because its 2026-07-13 run date lands on the *same day* as the last `skills/sailes-spec/SKILL.md`
commit, and `runCoversCommit` treats a recorded date as covering the whole day. It is FRESH by hours,
not by margin. Not wrong — the day-rounding is deliberate and documented — but do not read that
particular FRESH as comfortable.

**4. The `.ai/lessons.md` trap is nastier than it looks.** This repo's copy was modified 2026-07-25,
which is *also* the date that already makes the diagnose eval STALE. Had it been included, the verdict
would have been STALE either way — the false positive would have been completely invisible in the
harness output and would have survived review. This is the concrete case for the brief's "an invented
path is worse than a missing one", and it generalises: **a wrong path that happens to agree with the
right verdict is undetectable.**

**5. Two migrate SKILL.md sections name their own eval by filename** (`migrate-judge-gate`,
`migrate-structure-preserving-default`), which independently confirmed that SKILL.md is where each
graded invariant is anchored — a back-reference that made the reference-file judgment cheap. If more
skills carried that back-reference, this whole editorial pass would be close to mechanical.

**6. Open judgment call for the lead — `skills/sailes-wayfinder/SKILL.md` on
`spec-escalates-oversized-open-questions`.** Strictly, `Skill under test:` names only `sailes-spec`,
and the precedent (`lead-chases-an-empty-worker-return`) mirrors that field exactly. We included
wayfinder because `Expected (binary)` grades on the agent naming it and emitting its ticket taxonomy,
so a wayfinder edit could genuinely invalidate the recorded PASS. The trade is directional:
over-inclusion costs a false STALE (loud, cheap, self-correcting); under-inclusion costs a false FRESH,
which is precisely the silent-instrument failure the harness header says `NO-FILES` exists to prevent.
We chose the loud failure. **If the lead prefers strict `Skill under test:` mirroring, drop the second
path — the line still works and nothing else changes.** Flagging rather than deciding, because it is
the only entry in the batch where two defensible answers exist.

---

*Nothing was committed, staged, pushed, or branch-switched. No `tester`/`checker`/`qa` was spawned.*
