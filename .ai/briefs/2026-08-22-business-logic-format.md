# Propozycja formatu — jak zapisywać logikę biznesową

- **Data:** 2026-08-22
- **Status:** propozycja formatu. **Nic nie trafiło do `skills/`** — to zmiana o zasięgu każdego repo
  na maszynie, więc idzie przez spec. Tu jest sam kształt, do iteracji.
- **Podstawa:** `.ai/audits/2026-08-22-business-logic-inventory.md` (pomiar) + dwa artefakty z pola:
  jeden, który zadziałał, i jeden, który zgnił.

---

## 1. Dwa dowody, na których stoi ten format

### ✅ Co zadziałało — `2026-08-17-supplier-distribution-synthesis.md`

Projekt „New srf speed up async process", `.ai/reference/`, napisane przez agenta 2026-08-17.
**9 KB syntezy nad 480 KB rekonesansu** (dziewięć plików, największy 90 KB). To w tym rekonesansie
leży analiza `proposal view` — `2026-08-17-supplier-side-recon.md` §1.7 i §6.

Co ten plik robi dobrze, punkt po punkcie:

| Element | Cytat z pliku | Dlaczego działa |
|---|---|---|
| **Misja w jednym zdaniu** | *„This document exists so the next session does not have to re-derive the landscape."* | mówi, po co istnieje — nie „dokumentacja", tylko oszczędzenie następnej sesji |
| **Indeks do szczegółu** | tabela 7 siostrzanych dokumentów z kolumną „covers" | synteza zostaje mała, głębia jest osiągalna, nie wlana |
| **Wypowiedzi właściciela ze stemplem** | `## Owner rulings captured this session (2026-08-17)` + cytat *„to nie zmienia logiki"* | proweniencja i data przy każdym ustaleniu |
| **Tabela systemów z kolumną `source of truth for`** | AFE → tożsamość dostawcy, ceny jednostkowe · PP → konta, wyceny · Pipedrive → treść handlowa · Airtable → rejestr ofert, zwycięzca | najcenniejsza kolumna w całym dokumencie |
| **Przepływ numerowany, ze stałymi w treści** | 24h / 48h / 96h eskalacja · top 2 dostawców · 10→50 km · poll 900s | warunki biznesowe tam, gdzie działają |
| **Niewiedza oznaczona, nie ukryta** | *„The caller of that hook is still unidentified"* · *„unreadable — no public API"* | brak wiedzy jest faktem, nie luką do zamaskowania |
| **Sekcja konfliktów** | *„The account / no-account split — represented three times, independently, with nothing synchronising them"* → *„the portal is the de-facto authority and AFE's copy can drift unnoticed"* | nazywa, gdzie ten sam byt biznesowy jest zdublowany i kto naprawdę rządzi |
| **Rozbrojenie kolizji nazw** | *„Proposal view is customer-facing and unrelated to carriers — the supplier-facing »one-pager« is a different page with a confusingly similar name"* | dokładnie klasa błędu, która spaliła śledztwo 43915 |

### 🔴 Co zgniło — `dokumentacja/logika_biznesowa.md` (Partner Portal)

**760 linii, 22 KB, 2026-07-20.** Naiwna wersja tego pomysłu — i już została w tym projekcie
zrobiona. Jak wygląda dziś:

- Tytuł: **„Partner Portal v.2"**. Projekt jest v.3.
- Korpus opisuje **batch cron 8AM/4PM** (4 wystąpienia) jako mechanizm wyboru zwycięzcy. Ten cron
  nie istnieje — zwycięzcę wskazuje system zewnętrzny przez `POST /api/v1/quotes/winner`.
- Sekcja „Validation Rules" wymaga: *„Time: Before next batch (8AM/4PM)"* — warunek nieistniejący.
- Zna **jedno** okno priorytetu (winner 12h). O **commission priority 4h w godzinach pracy** — nic.
- Ktoś to zauważył i dokleił baner w linii 1: `> **STATUS DOKUMENTU:** 🟡 CZĘŚCIOWO AKTUALNY` …
  *„Batch cron NIE ISTNIEJE … to DWA różne mechanizmy."*
- **A `INDEX.md:35` nadal reklamuje ten plik jako: „Logika biznesowa: 2 pipeline'y, batch cron,
  lifecycle deala".** Indeks propaguje twierdzenie, które baner wycofał.

**Trzy warstwy tego samego dokumentu mówią trzy różne rzeczy.** To nie jest porażka pisania — obie
rzeczy pisał kompetentny autor. To porażka **kształtu**: jeden narratuje, drugi indeksuje i stempluje.

### Wniosek, który wyznacza format

> Logika biznesowa przeżywa jako **stemplowane twierdzenia z uchwytem do weryfikacji**, a umiera jako
> **narracja o systemie**. Narracja nie ma miejsca, w którym można sprawdzić, czy nadal jest prawdziwa,
> więc nikt nie sprawdza — dokleja się baner i idzie dalej.

---

## 2. Zasada nadrzędna

**Każde twierdzenie niesie trzy rzeczy: kto to powiedział, kiedy, i gdzie to sprawdzić.**
Twierdzenie bez uchwytu weryfikacyjnego nie wchodzi. Jeśli nie wiadomo — wpisuje się `NIEZNANE`,
a nie pomija.

Test wpuszczenia (dyskryminator z audytu, sprawdzony wstecz na prawdziwych danych):

> **Zdanie jest logiką biznesową wtedy i tylko wtedy, gdy pozostaje prawdziwe po wdrożeniu bieżącej
> pracy.** Jeśli przestaje być prawdziwe, gdy kod pojedzie na produkcję — to stan sesji.

---

## 3. Struktura

Sekcje są **stałe i nazwane**; pliki są jedną implementacją tych sekcji. Start: **jeden plik**.
Podział na folder dopiero, gdy sekcja przekroczy próg.

```
.ai/business-logic.md          ← start; sekcje 0–6 poniżej
```

Gdy plik przekroczy ~400 linii **albo** którakolwiek sekcja ~120 linii:

```
.ai/business-logic/
  README.md        ← sekcja 0 (misja + indeks + jak utrzymywać) — zostaje mała ZAWSZE
  glossary.md      ← 1
  systems.md       ← 2 (+ konflikty)
  rules.md         ← 3
  flows.md         ← 4
  goals.md         ← 5
  superseded/      ← 6: wycofane ustalenia, z datą i powodem
```

**Próg wzięty z pomiaru, nie z gustu:** synteza działa na 9 KB / ~180 linii; `logika_biznesowa.md`
zgniła na 760 liniach. Próg jest bliżej dolnej granicy celowo — jeśli okaże się zły, to jedna liczba
do zmiany, nie przebudowa formatu.

### Sekcja 0 — Misja i indeks
Jedno zdanie po co ten plik istnieje. Tabela: gdzie leży szczegół (rekonesans, incydenty, spece).
**Indeks nigdy nie streszcza treści** — to była porażka `INDEX.md:35`. Indeks podaje nazwę i zakres,
nie twierdzenia.

### Sekcja 1 — Glosariusz
Terminy domenowe i **kolizje nazw**. Format:

```
- **EXPIRED** (deal) — przegrany deal, wycofany z portalu. Przyszła data pickupu w tym stanie jest
  NATURALNA, nie defektem. Ustawia to Make o 03:00 dla deali oznaczonych LOST w Pipedrive — nie cron
  aplikacji. · źródło: właściciel 2026-07-29 · konsekwencja braku: incydent `2026-07-29-deal-43915`
- **one-pager** ≠ **proposal view** — one-pager jest dla przewoźnika, proposal view dla klienta
  końcowego (WordPress). Myląco podobne nazwy. · źródło: `reference/2026-08-17-supplier-side-recon.md` §6
- **deal_type** (`MANUAL`|`PRE_PRICED`) ≠ **pipeline_source** (`SALES`|`PRE_PRICING`) — dwa różne
  pola tej samej encji. · źródło: `system-flows.md` §2 — odnotowuje, że dokumentacja je myli
```

Glosariusz jest tańszy niż reguły i łapie klasę błędów, której reguły nie łapią.

### Sekcja 2 — Systemy i granice
Tabela: system · rola · **`źródło prawdy dla`**. Ta trzecia kolumna jest najważniejsza.
Plus podsekcja **Konflikty**: gdzie ten sam byt biznesowy istnieje w kilku systemach i kto rządzi
de facto (nie na papierze).

### Sekcja 3 — Reguły
Gramatyka linii — greppowalna dla agenta, czytelna dla człowieka, **jeden artefakt, nie dwa**:

```
- **[R-COMM-01]** Jeden przewoźnik MOŻE mieć kilka kont portalowych; `supplier_id` nie jest kluczem firmy.
  · źródło: właściciel 2026-08-04 · egzekwowane: BRAK (świadomie — brak unique na `supplier_id`)
  · konsekwencja: incydent `2026-07-29-winner-commission-resolved-from-wrong-account`

- **[R-COMM-02]** Jeden przewoźnik = jedna wycena per deal; druga próba aktualizuje istniejącą.
  · źródło: właściciel 2026-08-04 · egzekwowane: `deal_quotes UNIQUE (deal_id, supplier_id)`
    + `batch-processing.service.ts:99`

- **[R-COMM-03]** `commission IS NULL` znaczy 0%. Świadoma decyzja, nie przeoczenie.
  · źródło: właściciel 2026-08-04 · egzekwowane: `CommissionResolverService.toPercent`

- **[R-PRIO-01]** Commission priority trwa 4h **liczone tylko w godzinach pracy** (pauza 18:00–9:00
  i weekendy). Jest NIEZALEŻNE od winner priority.
  · źródło: `system-flows.md` §5 (z kodu) · egzekwowane: `deal.priority_effective_expires_at`
  · uwaga: mylone z R-PRIO-02 w co najmniej dwóch dokumentach

- **[R-PRIO-02]** Winner priority trwa 12h **zegara ściennego**, bez pauz.
  · źródło: `system-flows.md` §5 · egzekwowane: `deal_quotes.winner_priority_until`

- **[R-SCOPE-01]** Zlecenia typu HOURLY praktycznie nie występują — nie optymalizujemy pod nie.
  · źródło: właściciel 2026-07-27, cyt. „taki typ zlecenia praktycznie nigdy nie wystąpi"
  · egzekwowane: NIE DOTYCZY (reguła zakresowa)
```

Pola: `[ID]` · zdanie normatywne (jedno) · `źródło:` kto + kiedy (cytat, gdy padł) · `egzekwowane:`
`plik:linia` albo `BRAK` albo `NIE DOTYCZY` · opcjonalnie `konsekwencja:` / `uwaga:`.

**`egzekwowane: BRAK` jest pełnoprawną odpowiedzią i cenną** — mówi, że reguła żyje wyłącznie
w umowie z ludźmi. To informacja, nie brak.

### Sekcja 4 — Przepływ end-to-end
Numerowany, z warunkami i stałymi w treści, z `NIEZNANE` w miejscach niewiedzy. Wzór: §„End-to-end
flow as it runs today" z syntezy. Opisuje **jak to działa dziś** — a nie jak jest zaimplementowane.
Szczegół implementacyjny należy do `system-flows.md` / archify.

### Sekcja 5 — Cel docelowy
Dokąd system zmierza i czego świadomie NIE robimy. Wzór: *„The portal's self-service rate card
influencing the price engine is NOT done and is out of scope"* + zasady kierunkowe z
`research/…-target-architecture.md` („jeden właściciel każdej danej", „synchronizować stan, nie
zmiany"). Bez tego plik opisuje tylko teraźniejszość i nie odpowiada na „po co to robimy".

### Sekcja 6 — `superseded/`
Wycofane ustalenie **przenosi się**, z datą wycofania i powodem. Nie zostaje przekreślone w miejscu.

---

## 4. Twarde reguły utrzymania (każda z zapisanej porażki)

1. **Nigdy nie koryguj banerem.** Poprawka wchodzi do treści albo twierdzenie idzie do
   `superseded/`. `logika_biznesowa.md` ma baner zaprzeczający własnemu korpusowi od miesiąca —
   i indeks, który nadal powtarza wycofane twierdzenie.
2. **Indeks nie streszcza.** Nazwa i zakres, nigdy twierdzenie. Streszczenie w indeksie starzeje się
   niezależnie od źródła (`INDEX.md:35`).
3. **Nie wersjonuj w tytule.** „v.2" w tytule pliku projektu v.3 to gwarantowany fałsz w nagłówku.
4. **Zero fragmentów kodu.** `logika_biznesowa.md` wciągnęło architekturę, listę serwisów i schemat
   bazy pod nagłówek „logika biznesowa" i utonęło. Kod ma `system-flows.md`, archify i spece.
5. **`NIEZNANE` jest obowiązkowe.** Sekcja bez odpowiedzi mówi `NIEZNANE`, nie milczy. To jedyna
   rzecz odróżniająca „sprawdziliśmy, nie wiadomo" od „nikt nie sprawdził".
6. **Nowa reguła nie kasuje starej po cichu** — stara idzie do `superseded/` z powodem.

## 5. Mechaniczny check (tani, deterministyczny)

Jeden skrypt, do wpięcia w bramę:

- każda linia `- **[R-…]**` ma `źródło:` **i** `egzekwowane:` → inaczej FAIL
- każda ścieżka w `egzekwowane:` w formie `plik:linia` **istnieje na dysku** → inaczej FAIL
  („reguła wskazuje na kod, którego nie ma" to dokładnie ta zgnilizna, którą złapał baner —
  miesiąc za późno i ręcznie)
- `README.md` / sekcja 0 nie przekracza progu długości
- każdy ID jest unikalny

To nie sprawdza, czy reguła jest **prawdziwa** — sprawdza, czy jest **sprawdzalna**. Prawdziwość
jest robotą człowieka i tego nie udaję.

## 6. Czego ten format nie robi

- **Nie wykrywa, że przekazujesz regułę.** To osobny mechanizm (detekcja przy wejściu) i osobny
  pomiar — poza zakresem tej propozycji.
- **Nie pilnuje, żeby ktokolwiek go wypełnił.** Sam format to „announcement with no consequence";
  bramka jest osobną decyzją.
- **Nie zastępuje `system-flows.md` ani archify.** Tamte opisują, co robi kod. Ten opisuje,
  czego chce biznes. Zlanie ich to była porażka `logika_biznesowa.md`.
- **Próg 400/120 linii jest zgadnięty z dwóch punktów** (9 KB działa, 22 KB zgniło). To nie jest
  zmierzona granica i nie udaję, że jest.
