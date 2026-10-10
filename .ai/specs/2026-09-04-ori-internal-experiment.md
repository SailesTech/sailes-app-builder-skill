# Spec: Ori (OpenRouter) jako eksperyment wewnętrzny — cztery warunki wejścia

Status: **approved** — Open Questions zamknięte 2026-09-04 (Q1-Q4 poniżej, wszystkie odpowiedzi człowieka)
Date: 2026-09-04 · Branch: `feat/ori-internal-experiment` (jeszcze nie utworzona) · **nic nie pushowane**
Badanie źródłowe: `.ai/experiments/2026-09-04-ori-harness-impact-study.md` (484 linie, 2 niezależne krytyki adwersaryjne)
Wersja narzędzia pod badaniem: `ori 0.13.0+c7b5cda`, kanał **alpha**

> **Zakres ustalony przez człowieka 2026-09-04:** Ori wchodzi **wyłącznie na repo frameworku**,
> zero kodu klienta (Proton, CallOS), do czasu spełnienia czterech warunków z §Warunki wejścia.

---

## TLDR & Context

Ori to CLI OpenRoutera, które uruchamia nasze istniejące harnessy (`ori claude`, `ori codex`) na
poświadczeniach OpenRoutera, dając **pin dowolnego modelu per rola** — w tym cross-vendor — oraz własny
loop i silnik ewaluacji. Badanie wykazało, że pin działa i cała nasza powierzchnia (skille, hooki,
guardian, MCP) przeżywa; wykazało też dwa fakty dyskwalifikujące dziś użycie na kodzie klienta:
**nie da się ustalić z góry, do jakiego providera trafi kod**, a **pole `effort:` ośmiu ról jest martwe**.
Ten spec nie wdraża Ori — ustawia eksperyment na własnym repo i zamyka cztery warunki, po których
rozmowa o kodzie klienta w ogóle ma sens.

## Problem Statement

Framework pinuje modele w plikach ról i deklaruje `effort:` jako część specyfikacji roli. Chcemy wiedzieć,
czy Ori daje nam realną dźwignię (multimodel per rola, tańszy recon, gate na innej rodzinie modeli),
czy tylko przenosi rachunek z subskrypcji na kredyty, tracąc po drodze sterowanie wysiłkiem. Dziś:

- **Zmierzone ZA:** pin `model:` działa cross-vendor (gemini na subagencie Claude Code = HTTP 200);
  skille/hooki/guardian/MCP żyją pod `ori claude`; caching działa też dla subagentów (204k cache-read
  na trzech explorerach); `result_schema` w `ori code` egzekwuje twardo.
- **Zmierzone PRZECIW:** `effort:` martwe dla **8 ról** (w tym `team-lead` i `researcher` na Opusie 5);
  provider wybierany przez router per żądanie (`anthropic/*` serwowane przez Bedrock i Claude Platform
  on AWS); `task(harness:'claude')` nie istnieje mimo pola w schemacie; nasze piny z myślnikami odrzucane
  na ścieżce chat-completions; subskrypcja nieużywana.
- **Niezmierzone, a decydujące:** koszt pełnej fazy, zachowanie przy 429 i awarii providera, rollback,
  jakość taniego modelu w roli `explorer`.

## Decisions (podjęte 2026-09-04)

| # | Decyzja | Kto |
|---|---|---|
| D1 | Ori nie dotyka repo z kodem klienta do czasu spełnienia W1-W4 | człowiek |
| D2 | Efekt zostaje lokalnie; zespół widzi dopiero po dowodach | człowiek |
| D3 | Budżet badania: ≤5 USD kredytów OpenRoutera na rundę | człowiek |
| D4 | Komentarz przy PR listuje jawnie wszystkie **+** i **−** | człowiek |
| D5 | Żadne pliki ról (`agents/*.md`, `codex-agents/*.toml`) nie są edytowane w tym specu | ten spec |

## Open Questions — ZAMKNIĘTE 2026-09-04

| # | Pytanie | Odpowiedź człowieka |
|---|---|---|
| Q1 | Piny nie-Anthropic w plikach ról, choćby na repo wewnętrznym? | **NIE, dopóki nie ma dowodu jakości.** „HTTP 200" to nie „rola wykonana dobrze"; `explorer` zwraca `file:line`, a zmyślona ścieżka nie wraca jako błąd. Warunek odblokowania: recon o znanym ground truth, porównanie precyzji ścieżek |
| Q2 | Zgłoszenie dwóch blokerów do OpenRoutera? | **TAK, treść do akceptu przed wysłaniem.** Draft: `.ai/experiments/2026-09-04-openrouter-report-draft.md` |
| Q3 | Sufit budżetu Fazy 3 | **$15.** Przerwanie po osiągnięciu sufitu jest wynikiem pomiaru, nie porażką |
| Q4 | Gdzie ląduje `docs/harness-ori.md` | **Nigdzie — wszystko zostaje lokalnie.** Bez brancha, bez PR-a, bez bumpu wersji: „skoro mamy porażkę, to nie ma co wypychać" |

**Konsekwencje Q1 i Q4 dla zakresu (D6-D8):**
- **D6.** Żaden pin cross-vendor nie trafia do `agents/*.md` — także na repo wewnętrznym. Pomiar jakości
  taniego modelu w roli `explorer` staje się **warunkiem W5**, nie elementem wdrożenia.
- **D7.** Faza 6 nie tworzy gałęzi, PR-a, wpisu w `CHANGELOG.md` ani bumpu `VERSION`. Efekt = pliki na dysku.
- **D8.** Reguła „komentarz przy PR listuje + i −" (D4) pozostaje w mocy, ale nie ma dziś zastosowania —
  odżywa przy pierwszym PR-ze, gdyby W1-W5 kiedykolwiek zostały zamknięte.

## Warunki wejścia (W1-W4) — dopiero ich spełnienie otwiera rozmowę o kodzie klienta

| # | Warunek | Dlaczego blokujący |
|---|---|---|
| W1 | Mechanizm wymuszenia listy providerów **przed** żądaniem | audyt po fakcie nie jest kontrolą; kod klienta trafia dziś tam, gdzie zdecyduje router |
| W2 | `effort: high` zmierzone (natywnie vs Ori), n≥3, i albo naprawione, albo skompensowane jawnym zapisem w rolach | 8 ról deklaruje wysiłek, którego pod Ori nie dostają — cicha utrata jakości gate'ów |
| W3 | Jeden pełny przebieg fazy `implement` z rozbiciem kosztu lead vs subagenci | bez tego ekonomia jest zgadywaniem; człon dominujący (cache-read leada × tury) nie był mierzony |
| W4 | Napisana i **przetestowana** ścieżka wycofania | faza stojąca w połowie pod Ori musi dać się dokończyć na subskrypcji |
| W5 | Jakość taniego modelu w roli `explorer` zmierzona na recon o znanym ground truth | Q1: pin cross-vendor bez tego jest gate'em/reconem, którego jakości nikt nie zna |

## Proposed Solution

Cztery fazy pomiarowe zamykające W1-W4, piąta na warunek dla ramienia evalowego, szósta na dokument.
Żadna nie edytuje plików ról ani nie zmienia domyślnego zachowania frameworku. Wszystko, co powstaje,
to: pliki w `.ai/experiments/`, jeden dokument w `docs/`, wpis w `CHANGELOG.md`.

## API & UI Surface (powierzchnia frameworku)

Bez zmian w powierzchni. Nowe pliki: `docs/harness-ori.md`, `.ai/experiments/2026-09-04-*.md`
(już istnieje), `.ai/experiments/2026-09-XX-ori-w{1,2,3,4}-*.md`. Zmiana w `README.md` §Harnesses
i w `AGENTS.md` — wyłącznie po zamknięciu W1-W4 (Faza 6, bramkowana).

## Data Model / Jobs / Integration

Nie dotyczy — repo frameworku nie ma bazy ani workerów. Integracja zewnętrzna: OpenRouter API
(`/api/v1/key` do delty kosztu, `/api/v1/generation?id=` do atrybucji providera), wywoływane ręcznie
w fazach pomiarowych, bez automatyzacji i bez ruchu masowego.

## Security

- **Kod klienta nie wchodzi** (D1) — to jest cała kontrola bezpieczeństwa tego specu.
- Klucz OpenRoutera czytany z `~/.ori/credentials.json`; **nigdy nie jest drukowany ani commitowany**;
  w raportach wyłącznie `usage`/delta.
- Ruch do OpenRoutera: maks. 2 równoległe żądania, brak testów obciążeniowych (429 i awaria providera
  wymagają ruchu, którego reguła warsztatu zabrania bez zgody — patrz Non-Goals).
- Guardian (`~/.claude/hooks/guardian.py`) zweryfikowany pod Ori: DENY na `.env` zadziałał.

## Phasing & Steps

### Faza 1 — W2: `effort: high` zmierzone tam, gdzie naprawdę stoi (est. 1,5 h, ~$1)
Sondy: subagent na `claude-haiku-4-5` z `effort: high`, drugi z `effort: low`, oba natywnie i pod
`ori claude`, **3 powtórzenia na komórkę**, ten sam prompt generujący myślenie. Do tego jeden przebieg
z rolą kształtu `team-lead` (Opus 5, `effort: high`).
**Done-when:** `.ai/experiments/2026-09-XX-ori-w2-effort.md` zawiera tabelę 2×2×3 z `thinkingTokens`
z `modelUsage`, medianę per komórka i jedno zdanie werdyktu; `grep -c "thinkingTokens" plik` ≥ 12.

### Faza 2 — W1: czy da się wymusić providera (est. 1,5 h, ~$0,5)
Sprawdzić trzy ścieżki: (a) ustawienia prywatności konta OpenRouter (allowlista providerów, ZDR),
(b) czy Ori przepuszcza preferencje providera do żądania Claude Code, (c) czy `ori code` przyjmuje
`provider.only` i czy generacja to potwierdza.
**Done-when:** dokument z jednoznacznym TAK/NIE dla każdej z trzech ścieżek, a dla każdego TAK —
generacja dowodowa z `/api/v1/generation?id=`, w której `provider_name` należy do wymuszonej listy,
oraz kontrprzykład: żądanie do providera spoza listy **odrzucone albo przekierowane**.

### Faza 3 — W3: koszt pełnej fazy (est. 2 h, budżet z Q3)
Jedna faza `sailes-implement` na repo frameworku (kandydat: dowolna pozycja tech-debt z backlogu),
pod `ori claude`, z leadem na Opusie i pełnym fan-outem. Klucz w oknie pomiaru nie obsługuje niczego
innego (zapisane wprost).
**Done-when:** delta `usage` klucza przed/po + rozbicie z `modelUsage` na agenta głównego i subagentów
+ liczba tur; raport podaje $ na fazę i $ na turę leada; rozjazd licznika Claude Code vs delta podany
w procentach.

### Faza 4 — W4: ścieżka wycofania (est. 1 h, ~$0,5)
Przerwać fazę pod `ori claude` w połowie, wrócić na subskrypcję (`claude` natywnie), dokończyć tę samą
pracę.
**Done-when:** `docs/harness-ori.md` §Rollback zawiera procedurę krok po kroku, a raport z Fazy 4
pokazuje, że praca została dokończona natywnie po przerwaniu, z nazwaniem tego, co zostało na dysku
(sesja, artefakty, stan gita).

### Faza 5 — warunek dla ramienia evalowego (est. 2 h, ~$0,5)
(a) Ręczna klasyfikacja **36** scenariuszy `evals/` po `Setup:` + `Expected (binary)` — nie po grepie
(klasyfikator leksykalny został obalony: trafiał w esej `Last run:`). (b) **Jeden** scenariusz z kubełka
„tekstowy" przepisany na `*.eval.ts` i odpalony.
**Done-when:** tabela 36 wierszy z werdyktem tekstowy/runtime i uzasadnieniem per wiersz; plik
`.eval.ts` istnieje, `ori eval --list --allow-no-key` go widzi, a jego werdykt jest **porównany
wprost** z ostatnim ręcznym `Last run:` tego scenariusza — zgodny albo z nazwaną różnicą.

### Faza 6 — dokument, lokalnie (est. 1,5 h, bramkowana W1-W5) — ZAKRES ZMIENIONY PRZEZ Q4
`docs/harness-ori.md` powstaje **na dysku i tam zostaje**: czym Ori jest, co zmierzono, czego nie wolno
(kod klienta do czasu W1-W5), martwy `effort:` ośmiu ról, asymetria aliasów, brak kontroli providera
ex ante, rollback z Fazy 4. Bez gałęzi, bez PR-a, bez `CHANGELOG.md`, bez bumpu `VERSION` (D7).
**Done-when:** plik istnieje i zawiera sekcje `Czego nie wolno`, `Rollback`, `Co zmierzono`;
`git status --short` pokazuje go jako **untracked** (nic nie zacommitowane); `npm test` zielony
(dowód, że eksperyment nie ruszył niczego, co jest bramkowane).

## Integration Coverage

| Ścieżka | Test |
|---|---|
| Pięć stempli wersji + CHANGELOG | `release-hygiene.test.js` (istnieje) |
| Parity ról Claude ↔ Codex | `codex-agents/parity.test.js` (istnieje; ten spec nie rusza ról, więc musi zostać zielony bez zmian) |
| Świeżość evali | `evals/harness/eval-status.js --strict` (Faza 5 nie może go zepsuć) |
| Nowe ramię evalowe | osobna komenda `npm run test:evals`, **nigdy** w `npm test` (precedens: `test:browser`, 1.16.0) |

## Non-Goals

- **Nie** wdrażamy Ori na repo klienckim ani nie zmieniamy domyślnego sposobu uruchamiania pipeline'u.
- **Nie** edytujemy `agents/*.md` ani `codex-agents/*.toml` (D5) — w szczególności nie dopisujemy pinów
  cross-vendor przed odpowiedzią na Q1.
- **Nie** budujemy lane'u „ori loop" (`features/sailes/`, spine w `ori.md`, trzecia strona parity) —
  baza dowodowa jest dziś gorsza niż przed krytyką (1 z 4 pól schematu `task` zweryfikowane pozytywnie).
- **Nie** migrujemy `evals/` — Faza 5 dostarcza wyłącznie warunek, na podstawie którego da się o tym
  rozmawiać.
- **Nie** testujemy 429 ani awarii providera ruchem obciążeniowym — reguła warsztatu wymaga zgody
  człowieka na ruch masowy do cudzego serwisu; do zaplanowania osobno.

## Ryzyka

| Ryzyko | Konsekwencja | Mitygacja w tym specu |
|---|---|---|
| Alpha łamie API między fazami | pomiary z różnych wersji nieporównywalne | `ori --version` zapisywane w każdym raporcie; `autoUpdateOnCodeLaunch: false` potwierdzone |
| Delta `usage` klucza zanieczyszczona innym ruchem | koszt zawyżony/zaniżony | Faza 3 zapisuje wprost, że klucz nie obsługiwał nic innego w oknie |
| Faza 3 przepala budżet | niekontrolowany wydatek | sufit z Q3; przerwanie po jego osiągnięciu jest wynikiem, nie porażką |
| Dokument trafia na `main` przed zamknięciem W1-W4 | zespół dostaje instrukcję do rzeczy niedowiedzionej | Q4; Faza 6 bramkowana |
| Cichy dryf: ktoś doda pin cross-vendor „przy okazji" | gate na modelu, którego jakości nikt nie zmierzył | D5 + Non-Goals; brak edycji ról w tym specu |

## Estymata

Fazy 1-6 (bez Fazy 6 na main, plus W5 do zaplanowania osobno): **10 h** roboty + ~$3-5 kredytów poza budżetem Fazy 3 (Q3). Bufor +10% → **11 h**.
Poniżej progu wyceny klienckiej (10 h) — to praca wewnętrzna, estymata służy zaplanowaniu dnia.
