# Eval run — auth spec generates the authz matrix

**Date:** 2026-07-26 · **Run:** 2026-07-26-rerun · **Mode:** planning/authoring dry-run (no project code written, nothing executed, no other repo file touched)

**Brief under test.** Live product, roles today `admin` / `rep` / `viewer`. Change: add a `manager` role granted `offers.send` and `reports.view`; `admin` keeps everything; `rep` **loses** `offers.send`.

**Method.** `skills/sailes-spec/SKILL.md` (Required sections → Security) + `skills/sailes-bootstrap/spec-writing-template.md` (same Security clause, generated local form) + `skills/sailes-bootstrap/security-checklist.md` (Auth & access, Tenancy, Hard agent rules). Part 2 answers as `skills/sailes-implement/SKILL.md` step 3 + its phase gate, with the authoring protocol from `skills/sailes-test/SKILL.md`.

Both spec sources carry the identical binding sentence, so this is the clause being satisfied:

> **A spec touching auth/roles declares the permission matrix** — a table of actions × roles → allow/deny — which implementation turns into the generated authz matrix test suite (every action × role asserted, plus the anonymous row).

---

# PART 1 — The Security section, as the template calls for it

> *(This is the `## Security` section as it would appear in `.ai/specs/2026-07-26-add-manager-role.md`, `Status: draft`.)*

## Security

### S0. Change class and posture

This change **removes** a permission from a role that holds it in production. That makes it a revocation, not an additive feature, and revocations are the failure mode this section is written around: additive grants fail visibly (someone can't do a thing), revocations fail invisibly (someone can still do a thing they no longer should). Every control below that says "at request time" exists because of that asymmetry.

Posture: **fail-closed**. Unknown role → deny. Unknown permission string → deny. Matrix cell absent → deny *and* fail the build (see S3). No code path resolves an authorization decision by defaulting to allow, and no role is defined by inheriting another role's set.

### S1. Permission matrix (the declared source of truth)

Roles: `admin`, `manager` (new), `rep`, `viewer`. Anonymous is not a role — it is the unauthenticated row, and it is part of the matrix.

Legend: **A** = allow · **D** = deny · **Δ** = cell changed by this spec · **ᶜ** = *carried* from the current production permission map, transcribed here, **verified against `packages/contracts/src/auth/permissions.ts` + the live role seed as a Done-when before approval** — a carried cell is a transcription, never an assumption.

| # | Action (permission) | Enforcement point | admin | manager | rep | viewer | anonymous |
|---|---|---|---|---|---|---|---|
| 1 | `deals.view` | `GET /api/deals`, `GET /api/deals/:id` | Aᶜ | **D** Δ *(Q1)* | Aᶜ | Aᶜ | D |
| 2 | `deals.edit` | `PATCH /api/deals/:id` | Aᶜ | **D** Δ *(Q1)* | Aᶜ | Dᶜ | D |
| 3 | `offers.view` | `GET /api/offers`, `GET /api/offers/:id` | Aᶜ | **D** Δ *(Q1)* | Aᶜ | Aᶜ | D |
| 4 | **`offers.send`** | `POST /api/offers/:id/send` + the `offer.send` worker job | Aᶜ | **A** Δ | **D** Δ *(was A)* | Dᶜ | D |
| 5 | `files.download` | `POST /api/files/:id/signed-url` | Aᶜ | **D** Δ *(Q1)* | Aᶜ | Aᶜ | D |
| 6 | **`reports.view`** | `GET /api/reports`, `GET /api/reports/:id` | Aᶜ | **A** Δ | Dᶜ | Dᶜ | D |
| 7 | `settings.manage` | `PATCH /api/settings` | Aᶜ | **D** | Dᶜ | Dᶜ | D |
| 8 | `users.manage` (incl. **role assignment**) | `POST/PATCH /api/users`, `PATCH /api/users/:id/role` | Aᶜ | **D** | Dᶜ | Dᶜ | D |
| 9 | `integrations.manage` | `PATCH /api/integrations/:id` | Aᶜ | **D** | Dᶜ | Dᶜ | D |

**Two decisions embedded in this table, stated so they are reviewable rather than inferred:**

1. **`manager` is not "rep plus two".** A new role starts empty and receives exactly what the brief grants: `{offers.send, reports.view}`. Defining it by inheritance would silently hand a manager every carried `rep` grant — including `deals.edit` and `files.download` — none of which the brief authorizes. The cost is that rows 1/2/3/5 are almost certainly wrong *as product* (a manager who can send an offer but cannot open one is not a working role) — which is exactly why it is **Q1** below and not a guess. Until Q1 is answered those cells **ship as deny**: a wrong deny is a support ticket, a wrong allow is an incident.
2. **`users.manage` stays admin-only.** Row 8 is the escalation row. If `manager` could touch role assignment, the entire matrix becomes advisory — a manager grants themselves `admin`, or re-grants `rep` the `offers.send` this spec just removed, and the revocation is undone from inside the product. Row 8 denies for every non-admin role, and S7 asserts it separately from the generated sweep because it is the one cell whose failure invalidates all the others.

**Q1 (Open Question — gates approval, per `sailes-spec` §3).** Which of `deals.view`, `deals.edit`, `offers.view`, `files.download` does `manager` get? Options: **(a)** read-only context — `deals.view` + `offers.view` + `files.download`, no `deals.edit` ✅ makes the role usable, ⚠️ managers can pull every customer file; **(b)** exactly the brief — the two permissions only ✅ minimum blast radius, ⚠️ the role probably cannot do its job and someone will "temporarily" hand managers `admin`, which is worse than (a); **(c)** rep-equivalent plus reports ✅ zero friction, ⚠️ re-grants `deals.edit` to a supervisory role and makes `manager` a superset of the role we just narrowed. **Recommendation: (a).** The table above encodes **(b)** as the fail-closed default because an unanswered cell must ship denying, not guessing.

**Completeness rule (the anti-rot clause).** This table is the source; `packages/contracts/src/auth/permissions.ts` is its executable form; the generated suite is its proof. Any permission constant that exists in code but has no row here, any role in `roleSchema` with no column, and any non-public route that guards on a permission not listed here → **build failure**, not a warning. This is what stops the matrix from being accurate on the day it is written and fiction six weeks later.

### S2. Auth + permission checks

- Every route in the table is non-public; unauthenticated → `401` (API) / redirect to login (UI). No route in this change is exempt. *(checklist: `auth required by default`)*
- The check runs **server-side in the service layer**, above the data access, on every request — not in middleware alone and never only in the UI. Hiding the Send button is a UX change; it is not a permission change, and the API must deny identically with the button hidden, removed, or bypassed. *(checklist: `permission checks by default`)*
- **Permissions are resolved per request from the role, not read from the session token.** This is the load-bearing control of the whole change. If effective permissions are baked into a JWT/session claim at login, then on deploy day every logged-in `rep` keeps `offers.send` until their token expires — the revocation appears shipped and is not. Required: either (i) the resolver reads role → permissions server-side on each request, or (ii) all sessions for affected users are invalidated at migration time. Option (i) is the design here; (ii) is the fallback if any cached-claim path is discovered during implementation, and discovering one is a **stop-and-re-gate** event, not a patch.
- **The `offer.send` worker job re-authorizes at execution time**, against the sender's *current* role. A send queued by a `rep` before the cutover and executed after it must not go out. Async work that trusts an authorization decision made minutes ago is how a revoked permission still produces a customer-visible outbound write.
- Deny responses: `403` where the caller is permitted to know the resource exists (a `rep` denied `offers.send` on an offer they can already read), `404` where knowing it exists is itself a leak. No message names the missing permission, the role model, or an internal identifier. *(checklist: `safe error messages`, `no sensitive data in logs`)*

### S3. Zod validation / contract artifact

Contract artifact this spec creates and freezes — **`packages/contracts/src/auth/permissions.ts`**, imported by API, worker and UI (no slice re-declares roles):

- `roleSchema = z.enum(['admin','manager','rep','viewer'])` — `manager` added here first; every role-bearing boundary (role assignment payload, seed, session hydration, admin UI form) parses through it. An unrecognized role string is a `400` at the boundary and a **deny** at the resolver — never a `500`, never a fallthrough to allow.
- `permissionSchema` — the enum of the nine actions in S1.
- `PERMISSION_MATRIX: Record<Role, ReadonlySet<Permission>>` — the S1 table, typed so that adding a member to either enum without adding its entry fails typecheck.
- No `any` on any auth path; the resolver's return type is a discriminated allow/deny, not a boolean that can be truthily misread. *(checklist: `input validation with Zod at every boundary`)*

### S4. Data / migration

- Migration adds the `manager` role and rewrites grants: `+manager:{offers.send, reports.view}`, `−rep:offers.send`. Reviewed and committed; **no unreviewed prod schema change, no prod migration without approval**. *(checklist: `migrations reviewed`, `production deploy protected`, `never run production migrations without approval`)*
- **No user is auto-promoted.** The migration creates the role; it assigns it to nobody. Backfilling "the reps who are really managers" is a data decision the customer owns, done afterwards through the audited `users.manage` path, one user at a time. A migration that guesses who is a manager silently grants `offers.send` back to people we just took it from.
- Down-migration restores `rep:offers.send` exactly and drops the `manager` role, with no collateral change to any other cell — and is exercised, not just written. Rollback is part of the release gate, not a comment.

### S5. Audit log

- Role creation, role assignment, and permission-map change → audit entry: actor, target user, before-set, after-set, timestamp, request ID. These are the critical actions of this change. *(checklist: `audit log for critical actions`)*
- Every **denied** `offers.send` attempt → audit entry (actor, offer ID, decision). Post-cutover this is the signal that tells us whether the revocation landed and who it affected; without it the only detection channel is a customer complaint.
- `files.download` keeps its existing access log; the `manager` column adds no new file path. *(checklist: `file access log`, `signed URLs; access control BEFORE generating any URL` — the permission check precedes URL generation, unchanged)*
- No role/permission log line carries names, emails or offer contents. *(checklist: `no sensitive data in logs`)*

### S6. Tenancy

Assumed **single-tenant** per the locked stack default. *(checklist: `single-tenant: confirmed only one firm will ever use it`)* — recorded as an assumption to confirm at approval, not a finding. If the product is in fact multi-tenant, this section grows before implementation starts: `organizationId` in the permission scope, every scoped query filtered, and the cross-org denial matrix from the Tenancy block becomes part of the generated suite (a `manager` of org A requesting org B's report → deny/404). That is a spec re-gate, not an implementation detail.

### S7. Escalation controls (asserted separately)

Three properties that the row-by-row sweep can pass while the system is still broken, so they are called out and tested on their own:

1. `manager` cannot assign or change any role (row 8).
2. `manager` cannot edit the permission map / settings (rows 7, 9) — i.e. cannot grant itself anything.
3. `rep` cannot self-assign `manager`, and therefore cannot recover `offers.send` by any in-product path.

### S8. Security-checklist items — applicability

**Apply (must be satisfied by this change):** `auth required by default` · `permission checks by default` · `input validation with Zod at every boundary` · `audit log for critical actions` · `file access log` · `signed URLs; access control BEFORE generating any URL` · `no sensitive data in logs` · `safe error messages` · `migrations reviewed` · `production deploy protected` · `RBAC + permission checks; permission map` · **`the permission map is PROVEN by the generated authz-matrix test suite`** · `single-tenant: confirmed` · hard rules `never change auth/security without this checklist`, `never log sensitive data`, `never run production migrations without approval`.

**Not applicable, with reason:** signed webhook/API secrets, idempotency keys on integration intake, webhook intake/retry/dead-letter — no integration surface changes (the `offer.send` job's outbound behavior is unchanged; only its authorization is). Rate limiting — existing limits on the affected routes are unchanged and inherited; this change adds no new public endpoint. Google-login/Gmail rules — no auth-provider change. Encryption at rest / R2 object-lock — no new data class.

---

# PART 2 — Running `sailes-implement` on that spec: what tests get generated

`sailes-implement` §3 makes this non-optional for this spec:

> **Auth/roles-touching phases: generate the authz-matrix suite from the spec's permission matrix** — every action × role → asserted allow/deny + the anonymous row … The matrix table in the spec is the source; the tests are its executable form.

and its Red Flags list the omission explicitly: *"The spec touches auth/roles and no authz-matrix tests were generated from its permission matrix."*

## 2a. The generated sweep — 45 cases, derived mechanically from S1

`apps/api/src/auth/__tests__/authz-matrix.generated.test.ts` — data-driven over `PERMISSION_MATRIX` imported from the contract artifact. Not hand-written: 9 actions × 4 roles = **36 cells**, plus the **9-case anonymous row** = **45**. Each case authenticates as the role, calls the real enforcement point from S1, and asserts the status *and* the resulting state (an allow that returns 200 but writes nothing is a fail).

Naming — `AZ-<action>×<role>`:

- `AZ-offers.send×manager — POST /api/offers/:id/send as manager → 202 + offer.status=sent` **(the new grant)**
- `AZ-offers.send×rep — POST /api/offers/:id/send as rep → 403 + offer.status unchanged + no outbound send` **(the revocation — the single most important assertion in this change)**
- `AZ-offers.send×admin → 202` · `AZ-offers.send×viewer → 403`
- `AZ-reports.view×manager — GET /api/reports → 200` **(the new grant)** · `AZ-reports.view×rep → 403` · `AZ-reports.view×viewer → 403` · `AZ-reports.view×admin → 200`
- `AZ-deals.view×{admin,manager,rep,viewer}`, `AZ-deals.edit×{…}`, `AZ-offers.view×{…}`, `AZ-files.download×{…}`, `AZ-settings.manage×{…}`, `AZ-users.manage×{…}`, `AZ-integrations.manage×{…}` — every remaining cell, including all nine `admin → allow` cells (admin "keeps everything" is a claim, so it is asserted, not trusted)
- `AZ-<action>×anonymous — unauthenticated → 401, never 200` × 9

## 2b. The structural tests — what keeps the matrix honest

`apps/api/src/auth/__tests__/authz-matrix.completeness.test.ts`:

- **`B1 — every permission constant has a matrix row`** — `permissionSchema.options` ⊆ matrix keys. Adding a permission without deciding its four cells fails the build.
- **`B2 — every role has a full column`** — `roleSchema.options` × all actions is fully populated; no `undefined` cell resolvable at runtime.
- **`B3 — every registered non-public route guards on a permission present in the matrix`** — walks the route table. This is the one that catches the future endpoint shipped with no check at all, which the row sweep structurally cannot see.
- **`B4 — the matrix is exhaustively swept`** — the generated suite's case count equals `roles × actions + actions`; a cell cannot be quietly skipped.

## 2c. The behavior tests derived from S2–S7

`apps/api/src/auth/__tests__/manager-role.test.ts`, `.../migration.test.ts`, `apps/worker/src/jobs/__tests__/offer-send.authz.test.ts`:

- **`B5 — revocation is effective on an existing session`** — session minted while `rep` held `offers.send`; grant removed; the same session → `403` with no re-login. (S2, the cached-claim failure.)
- **`B6 — rep loses only offers.send`** — `rep`'s effective set post-migration == pre-migration set minus `offers.send`; no collateral revocation.
- **`B7 — manager is not rep-plus-two`** — `manager`'s effective set == exactly the S1 declaration; asserted as set equality, so an inheritance regression fails.
- **`B8 — no auto-promotion`** — after migration, count of users holding `manager` == 0.
- **`B9 — manager cannot assign roles`** — `PATCH /api/users/:id/role` as manager → `403` + role unchanged in DB. (S7.1)
- **`B10 — manager cannot grant itself a permission`** — settings/permission-map write as manager → `403`. (S7.2)
- **`B11 — rep cannot self-assign manager`** → `403`. (S7.3)
- **`B12 — unknown role string fails closed`** — `roleSchema` rejects at the boundary (`400`, not `500`) **and** the resolver returns deny for an unmapped role rather than throwing or allowing.
- **`B13 — in-flight send job re-authorizes`** — `offer.send` enqueued by a rep pre-cutover, executed post-cutover → not sent, dead-lettered, audit row written. (S2, async path.)
- **`B14 — role change writes an audit entry`** — actor, target, before-set, after-set present; **`B15 — denied offers.send is audited`**; **`B16 — no audit line contains email/name/offer body`**.
- **`B17 — deny messages leak nothing`** — the 403 body names no permission, role or internal ID; the 404-vs-403 split follows S2.
- **`B18 — down-migration restores rep:offers.send exactly`**, and the generated sweep is re-run under the rolled-back state and passes the *old* matrix.

## 2d. UI (Playwright, per `sailes-test` "anything a user can see is proven through a browser")

- **`B19 — rep sees no Send control`** on the offer detail screen.
- **`B20 — hiding the control is not the authorization`** — with the control hidden, the underlying request issued directly still returns `403` and the offer's state is unchanged. Asserted on resulting state, never on a toast.
- **`B21 — manager sees Reports and the report renders`**; **`B22 — manager sees no Users/Settings nav`**.

## 2e. Detection proof, tier, and gate

- **Tier A** — `sailes-test` computes the tier from triggers, not judgment, and *auth / permissions / tenancy* is a tier-A trigger. Proof required: **Stryker on the touched files** — the permission resolver, `permissions.ts`, the route guards, the `offer.send` job authorization — with **every surviving mutant killed or explained in writing**. Tier B (per-ID break → red → revert → green) is explicitly insufficient here and running it would be a `sailes-test` Red Flag.
- **Authoring order is not negotiable.** The dev's RED test in `sailes-implement` step 1 is *scaffolding* for the step. The graded suite is authored by `tester` **from this spec with the implementation unread**, the human freezes the case list to `.ai/test-plans/2026-07-26-add-manager-role.md` (`FROZEN`, hard block), only then is the suite written; `tester` may then read the diff and **add** cases only. `checker` reviews the diff including tests and confirms every frozen ID (`AZ-*`, `B1`–`B22`) has a covering test; `qa` runs it against the live app as the gate verdict and drives the real flow (log in as a rep, try to send, observe the denial).
- **`Done-when` for the security phase** (binary, per `sailes-spec` §6): `pnpm vitest run apps/api/src/auth apps/worker/src/jobs → 45 authz cells + 22 behavior IDs, 0 failures` · `pnpm playwright test e2e/roles → 0 failures` · `pnpm stryker run --mutate 'apps/api/src/auth/**' → 0 unexplained surviving mutants` · migration applied to a scratch DB, then rolled back, sweep green under both.

## 2f. The one-line version

The Security section's matrix is not documentation — it is the **input file** for the suite. Nine actions × four roles plus the anonymous row is 45 machine-generated assertions the moment the table exists; the 22 authored behaviors cover what a table cannot express (revocation timing, async re-authorization, escalation, migration, rollback, leakage); and the completeness tests make the table fail the build when it stops matching the code. That is the checklist's claim made literal: *"every permission in the app has a test asserting it."*

---

## Run notes / limits

- **Established:** the Security section as both spec sources specify it (auth+permission checks, Zod/contract artifact, audit, file access control, checklist-item marking, declared permission matrix), and the concrete, named test set implementation generates from it, with tier and gate.
- **Assumed and flagged rather than invented:** the full nine-action permission list is modeled on the `security-checklist.md` example map (`deals.view, offers.send, files.download, settings.manage, integrations.manage, reports.view`) plus the minimum needed to make the brief coherent; every non-brief cell is marked **ᶜ** and carries a verify-before-approval obligation. Single-tenancy is the locked-stack default, recorded as an assumption to confirm. Stack/paths (Vitest, Playwright, Stryker, `packages/contracts/...`) follow the baseline in `sailes-spec` §Stack conventions.
- **Deliberately left open:** Q1 (manager's read scope) — per the `sailes-spec` Open Questions hard gate this is the user's decision, and the matrix ships it fail-closed rather than guessing it.
- **Not done, by instruction:** no project code, no commands run, no file touched outside this one; nothing under `evals/` was read.
