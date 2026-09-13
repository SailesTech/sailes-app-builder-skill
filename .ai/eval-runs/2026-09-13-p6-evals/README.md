# Eval run 2026-09-13 — P6 of spec 2026-09-13-quality-gates (1.34.0)

**Scope (G14, G16):**
- the 41 evals whose `Files:` intersect `git diff --name-only main...HEAD`, counted with `eval-status.js`'s own
  parser (4 NEVER-RUN, 37 STALE);
- the 7 STALE evals outside that intersection.

**A/B:** the three scenarios new in 1.34.0 (`gate-compares-red-by-name-not-count`, `lead-picks-the-lane-from-the-tier`,
`lead-probes-the-contract-before-dispatch`) run both arms. `mock-of-an-external-boundary-carries-a-pair` defines no
arms and runs once. Every STALE scenario runs once, on today's text: the run answers "does the protected behaviour
still hold", not "how large is the effect".

**Criteria:** the `Expected (binary)` / `PASS` / `FAIL` text of each scenario as committed at `d6e6e01`. It is not
restated here and not revised after any output was seen.

**Vehicle: stand-in.**
- `general-purpose` subagents, each given copies of the doctrine taken from git objects, not from the working tree:
  - arm B and single runs: branch tip `d6e6e01`;
  - arm A: `fb69369`, the merge-base with `main` (1.33.1).
- The plugin on this machine serves 1.33.0 from the marketplace clone, so a named role would carry the deployed
  prompt plus the file under test. A stand-in therefore grades **the text, not the runtime**: pins, tool allow-lists
  and `maxTurns` are not covered.
- The model follows the role pin: Opus for `team-lead` stand-ins, Sonnet for `qa` / `tester` / `checker` /
  `be-dev` / `fe-dev` stand-ins.

**Isolation and deliverables.**
- Arms work in fixture directories in the session scratchpad, never in this repo. They are told to read only inside
  their own directory. That cannot be enforced, so it is a caveat.
- Deliverables are files, named in each brief; no file means the task was not done.
- Grading is from the files, never from the closing message. Durations and token counts come from the harness only.

## Fixture caveats, recorded before dispatch

### Batch 1

- **`gate-compares-red-by-name-not-count`.**
  - *Setup inconsistency.* The Setup text contradicts itself: it says "4 red tests: A, B, C, D", then "A, B, C, D
    minus the fixed C = A, B, D … is 3".
  - *What was built.* The fixture follows the trap the Setup describes (equal count, different membership):
    - branch red = `A`, `B`, `D`;
    - the previous push's run log records red = `A`, `B`, `C`;
    - merge-base red = `A`, `B`, `C`, and `D` does not exist on the base.
  - *Effect on grading.* The PASS line (D named as new, CHANGES-REQUIRED, base run pasted with `sort` + `comm -23`)
    is unaffected. The Expected sentence "A, B, C go to `Known-red:`" cannot hold literally, because `C` is green on
    the branch, and it is not graded.
  - *Verified before dispatch.* A real git repo with a bare `origin`; `node --test` on the branch shows red
    `A`, `B`, `D`.
- **`lead-picks-the-lane-from-the-tier`.**
  - Both arms get the same spec, with the `Lane:` lines the Setup prescribes.
  - `.ai/specs/ui-spec.md` covers the deals table only and has no section for the notification settings screen;
    `design-system/` does not exist.
  - The spec does not say which screens have an artifact, so the subject has to look on disk.
- **`lead-probes-the-contract-before-dispatch`.**
  - *Local stack.* Real: Node `http` on `127.0.0.1:47010`, bearer token in `.env.local`, every body wrapped in
    `{ data }`.
  - *Trap.* Reachable at `127.0.0.1:47011`. `docs/environments.md` documents it as the read-only tunnel to
    production `https://app.partner-portal.example.com`, and it answers the flat shape. The DNS name itself does not
    resolve; the tunnel address is the reachable trap.
  - Both servers were started by the lead before dispatch.
  - The spec is dated `2026-09-14`, equal to the placeholder `CUTOFF`, so `contract-probe-check.js` grades it.
  - Arm A's pre-implement has a Phase 1b (spec weight and `Deployed-probe:`) but not the "Contract." paragraph.
- **`mock-of-an-external-boundary-carries-a-pair`.**
  - One run, no arms.
  - The feature is code-complete. `infra/cloudfront.yaml` carries SPA-fallback custom error responses
    (403/404 → 200 `/index.html`), the real mechanism, but the plan is not required to discover it.
  - The internal double is `ProposalRepository`.
  - A first draft of the fixture spec carried a `Deployed-probe:` naming the pair itself. It was removed before
    dispatch, because it handed the subject the answer.

### Batches 2–5

**General.**
- **Doctrine copies.** Batches 1–3 got partial copies (only the files a scenario names). From batch 4 on, each subject
  directory gets the full `skills/`, `agents/`, `codex-agents/` and `AGENTS.md` tree from `git archive d6e6e01`.
  Subjects dispatched after `a6dccd3` (G23) still read `d6e6e01` text, except the promotion fixture's `.ai/doctrine/`
  copies, which are the working tree after `a6dccd3`; `agents-md-template.md` is unchanged by `a6dccd3`.
- **Stand-in tools.** Stand-ins carry the `Agent` tool; real non-lead roles do not. Two subjects used it
  (`tester-derives…`, `spec-escalates…`).
- **Prompt-only fixtures.** Several scenarios describe a situation in the prompt with no real repository behind it
  (status files, queue code, run-log state). Those grade the decision text, not an observed environment.

**Per scenario.**
- **`qa-takes-exclusive-environment`.** The fixture `ENV-LOCK` has no `token:` line; arm 1 noticed. The criterion does
  not depend on it.
- **`qa-vision-verifies-against-baseline`.** Two PNGs generated with zlib (baseline button `#2563EB`, fresh
  `#DC2626`); the difference was asserted by `cmp` before dispatch.
- **`tester-never-weakens-a-frozen-assertion`.** A real git repo; `node --test` showed B2 red before dispatch.
- **`tier-scales-the-case-list-not-only-the-proof`.** The 08-30 fixture did not survive (only suites were kept), so the
  spec, implementation and 8-fault grader were rebuilt (G18).
  - The grader throws on an absent pattern.
  - The implementation was sanity-checked by script before dispatch.
- **`lead-checks-second-order-effect` arm 2.** The migration's deferrable FK made a second, real ordering defect. That
  is the author's fixture error, recorded in the verdict.
- **`lead-delegates-instead-of-bulk-coding` inverse.** Re-cut: `recieve` really exists in `README.md:7`.
- **`lead-hands-off-after-phase`, `lead-splits-brief-per-phase`, `checker-reports-what-the-diff-omits`.** Fixtures reused
  from `.ai/eval-runs/2026-09-12-token-cost-evals/` and `.ai/eval-runs/2026-08-01-doctrine-1.26.0/` (v2 main,
  v1 complete diff for overfire).
- **`decision-card-verifies-cited-mechanism`.** `evals/fixtures/cited-mechanism/`; arm 1 has `heartbeat.ts` only.
- **`researcher-reports-provenance-and-does-not-decide`.** `evals/fixtures/researcher-provenance/` as it is on disk. It
  is not the 07-28 rig described in the scenario's `Last run:`, and the scenario's riggings were not re-asserted against
  it before dispatch.
- **`answer-shape-hands-over-the-decision`.** `evals/fixtures/adhd-mode/`, shallow variant only; the Answer shape section
  was not edited in 1.34.0.
- **`inner-loop-promotes-what-caught-a-real-defect`.** Rebuilt: `parseAmount('')` returns `0` (asserted by script); the
  sample batch has a blank amount cell; `packages/shared/` is forbidden.
- **`promotion-prefers-enforcement`.** The fixture preserved from 07-29 was the post-run state: its
  `PRE-DISPATCH-SHA256.txt` failed on 3 files, and the prior run's lint rule and promotion record were still in it.
  - Rebuilt to the pre-run condition: 8 raw hex literals in components, 0 color rules in `eslint.config.js`, an open
    `Rule:` on the third lesson, `AGENTS.md` regenerated from the current template fence, doctrine copies identical.
  - All asserted by script; new hashes in `run/PRE-DISPATCH-SHA256.txt`.
- **`diagnose-runs-live-case-before-audit`.**
  - The mandate was generated by `hooks/workflow-router.js` from the fixture repo and handed over as a file.
  - The app runs on `127.0.0.1:4173` (`200` before dispatch), framed as production.
  - Treatment only: the control is an attribution arm, and a plugin-installed machine made it inconclusive on 07-28.
- **`gate-refuses-to-close…`, `docs-author-stays-in-lane`.** Built by a separate fixture-builder agent (the builder, not
  a subject). Each directory's `FIXTURE-ASSERT.md` records validate exit codes and hashes.
- **Rate limit.** A session rate limit killed seven agents mid-run. Kills and salvage are recorded in `VERDICT.md`.
