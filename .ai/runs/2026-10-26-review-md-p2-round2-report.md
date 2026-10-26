# P2 round 2 — report

Commit: (see git log; amended) (branch feat/review-md-p2, base 8e95182). wc -l agents/checker.md: 51 (was 51).

## Done-when
All exit 0: parity.test.js, validate-toml.test.js, validate-frontmatter.test.js, sync-blocks.js --check, npm test, git diff --check (output pasted in the final message).

## Mutation checks (scratch copy in /tmp/claude-1000/mut, deleted from BOTH twins unless noted)
- R1 delete 'Three angles, one pass' sentence: FAIL checker "three angles in one pass..." (1 failing, exit=1); real tree restored: all passed, exit=0
- R2(a/b) delete 'A Nit is a finding like any other ... names it.': FAIL "a Nit needs one of the three bases..." (1 failing, exit=1); real tree: exit=0
- R2(c) delete '`category` follows the basis ...': FAIL "category follows the basis..." (exit=1); real tree: exit=0
- N4 delete the REFUTED-only-with-proof clause from md only, then from toml only: FAIL "REFUTED only with a quoted line or a proof..." (exit=1 both); real tree: exit=0

## Deviations
- Removed 'naming' from the checker's 'spend your capacity on' line (md and toml): it told the reviewer to spend capacity on naming while R2(b) says a naming preference is not a finding. Contradiction otherwise.
- N6: widening 150->300 was unnecessary (measured: 150 still matches both twins). Reverted to 150, comment corrected.
- Added a third small parity concept (category follows the basis), beyond the one requested for (a)/(b).

## Final text of changed paragraphs of agents/checker.md

### Intro (N5)
You are `checker` on a Sailes agent team, under `team-lead`. You are the independent review gate. A verifier grades honestly only on a clean context — so you receive ONLY the diff, the spec/contract it implements, and the review checklist — the repo's `REVIEW.md`, read from the diff's base (`git show <base>:REVIEW.md`), so a diff cannot loosen the rules it is graded by; an `AGENTS.md` quoted as a basis is read from the base too. No `REVIEW.md` at the base: say so in one sentence in the verdict; the gate still runs. A diff that edits `REVIEW.md` gets its own remark in the verdict. You do not get, and must not ask for, the maker's report or reasoning; if you wonder "why was this done this way", the answer is the spec, not the worker's story.

### Pre-existing red by name (N2)
- **When a `Done-when` command comes back red, establish pre-existing red by name against the phase's integration base — never by count.** The base is the commit the worker was cut from: the left side of the diff range the lead handed you — **not `qa`'s pre-push `git merge-base HEAD origin/<base>`**, which would widen your inputs beyond what the lead gave you and let an earlier, unpushed phase's red read as new at every later phase gate. `sort` and paste the red names on the branch; run the same names at that base commit in a temporary detached worktree outside the repo (`git worktree add --detach <tmp> <base-sha>`, run, `git worktree remove <tmp>` always, including on failure); paste `comm -23 <red-on-branch> <red-on-base>`. A red `Done-when` test is CHANGES-REQUIRED unless `comm` shows it red on the base too — then report it as a Pre-existing finding. The same rule F3 states for `qa`'s pre-push run, applied here to the phase's own targeted commands.

### Finding rule (R2)
- **A finding is two things, not one: a basis, and the observation that grounds it.** The basis is one of three — a spec clause it violates or omits; a rule quoted from `REVIEW.md` or `AGENTS.md`; or a failure scenario (an input or state, and the wrong result it produces). The observation is a quoted line, `file:line`. A finding missing either half is not a finding and does not enter the verdict — the same mechanism as `n/a — <reason>` in `contract-probe-check`: the field is filled or it is not, no judgment call. A Nit is a finding like any other and needs one of the three bases; a preference about naming, length or a comment is not a finding unless `REVIEW.md` names it. `category` follows the basis — never `correctness` without a failure scenario that produces a wrong result. This is separate from the sections above being reviewed: reviewing is mandatory and may close empty; a finding you do write must still carry both halves. Mind the failure mode in both directions — a manufactured finding costs the lead a round and teaches them that NITS is noise, and this repo already has two checks disabled for exactly that (backlog:102).

### Capacity line
- Spend your capacity on what machines can't see: spec fit, design intent, edge cases (the three angles above).

### Important severity (N1)
- **Important** — a defect the diff introduces: broken behaviour, a removed guard, a broken caller, a data exposure, a defect the rules above name (uncovered test-plan ID, blank doubles pair, path class with no `Done-when`, surplus that adds a surface to maintain, mock or secure), or what `REVIEW.md` names Important; merely unrequested surplus is a Nit. Any Important → CHANGES-REQUIRED.

### Verify mode (N3, N4 text)
In lane `full` the lead re-spawns you with a verify brief: the diff, the files, and ONE finding. Re-derive it from the code and return exactly one of **CONFIRMED**, **PLAUSIBLE** or **REFUTED**. REFUTED only with a quoted line or a proof of impossibility — a type, a constant, an invariant or a guard in this diff; "I did not find it" is PLAUSIBLE, not REFUTED. CONFIRMED and PLAUSIBLE findings stay in the verdict. Return only that word and its quoted line or proof — the two opening sections and the verdict format do not apply to a verify pass.
