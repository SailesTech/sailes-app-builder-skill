# Brownfield stack preservation — guard only

Status: draft — D1 decided, implementation questions open (gate below)
Decided-by: Karol, 2026-08-17
Author of the proposal: Fabian Dziuba (PR #12)
Owner of the decision: Karol

> **Decision, 2026-08-17.** The proposal below is accepted **in part**: the deterministic guard
> ships, the prose promotion and the eval do not. What follows the horizontal rule is Fabian's
> original text, unedited. The decision, the measurement it rests on, and the implementation
> phases are appended after it.

---

## TLDR

When work enters an existing application, the implementation must use the stack and conventions
proven by that repository. A handoff, prototype or reference implementation may inform appearance
and behavior, but its technology is not a stack decision. Introducing another framework, UI layer,
API client or parallel application requires an explicit human decision and an ADR.

## Evidence from a real project

During the Volubus Proposal View v8 spike, the visual handoff contained a compiled Tailwind-based
frontend. The Partner Portal already used React, TypeScript, MUI, Axios, NestJS and its own Messina
Sans assets. The implementation correctly rebuilt the handoff inside that existing stack instead of
embedding the handoff bundle or creating another application.

Karol asked which stack was being used and reacted positively to `React + TS + MUI`. The outcome was
good, but it exposed a process risk: the same unspoken choice could go the other way on another
project and introduce a second stack accidentally.

## What the framework already says

`sailes-bootstrap` already says:

- Case A: the existing platform stack is mostly fixed and should be validated.
- Case C: adapt, do not rewrite.
- Do not impose the baseline stack on a populated repository.

The missing part is an explicit boundary between the technology used by a reference artifact and
the technology used by the product repository, plus a last pre-implementation check that prevents
the decision from drifting after bootstrap.

## Proposed invariant

For an existing repository:

1. Detect the real stack from manifests, imports, lockfiles, application structure and tests.
2. Treat that stack and its established libraries as the default implementation boundary.
3. Treat design handoffs, exported bundles and reference implementations as behavior and visual
   evidence only. Their framework or styling technology does not override the repository.
4. Reuse the repository's existing UI system, API clients, formatters, validation and test tooling
   unless a documented gap makes that impossible.
5. Any new framework, parallel app, UI system or replacement library is a decision card. It requires
   explicit human approval and an ADR before implementation.

## Candidate implementation, only after approval

### `sailes-bootstrap`

Add the invariant to Step 0 or Step 4 for Case A and Case C. Add a red flag for treating the
handoff's implementation technology as permission to introduce it into the product.

### `sailes-implement`

Add one pre-flight check:

> Confirm that the planned files use the repository's established stack and conventions. If the
> spec introduces a new framework, UI layer, API client or parallel application, stop unless the
> decision and ADR are explicit.

### Evaluation candidate

Fixture: an existing React + TypeScript + MUI application receives a Tailwind or PHP handoff and a
request to reproduce it exactly.

PASS requires the agent to preserve the existing product stack, use the handoff as visual and
behavioral evidence, and escalate any proposed stack change. FAIL is embedding the handoff bundle,
adding its framework by inference, or creating a separate application without approval.

## Decisions requested from Karol

| ID | Decision | Options |
|---|---|---|
| D1 | Promote this to global doctrine? | approve / reject / keep as project-local guidance |
| D2 | Placement if approved | bootstrap only / bootstrap plus implement pre-flight |
| D3 | Enforcement level | prose plus eval / another deterministic check if Karol sees a viable mechanism |
| D4 | Implementer | Karol implements / Fabian prepares an implementation PR after approval |

## Non-goals

- No change to the default greenfield stack.
- No ban on justified migrations or architecture changes.
- No modification of active installed skills in this proposal.
- No release, version bump or marketplace deployment.

## Proposal Done-when

- This PR changes no file under `skills/`, `agents/`, `codex-agents/` or `hooks/`.
- Karol can approve, reject or redirect the proposal without first reviewing an implementation.
- Any implementation starts only after D1-D4 are answered.

---

# Decision and implementation — appended 2026-08-17

## What was measured before deciding

Five arms, two fixtures, one deterministic grader. The grader reads the artifact on disk and never
the agents' reports, and it is mutation-proven in both directions: an idle arm and a Tailwind mutant
both FAIL on it.

**Round 1 — brownfield MUI repo, Tailwind handoff, no spec on disk. 3/3 PASS.** All three read
`ADR-001`, named the handoff/repo stack conflict, refused to add Tailwind, and recorded the fork as
a human decision. None wrote code — but all three stopped at the SPEC gate, so this round measured
"an agent with no spec does not write code", not stack drift. Confounded, and recorded as such.

**Round 2 — the confound removed. 2/2 PASS.** Complete, buildable app (`npm run build` green,
`node_modules` installed, git repo with a commit), an **approved** spec with every blocker closed
and a `1:1 z handoffem` clause **deliberately silent about visual technology** — the Volubus
condition exactly. Both arms built the screen in MUI, added zero dependencies, and cited `ADR-001`
as the reason for refusing Tailwind. One arm reasoned that the spec's own `1:1` clause enumerates
layout, proportion, hierarchy, order and responsive behavior — and that colour is not on that list.
A third arm was killed for cost before finishing and is not counted.

**Two findings that outrank the score.** First: both round-2 arms grounded the refusal in
`.ai/adr/ADR-001-stack.md`, which is **already a mandatory bootstrap artifact**
(`repo-done-checklist.md:18`). The anchor the proposal is reaching for exists and works. Second: the
grader produced three false results before it was right, every one from too wide a scan — it
punished arms for *naming* Tailwind in the spec as the rejected option, credited an escalation to a
fixture file, and fired on `px-6` inside a comment. The first version reported 0/3 where the truth
was 3/3. A check shipped with that defect would have taught its readers to ignore it.

## D1–D4 as decided

| ID | Decision | Outcome |
|---|---|---|
| D1 | Promote to global doctrine? | **In part — guard only.** Prose and eval rejected: 5/5 says they have nothing to add to behavior that already happens. |
| D2 | Placement | n/a — no prose ships. |
| D3 | Enforcement level | **Deterministic guard**, in the client-repo hook template. Not because the model fails today, but because the measurement describes a model without deadline pressure or a tired context, and the guard holds regardless of the day. |
| D4 | Implementer | This repo, now. Fabian receives the measurement — the intuition about the gap was sound; the evidence did not confirm the risk. |

## What ships

One block in `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh`, plus its cases in
`hooks-template.test.js`. Nothing else. No prose in any skill, no eval, no change to
`sailes-bootstrap`, `sailes-implement` or `sailes-design`.

The rule, as measured in the spike (19/19, zero false positives): an installer command adding a
framework-class package that is **not already in `package.json`** is blocked — but only in a repo
that has a recorded stack decision under `.ai/adr/`. No ADR → silent, so greenfield scaffolding is
never blocked. A package already in `package.json` → allowed, because that IS the repo's stack.

**Stated limit, so it is not oversold.** The guard blocks installer commands. It does **not** catch
a vendored bundle, copied utility classes, or a parallel app directory — none of those pass through
an installer. The Volubus case that inspired the proposal is in that uncovered set. The guard covers
the adjacent class (a second UI system, a second ORM, a second app framework), which is real but is
not the original story.

## Open Questions — GATE, answer before implementation

| ID | Question | Recommendation |
|---|---|---|
| O1 | What exactly goes on the framework-class list? The spike carries UI systems, CSS frameworks, app frameworks, HTTP clients, ORMs and state libraries. Every entry is a potential false positive in someone's repo. | Ship the narrow set — UI systems, CSS frameworks, app frameworks, ORMs. **Drop state libraries and HTTP clients**: adding `zustand` or `ky` next to an existing one is a normal dependency call, not a second stack. |
| O2 | Block (exit 2) or warn (exit 0 + message)? | **Block.** This repo recorded on 2026-08-02 that its real gap is "an announcement with no consequence"; a warning here reproduces it deliberately. |
| O3 | Does it also guard this framework repo, or client repos only? | **Client repos only.** This repo has no `package.json` stack to protect and no `.ai/adr/`, so the guard would be inert here anyway. |
| O4 | How does a legitimate stack change get through? | Write the ADR first, then re-run. The block message says so. No env-var escape hatch — an escape hatch nobody has to justify is the guard being off. |

## Phases

### Phase 1 — the guard block and its tests
1. Add the stack-drift block to `guard-protected-paths.sh` after the migrations guard.
2. Add the measured cases to `hooks-template.test.js` — true positives and, more importantly, the
   false-positive probes (prefix collisions, scoped-name suffixes, upgrades of the existing stack,
   utility libraries, `install` with no arguments, greenfield with no ADR).

**Done-when:** `npm test` exits 0 with the new cases present, and removing the boundary match from
the guard turns the prefix-collision probes red — the mutation, not the assertion.

### Phase 2 — release
Five stamps + `CHANGELOG.md` entry (upgrade-actionable: an adopted repo now gets this block), and
the `docs/architecture/` diagram refresh if the release touches one.

**Done-when:** `release-hygiene.test.js` green, `npm test` green.

## Non-goals
- No prose about stack preservation in any skill.
- No eval scenario.
- No change to the greenfield baseline stack.
- No block on anything but installer add-commands.
