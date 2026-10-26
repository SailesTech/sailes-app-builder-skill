# Spec: `REVIEW.md` jako checklista bramki i kąty poprawności w `checker` — review według Anthropic

Status: in-progress — P1 NITS, P2 APPROVE (2 rundy), P3 APPROVE; evale 5/5 PASS `(at ba29d79)`, log
        `.ai/runs/2026-10-26-review-md.md`. Czeka: Human-STOP P2 (brzmienie `checker.md`) i P3 (treść
        szablonu), potem P4 (bloker: kolejka 1.39/1.40 niedostępna na tej maszynie) i P5.
Framework-Version target: osobna minor **po 1.40.0** (Q5) — dziś w kolejce 1.39.0 (design tournament) i
        1.40.0 (`2026-10-01-context-memory-from-clm-paper.md`); numer = następny wolny w chwili merge'u.
Weight: contract fix × 3 powierzchnie — definicja roli `checker` (+ bliźniak Codex), bootstrap repo
        klienta (nowy szablon `REVIEW.md`, dwa martwe odwołania, szablon PR), pętla bramki
        (`team-lead`, `agent-team-structure.md`, `sailes-implement`). Nie rusza modelu danych ani API.
        Zmienia to, czego bramka szuka, z jaką wagą to zgłasza i kiedy pętla poprawek się zatrzymuje,
        w każdym repo na maszynie.
Source: `.ai/audits/2026-10-26-claude-code-review-porownanie.md`; materiał w
        `skile do inspiracji/claude-code-review/` (docs code.claude.com o `REVIEW.md` i Code Review,
        blog claude.dev 2026-10-15 „How the Claude Code team does code review”, `REVIEW.md` z SDK
        Anthropic `6e911ec`, przepis `/code-review` z Claude Code 2.1.300).
Related: `.ai/specs/implemented/2026-09-20-harness-guards-from-ecc-audit.md` — jego A1 wprowadził
        `checker.md:22` (znalezisko = klauzula + obserwacja), które ten spec rozszerza, nie kasuje.
        `.ai/specs/2026-10-01-context-memory-from-clm-paper.md` — jego P1 edytuje `agents/team-lead.md`,
        `codex-agents/team-lead.toml` i `agent-team-structure.md`, które edytuje też nasze P4.

## TLDR

Anthropic recenzuje kod trzema warstwami: **`REVIEW.md`** w repo (co tu jest porażką, co ma wagę
Important, czego nie zgłaszać, limit nitów, dowód `file:line`), **recenzent poprawności** (kąty +
weryfikacja każdego znaleziska, severity Important / Nit / Pre-existing) i **proces** (limit 3 rund,
każde znalezisko dostaje odpowiedź). Nasz `checker` jest silny tam, gdzie oni nie sięgają — braki i
nadmiar wobec specu, uruchomione `Done-when`, pokrycie planu testów — ale:

1. **Nie ma checklisty, którą ma dostawać.** `checker.md:10` i `:15` każą recenzować „against the
   spec/contract and the checklist”; `agents-md-template.md:177` i `agentic-first-principles.md:156`
   odsyłają do `.ai/skills/code-review`, którego bootstrap nie tworzy.
2. **Reguła nie dopuszcza zwykłego błędu, a model ją obchodzi.** `checker.md:22`: znalezisko bez
   klauzuli specu nie wchodzi do werdyktu. Pomiar 2026-10-26 (P1.g, 4 ramiona kontrolne): stary tekst
   na Sonnecie **wykrył 4/4 defekty bez klauzuli**, podpinając je pod sekcję nadmiaru albo klauzulę
   Behaviour, i sam czytał `REVIEW.md` z bazy. Zachowanie jest dobre, ale stoi na interpretacji
   wbrew literze tekstu — zmiana zapisuje to, co model już robi, zamiast dokładać nowe mechanizmy.
3. **Nie odróżnia błędu sprzed diffu**, więc każdy zastany defekt w dotkniętej funkcji jest
   CHANGES-REQUIRED i napędza pętlę (u Anthropic 59% uwag w zapętlonym PR to kod sprzed pierwszej rundy).
4. **Pętla `checker` ↔ worker nie ma limitu.**

Zmiana: `REVIEW.md` w korzeniu repo jako standardowy plik i wejście `checker`; trzy kąty poprawności w
`checker`; severity per znalezisko z mapowaniem na werdykt; w lane `full` przebieg weryfikujący;
limit 3 rund.

## Problem Statement

`checker` to jedyna niezależna bramka kodu przed `qa`. Dziś grading jest dwuczęściowy i oba kawałki są
ustawione na spec: sekcje braków i nadmiaru (`:20`, `:21`) oraz wymóg klauzuli (`:22`). To było celowe
i mierzone (2026-08-01: trzy brakujące endpointy, których patch-review nie mógł znaleźć; 2026-09-20:
wyprodukowane znaleziska uczą leada, że NITS to szum). Skutek uboczny: cała klasa defektów, która nie
ma klauzuli — bo spec opisuje zachowanie, nie każdą linię — nie ma drogi do werdyktu. `:24` każe
„spend your capacity on … edge cases”, ale reguła formatu z `:22` odrzuca to, co ta uwaga znajdzie.

Anthropic rozwiązał tę samą parę napięć (znajdź więcej / nie zmyślaj) inaczej: znalezisko ugruntowane
**scenariuszem awarii** z zacytowaną linią i odrzucane tylko konstruktywnie. To jest ten sam mechanizm
„pole wypełnione albo nie”, który przyjęliśmy 2026-09-20 — z szerszą listą dopuszczalnych podstaw.

## Co jest na dysku dziś (sprawdzone 2026-10-26, worktree z `origin/main` `c53a457`)

| Fakt | Dowód |
|---|---|
| `agents/checker.md` — 41 linii; `codex-agents/checker.toml` — 26 | `wc -l` |
| Wejście `checker` = „diff, spec/contract, review checklist” | `checker.md:10`, `:15` |
| Checklisty nie ma: dwa odwołania do `.ai/skills/code-review`, żadnego szablonu w bootstrapie | `git grep -c 'code-review'` → `agentic-first-principles.md:1`, `agents-md-template.md:1` (+ `sailes-implement/SKILL.md:55` „code-review checklist”, `db-compendium.md` bez związku); `git grep -c 'REVIEW.md'` → 0 |
| Znalezisko wymaga klauzuli specu | `checker.md:22`; fraza „spec clause” w 6 plikach: `checker.md` 2, `checker.toml` 2, `parity.test.js` 2, `evals/checker-reports-a-finding-only-with-evidence.md` 4, `evals/fixtures/fault-injection/README.md` 2, `evals/tier-scales-the-case-list-not-only-the-proof.md` 1 |
| Eval pilnujący braku szumu wymaga „BOTH the spec clause … AND the observation” | `evals/checker-reports-a-finding-only-with-evidence.md` (Expected) |
| CHANGES-REQUIRED wraca do **nowego** workera; limit „three attempts, then STOP” działa tylko wewnątrz jednego workera (A4 z 2026-09-20), więc licznik startuje od zera | `agents/team-lead.md:198`; `agent-team-structure.md:766`; `agents/be-dev.md:57` |
| Brak szablonu PR | `git grep -c 'pull_request_template'` → 0 |
| Tryb Upgrade istnieje i porównuje wersję stempla | `adopt-existing-repo.md:34`, `:59` |

## Decyzje człowieka (2026-10-26)

| # | Wybór | Odrzucone |
|---|---|---|
| D1 | **Kąty poprawności wewnątrz `checker`** — jeden agent, działa też pod Codexem | fan-out 5–15 agentów na bramkę; `/code-review high` przed pushem (nie czyta `REVIEW.md`, nie działa pod Codexem) |
| D2 | **Bez zarządzanego Code Review** — SailesTech nie ma planu Claude Team/Enterprise. `REVIEW.md` czyta tylko nasz `checker`; format zgodny z Anthropic, żeby przejście na usługę nie wymagało przepisania | — |
| D3 | **Weryfikator na Sonnecie** | Haiku |
| D4 | **Limit 3 rund** CHANGES-REQUIRED na fazę, potem karta decyzji dla człowieka | 2 rundy |
| Q1 | **`REVIEW.md` w korzeniu repo**, jak u Anthropic | `.ai/REVIEW.md` |
| Q2 | **`checker` czyta `REVIEW.md` z bazy diffu** (`git show <base>:REVIEW.md`) — diff nie zmienia reguł, którymi go oceniamy; diff, który zmienia `REVIEW.md`, dostaje osobną uwagę | z drzewa roboczego |
| Q3 | **Weryfikator = druga instancja `checker` z briefem „verify”** — zero nowych ról, bez nowego bliźniaka Codex | nowa rola `verifier` |
| Q4 | **Upgrade proponuje `REVIEW.md`** istniejącym repo, repo może odmówić | brak; zapis automatyczny |
| Q5 | **Osobna minor po 1.40.0** | dołączenie do 1.39.0 / 1.40.0 |
| P2-zakres (po P1.g) | **Zawężony P2**: tylko to, czego brakowało w pomiarze — wagi Important/Nit/Pre-existing (Pre-existing nie blokuje), `category`, `REVIEW.md` z bazy jako reguła, trzy podstawy znaleziska, zdanie o tym, co przebiegło, weryfikacja w lane `full`; kąty A/B/C **jedną linią**, nie trzema akapitami. Evale a/b/d = kontrakt formatu, c = strażnik regresji; żaden nie dowodzi lepszego wykrywania | utwardzenie fixture przed P2; P2 bez zmian; wstrzymanie P2 |

## Proposed Solution

**Warstwa 1 — `REVIEW.md` (bootstrap).** Nowy `skills/sailes-bootstrap/review-md-template.md`: plik w
formacie Anthropic z domyślnymi wartościami Sailes, sekcje:
- *What Important means here* — łamie zachowanie ze specu, wycieka dane, blokuje rollback; zapytanie
  bez zawężenia do tenantu, PII w logach albo komunikatach błędów, migracja niekompatybilna wstecz,
  zmiana zamrożonego kontraktu bez specu. Styl, nazwy, refaktor = co najwyżej Nit.
- *Cap the nits* — najwyżej 5 na werdykt.
- *Do not report* — to, co pilnuje ratchet/CI (no-`any`, tokeny, kierunek importów, lint, typy,
  format), pliki generowane, lockfile, `graphify-out/`, kod testowy celowo łamiący reguły produkcyjne.
- *Always check* — wypełniane przy bootstrapie z aktywnych modułów `modules-catalog.md`
  (multi-tenant → zawężenie do tenantu; integracje → para mock/probe; UI → tokeny).
- *Evidence* — twierdzenie o zachowaniu wymaga `file:line`, nie wniosku z nazwy.
- *Summary* — zaczyna się od liczby znalezisk; „nothing to fix”, gdy nic nie ma.

Zasada podziału, zapisana w szablonie i w `agents-md-template.md`: konwencje kodu w `AGENTS.md`,
reguły tego, co zgłaszać i z jaką wagą, w `REVIEW.md`. Wzorzec zwięzłości: `REVIEW.md` SDK Anthropic
(dwie sekcje, każdy punkt to klasa błędu).

**Warstwa 2 — `checker`.**
- Wejście: diff + spec + `REVIEW.md` z bazy diffu (Q2). Brak pliku → werdykt to mówi, bramka działa.
- Po dwóch sekcjach specowych (bez zmian) trzy kąty: (A) linia po linii z całą funkcją otaczającą,
  (B) każda usunięta linia → nazwany niezmiennik i miejsce, gdzie wraca, (C) wywołujący każdej
  zmienionej funkcji przez Grep po symbolu.
- Znalezisko = podstawa (**klauzula specu** albo **zacytowana reguła `REVIEW.md`/`AGENTS.md`** albo
  **scenariusz awarii: wejście/stan → zły wynik**) + obserwacja z zacytowaną linią.
- Severity per znalezisko: **Important** → CHANGES-REQUIRED · **Nit** → NITS, w limicie `REVIEW.md`
  (domyślnie 5) · **Pre-existing** → nigdy nie blokuje; lead przenosi do `.ai/backlog.md` z `file:line`.
- Pole `category`: `spec-omission`, `spec-surplus`, `correctness`, `review-md`, `test-coverage`.
- Jedno zdanie o tym, co przebiegło: które kąty, które komendy `Done-when`, czy był przebieg
  weryfikujący.
- Lane `full`: każde znalezisko `correctness` dostaje przebieg weryfikujący — świeża instancja
  `checker` (Sonnet) z briefem: diff, pliki, jedno znalezisko → CONFIRMED / PLAUSIBLE / REFUTED,
  odrzucenie tylko z zacytowaną linią albo dowodem niemożliwości (typ, stała, niezmiennik, guard w
  tym diffie). Zostają CONFIRMED i PLAUSIBLE.

**Warstwa 3 — pętla bramki.** Limit 3 rund CHANGES-REQUIRED na fazę; po trzeciej lead staje z kartą
decyzji (zmienić podejście / zawęzić fazę / przyjąć ryzyko). Rundy 2–3 recenzują diff poprawki, nie
powtarzają zgłoszonych znalezisk, a znalezisko nazywa klasę błędu. Każde znalezisko dostaje w run
logu odpowiedź: naprawione / błędne (powód) / celowe (klauzula) / bez znaczenia. Szablon PR z sekcjami
Testing / Risk / How to revert.

Data Model: n/a — framework nie ma bazy. API & UI Surface: n/a — brak powierzchni HTTP i ekranów.
Integration / Webhooks: n/a. Jobs / Workflows: n/a.

## Security

Framework: n/a — nie dotyka auth, ról ani danych; nic nie wysyła na zewnątrz. Repo klientów: szablon
`REVIEW.md` **wzmacnia** review w dwóch punktach `security-checklist.md` (zawężenie do tenantu, PII w
logach). Q2 zamyka drogę, w której diff poluzowuje własne reguły oceny.

## Fazy

### P1 — evale najpierw (czerwone na dzisiejszym tekście)

Owns:
| Plik | Wymuszony przez |
|---|---|
| `evals/checker-catches-removed-guard.md` | P1.a |
| `evals/checker-traces-broken-caller.md` | P1.b |
| `evals/checker-follows-review-md.md` | P1.c |
| `evals/checker-pre-existing-does-not-block.md` | P1.d |
| `evals/checker-reports-a-finding-only-with-evidence.md` | P1.e |
| `evals/fixtures/checker-correctness/README.md` | P1.f |
| `evals/fixtures/checker-correctness/make-repo.sh` | P1.f |
| `evals/fixtures/checker-correctness/base/` | P1.f |
| `evals/fixtures/checker-correctness/patches/` | P1.f |
| `evals/fixtures/checker-correctness/specs/` | P1.f |

Blast-radius: `git grep -c 'spec clause' -- . ':!.ai' ':!CHANGELOG.md'` → **6 plików / 13 trafień**.
Zmieniane w P1: tylko `evals/checker-reports-a-finding-only-with-evidence.md` (4). Sprawdzone
2026-10-26, bez zmian: `evals/tier-scales-the-case-list-not-only-the-proof.md:17` i
`evals/fixtures/fault-injection/README.md:21,31` mówią o mutantach testera („each breaking one named
spec clause”), nie o podstawie znaleziska `checker` — nie dryfują. `checker.md`, `.toml`,
`parity.test.js` należą do P2.
Depends-on: — (pliki rozłączne z P2–P5; P2 czeka na `wynik: P1`).
Agent: `be-dev` (pliki evali i fixture) · tier B · —. Przebiegi P1.g: lead dyspozytor wg
`sailes-eval-runner` — eval wymaga świeżego subagenta, którego worker nie może spawnować.
Human-STOP: **tak** — odczyt werdyktów ramion kontrolnych P1.g przed P2: każdy nowy eval musi być
**czerwony** na tekście sprzed zmiany, inaczej fixture jest za łatwy i P2 niczego nie udowodni.
Lane: middle — tier B: evale i fixture; brak wyzwalacza pieniądze/auth/tenancy/idempotencja/
nieodwracalny zapis.

- **P1.a.** `checker-catches-removed-guard` — diff zgodny ze specem (spec nie wspomina o
  uprawnieniach), który w dotkniętej funkcji usuwa sprawdzenie uprawnień. Expected (binary): werdykt
  CHANGES-REQUIRED ze znaleziskiem `correctness`/Important wskazującym usuniętą linię. Kontrola: tekst
  sprzed P2 → nie zgłasza (brak klauzuli).
- **P1.b.** `checker-traces-broken-caller` — diff zmienia kształt zwrotki funkcji; wywołujący w innym,
  niezmienionym pliku czyta stare pole. Expected: znalezisko wskazuje plik wywołującego z linią.
- **P1.c.** `checker-follows-review-md` — `REVIEW.md` na bazie: zapytanie bez tenantu = Important,
  `src/gen/` wykluczone; diff ma oba przypadki **i** zmienia `REVIEW.md`, usuwając regułę tenantu.
  Expected: zgłasza zapytanie bez tenantu jako Important (reguła z bazy, Q2), milczy o `src/gen/`,
  osobno odnotowuje zmianę `REVIEW.md`.
- **P1.d.** `checker-pre-existing-does-not-block` — błąd sprzed diffu w dotkniętej funkcji, diff
  poza tym czysty. Expected: znalezisko Pre-existing, werdykt APPROVE albo NITS, **nie**
  CHANGES-REQUIRED.
- **P1.e.** `checker-reports-a-finding-only-with-evidence` — kryterium „BOTH the spec clause … AND the
  observation” → „a basis (spec clause, quoted `REVIEW.md`/`AGENTS.md` rule, or a failure scenario
  input/state → wrong result) AND the observation”. Fixture bez zmian: pokusy (`doWork`, długość
  funkcji, komentarz) nie mają żadnej z trzech podstaw, więc oczekiwany wynik zostaje.
- **P1.f.** Wspólny fixture `evals/fixtures/checker-correctness/` (spec, baza, diff) dla P1.a–P1.d.
- **P1.g.** Przebiegi kontrolne wg `evals/harness/README.md` na tekście sprzed P2:
  `.ai/eval-runs/2026-10-DD-review-md/control-*.md`. Każdy plik przebiegu zapisuje **SHA**
  `agents/checker.md`, na którym biegł (`git log -1 --format=%h -- agents/checker.md`) — ramię kontrolne
  i P2.d biegną tego samego dnia, a `eval-status.js` porównuje daty, nie commity (lekcja 2026-08-02).
  Brief każdego przebiegu nazywa ścieżkę pliku wyniku: brak pliku = brak przebiegu (lekcja 2026-07-25).

**Done-when:**
- `ls evals/checker-{catches-removed-guard,traces-broken-caller,follows-review-md,pre-existing-does-not-block}.md | wc -l` → 4 (baseline 0) — P1.a–P1.d;
- `grep -c 'failure scenario' evals/checker-reports-a-finding-only-with-evidence.md` → ≥ 1 (baseline 0) — P1.e;
- `ls evals/fixtures/checker-correctness/README.md` → istnieje — P1.f;
- `node evals/harness/eval-status.js | grep -c -E 'checker-(catches-removed-guard|traces-broken-caller|follows-review-md|pre-existing-does-not-block)'` → 4 — P1.a–P1.d;
- `ls .ai/eval-runs/2026-10-*-review-md/control-*.md | wc -l` → 4, każdy z werdyktem ramienia kontrolnego **FAIL** (bramka sprzed zmiany nie łapie) — P1.g;
- `npm test` → exit 0.

Contract-probe: n/a — evale i fixture, brak istniejącego kontraktu danych.
Deployed-probe: n/a — doktryna offline, brak wdrożonej powierzchni i kodu statusu HTTP.

---

### P2 — `checker`: `REVIEW.md`, kąty, podstawa znaleziska, severity, przebieg weryfikujący

Owns:
| Plik | Wymuszony przez |
|---|---|
| `agents/checker.md` | P2.a |
| `codex-agents/checker.toml` | P2.b |
| `codex-agents/parity.test.js` | P2.c |
| `skills/sailes-bootstrap/agent-team-structure.md` | touched-but-not-produced: wiersz `checker` w tabeli ról (`:97`) dostaje „+ REVIEW.md, severity” — jedna linia opisu, bez nowej reguły |

Blast-radius: `git grep -c 'spec clause' -- . ':!.ai' ':!CHANGELOG.md'` → 6 plików / 13 trafień (P1);
`git grep -c 'CHANGES-REQUIRED' -- agents skills codex-agents` → **15 plików** — zmienia się *kiedy*
pada CHANGES-REQUIRED (tylko Important), nie jego nazwa, więc pozostałe 13 plików nie dryfuje
(potwierdza `parity.test.js` i odczyt `qa.md`/`qa.toml`: `qa` ma własny werdykt, nie czyta severity).
Depends-on: `wynik: P1` (evale muszą istnieć i być czerwone, zanim tekst się zmieni).
Agent: `be-dev` · tier B · —.
Human-STOP: **tak** — przegląd finalnego brzmienia `checker.md` przed merge; to tekst, który
recenzuje każdą fazę w każdym repo.
Lane: middle — tier B: tekst roli i test parity.

- **P2.a.** `agents/checker.md`:
  - `:10` i `:15` — wejście: diff + spec + `REVIEW.md` z bazy diffu (`git show <base>:REVIEW.md`);
    brak pliku → jedno zdanie w werdykcie; diff zmieniający `REVIEW.md` → osobna uwaga.
  - nowy punkt po `:21` — kąty A/B/C **jedną linią** (zawężenie po P1.g: stary tekst już je stosuje;
    linia utrwala zachowanie, nie wprowadza go).
  - `:22` — trzy dopuszczalne podstawy znaleziska + obserwacja z zacytowaną linią; mechanizm „pole
    wypełnione albo nie” zostaje.
  - `:24` — „edge cases” wskazuje na kąty.
  - `## Output` — severity per znalezisko + mapowanie na werdykt; `category`; zdanie o tym, co
    przebiegło; limit nitów z `REVIEW.md` (domyślnie 5).
  - nowa sekcja „Verify mode (lane `full`)” — brief, trzy stany, reguła odrzucenia.
- **P2.b.** Bliźniak `codex-agents/checker.toml` — te same reguły.
- **P2.c.** `parity.test.js`: koncepty pozytywne (`REVIEW.md`, trzy kąty, Pre-existing, verify mode) i
  odwrotny w `INVERSE_INVARIANTS.checker`: brak brzmienia, w którym klauzula specu jest **jedyną**
  dopuszczalną podstawą.
- **P2.d.** Przebiegi P1.a–P1.e na nowym tekście (lead wg `sailes-eval-runner`):
  `.ai/eval-runs/2026-10-DD-review-md/treatment-*.md`, każdy z SHA `agents/checker.md` po P2 (≠ SHA
  ramienia kontrolnego — inaczej przebieg nie dowodzi zmiany).

**Done-when:**
- `grep -c 'REVIEW.md' agents/checker.md` → ≥ 2 (baseline 0) i `grep -c 'REVIEW.md' codex-agents/checker.toml` → ≥ 2 (baseline 0) — P2.a/P2.b;
- `grep -c -i 'pre-existing' agents/checker.md` → ≥ 1 (baseline 0) — P2.a;
- `grep -c -i 'verify mode' agents/checker.md` → ≥ 1 (baseline 0) — P2.a;
- `node codex-agents/parity.test.js` → exit 0; `node codex-agents/validate-toml.test.js` → exit 0; `node agents/validate-frontmatter.test.js` → exit 0 — P2.b/P2.c;
- `grep -c '^Last run:.*PASS' evals/checker-{catches-removed-guard,traces-broken-caller,follows-review-md,pre-existing-does-not-block,reports-a-finding-only-with-evidence}.md` → 5 × 1 — P2.d; FAIL któregokolwiek → faza się nie zamyka;
- `npm test` → exit 0.

Contract-probe: n/a — tekst roli, brak kontraktu danych.
Deployed-probe: n/a — doktryna offline.

---

### P3 — bootstrap: szablon `REVIEW.md`, martwe odwołania, Upgrade, szablon PR

Owns:
| Plik | Wymuszony przez |
|---|---|
| `skills/sailes-bootstrap/review-md-template.md` | P3.a |
| `skills/sailes-bootstrap/skeleton.md` | P3.b |
| `skills/sailes-bootstrap/SKILL.md` | P3.b |
| `skills/sailes-bootstrap/agents-md-template.md` | P3.c |
| `skills/sailes-bootstrap/agentic-first-principles.md` | P3.c |
| `skills/sailes-implement/SKILL.md` | P3.c |
| `skills/sailes-bootstrap/adopt-existing-repo.md` | P3.d |
| `skills/sailes-bootstrap/pr-template.md` | P3.e |

Blast-radius: `git grep -c 'code-review' -- . ':!.ai' ':!CHANGELOG.md' ':!skile do inspiracji'` → 4
pliki / 4 trafienia; zmieniane 3 (`agents-md-template.md:177`, `agentic-first-principles.md:156`,
`sailes-implement/SKILL.md:55`), `db-compendium.md` bez związku. `git grep -c 'REVIEW.md'` → 0.
`skeleton.md` i `agents-md-template.md` czyta `repo-done-checklist.md` — potwierdza
`repo-done-checklist.test.js`. Kopie `agents-md-template.md` w `.ai/eval-runs/*/fixture/` to zamrożone
fixtures, nie konsumenci — nie są edytowane.
Depends-on: — (rozłączne z P1, P2, P4; tylko `sailes-implement/SKILL.md` dzielone z P4 — różne linie,
`:55` tu, `:51` w P4; P4 startuje po `wynik: P3`, żeby nie było dwóch równoległych edycji jednego pliku).
Agent: `be-dev` · tier C · —.
Human-STOP: **tak** — przegląd domyślnej treści `review-md-template.md`; to plik, który dostanie każdy
nowy projekt klienta.
Lane: middle — tier C: szablony i dokumentacja doktryny.

- **P3.a.** `review-md-template.md` — szablon z Proposed Solution, Warstwa 1; nagłówek mówi, że
  plik ląduje w korzeniu repo, czyta go `checker` z bazy diffu, a format jest zgodny z Code Review
  Anthropic (gdyby kiedyś doszedł plan Team/Enterprise). Instrukcja wypełniania *Always check* z
  `modules-catalog.md`.
- **P3.b.** `skeleton.md` — Case B tworzy `REVIEW.md` z szablonu; `SKILL.md` bootstrapu — szablon na
  liście plików referencyjnych (`:132`) i w kroku Case B (`:57`).
- **P3.c.** Trzy martwe odwołania → `REVIEW.md` (+ jedna linia zasady podziału `AGENTS.md` /
  `REVIEW.md` w `agents-md-template.md`).
- **P3.d.** `adopt-existing-repo.md`: wiersz w tabeli kontroli adopcji („`REVIEW.md` w korzeniu”) i
  punkt w Upgrade mode — **propozycja** z szablonu, repo może odmówić (Q4).
- **P3.e.** `pr-template.md` — treść `.github/pull_request_template.md` z sekcjami Testing / Risk /
  How to revert; `skeleton.md` (P3.b) go wstawia.

**Done-when:**
- `ls skills/sailes-bootstrap/review-md-template.md skills/sailes-bootstrap/pr-template.md` → oba istnieją — P3.a/P3.e;
- `grep -c -E 'What Important means here|Cap the nits|Do not report|Always check' skills/sailes-bootstrap/review-md-template.md` → 4 — P3.a;
- `grep -c 'REVIEW.md' skills/sailes-bootstrap/skeleton.md` → ≥ 1 i `grep -c 'review-md-template' skills/sailes-bootstrap/SKILL.md` → ≥ 1 (baseline 0) — P3.b;
- `git grep -c '\.ai/skills/code-review' -- skills` → 0 (baseline 2) i `grep -c 'code-review checklist' skills/sailes-implement/SKILL.md` → 0 (baseline 1) — P3.c;
- `grep -c 'REVIEW.md' skills/sailes-bootstrap/adopt-existing-repo.md` → ≥ 2 (baseline 0) — P3.d;
- `grep -c -E 'Testing|Risk|How to revert' skills/sailes-bootstrap/pr-template.md` → 3 — P3.e;
- `node skills/sailes-bootstrap/repo-done-checklist.test.js` → exit 0 — P3.b/P3.c;
- `npm test` → exit 0.

Contract-probe: n/a — szablony, brak kontraktu danych.
Deployed-probe: n/a — doktryna offline.

---

### P4 — pętla bramki: limit 3 rund, odpowiedź na każde znalezisko, Pre-existing do backlogu

Owns:
| Plik | Wymuszony przez |
|---|---|
| `agents/team-lead.md` | P4.a |
| `codex-agents/team-lead.toml` | P4.a |
| `skills/sailes-bootstrap/agent-team-structure.md` | P4.b |
| `skills/sailes-implement/SKILL.md` | P4.c |
| `evals/lead-stops-after-three-review-rounds.md` | P4.d |

Blast-radius: `git grep -c 'CHANGES-REQUIRED loops' -- . ':!.ai' ':!CHANGELOG.md'` → 2 pliki
(`checker.md`, `team-lead.md`); `checker.md` zmienia P2. **Spec 2026-10-01 (1.40.0) P1 edytuje
`agents/team-lead.md`, `codex-agents/team-lead.toml` i `agent-team-structure.md`** — stąd zależność
od merge'u 1.40.0, żeby nie mieć dwóch niescalonych gałęzi na tych samych plikach.
Depends-on: `wynik: P2` (severity w werdykcie), `wynik: P3` (`sailes-implement/SKILL.md`),
`wynik: 1.40.0 na main` (po merge'u `git merge main` tutaj).
Agent: `be-dev` · tier B · —. Przebieg P4.d: lead wg `sailes-eval-runner`.
Human-STOP: **tak** — brzmienie karty decyzji po trzeciej rundzie.
Lane: middle — tier B: tekst doktryny i eval.

- **P4.a.** `team-lead.md:198` (+ bliźniak): licznik rund CHANGES-REQUIRED na fazę w run logu; po
  trzeciej STOP i karta decyzji (zmienić podejście / zawęzić fazę / przyjąć ryzyko); rundy 2–3 = brief
  z diffem poprawki i listą już zgłoszonych znalezisk (bez powtórek); Pre-existing → `.ai/backlog.md`.
- **P4.b.** `agent-team-structure.md:766` (re-spawn fresh) — ta sama reguła w kanonie; run log
  dostaje pole odpowiedzi na znalezisko: naprawione / błędne (powód) / celowe (klauzula) / bez znaczenia.
- **P4.c.** `sailes-implement/SKILL.md:51` — tabela bramek: limit rund i Pre-existing nie blokuje.
- **P4.d.** Eval `lead-stops-after-three-review-rounds` — fixture: run log z trzema CHANGES-REQUIRED
  na tej samej fazie. Expected: lead nie spawnuje czwartego workera, daje kartę decyzji. Kontrola:
  tekst sprzed P4 → spawnuje.

**Done-when:**
- `grep -c -i 'three rounds\|3 rounds' agents/team-lead.md` → ≥ 1 (baseline 0) i to samo w `codex-agents/team-lead.toml` — P4.a;
- `grep -c -i 'pre-existing' skills/sailes-bootstrap/agent-team-structure.md` → ≥ 1 (baseline 0) — P4.b;
- `grep -c -i 'pre-existing' skills/sailes-implement/SKILL.md` → ≥ 1 (baseline 0) — P4.c;
- `node codex-agents/parity.test.js` → exit 0; `node tools/sync-blocks.js --check` → exit 0 — P4.a/P4.b;
- `grep -c '^Last run:.*PASS' evals/lead-stops-after-three-review-rounds.md` → 1, ramię kontrolne FAIL — P4.d;
- `npm test` → exit 0.

Contract-probe: n/a — tekst doktryny i eval; faza nie woła żadnego API, webhooka ani odpowiedzi zewnętrznej.
Deployed-probe: n/a — doktryna offline.

---

### P5 — wydanie

Owns:
| Plik | Wymuszony przez |
|---|---|
| `VERSION` | P5.a |
| `package.json` | P5.a |
| `.claude-plugin/plugin.json` | P5.a |
| `.claude-plugin/marketplace.json` | P5.a |
| `AGENTS.md` | P5.a |
| `CHANGELOG.md` | P5.b |
| `.ai/docs-deltas/2026-10-DD-release-review-md-notes.md` | P5.c |

Blast-radius: pięć stempli (`release-hygiene.test.js:9-12`); `AGENTS.md` tylko w linii
`Framework-Version:`. Diagramy: `lifecycle` (pętla bramki) — `docs-author` potwierdza albo zawęża.
Depends-on: `wynik: P1`, `wynik: P2`, `wynik: P3`, `wynik: P4`, `wynik: 1.40.0 na main` (Q5).
Agent: `team-lead` (stemple, CHANGELOG, PR) + `docs-author` (P5.c) · tier C · —.
Human-STOP: **tak — `git push` na `main` jest deployem** (`AGENTS.md` § `main` is production);
PR otwiera lead, scala człowiek.
Lane: middle — tier C: pliki wersji i dokumentacja.

- **P5.a.** Pięć stempli → następna wolna minor po 1.40.0.
- **P5.b.** `CHANGELOG.md` — wpis upgrade-actionable: repo z niższym `Framework-Version` po Upgrade
  dostaje propozycję `REVIEW.md` i szablonu PR; `checker` czyta `REVIEW.md`, gdy jest.
- **P5.c.** Delta dokumentacji i paragon (`CONTENT UPDATED, RECEIPT BLOCKED` jawnie, jeśli dług
  layoutowy z 1.33.0 znów zablokuje).

**Done-when:**
- `node release-hygiene.test.js` → exit 0 z pięcioma stemplami na nowej wersji i nagłówkiem w CHANGELOG — P5.a/P5.b;
- `node hooks/framework-version-check.test.js` → exit 0 — P5.a;
- `ls .ai/docs-deltas/ | grep -c 'review-md'` → 1 — P5.c;
- `npm test` → exit 0; PR na `main` otwarty i nazwany w run logu.

Contract-probe: n/a — faza wydania: stemple wersji, CHANGELOG i dokumentacja, bez wywołania kontraktu.
Deployed-probe: n/a — dystrybucja to pull marketplace z `main`; dowodem deployu jest
`framework-version-check` w następnej sesji, co zapisuje run log.

## Plan wykonania

| Fala | Fazy | Równolegle | Blokuje lidera | Workflow |
|---|---|---|---|---|
| 1 | P1 · P3 | tak | P1: tak | tak |
| 2 | P2 | nie | tak | tak |
| 3 | P4 | nie | tak | tak |
| 4 | P5 | nie | tak | nie |

P1 i P3 mają rozłączne pliki. P1 blokuje leada przez przebiegi kontrolne (dyspozycja evalu to robota
leada). P2 czeka na czerwone evale. P4 czeka na P2, P3 i merge 1.40.0. P5 kończy.

## Integration Coverage

| Powierzchnia | Test | Faza |
|---|---|---|
| Werdykt `checker`: usunięty guard | `evals/checker-catches-removed-guard.md` A/B | P1, P2 |
| Werdykt `checker`: zepsuty wywołujący | `evals/checker-traces-broken-caller.md` A/B | P1, P2 |
| Werdykt `checker`: `REVIEW.md` z bazy, wykluczenia | `evals/checker-follows-review-md.md` A/B | P1, P2 |
| Werdykt `checker`: Pre-existing nie blokuje | `evals/checker-pre-existing-does-not-block.md` A/B | P1, P2 |
| Werdykt `checker`: brak szumu na czystym diffie | `evals/checker-reports-a-finding-only-with-evidence.md` (istniejący, kryterium P1.e) | P1, P2 |
| Spójność `checker.md` ↔ `checker.toml` | `parity.test.js` + koncept odwrotny | P2 |
| Lead po trzeciej rundzie | `evals/lead-stops-after-three-review-rounds.md` A/B | P4 |
| Bootstrap i checklista repo | `repo-done-checklist.test.js` | P3 |

## Non-Goals

- Zarządzany Code Review na GitHubie (D2) i `/code-review` w bramce (D1).
- Kąty porządkowe (reuse, simplification, efficiency) i kąty historii (blame, stare PR-y) — generują
  nity, a historia decyzji jest w `.ai/`.
- Liczbowa pewność 0–100 ze starego pluginu `code-review`.
- Rezygnacja z uruchamiania `Done-when` przez `checker` — u Anthropic review czyta, a CI uruchamia; u
  nas uruchomienie jest dowodem bramki.
- Zmiana sekcji braków i nadmiaru (`checker.md:20`, `:21`) — zostają bez zmian.
- Nowa rola `verifier` (Q3).
- Automatyczny zapis `REVIEW.md` do istniejących repo (Q4 — tylko propozycja).

## Decisions Ledger

| Data | Decyzja | Kto |
|---|---|---|
| 2026-10-26 | D1–D4 (kąty w `checker`, bez Code Review, Sonnet, 3 rundy) | właściciel |
| 2026-10-26 | Q1–Q5 (korzeń, baza diffu, druga instancja `checker`, propozycja w Upgrade, osobna minor po 1.40.0) | właściciel |
| 2026-10-26 | Po P1.g (stary tekst wykrywa 4/4, różnica w etykietach): zawężony P2 | właściciel |
