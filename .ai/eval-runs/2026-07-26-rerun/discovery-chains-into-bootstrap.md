# Discovery run — "chcę zbudować aplikację do ofertowania dla handlowców"

**Type:** dry-run / eval record. **Date:** 2026-07-26.
**Method followed:** `skills/sailes-discovery/SKILL.md` (+ `brief-template.md`), framed by `skills/sailes-start/SKILL.md`.
**Nothing was built.** No project repo, no project code, no spec, no team spawned, no skill actually invoked. This file is the only artifact produced.

> ⚠️ **SIMULATION NOTICE — read before trusting any answer below.**
> The human could not be interviewed in this run. Every line marked **`[SYM]`** is an answer **invented by the AI on the human's behalf** to let the method run end-to-end. It is plausible and internally consistent, **but it is not evidence of what this client wants.** In a real run, none of it exists until the human clicks it in `AskUserQuestion`. A brief built on `[SYM]` answers must be re-interviewed before it drives anything.
> Lines marked **`[AI]`** are what the AI would genuinely say/ask.

---

## Step 0 — Variant, orientation, and the one-line map

**Classification: GREENFIELD.** The brief is "chcę zbudować aplikację" — a new app, no existing application named. → `sailes-start` Route A → `sailes-discovery` greenfield variant → `sailes-bootstrap` Case B.

**Cheap repo orientation (done, real):**
- The current working directory `D:\Work\Internal\sailes-app-builder-skill` is the **framework/skills repo itself** (`skills/`, `agents/`, `evals/`, `AGENTS.md`, `.ai/specs/`) — **it is not the target project.** The quoting app is a separate, new repository.
- Consequence, per the skill's Common Mistakes ("Anchoring on the host repo's stack for a greenfield project"): **nothing about this repo's stack, conventions or `.ai/` layout is carried into the interview.** I stay stack-agnostic until the human states constraints; the target repo will be created by bootstrap, not here.
- There *is* a global spec skill (`skills/sailes-spec/`) and bootstrap ships `spec-writing-template.md`, so the Phase-3 handoff is known in advance: bootstrap will generate a **local** `.ai/skills/spec-writing/SKILL.md` in the new repo, and that is what writes the spec.

**[AI] — what I say first (one or two lines, then straight into questions):**

> Zanim cokolwiek zaprojektuję: to jest **wywiad odkrywczy**, nie start kodowania. Zadam Ci kilka rund pytań (po 3-4, klikane), potem podsumuję i pokażę **tabelę decyzji** do zatwierdzenia. Dopiero po Twoim „tak" idzie to dalej: **setup repo (bootstrap) → design → spec → implementacja**. Nie proponuję teraz modelu danych ani stacku — to by było zgadywanie.

*(Not proposed at this point, deliberately: entities, modules, framework, DB, hosting, roles.)*

---

## Step 1 — Elicitation in adaptive rounds

Real runs use `AskUserQuestion`, 3-4 questions per round, each round shaped by the last. Reproduced here as Q/A.

### Round 1 — Business case, probed deep (lead with the critical unknowns)

**[AI] Q1.1 — Co dokładnie dziś boli i *dlaczego teraz*? Co uruchomiło ten temat (przegrany deal / nowy handlowiec / audyt / decyzja zarządu)?**
**[SYM] A1.1** — Firma: producent i dystrybutor systemów regałowych/magazynowych, ~40 osób, sprzedaż B2B w PL. Oferty robi się dziś w Excelu (kalkulator cen) + Wordzie (szablon) → PDF → Gmail. Wyzwalacz: **przegrany przetarg na 380 tys. zł** — oferta poszła po 5 dniach i z ceną z nieaktualnego cennika (po podwyżce stali), więc marża wyszła ujemna i trzeba było się wycofać. Drugi wyzwalacz: **dwóch nowych handlowców** od kwietnia, którzy „nie umieją" Excela kalkulacyjnego i robią błędy.

**[AI] Q1.2 — Ile to kosztuje dziś, w godzinach i w pieniądzach?**
**[SYM] A1.2** — Handlowiec traci **6-8 h/tydzień** na składanie ofert (kopiowanie pozycji, przeliczanie rabatów, składanie PDF-a). Przy 12 handlowcach to ~2 etaty. Błędy cenowe: **3-4 na kwartał**, z czego jeden w tym roku kosztował ok. 40 tys. zł marży. Średni czas od zapytania do wysłanej oferty: **3,5 dnia**; najszybsza konkurencja robi to tego samego dnia.

**[AI] Q1.3 — Kto to zamówił i jak *on* zdefiniuje sukces?**
**[SYM] A1.3** — Zamawia **dyrektor sprzedaży** (jego budżet, on odpowiada za wynik). Jego definicja sukcesu: (1) oferta wychodzi **w < 24 h** od zapytania, (2) **zero ofert poniżej progu marży** bez świadomej akceptacji, (3) on widzi w jednym miejscu, **ile ofert wisi i za ile**. IT nie ma w firmie (jest zewnętrzna firma od sieci/Windows), więc dział IT nie jest interesariuszem — jest tylko dostawcą dostępu.

**[AI] Q1.4 — Produkt na sprzedaż, narzędzie wewnętrzne, czy MVP pod inwestora?**
**[SYM] A1.4** — **Narzędzie wewnętrzne**, wyłącznie dla jednej firmy. Nie sprzedajemy tego dalej, nie ma inwestora. Jak nie zbudujemy — zostajemy z Excelem i będziemy dalej przegrywać na czasie; dyrektor mówi, że wtedy w przyszłym roku i tak kupi gotowy CPQ, ale wolałby swoje, bo konfiguracja produktu jest nietypowa.

### Round 2 — Domain core, role (enumerated by the human, not invented), skala

**[AI] Q2.1 — Wymień *wszystkie* role, które kiedykolwiek dotkną tej aplikacji. Nie zgaduję — nie dopiszę żadnej sam.**
**[SYM] A2.1** — Cztery: (a) **handlowiec** — tworzy i wysyła ofertę; (b) **dyrektor sprzedaży** — zatwierdza rabaty powyżej progu i ogląda zestawienia; (c) **specjalista ds. cen (backoffice)** — pilnuje cennika i danych produktowych, poprawia importy; (d) **administrator** — zakłada konta, ustawia progi rabatowe. **Nie ma** roli „klient z loginem" — klient dostaje link/PDF, nie konto.

**[AI] Q2.2 — Ilu użytkowników dziś, ilu za rok, ilu naraz w szczycie? Ile ofert miesięcznie?**
**[SYM] A2.2** — Dziś **12 handlowców + 4 pozostali = 16 kont**. Za rok realnie **~30** (plan otwarcia oddziału). Naraz w szczycie (poniedziałek rano) **6-8 osób**. Ofert: **~600/miesiąc**, średnio 15-40 pozycji na ofercie, szczyt w marcu i wrześniu (~900).

**[AI] Q2.3 — Jakie są 3-5 bytów, wokół których wszystko się kręci — i jaki jest ten *jeden* przepływ, który JEST tym produktem?**
**[SYM] A2.3** — Byty: **Oferta** (z wersjami), **Pozycja oferty**, **Produkt/SKU + cennik**, **Klient/Kontakt**, **Reguła rabatowa**. Przepływ, który JEST produktem: *zapytanie → handlowiec składa ofertę z katalogu (ceny i rabaty liczone automatycznie) → jeśli rabat > progu, idzie do zatwierdzenia → PDF + link wysłany do klienta → status: wysłana / obejrzana / zaakceptowana / odrzucona*.

**[AI] Q2.4 — Co jest sercem MVP, a co świadomie „później"?**
**[SYM] A2.4** — Serce: katalog + kalkulacja + zatwierdzanie rabatu + PDF + wysyłka + status. Później: warianty produktu z konfiguratorem 3D, wersjonowanie porównawcze („oferta A vs B" dla klienta), podpis elektroniczny, EN/DE.

### Round 3 — Istniejąca infrastruktura i integracje (drążone, nie przyjęte na słowo)

**[AI] Q3.1 — Mówisz „mamy trochę infrastruktury" — co dokładnie? Jaki hosting, jakie usługi już tam chodzą, czy jest baza do ponownego użycia, czy jest SSO?**
**[SYM] A3.1** — Po dopytaniu: **nie ma nic swojego pod aplikacje**. Jest VPS w OVH, na którym stoi **WordPress ze stroną firmową**, utrzymywany przez agencję marketingową — nie chcemy tam nic dokładać. **Nie ma żadnej Postgresowej bazy do reużycia.** Jest **Google Workspace** (wszyscy mają konta firmowe) — logowanie Google byłoby naturalne. Nie ma VPN-u, nie ma wymogu IP allowlist, nie ma polityki data residency poza „wolimy UE".

**[AI] Q3.2 — Pipedrive: jaki plan, jakie custom fieldy i etapy, ile deali już jest, i co jeszcze go dotyka (Make/Zapier/n8n)?**
**[SYM] A3.2** — **Pipedrive plan Advanced** (są webhooki i API). Jeden pipeline, 6 etapów: *Zapytanie → Kwalifikacja → Oferta → Negocjacje → Wygrana → Przegrana*. Custom fieldy na dealu: „Źródło", „Segment", „Wartość netto szacowana". **~4 300 deali** historycznie, ~1 800 aktywnych/rok. Dotyka go **jeden scenariusz Make**: formularz ze strony WWW → tworzy deal + kontakt. Nic więcej nie pisze do Pipedrive'a.

**[AI] Q3.3 — Skąd biorą się produkty i ceny? Jest ERP? Ma API?**
**[SYM] A3.3** — **Comarch ERP XL**, on-premise, wdrożony przez lokalnego partnera. **Nie ma wystawionego REST API** i partner wycenił jego udostępnienie na kilkanaście tysięcy + kilka tygodni. Co **jest**: nocny **eksport CSV** na firmowy SFTP — kartoteka towarowa (**~3 800 SKU**) + cennik bazowy + stany. Ceny zmieniają się nieregularnie (stal), średnio **2-3 razy w miesiącu**, czasem z dnia na dzień.

**[AI] Q3.4 — Dla każdego pola, które ruszy dwa systemy: gdzie jest prawda?**
**[SYM] A3.4** — Produkt, cena bazowa, stany → **prawda w ERP**, aplikacja tylko czyta. Klient/kontakt → **prawda w Pipedrive**. Oferta, pozycje, rabaty, statusy → **prawda w nowej aplikacji** (dziś nie istnieją nigdzie). Wartość i etap deala → prawda w Pipedrive, ale aplikacja może go **aktualizować**.

### Round 4 — Decision cards (forks that change scope/architecture — the human chooses)

> Per the method, discovery runs the **scope/architecture** cards. The **stack** cards (framework shape, ORM, auth, hosting, PDF engine, monorepo+worker) belong to `sailes-bootstrap` Phase 2 — here I only capture hard constraints and leanings, and I say so out loud.

```
Decyzja D1: Model najemcy (tenancy)
Dlaczego ważne: przenika cały model danych i autoryzację; dokładanie później = migracja wszystkiego.
Opcje:
  A) Single-tenant (jedna firma)      — ✅ najprostszy model danych, brak organizationId w każdym zapytaniu, szybszy MVP  ⚠️ gdyby kiedyś sprzedawać to innym firmom, to przepisanie warstwy dostępu
  B) Multi-tenant od startu           — ✅ gotowe na sprzedaż produktu innym  ⚠️ +2-3 tygodnie pracy i stały koszt złożoności, którego nikt dziś nie potrzebuje
Rekomendacja: A — bo sam powiedziałeś (A1.4), że to narzędzie wewnętrzne dla jednej firmy i nie ma planu sprzedaży.
```
**[SYM] Wybór: A — single-tenant.**

```
Decyzja D2: Głębokość integracji z Pipedrive
Dlaczego ważne: to jest najdroższy i najbardziej awaryjny element całości.
Opcje:
  A) Tylko odczyt (klient/kontakt/deal do wyboru w ofercie)  — ✅ prawie zerowe ryzyko konfliktów  ⚠️ dyrektor dalej nie widzi statusu ofert w Pipedrive
  B) Jednokierunkowo: aplikacja → Pipedrive (zapis wartości oferty, etapu, notatki/linku)  — ✅ jedno źródło prawdy per pole, prosty rollback; dyrektor widzi ofertę na dealu  ⚠️ trzeba uzgodnić kolizję z istniejącym scenariuszem Make i obsłużyć rate limity/retry
  C) Dwukierunkowa synchronizacja  — ✅ zmiana w Pipedrive wraca do oferty  ⚠️ realny koszt: rozstrzyganie konfliktów, webhooki, pętle aktualizacji, stałe utrzymanie — to najczęstsze źródło „aplikacja kłamie" w takich wdrożeniach
Rekomendacja: B — bo prawda per pole jest już jasna (A3.4), a sukces dyrektora (A1.3) wymaga widoczności w Pipedrive, nie edycji ofert z Pipedrive.
```
**[SYM] Wybór: B — jednokierunkowo app → Pipedrive; kontakty/deale czytamy.**
**[SYM] Doprecyzowanie:** ten sam deal nie może być ruszany przez scenariusz Make — Make tylko *tworzy* deale z formularza, więc kolizji nie ma; aplikacja aktualizuje wyłącznie już istniejący deal.

```
Decyzja D3: Źródło danych produktowych i cen
Dlaczego ważne: decyduje, czy oferta może być błędna cenowo — czyli o głównym powodzie projektu.
Opcje:
  A) Nocny import CSV z SFTP (ERP → aplikacja, read-only)  — ✅ działa dziś, zero kosztu po stronie partnera ERP; jasny audyt „wersja cennika z dnia X"  ⚠️ okno nieaktualności do 24 h; potrzebny widoczny znacznik daty cennika i ręczny „importuj teraz"
  B) Katalog utrzymywany ręcznie w aplikacji  — ✅ pełna kontrola, niezależność od ERP  ⚠️ backoffice utrzymuje 3 800 SKU dwa razy — to odtworzenie dzisiejszego problemu
  C) Integracja live z ERP  — ✅ zawsze aktualna cena  ⚠️ kilkanaście tysięcy zł i kilka tygodni po stronie partnera ERP, zanim ruszymy
Rekomendacja: A + widoczna data cennika na ofercie i ostrzeżenie, gdy import się nie powiódł — bo blokada z C zatrzymałaby projekt na starcie, a B odtwarza problem.
```
**[SYM] Wybór: A.** Dodatkowy warunek od klienta: jeśli import nocny padnie, **handlowiec ma widzieć czerwony pasek** „cennik z dnia …", a nie po cichu ofertować ze starego. C zapisujemy na później (backlog), gdyby partner ERP staniał.

```
Decyzja D4: Kontrola rabatów
Dlaczego ważne: to jest mechanizm, który ma wyeliminować oferty poniżej marży.
Opcje:
  A) Twardy limit z reguły (nie da się zejść niżej)  — ✅ zero ofert pod progiem, zero pracy dyrektora  ⚠️ zabija elastyczność w dużych przetargach; handlowcy zaczną obchodzić system Excelem
  B) Próg + wniosek o zatwierdzenie w aplikacji (dyrektor akceptuje/odrzuca)  — ✅ elastyczność zachowana, każda decyzja ma ślad i autora  ⚠️ dyrektor staje się wąskim gardłem; potrzebne powiadomienia i SLA odpowiedzi
  C) Bez kontroli, tylko raport po fakcie  — ✅ zero tarcia  ⚠️ nie rozwiązuje problemu, który uzasadnia projekt
Rekomendacja: B — bo sukces zdefiniowałeś jako „zero ofert poniżej progu marży *bez świadomej akceptacji*" (A1.3), a to dokładnie opisuje wariant B.
```
**[SYM] Wybór: B.** Próg ustawiany per grupa produktowa przez administratora; powiadomienie mailem + w aplikacji.

```
Decyzja D5: Co widzi klient
Dlaczego ważne: zmienia zakres MVP i to, czy w ogóle da się mierzyć „obejrzana / zaakceptowana".
Opcje:
  A) Tylko PDF w mailu  — ✅ najprostsze  ⚠️ nie wiemy, czy klient otworzył; status trzeba klikać ręcznie
  B) PDF + unikalny link do wersji web (podgląd, bez logowania)  — ✅ wiemy, kiedy otwarto; ten sam dokument, jedna prawda  ⚠️ trzeba przemyśleć bezpieczeństwo linku (token, wygasanie) i to, że link krąży dalej po stronie klienta
  C) B + przycisk „Akceptuję" / „Mam pytania"  — ✅ status akceptacji wpada sam, mierzalna konwersja  ⚠️ to nie jest podpis elektroniczny ani umowa — trzeba to jasno napisać na stronie, żeby nikt tego tak nie traktował
Rekomendacja: B na MVP, C zaraz po — bo C wymaga uzgodnienia treści prawnej, a to zwykle czeka na kogoś po stronie klienta.
```
**[SYM] Wybór wstępny: B** *(zmieniony przy potwierdzaniu — patrz Krok 2)*.

### Round 5 — Dane, zgodność, metryki, czas, non-goals, kto to buduje

**[AI] Q5.1 — Dane osobowe i regulacje?**
**[SYM] A5.1** — Tylko dane kontaktowe firm B2B (imię, nazwisko, mail, telefon służbowy) — **RODO tak, nic wrażliwego**, brak HIPAA/PCI (płatności nie ma w aplikacji). Preferencja: hosting w UE. Potrzebny **log kto co zatwierdził i kiedy** — dla dyrektora, nie dla audytora.

**[AI] Q5.2 — Kiedy i jak poznamy, że to działa?**
**[SYM] A5.2** — **Pilot z 3 handlowcami za ~8 tygodni**, pełne wdrożenie do końca Q4. Miary: mediana czasu zapytanie→oferta **< 24 h** (dziś 3,5 dnia), **0 ofert pod progiem marży bez akceptacji**, **≥ 80 % ofert** robionych w aplikacji (a nie w Excelu) po 2 miesiącach.

**[AI] Q5.3 — Budżet/postawa kosztowa i wymagana dostępność?**
**[SYM] A5.3** — „Tanio, ale poważnie": hosting rzędu **kilkuset zł/mies.**, nie enterprise. Dostępność: **godziny pracy 7-18**, awaria na godzinę to nie katastrofa; utrata danych oferty — tak, katastrofa. Backup dzienny wystarczy.

**[AI] Q5.4 — Czego świadomie NIE budujemy?**
**[SYM] A5.4** — Nie budujemy CRM-a (Pipedrive zostaje). Nie piszemy do ERP. Nie robimy aplikacji mobilnej (ma działać na laptopie; na telefonie wystarczy podgląd). Nie robimy wielojęzyczności w MVP (PL). Nie robimy podpisu elektronicznego. Nie robimy konfiguratora 3D.

**[AI] Q5.5 — Kto to będzie budował i utrzymywał, i czy jest twarde ograniczenie technologiczne?**
**[SYM] A5.5** — Buduje **zespół Sailes**, utrzymywać ma docelowo **jeden nasz programista** (TypeScript/React, zna Node, nie zna Pythona ani .NET-a). **Twardych ograniczeń brak** — poza tym, że „musi to być coś, co utrzyma jedna osoba". Hosting w UE mile widziany.
**[AI]** → To jest wejście do kart decyzyjnych stacku, które prowadzi **bootstrap**, nie ja tutaj. Zapisuję jako ograniczenie, nie wybieram frameworka.

---

## Step 2 — Reflection, Decisions Ledger, and confirmation

**[AI] — podsumowanie tego, co usłyszałem** (skrót; pełna treść trafia do briefu poniżej): narzędzie wewnętrzne dla jednej firmy, 16 → ~30 użytkowników, ~600 ofert/mies., serce = katalog + kalkulacja + zatwierdzanie rabatu + PDF/link + status; ERP tylko do odczytu CSV, Pipedrive zapis jednokierunkowy; pilot za 8 tygodni.

### Decisions Ledger (wersja przedstawiona do zatwierdzenia)

| Decyzja | Wybrane | Przez | Odrzucone alternatywy (dlaczego nie) |
|---|---|---|---|
| Tenancy | single-tenant | user | multi-tenant (nie ma planu sprzedaży produktu — A1.4) |
| Głębokość integracji Pipedrive | jednokierunkowo app → Pipedrive + odczyt kontaktów/deali | user | tylko odczyt (brak widoczności dla dyrektora); dwukierunkowa (koszt konfliktów i utrzymania) |
| Źródło produktów i cen | nocny import CSV z SFTP (ERP read-only) + widoczna data cennika | user | ręczny katalog (dublowanie 3 800 SKU); live ERP API (kilkanaście tys. zł i tygodnie po stronie partnera) |
| Kontrola rabatów | próg + wniosek o zatwierdzenie w aplikacji | user | twardy limit (obejścia Excelem); brak kontroli (nie rozwiązuje problemu) |
| Co widzi klient | PDF + link web (podgląd) | user | sam PDF (brak sygnału „obejrzana"); + akceptacja (czeka na treść prawną) |
| Model ról | handlowiec / dyrektor sprzedaży / specjalista ds. cen / administrator — **wyliczone przez klienta** | user | żadna rola nie została dopisana przez AI; „konto dla klienta" wykluczone wprost |
| Uwierzytelnianie — kierunek | logowanie kontem Google Workspace (wszyscy je mają) | user | osobne hasła (kolejny sekret do utrzymania) — **konkretny mechanizm/dostawca wybiera bootstrap** |
| Zakres MVP | katalog + kalkulacja + zatwierdzanie + PDF/link + statusy | user | konfigurator, wersje porównawcze, e-podpis, EN/DE → backlog |
| Stack (framework, ORM, hosting, silnik PDF, worker/monorepo) | **NIEROZSTRZYGNIĘTE — świadomie** | — | prowadzi to `sailes-bootstrap` Faza 2 kartami decyzyjnymi; discovery notuje tylko ograniczenia: TS/React-owy zespół, jeden utrzymujący dev, hosting UE, budżet kilkuset zł/mies. |

**Vetoable trivia (odwracalne, bez kosztu):** numeracja ofert `OF/{rok}/{nr}`; domyślna ważność oferty 30 dni; sortowanie katalogu po nazwie SKU. Do zmiany w każdej chwili.

**[AI] Pytanie zamykające:** „Czy zgadzasz się z **każdą** decyzją w tabeli (możesz zmienić dowolną), i czy coś poprawić lub dodać?"

**[SYM] Odpowiedź:** „Prawie. Jedna zmiana: **przycisk „Akceptuję" ma być w MVP** (wariant C w D5) — bez tego nie zmierzę konwersji, a to jest dla mnie główna metryka. Treść prawną („to nie jest umowa, potwierdzenie zamówienia wystawia dział handlowy") daję w tym tygodniu. Podpis elektroniczny dalej odpada. Reszta OK."

### Round 6 — targeted follow-up on the new unknown (required by the method)

**[AI] Q6.1 — Kiedy klient kliknie „Akceptuję", co ma się stać w Pipedrive i po stronie zespołu?**
**[SYM] A6.1** — Deal przechodzi na etap **Negocjacje → (nowy etap) „Oferta zaakceptowana"**, na dealu ląduje notatka z linkiem i kwotą, handlowiec dostaje maila i powiadomienie w aplikacji. **Etapu „Wygrana" nie ruszamy** — to robi człowiek po potwierdzeniu zamówienia.
**[AI]** → to znaczy, że w Pipedrive trzeba **dodać etap** przed startem; zapisuję jako zależność po stronie klienta.

**[AI] Q6.2 — Kto może kliknąć „Mam pytania" i czy to ma tworzyć zadanie?**
**[SYM] A6.2** — Każdy, kto ma link. Ma tylko wysłać maila do handlowca i ustawić status „Pytania klienta". Bez tworzenia zadań w Pipedrive.

**[AI] Q6.3 — Link do oferty: wygasa? Da się unieważnić?**
**[SYM] A6.3** — Token nieodgadywalny, **wygasa po 60 dniach**, handlowiec może go unieważnić ręcznie. Wersja oferty pod linkiem jest zamrożona — poprawka = nowa wersja i nowy link.

**[AI] — zaktualizowany wiersz ledgeru:**

| Decyzja | Wybrane | Przez | Odrzucone alternatywy |
|---|---|---|---|
| Co widzi klient | **PDF + link web + akceptacja/„mam pytania" (C)**, link z tokenem, wygasa po 60 dniach, unieważnialny | user (zmiana przy potwierdzaniu) | sam PDF; link bez akcji; e-podpis (odrzucony wprost) |

**[AI] Ponowne pytanie zamykające.** **[SYM] Odpowiedź: „Tak, zatwierdzam."**
→ **BRIEF POTWIERDZONY.** Żaden wiersz nie pozostaje w stanie *AI-recommended-pending*. Bramka Fazy 1 zaliczona.

---

## Step 3 — The Brief (per `brief-template.md`, greenfield)

```markdown
# Project Brief: Aplikacja do ofertowania dla handlowców (wewnętrzny CPQ-lite)

## TLDR
Wewnętrzna aplikacja webowa, w której 12 (docelowo ~30) handlowców składa oferty
z katalogu produktowego zaciąganego z ERP, z automatyczną kalkulacją cen i rabatów,
zatwierdzaniem rabatów przez dyrektora sprzedaży, generowaniem PDF-a i linku dla klienta
oraz śledzeniem statusu — z zapisem wartości i etapu do Pipedrive.

## Business Case
- Problem & audience: oferty powstają w Excelu + Wordzie; 6-8 h/tydz. na handlowca,
  mediana czasu do oferty 3,5 dnia, 3-4 błędy cenowe kwartalnie. Wyzwalacz: przegrany
  przetarg 380 tys. zł (oferta po 5 dniach, cena z nieaktualnego cennika) i dwóch nowych handlowców.
- Value / revenue model: brak przychodu wprost — oszczędność ~2 etatów i eliminacja ofert
  poniżej progu marży; szybsza reakcja = wyższa wygrywalność.
- Product vs. internal tool vs. MVP-to-raise: **internal tool**, jedna firma, bez planu sprzedaży.
- Zamawiający: dyrektor sprzedaży (jego budżet i jego wynik).
- Jeśli nie powstanie: pozostaje Excel; alternatywą klienta jest zakup gotowego CPQ w 2027.

## Domain Core
- Core entities: Oferta (z wersjami) · Pozycja oferty · Produkt/SKU + Cennik · Klient/Kontakt · Reguła rabatowa.
- The one workflow that IS the product: zapytanie → oferta z katalogu (auto-kalkulacja)
  → [rabat > progu ⇒ zatwierdzenie] → PDF + link → status (wysłana / obejrzana /
  zaakceptowana / pytania / odrzucona) → zapis do Pipedrive.
- MVP heart: katalog + kalkulacja + zatwierdzanie rabatu + PDF/link + statusy + zapis do Pipedrive.
- Later: konfigurator wariantów (3D), wersje porównawcze A/B dla klienta, e-podpis, EN/DE.

## Users & Scale
- Role (wyliczone przez klienta, żadnej nie dopisano): handlowiec · dyrektor sprzedaży
  (zatwierdza rabaty, ogląda zestawienia) · specjalista ds. cen / backoffice (cennik, dane
  produktowe, importy) · administrator (konta, progi rabatowe).
  Klient końcowy NIE ma konta — dostaje link.
- Target user count: 16 kont dziś → ~30 w ciągu roku.
- Concurrency: 6-8 równocześnie w szczycie (poniedziałek rano).
- Wolumen: ~600 ofert/mies. (szczyt ~900 w III i IX), 15-40 pozycji na ofertę, ~3 800 SKU.

## Tenancy & Access
- Tenancy model: **single-tenant**.
- Roles / permission model: cztery role wyżej; zatwierdzanie rabatu = uprawnienie dyrektora;
  administrator ustawia progi per grupa produktowa. Ślad audytowy: kto zatwierdził/odrzucił i kiedy.

## Tech Stack
- **Nie zdecydowany na tym etapie — świadomie.** Karty decyzyjne (kształt frameworka, ORM,
  auth, hosting, silnik PDF, monorepo+worker) prowadzi `sailes-bootstrap` Faza 2.
- Ograniczenia wniesione przez klienta: zespół TS/React, docelowo utrzymuje JEDEN programista
  (nie zna Pythona/.NET), hosting preferowany w UE, budżet hostingowy rzędu kilkuset zł/mies.,
  logowanie kontem Google Workspace jako kierunek.
- Existing systems to integrate: Pipedrive (Advanced) · Comarch ERP XL (eksport CSV na SFTP) ·
  Google Workspace · (VPS z WordPressem — świadomie NIE dotykamy).

## Infrastructure
- Runtime target: **do rozstrzygnięcia w bootstrapie**; nic własnego dziś nie istnieje,
  brak bazy do reużycia, brak VPN/allowlisty.
- Availability / SLA: godziny pracy 7-18; godzinna awaria akceptowalna; utrata danych — nie.
  Backup dzienny wystarczy.
- Budget posture: tani, ale produkcyjny MVP (kilkaset zł/mies.).

## Data & Compliance
- PII: dane kontaktowe B2B (imię, nazwisko, mail, telefon służbowy). Brak danych wrażliwych,
  brak płatności w aplikacji.
- Regulatory: RODO (standardowo). Bez HIPAA/PCI.
- Residency / audit: preferencja UE; wymagany log zatwierdzeń rabatów (kto/kiedy/co).
- Link ofertowy: token nieodgadywalny, wygaśnięcie 60 dni, ręczne unieważnienie,
  zamrożona wersja dokumentu pod linkiem.

## Integrations
- **Pipedrive (Advanced)** — kierunek zapisu: app → Pipedrive (wartość oferty, etap, notatka z linkiem).
  Odczyt: kontakty i deale. Pipeline 6-etapowy + **nowy etap „Oferta zaakceptowana" do dodania
  po stronie klienta przed startem** (zależność). Custom fieldy: Źródło, Segment, Wartość netto szacowana.
  Wolumen: ~4 300 deali historycznie, ~1 800 aktywnych/rok.
  Istniejąca automatyzacja: scenariusz Make (formularz WWW → deal + kontakt) — tylko tworzy deale,
  brak kolizji z aktualizacjami aplikacji.
- **Comarch ERP XL** — read-only, nocny CSV na SFTP (kartoteka ~3 800 SKU, cennik bazowy, stany).
  Zmiany cen 2-3×/mies. Wymóg: widoczna data obowiązującego cennika na ofercie + wyraźne
  ostrzeżenie, gdy import nocny się nie powiódł; ręczny „importuj teraz".
- **E-mail** — wysyłka oferty do klienta + powiadomienia o wniosku rabatowym.
- **Google Workspace** — logowanie kontem firmowym (kierunek; mechanizm wybiera bootstrap).

## Source of truth (per obszar)
- Produkt / cena bazowa / stany → ERP (aplikacja czyta).
- Klient / kontakt → Pipedrive.
- Oferta / pozycje / rabaty / statusy → aplikacja.
- Wartość i etap deala → Pipedrive, aktualizowane przez aplikację.

## Success & Timeline
- Pilot z 3 handlowcami: ~8 tygodni. Pełne wdrożenie: do końca Q4.
- Metryki: mediana zapytanie→oferta < 24 h (dziś 3,5 dnia) · 0 ofert poniżej progu marży
  bez zatwierdzenia · ≥ 80 % ofert powstaje w aplikacji po 2 miesiącach · mierzalna
  konwersja „wysłana → zaakceptowana".

## Non-Goals
- Nie budujemy CRM-a (Pipedrive zostaje). Nie zapisujemy do ERP.
- Brak aplikacji mobilnej (na telefonie tylko podgląd).
- Brak wielojęzyczności w MVP (PL). Brak podpisu elektronicznego. Brak konfiguratora 3D.
- Nie dotykamy VPS-a z WordPressem.
- Klient końcowy nie dostaje konta.

## Do backlogu (.ai/backlog.md — generuje bootstrap)
- Live API do ERP (gdyby partner staniał) zamiast nocnego CSV.
- Konfigurator wariantów produktu (3D).
- Wersje porównawcze oferty A/B dla klienta.
- Podpis elektroniczny.
- EN/DE.
- Zadania w Pipedrive z „Mam pytania".

## Decisions Ledger
| Decision | Chosen | By | Rejected alternatives (why not) |
|---|---|---|---|
| Tenancy | single-tenant | user | multi-tenant — brak planu sprzedaży produktu |
| Pipedrive sync depth | jednokierunkowo app → Pipedrive (+odczyt) | user | tylko odczyt (brak widoczności); dwukierunkowa (konflikty, webhooki, utrzymanie) |
| Źródło produktów/cen | nocny CSV z ERP, read-only, z datą cennika i alertem błędu importu | user | ręczny katalog (dublowanie 3 800 SKU); live ERP API (kilkanaście tys. zł, tygodnie) |
| Kontrola rabatów | próg + zatwierdzenie w aplikacji | user | twardy limit (obejścia); brak kontroli (nie rozwiązuje problemu) |
| Interfejs dla klienta | PDF + link + „Akceptuję"/„Mam pytania" | user | sam PDF; link bez akcji; e-podpis (odrzucony) |
| Ważność linku | token, 60 dni, unieważnialny, zamrożona wersja | user | link bezterminowy (ryzyko krążenia po stronie klienta) |
| Model ról | 4 role wyliczone przez klienta; klient bez konta | user | jakakolwiek rola dopisana przez AI — świadomie żadnej nie dopisano |
| Kierunek logowania | konta Google Workspace | user | osobne hasła — kolejny sekret do utrzymania |
| Zakres MVP | katalog+kalkulacja+zatwierdzanie+PDF/link+statusy+zapis do Pipedrive | user | szerszy zakres → backlog |
| Stack / hosting / ORM / auth / silnik PDF / worker | **otwarte, do kart decyzyjnych w bootstrapie** | — | nic nie wybrano po cichu; ograniczenia klienta zapisane wyżej |

## Vetoable trivia (reversible, no cost)
- Numeracja ofert `OF/{rok}/{nr}` · domyślna ważność oferty 30 dni · sortowanie katalogu po nazwie SKU.

## Next Step
- Handoff: **`sailes-bootstrap` (Route A / Case B)** — obowiązkowe ogniwo łańcucha.
```

---

## Step 4 — What happens next, stated plainly

**Nothing about implementation. The next thing that happens is a skill invocation, not a spec and not code.**

### What I do, exactly

1. **I invoke `sailes-bootstrap`, carrying the confirmed brief in.** That is the mandatory chain in `sailes-discovery` Step 4 for greenfield. The specific tempting failure here — "the brief is confirmed, so let me just write `.ai/specs/2026-07-26-ofertowanie.md` and be done" — is exactly the bug the skill names; I do not do it.
2. **I do NOT write the spec myself.** The spec is Phase 3 and it is written by the **local** `.ai/skills/spec-writing/SKILL.md` that bootstrap generates in the new repo (tuned to whatever stack the human then locks). The global `sailes-spec` is only the fallback if no local copy exists.
3. **I do NOT create the agent team.** Discovery is a solo interview; the team (team-lead → explorer/designer/be-dev/fe-dev/checker/qa) starts at implementation, after the spec is approved.
4. **I do NOT pick the stack in the handoff message.** Framework shape, ORM, auth, hosting, PDF engine and monorepo-vs-single-app go to the human as decision cards inside bootstrap. Saying "we'll use Next.js + Drizzle on Railway" here would be precisely the silent-baseline failure the ledger exists to prevent.
5. **Target repo:** a new, separate repository for the quoting app. **Not** `sailes-app-builder-skill` — this repo is the framework, and bootstrap Case B needs an empty repo.

### What I announce to the human, verbatim

> **Brief zatwierdzony — Faza 1 (discovery) zamknięta.** Nie piszę teraz specyfikacji ani kodu.
>
> **Przechodzę do Fazy 2 — `sailes-bootstrap`**, i wnoszę tam ten brief. Bootstrap zrobi pięć rzeczy, w tej kolejności:
> 1. **Klasyfikacja projektu → manifest modułów** (co jest włączone: e-mail, raportowanie, pliki, Pipedrive, warstwa async/worker, poziom bezpieczeństwa) — na podstawie tego, co ustaliliśmy: nocny import z SFTP, zapis do Pipedrive, PDF, powiadomienia.
> 2. **Karty decyzyjne stacku — Twoje wybory, nie moje**: kształt frontendu (fullstack vs SPA + osobne API), ORM, uwierzytelnianie (Google Workspace — czym dokładnie), hosting (z preferencją UE i budżetem kilkuset zł/mies.), **silnik PDF** (wierność brandowa layoutu vs waga/koszt RAM) oraz **monorepo + osobny worker czy jedna aplikacja** (masz nocne importy i wysyłkę — to realna decyzja, nie formalność). Każda z plusami, minusami i moją rekomendacją; wybierasz Ty.
> 3. **Wygenerowanie repozytorium i standardu pracy**: `AGENTS.md`, `CLAUDE.md`, `README.md`, pełne `.ai/` (specs + implemented + archived, checklists, adr, skills, `backlog.md` — tam wpadną: live API do ERP, konfigurator, e-podpis, EN/DE; `lessons.md`), guardrails harnessu, mapa kodu, **`git init` + pierwszy commit**.
> 4. **Bramka designu (`sailes-design`)** — aplikacja ma UI, więc powstaje świadomy kierunek wizualny i **artefakt designu na dysku** (`design-system/MASTER.md` / `.ai/specs/ui-spec.md`). To nie jest ozdobnik: bez tego oferta wygląda jak domyślny szablon, a ona idzie do Twoich klientów.
> 5. **Weryfikacja `repo-done-checklist.md`** — pokażę Ci surowy wynik (`find` / `git log`). Dopóki jest choć jedno `MISS`, nie mówię „gotowe" i nie idę dalej.
>
> **Bramka:** dopiero gdy manifest + stack + metodyka + artefakt designu są potwierdzone i checklista świeci na zielono, wchodzi **Faza 3 — spec** (pisze go lokalna umiejętność `spec-writing`, którą bootstrap dopiero wygeneruje, dopasowana do wybranego stacku). Spec zatwierdzasz Ty. **Implementacja i zespół agentów ruszają dopiero po tym.**
>
> **Dwie rzeczy po Twojej stronie, równolegle:** (a) dodanie etapu **„Oferta zaakceptowana"** w Pipedrive, (b) treść prawna pod przyciskiem „Akceptuję". Obie blokują koniec MVP, nie start.
>
> Mam odpalać bootstrap?

### Dry-run stop

In a real session, the next tool call is the `sailes-bootstrap` invocation. **This run stops here by instruction** — no repository, no project code, no skill invoked, no file touched other than this one.

---

## Method-compliance self-check (what this run did and did not do)

| Rule from `sailes-discovery` | Status |
|---|---|
| Variant picked before questions (greenfield) | ✅ Step 0 |
| Repo oriented cheaply, host stack not used as an anchor | ✅ framework repo identified, explicitly excluded |
| Orientation line on where this leads (invoked directly) | ✅ |
| Adaptive rounds of 3-4, critical unknowns first | ✅ 6 rounds, business/domain/scale/infra before cosmetics |
| Business case probed deep (why-now, cost, commissioner, if-not-built) | ✅ Round 1 |
| Roles enumerated by the human, none invented | ✅ Q2.1, stated in the ledger |
| Scale asked (users, concurrency, growth, volume) | ✅ Q2.2 |
| "We have infrastructure" drilled into | ✅ Q3.1 — turned out to be a WordPress VPS and no reusable DB |
| Integrations probed past the name (tier, custom fields, volume, conflicting automations, source-of-truth per field) | ✅ Q3.2-Q3.4 |
| Every key decision as a decision card with concrete pro AND cost | ✅ D1-D5 |
| Consequential options costed (two-way sync, client link) | ✅ D2 option C, D5 option C |
| Stack cards NOT run here; constraints captured instead | ✅ deferred to bootstrap Phase 2, said out loud |
| Decisions Ledger presented separately and prominently | ✅ Step 2 |
| Nothing left AI-recommended-pending | ✅ stack row is explicitly "open, owned by bootstrap", not a silent default |
| User changed a decision → new unknown → extra targeted round | ✅ Round 6 |
| Deferred ideas routed to `.ai/backlog.md`, not buried in non-goals | ✅ brief section |
| No escape hatch offered ("I'll guess the rest") | ✅ never offered |
| Greenfield chains to `sailes-bootstrap`, spec NOT self-written | ✅ Step 4 |
| No team spawned during elicitation | ✅ |

**Known limitation of this record:** every answer is simulated. The method's shape is exercised faithfully; the *content* of the brief is fiction and carries zero authority over a real client engagement.
