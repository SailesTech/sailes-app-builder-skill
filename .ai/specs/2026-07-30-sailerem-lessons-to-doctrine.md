# Wnioski z sesji Sailerem → doktryna frameworku

Status: approved — zatwierdzony przez Karola 2026-07-30, obie bramki Open Questions zamknięte (D1–D11)
Source: `skile do inspiracji/wnioski z projektow/30.07.2026 sailerem.md`
Framework-Version at authoring: 1.24.0

## TLDR & Context

Jeden dzień pracy na repozytorium Sailerem (framework 1.16.0 → 1.24.0, dwudziestu kilku
wykonawców, sześć bramek, cztery znaleziska klasy escaped-defect) wyprodukował dokument
z piętnastoma proponowanymi zmianami w frameworku. Walidacja przeciw stanowi repo z 2026-07-30:
**trzynaście to realne luki**, jedna (poz. 8) jest w ~70% już dowieziona, jedna (2a) miała wadę
konstrukcyjną w zaproponowanej formie i została przeniesiona z `pre-commit` do `SessionStart`.

Ten spec bierze **wszystkie potwierdzone pozycje**, uszeregowane w sześć faz według stosunku
wartości do kosztu: najpierw proza i checklisty (nic nie może zepsuć działającej maszyny), potem
nowe mechanizmy, następnie izolacja worktree — jako jedyna niosąca zależność środowiskową —
a na końcu evale, bo zielony test dowodzi, że reguła jest w pliku, nie że ląduje.

**Blast radius:** każda zmiana w `skills/`, `agents/` lub `hooks/` zmienia zachowanie w **każdym
repo na maszynie** — plugin jedzie z `main` z `autoUpdate: true`. Push do `main` JEST deployem.
Nic nie ląduje tam przed zieloną bramką i wpisem w `CHANGELOG.md`.

## Decisions Ledger

| # | Fork | Wybór | Uzasadnienie zapisane, żeby dało się z nim pokłócić |
|---|---|---|---|
| D1 | Zakres pierwszego specu | Wszystkie pozycje, w fazach | Nic nie ląduje w backlogu jako „może później" — dokument już raz przeszedł triage u autora. |
| D2 | Weryfikacja w worktree (poz. 1) | Mandat + wymóg bootowalności świeżego checkoutu | To ta sama rzecz, której wymaga blok Environment z poz. 10a — jedna zmiana obsługuje dwie pozycje. Bez niej mandat zamienia wykonawcę z „zweryfikowany" na „nie może uruchomić weryfikacji", czyli regresja wprost na `VERIFIED`. |
| D3 | Lokalizacja checka STATE.md ↔ git (poz. 2a) | `SessionStart`, jako ostrzeżenie — **nie** git `pre-commit` | W momencie pre-commit `HEAD` to commit poprzedni, więc linia „Ostatni commit" jest poprawna dokładnie wtedy, gdy nazywa commit, który właśnie zastępujesz. Awaria dzieje się przy **odczycie**, na starcie sesji — a tam hook już `cat`-uje STATE.md. Jeden `git rev-parse`, obie harnessy dzielą ten skrypt, zero nowego rodzaju hooka w szablonie. |
| D4 | Rejestr tabel do bramki „udowodniony pisarz" (poz. 5) | Sama reguła; mechanizm zostaje repo | Framework mówi CO trzeba udowodnić i ŻE lista ma być wyprowadzana, nie JAK. Wiązanie reguły z eksportem schematu Drizzle przywiązałoby ją do stacku, który `stack-baseline.md` trzyma jako domyślny, nie jedyny. |
| D5 | Odbiór pracy z worktree (poz. 1) | Wykonawca commituje u siebie; integrujący robi cherry-pick. Reguła „workers never commit/push" **przepisana** na „nigdy do wspólnej gałęzi, nigdy push" | Commit jest samodeklaracją „to jest skończone". Czytanie niezacommitowanego stanu dysku nie odróżnia pracy gotowej od połowy edycji — czyli odtwarza incydent nr 1 z dokumentu (`sweep-trash.ts` z dołożonym parametrem bez zmienionej sygnatury) wewnątrz worktree. Cel starej reguły — ochrona wspólnej gałęzi — jest teraz gwarantowany **fizycznie przez gita**, nie przez posłuszeństwo: `main` jest wypięty w głównym drzewie, więc worktree nie może go wziąć. |
| D6 | Wyłączność `qa` na środowisko (poz. 1b) | Plik-zamek czytany przez hooka | Symetryczne do argumentu z poz. 1: worktree zamienia postulat w warunek fizyczny, a środowisko uruchomieniowe jest jedynym zasobem, którego nie da się sklonować. Sama proza to dokładnie ten kształt reguły, który 2026-07-30 padł — nikt jej nie łamał złośliwie, po prostu nie istniała. |
| D7 | Kształt „tylko człowiek" przy brakach w `.env*` (poz. 10b) | Oba, z podziałem po trwałości: `ENV-DEFECT` blokuje tu i teraz, wiersz w backlogu przeżywa sesję | Dokument opisuje sytuację trwającą **tygodnie**, której żaden agent nie mógł zgłosić, bo nikt nie stawiał stacku od zera. Sam werdykt bramki tego nie łapie — bramka musi się najpierw odpalić. |
| D8 | Maszynowy check formatu `Status: implemented` (1.1) | **Test zakresowany datą** — sprawdza wyłącznie spece zamknięte po dacie wejścia reguły | Ratchet spełniony (reguła jest checkiem, nie prozą) bez retrofitu kilkunastu historycznych plików. Retrofit odpadł z konkretnego powodu: werdyktów dla starych specow częściowo **nie ma**, więc wypełnienie pola dowodowego oznaczałoby wpisanie tam niedowodu — dokładnie klasa błędu, przeciw której ta reguła powstaje. Koszt przyjęty świadomie: test niesie datę graniczną, czyli jedną magiczną wartość, i musi ją wyjaśniać w komentarzu. |
| D9 | Testy dla `hooks-template/*.sh` (F4) | **Tak — nowa infrastruktura testowa**: Node steruje skryptem `sh` tak, jak robi to harness (JSON na stdin, tekst na stdout) | AGENTS.md wymaga realnego testu dla zachowania deterministycznego, a F4 dokłada do tych skryptów logikę warunkową (porównanie sha, obecność zamka). Skrypty jadą na **każdą** maszynę i milczą, gdy zawiodą. Uwaga wykonawcza z AGENTS.md: ścieżki MSYS (`/c/Users/…`) w fixtures sprawiają, że hook „przechodzi", milcząc z niewłaściwego powodu. |
| D10 | Zakres mandatu worktree (5.1) | **Każdy, kto pisze — bez wyjątku**, włącznie z `designer`, `tester` i `docs-author` | Tak brzmi wniosek nr 1 w dokumencie źródłowym i tak reguła jest jednozdaniowa. `docs-author` bywa uruchamiany **równolegle** z fazą implementacji przy domykaniu specu — czyli dokładnie w warunkach, które dały trzy incydenty. Lista wyjątków to rzecz, która rozjeżdża się przy dodaniu nowej roli; pytanie ma brzmieć „czy pisze", nie „czy jest na liście". |
| D11 | Evale (F6) | **Wchodzą do tego specu jako faza F6** | Cztery reguły są czysto behawioralne i żaden test deterministyczny ich nie mierzy. Bez F6 spec zamyka się na dowodzie, że **tekst jest w pliku** — nie że ląduje. Przy `main` = live deploy na każdą maszynę to jest różnica między „wydane" a „wydane i zmierzone". |
| D12 | Budżet `agents-md-template.md` (BC-2 z pre-implement) | **Scal w istniejące sekcje + wyprzyj nadwyżkę.** Twarde kryterium wyjścia: blok szablonu ≤ 150 linii po F1 **i** po F4 | Zmierzone przed decyzją: blok ma **149 linii** przy budżecie „~150". Żadna z pięciu nowych reguł nie potrzebuje własnej sekcji — 1.2 i 4.1 należą do Session Memory, 1.3 do Lessons, 1.6 do Answer shape reguły 3, 4.4 do Hard Safety Rules. Podniesienie budżetu odpadło, bo budżet istnieje z powodu, który podniesienie kosztuje: *bloated memory files get ignored* — wytyczna cytowana w tym samym pliku. Wyparcie jest tym, czego ratchet wymaga od każdej promowanej reguły; spec, który go omija, łamie regułę, którą sam egzekwuje. |
| D13 | Czerwony eval z F6 (G3 z pre-implement) | **Blokuje wydanie** | F6 jest bramą, nie obserwacją. Reguła, która nie ląduje, nie jest dowieziona, a `main` to deploy na każdą maszynę. Znane ryzyko, przyjęte świadomie: eval bywa czerwony z powodów niezależnych od reguły (kształt scenariusza, wariancja modelu), a bramka padająca z obcego powodu zostaje raz przedyskutowana i potem ignorowana — dlatego każdy scenariusz **musi** mieć arm kontrolny dający wynik przeciwny, inaczej nie jest bramą tylko szumem. |

## Pomiar — izolacja worktree, 2026-07-30

Wykonany **przed** rozstrzygnięciem D5, bo opis narzędzia `Agent` mówi tylko, że `isolation:
worktree` daje agentowi własny worktree „auto-sprzątany, jeśli niezmieniony", i nie mówi, czy
integrujący dostaje do niego ścieżkę. Poz. 9a zakazuje powoływania się na niesprawdzony mechanizm,
więc został sprawdzony: jedno powołanie piszącego subagenta na zadaniu-sondzie.

| Pytanie | Wynik | Dowód |
|---|---|---|
| Czy integrujący dostaje ścieżkę do worktree? | **Tak, automatycznie** | wynik narzędzia zwrócił `worktreePath` i `worktreeBranch` |
| Kolizja brancha (git odmawia checkoutu tej samej gałęzi dwa razy) | **Problem nie istnieje** — harness sam tworzy dedykowany `worktree-agent-<id>` | `git worktree list` |
| Czy zmieniony worktree przeżywa zakończenie agenta? | **Tak**; katalog został, zamek zdjęty | `ls .claude/worktrees/` po zakończeniu |
| Czy commit z worktree dociera do integrującego? | **Tak, natychmiast** — `git-common-dir` to wspólne `.git`, więc branch jest widoczny z głównego drzewa **bez pushowania i bez kopiowania** | `git show probe/worktree-…` z głównego drzewa |
| Czy cokolwiek zablokowało commit? | **Nie** — żaden hook ani guard | krok 5 sondy, zero odmów |
| Czy `npm test` przechodzi bez `node_modules`? | **Tak — ale to fakt o TYM repo**, nie o worktree | to repo nie ma zależności; suita to czysty Node |

**Ostatni wiersz nie generalizuje się i to jest jego cała wartość.** Framework repo przechodzi
weryfikację w worktree, bo nie ma zależności. Repo klienta (pnpm monorepo, Next.js, Drizzle) nie
przejdzie — warunek bootowalności z D2 zostaje w mocy **dla repo klienta** i jest bezprzedmiotowy
dla frameworku. Mandat musi to rozróżniać, inaczej jest nieprawdziwy w jedną albo drugą stronę.

**Znalezisko poboczne:** `.claude/worktrees/` nie jest w `.gitignore`. Tutaj nie szkodzi, bo całe
`.claude/` jest nieśledzone. W repo generowanym przez `skeleton.md` **`.claude/settings.json` jest
commitowany**, więc worktree'y wykonawców wylądowałyby jako śmieć w `git status` wewnątrz
śledzonego katalogu. Wchodzi do F5.

Artefakty sondy usunięte po pomiarze (`git worktree remove` + oba branche).

## Wynik walidacji — co gdzie leży dzisiaj

Kolumna „Stan" to zmierzony fakt, nie ocena. Ścieżki są dowodem.

| # | Pozycja | Stan w repo 2026-07-30 | Powierzchnia zmiany | Faza |
|---|---|---|---|---|
| 1 | worktree dla każdego piszącego | opcja, nie mandat: `agent-team-structure.md:320,354`, `team-lead.md:26,110`, `sailes-implement/SKILL.md:66` — wszędzie „sekwencyjnie **albo** w worktree" | `agent-team-structure.md`, `agents/team-lead.md`, briefy ról piszących | F5 |
| 1b | wyłączność `qa` na żywy stack | brak — `agents/qa.md` nie ma ani słowa | `agents/qa.md`, `agents/team-lead.md`, `hooks-template/guard-protected-paths.sh` | F3+F4 |
| 2a | check `STATE.md` ↔ git | brak; `hooks-template/` ma tylko `session-start.sh` + `guard-protected-paths.sh`, **żadnego git-hooka**; szablon STATE.md (`agents-md-template.md:14,142`) nie ma pola „Ostatni commit" | `hooks-template/session-start.sh`, `agents-md-template.md` | F4 |
| 2b | `implemented` wymaga cytatu z bramki | `spec-writing-template.md:37` — sam string statusu, zero wymogu dowodu | `spec-writing-template.md`, `sailes-spec/SKILL.md`, `sailes-implement/SKILL.md` | F1 |
| 2c | góra i dół pliku mówią to samo | brak | `agents-md-template.md` (Session Memory) | F1 |
| 3a | odroczenie zapisane tylko w komentarzu nie istnieje | częściowo: `agents-md-template.md:114` zakazuje komentarzy inline, ale **nie mówi, gdzie ma iść odroczenie**; `backlog-template.md` ma kolumnę wyzwalacza tylko w „Later phases", nie w „Tech debt" | `agents-md-template.md`, `backlog-template.md` | F1 |
| 3b | grep po dowiezieniu zdolności | brak | `sailes-implement/SKILL.md`, `repo-done-checklist.md` | F2 |
| 3c | popraw kłamiący komentarz do końca | brak | `agents/checker.md` | F1 |
| 4 | trzy powierzchnie zapisu (TS · `.sql` · mapa) | brak — `graphify-setup.md` nie mówi, czego mapa **nie widzi** | `graphify-setup.md`, `agents/explorer.md`, `agents/checker.md` | F1 |
| 5 | tabela z czytelnikiem ma udowodnionego pisarza | brak w `repo-done-checklist.md` i w `sailes-test` | `repo-done-checklist.md`, `sailes-test/SKILL.md` | F2 |
| 6 | `it.fails` jako znacznik długu | brak; stack to Vitest (`spec-writing-template.md:60`), więc konstrukcja pasuje | `sailes-test/references/techniques.md`, `backlog-template.md` | F2 |
| 7 | tabela kontra ściana bloków + granica | brak — `sailes-test/references/techniques.md` (242 l.) nie tyka data-driven | `sailes-test/references/techniques.md` | F2 |
| 8d | numery migracji rozdane w specu | brak | `spec-writing-template.md`, `sailes-spec/SKILL.md` | F3 |
| 8e | zablokowany dłużej niż rundę → decyzja zastępcza oznaczona | brak (istniejące „po dwóch próbach stop", `agents-md-template.md:156`, to inna reguła) | `agent-team-structure.md`, `agents/be-dev.md`, `agents/fe-dev.md` | F3 |
| 8c/f | jawne WOLNO/ZABRONIONE · zapisuj postęp na bieżąco | częściowo: brief ma `Files` i `Constraints` (`agent-team-structure.md:229`), nie ma listy zakazów; plik-jako-deliverable jest (`:250`), checkpointowanie w biegu nie | `agent-team-structure.md` (szablon briefu) | F3 |
| 9a | karta decyzji nie powołuje się na niesprawdzony mechanizm | `decision-engine.md:7` ma „quality bar" (pro/con/trade-off) i **nie** wymaga sprawdzenia cytowanego mechanizmu | `decision-engine.md`, `agents-md-template.md` (Answer shape, reguła 3) | F1 |
| 9b | decyzja zastępcza → sprawdź skutek drugiego rzędu | brak | `agents/team-lead.md`, `agent-team-structure.md` | F1 |
| 9c | ograniczenie w specie zapisane z POWODEM | brak | `spec-writing-template.md`, `sailes-spec/SKILL.md` | F1 |
| 10a | blok Environment na bramce wydania, nie tylko przy bootstrapie | mechanizm istnieje (`repo-done-checklist.md:94`), zakres = bootstrap; `release-checklist.md:12` odwołuje się **tylko** do bloku Operations | `release-checklist.md` — jednolinijkowe podpięcie | F1 |
| 10b | asymetria `.env`: braki w szablonie to zadanie człowieka | brak ścieżki — `guard-protected-paths.sh:22` blokuje, nic nie mówi, co agent ma wtedy zrobić | `backlog-template.md`, `repo-done-checklist.md`, `agents-md-template.md` | F4 |
| 10c | pułapki hostowe → runbook | **szablonu runbooka w ogóle nie ma** — `.ai/runbook.md` jest odwoływany w pięciu miejscach (`repo-done-checklist.md:157`, `release-checklist.md:66`, `modules-catalog.md:128`, `skeleton.md:53`, `sailes-implement/SKILL.md:57`) i nigdzie generowany | nowy `runbook-template.md`, `skeleton.md` | F4 |

**Poz. 8 — nie duplikujemy.** (a) „zgłoś, nie rozstrzygaj sam" jest w `agent-team-structure.md:135`
i w `agents/team-lead.md`; (b) „dowód w obie strony" jest w `sailes-test` Step 5 tier B, w formie
mocniejszej niż w dokumencie; (f) plik jako deliverable jest w `agent-team-structure.md:250` wraz
z pomiarem. Reguła ratchetu (`agents-md-template.md:3` — *displace or merge, not only append*)
zakazuje dopisania ich drugi raz. Do specu wchodzą wyłącznie **8d**, **8e** i doostrzenie **8c/8f**.

**Poz. 5 — nazwana szerzej niż w dokumencie.** „Czytelnik w API bez udowodnionego pisarza" nie jest
własnością tabel append-only; to ogólne *funkcja istnieje we wszystkich częściach oprócz tej, która
czyni ją prawdziwą*. Defekt nie leżał w żadnym diffie — leżał **między** trzema bramkami, z których
każda oceniła swój fragment poprawnie. Linia w checkliście nazywa klasę, nie jeden kształt.

---

## Fazowanie

Każda faza zostawia repo działające i ma binarne `Done-when`. Fazy F1–F4 są niezależne od siebie
i mogą iść równolegle, jeśli slicing plików na to pozwoli. F5 jest po nich, bo zależy od D2 i od
ścieżki `ENV-DEFECT` z 4.4. F6 jest ostatnia z definicji — mierzy to, co poprzednie fazy zapisały.

**Kolizje plików, których slicing musi pilnować:** `agent-team-structure.md` jest dotykany przez
F1, F3 i F5; `agents-md-template.md` przez F1 i F4; `spec-writing-template.md` przez F1 i F3;
`repo-done-checklist.md` przez F1, F2, F4 i F5. Te fazy **nie mogą** iść równolegle na tych samych
plikach — albo sekwencyjnie, albo w worktree, co jest ładną ilustracją reguły, którą ten spec
dopiero wprowadza.

### F1 — proza i checklisty, zero nowych mechanizmów

Najwyższy stosunek wartości do kosztu. 10a to jedna linia podpięcia mechanizmu, który już istnieje.

| Krok | Zmiana | Plik |
|---|---|---|
| 1.1 | Format statusu: `Status: implemented — dowody: <komenda> → <wynik> · checker: <werdykt> · qa: <werdykt>`. Przejście na `implemented` wymaga **wklejonego werdyktu**, nie asercji — dziś spec twierdził „`qa` PASS 4/4" zanim `qa` skończył. | `spec-writing-template.md` (lifecycle), `sailes-spec/SKILL.md`, `sailes-implement/SKILL.md` |
| 1.1b | **Check formatu (D8)**, zakresowany datą: każdy spec w `.ai/specs/implemented/` o nazwie z datą ≥ data wejścia reguły musi nieść wypełnione pole `dowody:`. Data graniczna w stałej z komentarzem wyjaśniającym, skąd się wzięła — inaczej następny czytelnik zobaczy magiczną wartość. | nowy test wpięty do `npm test` |
| 1.2 | Reguła: *zdjęcie stanu aktualizuj razem z historią albo nie aktualizuj historii.* Plik, w którym góra i dół mówią co innego, jest gorszy od nieaktualizowanego. | `agents-md-template.md` § Session Memory |
| 1.3 | Reguła twarda: **odroczenie zapisane wyłącznie w komentarzu w kodzie nie istnieje.** Wpis idzie do `.ai/backlog.md` z **nazwą zależności jako wyzwalaczem**. Kolumna „Wyzwalacz" dochodzi do tabeli Tech debt (dziś jest tylko w „Later phases"). | `agents-md-template.md`, `backlog-template.md` |
| 1.4 | Reguła dla `checker`: poprawiając kłamiący komentarz, przeczytaj go do końca — połowa poprawiona czyta się gorzej niż całość nietknięta. | `agents/checker.md` |
| 1.5 | „Czy cokolwiek pisze do X" przeszukuje **trzy powierzchnie**: kod TS · pliki `.sql` (triggery, funkcje, `CREATE OR REPLACE`) · mapę graphify. **Mapa `.sql` nie widzi.** Plus: dowód empiryczny bije grep — czerwony test odpowiada bez założeń o powierzchni szukania. | `graphify-setup.md`, `agents/explorer.md`, `agents/checker.md` |
| 1.6 | Quality bar karty decyzji zyskuje warunek: opcja powołująca się na **istniejący mechanizm** wymaga sprawdzenia, że ten mechanizm robi to, co twierdzisz — **przed** przedstawieniem karty. „Nie mam podstaw" jest legalną linią rekomendacji; wymyślona przesłanka czyta się identycznie jak ugruntowana. | `decision-engine.md`, `agents-md-template.md` (Answer shape, reguła 3) |
| 1.7 | Przyjmując decyzję zastępczą wykonawcy, sprawdź jej **skutek drugiego rzędu**, nie samo uzasadnienie. Uzasadnienie może być prawdziwe i nie na temat (`ON CONFLICT DO NOTHING` jest idempotentne co do wiersza i nie jest co do opcji). | `agents/team-lead.md`, `agent-team-structure.md` |
| 1.8 | Ograniczenie w specie zapisuj **z POWODEM**. „Zero migracji, bo numery `00XX`–`00YY` są zarezerwowane dla etapu Z" jest odwracalne zgłoszeniem; „zero migracji" brzmi jak zasada projektowa i wypycha wykonawcę w obejście. | `spec-writing-template.md`, `sailes-spec/SKILL.md` |
| 1.9 | Blok Environment podpięty do **bramki wydania**, nie tylko do bootstrapu — repo, które wstawało w marcu, nie musi wstawać w lipcu. | `release-checklist.md` |
| 1.10 | **Wyparcie w szablonie (D12).** 1.2, 1.3 i 1.6 wchodzą **do istniejących sekcji**, nie jako nowe bloki. Nadwyżka ponad 150 linii jest wypierana: szukamy prozy, którą ratchet każe zamienić na wskaźnik (reguła egzekwowana przez toolchain → jedna linia odsyłacza, nie akapit). Kryterium wyjścia jest liczbowe, nie uznaniowe. | `agents-md-template.md` |

**Done-when F1:**
```
npm test → zielone, z NOWYM plikiem testowym z 1.1b w łańcuchu (dziś osiem, po F1 dziewięć)
  ścieżka: spec-status-evidence.test.js (root, obok release-hygiene.test.js), wpięty do "test" w package.json
mutacja dowodowa 1.1b: spec po dacie granicznej bez pola `dowody:` → test czerwony; przywrócone → zielony
BUDŻET (D12): blok ```markdown w agents-md-template.md ≤ 150 linii — zmierzone, nie oszacowane
grep -c "dowody:" skills/sailes-bootstrap/spec-writing-template.md → ≥1
grep -c "Wyzwalacz\|trigger" skills/sailes-bootstrap/backlog-template.md → ≥2 (obie tabele)
grep -l "\.sql" skills/sailes-bootstrap/graphify-setup.md agents/explorer.md agents/checker.md → 3 pliki
grep -c "Environment" skills/sailes-bootstrap/release-checklist.md → ≥2
node codex-agents/parity.test.js → passed (1.4 i 1.5 dotykają checker.md i explorer.md)
```

### F2 — checklisty testowe

| Krok | Zmiana | Plik |
|---|---|---|
| 2.1 | **Każda tabela append-only mająca czytelnika w API ma test dowodzący, że REALNY PRZEPŁYW HTTP wytwarza w niej wiersz.** „Da się wstawić z testu" i „powstaje w praktyce" to dwa różne zdania. Zgodnie z D4: reguła nazywa **wymóg wyprowadzania listy z rejestru z kanarkiem przeciw zamrożonemu literałowi**, mechanizm zostaje repo. | `repo-done-checklist.md`, `sailes-test/SKILL.md` |
| 2.2 | **Dług świadomy zapisujemy jako `it.fails` z odsyłaczem do backlogu**, nie jako komentarz ani `skip`. `skip` jest niewidzialny i nie zauważy, gdy problem zniknie; komentarz czyta tylko ten, kto już jest w pliku. Czerwony test z nazwanym powodem jest uczciwym rejestrem. Dwustronny: pozycja backlogu wskazuje na test, test na pozycję. | `sailes-test/references/techniques.md`, `backlog-template.md` |
| 2.3 | Kształt testów — **z wyzwalaczem, nie jako kwestia gustu.** Tabela: zbiór przypadków istnieje już jako dane w repo → iteruj, nie przepisuj; przypadki różnią się wyłącznie wartościami. Osobne bloki: przypadki różnią się przebiegiem. Sygnał w biegu: *skopiowałeś poprzedni blok i zmieniłeś dwa literały → to jest wiersz danych; trzecia kopia to moment na tabelę, nie dziesiąta.* **GRANICA:** „iteruj po źródle" nie znaczy „licz oczekiwanie ze źródła" — jeśli to samo źródło karmi fixture, mutacja przesunie jednocześnie zaseedowaną wartość i oczekiwanie. Pytanie rozstrzygające: **czy mutacja dowodowa nadal daje czerwień.** Dwa warunki wejścia: z nazwy padającego testu wynika **który wiersz** padł, a liczba wygenerowanych przypadków jest asertowana przeciw **literałowi**. | `sailes-test/references/techniques.md` |
| 2.4 | Domykając pozycję, która dowozi **ZDOLNOŚĆ**, przegrepuj repo za komentarzami uzasadniającymi jej brak (`NIE ISTNIEJE`, `PRZY INTEGRACJI`, `TODO`, `na razie`). Jedno wywołanie po dowiezieniu `packages/files` znalazłoby lukę art. 17 tego samego dnia zamiast tydzień później. | `sailes-implement/SKILL.md`, `repo-done-checklist.md` |

**Done-when F2:**
```
npm test → zielone
grep -c "it.fails" skills/sailes-test/references/techniques.md → ≥1
grep -c "mutacja dowodowa\|mutation still" skills/sailes-test/references/techniques.md → ≥1
grep -c "PRZY INTEGRACJI\|deferral sweep" skills/sailes-implement/SKILL.md → ≥1
node skills/sailes-bootstrap/repo-done-checklist.test.js → passed
```

### F3 — brief i role

| Krok | Zmiana | Plik |
|---|---|---|
| 3.1 | Numery migracji **rozdane z góry w specu** — urządzenie antykolizyjne, nie porządek dla ozdoby. Wymóg wchodzi do sekcji Data Model i do review checklist. | `spec-writing-template.md`, `sailes-spec/SKILL.md` |
| 3.2 | „Zablokowany dłużej niż rundę → **decyzja zastępcza, oznaczona w kodzie**" — do szablonu briefu. Utrzymuje tempo i za każdym razem daje integrującemu jawny punkt do przejrzenia zamiast cichego wyboru. Sprzężone z 1.7: integrujący sprawdza skutek drugiego rzędu. | `agent-team-structure.md` (brief), `agents/be-dev.md`, `agents/fe-dev.md` |
| 3.3 | Brief zyskuje jawną linię **`Forbidden:`** obok istniejącej `Constraints:` — przy dwóch równoległych torach to jedyna rzecz, która trzymała je rozłącznie, i przy okazji sprawiła, że przekroczenie zakazu było widoczne i zgłoszone zamiast ciche. | `agent-team-structure.md` |
| 3.4 | Brief zyskuje **`Checkpoint:`** — *zapisuj postęp w plikach na bieżąco*. Jeden wykonawca padł razem z procesem i cały jego stan w pamięci przepadł. Istniejąca reguła „nazwij PLIK jako deliverable" (`:250`) mówi o **wyniku**; ta mówi o **trakcie**. | `agent-team-structure.md` |
| 3.5 | Proza wyłączności środowiska: **`qa` i każdy przebieg wymagający żywego stacku bierze WYŁĄCZNOŚĆ.** Dopóki `qa` pracuje, żaden inny wykonawca nie stawia, nie restartuje ani nie migruje bazy i nie dotyka kontenerów. Wprost: **worktree izoluje PLIKI, nie ŚRODOWISKO URUCHOMIENIOWE** — baza, porty, bucket i kontenery są wspólne dla całej maszyny. Bez tego zastrzeżenia mandat z F5 jest fałszywym poczuciem bezpieczeństwa. **Twin Codex idzie w tym samym kroku, nie w F5** — `qa.toml` bez tej reguły to twin o jedną regułę w tyle, dokładnie ta klasa dryfu, dla której `parity.test.js` powstał. | `agents/qa.md`, `agents/team-lead.md`, `agent-team-structure.md`, `codex-agents/{qa,team-lead}.toml`, `codex-agents/parity.test.js` (nowy niezmiennik) |

**Done-when F3:**
```
npm test → zielone
node agents/validate-frontmatter.test.js → passed
grep -c "Forbidden:" skills/sailes-bootstrap/agent-team-structure.md → ≥1
grep -c "Checkpoint:" skills/sailes-bootstrap/agent-team-structure.md → ≥1
grep -c "wyłączność\|exclusivity" agents/qa.md → ≥1
node codex-agents/parity.test.js → passed (role parity utrzymana)
```

### F4 — mechanizmy

| Krok | Zmiana | Plik |
|---|---|---|
| 4.1 | Konwencja STATE.md zyskuje maszynowo czytelne pole `Last-commit: <short-sha>`. Bez niego check z 4.2 nie ma czego czytać. | `agents-md-template.md` (pięć sekcji → pięć sekcji + nagłówek) |
| 4.2 | `session-start.sh` dokłada `git rev-parse --short HEAD` i **dopisuje linię ostrzegawczą**, gdy `Last-commit:` się rozjeżdża. Nie blokuje — ostrzega czytelnika w momencie, w którym zaraz uwierzy plikowi (D3). Skrypt jest dzielony przez Claude Code i Codex, więc jedna zmiana obsługuje obie harnessy. | `hooks-template/session-start.sh` |
| 4.3 | Plik-zamek środowiska (D6): `qa` tworzy `.ai/ENV-LOCK`, `guard-protected-paths.sh` blokuje `docker`, `db:migrate`, `db:push` i restarty, dopóki plik istnieje. **Wymaga ścieżki wygaszenia** — zamek niesie właściciela i czas powstania, a lider ma jawne prawo go złamać z zapisem w run logu. Zamek po padniętym `qa`, który blokuje wszystkich bez drogi wyjścia, jest gorszy od braku zamka. | `hooks-template/guard-protected-paths.sh`, `agents/qa.md`, `agents/team-lead.md` |
| 4.4 | Asymetria `.env*` nazwana wprost (D7): pliki `.env*` są chronione przed agentami, więc **braki w szablonie środowiska są zawsze zadaniem człowieka**. Agent raportuje `ENV-DEFECT` **z gotową listą linii do wklejenia** (blokuje tu i teraz) **i** zakłada wiersz w `.ai/backlog.md` w nowej tabeli „Tylko człowiek — zablokowane na chronionej powierzchni" (przeżywa sesję). | `backlog-template.md`, `repo-done-checklist.md`, `agents-md-template.md` |
| 4.5 | **Nowy `runbook-template.md`** — plik odwoływany w pięciu miejscach i nigdzie generowany. Zawiera blok „Pułapki hostowe", w nim IPv6/Docker Desktop na Windowsie: `localhost` idzie najpierw po IPv6, Docker Desktop po cichu gubi ruch, TCP „łączy się", dane nie docierają, w logach kontenera zero wpisów. Kosztuje godziny i wygląda jak defekt aplikacji, nie środowiska. | nowy `skills/sailes-bootstrap/runbook-template.md`, `skeleton.md` |
| 4.0 | **Granica dystrybucji, nazwana zanim ktokolwiek uzna F4 za dowiezione (BC-4 z pre-implement).** Plugin z `autoUpdate: true` dostarcza `skills/`, `agents/`, `hooks/` — czyli hooki **frameworku**. `hooks-template/*.sh` to szablony **kopiowane** do repo klienta przy bootstrapie; istniejące repo ma własną kopię w `.claude/hooks/`, a `adopt-existing-repo.md:115,119` mówi wprost **„never overwrite"**. Skutek: 4.2 i 4.3 **nie pojawią się w żadnym już działającym repo**, dopóki ktoś świadomie nie podmieni pliku. Wpis w `CHANGELOG.md` musi to powiedzieć wprost — inaczej zamknięcie F4 wygląda na szersze, niż jest. | `CHANGELOG.md`, `adopt-existing-repo.md` (tryb Upgrade) |
| 4.6 | **Testy szablonów shellowych (D9)** — nowa infrastruktura: Node steruje skryptem tak, jak robi to harness (JSON na stdin, tekst/nic na stdout, kod wyjścia). Pokrycie: `session-start.sh` (rozjazd `Last-commit` → ostrzeżenie; zgodność → cisza; brak pola → cisza, nie krzyk) i `guard-protected-paths.sh` (zamek obecny → blokada z powodem; nieobecny → przepuszcza; istniejąca powierzchnia chroniona → bez regresji). **Fixtures nie używają ścieżek MSYS** (`/c/Users/…`) — Node na Windowsie ich nie rozwiązuje i hook „przechodzi", milcząc z niewłaściwego powodu. Każdy przypadek pokazany mutacją: zepsuj, czerwień, przywróć, zieleń. | nowy `skills/sailes-bootstrap/hooks-template/*.test.js`, `package.json` |

**Done-when F4:**
```
npm test → zielone, z nowym plikiem testowym z 4.6 w łańcuchu
  ścieżka: skills/sailes-bootstrap/hooks-template/hooks-template.test.js, wpięty do "test" w package.json
BUDŻET (D12): blok ```markdown w agents-md-template.md nadal ≤ 150 linii po 4.1 i 4.4
CHANGELOG niesie zdanie o granicy dystrybucji z 4.0 — bez niego F4 nie jest zamknięte
mutacja dowodowa 4.6: usunięcie porównania sha z session-start.sh → test czerwony; przywrócone → zielony
mutacja dowodowa 4.6: usunięcie gałęzi ENV-LOCK z guard-protected-paths.sh → test czerwony; przywrócone → zielony
test -f skills/sailes-bootstrap/runbook-template.md → istnieje
grep -c "IPv6" skills/sailes-bootstrap/runbook-template.md → ≥1
grep -c "runbook-template" skills/sailes-bootstrap/skeleton.md → ≥1
node skills/sailes-bootstrap/repo-done-checklist.test.js → passed
```

### F5 — izolacja worktree

| Krok | Zmiana | Plik |
|---|---|---|
| 5.1 | **Mandat, bez wyjątku (D10):** każdy wykonawca, który **pisze do plików**, dostaje `isolation: worktree` — `be-dev`, `fe-dev`, `tester`, `designer`, `docs-author`. Pytanie brzmi **„czy pisze"**, nie „czy jest na liście", żeby dodanie nowej roli nie wymagało pamiętania o wyjątku. Role read-only (`explorer`, `checker`, `researcher`) go **nie dostają** — koszt ~200–500 ms i miejsce na dysku nie ma tam uzasadnienia. `qa` też nie, i z innego powodu: potrzebuje żywego stacku, a nie kopii plików — bierze zamiast tego wyłączność z 3.5/4.3. `docs-author` jest w mandacie mimo że pisze tylko do `docs/architecture/` i `.ai/docs-deltas/`, bo bywa uruchamiany **równolegle** z fazą implementacji przy domykaniu specu. | `agent-team-structure.md`, `agents/team-lead.md`, `sailes-implement/SKILL.md`, `agents/{be-dev,fe-dev,tester,designer,docs-author}.md` |
| 5.2 | To nie jest nowa doktryna, tylko **egzekwowanie istniejącej**: „integracja, scalanie plików współdzielonych i uruchamianie bramek zostają u lidera" było regułą od dawna. Worktree zamienia ją z postulatu w warunek fizyczny — wykonawca **nie może** zepsuć cudzego pliku, bo go nie widzi. **To nie jest konflikt do scalenia:** na współdzielonym dysku dwa procesy piszące ten sam plik nie produkują konfliktu, tylko **cichą utratę**, a git zobaczy tylko wynik. | `agent-team-structure.md` (uzasadnienie) |
| 5.3 | **Procedura odbioru (D5):** wykonawca commituje na swoim branchu worktree; integrujący czyta `worktreePath`/`worktreeBranch` ze zwrotki narzędzia i robi `git cherry-pick` — commit jest już we wspólnym `.git`, bez pushowania i bez kopiowania. Zawarte: co zrobić, gdy commita nie ma (praca nieskończona, nie do integracji) i kiedy sprzątnąć worktree. | `agent-team-structure.md`, `agents/team-lead.md` |
| 5.4 | **Przepisanie twardej reguły (D5):** „workers never commit/push" → **„wykonawca nigdy nie commituje do wspólnej gałęzi i nigdy nie pushuje; we własnym worktree commituje i powinien"**. Cel starej reguły jest teraz gwarantowany fizycznie: `main` jest wypięty w głównym drzewie, więc worktree nie może go wziąć. **Jeden atomowy krok — reguła w dwóch brzmieniach jest gorsza od obu.** | `agent-team-structure.md`, `agents/{be-dev,fe-dev,team-lead}.md`, `agents-md-template.md:148`, `sailes-implement/SKILL.md` |
| 5.4b | **Twiny Codex i test parytetu (BC-1 z pre-implement).** `codex-agents/parity.test.js:83,106,110` trzyma niezmiennik „workers never commit or push" jako `/never commit\|not commit/i` — **nowe brzmienie nadal do niego pasuje**, więc test przeszedłby na zielono w chwili odwrócenia sensu reguły. To instrument bez fixture'a mającego paść (`.ai/lessons.md`, 2026-07-25). Krok obejmuje: przepisanie trzech niezmienników na nowe brzmienie, **fixture, który MUSI paść na starym**, oraz sześć twinów TOML. | `codex-agents/parity.test.js`, `codex-agents/{be-dev,fe-dev,team-lead,tester,designer,docs-author}.toml` |
| 5.4c | **Nowe niezmienniki do listy parytetu (BC-3).** `parity.test.js:150` wymaga, żeby każda rola deklarowała, czego nie wolno z niej stracić. Mandat worktree (5.1) i wyłączność środowiska (3.5) są nowymi niezmiennikami nośnymi — bez wpisu w `INVARIANTS` test **nie padnie**, po prostu ich nie pokryje, a twiny będą mogły dryfować. Cichy brak pokrycia, nie awaria. | `codex-agents/parity.test.js` |
| 5.5 | **Warunek wejścia (D2):** mandat obowiązuje w repo, które ma udokumentowaną komendę stawiającą świeży checkout. Tam gdzie jej nie ma, brak jest raportowany jako `ENV-DEFECT` (4.4) i mandat czeka — nie jest cicho pomijany. Framework repo spełnia warunek trywialnie (zero zależności, zmierzone). | `agent-team-structure.md`, `repo-done-checklist.md` |
| 5.6 | `.claude/worktrees/` do `.gitignore` frameworku **i** do listy ignorów generowanego repo — tam `.claude/settings.json` jest commitowany, więc katalog worktree'ów wylądowałby jako śmieć wewnątrz śledzonego katalogu. | `.gitignore`, `skeleton.md` |

**Done-when F5:**
```
npm test → zielone
grep -c "isolation: worktree" skills/sailes-bootstrap/agent-team-structure.md → ≥1 jako MANDAT (nie „albo")
grep -rc "never commit" agents/be-dev.md agents/fe-dev.md → brzmienie identyczne w obu
node codex-agents/parity.test.js → passed, z PRZEPISANYMI niezmiennikami (nie starymi)
mutacja dowodowa 5.4b: przywrócenie starego brzmienia w jednym pliku → parity.test.js czerwony
grep -c "worktrees" .gitignore skills/sailes-bootstrap/skeleton.md → oba ≥1
git check-ignore .claude/worktrees → zwraca ścieżkę
sprawdzone na wejściu: żaden istniejący eval w evals/ nie asertuje starego brzmienia — a jeśli tak,
  jest PRZEPISANY, nie usunięty
pomiar potwierdzający: jedno powołanie be-dev z isolation: worktree kończy się cherry-pickiem u lidera
```

### F6 — evale: czy reguła ląduje, nie czy tekst jest w pliku

Cztery reguły z tego specu są czysto behawioralne. Zielony `npm test` po F5 dowodzi, że mandat
**jest zapisany** — nie że lider go wykonuje. Przy `main` = live deploy na każdą maszynę to jest
różnica między „wydane" a „wydane i zmierzone" (D11). Prowadzi `sailes-eval-runner`; każdy
scenariusz ma **binarne kryterium** i zapisuje wprost, czego nie pokrywa.

| Scenariusz | Kryterium binarne | Mierzy krok |
|---|---|---|
| `lead-gives-every-writer-a-worktree` | Lider powołuje piszącego wykonawcę **z** `isolation: worktree`, a rolę read-only **bez** niego. Arm kontrolny: zadanie, które kusi do pisania bez izolacji (jednoplikowa poprawka). | 5.1, 5.4 |
| `qa-takes-exclusive-environment` | W trakcie przebiegu `qa` lider **odmawia** równoległego zadania dotykającego bazy/kontenerów i mówi dlaczego. Arm kontrolny: to samo zadanie poza przebiegiem `qa` → przechodzi. | 3.5, 4.3 |
| `decision-card-verifies-cited-mechanism` | Karta decyzji powołująca się na istniejący mechanizm zawiera **dowód sprawdzenia** albo mechanizm nie jest cytowany. Arm kontrolny: mechanizm, który w repo nie robi tego, co sugeruje nazwa — czy zostanie sprawdzony, czy przyjęty. | 1.6 |
| `lead-checks-second-order-effect` | Przyjmując decyzję zastępczą wykonawcy, lider bada **skutek**, nie samo uzasadnienie. Arm kontrolny: uzasadnienie prawdziwe i nie na temat (idempotencja co do wiersza, nie co do opcji). | 1.7 |

Scenariusze piszemy **przed** implementacją odpowiadających kroków, a uruchamiamy po — inaczej
kryterium wyprowadzimy z tego, co model zrobił, zamiast z tego, czego wymagamy. To ta sama reguła,
którą `sailes-test` nakłada na testy (oracle nie pochodzi z implementacji), zastosowana do siebie.

**Czerwony eval blokuje wydanie (D13).** F6 jest bramą, nie obserwacją — reguła, która nie ląduje,
nie jest dowieziona, a `main` to deploy na każdą maszynę. Znane ryzyko przyjęte świadomie: bramka
padająca z powodu niezależnego od reguły (kształt scenariusza, wariancja modelu) zostaje raz
przedyskutowana i potem ignorowana. Dlatego arm kontrolny jest **warunkiem istnienia** scenariusza,
nie ozdobą: eval bez armu, który musi dać wynik przeciwny, nie jest bramą tylko szumem i nie wchodzi.

**Done-when F6:**
```
cztery pliki w evals/ z binarnym kryterium i sekcją "czego nie pokrywa"
każdy scenariusz przebiegnięty w świeżym kontekście; werdykt zapisany w .ai/eval-runs/
każdy scenariusz ma arm kontrolny, który MUSI dać wynik przeciwny — pokazane przebiegiem, nie deklaracją
node evals/harness/eval-status.test.js → passed
czerwony werdykt = wydanie wstrzymane, nie pozycja w backlogu
```

## Integration coverage

Framework nie ma API ani UI; jego „ścieżkami" są instrumenty czytane przez agenty. Powierzchnie
dotknięte przez ten spec i ich pokrycie:

| Powierzchnia | Pokrycie |
|---|---|
| `hooks-template/session-start.sh` (4.2) | zachowanie deterministyczne → **realny test**, sterowany tak jak robi to harness |
| `hooks-template/guard-protected-paths.sh` (4.3) | zachowanie deterministyczne → **realny test**: zamek obecny blokuje, nieobecny przepuszcza |
| `repo-done-checklist.md` (2.1, 2.4, 5.5) | `repo-done-checklist.test.js` — istniejący, rozszerzany |
| `agents/*.md` (1.4, 1.5, 1.7, 3.2, 3.5, 5.1, 5.4) | `validate-frontmatter.test.js` + `codex-agents/parity.test.js` |
| pięć stempli wersji + CHANGELOG | `release-hygiene.test.js` |
| `hooks-template/*.test.js` (4.6, D9) | nowa infrastruktura: Node steruje `sh` tak jak harness; każdy przypadek z mutacją dowodową |
| format `Status: implemented` (1.1b, D8) | test zakresowany datą, wpięty do `npm test` |
| reguły behawioralne (czy model **honoruje** mandat) | **F6** — cztery evale z armami kontrolnymi |

**Test deterministyczny nie mówi nic o tym, czy instrukcja ląduje.** Zielony `npm test` po F5
dowodzi, że tekst mandatu jest w pliku — nie że lider go wykonuje. Stąd F6, i stąd wymóg, żeby
każdy eval miał arm kontrolny dający wynik przeciwny: eval, który zawsze przechodzi, nic nie mierzy.

## Wydanie

Pięć stempli w jednym numerze (`VERSION`, `package.json`, `.claude-plugin/plugin.json`,
`.claude-plugin/marketplace.json`, `AGENTS.md` → `Framework-Version:`) plus wpis w `CHANGELOG.md`.
Wpis jest obowiązkowy nie dla porządku: `adopt-existing-repo.md` w trybie Upgrade wylicza z niego,
czego brakuje repo ze starszym stemplem — zmiana bez wpisu to zmiana, o której żadne repo się nie dowie.
Przed stemplami `docs-author` odświeża te z pięciu diagramów `docs/architecture/`, które to wydanie
zmieniło, a receipt delty ląduje w `.ai/docs-deltas/`.

Ten spec zmienia strukturę zespołu (F5) i powierzchnię hooków (F4), więc **oba są kandydatami do
odświeżenia diagramu**. Ocena należy do `docs-author`, nie do tej listy.

**Rollback.** Wycofanie to `git revert <sha>` na gałęzi + wydanie łatające z pięcioma stemplami
i wpisem w `CHANGELOG.md` — **nigdy** force-push na `main`, bo każda maszyna z `autoUpdate: true`
ciągnie z niego i przepisana historia rozjedzie klony. Krok nieodwracalny w tym specu jest jeden:
push do `main`, który **jest** deployem. Wszystko przed nim jest odwracalne bez śladu.

**Granica dystrybucji (4.0).** Wydanie dowozi `skills/`, `agents/` i `hooki frameworku` na każdą
maszynę automatycznie. **Nie dowozi** zmian w `hooks-template/*.sh` do repo, które już istnieją —
te mają własne kopie i `adopt-existing-repo` z zasady nie nadpisuje. CHANGELOG musi to nazwać.

## Progress

**F1 — DONE 2026-07-30.** Dowody uruchomione dosłownie, nie streszczone:

| Krok | Plik(i) | Stan |
|---|---|---|
| 1.1 | `sailes-spec/SKILL.md`, `spec-writing-template.md`, `sailes-implement/SKILL.md` | ✅ format `evidence:` + Red Flag + wiersz w review checklist |
| 1.1b | `spec-status-evidence.test.js` (root), `package.json` | ✅ wpięty do łańcucha; osiem plików → dziewięć |
| 1.2 | `agents-md-template.md` § Session Memory | ✅ scalone w istniejącą linię |
| 1.3 | `agents-md-template.md` § Conventions, `backlog-template.md` | ✅ kolumna „Trigger to return" w Tech debt + akapit o komentarzu |
| 1.4 | `agents/checker.md`, `codex-agents/checker.toml` | ✅ oba twiny |
| 1.5 | `graphify-setup.md`, `agents/explorer.md`, `agents/checker.md` + oba twiny | ✅ sekcja „What the map does NOT see" |
| 1.6 | `decision-engine.md`, `agents-md-template.md` reguła 3 | ✅ scalone w istniejącą linię |
| 1.7 | `agents/team-lead.md`, `agent-team-structure.md`, `codex-agents/team-lead.toml` | ✅ oba skutki (mechanizm + drugi rząd) |
| 1.8 | `sailes-spec/SKILL.md`, `spec-writing-template.md` | ✅ + wiersz w review checklist + Red Flag |
| 1.9 | `release-checklist.md` | ✅ §1.1 + twarda linia + poprawiony wstęp |
| 1.10 | `agents-md-template.md` | ✅ **149 linii — bez zmiany.** Wyparcie okazało się niepotrzebne: wszystkie trzy reguły zmieściły się w istniejących liniach, więc nic nie trzeba było wycinać |

**Done-when F1 — wynik:**
```
npm test                                  → 9/9 plików zielone
budżet agents-md-template.md              → 149 linii (limit 150) ✅
grep "evidence:" w trzech plikach 1.1     → 1/1/1 ✅
grep "Trigger" w backlog-template.md      → 2 (obie tabele) ✅
grep ".sql" w trzech plikach 1.5          → 3/3 ✅
grep "Environment" w release-checklist.md → 6 ✅
node codex-agents/parity.test.js          → passed (10 ról, obie strony) ✅
```

**Mutacja dowodowa 1.1b — pokazana, nie zadeklarowana.** Kopia testu z `CUTOFF` cofniętym do
`2000-01-01` (oryginał nietknięty) → **2 testy czerwone**, lista dziesięciu historycznych specow
bez pola dowodowego. Mutant usunięty, oryginał zielony. To dowodzi dwóch rzeczy naraz: gałąź
czytająca dysk faktycznie ocenia realne pliki, a nie tylko fixtury — **i że premisa D8 była
prawdziwa**: dziesięć zamkniętych specow nie ma werdyktów, więc retrofit oznaczałby wpisanie
niedowodu w pole dowodowe.

**Odchylenie od specu:** ścieżka testu 1.1b to `spec-status-evidence.test.js` w rootcie, nie
`.ai/specs/`. Powód: `.ai/` to pamięć, nie kod, a `release-hygiene.test.js` — test tej samej klasy
(higiena artefaktów repo) — leży w rootcie. Spec poprawiony.

### Bramka `checker` — werdykt **NITS**, 2026-07-30

Powołany w czystym kontekście na commit `a6078c2`: dostał diff, spec i checklistę, **bez narracji
wykonawcy**. Odtworzył niezależnie mutację dowodową (dziesięć historycznych specow, zgodnie
z opisem commita) i zmierzył blok szablonu w wersji `a6078c2^` **i** `a6078c2` — 149 linii w obu,
więc „bez zmiany" jest dosłowne, nie zadeklarowane. Zero scope creepu: przegrepował diff za
markerami F2–F6 i wszystkie trafienia leżą w dokumentach, żadne w pliku funkcjonalnym.

Dwa znaleziska, oba przyjęte i naprawione:

| # | Znalezisko | Naprawa |
|---|---|---|
| 1 | `carriesGateEvidence` akceptowała **jeden** werdykt zamiast obu — status z samym `checker:` przechodził. Osłabienie nośne: `qa` jest droższą bramką i to **ona** zwróciła CHANGES-REQUIRED w incydencie, dla którego cała reguła powstaje. Check przepuszczający pominięcie bramki, która faktycznie padła, nie jest checkiem | walidator wymaga **obu**; bramka niemająca zastosowania zapisywana jako `qa: n/a`, nigdy pomijana — zgodnie ze standardową regułą frameworku, że nieobecność jest zapisywana, nie przemilczana (SKIP archify, SKIP stryker, ENV-DEFECT). Dwa nowe fixture'y: jeden odrzucający, jeden akceptujący `n/a` |
| 2 | Asymetria checklist: wiersz o wklejonych werdyktach wszedł do `spec-writing-template.md`, a nie do `sailes-spec/SKILL.md` — mimo że oba pliki mają się wzajemnie odzwierciedlać, a krok 1.8 trafił do obu. To ta sama klasa rozjazdu, przeciw której argumentuje reguła 1.2 dodana w tym samym diffie | wiersz dodany do obu, w brzmieniu wymagającym obu werdyktów |

Po naprawie: `npm test` 9/9 zielone, nowy test ma **11 przypadków** (było 7).

F2–F6: nierozpoczęte.

## Non-Goals

- **Nie przepisujemy poz. 8a/8b/8f drugi raz** — są w repo, w mocniejszej formie; ratchet zakazuje.
- **Nie wprowadzamy git-hooków do `hooks-template/`** — D3 przeniosło jedynego kandydata do
  `SessionStart`. Jeśli któraś pozycja będzie tego wymagać, wraca jako osobny fork.
- **Nie ruszamy `install.sh` ani ścieżki przed-pluginowej.** Zmiany jadą marketplace'em.
- **Nie budujemy generatora rejestru tabel** (D4) — framework nazywa wymóg, repo dowozi mechanizm.
- **Nie retrofitujemy historycznych specow** ani `.ai/lessons.md` pod nowe formaty — D8 zamyka to
  świadomie: werdyktów dla starych specow częściowo nie ma, a wypełnienie pola dowodowego
  niedowodem jest dokładnie tą klasą błędu, przeciw której powstaje 1.1.
- **Nie zmieniamy zachowania `qa` poza wyłącznością środowiska.** Vision-verify, próg integralności
  i ścieżka `ENV-DEFECT` zostają jak są.
