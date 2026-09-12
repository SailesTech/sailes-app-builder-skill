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

- 2026-09-12 — scalone P1a (`41a00cc`, be-dev-2 `ae1b2ad`) i P1b (`40eb0ce`, be-dev-3 `af4786b`);
  pliki rozłączne, bez konfliktów. Dotknięte pliki są po scaleniu LF na dysku, bo git zapisuje
  znormalizowane bloby (`* text=auto`). To nie wada, bloby nie zmieniły końców.
  **Twierdzenie be-dev-2 o istniejącej porażce się nie potwierdziło:** na bazie `8f01c41`
  `npm test` → exit 0, łącznie z `repo-done-checklist`. Zapewne środowisko worktree; sprawdzane
  po scaleniu. be-dev-3 wskazał `AGENTS.md:210`. Ocena lidera: zdanie „read by the next session”
  nie przeczy nowej regule, bez zmian. Checker P1b uruchomiony. Checker P1a czeka na suitę testera-2.

- 2026-09-12 — **Po scaleniu `repo-done-checklist` F2–F2e czerwone, przyczyna ustalona:**
  `repo-done-checklist.test.js:166` miał znacznik końca na sztywno `'\r\nelse\r\n  echo "SKIP graphify'`.
  Scalenie zapisało dokument jako LF (git przechowuje LF), więc znacznik przestał pasować. To ten
  sam mechanizm, przez który worktree be-dev-2 był czerwony, czyli be-dev-2 miał rację, że to było
  wcześniej; na bazie czerwieni nie było widać tylko dlatego, że kopia robocza miała CRLF.
  Każde świeże wyewidencjonowanie (inna maszyna, cache pluginu) było czerwone. Poprawka: regex
  `\r?\n`. Dowód: F2–F2e zielone na dokumencie LF (crlf=0) i na tymczasowej kopii CRLF (crlf=236);
  dokument przywrócony bajt w bajt (`cmp`). Jedyne takie miejsce w testach według grepa po `\r\n`.
- 2026-09-12 — `mcp-toolnames-check` padł raz w pełnym `npm test` („server absent -> SKIP”); trzy
  samodzielne uruchomienia zielone. To samo zgłaszali be-dev-2 i be-dev-3 (EPIPE przy
  współbieżności). Niestabilny, niezwiązany z tym specem. Do backlogu przy zamknięciu, bo bramka,
  która pada bez powodu, zostaje zignorowana.

- 2026-09-12 — **Checker P1b: APPROVE** z jedną uwagą: nagłówek `.ai/STATE.md` wciąż mówi „Read at
  session start”, więc go przeredagowałem. Checker odtworzył też niestabilny `mcp-toolnames-check` na
  bazie sprzed P1b (`41a00cc`), co potwierdza, że błąd był wcześniej. Sprawdzenia: grep z Done-when
  pokazuje wyłącznie nowe zdania z zaprzeczeniem, `sync-blocks --check` in sync, parity i frontmatter
  zielone.
- 2026-09-12 — **P4, sprawdzenie na żywo (Claude Code 2.1.266).** Komenda: `claude -p` w repo
  tymczasowym z `.claude/agents/be-dev.md`, `--output-format stream-json`; wynik odczytany z bloków
  `tool_result`, nie z opisu modelu.
  - (A) kontrola, bez `deny`: `be-dev` → `is_error=false`, „OK”; `sailes-app-builder:be-dev` →
    `is_error=false`, „OK”. Goła nazwa się rozwiązuje, więc odmowa w (B) nie wynika z braku agenta.
  - (B) `.claude/settings.json` = `{"permissions":{"deny":["Agent(be-dev)"]}}`: `be-dev` →
    `is_error=true`, „Agent type 'be-dev' has been denied by permission rule 'Agent(be-dev)' from
    projectSettings.”; `sailes-app-builder:be-dev` → `is_error=false`, „OK”.
  Wniosek: reguła gołej nazwy nie dopasowuje roli z prefiksem pluginu. Blokada zostaje w zakresie.
  Wpisy `deny` do `settings-template.json` dodaje lider, bo P2 zmienia ten sam plik. Część P4
  niezależną od sprawdzenia (Upgrade mode, checklista z testem, bliźniak Codex) prowadzi be-dev-5.

- 2026-09-12 — P4: wpisy `deny` w `settings-template.json` (`dcb4b72`). Sprawdzone skryptem: plik
  parsuje się po usunięciu komentarzy `//`, jest 10 gołych `Agent()` i żaden z prefiksem.
  Asercja w teście dojdzie po scaleniu P4, bo `repo-done-checklist.test.js` należy teraz do be-dev-5.
- 2026-09-12 — scalona suita oceniana P1a z zamrożonym planem (tester-2 `d4f3dbf`, merge `54661c4`),
  25 ID. Na starym hooku: 15 zielonych, 10 czerwonych, wszystkie behawioralne. Na scalonym hooku P1a:
  `session-start-memory: all tests passed`. Podpięta do `npm test`. W toku: dowód wykrywania
  (tester-2, krok 5) i checker P1a.

- 2026-09-12 — **P2, sprawdzenie na żywo `autoCompactWindow` w projektowym `.claude/settings.json`**
  (Claude Code 2.1.266). Komenda: `claude -p "/context"` w repo tymczasowym, dwa przebiegi.
  - Bez ustawienia: `**Tokens:** 13.1k / 1m (1%)`, `Free space 953.9k`, `Autocompact buffer 33k`.
  - Z `{ "autoCompactWindow": 150000 }`: `**Tokens:** 13.1k / 150k (9%)`, `Free space 103.9k`,
    `Autocompact buffer 33k`.
  Wniosek: klucz w pliku projektu jest honorowany, bo okno zmienia się z 1 M na 150 k. Bezpiecznik
  400 000 z P2 może więc iść do `settings-template.json` bez planu awaryjnego ze zmienną
  środowiskową.

- 2026-09-12 — **P0 scalone** (be-dev-1 `40acb1f`). Konflikt w `package.json` rozwiązany skryptem:
  strona be-dev-1 to baza plus dopisany `token-report.test.js`, bez innych zmian. Wynik to 19
  zestawów. Stos `git stash` jest pusty, mimo że worker użył `stash`.
  **Odtworzenie liczb, dowód:** oryginalny instrument
  (`/tmp/.../7fc947db…/scratchpad/tokens2.js`, since 2026-09-11T00:00Z, bez until) i
  `token-report.js --since 2026-09-11 --until 2026-09-13` uruchomione kolejno o ~23:20:
  lider **714M vs 714.0M**, subagenci **1372M vs 1372.4M**; tury 367/560, pierwsza tura 69k/89k,
  szczyt 666k/933k, top 10% lidera 43% — identyczne. Odchyłka od liczb w specu (706 M / 1 297 M,
  160 transkryptów, szczyt p50 627k) wynika z tego, że korpus wciąż rośnie: najnowszy mtime to
  2026-09-12 23:16, a transkryptów subagentów jest 161. Narzędzie zgadza się z instrumentem ±0,03%.
  Spawny: 178, z czego 135 bez prefiksu, rozkład jak w specu (jeden spawn więcej, wbudowany).
  Poufność: grep baseline'u i fixture'ów po ścieżkach klienta, nazwach integracji i polach
  `text`/`content` nic nie znajduje; `baseline.json` ma tylko agregaty (1 881 znaków).
  **Konsekwencja dla porównania po wydaniu:** baseline z 23:15 dnia 12.09 obejmuje okno, które jeszcze
  się nie zamknęło. Filtr po mtime usuwa też z okna sesję wznowioną po północy. Porównanie musi
  czytać zapisany plik, nie liczyć okna od nowa.

- 2026-09-12 — **P0: suita oceniana scalona** (tester-1 `e08f7ce`, merge `cc9a929`), 37 testów.
  Przeciw scalonemu narzędziu: 26 czerwonych. **Klasyfikacja bez zapisu w repo:** wrapper w
  scratchpadzie przemapował sam JSON narzędzia na kształt przypięty w suicie (`transcriptCount` →
  `sessionCount`, `contextTokensTotal` → `totalContextTokens`, `peakContext` → `peak`, `subagents` →
  `subagent`, `subagentsByRole` → `subagent.perRole`, `spawns.unprefixedByName` → `spawns`).
  Wynik: 34 ok, 3 czerwone. Z 26 porażek 23 to wyłącznie nazwy, a **3 to prawdziwe defekty
  narzędzia**:
  - P0-09 i P0-10: wiadomość bez `usage` nie liczy się jako tura;
  - P0-34: tekst pokazuje `0.0M` przy 15 000 tokenów.
  Poprawki zlecone be-dev-1. Który plik zmienia nazwy (narzędzie czy odczyt w suicie), rozstrzyga
  człowiek.

- 2026-09-12 — **Decyzje człowieka:**
  - (1) Rozjazd nazw JSON w P0 → **suita przejmuje nazwy narzędzia**. Tester-1 zmienia tylko ścieżki
    odczytu, żadnej oczekiwanej wartości. Oczekiwane czerwone po zmianie: dokładnie P0-09, P0-10 i
    P0-34, do czasu poprawek be-dev-1.
  - (2) **`tester: n/a` dla P2, P3 i P4.** Powód: deterministyczne części to walidatory (frontmatter,
    parity, checklista, szablon ustawień) z dowodem mutacyjnym w Done-when, a zachowanie modelu
    sprawdzają evale P5. Checker zostaje na każdej fazie.
- 2026-09-12 — scalone P4 (be-dev-5 `84f404e`) i scenariusze evali P5 (be-dev-6 `3a5cf04`).
  P4 zostawił `TODO(human)` w `adopt-existing-repo.md`: framework nie ma szablonu briefu po stronie
  klienta, więc wiedzę z usuwanych ról proponuje przenosić do sekcji `AGENTS.md` repo. Pytanie idzie
  do człowieka na najbliższym przystanku.

- 2026-09-12 — **Checker P1a: NITS.**
  - (1) P1a-21 nie sprawdza ścieżki w komunikacie o ucięciu, a plan tego wymaga. Implementacja
    spełnia wymóg (checker odtworzył). Poprawka poszła do testera-2.
  - (2) `session-start.sh:230-247`: `cut_limit` przycięty tylko do 0. Gdyby `note_bytes` przekroczyło
    `mem_budget`, notka mogłaby przebić 9 500 B. Nieosiągalne w praktyce (ścieżka repo blisko
    `PATH_MAX` plus kilka ostrzeżeń). **Zaakceptowane jako NIT**, bez zmiany.
  - (3) `hooks-template.test.js` ma około 10 testów implementera, które dublują zamrożoną suitę.
    **Zaakceptowane**: usunięcie wymagałoby ścieżki DEAD ze skreśleniem przez człowieka, a dwa zielone
    zestawy nie szkodzą.
  Checker zrobił też dowód Done-when (f): powrót do `cat "$STATE"` → 7 czerwonych (P1a-02, 03, 04, 15,
  21, 23, 24), po przywróceniu 25 zielonych. Hook: `sh -n` OK, brak bash-izmów, `mktemp -d` z
  `trap`, 260 KB w 0,31 s, stdout 9 455 B, ścieżka ze spacjami OK.
- 2026-09-12 — P3 skończony (be-dev-4 `9336fa5`), scalany. Wyjście poza zakres: zdanie w treści
  `be-dev.md` i `fe-dev.md`, bo parity sprawdza oba bliźniaki. Pliki były na liście be-dev-4, więc to
  mieści się w zakresie. Mutacje 1–3 i `npm test` są w jego raporcie; `mcp-toolnames-check`
  zawodził 3 razy na 4.

## Postęp
- [ ] P0 — narzędzie + baseline
- [ ] P1 — pamięć na starcie
- [ ] P3 — worker: zadanie = faza, `maxTurns`
- [ ] P2 — przekazanie sesji + bezpiecznik
- [ ] P4 — stare role
- [ ] P5 — evale, wydanie
