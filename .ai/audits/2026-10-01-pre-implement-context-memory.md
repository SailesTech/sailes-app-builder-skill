# Pre-Implement Report: `.ai/specs/2026-10-01-context-memory-from-clm-paper.md`

Data: 2026-10-01 · Spec `approved` tego samego dnia · Sprawdzone: `lessons.md` + `archive/` po
obszarach (session-start, STATE.md, worker-status, sync-blocks, handoff), fixture'y testów hooka,
TOML konsumenta bloku, `main()` narzędzia, **gałęzie i worktree'y** (to ostatnie zmieniło werdykt).

## Verdict: NOT-READY → READY-WITH-FIXES po poprawkach wpisanych w spec dziś (R1–R6 poniżej), z jedną decyzją człowieka otwartą (R1)

Spec jest dobrze zważony (contract fix × 3, sekcje n/a jedną linią — bez nadwagi), trzy sprawdzarki
zielone, żadna faza nie zbliża się do 60 % `maxTurns`. **Blokada nie jest w specu, tylko pod nim:**
spec stoi na `main` = `9c8575e`, a na gałęzi `feat/1.39.0-design-tournament` (in-progress, zatwierdzona
2026-09-30, P5/P6 w toku, nie wypchnięta) ten sam numer wydania i **ten sam mechanizm `Dead-ends:`**
są już w połowie zbudowane. Spec napisany dziś rano tego nie widział, bo `.ai/specs/` na `main` go
nie ma — specy żyją na gałęziach do merge'u, a router czyta tylko dysk bieżącego worktree.

## BC findings

| Waga | Powierzchnia | Znalezisko | Droga |
|---|---|---|---|
| **Critical** | `Framework-Version target: 1.39.0` | 1.39.0 zajęte: `feat/1.39.0-design-tournament` ma gotowy wpis CHANGELOG `## 1.39.0 — 2026-09-30` i P6 ze stemplami w toku (`.ai/runs/2026-09-30-design-tournament.md:23`) | ten spec → **1.40.0**, po tamtym merge'u (R1) |
| **Critical** | etykieta pola | tamten spec wprowadza **`Dead-ends:`** (z myślnikiem) w run logu, raporcie `be-dev`/`fe-dev`, briefie (`agent-team-structure.md:694-697`) i schemacie `IMPL.dead_ends`; mój spec pisał `Dead ends:`. Dwie etykiety jednego pojęcia to dokładnie to, co `lessons.md:80-81` zapisało jako przyczynę zgubionego handoffu | jedna etykieta **`Dead-ends:`** wszędzie; forma wpisu ta sama co tam: `<co próbowano> · <dlaczego nie — obserwacja> · <dokąd poszło>` (R2) |
| **Critical** | `skills/sailes-implement/SKILL.md:23` (run log) | moje P1.e = ich P1.1, dosłownie ta sama linia | P1.e **wylatuje**; `STATE.md` trzyma ostatnie pięć i wskazuje run log (R3) |
| Warning | konsumenci bloku `session-handoff` | tamta gałąź dotyka `agents/team-lead.md` (+2), `agent-team-structure.md` (±1), `codex-agents/team-lead.toml` (+2), `agents-md-template.md` (+1) — poza blokiem, ale w tych samych plikach generowanych przez `sync-blocks`. Dwie niescalone gałęzie edytujące pliki generowane = konflikt w kopiach, nie w źródle | `Depends-on: wynik: merge feat/1.39.0-design-tournament`; po merge'u `node tools/sync-blocks.js` od nowa (R1) |
| Warning | `codex-agents/team-lead.toml:4,114` | blok wklejany do `developer_instructions = """…"""` — basic string TOML: **backslash jest znakiem ucieczki**. Tekst P1.a nie ma backslasha; cytat blokowy `>` w specu to prezentacja, w pliku ma być bullet | zdanie w briefie P1 + `validate-toml.test.js` już w Done-when (R4) |
| OK | `parity.test.js:117-121` | koncept `/clear` w obu kopiach bloku — dokładanie tekstu go nie usuwa | — |
| OK | `session-start.sh` stdout | żaden fixture (`session-start-memory.test.js`, `hooks-template.test.js`) nie ma linii zaczynającej się od tokenu rozkazującego (grep → 0); filler to `'a'.repeat`; nadwyżka bajtów w P1a-15/16 jest **kalibrowana z SUT** (`measureFixedOverhead`, `:455-471`), nie zaszyta — nowe ostrzeżenie, które nie strzela, nie rusza granicy 9500 | — |
| OK | `worker-status.js main()` (`:524-558`) | `--board` to nowa gałąź `argv[0]` przed fallthrough; `--sweep`/`--verify` nietknięte | — |

## Gaps

- **G1 (P2.a, tryb head):** spec kazał skanować „cały plik poza `General rules`". Plik klienta w
  trybie head ma 200+ KB datowanych bloków — stare „Never…" z lipca dawałyby 3 ostrzeżenia + `(+N
  more)` na *każdym* starcie. To wilk, którego ten hook już dwa razy wyciszył (`:108-112`). Skan
  tylko tego, co **może** wyjść na stdout: w trybie sekcyjnym treść `SECTIONS`, w head —
  `head_cut` z pełnym `MAX_BYTES` (największy możliwy wycinek). Liczone **przed** zamknięciem
  `TAIL_FILE`, żeby budżet pamięci je uwzględnił (R5).
- **G2 (P3.a, `broken:`):** trzy **prawdziwe** pliki statusu leżą w tym worktree
  (`.claude/status/be-dev-P{1,2,4}.md`, z 2026-09-30, nieusunięte przez leada) i `--sweep` zgłasza
  **3/3 INVALID**: listy po przecinku zamiast `["a","b"]`, jeden bez bloku otwarcia (nadpisany, nie
  dopisany). To ten sam kształt, który `lessons.md:258-275` zapisało przy pierwszym realnym użyciu
  tego narzędzia. Tablica, która na realnych plikach pokazuje tylko „3 broken", nic leadowi nie mówi.
  Linia `broken:` ma drukować pola, które *dało się* odczytać (`worker`, `outcome`, `commit`), obok
  komunikatu walidatora; walidacja (`--sweep`/`--verify`) bez zmian (R6).
- **G3 (P3, akceptacja):** brak kroku „uruchom na artefakcie spoza własnych testów"
  (`lessons.md:270-275`). Są pod ręką: trzy pliki wyżej. Lead uruchamia `--board .claude/status`
  w tym worktree przed przyjęciem P3 (R6).

## Risks

| Scenariusz | Waga | Mitygacja | Resztkowe |
|---|---|---|---|
| Tamta gałąź nie scala się szybko (P5/P6 w toku, „bez pusha" w run logu) → ten spec czeka | średnia | R1 ustala kolejność jawnie; P2 i P3 **nie** zależą od tamtej gałęzi (pliki rozłączne) i mogą iść na obecnej bazie — czeka tylko P1 i P4 | tempo cudzej pracy |
| Eval P1.g INCONCLUSIVE (ramię A też nie powtarza próby) | średnia | spec: druga próbka, nie trzecia; fixture z próbą *kuszącą* (podniesienie `maxTurns`) | 1–2 próbki to minimum protokołu, nie dowód statystyczny |
| Pole `Dead-ends: none` zawsze puste → ceremonia | niska–średnia | Q2 + eval; po trzech run-ach z `none` → wiersz w backlogu z pytaniem o usunięcie | — |
| `head_cut` tnie `Dead-ends:` z końca `Last session` przy przekroczeniu budżetu | niska | limit 5 pozycji w doktrynie; pola **nad** opisem „co dalej", nie pod nim — kolejność do zapisania w P1.a | długie `Open failures` nadal zjada budżet pierwsze |
| Ostrzeżenie P2 trafia w cytat reguły w `Open failures` („Never let a hypothesis…") | niska | jednorazowa poprawka w pliku; wzorzec wymaga wielkiej litery na początku linii po markerze listy | PL tokeny (`Nie `) częstsze w prozie niż EN |
| `--board` kusi, żeby zastąpić `--verify` | niska | zdanie w `worker-status-template.md` (P3.c); tablica nie drukuje `touched` | — |

Kroki nieodwracalne: tylko push na `main` (P4, Human-STOP). Rollback = revert commita wydania;
plugin pobierze go automatycznie tak samo jak deploy.

## Remediation — wpisane w spec 2026-10-01 (poza R1, która czeka na człowieka)

1. **R1 (decyzja człowieka):** kolejność względem `feat/1.39.0-design-tournament`.
   (a) *rekomendacja* — ten spec zostaje osobny, target **1.40.0**, P1/P4 startują po merge'u tamtej
   gałęzi na `main`; P2/P3 mogą ruszyć od razu na obecnej bazie. (b) P1 (pola w `STATE.md` + reguła
   o poleceniach) dokleja się do tamtego speca jako jego P7, a tu zostają P2/P3/P4 na 1.40.0.
   Koszt (b): dokładanie zakresu do speca, który jest w P5/P6 wydania — to ta sama klasa ruchu, którą
   G29 (13.09) zrobił raz świadomie i którą `spec-weight` nazywa „patched, not rewritten".
2. **R2:** etykieta `Dead-ends:` (myślnik) i forma wpisu `<co> · <dlaczego nie> · <dokąd>` — w P1.a,
   P1.c, P1.d, Done-when, `STATE.md` tego repo.
3. **R3:** P1.e usunięte; P1.a mówi: „`STATE.md` keeps the last five; the run log's `Dead-ends:`
   section (sailes-implement, spec 2026-09-30) is the full list".
4. **R4:** brief P1: blok jako bullet, bez `>` i bez backslasha (TOML basic string).
5. **R5:** P2.a — zakres skanu = największy możliwy emitowany wycinek, liczony przed zamknięciem
   `TAIL_FILE`.
6. **R6:** P3.a — `broken:` drukuje odczytane pola; P3.b test (4) na pliku w realnym kształcie
   (lista po przecinku); Done-when P3 — lead uruchamia `--board` na trzech plikach z tego worktree.

## Suggested sequencing

- Teraz (niezależnie od R1): P2 i P3 w Workflow na obecnej bazie — pliki rozłączne z tamtą gałęzią
  (`git diff --name-only main...feat/1.39.0-design-tournament` nie zawiera `session-start*`,
  `worker-status*`).
- Po merge'u tamtej gałęzi: `git merge main` tutaj → `node tools/sync-blocks.js --check` → P1.
- P4 po P1–P3, jako 1.40.0.
