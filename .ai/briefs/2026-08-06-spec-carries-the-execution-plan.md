# Brief: spec niesie plan wykonania, a lider przestaje pracować sam

Typ: brownfield (zmiana w tym frameworku)
Data: 2026-08-06
Wywiad: `sailes-discovery`, trzy rundy kart decyzyjnych
Materiał wejściowy: rekonesans przeciw dyskowi wykonany w trakcie wywiadu (pięć ustaleń niżej) ·
`evals/lead-delegates-instead-of-bulk-coding.md` · `skills/sailes-bootstrap/deciding-under-uncertainty.md` ·
`evals/harness/README.md` · `.ai/backlog.md` (pozycja „an announcement with no consequence", 2026-08-02)

## Problem — słowami człowieka, nie moimi

Trzy rzeczy, w tej kolejności ważności:

1. **Lider zaczyna wykonywać zadania sam.** Człowiek musi za każdym razem prosić o powołanie
   agentów. To jest ból przeżyty, nie hipoteza.
2. **Spec nie ułatwia delegowania.** Nie mówi, które zadania kiedy mają iść, więc plan dyspozycji
   powstaje od nowa przy każdej implementacji — w kontekście lidera, przez czytanie plików.
3. **Za mało rzeczy idzie jednocześnie.** Cel to tempo developmentu, nie oszczędność tokenów.

**Miara jest jawnie sprostowana w trakcie wywiadu.** Pierwsza runda wywiadu czytała cel jako
„ogranicz zużycie kontekstu lidera" i była to zła miara — człowiek poprawił: lider **ma** wiedzieć,
co się dzieje, i **ma** nadzorować. Ma tylko przestać wykonywać. Miary są dwie: **czy ruszył bez
przypomnienia** i **ile rzeczy poszło jednocześnie**. Zapisane, bo jedna widełka (pomiar kanałów
spalania kontekstu) została na tej podstawie wycofana i nie ma po niej wracać.

## Pięć ustaleń z rekonesansu — każde zweryfikowane przeciw dyskowi

**U1 — połowa mechanizmu istnieje w złym artefakcie.** Blok `ownership:` + `tools/ownership-check.js`
mieszkają w run logu (`.ai/runs/`), pisanym przez lidera w trakcie implementacji. Spec zna zbiory
plików wcześniej: spec 1.28.0 ma tabelę `| Plik | Wymuszony przez |` dla każdej z ośmiu faz.

**U2 — blok `ownership:` nigdy nie został napisany.** `grep -rln "^ownership:" --include=*.md .`
→ **zero plików w całym repo**. Narzędzie weszło w 1.27.0; od tego czasu powstały dwa run logi
(`2026-08-02-delegation-spec-and-1.27.x.md`, `2026-08-02-outstanding-debt-and-1.28.0.md`) i żaden go
nie niesie. `ownership-check.js` jeździł wyłącznie po własnych fixture'ach. Artefakt, do którego
ludzie faktycznie piszą własność plików, to **spec**; narzędzie czeka przy run logu.

**U3 — `ownership-check.js` odrzuciłby poprawny plan fal.** `findConflicts()` zgłasza każdą ścieżkę
należącą do 2+ zadań **globalnie**; nie zna pojęcia fali. Spec 1.28.0 ma F3, F4 i F5b wszystkie na
`agents/*.md`, celowo rozdzielone na fale 2 i 3 — wrzucony do narzędzia dziś dałby `exit 1`,
„konflikt", który spec już rozwiązał kolejnością. Teza „plan w specu reużywa istniejące narzędzie bez
zmian" jest **nieprawdziwa** i została w wywiadzie wycofana.

**U4 — eval na delegowanie jest zielony i mierzy nie to.** `evals/lead-delegates-instead-of-bulk-coding.md`,
ostatni przebieg 2026-08-02, **PASS oba ramiona**, prawdziwy typ `team-lead` na Opusie. Jego setup:
*„Ask it how it will execute this phase."* — eval pyta o **plan**. Ból dotyczy tego, co agent robi,
gdy dostaje robotę i **nikt go o plan nie pyta**. Eval nigdy tej sytuacji nie dotknął. Sam przyznaje
cienki margines: *„it never considers the solo option at all — it argues why more than one worker is
needed, not why any worker is needed rather than the lead."*

**U5 — sesja, z którą rozmawia człowiek, nigdy nie dostaje reguły.** Próg delegowania jest stemplowany
przez `sync-blocks.js` do `agents/team-lead.md`, `codex-agents/team-lead.toml`,
`skills/sailes-bootstrap/agent-team-structure.md`. `grep -n "BEGIN\|END" AGENTS.md` → **zero trafień**;
`AGENTS.md` nie niesie ani jednego synchronizowanego bloku. Czyta natomiast: *„Delegation is **the
lead's** default (`agents/team-lead.md`)"* — wskaźnik na plik, którego nie ładuje, opisujący rolę,
którą nie jest; zdanie gramatycznie o kimś innym. Dwie reguły, które ta sekcja niesie, dotyczą **jak**
delegować, nie **czy**.

**U5b — framework jest tu słabszy niż to, co wysyłamy klientom.** `agents-md-template.md:105` daje
repo klienckiemu wyzwalacz: *„3+ steps / BE+FE / API contract / architecture → run as a team, not
solo"*. Własny `AGENTS.md` tego repo nie ma żadnego wyzwalacza. Koryguje to moje wcześniejsze zdanie
z wywiadu, że mechanizmy istnieją i nic ich nie egzekwuje: **w tym repo one nawet nie docierają.**

## Decisions Ledger

| # | Decyzja | Wybór | Kto | Odrzucone (dlaczego nie) |
|---|---|---|---|---|
| D1 | Gdzie mieszka plan wykonania | **rozstrzygane pomiarem** — czynnik C: plan w specu vs sam wsad | człowiek | „oba + zapis dryfu" — nie alternatywa, tylko przyrost na wariancie z planem; do backlogu |
| D2 | Próg lidera | **odwrócony domyślny + imienna lista wyjątków** | człowiek | twardy mandat (zderza się ze zmierzoną regułą progu); budżet kontekstu (brak instrumentu — subagent nie widzi własnego zużycia) |
| D3 | Osie sync/async | **dwie osobne kolumny**: równoległość (przecięcie zbiorów plików) ⊥ blokowanie (czy lider czeka) | człowiek | każda oś z osobna — obie zostawiały połowę pytania |
| D4 | Swarm | **faza pomiarowa**, decyzja po liczbie | człowiek | backlog; opt-in bez przebiegu (klasa „egzekwowanie zadeklarowane i nieobecne") |
| D5 | Kolejność | **format specu przed swarmem** (uszczegółowione przez D10) | człowiek | odwrotnie |
| D6 | Kto liczy fale | **narzędzie wylicza minimalny podział, spec zapisuje, rozbieżność = exit 1** | człowiek | walidacja wewnątrz fali (nie łapie nadmiernej serializacji, czyli tej połowy incydentu 2026-08-01, która kosztowała czas); proza |
| D7 | Zasięg | **`sailes-spec` + `spec-writing-template.md` razem** | człowiek | najpierw framework (świadomy dryf); nigdy do klientów (odcina główną korzyść) |
| D8 | Dojście reguły do `AGENTS.md` | **rozstrzygane pomiarem** — czynnik A: krótki wyzwalacz vs pełny blok vs nic | człowiek | — |
| D9 | Egzekwowanie | **rozstrzygane pomiarem** — czynnik B: sam eval vs hook ostrzegawczy vs hook blokujący z obejściem | człowiek | — |
| D10 | Projekt eksperymentu | **etapowo**: A → C → B, przy czym etap B **warunkowy** | człowiek | pełna krata (buduje oba hooki, zanim wiadomo, czy potrzebne); tylko B (leczy objaw przy U5) |
| D11 | Powtórzenia | **trzy na ramię, większość rozstrzyga** | człowiek | dwa z eskalacją (zgodność dwóch to słaby dowód — reguła 5); jeden jako single-run (sondaż, nie pomiar, przy tej stawce) |
| D12 | Gdzie ląduje reguła „mierz sprawy harnessowe" | **akapit w `deciding-under-uncertainty.md` + zaostrzenie reguły 7 o konkretne `n`** | człowiek | + bramka w `npm test`; osobny plik doktrynalny (trzecia kopia obok tamtego pliku i `evals/harness/README.md`) |

**Uzgodnienie D5 z D10, żeby nie zostały w dokumencie dwa porządki.** D5 padło przed D10 i mówiło
„format specu najpierw". D10 je uszczegóławia: **A (dojście) → C (format specu) → B (hooki,
warunkowo) → swarm.** Obowiązuje D10. D5 zostaje w tabeli tylko jako zapis, że swarm jest ostatni.

## Reguła D12 w formie, która nie łamie istniejącego zapisu

`deciding-under-uncertainty.md` stawia **dwa** warunki na eksperyment (nie umiesz uzasadnić **oraz**
pomyłka jest droga) i wprost ostrzega przed mierzeniem zamiast decydowania: *„Do not propose an
experiment to avoid a decision you can make."* Wersja „zawsze mierz sprawy harnessowe" złamałaby to.
Forma, która nie łamie:

> **Dla forków harnessowych/doktrynalnych warunek „droga pomyłka" jest spełniony z definicji** — push
> do `main` jest deployem na każdą maszynę — **więc zostaje tylko warunek pierwszy: mierz, chyba że
> potrafisz uzasadnić rekomendację faktem z dysku.**

To zaostrzenie, nie sprzeczność: domyka jeden z dwóch warunków dla całej klasy zamiast znosić test.

Do reguły 7 (*„One run is a sample, not a measurement"*) dochodzi liczba z D11: **ramię behawioralne
= trzy przebiegi, większość rozstrzyga; 2:1 jest sygnałem słabego efektu i zapisuje się jako taki.**

## Zakres

**Wchodzi:** sekcja planu wykonania w `sailes-spec` + `spec-writing-template.md` (D7) · tryb fal
w `ownership-check.js` z wyliczaniem minimalnego podziału (D6, U3) · odwrócony próg lidera z listą
wyjątków (D2) · dojście reguły do `AGENTS.md` i szablonu w wariancie, który wygra etap A (D8) ·
drugie ramię evala `lead-delegates`, oceniające zachowanie bez pytania o plan (U4) · akapit doktryny
+ liczba powtórzeń (D12) · trzyetapowa kampania pomiarowa (D10, D11) · pomiar swarma (D4).

**Non-goals:**
- **Nie ruszamy zmierzonej treści `delegation-threshold.md`** (spawn poniżej ~jednego pliku kosztuje
  więcej, niż oszczędza). Odwrócony próg jest warstwą **nad** nią, z jawnym rozstrzygnięciem, co
  wygrywa przy zderzeniu — inaczej powstają dwa sprzeczne zdania w jednej doktrynie, czyli usterka
  z 2026-08-01.
- **Nie mierzymy kanałów spalania kontekstu lidera** (raporty, diffy). Wycofane po sprostowaniu miary.
- **Nie ruszamy specu w locie** `2026-08-02-outstanding-debt-and-docs-delta.md`. Uwaga na kolizję:
  jego faza F6 edytuje `evals/lead-delegates-instead-of-bulk-coding.md`, którego dotyka też ta
  robota. Dwa specy na jednym pliku — **musi być rozstrzygnięte kolejnością, nie równoległością.**

## Plan pomiarów

**Etap A — dojście** (najtańszy, sama proza, zero nowego kodu). Ramiona: A3 = dzisiejszy stan
(baseline) · A1 = krótki wyzwalacz w `AGENTS.md` · A2 = pełny blok. **Każde ramię we własnym
worktree z własnym `AGENTS.md`** — reguła 10: nie dotykaj materiału pod testem w trakcie przebiegu.
3 ramiona × 3 przebiegi = 9.

**Etap C — format specu**, na zwycięskim wariancie A. Ramiona: C1 plan w specu · C2 sam wsad.
2 × 3 = 6.

**Etap B — egzekwowanie, WARUNKOWY**: uruchamiany tylko, jeśli A pokazał, że sama proza nie
wystarcza. Wymaga zbudowania **obu** hooków przed pomiarem — nie mierzy się hooka, którego nie ma;
to czyni ten czynnik najdroższym i dlatego jest ostatni.

**Kryterium, ustalone TERAZ i wyprowadzane mechanicznie** (reguła 1 — kryterium napisane po zobaczeniu
wyników to opinia w kitlu):
1. **Czy sesja zawołała agenta przed pierwszą edycją pliku produktu** — binarnie, z zapisu narzędzi.
2. **Ile faz poszło jednocześnie** — licznik równoległych dyspozycji.
3. **Czas do pierwszej dyspozycji i do końca** — zegar.

**Nie punktujemy** (reguła 2): jakości prozy planu, tonu, „bogactwa uzasadnienia". Wszystkiego, co
trzeba by ocenić uznaniowo.

## Ryzyka, których nie zamykam

- **Fixture jest w tym repo słabszym ogniwem częściej niż zachowanie** — pięć razy udokumentowane,
  ostatnio w tym samym evalu, gdzie ramię przeszło, *bo* fixture był zepsuty. Reguła 4 (potwierdź,
  że fixture tworzy warunek, przed czytaniem werdyktu) obowiązuje tu podwójnie.
- **Jeśli wszystkie ramiona A wyjdą tak samo, podejrzewaj fixture przed wynikiem** (reguła 5).
- **Hook blokujący (B3) może krzyczeć wilkiem.** To repo ma **dwa** udokumentowane checki wyłączone
  właśnie za to, a fałszywy pozytyw tutaj blokuje jednolinijkową poprawkę — czyli dokładnie
  przypadek, który zmierzona reguła progu każe robić solo.

## Otwarte, do bramy Open Questions specu

1. **Treść listy wyjątków dla lidera** (operatywna treść D2). Propozycja niepotwierdzona: merge/
   integracja · zamrożenie kontraktu · run log · `STATE.md` · werdykt bramki · eskalacja do człowieka.
2. Podział weryfikacji: tryb fal → test w `tools/ownership-check.test.js` wpięty w `npm test`;
   „czy lider honoruje próg" → eval. Do potwierdzenia.
3. Nazwa sekcji specu (`## Plan wykonania`) — trywialne, do zawetowania.
4. Kolejność względem specu w locie — F6 tamtego specu i ta robota dotykają jednego pliku evala.

## Handoff

→ `sailes-spec`: **tylko skeleton + brama Open Questions**. Spec staje na `Status: draft`, bo jego
własna sekcja planu wykonania jest tym, co rozstrzyga etap C. Wynik każdego etapu ląduje w
`.ai/eval-runs/<data>-<nazwa>/` z oboma ramionami i punktacją, a przy decyzji zapisuje się, **czy
została rozstrzygnięta argumentem czy pomiarem** — proweniencja, której później nie da się odtworzyć.
