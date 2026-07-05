# Lessons — framework-level institutional memory

> Format per entry: **Context / Problem / Rule / Applies-to**. Escaped defects additionally use
> `Escaped-defect:` entries (which gate missed it + what check that gate now gains). Review for
> promotion candidates when closing a spec — prefer promoting into an enforced check or an
> `evals/` scenario over more prose.

## Lessons

### 2026-07-05 — a framework must dogfood its own standard
- **Context:** the 2026-07-02 spec had all phases checked complete, `Status: in-progress`, and
  sat in `.ai/specs/` root; this repo had no STATE.md/backlog.md/lessons.md at all.
- **Problem:** the framework prescribed a lifecycle and memory files it didn't itself follow —
  invisible until someone audited it, and corrosive to credibility.
- **Rule:** every artifact the skills prescribe for generated repos must exist and be current in
  THIS repo; closing a framework spec includes the lifecycle move in the same change.
- **Applies-to:** every framework change-set; `sailes-implement` On-completion.
