# Security

> Section of spec `add-manager-role`. Covers the authorization surface only; other sections
> (Data Model, Phasing, Integration Coverage) are written separately.

## Permission matrix

This is the contract. Implementation generates the authz matrix test suite directly from this
table — **every cell is one assertion**, including every `deny` and the whole anonymous row. A cell
that is not in this table is not testable, so the table must be complete before Phase 1 starts.

Actions are the full set present in the system today; no action is added or removed by this change.

| Action | `admin` | `manager` | `rep` | anonymous |
|---|---|---|---|---|
| `offers.send` | allow | **allow (new)** | **deny (revoked)** | deny |
| `offers.view` | allow | ❓ Q2 | ❓ Q1 | deny |
| `reports.view` | allow | **allow (new)** | ❓ Q1 | deny |
| `reports.export` | allow | deny | ❓ Q1 | deny |
| `users.manage` | allow | deny | ❓ Q1 | deny |
| `deals.edit` | allow | ❓ Q2 | ❓ Q1 | deny |

**`admin` keeps every action.** This is stated as a rule, not as six independent cells: the intended
invariant is "admin = all actions", so the matrix test asserts `admin` against the *enumerated action
list*, not against six hardcoded rows. Any action added later is then allow-for-admin by
construction, and a future action that must be denied to admin becomes a visible exception rather
than a silent omission.

**Everything not marked `allow` is `deny` by default.** The permission check resolves against an
explicit grant set; absence of a grant is a denial, never a fallthrough. Reason this is spelled out:
the `manager` role is being introduced with two grants out of six, so four of its cells depend on
default-deny being real rather than assumed.

**❓ cells are the Open Questions gate below.** They are not "fill in during implementation" — an
unknown cell produces either a missing test or an invented permission, and the second one ships.

## Open Questions — STOP

Q1 through Q3 must be answered before this section is final. Q1 is fact-finding (read the current
implementation); Q2–Q4 are decisions that are the human's.

**Q1 — What does `rep` hold today for the five actions other than `offers.send`?** (fact-finding)
The brief pins only that `rep` had `offers.send` and loses it. The other five cells are unknown to
this spec. They must be transcribed from the current grant definition, not guessed — a wrong `allow`
here is a permission this change silently confers, and a wrong `deny` is a regression for every
existing rep. Answer format: the five cells, read off the code.

**Q2 — Does `manager` need `offers.view` and/or `deals.edit`?**
The brief grants `offers.send` but says nothing about seeing an offer before sending it, or about the
deal an offer attaches to. A send-only permission is coherent only if the send path never reads offer
or deal data on behalf of the user.

- **A — grant `offers.view`, deny `deals.edit`** ✅ manager can review what they send; the read is
  strictly weaker than the send they already have, so it confers nothing new in practice.
  ⚠️ widens the role beyond the literal brief. *Trade-off: matches how the role will actually be used,
  at the cost of the matrix no longer being a transcription of the brief.* **← recommended**
- **B — grant neither (literal brief)** ✅ smallest possible role; exactly what was asked for.
  ⚠️ if any UI or API path in the send flow performs an `offers.view` check, managers get a 403 on the
  feature they were just granted. *Trade-off: minimal blast radius now, likely a follow-up patch after
  the first manager tries to send.*
- **C — grant `offers.view` and `deals.edit`** ✅ manager can fix a deal before sending the offer.
  ⚠️ `deals.edit` is a write on business data with no stated need. *Trade-off: fewer future requests,
  materially larger role.*

**Q3 — Is `manager` scoped to a team, or global?**
`reports.view` for a manager usually means *their team's* reports, not every report in the system. If
scoping is intended, it is a row-level concern and cannot be expressed in this matrix — it changes the
data model (a manager→team link) and every report query, not just the grant set.

- **A — global, no scoping** ✅ ships within this spec; matrix is the whole story.
  ⚠️ every manager sees every team's numbers. *Trade-off: simple and possibly wrong for the business.*
  **← recommended only if the answer to "should a manager see another team's report" is genuinely "yes"**
- **B — scoped to the manager's team** ✅ correct least-privilege.
  ⚠️ requires a manager→team relation, scoped queries, and row-level isolation tests — a materially
  larger change than a role addition. *Trade-off: correct authorization, roughly doubles the spec.*

**Q4 — How is the `rep` revocation applied to sessions that already exist?**
Only relevant if permissions are resolved from a cached claim (JWT / session payload) rather than read
per-request. See "Revoking `offers.send` from `rep`" below; the fork is stated there.

## Revoking `offers.send` from `rep` — the load-bearing half

Adding a role is additive and fails visibly. **Removing a permission from an existing, populated role
fails silently and in the user's favour** — the check keeps passing from a stale cache, and nothing
errors. This is the part of the change most likely to look done and not be.

Required, in this order:

1. **Grant resolution point.** Determine whether the permission check reads grants per-request from
   the source of truth, or from a claim minted at login. If per-request: revocation is immediate and
   Q4 is moot. If cached: Q4 must be answered, because until the cache turns over, every currently
   logged-in rep still sends offers.
   - **A — invalidate all `rep` sessions at deploy** ✅ revocation is immediate and provable.
     ⚠️ every rep is logged out mid-work. *Trade-off: correctness now, a support spike on deploy day.*
     **← recommended: the whole point of the change is that reps stop sending offers**
   - **B — let tokens expire naturally** ✅ no user disruption.
     ⚠️ a known window in which the revoked permission still works, of exactly the token TTL.
     *Trade-off: silent partial enforcement — and the acceptance test will pass while it is happening,
     because a fresh test login has the new grants.*
   - **C — move `offers.send` to a per-request DB check** ✅ no stale-grant class of bug, ever.
     ⚠️ a read on the send path and a change beyond this spec's scope. *Trade-off: fixes the category,
     not just this instance.*
2. **The deny is a positive test, not the absence of an allow test.** `rep` × `offers.send` asserts a
   403/permission error against the real endpoint. A test that merely omits the case proves nothing.
3. **Every enforcement point, not the UI one.** Hiding the send button is not the revocation. The
   check lives server-side on the route/server action; the UI change is cosmetic and additional.
4. **Migration of existing users is a decision, not a default.** Reps who legitimately need to send
   offers are presumably the population that becomes `manager`. Who moves is the human's call and
   belongs in the Data Model / Phasing section — this section only records that a `rep`→`manager`
   reassignment list must exist before the revocation ships, or a real capability disappears with no
   replacement.

## Enforcement

- **Server-side check on every action**, at the route / server-action boundary. Client-side gating
  (hidden buttons, filtered menus) is UX and is never the control.
- **Role input validated with Zod at every boundary.** The role enum gains `manager`; the enum is the
  single definition both slices import — no string literals at call sites, no `any`.
- **Anonymous is a real row, not an assumption.** Every one of the six actions is asserted to fail
  unauthenticated. Reason: an unauthenticated request that reaches a permission check with a null
  subject is the classic way a default-deny becomes a default-allow.
- **Privilege escalation:** `users.manage` is `admin`-only, so `manager` cannot grant itself or others
  any role. Assert explicitly — `manager` attempting to assign `manager` or `admin` must fail. This is
  the cell whose deny matters most, and it is one line from being wrong.

## Audit log

- Every **role assignment or change** is audited: actor, subject, old role, new role, timestamp. The
  `rep`→`manager` migration is the first bulk writer of these entries and must appear in the log like
  any other change, not as a silent data fix.
- Every **denied** attempt on `offers.send` is logged with actor and role. Reason: for a period after
  deploy, denied reps are the signal that the revocation is actually enforced, and the only cheap way
  to see whether someone lost a capability they needed.

## Security-checklist items that apply

- [x] Auth + permission check on every affected route/action — server-side.
- [x] Permission matrix declared (actions × roles → allow/deny) including the anonymous row.
- [x] Zod validation on role input; role enum is the shared contract artifact.
- [x] Audit log on role change and on denied `offers.send`.
- [x] Privilege-escalation path explicitly denied and tested.
- [ ] Tenancy / row-scoping — **pending Q3.** If `manager` is team-scoped, isolation tests are
      required and this checkbox is not satisfiable by the matrix alone.
- [ ] Signed secrets, file access control — **n/a**, this change touches no files or external secrets.

## Contract artifact

The role enum and the action→role grant map live in one shared module imported by both slices; the
matrix table above is its specification. Path is named in the API & UI Surface section. Two copies of
this map (one server, one client) is the failure this names: they drift, and the client copy is the
one people read.
