# Brief: precyzja delegowania i kontrola nad agentami

Typ: brownfield (zmiana w tym frameworku)
Data: 2026-08-01
Wywiad: `sailes-discovery`, trzy rundy
Materiał wejściowy: wnioski 2026-08-01 · `.ai/eval-runs/2026-08-01-doctrine-1.26.0/` · `.ai/eval-runs/2026-08-01-stale-sweep/` · trzy konflikty kryteriów zmierzone tego dnia

## Problem

Dwa bóle, oba nazwane przez człowieka jako **realnie przeżyte**, nie hipotetyczne:

1. **Nie wiadomo, co agenci robią w trakcie.** Przebieg trwa, worker milczy, i nie da się odróżnić
   „nie skończył" od „skończył, a raport się zgubił". 2026-08-01 dwa razy praca leżała **skończona
   na dysku**, a lider zaraportował ją jako nieukończoną; dwóch workerów straciło pracę przy
   pięciu padnięciach maszyny.
2. **Briefy nie domykają zakresu, i wychodzi to późno.** Lista plików bez pokrycia w `Done-when`
   kosztowała w jednym kamieniu trzy braki, w tym całą powierzchnię odczytu — każdy przeszedł
   bramkę, bo `checker` ocenia diff w zakresie fazy, a zakresem fazy jest jej `Done-when`.

Trzecia rzecz, wykryta przy okazji i należąca tu, a nie do łatki: **próg delegowania jest opisany
w trzech miejscach różnymi słowami**, przez co dwa evale wymagają przeciwnych zachowań i jeden
z nich musi paść niezależnie od tego, co zrobi poprawny lider.

## Ustalenie, które kształtuje wszystko poniżej

Trzynaście ramion ewaluacyjnych tego dnia: **kontrole trafiały bez doktryny**, a jedna wyprowadziła
regułę, którą właśnie dopisywano. Framework ma na to własną odpowiedź (`agents/team-lead.md`) —
reguła, która przeżywa tylko dzięki temu, że model ją odtwarza, nie jest regułą. **Wniosek dla
zakresu: dokładać prozy tam, gdzie mechanizm jest niemożliwy, nie tam, gdzie jest niewygodny.**

## Pomiar wykonany w trakcie wywiadu

Człowiek poprosił o sprawdzenie narzędzi zadań harnessu jako warstwy wygody. Zmierzone na żywym
narzędziu, nie założone:

| Zachowanie | Wynik |
|---|---|
| `TaskCreate` przyjmuje dowolne `metadata` | ✅ |
| `TaskUpdate` przyjmuje `owner`, `status`, `metadata` | ✅ |
| `TaskList` renderuje id · status · temat · właściciela | ✅ |
| `TaskGet` renderuje `metadata` | ❌ **nie** — wpisane `baseSha`, `claimedFiles`, `lifecycle` nie wracają |
| `TaskGet` renderuje `blocks` / `blockedBy` | ❌ nie, mimo że obiecuje to własny opis narzędzia |

**Metadane są w praktyce tylko do zapisu.** Do tego stan jest sesyjny, nie repozytoryjny, i nie
przeżywa padnięcia procesu. Wniosek: harness nadaje się na **zgrubne lustro** (kto co trzyma,
w jakim stanie), nie na nośnik treści. Pola, dla których go chciano — sha bazy, zajęte pliki,
werdykt — wchodzą i nie wychodzą.

## Zakres

**Faza 1 — precyzja briefu (wybrana jako pierwsza).** Cztery rzeczy, wszystkie wskazane przez
człowieka, każda rozstrzygana osobno jako mechanizm-albo-proza:
- każdy plik na liście dozwolonych ma warunek `Done-when`, który go wymusza;
- obecność pól obowiązkowych briefu (cel, kontrakt, zabronione, weryfikacja, klauzula raportu,
  mechanizm dostarczenia, sprawdzenie bazy worktree);
- zakres zadania nie przecina się z niczym, co już jedzie — macierz własności plików jako
  **artefakt**, nie akapit;
- **próg delegowania rozstrzygnięty w jednym miejscu**, z dwoma pozostałymi wskazującymi na nie.

**Faza 2 — plik statusu workera.** Osobny plik per worker, w repo:
- **zajmowany na starcie** (kim jestem, jakie pliki biorę, sha bazy) i **domykany na końcu**
  (wynik, commit) — żeby brak pliku znaczył „nigdy nie wystartował", a plik niedomknięty „padł
  w trakcie". Dziś te dwie rzeczy są nie do odróżnienia i to jest przyczyna obu strat;
- **lider weryfikuje plik przeciw worktree** — czy commit istnieje, czy dotknięte pliki zgadzają
  się z zadeklarowanymi, czy baza była aktualna. To jest drabina obserwacji z 1.26.0 użyta jako
  narzędzie, nie jako ostatnia deska ratunku;
- narzędzia zadań harnessu **opcjonalnie**, jako lustro statusu i właściciela, w granicach
  zmierzonych wyżej.

## Decisions Ledger

| Decyzja | Wybór | Przez kogo | Odrzucone (dlaczego) |
|---|---|---|---|
| Co pierwsze | precyzja briefów | człowiek | powierzchnia dla człowieka (taniej nie zepsuć niż zobaczyć zepsute) |
| Forma | mechanizm gdzie się da, proza gdzie nie | człowiek | sama proza (dziś zmierzona jako re-derywowalna); sam mechanizm (nie złapie wszystkiego) |
| Moment zapisu | zajęty na starcie, domknięty na końcu | człowiek | tylko na końcu (skleja „nie skończył" z „raport się zgubił"); aktualizacja przy każdym kroku (obowiązek, który pod presją wypada pierwszy) |
| Weryfikacja | plik przeciw worktree | człowiek | sama kompletność pliku (bierze deklarację workera na słowo) |
| Nośnik | pliki w repo jako źródło prawdy | człowiek | narzędzia harnessu jako nośnik — **wykluczone pomiarem**, nie preferencją |
| Harness jako lustro | tak, opcjonalnie, po pomiarze | człowiek | pominięcie go bez sprawdzenia (człowiek cofnął pierwszą odpowiedź, żeby to zmierzyć) |
| Dowód | test na formacie + eval na zachowaniu | człowiek | żywy przebieg jako jedyny dowód (niepowtarzalny przy następnej zmianie) |
| Trzy konflikty kryteriów | naprawiane w tym specu | człowiek | osobne małe przejście (trzy łatki, które znów się rozjadą) |
| Kto naprawia kryteria | podzespół, nie prowadzący | człowiek | prowadzący (trzymał te werdykty) |

## Non-goals

- Żywy podgląd przebiegu w czasie rzeczywistym. Człowiek wybrał rozliczenie po fakcie; plik
  zajmowany na starcie daje przy okazji wgląd w trakcie, ale to skutek uboczny, nie cel.
- Zastępowanie run logu. Plik statusu odpowiada na „czy ten worker skończył i co ruszył",
  a nie na „jak poszedł cały przebieg".
- Naprawianie harnessu Claude Code. `TaskGet` gubiący metadane jest defektem **poza tym repo** —
  zgłaszamy i obchodzimy, nie naprawiamy.

## Handoff

`sailes-spec` — szkielet + bramka Open Questions. Materiał na Open Questions już widoczny:
kształt macierzy własności plików jako artefaktu, miejsce, w którym ma stanąć jeden próg
delegowania, i to, czy weryfikacja pliku przeciw worktree ma blokować, czy tylko raportować.
