Review gate for phase **P4** of spec `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md` (framework repo; doctrine text, one parity concept, one eval — no runtime code).

Inputs — ONLY these:
- The diff: in `/home/charlie/Work/Internal/sailes-app-builder-skill/.claude/worktrees/agent-aca1acd19b701a36d`, run `git diff 738be36..77df5c6 -- . ':(exclude).ai/runs'`. Do NOT open anything under `.ai/runs/` — that is the maker's narrative and is excluded from your inputs.
- The spec: its P4 section ("### P4 — zastana czerwień ustalana na bazie", file table, P4.1–P4.4, Done-when) and decision rows Q7, R5, F3.
- Two human decisions taken 2026-09-13 that refine P4.3 and are binding over the spec's P4.3 prose ("Ta sama procedura", which predates them):
  - **D-P4a:** at a phase gate `checker` compares red against the phase's integration base — the commit the worker was cut from, i.e. the left side of the diff range the lead hands `checker`. `git merge-base HEAD origin/<base>` (after `git fetch`) is the base for `qa`'s pre-push run only.
  - **D-P4b:** `checker` runs the same names on that base in a temporary detached worktree outside the repo (`git worktree add --detach <tmp> <base>`, then `git worktree remove <tmp>`), stated as a named exception to read-only that writes only `.git` worktree metadata.
  - The lead also applied the D-P4b mechanism to `qa`'s pre-push base run. The human has NOT yet confirmed that extension — grade whether the diff states it consistently, and say whether it contradicts anything in the spec or in `qa`'s existing rules; do not treat it as a spec violation by itself.
- Your review checklist.

Run the phase's Done-when commands inside that worktree and paste the results: `grep -nE 'merge-base' agents/qa.md codex-agents/qa.toml agents/checker.md codex-agents/checker.toml` (a hit in each); `grep -n 'comm -23' agents/qa.md agents/checker.md` (a hit in both); `node codex-agents/parity.test.js` (exit 0 with the concept "red compared by name against merge-base" for `qa` and `checker`). Do not run the full suite.

Specifically weigh:
1. `Known-red:` entry form is exactly `<file/test name> · <cause> · validity: this push`, expires after the push, and a count is never an acceptable form — everywhere it is stated.
2. `qa` procedure has all four P4.2 steps in order, `comm -23` direction is branch-minus-base, non-empty = CHANGES-REQUIRED, and environment exclusivity is unchanged; the P3 `qa` rules (integrity probe in both lanes, ENV-DEFECT on missing instrument) are intact.
3. `checker` procedure matches D-P4a/D-P4b; the read-only exception is bounded; `.md` and `.toml` twins say the same thing for both roles.
4. A test absent on the base must count as not red on the base (a new red) — check the doctrine does not leave this open.
5. The parity regex: try to break it — a rewording that keeps the rule but fails it, or drops the rule but passes it (scratch copies outside the repo only; never edit repo files). Report, do not fix.
6. Eval matches P4.4 (3 red on base, 1 new red, equal count because one base red was fixed; PASS/FAIL binary as specified).

Write your verdict (mandatory sections: what the diff does NOT do that the spec/decisions require; what it contains that they do not require; then APPROVE / NITS / CHANGES-REQUIRED) to `/tmp/claude-1000/-home-charlie-Work-Internal-sailes-app-builder-skill/ff6d0c42-10f1-4b02-abc4-ee62e73461a3/scratchpad/p4-checker-verdict.md`, appending from your first finding, and return it in full as your final message. An empty return is a failure.