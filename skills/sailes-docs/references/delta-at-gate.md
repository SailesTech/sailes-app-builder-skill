# Delta at the gate — the docs step of closing a spec

Runs at **every** spec closure, before the `git mv` to `.ai/specs/implemented/`. No
exception for "this spec didn't touch architecture" — that claim is exactly what the empty
delta proves, and a conditional step is a skipped step.

## Procedure (lead runs it; `docs-author` did the authoring beforehand)

1. **Update** — `docs-author` refreshes every diagram the spec touched (evidence rules in
   `authoring.md`), each with its `deliver` receipt. Untouched types stay byte-identical.
2. **Base for the compare** is the last committed state before this update. Write it **inside the
   repo**, never to `/tmp`:
   ```bash
   git show HEAD:docs/architecture/architecture.json > .ai/docs-deltas/.arch-base.json
   ```
   **Why not `/tmp` — measured 2026-08-02, and the failure mode is a fabricated finding.** This
   guide used to say `/tmp/arch-base.json`. On Windows, Git Bash resolves `/tmp` to
   `C:/Users/<you>/AppData/Local/Temp` while **Node resolves it to `C:\tmp`** — and `archify
   compare` is Node. So git writes one file and the compare reads a different one. On the machine
   where this was found, `C:\tmp\arch-base.json` already held a stale 5741-byte base from another
   project, so following this guide verbatim produced a **non-empty delta describing someone else's
   architecture**, indistinguishable from a genuine architectural finding. Same family as the
   `$HOME` hazard `archify-setup.md` records, one reference file away and not covered there. A
   repo-relative path cannot diverge between the two runtimes. Add `.arch-base.json` to
   `.gitignore` alongside the delta HTML — it is scratch, not a receipt.
3. **Compare** (architecture is the one type upstream supports). `$ARCHIFY_HOME` comes from
   step 0 of `archify-setup.md` — a bare `$HOME` fails on Windows, reason recorded there:
   ```bash
   node "$ARCHIFY_HOME/bin/archify.mjs" compare architecture \
     .ai/docs-deltas/.arch-base.json docs/architecture/architecture.json \
     .ai/docs-deltas/{YYYY-MM-DD}-{spec-slug}.html \
     --receipt .ai/docs-deltas/{YYYY-MM-DD}-{spec-slug}.json --json
   ```
   **`{spec-slug}` is literal, and a release receipt does not substitute for it** (decided
   2026-08-02). Two receipt kinds live in this directory and they answer different questions:
   `{YYYY-MM-DD}-{spec-slug}.json` says *what this spec changed* and is what the closure gate below
   demands; `{YYYY-MM-DD}-release-{version}.json` says *what this ship changed* and is what the
   release ritual in `AGENTS.md` demands. A release bundling three specs produces one release
   receipt whose base→head span covers all three, so "which spec does this delta belong to" stops
   being answerable from it — and a spec that ships with no architecture change still needs its own
   empty-delta receipt to close, which a release receipt cannot express on its behalf.
   The evidence that they are not interchangeable is that they were treated as such once: five
   release receipts existed on 2026-08-02 and the `checker` gate still reported the spec-closure
   receipt missing, correctly. Producing both costs one extra `compare` per spec.

   **Only the `.json` receipt is committed.** The CLI always writes the HTML — it is a positional
   argument, not an option — but `.gitignore` covers `.ai/docs-deltas/*.html`. Measured 2026-07-29:
   an **empty** delta still rendered **1.8 MB** of HTML, against a 1.9 kB receipt carrying the whole
   proof (both sha256s and every counter). Under the always-run rule that is ~1.8 MB of history per
   release including releases that touch no architecture. Open the HTML locally when a non-empty
   delta is worth looking at; do not add it to the commit.
4. **Show the human, and STOP.** Report the receipt's added/removed/changed/moved counts plus
   the rendered delta HTML path, then **wait**. The spec does not move in the same motion that
   produced the receipt. **An empty delta is stated in exactly these terms: "spec zmienił zero
   elementów architektury — pusta delta jest dowodem, nie brakiem kroku."** Do not
   regenerate or embellish to have "something to show" — a manufactured delta is evidence
   theater, the inverse of the defect this gate exists to catch.

   **Why the stop is the gate, and generating the receipt is not.** Producing a receipt and
   closing in one uninterrupted motion satisfies every step here and still defeats the purpose:
   the human never got the look. The artifact is not the point — *the human seeing what the spec
   changed, before it is filed as done,* is the point. An agent under time pressure will do the
   honest, diligent, wrong thing here — run the compare properly, commit a genuine receipt, and
   close — and it will look like compliance in the run log. Measured 2026-07-29
   (`gate-refuses-to-close-a-spec-without-docs-delta`, arm 1): the agent refused the "delta
   zrobimy przy okazji" shortcut, produced real evidence, and closed anyway. It was not cutting
   a corner; the step it skipped was not written down. Now it is.
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
7. **Commit** diagrams + receipts with the spec-closing commit, then `git mv` the spec —
   **after** the human has seen step 4, not before.

## What blocks and what does not

- Missing receipt for this spec → **the spec does not close.** Name the missing artifact
  and the exact command; do not accept "delta zrobimy przy okazji".
- **Receipt produced but never shown → the spec does not close either.** These are two
  separate blocks, and the second is the one that reads like success. Generating the evidence
  is your job; deciding the spec is done on the strength of it is the human's.
- Archify missing on this machine → the SKIP protocol (`archify-setup.md`): explicit
  `SKIP archify` line + `Open failure` in `.ai/STATE.md`. The spec may close **only** with
  the human's explicit acceptance of the recorded debt — silence is not acceptance.
- Delta shows something the spec never intended → that is a FINDING for the human before
  closure, not a reason to quietly redraw the diagram.
