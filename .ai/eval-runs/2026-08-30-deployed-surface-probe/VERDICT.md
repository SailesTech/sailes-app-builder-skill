# A/B: does the spec skill produce a check on the DEPLOYED address?

Eval: `evals/spec-probes-the-deployed-surface.md`
Date: 2026-08-30 · **single run per arm** — a sample, not a measurement (harness README, rule 5)
Vehicle: fresh generic subagent per arm, clean context, pinned to Sonnet, told nothing about the eval.

| | Arm A (`sailes-spec` at `main`) | Arm B (after the change) |
|---|---|---|
| `node tools/deployed-surface-check.js <arm>` | **exit 1** | **exit 0** |
| Contract chosen for "proposal not there yet" | `404` + `{status:"not_found"}` | `200` + `{"status":"pending"}` in the body |
| Named the CloudFront `404 → 200 text/html` rewrite as a risk | **no** | **yes**, unprompted, in the design rationale |
| Deployed-host check present | yes — one, in a final "deployed verification" phase | yes — per phase, as `Deployed-probe` |
| What that deployed check actually observes | `cache-control` and CDN caching | the status/`Content-Type` the feature keys on, **and** caching |
| Length (phasing section) | 98 lines | 121 lines |

## The result, stated narrowly

**Arm A is not a clean control, and that is the most useful thing this run produced.** The
pre-change skill did reach a deployed-verification phase on its own — the brief names one
CloudFront distribution, and a capable model takes the hint. Under this scenario's own rule, an
arm A that reproduces the behavior means the text is not what carries it, and I would have to
record "proves nothing".

Except it did not reproduce the behavior. It reproduced **the escaped defect**: arm A kept the
`404` contract, asserted it in vitest and Playwright only, and pointed its one deployed check at a
*different* wire property (cache headers). That is the 2026-08-29 session almost line for line —
a deployed check existed in spirit, and the property that actually broke was never observed on the
deployed address.

Arm B did two things arm A did not:
1. It identified the mechanism at **design** time — a CloudFront Custom Error Response mapping
   `403/404 → /index.html` with a forced `200` is distribution-level and would swallow the ALB's
   honest `404`.
2. It therefore **removed the dependency instead of testing it harder** — keying pending/ready on
   the JSON body, so there is no non-2xx origin response for the edge to rewrite.

That second move is worth more than the probe. The rule asked "where is this observed", and the
answer that came back was "it should not be load-bearing at all". A rule that produces a better
contract rather than a longer test list is the shape this change was aiming for.

## Against the speed claim — honestly, this run does not support it

Arm B is **23 lines longer**. The added length is design rationale (the CloudFront analysis), not
template filler, and it is the reasoning that produced the better contract — so it is not waste.
But it is not the reduction the `spec-weight` block claims either.

**This A/B does not test `spec-weight` at all.** Both arms were asked for the Phasing section only;
`spec-weight` governs how many of the eleven *required sections* a change earns, which was outside
the prompt. The speed half of this release is therefore **unmeasured**, and saying otherwise from
this run would be reading a result the fixture cannot produce. Owed: an A/B on a whole-spec
prompt, where the arms differ on section count.

## What this run also found — three defects in the checker itself

Grading real model output rather than hand-written fixtures broke the tool three times, all the
same class: a **correct answer failed on punctuation**.

1. Arm B wrote `**Deployed-probe**` as a bold sub-heading with the command underneath. The check
   only accepted `Deployed-probe:` with a colon.
2. Arm B wrote a waiver as `` `n/a — this phase reads a contract already probed in Phase 1` ``.
   The backtick meant the waiver regex never matched.
3. Arm A's Phase 3 carried a real deployed `curl` inside its `Done-when` with no `Deployed-probe:`
   label. Failing that is bookkeeping: the question had been answered on disk.

All three are fixed and pinned in `tools/deployed-surface-check.test.js` under "forms real specs
are written in". Had the tool shipped on its fixtures alone it would have been a check that fails
right answers over formatting — which is the exact thing the human asked to be removed from this
framework this session, shipped in the change meant to remove it.

## Verdict

**Arm B PASS on the binary criterion; arm A FAIL** — mechanically, by the checker, at exit 1 vs 0.
Single run per arm, model-graded fixture, N=1. The behavioral difference is real and legible; the
*size* of the effect is not established, and the control's partial success is recorded above rather
than smoothed over.
