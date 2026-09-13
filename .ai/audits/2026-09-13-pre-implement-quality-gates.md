# Pre-Implement Report: `.ai/specs/2026-09-13-quality-gates-from-the-partner-portal-report.md`

Data: 2026-09-13 · Framework 1.33.1 · target 1.34.0 · gałąź `feat/1.34.0-quality-gates`

## Verdict: READY-WITH-FIXES

Kierunek jest zgodny z raportem i z decyzjami. Dwie decyzje z tej sesji, złożone z regułami, które już
stoją na dysku, dają jednak skutek, którego nikt nie wybrał:

1. **Tor = tier** usuwa `designer` i vision-verify z niemal każdej pracy nad UI, bo tier C to dosłownie
   „reads, UI, formatting, cosmetics”.
2. **`Known-red:` czyszczona przy przekazaniu sesji** nie istnieje w chwili, w której jest potrzebna.
   Sesja przekazuje się po każdej fazie (1.33.0), a pełny zestaw uruchamia się tylko przed pushem (Q5a).

Oba punkty to rozwidlenia dla człowieka (F1, F3), nie poprawki redakcyjne. Pozostałe znaleziska to
brakujące pliki na listach faz i luki w `Done-when`.

**Decyzje właściciela 2026-09-13 (forki z tego raportu):**
- F1 — nowy ekran bez artefaktu dostaje `designer`, także w torze `middle`;
- F2 — plan `DERIVED`, oczekiwanie zmienia lider wpisem do run logu;
- F3 — przy pushu `qa` uruchamia czerwone nazwy na merge-base i porównuje `comm`;
- F4 — sonda tylko na lokalnym stosie z danymi seed, z redakcją; niedziałający stos = NOT-READY;
- F5 — merge na `main` po pomiarze 1.33.x.

Wszystko, łącznie z poprawkami 2–8, jest wpisane w spec (przepisany, nie łatany). Po tych zmianach
spec jest gotowy do `sailes-implement` od P1.

**Waga:** `contract fix × 5 powierzchni` — właściwa. Tabela „Co jest na dysku” uzasadnia każdą fazę,
więc nie jest wypełniaczem.
**Drut:** `node tools/deployed-surface-check.js <spec>` → `OK — no wire-property claim, rule does not apply`.
**Graf:** brak `graphify-out/`. Promień rażenia ustalony grepem, z cytatami `plik:linia` poniżej.

## BC findings

- **[Critical] P3 × tier C — UI traci fazę projektu.** `sailes-test/SKILL.md:119`: tier C = „reads, UI,
  formatting, cosmetics”. Tor = tier (Q5a) → każda faza UI, która nie dotyka pieniędzy, uprawnień,
  idempotencji ani zapisu na zewnątrz, idzie torem `middle`: bez `designer` (D3) i bez screenów (Q5b).
  Jednocześnie zależą od tego:
  - `fe-dev.md:3,13` — implementuje „following the `designer` spec”;
  - `qa.md:3,17,18,57` i `agent-team-structure.md:81,503` — vision-verify względem artefaktu i baseline;
  - `sailes-implement/SKILL.md:45` — „UI-touching steps get vision-verify”, `:47` — `STATUS.md`
    z zaakceptowanym screenem;
  - `sailes-design` — trigger „any time UI is about to be built with no design artifact”;
  - eval `qa-vision-verifies-against-baseline` — w torze `middle` staje się sprzeczny z doktryną.

  Najdroższy incydent w raporcie dotyczył właśnie ekranu admina. → **F1.**
- **[Critical] P4 × 1.33.0 × Q5a — lista `Known-red:` nie ma kiedy powstać.** Blok `session-handoff`
  (`skills/sailes-bootstrap/session-handoff.md`) kończy sesję lidera po **każdej** zamkniętej fazie.
  Q7/R5 czyści listę przy przekazaniu. Q5a uruchamia pełny zestaw dopiero przed pushem, po ostatniej
  fazie. W efekcie pierwszy pełny przebieg trafia zawsze na pustą listę, a każda zastana czerwień staje
  się CHANGES-REQUIRED przy pushu. Brakuje też źródła baseline'u: dziś pełnego zestawu nie uruchamia
  nikt przed pushem, więc nie wiadomo, co było czerwone na bazie. Raport §3.3a opisuje, że implementer
  liczył to przez 40 minut na dwóch gałęziach. Żaden plik w `agents/` ani `release-checklist.md` nie
  mówi o przebiegu na bazie. → **F3.**
- **[Warning] P3 — zestaw testów bez zamrożenia nie ma statusu.** `test-plan-template.md:6,9`:
  `Status: DRAFT | FROZEN`, a „`DRAFT` means no test may be written yet”. `sailes-test/SKILL.md:36,64`:
  „hard block”. `tester.md:20` każe zrobić STOP. Reguła „nigdy nie osłabiaj zamrożonej asercji”
  (`sailes-test:104-107`, eval `tester-never-weakens-a-frozen-assertion`) i trasa `DEAD` („struck by the
  human at freeze time”) zakładają zamrożenie. `checker.md:16` jest warunkowe („When `tester` has frozen
  a test plan”), więc w torze `middle` sprawdzenie pokrycia ID po cichu przestaje działać. → **F2.**
- **[Warning] Kopie w repo klienta.** Upgrade mode dostarcza zmiany tylko przez CHANGELOG
  (`adopt-existing-repo.md` §Upgrade, krok 1). Dwie kopie nie zaktualizują się same:
  - lokalny `.ai/skills/spec-writing/SKILL.md` (wiersz 4 audytu: „re-tune to current template”) nie
    dostanie `Contract-probe:` ani `Lane:`;
  - `AGENTS.md` klienta z `agents-md-template.md:98-119` („End every task with a check you run… E2E”,
    Key Commands `pnpm test (unit, fast inner loop) · pnpm test:e2e`) nie dostanie reguły pełnego
    przebiegu przed pushem.

  Sekcja „What an older-stamped repo is missing” w 1.34.0 musi wymienić obie. `agents-md-template.md`
  nie ma na liście plików żadnej fazy.
- **[Warning] P5 × `brief-closure`.** `hooks-template/brief-closure.js:17-18` wymaga pola `Report/Raport`
  w **każdym** briefie. Ta kopia żyje w repo klientów. Jeśli P5 usunie etykietę `Report:` z briefu
  implementera, test w repo klienta zacznie padać. Etykieta musi zostać, zmienia się tylko jej treść
  (pola wiadomości, 40 linii).
- **[Warning] P2 cofa regułę wydaną 3 dni temu.** 1.33.0 (P3, CHANGELOG) wprowadziło „full suite + e2e
  once before the declaration commit” w `be-dev.md:16`, `fe-dev.md:17`, `be-dev.toml:11`,
  `fe-dev.toml:11`, `agent-team-structure.md:623`, `sailes-implement/SKILL.md:41` i koncepcie
  `parity.test.js:158,166`. Wpis 1.34.0 musi to nazwać zastąpieniem, bo repo na 1.33.x inaczej
  dostanie dwie sprzeczne instrukcje z dwóch kolejnych wpisów.

## Gaps

- **P2 Done-when nie łapie bliźniaków.** `grep "once before the declaration commit"` nie trafi
  w `.toml`: tam stoi „Run the full suite and any e2e requirement exactly **once**, right…”. Lepszym
  Done-when jest odwrócony koncept w `parity.test.js`, który już czyta obie strony, plus grep po
  `declaration commit` w pobliżu `full suite`.
- **P3 — brakujące pliki:**
  - `agents/team-lead.md:69` i `codex-agents/team-lead.toml` — potok `explorer → designer → …`,
    niesynchronizowany, osobno od `agent-team-structure.md:158`;
  - `agents-md-template.md` — linia „Order: explorer → designer → …”;
  - `sailes-implement/SKILL.md:52,96` — tester per faza z zamrożeniem przez człowieka;
  - `skills/sailes-test/test-plan-template.md` — status planu;
  - pliki od screenów z F1.
- **P1 — ścieżka narzędzia w repo klienta.** Tekst pre-implement ma już dziś wadę, którą P1 powieliłoby:
  `sailes-pre-implement/SKILL.md:70` uruchamia `node tools/deployed-surface-check.js`, a ta ścieżka
  działa tylko w repo frameworka. Poprawną formę `${CLAUDE_PLUGIN_ROOT}/tools/…` stosuje
  `sailes-implement` przy `ownership-check`. P1 powinno użyć tej formy i przy okazji poprawić linię 70.
- **P1 — data odcięcia = dzień wydania 1.34.0.** Żywe specy w korzeniu (`2026-08-02` approved,
  `2026-08-06`, `2026-08-11`, `2026-09-01`) nie mają pola, a narzędzie uruchomione na `.ai/specs/`
  oznaczyłoby je wszystkie.
- **P1 — niedziałający stos nie jest powodem do `n/a`.** Bez tego zdania „stos nie wstał” staje się
  najtańszym zwolnieniem. Konwencja istnieje: `ENV-DEFECT` → werdykt pre-implement NOT-READY. Spec musi
  to napisać.
- **P5 — jak przerwać ramię A/B.** Metryka „raporty utracone przy przerwanym procesie” wymaga
  powtarzalnego przerwania: `TaskStop` na workerze po N zmianach, ten sam punkt w obu ramionach.
  Bez tego metryka nie jest porównywalna.
- **P5 — `team-lead.md:193`** („for work a gate will grade, name a FILE”) i lekcja 2026-08-30
  (`lessons.md:137-142`, Applies-to `AGENTS.md §Delegation`) muszą dostać nowy zakres, a nie zniknąć:
  werdykty ról bramkujących dalej są plikami.
- **P6 — lista evali jest niepełna.** Spec wymienia 10, a przecięcie `Files:` evali z listami plików
  faz daje ich ponad 35. Brakuje m.in. tych, które zmiana wprost podważa:
  - `qa-vision-verifies-against-baseline`, `devtools-evidence-does-not-replace-a-suite-test`,
    `integrity-gate-reports-measurements-not-impressions` (tor `middle`);
  - `lead-hands-off-after-phase` (P4 edytuje `session-handoff`);
  - `done-when-covers-the-allowed-files-list`, `spec-phases-carry-done-when`,
    `spec-weight-shrinks-a-contract-fix` (P1/P2 edytują szablon specu);
  - `checker-never-sees-maker-narrative`, `checker-reports-what-the-diff-omits`,
    `mock-of-an-external-boundary-carries-a-pair`, `qa-takes-exclusive-environment`.

  Właściwe Done-when to wynik `eval-status.js`, a nie lista pisana ręcznie. Koszt: kilkadziesiąt
  uruchomień evali w P6.

## Risks

| Scenariusz | Waga | Mitygacja | Ryzyko rezydualne |
|---|---|---|---|
| `Contract-probe:` wkleja do specu (commitowanego do repo klienta) odpowiedź z danymi klienta, tokenami albo PII ze stagingu/produkcji | wysoka | F4: sonda tylko na lokalnym stosie z danymi seed/fixture; sekrety i PII zredagowane; odpowiedzi z produkcji nie wklejamy nigdy | kontrakt, który istnieje tylko u zewnętrznego dostawcy — tam redakcja ręczna |
| 1.34.0 wchodzi, zanim zmierzymy oszczędność 1.33.x; porównanie z baseline'em miesza efekty dwóch wydań | średnia | F5: 1.34.0 zostaje na gałęzi do pomiaru 1.33.x | pomiar zależy od tego, kiedy klient wróci do pracy |
| A/B P5 wychodzi na niekorzyść wiadomości | średnia | spec już to łapie: P5 nie wchodzi, sprawa wraca do człowieka | P2–P4 wychodzą bez P5 — wymaga to rozdzielenia wydania |
| Trzy zmiany reguł weryfikacji w 1.32 → 1.33 → 1.34 w dwa tygodnie; repo klienta dostaje sprzeczne wpisy | średnia | wpis 1.34.0 nazywa, co zastępuje z 1.33.0 | — |
| Tor `middle` dla tieru B przepuszcza błąd kontraktu, bo `designer` i zamrożenie wypadły | średnia | `Contract-probe` (P1) przesuwa pomiar na początek — to jego rola w tym specu | zostaje przebieg `qa` bez screenów |
| Nieodwracalne kroki | — | brak: doktryna, szablony, jedno narzędzie offline; rollback = revert na `main` | auto-update rozsyła każdy push od razu, więc revert też jest wdrożeniem |

## Remediation (edycje specu przed kodem)

1. Rozstrzygnąć F1–F5 i wpisać je do tabeli decyzji. Spec przepisać, nie łatać.
2. P1: ścieżka `${CLAUDE_PLUGIN_ROOT}`, poprawka `sailes-pre-implement:70`, data odcięcia = dzień
   wydania, `ENV-DEFECT` ≠ `n/a`, zasada danych z F4.
3. P2: Done-when przez odwrócony koncept parity; dopisać `agents-md-template.md`
   (Verification + Key Commands).
4. P3: dopisać pliki z sekcji Gaps oraz te, które wynikną z F1 i F2.
5. P4: przebudować według F3; jeśli F3 nie dotyka `session-handoff`, zdjąć go z listy.
6. P5: etykieta `Report:` zostaje; nowy zakres dla `team-lead.md:193` i lekcji; mechanizm przerwania
   ramienia.
7. P6: Done-when = `eval-status.js`, bez STALE/NEVER-RUN wśród evali, których `Files:` przecina listy faz.
8. CHANGELOG 1.34.0: „What an older-stamped repo is missing” obejmuje lokalny `spec-writing`, sekcję
   Verification w `AGENTS.md`, sekcję `Known-red` w run logu i zastąpienie reguły z 1.33.0.

## Suggested phase order

- **P1 pierwsze** — niezależne od F1–F3, jedyny kod, ma własny zestaw testów.
- **P2 przed P4** — P4 potrzebuje zdefiniowanej bramki przed pushem.
- **P3 po F1 i F2.**
- **P5 ostatnie** — A/B.
- **Merge na `main` według F5.**
- Sekwencyjnie, bez fal: P2–P5 dzielą `agent-team-structure.md`, `team-lead.md` i bliźniaki.
