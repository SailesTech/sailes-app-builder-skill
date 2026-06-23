# Manifest, OAuth2 i rejestracja w Developer Hubie

> **Oficjalna dokumentacja (źródło prawdy):**
> https://pipedrive.readme.io/docs/app-extensions
> Gdy ten skill nie odpowiada na pytanie (nowy typ rozszerzenia, dokładny kształt
> manifestu/pól, zmiany w API) — sprawdź tam, zanim zgadniesz.

## Manifest

Apka serwuje manifest pod `GET /manifest.json` z funkcji `manifest()` w
`server.mjs`. Kształt z repo:

```js
function manifest() {
  return {
    schema_version: '1.0',
    name: appName,
    description: '…',
    version: appVersion,
    auth: {
      type: 'oauth2',
      redirect_uri: `${appUrl}/oauth/callback`,
      scopes: pipedriveScopes,   // np. ['base','deals:read','users:read','activities:read','contacts:read']
    },
    settings: { url: `${appUrl}/settings` },   // ekran ustawień (iframe)
    ui_extensions: [
      { key: 'frejowski-sales-dashboard', type: 'custom_floating_window',
        label: 'Sales Dashboard', icon: `${appUrl}/icon.svg`, url: `${appUrl}/?pipedrive=1` },
      // …kolejne okna/panele
    ],
  };
}
```

**Dodanie nowej wtyczki = nowy wpis w `ui_extensions[]`** (dla floating window /
modal). JSON panele i Custom UI panele konfiguruje się w samym Developer Hubie
(URL endpointu/iframe'a), niekoniecznie w tej tablicy — zależnie od typu. Sprawdź
w dokumentacji, co konfiguruje się w manifeście, a co w panelu Hub.

## Zmienne środowiskowe (Pipedrive)

| Zmienna | Do czego |
|---|---|
| `APP_URL` | Bazowy URL apki (redirect_uri, URL-e iframe'ów). Wymagane przy OAuth. |
| `PIPEDRIVE_CLIENT_ID` / `PIPEDRIVE_CLIENT_SECRET` | OAuth2 z Developer Huba. |
| `PIPEDRIVE_JWT_SECRET` | Sekret do weryfikacji sygnowanych tokenów paneli (fallback: `CLIENT_SECRET`). **Musi** == JWT secret wtyczki w Hubie. |
| `PIPEDRIVE_API_TOKEN` | Globalny token API (proxy `/api/pd/*`, import, webhooki). Nigdy do frontu. |
| `PIPEDRIVE_SCOPES` | Scope'y OAuth (string rozdzielony spacjami). |

## OAuth2 (instalacja apki)

Potrzebne tylko, gdy apka jest instalowalna per-konto (multi-tenant). Flow w
`server.mjs`:

1. **`GET /oauth/install`** — generuje `state` (CSRF, zapis w `oauth_states`),
   redirect na `https://oauth.pipedrive.com/oauth/authorize` z `client_id`,
   `redirect_uri`, `scope`, `state`.
2. **`GET /oauth/callback`** — odbiera `code`+`state`, wymienia kod na tokeny
   (`exchangeCodeForToken`), czyta usera (`/users/me`), zapisuje instalację w
   tabeli `installations` (`company_key`, `access_token`, `refresh_token`,
   `expires_at`).
3. **Odświeżanie** — `ensureValidAccessToken(companyKey, installation)` odświeża
   token z 30-sekundowym buforem przed wygaśnięciem.

Token API per-firma trzymamy w `installations`; globalny `PIPEDRIVE_API_TOKEN`
służy do importu/proxy/webhooków.

## Rejestracja w Developer Hubie — krok po kroku

1. **Developer Hub** → Twoja apka (lub utwórz nową).
2. **OAuth & access scopes** — ustaw `Callback URL` = `<APP_URL>/oauth/callback`,
   zaznacz scope'y zgodne z `pipedriveScopes`. Skopiuj `client_id`/`client_secret`
   do env.
3. **App extensions** → *Create* i wybierz typ:
   - **JSON panel** → podaj `Api endpoint` = `<APP_URL>/api/pd-panel/<nazwa>`,
     location (np. Deal details).
   - **Custom UI → Panel** → `Iframe URL` = `<APP_URL>/pd-ui/<nazwa>`, location.
   - **Custom floating window / modal** → `Iframe URL` = route apki.
   - **Link/app action** → URL akcji.
4. **JWT secret** — przy panelach Pipedrive pokazuje sekret do podpisu tokenów.
   Wpisz go jako `PIPEDRIVE_JWT_SECRET` (musi się zgadzać, inaczej ACL = deny).
5. **Settings page** — `<APP_URL>/settings` (zgodnie z `settings.url`).
6. **Zapisz / opublikuj** zmiany; przeinstaluj apkę na koncie testowym, jeśli
   zmieniałeś scope'y lub zestaw rozszerzeń.
7. Po deployu na Railway zweryfikuj, że `GET /manifest.json` zwraca aktualny
   manifest i że iframe URL-e są publicznie dostępne (HTTPS).

> Dokładne nazwy pól w Hubie i wymagane uprawnienia bywają aktualizowane —
> w razie rozjazdu trzymaj się tego, co pokazuje
> https://pipedrive.readme.io/docs/app-extensions.
