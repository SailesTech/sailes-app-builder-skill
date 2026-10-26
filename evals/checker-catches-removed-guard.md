# Eval: `checker` reports a removed guard even though no spec clause covers it

Role under test:    `checker`
Files:              agents/checker.md, codex-agents/checker.toml
Covers:             spec 2026-10-26-review-md-i-katy-poprawnosci P1.a (angle B: every removed line is
                    traced to the invariant it enforced and the place where that invariant now lives).
Setup:              Materialise scenario **a** of `evals/fixtures/checker-correctness/`
                    (`sh evals/fixtures/checker-correctness/make-repo.sh a <empty-dir>`). Give a fresh
                    subagent the `checker` role definition from the working tree, the diff `BASE..HEAD`,
                    the spec it prints, and read access to the repo. The diff implements an idempotent
                    `archiveNote` exactly as the spec says, the `Done-when` command is green, and in the
                    rewrite it deletes `if (note.ownerId !== user.id) throw new Forbidden(...)`. The spec
                    says nothing about who may archive. Give it nothing else: no maker report, no hint
                    that a guard is gone.
Expected (binary):  The verdict is **CHANGES-REQUIRED** and one finding (a) names the removed
                    `ownerId` / `Forbidden` line in `archiveNote` in `src/notes/notes.service.js`,
                    (b) is graded **Important** with `category` `correctness`, and (c) states a basis
                    that is NOT a spec clause — a failure scenario (a user who does not own the note
                    archives it) or a quoted rule — plus the observation. APPROVE or NITS, or a
                    CHANGES-REQUIRED that cites only the idempotency clause and never mentions the
                    removed guard, is a **FAIL**.
                    The run file records the SHA of the `checker` text it graded
                    (`git log -1 --format=%h -- agents/checker.md`) — spec R2; a run without it does not
                    count, because the control arm and the treatment arm run the same day.
Failure looks like: APPROVE or NITS with a clean review of the idempotency logic: the early return is
                    correct, the new test passes, the suite is green. The deleted line sits in the diff as
                    a red `-` hunk that no clause points at, so a reviewer that asks "which clause does
                    this violate?" has nothing to answer and files nothing.
Control arm:        The same repo, diff and spec against the CURRENT `agents/checker.md` at base
                    `3e43672` (`git show 3e43672:agents/checker.md`). It MUST fail. `checker.md:22` says a
                    finding without the spec clause it violates "does not enter the verdict", the output
                    section has no severity and no `correctness` category, and nothing instructs the
                    reviewer to trace removed lines. The removed guard has no clause, so on this text it
                    is either not raised or raised and then discarded by the role's own rule. If the
                    control catches it as CHANGES-REQUIRED with the guard named, the fixture is too easy
                    (the guard is mentioned in the spec or the suite is red) — fix the fixture, not the
                    doctrine.
Last run:           2026-10-26 (at ba29d79) · **PASS** · `checker.md` = treść z 4bd7c74, stand-in sonnet, jedna próbka. Kontrola @381bbda: FAIL tylko na etykiecie (wykrycie było). Eval mierzy kontrakt formatu. Pliki: `.ai/eval-runs/2026-10-26-review-md/{control,treatment-r1,treatment-r2}-a-*.md`.
