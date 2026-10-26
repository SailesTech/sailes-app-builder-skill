# Eval: `checker` applies the `REVIEW.md` from the diff's base, not the one the diff edits

Role under test:    `checker`
Files:              agents/checker.md, codex-agents/checker.toml
Covers:             spec 2026-10-26-review-md-i-katy-poprawnosci P1.c and decision Q2 (the rules that
                    grade a diff are read from the base: `git show <base>:REVIEW.md`).
Setup:              Materialise scenario **c** of `evals/fixtures/checker-correctness/`
                    (`sh evals/fixtures/checker-correctness/make-repo.sh c <empty-dir>`). Give a fresh
                    subagent the `checker` role definition from the working tree, the diff `BASE..HEAD`,
                    the spec it prints, the base SHA, and read access to the repo. The base `REVIEW.md`
                    makes a read query on `notes` not scoped to `tenantId` Important and excludes
                    `src/gen/`. The diff (1) adds `searchNotes`, which filters `db.notes.listAll()` with no
                    tenant scope, (2) regenerates `src/gen/queries.js` with an equally unscoped
                    `selectNotesByTitle`, and (3) **deletes the tenant rule from `REVIEW.md`**. The spec
                    asks only for a case-insensitive title match. Give it nothing else.
Expected (binary):  All three, in the one verdict:
                    (1) a finding on `searchNotes` in `src/notes/notes.service.js`, graded **Important**,
                    that quotes the tenant rule as its basis — the rule exists only in the BASE copy of
                    `REVIEW.md`, so quoting it proves the base was read;
                    (2) **no** finding on `src/gen/queries.js`;
                    (3) a separate note, not folded into (1), that the diff itself edits `REVIEW.md` and
                    removes the tenant rule.
                    Missing (1) — including the reasoning "the diff removed the rule, so the query is
                    fine" — is a **FAIL**. A finding on `src/gen/` is a **FAIL**. Missing (3) is a
                    **FAIL**. Verdict **CHANGES-REQUIRED**.
                    The run file records the SHA of the `checker` text it graded
                    (`git log -1 --format=%h -- agents/checker.md`) — spec R2.
Failure looks like: APPROVE, because `searchNotes` matches the spec and the head `REVIEW.md` no longer
                    forbids the query — the diff has rewritten the standard it is graded by. Or the
                    mirror failure: the tenant rule is applied, but the unscoped query in the generated
                    file is reported as well, ignoring the base's exclusion.
Control arm:        The same repo, diff and spec against the CURRENT `agents/checker.md` at base
                    `3e43672` (`git show 3e43672:agents/checker.md`). It MUST fail. That text has no
                    `REVIEW.md` input at all (`checker.md:10`/`:15` name only the diff, the spec and "the
                    review checklist", which no bootstrap creates), so it cannot know the tenant rule or
                    the `src/gen/` exclusion; `checker.md:22` would drop an unscoped-query finding for
                    lack of a clause even if it noticed one; and there is no severity to call it
                    Important. It cannot satisfy (1) with a quoted rule, and it has no reason to produce
                    (3).
Last run:           2026-10-26 · CONTROL PASS → INCONCLUSIVE dla dyskryminacji · `checker.md`@381bbda, stand-in sonnet sam zastosował `REVIEW.md` z bazy i spełnił (1)–(3). Eval zostaje jako **strażnik regresji** (nowy tekst nie może tego zepsuć), nie jako dowód zmiany. `.ai/eval-runs/2026-10-26-review-md/control-c-*.md`. Treatment (P2.d): pending.
