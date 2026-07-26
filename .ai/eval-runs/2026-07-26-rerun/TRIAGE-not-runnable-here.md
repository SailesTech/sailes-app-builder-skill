# Triage — four stale evals that cannot honestly be re-run on this machine

2026-07-26. Sixteen evals came back STALE once `Files:` coverage was complete. Twelve were
re-dispatched. These four were not, and the reason matters more than the count: **each needs a
condition this environment cannot create**, and running them anyway would produce a verdict about
the fixture rather than about the skill.

That is not a hypothetical failure mode here. `anchor-holds-the-line-deep-in-session` passed both
arms identically and still concluded nothing, because its fixture condensed 58 turns into ten lines
and never created the condition under test. A re-run staged on a fixture that cannot reach the
condition is worse than no re-run: it replaces "unknown" with a number.

| Eval | Condition it needs | Why this machine cannot create it |
|---|---|---|
| `bootstrap-generates-code-map` | `graphify` on PATH — the Setup states it as a precondition | Verified absent (`command -v graphify` → nothing). The eval grades whether bootstrap *builds the code map*; without the binary the agent's correct behaviour is to report the tool missing, which grades the environment, not the skill |
| `devtools-evidence-does-not-replace-a-suite-test` | The `chrome-devtools` MCP available to the agent, a just-implemented feature that writes a row, and real time pressure | The MCP is not wired into the subagents here, and the graded behaviour is a *choice under pressure* between a cheap CDP click and a real suite test. Simulating the pressure removes the thing being measured |
| `integrity-gate-reports-measurements-not-impressions` | Two arms: a rendered page with a real physical defect, with and without the browser instrument | The page fixtures exist (`evals/fixtures/browser-probe/`) and the probe runs — this is the closest of the four to runnable. What is missing is the *design-skill arm*: an agent holding the design gate with the MCP present in one arm and absent in the other. Worth building; it is a fixture job, not an environment blocker |
| `qa-vision-verifies-against-baseline` | A touched screen, a design artifact, and a previously accepted screenshot in `.ai/screens/` that the fresh screenshot deviates from | No baseline exists to deviate from, and the graded behaviour is a visual comparison against it. A synthetic baseline would be a fixture grading itself |

## What would unblock each

- **`bootstrap-generates-code-map`** — install `graphify` (validated version 0.9.23; 0.9.24 never
  shipped). Then it is a plain re-run.
- **`integrity-gate-…`** — build the two-arm design-gate fixture on top of the existing probe pages.
  The instrument half already works in both directions; only the agent-facing arm is missing.
- **`devtools-evidence-…`** and **`qa-vision-…`** — both need a running app plus the browser MCP in
  the subagent. That is an environment project, not a fixture one, and it is the same prerequisite
  for both.

## Recorded rather than quietly skipped

These four keep their existing `Last run:` lines and stay STALE in `eval-status.js`. That is the
correct reading: their recorded PASS no longer covers the files, and nothing here changed that.
Marking them re-run would be the silent-instrument trap the harness exists to prevent — and it would
be a lie told by the person who built the harness, which is worse.
