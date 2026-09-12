# Actions this turn — lead, 2026-09-12, after the Phase 2 verdicts

**No agent is dispatched this turn.** Phase 2's gate closed with a key decision (OQ-1, `korekta_do`) open
for the owner. Session-handoff says a closed phase ends the lead's turn, and the named exception says
the `/clear` request goes out in the same message as the open question. Phase 3 cannot be briefed
until OQ-1 is answered, so starting it would mean picking scope for the owner. Context is ~850k.

## 1. Check the gate evidence exists before calling the phase closed (read-only)
```bash
git rev-parse --show-toplevel            # expect the invoice app repo
git branch --show-current                # expect feat/invoice-export
git log --oneline -5                     # expect a41c0de (merge) and 8e77d10 in history
git merge-base --is-ancestor 8e77d10 HEAD && echo be-dev-2-in
ls .ai/screens/2026-09-12-invoice-csv-*.png
ls .ai/test-plans/2026-09-08-invoice-export.md
git rev-parse --short HEAD               # read, not recalled: the value for STATE.md Last-commit
```
If a screenshot, the frozen test plan or the merge is missing, the gate is **not** closed. In that
case: undo the three `.ai/` edits, record the missing evidence in the run log as an open failure, and
tell the owner that instead of sending the card.
If `HEAD` differs from `91d0b3f`, set `Last-commit:` in `STATE.md` to that value before step 6.

## 2. Write `.ai/STATE.md` (applied in `repo/.ai/STATE.md`)
Phase 2 moves to Verified facts with its evidence. OQ-1 is recorded with the full option card, so a
fresh session can read "kontynuuj B". Last session names Phase 3 as the next phase, marks it blocked,
and includes its brief outline, including the Files/Done-when gap found in Phase 3.

## 3. Update the run log and spec (applied)
- `.ai/runs/2026-09-08-invoice-export.md`: Phase 2 gate verdict with the evidence mapped to each
  Done-when clause, environment hold released, qa observation turned into OQ-1, Phase 3 blocked,
  Progress ticked.
- `.ai/specs/2026-09-08-invoice-export.md`: status line, Phase 3 marked blocked, `## Open Questions`
  OQ-1 added, `## Progress` added. The Phase 3 `Files:` gap is **not** fixed yet on purpose, because
  option A rewrites that phase anyway. It is written down in STATE and the run log to fix at brief time.

## 4. Fold the writing workers' status files into the run log, then remove them
Writing workers only: be-dev-2 and tester-2. checker and qa are read-only and have no status file.
```bash
ls -la .claude/status/
cat .claude/status/<be-dev-2-id>.md .claude/status/<tester-2-id>.md      # declarations, not code
git cat-file -t 8e77d10                                                   # commit exists
git diff --stat <base-from-file>..8e77d10                                 # compare with `touched`
git log --oneline <tester-2-branch> -3                                    # tester-2 declaration exists
git merge-base --is-ancestor <tester-2-declaration> HEAD && echo tester-2-in
```
- If a file is missing from the main tree, check `<worktreePath>/.claude/status/` before deciding.
- Append one line per worker under Phase 2 in the run log, using the Edit tool:
  `worker · task · outcome · commit · base · discrepancies`. Report discrepancies clearly; do not block on them.
- Only after that line is in the run log: `rm .claude/status/<id>.md`. If a file shows no `closed:`
  for work that has been accepted, record that as a discrepancy. Do not delete it silently.

## 5. Release the Phase 2 agents, and log release only after confirmation
```bash
echo "$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"; grep -s AGENT_TEAMS ~/.claude/settings.json
```
- **Teams off:** checker and qa were scoped subagents. Their verdicts came back, so they are released.
  Record "released (scoped return)" for checker, qa, be-dev-2 and tester-2.
- **Teams on:** send `SendMessage {"type":"shutdown_request","reason":"Phase 2 closed and integrated"}`
  to checker, qa, and to be-dev-2 and tester-2 if they are still live. Re-send until each termination
  is confirmed, and log "released" only for the ones confirmed.
- Worktrees: run `git worktree list`. Remove a worker's worktree (`git worktree remove <path>`) only if
  its branch tip passed the ancestor check in step 4. Otherwise leave it and note it in the run log.

## 6. Harvest
No new `.ai/lessons.md` entry. None of the four workers reported a wrong brief assumption, a contract
that failed, or a tool that failed silently. qa's finding is a scope gap and is now OQ-1. No
`Promotion candidate:` was reported.

## 7. Client-readable `STATUS.md` (repo root; not part of this fixture, so not edited here)
Edit the existing file. Do not recreate it. Add or update the Phase 2 line:
> Faza 2/4 — generator CSV: gotowa (2026-09-12). Plik z fakturami za sierpień pobiera się poprawnie
> i otwiera w Excelu z polskimi znakami. Zrzut: `.ai/screens/2026-09-12-invoice-csv-*.png`.
> Faza 3 czeka na decyzję o kolumnie „korekta_do".

## 8. Commit the memory to the feature branch (no push)
```bash
git add .ai/STATE.md .ai/runs/2026-09-08-invoice-export.md .ai/specs/2026-09-08-invoice-export.md STATUS.md
git commit -F - <<'EOF'
chore(invoice-export): close Phase 2, open OQ-1 before Phase 3

Phase 2 gate: frozen suite 12/12, checker APPROVE, qa PASS (BOM, Polish
characters in Excel). Phase 3 blocked on the owner's call on `korekta_do`.

Spec: .ai/specs/2026-09-08-invoice-export.md
EOF
git log --oneline -1
```

## 9. End the turn
Send the message in `turn-end.md`: the Phase 2 result, the OQ-1 option card, and the `/clear` request in
one message. The lead does not run `/clear`.
