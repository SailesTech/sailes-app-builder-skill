# Railway — topologia, CLI, build & start

Jak ułożony jest projekt na Railway i jak nim sterować z terminala. Wartości konkretne
pochodzą z projektu Idealny Wzrok (`custom-overlay-app`) — traktuj jak wzorzec.

---

## 1. CLI — instalacja i logowanie

```bash
npm i -g @railway/cli          # instalacja globalna
railway login                  # logowanie (otwiera przeglądarkę)
railway whoami                 # potwierdź konto
```

- W środowiskach headless/agentowych logowanie robi człowiek (`railway login`) — token siedzi w
  profilu. Jeśli sesja nie ma tokena, poproś użytkownika o `! railway login`.
- Sesja `railway login` **wygasa w trakcie** (objaw: `railway status --json` pusto / `Unauthorized`).
  Dla trwałego użycia agentowego ustaw `RAILWAY_TOKEN` w scope **User/Machine** (`setx RAILWAY_TOKEN
  <token>`), nie tylko w bieżącej powłoce — procesy potomne dziedziczą tylko env z rejestru
  (patrz [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §8).
- `railway --help` / `railway <cmd> --help` — CLI bywa aktualizowane, sprawdzaj flagi na miejscu.

## 2. Podpięcie do projektu (`link`) — NIE-interaktywnie

`railway link` bez argumentów odpala interaktywny wybór (zawiesza agenta). Podaj **wszystkie trzy**:

```bash
railway link -p <project> -e <environment> -s <service>
railway status                 # potwierdź: project / environment / service
```

- `-p` project, `-e` environment (Dev|production), `-s` service (App|Postgres|…).
- Brak któregoś → CLI dopyta interaktywnie. Zawsze podawaj komplet.
- Po `link` komendy (`logs`, `variables`, `run`) działają na wybranym serwisie/środowisku.

## 3. Topologia (przykład z projektu)

```
Project:      custom-overlay-app
Environments: Dev  (branch deployowy: dev  → custom-overlay-app-dev.up.railway.app)
              production (osobno)
Services:     Custom-Overlay-App   (Fastify backend, build z gita)
              Postgres             (baza; wstrzykuje DATABASE_URL)
```

- **Environment = izolowana kopia** configu i danych. Zmienne z `Dev` nie przeciekają do `production`.
- **Service = jeden deployowalny byt** z własnym buildem, env i healthcheckiem.
- Postgres to osobny Service. Appka bierze URL przez reference variable — patrz `env-i-sekrety.md`.

## 4. Build

- Railway buduje z **Dockerfile** (jeśli jest w katalogu roota serwisu) albo **Nixpacks** (auto-detekcja).
- **Root Directory** (ustawienie serwisu) wskazuje podkatalog w monorepo, z którego budować.
  W tym repo build leci ze *spłaszczonego* brancha (`apps/*` w root, nie `app/apps/*`) —
  patrz gotcha w [`wdrozenie-logi-gotchas.md`](wdrozenie-logi-gotchas.md).
- Warstwy są cache'owane → kolejne buildy są szybsze (zwykle 1–2 min).
- **Monorepo pnpm:** nie zdawaj się na Nixpacks (buduje z `NODE_ENV=production` → pomija devDeps →
  `tsc: not found`). Commituj `Dockerfile` per app + zmienną serwisu `RAILWAY_DOCKERFILE_PATH` i
  skasuj `railway.json` → [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §1.

## 5. Start i migracje na starcie

Komenda startowa (`start:prod`) robi **migracje, potem serwer**:

```jsonc
// package.json (integrations)
"start:prod": "drizzle-kit migrate && tsx src/server.ts"
```

- **Migracje odpalają się przy każdym boot** (idempotentnie). Notka typu
  `schema "drizzle" already exists, skipping` w logach = **normalne**, nie błąd.
- Zaleta: deploy = automatyczna migracja, zero ręcznego kroku. Wada: przy dużej skali migracja
  blokuje start — wtedy wydziel osobny krok „migrate" przed „serve". Na naszej skali: OK jak jest.
- Kolejność migracja-vs-deploy przy zmianach schematu → `release-checklist.md` (rozszerzaj addytywnie,
  nie destrukcyjnie, żeby stary i nowy kod przeżyły okno deployu).
- **Uwaga (Dockerfile-only monorepo):** gdy `CMD` to czyste `… start` (bez `drizzle-kit migrate`),
  migracje NIE lecą na starcie — są ręcznym krokiem po deployu. Nie zakładaj auto-migracji →
  [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §10 (+ pułapka enum w jednej transakcji).

## 6. `$PORT` i healthcheck

- **Railway wstrzykuje `PORT`.** Appka MUSI słuchać na `process.env.PORT` (u nas ląduje na `:8080`).
  Zahardkodowany port = serwis „unhealthy" i brak ruchu.
- **Healthcheck `/health`** → 200, szybki, **bez auth**. Zwraca np. `{"status":"ok"}` (opcjonalnie
  sprawdza DB). Railway pinguje ten endpoint; brak 200 w oknie startowym = deploy uznany za nieudany
  (rollback do poprzedniego). Ustaw ścieżkę healthchecku w Settings serwisu.

## 7. Domena

- Auto: `<service>-<env>.up.railway.app` (u nas `custom-overlay-app-dev.up.railway.app`).
- Custom domena: Settings → Networking → dodaj domenę → CNAME u rejestratora.
- **Domena produkcyjna wchodzi do konfiguracji integracji** (OAuth redirect_uri, webhook URL) —
  patrz `env-i-sekrety.md`.

## 8. Przydatne komendy

```bash
railway status                 # gdzie jestem (project/env/service)
railway status --json          # GROUND TRUTH: source.branch, build.builder/dockerfilePath, startCommand, configErrors
railway variables              # wypisz zmienne serwisu
railway variables --set K=V    # ustaw zmienną (wywoła redeploy)
railway logs                   # logi bieżącego deploymentu (patrz gotchas: przechwytywanie)
railway up                     # deploy z lokalnego katalogu (rzadko — my deployujemy przez git push)
railway run <cmd>              # uruchom komendę lokalnie z env serwisu (np. jednorazowy skrypt)
```

> `railway run` wciąga produkcyjne env do lokalnej komendy — wygodne do jednorazowych skryptów
> (np. reconcile), ale **ostrożnie**: to realne dane/sekrety. Nie odpalaj destrukcyjnych rzeczy „na próbę".
