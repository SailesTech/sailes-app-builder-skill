# Spec: archify jako gate'owana dokumentacja projektów Sailes

Status: approved
Date: 2026-07-28 · approved 2026-07-28 · Branch: `feat/archify-docs`
Brief: `.ai/briefs/2026-07-28-archify-docs.md` (Decisions Ledger zatwierdzony 2026-07-28)
Źródło: https://github.com/tt-a1i/archify.git — MIT, v2.12; skill 5,2 MB, CLI Node bez kluczy
(`validate | deliver | guide | compare | preview`); `compare` obsługuje WYŁĄCZNIE typ
`architecture` (zweryfikowane: `bin/archify.mjs:18`, `delta/architecture-delta.mjs`).

> Open Questions zamknięte 2026-07-28 (Q1–Q5 = rekomendacja, Q6 = wybór człowieka wbrew
> rekomendacji). Approved przez człowieka 2026-07-28.
> Pre-implement 2026-07-28: **READY-WITH-FIXES**, 5 poprawek naniesionych (INVARIANTS +
> ROLES jako wymuszone edycje testów; opisy plugin/marketplace; .claudeignore dla HTML;
> Done-when przez `git grep` — `.claude/worktrees/` zatruwa zwykłe grepy; Done-when
> Phase 2 bez nieistniejącego walidatora skilli). Zero Critical BC — zmiana addytywna.

## TLDR & Context

Framework zyskuje zdolność dokumentacyjną: nowy skill `sailes-docs` + rola `docs-author`,
wpięte w bootstrap (initial zestaw 5 diagramów), release gate (regeneracja + delta
`architecture` jako dowód pokazywany człowiekowi), adopt, diagnose i self-docs frameworku.
Wartość własna ponad archify: dokumentacja jako instrument spine'u VERIFIED — nie może
zgnić (krok gate'owany per spec), nie może kłamać (deterministyczna walidacja CLI +
source evidence przypięte do commitów), a delta mówi człowiekowi, co spec naprawdę zmienił.
Dystrybucja: prereq maszynowy `npx skills add tt-a1i/archify -g` + jawny SKIP (wzorzec
graphify).

Suma powierzchni nazwana świadomie w brief-ledgerze: nowy skill + nowa rola + 5 typów
diagramów to największy jednorazowy przyrost od 1.16.0, przeciw kierunkowi subtrakcji ze
STATE.md — wybrane przez człowieka z kosztami na stole.

## Problem Statement

1. Framework nie oddaje projektów z dokumentacją — 16 skilli, zero zdolności dokumentacyjnej;
   jedyny ślad to opcjonalna notka `graphify export callflow-html` (`graphify-setup.md:97`).
2. Dokumentacja pisana ręcznie rotnie — dokładnie tak, jak specy leżały 13 dni nieprzeniesione
   w repo, które samo napisało tę regułę (STATE.md, Verified facts).
3. Diagramy „z głowy" kłamią bez wykrycia: nie ma walidatora, evidence ani delty. Archify
   daje wszystkie trzy klocki gotowe (typed JSON IR, `validate`/`deliver` z exit-code,
   git-pinned source evidence, `compare`).

## Decisions (odpowiedzi na Open Questions, 2026-07-28)

- **D1 — pliki: `docs/architecture/` z commitowanymi JSON i HTML.** Żywy doc otwieralny
  od ręki dla zespołu i agentów; archify HTML jest samodzielne i deterministyczne.
  Odrzucone: tylko-JSON (paczka wymagałaby kroku generacji). Pre-implement dodał:
  generowane `*.html` idą do `.claudeignore` (u klienta i we frameworku) — JSON zostaje
  czytelny dla agentów, HTML nie zaśmieca prompt-cache.
- **D2 — `compare` biegnie ZAWSZE przy zamknięciu speca; pusta delta jest dowodem**
  („ten spec nie zmienił architektury"). Zero warunków do pamiętania i obchodzenia.
- **D3 — `docs-author`: `claude-sonnet-5`, tools Glob/Grep/Read/Write/Edit/Bash, bez
  `Agent` (invariant rosteru), jawny `effort`; bliźniak `codex-agents/docs-author.toml`
  w tym samym wydaniu.** Pętla autor→validate wymaga Bash; walidacja jest deterministyczna,
  więc Opus nie ma tu czego rozstrzygać.
- **D4 — self-docs frameworku regenerowane przy każdym release** (krok obok pięciu stampów).
  Dogfooding reguły gate'owej; koszt częstych wydań przyjęty.
- **D5 — minimalna wersja archify >= 2.12, check w setupie** (czytamy `metadata.version`
  z zainstalowanego `SKILL.md`); starsza lub brak → **jawny SKIP** + wpis w STATE.md,
  nigdy cicho. Wzorzec graphify (`graphifyy >= 0.9.23`).
- **D6 — paczka kliencka generowana AUTOMATYCZNIE przy każdym release gate** — wybór
  człowieka wbrew rekomendacji (na żądanie + twarda linia przy oddaniu); koszt przyjęty:
  share-cardy/eksporty per spec, których nikt nie ogląda między oddaniami. Konsekwencja
  projektowa: paczka musi być tania (bez WebM; HTML set) i nadpisywana
  w miejscu (`docs/architecture/client-package/`), nie akumulowana per spec.
  Korekta faktograficzna z implementacji (2026-07-28): archify NIE ma komendy CLI do
  share-cardów/PNG — eksporty są funkcją czytnika w wygenerowanym HTML (viewer-runtime).
  Paczka przy gate = 5 samodzielnych HTML (automatyzowalne); share-card PNG powstaje
  z poziomu viewera przy oddaniu projektu (krok handoverowy, udokumentowany w skillu).
  Intencja D6 (świeża paczka przy każdym gate) zachowana.

## Proposed Solution

**W repo klienta (kontrakt plikowy — artefakty, które każdy skill nazywa identycznie):**

```
docs/architecture/
  architecture.json + architecture.html     # źródło prawdy delty
  workflow.json     + workflow.html
  sequence.json     + sequence.html
  dataflow.json     + dataflow.html
  lifecycle.json    + lifecycle.html
  client-package/                           # D6: nadpisywana przy każdym gate
    *.html, share-card.png
.ai/docs-deltas/{YYYY-MM-DD}-{spec-slug}.json   # receipt z `compare --receipt`
```

**Cykl życia w repo klienta:**
1. **Bootstrap** (nowy krok obok graphify 4.9): `docs-author` autoruje 5 typów z evidence
   repo; `deliver --quality showcase` na każdym; commit. Karta językowa (język etykiet =
   język klienta) dochodzi do `decision-engine.md`.
2. **Zamknięcie speca** (release gate w `sailes-implement`): `docs-author` aktualizuje
   dotknięte diagramy → `compare architecture <base z gita> <head> --receipt` → delta
   (lub jawnie pusta) pokazywana człowiekowi PRZED przeniesieniem speca do `implemented/`
   → paczka kliencka regenerowana (D6). Pozostałe 4 typy: audyt przez git diff kanonicznego
   JSON (deterministycznie sortowany — czytelny w review).
3. **Adopt**: istniejące repo dostaje krok 1 w ramach adopcji.
4. **Diagnose**: opcjonalny diagram `sequence`/`lifecycle` udowodnionego mechanizmu
   w incident record (nigdy wymagany — diagnoza ma inne priorytety).

**W repo frameworku:** self-docs w `docs/architecture/` (architecture = skills/hooks/agents;
workflow = pipeline; sequence = przebieg sesji; lifecycle = cykl speca; dataflow = przepływ
brief→spec→kod→eval), regenerowane przy każdym release (D4).

**Dystrybucja:** `npx skills add tt-a1i/archify -g` jako prereq maszyny; setup w
`skills/sailes-docs/references/archify-setup.md` z checkiem wersji (D5) i protokołem SKIP.
Atrybucja MIT w SKILL.md (`based_on: tt-a1i/archify`).

## API & UI Surface (powierzchnia frameworku)

Nowe pliki:
- `skills/sailes-docs/SKILL.md` — entrypoint: kiedy używać, router do references, protokół SKIP.
- `skills/sailes-docs/references/archify-setup.md` — install + check wersji + SKIP.
- `skills/sailes-docs/references/authoring.md` — autoring z evidence repo (fast path
  archify + nasze reguły: evidence z gita, język z decyzji bootstrap, stable IDs).
- `skills/sailes-docs/references/delta-at-gate.md` — procedura compare + receipt + pusta
  delta jako dowód + paczka kliencka.
- `agents/docs-author.md` + `codex-agents/docs-author.toml` (D3).
- Ewale: `evals/gate-refuses-to-close-a-spec-without-docs-delta.md`,
  `evals/docs-skip-is-explicit-never-silent.md`, `evals/docs-author-stays-in-lane.md`.

Edytowane pliki (każda edycja = re-run evali nazywających plik):
- `skills/sailes-bootstrap/SKILL.md` (krok 4.10) · `decision-engine.md` (karta języka) ·
  `adopt-existing-repo.md` · `repo-done-checklist.md` (linia SKIP/deliver) ·
  `agents-md-template.md` (sekcja docs dla repo klienta).
- `skills/sailes-implement/SKILL.md` (krok delta przy gate) ·
  `skills/sailes-bootstrap/release-checklist.md` (paczka kliencka, D6).
- `skills/sailes-diagnose/SKILL.md` (opcjonalny diagram mechanizmu).
- `skills/README.md`, `AGENTS.md` (release: self-docs, D4), `release-hygiene.test.js`
  (obecność setu self-docs), rejestracje rosteru dla `docs-author`.

## Data Model / Security / Jobs

- Data model: brak DB — kontrakt plikowy jak wyżej.
- Security: CLI lokalne, zero kluczy i sieci w biegu; jedyny moment sieciowy to instalacja
  skilla (`npx skills add`) — decyzja i akcja człowieka/maszyny, nie agenta w pipeline.
  Diagramy mogą zawierać nazwy systemów klienta — paczka kliencka jest częścią repo klienta,
  więc nie zmienia niczego w modelu poufności.
- Jobs: brak — wszystko synchronicznie w krokach pipeline'u.

## Phasing & Steps

### Phase 1 — Ewale najpierw (chronione zachowania dostają swój sąd przed kodem)
Napisz trzy scenariusze do `evals/` wg konwencji repo (kryterium binarne, `Files:` line,
fixtures w OBU kierunkach — wykrywa naruszenie / nie flaguje poprawnej pracy):
(a) gate odmawia zamknięcia speca bez delty (i akceptuje z jawnie pustą deltą),
(b) SKIP jest jawny nigdy cichy (brak archify → linia SKIP + STATE.md, nie „przeszło"),
(c) `docs-author` trzyma się lane (nie edytuje kodu feature'u; defekt raportuje w górę).
**Done-when:** `ls evals/ | grep -c "docs"` → `3`; każdy plik ma sekcje wymagane przez
`evals/README.md` (kryterium + Files:); `npm test` → 0 failures.

### Phase 2 — Skill `sailes-docs` + setup/SKIP
SKILL.md + trzy references (setup z checkiem wersji D5, authoring, delta-at-gate z D2/D6).
**Done-when:** `npm test` → 0 failures; `git grep -c "SKIP archify" --
skills/sailes-docs/references/archify-setup.md` → `>=1`; `git grep -c "2.12" --
skills/sailes-docs/references/archify-setup.md` → `>=1`; frontmatter SKILL.md ma
`name` + `description` (kształt jak istniejące skille).

### Phase 3 — Rola `docs-author` (D3)
`agents/docs-author.md` (model `claude-sonnet-5`, jawny `effort`, tools bez `Agent`) +
`codex-agents/docs-author.toml` (bez wzmianki o modelu Claude — parity to egzekwuje) +
**obie wymuszone edycje testów**: `docs-author` do listy `ROLES` w
`codex-agents/validate-toml.test.js` ORAZ wpis `INVARIANTS['docs-author']` w
`codex-agents/parity.test.js` z twierdzeniami load-bearing roli:
(1) nigdy nie edytuje kodu feature'u — defekt raportuje w górę,
(2) receipt albo jawny SKIP, nigdy cisza,
(3) autoruje z evidence repo, nie z pamięci/wyobraźni.
Plus rejestracje prozą — znaleźć grepem po `tester` w plikach śledzonych gitem
(`git grep -l "tester" -- agents/ codex-agents/ skills/ docs/ README.md`), nie z pamięci.
**Done-when:** `npm test` → 0 failures (frontmatter + TOML + parity z nowym wpisem);
`git grep -c "Agent" -- agents/docs-author.md` → `0` w polu tools (inspekcja frontmatteru);
`git grep -l "docs-author" -- agents/ codex-agents/ skills/ docs/ README.md | wc -l` ≥
liczba powierzchni ustalona grepem po `tester` minus ewale tester-specyficzne.

### Phase 4 — Wpięcia pipeline: bootstrap + implement + adopt + diagnose
Kroki i karty wg Proposed Solution; `repo-done-checklist.md` dostaje linię
`deliver 5/5 receipts OK` lub `SKIP archify (binary missing)`.
**Done-when:** `npm test` → 0 failures (w tym `repo-done-checklist.test.js`);
`grep -c "sailes-docs" skills/sailes-bootstrap/SKILL.md skills/sailes-implement/SKILL.md
skills/sailes-bootstrap/adopt-existing-repo.md skills/sailes-diagnose/SKILL.md` → po `>=1`
w każdym z czterech.

### Phase 5 — Self-docs frameworku (D4) — pierwszy realny bieg całości
Zainstaluj archify na tej maszynie (`npx skills add tt-a1i/archify -g`), przejdź procedurę
setup (check wersji), autoruj 5 typów dla frameworku, `deliver --quality showcase` każdy,
commit do `docs/architecture/`; dopisz krok do `AGENTS.md` §Release; rozszerz
`release-hygiene.test.js` o obecność setu.
**Done-when:** 5× receipt z `deliver` z exit 0 (wklejone do run-logu); `ls
docs/architecture/*.html | wc -l` → `5`; `npm test` → 0 failures z nowym checkiem hygiene.

### Phase 6 — Werdykty evali + release
Dispatch trzech evali przez `sailes-eval-runner` (świeże konteksty, werdykt z artefaktu
nie z relacji agenta); CHANGELOG entry; pięć stampów wersji (`VERSION`, `package.json`,
`plugin.json`, `marketplace.json`, stamp w AGENTS.md); **aktualizacja opisów prozy
w `plugin.json` i `marketplace.json`** (enumerują skille — dryf bez tego).
**Done-when:** 3× PASS zapisane w plikach evali (`Last run:` z datą 2026-07-28+);
`npm test` → 0 failures; `grep -c "<nowa wersja>"` po pięciu plikach → `1` w każdym.
**Merge do `main` = deploy — wyłącznie decyzja człowieka, poza tym specem.**

## Integration Coverage

Każdy dotknięty plik ma sprawdzenie: walidatory w `npm test` (frontmatter ról, TOML,
repo-done-checklist, release-hygiene) + trzy ewale behawioralne + greppowe Done-when
per faza. Brak API/UI aplikacyjnych — to repo doktrynalne.

## Non-Goals

- Vendoring/fork archify; własny renderer lub format diagramów.
- Dokumentacja prozy (README, runbooki) — tylko diagramy archify.
- Zmiana istniejących gate'ów poza dodaniem kroku delta.
- Animacje/WebM w paczce klienckiej (D6 wymusza tanią paczkę); do backlogu, jeśli klient
  poprosi.
- Egzekwowanie freshness self-docs testem (release-hygiene sprawdza obecność; świeżość
  pilnowana procedurą release + evalem gate'owym — test na mtime byłby flaky).

## Ryzyka

- **Powierzchnia:** +1 skill, +1 rola, +10 plików w każdym repo klienta — największy
  przyrost od 1.16.0, przeciw tezie subtrakcji; wybrane świadomie (brief-ledger).
- **Zależność zewnętrzna:** upstream archify może zmienić schematy — mityguje D5 (min
  wersja + check) i to, że commitujemy JSON+HTML (repo działa bez archify, tylko nie
  regeneruje).
- **`compare` tylko architecture:** delta-dowód pokrywa 1 z 5 typów; pozostałe audytowane
  git-diffem JSON. Jeśli upstream doda compare dla innych typów — rozszerzenie trywialne.
