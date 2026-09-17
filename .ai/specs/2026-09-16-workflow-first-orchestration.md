# Spec: Workflow jako silnik wykonania — role Sailes, koszt i spec gotowy do dispatchu

Status: approved — 2026-09-16 przez właściciela ("no to zacznij realizowac"); pre-implement: READY-WITH-FIXES → poprawki wpisane (`.ai/audits/2026-09-16-pre-implement-workflow-first.md`)
Framework-Version target: 1.35.0
Weight: contract fix × 5 powierzchni — doktryna orkestracji (nowy plik + `team-lead.md` +
        `agent-team-structure.md`), szablon specu (pola fazy), `tools/ownership-check.js` (tryb specu),
        `tools/token-report.js` (układ workflow), jeden hook `PreToolUse`. Nie rusza modelu danych ani tierów ról.
Source: `~/Work/Internal/sailes-feedback/2026-09-16-idealny-wzrok-diagnoza-i-workflow.md`;
        research `~/Work/Internal/sailes-feedback/2026-09-16-research-workflow/` (`findings.md`, `costs.md`,
        `practices.md`, `spec.md`, `external.md`; workflow `wf_c7c25bee-3b3`).
Supersedes: `.ai/specs/2026-08-06-spec-carries-the-execution-plan.md` (draft) — Q1 poniżej.
Sibling: spec B (diagnose/hosting z tego samego feedbacku) — osobno, po zamknięciu tego.

## TLDR

Zespół realizuje fazy przez narzędzie Workflow, a framework nie ma o nim ani słowa: zero odwołań do
`agent()`, `agentType`, `StructuredOutput`, `resumeFromRunId` w `skills/`, `agents/`, `hooks/`.
Skrypt `zawsze-popup-auto-przerwa-wf_2fb79243-84e.js` musiał sam wymyślić rolę, model, podział plików,
limit wywołań, bramkę F1 i procedurę QA. Koszty zmierzone na transkryptach pokazują, że **dźwignią
nie jest tier modelu, tylko liczba tur i długość kontekstu**: 62% kosztu to cache read, koszt tury
rośnie 2,7–5,6× w trakcie sesji, jedna sesja lidera na Opusie ($63.70) kosztowała więcej niż wszyscy
subagenci czterech workflow razem ($41.28), a oba zmarnowane przebiegi były porażką
kompletności specu i limitu tur, nie tieru.

Spec robi pięć rzeczy:
1. **Pomiar przed doktryną** (P0): `effort`, worktree, zapis plików przez role i A/B haiku vs sonnet w Workflow.
2. **Doktryna Workflow** (`workflow-orchestration.md`): `agentType` roli zawsze; pipeline dzielony na
   STOP-ach człowieka; bramki oddają werdykt schematem; lider kończy sesję po każdym workflow.
3. **Pola fazy gotowe do dispatchu**: `Owns`, `Blast-radius`, `Depends-on`, `Agent`, `Human-STOP` —
   i `ownership-check.js` czytający je ze specu, z falami.
4. **Egzekucja**: hook `PreToolUse` na `Workflow` blokujący `agent()` bez `agentType`.
5. **Pomiar kosztu**: `token-report.js` rozumie `subagents/workflows/wf_*/`.

## Problem

> **Korekta 2026-09-16 (P1):** liczby kosztów z researchu liczono parserem, który brał pierwsze `usage` z linii
> strumienia (zaniżone `output_tokens`). Po korekcie: 4 workflow $41.28 (nie $34.32), udział cache read 62%, cache write 19%,
> output 19% (nie 75/23/2). Sesje lidera bez zmian ($63.70, $19.31). Wnioski (koszt lidera > subagenci; tury i kontekst
> jako dźwignia) stoją; kwoty pojedynczych przebiegów poniżej są zaniżone o ~0–20%.

- **U1 — brak doktryny.** `git grep -c -E "agentType|StructuredOutput|resumeFromRunId" -- skills agents hooks` → 0.
  Każdy skrypt workflow wymyśla orkestrację od zera (`research/spec.md`, a: rola, model, podział plików, limit, bramka).
- **U2 — model spoza roli.** Workflow `wf_3227fe3d-ad3`: 5 kolektorów bez `agentType` i bez `model` dziedziczy
  Opusa sesji, zatrzymane, $5.13 w całości stracone. Zmierzone w `wf_c7c25bee-3b3`: z `agentType` model roli
  jest brany z frontmattera (explorer → `claude-haiku-4-5-20251001`, be-dev → `claude-sonnet-5`), jawny `model`
  go nadpisuje (checker + `haiku` → haiku). Reguła „zawsze `agentType`” zamyka klasę.
- **U3 — faza większa niż agent.** F1 (`be-dev`, `maxTurns: 140`) zatrzymał się dokładnie na 140 turach, bez
  `StructuredOutput`, $6.47; poprawione F1 zajęło 28 tur / $0.32. Przyczyna: usunięcie API rozlało się na ~15 plików
  testów, których lista fazy nie miała. Limit „~70 wywołań” w prompcie był ignorowany (F2 157, F4 140).
- **U4 — doktryna sprzeczna z harnessem.** (a) Subagent w Workflow dostaje odmowę `Write` pliku raportu
  („Subagents should return findings as text, not write report files”), a `AGENTS.md` i `team-lead.md` każą
  bramkom raportować plikiem. (b) Skrypt nie może czekać na człowieka, a zamrożenie planu testów w lane full jest
  twardą blokadą (`sailes-test/SKILL.md:66`). (c) `parallel()` nie zna blokady środowiska, a `qa` jej wymaga (`qa.md`).
- **U5 — nieaktualna doktryna modelu.** `team-lead.md` i `agent-team-structure.md:105` podają kolejność
  `CLAUDE_CODE_SUBAGENT_MODEL` → parametr → frontmatter; `code.claude.com/docs/en/sub-agents` podaje od v2.1.251
  parametr → frontmatter → sesja → env („Before v2.1.251, CLAUDE_CODE_SUBAGENT_MODEL came first”); przebiegi
  działały na v2.1.272.
- **U6 — koszt lidera.** Sesja `afbf8f27` (Opus, 179 tur) $63.70; koszt tury $0.086 (tury 0–20) → $0.480 (160–179).
- **U7 — narzędzia ślepe.** `token-report.js` liczy `subagents/workflows/wf_*/agent-*.jsonl` jako lidera
  (`"subagents":{"transcriptCount":0}`); `ownership-check.js` szuka bloku `ownership:`, którego żaden plik nie ma,
  i przechodzi `exit 0` („nothing to check”) — z zastępowanego specu, U2/U3 tamże.

## Decyzje człowieka (2026-09-16)

| # | Pytanie | Wybór | Odrzucone |
|---|---|---|---|
| D1 | Koszt lidera | **Opus + krótkie sesje**; lider nie czyta dużych plików sam | Sonnet jako lider w lane middle; same limity kontekstu |
| D2 | Human STOP | **Podział na STOP-ach**: WF1 rozpoznanie + kontrakt + tester DRAFT → STOP · WF2 fazy z tester/checker per faza → STOP przy decyzji · WF3 `qa` + docs-delta; lane middle łączy WF1+WF2 | Jeden workflow dla lane middle |
| D3 | Werdykty bramek | **Schemat + zapis przez lidera** | Zapis przyrostowy przez Bash |
| D4 | Zakres | **Dwa specy**, ten pierwszy | Jeden duży; najpierw osobny pomiar |
| Q1 | Spec 2026-08-06 | **Zastąpiony.** Jego decyzje przechodzą niżej (D5–D7), niewykonane fazy do P2/P4 albo backlogu (P6) | Dwa specy na jednej powierzchni |
| Q2 | Hook | **Blokada (exit 2)** — z warunkiem z zastępowanego F9: zmierzony wskaźnik fałszywych pozytywów przed włączeniem | Ostrzeżenie |
| Q3 | Budżet tur | **Rozmiar fazy rozstrzyga spec**: faza > ~60% `maxTurns` roli jest dzielona; prompt: przy ~70% WIP + `blocked` | Obniżenie `maxTurns` ról |
| Q4 | Nieustalone fakty | **P0 — pomiar przed doktryną** | Doktryna z oznaczeniem „niezmierzone” |
| Q5 | Codex | **Doktryna tylko dla Claude Code**; `parity.test.js` wyklucza nowe pojęcia jawnie | Odpowiednik dla Codex |
| Q2′ | Hook po pomiarze FP (2026-09-17, zmienia Q2) | **Sugestia zamiast blokady**: `agent()` bez `agentType`, ale z `model` → przepuszcza z mocną sugestią roli Sailes (`additionalContext` dla modelu, bez `permissionDecision`, żeby nie omijać zgód użytkownika); bez `agentType` i bez `model` → blokada (exit 2), bo dziedziczy Opusa sesji. Powód człowieka: system ma działać, gdy w stacku nie ma roli do zadania. Pomiar: 17 skryptów, 6 blokad reguły Q2, 5 z nich z jawnym `model` (m.in. voxtype spoza Sailes) | Blokada zawsze bez `agentType`; nigdy nie blokować |
| Q6 | Handoff lidera | **Po każdym workflow** (każdy STOP z D2) | Próg liczby tur |
| D8 | Umiejscowienie bramek (2026-09-16, zmienia fragment D2 „tester/checker per faza”) | **Bramki na końcu (A)**: wszystkie fazy WF2 (równolegle, gdzie pliki rozłączne) → jeden `tester` + jeden `checker` na cały spec → ≤1 runda poprawek. Rozstrzygnięte **wyłącznie kosztem i czasem** (`.ai/eval-runs/2026-09-16-gate-placement/VERDICT-round1.md`): A $1.37 / 9.7 min · per faza $2.61 / 19.1 min · hybryda $2.53 / 11.4 min | Per faza szeregowo (B); hybryda (C). Wykrywalność i koszt późnej poprawki **niezmierzone** — runda 2 odłożona przez człowieka |

**Przeniesione z zastępowanego specu 2026-08-06:**
- **D5 (tamże Q1)** — lider zachowuje dokładnie szóstkę: merge/integracja · zamrożenie kontraktu · run log ·
  `STATE.md` · werdykt bramki · eskalacja do człowieka. Resztę wykonują role przez Workflow.
- **D6 (tamże Q2)** — mechaniczne → test w `npm test`; behawioralne → eval.
- **D7 (tamże Q3)** — sekcja nazywa się `## Plan wykonania`.

## Proponowane rozwiązanie

### Kształt pipeline'u w Workflow (D2, D3, D5, Q6)

```
lider (Opus)                         Workflow (role Sailes, agentType zawsze)
─────────────                        ───────────────────────────────────────────
spec approved + pre-implement READY
boot e2e raz → wynik do promptów ──▶ WF1  explorer → [designer] → kontrakt → tester(derive, DRAFT)
  STOP: człowiek zamraża plan  ◀──        zwraca: mapa, kontrakt, plan (schemat)       [lane full]
  STATE.md, nowa sesja
                                 ──▶ WF2  pipeline(fale z Plan wykonania):
                                            fazy: be-dev|fe-dev (worktree), fale równolegle
                                          → tester(write, cały spec) → checker (cały diff) → ≤1 poprawka (D8)
                                          zwraca: werdykty (schemat) | blocked + powód
  STOP przy decyzji kluczowej  ◀──
  integracja, STATE.md, nowa sesja
                                 ──▶ WF3  qa (szeregowo, wyłączne środowisko) → docs-author
  werdykty → .ai/, docs-delta receipt → człowiek
```

- **Lane middle**: WF1 i WF2 w jednym skrypcie (plan `DERIVED`, brak STOP-u zamrożenia).
- **Tester i checker raz, po wszystkich fazach (D8)** — zmierzone: przy poprawnej implementacji bramki per faza kosztują
  2,2–2,6× więcej i (dla faz zależnych) trwają 2× dłużej. Znany koszt tego wyboru: regresja wychodzi późno — na
  `wf_4eb1edf7-db8` prawdziwe regresje F2 wyszły w 2. rundzie checkera; dlatego checker uruchamia testy z
  `git grep -l <zmieniony symbol> tests/`, nie tylko `Done-when` faz.
- **Werdykt = schemat.** tester/checker/qa zwracają `{verdict, evidence[], defects[], known_red[]}` przez
  `StructuredOutput`; skrypt zwraca je liderowi, lider zapisuje do `.ai/` (D3). Plik raportu w Workflow znika
  z obowiązków roli; poza Workflow (narzędzie Agent) reguła „raport = plik” zostaje bez zmian.
- **`null` / wyjątek z `agent()`** → lider czyta gałąź i worktree (commit WIP?) przed ponowieniem; ponowienie to
  dokończenie z rozłącznymi plikami, nie powtórka fazy.
- **Budżet tur (Q3)**: bezpiecznik = `maxTurns` roli; prompt fazy: „przy ~70% limitu roli skomituj WIP i zwróć
  `blocked`”. Faza, której `Blast-radius` wskazuje > ~60% limitu, jest dzielona w specu, nie w skrypcie.
- **Model**: `agentType: 'sailes-app-builder:<rola>'` zawsze. `model` tylko jako świadome nadpisanie, zapisane
  w run logu z aliasem i powodem (istniejąca reguła „log the alias”). `researcher` w Workflow: nadpisanie `sonnet`
  jest domyślne, Opus tylko za zgodą człowieka.
- **Handoff (Q6)**: każdy powrót z workflow = `STATE.md` + run log + nowa sesja lidera (`session-handoff`).
  Lider nie czyta transkryptów ani dużych plików — dostaje schemat.

### Pola fazy w specu (Q3, D7)

Każda faza w `## Fazy` niesie, obok istniejących `Lane` / `Done-when` / `Deployed-probe` / `Contract-probe`:

| Pole | Treść | Dlaczego (zmierzone) |
|---|---|---|
| `Owns:` | tabela `\| Plik \| Wymuszony przez \|` (istniejąca konwencja) | skrypt wymyślał podział plików (`research/spec.md`, a); `ownership-check.js` nie ma danych (U7) |
| `Blast-radius:` | komenda `git grep -c` po zmienianych/usuwanych symbolach **z `tests/`** + wynik | F1: ~15 plików testów poza listą, $6.47 (U3) |
| `Depends-on:` | fazy, z którymi zbiór plików się przecina, albo `wynik: <faza>` dla zależności od wyniku | faza czekała za sześcioma bez powodu (`agent-team-structure.md:193`) |
| `Agent:` | rola · tier z `Lane` · nadpisanie modelu z powodem albo `—` | skrypt ręcznie przypisywał `agentType` i `model` |
| `Human-STOP:` | kroki wymagające człowieka albo `—` | „Test na żywo (człowiek + lead)” wymieszany z komendami w `Done-when` F3/F4 |

`## Plan wykonania` (D7) = tabela fal: `Fala | Fazy | Równolegle | Blokuje lidera | Workflow (WF1/WF2/WF3)`.

### Narzędzia

- `ownership-check.js --spec <plik>`: czyta tabele `Owns` i `Plan wykonania`; konflikt = wspólny plik **w tej samej
  fali**; wylicza minimalny podział na fale i kończy się `exit 1` przy nadmiernej serializacji, z wyłączeniem faz
  z wpisem „blokuje lidera” (raportowanym); spec z `## Fazy` bez `Owns` → `exit 1` (koniec cichego „nothing to check”).
  Tryb bloku `ownership:` dla run logów zostaje.
- `token-report.js`: układ `<session>/subagents/workflows/wf_*/agent-*.jsonl` + `.meta.json` → subagenci z etykietą,
  `agentType` i modelem; koszt USD per etykieta/rola/tier z tabeli cen w jednym miejscu.
- `hooks/workflow-agenttype-guard.js` (`PreToolUse`, matcher `Workflow`): parsuje `script` (albo plik `scriptPath`),
  znajduje wywołania `agent(` bez `agentType` w obiekcie opcji → `exit 2` z komunikatem wskazującym linię
  i regułę. Kształt payloadu `PreToolUse` dla `Workflow` ustala P0.

## Bezpieczeństwo

n/a — brak danych, auth i powierzchni sieciowej. Jedyne ryzyko operacyjne: hook blokujący w **każdym** repo na
maszynie (push na `main` = deploy). Dlatego Q2 niesie warunek zmierzonych fałszywych pozytywów (P5).

## Plan wykonania

| Fala | Fazy | Równolegle | Blokuje lidera | Workflow |
|---|---|---|---|---|
| 1 | P0 · P1 · P2 · P5a | tak — zbiory plików rozłączne | **P0: tak** — wyniki wchodzą do P4 i P5b; reszta nie | WF2 (lane middle, bez zamrożenia) |
| 2 | P3 · P4 · P5b | tak — rozłączne | nie | WF2 |
| 3 | P6 | — | **tak** — receipt docs-delta pokazany człowiekowi | WF3 |

P5 jest rozcięte: P5a (hook + test, bez podpięcia) nie zależy od niczego; P5b (podpięcie w `hooks.json` + pomiar
fałszywych pozytywów) zależy od wyniku P0 (kształt payloadu). **Zależność od wyniku, nie od pliku** — narzędzie
fal jej nie wyliczy, dlatego jest wpisana tutaj.

## Fazy

### P0 — pomiar Workflow przed doktryną

Owns:
| Plik | Wymuszony przez |
|---|---|
| `.ai/eval-runs/2026-09-16-workflow-facts/VERDICT.md` | P0.1–P0.5 |
| `.ai/eval-runs/2026-09-16-workflow-facts/**` | P0.1–P0.5 |

Blast-radius: n/a — faza nie zmienia kodu ani doktryny; pisze wyłącznie artefakty pomiaru.
Depends-on: —
Agent: lider uruchamia workflow pomiarowy; `explorer`/`be-dev`/`tester` w roli sond, bez nadpisań modelu poza P0.4.
Human-STOP: po P0 — lider pokazuje `VERDICT.md`, człowiek akceptuje fakty, zanim P4 zapisze doktrynę.
Lane: middle — tier C: pomiar, brak zapisu w produkcie.
Contract-probe: n/a — faza mierzy harness Claude Code, nie stoi na kontrakcie aplikacji ani API
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P0.1 `effort`**: ta sama sonda z `effort: 'low'` i `'high'` (po 3 przebiegi); porównanie liczby tokenów wyjścia
  i myślenia z transkryptów. Wynik: działa / nie działa / nierozstrzygnięte.
- **P0.2 worktree**: `be-dev` z `isolation: 'worktree'` robi commit; czy gałąź jest widoczna ze wspólnego `.git`
  (`git log <gałąź>`, `cherry-pick`), jakie pola zwraca wynik, czy worktree jest sprzątany.
- **P0.3 zapis plików przez role**: czy `tester` zapisze `.ai/test-plans/<x>.md` przez `Write`, czy `be-dev` zapisze
  `.claude/status/<id>.md`, jaki tekst ma odmowa (dziś zmierzona tylko dla pliku raportu w scratchpadzie).
- **P0.4 A/B haiku vs sonnet**: jedno małe zadanie `be-dev` z `Done-when` (3× `model: 'haiku'`, 3× bez nadpisania);
  koszt per **ukończone** zadanie z `token-report.js` (po P1) albo parsera z `research/costs.md`.
- **P0.5 payload hooka**: `PreToolUse` z matcherem `Workflow` zapisujący stdin do pliku — czy przychodzi `script`,
  `scriptPath`, oba.

**Done-when:**
- `VERDICT.md` ma pięć sekcji P0.1–P0.5, każda z werdyktem, komendą i surowym wynikiem (ścieżka transkryptu,
  `message.model`, liczby tokenów); nierozstrzygnięte oznaczone jako takie, nie zaokrąglone.
- `grep -c "^## P0\." .ai/eval-runs/2026-09-16-workflow-facts/VERDICT.md` → `5`.
- Koszt workflow pomiarowego wpisany w `VERDICT.md` (z transkryptów, nie z szacunku).

### P1 — `token-report.js` rozumie workflow

Owns:
| Plik | Wymuszony przez |
|---|---|
| `tools/token-report.js` | P1.1, P1.2 |
| `tools/token-report.test.js` | P1.1, P1.2 |
| `tools/fixtures/token-report-workflow/**` | P1.1 |

Blast-radius: `git grep -c "discoverTranscripts\|transcriptCount" -- tools` → `tools/token-report.js`, `tools/token-report.test.js`,
`tools/token-report.frozen.test.js` (frozen suite **nie jest** w `Owns` — zmiana jej wyniku = defekt, nie edycja).
Depends-on: —
Agent: `be-dev` · tier C · —
Human-STOP: —
Lane: middle — tier C: raport, odczyt, formatowanie.
Contract-probe: n/a — format transkryptów zmierzony na prawdziwym wf_4eb1edf7-db8 w Done-when, brak kontraktu API
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P1.1** — `discoverTranscripts()` rozpoznaje `<session>/subagents/workflows/wf_*/agent-*.jsonl` jako subagentów,
  a podany wprost katalog `wf_*` (same `agent-*.jsonl`) też jako subagentów, nie lidera. Z `.meta.json` bierze
  `description` (etykieta), `agentType`, `workflowPhase`; model rzeczywisty z `message.model` transkryptu
  (`meta.model` to tylko alias z wywołania albo brak).
- **P1.2** — `--cost`: USD per transkrypt i agregaty per etykieta / rola / tier; cena z jednej tabeli w pliku,
  cache read 0,1×, cache write 1,25× wejścia.

**Done-when:**
- `node tools/token-report.test.js && node tools/token-report.frozen.test.js` → exit 0.
- `node tools/token-report.js ~/.claude/projects/-home-charlie/646d3e6d-dc3d-40c8-a58a-be9228a5fafd/subagents/workflows/wf_4eb1edf7-db8 --json --cost`
  → `subagents.transcriptCount` = 12, suma USD w granicach 1% od $22.19 — wartość z niezależnego parsera lidera
  (ostatnie `usage` per `message.id`). Poprzednia referencja $18.33 z `research/costs.md` była zaniżona: parser researchu
  brał pierwszą linię strumienia, w której `output_tokens` jest częściowe (F2: 12 282 vs 73 705).
- Dowód detekcji (tier C: jeden przypadek na partycję): cofnięcie rozpoznania `workflows/` → test P1.1 czerwony.

### P2 — `ownership-check.js` czyta spec i fale

Owns:
| Plik | Wymuszony przez |
|---|---|
| `tools/ownership-check.js` | P2.1–P2.4 |
| `tools/ownership-check.test.js` | P2.1–P2.4 |

Blast-radius: `git grep -c "ownership-check" -- ':!.ai' ':!CHANGELOG.md'` → `AGENTS.md:1`, `docs/architecture/architecture.html:3`,
`package.json:1`, `skills/sailes-implement/SKILL.md:1`, `tools/mcp-toolnames-check.test.js:1`, `tools/ownership-check.js:8`,
`tools/ownership-check.test.js:6`. Zmiana dotyka tylko wywołania z nowym `--spec`; istniejące wywołania na run logach bez zmian.
Depends-on: —
Agent: `be-dev` · tier B · —
Human-STOP: —
Lane: middle — tier B: logika narzędzia bramkującego.
Contract-probe: n/a — narzędzie czyta markdown specu tego repo, brak zewnętrznego kontraktu
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P2.1** — `--spec`: parsuje `Owns:` każdej fazy i `## Plan wykonania`.
- **P2.2** — konflikt = wspólny plik w tej samej fali (z zastępowanego F1.1).
- **P2.3** — minimalny podział na fale; `exit 1` przy nadmiernej serializacji, fazy „blokuje lidera” wyłączone
  z porównania i raportowane (F1.2–F1.3).
- **P2.4** — spec z `## Fazy` bez `Owns` → `exit 1` (F1.4).

**Done-when:**
- `node tools/ownership-check.test.js` → exit 0; suite ma przypadki: wspólny plik w różnych falach → 0; w tej samej → 1;
  nadmierna serializacja → 1; faza blokująca wyłączona i wypisana; spec bez `Owns` → 1.
- Dowód detekcji (tier B, jeden na partycję): zepsucie P2.2, P2.3, P2.4 po kolei → dokładnie odpowiedni przypadek czerwony.
- `node tools/ownership-check.js --spec .ai/specs/2026-09-16-workflow-first-orchestration.md` → exit 0, wypisuje
  8 faz (P0, P1, P2, P3, P4, P5a, P5b, P6) i 3 fale, P0 i P6 jako wyłączone (blokują lidera).

### P3 — pola fazy w szablonie specu i pre-implement

Owns:
| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md` | P3.1, P3.2 |
| `skills/sailes-bootstrap/spec-writing-template.md` | P3.1, P3.2 |
| `skills/sailes-pre-implement/SKILL.md` | P3.3 |

Blast-radius: `git grep -c "Deployed-probe" -- skills` (miejsca opisujące pola fazy, gdzie dochodzą nowe) — wynik wklejany na starcie fazy.
Depends-on: `wynik: P2` (nazwy pól i format wyjścia narzędzia muszą być ostateczne).
Agent: `be-dev` · tier C · —
Human-STOP: —
Lane: middle — tier C: dokumentacja szablonu.
Contract-probe: n/a — zmiana tekstu szablonu i skilli, brak kontraktu
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P3.1** — pięć pól z tabeli „Pola fazy” w obu plikach (szablon mirroruje `sailes-spec`), z uzasadnieniem po jednym zdaniu i dowodem.
- **P3.2** — `## Plan wykonania` jako sekcja wymagana dla specu z > 1 fazą; checklista: `node tools/ownership-check.js --spec` → exit 0.
- **P3.3** — pre-implement: `Blast-radius` liczony i wklejony dla każdej fazy usuwającej/zmieniającej eksport;
  faza z wynikiem sugerującym > ~60% `maxTurns` roli → NOT-READY z propozycją podziału.

**Done-when:**
- dla każdego z pól `Owns:`, `Blast-radius:`, `Depends-on:`, `Agent:`, `Human-STOP:`:
  `grep -c -F "<pole>" skills/sailes-spec/SKILL.md skills/sailes-bootstrap/spec-writing-template.md` → ≥ 1 w każdym
  (pięć komend, wynik wklejony).
- `grep -c "Plan wykonania" skills/sailes-spec/SKILL.md skills/sailes-bootstrap/spec-writing-template.md` → ≥ 1 w każdym.
- `grep -n "Blast-radius" skills/sailes-pre-implement/SKILL.md` → trafienie w sekcji BC impact.
- `npm test` → exit 0 (w tym `sync-blocks`, jeśli dotknięte bloki).

### P4 — doktryna Workflow

Owns:
| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/workflow-orchestration.md` (nowy) | P4.1 |
| `skills/sailes-bootstrap/agent-team-structure.md` | P4.2, P4.3 |
| `agents/team-lead.md` | P4.2, P4.3, P4.4 |
| `skills/sailes-implement/SKILL.md` | P4.5 |
| `AGENTS.md` | P4.4 |
| `codex-agents/parity.test.js` | P4.6 |
| `evals/lead-dispatches-workflow-with-roles.md` (nowy) | P4.7 |

Blast-radius (policzone 2026-09-16, `git grep -c -E <wzorzec> -- ':!.ai' ':!CHANGELOG.md'`):
- `CLAUDE_CODE_SUBAGENT_MODEL` → `agents/team-lead.md:1`, `skills/sailes-bootstrap/agent-team-structure.md:1`.
- `omitting \`model\` is how you keep the pin` → te same dwa pliki.
- `report is a FILE|deliverable is a FILE|no file = task not done|The report is a file` → `AGENTS.md:1`,
  `agents/researcher.md:2`, `agents/team-lead.md:1`, `codex-agents/researcher.toml:1`, `evals/harness/README.md:2`,
  `skills/sailes-bootstrap/agent-team-structure.md:1`, `skills/sailes-bootstrap/deciding-under-uncertainty.md:1`,
  `skills/sailes-eval-runner/SKILL.md:1`. Zmiana dotyczy **tylko kontekstu Workflow** (dopisek w `AGENTS.md`,
  `team-lead.md`, `agent-team-structure.md`); `researcher`, eval-runner i harness evali poza zakresem — reguła poza
  Workflow zostaje.
- `session-handoff` → blok synchronizowany (`tools/blocks.json`); P4 **nie edytuje bloku**, tylko się do niego odwołuje.
Depends-on: `wynik: P0` (P0.1 effort, P0.2 worktree, P0.3 zapis plików wchodzą do doktryny jako fakty).
Uwaga (pre-implement): zdania o kolejności modelu (`team-lead.md:166`, `agent-team-structure.md:105`) leżą **poza**
blokami synchronizowanymi (`gate-scaling`, `delegation-threshold`, `session-handoff`) — edycja bez `sync-blocks`.
Edycja tych plików wystawi evale z `Files:` na nie jako STALE — obsługa w P6.
Agent: `be-dev` · tier C · —
Human-STOP: —
Lane: middle — tier C: doktryna; zachowanie mierzy eval P4.7.
Contract-probe: n/a — doktryna i eval; fakty harnessu pochodzą z pomiaru P0, brak kontraktu API
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P4.1** — `workflow-orchestration.md`: kształt pipeline'u, `agentType` zawsze, werdykt schematem (z gotowymi
  schematami dla tester/checker/qa), `null` → najpierw worktree, budżet tur, boot e2e raz, `qa` szeregowo,
  sprawdzenie składni skryptu, fakty z P0.
- **P4.2** — kolejność rozwiązywania modelu poprawiona do stanu z v2.1.251 w obu plikach (U5).
- **P4.3** — odwołanie do `workflow-orchestration.md` z sekcji delegowania/izolacji; szóstka lidera (D5).
- **P4.4** — dopisek „w Workflow werdykt bramki = schemat, zapis robi lider” przy regule raportu-pliku.
- **P4.5** — `sailes-implement` „Subagent strategy”: Workflow jako domyślna ścieżka dla > 1 fazy.
- **P4.6** — `parity.test.js`: jawna lista pojęć tylko dla Claude Code (`agentType`, `StructuredOutput`, Workflow) z komentarzem Q5.
- **P4.7** — eval: setup daje zatwierdzony spec z 3 fazami i milczy (bez pytania o plan — warunek z zastępowanego F7);
  PASS = skrypt workflow z `agentType` w każdym `agent()`, fazy wg `Plan wykonania`, STOP przed decyzją człowieka.

**Done-when:**
- `grep -c "CLAUDE_CODE_SUBAGENT_MODEL" agents/team-lead.md skills/sailes-bootstrap/agent-team-structure.md` → trafienia
  tylko w zdaniu z kolejnością od v2.1.251 (`grep -n` wklejony).
- `grep -c "workflow-orchestration.md" agents/team-lead.md skills/sailes-bootstrap/agent-team-structure.md skills/sailes-implement/SKILL.md` → ≥ 1 w każdym.
- `node codex-agents/parity.test.js` → exit 0; odwrotny przypadek: pojęcie z listy Claude-only dopisane do `team-lead.toml` → wynik zgodny z intencją listy (wklejony).
- `node agents/validate-frontmatter.test.js && node tools/sync-blocks.js --check` → exit 0.
- Eval P4.7: 3 przebiegi, większość rozstrzyga, `VERDICT.md` w `.ai/eval-runs/`.
- `npm test` → exit 0.

### P5a — hook `agentType` (bez podpięcia)

Owns:
| Plik | Wymuszony przez |
|---|---|
| `hooks/workflow-agenttype-guard.js` | P5a.1 |
| `hooks/workflow-agenttype-guard.test.js` | P5a.1, P5a.2 |

Blast-radius: n/a — nowe pliki, brak odwołań.
Depends-on: —
Agent: `be-dev` · tier B · —
Human-STOP: —
Lane: middle — tier B: blokuje wywołania narzędzia w każdym repo.
Contract-probe: n/a — hook testowany na fixture; kształt payloadu mierzy P0.5, nie ta faza
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P5a.1** — hook: stdin JSON → wyciąga treść skryptu (inline albo z `scriptPath`) → wywołania `agent(` bez `agentType`
  w opcjach (także bez drugiego argumentu) → `exit 2` z linią i regułą; brak skryptu / inne narzędzie → `exit 0` cicho.
  Wywołanie zapisanego workflow po `name` (bez `script`/`scriptPath`) → `exit 0` z notą w stderr — treść
  nierozwiązywalna z payloadu; hook nie zgaduje ścieżki rejestru.
- **P5a.2** — przypadki: `agent(` w stringu i komentarzu nie blokuje; `agent(p, opts)` ze zmienną opcji
  → nie blokuje (nierozstrzygalne statycznie, raport w stderr).

**Done-when:**
- `node hooks/workflow-agenttype-guard.test.js` → exit 0; dowód detekcji dla każdej partycji (brak opcji, opcje bez `agentType`, string/komentarz).

### P5b — podpięcie hooka i pomiar fałszywych pozytywów

Owns:
| Plik | Wymuszony przez |
|---|---|
| `hooks/hooks.json` | P5b.1 |
| `package.json` | P5b.1 |
| `.ai/eval-runs/2026-09-16-agenttype-guard-fp/VERDICT.md` | P5b.2 |

Blast-radius: `hooks/hooks.json` — dziś tylko `SessionStart`; `package.json` — skrypt `test` (dopisanie suite).
Depends-on: `wynik: P0` (P0.5: kształt payloadu `Workflow`).
Agent: `be-dev` · tier B · —
Human-STOP: **tak** — człowiek akceptuje wskaźnik fałszywych pozytywów przed pushem (Q2).
Lane: middle — tier B.
Contract-probe: n/a — kształt payloadu PreToolUse zmierzony i wklejony w P0.5 VERDICT.md
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P5b.1** — `PreToolUse`, matcher `Workflow`; suite w `npm test`.
- **P5b.2** — hook uruchomiony na wszystkich zapisanych skryptach na maszynie
  (`find ~/.claude/projects -path "*workflows/scripts/*.js"`): liczba zablokowanych, ręczna klasyfikacja każdej blokady (TP/FP).

**Done-when:**
- `node hooks/workflow-agenttype-guard.test.js` w `npm test`; `npm test` → exit 0.
- `VERDICT.md`: N skryptów, blokady z klasyfikacją, FP = 0 albo każdy FP z decyzją człowieka.
- `wf_3227fe3d-ad3` (kolektory bez `agentType`) → zablokowany (TP na prawdziwym artefakcie).

### P6 — wydanie 1.35.0 i zamknięcie zastępowanego specu

Owns:
| Plik | Wymuszony przez |
|---|---|
| `VERSION`, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `AGENTS.md` (stempel) | P6.1 |
| `CHANGELOG.md` | P6.1 |
| `docs/architecture/**`, `.ai/docs-deltas/**` | P6.2 |
| `.ai/specs/2026-08-06-spec-carries-the-execution-plan.md` → `.ai/specs/archived/` | P6.3 |
| `.ai/backlog.md` | P6.3 |

Blast-radius: pięć stempli wersji (`release-hygiene.test.js`).
Depends-on: P0–P5b.
Agent: lider (stemple, `git mv`) · `docs-author` (P6.2) · `qa` (pełne `npm test` raz przed pushem).
Human-STOP: **tak** — receipt docs-delta pokazany człowiekowi; push na `main` = deploy, za zgodą.
Lane: middle — tier B: wydanie trafia na każdą maszynę.
Contract-probe: n/a — wydanie i przeniesienie plików, brak kontraktu
Deployed-probe: n/a — brak wdrożonego hosta; framework nie ma powierzchni sieciowej

- **P6.1** — stemple + CHANGELOG 1.35.0 (sekcja dla Upgrade mode: nowe pola fazy, doktryna Workflow, hook).
- **P6.2** — docs-delta (`architecture` z nowym hookiem i narzędziami).
- **P6.3** — zastępowany spec: `Status: superseded`, `Superseded-by:`, `git mv` do `archived/`; do backlogu jego
  F2/F3 (czy reguła delegowania dociera do sesji — sprawdzić wobec dzisiejszego `workflow-router.js`), F8 (D12)
  i F10 (pomiar swarma), każdy z odnośnikiem.

**Done-when:**
- `node release-hygiene.test.js && node spec-status-evidence.test.js` → exit 0.
- `git status --short .ai/specs` → zastępowany spec w `archived/`, z linią `Superseded-by:`.
- `grep -c "2026-08-06-spec-carries-the-execution-plan" .ai/backlog.md` → ≥ 3.
- `node evals/harness/eval-status.js` → lista evali STALE przez P3/P4 wklejona; każdy re-run albo wyjątek przyjęty
  przez człowieka (precedens G19/G21/G22 w 1.34.0).
- CHANGELOG 1.35.0 mówi wprost: `Owns`/`Plan wykonania` wymagane dla specu pisanego od 1.35.0; żywe specy
  sprzed wersji nie są przepisywane, a `ownership-check --spec` uruchamia się tylko jawnie.
- `npm test` → exit 0 (przez `qa`, raz); receipt docs-delta pokazany.

## Integration coverage

| Powierzchnia | Ścieżka | Pokrycie |
|---|---|---|
| Raport kosztu | `tools/token-report.js` | `token-report.test.js` + frozen + prawdziwy `wf_4eb1edf7-db8` (P1) |
| Fale ze specu | `tools/ownership-check.js --spec` | `ownership-check.test.js` + dowód detekcji + ten spec (P2) |
| Pola fazy | `sailes-spec`, szablon, pre-implement | grepy + `ownership-check --spec` w checkliście (P3) |
| Doktryna | `workflow-orchestration.md`, `team-lead.md`, `agent-team-structure.md`, `AGENTS.md` | parity + frontmatter + eval P4.7 |
| Hook | `hooks/workflow-agenttype-guard.js` | test + FP na prawdziwych skryptach (P5a/P5b) |
| Fakty harnessu | Workflow `effort`, worktree, zapis plików, payload | `VERDICT.md` P0 |

## Non-goals

- **Zmiana tierów ról** — dane nie pokazują zysku (oszczędność 18% w hipotezie to głównie Opus→Sonnet zatrzymanego
  przebiegu); decyzja po P0.4, w osobnej zmianie.
- **Diagnose/hosting** (incydenty, odczyty Prod, `railway logs`, kolektory) — spec B.
- **Generator skryptu workflow ze specu** — najpierw pola i ręczne przebiegi; generator na dowodzie.
- **Odpowiednik dla Codex** (Q5).
- **Hook na `model`** — `agentType` wystarcza; nadpisanie `model` jest świadome i logowane.
- **Zmiana reguły „raport = plik” poza Workflow** — dotyczy `researcher`, eval-runnera i narzędzia Agent; bez zmian.
