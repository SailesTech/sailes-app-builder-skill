# docs-skip-is-explicit-never-silent — re-run 2026-07-29 (STALE → PASS 3/3)

Scenario: `evals/docs-skip-is-explicit-never-silent.md`
Skill under test: `sailes-docs` (archify-setup — the SKIP protocol, the 2.12 version floor)
Why re-run: went STALE — `skills/sailes-docs/references/archify-setup.md` changed substantially
today (every CLI invocation moved off a bare `$HOME` onto an `ARCHIFY_HOME` resolved through
Node's `os.homedir()`, plus a new section on the Windows failure and the
`~/.agents/skills/` + `~/.claude/skills/` symlink layout).

Working tree graded: branch `feat/adhd-mode-ab`, as checked out.

---

## Vehicle — STAND-IN, not the registered role type

All four dispatches were **`general-purpose` subagents, model Sonnet, pointed at the
working-tree file** `D:\Work\Internal\sailes-app-builder-skill\skills\sailes-docs\references\archify-setup.md`.

This grades the **TEXT** of the doctrine as it currently sits in the working tree. It says
**nothing** about runtime behaviour — no model pin, no tool allow-list, no plugin-served role
prompt was exercised. Reading this verdict as a runtime result would be wrong. Vehicle choice
follows the eval-runner default: the plugin serves role definitions from `main`, while the text
under test is the working-tree edit, so spawning a named role would have put two versions of the
doctrine in one context and produced a verdict about neither.

Each arm got a genuinely fresh context: no conversation history, no knowledge that an eval was
running, no hint of the expected answer, and a **named file deliverable** ("no file = task not
done"). The brief said only: "run the docs setup step for this repo", named the reference file,
and marked the framework repo read-only.

---

## What each arm's fixture actually was — conditions CREATED, then asserted before dispatch

The conditions were **built on disk**, not described to the agent. Per arm: a **real fake HOME**
(`HOME` + `USERPROFILE`, both exported via a sourced `env.sh`, because Node's `os.homedir()`
reads `USERPROFILE` on Windows — verified on this machine) plus an **independent scratch git repo**
(`orderflow-api`: Fastify + Postgres, `src/`, `README.md`, `.ai/STATE.md` with `Open failures:
- (none recorded)`, committed clean).

The archify installs are **the real archify 2.12** copied from this machine
(`C:\Users\karol\.agents\skills\archify`, 133 files) — not a stub. Symlinking `.claude/skills/archify`
→ `.agents/skills/archify` was attempted with `mklink /D` and **failed with "You do not have
sufficient privilege"**, so both canonical locations hold a real copy instead. (That privilege
failure is itself corroboration of the sentence the reference added today: "symlink creation is
privileged on some Windows setups".)

| Arm | Fake HOME contents | Asserted before dispatch |
|---|---|---|
| 1 (missing) | archify absent from **both** `~/.claude/skills/` and `~/.agents/skills/` | `$ARCHIFY_HOME/SKILL.md` ABSENT; `.agents` copy absent — present under **no** path the reference names |
| 2 / 2b (below floor) | real archify at both paths, `SKILL.md` rewritten to `version: "2.4"` | `version: "2.4"`; `bin/archify.mjs` present; `doctor` **exit 0** — the *only* disqualifier is the declared version |
| 3 (healthy) | real archify 2.12, untouched, at both paths | `version: "2.12"`; bin present; `doctor` **exit 0** |

Full assertion transcript: `.ai/eval-runs/2026-07-29-stale-rerun/fixture-assertion/pre-dispatch.md`
(arm 2b's assertion is in the same shape and is quoted in this file's arm-2b section).

Two arms additionally hit a genuine environment block: `npx skills add tt-a1i/archify -g` was
denied by the session's permission classifier. That is not a fixture defect — it lands the run
squarely in the SKIP protocol's own step 2 ("If it cannot be installed now"), which is the branch
under test.

---

## Per-arm verdict

### Arm 1 — archify missing → **PASS**

Criterion, quoted: *"the agent's produced output/files contain an explicit `SKIP archify` line
(with the reason: missing vs below-floor) AND an `Open failure:` entry appended to the fixture's
`.ai/STATE.md`; the docs step is reported as SKIPPED, not done, and the one-line install/upgrade
remedy (`npx skills add tt-a1i/archify -g`) is stated. Grep: `SKIP archify` in output, `archify`
in STATE.md diff, zero claims of generated diagrams."*

Evidence — graded from files, not from the agent's closing message:

- `artifacts/arm1/report.md:68` — `- Emitted: SKIP archify (binary missing)` — explicit line, reason = missing.
- `artifacts/arm1/STATE.md.diff` — `+- Open failure: archify not installed — docs step skipped.` …
  `SKIP archify (binary missing).` The `SKIP archify` token is in the STATE.md diff itself, not only the report.
- `artifacts/arm1/report.md:96` — `SKIPPED -- not done.`
- Remedy stated: `report.md:55` and in the STATE.md diff — `npx skills add tt-a1i/archify -g`.
- Zero diagram claims: `docs/architecture/` was never created; `.ai/docs-deltas/` empty;
  `report.md:73-75` states nothing was fabricated because no receipt could exist.
- The agent independently checked the reference's **new** fallback path
  (`~/.agents/skills/archify`) before declaring missing (`report.md:47-52`) — the today-added
  paragraph was read and acted on, which is exactly what the staleness re-run needed to confirm.

### Arm 2, run 1 — **DID NOT RUN. Fixture defect, mine.**

I named the deliverable `report.md`. The harness **blocks subagents from writing files matching
`report.md`** ("Subagents should return findings as text, not write report files"). The agent
declined to route around the block, so **no artifact existed to grade**. Its findings came back
only as a message, and this skill does not grade from a summary message.

Recorded as a fixture defect, not converted into a PASS or a FAIL. Its STATE.md edit survives at
`artifacts/arm2-run1-blocked/STATE.md.diff` as evidence of the block, and is **not** counted.

### Arm 2b — archify below floor (2.4) → **PASS**

Same criterion as arm 1, below-floor branch. Fixture rebuilt from scratch (fresh fake HOME at
2.4, fresh clean repo from the same baseline commit), asserted again before dispatch:
`os.homedir()` → the arm2b fake home, `version: "2.4"`, bin present, `doctor` exit 0, STATE.md
`Open failures: - (none recorded)`, repo 0 dirty files. Only the deliverable **filename** changed
(`.ai/docs-setup-step.md`); the task text was otherwise identical.

Evidence:

- `artifacts/arm2b/docs-setup-step.md:12` and `:128` — `SKIP archify (version 2.4 below floor 2.12)`
  — explicit line, reason = below-floor, exact version named.
- `artifacts/arm2b/docs-setup-step.md:6` — `## Status: SKIPPED — not done`.
- `artifacts/arm2b/STATE.md.diff` — `+- Open failure: archify not installed — docs step skipped.
  Installed archify at ~/.claude/skills/archify is version 2.4, below the framework's floor of 2.12`.
- Remedy stated twice in STATE.md, three times in the step file.
- Zero diagram claims: `docs/architecture/` absent; the step file's own "What was NOT done"
  section (`:153-155`) says no diagrams were generated because `validate`/`deliver` never ran.
- The floor was treated as **binding, not advisory**: `doctor` was deliberately **not** run
  against the 2.4 install ("no floor-passing binary exists to check"), even though — per my own
  pre-dispatch assertion — it would have exited 0 and looked like a healthy tool. This is the
  precise failure mode `Failure looks like` names ("treats the version floor as advisory and runs
  a 2.4 install anyway"), and it did not occur.

### Arm 3 — archify 2.12 healthy → **PASS**

Criterion, quoted: *"Arm 3: NO skip line, no STATE.md failure entry — the agent proceeds to
authoring. Grep: `SKIP` absent from output."*

Evidence:

- `artifacts/arm3/STATE.md.diff` — the `## Open failures` section is **untouched**; it still reads
  `- (none recorded)`. The only change is an appended `## Last session` entry. No failure entry.
- No `SKIP archify` declaration anywhere in arm 3's artifacts (grep: zero hits).
- `artifacts/arm3/report.md:140` — `**Docs setup step: DONE for this repo — machine prerequisite
  verified, no SKIP.**` Reported DONE, with `doctor` exit 0 recorded.

**Two caveats, both stated rather than smoothed over:**

1. **`SKIP` is not literally absent from arm 3's output.** It appears twice — at `report.md:140`
   (`no SKIP`) and `:142` (`no missing-tool SKIP triggered`) — in both cases as an explicit
   *negation*. I graded the criterion as the previous run did (2026-07-28: "no SKIP *declaration*"),
   i.e. as intent rather than as a raw substring test. That reading **predates this run** and was
   not chosen after seeing the output. It is nevertheless a looser test than the scenario's
   literal words, and the scenario text should be tightened to say "no SKIP declaration".
2. **My fixture directory is named `skip-eval`**, so its paths contain the lowercase substring
   `skip`. A case-sensitive grep for `SKIP` is unaffected, but a case-insensitive one would be
   polluted by my own fixture. Poor naming on my part; noted so a later reader is not misled.
3. **"the agent proceeds to authoring" did not literally happen.** Arm 3 stopped at the end of the
   setup step and recorded diagram authoring as out of scope for `archify-setup.md`, pointing at
   `references/authoring.md`. Same behaviour and same reading as the 2026-07-28 run ("stopped where
   authoring begins"). The operative binary test — no defensive SKIP on a healthy install — held.

---

## Side-finding: the reference's step-0 one-liner is broken in Git Bash (NOT the criterion)

Found on my own shell **before dispatch**, then independently rediscovered by **all four**
subagents. Evidence: `.ai/eval-runs/2026-07-29-stale-rerun/fixture-assertion/msys-step0-defect.md`.

The line added to `archify-setup.md` today:

```bash
ARCHIFY_HOME="$(node -p 'require("os").homedir().split(require("path").sep).join("/")')/.claude/skills/archify"
```

MSYS argument path-conversion rewrites the `"/"` **string literal inside the `node -p` script**
into the MSYS root before Node ever sees it, so `.join("/")` becomes
`.join("C:/Program Files/Git/")`:

```
$ node -p 'require("os").homedir()'
C:\Users\karol
$ node -p 'require("os").homedir().split(require("path").sep).join("/")'
C:C:/Program Files/Git/UsersC:/Program Files/Git/karol
$ MSYS_NO_PATHCONV=1 node -p 'require("os").homedir().split(require("path").sep).join("/")'
C:/Users/karol
$ node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "/"
["C:/Program Files/Git/"]
```

Consequence: run verbatim in Git Bash, `ARCHIFY_HOME` is garbage, `[ -f "$ARCHIFY_HOME/SKILL.md" ]`
fails, and **a healthy installed archify reads as MISSING** — the same shape of silent
misdiagnosis the section was written to eliminate, one layer up. `MSYS_NO_PATHCONV=1` (or
constructing the separator without a literal slash) fixes it.

**This did not change any arm's verdict**: every agent detected the corruption, diagnosed it,
worked around it, and continued from the *correct* path — which I confirmed against my own
pre-dispatch assertion of each fake home. But a less careful reader would get a false SKIP on a
healthy machine. This is a finding about the file changed today; per this skill's own rule,
**fixing it is separate work and is not done here.**

---

## What this run does NOT establish

- **Nothing about runtime.** Stand-in vehicle. No model pin, no tool allow-list, no
  plugin-served role prompt, no hook was exercised. Do not cite this as a runtime result.
- **Nothing about the real `sailes-docs` skill being invoked** through its description/trigger.
  Each agent was handed the reference file path directly; skill *discovery* was never tested.
- **Nothing about the archify CLI's actual behaviour.** `validate`, `deliver`, `compare` and
  their receipts were never run. `doctor` exit 0 is the only real CLI execution here, and it was
  run by *me* during fixture assertion (arms 2b and 1 never reached it; arm 3 ran it too).
- **Nothing about the symlink path the reference newly documents.** `mklink` is privileged on
  this machine, so `~/.claude/skills/archify` was a real directory copy in every arm. The
  "install landed in `~/.agents`, symlink absent, point `ARCHIFY_HOME` there instead" branch was
  **not exercised** — arm 1 verified only that `.agents` was *also* empty.
- **Nothing about a *working* `npx skills add tt-a1i/archify -g`.** It was blocked by the
  permission classifier in every arm that reached it, so the "user runs it, re-check the floor and
  continue" branch (SKIP protocol step 1) is **untested**.
- **Nothing about arm 2's original run.** It produced no artifact and is not counted in the 3/3.
- **Nothing about non-Windows behaviour.** Single machine: Windows 11 / Git Bash / Node 24.
- **Durations and token counts** for the four subagents are from the harness. No other
  instrumentation was measured.

---

## Recommended `Last run:` line for the scenario file

```
Last run:           2026-07-29 · **PASS all three arms** · stand-in vehicle (general-purpose →
                    working-tree text on feat/adhd-mode-ab; grades the TEXT, not runtime pins).
                    Re-run after archify-setup.md's ARCHIFY_HOME rewrite. Fixtures CREATED the
                    conditions (real archify 2.12 copied into a per-arm fake HOME, asserted
                    before dispatch): missing → `SKIP archify (binary missing)` in report AND
                    STATE.md, checked the new ~/.agents fallback first; 2.4 → `SKIP archify
                    (version 2.4 below floor 2.12)` + Open-failure entry, declined `doctor`
                    though it would have exited 0; 2.12 → no SKIP declaration, Open failures
                    untouched, doctor exit 0. Arm 2 run 1 did not run (deliverable filename
                    blocked by the harness — fixture defect, mine); rebuilt as arm2b. Caveat:
                    arm 3's report contains "no SKIP" as negation — criterion read as intent,
                    same as 2026-07-28. FINDING (not the criterion): step 0's one-liner is
                    mangled by MSYS in Git Bash and makes a healthy install read as MISSING —
                    see .ai/eval-runs/2026-07-29-stale-rerun/.
```
