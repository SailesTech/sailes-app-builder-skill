# business-logic — template and maintenance contract

> Generated into a repo as **`.ai/business-logic.md`** (header + empty sections at bootstrap).
> Write the artifact in the **repo's own language** — the same per-repo decision as diagram labels.
> This file is the canon for its shape; `.ai/briefs/2026-08-22-business-logic-format.md` in the
> framework repo is the provenance, not a second source.

## Why this file exists

Business knowledge is elicited over and over and then buried per task: the brief is archived, the
spec moves to `implemented/`, and the owner's rulings end up in session memory and vanish. Measured
2026-08-22 across two real repos:

- A section literally titled *"Business rules established by the owner (do not ask about these again)"*
  sat at line 168 of a **197 KB** `STATE.md` that is rewritten at every compaction.
- Of its four items, **three were durable rules and one was a release decision that stopped being
  true within days** — 25% contamination in a four-item list written deliberately as business rules.
- A rule captured a month earlier ("this order type practically never occurs") sat a thousand lines
  further down, unfindable.
- The naive version had already been tried in the same project: a **760-line** `logika_biznesowa.md`
  whose title said v.2 in a v.3 project, whose body described a cron that does not exist, whose
  line 1 carried a banner contradicting its own body — and whose index still advertised the claim
  the banner retracted. **Three layers of one document saying three different things.**
- What worked, in a sibling project: a **9 KB** synthesis over 480 KB of recon — mission, index,
  date-stamped owner rulings, a systems table with a `source of truth for` column, `UNKNOWN` written
  into the text, and a section naming where the same business entity is duplicated.

The difference is not writing quality. **Business logic survives as stamped claims with a
verification handle, and dies as narrative about the system.** Narrative offers no place to check
whether it is still true, so nobody checks — a banner gets glued on and everyone moves on.

## The governing rule

**Every claim carries three things: who said it, when, and where to check it.** A claim with no
verification handle does not go in. Where the answer is not known, write `UNKNOWN` — never omit.

## The admission test

> A sentence is business logic **if and only if it stays true after the current work ships.**
> If it stops being true when the code reaches production, it is session state, not business logic.

Second, complementary test: *does it answer "why does the business want this" or "what did we do in
the code"?* The second belongs in a spec, in `system-flows.md`, or in the diagram set.

## Sections

Sections are fixed and named. Files are one implementation of them. **Start as a single file**;
split only on the threshold below.

```
.ai/business-logic.md          ← start here: sections 0-6 in one file
```

Split when the file passes ~400 lines **or** any one section passes ~120 lines:

```
.ai/business-logic/
  README.md        ← section 0 (mission + index + how to maintain) — ALWAYS stays small
  glossary.md      ← 1
  systems.md       ← 2 (+ conflicts)
  rules.md         ← 3
  flows.md         ← 4
  goals.md         ← 5
  superseded/      ← 6: withdrawn rulings, with date and reason
```

The threshold comes from two measured points, not from taste: the synthesis works at ~180 lines,
the 760-line document rotted. It sits deliberately near the low end and is **one number to change**
if it proves wrong.

### 0 — Mission and index
One sentence on why the file exists. A table of where the detail lives (recon, incidents, specs).
**The index never summarises content** — name and scope only. A summary in an index ages
independently of its source; that is exactly how the rotted document kept advertising a retracted
claim.

### 1 — Glossary
Domain terms and, critically, **name collisions**.

```
- **EXPIRED** (deal) — a lost deal, withdrawn from the portal. A future pickup date in this state is
  NATURAL, not a defect. Set by the 03:00 Make scenario for deals marked LOST in the CRM — not by
  the application's cron. · source: owner 2026-07-29 · cost of not having this: incident 2026-07-29-deal-43915
- **one-pager** != **proposal view** — the one-pager faces the carrier, the proposal view faces the
  end customer. Confusingly similar names. · source: reference/2026-08-17-supplier-side-recon.md §6
```

The glossary is cheaper than rules and catches a class of error rules do not: a whole investigation
branch once went wrong because an agent assumed its own definition of a state name.

### 2 — Systems and boundaries
A table: system · role · **`source of truth for`**. That third column is the most valuable thing in
the document. Then a **Conflicts** subsection: where the same business entity exists in several
systems, and who is authoritative *de facto* — not on paper.

### 3 — Rules
One artifact serves the agent and the human, so there is no second source to drift:

```
- **[R-COMM-03]** A null commission means 0%. A deliberate decision, not an oversight.
  · source: owner 2026-08-04 · enforced: CommissionResolverService.toPercent

- **[R-PRIO-01]** Commission priority lasts 4h counted in WORKING HOURS only (paused 18:00-09:00 and
  weekends). Independent of winner priority.
  · source: system-flows.md §5 · enforced: deal.priority_effective_expires_at
  · note: confused with R-PRIO-02 in at least two documents
```

Fields: `[ID]` · one normative sentence · `source:` who + when (quote it when it was spoken) ·
`enforced:` `file:line` **or** `NONE` **or** `N/A` · optionally `cost:` / `note:`.

**`enforced: NONE` is a full answer and a valuable one** — it says the rule lives only in an
agreement between people. That is information, not a gap.

### 4 — End-to-end flow
Numbered, with conditions and constants in the text, and `UNKNOWN` written where knowledge stops.
Describes **how it works today** — not how it is implemented. Implementation detail belongs to the
diagram set and to specs.

### 5 — Target state
Where the system is heading and what is deliberately NOT being done. Without this the file
describes only the present and never answers "what is this for".

### 6 — `superseded/`
A withdrawn ruling **moves**, with its withdrawal date and reason. It is never struck through in place.

## Six hard maintenance rules — each from a recorded failure

1. **Never correct with a banner.** The correction goes into the body, or the claim moves to
   `superseded/`. A banner contradicting its own body stood for a month while the index kept
   repeating the retracted claim.
2. **The index does not summarise.** Name and scope, never a claim.
3. **Do not version in the title.** "v.2" in the title of a v.3 project is a guaranteed falsehood in
   the header.
4. **No code excerpts.** The rotted document pulled architecture, service lists and DB schema under
   the heading "business logic" and drowned. Code has the diagram set, `system-flows.md` and specs.
5. **`UNKNOWN` is mandatory.** A section with no answer says `UNKNOWN`; it does not go silent. This
   is the only thing separating "we checked and nobody knows" from "nobody checked".
6. **A new rule never silently deletes an old one** — the old one moves to `superseded/` with a reason.

## The mechanical check

`business-logic-check.js` (framework: `tools/`; client repos: the hooks template) verifies:

- every `- **[R-...]**` line carries `source:` **and** `enforced:`
- every `file:line` path in `enforced:` exists on disk
- every rule ID is unique
- section 0 stays under the threshold

It checks whether a claim is **checkable, not whether it is true.** Truth is a human's job and this
does not pretend otherwise.
