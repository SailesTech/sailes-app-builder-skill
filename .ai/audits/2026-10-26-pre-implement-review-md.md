# Pre-Implement Report: `.ai/specs/2026-10-26-review-md-i-katy-poprawnosci.md`

Data: 2026-10-26 · baza `origin/main` `c53a457` · prowadzący: lead sesji omarchy.

## Verdict: READY-WITH-FIXES → poprawki R1–R2 wpisane do speca, P1 i P3 gotowe do startu

## Weight

`contract fix × 3 powierzchnie` — trafna. Spec ma pełne pola faz, bo każda faza zmienia doktrynę
czytaną w każdym repo; sekcje Data Model / API / Integration / Jobs zapisane jednym `n/a`.

## Wire i kontrakt

- `deployed-surface-check.js` → `OK — no wire-property claim, rule does not apply` (exit 0).
- `contract-probe-check.js` → **przed poprawką exit 1**: P4 i P5 miały `n/a` z powodem < 20 znaków.
  Po R1 → `OK — every phase carries a valid Contract-probe field` (exit 0).
- `ownership-check.js --spec` → exit 0, 5 faz, 4 fale.

## BC findings

| Waga | Powierzchnia | Ścieżka migracji |
|---|---|---|
| Warning | Semantyka CHANGES-REQUIRED zawęża się: Pre-existing przestaje blokować; Nit w limicie | Brak parsera werdyktów: `grep -rn -E 'CHANGES-REQUIRED\|APPROVE' tools hooks evals/harness` → 0. Zmiana dotyka tylko doktryny; wpis upgrade-actionable w CHANGELOG (P5.b) |
| Warning | Podstawa znaleziska `checker.md:22` się rozszerza | Eval `checker-reports-a-finding-only-with-evidence` aktualizowany w P1.e; fixture bez zmian; koncept odwrotny w `parity.test.js` (P2.c) |
| — | Bloki generowane (`sync-blocks`) | Edytowane linie leżą poza blokami: `team-lead.md:198` (bloki `:23-59`, `:64-77`, `:118-139`), `agent-team-structure.md:97`, `:766` (blok `:13-49`). `sync-blocks --check` w Done-when P4 |
| — | Nowy plik `REVIEW.md` w repo klientów | Addytywny; istniejące repo dostają go wyłącznie jako propozycję Upgrade (Q4) |

## Gaps

Brak otwartych pytań. Zakres testów nazwany (Integration Coverage). Wszystkie narzędzia z `Done-when`
istnieją (`validate-frontmatter.test.js`, `validate-toml.test.js`, `framework-version-check.test.js`,
`sync-blocks.js`, `repo-done-checklist.test.js`, `release-hygiene.test.js`, `eval-status.js`).

## Risks

| Scenariusz | Waga | Mitygacja | Ryzyko rezydualne |
|---|---|---|---|
| Ramię kontrolne i P2.d biegną tego samego dnia; `eval-status.js` porównuje daty, więc przebieg sprzed zmiany wygląda na świeży (lekcja 2026-08-02) | średnia | **R2**: każdy plik przebiegu zapisuje SHA `agents/checker.md`; P2.d wymaga SHA ≠ kontrolnego | narzędzie dalej porównuje daty — znane, poza zakresem |
| Workerzy przebiegów evali milkną, raport ginie w transporcie (lekcja 2026-07-25) | średnia | brief każdego przebiegu nazywa plik wyniku; „brak pliku = brak przebiegu” (R2) | niski |
| Ramię kontrolne nie jest czerwone (fixture za łatwy) | średnia | Human-STOP P1: P2 nie startuje bez czerwonych kontroli | niski |
| Kąty poprawności przywracają szum, który A1 z 2026-09-20 wyciął | średnia | istniejący eval na czystym diffie musi dalej przechodzić (P2.d) | średni — jedna próbka na ramię |
| **P4 zależy od 1.40.0, a gałęzi `feat/1.39.0-design-tournament` nie ma na tej maszynie** (`git branch -a` w trzech klonach → 0; `origin` → 0; STATE Sailes: „nie wypchnięta”) | wysoka dla harmonogramu | P1–P3 niezależne; przed P4 decyzja właściciela: czekać na drugi komputer albo przenieść kolejność wydań | UNKNOWN do decyzji |
| Push na `main` = deploy na wszystkie maszyny | wysoka | Human-STOP P5; PR, scala człowiek | niski |

## Remediation (wpisane do speca)

- **R1.** P4 i P5: pełne powody `Contract-probe: n/a`.
- **R2.** P1.g i P2.d: SHA `agents/checker.md` w każdym pliku przebiegu, ścieżka pliku wyniku w briefie.

## Kolejność

Fala 1: P1 (`be-dev`, worktree) ∥ P3 (`be-dev`, worktree) → lead: przebiegi kontrolne P1.g →
**STOP: werdykty kontroli** → P2 → `checker` → P2.d → **STOP: brzmienie `checker.md`** → przed P4
decyzja o kolejce 1.39/1.40.
