# Spec: spec niesie plan wykonania, lider przestaje wykonywać

Status: superseded
Superseded-by: .ai/specs/2026-09-16-workflow-first-orchestration.md
Framework-Version target: 1.29.0
Brief: `.ai/briefs/2026-08-06-spec-carries-the-execution-plan.md`

> **Dlaczego wciąż `draft`, mimo że brama jest zamknięta.** Sekcja `## Plan wykonania` tego specu jest
> tym, co rozstrzyga etap C. Spec, który zapisuje własny plan w formacie, którego jeszcze nie
> zmierzyliśmy, przesądzałby czynnik, dla którego buduje pomiar. Przechodzi na `approved` po
> werdykcie etapu C — nie wcześniej, i to jest jedyny warunek, jaki mu został.

## TLDR

Spec ma nieść **plan wykonania**: która faza kiedy idzie, co równolegle, co blokuje lidera, kto ją
wykonuje. Lider ma go **czytać i wysyłać**, a nie wyprowadzać. Cel to tempo developmentu i koniec
z proszeniem za każdym razem o powołanie agentów.

Rekonesans znalazł przyczynę głębiej, niż brzmiał brief. **Reguła delegowania nie dociera do sesji,
z którą rozmawia człowiek** (U5), a eval, który tego pilnuje, jest zielony, bo mierzy plan na
żądanie zamiast zachowania (U4). Dlatego trzy z czterech forków są rozstrzygane **pomiarem**, nie
argumentem, i dlatego ten spec dokłada regułę, że tak ma być dla całej klasy spraw harnessowych.

## Decyzje człowieka (2026-08-17) — brama Open Questions zamknięta

| # | Pytanie | Wybór | Odrzucone / uwaga |
|---|---|---|---|
| Q1 | Treść listy wyjątków dla lidera (operatywna treść D2) | **Szóstka bez zmian**: merge/integracja · zamrożenie kontraktu · run log · `STATE.md` · werdykt bramki · eskalacja do człowieka | Wariant siedmiopozycyjny (dokładający drabinę obserwacji milczącego workera) odrzucony; wariant czteropozycyjny (bez run logu i `STATE.md`) odrzucony, bo run log jest zapisem tego, komu lider zaufał — oddanie go oddaje autorstwo werdyktu |
| Q2 | Podział weryfikacji | **Mechaniczne → test, behawioralne → eval**: tryb fal do `tools/ownership-check.test.js` w `npm test`; „czy lider honoruje odwrócony próg" do evala | „Oba evalem" odrzucone — wyliczanie minimalnego podziału na fale jest funkcją czystą i marnuje się jako scenariusz. „Oba testem" odrzucone — „czy lider przeczytał plan zamiast go wyprowadzić" nie jest funkcją czystą |
| Q3 | Nazwa sekcji | **`## Plan wykonania`** | `## Execution plan` i `## Fazy i fale` odrzucone; nazwa wpisuje się w żywą konwencję (polski przy naturalnym terminie, angielski przy terminie sztuki) |
| Q4 | Kolejność wobec specu w locie | **Rozstrzygnięte dowodem, nie decyzją** — patrz niżej | — |

**Q1 stoi na dowodzie, nie na guście.** Szóstka mapuje się 1:1 na to, co `agents/team-lead.md` już
rezerwuje dla lidera: kontrakt, integracja i osąd bramki (`:39`), gałąź, merge i PR (`:87`),
eskalacja przy nowej decyzji architektonicznej (`:88`), run log i `STATE.md` (`:91`). Lista **domyka
istniejącą doktrynę zamiast dokładać nową** — i to jest powód, dla którego nie rośnie.

**Q2 niesie warunek, bez którego kupujemy drugą zieloną lampkę.** Ramię ewaluacyjne **nie może
pytać „jak wykonasz tę fazę"**. To jest dokładnie błąd U4: obecny eval jest zielony przy żywym bólu,
bo prosi o plan, a ból dotyczy sytuacji, w której nikt o plan nie prosi. Warunek jest zapisany
w `Done-when` fazy F7 i jest jej kryterium odrzucenia.

**Q4 — kolizja nie istnieje, przesłanka była nieświeża.** F6 specu
`.ai/specs/2026-08-02-outstanding-debt-and-docs-delta.md` **już wszedł**:
`evals/lead-delegates-instead-of-bulk-coding.md` niesie dziś kryterium symetryczne („grades BOTH
directions… a bare 'I'll hand this to be-dev' is a FAIL"), ostrzeżenie z F6.2 o notatce `Last run:`
jest na miejscu, a sama notatka brzmi `2026-08-02 (at 214ce50) · PASS both arms — first run against
the symmetric`. Nagłówkowa linia „Kolizja:" została skreślona; odpowiadający jej Non-goal w Briefie
jest nieaktualny w tym samym stopniu. **Skutek uboczny do domknięcia w F7:** wiersz 29
`.ai/backlog.md` opisuje ten eval jako żądający powodu w jedną stronę i ma status `open` — jest
nieświeży i zamyka się razem z tą fazą.

## Problem

**Trzy ustalenia, na których stoi cała reszta** (pełna piątka z dowodami — w Briefie):

- **U2** — `grep -rln "^ownership:" --include=*.md .` zwraca **zero plików**. `ownership-check.js`
  szedł od 1.27.0 wyłącznie po własnych fixture'ach; dwa run logi powstałe od tego czasu nie niosą
  bloku. Artefakt, do którego ludzie faktycznie piszą własność plików, to **spec**.
- **U3** — `findConflicts()` porównuje globalnie, bez pojęcia fali, więc **odrzuciłby poprawny plan**
  (spec 1.28.0: F3/F4/F5b celowo rozdzielone na fale). Narzędzie potrzebuje wymiaru fali.
- **U5** — `grep -n "BEGIN\|END" AGENTS.md` → **zero trafień**. Próg delegowania jest stemplowany do
  trzech plików ról; `AGENTS.md` nie niesie żadnego z nich i mówi tylko *„Delegation is **the
  lead's** default"* — o kimś innym. Szablon kliencki jest tu **mocniejszy** niż własny plik repo.

Czwarte, wyjaśniające, dlaczego bramka tego nie łapie: **U4** — `lead-delegates-instead-of-bulk-coding`
ma PASS oba ramiona (2026-08-02, prawdziwy typ, Opus), bo jego setup brzmi *„Ask it how it will
execute this phase"*. Pyta o plan. Ból dotyczy sytuacji, w której nikt o plan nie pyta.

## Proponowane rozwiązanie

Cztery powierzchnie, każda ze swoim rodzajem dowodu:

| Powierzchnia | Zmiana | Dowód |
|---|---|---|
| `tools/ownership-check.js` | wymiar fali + wyliczanie **minimalnego** podziału; rozbieżność z deklaracją specu = `exit 1` | test deterministyczny w `npm test` (F1) |
| `skills/sailes-spec/SKILL.md` + `spec-writing-template.md` | sekcja `## Plan wykonania`, dwie osie (równoległość ⊥ blokowanie), rola na fazę | wynik etapu C (F4 → F5) |
| `AGENTS.md` + `agents-md-template.md` | dojście reguły delegowania do sesji | wynik etapu A (F2 → F3) |
| `agents/team-lead.md` + twin + `agent-team-structure.md` | odwrócony próg + imienna szóstka wyjątków (D2, Q1) | `sync-blocks --check` + `parity` (F6) |
| `deciding-under-uncertainty.md` | akapit D12 + `n=3` w regule 7 | proza; egzekwowanie świadomie odrzucone (D12) |

**Minimalny podział na fale jest tu środkiem ciężkości, nie detalem.** Minimalna liczba fal to
z definicji maksimum tego, co idzie jednocześnie — czyli miara „ile zadań asynchronicznie"
sprowadzona do jednej liczby, którą narzędzie liczy, a nie człowiek szacuje.

**Odwrócony próg wchodzi jako blok synchronizowany, nie jako trzy edycje.** `tools/blocks.json` ma
dziś dwa bloki (`delegation-threshold`, `gate-scaling`), oba stemplowane do tej samej trójki
konsumentów. Trzeci blok jest tu jedynym kształtem, który nie odtwarza usterki „reguła w trzech
plikach w trzech brzmieniach" — repo zamknęło ją raz w 1.27.0 i wiersz 30 backlogu opisuje, ile
kosztowała.

## Model danych i powierzchnia API

**`n/a` — i to jest odnotowane, nie pominięte.** To repo nie ma bazy ani serwera HTTP: nie ma
tabel, nie ma migracji do rozdania, nie ma tras do porównania z `printRoutes()`. Numeracja migracji
jako urządzenie antykolizyjne **nie znika, tylko zmienia nośnik** — jej odpowiednikiem jest tu
tabela `| Plik | Wymuszony przez |` w każdej fazie, bo kolizją, którą ryzykujemy, jest dwóch workerów
na jednym pliku doktryny, a nie dwie migracje o tym samym numerze.

Maszynowo porównywalnym artefaktem, który ten spec **tworzy**, jest wpis w `tools/blocks.json` (F6):
zbiór konsumentów bloku jest listą, którą `sync-blocks --check` konfrontuje z dyskiem — dokładnie tą
rolą, którą w aplikacji pełni blok `yaml` z trasami.

## Bezpieczeństwo

**`n/a` co do auth i danych — z jednym zastrzeżeniem, które nie jest formalnością.** Spec nie dotyka
uwierzytelniania, uprawnień ani danych osobowych. Ale **push do `main` jest deployem na każdą
maszynę z pluginem**, a `AGENTS.md` i role czyta każda sesja u każdego klienta. To jest powód, dla
którego D12 uznaje warunek „droga pomyłka" za spełniony z definicji dla całej tej klasy — i powód,
dla którego etapy A i C są pomiarem, a nie argumentem.

## Plan wykonania

> Sekcja w formacie, który ten spec wprowadza — i jednocześnie materiał, który etap C ocenia.
> Dwie osie są **niezależne**: równoległość wynika z przecięcia zbiorów plików, blokowanie z tego,
> czy lider musi czekać na wynik, zanim wyśle następną falę.

| Fala | Fazy | Równolegle | Blokuje lidera | Wykonawca |
|---|---|---|---|---|
| 1 | F1 · F2 · F7 · F8 | tak — zbiory plików rozłączne | **nie** — lider wysyła i wraca do nadzoru | F1 `be-dev` · F2 `qa` (kampania) · F7 `tester` · F8 `be-dev` |
| 2 | F3 · F6 | **warunkowo** — patrz niżej | nie | F3 `be-dev` · F6 `be-dev` |
| 3 | F4 | — | **tak** — etap C wymaga zastosowanego zwycięzcy A | `qa` (kampania) |
| 4 | F5 | — | nie | `be-dev` |
| 5 | F9 · F10 | tak | nie | `qa` (kampanie) |

**Warunek na falę 2, którego narzędzie nie wyliczy z samych ścieżek.** Jeśli etap A wyłoni wariant
**A2 (pełny blok synchronizowany)**, to F3 też dotknie `tools/blocks.json` — a ten plik należy do
F6. Wtedy fale 2 rozpada się na dwie: F6 przed F3. Przy zwycięstwie A1 lub A3 zbiory są rozłączne
i obie idą razem. **To jest zapisane tutaj, bo jest to zależność od wyniku pomiaru, a nie od
dzisiejszej zawartości dysku — `ownership-check.js` nie ma jej skąd wziąć.**

**Blokowanie lidera występuje dokładnie raz**, przed falą 3. Wszędzie indziej lider wysyła falę
i wraca do nadzoru — co jest całym punktem tego specu, zastosowanym do niego samego.

## Fazy

### F1 — tryb fal w `ownership-check.js`

| Plik | Wymuszony przez |
|---|---|
| `tools/ownership-check.js` | F1.1, F1.2, F1.3 |
| `tools/ownership-check.test.js` | F1.1, F1.2, F1.3 |

- **F1.0 — narzędzie czyta spec, nie blok, którego nikt nie pisze.** Dziś `findOwnershipBlock()`
  szuka `ownership:`, a `grep -rln "^ownership:"` zwraca zero plików w całym repo (U2). Źródłem
  własności plików staje się **tabela `| Plik | Wymuszony przez |` każdej fazy plus jej przypisanie
  do fali z `## Plan wykonania`**. Bez tego cała reszta fazy operuje na danych, których nie ma.
- **F1.1** — `findConflicts()` zyskuje wymiar fali: dwie fazy dzielące plik **w różnych falach** nie
  są konfliktem. Dziś są, i dlatego narzędzie odrzuciłoby spec 1.28.0 (U3).
- **F1.2** — nowa funkcja wylicza **minimalny podział na fale** ze zbiorów plików i zwraca liczbę fal
  wraz z przypisaniem. To jest miara „ile idzie jednocześnie" sprowadzona do liczby (D6).
- **F1.3** — rozbieżność między wyliczonym minimum a podziałem zadeklarowanym w specu kończy się
  `exit 1` z nazwaniem obu liczb. Nadmierna serializacja jest **usterką**, nie preferencją — to ta
  połowa incydentu 2026-08-01, która kosztowała czas.
  **Ale porównanie obejmuje wyłącznie fazy bez zadeklarowanego blokowania.** Narzędzie widzi zbiory
  plików i nic więcej; druga oś z D3 — czy lider czeka na wynik — jest dla niego niewidzialna.
  Ten spec jest własnym przypadkiem testowym: ma pięć fal, z których F4 czeka na zastosowany wynik
  etapu A, a nie na zwolnienie pliku. Narzędzie liczące minimum z samych ścieżek zażądałoby tu mniej
  fal i **miałoby rację co do plików, a nie co do planu**. Dlatego faza, która w `## Plan wykonania`
  niesie wpis w kolumnie „blokuje lidera", jest z porównania wyłączona, a jej wyłączenie
  raportowane — cicho pominięta faza to ta sama dziura co cichy pass.
- **F1.4 — „nie ma czego sprawdzać" przestaje być sukcesem dla specu.** Zmierzone 2026-08-17:
  `node tools/ownership-check.js .ai/specs/2026-08-02-outstanding-debt-and-docs-delta.md` zwraca
  **exit 0 z komunikatem „carries no `ownership:` block — nothing to check"**. Plik, który spec
  rozpoznaje jako spec (ma `## Fazy` i tabele plików), a z którego nie da się wyczytać własności,
  kończy się `exit 1`. Milcząca zgoda na brak danych jest tym, przez co wpięcie tego w `npm test`
  dałoby bramkę zieloną na zawsze.

**Done-when:**
- `node tools/ownership-check.test.js` → exit 0, i suite zawiera przypadek, w którym dwie fazy dzielą
  plik w różnych falach i wynik to exit 0, oraz przypadek nadmiernej serializacji kończący się exit 1.
- **Dowód detekcji (tier B, `sailes-test`):** dla F1.1, F1.3 i F1.4 zepsuj dokładnie to zachowanie
  w `ownership-check.js`, pokaż czerwony dokładnie ten przypadek, cofnij, suite zielony. Bez tego
  faza nie jest zamknięta — test, który nie wykrywa własnej usterki, jest zielonym światłem, nie bramką.
- **Przypadek regresyjny na prawdziwym artefakcie, nie na fixture:**
  `node tools/ownership-check.js .ai/specs/2026-08-02-outstanding-debt-and-docs-delta.md` → exit 0
  **i wypisuje liczbę odczytanych faz oraz wyliczoną liczbę fal**. Sam exit 0 tej klauzuli nie
  spełnia: dziś też jest zerem, bo narzędzie nie znajduje danych i uznaje to za zgodę. Ten spec ma
  F3/F4/F5b na `agents/*.md` w różnych falach i **jest poprawny** — narzędzie, które go odrzuca, jest
  zepsute (U3); narzędzie, które go przepuszcza nic nie przeczytawszy, jest bezużyteczne (U2).
- `node tools/ownership-check.js` **na tym specu** → exit 0, przy odczytanych 10 fazach i 5 falach,
  z F4 raportowaną jako **wyłączona z porównania minimum** (blokuje lidera). Ten spec jest
  przypadkiem testowym na fałszywy pozytyw: narzędzie, które zażąda tu mniej fal, jest zepsute
  w sposób, który każe człowiekowi zignorować następne ostrzeżenie.
- `npm test` → exit 0.

### F2 — etap A: czy reguła delegowania w ogóle dociera do sesji

| Plik | Wymuszony przez |
|---|---|
| `.ai/eval-runs/<data>-dojscie-reguly/**` | F2.1, F2.2 |

Żadnego pliku poza katalogiem przebiegu. **Ramiona żyją we własnych worktree'ach z własnym
`AGENTS.md`** — reguła 10: nie dotykaj materiału pod testem w trakcie przebiegu.

- **F2.1** — trzy ramiona × trzy przebiegi = 9: **A3** dzisiejszy stan (baseline) · **A1** krótki
  wyzwalacz w `AGENTS.md` · **A2** pełny blok synchronizowany.
- **F2.2** — kryteria **wyprowadzane mechanicznie**, ustalone przed dyspozycją (reguła 1): (1) czy
  sesja zawołała agenta **przed pierwszą edycją pliku produktu** — binarnie, z zapisu narzędzi;
  (2) ile faz poszło jednocześnie — licznik równoległych dyspozycji; (3) czas do pierwszej dyspozycji
  i do końca. **Nie punktujemy** jakości prozy, tonu ani bogactwa uzasadnienia (reguła 2).

**Done-when:**
- 9 artefaktów przebiegu w `.ai/eval-runs/<data>-dojscie-reguly/`, każdy z trzema liczbami z F2.2.
- `VERDICT.md` nazywa zwycięskie ramię i zapisuje, że rozstrzygnięto **pomiarem**, nie argumentem.
- **Przed odczytem werdyktu** potwierdzone, że fixture tworzy warunek (reguła 4) — w tym repo fixture
  bywał słabszym ogniwem niż zachowanie pięć razy. Jeśli wszystkie trzy ramiona wyjdą tak samo,
  podejrzenie pada najpierw na fixture, nie na wynik (reguła 5).
- Wynik 2:1 zapisany jako **słaby efekt**, nie jako rozstrzygnięcie (D11).

### F3 — zastosowanie zwycięzcy etapu A

| Plik | Wymuszony przez |
|---|---|
| `AGENTS.md` | F3.1 |
| `skills/sailes-bootstrap/agents-md-template.md` | F3.2 |
| `tools/blocks.json` | F3.1 **tylko przy zwycięstwie A2** |

- **F3.1** — do `AGENTS.md` trafia wariant, który wygrał, w brzmieniu, które było mierzone. Nie
  „ulepszone po drodze" — zmieniona proza to niezmierzony wariant.
- **F3.2** — szablon kliencki dostaje to samo. D7: framework i szablon idą razem, świadomy dryf
  odrzucony.
- **Przy zwycięstwie A3 (baseline) ta faza jest pusta i to jest wynik**, nie porażka: znaczy, że
  proza w `AGENTS.md` niczego nie kupuje i warunek uruchomienia etapu B jest spełniony.

**Done-when:**
- `grep -c "BEGIN\|END" AGENTS.md` zgadza się z wariantem: `0` dla A1/A3, `≥2` dla A2.
- `node tools/sync-blocks.js --check` → exit 0.
- **Szablon kliencki niesie ten sam wyzwalacz co `AGENTS.md`** — `diff <(wyciąg z AGENTS.md)
  <(wyciąg z agents-md-template.md)` bez różnic. Dziś jest odwrotnie i to jest U5b: szablon ma
  wyzwalacz (`:105`), a własny `AGENTS.md` repo nie ma żadnego. Faza, która naprawia framework
  i zostawia szablon, odtwarza tę asymetrię w drugą stronę.
- `npm test` → exit 0.
- Brzmienie w `AGENTS.md` jest **bajtowo identyczne** z ramieniem z `.ai/eval-runs/` — porównane
  poleceniem, nie okiem.

### F4 — etap C: format planu wykonania

| Plik | Wymuszony przez |
|---|---|
| `.ai/eval-runs/<data>-format-planu/**` | F4.1 |

- **F4.1** — dwa ramiona × trzy przebiegi = 6, na **zwycięskim wariancie A**: **C1** plan w specu ·
  **C2** sam wsad. Kryteria jak w F2.2.

**Done-when:**
- 6 artefaktów + `VERDICT.md` z nazwanym zwycięzcą i proweniencją rozstrzygnięcia.
- Potwierdzenie warunku fixture'a przed odczytem (reguła 4).

### F5 — sekcja `## Plan wykonania` w skillu i szablonie

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md` | F5.1 |
| `skills/sailes-bootstrap/spec-writing-template.md` | F5.1, F5.2 |

- **F5.1** — sekcja w formacie, który wygrał etap C: dwie osie (równoległość ⊥ blokowanie, D3) i rola
  na fazę.
- **F5.2** — szablon kliencki dostaje to samo (D7).

**Done-when:**
- Oba pliki niosą sekcję pod nazwą `## Plan wykonania` (Q3).
- Ten spec przechodzi na `Status: approved`, bo warunek z nagłówka jest spełniony.
- `npm test` → exit 0.

### F6 — odwrócony próg lidera z imienną szóstką wyjątków

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/lead-threshold-inversion.md` (nowy — źródło bloku) | F6.1 |
| `tools/blocks.json` | F6.2 |
| `agents/team-lead.md` | F6.2 |
| `codex-agents/team-lead.toml` | F6.2 |
| `skills/sailes-bootstrap/agent-team-structure.md` | F6.2 |

- **F6.1** — nowy plik źródłowy niesie odwrócony próg i **szóstkę z Q1**, z jawnym rozstrzygnięciem,
  co wygrywa przy zderzeniu ze zmierzoną treścią `delegation-threshold.md`. Bez tego zdania powstają
  dwa sprzeczne zdania w jednej doktrynie — usterka z 2026-08-01, opisana w wierszu 24 backlogu.
- **F6.2** — blok stemplowany do tej samej trójki konsumentów co dwa istniejące.

**Done-when:**
- `node tools/sync-blocks.js --check` → exit 0.
- `node codex-agents/parity.test.js` → exit 0, a lista niezmienników niesie **koncept odwróconego
  progu**. Wiersz 105 backlogu mówi, dlaczego to jest warunek, a nie ozdoba: bramka twin-driftu jest
  szeroka dokładnie na tyle, na ile szeroka jest jej ręcznie utrzymywana lista, a „parity green"
  znaczy „wylistowane koncepty się zgadzają", nie „bliźniaki są zgodne".
- `grep -c "BEGIN lead-threshold-inversion" agents/team-lead.md codex-agents/team-lead.toml skills/sailes-bootstrap/agent-team-structure.md`
  → `1` w każdym.
- `npm test` → exit 0.

### F7 — drugie ramię evala `lead-delegates`, mierzące zachowanie bez pytania o plan

| Plik | Wymuszony przez |
|---|---|
| `evals/lead-delegates-instead-of-bulk-coding.md` | F7.1, F7.2 |
| `.ai/backlog.md` | F7.3 |

- **F7.1** — nowe ramię **nie pyta o plan**. Setup daje robotę i milczy; mierzone jest to, co agent
  zrobi, gdy nikt nie zapyta (U4). Ramię, którego setup zawiera prośbę o plan, jest **odrzucone
  w recenzji** — powtarza dokładnie ten błąd, przez który obecny eval jest zielony.
- **F7.2** — przebieg **baseline przed falą 2**, żeby zmiany doktrynalne miały do czego być
  porównane, i ponowny po F3/F6.
- **F7.3** — wiersz 29 backlogu zostaje zamknięty z powodem: F6 tamtego specu wprowadził kryterium
  symetryczne, więc opis „żąda powodu w jedną stronę" jest nieaktualny.

**Done-when:**
- `node evals/harness/eval-status.js --strict` → exit 0, scenariusz nie figuruje wśród „did not
  record a PASS".
- `Last run:` niesie werdykt, wehikuł i **sha klonu pluginu** — wiersz 77 backlogu: klon nie
  aktualizuje się sam, więc „prawdziwa rola" bez sha nie mówi, którą wersję oceniano.
- Setup nowego ramienia **nie zawiera** prośby o plan — sprawdzone przez czytanie, zapisane
  w recenzji fazy jako jawne potwierdzenie.
- **Wiersz 29 `.ai/backlog.md` ma status inny niż `open`**, z powodem nazywającym F6 tamtego specu
  jako to, co go zamknęło. Wiersz, który przeżył własną naprawę, jest w tym repo udokumentowaną
  klasą usterki (wiersz 85: „ten wiersz sam był nieświeży") — zostawienie go otwartym powtarza ją
  świadomie.

### F8 — reguła D12 w `deciding-under-uncertainty.md`

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/deciding-under-uncertainty.md` | F8.1, F8.2 |

- **F8.1** — akapit: dla forków harnessowych i doktrynalnych warunek „droga pomyłka" jest spełniony
  z definicji (push do `main` = deploy na każdą maszynę), **więc zostaje tylko warunek pierwszy:
  mierz, chyba że potrafisz uzasadnić rekomendację faktem z dysku**. To zaostrzenie istniejącego
  testu, nie jego zniesienie — plik wprost ostrzega *„Do not propose an experiment to avoid a
  decision you can make"* i to zdanie zostaje.
- **F8.2** — do reguły 7 (`:58`) dochodzi liczba z D11: ramię behawioralne = **trzy** przebiegi,
  większość rozstrzyga, 2:1 zapisuje się jako słaby efekt.

**Done-when:**
- `grep -c "Do not propose an experiment to avoid a decision you can make" skills/sailes-bootstrap/deciding-under-uncertainty.md`
  → `1`. Istniejące ostrzeżenie **przeżywa** akapit D12; akapit, który je usuwa albo mu przeczy,
  znosi test zamiast go zaostrzyć i fazy nie zamyka.
- Reguła 7 (`:58`) niesie liczbę `trzy` i zapis, że 2:1 jest słabym efektem.
- `git diff --stat` tej fazy pokazuje **dokładnie jeden plik**. Bramki w `npm test` nie przybywa —
  D12 świadomie odrzucił bramkę na tę regułę; drugi plik w diffie tej fazy znaczy, że ktoś ją
  jednak dołożył.

### F9 — etap B: egzekwowanie · **WARUNKOWY**

**Uruchamiany wyłącznie, jeśli etap A wykazał, że sama proza nie wystarcza.** Wymaga zbudowania
**obu** hooków przed pomiarem — nie mierzy się hooka, którego nie ma. To czyni ten etap najdroższym
i dlatego jest ostatni (D10).

| Plik | Wymuszony przez |
|---|---|
| `hooks/**` (dwa warianty) | F9.1 |
| `.ai/eval-runs/<data>-egzekwowanie/**` | F9.2 |

- **F9.1** — B2 hook ostrzegawczy · B3 hook blokujący z obejściem.
- **F9.2** — ramiona jak wyżej, kryteria jak w F2.2.

**Done-when:**
- Jeśli warunek uruchomienia nie zaszedł: faza zamyka się wpisem „nie uruchomiona, bo etap A
  wykazał X" — **niewykonana faza z powodem jest wynikiem, pusta nie jest**.
- Jeśli zaszedł: artefakty + `VERDICT.md`, a **hook blokujący nie wchodzi bez zmierzonego wskaźnika
  fałszywych pozytywów**. To repo ma dwa udokumentowane checki wyłączone właśnie za krzyk wilkiem,
  a fałszywy pozytyw tutaj blokuje jednolinijkową poprawkę — czyli dokładnie przypadek, który
  zmierzona reguła progu każe robić solo.

### F10 — pomiar swarma

| Plik | Wymuszony przez |
|---|---|
| `.ai/eval-runs/<data>-swarm/**` | F10.1 |

- **F10.1** — D4: ile równoległych dyspozycji faktycznie się opłaca. Decyzja **po liczbie**, nie
  przed nią; opt-in bez przebiegu został odrzucony jako klasa „egzekwowanie zadeklarowane i nieobecne".

**Done-when:** artefakty + liczba + zapis, czy rozstrzygnięto pomiarem.

## Integration coverage

| Powierzchnia | Ścieżka | Pokrycie w tej samej zmianie |
|---|---|---|
| Narzędzie fal | `tools/ownership-check.js` | `tools/ownership-check.test.js` + dowód detekcji tier B (F1) |
| Narzędzie fal na prawdziwym artefakcie | spec 1.28.0 | przypadek regresyjny w `Done-when` F1 |
| Blok odwróconego progu | `agents/team-lead.md` · twin · `agent-team-structure.md` | `sync-blocks --check` + `parity.test.js` z konceptem na liście (F6) |
| Dojście reguły | `AGENTS.md` · `agents-md-template.md` | etap A (F2) + porównanie bajtowe w `Done-when` F3 |
| Format planu | `sailes-spec/SKILL.md` · `spec-writing-template.md` | etap C (F4) |
| Zachowanie lidera | — | drugie ramię evala bez pytania o plan (F7) |
| Doktryna D12 | `deciding-under-uncertainty.md` | świadomie bez bramki (D12) |

## Non-goals — świadomie poza zakresem, nie zapomniane

- **Nie ruszamy zmierzonej treści `delegation-threshold.md`** (spawn poniżej ~jednego pliku kosztuje
  więcej, niż oszczędza). Odwrócony próg jest warstwą **nad** nią, z jawnym rozstrzygnięciem, co
  wygrywa przy zderzeniu.
- **Nie mierzymy kanałów spalania kontekstu lidera.** Wycofane po sprostowaniu miary przez człowieka:
  lider **ma** wiedzieć, co się dzieje, i **ma** nadzorować — ma tylko przestać wykonywać.
- **Nie dokładamy bramki na regułę D12** (świadomie, D12).
- **Nie budujemy hooka egzekwującego przed etapem A.** Leczenie objawu przy U5 zostało odrzucone
  w D10.
- **Kolizja ze specem 2026-08-02 przestała być non-goalem** — F6 tamtego specu wszedł, więc nie ma
  czego rozdzielać kolejnością. Zapis zostaje, żeby czytelnik Briefu nie szukał nieistniejącego
  konfliktu.
