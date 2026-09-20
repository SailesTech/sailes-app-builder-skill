# checker review — spec: eksport listy zamówień do CSV (P1)

**Verdict: CHANGES-REQUIRED**

## Verification surface not run — say so, don't fake it

I received only `spec.md` and `diff.patch`, no live checkout. I did not run
`pnpm test src/orders/export.controller.spec.ts` or the `curl` probe, and I am not
pasting results for either — there is no working tree to run them against. This is
not a formality: per my own checklist, Done-when commands are "your whole
verification surface," so their absence here is itself a gap in this review, not
just a note. What follows is static review of the diff against the spec only. Two
of the findings below (missing spec file, no module wiring) are things a Done-when
run would have caught mechanically and immediately; I'm flagging them by inspection
instead because that's what's available, but they still need an actual Done-when
run before this can move past CHANGES-REQUIRED.

## What the diff does NOT do that the spec requires

1. **The Done-when test file does not exist.** Done-when names
   `pnpm test src/orders/export.controller.spec.ts` → 0 failures. The diff creates
   no such file — no `export.controller.spec.ts` anywhere in the patch. As written,
   that command cannot pass; it fails at "file not found" / "no tests matched,"
   not at 0 failures. This is the plainest defect: a named Done-when command has
   nothing behind it. Blocks P1.1.

2. **The controller is never wired into a module.** The diff adds
   `src/orders/export.controller.ts` and `src/orders/export.service.ts` only.
   No module file (e.g. an orders module, `app.module.ts`) is touched to add
   `ExportController` to a `controllers: [...]` array. Nest does not auto-discover
   controllers by file location — without registration, `GET /api/orders/export`
   is not mounted, and the curl Done-when (`→ 202`) would return 404. I can't
   confirm this against the live app module (out of scope for this review per the
   files I was given), so flag it as the second thing an actual Done-when run
   would settle in one command — but on the evidence in the diff, nothing wires
   the route in.

3. **The service path class has no Done-when command of its own.** Owns lists two
   files, `export.controller.ts` and `export.service.ts`, both "wymuszone przez"
   P1.1. Done-when has one test path (`export.controller.spec.ts`) and one HTTP
   probe — both controller-shaped. There is no named, targeted command that
   exercises `export.service.ts` directly (job-state transitions, `readJob` on an
   unknown id, etc.). If the intent is that the controller spec covers the service
   through the controller, that's a defensible design, but the spec doesn't say so
   and no such spec file exists to check. As it stands this is a hole in Done-when
   coverage for one of the two owned files, per the same rule that flags a
   file-list class with no targeted command.

4. **`state: 'failed'` is declared but unreachable.** The spec's contract for
   `GET /export/status/:jobId` is `state` ∈ `pending|done|failed`. `doWork()` in
   the service only ever transitions `pending → done` via a `queueMicrotask`;
   nothing in the diff ever produces `failed`. Given the phase's stated weight
   ("contract fix — jedna ścieżka API, żaden model danych się nie rusza"), a stub
   job runner may be intentional, but the spec states `failed` as part of the
   contract's observable surface and nothing in the diff or spec marks it
   deferred. Worth a one-line spec note or a reachable failure path; as-is it's a
   contract clause with no code behind it.

## What the diff contains that the spec does not require

1. **404 on unknown `jobId`.** `status()` returns `404 { message: 'unknown job' }`
   when `readJob` finds nothing. The spec's P1.1 only defines the success shape
   (`{ state, url }`); it says nothing about the unknown-job case. Reasonable and
   probably necessary, but it's an unrequested response shape someone now has to
   keep in sync with the contract. **NITS** — flag it in the spec rather than
   leave it undocumented, since it's the only defined behavior for an entire input
   class (bad `jobId`).

2. **In-memory `Map` as the job store.** `jobs` is a module-level `Map`, so job
   state does not survive a restart and would not be shared across more than one
   server instance. Nothing in the spec asks for persistence — the weight line
   says the data model isn't moving — so this isn't a defect against P1, but it's
   a surplus design choice (a real job store vs. a stub) with a real operational
   consequence in the async case the spec already anticipates (`pending` state
   over a `curl` probe would racily read `done` given the `queueMicrotask`
   turnaround). **NITS**, not blocking for a phase explicitly scoped as
   "contract fix."

3. **Naming: `doWork` / `readJob`.** Neither name carries the domain (`orders`,
   `export`). `doWork` in particular reads as a placeholder rather than a function
   that starts an export job — the kind of name a reviewer should not have to
   guess the intent of. **NITS** — rename before this lands, cheap to fix, no
   spec clause forces the current names.

## Scope / file-list check

Diff touches exactly the two files the Owns table lists
(`src/orders/export.controller.ts`, `src/orders/export.service.ts`), both under
P1.1 — no scope creep there. No `POST /api/orders/export` was added, consistent
with the spec's explicit out-of-scope line. Contract-probe and deployed-probe are
both `n/a` in the spec and there's nothing in the diff that contradicts that.

## Why CHANGES-REQUIRED

Item 1 alone (the named Done-when test file does not exist) is sufficient:
a red/missing Done-when command is CHANGES-REQUIRED by rule unless proven
pre-existing red at the phase's base, and there is no base to check here — the
file was never created, on either side. Item 2 (no module registration) would
independently fail the curl Done-when if confirmed against the live module graph.
Fix both, add a targeted command or file for the service (item 3), and this comes
back for a real Done-when run before it can move off CHANGES-REQUIRED.
