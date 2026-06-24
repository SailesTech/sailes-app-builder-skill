# Decision cards — schema forks (🔀: AI recommends, user chooses)

Present each relevant card in the **Sailes decision-card format** (text or `AskUserQuestion`), then let the user pick. These cover only the **🔀 decisions** — for 🔒 hard rules (data types, migration safety) there is no card, you just apply them. Full rationale + sources per card → `db-compendium.md` (section noted).

> Card format:
> ```
> Decyzja: <one line>
> Dlaczego to ważne: <cost / reversibility / lock-in / data risk>
> Opcje:  A) … — ✅ <pro> ⚠️ <cost>   B) … — ✅ … ⚠️ …
> Rekomendacja: <A/B> — bo <reason grounded in THEIR spec/scale/compliance>
> Twój wybór? (możesz wybrać inaczej niż rekomenduję)
> ```
> Quality bar: each option = one concrete upside + one concrete cost *for this project*. No empty adjectives. Recommendation cites their situation, not just the baseline.

---

## §Key — Primary key type *(→ db-compendium §1.2 / §4.1)*

**Decyzja:** jakiego typu PK użyć dla nowej tabeli.
**Dlaczego ważne:** rozmiar/fragmentacja indeksu, WAL/IO, generowanie ID poza bazą, bezpieczeństwo ekspozycji ID. Zmiana typu PK na dużej żywej tabeli jest droga.
**Opcje:**
- **A) `bigint GENERATED ALWAYS AS IDENTITY`** — ✅ najmniejszy indeks, najszybsze inserty, tani WAL. ⚠️ sekwencyjne → zdradza liczebność/enumeracja jeśli wyciekną do URL/API; brak generacji poza bazą.
- **B) UUID v7** (PG18 `uuidv7()`, wcześniej `pg_uuidv7`) — ✅ globalnie unikalne + uporządkowane czasowo, generowalne u klienta, nie zdradza liczebności. ⚠️ 16 vs 8 B; zdradza **czas utworzenia**; wymaga PG18/rozszerzenia.
- **C) UUID v4** (`gen_random_uuid()`) — ✅ pełna losowość (nie zdradza liczebności ani czasu). ⚠️ ~50% fragmentacji, WAL 40 vs 2 GB — **najgorszy jako PK**; tylko jako publiczny id obok bigint PK.
**Rekomendacja:** **A** dla kluczy wewnętrznych; **B (UUIDv7)** gdy ID wychodzi na zewnątrz / generacja rozproszona; hybryda A+publiczny v4 gdy czas utworzenia ma być tajny.

## §JSONB — jsonb vs normalized column *(→ db-compendium §1.3 / §4.2)*

**Decyzja:** pole jako kolumna czy klucz w jsonb.
**Dlaczego ważne:** jsonb nie ma statystyk per-klucz → katastrofalne estymacje plannera (regresja nawet ~2000×); brak indeksów/FK/constraintów wewnątrz; write amplification.
**Opcje:**
- **A) Znormalizowana kolumna** — ✅ statystyki, indeks B-tree, FK/CHECK, mniejsza. ⚠️ sztywny schemat, migracja na nowe pole.
- **B) jsonb** — ✅ elastyczność dla rzadkich/zmiennych atrybutów, payloadów API, snapshotów; bez migracji. ⚠️ złe plany, brak constraintów, TOAST, ~30% więcej miejsca; GIN tylko dla `@>`/istnienia klucza.
**Rekomendacja:** **A** jeśli pole w `WHERE`/`JOIN`/`ORDER BY` lub ma niezmiennik. **B** tylko dla danych rzadkich/zmiennych/nieprzeszukiwanych. Hybryda: jsonb na surowiec + wypromowane kolumny na to, co filtrujesz (+`CREATE STATISTICS` PG14+).

## §Tenancy — Multi-tenancy model (+ RLS) *(→ db-compendium §1.8 / §4.4)*

**Decyzja:** jak izolować dane wielu tenantów.
**Dlaczego ważne:** koszt migracji (×1 vs ×N), skala (dziesiątki vs tysiące), siła izolacji, per-tenant backup/offboarding, limity poolingu. Trudna do zmiany później.
**Opcje:**
- **A) Shared schema + `tenant_id` (+ RLS opcjonalnie)** — ✅ 1 migracja, skaluje do tysięcy, prawdziwie relacyjny. ⚠️ izolacja logiczna, offboarding = `DELETE`, wymaga dyscypliny filtrowania / RLS.
- **B) Schema-per-tenant** — ✅ średnia izolacja, tani offboarding (`DROP SCHEMA`). ⚠️ migracja ×N, nie skaluje > ~setek.
- **C) DB-per-tenant** — ✅ najsilniejsza izolacja, per-tenant backup. ⚠️ migracja ×N baz, bije w limity poolingu, tylko enterprise.
**Rekomendacja:** **A** jako default B2B SaaS; **+RLS** jako defense-in-depth (nie obowiązek — app-level filtrowanie jest pełnoprawne). **B/C** dopiero gdy compliance wymusza separację.
**❗ Jeśli RLS (🔒 footguny):** `FORCE ROW LEVEL SECURITY`; nie łącz się jako owner/superuser/`BYPASSRLS`; indeks na `tenant_id`; `SET LOCAL`/`set_config(…,true)` w poolingu; uważaj na funkcje nie-`LEAKPROOF` (full scan).

## §Enum — enum vs lookup table vs CHECK *(→ db-compendium §1.4 / §4.6)*

**Decyzja:** jak ograniczyć kolumnę do zbioru dozwolonych wartości.
**Dlaczego ważne:** łatwość dodawania/usuwania wartości, metadane (label/kolejność/aktywność), koszt joina.
**Opcje:**
- **A) CHECK (`status IN (...)`)** — ✅ najprościej, łatwo modyfikować, logika warunkowa/wielokolumnowa. ⚠️ brak metadanych, zmiana = migracja.
- **B) enum (typ)** — ✅ zwięzły, inline bez joina. ⚠️ trudny do usunięcia/reorder, brak metadanych.
- **C) lookup table (+FK)** — ✅ joinowalne metadane, zmienialne bez migracji typu. ⚠️ koszt joina, dodatkowa tabela.
**Rekomendacja:** **A** dla małego stabilnego zbioru (Crunchy: CHECK przed enum). **C** gdy zbiór rośnie / potrzebuje metadanych. **B** rzadko.

## §SoftDelete — soft delete vs history/journal *(→ db-compendium §1.5 / §4.7)*

**Decyzja:** jak obsłużyć „usuwanie" danych do zachowania/cofnięcia.
**Dlaczego ważne:** soft delete obciąża KAŻDE zapytanie i łamie FK; rozlewa się na cały kod i komplikuje RODO.
**Opcje:**
- **A) `deleted_at` (soft delete)** — ✅ proste kosz/undo w UI. ⚠️ każde zapytanie filtruje (łatwo zapomnieć → wyciek), łamie FK, konflikty unikalności (partial index), komplikuje RODO.
- **B) `deleted_record` (twardy DELETE + trigger → jsonb)** — ✅ czyste tabele żywe, brak `deleted_at IS NULL`, brak problemów z FK. ⚠️ odtworzenie nietrywialne, trigger do utrzymania.
- **C) Temporal (`temporal_tables`)** — ✅ automatyczna pełna historia wersji. ⚠️ rozszerzenie, tylko system-period, narzut zapisu.
**Rekomendacja:** **A** tylko dla UI kosz/undo. **B** (brandur) lub **C** dla audytu/compliance/pełnej historii.

## §Tooling — Migration tool *(→ db-compendium §3 / §4.5)*

**Decyzja:** czym generować i stosować migracje. (Zwykle już zablokowane przez `sailes-bootstrap`; potwierdź zamiast wybierać od nowa.)
**Opcje:**
- **A) Migracje ORM (drizzle-kit / Prisma Migrate)** — ✅ jedno źródło prawdy ze schematem, zero dodatkowego narzędzia. ⚠️ minimalny lint, słabszy drift.
- **B) Atlas** — ✅ 50+ analizatorów, drift detection, planowanie diffu. ⚠️ kolejne narzędzie; część lint poza darmowym planem.
- **C) SQL-first imperatywne (node-pg-migrate / sqitch / golang-migrate / Flyway)** — ✅ pełna kontrola nad SQL, łatwy review. ⚠️ ręczne up/down + sam pilnujesz §2.
- **D) pgroll** — ✅ automatyzuje zero-downtime expand/contract. ⚠️ wąskie, nowe, nie pokrywa wszystkiego.
**Rekomendacja:** **A (drizzle-kit)** default stacku + **lint w stylu strong_migrations/Atlas** w CI jako bramka. **C** gdy zespół woli czysty SQL. **D** dla najtrudniejszych zero-downtime.

## §Strategy — Migration strategy (path, not safety) *(→ db-compendium §2 / §4.3)*

> To NIE jest „czy być bezpiecznym" (to 🔒 §2) — tylko która z bezpiecznych ścieżek pasuje do tej zmiany.
- **Additive + małe** → zwykła migracja w transakcji.
- **Additive + duża tabela / indeks** → online (`CONCURRENTLY` / stały default) **poza** transakcją.
- **Destrukcyjne** (drop/rename/NOT NULL/type change) → **expand/contract** + dual-write + backfill batchami + karencja przed contract.
