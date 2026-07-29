# Delta at the gate — the docs step of closing a spec

Runs at **every** spec closure, before the `git mv` to `.ai/specs/implemented/`. No
exception for "this spec didn't touch architecture" — that claim is exactly what the empty
delta proves, and a conditional step is a skipped step.

## Procedure (lead runs it; `docs-author` did the authoring beforehand)

1. **Update** — `docs-author` refreshes every diagram the spec touched (evidence rules in
   `authoring.md`), each with its `deliver` receipt. Untouched types stay byte-identical.
2. **Base for the compare** is the last committed state before this update:
   ```bash
   git show HEAD:docs/architecture/architecture.json > /tmp/arch-base.json
   ```
3. **Compare** (architecture is the one type upstream supports). `$ARCHIFY_HOME` comes from
   step 0 of `archify-setup.md` — a bare `$HOME` fails on Windows, reason recorded there:
   ```bash
   node "$ARCHIFY_HOME/bin/archify.mjs" compare architecture \
     /tmp/arch-base.json docs/architecture/architecture.json \
     .ai/docs-deltas/{YYYY-MM-DD}-{spec-slug}.html \
     --receipt .ai/docs-deltas/{YYYY-MM-DD}-{spec-slug}.json --json
   ```
4. **Show the human** the receipt's added/removed/changed/moved counts plus the rendered
   delta HTML path. **An empty delta is stated in exactly these terms: "spec zmienił zero
   elementów architektury — pusta delta jest dowodem, nie brakiem kroku."** Do not
   regenerate or embellish to have "something to show" — a manufactured delta is evidence
   theater, the inverse of the defect this gate exists to catch.
5. **The other four types** are reviewed as git diffs of their canonical JSON in the same
   look — name the files that changed; byte-identical files are named as such.
6. **Client package (auto, every gate):** copy the five delivered HTML files into
   `docs/architecture/client-package/`, overwriting in place — never accumulating per spec.
   ```bash
   cp docs/architecture/*.html docs/architecture/client-package/
   ```
   Share-card PNG is NOT automatable from the CLI (exports are viewer-runtime features
   inside the HTML); it is generated from the viewer at project handover — the handover
   checklist owns that step.
7. **Commit** diagrams + receipts with the spec-closing commit, then `git mv` the spec.

## What blocks and what does not

- Missing receipt for this spec → **the spec does not close.** Name the missing artifact
  and the exact command; do not accept "delta zrobimy przy okazji".
- Archify missing on this machine → the SKIP protocol (`archify-setup.md`): explicit
  `SKIP archify` line + `Open failure` in `.ai/STATE.md`. The spec may close **only** with
  the human's explicit acceptance of the recorded debt — silence is not acceptance.
- Delta shows something the spec never intended → that is a FINDING for the human before
  closure, not a reason to quietly redraw the diagram.
