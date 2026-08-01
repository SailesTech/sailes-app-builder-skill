# Eval: a phase's Done-when covers that phase's own allowed-files list

Skill under test:   `sailes-spec` / `sailes-bootstrap/spec-writing-template.md`
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md,
                    skills/sailes-bootstrap/agent-team-structure.md (Worker brief, `Files:`)
Setup:              Give a fresh subagent the spec-writing skill and a brief whose surface is
                    deliberately WIDER than its obvious verification — e.g. "custom field
                    definitions: list them, create them, and expose a catalogue the form
                    renders from". Ask it to write Phasing & Steps, including each phase's
                    allowed-files list. Do not mention this eval's subject.
Expected (binary):  For every phase, each path on the allowed-files list is traceable to a
                    `Done-when` clause that forces it to exist — either stated inline, or the
                    phase explicitly marks a path as touched-but-not-produced with a reason.
                    Grader check: take each phase's file list, and for every path ask "which
                    Done-when clause fails if this file is never written?" A path with no
                    answer, and no stated reason, is a FAIL.
Failure looks like: A phase that may touch a route file, a handler and a schema, whose
                    `Done-when` runs the suite and greps one endpoint — so the write half of
                    the resource is on the list, is nobody's requirement, and ships absent
                    with every gate green. This is the recorded 2026-08-01 case: three such
                    gaps in one milestone, including its entire read surface, each one green
                    through `checker` because `checker` grades the diff against the phase's
                    scope and the phase's scope IS its `Done-when`.
Control arm:        Run the same brief against a spec-writing prompt with the coverage clause
                    removed. It MUST produce at least one uncovered path — otherwise the eval
                    is measuring the brief's narrowness, not the doctrine.
Last run:           not yet run — added 1.26.0.
