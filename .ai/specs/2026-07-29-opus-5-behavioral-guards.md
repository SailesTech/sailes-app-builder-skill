# Spec: three guards for behaviors the model has and the doctrine does not name

Status: **approved 2026-07-29** — no Open Questions gate; every fork was put to the human as a
choice and answered before this file existed (see Decisions).
Date: 2026-07-29 · Branch: `feat/opus-5-guards`
Audit: `.ai/audits/2026-07-29-opus-5-fit.md` (the analysis; this spec is only the build)
Supersedes nothing. Extends `AGENTS.md` §Answer shape, shipped in 1.23.0.

## TLDR & Context

Add three short guards to `AGENTS.md` and `agents-md-template.md` for behaviors Anthropic
documents in Claude Opus 5 that this framework's doctrine does not currently address: **long
written deliverables**, **task-scope expansion**, and **verbose self-correction narration**.

**Why this has a spec at all, given it is three paragraphs.** `AGENTS.md`'s Task Router says a
change to a skill, hook, or agent definition gets a spec first, because the blast radius is every
repo on the machine — and a doctrine section is exactly that. The Open Questions gate is skipped
deliberately and not silently: its purpose is to stop implementation until the human settles the
forks, and all three forks were presented as a choice and answered on 2026-07-29 before any code
was written. Writing the questions down afterwards so they could be answered a second time would be
gate theatre, which is the failure mode this repo names elsewhere as evidence theatre.

## Problem Statement

1. **`## Answer shape` governs answers, not files.** Its three rules are about what reaches the
   human in conversation. Anthropic documents a *separate* Opus 5 tendency toward long written
   deliverables, with its own recommended instruction. This repo's output is almost entirely
   files — specs, evals, verdicts, `STATE.md`, `CHANGELOG.md`, run logs — so the rule as shipped
   reaches almost none of it. The session that shipped it is the evidence: the conversational rule
   held, and the files it produced ran long.
2. **Scope discipline exists only as a gate.** `checker` grades for scope creep, and four skills
   name it in review checklists. Nothing tells a *maker* not to do it in the first place. Under a
   model documented to expand scope more readily, that puts load on a gate sized for a model that
   did it less. A gate is the right backstop and the wrong only line of defence.
3. **Nothing governs self-correction narration.** Opus 5 flags and explains its own earlier
   mistakes at length. Here that compounds: a worker narrates a correction in its report, the lead
   reads it, and the lead's summary to the human carries it forward.

## Decisions (put to the human 2026-07-29, all three accepted)

- **D1 — deliverable length.** One paragraph in `AGENTS.md` §Answer shape and its template mirror:
  match the length of a written deliverable to what the task needs; no filler sections, no
  redundant summaries, no boilerplate. **Not a cap** — the same reasoning as the answer-shape
  spec's D3, where a hard length rule was rejected as the rule that deletes a real answer.
- **D2 — scope discipline in the makers.** Deliver the asked-for scope; make routine judgment calls
  rather than asking; if the ask looks mistaken, say so in a sentence and continue rather than
  quietly narrowing, widening, or transforming it; finish the whole task and say plainly what was
  left undone. Placed once in `AGENTS.md` so it reaches every role, rather than duplicated into
  three role files where it would drift.
- **D3 — corrections.** Correct an earlier statement only when the error changes the reader's code,
  conclusions, or decisions; combine corrections rather than enumerating them; no apologies, no
  tallying past errors. **Explicitly exempt thinking blocks**, and explicitly state that a
  follow-up question is not by itself evidence of an error — both are in Anthropic's recommended
  wording and both matter here, where a lead re-reads its own prior turns constantly.

## Proposed Solution

Three paragraphs appended to the existing `## Answer shape` section in `AGENTS.md`; compressed
equivalents in `skills/sailes-bootstrap/agents-md-template.md`, which carries a ~150-line budget for
the file it generates (146 after 1.23.0, so roughly 4 lines of headroom — the template mirror must
be compressed, not copied).

**Not proposed:** per-role duplication (drift), a length cap (rejected in 1.23.0 for the same
reason), and any change to `checker`/`qa` — their protection is input isolation, not
self-verification, and the audit records why the Opus 5 verification guidance does not apply to
them.

## Phasing & Steps

**Phase 1 — the three guards.**
`Done-when`:
```
git grep -c "Deliverable length\|Scope\|Corrections" -- AGENTS.md → 3 sections present
awk 'END{print NR}' on the template's generated block → printed; ≤150 or the
   overrun stated and accepted in the run log
npm test → green
```

**Phase 2 — release.** Five stamps + CHANGELOG (minor: doctrine content, additive) + the
docs-delta step per `AGENTS.md` §Release.
`Done-when`:
```
npm test → "release-hygiene: all tests passed (five stamps at <version>)"
a receipt exists in .ai/docs-deltas/ for this release
```

## Integration Coverage

No API or UI surface. Verification is `npm test` plus the existing
`evals/answer-shape-hands-over-the-decision.md`, whose next run now also exercises these three
guards — they land in the same section it grades. **No new eval is proposed:** the audit's own
finding is that this repo already carries more scenarios than it re-runs promptly, and three
prose guards inside an already-graded section do not each need their own.

## Backward-compatibility impact

Additive. No existing rule edited or removed, no role definition touched (so the Codex parity
surface is untouched), no hook changes. The one interaction to watch is the template's line budget,
which Phase 1's Done-when forces to be reported rather than assumed.

## Non-Goals

- A length cap, in either the answer rule or the deliverable rule.
- Any change to the `checker`/`qa` gates. See the audit's closing section for why the Opus 5
  verification guidance does not reach them.
- Effort-pin changes. The audit names that as a measurement and deliberately declines to guess it;
  it stays out of this spec.
