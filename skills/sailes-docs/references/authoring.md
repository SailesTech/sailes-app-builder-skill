# Authoring — diagrams from evidence, validated in a loop

The author role is `docs-author`. Its lane is narrow on purpose: it writes under
`docs/architecture/` (and `.ai/docs-deltas/` receipts) and nowhere else. A defect discovered
while documenting — an import that bypasses a layer, a route that exists in prose but not in
code — is **reported upward as a finding, never fixed in passing**. That is `be-dev`'s lane,
and the same boundary `tester` earned in 1.10.1.

## Evidence discipline (the part that makes the diagram trustworthy)

- **Document what IS, not what the README promises.** If the frontend imports the database
  client directly, that edge goes on the diagram — ugly and true beats clean and false. The
  discrepancy goes into the handoff report for the lead.
- **Sources of evidence, in order:** the graphify map when present and fresh
  (`graphify query`/`explain` — `graphify-setup.md` owns the freshness rule), then the code
  itself. Never memory, never the previous diagram alone.
- **Archify's own repository-evidence mode** can pin references to files at specific commits
  — use it when the human asks for source-verified diagrams; see archify's
  `references/authoring-contract.md` for the fields.

## The authoring loop (archify fast path, held to receipts)

`$ARCHIFY_HOME` is resolved once per session by step 0 of `archify-setup.md` — a bare `$HOME`
breaks every call below on Windows, and the reason is recorded there.

1. Pick the type (`architecture | workflow | sequence | dataflow | lifecycle`); when unsure,
   `node "$ARCHIFY_HOME/bin/archify.mjs" guide "<scenario>" --json`.
2. Read ONE matching schema in archify's `schemas/` + one example. Author fresh JSON:
   stable IDs (they survive re-authoring — the delta depends on them), domain wording,
   **label language = the repo's bootstrap decision** (see `decision-engine.md`), at most
   12 primary nodes, `meta.quality_profile: "showcase"`.
3. Validate after every edit and before any handoff:
   `node "$ARCHIFY_HOME/bin/archify.mjs" validate <type> <candidate.json> --quality showcase --json`
   A showcase pass reports **all 9 artifact checks, 0 errors, 0 warnings**. Repair only the
   diagnosed `subject`, one geometry control per repair; if two consecutive rounds do not
   improve the error count, stop and report the diagnostics truthfully.
4. Final acceptance is `deliver` (never `render` alone):
   `node "$ARCHIFY_HOME/bin/archify.mjs" deliver <type> <src.json> <out.html> --quality showcase --json`
   Non-zero exit is never success. The receipt (SHA-256 + byte counts) goes into the run
   log; a passing final validation freezes the candidate — never edit it afterward.

## The five types in a Sailes client app

| Type | What it maps to |
|---|---|
| `architecture` | modules, services, DB, external systems (CRM, mail, queues) — **the delta source** |
| `workflow` | the business process the app implements (approvals, pipelines, runbooks) |
| `sequence` | the one or two request chains that ARE the product (e.g. webhook → job → CRM) |
| `dataflow` | integrations and lineage — where each field comes from and who consumes it |
| `lifecycle` | the core entity's states (deal, invoice, application) with retries and failures |

Five sources are maintained; only `architecture` gets a rendered compare at the gate
(upstream `compare` supports that type alone) — the other four are reviewed as git diffs of
their canonical JSON, which sorts deterministically for exactly this reason.
