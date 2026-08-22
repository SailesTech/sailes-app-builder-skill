# Logika biznesowa jako artefakt pierwszej klasy

Status: implemented — evidence: `npm test` → 16/16 suites exit 0 · `node tools/business-logic-check.test.js` → 16/16 ok (incl. byte-parity + mutation proof) · fixtures: valid→0, missing-provenance→1, dangling-path→1, duplicate-id→1 · `node release-hygiene.test.js` → exit 0 · five stamps at 1.29.0 → 5 files · checker: **NOT RUN — agent dispatch not authorised in this session; recorded as open debt in `.ai/backlog.md`, not waived** · qa: n/a (framework docs + node tools, no running app to drive)
Owner of the decision: Karol
Decided-by: Karol, 2026-08-22 (D1–D5)
Date: 2026-08-22
Target version: **1.29.0**
Depends-on: `.ai/audits/2026-08-22-business-logic-inventory.md` (pomiar) ·
`.ai/briefs/2026-08-22-business-logic-format.md` (proweniencja formatu)

---

## TLDR

Wiedza biznesowa jest w tych repo zbierana wielokrotnie i grzebana per-task: brief się archiwizuje,
spec jedzie do `implemented/`, a ustalenia właściciela lądują w pamięci sesyjnej i znikają w miesiąc.
Ten spec czyni z niej **stały, nazwany artefakt `.ai/business-logic.md`** z gramatyką, którą da się
maszynowo sprawdzić, i wpina go w bootstrap, adopt, discovery, diagnose oraz kontrakt diagramu
`lifecycle`.

Zakres: **format + miejsce + check + wpięcia**. Detekcja („system zauważa, że przekazuję regułę")
i bramka wymuszająca wypełnianie są poza zakresem — decyzja Karola 2026-08-22.

## Dowód — dlaczego to nie jest hipoteza

Pełny pomiar w audycie; tu tylko to, co uzasadnia konkretny element rozwiązania.

| Obserwacja | Plik | Co z tego wynika |
|---|---|---|
| `### Reguły biznesowe ustalone przez właściciela 2026-08-04 (nie pytaj o nie ponownie)` leży w linii 168 pliku 197 KB przepisywanego przy kompakcji | PP `.ai/STATE.md:168` | artefakt powstaje sam — brakuje mu **stałego miejsca**, nie pomysłu |
| Ta sama lista: 3 trwałe reguły + 1 decyzja wydaniowa nieprawdziwa po kilku dniach | tamże | **25% zanieczyszczenia przy czterech pozycjach** → potrzebny dyskryminator wpuszczenia |
| Reguła „HOURLY praktycznie nigdy nie wystąpi" (właściciel 2026-07-27) — tysiąc linii niżej, nieodnajdywalna | PP `.ai/STATE.md:1185` | plik musi być **greppowalny po ID**, nie chronologiczny |
| 760 linii, tytuł „v.2" w projekcie v.3, korpus opisuje nieistniejący batch cron 8AM/4PM, baner w linii 1 zaprzecza korpusowi, `INDEX.md:35` nadal reklamuje „batch cron" | PP `dokumentacja/logika_biznesowa.md` | **naiwna wersja już była zrobiona i zgniła** → zakaz korekt banerem, zakaz streszczeń w indeksie, zero fragmentów kodu |
| 9 KB syntezy nad 480 KB rekonesansu: misja, indeks, `Owner rulings` ze stemplem, tabela systemów z kolumną `source of truth for`, `UNKNOWN` w treści, sekcja konfliktów, rozbrojenie kolizji nazw (`proposal view` ≠ `one-pager`) | „New srf…" `.ai/reference/2026-08-17-supplier-distribution-synthesis.md` | **wzorzec, który zadziałał** — sekcje formatu są z niego wyprowadzone |
| Trzy powtarzalne okna czasowe na cały system (24h/12h/4h); po odfiltrowaniu decyzji procesowych zostaje kilkanaście reguł w 79 plikach / 1481 KB | audyt §4 | objętość nie jest problemem — **rozproszenie jest** |
| Lekcja z incydentu 43915 żyje w repo klienta i **nigdy nie wróciła do frameworka** | `grep` po `skills/sailes-diagnose/` → 0 trafień | wpięcie w `sailes-diagnose` należy tutaj, nie do „kiedyś" |

## Co framework mówi dziś

- `skeleton.md` / `repo-done-checklist.md` — **nie znają pojęcia logiki biznesowej.**
- `sailes-discovery` — `## Business Case` i `## Domain Core` w briefie, który jest **datowany i per-task**.
- `sailes-diagnose` — **brak reguły o znaczeniu terminu domenowego.** Dokładna luka z 43915.
- `sailes-docs` — `lifecycle.json` **już jest** jednym z pięciu diagramów, ale
  `references/authoring.md:50` definiuje go czysto mechanicznie: *„the core entity's states (deal,
  invoice, application) with retries and failures"*. Bez znaczenia biznesowego stanu i bez tego,
  **kto go ustawia**.

## Decyzje (D1–D5, Karol 2026-08-22)

**D1 — Jeden plik z nagłówkiem, folder po progu.** Bootstrap generuje `.ai/business-logic.md`
z nagłówkiem i pustymi sekcjami 0–6, tak jak dziś startują `lessons.md` i `backlog.md`. Podział na
`.ai/business-logic/` + `superseded/` dopiero po progu (~400 linii pliku / ~120 na sekcję).
*Powód progu:* synteza działa na ~180 liniach, `logika_biznesowa.md` zgniła na 760. Dwa punkty, nie
zmierzona granica — próg celowo bliżej dolnego i jest jedną liczbą do zmiany.

**D2 — Check w obu miejscach, framework na fixture.** `tools/business-logic-check.js` z suitą
w `npm test` oraz samowystarczalna kopia w `hooks-template/` dla repo klienckich. Framework nie ma
własnej domeny biznesowej, więc jego suita jedzie na fixture'ach.
*Powód dwóch kopii, nie wskaźnika:* plugin serwuje `skills/` spoza drzewa roboczego klienta, więc
hook odsyłający do `tools/` na maszynie klienta nie ma do czego sięgnąć — to samo ustalenie, które
`tools/sync-blocks.js` zapisał dla prozy. Rozjazd dwóch implementacji łapie **test parzystości**
na wspólnym korpusie fixture'ów, wzorem `codex-agents/parity.test.js`.

**D3 — W zakresie także:** reguła 43915 w `sailes-diagnose`, wpięcie w `adopt-existing-repo.md`,
żniwo z `sailes-discovery`. **Poza zakresem: eval** — nie wybrany.
*Konsekwencja przyjęta świadomie:* część zmiany jest instrukcją dla modelu, a doktryna tego repo
mówi, że zachowanie modelu weryfikuje eval, nie test. Bez evala **nie będziemy wiedzieć, czy
instrukcja ląduje** — wiemy tylko, że tekst jest w pliku. To jest granica tego wydania.

**D4 — Diagram lifecycle: rozszerzenie kontraktu istniejącego, nie szósty plik.**
*Korekta założenia z bramy.* Pytanie zakładało dodanie szóstego diagramu; `lifecycle.json` jest już
piątym z pięciu. Zmienia się **treść kontraktu**, nie zestaw plików: każdy stan niesie swoje
znaczenie biznesowe i **aktora, który go ustawia**, zaczerpnięte z glosariusza. Wzorzec:
`EXPIRED` ustawia Make o 03:00 dla deali `LOST` w Pipedrive — nie cron aplikacji.
*Skutek:* brama wydania i `release-hygiene.test.js` nietknięte, `docs-author` nie dostaje nowej
powierzchni, a diagram staje się wizualnym indeksem terminów stanowych z glosariusza.

**D5 — Wydanie 1.29.0** — pięć stempli + wpis w `CHANGELOG.md` (bez wpisu żadne starsze repo się
nie dowie: `adopt-existing-repo.md` Upgrade mode czyta właśnie ten plik).

## Kontrakt formatu

Kanonem jest **`skills/sailes-bootstrap/business-logic-template.md`** (powstaje w Fazie 1).
`.ai/briefs/2026-08-22-business-logic-format.md` jest jego proweniencją i **przestaje być źródłem**
w chwili wydania szablonu — jedna reguła, jedno źródło.

**Zasada nadrzędna:** każde twierdzenie niesie *kto to powiedział, kiedy, gdzie to sprawdzić*.
Brak wiedzy zapisuje się jako `NIEZNANE`, nie pomija.

**Dyskryminator wpuszczenia** (sprawdzony wstecz na `STATE.md:168` — przepuszcza reguły 1–3,
odrzuca 4):

> Zdanie jest logiką biznesową wtedy i tylko wtedy, gdy pozostaje prawdziwe **po wdrożeniu bieżącej
> pracy**. Jeśli przestaje — to stan sesji, nie logika.

**Sekcje 0–6:** misja + indeks · glosariusz (terminy i kolizje nazw) · systemy z kolumną
`źródło prawdy dla` + konflikty · reguły · przepływ end-to-end · cel docelowy · `superseded/`.

**Gramatyka linii reguły** — jeden artefakt służy agentowi i człowiekowi, więc nie ma dwóch źródeł
do rozjechania:

```
- **[R-COMM-03]** `commission IS NULL` znaczy 0%. Świadoma decyzja, nie przeoczenie.
  · źródło: właściciel 2026-08-04 · egzekwowane: CommissionResolverService.toPercent
```

Pola: `[ID]` · jedno zdanie normatywne · `źródło:` kto + kiedy (cytat, gdy padł) · `egzekwowane:`
`plik:linia` **albo** `BRAK` **albo** `NIE DOTYCZY` · opcjonalnie `konsekwencja:` / `uwaga:`.
`egzekwowane: BRAK` jest pełnoprawną odpowiedzią — mówi, że reguła żyje wyłącznie w umowie z ludźmi.

**Sześć twardych reguł utrzymania**, każda z zapisanej porażki: nigdy nie koryguj banerem · indeks
nie streszcza · nie wersjonuj w tytule · zero fragmentów kodu · `NIEZNANE` obowiązkowe · nowa reguła
nie kasuje starej po cichu.

---

## Fazy

### Faza 1 — szablon i miejsce

Pliki: `skills/sailes-bootstrap/business-logic-template.md` (nowy) ·
`skills/sailes-bootstrap/skeleton.md` · `skills/sailes-bootstrap/repo-done-checklist.md` ·
`skills/sailes-bootstrap/repo-done-checklist.test.js` · `skills/sailes-bootstrap/SKILL.md`
(lista plików referencyjnych).

**Done-when** — wszystkie cztery:
```
test -f skills/sailes-bootstrap/business-logic-template.md                        → plik istnieje
grep -c "business-logic" skills/sailes-bootstrap/skeleton.md                       → ≥ 1
grep -c "business-logic" skills/sailes-bootstrap/repo-done-checklist.md            → ≥ 2  (wiersz tabeli + linia bloku weryfikacyjnego)
grep -c "business-logic-template" skills/sailes-bootstrap/SKILL.md                 → ≥ 1
node skills/sailes-bootstrap/repo-done-checklist.test.js                           → exit 0
```

### Faza 2 — check mechaniczny, obie kopie

Pliki: `tools/business-logic-check.js` (nowy) · `tools/business-logic-check.test.js` (nowy,
zawiera **także test parzystości** obu implementacji) · `tools/fixtures/business-logic/*.md` (nowe:
`valid.md`, `missing-provenance.md`, `dangling-path.md`, `duplicate-id.md`) ·
`skills/sailes-bootstrap/hooks-template/business-logic-check.js` (nowy, samowystarczalny) ·
`package.json` (suita) · `AGENTS.md` (liczba suit).

Check waliduje: każda linia `- **[R-…]**` ma `źródło:` **i** `egzekwowane:` · każda ścieżka
`plik:linia` w `egzekwowane:` istnieje na dysku · ID unikalne · sekcja 0 poniżej progu.
**Sprawdza sprawdzalność, nie prawdziwość** — prawdziwość jest robotą człowieka i tego nie udajemy.

**Done-when** — wszystkie sześć:
```
node tools/business-logic-check.js tools/fixtures/business-logic/valid.md              → exit 0
node tools/business-logic-check.js tools/fixtures/business-logic/missing-provenance.md → exit 1, komunikat nazywa ID reguły
node tools/business-logic-check.js tools/fixtures/business-logic/dangling-path.md      → exit 1, komunikat nazywa ścieżkę
node tools/business-logic-check.js tools/fixtures/business-logic/duplicate-id.md       → exit 1, komunikat nazywa zdublowane ID
node tools/business-logic-check.test.js                                                → exit 0 (w tym parzystość obu kopii na tym samym korpusie)
npm test                                                                               → exit 0
node -e "console.log(require('./package.json').scripts.test.split('&&').length)"        → 16   ORAZ  grep -c "sixteen suites" AGENTS.md → 1
```

> Ostatnia linia jest umyślna. `AGENTS.md` odnotowuje, że zdanie o liczbie suit **było błędne dwa
> razy jednego dnia, w obie strony**. Liczba idzie z `package.json`, nie z pamięci.

### Faza 3 — wpięcia w skille

Pliki: `skills/sailes-bootstrap/adopt-existing-repo.md` · `skills/sailes-discovery/SKILL.md` ·
`skills/sailes-diagnose/SKILL.md` · `skills/sailes-docs/references/authoring.md`.

Treść wpięć:
- **adopt** — zasiej artefakt z materiału, który repo brownfield już ma (`incidents/`, `STATE.md`,
  `dokumentacja/`), zamiast zostawiać pusty plik.
- **discovery** — wywiad kończy się pytaniem „czy padła reguła domenowa?" → dopisz do artefaktu,
  nie zostawiaj wyłącznie w datowanym briefie.
- **diagnose** — **krok 0:** wypisz terminy domenowe z hipotezy, sprawdź w artefakcie, a czego tam
  nie ma — **zapytaj człowieka, zanim zbierzesz dowody**; odpowiedź wraca do artefaktu.
- **authoring** — wiersz `lifecycle` w tabeli typów: każdy stan niesie znaczenie biznesowe i aktora,
  który go ustawia; źródłem jest glosariusz artefaktu.

**Done-when** — wszystkie pięć:
```
grep -c "business-logic" skills/sailes-bootstrap/adopt-existing-repo.md      → ≥ 1
grep -c "business-logic" skills/sailes-discovery/SKILL.md                    → ≥ 1
grep -c "business-logic" skills/sailes-diagnose/SKILL.md                     → ≥ 1
grep -niE "business meaning and the actor" skills/sailes-docs/references/authoring.md → trafienie w wierszu `lifecycle`
   (kryterium poprawione 2026-08-22: pierwotnie greppowało polską frazę, a `authoring.md` jest po angielsku)
npm test                                                                     → exit 0
```

### Faza 4 — wydanie 1.29.0

Pliki: `VERSION` · `package.json` · `.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` ·
`AGENTS.md` (stempel `Framework-Version:`) · `CHANGELOG.md` · ewentualnie `docs/architecture/lifecycle.json`
+ `.ai/docs-deltas/2026-08-22-business-logic-as-a-first-class-artifact.json`.

**Done-when** — wszystkie cztery:
```
grep -l "1\.29\.0" VERSION package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json AGENTS.md | wc -l → 5
grep -c "^## 1\.29\.0" CHANGELOG.md                                          → 1
node release-hygiene.test.js                                                 → exit 0
npm test                                                                     → exit 0
```

Jeśli `docs/architecture/lifecycle.json` tego repo zmieni się pod nowy kontrakt — receipt delty
ląduje w `.ai/docs-deltas/`, zgodnie z procedurą wydania. Jeśli nie zmieni się, **zapisujemy to
jawnie** w run logu; milczenie jest tu porażką, nie neutralnością.

## Ryzyko przyjęte świadomie

**Format nie został użyty w boju.** Jest wyprowadzony z dwóch cudzych artefaktów — jednego, który
zadziałał, i jednego, który zgnił — ale nikt jeszcze nim nic nie napisał. Alternatywa (najpierw
wypełnić Partner Portal, potem promować) była przedstawiona i **odrzucona przez Karola 2026-08-22**
na rzecz szybszego rozejścia się na wszystkie repo. Konsekwencja: pierwsze realne wypełnienie może
wymusić zmianę szablonu **po** wydaniu, a repo, które wystartowały na 1.29.0, będą miały artefakt
w innym kształcie niż te późniejsze. To cena, nie niespodzianka.

**Bez evala nie wiemy, czy instrukcje lądują** (D3). Testy dowodzą, że tekst jest w pliku i że check
działa — nie że agent zachowa się zgodnie z instrukcją.

## Non-goals

- **Detekcja przekazywanej reguły** — odłożone przez Karola 2026-08-22, razem z jej pomiarem.
- **Bramka wymuszająca wypełnienie.** Powód, nie zakaz: bramka na niesprawdzonym formacie utrwala
  jego wady. Wraca, gdy artefakt będzie miał realne wypełnienie.
- **Wypełnienie Partner Portalu** — odrzucone jako krok pierwszy; może wrócić jako osobne zadanie.
- **Zastąpienie `system-flows.md`, archify ani speców** — tamte opisują, co robi kod. Zlanie tych
  dwóch rzeczy to była dokładna porażka `logika_biznesowa.md`.
- **Migracja istniejących `dokumentacja/logika_biznesowa.md`** w repo klienckich — plik zostaje,
  gdzie jest, do osobnej decyzji.
- **Szósty diagram** — patrz D4; kontrakt istniejącego `lifecycle` wystarcza.
