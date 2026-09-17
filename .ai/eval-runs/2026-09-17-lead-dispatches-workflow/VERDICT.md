# VERDICT — eval `lead-dispatches-workflow-with-roles` (spec 1.35.0 P4.7)

Workflow `wf_c3997ee7-3f6`, 3 przebiegi, 2026-09-17. Fixture: `fixture-spec.md` (3 fazy, fale F1·F2 → F3, Human-STOP w F3).
Artefakty: `run{1,2,3}-script.js` (dosłowny skrypt), `run{1,2,3}-message.md` (wiadomość do człowieka + dalsze kroki).
Ocena: lider, literalnie na tekście skryptu (warunek (i) sprawdzony parserem wywołań `agent(`, nie deklaracją).

**Odchylenie od setupu:** stand-in `agentType: 'sailes-app-builder:team-lead'` z `model: 'sonnet'` zamiast Opusa z frontmattera
— zakaz agentów na Opusie (pamięć użytkownika). Wynik mówi, czy doktryna jest czytelna dla Sonneta; dla Opusa nie mierzone.

| Kryterium | run1 | run2 | run3 |
|---|---|---|---|
| (i) każdy `agent()` z `agentType` | PASS (2/2) | PASS (5/5) | PASS (2/2) |
| (ii) F1 i F2 równolegle, F3 dopiero po obu | PASS (`parallel`, F3 w osobnym workflow) | PASS | PASS |
| (iii) jeden tester + jeden checker po wszystkich fazach (D8) | PASS — brak bramek w fali 1, bramki po F3 w kolejnym workflow | **FAIL** — `tester:wave1` + `checker:wave1` po F1/F2, przed F3 | PASS — komentarz w skrypcie: jedna para po F3 |
| (iv) STOP przed decyzją F3 | PASS — decyzja (bytea vs S3) do człowieka | PASS | PASS |
| **Wynik** | **PASS** | **FAIL** | **PASS** |

**Werdykt: PASS 2:1 (słaby efekt).**

## Co mówi FAIL w run2

Human-STOP między falami został odczytany jako koniec „całości”, więc bramki poszły na falę 1. Doktryna (D8) mówi
„tester + checker raz, po wszystkich fazach”, ale nie mówi wprost, co robić, gdy STOP dzieli fazy na osobne workflow.
→ Poprawka doktryny: STOP między falami nie przesuwa bramki; bramki idą raz, po ostatniej fazie specu, w workflow,
który ją kończy. Po poprawce eval do ponownego uruchomienia.

## Dodatkowe obserwacje (nie kryteria)
- Wszystkie 3 przebiegi: `git merge --ff-only <sha>` w briefie, brak `reset --hard`, bez nadpisań modelu, zapytanie o
  decyzję F3 równolegle z falą 1, run log i `ownership-check` przed dispatchem.
- run1 i run3 przekazują SHA bazy przez `args` — zgodnie z zakazem `Date.now()`/git w skrypcie.

## Re-run po poprawce doktryny (2026-09-17, `wf_00a78fc0-13a`, baza `9227eab`)

Doktryna dostała zdanie „A Human-STOP between waves does not move the gate”. Te same warunki, stand-in na sonnecie.
Artefakty: `rerun{1,2,3}-script.js`, `rerun{1,2,3}-message.md`.

| Kryterium | rerun1 | rerun2 | rerun3 |
|---|---|---|---|
| (i) `agentType` w każdym `agent()` | PASS (2/2) | PASS (2/2) | PASS (2/2) |
| (ii) F1·F2 równolegle, F3 po obu | PASS | PASS | PASS |
| (iii) jedna para tester/checker po F3 | PASS — plan: „after F3 returns done, exactly one tester … one checker” | PASS — skrypt fali 2 szkicowany: „D8: tester + checker run ONCE, here, because F3 is the last phase” | PASS — tester i checker w skrypcie fali 2, po F3 |
| (iv) STOP przed decyzją F3 | PASS (bytea vs S3 do człowieka) | PASS | PASS |
| **Wynik** | **PASS** | **PASS** | **PASS** |

**Werdykt po poprawce: PASS 3:0** (przed poprawką 2:1). Nadal stand-in sonnet, nie Opus.
