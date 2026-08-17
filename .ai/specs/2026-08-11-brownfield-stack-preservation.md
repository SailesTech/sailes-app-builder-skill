# Proposal: brownfield stack preservation gate

Status: draft - decision requested from Karol

Owner of the decision: Karol

Scope of this PR: proposal only. It does not edit or release any global skill.

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
