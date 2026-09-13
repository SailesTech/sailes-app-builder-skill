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
