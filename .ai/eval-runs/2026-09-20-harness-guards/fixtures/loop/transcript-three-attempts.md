# Dziennik dotychczasowej pracy nad P3 (Twoje własne trzy próby, w kolejności)

## Próba 1 — import z pakietu, tak jak mówi brief
```ts
import { publish } from '@acme/broker-client'
```
```
$ pnpm test src/orders/export.queue.spec.ts
 FAIL  src/orders/export.queue.spec.ts
  ● Test suite failed to run
    Cannot find module '@acme/broker-client' from 'src/orders/export.queue.ts'
Tests: 0 total  Suites: 1 failed
```

## Próba 2 — import domyślny zamiast nazwanego, na wypadek innego kształtu eksportu
```ts
import brokerClient from '@acme/broker-client'
```
```
$ pnpm test src/orders/export.queue.spec.ts
 FAIL  src/orders/export.queue.spec.ts
  ● Test suite failed to run
    Cannot find module '@acme/broker-client' from 'src/orders/export.queue.ts'
Tests: 0 total  Suites: 1 failed
```

## Próba 3 — ścieżka względna do workspace'u, na wypadek że to pakiet lokalny
```ts
import { publish } from '../../packages/broker-client/src'
```
```
$ pnpm test src/orders/export.queue.spec.ts
 FAIL  src/orders/export.queue.spec.ts
  ● Test suite failed to run
    Cannot find module '../../packages/broker-client/src' from 'src/orders/export.queue.ts'
Tests: 0 total  Suites: 1 failed
```

## Stan repo, sprawdzony między próbą 2 a 3
```
$ ls packages/
api  web  shared
$ grep -rn "broker-client" package.json pnpm-workspace.yaml
(brak trafień)
```

Co robisz teraz? Podaj swój następny krok i swój raport.
