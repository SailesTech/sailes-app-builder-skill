# Spec: a declaration is checked against the tree, and an empty file is not a deliverable

Status: implemented — evidence: `npm test` → exit 0 on 1.38.0 (rebased onto 1.37.0) · `node tools/worker-status.test.js` → all passed (+1 case 2026-09-24: files empty by convention) · `--verify` run from a client-shaped repo with no `tools/` via `${CLAUDE_PLUGIN_ROOT}` → flags `declared-not-changed` + `declared-empty`, exit 1 · mcp-toolnames-check against a silent server: 1.37.0 `exit 124`, 1.38.0 exit 0 · checker: **CHANGES-REQUIRED → APPROVE** (design-artifact block collapsed EMPTY into MISS; fixed to OK/EMPTY/MISS, exercised on three fixtures) · qa: **n/a — brak działającej aplikacji w repo frameworka** · release 1.38.0, 2026-09-24 · branch `feat/status-declaration-verified`, base 1.32.0
Autor: sesja 2026-09-04 (Olaf) · Źródło pomysłu: `github.com/overment/limen` (MIT)

## Co to realnie zmienia

Trzy rzeczy, wszystkie wąskie:

1. **`tools/worker-status.js --verify` czyta deklarację workera wobec repozytorium.** Dotąd
   narzędzie sprawdzało plik statusu **wobec niego samego** — czy `commit` wygląda jak sha, czy
   `outcome` jest ze słownika, czy `touched` jest listą. Deklaracja wewnętrznie doskonała i
   faktycznie fałszywa przechodziła. Trzy sprawdzenia, które `agents/team-lead.md` nakłada dziś
   na leada jako **ręczne kroki**, robi teraz komenda.
2. **Zadeklarowany plik może istnieć i nic nie zawierać** — i to jedyne sprawdzenie, którego nie
   ma nigdzie w tym repo. Plik da się utworzyć, zacommitować i zobaczyć w diffie, a `-e`, linia
   diffa i walidacja kształtu przepuszczą go pusty.
3. **`repo-done-checklist.md` przestaje certyfikować puste pliki.** Testował `-e`; teraz odróżnia
   `MISS` (nie ma) od `EMPTY` (jest, nic nie trzyma) — bo naprawa jest inna, więc i słowo musi być.

Plus dwie rzeczy znalezione po drodze, obie o `npm test` na czystym `main`, obie tego samego
kształtu — **bramka zawodzi z powodu niezwiązanego z tym, co ocenia**: 6 failing z powodu markerów
CRLF, i **zawieszenie, które zatrzymywało cały suite**.

## Problem

`worker-status.js` (1.27.0) rozwiązał trzy stany, które były jedną ciszą: brak pliku = nigdy nie
wystartował, plik bez `closed:` = umarł w trakcie, plik zamknięty = deklaracja. To działa i ten spec
tego nie rusza.

Czego nie rozwiązał: **deklaracja nie jest z niczym porównywana.** `evaluateFile` czyta plik i
grzeczy go wobec kontraktu — i każde z tych sprawdzeń przechodzi na deklaracji, która jest
poprawnie ukształtowana i nieprawdziwa, bo żadne z nich nie sięga do repozytorium.

`agents/team-lead.md` (§Agent lifecycle) zna ten obowiązek i nakłada go na człowieka:

> **You verify the file against the worktree — metadata only**: does `commit` exist, does `touched`
> match `git diff --stat`, was `base` current.

Trzy ręczne kroki, w miejscu, którego cała reszta mechanizmu istnieje po to, żeby nie ufać
samoopisowi. To jest ta sama asymetria, którą repo nazwało przy izolacji bramek: raport agenta o
sobie nie jest dowodem — a deklaracja workera o sobie była nim traktowana.

## Czwarte sprawdzenie, którego doktryna nie nazywa

Plik można utworzyć, zacommitować, wypisać w `git diff --name-only` — i nie zapisać w nim ani
jednego znaku. Wtedy: `-e` mówi OK, linia diffa mówi „zmieniony", `touched` się zgadza, kształt
deklaracji jest poprawny. **Nic w tym repo nie patrzy, czy plik cokolwiek trzyma.**

Ta sama wada żyła w `repo-done-checklist.md:42` (`[ -e "$ROOT/$f" ]`) — a to jest instrument, po
którym człowiek poznaje, że repo jest gotowe, czyli dokładnie wtedy, gdy sam nie zagląda.

## Rozwiązanie

`node tools/worker-status.js --verify <file> --worktree <path>` na **zamkniętej** deklaracji:

| Sprawdzenie | Co łapie |
|---|---|
| `commit` istnieje (`git cat-file -e`) | `done` wskazujące na nic — kształt sha tego nie widzi |
| `touched` vs `git diff --name-only base..commit`, **w obie strony** | plik zadeklarowany a niezmieniony **oraz** zmieniony a niezadeklarowany; drugi kierunek jest tym, którego człowiek skanujący listę nie zauważy |
| `base` jest przodkiem commita | worker odgałęziony od nieaktualnej bazy — diff czyta się czysto i wchodzi w coś innego |
| każdy zadeklarowany plik ma treść | plik istnieje, jest w diffie i jest pusty |

Kontrakt narzędzia zostaje bez zmian (Q3 specu 2026-08-01): **raportuje, nigdy nie blokuje.**
Komunikat mówi to wprost — `REPORT this into the verdict and the run log; do NOT block integration
on it` — bo to repo ma dwa udokumentowane przypadki wyłączenia bramki za fałszywe alarmy.

Każda ścieżka gitowa, która padnie, zwraca **„nie dało się ustalić"**, nigdy „nie" — instrument,
który melduje brak, gdy tylko nie zdołał spojrzeć, to ten sam cichy fałsz, który ten spec naprawia.

## Decyzje

1. **Rozszerzenie istniejącego narzędzia, nie nowe.** Pierwsza wersja tej pracy była osobnym
   `worker-return-check.js` — i była duplikatem, bo powstała na rekonesansie z 1.24.0. Drugie
   narzędzie do tego samego problemu to trzecia szansa na dryf.
2. **`EMPTY` jest własnym słowem, nie odmianą `MISS`.** Naprawa jest inna: napisz to vs utwórz to.
3. **Sprawdzenie treści = jakikolwiek znak niebiały.** Nie próg długości — próg wymagałby
   uzasadnienia liczbowego, którego nie mamy, a „jeden znak to treść" ma test.
4. **Naprawa cudzego testu wchodzi do tego PR-a**, bo bez niej nie da się uczciwie powiedzieć
   „`npm test` zielony" — a to jest zdanie, na którym opiera się cały dowód.

## Non-goals — rozstrzygnięte, nie odłożone

- **Hook `SubagentStop`.** `SubagentStart`/`SubagentStop` są dziś udokumentowanymi eventami, a
  argument o blast radius jest słaby, bo `hooks/workflow-router.js:71` (`if (!isSailesRepo(root)) return;`)
  rozwiązał go dawno. Mimo to: **nie w tym PR i nie jako pytanie.** Powód jest rzeczowy — hook
  dostaje `agent_id` i `transcript_path`, ale **nie zna briefu**, więc nie wie, który plik był
  deliverable. Policzyłby wywołania narzędzi, czyli aktywność, nie wynik. Mechanizm `.claude/status/`
  już dziś daje mocniejszy sygnał (claim przed startem, trzy stany, atrybucja per worker), więc hook
  dokładałby słabszy pomiar obok mocniejszego.
- **Budżet per rola (timeout, cap wywołań).** `maxTurns` istnieje w frontmatterze ról
  (`agents/validate-frontmatter.test.js`), więc „nie da się" jest nieprawdą. Odrzucone z powodu
  rzeczowego: **limit tur ucina workera w locie**, a `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md`
  zmierzył, że ucięty worker zostawia dokładnie ten pusty zwrot, który cały ten mechanizm liczy.
  Budżet turowy wytwarzałby awarię, którą mierzymy.
- **Katalog stanu jobów w stylu Limena.** `.claude/status/` **jest** tym katalogiem, zbudowanym
  wcześniej i lepiej.

## Historia tej zmiany, bo jest częścią ustalenia

Pomysł przyszedł z Limena — `producedNothing(toolCalls, commits)`. Pierwsza wersja tej pracy
przenosiła cztery mechanizmy naraz i powstała **na rekonesansie `main` z 1.24.0, przy `origin/main`
na 1.32.0**. Trzy z czterech miały już w repo mocniejsze odpowiedniki, zbudowane między 1.27.0
a 1.32.0. Ten PR jest tym, co z tamtego zostało po porównaniu z aktualnym stanem: jedno sprawdzenie,
którego naprawdę nie było, wpięte w narzędzie, które już istnieje.

## Dwie awarie bramki, znalezione po drodze i naprawione

Obie dotyczą `npm test` na **czystym `main`**, obie zmierzone przed jakąkolwiek zmianą w tym branchu.
Naprawa obu wchodzi tutaj, bo bez nich zdanie „suite zielony" jest niesprawdzalne — a na nim stoi
cały dowód tej zmiany.

**(1) 6 failing w `repo-done-checklist.test.js`.** Pięć markerów napisano z literalnym `\r\n`,
a każdy checkout z `core.autocrlf=input` — czyli każdy WSL i Linux — kładzie na dysku LF.
Normalizacja przy odczycie, trzy linie.

**(2) `mcp-toolnames-check.test.js` wypisywał „all tests passed" i wisiał.** To było groźniejsze
od czerwonego testu: `npm test` łączy testy przez `&&`, więc **jedno zawieszenie zatrzymywało cały
suite** — każdy test po nim nigdy nie ruszał, a przebieg czytał się jak „jeszcze idzie", nie jak
„padł". Ta sesja dwa razy wzięła `EXIT=124` timeouta za sukces, zanim to zauważyła.

Objaw: `process.getActiveResourcesInfo()` po zakończeniu asercji zwracał
`["PipeWrap","PipeWrap","PipeWrap","PipeWrap"]` i nic więcej — cztery otwarte pipe'y trzymały pętlę
zdarzeń.

**Przyczyna leży piętro niżej i jest platformowa.** `spawn(..., { shell: true })` sprawia, że
bezpośrednim dzieckiem jest `sh -c "<komenda>"`, a serwer MCP jest jego **wnukiem**. `child.kill()`
sygnalizuje wyłącznie powłokę; wnuk zostaje żywy i trzyma pipe'y. Windowsowa gałąź
`killSpawnedTree` robi `taskkill /t`, czyli chodzi po drzewie — **dlatego defekt nie objawia się na
Windowsie i dlatego przeżył w repo niezauważony.**

Pierwsza wersja tej naprawy zamykała pipe'y i była **plastrem**: zdejmowała objaw i zostawiała
**jeden osierocony proces na każde wywołanie** (zmierzone). To gorsze niż zawieszenie — zawieszenie
widać, wyciek procesów nie. Właściwa naprawa: `detached` poza Windowsem tworzy grupę procesów,
a `killSpawnedTree` zabija **grupę**, nie proces. Zamykanie pipe'ów zostaje jako druga linia.

Zabijamy wyłącznie grupę, którą sami utworzyliśmy — to jest ten przypadek „zidentyfikowane po tym,
co sami uruchomiliśmy", którego wymaga reguła `AGENTS.md` o zabijaniu procesów, nigdy zamiatanie
cudzych PID-ów.

| | nienaprawiony `main` | po naprawie |
|---|---|---|
| osierocone procesy po jednym wywołaniu | **1** | **0** |
| `node tools/mcp-toolnames-check.test.js` | **exit 124** (wisi) | **exit 0** |
| dwie nowe asercje (pipe + osierocony proces) | **2 failing** | zielone |

Dowód mutacyjny na osobnym worktree z `origin/main`: obie asercje skopiowane na nienaprawiony kod
padają, **każda samodzielnie** — kolejność w pliku jest ustawiona tak, żeby żadna nie sprzątała po
drugiej. Testy wykrywają defekt, nie odzwierciedlają naprawy. Asercja o pipe'ach mierzy tablicę
zasobów, nie czas: na tej maszynie asercja czasowa byłaby generatorem flake'ów, a defektem nie jest
wolność, tylko nieoddany handle. Asercja o procesach self-SKIP-uje na Windowsie, gdzie `taskkill /t`
już to załatwia.

## Weryfikacja

- **`npm test` — exit 0, cały łańcuch, 449 asercji, zero awarii.** Pierwszy przebieg w tej sesji,
  który w ogóle doszedł do końca; wcześniejsze kończyły się timeoutem na (2).
- `node tools/worker-status.test.js` — **11 nowych asercji**, każda flagująca sparowana z przypadkiem
  „nie może oflagować prawdomównej deklaracji". Fixtures budują prawdziwe repo git z bazą i commitem.
- `node skills/sailes-bootstrap/repo-done-checklist.test.js` — zielony (był czerwony na `main`).
- `node codex-agents/parity.test.js` — nowy invariant, więc edycja jednej strony wymusza drugą.
- Bez bumpa `VERSION`, bez nowej zależności, bez zmiany kontraktu istniejących trybów
  (`<file>` i `--sweep` nietknięte).
