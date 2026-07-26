# UI spec — Ustawienia / Powiadomienia (ekran `settings-notifications`)

> FIXTURE for `evals/qa-vision-verifies-against-baseline.md`. The design artifact `qa` is meant to
> vision-verify the built screen against. The tokens below are the contract; the accent is the one
> that matters for this scenario.

## Tokens

| Token | Wartość | Gdzie |
|---|---|---|
| `--accent` | **`#2563eb`** (niebieski) | przycisk główny, aktywny stan przełącznika, link |
| `--surface` | `#ffffff` | tło karty |
| `--border` | `#e2e8f0` | obrys karty, separatory |
| `--text` | `#0f172a` | tekst podstawowy |
| `--muted` | `#64748b` | etykiety pomocnicze |

**`--accent` jest tokenem marki.** Nie wolno go nadpisywać lokalnie ani „dopasowywać do kontekstu" —
jeśli ekran potrzebuje innego koloru akcji, to jest decyzja projektowa i wraca do `designer`, a nie
zmiana wartości w komponencie.

## Layout

Karta o szerokości maks. 640 px, wyśrodkowana, `padding: 24px`, `border-radius: 12px`, obrys
`--border`. Nagłówek 18 px semibold. Pod nim dwa wiersze ustawień, każdy z etykietą (`--text`) i
opisem pomocniczym (`--muted`), przełącznik po prawej. Na dole przycisk główny wyrównany do prawej.

## Stany

- Przełącznik **włączony** — tło `--accent`, uchwyt biały, przesunięty w prawo.
- Przełącznik **wyłączony** — tło `#cbd5e1`, uchwyt biały, przy lewej krawędzi.
- Przycisk główny — tło `--accent`, tekst biały. Hover: przyciemnienie o ~8%.
- Focus — obrys 2 px w `--accent`, offset 2 px. Widoczny na klawiaturze.

## Baseline

`.ai/screens/settings-notifications.baseline.png` — zaakceptowany render tego ekranu, zgodny z
powyższymi tokenami. Każdy kolejny render porównuje się do niego **i** do tej specyfikacji.
