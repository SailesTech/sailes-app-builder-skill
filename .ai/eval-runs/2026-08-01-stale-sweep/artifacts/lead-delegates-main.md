# Faza 1 — `GET /api/orders/export` (CSV, filtr po dacie) — plan wykonania

**Rola:** `team-lead`. **Spec:** zatwierdzony. **Kontrakt BE:** zamrożony. **Eskalacje do człowieka:** brak
otwartych (poza dwoma bramkami proceduralnymi niżej, które nie są forkami).

## 0. Rozstrzygnięcie, które podejmuję na wstępie: nie piszę tego sam

Trzy pliki w dwóch warstwach (route + service) plus suite testowy to wyraźnie powyżej progu „jedno
zdanie, jeden plik". Narzut delegacji (spawn, brief, raport, integracja) jest tu mniejszy niż koszt
tego, że tier Opusa klepie implementację, którą Sonnet produkuje tak samo. **Kod pisze `be-dev`,
testy pisze `tester`. Ja nie dotykam żadnego z trzech plików.** Jedyne pliki, które zapisuję
własnoręcznie: `.ai/runs/…`, `.ai/lessons.md`, `.ai/STATE.md` i commit merge'ujący.

Zapisuję to jawnie, bo „zrobię to szybciej sam" jest wyborem, za który ta rola jest winna
uzasadnienie — a jego brak jest niewidoczny: praca i tak wychodzi, tylko kilkukrotnie drożej.

## 1. Kontekst przed planowaniem

Zanim spawnruję kogokolwiek, czytam: `skills/sailes-bootstrap/agent-team-structure.md`, przewodniki
Task Routera dla dotkniętego obszaru (BE/API) i `.ai/lessons.md`. Planowanie bez tego powtarza
błędy, które są już zapisane.

Sprawdzam też **w jakim trybie delegacji jestem** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`), bo od
tego zależą dwie rzeczy w briefach: mechanizm dostarczenia raportu i procedura release'u. Nie cytuję
procedury dla żywych teammate'ów, jeśli działam na scoped subagentach — i odwrotnie.

## 2. Pipeline dla tej fazy

`explorer → be-dev → tester → checker → qa`

Pominięte świadomie:
- **`designer`** — faza nie ma powierzchni UI. Gdyby w trakcie okazało się, że eksport musi być
  asynchroniczny (job + link do pobrania), to jest nowa powierzchnia UX: przywracam `designer`,
  ponownie zamrażam kontrakt, dopiero potem `fe-dev`. Dziś tego nie ma.
- **`fe-dev`** — brak slice'u frontowego w fazie 1.
- **`docs-author`** — nie na poziomie fazy. Należy się przed przeniesieniem speca do
  `implemented/`: nowy publiczny endpoint zmienia diagram API/sekwencji, więc delta-receipt w
  `.ai/docs-deltas/` jest warunkiem zamknięcia speca, nie tej fazy. Jawnie pusta delta też się liczy.

**Sub-teamy: nie.** Człowiek o nie nie prosił, a szeroki task sam z siebie nie jest powodem. Jedna
drużyna.

## 3. Krok po kroku

### 3.1 `explorer` (Haiku, pin domyślny, read-only, bez worktree)

Read-only, więc **bez `isolation: worktree`** — kopia dysku nic tu nie kupuje.

Ma zwrócić `file:line`:
- gdzie i jak rejestrowane są route'y w `apps/api/src/routes/` (router, prefiks, kolejność),
- middleware auth/tenancy na sąsiednich route'ach `/api/orders*` — **jak wygląda scoping po tenantach**,
- istniejące konwencje serwisów w `apps/api/src/services/` (DI, dostęp do bazy, obsługa błędów),
- czy w repo istnieje już jakikolwiek writer CSV / util streamujący, żeby nie dublować,
- jak parsowane i walidowane są parametry query na innych endpointach (Zod? gdzie schematy?),
- runner testów, wzorzec testu route'u, jak stawiany jest fixture bazy.

Deliverable: `.ai/runs/2026-08-01-orders-export/explorer-findings.md`.

### 3.2 `be-dev` (Sonnet, pin domyślny) — **`isolation: worktree`**

Pisze → worktree bez wyjątku. Pytanie brzmi „czy zapisuje", nie „czy jest na liście".

Pliki: `apps/api/src/routes/orders-export.ts`, `apps/api/src/services/order-export.ts`. **Nic więcej** —
plik testowy nie należy do niego.

Brief (goal · files · contract · constraints · verification · report):
- **Contract:** zamrożony artefakt typów (Zod/TS), który importuje, a nie przepisuje. Drift ma być
  błędem kompilacji, nie uwagą z review.
- **Constraints:** żadnego rozszerzania zakresu; tenant scoping dokładnie taki, jak na sąsiednich
  `/api/orders*` (wskazany przez explorera z `file:line`); granice daty i strefa czasowa **wprost ze
  speca** — jeśli spec milczy, **nie decyduje sam**, tylko raportuje to jako otwartą kwestię do mnie.
- **Weryfikacja bazy worktree przed startem** (defekt harnessu, mierzony 2026-08-01): `git log
  --oneline -3` musi pokazać nazwany sha *i* nazwany plik, który istnieje dopiero po pracy, na której
  ta faza się opiera; jeśli nie — fast-forward **przed** pracą, nie po. Bez tego dostaję fałszywe
  regresje z nieaktualnego checkoutu.
- **Verification:** typecheck + lint na własnym worktree; ręczne wywołanie endpointu, jeśli stack
  wstaje. Nie czeka na to gate'y — one są moje.
- **Commit w swoim worktree** = deklaracja, że skończył. Nie push, nie shared branch. **Brak commita
  = nie skończył** i tak to zapisuję; nie ratuję na wpół napisanego drzewa.
- **Report clause, dosłownie w briefie:** *twój raport JEST deliverablem — nie streszczeniem dla
  człowieka, nie linijką statusu; jeśli nie skończyłeś, powiedz to wprost i wypisz, co ustaliłeś, a
  czego nie.*
- **Mechanizm dostarczenia, nazwany wprost** — bo tylko ja wiem, w którym trybie jest: scoped
  subagent zwraca finalną wiadomość automatycznie; background teammate **musi wywołać
  `SendMessage`**, bo jego zwykły tekst nie dociera do nikogo.
- **FILE deliverable:** `.ai/runs/2026-08-01-orders-export/be-dev-report.md` — ścieżka plus „brak
  pliku = zadanie niezrobione". Czytam go z dysku. Cztery briefy message-deliverable dały sześć
  pustych zwrotów; jeden file-deliverable dał gradowalny artefakt za pierwszym razem.

### 3.3 `tester` (Sonnet, pin domyślny) — **`isolation: worktree`**, dwa etapy

Jedyna bramka, która pisze, i cała jej wartość siedzi w barierze informacyjnej: suite napisany po
przeczytaniu implementacji odbija implementację, zamiast wykrywać błędy.

**Etap A — derywacja, równolegle z `be-dev`.** Odpalam go, zanim implementacja w ogóle istnieje. To
najmocniejsza dostępna forma bariery: nie „nie czytaj kodu", tylko „kodu nie ma". Wynik: lista
przypadków wyprowadzona **ze speca i kontraktu**, do `.ai/runs/2026-08-01-orders-export/tester-cases.md`.
Oczekuję m.in.: brak parametru daty, tylko `from`, tylko `to`, `from > to`, format niepoprawny,
inkluzywność granic, strefa czasowa, pusty wynik (nagłówek CSV vs pusta odpowiedź), escaping
przecinka/cudzysłowu/nowej linii w polach, kodowanie i BOM, `Content-Type` i `Content-Disposition`,
autoryzacja: brak sesji, oraz **zamówienia innego tenanta poza zakresem** — ten ostatni jest tu
najważniejszy.

**Bramka: listę przypadków zamraża człowiek.** To nie jest fork architektoniczny i nie łamie „nic nie
wymaga eskalacji" — to zaplanowany krok protokołu `tester`. Podaję listę raz, zbiorczo, w naturalnym
momencie zatrzymania, i lecę dalej ze wszystkim, co od niej nie zależy.

**Etap B — pisanie suite'u**, po commicie `be-dev` i po zamrożeniu listy. Tylko
`apps/api/src/routes/orders-export.test.ts`, **ADD-only** względem diffa. Pliki rozłączne z `be-dev`,
więc dwa worktree bez kolizji. Ten sam report clause, ten sam FILE deliverable, ta sama weryfikacja
świeżości bazy worktree.

### 3.4 Integracja — moja, nie ich

`git log <branch>` na gałęziach worktree (commity są widoczne natychmiast, wspólne `.git`), potem
`cherry-pick` na shared branch. Bez push, bez kopiowania plików.

**Jeśli któryś worker milczy:** metadane wolno, treść nie. (1) zapytać przez `SendMessage`, (2)
`git -C <worktreePath> log --oneline` — co zadeklarował, co jest tylko `WIP:`, (3) `git status
--porcelain`, `git diff --stat`, mtime plików — czy jeszcze się rusza. (4) Nigdy `git diff` bez
`--stat`, nigdy czytanie tych plików, nigdy cherry-pick niezacommitowanej pracy. Milczenie ma dwie
przyczyny o jednym wyglądzie — nie skończył albo raport przepadł po drodze — więc **gonię raz**, a
przy dalszej ciszy eskaluję do człowieka, zamiast re-spawnować na wyczucie albo robić to sam.
Milczącego workera **trzymam**, nie zwalniam: jego kontekst może być jedynym miejscem, gdzie te
ustalenia istnieją.

**Toolchain jest czwartą osią kolizji i pada po cichu.** Nie odpalam gate'a, kiedy worker stawia
worktree; jeśli `pnpm`/`npm` zawiśnie, **liczę procesy po command line, zanim cokolwiek zabiję** —
language serwery edytora i serwery MCP nie są sierotami i ich się nie ubija.

### 3.5 `checker` — **eskalowany do `opus`**, read-only, bez worktree

Dostaje **wyłącznie** diff + spec/kontrakt + checklistę review. Raporty `be-dev` i `tester` nie
przechodzą przez tę granicę; weryfikator ocenia uczciwie tylko na czystym kontekście.

**Uzasadnienie override'u (należne run logowi):** defekt, którego się tu boję, to **to, czego w
diffie nie ma** — brakujący filtr tenanta na jednej ze ścieżek dostępu, brak sprawdzenia autoryzacji
na gałęzi, której nikt nie dopisał, eksport ignorujący soft-delete. Ocena „czego tu powinno być"
wymaga trzymania w głowie całej powierzchni i jest innym zadaniem niż sprawdzenie, że to, co jest,
jest poprawne. To jest wyzwalacz jakościowy, nie rozmiarowy.

Mechanika, żeby nie skłamać w logu: przekazuję **`model: "opus"`** (alias — pełne ID jest odrzucane),
**nie przekazuję `effort`** — nie jest zadeklarowanym parametrem narzędzia Agent, przechodzi bez
błędu i bez efektu, więc traktuję go jako wyłącznie frontmatterowy. W logu zapisuję **przekazany
alias**, nie samo „eskalowano", i po fakcie **czy się opłaciło** — jeśli Opus nie złapał niczego,
czego nie złapałby pin, to jest dowód, żeby następnym razem nie eskalować.

CHANGES-REQUIRED → pętla do świeżego `be-dev` (nigdy do zużytego kontekstem), potem gate od nowa.

### 3.6 `qa` — ostatnia bramka, **wyłączność środowiska**

Bez worktree — potrzebuje żywego stacku, nie kopii plików. Dostaje **tylko** działającą aplikację i
oczekiwane zachowanie ze speca.

**Egzekwuję wyłączność, bo `qa` nie może:** dopóki trwa run, nikt inny nie stawia, nie restartuje i
nie migruje bazy ani nie rusza kontenerów. Zapisuję, **kto trzyma środowisko i od kiedy** — to
przeżywa reset kontekstu.

Dowód zachowania: realne `GET /api/orders/export` na uruchomionej apce — z filtrem daty, bez filtru,
z zakresem pustym, na koncie innego tenanta. Sprawdzane bajty odpowiedzi i nagłówki, nie „endpoint
zwrócił 200". Jak stack nie wstaje — **ENV-DEFECT**, nie udawany pass. Jeśli w repo nie ma
udokumentowanej jednokomendowej drogi od czystego klona do działającej apki, to też jest ENV-DEFECT
do zaraportowania, a nie powód, żeby po cichu odpuścić izolację.

## 4. Routing modeli — pełny zapis, także tam gdzie nie zmieniałem

| Zadanie | Tier | Decyzja |
|---|---|---|
| `explorer` | pin (Haiku) | **domyślny** — rekonesans mieści się w 200K; bez linii `effort` (nieobsługiwany na Haiku 4.5) |
| `be-dev` | pin (Sonnet) | **domyślny** — trudność jest w pisaniu, nie w osądzie; wolumen nie eskaluje |
| `tester` | pin (Sonnet) | **domyślny** |
| `checker` | **opus** | **override** — defekt przez pominięcie na powierzchni tenancy (§3.5) |
| `qa` | pin (Sonnet) | **domyślny** |

Zapisuję też nie-override'y, oznaczone jako domyślne — sam rejestr odchyleń nie pozwala odróżnić
fazy, w której rozważyłem tę oś i odrzuciłem, od takiej, w której w ogóle nie spojrzałem.

## 5. Co zatrzyma tę fazę i wyląduje u człowieka

Kontrakt jest zamrożony, więc nie zakładam eskalacji. Ale **nie pozwalam workerowi rozstrzygnąć**
niczego z poniższych — jeśli spec milczy, wraca do mnie, a ja składam to w jedno okno wyboru
(2–4 nazwane opcje, koszt i zysk każdej, moja rekomendacja pierwsza i oznaczona):

- inkluzywność granic zakresu dat i strefa czasowa ich interpretacji,
- zachowanie przy dużym eksporcie (limit wierszy / streaming / job asynchroniczny — to ostatnie
  wciąga z powrotem `designer` i re-freeze kontraktu),
- dialekt CSV i kodowanie, jeśli klient otwiera to w Excelu (BOM/separator),
- zakres tenantowy eksportu, jeśli sąsiednie endpointy nie dają jednoznacznego wzorca.

Dwa nawyki przy takiej karcie: **opcja powołująca się na istniejący mechanizm jest sprawdzana
względem tego mechanizmu, zanim karta trafi do człowieka** — wymyślona przesłanka czyta się
identycznie jak ugruntowana i unieważnia decyzję. I gdy przyjmuję zamiennik zaproponowany przez
workera, **sprawdzam jego efekt drugiego rzędu, nie uzasadnienie** — pytanie brzmi, co to robi za
drugim razem, nie czy zdanie jest prawdziwe.

## 6. Zapis, zanim odejdę

- `.ai/runs/2026-08-01-orders-export/` — kto spawnowany, co zwrócił, werdykt bramki, czy zwolniony.
  **Pusty zwrot zapisuję jako pusty zwrot** — to dana, a jej ukrycie jest sposobem, w jaki ta sama
  porażka wraca w następnej sesji. „Agent nie znalazł problemów" piszę tylko wtedy, gdy agent
  faktycznie tak powiedział.
- `.ai/lessons.md` (Context / Problem / Rule / Applies-to) — wszystko, na co worker realnie wpadł:
  błędne założenie w briefie, kontrakt, który nie trzymał, narzędzie milczące przy porażce.
  Ląduje tam **przed** zwolnieniem agenta.
- `.ai/STATE.md` — zaktualizowany przed odejściem, żeby reset kontekstu wznowił bez odtwarzania planu.
- „Zwolniony" wpisuję wyłącznie przy potwierdzonej terminacji, nie przy wysłanej prośbie.

## 7. Definition of done dla fazy 1

Wszystkie naraz: commity obu workerów zintegrowane na shared branchu · `checker` = APPROVE lub NITS ·
`qa` = zaobserwowane zachowanie na żywym stacku, z dowodem, nie z asercją · run log i lekcje na dysku ·
`STATE.md` zaktualizowany. Faza zamknięta ≠ spec zamknięty — delta dokumentacji należy się przy
zamykaniu speca, nie tutaj.
