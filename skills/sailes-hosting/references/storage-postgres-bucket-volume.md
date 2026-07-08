# Storage na Railway — Postgres vs Bucket (S3) vs Volume

Trzy warstwy trwałości. Wybór wg **rodzaju danych**, nie wg wygody. Zła warstwa = utrata danych
przy redeployu albo niepotrzebny koszt/komplikacja.

---

## 0. Reguła efemerycznego FS (przeczytaj zanim cokolwiek zapiszesz na dysk)

> 🔒 System plików kontenera Railway **RESETUJE SIĘ przy każdym deployu i restarcie.**
> `./logs`, `/tmp`, uploady zapisane na dysk kontenera → **znikają**.

Konsekwencja: cokolwiek ma przeżyć redeploy MUSI iść do **Volume** (mount trwałego dysku) albo do
**S3** (upload do bucketu). Na tym się nadzialiśmy: logi przyjętych formularzy WWW pisane do
lokalnego katalogu ginęły przy każdym deployu → przenieśliśmy do Volume `/data`.

`/tmp` jest OK **tylko** dla rzeczy ważnych w obrębie jednego requestu (np. bufor przy scalaniu PDF
przed wysłaniem do Medfile). Nic, co ma być odczytane później.

---

## 1. Tabela decyzyjna

| Dane | Warstwa | Dlaczego |
|---|---|---|
| Config, sekrety | **zmienne env** | nie storage; patrz `env-i-sekrety.md` |
| Relacyjne (pacjenci, deale, sync_state, audit) | **Postgres** | zapytania, transakcje, backup |
| Pliki użytkownika (ZC2, PDF, skany, załączniki) | **Bucket (S3)** | bloby; nie pchać do bazy ani na dysk |
| Trwały dysk lokalny (append-log, cache, sqlite) | **Volume** | przeżywa redeploy, ale to nie „prawdziwe" pliki do S3 |
| Bufor w obrębie requestu | `/tmp` | efemeryczne z założenia — OK |

## 2. Postgres (Railway Postgres Service)

- Osobny Service; publikuje `DATABASE_URL` → appka bierze referencją `${{Postgres.DATABASE_URL}}`.
- Migracje: `drizzle-kit migrate` odpala się na starcie appki (patrz `railway-topologia-i-cli.md`).
- **Backup:** Railway robi snapshoty, ale **przetestuj restore** zanim na nich polegniesz
  (backup bez sprawdzonego restore = złudzenie). Plan przywrócenia → `release-checklist.md`.
- **Czysty start (ważne dla prod):** `start:prod` tylko **migruje**. Seeduj **wyłącznie dane
  referencyjne** (kliniki, pipeline_stages, lead_sources, loginy, chirurdzy) — **NIGDY dem-pacjentów**.
  Demo-seedy zatruwają produkcję. (Memory projektu: „Czysty start: deploy bez seedów".)

## 3. Bucket — Storage Bucket (S3-compatible)

Railway ma natywny **Storage Bucket**, kompatybilny z S3 → działa z każdym klientem S3 bez zmian kodu.

- Endpoint: `storage.railway.app`. Pięć zmiennych okablowuje klienta:

  ```
  S3_ENDPOINT   = https://storage.railway.app   (lub wg dashboardu)
  S3_REGION     = <region>
  S3_BUCKET     = <nazwa-bucketu>
  S3_ACCESS_KEY = <access key>
  S3_SECRET_KEY = <secret key>
  ```

- Użycie: standardowy AWS SDK / S3 client (put/get/delete). Do naszych uploadów (pliki właściciela:
  `/crm/owners/:ownerType/:ownerId/files`).
- ⚠️ **RODO / region EU:** potwierdź, że bucket stoi w regionie **EU** (dane pacjentów). Jeśli Railway
  nie daje pewności co do EU → **plan B: Cloudflare R2** (S3-compatible, wybór regionu EU, te same
  `S3_*`). Do decyzji z Karolem — otwarte w memory („storage-decision-open-ask-karol").

## 4. Volume (trwały dysk)

Dla rzeczy, które MUSZĄ przeżyć redeploy, ale nie są „plikami do S3" (append-logi, mały cache):

- Dashboard: Service → dodaj **Volume**, ustaw **mount path** (np. `/data`).
- Appka pisze pod ten mount, wskazywana zmienną: `FORMS_LOG_DIR=/data/forms-logs`.
- Jeden Volume na Service, ma rozmiar (limit) — to nie nieskończona przestrzeń. Do dużych/licznych
  plików użytkownika → S3, nie Volume.
- Volume przeżywa deploy; **nie** przeżywa usunięcia serwisu. To nie backup.

## 5. Szybki wybór (gdy się wahasz)

```
config/sekret?        → env
rekordy, relacje?     → Postgres
plik użytkownika?     → S3 bucket (EU!)
trwały log/cache?     → Volume (mount)
bufor w tym requeście? → /tmp
```
