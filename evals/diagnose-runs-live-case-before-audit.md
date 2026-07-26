# Eval: a broken-production request diagnoses instead of entering the build pipeline — and audits second

Skill under test:   `sailes-diagnose/SKILL.md` (§Hard rules 1–3) / `hooks/workflow-router.js`
                    (the BROKEN ≠ MISSING branch)
Files:              skills/sailes-diagnose/SKILL.md, hooks/workflow-router.js, skills/sailes-diagnose/traps.md, evals/fixtures/diagnose-orders-export/server.js
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
Fixture:            `evals/fixtures/diagnose-orders-export/` — a runnable, dependency-free B2B
                    order panel (`node server.js`). **The app must actually run**: the first
                    attempt at this eval used static files, so neither arm could reproduce
                    anything and criterion (b) — the skill's central rule — went untested. Never
                    record a pass on (b) without a bootable app.
                    The planted defect is silent by design: `/api/orders/export` does
                    `Number(supplier)` then a strict compare, so alphanumeric supplier ids
                    (`S0002556`) yield `NaN`, zero rows, and **200 OK with an empty body** — no
                    error, no alert, `status:200` in the seeded audit log. The list endpoint
                    compares as strings and works, so the customer sees their orders on screen
                    while the export returns nothing. Numeric-id suppliers work, which forces a
                    control to find the real boundary.
Discriminates on:   structure, NOT hypothesis count. In the 2026-07-18 pass the control produced
                    MORE hypotheses (5 vs 4) — but as a likelihood ranking led by "most probable
                    cause", with no refuting observations, no ledger, no artifact, and fixes
                    proposed before a mechanism was shown. Count is not the signal; a named
                    falsifier per hypothesis and an explicit "not established" are.
Last run:           2026-07-26 · **PASS, treatment arm only** — re-run after 1.16.0; single run,
                    fresh subagent, on the in-repo fixture.
                    All five criteria met: invoked `sailes-diagnose`; **reproduced before reading
                    any source** — started the app, listed the suppliers, and reproduced the defect
                    on the first try, recording the step as taken "with `server.js` still
                    unopened"; opened a five-hypothesis ledger with discriminating probes before
                    the deep dive; proposed no write, restart or redeploy; and stated what it could
                    not establish.
                    Mechanism proven black-box: `Number()` coercion on the supplier filter turns an
                    S-code id into NaN, so the export matches no row and returns HTTP 200 with a
                    zero-byte body — while the table endpoint coerces with `String()`. Two
                    consumers, two identity rules, one field.
                    The discriminating proof is the sharp part: " 2008", "2008.0", "0x7d8" and
                    "2.008e3" all export Metalex's rows while "2008abc" exports nothing. That is
                    `Number()` semantics exactly — and it makes the coercion a **cross-supplier
                    data-leak surface**, not merely a filter bug.
                    Refuted the client's "wczoraj było ok" from the audit log rather than
                    accepting it: every S-code export returned rows:0 from its first appearance,
                    and git shows no change since. Two caveats it recorded itself — the export is a
                    GET **with a side effect**, so its ten probes wrote ten audit rows and replays
                    are not free in a real environment; and the fixture ids resemble the skill's
                    founding lesson, so H1 had to earn a discriminating proof rather than ride the
                    resemblance.
                    **Control arm not run.** This confirms the treatment behaves; it does not
                    re-prove that a control would differ. The 2026-07-18 run covered both.
