# Faza 1 — GET /api/orders/export (CSV, filtr po dacie) + testy

**Plan wykonania — dry-run.** Nic nie zostało uruchomione, żaden worker nie został zespawnowany, nie
powstał ani wiersz kodu projektowego. Ten plik jest jedynym zapisem.

Rola: `team-lead`. Data: 2026-07-26. Tryb: planowanie.

---

## 1. Co sytuacja mi mówi — i czego NIE eskaluję

- **Kontrakt BE zamrożony, spec zatwierdzony.** To znaczy, że nie ma tu *key decision* do
  eskalacji. Moja władza kończy się tam, gdzie zamrożenie kontraktu wymagałoby NOWEGO wyboru
  architektonicznego — a tu spec go już rozstrzygnął. Składam i egzekwuję kontrakt: to koordynacja,
  moja robota. Nie zawracam głowy człowiekowi pytaniem, na które spec już odpowiedział.
- **Jeden wyjątek, który trzymam w polu widzenia** — patrz §3: gdyby w trakcie okazało się, że
  wolumen eksportu wywraca synchroniczny streamed download na asynchroniczny job + link, to *jest*
  nowa decyzja architektoniczna i UX-owa, spec jej nie rozstrzygnął → zatrzymuję pipeline,
  eskaluję do człowieka, dopiero potem zamrażam na nowo. Sam tego nie wybieram w połowie biegu.

## 2. Zespół czy solo — i dlaczego to nie jest bliska decyzja

Trzy pliki (route + service + test), nowy endpoint, kontrakt request/response, filtr po dacie z
walidacją i przypadkami brzegowymi. To jest wyraźnie powyżej progu "jedno zdanie i jeden plik".

Argument kosztowy przykładam uczciwie w obie strony, bo on tnie w obie: worker kosztuje spawn,
brief, raport i integrację. Poniżej mniej więcej jednego pliku zmian ten narzut zjada oszczędność i
delegowanie staje się marnotrawstwem przebranym za dyscyplinę. **Tutaj jesteśmy powyżej tego progu —
i to nie jest granica sporna.** Route + service to implementacja przeciw zamrożonemu kontraktowi:
robota do wyklepania, nie do osądu. Dokładnie to, czego opus-tier lead nie ma pisać.

**Nie piszę tego kodu sam.** Mógłbym szybciej — i to jest właśnie ta pokusa, którą ta rola istnieje,
żeby zablokować. Napisanie tego solo zmieniłoby fazę wartą jednego workera Sonnetu w przebieg
kilkukrotnie droższy, przy identycznym diffie, i nikt by tego nie zauważył, bo praca i tak by
wyszła. Zapisuję to tutaj wprost, żeby było widać, że oś została rozważona, a nie pominięta.

**Co robię ja, osobiście** (i to jest cała moja lista): plan, slicing pod rozłączność plików,
wskazanie zamrożonego artefaktu kontraktowego w każdym briefie, izolacja bramek, integracja, merge,
commit, PR, run log, `.ai/lessons.md`, `.ai/STATE.md`. Zero kodu funkcjonalnego.

## 3. Które role biegną, a które odpadają

Pipeline kanoniczny: `explorer → designer → BE contract → fe-dev → tester → checker → qa`.

| Rola | Biegnie? | Dlaczego |
|---|---|---|
| `explorer` | **tak** | Nie znam jeszcze dokładnych ścieżek ani wzorca, który ma naśladować route/service. Brief bez `file:line` to brief zgadywany. Haiku, tanio. |
| `designer` | **nie** | Faza czysto backendowa, zero powierzchni UI. |
| BE contract | **już zamrożony** | Dane wejściowe, nie zadanie. Wskazuję w briefach ścieżkę artefaktu. |
| `be-dev` | **tak** | Route + service. Jedyny worker piszący kod produkcyjny. |
| `fe-dev` | **nie** | Jw. — brak konsumenta frontowego w tej fazie. |
| `tester` | **tak** | Plik testowy. Bramka, która pisze. |
| `checker` | **tak** | Bramka nieopcjonalna. |
| `qa` | **tak** | Bramka nieopcjonalna. Dowód zachowania, nie zielony build. |

**Odpadnięcie `designer`/`fe-dev` jest prowizoryczne, nie ostateczne.** Trigger reinstatement:
jeśli w trakcie ujawni się ograniczenie wydajnościowe wymuszające asynchroniczny eksport z linkiem,
pojawia się nowa powierzchnia UX → wracam do człowieka po decyzję (§1), przywracam `designer`,
zamrażam kontrakt ponownie i dopiero wtedy `fe-dev`. Nie przepycham nowej powierzchni UX bez
przebiegu projektowego tylko dlatego, że pierwotny plan go nie miał.

## 4. Slicing — najważniejszy ruch w tej fazie

Faza nazywa się *"endpoint + jego testy"*, ale **to nie jest jedno zadanie dla jednego workera.**

- `be-dev` pisze **route + service**. Nie dotyka pliku testowego.
- `tester` pisze **plik testowy**, wyprowadzając przypadki ze SPECU **zanim przeczyta
  implementację**. Bariera informacyjna jest tu całym mechanizmem: dev piszący własne testy pisze
  testy, które odbijają jego kod, więc przechodzą i niczego nie wykrywają.
- Rozłączność plików wychodzi z tego sama: dwóch workerów, trzy pliki, zero przecięć.

**Kolejność: sekwencyjna, nie równoległa.** Rozważyłem odpalenie `tester` równolegle z `be-dev` —
kusi, bo derywacja przypadków ze specu jest niezależna od kodu, a bariera byłaby wtedy wymuszona
fizycznie (nie ma czego czytać). Odrzucam: przepływ `tester` ma w środku bramkę ludzką (człowiek
zamraża listę przypadków w `.ai/test-plans/`) i domykający przebieg ADD-only z diffu. Worker
czekałby bezczynnie na człowieka, a potem i tak na diff. Zysk pozorny, dwa punkty zawieszenia realne.

## 5. Tryb delegacji — sprawdzony, nie założony

Sprawdziłem `~/.claude/settings.json` na tej maszynie:

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` — **nieustawiony ⇒ tryb agent-teams WYŁĄCZONY.**
- `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "2"` — zagnieżdżanie dostępne, ale **człowiek nie prosił o
  sub-teamy, więc biegnie jeden zespół.** Szeroki task sam z siebie nie jest powodem do otwarcia
  drugiego.
- Plugin `sailes-app-builder@sailes` włączony ⇒ **role nazwane rozwiązują się**, `general-purpose`
  nie jest potrzebny. Gdyby się nie rozwiązywały, byłoby to ustalenie o maszynie, nie szczegół
  przebiegu — i musiałoby trafić do raportu.

Konsekwencja praktyczna, i to nie kosmetyczna: workerzy to **scoped subagents**. Ich ostatnia
wiadomość wraca automatycznie, a **release JEST zwrotem** — nie ma czego potwierdzać. Cytowanie tu
procedury `shutdown_request` dałoby plan, który czyta się poprawnie i nie da się go wykonać. Linia
`Delivery:` w każdym briefie brzmi więc `[scoped subagent]`, nie `[background teammate]`.

## 6. Routing modeli — łącznie z nie-nadpisaniami

Pomijam parametr `model` **wszędzie**. Pominięcie to sposób na utrzymanie pinu z frontmattera;
przekazanie go wymieniłoby przypięte `claude-sonnet-5` na to, co `sonnet` akurat rozwiązuje.
`effort` traktuję jako frontmatter-only — nie jest zadeklarowanym parametrem narzędzia Agent,
przechodzi bez błędu i bez potwierdzenia, że zadziałał.

| Worker | Tier | Nadpisanie? | Uzasadnienie |
|---|---|---|---|
| `explorer` | `claude-haiku-4-5` (pin) | **nie — default** | Rekonesans trzech plików, nie całego repo. Sufit 200K kontekstu Haiku tu nie uwiera. |
| `be-dev` | `claude-sonnet-5 · high` (pin) | **nie — default** | Rozważyłem eskalację i **odrzuciłem**: trudność jest w klepaniu, nie w osądzie. Kontrakt zamrożony, decyzje podjęte. Sięganie po Opus, bo diff dotyka trzech plików, to ten sam błąd odczytu co pisanie tego samemu — objętość to nie jest powód do eskalacji. |
| `tester` | `claude-sonnet-5 · high` (pin) | **nie — default** | Derywacja przypadków to osąd, ale w skali jednego endpointu; rola jest pod to przypięta. |
| `checker` | `claude-sonnet-5 · high` (pin) | **nie — default** | jw. |
| `qa` | `claude-sonnet-5 · high` (pin) | **nie — default** | Dowód zachowania na żywej aplikacji. |

**Zero nadpisań w tej fazie.** Zapisuję to jawnie, bo log rejestrujący wyłącznie odchylenia nie
pozwala odróżnić fazy, w której oś eskalacji rozważono i odrzucono, od takiej, w której nikt nie
spojrzał. Gdyby eskalacja jednak padła, do logu idzie **alias, który przekazałem**, nie samo słowo
"eskalowano".

## 7. Briefy — pełne, w kolejności dyspozycji

Nazwy typów agentów podaję **dokładnie tak, jak je przekażę** w parametrze `subagent_type`. Na tej
maszynie role są dostarczane przez plugin, więc rozwiązują się pod prefiksem — doktryna nazywa je
`explorer`/`be-dev`/..., ale ciąg, który faktycznie idzie do narzędzia, ma prefiks pluginu.

---

### 7.1 — `subagent_type: "sailes-app-builder:explorer"` (bez `model`, pin: haiku)

```markdown
You are `explorer` on team `orders-export`, under `team-lead`.
Read-only recon. Do not propose code. Do not review quality. Do not edit anything.

Goal:  Map the exact code surface that Faza 1 (GET /api/orders/export) will touch, so the
       implementation brief can name real paths instead of guesses.

Find and report, each with `file:line`:
  1. The route/controller file where a new GET route under /api/orders is registered, and the
     registration pattern used by its siblings (router style, middleware chain, auth guard,
     validation layer).
  2. The orders service file that the route would call, and the shape of an existing
     read/query method there (naming, DI, repository/ORM access, error mapping).
  3. The test file that covers this route module, its framework, and how a sibling endpoint
     test bootstraps the app and seeds fixtures.
  4. The shared contract artifact for this endpoint (TS types / Zod schema / OpenAPI) — exact
     path and the exported symbol names for the query params and the response.
  5. Any EXISTING CSV serialization helper in the repo, and any existing date-range filter
     helper/validator. If none exists, say "none" — do not invent one.
  6. How responses are streamed vs. buffered elsewhere in this codebase, if at all.

Do NOT: suggest an implementation, judge code quality, or read beyond what these six points need.

Deliverable: FILE `.ai/runs/2026-07-26-orders-export/01-explorer-recon.md`.
             No file = task not done.
Report:      Your report IS the deliverable — not a summary for a human, not a status line.
             If you did not finish, say so plainly and list what you did and did not establish.
             If any of the six points has no answer in this repo, write "not found" for it
             rather than filling the gap. Never return empty.
Delivery:    [scoped subagent] your final message is returned automatically — just end with it.
             Also write the file; the file is what I read.
```

---

### 7.2 — `subagent_type: "sailes-app-builder:be-dev"` (bez `model`, pin: sonnet · high)

Ścieżki poniżej w `<...>` wypełniam z raportu `explorer` **przed** spawnem — worker nie dostaje
nawiasów, dostaje ścieżki. To jest cały powód, dla którego `explorer` biegnie pierwszy.

```markdown
You are `be-dev` on team `orders-export`, under `team-lead`.
Branch `feat/orders-csv-export` is already checked out. Do not switch branches.
Do not commit. Do not push. Do not open a PR.

Task:  Faza 1, Task #1 — implement GET /api/orders/export (CSV, date filter).

Goal:  One endpoint that returns the orders matching a date range as CSV, implemented against
       the FROZEN contract, with the query logic in the service and nothing but wiring in the
       route.

Files (edit ONLY these two):
  - <route file from recon §1>
  - <orders service file from recon §2>

DO NOT TOUCH <test file from recon §3>. The test suite for this phase is authored by a separate
`tester` role that must derive its cases from the spec without reading your implementation. A
test you write yourself mirrors your code and proves nothing. If you believe a case is missing,
name it in your report — do not write it.

Contract: FROZEN. Source of truth is <contract artifact path from recon §4>, symbols
       <QueryParamsSymbol> / <ResponseSymbol>. Import it — do not restate the shape inline and
       do not widen it. Prose here describes intent; the artifact is the truth. If the artifact
       and this brief disagree, the artifact wins and you report the discrepancy rather than
       resolving it yourself.
       - Method/path: GET /api/orders/export
       - Query params: the date-range params exactly as typed in the artifact.
       - Success: 200, `Content-Type: text/csv`, header row then data rows, column order
         exactly as the spec fixes it.
       - Errors: map to the codebase's existing error-mapping layer (recon §2) — do not
         introduce a new error shape.

Constraints: the toolchain is the constraint (lint/types/convention tests enforce no-any,
       import direction, formatting). Listed here is ONLY what it cannot see:
       - Public contract stays backward compatible; you are ADDING a route, not changing one.
       - No new dependency without escalating to me first. If the repo has no CSV helper
         (recon §5 said "none"), write a small local serializer that correctly escapes
         delimiters, quotes and newlines — do not pull in a library on your own authority.
       - Auth/tenancy: the new route inherits the same guard as its siblings. If orders are
         tenant-scoped, the query MUST be scoped the same way the sibling read path is. If you
         cannot tell from the code whether it is scoped, STOP and escalate to me — do not guess
         on a tenancy boundary.
       - No destructive commands. No schema/migration changes in this task.
       - Scope is these two files and this one endpoint. Anything else you notice goes in the
         report, not in the diff.

Reference: imitate <sibling endpoint from recon §1/§2> — same router registration, same
       validation layer, same service method shape, same error mapping.

Verification: run and paste the raw output of:
       - the repo's lint command
       - the repo's typecheck command
       - the repo's existing test suite (it must stay green; you are not adding tests)
       Plus one manual proof: call the endpoint against the running app with a date range and
       paste the first three lines of the CSV, including the header row.

Report:  per-file diff summary · raw command output · the exact contract shape you implemented
       against · every blocker, deviation and thing you noticed but left alone.
       Your REPORT IS the deliverable — not a summary for a human, not a status line. If you
       did not finish, say so plainly and list what you did and did not establish. Never
       return empty.
Deliverable: FILE `.ai/runs/2026-07-26-orders-export/02-be-dev-report.md` in addition to the
       code. No file = task not done.
Delivery: [scoped subagent] your final message is returned automatically — just end with it.
```

---

### 7.3 — `subagent_type: "sailes-app-builder:tester"` (bez `model`, pin: sonnet · high)

Spawnowany po integracji diffu `be-dev`. Brief prowadzi go przez `sailes-test`: derywacja ze specu
z nieprzeczytanym kodem → zamrożenie listy przez człowieka → dopiero pisanie.

```markdown
You are `tester` on team `orders-export`, under `team-lead`.
Branch `feat/orders-csv-export` is already checked out. Do not switch branches.
Do not commit. Do not push.

Task: author the Faza 1 suite for GET /api/orders/export, via `sailes-test`.

STEP 1 — derive with the implementation UNREAD. Do not open <route file> or <service file>
       yet. From the spec and the contract artifact <path> alone, derive the expected-behavior
       case list: happy path, date-range boundaries (inclusive/exclusive ends, single-day
       range, inverted range, missing params, malformed dates, timezone handling), empty
       result set, CSV escaping (delimiter/quote/newline inside a field), header row and
       column order, content-type, and — if orders are tenant-scoped — cross-tenant leakage.
       Write the list to `.ai/test-plans/orders-export.md`.

STEP 2 — FREEZE. The human approves that list before you write a single test. Stop and
       surface it. Do not proceed on your own judgment.

STEP 3 — write the suite in <test file> ONLY. Do not edit the route or the service. If a test
       cannot pass without a production change, that is a finding you report — not a change
       you make.

STEP 4 — ADD-only pass from the diff. Now read the implementation. You may ADD cases it
       revealed. You may NOT weaken, delete or loosen a frozen assertion, and you may not
       lower your own risk tier.

Verification: the suite runs green against the implementation; then paste the detection proof —
       for the highest-risk assertions, show that each FAILS when the behavior is deliberately
       broken. A suite that has never failed has never been shown to measure anything.

Deliverable: FILE `.ai/test-plans/orders-export.md` (case list, frozen) + the test file.
       No file = task not done.
Report:  the frozen case list · which cases came from the spec vs. the ADD-only pass · raw test
       output · the detection proof · anything the implementation does that the spec does not
       cover. Your REPORT IS the deliverable. If you did not finish, say so plainly and list
       what you did and did not establish. Never return empty.
Delivery: [scoped subagent] your final message is returned automatically — just end with it.
```

---

### 7.4 — `subagent_type: "sailes-app-builder:checker"` (bez `model`, pin: sonnet · high)

**Izolacja bramki.** `checker` dostaje **wyłącznie**: diff, spec + artefakt kontraktu, checklistę.
**Nie przekazuję mu raportu `be-dev` ani `tester`.** Ich nararcja jest wejściem do mojej integracji,
nie do recenzji — recenzent, który wchłonie pewność autora, ocenia opowieść zamiast artefaktu.

```markdown
You are `checker` on team `orders-export`. Independent review. Read-only: do not edit code.

Input: the diff on branch `feat/orders-csv-export`, the spec section for Faza 1, and the
contract artifact <path>. That is everything you get, by design.

Verdict: APPROVE / NITS / CHANGES-REQUIRED, with each finding tied to a `file:line`.

Grade the artifact, not the reasoning. Do not re-check what the toolchain already enforces
(no-any, import direction, formatting, lint) — spend your capacity on what a machine cannot
see: does the diff match the spec; is the frozen contract honored exactly or quietly widened;
date-range boundary and timezone correctness; CSV escaping of delimiters/quotes/newlines;
tenancy scoping on the query if orders are tenant-scoped; error mapping consistent with
siblings; naming; scope creep beyond the two files.

You may run lint/typecheck/tests to confirm the machine's guarantees hold. Do not modify the
code you are grading.

Deliverable: FILE `.ai/runs/2026-07-26-orders-export/03-checker-verdict.md`, with the verdict
on the first line and the raw output of any command you ran pasted in.
No file = task not done.
Report:  Your report IS the deliverable. If you could not complete the review, say so plainly
and list what you did and did not establish. Never return empty.
Delivery: [scoped subagent] your final message is returned automatically — just end with it.
```

---

### 7.5 — `subagent_type: "sailes-app-builder:qa"` (bez `model`, pin: sonnet · high)

`qa` dostaje **wyłącznie**: działającą aplikację, oczekiwane zachowanie ze specu i suite od
`tester`. Bez historii implementacji, bez "co teraz powinno działać".

```markdown
You are `qa` on team `orders-export`. Final gate. Behavior before diff.

Input: the running app, the spec's expected behavior for Faza 1, and the suite at <test file>.

Prove, on the live system:
  1. Run the `tester` suite against the running app; paste raw output. That result is part of
     the gate verdict, not a formality.
  2. Drive the real flow: call GET /api/orders/export with a real date range against seeded
     data. Paste the response headers and the first rows of the CSV.
  3. Prove the filter actually filters — a range that excludes known rows must exclude them.
     An endpoint that returns everything regardless of the dates passes a naive smoke test.
  4. Prove one malformed-input case returns the spec'd error rather than a 500.

No UI in this phase, so no vision-verify and no `.ai/screens/` baseline update.

If the stack will not boot, or creds/fixtures are missing, report `ENV-DEFECT` naming exactly
what is missing and stop. That is a bootstrap defect for me to escalate — never fake or skip a
pass to work around a broken environment.

Deliverable: FILE `.ai/runs/2026-07-26-orders-export/04-qa-proof.md` — verdict on line one,
raw command/response output pasted in, not paraphrased. No file = task not done.
Report:  Your report IS the deliverable. If you did not finish, say so plainly and list what
you did and did not establish. Never return empty.
Delivery: [scoped subagent] your final message is returned automatically — just end with it.
```

---

## 8. Cykl życia i pułapka ciszy

- Spawn dopiero wtedy, gdy zadanie workera jest faktycznie gotowe. `tester` nie rusza przed
  diffem, `qa` nie rusza przed werdyktem `checker`.
- **Release = zwrot** (tryb scoped subagent, §5). Nie ma `shutdown_request` do potwierdzania.
- CHANGES-REQUIRED → **świeży** `be-dev`, nie ten sam z obciążonym kontekstem, z briefem zawężonym
  do wypunktowanych ustaleń. Do logu wchodzi pętla, nie tylko wynik końcowy.
- **Pusty zwrot to nie ukończenie i nie ustalenie "nic nie znaleziono".** Dopytuję raz, jawnie.
  Nadal pusto → eskaluję do człowieka nazywając delegację, która nic nie dała. Nie re-spawnuję na
  wyczucie i nie zasypuję dziury pisząc kod sam. Nie zakładam też niedbalstwa: cisza ma dwie
  przyczyny o identycznym wyglądzie — worker nie skończył, albo kanał zgubił raport, który
  powstał. Dlatego **każdy brief nazywa PLIK**, a ja czytam go z dysku zamiast czekać na wiadomość.
- "Agent nie znalazł problemów" wypowiem wyłącznie wtedy, gdy agent to faktycznie powiedział.

## 9. Run log — szkielet, który wypełniam w trakcie

| # | Rola (typ przekazany) | Tier | Zadanie | Zwrot | Werdykt | Released |
|---|---|---|---|---|---|---|
| 1 | `sailes-app-builder:explorer` | haiku (default) | recon | | | |
| 2 | `sailes-app-builder:be-dev` | sonnet · high (default) | route + service | | | |
| 3 | `sailes-app-builder:tester` | sonnet · high (default) | suite + case freeze | | | |
| 4 | `sailes-app-builder:checker` | sonnet · high (default) | review | | | |
| 5 | `sailes-app-builder:qa` | sonnet · high (default) | behavior proof | | | |

Pusty zwrot wpisuję jako pusty zwrot. Ukrycie go jest sposobem, w jaki ta sama awaria powtarza się
w kolejnej sesji.

**Przed zwolnieniem każdego workera** zbieram to, na co realnie wpadł — błędne założenie w moim
briefie, kontrakt, który nie trzymał, narzędzie, które padło po cichu — i lądem tego jest
`.ai/lessons.md` (Context / Problem / Rule / Applies-to), a delegacji `.ai/runs/`. Kolejka
wiadomości nie przeżywa resetu kontekstu; dysk przeżywa.

Po bramkach: merge, commit i PR robię ja. Żaden worker nie commituje. `.ai/STATE.md` aktualizuję
zanim odejdę od klawiatury — przed, nie po.

## 10. Definicja "gotowe" dla tej fazy

Nie "build jest zielony". **Gotowe = działający system został zaobserwowany, jak robi tę rzecz** —
werdykt `qa` z wklejonym surowym outputem, przy zaliczonym `checker`, na suicie od `tester`, która
udowodniła, że potrafi zgasnąć.
