---
name: sailes-migrate
description: >-
  Jak portować ISTNIEJĄCĄ bazę kodu na inny język/stack na dużą skalę, w sposób
  powtarzalny i bramkowany — struktura zachowana (structure-preserving) domyślnie,
  redesign jako osobny tryb. Sześciokrokowa metoda (feasibility+judge → mapa+rulebook+
  inventory → stress-test → tłumaczenie fan-out → survey build+fixerzy → parzystość
  zachowań) z NIENEGOCJOWALNĄ regułą: żaden równoległy przekład nie startuje, zanim
  nie istnieje judge/parity-harness zwalidowany na celowo zepsutym źródle. Reużywa
  istniejących ról (explorer/team-lead/be-dev/fe-dev/checker/qa) i guardraili deny-list,
  zamiast wymyślać je od nowa. Domain sibling — jak sailes-pipedrive/sailes-hosting —
  NIE jest fazą liniowego pipeline'u build. Używaj ZAWSZE gdy pada: „przenieś/sportuj/
  zmigruj tę aplikację z X na Y", „port legacy", „przepisz z Pythona/PHP/Rails/Javy na
  nasz stack", „migracja kodu/języka", „rewrite dużego repo", „code migration",
  „language migration", „port codebase", „rulebook", „parity harness", „judge",
  „structure-preserving vs redesign". To NIE jest o migracjach SCHEMATU BAZY DANYCH —
  te robi `sailes-database` (Prisma/Drizzle/SQL). Ten skill dotyczy przekładu KODU
  między językami/stackami.
---

# Sailes Migrate — portowanie istniejącej bazy kodu na inny język/stack

> **Provenance:** metoda zdestylowana z `anthropics/code-migration-kit-with-claude-code`
> (Apache-2.0, © 2026 Anthropic PBC). Ten skill to **nasza synteza idei** zmapowana na
> maszynerię Sailes — nie kopia ich plików. Konkretne skrypty (`depmap_*`, `queue_runner`,
> `build_daemon`, szablony `RULEBOOK.md`/`inventory.tsv`/deny-`settings.json`) żyją w tamtym
> repo; jak i czy je vendorować — patrz `cost-and-gates.md` (decyzja licencyjna człowieka).

## Czym to jest (i czym NIE jest)

**Jest:** metodą na **masowy, mechaniczny port istniejącego kodu** z języka/stacku źródłowego na
docelowy — Python→TS, PHP→TS, Rails→nasz stack, C→Rust itd. Jednostka pracy to **plik/moduł z mapy
zależności**, nie „feature". Źródłem prawdy jest **oryginalny kod (wykonywalna specyfikacja)** +
**judge** dowodzący parzystości zachowań.

**NIE jest:**
- migracją **schematu bazy** — to `sailes-database` (opis wyżej disambiguuje trigger);
- budową nowego feature'a — to liniowy pipeline (`sailes-discovery → … → sailes-implement`);
- fazą tego pipeline'u. `sailes-migrate` to **domain sibling** (jak `sailes-pipedrive`,
  `sailes-hosting`): wołany samodzielnie, nie wpięty w numerację faz build.

## Kiedy używać / kiedy NIE

**Użyj**, gdy istnieje działająca baza kodu i trzeba ją przenieść na inny język/stack z zachowaniem
zachowania — na tyle dużą, że ręczny przekład plik-po-pliku bez reguł rozjedzie się między agentami.

**Nie używaj**, gdy: to nowa aplikacja (→ `sailes-discovery`), gdy to zmiana schematu DB
(→ `sailes-database`), gdy coś jest **zepsute** w działającym systemie (→ `sailes-diagnose`), albo
gdy to przepisanie jednego pliku bez zależności (po prostu zrób to).

## Reguła nadrzędna (invariant migracji)

> **Żaden równoległy przekład (Krok 3) nie startuje, zanim nie istnieje judge i nie został
> zwalidowany na CELOWO zepsutym źródle.**

To migracyjny odpowiednik naszego „żadnego kodu feature'a bez zatwierdzonego spec". Judge, który
nie łapie zepsutego oryginału, nie udowodni parzystości portu. Ta reguła jest twarda — softening jej
niweczy sens skilla (patrz eval `migrate-judge-gate`).

## Sześć kroków — i co REUŻYWAMY na każdym

Pełny opis: `methodology.md`. Skrót z mapą reużycia (nie budujemy nic, co już mamy):

| Krok | Wynik | Reużyta maszyneria Sailes |
|---|---|---|
| **0. Feasibility + Judge** | case za/przeciw; parity-harness (istniejący suite albo przenośny, gdy testy importują wnętrzności źródła) | lens `sailes-pre-implement` + dyscyplina bramki `qa`; judge walidowany na zepsutym kodzie — `judge-setup.md` |
| **1. Mapa + Rulebook + Inventory** | kolejność zależności (manifest), tabela decyzji „decide-once", audyt luk języka docelowego | `explorer` + **graphify** (mamy go w każdym repo); Rulebook = **zamrożona** tabela — `rulebook-template.md` |
| **2. Stress-test reguł** | bakeoff (dwaj tłumacze) + pilot na najtrudniejszych plikach; wynik = TYLKO poprawki reguł, zero commitów kodu | najbliższy krewny: RED-baseline z `sailes-implement`; pod guardrailem deny-list |
| **3. Tłumaczenie (fan-out)** | równoległy przekład z manifestu, bez kompilatora | `team-lead` → równolegli `be-dev`/`fe-dev`; **`.claude/settings.json` deny-list** blokuje drogie operacje (mamy hooki + twin `.codex`) — `parallel-translation.md` |
| **4. Survey build + fixerzy** | jeden zbiorczy compile → maszynowa kolejka błędów cięta liście→korzeń → równolegli fixerzy bez dostępu do kompilatora | fan-out fixerów pod `team-lead`; guardraile |
| **5. Uruchom** | hello-world → najmniejszy dowód end-to-end | dyscyplina `qa` (tania weryfikacja przed drogą) |
| **6. Parzystość zachowań (bramka)** | wszystkie testy parzystości zielone **I** oryginalny suite na oryginalnym kodzie bez odziedziczonych porażek; potem burndown `BUG(port)`/`TODO(port)`/`PERF(port)` | `checker` + `tester` + `qa`; markery odroczone → `.ai/backlog.md` |

Każdy krok kończy się **bramką**: sign-off = odpalenie następnego kroku. Zatrzymanie jest darmowe
(kolejka to stan na dysku); wznowienie to ponowne wywołanie, nie recovery. Model kosztu i bramki:
`cost-and-gates.md`.

## Structure-preserving (domyślnie) vs redesign (tryb)

- **Structure-preserving** — ten sam kształt architektury, inny język. Jednostka = plik/moduł.
  Rulebook to **tabela lookup**. Bakeoff ważny. To **domyślna ścieżka**.
- **Redesign** — świadomie wybrany **tryb**. Wtedy: Rulebook staje się **dokumentem projektowym**
  (nie lookupem), **bakeoff traci sens** (zastąp go adwersaryjnym review dokumentu + jednorazowymi
  pełnymi przebiegami), jednostka pracy przesuwa się plik→moduł/subsystem. Dopasowanie zachowań
  (Krok 6) działa bez zmian. Nie redesignuj „po cichu" pod słowem „migracja" (eval
  `migrate-structure-preserving-default`).

## „Napraw proces, nie instancję"

Pojedyncze bugi wypalają fixerzy (Krok 4). **Powtarzalna** porażka to oskarżenie reguły/ustawień, nie
kodu — poprawiasz Rulebook albo deny-list, nie ręcznie łatasz N miejsc. Nawracające lekcje trafiają
do Rulebooka (albo do `.ai/lessons.md` repo migrowanego), nie do historii czatu.

## Guardraile

Kroki 2–4 i 6 działają pod deny-list `.claude/settings.json` (+ twin `.codex/config.toml`, te same
skrypty hooków — mamy to w każdym repo generowanym przez `sailes-bootstrap`), która blokuje drogie
operacje (np. per-plikowy typecheck w trakcie fan-outu). **Jeśli deny-list nie jest zainstalowany,
blokady nie działają** — zainstaluj go przed pilotem z Kroku 2. Szczegóły: `parallel-translation.md`.

## Red Flags — STOP

- Zacząłeś tłumaczyć pliki, a judge/parity-harness **nie istnieje** lub nie był walidowany na
  zepsutym źródle.
- Redesignujesz architekturę bez jawnego wyboru trybu redesign.
- Dwaj agenci mogliby przetłumaczyć ten sam konstrukt inaczej, a to **nie jest** w Rulebooku.
- Deklarujesz „done" na zielonym typecheku, bez dowodu parzystości zachowań (Krok 6).
- Łatasz N-tą instancję tego samego błędu ręcznie zamiast poprawić regułę, która go generuje.
- Wpinasz `sailes-migrate` jako fazę liniowego pipeline'u build (to sibling, nie faza).
- Uruchamiasz fan-out bez zainstalowanego deny-list guardraila.

## Pliki

- `methodology.md` — sześć kroków w głąb.
- `judge-setup.md` — nienegocjowalny judge: istniejący suite vs przenośny harness; walidacja na zepsutym kodzie.
- `rulebook-template.md` — nasz szablon tabeli „decide-once".
- `parallel-translation.md` — playbook fan-outu (team-lead + be-dev/fe-dev + deny-list).
- `cost-and-gates.md` — model kosztu (jednostki × koszt/jednostkę), bramki, provenance + wskaźnik do skryptów kitu.
