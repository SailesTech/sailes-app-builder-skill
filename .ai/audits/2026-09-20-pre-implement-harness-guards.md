# Pre-Implement Report: 2026-09-20-harness-guards-from-ecc-audit

## Verdict: READY-WITH-FIXES

Trzy poprawki muszą wejść do specu przed dispatchem (R1–R3), jedna decyzja należy do człowieka (R4),
jedna jest dopisaniem brakującego kroku bramki wydania (R5). Żadna nie podważa samych czterech
mechanizmów — wszystkie dotyczą tego, co zmiana **pociąga za sobą** w istniejącym aparacie pomiarowym.

**Waga:** `contract fix × 4 powierzchnie` — trafna. Spec niesie dziewięć sekcji, ale `Data Model`,
`API & UI Surface` i `Security` są zwinięte do jednej linii `n/a` każda, zgodnie z regułą wagi.
`Co jest na dysku dziś` i `Decyzje człowieka` są nośne, nie wypełniaczem: pierwsza jest jedynym
zapisem tego, że luki zostały **zmierzone `grep`em**, a nie założone; druga jest dziennikiem decyzji,
który przeżywa przepisanie specu.
**Wire:** `deployed-surface-check.js` → exit 0, reguła nie dotyczy (brak twierdzeń o kodzie statusu,
nagłówku ani `Content-Type`). **Contract:** `contract-probe-check.js` → exit 0, każda z pięciu faz
niesie `n/a` z powodem; żadna nie stoi na istniejącym kontrakcie, bo oba hooki czytają payload
harnessu ze stdin. **Ownership:** `ownership-check.js --spec` → exit 0, pięć faz, trzy fale,
rozłączne wewnątrz fal.

## BC findings

- **[Critical] Osiem istniejących evali staje się STALE w momencie edycji ról.** `eval-status.js`
  liczy świeżość przez porównanie `Files:` z `git log`; `--strict` kończy się exit 1, gdy cokolwiek
  jest STALE, i to jest brama wydania. Edycja `agents/checker.md` unieważnia pin czterech:
  `checker-never-sees-maker-narrative`, `checker-reports-what-the-diff-omits`,
  `gate-compares-red-by-name-not-count`, `mock-of-an-external-boundary-carries-a-pair`.
  Edycja `agents/be-dev.md` / `agents/fe-dev.md` unieważnia cztery kolejne:
  `worker-claims-before-it-writes`, `inner-loop-promotes-what-caught-a-real-defect`,
  `integrity-gate-reports-measurements-not-impressions`, `lead-checks-second-order-effect`.
  → **Migracja:** re-run ośmiu, albo jawny wyjątek przyjęty przez człowieka per eval, wpisany
  w `Done-when` fazy wydania. Precedens dla wyjątku istnieje (P6 specu 09-13: „54 evale, 49 FRESH,
  5 STALE — wyjątki przyjęte przez człowieka"). Czego **nie wolno**: zostawić `--strict` czerwonego
  i wydać, bo to dokładnie ta klasa, którą backlog:102 opisuje jako trzeci wyłączony check.

- **[Critical] P5 nie mieści się w jednej fazie po dołożeniu re-runów.** Jak zapisana, P5 niesie trzy
  nowe evale + dokumentację + pięć stempli + CHANGELOG + wiersz backlogu. Z ośmioma re-runami
  (R1 wyżej) przekracza rozsądny budżet jednej fazy, a reguła tej bramki jest jednoznaczna: faza,
  która ledwo mieści się w budżecie, nie ma miejsca na poprawki, o które bramka poprosi.
  → **Migracja:** rozbić na dwie fazy o rozłącznych listach plików — ewaluacyjną (`evals/**`) i
  wydaniową (stemple, `AGENTS.md`, `CHANGELOG.md`, `.ai/backlog.md`). Fala 3 dostaje dwie fazy
  sekwencyjnie, nie równolegle: wydanie stoi na wyniku evali.

- **[Warning] P5.1 dubluje istniejące ramię overfire.** `checker-reports-what-the-diff-omits` ma już
  drugie ramię: *„a diff that implements ALL four endpoints must NOT produce a fabricated omission.
  A role that learns to always name something missing has replaced one useless verdict with another"*
  — PASS 2026-09-13. To jest połowa tego, co proponuje P5.1.
  → **Migracja:** nowy eval zawęzić do tego, co faktycznie nowe — **wymogu dowodu** (finding bez
  klauzuli specu i obserwacji nie jest findingiem) — a warunek „czysty diff → APPROVE z zerem
  findingów" dopisać jako rozszerzenie istniejącego ramienia overfire, które i tak idzie do re-runu
  z powodu R1. Dwa evale mierzące to samo to dwa evale, które trzeba utrzymywać i które razem
  nie mówią więcej niż jeden.

- **[Warning] `outcome: blocked` istnieje, ale nie jest walidowane.** `agents/be-dev.md` wymienia
  `done | blocked | policy-refusal`, więc P2 nie wprowadza nowej wartości i nie ma tu zmiany
  łamiącej. `worker-status.js` czyta plik i raportuje metadane, **nigdy nie blokuje** — więc nic nie
  wymusi, że worker w pętli faktycznie zapisze `blocked` zamiast umrzeć po cichu.
  → **Migracja:** żadna w tym specu; to jest dokładnie to, co mierzy eval P5.2. Odnotowane, żeby
  nikt nie policzył `worker-status.js` jako egzekwowania A4.

- **[Warning] Hooki wyliczane są w dwóch plikach poza `.ai/`.** `AGENTS.md` (pokryte przez P5.4)
  i `CHANGELOG.md` (pokryte przez P5.5). Żaden szablon kliencki ani `docs/` nie wylicza hooków
  pluginu, więc lista konsumentów jest zamknięta. → Bez migracji.

- **[Info] To repo ma `tsconfig.json` i żadnego configu lintera.** Po wdrożeniu A3 `toolchain-guard`
  będzie chronił w tym repo dokładnie jeden plik. To jest zachowanie zamierzone, ale znaczy, że
  **test jednostkowy jest jedynym dowodem** na pozostałe ścieżki z listy — nie będzie ich tu do
  sprawdzenia na żywo.

## Gaps

- **Brak kroku docs-delta w fazie wydania.** Zamknięcie specu przechodzi przez krok delty
  dokumentacji przy bramce wydania (`sailes-docs`). Wydania 1.30.0, 1.35.0 mają swoje
  `.ai/docs-deltas/…-release-*-notes.md`. P5 nie wymienia go wcale.
  → Dopisać do fazy wydaniowej: receipt delty **albo** zapisany SKIP z powodem. Powód jest już na
  dysku i jest znany: `STATE.md` notuje, że **ta maszyna nie ma `graphify`**, a `archify` jest na
  `2.17.0-dev.1` — ten sam dług zablokował receipt przy 1.34.0. SKIP z cytowanym powodem jest
  uczciwy; milczenie nie.

- **Spec nie mówi, kto uruchamia evale.** Trzy nowe i osiem re-runów to praca stand-inów, nie
  `be-dev`. Faza ewaluacyjna powinna mieć `Agent:` wskazujący `sailes-eval-runner` jako tryb pracy
  lidera, nie rolę piszącą.

- **P4 nie nazywa zmiennej odblokowującej.** `Human-STOP` mówi, że człowiek zatwierdza jej kształt,
  ale faza nie ma nawet propozycji, więc worker nie ma czego zaimplementować bez rundy pytań.
  → Wpisać propozycję do specu (np. `SAILES_TOOLCHAIN_GUARD=off`, spójnie z `ECC_GATEGUARD=off`
  w audytowanym repo i z naszym `Human-STOP`), do potwierdzenia przy bramce.

## Risks

| Scenariusz | Waga | Obszar | Mitygacja | Ryzyko szczątkowe |
|---|---|---|---|---|
| `block-no-verify` blokuje **człowieka**, nie tylko agenta — `PreToolUse` odpala się na wywołaniach narzędzia `Bash`, a w Claude Code komenda pisana z prefiksem `!` też przez nie idzie. Człowiek traci `git commit --no-verify` w każdym repo | **wysoka** | A2, każde repo na maszynie | **Zmierzyć przed wdrożeniem** (R4): jeden `!`-prefiksowany `git commit --no-verify` w repo-piaskownicy z wpiętym hookiem. Jeśli hook odpala — decyzja człowieka, czy zostaje bez furtki | Nieustalone do czasu pomiaru. Spec dziś **wyklucza** furtkę w Non-goals, więc pomiar może tę decyzję odwrócić |
| Klauzula A1 stępia sekcję absencji — checker zamyka ją jako „przejrzane, brak" zamiast patrzeć | średnia | A1 | Guard-arm w evalu (diff z zasianym brakiem endpointu musi zostać złapany) + `Human-STOP` na treści klauzuli przed merge | Zostaje: guard-arm mierzy tekst stand-inem, nie zachowanie w runtime |
| `toolchain-guard` blokuje legalną pracę w repo klienta | średnia | A3 | Zasięg tylko-Sailes (Q1) + stała lista + zmienna odblokowująca + `Human-STOP` na liście | Repo klienta **prowadzone** przez Sailes ma `.ai/`, więc hook tam działa — i tam właśnie może zablokować legalną zmianę configu. Furtka jest jedyną odpowiedzią |
| Osiem STALE evali przechodzi niezauważone i `--strict` pada dopiero przy wydaniu | średnia | P5 | R1: nazwane wprost w `Done-when` fazy ewaluacyjnej | Brak, jeśli R1 wejdzie |
| `parity.test.js` zielony, a koncept odwrotny źle napisany (regex nie łapie negacji) | średnia | P1, P2 | Sprawdzenie w obie strony **na kopiach**, procedurą z P3/P4 specu 09-13 — kopia z brzmieniem odwrotnym musi dać exit 1 | Backlog:150 zostaje otwarty dla reszty konceptów; ten spec zamyka dwa |
| Dwa nowe hooki blokujące w każdym repo → wzrost tarcia, ktoś wyłącza plugin | niska | A2, A3 | A3 ograniczony do repo Sailes; A2 ma wąski wzorzec (tylko `git` + dwie flagi) | Zostaje. Mierzalne dopiero w użyciu |

**Kroki nieodwracalne:** żadnych. Wydanie idzie autoupdatem pluginu z `main`; rollback to rewert
pięciu stempli i wpisu w `hooks.json`. Brak migracji danych, brak zapisu do produkcji.

## Remediation — do wpisania w spec przed dispatchem

1. **R1.** Rozbić P5 na dwie fazy o rozłącznych listach plików: **P5 — evale** (`evals/**`, trzy nowe
   + osiem re-runów, `Agent:` przez `sailes-eval-runner`) i **P6 — wydanie** (`AGENTS.md`, pięć
   stempli, `CHANGELOG.md`, `.ai/backlog.md`, docs-delta). Fala 3 → dwie fazy sekwencyjnie.
2. **R2.** Nowy eval A1 zawęzić do **wymogu dowodu**; warunek „czysty diff → zero findingów" dopisać
   do istniejącego ramienia overfire w `checker-reports-what-the-diff-omits`, które i tak idzie
   do re-runu.
3. **R3.** Wymienić osiem evali z nazwy w `Done-when` fazy ewaluacyjnej; warunek zamknięcia to
   `node evals/harness/eval-status.js --strict` → exit 0 **albo** wyjątek przyjęty przez człowieka,
   zapisany per eval.
4. **R4.** Dopisać do fazy A2 krok pomiarowy **przed** implementacją hooka: czy `PreToolUse` odpala
   się na `!`-prefiksowanym wywołaniu człowieka. Wynik idzie do specu; decyzja o furtce należy do
   człowieka i może unieważnić obecny wpis w Non-goals.
5. **R5.** Dopisać krok docs-delta do fazy wydaniowej: receipt albo zapisany SKIP z cytowanym
   powodem (brak `graphify` na tej maszynie, `archify 2.17.0-dev.1`).
6. **R6.** Wpisać do P4 proponowaną nazwę zmiennej odblokowującej, żeby worker miał co
   zaimplementować, a człowiek co zatwierdzić.

## Sugerowana kolejność

Bez zmian w falach 1 i 2 — ograniczenie, które je wyznaczyło (`parity.test.js` wspólny dla P1/P2,
`hooks.json` + `package.json` wspólne dla P3/P4), zostaje aktualne. Zmiana dotyczy wyłącznie fali 3,
która rozpada się na dwie fazy sekwencyjne. R4 jest jedynym krokiem, który **wyprzedza** falę 1:
to pomiar, nie implementacja, i jego wynik może zmienić treść P3.

| Fala | Fazy | Równolegle | Blokuje lidera |
|---|---|---|---|
| 0 | R4 (pomiar) | nie | tak |
| 1 | P1 · P3 | tak | nie |
| 2 | P2 · P4 | tak | P4: tak |
| 3 | P5 (evale) → P6 (wydanie) | nie | tak |
