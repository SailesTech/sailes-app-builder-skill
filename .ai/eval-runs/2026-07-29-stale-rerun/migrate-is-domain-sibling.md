# Verdict — `migrate-is-domain-sibling`

**Date:** 2026-07-29
**Scenario:** `evals/migrate-is-domain-sibling.md`
**Repo state graded:** branch `feat/adhd-mode-ab` @ `888b7ce`, working tree clean (`git status --porcelain` empty).
Re-run because the scenario went STALE: `skills/README.md` gained two skill-table rows and `AGENTS.md`
gained a `## Answer shape` section (`AGENTS.md` differs from `main` by +39/-1; the README rows are already on `main`).

**Verdict: PASS**

---

## Vehicle — STAND-IN, not the registered role type

`general-purpose` subagent pointed at **copies of the working-tree files**. This is the eval-runner's
default vehicle and it is what the result covers: **a stand-in grades the TEXT.** It says nothing about
runtime pins (which model actually serves `sailes-migrate` consumers), nothing about tool allow-lists,
and nothing about what the deployed plugin serves from `main` — the plugin tracks `main`, and the
`AGENTS.md` under test here exists only on this branch.

Harness-measured for the agent I spawned directly: 63,210 subagent tokens, 128,401 ms, 11 tool uses,
agent id `a3fd2ad88ba7176f2`. Nothing else about the run is measured.

## The fixture — what was actually created

The scenario's Setup requires a *fresh subagent given the sailes-migrate skill*, asked
`"gdzie w naszym pipeline siedzi migracja i kiedy ją odpalić?"`. The condition was built, not described:

An isolated fixture directory outside the repo (scratchpad `fixture-migrate-sibling/`) holding
**byte-identical copies of the working-tree files**, verified by sha256 *before* dispatch:

| File in fixture | sha256 | matches repo file |
|---|---|---|
| `AGENTS.md` | `b86ac020…4b5cf2fa` | `AGENTS.md` ✔ |
| `skills/README.md` | `05205e90…1aa88dd5` | `skills/README.md` ✔ |
| `skills/sailes-migrate/SKILL.md` | `3311ca4c…5d14bdb00` | `skills/sailes-migrate/SKILL.md` ✔ |

plus the skill's five reference files (`methodology.md`, `judge-setup.md`, `rulebook-template.md`,
`parallel-translation.md`, `cost-and-gates.md`) — 8 files total, asserted present with sizes before dispatch.

**Why copies rather than the repo paths:** an agent loose in the repo can read `evals/migrate-is-domain-sibling.md`,
which states the expected answer verbatim. The fixture was leak-checked (`grep -rl "Expected (binary)"` → no hits).
The brief also forbade reading outside the fixture directory, using the web, and invoking any plugin skill
(the plugin would have served the `main` copy alongside the working-tree copy — two versions of the doctrine
in one context, the failure mode step 2 of the eval-runner skill warns about).

The dispatch brief carried the scenario's question verbatim, in Polish, framed as a developer asking it,
with **no hint of the expected answer** and a **file deliverable** (`out/answer.md`, "no file = task not done").

## Criterion and grading

Quoted from the scenario, `Expected (binary)`:

> It positions sailes-migrate as an independently-invocable DOMAIN SIBLING (like sailes-pipedrive /
> sailes-hosting) — NOT inserted as a numbered phase of the linear build pipeline; it reuses existing
> roles (explorer/team-lead/be-dev/fe-dev/checker/qa) rather than defining new ones.

Graded from the **artifact on disk**, not the agent's summary message:
`.ai/eval-runs/2026-07-29-stale-rerun/migrate-is-domain-sibling.artifact.md`
(copy of the produced `out/answer.md`, 10,738 bytes — the scratchpad original is ephemeral).

**Clause 1 — domain sibling, independently invocable.** Met. The artifact's first section is headed
*"Gdzie siedzi: **obok pipeline'u, nie w nim**"* and opens: *"`sailes-migrate` to **domain sibling** —
dokładnie ta sama kategoria co `sailes-pipedrive` i `sailes-hosting`. Wołasz ją **samodzielnie**; nie ma
numeru fazy i nie wpina się w numerację faz build."* It then renders the linear pipeline
(`sailes-start` → wayfinder/discovery/bootstrap/design/spec → pre-implement → implement) explicitly noting
*"migracji w nim nie ma"*, and places migrate in the AGENTS.md **Task router** next to `sailes-diagnose`.

**Clause 2 — not a numbered phase.** Met, and defended rather than merely omitted: the artifact quotes the
skill's own Red Flag — *"Wpinasz `sailes-migrate` jako fazę liniowego pipeline'u build (to sibling, nie faza)"* —
and adds *"To nie jest kwestia stylu, tylko reguła."* No "Phase X" label is applied to migration anywhere in
the file. The failure mode in `Failure looks like` does not appear.

**Clause 3 — reuses existing roles, invents none.** Met. Named reuse map at each of the six steps:
`explorer` + graphify (Step 1), `team-lead` orchestrating parallel `be-dev`/`fe-dev` (Step 3) and the fixer
fan-out (Step 4), `qa` discipline (Steps 0 and 5), `checker` + `tester` + `qa` on the parity gate (Step 6),
`sailes-pre-implement` as the feasibility lens. The words "tłumacz"/"fixer" appear as *jobs given to
`be-dev`/`fe-dev` under `team-lead`*, not as new agent types — no new role is defined, named as a type, or
given its own tooling.

Not required by the criterion but observed, consistent with the 2026-07-28 run: the judge-before-fan-out
invariant is quoted as the hard rule with a five-item pre-fan-out checklist; DB-**schema** migrations are
routed to `sailes-database` and broken systems to `sailes-diagnose`; structure-preserving is stated as the
default and redesign as an explicit mode.

## What this run does NOT establish

1. **Nothing about the runtime.** Stand-in vehicle. No claim about the model pin, the tool allow-list, or
   fan-out capability of any registered role — a generic agent ran on this session's model with this
   session's tools.
2. **Nothing about what users actually get today.** The plugin serves from `main`; the `## Answer shape`
   section in the `AGENTS.md` graded here exists only on `feat/adhd-mode-ab` at `888b7ce`.
3. **The `## Answer shape` change was not isolated.** This is a single-arm re-run, not an A/B. It shows the
   post-change text still holds the sibling positioning; it does not attribute anything to that change, and
   it measures no effect of it.
4. **One sample, one phrasing, one language.** A single dispatch of one Polish question. No claim about
   variance across runs, about English phrasings, or about more adversarial framings (e.g. a user who
   asserts "migracja to Faza 4" and must be corrected).
5. **Residual contamination that could not be removed.** Any subagent in this session sees the registered
   plugin's skill listing, whose `sailes-migrate` description already contains
   *"Domain sibling — jak sailes-pipedrive/sailes-hosting — NIE jest fazą liniowego pipeline'u build"*.
   That string is itself material under test (the skill's own frontmatter), so it is not foreign doctrine —
   but the artifact's positioning cannot be proven to rest on the body text alone.
6. **Reference files beyond `SKILL.md` were supplied and read.** The scenario's `Files:` line names three
   files; the fixture gave the whole skill folder ("give it the skill"). A `SKILL.md`-only run was not
   performed, so this does not establish that `SKILL.md` alone suffices.
7. **No claim about the other two files' new content.** The two added `skills/README.md` rows and the
   `Answer shape` section were present in the graded text but were not independently probed.

## Not fixed, not touched

No doctrine file was edited by this run. The scenario's `Last run:` line was updated with the verdict —
that is the record, not the material under test.
