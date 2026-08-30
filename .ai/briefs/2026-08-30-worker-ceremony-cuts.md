# Phase 5 — ceremony cuts (worker report)

Spec: `.ai/specs/2026-08-30-the-suite-is-a-one-way-ratchet.md`, Phase 5.
Branch: `test-doctrine-from-deployment-lessons`. No commits, no pushes, no checkout — edits in place.
This file is created with the first edit and appended as the work proceeds.

Files in scope (only these five may be edited by this worker):
`agents/team-lead.md`, `skills/sailes-bootstrap/delegation-threshold.md`,
`skills/sailes-spec/SKILL.md`, `skills/sailes-bootstrap/spec-writing-template.md`,
`skills/sailes-implement/SKILL.md`. Plus the sync consumers restamped by `tools/sync-blocks.js`
(`skills/sailes-bootstrap/agent-team-structure.md`, `codex-agents/team-lead.toml`) and one new
reference file created by 5f.

Starting bytes (measured, all CRLF-only, zero bare LF):

| File | bytes | CRLF | bare LF |
|---|---|---|---|
| agents/team-lead.md | 42668 | 203 | 0 |
| skills/sailes-bootstrap/delegation-threshold.md | 2031 | 30 | 0 |
| skills/sailes-spec/SKILL.md | 20398 | 209 | 0 |
| skills/sailes-bootstrap/spec-writing-template.md | 12820 | 127 | 0 |
| skills/sailes-implement/SKILL.md | 18195 | 137 | 0 |
| skills/sailes-bootstrap/agent-team-structure.md (consumer) | 75692 | 756 | 0 |
| codex-agents/team-lead.toml (consumer) | 12059 | 71 | 2 |

---

## 5a — orphaned comment debris: NOT A DEFECT, nothing cut

**Verified against the file and against the whole repo. The fragment is not orphaned.**

`agents/team-lead.md:57-60` is one well-formed four-line HTML comment:

```
57  <!-- The block above is generated from skills/sailes-bootstrap/delegation-threshold.md by
58       tools/sync-blocks.js. Do not edit it here — edit the source and re-run the tool. A gate test
59       fails when the copies drift, because three hand-written copies of one rule produced three
60       measured collisions in a single day (2026-08-01). -->
```

The `-->` the brief calls dangling is line 60, the terminator of the comment opened on line 57 —
not line 11, which is blank. Evidence:

- `grep -n -- "-->\|<!--" agents/team-lead.md` → openers at 17, 41, 57; closers at 36, 55, 60.
- Regex balance check: 5 openers, 5 closers, 5 fully-matched `<!--…-->` spans, and
  `re.sub(r'<!--.*?-->','',d)` leaves **zero** stray `-->` in the file.
- Repo-wide sweep of every tracked file for unbalanced markers found three files with an imbalance
  (`.ai/eval-runs/2026-07-26-full/bootstrap-generates-code-map.md`,
  `skile do inspiracji/db-compendium.md`, `skills/sailes-database/db-compendium.md`) — none of them
  `agents/team-lead.md`, and none in this worker's scope.

The spec's own Done-when for this item — *"`grep -c -- "-->" agents/team-lead.md` matches the count
of real comment openers"* — already passes: 3 and 3.

**Judged should NOT be cut.** The comment is not debris; it is the do-not-hand-edit warning on a
sync-stamped block, which is the one warning that keeps a consumer copy from being edited in place.
Deleting it would remove the only in-file signal that the block above it is machine-generated.
The finding as written in the spec table appears to have been read off a stale or mis-numbered view.

---

## 5b — the gate rule stamped twice: restatement cut to a pointer

Edited **inside** the `<!-- BEGIN delegation-threshold -->` markers of the source file
`skills/sailes-bootstrap/delegation-threshold.md` (lines 27-29 before, 27-28 after), then
`node tools/sync-blocks.js` restamped the three consumers. No consumer was hand-edited.

Before (`delegation-threshold.md:27-29`):

```
spend a worker on it. Gates scale with what can break, never with who wrote it: `checker` on any
diff that can change behavior including your own, `qa` wherever there is behavior to observe, and
`qa: n/a` **with its reason, recorded** where there is not.
```

After (`delegation-threshold.md:27-28`):

```
spend a worker on it. Which gates run, and on what, is the `gate-scaling` block in this same file —
stated once, there, and never restated here.
```

Kept: the whole load-bearing half — *"This threshold decides who WRITES. It never decides who
GRADES"*, the two-separate-axes claim, and its measured incident (the 2026-08-01 doctrine demanding
both gates on a two-character README typo). Dropped: only the re-enumeration of what `checker`,
`qa` and `qa: n/a` each do, which `gate-scaling.md:15-21` owns and which was stamped into the same
three files ~15 lines away.

The pointer says "in this same file" rather than "above" on purpose: `gate-scaling` sits *above*
`delegation-threshold` in `agents/team-lead.md` and `agent-team-structure.md`, and *below* it in
`codex-agents/team-lead.toml`. A directional pointer would have been wrong in one of the three.

Restamp output:

```
  synced  ../skills/sailes-bootstrap/agent-team-structure.md  <- .../delegation-threshold.md  [delegation-threshold]
  synced  ../agents/team-lead.md                              <- .../delegation-threshold.md  [delegation-threshold]
  synced  ../codex-agents/team-lead.toml                      <- .../delegation-threshold.md  [delegation-threshold]
sync-blocks: 3 file(s) synced
```

`node codex-agents/parity.test.js` → exit 0, all 10 roles both sides. No invariant asserted the
removed enumeration, so nothing had to be weakened.

## 5c — skip-triggers vs `spec-weight`: reconciled, `spec-weight` untouched

`skills/sailes-spec/SKILL.md:88` — before:

```
- **Skip** specs for: small bug fixes, typo-only edits, isolated one-file refactors with no behavior change. (Don't manufacture a spec for a one-liner.)
```

after:

```
- **Skip** specs only where behavior cannot change: typo-only edits, isolated one-file refactors. A bug fix changes behavior — it earns a weight below, never an exemption.
```

`skills/sailes-bootstrap/spec-writing-template.md:40` (the third copy, tail of the lifecycle
paragraph) — before: `**skip** for typos, one-file refactors, small bug fixes.`
after: `**skip** only where behavior cannot change — typos, one-file refactors. A bug fix changes
behavior: it earns a weight below, never an exemption.`

Nothing inside `<!-- BEGIN spec-weight -->` / `<!-- END spec-weight -->` was touched in either file.
The exemption now covers only what the `spec-weight` block's own "No spec" tier already covers
(a one-liner, a typo, an isolated refactor with no behavior change), so the two no longer disagree,
and the behaviour-changing bug fix routes to *Weight goes down, never out* instead of out.

## 5d — one condition for the run log

The specific condition at `sailes-implement/SKILL.md:23` (**">~5 commits"**) is now the only one
stated; the three other sites defer to it.

| Site | Before | After |
|---|---|---|
| `sailes-implement/SKILL.md:23` | `For long/multi-step work (>~5 commits), open a **run log**…` | unchanged — this is the condition |
| `sailes-implement/SKILL.md:44` | `(and the run log if used)` | `(and the run log, where Pre-flight opened one)` |
| `sailes-implement/SKILL.md:90` (Quick Reference, Pre-flight row) | `run log if long` | `run log (>~5 commits)` |
| `agents/team-lead.md:93` | `the delegation itself in `.ai/runs/` when the task was substantial` | `the delegation itself in the run log (`.ai/runs/`) wherever one is open — `sailes-implement` opens one above ~5 commits` |

**Correction to the brief:** the Quick Reference **Done** row does not mention the run log — before
or after. It reads `status→implemented + git mv…; backlog + lessons + STATE.md + STATUS.md updated;
estimate-vs-actuals closed`. The flat listing is in the **Pre-flight** row (was `run log if long`,
line 116 before the 5f relocation, line 90 after), and that is the row I fixed. There were three
competing phrasings, not four.

## 5e — the waiver no longer trips its own alarm

`skills/sailes-implement/SKILL.md` red flag, line 126 before / 101 after —
before: `- You implemented without an approved, READY spec.`
after: `- You implemented with no approved spec at all, or against one `sailes-pre-implement` returned NOT-READY on.`

The waiver at `:16` ("or the change is small enough that readiness is obvious") is untouched. The
flag now names the two actual failures — no spec, or a spec pre-implement graded NOT-READY — and no
longer fires on the one case `:16` explicitly permits, where readiness is obvious and pre-implement
was never run.

## 5f — capability sweep relocated out of the always-loaded path

`skills/sailes-implement/SKILL.md:75-101` (27 lines) moved verbatim to the new
`skills/sailes-implement/capability-sweep.md`. The move was done by a script that asserts both
anchors before slicing and re-reads the file afterwards; it would have exited non-zero rather than
silently no-op. Body text is byte-identical apart from removing the two-space bullet-continuation
indent and the leading `- ` of the first line. Both grep commands, both measured incidents
(2026-08-01 twice-in-one-day, 2026-07-30 `packages/files`), the `checker`-graded-it-a-defect
reasoning and the "runs once per capability" line all survive unchanged. Nothing was weakened.

What is left in `SKILL.md` (one line, in the same "On completion" position):

```
- **Delivered a CAPABILITY something else was waiting on? Run the two-grep stale-comment sweep before closing** — `capability-sweep.md` in this skill. A comment that justified the absence, and a comment claiming behavior the code does not have, are both invisible to a diff: the diff never touches those lines. Once per capability, not once per commit.
```

**Registration check — nothing to register.** Searched for anything enumerating a skill's files:
`tools/*.js`, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and
every tracked file mentioning the sweep's grep patterns. The only hit naming
`skills/sailes-implement/SKILL.md` at all is `tools/ownership-check.test.js:73`, where it is a
string inside a *fixture* file-ownership matrix, not a manifest. `npm test` runs the seventeen
suites in `package.json`; none of them walks `skills/` for an expected file list. A new reference
file under a skill directory needs no registration.

Two related copies exist elsewhere and were **left alone** (out of scope, and both are their own
artifacts, not duplicates of this step): `skills/sailes-bootstrap/repo-done-checklist.md:178`
carries the first grep as part of the repo-done sweep, and
`skills/sailes-bootstrap/backlog-template.md:29,32` cites the same 2026-07-30 incident as the reason
backlog rows exist.

## 5g — the CloudFront anecdote cut to its mechanism

`skills/sailes-spec/SKILL.md:42` — before:

```
Measured 2026-08-29: a feature shipped with unit tests, Playwright e2e and a green `qa` gate and worked for **zero** customers — CloudFront rewrites the origin's `404` into `200 text/html`, so the code the whole feature keyed on never reached a browser, and every test had asserted against origin or a mock. One curl would have caught it; forty-four more assertions would not have.
```

after:

```
The mechanism: a CDN can rewrite the origin's status and `Content-Type` before any customer sees them, so a green assertion against origin proves nothing about the wire (2026-08-29).
```

`skills/sailes-implement/SKILL.md:46` — before:

```
— a `Done-when` that is green against origin, `localhost` or a mock says nothing about the wire property the phase is keyed on, and on 2026-08-29 exactly that combination shipped a feature that worked for zero customers past three green gates.
```

after:

```
— a `Done-when` green against origin, `localhost` or a mock says nothing about the wire property the phase is keyed on, because a CDN can rewrite the origin's status and `Content-Type` before any customer sees them.
```

Kept intact in both: the `Deployed-probe:` requirement, the `n/a — <reason>` form and the
never-drop-it rule, the "not origin, not `localhost`, not a mock" list, the pointer to
`tools/deployed-surface-check.js`, and the trade clause (*adding the probe earns the deletion of
that boundary's mocked assertions*). Only the narrative went; the mechanism a reader needs to
reason with is still on both lines.

**Not cut, deliberately:** `skills/sailes-implement/SKILL.md` red flag *"…proved it against origin,
`localhost` or a mock. Those three are the surfaces that were all green while the deployed one was
not."* — that clause is the flag's own reason, not a retelling, and a red flag without its reason is
the bare prohibition this repo forbids.

**Also not cut (out of scope, flagged for whoever owns it):**
`skills/sailes-bootstrap/spec-writing-template.md:32` carries a near-full third retelling —
*"a feature shipped past unit tests, Playwright e2e and a green `qa` gate and worked for zero
customers, because a CDN rewrote the origin's `404` into `200 text/html`…"*. The file is in my
edit list, but the spec's 5g row names eight files and this is not one of them, so I left it rather
than widen the item unilaterally. It is a one-sentence cut for whoever takes it.

---

## Byte accounting

| File | Before | After | Delta |
|---|---:|---:|---:|
| `agents/team-lead.md` | 42668 | 42614 | −54 |
| `skills/sailes-bootstrap/delegation-threshold.md` | 2031 | 1922 | −109 |
| `skills/sailes-spec/SKILL.md` | 20398 | 20218 | −180 |
| `skills/sailes-bootstrap/spec-writing-template.md` | 12820 | 12910 | **+90** |
| `skills/sailes-implement/SKILL.md` | 18195 | 16301 | −1894 |
| `skills/sailes-bootstrap/agent-team-structure.md` (sync consumer) | 75692 | 75583 | −109 |
| `codex-agents/team-lead.toml` (sync consumer) | 12059 | 11950 | −109 |
| **Net across edited files** | | | **−2365** |
| `skills/sailes-implement/capability-sweep.md` (new, 5f relocation) | 0 | 2457 | +2457 |
| **Net on disk, relocation included** | | | **+92** |

Read the two totals as they are meant: **−2365 bytes of always-loaded, model-facing doctrine**, and
**+92 bytes on disk**, because 5f is a relocation and the spec required it be copied faithfully
rather than trimmed. `capability-sweep.md` loads only when a capability was delivered; it is off the
per-run path, which was the point of the item. The only file that grew, `spec-writing-template.md`
(+90), grew because 5c is a *reconciliation*: an exemption that silently swallowed behaviour-changing
bug fixes costs fewer bytes than one that says which way each case goes.

## Verification

```
$ node tools/sync-blocks.js --check
sync-blocks: all blocks in sync
syncheck=0

$ node codex-agents/parity.test.js
codex parity: all tests passed (10 roles, both sides)
parity=0

$ npm test
… (17 suites)
hooks-template: all tests passed
EXIT=0
```

Line endings, measured byte-level per file after the edits (`d.count(b'\r\n')` vs
`d.count(b'\n') - d.count(b'\r\n')`), every file matching what it had before:

```
agents/team-lead.md                                       42614 CRLF= 202 bareLF=0
skills/sailes-bootstrap/delegation-threshold.md            1922 CRLF=  29 bareLF=0
skills/sailes-spec/SKILL.md                               20218 CRLF= 209 bareLF=0
skills/sailes-bootstrap/spec-writing-template.md          12910 CRLF= 127 bareLF=0
skills/sailes-implement/SKILL.md                          16301 CRLF= 111 bareLF=0
skills/sailes-implement/capability-sweep.md                2457 CRLF=  32 bareLF=0
skills/sailes-bootstrap/agent-team-structure.md           75583 CRLF= 755 bareLF=0
codex-agents/team-lead.toml                               11950 CRLF=  70 bareLF=2
```

`codex-agents/team-lead.toml` had 2 bare LF before the restamp and has the same 2 after — the sync
tool did not introduce or normalise anything. Every edited line was re-read from disk after writing.

## Status

Phase 5 complete: 5b, 5c, 5d, 5e, 5f, 5g landed and verified. 5a required no change and the reason
is recorded above. No commits, no pushes, no `git checkout`, no worktree. Only the five files in
scope plus the two sync consumers (rewritten by the tool, as the brief anticipated) and the one new
reference file were touched.

Two things a reviewer should know, both stated above and neither hidden: the 5a finding does not
reproduce, and the 5d finding named a Quick Reference row that never carried the artifact.
