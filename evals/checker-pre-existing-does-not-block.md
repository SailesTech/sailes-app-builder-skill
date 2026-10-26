# Eval: a defect that predates the diff is reported as Pre-existing and does not block

Role under test:    `checker`
Files:              agents/checker.md, codex-agents/checker.toml
Covers:             spec 2026-10-26-review-md-i-katy-poprawnosci P1.d (severity Pre-existing never
                    blocks; the lead moves it to `.ai/backlog.md` with `file:line`).
Setup:              Materialise scenario **d** of `evals/fixtures/checker-correctness/`
                    (`sh evals/fixtures/checker-correctness/make-repo.sh d <empty-dir>`). Give a fresh
                    subagent the `checker` role definition from the working tree, the diff `BASE..HEAD`,
                    the spec it prints, the base SHA, and read access to the repo. The diff adds
                    `includeArchived` to `listNotes` exactly as the spec says; it is correct and its
                    tests are green. The function it edits already contains, in a line the diff does not
                    change, `mine.slice(offset, offset + pageSize - 1)`: every page loses its last note
                    (25 notes: page 1 shows 19, page 2 starts at the 21st). The line sits in the diff as
                    unchanged context. Give it nothing else.
Expected (binary):  Both, in the one verdict:
                    (1) the verdict is **APPROVE** or **NITS** — not CHANGES-REQUIRED;
                    (2) the off-by-one in `src/notes/notes.service.js` `listNotes` is reported as a
                    finding graded **Pre-existing** (naming the line, and stating it is present at the
                    base), not as Important.
                    CHANGES-REQUIRED is a **FAIL**; so is a verdict that never mentions the line (the
                    angle-A read of the whole enclosing function should surface it, and Pre-existing
                    exists so that surfacing it costs the lead no round).
                    The run file records the SHA of the `checker` text it graded
                    (`git log -1 --format=%h -- agents/checker.md`) — spec R2.
Failure looks like: CHANGES-REQUIRED: the reviewer reads the whole function, finds a real off-by-one, has
                    no way to say "not this diff's", and sends the work back to a fresh worker that did
                    not write the line. Measured upstream: 59% of review comments in a looping PR were
                    on code from before its first round — the same shape, and what drives the loop. The
                    other failure is silence, which loses a true finding.
Control arm:        The same repo, diff and spec against the CURRENT `agents/checker.md` at base
                    `3e43672` (`git show 3e43672:agents/checker.md`). It MUST fail, and either way:
                    there is no Pre-existing severity, so (2) cannot be produced; if the role reports the
                    line at all it is an unlabelled defect and the verdict becomes CHANGES-REQUIRED,
                    failing (1); if it reports nothing — `checker.md:22` requires a spec clause and the
                    spec has none about pagination — the finding is missing, failing (2).
Last run:           2026-10-26 · CONTROL FAIL (etykieta) · `checker.md`@381bbda, stand-in sonnet: APPROVE (warunek 1 OK), off-by-one wykryty jako „not a finding” bez poziomu Pre-existing. Eval mierzy kontrakt formatu. `.ai/eval-runs/2026-10-26-review-md/control-d-*.md`. Treatment (P2.d): pending.
