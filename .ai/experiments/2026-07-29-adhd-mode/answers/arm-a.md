## Co się stało

Sześć nowych zależności z tego tygodnia to ~1190 kB z 1330 kB przyrostu — **90%**. Reszta to kod aplikacji z DashboardPage i ExportPage.

| zależność | kB (min) | commit |
|---|---|---|
| chart.js | 412.8 | e91c4a2 — Marta, wykresy na stronie głównej |
| moment | 288.4 | 3f70b81 — Marta, daty w tooltipach |
| moment/locale/* (137 lokalizacji) | 231.6 | ↑ wciągnięte niejawnie |
| xlsx | 142.9 | a12d9ee — Piotr, eksport |
| lodash (pełny import) | 71.5 | 7c05f13 — Marta, groupBy/sortBy |
| papaparse | 44.2 | a12d9ee — Piotr, eksport |

Trzy rzeczy zrobiły najwięcej szkody, każda z innego powodu:

1. **moment + 137 lokalizacji = 520 kB weszło po to, żeby sformatować daty w tooltipach** (3f70b81). `date-fns` jest już w bundlu i jest tree-shakowany — 19.2 kB zamiast 520. To 39% całego przyrostu za funkcję, którą już macie.
2. **chart.js (412.8 kB) siedzi na stronie głównej.** DashboardPage jest na ścieżce krytycznej pierwszego renderu, więc to nie jest tylko waga bundla — to bezpośrednio LCP/TBT. Stąd 61 zamiast 94.
3. **Nic nie jest dzielone.** Brak `manualChunks` i brak dynamicznych importów → xlsx + papaparse (187 kB) ładują się każdemu, kto wejdzie na stronę główną, choć używa ich wyłącznie ExportPage.

Do tego stan zastany: **recharts (186.3 kB) nadal jest w bundlu**, bo używa go ReportsPage. Macie w projekcie dwie biblioteki do wykresów naraz.

Dlaczego nikt tego nie złapał: `vite.config.ts` ma `chunkSizeWarningLimit: 2500` — próg ostrzeżenia stoi powyżej obecnych 2141 kB. Build nie miał jak krzyknąć.

Dwie rzeczy, które sprawdziłem i które nie są przyczyną: commit 0d4c1a7 („aktualizacja zależności", 892 linie lock-a) nie dorzuca nic do rozkładu rozmiarów. I drobiazg do poprawienia w narzędziu, nie w kodzie: `bundle-report.txt` oznacza jako „NEW this week" tylko wiersze 1–4, ale xlsx i papaparse też weszły w tym tygodniu (a12d9ee, 27.07). Etykiety w tym raporcie nie są kompletne.

## Co robię bez pytania

Rutyna, każde odwracalne jednym rewertem:

- **moment → date-fns** w tooltipach Dashboardu. **−520 kB.** date-fns już jest, API pokrywa formatowanie z 3f70b81.
- **lodash → importy nazwane** (`import groupBy from 'lodash/groupBy'`) albo natywne odpowiedniki — `aggregate.ts` to 52 zmienione linie, czyli kilka funkcji. **−~70 kB.**
- **ExportPage → `React.lazy` + dynamiczny import xlsx/papaparse.** **−187 kB** z chunka wejściowego, zero zmiany zachowania.
- **ReportsPage → `React.lazy`.** **−186 kB** z chunka wejściowego.
- **`chunkSizeWarningLimit` z 2500 na 600**, żeby następny taki tydzień zapalił się już na buildzie.

To schodzi z 2.14 MB do **~1.18 MB** chunka wejściowego. Bez decyzji poniżej.

## Decyzja, która jest Twoja: wykresy

Te 1.18 MB kontra 812 KB sprzed tygodnia — różnica to prawie dokładnie chart.js (412.8 kB). Jest na stronie głównej, więc lazy-load go nie ratuje. Bez rozstrzygnięcia wykresów nie wracacie do stanu wyjściowego, wracacie do „lepiej niż było".

**A — REKOMENDACJA: zostaje chart.js, recharts wypada.** ReportsPage przechodzi na chart.js, a import chart.js rejestruje tylko używane kontrolery zamiast `chart.js/auto`.
- Kupuje: −186 kB (recharts znika z repo na stałe) plus prawdopodobnie 150–250 kB z samego chart.js. Jedna biblioteka do wykresów w projekcie.
- Kosztuje: przepisanie wykresów w ReportsPage.
- Niepewność, którą muszę nazwać: nie widziałem DashboardPage.tsx, więc 412.8 kB interpretuję jako `chart.js/auto`. Jeśli import już jest selektywny, ta druga oszczędność jest zerowa i A traci przewagę nad C. Sprawdzenie to jeden build.

**B — zostaje recharts, chart.js wypada.** DashboardPage przechodzi na recharts.
- Kupuje: **−412.8 kB pewne**, bez żadnych założeń. Ścieżka krytyczna dostaje 186 kB zamiast 412.
- Kosztuje: przepisanie strony, którą Marta napisała wczoraj (214 linii). Za to ma ją świeżo w głowie — teraz to przepisanie jest najtańsze, jakie kiedykolwiek będzie.

**C — zostają obie, tylko route-split.** Czyli sama rutyna z sekcji wyżej, nic ponad to.
- Kupuje: godzinę pracy zamiast dnia, zero ryzyka regresji na wykresach.
- Kosztuje: 412.8 kB chart.js zostaje na stronie głównej na stałe, dwie biblioteki do wykresów w repo na zawsze, i Lighthouse nie wraca do 94.

## Mam pod ręką, jak chcesz

- pełną tabelę 40 zależności z rozbiciem na wejściowy vs lazy po każdym kroku
- przypisanie przyrostu do poszczególnych commitów, gdyby przydało się na retro
- szkic odpowiedzi dla klienta — przyczyna zidentyfikowana, poprawka w tym tygodniu, bez wchodzenia w to, kto co dodał
