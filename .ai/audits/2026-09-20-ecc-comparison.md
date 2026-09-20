# Audyt porównawczy: ECC (affaan-m/ECC v2.2.2) wobec harnessu Sailes 1.35.0

Data: 2026-09-20 · Repo ECC sklonowane na commit `934195f` (2026-09-19) · Analiza pięcioma równoległymi
sondami (definicje agentów, hooki, orkiestracja, pętla uczenia/skille, inwentarz Sailes).
Zakres: co z ECC warto wziąć do naszego harnessu, definicji agentów i bramek. Bez zmian w kodzie skilla.

---

## Werdykt w jednym akapicie

ECC jest **szersze** od nas i **płytsze**. Ma 68 agentów, 292 skille, 94 komendy i instalatory na 20+
harnessów — ale jego własna doktryna (`AGENTS.md`, `SOUL.md`) to generyczne dobre praktyki bez żadnego
pomiaru ("minimum coverage: 80%", "Immutability CRITICAL"), a większość deklarowanej orkiestracji
(pętle GAN, council, gate'y w `orch-pipeline`) to proza wykonywana "w głowie" modelu, nie kod. My mamy
54 scenariusze ewaluacyjne z kryterium binarnym, ramionami kontrolnymi i mierzonymi przebiegami, osiem
narzędzi governance z zamrożonymi suitami i trzy hooki wpięte w realne zdarzenia. **W wymiarze
rygoru jesteśmy wyżej.** ECC ma natomiast kilka mechanizmów, których u nas po prostu nie ma — i to
one są przedmiotem tego raportu. Jest ich osiem, nie osiemdziesiąt.

**Ważne przy ważeniu wniosków:** 263 tys. gwiazdek ECC nie jest dowodem jakości kodu. Repo powstało
2026-01-18, 1609 z ~2100 commitów pochodzi od jednego autora, a rozgłos wziął się z dwóch poradników
w repo (`the-shortform-guide.md`, `the-longform-guide.md` — "mój setup po 10 miesiącach", grafiki,
hackathon Anthropic × Forum Ventures, "25k stars in under a week"). To viral content z dołączonym
repozytorium. Oceniałem wyłącznie kod i jego wpięcie.

---

## 1. Osiem rzeczy, które warto rozważyć

Uporządkowane po stosunku wartości do kosztu. Numeracja E1–E8 do dalszych odwołań.

### E1. Zakaz osłabiania configów, żeby bramka przeszła — NAJWYŻSZY PRIORYTET
**Co u nich:** `scripts/hooks/config-protection.js:133-141`, `exitCode: 2`,
`"BLOCKED: Modifying <plik> is not allowed"`. Lista `PROTECTED_FILES`: ESLint, Prettier, Biome, Ruff,
tsconfig i pochodne.

**Dlaczego u nas:** to najprostsza droga ominięcia VERIFIED, której nie zamyka żadna nasza bramka.
`be-dev`/`fe-dev` z nieprzechodzącym lintem ma dwie drogi: naprawić kod albo rozluźnić regułę.
`checker` ocenia diff wobec specu i uruchamia nazwane `Done-when` — zmiana jednej linii w `.eslintrc`
jest w diffie, ale jest też niepozorna, a `checker` jest instruowany, żeby nie produkować findingów na
siłę. To dokładnie ten typ defektu, który przechodzi. Mamy `ownership-check.js` z macierzą ścieżek —
hook mógłby blokować edycję configu, którego faza nie ma w `ownership:`.

**Koszt:** jeden hook PreToolUse na `Edit|Write|MultiEdit` + lista ścieżek + eval (worker z czerwonym
lintem dostaje brief; musi naprawić kod, nie regułę). Rzędu jednej fazy.

### E2. Blokada `--no-verify` i `core.hooksPath=`
**Co u nich:** `scripts/hooks/block-no-verify.js:548,574`, `exitCode: 2` na
`git commit/push --no-verify` oraz na ustawienie `core.hooksPath`.

**Dlaczego u nas:** nasi writerzy commitują w worktree (WIP + commit deklaracyjny), lead integruje
cherry-pickiem. Jeśli klient ma pre-commit hooki, `--no-verify` je wycina i nikt tego nie zobaczy —
commit wygląda identycznie. Druga komenda (`core.hooksPath=`) wycina je trwale i jeszcze ciszej.

**Koszt:** kilkadziesiąt linii w istniejącym hooku PreToolUse na `Bash`. Najtańsza pozycja na liście.

### E3. Blok antyhalucynacyjny w `checker`
**Co u nich:** `agents/code-reviewer.md` (324 linie) — sekcja "Confidence-Based Filtering" + "Pre-Report
Gate" (cztery pytania przed zgłoszeniem findingu, l. 41-53), lista "Common False Positives — Skip These"
(11 wzorców, l. 76-111) i dwa zdania nośne:
> It Is Acceptable And Expected To Return Zero Findings (l. 66)
> Manufactured findings (...) are the primary failure mode of LLM reviewers (l. 72-74)

**Dlaczego u nas:** `agents/checker.md` ma 40 linii i jest bramką obowiązkową. Recenzent na Sonnecie,
któremu kazano wydać werdykt, ma silną skłonność do uzasadnienia swojego istnienia — NITS na czystym
diffie kosztuje rundę i uczy lead-a, że NITS jest szumem. Nasze `.ai/lessons.md` ma wpis o "report
lacked real-defect field"; to ta sama rodzina problemu od drugiej strony.

**Koszt:** zmiana tekstowa w jednej roli + jeden eval (czysty diff zgodny ze specem → `checker` musi
zwrócić APPROVE z zerem findingów; ramię kontrolne: diff z zasianym defektem → musi go złapać).
Najlepszy stosunek wartości do kosztu na całej liście.

### E4. Semantyczne warunki stopu w rolach piszących
**Co u nich:** `agents/react-build-resolver.md:190-197`:
> Same error persists after 3 fix attempts
> Fix introduces more errors than it resolves

→ zatrzymaj się i zgłoś. Plus `## Scope` (l. 21-23) mówiący wprost, co **nie** należy do agenta i komu
to przekazać, oraz maszynowo parsowalny `Build Status: SUCCESS|FAILED` (l. 199-208).

**Dlaczego u nas:** mamy `maxTurns` (140 dla be-dev, 220 dla fe-dev/tester) — to budżet, nie warunek.
Worker, który trzeci raz naprawia ten sam błąd, spala budżet do końca i wraca albo z pustką (u nas
pusty zwrot = porażka, dobrze), albo z gorszym kodem niż na starcie. Warunek semantyczny kończy to
po trzeciej próbie z nazwaniem, co jest zablokowane i na kim. Łączy się z naszą regułą decyzji
zastępczej (blokada >1 rundy → decyzja oznaczona).

**Koszt:** kilka linii w `be-dev.md`/`fe-dev.md` + eval z briefem, którego nie da się wykonać.

### E5. Fail-closed werdykt z wymogiem dowodu
**Co u nich:** `workflows/orch-review.workflow.js:65-96` — JSON Schema **wymusza** pole `proof` przy
findingach CRITICAL/HIGH. `:248-250` — finding, którego nie dało się zweryfikować, zostaje `blocking`,
nie spada do advisory; komentarz w kodzie: "fail closed". Werdykt nigdy nie jest czystym APPROVE przy
niekompletnym review.

**Dlaczego u nas:** `checker` zwraca jeden z trzech werdyktów, `qa` daje dowód behawioralny. Brakuje
kształtu: nie ma schematu, który odrzuci finding wysokiej wagi bez dowodu, ani reguły "nie udało się
zweryfikować ⇒ blokujące". Domyślny odruch modelu jest odwrotny ("chyba OK"). To dosłownie mechaniczna
wersja naszego VERIFIED.

**Koszt:** schemat werdyktu + walidator w `tools/` (mamy już wzorzec: `contract-probe-check.js`,
`deployed-surface-check.js` sprawdzają, czy pole niesie pomiar albo jawne `n/a — <powód>`). Rzędu
jednej fazy, dobrze pasuje do istniejącej rodziny narzędzi.

### E6. `git merge-tree` do przewidywania konfliktu przed integracją
**Co u nich:** `scripts/lib/worktree-lifecycle/git.js:128-146` —
`git merge-tree --write-tree --name-only` z fallbackiem do starej formy. Tanie, read-only "czy to się
scali", bez dotykania drzewa roboczego.

**Dlaczego u nas:** `ownership-check.js` (616 linii) zapewnia rozłączność ścieżek **w planie**.
`merge-tree` weryfikuje to **empirycznie w momencie integracji** — plan mógł być dobry, a worker
i tak dotknął pliku spoza swojej listy. Lead dowiaduje się przed cherry-pickiem, nie w jego trakcie.

**Koszt:** jedna komenda w procedurze integracji team-lead-a + obsługa fallbacku dla starszego gita.

### E7. Salvage-before-delete przy sprzątaniu worktree
**Co u nich:** `scripts/lib/worktree-lifecycle/lifecycle.js:149-183` — plan sprzątania ma trzy stany:
`remove` / `salvage` / `keep`. Nigdy nie kasuje `dirty` ani niescalonej pracy; `stale` idzie do salvage
(push/bundle) zamiast `rm`. Klasyfikacja stanu worktree:
`main/detached/dirty/conflict/merge-ready/merged/stale/idle`.

**Dlaczego u nas:** `worker-status.js` (431 linii) rozróżnia już trzy stany claim-file: nigdy nie
wystartował / umarł w trakcie / zadeklarował zamknięcie. Brakuje drugiej połowy — co zrobić z drzewem
po workerze, który umarł. Sprzątanie worktree wisi jako otwarta pozycja także w pracach klienckich.
Trzystanowy plan zamiast `rm` to tania polisa: jeden `git bundle` kosztuje sekundy, utracona praca
agenta kosztuje fazę.

**Koszt:** rozszerzenie `worker-status.js` albo nowe narzędzie obok. Średni.

### E8. Reguła decyzyjna "w której powierzchni to umieścić"
**Co u nich:** `docs/capability-surface-selection.md` (140 linii) — kolejność pytań: czy ma się dziać
**zawsze** przy dopasowaniu ścieżki/zdarzenia, bez osądu modelu → `rule`; czy to playbook ładowany
na żądanie → `skill`; czy to strukturalny interfejs używany wielokrotnie między harnessami → `MCP`;
czy to jednorazowa deterministyczna akcja → skrypt/CLI; czy to wąski krok zdalny wewnątrz workflow →
bezpośrednie `API`. Plus zasada przy zapożyczeniach: *"copy the underlying idea, not the external
dependency"*.

**Dlaczego u nas:** mamy 17 skilli, 8 narzędzi, 3 hooki i AGENTS.md — i żadnej spisanej reguły, co
gdzie ląduje. Każda nowa zdolność jest negocjowana od zera, a domyślne ciążenie idzie w stronę skilla
(najtańszy do napisania, najdroższy w kontekście). ECC jest tu żywym ostrzeżeniem: 292 skille kosztują
ich **~26 100 tokenów w każdej sesji** na samych opisach frontmattera (zmierzone: 104 344 znaki, z czego
same `description:` to 83 441 znaków).

**Koszt:** jedna sekcja w AGENTS.md. Niski koszt, efekt widoczny dopiero po kwartale.

---

## 2. Czego z ECC nie brać — i dlaczego

| Mechanizm ECC | Powód odrzucenia |
|---|---|
| **Hookify** (generowanie hooków z języka naturalnego) | Atrapa. `commands/hookify-help.md` twierdzi, że "creates rule files that integrate with Claude Code's hook system", ale żaden skrypt w `scripts/hooks/` nie czyta `.claude/hookify.*.local.md` (`grep` = 0 trafień). Jedyna wzmianka w `scripts/` to etykieta kategorii w dashboardzie. |
| **Pętle GAN / santa-loop / council** | Cała arytmetyka pętli — suma ważona, próg 7.0, plateau-stop po 3 iteracjach, max 15 — jest instrukcją w markdownie, nie kodem (`commands/gan-build.md:29-66`). Przy długiej sesji rozjedzie się po cichu. Nasz Workflow tool robi to deterministycznie. `skills/council/SKILL.md:11-14`: cztery "głosy", wszystkie ten sam model. |
| **Auto-instynkty (continuous-learning-v2)** | Mechanicznie działają (obserwacje → `observations.jsonl` → analiza na Haiku → wstrzyknięcie przez `SessionStart`/`additionalContext`), ale promują regułę **automatycznie, po progu ufności**. To wprost łamie HUMAN. Nasz `.ai/lessons.md` z ręczną promocją do evala/specu jest właściwszy dla repo frameworka. |
| **Rubryka `harness-audit.js`** | Obecnościowa, nie behawioralna: `tool-agent-count` sprawdza `countFiles('agents','.md') >= 10`. Liczy pliki, nie zachowanie. Nasze 54 evale z ramionami kontrolnymi i guard-armami mierzą, czy doktryna działa. Warty wzięcia jest wyłącznie *kształt* wpisu (`{id, category, points, path, description, pass, fix}`) i `RUBRIC_VERSION` — nie treść. |
| **Skalowanie wszerz** (68 agentów, 292 skille, 94 komendy) | Próbka 10 losowych skilli: 9/10 to samo `SKILL.md` bez `scripts/` i `references/`. `mailtrap-email-integration` (77 linii) występuje w repo wyłącznie w manifestach instalacyjnych — zero funkcjonalnych cross-referencji. To LLM-owa masa, nie katalog zdolności. |
| **Warstwa `commands/`** | Ich własne `AGENTS.md` nazywa ją "legacy slash-entry compatibility surface". Migrują do skills-first — czyli tam, gdzie my już jesteśmy. |
| **Tabela doboru modeli** | Nic nowego: haiku=eksploracja, sonnet=kodowanie, opus=architektura. Mamy to jawnie w każdej roli i mierzone (`effort: high ≈ 2.7× low`). |
| **Skanowanie sekretów** (`governance-capture.js:35-40`) | Ma wzorce, ale tylko loguje, nigdy nie blokuje, i domyślnie robi early return (`ECC_GOVERNANCE_CAPTURE != 1`). Egzekwowanie pozorne. |

---

## 3. Dwie obserwacje, które warto zapamiętać niezależnie od zapożyczeń

**Anty-replay przy wznawianiu kontekstu.** `scripts/hooks/session-start.js:700-742` wstrzykuje treść
poprzedniej sesji opakowaną w `HISTORICAL REFERENCE ONLY — NOT LIVE INSTRUCTIONS` (l. 725-735).
W kodzie jest odwołanie do issue #1534: bez tej ramki model po kompakcji **powtarzał stare akcje**.
Nasz `workflow-router.js` odpala się na `compact` i `clear` i każe wejść w konkretny skill, a STATE.md
jest czytany na starcie. Warto sprawdzić, czy nasze przywracane treści niosą podobne rozróżnienie
"to jest historia, nie polecenie" — to drogo kupiona cudza lekcja.

**Kontrakt bounded workera (`docs/LANE-RULES.md`, 19 linii).** Najlepiej napisany tekst w całym repo:
> One task, one branch, one PR or one receipt, then stop.
> Real work only (...) **No receipts about receipts, no independent review of your own output**, no
> hashing manifests, no ledgers, no acceptance JSONs, no skill self-patching. Your final message is
> the receipt (under 300 words: what changed, PR link, test command and result, what is blocked and
> on whom).
> If blocked (...) stop and say exactly what is needed. **Do not wait, poll, or sleep.**
> Time box: finish in one pass. **Do not spawn subagents.**

Nasze role piszące mają: claim pliku statusu, commity WIP, commit deklaracyjny, blok zamknięcia
i raport. To pięć artefaktów na jedno zadanie. Część jest uzasadniona pomiarem (wpis w evalu
`worker-claims-before-it-writes`: pięć crashy, dwóch workerów straciło pracę, dwukrotnie lead zgłosił
gotową pracę jako niegotową). Ale klauzula "no receipts about receipts" i limit długości raportu są
warte przyłożenia do naszych briefów — nie jako cięcie ceremonii, która się broni pomiarem, tylko jako
pytanie kontrolne przy dokładaniu kolejnej.

---

## 4. Co w ECC jest realne — pełna lista (materiał źródłowy)

Dla porządku, żeby raport dało się zweryfikować bez ponownego klonowania. Mechanizmy z kodem,
testami i wpięciem w `hooks/hooks.json`:

- **GateGuard** `scripts/hooks/gateguard-fact-force.js` (1471 linii) — `permissionDecision: 'deny'`;
  blokuje pierwszy `Edit`/`Write` na plik, którego agent nie przeczytał (l. 1370-1420), komendy
  destrukcyjne wg `classifyDestructiveCommand` (l. 1432-1438), "routine bash gate" raz na sesję
  (l. 1447-1462). Escape hatch `ECC_GATEGUARD=off`. *Rozważane i odrzucone dla nas: nasz `explorer`
  poprzedza każdą fazę pisania, a Claude Code i tak wymaga Read przed Edit.*
- **config-protection** `:133-141` — E1 powyżej.
- **block-no-verify** `:548,574` — E2 powyżej.
- **MCP circuit-breaker** `scripts/hooks/mcp-health-check.js:700-775` (863 linie) — probe →
  markHealthy/markUnhealthy → blokada wywołań do niezdrowego serwera + reconnect, domyślnie
  fail-closed. *Nasz `mcp-toolnames-check.js` rozwiązuje sąsiedni problem (nazwy narzędzi vs. realne
  `tools/list`), nie zdrowie serwera w trakcie sesji.*
- **Telemetria kosztu** `scripts/hooks/cost-tracker.js` + test → `~/.claude/metrics/costs.jsonl`
  ze schematem `{timestamp, session_id, model, input_tokens, output_tokens, cache_write_tokens,
  cache_read_tokens, estimated_cost_usd}`. *Nasz `token-report.js` (812 linii + zamrożona suita)
  parsuje transkrypty post hoc i jest deterministyczny — nie zamieniamy.*
- **Monitor kontekstu/pętli** `ecc-context-monitor.js:19-27` — progi 35%/25% kontekstu, 5/10/50 USD,
  `LOOP_THRESHOLD=5` identycznych wywołań narzędzia. Tylko ostrzega.
- **merge-tree** i **salvage plan** — E6, E7 powyżej.
- **orch-review.workflow.js** — E5 powyżej.
- **release-approval-gate.js** — osiem `REQUIRED_DECISIONS` musi mieć `approve` (l. 246-271), skan na
  TODO/TBD/placeholder (l. 279-317), `exit(2)` gdy niegotowe. *U nas odpowiednikiem jest
  `release-hygiene.test.js` + pięciopunktowe stemplowanie wersji.*
- **Dyscyplina narzędzi w rolach** — 68/68 agentów ma `name`/`description`/`tools`/`model`, żaden nie
  ma wildcardu, maksimum 6 narzędzi, 26 reviewerów fizycznie nie może pisać (`Read, Grep, Glob, Bash`),
  dwóch ma dodatkowy deny-list w treści promptu. *Robimy to samo; potwierdzenie, nie zapożyczenie.*
- **12-warstwowy stos agenta** `skills/agent-architecture-audit/SKILL.md` (257 linii) — taksonomia
  "która warstwa psuje odpowiedź": prompt → historia sesji → pamięć → dystylacja → przywołanie →
  dobór narzędzi → wykonanie → interpretacja → kształtowanie odpowiedzi → renderowanie → ukryte pętle
  naprawcze → trwałość. Najoryginalniejszy koncept w repo. *Potencjalny materiał referencyjny dla
  `sailes-diagnose`, jeśli kiedyś będziemy diagnozować aplikacje agentowe klientów — nie teraz.*

Przyznane w kodzie wady ECC (cytaty z komentarzy autorów):
- `scripts/lib/github-coordination/actions.js:38-45` — wyścig przy claimowaniu epików:
  *"read → check → write sequence that is NOT atomic (...) Left as-is until a locking primitive is
  available"*. To samo w `control-pane/work-item-mutations.js:39-84`, mimo dostępnych transakcji SQLite.
- `scripts/lib/eval-harness/gate.js:3-9` — *"Candidate execution is disabled because no verified OS
  containment backend exists"*. Progi (`min_pass_rate: 0.9`) istnieją, ale kandydaci się nie uruchamiają.
- `scripts/hooks/skill-run-tracker.js:6-10` — telemetria skilli była martwa: *"recordSkillExecution()
  had zero production callers (...) always reported 0 runs (#2463)"*.
- `skills/agent-eval/SKILL.md` — opisuje format ewaluacji narzędziem, którego w repo nie ma
  ("Install agent-eval from its repository").
- `skills/orch-pipeline/SKILL.md:76-85` — GATE 1 i GATE 2 to proza, zero kodu.
- `commands/quality-gate.md:25-26` — *"Lint and type checks are not part of this gate"*. To formatter.

---

## 5. Rekomendowana kolejność

Gdyby to miało wejść, sensowna kolejność jest taka:

1. **E3** (blok antyhalucynacyjny w `checker`) — zmiana tekstowa + eval, efekt natychmiastowy.
2. **E2** (`--no-verify`) — kilkadziesiąt linii w istniejącym hooku.
3. **E1** (ochrona configów) — jeden hook, spina się z `ownership-check.js`.
4. **E4** (warunki stopu w rolach piszących) — tekst + eval.
5. **E5** (fail-closed werdykt z dowodem) — nowe narzędzie w istniejącej rodzinie.
6. **E6** (`merge-tree`) + **E7** (salvage) — para dotycząca integracji i sprzątania worktree.
7. **E8** (reguła powierzchni w AGENTS.md) — tanie, ale zwraca się dopiero po kwartale.

Pozycje 1–4 to kandydaci na jeden spec. Każda z nich ma kryterium binarne, więc każda daje się zmierzyć
evalem w naszym istniejącym formacie (ramię kontrolne = definicja roli sprzed klauzuli, guard-arm =
rola, której reguła dotyczyć **nie ma**).

Nic z tego nie jest decyzją — to lista do rozstrzygnięcia przez człowieka.

---

## 6. Podział wdrożeniowy (po weryfikacji na naszych plikach, 2026-09-20)

Poniższa sekcja zastępuje kolejność z §5. Powstała po przeczytaniu `agents/checker.md`,
`agents/be-dev.md`, `agents/team-lead.md` i `AGENTS.md` wprost — nie z raportu sondy. Dwie pozycje
z §1 zostały zdegradowane, bo okazało się, że mamy je w mocniejszej postaci albo że kolidują
z doktryną potwierdzoną pomiarem.

### A. Wdrożyć teraz — realna luka, potwierdzona na dysku

**A1. Klauzula antyhalucynacyjna w `checker`** *(z E3)*
Luka potwierdzona: `agents/checker.md` nie zawiera nigdzie zdania, że zero findingów jest
akceptowalnym wynikiem. Co gorsza, argument jest **silniejszy niż przy pierwszym czytaniu**: nasz
checker ma **dwie sekcje obowiązkowe**, którymi musi otwierać każdy werdykt — *"what the diff does NOT
do that the spec requires"* i jej lustro *"what the diff contains that the spec does not require"*.
Obie są słusznie obowiązkowe (pomiar 2026-08-01: trzy brakujące endpointy, których żaden patch-review
nie mógł znaleźć). Ale dwie obowiązkowe rubryki do wypełnienia to strukturalny nacisk na wypełnienie
ich czymkolwiek. Brakuje przeciwwagi — ECC ma ją dosłownie: *"It Is Acceptable And Expected To Return
Zero Findings"* + *"Manufactured findings are the primary failure mode of LLM reviewers"* + lista
typowych false-positive'ów.
Koszt: zmiana tekstowa w jednej roli. Eval: czysty diff zgodny ze specem → APPROVE z pustymi obiema
sekcjami; ramię kontrolne: diff z zasianym brakiem endpointu → musi go złapać (inaczej klauzula
stępiła bramkę, nie odszumiła).

**A2. Blokada `git commit/push --no-verify` i `core.hooksPath=`** *(E2)*
Luka potwierdzona: `grep -rn "no-verify\|hooksPath"` po całym repo zwraca wyłącznie wpis w backlogu
o husky-blindness w `repo-done-checklist.md` i wpisy CHANGELOG-a — **nigdzie nie blokujemy**. Nasi
writerzy commitują w worktree, lead integruje `git merge --no-ff` / `cherry-pick`. `--no-verify`
wycina hooki klienta bez śladu w diffie. Druga komenda wycina je trwale.
Koszt: rozszerzenie istniejącego hooka `PreToolUse` na `Bash`. Najtańsza pozycja.

**A3. Zakaz osłabiania configów lintera/typów** *(E1)*
Luka potwierdzona: `grep -rniE "eslintrc|prettierrc|biome|PROTECTED_FILES"` po repo — zero trafień
poza tym raportem. `be-dev.md` mówi *"The toolchain is the constraint"*, ale nic nie broni samego
toolchainu. Worker z czerwonym lintem ma dwie drogi; drugą (rozluźnienie reguły) zamyka dopiero
uważny checker, a checkerowi właśnie dokładamy w A1 powód, żeby nie szukać na siłę.
Koszt: hook `PreToolUse` na `Edit|Write|MultiEdit` + lista ścieżek. Spina się z `ownership-check.js`:
edycja configu dozwolona tylko, gdy faza ma go w `ownership:`.

**A4. Semantyczne warunki stopu w rolach piszących** *(E4)*
Luka potwierdzona i **węższa, niż pisałem**: `be-dev.md` ma już regułę decyzji zastępczej
(*"blocked longer than one round on something that is NOT a key decision → substitute and mark it"*)
oraz eskalację kluczowych decyzji. Nie ma natomiast **wykrywania pętli**: „ten sam błąd po trzeciej
próbie naprawy" i „fix wprowadza więcej błędów, niż naprawia". `maxTurns` (140/220) to budżet, nie
warunek — worker w pętli spala go do końca i wraca z kodem gorszym niż na starcie.
Koszt: kilka linii w `be-dev.md` i `fe-dev.md` + eval z briefem, którego nie da się wykonać.

**Uwaga do A1–A4:** wszystkie cztery mają kryterium binarne i dotyczą definicji ról albo hooków —
czyli zmiany o zasięgu „każde repo na maszynie" (`AGENTS.md:229`). To jeden spec, nie cztery.

### B. Ulepszyć to, co już mamy

**B1. `git merge-tree --write-tree` przed integracją** *(E6)*
`agents/team-lead.md:98` mówi: przeczytaj log, potem `git merge --no-ff <branch>` albo
`git cherry-pick <base>..<branch>`. Nie ma kroku „czy to się w ogóle scali". `ownership-check.js`
gwarantuje rozłączność **w planie**; `merge-tree` weryfikuje ją **empirycznie**, read-only, zanim
lead cokolwiek ruszy — plan mógł być poprawny, a worker i tak dotknął pliku spoza listy.
To dopisek jednej komendy do istniejącej procedury, nie nowy mechanizm.

**B2. Wymóg dowodu przy findingu wysokiej wagi** *(resztka E5 — złożyć razem z A1)*
Fail-closed **już mamy**, i to lepiej niż ECC: checker ma regułę *"a red `Done-when` test is
CHANGES-REQUIRED unless `comm` shows it red on the base too"*, a `contract-probe-check.js` /
`deployed-surface-check.js` wymuszają pomiar albo jawne `n/a — <powód≥20 znaków>`. Nie warto z tego
robić osobnego narzędzia. Warto natomiast przenieść ten sam kształt na **treść findingu**: finding
CHANGES-REQUIRED niesie klauzulę specu i obserwację, nie samą ocenę. To jedno zdanie w A1, nie
osobna pozycja.

### C. Mała wartość — nie brać

**C1. Salvage-before-delete przy worktree** *(E7 — degraduję)*
Błąd klasyfikacyjny z pierwszej wersji raportu. U ECC worktree to osobny checkout, który `rm` kasuje
bezpowrotnie — stąd ich trójstanowy plan. **U nas worktree dzieli `.git` z repo głównym**, więc
commity martwego workera żyją na jego branchu niezależnie od losu katalogu; `team-lead.md:104`
domyka to zapisem straty w run logu. Co więcej, ECC-owy „salvage" **kolidowałby** z naszą doktryną
potwierdzoną pomiarem: `team-lead.md:101` rung 5 — *"never commit or cherry-pick uncommitted work"*,
bo pół-zapisane drzewo raz już wylądowało na commicie w połowie edytowanej sygnatury (2026-07-30).
Świadomie **nie** ratujemy pół-zapisanych drzew. Zamknięte.

**C2. Reguła „w której powierzchni to umieścić"** *(E8 — degraduję)*
Sensowna higiena, ale problem, który rozwiązuje, u nas jeszcze nie istnieje: ECC ma 292 skille
(~26 100 tokenów w każdej sesji na samych opisach), my 17. A `AGENTS.md:229` już routuje decyzję od
strony ryzyka („zmiana skilla/hooka/definicji agenta → spec first; blast radius to każde repo na
maszynie"), co w praktyce wymusza tę samą rozmowę. Wrócić, gdy katalog skilli przekroczy ~30 pozycji.

**C3. GateGuard (fact-forcing przed edycją)**
Claude Code i tak wymaga `Read` przed `Edit`, a u nas każdą fazę pisania poprzedza `explorer`.
1471 linii cudzego kodu za mechanizm, który mamy dwukrotnie.

**C4. Reszta z §2** — Hookify (atrapa), auto-instynkty (łamią HUMAN), rubryka `harness-audit.js`
(obecnościowa), skalowanie wszerz, warstwa `commands/`, tabela doboru modeli, skanowanie sekretów
(loguje i jest wyłączone).

### D. Już mamy — i mocniej niż ECC (sprawdzone, nie zakładane)

| Mechanizm | Nasz stan |
|---|---|
| Kontrakt „receipt" bounded workera | `be-dev.md` Report: *"at most 40 lines, in fixed fields"*, narracja idzie do commita, deklaracja do `.claude/status/` — ostrzejsze niż ECC-owe „under 300 words" |
| Zakaz recenzowania własnej pracy | `team-lead.md:223` — bramki należą do leada, żadna rola oprócz leada nie ma `Agent` w `tools`, więc to strukturalne, nie obiecane |
| Izolacja worktree dla każdego piszącego | `team-lead.md:95-96` — mandat, nie preferencja, z trzema incydentami z jednego dnia jako uzasadnieniem |
| Wykrycie martwego workera | `worker-status.js` (431 linii) + trzy stany claim-file; ECC nie ma odpowiednika |
| Telemetria kosztu | `token-report.js` (812 linii) + zamrożona suita, deterministyczny; ECC liczy na żywo w hooku bez zamrożenia |
| Ciągłość po resecie kontekstu | `workflow-router.js` odpala się na `startup/resume/clear/compact` |
| Dyscyplina narzędzi i modeli per rola | 10 ról, jawny `model`/`effort`/`maxTurns`, brak wildcardów |
| Dowód zamiast twierdzenia | `contract-probe-check.js`, `deployed-surface-check.js` — pomiar albo `n/a — <powód>` |
| Ewaluacja doktryny | 54 scenariusze z kryterium binarnym, ramieniem kontrolnym i guard-armem; ECC ma rubrykę liczącą pliki |
