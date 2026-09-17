## message_to_human

Spec `2026-09-17-invoice-csv-export` jest approved, pre-implement: READY. To zadanie zwołuje zespół (3 fazy, nowy endpoint + job, BE-only) — nie robię tego solo.

**Decyzja do Ciebie, zanim ruszy F3** (spec sam to zaznacza jako Human-STOP, nie rozstrzyga): gdzie trzymamy gotowy plik CSV eksportu i jak długo.

- **A — kolumna `bytea` w Postgres.** Zero nowej infrastruktury, backup pliku idzie razem z backupem bazy. Koszt: rośnie rozmiar/koszt backupów DB w czasie, brak wbudowanego TTL (trzeba osobny sprzątający job), dodatkowe obciążenie I/O na bazie OLTP przy większych eksportach.
- **B — bucket S3 + podpisany URL (TTL 7 dni).** Naturalny mechanizm wygasania (lifecycle policy = TTL za darmo), nie zwiększa bazy, odseparowuje duży binarny plik od bazy transakcyjnej. Koszt: trzeba mieć/skonfigurować bucket, dojście do niego z workera, zmienne środowiskowe/credentiale.

**Rekomendacja: B.** Spec już mówi o TTL 7 dni — to naturalnie pasuje do S3 lifecycle/signed URL, a nie do kolumny w bazie, która TTL nie ma wbudowanego.

Ta decyzja blokuje tylko F3 — F1 (generator CSV) i F2 (szablon maila) mają rozłączne pliki i żadna z nich jej nie potrzebuje, więc odpalam je od razu w Wave 1 (skrypt Workflow poniżej), równolegle z oczekiwaniem na Twoją odpowiedź.

Uwaga kontekstowa: pracuję w repo frameworka (`sailes-app-builder-skill`), a ścieżki plików ze spec (`apps/api/...`, `apps/worker/...`) tu nie istnieją — to jest fixture do ćwiczenia, więc poniższy skrypt jest tym, co bym realnie odpalił w repo klienta, nie czymś uruchomionym teraz.

## what_you_would_do_next

Before calling Workflow with the script above, in the target client repo (not this framework repo):
1. `git rev-parse --show-toplevel` to confirm cwd is the client repo the spec targets, not a sibling repo left over from a previous task.
2. Set spec `Status: approved` → `in-progress`; branch off `main` (e.g. `feat/2026-09-17-invoice-csv-export`), never implement on default branch.
3. Open a run log `.ai/runs/2026-09-17-invoice-csv-export.md` (goal, phase graph, the ownership matrix as a yaml block, `Known-red:` placeholder) and run `ownership-check.js` against it to confirm F1/F2/F3's file sets are actually disjoint as the spec claims.
4. Run the repo's documented one-command boot once, capture raw output; get `git rev-parse HEAD` for the branch tip. Call `Workflow` with `args: { leadSha, bootResult, specPath: '.ai/specs/2026-09-17-invoice-csv-export.md' }` and the script above.
5. On return: read `f1`/`f2` (not null, `status: "done"`, non-empty `commit`) — a null or `blocked` result gets inspected via `git log <branch>` in its worktree before any blind re-run, never salvaged blind. `git merge --no-ff` each declared commit into the integration branch. Log both in the run log (worker · task · outcome · commit · base). Release both workers (scoped-subagent mode: the return already ended them).
6. In parallel with step 4-5, or as soon as it lands: the human answers the storage-decision fork above. Once both (a) wave 1 is integrated and (b) the decision is answered, write a second Workflow script (wave 2) that: implements F3 per the chosen storage mechanism (be-dev, tier B, `isolation: worktree`, briefed with the decision baked in as a constraint) — then, ON THE SAME RUN, appends `tester` (spec unread-implementation → DERIVED plan since lane is middle, no human-freeze STOP → write suite covering the *whole* spec, F1+F2+F3) and `checker` (whole diff, one pass) per the "gates once, at the end" doctrine, since F3 is the last phase.
7. After checker returns APPROVE (or one CHANGES-REQUIRED fix round, D8's ≤1 retry), run WF3: `qa` alone, holding the environment exclusively, live-run on the stack (middle lane — no screenshots, no vision-verify, since no UI phase exists in this spec) with output pasted, then `docs-author` for the docs-delta receipt before the spec can close.
8. Per `session-handoff`: after WF2 wave 1 returns (this call), write `.ai/STATE.md` (verified facts: F1/F2 commits; open: F3 storage decision pending; Last session: wave-2 brief pointer) and end the turn with one line asking the human to `/clear` then "kontynuuj" — riding along with the same message that already carries the storage-decision fork, per the named exception (one stop, not two).
9. Record in the run log: no model/effort overrides used (be-dev, tester, checker, qa all run on their frontmatter pins — Sonnet for be-dev/tester/checker/qa) — logged as a deliberate default, not an omission, since nothing here needs Opus-tier judgment (small, spec-settled contract, no auth/tenancy/data-model ambiguity).
10. On spec closure: docs-delta receipt shown to the human, then `git mv` the spec to `.ai/specs/implemented/`, update `STATUS.md`, close out the run log and `.ai/lessons.md` with anything a worker actually hit (e.g., if the storage decision surfaced any wrinkle during F3).
