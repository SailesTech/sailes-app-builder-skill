# Test plan — harness guards from ECC audit, P3 (A2) + P4 (A3)

Spec: `.ai/specs/2026-09-20-harness-guards-from-ecc-audit.md`
Phases: P3 — `hooks/block-no-verify.js` (§"P3 — A2", lines 195-244); P4 — `hooks/toolchain-guard.js`
(§"P4 — A3", lines 247-296). These are the only two code phases in this spec ("tester tylko dla P3
i P4, bo to jedyny kod" — line 98); P1/P2/P5/P6 change doctrine text or run evals, measured by
`parity.test.js` and eval arms, not by this suite.
Risk tier: **B** — set by each phase's own `Lane:` line ("Lane: middle — tier B", P3 line 212, P4
line 264), not raised or lowered by me. Neither phase names a money/auth/tenancy/idempotency
trigger; P4's Human-STOP (a) and (b) are about the protected-path *list* and the unblock *variable
shape*, both human review gates on content, not a tier-A code trigger.
Lane: **middle** on both phases — no human-STOP for this plan. Moved `DRAFT` → `DERIVED` directly;
the no-weakening rule binds this plan exactly as written, and any expectation that turns out wrong
goes to the lead as a run-log entry with a reason, not back to a human freeze.
Status: **DERIVED** (self-frozen, middle lane, 2026-09-20)

> Derived from spec sections "P3 — A2" (lines 195-244) and "P4 — A3" (lines 247-296) — including
> each phase's `Done-when` fixture list and Integration-coverage row — **plus** `AGENTS.md`'s
> "Verification" section (hook I/O contract: JSON on stdin, `stderr`+`exit(2)` or silent `exit(0)`)
> and the R4 measurement paragraph (line 419: `PreToolUse` never fires on a human-typed `!` shell
> command or on a subagent's own tool calls — the latter is a condition on A2's scope, not an
> escape). Neither `hooks/block-no-verify.js` nor `hooks/toolchain-guard.js` nor their `.test.js`
> siblings were opened before this plan was written. They are opened only after this file is
> written and frozen (self-frozen, middle lane), per the order the role's instructions require.
> Base at plan time: `4c8e234` (worktree HEAD after the five required merges).

## What I could not derive from the spec (documented, not blocking — middle lane)

- **A1 — exact wording the `-n`/`--no-verify` block message must carry, beyond "names the
  file"/"no-verify" substring.** P3.1 says the hook blocks with `stderr`+`exit(2)` and gives the
  rule's content, but not a required message format. **Default:** assertions on stderr content stay
  loose (`/no-verify/`, `/hooksPath/i`) — matching the Done-when list itself, which never pins exact
  wording either.
- **A2 — whether `git push -n` (dry-run) must stay unblocked.** Not named anywhere in P3's text or
  Done-when list; git's own CLI gives `-n` a different meaning for `push` (dry-run) than for `commit`
  (no-verify shorthand), and P3.1's prose only ever pairs `-n` with "commit-flag position". **Default
  used below (P3-EDGE-3):** `git push -n` must NOT block — conflating the two `-n` meanings would be
  a false positive against a legitimate, common flag. If this default is wrong, it is a run-log entry
  to the lead, not a silent rewrite of P3-EDGE-3.
- **A3 — protected-path list completeness for TypeScript.** P4.1 says "`tsconfig*.json` i ich
  odpowiedniki" (P4 line 269) but the Done-when fixture list (P4 lines 283-288) only exercises the
  bare `tsconfig.json`. **Default:** the wildcard is real spec text, not an implementation guess, so
  a `tsconfig.build.json` case is in scope (P4-EDGE-1) even though Done-when never names that exact
  filename.

## Baseline IDs (from each phase's own `Done-when` — spec text, not code)

These eleven-per-hook fixtures are named verbatim in P3's and P4's `Done-when` blocks (P3 lines
232-240; P4 lines 283-291) and in the Integration-coverage table (line 429-430: "11 przypadków, w
obie strony" for each). They are spec content, independently re-derived here as the frozen
baseline; I did not copy them from the implementation. Table below cross-references each to its
already-existing implementer test (verified present and green, not re-authored — duplicating a
spec-mandated fixture the implementer already wrote correctly adds no detection and burns budget).

| ID | Behavior (from Done-when) | Found in `hooks/block-no-verify.test.js` |
|---|---|---|
| P3-01 | `git commit -m x --no-verify` → exit 2 | line 48 |
| P3-02 | `git commit --no-verify -m x` → exit 2 | line 54 |
| P3-03 | `git commit -n -m x` → exit 2 | line 59 |
| P3-04 | `git push --no-verify` → exit 2 | line 66 |
| P3-05 | `git -c core.hooksPath=/dev/null commit -m x` → exit 2 | line 74 |
| P3-06 | `git config core.hooksPath .h` → exit 2 | line 80 |
| P3-07 | `git commit -m x` → exit 0 | line 88 |
| P3-08 | `git push` → exit 0 | line 94 |
| P3-09 | `echo "--no-verify"` → exit 0 (literal, outside git) | line 102 |
| P3-10 | non-Bash tool → exit 0 | line 108 |
| P3-11 | unparsable payload → exit 0 | line 114 |

| ID | Behavior (from Done-when) | Found in `hooks/toolchain-guard.test.js` |
|---|---|---|
| P4-01..06 | write to each of `.eslintrc.json`, `eslint.config.js`, `.prettierrc`, `biome.json`, `tsconfig.json`, `ruff.toml` in a Sailes repo → exit 2 | lines 70-79 (loop) |
| P4-07 | same six, outside a Sailes repo (no `AGENTS.md`, no `.ai/`) → exit 0, silent | lines 83-91 (loop) |
| P4-08 | same six, with `SAILES_TOOLCHAIN_GUARD=off` → exit 0 | lines 95-103 (loop) |
| P4-09 | `src/index.ts` → exit 0 | line 107 |
| P4-10 | `package.json` → exit 0 (not a toolchain config) | line 115 |
| P4-11 | tool other than `Edit|Write|MultiEdit` → exit 0 | line 123 |
| P4-12 | unparsable payload → exit 0 | line 130 |

All eighteen re-run green (see Detection proof / run log below).

## Candidates named in the brief (item 5) — each evaluated

| Candidate | Verdict | Reason |
|---|---|---|
| `--no-verify` as text inside a commit-message value (`git commit -m "fix --no-verify bug"`) | **Already covered** | `block-no-verify.test.js:126` ("restore --no-verify text — allowed, value of -m, not a flag"). No ID added; verified green. |
| `core.hooksPath` set via `git config --global` | **ADD — P3-EDGE-1** | Not in Done-when or the existing suite; a scope flag (`--global`/`--local`/`--system`) sits as a separate token before `core.hooksPath` and could plausibly be missed by a narrower matcher. |
| Relative vs. absolute paths in `file_path` | **ADD — P4-EDGE-2** | The existing suite only ever passes `path.join(dir, name)` (absolute). Not named in Done-when, but a real editor call can hand the hook a cwd-relative path. |
| `tsconfig.build.json` and other `tsconfig*` variants | **ADD — P4-EDGE-1** | P4.1's own prose says `tsconfig*.json`; only the bare name is fixtured. |
| Symlink to a protected config | **REJECTED** | Out of the hook's read surface: `toolchain-guard.js` matches `path.basename(tool_input.file_path)` from the tool-call payload only — it never stats the filesystem or resolves a link. A symlink literally *named* `.eslintrc.json` matches identically to a regular file of that name, so it is not a distinct equivalence class. A symlink under an *unrelated* name pointing at a protected file is a real evasion channel, but no behavior for it is named anywhere in the spec (P4.1/P4.2 describe a basename list, not a content/target check) — asserting one now would be encoding a guess, not a derivation, and the spec's own Security line says this is a local write guard, not an adversarial control. |
| `MultiEdit` with multiple files, only one protected | **REJECTED** | The real Claude Code `MultiEdit` tool operates on **one** `file_path` with an array of same-file edit operations, not multiple files — confirmed by the hook's own payload field (`tool_input.file_path`, singular) and by the already-existing fixture `toolchain-guard.test.js:149` (`MultiEdit` with a single `file_path` + `edits: []`). There is no multi-file `MultiEdit` shape to construct a test around. |
| Repo with `.ai/` but no `AGENTS.md`, and the reverse | **ADD one direction — P4-EDGE-3** | `isSailesRepo` is `AGENTS.md OR .ai/` (`hooks/lib/repo-state.js:64`). The reverse direction (`AGENTS.md` present, `.ai/` absent) is already exercised by every "in a Sailes repo" fixture in the existing suite, whose `mkrepo()` helper writes only `AGENTS.md`. Only the untested branch — `.ai/` present, `AGENTS.md` absent — is added. |
| Case sensitivity in filenames | **REJECTED** | ESLint/Prettier/Biome/tsc/Ruff themselves only ever look for their fixed-case canonical config filenames; a differently-cased file (`.ESLintrc.json`) would not function as a config to any real toolchain tool regardless of this hook's behavior, so it falls outside "stała lista configów" (P4.1) — testing it would pin an input class that cannot occur as a real toolchain config. |
| Command with `git` mid-string, not at the start (`echo | git commit --no-verify`) | **ADD — P3-EDGE-2** | Same tokenizer path as the already-tested `&&`-chained cases (`block-no-verify.js` treats `|`, `&&`, `;`, `&` uniformly as command separators — confirmed by reading `splitSimpleCommands`), but the pipe form is named explicitly in the brief and is untested; kept in as its own ID rather than folded into the `&&` case. |
| (not in the brief's list, found deriving from git semantics) `git push -n` (dry-run) must NOT be conflated with commit's `-n` | **ADD — P3-EDGE-3** | See "What I could not derive" A2 above. |

**No `Promotion candidate:` found.** Grepped every P3/P4 implementer commit message (`6dfb385`,
`7d9589e`, `94f86dc` — the report surface for these two phases; be-dev implementer roles report in
the commit message per `AGENTS.md` Delegation section, not a separate file) for the label; none is
present. All three name only their own `Verification run:` blocks. Nothing to fold in at step 4.

## Tier-B detection proof plan

For each added ID: run the full suite green once un-mutated, then break the specific line of the
hook that ID exercises, show that ID (and only cases in its partition) go red, revert (confirmed
byte-identical to the pre-mutation copy via `diff`), confirm the full suite is green again.

| ID | Mutation | Result |
|---|---|---|
| P3-EDGE-1 | `block-no-verify.js`: `config` detection narrowed from "any word in the invocation equals `core.hooksPath`" to "the word immediately after `config` equals it" (drops tolerance for a leading `--global`/`--local`/`--system` scope flag) | Only P3-EDGE-1 → FAIL (`1 failing`); rest of the 19-case suite green |
| P3-EDGE-2 | `block-no-verify.js` tokenizer: dropped `\|` from the control-operator character class (kept `;`/`&`; `&&` is matched earlier and unaffected) | Only P3-EDGE-2 → FAIL; rest green |
| P3-EDGE-3 | `block-no-verify.js`: `push` branch changed from `rest.includes('--no-verify')` to also match `rest.includes('-n')` | Only P3-EDGE-3 → FAIL; rest green |
| P4-EDGE-1 | `toolchain-guard.js`: TypeScript pattern narrowed from `/^tsconfig.*\.json$/` to `/^tsconfig\.json$/` | Only P4-EDGE-1 → FAIL; rest of the 29-case suite green |
| P4-EDGE-2 | `toolchain-guard.js`: `matchProtected` gained an early `if (!path.isAbsolute(filePath)) return null;` | Only P4-EDGE-2 → FAIL; rest green |
| P4-EDGE-3 | `hooks/lib/repo-state.js`: `isSailesRepo` narrowed from `AGENTS.md OR .ai/` to `AGENTS.md` only (shared lib, but no other fixture in this suite uses an `.ai/`-only repo, so no collateral) | Only P4-EDGE-3 → FAIL; rest green |

Each mutation was reverted (`diff` against a pre-mutation copy confirmed byte-identical) and both
full suites re-run green: `node hooks/block-no-verify.test.js` → 19/19, `node
hooks/toolchain-guard.test.js` → 29/29.

No `npm test` run mid-phase, per brief rule 4 (only the two `Done-when`-named test commands, both
of which passed above).
