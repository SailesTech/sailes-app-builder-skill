# Run log — koszt uruchomienia frameworka (1.33.0)

Spec: `.ai/specs/2026-09-12-token-cost-of-running.md` · Pre-implement: `.ai/audits/2026-09-12-pre-implement-token-cost.md`
Branch: `feat/1.33.0-token-cost` · Lead: sesja główna

## Cel
Zmniejszyć tokeny kontekstu na sesję klienta w trzech miejscach: pamięć przy starcie, kontekst
lidera i ogon workerów. Dowód: `tools/token-report.js` przed i po.

## Fazy i ścieżka krytyczna

```
P0 ─┐
P1 ─┴─> P3 ─> P2 ─> P4 ─> P5
```

P0 i P1 mają rozłączne pliki. Pozostałe fazy dzielą pliki doktryny, więc idą po kolei.

```yaml
ownership:
  P0:
    - tools/token-report.js
    - tools/token-report.test.js
    - tools/fixtures/token-report
    - package.json
    - .ai/eval-runs/2026-09-12-token-baseline
  P1:
    - skills/sailes-bootstrap/hooks-template/session-start.sh
    - skills/sailes-bootstrap/hooks-template/hooks-template.test.js
    - skills/sailes-bootstrap/agents-md-template.md
    - skills/sailes-bootstrap/adopt-existing-repo.md
    - skills/sailes-bootstrap/settings-template.json
    - skills/sailes-implement/SKILL.md
    - skills/sailes-bootstrap/agent-team-structure.md
    - agents/team-lead.md
    - codex-agents/team-lead.toml
    - skills/sailes-pre-implement/SKILL.md
    - skills/sailes-bootstrap/agentic-first-principles.md
    - skills/README.md
    - skills/sailes-bootstrap/skeleton.md
    - skills/sailes-bootstrap/repo-done-checklist.md
    - skills/sailes-bootstrap/codex-config-template.md
    - .ai/STATE.md
    - .ai/lessons.md
    - .ai/archive
```

## Decyzje
- 2026-09-12 — pre-implement READY-WITH-FIXES. F1–F4 i rotacja pamięci tego repo w P1 zdecydował
  właściciel. Zapisane w specu.
- 2026-09-12 — P0 prowadzą `be-dev` (narzędzie) i `tester` (lista przypadków ze specu, bez czytania
  implementacji), równolegle, na rozłącznych plikach. Bramy: `checker`, a `qa` uruchamia komendy
  Done-when na prawdziwych transkryptach.
- Źródło definicji pomiaru: skrypty z sesji, w której powstał spec —
  `/tmp/claude-1000/-mnt-praca-Work-Internal-sailes-app-builder-skill/7fc947db-5e6d-4d42-9532-795f5a42f540/scratchpad/{tokens,tokens2,roleturns,longworkers}.js`.
  Są w `/tmp` i mogą zniknąć, więc to materiał referencyjny, nie źródło prawdy.

## Postęp
- [ ] P0 — narzędzie + baseline
- [ ] P1 — pamięć na starcie
- [ ] P3 — worker: zadanie = faza, `maxTurns`
- [ ] P2 — przekazanie sesji + bezpiecznik
- [ ] P4 — stare role
- [ ] P5 — evale, wydanie
