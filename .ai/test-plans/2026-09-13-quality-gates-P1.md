# Test plan — quality gates from the partner-portal report, P1 (`tools/contract-probe-check.js`)

Spec: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`
Phase: P1 — `Contract-probe:` field + the tool that grades it (P1.3, `Done-when`)
Risk tier: **B** (triggers fired: none of {money, auth/permissions/tenancy, idempotency,
irreversible outbound write} — Tier A does not apply; the tool writes nothing, calls nothing over
the network, and touches no user data. Fired instead: "ordinary business logic" — the contract is a
genuine decision table (field-present × valid-`n/a` × valid-fence × four forbidden-reason patterns),
with boundary-sensitive length comparison (20 chars, trim-before-count), boundary-sensitive date
comparison (`CUTOFF`), and regex-based unit segmentation (heading level, vocabulary, case) — not a
pure read or pure formatting pass. That rules out Tier C the same way it did for `token-report.js`
in the P0 precedent. No trigger here argues for raising to A: this tool gates CI locally, but "gates
every repo's CI" is not itself money, auth, tenancy, idempotency or an irreversible outbound write,
and I do not raise on judgment alone per Step 5. If the human judges the blast radius (this tool's
verdict controls whether `sailes-pre-implement` reports NOT-READY across every client repo on the
machine) severe enough to raise anyway, that is their call at freeze, not mine to assume.)
Status: **DRAFT**
Frozen: —

> `DRAFT` means no test may be written yet. The human moves it to `FROZEN`.
> Derived from the spec and the frozen contract in the brief only. `tools/contract-probe-check.js`,
> `tools/contract-probe-check.test.js` and `tools/fixtures/contract-probe-check/` were **not** opened
> or listed while writing this — they are the implementer's parallel worktree and this one has no
> path to them. The only implementation file read for CLI-shape convention, per explicit instruction,
> was `tools/deployed-surface-check.js` + its test — noted inline below wherever its shape was used,
> and wherever the frozen contract differs from it the contract wins (documented below: exit-2-for-
> unreadable-file is one such difference).
> Base: `d9d50c6` on `feat/1.34.0-quality-gates` (fast-forwarded from `fb69369`; `.ai/runs/2026-09-13-
> quality-gates.md` confirmed present after the merge).

## I could not derive this from the spec — please decide

❓ **Q1 — is the `n/a` separator mandatory or optional?** The contract's valid form (a) reads
`n/a` + separator (`—`,`–`,`-`,`:`) + reason ≥ 20 chars. `deployed-surface-check.js`'s own `n/a`
parser makes the separator **optional** (`n\/?a\b\s*(?:[—–:-]\s*)?(...)`), but our contract text
lists it as part of the required shape, not as an optional decoration. If a spec author writes
`n/a because the local seed has no matching endpoint yet, ticket #402` (a real, ≥20-char reason,
no dash or colon at all) — pass or fail? **My proposed default (case CP40): fail** — the contract
names a separator as part of form (a), and there is no form (a′) without one. Affects **CP40**.

❓ **Q2 — a calendar-invalid but date-shaped basename prefix.** `2026-13-40-notes.md` matches
`YYYY-MM-DD` shape but names month 13, day 40. Is it (a) parsed as a real date, which most date
libraries turn into an overflowed-but-valid `Date` object (month 13 → next January), (b) rejected as
"no date" and therefore not graded, or (c) undefined/crashes? **My proposed default (case CP39):
treat as "no date in file name"** — a check that silently overflows month 13 into January of the
following year is a worse failure mode than refusing to grade a file whose name it cannot parse.
Affects **CP39**.

❓ **Q3 — mixed CLI args, one unreadable + one valid.** The contract says exit 2 = "no arguments or
an unreadable file." It does not say what happens when args also include a file that reads fine.
Candidates: (a) exit 2 always wins the moment any file can't be read, regardless of the others'
results; (b) process the readable ones, report their pass/fail, and only add the unreadable one's
error — exit code becomes "2 if any unreadable, else 1 if any failed, else 0"; (c) skip the
unreadable file with a warning and exit based on the readable ones alone. **My proposed default
(case CP41): (a)** — the contract groups "no arguments" and "an unreadable file" under the same exit
code, which reads as "the tool could not even establish what it's grading," a harder failure than a
graded phase failing its rule. Affects **CP41**.

❓ **Q4 — the undated-spec branch is explicitly provisional in the contract itself.** ("The undated
case is provisional — flag it in the plan as an open question.") Beyond Q2's calendar-validity edge,
is "no date in file name" meant to be a **permanent** exemption (e.g. internal design notes,
`AGENTS.md`-adjacent docs that live under `.ai/specs/` by convention but were never meant to be
graded), or a **stopgap** the human expects to close later (e.g. by requiring every spec to be
dated)? This doesn't block writing CP13 (which only needs "exit 0, with this message" today), but it
changes whether CP13 should be treated as durable behavior or as something `checker`/`qa` should
flag for follow-up when the constant graduates from provisional. No case ID blocked; recorded because
silently treating it as permanent is exactly the kind of unstated assumption Step 1 exists to surface.

❓ **Q5 — is `CUTOFF` introspectable by the suite, or must the boundary be tested by hardcoding a
date?** The contract instructs "design cases so the suite does not hard-code a date that would break
when the constant moves" for the *graded-vs-not* partition (CP12/CP13/CP35 use far-past/far-future
dates for exactly this reason), but the **exact-boundary** straddle pair (CP14/CP15 — the last
excluded day vs. the cutoff day itself) cannot be written without knowing where the boundary sits.
**My proposed default:** the module exports `CUTOFF` (`module.exports.CUTOFF` alongside the CLI
entry point, the same pattern `deployed-surface-check.js` uses for its own internal constants/helpers)
so the frozen suite can `require()` it and compute `CUTOFF` and `CUTOFF - 1 day` at test-run time
without a literal date anywhere in the suite. If the implementer does not export it, the fallback is
reading the constant out of the source text with a narrow regex (`/CUTOFF\s*=\s*'([\d-]+)'/`) — worse,
because it silently breaks if the declaration's shape changes, but it keeps CP14/CP15 non-hardcoded.
Affects **CP14, CP15**.

❓ **Q6 — exact wording of the stderr line is unspecified.** The contract requires the failure line
to *contain* the spec basename, the phase heading text, and "which rule failed," but names no exact
string for any rule (compare `deployed-surface-check.js`, which also leaves its own error prose
unspecified beyond the same three components). I am treating this as **not blocking**: every failing
case below asserts on the three required components via loose substring/regex matching, never on an
exact message string, so a wording change during implementation cannot turn a correct implementation
red. Flagging in case the human wants a stronger contract (e.g. a fixed rule-name vocabulary) before
freeze — no case ID currently depends on exact wording.

## NOT testing (deliberately)

- **`skills/sailes-pre-implement/SKILL.md`'s `CLAUDE_PLUGIN_ROOT` invocation line (P1.2)** — doctrine
  text, checked by `grep` in the phase's own `Done-when`, not by this tool's behavior.
- **`package.json`'s test-chain wiring and `AGENTS.md`'s suite count (P1.3's second file group)** —
  meta-level bookkeeping the phase's `Done-when` checks directly (`npm test` exit 0, count match);
  not a behavior of `contract-probe-check.js` itself.
- **`evals/lead-probes-the-contract-before-dispatch.md` (P1.4)** — model behavior, goes to evals per
  this repo's own rule (`AGENTS.md`: "Model behavior... gets an eval"), not this suite.
- **Exact stderr wording beyond the three required components** — see Q6. Locking exact prose here
  would freeze copy that has no behavioral consequence and make a harmless rewording a false red.
- **Performance at scale** (thousands of spec files, multi-MB documents) — the contract states no
  performance requirement; only correctness of the decision table.
- **Windows path handling** — this is a pure-Node text tool with no shell/`sh`/`awk` step; the
  portability risk this repo's `AGENTS.md` names elsewhere is specific to shell hooks, not this tool.

## Requires you

🔀 **External boundaries: none.** `contract-probe-check.js` reads only local `.md` files named on
its command line — no network call, no CDN/proxy/gateway/CRM/payment/auth-provider boundary anywhere
in the frozen contract. No mock, no pair, nothing to trade away here.

No manual/credentialed steps identified — every case below runs against local fixture files or this
repo's own already-committed specs.

## Behaviors

> Fixtures are synthetic Markdown unless noted as a real-repo corpus check (CP16, CP17), which read
> this repo's own already-committed spec files and therefore need no fixture directory. All CLI
> invocations spawn the tool as a subprocess against a fixture path — no internal function is
> imported and poked directly, consistent with the black-box discipline the frozen-suite precedent
> (`tools/token-report.frozen.test.js`) uses.

### Happy path — graded and passing

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| CP01 | Single-phase spec, basename dated safely ≥ CUTOFF (far future, e.g. `2099-01-01-...md`), one `Contract-probe:` field with a fenced response block | Exit 0 | cli |
| CP02 | Same shape, field is `Contract-probe: n/a — <a clear, ≥20-char reason with none of the four forbidden patterns>` | Exit 0 | cli |
| CP03 | One phase carries **two** `Contract-probe:` fields, both individually valid | Exit 0 (phase passes: ≥1 field, every one valid) | cli |
| CP04 | Two files given on the CLI, both graded and both passing | Exit 0 | cli |
| CP05 | Spec has **no** phase headings at all anywhere (`^#{2,4}\s+(?:Phase|Faza|P\d+)\b` never matches) | Whole file treated as one unit; a single valid field anywhere in it → exit 0 | cli |
| CP06 | Byte-identical content to CP01 but with CRLF (`\r\n`) line endings throughout | Exit 0 — parser must not require LF | cli |
| CP07 | Field-label tolerance sweep, one phase per form, each otherwise identical to CP02: plain `Contract-probe:`, `**Contract-probe:**` (bold inside the colon), `**Contract-probe**:` (bold outside the colon), `- Contract-probe:` (dash marker), `* Contract-probe:` (star marker) | All five recognized and pass → exit 0 | cli |
| CP08 | Heading-vocabulary/case sweep, one phase per form, field valid in each: `## Phase 1`, `### Faza 2`, `#### P3`, `## PHASE 4` (uppercase English), `## faza 5` (lowercase Polish) | All five recognized as phase headings, each unit passes independently → exit 0 | cli |
| CP09 | Separator sweep for `n/a`, one phase per form, reason otherwise identical/valid: em dash `—`, en dash `–`, hyphen `-`, colon `:` | All four accepted → exit 0 | cli |
| CP10 | `Contract-probe:` label, then a blank line, then a sentence of explanatory prose, then a fenced code block — fence opens before the next field label/heading | Exit 0 — intervening prose before the fence does not disqualify it | cli |
| CP11 | `n/a` reason wrapped in backticks whose content, once backticks and surrounding whitespace are trimmed, is **exactly 20 characters** | Exit 0 — trimming happens before the length check (boundary, accepted side) | cli |

### Not graded (exempt regardless of field content)

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| CP12 | Basename dated far in the past (e.g. `2000-01-01-...md`); the one phase in it has **no** `Contract-probe:` field at all | Exit 0, stdout line reads "not graded — dated before `<CUTOFF>`" (or equivalent naming the reason) — proves the exemption applies even to a phase that would otherwise fail | cli |
| CP13 | Basename with **no** date prefix at all (e.g. `notes-about-things.md`); the one phase has a `Contract-probe: n/a` with **no reason** (would fail if graded) | Exit 0, stdout line reads "not graded — no date in file name" — same proof, other exemption reason. **Provisional per Q4** | cli |
| CP14 | Basename dated exactly `== CUTOFF` (value obtained per Q5, not hardcoded), one valid field | Exit 0, graded **and** passing (boundary, accepted side — pairs with CP15) | cli |
| CP15 | Basename dated exactly `== CUTOFF minus one calendar day` (per Q5), no field at all | Exit 0, "not graded" (boundary, rejected-from-grading side — pairs with CP14) | cli |

### Corpus silence (regression guard, real repo files — no fixtures)

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| CP16 | Run against every file matched by `.ai/specs/implemented/*.md`, enumerated by the test **at run time** (never a hand-typed list — this repo currently has 22, and the count is not the assertion) | Exit 0, zero stderr failure lines — every one of these is dated before any plausible `CUTOFF` | cli |
| CP17 | Run against every file matched by `.ai/specs/*.md` (root only, non-recursive) whose basename-date is `< CUTOFF` at test-run time — today that includes `2026-08-02-outstanding-debt-and-docs-delta.md`, `2026-08-06-spec-carries-the-execution-plan.md`, `2026-08-11-brownfield-stack-preservation.md`, `2026-09-01-codex-marketplace-auto-update.md`, and this very spec (`2026-09-13-quality-gates-from-the-partner-portal-report.md`, dated before the provisional 2026-09-14 cutoff) | Exit 0 for each — live, pre-cutoff specs stay silent even though several predate the `Contract-probe:` field's own existence | cli |

### Edges and failures

| ID | Trigger | Expected outcome | Level |
|---|---|---|---|
| CP18 | One phase, `Contract-probe:` field entirely absent | Exit 1; the single stderr line contains the spec's basename, the phase's heading text, and an identifiable rule name | cli |
| CP19 | Two phases in one spec, each failing for a **different** rule (e.g. phase A missing the field, phase B has `n/a` with no reason) | Exit 1; two distinct stderr lines, each independently naming its own phase and its own rule | cli |
| CP20 | `n/a` with the separator present but zero reason text after it | Exit 1 | cli |
| CP21 | `n/a` reason exactly **19** characters, no backticks | Exit 1 (boundary, rejected side — pairs with CP22) | cli |
| CP22 | `n/a` reason exactly **20** characters, no backticks | Exit 0 (boundary, accepted side — pairs with CP21; distinct code path from CP11's backtick-trim case) | cli |
| CP23 | `n/a` reason (≥20 chars, otherwise clean) contains the standalone word "stack" (e.g. "the stack needs a redeploy before this can be measured, will follow up") | Exit 1 | cli |
| CP24 | `n/a` reason (≥20 chars) contains "stack" only as a substring inside a longer word (e.g. "this route has no callstack instrumentation wired up yet") | Exit 0 — `\bstack\b` must not fire inside "callstack" | cli |
| CP25 | `n/a` reason (≥20 chars) contains "not running" (any case, e.g. "the payments API is Not Running in this sandbox today") | Exit 1 | cli |
| CP26 | `n/a` reason (≥20 chars) contains "nie wstał" (any case) | Exit 1 | cli |
| CP27 | `n/a` reason (≥20 chars) contains the standalone token "ENV" in exact case (e.g. "blocked: the ENV var API_KEY is unset on this box today") | Exit 1 | cli |
| CP28 | `n/a` reason (≥20 chars) contains lowercase "env" and the word "environment" (e.g. "the environment config for this env needs a manual seed step, ticket #9") but never the standalone uppercase token "ENV" | Exit 0 — case-sensitivity and `\bENV\b`'s word boundary must not fire on "environment" | cli |
| CP29 | `Contract-probe:` field whose body is plain prose — neither a fenced block nor an `n/a` form | Exit 1 | cli |
| CP30 | `Contract-probe:` label present with **nothing** after it before the next field label/heading | Exit 1 | cli |
| CP31 | One phase, two `Contract-probe:` fields — one valid, one invalid | Exit 1 (the contract requires *every* field in the phase to be valid) | cli |
| CP32 | `Contract-probe:` label with nothing under it, then a `Done-when:` label, then a fenced code block under **that** label | Exit 1 for the `Contract-probe` field — the fence belongs to the next field, not this one | cli |
| CP33 | A level-1 `# Phase 2` heading appears between two real (level-2) phase headings, `## Phase 1` and `## Phase 3` | Only two units are formed; the level-1 heading's line and everything after it up to `## Phase 3` stay part of the `Phase 1` unit (boundary, rejected side — `#{2,4}` starts at 2) | cli |
| CP34 | A level-5 `##### Phase 2` heading appears the same way, between `## Phase 1` and `## Phase 3` | Same as CP33 — no new unit at level 5 (boundary, rejected side — `#{2,4}` ends at 4) | cli |
| CP35 | Basename dated far in the future (e.g. `2099-01-01-...md`), the one phase's field is absent | Exit 1 — proves grading isn't accidentally scoped to dates "near today," independent of wherever `CUTOFF` currently sits | cli |
| CP36 | Two files on the CLI: the first passes, the second has one failing phase | Exit 1 overall; stderr disambiguates by basename which file's phase failed | cli |
| CP37 | No CLI arguments at all | Exit 2, a usage/error line on stderr | cli |
| CP38 | A single file path that does not exist on disk | Exit 2, an error line on stderr naming that file | cli |
| CP39 | Basename with a date-shaped but calendar-invalid prefix, e.g. `2026-13-40-notes.md` (month 13, day 40); no field present | **[Q2, proposed]** Exit 0, "not graded — no date in file name" | cli |
| CP40 | `n/a` followed only by whitespace and then an otherwise-qualifying ≥20-char reason — no `—`/`–`/`-`/`:` separator anywhere between "n/a" and the reason | **[Q1, proposed]** Exit 1 | cli |
| CP41 | CLI args: one valid, passing file **and** one nonexistent file | **[Q3, proposed]** Exit 2 | cli |

> No **promoted** row yet — Step 1 (behavior derivation), written with the implementation unread and
> before any inner-loop check exists to promote from. If the implementer's report names a
> `Promotion candidate:` that caught a real defect, it is folded in at Step 4, after the diff is read
> — not mined from their scratch files, and refused if it could only ever have been red because the
> code didn't exist yet.

---

## Detection proof (filled at step 5, after the suite exists)

| ID | Mutation applied | Test went red | Reverted, suite green | Verdict |
|---|---|---|---|---|
| — | (not run yet — this is the DRAFT case list, Step 1 only) | — | — | — |

> Tier B requires, per behavior ID: break exactly that behavior's mechanism, show that ID's test go
> red, revert, confirm the full suite green again. Filled after the suite exists and is frozen.
