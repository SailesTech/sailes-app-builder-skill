---
name: sailes-pipedrive
description: >-
  Jak budować wtyczki (App Extensions) do Pipedrive w stylu tego repo — JSON
  panel, Custom UI panel (iframe w karcie deala), custom floating window /
  modal, link/app actions oraz strona ustawień — wraz z manifestem, rejestracją
  w Developer Hubie, OAuth2, autoryzacją przez sygnowany JWT (X-Pipedrive-Token),
  Apps SDK (initialize/RESIZE/theme/GET_SIGNED_TOKEN), gatingiem ACL,
  proxy do Pipedrive API i zapisem custom fields (hashowane klucze). Używaj
  ZAWSZE, gdy budujesz, rejestrujesz lub debugujesz cokolwiek osadzonego w UI
  Pipedrive: panel na dealu/osobie/organizacji, okno/modal, przycisk-akcję,
  iframe, „wtyczkę", „plugin", „rozszerzenie", „custom UI", „JSON panel",
  „floating window", manifest, ui_extensions, Apps SDK, signed token,
  oraz gdy padają hasła Pipedrive panel/iframe/extension/Developer Hub, pd-ui,
  app-extensions-sdk, RESIZE, USER_SETTINGS_CHANGE, custom field, /api/pd,
  /manifest.json, „odśwież z Pipedrive", „pokaż dane na dealu". Stosuj też,
  gdy nie masz pewności „jaki typ rozszerzenia Pipedrive wybrać" albo „jak
  osadzić własny widok w karcie deala".
---

# Wtyczki (App Extensions) do Pipedrive — jak je budujemy w tym repo

To repo (`Frejowski dashboard / sailestech`) ma kilka **działających** wtyczek
Pipedrive. Ten skill destyluje ich wzorce, żeby każda kolejna wtyczka powstawała
spójnie, z tymi samymi konwencjami auth/SDK/deployu — zamiast wymyślać koło na
nowo. Trzymaj się tego, co tu jest, chyba że wymaganie mówi inaczej (odstępstwo
zapisz z uzasadnieniem).

> **Oficjalna dokumentacja (źródło prawdy):** App Extensions —
> https://pipedrive.readme.io/docs/app-extensions · API v1 —
> https://developers.pipedrive.com/docs/api/v1
> Gdy ten skill nie odpowiada na pytanie (nowy typ rozszerzenia, dokładny kształt
> manifestu/pól, zmiana w API, dostępne komendy SDK) — **sprawdź dokumentację,
> zanim zgadniesz**. Skill opisuje *nasze* sprawdzone wzorce; dokumentacja
> opisuje *pełne* API Pipedrive.

> **Stack repo (nie zmieniaj bez powodu):** serwer to **czysty Node `http`**
> (`createServer` w `server.mjs`, ręczny routing po `url.pathname`, helpery
> `sendJson(res, status, payload)` i `sendFile(res, path)` — **bez Express**).
> Statyczne panele to **vanilla HTML** w `public/pd-ui/<nazwa>.html`. Złożone
> widoki (dashboard) to React+Vite (`src/`, build do `dist/`). Apps SDK jest
> **self-hostowany** jako UMD w `public/vendor/app-extensions-sdk.umd.js` (nie z
> npm). Deploy: **Railway**, `node server.mjs`, healthcheck `/health`. Komentarze
> w kodzie pisz po polsku — tak jest w całym repo.

## Zanim cokolwiek napiszesz: wybierz właściwy typ rozszerzenia

Pipedrive ma kilka „miejsc", w których może żyć wtyczka. Wybór typu determinuje
wszystko inne (format danych, czy masz HTML, jak autoryzujesz). Najczęstszy błąd
to budowa ciężkiego iframe tam, gdzie wystarczyłby JSON panel. Wybieraj tak:

| Chcę… | Typ rozszerzenia | Masz własny HTML? | Plik/wzorzec | Reference |
|---|---|---|---|---|
| Pokazać **odczytowe** dane (karty/pola) na dealu/osobie/org | **JSON panel** | Nie — Pipedrive renderuje wg schematu | endpoint GET zwracający `{data:[…]}` w `server.mjs` | `references/json-panel.md` |
| Pokazać **interaktywny** widok w karcie deala (tabela, edycja, własny wygląd, dark mode) | **Custom UI panel** (iframe) | Tak — pełny HTML/CSS/JS | `public/pd-ui/<nazwa>.html` + route | `references/custom-ui-panel.md` |
| Otworzyć **okno/modal** z całą apką (dashboard, kreator) z przycisku lub menu | **Custom floating window** / **custom modal** | Tak — React lub HTML | route w apce + wpis w `ui_extensions` | `references/floating-window-app.md` |
| Dać **przycisk-akcję** na liście/karcie (otwórz URL, uruchom akcję) | **Link action / app action** | Zależnie | wpis w manifeście | `references/floating-window-app.md` |
| Ekran **ustawień** wtyczki | **Settings page** (iframe) | Tak | route `/settings` + `settings.url` w manifeście | `references/manifest-oauth-rejestracja.md` |

Reguła kciuka: **JSON panel** to najtańsza droga, gdy dane są tylko do odczytu i
zmieszczą się w prostych polach/kartach. Sięgaj po **Custom UI panel** dopiero,
gdy potrzebujesz interakcji, własnego layoutu, tabel, edycji albo dark mode.
**Floating window/modal** to pełna aplikacja na żądanie, nie kontekstowy panel.

Jeśli nie wiesz, czego user chce — **dopytaj**: „dane tylko do odczytu czy z
edycją?", „w karcie deala na stałe, czy w oknie na przycisk?". Te dwie odpowiedzi
jednoznacznie wskazują typ.

## Workflow budowy nowej wtyczki

Niezależnie od typu, kolejność jest ta sama:

1. **Ustal typ** wg tabeli wyżej i przeczytaj odpowiedni reference. Nie pisz kodu,
   zanim nie wiesz, jaki to typ — to przesądza format danych i autoryzację.
2. **Zbuduj endpoint/stronę** wg wzorca z reference'a. Dla JSON panelu: nowa
   gałąź `if (url.pathname === '/api/pd-panel/<nazwa>')` w `server.mjs`. Dla
   Custom UI: skopiuj `assets/custom-ui-panel-template.html` do
   `public/pd-ui/<nazwa>.html` i dodaj route serwujący go przez `sendFile`.
3. **Podłącz autoryzację** (jeśli dane są wrażliwe). Wzorzec: sygnowany JWT z SDK
   → nagłówek `X-Pipedrive-Token` → `verifyPipedriveJwt` na serwerze → gating
   przez allowlist. Szczegóły: `references/auth-acl.md`. Domyślnie **fail-closed**.
4. **Dane z Pipedrive** (jeśli trzeba): czytaj/zapisuj przez proxy `/api/pd/*`
   (token wstrzykiwany po stronie serwera) albo bezpośrednio API. Custom fields
   to **hashowane klucze** — patrz `references/api-i-custom-fields.md`.
5. **Zarejestruj w Developer Hubie** i dopisz do `ui_extensions[]` w `manifest()`
   (`server.mjs`). Szczegóły i checklist: `references/manifest-oauth-rejestracja.md`.
6. **Zweryfikuj lokalnie i na Railway.** Panel musi działać też w „gołej"
   przeglądarce (bez `?id`) jako podgląd z danymi mock — to nasz sposób na szybką
   iterację bez wchodzenia do Pipedrive za każdym razem.

## Niezmienne wzorce (łamiesz je tylko świadomie)

Te rzeczy są wspólne dla wszystkich iframe'owych wtyczek w repo i wynikają z
realnych ograniczeń Pipedrive — trzymaj się ich, a panele będą działać od razu:

- **Inicjalizuj SDK tylko wewnątrz Pipedrive.** Sprawdzaj `?id` w query: brak →
  to zwykła przeglądarka, pokaż podgląd na danych mock i **nie** ruszaj SDK.
  Dzięki temu ten sam plik jest i wtyczką, i samodzielnym podglądem.
- **SDK ładuj z `/vendor/app-extensions-sdk.umd.js`** (self-host), przez `<script>`,
  potem `new window.AppExtensionsSDK().initialize()`. Nie dodawaj zależności npm.
- **RESIZE klamruj do 100–750 px wysokości, szerokość 800.** Pipedrive odrzuca
  wartości spoza zakresu. Resize wołaj po renderze i przez `ResizeObserver`
  (debounce ~80 ms), żeby iframe rósł/malał z treścią.
- **Motyw**: czytaj `sdk.userSettings?.theme`, ustaw `data-theme` na `<html>`,
  i nasłuchuj `Event.USER_SETTINGS_CHANGE`. Cały wygląd opieraj na zmiennych CSS
  z wariantem `html[data-theme="dark"]`.
- **Token**: `Command.GET_SIGNED_TOKEN` z fallbackiem na `?token=` z URL. Wysyłaj
  go do backendu jako `X-Pipedrive-Token`. Token żyje ~5 min — odświeżaj.
- **Sekret JWT** do weryfikacji to `PIPEDRIVE_JWT_SECRET` (fallback
  `PIPEDRIVE_CLIENT_SECRET`) i **musi** pokrywać się z JWT secret tej wtyczki w
  Developer Hubie — inaczej każda weryfikacja zwróci „odmowa".
- **Nigdy nie wystawiaj `PIPEDRIVE_API_TOKEN` do frontu.** Dane z API ciągnij
  przez proxy `/api/pd/*`, które wstrzykuje token serwerowo.

## Pliki referencyjne

Przeczytaj ten, który pasuje do typu wtyczki — nie wszystkie naraz:

- `references/json-panel.md` — format `{data:[…]}`, statusy/kolory, pola, link
  zewnętrzny, tryb multiple-object, gating pustym panelem.
- `references/custom-ui-panel.md` — pełna budowa iframe: init SDK, resize, theme,
  token, ACL, podgląd w przeglądarce; jak używać szablonu z `assets/`.
- `references/floating-window-app.md` — floating window / modal / link actions:
  routing w apce, wpisy `ui_extensions`, kontekst z query (`id`, `selectedIds`,
  `companyId`), wzorzec „grant → sesja" dla pełnego dashboardu.
- `references/manifest-oauth-rejestracja.md` — `manifest()`, OAuth2
  (install/callback, odświeżanie tokenu, tabela `installations`), krok-po-kroku
  rejestracja w Developer Hubie, scope'y, ikona.
- `references/auth-acl.md` — `verifyPipedriveJwt` (HS256), `extractPipedriveToken`,
  `identityPayloadFromRequest`, allowlist (`SLUZEBNOSCI_PANEL_ALLOWLIST`-style),
  fail-closed, własny JWT do sesji/grantu.
- `references/api-i-custom-fields.md` — proxy `/api/pd/*`, mapa hashowanych pól
  (`src/api/pipedrive.ts`), enumy jako ID, `PUT /deals/{id}`, paceGate/rate-limit.

## Zasób gotowy do użycia

- `assets/custom-ui-panel-template.html` — kompletny szkielet Custom UI panelu:
  zmienne CSS (light/dark), powłoka panelu, pełne podpięcie Apps SDK (init/resize/
  theme/token/ACL), `render()` na własne dane i fallback-podgląd poza Pipedrive.
  **Kopiuj go**, zmień nazwę, podmień `render()` i endpoint ACL — reszta działa.
