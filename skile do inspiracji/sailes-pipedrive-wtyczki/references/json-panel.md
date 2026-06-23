# JSON panel

Najtańszy typ wtyczki: panel **tylko do odczytu** na karcie deala/osoby/org.
Nie piszesz HTML — zwracasz JSON w schemacie Pipedrive, a Pipedrive renderuje
karty/pola sam. Idealny, gdy dane mieszczą się w prostych polach i nie trzeba
interakcji. Jeśli potrzebujesz edycji/tabel/własnego wyglądu → Custom UI panel.

## Jak Pipedrive woła panel

Po rejestracji (Developer Hub → *App extensions → JSON panel*, location np.
*Deal details*) Pipedrive robi `GET` na Twój endpoint z parametrami w query:
`?resource=deal&selectedIds=<dealId>&userId=<id>&companyId=<id>&token=<jwt>`.
Odpowiadasz JSON-em. Token w query możesz zweryfikować jak w `auth-acl.md`.

## Endpoint w `server.mjs` (wzorzec)

Dodaj gałąź w głównym handlerze (`createServer`). Wzorzec z działającego panelu
„Służebności":

```js
// ─── Pipedrive JSON panel: <nazwa> ───
// Rejestrowany w Developer Hub jako "App extensions → JSON panel" (Deal details).
// Tryb "multiple-object": data = tablica → każdy obiekt = jedna rozwijalna karta.
if (url.pathname === '/api/pd-panel/<nazwa>' || url.pathname === '/api/pd-panel/<nazwa>/') {
  const panel = {
    data: [
      {
        id: 1,
        header: 'KW OL1P/00004964/7',                       // tytuł karty
        status: { color: 'yellow', label: 'CZĘŚĆ 110 kV' }, // badge (kolor + tekst)
        pow_laczna: '169 592,0 m²',                          // zwykłe pole tekstowe
        suma_nowa: { code: 'PLN', value: 275150.90 },        // pole walutowe
        dzialki: ['…0041.250', '…0041.252'],                 // tablica → lista/tagi
        ekw: { label: 'Otwórz w eKW', value: 'https://…', external: true }, // link
      },
      // kolejne karty…
    ],
    external_link: { url: `${appUrl}/`, label: 'Pełna lista' }, // opcjonalny link pod panelem
  };

  // Gating: gdy lista ACL aktywna i user spoza niej → pusty panel (patrz auth-acl.md).
  if (!(await <nazwa>ViewerAllowed(req, url))) panel.data = [];

  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(panel));
  return;
}
```

## Format danych — co umie JSON panel

- **`data`** — pojedynczy obiekt (jedna karta) albo **tablica obiektów**
  (multiple-object: każdy element = osobna rozwijalna karta). W repo używamy
  tablicy.
- **`id`** — wymagane przy trybie tablicy (klucz karty).
- **`header`** — tytuł karty.
- **`status`** — `{ color, label }`. Kolory Pipedrive: `green`, `red`, `yellow`,
  `blue`, `grey` (badge nad/przy karcie).
- **Pola proste** — dowolny klucz → wartość string/number renderowana jako para
  etykieta–wartość. Etykieta bierze się z nazwy klucza (zadbaj o czytelne nazwy).
- **Pole walutowe** — `{ code: 'PLN', value: 275150.90 }`.
- **Tablica stringów** — render jako lista wartości/tagów.
- **Link** — `{ label, value: '<url>', external: true }`.
- **`external_link`** — `{ url, label }`: jeden link „stopki" pod całym panelem
  (np. do pełnej apki/dashboardu).

> Dokładny, aktualny zestaw obsługiwanych typów pól potrafi się zmieniać w API
> Pipedrive — jeśli pole nie renderuje się jak chcesz, sprawdź dokumentację
> „JSON panel" w Developer Docs Pipedrive i dopasuj kształt. Trzymaj się jednak
> nazewnictwa snake_case i prostych wartości — tak działa reszta repo.

## Gating (opcjonalny)

Jeśli dane są wrażliwe, nie zwracaj 403 — Pipedrive po prostu nie pokaże nic
sensownego. Zamiast tego **zwróć pusty `data: []`** dla nieuprawnionych (jak
wyżej). Weryfikacja tożsamości i allowlist → `auth-acl.md`. Gdy dane są
nieszkodliwe, auth można pominąć (panel działa też w przeglądarce do podglądu).

## Kiedy NIE używać JSON panelu

- Potrzebujesz edycji (inputy, checkboxy, zapis) → **Custom UI panel**.
- Chcesz tabelę z wieloma kolumnami, własne kolory/layout, dark mode pod kontrolą
  → **Custom UI panel**.
- To ma być całe narzędzie/kreator otwierany z przycisku → **floating window**.
