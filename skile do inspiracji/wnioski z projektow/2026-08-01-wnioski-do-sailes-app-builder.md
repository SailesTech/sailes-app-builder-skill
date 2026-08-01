# Wnioski do `sailes-app-builder` i do harnessu — 2026-08-01

**Kontekst przebiegu:** domknięcie całego kamienia M1c (pola niestandardowe) w jeden dzień —
siedem faz plus bramka, **dwanaście powołań wykonawców**, dwa scalenia do `main`. Stan końcowy:
`pnpm check` 353→**578**, `pnpm test:integration` 597→**716**, macierz uprawnień 114→**150**,
migracje `0000`–`0035`.

**Maszyna padła pięć razy** (sterowniki, WebStorm, błąd API agenta, Docker Desktop ×2). To nie jest
tło — to jest warunek brzegowy, który ukształtował połowę wniosków niżej.

Poprzednie zestawy: `2026-07-30-…md`, `2026-07-31-…md`. Ten nie powtarza ich treści.

---

## 1. NAJWAŻNIEJSZY: `Done-when` fazy musi pokrywać jej własną listę WOLNO

**Zmierzone trzy razy w jednym kamieniu, za każdym razem tą samą drogą.**

| Luka | Co obiecywał spec | Co przeszło bramkę |
|---|---|---|
| Warstwa zapisu `/field-definitions` | pełny CRUD, `:437-441` | plik był na liście WOLNO fazy F1, `Done-when` go nie wymagało → **przez dwa dni nie dało się założyć pola niestandardowego przez API**, przy kamieniu, którego całą treścią są pola niestandardowe |
| `GET /field-definitions/index-requests` | `:442`, plan przypisał `IDX-03`/`IDX-04` | odroczenie żyło **wyłącznie w komentarzu w kodzie** |
| `GET /field-catalog` | `:475-501`, `:779`, plan przypisał `CATALOG-01/02` | **cała powierzchnia ODCZYTU kamienia** — bez niej front nie ma jak wyrenderować formularza |

**Mechanizm jest zawsze ten sam i jest niewidoczny:** lista WOLNO mówi „czego wolno dotknąć",
`Done-when` mówi „co ma powstać". `checker` ocenia diff w zakresie fazy, a **zakresem fazy jest jej
`Done-when`**. Te dwie listy rozjeżdżają się bez żadnego sygnału. Bramka nie zawodzi — **nie ma
czego sprawdzić.**

**Zmiana do skilla (`sailes-spec` i `sailes-implement`):** przy pisaniu briefu fazy przejedź listę
WOLNO i **dla każdej pozycji wskaż warunek `Done-when`, który ją wymusza**. Pozycja bez takiego
warunku jest albo zbędna na liście, albo luką — i trzeba rozstrzygnąć **którą**, przy pisaniu
briefu, nie dwa dni później.

**Zmiana do checklisty `checkera`:** obowiązkowa osobna sekcja werdyktu — *„czego diff NIE ROBI,
a spec wymaga"*, wymuszająca przejechanie **powierzchni**, nie zmienionych linii. W tym przebiegu
ta sekcja znalazła luki, których czytanie łatki nie mogło znaleźć **z definicji**.

---

## 2. Tabela powierzchni API powinna być artefaktem MASZYNOWO CZYTELNYM

Konsekwencja punktu 1. Dołożyliśmy check „każdy plik trasy zaimportowany przez `index.ts`" —
**i nie złapałby żadnej z trzech luk**, bo porównuje PLIKI z IMPORTAMI, a dwie luki to brakujący
endpoint w istniejącym pliku, a jedna to brak pliku w ogóle. Po obu stronach zbiory zgadzają się
idealnie.

**Check, który by je złapał:** tabela powierzchni API ze specu kontra `app.printRoutes()`, jako
**równość zbiorów**, z jawną listą wyjątków „świadomie poza zakresem".

**Zmiana do `sailes-spec`:** powierzchnia API w specu jako **blok `yaml`** (metoda + ścieżka +
faza), nie markdownowa tabela parsowana regexem. Wtedy check jest trywialny, a tabela dalej
czyta się dla człowieka.

---

## 3. Równoległość czyta się z TABELI WŁASNOŚCI PLIKÓW, nie ze strzałek grafu faz

Plan pracy rysował `F1 → F2 → {F3, …}` i opisywał F2 jako „samotne". Dwadzieścia linijek niżej
**ten sam plan** niósł tabelę własności, z której wynikało, że zbiory plików F2 i F3 są rozłączne —
do tego stopnia, że brief F3 miał plik F2 na liście ZABRONIONE.

**Strzałka nie oznaczała zależności technicznej. Oznaczała kolejność, w jakiej autor o fazach
myślał.** Koszt: faza stojąca bez powodu przy sześciu przed sobą.

**Zmiana do `sailes-implement`:** sekcja „ścieżka krytyczna" w planie pracy ma zawierać **oba
rysunki** — graf pojęć **i macierz rozłączności plików** — bo pierwszy sam wprowadza w błąd.
Kryterium dispatchu: *czy zbiór plików tego zadania przecina się z czymkolwiek, co już jedzie?*
Przecięcie na JEDNYM pliku → **odbierz go obu i scal sam**, to tańsze niż serializacja faz.

---

## 4. Czwarta oś kolizji: WSPÓŁDZIELONY MAGAZYN pnpm i rdzenie

Znane trzy osie: pliki (izoluje worktree), kontrakt (izoluje kolejność), środowisko (izoluje
wyłączność). **Czwarta nie była nazwana i objawia się CISZĄ, nie błędem.**

`pnpm check` — normalnie ~1 minuta — **zwiesił się na dziesięć minut** i został zabity timeoutem.
Pierwsza hipoteza („17 procesów `node` to zaśmiecenie, pozabijaj") była **błędna i kusząca**, bo
`STATE.md` opisywał realny precedens z 24 osieroconymi procesami.

Pomiar po linii poleceń: **13 z 17 to serwery językowe edytora i serwery MCP**, a dwa pozostałe to
żywy `pnpm install` wykonawcy, uruchomiony **w tej samej sekundzie** co bramka. `pnpm` ma
współdzielony magazyn na całą maszynę; `tsc --build --force` przelicza całość. Nie sumują się —
serializują.

**Zmiana do skilla:** (a) **policz i rozbij po linii poleceń, zanim cokolwiek zabijesz** — liczba
procesów nie jest diagnozą; (b) **nigdy nie zabijaj procesów edytora ani serwerów MCP** — to
największa część listy i najmniej związana z testami; (c) **prowadzący nie uruchamia bramek, gdy
wykonawca stawia worktree**.

Kontrola pytaniem przed `taskkill`: *czy ten proces ma rodzica, którego znam, i czy wystartował
wtedy, gdy czegoś zażądałem?*

---

## 5. Komentarz opisujący zachowanie GNIJE — i łapie go tylko bramka czytająca całą powierzchnię

**Dwa defekty tego dnia były POPRAWNE w chwili napisania.**

1. Komentarz przy kompilatorze twierdził, że wymagalność globalna jest egzekwowana. Była to
   **aspiracja**, nie opis. Znalazł `checker`, potraktował jako **defekt, nie nit** — i miał rację:
   *komentarz mówiący nieprawdę o zachowaniu jest gorszy od braku komentarza, bo czytający nie ma
   czym go zdyskontować*. Nazwany tryb awarii: ktoś budujący import M1d ufa tej linijce.
2. `required` w `GET /field-catalog` wyliczane z `requiredAtStages`. **Rano obronialne** — globalna
   wymagalność nie istniała. **Po południu kłamało w obie strony**, bo mechanizm powstał. Znalazła
   **domykająca docs-delta**, nie przegląd kodu.

**Żaden przegląd diffu tego nie łapie**, bo diff nie zmienia tych linii. Łapie je wyłącznie bramka
czytająca **całą powierzchnię na czystym kontekście** — i potrzebne były **dwie różne role**,
`checker` i `docs-author`, bo patrzyły z innych stron.

**Zmiana do skilla:** to jest argument za tym, żeby krok docs-delta **nie był formalnością na
końcu**, tylko drugim niezależnym czytaniem powierzchni. W tym przebiegu zwrócił się dwukrotnie.

---

## 6. „Brak commita = nieskończone" chroni przed ZGADYWANIEM, nie przed UTRATĄ

Maszyna padła pięć razy. Za każdym razem ratunkiem było to, że praca była zacommitowana albo leżała
na dysku. **Dwóch wykonawców straciło pracę**; jednemu ratowałem trzy pliki ręcznie kopiując je
z worktree do drzewa i commitując jako fundament.

**Zmiana do szablonu briefu:** obok istniejącej reguły dochodzi zdanie —
> **Commituj często, choćby z `WIP:` w komunikacie.** „Brak commita = nieskończone" chroni przed
> zgadywaniem, czy praca jest gotowa; **nie chroni przed utratą procesu**.

Zadziałało: wykonawca trasy katalogu zostawił po sobie `WIP:` plus commit-poprawkę i **nic nie
przepadło**, mimo że przebieg trwał przez dwie awarie.

**Zmiana do procedury lidera:** zanim uznasz zadanie za nieskończone, **sprawdź worktree** —
`git status` i `git log`. Dziś dwa razy okazało się, że praca była na dysku mimo braku raportu.

---

## 7. HARNESS: worktree zakładane z NIEAKTUALNEJ bazy

**Pięciu z dwunastu wykonawców** dostało worktree wyprowadzony z commita sprzed połowy pracy —
raz sprzed całej fazy F1, raz **19 commitów wstecz**. Wszyscy zdiagnozowali to sami, sprawdzili
`git merge-base`, zrobili `--ff-only` i zgłosili. Ale:

- jeden przez to **zaraportował fałszywą regresję** liczby testów (556 zamiast 570), co kosztowało
  osobne dochodzenie;
- jeden musiał zrobić `pnpm install` od zera (**6 minut**), bo worktree nie miał `node_modules`.

**Defekt harnessu, nie skilla.** Worktree powinien być zakładany z **czubka gałęzi, na której stoi
sesja**, nie z punktu, w którym sesja się zaczęła.

**Obejście do czasu naprawy — weszło do wszystkich briefów:**
> **SPRAWDŹ BAZĘ SWOJEGO WORKTREE PRZED PRACĄ.** `git log --oneline -3` — musisz widzieć `<sha>`
> albo nowszy oraz plik `<konkretny plik dowodowy>`. Jeśli nie: zgłoś i napraw **przed** pracą.

---

## 8. HARNESS: rola `qa` była STRUKTURALNIE NIEWYKONALNA od 2026-07-31

**Najpoważniejszy wniosek dla harnessu.**

Hardening wydania 1.25.1 zamknął **jedyną** ścieżkę, którą agent mógł wprowadzić zmienne
środowiskowe do procesu aplikacji:
- `deny` na `Read(./.env*)` blokuje odczyt **nawet `.env.example`**;
- guard blokuje **każdą** komendę Bash zawierającą literał `.env`, więc `--env-file=.env` pada
  zanim proces wystartuje;
- aplikacja **nie miała żadnego wbudowanego ładowania** — `"dev": "tsx watch src/index.ts"`, zero
  `dotenv`;
- wcześniejszy legalny wzorzec (`set -a && . ./.env && set +a` w briefie) jest dziś tym samym
  guardem zablokowany.

**Skutek: rola, której cały mandat brzmi „dowieź żywy przepływ", nie mogła uruchomić aplikacji —
dla ŻADNEGO zadania, nie tylko tego.** Bramka behawioralna była niewykonalna przez dwa dni i nikt
tego nie zauważył, bo w tym czasie nikt jej nie odpalał.

`qa` zwrócił `ENV-DEFECT`, nie udał zieleni, i **zostawił trzy nazwane opcje do wyboru człowieka**.
To jest dokładnie zachowanie, którego rola ma uczyć.

**Naprawa wybrana i zweryfikowana uruchomieniem:** `"dev": "node --env-file-if-exists=../../.env
--import tsx/esm --watch src/index.ts"`. Literał `.env` żyje w **zwersjonowanym pliku**, więc agent
nigdy nie pisze go we własnej komendzie i **guard zostaje nienaruszony**. `--env-file-if-exists`,
nie `--env-file`: brak pliku nie wywraca CI ani produkcji.

**Zmiana do `sailes-bootstrap`:** ten skrypt `dev` ma być w **szablonie generowanego repo**. Zysk
uboczny, który wyszedł przy okazji: `pnpm dev` **też nie działał dla człowieka na świeżym klonie** —
tylko nikt tego nie zgłosił, bo wszyscy mieli zmienne w powłoce.

---

## 9. HARNESS: trzy mniejsze defekty, wszystkie zmierzone

1. **`.ai/ENV-LOCK` nie zna właściciela** — `qa` założył blokadę i **natychmiast zablokował sam
   siebie** na pierwszym `docker exec`. Zgłoszone już 2026-07-31, **nadal nieнаprawione**. Łatka
   (token właściciela) jest zaprojektowana i niewdrożona.
2. **Klasyfikator uprawnień zablokował `docs-author` commit** — dwukrotnie, w obu formach
   (heredoc i `-m`). Rola, której cały produkt to artefakty, nie mogła ich utrwalić; pracę
   przejmował i commitował lider. **Rola produkująca artefakty musi móc je commitować w swoim
   worktree.**
3. **`git worktree remove` przewraca się na Windowsie** — „Filename too long" na zagnieżdżonych
   `node_modules`. Jedyne, co działa: lustro pustego katalogu przez `robocopy /MIR`, i **trwa to
   kilkanaście minut** dla ośmiu worktree. Warte wpisania do skilla jako znana procedura, bo
   powtórzy się przy każdym sprzątaniu.

---

## 10. Co ZADZIAŁAŁO i warto chronić przed „usprawnieniem"

- **Instrukcja „testy pisz, przebiegu NIE uruchamiaj"** — zwróciła się **sześć razy**. Tyle
  defektów złapał pełny przebieg prowadzącego na spokojnym drzewie, w tym **trzy jego własne**.
  Wykonawcy nie mogą się przez to zweryfikować do końca i to jest przyjęty koszt: alternatywą są
  migoczące testy wyglądające jak defekt kodu.
- **„Zgłoś, nie naprawiaj pod siebie"** — wykonawcy poprawili lidera **siedem razy** w jednym dniu.
  Reguła chroni lidera przed jego własnym błędem w briefie, nie workera przed samowolą, i tak
  powinna być formułowana w briefie.
- **Stryker bez progu `break`, z imiennym rozliczeniem ocalałych** — zadziałał dokładnie jak
  zaprojektowano. Rozliczenie ujawniło, że **dzisiejsza zmiana OBNIŻYŁA wynik** (94,07 → 90,98),
  bo nowy schemat błędu powstał bez testów. Sam procent by to ukrył. Z jedenastu ocalałych sześć
  było prawdziwymi lukami, **pięć równoważnikami** — komunikatami Zoda, które nigdy nie wychodzą
  do klienta. Bez przeglądu po jednym wyglądałoby to na pięć dziur.
- **Macierz uprawnień jako pełna równość zbiorów** — to **ona** ujawniła brak `GET /field-catalog`,
  przy okazji zupełnie innej pracy. Wiersz `field_config.read` nie miał czego przejechać.
- **Decyzje człowieka przez okno wyboru z opcjami skonfrontowanymi z kodem PRZED otwarciem okna** —
  dwa razy dziś okno ujawniło, że moja rekomendacja stała na nieistniejącej przesłance, zanim Karol
  zdążył ją przeczytać.
