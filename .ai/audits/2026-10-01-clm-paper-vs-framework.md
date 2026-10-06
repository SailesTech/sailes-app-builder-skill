# Audyt: „Context Language Models" (arXiv 2609.37725) wobec harnessu Sailes 1.38.1

Data: 2026-10-01 · Praca: Shao et al., UW / Meta Superintelligence Labs / MIT, złożona 2026-09-29 (v1, bez
recenzji) · Kod: github.com/facebookresearch/context-language-models · Źródło: pełny PDF (27 stron,
wyciągnięty `pdftotext`; wykresy nieczytelne, liczby brane z tekstu i podpisów) + mapa naszych mechanizmów
pamięci z jednej sondy po repo (file:line poniżej).
Zakres: co z tej pracy daje wartość w naszym frameworku, co tylko potwierdza to, co już mamy, czego nie
bierzemy i dlaczego. Bez zmian w kodzie skilla — każda propozycja poniżej to zmiana skilla/agenta, więc
najpierw spec (blast radius: każde repo na maszynie).

---

## Werdykt w jednym akapicie

Praca mówi jedno: **model, który sam decyduje, co zostaje w jego kontekście, wygrywa z automatycznym
streszczaniem** — dokładniej, bije kompakcję w stylu Codex (najmocniejszy baseline) o 11,4 % na BrowseComp-Plus
przy 21,5 % mniej FLOPs i o 65 % na 24-godzinnym roju sześciu agentów. My **nie możemy** zrobić tego, co oni
(Claude Code nie wystawia żywego kontekstu jako pliku do edycji), ale **już robimy odpowiednik ich trzech
najlepiej działających instrukcji** — kompakcja na granicy podzadania, backup na dysk przed kompakcją, i
własnoręcznie pisany stan zamiast automatycznego streszczenia — jako `/clear` + `STATE.md` + run log. Wartość
dla nas jest w czterech miejscach, gdzie ich model zrobił coś, czego nasza doktryna nie każe: (A) zapisuje
**ślepe uliczki i niesprawdzone pomysły** jako osobną kategorię stanu, (E) orkiestrator trzyma **jedną tablicę**
7 linijek zamiast N plików, (F) instrukcje są **ulepszane pętlą propozycja→pomiar**, nie ręką, i (G) edytowalna
pamięć to **nowy kanał wstrzyknięć**. Reszta pracy (RL, serving, ContextBench) nas nie dotyczy.

---

## 1. Co praca twierdzi — tylko to, co ma dla nas znaczenie

| # | Twierdzenie | Dowód w pracy | Pewność |
|---|---|---|---|
| T1 | Streszczanie przez harness gubi lub zmyśla fakty; edycja w miejscu nie | ContextBench §3: Summary zawodzi na Needle Retention i Sudoku; 4 syntetyczne zadania izolujące zarządzanie kontekstem od rozumowania | wysoka — zadania deterministyczne, GPT-5.4, 32K |
| T2 | Jedno zdanie w prompcie zmienia politykę kompakcji | §5.2, Fig. 7: „compress at boundaries of subtasks" → kompakcja w ≤2 turach od granicy 0,88 vs 0,40 bez instrukcji; „back up before you compact" → 0,68 edycji z pełnym backupem vs 0,00 | wysoka — Claude 4.6 Sonnet, 189 sesji, BCa CI |
| T3 | Dobrze działający stan to: fakty + plan + **ślepe uliczki** + **niesprawdzone pomysły w kolejności** | Fig. 3a/e — przykłady, nie pomiar: `Dead ends: simple grid(0.822), hexagonal(0.9977)`, `UNTRIED IDEAS (priority order): 1. … 2. …` | średnia — jakościowe, z udanych przebiegów |
| T4 | Orkiestrator 21 subagentów trzymał **jedną tablicę 6–8K tokenów**, 163 edycje w miejscu: `Budget: 7/100 used. All 5 slots BUSY … Dead ends … Next:` | Fig. 3a, §4.1 | średnia — jeden przebieg |
| T5 | Instrukcje da się **ewoluować pętlą**: proposer czyta ≥10 przebiegów (w tym 5 par sukces/porażka na tej samej instancji), pisze ≥4 pełne przepisania **z przewidywanym efektem**, dev split wybiera, Pareto (trafność × koszt), linia umiera po 5 propozycjach bez poprawy | App. E; KV Store held-out 38,3 → 74,2 %; Log Triage dev 0 → 100 % | wysoka dla syntetyki; **brak dowodu na zadania realne** |
| T6 | Modele **nie umieją ocenić, ile kontekstu zużyły**; Claude 4.6 Sonnet zaniża; podpowiedź z licznikiem tokenów pomaga | App. G, Fig. 22; CLM dostawał przypomnienie 2048 tokenów przed limitem | wysoka |
| T7 | Zysk rośnie z siłą modelu: 9B edytuje kontekst 1,4×/zadanie i w połowie zadań wcale; 27B 2,6× | App. F | wysoka |
| T8 | Edytowalny kontekst = kanał, przez który wstrzyknięcie lub własna instrukcja modelu **przeżywa między turami**; cytują raport OpenAI o samo-wstrzyknięciach w podsumowaniach kompakcji | §6 Discussion | wysoka co do ryzyka, brak pomiaru |
| T9 | Subagenci nie pomagają na jednym repo (44,2 vs 44,6), pomagają przy 128K i wielu repo | §5.1.2, App. F | średnia |

Zastrzeżenia do przeniesienia: budżety 32K (my: lead do 400K `autoCompactWindow`, mierzone 627–933K), modele
Qwen/GPT/Claude 4.6 Sonnet (my: Opus lead, Sonnet workerzy, Haiku explorer), zadania benchmarkowe. **Praca nie
testuje twardego resetu z dyskiem** (naszego `/clear` + `STATE.md`) — tylko streszczenie vs edycja w miejscu.

---

## 2. Mapa: twierdzenie → co mamy → luka

| Twierdzenie | Co mamy (file:line) | Luka |
|---|---|---|
| T1 streszczanie gubi | `settings-template.json:61` `autoCompactWindow: 400000` jako „safety fuse" — auto-kompakcję traktujemy jako ostatnią deskę; `session-handoff.md:23-25` „the resume path is never 'trust the model's own recall'" | **brak** — wybór potwierdzony |
| T2 kompakcja na granicy podzadania | `session-handoff.md:14` „A closed phase ends the lead's turn — the next phase does not continue on the same context"; `workflow-orchestration.md:183-189` Q6 odrzuciło próg turowy na rzecz „po każdym workflow" | **brak** — robimy dokładnie to, co ich najlepsza instrukcja, i twardziej (reset zamiast przepisania) |
| T2 backup przed kompakcją | `agents-md-template.md:146` „Update the snapshot together with the history, or update neither"; `.ai/archive/` rotacja; `session-start.sh:34-45` | **brak** |
| T3 ślepe uliczki + niesprawdzone | `agents-md-template.md:144` Open failures = „unresolved problems + best diagnosis so far"; `:147` „everything unproven stays in Open failures"; run log `sailes-implement/SKILL.md:23` „what's left"; `be-dev.md:57` po 3 naprawach „report which three attempts you made"; **UNTESTED** istnieje tylko w `incident-template.md:70-72` (sailes-diagnose) | **jest** — żadna reguła handoffu nie każe zapisać *czego nie próbowano* ani *co już odpadło*; „what's left" to zadania, nie hipotezy. Następna sesja może przejść tę samą ślepą uliczkę |
| T4 jedna tablica | `.claude/status/<worker-id>.md` per worker (`team-lead.md:102`); run log jedna linia na workera przy akceptacji (`:104`); `worker-status.js --sweep` jako agregat do czytania | **jest, częściowa** — tablicą leada jest *jego własny kontekst*, i to on urósł do 627–933K. Agregat istnieje, ale po stronie odczytu, nie jako stan pisany w miejscu |
| T5 pętla ewolucji | `evals/README.md:36-41` eval = świeży subagent + binarna ocena; `evals/harness/README.md:60-86` A/B dwóch ramion, „the dispatch half is inherently manual", „One run is a sample"; `sailes-eval-runner/SKILL.md:140-141` runner nie edytuje doktryny; `team-lead.md:147-152` „propose; do not launch" | **jest** — oblany eval kończy się jako „finding". Nikt nie ma obowiązku napisać N kandydatów przepisania z przewidywanym efektem. Kto proponuje: człowiek lub lead, bez protokołu |
| T6 brak wyczucia rozmiaru | brak podpowiedzi o rozmiarze kontekstu dla modelu (statusline pokazuje % tylko człowiekowi); progi są zdarzeniowe (zamknięcie fazy, ~70 % `maxTurns` `workflow-orchestration.md:66`) | **brak** — i T6 *uzasadnia* nasz wybór zdarzeniowych progów zamiast „model sam oceni, kiedy" |
| T7 słabszy model edytuje mniej | tiering: Haiku explorer, Sonnet workerzy z jednym zadaniem na brief (`agent-team-structure.md:213`, 431 tur / 135M przy stackowaniu), Opus lead | **brak** — potwierdza: zarządzania kontekstem wymagamy tylko od leada |
| T8 wstrzyknięcia przez pamięć | `STATE.md` jest pisany przez model i **wstrzykiwany do kontekstu na starcie każdej sesji** (`session-start.sh:2`); `lessons.md` ma pole `Rule:` (`agents-md-template.md:136`) z ręczną promocją (`:137`); `guard-protected-paths.sh` chroni ścieżki, nie treść | **jest** — żadna reguła nie mówi, co w `STATE.md` *nie może* się znaleźć (instrukcje dla następnej sesji poza `Last session`), nic tego nie sprawdza |
| T9 subagenci | `lead-does-not-open-a-swarm-unprompted.md` (eval) | **brak** — zgodne |

---

## 3. Propozycje — co wziąć, co kosztuje, jak sprawdzić

Kolejność wg stosunku wartości do kosztu. Każda to zmiana doktryny → spec z Open Questions, potem eval A/B
wg `evals/harness/README.md:60-86`.

### A. `Dead ends:` i `Untried:` jako obowiązkowe pola handoffu (rekomendacja: wziąć)

**Co:** w `session-handoff.md:16-19` (źródło; `sync-blocks.js` rozlewa do `team-lead.md`,
`agent-team-structure.md`, `codex-agents/team-lead.toml`) sekcja `Last session` dostaje dwa pola:
`Dead ends:` (co próbowano, z wynikiem, jedna linia każde) i `Untried (priority):` (co jeszcze nie, w kolejności).
To samo w run logu obok `what's left` (`sailes-implement/SKILL.md:23`) i w `agents-md-template.md:144`.
Puste pole wpisuje się jawnie (`Dead ends: none`), nie pomija — inaczej brak pola jest nieodróżnialny od
„nie było".
**Dlaczego:** T3 — to jedyna kategoria stanu, którą ich model wymyślił sam i którą my mamy tylko w
sailes-diagnose (UNTESTED). Nasz `Open failures` trzyma „best diagnosis so far", czyli *jedną* hipotezę, nie
listę odrzuconych. Koszt bez tego: wznowiona sesja powtarza odrzuconą próbę — ten sam mechanizm, który
`incident-template.md:62` naprawia dla incydentów („the next investigator does not re-walk it").
**Koszt:** 3–4 pliki tekstowe + `npm test` (sync-blocks parity) + 1 eval. Zero kodu.
**Eval:** `handoff-carries-dead-ends.md` — fixture: zadanie z jedną ślepą uliczką przebytą przed handoffem;
oczekiwane (binarne): wznowiona sesja (świeży subagent, tylko `STATE.md`) **nie wykonuje** tej próby ponownie.
Ramię A = doktryna sprzed zmiany.
**Ryzyko:** ceremonia. Pole, które zawsze ma `none`, przestanie być czytane. Dlatego binarny eval, nie reguła.

### G. Reguła „pamięć to fakty i wskaźniki, nie instrukcje" + sprawdzenie na starcie (rekomendacja: wziąć, mała)

**Co:** `agents-md-template.md:144-147` dostaje zdanie: `STATE.md` nie zawiera poleceń dla następnej sesji poza
`Last session: next step` i wskaźnikiem do briefu; polecenia żyją w `lessons.md` (promocja ręczna) i w
AGENTS.md. `session-start.sh` ostrzega (nie blokuje — styl `:34-45`), gdy w emitowanym wycinku pojawi się linia
zaczynająca się od trybu rozkazującego skierowanego do modelu („Always …", „Never …", „Ignore …", „Zawsze …")
poza sekcją `General rules`.
**Dlaczego:** T8. `STATE.md` jest *dokładnie* tym, co praca nazywa kanałem: tekst pisany przez model, który
wraca do kontekstu modelu bez człowieka pośrodku. Mamy regułę fakt-vs-hipoteza, nie mamy fakt-vs-polecenie.
Worker nie pisze `STATE.md` (pisze lead), więc ryzyko jest niskie, ale lead czyta wyjścia narzędzi i stron.
**Koszt:** 1 zdanie doktryny + ~15 linii bash + test w `session-start-memory.test.js`. Deterministyczne → test,
nie eval.
**Ryzyko:** fałszywe alarmy na `General rules`; stąd wyłączenie tej sekcji. Nie wykryje poleceń napisanych
inaczej — to ostrzeżenie, nie obrona.

### E. Tablica orkiestratora generowana, nie pisana (rekomendacja: wziąć w wersji „derived", nie „maintained")

**Co:** `tools/worker-status.js --sweep` dostaje tryb `--board`, który z plików `.claude/status/*.md` + run logu
produkuje ≤10 linii w kształcie z Fig. 3a: `slots: N busy / M max`, `claimed-not-closed:` (żywe lub martwe),
`closed: outcome × count`, `dead ends:` (z pola A), `next:` (z `Last session`). Lead czyta to zamiast listy
plików; `workflow-orchestration.md` każe wkleić wynik do run logu przy handoffie.
**Dlaczego:** T4 — ich orkiestrator utrzymał 6–8K tokenów na 21 agentach dzięki jednej tablicy pisanej w miejscu.
Nasz lead agreguje w głowie, i to jest ten kontekst, który „never reset on its own". Wersja „lead pisze tablicę
ręcznie" to kolejny plik do utrzymania i kolejne miejsce rozjazdu z dyskiem; wersja generowana trzyma zasadę
`promotion-prefers-enforcement` i `lead-verifies-status-against-worktree`.
**Koszt:** ~60–100 linii JS + test (deterministyczne) + 1 linia doktryny. Średni.
**Czego nie wiemy:** czy to realnie obniża kontekst leada. Zmierzyć `token-report.js` first-turn context p50/p90
przed i po na trzech run-ach; bez pomiaru nie promować do reguły.

### F. Protokół proposera dla oblanego evalu (rekomendacja: wziąć kształt, nie automat)

**Co:** `sailes-eval-runner/SKILL.md` dostaje opcjonalny krok 7, uruchamiany **tylko na polecenie człowieka** po
FAIL: rola `researcher` (Opus) czyta artefakty z `.ai/eval-runs/<run>/` — co najmniej po jednym przebiegu PASS i
FAIL na *tym samym* fixture, jeśli są — i pisze **3–4 pełne przepisania** spornego fragmentu doktryny, każde z
jednym zdaniem przewidywanego efektu (trafność i koszt wg `context-cost.js`). Człowiek wybiera, które ramię
idzie do A/B. Zasada `team-lead.md:147-152` „propose; do not launch" zostaje nienaruszona.
**Dlaczego:** T5 — to jedyny element pracy z twardym wynikiem na *instrukcjach*, nie wagach (38,3 → 74,2 %
held-out). Ich pętla jest w 90 % tym, co już mamy (świeży agent, binarny grader, dwa ramiona, Pareto
trafność × koszt), brakuje kroku „ktoś pisze kandydatów z predykcją". Dziś FAIL kończy się na „finding".
**Koszt:** doktryna + brief dla researchera. Każda propozycja do zmierzenia to pełny eval na świeżym agencie,
a „One run is a sample" — Pareto z jednej próbki nie istnieje. Realnie: 1 FAIL → 3 kandydaci → 3 × (A/B ≥ 2
próbki) ≈ 6–12 przebiegów subagenta. Drogie, ale rzadkie.
**Czego nie brać:** samoewolucji bez człowieka, selekcji po dev splicie (nie mamy splitów — mamy 1 fixture na
scenariusz), progu „5 propozycji bez poprawy". Dowód jest na syntetyce; na naszych evalach to hipoteza.

### D. Kontekst-świadomość: nic do zrobienia, jedno zdanie do zapisania

T6 mówi, że model nie wie, ile zużył, i że Sonnet zaniża. To **argument za** naszymi progami zdarzeniowymi
(zamknięcie fazy, `maxTurns`), a **przeciw** każdej przyszłej propozycji „niech lead sam oceni, kiedy zrobić
handoff". Warto to zapisać w `session-handoff.md` jako uzasadnienie przy Q6, żeby ktoś nie otworzył tej
dyskusji od nowa. Jedno zdanie z cytatem. Hint z licznikiem tokenów dla modelu (ich obejście) jest poza naszym
zasięgiem w Claude Code.

---

## 4. Czego nie bierzemy i dlaczego

- **Kontekst jako plik edytowany Bashem** — Claude Code nie wystawia żywego kontekstu; nasz odpowiednik to
  dysk + `/clear`. Praca nie mierzy tego wariantu, więc nie wiemy, czy przegrywamy, remisujemy, czy wygrywamy.
- **RL / success-gated efficiency advantage / GRPO** — nie trenujemy modelu.
- **Suffix Cache Reuse** — serwer; używamy API.
- **ContextBench jako nasz benchmark** — mierzy zarządzanie kontekstem w izolacji na syntetyce; nasze evale
  mierzą, czy mandat jest honorowany w realnym fixture. Inny cel. Jedyny transfer: metoda „izoluj jedną
  zdolność, zadanie bez rozumowania" — już ją stosujemy (`evals/README.md:70-80`, binarne scenariusze).
- **Subagenci jako domyślny tryb** — T9 potwierdza `lead-does-not-open-a-swarm-unprompted`.
- **Model definiuje własne funkcje kompakcji** (Fig. 3d `compact_turns`, 37 wywołań) — bez edytowalnego
  kontekstu nie ma czego kompaktować; nasz „compact" to `STATE.md` pisany raz na handoff.

---

## 5. Co praca potwierdza (bez zmian, warto wiedzieć przy następnym sporze)

1. `/clear` po zamkniętej fazie zamiast kontynuacji na tym samym kontekście — T2 (0,88 vs 0,40).
2. Snapshot + historia razem albo wcale — T2 backup (0,68 vs 0,00).
3. Auto-kompakcja jako bezpiecznik, nie mechanizm — T1.
4. Jedno zadanie na brief dla Sonnet-workerów, zarządzanie kontekstem tylko u Opus-leada — T7.
5. Progi zdarzeniowe, nie „model oceni rozmiar" — T6.
6. Nie otwieraj roju na jednym repo — T9.

---

## 6. Zaobserwowane przy okazji (poza zakresem, do backlogu)

- `.ai/lessons.md` ma 43 656 B przy własnym limicie 40 KB (`agents-md-template.md:13`); `session-start.sh:34-45`
  ostrzega tylko o `STATE.md` 20 KB i `lessons.md` 40 KB — czy ostrzeżenie faktycznie padło w tej sesji, nie
  sprawdzałem. Rotacja do `.ai/archive/` należy się niezależnie od tego audytu.
- `.ai/backlog.md` ma 99 783 B i **żadnego** limitu rozmiaru. Nie jest emitowany na starcie, więc nie kosztuje
  kontekstu, dopóki ktoś go nie przeczyta w całości wbrew `agents-md-template.md:136`.

---

## 7. Następny krok

Spec w `.ai/specs/` z Open Questions: (1) A + G razem jako P1 (sam tekst + jeden bash, jeden eval, jeden test),
(2) E jako P2 za bramką pomiaru `token-report.js`, (3) F jako P3 albo backlog. Decyzja, co wchodzi, jest
człowieka.
