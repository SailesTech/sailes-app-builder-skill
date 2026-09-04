# Spec: an empty return is measured, not read — the deterministic half of the backstop

Status: **Proposed** · nie zmergowane, czeka na Karola
Autor: sesja 2026-09-04 (Olaf) · Źródło pomysłu: `github.com/overment/limen` (MIT)
Branch: `feat/worker-return-measured`

## TLDR & Context

Limen — harness „one-human-many-agents" opublikowany 14.08.2026 — trzyma stan każdego joba jako
katalog plików i sprowadza pytanie „czy worker cokolwiek zrobił" do jednej linijki:

```ts
producedNothing(toolCalls, commits) => toolCalls === 0 && commits === ""
```

Ten spec przenosi **mechanikę, nie narzędzie**. Limena nie zaciągamy: wymaga `pi` na PATH, czyli
drugiego harnessu obok Claude Code, obok skilli, hooków i MCP. To decyzja tej samej klasy co
Ori/OpenRouter z 2026-09-04, gdzie wnioskiem było „eksperyment tylko na repo wewnętrznym".

## Problem Statement

Framework **ma już regułę**: „an idle signal carrying no report is never a completion"
(`agents/team-lead.md` §Agent lifecycle, od 1.9.0), łącznie z rozstrzygnięciem konfliktu z regułą
o zwalnianiu bezczynnych agentów i z prewencją „name a FILE in the brief". Ma też eval, który to
sprawdza — `lead-chases-an-empty-worker-return`, PASS 2026-07-28.

Czego nie ma, i co ten eval sam o sobie mówi:

> **No mechanical backstop exists**: no hook observes a subagent completing (verified 2026-07-18).
> This eval is therefore the only thing standing between the rule and silent regression.

Dowodem, na którym opiera się dziś lead, jest **wiadomość workera** — jedyny artefakt, który
istnieje niezależnie od tego, czy praca się wydarzyła. Reguła „no file = task not done" każe
przeczytać plik, ale nic nie mówi, że plik utworzony i pusty spełnia jej literę i nic poza nią.

Groźniejszy kształt niż pusty zwrot: worker **coś** zrobił, opisał to dobrze, a artefaktu, którego
potrzebuje bramka, nie ma albo jest pusty. Nic w dole potoku nie odróżni tego od sukcesu, dopóki
bramka nie otworzy pliku.

## Znalezisko poboczne, które trzeba osobno rozstrzygnąć

**`SubagentStop` i `SubagentStart` są dziś udokumentowanymi eventami hooków Claude Code.**
Fakt, na którym opiera się `lead-chases-an-empty-worker-return` („no hook observes a subagent
completing, verified 2026-07-18"), przestał być prawdziwy. Event dostaje `agent_id`, `agent_type`,
`transcript_path` i `last_assistant_message`, i przyjmuje matcher po `agent_type`.

Ustalone z dokumentacji, **nie zweryfikowane empirycznie w tej sesji** — nie odpalono hooka, nie
obejrzano realnego JSON-a na stdin. Zgodnie z regułą tego repo („drive the hook the way Claude Code
does") to jest hipoteza do sprawdzenia, nie podstawa do budowy. Dlatego hook jest Open Question,
a nie zakresem.

## Decisions (podjęte w tej sesji)

1. **Instrument uruchamiany, nie obserwujący.** Rdzeń to skrypt, który lead wywołuje — zero blast
   radius, deterministyczny, testowalny w `npm test`. Hook obserwujący jest jakościowo lepszy
   i dlatego wymaga własnej decyzji człowieka, nie przemycenia w tym PR.
2. **Mierzymy treść, nie istnienie.** Plik utworzony i pusty to nie deliverable.
3. **`NOT-COMPUTABLE` jest własnym werdyktem i nigdy nie zwija się do `PRODUCED`** — ten sam
   powód, dla którego `eval-status.js` trzyma `NO-FILES` osobno: zwrot, którego substancji nie da
   się policzyć, nie może czytać się jak substancjalny.
4. **`NOT-COMPUTABLE` osądza brief, nie workera.** Reakcją jest poprawa briefu, nie pościg.

## Proposed Solution

`tools/worker-return-check.js` — zero zależności, CommonJS, czyta dysk i git, drukuje werdykt:

**O werdykcie decydują wyłącznie nazwane deliverables. Diff jest drukowany jako kontekst i nie ma
głosu** — `git diff` opisuje drzewo i nie potrafi przypisać ani jednego bajtu konkretnemu workerowi.

| Werdykt | Kiedy | Exit |
|---|---|---|
| `PRODUCED` | każdy nazwany deliverable istnieje i ma treść | 0 |
| `PARTIAL` | część nazwanych ma treść, część nie | 0 |
| `EMPTY-RETURN` | żaden nazwany deliverable nie ma treści | 1 |
| `NOT-COMPUTABLE` | brief nie nazwał pliku — zwrotu nie da się ocenić w żadną stronę | 2 |

```
PRODUCED · explorer:auth · deliverables 1/1 · tree 3f +142/-8 (unattributed)
  .ai/findings/auth-map.md — 2841B content, 96 lines
```

## API & UI Surface (powierzchnia frameworku)

- `node tools/worker-return-check.js --deliverable <path> [--deliverable <path>…] [--base <ref>] [--label <text>] [--cwd <dir>] [--json]`
- `agents/team-lead.md` §Agent lifecycle — akapit „read it with an instrument, not an impression"
- `codex-agents/team-lead.toml` — bliźniacza klauzula (inne zdanie, ten sam koncept)
- `codex-agents/parity.test.js` — nowy invariant na parę, żeby edycja jednej strony wymuszała drugą

## Phasing & Steps

**Faza 1 — instrument (ZROBIONA w tym branchu).** `tools/worker-return-check.js` +
`tools/worker-return-check.test.js` (22 asercje, każdy przypadek detekcji sparowany z przypadkiem
„nie może oflagować dobrej pracy"), wpięte w `npm test`. Fixtures CRLF, bo repo jest CRLF na dysku.
Po przeglądzie `checker` (`.ai/audits/2026-09-04-worker-return-checker.md`, werdykt NITS) tryb
tekstowy nazywa **powód** niedostępności gita — bez tego „nie ma repo" i „podałeś nieistniejący
`--base`" drukowały te same trzy słowa, czyli instrument, którego nie da się zdiagnozować.

**Faza 2 — doktryna (ZROBIONA).** Akapit w `agents/team-lead.md`, bliźniak w TOML-u, invariant
w `parity.test.js`.

**Faza 3 — eval (NAPISANY, NIEURUCHOMIONY).**
`evals/lead-measures-the-return-before-logging-it.md`, dwa ramiona: (A) pewny raport workera vs
pusty plik — wygrywa plik; (B) `NOT-COMPUTABLE` czytane jako defekt własnego briefu. Status
`NEVER-RUN`: scenariusz, który nigdy nie pobiegł, nie jest siatką regresyjną.

**Faza 4 — hook (NIE ZROBIONA, bramkowana Q1).** Patrz Open Questions.

## Open Questions — czekają na człowieka

**Q1. Czy powstaje hook `SubagentStop`, który mierzy bez proszenia?**
To jedyna wersja, która realnie zamyka lukę opisaną w evalu, bo nie zależy od tego, czy model
pamięta o uruchomieniu skryptu.

**Argument „blast radius" osłabł i trzeba to powiedzieć wprost.** Pierwsza wersja tego specu
wstrzymywała hook, bo „zmienia zachowanie w każdym repo na maszynie". Adwersarz pokazał, że repo
rozwiązało ten problem miesiące temu: `hooks/workflow-router.js:71` — `if (!isSailesRepo(root)) return;`.
Wzorzec istnieje i działa. Zostają dwa realne koszty: (a) kształt JSON-a na stdin **nie został
sprawdzony empirycznie**, a reguła repo brzmi „drive the hook the way Claude Code does";
(b) `SubagentStop` nie zna briefu, więc nie wie, który plik był deliverable — policzy wpisy
`tool_use` w `transcript_path` (odpowiednik `toolCalls` z Limena), ale nie „czy powstał artefakt".
Hook i skrypt mierzą **różne rzeczy** i jeden nie zastępuje drugiego.

**Q2. Czy `tools/` to właściwe miejsce?**
Nowy katalog. Alternatywy: `evals/harness/` (myli — harness ocenia framework, nie służy rolom
w produkcji) albo przy skillu (`skills/sailes-implement/`), gdzie dziś leżą tylko `.md` i test
grepujący `.md`. `tools/` to pierwszy skrypt uruchamiany **przez rolę w trakcie pracy**, nie przez
maintainera repo — stąd rekomendacja. Przeniesienie to jeden `git mv` plus dwie ścieżki.

**Q3. Czy `--base` powinien być wymagany, gdy worker pracował w worktree?**
Dziś bez `--base` porównanie idzie do `HEAD` (working tree). Dla workera w izolowanym worktree
właściwym punktem odniesienia jest punkt rozgałęzienia. Skrypt to umie (`--base`), ale doktryna
tego nie wymaga i lead może pominąć.

## Non-Goals

- **Katalog stanu jobów na dysku (`.ai/jobs/<id>/` w stylu Limena) — świadomie NIE.** Framework
  ma już `.ai/STATE.md` i `.ai/runs/`, które robią to samo (przeżycie resetu kontekstu, wznowienie
  bez re-derywacji planu). Trzeci nośnik tej samej informacji to trzecia szansa na dryf.
- **Budżet per rola — NIE, ale z węższego powodu, niż napisano w pierwszej wersji tego specu.**
  Pierwotne zdanie („nie da się, bo `Agent` nie przyjmuje limitu") **obalił adwersarz**:
  `agents/validate-frontmatter.test.js:36` wymienia **`maxTurns`** wśród pól przyjmowanych przez
  Claude Code, a `team-lead.md:88` nazywa `TaskStop` ścieżką terminacji. Naprawdę niedostępne są
  **wall-clock timeout i cap na tool-calle** — to inna, węższa teza.
  Odrzucamy `maxTurns` z powodu, którego pierwsza wersja nie użyła: **limit tur ucina workera
  w locie**, a `.ai/runs/2026-07-25-eval-session-and-worker-lifecycle.md:36-40` zmierzył, że ucięty
  worker produkuje dokładnie ten pusty zwrot, który ten PR ma wyłapywać. Budżet turowy wytwarzałby
  awarię, którą instrument liczy.
- **`contain.ts` / `herdr.ts` z Limena** — dotyczą zabijania procesów systemowych i sterowania
  panelami; nie mamy czego kontenerować. (Dodatkowo `contain.ts` woła macOS-owe `proc_pidinfo`
  przez ruby, więc na Linuksie i WSL i tak zwraca `unavailable`.)

## Ryzyka

1. **Instrument, który trzeba pamiętać uruchomić, to nadal reguła behawioralna.** Zmienia klasę
   z „osądź wiadomość" na „wywołaj jedną komendę", co jest łatwiejsze do wyegzekwowania evalem —
   ale nie jest backstopem. Uczciwa nazwa tego PR-a to „deterministyczna połowa", nie „backstop".
2. **`PARTIAL` z exit 0 może być czytane jako sukces.** Świadome: częściowy zwrot bywa poprawnym
   stanem pośrednim (kod jest, raport dopiero powstaje), a exit 1 na to zmusiłby do obchodzenia
   instrumentu. Ryzyko realne, do obserwacji na pierwszych realnych przebiegach.
3. **Eval jest NEVER-RUN.** Doktryna wchodzi bez dowodu, że lead ją honoruje. To jest dokładnie ta
   luka, którą repo nazwało przy 1.1.0 („text Done-when passed; behavior unproven until re-run").

## Przegląd adwersaryjny — co obalił i co z tego weszło

Dwa niezależne przebiegi na czystym kontekście: `checker` (diff vs spec) i adwersarz z zadaniem
**obalenia** sześciu tez. Pełne zapisy: `.ai/audits/2026-09-04-worker-return-checker.md`
i `.ai/audits/2026-09-04-worker-return-adversary.md`.

`checker` zwrócił **NITS — approve**. Adwersarz odtworzył **cztery defekty w tym samym kodzie**,
w tym jeden, który wywracał całą tezę PR-a. Różnica metody jest sama w sobie ustaleniem: `checker`
weryfikował tablicę prawdy wobec testów, czyli model wobec własnej pracy. **Przy zmianie, której
tematem jest „mierz zamiast wierzyć opisowi", bramka zweryfikowała opis.**

| Teza | Werdykt | Co z tym zrobiono |
|---|---|---|
| C1 reguła jest, pomiaru nie ma | SURVIVES | bez zmian; przy okazji znaleziono drugi instrument z tą samą wadą (niżej) |
| C2 premisa evala nieaktualna | SURVIVES, wniosek w połowie obalony | Q1 przepisane: `isSailesRepo` unieważnia argument o blast radius |
| C3 budżetu nie da się zrobić | **REFUTED** | Non-Goal przepisany — `maxTurns` istnieje; odrzucamy go, bo ucięty worker produkuje pusty zwrot |
| C4 katalog jobów dublowałby STATE.md | SURVIVES (zawężone) | bez zmian |
| C5 pomiar bajtów jest wystarczający | **REFUTED** | `decide()` przepisane: diff stracił głos |
| C6 czy to nie teatr | UNRESOLVED — decyzja | zostaje dla Karola; rekomendacja adwersarza: naprawić i zmergować |

**Cztery odtworzone defekty, wszystkie naprawione w tym branchu:**

1. **Instrument nie potrafił przypisać bajtu do workera.** `git diff --numstat HEAD` obejmuje całe
   repo: worker, który nic nie dowiózł, dostawał `PRODUCED · diff 1f +1/-0`, bo **lead** dotknął
   jednego pliku. Mój własny test blokował to jako zachowanie zamierzone. Naprawa nie jest
   zastrzeżeniem przy liczbie — **diff stracił głos**; decydują wyłącznie nazwane deliverables.
2. **Pliki nieśledzone były niewidoczne.** `git diff` nigdy nie widzi nowego pliku, a to najczęstszy
   kształt artefaktu workera. Liczone osobno przez `git ls-files --others --exclude-standard`.
3. **0 z N deliverables dawało `PARTIAL` z exit 0** — dokładnie kształt, który §Problem Statement
   nazywa groźniejszym niż pusty zwrot. Dziś `EMPTY-RETURN`.
4. **`--base` porównywał `base...HEAD`**, czyli wyłącznie historię commitów — dla workera, który
   „nigdy nie commituje", zwracał `0f +0/-0` na realnej pracy. Dziś porównuje working tree, i ma
   pokrycie testowe, którego wcześniej nie miał wcale.

**Znalezisko poza zakresem, do backlogu:** `skills/sailes-bootstrap/repo-done-checklist.md:42`
testuje `-e`, czyli samo istnienie pliku — ta sama wada, którą ten PR naprawia u leada. PR, którego
tezą jest „istnienie to nie treść", zostawiał drugi existence-checker w repo nietknięty.
