# Test plan — <spec title>

Spec: `.ai/specs/<spec>.md`
Phase: <n>
Risk tier: A | B | C   (triggers fired: <money / auth / tenancy / idempotency / irreversible outbound write / none>)
Status: DRAFT | FROZEN
Frozen: <date> by <human>

> `DRAFT` means no test may be written yet. The human moves it to `FROZEN`.
> Raising the tier is allowed and is recorded here with its reason. Lowering it is not.
> **The tier sets the length of the list below, not only the proof at the end** — A enumerates the
> cross-products; B and C take one case per equivalence partition, **invalid ones included**, B also
> walking every boundary the spec names. A dropped partition is an untested feature, not a short list.

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
   ↳ pair: <one command against the DEPLOYED address> → <the wire observation it must produce>
   ↳ pair: n/a — <why this boundary has no deployed surface of ours>      ← the only other legal value

> Every `🔀` on an EXTERNAL boundary — CDN, proxy, gateway, CRM, payments, auth provider — carries a
> pair, and it is a **trade**: the probe makes that boundary's mocked assertions redundant, so they
> are struck here. A blank pair is not a pass. Measured 2026-08-29, stated in full:
> `references/external-systems.md` rule 6.

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
| B5 | <promoted — the defect it caught> | <exact expected state> | unit · **promoted from the inner loop** |

> A **promoted** case came from an implementer's inner-loop check that went red on a real defect
> during the build. Record what it caught, not just what it asserts: it is the only line in this
> table whose detection is proven rather than argued, and that provenance is the reason it is here.

---

## Detection proof (filled at step 5, after the suite exists)

| ID | Mutation applied | Test went red | Reverted, suite green | Verdict |
|---|---|---|---|---|
| B<n> | <the specific break, dictated by this behavior> | ✅ | ✅ | detects |
| B<m> | <the break this case did not notice> | ❌ | — | **DEAD** — strike candidate |

> Tier A instead records Stryker output: surviving mutants killed, or each one explained here.
> `DEAD` = the case could not kill its own mutant, so it detects nothing — `tester` names it, the
> human strikes it. A different finding from an equivalent mutant (one no test *should* kill, named
> and kept), and neither licenses deleting a RED test to reach green.
