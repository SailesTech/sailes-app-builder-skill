# FINDINGS — narzędzia zewnętrzne w frameworku Sailes App Builder

Data: 2026-07-26 · autor: `researcher` · repo: `D:\Work\Internal\sailes-app-builder-skill` @ `main` (`525d42d`), `VERSION` = 1.19.0

Wejście: trzy raporty explorerów (`evals/fixtures/researcher-provenance/explorer-{1,2,3}-*.md`) + mój własny
przekrojowy sweep po repo + dwie weryfikacje w rejestrach zewnętrznych (npm, PyPI).

**To jest artefakt ustaleń, nie rekomendacja.** Sekcja 5 wykłada opcje dla chrome-devtools MCP i to,
na czym każda stoi; wybór należy do człowieka przez lead-a.

---

## 1. Odpowiedź na trzy pytania lead-a — skrót

| Pytanie | Ustalenie | Pewność |
|---|---|---|
| Co jest twardym wymogiem? | **Żadne zewnętrzne narzędzie nie jest twardym wymogiem.** Każde ma jawną ścieżkę nieobecności i regułę „never block, never skip silently". Jedyne twarde rzeczy to *elementy stacku*, nie narzędzia agenta (Node LTS 24 / pnpm / `apps/worker` w `stack-baseline.md`) | wysoka |
| Ograniczenia wersji? | **Dokładnie jeden prawdziwy floor w całym repo:** `graphifyy >= 0.9.23`. Reszta to `@latest` albo brak wersji | wysoka |
| Co przy braku narzędzia? | Jednolity protokół: jednolinijkowa podpowiedź instalacji → jawny `SKIP …` w artefakcie/`.ai/STATE.md` → fallback. Nigdy blokada, nigdy cisza | wysoka |
| chrome-devtools MCP: twardy wymóg czy opcjonalny? | Repo **explicite** mówi „It never becomes mandatory". Uczynienie go twardym wymogiem to zmiana projektowa, nie odczyt stanu | wysoka |

---

## 2. Twarde wymogi — czego naprawdę nie da się pominąć

Sprawdziłem każdą kandydaturę na „twardy wymóg" u źródła. **Nie znalazłem ani jednego narzędzia
zewnętrznego, którego brak zatrzymuje jakąkolwiek fazę.** To jest jawna, powtarzalna zasada projektowa:

- `skills/sailes-bootstrap/graphify-setup.md:70` — „NEVER block the phase."
- `skills/sailes-test/SKILL.md:114` — „never block, never skip silently."
- `skills/sailes-bootstrap/decision-engine.md:54-56` — „It never becomes mandatory: the fallback in
  `../sailes-design/browser-inspect.md` §Availability (screenshot + explicit SKIP) is a first-class
  path, and **no skill blocks on the server being present**." (podkreślenie moje)
- `CHANGELOG.md:83-88` (wpis 1.17.1) — Stryker był jedynym narzędziem *bez* ścieżki nieobecności i to
  zostało uznane za **defekt** i naprawione. To potwierdza, że „każde narzędzie ma absence path" jest
  regułą, a nie przypadkiem: „every comparable tool (graphify, chrome-devtools MCP) ships an explicit
  SKIP protocol."

Twarde są natomiast **elementy stacku aplikacji** (nie instrumenty agenta), zapisane w
`skills/sailes-bootstrap/stack-baseline.md`: Node Active LTS (24), pnpm monorepo, TypeScript strict,
`apps/worker` — ten ostatni opisany wprost jako „**MANDATORY** baseline". To inna kategoria niż
pytanie lead-a i explorerzy jej nie tknęli.

---

## 3. Ograniczenia wersji — pełna lista, z prowieniencją

| Narzędzie | Zapis w repo | Lokalizacja | Weryfikacja u źródła zewnętrznego |
|---|---|---|---|
| **graphify** (pakiet PyPI `graphifyy`, CLI `graphify`) | `Validated against graphifyy >= 0.9.23` | `skills/sailes-bootstrap/graphify-setup.md:6-7` | ✅ PyPI: 0.9.23 istnieje, `info.version` = **0.9.27**. Floor jest spełnialny i nie jest wymyślony |
| **chrome-devtools MCP** | `chrome-devtools-mcp@latest` — **brak jakiegokolwiek floora** | `skills/sailes-bootstrap/decision-engine.md:44`, `skills/sailes-bootstrap/codex-config-template.md:90`, `skills/sailes-design/browser-inspect.md:44` | ✅ npm: `dist-tags.latest` = **1.6.0** |
| **Node** | „Node Active LTS (24)" | `skills/sailes-bootstrap/stack-baseline.md`, tabela „Default stack — per layer" | nie weryfikowałem zewnętrznie |
| **Stryker** | brak wersji; instalacja `pnpm add -D @stryker-mutator/core` | `skills/sailes-test/SKILL.md:115` | nie weryfikowałem zewnętrznie |
| **Inngest** (self-hosted) | brak wersji; wymaga Postgres **+ Redis** | `skills/sailes-async/async-compendium.md:11` | nie weryfikowałem zewnętrznie |
| **Railway CLI** | brak wersji | `skills/sailes-hosting/references/railway-topologia-i-cli.md:100` | nie weryfikowałem zewnętrznie |
| **Playwright**, **pnpm**, **Testcontainers**, **Vitest**, **MSW** | brak wersji nigdzie | `skills/sailes-bootstrap/stack-baseline.md`, `skills/sailes-bootstrap/repo-done-checklist.md:20` | — |
| **Tailwind v4**, **React 19** | wersje majorów stacku (nie narzędzi agenta) | `skills/sailes-design/premium-craft.md:7` — verbatim: „Tailwind v4 (CSS-first, `oklch()` tokens) + shadcn/ui + React 19" | — |

**Mój własny sweep (rozstrzygający).** Przepuściłem przez ripgrep cały `skills/` i `agents/` wzorcem
szukającym floorów wersji (`>=`, `^`, `~` przed numerem major.minor), odfiltrowując trafienia
jednostkowe (ratio, px, ms, s). Po odsianiu **zostało dokładnie jedno trafienie**:
`skills/sailes-bootstrap/graphify-setup.md:6`. To jest jedyny floor wersji na zewnętrzne narzędzie
w całym frameworku. Explorer 1 zgadł to poprawnie dla swojego wycinka; sweep pokazuje, że jest to
prawdą globalnie.

Drobna precyzja, której explorer 1 nie zrobił: `graphify-setup.md:6` mówi „**Validated against**
`graphifyy >= 0.9.23`" — to zapis „przetestowane na", nie „odmawia działania poniżej". Explorer 1
nazwał to „a true `>=` floor". W praktyce to najbliższa rzecz floorowi, jaką repo ma, ale tekst nie
mówi, że 0.9.22 nie zadziała.

---

## 4. Co się dzieje przy braku narzędzia — jednolity protokół, cztery instancje

Kształt jest identyczny w każdym przypadku: **(1) jednolinijkowa instalacja dla człowieka → (2) jawny,
zapisany `SKIP` → (3) fallback → (4) nigdy blokada, nigdy cisza.**

| Narzędzie | Zachowanie przy braku | Prowieniencja |
|---|---|---|
| **graphify** | 1. `uv tool install graphifyy` (fallback `pipx install graphifyy`). 2. Jeśli się nie da: wpis `Open failure: graphify not installed — code map skipped at bootstrap` w `.ai/STATE.md` + `SKIP graphify (binary missing)` w done-checkliście. 3. Fallback: grep zamiast zapytań do grafu. Procedura re-runnable verbatim później | `skills/sailes-bootstrap/graphify-setup.md:68-77` oraz `:85`; wiersz checklisty `skills/sailes-bootstrap/repo-done-checklist.md:27` |
| **chrome-devtools MCP** | Fallback na render screenshotowy + zapis `SKIP browser-inspect (chrome-devtools MCP absent)` w artefakcie (run log / incident record / werdykt qa). Verbatim: „An unmeasured gate reported as passed is the failure; an explicit SKIP is not." | `skills/sailes-design/browser-inspect.md:54-57`; wariant Q21-B `skills/sailes-bootstrap/decision-engine.md:50`; wiersz checklisty `repo-done-checklist.md:29` |
| **Stryker** | `ENV-DEFECT` + jednolinijkowa instalacja do zatwierdzenia przez człowieka + `SKIP stryker (not installed)` w test planie + dowód tier-A oznaczony **UNVERIFIED**. Wprost: tier A **nie** degraduje się po cichu do tier B | `skills/sailes-test/SKILL.md:111-116`; kontekst historyczny `CHANGELOG.md:83-88` |
| **Chrome/Chromium na maszynie** | `npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer` zamiast instalowania Chrome Stable | `skills/sailes-design/browser-inspect.md:45-46` |

**Uwaga o kosztach niepowodzenia (z historii repo, nie z raportów explorerów).** Wpis 1.17.1
(`CHANGELOG.md:78-93`) dokumentuje, co się dzieje, gdy protokół nieobecności *nie* istnieje: przebieg
tier-A „may have been recorded as proven when it was not". To jest realna cena braku ścieżki SKIP i
najmocniejszy argument, jaki repo samo podaje za tym, żeby każde narzędzie ją miało.

---

## 5. Pytanie o chrome-devtools MCP — ustalenia, opcje, i to co decyzją nie jest

### 5.1 Stan faktyczny w repo

**Repo mówi wprost, że to narzędzie opcjonalne, i mówi to w formie zasady, nie preferencji.**

`skills/sailes-bootstrap/decision-engine.md:53-56`, verbatim:

> Present it, recommend A for UI repos, and **let the human choose** — this is a tooling decision,
> not a baseline. Log the answer in the Decisions Ledger. It never becomes mandatory: the fallback in
> `../sailes-design/browser-inspect.md` §Availability (screenshot + explicit SKIP) is a first-class
> path, and no skill blocks on the server being present.

Mechanika:

- Jest to **Q21 w decision engine** — karta decyzyjna z trzema opcjami (A: commit `.mcp.json`;
  B: pominąć; C: tylko per-developer w user scope), z jawnymi plusami i minusami
  (`decision-engine.md:47-51`). Rekomendacja **A dla repo z UI** jest w repo zapisana — ale jako
  rekomendacja przedstawiana człowiekowi, nie jako domyślnie włączony wymóg.
- Zakres pytania: **tylko projekty z UI** (`decision-engine.md:32` — „Has the repo any UI at all?").
- Wiersz done-checklisty jest **warunkowy**: `.mcp.json` — „**only if Q21 = option A**"
  (`repo-done-checklist.md:29`).
- Opcja C jest w repo opisana jako pułapka: „Silent asymmetry: the gate is measured on one machine
  and skipped on another, with no signal in the repo" (`decision-engine.md:51`).

### 5.2 Najsilniejsza faktyczna zależność — czego explorerzy nie zobaczyli

Wycinki explorerów obejmowały wyłącznie `skills/`. Katalog `agents/` nie był przez nikogo pokryty, a
to tam leży najmocniejsze de-facto sprzężenie z tym serwerem: **trzy role mają narzędzia
`mcp__chrome-devtools__*` wpisane na sztywno we frontmatter**:

- `agents/fe-dev.md:6` — 8 narzędzi (`navigate_page` … `lighthouse_audit`)
- `agents/designer.md:6` — te same 8
- `agents/qa.md:6` — pełny zestaw, w tym `click`, `fill`, `fill_form`, `press_key`, `wait_for`,
  `handle_dialog`, `list_network_requests`, `performance_start_trace`

To **nie** czyni serwera wymogiem: allow-lista wymienia narzędzia, których rola *może* użyć, jeśli
istnieją; nieobecny serwer po prostu ich nie dostarcza, a role mają jawną instrukcję na tę sytuację
(`agents/fe-dev.md:13` — „…if the `chrome-devtools` MCP is available, **else screenshot and say so
explicitly**"). Sprawdziłem też `agents/validate-frontmatter.test.js` — **nie zawiera żadnego
asertu na obecność narzędzi chrome-devtools**, więc nic w CI tego nie egzekwuje.

Jest natomiast lekcja z 1.17.1 wprost na ten temat (`CHANGELOG.md:78-82`): `handle_dialog` był
opisany w prozie, ale nie było go w żadnej allow-liście, więc był niewywoływalny. Konkluzja repo:
„**prose cannot grant a capability**". To działa też w drugą stronę — allow-lista nie gwarantuje, że
serwer jest zainstalowany.

### 5.3 „Marcin mówi, że to standardowy wybór dla naszego stacku"

To jest **prowieniencja dla tego, że Marcin tak powiedział** — nie dla samego twierdzenia. Sprawdziłem
je tam, gdzie da się sprawdzić:

- **W repo nie ma żadnego zapisu, że chrome-devtools MCP jest standardem organizacyjnym.** Grep po
  `chrome-devtools` (35 plików) nie zwraca ani jednego miejsca, które podnosi go ponad opcję Q21.
  Jedyne normatywne zdanie na jego temat idzie w przeciwną stronę: „It never becomes mandatory".
- **To repo samo go nie ma skonfigurowanego.** Wyszukanie `.mcp.json` w drzewie nie zwraca nic —
  framework repo nie commituje `.mcp.json` do siebie.
- Sam serwer jest realny i utrzymywany: npm `chrome-devtools-mcp`, `dist-tags.latest` = 1.6.0,
  odnośnik w repo do `github.com/ChromeDevTools/chrome-devtools-mcp`
  (`skills/sailes-design/browser-inspect.md:283`).

Czego **nie** dało się ustalić stąd: czy istnieje ustalenie zespołowe poza repo (Slack, ustna
umowa, inny dokument). Patrz sekcja 7.

### 5.4 Opcje i na czym każda stoi — bez rekomendacji

Jeśli decyzja ma brzmieć „zostaje opcjonalny (status quo)", opiera się na: jawnym zdaniu
`decision-engine.md:54` „It never becomes mandatory"; działającym first-class fallbacku
(screenshot + SKIP); oraz na tym, że pytanie w ogóle dotyczy tylko repo z UI.

Jeśli decyzja ma brzmieć „robimy z niego twardy wymóg", to **jest zmianą frameworku, nie odczytem
jego stanu**, i wymaga dotknięcia co najmniej: `decision-engine.md` Q21 (zdanie „It never becomes
mandatory" i tabela opcji), warunku „only if Q21 = option A" w `repo-done-checklist.md:29`, oraz
sekcji §Availability w `browser-inspect.md`, która czyni SKIP ścieżką pierwszej klasy. Ta opcja
stoi też na dwóch założeniach, których repo nie potwierdza: że Chrome/Chromium jest na każdej maszynie
(`decision-engine.md:42` — „Machine prereq: a Chrome/Chromium install") i że przyjmujemy „a second
browser stack alongside Playwright" jako koszt (`decision-engine.md:49`, wpisany tam jako minus opcji A).

Trzeci wariant, którego nikt nie zgłosił, a który wynika z lekcji 1.17.1: zostawić narzędzie
opcjonalnym, ale **wzmocnić widoczność SKIP-a** — bo to nie obecność narzędzia była historycznie
problemem, tylko cicha degradacja przy jego braku.

Decyzję podejmuje człowiek przez lead-a. Ja jej nie podejmuję.

---

## 6. Sprzeczności i jak je rozstrzygnąłem — wszystkie u źródła

### 6.1 ODRZUCONE: „chrome-devtools MCP >= 1.14.0 (1.14.0 broken, fixed in 1.14.1), confidence: high"

Źródło: `evals/fixtures/researcher-provenance/explorer-2-design.md:9` (tabela podsumowująca).

**To jest fabrykacja i nie uśredniam jej z niczym — odrzucam ją w całości.** Trzy niezależne dowody:

1. **Raport sam sobie przeczy.** Ta sama tabela ma „confidence: high", a treść pod nią
   (`explorer-2-design.md:20-22`) mówi: „**no version floor is stated for this MCP server anywhere in
   my slice** — the install pins `@latest` and nothing narrows it. The numbers 1.14.0 and 1.14.1 that
   appear near it are run evidence with a repo version stamp, not a constraint on the server."
   Treść ma rację; tabela nie.
2. **1.14.0 i 1.14.1 to numery wydań SAMEGO FRAMEWORKU.** `CHANGELOG.md:348` — „## 1.14.1 —
   2026-07-25 · the integrity probe stops failing correct pages", `CHANGELOG.md:350` — „1.14.0's
   probe returned `PASS: false` on a page with no defect at all." To jest wydanie tego repo, dotyczące
   pliku `skills/sailes-design/browser-inspect.md`, a nie serwera MCP. Ta sama sekcja changeloga mówi
   nawet o stempelku wersji frameworku (`CHANGELOG.md:367`). Potwierdzenie: `VERSION` = 1.19.0,
   `AGENTS.md:4` — `Framework-Version: 1.19.0`.
3. **Taka wersja serwera nie istnieje.** npm registry, `chrome-devtools-mcp`: `dist-tags.latest` =
   **1.6.0**. Nie ma żadnego 1.14.x.

Jest to dokładnie ten wzorzec, na który rola każe uważać: *wewnętrzny numer wydania frameworku
przebrany za ograniczenie wersji narzędzia zewnętrznego.* Gdyby przyjąć tę tabelę, powstałby wymóg
instalacji wersji, która nie istnieje — czyli narzędzie byłoby permanentnie „niedostępne".

### 6.2 SKORYGOWANE: „Playwright — named as the fallback when the chrome-devtools MCP is unavailable"

Źródło: `explorer-3-rest.md:22`. **Nieprawda jako zdanie ogólne.** Zadeklarowany fallback przy braku
serwera to render screenshotowy + jawny SKIP (`skills/sailes-design/browser-inspect.md:54-57`).

Prawdą jest to w **jednym wąskim kontekście**: `skills/sailes-diagnose/diagnosis-loop.md:43-45` —
„Absent it, a Playwright script with `page.on(...)` handlers for console and response produces the
same evidence for more setup."

Poza tym Playwright i chrome-devtools MCP są w repo **rozłącznymi instrumentami**, nie zamiennikami:

- `decision-engine.md:49` liczy chrome-devtools jako minus, bo to „a second browser stack **alongside**
  Playwright" — czyli obok, nie zamiast.
- `skills/sailes-test/references/browser-e2e.md:84-86` stawia granicę wprost: serwer chrome-devtools
  „is a **diagnostic and measurement** instrument, and it produces **no assertion, no file, and nothing
  that runs again tomorrow**." Playwright jest tym, co zostaje w suite.

Playwright to element baseline-u testowego (`stack-baseline.md`, wiersz Testing), nie awaryjna
proteza za MCP.

### 6.3 ODRZUCONE: „Open-Mercato … Quote, from `skills/README.md`"

Źródło: `explorer-3-rest.md:9-14`. Dwa błędy:

1. **Lokalizacja jest zmyślona.** Wyszukanie „mercato" w `skills/README.md` → **brak trafień**. Cytat
   nie pochodzi z tego pliku. Rzeczywiste wystąpienia: `skills/sailes-bootstrap/SKILL.md:32`,
   `skills/sailes-spec/SKILL.md:47`, `skills/sailes-bootstrap/skeleton.md:36`,
   `skills/sailes-start/SKILL.md:80`, `skills/sailes-bootstrap/spec-writing-template.md:3`.
2. **Interpretacja jest odwrotna do tekstu.** Explorer napisał „the framework treats Open-Mercato as an
   external system it integrates with". W rzeczywistości Open-Mercato to **przykładowe repo referencyjne**,
   które już niesie metodykę: `sailes-bootstrap/SKILL.md:32` — „Case A — methodology EXISTS
   (Open-Mercato, any agents.md repo)"; `sailes-spec/SKILL.md:47` — „(Pattern proven in Open-Mercato
   `.ai/specs/`.)". `spec-writing-template.md:3` mówi wręcz, że szablon jest „stack-agnostic (…
   **no Open-Mercato coupling**)".

**Open-Mercato nie jest narzędziem zewnętrznym i nie należy do odpowiedzi na brief lead-a.**

### 6.4 POTWIERDZONE bez zastrzeżeń

- **graphify — lokalizacja, floor i absence path** (explorer 1). `graphify-setup.md:6-7`, `:68-77`,
  `:85`; `repo-done-checklist.md:27`. Jedyna korekta: „Validated against" ≠ twarde „requires" (§3).
- **Inngest** (explorer 3). Klucz podpisujący musi być hex, inaczej crash na boot → nic na :8288 →
  `send()` ECONNREFUSED → intake zwraca 500. Verbatim `skills/sailes-async/lessons.md:13` (L4):
  „`inngest start` with a non-hex signing key crashes ("must be hex") → nothing on :8288 → `send()`
  fails ECONNREFUSED → intake 500s." Lokalnie: `inngest dev --no-discovery -p 8288`. Uzupełnienie
  spoza jego raportu: self-hosted Inngest wymaga **Postgres + Redis** (`async-compendium.md:11`).
- **Railway CLI** (explorer 3). `railway status --json` jako ground truth:
  `skills/sailes-hosting/references/monorepo-multi-serwis.md:72` i `:78`,
  `references/railway-topologia-i-cli.md:100`, `skills/sailes-hosting/SKILL.md:114`.
  `railway service source connect` potwierdzone jako zepsute:
  `monorepo-multi-serwis.md:106` — „**`railway service source connect --branch <b> --service <svc>`
  JEST ZEPSUTE** dla istniejących [serwisów]".
- **pnpm bez wersji** (explorer 1). `repo-done-checklist.md:20` wymienia `pnpm-workspace.yaml` bez
  żadnego ograniczenia wersji. Potwierdzone.
- **Tailwind v4 / React 19 w `premium-craft.md:7`** (explorer 2). Cytat dosłowny sprawdzony, zgadza się.
  To wersje stacku UI, nie narzędzi agenta.

---

## 7. Czego NIE dało się ustalić

1. **Czy chrome-devtools MCP jest faktycznym standardem organizacyjnym Sailes.** Twierdzenie Marcina
   nie ma potwierdzenia w repozytorium ani zaprzeczenia poza nim. Sprawdziłem repo (grep po
   `chrome-devtools`, 35 plików) — nie ma dokumentu polityki narzędziowej. Nie mam tu dostępu do
   Slacka, ustaleń zespołowych ani innych repo. **Nie zaokrąglam tego do „prawda" ani do „fałsz".**
2. **Czy `graphifyy` poniżej 0.9.23 faktycznie nie działa.** Repo mówi „validated against", nie
   „requires". Nie testowałem starszej wersji i nie mam changeloga graphifyy per-wersja.
3. **Wersje minimalne dla Node/Stryker/Inngest/Railway CLI/Playwright/pnpm.** Nie są zapisane nigdzie
   w repo (poza „Node Active LTS (24)" jako rekomendacją stacku). Nie da się ich odczytać z tego repo —
   to nie jest luka w raportach explorerów, tylko realny stan dokumentacji.
4. **Czy allow-listy `mcp__chrome-devtools__*` w `agents/*.md` są zgodne z aktualnym API serwera
   1.6.0.** Wymieniono tam m.in. `lighthouse_audit`, `performance_start_trace`, `fill_form`.
   Nie zweryfikowałem tych nazw wobec dokumentacji serwera — jeśli któraś nie istnieje, powtórzy się
   defekt klasy `handle_dialog` z 1.17.1. **To jest konkretny, wykonalny follow-up.**
5. **Czy w repo klienckim wygenerowanym przez bootstrap ktokolwiek faktycznie wybiera opcję A.**
   Wymaga danych z przebiegów w repo klienckich, do których nie mam dostępu.
6. **Czy pełna lista wersji npm `chrome-devtools-mcp` zawiera cokolwiek powyżej 1.6.0.** Odpowiedź
   z registry była częściowo ucięta; polegam na `dist-tags.latest` = 1.6.0, co wystarcza, by wykluczyć
   istnienie 1.14.x (byłoby wyższe niż `latest`). Pewność: wysoka, ale nie z pełnego listingu.

---

## 8. Luka w podziale pracy — do wiadomości lead-a

Trzy wycinki explorerów pokrywały **wyłącznie `skills/`** (explorer 1: `sailes-bootstrap/`,
explorer 2: `sailes-design/`, explorer 3: „everything under `skills/` except…"). **Poza pokryciem
zostały: `agents/`, `hooks/`, `codex-agents/`, `package.json`, `AGENTS.md`, `CHANGELOG.md`.**

Przeczytałem te obszary sam (mam narzędzia) i to stamtąd pochodzą trzy z ustaleń, których nie ma
w żadnym raporcie:

- allow-listy `mcp__chrome-devtools__*` w `agents/fe-dev.md:6`, `agents/designer.md:6`, `agents/qa.md:6`
  (§5.2) — najsilniejsze faktyczne sprzężenie z tym serwerem w całym repo;
- protokół nieobecności Stryker-a i historia defektu 1.17.1 (`CHANGELOG.md:78-93`, `sailes-test/SKILL.md:111-116`);
- rozstrzygnięcie fabrykacji 1.14.0/1.14.1 (`CHANGELOG.md:348-350`, `VERSION`, `AGENTS.md:4`).

Zgłaszam to jako lukę w podziale, nie jako prośbę o kolejnych explorerów.

---

## 9. Uwaga o pomiarach

**Nie mierzyłem** czasu wykonania, liczby tokenów ani liczby agentów w tym przebiegu i żadnych takich
liczb tu nie podaję. Wszystkie liczby w tym dokumencie to albo numery linii/wersji odczytane z plików,
albo wartości zwrócone przez rejestry npm/PyPI, każda z podaną lokalizacją. Liczby czasowe cytowane
z `skills/sailes-async/speedup-recipe.md` są cytatem z dokumentacji repo, a nie moim pomiarem.

**Wykonane weryfikacje zewnętrzne (2 szt.):**
- `https://registry.npmjs.org/chrome-devtools-mcp` → `dist-tags.latest` = 1.6.0; brak 1.14.x
- `https://pypi.org/pypi/graphifyy/json` → `info.version` = 0.9.27; release 0.9.23 obecny
