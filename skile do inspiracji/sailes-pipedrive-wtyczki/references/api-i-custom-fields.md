# Pipedrive API: proxy i custom fields

> Dokumentacja API: https://developers.pipedrive.com/docs/api/v1
> App Extensions: https://pipedrive.readme.io/docs/app-extensions

## Proxy `/api/pd/*` (czytanie z frontu bez wycieku tokenu)

Front **nigdy** nie widzi `PIPEDRIVE_API_TOKEN`. Wszystko leci przez proxy w
`server.mjs`, które wstrzykuje token serwerowo:

```js
if (url.pathname.startsWith('/api/pd/') || url.pathname === '/api/pd') {
  const apiPath = url.pathname.replace(/^\/api\/pd/, '') || '/';
  const apiParams = new URLSearchParams(url.searchParams.toString());
  apiParams.set('api_token', process.env.PIPEDRIVE_API_TOKEN);
  const apiUrl = `https://api.pipedrive.com/v1${apiPath}?${apiParams.toString()}`;
  // forward + odeślij odpowiedź
}
```

Z frontu:

```ts
const res = await fetch('/api/pd/deals?status=all_not_deleted&limit=500');
const { data } = await res.json();
```

W devie Vite proxuje `/api/pd` na `api.pipedrive.com` i też dokleja token (patrz
`vite.config.ts`).

## Custom fields = hashowane klucze

Pola niestandardowe Pipedrive mają klucze w postaci 40-znakowego hasha (nie
czytelnej nazwy). Centralna mapa: `src/api/pipedrive.ts` (`FIELDS`). Przykłady:

```ts
const FIELDS = {
  SUCCESS_FEE_PCT:     '302194de822306b39b40ef122264754e343fc673',
  UPFRONT_FEE:         '2a925f4dafaa2c38373499f529057462022ca943',
  PARCELS_COUNT:       'c08a7719bd23366db4afe86a740605280cd178b4',
  LAND_REGISTER_NUMBER:'e30103af71e92443e7cd9030eef8e14b66a6e3e8', // numer KW
  CONTRACT_STATE:      '75c4b4ec6660678ea2418609c203e35b64782112', // enum (ukryte)
  AUTENTI_STATUS:      '47291212a20ee60dbbecf9fb4712947750269bf2',
  // …pełna lista w pliku
};
```

**Zasady:**
- Nie wpisuj hashy „na sztywno" rozsianych po kodzie — dodawaj do mapy `FIELDS`
  i importuj. Tak robi reszta repo.
- Nowy hash bierzesz z Pipedrive: `GET /dealFields` (albo `personFields` /
  `organizationFields`) i szukasz po `name` → `key`.
- **Pola enum/select** przechowują **numeryczne ID opcji**, nie tekst. Mapuj
  etykiety na ID:

```ts
const CONTRACT_STATE_OPTIONS = {
  'Do wygenerowania': 99,
  'W podpisie – Autenti': 100,
  'Do wgrania podpisanej': 101,
  'Zakończona': 102,
};
```

## Zapis pól na dealu

```js
async function setDealFields(dealId, fields) {
  const u = new URL(`https://api.pipedrive.com/v1/deals/${dealId}`);
  u.searchParams.set('api_token', process.env.PIPEDRIVE_API_TOKEN);
  const res = await fetch(u, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),   // { [HASH]: wartość, [ENUM_HASH]: ID_opcji }
  });
  return res.json();
}

// np.:
await setDealFields(dealId, {
  [FIELDS.CONTRACT_STATE]: CONTRACT_STATE_OPTIONS['Do wgrania podpisanej'],
  [FIELDS.SUCCESS_FEE_PCT]: 3.5,
});
```

Analogicznie `PUT /persons/{id}` i `PUT /organizations/{id}`.

## Rate limit (paceGate)

Pipedrive ogranicza tempo (≈ kilka żądań/s). Repo ma semafor `paceGate`
wymuszający minimalny odstęp między żądaniami (domyślnie ~2 s, konfigurowalny
`PIPEDRIVE_REQ_INTERVAL_MS`). Przy operacjach masowych (import, reassign,
„Odśwież z Pipedrive") **przepuszczaj żądania przez paceGate** i zapisuj postęp
partiami, żeby nie dostać 429 i móc wznowić.

## Dual-write do Postgres

Repo trzyma lokalną kopię deali/aktywności w Postgres (Railway) jako cache +
audyt. Po zapisie do Pipedrive (np. attach umowy, reassign) **zapisz też do PG**
(`deals`, `deal_events` itd.), żeby dashboard widział zmianę natychmiast bez
czekania na webhook. Baza to **Railway PostgreSQL** (nie Supabase) — połączenie
przez pulę `pg` w `server.mjs`.
