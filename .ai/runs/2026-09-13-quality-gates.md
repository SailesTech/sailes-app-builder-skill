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
  P2:
    - skills/sailes-spec/SKILL.md
    - skills/sailes-bootstrap/spec-writing-template.md
    - skills/sailes-implement/SKILL.md
    - skills/sailes-bootstrap/agent-team-structure.md
    - agents/be-dev.md
    - agents/fe-dev.md
    - agents/checker.md
    - agents/qa.md
    - codex-agents/be-dev.toml
    - codex-agents/fe-dev.toml
    - codex-agents/checker.toml
    - codex-agents/qa.toml
    - skills/sailes-bootstrap/release-checklist.md
    - skills/sailes-bootstrap/agents-md-template.md
    - codex-agents/parity.test.js
  P3:
    - skills/sailes-spec/SKILL.md
    - skills/sailes-bootstrap/spec-writing-template.md
    - skills/sailes-bootstrap/gate-scaling.md
    - skills/sailes-bootstrap/agent-team-structure.md
    - agents/team-lead.md
    - codex-agents/team-lead.toml
    - skills/sailes-bootstrap/agents-md-template.md
    - skills/sailes-test/SKILL.md
    - skills/sailes-test/test-plan-template.md
    - agents/tester.md
    - codex-agents/tester.toml
    - agents/checker.md
    - codex-agents/checker.toml
    - agents/qa.md
    - codex-agents/qa.toml
    - skills/sailes-implement/SKILL.md
    - agents/fe-dev.md
    - codex-agents/fe-dev.toml
    - codex-agents/parity.test.js
    - evals/lead-picks-the-lane-from-the-tier.md
  P4:
    - skills/sailes-implement/SKILL.md
    - skills/sailes-bootstrap/release-checklist.md
    - agents/qa.md
    - codex-agents/qa.toml
    - agents/checker.md
    - codex-agents/checker.toml
    - codex-agents/parity.test.js
    - evals/gate-compares-red-by-name-not-count.md
```

## Decyzje
- 2026-09-13: człowiek dał „kontynuuj” po `/clear`, czyli zgodę na `sailes-implement` od P1.
- 2026-09-13: P1 prowadzą `be-dev` (narzędzie + doktryna + eval) oraz `tester` (plan ze specu,
  implementacja nieprzeczytana), równolegle i na rozłącznych plikach. Bramy: `checker`.
  `qa: n/a` (brak działającej aplikacji, jak w specu).
- 2026-09-13 (nowa sesja po `/clear`): człowiek dał „kontynuuj”, czyli zgodę na P2. P2 prowadzi jeden
  `be-dev` w worktree (tylko doktryna i koncept parity). `tester: n/a`, bo spec daje go tylko P1.
  Brama: `checker`. `qa: n/a`.
  Przed dispatchem lider sprawdził, że grep z `Done-when` P2 trafia dziś w 7 miejsc
  (`be-dev.md:16`, `fe-dev.md:17`, oba `.toml:11`, `sailes-implement/SKILL.md:41`, `parity.test.js:158,166`).
  Warunek „brak trafień” coś więc mierzy i nie przechodzi pusto.
- 2026-09-13 (nowa sesja po `/clear`): człowiek dał „kontynuuj”, czyli zgodę na P3. Tak jak w P2: jeden `be-dev`
  w worktree, baza przez `merge --ff-only feat/1.34.0-quality-gates` od `7718210`. `tester: n/a`,
  brama `checker`, `qa: n/a`. Raport: `.ai/runs/2026-09-13-quality-gates-P3-be-dev-report.md`.
  Przed dispatchem lider sprawdził dwie rzeczy. Grep `DERIVED` z `Done-when` P3 daje dziś 0 trafień
  we wszystkich czterech plikach, a `Lane:` nie występuje w `skills/`, `agents/` ani `codex-agents/`.
  Warunek coś więc mierzy. Kotwice linii z tabeli P3 pochodzą sprzed P2 i się przesunęły (np.
  `qa.md` :17/:18 to teraz :18/:19), dlatego brief wskazuje miejsca po treści.
  Punkt otwarty w briefie: `qa.md` ma też bullet o sondzie integralności (browser-inspect §1), którego
  spec w P3.4 nie wymienia. Zostaje bez zmian. Jeśli `be-dev` zgłosi sprzeczność, to fork dla człowieka.
- 2026-09-13: `be-dev` P3 wrócił z commitem `75d8d11` (worktree `agent-a5054500d8f3a4787`, 6 WIP + final).
  Lider sprawdził w worktree:
  - diff to 20 plików z listy P3 i raport, nic poza tym;
  - `sync-blocks --check` → in sync;
  - parity → exit 0 (10 ról);
  - frontmatter → exit 0;
  - grep `DERIVED` → 3/5/1/1 trafień (baseline 0);
  - eval istnieje;
  - `npm test` → exit 0, 0 `not ok`.

  `be-dev` zgłosił dwie niejasności:
  1. **Sonda integralności w `qa.md`** nadal obowiązuje bez warunku toru, tuż pod screenami, które warunek
     `full` już dostały. Zgłoszona zgodnie z briefem. To fork dla człowieka, do okna po werdykcie `checker`.
  2. **`checker.toml` nie miał dotąd pokrycia ID** (`.md` je miał). `be-dev` dopisał je zamiast rozszerzać
     istniejące zdanie. Lider przyjmuje to bez forka: P3.6 wymaga, żeby koncept pasował do obu bliźniaków,
     więc bez tego parity nie przejdzie. Była to też cicha luka parity sprzed tego specu, do CHANGELOG w P6.

  Dispatch `checker`: wejście to diff `7718210..75d8d11` bez `.ai/runs/` i sekcja P3 specu. Raportu
  `be-dev` nie dostaje.
- 2026-09-13: `checker` P3 → **NITS**. Wszystkie punkty `Done-when` potwierdzone. Wszystkie wiersze tabeli P3
  pokryte. Nadmiaru brak: 4 koncepty parity i 3 fazy evala, dokładnie tyle, ile wymaga spec.
  Dwa znaleziska poza tabelą P3, oba sprawdzone przez lidera na dysku:
  - (a) `codex-agents/qa.toml:13` każe przy braku instrumentu integralności wrócić do screena, a
    `agents/qa.md:20` każe zgłosić ENV-DEFECT. To rozjazd bliźniaków sprzed P3, którego test parity nie
    widzi. Teraz stoi też w sprzeczności z nowym zdaniem o torze `middle` w tym samym pliku.
  - (b) `skills/sailes-bootstrap/agentic-first-principles.md:91` powtarza kolejność ról bez odsyłacza do
    `gate-scaling`.

  Merge `75d8d11` do `feat/1.34.0-quality-gates` (`--no-ff`) → **`cc9516a`**. Pierwsza próba padła
  (`git merge -F -`: „could not read file '-'”, `git merge` nie czyta wiadomości ze stdin) i nic nie
  zmieniła. Wiadomość poszła więc z pliku. Forki (a), (b), sonda integralności w `middle` i handoff
  poszły do jednego okna.

## Decyzje człowieka przy bramce P3 (2026-09-13)
- Sonda integralności UI (browser-inspect §1) działa **w obu torach**. Odrzucone: tylko `full`; w `middle`
  tylko przy nowym ekranie.
- `qa.toml:13` wyrównany do `qa.md` teraz: brak instrumentu → ENV-DEFECT, nigdy screen. Dochodzi koncept
  parity, żeby rozjazd nie wrócił. Odrzucone: wiersz w backlogu.
- `agentic-first-principles.md:91` dostaje odsyłacz do `gate-scaling` teraz. Przegląd pozostałych
  powtórzeń kolejności ról idzie do backlogu. Odrzucone: wszystko do backlogu.
- P4 w tej sesji, bez handoffu. Odrzucone: `/clear` i P4 w nowej sesji.

## Zdarzenia po bramce P3
- 2026-09-13: lider wdrożył decyzje w commicie **`7701057`** (9 plików).
  - Zmiana w źródle `gate-scaling`, `sync-blocks` przeniósł ją do 3 kopii.
  - `qa.md` i `qa.toml`: sonda w obu torach, a brak instrumentu to ENV-DEFECT.
  - `parity.test.js`: dwa koncepty pozytywne, jeden odwrotny i test sprawdzający, że odwrotny łapie stary
    tekst. Komunikat odwrotny jest teraz ogólny, bez „1.33.0”.
  - Odsyłacz w `agentic-first-principles.md`.
  - Wiersz w backlogu: pozostałe powtórzenia kolejności; oba pliki `sailes-discovery` pomijają też `tester`.

  Dowody:
  - `sync --check` → in sync;
  - parity → exit 0;
  - frontmatter → exit 0;
  - grep `DERIVED` 3/5/1/1;
  - `npm test` → exit 0, 0 `not ok`.

  Sprawdzenie w obie strony, na kopiach w scratchpadzie, bez dotykania repo:
  - `.toml` bez „in both lanes” → exit 1, FAIL tylko na tym koncepcie;
  - `.md` bez „in both lanes” → exit 1, to samo;
  - `.toml` z powrotem ze starym zdaniem o screenie → exit 1, FAIL na ENV-DEFECT i na koncepcie odwrotnym.

  Brama: `checker` na `cc9516a..7701057`, bo diff napisał lider.
- 2026-09-13: przygotowanie P4, bez dispatchu, bo P3 nie jest jeszcze zamknięte.
  - Baseline `Done-when` P4: `merge-base` daje 0 trafień w `qa.md`, `qa.toml`, `checker.md` i `checker.toml`;
    `comm -23` daje 0 w `qa.md` i `checker.md`; `Known-red` daje 0 w `skills/`, `agents/`, `codex-agents/` i `evals/`.
    Warunki coś więc mierzą.
  - Doktryna nigdzie nie definiuje merge-base dla bramki fazy, a `checker` nie ma żadnej reguły o
    worktree ani checkout.
  - Dwie luki P4.3 poszły do okna: jak read-only `checker` uruchamia komendy na bazie oraz która baza
    obowiązuje na bramce fazy.
  - Rozstrzygnięte przez lidera bez forka, bo ma jedną sensowną odpowiedź: test, którego na bazie nie ma,
    liczy się jako „nie czerwony na bazie”. Jego czerwień na gałęzi jest więc nowa.
- 2026-09-13: `checker` na poprawkach P3 (`cc9516a..7701057`) → **NITS**.
  - Trzy decyzje wdrożone w obu bliźniakach i w `gate-scaling`.
  - `sync`, parity, frontmatter i `npm test` zielone; 637 `ok`, 0 `not ok`.
  - Nadmiaru brak.
  - Jedyne znalezisko: wiersz backlogu pomijał `docs/agent-roles.md:30` i `README.md:159`. Lider sprawdził
    to grepem i poprawił wiersz.

  Uwaga `checker` bez znaleziska, bo dotyczy całej klasy regexów w parity: nowe regexy sprawdzają bliskość
  fraz, a nie ich sens. Zdanie wykluczające `middle` z sondy nadal przejdzie, jeśli stoją w nim obok siebie
  „integrity” i „both lanes”. Odwrotny regex łapie dosłowną frazę, a nie parafrazę.
- **P3 ZAMKNIĘTE 2026-09-13.**
  - Wszystkie punkty `Done-when` spełnione, dowody w `Status:` specu.
  - checker: NITS → poprawki → NITS poprawione.
  - tester: n/a · qa: n/a.
  - Agenci `be-dev` i obaj `checker` zakończeni, zwolnieni.

## Decyzje człowieka przed P4 (2026-09-13)
- Na bramce fazy `checker` porównuje czerwień z **bazą integracji fazy**: commitem, od którego worker
  wyszedł (baza `ff-only` z briefu). `origin/<baza>` z `git merge-base` zostaje dla `qa` przed pushem.
  Odrzucone: `origin/<baza>` na obu bramkach.
- `checker` uruchamia nazwy na bazie w **tymczasowym worktree poza repo**: `git worktree add --detach <tmp> <baza>`,
  a po przebiegu `git worktree remove`. To nazwany wyjątek od read-only, zapisuje tylko metadane `.git`.
  Odrzucone: przebieg na bazie przez lidera; `checker` tylko nazywa czerwień.

## Zdarzenia P4
- 2026-09-13: dispatch `be-dev` na P4 (P4.1–P4.4 i koncept parity) w worktree.
  - Baza przez `merge --ff-only feat/1.34.0-quality-gates`, a brief wymaga, żeby HEAD był wtedy `738be36`.
  - `tester: n/a`, brama `checker`, `qa: n/a`.
  - Raport: `.ai/runs/2026-09-13-quality-gates-P4-be-dev-report.md`. Status: `be-dev-P4-quality-gates.md`,
    bo `be-dev-P4-<hash>.md` z innego specu już istnieje.
  - `parity.test.js` dopisany do tabeli plików P4, choć tabela specu go nie wymienia: `Done-when` wymaga
    konceptu parity.
  - Odczyt lidera w briefie: decyzję o tymczasowym worktree bazy lider przeniósł na przebieg bazy `qa`
    przed pushem. `qa` ma to samo ograniczenie (brak Write/Edit, nie może ruszać testowanego drzewa), a
    checkout w głównym drzewie odpada, bo niszczy kopię roboczą. Poza oknem decyzji, do potwierdzenia przy
    bramce P4.
- 2026-09-13: `be-dev` P4 wrócił z commitem `77df5c6` (worktree `agent-aca1acd19b701a36d`, 2 WIP + final).
  Lider sprawdził w worktree:
  - diff to 8 plików z tabeli P4 plus raport, nic poza tym;
  - `merge-base` → trafienie w każdym z 4 plików; `comm -23` → w obu;
  - parity → exit 0, koncept „pre-existing red compared by name against the base, never by count” dla
    `qa` i `checker`;
  - `sync --check` → in sync;
  - `npm test` → exit 0, 0 `not ok`.

  Reguła `checker` bierze bazę z lewej strony zakresu diffu od lidera i wprost odróżnia ją od merge-base
  `qa`. Wyjątek od read-only jest ograniczony do metadanych `.git`.

  Trzy niejasności z raportu `be-dev`. Lider rozstrzyga bez forka, bo każda ma jedną sensowną odpowiedź:
  1. **Arytmetyka fixture'u evala.** Baza `{A,B,C}`, gałąź `{A,B,D}`, czyli C naprawiony, D nowy, a liczba 3 = 3.
     To dosłowny odczyt P4.4.
  2. **Brak nowego pola briefu `Diff-base:`.** Niepotrzebne, bo `checker` i tak dostaje zakres diffu, a
     baza to jego lewa strona. Nowe pole byłoby nadmiarem poza tabelą P4.
  3. **Proza P4.3 w specu („Ta sama procedura”) nie zgadza się z D-P4a.** Lider poprawi ją przy zamknięciu
     P4 i zapisze w specu decyzję człowieka.

  Dispatch `checker`: wejście to diff `738be36..77df5c6` bez `.ai/runs/`, sekcja P4 specu i D-P4a/b.
  Rozszerzenie na `qa` oznaczone jako niepotwierdzone przez człowieka.
- 2026-09-13: w trakcie bramki P4 lider dopisał do specu decyzje przed P4 jako wiersze G1 i G2 tabeli
  decyzji. Proza P4.3 odwołuje się teraz do nich i mówi wprost, że test nieobecny na bazie nie jest
  czerwony na bazie. Spec nie jest jeszcze scommitowany i wejdzie razem z zamknięciem P4.
- 2026-09-13, przygotowanie P5 (bez dispatchu):
  - komenda `node skills/sailes-bootstrap/hooks-template/brief-closure.test.js` z `Done-when` istnieje;
  - `brief-closure.js` wymaga pola `Report/Raport` w briefie, co zgadza się z P5.1, gdzie etykieta zostaje;
  - `be-dev.md` `## Report`: podsumowanie diffu per plik · wyjście komend · kształt kontraktu ·
    `Promotion candidate:` · blokady;
  - wzór A/B: `.ai/eval-runs/2026-08-30-spec-weight/` (`armA.md`, `armB.md`, `VERDICT.md`).

  P5.3 wymaga decyzji człowieka co do projektu eksperymentu, do okna po bramce P4: na jakim zadaniu, ile
  przebiegów na ramię, po której zmianie przerwać. Odsetek pustych zwrotów z jednego przebiegu to 0 albo
  100%, więc liczba przebiegów decyduje, czy warunek „B ma więcej pustych” w ogóle coś mierzy.
- 2026-09-13: `checker` P4 → **NITS**.
  - Nic z P4.1–P4.4, Q7, R5, F3 ani G1/G2 nie zostało naruszone. `Done-when` zielony, bliźniaki zgodne.
  - Test nieobecny na bazie jest rozwiązany z konstrukcji: `comm -23` wrzuca go do jednego koszyka z
    zielonymi na bazie.
  - Znalezisko: rozszerzenie na `qa` jest spójne, ale gołe drzewo bazy nie wystarczy dla czerwonego e2e
    albo testu na żywej aplikacji, bo te potrzebują działającego stosu bazy.
  - Uwaga o klasie regexów parity: łapią bliskość fraz, a nie ich sens. To nie jest nowa słabość.

  Merge `77df5c6` do `feat/1.34.0-quality-gates` (`--no-ff`) → **`01ecf81`**.

## Decyzje człowieka przy bramce P4 (2026-09-13)
- `qa` na merge-base: tymczasowy worktree poza repo, a rozszerzenie lidera zostaje potwierdzone. Dla
  czerwonego e2e albo testu na żywej aplikacji stos bazy stawiany jest w oknie wyłączności na świeżej
  bazie danych z seeda, nigdy na zmigrowanej przez gałąź. Brak ścieżki seed daje ENV-DEFECT.
  Odrzucone: e2e bez przebiegu na bazie (zawsze CHANGES-REQUIRED); e2e na bazie rozstrzyga człowiek.
- A/B z P5.3: powtórka P4 od `738be36`. Odrzucone: syntetyczny fixture.
- Próba: 3 pełne przebiegi i 1 przerwany na ramię, czyli ok. 8 przebiegów `be-dev` i 6 `checker`, ok.
  1,3 mln tokenów. Odrzucone: 1+1; 5+1.
- `TaskStop` po 3. edycji pliku. Odrzucone: po pierwszym commicie WIP.

Wszystko wpisane do specu jako G3 i G4.

## Zdarzenia po bramce P4
- 2026-09-13: lider wdrożył G3 w commicie **`f0469e4`**: `qa.md`, `qa.toml`, `release-checklist.md` §0 i `parity.test.js`.
  - **Wpadka po drodze.** Pierwsze miejsce zdania o e2e, w kroku (2), rozciągnęło w `qa.md` odstęp między
    „never by count” a `comm -23` ponad 600 znaków, więc parity dało FAIL na koncepcie P4. Regex został bez
    zmian, a zdanie przeszło na koniec punktu w obu bliźniakach. Poszerzenie okna osłabiłoby koncept dla
    wszystkich.
  - **Dowody:**
    - `merge-base` → trafienie w 4 plikach; `comm -23` → w 2;
    - parity → exit 0, z nowym konceptem „e2e base run on a fresh seeded database”;
    - `sync` → in sync; frontmatter → exit 0;
    - `npm test` → exit 0, 0 `not ok`.
  - **Sprawdzenie w obie strony**, na kopiach w scratchpadzie: usunięcie reguły z `.md`, a osobno z `.toml`,
    daje exit 1 i dokładnie jeden FAIL, na tym koncepcie.
  - Proza P4.2 w specu dostała odwołanie do G3. Brama: `checker` na `01ecf81..f0469e4`.
- 2026-09-13: `checker` na poprawkach P4 → **APPROVE**.
  - G3 brzmi tak samo w `qa.md`, `qa.toml` i §0 checklisty.
  - Nie koliduje z wyłącznością środowiska ani z ENV-DEFECT.
  - `checker` słusznie bez zmian.
  - Nadmiaru brak.

  Uwagi nieblokujące:
  - punkt w `qa` jest długi i G3 stoi na jego końcu, ale checklista ma osobną linię;
  - regex łapie literał, więc wiernej parafrazy nie przepuści, a zaprzeczenie z zachowanym ogonem przepuści.
- **P4 ZAMKNIĘTE 2026-09-13.**
  - Wszystkie punkty `Done-when` spełnione, dowody w `Status:` specu.
  - checker: NITS → G3 → APPROVE · tester: n/a · qa: n/a.
  - `be-dev` i obaj `checker` zakończeni, zwolnieni.

## Decyzje człowieka przy zamknięciu P4 (2026-09-13)
- Po P4 handoff: `STATE.md`, `/clear`, P5 (A/B wg G4) w nowej sesji. Odrzucone: P5 w tej sesji.
- Właściwość regexów parity (bliskość, nie sens) trafia teraz jako wiersz do `.ai/backlog.md`, obok wiersza
  o granicach parity. Odrzucone: tylko w run logu.

## Do zapamiętania (kandydat na lesson, do rotacji `lessons.md`)
- **Cztery niezależne przebiegi `checker` (P3, poprawki P3, P4, poprawki P4) zgłosiły tę samą właściwość.**
  Regexy w `parity.test.js` sprawdzają bliskość fraz, a nie ich sens: zaprzeczenie z zachowanymi literałami
  przechodzi, a wierna parafraza nie. Za każdym razem słusznie bez znaleziska, bo to cecha całego pliku.
  Powtarza się jednak na każdej bramce, więc to kandydat na wiersz backlogu obok istniejącego „parity guards
  concepts it was never told about”, zanim ktoś zacznie traktować zielone parity jako dowód znaczenia.
- **Okno regexu jest ukrytym ograniczeniem dla prozy.** Zdanie wstawione między dwie strzeżone frazy
  złamało koncept, choć nic nie zmieniło w znaczeniu (P4, `qa.md`). Parity wychwyciło to od razu, więc
  mechanizm zadziałał, ale autor doktryny nie widzi tych okien, dopóki test nie oblał.

## Forki do okna przy bramce P1
- **Data odcięcia narzędzia.** Spec mówi „≥ dzień wydania 1.34.0”, a dzień wydania jest nieznany
  (F5). Narzędzie potrzebuje stałej już teraz. Tymczasowo `be-dev` trzyma ją w jednej nazwanej stałej
  `CUTOFF = '2026-09-14'`. Każda wartość > 2026-09-13 daje dziś ten sam wynik na dysku.
- **Spec bez daty w nazwie.** Tymczasowo nie jest oceniany, a narzędzie wypisuje powód na stdout.
  Alternatywa: oceniać, bo szablon każe datować.

## Kontrakt narzędzia (zamrożony przez lidera w obu briefach, 2026-09-13)
- CLI `node tools/contract-probe-check.js <spec.md> [...]`; exit 0 / 1 / 2 (brak argumentów albo plik nieczytelny).
- Nagłówki faz: `^#{2,4}\s+(?:Phase|Faza|P\d+)\b`, czyli regex `deployed-surface-check` plus `P<n>`,
  bo tego formatu używają specy tego repo. Bez nagłówka cały spec jest jedną jednostką.
- Pole ważne, jeśli ma `n/a` + separator + powód ≥ 20 znaków bez `stack`/`not running`/`nie wstał`/`ENV`
  albo blok kodu przed następną etykietą lub nagłówkiem. Faza przechodzi, gdy ma ≥ 1 pole i wszystkie są ważne.

## Zdarzenia
- 2026-09-13: dispatch `be-dev` (P1.1–P1.4) i `tester` (plan P1, na razie tylko DRAFT; STOP na
  zamrożenie przez człowieka). Oba w worktree, baza `d9d50c6` przez `merge --ff-only`.
- 2026-09-13: `tester` wrócił z planem DRAFT, commit `73d26f7` w worktree `agent-a33fbb254b106410d`.
  Plan ma 41 przypadków (CP01–CP41), tier B, sześć pytań. Sprawdzone na dysku: 200 linii, 41 wierszy `| CP`.
  Pytania Q1–Q3 i Q5 wysłane do `be-dev` jako tymczasowe domyślne: separator `n/a` obowiązkowy,
  nieprawidłowa data kalendarzowa traktowana jak brak daty, exit 2 wygrywa przy mieszanych argumentach,
  eksport `CUTOFF`. Q4 (spec bez daty) i Q6 (brzmienie stderr) idą do okna decyzji.
- 2026-09-13: `be-dev` wrócił, commit `af3e556`, 26/26 testów. Sprawdzone przez lidera: `contract-probe-check.test.js` zielony,
  narzędzie na kopii tego specu z datą 2099 → exit 1 dla P4, P5 i P6. Raport `be-dev` podawał tylko
  P6. P4 i P5 mają `n/a.` bez separatora, więc to poprawny wynik, a pomyłka jest w raporcie.
  Zmergowane do gałęzi (`08fc91b`, `44949b6`), `npm test` exit 0, 21 zestawów w `package.json` = 21 w `AGENTS.md`.
  Worktree mają pliki w LF, bo tak robi checkout na Linuksie. CRLF w głównym drzewie to pozostałość,
  a git przechowuje LF (`* text=auto`), więc treść się nie różni. Brief twierdził „CRLF” i się mylił.
- 2026-09-13: `checker` P1 zlecony na `d9d50c6..af3e556`, bez raportu `be-dev` i bez run logu.

- 2026-09-13: `checker` P1 → **CHANGES-REQUIRED**, jedno znalezisko: czwarty tymczasowy punkt (exit 2
  wygrywa) nie był oznaczony w kodzie. Działanie było poprawne i przetestowane. Poza tym czysto:
  Done-when zielone (27/27, `CLAUDE_PLUGIN_ROOT` przy obu narzędziach, `npm test` exit 0, 21 = 21),
  bez nadmiaru zakresu, sync-blocks w zgodzie, 15 prób złamania narzędzia bez defektu.
  Poprawka lidera, tylko komentarze: wszystkie znaczniki `PROVISIONAL` zmienione na
  `DECIDED 2026-09-13` z decyzjami człowieka, dodany brakujący przy exit 2, `CUTOFF` powiązany z P6.
  Uwaga informacyjna `checker`: granicą wartości pola jest każda linia `<Word>-<word>:`, więc np.
  `Request-Id:` między etykietą a blokiem kodu ucina zbieranie wartości. To własność kontraktu
  zamrożonego przez lidera, nie błąd `be-dev`. Idzie do okna przy zamknięciu P1.
- 2026-09-13: ponowne sprawdzenie `6bd158f` przez `checker` → **APPROVE** z jednym NIT: słowo „provisional” zostało
  w dwóch nazwach w `contract-probe-check.test.js`. Poprawione skryptem, który rzuca błąd przy braku wzorca,
  i sprawdzone grepem: 0 trafień, test zielony. Commit `a9b8c74`.
- 2026-09-13: `tester` wrócił z zamrożonym zestawem, commit `5ce0843`. Plan ma status FROZEN, jest 41 testów na 41 ID
  i 30 mutantów. Każde ID zabił co najmniej jeden mutant, żaden nie przeżył, `DEAD` brak. Tester wzmocnił dwie
  asercje po przeczytaniu implementacji: `assertGradedPass` i `strip()` w CP19. Oczekiwane wartości się
  nie zmieniły. Lider sprawdził: diff gałęzi dotyka tylko planu i zestawu testów, więc zmergowałem.
  Zestaw przechodzi w głównym repo. Podpięty do `package.json` (22 zestawy), `AGENTS.md` mówi dwadzieścia dwa.
  Poprawność pokrycia i wzmocnień ocenia `checker` (zlecone).
- 2026-09-13: werdykt `checker` dla zestawu zamrożonego: **APPROVE**. Każde z 41 ID ma test, a oba wzmocnienia są
  addytywne, bez zmiany oczekiwanych wartości. Trzy mutanty (M1, M16, M19) odtworzył niezależnie
  i wynik zgodził się z tabelą. NIT: przestarzały literał `2026-09-14+` w komunikacie CP17.
  **Checker tego nie wyłapał, znalazł lider przy NIT:** CP17 bierze WSZYSTKIE żywe specy z `.ai/specs/`,
  a według swojego wiersza ma brać tylko te sprzed CUTOFF. Pierwszy nowy spec po cutoffie bez pola
  wywaliłby `npm test` z mylnym powodem. Wróciło do `tester` jako poprawka zgodna z wierszem,
  z dowodem w obu kierunkach.
- 2026-09-13: `tester` poprawił CP17 (`ba8f286`). Zbiór jest teraz filtrowany po dacie < CUTOFF z require; specy bez daty
  i z nieprawidłową datą są wyłączone, bo należą do CP13/CP39. Dowód: (a) plik z datą = CUTOFF bez pola
  → poprawiony CP17 zielony, stary czerwony; (b) M2 nadal zabija CP12/15/16/17. Zmergowane `999e819`.
  Lider sprawdził: diff dotyka tylko planu i zestawu testów; sha `contract-probe-check.js` = `79d125c7…`
  (to samo co w tabeli mutantów); `npm test` exit 0, 0 `not ok`; oba zestawy zielone;
  `CLAUDE_PLUGIN_ROOT` przy obu narzędziach (`sailes-pre-implement/SKILL.md:70,90`).
- **P1 ZAMKNIĘTE 2026-09-13.** Done-when spełnione wszystkie:
  - test narzędzia z fixture'ami w obu kierunkach;
  - asercja ciszy;
  - grep `CLAUDE_PLUGIN_ROOT`;
  - `npm test` = 22 = `AGENTS.md`.

  Werdykty: checker APPROVE, qa n/a. Pracownicy zwolnieni (be-dev, tester i checker zakończyli pracę).
  Eval `lead-probes-the-contract-before-dispatch` jest NEVER-RUN i ruszy w P6.
- 2026-09-13: dispatch `be-dev` na P2 (P2.1–P2.6) w worktree, baza `0969d92` przez `merge --ff-only`.
- 2026-09-13: `be-dev` wrócił z commitem `15d9f36` (worktree `agent-a6ad107922f6dba39`). Lider sprawdził na dysku:
  - diff dotyka 15 plików z listy P2 i raportu `be-dev` w `.ai/runs/`, nic poza tym;
  - w worktree: `parity.test.js` exit 0, 0 FAIL; `sync-blocks --check` in sync; grep z `Done-when` bez trafień
    (exit 1); `npm test` exit 0, 0 `not ok`;
  - koncept odwrotny sprawdzony w obu kierunkach na kopii w scratchpadzie: nowy tekst → exit 0; stary
    `be-dev.md`/`fe-dev.md` z `0969d92` → exit 1, 6 × FAIL (m.in. „no longer ties the full suite to the OLD
    per-worker completion commit — ABSENT from BOTH twins”).

  Odstępstwa zgłoszone przez `be-dev`, do oceny przez lidera:
  - `spec-writing-template.md` nie ma sekcji Red Flags, więc punkt P2.1 trafił tam tylko jako checklista;
  - złagodzone zdanie w `checker.md` „run … the suite”;
  - nowa sekcja `## 0 ·` w `release-checklist.md`, bez przenumerowania pliku.

  `checker` zlecony na `0969d92..15d9f36`, z wyłączeniem `.ai/runs`.
- 2026-09-13: `checker` P2 → **APPROVE**.
  - Pominięcia: brak. Checker przeszukał całe drzewo pod kątem ocalałego sformułowania 1.33.0. Jedyne
    trafienie, `team-lead.md:76`, dotyczy `maxTurns` i nie ma związku z P2.
  - Nadmiar, oba jako NITS: autotest regexu odwrotnego oraz rozbudowana proza w §0 i w Key Commands.
  - Próba złamania: przeredagowanie reguły 1.33.0 bez bigramu `declaration commit` omija regex odwrotny,
    ale oblewa pozytywny koncept „full suite … before push/qa”. To ta sama klasa ograniczeń co każdy regex parity.
  - NIT spójności: nagłówek briefu „two levels” nie pasował do trzech poziomów w treści.

  Lider zmergował `94a44ea` (`--no-ff`) i sam poprawił oba NITS (nagłówek briefu, słowa w Key Commands),
  bez nowego workera. W głównym drzewie: parity exit 0; sync in sync; grep bez trafień; `npm test` exit 0,
  0 `not ok`, 22 zestawy; oba pliki LF.
- **P2 ZAMKNIĘTE 2026-09-13.** Wszystkie cztery warunki `Done-when` spełnione. Werdykty: checker APPROVE,
  tester n/a, qa n/a. `be-dev` i `checker` zakończyli pracę i są zwolnieni.

## Decyzje człowieka przy zamknięciu P2 (2026-09-13)
- Po P2 handoff: `STATE.md`, `/clear`, P3 w nowej sesji. Odrzucone: P3 w tej sesji.
- Worktree:
  - wybrane: `git worktree remove` na 14 żywych, zmergowanych do `feat/1.34.0-quality-gates`, bez
    `--force`, więc worktree z nieśledzonymi plikami zostaje i trafia na listę; do tego
    `git worktree prune` na 31 martwych wpisach (ścieżki `D:/`); gałęzie zostają;
  - odrzucone: sam `prune`; zostawienie wszystkiego.

  Wynik: 14/14 usunięte, żadne nie zostało pominięte, bo żaden worktree nie miał nieśledzonych plików.
  Każdy był przed usunięciem sprawdzony przez `merge-base --is-ancestor`. `prune -v` wypisał 31 wpisów.
  `git worktree list` pokazuje teraz tylko główne drzewo. Gałęzie `worktree-agent-*` zostały, a 24
  pliki w `.claude/status/` nietknięte.

## Decyzje człowieka przy zamknięciu P1 (2026-09-13)
- Granica wartości `Contract-probe:` zostaje ogólna (`<Word>-<word>:`). Odrzucone: tylko znane etykiety,
  bo daje ciche fałszywe PASS.
- Po P1 handoff: `STATE.md`, `/clear`, a P2 w nowej sesji. Odrzucone: P2 w tej sesji.

## Do zapamiętania (kandydat na lesson, `lessons.md` ma 39,4 KB z 40 KB i wymaga rotacji)
- `checker` sprawdzał pokrycie **po ID** i je potwierdził, a CP17 miał test, który zgubił zawężenie
  z wiersza („sprzed CUTOFF”). Samo ID nie mówi, czy test ma zakres wiersza. Znalazł to lider, czytając
  NIT o tej samej linii. Reguła do rozważenia: przy sprawdzaniu pokrycia porównać zawężenia wiersza
  („tylko”, „sprzed”, „gdy”) z filtrem testu, a nie tylko obecność ID.

## Decyzje człowieka przy bramce P1 (2026-09-13)
- Cutoff: dzień merge'a na `main`, ustawiany w P6 (wpisane do P6 w specu). Odrzucone: stałe 2026-09-14.
- Spec bez daty w nazwie: nie jest oceniany, dostaje komunikat. Trwałe. Odrzucone: ocenianie.
- Plan P1 zamrożony jak zaproponowany: tier B, separator obowiązkowy, zła data = brak daty, exit 2 wygrywa,
  luźne dopasowanie stderr. Odrzucone: tier A; zmiana odpowiedzi.

## P5 (sesja 2026-09-13, po `/clear`)
- 2026-09-13: pre-flight P5. Brief P4 `be-dev` i brief P4 `checker` wydobyte dosłownie z transkryptu sesji P4 do
  scratchpadu, bo powtórka z G4 ma iść na tym samym briefie. Dwie różnice są wymuszone:
  - baza `git merge --ff-only 738be36`, bo `feat/1.34.0-quality-gates` zawiera już wynik P4;
  - osobna nazwa pliku status na przebieg.

  Cache pluginu ma `be-dev` w wersji 1.33.0 z regułą pełnego zestawu przed commitem deklaracji, którą P2
  usunęło. Nazwana rola nie odpowiada więc żadnemu ramieniu.
- Decyzje człowieka (G5 w specu):
  - nośnik: stand-in z tekstem roli ramienia;
  - „utracony raport”: dwie liczby, a bramka liczy się od odtwarzalności z dysku;
  - stop po 3 różnych plikach z listy P4;
  - przebiegi parami A+B, w 4 rundach.
- 2026-09-13: dispatch `be-dev` na P5.1–P5.2 (doktryna), w worktree, baza `4d9f469` przez `merge --ff-only`.
  Status: `.claude/status/be-dev-P5-report-doctrine.md`. A/B startuje po jego powrocie, bo ramię B czyta ten tekst.
- 2026-09-13: `be-dev` P5.1–P5.2 wrócił z commitem `da23354` (worktree `agent-af6010f35ced59c3d`). Status zamknięty,
  `outcome: done`. Lider sprawdził w worktree:
  - brief-closure → exit 0;
  - parity → exit 0;
  - sync → in sync;
  - `npm test` → exit 0, 0 `not ok`.

  Diff obejmuje 9 plików z listy i raport. `agents-md-template.md` nie został ruszony, bo nie ma tej reguły.

  Dwuznaczności zgłoszone przez `be-dev`:
  - brak konceptu parity dla nowych pól;
  - wypadły „contract shape” i „per-file diff summary” (zgodnie z listą P5.2);
  - miejsce pomiaru integrity w `fe-dev`.

  `checker` zlecony na `4d9f469..da23354` przed A/B, żeby tekst ramienia B nie zmienił się między rundami.
- 2026-09-13: `checker` P5.1–P5.2 → **APPROVE**, bez NITS.
  - Diff dotyka dokładnie plików P5.1 i P5.2.
  - Na całym drzewie nie ocalało żadne zdanie, które każe implementerowi pisać plik raportu.
  - Bliźniaki są zgodne. `lessons.md` dostał tylko dopisek. `agents-md-template.md` słusznie nietknięty.
  - Uwaga dla człowieka: parity nie ma konceptu dla podziału plik/wiadomość (P2–P4 go dodawały).
    Pójdzie do okna przy bramce P5.

  Tekst ramienia B zamrożony na `da23354`. Rundy A/B ruszają.
- 2026-09-13: A/B runda 1: A1 i B1 wystartowały razem jako stand-in `general-purpose`, `model: sonnet`, w worktree.
  Mapowanie przebiegów na agentów i worktree jest w `.ai/eval-runs/2026-09-13-implementer-report-as-message/ledger.md`.
- 2026-09-13: runda 1 zakończona. Oba przebiegi `outcome: done`, zielony `Done-when` (lider powtórzył go na dysku),
  8/8 plików z listy P4.
  - B1 (`964f777`): 0 linii w `.ai/`, 41 linii treści w commitach, wiadomość 25 linii.
  - A1 (`70e4cf4`): 182 linie w `.ai/`, 10 linii treści w commitach, wiadomość 26 linii.

  Wiadomości leżą w `returns/`, a oceny w `returns/*-grade.txt`. Dla obu przebiegów zlecony `checker`.
  Runda 2 (A2+B2) wystartowała.
- 2026-09-13: **wada narzędzia A/B, poprawiona.** `checker` B1 dał CHANGES-REQUIRED za brak zdania P4.3 „Test, którego na
  bazie nie ma, nie jest czerwony na bazie”.
  - **Przyczyna:** tego zdania nie ma w specu na `738be36`, który czytał worker (`git show` → brak trafień). Jest w głównym
    drzewie, od `4d9f469`, bo dopisano je przy bramce P4. Brief `checker` wskazywał „the spec” bez ścieżki, więc `checker`
    czytał spec późniejszy, łącznie z G3, czyli z odpowiedzią na prawdziwe znalezisko P4. Metryka „znaleziska `checker`
    wobec prawdziwego NITS” była przez to skażona.
  - **Poprawka:** builder `checker` wskazuje teraz spec przez `git show 738be36:…`. Werdykt B1 zostaje zapisany jako
    przebieg z wadliwym narzędziem. `checker` A1 zatrzymany (`TaskStop`) przed zwrotem.
  - Oba (`A1v2`, `B1v2`) puszczone od nowa. Briefy be-dev nie są dotknięte: worker czyta spec z własnego worktree na `738be36`.
- 2026-09-13: korekta wpisu wyżej. `checker` A1 v1 nie został zatrzymany: `TaskStop` → „no task found”, bo zdążył wrócić
  z CHANGES-REQUIRED. Znalezisko to sprzeczność `checker.md` „You never … nothing more” z nowym wyjątkiem read-only;
  bliźniak `.toml` jest poprawiony. Werdykt odłożony jako przebieg z wadliwym narzędziem, bez oceny. Oceniane są tylko v2.
- 2026-09-13: runda 2 zakończona, oba przebiegi `done`, zielony `Done-when` (lider powtórzył go na dysku), 8/8 plików.
  - A2 (`d230da0`): 182 linie w `.ai/`, 16 linii treści w commitach, wiadomość 19 linii. Ścieżki w wiadomości wskazywały
    główne drzewo, ale `git status` głównego drzewa nie ma plików ramienia.
  - B2 (`3bb1896`): 0 linii w `.ai/`, 39 linii treści w commitach, wiadomość 18 linii, **jeden commit bez WIP**.

  **Czynnik środowiska:** scratchpad sesji jest wspólny dla lidera, workerów i `checker`. B2 zgłosił, że ktoś nadpisał
  jego katalog `parity-mutation-p4`. W scratchpadzie widać pliki kilku agentów (`p4-diff.txt`, `spec-at-738be36.md`,
  `regex-probe`). B2 powtórzył dowód w unikalnie nazwanym katalogu. Briefów nie zmieniam w trakcie eksperymentu.
  Czynnik trafia do VERDICT.

  `checker` v2 A1 → **NITS**. Runda 3 (A3+B3) wystartowała. `checker` v2 B2 zlecony.
- 2026-09-13: `checker` v2 B1 → **CHANGES-REQUIRED**.
  - Brak obsługi testu nieobecnego na bazie w krokach `qa`/`checker`, który brief wymagał.
  - Eval przypisuje sobie `checker`, a jego scenariusz obejmuje tylko `qa`.
  - Nieblokująco: wyjątek od blokady środowiska dla bazy przeczy wyłączności przy e2e. To niezależnie
    odtworzone prawdziwe znalezisko P4 (G3).
- 2026-09-13: fact-check lidera na `checker` v2 A1 (NITS). Twierdzenie, że wyjątek read-only jest też w sekcji
  „You never” `checker.md`, jest **fałszywe**. Sekcja nadal kończy się na „nothing more”, co potwierdza `git show
  70e4cf4:agents/checker.md`. v2 przeoczył defekt znaleziony przez v1. Metryka „znaleziska `checker`” ma więc duży
  rozrzut między przebiegami tego samego diffu, co trafi do VERDICT. Znaleziska z weryfikacją lidera są w
  `checker/FINDINGS.md`.
- 2026-09-13: `checker` v2 A2 → **NITS**. Regex parity nie ma kolejności ani odległości. Rozszerzenie D-P4b na `qa`
  wymaga zgody człowieka przy żywym stosie, co jest tematem G3, jako uwaga.
  Grep lidera na wszystkich przebiegach, heurystyczny:
  - Sprzeczność „nothing more” w `checker.md` `## You never` jest już na `738be36` i w prawdziwym P4, więc dotyczy
    wszystkich przebiegów. Żaden `checker` v2 jej nie zgłosił. To wspólna ślepa plamka, a nie różnica ramion.
  - Zdanie o teście nieobecnym na bazie pokrywa pliki różnie w każdym przebiegu (A2 cztery role, A1 `checker`, B1
    `SKILL.md`, B2 i prawdziwy P4 nigdzie). Zależy od przebiegu, nie od ramienia.

  Tabela jest w `checker/FINDINGS.md`.
- 2026-09-13: B3 (`548d3d8`) → `done`, zielony `Done-when` (lider powtórzył go na dysku), 8/8 plików. 0 linii w `.ai/`,
  32 linie treści w commicie, **jeden commit bez WIP**, tak jak w B2. `checker` v2 B3 zlecony. Runda 4 czeka na A3.
- 2026-09-13: `checker` v2 B2 → **NITS**.
  - Brak zdania o teście nieobecnym na bazie, zgodnie z grepem lidera.
  - Przebieg bazy dla czerwonego e2e zderza się z wyłącznością `qa`: temat G3, podany niezależnie jako NIT.
  - Regex parity sprawdza tylko współwystępowanie `merge-base` i `comm -23`.

  Werdykty v2 po rundach 1–2: A1 NITS, A2 NITS, B1 CHANGES-REQUIRED, B2 NITS. Temat G3 pojawił się w trzech z nich:
  w B1 jako znalezisko nieblokujące, w A2 i B2 jako uwaga lub NIT.
- 2026-09-13: A3 (`fcf4696`) → `done`, zielony `Done-when` (lider powtórzył go na dysku), 8/8 plików, 184 linie w `.ai/`,
  24 linie treści w commitach, 3 commity WIP. Katalog scratch `parity-mutation-p4` ma tę samą nazwę co katalog, który B2
  zgłosił jako nadpisany, więc kolizja wynika ze wspólnego nawyku nazewniczego, a nie z ramienia. `checker` v2 A3 zlecony.
- 2026-09-13: **runda 4 (przerwana)**. A4 i B4 wystartowały razem, a do każdego podpięty jest `stop-watch.sh` jako
  Monitor. `TaskStop` następuje po 3 różnych plikach z listy P4, zgodnie z G5.
- 2026-09-13: **A4 przerwany.** STOP-NOW o 14:26:27 (n=3), `TaskStop` o 14:26:34, w chwili zatrzymania nadal 3 pliki.
  - Na dysku: 1 WIP (`828826d`, P4.1), niezacommitowany `qa.md`, raport z 22 liniami w WIP, status bez `closed`.
  - Przed powrotem B4 lider zamroził w `DESIGN.md` kryteria 3b i zasadę, że metryka 2 nie dotyczy przerwanych
    przebiegów. „Co zweryfikowano” = tak tylko wtedy, gdy artefakt nazywa uruchomione komendy albo wprost mówi, że
    ich nie było.
  - Ocena A4: 3a tak; 3b **2/3** (brak stanu weryfikacji), więc nie do odtworzenia.
    Szczegóły w `returns/A4-recoverability.md`.
- 2026-09-13: `checker` v2 B3 → **NITS**. Temat G3 wraca jako uwaga nieblokująca, obok zakresu nagłówka evala i kruchości
  regexu. Twierdzenie o zdaniu „nieobecny na bazie” po obu stronach potwierdza grep lidera: nowe trafienia są we wszystkich
  czterech plikach ról. A3 ma je tylko w `checker.md`. Obaj mają sprzeczność „nothing more”, żaden nie ma wyjątku od blokady.
  Tabela jest w `checker/FINDINGS.md`.
- 2026-09-13: **B4 przerwany.** STOP-NOW o 14:28:27 (n=3), `TaskStop` o 14:28:35, w chwili zatrzymania nadal 3 pliki.
  - Na dysku: 0 commitów, 3 pliki niezacommitowane (+8/−2), status bez `closed`, brak raportu i treści commitów.
  - Ocena według kryteriów zamrożonych przed jego powrotem: 3a nie; 3b **2/3** (brak stanu weryfikacji), więc nie do
    odtworzenia, tak samo jak A4.
  - Różnica poza metryką: A4 miał P4.1 w commicie WIP i raport mówiący, który krok skończył. B4 nie ma nic w
    commitach, a krok trzeba wywnioskować z nazw plików.

  Szczegóły w `returns/B4-recoverability.md`.
- 2026-09-13: `checker` v2 A3 → **CHANGES-REQUIRED**: `checker.toml` zgubił zdanie o teście nieobecnym na bazie, które
  `checker.md` ma. Grep lidera to potwierdza. Wszystkie 8 przebiegów i 6 werdyktów v2 są zebrane.
- 2026-09-13: `Done-when` P5 na gałęzi doktryny (`da23354`), powtórzony przez lidera: brief-closure → exit 0; parity → exit 0;
  `npm test` → exit 0, 0 `not ok`. Warunek VERDICT oceniony w `VERDICT.md`.

## Decyzje człowieka na bramce P5 (2026-09-13) — w specu jako G6–G9
- **G6.** Merge P5 plus reguła dla `be-dev`/`fe-dev`: po każdym kroku commit WIP, a w jego treści komendy weryfikacji
  uruchomione do tej pory. Potem `checker` i jedna przerwana para: A z doktryną sprzed zmiany, B z doktryną P5 i regułą.
  Odrzucone: merge bez zmian; P5 poza 1.34.0; 3 kolejne przerwane pary bez zmian.
- **G7.** Koncept parity dla podziału plik/wiadomość. Odrzucone: bez konceptu.
- **G8.** Defekt z P4 w `checker.md` („You never … nothing more”) poprawia lider od razu, potem `checker`.
  Odrzucone: poprawka z konceptem na negację; wiersz w backlogu.
- **G9.** Patche A4/B4, usunięcie 10 worktree, gałęzie zostają. Odrzucone: zostawić do P6; usunąć tylko 2 stare.

## Zdarzenia po bramce P5
- 2026-09-13: commit dowodów A/B → `5374b47` (`.ai/eval-runs/2026-09-13-implementer-report-as-message/`).
- 2026-09-13: **pierwsza próba merge'a P5 nie ruszyła.** `git merge -F -` → „could not read file '-'”, bo `merge` nie
  czyta treści ze stdin. Skrypt nie przerwał się mimo `set -e`, a HEAD został na `5374b47`. Merge powtórzony z plikiem
  treści, bez `-F -`.
- 2026-09-13: G9 wykonane.
  - Patche: `returns/A4-uncommitted.patch` (2957 B, 1 plik), `returns/B4-uncommitted.patch` (10560 B, 3 pliki); żadnych
    plików nieśledzonych.
  - Usunięte: 2 stare worktree po sprawdzeniu `merge-base --is-ancestor` i czystego statusu. Potem 6 pełnych przebiegów,
    po sprawdzeniu czystego statusu. Na końcu A4 i B4 z `--force`. Każde `remove` → exit 0.
  - Zostało: 8 gałęzi A/B oraz worktree doktryny P5.
- 2026-09-13: merge P5.1–P5.2 → **`fd4c72d`** (rodzice `5374b47` + `da23354`), bez stanu MERGE_HEAD przed operacją.
- 2026-09-13: G8 → **`d2303e8`**. `agents/checker.md` `## You never` nie przeczy już nazwanemu wyjątkowi i odsyła do
  niego. Końce linii: LF, jednolite. Parity → exit 0; frontmatter → exit 0; sync → in sync. `checker` na
  `fd4c72d..d2303e8` zlecony.
- 2026-09-13: worktree doktryny P5 usunięte po merge'u (zmergowane, czyste, gałąź zostaje). `git worktree list` pokazuje
  tylko główne drzewo.
- 2026-09-13: dispatch `be-dev` na G6 i G7, baza `d2303e8` przez `merge --ff-only`, status `be-dev-P5-G6G7.md`.
  - G6: reguła WIP ze stanem weryfikacji dla `be-dev`/`fe-dev`.
  - G7: koncepty parity (a) wiadomość do 40 linii, (b) plik tylko dla ról bramkujących na `team-lead`, (c) reguła G6.
    Koncept (c) to decyzja lidera, zgodna z praktyką P2–P4.
  - Raportuje wiadomością, zgodnie z doktryną P5. Katalog scratch z unikalną nazwą, bo scratchpad jest wspólny.
- 2026-09-13: **`STATE.md` zrotowany przed dalszą pracą** (19,6 KB → 8,0 KB). Wszystkie wpisy „Last session” od zamknięcia
  P4 wstecz do 2026-09-12, 194 linie, przeszły dosłownie do `.ai/archive/STATE-archive.md` jako nowa sekcja nad
  rotacją 2026-08-30. Na ich miejscu jest jeden wpis P5 („resume here”): stan bramki, zadania w toku, kolejność
  pozostałych kroków i przeniesione zaległości (lista CHANGELOG na P6, `CUTOFF`, F5, archify, kandydaci na lekcje).
  `Last-commit:` → `d2303e8`. Oba pliki CRLF, jednolite.
- 2026-09-13: `checker` G8 (`fd4c72d..d2303e8`) → **APPROVE**.
  - Diff: jeden plik, +1/−1.
  - Bliźniaki zgodne co do zakresu wyjątku: tylko przebieg bazy, tylko metadane `.git`, nigdy diff ani drzewo robocze.
  - Jedyne niekwalifikowane „read-only” to krótkie opisy we frontmatterze (`.md:3`, `.toml:3`). Parity sprawdza je jako
    niezmiennik, a same nie są regułą.
  - Nowa linia jest ograniczona, bo odsyła do jednego, w pełni opisanego wyjątku. Parity → 0; frontmatter → 0; sync → in sync.
- 2026-09-13: `be-dev` G6+G7 wrócił z commitem **`c0b8757`** i raportem wiadomością (P5).
  - Status zamknięty, `outcome: done`, 5 plików: G6 w czterech bliźniakach `be-dev`/`fe-dev` oraz trzy koncepty w
    `parity.test.js`.
  - Lider sprawdził w worktree: parity → exit 0; brief-closure → 0; frontmatter → 0; sync → in sync; `npm test` → exit 0,
    0 `not ok`; LF jednolite.
  - Odstępstwo: bliźniaki `.toml` nie miały dosłownej reguły `WIP:`, więc zdanie G6 (skrócone, „Commit often…”) stoi przy
    klauzuli o commicie deklaracji.
  - Worker stosował G6 do siebie: 2 commity WIP ze stanem weryfikacji w treści. Pierwszy mówi „passed manually, see grep
    output in session”, bez wyjścia komendy. To furtka dosłownego stosowania reguły, oddana `checker` jako punkt 2.
  - `checker` na `d2303e8..c0b8757` zlecony. Brief B5 zbudowany z `c0b8757:agents/be-dev.md`: diff względem B4 to tylko
    zdanie G6 i etykieta.
  - Para A5+B5 czeka na werdykt, żeby B nie testował tekstu, który jeszcze się zmieni.
- 2026-09-13: lider potwierdził w logu parity na `c0b8757` koncept (b) `team-lead`: „the report-FILE-from-first-change rule
  is scoped to the gate roles (checker, qa, tester)” → ok w obu bliźniakach (linia 82). Koncepty (a) i (c) dla
  `be-dev`/`fe-dev` → ok. Regex (c) jest prawie dosłowną frazą, więc wierna parafraza reguły go obleje. Ocenę kruchości
  zostawiam `checker` (punkt 3 briefu).
- 2026-09-13: `checker` G6/G7 (`d2303e8..c0b8757`) → **NITS**. Uwagi nieblokujące, odłożone do okna przy zamknięciu P5:
  1. Treść G6 („names the verification commands … and their result”) nie wymaga dosłownej komendy, więc „ran the tests,
     they pass” formalnie spełnia regułę.
  2. Koncept (b) na `team-lead` przechodzi na negacji albo poszerzeniu zakresu, jeśli nazwy ról stoją obok.
  3. Koncepty (a) i (c) są prawie dosłowne: wierna parafraza je obleje, negacja z zachowaną frazą przejdzie. Brak
     fixture odwrotnych.
  4. Kolejność w `.toml`: „a commit is your declaration” stoi przed wyjątkiem `WIP:`. To było tam już wcześniej.

  Zakres potwierdzony: 5 plików. W `.toml` doszło też zdanie „Commit often, prefix WIP:”, konieczne jako kontekst. Checker
  zaznacza, że dopiero przerwana para domyka pomiarową połowę G6.
- 2026-09-13: merge G6+G7 → **`8a941b6`**. Para A5+B5 w następnym kroku, osobno od merge'a, żeby
  `git worktree add` nie konkurował o blokady refów.
- 2026-09-13: **para G6 (przerwana).** A5 (doktryna sprzed P5, kontrola) i B5 (doktryna P5 plus G6, tekst roli z `c0b8757`)
  wystartowały razem. Obu pilnuje `stop-watch.sh` jako Monitor, `TaskStop` po 3 plikach z listy P4. Wierność promptów i
  mapowanie przebiegów są w `ledger.md`. Ocena według kryteriów 3b zamrożonych w `DESIGN.md` o 14:27 UTC, bez zmian.
- 2026-09-13: **A5 przerwany** (kontrola pary G6, doktryna sprzed P5). STOP-NOW o 14:56:47 (n=3), `TaskStop` o 14:56:52,
  w chwili zatrzymania nadal 3 pliki.
  - Na dysku: 1 WIP (`f287854`, P4.1) z pustą treścią i niezacommitowany `checker.md` (patch zapisany). Status bez
    `closed`. **Raportu nie ma**, choć status go deklaruje, a brief każe pisać od pierwszej zmiany.
  - Ocena według tych samych zamrożonych kryteriów: 3a nie; 3b **2/3** (brak stanu weryfikacji), więc nie do
    odtworzenia.
  - To pierwszy przebieg ramienia A, który złamał klauzulę pliku od pierwszej zmiany. Szczegóły w
    `returns/A5-recoverability.md`.
- 2026-09-13: **B5 przerwany** (para G6, doktryna P5 plus G6). STOP-NOW o 14:58:43 (n=3), `TaskStop` o 14:58:48,
  w chwili zatrzymania nadal 3 pliki.
  - Na dysku: **0 commitów** i 3 pliki niezacommitowane (`checker.md`, `qa.md`, `qa.toml`), patch zapisany. Status
    bez `closed`.
  - Z kolejności plików wynika, że krok P4.2 (qa.md i qa.toml) był skończony, a worker zaczął P4.3, bez commita WIP
    wymaganego przez G6. Ocena 3b według zamrożonych kryteriów w następnym wpisie.
- 2026-09-13: ocena B5 według zamrożonych kryteriów: 3a nie; 3b **2/3**, więc nie do odtworzenia. **G6 nie zadziałało**:
  P4.2 skończone, P4.3 rozpoczęte bez commita WIP. Para G6: A5 2/3 (bez raportu, choć klauzula go wymaga), B5 2/3.
  Łącznie przerwane przebiegi: A 2/2, B 2/2 nie do odtworzenia, więc warunek nadal nie blokuje. Dopisek jest w
  `VERDICT.md`, a wniosek brzmi: ani zdanie o pliku, ani zdanie G6 nie zostawia na dysku stanu weryfikacji w chwili
  przerwania. To pojedyncze przebiegi, bez wskaźników.
- 2026-09-13: **`Done-when` P5 na zintegrowanej gałęzi `8a941b6`**, powtórzony przez lidera:
  - brief-closure → exit 0; parity → exit 0 (10 ról); sync → in sync; frontmatter → exit 0;
  - `npm test` → exit 0, 0 `not ok`;
  - VERDICT ma cztery metryki dla obu ramion (3a i 3b osobno);
  - warunek „B ma więcej pustych albo utraconych zwrotów” nie jest spełniony: 0/3 wobec 0/3, 2/2 wobec 2/2.

  Status specu zaktualizowany. Zamknięcie czeka na okno decyzji.

## Decyzje człowieka przy zamknięciu P5 (2026-09-13) — w specu jako G10–G13
- **G10.** G6 zostaje w 1.34.0, a do backlogu trafia wiersz „mechanizm zamiast zdania”. Odrzucone: usunięcie G6;
  mechanizm od razu w P5.
- **G11.** NITS G6/G7 idą do backlogu: regexy parity do istniejącego wiersza o bliskości zamiast sensu; ogólnik w treści
  WIP i kolejność zdań w `.toml` do wiersza G10. Odrzucone: poprawka teraz.
- **G12.** Usunięte worktree A5, B5 i G6/G7, gałęzie zostają. Odrzucone: zostawić do P6.
- **G13.** Commit zamykający, `STATE.md`, `/clear`, P6 w nowej sesji. Odrzucone: P6 w tej sesji; wstrzymanie do F5.
- **P5 ZAMKNIĘTE 2026-09-13.** `Done-when` spełniony na `8a941b6`; dowody w `Status:` specu. checker: APPROVE (P5.1–P5.2),
  APPROVE (G8), NITS (G6/G7) · tester: n/a · qa: n/a (brak działającej aplikacji). Wszyscy workerzy i checkerzy
  zakończeni, zwolnieni.
