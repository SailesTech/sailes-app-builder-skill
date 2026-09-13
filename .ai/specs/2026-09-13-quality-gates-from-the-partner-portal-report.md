# Spec: bramy jakości z raportu partner-portal — pomiar przed kodem, wysiłek proporcjonalny

Status: draft — wszystkie pytania rozstrzygnięte 2026-09-13 (Q1–Q7, R1–R5); czeka na zatwierdzenie całości przez człowieka, potem `sailes-pre-implement`
Framework-Version target: 1.34.0
Weight: contract fix × 5 powierzchni — szablon specu + pre-implement, doktryna lidera i brief,
        definicje ról (+ bliźniaki Codex), jedno nowe narzędzie w `tools/`. Nie rusza modelu danych
        ani API. Zmienia to, co każda faza w każdym repo klienta uruchamia, pisze i komu oddaje.
Source: `partner-portal-v3/.ai/2026-09-12-raport-ulepszenie-skilla.md` §3.1, 3.2, 3.3, 3.3a, 3.4, 3.8.
Decisions: D1–D3 z `.ai/specs/implemented/2026-09-12-token-cost-of-running.md`; Q1–Q7 niżej.
Related: `.ai/specs/2026-08-06-spec-carries-the-execution-plan.md` (draft) — czyta `Lane:` z tego specu
        w swoim `## Plan wykonania` (Q6); ten spec na niego nie czeka.

## TLDR

Raport z jednego dnia pracy: **ani jeden defekt nie został znaleziony przez dokument — wszystkie przez
uruchomienie albo zakwestionowanie twierdzenia**. Najdroższy incydent (ekran niedziałający w 100% po
2400 liniach) przepuściły trzy bramy, bo czytały tę samą nieprawdę o kształcie odpowiedzi; jeden
`curl` w pierwszej minucie by go złapał. Ten spec przesuwa pomiar na początek i dawkuje resztę:

1. **`Contract-probe:`** — lider przy pre-implement mierzy kontrakt, na którym faza stoi, i wkleja
   surową odpowiedź do specu. Obecność pola sprawdza narzędzie.
2. **Brama fazy wynika z jej plików** — `Done-when` nazywa komendę dla każdej klasy ścieżek.
   Pełny zestaw testów i e2e **raz, przed pushem**, nie na każdej fazie.
3. **`Lane:` na fazę** — tier A → pełny tor; B/C → środkowy: bez `designer`, bez zamrażania listy,
   `qa` robi żywy przebieg bez screenów.
4. **`Known-red:` nazwami, z przyczyną i terminem** — porównanie przez wklejony `comm`, nigdy liczbą.
5. **Implementer raportuje wiadomością z limitem**; plik raportu zostaje tylko rolom bramkującym.
   Wchodzi na `main` dopiero po A/B, które mierzy także puste zwroty.

## Decyzje człowieka (2026-09-13)

| # | Wybór | Odrzucone |
|---|---|---|
| Q1 | Lider przy pre-implement; surowa odpowiedź w specu jako `Contract-probe:`; `n/a — <powód>`, gdy faza nie stoi na istniejącym kontrakcie; obecność sprawdzana narzędziem | pierwszy krok implementera; oba |
| Q2 | Reguła w `Done-when`, bez narzędzia: każda klasa ścieżek z listy plików fazy ma nazwaną komendę; `checker` sprawdza | mapa glob→komenda + narzędzie |
| Q3 | Zależnie od toru — **skorygowane przez Q5a**: implementer nigdy nie uruchamia pełnego zestawu na fazie; `checker` też nie | tylko `checker`; bez zmiany |
| Q4 | Jak w D2: wiadomość z limitem, narracja w commicie, deklaracja w `.claude/status/`. **A/B mierzy odsetek pustych zwrotów i utraconych raportów**, nie tylko linie prozy | plik poza gitem kasowany przy akceptacji |
| Q5a | Pełny zestaw + e2e raz, po zakończonej pracy, przed pushem. Tor wybiera tier ryzyka (A → pełny, B/C → środkowy). Człowiek: „robimy pełny test po zakończonej pracy, przed pushem” | wszystko środkowym torem; tier + pełny test per faza |
| Q5b | Środkowy tor: `qa` robi żywy przebieg bez screenów | przebieg przez `checker`; przez implementera |
| Q6 | `Lane:` na fazę, niezależnie od 08-06 | kolumna planu wykonania czekająca na 08-06 |
| Q7 | Reguła z wklejonym `comm`; nowa nazwa = CHANGES-REQUIRED; termin = do najbliższego przekazania sesji | narzędzie parsujące wyjście runnerów |

| R1 | Pełny zestaw + e2e przed pushem uruchamia **`qa`** jako werdykt bramki wydania, z wyłącznością środowiska | lider sam (pełny e2e w kontekście, który 1.33.0 odchudzało); `checker` (bez narzędzi przeglądarki i wyłączności) |
| R2 | Środkowy tor: **`tester`** wyprowadza przypadki ze specu z implementacją nieprzeczytaną i pisze zestaw, **bez STOP-u na zamrożenie** przez człowieka | implementer bez `tester` (testy lustrzące kod) |
| R3 | Wiadomość implementera: **stałe pola + limit 40 linii** — wynik wobec `Done-when`, komendy z wyjściem, odstępstwa, blokady, `Promotion candidate:`. Liczba 40 niezmierzona; A/B ją sprawdza | stałe pola bez liczby |
| R4 | **Nowe wąskie `tools/contract-probe-check.js`** z datą odcięcia, na wzór `deployed-surface-check` | rozszerzenie `deployed-surface-check` (dwa pytania w jednym narzędziu) |
| R5 | `Known-red:` żyje w **sekcji run logu fazy**, czyszczonej przy przekazaniu sesji | pole briefu przy każdym dispatchu |

## Co jest na dysku dziś (sprawdzone 2026-09-13)

| Punkt | Istniejący mechanizm | Czego brakuje |
|---|---|---|
| 3.2 | `Deployed-probe:` — na **końcu** fazy, tylko status/nagłówek/`Content-Type`, adres wdrożony (`sailes-spec` krok 6; `sailes-pre-implement` Phase 1b „Wire”; `qa.md`). Surowa odpowiedź tylko w `sailes-diagnose/probe-patterns.md` | pomiar kształtu kontraktu **przed** kodem, w torze budowy |
| 3.3 | reguła plik↔klauzula (`sailes-spec` checklist; `agent-team-structure.md` „`Files:` and `Done-when` are two lists”) | komenda bramy dla każdej klasy ścieżek |
| 3.3a | 1.33.0: implementer — pętla na dotkniętych plikach, pełny zestaw + e2e **raz przed commitem deklaracji** (`sailes-implement` krok 1; brief `Verification:`; `be-dev.md`/`fe-dev.md`; koncept w `codex-agents/parity.test.js:158,166`) | przeniesienie pełnego zestawu przed push |
| 3.4 | nic w `skills/` ani `agents/` | całość |
| 3.8 | plik raportu od każdego workera od pierwszej zmiany (`team-lead.md` report clause i „name a FILE”; brief `Report:`; `AGENTS.md` Delegation) — dwa zmierzone incydenty za tą regułą | rozdział ról bramkujących i wykonawczych |
| 3.1 | blok `gate-scaling`; tiery A/B/C z wyzwalaczy (`sailes-test` Step 5) — dziś skalują tylko listę przypadków i dowód; potok `explorer → designer → … → qa` bez wyboru zestawu ról | `Lane:` z tieru, liczonego przy specu |

## Fazy

Wszystkie fazy idą **sekwencyjnie**: P2–P5 dotykają `agent-team-structure.md`, `agents/team-lead.md`
i bliźniaków `.toml`, więc zbiory plików nie są rozłączne. Gałąź `feat/1.34.0-quality-gates`.
Każda faza tego repo: `checker` na tekście zmieniającym zachowanie, `qa: n/a — brak działającej
aplikacji`, `tester` tylko dla P1 (jedyny kod).

### P1 — `Contract-probe:` (3.2; Q1, R4)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md`, `skills/sailes-bootstrap/spec-writing-template.md` | P1.1 |
| `skills/sailes-pre-implement/SKILL.md` | P1.2 |
| `tools/contract-probe-check.js` + `.test.js` | P1.3 |
| `package.json` (łańcuch `test`), `AGENTS.md` (liczba zestawów) | P1.3 |
| `evals/lead-probes-the-contract-before-dispatch.md` | P1.4 |

- **P1.1** — pole `Contract-probe:` obok `Done-when` każdej fazy: komenda + surowa odpowiedź w bloku
  kodu, albo `n/a — <powód ≥ 20 znaków>`. Punkt checklisty i Red Flag. Reguła: dokumentacja nie jest
  źródłem prawdy o kształcie danych; zmierzona odpowiedź jest.
- **P1.2** — Phase 1b „Contract”: lider (lub `explorer` na jego zlecenie) wywołuje każdy istniejący
  kontrakt, na którym faza stoi — lokalny stos dozwolony, bo mierzymy kształt, nie drut — i wkleja
  odpowiedź przed jakimkolwiek dispatchem. Brak pola = NOT-READY.
- **P1.3** — narzędzie: faza bez pola → exit 1 z nazwą fazy; `n/a` bez powodu → exit 1; pole bez
  bloku odpowiedzi i bez `n/a` → exit 1. Specy sprzed daty odcięcia nie są oceniane.
- **P1.4** — eval: ramię dostaje spec bez sondy i API z opakowaną odpowiedzią; PASS = wkleja surową
  odpowiedź i koryguje kształt w specu przed dispatchem.

**Done-when:** `node tools/contract-probe-check.test.js` → 0 failures, w tym fixture'y w obu kierunkach
(spec z polem → exit 0; faza bez pola → exit 1; `n/a` bez powodu → exit 1) i asercja ciszy na
`.ai/specs/implemented/`; `npm test` → exit 0 z liczbą zestawów zgodną z `package.json`.
Contract-probe: n/a — framework nie wystawia żadnego kontraktu HTTP.
Deployed-probe: n/a — doktryna i narzędzie offline; brak wdrożonej powierzchni.

### P2 — brama z plików fazy i pełny test przed pushem (3.3, 3.3a; Q2, Q3, Q5a, R1)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md`, `spec-writing-template.md` | P2.1 |
| `skills/sailes-implement/SKILL.md` | P2.2 |
| `skills/sailes-bootstrap/agent-team-structure.md` (brief `Verification:`) | P2.2 |
| `agents/{be-dev,fe-dev,checker}.md` + `codex-agents/{be-dev,fe-dev,checker}.toml` | P2.3 |
| `skills/sailes-bootstrap/release-checklist.md`, `agents/qa.md` + `codex-agents/qa.toml` | P2.4 |
| `codex-agents/parity.test.js` (koncept z 1.33.0 zastąpiony) | P2.5 |

- **P2.1** — checklist: każda klasa ścieżek z listy plików fazy (kontroler, moduł, ekran, migracja)
  ma w `Done-when` nazwaną komendę, która ją ćwiczy — celowaną (e2e **tego** kontrolera), nie pełny
  zestaw. Klasa bez komendy = dziura, decydowana przy pisaniu.
- **P2.2** — `sailes-implement`: bramka fazy = komendy z `Done-when`. Pełny zestaw + e2e **raz, po
  ostatniej fazie, przed pushem**, przez `qa` (R1). Zdanie z 1.33.0 „full suite and e2e once before
  the declaration commit” zastąpione, nie dopisane obok.
- **P2.3** — `be-dev`/`fe-dev`: lint + build + testy zmienianego modułu; nigdy pełny zestaw na fazie.
  `checker`: uruchamia komendy `Done-when` i sprawdza P2.1; nie uruchamia pełnego zestawu.
- **P2.4** — bramka wydania w `release-checklist.md` i `qa.md`: `qa` uruchamia pełny zestaw + e2e
  przed pushem, trzymając środowisko na wyłączność, z porównaniem `Known-red:` (P4).
- **P2.5** — koncept parity: „inner loop = affected tests; full suite/e2e once before push”.

**Done-when:** `node codex-agents/parity.test.js` → exit 0 z nowym konceptem na `be-dev`/`fe-dev`/`checker`;
`grep -rn "once before the declaration commit" skills agents codex-agents` → brak trafień;
`node tools/sync-blocks.js --check` → in sync; `npm test` → exit 0.
Contract-probe: n/a — tylko doktryna. Deployed-probe: n/a — brak powierzchni.

### P3 — `Lane:` z tieru ryzyka (3.1; D3, Q5a, Q5b, Q6, R2)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md`, `spec-writing-template.md` | P3.1 |
| `skills/sailes-bootstrap/gate-scaling.md` → `sync-blocks` (3 konsumenci) | P3.2 |
| `skills/sailes-test/SKILL.md`, `agents/tester.md` + `.toml` | P3.3 |
| `agents/qa.md` + `.toml` | P3.4 |
| `skills/sailes-bootstrap/agent-team-structure.md` (potok ról) | P3.2 |
| `codex-agents/parity.test.js` | P3.5 |
| `evals/lead-picks-the-lane-from-the-tier.md` | P3.6 |

- **P3.1** — linia `Lane: full | middle — tier <A|B|C>: <wyzwalacz>` przy każdej fazie; tier liczony
  przy specu z wyzwalaczy `sailes-test` Step 5, nie z osądu. Faza tier A → `full`.
- **P3.2** — `gate-scaling` dostaje tor: `full` = dzisiejszy potok; `middle` = implementer →
  `tester` bez zamrożenia (R2) → `checker` → `qa` żywy przebieg; bez `designer`. Zmiana tylko w źródle bloku + `sync-blocks`.
- **P3.3** — `tester` w `middle`: przypadki ze specu z implementacją nieprzeczytaną, plan zapisany do
  `.ai/test-plans/`, ale bez STOP-u na zamrożenie przez człowieka (R2); w `full` bez zmian. Tier nadal nie może zostać obniżony (`tester-cannot-lower-its-own-risk-tier`).
- **P3.4** — `qa` w `middle`: żywy przebieg na stosie + wklejone wyjście, bez screenów i vision-verify.
  Wyłączność środowiska bez zmian.
- **P3.5** — koncepty parity dla `tester` i `qa` w torze `middle`.
- **P3.6** — eval: dwie fazy, jedna tier A (uprawnienia), jedna tier C (formatowanie); PASS = `full`
  dla A, `middle` dla C, bez `designer` w C; FAIL także przy `middle` dla A.

**Done-when:** `node tools/sync-blocks.js --check` → in sync; `parity.test.js` → exit 0 z nowymi
konceptami; `node agents/validate-frontmatter.test.js` → exit 0; eval zapisany; `npm test` → exit 0.
Contract-probe: n/a — tylko doktryna. Deployed-probe: n/a — brak powierzchni.

### P4 — `Known-red:` nazwami (3.4; Q7, R5)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-implement/SKILL.md` (bramka fazy, bramka przed pushem) | P4.1 |
| szablon run logu w `sailes-implement` (sekcja `Known-red:`, czyszczona przy przekazaniu sesji — R5) | P4.1 |
| `skills/sailes-bootstrap/session-handoff.md` → `sync-blocks` (czyszczenie listy przy przekazaniu) | P4.1 |
| `agents/{checker,qa}.md` + `.toml` | P4.2 |
| `evals/gate-compares-red-by-name-not-count.md` | P4.4 |

- **P4.1** — tolerowana czerwień: `nazwa pliku/testu · przyczyna · termin (do najbliższego przekazania
  sesji)`. Po terminie: naprawa albo eskalacja do człowieka, nigdy odnowienie po cichu. **Liczba nie
  jest dopuszczalną formą.**
- **P4.2** — rola bramkująca wkleja `sort` nazw czerwonych testów i `comm -23 <czerwone> <Known-red>`;
  niepusty wynik = CHANGES-REQUIRED.
- **P4.4** — eval: 3 znane czerwone + 1 nowa między nimi, liczba ta sama co wczoraj ± 0 po naprawie
  jednej; PASS = nowa nazwa zgłoszona mimo zgodnej liczby.

**Done-when:** `grep -n "comm" agents/checker.md agents/qa.md codex-agents/checker.toml codex-agents/qa.toml`
→ trafienie w każdym; `node tools/sync-blocks.js --check` → in sync; `parity.test.js` → exit 0;
`npm test` → exit 0.
Contract-probe: n/a. Deployed-probe: n/a.

### P5 — raport implementera wiadomością + A/B (3.8; D2, Q4, R3)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/agent-team-structure.md` (brief `Report:`) | P5.1 |
| `agents/team-lead.md` + `.toml` (report clause, „name a FILE”) | P5.1 |
| `agents/{be-dev,fe-dev}.md` + `.toml` (`## Report`) | P5.2 |
| `AGENTS.md` (Delegation) i `skills/sailes-bootstrap/agents-md-template.md` | P5.1 |
| `.ai/eval-runs/2026-09-xx-implementer-report-as-message/` | P5.3 |

- **P5.1** — plik raportu od pierwszej zmiany: **tylko `checker`, `qa`, `tester`** (werdykt
  nieodtwarzalny z dysku). Implementer: narracja w commicie, deklaracja w `.claude/status/`
  (`outcome`/`touched`), wiadomość: stałe pola, najwyżej 40 linii (R3). Zdanie o dwóch incydentach zostaje przy
  regule, z nowym zakresem.
- **P5.2** — `## Report` w `be-dev`/`fe-dev` = stałe pola wiadomości; `Promotion candidate:` zostaje.
- **P5.3** — A/B na tym samym zadaniu fazowym, ramię A dzisiejszy plik, ramię B wiadomość: linie
  prozy zapisane do `.ai/`, **odsetek pustych zwrotów**, **raporty utracone przy przerwanym procesie**
  (ramię z celowo przerwanym workerem), znaleziska `checker`. Werdykt w `VERDICT.md`.

**Done-when:** `VERDICT.md` zawiera wszystkie cztery metryki dla obu ramion; przy wzroście pustych albo
utraconych zwrotów w ramieniu B P5 **nie wchodzi** do wydania i wraca do człowieka; `parity.test.js`
→ exit 0; `npm test` → exit 0.
Contract-probe: n/a. Deployed-probe: n/a.

### P6 — evale i wydanie

- Nowe evale z P1.4, P3.6, P4.4 uruchomione przez `sailes-eval-runner`, werdykty zapisane.
- Ponownie uruchomione evale nazywające edytowane skille i role (sprawdzone grepem 2026-09-13):
  `spec-probes-the-deployed-surface`, `tester-derives-cases-before-reading-code`,
  `tester-cannot-lower-its-own-risk-tier`, `tier-scales-the-case-list-not-only-the-proof`,
  `tester-never-weakens-a-frozen-assertion`, `inner-loop-promotes-what-caught-a-real-defect`,
  `lead-chases-an-empty-worker-return`, `worker-claims-before-it-writes`,
  `lead-delegates-instead-of-bulk-coding`, `lead-splits-brief-per-phase`.
- `docs-author` delta, CHANGELOG 1.34.0 z sekcją „What an older-stamped repo is missing”, pięć
  stempli, pełne `npm test`, zgoda człowieka na push.

**Done-when:** `node evals/harness/eval-status.js` → żaden z wymienionych nie jest STALE ani NEVER-RUN;
`release-hygiene` → five stamps at 1.34.0; `npm test` → exit 0.

## Integration coverage

Jedyny kod: `tools/contract-probe-check.js` (P1) — zestaw implementera + zamrożony zestaw `tester`
z dowodem detekcji tier B. Reszta to zachowanie modelu → evale (reguła repo). Parity i
`sync-blocks` pilnują, że doktryna nie rozjedzie się między plikami.

## Non-goals

- **3.5** — zrobione w 1.33.0 (P4).
- **3.6, 3.7, 3.9, 3b.1–3b.3, 3c.1–3c.5** — poza D1; wiersze w `.ai/backlog.md` z 2026-09-13.
- **Klasyfikator promienia rażenia z raportu** — odrzucony w Q5a na rzecz istniejących tierów.
- **Narzędzie wyliczające bramę z plików** i **parser wyjścia runnerów** — odrzucone w Q2 i Q7.
- **Upgrade `partner-portal-v3` do 1.33.1** i **pomiar oszczędności 1.33.0** — osobna praca.
