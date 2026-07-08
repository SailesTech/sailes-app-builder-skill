# Wdrożenie, logi i gotchas

Model deployu na Railway, jak czytać `railway logs`, i lista pułapek, na które warto uważać.
To część, którą najczęściej otworzysz przy „czemu to nie działa na produkcji".

---

## 1. Model deployu: push na branch

- Railway śledzi **jeden branch per Environment**. `git push` na ten branch → auto-build → deploy.
- Alternatywa: `railway up` (deploy z lokalnego katalogu) — rzadziej; normalny flow to push do gita.

> ⚠️ **Wiedz, który branch buduje dany Environment i jaki ma układ katalogów.** Twój roboczy branch
> nie musi być tym, co idzie na produkcję (monorepo, osobne branche deployowe, Root Directory serwisu).
> Zweryfikuj `git ls-tree --name-only <remote>/<branch>` zanim uznasz „wypchnąłem zmianę" — inaczej
> łatwo wypchnąć w złe miejsce i patrzeć, jak Railway buduje stary kod.

## 2. Redeploy — co go wyzwala i jak długo

- Wyzwalacze: (a) push na branch deployowy, (b) zmiana zmiennej env, (c) ręczny „Redeploy" w dashboardzie.
- Czas: zwykle 1–2 min (cache warstw buildu).
- **„Health 200" ≠ „nowy build".** Potwierdź, że leci nowy kod: świeża linia startowa w logu
  (migracje + „listening on :PORT") albo probe zachowania (endpoint zwraca nową odpowiedź).

## 3. `railway logs` — czytanie i przechwytywanie

- `railway logs` = logi **bieżącego** deploymentu (startowe + runtime requestów).
- **Przechwytywanie w trakcie zdarzenia** (przychodzący webhook, OAuth callback): odpal `railway logs`
  w tle do pliku, wywołaj akcję, potem `grep` po markerze:

  ```bash
  railway logs > /tmp/rw.log &     # (w sesji agenta: run_in_background)
  # …wywołaj zdarzenie…
  grep -iE "oauth|webhook|error" /tmp/rw.log
  ```

- **Startup vs runtime:** linie migracji + „listening" to boot; reszta to obsługa requestów.
- **Logi sprzed ostatniego restartu znikają** — jeśli debugujesz jednorazowe zdarzenie, przechwytuj
  na żywo, nie licz na to, że wrócisz do nich później.

## 4. Smoke po deployu (skrót)

Po każdym deployu, zanim powiesz „działa":

1. `GET /health` → 200.
2. Jeden **odczyt** → sensowna odpowiedź.
3. Jeden **zapis** round-trip na bezpiecznych/syntetycznych danych → weryfikacja + sprzątnięcie.
   Wklej realny output, nie „wygląda ok".

Pełna brama: [`../../sailes-bootstrap/release-checklist.md`](../../sailes-bootstrap/release-checklist.md).

## 5. Rollback

- Dashboard → Deployments → wybierz poprzedni udany → **Redeploy** (jeden klik, wraca stary obraz).
- Albo: revert commita na branchu deployowym i push.
- **Plan rollbacku spisz PRZED deployem** (release-checklist). Migracje rozszerzaj addytywnie
  (expand/contract), żeby rollback kodu nie zderzył się ze schematem, którego stary kod nie zna.

## 6. Gotchas (na co uważać)

| Objaw | Przyczyna | Reguła |
|---|---|---|
| Pliki znikają po redeploy | efemeryczny FS kontenera | trwałe → Volume albo S3 (patrz `storage-postgres-bucket-volume.md`) |
| Deploy „nie wchodzi" / buduje stary kod | push w zły branch / zły układ katalogów vs build-branch | `git ls-tree <remote>/<branch>` — sprawdź, co realnie buduje Railway; w multi-serwis `railway status --json` → `source.branch` |
| `tsc: not found` na buildzie monorepo | Nixpacks/Railpack buduje z `NODE_ENV=production` → pomija devDeps | Dockerfile per app + `RAILWAY_DOCKERFILE_PATH`, skasuj `railway.json` → [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §1 |
| Serwis `branch: None` buduje `master` zamiast `dev` | nieprzypięty branch źródłowy → Railway bierze default repo | przypnij branch w dashboardzie (CLI `source connect` zepsute); `railway status --json` → `source.branch` → [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §3 |
| Serwis buduje/startuje złą app mimo poprawnego Dockerfile | stała dashboardowa „Config-as-code file path" nadpisuje wszystko (niewidoczna z CLI) | `railway status --json` → `configErrors`; wyczyść pole w dashboardzie → [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §4 |
| Test na `dev` stworzył realny deal / wysłał realny mail | `dev` wpięty w PROD-owe credki integracji (brak sandboxu) | potwierdź gdzie idą zapisy PRZED smoke; sprzątnij artefakty → [`monorepo-multi-serwis.md`](monorepo-multi-serwis.md) §11 |
| Zapisy do zewn. systemu „nic nie robią" | flaga `*_DRY_RUN=true` na wdrożonym serwisie | sprawdź flagę pierwszą; `false` + realny token do zapisów (patrz `env-i-sekrety.md`) |
| „tsc zielone" a jednak build/typy padają | incremental cache `tsconfig.tsbuildinfo` | usuń buildinfo, odpal typecheck na zimno przed „zielone" |
| Health 200, ale leci stary kod | ruch przełączony, ale to poprzedni build | potwierdź świeżą linią startową w logu / probe zachowania |
| OAuth „Something went wrong" po podmianie/reinstalacji appki | zombie-sesja / stare ciasteczka u dostawcy | instaluj w **incognito** (świeże ciasteczka) |
| OAuth `redirect_uri mismatch` | callback URL nie zgadza się co do znaku | URL u dostawcy = literalnie ten w kodzie (http/https, ukośnik, host) |
| Serwis „unhealthy", brak ruchu | appka nie słucha na `process.env.PORT` | zawsze `PORT` z env, nie hardcode (patrz `railway-topologia-i-cli.md`) |

## 7. Rejestracja URL zwrotnych (przy deployu / zmianie domeny)

Integracje OAuth i webhooki wołają serwis pod jego **domenę** — te URL rejestruje się u dostawcy
i muszą się zgadzać co do znaku. Po wdrożeniu / zmianie domeny przejrzyj i zaktualizuj:

- **OAuth Callback / `redirect_uri`** u dostawcy → prod domena, literalnie jak w kodzie.
- **Webhooki** (URL z sekretem w ścieżce) → prod domena; sekret w env = sekret w zarejestrowanym URL.
- Panele/iframe'y osadzane u dostawcy → prod domena + poprawny CSP `frame-ancestors`.

Zmiana domeny bez przerejestrowania tych URL = integracje **cicho** przestają wołać. Zawsze przejrzyj
tę listę po każdej zmianie hosta. Szczegóły okablowania → [`env-i-sekrety.md`](env-i-sekrety.md).
