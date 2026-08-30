# Worker report — mock pairing (Rule B) + deployed surface (Rule A, qa/tester/checker half)

Branch: `test-doctrine-from-deployment-lessons`
Spec: `.ai/specs/2026-08-30-test-surface-not-test-count.md` (Phase 2 in full; Phase 1's
`agents/qa.md` landing site)
Source: `wnioski z wdrożeń/2026-08-30-wnioski-o-testach-i-procesie.md` §1, §2

Six files in scope, all CRLF (verified before the first edit: `grep -c $'\r'` = line count on all
six). Edits applied through a Node script that writes `\r\n` explicitly and `throw`s when a needle
is absent, so a silent no-op cannot report success.

Baseline before any edit: `node tools/sync-blocks.js --check` → `sync-blocks: all blocks in sync`,
exit 0. None of the six files carries a sync marker.

---

## Progress log (written as the work happens, not at the end)

### 1. `skills/sailes-test/SKILL.md` — DONE (3 insertions, file 231 → 250 lines)

- **L189-191, §External systems** — "Two rules that hold regardless" is now **three**; the added
  clause is "every mock of an external boundary carries a pair — one probe of that same boundary on
  the deployed address."
- **L195-204 (new paragraph, same section)** — the doctrine home: the pair is one command, it is a
  **trade not an addition** (the probe earns the deletion of the mocked assertions it makes
  redundant, so the suite gets smaller), the 2026-08-29 measurement with CloudFront /
  `proposal-states.spec.ts` / "44 more assertions would not have caught it", and a pointer to
  `references/external-systems.md` rule 6.
- **L211-216, §Never** — new bullet immediately after "Never mock inside your own app": never leave a
  mock of an EXTERNAL boundary unpaired, with the *who can rewrite the response* test and the
  internal-boundary exemption.
- **L248-249, §Red Flags — STOP** — new line immediately after "You mocked something you own…".

Verified: `grep -n` shows all four landed at the intended sites; `wc -l` 250 = `grep -c $'\r'` 250,
so the file stayed pure CRLF.

### 2. `skills/sailes-test/references/external-systems.md` — DONE (2 insertions, 107 → 128 lines)

- **L82-95, §Rules that hold regardless** — rule **6**, the full form of Rule B. Carries the
  clarifying clause the brief asked for: rule 1 is about whether anything knows what the **vendor's**
  API does, rule 6 is about whether anything knows what **your own deployed address** returns once
  the CDN/proxy/gateway has had its turn — "both can be satisfied while the system is broken in the
  other's direction." Includes the *who can rewrite the response* test, the internal-boundary
  exemption, the 2026-08-29 measurement, and the trade (the probe earns the deletion of the
  assertions it makes redundant).
- **L112-124, §Recording the choice** — the worked `🔀` example now shows the `↳ pair` line in both
  forms: a real deployed `curl` with its expected wire observation, and a written `n/a — <reason>`
  for an outbound-only boundary. Plus two sentences saying the line is never dropped.

Verified: `sed -n '79,120p'` shows both landed; 128 lines = 128 CR, still pure CRLF.

### 3. `skills/sailes-test/test-plan-template.md` — DONE (1 insertion, 58 → 67 lines)

- **L31-32, §Requires you** — the `🔀` line now carries a `↳ pair:` sub-line in its two legal forms
  (a command against the DEPLOYED address with the wire observation it must produce, or
  `n/a — <reason>`); the second is labelled "the only other legal value" so a blank reads as unfilled
  rather than as absent.
- **L34-39** — a `>` note in the template's own idiom: what the pair is for, that it is one command
  and a **trade** (the assertions it makes redundant get struck here, not kept beside it), the
  2026-08-29 measurement in one sentence, and "a blank pair is not a pass."

The template gets the rule as a **field**, not as doctrine — the doctrine is in `SKILL.md` and
`references/external-systems.md`.

Verified: 67 lines = 67 CR.

### 4. `agents/tester.md` — DONE (2 insertions, 69 → 74 lines)

- **L57, §You never** — one long-line bullet (matching that section's format) immediately after
  "Mock something the app owns…", which covered internal mocks only. Rule B as a **duty**: leave no
  external-boundary mock without its pair, with the *who can rewrite the response* test, the
  2026-08-29 measurement, "the pair is one command, not a suite", and the closing measurement
  "forty-four more assertions would not have caught this defect; one probe would."
- **L67-74, §Report** — the report contract now enumerates every `🔀` double **with its pair** (the
  command, the wire result, or the written `n/a`) **and** the mocked assertions the pair makes
  redundant, named for the human to strike.

Judgment call recorded: the redundant assertions are **named for the human to strike**, not deleted
by `tester`. `tester`'s existing "You never" already forbids deleting a frozen assertion, and giving
this role a new deletion licence would have collided with the freeze discipline in the same section.
The net count still goes down; the human is the one who strikes a frozen ID. Stated inline so the
trade is not readable as ceremony.

Verified: 74 lines = 74 CR.

### 5. `agents/qa.md` — DONE (4 insertions, 54 → 58 lines)

`qa.md` had **zero** mentions of mocks and no notion of a deployed environment before this. Rule A's
qa half plus Rule B's gate half:

- **L9** — the opening sentence now carries the disambiguation: "…done means the running system was
  observed doing the thing — not that the build is green. **Where the behavior depends on a wire
  property — an HTTP status code, a header, a `Content-Type` — \"running\" means the DEPLOYED
  address**, not the local stack, not origin, not a mock. That ambiguity is what let a defect through
  this gate on 2026-08-29; the duty it creates is the second bullet below."
- **L13, §You do** — placed second, right after the `tester`-suite-run bullet: run the phase's
  `Deployed-probe:` and quote the wire result verbatim. References
  `node tools/deployed-surface-check.js <spec>` as the thing that forces the field to exist rather
  than re-specifying it (the spec-side half is the other worker's). Carries the 2026-08-29
  measurement, explicitly attributing the false green to **this role**, and "one command, not a
  suite" / "detection cost afterwards: one `curl`".
- **L53, §You never** — never accept a boundary mock as the deployed check; if the suite's only
  statement about that boundary is a `route.fulfill(...)`, the boundary is unproven and the green is
  false. Points at the plan's `🔀` pair as the thing to run.
- **L57-58, §Output** — an unrunnable `Deployed-probe:` is **ENV-DEFECT**, never a silent PASS: name
  the host, the command and what stopped you. A spec-side `Deployed-probe: n/a — <reason>` means qa
  runs nothing; disagreeing with that `n/a` is **CHANGES-REQUIRED**, not a self-invented probe.

Verified: 58 lines = 58 CR; `git diff --numstat` = `5 1` — exactly my four edits, no collision with
the concurrent worker.

### 6. `agents/checker.md` — DONE (1 insertion, 35 → 36 lines)

- **L16, §You do** — immediately after the frozen-test-plan mechanical check, in the same mechanical
  register: every `🔀` external-boundary double in the frozen plan carries a declared pair (a probe
  of that boundary on the deployed address) or a written `n/a — <reason>`; a blank pair is a
  **defect** "you can see without judgment: the field is filled or it is not." Ends with the
  anti-ceremony clause — a probe stacked on top of the mock it replaces is **NITS**, not
  CHANGES-REQUIRED, because the pair is a trade.

Verified: 36 lines = 36 CR; `git diff --numstat` = `1 0`.

---

## Verification (pasted)

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync
sync-blocks exit=0

$ npm test
... (16 suites)
hooks-template: all tests passed
npm test exit=0

$ grep -c 'pair' skills/sailes-test/SKILL.md
3                                    # spec Phase 2 Done-when requires ≥ 1

$ git diff --numstat -- agents/ skills/sailes-test/
1   0   agents/checker.md
5   1   agents/qa.md
7   2   agents/tester.md
23  4   skills/sailes-test/SKILL.md
21  0   skills/sailes-test/references/external-systems.md
9   0   skills/sailes-test/test-plan-template.md
```

Line endings after every edit: the edit script asserts zero bare-LF lines before it returns, and each
file was re-measured afterwards — `wc -l` equals `grep -c $'\r'` on all six. No mixed line landed.

No failure in `npm test` named any file outside my six, so nothing to report as a concurrent-worker
observation. `tools/blocks.json` is modified in the working tree by the other worker; `sync-blocks
--check` is green with that change present, so my edits introduced no block drift into it.

## Decided NOT to do, and why

- **No `Deployed-probe:` mechanism re-specified anywhere.** `agents/qa.md` names
  `node tools/deployed-surface-check.js <spec>` and the `Deployed-probe:` field and stops there —
  the spec/pre-implement half is the concurrent worker's, and two definitions of one field is how
  they drift.
- **No new bullet in `skills/sailes-test/SKILL.md`'s Quick Reference table.** The rule already lands
  three times in that file (doctrine, prohibition, red flag); a fourth restatement in a one-line
  table would be padding, and the table's rows are pipeline stages, not rules.
- **`tester` does not get a deletion licence.** The trade is real and stated, but the redundant
  mocked assertions are **named for the human to strike**, because `agents/tester.md`'s own "You
  never" already forbids deleting a frozen assertion. Giving the same role both instructions in the
  same section would have made one of them dead text.
- **`checker` gets no `Deployed-probe:` duty.** Its `🔀`-pair check is mechanical and needs only the
  frozen plan; a probe check would need the spec's phase field, which is the pre-implement gate's job
  under Phase 1. Not mine, and duplicating it would have created a second enforcement point for one
  rule.
- **No edit to `agents/qa.md`'s §You hold the environment.** A deployed probe is a read against
  someone else's host, not a claim on the local stack, so the exclusivity rule is unaffected and
  saying so would only have added words.

## Where the existing text was already close enough

- **`skills/sailes-test/SKILL.md` §Never, "Never mock inside your own app"** — covers *internal*
  mocks completely. I did not touch it; the new bullet is its external-boundary completion and is
  placed immediately after, so the two read as one pair rather than as a correction.
- **`skills/sailes-test/references/external-systems.md` rule 1** ("at least one real-contract check
  per external system") is the closest existing text to Rule B and is on a **different axis** — the
  vendor's API, not our deployed address. Rather than fold rule 6 into it, rule 6 states the
  distinction explicitly ("both can be satisfied while the system is broken in the other's
  direction"), which is what the brief asked for.
- **`agents/tester.md` L56** ("Mock something the app owns…") — same relationship: internal only,
  left untouched, external bullet added beneath it.
- **`agents/qa.md` §You never, "Substitute a devtools drive-through for the `tester` suite run"** is
  structurally the same argument (a proof that proves the wrong thing) but about a different
  substitution; no overlap, nothing merged.

## What this does NOT establish

The doctrine landed; nothing here proves it changes behavior. Phase 2's eval
(`evals/mock-of-an-external-boundary-carries-a-pair.md`) is the instrument for that and I did not run
it — it is outside my six files. `npm test` green means no deterministic test broke, not that a
`tester` or `qa` instance honours the new duty.
