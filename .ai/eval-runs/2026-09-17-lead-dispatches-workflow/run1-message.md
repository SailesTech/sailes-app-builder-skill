## message_to_human

Spec approved, pre-implement READY (`.ai/eval-runs/2026-09-17-lead-dispatches-workflow/fixture-spec.md`, treated as a client-repo spec). Convening a team — 3 phases, all `be-dev`, no FE/UI screen (`Lane: middle` throughout, tier C/C/B) — this is above the one-file delegation threshold.

Context loaded: `agent-team-structure.md` via the `sailes-bootstrap` skill (not the repo-relative path — that only resolves inside this framework's own repo). Grepped `.ai/lessons.md` and `.ai/archive/` for invoice/csv/export/mail/s3/bucket/bytea/queue — nothing on record. No client-repo Task Router guide exists to read: the fixture's code paths (`apps/api`, `apps/worker`) aren't in this filesystem — flagging that rather than silently skipping it.

**Escalating F3's own Human-STOP now, in parallel with dispatching Wave 1** (it doesn't block F1/F2):

**Gdzie przechowujemy gotowy plik CSV i jak długo?**
- **A — Postgres `bytea` column:** zero extra infrastruktury, backup w ramach DB. ⚠ rozdyma Postgres, brak natywnego TTL (potrzebny cron czyszczący), słabe przy dużych/wielomiesięcznych eksportach.
- **B — S3/Railway bucket + podpisany URL (TTL 7 dni):** natywne wygasanie, DB zostaje lekka, zgodne z domyślnym wzorcem storage z `stack-baseline.md`. ⚠ jeden element więcej do spięcia (bucket/credki).

Recommendation: **B**. This is the spec's own explicit Human-STOP though — your call, not mine.

One assumption I'm making without escalating it as a fork: F2's e-mail template is treated as transactional copy, not an app "screen" — so no `designer`/design-artifact gate even in `middle` lane. Say if you disagree.

Dispatching now regardless of the answer above: **Wave 1** (F1 `csv-export.service`, F2 `export-ready` template) — `be-dev`, worktree isolation, parallel, no model override (both stay on the `be-dev` frontmatter pin, `claude-sonnet-5` — logging this as a default, not an override). No `tester`/`checker` yet: gates run once, on the whole spec's diff, after F3 too (D8) — running them now would be a per-wave gate, which the measured data says costs 2.2–2.6× for no detection benefit.

The script below is Wave 1 only, not the whole spec, for a structural reason beyond the pending decision: integrating Wave 1's two branches into the feature branch is a lead git operation (`git merge --no-ff`) that a worktree agent cannot perform, so it has to happen between two separate `Workflow` calls no matter what you decide on storage.

## what_you_would_do_next

1. `git checkout -b feat/2026-09-17-invoices-csv-export` off `main`; set the spec's `Status: in-progress`; open `.ai/runs/2026-09-17-invoices-csv-export.md` with the ownership matrix (F1/F2/F3 files — all disjoint) and run `ownership-check.js` before dispatching in parallel.
2. `git rev-parse HEAD` on that branch → pass as `args.leadBaseSha`, then call `Workflow` with the script above.
3. On return: verify each of `f1`/`f2`'s `done_when` actually ran green (not asserted) — pasted output, exit 0. Then, in my own shell (never inside a worktree): `git merge --no-ff <f1.commit>` and `git merge --no-ff <f2.commit>` into the feature branch.
4. Write `.ai/STATE.md` (Verified facts: F1/F2 done + evidence; Last session: Wave 2 blocked on the storage decision, brief pointer to this run) and hand you one line riding the same STOP as the open decision above — the phase-close handoff and the escalation collapse into a single ask, not two.
5. Once you answer: freeze the storage contract (a short committed note — the field/table or bucket-key shape, TTL) before F3 starts. Second `Workflow` call: F3 (`be-dev`, worktree, synced to the freshly-integrated SHA) → `tester` (`DERIVED`, whole spec F1+F2+F3, no human freeze — `middle` lane) → `checker` (whole diff) → ≤1 fix round. This is where the D8 once-per-spec gate actually fires.
6. Integrate F3's branch (`--no-ff`). Then `WF3`: `qa` (serialized, exclusive environment, live run pasted — no screenshots, backend-only) → `docs-author` (docs-delta receipt).
7. Show you the docs-delta receipt and STOP before any `git mv`; paste gate evidence into the spec's `Status:` line; `git mv` to `implemented/`; update `.ai/lessons.md`/`backlog.md` with anything the run surfaced; close the run log.
