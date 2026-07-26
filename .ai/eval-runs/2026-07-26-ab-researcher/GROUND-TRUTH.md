# Ground truth — external tools named across skills/

Derived mechanically on 2026-07-26, BEFORE either arm ran, so it is not an opinion formed by
reading the arms. Command per row: `grep -rlio <tool> skills/`, counted by file.

| tool | files naming it | example locations |
|---|---|---|
| `railway` | 19 | `skills/README.md`, `skills/sailes-bootstrap/agents-md-template.md`, `skills/sailes-bootstrap/modules-catalog.md` |
| `drizzle` | 17 | `skills/README.md`, `skills/sailes-bootstrap/agents-md-template.md`, `skills/sailes-bootstrap/skeleton.md` |
| `codex` | 15 | `skills/sailes-bootstrap/adopt-existing-repo.md`, `skills/sailes-bootstrap/agent-team-structure.md`, `skills/sailes-bootstrap/agentic-first-principles.md` |
| `graphify` | 12 | `skills/README.md`, `skills/sailes-bootstrap/adopt-existing-repo.md`, `skills/sailes-bootstrap/agents-md-template.md` |
| `playwright` | 12 | `skills/sailes-bootstrap/agentic-first-principles.md`, `skills/sailes-bootstrap/agents-md-template.md`, `skills/sailes-bootstrap/decision-engine.md` |
| `inngest` | 11 | `skills/README.md`, `skills/sailes-async/async-compendium.md`, `skills/sailes-async/lessons.md` |
| `chrome-devtools` | 9 | `skills/sailes-bootstrap/codex-config-template.md`, `skills/sailes-bootstrap/decision-engine.md`, `skills/sailes-bootstrap/repo-done-checklist.md` |
| `testcontainers` | 8 | `skills/sailes-bootstrap/agentic-first-principles.md`, `skills/sailes-bootstrap/skeleton.md`, `skills/sailes-bootstrap/spec-writing-template.md` |
| `vitest` | 5 | `skills/sailes-bootstrap/agentic-first-principles.md`, `skills/sailes-bootstrap/spec-writing-template.md`, `skills/sailes-bootstrap/stack-baseline.md` |
| `stryker` | 3 | `skills/sailes-test/references/techniques.md`, `skills/sailes-test/SKILL.md`, `skills/sailes-test/test-plan-template.md` |

**Scoring rule.** Recall is counted per TOOL: an arm scores it if the tool appears in the arm's
findings with at least one correct file location. Version constraints and absence behaviour are
reported as colour, NOT scored — they are prose and would make this my judgement again.
