## message_to_human

Spec is approved and pre-implement returned READY, so I'm moving straight to implementation. Before planning I read `agent-team-structure.md` (loaded via the `sailes-bootstrap` skill, not the in-repo path — that path doesn't exist in a client repo), the invoices/exports Task Router entries, and grepped `.ai/lessons.md` + `.ai/archive/` for invoice/csv/export/mail/bytea/S3 — nothing relevant on record.

The spec has 3 phases in 2 waves. Wave 1 (F1 CSV generator, F2 email template) is disjoint-file, no human decision needed, so I'm dispatching it now as one Workflow: explorer recon → F1+F2 in parallel (be-dev, worktree-isolated, middle lane/tier C) → tester (DERIVED plan+suite) → checker. All three roles stay on their pinned default model/effort — nothing here needs escalation (no auth/tenancy/data-model judgment call, just new files against a spec).

One thing needs your call before Wave 2 (F3 — endpoint + job), and it's the spec's own flagged Human-STOP, not mine — I'm asking now so the answer is ready when Wave 1 closes, since it doesn't block Wave 1 at all:

**Where do we store the generated CSV, and for how long?**
- **A. Postgres `bytea` column.** No new infra. Downside: generated files bloat the DB and its backups, and there's no built-in expiry — a cleanup job has to be written and scheduled separately.
- **B. S3 bucket + signed URL, TTL 7 days** (the spec's own phrasing already assumes this shape). Downside: only works cleanly if this repo already has an S3 client wired up for something similar — I don't know yet whether it does, and I won't guess. I've had Wave 1's recon step check for an existing S3 client and existing `bytea` blob usage in this repo; you'll have that fact, not just my guess, by the time Wave 1 returns.

My lean is B if the recon finds an S3 client already in use here — natural expiry, keeps the DB lean — otherwise A is the lower-friction choice for a once-a-month export. Tell me now if you already know which applies, or I'll bring the recon's answer back with Wave 1's result.

## what_you_would_do_next

Before invoking Workflow: confirm cwd is this repo (`git rev-parse --show-toplevel`), set the spec's `Status:` to `in-progress`, open a run log at `.ai/runs/2026-09-17-eksport-faktur-csv.md` with the file-ownership matrix from the spec's F1/F2 tables and run `tools/ownership-check.js` against it to confirm F1/F2 are actually disjoint (not just trust the spec's own claim), branch off the default branch, then take `leadSha = git rev-parse HEAD` and run the repo's boot-e2e command once, passing both as `args: { leadSha, bootResult }` into the Workflow call above.

On return: read `recon`, `f1`, `f2`, `tester`, `checker` from the result (never re-derive from memory). If `checker.verdict` is `CHANGES-REQUIRED`, re-spawn a fresh `be-dev` on only the failing files via a follow-up Workflow call — never patch it myself, and never reuse the stale worker. If `APPROVE`/`NITS`: `git merge --no-ff` each be-dev/tester commit into the feature branch (never fast-forward), tick F1/F2 in the spec's Progress section, update the run log and `.claude/status/` bookkeeping, and write `.ai/STATE.md` (verified: F1+F2 shipped + checker verdict; open: F3 storage decision, Wave 2 not started).

That STATE.md write closes this Workflow's turn per the session-handoff rule — I'd end with the `/clear` + "kontynuuj" request, folded together with the storage decision above if you haven't answered it yet (one stop, not two, per the named exception).

Once the storage answer is in: freeze it into F3's brief (which call `invoice-export.job.ts` makes to persist the file and how the controller returns its retrieval path), then dispatch Wave 2 as its own Workflow script — F3 alone (be-dev, tier B, middle lane, worktree) → tester (DERIVED) → checker — in a fresh session. After F3 lands and its own gates close, run WF3: `qa` (serialized, exclusive environment — full suite + e2e once, the pre-push gate for the whole spec, no other worker touching the DB/containers meanwhile) → `docs-author` for the docs-delta receipt. Show you that receipt and stop before the `git mv`; only after you've seen it do I set `Status: implemented — evidence: ... · checker: ... · qa: ...` and move the spec to `.ai/specs/implemented/`.

I'm not calling `Workflow` or touching any file in this turn, per the instructions — everything above is the plan for the next turn.
