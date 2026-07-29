Bundle urósł o 1.33 MB, z czego 1.19 MB to sześć zależności dodanych w tym tygodniu — i połowa z nich duplikuje coś, co już było w projekcie.

## Skąd przyrost

| co | kB (min, pre-gzip) | commit |
|---|---|---|
| moment + 137 locale | 520.0 | 3f70b81 |
| chart.js | 412.8 | e91c4a2 |
| xlsx | 142.9 | a12d9ee |
| lodash (pełny import) | 71.5 | 7c05f13 |
| papaparse | 44.2 | a12d9ee |
| **razem nowe zależności** | **1191.4** | |

Reszta (~140 kB) to kod z tych commitów (428 nowych linii) plus `react-chartjs-2`, którego raport nie wylistował osobno. Uwaga na marginesie do samego raportu: `xlsx` i `papaparse` nie mają w nim znacznika „NEW this week", choć `git log` pokazuje, że weszły 27.07 — znaczniki w raporcie są niekompletne, licz z gita.

## Trzy duplikaty

- **moment (520 kB) obok date-fns (19 kB).** date-fns już był i jest tree-shaken. moment doszedł do formatowania dat w tooltipach wykresu — 38 linii. 137 locale wchodzi implicite: moment ciągnie cały katalog, jeśli build ich nie odetnie.
- **chart.js (413 kB) obok recharts (186 kB).** Dwie biblioteki wykresów. DashboardPage na chart.js, ReportsPage na recharts. 599 kB na jedną funkcję.
- **lodash pełnym importem (71.5 kB)** dla dwóch funkcji: `groupBy` i `sortBy`.

## Co to przepuściło

- `vite.config.ts` ma `chunkSizeWarningLimit: 2500` — ostrzeżenie o rozmiarze chunka nie odpali nawet przy 2.14 MB. Żaden commit z tego tygodnia nie ruszał tego pliku, więc limit był podniesiony wcześniej; nie wiem kiedy ani po co.
- Brak `manualChunks` i brak dynamicznych importów — wszystko ląduje w jednym entry chunku, w tym `xlsx` + `papaparse` (187 kB) potrzebne wyłącznie na ExportPage.

Ten drugi punkt tłumaczy Lighthouse lepiej niż sam rozmiar. Gzip to 664 kB, transfer nie jest tu głównym problemem — 61 to koszt parsowania i wykonania 2.1 MB JS-a na starcie, na każdej podstronie, nawet jeśli user nigdy nie wejdzie w eksport.

## Robię bez pytania (oczywisty default)

- moment → date-fns, te same formaty tooltipów: **−520 kB**
- lodash → import per-metoda (`lodash/groupBy`, `lodash/sortBy`): **−65 kB**
- `chunkSizeWarningLimit` z powrotem na 500

## Decyzja 1 — która biblioteka wykresów zostaje

**A. Zostaje recharts, DashboardPage przepisany — rekomendacja.** Kosztuje: przepisanie ~214 linii wykresów sprzedaży. Daje: −413 kB i jedno API wykresów w całej apce. Wybieram to, bo recharts siedzi w projekcie dłużej, a kod Dashboardu ma tydzień — taniej przepisać świeży.

**B. Zostaje chart.js, ReportsPage przepisany.** Kosztuje: przepisanie wykresów w raportach — nie wiem ilu, ReportsPage nie ma w tym zestawie plików. Daje: −186 kB.

**C. Zostają obie, każda lazy per route.** Kosztuje: nic teraz. Daje: 0 kB z bundla całkowitego, ale zdejmuje 599 kB ze startowego. Dług zostaje i wróci.

## Decyzja 2 — jak daleko idziemy

**1. Tylko szybkie wygrane.** moment, lodash, jedna biblioteka wykresów. 2.14 MB → ~1.14 MB. Pół dnia. Bierz to, jeśli klient ma dostać odpowiedź dziś.

**2. + code splitting per route — rekomendacja.** Dodatkowo lazy ExportPage (xlsx, papaparse) i lazy trasy z wykresami. Startowy chunk ~770 kB, czyli poniżej stanu sprzed tygodnia. Dzień do półtora.

**3. + budżet rozmiaru w CI.** `rollup-plugin-visualizer` plus twardy limit na entry chunk, PR na czerwono przy przekroczeniu. Dodatkowe ~2h i jedyna z trzech pozycji, która sprawia, że nie wracamy do tej rozmowy za miesiąc.

Rekomendacja: 2 teraz, 3 doklejone do tego samego PR-a, jeśli znajdziesz te 2h.

## Zastrzeżenia

Liczby po naprawie są szacunkowe — nie odpalałem builda, liczę z tabeli w raporcie. Powrót Lighthouse'a zakładam w okolice 80, ale to najsłabsza liczba w całej tej odpowiedzi: wynik zależy też od TTFB, obrazków i fontów, których w tych plikach nie widzę.

Stan: sama analiza, żadnego pliku nie zmieniałem. Pełny rozkład 40 pozycji mam otwarty — powiedz, który wycinek pokazać.

Osobna sprawa, nie mieszam jej do powyższego: `xlsx@0.18.5` z npm to porzucona dystrybucja SheetJS z niezałatanymi CVE (prototype pollution, ReDoS) — utrzymywana wersja jest poza npm. Sprawdzić to jako oddzielny wątek?

Czekam na dwie rzeczy: **A/B/C** (wykresy) i **1/2/3** (zakres).
