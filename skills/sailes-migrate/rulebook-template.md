# Rulebook — szablon tabeli „decide-once"

Rulebook to **jedno źródło prawdy dla decyzji przekładu**. Zasada przynależności:

> Jeśli dwaj agenci mogliby przełożyć ten sam konstrukt **inaczej** — decyzja idzie tutaj i jest
> rozstrzygnięta **raz**. Rulebook zamraża wybór, żeby fan-out (Krok 3) był spójny.

Skopiuj tę tabelę do repo migrowanego (`.ai/migrate/RULEBOOK.md`) i wypełniaj podczas Kroku 1,
domykaj podczas Kroku 2 (stress-test dopisuje werdykty z bakeoffu).

> **Structure-preserving:** to tabela **lookup** (konstrukt źródłowy → decyzja docelowa).
> **Redesign (tryb):** Rulebook staje się **dokumentem projektowym** — nie lookup, lecz decyzje
> architektoniczne z uzasadnieniem; walidowany adwersaryjnym review, nie bakeoffem.

## Tabela decyzji

| # | Konstrukt / sytuacja źródłowa | Decyzja docelowa (zamrożona) | Uzasadnienie / pułapka | Źródło werdyktu |
|---|---|---|---|---|
| R1 | *(np. dict źródła)* | *(np. `Map` vs obiekt — wybierz jedno)* | *(dlaczego; co się psuje przy drugim)* | Krok 1 / bakeoff |
| R2 | *(obsługa błędów: wyjątki źródła)* | *(Result/throw — jedno)* | | |
| R3 | *(null/undefined/None)* | | | |
| R4 | *(async/współbieżność)* | | | |
| R5 | *(nazewnictwo: snake_case → ?)* | | | |
| R6 | *(importy / granice modułów)* | | | |
| R7 | *(liczby / precyzja / daty)* | | | |

## Gap inventory (osobna, płaska tabela)

Każde miejsce, gdzie **język docelowy wymaga czegoś, czego źródłowy nie miał** — audyt, nie kod.

| # | Plik:linia | Luka (czego brakuje w źródle) | Reguła z Rulebooka, która to pokrywa |
|---|---|---|---|
| G1 | | *(np. jawny typ zwracany)* | R? |
| G2 | | *(np. jawna obsługa błędu)* | R? |

## Zasady utrzymania

- **Decyzja rozstrzygnięta raz** — nie renegocjuj per-plik; zmiana reguły = zmiana **globalna**.
- **Powtarzalna porażka → poprawka reguły**, nie N łatek (patrz „napraw proces, nie instancję").
- Rulebook zamrażamy **przed** fan-outem (Krok 3); po nim zmiana reguły to świadoma, globalna decyzja
  (i potencjalny re-run dotkniętych jednostek).
