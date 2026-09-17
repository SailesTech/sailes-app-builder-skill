# Feedback do skilla Sailes — sesja 2026-09-16 (Idealny Wzrok: „nakładka nie wyskakuje przy dzwonku”)

Plugin `sailes-app-builder` 1.34.0. Skille użyte: `sailes-diagnose`, `sailes-spec`, `workflow-authoring` (Workflow), role `be-dev`, `fe-dev`, `tester`, `checker`, `qa`.
Cel: dopasować harness Sailes do Workflow, tak żeby workflow używały NASZYCH ról, oszczędzały tokeny i nie gubiły błędów.
Każdy wpis: obserwacja → koszt/ryzyko → propozycja zmiany w skillu.

## Przebieg sesji (skrót do kontekstu)

1. `sailes-diagnose`: logi Prod z Railway (71 tys. linii) → pomiar leada → fan-out 5 kolektorów (najpierw przypadkiem na Opusie, zatrzymany; potem Sonnet, 650 k tokenów) → testy rozstrzygające leada → mechanizm: zakończona rozmowa blokowała slot agenta na 15 min (64 z 159 dzwonków bez popupu), a u 4 osób nakładka w ogóle nie działa.
2. Decyzje z człowiekiem → sonda API Thulium (`pause`/`free`, id przerw) → `sailes-spec` (skeleton → Open Questions → D1–D15 → approved).
3. Implementacja przez Workflow: F1 na jednym agencie wyczerpała kontekst → dokończenie dwoma agentami z rozłącznymi plikami + bramka → F2–F5 → tester → checker → QA (w toku w chwili zapisu).

## Sesja 2026-09-16 — sailes-diagnose, „nakładka nie wyskakuje” (Idealny Wzrok)

### Tokeny
1. **Workflow bez `model` dziedziczy Opusa.** 5 kolektorów poszło na Opusie, zatrzymane przez użytkownika. Skill diagnose (krok 3 COLLECT) nie mówi, jakim modelem/rolą zbierać. → Dopisać w diagnose/implement: kolektory = `agentType: 'sailes-app-builder:explorer'` (haiku) albo `model: 'haiku'`; analiza skryptowa/łańcuch w kodzie = sonnet. 
2. **Rola `researcher` jest na Opusie** — koliduje z zakazem. → zmienić na sonnet albo jawnie oznaczyć „tylko za zgodą”.
3. **Brak ciągłości wcześniejszych diagnoz.** „Wielokrotnie był research”, ale nie było go w `.ai/incidents/` (wiedza tylko w opisach commitów z 02.09 i 10.09; transkrypty na innym dysku). ~8 wywołań na szukanie po transkryptach. → diagnose krok 0: `ls .ai/incidents` + `git log --grep=<objaw>` ZANIM cokolwiek innego; każda diagnoza MUSI zostawić plik incydentu.
4. **Railway logs — pułapki CLI (5.57.2), kilka rund prób:** `--lines` max 5000 (50000 → „Error in limit - Invalid input”); `--since/--until` BEZ id deploymentu zwraca 0 linii; logi HTTP (`--http`) tylko dla bieżącego deploymentu; zbyt wiele równoległych zapytań → „Problem processing request”. → do sailes-hosting: gotowy skrypt stronicujący (per deployment, okna 30 min, dedup).
5. **Środowisko:** `grep` = ugrep (limity złożoności regexu, inne flagi), `pkill -f fetch.py` zabił własną powłokę (exit 144). Drobne, ale kosztowały rundy.
6. **Co zadziałało oszczędnie:** reguła „żywy przypadek przed fan-outem”. Dwa skrypty python po logach dały kluczowy sygnał (4 osoby: 105 dzwonków, zero odpytań nakładki) ZANIM ruszył jakikolwiek agent, a brief kolektorów dostał zmierzone fakty → węższe zadania. Zostawić i wzmocnić.

### Wyłapywanie błędów
7. **Klasyfikator auto mode blokuje odczyty Prod** (psql read-only, `railway status`), choć skill mówi, że odczyt Prod jest dozwolony. Wyszło w połowie diagnozy. → diagnose krok SCOPE: wypisać potrzebne odczyty Prod i poprosić człowieka o regułę uprawnień PRZED fan-outem; kolektorom jawnie zakazać DB, żeby nie paliły tokenów na blokady.
8. **Luka detekcji:** logi HTTP poprzednich deployów niedostępne → nie da się pokazać, czy przeglądarka danej osoby w ogóle odpytywała w chwili dzwonka. Propozycja do checklisty telemetrii: beacon nakładki niesie login + IP/UA, a serwer loguje ZMIANĘ „kto odpytuje” (już jest wzorzec sladZmiany).
9. **Gdzie oszczędzać, a gdzie nie:** kolektory tanie (haiku), ale werdykt i synteza zostają u leada (skill to ma). Propozycja: jeden tani refuter (sonnet) tylko dla twierdzenia nośnego, przed podaniem przyczyny człowiekowi, zamiast N głosujących.
10. **Guard w harnessie:** hook PreToolUse na Workflow/Agent odrzucający `agent()` bez `model`/`agentType` — błąd łapany mechanicznie, nie pamięcią modelu.

### Po fan-oucie (wf_d7e47752-0f8, 5× sonnet: 650 k tokenów, 194 wywołania narzędzi, ~14 min)
11. **Nakładające się zakresy kolektorów.** „kod” i „tożsamość” obaj zmapowali `guards.ts`/`thuliumAgents.ts` — ~podwójny koszt. → W briefie dawać ROZŁĄCZNE listy plików/źródeł; lead sprawdza rozłączność przed startem.
12. **Kluczowy mechanizm znalazł lead, nie kolektor.** Kolektor logów policzył 11 „dzwonków bez bufor.zapis” i nazwał to „race”. Test rozstrzygający (dzwonek vs poprzedni wpis agenta <15 min → 64/75 vs 3/74) plus odczyt jednej gałęzi kodu zrobił lead w 3 wywołaniach. → Diagnose: kolektory zbierają, a lead MUSI zrobić tani test rozstrzygający na każdej anomalii liczbowej z raportów przed syntezą. To jednocześnie oszczędza tokeny (zamiast rundy weryfikatorów) i łapie błędy.
13. **Interpretacje kolektorów bywały błędne** (wiele replik — obalone policzeniem `Starting Container` = liczba deployów; „brakPowiazania zawsze loguje diag”). Reguła „kolektor nie wydaje werdyktu” działa tylko wtedy, gdy lead faktycznie weryfikuje. → W schemacie raportu oddzielne pole „interpretacja”, którego lead nie cytuje bez własnego testu.
14. **Fakty z sieci przez WebFetch to streszczenia modelu** (kolektor SDK sam to zaznaczył; cytat z dokumentacji Pipedrive może być wyrwany z kontekstu). → Dla twierdzenia nośnego wymagać dosłownego cytatu i drugiego źródła albo oznaczać jako niezweryfikowane.
15. **Model na kolektory:** ta diagnoza na haiku dla historii/SDK i sonnet dla logów/kodu dałaby ten sam wynik taniej, bo wartość wniosła analiza leada, nie głębia kolektorów.
16. **„Brak w kodzie” uznany za „brak w API”.** Spec etapu 1 (dev, 16.09) zapisał: „brak w kodzie i w API ustawiania pauzy (grep)” oraz `/pauses` → 404. Indeks `api.thulium.com/docs/api` ma `POST agents/:login/pause`, `POST agents/:login/free`, `GET system/pauses` (zła ścieżka sondy). Sprawdzenie: 2 wywołania curl. → sailes-spec/discovery: pytanie „czy API pozwala X” rozstrzygać z indeksu dokumentacji dostawcy (surowy HTML, nie streszczenie WebFetch, które pokazało 1 endpoint), zanim trafi do Open Questions jako blokada.
17. **Faza implementacji na jednym agencie wyczerpała kontekst** (F1: 140 wywołań, 326 k tokenów, 26 min) i nie zwróciła StructuredOutput. Workflow uznał fazę za zablokowaną, choć rdzeń był w commicie WIP. Przyczyna: usunięcie API (poczekalnia) rozlało się na ~15 plików testów, a spec wymienił tylko część z nich. → sailes-spec/implement: przy usuwaniu eksportu policzyć `git grep` odwołań PRZED podziałem na fazy i rozdzielić testy między agentów z rozłącznymi plikami. W prompcie: twardy limit wywołań plus „commit WIP i zwróć blocked przez StructuredOutput”. Lead po `null` najpierw sprawdza worktree, dopiero potem powtarza.


## Lekcje z orkestracji Workflow (mechanika)


8. **Każdy `agent()` ma jawny `model`, nawet z `agentType`.** Bez niego agent dziedziczy Opusa. 5 kolektorów na Opusie zatrzymał użytkownik (650 k tokenów w drugim podejściu na Sonnecie). Podział: haiku do rozpoznania, historii i szukania w sieci; sonnet do analizy logów, łańcucha w kodzie, implementacji, testów, checkera i QA.
9. **Kolektory w diagnozie zbierają dane, lead rozstrzyga.** Mechanizm znalazł lead jednym tanim testem na liczbach z raportu (3 wywołania), a nie kolektor. Kolektory błędnie interpretowały dane (wiele replik, „race”). Ich interpretacje traktuj jak hipotezy do sprawdzenia, nigdy jak wnioski. Dawaj im ROZŁĄCZNE źródła: „kod” i „tożsamość” czytały te same pliki, czyli podwójny koszt.
10. **Najpierw zmierz, potem fan-out.** Dwa skrypty python na pobranych logach dały główny sygnał, zanim ruszył agent. Brief z konkretnymi liczbami zawęża kolektorów.
11. **Faza usuwająca API rozlewa się na testy.** F1 (usunięcie poczekalni) wyczerpała kontekst jednego agenta: 140 wywołań, 326 k tokenów. Przyczyna: ~15 plików testów, a spec wymieniał część. Przed podziałem policz `git grep` odwołań do usuwanego eksportu i rozdziel testy między agentów z rozłącznymi plikami.
12. **Limit w prompcie fazy:** „najwyżej ~70 wywołań; przy limicie commit WIP i NATYCHMIAST StructuredOutput ze status blocked”. Bez StructuredOutput `agent({schema})` rzuca wyjątek (try/catch go łapie), a orkestrator widzi `blocked` bez szczegółów.
13. **Po `null`/`blocked` sprawdź worktree, zanim powtórzysz.** Agent F1 zostawił commit WIP i nieskomitowane testy. Wznowienie było dokończeniem, a nie ponowieniem fazy. `resumeFromRunId` nie pomaga, gdy zmieniasz prompt pierwszego agenta (brak cache), więc po prostu uruchom ponownie ze `scriptPath`.
14. **Fazy sekwencyjne na jednej gałęzi feature w osobnym worktree, BEZ `isolation`.** Odpada integrator i problem „git w cudzym worktree”. Agenci równolegli na tej samej gałęzi: każdy `git add` tylko swoich plików i ponowienie commita przy locku.
15. **Sprawdź składnię skryptu przed uruchomieniem:** `node -e` z `new Function(...)` na treści bez `export`.
16. **`pkill -f <nazwa>` zabija też własną powłokę**, jeśli nazwa jest w linii komendy (exit 144). Zabijaj po PID.
17. **Railway logs:** `--lines` max 5000. `--since/--until` działa tylko z id deploymentu (bez niego 0 linii). Logi `--http` są tylko dla bieżącego deploymentu. Pełny zakres: pętla po deploymentach, okna 30 min, deduplikacja (skrypt `fetch.py` w scratchpadzie sesji 646d3e6d).
18. **Blokady auto mode:** odczyt Prod DB (`railway run ... psql`) i `railway status` bywają blokowane jako Production Reads, a zapis do zewnętrznego API (Thulium `pause`) jako Real-World Transactions. Takie komendy człowiek uruchamia sam przez `! <komenda>`. Wypisz je na starcie, nie w połowie. Odczyt tylko do odczytu przez `railway run --environment Dev` z repo zlinkowanego do projektu przeszedł.

## Preferencje człowieka, które skill powinien uwzględniać

- **Decyzje prostym językiem, krótko** (2026-09-16). Techniczne karty R1–R6 („tabela vs pamięć procesu”) nie trafiły; zadziałała lista „co musisz zdecydować / co zrobić przed implementacją” z pytaniami o ZACHOWANIE i jedną propozycją przy każdym. Przypadków niemożliwych w procesie biznesowym nie pytaj (np. „agent na przerwie w trakcie rozmowy”): najpierw sprawdź kontekst biznesowy.
- **Minimum konfiguracji w env.** Kwestionuje zmienne na rzeczy, które mogą być stałą albo daną z API. Proponuj najprostszy wariant; zmienna tylko z uzasadnieniem.
- **Upraszcza zakres w stronę niezawodności:** woli usunąć mechanizm (poczekalnię) niż go łatać; akceptuje świadome ograniczenia (stan w pamięci, bez bezpiecznika czasowego), jeśli są nazwane.
- **Feedback do skilla Sailes na bieżąco:** zapisuj wnioski z każdej sesji (oszczędność tokenów + wyłapywanie błędów) w tym pliku; cel: harness używa ról Sailes w Workflow.

## Implementacja przez Workflow — wynik i wnioski (wf_4eb1edf7-db8)

Koszt: 12 agentów, 1,46 mln tokenów, 820 wywołań narzędzi, ~2 h. Pierwsze podejście do F1 (`wf_2fb79243-84e`): 1 agent, 326 k tokenów, bez wyniku.
Wynik: F1–F5 zaimplementowane (16 commitów), `tsc` 0, build web OK. Checker: CHANGES-REQUIRED w obu rundach. QA: 3 nowe czerwone plus ENV-DEFECT dla e2e. Lead domknął to sam jednym commitem (`1a4b6b0`).

18. **Spec nie wymienił wszystkich plików, na które wpływa usunięcie UI.** 3 czerwone testy (`nakladkaKolejkaIOkno`, `nakladkaKroki`) sprawdzały usunięty `renderOczekujace` i alert poczekalni. Tester i agent fazy F2 ich nie ruszyli, bo nie było ich na liście plików fazy. Wyłapały je dopiero checker (r2) i QA. → sailes-spec: przy usuwaniu funkcji/elementu UI Done-when fazy zawiera `git grep` po NAZWACH usuwanych symboli w `tests/` (nie tylko w `src`), a lista plików fazy powstaje z wyniku tego grepa.
19. **Zbyt szeroki grep w Done-when dał fałszywy alarm na 2 rundy.** `git grep "oczekujace"` łapał to samo słowo z innych domen (konsultacje, etap zabiegowy). Agent poprawek, żeby „przejść bramkę”, wszedł poza zakres (menadzer.ts, etapDniaZabiegowego.ts), a checker kazał to wycofać. → Done-when z grepem: grepować NAZWY symboli, nie słowa z języka domeny. Agent przy literalnie niespełnionym Done-when ma zgłosić sprzeczność, a nie „naginać” kod.
20. **Poprawki po recenzji nie dotknęły wyniku rundy 2.** Runda 1 zgłosiła głównie fałszywy grep, a prawdziwe czerwone testy wyszły dopiero w rundzie 2, gdy nie było już budżetu na poprawki. → checker uruchamia testy z plików, które IMPORTUJĄ albo CZYTAJĄ zmienione moduły (tu testy czytające kod nakładki), a nie tylko komendy Done-when. Tanio: `git grep -l <zmieniony plik/symbol> tests/`.
21. **Ta sama czynność w trzech rolach.** Tester, checker i QA zderzyły się z ENV-DEFECT e2e, każdy osobno (docker compose, port 5432 zajęty przez kontener innego projektu, `minio` pull denied), razem kilkadziesiąt wywołań. → Lead sprawdza boot e2e RAZ przed workflow (jedna komenda). Jeśli środowisko nie wstaje, kolejne role dostają w prompcie „e2e: ENV-DEFECT znany, nie próbuj” plus decyzję człowieka.
22. **Pełna suita jest niestabilna** (13 nazw różnicy między dwoma przebiegami tego samego commita). QA słusznie porównał przecięcie dwóch przebiegów z bazą i potwierdzał kandydatów izolowanymi przebiegami 3×. → Wpisać do skilla qa jako standardową metodę, zamiast pojedynczego `comm -23`.
23. **Checker uruchomił pełną suitę wbrew zasadzie** (sam to przyznał) i zmarnował na tym tokeny. Zasada w roli istnieje, ale nie jest wymuszona. → hook albo reguła w prompcie workflow: checker nie uruchamia `vitest run` bez listy plików.
24. **Równoległe dokończenie fazy przez 2 agentów z rozłącznymi plikami zadziałało** (F1 1/2 i 2/2 + bramka): 0 konfliktów, każdy `git add` tylko swoich plików. Commity WIP w trakcie faz (F3, F4) dały punkty odzyskania. Utrzymać jako wzorzec.
25. **Rola `tester` zgłosiła problem, zamiast go rozwiązać sama** („do decyzji człowieka: zmienić Done-when”). To dobre zachowanie; orkestracja powinna je przekazywać do leada przed rundą checkera, a nie po całym workflow.

## Domknięcie: merge z dev, env, PR (po workflow)

26. **Przed PR scal aktualny `dev` do gałęzi, nie tylko porównuj.** W czasie workflow (~2 h) Kacper wypchnął 6 commitów w te same pliki. Kolejność, która zadziałała: `git merge-tree` (podgląd) → `merge --no-commit` → rozwiązanie konfliktu → `tsc` + testy z warunków „gotowe” wszystkich faz → commit merge → sprawdzenie, że `dev` jest przodkiem, brak usuniętych plików (`--diff-filter=D`) i czysty `merge-tree` → push → PR. → sailes-implement / release gate: to powinna być checklista kroku „PR”, a nie wiedza leada.
27. **Zmienna środowiskowa, bez której funkcja nie ma sensu, musi być wpisana w trzy miejsca naraz:** ustawiona na docelowym środowisku PRZED merge'em (`railway variables --set ... --skip-deploys`), zapisana w `DEPLOY.md` z tabelą stanu Dev/Prod i opisana w PR (ostrzeżenie na górze + checklista). Inaczej wdrożenie na Prod przejdzie „na zielono”, a funkcja się nie włączy. → sailes-hosting / release gate: sekcja „nowe zmienne tej zmiany” z tabelą stanu per środowisko jako wymagany element PR.
28. **Auto-usuwanie gałęzi po merge'u wymaga admina repo.** Z samymi uprawnieniami push `delete_branch_on_merge` jest niedostępne. Obejście: recenzent jako reviewer plus instrukcja w PR `gh pr merge N --merge --delete-branch`. → sailes-hosting: na starcie projektu sprawdzić uprawnienia (`gh api repos/... -q .permissions`) i poprosić właściciela o włączenie tej opcji.
29. **Auto mode przepuścił `railway variables --set` na Dev i `gh pr create`, a blokował odczyty Prod DB i zapis do API Thulium.** Klasyfikator ocenia cel (produkcja, realne transakcje), a nie narzędzie. Wypisz takie kroki na początku, żeby człowiek zdecydował raz.
30. **Stan dla następnej sesji zapisuj w repo PR-owej gałęzi** (`.ai/runs/<data>-<temat>.md` + wpis w `STATE.md`), a nie tylko w pamięci agenta. Wtedy Kacper i kolejna sesja widzą to samo.
