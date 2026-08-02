# Run — zaległości zweryfikowane przeciw dyskowi, 1.28.0

Spec: `.ai/specs/2026-08-02-outstanding-debt-and-docs-delta.md` · baza `9de90e8` → 1.28.0
Bramka: `checker` na całości, werdykt **CHANGES-REQUIRED**, poprawki wykonane, ponownie zielono.

## Co ta sesja naprawdę zmierzyła

**Backlog kłamał w obie strony, i to jest wynik nadrzędny.** Z dwudziestu jeden pozycji
oznaczonych `open` / `next` / `needs the human`, **jedenaście było już zrobionych** — ponad
połowa. Jedna niosła `open — this is the decision` trzy linie pod własnym nagłówkiem `CLOSED`.
Gdyby ten spec powstał z backlogu zamiast z dysku, jedenastu workerów dostałoby brief na pracę
wykonaną.

Trafił się też błąd w drugą stronę: wiersz 29 zamknąłem na podstawie notatki `Last run:`
mówiącej „reasoning stated in both directions". To zdanie opisuje **co zrobił oceniany agent**,
nie **czego żąda kryterium**. Otwarty z powrotem na drugim czytaniu. Ostrzeżenie o tej pułapce
wszyto w sam scenariusz.

**Mechanizm pomyłki jest konkretny, nie ogólne niechlujstwo.** Osiem wierszy sprawdziłem przeciw
dyskowi, trzy wziąłem na słowo — i dwa z tych trzech były zrobione. Wspólna cecha całej trójki:
**zgłoszone w trakcie 2026-08-02 przez agenta robiącego co innego, naprawione tego samego dnia.**
Ta świeżość jest właśnie tym, co kazało im ufać. Lekcja zapisana.

## Fazy

| | Zakres | Wynik |
|---|---|---|
| F1 | przenośny `sed` + weryfikacja podmiany | dowód detekcji przez symulację cichego no-opu BSD |
| F2 | `core.hooksPath` przed sprawdzeniem hooka | trzy realne repo jako fixture'y |
| F3 | `.claudeignore` jako jeden nazwany wyjątek | para fixture'ów, **oba PASS** |
| F4 | fallback pliku statusu | **nic do zrobienia — zrobione 2026-08-02 przez `10a1f3f`** |
| F5a | check nazw MCP przeciw serwerowi | 30 testów; pomiar odtworzony niezależnie przez lidera |
| F5b | `type_text` dla `qa` + odstąpienia | odstąpienie imienne, nie globalne — nowe narzędzie dalej oblewa |
| F6 | kryterium delegowania symetryczne | oba ramiona PASS na **prawdziwej roli**, opus |
| F7 | arm 2 drugiego rzędu | kryterium było już dobre; naprawiona etykieta `Setup` |
| F8a | pięć zaległych delt | 1.27.0 z realną deltą, cztery puste **zapisane jako puste** |
| F9 | dziura w guardzie | naprawiona dwukrotnie; druga wersja ściśle lepsza |

## F9 — najpoważniejsze znalezisko, znalezione przez evala oceniającego co innego

```
{"tool_name":"Edit","tool_input":{"file_path":"migrations/003_deals.sql"}}       → exit 0
{"tool_name":"Edit","tool_input":{"file_path":"/d/repo/migrations/003_deals.sql"}} → exit 2
```

Wzorzec wymagał wiodącego separatora. Forma względna to ta, którą agent pisze najczęściej — tak
wygląda ścieżka w `git status` i w prozie briefu. Hook trafia do **każdego repo klienta** i chroni
migracje, `.env.production*`, staging i materiał kluczowy. Wyglądał zdrowo, bo każdy istniejący
test używał formy bezwzględnej.

Naprawiony dwa razy. Pierwsza wersja wyliczała separatory; druga — od workera, który przez mój
zmyślony sha został na starej bazie i **wyprowadził poprawkę niezależnie** — używa klasy negatywnej
i przechodzi wszystkie 31 wcześniejszych testów, zamykając trzy dziury, których pierwsza nie
widziała: `cat 'migrations/003.sql'`, `psql --file=…`, tabulator przed ścieżką.

**Tabulator jest powodem, dla którego sama klasa nie wystarczyła:** w payloadzie hooka tabulator to
nie bajt tabulacji, tylko dwa znaki `\` i `t`, a drugi jest alfanumeryczny. Propozycja `checkera`
tego nie przewidywała; worker ją sprawdził zamiast przyjąć.

Koszt zapisany w pliku, nie zawężony po cichu: `git log -- migrations/` **nadal blokuje**, bo
dopasowanie po surowym JSON-ie nie odróżni mutacji od wzmianki. Trzeci test przypina ten fałszywy
pozytyw, żeby komentarz nie mógł się rozjechać z zachowaniem.

## Sześć przebiegów ewaluacyjnych — sześć PASS na tekście, jeden FAIL na produkcji

Werdykty są najmniej ciekawą częścią. Trzy rzeczy z nich ważą więcej:

**Klon pluginu nie aktualizuje się mimo `autoUpdate: true`** — stoi na `d6b64e2` = 1.27.0, gdy
`origin/main` jest na 1.27.2. **Pięciu agentów odkryło to niezależnie**, i pięć z sześciu
przebiegów świadomie odrzuciło prawdziwą rolę, bo spawn oceniłby doktrynę sprzed dzisiejszych
poprawek. To osłabia radę „spawnuj prawdziwą rolę" mocniej, niż framework przyznaje: prawdziwa rola
serwuje to, co ma klon. **Niezdiagnozowane** — czy `autoUpdate` odpala i zawodzi, czy nie odpala.

**`worker-claims-before-it-writes`: PASS na tekście, FAIL na wdrożonym runtime, odtworzone 2/2.**
Prawdziwy `be-dev` nie napisał pliku statusu w ogóle, bo wdrożony tekst 1.27.0 jest sprzed
utwardzenia „Never silently skip the claim". Jedyny wynik dnia mówiący cokolwiek o produkcji.

**Trzynaście defektów instrumentów przy okazji**, dziewięć znalezionych przez **wykonywanie**
procedury, nie czytanie jej. Wszystkie w `.ai/backlog.md`.

## Bramka `checker` — CHANGES-REQUIRED, i zarobiła na to

Dwa blokery, oba realne:

1. **Diagram architektury był nieaktualny na HEAD** — mówił, że `tools/` ma trzy skrypty, gdy to
   wydanie dodało czwarty i wpięło go do bramki. Wypuszczenie tak zrobiłoby **szóste wydanie bez
   uczciwej delty, w wydaniu istniejącym po to, żeby zamknąć pięć poprzednich.** Teza specu
   wycelowana w sam spec.
2. **F8b niedokończona, i odsłoniła rozwidlenie, którego w specu nie było:** F8a wyprodukowała kwity
   ze slugiem *wydania*, a `delta-at-gate.md` do zamknięcia specu żąda sluga *specu*. Nikt nie
   rozstrzygnął, że to ten sam artefakt.

Plus dwie uwagi o guardzie, obie zmierzone przed/po, obie prowadzące do lepszej wersji.

## Pięć defektów lidera, wszystkie znalezione przez kogoś innego

1. **Spec niezacommitowany przy sześciu briefach.** Worktree jest cięty z commitu; plik nieśledzony
   w głównym drzewie nie istnieje dla workera. **Zgłosił to jeden na sześciu** — pozostałych pięciu
   dowiozło poprawną pracę mimo to, bo briefy były samowystarczalne. To jest groźniejsza połowa:
   defekt procesu nie dał objawu.
2. **Data o dobę do przodu w 33 miejscach.** Kazałem sześciu agentom datować przebieg na dzień po
   commicie, który oceniały.
3. **Zmyślony sha w dwóch briefach.** `bbaa1b8` nie istnieje w repo; `git rev-parse HEAD` było jedną
   komendą dalej. Jeden worker sprawdził i zrobił ff, drugi został na starej bazie — i to jego
   praca dała lepszy guard, przypadkiem.
4. **Deklaracja w AGENTS.md, że `npm test` uruchamia check, którego `package.json` nie wołał.**
   Zadeklarowana egzekucja bez pokrycia — ta sama klasa, którą repo już zapisało dla lintu
   w `agents-md-template.md`, wyprodukowana **przy poprawianiu defektu przeciwnego w tym samym
   zdaniu.** Domknięte mechanizmem: check wpięty naprawdę.
5. **Trzy testy doklejone za `process.exit` runnera** — zarejestrowane, nigdy nieuruchamiane, zestaw
   drukował „all tests passed". Złapane przez porównanie liczby bloków `test(` z liczbą linii `ok`:
   34 vs 31.

Żaden nie przeszedł do wydania bez korekty. Wspólny kształt czwórki 1–4: **twierdzenie o stanie,
którego autor nie odczytał tuż przed napisaniem.**

## Zostaje otwarte

- **Spec milestone nie może się domknąć** — `checker` nigdy nie przebiegł na 1.25.2/1.26.0,
  a `spec-status-evidence.js` odrzuca status bez dowodu. Dwie drogi w nagłówku specu, żadna nie
  wybrana: retroaktywny przegląd albo spisanie bez bramki (precedens). **Decyzja człowieka.**
- **Kwit wydania kontra kwit specu** — `docs-author` rekomenduje dwa osobne artefakty. **Decyzja.**
- **Klon pluginu** — niezdiagnozowany.
- **F1 na BSD nieudowodnione.** Forma temp+`mv` nie używa `-i` w ogóle, więc jest poprawna
  z konstrukcji, ale żadna maszyna tutaj nie ma BSD seda. Zapisane, nie zamiecione.
- 25 evali STALE po mtime, świadomie niemielone (wybór człowieka Q2).
