# Checker verdict — eksport listy zamówień do CSV (P1)

**Reviewed:** `diff.patch` against `spec.md`, clean context — no maker report, no reasoning was requested or used.

**Verdict: CHANGES-REQUIRED**

## Limitation on this run (state up front, not buried)

`checker` is instructed to run the phase's named `Done-when` commands and paste the results. This
run was scoped to exactly two files — `spec.md` and `diff.patch` — with no repository checkout, no
`pnpm`/`node`, and no running server available to hit with `curl`. Both `Done-when` commands are
therefore **not executed**, and this verdict is reached by static inspection of the diff's content
against the spec's text instead. That is a real gap in verification strength, not a formality: it is
exactly the gap `Done-when` exists to close. It does not change the verdict below, because both
`Done-when` commands are unrunnable as authored regardless of environment — see Finding 1.

## What the diff does NOT do that the spec requires

Reviewed against: the API surface block, the P1.1 clause, the `Done-when` list, and the P1 file
("Owns") list.

1. **No test file exists for the required `Done-when` command.** `Done-when` names
   `pnpm test src/orders/export.controller.spec.ts → 0 failures` as the P1 verification command. The
   diff adds exactly two files — `src/orders/export.service.ts` and `src/orders/export.controller.ts`
   — and no test file anywhere. As authored, that `Done-when` command cannot produce "0 failures";
   there is nothing for `pnpm test` to run against that path. This is the diff's clearest failure to
   do what the spec requires: the spec's own acceptance gate for this phase is unsatisfiable with the
   files given.

2. **`ExportController` is not registered in any NestJS module in this diff.** The API surface block
   requires `GET /api/orders/export` and `GET /api/orders/export/status/:jobId` to exist as reachable
   routes, and the second `Done-when` command (`curl ... localhost:3000/api/orders/export → 202`)
   depends on that reachability. NestJS does not wire a `@Controller()` into the app by convention —
   it has to appear in some `@Module({ controllers: [...] })`. The diff touches only the controller
   and service files; no `*.module.ts` change is included, and nothing in the two files shown confirms
   an existing module already imports `ExportController`. If none does, the curl `Done-when` check
   returns a 404 (or connection refused, depending on app-level routing), not `202`. I cannot rule
   out that some pre-existing module already registers this controller by a path convention this
   diff doesn't need to touch — the diff alone doesn't show it either way — but as the evidence
   stands, "the endpoint is reachable" is asserted by the spec and unconfirmed by the diff.

## What the diff contains that the spec does NOT require

Reviewed against: the same surface.

3. **`state: 'failed'` is declared but unreachable.** P1.1 requires the status response's `state` to
   be `pending|done|failed`. `export.service.ts`'s `JobState` type includes `'failed'`, but the only
   state transition in the file is the unconditional `queueMicrotask` that sets `state: 'done'` — no
   branch, catch, or condition anywhere can ever produce `'failed'`. This isn't extra scope in the
   usual sense (the value is required by the contract's type), but it is a value the implementation
   asserts it can return and never will — a dead branch in a contract, not in ordinary code. Given the
   spec's own `Weight` note ("contract fix — jedna ścieżka API, żaden model danych się nie rusza"),
   this may be deliberately out of scope for P1 (no real export work exists yet to fail), in which case
   the spec should say so; as written it just looks unfinished. **NITS**, not blocking, but it should
   be closed one way or the other rather than left implicit — either add the failure path or note in
   the spec that P1 deliberately stubs `'failed'` as unreachable.

4. **404-for-unknown-`jobId` has no clause behind it.** `status()` returns `404 { message: 'unknown
   job' }` when `readJob` finds nothing. Reasonable, but the spec's P1.1 text only describes the
   success shape (`{ state, url }`); nothing in `spec.md` specifies behavior for an unrecognized
   `jobId`, and — per Finding 1 — nothing tests it either. **NITS**: a sensible default, not a defect,
   but it is surplus relative to the spec's stated surface and should be named rather than silently
   assumed, per the same rule that names unspecified scope elsewhere.

## Other notes (spend-capacity-on-what-machines-can't-see territory, non-blocking)

- **Naming:** `doWork()` in `export.service.ts` tells the reader nothing; its own leading comment
  ("Starts the export job and returns its id.") is doing the job the function name should. Trivial to
  fix, worth fixing before this ships as the shape other phases build on.
- **Unbounded `Map`:** the in-memory `jobs` map never evicts entries. Consistent with the spec's
  "contract fix, no data model" framing for P1, so not a defect here, but worth a one-line spec note
  for whichever later phase is expected to own job cleanup/persistence — otherwise it's silently
  nobody's job.
- **Raw Express `@Res()`:** both handlers bypass Nest's normal return-value response pipeline in favor
  of `@Res() res: Response`. Works, matches the required status codes and bodies, but it's an
  unforced stylistic choice with no spec clause driving it (loses Nest's built-in interceptor/
  exception-filter handling for this controller). Not blocking; flagging as a design-intent question
  for whoever owns the stack convention here.

## Summary

Two concrete, spec-grounded reasons this cannot pass as-is:

- **Finding 1** — the required `Done-when` test file (`src/orders/export.controller.spec.ts`) does
  not exist in the diff, so the named acceptance command cannot run, let alone pass.
- **Finding 2** — no module registration is present in the diff to make the two required routes
  reachable, which the second `Done-when` command (the `curl` 202 check) depends on.

Fix: add the missing test file covering both endpoints (success 202+jobId, status
pending/done/`404` unknown-job at minimum), and add or confirm the `@Module` wiring that makes
`ExportController` reachable at `/api/orders/export*`. Once both `Done-when` commands can actually be
run and shown green, this is close to APPROVE — the endpoint shapes, status codes, and out-of-scope
boundary (no `POST`) all match the spec as written.
