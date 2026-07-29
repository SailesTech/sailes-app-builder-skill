# `sailes-migrate` — gdzie siedzi i kiedy ją odpalić

## Gdzie siedzi: **obok pipeline'u, nie w nim**

`sailes-migrate` to **domain sibling** — dokładnie ta sama kategoria co `sailes-pipedrive`
i `sailes-hosting`. Wołasz ją **samodzielnie**; nie ma numeru fazy i nie wpina się w numerację
faz build.

Liniowy pipeline (`skills/README.md`) wygląda tak i **migracji w nim nie ma**:

```
sailes-start
  ├─ Phase 0  sailes-wayfinder (opcjonalnie)
  ├─ Phase 1  sailes-discovery   → Brief
  ├─ Phase 2  sailes-bootstrap   → repo standard   └─ 2.5 sailes-design
  ├─ Phase 3  sailes-spec        → zatwierdzony spec
  └─ Implementacja: sailes-pre-implement → sailes-database / sailes-async
                    → sailes-implement → release gate
```

W AGENTS.md siedzi w **Task routerze**, jako osobny wiersz obok `sailes-diagnose`:

| Sytuacja | Idziesz do |
|---|---|
| Coś jest zepsute w działającym systemie | `sailes-diagnose` |
| **Port istniejącej bazy kodu na inny język/stack, na skalę** | **`sailes-migrate`** — domain sibling, judge-before-translation, bramka parzystości zachowań |
| Nowy zakres, nie objęty żywym spekiem | `sailes-discovery` |
| Żywy spec to pokrywa | jego faza — `sailes-pre-implement`, potem `sailes-implement` |

Wpięcie `sailes-migrate` jako fazy pipeline'u jest **wprost na liście Red Flags — STOP**
(SKILL.md). To nie jest kwestia stylu, tylko reguła.

Co ważne: skill **nie buduje własnej maszynerii** — reużywa nasze role
(`explorer` / `team-lead` / `be-dev` / `fe-dev` / `checker` / `tester` / `qa`), graphify
i guardrail deny-list z repo generowanego przez `sailes-bootstrap`.

## Kiedy ją odpalić

**Odpalasz**, gdy istnieje **działająca** baza kodu i trzeba ją przenieść na inny język/stack
**z zachowaniem zachowania**, i jest na tyle duża, że ręczny przekład plik-po-pliku bez reguł
rozjedzie się między agentami. Jednostka pracy = **plik/moduł z mapy zależności**, nie „feature".
Źródłem prawdy jest **oryginalny kod jako wykonywalna specyfikacja** + judge.

Trigger-frazy: „przenieś/sportuj/zmigruj tę aplikację z X na Y", „port legacy", „przepisz
z Pythona/PHP/Rails/Javy na nasz stack", „rewrite dużego repo", „code/language migration",
„rulebook", „parity harness", „judge", „structure-preserving vs redesign".

**NIE odpalasz**, gdy:

| To jest… | …a wtedy idziesz do |
|---|---|
| migracja **schematu bazy** (Prisma/Drizzle/SQL) | `sailes-database` — to najczęstsze pomylenie nazwy |
| nowa aplikacja / nowy feature | `sailes-discovery` → … → `sailes-implement` |
| coś **zepsutego** w działającym systemie | `sailes-diagnose` |
| przepisanie jednego pliku bez zależności | po prostu to zrób |

## Kto robi robotę (role na każdym z sześciu kroków)

| Krok | Wynik | Kto / co reużywamy |
|---|---|---|
| **0. Feasibility + Judge** | case za/przeciw + judge (parity-harness) | lens `sailes-pre-implement` + dyscyplina bramki `qa` |
| **1. Mapa + Rulebook + Inventory** | `manifest.tsv` (liście→korzeń), Rulebook v1, gap inventory | `explorer` + **graphify** (jest w każdym repo); skrypty `depmap_*` kitu tylko tam, gdzie graphify nie sięga |
| **2. Stress-test reguł** | bakeoff (dwaj tłumacze) + pilot na najtrudniejszych plikach | najbliższy krewny: RED-baseline z `sailes-implement`; **wynik = tylko poprawki reguł, zero commitów kodu** |
| **3. Tłumaczenie (fan-out)** | równoległy przekład z manifestu | `team-lead` orkiestruje → równolegli `be-dev`/`fe-dev`, **jedna jednostka = jeden agent**, ściśle wg Rulebooka |
| **4. Survey build + fixerzy** | jeden zbiorczy compile → maszynowa kolejka błędów | fan-out fixerów pod `team-lead`, **bez dostępu do kompilatora**; daemon przebudowuje |
| **5. Uruchom** | hello-world → najmniejszy dowód end-to-end | dyscyplina `qa` (tania weryfikacja przed drogą) |
| **6. Parzystość zachowań** | bramka końcowa + burndown markerów | `checker` + `tester` + `qa`, na czystym kontekście |

Podział w bramce parzystości: **`tester`** pisze przypadki parzystości wyprowadzone z **oryginału,
zanim przeczyta port**; **`checker`** ocenia niezależnie na czystym kontekście; **`qa`** trzyma
zasadę „dowód zachowania, nie asercja".

Każdy brief do agenta niesie **klauzulę raportu** — pusty zwrot to porażka, nie „nic nie znalazłem"
(AGENTS.md §Delegation).

**Człowiek** (nie agent) trzyma: sign-off każdej bramki, wybór trybu (structure-preserving vs
redesign) i decyzję licencyjną o vendorowaniu skryptów kitu.

## Co musi być prawdą, ZANIM ruszy ciężka część (fan-out, Krok 3)

Reguła nadrzędna skilla, cytat:

> **Żaden równoległy przekład (Krok 3) nie startuje, zanim nie istnieje judge i nie został
> zwalidowany na CELOWO zepsutym źródle.**

To migracyjny odpowiednik naszego „żadnego kodu feature'a bez zatwierdzonego speca". Softening tej
reguły niweczy sens skilla (pilnuje jej eval `migrate-judge-gate`).

Checklista przed fan-outem — wszystkie muszą być spełnione:

1. **Judge istnieje i JEST WALIDOWANY** — wprowadzasz celowy błąd do **oryginału**, judge **musi
   sfailować**; cofasz błąd, judge znów zielony. Judge, który przechodzi na zepsutym oryginale,
   jest ślepy i niczego nie udowodni. Dwie drogi: istniejący suite oryginału (jeśli woła kod przez
   **publiczny** interfejs — najtańszy judge) albo **przenośny parity-harness** (jeśli testy
   oryginału importują jego wnętrzności): ustalone wejścia → „złote" wyjścia oryginału → to samo
   na porcie → diff.
2. **Na dysku leżą: `manifest.tsv` + Rulebook v1 + gap-inventory** (bramka Kroku 1). Manifest daje
   deterministyczną kolejność liście→korzeń i wykrywa cykle.
3. **Rulebook ustabilizowany na pilotach i ZAMROŻONY** (bramka Kroku 2). Test przynależności do
   Rulebooka: *jeśli dwaj agenci mogliby przełożyć ten sam konstrukt inaczej — decyzja idzie tam
   i jest rozstrzygnięta raz.* Po fan-oucie zmiana reguły to świadoma decyzja **globalna**
   (i potencjalny re-run dotkniętych jednostek). W Kroku 2 nie ma commitów kodu — tylko reguły.
4. **Deny-list guardrail ZAINSTALOWANY** — `.claude/settings.json` + twin `.codex/config.toml`,
   na wspólnych skryptach hooków (każde repo z `sailes-bootstrap` już je ma; dokładasz deny na
   drogie operacje: `typecheck`, pełny `build`, na czas Kroków 2–4, i **reaktywujesz** je na Krok 6).
   Instalujesz go **przed pilotem z Kroku 2**, nie przed Krokiem 3. KRYTYCZNE: jeśli deny-list nie
   jest zainstalowany, **blokady po prostu nie działają** i fan-out pobiegnie „nieuzbrojony" —
   to realny incydent odnotowany przez kit Anthropic.
5. **Tryb wybrany jawnie** — structure-preserving (domyślny) albo redesign. Cichy redesign pod
   słowem „migracja" jest Red Flagiem (eval `migrate-structure-preserving-default`).

Bramka „done" na końcu (Krok 6) jest binarna i podwójna: **wszystkie** testy parzystości zielone
na porcie **I** oryginalny suite puszczony na **oryginalnym** kodzie ma **zero** odziedziczonych
porażek — inaczej porównujesz się z zepsutym wzorcem. Dopiero po tej bramce burndown markerów
`BUG(port)` / `TODO(port)` / `PERF(port)`; odroczone lądują w `.ai/backlog.md` repo migrowanego.
Zielony typecheck jako „done" to Red Flag.

## Dwie rzeczy, które są Twoją decyzją (nie moją)

**A. Tryb portu** — wybierz przed Krokiem 1:

- **Structure-preserving (rekomendacja i domyślna ścieżka)** — ten sam kształt architektury, inny
  język. Kupujesz: jednostka = plik, Rulebook jako prosta tabela lookup, sensowny bakeoff, najniższe
  ryzyko rozjazdu. Kosztuje: przenosisz też wady architektury oryginału.
- **Redesign (świadomy tryb)** — kupujesz lepszą docelową architekturę. Kosztuje: Rulebook staje się
  **dokumentem projektowym** (nie lookupem), **bakeoff traci sens** (zastępujesz go adwersaryjnym
  review dokumentu + jednorazowymi pełnymi przebiegami), jednostka pracy przesuwa się plik → moduł/
  subsystem. Krok 6 (parzystość) działa bez zmian.

**B. Skrypty kitu: referencja czy vendorowanie** — `queue_runner`, `build_daemon`, `depmap_*`,
`make_manifest` żyją w `anthropics/code-migration-kit-with-claude-code` (Apache-2.0, © 2026
Anthropic PBC).

- **Referencja (domyślne, dopóki nie zdecydujesz)** — klonujesz kit obok repo migrowanego i używasz
  jego skryptów; nasza warstwa to orkiestracja ról + bramki + Rulebook.
- **Vendorowanie** — prawnie dozwolone przez Apache-2.0, ale wymaga zachowania nagłówków
  licencyjnych + `NOTICE`/atrybucji (§4) i świadomej zgody na pakowanie cudzego kodu do dystrybucji
  Sailes (plugin/marketplace). **To decyzja człowieka, nie agenta.**

## Model kosztu i to, że zatrzymanie jest darmowe

Budżetujesz jawnie: **jednostki pracy × koszt/jednostkę**. Największym mnożnikiem jest **topologia
review** (to ona łapie większość problemów), nie sam przekład. Produkcyjny port dużego repo to rząd
**miliardów tokenów wejścia** w skali dni–tygodni; limity wydłużają czas zegarowy, nie zmieniają
metody.

Trzy cięcia kosztu: **bez kompilatora w Krokach 3–4** poza jednym zbiorczym survey (wymusza to
deny-list), **tania weryfikacja przed drogą** (Krok 5 hello-world przed pełną parzystością),
**napraw regułę, nie N instancji**.

Sign-off = odpalenie następnego kroku, nie osobna ceremonia. **Kolejkę definiuje stan na dysku**
(manifest + przetłumaczone jednostki + kolejka błędów), więc zatrzymanie jest darmowe, a wznowienie
to ponowne wywołanie — nie recovery.

## Red Flags — STOP (pełna lista ze SKILL.md)

- Zacząłeś tłumaczyć pliki, a judge/parity-harness **nie istnieje** lub nie był walidowany na
  zepsutym źródle.
- Redesignujesz architekturę bez jawnego wyboru trybu redesign.
- Dwaj agenci mogliby przetłumaczyć ten sam konstrukt inaczej, a to **nie jest** w Rulebooku.
- Deklarujesz „done" na zielonym typecheku, bez dowodu parzystości zachowań (Krok 6).
- Łatasz N-tą instancję tego samego błędu ręcznie zamiast poprawić regułę, która go generuje.
- Wpinasz `sailes-migrate` jako fazę liniowego pipeline'u build (to sibling, nie faza).
- Uruchamiasz fan-out bez zainstalowanego deny-list guardraila.

## Gdzie doczytać

`skills/sailes-migrate/`: `SKILL.md` (wejście), `methodology.md` (sześć kroków w głąb),
`judge-setup.md` (dwie drogi judge'a + procedura walidacji), `rulebook-template.md` (tabela
decide-once + gap inventory do skopiowania jako `.ai/migrate/RULEBOOK.md`),
`parallel-translation.md` (playbook fan-outu i deny-list), `cost-and-gates.md` (tabela bramek,
model kosztu, provenance/licencja).
