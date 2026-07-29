---
name: sailes-docs
description: Gated, verifiable project documentation via archify diagrams — the docs layer of every Sailes repo. Use when generating or updating architecture/workflow/sequence/dataflow/lifecycle diagrams, when closing a spec (the docs-delta step at the release gate), when preparing the client documentation package, at bootstrap/adopt (initial diagram set), or when the user says "wygeneruj dokumentację", "zaktualizuj diagram", "delta architektury", "paczka dla klienta", "architecture docs". Also the reference for the SKIP protocol when archify is missing on a machine.
---

# Sailes Docs — documentation that cannot rot and cannot lie

Every Sailes repo carries a set of archify diagrams (`docs/architecture/`) that is regenerated
as a **gated step** of the pipeline, validated **deterministically** by the archify CLI, and
compared at every spec closure so the human sees **what actually changed**. That is the whole
point, stated as three guarantees:

1. **Cannot rot** — updating the diagrams is part of closing a spec, and the release gate
   refuses to close without the delta receipt. Not a convention; a gate.
2. **Cannot lie** — a diagram is accepted only with a passing `validate`/`deliver` receipt
   (exit ≠ 0 is never success), and it documents the code **as it is**, defects included;
   aspirations go into a report, not into the picture.
3. **Delta is evidence** — `archify compare architecture` produces the added/removed/changed
   record shown to the human at the gate. An EMPTY delta is also evidence: "this spec changed
   no architecture" is a positive assertion, not a missing step.

Built on [archify](https://github.com/tt-a1i/archify) (MIT, tt-a1i) — installed per machine,
never vendored. Attribution stays with upstream.

## The file contract (identical in every Sailes repo)

```
docs/architecture/
  architecture.json + architecture.html     # the delta source of truth
  workflow.json     + workflow.html         # pipeline / approval flows
  sequence.json     + sequence.html         # key request/call chains
  dataflow.json     + dataflow.html         # data pipelines / lineage
  lifecycle.json    + lifecycle.html        # state machines of core entities
  client-package/                           # 5 HTML copies, overwritten at every gate
.ai/docs-deltas/{YYYY-MM-DD}-{spec-slug}.json   # compare receipts, one per closed spec
```

JSON is the source of truth and stays readable to agents; generated `*.html` goes into
`.claudeignore` (it is large, deterministic, and derivable). Diagram label language is a
per-repo bootstrap decision (the client's language) — see `decision-engine.md`.

## Who does what

- **`docs-author`** (role) authors and repairs the JSON from repo evidence and runs the
  validate loop. Its lane: writes under `docs/` and receipts only; a defect discovered while
  documenting is REPORTED upward, never fixed in passing.
- **The lead** runs the delta step at spec closure and shows the human the receipt.
- **`qa`** may vision-verify a rendered diagram against the design artifact where one exists.

## Router

| Task | Read |
|---|---|
| Machine setup, version floor, missing archify | `references/archify-setup.md` — includes the **explicit-SKIP protocol**; a missing tool is never silence |
| Authoring or updating diagrams from repo evidence | `references/authoring.md` |
| Closing a spec: compare, receipt, empty delta, client package | `references/delta-at-gate.md` |

## When NOT to use

- Prose documentation (README, runbooks) — out of scope by spec; this skill is diagrams only.
- Diagnose incidents: a mechanism diagram is optional garnish there, never a required step —
  `sailes-diagnose` owns its own priorities.
