# Audyt — co dziś trafia do `.ai/` jako logika biznesowa i gdzie ląduje

- **Data:** 2026-08-22
- **Zlecenie:** „wykonaj badania na przykładzie tego repo jakie informacje teraz tam trafia" —
  przed ustaleniem docelowej metodologii folderu z logiką biznesową.
- **Materiał główny:** `Partner Portal v.3 - clean/.ai/` (79 plików `.md`, 1481 KB) — ma prawdziwą
  domenę, właściciela biznesowego i dziesięć incydentów.
- **Kontrola:** `sailes-app-builder-skill/.ai/` (188 plików `.md`, 2470 KB) — repo bez domeny
  biznesowej, pokazuje co produkuje sama konwencja.
- **Metoda:** inwentaryzacja rozmiarów, ekstrakcja wzorców proweniencji biznesowej i stałych
  liczbowych, ręczna klasyfikacja próbek. Wszystkie liczby odtwarzalne poleceniami w §6.

---

## 1. Najważniejsze: artefakt już powstał sam, w złym miejscu

`STATE.md:168` (Partner Portal) zawiera sekcję zatytułowaną dosłownie:

> `### Reguły biznesowe ustalone przez właściciela 2026-08-04 (nie pytaj o nie ponownie)`

Cztery reguły, spisane świadomie jako trwałe. Sekcja leży **w linii 168 pliku o rozmiarze 197 KB**,
który jest pamięcią sesyjną i jest przepisywany przy każdej kompakcji. Fraza *„nie pytaj o nie
ponownie"* to agent proszący o dokładnie ten mechanizm, którego nie ma.

Treść trzech z nich jest wysokiej próby i trwała:

1. **Jeden przewoźnik MOŻE mieć kilka kont portalowych** — zamierzone od początku; dlatego
   `supplier_id` nie jest kluczem firmy. Rozstrzyga rekomendację z incydentu
   `2026-07-29-winner-commission-resolved-from-wrong-account`.
2. **Jeden przewoźnik = jedna wycena per deal** — wymuszone w bazie
   (`deal_quotes UNIQUE (deal_id, supplier_id)`), druga próba aktualizuje istniejącą.
3. **`commission IS NULL` zostaje 0%** — *świadoma decyzja, nie przeoczenie.*

Punkt 3 jest tu kluczowy dowodowo: ten sam incydent zgłaszał milczące zero jako podejrzany defekt.
Właściciel rozstrzygnął, że to intencja — **i rozstrzygnięcie wylądowało w notatce sesyjnej.**

## 2. Zanieczyszczenie zaczęło się w liście czteroelementowej

Czwarty punkt tej samej sekcji:

> *„Dzisiejsza praca nad szerokością pól poszła na produkcję niedokończona, z adnotacją — na wyraźne
> polecenie właściciela"*

To nie jest reguła biznesowa. To decyzja wydaniowa jednego dnia, nieprawdziwa kilka dni później
(praca została dokończona). **25% zanieczyszczenia w dokumencie napisanym świadomie jako „reguły
biznesowe", przy czterech pozycjach.** To jest empiryczna miara ryzyka śmietnika — nie hipoteza.

Z tego wyprowadzam dyskryminator w §4.

## 3. Reguła znika w miesiąc

`STATE.md:1185`:

> *„HOURLY: właściciel 2026-07-27 — »taki typ zlecenia praktycznie nigdy nie wystąpi«"*

Trwała reguła domenowa (klasa zleceń, której faktycznie nie ma), zapisana raz, tysiąc linii w dół,
praktycznie nieodnajdywalna. Nikt jej nie zarchiwizował ani nie usunął — po prostu przestała być
widoczna.

## 4. Rozproszenie — liczby

| Miara | Partner Portal | Framework (kontrola) |
|---|---|---|
| Pliki `.md` w `.ai/` | 79 | 188 |
| Objętość | 1481 KB | 2470 KB |
| `STATE.md` | 197 KB | 76 KB |
| `lessons.md` | 88 KB | 33 KB |
| `backlog.md` | 71 KB | 60 KB |

Wzmianki o proweniencji biznesowej (`właściciel` / `klient chce|potwierdza` / imię interesariusza)
w Partner Portal: **461 trafień w 79 plikach**, z czego **95 w samym `STATE.md`**.

Ale gdy odfiltrować decyzje procesowe (push/merge, szerokość pola, kolejność wdrożenia) — a takich
jest większość — **faktycznych reguł domenowych zostaje kilkanaście.**

Stałe liczbowe reguł, cały korpus:

| Stała | Trafień | Czym jest |
|---|---|---|
| `24h` | 29 | okno auto-expire (`pickup_datetime + 24h`) |
| `12h` | 29 | winner priority, zegar ścienny |
| `4h` | 15 | commission priority, **tylko godziny pracy** |

**Trzy powtarzalne okna czasowe na cały system.** Hipoteza „logiki biznesowej nigdy nie jest aż tak
dużo" — potwierdzona pomiarem. Problemem jest rozproszenie i brak trwałego miejsca, nie objętość.

Kontrola potwierdza, że to nie patologia Partner Portalu: framework ma ten sam kształt plików-wysypisk
przy zerowej domenie biznesowej. **To produkuje konwencja, nie projekt.**

## 5. Taksonomia — pięć wymiarów sprawdzonych na danych, plus szósty

Wymiary zaproponowane przez właściciela, skonfrontowane z tym, co realnie leży w repo:

| Wymiar | Gdzie dziś mieszka | Ocena |
|---|---|---|
| **Inne systemy współdziałające** (Pipedrive, Make.com, AFE) | `research/2026-07-21-pipedrive-sync/…-target-architecture.md` §6 · incydent 43915 („Make o 03:00 dla LOST") | **najgorzej ulokowany** — w research/ i incydentach, czyli w plikach datowanych i zamykanych |
| **Procesy** | `system-flows.md` (171 linii) | istnieje, ale **opisowy — wyprowadzony z KODU**, snapshot 2026-07-20 |
| **Warunki** | stałe 4h/12h/24h · tabela dwóch okien priorytetu w `system-flows.md` §5 | rozproszone; sam dokument odnotowuje, że są *„najczęściej mylone w dokumentacji"* |
| **Ustalenia biznesowe** | `STATE.md:168` + 461 rozproszonych wzmianek | **zebrane raz, spontanicznie, w pamięci sesyjnej** |
| **Cel docelowy systemu** | `wayfinder/prod-ready-enterprise/map.md` (zakres wysiłku) · `research/…-target-architecture.md` §1–4 (zasady systemowe: „jeden właściciel każdej danej", „synchronizować stan, nie zmiany") | rozdzielony między artefakt zadaniowy i badawczy; oba się zamykają |

**Wymiar szósty, którego nie ma na liście, a dane go wymuszają: definicje terminów (glosariusz).**

Incydent 43915 nie był porażką reguły — był porażką **znaczenia słowa**. `EXPIRED` znaczy „przegrany
deal", a nie „defekt"; przyszła data pickupu jest w tym stanie naturalna. Cała gałąź śledztwa poszła
w błąd, bo agent przyjął własną definicję. Zapis lekcji z incydentu:

> *„Reguła domenowa była znana człowiekowi od początku i jedno pytanie oszczędziłoby całej tej gałęzi."*

Drugi przykład z tego samego korpusu: `system-flows.md` §2 ostrzega, że `deal_type` ≠ `pipeline_source`
i że **dokumentacja te dwa słowniki myli.**

Glosariusz jest tańszy niż reguły i łapie klasę błędów, której reguły nie łapią.

## 6. Dyskryminator przeciw śmietnikowi, wyprowadzony z danych

Zanieczyszczeniem z §2 była **decyzja z datą ważności**. Stąd test wpuszczenia:

> **Zdanie jest logiką biznesową wtedy i tylko wtedy, gdy pozostaje prawdziwe po wdrożeniu bieżącej
> pracy.** Jeśli przestaje być prawdziwe, gdy kod pojedzie na produkcję — to stan sesji, nie logika.

Sprawdzony wstecz na sekcji `STATE.md:168`: przepuszcza reguły 1–3, odrzuca 4. Sprawdzony na regule
HOURLY: przepuszcza. Sprawdzony na „decyzja właściciela o szerokości: 64 px": odrzuca.

Drugi test, uzupełniający: **czy to zdanie odpowiada na pytanie „dlaczego biznes tego chce",
czy na „co zrobiliśmy w kodzie"?** Drugie należy do `system-flows.md` / specu.

## 7. Polecenia odtwarzające liczby

```bash
cd "<repo>/.ai"
find . -name "*.md" -printf "%s\n" | awk '{s+=$1} END {printf "%d plikow, %.0f KB\n", NR, s/1024}'
grep -rniE "właściciel|klient (chce|potwierdz|mówi|prosi)|Agnieszka" --include=*.md . | wc -l
grep -rhoiE "\b(4h|12h|24h|[0-9]+ ?%)\b" --include=*.md . | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn
```

## 8. Czego ten audyt NIE ustalił

- **Nie zmierzono, ile reguł domenowych jest w kodzie a nigdy nie padło w rozmowie** — audyt czytał
  `.ai/`, nie źródła. Prawdziwa liczba reguł systemu jest ≥ tej tutaj.
- **Nie sprawdzono innych repo klienckich** poza Partner Portalem; próbka to jeden projekt z domeną
  plus jedna kontrola bez domeny.
- **Klasyfikacja „reguła vs decyzja procesowa" jest ręczna** na próbce, nie pełnym przeglądzie 461
  trafień. Proporcja („większość to procesowe") to ocena z próbki, nie policzona wartość.
- **Nie ustalono, czy właściciel zgadza się z sześcioma wymiarami** — §5 to propozycja na danych.
