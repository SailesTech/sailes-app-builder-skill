# Bundle 812 KB → 2.14 MB

**90% przyrostu to cztery pozycje, wszystkie z tego tygodnia. Największa z nich — 520 kB — to
czysty błąd, nie koszt funkcji: `moment` z 137 lokalizacjami dodany do projektu, w którym
`date-fns` już był i już działał.** Sam fix konfiguracyjny + usunięcie `moment` schodzi poniżej
stanu sprzed tygodnia, bez ruszania jakiejkolwiek funkcjonalności.

---

## Na telefon — jedno zdanie, gotowe do przeczytania

> „W ciągu tygodnia weszły cztery rzeczy naraz: druga biblioteka wykresów obok tej, którą już
> mieliśmy, biblioteka do dat ważąca pół megabajta przy już obecnej lżejszej, eksport XLSX
> ładowany na każdej stronie zamiast tylko na swojej, i pełny import lodash. Build nie miał
> ustawionego progu ostrzegania, więc przez tydzień nic nie zaprotestowało. To 90% przyrostu.
> Wracamy poniżej stanu sprzed tygodnia — bez usuwania funkcji."

Liczba, którą warto mieć w głowie: **initial load wraca do ~770 kB (z 2 142 kB), czyli niżej niż
812 kB sprzed tygodnia.** Sama konfiguracja + `moment`, bez decyzji o wykresach.

---

## DECYZJA 1 — narracja na rozmowie (Twoja, mam godzinę mniej niż Ty)

**Rekomendacja: Opcja 1.**

**Opcja 1 — „wiemy dokładnie co, mamy fix, oto termin".** Nazywasz przyczynę, dajesz liczbę,
dajesz datę.
Kosztuje: przyznajesz, że tydzień szedł bez kontroli rozmiaru builda.
Kupuje: wiarygodność i kontrolę nad narracją — klient dostaje termin zamiast diagnozy, a Ty nie
wracasz do tematu za tydzień.

**Opcja 2 — „to koszt nowych funkcji, optymalizujemy".**
Kosztuje: jest częściowo nieprawdziwa i sprawdzalna. 520 kB na `moment` przy obecnym `date-fns`
nie jest kosztem żadnej funkcji, a klient ma ten sam raport co Ty. Jeśli ktoś po jego stronie
spojrzy — tracisz więcej, niż zyskałeś dziś.
Kupuje: mniej defensywną rozmowę w ciągu najbliższej godziny.

**Opcja 3 — „damy odpowiedź jutro".**
Kosztuje: tydzień ciszy plus kolejny dzień, przy kliencie, który zauważył sam.
Kupuje: nic, czego nie masz już teraz — fixu i tak nie zdążysz wdrożyć przed rozmową.

---

## Co się stało — liczby

Przyrost: 2 141,7 − 812 = **1 329,7 kB**.

| Pozycja | kB | % przyrostu | Commit |
|---|---:|---:|---|
| `moment` + 137 lokalizacji (implicit) | 520,0 | 39% | `3f70b81` — formatowanie dat w tooltipach, 38 linii |
| `chart.js` — **druga** biblioteka wykresów | 412,8 | 31% | `e91c4a2` — wykresy na dashboardzie, 214 linii |
| `xlsx` + `papaparse` — ładowane eager | 187,1 | 14% | `a12d9ee` — eksport XLSX/CSV, 176 linii |
| `lodash` — pełny import | 71,5 | 5% | `7c05f13` — groupBy/sortBy, 52 linie |
| **razem** | **1 191,4** | **90%** | |
| nieprzypisane | ~138 | 10% | patrz „czego nie ustaliłem" |

Trzy rzeczy, które ta tabela mówi, a których nie widać po nazwach:

1. **`date-fns` (19,2 kB) już jest w projekcie i jest tree-shaken** — wiersz 10 raportu. `moment`
   wszedł obok niego, żeby sformatować daty w tooltipie. 520 kB za coś, co robi 19 kB już obecne.
   To jedyna pozycja, której nie da się obronić jako „koszt funkcji".
2. **`recharts` (186,3 kB) nadal jest w buildzie** i nadal używany przez `ReportsPage`. Nikt nie
   usunął starej biblioteki, dokładając nową. Płacicie za obie: **599 kB na dwa sposoby rysowania
   wykresu.**
3. **Nic nie jest dzielone na chunki.** `vite.config.ts` nie ma `manualChunks` ani dynamicznych
   importów — wszystko ląduje w jednym entry chunku. Efekt: użytkownik, który wchodzi na listę,
   pobiera `xlsx`, `papaparse`, `chart.js` i `recharts`, mimo że nie otworzy żadnej z tych stron.

**Dlaczego nikt tego nie złapał przez tydzień:** `chunkSizeWarningLimit: 2500` w `vite.config.ts`
przy domyślnym progu Vite 500. Build nie miał jak ostrzec — 2 142 kB mieści się pod limitem.
Uwaga: w logu z tego tygodnia nie ma zmiany `vite.config.ts`, więc ten próg **nie** został
podniesiony po to, żeby ukryć ten przyrost. Był tam wcześniej. To nie jest niczyj błąd z tego
tygodnia, to brakująca bramka.

---

## Plan

**Tier 1 — dziś/jutro, zero decyzji, zero zmian w funkcjonalności.** To jest to, co obiecujesz
na rozmowie.

| # | Zmiana | Zysk | Ryzyko |
|---|---|---:|---|
| 1 | `moment` → `date-fns` (już obecny), 38 linii w `DashboardPage` | −520,0 kB | minimalne |
| 2 | `lodash` → importy per-metoda (`lodash/groupBy`) lub `lodash-es`, 52 linie w `src/lib/aggregate.ts` | ~−65 kB | minimalne |
| 3 | `React.lazy` na `DashboardPage` / `ReportsPage` / `ExportPage` + `manualChunks` na vendor | ~786 kB **znika z entry** (nie z totala) | niskie, wymaga sprawdzenia routingu |
| 4 | `chunkSizeWarningLimit` 2500 → 500 + budżet rozmiaru w CI | 0 kB, ale to jedyna pozycja, która sprawia, że to się nie powtórzy | zero |

Po Tier 1: **total ~1 557 kB, initial load ~770 kB** — poniżej 812 kB sprzed tygodnia.

Punkt 4 jest ważniejszy niż jego zysk w kilobajtach. Bez niego naprawiacie ten sam problem za
kwartał; z nim build przestaje przepuszczać takie zmiany po cichu. To jedyna zmiana z tej listy,
którą warto opisać klientowi jako „zmiana procesu", a nie „poprawka".

**Tier 2 — po decyzji, 2–4 dni.**

- Jedna biblioteka wykresów zamiast dwóch: **−186 kB** albo **−413 kB** (patrz decyzja 2).
- `xlsx` (142,9 kB) — po Tier 1 już nie jest w entry chunku, więc to przestaje być pilne.
  Docelowo: generowanie po stronie serwera zdejmuje te 143 kB z klienta całkowicie.

**Zrobiłem za Ciebie te wybory, bo nie są decyzjami** (mów, jeśli któryś ma wrócić na stół):
`date-fns` zamiast lżejszej alternatywy dla `moment` — bo już jest w projekcie; split po
route'ach zamiast po komponentach — bo granice są oczywiste i pokrywają się ze stronami; próg
500 kB zamiast dowolnego innego — bo to domyślny próg Vite i nie trzeba go uzasadniać.

---

## DECYZJA 2 — która biblioteka wykresów zostaje

**Nie rekomenduję żadnej, bo nie mam kodu wykresów — mam tylko rozmiary.** Zamiast zgadywać,
proponuję pomiar, który zamyka temat w pół godziny:

> **Marta sprawdza, czy wykresy z `DashboardPage` (214 linii, `chart.js`) dają się odtworzyć w
> `recharts`, który już jest w projekcie.** Jeśli tak → Opcja B. Jeśli któryś typ wykresu albo
> interakcja nie ma odpowiednika → Opcja A.

**Opcja A — zostaje `chart.js`, wypada `recharts`** (−186,3 kB). Przepisujesz `ReportsPage`.
Kosztuje: więcej pracy, mniejszy zysk. Kupuje: 214 świeżych linii Marty zostaje nietkniętych.

**Opcja B — zostaje `recharts`, wypada `chart.js`** (−412,8 kB). Przepisujesz `DashboardPage`.
Kosztuje: cofasz najnowszy kod, tydzień po jego napisaniu — to koszt też ludzki, nie tylko
godzinowy. Kupuje: dwa razy większy zysk i biblioteka, którą zespół już zna.

**Opcja C — obie zostają, tylko lazy-load per route** (0 kB z totala, ale obie znikają z entry).
Kosztuje: dług zostaje, dwie biblioteki do utrzymania. Kupuje: nic ponad to, co Tier 1 i tak
robi — więc to nie tyle opcja, co „nie decyduj teraz". Ważne: **to jest wystarczające na tę
rozmowę.** Decyzję A/B możesz podjąć w przyszłym tygodniu bez straty.

---

## Czego nie ustaliłem

1. **~138 kB przyrostu (10%) nie umiem przypisać** z tych czterech plików. Kandydaci:
   `react-chartjs-2` (jest w `package.json`, ale **nie ma go w 40-wierszowym raporcie** — więc
   raport nie jest wyczerpujący i moje liczby są dolnym oszacowaniem), ~480 nowych linii kodu
   aplikacji, oraz `0d4c1a7 chore: aktualizacja zależności` (892 linie w lockfile, brak
   informacji co się zmieniło).
2. **Raport oznacza jako „NEW this week" tylko wiersze 1–4**, ale `git-log` pokazuje, że `xlsx`
   i `papaparse` doszły w `a12d9ee` też w tym tygodniu. Albo adnotacja w raporcie jest
   niepełna, albo paczki były wcześniej w `package.json` i dopiero teraz zostały zaimportowane.
   Nie zmienia to fixu, zmienia jedno zdanie w narracji — nie mów klientowi „trzy nowe
   biblioteki", mów „cztery pozycje".
3. **Nie widziałem trace'u Lighthouse, tylko wynik 94 → 61.** 664 kB gzip JS-a na ścieżce
   krytycznej wyjaśnia taki spadek z dużym zapasem (TBT/LCP), ale nie zweryfikowałem, że nie
   doszło nic poza bundlem — np. z `0d4c1a7`. Jeśli po Tier 1 wynik nie wróci powyżej ~85,
   przyczyna jest jeszcze jedna i trzeba obejrzeć trace.
4. **Oszczędności podaję w kB po minifikacji, przed gzipem** — tak jak raport. Klient widzi
   transfer, czyli gzip. Współczynnik z linii total raportu to ~0,31, więc 520 kB `moment` to
   ~161 kB u klienta, a docelowe 770 kB entry to ~239 kB. Ten współczynnik jest wyliczony z
   totala, nie zmierzony per-zależność — traktuj jako przybliżenie.
5. **`xlsx@^0.18.5` — sprawdź przed rozmową, jeśli temat wypłynie.** Ta linia wersji ma znane
   CVE (prototype pollution / ReDoS), a poprawione wydania SheetJS przeniósł poza npm. Mówię to
   z pamięci i **tego nie zweryfikowałem** — nie wchodź z tym do klienta bez sprawdzenia. Jeśli
   się potwierdzi, zmienia to priorytet punktu „xlsx po stronie serwera" z optymalizacji na
   bezpieczeństwo.

---

Pełna tabela 40 zależności — w `evals/fixtures/adhd-mode/bundle-report.txt`, wierszami, które coś
zmieniają, są 1–4, 10, 37, 38, 39 i trzy notatki pod tabelą. Reszta to stan sprzed tygodnia i
nie ruszałbym jej teraz.
