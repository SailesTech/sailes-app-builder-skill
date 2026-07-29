# Co się stało z bundlem

Krótka wersja: **w tym tygodniu doszło ~1,19 MB nowych zależności, a projekt nie ma żadnego code-splittingu — więc wszystko wpadło do jednego chunka, który przeglądarka musi pobrać i sparsować zanim cokolwiek się wyrenderuje.** To nie jest jedna zła decyzja, tylko cztery normalne decyzje w środowisku, które nie miało hamulca.

## Rachunek

Wzrost: 812 KB → 2 141,7 KB = **+1 329,7 KB**. Nowe paczki z tego tygodnia tłumaczą 1 191,4 KB z tego:

| Co doszło | Rozmiar | Commit |
|---|---|---|
| `moment` + wszystkie 137 locale | **520,0 KB** | 3f70b81 (formatowanie dat w tooltipach) |
| `chart.js` | **412,8 KB** | e91c4a2 (wykresy na dashboardzie) |
| `xlsx` | 142,9 KB | a12d9ee (eksport) |
| `lodash` (pełny import) | 71,5 KB | 7c05f13 (`groupBy`/`sortBy`) |
| `papaparse` | 44,2 KB | a12d9ee (eksport) |
| **razem** | **1 191,4 KB** | |

Zostaje **~138 KB niewyjaśnione**. To prawdopodobnie: `react-chartjs-2` (jest w `package.json`, ale nie ma osobnego wiersza w raporcie), przyrost kodu aplikacji (DashboardPage +214 linii, ExportPage +176) oraz commit `0d4c1a7 "chore: aktualizacja zależności"` — 892 linie zmian w `package-lock.json` bez opisu, czego dotyczyły. Tego ostatniego nie da się ocenić z tego, co mam; wart osobnego spojrzenia.

## Cztery konkretne problemy

**1. `moment` — 520 KB za 38 linii formatowania dat.** To najgorszy stosunek kosztu do korzyści w całym zestawie, i to podwójnie: w projekcie **już jest `date-fns`** (19,2 KB, poprawnie tree-shaken — wiersz 10 raportu). Doszła druga biblioteka do dat, robiąca to samo. Do tego `moment` domyślnie wciąga wszystkie 137 locale (231,6 KB samych locale), a sam projekt jest od lat w trybie legacy — autorzy oficjalnie odradzają używanie go w nowych projektach.

**2. Dwie biblioteki do wykresów naraz.** `chart.js` (412,8 KB) na DashboardPage i `recharts` (186,3 KB) na ReportsPage. Razem **599 KB** na to samo zadanie. Nie wiem, czy to była świadoma migracja z recharts na chart.js, która utknęła w połowie, czy po prostu nikt nie sprawdził, co już jest w repo — to pytanie do Marty. Tak czy inaczej, docelowo ma zostać jedna.

**3. `xlsx` + `papaparse` (187 KB) ładowane eagerly na stronie, której prawie nikt nie otwiera.** Eksport to akcja na żądanie. Każdy user płaci 187 KB za funkcję, z której korzysta ułamek z nich, i to zanim zobaczy pierwszy ekran. To podręcznikowy kandydat na dynamiczny import.

**4. `lodash` w pełnym imporcie — 71,5 KB za `groupBy` i `sortBy`.** Raport wprost mówi "full import", więc gdzieś jest `import _ from 'lodash'` zamiast importów nazwanych. To do naprawienia w 10 minut.

## Ale prawdziwa przyczyna jest w `vite.config.ts`

```ts
chunkSizeWarningLimit: 2500,
```

Vite domyślnie ostrzega przy 500 KB. Tutaj próg jest podniesiony do 2 500 KB — czyli build **nie pisnął ani razu** przez cały tydzień, mimo że bundle urósł 2,6×. Alarm był wyłączony, zanim ktokolwiek dodał pierwszą paczkę.

W git-logu z tego tygodnia nie ma zmiany w `vite.config.ts`, więc ten próg został podniesiony wcześniej — warto sprawdzić `git log -- vite.config.ts`, kto i po co to zrobił. Podejrzewam, że kiedyś ktoś podniósł go, żeby uciszyć hałas, i tak zostało.

Drugi element: **brak `manualChunks` i brak jakichkolwiek granic dynamic importu** — wszystko ląduje w jednym entry chunku. Przy 2,14 MB (664 KB gzip) w jednym pliku Lighthouse karze przede wszystkim za Total Blocking Time i LCP, bo parsowanie i wykonanie JS blokuje główny wątek. Stąd 94 → 61. To spadek adekwatny do skali, nie jakaś dodatkowa zagadka.

## Co z tym zrobić — w kolejności opłacalności

**Etap 1 — jeden dzień, bez zmian w architekturze (~660 KB w dół):**

1. **Wyrzucić `moment`, przepisać te tooltipy na `date-fns`**, które już jest w projekcie. −520 KB, ryzyko minimalne (38 linii, jedno miejsce).
2. **`lodash` → importy nazwane** (`import groupBy from 'lodash/groupBy'`) albo `lodash-es`. Przy dwóch funkcjach rozważyłbym w ogóle wyrzucenie zależności — `groupBy` to pięć linii własnego kodu, a `Object.groupBy` jest już natywne w targecie nowszym niż `es2020`. −~70 KB.
3. **Zdjąć `chunkSizeWarningLimit` z powrotem do domyślnych 500** (albo 700, jeśli 500 będzie za ciasne po sprzątaniu). To jest to, co zapobiega powtórce.

**Etap 2 — code-splitting, ~2–3 dni (~600 KB z initial load):**

4. **Lazy-load tras** przez `React.lazy` + `Suspense`, zaczynając od ExportPage (zabiera z initial `xlsx` + `papaparse`, −187 KB) i ReportsPage/DashboardPage (zabiera wykresy, −186 do −413 KB w zależności od trasy).
5. **`build.rollupOptions.output.manualChunks`** — wydzielić stabilny vendor chunk (react, react-dom, react-router, react-query), żeby cache przeglądarki przestał być unieważniany przy każdym deployu.

**Etap 3 — decyzja produktowa, do ustalenia z zespołem:**

6. **Wybrać jedną bibliotekę wykresów.** Rekomendacja: zostać przy `recharts` i usunąć `chart.js` + `react-chartjs-2` — jest o 226 KB lżejsza, jest w projekcie dłużej i ma tylko jeden ekran do przepisania (DashboardPage, 214 linii z ostatniego commitu). Ale to Marta pisała ten dashboard i może mieć powód, dla którego recharts nie wystarczał — zapytaj, zanim to zaplanujemy. Odwrotny kierunek (migracja ReportsPage na chart.js) też zamyka temat, tylko drożej.
7. Przy okazji: **`framer-motion` to 98,7 KB** — nie jest nowe i nie jest przyczyną tego regresu, ale jeśli używacie z tego dwóch animacji, warto sprawdzić, czy się opłaca.

Po Etapach 1–2 initial chunk powinien wylądować w okolicy **750–950 KB** (z 2 141 KB), a po Etapie 3 wyraźnie **poniżej wyjściowych 812 KB** — bo eksport i wykresy przestaną być w ścieżce startowej w ogóle.

**I jedna rzecz, żeby to się nie powtórzyło:** dodać do CI bramkę na rozmiar bundla (`size-limit` albo prosty krok, który wywala build, gdy entry chunk przekroczy próg). Bez tego ten sam scenariusz wróci za trzy miesiące — bo żaden z tych czterech commitów nie był błędem sam w sobie. Każdy dodawał sensowną funkcję. Zabrakło tylko sygnału, że łącznie przekraczają budżet.

## Osobno: `xlsx@0.18.5` — sprawdź to

Ta wersja SheetJS ma znane podatności (m.in. prototype pollution, CVE-2023-30533, i ReDoS, CVE-2024-22363). Poprawki są w 0.19.3+ / 0.20.2+, ale projekt przestał publikować na npm — `xlsx` na npm stoi na 0.18.5, więc `npm update` tego **nie** naprawi. Trzeba albo wziąć nowszą wersję z `cdn.sheetjs.com`, albo przejść na alternatywę (`exceljs`). Odpal `npm audit` i potwierdź; wpadło mi w oko przy okazji, nie jest częścią tego zgłoszenia, ale nie chcę tego zostawiać niezgłoszonego.

## Czego nie sprawdziłem

Miałem tylko raport bundla, git-log, `package.json` i `vite.config.ts` — nie widziałem kodu źródłowego. Zanim to zaplanujemy na serio, chciałbym zerknąć na:

- **jak dokładnie jest importowany `lodash`** — czy to jeden `import _ from 'lodash'`, czy kilka miejsc,
- **czy `moment` faktycznie siedzi tylko w tooltipach** DashboardPage, czy rozlał się dalej po commicie 3f70b81,
- **co było w commicie `0d4c1a7`** (892 linie w lockfile bez opisu) — to jedyny kawałek wzrostu, którego nie umiem wyjaśnić,
- **czy DashboardPage i ExportPage nie są importowane statycznie z jakiegoś wspólnego miejsca** (np. barrel file albo `Header.tsx` z commitu 5e3b902) — jeśli tak, samo `React.lazy` nie wystarczy i splitting nie zadziała.

## Co powiedzieć klientowi

Sugerowałbym coś w tym duchu — bez zrzucania winy na zespół, bo to naprawdę była luka w procesie, nie czyjś błąd:

> W ostatnim tygodniu wdrożyliśmy trzy funkcje, o które prosiliście: wykresy sprzedaży na dashboardzie, eksport do XLSX/CSV i formatowanie dat na wykresach. Każda z nich dołożyła zewnętrzne biblioteki, a nasz build nie miał ustawionego limitu, który by nas o tym ostrzegł — w efekcie aplikacja zaczęła pobierać znacznie więcej kodu przy pierwszym wejściu, co obniżyło wynik Lighthouse. Funkcje działają poprawnie, to kwestia wydajności ładowania, nie poprawności. Mamy zdiagnozowaną przyczynę i plan naprawy: pierwszą część wdrażamy w tym tygodniu, całość w ciągu dwóch. Dokładamy też automatyczną kontrolę rozmiaru w CI, żeby taka sytuacja nie mogła się powtórzyć niezauważona.

Daj znać, czy mam zacząć od Etapu 1 — te trzy punkty są bezpieczne i mogę je zrobić od ręki, bez czekania na decyzję w sprawie wykresów.
