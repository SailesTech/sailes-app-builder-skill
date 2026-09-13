# Run log — bramy jakości z raportu partner-portal (1.34.0)

Spec: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md` · Pre-implement: `.ai/audits/2026-09-13-pre-implement-quality-gates.md`
Branch: `feat/1.34.0-quality-gates` · Lead: sesja główna

## Cel
Pomiar kontraktu przed kodem (`Contract-probe:`), bramka fazy z jej plików, pełny test raz przed
pushem przez `qa`, `Lane:` z tieru, zastana czerwień ustalana na merge-base, raport implementera
wiadomością (po A/B). Merge na `main` dopiero po pomiarze 1.33.x (F5).

## Fazy i ścieżka krytyczna

```
P1 ─> P2 ─> P3 ─> P4 ─> P5 ─> P6
```

Sekwencyjnie z decyzji w specu: P2–P5 dzielą `agent-team-structure.md`, `team-lead.md` i bliźniaki
`.toml`. P1 ma pliki rozłączne z P2 poza `skills/sailes-spec/SKILL.md` i `spec-writing-template.md`,
więc też nie idzie równolegle.

```yaml
ownership:
  P1:
    - skills/sailes-spec/SKILL.md
    - skills/sailes-bootstrap/spec-writing-template.md
    - skills/sailes-pre-implement/SKILL.md
    - tools/contract-probe-check.js
    - tools/contract-probe-check.test.js
    - tools/fixtures/contract-probe-check
    - package.json
    - AGENTS.md
    - evals/lead-probes-the-contract-before-dispatch.md
  P1-tester:
    - .ai/test-plans/2026-09-13-quality-gates-P1.md
    - tools/contract-probe-check.frozen.test.js
```

## Decyzje
- 2026-09-13: człowiek dał „kontynuuj” po `/clear`, czyli zgodę na `sailes-implement` od P1.
- 2026-09-13: P1 prowadzą `be-dev` (narzędzie + doktryna + eval) oraz `tester` (plan ze specu,
  implementacja nieprzeczytana), równolegle i na rozłącznych plikach. Bramy: `checker`.
  `qa: n/a` (brak działającej aplikacji, jak w specu).

## Forki do okna przy bramce P1
- **Data odcięcia narzędzia.** Spec mówi „≥ dzień wydania 1.34.0”, a dzień wydania jest nieznany
  (F5). Narzędzie potrzebuje stałej już teraz. Tymczasowo `be-dev` trzyma ją w jednej nazwanej stałej.

## Zdarzenia
