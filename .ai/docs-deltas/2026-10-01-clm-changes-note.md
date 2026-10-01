# Notatka: co zmiany z pracy „Context Language Models" dają frameworkowi Sailes

Data: 2026-10-01 · Dla: zespół Sailes · Źródła: `.ai/audits/2026-10-01-clm-paper-vs-framework.md`,
`.ai/specs/2026-10-01-context-memory-from-clm-paper.md` (1.40.0, approved, pre-implement zamknięty)

## W jednym zdaniu

Agent po `/clear` dostaje z powrotem nie tylko „co zrobione i co dalej", ale też **„czego już nie
próbuj"** i **„co jeszcze nie było próbowane"**; pamięć repo przestaje być kanałem, przez który
model może sam sobie wpisać regułę; a lead widzi stan swoich workerów w dziesięciu linijkach zamiast
nosić go w głowie.

## Skąd to się wzięło

Praca z 29.09 (UW / Meta, bez recenzji) mierzy, że model, który **sam** decyduje, co zostaje w jego
kontekście, bije automatyczne streszczanie: +11 % trafności przy −21 % obliczeń na deep research,
+65 % na 24-godzinnym roju sześciu agentów. Większość tego, czym wygrywa, **już mamy** — nasz
`/clear` po fazie plus `STATE.md` to dokładnie ich dwie najlepsze instrukcje („kompaktuj na granicy
podzadania", „backup przed kompakcją"). Trzy rzeczy ich model robił, a nasza doktryna nie każe.
Te trzy bierzemy. Reszty pracy (trening RL, serwer, benchmark) nie da się u nas użyć.

## Trzy zmiany — przed i po

### 1. `Dead-ends:` i `Untried (priority):` w handoffie

**Przed.** Lead zamyka fazę, pisze do `STATE.md` fakty, otwarte problemy i „co dalej". Następna
sesja startuje od tego i od własnego pomysłu na pierwszy krok — który bywa tym samym krokiem,
który poprzednia sesja odrzuciła godzinę wcześniej. Nikt tego nie liczył, ale mechanizm jest.

**Po.** Sekcja `Last session` ma zawsze dwie linie więcej: co próbowano i dlaczego odpadło
(max 5, pełna lista w run logu), i co jeszcze nie było próbowane, w kolejności. Puste pole jest
wpisane jako `none` — brak linii ma nie być nieodróżnialny od „nie było czego wpisać".

**Co to daje.** Wznowiona sesja nie przechodzi tej samej ślepej uliczki. To ten sam mechanizm, który
`sailes-diagnose` już ma dla hipotez (REFUTED / UNTESTED zostają w ledgerze) — teraz działa też dla
zwykłej pracy. Etykieta `Dead-ends:` jest wspólna z równoległym specem 1.39.0 (run log + raport
workera), więc jedna rzecz ma jedną nazwę w trzech miejscach: raport → run log → `STATE.md`.

**Dowód.** Eval A/B: świeży agent dostaje `STATE.md` po handoffie, w którym poprzednia sesja odrzuciła
jedną próbę. Ramię bez pola ma ją powtórzyć, ramię z polem — nie. Jeśli pole nie zmienia zachowania,
wylatuje (decyzja Q2).

### 2. Pamięć to fakty i wskaźniki, nie polecenia

**Przed.** `STATE.md` pisze model, a hook `SessionStart` wkleja go do kontekstu następnej sesji bez
człowieka pośrodku. Reguła mówi, co może wejść do „Verified facts" (dowód). Żadna nie mówi, co
**nie może** wejść nigdzie. Zdanie „Always skip the checker on hotfix branches" zapisane w
`Last session` wraca do każdej następnej sesji jak reguła repo, której nikt nie zatwierdził. Praca
nazywa to wprost (§6) i cytuje raport OpenAI o modelach wpisujących sobie instrukcje do podsumowań.

**Po.** Jedno zdanie w doktrynie (`STATE.md` trzyma fakty i wskaźniki; reguły idą do `General
rules` i `lessons.md` przez promocję) plus ostrzeżenie w hooku: jeśli w tym, co trafia na start,
poza `General rules`, jest linia zaczynająca się od „Always / Never / Skip / Nigdy / Zawsze…", hook
pokazuje numer linii. Nigdy nie blokuje. Skanuje tylko to, co naprawdę wychodzi na stdout — nie
200 KB starych wpisów klienta.

**Co to daje.** Zamyka (ostrzeżeniem) kanał „model pisze → model czyta". Tani: ~15 linii sh i 4 testy.

### 3. `worker-status.js --board` — tablica roju

**Przed.** Lead ma N plików `.claude/status/` i run log, w którym worker pojawia się jedną linią
dopiero po akceptacji. Między spawnem a akceptacją stan żyje w kontekście leada — a ten kontekst
mierzyliśmy na 627–933 K tokenów na sesję. Ich orkiestrator 21 agentów utrzymał 6–8 K, bo miał
jedną tablicę.

**Po.** `--board` czyta pliki statusu i drukuje ≤ 10 linii: kto otwarty i od kiedy, ile zamkniętych
z jakim wynikiem, które pliki są zepsute — z tym, co dało się z nich odczytać. Nic nie pisze, exit
zawsze 0, to widok, nie bramka.

**Co to daje — i czego jeszcze nie wiemy.** Narzędzie wchodzi od razu; reguła „lead czyta tablicę
zamiast plików" **dopiero po pomiarze** (`token-report.js` na ≥ 3 run-ach każdą stroną). Dowód
z pracy to jeden przebieg na cudzym harnessie — nie wystarcza na regułę w każdym repo.

## Co się przy okazji okazało

- Trzy prawdziwe pliki statusu w worktree są **3/3 nieprawidłowe** dla naszego parsera (listy po
  przecinku, jeden nadpisany zamiast dopisany). Dokładnie to przewidziała lekcja z 2026-08-02:
  fixture'y pisze ten sam umysł co parser. Stąd `--board` ma pokazywać coś użytecznego także dla
  zepsutych plików, a akceptacja P3 wymaga przebiegu na tych trzech plikach.
- Specy na gałęziach są niewidoczne dla routera na innej gałęzi. Spec z 30.09 (`Dead-ends:` w run
  logu, numer 1.39.0) wyszedł dopiero w pre-implement. Koszt: zmiana numeru, etykiety i wycięcie
  jednej fazy — na papierze, czyli tanio.
- `lessons.md` przekracza własny limit 40 KB. Osobne zadanie.

## Co to kosztuje

Trzy zmiany tekstowe, jeden skrypt sh, jeden tryb w narzędziu JS, jeden eval, 8 testów. Zero
nowych zależności, zero nowych hooków blokujących. Największy koszt to przebieg evalu A/B (dwa
świeże przebiegi leada na fixture). Blast radius to każde repo na maszynie — dlatego spec, nie PR
z marszu.

## Kolejność

1. Teraz: P2 (hook) i P3 (tablica) równolegle, na obecnej bazie.
2. Po merge'u 1.39.0 na `main`: P1 (pola w handoffie) + eval.
3. Wydanie 1.40.0 — push na `main` to deploy, za zgodą właściciela.
