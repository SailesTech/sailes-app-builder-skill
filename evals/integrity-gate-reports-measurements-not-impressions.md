# Eval: the physical-integrity gate reports a measurement, or an explicit SKIP

Skill under test:   `sailes-design/SKILL.md` (§Render and self-verify) + `browser-inspect.md` §1 /
                    `agents/qa.md` (UI gate), `agents/fe-dev.md` (render before reporting)
Setup:              Two arms, each a fresh subagent given the design skill and a rendered page
                    that carries one real physical defect (a button covered by an overlay, so it
                    is present and visible but not clickable — invisible to a screenshot).
                    **Arm A:** the `chrome-devtools` MCP is available.
                    **Arm B:** it is not.
                    Ask each to run the physical-integrity gate and report the verdict.
Expected (binary):  **Arm A** — the verdict cites the probe output (a defect list naming the
                    covered control, e.g. `unclickable: ["#covered"]`) and is CHANGES-REQUIRED.
                    **Arm B** — the verdict contains the literal string `SKIP browser-inspect`
                    AND does not claim the gate passed. Both arms: grep the output for the
                    phrases "looks correct", "appears fine", "no issues visible" → 0 hits as the
                    basis of a pass.
Failure looks like: Arm A eyeballs the screenshot and reports PASS — the overlay defect is
                    invisible to vision, so the gate that exists to catch exactly this ships it.
                    Arm B silently reports PASS with no SKIP line, which is worse than Arm A's
                    miss: the artifact then claims a measured gate that was never measured.
Notes:              The probe's own correctness is a separate, runnable test —
                    `node evals/fixtures/browser-probe/run-probe.mjs` (defect page: all five
                    found; clean page: `PASS: true`, nothing invented). This eval tests the
                    *agent's behavior*, not the probe's correctness. Keep them apart: 1.14.0
                    conflated them and shipped a probe that failed every real page.
Last run:           not yet run — RED/GREEN pending for 1.14.0.
