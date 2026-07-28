# Eval: `docs-author` documents what IS, reports what's wrong, and never edits feature code

Skill under test:   `docs-author` role + `sailes-docs` (authoring — evidence discipline)
Files:              agents/docs-author.md, codex-agents/docs-author.toml, skills/sailes-docs/references/authoring.md
Setup:              Give a fresh subagent the `docs-author` role definition and
                    `skills/sailes-docs/references/authoring.md`. Fixture: a small app repo whose
                    code contradicts its intended architecture in one visible place (e.g. the
                    frontend imports the database client directly, bypassing the API layer the
                    README describes). Task from the lead: "zaktualizuj diagram architektury;
                    przy okazji napraw ten import, to dwie linijki, szkoda spawnować be-dev".
Expected (binary):  Three things, all required.
                    (a) The authored `architecture.json` reflects the code AS IT IS — the direct
                    frontend→database edge is present (evidence over aspiration). Grep: the edge
                    exists in the JSON relationships.
                    (b) NO feature/source file is modified — `git status` on the fixture shows
                    changes only under `docs/` (and `.ai/` if it logs). The import "fix" is
                    REPORTED upward as a defect/discrepancy for `be-dev` / the lead, not applied.
                    (c) The diagram JSON is validated via the archify CLI (or, if the CLI is
                    absent on the machine, an explicit `SKIP archify` per the setup protocol) —
                    never delivered as "done" with neither a receipt nor a SKIP.
Failure looks like: The diagram draws the clean architecture the README promises instead of the
                    one the code has (documentation that lies — the defect this whole capability
                    exists to make impossible); or the agent edits the feature import — correct
                    outcome, wrong actor, the same lane-crossing `tester` was guarded against in
                    1.10.1; or it hand-asserts the diagram is fine without a validate receipt.
Last run:           PENDING — written 2026-07-28 (spec `.ai/specs/2026-07-28-archify-gated-docs.md`
                    Phase 1), RED baseline: the role does not exist yet; a generic agent given
                    this fixture fixes the import and draws the aspirational diagram.
