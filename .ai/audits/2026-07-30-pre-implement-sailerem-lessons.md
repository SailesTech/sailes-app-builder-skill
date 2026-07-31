# Pre-Implement Report: 2026-07-30-sailerem-lessons-to-doctrine

Data: 2026-07-30 · Gałąź: `spec/sailerem-lessons-to-doctrine` · Framework-Version: 1.24.0

## Verdict: **READY-WITH-FIXES**

Trzy naprawy wracają do specu przed pierwszą linią kodu. Dwie z nich są krytyczne, bo spec
w obecnym kształcie **łamie regułę, którą sam egzekwuje w innym miejscu**, a jedna zakłada
dystrybucję, która nie zachodzi.

**Sonda mechaniczna BC: SKIP.** `graphify-out/` nie istnieje w tym repo, więc `graphify explain`
i `graphify path` nie były uruchomione. Zapisane jako jawny SKIP, nie przemilczane — analiza BC
poniżej opiera się na odczycie plików testowych i szablonów, nie na mapie kodu.

---

## BC findings

### [KRYTYCZNE] BC-1 — `parity.test.js` przetrwa odwrócenie znaczenia reguły, milcząc

`codex-agents/parity.test.js` trzyma listę niezmienników, które muszą wystąpić po **obu** stronach
(Claude `.md` i Codex `.toml`). Trzy z nich dotyczą dokładnie tej reguły, którą przepisuje F5/5.4:

| Rola | Linia | Niezmiennik | Regex |
|---|---|---|---|
| `team-lead` | 83 | workers never commit or push | `/workers? (?:never\|do not\|don't) commit\|…/i` |
| `be-dev` | 106 | never commits or pushes | `/never commit\|not commit/i` |
| `fe-dev` | 110 | never commits or pushes | `/never commit\|not commit/i` |

Nowe brzmienie z D5 — *„nigdy nie commituje do wspólnej gałęzi; we własnym worktree commituje
i powinien"* — **nadal pasuje do tych regexów**. Test przejdzie na zielono, gdy znaczenie reguły
zostanie odwrócone.

To jest gorsze niż czerwony test. Instrument mierzy obecność stringa i przeżywa inwersję sensu —
czyli dokładnie klasa defektu opisana w `.ai/lessons.md` pod datą 2026-07-25 („a measuring
instrument needs a fixture that must NOT fire"). Zielona bramka powiedziałaby nam, że parytet
jest zachowany, w chwili gdy dziesięć plików mówi dwie różne rzeczy.

**Ścieżka naprawy:** F5 musi objąć `codex-agents/parity.test.js` (nowe brzmienie niezmiennika
+ fixture, który MUSI paść na starym brzmieniu) oraz sześć twinów TOML: `be-dev`, `fe-dev`,
`team-lead`, `tester`, `designer`, `docs-author`. Dziś lista plików w F5 kroku 5.4 wymienia
cztery pliki i **żadnego twina ani testu**.

### [KRYTYCZNE] BC-2 — `agents-md-template.md` jest na budżecie, a spec dokłada pięć reguł

Zmierzone: blok szablonu ma **149 linii** przy zapisanym budżecie **„target ≤ ~150 lines for the
root file"** (`agents-md-template.md:3`). Ten sam akapit mówi:

> A rule that promotes into this file must **displace or merge, not only append** — the budget
> forces curation.

Spec dokłada do tego pliku pięć rzeczy: 1.2 (spójność góra/dół), 1.3 (odroczenie → backlog),
1.6 (karta decyzji sprawdza mechanizm), 4.1 (pole `Last-commit:`), 4.4 (asymetria `.env*`).
**Żadna nie ma planu wyparcia.** Spec, którego celem jest zakaz dokumentów niezgodnych z własnymi
regułami, sam by tę regułę złamał w pierwszej fazie.

**Ścieżka naprawy:** plan wyparcia albo scalenia dla każdej z pięciu pozycji, ustalony **przed**
1.2. To jest fork wymagający decyzji człowieka — patrz Remediation R1.

### [OSTRZEŻENIE] BC-3 — nowe niezmienniki nie trafią do listy parytetu same z siebie

`parity.test.js:150` wymaga, żeby każda rola miała wpis mówiący, czego nie wolno z niej stracić.
F3/3.5 (wyłączność środowiska w `qa`) i F5/5.1 (mandat worktree w pięciu rolach piszących) są
nowymi niezmiennikami nośnymi. Jeśli nie wejdą do `INVARIANTS`, test **nie padnie** — po prostu
ich nie pokryje, a twiny będą mogły dryfować swobodnie. Cichy brak pokrycia, nie awaria.

### [OSTRZEŻENIE] BC-4 — zmiana `hooks-template/*.sh` NIE dociera do istniejących repo

Spec zakłada w F4, że zmiana w `session-start.sh` i `guard-protected-paths.sh` wchodzi do obiegu.
Dla **nowych** repo tak. Dla istniejących — nie:

- plugin z `autoUpdate: true` dostarcza `skills/`, `agents/`, `hooks/` — czyli hooki **frameworku**;
- `hooks-template/*.sh` to szablony **kopiowane** do repo klienta przy bootstrapie, a repo klienta
  ma własną kopię w `.claude/hooks/`;
- `adopt-existing-repo.md:115` mówi wprost: *„Additive — if the repo already has one twin, add the
  missing one; **never overwrite**"*, a `:119` powtarza to dla hooków.

Czyli check STATE.md ↔ git (4.2) i zamek środowiska (4.3) **nie pojawią się w żadnym już
działającym repo klienta**, dopóki ktoś świadomie nie podmieni pliku. Spec tego nie mówi, więc
przy zamknięciu wyglądałby na dowieziony szerzej, niż jest.

### [OSTRZEŻENIE] BC-5 — pole `Last-commit:` będzie nieobecne w każdym istniejącym repo

Konsekwencja 4.1: repo zbootstrapowane przed tym wydaniem ma STATE.md bez tego pola. Zachowanie
przy braku pola **musi być ciszą, nie ostrzeżeniem** — inaczej hook krzyczy w każdej sesji
każdego starego repo i zostanie wyciszony, razem z przypadkiem, dla którego powstał. Spec ma to
już w Done-when F4 („brak pola → cisza, nie krzyk"); zapisane tutaj, bo to jedyne miejsce, gdzie
widać, że dotyczy **wszystkich** dotychczasowych repo, a nie przypadku brzegowego.

### [INFO] BC-6 — `repo-done-checklist.test.js` jest odporny na dopisywanie

Test wyciąga wzorce **z samego dokumentu** (`:40`, `:47`) zamiast trzymać kopię, i asertuje
obecność zdania o „green scripted block is not a usable repo" (`:111`). Kroki 2.1, 2.4, 4.4 i 5.5
dopisują sekcje — bez ryzyka, dopóki nie ruszą skanu dryfu ani tego zdania.

---

## Gaps

| # | Luka | Gdzie |
|---|---|---|
| G1 | Done-when F1 powołuje się na „nowy plik testowy" (1.1b) bez podania ścieżki i bez kroku wpinającego go do łańcucha `npm test` w `package.json`. To samo w F4/4.6. | F1, F4 |
| G2 | Spec nie nazywa **rollbacku**. Dla repo, w którym `main` jest deployem na każdą maszynę, jest to brak nośny — Red Flag `sailes-pre-implement` mówi wprost: nie zaczynaj, gdy nie umiesz nazwać wycofania. | całość |
| G3 | F6 nie mówi, co się dzieje, **gdy eval padnie**. Czy faza jest czerwona i blokuje wydanie, czy werdykt jest zapisywany i wydanie idzie dalej? Bez tego eval jest obserwacją, nie bramką. | F6 |

---

## Risks

| Scenariusz | Waga | Obszar | Mitygacja | Ryzyko szczątkowe |
|---|---|---|---|---|
| Reguła „never commit" żyje w dwóch brzmieniach naraz (część plików przepisana, część nie) | **Wysoka** | `agents/`, `codex-agents/`, `agents-md-template.md`, `agent-team-structure.md` | 5.4 jako **jeden atomowy krok** obejmujący wszystkie dziesięć plików + odwrócony fixture w `parity.test.js` | Repo klienta z własną kopią starego brzmienia w swoim `AGENTS.md` — nieosiągalne z tej strony |
| Zamek `ENV-LOCK` przeżywa padniętego `qa` i blokuje wszystkich | Średnia | `guard-protected-paths.sh` | Zamek niesie właściciela i czas powstania; lider ma jawne prawo złamania z wpisem w run logu (4.3) | Kształt ścieżki wygaszenia nie jest jeszcze zaprojektowany — wymóg zapisany, projekt nie |
| Push do `main` przed zieloną bramką = deploy na każdą maszynę | **Wysoka** | całość | Gałąź (już utworzona), pięć stempli, CHANGELOG, `npm test` przed merge | Brak — mechanizm istnieje i jest testowany przez `release-hygiene.test.js` |
| `agents-md-template.md` przekracza budżet i staje się ignorowany | Średnia | szablon każdego nowego repo | R1 poniżej | Budżet jest miękki („~150"), więc naruszenie nie odpali żadnego testu |
| Eval z F6 mierzy to, co model zrobił, zamiast tego, czego wymagamy | Średnia | `evals/` | Scenariusze pisane **przed** implementacją kroków (zapisane w F6) + arm kontrolny, który musi dać wynik przeciwny | Autor scenariusza i autor reguły to ta sama sesja |

---

## Remediation — przed pierwszą linią kodu

**R1 — plan wyparcia dla `agents-md-template.md` (blokuje F1).** Fork wymagający decyzji człowieka;
przedstawiony osobno.

**R2 — rozszerzyć listę plików F5/5.4 (blokuje F5, nie F1).** Dopisać do specu: `codex-agents/
parity.test.js` (nowe brzmienie niezmiennika + fixture, który MUSI paść na starym) oraz sześć
twinów TOML. Dopisać do F3/F5 wymóg dodania nowych niezmienników do `INVARIANTS` (BC-3).

**R3 — nazwać w specu granicę dystrybucji (blokuje F4, nie F1).** F4 dotyczy **nowych** repo
i tych, które przejdą Upgrade; istniejące zachowują swoje kopie hooków. Wynika z tego pozycja,
której w specie nie ma: wpis w `CHANGELOG.md` musi powiedzieć wprost, że 4.2/4.3 wymagają
świadomej podmiany pliku w już działającym repo — bo `adopt-existing-repo` z zasady nie nadpisuje.

**R4 — dopisać G1, G2, G3.** Ścieżki nowych plików testowych i ich wpięcie do `package.json`;
zdanie o rollbacku (`git revert` + wydanie łatające, nigdy force-push na `main`); rozstrzygnięcie,
czy czerwony eval blokuje wydanie.

## Sequencing

Kolejność z specu (F1 → F2 → F3 → F4 → F5 → F6) **jest poprawna** i analiza jej nie zmienia.
Blokady są rozłączne: R1 blokuje wyłącznie F1, R2 wyłącznie F5, R3 wyłącznie F4. R4 to edycje
specu, nie kodu.

Kolizje plików między fazami — zidentyfikowane już w specu — potwierdzone i uzupełnione:
`agents-md-template.md` (F1+F4), `agent-team-structure.md` (F1+F3+F5), `repo-done-checklist.md`
(F1+F2+F4+F5), `spec-writing-template.md` (F1+F3), a po R2 dochodzi `codex-agents/*` (F3+F5).
Te fazy nie mogą iść równolegle na tych samych plikach.

## Czego ten raport NIE ustalił

- **Mapa kodu nie była użyta** — `graphify-out/` nie istnieje (SKIP powyżej). Analiza BC opiera się
  na odczycie plików, więc zależność, która istnieje wyłącznie jako wywołanie w kodzie i nie ma
  śladu tekstowego w przeszukanych plikach, mogła zostać pominięta.
- **Nie sprawdzono, czy `evals/` mają dziś przebiegi dla reguł, które F5 przepisuje.** Jeśli
  istniejący eval asertuje stare brzmienie „workers never commit", stanie się czerwony po 5.4
  i trzeba go przepisać, nie usunąć. To do sprawdzenia na wejściu do F5.
- **Nie zmierzono, czy zamek `ENV-LOCK` da się zaimplementować w `guard-protected-paths.sh` bez
  `jq`** — skrypt celowo grepuje surowy JSON, żeby działać wszędzie, a odczyt pliku zamka to inna
  operacja niż dopasowanie payloadu. Do ustalenia przy F4.
