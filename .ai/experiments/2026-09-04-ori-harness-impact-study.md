# Ori (OpenRouter) — badanie wpływu na framework Sailes app-builder

Data: 2026-09-04 · Autor: sesja Claude Code (Opus 5) · Status: **recon zakończony, nic nie zbudowane**
Wersja Ori pod badaniem: `0.13.0+c7b5cda`, kanał **alpha** · Claude Code `2.1.259` · Codex CLI obecny
Koszt badania: ~$0.05 z konta OpenRouter (klucz `ori login`, łączne zużycie klucza $1.40; pozostało $194 kredytów)

> Zakres: co Ori realnie robi, co z tego działa na naszym pipeline, czego NIE daje, i co musiałby zawierać
> „lane ori" w tym repo. Żadnej rekomendacji implementacyjnej bez decyzji człowieka — patrz §7.

---

## 1. Czym Ori jest (zweryfikowane lokalnie, nie z bloga)

Trzy różne produkty pod jedną binarką:

| Warstwa | Komenda | Co to jest |
|---|---|---|
| **Launcher** | `ori claude`, `ori codex`, +10 innych | podmienia środowisko istniejącego CLI na OpenRoutera; argumenty lecą do binarki nietknięte |
| **Własny agent loop** | `ori code` | headless/TUI agent z własnymi narzędziami, sesjami, subagentami; domyślny model `anthropic/claude-fable-5.1` |
| **Silnik ewaluacji** | `ori eval` | `*.eval.ts` na `bun test`, realne wywołania modeli, judge, porównania modeli, raport md, historia, CI |

`ori harness list` (zmierzone na tej maszynie): launchable `claude`, `codex`; niezainstalowane `grok`,
`opencode`, `hermes`, `omp`, `prime-agent`, `kilo`, `cline`, `pi`, `muse`, `dsh`.

## 2. Co Ori robi z Claude Code (pomiar, nie dokumentacja)

`ori claude --model anthropic/claude-sonnet-5 -p "..."` — zrzut env z wnętrza sesji:

```
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_MODEL=anthropic/claude-sonnet-5
ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN  (klucz OpenRoutera)
CLAUDE_SECURESTORAGE_CONFIG_DIR=/home/olaf/.ori/claude-secure-storage
CLAUDE_EFFORT=high
CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 · DISABLE_TELEMETRY=1
```

Wnioski twarde:
- **Subskrypcja Claude nie jest używana.** Osobny secure-storage + własny token = ruch idzie na kredyty
  OpenRoutera, nie na plan. Każdy token pipeline'u jest płatny per-token.
- **`--reasoning-effort` mapuje się na `CLAUDE_EFFORT`** (globalnie na sesję). Czy nadpisuje `effort:`
  z frontmattera roli — **nierozstrzygnięte** (§6, R2).

## 3. Piny modeli w rolach — działają, i to cross-vendor

Test celowo skonstruowany tak, żeby MUSIAŁ się wywalić, jeśli pin jest honorowany
(`.claude/agents/*.md` z `model:`, dispatch przez Task):

| Subagent | `model:` we frontmatterze | Wynik |
|---|---|---|
| `probe-bogus` | `totally-not-a-real-model-xyz-9999` | **HTTP 400** — „is not a valid model ID … model sent to the API: totally-not-a-real-model-xyz-9999" |
| `probe-sonnet` | `claude-sonnet-5` (nasza forma) | OK |
| `probe-haiku` | `claude-haiku-4-5` (nasza forma) | OK |
| `probe-orslug` | `anthropic/claude-haiku-4-5` | OK |
| `probe-gemini` | `google/gemini-3.8-flash` | **OK** |

Co to znaczy:
1. **Nie ma cichego fallbacku** — bogus pin leci do API i wraca 400, więc pin z frontmattera JEST wysyłany.
2. **Nasze `agents/*.md` działają pod Ori bez zmiany jednej linii** — obie nasze formy (`claude-sonnet-5`,
   `claude-haiku-4-5`) przechodzą, mimo że katalog OpenRoutera publikuje `anthropic/claude-haiku-4.5`
   (kropka). Endpoint Anthropic-compat normalizuje nazwy API Anthropica.
3. **Per-rola multimodel wewnątrz JEDNEJ sesji Claude Code jest realny.** Subagent Claude Code przypięty
   do `google/gemini-3.8-flash` wykonał zadanie. To jest ta rzecz, której `codex-agents/README.md` opisuje
   dziś jako niemożliwą po stronie Codexa i której Claude Code sam z siebie nie ma (tylko rodzina Anthropic).

## 4. Własny loop Ori (`ori code`) — schemat narzędzi ⚠️ CZĘŚCIOWO OBALONY w §12.3

> Poniższa sekcja była odczytem schematu, nie wykonaniem. `harness` **nie działa**, `effort` jest
> martwe w bliźniaczej ścieżce, `model` per zadanie niesprawdzone. Działa `result_schema`.

Narzędzia (introspekcja z wnętrza runu): `bash, read, write, edit, glob, grep, ask_user, update_goal,
set_goal, task, spawn_agent, list_agents, read_agent, stop_agent, wait_agent`.

Schemat `task` (verbatim z runtime'u) przyjmuje:

```
{ description*, prompt*, model, effort, harness, cwd, display_name, result_schema }
```

- `model` + `effort` **per zadanie** — to, co u nas jest Claude-only i czego lane Codexa nie ma.
- `harness` — „Name a harness to run the child on another installed agent harness": lead na Ori może oddać
  zadanie **Claude Code albo Codexowi jako dziecku**. Delegacja przestaje być jednokierunkowa.
- `result_schema` (JSON Schema, walidowany, jeden retry) — strukturalny zwrot workera. Nasz incydent
  z 1.15.0 („worker wrócił pusty, lead nie wiedział") to dokładnie klasa problemu, którą to zamyka.
- `stop_agent` — mechanizm zwolnienia workera, którego reguła u nas istniała przed mechanizmem.

## 5. Kontekst repo pod Ori — tu jest pułapka

Zmierzone (`ori eval` drukuje context inventory przed każdym runem):

| Konfiguracja katalogu | Working directory dany agentowi |
|---|---|
| repo **bez** `features/` | `~/.ori/global` — **żaden plik repo nie dociera do agenta** |
| repo **z** `features/` | samo repo (inventory wylistował `ori.md`, `AGENTS.md`, `.claude/skills`) |

I test rozstrzygający, który plik naprawdę rządzi:

| Gdzie umieszczona reguła „każda odpowiedź zaczyna się od ANCHOR-OK" | Wynik evala |
|---|---|
| w `AGENTS.md` | **FAIL** — model odpowiedział „2 + 2 = 4" |
| w `ori.md` (body) | **PASS** — „ANCHOR-OK …" |

**Konsekwencja dla frameworku:** kręgosłup `SPEC → HUMAN → VERIFIED → GATED` żyje w `AGENTS.md`.
Pod `ori claude` / `ori codex` dalej rządzi (te harnessy czytają AGENTS.md/CLAUDE.md natywnie).
Pod własnym loopem Ori **nie rządzi** — persona budowana jest z `ori.md`. Lane ori bez zmirrorowania
spine'u do `ori.md` daje run, który wygląda jak nasz pipeline i nie jest nim.

Dodatkowo zaobserwowane: skille z katalogu startowego są **materializowane do workspace'u** jako symlinki
(`~/.ori/global/.agents/skills/probe-skill -> ../../.ori/snapshot/current/probe-skill`). Lokalnie, nie do
chmury — ale to znaczy, że skille repo klienta lądują w współdzielonym workspace na dysku.

## 6. Koszt — zmierzone jednostki, nie szacunki

Cennik OpenRoutera (katalog, 425 modeli, stan 2026-09-04, $/1M in→out):

| Model | in | out |
|---|---|---|
| `anthropic/claude-opus-5` | 5.00 | 25.00 |
| `anthropic/claude-fable-5.1` | 10.00 | 50.00 |
| `anthropic/claude-sonnet-5` | 2.00 | 10.00 |
| `openai/gpt-5.6-sol` | 2.00 | 10.00 |
| `google/gemini-3.8-flash` | 0.75 | 3.75 |
| `z-ai/glm-5.3-flash` | 0.07 | 0.25 |
| `deepseek/deepseek-v4-flash-0731` | 0.07 | 0.18 |

Zmierzone realne tury (jednoturowe, trywialny prompt): `ori eval` na sonnet-5 → **$0.0092 / 3 702 tok**;
`ori code` na sonnet-5 → **$0.0120 / 8 544 tok in**. Pełen przebieg pipeline'u Sailes (lead Opus +
7-10 workerów) **nie został zmierzony** — to jeden run do wykonania, nie liczba do zgadnięcia.

Dźwignia, która robi różnicę: `explorer` na `z-ai/glm-5.3-flash` to 0.07 zamiast ceny Haiku;
`checker` na innej rodzinie niż maker usuwa „kciuk na wadze", przed którym ostrzega dokumentacja judge'a
samego Ori („a judge from the same family … puts a thumb on the scale").

## 7. Nierozstrzygnięte (lista z pierwszej wersji — status aktualny w §13)

| # | Pytanie | Dlaczego nierozstrzygnięte | Jak zamknąć |
|---|---|---|---|
| R1 | Który model faktycznie obsługuje alias `claude-haiku-4-5` (katalog ma `claude-haiku-4.5`) | atrybucja per-generation wymaga management key; `/activity` zwraca 403 na kluczu `ori login` | management key → `/api/v1/activity`, albo pin pełnym slugiem i porównanie kosztu |
| R2 | Czy `CLAUDE_EFFORT` z Ori nadpisuje `effort:` z frontmattera roli | nie widać z zewnątrz sesji | run z rolą `effort: medium` pod `--reasoning-effort minimal` + odczyt reasoning tokens |
| R3 | Czy prompt caching Claude Code przeżywa ścieżkę OpenRoutera | to największa dźwignia kosztowa i nie mam danych per-request | jeden pomiar z management key (cache tokens w generation) |
| R4 | ZDR / retencja danych dla kodu klienta | ustawienie org-level konta OpenRouter, nieczytelne tym kluczem | ustawienia konta OpenRouter — **decyzja Olafa, nie techniczna** |
| R5 | Koszt pełnego przebiegu pipeline'u | nie zmierzony | jedna faza `sailes-implement` pod `ori claude`, odczyt sumy |

## 7b. R1-R5 — domknięte (pomiary z 2026-09-04, po pierwszej wersji raportu)

Metoda: `ori claude ... --output-format json` zwraca `modelUsage` per model (tokeny, cache, thinking,
canonicalModel, contextWindow) + `total_cost_usd`. Realny rachunek OpenRoutera liczony jako delta
`usage` klucza z `/api/v1/key` przed i po runie.

**R1 — który model obsługuje alias `claude-haiku-4-5`: NADAL OTWARTE** (patrz §13/5 — poniższy pomiar dotyczył formy katalogowej z kropką, nie naszej z myślnikami). `modelUsage` pokazuje osobne wiersze
`claude-haiku-4-5` i `anthropic/claude-haiku-4-5`, oba z `canonicalModel: claude-haiku-4-5`,
`contextWindow: 200000`, `maxOutputTokens: 32000` — czyli realnie Haiku 4.5, nie cichy fallback na model
sesji (sonnet-5 ma 1 000 000 / 64 000 w tym samym runie).

**R3 — prompt caching: DZIAŁA przez ścieżkę OpenRoutera.** W jednym runie model główny:
`cacheReadInputTokens: 120 187`, `cacheCreationInputTokens: 31 884`. Gdyby cache-read był liczony jako
zwykły input, sam ten składnik kosztowałby ~$0.24; realny rachunek całego runu wyniósł **$0.1335**,
więc odczyty z cache są rozliczane po stawce cache. **Subagenty mają cache = 0** — każdy dispatch to
świeży kontekst płacony w całości.

**R5 — koszt: metoda ustalona, jedna liczba zmierzona.** Run z trzema subagentami = **$0.1335 realnie**
przy `total_cost_usd` = $0.1240 raportowanym przez Claude Code (**rozjazd ~8%**, bo CC liczy z własnego
cennika list, nie z cennika OpenRoutera). Pełna faza `sailes-implement` nadal niezmierzona — ale teraz
mierzy się ją jedną deltą klucza, bez management key.

**R2 — per-rola `effort:` NIE PRZEŻYWA Ori. To jest najgorsza wiadomość z całego badania.**
Ten sam plik roli, ten sam prompt, mierzone `thinkingTokens` subagenta:

| | natywnie (bez Ori) | pod `ori claude` |
|---|---|---|
| rola `effort: max` | **5 950** | 397 (sesja `--reasoning-effort low`) |
| rola `effort: low/minimal` | **393** | 543 (sesja low) · 499 (sesja **max**) |

Natywnie pole działa (15× różnicy). Pod Ori subagent siedzi w przedziale ~400-550 niezależnie od roli
**i niezależnie od flagi sesji** — flaga sesji dotyka tylko agenta głównego (`think=0` przy `low`,
`think=551` przy `max`). Nasze role `effort: high` (be-dev, fe-dev, designer, checker, qa) pod Ori
realnie chodzą na niskim wysiłku. n=1 na komórkę, 5 komórek — kierunek jednoznaczny, dokładna wartość nie.

**R4 — retencja danych: to ustawienie konta, nie parametr runu.** OpenRouter daje (a) globalne ustawienie
prywatności konta (czy wolno routować do providerów trenujących na danych) i (b) filtr per-request
(`provider.data_collection`). Pod `ori claude` **nie mamy kontroli nad parametrami per-request** —
Claude Code ich nie wysyła — więc jedyną dźwignią jest ustawienie konta OpenRouter. Do sprawdzenia przez
Olafa przed jakimkolwiek użyciem na kodzie klienta; pin roli na `google/*`, `z-ai/*`, `deepseek/*` oznacza,
że kod klienta trafia do tego vendora.

## 7c. Powierzchnia Claude Code pod Ori — nietknięta (zmierzone)

Run `ori claude` w tym repo: widoczne **15+ skilli `sailes-*`** (plugin marketplace działa), **hook
SessionStart wstrzyknął** tekst „This repo runs the Sailes workflow", serwery MCP widoczne z `~/.claude`.
Ori podmienia wyłącznie warstwę modelu i poświadczeń — skille, hooki, plugin i MCP zostają nasze.

## 8. Bilans: co zyskujemy (+) i co ryzykujemy (−)

> Wersja po dwóch rundach krytyki i pomiarach §12. Wszystko, co poniżej, jest zmierzone albo jawnie
> oznaczone jako niezmierzone. Sekcje §11-§13 to dziennik dochodzenia — **wnioski są tutaj i w §9**.

**+ (zweryfikowane wykonaniem)**
- Pin `model:` w roli działa cross-vendor w jednej sesji Claude Code: nieistniejący model → HTTP 400,
  `google/gemini-3.8-flash` na subagencie → HTTP 200 z odpowiedzią. **Zastrzeżenie: „200" to nie „rola
  wykonana dobrze"** — jakości cudzego modelu w roli nikt nie zmierzył (§13, zarzut 9).
- Cała powierzchnia Claude Code żyje pod `ori claude`: 15+ skilli `sailes-*`, hook SessionStart,
  MCP, **guardian zablokował odczyt `.env`** (jeden krótki run, nie krzywa w długiej sesji).
- Prompt caching działa, także dla subagentów przy realnych kontekstach (204k cache-read na trzech
  explorerach). Wcześniejsze „cache=0" było artefaktem jednoturowych sond.
- `result_schema` w `ori code` egzekwuje twardo: naruszenie → retry → `subagent_structured_result_invalid`.
- Atrybucja **po fakcie** jest dostępna na zwykłym kluczu (`/api/v1/generation?id=`): provider, permaslug,
  tokeny rozumowania, cache, realny koszt.
- Ori nie aktualizuje się sam (`autoUpdateOnCodeLaunch: false`) — sesja nie zmieni się pod ręką.
- Jedna faktura zamiast kluczy per vendor; `--pilot` w `ori eval` wycenia przebieg przed zapłatą.

**− (zweryfikowane wykonaniem)**
- **`effort:` z definicji roli jest pod Ori martwe — dotyczy OŚMIU ról**: `be-dev`, `checker`, `designer`,
  `fe-dev`, `qa`, `researcher`, `team-lead`, `tester` mają `effort: high`; `docs-author` medium.
  W tym **obie role na Opusie 5** (`team-lead`, `researcher`), czyli orkiestrator planuje fan-out na
  ~400-550 tokenach myślenia. Natywnie to samo pole daje 5 950 vs 393. **Uwaga na zakres pomiaru:
  zmierzono krańce (`max` vs `low/minimal`), nie zmierzono `high` — czyli wartości, która stoi w plikach.**
- **Nie da się ustalić z góry, do jakiego providera trafi kod klienta.** Zmierzone: `anthropic/claude-sonnet-5`
  → Claude Platform on AWS, `anthropic/claude-haiku-4.5` → Amazon Bedrock, `google/gemini-3.8-flash` → Google.
  Wybór należy do routera per żądanie; wymuszenie listy (`provider.only/order`) to parametr żądania,
  którego Claude Code pod Ori nie wysyła. Audyt po fakcie ≠ kontrola przed żądaniem.
- `task(harness: 'claude')` **nie istnieje w praktyce** — „No harness named »claude« can run a subagent here".
  Delegacja Ori → Claude Code jako dziecko jest polem w schemacie, nie funkcją.
- Nasze piny (forma z myślnikami) działają tylko na ścieżce Anthropic-compat; `ori code` je odrzuca
  (`InvalidRequestError`). Lane na własnym loopie = przepisanie wszystkich pinów.
- Doktryna z `AGENTS.md` nie rządzi własnym loopem Ori (persona z `ori.md`) — n=1, trywialny prompt.
- Subskrypcja nie jest używana: dzisiejszy koszt marginalny 0 zł zamienia się w rachunek per token.
- Licznik kosztu Claude Code rozjeżdża się z rachunkiem OpenRoutera: −8% i +12% na dwóch pomiarach.
- Alpha 0.13.0, 3 breaking changes w 5 tygodni; wersja `ori` na maszynach zespołu jest **ręczna**, więc
  rozjazd wersji w zespole jest nieograniczony i niczym niemierzony.
- `main` tego repo = produkcja (`AGENTS.md`), a marketplace zespołu ma `autoUpdate` — udokumentowany lane
  trafia na każdą maszynę natychmiast, bez stagingu i bez opisanej ścieżki wycofania.

**− (niezmierzone, a decydujące — pełna lista w §13)**
- Zachowanie przy 429 / limicie przy fan-oucie 7-10 workerów; awaria providera w połowie fazy.
- Koszt pełnej fazy `implement` (człon dominujący = narastający cache-read leada × liczba tur, a lead
  stoi na Opusie $5/$25). **Wcześniejsza ekstrapolacja „$2-8" nie miała podstaw i jest wycofana.**
- Jakość taniego modelu w roli `explorer` (ta rola zwraca `file:line`; zmyślona ścieżka nie wraca jako błąd).
- Ścieżka rollbacku: co się dzieje z fazą stojącą w połowie, gdy trzeba wrócić na subskrypcję.
- Zachowanie hooków i uprawnień w wielogodzinnej sesji (mamy jeden punkt, nie krzywą).

## 9. Co z tego wynika — stan po dwóch krytykach

**Bramka nadrzędna stoi i jest twarda:** dopóki nie ma mechanizmu wymuszenia listy providerów **przed**
żądaniem, żaden wariant nie wchodzi na repo z kodem klienta (Proton, CallOS). Audyt po fakcie to nie
kontrola. To jest decyzja o danych klienta, czyli decyzja Olafa, nie techniczna.

**(a) Lane launcher** (`ori claude` / `ori codex`, piny cross-vendor) — jedyny wariant z dowodami
wykonania, ale kupujemy go razem z martwym `effort:` ośmiu ról. Uczciwa forma nie brzmi „wdrażamy piny
cross-vendor", tylko: **eksperyment na repo wewnętrznym, z jawnym zapisem, że gate'y chodzą na niższym
wysiłku niż deklarują ich pliki**.

**(b) Lane ori loop** — baza dowodowa jest dziś **gorsza** niż przed krytyką: z czterech pól schematu
`task` jedno działa (`result_schema`), jedno jest udowodnionym fałszem (`harness`), dwa niesprawdzone
(`model`, `effort`), a `effort` ma znany kontrprzykład w bliźniaczym produkcie. Do tego przepisanie pinów
(§12.2) i trzecia strona `parity.test.js` jako warunek wstępny. **Nie rekomenduję.**

**(c) Drugie ramię dla evali** — propozycja architektoniczna z **zerem wykonanych przypadków**, czyli ta
sama klasa błędu, którą §12.3 właśnie na sobie złapało. Klasyfikacja „11 z 36" jest **wycofana**: grep
trafiał w esej `Last run:`, nie w `Expected (binary)`, i klasyfikował `gate-refuses-to-close-a-spec-
without-docs-delta` (fixture + `archify compare` + `git status`) jako tekstowy. Zanim to wróci: ręczna
klasyfikacja po `Setup:` + `Expected (binary)`, plik po pliku, plus **jeden** scenariusz przepisany na
`*.eval.ts` i porównany werdyktem z ostatnim ręcznym przebiegiem.

**Co musiałoby być prawdą, żeby wejście dało się obronić** (lista zamknięta, z drugiej krytyki):
1. mechanizm wymuszenia providerów przed żądaniem, nie audyt po;
2. R2 zmierzone na `effort: high`, n≥3, i albo naprawione, albo skompensowane jawnym zapisem w rolach;
3. jeden pełny przebieg fazy `implement` z rozbiciem kosztu lead vs subagenci;
4. napisana i przetestowana ścieżka wycofania.

Do tego czasu jedyny obronialny wariant to **eksperyment na repo wewnętrznym bez kodu klienta** — i tak
należy tę pracę zaplanować.

## 10. Artefakty badania

- Fixture i wszystkie sondy: `/tmp/claude-1000/…/scratchpad/ori-lab/fixture/` (AGENTS.md, ori.md,
  `.claude/agents/probe-*.md`, `features/probe/feature.ts`, `probe.eval.ts`, `report.md`)
- Katalog modeli z cenami: `scratchpad/or-models.json` (425 modeli)
- Nic nie zostało zacommitowane ani wypchnięte. Repo bez zmian poza tym plikiem.

---

## 11. Krytyka adwersaryjna (2026-09-04) — co przeżyło, co upadło

Niezależny adwersarz z zadaniem OBALENIA przeczytał ten raport + `evals/`, `AGENTS.md`, `codex-agents/`,
frontmattery ról. 12 zarzutów. Poniżej werdykt po weryfikacji każdego z nich w repo.

### Zarzuty PRZYJĘTE — zmieniają wnioski

1. **§9(c) (migracja `evals/` na `*.eval.ts`) upada.** `evals/README.md` mówi wprost: stand-in
   „grades the *text*; it does not exercise the role's runtime", a „when the behaviour under test IS the
   runtime — does the pin apply, does the allow-list hold, can a gate fan out — a stand-in proves nothing".
   `ori eval` na bun jest **trwałym stand-inem**. Migracja zamieniłaby instrument mierzący runtime na
   instrument mierzący tekst i nazwała to automatyzacją. Do tego wywala `eval-status.js` + linię `Files:`
   (koszt 1.16.0) i łamie własność `npm test` z AGENTS.md („no deps, deterministic"). **Zweryfikowane w repo.**
2. **Payoff „control-arm dla prompt-anchor" nie istnieje — to już zrobione.**
   `evals/anchor-holds-the-line-deep-in-session.md`, `Last run: 2026-07-26 · FAIL` — „CONTROL ARM ALONE,
   at real distance — and it HELD… It means the hook should not ship". Wiersz w backlogu jest nieaktualny
   względem pliku evala. Cytowałem backlog zamiast przeczytać eval. **Zweryfikowane w repo.**
3. **§3 wniosek „role działają bez zmiany jednej linii" jest za mocny.** Frontmatter to `model:` +
   `effort:` + `tools:`. Przeszło `model:`. `effort:` jest martwe (§7b/R2), a `tools:` z allow-listami
   `mcp__chrome-devtools__*` (qa, fe-dev, designer) nie było testowane. Poprawna forma: **„pole `model:`
   przechodzi"**.
4. **R4 to bramka blokująca, nie wiersz w tabeli.** Każdy token pipeline'u to kod repo klienta idący
   przez brokera, który routuje do nieznanego upstreamu. Dopóki nie ma zrzutu ustawień prywatności konta
   i wymuszonej listy providerów — **żaden wariant nie wchodzi na repo klienckie**.
5. **Ekonomia liczona bez mianownika.** Dziś marginalny koszt runu = 0 (subskrypcja). Po Ori każdy token
   jest płatny, więc „explorer na modelu za $0.07" to oszczędność **na wydatku wykreowanym przez samą
   zmianę**. Netto dodatnie tylko, jeśli subskrypcja znika — czego nie policzyłem.
6. **§4 to odczyt schematu, zero wykonania.** `task(harness:…)`, `result_schema`, `effort` per zadanie —
   nic z tego nie zostało odpalone. To ta sama klasa błędu (config ≠ behavior), którą sam mierzę gdzie
   indziej; a `effort` w tym schemacie jest podejrzany szczególnie, bo w wersji dla Claude Code jest martwy.
7. **Lane (b) bez trzeciej strony `parity.test.js` powtarza awarię, która już wystąpiła** — tabela ról
   stała w trzech miejscach i **dwie kopie zgubiły `tester`**. Rozszerzenie parity musi być warunkiem
   wstępnym, nie przypisem.
8. **`autoUpdate: true` w marketplace = brak stagingu.** Udokumentowany lane trafia natychmiast na każdą
   maszynę zespołu, bez rollbacku — na alfie łamiącej API co ~2 tygodnie.
9. **`explorer` na tanim modelu nie ma dowodu jakościowego.** To rola od recon z `file:line`, gdzie
   halucynacja ścieżki kosztuje więcej niż zaoszczędzony grosz.

### Zarzuty CZĘŚCIOWO ODPARTE — z pomiarem

10. **„Reasoning może w ogóle nie przechodzić przez proxy / nie być raportowany".** Odparte dla agenta
    głównego: `--reasoning-effort low` → `thinkingTokens=0`, `max` → `551`, ten sam prompt. Rozumowanie
    przechodzi i jest raportowane. Zostaje: subagent nie reaguje ani na rolę, ani na flagę sesji
    (397 / 499 / 543 w trzech komórkach). n=1 na komórkę — kierunek trzymam, dokładną wartość nie.
11. **„Pod `ori claude` nie sprawdzono warstwy wymuszania".** Sprawdzone po krytyce: hook SessionStart
    wstrzyknął kontekst repo, 15+ skilli `sailes-*` widocznych, MCP widoczne, a **guardian zablokował
    odczyt `.env`** (`permission_denials` w JSON runu). Warstwa wymuszania Claude Code żyje pod Ori.
    Zarzut zostaje w mocy **dla `ori code`** — tam nie ma hooków ani systemu uprawnień Claude Code.
12. **R1 wraca do otwartych.** `canonicalModel` / `contextWindow` to pola raportowane przez klienta z
    jego własnej tablicy nazw — echo stringa, nie atrybucja providera. HTTP 400 na bogusie dowodzi tylko,
    że string leci do API. Do zamknięcia: management key → `/api/v1/activity`, albo dyskryminator zdolności.

### Co z tego wynika dla §9

- **(c) evals → `*.eval.ts`: SKREŚLONE** w formie, w jakiej to zaproponowałem. Zostaje ewentualnie wąski
  podzbiór scenariuszy czysto tekstowych — do policzenia, ile ich jest z 29 (adwersarz obstawia < 8).
- **(a) launcher: zostaje**, ale z twardą bramką R4 i z odjęciem `effort:` po stronie zysku.
- **(b) lane ori: zostaje jako najdroższy**, z warunkiem wstępnym `parity.test.js` × 3 strony.

---

## 12. Runda 2 pomiarów (po krytyce) — cztery korekty, w tym dwie moje własne

**12.1 Atrybucja providera JEST dostępna na zwykłym kluczu — ale to audyt PO fakcie, nie kontrola PRZED (patrz §12.6).**
`GET /api/v1/generation?id=<gen-id>` działa na kluczu z `ori login` (management key niepotrzebny;
zarzut adwersarza w tym punkcie był błędny). Zwraca `model_permaslug`, `provider_name`,
`native_tokens_reasoning`, `native_tokens_cached`, realny `usage` w USD. Zmierzone:

| Pin | `model_permaslug` | `provider_name` |
|---|---|---|
| `anthropic/claude-sonnet-5` | `anthropic/claude-sonnet-5-20260630` | **Claude Platform on AWS** |
| `anthropic/claude-haiku-4.5` | (nie zwrócony) | **Amazon Bedrock** |

Czyli: da się **po fakcie** sprawdzić, kto serwował. **Bramka R4 stoi dalej** — §12.6 pokazuje, że
wybór providera należy do routera per żądanie i nie mamy nad nim kontroli ex ante. „Wiemy, gdzie
poszło" nie jest odpowiedzią na „ustaliliśmy, gdzie wolno pójść".

**12.2 Asymetria aliasów — nasze pliki ról działają TYLKO w lane launcher.**
`claude-haiku-4-5` (nasza forma, z myślnikami):
- ścieżka Anthropic-compat (`ori claude`, piny subagentów) → **działa**;
- ścieżka chat-completions (`ori code`) → **odrzucone**, `InvalidRequestError`.

Lane oparty na własnym loopie Ori wymagałby przepisania wszystkich pinów na formę katalogową
(`anthropic/claude-haiku-4.5`) — kolejny koszt lane'u (b), którego §9 nie liczyło.

**12.3 `task(harness: 'claude')` NIE DZIAŁA — §4 był odczytem schematu, adwersarz miał rację.**
Odpalone naprawdę: `Tool "task" failed: No harness named "claude" can run a subagent here.
Installed harnesses: ori. Omit the harness parameter to use the native loop.` Delegacja
Ori → Claude Code jako dziecko **nie istnieje w praktyce**, mimo pola w schemacie. Dokładnie
config ≠ behavior, na tym samym produkcie, w którym `effort` też jest polem bez efektu.

Za to `result_schema` **egzekwuje twardo**: dziecko zwracające wartość łamiącą `minLength` dostało
retry, a po nim run padł na `subagent_structured_result_invalid`. Zastrzeżenie adwersarza („worker
zwracający `{}` przejdzie") jest prawdziwe tylko dla schematu, który tego nie zabrania — gwarancja
jest dokładnie tak mocna, jak schemat.

**12.4 Moja korekta: subagenty JEDNAK korzystają z cache — wcześniejsze „cache=0" to artefakt sond.**
Realny fan-out (trzy `sailes-app-builder:explorer` na prawdziwym recon w tym repo):

```
claude-haiku-4-5           in=142    out=7715  cacheRead=204733  cacheCreate=51279
anthropic/claude-sonnet-5  in=14     out=2493  cacheRead=241578  cacheCreate=45920
subagent_stats: spawned 3, completed 3, failed 0, max_depth 1
```

**Realny koszt tego fan-outu: $0.2781** (delta klucza). Claude Code oszacował $0.3114 — **przeszacował
o 12%**, podczas gdy w poprzednim runie **niedoszacował o 8%**. Wniosek do §7b/R5: licznik CC pod Ori
ma rozrzut ±10% w obie strony, nadaje się do orientacji, nie do faktury.

Ekonomia z jedną kotwicą: skromny recon 3 workerów = **$0.28**, przy dzisiejszym koszcie marginalnym
**0 zł** (subskrypcja). **Ekstrapolacja na pełną fazę: WYCOFANA** (§13/4). Kotwica nie zawiera członu dominującego —
narastającego cache-read agenta głównego × liczba tur, przy leadzie na Opusie $5/$25 — więc każda
liczba wyprowadzona z niej byłaby zgadywaniem.

**12.5 `evals/` — klasyfikacja ⚠️ WYCOFANA w §13/6 (grep trafiał w esej `Last run:`, nie w kryterium).**
Scenariuszy jest **36** (nie 29 — moja liczba była z nieaktualnego wpisu backlogu). Po markerach
runtime'owych: **11 ma zero markerów**. Przeczytane trzy z nich (`spec-phases-carry-done-when`,
`lead-escalates-a-model-on-judgment-not-volume`, `tester-cannot-lower-its-own-risk-tier`) mają kształt
„daj świeżemu subagentowi definicję roli + brief, sprawdź obecność X w odpowiedzi" — czyli **dokładnie
to, co `agent.run({systemPrompt, prompt})` + matcher/judge robi natywnie**. Co więcej, część scenariuszy
z markerami JUŻ dziś jest odpalana jako stand-in tekstowy (`lead-escalates…` ma to wpisane w `Last run:`
wprost: „stand-in vehicle … grades the TEXT, not runtime pins").

Poprawny wniosek — węższy niż mój pierwotny i szerszy niż zarzut adwersarza: **`*.eval.ts` to DRUGIE
RAMIĘ dla scenariuszy, które i tak są dziś gradowane tekstem, nigdy zamiennik pliku `.md` ani
scenariuszy runtime'owych.** Plik `.md` zostaje jako rejestr (`Last run:` to esej, w którym powstają
zmiany doktryny — tego boolean nie zastąpi), `eval-status.js` i `Files:` zostają, `npm test` zostaje
deterministyczny i bez zależności; ramię płatne odpala się osobną komendą, jak `npm run test:browser`.

**12.6 Tabela providerów (n=5 generacji, po jednej-dwie na model) — i dlaczego to zaostrza R4.**

| Pin w roli | Kto realnie serwował |
|---|---|
| `anthropic/claude-sonnet-5` | Claude Platform on AWS |
| `anthropic/claude-haiku-4.5` | Amazon Bedrock (2×, spójnie) |
| `google/gemini-3.8-flash` | Google |
| `z-ai/glm-5.3-flash` | lookup nie zdążył się zaindeksować |

Pin `anthropic/*` **nie oznacza, że serwuje Anthropic** — serwuje AWS/Bedrock, a wybór należy do routera
OpenRoutera per żądanie. Wymuszenie providera (`provider.order` / `only`) jest parametrem żądania,
którego Claude Code pod `ori claude` nie wysyła. Czyli: ścieżkę danych da się **zaudytować po fakcie**
(§12.1), ale **nie da się jej zadeklarować z góry** w lane launcher. Dla repo klienckiego to różnica
między „wiemy, gdzie poszło" a „ustaliliśmy, gdzie wolno pójść".

**12.7 Ryzyko alfy — zmierzone, mniejsze niż zakładałem.** `~/.ori/update-check.json`:
`autoUpdateOnCodeLaunch: false`, `channel: alpha`. Ori **nie aktualizuje się sam** — wersja stoi do
ręcznego `ori update`. Sesja nie zmieni się pod ręką; ryzyko przenosi się na moment świadomej aktualizacji.
Osobno: na tej maszynie marketplace `sailes` jest źródłem **katalogowym** (`source: directory` → lokalne
repo), więc `autoUpdate` z README (metoda A, github) dotyczy maszyn zespołu, nie tej.

**12.8 Kształt „drugiego ramienia" dla evali — precedens już jest w repo.** `npm test` to osiem
deterministycznych skryptów node, zero zależności; `npm run test:browser` to osobna, niedeterministyczna
komenda, wyprowadzona z domyślnej bramy dokładnie z tego powodu (1.16.0). Płatne ramię modelowe idzie
tą samą drogą — osobny skrypt, nigdy w `npm test`.

---

## 13. Krytyka adwersaryjna, runda 2 — werdykt

Drugi niezależny adwersarz, z zadaniem obalenia **także moich poprawek**. 10 zarzutów. Werdykt końcowy
adwersarza: *„nie — w obecnym stanie dowodów nie da się obronić przed osobą odpowiedzialną za dane
klienta ani lane launcher, ani lane ori"*. Poniżej co przyjęte i co z tym zrobiono.

**Przyjęte i naprawione w tym pliku:**
1. **§12.1 i §12.6 dawały przeciwne wnioski o ścieżce danych**, a uspokajający stał wyżej i miał nagłówek
   „R1 zamknięte". Poprawione: §12.1 mówi teraz wprost, że to audyt po fakcie, bramka R4 stoi.
2. **§8 i §9 — jedyne sekcje, które czyta decydent — były o dwie rundy nieaktualne** (niosły wycofane
   „cache=0", obalony `harness`, za mocne „bez zmiany jednej linii"). Przepisane od zera na stan bieżący;
   §11-§13 zdegradowane do dziennika.
3. **R2 dotyczy ośmiu ról, nie pięciu** — sprawdzone w `agents/*.md`: `effort: high` mają be-dev, checker,
   designer, fe-dev, qa, **researcher**, **team-lead**, tester; docs-author medium; explorer nie ma pola.
   Dwie pominięte role stoją na Opusie 5. Dodatkowo: **żadna komórka pomiaru nie dotyczyła `effort: high`**,
   czyli wartości używanej produkcyjnie — zmierzono krańce. Zapisane jako ograniczenie pomiaru.
4. **Ekstrapolacja „$2-8 na fazę" wycofana.** Kotwica $0.2781 to kilkuminutowa sesja z trzema recon-workerami;
   człon dominujący w 8-godzinnej fazie to narastający cache-read leada × liczba tur przy $5/$25, i w
   kotwicy go nie ma. Zdanie o rozrzucie licznika ±10% też jest z n=2 ze zmianą znaku — bez mechanizmu.
5. **R1 wraca do otwartych.** §12.1 zmierzyło `anthropic/claude-haiku-4.5` (forma katalogowa), a R1 pytał
   o `claude-haiku-4-5` (forma z myślnikami, ta z `agents/explorer.md`). Narzędzie właściwe, pytanie nie to.
   Stawka jest niska (naprawa = pisać formę katalogową), ale zamknięte to nie jest.
6. **Klasyfikacja evali („11 z 36") wycofana.** Markery leksykalne siedzą w retrospektywnym `Last run:`,
   nie w `Expected (binary)` — więc grep klasyfikował narrację poprzedniego przebiegu. Kontrprzykład
   adwersarza: `gate-refuses-to-close-a-spec-without-docs-delta` daje zero trafień, a jego kryterium wymaga
   fixture'owego repo, `archify compare`, porównania bajtowego JSON-ów i `git status`. Klasyfikator się
   odwraca, nie szumi. Do tego mój własny tekst wymieniał `lead-escalates…` po obu stronach klasyfikacji.
7. **„Drugie ramię" dla evali to propozycja z zerem wykonanych przypadków.** `answer-shape-hands-over-the-
   decision` ma w nagłówku „Model: **Opus** … a Sonnet stand-in would grade the wrong model" i wymaga
   dystansu **wytworzonego, nie streszczonego**; `spec-phases-carry-done-when` ma mianownik matchera
   wybierany przez ocenianego agenta (rozbił brief na 3 fazy zamiast 2, słusznie). Warunek wejścia:
   jeden scenariusz przepisany i porównany werdyktem z ręcznym przebiegiem.
8. **`config ≠ behavior` niezastosowane do reszty §4** — z czterech pól `task` jedno działa, jedno jest
   fałszem, dwa niesprawdzone. Nagłówek §4 oznaczony jako częściowo obalony.
9. **Teza cross-vendor stoi na braku 400, nie na jakości.** „HTTP 200" ≠ „rola wykonana dobrze", a
   `explorer` zwraca `file:line` — zmyślona ścieżka nie wraca jako błąd. Pozycja „tanie role" wypada
   z bilansu do czasu porównania na recon o znanym ground truth.
10. **Warstwa operacyjna nietknięta:** 429 przy fan-oucie, awaria providera w połowie fazy, wyczerpanie
    kredytów, rollback, hooki w długiej sesji, rozjazd wersji `ori` w zespole. Mojego §12.7 („na tej
    maszynie marketplace jest katalogowy") adwersarz słusznie odwrócił: **maszyny zespołu są celem
    wdrożenia**, więc to potwierdzenie braku stagingu, nie odpowiedź na nie.

**Czego świadomie nie zmierzyłem i dlaczego:** 429 i zachowanie przy awarii providera wymagałyby ruchu
obciążeniowego do cudzego serwisu — w tym warsztacie obowiązuje reguła „powyżej ~50 żądań pytasz najpierw".
Do zaplanowania z Olafem, nie do zrobienia po cichu.
