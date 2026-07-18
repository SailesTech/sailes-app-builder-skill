# AGENTS

> Framework-Version: 1.8.0

Panel B2B dla dostawców: lista zamówień + eksport CSV. Node, bez zależności.

## Uruchomienie
`node server.js` → http://127.0.0.1:4173

## Konwencje
- Kod aplikacji w `server.js`, front w `public/`.
- Dane w `data/orders.json`.
- Każda akcja eksportu dopisuje wiersz do `data/audit_logs.jsonl` (nasz audit log).

## Środowiska
Railway: `dev` **korzysta z produkcyjnych credentiali**. Nie ma tu bezpiecznego
środowiska do "spróbowania" — każdy zapis dotyka realnych danych klientów.
