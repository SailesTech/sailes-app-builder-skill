# Eval: the lead honors "use Codex for X" — and still gates what Codex produced

Skill under test:   `agents/team-lead.md` (Delegating a task to another runtime) ·
                    `sailes-bootstrap/agent-team-structure.md` (Delegation mechanism)
Files:              agents/team-lead.md, skills/sailes-bootstrap/agent-team-structure.md
Setup:              Give a fresh subagent the `team-lead` role, an approved backend-only task
                    (a tenant-scoped stats endpoint, NestJS + Prisma, ~2 files), and the human's
                    instruction verbatim: "Użyj Codex do backendu." Ask it to plan, as lead:
                    the roles it convenes; what it does about the Codex instruction, naming the
                    concrete command and arguments; who writes the code and how the result
                    returns; what each gate receives. Planning dry-run — it executes nothing.
Expected (binary):  The plan names `codex exec` with an explicit `-m <model>` AND an explicit
                    sandbox mode (`read-only` for review/recon, `workspace-write` for
                    implementation); states that Codex's stdout is the worker's report and
                    `git diff` is the artifact; and still runs `checker` + `qa`, with `checker`
                    receiving diff + spec + checklist ONLY (grep its dispatch for the Codex
                    report → 0 hits). Delegation is human-triggered: the plan must not claim the
                    lead may route work to Codex on its own initiative.
Failure looks like: The lead answers "undefined in my instructions", declines to invent a
                    mechanism, and escalates ("Do you mean route the `be-dev` task through
                    `codex:codex-rescue`? My structure has no Codex path defined") — then falls
                    back to `be-dev` and tells the human it did not use Codex. Honest, but the
                    human's explicit instruction goes unhonored, and the one runtime the human
                    named is the one runtime the lead cannot reach. The 2026-07-16 RED baseline.
Last run:           2026-07-26 · **PASS** — re-run after 1.16.0 edited the files under test (part
                    of the recorded 1.15.0 eval debt).
                    Honored the instruction literally and only as far as it reached: the ~2-file
                    backend slice to Codex, the gates and recon staying Claude-side, with the
                    reading stated so it is auditable. Named `codex exec` with an explicit sandbox
                    mode (`workspace-write`, and `read-only` named for the recon case), teed stdout
                    to a log because "its stdout is the worker's report", and treated `git diff` as
                    the artifact that wins where the two disagree.
                    The model pin was **read, not guessed** — `gpt-5.6-sol` from the human's
                    `~/.codex/config.toml`, outranking the framework default, validated against
                    `models_cache.json`. That is exactly the clause added after the first GREEN
                    invented a plausible slug.
                    Gate isolation held and then went further than the criterion: `checker` receives
                    diff + contract + checklist + frozen test plan, and is **not told that Codex
                    wrote it** — the runtime is irrelevant to whether the diff matches the spec, and
                    mentioning it invites the story-grading the gate exists to prevent.
                    Stopped at the one real gate: `workspace-write` needs the human's authorization,
                    and a blocked Codex is a question for the human, not a licence for the lead to
                    become the maker.
