# Zmienne środowiskowe i sekrety na Railway

Config i sekrety NIE żyją w repo — żyją w env Railway. `.env.example` to lista prawdy (klucze
bez wartości). Ten plik: jak zarządzać env + pełny katalog zmiennych projektu.

---

## 1. Jak ustawiać zmienne

- **Dashboard:** Service → Variables → dodaj/edytuj. Zmiana → **automatyczny redeploy**.
- **CLI:** `railway variables` (lista), `railway variables --set KLUCZ=wartosc` (ustaw).
- **Raw editor** w dashboardzie przyjmuje wklejenie bloku `KEY=VALUE` — wygodne przy stawianiu
  środowiska od zera z `.env.example`.

> Każda zmiana env restartuje serwis. Po zmianie **poczekaj na health 200** zanim testujesz —
> stary kontener chwilę jeszcze odpowiada.

## 2. `.env.example` = lista prawdy (parytet env)

- Każda zmienna, którą kod czyta (`loadConfig()` / `process.env.X`), MUSI być w `.env.example`
  (klucz + komentarz, bez sekretnej wartości).
- Przed deployem: **parytet** — czy każdy klucz z `.env.example` istnieje w env Railway?
  Brakująca zmienna = crash na starcie albo cichy zły tryb (np. `DRY_RUN` zostaje `true`).
  Ten check jest częścią `sailes-bootstrap/release-checklist.md` — użyj go.
- Walidacja na starcie: kod powinien twardo failować, gdy brakuje krytycznej zmiennej
  (lepiej crash z jasnym komunikatem niż działanie w złym trybie).

## 3. Reference variables (nie kopiuj wartości między serwisami)

Zmienne można **referencjonować** z innego serwisu zamiast wklejać wartość:

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

- Railway Postgres sam publikuje `DATABASE_URL`; appka bierze go referencją → zero ręcznego
  przepisywania, zero rozjazdu przy rotacji hasła bazy.
- Tej samej techniki użyj do współdzielonych sekretów między serwisami w jednym środowisku.

## 4. Sekrety — higiena

- Nigdy w repo, nigdy w logu (poza maską). PESEL/dane pacjenta → `maskPeselInString`, w błędach też.
- Rotacja: zmień w env Railway → redeploy. Jeśli sekret wyciekł do gita — rotuj u źródła
  (Pipedrive/Thulium/Medfile), nie licz na `git filter-branch`.
- Klucze szyfrujące (`FIELD_ENCRYPTION_KEY`) — utrata = utrata dostępu do zaszyfrowanych pól
  (np. PESEL w `patient_identifiers`). Trzymaj bezpiecznie i **nie zmieniaj** bez planu re-encrypt.

## 5. Wzorzec `DRY_RUN` (bezpieczne testy na wdrożonym serwisie)

Zapisy do zewnętrznych systemów bramkuj flagą:

```
PIPEDRIVE_DRY_RUN = true   # test: zwraca syntetyczne ID (np. 900001), NIE dotyka realnego Pipedrive
PIPEDRIVE_DRY_RUN = false  # produkcja: realny zapis
```

- Pozwala wdrożyć i przeklikać flow bez zaśmiecania realnego CRM.
- **Gotcha:** wdrożony serwis z `DRY_RUN=true` „działa", ale nic realnie nie zapisuje. Gdy user mówi
  „stworzyłem leada a nic nie ma w Pipedrive" — sprawdź tę flagę PIERWSZĄ. Do realnych zapisów:
  `false` + ustawiony realny token.

## 6. Callback / redirect URL na domenie produkcyjnej

Integracje OAuth i webhooki wołają NAS pod **produkcyjną domenę** — te URL rejestruje się
u zewnętrznego dostawcy i muszą się zgadzać co do znaku:

- **OAuth `redirect_uri`** (Pipedrive Developer Hub → Callback URL):
  `https://custom-overlay-app-dev.up.railway.app/oauth/callback` — literalnie to samo co w kodzie.
  Rozjazd (http/https, ukośnik na końcu, inny host) → `redirect_uri mismatch` / „Something went wrong".
- **Webhooki** (Thulium, Medfile) → URL z sekretem w ścieżce, np.
  `.../webhooks/thulium/<THULIUM_WEBHOOK_SECRET>`. Sekret w env = sekret w zarejestrowanym URL.
- Zmiana domeny (custom domain) = trzeba przerejestrować WSZYSTKIE te URL u dostawców.

## 7. Katalog zmiennych projektu (Idealny Wzrok — wzorzec)

Grupowo, żeby stawiając nowe środowisko nic nie zgubić:

| Grupa | Zmienne | Uwagi |
|---|---|---|
| Baza | `DATABASE_URL` | reference `${{Postgres.DATABASE_URL}}` |
| Krypto | `FIELD_ENCRYPTION_KEY` | szyfrowanie pól wrażliwych (PESEL); nie gubić |
| Medfile | `MEDFILE_*` (klucze RS256, URL API, master/child) | PROTECTED CORE — patrz kod, nie zgaduj |
| Pipedrive | `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_DOMAIN`, `PIPEDRIVE_DRY_RUN`, `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET`, `PIPEDRIVE_PANEL_JWT_SECRET` | token routinguje po instancji (sprawdź `/v1/users/me`); JWT panelu HS256 = client_secret |
| Webhooki | `MEDFILE_WEBHOOK_SECRET`, `THULIUM_WEBHOOK_SECRET` | sekret siedzi w ścieżce URL webhooka |
| Formularze WWW | `SAILES_FORMS_KEY`, `FORMS_LOG_DIR` | klucz `X-Api-Key`; `FORMS_LOG_DIR=/data/forms-logs` → **Volume** |
| Thulium API | `THULIUM_API_USER`, `THULIUM_API_PASS`, `THULIUM_API_BASE_URL` | Basic auth; enrich nazwiska + click-to-call; default base `https://idealnywzrok.thulium.com/api` |
| Storage plików | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Railway Storage Bucket — patrz `storage-postgres-bucket-volume.md` |

> Lista bywa nieaktualna szybciej niż kod — **`.env.example` w repo integrations jest źródłem prawdy**.
> Ten katalog to mapa grup, nie zamiennik parytetu z `.env.example`.
