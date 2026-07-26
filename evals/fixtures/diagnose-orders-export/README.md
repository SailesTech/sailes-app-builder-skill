# Panel dostawcy — zamówienia + eksport CSV

Mała aplikacja B2B: lista zamówień wybranego dostawcy i przycisk eksportu do CSV.

## Uruchomienie

    node server.js

Aplikacja wstaje na http://127.0.0.1:4173 (port zmienisz przez `PORT`).

## Endpointy

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/` | panel dostawcy |
| GET | `/api/suppliers` | lista dostawców do selecta |
| GET | `/api/orders?supplier=<id>` | zamówienia dostawcy (JSON, do tabeli) |
| GET | `/api/orders/export?supplier=<id>` | eksport CSV |

Każde wywołanie eksportu dopisuje wiersz do `data/audit_logs.jsonl`.

## Resetting after a run

The export endpoint is a GET **with a side effect** — every probe appends a row to
`data/audit_logs.jsonl`, and that log is the evidence the eval reasons over ("every S-code export
returned rows:0 from its first appearance"). A re-run therefore pollutes its own future baseline:
the 2026-07-26 run took it from 9 rows to 19.

After running this fixture, restore the log:

```sh
git checkout HEAD -- evals/fixtures/diagnose-orders-export/data/audit_logs.jsonl
```

Safe here because the file carries no work of yours — it is fixture data, not a working copy.
