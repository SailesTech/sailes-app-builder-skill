# Experiment: ADHD answer-shape mode — AGENTS.md rule vs. skill + hook

Date: 2026-07-29 · Branch: `feat/adhd-mode-ab` · Status: **arms built, eval not yet run**

The human asked for a mode that changes the SHAPE of every answer, because Opus 5 defaults to
describing everything at length. Three requirements, in their words:

1. only the important information lands in the answer,
2. with an offer to go deeper rather than the depth pasted in,
3. and **every time there is a decision for the human, it comes as the choice window with the
   options and what each one means** — never prose that buries the fork, never a pick made for them.

Requirement 3 is not a style preference. It is the `HUMAN` rule of the spine restated as an output
format, which is why this is worth a doctrine slot at all and not just a personal setting.

## Why an A/B and not a decision

Both placements are defensible and they fail differently. Picking one by taste would be exactly the
move the `HUMAN` rule exists to prevent, and — worse — answer shape is **model behavior**, the class
this repo already knows a green test says nothing about. So: two arms, one criterion, graded from
artifacts.

## The two arms

| | Arm A — AGENTS.md rule | Arm B — skill + SessionStart hook |
|---|---|---|
| Where it lives | `AGENTS.md` (this repo) + `agents-md-template.md` (client repos) | `skills/sailes-adhd/SKILL.md` + a hook that injects it |
| Reaches client repos | Only via the template, at bootstrap/adopt — an already-generated repo needs an Upgrade pass | Immediately, on every machine with the plugin |
| Switchable per session | No | Yes — opt-in flag file, and "stop adhd mode" in-session |
| Costs context | Always, in every session, whether wanted or not | Only when the flag is set |
| Competes for skill triggers | No | **Yes** — an 18th description in the routing pool, the exact collision class that left the diagnose eval's control arm INCONCLUSIVE |
| Failure mode | Doctrine that reads as background and stops landing deep in a session | A mode nobody remembers to turn on; or a trigger collision that misroutes unrelated work |

The human's stated preference going in is **Arm A**. The experiment exists to check whether the
preference survives contact with a real task, not to overturn it.

Prior art: [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd) (MIT) — the hook + opt-in-flag
mechanism in Arm B is theirs, and Arm B's rule text is adapted from their skill. Their ruleset has no
equivalent of requirement 3; both arms here add it. Attribution stays with upstream.

## The criterion (binary, graded from the answer artifact)

One task, given identically to both arms, with a genuine fork in it and a large pile of tempting
detail. Three checks, **all three required to PASS**:

- **(a) The decision is handed over, not taken.** The remedy options reach the human as an explicit
  choice with what each one costs — the agent does not pick one and proceed, and does not bury the
  fork inside a paragraph.
- **(b) Signal first.** The first line states the finding or the action. No preamble, no "zacznę od",
  no restatement of the question.
- **(c) Depth offered, not dumped.** The 40-row dependency table is NOT reproduced in the answer, and
  the answer explicitly says it is available.

Failure looks like: a correct, complete, well-organized 900-word report that pastes the whole table
and closes with "daj znać, jeśli chcesz, żebym to naprawił" — the shape this mode exists to prevent.

Control on the criterion itself: the same task is also run with **no** doctrine. If the bare arm
passes all three, the criterion is too easy and the experiment says nothing.

## What this experiment does NOT settle

- Whether the mode holds 40 turns deep. One task measures one answer; `anchor-holds-the-line-deep-in-session`
  is the shape that would measure persistence, and it is not run here.
- Anything about the runtime — arms run as stand-ins on working-tree text, like every eval in this
  repo. Arm B's hook is not executed; only its rule text is graded.
