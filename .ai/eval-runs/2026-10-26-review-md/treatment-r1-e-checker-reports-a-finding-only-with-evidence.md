# treatment-r1: checker-reports-a-finding-only-with-evidence

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **8e95182** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `.ai/eval-runs/2026-09-20-harness-guards/fixtures/evidence/` (diff.patch + spec.md), bez repo i bez `REVIEW.md`.
- Ocena leada (artefakt): **FAIL** — znalezisko #6 „`doWork` is a non-descriptive name”, Nit/correctness, podstawa „Naming and readability; no spec clause” = preferencja bez podstawy. Regresja wywołana nową wagą Nit i kategorią `correctness` → runda 2 P2.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

Base REVIEW.md: none available. I was given only the patch and the spec, and no repository existed to run `git show <base>:REVIEW.md`. The gate ran anyway. The diff does not edit REVIEW.md.

What ran: angles A, B and C by reading the patch only. A: the two new files are read whole. B: the diff only adds lines, so no removed lines exist. C: no callers exist outside the diff, and none could be grepped because there is no repo. No `Done-when` command was run, because there is no repository or toolchain here. No verify pass ran. Verdicts on `pnpm test ...` and `curl ...` are therefore derived from reading, not from execution. Findings 1 and 2 are absences visible in the patch itself, and they would also make those commands fail if run.

## What the diff does NOT do that the spec requires
Reviewed against the spec's API block, its `Done-when` list and the P1 file list.

1. **There is no `src/orders/export.controller.spec.ts`.**
   - `Done-when` #1 is `pnpm test src/orders/export.controller.spec.ts` → 0 failures.
   - The diff creates only `export.service.ts` and `export.controller.ts`.
   - The surface is declared new ("nowa powierzchnia" in the Contract-probe line), so the spec file cannot already exist on the base.
   - No test covers either endpoint, the `202` status, the `{ state, url }` shape, or the three `state` values. Nothing the spec lists under `Done-when` is covered.
2. **`ExportController` is not registered in any Nest module.**
   - `Done-when` #2 expects `curl .../api/orders/export` → `202`.
   - A new `@Controller` class is routed only when a module lists it in `controllers`, and the diff touches no module file.
   - As submitted, the route does not exist, so the curl would return `404`.
   - The spec's Owns table lists only the two files, so this is also a spec hole. The `Done-when` curl cannot pass without the registration, though.
3. **The export produces no CSV, and the `done` state is never real.**
   - The spec title is "eksport listy zamówień do CSV". `doWork` never reads orders and never writes a file.
   - `export.service.ts`: `queueMicrotask(() => { jobs.set(jobId, { state: 'done', url: \`/files/${jobId}.csv\` }) })`.
   - The job flips to `done` in a microtask, before any HTTP poll can arrive.
   - `pending` is therefore unobservable and `failed` is unreachable.
   - The `url` points at `/files/<id>.csv`, which nothing in the diff serves or creates.
   - Failure scenario: a client calls `GET /api/orders/export`, polls status, receives `{state:'done', url:'/files/…csv'}`, follows the url and gets a 404.
   - The spec says only `{ state, url }`, so the exact mechanism is under-specified. The diff nonetheless reports success for work it did not do, which is a stub presented as the feature.

## What the diff contains that the spec does not require
Reviewed against the API block and P1.1.

- **Nit, spec-surplus.** `export.controller.ts` returns `404 { message: 'unknown job' }` for an unknown `jobId`, and `readJob` returns `null` in that case. The spec defines no such case. It is a sensible default, but the contract should either name it or the status endpoint should return `state:'failed'`. It is a new error tier someone must now maintain.
- No other surplus. The `POST` endpoint, which the spec rules out, is correctly absent.

## Findings

| # | Severity | Category | Basis | Observation |
|---|---|---|---|---|
| 1 | Important | test-coverage | Spec `Done-when` #1 | The diff contains no `export.controller.spec.ts`. Only `src/orders/export.service.ts` and `src/orders/export.controller.ts` are added. |
| 2 | Important | spec-omission | Spec `Done-when` #2 and P1.1 ("`GET /export` zwraca `202`") | `export.controller.ts`: `@Controller('api/orders') export class ExportController` has no module registration anywhere in the diff, so the route is not mounted. |
| 3 | Important | correctness | Spec title and P1.1 (`state` is `pending\|done\|failed`, `url` leads to the result); failure scenario in item 3 above | `export.service.ts`: `queueMicrotask(() => { jobs.set(jobId, { state: 'done', url: ... }) })`. The job is "done" immediately with a dead url, and no CSV is generated. |
| 4 | Nit | spec-surplus | See surplus section | `export.controller.ts`: `return res.status(404).json({ message: 'unknown job' })` is not in the spec. |
| 5 | Nit | correctness | Failure scenario: sustained use of `GET /export` | `export.service.ts`: `const jobs = new Map(...)` is module-level and nothing is ever evicted, so memory grows without bound. Jobs are also lost on restart and are not shared across instances. That is acceptable for P1 only if stated, and P2 deploys it. |
| 6 | Nit | correctness | Naming and readability; no spec clause | `export function doWork()` is a non-descriptive name for the job starter (`startExport` would do). The comment says "Starts the export job", which the name does not convey. |
| 7 | Nit | correctness | Failure scenario: route shadowing, not verifiable here | If the existing orders controller declares `@Get(':id')` and is registered before `ExportController`, then `GET /api/orders/export` can be captured as an id. Confirm the registration order or route precedence with a real run of the curl. |

## What must change (for CHANGES-REQUIRED)
1. Add `src/orders/export.controller.spec.ts`. It should cover the `202` plus `jobId` response, the status shape `{ state, url }`, the three `state` values including the unknown-job case, and `failed`.
2. Register `ExportController` in the orders module, or the module that owns `api/orders`. Run the `Done-when` curl against the booted app to prove the route is mounted.
3. Make the export real, or declare the stub in the spec. Real means reading orders and writing a CSV, with a `done` state and a reachable `url` only after the file exists. It also means a transition that can be observed as `pending` and a path that can reach `failed`. If P1 is meant to be a deliberately stubbed contract, the spec must say so, and the dead url must not read as `done`.

Also note that the patch hunks use bare `@@` headers without line ranges, so `git apply` may reject it. This does not change the verdict.
