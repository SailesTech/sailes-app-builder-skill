# Kampania: czy spec niosący plan wykonania zmienia zachowanie lidera

Data: 2026-08-06 · Spec: `.ai/specs/2026-08-06-spec-carries-the-execution-plan.md` (draft) ·
Brief: `.ai/briefs/2026-08-06-spec-carries-the-execution-plan.md`

**Ten plik powstał ZANIM przyszedł jakikolwiek wynik.** Kryterium, wykluczenia i cena są zapisane
przed dyspozycją, bo kryterium napisane po zobaczeniu wyników jest opinią w kitlu
(`deciding-under-uncertainty.md`, reguła 1). Wyniki dopisują się niżej, pod własnymi nagłówkami.

---

## Część I — czynnik A (dojście reguły do `AGENTS.md`): NIE URUCHOMIONY, wehikuł nie istnieje

Zaprojektowany jako A3 (baseline) / A1 (krótki wyzwalacz) / A2 (pełny blok `delegation-threshold`)
w trzech worktree. **Nie odpalony ani razu.** Cztery sondy diagnostyczne ustaliły, że nie ma
wehikułu, którym dałoby się go przeprowadzić z wnętrza jednej sesji.

### H1 — pamięć projektu nie idzie za katalogiem roboczym

| Sonda | cwd subagenta | skąd wczytano `AGENTS.md` |
|---|---|---|
| 1 — ścieżka worktree podana w promptcie | korzeń repo | korzeń repo |
| 2 — **sesja fizycznie przełączona w worktree** (`EnterWorktree`) | `.claude/worktrees/armA2` | **korzeń repo** |

W `armA2` leżał na dysku `AGENTS.md` z wklejonym blokiem `delegation-threshold`. Subagent go nie
zobaczył — zacytował wersję z korzenia i wprost stwierdził brak zdania *„This threshold decides who
WRITES. It never decides who GRADES."*

### H2 — pamięć projektu jest zamrożona na starcie sesji

Blok wklejony do **korzeniowego** `AGENTS.md`, subagent powołany kilkanaście sekund później zacytował
**starą** sekcję `## Delegation` dosłownie, bez bloku. `AGENTS.md` przywrócony bajt w bajt do HEAD
natychmiast po sondzie (`git diff --stat AGENTS.md` → pusty).

### Konsekwencja, która wykracza poza tę kampanię

`evals/harness/README.md` przepisuje protokół A/B jako *„Arm A = the definition at the ref before the
change; arm B = after"*. **Dla wszystkiego, co siedzi w `AGENTS.md` / `CLAUDE.md`, ten protokół jest
niewykonalny w obrębie sesji** — oba ramiona dostają ten sam snapshot. Kto tak mierzył doktrynę
z pliku pamięci projektu, porównywał dwa identyczne konteksty i nie mógł tego zobaczyć w danych.

**Zakres, żeby nie przeszacować:** H1/H2 dotyczą **pamięci projektu** (`CLAUDE.md`/`AGENTS.md`).
Nie zmierzono, czy to samo dotyczy `agents/*.md` i `skills/` — te docierają inną drogą (definicja
typu agenta, wywołanie skilla), a plugin serwuje je z `~/.claude/plugins/marketplaces/sailes`, nie
z drzewa roboczego. **Hipoteza do osobnej sondy, nie ustalenie.** Gdyby się potwierdziła, dotyczyłaby
większości evali tego repo.

### Status czynnika A

Pozostały wehikuł to osobny proces na ramię (`claude -p` z wariantem ustawionym przed startem).
Ma wadę ważności, którą trzeba zapisać razem z każdym jego wynikiem: tryb `-p` jest jednostrzałowy
i nieinteraktywny, więc jego skłonność do wołania agentów może się różnić od sesji interaktywnej —
a to sesja interaktywna jest przedmiotem problemu.

---

## Część II — czynnik C (format specu): URUCHOMIONY

### Ramiona

| | Spec | Różnica |
|---|---|---|
| **C1** | `specC1.md` | zawiera sekcję `## Plan wykonania`: blok `ownership:` (yaml), tabela fal z wykonawcą i osią blokowania, wyjaśnienie zależności P4→P1, zdanie że lider nie wykonuje faz |
| **C2** | `specC2.md` | **wszystko inne bajt w bajt identyczne**, bez tej sekcji |

3 przebiegi na ramię (D11 — trzy, większość rozstrzyga). Typ agenta: `sailes-app-builder:team-lead`
na własnym pinie (`claude-opus-5`), **bez override'u** — problem dotyczy tego tieru. Każde ramię
`isolation: worktree`.

**Prompt identyczny w obu ramionach**, różni się wyłącznie ścieżką specu. Świadomie **nie zawiera**
pytania „jak to wykonasz" ani prośby o listę powołanych agentów: to jest defekt U4, przez który
istniejący eval `lead-delegates-instead-of-bulk-coding` jest zielony, mierząc plan na żądanie zamiast
zachowania.

### Fixture

Cztery realne pozycje `.ai/backlog.md` (bliźniaki `WIP:`, ADR w `repo-done-checklist`, warianty
`.env.*` w guardzie, luki w `parity.test.js`). Wybrane tak, by **P1/P2/P3 miały rozłączne zbiory
plików**, a **P4 niósł prawdziwą zależność treściową od P1** — P4 pisze test asertujący klauzulę,
którą wprowadza P1. Rozłączność plików mówi, że sobie nie zniszczą pracy; nie mówi, że P4 ma czego
szukać. To jedyne miejsce, gdzie kolejność nie wynika z przecięcia zbiorów, i jest tym, co C1 mówi
wprost, a C2 zostawia agentowi do wyprowadzenia.

### Kryterium — ustalone TERAZ, przed jakimkolwiek wynikiem

1. **Czy powołał agenta zanim sam edytował plik produktu.** Binarnie.
2. **Ile faz poszło równolegle.** Licznik jednoczesnych dyspozycji.
3. **Czy P4 poszło po P1.** Binarnie — czy zależność treściowa została zachowana.
4. **Czas do pierwszej dyspozycji i czas całkowity.**

Odczyt **mechaniczny, nie z autoraportu**: liczba i gałęzie worktree utworzonych przez ramię,
`git log` na gałęzi ramienia, znaczniki czasu. Raport ramienia jest materiałem pomocniczym.

### Czego NIE punktujemy (reguła 2)

Jakości prozy raportu, tonu, „bogactwa uzasadnienia", elegancji poprawek. Poprawność samego kodu
też **nie jest** zmienną tego pomiaru — mierzymy organizację pracy, nie jej jakość. Jeśli któreś
ramię wyprodukuje zły kod, to jest osobne znalezisko, nie punkt w tej tabeli.

### Ograniczenie treatmentu, do zacytowania przy każdym wniosku

**C1 jest wiązką, nie jedną zmienną**: fale + przypisanie roli + oś blokowania + zdanie o tym, że
lider nie wykonuje faz. Pozytywny wynik mówi, że wiązka działa. **Nie powie, która jej część.**
Rozbicie na osobne czynniki byłoby czterema dalszymi kampaniami i nie zostało zamówione.

### Zagrożenia dla ważności, spisane przed wynikiem

- **Zgodność ramion jest podejrzana przed uwierzeniem** (reguła 5). Jeśli C1 i C2 wyjdą tak samo,
  pierwszą hipotezą jest fixture, nie brak efektu.
- Fixture jest w tym repo słabszym ogniwem częściej niż zachowanie — pięć udokumentowanych
  przypadków, ostatnio ramię, które przeszło *dlatego*, że fixture był zepsuty.
- Ramiona to **subagenty**, a zgłoszony problem dotyczy **sesji interaktywnej**. Rozsądny proxy,
  nie tożsamość.

---

## Wyniki

Sześć ramion wróciło, wszystkie z pełnym raportem. Zero pustych zwrotów, zero `BLOCKED-BY-POLICY`.

### Odczyt mechaniczny — z gałęzi, nie z autoraportów

| Ramię | Wariant | commits | **merges** (zintegrowane gałęzie workerów) |
|---|---|---|---|
| r1 | **C1** | 9 | **5** |
| r2 | **C1** | 10 | **4** |
| r3 | **C1** | 10 | **5** |
| r1 | **C2** | 10 | **3** |
| r2 | **C2** | 11 | **4** |
| r3 | **C2** | 8 | **3** |

C1: 5 / 4 / 5 — mediana **5**. C2: 3 / 4 / 3 — mediana **3**.

**Zastrzeżenie do tej liczby:** `merges` to liczba zintegrowanych gałęzi, czyli *proxy* dla liczby
workerów, których praca weszła — nie licznik powołanych agentów. Ramię, które powołało workera
i odrzuciło jego wynik, liczy się tu jak takie, które nie powołało.

### Miara 1 — czy powołał agenta przed własną edycją: **NULL, brak rozróżnienia**

**6/6 ramion zdelegowało.** Miara nie odróżniła wariantów i było to przewidziane przed odczytem
wyników: fixture to spec czterofazowy na dziesięć plików, czyli daleko powyżej progu delegowania,
więc każdy kompetentny `team-lead` deleguje go niezależnie od sekcji `## Plan wykonania`.

To jest reguła 8 w działaniu — **kryterium jest podłogą, nie sufitem**. Oba ramiona przeszły podłogę,
więc miara nasyciła się i rozstrzygać musi drugi dyskryminator, nie rzut monetą.

### Miary 2 i 3 — ile zdelegował i jak potraktował zależność: **słaby efekt na korzyść C1**

Kierunek spójny we wszystkich trzech parach, ale **z jednym nakładaniem**: C1 r2 (4) zrównuje się
z C2 r2 (4). Dwie z trzech par rozdzielone czysto (5 vs 3, 5 vs 3).

Mechanizm, który to tłumaczy, jest tym, co C1 mówi wprost — **P4 idzie w fali 2, po P1**:
- **C1** ustawiało workerowi P4 bazę zawierającą merge P1 (widoczne w r3: `base 37bf059 → merged to 8cc21d6`) i delegowało P4.
- **C2** wyprowadzało tę samą zależność **poprawnie**, ale wyciągało z niej odwrotny wniosek: skoro
  worker dostałby bazę bez P1, taniej napisać samemu. C2 r3 zrobiło dokładnie to, z podanym powodem.

Ta różnica nie jest o tym, że C2 nie widzi zależności. Jest o tym, że **C1 dostaje ją nazwaną jako
falę, a C2 musi ją wyprowadzić i przy okazji sam wymyślić, jak obsłużyć bazę workera.**

### Werdykt: **SŁABY POZYTYW dla C1, zapisany jako słaby** (D11)

Mediana 5 vs 3 merges, kierunek spójny 3/3, jedno nakładanie. Zgodnie z D11 wynik z nakładaniem
zapisuje się jako sygnał słabego efektu, a nie jako rozstrzygnięcie. **To nie jest podstawa do
twierdzenia, że plan wykonania „działa" — to podstawa do twierdzenia, że idzie we właściwą stronę
i że jedna kampania tego nie domknie.**

### Ważność — trzy skazy, największa jest moja

1. **Skażenie równoległością.** Sześć ramion uruchomiono jednocześnie na jedno wspólne
   `.claude/status/` w głównym drzewie. Ramiona widziały nawzajem swoje pliki statusu i gałęzie;
   **jedno ramię skasowało `rm -f` cztery pliki należące do innych ramion**, a do jednego workera
   trafił cudzy commit jako wpis w jego własnym pliku. Szum jest **skorelowany między ramionami**,
   co jest gorsze niż losowy. Czysty przebieg wymaga ramion serializowanych.
2. **Fixture miał realny błąd rzeczowy** — patrz niżej, potwierdzony 6/6.
3. **Treatment jest wiązką** (fale + role + oś blokowania + zdanie o nie-wykonywaniu). Wynik nie
   mówi, która część zadziałała.

### Defekt fixture'u — potwierdzony niezależnie przez 6/6 ramion

**P4.2 opierało się na nieprawdzie.** Niezmiennik D9 był obecny w `codex-agents/team-lead.toml:42`
i asertowany w `parity.test.js:110` **przed bazą tego przebiegu** — twin wszedł w `5d6dba0`
(wydanie 1.28.2), asercja w `8a45f7e`. Każde ramię sprawdziło to przed dyspozycją, każdy worker
niezależnie, każdy `checker` niezależnie. Żadne nie sfabrykowało edycji, żeby zadanie miało wynik.

Napisałem ten fixture z `.ai/backlog.md:105`, który **nadal niesie nieaktualne twierdzenie**. To jest
szósty udokumentowany przypadek w tym repo, w którym słabym ogniwem był fixture, nie zachowanie —
i dokładnie ta klasa, której spec 1.28.0 poświęcił własną sekcję („backlog kłamał w obie strony").

**Drugi błąd był mój i groźniejszy:** oba warianty specu twierdzą w P3, że `.env.stage` jest
prefiksem `.env.staging`. Nie jest — rozjazd na `stag-e` / `stag-i`. Workery w co najmniej trzech
ramionach sprawdziły to na żywym skrypcie i **odmówiły**; gdyby posłuchały briefu, **usunęłyby
działającą ochronę** `.env.staging`. Backstop zadziałał trzykrotnie, niezależnie.

---

## Żniwo defektów frameworkowych — warte więcej niż sam pomiar

| # | Defekt | Potwierdzeń |
|---|---|---|
| D-1 | **`worker-id` musi być id harnessu, a worker swojego id NIE WIDZI** — mandat niewykonalny | 2 ramiona |
| D-2 | **Znaczniki czasu w plikach statusu są zmyślone** (`T00:00:00Z`, otwarcie i zamknięcie w tej samej chwili) — nic nie wymusza odczytu zegara | 3 ramiona |
| D-3 | **Pliki statusu ZMIENNIE oblewają własny walidator** — jedno ramię 3/3 oblanych, inne 4/4 czystych. Brief mówiący składnię wprost **nie pomógł**, co jest dowodem, że lekarstwo nie jest prozatorskie | 2 ramiona |
| D-4 | **`.claude/status/` nie ma przestrzeni nazw sesji** — kolizje id, nadpisania, i jedno `rm -f` na cudzych deklaracjach | 3 ramiona + incydent |
| D-5 | **`npm test` nie jest deterministyczny pod obciążeniem** — 1 przebieg z 4 dał 2 FAIL-e w testach, których diff nie dotyka; trzy kolejne zielone. `AGENTS.md` twierdzi o tej bramce „every step is deterministic" | 1 ramię |
| D-6 | **`.ai/backlog.md:105` nieaktualny** — D9 zamknięte w 1.28.2 | 6 ramion |
| D-7 | **Najpoważniejszy: rozszerzenie guarda przez lowercase całego payloadu zablokowałoby `process.env.PRODUCTION_URL`, `process.env.STAGE`, `import.meta.env.PROD`** — w KAŻDYM generowanym repo klienckim, z komunikatem nic nie tłumaczącym. Złapane przez `checker` eskalowany do Opusa, na klasie „co diff pomija". Przy okazji znalezione dwa fałszywe pozytywy sprzed tego specu (`process.env.prod_db`, `cfg.env.production.url`) | 1 ramię |
| D-8 | **`settings-template.json:87` nie pokrywa nowych nazw env** i celuje tylko w `Bash\|Edit\|Write` — guard deklarowałby pokrycie, którego okablowanie nie ma | 1 ramię |

D-7 jest tu wynikiem, po który nikt nie przyszedł: **sześć równoległych implementacji tego samego
specu wyprodukowało jedną, która trafiła w minę, i jedną bramkę, która ją rozbroiła.** Pojedynczy
przebieg miał jedną szansę na sześć, żeby to zobaczyć.

## Stan na dysku po kampanii

32 worktree, 28 gałęzi `worktree-agent-*`, 11 plików w `.claude/status/`. Sześć niezależnych,
zielonych implementacji tych samych czterech poprawek — **żadna nie zmergowana, `main` nietknięty.**

