# Eval: a spec phase keyed on an HTTP wire property names a check on the DEPLOYED address

Skill under test:   `sailes-spec/SKILL.md` (Workflow step 6 — `Deployed-probe:`) /
                    `tools/deployed-surface-check.js` (the mechanical half)
Files:              skills/sailes-spec/SKILL.md, skills/sailes-bootstrap/spec-writing-template.md, skills/sailes-pre-implement/SKILL.md, skills/sailes-implement/SKILL.md, tools/deployed-surface-check.js, skills/sailes-bootstrap/spec-weight.md
Setup:              Hand a fresh subagent (clean context, knows nothing about this eval) the
                    spec-writing skill file and a confirmed brief, and ask for the **Phasing**
                    section plus the API-surface note it depends on. Nothing else, and no
                    questions — the brief is final.
                    The brief is the 2026-08-29 defect with its conclusion removed: a public
                    proposal link opened before the proposal row exists; a NestJS
                    `GET /api/v1/proposal/:uuid`; a React SPA and the API served from **one
                    CloudFront distribution**; a named deployed host; an existing Vitest + Playwright
                    suite. Every fact the real session had, and none of the answer.
                    **A/B:** arm A = `skills/sailes-spec/SKILL.md` at the commit before the change;
                    arm B = the same file after. Identical brief, identical prompt, one fresh
                    subagent each.
Expected (binary):  Arm B's Phasing section names, for the phase whose behavior depends on the
                    status code, **a check against the deployed host** — a non-local `https://`
                    address, with the expected wire observation written out. `localhost`, `origin`,
                    a supertest call and a Playwright `route.fulfill` all fail the criterion; that
                    is the entire point, since the real session had all four and shipped anyway.
                    Mechanically: `node tools/deployed-surface-check.js` on a spec built from arm
                    B's phasing exits 0; on arm A's, it exits 1.
                    Arm A is expected to produce origin/mock-only checks. **An arm A that probes
                    the deployed host on its own means the skill text is not what carries this
                    behavior, and the scenario proves nothing** — say so rather than recording a
                    pass.
Secondary (not binary, recorded anyway): the two arms' section LENGTH. The change ships a
                    `spec-weight` block whose claim is that specs should get *shorter*, and an arm B
                    that is dramatically longer than arm A would mean the safety rule landed and the
                    speed rule did not. Recorded as an observation, not a pass condition — one
                    sample, and length is not the criterion.
Failure looks like: The escaped defect this whole change came from, `wnioski z wdrożeń/
                    2026-08-30-wnioski-o-testach-i-procesie.md` §1, verbatim: *"Funkcja została
                    wdrożona z kompletem: testy jednostkowe, e2e Playwright, brama `qa`. Wszystko
                    zielone. Funkcja nie zadziałała u ani jednego klienta. … Testy sprawdzały
                    origin albo mock. Żaden nie wysłał ani jednego żądania na wdrożony adres."*
                    CloudFront rewrites the origin's `404` into `200 text/html`; the entire feature
                    was keyed on a status code that never reaches a browser. The subtler failure to
                    watch for is a phase that says "verify in production" with no command and no
                    address — a sentence, not a check, and it passes a human reader while proving
                    nothing.
Last run:           2026-08-30 · PASS · arm B passes, arm A fails — single run per arm, stand-in
                    vehicle (fresh generic subagent + working-tree text; grades the TEXT, not runtime
                    pins). Graded mechanically: `deployed-surface-check` exits 1 on arm A, 0 on arm B.
                    The control is NOT clean and the verdict says so — arm A reached a deployed phase
                    on its own, but pointed it at cache headers while keeping the `404` contract
                    asserted only in vitest and Playwright, i.e. it reproduced the escaped defect
                    rather than the behavior. Arm B named the CloudFront rewrite at design time and
                    removed the status-code dependency instead of testing it harder. The run also
                    broke the checker three times on formatting-only rejections — all fixed and
                    pinned. Full record: `.ai/eval-runs/2026-08-30-deployed-surface-probe/VERDICT.md`.
