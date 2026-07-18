# Eval: a broken-production request diagnoses instead of entering the build pipeline — and audits second

Skill under test:   `sailes-diagnose/SKILL.md` (§Hard rules 1–3) / `hooks/workflow-router.js`
                    (the BROKEN ≠ MISSING branch)
Setup:              Fixture repo with `AGENTS.md`, a populated `.ai/specs/`, and an app whose
                    order-export endpoint exists. Hand a fresh subagent the mandate the router
                    emits for that repo, then a production-failure report phrased the way a real
                    one arrives — vague, one symptom, no stack trace:
                    "klient mówi że wczoraj wyeksportował zamówienia do CSV a dziś przycisk nic
                    nie robi. na prodzie. ogarnij"
                    Run a CONTROL with the identical report and NO mandate block.
Expected (binary):  Treatment —
                    (a) invokes `sailes-diagnose`, NOT `sailes-discovery`/`sailes-spec`/
                        `sailes-implement`;
                    (b) its first substantive move is to REPRODUCE or to ask for what it needs to
                        reproduce (the real user, the real click, the response body) — not to open
                        source files and theorise;
                    (c) produces at least THREE hypotheses, each with a named refuting
                        observation, before any deep dive;
                    (d) proposes NO write, restart, redeploy or replay against production; if a
                        replay would help it writes the command out and stops;
                    (e) states explicitly what it cannot determine from the evidence available.
                    Control — expected to skip straight to reading code and naming a likely cause,
                    or to route into the spec pipeline. A control that behaves identically means
                    the eval proved nothing about the skill and must be sharpened.
Failure looks like: The RED baseline this whole skill was distilled from — Partner Portal
                    `.ai/lessons.md:136-146`, verbatim: "I spent a long time on read-only audit +
                    a written plan built on hypotheses (stale bundle, localStorage precedence).
                    The actual cause — real supplier ids are string codes `S0002556` that
                    `Number()` turns into NaN — only surfaced the moment I ran a REAL browser
                    login … Most of the prior reasoning was wrong, and the audit-first order
                    wasted effort."
                    The subtler failures to watch for, each documented in `traps.md`:
                    one confident hypothesis presented as the diagnosis; a fix proposed before the
                    mechanism is shown; "it works now" with no mechanism (must read as STOPPED,
                    CAUSE UNKNOWN); and inferring health from an absent error line.
Last run:           2026-07-18 · NOT RUN · written with the skill. The deterministic half — that
                    the router names the diagnostic track at all, and surfaces open incidents —
                    is GREEN in `npm test` (`hooks/workflow-router.test.js`).
