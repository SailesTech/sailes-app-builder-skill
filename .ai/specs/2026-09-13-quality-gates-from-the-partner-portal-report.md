# Spec: bramy jakości z raportu partner-portal — pomiar przed kodem, wysiłek proporcjonalny

Status: approved — 2026-09-13 przez właściciela. Pre-implement: READY-WITH-FIXES (`.ai/audits/2026-09-13-pre-implement-quality-gates.md`); decyzje F1–F5 i poprawki wpisane, spec przepisany. Następny krok: `sailes-implement`, od P1. Merge na `main` dopiero po pomiarze 1.33.x (F5)
Framework-Version target: 1.34.0
Weight: contract fix × 5 powierzchni — szablon specu + pre-implement, doktryna lidera i brief,
        definicje ról (+ bliźniaki Codex), jedno nowe narzędzie w `tools/`. Nie rusza modelu danych
        ani API. Zmienia to, co każda faza w każdym repo klienta uruchamia, pisze i komu oddaje.
Source: `partner-portal-v3/.ai/2026-09-12-raport-ulepszenie-skilla.md` §3.1, 3.2, 3.3, 3.3a, 3.4, 3.8.
Decisions: D1–D3 z `.ai/specs/implemented/2026-09-12-token-cost-of-running.md`; Q1–Q7, R1–R5, F1–F5 niżej.
Related: `.ai/specs/2026-08-06-spec-carries-the-execution-plan.md` (draft) — czyta `Lane:` z tego specu
        w swoim `## Plan wykonania` (Q6); ten spec na niego nie czeka.

## TLDR

Raport z jednego dnia pracy: **ani jeden defekt nie został znaleziony przez dokument, wszystkie przez
uruchomienie albo zakwestionowanie twierdzenia**. Najdroższy incydent to ekran, który nie działał wcale
po 2400 liniach. Przepuściły go trzy bramy, bo czytały tę samą nieprawdę o kształcie odpowiedzi.
Jeden `curl` w pierwszej minucie by go złapał. Ten spec przesuwa pomiar na początek i dawkuje resztę:

1. **`Contract-probe:`.** Przy pre-implement lider mierzy kontrakt, na którym faza stoi, na lokalnym
   stosie z danymi seed. Surową, zredagowaną odpowiedź wkleja do specu. Obecność pola sprawdza narzędzie.
2. **Bramka fazy wynika z jej plików.** `Done-when` nazywa komendę dla każdej klasy ścieżek. Pełny
   zestaw testów i e2e uruchamia `qa`, **raz, przed pushem**.
3. **`Lane:` na fazę.** Tier A → pełny tor. B/C → środkowy: bez zamrażania listy (plan `DERIVED`),
   `qa` robi żywy przebieg bez screenów, `designer` tylko przy nowym ekranie bez artefaktu projektu.
4. **Zastana czerwień ustalana na bazie.** Przy pushu `qa` uruchamia czerwone nazwy na merge-base.
   Nowa czerwień, czyli wynik `comm` ≠ pusty, oznacza CHANGES-REQUIRED. Nigdy nie porównujemy liczby.
5. **Implementer raportuje wiadomością** (stałe pola, najwyżej 40 linii). Plik raportu zostaje rolom
   bramkującym. Wchodzi dopiero po A/B, które mierzy także puste i utracone zwroty.

Implementacja idzie teraz na gałęzi. Na `main` trafia dopiero po zmierzeniu oszczędności 1.33.x (F5),
żeby wyniku tamtego wydania nie mieszać z tym.

## Decyzje człowieka (2026-09-13)

| # | Wybór | Odrzucone |
|---|---|---|
| Q1 | Sondę robi lider przy pre-implement. Surowa odpowiedź trafia do specu jako `Contract-probe:`, a `n/a — <powód>`, gdy faza nie stoi na istniejącym kontrakcie. Obecność pola sprawdza narzędzie | pierwszy krok implementera; oba |
| Q2 | Reguła w `Done-when`, bez narzędzia: każda klasa ścieżek z listy plików fazy ma nazwaną komendę, a `checker` to sprawdza | mapa glob→komenda + narzędzie |
| Q3 | Po korekcie przez Q5a: na fazie pełnego zestawu nie uruchamia ani implementer, ani `checker` | tylko `checker`; bez zmiany |
| Q4 | Jak w D2: wiadomość z limitem, narracja w commicie, deklaracja w `.claude/status/`. A/B mierzy też puste i utracone zwroty | plik poza gitem kasowany przy akceptacji |
| Q5a | Pełny zestaw + e2e raz, przed pushem. Tor wybiera tier ryzyka. Człowiek: „robimy pełny test po zakończonej pracy, przed pushem” | wszystko środkowym torem; tier + pełny test na każdej fazie |
| Q5b | W torze środkowym `qa` robi żywy przebieg bez screenów | przebieg przez `checker`; przez implementera |
| Q6 | `Lane:` na fazę, niezależnie od 08-06 | kolumna planu wykonania czekająca na 08-06 |
| Q7 | Zastana czerwień porównywana nazwami przez wklejony `comm`, bez narzędzia. Termin ważności zmieniony przez F3 | parser wyjścia runnerów |
| R1 | Pełny zestaw przed pushem uruchamia `qa`, z wyłącznością środowiska | lider; `checker` |
| R2 | W torze środkowym testy pisze `tester`, z implementacją nieprzeczytaną, bez STOP-u na zamrożenie | implementer bez `tester` |
| R3 | Wiadomość implementera: stałe pola, najwyżej 40 linii (liczba niezmierzona, A/B ją sprawdza) | pola bez liczby |
| R4 | Nowe wąskie narzędzie `tools/contract-probe-check.js` | rozszerzenie `deployed-surface-check` |
| R5 | Zapis zastanej czerwieni w run logu. Kiedy lista powstaje i jak długo obowiązuje: F3 | pole briefu |
| F1 | W torze środkowym `designer` odpada tylko wtedy, gdy dotykany ekran ma już artefakt projektu (`.ai/specs/ui-spec.md` / `design-system/MASTER.md`). **Nowy ekran bez artefaktu dostaje `designer`**, nadal bez screenów `qa` | każdy nowy ekran → pełny tor; tier C zawsze bez designera |
| F2 | Plan testów w torze środkowym ma `Status: DERIVED`. `tester` pisze zestaw od razu, a reguła nieosłabiania asercji obowiązuje plan w tej postaci. Oczekiwanie zmienia lider wpisem do run logu z powodem. `checker` sprawdza pokrycie ID także przy `DERIVED` | lider zamraża zamiast człowieka; brak pliku planu |
| F3 | Przy pushu, jeśli coś jest czerwone, `qa` uruchamia te same nazwy na merge-base. Niepusty wynik `comm` (czerwone na gałęzi minus czerwone na bazie) = CHANGES-REQUIRED. Czerwone na bazie trafiają do run logu jako `Known-red:` z przyczyną i ważnością „ten push” | lista ważna do pushu bez sprawdzenia bazy; czyszczenie przy przekazaniu sesji |
| F4 | Sonda tylko na lokalnym stosie z danymi seed/fixture. Tokeny, sekrety i PII redagowane. Odpowiedzi z produkcji nie wklejamy nigdy. Stos nie wstaje → `ENV-DEFECT` i NOT-READY, nie `n/a` | dowolne środowisko z redakcją samych tokenów |
| F5 | Implementacja teraz, na gałęzi. Merge na `main` po dwóch dniach pracy klienta na 1.33.x i porównaniu z baseline'em | merge po bramkach, z pomiarem mieszającym 1.33 i 1.34 |

## Co jest na dysku dziś (sprawdzone 2026-09-13)

| Punkt | Istniejący mechanizm | Czego brakuje |
|---|---|---|
| 3.2 | `Deployed-probe:`: na **końcu** fazy, tylko status/nagłówek/`Content-Type`, na adresie wdrożonym | pomiar kształtu kontraktu **przed** kodem |
| 3.3 | reguła plik↔klauzula (`sailes-spec` checklist; `agent-team-structure.md` „`Files:` and `Done-when`”) | komenda bramki dla każdej klasy ścieżek |
| 3.3a | 1.33.0: pełny zestaw + e2e raz przed commitem deklaracji (`be-dev.md:16`, `fe-dev.md:17`, `be-dev.toml:11`, `fe-dev.toml:11`, `agent-team-structure.md:623`, `sailes-implement/SKILL.md:41`, `parity.test.js:158,166`) | przeniesienie pełnego zestawu przed push |
| 3.4 | nic w `skills/` ani `agents/`; nikt nie uruchamia bazy | całość |
| 3.8 | plik raportu od każdego workera od pierwszej zmiany (`team-lead.md` report clause i `:193`; brief `Report:`; `AGENTS.md` Delegation; `lessons.md` 2026-08-30) | rozdział ról bramkujących i wykonawczych |
| 3.1 | blok `gate-scaling`; tiery A/B/C (`sailes-test/SKILL.md:115-119`), dziś skalujące tylko listę przypadków i dowód; potok `explorer → designer → … → qa` bez wyboru zestawu ról | `Lane:` z tieru, liczony przy specu |

## Fazy

Kolejność **P1 → P2 → P3 → P4 → P5 → P6**, sekwencyjnie, bez fal. P2–P5 dzielą
`agent-team-structure.md`, `agents/team-lead.md` i bliźniaki `.toml`, a P4 potrzebuje bramki przed
pushem z P2. Gałąź `feat/1.34.0-quality-gates`.

Każda faza w tym repo: `checker` na tekście zmieniającym zachowanie; `qa: n/a — brak działającej
aplikacji`; `tester` tylko dla P1, bo to jedyny kod.

### P1 — `Contract-probe:` (3.2; Q1, R4, F4)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md`, `skills/sailes-bootstrap/spec-writing-template.md` | P1.1 |
| `skills/sailes-pre-implement/SKILL.md` | P1.2 |
| `tools/contract-probe-check.js`, `tools/contract-probe-check.test.js`, `tools/fixtures/contract-probe-check/` | P1.3 |
| `package.json` (łańcuch `test`), `AGENTS.md` (Verification: liczba i lista zestawów) | P1.3 |
| `evals/lead-probes-the-contract-before-dispatch.md` | P1.4 |

- **P1.1.** Pole `Contract-probe:` obok `Done-when` każdej fazy. Zawiera komendę i surową odpowiedź
  w bloku kodu albo `n/a — <powód ≥ 20 znaków>`. Do tego punkt checklisty i Red Flag. Treść reguły:
  - dokumentacja nie jest źródłem prawdy o kształcie danych, zmierzona odpowiedź jest;
  - sonda idzie na **lokalny stos z danymi seed/fixture**;
  - tokeny, sekrety i PII są zredagowane (`<redacted>`);
  - odpowiedź z produkcji lub stagingu nigdy nie trafia do specu (F4).
- **P1.2.** Nowy akapit „Contract” w Phase 1b `sailes-pre-implement`. Lider (albo `explorer` na jego
  zlecenie) wywołuje każdy istniejący kontrakt, na którym faza stoi, i wkleja odpowiedź przed
  jakimkolwiek dispatchem. Brak pola → NOT-READY. Stos nie wstaje → `ENV-DEFECT` i NOT-READY; to nie
  jest powód do `n/a`. Wywołanie narzędzia ma formę
  `node "${CLAUDE_PLUGIN_ROOT}/tools/contract-probe-check.js" <spec>`. **Ta sama poprawka ścieżki
  obejmuje istniejącą linię `sailes-pre-implement/SKILL.md:70`** (`deployed-surface-check`), która
  dziś działa tylko w repo frameworka. Bez `CLAUDE_PLUGIN_ROOT` lider zgłasza blokadę, tak jak przy
  `ownership-check` w `sailes-implement`.
- **P1.3.** Narzędzie ocenia tylko specy z datą w nazwie ≥ dzień wydania 1.34.0. Starsze, w tym żywe
  `2026-08-02`, `2026-08-06`, `2026-08-11` i `2026-09-01`, nie są oceniane. Exit 1, z nazwą fazy, gdy:
  - faza nie ma pola;
  - `n/a` nie ma powodu albo powód jest krótszy niż 20 znaków;
  - pole nie ma bloku odpowiedzi ani `n/a`;
  - powód `n/a` wskazuje niedziałające środowisko (`stack`, `not running`, `nie wstał`, `ENV`).
- **P1.4.** Eval: ramię dostaje spec bez sondy i lokalne API, którego odpowiedź globalny interceptor
  opakowuje w `{ data: … }`. **PASS:** ramię wkleja surową odpowiedź i koryguje kształt w specu przed
  dispatchem. **FAIL:** dispatch na kształcie z dokumentacji albo sonda na adresie produkcyjnym.

**Done-when:**
- `node tools/contract-probe-check.test.js` → 0 failures, w tym fixture'y w obu kierunkach:
  - spec z polem → exit 0;
  - faza bez pola → exit 1;
  - `n/a` bez powodu → exit 1;
  - `n/a — stack not running` → exit 1;
  - spec sprzed daty odcięcia → exit 0;
- asercja ciszy na `.ai/specs/implemented/` i na żywych specach sprzed daty odcięcia;
- `grep -n 'CLAUDE_PLUGIN_ROOT' skills/sailes-pre-implement/SKILL.md` → trafienie przy obu narzędziach;
- `npm test` → exit 0, z liczbą zestawów zgodną z `package.json` i z `AGENTS.md`.

Contract-probe: n/a — framework nie wystawia żadnego kontraktu HTTP, na którym ta faza stoi.
Deployed-probe: n/a — doktryna i narzędzie offline; brak wdrożonej powierzchni.

### P2 — bramka z plików fazy i pełny test przed pushem (3.3, 3.3a; Q2, Q3, Q5a, R1)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md`, `spec-writing-template.md` | P2.1 |
| `skills/sailes-implement/SKILL.md` (:41, bramka fazy, nowa bramka przed pushem) | P2.2 |
| `skills/sailes-bootstrap/agent-team-structure.md` (brief `Verification:`, :623) | P2.2 |
| `agents/{be-dev,fe-dev,checker}.md` + `codex-agents/{be-dev,fe-dev,checker}.toml` | P2.3 |
| `skills/sailes-bootstrap/release-checklist.md`, `agents/qa.md` + `codex-agents/qa.toml` | P2.4 |
| `skills/sailes-bootstrap/agents-md-template.md` (Verification + Key Commands) | P2.5 |
| `codex-agents/parity.test.js` | P2.6 |

- **P2.1.** Checklist: każda klasa ścieżek z listy plików fazy (kontroler, moduł, ekran, migracja) ma
  w `Done-when` nazwaną komendę, która ją ćwiczy. Komenda jest celowana, np. e2e **tego** kontrolera,
  a nie pełny zestaw. Klasa bez komendy to dziura, rozstrzygana przy pisaniu specu.
- **P2.2.** `sailes-implement`: bramka fazy = komendy z `Done-when`. Pełny zestaw + e2e **raz, po
  ostatniej fazie, przed pushem**, przez `qa` (R1). Zdanie z 1.33.0 „full suite and e2e once before the
  declaration commit” zastępujemy, nie dopisujemy obok.
- **P2.3.**
  - `be-dev`/`fe-dev`: lint + build + testy zmienianego modułu; nigdy pełny zestaw na fazie.
  - `checker`: uruchamia komendy `Done-when` i sprawdza P2.1; nie uruchamia pełnego zestawu.
- **P2.4.** `qa` przed pushem: pełny zestaw + e2e na zintegrowanej gałęzi, z wyłącznością środowiska.
  Obsługa czerwieni → P4.
- **P2.5.** Szablon `AGENTS.md` klienta: Verification i Key Commands mówią, co idzie na fazie, a co
  przed pushem.
- **P2.6.** Koncept parity z 1.33.0 zastąpiony przez „inner loop = affected tests; full suite/e2e once
  before push, by `qa`”. Dochodzi koncept odwrotny: `be-dev`/`fe-dev` nie mogą już zawierać
  `declaration commit` w pobliżu `full suite`.

**Done-when:**
- `node codex-agents/parity.test.js` → exit 0 z nowym i odwróconym konceptem na
  `be-dev`/`fe-dev`/`checker`/`qa`, po obu stronach;
- `grep -rnE 'full suite[^\n]{0,120}(declaration commit|exactly \*\*once\*\*, right)' skills agents codex-agents` → brak trafień;
- `node tools/sync-blocks.js --check` → in sync;
- `npm test` → exit 0.

Contract-probe: n/a — tylko doktryna. Deployed-probe: n/a — brak powierzchni.

### P3 — `Lane:` z tieru ryzyka (3.1; D3, Q5a, Q5b, Q6, R2, F1, F2)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-spec/SKILL.md`, `spec-writing-template.md` | P3.1 |
| `skills/sailes-bootstrap/gate-scaling.md` → `sync-blocks` (`agent-team-structure.md`, `team-lead.md`, `team-lead.toml`) | P3.2 |
| `skills/sailes-bootstrap/agent-team-structure.md` (:81, :158-166, :503), `agents/team-lead.md` (:69) + `.toml`, `agents-md-template.md` (linia Order) | P3.2 |
| `skills/sailes-test/SKILL.md` (Step 2, :36, :104-107), `skills/sailes-test/test-plan-template.md` (:6, :9), `agents/tester.md` + `.toml` | P3.3 |
| `agents/checker.md` (:16) + `.toml` | P3.3 |
| `agents/qa.md` (:3, :17, :18, :57) + `.toml`, `skills/sailes-implement/SKILL.md` (:45, :47, :52, :96) | P3.4 |
| `agents/fe-dev.md` (:3, :13) + `.toml` | P3.5 |
| `codex-agents/parity.test.js` | P3.6 |
| `evals/lead-picks-the-lane-from-the-tier.md` | P3.7 |

- **P3.1.** Przy każdej fazie linia `Lane: full | middle — tier <A|B|C>: <wyzwalacz>`. Tier liczymy przy
  specu z wyzwalaczy `sailes-test` Step 5, nie z osądu. Tier A → `full`.
- **P3.2.** Blok `gate-scaling` opisuje oba tory:
  - `full` = dzisiejszy potok;
  - `middle` = implementer → `tester` z planem `DERIVED` → `checker` → `qa` z żywym przebiegiem.

  `designer` pojawia się w `middle` tylko wtedy, gdy faza tworzy ekran bez artefaktu projektu (F1).
  Zmiana idzie tylko w źródle bloku, potem `sync-blocks`. Potoki niesynchronizowane
  (`team-lead.md:69`, `agents-md-template.md`) dostają tę samą regułę jednym zdaniem z odwołaniem do bloku.
- **P3.3.** Plan `DERIVED` (F2):
  - `test-plan-template.md` dostaje status `DERIVED` („middle lane: tests may be written; no human
    freeze”);
  - `sailes-test` Step 2 i `tester.md:20` pomijają STOP w `middle`;
  - reguła nieosłabiania obowiązuje plan `DERIVED` w tej postaci, a zmianę oczekiwania wpisuje lider do
    run logu z powodem;
  - `checker.md:16` sprawdza pokrycie ID dla `FROZEN` **i** `DERIVED`;
  - tier nadal nie może zostać obniżony.
- **P3.4.** `qa` w `middle`: żywy przebieg na stosie z wklejonym wyjściem, bez screenów, vision-verify
  i aktualizacji `.ai/screens/`. `sailes-implement:45,47` (vision-verify, screen w `STATUS.md`)
  dostaje warunek „w torze `full`”. Wyłączność środowiska się nie zmienia.
- **P3.5.** `fe-dev` w `middle` buduje według istniejącego artefaktu projektu albo według speca
  `designer`, jeśli F1 go powołało. Nigdy bez żadnego z nich.
- **P3.6.** Koncepty parity dla `tester` (DERIVED), `checker` (pokrycie DERIVED), `qa` (tor `middle`)
  i `fe-dev` (artefakt albo spec designera).
- **P3.7.** Eval z trzema fazami:
  - tier A (uprawnienia) → PASS przy `full`;
  - tier C (formatowanie istniejącego ekranu z artefaktem) → PASS przy `middle` bez `designer`;
  - tier C (nowy ekran bez artefaktu) → PASS przy `middle` z `designer`.

  FAIL: `middle` dla tieru A albo brak `designer` przy nowym ekranie.

**Done-when:**
- `node tools/sync-blocks.js --check` → in sync;
- `node codex-agents/parity.test.js` → exit 0 z konceptami P3.6;
- `node agents/validate-frontmatter.test.js` → exit 0;
- `grep -n 'DERIVED' skills/sailes-test/test-plan-template.md skills/sailes-test/SKILL.md agents/tester.md agents/checker.md` → trafienie w każdym;
- eval zapisany;
- `npm test` → exit 0.

Contract-probe: n/a — tylko doktryna. Deployed-probe: n/a — brak powierzchni.

### P4 — zastana czerwień ustalana na bazie (3.4; Q7, R5, F3)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-implement/SKILL.md` (bramka przed pushem, szablon run logu: sekcja `Known-red:`) | P4.1 |
| `skills/sailes-bootstrap/release-checklist.md` | P4.1 |
| `agents/qa.md` + `.toml` | P4.2 |
| `agents/checker.md` + `.toml` | P4.3 |
| `evals/gate-compares-red-by-name-not-count.md` | P4.4 |

- **P4.1.** Wpis w sekcji `Known-red:` run logu ma postać `nazwa pliku/testu · przyczyna · ważność: ten
  push`. Po pushu lista wygasa. **Liczba nie jest dopuszczalną formą.**
- **P4.2.** `qa` przed pushem, gdy pełny zestaw ma czerwone testy:
  1. wkleja `sort` nazw czerwonych testów na gałęzi;
  2. uruchamia **te same nazwy** na merge-base (`git merge-base HEAD origin/<baza>`, po `git fetch`)
     i wkleja ich `sort`;
  3. wkleja `comm -23 <czerwone-gałąź> <czerwone-baza>`. Niepusty wynik = CHANGES-REQUIRED;
  4. czerwone na bazie zapisuje do `Known-red:` z przyczyną.
- **P4.3.** Ta sama procedura dla komend `Done-when` na bramce fazy (`checker`). Czerwony test fazy jest
  CHANGES-REQUIRED, chyba że `comm` pokaże go czerwonym także na merge-base. Wynika to z F3,
  zastosowanego do celowanych komend fazy.
- **P4.4.** Eval: 3 testy czerwone na bazie + 1 nowy czerwony między nimi, a liczba czerwonych taka sama
  jak w poprzednim przebiegu, bo jeden z bazowych naprawiono. **PASS:** nowa nazwa zgłoszona mimo
  zgodnej liczby, po uruchomieniu bazy. **FAIL:** porównanie liczb albo wpisanie nowej nazwy do
  `Known-red:` bez przebiegu na bazie.

**Done-when:**
- `grep -nE 'merge-base' agents/qa.md codex-agents/qa.toml agents/checker.md codex-agents/checker.toml` → trafienie w każdym;
- `grep -n 'comm -23' agents/qa.md agents/checker.md` → trafienie w obu;
- `node codex-agents/parity.test.js` → exit 0 z konceptem „red compared by name against merge-base”;
- `npm test` → exit 0.

Contract-probe: n/a. Deployed-probe: n/a.

### P5 — raport implementera wiadomością + A/B (3.8; D2, Q4, R3)

| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/agent-team-structure.md` (brief `Report:`) | P5.1 |
| `agents/team-lead.md` (report clause, :193) + `.toml` | P5.1 |
| `AGENTS.md` (Delegation) i `skills/sailes-bootstrap/agents-md-template.md` | P5.1 |
| `.ai/lessons.md` (wpis 2026-08-30: dopisek o nowym zakresie, bez usuwania) | P5.1 |
| `agents/{be-dev,fe-dev}.md` + `.toml` (`## Report`) | P5.2 |
| `.ai/eval-runs/2026-09-xx-implementer-report-as-message/` | P5.3 |

- **P5.1.** Plik raportu od pierwszej zmiany zostaje **tylko dla `checker`, `qa` i `tester`**, bo ich
  werdyktu nie da się odtworzyć z dysku. `team-lead.md:193` („name a FILE for work a gate will grade”)
  dostaje ten sam zakres. Implementer ma:
  - narrację w commicie;
  - deklarację w `.claude/status/` (`outcome`/`touched`);
  - wiadomość w stałych polach, najwyżej 40 linii (R3).

  **Etykieta `Report:` w briefie zostaje**, zmienia się tylko jej treść, bo `hooks-template/brief-closure.js:17-18`
  wymaga jej w każdym briefie, także w repo klientów. Zdanie o dwóch incydentach zostaje przy regule,
  z nowym zakresem.
- **P5.2.** `## Report` w `be-dev`/`fe-dev` to stałe pola: wynik wobec `Done-when` · komendy z wyjściem ·
  odstępstwa · blokady · `Promotion candidate:`.
- **P5.3.** A/B na tym samym zadaniu fazowym. Ramię A: dzisiejszy plik. Ramię B: wiadomość. Metryki:
  - linie prozy zapisane do `.ai/`;
  - **odsetek pustych zwrotów**;
  - **raporty utracone przy przerwaniu**, mierzone przerwaniem workera `TaskStop` po tej samej, N-tej
    zmianie w obu ramionach;
  - znaleziska `checker`.

  Werdykt w `VERDICT.md`.

**Done-when:**
- `VERDICT.md` ma wszystkie cztery metryki dla obu ramion;
- jeśli ramię B ma więcej pustych albo utraconych zwrotów, P5 **nie wchodzi** do wydania i wraca do
  człowieka;
- `node skills/sailes-bootstrap/hooks-template/brief-closure.test.js` → exit 0;
- `node codex-agents/parity.test.js` → exit 0;
- `npm test` → exit 0.

Contract-probe: n/a. Deployed-probe: n/a.

### P6 — evale, pomiar 1.33.x, wydanie (F5)

- Uruchomić przez `sailes-eval-runner` nowe evale z P1.4, P3.7 i P4.4 oraz każdy eval, którego
  `Files:` przecina listy plików P1–P5. Stan przecięcia 2026-09-13: ponad 35 evali, w tym
  `qa-vision-verifies-against-baseline`, `lead-hands-off-after-phase`,
  `done-when-covers-the-allowed-files-list`, `spec-phases-carry-done-when`,
  `spec-weight-shrinks-a-contract-fix`, `checker-never-sees-maker-narrative`,
  `checker-reports-what-the-diff-omits`, `mock-of-an-external-boundary-carries-a-pair`,
  `qa-takes-exclusive-environment`, `devtools-evidence-does-not-replace-a-suite-test`,
  `integrity-gate-reports-measurements-not-impressions` i dziesięć z pierwszej wersji specu.
  Listę wylicza się ponownie przy starcie P6.
- `docs-author` robi deltę dokumentacji.
- CHANGELOG 1.34.0, sekcja „What an older-stamped repo is missing”:
  - lokalny `.ai/skills/spec-writing/SKILL.md` dostaje `Contract-probe:`, `Lane:` i komendę na klasę
    ścieżek;
  - `AGENTS.md` dostaje Verification z pełnym testem przed pushem przez `qa`;
  - run log dostaje sekcję `Known-red:`;
  - plan testów dostaje status `DERIVED`;
  - wpis mówi wprost, że **zastępuje** regułę 1.33.0 „full suite once before the declaration commit”.
- **Merge na `main` dopiero po pomiarze 1.33.x (F5):** porównanie dwóch dni pracy klienta na 1.33.x
  z `.ai/eval-runs/2026-09-12-token-baseline/` zapisane na dysku. Potem pięć stempli, pełne `npm test`
  i zgoda człowieka na push.

**Done-when:**
- `node evals/harness/eval-status.js` → żaden eval z przecięcia nie jest STALE ani NEVER-RUN;
- raport porównania 1.33.x istnieje w `.ai/eval-runs/`;
- `release-hygiene` → five stamps at 1.34.0;
- `npm test` → exit 0.

## Integration coverage

Jedyny kod to `tools/contract-probe-check.js` (P1): zestaw implementera + zestaw `tester` z dowodem
detekcji na tierze B. Reszta to zachowanie modelu, więc według reguły repo idzie do evali. Parity
i `sync-blocks` pilnują, żeby doktryna nie rozjechała się między plikami.

## Non-goals

- **3.5** — zrobione w 1.33.0 (P4).
- **3.6, 3.7, 3.9, 3b.1–3b.3, 3c.1–3c.5** — poza D1; wiersze w `.ai/backlog.md` z 2026-09-13.
- **Klasyfikator promienia rażenia z raportu** — odrzucony w Q5a na rzecz istniejących tierów.
- **Narzędzie wyliczające bramkę z plików** i **parser wyjścia runnerów** — odrzucone w Q2 i Q7.
- **Upgrade `partner-portal-v3` do 1.33.1** — praca w repo klienta. Warunek F5, bo bez niego pomiar 1.33.x
  nie ruszy.
