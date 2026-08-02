# Spec: zaległości zweryfikowane przeciw dyskowi + pięć brakujących delt

Status: approved
Framework-Version target: 1.28.0
Related: `.ai/specs/2026-08-01-delegation-precision-and-agent-control.md` (fazy zrobione, czeka na
deltę), `.ai/specs/2026-08-01-milestone-lessons-to-doctrine.md` (nagłówek niesie nieprawdę)

## TLDR

Siedem defektów, które przeżyły audyt przeciw dyskowi, plus dług, który blokuje domknięcie dwóch
speców: **od 1.25.2 pięć wydań weszło na produkcję bez kwitu delty architektury**, mimo że AGENTS.md
mówi „self-docs regenerate at **every** release".

Wejściem do tego speca był audyt, nie backlog — i to jest jego pierwszy wynik.

## Problem

**Backlog kłamał w obie strony.** Z dwudziestu jeden pozycji oznaczonych `open` / `next` /
`needs the human`, **dziewięć było już naprawionych** — jedna z nich (wiersz 26) miała `open — this
is the decision` trzy linie pod własnym nagłówkiem `CLOSED`. Gdyby ten spec powstał z backlogu
zamiast z dysku, dziewięciu workerów dostałoby brief na pracę wykonaną, a każdy z nich albo
zaraportowałby „nic do zrobienia" (koszt), albo — gorzej — znalazłby sposób, żeby coś zmienić.

Trafił się też błąd w drugą stronę i jest pouczający. Wiersz 29 zamknąłem podczas audytu na
podstawie notatki `Last run:` w scenariuszu, która mówi „Threshold reasoning stated in both
directions, as the source now requires". To zdanie opisuje **co zrobił oceniany agent**, a nie
**czego żąda kryterium**. Kryterium (`evals/lead-delegates-instead-of-bulk-coding.md:16-20`) nadal
żąda powodu tylko w jedną stronę. Wiersz otwarty z powrotem na drugim czytaniu.

To jest ten sam kształt, który to repo nazywa swoją domową usterką: **krok, który raportuje sukces
z innego powodu niż deklarowany.** Tym razem po stronie czytania, nie pisania.

## Decyzje człowieka (2026-08-02)

| # | Pytanie | Wybór |
|---|---|---|
| Q1 | Zakres | **Fale 0–3** — siedem defektów, pięć delt, domknięcie speców. Karty decyzyjne i audyt prozy zostają poza |
| Q2 | 29 stale evali | **tylko te, których pliki dotknie ten spec** — ok. 6–8 ramion, nie 40 |
| Q3 | Sprzeczność `.claudeignore` | **wyjątek wchodzi do pasa `docs-author`**, nie do bootstrapu |

Uzasadnienie Q3, bo cena jest realna: (b) — oddanie okablowania bootstrapowi — trzyma granicę roli
absolutną, ale repo adoptowane bez pełnego bootstrapu nigdy nie dostanie wpisu, a cache promptu
rośnie o ~1,8 MB na wydanie i **nic tego nie zgłasza**. Kupiona jest cicha awaria za czystą regułę.
(a) płaci odwrotnie: pas roli przestaje być zdaniem bez „ale", i to musi być powiedziane głośno
w samym pliku roli, inaczej następny agent potraktuje granicę jako orientacyjną.

## Fazy

Każda ścieżka niesie klauzulę, która ją wymusza. Fale wynikają z **przecięcia zbiorów plików**, nie
z tematu: F3, F4 i F5b wszystkie dotykają `agents/*.md`, więc nie mogą iść równolegle.

### Fala 1 — pięć zadań równolegle, zbiory rozłączne

#### F1 — przenośny `sed` w graphify-setup

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/graphify-setup.md` | F1.1, F1.2 |

- **F1.1** — wariant działający na GNU i BSD/macOS. Preferowana forma: bez `-i`, przez plik
  tymczasowy i `mv`, co jest przenośne bez rozgałęziania na `uname`.
- **F1.2** — krok kończy się **weryfikacją, że podmiana nastąpiła** (`grep` na wzorcu, który po
  poprawnym przebiegu MUSI nie trafić), bo klasa tego defektu to cichy no-op, a nie zła składnia.

**Done-when:**
```
przed:  plik z '"C:/Users/x/graphify.exe ' w treści
po:     grep -c '"[^"]*/graphify' → 0        · zawartość podmieniona
fixture, który MUSI NIE strzelić: plik już poprawny → krok kończy się cicho, exit 0
weryfikacja z F1.2 uruchomiona na obu → w pierwszym potwierdza, w drugim nie fałszuje
```

#### F2 — checklist widzi husky

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/repo-done-checklist.md` | F2.1, F2.2 |

- **F2.1** — przed sprawdzeniem hooka odpytaj `git config core.hooksPath`; gdy ustawione, sprawdzaj
  tam, nie w `.git/hooks/`.
- **F2.2** — gdy hooka nie ma **nigdzie**, komunikat rozróżnia „nie zainstalowany" od „nie umiem
  sprawdzić", bo instrument, który oblewa poprawną pracę, jest gorszy niż jego brak.

**Done-when:**
```
repo bez core.hooksPath, hook w .git/hooks/post-commit   → OK
repo z core.hooksPath=.husky, hook tam                    → OK   (dziś: MISS — to jest defekt)
repo z core.hooksPath=.husky, hooka brak                  → MISS, nazywa sprawdzoną ścieżkę
```

#### F5a — lista narzędzi MCP przeciw realnemu serwerowi

| Plik | Wymuszony przez |
|---|---|
| `tools/mcp-toolnames-check.js` + test | F5.1, F5.2, F5.3 |

- **F5.1** — zbierz unię nazw `mcp__chrome-devtools__*` z `agents/qa.md`, `fe-dev.md`, `designer.md`
  i porównaj z listą narzędzi zainstalowanego serwera.
- **F5.2** — **obie strony różnicy są wynikiem**: nazwa w roli, której serwer nie ma (rola zawiedzie
  w połowie bramki, na żywej aplikacji), i narzędzie serwera, którego nie ma żadna rola (zdolność
  cicho niedostępna).
- **F5.3** — brak serwera to **jawny SKIP z powodem**, nigdy cisza i nigdy PASS. To ten sam protokół,
  co przy archify i graphify.

**Done-when:**
```
node tools/mcp-toolnames-check.test.js                    → 0 failing
fixture: rola nazywa nieistniejące narzędzie              → exit 1, nazywa rolę i narzędzie
fixture: serwer oferuje narzędzie, którego nikt nie ma    → exit 1, nazywa narzędzie
fixture: listy zgodne                                     → exit 0   (MUSI NIE strzelić)
brak serwera                                              → "SKIP: <powód>", exit 0, nie PASS
```
**Nie edytuje żadnego `agents/*.md`** — to należy do F5b, po F4. Ta faza dostarcza pomiar; co z nim
zrobić, wynika z jego wyniku.

#### F6 — kryterium `lead-delegates` w obie strony

| Plik | Wymuszony przez |
|---|---|
| `evals/lead-delegates-instead-of-bulk-coding.md` | F6.1, F6.2 |

- **F6.1** — kryterium żąda uzasadnienia **także przy delegowaniu**, bo to źródło
  (`delegation-threshold.md`) tak mówi, a to jest droższa strona tej samej pomyłki.
- **F6.2** — w scenariuszu ląduje ostrzeżenie, że notatka `Last run:` opisuje zachowanie agenta,
  a nie treść kryterium. Ta pomyłka kosztowała jedno błędne zamknięcie w audycie tego speca.

**Done-when:** kryterium żąda powodu w obu kierunkach · scenariusz przemielony i uruchomiony,
`Last run:` z werdyktem i wehikułem · `eval-status.js` nie pokazuje go wśród „did not record a PASS".

#### F7 — kryterium `lead-checks-second-order-effect`, arm 2 · **agent w izolacji**

| Plik | Wymuszony przez |
|---|---|
| `evals/lead-checks-second-order-effect.md` | F7.1 |

- **F7.1** — kryterium rozdziela **przyjęcie uzasadnienia workera** od **przyjęcia jego decyzji
  zastępczej**; dziś je zlepia i przez to oblewa poprawną odpowiedź.

**Wykonuje agent, który nie widział werdyktu z 2026-08-01** — decyzja z backlogu i ta sama izolacja,
którą framework wymusza przy `checkerze`. W briefie nie wolno zacytować, jak tamten przebieg poszedł.

**Done-when:** kryterium rozstrzyga oba przypadki osobno · ramię, które 2026-08-01 dostało FAIL po
literze przy zachowanej własności chronionej, przechodzi · scenariusz uruchomiony, `Last run:` zapisany.

#### F8a — pięć zaległych delt architektury

| Plik | Wymuszony przez |
|---|---|
| `docs/architecture/` (te diagramy, które wydania zmieniły) | F8.1 |
| `.ai/docs-deltas/` (kwit `.json` na wydanie) | F8.2, F8.3 |

- **F8.1** — odśwież diagramy, których dotknęły 1.25.2, 1.26.0, 1.27.0, 1.27.1, 1.27.2.
- **F8.2** — kwit `.json` na wydanie; HTML zostaje niecommitowany, zgodnie z rozstrzygniętą już
  zasadą (`archify-setup.md:95-102`).
- **F8.3** — **pusta delta JEST dowodem** i ma zostać zapisana jako pusta. Wydanie, które nie zmieniło
  architektury, ma o tym mówić, a nie milczeć.

**Done-when:** pięć kwitów w `.ai/docs-deltas/` · każdy z `semanticSha256` · `compare` uruchomiony
**dwa razy** na jednym z nich z identycznym wynikiem (kwit jest dowodem tylko wtedy, gdy się
odtwarza) · `git status` czysty poza `docs/` i `.ai/`.

### Fala 2 — F4, wyłączny właściciel `agents/` i bliźniaków

#### F4 — fallback pliku statusu

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/agent-team-structure.md` | F4.1, F4.2 |
| `agents/{be-dev,fe-dev,tester,designer,docs-author,team-lead}.md` | F4.1, F4.3 |
| `codex-agents/*.toml` (te same sześć) | F4.4 |

- **F4.1** — gdy zapis pliku statusu poza worktree zawiedzie, worker pisze
  `<worktreePath>/.claude/status/<id>.md` **i mówi o tym w raporcie**. Degradacja zamiast awarii.
- **F4.2** — powód zapisany przy regule: mechanizm stoi na asymetrii harnessu, której nie posiadamy
  (`Write` odmawia ścieżki spoza worktree, `Bash` nie), i aktualizacja Claude Code może ją zamknąć
  w dowolną stronę. Bez tego zdania następny czytelnik uzna fallback za nadmiarowy.
- **F4.3** — po stronie lidera: gdy pliku nie ma w katalogu głównym, **przeszukaj worktree, zanim
  uznasz „nigdy nie wystartował"**. To jest odczyt, który dziś daje fałszywy negatyw.
- **F4.4** — parytet bliźniaków zielony.

**Done-when:**
```
node codex-agents/parity.test.js                                    → all passed
npm test                                                             → all passed
grep -c "\.claude/status/" skills/sailes-bootstrap/agent-team-structure.md   → ≥1
reguła przeszukania worktree obecna w agents/team-lead.md z warunkiem
  „zanim uznasz never started"                                      → grep trafia
```

### Fala 3 — po F4

- **F3** — `.claudeignore` jako jawny wyjątek w `agents/docs-author.md` + bliźniak + zdanie w
  `archify-setup.md:86` wskazujące, że to jedyne wyjście poza pas; przemielony
  `evals/docs-author-stays-in-lane.md` tak, by tolerował dokładnie tę ścieżkę i **żadnej innej**.
  **Done-when:** wyjątek nazwany w obu plikach roli · eval przepuszcza `.claudeignore` i oblewa
  dowolny inny zapis poza pasem (fixture w obie strony) · parytet zielony · scenariusz uruchomiony.
- **F5b** — zastosuj wynik F5a, **jeśli coś znalazł**. Pusty wynik jest wynikiem i zamyka fazę.
- **F8b** — domknięcie obu speców: `.ai/specs/2026-08-01-milestone-lessons-to-doctrine.md` ma
  nagłówek mówiący „Nic nie jest wypchnięte na `main`", gdy 1.25.2 i 1.26.0 są na produkcji od
  2026-08-02 — najpierw prawda w nagłówku, potem `git mv` do `implemented/`, i tylko po kwicie z F8a.

### Fala 3b — dwie fazy dopisane w trakcie, obie z pomiaru

#### F9 — guard przepuszcza ścieżkę względną · **najpoważniejsze znalezisko dnia**

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/hooks-template/guard-protected-paths.sh` | F9.1 |
| `skills/sailes-bootstrap/hooks-template/hooks-template.test.js` | F9.2 |

Znalezione przez ewaluację `adopt-builds-graph`, która oceniała co innego. **Odtworzone przeze mnie
bezpośrednio:**

```
{"tool_name":"Edit","tool_input":{"file_path":"migrations/003_deals.sql"}}      → exit 0  PRZEPUSZCZONE
{"tool_name":"Edit","tool_input":{"file_path":"/d/repo/migrations/003_deals.sql"}} → exit 2  zablokowane
```

Wzorzec (`:85`) to `*'/migrations/'*|*'\migrations\'*` — wymaga wiodącego separatora. Forma
względna jest tą, którą agent pisze najczęściej, bo tak wygląda ścieżka w `git status` i w prozie
briefu. **Ten hook trafia do każdego repo klienta**, a chroni migracje, `.env.production`
i materiał kluczowy. Klasa: guard, który wygląda na działający, bo testy sprawdzały formę
bezwzględną.

- **F9.1** — dopasowanie musi łapać segment na początku ścieżki, nie tylko po separatorze, i to dla
  **każdej** chronionej ścieżki w pliku, nie tylko dla `migrations/`. Sprawdź cały zestaw; jeśli
  wzorzec powtarza się w kilku miejscach, defekt też.
- **F9.2** — każdy chroniony segment dostaje **parę** przypadków: względny i bezwzględny, oba muszą
  blokować. Plus fixture, który MUSI NIE strzelić — ścieżka zawierająca chroniony wyraz jako część
  dłuższej nazwy (`src/migrations-guide.md`, `docs/env.production-notes.md`) i przechodząca.

**Done-when:**
```
dla KAŻDEJ chronionej ścieżki: forma względna → exit 2 · forma bezwzględna → exit 2
sąsiedztwo nazwy (src/migrations-guide.md) → exit 0    (fixture, który MUSI NIE strzelić)
mutacja: cofnij wzorzec do stanu sprzed poprawki → test czerwony, nazywa ścieżkę → przywróć → zielony
npm test → all passed
```

#### F5b — `type_text` dla `qa`, dwa pozostałe świadomie odpuszczone

| Plik | Wymuszony przez |
|---|---|
| `agents/qa.md` · `codex-agents/qa.toml` | F5b.1 |
| `tools/mcp-toolnames-check.js` (+ test) | F5b.2 |

Decyzja człowieka 2026-08-02, na podstawie pomiaru F5a przeciw żywemu serwerowi.

- **F5b.1** — `mcp__chrome-devtools__type_text` dodane do `qa`. Powód: `fill` **ustawia wartość**,
  nie wysyła klawiszy; contenteditable, edytor rich-text, autocomplete i pola maskowane słuchają
  `keydown` i po `fill` nie robią nic — cicho. `qa` przepędza realne flow, więc trafi na to
  w połowie bramki, na żywej aplikacji. Ten sam kształt co `handle_dialog` w 1.17.1.
- **F5b.2** — lista odstąpień z powodem: `get_console_message` (pojedynczy odczyt, gdy
  `list_console_messages` jest już przyznane) i `take_heapsnapshot` (profilowanie pamięci, którego
  żadna doktryna nie żąda). Check **przechodzi**, ale je **wypisuje** jako świadomie pominięte.
  Nowe narzędzie serwera bez wpisu nadal oblewa — odstąpienie jest imienne, nie globalne.

**Done-when:**
```
check przeciw żywemu serwerowi → exit 0, wypisuje dwa odstąpienia z powodami
fixture: narzędzie serwera BEZ wpisu odstąpienia → exit 1   (odstąpienie nie jest globalne)
node codex-agents/parity.test.js → all passed
```

### Fala 4 — bramki i wydanie

`checker` na całości diffu (izolowany kontekst, bez narracji autora) → poprawki → STATE.md,
`.ai/runs/`, CHANGELOG, pięć stempli na 1.28.0 → merge do `main`, **czyli deploy**.

## Integration coverage

| Powierzchnia | Dowód |
|---|---|
| `graphify-setup` sed | fixture w obie strony: plik do podmiany i plik już poprawny |
| `repo-done-checklist` | trzy konfiguracje repo, w tym husky z hookiem — dziś jedyny FAIL |
| `mcp-toolnames-check` | test na obu kierunkach różnicy + na zgodności + na braku serwera |
| fallback statusu | parytet + test + reguła przeszukania worktree u lidera |
| pięć delt | `compare` odtworzony dwukrotnie na jednym kwicie |
| trzy evale | każdy uruchomiony, `Last run:` z wehikułem; F7 przez agenta bez dostępu do werdyktu |

## Non-goals — świadomie poza zakresem, nie zapomniane

- **Karty decyzyjne (backlog w. 53)** i **audyt prozy ról (w. 47)** — wybór Q1. Pierwsze jest
  własnym specem z fazami, drugie STATE.md wprost odradza przy sieci regresyjnej 29/44 STALE.
- **Trzy promotion candidates** (w. 55 kwit odtwarzalny, w. 56 trzeci stan SKIP, w. 61 lint bez
  implementacji) — małe, ale to promocje reguł, nie naprawy defektów.
- **Pozostałe ~23 stale evale** — wybór Q2: mielimy tylko te, których pliki ten spec dotyka.
- **Naprawa asymetrii `Write`/`Bash`** — nie nasz kod. Framework dostaje obejście i zgłoszenie.
