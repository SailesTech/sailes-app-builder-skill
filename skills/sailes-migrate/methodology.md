# Metodyka — sześć kroków migracji w głąb

Wynikiem każdego kroku są **dowody**; Twój sign-off odpala następny. Porażka oskarża **proces**
(reguły/ustawienia), nie pojedynczy kod. Zatrzymanie jest darmowe — kolejkę definiuje stan na dysku.

---

## Krok 0 — Feasibility + Judge (nienegocjowalny)

Dwa wyniki, oba przed czymkolwiek innym:

1. **Case za/przeciw migracji** (read-only): dlaczego portujemy, 3 twarde zobowiązania (język
   docelowy, structure-preserving czy redesign, zakres), szkic sześciu kroków. To lens
   `sailes-pre-implement` zastosowany do portu.
2. **Judge** — patrz `judge-setup.md`. Musi istnieć i być **zwalidowany na celowo zepsutym
   źródle** (złam oryginał → judge musi to złapać). Judge, który przechodzi na zepsutym
   oryginale, niczego nie udowodni.

**Bramka:** brak zwalidowanego judge'a → nie wolno przejść do Kroku 1. (Eval `migrate-judge-gate`.)

## Krok 1 — Mapa + Rulebook + Inventory (równolegle)

- **Mapa zależności** → deterministyczna kolejność plik- i pakiet-poziomu, wykrywa cykle. U nas:
  najpierw **graphify** (jest w każdym repo), skrypty `depmap_*` kitu jako uzupełnienie dla
  języków, których graphify nie pokrywa. Wynik → `manifest.tsv` (kolejność liście→korzeń).
- **Rulebook** (`rulebook-template.md`) — każda decyzja przekładu rozstrzygnięta **raz**. Test
  przynależności: *jeśli dwaj agenci mogliby odpowiedzieć różnie — to idzie do Rulebooka.*
- **Gap inventory** — płaska tabela każdego miejsca, gdzie język docelowy wymaga czegoś, czego
  źródłowy nie miał (np. jawne typy, obsługa błędów, async). Audyt luk, nie kod.

Reużyj `explorer` do mapy/inventory. **Bramka:** manifest + Rulebook v1 + inventory istnieją.

## Krok 2 — Stress-test reguł (zanim fan-out)

Cel: znaleźć dziury w Rulebooku **tanio**, zanim rozjadą się na całe repo.

- **Bakeoff** — dwaj tłumacze na tych samych trudnych plikach: jeden ściśle wg Rulebooka, jeden
  „natywny". Diffy między nimi = werdykty reguł (dopisz do Rulebooka). *W trybie redesign bakeoff
  traci sens* — zastąp adwersaryjnym review dokumentu projektowego.
- **Pilot** — pełny pipeline na garści najgorszych plików przed fan-outem.
- **Jedyny wynik: poprawki reguł. Zero commitów kodu.**

Wymaga zainstalowanego **deny-list guardraila** (Krok potrzebuje go do stress-testu). **Bramka:**
Rulebook ustabilizowany na pilotach.

## Krok 3 — Tłumaczenie wszystkiego (fan-out)

- Mechaniczny runner czyta `manifest.tsv`; równolegli implementerzy (`be-dev`/`fe-dev` pod
  `team-lead`) tłumaczą jednostki.
- **Bez uruchamiania kompilatora** — zostawiamy go na zbiorczy survey (Krok 4).
- Deny-list `.claude/settings.json` aktywny (blokuje drogie operacje per-jednostka).

Szczegóły orkiestracji: `parallel-translation.md`. **Bramka:** wszystkie jednostki z manifestu
przetłumaczone (stan na dysku).

## Krok 4 — Survey build + fixerzy

- **Jeden zbiorczy build** puszcza kompilator po całości.
- Błędy → **maszynowa kolejka** cięta po module, liście→korzeń.
- Równolegli **fixerzy** pracują kolejkę **bez dostępu do kompilatora** (żeby nie zapętlić drogich
  buildów); daemon przebudowuje, gdy drzewo się zmienia.
- Powtarzasz aż czysto.

**„Napraw proces":** ten sam błąd w N miejscach → popraw **regułę**, nie N łatek. **Bramka:**
build czysty.

## Krok 5 — Uruchom to

- Hello-world, potem **najmniejszy** dowód end-to-end. Tania weryfikacja przed drogą (dyscyplina
  `qa`). **Bramka:** proces startuje i przechodzi najmniejszą ścieżkę.

## Krok 6 — Dopasowanie zachowań (bramka końcowa)

- **Judge** orzeka: albo istniejący suite (dla kodu publicznego), albo przenośny harness
  parzystości (`judge-setup.md`).
- **Bramka parzystości:** wszystkie testy parzystości zielone **I** oryginalny suite puszczony na
  **oryginalnym** kodzie ma zero odziedziczonych porażek (inaczej porównujesz z zepsutym wzorcem).
- Po bramce: burndown markerów `BUG(port)` / `TODO(port)` / `PERF(port)` — odroczone do
  `.ai/backlog.md` repo migrowanego.

Reużyj `checker` + `tester` + `qa`. **To jest definicja „done" tej migracji.**

---

## Tryb redesign — czym się różni

| Element | Structure-preserving (domyślnie) | Redesign (tryb) |
|---|---|---|
| Rulebook | tabela lookup | dokument projektowy |
| Bakeoff (Krok 2) | ważny | **nieważny** → adwersaryjne review + jednorazowe pełne przebiegi |
| Jednostka pracy | plik | moduł / subsystem |
| Krok 6 (parzystość) | bez zmian | bez zmian |
