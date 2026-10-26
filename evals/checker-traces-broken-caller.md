# Eval: `checker` follows a changed return shape to a caller the diff does not touch

Role under test:    `checker`
Files:              agents/checker.md, codex-agents/checker.toml
Covers:             spec 2026-10-26-review-md-i-katy-poprawnosci P1.b (angle C: for every changed
                    function, find its callers by symbol, including those in files outside the diff).
Setup:              Materialise scenario **b** of `evals/fixtures/checker-correctness/`
                    (`sh evals/fixtures/checker-correctness/make-repo.sh b <empty-dir>`). Give a fresh
                    subagent the `checker` role definition from the working tree, the diff `BASE..HEAD`,
                    the spec it prints, and read access to the repo. The diff changes `getNote` to return
                    `archivedAt` in place of the `archived` boolean, exactly as the spec says, and its
                    tests are green. `src/export/csv.js` calls `getNote` and reads `note.archived`; the
                    diff does not touch it, so after the change every archived note exports as `active`.
                    The spec names neither the export nor `csv.js`. Give it nothing else: no maker
                    report, no hint that a caller exists.
Expected (binary):  One finding names **`src/export/csv.js`** with a line number (the `note.archived` read)
                    and states the wrong result (an archived note exported as `active`), graded
                    **Important**, `category` `correctness`. The verdict is **CHANGES-REQUIRED**. A
                    finding that stays inside `notes.service.js` and the test file, or that mentions
                    `csv.js` without a line or without the consequence, is a **FAIL**.
                    The run file records the SHA of the `checker` text it graded
                    (`git log -1 --format=%h -- agents/checker.md`) — spec R2.
Failure looks like: APPROVE or NITS: the changed function matches the spec word for word, its tests pass,
                    and the only file that breaks is one the diff never opens. A patch read cannot find
                    it by construction — the line that is wrong is not in the diff — which is the same
                    shape as the absent handler `checker-reports-what-the-diff-omits` guards, one
                    level down.
Control arm:        The same repo, diff and spec against the CURRENT `agents/checker.md` at base
                    `3e43672` (`git show 3e43672:agents/checker.md`). It MUST fail. The role's two
                    mandatory sections compare the diff with the spec's surface, and the spec's surface
                    does not include the export; `checker.md:22` then discards any finding that has no
                    clause. There is no instruction to search for callers of a changed function. If the
                    control names `csv.js` the fixture leaks (a spec mention, or a red test) — fix it.
Last run:           2026-10-26 (at ba29d79) · **PASS** · `checker.md` = treść z 4bd7c74, stand-in sonnet, jedna próbka. Kontrola @381bbda: FAIL tylko na etykiecie (wykrycie było). Eval mierzy kontrakt formatu. Pliki: `.ai/eval-runs/2026-10-26-review-md/{control,treatment-r1,treatment-r2}-b-*.md`.
