# Spec: koszt uruchomienia frameworka — tokeny, nie proza

Status: in-progress — 2026-09-12, start P0 (run log `.ai/runs/2026-09-12-token-cost.md`). Zatwierdzony 2026-09-12 przez właściciela, razem z progami z pomiaru (pamięć 20/40 KB, `autoCompactWindow` 400 k, `maxTurns` per rola). Pre-implement 2026-09-12: READY-WITH-FIXES (`.ai/audits/2026-09-12-pre-implement-token-cost.md`); poprawki i decyzje F1–F4 wpisane w fazy. Następny krok: `sailes-implement`, od P0
Framework-Version target: 1.33.0
Weight: contract fix × 4 powierzchnie — hook `session-start`, doktryna lidera, brief workera, Upgrade
        mode. Nie rusza modelu danych ani żadnego kontraktu API; zmienia to, co każda sesja w każdym
        repo klienta ładuje do kontekstu.
Source: raport klienta `partner-portal-v3/.ai/2026-09-12-raport-ulepszenie-skilla.md` (wersja z 3b/3c)
        + zdanie właściciela 2026-09-12: *„największym problemem obecnego harnessu jest koszmarna
        nieefektywność i przepalanie tokenów"*.
Related: `.ai/specs/2026-08-06-spec-carries-the-execution-plan.md` (lider przestaje wykonywać —
        pokrywa się z P2 niżej, patrz Non-goals).

## TLDR

Dwa dni pracy na `partner-portal-v3` (11–12.09) zużyły **ok. 2,0 mld tokenów kontekstu**. Raport
szuka przyczyny w prozie zapisywanej do `.ai/`; pomiar transkryptów pokazuje, że proza jest skutkiem,
a koszt robią trzy mechanizmy: **kontekst lidera rośnie do 600–900 tys. i nigdy się nie resetuje**,
**pamięć projektu (`STATE.md` 243 KB, `lessons.md` 194 KB) nie ma limitu, więc przy starcie jest
jednocześnie ucięta i droga**, a **10% workerów zjada połowę budżetu subagentów** bez limitu tur. Ten
spec tnie te trzy i domyka czwartą rzecz, która zanieczyszcza pomiar: 76% spawnów szło po
przestarzałych rolach.

Poprawki jakości z raportu (sonda kontraktu, brama z listy plików, czerwień z nazwami, test prozy)
idą do specu 2 — decyzja właściciela 2026-09-12.

## Pomiar, na którym stoi spec

Źródło: `~/.claude/projects/-home-charlie-Work-partner-portal-v3/**/*.jsonl`, mtime ≥ 2026-09-11,
166 transkryptów. Tokeny kontekstu = `input + cache_creation + cache_read` na wywołanie, deduplikowane
po `message.id`.

| | Lider (6 sesji) | Subagenci (160) |
|---|---|---|
| Tokeny kontekstu łącznie | **706 M** | **1 297 M** |
| Tury — p50 / max | 367 / 560 | 41 / 431 |
| Kontekst w 1. turze — p50 | **69 k** (p90 89 k) | 31 k |
| Szczyt kontekstu — p50 / max | **627 k / 933 k** | 136 k / 542 k |
| Top 10% transkryptów niesie | 43% | **52%** |

- **Jedna sesja lidera = 305 M** (560 tur, szczyt 933 k) — 15% całości.
- Lider wykonał **1 091 wywołań `Bash` sam**, przy 177 spawnach.
- **Pamięć przy starcie.** `session-start.sh` (szablon `skills/sailes-bootstrap/hooks-template/session-start.sh:6`,
  klient `:15`) robi `cat` całego `STATE.md`. Harness **nie wstrzykuje** dużego wyjścia, tylko zapisuje
  je do pliku i daje podgląd ze ścieżką. Zmierzone: 30 transkryptów z komunikatem „Output too large
  (210KB). Full output saved to…" (także przy 30 KB i 32 KB) i pliki `tool-results/hook-*-stdout.txt`
  do 238 766 B; lider czytał je potem narzędziem `Read`. Czyli mechanizm pamięci **dostarcza ucięty
  podgląd**, a pełna treść kosztuje osobny odczyt ~60 k tokenów. **Framework nie ma żadnej reguły o
  rozmiarze ani rotacji plików pamięci.**
- **Kształt pamięci u klienta nie jest kształtem z szablonu.** `partner-portal-v3/.ai/STATE.md` to stos
  datowanych bloków `#`, najnowszy na górze; nagłówki „Verified facts" i „Open failure" powtarzają się w
  kilku blokach, część bloków sama ogłasza się `NIEAKTUALNY`. `lessons.md` (194 KB) ma 8 linii `Applies-to`.
- `CLAUDE.md` (a więc `@AGENTS.md` klienta, 36 KB) ładuje się do **każdego** subagenta poza `Explore`
  i `Plan` (docs: sub-agents) — to część bazowych 31 k workera.
- Spawny: **135 z 177 po nazwach bez prefiksu** (`be-dev` 50, `explorer` 45, `be-checker` 15, `qa` 13,
  `fe-dev` 6, `designer` 3, `tester` 3) — czyli po plikach z banerem `SUPERSEDED` z 2026-09-10.
- Twierdzenie raportu 3.8 („raporty implementerów to główne źródło prozy") **nie potwierdza się**:
  po nazwach plików w `.ai/runs/` — dokumenty zlecone przez lidera ≈ 18,5 tys. linii (82 pliki),
  bramki ≈ 3,1 tys., implementerzy ≈ 1,9 tys. Heurystyka po nazwie pliku, więc przybliżona.

**Najdłuższe przebiegi workerów — 16 transkryptów = 53% tokenów subagentów:**

| Tokeny | Tury / min | Zadanie | Co zjadło tury |
|---|---|---|---|
| 135 M | 431 / 61 | be-dev „Cięcie envów" | **brief dał cztery fazy naraz** („Fazy 1, 2, 3 i 4 — w tej kolejności"); 116 uruchomień testów, pełny `yarn test` 7× |
| 86 M | 257 / 109 | be-dev ZipTransfers Faza 0 | jedna faza, ale 97 uruchomień testów, ten sam `test:e2e` 7× |
| 65 M | 262 / 31 | be-dev naprawy autoryzacji | **brief dał cztery niezależne luki naraz** |
| 60 M | 278 / 51 | qa świeże środowisko | 139 testów + 28 docker/db; 13 dopisań do raportu |
| 46 M | 216 / 29 | fe-dev ekran resetu | 3× odmowa zapisu poza worktree (pod-repozytoria, raport 3.6) |

- **„Jedno zadanie na workera" istnieje** (`agent-team-structure.md:171`, `team-lead.md:69`), **ale „zadanie" nie
  jest zdefiniowane** — cztery fazy przeszły jako jedno.
- **Pętla wewnętrzna nie mówi, co uruchamiać** (`sailes-implement/SKILL.md:40` — tylko „seconds to run");
  workerzy puszczali pełny zestaw i e2e w pętli. Brief tego nie nakazywał.
- Tarcie środowiska kosztuje tury: odmowy zapisu poza worktree, zablokowane `sleep`, odmowy uprawnień,
  błędy hooka `PreToolUse`.
- Z pomiaru **nie da się** rozdzielić tur potrzebnych od zbędnych dokładniej niż na przykładach wyżej.

**Czego pomiar NIE ustala:** kosztu w pieniądzach; ile z 706 M lidera to praca, której nie dało się
delegować; ile pierwszej tury lidera to prompt systemowy, a ile `AGENTS.md` i podgląd hooka. Zmierzony
jest jeden klient i dwa dni.

## Fakty o harnessie, na których stoją opcje (docs Claude Code, sprawdzone 2026-09-12, instalacja 2.1.266)

- `maxTurns` we frontmatterze subagenta — **udokumentowany, także w pluginie** (plugin nie obsługuje
  tylko `hooks`, `mcpServers`, `permissionMode`): po limicie wynik oznaczony jako częściowy, można
  wznowić; oznaczenie wymaga ≥ 2.1.246. **Brak** udokumentowanego limitu tokenów. (`sub-agents.md`)
- **Brak** zdarzenia hooka ani pola, które wystawia rozmiar kontekstu; istnieją `PreCompact` /
  `PostCompact`. Budżet kontekstu lidera nie może być wymuszony hookiem progowym. (`hooks.md`)
- `autoCompactWindow` — **udokumentowany w każdym pliku ustawień, także projektowym**
  (`settings-reference.md`: „Scope: Any file", 100 000–1 000 000 tokenów, domyślnie nieustawiony;
  `--autocompact` i `CLAUDE_CODE_AUTO_COMPACT_WINDOW` mają pierwszeństwo).
- **Limit wyjścia `SessionStart` — dokumentacja milczy**; pomiar wyżej pokazuje zamianę na plik już
  przy 30 KB. Próg 10 000 znaków nie ma cytatu — 9 500 jest bezpieczną stroną, nie zmierzoną granicą.
- `SessionStart` odpala na `startup|resume|clear|compact|fork`, **nie** dla subagentów (te mają
  `SubagentStart`). (`hooks.md`)
- **Model nie wykonuje `/clear` sam** — komendy wbudowane uruchamia człowiek (w tej sesji narzędzie
  Skill wprost je wyklucza). Przekazanie sesji wymaga jednego ruchu człowieka.
- Spawn po nazwie roli da się zablokować przez `permissions.deny` z `Agent(<typ>)` (`permissions.md`).
  Rola pluginu rejestruje się jako `sailes-app-builder:<nazwa>` (`sub-agents.md`). **Czy `Agent(be-dev)`
  dopasowuje także `sailes-app-builder:be-dev` — NIE UDOKUMENTOWANE**; P4 stoi wyłącznie na
  sprawdzeniu na żywo.
- Transkrypty sprząta domyślny `cleanupPeriodDays` (tu nieustawiony; najstarszy transkrypt na
  maszynie: 2026-08-30). Pliki z 11–12.09 znikną ok. 11–12.10 — **termin dla baseline'u w P0**.

## Decyzje właściciela (2026-09-12)

| # | Pytanie | Wybór |
|---|---|---|
| D1 | Kolejność | **Najpierw koszt** — ten spec; jakość (3.2, 3.3, 3.4, 3.8) → spec 2 |
| D2 | Proza (3.8) | **Wariant 1 do przetestowania** — plik tylko dla werdyktu bramki i materiału dla człowieka; reszta wiadomością z limitem. Spec 2, z pomiarem A/B |
| D3 | Ceremonia (3.1) | **Środkowy tor z checkerem** — bez designera, bez zamrażania listy przez testera, bez screenów qa. Spec 2 |
| D4 | Stare role (3.5) | **Upgrade mode usuwa** lokalne role cieniujące role pluginu, po przeniesieniu ich wiedzy o repo do szablonu briefu. Ten spec, P4 |
| Q1 | Pamięć na starcie | **Skrót + archiwum** — hook podaje tylko bieżące (otwarte problemy, ostatnia sesja, żywe reguły) poniżej ~10 000 znaków; stare zweryfikowane fakty i lekcje rotują do archiwum czytanego na żądanie; limit rozmiaru pilnowany testem. Odrzucone: sama wskazówka (powrót do odkrywania znanego od nowa), sam limit (nie mówi, co wyciąć) |
| Q2 | Budżet lidera | **Przekazanie po fazie + bezpiecznik** — po każdej zamkniętej fazie lider zapisuje stan i kończy sesję, następna faza startuje świeżo; szablon `settings.json` dostaje niższe okno auto-kompakcji jako twardy bezpiecznik. Świadomy koszt: bezpiecznik działa też na interaktywną pracę właściciela w repo klienta. Odrzucone: sama reguła (nic jej nie wymusza — harness nie wystawia rozmiaru kontekstu), sam bezpiecznik (kompakcja gubi szczegóły i kosztuje podsumowanie) |
| Q3 | Budżet workera | **Mniejsze zadania + reguła testów + limit** — (a) zadanie = jedna faza z jednym `Done-when`, definicja wpisana tam, gdzie dziś stoi „one task per worker"; (b) w pętli wewnętrznej tylko testy dotkniętych plików, pełny zestaw i e2e raz przed commitem; (c) `maxTurns` w definicji roli jako bezpiecznik. Wartości z rozkładu per rola (11–12.09, tury p50/p90/max → propozycja): `be-dev` 53/136/431 → **140** (ogon >p90 = 357 M z 593 M tej roli); `fe-dev` 131/216/216, n=6 → **220**; `explorer` 32/62/79 → **80**; `checker` 36/72/98 → **100**; `qa` 105/203/278 → **210**; `tester` 91/214/214, n=3 → **220**; `designer` 71/76/76, n=3 → **100**. Limit ≈ p90, nie mediana — ma ciąć ogon, nie typową pracę; wartości przy n≤6 są słabe i do przeglądu po pomiarze Q4. Kierunek zaproponował właściciel („wydzielać mniejsze zadania, lepiej precyzować"), pomiar go potwierdził. Odrzucone: bez limitu (ogon wraca przy następnym sklejonym briefie), same mniejsze zadania (zostaje 7× powtarzany e2e) |
| Q4 | Dowód oszczędności | **Narzędzie + evale + realna praca** — pomiar z tego specu staje się `tools/token-report.js` z testem deterministycznym na fixture'ach transkryptów; liczba nagłówkowa = porównanie przed/po na kolejnych dniach pracy `partner-portal-v3`; dwie reguły zachowania (zadanie = faza, przekazanie sesji po fazie) dostają evale, zgodnie z zasadą repo „zachowanie modelu → eval". Świadomy koszt: evale same zużywają tokeny; porównanie na realnej pracy jest zaszumione różnicą zadań. Odrzucone: bez evali (reguła bez sprawdzenia — lekcja starych ról), same evale A/B (mały scenariusz nie odtwarza ogonów 400 tur) |
| F1 | Co hook podaje, gdy `STATE.md` nie ma pięciu sekcji | **Sekcje albo początek** — plik z pięcioma sekcjami → bieżące sekcje; bez nich → pierwsze znaki pliku do limitu (najnowszy blok jest na górze) + linia ze ścieżką. Odrzucone: zawsze początek z odwróconą kolejnością sekcji (zmiana konwencji we wszystkich repo), tylko sekcje z przepisaniem przez Upgrade (243 KB do przepisania, zanim hook cokolwiek da) |
| F2 | Jak poprawka dociera do adoptowanego repo | **Łatka w Upgrade mode** — nazwany wyjątek od „never overwrite": podmiana tylko bloku emisji `STATE.md` w lokalnym hooku, reszta lokalnych zmian zostaje, człowiek zatwierdza diff. Świadomy koszt: zamrożona kopia hooka zostaje problemem przy następnej zmianie. Odrzucone: emisja w hooku pluginu (większy zakres; Codex nie uruchamia hooków pluginu) |
| F3 | Jak sięgać do archiwum lekcji | **`grep` po słowach obszaru** (moduł, plik, integracja) — nie zależy od formatu wpisów. Odrzucone: wymuszenie `Applies-to` (przepisywanie wpisów + reguła formatu do pilnowania) |
| F4 | Jak lider kończy sesję po fazie | **Lider prosi o `/clear`** — zapisuje `STATE.md` i kończy turę jedną linią dla człowieka. Świadomy koszt: jeden ruch człowieka na fazę. Odrzucone: świeży proces `claude -p` (sesja niewidoczna dla człowieka, osobne uprawnienia) |

## Open Questions — zamknięte 2026-09-12

Q1–Q5 rozstrzygnięte przez właściciela, po jednym pytaniu; F1–F4 z pre-implementu tego samego dnia.
Odpowiedzi w tabeli decyzji wyżej. Liczby progów w fazach niżej (rozmiary plików pamięci, wartości
`maxTurns`) są **propozycją z pomiaru** i zatwierdzają się razem ze specem, nie osobno.

## Fazy

Kolejność: **P0 → P1 → P3 → P2 → P4 → P5**. P0 jest rozłączne z P1 i może iść równolegle. Pozostałe
dzielą pliki (`settings-template.json`: P1, P2, P4; `adopt-existing-repo.md`: P1, P4;
`agent-team-structure.md` / `team-lead.md` / `team-lead.toml` / `sailes-implement/SKILL.md`: P1, P2, P3)
— idą po kolei, a współdzielone pliki doktryny integruje lider, nie dwóch workerów naraz.

### P0 — narzędzie pomiaru i baseline (Q4, przed zmianami)

Files: `tools/token-report.js` · `tools/token-report.test.js` · `tools/fixtures/token-report/*.jsonl` ·
`package.json` (`test`) · `.ai/eval-runs/2026-09-12-token-baseline/`.

- Narzędzie liczy to, co ten spec: tokeny kontekstu lider/subagenci, tury, szczyt, ogon top 10%, rozkład
  per rola, spawny po nazwie bez prefiksu. **Deduplikacja usage po `message.id`, ale `tool_use` z każdej
  linii** — pierwsza wersja pomiaru z 2026-09-12 zaniżyła spawny 10 vs 177 właśnie na tym; to jest
  nazwany przypadek testowy, nie przypis.
- **Fixture'y syntetyczne.** Transkrypty klienta zawierają jego kod i dane, a to repo idzie na GitHub —
  żaden wycinek transkryptu nie trafia do repo.
- Baseline z 11–12.09 zapisany w `.ai/eval-runs/2026-09-12-token-baseline/` **tylko jako agregaty**
  (liczby, rozkłady, nazwy ról) — przed ok. 11.10, kiedy transkrypty znikną.

Done-when: `node tools/token-report.test.js` → 0 failures, w tym przypadek podzielonej wiadomości
(jeden `message.id`, `tool_use` w drugiej linii) i przypadek powtórzonego usage; `node tools/token-report.js
~/.claude/projects/-home-charlie-Work-partner-portal-v3 --since 2026-09-11 --until 2026-09-13` → odtwarza
706 M / 1 297 M ±1%, wynik zapisany jako baseline; `grep` baseline'u nie znajduje treści wiadomości.

### P1 — pamięć na starcie sesji (Q1, F1, F2, F3)

Files: `skills/sailes-bootstrap/hooks-template/session-start.sh` · `hooks-template.test.js` ·
`agents-md-template.md` (sekcje Session Memory i Lessons) · `adopt-existing-repo.md` (Upgrade mode:
wyjątek od „never overwrite", łatka hooka, podział `STATE.md`) · `settings-template.json` (komentarz
„inject STATE.md") · pozostali czytelnicy reguły „read STATE.md + lessons.md": `sailes-implement/SKILL.md:21,80,92`
· `agent-team-structure.md:74,170` · `agents/team-lead.md:68` · `codex-agents/team-lead.toml:7` ·
`sailes-pre-implement/SKILL.md:24` · `agentic-first-principles.md:140` · `skills/README.md:79` ·
`skeleton.md:81` · `adopt-existing-repo.md:32` · `repo-done-checklist.md:25` · `codex-config-template.md:17`.

- **Ekstrakcja (F1).** Plik ma nagłówki `## Open failures`, `## General rules`, `## Last session` → hook
  podaje nagłówek `Last-commit` i te trzy sekcje. Plik ich nie ma → hook podaje początek pliku do limitu.
  W obu przypadkach nadmiar ucina jawną linią: pełny plik i archiwum są pod ścieżką X. Limit **9 500
  znaków liczony dla całego wyjścia hooka**, łącznie z ostrzeżeniami `Last-commit`, `.env` i linią
  Task Router. Tylko POSIX `sed`/`awk`; nagłówki dopasowywane z tolerancją `\r`. Nigdy nie kończy się
  kodem ≠ 0 (istniejący test `session-start never blocks`).
- **Rotacja (Q1, F3).** **Verified facts** i stare lekcje rotują do `.ai/archive/`, czytane na żądanie
  przez `grep` po słowach dotykanego obszaru (moduł, plik, integracja), nie „before ANY task". Reguła
  „read STATE.md + lessons.md" zmienia się **we wszystkich czytelnikach z listy plików** na: skrót z
  hooka + `grep` archiwum po obszarze. Jeden czytelnik ze starą regułą to reguła sprzeczna sama ze sobą.
- **Limit rozmiaru.** `STATE.md` ≤ **20 KB**, `lessons.md` ≤ **40 KB**; hook **ostrzega** z rozmiarem,
  gdy plik go przekracza.
- **Zasięg (F2).** Upgrade mode krok 2 dostaje nazwany wyjątek od „additive only, never overwrite":
  (a) w lokalnym `.claude/hooks/session-start.sh` podmienia się **tylko** blok emisji `STATE.md`, a
  lokalne zmiany (np. wyliczanie `ROOT` z położenia skryptu w `partner-portal-v3`) zostają; (b)
  `STATE.md` i `lessons.md` powyżej limitu dzielą się na bieżące + `.ai/archive/`. Oba kroki pokazują
  diff człowiekowi przed zapisem (krok 3 Upgrade mode).
- **Framework przestrzega własnego limitu** (decyzja właściciela 2026-09-12). `.ai/STATE.md` tego
  repo (87 KB) i `.ai/lessons.md` (45 KB) dzielą się tak samo: bieżące poniżej 20 / 40 KB,
  reszta do `.ai/archive/`. Nic nie jest usuwane, tylko przenoszone. Rotację robi lider, bo to
  pamięć sesji, a nie plik, który worker zna.

Done-when: `wc -c .ai/STATE.md .ai/lessons.md` w tym repo → ≤ 20 000 / ≤ 40 000, a suma bajtów
bieżące + archiwum ≥ rozmiar sprzed rotacji; `node skills/sailes-bootstrap/hooks-template/hooks-template.test.js` → 0 failures, w tym nowe
przypadki: (a) fixture w kształcie klienta — datowane bloki `#`, powtórzone nazwy sekcji, ≥ 200 KB →
całe stdout < 9 500 znaków, zaczyna się od najnowszego bloku, zawiera linię ze ścieżką; (b) fixture
pięciosekcyjny ≥ 200 KB → stdout zawiera Open failures, General rules i Last session, nie zawiera
Verified facts; (c) to samo co (b) z CRLF → ten sam wynik; (d) mały `STATE.md` → podany w całości
(istniejący test `emits STATE.md` zielony bez zmiany asercji); (e) `STATE.md` > 20 KB i `lessons.md`
> 40 KB → linie ostrzeżenia z rozmiarem; (f) mutacja: przywrócenie `cat "$STATE"` czerwieni (a) i (b).
`grep -rn "STATE.md + lessons.md\|read .*lessons.md" skills agents codex-agents` → brak starej reguły.

### P2 — przekazanie sesji lidera po fazie + bezpiecznik (Q2, F4)

Files: `skills/sailes-bootstrap/session-handoff.md` (nowe źródło bloku) · `tools/blocks.json` ·
`agent-team-structure.md` · `agents/team-lead.md` · `codex-agents/team-lead.toml` (trzej konsumenci, jak
`delegation-threshold`) · `skills/sailes-implement/SKILL.md` (Phase gate) · `settings-template.json` ·
`codex-agents/parity.test.js`.

- **Reguła (blok `session-handoff`, F4):** po zamkniętej bramie fazy lider zapisuje `STATE.md` (Last
  session = następna faza i jej brief) i **kończy turę jedną linią dla człowieka**: faza zamknięta,
  `/clear`, potem „kontynuuj". Model nie wykonuje `/clear` sam. Następna faza startuje od skrótu z hooka
  (P1; `SessionStart` odpala na `clear`). Wyjątek nazwany: faza, której brama i tak czeka na człowieka,
  łączy tę prośbę z pytaniem bramy, zamiast dokładać drugi ruch.
- **Bezpiecznik:** `"autoCompactWindow": 400000` w `settings-template.json`. Uzasadnienie liczby: średni
  kontekst wywołania lidera 11–12.09 ≈ 420 k, szczyty 627–933 k — 400 k tnie każdą zmierzoną sesję
  lidera, a zostawia zapas nad szczytem workerów p90 (262 k). Świadomy koszt z Q2: działa też na
  interaktywną pracę w repo klienta. Klucz jest udokumentowany dla pliku projektu; sprawdzenie na żywo
  zostaje jako dowód działania w run logu.

Done-when: `node tools/sync-blocks.js --check` → in sync (blok w trzech konsumentach); `parity.test.js`
czerwieni po usunięciu reguły z `team-lead.toml`, zieleni po przywróceniu; test w
`hooks-template.test.js` (lub nowym przypadku walidacji szablonu) asertuje `autoCompactWindow` w
`settings-template.json`; zapis sprawdzenia na żywo (komenda + obserwacja) w run logu fazy; eval
`lead-hands-off-after-phase` (P5) PASS.

### P3 — worker: zadanie = faza, testy w pętli, `maxTurns` (Q3)

Files: `skills/sailes-bootstrap/agent-team-structure.md` (reguła 2 + szablon briefu, linia
`Verification:`) · `agents/team-lead.md:69` · `codex-agents/team-lead.toml` · `skills/sailes-implement/SKILL.md:40`
· `agents/{be-dev,fe-dev,explorer,checker,qa,tester,designer}.md` (frontmatter) · `codex-agents/{be-dev,fe-dev}.toml`
· `codex-agents/parity.test.js` · `agents/validate-frontmatter.test.js`.

- **Zadanie = jedna faza z jednym `Done-when`.** Brief z więcej niż jednym `Done-when` albo z listą
  niezależnych poprawek jest dwoma zadaniami. Wpisane tam, gdzie dziś stoi „one task per worker".
- **Pętla wewnętrzna:** testy dotkniętych plików; pełny zestaw i e2e **raz**, przed commitem-deklaracją.
  Linia `Verification:` briefu rozdziela te dwa poziomy jawnie.
- **`maxTurns`** w rolach wg tabeli Q3. `team-lead`, `researcher`, `docs-author` — **bez limitu**, bo
  pomiar nie ma dla nich danych (lider działa jako sesja główna; pozostałe dwie nie wystąpiły); powód
  zapisany w pliku roli, nie pominięty. Wynik oznaczony jako częściowy lider traktuje jak niedokończony
  (istniejąca reguła: brak commita nie-`WIP` = nie skończył).
- Codex nie ma `maxTurns` (pojęcie Claude, jak pin modelu) — bliźniaki dostają tylko regułę zadania i
  pętli; `parity.test.js` dostaje te dwa pojęcia.

Done-when: `npm test` → exit 0, w tym: `validate-frontmatter.test.js` asertuje `maxTurns` na siedmiu
rolach, a mutacja (usunięcie `maxTurns` z `agents/be-dev.md`) go czerwieni; `parity.test.js` czerwieni
po usunięciu reguły „jedna faza" z `be-dev.toml` i zieleni po przywróceniu; `node tools/sync-blocks.js --check`
→ in sync.

### P4 — stare role: usunięcie + blokada (D4, Q5)

Files: `skills/sailes-bootstrap/adopt-existing-repo.md` (Upgrade mode) · `settings-template.json` ·
`codex-config-template.md` (odpowiednik albo jawne `n/a`) · `repo-done-checklist.md` ·
`repo-done-checklist.test.js`.

- **Upgrade mode:** dla każdego `.claude/agents/<nazwa>.md`, którego `<nazwa>` jest rolą pluginu
  (`be-dev`, `fe-dev`, `explorer`, `checker`, `qa`, `tester`, `designer`, `researcher`, `docs-author`,
  `team-lead`) — najpierw wiedza o repo z tego pliku trafia do szablonu briefu repo, potem plik jest
  usuwany. To drugi nazwany wyjątek od „never overwrite" w kroku 2, obok łatki hooka z P1. Pliki o
  nazwach **spoza** listy ról (np. `be-checker` w `partner-portal-v3`) nie są usuwane automatycznie —
  Upgrade mode je wypisuje i pyta, bo nie cieniują niczego wprost.
- **Blokada:** `permissions.deny` w `settings-template.json` dostaje `Agent(<nazwa>)` dla dziesięciu
  gołych nazw. Czy reguła gołej nazwy dopasowuje też `sailes-app-builder:<nazwa>`, **dokumentacja nie
  mówi** — blokada stoi wyłącznie na sprawdzeniu niżej.
- **Pierwszy krok fazy — sprawdzenie na żywo** w repo testowym: spawn `be-dev` odrzucony,
  spawn `sailes-app-builder:be-dev` przechodzi. Jeśli reguła zablokuje obie nazwy, blokada wypada z
  zakresu i wraca do właściciela; usunięcie plików zostaje.
- Pozycja checklisty w sekcji `## Case A / Case C (existing repo)` jako **polecenie shell do wklejenia
  wyniku**, jak reszta dokumentu: „żaden plik w `.claude/agents/` nie nosi nazwy roli pluginu". Test nie
  duplikuje logiki — wyciąga to polecenie z `repo-done-checklist.md` i uruchamia je na fixture'ach, tym
  samym wzorcem co istniejący skan skryptów `pnpm` (`extractScanPattern`).

Done-when: `node skills/sailes-bootstrap/repo-done-checklist.test.js` → 0 failures, w tym: polecenie
wyciągnięte z dokumentu, uruchomione na fixture z `.claude/agents/be-dev.md` → wypisuje `be-dev.md`;
na fixture z `.claude/agents/be-checker.md` → nic nie wypisuje (nazwa spoza listy); brak polecenia w
dokumencie → test czerwony, nie cichy; `settings-template.json` zawiera dziesięć wpisów `Agent(...)` i żadnego z prefiksem
`sailes-app-builder:`; zapis sprawdzenia na żywo (obie próby spawnu + wynik) w run logu fazy.

### P5 — evale, wydanie (Q4)

Files: `evals/lead-splits-brief-per-phase.md` · `evals/lead-hands-off-after-phase.md` · `CHANGELOG.md` ·
pięć stempli · `docs/architecture/` delta.

- Oba evale niosą linię `Files:` z plikami, których regułę sprawdzają (inaczej `eval-status` zgłasza
  NO-FILES).

Done-when: oba evale uruchomione przez `sailes-eval-runner` z zapisanym werdyktem; `node evals/harness/eval-status.js`
nie zgłasza ich jako NO-FILES; `npm test` → exit 0 (w tym `release-hygiene` na 1.33.0).

**Po wydaniu, poza bramą wydania** (nie da się zmierzyć przed deployem): ten sam raport na pierwszych
dwóch dniach pracy `partner-portal-v3` po upgrade do 1.33.0, porównany z baseline'em z P0, zapisany obok
niego. Spec przechodzi na `implemented` po wydaniu; porównanie zamyka go w `STATE.md`, a wynik gorszy od
baseline'u otwiera wpis w backlogu z liczbami.

## Non-goals

- **Poprawki jakości z raportu** (3.2, 3.3, 3.4, 3.6, 3.7, 3.9, 3b, 3c) — spec 2 lub backlog, D1.
- **Lider przestaje wykonywać sam** (1 091 `Bash`) — przedmiot specu 2026-08-06; ten spec dokłada
  tylko budżet kontekstu, nie regułę delegowania.
- **Sprzątanie `partner-portal-v3`** (usunięcie ról, skrócenie `STATE.md`, łatka hooka) — praca w repo
  klienta, przez jego Upgrade mode po wydaniu 1.33.0, nie przez ten spec.
- **Emisja pamięci w hooku pluginu** — odrzucone w F2; zamrożona kopia hooka w repo zostaje.
- **Koszt w pieniądzach** — pomiar jest w tokenach.
