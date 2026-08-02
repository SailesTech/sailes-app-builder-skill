# Spec: precyzja delegowania i kontrola nad agentami

Status: approved
Brief: `.ai/briefs/2026-08-01-delegation-precision-and-agent-control.md`
Framework-Version target: 1.27.0
Related: `.ai/specs/2026-08-01-milestone-lessons-to-doctrine.md` (in-progress, 1.25.2 + 1.26.0)

## TLDR

Dwie rzeczy, w tej kolejności: **brief, którego nie da się oddać niedomkniętym**, i **plik statusu
per worker, którego nieobecność coś znaczy**. Warunkiem obu jest jedna naprawa strukturalna —
**próg delegowania przestaje istnieć w trzech kopiach pisanych ręcznie**.

Zakres wynika z dnia, w którym trzynaście ramion ewaluacyjnych dało jedno czyste rozróżnienie:
doktryna jest w większości re-derywowalna przez model, **artefakt nie jest**. Dlatego wszystko, co
da się zamienić w plik, check albo test, jest tak zamieniane, a proza zostaje tam, gdzie mechanizm
jest niemożliwy — nie tam, gdzie jest niewygodny.

## Problem

Cztery kosztowne defekty z 2026-08-01 mają jedną cechę wspólną: **każdy był nieobecnością.**
Brakujący endpoint nie zmienia żadnej linii, więc przegląd łatki nie może go znaleźć. Brakujący
raport jest ciszą nie do odróżnienia od „nie znalazłem nic". Brakujący kwit delty wygląda w run
logu jak zgodność. Brakująca klauzula `Done-when` nie daje bramce czego oblać. Poprawność ktoś
sprawdzi; **nieobecności nie ma kto**, dopóki nie istnieje coś, co asertuje obecność.

Osobno, i to jest przyczyna trzech kolizji kryteriów zmierzonych tego dnia: **reguła zapisana
w więcej niż jednym miejscu rozjeżdża się**, a evale kodują potem różne jej wersje. Rozjazd ma
stałe miejsce — kanoniczny `agent-team-structure.md` → definicja roli `agents/*.md` → bliźniak
`codex-agents/*.toml`.

## Decyzje człowieka (2026-08-01)

| # | Pytanie | Wybór |
|---|---|---|
| Q1 | Gdzie stoi jeden próg | **jedno źródło + kopie generowane, test na identyczność** |
| Q2 | Macierz własności plików | **blok `yaml` w planie pracy** |
| Q3 | Weryfikacja pliku statusu | **raportuje głośno, nie blokuje** |
| Q4 | Check domknięcia briefu | **test w bramce** (hook na powołaniu odrzucony sondą) |
| Q5 | Kto pisze plik statusu | **wszyscy piszący** — ten sam test co przy worktree |

**Skutek Q4 wart odnotowania:** wybór testu zamiast hooka wyprowadza cały spec spod jedynego
niezweryfikowanego źródła w tym materiale. Sonda o hookach starczyła, żeby odrzucić opcję
z powołaniem, i nie musi już niczego podtrzymywać.

## Pomiary, na których stoi ten spec

| Co | Wynik | Skutek |
|---|---|---|
| `PreToolUse` przy powołaniu subagenta | **nie strzela** — powołanie nie jest wywołaniem narzędzia. `SubagentStart` nie blokuje i nie niesie briefu; `SubagentStop` blokuje i niesie `last_assistant_message` | check briefu przy powołaniu **niewykonalny** → F2 jest testem |
| `TaskGet` zwraca `metadata` | **nie** (ani `blocks`/`blockedBy`, które obiecuje własny opis). Stan sesyjny, nie przeżywa padnięcia procesu | pliki w repo są źródłem prawdy; harness co najwyżej lustrem statusu i właściciela |
| Kto odsyła do pliku kanonicznego | **tylko `team-lead.md`**, ścieżką repozytoryjną **nieistniejącą w repo klienta**, instrukcją bez weryfikacji | odsyłacz naprawiony osobno (`f9ce2da`); Q1 przesunięte z „jedno miejsce" na „jedno źródło, kopie generowane" |

Prowenienja pierwszego wiersza: pojedyncze źródło (agent-przewodnik cytujący referencję hooków),
**nie zweryfikowane niezależnie w tym repo**. Po wyborze Q4/A nic w tym specu na nim nie stoi.

## Design

### 1. Jedno źródło progu delegowania

`skills/sailes-bootstrap/delegation-threshold.md` — jeden akapit, oznaczony znacznikami
`<!-- BEGIN delegation-threshold -->` / `<!-- END -->`. Skrypt `tools/sync-blocks.js` wstawia jego
treść między te same znaczniki w trzech konsumentach: `agent-team-structure.md`,
`agents/team-lead.md`, `codex-agents/team-lead.toml`. Test porównuje cztery kopie i **failuje przy
najmniejszej różnicy**.

Treść progu rozstrzyga też to, co dziś jest sprzeczne: **delegowanie i bramkowanie to dwie różne
osie** (rozstrzygnięte 2026-08-01, `28d3dec`), więc próg mówi wyłącznie o tym, kto pisze, a bramki
mają własną regułę i próg ich nie dotyczy.

### 2. Macierz własności plików

Blok `yaml` w planie pracy (`.ai/runs/<data>-<slug>.md`), sekcja `ownership:` — zadanie → zbiór
ścieżek. Check liczy przecięcia i zgłasza każde niepuste. Ten sam ruch, który dla powierzchni API
zadziałał w 1.26.0, i z tego samego powodu: tabela prozą czyta się dla człowieka i nie da się jej
z niczym porównać.

### 3. Plik statusu workera

`.ai/status/<worker-id>.md`, **zajmowany pierwszą czynnością** i **domykany ostatnią**:

```yaml
worker: be-dev-3
task: "F2 — check domknięcia briefu"
base: e276a5e            # sha, od którego odcięto worktree
claimed: ["skills/sailes-bootstrap/hooks-template/brief-closure.js"]
opened: <timestamp>
# --- poniżej dopisuje się przy domknięciu ---
closed: <timestamp>
outcome: done | blocked | policy-refusal
commit: <sha>            # pusty, gdy outcome != done
touched: [...]           # co realnie ruszył
```

**Sens całości leży w trzech rozróżnialnych stanach:** brak pliku = „nigdy nie wystartował", plik
bez `closed:` = „padł w trakcie", plik domknięty = deklaracja. Dziś wszystkie trzy są jedną ciszą
i to jest przyczyna obu strat pracy z 2026-08-01.

**Dlaczego nie wystarczy przeczytać logu workera — uzasadnienie poprawione po pomiarze.** Pierwsza
wersja tego specu opierała plik statusu na tym, że *lider nie widzi, co się dzieje*. To było
nieprawdziwe i zostało obalone pytaniem człowieka, a potem pomiarem:

| Co zmierzone (2026-08-02, ta maszyna) | Wynik |
|---|---|
| Plik `.output`, którego ścieżkę harness podaje przy każdym powołaniu | **0 bajtów** — nie dowiązanie, za którym Node podąży, nie plik z treścią |
| Prawdziwe transkrypty | `~/.claude/projects/<repo>/<sesja>/subagents/` — **64 pliki, 5,2 MB** w tej sesji, największy 388 KB |
| Koszt odczytu jednego w całości | ~100k tokenów, żeby odpowiedzieć na pytanie tak/nie |
| **Koszt `tail -3`** | 57 linii JSONL po ~1,8 KB → **~5 KB. Wykonalne i tanie.** |

Więc lider **może** tanio zobaczyć ostatnią wypowiedź workera, i uzasadnienie „nie widać" upada.
Zostaje uzasadnienie węższe i prawdziwe: **log jest narracją, plik statusu jest zobowiązaniem.**
Transkrypt mówi, co agent powiedział; plik statusu mówi, do czego zobowiązał się **przed** pracą
i czy to domknął. Trzy rzeczy, których `tail` nie da i tylko one bronią tego artefaktu:

- **`base` i `claimed` sprzed startu** — deklaracja, nie wypowiedź; w narracji ich nie ma;
- **rozróżnienie „nigdy nie wystartował" od „padł w trakcie"** — martwy worker też ma transkrypt;
- **czytanie logu workera to czytanie relacji twórcy** — dokładnie to, czego zakazuje izolacja
  bramek. Lider oceniałby skończoność po tym, co agent o sobie napisał.

**Skutek uboczny, który wchodzi do zakresu (F5):** `tail -3` transkryptu jest **nowym, zmierzonym
szczeblem drabiny obserwacji** i dziś nie ma go tam wcale. Wchodzi między „zapytaj agenta"
a „czytaj deklaracje", z jawnym zastrzeżeniem, że ścieżka jest wewnętrzna dla harnessu, sesyjna
i nie istnieje po stronie Codeksa — więc jest wygodą, nigdy warunkiem.

**Obowiązek ma każdy piszący** — ten sam test co przy worktree („czy to pisze"), więc rola dodana
za rok dziedziczy regułę zamiast omijać ją przez pominięcie na liście.

### 3b. Cykl życia katalogu — plik znika przy akceptacji, treść zostaje

**Niezmiennik, i to on jest produktem:** *cokolwiek leży w `.ai/status/`, albo jeszcze biegnie, albo
padło.* Katalog, w którym zostają pliki zaakceptowanych zadań, po tygodniu przestaje odpowiadać na
jedyne pytanie, dla którego powstał — trzeba by czytać wszystkie i porównywać daty, czyli dokładnie
ta praca, której ma oszczędzić.

Przy akceptacji wyniku workera lider **przenosi treść do run logu** (jedna linia: worker · zadanie ·
`outcome` · `commit` · `base` · rozbieżności z weryfikacji) i **usuwa plik**. Zapis nie ginie —
zmienia nośnik na ten, który jest historią i jest commitowany. Plik statusu jest stanem żywym,
run log jest pamięcią.

Trzy reguły, bez których to się psuje:
- **Kasowanie wolno wyłącznie po akceptacji i wyłącznie razem z wpisem do run logu.** Usunięcie bez
  wpisu jest utratą dowodu i nie różni się od pominięcia bramki.
- **Plik po workerze, który padł i NIE został zaakceptowany, nie znika po cichu.** Ląduje w run logu
  jako strata — z tym, co zdążył zadeklarować — i dopiero wtedy jest usuwany. To jest jedyny zapis,
  że powołanie w ogóle było, a dziś ta informacja przepada w całości.
- **`.ai/status/` jest gitignorowany.** To stan żywy, nie historia; ma przeżyć padnięcie procesu
  (dysk), nie wersjonowanie. Historia jest w run logu, który jest commitowany.

### 4. Weryfikacja przez lidera

Lider czyta plik i konfrontuje go z worktree — **metadanymi, nigdy treścią** (drabina obserwacji
z 1.26.0): czy `commit` istnieje, czy `touched` zgadza się z `git diff --stat`, czy `base` był
aktualny. Rozbieżność **ląduje w werdykcie i w run logu i nie blokuje**. Blokowanie odrzucone
świadomie: repo ma dwa udokumentowane przypadki checku wyłączonego za to, że krzyczał za często,
a check STATE.md jest precedensem ostrzegania bez blokady.

### 5. Check domknięcia briefu

Test, nie hook — brief bywa pisany w wiadomości, więc żaden hook go nie zobaczy. Sprawdza dwie
rzeczy: **pola obowiązkowe obecne** i **każda ścieżka na liście dozwolonych nazywa klauzulę
`Done-when`, która ją wymusza**. Druga jest regułą prozą z 1.26.0 — jedynym dodatkiem tamtego
wydania, który zmierzył się czysto — zamienioną w mechanizm.

## Fazy

Każda faza niesie listę plików, w której **każda ścieżka ma klauzulę, która ją wymusza** — ten spec
stosuje regułę, którą wprowadza.

### F1 — jedno źródło progu · **blokuje F5 i F7**

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/delegation-threshold.md` | D1.1 (istnieje i jest niepusty), D1.2 |
| `tools/sync-blocks.js` | D1.2 (uruchomiony, zmienia trzy pliki) |
| `tools/sync-blocks.test.js` | D1.3 (mutacja daje czerwień) |
| `skills/sailes-bootstrap/agent-team-structure.md` · `agents/team-lead.md` · `codex-agents/team-lead.toml` | D1.2 (bloki identyczne po synchronizacji) |

**Done-when:**
```
node tools/sync-blocks.js --check                                  → exit 0
node tools/sync-blocks.test.js                                     → 0 failing
mutacja: zmień jeden znak w bloku w agents/team-lead.md
  → node tools/sync-blocks.js --check                              → exit 1, nazywa plik
  → przywrócone                                                    → exit 0
npm test                                                            → all tests passed
```

### F2 — check domknięcia briefu

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/hooks-template/brief-closure.js` | D2.1, D2.2 |
| `skills/sailes-bootstrap/hooks-template/brief-closure.test.js` | D2.3 |

**Done-when:**
```
brief z kompletem pól i pokryciem                                   → exit 0
brief bez pola "Report:"                                            → exit 1, nazywa pole
brief z plikiem, którego żadna klauzula nie wymusza                 → exit 1, nazywa ścieżkę
fixture, który MUSI NIE strzelić: ścieżka oznaczona jawnie
  jako dotykana-ale-nieprodukowana z powodem                        → exit 0
node …/brief-closure.test.js                                        → 0 failing
```

### F3 — macierz własności jako `yaml`

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-implement/SKILL.md` (sekcja ścieżki krytycznej) | D3.1 (szablon `ownership:` obecny) |
| `tools/ownership-check.js` + test | D3.2, D3.3 |

**Done-when:**
```
plan z rozłącznymi zbiorami                                         → exit 0
plan, gdzie dwa zadania dzielą jedną ścieżkę                        → exit 1, nazywa ścieżkę i oba zadania
node tools/ownership-check.test.js                                  → 0 failing
```

### F4 — format pliku statusu + test

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/worker-status-template.md` | D4.1 |
| `tools/worker-status.js` + test | D4.2, D4.3 |

**Done-when:**
```
brak pliku                                    → "never started", exit 1
plik bez closed:                              → "died mid-run", exit 1, nazywa workera i base
plik domknięty, komplet pól                   → exit 0
plik domknięty z outcome=done bez commit:     → exit 1
--sweep na katalogu z jednym plikiem sprzed
  akceptacji                                  → wypisuje go jako zaległy, exit 1
--sweep na pustym katalogu                    → exit 0  (fixture, który MUSI NIE strzelić)
.ai/status/ obecne w .gitignore szablonu      → grep trafia
node tools/worker-status.test.js              → 0 failing
```

### F5 — doktryna pliku statusu · **po F1**

| Plik | Wymuszony przez |
|---|---|
| `agent-team-structure.md` (brief + Isolation) | D5.1 (eval `worker-claims-before-it-writes`) |
| `agents/be-dev.md` · `fe-dev.md` · `tester.md` · `designer.md` · `docs-author.md` | D5.1 |
| `agents/team-lead.md` (weryfikacja przeciw worktree **+ sprzątanie przy akceptacji + szczebel `tail -3`**) | D5.2 (eval `lead-verifies-status-against-worktree`), D5.4, D5.5 |
| `skills/sailes-bootstrap/skeleton.md` (`.ai/status/` w `.gitignore`) | D5.4 |
| `codex-agents/*.toml` (pięć bliźniaków) | D5.3 (parytet zielony) |

**Done-when:** `node codex-agents/parity.test.js` → all passed · `npm test` → all passed ·
oba evale z F6 → PASS wraz z ramionami kontrolnymi ·
`grep -c "\.ai/status/" skills/sailes-bootstrap/skeleton.md` → ≥1 (D5.4) ·
`grep -ci "usuwa plik\|removes the file" agents/team-lead.md` → ≥1 wraz z warunkiem wpisu do run
logu w tym samym zdaniu (D5.4).

### F6 — evale · **po F2, F4, F5**

Dwa scenariusze, każdy z **ramieniem kontrolnym, które MUSI dać wynik przeciwny** — bez tego
powtórzę błąd 1.26.0, gdzie cztery wnioski o skuteczności były fałszywe do czasu dołożenia kontroli.

**Done-when:** oba scenariusze mają zapisany `Last run:` z werdyktem i wehikułem · żaden nie jest
zapisany jako PASS, gdy kontrola dała ten sam wynik.

### F7 — dwa kryteria na nowo · **po F1, podzespół**

Przecięcie fixture'ów `lead-gives-every-writer-a-worktree` i `lead-delegates-instead-of-bulk-coding`
przeciw ustalonemu progowi. Wykonuje agent, **który nie widział werdyktów z 2026-08-01** — decyzja
człowieka, i ta sama izolacja, którą framework wymusza przy `checkerze`.

**Done-when:** oba scenariusze przemielone, żaden nie wymaga zachowania, którego drugi zabrania ·
`node evals/harness/eval-status.js` nie pokazuje ich wśród „did not record a PASS".

## Integration coverage

| Powierzchnia | Test |
|---|---|
| `sync-blocks` | test + mutacja dowodowa |
| `brief-closure` | test z fixture'em, który MUSI NIE strzelić |
| `ownership-check` | test na przecięciu i na rozłączności |
| `worker-status` | test na trzech stanach + na `done` bez commita + `--sweep` na zaległym i na pustym katalogu |
| cykl życia katalogu | `.ai/status/` gitignorowany w szablonie; reguła kasowania-tylko-z-wpisem obecna w definicji lidera |
| doktryna ról | parytet Codeksa (10 ról) + dwa evale z kontrolą |

## Non-goals

- Żywy podgląd przebiegu. Plik zajmowany na starcie daje wgląd w trakcie jako **skutek uboczny**.
- Zastępowanie run logu. Plik statusu odpowiada na „czy ten worker skończył i co ruszył".
- Naprawa `TaskGet` ani hooków — defekty poza tym repo.
- Hook blokujący domknięcie workera. Odrzucony wraz z Q4; wraca tylko wtedy, gdy test w bramce
  okaże się niewystarczający, i wtedy z własną sondą i ścieżką wyjścia.
- Przemiał 22 evali bez styku.
