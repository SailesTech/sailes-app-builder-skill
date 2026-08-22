# Run log — `.ai/business-logic.md` jako artefakt pierwszej klasy (1.29.0)

- **Data:** 2026-08-22
- **Spec:** `.ai/specs/implemented/2026-08-22-business-logic-as-a-first-class-artifact.md`
- **Poprzedzone:** `.ai/audits/2026-08-22-business-logic-inventory.md` (pomiar) ·
  `.ai/briefs/2026-08-22-business-logic-format.md` (proweniencja formatu)
- **Wykonane solo**, bez zespołu agentów — dyspozycja sesji zabraniała dispatchu.

## Co poszło na produkcję

Cztery fazy, każda z binarnym `Done-when` sprawdzonym przed przejściem dalej.

| Faza | Artefakt | Dowód |
|---|---|---|
| 1 | `skills/sailes-bootstrap/business-logic-template.md` + wpięcia w `skeleton.md`, `repo-done-checklist.md` (wiersz tabeli **i** linia bloku weryfikacyjnego), `SKILL.md` | `node skills/sailes-bootstrap/repo-done-checklist.test.js` → exit 0 |
| 2 | `tools/business-logic-check.js` + `skills/sailes-bootstrap/hooks-template/business-logic-check.js` + 4 fixture'y + suita | `node tools/business-logic-check.test.js` → 16/16 ok · fixture'y: valid→0, missing-provenance→1, dangling-path→1, duplicate-id→1 |
| 3 | `adopt-existing-repo.md` · `sailes-discovery/SKILL.md` · `sailes-diagnose/SKILL.md` (Step 0/TERMS) · `sailes-docs/references/authoring.md` (kontrakt `lifecycle`) | grepy + `npm test` → exit 0 |
| 4 | 1.29.0 — pięć stempli + `CHANGELOG.md` | `grep -l 1.29.0 …` → 5 plików · `node release-hygiene.test.js` → exit 0 |

Brama po wszystkim: **`npm test` → exit 0, szesnaście suit** (z 15). Liczba w `AGENTS.md` podniesiona
i sprawdzona przeciw `package.json`, nie przeciw pamięci — to zdanie było już błędne dwa razy.

## Decyzje podjęte w trakcie, nie w specu

**Klient dostaje własną kopię checku, nie wskaźnik.** Plugin serwuje `skills/` spoza drzewa
roboczego klienta, więc hook odsyłający do `tools/` nie ma tam do czego sięgnąć — to samo ustalenie,
które `sync-blocks.js` zapisał dla prozy. `sync-blocks` nie mógł tego unieść: jego znaczniki to
komentarze HTML, a te nie są poprawnym JS. Rozjazd łapie **test parzystości** porównujący blok
`CORE` bajt w bajt plus zgodność zachowań na wszystkich czterech fixture'ach — z **dowodem
mutacyjnym**, że asercja nie jest pusta. Kopia klienta jest **generowana** ze źródła, nie
przepisywana ręcznie.

**Etykiety pól przyjmują pisownię angielską i polską** (`source|źródło`, `enforced|egzekwowane`).
Te repo są w praktyce dwujęzyczne — `.ai/` klienta po polsku, frameworka po angielsku. Jedna tabela
aliasów w jednym miejscu to nie dryf; dwa parsery byłyby.

**Przekroczenie progu długości jest WARN, nigdy FAIL.** Bramka na długość prozy zostaje obejściem,
nie posłuszeństwem. FAIL-e są trzy i wszystkie jednoznaczne: brak proweniencji, martwa ścieżka,
zdublowane ID.

**Bare symbol w `enforced:` przechodzi niesprawdzony.** `CommissionResolverService.toPercent` to
poprawny uchwyt, którego narzędzie nie umie rozwiązać. Granica jest **zapisana w kodzie i w teście**,
nie przemilczana.

## 🔴 Otwarte po tym wydaniu — nie waived, tylko nazwane

1. **`checker` NIE URUCHOMIONY.** Dyspozycja sesji zabraniała dispatchu agentów, więc niezależnej
   recenzji diffu nie było. To jest brama, nie formalność, i jej brak jest długiem — nie zgodą.
   Zapisany w `.ai/backlog.md`.
2. **Framework łamie kontrakt, który właśnie wydał.** `docs/architecture/lifecycle.json` tego repo
   („A Spec's Life") ma węzły z samymi etykietami — `draft`, `approved`, `implemented` — **bez
   znaczenia biznesowego i bez aktora, który stan ustawia**, czyli dokładnie tego, czego Faza 3
   zaczęła wymagać od każdego repo. Nie naprawiam tego inline: to pas `docs-author`, a nie mój.
   Zapisane jawnie, bo milczenie tutaj byłoby tą samą porażką, którą ten spec opisuje.
3. **Brak evala** (D3). Testy dowodzą, że tekst jest w pliku i że checker działa — nie że agent
   honoruje instrukcję. Step 0/TERMS w `sailes-diagnose` i żniwo w `sailes-discovery` są
   zachowaniem modelu i **nie są zweryfikowane**.
4. **Format nieużyty w boju.** Nikt jeszcze nic nim nie napisał. Pierwsze realne wypełnienie może
   wymusić zmianę szablonu po wydaniu.
5. **Brak detekcji i brak bramki wymuszającej wypełnienie** — świadomie odłożone przez Karola.

## Poprawki własne w trakcie

- Założenie z bramy Q5 („dołóż szósty diagram") było **błędne**: `lifecycle` jest już piątym z pięciu.
  Zmienił się kontrakt treści, nie zestaw plików — brama wydania nietknięta.
- Pierwsza wersja klauzuli w `authoring.md` była po polsku w angielskim dokumencie referencyjnym.
  Poprawione, a `Done-when` w specu zaktualizowany razem z nią, żeby kryterium nie greppowało
  nieistniejącej frazy.
