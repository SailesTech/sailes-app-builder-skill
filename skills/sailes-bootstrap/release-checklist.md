# Release Checklist — ship is a phase, not an afterthought

The pipeline used to end at "implemented"; a B2B client experiences quality at **release and
after** — this checklist is the gate between green tests and production. Same profile logic as
`security-checklist.md`: for a **prototype** you may warn; for a **production client app** it is
**required**. The human approves the prod step (unchanged hard rule: no automatic prod deploys) —
but what they approve is a **completed checklist, not a vibe**.

Generated into new repos as `.ai/checklists/deployment.md`'s backbone (idempotent — if the repo
already has a deployment checklist, merge additively). `sailes-implement` runs this at the end of
any deploying spec. Two blocks of `repo-done-checklist.md` are pulled in here: the **Environment
block** at **every** release (§1.1 — clean-clone boot, fixture users, fast verdict, complete
`.env.example`) and the **Operations block** at the first production launch (error tracking
alerting a human, /health, backup with a tested restore, uptime check, runbook).

## 1 · Environment parity (before anything ships)

```text
[ ] staging exists and runs the SAME migrations + seeds as the release candidate
[ ] config/secret diff staging↔prod reviewed by NAME (variable names, not values —
    every var the app reads exists in prod; .env.example is the authoritative list)
[ ] third-party callbacks (webhooks, OAuth redirect URIs) registered for the prod URLs
```

### 1.1 · The Environment block is RUN here, not only at bootstrap

Walk the **Environment block** in `repo-done-checklist.md` — the four rows with outputs pasted:
one-command boot from a **clean clone**, fixture users per RBAC role, the fast-verdict command,
and a complete `.env.example`. It is scoped there to bootstrap completion; that scoping is the
defect this row closes.

**A repo that booted in March does not have to boot in July.** Measured 2026-07-30: `qa` stood the
stack up from a clean clone and hit five consecutive blockers — two env vars the code required and
the template did not carry, an object-store credential mismatch between the template and
`docker-compose.yml`, no automatic bucket creation, and a host trap. The hard rule *a feature you
cannot run locally is not done* had therefore been broken **at the level of the whole repository,
for weeks** — and **no agent could report it**, because nobody had stood the stack up from zero
since bootstrap. Nothing about that is caught by a presence check, by a green suite, or by a
staging environment that has been running continuously since it was first provisioned.

Four of those five blockers needed an edit to a `.env*` file, which agents are denied by hook and
by rule — correctly. So the finding shape is fixed: report it, with the exact lines to paste, and
route it to the human (`repo-done-checklist.md`, Environment block). An agent that hits this has a
prohibition and needs a path; leaving it with only the prohibition is what produced weeks of silence.

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

## 3.5 · Documentation current (the docs-delta gate already ran — verify, don't redo)

```text
[ ] delta receipt for this spec exists in .ai/docs-deltas/ (empty delta counts — it is the
    positive assertion "no architecture change"; see sailes-docs delta-at-gate)
[ ] docs/architecture/client-package/ regenerated at this closure (overwritten, not accumulated)
[ ] PROJECT HANDOVER ONLY: share-card PNG exported from the viewer (a CLI cannot do this —
    it is an in-viewer export) and the client package delivered to the client
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
- **A release whose Environment block was not RUN is not approved** (§1.1). Presence was checked at
  bootstrap; this gate checks that it still boots. The framework has named this defect since 1.16.2
  — *"presence-only checklist passed a repo that cannot boot"* — and scoping the block to bootstrap
  is what let it keep happening.
- **A "successful" deploy without pasted smoke output is not done** — behavior before diff
  applies to releases too.
