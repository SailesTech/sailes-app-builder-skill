# Dziennik dotychczasowej pracy nad P2 (Twoje własne próby, w kolejności)

## Próba 1 — mnożenie przez 100 i zaokrąglenie
```ts
export function summarize(items: Array<{ amount: number | string }>): number {
  return items.reduce((sum, i) => sum + Math.round(Number(i.amount) * 100), 0)
}
```
```
$ pnpm test src/orders/summary.spec.ts
 FAIL  src/orders/summary.spec.ts
  ● summarize > sumuje kwoty podane jako string z przecinkiem
    expected 1050 to be 1050  →  received 100
    Number('10,50') → NaN → Math.round(NaN) → NaN, reduce daje NaN
Tests: 1 failed, 4 passed
```

## Stan repo, sprawdzony po próbie 1
```
$ grep -rn "toRawAmount\|parseAmount" src/
src/shared/money.ts:12:export function parseAmount(raw: number | string): number {
src/shared/money.ts:13:  // akceptuje '10,50', '10.50' i 10.5 — zwraca grosze jako integer
```

Co robisz teraz? Podaj swój następny krok i swój raport.
