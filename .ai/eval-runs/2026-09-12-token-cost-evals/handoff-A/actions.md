# Actions this turn (in order)

The file edits to `repo/.ai/` are already applied: STATE.md first, then the run log, then the spec.
The actions below go around those edits. **No agent is dispatched this turn.** Phase 2's gate closed,
so the session-handoff rule ends the lead's turn here and Phase 3 starts on a fresh context.

1. **Write `.ai/STATE.md`** — done first, before anything else (applied).

2. **Read the shas I did not have on disk:**
   ```
   git -C <api repo> log --oneline -5 feat/invoice-export
   git -C <api repo> rev-parse --short HEAD
   ```
   Put HEAD into `STATE.md` `Last-commit:`, replacing the a41c0de fallback. Add the tester-2 suite's
   integration sha to the run log's Phase 2 tester-2 line.

3. **Accept the Phase 2 worker declarations and clean up the status files:**
   ```
   ls .claude/status/
   git -C <be-dev-2 worktree> log --oneline -3 ; git -C <be-dev-2 worktree> diff --stat <base>..8e77d10
   git -C <tester-2 worktree> log --oneline -3 ; git -C <tester-2 worktree> diff --stat <base>..<decl>
   ```
   Check metadata only: the `commit` exists, `touched` matches `diff --stat`, and `base` was current.
   For each of be-dev-2 and tester-2, append one line under "Phase 2" in the run log:
   `worker · task · outcome · commit · base · discrepancies`. Then `rm .claude/status/<id>.md`, and
   only together with that line. Report a discrepancy loudly, but do not block on it.
   If there is no file in the main tree, look in the worker's worktree before concluding anything.

4. **Confirm Phase 2 has no live agents** (be-dev-2, tester-2, checker, qa). As scoped subagents,
   their return was the release. If teams mode is on, send `shutdown_request` to each and re-send
   until termination is confirmed. Append `released: <each, confirmed>` to the run log's Phase 2 block.
   Release qa's hold on the runtime environment in the run log too.

5. **Update the root `STATUS.md`** (client-readable; the fixture does not include it). Mark Faza 2 of
   the invoice export done (2/4), with the plain-language result "plik CSV z fakturami otwiera się w
   Excelu z poprawnymi polskimi znakami", and no effort data.

6. **Commit the memory on the feature branch** (lead-owned shared branch, no push):
   ```
   git -C <api repo> add .ai/STATE.md .ai/runs/2026-09-08-invoice-export.md .ai/specs/2026-09-08-invoice-export.md STATUS.md
   git -C <api repo> commit -F - <<'EOF'
   docs(ai): close Phase 2 of invoice-export, hand off Phase 3

   Phase 2 gate: tester suite 12/12, checker APPROVE, qa PASS (BOM, Excel).
   Spec Phase 3 Files gains invoice-csv.service.ts, forced by its own Done-when.

   Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_01H4J9ki3UZZuaKeiGxgvL6r
   EOF
   ```

7. **End the turn** with the line in `turn-end.md`. Do not run `/clear` (that is the human's
   command). Do not dispatch Phase 3's be-dev: its brief is written and waits in the run log.
