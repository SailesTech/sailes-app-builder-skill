# REVIEW.md i review w zespole Claude Code — know-how Anthropic (stan 2026-10-26)

Źródła (pobrane 2026-10-26):
- Dokumentacja: <https://code.claude.com/docs/en/code-review>,
  <https://code.claude.com/docs/en/code-review-customize>,
  <https://code.claude.com/docs/en/code-review-pull-requests>,
  <https://code.claude.com/docs/en/code-review-local>
- Blog: „How the Claude Code team does code review”, Addy Osmani, Morgan Westlee Lunt, Qing Wang,
  2026-10-15, <https://claude.dev/blog/solving-code-review-at-anthropic/>
- Prawdziwy plik: `REVIEW-anthropic-sdk.md` w tym katalogu = `REVIEW.md` z
  `anthropics/anthropic-sdk-python@6e911ec` (2026-10-13, Apache-2.0); identyczny w SDK TypeScript, Go
  i w `anthropic-cli`.

## Czym jest REVIEW.md

- Plik w **korzeniu repo** z instrukcjami **tylko dla review**. `CLAUDE.md` mówi, czym jest projekt
  (stack, konwencje, cele, non-goals); `REVIEW.md` mówi recenzentowi, co w tym repo jest porażką.
- Czyta go **zarządzany Code Review** (GitHub App, plany Team/Enterprise). Dostają go agenci szukający
  i weryfikujący, a krok piszący wynik sprawdza go przed ustaleniem severity i podsumowania.
- **Lokalny `/code-review` NIE czyta `REVIEW.md`** — tylko `CLAUDE.md`. Reguły, które mają działać w
  obu, idą do `CLAUDE.md`.
- Może być `REVIEW.md` w podkatalogu (dodatkowe reguły dla zmian pod tą ścieżką).
- Include: linia z samym `@plik.md` (plik obok `REVIEW.md`, maks. 8, razem < 150 000 B) albo
  `@.claude/skills/<folder>/SKILL.md` (≤ 30 000 B, Code Review nie uruchamia skilla — bierze tylko
  treść, bez `!` komend, `$ARGUMENTS`, plików pomocniczych).
- Czytany z gałęzi bazowej / domyślnej, **nigdy z samego PR**. Obniżanie severity, wykluczenia i limit
  nitów działają tylko z **chronionej** gałęzi domyślnej.

## Co dobry REVIEW.md zawiera (blog + docs)

> „They say what failure looks like in that repo (for docs it's 'it lies,' for config it's 'it
> misroutes'), cap the nits, list paths to skip, and ask for a file and line as evidence instead of
> a guess from a name. They also ask for a summary that starts with a count and says plainly when
> there's nothing to fix.”

1. **Co znaczy Important tutaj** — przekalibrowanie severity (np. dane, rollback, zapytania bez
   tenantu, PII w logach, migracje niekompatybilne wstecz; styl = co najwyżej Nit).
2. **Limit nitów** — np. „Report at most five Nits per review”.
3. **Czego nie zgłaszać** — to, co pilnuje CI (lint, format, typy), pliki generowane, lockfile,
   kod testowy celowo łamiący reguły produkcyjne; dla ścieżek pół-ważnych wyższa poprzeczka
   („w `scripts/` tylko gdy prawie pewne i poważne”).
4. **Zawsze sprawdzaj** — reguły zespołu (nowa trasa API ma test integracyjny, logi bez e-maili i
   ID, zapytania zawężone do tenantu).
5. **Dowód** — „behavior claims need a `file:line` citation in the source, not an inference from
   naming”.

Przykład z dokumentacji (dosłownie):

```markdown
# Review instructions

## What Important means here

Reserve Important for findings that would break behavior, leak data,
or block a rollback: incorrect logic, unscoped database queries, PII
in logs or error messages, and migrations that aren't backward
compatible. Style, naming, and refactoring suggestions are Nit at
most.

## Cap the nits

Report at most five Nits per review.

## Do not report

- Anything CI already enforces: lint, formatting, type errors
- Generated files under `src/gen/` and any `*.lock` file
- Test-only code that intentionally violates production rules

## Always check

- New API routes have an integration test
- Log lines don't include email addresses, user IDs, or request bodies
- Database queries are scoped to the caller's tenant
```

## Severity w zarządzanym Code Review

| Znacznik | Severity | Znaczenie |
|---|---|---|
| 🔴 | Important | błąd do naprawy przed merge |
| 🟡 | Nit | drobne, warto poprawić, nie blokuje |
| 🟣 | Pre-existing | błąd w kodzie, którego ten PR nie wprowadził |

Domyślnie review skupia się na poprawności: „bugs that would break production, not formatting
preferences or missing test coverage”. Działa przez czytanie diffu i otoczenia, **bez budowania i
uruchamiania kodu**. Etapy: Find (równolegli agenci) → Verify (odrzuca fałszywe alarmy) → Rank
(deduplikacja, severity) → Post. Poziomy: Quick / Standard / Deep. Review nigdy nie zatwierdza ani nie
blokuje PR; check run kończy się `neutral`.

Ponowne review po pushu skupia się na tym, co się zmieniło od poprzedniego, i wrzuca mniej nitów i
pre-existing (podaje, ile pominął). Nie powtarza otwartych findingów; czyta odpowiedzi autora na
poprzednie wątki.

## Praktyka zespołu Claude Code (blog, 2026-10-15)

- Cel: minimum czasu człowieka **bez wzrostu revertów i incydentów** (guardrail). Wynik czerwiec →
  wrzesień: 2× więcej PR, odsetek revertów −40%.
- Warstwy: weryfikacja przed PR (testy, build, lint + subagent review w świeżym kontekście) →
  wymagane CI → AI review na każdym PR (równolegli agenci, weryfikatorzy głosują) → osobny security
  review → zgoda człowieka wg ryzyka → merge queue → flagi, staged release, szybki rollback.
- **Każdy finding musi dostać odpowiedź**: poprawka albo zamknięcie wątku z powodem.
- **Ryzyko ustala zmiana, nie autor.** Niskie (docs, copy, rzeczy za flagą): zero ludzi po zielonym
  review. Średnie: jedna osoba. Wysokie (billing, auto-updater, CI): dwie. Zatwierdzenie agenta nie
  liczy się jako ludzkie; osoba prowadząca agenta liczy się jako recenzent; zgoda obejmuje jeden
  commit.
- **Incydenty stają się evalami** — PR-y, które spowodowały incydent, tworzą zestaw, na którym
  recenzent jest codziennie mierzony; zmiana promptu/modelu zostaje, tylko gdy wynik rośnie. Szum
  mierzony reakcjami autorów (fixed / wrong / intentional / didn't matter) i przebiegami na czystych PR.
- **Zbieżność** (jeden PR przeszedł >50 rund w nocy; 59% tego, co recenzent wciąż zgłaszał, było w
  kodzie od pierwszej rundy): limit 3 rund, potem recenzent prosi o przemyślenie podejścia; po kilku
  rundach review tylko diffu; zgłaszaj **klasę błędu**, żeby poprawić wszystkie wystąpienia; bez
  powtarzania już zgłoszonych. Efekt: przejście po jednej rundzie 65% → 78%, ≥5 rund 8,9% → 1,5%,
  średnio rund 2,08 → 1,32.
- Gdy recenzent wciąż zgłasza to samo, poprawka idzie do źródła: skill, reguła lintera, `CLAUDE.md`
  albo `REVIEW.md`.
- Checklist adopcji: krótki `CLAUDE.md` z uruchamialnymi kontrolami, hooki formatterów, `/code-review`
  i `/security-review` przed PR, `REVIEW.md`; szablon PR z sekcjami **Testing / Risk / How to
  revert**; AI reviewer dostrojony przed rozszerzeniem; security review i rozwiązane wątki przed
  merge; głębokość review wg ryzyka; limit rund.
