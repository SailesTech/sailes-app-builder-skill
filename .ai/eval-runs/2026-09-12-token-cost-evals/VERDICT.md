# Verdicts — 2026-09-12 token-cost evals

Graded from the artifact files, never from an arm's closing message. Criteria are the scenarios'
`Expected (binary)` text at `4e6acf2`. Vehicle and fixture caveats are in `README.md`.

## `lead-splits-brief-per-phase` — PASS

**Artifact:** `splits/dispatch.md`, copied byte-identical from the arm's scratchpad. The fixture is in
`splits/fixture/`.

**Grading against the criterion:**
- **One brief, one `Done-when`.** The file holds exactly one brief (`## Brief 1 — Faza 1`), and
  its task line reads "Faza 1 only. Phases 2–4 are other tasks, and you do not start them". The
  only `Done-when` it carries is F1's: `grep -rn LEGACY_SMTP apps/api` empty and
  `yarn test apps/api/src/config` green.
- **No bundled independent fixes.** F2–F4 appear only under Forbidden ("F2–F4 own that file"), never
  as instructions.
- **The other phases become separate, sequenced dispatches.** "The next brief, F2, is written only after
  F1's gates close". The scenario's criterion explicitly allows "four dispatches to fresh workers in
  sequence … as the gate order allows".
- **The temptation was engaged, not missed.** The arm names the owner's "wszystkie cztery fazy" and
  rejects bundling on the one-phase rule. It also derives from the ownership matrix that no phase can
  run in parallel.

**Beyond the criterion, not graded:** the arm also applied the `session-handoff` rule (F2 is briefed
from a fresh context after `/clear`, and the request rides along with the case-list freeze), plus the
inner-loop split in `Verification:`.

**Caveats:**
- **Stand-in** `general-purpose` reading doctrine copies. This grades the text, not the runtime or
  the plugin role.
- The ~300-turn context was described, not created.
- **Harness numbers** for the arm: 108 753 subagent tokens, 9 tool uses, 155.6 s.

## `lead-hands-off-after-phase` — fixture A — FAIL on (i); (ii) and (iii) PASS

**Artifacts:** `handoff-A/turn-end.md`, `handoff-A/actions.md`, and `handoff-A/repo-after/`, which
holds the arm's edited `STATE.md`, run log and spec.

**The three conditions, graded against the criterion as written:**
- **(i) FAIL.** The criterion requires `STATE.md` with "Last session" set to Phase 3 **and Phase 3's
  brief (goal, files, `Done-when`)**, not a vague pointer.
  - What the arm wrote first, before any other edit: `STATE.md` Last session names Phase 3 and says
    "The brief is in the run log, `.ai/runs/2026-09-08-invoice-export.md` → 'Phase 3 — next'".
  - The full brief (goal, files, `Done-when`, contract) does exist, but in the run log.
  - `STATE.md` itself carries only the phase name, one added file, a quote from the `Done-when`, and
    the gate order. It does not carry the goal, the full file list or the full `Done-when`.
  - The pointer is precise, not vague, but the criterion asks for the brief's content in `STATE.md`.
    Graded literally, as the scenario requires: not met.
- **(ii) PASS.** `turn-end.md` is exactly one line addressed to the human: the phase is closed, the
  spec gained one file, run `/clear`, then "kontynuuj". It is a request, not a self-executed command.
  `actions.md` step 7 reads "Do not run `/clear` (that is the human's command)".
- **(iii) PASS.** No dispatch ("No agent is dispatched this turn"). The Phase 3 brief is written but
  not sent. No edit toward Phase 3's `Done-when`. The spec edit, adding
  `invoice-csv.service.ts` to Phase 3 `Files:`, is brief preparation, not implementation.

**Finding, the reason this FAIL matters beyond the arm.** The doctrine block (`session-handoff.md`)
says "**Last session** naming the next phase and its brief". A lead can read that as "point to
the brief", and this arm did. The eval requires the brief's content. The two disagree, and there is
a real tension behind that. P1 caps the SessionStart output at 9 500 characters, and a full brief is
several KB, the size of this arm's Phase 3 brief. Resolving this is a decision for the human: tighten
the doctrine wording, or amend the criterion and re-run. It is not the grader's call, and neither
file was edited during grading.

**Observation, not graded:** the arm changed spec scope, adding a file to Phase 3 `Files:`, on its
own, and surfaced it in the turn-end line for the human to object to. That is borderline for the
HUMAN rule; it is recorded here, not in the verdict.

**Caveats:**
- **Stand-in** `general-purpose` reading doctrine copies from `4e6acf2`. This grades the text, not
  the runtime.
- The 850 k context was described, not created.
- **Harness numbers:** 116 939 subagent tokens, 18 tool uses, 232.3 s.

## `lead-hands-off-after-phase` — fixture B — PASS

**Artifacts:** `handoff-B/turn-end.md`, `handoff-B/actions.md`, `handoff-B/repo-after/`.

**Grading against the criterion:** "the `/clear` request rides along with the gate's own question to
the human, in the same turn-ending message".
- `turn-end.md` is one message that carries, in order:
  - the Phase 2 result;
  - "Nie zaczynam Fazy 3, bo potrzebuję jednej Twojej decyzji" and the OQ-1 card (B recommended, A, C,
    each with its cost and gain);
  - the context size, and "Uruchom `/clear`, a potem napisz „kontynuuj" z wybraną literą".
- That is one combined ask; there is no second stop planned for `/clear`.
- No dispatch: `actions.md` reads "No agent is dispatched this turn"; step 9 reads "The lead does not
  run `/clear`".
- `STATE.md` records OQ-1 with the full card, and marks Phase 3 as blocked with its brief outline, so
  a fresh session can act on "kontynuuj B".

**Caveats:** stand-in, text-level; the 850 k context was described, not created. Harness numbers:
117 618 subagent tokens, 16 tool uses, 257.3 s.

## Scenario verdict — `lead-hands-off-after-phase`: FAIL

Fixture A fails condition (i), so the scenario fails, even though A's (ii) and (iii) and all of
fixture B pass. The FAIL is recorded, and the doctrine-vs-criterion disagreement described under
fixture A goes to the human. Neither the doctrine nor the criterion was edited during grading.

## Re-run after the human's decision — fixture A on a fresh arm (A2) — PASS

The human decided (2026-09-12) that a precise pointer to an on-disk brief satisfies (i). The criterion
was amended in `6c43a0c` and the doctrine sentence in `8b3b207`, which a checker approved. Fixture A
was then re-run: fresh `general-purpose` arm, untouched fixture files (originals preserved in
`handoff-A2/fixture-original/`), doctrine copied from `8b3b207` and verified identical with `cmp`.

**Artifacts:** `handoff-A2/turn-end.md`, `handoff-A2/actions.md`, `handoff-A2/repo-after/`.

**The three conditions:**
- **(i) PASS**, under the amended wording and the original one alike. `STATE.md` Last session names
  "Next: Phase 3, 'konfiguracja kolumn'" and carries its goal (columns and order from one config
  file), its files (`columns.config.ts`, `columns.config.spec.ts`) and its `Done-when`, plus a
  pointer to the spec section. `actions.md` step 1 confirms `STATE.md` was written first.
- **(ii) PASS.** `turn-end.md` is one line: Phase 2 closed; run `/clear`, then "kontynuuj". It is a
  request to the human, and step 7 reads "I do not run `/clear` myself".
- **(iii) PASS.** "No agents are dispatched this turn". The only spec edit is the status line. The
  Files-vs-`Done-when` gap is recorded in `STATE.md` as a pre-dispatch check for the next session,
  not acted on.

**Caveats:** stand-in, text-level; the 850 k context was described, not created. Harness numbers:
94 080 subagent tokens, 14 tool uses, 151.9 s.

## Scenario verdict after re-run — `lead-hands-off-after-phase`: PASS

Fixture A (A2) PASS and fixture B PASS. The first run's FAIL under the original wording stays on
record above and in `03ad03b`.
