# VERDICT — P0: fakty harnessu Workflow (spec 2026-09-16-workflow-first-orchestration)

Claude Code v2.1.272 · sesja `a905693a-d478-428c-9929-031dee83c6f5` · workflow `wf_bd749c00-327` (pierwsze podejście),
`wf_f63f5640-6d1` (nieudane, patrz P0.2c), `wf_3163fdd8-fb5` (powtórka). Transkrypty:
`~/.claude/projects/-home-charlie/a905693a-d478-428c-9929-031dee83c6f5/subagents/workflows/<wf>/agent-*.jsonl`.
Koszt: obliczony z `message.usage` (dedup po `message.id`), ceny $/1M: sonnet 2/10, haiku 1/5, cache read 0,1×, cache write 1,25×.

## P0.1 effort

**Werdykt: działa (słaby dowód, n = 2 + 2).** `agent({agentType: 'sailes-app-builder:checker', effort})`, to samo zadanie
(przegląd `tools/ownership-check.js:160-236`), model `claude-sonnet-5` we wszystkich czterech.

| Sonda | effort | tury | output tokens |
|---|---|---|---|
| checker #0 | low | 2 | 1152 |
| checker #2 | low | 2 | 904 |
| checker #1 | high | 3 | 3078 |
| checker #3 | high | 2 | 2469 |

`high` ≈ 2,7× tokenów wyjścia `low`. Jakość wyników porównywalna (wszystkie cztery znalazły brak case-foldingu i brak
wykrywania zawierania katalog/plik). `meta.json` nie zapisuje `effort` (pole brak) — parametr widać tylko po skutku.
Uwaga: Haiku 4.5 nie obsługuje `effort` w API — nie mierzone na explorerze.

## P0.2 worktree

**Werdykt: działa jak doktryna zakłada (wspólne `.git`, commit widoczny od razu), z trzema zastrzeżeniami.**
Sonda `be-dev`, `isolation: 'worktree'` (`wf_3163fdd8-fb5`), surowe wyjście:

```
git log --oneline -1            → 9f79632 docs(1.34.0): record the merge and push ...   (= main, NIE gałąź feature 7509536)
pwd                             → .../sailes-app-builder-skill/.claude/worktrees/wf_3163fdd8-fb5-1
git rev-parse --git-common-dir  → /home/charlie/Work/Internal/sailes-app-builder-skill/.git
git branch --show-current       → worktree-wf_3163fdd8-fb5-1
git merge --ff-only 7509536...  → Fast-forward 9f79632..7509536 (exit 0)
git commit                      → [worktree-wf_3163fdd8-fb5-1 1b10329] WIP: P0.2 worktree probe
git -C <repo główne> log        → TOOL-LEVEL REFUSAL: "this command redirects git to the shared checkout via -C"
```
Z głównego repo: `git log --oneline -1 1b103298db54a5abc2baf69cfd555ed5bea94e5a` → `1b10329 WIP: P0.2 worktree probe`.

- **P0.2a — baza worktree to gałąź domyślna (`main`), nie bieżąca gałąź lidera.** Wszystkie 6 worktree tego przebiegu
  startowały z `9f79632`. Brief MUSI synchronizować bazę.
- **P0.2b — `git reset --hard <sha>` jest blokowany przez klasyfikator auto mode niedeterministycznie**
  („Irreversible Local Destruction”): w `wf_bd749c00-327` zablokowane 5 z 6 agentów, którzy go wywołali (P0.2, P0.4 ×4;
  haiku #1 przepuszczony); w `wf_176ebaa2-236` przepuszczone 3 z 3. **`git merge --ff-only <sha>` przeszedł 6 z 6.**
- **P0.2c — worktree jest cięty z repo, w którym jest cwd sesji lidera w chwili uruchomienia workflow.**
  `wf_f63f5640-6d1` uruchomiony z cwd poza repo: 6/6 `WorktreeIsolationError: Cannot create agent worktree: not in a git repository`, 0 tokenów.
- Agent w worktree nie może użyć `git -C <repo główne>` ani `Write` do ścieżki repo głównego (P0.3) — integracja jest liderowa.

## P0.3 zapis plików przez role

**Werdykt: `Write` działa w obrębie własnego worktree i poza repo; do repo głównego tylko przez Bash.**
Sonda `tester`, `isolation: 'worktree'` (`wf_bd749c00-327`), wynik narzędzia dosłownie:

| Próba | Wynik |
|---|---|
| Write `.ai/test-plans/p03-probe.md` (worktree) | OK — „File created successfully” |
| Write `.ai/runs/p03-report.md` (worktree) | OK |
| Write `<scratchpad>/p03-findings.md` (poza repo) | OK |
| Write `<repo główne>/.claude/status/tester-p03-probe.md` | ODMOWA — „This agent is isolated in the worktree … Edit the worktree copy of this file instead of the shared-checkout path.” |
| Bash `printf > <repo główne>/.claude/status/…` | OK (asymetria z `team-lead.md:103` potwierdzona) |

Odmowa z researchu (`wf_c7c25bee-3b3`: „Subagents should return findings as text, not write report files”) dotyczyła
agenta **bez** worktree piszącego `findings.md`; nie odtworzyła się tu dla testera w worktree. Warunek odmowy nie jest
ustalony — D3 (werdykt schematem, zapis przez lidera) omija go niezależnie od warunku.

## P0.4 A/B haiku vs sonnet (`be-dev`, jedno zadanie)

**Werdykt: na małym, dobrze wyspecyfikowanym zadaniu haiku = sonnet jakościowo, ~2× taniej.** Zadanie: `parseDuration`
z regułami w briefie; ocena ukrytym testem lidera `p04-acceptance.js` (22 przypadki, agenci go nie widzieli).

| Przebieg | model | tury | output | USD | ukryty test |
|---|---|---|---|---|---|
| haiku #0 | claude-haiku-4-5-20251001 | 16 | 9773 | 0.1234 | 22/22 |
| haiku #1 | claude-haiku-4-5-20251001 | 20 | 9704 | 0.1382 | 22/22 |
| haiku #2 | claude-haiku-4-5-20251001 | 9 | 5993 | 0.0545 | 22/22 |
| sonnet #0 | claude-sonnet-5 | 17 | 7310 | 0.1876 | 22/22 |
| sonnet #1 | claude-sonnet-5 | 14 | 8953 | 0.1964 | 22/22 |
| sonnet #2 | claude-sonnet-5 | 18 | 9309 | 0.2300 | 22/22 |

Średnio: haiku $0.105 / ukończone zadanie, sonnet $0.205. Tury porównywalne (15 vs 16,3).
**Nie ustalone:** zachowanie na zadaniu z niejednoznacznym briefem, dużym kontekstem repo (Haiku 200K) albo
wymagającym osądu — jedno zadanie nie uzasadnia zmiany tieru `be-dev` (non-goal specu; decyzja w osobnej zmianie).

## P0.5 payload `PreToolUse` dla `Workflow`

**Werdykt: nierozstrzygnięte w P0.** Hook w `<repo>/.claude/settings.local.json` nie wykonał się: sesja wystartowała
z cwd `/home/charlie`, więc ustawienia projektu repo skilla nie były wczytane (brak plików `p05-payload-*.json`).
Ustawienia przywrócone z kopii. Pomiar przeniesiony do P5b (sesja uruchomiona w repo skilla).

## Koszt P0

Sondy P0.1 ×4, P0.2, P0.3 i A/B ×6 (bez zablokowanych, które nie zużyły tokenów po odmowie): `wf_bd749c00-327` $0.4373 (z transkryptów) + `wf_3163fdd8-fb5` $0.9404 (tabela wyżej + P0.2 $0.1481) = **$1.3777**.
Nieudany `wf_f63f5640-6d1`: $0.
