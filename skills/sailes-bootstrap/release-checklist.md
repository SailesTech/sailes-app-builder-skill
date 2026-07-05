# Release Checklist — ship is a phase, not an afterthought

The pipeline used to end at "implemented"; a B2B client experiences quality at **release and
after** — this checklist is the gate between green tests and production. Same profile logic as
`security-checklist.md`: for a **prototype** you may warn; for a **production client app** it is
**required**. The human approves the prod step (unchanged hard rule: no automatic prod deploys) —
but what they approve is a **completed checklist, not a vibe**.

Generated into new repos as `.ai/checklists/deployment.md`'s backbone (idempotent — if the repo
already has a deployment checklist, merge additively). `sailes-implement` runs this at the end of
any deploying spec; the first production launch also requires the **Operations block** in
`repo-done-checklist.md` (error tracking alerting a human, /health, backup with a tested restore,
uptime check, runbook).

## 1 · Environment parity (before anything ships)

```text
[ ] staging exists and runs the SAME migrations + seeds as the release candidate
[ ] config/secret diff staging↔prod reviewed by NAME (variable names, not values —
    every var the app reads exists in prod; .env.example is the authoritative list)
[ ] third-party callbacks (webhooks, OAuth redirect URIs) registered for the prod URLs
```

## 2 · Migration ordering vs deploy (extends sailes-database's safety rules to the timeline)

```text
[ ] every migration in this release classified: expand (safe before deploy) vs contract
    (only AFTER the code that stops using the old shape is fully rolled out)
[ ] the release plan states the exact order: which migration runs before/after which deploy
[ ] no migration in this release edits one that may already be applied (new migration only)
[ ] prod migration command is written down verbatim (and requires human approval to run)
```

## 3 · Post-deploy smoke (scripted, output pasted)

A minimal scripted proof on prod, run immediately after deploy — not "it looks up":

```text
[ ] /health returns 200 (app + DB + worker/queue all green)
[ ] login works (fixture-safe account or a designated smoke account)
[ ] one critical READ returns real data (e.g. list the main entity)
[ ] one critical WRITE round-trips on fixture-safe data (create → verify → clean up)
[ ] output of the smoke script pasted into the run log
```

## 4 · Rollback plan (written BEFORE the deploy, not during the incident)

One paragraph answering, concretely:

```text
[ ] "the deploy is bad — what exactly do we run/click to go back?" (platform rollback command /
    previous image / revert PR — named, not implied)
[ ] does the rollback survive the migration that shipped? (expand-phase migrations: yes by
    design; if a contract migration shipped, the rollback path MUST be stated or the contract
    step deferred to a later release)
[ ] who executes it and where it's documented (.ai/runbook.md)
```

## Hard lines

- **No automatic prod deploys; no prod migration without approval** (unchanged from the security
  checklist — this checklist structures the approval, it never replaces it).
- **A deploy without a pre-written rollback plan is not approved.**
- **A "successful" deploy without pasted smoke output is not done** — behavior before diff
  applies to releases too.
