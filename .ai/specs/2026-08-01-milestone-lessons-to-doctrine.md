# Wnioski 08-01 → doktryna — spec

Status: in-progress — obie fazy napisane i zielone lokalnie (1.25.2, 1.26.0); **bramki `checker`
i `qa` NIE zostały uruchomione** (człowiek wyłączył delegację w tej sesji), więc spec nie może
dostać `implemented` — status niesie wklejone werdykty, a nie ma czego wkleić. Nic nie jest
wypchnięte na `main`.
Source: `skile do inspiracji/wnioski z projektow/2026-08-01-wnioski-do-sailes-app-builder.md`
Precedes: 1.26.0
Related: `.ai/specs/implemented/2026-07-30-sailerem-lessons-to-doctrine.md` (poprzedni zestaw, 1.25.0)

## TLDR

Zestaw wniosków z domknięcia kamienia M1c na repo klienta niesie **dziesięć punktów, z czego
dziewięć to realne luki tego frameworka** — zweryfikowane w plikach, nie przyjęte na słowo. Trzy
z nich (`Done-when` vs lista plików, powierzchnia API jako artefakt maszynowy, macierz własności
plików) dotyczą **czego spec nie każe sprawdzić**; cztery (baza worktree, `.env` dla `qa`, właściciel
`ENV-LOCK`, commit dla `docs-author`) to defekty harnessu/szablonu, na które framework nie ma
obejścia; dwa to rozszerzenia istniejących reguł.

Weryfikacja **skorygowała jeden wniosek i znalazła jeden defekt, którego wnioski nie widzą** —
szczegóły w ledgerze niżej. Obie korekty zmieniają kształt naprawy punktu 8, więc są bramkujące,
nie kosmetyczne.

## Ledger weryfikacji

Każdy wiersz sprawdzony w plikach tego repo. `POTWIERDZONY` = luka istnieje i mechanizm zgadza się
z opisem. `SKORYGOWANY` = zjawisko realne, przesłanka albo naprawa opisana błędnie.

| # | Wniosek | Werdykt | Dowód w repo |
|---|---|---|---|
| 1 | `Done-when` nie pokrywa listy WOLNO | **POTWIERDZONY** | `sailes-spec/SKILL.md:41,133` wymaga binarnego `Done-when` **per faza** i nic więcej; brief niesie `Files:` (`agent-team-structure.md:291`) i `Verification:` (`:309`) bez żadnego wiązania między nimi; `checker.md:13-16` ocenia diff vs spec — nie ma sekcji „czego diff nie robi" |
| 2 | Powierzchnia API powinna być maszynowo czytelna | **POTWIERDZONY** | `sailes-spec/SKILL.md:95` i `spec-writing-template.md:47` opisują **API & UI Surface** prozą („routes, server actions, pages"); zero wymogu formatu, zero checku równości zbiorów |
| 3 | Równoległość czyta się z macierzy własności plików | **POTWIERDZONY** | `agent-team-structure.md:133` każe „slice for file-disjointness", ale nie mówi, **skąd** lider bierze kolejność dispatchu; `sailes-implement/SKILL.md` nie ma sekcji ścieżki krytycznej w ogóle |
| 4 | Czwarta oś kolizji: współdzielony magazyn pnpm + rdzenie | **POTWIERDZONY** | trzy osie są w doktrynie — pliki→worktree (`agent-team-structure.md:144`), środowisko→wyłączność (`:140`), kontrakt→zamrożenie (`:124`). Czwartej nie ma nigdzie; nie ma też reguły „policz i rozbij po linii poleceń przed `taskkill`" ani zakazu zabijania procesów edytora/MCP |
| 5 | Komentarz opisujący zachowanie gnije | **CZĘŚCIOWY** | `checker.md:23-26` już niesie „dokończ czytanie kłamiącego komentarza"; `sailes-implement/SKILL.md:59-68` niesie sweep po dostarczeniu zdolności — ale jego wzorzec grepa (`DOES NOT EXIST|NIE ISTNIEJE|TODO|for now|na razie`) łapie komentarz mówiący **„czegoś nie ma"**, a nie ten, który bił w tym przebiegu: komentarz twierdzący, że **coś JEST egzekwowane** |
| 6 | „Brak commita = nieskończone" nie chroni przed utratą | **POTWIERDZONY + KONFLIKT** | szablon briefu `:286` niesie „No commit = not finished"; brak reguły „commituj często, choćby `WIP:`". **Konflikt do rozstrzygnięcia:** `team-lead.md:29` mówi wprost *„read that as the signal it is, rather than salvaging a half-written tree"* — czyli dziś doktryna każe **nie** zaglądać do worktree, a wniosek 6 każe zaglądać |
| 7 | Worktree z nieaktualnej bazy | **POTWIERDZONY** | żadnego wystąpienia `merge-base` ani weryfikacji bazy worktree w `skills/` i `agents/`; `team-lead.md:29` opisuje tylko odbiór pracy (`git log <branch>` → `cherry-pick`), nie wejście |
| 8 | Rola `qa` strukturalnie niewykonalna | **POTWIERDZONY, naprawa SKORYGOWANA** | `settings-template.json:33-34` odmawia `Read(./.env)` **i** `Read(./.env.*)` → `.env.example` też; `guard-protected-paths.sh:46` blokuje **każdy** payload zawierający `.env`. **Ale:** sonda empiryczna (payload `Edit` na `package.json` z proponowanym skryptem `dev`) → `exit=2`, `BLOCKED`. Literał `.env` w zwersjonowanym pliku rzeczywiście nie łamie guarda **przy uruchamianiu** — łamie go **przy autorstwie**. Agent nie może wpisać tej naprawy; może ją wpisać tylko człowiek albo generator, zanim guard powstanie |
| 8b | *(nie z wniosków — znalezione przy weryfikacji)* | **NOWY DEFEKT** | `settings-template.json:57` ma `"matcher": "Edit\|Write"`. Guard niesie sekcję *Protected command surface (Bash tool_input.command)* (`:37-42`) — **która w repo Claude'a nigdy nie strzela**, bo `Bash` nie jest w matcherze. `push --force` i `db:migrate:prod` łapie jeszcze `permissions.deny`; `reset --hard` i `.env` w komendzie Bash **nie łapie nic**. Przesłanka wniosku 8 („guard blokuje każdą komendę Bash z literałem `.env`") jest **fałszywa dla wysyłanego szablonu** — prawdziwa dopiero, gdy repo klienta dołożyło matcher `Bash` samo. Test `hooks-template.test.js` woła skrypt bezpośrednio, więc jest zielony i tej dziury nie widzi |
| 9.1 | `ENV-LOCK` nie zna właściciela | **POTWIERDZONY, ZNANY** | `guard-protected-paths.sh:24-34` blokuje na **obecność** pliku, bez porównania właściciela. `.ai/audits/2026-07-30-…:113,157` nazwał to przed wdrożeniem („kształt ścieżki wygaszenia nie jest jeszcze zaprojektowany") i wypuszczono mimo to. Wniosek „zgłoszone 2026-07-31, nadal nienaprawione" — zgadza się |
| 9.2 | Klasyfikator zablokował commit `docs-author` | **POTWIERDZONY** | `docs-author.md:38` **nakazuje** commit we własnym worktree; `settings-template.json:21-31` dopuszcza `git status:*` i `git diff:*`, **nie** `git add`/`git commit`/`git log`. Doktryna każe robić rzecz, której szablon uprawnień nie przepuszcza |
| 9.3 | `git worktree remove` przewraca się na Windowsie | **POTWIERDZONY** | zero wystąpień `robocopy`, `worktree remove`, `Filename too long` w `skills/`, `agents/`, `.ai/lessons.md` |
| 10 | Rzeczy do ochrony | **CZĘŚCIOWO OBECNE** | mutacje: `sailes-test/SKILL.md:107` już wymaga „every surviving mutant killed **or explained in writing**" — imienne rozliczenie ocalałych jest. Nie ma **delty** wyniku (spadek 94,07→90,98 przy zielonym progu) ani nazwanej kategorii **równoważnika**. „Testy pisz, przebiegu nie uruchamiaj" **nie istnieje w frameworku** — to instrukcja z repo klienta, więc byłby to **dodatek**, nie ochrona |

**Stan testów przed zmianą:** `npm test` zielony w całości (hooki, walidator TOML, walidator
frontmatteru ról, reporter proweniencji evali, higiena wydania — pięć stempli na 1.25.1).

## Decyzje człowieka (2026-08-01)

| Pytanie | Wybór | Skutek |
|---|---|---|
| Q1 zakres wydania | **A** — 1.25.2 (naprawy) + 1.26.0 (doktryna) | faza 1 zamknięta, faza 2 osobno |
| Q2 lokalny env | **A** — podział wg ryzyka | `.env` i `.env.example` należą do agenta; prod/staging i materiał kluczowy dalej denied; marker produkcyjny ostrzega przy starcie sesji |
| Q3 matcher `Bash` | A (rekomendacja przyjęta domyślnie) | `Bash\|Edit\|Write` w PreToolUse |
| Q4 worker bez raportu | **A, w wersji rozszerzonej przez człowieka** — drabina obserwacji zamiast samego `git log` | metadana to obserwacja, treść to integracja; lider pyta agenta (`SendMessage`/task tools) **przed** dyskiem, potem czyta deklaracje, potem metadane i czasy modyfikacji; treść, kopiowanie i cherry-pick niezacommitowanej pracy dalej zakazane. Do tego konwencja `WIP:` = checkpoint vs commit = deklaracja |
| Q5 powierzchnia API | A (rekomendacja przyjęta domyślnie) | `yaml` w specu, check po stronie repo klienta |
| Q6 właściciel `ENV-LOCK` | A (rekomendacja przyjęta domyślnie) | `token:` w pliku + `SAILES_ENV_LOCK` u posiadacza; model zagrożenia = kolizja, nie atak |
| Delegowanie i kontrola nad agentami | **osobny spec zaraz po tym** | nie wchodzi do 1.26.0 |

## Fazy

### Faza 1 — 1.25.2, naprawy harnessu i szablonu · **ZROBIONE**

D10 (env wg ryzyka + skrypt `dev`), D11 (matcher `Bash`, `git add/commit/log` w allow, token w
`ENV-LOCK`).

**Done-when:** `npm test` zielony w całości przy pięciu stemplach na 1.25.2, a nowe zachowania mają
dowód detekcji.

```
npm test → framework-version-check ✅ · codex parity (10 ról) ✅ · eval-status ✅
           release-hygiene ✅ (five stamps at 1.25.2) · spec-status ✅
           repo-done-checklist ✅ · hooks-template ✅ (22 testy, 0 failing)

mutacja dowodowa: wzorzec guarda cofnięty do przed-1.25.2 `*'.env'*`
  → FAIL „the LOCAL .env is NOT blocked — this is the fixture that must NOT fire" (1 failing)
  → przywrócone → 0 failing
```

Pokrycie nowych zachowań: posiadacz przechodzi własny zamek · obcy token dalej blokowany · zamek
bez tokenu blokuje wszystkich (zgodność wstecz) · lokalny `.env` przechodzi w pięciu kształtach
wywołania, w tym autorstwo skryptu `dev` · prod/staging dalej blokowane w czterech · `Object.keys`
nie jest materiałem kluczowym · ostrzeżenie o markerze produkcyjnym nazywa klucz i **nie drukuje
wartości** · czysty `.env` i brak `.env` są ciche.

### Faza 2 — 1.26.0, doktryna · **NAPISANE, bramki niedomknięte**

D1 (pokrycie listy plików przez `Done-when` — `sailes-spec`, szablon, brief), D2 (`checker` otwiera
werdykt sekcją „czego diff NIE robi"), D3 (powierzchnia API jako `yaml`), D4 (obie mapy w ścieżce
krytycznej, dispatch po przecięciu zbiorów), D5 (czwarta oś kolizji + trzy reguły), D6 (reguła przed
`taskkill` w Hard Safety Rules obu plików), D7 (druga klasa wzorca w sweepie + docs-delta jako drugie
czytanie powierzchni), D8 (drabina obserwacji + `WIP:`), D9 (weryfikacja bazy worktree), D12
(`robocopy /MIR` na Windowsie, delta wyniku mutacji, równoważniki po imieniu).

**Done-when:** `npm test` zielony przy pięciu stemplach na 1.26.0 → **spełnione**. Trzy evale dodane
z ramieniem kontrolnym, które MUSI dać wynik przeciwny; `checker`-owy niesie drugie ramię przeciw
nauczeniu się wymyślania braku.

**Czego NIE ma i to jest luka, nie formalność:** trzy nowe evale **nie zostały uruchomione**, a
bramki `checker` i `qa` nie zostały wywołane — delegacja była w tej sesji wyłączona przez człowieka.
Zmiany doktrynalne są dokładnie tą klasą, o której framework mówi, że test o niej nic nie orzeka:
zielony `npm test` dowodzi, że pliki są spójne, a nie że instrukcja trafia. **To jest warunek
wejścia do wydania, nie do commita.**

## Open Questions — pozostałe

---

**Q1 — Zakres wydania.** ✅ **A** — 1.25.2 + 1.26.0. Dwanaście zmian to dużo na jedno wydanie, a cztery z nich to naprawy
harnessu/szablonu, które da się wypuścić bez reszty.

- **A (rekomendacja) — dwa wydania: 1.25.2 (naprawy) + 1.26.0 (doktryna).** 1.25.2 bierze punkty
  8, 8b, 9.1, 9.2 — cztery zmiany w dwóch plikach szablonu, wszystkie z istniejącym testem do
  rozszerzenia. ✅ rola `qa` odblokowana w dniach, nie tygodniach; ✅ mała łatka = mały diff do
  oceny. ⚠️ dwa przebiegi bramki wydania zamiast jednego.
- **B — jedno wydanie 1.26.0 ze wszystkim.** ✅ jeden CHANGELOG, jedna delta architektury.
  ⚠️ `qa` zostaje niewykonalne, dopóki nie domkniemy dwunastu punktów, w tym trzech wymagających
  nowych evali.
- **C — tylko naprawy, doktryna do backlogu.** ✅ najtaniej. ⚠️ punkt 1 zmierzony **trzy razy w
  jednym kamieniu** — odłożenie go znaczy, że zmierzy się czwarty raz.

---

**Q2 — Punkt 8: jak `.env` ma dojechać do procesu, skoro guard blokuje też autorstwo naprawy.**
Sonda potwierdziła, że agent nie wpisze skryptu `dev` z literałem `.env` do `package.json`.

- **A (rekomendacja) — zawęź guarda do ścieżki pliku, nie do całego payloadu.** Blokuj, gdy
  `file_path` wskazuje na `.env*`, a nie gdy gdziekolwiek w payloadzie pada te cztery znaki.
  ✅ sekret dalej nienaruszalny, a `--env-file-if-exists=../../.env` w `package.json` da się
  napisać; ✅ znika cała klasa fałszywych alarmów (dokumentacja, komentarze, `.env.example`
  w prozie). ⚠️ payload `Bash` nie ma `file_path`, więc dla komend potrzeba osobnej gałęzi —
  wiąże się z Q3.
- **B — skrypt `dev` ląduje w szablonie generowanego repo i nikt go nigdy nie edytuje.**
  ✅ dokładnie to, co proponują wnioski; ✅ zero zmian w guardzie. ⚠️ nie działa dla **istniejących**
  repo — a to one mają dziś zepsute `qa`; naprawa wymaga człowieka przy klawiaturze w każdym.
- **C — jawny wyjątek na literał `--env-file-if-exists` w guardzie.** ✅ najwęższa możliwa zmiana.
  ⚠️ wyjątek na literał jest dokładnie tym, co następny agent obejdzie, pisząc go inaczej.

---

**Q3 — Punkt 8b: matcher `Bash` w szablonie ustawień.** Guard ma sekcję komend, która nigdy nie
strzela.

- **A (rekomendacja) — dołóż `Bash` do matchera PreToolUse i test, który to udowadnia na poziomie
  konfiguracji, nie skryptu.** ✅ `reset --hard` i zapisy przez powłokę wreszcie blokowane;
  ✅ szablon zaczyna zgadzać się z własnym komentarzem i z bliźniakiem Codeksa
  (`codex-config-template.md:69` **ma** matcher `Bash`). ⚠️ każda komenda Bash przechodzi przez
  hook — koszt milisekund, ale na każdym wywołaniu; ⚠️ razem z Q2/A trzeba przemyśleć, co znaczy
  „`.env` w komendzie" (`cat .env` blokować, `pnpm dev` nie).
- **B — usuń martwą sekcję ze skryptu i zostaw `permissions.deny` jako jedyną obronę komend.**
  ✅ szablon przestaje kłamać o tym, co robi. ⚠️ `reset --hard` traci obronę zupełnie, a jest na
  liście Hard Safety Rules.
- **C — osobny spec.** ✅ nie rozdyma tego wydania. ⚠️ to defekt bezpieczeństwa w wysyłanym
  szablonie, znaleziony dziś; odkładanie go wymaga powodu mocniejszego niż rozmiar diffu.

---

**Q4 — Punkt 6: konflikt z `team-lead.md:29`.** Dziś doktryna mówi *„worker bez commita nie
skończył — czytaj to jako sygnał, zamiast ratować na wpół napisane drzewo"*. Wniosek każe przed tym
werdyktem zajrzeć do worktree.

- **A (rekomendacja) — rozdziel dwie różne rzeczy: `git log` (czytanie deklaracji) wolno zawsze,
  `git status` z ratowaniem niezacommitowanych plików dalej nie.** ✅ łapie realny przypadek —
  praca **była zacommitowana**, zgubił się raport, nie robota; ✅ zostawia nietkniętą regułę, która
  powstała po tym, jak lider scalił plik w połowie edycji. ⚠️ granica jest cienka i lider pod presją
  ją przekroczy; wymaga jednego zdania, które mówi, **dlaczego** akurat tu.
- **B — pełne „sprawdź worktree" bez rozróżnienia.** ✅ prostsze do zapamiętania. ⚠️ kasuje regułę
  zmierzoną 2026-07-30 i najprawdopodobniej odtworzy jej defekt.
- **C — nie ruszaj doktryny; dołóż tylko `WIP:` do briefu.** ✅ zero ryzyka regresji.
  ⚠️ zostawia niezmieniony przypadek „dwa razy dziś praca była na dysku mimo braku raportu".

---

**Q5 — Punkt 2: gdzie stoi próg dla powierzchni API.**

- **A (rekomendacja) — blok `yaml` obowiązkowy w specu, check tylko w wygenerowanym repo.**
  ✅ framework wymusza format, klient dostaje egzekwowanie dopasowane do swojego routera;
  ✅ `sailes-spec` nie musi wiedzieć, czy repo ma Fastify, czy Next. ⚠️ dwa miejsca do utrzymania.
- **B — blok `yaml` + gotowy skrypt sprawdzający w szablonie hooków.** ✅ egzekwowanie od pierwszego
  dnia repo. ⚠️ skrypt musi znać sposób wyliczania tras — a to jest per stack, więc szablon albo
  będzie działał dla jednego stacku, albo będzie pusty.
- **C — sama konwencja w checkliście, bez formatu.** ✅ najtaniej. ⚠️ to jest dokładnie stan
  dzisiejszy, który przepuścił trzy luki.

---

**Q6 — Punkt 9.1: właściciel `ENV-LOCK`.** Łatka jest zaprojektowana od 2026-07-30 i niewdrożona.

- **A (rekomendacja) — wdroż teraz, token właściciela w pliku + zmienna w środowisku roli.**
  ✅ zamyka defekt, który zablokował `qa` samo na sobie; ✅ `hooks-template.test.js:220-259` ma już
  fixture'y do rozszerzenia o „właściciel przechodzi". ⚠️ trzeba rozstrzygnąć, skąd guard bierze
  tożsamość wołającego — payload hooka jej nie niesie, więc kandydat to zmienna środowiskowa,
  którą worker może podrobić.
- **B — zamek wygasa po czasie zamiast znać właściciela.** ✅ nie wymaga tożsamości.
  ⚠️ `qa` blokuje się samo przez cały okres ważności; przesuwa problem, nie usuwa.
- **C — dalej odkładać.** ✅ zero pracy. ⚠️ drugie wydanie z rzędu ze znanym, nazwanym defektem.

---

## Szkic zmian (po bramce — nic z tego nie jest jeszcze zamówione)

Poniższe **nie jest planem do wykonania**, tylko mapą tego, czego dotyczą pytania wyżej. Fazy,
`Done-when`, testy i evale piszę po odpowiedziach.

| ID | Zmiana | Pliki | Zależy od |
|---|---|---|---|
| D1 | Przy briefie fazy każda pozycja listy plików wskazuje warunek `Done-when`, który ją wymusza; pozycja bez warunku to luka albo zbędny wpis — rozstrzygana przy pisaniu briefu | `sailes-spec/SKILL.md`, `spec-writing-template.md`, `agent-team-structure.md` (format briefu) | — |
| D2 | `checker` dostaje obowiązkową sekcję werdyktu *„czego diff NIE ROBI, a spec wymaga"* — przejazd po powierzchni, nie po zmienionych liniach | `agents/checker.md` | D1 |
| D3 | Powierzchnia API jako blok `yaml` (metoda + ścieżka + faza) | `sailes-spec/SKILL.md`, `spec-writing-template.md` | **Q5** |
| D4 | Sekcja ścieżki krytycznej niesie **oba** rysunki: graf pojęć i macierz rozłączności plików; kryterium dispatchu = przecięcie zbiorów plików, nie strzałka | `sailes-implement/SKILL.md`, `agent-team-structure.md` | — |
| D5 | Czwarta oś kolizji nazwana (współdzielony magazyn pnpm + rdzenie); lider nie odpala bramek, gdy wykonawca stawia worktree | `agent-team-structure.md`, `agents/team-lead.md` | — |
| D6 | Reguła przed `taskkill`: policz i rozbij po linii poleceń; nigdy nie zabijaj procesów edytora ani serwerów MCP | `AGENTS.md` (Hard safety rules), `agents-md-template.md` | D5 |
| D7 | Sweep po dostarczeniu zdolności dostaje drugą klasę wzorców — komentarz twierdzący, że coś **JEST** egzekwowane; docs-delta opisana jako drugie niezależne czytanie powierzchni, nie kwit | `sailes-implement/SKILL.md`, `sailes-docs` | — |
| D8 | `WIP:` w briefie: commituj często; „brak commita = nieskończone" chroni przed zgadywaniem, nie przed utratą procesu | `agent-team-structure.md`, `agents/*.md` (role piszące) | **Q4** |
| D9 | Weryfikacja bazy worktree przed pracą — `git log --oneline -3` + nazwany plik dowodowy w briefie | `agent-team-structure.md`, `agents/team-lead.md` | — |
| D10 | Skrypt `dev` ładujący env bez łamania guarda + zawężenie guarda | `settings-template.json`, `hooks-template/guard-protected-paths.sh`, `skeleton.md` | **Q2** |
| D11 | Matcher `Bash` w PreToolUse; `git add`/`commit`/`log` w `permissions.allow`; token właściciela w `ENV-LOCK` | `settings-template.json`, `guard-protected-paths.sh`, `hooks-template.test.js` | **Q3**, **Q6** |
| D12 | Znana procedura sprzątania worktree na Windowsie (`robocopy /MIR`); delta wyniku mutacji obok wartości bezwzględnej; nazwana kategoria równoważnika | `agent-team-structure.md`, `sailes-test/SKILL.md`, `.ai/lessons.md` | — |

## Non-goals

- Naprawa harnessu Claude Code (baza worktree z punktu 7, klasyfikator uprawnień z 9.2) — to nie
  jest nasz kod. Framework dostaje **obejście i zgłoszenie**, nie naprawę.
- Przenoszenie czegokolwiek z tego zestawu do repo klienta — to repo generuje reguły, nie stosuje
  ich u siebie za klienta.
- Punkt 10 jako zmiana: cztery z pięciu rzeczy „do ochrony" są już w doktrynie i **nic nie zagraża
  im dzisiaj**. Ochrona przed usprawnieniem, którego nikt nie proponuje, to praca bez odbiorcy.
