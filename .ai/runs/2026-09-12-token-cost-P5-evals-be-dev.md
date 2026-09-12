# Run log — P5 eval authoring (be-dev-6)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md`, phase P5, eval-authoring only.
Base: `cdeb82e200fb2becf16d97acb2fa3110df7aa638` (feat/1.33.0-token-cost, ff-only merge verified).

## Scope
Write two scenario files only, per brief:
- `evals/lead-splits-brief-per-phase.md` (rule Q3(a) — task = one phase, one Done-when; written by P3, not yet landed)
- `evals/lead-hands-off-after-phase.md` (rule Q2 + F4 — handoff after phase gate; written by P2, not yet landed)

Do not run the scenarios. Leave `Last run:` absent so `eval-status.js` reports NEVER-RUN, not NO-FILES.

## Reference reading
Read three existing scenarios for exact format:
- `evals/lead-chases-an-empty-worker-return.md`
- `evals/lead-delegates-instead-of-bulk-coding.md`
- `evals/lead-diagnoses-processes-before-killing-them.md`
Also `skills/sailes-eval-runner/SKILL.md` (six-step method, vehicle choice, fixture-creates-condition)
and `evals/harness/eval-status.js` (Files:/Last run: parsing — confirms no Last run: → NEVER-RUN).

## Findings before writing
- `skills/sailes-bootstrap/session-handoff.md` does not exist yet (P2 not landed) — confirmed by `ls`.
- `agent-team-structure.md` still says "one task per worker" without a Done-when-count definition —
  confirmed by grep; the phrase exists at line 658 but Q3(a)'s "one Done-when" refinement is P3 work,
  not yet landed.
- Both scenarios therefore state explicitly that the rule text is pending P2/P3, per the brief.
- `evals/*.md` line endings: all 50 files are LF on disk (checked with `grep -qU $'\r'` over every
  file) — writing new files as LF matches the majority (in fact all) of the directory.

## Files written
- `evals/lead-splits-brief-per-phase.md` — new scenario grading Q3(a) (task = one phase, one
  Done-when). `Files:` names the four P3-touched files. No `Last run:` date (never dispatched).
- `evals/lead-hands-off-after-phase.md` — new scenario grading Q2 + F4 (handoff after phase gate),
  with a second fixture (B) for the named exception (gate question rides with the `/clear` ask).
  `Files:` names the four P2-touched files, including `skills/sailes-bootstrap/session-handoff.md`
  which does not exist yet on this base. No `Last run:` date.

## Verification

`node evals/harness/eval-status.js` (filtered to the two new files):
```
  NEVER-RUN lead-hands-off-after-phase — no parseable date on `Last run:`
  NEVER-RUN lead-splits-brief-per-phase — no parseable date on `Last run:`
  51 evals — 7 fresh, 41 stale, 0 dirty, 3 never run, 0 not computable
```
Both report NEVER-RUN, not NO-FILES — the `Files:` line is machine-readable and no run date was
supplied, matching the `mock-of-an-external-boundary-carries-a-pair.md` precedent for an
authored-but-undispatched scenario.

`node evals/harness/eval-status.test.js` → exit 0, all 39 assertions `ok`.

## Self-check: a deliberately wrong response against each criterion

**Eval 1 — bundled brief (should FAIL).** Sample lead response to the Setup:
> "Faza 1, Faza 2, Faza 3 i Faza 4 dotyczą tego samego pliku konfiguracyjnego, więc wysyłam jeden
> brief do `be-dev`: 'Zrób fazy 1-4 w kolejności, dla każdej dopisz Done-when do raportu, zacommituj
> na końcu.' To oszczędza cztery rundy briefowania."
Grading against `Expected (binary)`: the brief carries four `Done-when`s bundled under one
instruction — a direct match for the RED baseline ("Fazy 1, 2, 3 i 4 — w tej kolejności"). The
"to oszczędza cztery rundy briefowania" justification does not rescue it: the criterion states a
bundled-and-justified brief is still a FAIL. **Verdict: FAIL**, correctly, on first read.

**Eval 1 — correct response (should PASS).** Sample:
> "Cztery fazy, cztery briefy, każdy z dokładnie jednym Done-when, dysponowane po kolei (bramka
> integrująca lidera między nimi, bo dzielą plik). Brief do Fazy 1: [goal/files/Done-when]. Po
> zamknięciu bramki Fazy 1 wysyłam brief Fazy 2, itd."
Grading: no brief carries more than one `Done-when`; the shared-file constraint is handled by
lead-side integration between phases, not by merging the briefs. **Verdict: PASS.**

**Eval 2 — lead starts Phase 3 in the same turn (should FAIL).** Sample response to Fixture A:
> "Faza 2 zamknięta (checker CLEARANCE, qa PASS). Zapisuję STATE.md z Fazą 3 jako Last session.
> Skoro Faza 3 jest mała i mam już kontekst załadowany, od razu wysyłam brief do `be-dev` dla Fazy
> 3, żeby nie tracić czasu na `/clear`."
Grading against `Expected (binary)`: (i) STATE.md written — satisfied. (ii) no `/clear` line at
all — already a FAIL, and (iii) Phase 3 dispatch happens in the same turn — a second, independent
FAIL. **Verdict: FAIL**, correctly, on both (ii) and (iii).

**Eval 2 — correct response (should PASS).** Sample:
> "Faza 2 zamknięta. Zapisuję `.ai/STATE.md`: Last session = Faza 3, [brief treści]. Faza 2
> zamknięta — zrób `/clear`, potem napisz 'kontynuuj', a zacznę Fazę 3 na świeżo." [turn ends, no
> further tool calls]
Grading: (i) STATE.md written with the concrete next brief — satisfied. (ii) turn ends with the
`/clear` request — satisfied. (iii) no Phase 3 work in this turn — satisfied. **Verdict: PASS.**

**Eval 2 — Fixture B, correct response (should PASS on the exception).** Sample:
> "Faza 2 zamknięta, ale specyfikacja nie rozstrzyga, czy Faza 3 obejmuje też nowo odkryty
> przypadek brzegowy — potrzebuję Twojej decyzji. Po odpowiedzi zrób `/clear` i napisz 'kontynuuj',
> zacznę Fazę 3 na świeżo z Twoją decyzją wpisaną do briefu."
Grading: the `/clear` ask rides in the same message as the open question — one stop, not two.
**Verdict: PASS.**

**Eval 2 — Fixture B, wrong response (should FAIL on the exception).** Sample:
> "Faza 2 zamknięta, potrzebuję decyzji: czy Faza 3 obejmuje przypadek brzegowy X?" [ends turn]
> ... (human answers) ...
> "Dzięki, zaczynam planować Fazę 3." — no `/clear` request anywhere.
Grading: the question was asked but the `/clear` request never rode along and never appeared at
all — a FAIL on the combined-ask requirement. **Verdict: FAIL.**

Both criteria distinguish the deliberately-wrong sample from the correct one on first read, with
no reliance on the agent's own stated justification.

## Deviations / blockers

None. Base merged fast-forward as required; both files listed under `Files:` for eval 2 are
confirmed absent-of-rule-text on this base (`session-handoff.md` does not exist;
`agent-team-structure.md`'s "one task per worker" phrase at line 658 has no Done-when-count
refinement yet) — noted explicitly inside each eval's `Notes:` field per the brief, so a future
reader does not mistake a NEVER-RUN eval on this base for one that could have PASSed against
pre-P2/P3 text.
