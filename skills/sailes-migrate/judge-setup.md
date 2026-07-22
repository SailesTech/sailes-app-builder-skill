# Judge / parity-harness — nienegocjowalny warunek wstępny

Judge to mechanizm, który dowodzi, że **port zachowuje się jak oryginał**. Bez niego „done" znaczy
tylko „się kompiluje" — a to nie jest migracja, to nadzieja.

## Reguła

> Judge **musi istnieć przed Krokiem 1** i być **zwalidowany na celowo zepsutym źródle** przed
> jakimkolwiek przekładem (Krok 3).

Oryginalny kod jest **wykonywalną specyfikacją**. Judge porównuje zachowanie portu z zachowaniem
oryginału na tym samym wejściu.

## Dwie drogi

1. **Istniejący suite (public-facing)** — jeśli oryginał ma testy, które wołają go przez publiczny
   interfejs (nie importują wnętrzności), **przenieś je bez zmian** do Kroku 6. To najtańszy judge.
2. **Przenośny parity-harness** — jeśli testy oryginału **importują wnętrzności źródła** (nie
   przełożą się 1:1), zbuduj osobny harness: ustalony zestaw wejść → zebrane wyjścia oryginału jako
   „złoty" wzorzec → ten sam zestaw puszczony na porcie → diff. Harness jest **przenośny** (nie
   zależy od języka źródłowego).

## Walidacja judge'a (obowiązkowa, przed Krokiem 3)

Zanim zaufasz judge'owi, udowodnij, że **łapie regresję**:

1. Wprowadź **celowy błąd** do oryginału (zmień wynik jednej funkcji).
2. Puść judge'a. **Musi sfailować.** Jeśli przechodzi — judge jest ślepy, popraw go.
3. Cofnij błąd; judge znów zielony.

To ta sama dyscyplina co nasz RED-przed-GREEN: test, który nie failuje bez buga, nie jest testem.

## Bramka parzystości (Krok 6)

Migracja jest „done" wtedy i tylko wtedy, gdy:

- **wszystkie** testy parzystości / harness zielone na porcie, **oraz**
- oryginalny suite puszczony na **oryginalnym** kodzie ma **zero** odziedziczonych porażek
  (inaczej Twój wzorzec jest już zepsuty i porównanie jest bez wartości).

Dopiero po tej bramce ruszasz burndown `BUG(port)`/`TODO(port)`/`PERF(port)`.

## Reużyj

Dyscyplina bramki = nasz `qa` (dowód zachowania, nie asercja). Autor przypadków parzystości = nasz
`tester` (wyprowadza oczekiwane zachowanie z oryginału **zanim** przeczyta port). Niezależna ocena =
`checker` na czystym kontekście.
