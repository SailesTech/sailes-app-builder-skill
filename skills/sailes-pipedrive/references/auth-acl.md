# Autoryzacja i ACL (gating panelu)

Wzorzec auth dla wszystkich iframe'owych wtyczek: panel pobiera **sygnowany
token** z SDK → wysyła go jako `X-Pipedrive-Token` → backend **weryfikuje** JWT
(HS256) → sprawdza **allowlist**. Domyślnie **fail-closed**, gdy lista aktywna.

> Sygnowany token Pipedrive (signed token) żyje ~5 minut i jest podpisany
> sekretem JWT Twojej wtyczki (z Developer Huba). Dokumentacja:
> https://pipedrive.readme.io/docs/app-extensions

## Weryfikacja tokenu (`server.mjs`)

```js
function verifyPipedriveJwt(token) {
  const secret = process.env.PIPEDRIVE_JWT_SECRET || process.env.PIPEDRIVE_CLIENT_SECRET;
  if (!secret) return null;
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encPayload, signature] = parts;
  const expected = base64UrlEncode(
    createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest()
  );
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const header = JSON.parse(base64UrlDecode(encHeader));
    if (header.alg !== 'HS256') return null;          // tylko HS256
    const payload = JSON.parse(base64UrlDecode(encPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) return null;  // wygasł
    return payload;                                    // { userId, companyId, … }
  } catch { return null; }
}

function extractPipedriveToken(req) {
  const h = req.headers['x-pipedrive-token'] || '';
  if (h) return h.trim();
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}
```

**Sekret musi się zgadzać** z JWT secret wtyczki w Developer Hubie — najczęstsza
przyczyna „wszystko zwraca deny". Algorytm to **HS256** (HMAC), nie RS256.

## Tożsamość: token panelu lub sesja

```js
function identityPayloadFromRequest(req) {
  const token = extractPipedriveToken(req);
  const tokenPayload = token ? verifyPipedriveJwt(token) : null;
  if (tokenPayload) return tokenPayload;                      // iframe (X-Pipedrive-Token)
  const cookies = parseCookie(req.headers.cookie);
  const sessionPayload = cookies.pd_dashboard_session
    ? verifyPipedriveJwt(cookies.pd_dashboard_session) : null;
  if (sessionPayload && sessionPayload.kind === 'session') return sessionPayload;  // pełna apka
  return null;
}
```

## Allowlist (gating wg usera/maila/domeny)

Wzorzec z panelu „Służebności". Lista z env; **pusta → wszyscy** (zachowanie
domyślne), **aktywna → tylko pasujący** (fail-closed):

```js
const PANEL_ALLOWLIST = (process.env.<NAZWA>_PANEL_ALLOWLIST || '')
  .split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

async function <nazwa>ViewerAllowed(req, urlObj) {
  if (PANEL_ALLOWLIST.length === 0) return true;            // brak listy → wszyscy
  let token = extractPipedriveToken(req);
  if (!token && urlObj) token = urlObj.searchParams.get('token') || '';   // fallback z query (JSON panel)
  const payload = token ? verifyPipedriveJwt(token) : null;
  if (!payload || payload.userId == null) return false;     // brak/zły token → deny
  const uid = String(payload.userId).toLowerCase();
  const email = String((await fetchPipedriveUserEmail(payload.userId)) || '').toLowerCase();
  return PANEL_ALLOWLIST.includes(uid)
    || (email && PANEL_ALLOWLIST.includes(email))
    || (email && PANEL_ALLOWLIST.some(e => e.startsWith('@') && email.endsWith(e)));  // sufiks domeny
}
```

Allowlist przyjmuje trzy formy wpisu: numeryczne `userId`, dokładny e-mail,
albo sufiks domeny `@firma.pl`.

## Jak odmawiać zależnie od typu wtyczki

- **JSON panel** — nie zwracaj 403. Zwróć **pusty `data: []`** (Pipedrive nie ma
  jak pokazać błędu sensownie).
- **Custom UI panel** — w iframe wołaj `/api/pd-panel/<nazwa>/acl`; przy
  `{allowed:false}` zrób `hidePanel()` (wyczyść treść, RESIZE do 1 px).
- **Pełna apka (poza iframe)** — wymagaj ciasteczka sesji; brak → 403.

## Własny JWT (sesja / grant do pełnej apki)

Do wzorca „grant → sesja" (patrz `floating-window-app.md`) repo podpisuje własne
tokeny tym samym sekretem:

```js
function signOwnJwt(payload, ttlSeconds) {
  const secret = process.env.PIPEDRIVE_JWT_SECRET || process.env.PIPEDRIVE_CLIENT_SECRET;
  const now = Math.floor(Date.now()/1000);
  const full = { ...payload, iat: now, exp: now + ttlSeconds };
  const encHeader  = base64UrlEncode(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const encPayload = base64UrlEncode(JSON.stringify(full));
  const signature  = base64UrlEncode(createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest());
  return `${encHeader}.${encPayload}.${signature}`;
}
```

Grant: krótki TTL (≈60 s), `kind:'grant'`. Sesja: długi TTL (≈30 dni),
`kind:'session'`, w ciasteczku `pd_dashboard_session` (HttpOnly, Secure).
