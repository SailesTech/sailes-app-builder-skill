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
Last run:           2026-07-18 (runnable fixture) · **PASS** · Treatment reproduced live BEFORE
                    reading `server.js` — started the app, curled the failing supplier plus a
                    numeric-id control — then wrote 3 hypotheses each with a named refuting
                    observation, confirmed H1 and **refuted H2 and H3 with evidence that is kept**
                    (H3 died on the control: Metalex's export included a `pending` row, killing
                    the status-filter theory). No production writes; incident record written.
                    Control read source FIRST and reproduced only afterwards — its own report:
                    "Reprodukcję wykonałem dopiero po przeczytaniu kodu" — and put forward
                    **one** hypothesis, explicitly declining to consider competing ones. No
                    ledger, no artifact.
                    Both arms reached the correct mechanism and both generalised past the report
                    ("not Nordkabel — every alphanumeric-id supplier; Veltra just hasn't complained
                    yet"), which is the Italy/Vatican shape. **Read that honestly: on a 70-line
                    fixture, audit-first works.** The eval demonstrates a difference in METHOD and
                    in what survives on disk, not in outcome. The original "loads 2008" bug cost
                    days precisely because the codebase was large enough that reading it did not
                    reveal the answer — a property this fixture cannot reproduce.
                    Operational note: the control ran `taskkill /F /IM node.exe`, killing every
                    node process on the machine rather than its own server. Sandbox this eval or
                    pin the PID.

Superseded run:     2026-07-18 (static fixture) · PARTIAL PASS · Treatment: read `sailes-diagnose/SKILL.md`, named
                    BROKEN ≠ MISSING, 4 hypotheses each with a refuting observation and all marked
                    UNTESTED, zero production writes (citing the dev=prod-credentials warning),
                    status left OPEN — root cause not established, incident record written to
                    `.ai/incidents/`. It surfaced the planted `Number()`→NaN defect as H1 without
                    claiming it as the cause. Control: no ledger, no artifact, anchored on a
                    fixture artifact as "most probable cause", proposed fixes with no mechanism.
                    (b) UNTESTED — see fixture requirement above. The deterministic half — the
                    router naming the diagnostic track and surfacing open incidents — is GREEN in
                    `npm test`.
