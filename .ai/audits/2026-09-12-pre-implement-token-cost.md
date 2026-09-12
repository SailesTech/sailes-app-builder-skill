# Pre-Implement Report: `.ai/specs/2026-09-12-token-cost-of-running.md`

Data: 2026-09-12 · Framework 1.32.0 · target 1.33.0

## Verdict: READY-WITH-FIXES

Fundament jest dobry, ale P1 jest zaprojektowane pod kształt `STATE.md`, którego zmierzone repo nie
ma. Poza tym zmiana nie dociera do repo klienta żadną opisaną drogą. Oba problemy trzeba wpisać do
specu, zanim powstanie kod, bo inaczej porównanie przed/po z Q4 wyjdzie puste.

**Waga:** zapisana jako `contract fix × 4 powierzchnie` i taka jest właściwa: nie przesuwa się żaden
model danych. Sekcja pomiaru jest długa, ale uzasadnia każdy próg, więc nie jest wypełniaczem.
**Drut:** `deployed-surface-check` → OK, reguła nie dotyczy tego specu.

**Decyzje właściciela 2026-09-12 (forki z tego raportu):** F1 sekcje albo początek pliku · F2 łatka
w Upgrade mode · F3 `grep` po słowach obszaru · F4 lider prosi o `/clear`. Wszystko, łącznie z
remediacjami 1–8, jest wpisane w spec (przepisany, nie łatany). Po tych zmianach spec jest gotowy do
`sailes-implement` od P0.

## BC findings

- **[Critical] P1 — kształt `STATE.md` w repo klienta.** Hook ma wyciągać sekcje Open failures,
  General rules i Last session. Tymczasem `partner-portal-v3/.ai/STATE.md` (243 KB) nie ma
  pięciosekcyjnego kształtu: to stos datowanych bloków `#` z najnowszym na górze. Sekcje „Verified
  facts” i „Open failure” powtarzają się w kilku blokach, a część bloków sama się ogłasza jako
  `NIEAKTUALNY`. Parser po nazwach sekcji wybrałby na tym pliku fragmenty z różnych dni, w tym
  przestarzałe. Pierwsze 9 500 znaków obejmuje za to 11 nagłówków i jest najświeższe.
  → Fork F1.
- **[Critical] Dystrybucja — hook jest kopią w repo, nie częścią pluginu.** `adopt-existing-repo.md`
  §4 stwierdza, że adoptowane repo trzyma **własne** `.claude/hooks/*.sh`, których plugin nie
  aktualizuje. Hook `partner-portal-v3` różni się już od szablonu: wylicza `ROOT` z położenia
  skryptu, bo repo są zagnieżdżone. Upgrade mode krok 2 brzmi „additive only, never overwrite”. Po
  wydaniu 1.33.0 klient dalej robiłby `cat` całego pliku. → Fork F2.
- **[Warning] Upgrade mode sprzeczny z P1 i P4.** Podział `STATE.md` (P1) i usunięcie
  `.claude/agents/*.md` (P4) to nadpisanie i usunięcie, a krok 2 Upgrade mode tego zakazuje. Spec
  musi dopisać do kroku 2 nazwany wyjątek. Zgoda człowieka z kroku 3 już istnieje.
- **[Warning] Reguła „czytaj STATE.md + lessons.md” ma 12 innych czytelników**, a lista plików P1
  obejmuje tylko `agents-md-template.md`. Pozostałe:
  `sailes-implement/SKILL.md:21,80,92`, `agent-team-structure.md:74,170`, `agents/team-lead.md:68`,
  `codex-agents/team-lead.toml:7`, `sailes-pre-implement/SKILL.md:24`,
  `agentic-first-principles.md:140`, `skills/README.md:79`, `skeleton.md:81`,
  `adopt-existing-repo.md:32`, `repo-done-checklist.md:25`, `codex-config-template.md:17`.
  Jeśli ich nie zmienimy, reguła będzie sobie przeczyć w dwunastu miejscach.

## Gaps

- **P1 — wyszukiwanie lekcji po `Applies-to` nie zadziała na zmierzonym repo.** Plik ma 194 KB,
  a linii `Applies-to` jest w nim 8. → Fork F3.
- **P1 — fixture testu (a) musi odtwarzać prawdziwy kształt:** datowane bloki, powtórzone nazwy
  sekcji, CRLF. Idealny plik pięciosekcyjny dałby zielony test i błąd na produkcji. To ta sama klasa
  błędu co sonda 1.14.0, której fixture był syntetyczny. CRLF jest opisany w AGENTS.md: `^## X$` nie
  dopasuje linii z `\r`.
- **P3 — `validate-frontmatter.test.js` nie ma mechanizmu fixture'ów**, bo iteruje wyłącznie po
  `agents/`. „Czerwień na fixture bez `maxTurns`” trzeba zapisać jako dowód mutacją (usunięcie z
  `be-dev.md` → czerwony) albo dodać katalog fixture'ów. Samo pole jest już w `KNOWN_FIELDS` i
  **nie** jest w `IGNORED_IN_PLUGINS`.
- **P5 — ścieżka fixture'ów.** Konwencja narzędzi to `tools/fixtures/<narzędzie>/`, a spec podaje
  katalog główny `fixtures/`.
- **P5 — poufność.** Transkrypty `partner-portal-v3` zawierają kod i dane klienta, a to repo trafia
  na GitHub (`main`). Fixture'y muszą być syntetyczne, a baseline w `.ai/eval-runs/` może zawierać
  tylko agregaty, bez wycinków transkryptów. Spec tego nie mówi.
- **P5 — nowe evale potrzebują linii `Files:`**. Bez niej `eval-status` zgłosi NO-FILES.
- **P2 — kto kończy sesję.** Ta część czeka na weryfikację w dokumentacji (niżej).

## Risks

| Scenariusz | Waga | Mitygacja | Ryzyko rezydualne |
|---|---|---|---|
| Transkrypty z 11–12.09 znikną przed P5 (Claude Code sprząta stare transkrypty; domyślny okres do sprawdzenia) i Done-when „odtwarza 706 M ±1%” stanie się niewykonalny | wysoka | baseline z agregatami zapisać **na początku**, nie w P5 | brak |
| `maxTurns` przerwie workera w połowie zmiany | średnia | istniejąca reguła „brak commita nie-WIP = nie skończył” + checkpointy WIP; wynik częściowy traktować jak niedokończony | lider może wznawiać zamiast dzielić zadanie |
| `Agent(be-dev)` w deny zablokuje też rolę pluginu | średnia | sprawdzenie na żywo jako pierwszy krok P4 (już w specu) | brak po sprawdzeniu |
| `autoCompactWindow` 400 k tnie interaktywną pracę właściciela | niska, zaakceptowana w Q2 | — | zaakceptowane |
| Parser w `sh` różni się między GNU/BSD/Git Bash | średnia | tylko POSIX `awk`/`sed`, bez `grep -P`; przypadek CRLF w teście | Windows nie jest testowany na tej maszynie |

## Remediation (edycje specu przed kodem)

1. P1: projekt ekstrakcji według decyzji F1, a fixture o prawdziwym kształcie, z CRLF.
2. P1: droga do adoptowanych repo według decyzji F2, z zachowaniem lokalnych zmian hooka.
3. P1: lista plików rozszerzona o 12 czytelników z BC findings.
4. P1/P4: nazwany wyjątek w kroku 2 Upgrade mode.
5. P1: reguła wyszukiwania lekcji według decyzji F3.
6. P3: Done-when walidatora zapisany jako dowód mutacją.
7. P5: `tools/fixtures/token-report/`, fixture'y syntetyczne, baseline tylko z agregatami, `Files:` w evalach.
8. Kolejność: narzędzie i baseline przenieść na początek (niżej).

## Suggested phase order

Pliki się nakładają. `settings-template.json` należy do P1, P2 i P4, `adopt-existing-repo.md` do
P1 i P4, a `agent-team-structure.md`, `team-lead.md`, `team-lead.toml` i `sailes-implement` do P2,
P3 i, po remediacji 3, do P1. Równolegle da się więc puścić tylko to, co jest rozłączne:

1. **P5a** — `tools/token-report.js` z testem i baseline z agregatami. Rozłączne ze wszystkim, może
   iść równolegle z P1.
2. **P1** — pamięć.
3. **P3**, potem **P2**. Wspólne pliki doktryny integruje lider, nie dwóch workerów.
4. **P4** — stare role, ze sprawdzeniem na żywo na początku.
5. **P5b** — evale, CHANGELOG, stemple, delta dokumentacji.

## Fakty o harnessie — weryfikacja w dokumentacji

Sprawdził agent `claude-code-guide` 2026-09-12, cytaty są w notatkach sesji. Instalacja: Claude Code
2.1.266.

- **`maxTurns` w agencie pluginu — potwierdzone.** Pluginy nie obsługują tylko `hooks`,
  `mcpServers` i `permissionMode`. Po osiągnięciu limitu wynik jest oznaczany jako częściowy i można
  go wznowić; oznaczenie wymaga ≥ 2.1.246, a tu jest 2.1.266.
- **`autoCompactWindow` — potwierdzone**, z cytatem z `settings-reference.md`: „Scope: Any file”,
  100 000–1 000 000 tokenów. Luka „podane bez cytatu” w P2 jest zamknięta. Sprawdzenie na żywo
  zostaje jako dowód działania, nie jako warunek zakresu.
- **`Agent(be-dev)` a `sailes-app-builder:be-dev` — NIE UDOKUMENTOWANE.** Spec twierdzi, że
  dokumentacja nazywa te reguły osobnymi, ale agent takiego zdania nie znalazł. P4 stoi więc wyłącznie
  na sprawdzeniu na żywo i spec powinien to zapisać wprost.
- **Limit wyjścia SessionStart — dokumentacja milczy, pomiar rozstrzyga.** W transkryptach
  `partner-portal-v3` 30 plików zawiera „Output too large (210KB)”, a także 30KB i 32KB, z pełnym
  wyjściem zapisanym jako `tool-results/hook-*-stdout.txt` (do 238 766 B). Próg 10 000 znaków nie
  jest potwierdzony cytatem. Pewne jest tylko, że leży poniżej 30 KB, więc 9 500 to bezpieczna strona.
- **Czy lider może sam zrobić `/clear` — twierdzenie agenta odrzucone.** Jego „cytat” („Yes, the
  agent can invoke `/clear`…”) ma formę parafrazy, nie zdania z dokumentacji. Opis `/clear`, który
  przytacza, dotyczy komendy wpisywanej przez człowieka. Narzędzie Skill w tej sesji wprost wyklucza
  komendy wbudowane (`/clear`). Wniosek: model nie kończy sesji sam. → Fork F4.
- **Sprzątanie transkryptów:** `cleanupPeriodDays` nie jest ustawione (domyślnie), a najstarszy
  transkrypt na maszynie pochodzi z 2026-08-30. Pliki z 11–12.09 znikną więc około 11–12.10. To
  twardy termin dla baseline'u.
