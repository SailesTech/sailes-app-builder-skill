# Faza 1 — `GET /api/orders/export` (CSV, filtr po dacie) — plan wykonania

Rola: `team-lead`. Spec zatwierdzony, kontrakt BE zamrożony — nic tu nie idzie do eskalacji poza
jednym warunkowym punktem (§1) i jedną bramką, która z definicji należy do człowieka (§4, freeze
listy przypadków `tester`a).

## 0. Decyzja: kto pisze

**Deleguję. Nie piszę tego sam.**

Trzy pliki, dwa z nich to realny kod (routing + serwis eksportu), trzeci to suite testowy, który z
racji izolacji bramek **nie może** powstać tą samą ręką co implementacja. Próg delegacji („powyżej
mniej więcej jednego pliku roboty") jest przekroczony w samym `be-dev`ie, a plik testowy jest osobną
rolą niezależnie od rozmiaru. Pisanie tego samemu na tierze Opusa to dokładnie ten kosztowny tryb
awarii, przed którym ta rola istnieje: kod i tak powstanie, bramki i tak przejdą, różnica będzie
wyłącznie na rachunku.

Obsada — 5 spawnów, żadnego `general-purpose`, każdy jako **nazwany typ agenta** (pin modelu,
allow-lista narzędzi, nazwa widoczna w run logu i hookach):

| # | Rola | Pisze? | Worktree | Pliki | Model |
|---|---|---|---|---|---|
| 1 | `explorer` | nie | nie | — (recon) | pin roli (Haiku) — domyślny |
| 2 | `be-dev` | tak | **tak** | `apps/api/src/routes/orders-export.ts`, `apps/api/src/services/order-export.ts` | pin roli (Sonnet) — domyślny |
| 3 | `tester` | tak | **tak** | `apps/api/src/routes/orders-export.test.ts` | pin roli (Sonnet) — domyślny |
| 4 | `checker` | nie | nie | — (read-only) | domyślny **albo** `opus` — warunek w §5 |
| 5 | `qa` | nie | nie (bierze **wyłączność środowiska**) | — | pin roli (Sonnet) — domyślny |

Brak `designer` i `fe-dev`: faza nie dotyka UI. Brak `docs-author` w tej fazie — wchodzi przed
zamknięciem spec, nie przed zamknięciem fazy.

**Log routingu — także nie-override'y.** Wszystkie pięć ról jedzie na pinie z definicji. Rozważyłem
oś modelu i ją odrzuciłem: to jest jeden endpoint z filtrem i serializacją, trudność jest w
pisaniu, nie w osądzie — a sięganie po Opusa dlatego, że diff jest duży, to ten sam błąd co
kodowanie tego samemu. `effort` nie przekazuję nigdzie: nie jest zadeklarowanym parametrem
narzędzia Agent, przechodzi bez błędu i bez skutku, więc traktuję go jako frontmatter-only.
Pominięcie `model` jest sposobem na utrzymanie pinu.

## 1. Zanim cokolwiek wystartuje (moja robota, ~10 min)

1. **Sprawdzam, że „zamrożony" znaczy artefakt na dysku, nie ustalenie w rozmowie.** Musi istnieć
   zacommitowany, typowany kontrakt, który zaimportują obie strony — Zod schema / typy TS /
   OpenAPI. Konkretnie ma pinować cztery rzeczy:
   - nazwy i typy parametrów query (`from`/`to`? `dateFrom`/`dateTo`? format daty?),
   - **kolejność kolumn CSV i obecność wiersza nagłówkowego**,
   - `Content-Type` i `Content-Disposition` (nazwa pliku),
   - kształt błędu przy złym zakresie dat.
2. **Semantyka granic filtra to miejsce, gdzie ten kontrakt najczęściej okazuje się niezamrożony.**
   Czy `to` jest inclusive? W jakiej strefie czasowej liczy się „dzień" — UTC czy strefa tenanta?
   Jeśli spec tego nie rozstrzyga, **to nie jest luka do zasypania przeze mnie** — to nowa decyzja,
   która zmienia zestaw wierszy w eksporcie klienta, więc idzie do człowieka jako karta wyboru
   (2–4 opcje, koszt/zysk, moja rekomendacja oznaczona), zanim `be-dev` dostanie brief. Nie
   dopisuję jej cicho do briefu jako „doprecyzowanie".
3. **Baza worktree'ów.** Sprawdzam, że `main`/branch fazy jest tam, gdzie myślę, i wpisuję do
   każdego briefu warunek wejścia: `git log --oneline -3` musi pokazać sha `<konkretny sha>` **oraz**
   plik `<nazwa pliku, który istnieje dopiero po pracy, na której ta faza stoi>`; jeśli nie —
   fast-forward **przed** pracą, nie po. Zmierzony defekt harnessa: pięć z dwunastu worktree'ów
   dostało checkout sprzed połowy sesji, jeden sprzed dziewiętnastu commitów, i jeden z nich
   zgłosił fałszywą regresję liczby testów.
4. **Tryb delegacji.** Sprawdzam `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, bo to decyduje o dwóch
   rzeczach, których worker sam nie ustali: czy jego raport wraca automatycznie (scoped subagent),
   czy musi wywołać `SendMessage` (background teammate), oraz czy „release" jest aktem do
   potwierdzenia, czy po prostu powrotem. **Nazywam mechanizm dostarczenia w każdym briefie.**

## 2. `explorer` — recon (read-only, bez worktree)

Krótki, bo faza jest wąska. Ma wrócić z `file:line`, nie z opowieścią:
- jak i gdzie rejestrowane są trasy w `apps/api/src/routes/` (router per plik? barrel? auto-load?),
- middleware auth/tenancy na sąsiednich trasach — **którym dokładnie mechanizmem** zapytanie o
  zamówienia jest zawężane do tenanta,
- czy istnieje już helper do CSV / streamowania odpowiedzi, czy `be-dev` pisze serializację od zera,
- warstwa dostępu do danych zamówień (repo? Prisma/Drizzle? gotowe query z filtrem dat?),
- runner i harness testów HTTP (vitest/jest? supertest? fixture'y? factory danych?) — to trafia
  potem do briefu `tester`a, żeby nie wymyślał własnego stylu.

Bez worktree (nic nie pisze, 200–500 ms i kopia dysku nic by tu nie kupiły). Klauzula raportu jak
u wszystkich.

## 3. `be-dev` — implementacja (worktree, dwa pliki)

Brief self-contained: **cel · pliki · kontrakt · ograniczenia · weryfikacja · raport.**

- **Pliki (dokładnie te dwa, i ani jednego więcej):** `apps/api/src/routes/orders-export.ts`,
  `apps/api/src/services/order-export.ts`. **Ma jawny zakaz dotykania `orders-export.test.ts`** —
  to plik `tester`a i jedyny sposób, w jaki bariera informacyjna bramki może zostać naruszona bez
  śladu w diffie. Jeśli uzna, że potrzebuje zmiany poza swoimi dwoma plikami (rejestracja trasy w
  routerze!), **raportuje to jako blokadę do mnie**, nie rozszerza zakresu. Rejestrację trasy
  integruję ja, albo dostaje ją jako trzeci, jawnie wymieniony plik po odpowiedzi `explorer`a.
- **Kontrakt:** importuje zamrożony artefakt, nie przepisuje typów. Drift ma być błędem kompilacji,
  nie znaleziskiem w review.
- **`isolation: worktree`** — bez wyjątku, bo pisze. Test „czy pisze", nie „czy jest na liście".
- **Status file:** pierwszą akcją zajmuje `.claude/status/<worker-id>.md` (`worker`/`task`/`base`/
  `claimed`/`opened`), ostatnią **dopisuje** blok zamknięcia (`closed`/`outcome`/`commit`/`touched`)
  — nigdy nie przepisuje bloku roszczenia. `worker-id` to **id agenta z harnessa**, nie nazwa
  wymyślona przez workera (kolizja nazw cicho nadpisuje cudzą deklarację — czyli reprodukuje
  wewnątrz mechanizmu detekcji dokładnie tę awarię, przed którą stoi izolacja). Jeśli zapis do
  głównego drzewa się nie powiedzie (`Write` odmawia ścieżki poza worktree, `Bash` nie — cała
  mechanika stoi na tej asymetrii), pisze `<worktreePath>/.claude/status/<worker-id>.md` i
  **wyraźnie podaje ścieżkę zapasową w raporcie**.
- **Commituje w swoim worktree** — commit jest jego deklaracją ukończenia. Nie pushuje, nie dotyka
  wspólnego brancha. Checkpointy oznacza `WIP:`.
- **Weryfikacja po jego stronie:** typecheck + uruchomienie endpointu lokalnie na co najmniej
  jednym zakresie dat. „Zielony typecheck" nie jest dowodem.
- **Klauzula raportu, dosłownie w briefie:** *raport JEST deliverable — nie streszczenie dla
  człowieka, nie linijka statusu; jeśli nie skończyłeś, powiedz to wprost i wypisz, co ustaliłeś,
  a czego nie.*

**Jeśli milczy** — drabinka obserwacji, metadane tak, treść nie: (1) zapytać przez `SendMessage`;
(2) `tail -3` transkryptu subagenta (~5 KB, narracja — nigdy nie zastępuje deklaracji ze status
file'a); (3) `git -C <worktreePath> log --oneline` + jego status file; (4) `git status --porcelain`,
`git diff --stat`, mtime plików. Nigdy `git diff` bez `--stat`, nigdy czytanie tych plików, nigdy
cherry-pick niezacommitowanej pracy. Pusty powrót ścigam **raz**, potem eskaluję do człowieka —
nie robię tego sam i nie zapisuję ciszy jako „nie znalazł nic".

**Odbiór: biorę BRANCH, nie ostatni commit.** `git merge --no-ff <branch>` (albo
`git cherry-pick <base>..<branch>`, jeśli chcę commity osobno). Zmierzone 2026-08-02: deklaracja
ukończenia niosła 6 z 16 zmienionych plików, `cherry-pick` zgłosił sukces, brakującą dziesiątkę
złapał przypadkowy grep.

## 4. `tester` — suite (worktree, jeden plik) — i jedyna bramka człowieka w tej fazie

Startuje **po** kodzie i **przed** `checker`em. Trzy kroki, w tej kolejności:

1. **Wyprowadza oczekiwane zachowanie ze SPECU, z nieprzeczytaną implementacją.** To jest cała
   wartość tej roli: suite napisany po lekturze kodu odbija kod, zamiast wykrywać usterki.
2. **Zamraża listę przypadków z człowiekiem** — to nie jest formalność do pominięcia „bo spec jest
   zatwierdzony". Spodziewam się na niej co najmniej: pusty wynik (nagłówek bez wierszy),
   dokładna kolejność kolumn, granice zakresu dat (dzień `from` i dzień `to` włącznie/wyłącznie),
   odwrócony zakres (`to` < `from`), brak parametrów, niepoprawny format daty, escaping CSV
   (przecinek, cudzysłów, znak nowej linii i średnik w nazwie klienta — klasyczny nośnik injection
   do Excela), `Content-Type` + `Content-Disposition`, oraz **izolacja tenanta: zamówienia innego
   tenanta w zakresie dat nie wychodzą w eksporcie**.
3. Dopiero potem pisze suite — **ADD-only względem diffu**, nie modyfikuje kodu `be-dev`a. Znalezisko
   raportuje, nie naprawia w przelocie.

Worktree, status file, commit, klauzula raportu — identycznie jak w §3. Plik jest rozłączny z
plikami `be-dev`a, więc kolizji nie ma nawet gdyby biegły równolegle.

**Rozważone i odrzucone:** puszczenie kroku 1 równolegle z `be-dev`em, żeby freeze listy u człowieka
poszedł wcześniej. Bariera jest informacyjna, nie czasowa, więc formalnie by przeszło — ale suite
i tak potrzebuje realnych nazw eksportów, a freeze i tak serializuje, więc kupowałbym kilka minut za
ryzyko, że worker „zerknie" do kodu w oczekiwaniu. Zostaję przy kolejności z pipeline'u.

## 5. Bramki — skalują się z tym, co może się zepsuć, nie z tym, kto pisał

- **`checker`: TAK.** Diff zmienia zachowanie. Dostaje **wyłącznie diff + spec/kontrakt +
  checklistę** — nigdy raportu `be-dev`a ani jego samooceny. Czysty kontekst to jedyny powód, dla
  którego jego werdykt cokolwiek znaczy.
  **Warunkowa eskalacja na `opus`:** jeśli `explorer` potwierdzi, że zamówienia są zawężane
  tenantem, defekt, którego tu pilnuję, jest kształtu „czego w diffie NIE MA" — brakujący filtr
  tenanta na jednej ze ścieżek dostępu, autoryzacja nieobecna w gałęzi, której nikt nie dopisał.
  To inne zadanie niż sprawdzenie, czy to, co jest, jest poprawne, i to jest uzasadniony trigger
  eskalacji bramki. Bez tenancy — pin roli. Decyzja i jej **wynik** (czy droższy przebieg złapał
  cokolwiek) idą do run logu; log, który nie potrafi powiedzieć, że eskalacja była zbędna, jest
  paragonem, nie zapisem.
- **`qa`: TAK, nie `n/a`.** Jest co obserwować: strzał HTTP w działający stack, pobrany plik,
  nagłówki, zestaw wierszy zgodny z filtrem, zachowanie na granicach zakresu. `qa` dostaje
  **tylko** działającą aplikację i oczekiwane zachowanie ze specu — nie kod, nie raporty.
  **Trzyma środowisko na wyłączność i to ja to egzekwuję, bo `qa` nie może.** Dopóki biegnie:
  nikt nie stawia, nie restartuje i nie migruje bazy, nikt nie dotyka kontenerów. Zapisuję **kto
  trzyma środowisko i od kiedy** — to jedyny zasób, którego nie da się sklonować worktree'em.
  Jeśli stack nie wstaje: to `ENV-DEFECT` do zaraportowania, nie powód do udanego przebiegu.
- **Czwarta oś kolizji — współdzielony toolchain.** Nie odpalam typechecku ani suite'u w momencie,
  gdy worker stawia worktree i robi `install`: wspólny store i `tsc --build` nie sumują się, tylko
  serializują (zmierzone: `pnpm check`, normalnie minuta, wisiał dziesięć). Jeśli coś wisi — liczę
  procesy **po linii poleceń**, nie po nazwie, i nie zabijam language serverów ani MCP.
- `CHANGES-REQUIRED` wraca do **świeżego** workera odpowiedniej roli, nigdy do zużytego kontekstu
  poprzedniego.

## 6. Zamknięcie fazy

1. Odbiór każdego workera: **status file kontra worktree, tylko metadane** — czy `commit` istnieje,
   czy `touched` zgadza się z `git diff --stat`, czy `base` było aktualne. Rozbieżność raportuję
   głośno, ale **na niej nie blokuję** (to repo ma już dwa wyłączone checki za krzyczenie wilkiem).
2. Merge obu branchy do brancha fazy — **ja**, nie workerzy. Ja też robię commit i PR.
3. **Run log** (`.ai/runs/`), po jednej linii na workera: kto · zadanie · `outcome` · `commit` ·
   `base` · rozbieżności · werdykt bramki · czy został zwolniony. Worker, który wrócił z niczym,
   jest zapisany dokładnie jako to. Dopiero **razem z wpisem** kasuję jego status file — usunięcie
   pliku bez linii w logu jest utraconą deklaracją, nieodróżnialną od pominiętej bramki.
4. **Zwolnienie jest aktem, który potwierdzam**, nie prośbą, którą wysyłam (jeśli tryb teams jest
   włączony). Wyjątek: workera, który milczy, **trzymam** do odzyskania raportu — jego kontekst
   jest jedynym miejscem, gdzie jego ustalenia mogą jeszcze istnieć.
5. **Zbiór wiedzy do `.ai/lessons.md`** (Context / Problem / Rule / Applies-to) — zanim zwolnię
   agenta. Kandydaci z tej fazy: nierozstrzygnięta strefa czasowa granic filtra, brak
   udokumentowanej ścieżki „clean clone → działająca aplikacja", jeśli któryś worktree tego nie
   przeszedł.
6. **`.ai/STATE.md` przed odejściem** — żeby reset kontekstu wznowił fazę bez odtwarzania planu.

## Czego tu nie ma i dlaczego

- **Sub-teamów.** Otwiera je wyłącznie człowiek, a ta faza i tak jest na jeden zespół.
- **Codexa.** Routing do innego runtime'u dzieje się tylko na wyraźne polecenie człowieka.
- **`docs-author`.** Wchodzi przed zamknięciem specu (docs-delta), nie przed zamknięciem fazy 1.
- **Karty wyboru dla człowieka** — poza dwoma miejscami, gdzie należy się z definicji: semantyka
  granic filtra dat, jeśli spec jej nie pinuje (§1.2), i freeze listy przypadków `tester`a (§4.2).
  Te dwa batchuję w jedno okno, jeśli wypadną blisko siebie.
