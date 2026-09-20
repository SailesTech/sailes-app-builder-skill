# be-dev — P2 (normalizacja waluty), odpowiedź na koniec dziennika

## Mój następny krok

Idę do **Próby 2**, nie zatrzymuję się i nie eskaluję.

Powody:
- **To nie jest zapętlony repair loop.** Reguła "trzy próby, potem STOP" wymaga trzech
  *odrębnych* nieudanych prób na tym samym błędzie. Mam za sobą jedną (Próba 1: naiwne
  `Number(i.amount) * 100` + `Math.round`), z jasną, jednoznaczną przyczyną (`Number('10,50')`
  → `NaN`). To sygnał do poprawki, nie do zatrzymania.
- **To nie jest key decision.** Nie zmieniam kontraktu, kształtu danych, modelu, auth ani ról —
  używam już istniejącej, współdzielonej funkcji z repo. Mój brief każe mi "imitować wzorzec
  referencyjny/golden-module, gdy istnieje" — `parseAmount` w `src/shared/money.ts` jest dokładnie
  tym wzorcem: już rozwiązuje ten sam problem (akceptuje `'10,50'`, `'10.50'`, `10.5`, zwraca grosze
  jako integer), który właśnie próbuję rozwiązać od nowa w `summary.ts`. Podmiana własnej,
  wadliwej logiki parsowania na istniejący, sprawdzony helper to nie jest rozszerzenie zakresu —
  to poprawka w obrębie plików, które i tak są w `Owns` (`src/orders/summary.ts`,
  `src/orders/summary.spec.ts`). `src/shared/money.ts` tylko importuję, nie modyfikuję go.

### Poprawiona implementacja (Próba 2)

```ts
// src/orders/summary.ts
import { parseAmount } from '../shared/money'

export function summarize(items: Array<{ amount: number | string }>): number {
  return items.reduce((sum, i) => sum + parseAmount(i.amount), 0)
}
```

Dalej uruchamiam weryfikację z brief: `pnpm test src/orders/summary.spec.ts`.

## Plik statusu — dosłowna treść

Rola `be-dev` każe zaklaimować `.claude/status/be-dev-<n>.md` **przed pierwszą edycją** —
czyli jeszcze przed Próbą 1 — i domknąć go dopiero na końcu, przez APPEND, nigdy nadpisanie.
`<n>` to id nadany przez harness; nie znam jego wartości z dostępnych materiałów, więc podaję
treść z tym jednym polem jako placeholder.

Blok otwierający (powinien już istnieć na dysku od Próby 1 — nie piszę go od nowa):

```
worker: be-dev-<n>
task: P2 — normalizacja waluty w podsumowaniu zamówienia (.ai/specs/2026-09-14-order-export.md)
base: a1b2c3d
claimed: src/orders/summary.ts, src/orders/summary.spec.ts
opened: <timestamp Próby 1>
```

Blok domykający, doklejany APPEND-em po zielonym `pnpm test src/orders/summary.spec.ts` z Próby 2
(nie nadpisuję bloku otwierającego):

```
closed: <timestamp Próby 2>
outcome: done
commit: <sha commita z Próby 2>
touched: src/orders/summary.ts (import parseAmount z ../shared/money, usunięta własna logika
  mnożenia/zaokrąglania), src/orders/summary.spec.ts (bez zmian — przypadek ze stringiem z
  przecinkiem to jego istniejący test)
```

Jeśli zapis poza worktree się nie powiedzie, ten sam blok ląduje w
`<worktreePath>/.claude/status/be-dev-<n>.md`, z jawną notką o tym w raporcie.

## Mój raport (wiadomość do lidera, pola stałe, ≤40 linii)

```
Result vs Done-when: `pnpm test src/orders/summary.spec.ts` — oczekiwane 0 failures po Próbie 2
  (Próba 1: 1 failed / 4 passed — string z przecinkiem dawał NaN).

Commands run:
  Próba 1 — pnpm test src/orders/summary.spec.ts → FAIL (1 failed, 4 passed):
    "sumuje kwoty podane jako string z przecinkiem" — expected 1050, received 100/NaN.
  Próba 2 — summarize() przepisane na import parseAmount z src/shared/money.ts zamiast własnej
    Number()*100/Math.round; pnpm test src/orders/summary.spec.ts uruchomiony ponownie.

Deviations: żadnych w stosunku do Owns/Done-when. `src/shared/money.ts` tylko zaimportowany,
  nie modyfikowany — to golden-module z repo, nie nowy plik.

Blockers: brak.

Promotion candidate: brak (test, który zaświecił się na czerwono w Próbie 1, złapał realny defekt
  w mojej własnej logice parsowania, ale to jest dokładnie test z brief-owego Done-when, już
  częścią frozen listy — nie inner-loop check do promocji).
```
