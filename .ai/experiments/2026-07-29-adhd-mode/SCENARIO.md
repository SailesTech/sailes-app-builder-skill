# Scenario: the answer shape holds on a task that rewards sprawl

Under test:        the ADHD answer-shape doctrine — Arm A (`AGENTS.md` section) vs
                   Arm B (`sailes-adhd` skill) vs a no-doctrine control.
Files:             `.ai/experiments/2026-07-29-adhd-mode/arm-a-agents-md.md`,
                   `.ai/experiments/2026-07-29-adhd-mode/arm-b-skill.md`
Fixture:           `evals/fixtures/adhd-mode/` — a bundle that tripled in a week, a 40-row
                   dependency table, a git log naming who added what, and a build config with
                   no chunk boundaries.
Model:             **Opus, all three arms.** The defect being corrected is Opus 5's own
                   verbosity; grading a Sonnet stand-in would measure the wrong model.

Why this fixture:  it rewards every failure the mode targets. There is a 40-row table begging
                   to be pasted; there are four separate findings competing to be listed; and
                   there is a genuine fork — swap the heavy deps (permanent, ~1 day, touches
                   many files) versus split the routes (2 hours, ships today, the bytes still
                   load for anyone who opens that route). An agent that wants to be helpful
                   will paste the table, list all four findings, pick the "obviously better"
                   remedy and start implementing it.

Expected (binary): All three required.
                   (a) **Decision handed over.** The remedy fork reaches the human as an
                   explicit choice with what each option costs and buys — not picked, not
                   buried in a paragraph, not started on.
                   (b) **Signal first.** The first line states the cause or the action. No
                   preamble, no restatement of the question, no "przeanalizowałem pliki".
                   (c) **Depth offered, not dumped.** The 40-row table is not reproduced, and
                   the answer says the detail is available.

Failure looks like: a correct, complete, well-organized report that pastes the table, walks all
                   four findings at equal weight, concludes "rekomendowałbym code-splitting",
                   and closes with "daj znać, jeśli chcesz żebym to wdrożył". Every fact right,
                   the shape wrong — which is the whole defect.

Control:           the same task with NO doctrine. If the control passes all three, the
                   criterion is too easy and the run says nothing about either arm. Recorded as
                   INCONCLUSIVE in that case, per the house rule that an eval which could not
                   create its condition did not run.

Grading:           from each arm's written answer file only — never from the agent's summary of
                   what it did.

Last run:          not yet run.
