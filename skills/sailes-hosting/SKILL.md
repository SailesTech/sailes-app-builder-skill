---
name: sailes-hosting
description: >-
  Hosting i wdrożenia aplikacji Sailes na Railway — jak to naprawdę robimy w produkcji.
  Użyj ZAWSZE gdy: wdrażasz/deployujesz na Railway, ustawiasz zmienne środowiskowe (env,
  variable, secret), podłączasz bazę Postgres (DATABASE_URL), storage plików (S3 bucket,
  Storage Bucket) lub Volume (trwały dysk), konfigurujesz healthcheck / domenę / start:prod
  / migracje na starcie, czytasz logi przez railway CLI (railway logs / link / variables),
  debugujesz „coś się nie wdrożyło" / „zniknęły pliki po redeploy" / „redirect_uri / callback
  URL", albo rejestrujesz URL zwrotny OAuth/webhooka na produkcyjnej domenie.
  Platforma referencyjna = Railway; zasady (env parity, ephemeral FS, warstwy storage,
  smoke po deployu) przenoszą się na inne hostingi. Komplementarny do release-checklist.md
  (brama wydania) — tu jest „jak platforma działa", tam „czy wolno wypuścić".
---

# sailes-hosting — hosting na Railway (jak to robimy naprawdę)

Ten skill to **destylat z realnych wdrożeń** (projekt Idealny Wzrok / custom-overlay-app):
co wiemy o Railway, na co się nadzialiśmy i jak tego nie powtórzyć. Nie zastępuje
dokumentacji Railway — daje **nasz sposób** hostowania backendu Sailes (Fastify + Drizzle +
Postgres + integracje).

> **Oficjalna dokumentacja (źródło prawdy):** <https://docs.railway.com>.
> Gdy coś się nie zgadza z tym plikiem — wygrywa docs Railway + faktyczny stan w dashboardzie.
> Ten skill starzeje się szybciej niż platforma; traktuj go jak mapę, nie jak wyrocznię.

> **Brama wydania jest osobno.** Zanim cokolwiek wypchniesz na produkcję →
> [`../sailes-bootstrap/release-checklist.md`](../sailes-bootstrap/release-checklist.md)
> (parytet env, kolejność migracji vs deploy, smoke po deployu, plan rollbacku).
> Ten skill mówi **jak** platforma działa; tamten **czy wolno** wypuścić. Nie duplikuj bramy tutaj.

---

## 1. Model myślowy Railway (zapamiętaj to raz)

```
Project (np. custom-overlay-app)
 └─ Environment (Dev, production — osobne kopie configu i danych)
     └─ Service (jeden deployowalny byt)
         ├─ App        → nasz backend (Fastify), buduje się z gita
         ├─ Postgres   → baza (wstrzykuje DATABASE_URL)
         └─ (opcjonalnie) Worker / Redis / drugi serwis
```

- **Deploy = `git push` na branch śledzony przez dany Environment.** Railway wykrywa push,
  buduje obraz (Docker/Nixpacks), odpala komendę startową, sprawdza healthcheck, przełącza ruch.
- **Zmiana zmiennej środowiskowej = też redeploy** (automatyczny restart serwisu).
- **Każdy Service ma własny build + własne env + własny healthcheck.** Postgres to osobny Service,
  nie „dodatek" do appki — łączą się przez *reference variable* (`${{Postgres.DATABASE_URL}}`).

### Cztery warstwy stanu — gdzie co żyje (najważniejsza decyzja hostingowa)

| Rodzaj danych | Gdzie | Jak podłączone |
|---|---|---|
| Config / sekrety | **Zmienne env** | dashboard / `railway variables`; `.env.example` = lista prawdy |
| Dane relacyjne | **Postgres** (Service) | `DATABASE_URL` (reference variable) |
| Pliki / bloby (upload, PDF, ZC2) | **Storage Bucket (S3)** | 5× `S3_*` (endpoint `storage.railway.app`) |
| Trwały dysk lokalny (logi, cache) | **Volume** | mount np. `/data`, appka pisze tam (`FORMS_LOG_DIR=/data/...`) |

> 🔒 **Reguła efemerycznego FS (najczęstszy błąd):** system plików kontenera **kasuje się przy
> każdym deployu/restarcie**. Cokolwiek zapisujesz do `./logs`, `/tmp`, uploady na dysk → **znika**.
> Trwałe = **Volume** (mount) albo **S3** (upload). Na tym się nadzialiśmy przy logach formularzy →
> Volume `/data`. Szczegóły: [`references/storage-postgres-bucket-volume.md`](references/storage-postgres-bucket-volume.md).

---

## 2. Kiedy używać tego skilla

- Stawiasz nowy serwis / środowisko na Railway.
- Dodajesz/zmieniasz zmienną env, sekret, callback URL OAuth albo webhooka.
- Podłączasz bazę, bucket na pliki albo Volume.
- Deploy „nie wchodzi", zbudował się stary kod, albo pliki znikają po redeploy.
- Musisz zajrzeć w logi produkcji (`railway logs`) w trakcie zdarzenia (np. przychodzący webhook).

**Nie tu:** logika domenowa integracji → `sailes-pipedrive` / kod. Schemat bazy i migracje jako
takie → `sailes-database`. Decyzja „czy wolno wypuścić" → `sailes-bootstrap/release-checklist.md`.

---

## 3. Ścieżki referencyjne (czytaj wg potrzeby)

| Chcę… | Plik |
|---|---|
| CLI, `link`, topologia project/env/service, build/start, `start:prod`, migracje-na-starcie, `/health`, `$PORT`, domena | [`references/railway-topologia-i-cli.md`](references/railway-topologia-i-cli.md) |
| Zmienne env, sekrety, `.env.example` jako lista prawdy, reference variables, `DRY_RUN`, rejestracja callback/redirect URL, **katalog zmiennych projektu** | [`references/env-i-sekrety.md`](references/env-i-sekrety.md) |
| Postgres vs Bucket(S3) vs Volume — którą warstwę wybrać, efemeryczny FS, dokładne okablowanie env, RODO/EU | [`references/storage-postgres-bucket-volume.md`](references/storage-postgres-bucket-volume.md) |
| Model deployu (push na branch), **gotcha: build-branch ≠ working-branch**, redeploy, `railway logs` (przechwytywanie/czytanie), tabela gotchas, rejestracja callback/webhook URL | [`references/wdrozenie-logi-gotchas.md`](references/wdrozenie-logi-gotchas.md) |

---

## 4. Złote zasady (twarde linie hostingowe)

1. **Zero sekretów w repo/logach.** Sekrety tylko w env Railway; w logach maskuj (`maskPeselInString`).
   `.env.example` = pełna lista kluczy (bez wartości), utrzymywana na bieżąco.
2. **Efemeryczny FS.** Trwałe pliki → Volume albo S3. Nigdy nie zakładaj, że plik zapisany na
   dysku przeżyje redeploy.
3. **Wiedz, który branch Railway buduje i jak jego układ mapuje się na repo.** Roboczy branch nie
   musi być tym, co idzie na produkcję (monorepo, osobne branche deployowe, Root Directory serwisu).
   Zweryfikuj `git ls-tree <remote>/<branch>` zanim uznasz, że „wypchnąłem zmianę".
4. **Prod-owe callback/redirect URL rejestruj dokładnie** (OAuth `redirect_uri`, webhooki) na
   domenie produkcyjnej — musi się zgadzać co do znaku.
5. **Weryfikuj `railway logs`, nie przeczuciem.** „Health 200" nie znaczy „nowy build" ani „działa".
   Potwierdź zachowaniem (probe) albo świeżą linią startową w logu.
6. **Prod zatwierdza człowiek.** Agent nie pushuje na branch deployowy bez wyraźnej prośby
   (bezpiecznik projektu #5). Deploy przechodzi przez `release-checklist.md`.

---

## 5. Ten skill = wiedza żywa

Gdy nauczysz się czegoś nowego o hostingu (nowy gotcha Railway, zmiana zachowania platformy,
lepszy sposób okablowania) — dopisz do właściwego pliku `references/` w formacie
Context → Problem → Reguła. Następna sesja startuje mądrzejsza.
