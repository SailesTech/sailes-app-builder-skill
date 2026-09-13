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

- 2026-09-12 — P3 scalony (`273030a`): `validate-frontmatter` exit 0 (`maxTurns` na siedmiu rolach
  zgodny z Q3), parity zielone, `sync-blocks --check` in sync. Checker P3 uruchomiony. Wysłany P2
  (be-dev-7): blok `session-handoff`, bezpiecznik `autoCompactWindow` 400000 i test.
- 2026-09-12 — P4 F4 (lider): asercja w `repo-done-checklist.test.js`, że lista `Agent()` w `deny`
  to dokładnie dziesięć gołych nazw i żadna z prefiksem. Mutacje: dopisany prefiks → czerwony;
  usunięte `Agent(qa)` → czerwony; szablon przywrócony bajt w bajt (`cmp`) → zielony.

- 2026-09-12 — **CHANGELOG 1.33.0:** szkic napisany, ale `release-hygiene` wymaga, żeby najnowszy
  nagłówek był równy `VERSION` (1.32.0). Szkic odłożony do scratchpadu
  (`CHANGELOG-1.33.0-draft.md`), kopia robocza przywrócona. Wpis wchodzi razem ze stemplami przy
  wydaniu, po delcie dokumentacji, zgodnie z kolejnością w AGENTS.md §Release.
- 2026-09-12 — scalone poprawki P0 (be-dev-1 `da0d3ce`, merge `b5b64d3`) i przejęcie nazw kluczy
  przez suitę (tester-1 `1e6de72`, merge `87e2f97`). `token-report.test.js` zielony, zamrożona suita
  **36/37**: P0-09 i P0-10 zielone. **P0-34 wciąż czerwony:** plan (`P0.md:180`) wymaga identycznych
  metryk w tekście i JSON, a tekst zaokrąga (`15.0k`, `15k`, `100%` przy JSON `1`). Wada narzędzia
  według zamrożonego oczekiwania, wraca do be-dev-1. Podpięcie suity do `npm test` i dowód
  wykrywania P0 czekają na 37/37.

- 2026-09-12 — **Checker P3: APPROVE.** Mutacje w worktree `/tmp`: usunięcie `maxTurns` z `be-dev.md`
  → czerwony dokładnie jeden przypadek; usunięcie zdania „one phase” z `be-dev.toml` → czerwony
  parity. Nowe koncepcje parity na bazie `273030a^1` → 5 czerwonych, frontmatter na bazie → 7
  czerwonych, więc sprawdzenia nie są puste. Zdania w treści `be-dev.md`/`fe-dev.md`: to luka w
  adnotacji plików specu, nie wyjście poza zakres.
- 2026-09-12 — **Checker P4: APPROVE, bez uwag.** Polecenie checklisty na fixture'ach: puste bez
  katalogu, pomija `be-dev.md.bak` i `be-dev-old.md`, działa ze spacjami. F3 czerwony z nazwanym
  błędem bez polecenia i odporny na CRLF. `TODO(human)` o miejscu na odzyskaną wiedzę to realna luka,
  a tymczasowy wybór `AGENTS.md` jest spójny z frameworkiem. Pytanie poszło do człowieka.

- 2026-09-12 — **F5 (człowiek):** wiedza z usuwanej lokalnej roli trafia do `AGENTS.md` repo. `TODO(human)`
  w `adopt-existing-repo.md` zastąpione decyzją i jej kosztem, spec dostał F5 (`e3cab8e`).
- 2026-09-12 — **P1a, dowód wykrywania (tester-2 `6b8a5c8`, tier B): 9/9 mutantów wykrytych.**
  Każdy mutant i przypadki, które go złapały:
  - dopasowanie fałszywego nagłówka → P1a-12;
  - `Verified facts` w wyjściu → P1a-02, 03;
  - budżet `<=` → P1a-15;
  - ostrzeżenia bez rezerwy → P1a-15;
  - `>=` przy progach → P1a-17, 19;
  - **nierozpoznany CRLF → przeżył**, więc wzmocniono P1a-03 i P1a-22 (sprawdzają dosłowne `\r`) i
    teraz jest wykrywany;
  - cięcie w środku linii → P1a-21 (i sprzężone P1a-23);
  - Q-2 zastąpione cięciem → P1a-21;
  - wypełniacz `Last-commit` → P1a-25.
  Uwaga checkera o P1a-21 (ścieżka w komunikacie) uwzględniona. Hook po mutacjach bajt w bajt, suita
  25/25. **Luka w planie do decyzji człowieka:** żaden zamrożony przypadek nie łączy fałszywego
  nagłówka z emoji (`## 🔴 Open failure — …`) z prawdziwym drugim nagłówkiem, więc mutant #1 łapie tylko
  inny fałszywy nagłówek (P1a-12).

- 2026-09-12 — **P2 scalony** (be-dev-7 `347a90e`, merge `4e6acf2`): `sync-blocks --check` in sync,
  blok `session-handoff` w trzech konsumentach, parity i `validate-toml` zielone, test bezpiecznika
  400000 i F4 zielone. Checker P2 uruchomiony na diffie gałęzi. Worker nie mógł powtórzyć
  sprawdzenia `/context`, bo klasyfikator zablokował zagnieżdżone `claude -p`, i zgłosił to wprost;
  sprawdzenie lidera jest wyżej.
- 2026-09-12 — **P1a-26 scalony** (tester-2 `91a48c4`, merge `0033a07`): mutant #1 czerwieni P1a-12
  i P1a-26, hook bez zmian, suita 26/26.
- 2026-09-12 — **Checker P0: NITS.**
  - (1) Dosłowny Done-when „odtwarza 706 M / 1 297 M ±1%” jest niewykonalny na rosnącym korpusie.
    Checker zmierzył 717,3M / 1398,4M przy tym samym oknie. Poprawność dowodzi porównanie z
    oryginalnym instrumentem w tej samej chwili (±0,03%). **Zmiana Done-when idzie do człowieka.**
  - (2) Nieczytelny plik (`EACCES`) przerywa cały run. Q7 rozstrzygnęło tylko uszkodzone linie.
    **Zaakceptowane jako NIT**, wiersz w backlogu.
  - (3) Zapasowe klucze `subagent_type`/`subagentType` przy roli. **Zaakceptowane**, nieszkodliwe.
  Pokrycie: 37 ID z nazwami; zmiana nazw w suicie ruszyła tylko ścieżki (37 `test()` przed i po).
  Poufność czysta. Strumieniowe czytanie, 2 000 plików w 0,15 s.
- 2026-09-12 — **Evale P5 wysłane** (stand-in `general-purpose`, doktryna skopiowana z `4e6acf2`,
  `cmp` identyczne), trzy ramiona: splits, handoff-A, handoff-B. Zastrzeżenia do fixture'ów i
  nośnik: `.ai/eval-runs/2026-09-12-token-cost-evals/README.md`.

- 2026-09-12 — **Checker P2: APPROVE.**
  - Na bazie `0385266` nowa koncepcja parity jest czerwona („a closed phase ends the lead session; the
    human runs /clear…”), a po przywróceniu zielona.
  - Blok nie twierdzi, że model wykonuje `/clear`, a kopia Codex nie wspomina o `autoCompactWindow`.
  - Liczby w komentarzu są zgodne ze specem, a dziesięć wpisów `Agent()` zostało.
  NIT: luźny regex `/\/clear/`, zgodny ze stylem pliku; zaakceptowany. Done-when P2 zawiera jeszcze
  PASS evala `lead-hands-off-after-phase`, dlatego P2 nie jest odhaczony.

- 2026-09-12 — **P0, dowód wykrywania (tester-1 `a3c1c7b`, merge `bcdf994`): 11/11 mutantów wykrytych.**
  Każdy mutant i przypadki, które go złapały:
  - bez deduplikacji → P0-07, 13;
  - `tool_use` tylko z pierwszej linii → P0-06, 28;
  - tura wymaga `usage` → P0-09, 10;
  - szczyt kumulatywny → P0-18;
  - top 10% z zaokrągleniem w dół → P0-21;
  - `--until` włącznie i filtr po UTC → P0-29, 30;
  - brak `claude-code-guide` na liście wbudowanych → P0-26b;
  - bez zdejmowania prefiksu → P0-22;
  - wyjątek na uszkodzonej linii → P0-35;
  - zaokrąglona suma w tekście → P0-34. **Ten mutant przeżył, dopóki P0-34 nie zawęzili do linii z
    sumą**, bez zmiany oczekiwanej wartości.
  Narzędzie po scaleniu bez zmian, obie suity zielone.
- 2026-09-12 — **Evale P5 ocenione z plików** (`.ai/eval-runs/2026-09-12-token-cost-evals/VERDICT.md`):
  - `lead-splits-brief-per-phase` **PASS**;
  - `lead-hands-off-after-phase` **FAIL**. Fixture A: (i) — `STATE.md` wskazuje brief w run logu
    zamiast go zawierać, a doktryna („naming the next phase and its brief”) dopuszcza takie czytanie.
    (ii) i (iii) PASS. Fixture B PASS.
  Rozbieżność doktryna–kryterium i zmiana Done-when w P0 poszły do człowieka.

- 2026-09-12 — **Decyzje człowieka po evalach:**
  - (1) W przekazaniu precyzyjny wskaźnik do briefu na dysku wystarcza. Kryterium (i) zmienione
    (`6c43a0c`), pierwszy FAIL zostaje w historii (`03ad03b`). Zdanie w bloku `session-handoff`
    zmienia be-dev-8. Fixture A powtarzany na świeżym ramieniu (`handoff-A2`, nietknięte pliki
    fixture'u).
  - (2) Done-when P0 zmienione na „zgodny ±1% z oryginalnym instrumentem na tym samym korpusie”
    (`6c43a0c`).
- 2026-09-12 — **docs-author: treść zaktualizowana, potwierdzenie ZABLOKOWANE** (`b3c788f`, niescalone).
  - `architecture.json` i `dataflow.json` zaktualizowane z dowodami: token-report, `.ai/archive/`,
    budżet hooka, czwarty blok. `workflow`, `sequence` i `lifecycle` mają jawnie pustą deltę.
  - Strony HTML nie są przerenderowane: `deliver`/`compare` pada na
    `composition/desktop-readability` w archify 2.17. Pada także na stanie sprzed 1.33.0 i na trzech
    nietkniętych diagramach, a strony renderowano wersją 2.12.
  - **Worker bez zlecenia zainstalował archify globalnie** (`npx skills add tt-a1i/archify -g`).
  Obie sprawy poszły do człowieka.

- 2026-09-12 — docs-author scalony (`ec7adec`) z długiem potwierdzenia, wiersze w backlogu. Zdanie o
  wskaźniku (be-dev-8 `ec591ed`, merge `8b3b207`): `sync-blocks` in sync, parity zielone. Checker na
  nim był uruchomiony. Świeże ramię A2 wysłane z doktryną z `8b3b207`.
- 2026-09-12 — **SESJA ZAKOŃCZONA PRZEZ CZŁOWIEKA.** W toku zostały ramię A2 i checker zdania o
  wskaźniku. Wznowienie według `.ai/STATE.md` → Last session, bloku z nagłówkiem „SESSION ENDED”.
  Szkic wpisu CHANGELOG jest w `.ai/runs/2026-09-12-token-cost-CHANGELOG-1.33.0-draft.md`.

- 2026-09-12 — przed zakończeniem wróciły obie zaległe rzeczy:
  - **Checker zdania o wskaźniku: APPROVE**, bez uwag.
  - **Fixture A2: PASS**. (i) cel, pliki, Done-when i wskaźnik w `STATE.md`; (ii) jedna linia z
    `/clear`; (iii) brak dispatchu. **Scenariusz `lead-hands-off-after-phase` ma PASS** (VERDICT.md).
  Szkic CHANGELOG uzupełniony o zdanie o wskaźniku i wynik A2. Do wydania zostają: wpis + stemple
  w jednym commicie, pełne `npm test` i zgoda człowieka na push.

- 2026-09-13 — **1.33.0 WYDANE.**
  - Wpis CHANGELOG i pięć stempli w jednym commicie `5ab8149`. Szkic był CRLF, a `CHANGELOG.md` na
    dysku jest LF, więc przy wstawianiu przekonwertowano go na LF. Notatka w STATE.md mówiła „CRLF,
    like `CHANGELOG.md`” i była błędna.
  - `npm test` → exit 0: 20 zestawów, 554 × ok, 0 × not ok. Flake `mcp-toolnames-check` się nie pojawił.
  - Człowiek wybrał fast-forward (odrzucone: squash, jeden push razem z domknięciem). `main`
    `c0b31ff` → `5ab8149`, push wykonany. `origin/main` sprawdzony: VERSION, package.json, plugin.json,
    marketplace.json i AGENTS.md mają 1.33.0, a pierwszy nagłówek CHANGELOG to `## 1.33.0`.
  - Domknięcie: spec przeniesiony do `implemented/` z dowodami, AGENTS.md „twenty-one” → „twenty-two”.
    `npm test` po przeniesieniu → exit 1 na `mcp-toolnames-check` („server absent”: `write EPIPE` w
    `tools/mcp-toolnames-check.js:302`, nieobsłużony `error` na sockecie). Łańcuch `&&` zatrzymał się
    na zestawie 4. Pozostałe 19 uruchomione osobno → wszystkie exit 0, w tym `deployed-surface-check`
    (cicho na 22 specach) i `spec-status-evidence`. `mcp-toolnames-check` osobno: 2 × pass, 1 × ten sam
    EPIPE, a ta porażka szła równolegle z pozostałymi zestawami. Flake jest znany, ale odtwarza się
    także poza pełnym łańcuchem.
  - Flake naprawiony (poprawka jednolinijkowa, bez specu). EPIPE przychodzi asynchronicznie jako
    zdarzenie `error` na `child.stdin`, którego `try/catch` w `send()` nie łapie. Dodany pusty
    `child.stdin.on('error')`. Przy tym samym obciążeniu, 20 uruchomień (4 równolegle × 5): przed
    poprawką 15 × fail, wszystkie EPIPE; po poprawce 0. Pełne `npm test` → exit 0, 20 zestawów,
    554 × ok. Wiersz w backlogu zamknięty.
  - Człowiek wybrał wydanie **1.33.1**. Odrzucone: dopisanie linii do 1.33.0, push samego domknięcia,
    brak pusha. Wpis CHANGELOG i pięć stempli → 1.33.1. `npm test` → exit 0, 20 zestawów;
    `release-hygiene` → five stamps at 1.33.1; `sync-blocks --check` → in sync. Delta dokumentacji
    PUSTA, potwierdzenie w `.ai/docs-deltas/2026-09-13-release-1.33.1-notes.md`.

## Postęp
- [x] P0 — narzędzie + baseline (checker NITS zaakceptowane; detection 11/11; frozen 37/37)
- [x] P1 — pamięć na starcie (P1b checker APPROVE; P1a NITS zaakceptowane; detection 9/9 + P1a-26)
- [x] P3 — worker: zadanie = faza, `maxTurns` (merge `273030a`; checker APPROVE; tester n/a — decyzja człowieka)
- [x] P2 — przekazanie sesji + bezpiecznik (merge `4e6acf2`; checker APPROVE; eval PASS po A2)
- [x] P4 — stare role (merge `d4fa89f` + `dcb4b72` + `3fafddd` + `e3cab8e`; sprawdzenie na żywo; checker APPROVE; tester n/a)
- [x] P5 — evale, wydanie (oba evale PASS; 1.33.0 na `main` `5ab8149`)
