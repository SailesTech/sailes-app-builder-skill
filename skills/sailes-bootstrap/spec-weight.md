# The spec weight — one source

The **only** place spec weight is written. `tools/sync-blocks.js` stamps the block below into
`skills/sailes-spec/SKILL.md`, `skills/sailes-bootstrap/spec-writing-template.md` and
`skills/sailes-pre-implement/SKILL.md`.

Third block in the same family as `delegation-threshold.md` (who WRITES) and `gate-scaling.md`
(who GRADES). This one answers the third question those two kept getting confused with: **how much
document the change earns.** Until 2026-08-30 the answer was binary — a spec or no spec — and the
measured result was 365 lines of spec for ~50 lines of code, on a change that was a contract fix.

Edit here, then run `node tools/sync-blocks.js`.

<!-- BEGIN spec-weight -->
**The spec weight scales with what a wrong assumption costs, never with the template you own.**

Three weights. Pick one deliberately; the failure this rule exists for is the full template being
applied because it was there.

- **No spec** — a one-liner, a typo, an isolated refactor with no behavior change. Just do it, with
  a test that pins it. Unchanged.
- **Contract fix** — behavior changes at a surface someone else depends on, but the data model,
  the auth model and the module boundaries stay put. **Five sections, and no more:** TLDR · what
  changes (the surface, before → after) · `Done-when` (carrying `Deployed-probe:` when the change
  is on the wire) · non-goals · phasing only if there is genuinely more than one phase. Every other
  required section is written `n/a` on one line or left out. A data-model section for a change that
  moves no table is filler, and filler costs a spec exactly what it costs an answer: the reader
  cannot find the four load-bearing lines, and every gate downstream reads the same document.
- **Feature** — new surface, a data model that moves, tenancy, auth, money, or an integration
  contract. The full required-sections list, as today.

**Weight goes down, never out.** The opposite failure — skipping the spec because the change "felt
small" — is behind every escaped contract change this framework records, and a contract fix is
precisely the shape that feels small. Halving the document is the saving; skipping it is not.

**A spec is rewritten, not patched.** Measured in the same session: eight numbered correction
sections, accumulated because the spec was being fixed in place instead of re-written. Once the
corrections outnumber the design, the document describes its own history rather than the change,
and reading it costs more than replacing it. The `Status:` line and the Decisions Ledger survive a
rewrite; the correction sections are the thing being deleted.

**Write the weight down.** One line by the `Status:` line — `Weight: contract-fix — no data model
moves, one API path, one FE screen.` A weight nobody wrote is a weight nobody can argue with, and
this rule exists because the default was never a decision at all.
<!-- END spec-weight -->
