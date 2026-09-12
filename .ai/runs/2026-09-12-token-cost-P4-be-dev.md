# P4 run log — be-dev-5 — role-shadow removal (D4)

Base: merged `feat/1.33.0-token-cost` at `f1fe9e2` (ff-only, verified ancestor).

## Brief-template location search (before writing the salvage step)

Searched `skills/` for a client-side "worker brief template" file: `agent-team-structure.md`
(the "Worker brief — the self-contained handover" section, generic format), `agents-md-template.md`,
`skeleton.md`, `.ai/briefs/` usages in this framework repo's own history, `skills/sailes-discovery/brief-template.md`.

Findings:
- `agent-team-structure.md`'s Worker brief format is explicit **framework-only doctrine** —
  `agents-md-template.md`'s own Agent Teams section says so in terms: "load the global
  `sailes-bootstrap` skill — its `agent-team-structure.md` is the canon. (It is a globally-installed
  skill, not a file in this repo.)" No client repo gets a copy of this file.
- `.ai/briefs/*.md` in *this* framework repo are spec-discovery briefs (provenance docs for specs),
  not worker task briefs, and are not part of what a client repo scaffolds.
- `skills/sailes-discovery/brief-template.md` is a *Project Brief* (business/product brief for
  discovery), unrelated to worker task briefs.
- The repo-specific **facts** that populate a worker brief (commands, paths, conventions, stack) live
  in the client repo's own `AGENTS.md` — Key Commands / Conventions / Task Router / Stack sections,
  generated from `agents-md-template.md`. That is the closest client-side artifact to "the brief
  template," but it is the *facts source*, not the brief *format*.

Conclusion: **no client-side "brief template" file exists.** Per the brief's instruction, I did not
invent one. The salvage step in `adopt-existing-repo.md` points repo-specific knowledge from deleted
role files at `AGENTS.md`'s relevant sections, and carries an explicit `TODO(human)` sentence flagging
the gap for the lead to escalate. This is a deviation worth the lead's attention: **decide whether a
dedicated per-repo brief-template artifact should exist**, or whether `AGENTS.md` is deliberately the
intended target and the doctrine should just say so plainly.

## Files touched (before → after)

### 1. `skills/sailes-bootstrap/adopt-existing-repo.md`
Before: Upgrade mode step 2 had a placeholder parenthetical: "(A later exception — Upgrade mode
deleting local role files that shadow plugin roles, P4 of `2026-09-12-token-cost-of-running.md` —
sits next to these two, not folded into them.)"
After: replaced with a full **(c) role-shadow removal** exception, sibling to (a) hook patch and
(b) memory rotation: salvage repo-specific knowledge to `AGENTS.md` first (with the TODO above),
then delete the file, then show the human the salvage diff + deletion list together before writing
— matching (a)/(b)'s "diff before writing" pattern. Named non-role files (e.g. `be-checker.md`) are
explicitly NOT auto-deleted — listed and asked instead.

### 2. `skills/sailes-bootstrap/repo-done-checklist.md`
Before: `## Case A / Case C (existing repo)` had only prose bullets, no role-shadow check.
After: added a bullet + fenced `bash` block, matching the doc's other pasteable-command style
(no `$ROOT`, assumes cwd = repo root — matching the Freshness-check block's convention, since this
section's existing bullets are otherwise prose-only, not the top verification block's `$ROOT` style):

```bash
for f in .claude/agents/*.md; do
  [ -e "$f" ] || continue
  case "$(basename "$f" .md)" in
    be-dev|fe-dev|explorer|checker|qa|tester|designer|researcher|docs-author|team-lead)
      basename "$f" ;;
  esac
done
```
Pass criterion stated inline: empty output = clean. Points back at `adopt-existing-repo.md`
Upgrade mode exception (c) as the fix for anything this finds.

### 3. `skills/sailes-bootstrap/repo-done-checklist.test.js`
Before: F1 (graphify-setup.md sed portability) and F2 (core.hooksPath resolution) extractors only.
After: added **F3** — `extractRoleShadowScan()` pulls the loop above as a literal substring (start
marker `for f in .claude/agents/*.md; do`, end at the following `done`), same pattern as
`extractNormalizeBlock`/`extractHooksResolutionBlock`. Four cases against real `sh` + real fixture
dirs: (a) `be-dev.md` → `be-dev.md`; (b) only `be-checker.md` → no output; (c) no `.claude/agents`
dir → no output, no stderr; (d) all ten role files → all ten named. Reuses the file's existing
`shAvailable()` skip.

## Mutation proofs (pasted)

**(1) delete the command from the doc:**
```
  FAIL F3b: only be-checker.md present (not a plugin role name) -> no output
       could not find the role-shadow scan loop in repo-done-checklist.md
  FAIL F3c: no .claude/agents dir at all -> no output, no error text
       could not find the role-shadow scan loop in repo-done-checklist.md
  FAIL F3d: all ten role files present -> all ten named

repo-done-checklist: 5 failing
```
Named error (`F3a` also failed on the same message, truncated above by `tail`). Restore →
`repo-done-checklist: all tests passed`.

**(2) `tester` → `testr` in the doc's case arms:**
```
    'checker.md',
    'designer.md',
    'docs-author.md',
...
    'team-lead.md',
-   'tester.md'
  ]

repo-done-checklist: 2 failing
```
(F3: case-arms-contain-all-ten-names test also failed, since `tester` literal is gone from the
block — 2 failing total.) Restore → `repo-done-checklist: all tests passed`.

**(3) CRLF conversion (whole file, in place, byte-identical restore verified by `cmp`):**
```
skills/sailes-bootstrap/repo-done-checklist.md: ... UTF-8 text, with very long lines (548)
skills/sailes-bootstrap/repo-done-checklist.md: ... UTF-8 text, with very long lines (548), with CRLF line terminators
  ok   F3: the doc still contains the role-shadow scan loop, all ten names in its case arms
  ok   F3a: .claude/agents/be-dev.md present -> names be-dev.md
  ok   F3b: only be-checker.md present (not a plugin role name) -> no output
  ok   F3c: no .claude/agents dir at all -> no output, no error text
  ok   F3d: all ten role files present -> all ten named

repo-done-checklist: all tests passed
```
Restore: `cmp /tmp/rdc-orig-forcmp.md skills/sailes-bootstrap/repo-done-checklist.md` → `IDENTICAL`
(no output from `cmp`, exit 0), then suite green again. The extraction is LF/CRLF-agnostic because
`runRoleShadowScan()` does `.replace(/\r\n/g, '\n')` on the extracted block before handing it to
`sh -c`, same discipline as F1/F2's existing `runHooksResolution`.

### 4. `skills/sailes-bootstrap/codex-config-template.md`
Before: mapping table (Claude guardrail → Codex counterpart) + `apply_patch` PreToolUse caveat;
nothing about role-shadowing at all.
After: new section "Role-shadowing block (D4, P4…) — n/a for Codex", inserted after the
`apply_patch` caveat and before the `.codex/config.toml` listing. Checked `enable-codex-agents.sh`
and `codex-agents/README.md` per the brief: Codex custom agents install **only at user scope**
(`~/.codex/agents/*.toml` + one managed block in `~/.codex/config.toml`) — no `.codex/agents/`
project directory exists in anything this framework ships, so there is no local file that could
shadow a Codex role the way `.claude/agents/<name>.md` shadows a plugin role. Wrote an explicit
**n/a** with that reason, and a second explicit **n/a** for the `Agent(<name>)` deny counterpart —
Codex's guardrail surface (`sandbox_mode`/`approval_policy`/`[[hooks.PreToolUse]]`) has no
role-name-scoped denial primitive; the closest analogue (dropping the role's `[agents.<name>]`
entry) is "the role does not exist," not "deny this spawn."

## npm test

(run below, before the declaration commit)
