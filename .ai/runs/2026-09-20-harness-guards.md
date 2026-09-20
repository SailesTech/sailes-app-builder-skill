# Run log: 1.36.0 — cztery strażnicy harnessu z audytu ECC

Spec: `.ai/specs/2026-09-20-harness-guards-from-ecc-audit.md`
Audyt źródłowy: `.ai/audits/2026-09-20-ecc-comparison.md`
Pre-implement: `.ai/audits/2026-09-20-pre-implement-harness-guards.md` — READY-WITH-FIXES
Gałąź: `feat/1.36.0-harness-guards` · baza lidera: `615a306`
Workflow: `wf_238e2c36-4f6` — 6 agentów, 0 błędów, 0 pustych zwrotów, ~22 min, 541k tokenów subagentów

## Co weszło

| Faza | Rola | Commit | Pliki |
|---|---|---|---|
| P1 — A1 `checker`: przegląd ≠ zgłoszenie | be-dev | `8f25ca3` | `agents/checker.md`, `codex-agents/checker.toml`, `codex-agents/parity.test.js` |
| P3 — A2 hook `block-no-verify` | be-dev | `6dfb385` | `hooks/block-no-verify.{js,test.js}`, `hooks/hooks.json`, `package.json` |
| P2 — A4 warunek pętli | be-dev | `bfc732b` | `agents/{be-dev,fe-dev}.md`, `codex-agents/{be-dev,fe-dev}.toml`, `codex-agents/parity.test.js` |
| P4 — A3 hook `toolchain-guard` | be-dev | `7d9589e` | `hooks/toolchain-guard.{js,test.js}`, `hooks/hooks.json`, `package.json` |
| Bramka | tester | `b9faf77` | `.ai/test-plans/2026-09-20-harness-guards.md` (DERIVED), +6 przypadków w obu suitach |

Integracja: `git merge --no-ff` pięć razy, w kolejności P1 → P3 → P2 → P4 → tester. Zero konfliktów.
HEAD po integracji: `a4ea94e`.

## Deklaracje workerów (zwinięte z `.claude/status/`, pliki usunięte)

| Worker | Task | Base | outcome | commit | Rozbieżności |
|---|---|---|---|---|---|
| `be-dev-238e2c36` | P1 | `615a306` | done | `8f25ca3` | **pole `commit` przy pierwszym zapisie zawierało zmyślony sha**; poprawione dopisaną linią `correction:` |
| `be-dev-p3-a2` | P3 | `615a306` | done | `6dfb385` | brak |
| `be-dev-p2-a4` | P2 | `615a306` | done | `bfc732b` | **to samo — zmyślony sha, poprawiony linią `correction:`**. Dodatkowo id `be-dev-238e2c36` było już zajęte przez P1, więc worker nadał sobie nazwę opisową |
| `be-dev-P4` | P4 | `615a306` | done | `7d9589e` | plik w **fallbacku wewnątrz worktree** — zapis poza worktree odrzucony; zgłoszone w `note`, zgodnie z regułą |
| `tester-238e2c36-4f6-5` | bramka | `615a306` | done | `b9faf77` | jak wyżej — fallback wewnątrz worktree, zgłoszony |

`touched` każdego workera zgadza się z `git diff --stat` jego commita. Wszystkie bazy prawidłowe.

## Bramki

**`tester` — done, 0 defektów.** Plan `DERIVED` (tor środkowy), 18 ID bazowych z `Done-when` obu faz
kodowych + 6 nowych przypadków brzegowych. Dla każdego nowego ID podał dowód detekcji przez **mutację
dokładnej ścieżki kodu**, którą ten przypadek ćwiczy, z potwierdzeniem, że czerwony jest tylko ten jeden
ID i że rewert jest bajtowo identyczny:

- `P3-EDGE-1` `git config --global core.hooksPath` · `P3-EDGE-2` `git` osiągnięty przez potok, nie na
  początku komendy · `P3-EDGE-3` `git push -n` (dry-run) **nie** może blokować
- `P4-EDGE-1` `tsconfig.build.json` (wildcard, nie sama nazwa) · `P4-EDGE-2` ścieżka względna ·
  `P4-EDGE-3` repo z `.ai/` ale bez `AGENTS.md` — nadal Sailes (`isSailesRepo` to OR)

Trzy kandydatury odrzucone z powodem, nie po cichu: symlink do chronionego configu, wielkość liter,
`MultiEdit` z wieloma plikami.

**`checker` — NITS.** Obie sekcje obowiązkowe zamknięte formułą `reviewed against <surface>, none`
— czyli **klauzula A1 zadziałała na samej bramce, która ją wprowadza**. Checker niezależnie
zweryfikował, że oba koncepty odwrotne w `parity.test.js` faktycznie odpalają na ręcznie skonstruowanej
negacji semantycznej (nie tylko na fixturze autora), mutując `agents/checker.md` i `agents/be-dev.md`
w tymczasowym worktree. Potwierdził też, że zasięgi hooków nie są zamienione: `block-no-verify` nie ma
`isSailesRepo`, `toolchain-guard` ma.

**NITS (przyjęty, nie naprawiany):** 18 ID bazowych z planu jest w suitach obecnych jako pre-existujące
testy implementerów, odwołane numerem linii, zamiast nieść ID w nazwie testu. Odstępstwo od reguły
mechanicznej, ale jawne, sprawdzalne i nie ukrywa dziury — `tester` uzasadnił je wprost (duplikowanie
fixture'a, który implementer już napisał poprawnie, nie dodaje detekcji). Lider przyjmuje.

## Weryfikacja lidera na zintegrowanej całości

- `npm test` → **exit 0, 25 zestawów** (23 → 25, dokładnie „+2" ze specu), 0 `not ok`
- Oba hooki napędzone tak, jak robi to Claude Code — JSON na stdin:

| Payload | Wynik |
|---|---|
| `git commit -m x --no-verify` | exit 2 |
| `git -c core.hooksPath=/dev/null commit -m x` | exit 2 |
| `git commit -m "fix the --no-verify bug"` (literał w komunikacie) | exit 0 |
| `git push` | exit 0 |
| `Edit` na `tsconfig.json`, cwd = repo Sailes | exit 2 |
| `Edit` na `package.json`, cwd = repo Sailes | exit 0 |
| `Edit` na `.eslintrc.json`, cwd = **obce repo git bez `AGENTS.md` i bez `.ai/`** | exit 0, cicho |
| to samo repo po dodaniu `.ai/` | exit 2 |
| repo Sailes z `SAILES_TOOLCHAIN_GUARD=off` | exit 0 |

Żaden hook nie pisze na stdout przy blokadzie i żaden nie używa `permissionDecision`.

**Korekta własna:** pierwszy przebieg tych prób dał fałszywy alarm — payload bez pola `cwd`, więc hook
spadł na `process.cwd()`, czyli na to repo, i „obce repo" czytało się jako Sailes. Wynik powyżej jest
z payloadu z `cwd`, tak jak wysyła go Claude Code. Defekt był w mojej sondzie, nie w hooku.

## Znaleziska do promocji

1. **Worker wpisuje sha do pliku statusu z pamięci, nie z komendy.** Dwa z trzech plików w głównym
   drzewie miały w polu `commit` halucynowany hex przy pierwszym zapisie; oba workery złapały to same
   i dopisały `correction:`. Cała wartość deklaracji polega na tym, że jest wiarygodna — sha, którego
   nie da się użyć, znosi mechanizm dokładnie tam, gdzie miał działać. Że złapały to same, jest
   szczęściem, nie zabezpieczeniem. **Kandydat na poprawkę doktryny:** klauzula pliku statusu mówi
   wprost, że `commit` jest **wklejony z wyjścia `git rev-parse HEAD`**, nigdy wpisany.
2. **Odmowa zapisu poza worktree jest niedeterministyczna w obrębie jednego przebiegu.** P1, P2 i P3
   zapisały do `.claude/status/` w głównym drzewie bez problemu; P4 i `tester` dostały odmowę
   („agent is isolated in the worktree") i użyły fallbacku. Doktryna (`agents/be-dev.md`,
   `team-lead.md:103`) opisuje to jako **stałą** asymetrię `Bash` vs `Write`. Pięć workerów, ta sama
   sesja, dwa różne zachowania.
3. **Kolizja id workera wewnątrz jednego workflow.** P1 i P2 dostały to samo `be-dev-238e2c36`
   (id pochodzi od run id workflow, nie od agenta). P2 obszedł to nazwą opisową. `workflow-orchestration.md`
   każe nieść run id w nazwie — ale to za mało, gdy jeden workflow dispatchuje kilku workerów tej samej
   roli; potrzebny jest sufiks.
4. **Niescalona praca z 1.34.0 wisi w osieroconym worktree.** `.claude/worktrees/agent-a928e3faaa4d4cf6b`
   trzyma `160a4c8 docs(1.34.0): architecture delta` — cztery pliki, 293 wstawienia, **nie jest
   przodkiem HEAD żadnej gałęzi poza własną**. To delta dokumentacji, której 1.34.0 nigdy nie dostało.
   Nie ruszam jej tym przebiegiem; wymaga decyzji człowieka (scalić do 1.36.0 czy odrzucić).
5. **`.claude/status/` nie jest sprzątane od sierpnia.** 33 pliki z poprzednich przebiegów, najstarsze
   z 2026-08-06. `team-lead.md:104` mówi, że plik znika razem z wpisem w run logu — nie znikał.
   Niniejszy przebieg zwija i kasuje swoje pięć; reszta zostaje jako cudzy dług.

## Pozostało

- **P5 — evale:** trzy nowe + osiem re-runów unieważnionych przez P1/P2. Blokuje lidera.
- **P6 — wydanie:** `AGENTS.md` (22 → 25 zestawów, lista hooków), pięć stempli 1.36.0, CHANGELOG,
  docs-delta (receipt albo SKIP z powodem: brak `graphify` na tej maszynie), backlog. Blokuje lidera.
- Merge na `main` = deploy na każdą maszynę z pluginem. Decyzja człowieka.
