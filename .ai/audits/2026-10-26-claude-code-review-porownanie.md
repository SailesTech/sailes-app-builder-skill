# Porównanie: review według Anthropic (REVIEW.md, Code Review, `/code-review`) wobec `checker` Sailes 1.38.3

Data: 2026-10-26 · Materiał źródłowy w `skile do inspiracji/claude-code-review/`:
- `review-md-know-how.md` — dokumentacja `REVIEW.md` i zarządzanego Code Review (code.claude.com) oraz
  wpis „How the Claude Code team does code review” (claude.dev, 2026-10-15);
- `REVIEW-anthropic-sdk.md` — prawdziwy `REVIEW.md` Anthropic z ich SDK (2026-10-13, Apache-2.0);
- `code-review-wbudowany-2.1.300.md` — przepis lokalnego `/code-review` (streszczenie z binarki 2.1.300);
- `code-review-plugin.md` — starszy plugin `code-review` (Apache-2.0).

Zakres: co z tego wziąć do `agents/checker.md`, bramek `sailes-implement` i bootstrapu repo klienta.
**Bez zmian w kodzie skilla** — materiał do decyzji, nie wdrożenie.

---

## Werdykt w jednym akapicie

Anthropic ma trzy warstwy, my jedną. **(1) `REVIEW.md`** — plik w repo, w którym właściciele kodu
piszą, co w *tym* repo jest porażką, co ma wagę Important, czego nie zgłaszać, limit nitów i wymóg
dowodu `file:line`. **(2) Recenzent poprawności** — równolegli agenci z kątów + weryfikator na każde
znalezisko, severity Important / Nit / Pre-existing. **(3) Proces** — ryzyko z rodzaju zmiany, limit
3 rund, każde znalezisko dostaje odpowiedź, incydenty stają się evalami. Nasz `checker` jest mocny
tam, gdzie oni nie sięgają (zgodność ze specem, braki, nadmiar, uruchomione `Done-when`, pokrycie planu
testów), a warstwy 3 mamy w większości (tier z triggerów, evale, incydent → test regresji). **Brakuje
nam warstwy 1 w całości i połowy warstwy 2**: `checker.md:22` wpuszcza tylko znaleziska z klauzulą
specu, więc null deref, usunięty guard czy zepsuty wywołujący w innym pliku według litery reguły nie
są znaleziskami. Najtańszy i najmocniejszy ruch to `REVIEW.md` jako standardowy plik repo klienta,
który staje się „checklistą” podawaną `checker` — dziś ta checklista nie istnieje
(`agents-md-template.md:177` odsyła do `.ai/skills/code-review`, którego bootstrap nie dostarcza).

## Zestawienie

| Wymiar | `checker` Sailes | Anthropic |
|---|---|---|
| Reguły review per repo | brak; odwołanie do nieistniejącego `.ai/skills/code-review` | **`REVIEW.md`** w korzeniu + w podkatalogach, include plików i skilli |
| Punkt odniesienia | spec + plan testów | diff + otoczenie + `CLAUDE.md` + `REVIEW.md` + intencja PR |
| Braki i nadmiar wobec wymagań | **tak**, dwie sekcje obowiązkowe (`:20`, `:21`) | nie (brak specu) |
| Szukanie błędów | ogólnie „edge cases” (`:24`) | kąty: linia + cała funkcja, usunięte zachowanie, wywołujący, pułapki języka, wrappery |
| Weryfikacja znaleziska | ten sam agent; znalezisko = klauzula + obserwacja | osobny weryfikator: CONFIRMED / PLAUSIBLE / REFUTED, odrzucenie tylko z cytatem |
| Severity | APPROVE / NITS / CHANGES-REQUIRED na całość | per znalezisko: 🔴 Important · 🟡 Nit · 🟣 Pre-existing |
| Limit nitów | brak | w `REVIEW.md` („at most five”) |
| Dowód | klauzula + obserwacja | `file:line` + scenariusz awarii; w `REVIEW.md` wymóg cytatu zamiast wniosku z nazwy |
| Uruchamianie testów | **tak**, `Done-when` + pre-existing red po nazwie | nie — review czyta, CI uruchamia |
| Pętla poprawek | CHANGES-REQUIRED → nowy worker, **bez limitu** | limit 3 rund, potem „przemyśl podejście”; re-review tylko diffu; klasa błędu; bez powtórek |
| Ryzyko | tier A/B/C z triggerów, lane `full`/`middle` | Low/Medium/High z rodzaju zmiany; Quick/Standard/Deep |
| Strojenie recenzenta | evale z ramieniem kontrolnym | incydenty → zestaw evali, szum z reakcji autorów i czystych PR |
| Podsumowanie | werdykt | zaczyna się od liczby, mówi wprost „nic do poprawy” |
| Szablon PR | brak | sekcje Testing / Risk / How to revert |

## Propozycja scalenia

### A. Warstwa `REVIEW.md` (nowa)

**A1. `REVIEW.md` jako standardowy plik repo klienta.** `sailes-bootstrap` dostaje
`review-md-template.md`, a bootstrap i adopt wstawiają `REVIEW.md` do korzenia. Szablon wg wzoru
Anthropic, z wartościami domyślnymi Sailes:
- *Co znaczy Important*: łamie zachowanie ze specu, wycieka dane, blokuje rollback; zapytanie bez
  tenantu, PII w logach, migracja niekompatybilna wstecz, zmiana zamrożonego kontraktu bez specu;
- *Limit*: najwyżej 5 nitów;
- *Nie zgłaszaj*: to, co pilnuje ratchet/CI (no-`any`, tokeny, kierunek importów, lint, typy), pliki
  generowane, lockfile, `graphify-out/`;
- *Zawsze sprawdzaj*: wypełniane przy bootstrapie z modułów projektu (multi-tenant → zawężenie do
  tenantu; integracje → para mock/probe; UI → tokeny);
- *Dowód*: twierdzenie o zachowaniu wymaga `file:line`, nie wniosku z nazwy;
- *Podsumowanie*: zaczyna się od liczby, „nic do poprawy”, gdy nic nie ma.

Punkty specyficzne dla repo dopisuje właściciel. Wzorem jest `REVIEW-anthropic-sdk.md` — dwie sekcje,
zero ogólników, każdy punkt to konkretna klasa błędu.

**A2. `checker` dostaje `REVIEW.md` jako swoją checklistę.** Jego wejście to już dziś „diff + spec +
checklista” (`checker.md:10`), tylko checklisty nie ma. `REVIEW.md` z gałęzi bazowej (nie z diffu —
ta sama zasada co u Anthropic: PR nie może zmieniać reguł, którymi go oceniamy) zamyka tę dziurę bez
naruszenia izolacji bramki. Naprawia też martwe odwołanie w `agents-md-template.md:177` i
`agentic-first-principles.md:156`.

**A3. Wspólne reguły tylko w jednym miejscu.** Lokalny `/code-review` czyta `CLAUDE.md`, a nie
`REVIEW.md`; zarządzany Code Review czyta oba. Zasada do szablonu: reguły o kodzie (konwencje) w
`AGENTS.md`, reguły o tym, co zgłaszać i z jaką wagą, w `REVIEW.md`. Bez kopiowania między plikami.

### B. Recenzent poprawności (uzupełnienie `checker`)

**B1. Trzy kąty poprawności** po obu sekcjach specowych: linia po linii z całą funkcją otaczającą;
każda usunięta linia → nazwany niezmiennik i miejsce, gdzie wraca; wywołujący każdej zmienionej
funkcji (Grep po symbolu). Kąt „usunięte zachowanie” to odpowiednik naszej sekcji „czego diff nie
robi” na poziomie kodu: sekcja łapie brakujący endpoint, kąt łapie usunięty guard.

**B2. Druga połowa znaleziska: klauzula specu albo reguła z `REVIEW.md`/`AGENTS.md` albo scenariusz
awarii** („wejście/stan → zły wynik”), zawsze plus zacytowana linia. Zmiana `checker.md:22`. Bez tego
B1 znajduje rzeczy, których nie wolno zgłosić.

**B3. Severity per znalezisko i mapowanie na werdykt.** Important → CHANGES-REQUIRED; Nit → NITS (w
limicie z `REVIEW.md`); **Pre-existing → nigdy nie blokuje**, trafia do `.ai/backlog.md` z
`file:line`. To ostatnie jest najważniejsze: według Anthropic 59% tego, co ich recenzent wciąż
zgłaszał w zapętlonym PR, było w kodzie od początku.

**B4. Osobny weryfikator tylko w lane `full` (tier A).** Każde znalezisko `correctness` dostaje
świeżego weryfikatora z trzema stanami i odrzuceniem tylko z cytatem. W `middle` `checker` sprawdza
się sam i pisze to w werdykcie.

**B5. Jedno zdanie o tym, co faktycznie przebiegło** (kąty, weryfikacja, komendy `Done-when`).

### C. Proces (dopięcie tego, co mamy)

**C1. Limit 3 rund `checker` ↔ worker.** Po trzecim CHANGES-REQUIRED na tej samej fazie lead staje
i daje człowiekowi kartę decyzji „zmienić podejście / zawęzić fazę / przyjąć ryzyko”. Kolejne rundy
recenzują tylko diff poprawki, nie powtarzają zgłoszonych znalezisk, a znalezisko nazywa **klasę
błędu**, żeby poprawka objęła wszystkie wystąpienia. Odpowiada naszej regule „po dwóch nieudanych
próbach zmień podejście”, której w pętli bramki dziś nie ma.

**C2. Każde znalezisko dostaje odpowiedź w run logu:** naprawione / błędne (z powodem) / celowe (z
klauzulą) / bez znaczenia. To nasz odpowiednik pomiaru szumu u Anthropic — po kilku specach widać,
które reguły `REVIEW.md` generują „błędne” i trzeba je przepisać.

**C3. Szablon PR z sekcjami Testing / Risk / How to revert** w bootstrapie (`.github/pull_request_template.md`).

**Już zgodne, bez zmian:** ryzyko z rodzaju zmiany, nie autora (tier z triggerów, `sailes-test`
Step 5); incydent → test regresji / eval; evale na czystym diffie
(`checker-reports-a-finding-only-with-evidence`); człowiek zatwierdza tier A.

## Czego nie bierzemy

- **Zakazu uruchamiania testów** — u nas `Done-when` to dowód bramki.
- **Liczbowej pewności 0–100** ze starego pluginu — Anthropic sam przeszedł na 3 stany.
- **Kątów historii** (blame, stare PR-y) — mało komentarzy w PR, historia decyzji jest w `.ai/`.
- **Kątów porządkowych na bramce fazy** (reuse, simplification, efficiency) — generują nity; jeśli
  już, to raz przed pushem przez `/code-review` (D1c).

## Decyzje dla Karola

> **Rozstrzygnięte 2026-10-26:** D1 = (a) kąty w `checker`, bez fan-outu i bez `/code-review`;
> D2 = nie mamy planu Team/Enterprise; D3 = Sonnet; D4 = 3 rundy. Dalej:
> `.ai/specs/2026-10-26-review-md-i-katy-poprawnosci.md`.

**D1. Gdzie żyje recenzent poprawności?**
(a) kąty B1 w `checker` — jeden agent, działa też pod Codexem;
(b) pełny fan-out jak u Anthropic — 5–15 agentów na bramkę fazy;
(c) (a) na każdej fazie **plus** raz przed pushem w lane `full` lokalny `/code-review high`. Uwaga:
`/code-review` nie czyta `REVIEW.md`, tylko `CLAUDE.md`, a nasze `CLAUDE.md` to linia `@AGENTS.md`
— czy kąt konwencji pójdzie za importem, sprawdzić jednym przebiegiem; nie działa pod Codexem.
Rekomendacja: **(c)**.

**D2. Zarządzany Code Review na GitHubie SailesTech?** Wymaga planu Claude Team/Enterprise, chronionej
gałęzi domyślnej i GitHub App; kosztuje per review. Plan organizacji: **UNKNOWN**. Jeśli jest, A1 daje
korzyść podwójną — ten sam `REVIEW.md` steruje `checker` i automatycznym review na każdym PR.
Rekomendacja: najpierw A1+A2 lokalnie, decyzja o usłudze po jednym projekcie.

**D3. Weryfikator w B4: Sonnet czy Haiku?** Rekomendacja: Sonnet — odrzucenie z cytatem wymaga tej
samej głębokości czytania co szukanie.

**D4. Limit rund w C1: 3 jak u Anthropic czy 2 jak nasza ogólna reguła?** Rekomendacja: 3 — pierwsza
runda poprawek zwykle domyka, druga łapie efekty uboczne, trzecia to sygnał złego podejścia.

## Plan wdrożenia (po decyzjach)

Zmiana ról i bootstrapu działa we wszystkich repo naraz, więc: spec z Open Questions → evale →
wdrożenie (`AGENTS.md` tego repo).

1. Spec `.ai/specs/<data>-review-md-i-katy-poprawnosci.md` z A1–A3, B1–B5, C1–C3 wg decyzji.
2. Evale przed zmianą tekstu, każdy z ramieniem kontrolnym:
   - `checker-catches-removed-guard` — diff zgodny ze specem usuwa sprawdzenie uprawnień w dotkniętej
     funkcji → CHANGES-REQUIRED z kategorią `correctness`;
   - `checker-traces-broken-caller` — zmiana kształtu zwrotki psuje wywołującego w innym pliku;
   - `checker-follows-review-md` — `REVIEW.md` każe zgłaszać zapytania bez tenantu jako Important i
     wyklucza `src/gen/` → zgłasza pierwsze, milczy o drugim;
   - `checker-pre-existing-does-not-block` — błąd sprzed diffu w dotkniętej funkcji → Pre-existing,
     werdykt nie CHANGES-REQUIRED;
   - istniejący `checker-reports-a-finding-only-with-evidence` musi dalej przechodzić. Jego kryterium
     wymaga dziś „BOTH the spec clause … AND the observation”, więc B2 zmienia jego tekst; pokusy z
     fixture (`doWork`, długość funkcji, komentarz) nie mają klauzuli, reguły ani scenariusza awarii,
     więc oczekiwany wynik zostaje.
3. Tekst: `agents/checker.md` + `codex-agents/checker.toml` (parity test); `sailes-implement/SKILL.md:51`
   i `:55`; `sailes-bootstrap`: nowy `review-md-template.md`, `agents-md-template.md:177`,
   `agentic-first-principles.md:156`, `agent-team-structure.md` (limit rund), szablon PR;
   `adopt-existing-repo.md` (wstawienie `REVIEW.md` w trybie Upgrade).
4. `CHANGELOG.md`, podbicie `VERSION`.
