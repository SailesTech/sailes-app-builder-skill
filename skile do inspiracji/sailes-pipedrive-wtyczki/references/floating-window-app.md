# Floating window / modal / link actions

Te typy uruchamiają **całą aplikację lub akcję na żądanie**, a nie kontekstowy
panel przyklejony do karty. W repo to dashboard otwierany w pływającym oknie
(`?pipedrive=1`, `/floating-menu`, `/floating-all`, `/preview`).

## Typy i kiedy który

- **Custom floating window** — pływające okno-iframe otwierane z dropdownu apki
  lub przycisku; mieści pełny widok (dashboard, kreator). To, czego używamy.
- **Custom modal** — modal-iframe (blokujący), do krótkich akcji/formularzy.
  Mechanika identyczna z floating window (inny `type` w `ui_extensions`).
- **Link action / app action** — przycisk na liście/karcie, który otwiera URL
  albo wywołuje akcję. Lekkie; gdy nie potrzebujesz własnego UI.

## Wpis w manifeście

Każde okno to wpis w `ui_extensions[]` w `manifest()` (`server.mjs`):

```js
{
  key: 'frejowski-sales-dashboard-menu',  // unikalny, stabilny klucz
  type: 'custom_floating_window',         // typ rozszerzenia
  label: 'Sales Dashboard Menu',          // etykieta w UI Pipedrive
  icon: `${appUrl}/icon.svg`,
  url: `${appUrl}/floating-menu`,         // route Twojej apki
}
```

Wiele okien = wiele wpisów z różnymi `key`/`url` (jak w repo: główny dashboard,
preview, menu, all). Po zmianie `manifest()` zaktualizuj też apkę w Developer
Hubie (patrz `manifest-oauth-rejestracja.md`).

## Inicjalizacja po stronie React

Dashboard używa helpera `src/lib/pipedriveEmbed.ts`. Wywołaj
`initializePipedriveEmbed()` przy starcie apki — sam wykryje kontekst i odpali
SDK:

```ts
import { initializePipedriveEmbed } from './lib/pipedriveEmbed';
// w bootstrapie aplikacji:
await initializePipedriveEmbed();
```

`initializePipedriveEmbed()` inicjalizuje SDK, gdy `isEmbedded()` **lub** w URL
jest `id`/`companyId`/`pipedrive=1`; ustawia klasę `pipedrive-embedded`, motyw,
RESIZE (domyślnie 800×700; dla `/settings` rośnie do treści) i nasłuch motywu.
Auth do własnego backendu: `getPipedriveAuthHeaders()` → `{ 'X-Pipedrive-Token' }`.

## Kontekst z query params

Pipedrive dokleja do URL okna parametry kontekstu. Czytaj je z
`URLSearchParams(location.search)`:

- `id` / `selectedIds` — id rekordu (deal/osoba/org), z którego otwarto okno.
- `resource` — typ rekordu.
- `userId`, `companyId` — kto i w jakim koncie.
- `token` — sygnowany JWT (fallback, gdy nie pobierasz przez `GET_SIGNED_TOKEN`).

## Wzorzec „grant → sesja" (pełny dashboard poza iframe)

Gdy z okna chcesz otworzyć **pełną apkę w nowej karcie** (poza ograniczeniami
iframe), repo robi tak (`openFullDashboard()` w `pipedriveEmbed.ts`):

1. Front woła `POST /api/dashboard/grant` z nagłówkiem `X-Pipedrive-Token`.
2. Backend weryfikuje JWT, sprawdza uprawnienia (np. admin), zwraca
   `{ url: '/dashboard-bridge?dt=<grantJwt>&tab=…' }` z krótkim (≈60 s) grantem.
3. Front: `window.open(url, '_blank')`.
4. `/dashboard-bridge` konsumuje grant, ustawia ciasteczko sesji
   (`pd_dashboard_session`, ~30 dni, sygnowane), redirect do apki.
5. Trasy pełnej apki wymagają tej sesji (fail-closed). Szczegóły JWT/sesji →
   `auth-acl.md`.

Używaj tego wzorca tylko, gdy faktycznie potrzebujesz wyjść poza iframe (np.
ciężki dashboard). Do zwykłych akcji wystarczy okno z `X-Pipedrive-Token`.
