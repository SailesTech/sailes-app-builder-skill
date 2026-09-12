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

## Zdarzenia
- 2026-09-12 — cztery worktree (be-dev P0, tester P0, be-dev P1a, tester P1a) wycięte z `c0b31ff`
  (gałąź domyślna), nie z `ec1b13c`. `be-dev-1` zatrzymał się na sprawdzeniu bazy z briefu i nic
  nie zapisał. Naprawa: `git merge --ff-only feat/1.33.0-token-cost` w worktree; tę samą
  instrukcję dostali pozostali trzej. Sprawdzenie bazy w briefie zadziałało przy pierwszym użyciu.
- 2026-09-12 — P1c (lider): rotacja pamięci tego repo skryptem, który rzuca błąd przy nieznanym
  kształcie, sprawdza zachowanie każdej niepustej linii oryginału i ponownie odczytuje zapis.
  Wynik: `wc -c` → `STATE.md` 12 893 (≤ 20 000), `lessons.md` 39 367 (≤ 40 000). Archiwum:
  76 100 + 6 421 B. Sumy: 88 993 ≥ 88 136 i 45 788 ≥ 45 432. Wszystkie cztery pliki czysto CRLF.

- 2026-09-12 — tester-2 (P1a) oddał 24 przypadki (tier B), plan jest na gałęzi
  `worktree-agent-ad2b148ddd5dec48f` (`e6a18f0`). Z 7 pytań pięć rozstrzyga kontrakt z briefu i
  poszło do be-dev-2: najpierw ostrzeżenia, potem treść; progi ostre w bajtach dziesiętnych;
  brak `Last-commit` → cisza; hook tylko czyta; asercje po podciągu. Q-2 (jedna linia dłuższa niż
  budżet) jest forkiem dla człowieka, zbieranym razem z pytaniami P0. Tymczasowo zaimplementowane
  (a), odizolowane.

- 2026-09-12 — tester-1 (P0) oddał 36 przypadków (tier B), plan na `worktree-agent-a1fe68f7d747504c9`
  (`97b78a4`). **Decyzje człowieka:** filtr dat = mtime pliku (`--since` włącznie, `--until`
  wyłącznie, o północy czasu lokalnego); uszkodzona linia JSONL → pomiń i policz; Q-2 w P1a → (a)
  zero treści + informacja. **Obie listy zamrożone przez człowieka.** Rozstrzygnięte ze specu i
  briefu: top 10% = ceil(n·0,1) z minimum 1 (305 M / 706 M = 43%), szczyt = maksimum pojedynczego
  wywołania, tura = unikalne `message.id`, lista wbudowanych typów z briefu. Suity oceniane idą do
  osobnych plików: `tools/token-report.frozen.test.js` i
  `skills/sailes-bootstrap/hooks-template/session-start-memory.test.js`. `package.json` przy
  scalaniu integruje lider.

## Postęp
- [ ] P0 — narzędzie + baseline
- [ ] P1 — pamięć na starcie
- [ ] P3 — worker: zadanie = faza, `maxTurns`
- [ ] P2 — przekazanie sesji + bezpiecznik
- [ ] P4 — stare role
- [ ] P5 — evale, wydanie
