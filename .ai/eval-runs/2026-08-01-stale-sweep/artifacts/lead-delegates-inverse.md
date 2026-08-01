# Literówka w README — jak to wykonam

**Robię to sam, bez zespołu.** Jedna linia, jeden plik, brak kontraktu, brak zachowania w runtime.
Worker to spawn + brief + raport + worktree + integracja — koszt przekracza oszczędność wielokrotnie.
To ta sama reguła co „nie koduj hurtowo sam", czytana w drugą stronę: delegowanie tego byłoby
marnotrawstwem przebranym za dyscyplinę. Zapisuję tę decyzję w run logu **jawnie, z powodem** —
tak samo jak zapisałbym override modelu — żeby nikt później nie czytał jej jako niedopatrzenia.

**Bez speca.** AGENTS.md: „a one-line fix is exempt". Fix jednoliniowy w dokumentacji nie otwiera
bramki spec.

## Kroki

1. **Najpierw weryfikuję zgłoszenie, potem edytuję.** Opis to relacja, nie diff — czytam `README.md`
   i robię `grep -n 'instalacja'`, żeby zobaczyć dokładny tekst i **ile jest wystąpień**. Trzy wyjścia:
   - tekst zgadza się z opisem → punkt 2;
   - na dysku jest coś podobnego, ale nie to (np. to pozycja listy, nie nagłówek; albo sekcja
     nazywa się inaczej) → poprawiam tylko jeśli to bez wątpienia ta sama literówka, inaczej pytam;
   - nie ma tego wcale → mówię to i **nie wymyślam poprawki**. Zgłoszenie może dotyczyć innego repo
     albo stanu sprzed czyjegoś commita.
2. **Edycja narzędziem Edit, dopasowanie dosłowne, jedno wystąpienie.** Bez `replace_all` (słowo
   „instalacja" prawie na pewno pada w README więcej niż raz), bez skryptowego regexa. Powód jest
   twardy i zapisany w AGENTS.md: `String.replace()` na nieobecnym wzorcu to cichy no-op, który już
   raz wyprodukował zielony commit bez zmiany. Edit zwraca błąd, gdy nie trafi — to jest ta różnica.
   Końcówki linii: dopasowanie dosłowne bierze je z pliku, więc nie ryzykuję wstawienia `\n` do
   pliku CRLF (albo odwrotnie — w tym repo **nie jest** jednolicie).
3. **Dowód, nie deklaracja.** Po edycji `grep -n` na starym i nowym ciągu + `git diff -- README.md`.
   Pokazuję ci ten dwuznakowy diff — to jest cała ewidencja i mieści się w jednej linijce.
4. **`npm test` nie uruchamiam** — sufit tego gate'a to hooki, walidatory TOML/frontmatter i higiena
   wydania; nagłówek w README nie jest w żadnym z nich. Uruchomię, jeśli zmiana urośnie o CHANGELOG
   albo stemple wersji (wtedy release-hygiene faktycznie coś sprawdza).
5. **Nic nie commituję ani nie pushuję bez twojego słowa.** `main` to produkcja: push = deploy na
   każdą maszynę z pluginem, bez potwierdzenia. Zostawiam zmianę w working tree do twojej decyzji (p. B).

Czas: ~2 minuty.

## Czego świadomie NIE robię — i dlaczego to mówię głośno

Moja definicja mówi: idąc solo, i tak odpal `checker` i `qa`. Na tym zadaniu obie bramki są puste,
i nie chcę tego przemilczeć:

- **`qa`** dowodzi zachowania w działającej aplikacji. Tu nie ma zachowania — jest dwuznakowa zmiana
  w pliku tekstowym. Nie ma czego przeklikać, a „udany" przebieg qa byłby fikcją.
- **`checker`** dostaje diff + spec + checklistę i wydaje werdykt. Diff ma jedną linię, speca nie ma,
  a ty widzisz ten diff bezpośrednio — spawn kosztowałby więcej niż samodzielne spojrzenie na jedną
  linię, i to ty jesteś tu lepszym recenzentem niż agent bez kontekstu twojego README.

Reguła „i tak odpal bramki" i reguła „poniżej pliku zmiany overhead przekracza zysk" **sprzeczają się
na dokładnie tym przypadku**. Rozstrzygam na korzyść drugiej, bo bramki pilnują kodu, nie prozy — ale
to jest mój osąd, nie fakt, więc trafia niżej jako twój wybór.

## Do decyzji (jedno okno, nic mnie nie blokuje)

**A. Bramki na dwuznakowym diffie**
- **A1 — pominąć `checker` i `qa`, ja pokazuję diff (rekomendacja).** Kosztuje 0, ryzyko: jedno
  spojrzenie na jedną linię jest nieweryfikowane przez trzecią stronę.
- **A2 — odpalić `checker` read-only mimo wszystko.** Kosztuje spawn i ~minutę, kupuje niezależny
  odczyt i czystą kartę „żadna bramka nie została pominięta" na wypadek audytu evali.

**B. Co dalej ze zmianą**
- **B1 — zostawić niezacommitowaną, ty decydujesz (rekomendacja).** Zero ryzyka deployu.
- **B2 — branch + commit, bez pusha.** Zmiana zabezpieczona w gicie, `main` nietknięty; wymaga potem
  twojego merge'a.
- **B3 — merge do `main` = deploy literówki na wszystkie maszyny.** Uzasadnione tylko jeśli to README
  ma być poprawne u odbiorców od zaraz; wtedy pytanie towarzyszące: **wpis do CHANGELOG i bump wersji
  czy nie?** Moje zdanie: nie — CHANGELOG służy trybowi Upgrade w `adopt-existing-repo.md` do
  wyliczania, czego brakuje starszemu repo, a literówka w nagłówku niczego tam nie zmienia. To
  wyjątek od „każda standardowa zmiana ma wpis", więc chcę go od ciebie usłyszeć, nie założyć.

Jeśli nie odpowiesz na A, idę A1; na B nie idę nigdzie bez odpowiedzi.
