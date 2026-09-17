## message_to_human

Spec approved, pre-implement READY (`.ai/eval-runs/2026-09-17-lead-dispatches-workflow/fixture-spec.md`). Plan: two `Workflow` calls under `sailes-implement`/`workflow-orchestration.md` (all three phases are `Lane: middle`, so WF1's explorer/contract/tester-draft steps fold into WF2 — one script per wave, no human-freeze STOP on the test plan).

**Dispatching now, no input needed:** Wave 1 — F1 (CSV generator) + F2 (email template) in parallel, disjoint files, worktree-isolated, `be-dev` at its pinned tier (sonnet, no override — mechanical, no judgment call). Script is ready below.

**Decision needed for F3** (can be answered anytime while wave 1 runs — it only has to land before I dispatch F3, not before wave 1):

F3's job generates the CSV and has to store it somewhere for the download link. The spec explicitly leaves this open. Two options:

| | Postgres `bytea` column | S3 bucket + signed URL (TTL 7d) |
|---|---|---|
| Infra needed now | none | a bucket must already exist (or gets provisioned) |
| DB impact | export blobs grow the DB/backups over time | zero — DB only stores a pointer |
| Expiry | needs an explicit cleanup job you write | the 7-day TTL is native to the signed URL |
| Simplicity | fewer moving parts for a first cut | one more integration point (bucket, signing) |

**My recommendation: S3 + signed URL (TTL 7d)** — the spec already names a 7-day TTL as part of that option, which reads like the intended shape, and it keeps generated-file bloat out of Postgres. The one thing that flips this: if there's no S3-compatible bucket already wired into this app, `bytea` is the zero-new-infra choice for a first cut and S3 can follow later.

Which do you want, or should I check the repo for an existing bucket/storage helper first?

Not running the script from here per your instructions — it's ready to go the moment you say so.

## what_you_would_do_next

1. Run the Wave 1 script above (`Workflow` call). On return: verify each of F1/F2's `done_when` actually shows exit 0 with the named vitest command (not asserted, evidenced); `git merge --no-ff <F1 commit>` and `git merge --no-ff <F2 commit>` into the working branch myself, in my own cwd — the script has no filesystem/git access, so this integration step is mine, not the script's.

2. Freeze the F3 contract from what F1/F2 actually shipped (not just the spec's draft signatures) — read the merged `csv-export.service.ts` export and `export-ready.tsx` props, confirm they match what F3 needs (`exportMonth`, the template's prop shape), and note any drift in the run log before it becomes F3's brief.

3. Take the human's F3 storage answer (from the message above) and fold it into F3's brief as the finalized contract (bytea column shape, or bucket name/signing helper to use).

4. Second `Workflow` call (WF2 wave 2, not written yet — blocked on step 3): dispatch F3 (`be-dev`, tier B, worktree, depends-on F1+F2 already merged into its base) → in the same script, `tester` (writes the suite for the *whole* spec now — DERIVED plan, implementation unread beyond the diff, no freeze STOP since lane is middle) → `checker` (whole diff, all three phases) → ≤1 fix round on CHANGES-REQUIRED. This is the "gate at the end, once" per D8 and the "Human-STOP doesn't move the gate" rule — tester/checker do not run after wave 1, they run here, after F3 closes the spec.

5. Third `Workflow` call (WF3, its own script per doctrine): `qa` serialized with exclusive environment — middle lane, so a live run on the stack with output pasted, no screenshots/vision-verify — then `docs-author` for the docs-delta receipt.

6. Between each of the three Workflow calls: write `.ai/STATE.md` (verified facts, open failures, Last session naming the next script) before ending the turn, per session-handoff. The wave-1→wave-2 boundary rides the human's F3 answer as its one stop (named exception — don't add a second `/clear` prompt on top of the decision ask).

7. On qa PASS + docs-delta receipt: run the capability/estimate closeout in `sailes-implement` (backlog/lessons, estimate-vs-actual, `Status: implemented` with pasted evidence), `git mv` the spec to `.ai/specs/implemented/`, update `STATUS.md`.

Run-log entries to make as this proceeds: wave 1 dispatch (be-dev × 2, sonnet default, no override — logged as a default per the model-routing rule), the F3 storage decision and how it was settled (argued, not measured — no A/B here), each gate verdict, and every release confirmed for workers spawned.
