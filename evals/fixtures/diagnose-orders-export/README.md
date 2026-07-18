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
