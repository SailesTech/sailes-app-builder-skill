# Discovery run — "aplikacja do zarządzania ofertami"

**Date:** 2026-07-26
**Skill:** `skills/sailes-discovery/SKILL.md` (+ `checklists.md`, `decision-card.md`, `brief-template.md`)
**Verbatim request:** *"Chcę zbudować aplikację do zarządzania ofertami dla mojej firmy. Handlowcy tracą czas na ręczne składanie ofert w Wordzie. Zróbmy to."*

**Run condition:** this run executes discovery up to the point where the interview needs the human. No
code, no spec. The artifact below is what the phase produces *before* the user answers: orientation,
the elicitation plan in the exact form it goes to the user, the decision cards for every fork that is
already visible, and a Decisions Ledger in which **every row is still `AI-recommended-pending`** —
because the user has not chosen anything yet.

---

## Step 0 — Variant and orientation

**Variant: GREENFIELD.** No app exists; "chcę zbudować aplikację" plus a manual-Word status quo.
Brownfield recon (does it already exist?) does not apply to a product that has never been built —
but the equivalent highest-value question does apply and is asked in Round 3: *does something you
already own (CRM offer module, ERP quoting, an existing Make scenario) already do part of this?*
"Już to macie" is the cheapest possible outcome and must be ruled out before we design anything.

**Repo orientation (cheap, done before asking anything):**

| Checked | Found |
|---|---|
| `AGENTS.md` / `README.md` | Present — but they describe **this repo**: the Sailes skill toolkit (`skills/`, `agents/`, `evals/`, `.claude-plugin/`). |
| `.ai/specs/` | Exists (`2026-07-18-prompt-anchor.md`, `2026-07-26-roster-for-people-who-are-not-you.md`, `implemented/`) — specs *for the toolkit*, not for a customer app. |
| Local `.ai/skills/spec-writing/` | **Absent** (`.ai/skills` does not exist). Fallback per Step 4 is the global `sailes-spec`, reached *through* bootstrap. |
| Target app repo | **Does not exist yet.** |

**Load-bearing finding:** the working directory is the *skill toolkit*, not the customer's project.
The offer app must get **its own repo**; nothing here should be treated as its baseline, and the
toolkit's stack conventions must **not** be inherited by anchoring (that is the listed Common
Mistake "anchoring on the host repo's stack for a greenfield project").

**One-line orientation given to the user (this skill was invoked directly, not via `sailes-start`):**

> To jest wywiad zakresowy (discovery). Po zatwierdzeniu briefu idziemy dalej: setup repo i stack
> (`sailes-bootstrap`) → design → spec → implementacja. Teraz nie projektuję modelu danych ani nie
> wybieram technologii — najpierw wyciągam z Ciebie obraz całości.

**Not proposed at this stage (deliberately):** data model, module layout, framework, PDF library,
role names. Each of those is either a decision card for the user or bootstrap's Phase 2.

---

## Step 1 — Elicitation plan (adaptive rounds of 3-4, via `AskUserQuestion`)

Delivery form: **`AskUserQuestion`, one round at a time, 3-4 questions per round, clickable options,
Polish** (the user writes Polish). Each round is re-shaped by the previous answers — the rounds below
are the plan, not a script; Rounds 4-5 in particular collapse or expand depending on Rounds 1-3.
Fact-finding questions carry plain options and no recommendation. Every fork uses the full
**decision card** format from `decision-card.md`.

### Round 1 — Business case + the heart of the domain (critical unknowns first)

**Q1 (fact) — Ile to dziś kosztuje?**
Ile czasu jeden handlowiec traci tygodniowo na składanie ofert?
`<2 h/tydz.` · `2-5 h/tydz.` · `5-10 h/tydz.` · `>10 h/tydz.` · `Nie mierzyliśmy — oszacujmy razem`

**Q2 (fact) — Dlaczego teraz?**
Co uruchomiło ten projekt właśnie w tym momencie?
`Przegraliśmy deal przez wolną/błędną ofertę` · `Rośnie zespół sprzedaży (nowi nie znają cennika)`
`Rozjazd cen i rabatów — brak kontroli` · `Rośnie wolumen ofert` · `Decyzja zarządu / audyt` · `Inne`

**Q3 (fact) — Kto zamawia i czyj sukces się liczy?**
Kto jest właścicielem tego projektu po Twojej stronie?
`Ja/właściciel` · `Szef sprzedaży` · `Zarząd` · `IT` · `Sami handlowcy`
(dopytanie: jak *ta osoba* pozna, że projekt się udał?)

**Q4 (fact) — Co jest sercem produktu?**
Gdyby aplikacja robiła **tylko jedną rzecz** dobrze, to którą?
`Generowanie dokumentu oferty z szablonu` · `Katalog produktów + cennik i reguły rabatowe`
`Śledzenie oferty po wysłaniu (status, akceptacja, follow-up)` · `Uporządkowanie i wyszukiwanie ofert historycznych`

> Why first: Q4 decides whether this is a **document-generation** product, a **pricing/CPQ** product,
> or a **sales-pipeline** product. Those are three different applications. Guessing here is the
> rewrite-level mistake.

### Round 2 — Users, scale, roles, tenancy

**Q5 (fact) — Skala.** Ilu handlowców dziś, ilu za rok, ile ofert miesięcznie?
`≤5 / ≤50 ofert` · `6-15 / 50-200` · `16-50 / 200-1000` · `>50 / >1000` · `Podam liczby`

**Q6 (fact) — Role. Wymień je Ty, ja ich nie wymyślam.** Kto realnie będzie dotykał systemu?
`Handlowiec` · `Szef sprzedaży (zatwierdza rabaty)` · `Back-office / administracja` · `Admin cennika`
`Klient zewnętrzny (ogląda ofertę)` · `Księgowość` — wielokrotny wybór, plus: co każda z nich musi *zrobić*.

**Q7 (DECISION CARD) — Tenancy**

```
Decyzja: dla kogo ta aplikacja ma działać — tylko Twoja firma czy wiele firm?
Dlaczego to ważne: przenika cały model danych, autoryzację i koszt. Dołożenie multi-tenant
                   później = migracja każdej tabeli; zbudowanie go "na zapas" = podwójna praca
                   przy każdej funkcji, której możesz nigdy nie sprzedać.
Opcje:
  A) Single-tenant (tylko Wy)  — ✅ najprostszy model danych, najszybszy MVP, brak izolacji do pilnowania
                                 ⚠️ jeśli za rok chcesz to sprzedawać, czeka Cię migracja
  B) Multi-tenant od startu    — ✅ gotowe na sprzedaż innym firmom bez przepisywania
                                 ⚠️ każda funkcja droższa (scoping, izolacja, testy), MVP później
  C) Single-tenant, ale schemat przygotowany pod tenant_id — ✅ tanie dziś, tańsza migracja jutro
                                 ⚠️ połowiczne: i tak trzeba przejść audyt izolacji przed sprzedażą
Rekomendacja: nie mam podstaw, żeby wskazać — nie wiem, czy "dla mojej firmy" to na zawsze,
              czy to pierwszy klient produktu. Odpowiedź na to jedno pytanie rozstrzyga kartę.
Twój wybór? (możesz wybrać inaczej niż rekomenduję)
```

**Q8 (DECISION CARD) — Jak oferta trafia do klienta**

```
Decyzja: czy klient dostaje PDF mailem, czy link do oferty online?
Dlaczego to ważne: to nie kosmetyka — link online otwiera publiczną powierzchnię aplikacji
                   (bezpieczeństwo, RODO, śledzenie otwarć) i dopiero on daje dane o konwersji.
Opcje:
  A) PDF w mailu (jak dziś, tylko generowany)  — ✅ zero nowej powierzchni publicznej, najszybsze
                                                 ⚠️ nie wiesz, czy klient otworzył; akceptacja dalej mailem
  B) Link do oferty online + akceptacja klikiem — ✅ status "otwarta/zaakceptowana" bez pytania klienta
                                                 ⚠️ publiczne URL-e, wygasanie linków, zgody RODO, więcej UI
  C) Oba (PDF do pobrania z widoku online)      — ✅ klient wybiera, Ty i tak masz telemetrię
                                                 ⚠️ dwa formaty do utrzymania i dwie ścieżki testów
Rekomendacja: nie mam podstaw, żeby wskazać dopóki nie znam odpowiedzi na Q4 — jeśli sercem
              jest śledzenie statusu, A jest wykluczone; jeśli sercem jest sam dokument, B jest
              przerostem na start.
Twój wybór?
```

### Round 3 — Co już macie (drill in — nie przyjmuję "mamy jakąś infrastrukturę")

**Q9 (fact) — CRM i jego plan.** Czym dziś prowadzicie sprzedaż?
`Pipedrive` · `HubSpot` · `Salesforce` · `Excel/Sheets` · `Własny system` · `Nic`
→ dopytanie obowiązkowe: **jaki plan/tier** (czy w ogóle ma API i webhooki), jakie **custom fields**
i etapy pipeline'u, **ile danych** już tam jest, czy jakieś **Make/Zapier/n8n** już tego dotyka.

**Q10 (fact) — Źródło prawdy dla produktów i cen.** Skąd biorą się ceny w ofercie?
`ERP/magazyn` · `Excel z cennikiem` · `Z głowy handlowca / negocjacje` · `Cennik w CRM` · `Mieszanka`

**Q11 (fact) — Co już działa u Was technicznie.** Hosting, baza, logowanie:
`Google Workspace` · `Microsoft 365` · `Własny VPS/serwer` · `Chmura (Railway/Vercel/AWS/Azure)`
`Istniejąca baza Postgres/MSSQL do reużycia` · `Nic — zaczynamy od zera`
→ dla każdego wskazanego: **integrować, reużyć czy zastąpić?** Plus ograniczenia (VPN, IP allowlist,
dane tylko w EU).

**Q12 (DECISION CARD) — Głębokość integracji z CRM** *(zadawane tylko jeśli Q9 ≠ "Nic")*

```
Decyzja: jak mocno aplikacja ofertowa ma być zrośnięta z CRM-em?
Dlaczego to ważne: to zwykle najdroższa i najbardziej awaryjna część projektu. Każdy poziom
                   wyżej dokłada webhooki, konflikty i utrzymanie na lata.
Opcje:
  A) Bez integracji (oferty żyją osobno)   — ✅ najtaniej, brak zależności od cudzego API
                                             ⚠️ podwójne wpisywanie danych klienta = to samo marnowanie czasu
  B) Jednokierunkowo: apka → CRM           — ✅ oferta ląduje przy dealu, brak konfliktów zapisu
                                             ⚠️ dane klienta wciąż przepisywane ręcznie do apki
  C) Dwukierunkowo                          — ✅ jedno miejsce prawdy z obu stron
                                             ⚠️ musimy ustalić kierunek prawdy per pole, obsłużyć konflikty
                                                i webhooki — to najdroższa opcja w utrzymaniu
  D) Aplikacja *wewnątrz* CRM (np. panel na karcie deala) — ✅ handlowiec nie zmienia narzędzia
                                             ⚠️ przywiązanie do jednego CRM-a i jego limitów UI
Rekomendacja: zależy od Q9 (jaki CRM i jaki plan) i Q10 (skąd ceny). Jeśli CRM nie ma API w Waszym
              planie, C i D odpadają zanim je rozważymy.
Twój wybór?
```

### Round 4 — Dokument, reguły cenowe, dane osobowe

**Q13 (fact) — Szablon.** Ile macie wariantów oferty, kto nimi zarządza, i czy nowy dokument musi
wyglądać **1:1** jak obecny Word?
`Jeden szablon` · `2-5` · `>5 / per branża` · `Każdy handlowiec ma swój`
→ oraz: `Musi być 1:1` / `Może być nowy, byle spójny`, i format: `PDF` / `DOCX` / `oba`.

**Q14 (DECISION CARD) — Silnik dokumentu** *(karta pokazywana dopiero po Q13 — bez tej odpowiedzi
nie da się jej uczciwie ugruntować)*

```
Decyzja: czym generujemy dokument oferty?
Dlaczego to ważne: decyduje, kto może zmienić wygląd oferty bez programisty, i czy da się
                   odtworzyć obecny wygląd z Worda.
Opcje:
  A) HTML → PDF (headless)     — ✅ ten sam layout na ekranie i w PDF, pełna kontrola, łatwe wersjonowanie
                                 ⚠️ odtworzenie istniejącego Worda 1:1 bywa żmudne; zmiana wyglądu = zmiana kodu
  B) Wypełnianie szablonu DOCX — ✅ marketing/handlowiec edytuje szablon w Wordzie bez programisty; wygląd 1:1
                                 ⚠️ ograniczona logika w szablonie, konwersja do PDF to osobny krok
  C) Google Docs / Workspace API — ✅ zero infrastruktury do renderowania, wspólna edycja szablonu
                                 ⚠️ przywiązanie do Workspace, limity API, dokument żyje poza Waszą bazą
Rekomendacja: nie mam podstaw, żeby wskazać przed odpowiedzią na Q13. Jeśli padnie "musi być 1:1
              jak nasz Word i szablon zmienia marketing" — B praktycznie wygrywa. Jeśli "może być
              nowy, byle spójny" — A. Jeżeli obie odpowiedzi są niepewne, jest czwarte wyjście:
              rozstrzygnąć pomiarem — dajemy Wasz realny szablon i robimy jeden dokument
              w A i jeden w B (ok. pół dnia), kryterium ustalone z góry: czy wynik przechodzi
              Wasz wzrokowy odbiór bez poprawek. Możesz też po prostu zdecydować.
Twój wybór?
```

**Q15 (fact) — Reguły cenowe i akceptacje.** Czy istnieją progi rabatowe wymagające zgody
przełożonego? Czy klienci mają indywidualne cenniki?
`Rabat do X% sam, powyżej zgoda szefa` · `Ceny indywidualne per klient` · `Sztywny cennik` · `Wszystko negocjowane`

**Q16 (fact) — Dane i zgodność.** Jakie dane klientów trafią do systemu i gdzie mogą leżeć?
`Dane firmowe (NIP, adres)` · `Dane osób kontaktowych (RODO)` · `Ceny/marże — wrażliwe wewnętrznie`
→ oraz: czy dane muszą zostać **w EU**, czy potrzebny **audit log** (kto zmienił cenę w ofercie), i
czy **handlowiec widzi tylko swoje oferty**, czy wszystkie.

### Round 5 — Sukces, termin, granice zakresu

**Q17 (fact) — Cykl życia oferty.** Czy potrzebne są wersje ("oferta v2 po negocjacjach"), data
ważności, wygasanie, powielanie starej oferty?
`Wersjonowanie` · `Termin ważności` · `Klonowanie oferty` · `Nic z tego — jedna oferta, jeden plik`

**Q18 (DECISION CARD) — Akceptacja i podpis**

```
Decyzja: jak klient akceptuje ofertę?
Dlaczego to ważne: e-podpis to zewnętrzny koszt i osobna integracja; akceptacja klikiem
                   wymaga rozstrzygnięcia, czy ma dla Was moc handlową.
Opcje:
  A) Bez formalnej akceptacji (jak dziś — mail)  — ✅ zero pracy, zero kosztu
                                                   ⚠️ status oferty zostaje ręczny i nierzetelny
  B) Akceptacja klikiem w widoku oferty          — ✅ twarda data akceptacji w systemie, tanie
                                                   ⚠️ wymaga opcji B/C z Q8; wartość dowodowa do ustalenia po Waszej stronie
  C) E-podpis (Autenti / DocuSign / inny)        — ✅ moc prawna, ślad audytowy
                                                   ⚠️ opłata za dokument, integracja i onboarding klienta
Rekomendacja: zależy od Q8 i od tego, czy oferta u Was bywa podstawą umowy. Jeśli po ofercie
              i tak idzie osobna umowa — C to koszt bez zwrotu na tym etapie.
Twój wybór?
```

**Q19 (fact) — Definicja sukcesu i termin.** Co ma się zmienić w liczbach?
`Czas złożenia oferty: z ~X do ~Y minut` · `Zero rozjazdów cenowych` · `Wyższa konwersja ofert`
`Widoczność: wiem, co się dzieje z każdą ofertą`
→ oraz: czy jest **twardy termin** (targi, start kwartału, koniec roku).

**Q20 (fact) — Czego świadomie NIE budujemy w pierwszej wersji?**
`Fakturowanie` · `Umowy i podpisy` · `Zarządzanie magazynem` · `Prowizje handlowców`
`Portal klienta z historią` · `Aplikacja mobilna`
→ wszystko odznaczone tu trafia do `.ai/backlog.md` (generuje go bootstrap), nie ginie w briefie.

**Świadomie NIE pytam tu o:** framework, ORM, auth, hosting, silnik bazy. To karty decyzyjne
**`sailes-bootstrap` Phase 2** — tutaj notuję tylko twarde ograniczenia, jeśli sam je wskażesz
(np. "musi stać na naszym VPS", "dane tylko w EU").

---

## Step 2 — Decisions Ledger (stan przed odpowiedziami)

Every row is deliberately **`AI-recommended-pending`**. Per SKILL.md that means the discovery is
**not** finished and nothing may proceed to bootstrap/spec until the user actively chooses each one.
This table is the gate, not a summary.

| Decision | Chosen | By | Rejected alternatives (why not) |
|---|---|---|---|
| Serce produktu (dokument / CPQ / pipeline) | — | **AI-recommended-pending** (Q4) | — |
| Tenancy (single / multi / single+tenant_id) | — | **AI-recommended-pending** (Q7) | — |
| Doręczenie oferty (PDF / link online / oba) | — | **AI-recommended-pending** (Q8) | — |
| Głębokość integracji z CRM (brak / 1-way / 2-way / wewnątrz CRM) | — | **AI-recommended-pending** (Q12) | — |
| Silnik dokumentu (HTML→PDF / DOCX / Google Docs) | — | **AI-recommended-pending** (Q14) | — |
| Źródło prawdy dla cennika | — | **AI-recommended-pending** (Q10) | — |
| Model ról i widoczność ofert (swoje vs. wszystkie) | — | **AI-recommended-pending** (Q6, Q16) | — |
| Akceptacja / e-podpis | — | **AI-recommended-pending** (Q18) | — |
| Zakres MVP i lista non-goals | — | **AI-recommended-pending** (Q20) | — |
| Postawa budżetowa / poziom infry | — | **AI-recommended-pending** (Q19) | — |
| Stack (framework, ORM, auth, hosting) | — | **owned by `sailes-bootstrap` Phase 2** | not decided in discovery by design |

**Vetoable trivia (reversible, no cost — listed separately so it never mixes with the above):**
nazewnictwo statusów oferty w UI (`Szkic/Wysłana/Zaakceptowana` vs. inne słowa), kolejność kolumn na
liście ofert, format numeru oferty. Any of these can be changed later at no cost — say the word.

**Confirmation question that closes Step 2 (asked verbatim after the rounds):**
> Czy zgadzasz się z każdą decyzją w tabeli (możesz zmienić dowolną), i czy coś poprawić/dodać?

---

## Step 3 — Brief status

**The Project Brief is NOT written and must not be.** `brief-template.md` requires filled-in business
case, scale, tenancy, integrations, compliance, success metrics and a Decisions Ledger with **zero**
pending rows. Ten of eleven rows are pending. Writing a brief now would be exactly the failure the
skill names: assumptions dressed up as a summary and rubber-stamped by the user.

The brief gets written the moment Rounds 1-5 come back and Step 2 is confirmed — greenfield format,
`brief-template.md`.

---

## Step 4 — Handoff (mandatory chain)

**Greenfield ⇒ after the brief is confirmed, `sailes-bootstrap` MUST be invoked**, carrying the brief
in. It generates the agentic-first repo standard (`AGENTS.md`, `CLAUDE.md`, `README.md`,
`.ai/skills/`, `.ai/checklists/`, `.ai/adr/`, `.ai/backlog.md`, git init), runs the **stack decision
cards** (Phase 2 — deliberately not run here), and drives the design gate (`sailes-design`). Only then
comes the spec — via the local `.ai/skills/spec-writing/` bootstrap generates, else global
`sailes-spec` — and only then implementation with the agent team.

**Additional handoff constraint from Step 0:** bootstrap must be pointed at a **new repo for the offer
app**, not at `D:\Work\Internal\sailes-app-builder-skill`. This directory is the Sailes skill toolkit;
its stack and conventions are not the app's baseline.

Writing a spec straight to `.ai/specs/` now would skip the entire repo standard — SKILL.md flags that
explicitly as "the bug".

---

## Self-check against the skill's Red Flags

| Red flag | Status |
|---|---|
| Writing spec/code without knowing scale/users | Clear — nothing written, scale is Q5. |
| "I'll assume…" about something answerable | Clear — no assumptions; unknowns are questions. |
| Stack/ORM/auth/hosting picked silently | Clear — explicitly deferred to bootstrap Phase 2. |
| Ledger row left `AI-recommended-pending` while moving on | Held — the run **stops** at the pending ledger; that is the gate. |
| Roles/integration fields invented | Clear — Q6 makes the user enumerate roles; no role named by me. |
| Consequential option offered without its cost | Clear — 2-way sync, in-CRM embed, online link, e-signature all priced in their cards. |
| "We have infrastructure" accepted without drilling in | Clear — Q9/Q11 force plan/tier, custom fields, volume, conflicting automations, integrate-vs-reuse-vs-replace. |
| Escape hatch offered ("lecę z MVP, resztę zgadnę") | Clear — none offered anywhere. |
| Business case not probed (incl. why-now) | Clear — Q1-Q3 cover cost, trigger, commissioning stakeholder. |
| Greenfield skips bootstrap | Clear — Step 4 chains to it and names the new-repo constraint. |
| Agent team spawned during elicitation | Clear — discovery is solo; team starts at implementation. |

---

## Where this run stops

Discovery is a **two-party** phase and the second party has not spoken yet. Everything the AI can do
without the human is done: variant chosen, repo oriented, three-application ambiguity in the brief
identified, 20 questions staged across 5 adaptive rounds, 5 decision cards drafted to the quality bar
(three of them honestly carrying *"nie mam podstaw, żeby wskazać"* rather than a fabricated
recommendation, one with a priced measurement option).

**Next step: send Round 1 via `AskUserQuestion` and let the user answer.** Not the brief, not the
spec, not bootstrap — because a brief built on ten unanswered forks is the exact artifact this skill
exists to prevent.
