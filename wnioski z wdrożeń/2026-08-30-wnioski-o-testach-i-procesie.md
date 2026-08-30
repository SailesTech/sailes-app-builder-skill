# Wnioski po sesji 2026-08-30 — które testy są zasadne, a które nie

Adresat: agent prowadzący skill `sailes`. Materiał: jedna sesja, jeden defekt, pełny łańcuch
diagnoza → spec → brama → implementacja. Wszystkie liczby zmierzone w tej sesji.

---

## 1. Najważniejsze ustalenie: problemem nie był brak testów, tylko ich POWIERZCHNIA

Funkcja („ekran czekania na deala", spec `2026-08-29-wyscig-wejscia-na-link-oferty.md`) została
wdrożona 2026-08-29 z kompletem: testy jednostkowe, e2e Playwright, brama `qa`.
**Wszystko zielone. Funkcja nie zadziałała u ani jednego klienta.**

Przyczyna: CloudFront zamienia `404` z origin na `200 text/html`. Cała reguła była zapięta na kod
HTTP, który do przeglądarki nie dociera. Testy sprawdzały **origin albo mock**. Żaden nie wysłał
ani jednego żądania na **wdrożony adres**.

Koszt wykrycia po fakcie: jedna komenda.

    curl -s -o /dev/null -w '%{http_code} %{content_type}' \
      https://dev.partners.volubus.com/api/v1/proposal/<nieistniejacy-uuid>

🔴 **Wniosek dla skilla:** dołożenie 44 asercji nie zapobiegłoby temu defektowi. Zapobiegłaby mu
JEDNA sonda kosztująca sekundę. Reguła „każda zmiana ma e2e" była **spełniona i bezużyteczna**,
bo nie mówi PRZECIW CZEMU e2e ma biec.

---

## 2. Klasyfikacja testów według tego, co realnie łapią

### ZASADNE — łapią defekty, których nie widać z kodu

| Test | Dlaczego zasadny | Koszt |
|---|---|---|
| **Sonda na wdrożonym adresie** (status + `Content-Type`) | Jedyna rzecz, która złapałaby jedyny realny defekt produkcyjny tej sesji | 1 komenda |
| **Bajtowa identyczność odpowiedzi** (brak wyroczni) | Własność bezpieczeństwa niewidoczna z kodu; dziś zmierzona `md5` — pięć różnych przyczyn braku, jedno `8543ab98…` | 1 test |
| **Fixture z REALNEGO backendu przez REALNY parser** | Łapie rozjazd BE↔FE, klasę defektów niewidoczną dla obu suit naraz. Nagłówek tej suity wymienia trzy takie, które trafiły na produkcję | średni |
| **Przepisanie 44 asercji `404`** | To NIE ceremonia: kodowały stary kontrakt i poszłyby na czerwono. Ich wcześniejsza inwentaryzacja to jedyny powód, dla którego zmiana nie zostawiła gruzu | wysoki, ale wymuszony |

### WĄTPLIWE — dają fałszywą pewność

| Test | Problem |
|---|---|
| **e2e mockujący dokładnie tę granicę, której dotyczy** (`proposal-states.spec.ts`, `route.fulfill({status: 404})`) | Dowiódł, że front reaguje na 404, którego rzeczywistość nigdy nie dostarcza. **To jest test, który dał fałszywą pewność bramie QA.** Nie bezwartościowy — szkodliwy BEZ pary w postaci sprawdzenia na wdrożonym środowisku |
| **Asercja na obecność wartości domyślnej** | Opisane w `lessons.md:897-916` — przechodzi nad zahardkodowanym literałem |
| **Pokrycie liniowe** | Już zakazane w `AGENTS.md`. Słusznie — trywialnie spełnialne, podnosi pewność wtedy, gdy powinno ją obniżać |

🔴 **Reguła do dopisania w skillu:** *mock granicy jest dowodem na zachowanie kodu, nigdy na
zachowanie systemu. Każdy mock granicy zewnętrznej (CDN, proxy, CRM, płatności) wymaga PARY:
jednego sprawdzenia tej samej granicy na wdrożonym środowisku. Bez pary mock nie jest dowodem —
jest zapisem założenia.*

---

## 3. Gdzie proces zapłacił, a gdzie nie

### Zapłacił: brama pre-implement

Trzy niezależne audyty na czystym kontekście, przed napisaniem linijki kodu. Złapały **cztery
realne defekty specu**:

1. Cały pakiet `test/e2e/proposal/proposal-public-get.e2e-spec.ts` (37 KB, **33 wystąpienia `404`**)
   był poza `Done-when` — a spec w tym samym akapicie krytykował zostawianie czerwonych testów
   „na potem".
2. Dwa testy kodowały założenie „`/proposal` i `/payment-config` dzielą tę samą granicę 404",
   które zmiana łamie celowo — architektoniczne, nie kosmetyczne.
3. Pozycja na mojej liście czerwonych testów była **nieprawdziwa** (serwis w ogóle nietknięty).
4. Brak wymogu unii w typie zwracanym — bez tego implementer mógł przepchnąć zmianę przez `as any`,
   gasząc jedyny działający type-check w repo (`strictNullChecks:false`).

**Bez tej bramy zmiana zostawiłaby 33 czerwone asercje e2e i furtkę na `as any`.** Najlepiej wydany
czas sesji.

### Nie zapłacił: wachlarz agentów przed pierwszą sondą

🔴 **Złamałem regułę własnego skilla.** `sailes-diagnose`, reguła twarda nr 2: *„Run the live case
before you audit code"*. Wysłałem **trzy agenty czytające kod**, zanim wykonałem **jedno `curl`**.
Mechanizm rozstrzygnęło potem sześć komend w minutę.

Agenty nie były bezużyteczne (dały inwentarz ścieżek FE/BE), ale kolejność była odwrócona i to
kosztowało. Sonda najpierw zawęziłaby ich zadania albo uczyniła dwa z trzech zbędnymi.

### Nie zapłacił: rozmiar specu

**365 linii specu na ~50 linii kodu.** Zmiana kontraktu uzasadnia spec, ale nie taki. Osiem
numerowanych sekcji poprawek powstało, bo naprawiałem spec w miejscu zamiast go przepisać.

### Nie zapłacił: dwa spalone zlecenia agentów

- Jedno zginęło razem z procesem, bo trzymało raport w pamięci zamiast pisać na dysk na bieżąco.
- Drugie dostało worktree **złego repozytorium**, bo katalog roboczy został ustawiony na
  `partner-portal-be` po uruchomieniu testów. Błąd dyspozycji leada, nie agenta.

Razem: około jednej trzeciej czasu sesji na czystą stratę, w całości po stronie prowadzącego.

---

## 4. Odpowiedź na zarzut „prosta zmiana nie powinna zajmować 30 minut"

| Składnik | Ocena |
|---|---|
| Sam kod (5 miejsc w BE + 4 pliki FE, ~50 linii) | **kilka minut** — nie tu leży koszt |
| Przepisanie 44 asercji kodujących stary kontrakt | **wymuszone**, nie do wycięcia bez zostawienia czerwonej suity |
| Brama pre-implement | **zapłaciła** — 4 realne defekty |
| Dwa spalone zlecenia agentów | **czysta strata, błąd prowadzącego** |
| Spec 365 linii | **przerost** — uzasadnione byłoby ~100 |

**Zarzut jest częściowo trafny.** Nie z powodu testów jako takich — z powodu straty wygenerowanej
przez prowadzącego i przerostu dokumentu.

---

## 5. Konkretne zmiany do rozważenia w skillu

1. 🔴 **Nowa reguła twarda:** każda reguła zależna od **kodu HTTP, nagłówka lub `Content-Type`** ma
   `Done-when` weryfikowany żądaniem do **wdrożonego środowiska**. Nie do origin, nie do mocka.
   Jedna komenda. To jedyna pozycja z tej listy, która zapobiegłaby dzisiejszemu defektowi.
2. **Reguła parowania mocków** (sekcja 2) — mock granicy zewnętrznej bez pary jest zapisem
   założenia, nie dowodem.
3. **Egzekwowanie kolejności w `sailes-diagnose`**: zakaz wysyłania agentów czytających kod, zanim
   w rejestrze dowodów nie ma **choć jednej** obserwacji z żywego systemu. Reguła istnieje dziś
   jako proza i została złamana przez agenta, który przeczytał ją chwilę wcześniej.
4. **Limit rozmiaru specu proporcjonalny do zmiany** — albo jawne „to poprawka kontraktu, spec ma
   maks. N sekcji". Spec ma zmniejszać ryzyko, nie rosnąć samoistnie.
5. **Brief agenta pisze raport na dysk OD PIERWSZEJ zmiany, nie na końcu.** Dziś uratowało to
   drugie podejście frontu i nie uratowało pierwszego.
6. **Lead sprawdza katalog roboczy przed zleceniem z `isolation: worktree`** — worktree jest
   wycinany względem cwd, więc zlecenie „front" z katalogu backendu daje worktree backendu.
   Kandydat na zapadkę automatyczną, nie na regułę do zapamiętania.

---

## 6. Czego ta sesja NIE dowodzi

- Nie dowodzi, że testów jest za dużo **w ogóle** — dowodzi, że jedna tania kategoria jest
  nieobecna, a jedna obecna daje fałszywą pewność.
- Nie dowodzi, że brama pre-implement jest zbędna — dziś zapłaciła najwyraźniej ze wszystkiego.
- Nie mierzy kosztu w innych sesjach. **To N=1.** Traktować jako hipotezę do potwierdzenia na
  kolejnych sesjach, nie jako ustalony fakt.
