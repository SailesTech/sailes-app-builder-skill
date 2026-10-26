# Claude Code — przepisy code review (materiał do inspiracji)

Materiały Anthropic o review (REVIEW.md, zarządzany Code Review, `/code-review`), zebrane 2026-10-26 do porównania z naszym `checker`.
Analiza i propozycja scalenia: `.ai/audits/2026-10-26-claude-code-review-porownanie.md`.

| Plik | Źródło | Wersja / data | Licencja |
|---|---|---|---|
| `review-md-know-how.md` | dokumentacja code.claude.com (Code Review, Customize, PR, `/code-review`) + blog claude.dev „How the Claude Code team does code review” — **najważniejszy plik** | pobrane 2026-10-26; blog z 2026-10-15 | streszczenie, krótkie cytaty |
| `REVIEW-anthropic-sdk.md` | `REVIEW.md` z `anthropics/anthropic-sdk-python@6e911ec`, kopia dosłowna (ten sam plik w SDK TS, Go i `anthropic-cli`) | 2026-10-13 | Apache 2.0 |
| `code-review-plugin.md` | `anthropics/claude-plugins-official` → `plugins/code-review/commands/code-review.md`, kopia dosłowna | plik z 2026-10-24 (mtime w marketplace) | Apache 2.0 |
| `code-review-wbudowany-2.1.300.md` | wbudowany skill `/code-review` w Claude Code 2.1.300 (z binarki: `strings` + zrzut zakresu bajtów) | 2.1.300 | własnościowy — tu **streszczenie struktury i krótkie cytaty** do użytku wewnętrznego, nie kopia |

Wbudowany `/code-review` jest nowszy i zastępuje w praktyce podejście z pluginu: zamiast
liczbowego progu pewności (0–100, odcięcie < 80) ma weryfikatora z trzema stanami i poziomy
wysiłku od precyzji do kompletności.

Nie jest to część skilla — nic tu nie ładuje się do sesji. Zmiany w `agents/checker.md` i
bramkach przechodzą zwykłą drogą: spec, eval, decyzja człowieka.
