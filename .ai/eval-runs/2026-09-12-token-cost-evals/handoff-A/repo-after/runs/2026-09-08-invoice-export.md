# Run log — eksport faktur do CSV

Spec: `.ai/specs/2026-09-08-invoice-export.md` · Branch: `feat/invoice-export`

## Phase 1 — closed 2026-09-10
- be-dev `3f2a9c1`; checker APPROVE; qa PASS (`curl` 200 text/csv, 403 without role).

## Phase 2 — generator CSV — closed 2026-09-12
- be-dev-2 declaration commit `8e77d10`, merged `a41c0de`.
- tester-2: 12 cases frozen by the owner 2026-09-11; suite `invoice-csv.service.spec.ts` 12/12 green
  against the merge; detection proof 6/6 mutants killed. Integration sha of the suite: not recorded
  here. Read it from `git log feat/invoice-export`; the Phase 3 `Base:` line needs it.
- checker (2026-09-12 14:02): **APPROVE** — no findings. Diff matches Phase 2 only; every frozen ID covered.
- qa (2026-09-12 14:31): **PASS** — suite 12/12 against the running API; `curl -H "Authorization: Bearer <accountant>"
  "http://localhost:3000/api/invoices/export?month=2026-08" -o aug.csv` → `200`, `Content-Type: text/csv; charset=utf-8`,
  file starts with BOM `EF BB BF`, 3 rows + header, `Zażółć gęślą jaźń sp. z o.o.` renders correctly in
  LibreOffice and Excel (screenshots `.ai/screens/2026-09-12-invoice-csv-*.png`).
- **Gate closed 2026-09-12.** Done-when half 1 (frozen suite green) is proven by tester-2 and by qa.
  Half 2 (3-invoice file opens in Excel with Polish characters, BOM) is proven by qa's curl output and
  screenshots. Neither half has an open finding. The phase has no `Deployed-probe:`. No docs-delta:
  this is not a spec closure.
- Lead handed off on the closed phase (session-handoff rule). Phase 3 is not dispatched.

## Phase 3 — next (brief, not dispatched)

Pre-dispatch (lead): `git rev-parse --show-toplevel` must be the API repo, and read HEAD of
`feat/invoice-export` for `Base:`.

Spec correction made while writing this brief: Done-when clause 2 ("zmiana kolejności w konfiguracji
zmienia kolejność w CSV") forces `invoice-csv.service.ts` to change, but the file was missing from
Phase 3 `Files:`. It is added to the spec with a marker.

```markdown
You are `be-dev` on team invoice-export, under `team-lead`.
You are in your own worktree on branch `…`. Do not switch branches. Never commit to a
shared branch and never push. **Commit your finished work HERE** — that commit is your
declaration that the task is done. `WIP:` commits are checkpoints. No commit = not finished.

Task:        Phase 3 of `.ai/specs/2026-09-08-invoice-export.md` — konfiguracja kolumn. One Done-when.
Base:        `git rev-parse --short HEAD` — READ it. Expected: the sha the lead reads from
             feat/invoice-export at dispatch, or newer. Proof: the file
             `apps/api/src/export/invoice-csv.service.spec.ts` exists and holds the 12 frozen
             Phase 2 cases. If behind, fast-forward before starting. Report the result either way.
Goal:        CSV columns and their order come from one config file, not from generator code:
             `numer`, `data_wystawienia`, `kontrahent`, `nip`, `netto`, `vat`, `brutto`.
Files:       `apps/api/src/export/columns.config.ts` — Done-when clause 2 (the config must exist
               for its order to be changed)
             `apps/api/src/export/columns.config.spec.ts` — Done-when clause 1 (must be green) and
               clause 2 (the order test)
             `apps/api/src/export/invoice-csv.service.ts` — Done-when clause 2 (the generator must
               read the config, or changing the config changes nothing)
Contract:    endpoint `GET /api/invoices/export?month=YYYY-MM` unchanged: `200 text/csv; charset=utf-8`,
             UTF-8 BOM, `403` without the role. The CSV output for the spec's default column order
             is byte-identical to Phase 2's.
Constraints: `invoice-csv.service.spec.ts` (Phase 2, frozen) stays 12/12 green WITHOUT edits — it is
             the regression guard. No new dependencies.
Forbidden:   editing `invoice-csv.service.spec.ts`; any file outside the three above; the endpoint
             controller and auth guard; the database, containers, ports.
Blocked:     a non-key question stuck for more than one round → substitute decision, MARK it in
             code, report it as a deviation. A column set or contract change is a key decision:
             escalate and wait.
Status:      claim `.claude/status/<harness-agent-id>.md` as your FIRST action (worker, task, base,
             claimed, opened). Close it LAST by APPENDING closed, outcome, commit, touched. If the
             main-tree write fails, write `<worktreePath>/.claude/status/<id>.md` and say so in
             your report.
Checkpoint:  write progress to disk as you go.
Verification: Inner loop — only `columns.config.spec.ts` and `invoice-csv.service.spec.ts`.
             Once, before the declaration commit — the full API suite, plus
             `columns.config.spec.ts` green and the order test green.
Report:      `.ai/runs/reports/2026-09-08-invoice-export-phase3-be-dev.md`. Create it with your FIRST
             change and append as you go: per-file diff summary · command output · contract shape ·
             deviations · `Promotion candidate:` if any. If you did not finish, say so and list what
             you did and did not establish. No file = task not done.
Delivery:    [state the spawn mode at dispatch: scoped subagent → final message returns
             automatically; background teammate → SendMessage].
```

Then: `tester` derives Phase 3 cases from the spec with the code unread → the human freezes them
(ADD to `.ai/test-plans/2026-09-08-invoice-export.md`) → suite + detection proof → `checker` gets diff
+ spec + checklist only → `qa` (observable: column order in the live CSV via curl). Worker tiers:
role defaults, no escalation planned. The contract is unchanged, so there is no judgment trigger.

## Progress
- [x] Phase 1
- [x] Phase 2 — closed 2026-09-12 (checker APPROVE · qa PASS)
- [ ] Phase 3
- [ ] Phase 4
