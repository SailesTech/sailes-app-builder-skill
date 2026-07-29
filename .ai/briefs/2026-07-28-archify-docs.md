# Task Brief: archify jako gate'owana dokumentacja projektów Sailes

Data: 2026-07-28 · Wariant: brownfield (repo frameworku) · Branch: `feat/archify-docs`
Źródło zewnętrzne: https://github.com/tt-a1i/archify.git (MIT, v2.12; skill = samodzielne 5,2 MB,
CLI Node bez kluczy API: `validate | deliver | guide | compare | preview`)

## TLDR
Framework zyskuje zdolność dokumentacyjną opartą o archify, wpiętą w spine VERIFIED:
dokumentacja jest regenerowana jako gate'owany krok per spec (nie może zgnić), walidowana
deterministycznie z evidence przypiętym do commitów (nie może kłamać), a `archify compare`
pokazuje człowiekowi przy release gate, co spec naprawdę zmienił (delta jako dowód).

## Recon Result
- Already exists? **NIE.** 16 skilli, żaden dokumentacyjny; jedyny ślad to opcjonalna notka
  `graphify export callflow-html` w `skills/sailes-bootstrap/graphify-setup.md:97`.
- Wzorzec do reużycia: integracja graphify — `graphify-setup.md` (krok bootstrap 4.9,
  jawny SKIP gdy binarki brak, freshness rules, wskaźniki z innych skilli).
- Fakt zweryfikowany w kodzie archify: `compare` obsługuje **wyłącznie** typ `architecture`
  (`bin/archify.mjs:18`, `delta/architecture-delta.mjs`). Pozostałe typy audytowalne przez
  git diff kanonicznego JSON-a (deterministycznie sortowany).

## Who & Why
- Zamawiający: Marcin (właściciel frameworku).
- Job: każdy projekt Sailes ma żywą, weryfikowalną dokumentację architektury dla zespołu
  i agentów ORAZ profesjonalny artefakt HTML oddawany klientowi; framework przestaje
  oddawać projekty bez dokumentacji.

## Exact Scope
1. **Nowy skill `sailes-docs`** — entrypoint + references (setup archify, autoring z evidence
   repo, paczka kliencka, protokół SKIP).
2. **Nowa rola `docs-author`** — autoruje typowany JSON z evidence repo; roster 9→10;
   bliźniak Codex; własny eval.
3. **Bootstrap** — nowy krok (obok graphify 4.9): initial **pełny zestaw 5 typów** diagramów;
   karta językowa (język etykiet = język klienta) w decision-engine.
4. **Release gate / implement** — regeneracja zestawu + `archify compare architecture
   <base> <head>` jako dowód przy gate; delta pokazywana człowiekowi.
5. **Adopt** — istniejące repo dostaje zestaw diagramów przy adopcji.
6. **Diagnose** — opcjonalny diagram sequence/lifecycle udowodnionego mechanizmu w incident record.
7. **Self-docs** — sam framework dokumentuje się archify (diagram pipeline/ról).
8. **Dystrybucja** — prereq maszynowy `npx skills add tt-a1i/archify -g`; gdy brak: jawna
   linia `SKIP archify` + wpis w STATE.md, nigdy cicho (wzorzec graphify).

## Acceptance Criteria
- [ ] Evale NAJPIERW dla chronionych zachowań: (a) gate odmawia zamknięcia speca bez delty,
      (b) SKIP jest jawny nigdy cichy, (c) `docs-author` trzyma się swojej lane.
- [ ] Fixtures w obu kierunkach (wykrywa defekt / nie flaguje poprawnej pracy).
- [ ] `npm test` zielony; pięć stampów wersji + wpis CHANGELOG.
- [ ] Merge do `main` dopiero po werdyktach evali — `main` to produkcja (live deploy).

## Constraints & Non-Goals
- Nie vendorujemy archify (odrzucone w D2); nie forkujemy go; MIT — atrybucja w miejscu użycia.
- Blast radius: każda zmiana skilli/ról działa na wszystkich maszynach z pluginem.
- Non-goal: własny renderer/format — używamy archify as-is; non-goal: dokumentacja prozy
  (README itd.) — tylko diagramy.

## Decisions Ledger (zatwierdzony przez człowieka 2026-07-28)
| # | Decyzja | Wybór | Kto | Odrzucone (dlaczego nie) |
|---|---|---|---|---|
| 1 | Rola dokumentacji | Delta jako dowód przy release gate | user (=rek.) | żywa bez gate (dryf); na żądanie (zero wartości własnej) |
| 2 | Dystrybucja | `npx skills add` + jawny SKIP | user (=rek.) | vendoring 5,2 MB; kopia per-repo |
| 3 | Dodatkowe wpięcia | adopt + self-docs + diagnose | user | „żadne dodatkowe" |
| 4 | Odbiorca | zespół+agenci ORAZ klient | user | tylko zespół; tylko klient |
| 5 | Zestaw domyślny | pełne 5 typów | user (**wbrew rek.** arch-only) | arch-only; arch+dataflow. Przyjęte: 5 plików utrzymywanych; rendered delta tylko architecture |
| 6 | Forma | nowy skill `sailes-docs` | user (**wbrew rek.** references) | references bez skilla; hybryda. Przyjęte: +1 opis skilla/sesję |
| 7 | Właściciel | nowa rola `docs-author` | user (**wbrew rek.** bez roli) | bez nowej roli. Przyjęte: roster 9→10 + eval + rejestracje + bliźniak Codex |
| 8 | Język etykiet | per-repo przy bootstrap | user (=rek.) | zawsze PL / zawsze EN |

Nazwa sumy (zapisana świadomie): #5+#6+#7 to największy jednorazowy przyrost powierzchni
frameworku od 1.16.0, przeciw kierunkowi subtrakcji ze STATE.md — wybrane z kosztami na stole.

## Team Handoff Plan
Framework repo — praca doktrynalna, nie apka: lead + checker wystarczą do review prozy;
eval-runner (skill) do werdyktów; qa-vision tylko tam, gdzie render weryfikowalny.

## Next Step
- Handoff: **`sailes-spec`** (szkielet → Open Questions gate → STOP na odpowiedzi człowieka),
  spec do `.ai/specs/2026-07-28-archify-gated-docs.md`, potem pre-implement → implement.
