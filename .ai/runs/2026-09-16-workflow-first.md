# Run log — Workflow jako silnik wykonania (1.35.0)

Spec: `.ai/specs/2026-09-16-workflow-first-orchestration.md` · Pre-implement: `.ai/audits/2026-09-16-pre-implement-workflow-first.md`
Branch: `feat/1.35.0-workflow-first` · Lead: sesja główna (Opus)

## Cel
Doktryna Workflow z rolami Sailes, pola fazy gotowe do dispatchu, hook `agentType`, koszt workflow w `token-report.js`.
Pomiar faktów harnessu (P0) przed zapisem doktryny.

## Fazy i ścieżka krytyczna

```
fala 1:  P0 (pomiar, blokuje lidera) · P1 · P2 · P5a      — rozłączne
fala 2:  P3 (wynik P2) · P4 (wynik P0) · P5b (wynik P0)    — rozłączne
fala 3:  P6 (Human-STOP: docs-delta receipt, push)
```

```yaml
ownership:
  P0:
    - .ai/eval-runs/2026-09-16-workflow-facts
  P1:
    - tools/token-report.js
    - tools/token-report.test.js
    - tools/fixtures/token-report-workflow
  P2:
    - tools/ownership-check.js
    - tools/ownership-check.test.js
  P5a:
    - hooks/workflow-agenttype-guard.js
    - hooks/workflow-agenttype-guard.test.js
```

## Workflow fali 1

- **WF-P0** (pomiar): sondy `checker` (effort low/high ×3), `be-dev` worktree (P0.2), `tester` zapis plików (P0.3),
  A/B `be-dev` haiku ×3 vs sonnet ×3 na zadaniu z ukrytym testem akceptacyjnym lidera (P0.4). P0.5: hook
  `PreToolUse` logujący stdin w `.claude/settings.local.json` (lokalny, poza repo).
- **WF-impl-1** (lane middle, WF1+WF2 w jednym): `pipeline([P1, P2, P5a])`: `be-dev` (worktree) → `tester`
  (worktree, reset na commit be-dev; plan DERIVED) → `checker` (worktree tylko do uruchomienia komend, read-only)
  → ≤1 runda poprawek `be-dev` → `checker`. Wszystkie `agent()` z `agentType`, bez nadpisań modelu.
  Integracja (cherry-pick) robi lider po workflow.

## Modele (log także nie-nadpisań)
- WF-impl-1: be-dev / tester / checker — domyślne z roli (sonnet), bez nadpisań.
- WF-P0: checker, be-dev, tester — domyślne (sonnet); P0.4 ramię A: `model: 'haiku'` na `be-dev` — powód: pomiar A/B (Q4).

## Decyzje w trakcie
- (brak)

## Known-red:
- (brak — `npm test` na bazie do uruchomienia przez `qa` w P6)

## Co zostało
- fala 1 w toku
