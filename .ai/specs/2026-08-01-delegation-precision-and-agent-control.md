# Spec: precyzja delegowania i kontrola nad agentami

Status: draft
Brief: `.ai/briefs/2026-08-01-delegation-precision-and-agent-control.md`
Framework-Version target: 1.27.0
Related: `.ai/specs/2026-08-01-milestone-lessons-to-doctrine.md` (in-progress, 1.25.2 + 1.26.0)

## TLDR

Dwie rzeczy, w tej kolejności: **brief, którego nie da się oddać niedomkniętym**, i **plik statusu
per worker, którego nieobecność coś znaczy**. Do tego jedna naprawa strukturalna, która jest
warunkiem obu — **próg delegowania przestaje istnieć w trzech kopiach**.

Zakres wynika z dnia, w którym trzynaście ramion ewaluacyjnych dało jedno czyste rozróżnienie:
doktryna jest w większości re-derywowalna przez model, **artefakt nie jest**. Dlatego wszystko
poniżej, co da się zamienić w plik, check albo test, jest tak zamieniane, a proza zostaje tam,
gdzie mechanizm jest niemożliwy — nie tam, gdzie jest niewygodny.

## Problem

Cztery kosztowne defekty z 2026-08-01 mają jedną cechę wspólną: **każdy był nieobecnością.**
Brakujący endpoint nie zmienia żadnej linii, więc przegląd łatki nie może go znaleźć. Brakujący
raport jest ciszą nie do odróżnienia od „nie znalazłem nic". Brakujący kwit delty wygląda w run
logu jak zgodność. Brakująca klauzula `Done-when` nie daje bramce czego oblać. Poprawność ktoś
sprawdzi; **nieobecności nie ma kto**, dopóki nie istnieje coś, co asertuje obecność.

Osobno, i to jest przyczyna trzech kolizji kryteriów zmierzonych tego dnia: **reguła zapisana
w więcej niż jednym miejscu rozjeżdża się**, a evale kodują potem różne jej wersje. Rozjazd ma
stałe miejsce — kanoniczny `agent-team-structure.md` → definicja roli `agents/*.md` → bliźniak
`codex-agents/*.toml`. Dwa razy zmierzone tego dnia, raz w wersji, w której **kanoniczny plik
w ogóle nie miał klauzuli**, którą rola egzekwowała.

## Proponowane rozwiązanie (szkielet — pełna treść po bramce)

**Faza 1 — jeden próg.** Próg delegowania dostaje jedno kanoniczne sformułowanie; dwa pozostałe
miejsca wskazują na nie zamiast powtarzać. To jest warunek wstępny wszystkiego innego, bo dwa
evale wymagają dziś przeciwnych zachowań i dopóki tak jest, żaden wynik o delegowaniu nie znaczy
nic.

**Faza 2 — brief się domyka albo nie przechodzi.** Check na: pola obowiązkowe obecne, i każdy plik
na liście dozwolonych nazywa klauzulę `Done-when`, która go wymusza. Reguła prozą weszła w 1.26.0
i jest **jedynym dodatkiem tamtego wydania, który zmierzył się czysto** — ta faza zamienia ją
w mechanizm.

**Faza 3 — plik statusu workera.** Zajmowany na starcie (kto, jakie pliki, sha bazy), domykany na
końcu (wynik, commit). Sens całości: **brak pliku znaczy „nigdy nie wystartował", plik niedomknięty
znaczy „padł w trakcie"** — trzy rozróżnialne stany zamiast jednej ciszy, która dziś dwa razy
kazała uznać gotową pracę za nieukończoną. Lider weryfikuje deklarację **przeciw worktree**, nie
na słowo.

**Faza 4 — dowód.** Test deterministyczny na formacie, eval na zachowaniu, każdy eval z ramieniem
kontrolnym, które **musi dać wynik przeciwny**. Bez tego powtórzę błąd z 1.26.0, gdzie cztery
wnioski o skuteczności były fałszywe, dopóki nie dołożyłem kontroli.

## Zmierzone ograniczenie nośnika (nie do przedyskutowania — do obejścia)

Sonda na żywym narzędziu, 2026-08-01: `TaskCreate` przyjmuje dowolne `metadata`, `TaskUpdate`
przyjmuje `owner`/`status`/`metadata`, `TaskList` renderuje id · status · temat · właściciela —
ale **`TaskGet` nie zwraca `metadata`** (ani `blocks`/`blockedBy`, które obiecuje jego własny
opis). Metadane są w praktyce tylko do zapisu, stan jest sesyjny, nie repozytoryjny, i nie
przeżywa padnięcia procesu — a 2026-08-01 maszyna padła pięć razy.

Skutek dla specu: **pliki w repo są źródłem prawdy**; narzędzia harnessu wolno użyć wyłącznie jako
zgrubnego lustra statusu i właściciela. Defekt `TaskGet` jest poza tym repo — zgłaszamy, obchodzimy,
nie naprawiamy.

## Open Questions — BRAMKA

Nie piszę dalszej części specu, dopóki nie ma odpowiedzi. Rekomendacja pierwsza i oznaczona.

---

**Q1 — Gdzie stoi jeden próg delegowania?**

**Zmierzone przed postawieniem pytania**, bo opcja A stała na przesłance, której nie sprawdziłem:
- **Tylko `agents/team-lead.md` w ogóle odsyła do pliku kanonicznego** (linia 10). Żadna inna rola.
- Odsyła **ścieżką repozytoryjną** — `skills/sailes-bootstrap/agent-team-structure.md`. W tym repo
  ona istnieje. **W repo klienta nie**: wtyczka serwuje skille z `~/.claude/plugins/…`, a katalogu
  `skills/` w drzewie klienta nie ma. `agents-md-template.md:109` mówi to wprost („It is a globally-
  installed skill, not a file in this repo") — czyli szablon wie, a definicja roli, którą wtyczka
  wysyła na każdą maszynę, dalej podaje ścieżkę lokalnie nieistniejącą.
- Odsyła zdaniem *„przeczytaj przed planowaniem"* — **instrukcją, nie gwarancją**. Nic nie sprawdza,
  czy lektura nastąpiła.

- **A — w `agent-team-structure.md`, bo jest kanoniczny z nazwy.** `agents/team-lead.md`
  i `codex-agents/team-lead.toml` niosą jedno zdanie odsyłające. ✅ zgodne z tym, czym ten plik już
  się deklaruje; ✅ jedno miejsce do zmiany. ⚠️ **osłabione pomiarem wyżej**: w repo klienta lider
  dociera tam przez skilla, po instrukcji podającej złą ścieżkę, bez niczego, co sprawdzi, czy
  dotarł. Jedyny próg za trzema warunkami, z których żaden nie jest wymuszony.
- **B — w `agents/team-lead.md`, bo to jego decyzja.** ✅ rola niesie komplet tego, czym się kieruje.
  ⚠️ kanoniczny plik staje się niekanoniczny w tej jednej sprawie, co jest gorsze niż obecna
  duplikacja: czytelnik nie wie, który plik kłamie.
- **C (rekomendacja po pomiarze) — jedno źródło i wygenerowane kopie.** Blok wstawiany skryptem
  w trzy miejsca, test pilnuje identyczności. ✅ każdy plik **samowystarczalny** — co po pomiarze
  wyżej przestaje być wygodą i staje się warunkiem, bo w repo klienta odsyłacz nie prowadzi
  nigdzie; ✅ rozjazd niemożliwy, a to jest meta-defekt, który dał trzy kolizje w jeden dzień;
  ✅ repo używa już tego wzorca dla spine'u (`AGENTS.md` niesie komentarz „Repeated verbatim by
  hooks/workflow-router.js and by agents-md-template.md. Change all three or none"), więc to jest
  utwardzenie istniejącej praktyki, nie nowy wynalazek. ⚠️ nowy mechanizm generowania do
  utrzymania; ⚠️ trzy kopie w diffie przy każdej zmianie progu.

---

**Q2 — Macierz własności plików: co to jest jako artefakt?**

- **A (rekomendacja) — blok `yaml` w planie pracy, zadanie → zbiór ścieżek.** ✅ ten sam ruch, który
  zadziałał dla powierzchni API w 1.26.0; ✅ przecięcie liczy się trywialnie i da się je sprawdzić
  checkiem. ⚠️ ktoś musi go utrzymywać w trakcie przebiegu, a plan zmienia się w locie.
- **B — wyliczana z briefów, nie pisana osobno.** Każdy brief niesie swoje `Files:`, macierz jest
  ich sumą. ✅ zero podwójnego zapisu, zero rozjazdu z briefem. ⚠️ istnieje dopiero, gdy briefy
  istnieją — więc nie odpowiada na pytanie „czy mogę to teraz powołać".
- **C — tylko reguła prozą, bez artefaktu.** ✅ nic do utrzymania. ⚠️ to jest stan dzisiejszy,
  a dzisiejszy stan pozwolił fazie stać bez powodu przy sześciu przed sobą.

---

**Q3 — Czy weryfikacja pliku statusu przeciw worktree BLOKUJE, czy raportuje?**

- **A (rekomendacja) — raportuje głośno, nie blokuje.** Rozbieżność między deklaracją a worktree
  ląduje w werdykcie lidera i w run logu. ✅ nie tworzy nowego sposobu na zatrzymanie przebiegu
  o trzeciej w nocy; ✅ zgodne z tym, jak działa check STATE.md, który celowo ostrzega i nie blokuje.
  ⚠️ raport, który nie blokuje, bywa przewijany.
- **B — blokuje integrację.** Lider nie może cherry-pickować, dopóki plik nie zgadza się z drzewem.
  ✅ nie da się zignorować. ⚠️ pierwszy fałszywy alarm przy nietypowym, ale poprawnym przebiegu
  kosztuje zaufanie do całego mechanizmu — a repo ma już dwa udokumentowane przypadki wyłączenia
  checku, który krzyczał za często.
- **C — blokuje tylko przy rozbieżności JEDNEGO rodzaju: plik deklaruje commit, którego nie ma.**
  ✅ to jedyna rozbieżność bez legalnego wytłumaczenia; ✅ wąskie, więc fałszywy alarm prawie
  niemożliwy. ⚠️ nie łapie deklaracji plików rozbieżnej z rzeczywistością, czyli połowy przypadku.

---

**Q4 — Gdzie stoi check domknięcia briefu i kiedy strzela?**

- **A (rekomendacja) — test w repo klienta, uruchamiany w bramce, nie hook.** ✅ brief bywa pisany
  w wiadomości, nie w pliku, więc hook `PreToolUse` i tak go nie zobaczy; ✅ testowalne bez harnessu.
  ⚠️ strzela późno — po fakcie, nie przy pisaniu.
- **B — hook `PreToolUse` na powołaniu agenta.** ✅ strzela w jedynym momencie, w którym naprawa
  jest darmowa. ⚠️ wymaga, żeby brief był w payloadzie powołania w postaci nadającej się do
  sparsowania — **nie zmierzone, może być niewykonalne**, i to trzeba sprawdzić sondą przed
  wyborem tej opcji.
- **C — obie: hook gdzie się da, test jako siatka.** ✅ pokrywa oba momenty. ⚠️ dwa mechanizmy na
  jedną regułę, czyli dokładnie ta duplikacja, którą ten spec ma likwidować.

---

**Q5 — Czy plik statusu obowiązuje wszystkich piszących, czy tylko powołanych do worktree?**

- **A (rekomendacja) — wszystkich piszących.** ✅ ta sama reguła co worktree, ten sam test („czy to
  pisze"), zero nowej granicy do zapamiętania. ⚠️ `docs-author` i `designer` dostają obowiązek przy
  zadaniach, które bywają jednoplikowe.
- **B — tylko tam, gdzie jest worktree.** ✅ plik statusu i worktree stają się jednym pojęciem.
  ⚠️ dziś **każdy** piszący dostaje worktree, więc to jest ta sama grupa opisana słabszym testem —
  i rozjedzie się przy pierwszym wyjątku.
- **C — wszyscy powołani, także read-only.** ✅ `explorer`, który padł, też przestaje być ciszą.
  ⚠️ dla roli read-only deklaracja plików jest pusta, więc połowa formatu jest martwa.

## Non-goals

- Żywy podgląd przebiegu. Plik zajmowany na starcie daje wgląd w trakcie jako **skutek uboczny**;
  budowanie pod to osobnego widoku jest poza zakresem.
- Zastępowanie run logu. Plik statusu odpowiada na „czy ten worker skończył i co ruszył".
- Naprawa `TaskGet`. Defekt poza tym repo.
- Przemiał 22 evali bez styku. Osobna, tańsza decyzja.
