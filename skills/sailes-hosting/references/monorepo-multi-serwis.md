# Monorepo + multi-serwis na Railway (stack sailes-async)

Kiedy hostujesz **nie jeden serwis, tylko cały backend async** — pnpm monorepo z kilkoma
deployowalnymi bytami: `apps/api` (intake webhooka) + `apps/worker` (funkcje Inngest) +
**self-hosted Inngest** + Postgres + Redis. To destylat z realnego wdrożenia 5-serwisowego
(projekt SRF / Volubus, `dev` env, EU/RODO), potwierdzony na żywym systemie — nie z teorii.

> Pojedynczy serwis Fastify+Postgres → wystarczy [`railway-topologia-i-cli.md`](railway-topologia-i-cli.md).
> Ten plik dokłada to, co boli **tylko** w monorepo + multi-serwis + self-host.

---

## 1. 🔒 Dockerfile-first, NIE Nixpacks/Railpack (to jest THE recurring pain)

**Reguła:** dla monorepo pnpm na Railway **domyślnie commituj `Dockerfile` per app**. Nixpacks/Railpack
wraca jak bumerang z tym samym błędem i nie ma na to pewnego obejścia.

**Dlaczego Nixpacks pada:** buduje z `NODE_ENV=production`, co **pomija devDependencies** →
`tsc: not found` na buildzie (`typescript` to devDep). `--prod=false` ani inline
`NODE_ENV=development pnpm install` w buildCommand **nie naprawiają tego niezawodnie** — Nixpacks
odpala własną fazę `pnpm i` (przed Twoją komendą) już jako prod-only, a interakcja z cache store'a
pnpm zostawia brakujące devDeps.

**Dockerfile izoluje build od `NODE_ENV` serwisu** (zmienne serwisu nie są auto-`ENV` w krokach
`RUN`), więc devDeps instalują się deterministycznie — tak samo jak lokalny `docker compose`.

Przepis (dosłownie z działającego wdrożenia — `apps/<app>/Dockerfile`, kontekst = **root repo**):

```dockerfile
# Build context = repo root. Select via RAILWAY_DOCKERFILE_PATH=apps/<app>/Dockerfile.
FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate
WORKDIR /app

# Build z devDependencies (tsc). Odizolowane od runtime'owego NODE_ENV serwisu.
ENV NODE_ENV=development
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scope/<app>... build

ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@scope/<app>", "start"]
```

Root `.dockerignore` (bez tego kontekst puchnie i przecieka sekret):

```
node_modules
**/node_modules
**/dist
.git
*.log
.env
.env.*
packages/db/data
```

Wskazanie Dockerfile per serwis: **zmienna serwisu `RAILWAY_DOCKERFILE_PATH`** (np.
`apps/worker/Dockerfile`) — TO jest ustawialne przez `railway variables --set`.

> 🔒 **Gdy przechodzisz na Dockerfile — SKASUJ wszystkie `railway.json`.** Per-app `railway.json`
> (`deploy.startCommand` / `build.builder`) **konfliktuje** z Dockerfile nawet przy poprawnym
> okablowaniu. Realny objaw: serwis `worker` *zbudował* `@scope/worker` przez Docker, ale
> *wystartował* `@scope/api` — bo resztkowy `railway.json` podał `pnpm --filter @scope/api start`
> jako override komendy startu → crash loop `Cannot find module /app/apps/api/dist/index.js`.
> Docker `CMD` **nie ma gwarancji, że wygra** z dwoma źródłami prawdy. Po przejściu na
> `Dockerfile` + `RAILWAY_DOCKERFILE_PATH` jedynym źródłem prawdy dla build+start ma być Dockerfile.

---

## 2. 🔒 Ground truth = `railway status --json` (nie dashboard, nie „ustawiłem zmienną")

Dashboardowe pola i `railway variables` **nie mówią, co się stało na ostatnim deployu**. Jedyny
pewny sposób odróżnić „ustawiłem `RAILWAY_DOCKERFILE_PATH`" od „Railway tego faktycznie użył":

```bash
railway status --json
```

Zejdź do `environments[].node.serviceInstances[].node` i czytaj:

| Pole | Co mówi |
|---|---|
| `source.branch` | **branch faktycznie przypięty** (`None` = buduje domyślny branch GitHuba, patrz §3) |
| `startCommand` (poziom node serwisu) | dashboardowy override komendy startu, jeśli ustawiony |
| `latestDeployment.meta.serviceManifest.build.builder` | `RAILPACK` vs `DOCKERFILE` — czym NAPRAWDĘ zbudował |
| `latestDeployment.meta.serviceManifest.build.dockerfilePath` | rozwiązana ścieżka Dockerfile albo `None` |
| `latestDeployment.meta.serviceManifest.deploy.startCommand` | komenda, która NAPRAWDĘ wystartowała |
| `latestDeployment.meta.configErrors` | **tell dla §4** — stała/zła ścieżka config-as-code ląduje tu jako string |

To pierwsza rzecz, którą odpalasz, gdy serwis buduje/startuje „nie to co myślisz".

---

## 3. Gotcha: `branch: None` buduje DOMYŚLNY branch GitHuba, nie ten, na który pushujesz

`source.branch = None` na serwisie → Railway buduje **domyślny branch repo** (np. `master`),
a nie branch z Twoimi Dockerfile'ami/fixami (np. `dev`) → cichy fallback na Railpack i budowa
starego/złego kodu. `RAILWAY_DOCKERFILE_PATH` jest **konieczny, ale nie wystarczający** — plik musi
istnieć **na budowanym branchu**, więc branch źródłowy trzeba najpierw przypiąć poprawnie.

> `git ls-tree <remote>/<branch> <path>` mówi tylko, co jest na branchu — **nie** który branch buduje
> serwis z `branch: None`. Sprawdź przypięty branch wprost (§2, `source.branch`).

**`railway service source connect --branch <b> --service <svc>` JEST ZEPSUTE** dla istniejących
serwisów — zwraca `ServiceInstance not found` niezależnie od wersji CLI (potwierdzone 5.5.0 i 5.25.0),
selektora (nazwa, ID, `-e <envId>`, `-e dev`, `-p <projectId>`) i nawet po `source disconnect`.
**Nie trać na to więcej niż jednej próby.** Obejścia (kolejność od najpewniejszego):

1. **Dashboard → Service → Settings → Source → Branch = `dev`** — jedyny niezawodny fix.
2. `gh repo edit owner/repo --default-branch dev` — jeśli serwis ma `branch: None` i godzisz się
   zmienić realny domyślny branch repo (serwis z `None` podąża za domyślnym).
3. `railway up` — deploy lokalnego checkoutu, omija rozwiązywanie brancha z gita. **Uwaga:** NIE
   omija pułapki config-as-code z §4 (nadal honoruje ustawienie serwisu).
4. Przy **tworzeniu** serwisu z CLI: `railway add --repo … --branch dev -s <name>` ustawia branch
   poprawnie od razu — zepsute jest tylko *rekonektowanie* istniejącego serwisu.

---

## 4. Gotcha: „Config-as-code file path" — pole dashboardowe niewidoczne z CLI

Per-serwis ustawienie **Settings → Config-as-code file path** (np. omyłkowo `apps/api/railway.json`):
- **nie jest env varem** (niewidoczne w `railway variables`),
- **nie da się go ustawić/wyczyścić z CLI** — tylko dashboard,
- **cicho nadpisuje** wszystko inne, łącznie z `RAILWAY_DOCKERFILE_PATH`.

Gdy plik, na który wskazuje, zniknie z repo → `configErrors: ["service config at '…railway.json' not
found"]`, a Railway **nie pada głośno — cicho spada na Railpack**, ignorując `RAILWAY_DOCKERFILE_PATH`.
`railway up` też tego nie omija.

**Reguła:** serwis uparcie buduje/startuje źle mimo poprawnego Dockerfile? Sprawdź
`latestDeployment.meta.configErrors` (§2) NAJPIERW. Wyczyść pole w dashboardzie (Service → Settings →
Config-as-code). **Różne serwisy w jednym projekcie mają różne (i różnie nieświeże) wartości tego
pola — sprawdź każdy z osobna**, fix z `api` nie musi dotyczyć `worker`.

---

## 5. Region: `railway add`/GitHub-integration nie ma flagi regionu → domyślnie US

Po utworzeniu każdego serwisu przenieś go do EU (RODO — PL PII zostaje w regionie):

```bash
railway scale <svc> eu-west=1 us-west=0 us-east=0
```

- Aliasy istniejących serwisów: `us-west` / `eu-west`; świeży serwis potrafi odrzucić `sfo`.
- **Stateful** (Postgres/Redis) łapią krótki downtime migracji wolumenu przy skalowaniu — zrób to
  na starcie, nie na żywym ruchu. Produkcja musi być EU od początku; `dev` też, dla parytetu.

---

## 6. Sieć prywatna, `PORT` i domeny między serwisami

- Serwisy gadają po prywatnej sieci: **`<service>.railway.internal`** (`RAILWAY_PRIVATE_DOMAIN`).
  Port docelowy = ten, na którym app faktycznie słucha (brak osobnej warstwy mapowania portów).
- **Railway wstrzykuje `PORT` tylko serwisowi z publiczną domeną.** Serwis internal-only (np.
  `worker`) `PORT`-a nie dostaje → jeśli inny serwis adresuje go po stałym porcie, **przypnij `PORT`
  jawnie** jako zmienną serwisu (np. `worker` → `PORT=3001`, żeby zgadzał się z `--sdk-url` Inngesta).
- Wygeneruj publiczną domenę serwisowi, gdy musisz go curlnąć z zewnątrz:
  ```bash
  railway domain -s <service> --port <port>
  ```
  Domyślnie żaden serwis nie ma publicznej domeny. Serwis z domeną dostaje `PORT` wstrzyknięty
  automatycznie (np. `api` → 8080); internal-only nie.
- App bindują dual-stack `::` na `process.env.PORT` → log `Server listening at http://[::]:8080`
  jest **normalny**, nie błąd.

---

## 7. Self-hosted Inngest (własny serwis, nie Inngest Cloud)

- Obraz **pinuj** (`inngest/inngest:v1.35.0`), nie `latest`. Port `8288` = Event API + API + Dashboard.
  **Ten obraz nie honoruje wstrzykniętego `$PORT`** — ustaw `--port=8288` jawnie (i/lub `INNGEST_PORT`).
- Custom Start Command. **Potwierdzona na żywo** (debrief) komenda jest krótka — postgres/redis/klucze
  idą przez **env** (`INNGEST_POSTGRES_URI` / `INNGEST_REDIS_URI` / `INNGEST_EVENT_KEY` /
  `INNGEST_SIGNING_KEY`, które obraz czyta z environmentu), jawne są tylko `--sdk-url` + `--poll-interval`:
  ```
  inngest start --sdk-url=http://worker.railway.internal:3001/api/inngest --poll-interval=60
  ```
  Klucze **hex, parzysta długość** (`openssl rand -hex 32`) — nie-hex signing key **crashuje serwer
  na boot**. Alternatywnie te same wartości można podać jako flagi (`--postgres-uri` / `--redis-uri` /
  `--event-key` / `--signing-key` / `--port=8288`) zamiast env — plan ze spec; na tym wdrożeniu
  poszły env-em, a jawny był tylko `--sdk-url` + `--poll-interval`.
- **Health-check self-host = GraphQL, nie REST.** `/v0/apps` zwraca 404; pole `synced` na `apps`
  nie istnieje. Zdrowie = `error:null` + niepusta `functions`:
  ```bash
  curl -s -X POST "https://<inngest-domain>/v0/gql" -H "Content-Type: application/json" \
    -d '{"query":"{ apps { id name url error functions { name slug } } }"}'
  ```
- **Jeden Postgres, dwie bazy** (decyzja właściciela — taniej niż drugi plugin): app używa domyślnej
  bazy `railway` (`DATABASE_URL`), Inngest osobnej `inngest` w **tej samej** instancji
  (`CREATE DATABASE inngest;`), adresowanej `INNGEST_POSTGRES_URI` po internal hoście
  `postgres.railway.internal` ze ścieżką `/inngest`. Tabele `inngest_*` nie kolidują z app-owymi;
  drizzle-owy `__drizzle_migrations` żyje tylko w `railway`. **Nie odpalaj migracji Drizzle na bazie
  `inngest`.** Redis (osobny plugin) czyta **tylko** Inngest.
- Lokalnie odwrotnie: `inngest dev --no-discovery -p 8288` (bez kluczy; SDK łączy się przez
  `INNGEST_DEV=1`). W kontenerze dev rejestracja workera z hosta: `INNGEST_SERVE_HOST=http://host.docker.internal:3001`.

---

## 8. CLI dla agentów: `RAILWAY_TOKEN` w scope User/Machine

Sesja `railway login` (przeglądarkowa) **wygasa w trakcie** → `railway status --json` zwraca pusto /
`Unauthorized` → `railway login` ponownie. Dla użycia headless/agentowego token **musi** być w
rejestrze env User/Machine, nie tylko w bieżącej powłoce:

```powershell
setx RAILWAY_TOKEN <token>            # albo:
[Environment]::SetEnvironmentVariable('RAILWAY_TOKEN', $token, 'User')
```

`$env:RAILWAY_TOKEN = …` w jednej sesji **nie jest dziedziczone** przez procesy potomne odpalane
przez narzędzia/agenta — każdy startuje świeżo i widzi tylko env z rejestru (User/Machine).

> **Warstwowanie env `--env-file` = LAST-file-wins.** `node --env-file=.env --env-file=override.env`
> → późniejszy plik **nadpisuje** wcześniejszy dla tego samego klucza (tylko ambient `process.env`
> nigdy nie jest nadpisany). Autorytatywny override daj **ostatni**; żeby wymusić wartość niezależnie
> od plików — ustaw ją w ambient env. Dotyczy lokalnych runów i layeringu env pod Railway.

---

## 9. Dostęp do Railway Postgres z laptopa (weryfikacja rzędów po smoke)

- Wewnętrzny `DATABASE_URL` (`*.railway.internal`) jest **nieosiągalny spoza** sieci Railway, a
  `railway run <cmd>` wykonuje komendę **lokalnie** (tylko wstrzykuje env) → też nie dosięgnie
  internal hosta. Użyj **`DATABASE_PUBLIC_URL`**:
  ```bash
  railway variables -s Postgres --json | python -c "import sys,json;print(json.load(sys.stdin)['DATABASE_PUBLIC_URL'])"
  ```
  (przez `python -c`, żeby nie echować URL-a z credkami do historii/logów.)
- Skrypt z `pg` odpalaj **z wnętrza `packages/db`**, nie z roota — pnpm nie-hoistuje `node_modules`,
  więc `pg` nie rozwiązuje się w roocie monorepo.

---

## 10. Migracje: NIE zakładaj migrate-on-start w tym układzie

Uwaga na różnicę względem pojedynczego serwisu (gdzie `start:prod = drizzle-kit migrate && …server`):
w układzie **Dockerfile-only** `CMD` to czyste `pnpm --filter @scope/<app> start` (= `node dist/index.js`),
**bez** kroku migracji. `preDeployCommand` z `railway.json` zniknął razem z `railway.json` (§1).

**Efekt: migracje są ręcznym krokiem** (`pnpm db:migrate` / `drizzle-kit migrate`) po deployu, który
zmienia schemat. Nie zakładaj, że świeży deploy sam się zmigruje. Opcje:
- ręcznie `railway run pnpm --filter @scope/db db:migrate` (jeden serwis-właściciel migracji — dwa
  serwisy naraz ścigałyby się o tabelę `__drizzle_migrations`), albo
- świadomie wpiąć release/`preDeployCommand` (kompromis: przy dużej skali migracja blokuje start).

> ⚠️ **Enum w jednej transakcji:** `ALTER TYPE … ADD VALUE 'x'` + użycie `'x'` w tej samej transakcji
> **pada w Postgresie** i nie ujawnia się na świeżej/pustej bazie lokalnej. Zweryfikuj taką migrację
> na **realnym** Postgresie zanim zaufasz automatowi. (Potwierdzony gate na tym wdrożeniu.)

---

## 11. 🔴 KRYTYCZNE: środowisko `dev` może trzymać PRODUKCYJNE credki integracji

Najważniejszy fakt z tego wdrożenia: `dev` był wpięty w **realne produkcyjne** credki Pipedrive /
SendGrid / Airtable / Google Maps — **nie ma sandbox/staging** dla żadnego z nich. **Każdy testowy
webhook wysłany na `dev` pisze do produkcyjnych systemów.** Smoke test stworzył realną osobę +
deal w Pipedrive i wysłał realny e-mail.

- Lane qualify miał skip-write (`SRF_SKIP_QUALIFICATION_WRITE=1`); **lane price NIE miał** żadnej
  flagi dry-run → każdy test lane'u price = realne zapisy do prod.
- Sprzątanie artefaktów testowych:
  ```bash
  curl -X DELETE "https://<company>.pipedrive.com/api/v1/deals/<dealId>?api_token=<token>"
  curl -X DELETE "https://<company>.pipedrive.com/api/v1/persons/<personId>?api_token=<token>"
  ```

**Reguła:** zanim odpalisz smoke na `dev`, **potwierdź gdzie realnie idą zapisy.** Traktuj każdy
webhook na `dev` jak produkcyjny zapis, dopóki nie ma osobnych sandbox-credków albo flagi
`DRY_RUN`/skip-write na każdym lane. To nie jest domyślnie załatwione — wymaga decyzji + zmiany kodu.

> **Podpis webhooka przy smoke:** HMAC licz nad **dokładnie tymi bajtami, które wysyłasz** — zapisz
> payload do pliku, podpisz surowy bufor pliku, potem `curl --data-binary @plik`. Nie pozwól curlowi
> ani powłoce prze-serializować/prze-cytować JSON-a między podpisaniem a wysłaniem (inaczej `401
> invalid_signature`). Świeży `submission_id` (UUID) per test — inaczej idempotencja zwróci `duplicate`
> zamiast realnie przejść pipeline.

---

## 12. Weryfikacja prod-buildu, nie „zielony typecheck"

Prod boot potrafi paść w miejscach, których dev (tsx) i testy (vitest) **nie dotykają** — bo oba
to loadery TS. Np. package `exports` wskazujące na `./src/index.ts` bootuje pod tsx, ale
`node dist/index.js` w prod rzuca `ERR_MODULE_NOT_FOUND …src/schema.js` (resolver ESM woli `exports`
nad `main`). Fix: conditional exports `{".":{"types":"./src/index.ts","development":"./src/index.ts","default":"./dist/index.js"}}`
+ `--conditions=development` w dev-skrypcie tsx.

**Reguła:** hosting-krytyczne zmiany weryfikuj odpalając **skompilowany artefakt**
(`node dist/index.js` + curl `/health`), nigdy nie ufaj samemu zielonemu typecheck/testom — oba
maskują prod-ową ścieżkę rozwiązywania modułów. (Patrz też `lessons.md` w projekcie źródłowym —
Windows ESM entrypoint musi używać `pathToFileURL`.)
```
