# Actions this turn: Phase 2 gate closed, session handoff

The checker returned APPROVE and qa returned PASS. Together they cover both clauses of Phase 2's
`Done-when`: the frozen 12-case suite is green, and the 3-invoice file with a UTF-8 BOM opens in Excel
with Polish characters. The gate is closed. Under the session-handoff rule the lead's turn ends here,
and Phase 3 does **not** start on this ~850k context. No agents are dispatched this turn.

In order:

1. **Write `.ai/STATE.md` first, before anything else.** It gets the verified facts with evidence, open
   failures (none), and a Last session entry naming Phase 3 with its brief: goal, files and Done-when,
   plus a pointer to the spec section. It also records the pre-dispatch check on the Files list vs
   Done-when gap. *(Applied to `repo/.ai/STATE.md`.)*

2. **Check the evidence and the worker state. These are metadata reads only.**
   - `git rev-parse --show-toplevel && git branch --show-current` confirms I am in the product repo on `feat/invoice-export`.
   - `git log --oneline -3 feat/invoice-export` confirms `a41c0de` (the Phase 2 merge) is on the branch.
   - `ls .ai/screens/2026-09-12-invoice-csv-*.png` confirms the screenshots qa cited exist on disk.
   - `ls .claude/status/` looks for declaration files from be-dev-2 and tester-2. The writing roles are
     the only ones that claim these files. For each file: fold it into the run log's Phase 2 section as
     one line (worker · task · outcome · commit · base · discrepancies), then remove the file. The
     removal happens only together with that line.
   - Live-agent check: if any Phase 2 agent (be-dev-2, tester-2, checker, qa) is still alive as a
     teammate, send `SendMessage {"type":"shutdown_request","reason":"Phase 2 closed"}` and wait for the
     termination to be confirmed. Scoped subagents ended when they returned. Nothing is held for Phase 3.
   - If any of these checks contradicts the run log, correct `STATE.md` and the run log before step 5,
     and name the problem in the turn-end message instead of the plain handoff line.

3. **Update the run log.** Mark Phase 2 closed, record the gate reading against both Done-when clauses,
   the end of qa's hold on the runtime environment, and that no lessons were harvested (and why). Tick
   Phase 2 in Progress. *(Applied to `repo/.ai/runs/2026-09-08-invoice-export.md`.)*

4. **Update the spec status line** to in-progress with Phases 1–2 closed and the Phase 2 verdicts. The
   spec stays in `.ai/specs/` because Phases 3–4 remain. No docs-delta, since that runs at spec closure
   and not at a phase gate. *(Applied to `repo/.ai/specs/2026-09-08-invoice-export.md`.)*

5. **Update the root `STATUS.md`**, the client-readable phase status. It is not in this exercise copy,
   which holds only `.ai/`. Edit the existing file and do not invent one. Set phases done to 2/4 and add
   the plain-language result for Phase 2: "Generator CSV gotowy: plik z fakturami z wybranego miesiąca
   otwiera się w Excelu z poprawnymi polskimi znakami; 12 zamrożonych testów przechodzi." Leave out
   effort and pricing data.

6. **Commit the close-out on the shared branch.** The lead owns it. No push.
   ```
   git add .ai/STATE.md .ai/runs/2026-09-08-invoice-export.md .ai/specs/2026-09-08-invoice-export.md STATUS.md
   git commit -m "chore(invoice-export): close Phase 2 — checker APPROVE, qa PASS; handoff to Phase 3"
   ```

7. **End the turn** with the one line in `turn-end.md`. I do not run `/clear` myself, and I do not
   dispatch Phase 3's be-dev. That starts in the next session from the SessionStart summary of
   `STATE.md`, after the Files vs Done-when check recorded there.
