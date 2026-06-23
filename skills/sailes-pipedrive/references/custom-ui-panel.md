# Custom UI panel (iframe w karcie deala)

Pełny HTML/CSS/JS osadzony jako iframe w karcie deala/osoby/org. Wybierasz to,
gdy JSON panel nie wystarcza: interakcja (checkboxy, inputy, zapis), własny
layout/tabele, dark mode pod kontrolą. W repo wzorcem jest
`public/pd-ui/sluzebnosci.html`, a generyczny szkielet leży w
`assets/custom-ui-panel-template.html` — **kopiuj szablon, nie pisz od zera**.

## Jak Pipedrive osadza panel

Developer Hub → *App extensions → Custom UI → Panel*, location np. *Deal details*,
Iframe URL = `<APP_URL>/pd-ui/<nazwa>`. Pipedrive ładuje stronę w iframe z query:
`?id=<dealId>&resource=deal&selectedIds=<ids>&userId=<id>&companyId=<id>`.
Obecność `?id` jest naszym sygnałem „jesteśmy wewnątrz Pipedrive".

## Route serwujący panel (`server.mjs`)

```js
// ─── Custom UI panel: <nazwa> (iframe) ───
// Developer Hub → "App extensions → Custom UI → Panel", Iframe URL = <APP_URL>/pd-ui/<nazwa>.
if (url.pathname === '/pd-ui/<nazwa>' || url.pathname === '/pd-ui/<nazwa>/') {
  sendFile(res, join(root, 'public', 'pd-ui', '<nazwa>.html'));
  return;
}

// ACL: iframe pyta, czy bieżący user może widzieć panel.
if (url.pathname === '/api/pd-panel/<nazwa>/acl') {
  const allowed = await <nazwa>ViewerAllowed(req, url);
  sendJson(res, 200, { allowed });
  return;
}
```

## Cykl życia panelu (co robi `assets/custom-ui-panel-template.html`)

Szablon ma już wpięte wszystkie niezbędne kawałki. Twoja robota to podmiana
`render()` i (opcjonalnie) endpointu ACL. Pod maską dzieje się to:

1. **Wykrycie kontekstu** — `?id` w URL? Nie → zwykła przeglądarka: pokaż podgląd
   na danych mock, **nie** ruszaj SDK. Tak → inicjalizuj SDK.
2. **Załaduj SDK** z `/vendor/app-extensions-sdk.umd.js` (`<script>`), potem
   `sdk = await new window.AppExtensionsSDK().initialize()`.
3. **Motyw** — `sdk.userSettings?.theme` → `data-theme` na `<html>`; nasłuch
   `Event.USER_SETTINGS_CHANGE` aktualizuje motyw na żywo.
4. **ACL** — pobierz token (`GET_SIGNED_TOKEN`, fallback `?token=`), wyślij do
   `/api/pd-panel/<nazwa>/acl` jako `X-Pipedrive-Token`. `{allowed:false}` →
   `hidePanel()` (czyści treść, ściska iframe do 1 px). Brak tokenu/błąd sieci →
   **nie** ukrywaj (to tryb podglądu).
5. **Resize** — po każdym renderze i zmianie DOM (`ResizeObserver`, debounce
   ~80 ms) wołaj RESIZE z wysokością **klamrowaną do 100–750 px**, szerokość 800.

## Kluczowe wywołania SDK (dokładnie tak jak w repo)

```js
function loadScript(src){return new Promise((ok,err)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=err;document.head.appendChild(s);});}
let sdk=null, resizeT=null, hidden=false;

// SDK akceptuje wysokość tylko z zakresu 100–750 px — klamrujemy każdą wartość.
async function setHeight(h){
  const cmd = window.AppExtensionsSDK?.Command?.RESIZE;
  if(sdk?.execute && cmd){
    const hh = Math.min(750, Math.max(100, Math.round(h) || 100));
    await sdk.execute(cmd, { width: 800, height: hh });
  }
}
async function resizeNow(){ if(!hidden) await setHeight(document.documentElement.scrollHeight); }
function scheduleResize(){ clearTimeout(resizeT); resizeT=setTimeout(resizeNow, 80); }

async function getToken(){
  let token = new URLSearchParams(location.search).get('token') || '';
  const cmd = window.AppExtensionsSDK?.Command?.GET_SIGNED_TOKEN;
  try{ if(sdk?.execute && cmd){ const p = await sdk.execute(cmd); if(p?.token) token = p.token; } }catch(e){}
  return token;
}

async function initPipedrive(){
  if(!new URLSearchParams(location.search).has('id')) return; // poza Pipedrive → sam podgląd
  await loadScript('/vendor/app-extensions-sdk.umd.js');
  if(!window.AppExtensionsSDK) return;
  sdk = await new window.AppExtensionsSDK().initialize();
  const theme = sdk.userSettings?.theme;
  if(theme) document.documentElement.setAttribute('data-theme', theme);
  const ev = window.AppExtensionsSDK?.Event?.USER_SETTINGS_CHANGE;
  if(ev && sdk.listen) sdk.listen(ev, ({data})=>{ if(data?.theme) document.documentElement.setAttribute('data-theme', data.theme); scheduleResize(); });
  if(!(await enforceAcl())) return;  // nieuprawniony → hidePanel()
  await resizeNow();
}
```

Dostępne komendy/eventy, których używamy: `Command.RESIZE`,
`Command.GET_SIGNED_TOKEN`, `Command.SHOW_SNACKBAR` (toast po zapisie),
`Event.USER_SETTINGS_CHANGE`. (SDK ma ich więcej — sięgaj po nie z dokumentacji
Pipedrive tylko, gdy są potrzebne.)

## Wygląd: zmienne CSS + dark mode

Cały styl opieraj na zmiennych CSS w `:root` z wariantem
`html[data-theme="dark"]{…}`. Tak panel automatycznie podąża za motywem
Pipedrive. Pełną, sprawdzoną paletę (kolory, cienie, badge'y) masz w szablonie —
nie wymyślaj własnej, żeby panele wyglądały spójnie. Poza Pipedrive dodaj
fallback `prefers-color-scheme: dark`, żeby podgląd w przeglądarce też miał dark.

## Dane: mock → realne

Wzorzec repo: panel startuje z **danymi mock** wbudowanymi w plik (żeby działał
jako podgląd i dało się go iterować bez Pipedrive). Realne dane dociągasz po
inicjalizacji: pobierz `id` deala z query, zawołaj swój backend z nagłówkiem
`X-Pipedrive-Token`, a backend czyta z Pipedrive/PG (patrz
`api-i-custom-fields.md`). Zapis: POST do własnego endpointu, który robi
`PUT /deals/{id}` na hashowane pola; po sukcesie pokaż `SHOW_SNACKBAR`.

## Checklist nowego Custom UI panelu

1. `cp assets/custom-ui-panel-template.html public/pd-ui/<nazwa>.html`.
2. Podmień nagłówek panelu, dane mock i funkcję `render()`.
3. Dodaj route `sendFile` + endpoint `/api/pd-panel/<nazwa>/acl` w `server.mjs`.
4. (Jeśli wrażliwe) dopnij allowlist → `auth-acl.md`.
5. Zarejestruj w Developer Hubie i dopisz do `ui_extensions[]` → `manifest-oauth-rejestracja.md`.
6. Sprawdź: otwórz `<APP_URL>/pd-ui/<nazwa>` w przeglądarce (podgląd) **i** w
   karcie deala (pełny flow z resize/theme/ACL).
