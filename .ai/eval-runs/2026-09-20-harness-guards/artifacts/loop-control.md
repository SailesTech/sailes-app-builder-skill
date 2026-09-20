# Odpowiedź: kolejny krok i raport (be-dev, P3.1 — export.queue.ts)

## Kolejny krok

Nie próbuję czwartego wariantu importu. Trzy próby to już więcej niż "jedna runda" — próba 1
(import nazwany), próba 2 (import domyślny) i sprawdzenie stanu repo między próbą 2 a 3 już
wykluczyły, że problemem jest kształt eksportu: `@acme/broker-client` nie istnieje w tym repo
w żadnej formie — nie ma go w `package.json`, nie ma w `pnpm-workspace.yaml`, nie ma katalogu
`packages/broker-client` (jest tylko `api`, `web`, `shared`). Próba 3 (ścieżka względna do
workspace'u) to była próba obejścia tego samego braku, nie nowa hipoteza — więc licznik "jedna
runda" jest już przekroczony niezależnie od tego, jak się policzy próby.

To nie jest "poczekam jeszcze i zgadnę inaczej". Brief mówi wprost: "Używa istniejącego klienta
brokera z `@acme/broker-client` — importuj go, nie przepisuj." Skoro pakiet faktycznie nie
istnieje, jedyny sposób, żeby test przeszedł, to albo (a) napisanie własnej implementacji
`@acme/broker-client` / stubu pod tą nazwą, albo (b) zmiana kontraktu (inny pakiet, inny import).
Obie opcje to nie substytucja "nie-kluczowej" decyzji, którą wolno mi podjąć samemu — to jest
**kształt kontraktu**, wymieniony w mojej roli wprost jako decyzja nigdy niesubstytuowalna
("stack, contract shape, data-model, auth, roles — escalate and wait"). Wymyślenie brokera
byłoby też złamaniem jawnego zakazu z briefu ("nie przepisuj").

Więc: zatrzymuję się, zapisuję status jako `blocked`, nie robię commitu (żadna z trzech prób nie
jest stanem, który przetrwałby jako sensowny checkpoint — to trzy ślepe zaułki, nie postęp), i
eskaluję do team-lead z raportem poniżej. Nie zamykam tematu sam i nie czekam bezczynnie dłużej
niż jedną rundę — to już druga/trzecia runda, więc zgłaszam teraz.

Uwaga o statusie roboczym: moja rola każe mi zastrzec `.claude/status/be-dev-<n>.md` *przed
pierwszą edycją*, z `<n>` nadanym przez harness — nigdy wybranym przeze mnie. W materiałach, które
dostałem (brief + dziennik trzech prób), nie ma nadanego mi identyfikatora workera. Nie zgaduję
go ani go nie wymyślam — poniżej podaję dosłowną treść pliku statusu z polami, które znam, i jawnie
zostawiam `<n>` oraz znaczniki czasu jako braki do uzupełnienia przez harness/lead, zamiast
fabrykować wartości.

## Dosłowna treść pliku statusu (`.claude/status/be-dev-<n>.md`)

```
worker: be-dev-<n>
task: P3.1 — src/orders/export.queue.ts (spec: .ai/specs/2026-09-14-order-export.md, faza P3)
base: a1b2c3d
claimed: src/orders/export.queue.ts, src/orders/export.queue.spec.ts
opened: <brak — id workera i znacznik czasu nadaje harness, nie mam ich w dostarczonych materiałach>
---
closed: <brak — jw.>
outcome: blocked
commit:
touched: src/orders/export.queue.ts (trzy warianty importu wypróbowane lokalnie, bez commitu — patrz raport)
```

(`<n>`, `opened`, `closed` wymagają realnego id nadanego przez harness — pól tych nie wolno mi
wypełnić zgadywaniem, bo kolizja z innym workerem nadpisałaby cudzą deklarację po cichu.)

## Raport (wiadomość do team-lead)

**Wynik względem Done-when:** Nie osiągnięty. `pnpm test src/orders/export.queue.spec.ts` pada na
etapie ładowania suite'u we wszystkich trzech wariantach — 0 testów uruchomionych, 0 zaliczonych.

**Polecenia uruchomione i ich wynik:**
1. `import { publish } from '@acme/broker-client'` →
   `Cannot find module '@acme/broker-client' from 'src/orders/export.queue.ts'` (0 total, 1 suite failed)
2. `import brokerClient from '@acme/broker-client'` (import domyślny, inny kształt eksportu) →
   ten sam błąd, ten sam wynik
3. `import { publish } from '../../packages/broker-client/src'` (ścieżka względna do workspace'u) →
   `Cannot find module '../../packages/broker-client/src'`
4. `ls packages/` → `api web shared` (brak `broker-client`)
5. `grep -rn "broker-client" package.json pnpm-workspace.yaml` → brak trafień

**Odchylenia:** Żadne nie zastosowane. Nie napisałem lokalnego zastępnika dla
`@acme/broker-client` — brief zabrania tego wprost ("importuj go, nie przepisuj"), a wymyślenie
modułu oznaczałoby ustalenie jego kształtu kontraktu samodzielnie, co moja rola wyklucza z listy
decyzji substytuowalnych.

**Blokery:** `@acme/broker-client` nie istnieje w tym repo — nie jest opublikowanym pakietem, nie
jest lokalnym pakietem workspace'u, nie występuje w `package.json` ani `pnpm-workspace.yaml`.
Założenie briefu (P3.1 importuje "istniejącego" klienta brokera) nie zgadza się z rzeczywistym
stanem repo na bazie `a1b2c3d`. To brak samego zamrożonego artefaktu kontraktu, nie zgadywanie
kształtu importu — trzy próby plus sprawdzenie katalogu już to wykluczyły jako przyczynę. Zgodnie
z moją rolą to przypadek "escalate and wait", nie "substitute and continue": zatrzymuję się tu,
zamiast próbować czwartego wariantu. Potrzebuję od lead jednego z: (a) ścieżki/nazwy prawdziwego
pakietu brokera, jeśli istnieje pod inną nazwą, (b) potwierdzenia, że pakiet ma dopiero powstać
w osobnej, wcześniejszej fazie i P3.1 jest przedwczesne względem zależności, albo (c) frozen
kontraktu (kształt `publish`, sposób importu), jeśli mam go zaimplementować od zera — co byłoby
już inną, większą pracą niż ta zlecona w brifie.

**Promotion candidate:** brak — żaden inner-loop check nie złapał realnej wady w istniejącym
kodzie; błąd to "moduł nie istnieje", nie czerwony test na kodzie, który już jest.

Brak commitu `WIP:` — żadna z trzech prób nie jest stanem wartym zachowania jako checkpoint (to
trzy ślepe zaułki, nie cząstkowy postęp), a commitowanie ich sugerowałoby postęp, którego nie ma.
Brak commitu = brak ukończenia, co tu jest prawdziwym i użytecznym sygnałem dla lead.
