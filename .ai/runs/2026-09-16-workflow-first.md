# Run log — Workflow jako silnik wykonania (1.35.0)

Spec: `.ai/specs/2026-09-16-workflow-first-orchestration.md` · Pre-implement: `.ai/audits/2026-09-16-pre-implement-workflow-first.md`
Research: `.ai/eval-runs/2026-09-16-workflow-research/` · Branch: `feat/1.35.0-workflow-first` · Lead: sesja główna (Opus)

## Cel
Doktryna Workflow z rolami Sailes, pola fazy gotowe do dispatchu, hook `agentType`, koszt workflow w `token-report.js`.
Pomiar faktów harnessu (P0) przed zapisem doktryny.

## Fazy i ścieżka krytyczna

```
fala 1:  P0 (pomiar, blokuje lidera) · P1 · P2 · P5a      — rozłączne            ZROBIONE, zintegrowane
fala 2:  P3 · P4a · P4b · P5b                             — rozłączne            PRZERWANA (koniec sesji) — do ponowienia
fala 3:  P6 (Human-STOP: FP hooka, docs-delta receipt, push)                     czeka
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

## Przebiegi (wszystkie `agent()` z `agentType`; model z roli, chyba że zapisano inaczej)

| Workflow | Co | Wynik | Koszt / czas |
|---|---|---|---|
| `wf_c7c25bee-3b3` | research (3 sondy, 4 kolektory, synteza researcher→sonnet) | `.ai/eval-runs/2026-09-16-workflow-research/` | 469k tokenów, 10,5 min |
| `wf_176ebaa2-236` | fala 1 P1/P2/P5a: be-dev → tester → checker per faza | P1 NITS, P2 NITS, P5a CHANGES-REQUIRED → fix → NITS | $13.01 (bramki 55%), 25 min |
| `wf_bd749c00-327` | P0 pomiar, podejście 1 | P0.1, P0.3 OK; P0.2 + 5×P0.4 zablokowane przez klasyfikator na `git reset --hard` | $0.44 |
| `wf_f63f5640-6d1` | P0 powtórka | 6/6 `WorktreeIsolationError` — cwd lidera poza repo | $0 |
| `wf_3163fdd8-fb5` | P0 powtórka z `git merge --ff-only` | P0.2 + A/B 5/5 OK | $0.94 |
| `wf_bfef201f-177` | eksperyment A/B/C umiejscowienia bramek, 48 agentów | D8: bramki na końcu | ≈ $12.7, 21 min |
| `wf_9f0a06c6-83e` | poprawki fali 1: cennik P1 (be-dev → checker), narracja planu P5a (tester) | NITS; referencja $18.33 była błędna | 238k tokenów, 12,6 min |
| `wf_3d65db17-b38` | fala 2 wg D8: P3, P4a, P4b, P5b równolegle → tester → checker → ≤1 poprawka | **przerwana** z końcem procesu sesji 2026-09-16: 4 be-dev wystartowały, żaden nie zwrócił wyniku; tylko P5b zostawił `WIP: P5b.1` (`30de3d3`, gałąź `worktree-wf_3d65db17-b38-4`); P3/P4a/P4b bez commitów | — |

Integracja (lider, `git merge --no-ff` końcowych SHA): P1 `263ce12`, P2 `2b2a585`, P5a `7cff0f0`, poprawki `5d1e14f`/`eba28a4` → `93bf7b3`.

## Koszt bramek fali 1 (`wf_176ebaa2-236`, z transkryptów, ostatnie `usage` per `message.id`, sonnet 2/10)

| Agent | Tury | USD | Min |
|---|---|---|---|
| be-dev P1 / P2 / P5a / P5a fix | 103 / 49 / 24 / 25 | 3.06 / 1.80 / 0.66 / 0.27 | 13.2 / 11.6 / 4.6 / 1.4 |
| tester P1 / P2 / P5a | 61 / 52 / 57 | 1.80 / 1.84 / 1.57 | 7.7 / 9.1 / 8.5 |
| checker P1 r1 / P2 r1 / P5a r1 / P5a r2 | 33 / 33 / 24 / 12 | 0.64 / 0.55 / 0.47 / 0.34 | 3.8 / 3.1 / 2.7 / 2.6 |

Budowa $5.79 · bramki $7.22 (55%) · razem $13.01.

## Modele (log także nie-nadpisań)
- Fala 1, poprawki, fala 2: be-dev / tester / checker — domyślne z roli (sonnet), bez nadpisań.
- P0.4 ramię A: `model: 'haiku'` na `be-dev` — pomiar A/B (Q4). P0.1: `effort: low|high` na `checker` — pomiar.
- Research: `researcher` z `model: 'sonnet'` (zakaz Opusa dla agentów), explorer z `model: 'sonnet'` dla 3 kolektorów analitycznych.

## Decyzje w trakcie
- **D8 (człowiek, 2026-09-16): bramki tester/checker na końcu**, rozstrzygnięte kosztem i czasem z rundy 1 A/B/C
  (A $1.37 / 9,7 min · B $2.61 / 19,1 min · C $2.53 / 11,4 min). Runda 2 (wykrywalność, koszt późnej poprawki)
  odłożona przez człowieka. Fala 1 szła jeszcze per faza (przed D8).
- **Referencja P1 poprawiona** z $18.33 na $22.19: parser researchu brał częściowe `output_tokens`; korekta w specu i
  `.ai/eval-runs/2026-09-16-workflow-research/README.md`.
- **P0.5 (payload hooka) nierozstrzygnięte**: ustawienia repo skilla nie są wczytywane w sesji z cwd `/home/charlie`;
  hook fail-open; pomiar po wydaniu w sesji uruchomionej w repo.

## Known-red:
- (brak — `npm test` na bazie do uruchomienia przez `qa` w P6)

## Co zostało
- **Wydane 2026-09-17:** merge `--no-ff` do `main` (`5a1e08e`), push za zgodą właściciela, `npm test` exit 0 na `main`.
- Po wydaniu: ponowić eval P4.7 na nazwanej roli `team-lead` (main = tekst 1.35.0); spec B (diagnose/hosting).
