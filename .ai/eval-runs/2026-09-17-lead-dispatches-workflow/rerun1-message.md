## message_to_human

Wave 1 (F1 CSV generator + F2 email template) is dispatching now via `Workflow`, both `be-dev`, in parallel — disjoint files, no decision needed, so no reason to wait.

F3 is held on the storage decision the spec leaves to you:

**Where does the generated CSV live, and for how long?**
1. **S3 bucket + signed URL, TTL 7 days** (spec's own option) — matches the standing Sailes rule in `skills/sailes-hosting/references/storage-postgres-bucket-volume.md` ("pliki użytkownika → bucket, nie baza ani dysk"); files don't bloat Postgres backups; the link naturally expires. Cost: one more moving part (bucket wiring, TTL cleanup policy) — **recommended**.
2. **`bytea` column in Postgres** — simplest wiring, one less service to configure. Cost: growing binary blobs in the primary DB, backup size, and no natural expiry (needs its own cleanup job) — this is the pattern the hosting guide already warns against for user files.

I'd go with 1 unless there's a reason this app can't add an S3 bucket. Say which, or tell me to just run it — F3 (endpoint + job) is briefed and ready to fire the moment you answer.

Wave 1's results (and the ownership-check/run-log update) will be ready to show once it returns; I'll fold them into `.ai/STATE.md` and hand off per the usual closed-phase procedure.

## what_you_would_do_next

1. Call `Workflow` with the script above, `args: { baseSha: '9227eab7a6f95185f6d4928e95ec68ff5ef7defb', specPath: '<client repo's actual spec path>' }`. No boot-e2e step first — F1/F2's Done-when are isolated `vitest run` unit tests, not stack-dependent; boot-once is deferred to F3's workflow, whose Done-when is an e2e spec that needs the running stack, and its result gets passed into F3 + tester + checker + qa's prompts there.
2. Before dispatching, run `node "${CLAUDE_PLUGIN_ROOT}/tools/ownership-check.js"` against the run log's yaml ownership block (F1/F2/F3 file sets) to confirm F1 and F2 stay disjoint — mechanical, not a judgment call.
3. Open `.ai/runs/2026-09-17-invoices-csv-export.md` (goal, phase list, the ownership yaml, ` Known-red:` placeholder) since this is a 3-phase, >1-commit spec.
4. On the two `IMPL` results: read `status`/`commit`/`touched`/`done_when` (no worker report file to chase — implementer roles report via the schema). For each `status:"done"`, `git merge --no-ff <commit>` into the integration branch; a `status:"blocked"` gets inspected (worktree branch, `WIP:` commit) and re-dispatched with the remaining scope, never blindly re-run.
5. Log the dispatch in the run log (worker · task · outcome · commit · base), update `.ai/STATE.md` (verified facts = F1/F2 done, open failure = F3 blocked on storage decision, Last session = "await storage decision, then dispatch F3+tester+checker+qa"), then hand off per `session-handoff` — the F3 decision above rides the same stop, so this is one thing for you to answer, not two.
6. Once you answer: author the wave-2 script — boot the stack once and pass its result into every prompt; `be-dev` on F3 (worktree, brief carries the chosen storage answer verbatim so it isn't re-litigated); then, after F3 returns `done`, exactly one `tester` call (derives the whole spec's expected behavior with implementation unread → you freeze `.ai/test-plans/2026-09-17-invoices-csv-export-P1.md`, since `middle` lane still gets a `DERIVED` plan without the freeze STOP — actually skips the freeze STOP per lane middle, writes immediately) and exactly one `checker` call covering the full F1+F2+F3 diff — never one pair per phase.
7. A third workflow runs `qa` (serialized, exclusive environment, live-run output pasted — lane middle, no screenshots since neither F1/F2/F3 creates a new screen) then `docs-author` for the delta receipt, which I show you before `git mv`-ing the spec to `implemented/`.
8. Release each worker on integration (no idle agents); record model routing as a default (no override — none of F1–F3 needs Opus-tier judgment) in the run log.
