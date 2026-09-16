# Pre-Implement Report: 2026-09-16-workflow-first-orchestration

## Verdict: READY-WITH-FIXES → poprawki wpisane do specu tego samego dnia

**Waga:** `contract fix × 5 powierzchni` — trafna. Spec niesie sekcje ponad pięć (Problem, Decyzje, Integration
coverage), ale każda jest nośna: decyzje człowieka i zastąpienie specu 2026-08-06 muszą mieć jedno miejsce.
**Wire:** `deployed-surface-check.js` → OK, reguła nie dotyczy. **Contract:** `contract-probe-check.js` → OK,
każda faza z `n/a — <powód>`; jedyny zewnętrzny kształt (payload `PreToolUse` dla `Workflow`) mierzy P0.5.

## BC findings

- **[Warning] `ownership-check.js`** — nowy tryb `--spec`; tryb bloku `ownership:` (run logi, `sailes-implement`
  Pre-flight) bez zmian. Eksport `module.exports = { findOwnershipBlock, parseOwnership, findConflicts, normalize }`
  zostaje; `findConflicts` dostaje wymiar fali jako parametr opcjonalny. → Migracja: brak; test regresji na starym trybie.
- **[Warning] Wymagane `Owns` / `Plan wykonania`** — specy klientów sprzed 1.35.0 ich nie mają. → CHANGELOG: wymóg
  dla specu pisanego od 1.35.0; `--spec` tylko jawnie (wpisane w P6).
- **[Warning] `token-report.js`** — frozen suite asercje kształtu `lead`/`subagents`; zmiana addytywna (pola kosztu),
  frozen suite poza `Owns` P1. → Migracja: brak; zmiana wyniku frozen = defekt.
- **[Warning] Hook `PreToolUse`** — nowa blokada w każdym repo z pluginem (`.ai/lessons.md:300`: zasięg hooka to
  decyzja człowieka — podjęta, Q2). → Warunek FP w P5b + `Human-STOP`.
- Brak: typów publicznych, tras, schematu DB, eventów, ID ról.

## Gaps (poprawione w specu)

1. P1.1 nie obejmował podania wprost katalogu `wf_*`, a `Done-when` P1 tak go wywołuje; `meta.model` to alias,
   nie model rzeczywisty (`wf_4eb1edf7-db8/*.meta.json`: `"model":"haiku"`).
2. P3 `Done-when`: wzorzec grep z escapowanymi backtickami nie działa w powłoce → pięć prostych `grep -c -F`.
3. P5a: wywołanie zapisanego workflow po `name` nie niesie treści skryptu → `exit 0` + nota, bez zgadywania.
4. P4: potwierdzone, że zdania o kolejności modelu (`agents/team-lead.md:166`, `agent-team-structure.md:105`) są
   poza blokami `sync-blocks`; brak ryzyka rozjazdu z `codex-agents/team-lead.toml`.
5. P6: edycje P3/P4 wystawią evale na STALE → `eval-status.js` w `Done-when` z decyzją człowieka.

## Risks

| Scenariusz | Waga | Obszar | Mitygacja | Ryzyko rezydualne |
|---|---|---|---|---|
| Hook blokuje poprawny skrypt (np. opcje w zmiennej) | wysoka | każda sesja z pluginem | opcje w zmiennej → nie blokuje; FP na wszystkich skryptach maszyny; Human-STOP | skrypty spoza maszyny |
| P0 nierozstrzygnięty (effort/worktree) | średnia | treść doktryny P4 | doktryna zapisuje „nierozstrzygnięte” z dowodem | ponowny pomiar w kolejnej wersji |
| Eval P4.7 zależny od stand-in | średnia | dowód zachowania | 3 przebiegi, bez pytania o plan | stand-in ≠ żywa sesja |
| Push na `main` = deploy na każdą maszynę | wysoka | dystrybucja | P6 Human-STOP, `npm test` przez `qa` raz | — |
| Równoległe fazy fali 1 na jednym `npm test` | niska | środowisko | każda faza uruchamia tylko swoje testy; pełne `npm test` raz w P6 | — |

Nieodwracalne kroki: tylko push na `main` (P6). Rollback: revert merge commitu na `main`.

## Remediation

Wpisane do specu 2026-09-16 (pięć poprawek z „Gaps”). Brak poprawek otwartych.

## Sequencing

Fala 1 zgodnie ze specem. P0.4 używa parsera z `research/costs.md`, jeśli P1 nie jest jeszcze zintegrowane —
fazy fali 1 pozostają niezależne.
