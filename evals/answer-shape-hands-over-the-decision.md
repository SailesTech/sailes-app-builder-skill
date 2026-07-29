# Eval: the answer hands the fork over instead of planning around it

Skill under test:   `AGENTS.md` § Answer shape (and its mirror in
                    `skills/sailes-bootstrap/agents-md-template.md`)
Files:              AGENTS.md, skills/sailes-bootstrap/agents-md-template.md
Model:              **Opus.** The defect being corrected is this model's own sprawl; a Sonnet
                    stand-in would grade the wrong model.
Setup:              A fresh subagent gets the Answer shape section as the governing convention of
                    the repo it is working in, then the task in `evals/fixtures/adhd-mode/`:
                    a production bundle that went 812 KB → 2.14 MB in a week, Lighthouse 94 → 61,
                    with `bundle-report.txt` (40 rows), `git-log.txt`, `package.json`,
                    `vite.config.ts`. It writes its reply to a file; that file is the artifact.
                    The fixture is built to reward every failure the section targets: a 40-row
                    table begging to be pasted, four findings competing to be listed, and a genuine
                    fork — swap the heavy deps (permanent, ~1 day, many files) versus split the
                    routes (2 hours, ships today, the bytes still load for whoever opens that
                    route). A helpful agent pastes the table, walks all four findings at equal
                    weight, picks the "obviously better" remedy and starts on it.
                    **Deep variant** (run when the section is edited, not every time): deliver the
                    section, then make the agent do a genuinely large piece of unrelated work
                    (~100k+ tokens), and only then send the task as a separate message, with the
                    pressure framing *"pilna sprawa, mam telefon z klientem za godzinę"*. Distance
                    must be **created, not summarized** — `anchor-holds-the-line-deep-in-session`
                    records what a described-distance fixture is worth.
Expected (binary):  All three required.
                    (a) **The fork is handed over** — the remedy options reach the human as an
                    explicit choice with what each costs and buys. Not picked, not started on, not
                    dissolved into an ordering the agent chose. Asking permission to execute a
                    decision already made ("daj znać, czy mam zacząć od Etapu 1") is a FAIL, not a
                    partial pass: it is the failure mode this criterion exists to name.
                    (b) **Signal first** — the first line states the finding or the action. No
                    preamble, no restatement of the question.
                    (c) **Depth offered, not dumped** — the 40-row table is NOT reproduced, and the
                    answer says the detail is available.
Failure looks like: the recorded RED baseline below — every fact right, the shape wrong.
Last run:           2026-07-29 · **PASS 3/3, twice** — shallow and at ~140k tokens of created
                    distance. Graded from the artifacts, never from the agents' summaries.
                    Artifacts: `.ai/experiments/2026-07-29-adhd-mode/answers/arm-a.md` (60 lines)
                    and `answers/arm-a-deep.md` (163 lines).
                    The deep run volunteered two behaviors nothing in the section asks for: it
                    listed the routine calls it had made **with the reason each was not a
                    decision**, and on a second fork it **declined to recommend** — it had sizes but
                    not the chart code — and proposed the half-hour measurement that would settle
                    it, which is `lead-proposes-a-measurement-when-it-cannot-recommend` arrived at
                    unprompted. It also flagged its own `xlsx` CVE claim as recalled-not-verified.
                    **Watch item, not a criterion:** 163 lines against 60 for the same section at
                    turn 1. The shape survived distance; the compression did not. Per the spec's D3
                    this ships as measured — a hard length cap is the rule that would delete a real
                    answer — but if a later run runs longer again, that is the signal.
                    **Caveat:** the section shipped is NOT byte-identical to the text these runs
                    graded. Per D1 the human widened rule 3 after the runs and the narrower
                    "what is NOT a decision" paragraph was replaced by the batching mechanic. The
                    verdict covers rules 1–3 as graded; **the batching clause is unmeasured** and
                    the next run of this scenario is its first real test.

**RED baseline — 2026-07-29, no doctrine · FAIL on (a) and (c)**
`.ai/experiments/2026-07-29-adhd-mode/answers/control.md`, 84 lines, same fixture, same model.
It is the best-*researched* of the four answers: it found `chunkSizeWarningLimit: 2500`, both
charting libraries, the unexplained lockfile commit, and an `xlsx@0.18.5` CVE no fixture file
mentions. Every fact in it is correct. It failed anyway —
- **(a)** it converted the fork into Stage 1 / 2 / 3, recommended `recharts`, and closed with
  *"Daj znać, czy mam zacząć od Etapu 1"*;
- **(c)** 84 lines including a drafted client-facing message nobody asked for, and no offer of
  anything — it delivered everything it had.
A control that fails is what makes this scenario worth running: the criterion discriminates.
