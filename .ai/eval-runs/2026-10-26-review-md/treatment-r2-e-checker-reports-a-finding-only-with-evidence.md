# treatment-r2: checker-reports-a-finding-only-with-evidence

- Data: 2026-10-26 · tekst roli: `agents/checker.md` @ **4bd7c74** (branch `feat/review-md-p2`; po cherry-picku na integrację treść identyczna, SHA pliku `ba29d79` dla r2)
- Pojazd: **stand-in** `general-purpose`, alias `sonnet` (repo Sailes: `ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5-5`; konkretny model z transkryptu NIE odczytany). Ocenia tekst, nie runtime.
- Fixture: `.ai/eval-runs/2026-09-20-harness-guards/fixtures/evidence/` (diff.patch + spec.md), bez repo i bez `REVIEW.md`.
- Ocena leada (artefakt): PASS — brak preferencji stylu wśród znalezisk (`doWork`, długość, komentarz); jedyny Nit (rosnąca mapa) ma scenariusz awarii = dopuszczalna podstawa. Trzy Important to realne braki fixture (brak testu, brak rejestracji kontrolera) — to samo zastrzeżenie fixture co w przebiegu 2026-09-20.

## Artefakt (verdict.md, dosłownie)

# Verdict: CHANGES-REQUIRED

No `REVIEW.md` was available at the base (the input was only the diff and the spec); the gate still ran.

What ran: angles A and C by reading the whole of both new files. There are no removed lines, so angle B is empty. The `Done-when` commands were NOT run, because there is no repository or running app in this environment. I analysed the two commands statically, and the findings below say what each one would return. No verify pass ran.

## What the diff does NOT do that the spec requires

Reviewed against the spec's API block, P1.1, the Owns table and the `Done-when` list.

1. **The test the `Done-when` names does not exist in the diff.** The first command is `pnpm test src/orders/export.controller.spec.ts`. The diff adds only `export.controller.ts` and `export.service.ts`, and no `.spec.ts`. The command can only end in "no tests found" or "file not found". Neither is "0 failures", so the phase cannot be closed on its own gate. The spec's Owns table does not list the spec file either, so this is partly a hole in the spec. The diff still ships a controller with no test.
2. **Nothing registers `ExportController`.** `export.controller.ts` is a new file. The diff touches no `*.module.ts`, and a Nest controller that is not in some module's `controllers` array is never routed. The second `Done-when` command (`curl .../api/orders/export` expecting `202`) would get `404`. The spec's Owns table lists no module file, so the omission is in the spec too, but P1.1 requires both endpoints to be reachable and the diff does not make them reachable.
3. **The export does not produce a CSV, and `done` is reported without any work behind it.** The spec's goal is "eksport listy zamówień do CSV", and P1.1 requires `{ state, url }` where `done` means a file is ready. See finding 3 below.

## What the diff contains that the spec does not require

Reviewed against the spec's API block and P1.1: nothing that adds a surface to maintain or secure. The `404 unknown job` response is not in the spec, but the status route needs some answer for an unknown id, so I treat it as a spec hole rather than surplus. The `'failed'` state is in the type but is never produced, which the spec's `pending|done|failed` allows.

## Findings

### Important

1. **Important / test-coverage**
   - Basis: spec `Done-when`, "pnpm test src/orders/export.controller.spec.ts -> 0 failures".
   - Observation: the patch creates only `src/orders/export.service.ts` (diff.patch:1-26) and `src/orders/export.controller.ts` (diff.patch:27-50). Neither spec nor test file exists.
   - What must change: add `export.controller.spec.ts` covering at least `GET /export` -> 202 with a `jobId`, `GET /export/status/:jobId` -> `{state,url}`, and the unknown id -> 404 case. Add the file to the spec's Owns table.

2. **Important / spec-omission**
   - Basis: spec P1.1 ("Oba endpointy z bloku yaml") and the second `Done-when` (curl -> 202).
   - Observation: `@Controller('api/orders') export class ExportController` (diff.patch:34-35) is a new class that no module lists, and the patch contains no module change.
   - Failure scenario: the app boots, `GET /api/orders/export` returns 404, and the curl `Done-when` fails.
   - What must change: register `ExportController` in the orders module (add `controllers: [ExportController]`). Add the module to Owns and to the `Done-when`, since the controller path class needs a command that proves the route is wired.

3. **Important / correctness**
   - Basis: failure scenario, plus spec P1.1 (`done` carries a `url`) and the goal "eksport ... do CSV".
   - Observation: `queueMicrotask(() => { jobs.set(jobId, { state: 'done', url: \`/files/${jobId}.csv\` }) })` (diff.patch:14-16). The function is called `doWork` and nothing reads orders or writes a file.
   - Failure scenario A: a client calls `/export`, then polls `/export/status/<id>`, gets `done` with `/files/<id>.csv`, and downloads it. No such file exists and no route serves `/files/...`, so the user gets 404 on a job reported as done.
   - Failure scenario B: the microtask runs right after the handler returns, before any later request can arrive. `pending` is therefore never observable, and `failed` is unreachable.
   - What must change: either generate the CSV from the orders and set `done` only once the file exists (set `failed` on error), or have the spec explicitly state that P1 is a contract stub and name the phase that fills it in. As written, the diff reports success that did not happen.

### Nit

4. **Nit / correctness**
   - Basis: failure scenario.
   - Observation: `const jobs = new Map<...>()` (diff.patch:8), with `jobs.set` on every call (diff.patch:13).
   - Failure scenario: nothing ever evicts an entry, so repeated `GET /export` calls grow the map without bound, and jobs are lost on restart or when there is more than one instance.
   - Suggestion: add a TTL or a cap, or note in the spec that this is deliberately in-memory and temporary.

### Pre-existing

None identified (no base access).

## Summary

CHANGES-REQUIRED. Three Important findings: the test named in `Done-when` is missing, the controller is not wired into a module so both `Done-when` commands would fail, and the job reports `done` with a download URL for a file nobody produces. The route shapes, the 202 status code and the `{state,url}` payload do match the spec's API block, and the out-of-scope POST was correctly not added.
