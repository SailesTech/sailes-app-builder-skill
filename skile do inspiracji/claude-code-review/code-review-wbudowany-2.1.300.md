# Wbudowany `/code-review` w Claude Code 2.1.300 — struktura przepisu

Streszczenie odtworzone z tekstu przepisu w binarce 2.1.300 (2026-10-26). Cytaty krótkie i
dosłowne, reszta własnymi słowami. Wywołanie: `/code-review [low|medium|high|xhigh|max|ultra]
[--fix] [--comment] [<pr#>|<branch>|<path>] [--max-findings <n>|all]`, alias `/review`.

## Poziomy wysiłku

| Poziom | Cel | Przebieg | Limit wyników |
|---|---|---|---|
| `low` | — | 1 przebieg po diffie, bez weryfikacji, bez podagentów, bez czytania całych plików; pomija pliki testów/fixture | 4 (lub `min(plików, 4)`) |
| `medium` | **precyzja** — „every finding you surface should be one a maintainer would act on” | 8 kątów × do 6 kandydatów → weryfikator 1 głos | 8 |
| `high` | **kompletność** — „catching real bugs matters more than avoiding false positives” | 8 kątów × 6 → weryfikator 1 głos, nastawiony na zachowanie | 10 |
| `xhigh` / `max` | kompletność — „a missed bug ships” | 10 kątów × do 8 → weryfikator → **zamiatanie luk** | 15 |
| `ultra` | wieloagentowe review w chmurze (osobna, płatna ścieżka uruchamiana przez użytkownika) | — | — |

Brak narzędzia do podagentów → ten sam przepis w jednym kontekście, kąt po kącie, z
obowiązkowym zdaniem w raporcie, że był to przebieg jednokontekstowy, „so whoever reads it
isn't misled about what actually ran”.

## Faza 0 — diff

`git diff @{upstream}...HEAD` plus `git diff HEAD` (zmiany zacommitowane i nie), w braku
upstreamu `main...HEAD` / `HEAD~1`, albo cel podany w argumencie.

## Faza 1 — kandydaci z niezależnych kątów (każdy kąt = osobny podagent)

Poprawność (medium/high: A–C; xhigh/max: A–E):

- **A. Linia po linii** — każdy hunk, potem cała funkcja otaczająca: błędy w niezmienionych
  liniach dotkniętej funkcji są w zakresie. Pytanie do każdej linii: jakie wejście, stan,
  czas albo platforma czyni ją błędną? (odwrócony warunek, off-by-one, null, brak `await`,
  falsy-zero, kopiuj-wklej złej zmiennej, połknięty błąd w `catch`, nieescapowany regex).
- **B. Audytor usuniętego zachowania** — dla każdej usuniętej/zastąpionej linii nazwij
  niezmiennik, który pilnowała, i znajdź, gdzie nowy kod go przywraca. Brak = kandydat
  (usunięty guard, zgubiona ścieżka błędu, zawężona walidacja, skasowany test).
- **C. Śledzenie między plikami** — wywołujący każdej zmienionej funkcji (Grep po symbolu):
  nowy warunek wstępny, inny kształt zwrotki, nowy wyjątek, zależność od kolejności. Także
  wywoływani: czy równoległa zmiana w tym samym PR czyni wywołanie niebezpiecznym.
- **D. Pułapki języka** — JS falsy-zero, `==`, domknięcie zmiennej pętli; Python mutable
  default; Go zapis do nil-mapy; SQL injection; strefy czasowe/DST; równość floatów.
- **E. Poprawność wrapperów/proxy** — cache/proxy/dekorator/adapter: każda metoda trafia do
  opakowanej instancji, nie z powrotem przez rejestr/sesję/global; wrapper przekazuje
  wszystkie metody, których używają wywołujący.

Porządki (cleanup):

- **Reuse** — nowy kod duplikuje istniejący helper; Grep po modułach wspólnych i sąsiednich,
  nazwij helper.
- **Simplification** — zbędny lub wyprowadzalny stan, kopiuj-wklej z drobną różnicą, głębokie
  zagnieżdżenie, martwy kod; nazwij prostszą formę.
- **Efficiency** — powtórzone I/O, niezależne operacje po kolei, blokująca praca na starcie
  albo gorącej ścieżce, długowieczne obiekty z domknięć trzymające cały zakres.

Oraz:

- **Altitude** — czy zmiana naprawia przyczynę na właściwej głębokości, a nie plastruje
  objaw; „special cases layered on shared infrastructure are a sign the fix isn't deep
  enough” — nazwij ogólniejszą zmianę mechanizmu.
- **Conventions (CLAUDE.md)** — CLAUDE.md użytkownika, repo i każdego katalogu-przodka
  zmienionego pliku; „only flag a violation when you can quote the exact rule and the exact
  line that breaks it”. Brak CLAUDE.md → kąt nic nie zwraca.

Kąty porządkowe w `failure_scenario` podają konkretny koszt zamiast awarii. Przy cięciu do
limitu poprawność zawsze wygrywa z porządkami.

Finderzy mają przepuszczać każdego kandydata z nazwalnym scenariuszem awarii — „finders that
silently drop half-believed candidates bypass the verify step”.

## Faza 2 — weryfikacja (jeden weryfikator na kandydata)

Najpierw deduplikacja (ten sam defekt, miejsce, powód → zostaje ten z najkonkretniejszym
scenariuszem). Każdy kandydat dostaje **jednego weryfikatora** (diff + pliki + kandydat),
który zwraca dokładnie jedno:

- **CONFIRMED** — umie nazwać wejście/stan i błędny wynik; cytuje linię.
- **PLAUSIBLE** — mechanizm prawdziwy, wyzwalacz niepewny (czas, środowisko, konfiguracja);
  mówi, co by to potwierdziło.
- **REFUTED** — nieprawda (kod tego nie mówi) albo obsłużone gdzie indziej; cytuje linię.

Na `high`+ domyślnie PLAUSIBLE: nie odrzucać za „spekulatywne” przy realistycznym stanie
(wyścigi, null na rzadkiej ścieżce, falsy-zero, off-by-one na granicy, częściowe awarie,
allowlista bez kotwicy). REFUTED tylko konstruktywnie: zacytowana linia, dowód
niemożliwości z typu/stałej/niezmiennika, guard w tym diffie albo czysty styl bez efektu.
Zostają CONFIRMED i PLAUSIBLE.

## Faza 3 — zamiatanie luk (xhigh/max)

Jeden świeży finder z listą zweryfikowanych szuka **wyłącznie** brakujących defektów:
przeniesiony kod, który zgubił guard; dataclass default liczony raz; niedeterminizm `hash()`;
zawężony zakres locka; predykaty ze skutkami ubocznymi; asymetria setup/teardown w testach;
odwrócone domyślne wartości konfiguracji. Do 8 nowych, „if nothing new, return an empty
sweep — do not pad”.

## Wynik

Lista uszeregowana od najpoważniejszego, każdy wpis: `file`, `line`, `summary` (jedno
zdanie), `short_summary` (≤ 60 znaków), `failure_scenario` („concrete inputs/state → wrong
output/crash”), `category` (`correctness`, `simplification`, `efficiency`, `reuse`,
`altitude`, `conventions`, `test-coverage`…), `verdict` gdy była weryfikacja. Raport przez
narzędzie `ReportFindings`; pusta lista, gdy nic nie przeżyło. `--fix` stosuje poprawki i
raportuje ponownie z `outcome`: `fixed` / `skipped` / `no_change_needed`.
