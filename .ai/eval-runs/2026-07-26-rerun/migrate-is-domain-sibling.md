# Gdzie w pipeline siedzi `sailes-migrate` i kiedy ją odpalić

**Pytanie (dosłownie):** „gdzie w naszym pipeline siedzi migracja i kiedy ją odpalić?"

**Data:** 2026-07-26 · dry-run (nic nie uruchamiano, nie tknięto kodu projektu)
**Źródła:** `skills/sailes-migrate/SKILL.md`, `skills/README.md`, `AGENTS.md` (Framework-Version 1.16.0)

---

## Krótka odpowiedź

**Nigdzie — i to jest celowe.** `sailes-migrate` **nie jest fazą liniowego pipeline'u build**. To
**domain sibling**, dokładnie tej samej klasy co `sailes-pipedrive` i `sailes-hosting`: wołany
samodzielnie, obok pipeline'u, nie wpięty w jego numerację faz.

Odpalasz ją, gdy **istnieje działająca baza kodu** i trzeba ją **przenieść na inny język/stack**
z zachowaniem zachowań — nie gdy budujesz nowy feature.

---

## Gdzie to siedzi względem reszty skilli

Liniowy pipeline (`skills/README.md`) to:

```
sailes-start
  Faza 0    sailes-wayfinder    (opcjonalna — idea za duża/mglista)
  Faza 1    sailes-discovery    → Brief
  Faza 2    sailes-bootstrap    → repo agentic-first
    Faza 2.5  sailes-design
  Faza 3    sailes-spec         → zatwierdzony spec
  Implementacja: sailes-pre-implement → sailes-database → sailes-async → sailes-implement
                 → release gate (sailes-bootstrap/release-checklist.md)
```

Obok tego istnieją **tory poza pipeline'em**:

| Tor | Relacja do pipeline'u | Kiedy |
|---|---|---|
| `sailes-diagnose` | biegnie **ZAMIAST** pipeline'u | coś zbudowanego już działa i się psuje |
| **`sailes-migrate`** | **domain sibling — obok**, wołany samodzielnie | port istniejącej bazy kodu na inny język/stack |
| `sailes-pipedrive` | domain sibling | integracja z Pipedrive |
| `sailes-hosting` | domain sibling | hosting/ops na Railway |

To rozróżnienie jest **twarde, nie stylistyczne**. `SKILL.md` wymienia „wpinanie `sailes-migrate`
jako fazy liniowego pipeline'u build" wprost na liście **Red Flags — STOP**. `skills/README.md`
opisuje ją jako „Domain sibling (not part of the core pipeline)". Nie ma numeru fazy, bo nie ma
w tej sekwencji miejsca — migracja nie następuje „po spec'u" ani „przed implementacją".

### Ale nie jest odcięta — reużywa maszynerii pipeline'u

Sibling ≠ silos. Migracja świadomie **nie buduje niczego, co już mamy** — każdy z jej sześciu
kroków pożycza istniejące instrumenty:

| Krok migracji | Co pożycza z pipeline'u / ról |
|---|---|
| 0. Feasibility + Judge | lens `sailes-pre-implement` + dyscyplina bramki `qa` |
| 1. Mapa + Rulebook + Inventory | `explorer` + **graphify** (z `sailes-bootstrap` Step 4.9) |
| 2. Stress-test reguł | najbliższy krewny: RED-baseline z `sailes-implement`; deny-list |
| 3. Tłumaczenie (fan-out) | `team-lead` → równolegli `be-dev`/`fe-dev`; deny-list `.claude/settings.json` |
| 4. Survey build + fixerzy | fan-out fixerów pod `team-lead` |
| 5. Uruchom | dyscyplina `qa` (tania weryfikacja przed drogą) |
| 6. Parzystość zachowań (bramka) | `checker` + `tester` + `qa`; odroczone markery → `.ai/backlog.md` |

Czyli: **role i guardraile są wspólne, sekwencja jest własna.**

---

## Kiedy ją odpalić (trigger)

**Odpal**, gdy jednocześnie:

1. istnieje **działająca** baza kodu (oryginał jest wykonywalną specyfikacją), **i**
2. trzeba ją przenieść na **inny język/stack** z zachowaniem zachowań (Python→TS, PHP→TS,
   Rails→nasz stack, C→Rust), **i**
3. jest **na tyle duża**, że ręczny przekład plik-po-pliku bez reguł rozjedzie się między agentami.

Sformułowania, które ją wołają (z `description` skilla): „przenieś / sportuj / zmigruj tę aplikację
z X na Y", „port legacy", „przepisz z Pythona/PHP/Rails/Javy na nasz stack", „migracja kodu/języka",
„rewrite dużego repo", „code migration", „language migration", „port codebase", „rulebook",
„parity harness", „judge", „structure-preserving vs redesign".

`AGENTS.md` ma to w Task routerze jednym wierszem:

> | Porting an existing codebase to another language/stack at scale | `sailes-migrate` — domain sibling, judge-before-translation, behavior-parity gate |

**NIE odpalaj**, gdy:

| Sytuacja | Właściwy adres |
|---|---|
| To nowa aplikacja | `sailes-discovery` (i dalej pipeline) |
| To zmiana **schematu bazy** (Prisma/Drizzle/SQL) | `sailes-database` — to inne znaczenie słowa „migracja" |
| Coś **zepsutego** w działającym systemie | `sailes-diagnose` |
| Przepisanie jednego pliku bez zależności | po prostu zrób to |

Pułapka nazewnicza jest realna i skill disambiguuje ją explicite: **„migracja" w `sailes-database`
to schemat DB, „migracja" w `sailes-migrate` to przekład KODU między językami/stackami.**

---

## Kiedy odpalić **co** wewnątrz — kolejność jest bramkowana

Samo „odpalenie migracji" to nie jeden strzał. Sześć kroków, każdy kończy się **bramką**;
sign-off jednej bramki = odpalenie następnego kroku. Zatrzymanie jest darmowe (kolejka to stan na
dysku), wznowienie to ponowne wywołanie, nie recovery.

Dwa warunki wejścia, których **nie wolno** przeskoczyć:

1. **Reguła nadrzędna (invariant migracji):** żaden równoległy przekład (Krok 3) nie startuje,
   zanim nie istnieje judge/parity-harness **i nie został zwalidowany na CELOWO zepsutym źródle**.
   To migracyjny odpowiednik „żadnego kodu feature'a bez zatwierdzonego spec". Judge, który nie
   łapie zepsutego oryginału, nie udowodni parzystości portu.
2. **Deny-list guardrail musi być zainstalowany przed pilotem z Kroku 2.** Kroki 2–4 i 6 działają
   pod `.claude/settings.json` (+ twin `.codex/config.toml`) — bez niego blokady drogich operacji
   (np. per-plikowy typecheck w trakcie fan-outu) po prostu nie działają.

Domyślny tryb to **structure-preserving** (ten sam kształt architektury, inny język; jednostka =
plik/moduł; Rulebook jako tabela lookup). **Redesign to osobny, świadomie wybrany tryb** — nie
wchodzi się w niego „po cichu" pod słowem „migracja".

Koniec: Krok 6 = wszystkie testy parzystości zielone **I** oryginalny suite na oryginalnym kodzie
bez odziedziczonych porażek; potem burndown markerów `BUG(port)`/`TODO(port)`/`PERF(port)`.
„Done" na zielonym typechecku, bez dowodu parzystości zachowań, jest Red Flagiem.

---

## Jednozdaniowa odpowiedź dla człowieka

Migracja **nie siedzi w pipeline** — to sibling obok niego (jak `sailes-pipedrive`/`sailes-hosting`),
wołany samodzielnie wtedy i tylko wtedy, gdy portujesz **istniejącą, działającą** bazę kodu na inny
język/stack na dużą skalę; wewnątrz startuje od feasibility + **judge**, a równoległe tłumaczenie
rusza dopiero po tym, jak judge udowodni się na celowo zepsutym źródle.

---

## Zakres tej notatki

**Ustalone** z trzech wskazanych plików: pozycja `sailes-migrate` względem faz pipeline'u i innych
siblingów, triggery i anty-triggery, mapa reużycia ról, invariant judge-before-fan-out, warunek
deny-list, bramka parzystości, disambiguacja wobec `sailes-database`.

**Nieustalone** (świadomie — dry-run, zakaz czytania `evals/`, brak innych plików w scope):
treść plików pomocniczych skilla (`methodology.md`, `judge-setup.md`, `rulebook-template.md`,
`parallel-translation.md`, `cost-and-gates.md`), status evali `migrate-judge-gate` i
`migrate-structure-preserving-default`, oraz to, czy po Kroku 6 formalnie następuje release gate
z `sailes-bootstrap/release-checklist.md` — `SKILL.md` tego nie stwierdza, a ja tego nie zakładam.
