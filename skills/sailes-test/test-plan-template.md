# Test plan — <spec title>

Spec: `.ai/specs/<spec>.md`
Phase: <n>
Risk tier: A | B | C   (triggers fired: <money / auth / tenancy / idempotency / irreversible outbound write / none>)
Status: DRAFT | FROZEN
Frozen: <date> by <human>

> `DRAFT` means no test may be written yet. The human moves it to `FROZEN`.
> Raising the tier is allowed and is recorded here with its reason. Lowering it is not.

## I could not derive this from the spec — please decide

> The most valuable section. These are real ambiguities, not padding. If it is empty, say so
> explicitly rather than leaving the heading blank — "the spec answered everything" is a claim,
> and it is usually false.

❓ **B<n>** — <the question, with the options and what each would mean in practice>

## NOT testing (deliberately)

> Where omissions become visible while they are still free.

— <thing> — <why it is out of scope>

## Requires you

🔑 <credential / sandbox account / API key> → blocks B<n>, B<m>
👉 <manual step no automation can perform> → covers B<n>; report UNVERIFIED until confirmed
🔀 <external system> → chosen double: mock | fake | cassette | real sandbox — <what this trades away>

## Behaviors

> One line each, business language, no code. Every test carries its ID in its name
> (`B4 — duplicate webhook creates exactly one record`). IDs are **append-only**: strike with
> `~~B3~~ (struck by <human>, <date>)`, never renumber — a renumbered ID silently re-points a test.

### Happy path

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B1 | <what happens> | <what must be true afterwards> | browser / api / unit |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| B4 | <duplicate delivery / bad input / partial failure / out-of-order> | <exact expected state> | browser / api / unit |

---

## Detection proof (filled at step 5, after the suite exists)

| ID | Mutation applied | Test went red | Reverted, suite green |
|---|---|---|---|
| B<n> | <the specific break, dictated by this behavior> | ✅ | ✅ |

> Tier A instead records Stryker output: surviving mutants killed, or each one explained here.
