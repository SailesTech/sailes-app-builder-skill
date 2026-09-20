# Eval: mocking an external boundary produces a paired check on the deployed surface, not more mocks

Skill under test:   `sailes-test/SKILL.md` (§Never, §External systems) /
                    `skills/sailes-test/references/external-systems.md` (rules that hold regardless) /
                    `agents/tester.md`, `agents/qa.md`
Files:              skills/sailes-test/SKILL.md, skills/sailes-test/references/external-systems.md, skills/sailes-test/test-plan-template.md, agents/tester.md, agents/qa.md, agents/checker.md
Setup:              Hand a fresh subagent (clean context) the `sailes-test` skill and a
                    code-complete feature whose behavior depends on a response the app does not
                    produce: a frontend that shows a waiting screen when
                    `GET /api/v1/proposal/:uuid` answers `404`, with both the SPA and the API served
                    from a single CDN distribution. Ask for the test plan — the frozen case list,
                    not the code.
                    The trap is that the obvious plan is the one that shipped the defect: a
                    Playwright test with `route.fulfill({status: 404})`, which mocks precisely the
                    boundary the feature depends on and is green regardless of what the CDN does.
Expected (binary):  The plan declares, for the mocked external boundary, a **pair** — one check of
                    that same boundary on the deployed environment, named as a command with an
                    address — and says in one line what the mock proves and what only the pair can.
                    A plan that reaches the same coverage by adding more mocked cases FAILS,
                    however thorough it is: volume at the wrong surface is the failure mode under
                    test, and the source measured 44 assertions that would not have caught this.
                    Also binary, in the other direction: the plan must **not** grow. A pair is one
                    command. A plan that pairs every internal double as well has misread the rule
                    — the distinguishing test is who can rewrite the response, and nothing rewrites
                    a repository the app owns.
Failure looks like: `wnioski z wdrożeń/2026-08-30-wnioski-o-testach-i-procesie.md` §2, verbatim:
                    *"e2e mockujący dokładnie tę granicę, której dotyczy … Dowiódł, że front reaguje
                    na 404, którego rzeczywistość nigdy nie dostarcza. To jest test, który dał
                    fałszywą pewność bramie QA. Nie bezwartościowy — szkodliwy BEZ pary w postaci
                    sprawdzenia na wdrożonym środowisku."*
                    The subtler failure: a plan that lists "manual check on staging" as the pair.
                    Staging behind no CDN answers the same wrong question origin does; the pair
                    names the address that customers hit, or it is not a pair.
Last run:           2026-09-20 (at 41434e2) · **PASS** · stand-in (general-purpose sonnet, working-tree text).
                    Re-run after 1.36.0 P1 edited `agents/checker.md`. The plan picks the mock AND declares
                    the pair: `curl -s -D - -o /dev/null <deployed-origin>/api/v1/proposal/<uuid>` against
                    the real CDN address, expecting `404` with a `content-type` that is **not** `text/html`,
                    and states that a `200 text/html` makes the frontend's 404 branch dead code in
                    production regardless of a green mocked suite. It also names the trade: once the pair
                    is proven, the mocked assertions of that boundary stop counting as evidence about
                    production. Record: `.ai/eval-runs/2026-09-20-harness-guards/VERDICT.md`
Prior run:          2026-09-13 (at 6995c93) · **PASS** · first run, stand-in (Sonnet `tester`). The
                    plan's External-boundary row X1 names the CDN as the mocked boundary, the pair as
                    one `curl` against `https://portal.example-client.com/api/v1/proposal/<uuid>` →
                    `404` non-HTML, and a one-paragraph trade (no deployed Playwright run added). No
                    pair for the internal `ProposalRepository`. It read the spec-cited
                    `infra/cloudfront.yaml` and flagged the distribution-wide 403/404 → 200 rewrite. A
                    first fixture draft carried the answer in a `Deployed-probe:` and was fixed before
                    dispatch. Record: `.ai/eval-runs/2026-09-13-p6-evals/VERDICT.md`. Runs read doctrine
                    at `d6e6e01` unless noted; up to `6995c93` doctrine changed only in two sub-teams
                    sentences (`a6dccd3`, G23) and one integrity-gate sentence in `qa.md`/`qa.toml`
                    (`6995c93`, G28), checked by `git diff`, so the pin is a recorded judgment (G26),
                    not a re-run.
