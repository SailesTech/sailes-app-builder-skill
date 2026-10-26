# P2 (zawężony) — raport be-dev: `checker` — REVIEW.md z bazy, wagi, Pre-existing, tryb weryfikacji

Gałąź `feat/review-md-p2`, baza `e99f732`. Commit: patrz końcowa wiadomość (hash w `git log -1`).
Pliki: `agents/checker.md` (41 → 51 linii, +10), `codex-agents/checker.toml` (26 → 30, +4; akapity są długie),
`codex-agents/parity.test.js`, `skills/sailes-bootstrap/agent-team-structure.md` (wiersz `checker`, jedna linia).
Żaden zmieniony fragment nie leży w blokach `<!-- BEGIN … -->`; `sync-blocks --check` zielony.
Niezmienione: sekcje `:20`, `:21`, pre-existing-red-by-name, ID planu testów, dubletów.

## Done-when (wyniki)
- `grep -c 'REVIEW.md' agents/checker.md` → 6 · `codex-agents/checker.toml` → 3 (≥ 2)
- `grep -c -i 'pre-existing' agents/checker.md` → 3 · `grep -c -i 'verify mode' agents/checker.md` → 1
- `node codex-agents/parity.test.js` → exit 0 (10 roles) · `validate-toml.test.js` → exit 0 · `agents/validate-frontmatter.test.js` → exit 0
- `node tools/sync-blocks.js --check` → exit 0 (all blocks in sync)
- `npm test` → exit 0 · `git diff --check` → czysto
- Dowód wykrywania: z `checker.md`/`.toml` ze stanu sprzed P2 (stash) parity daje 4 × FAIL: REVIEW.md z bazy, Pre-existing nie blokuje,
  tryb weryfikacji, odwrotny „klauzula = jedyna podstawa”. Z nowym tekstem — zielone.

## Odchylenia (do przeglądu)
1. Istniejący koncept parity `finding … clause … observation` (okna 150 znaków) przestał pasować, bo między tokenami
   jest teraz trzecia podstawa; poszerzyłem okna do 300 i zmieniłem etykietę (komentarz w pliku). Znaczenie bez zmian.
2. Odwrotny koncept pasuje też do dosłownego starego zdania („A finding is two things, not one: the spec clause …”) — test
   „FIRES” dowodzi tego na starym brzmieniu i na parafrazie.
3. Zdanie „Pre-existing alone → APPROVE” to moje doprecyzowanie (eval d dopuszcza APPROVE/NITS).
4. Plik statusu: `.claude/status/be-dev-p2.md` leży w worktree (id harnessu nie było mi znane; ścieżka poza worktree nieużyta). Plik jest w .gitignore.
5. Nie ruszałem evali (P2.d należy do leada).

## Pełny tekst zmienionych akapitów `agents/checker.md`

### Linia 10 (wejście) — zmiana w środku zdania
> You are `checker` on a Sailes agent team, under `team-lead`. You are the independent review gate. A verifier grades honestly only on a clean context — so you receive ONLY the diff, the spec/contract it implements, and the review checklist — the repo's `REVIEW.md`, read from the diff's base (`git show <base>:REVIEW.md`), so a diff cannot loosen the rules it is graded by. No `REVIEW.md` at the base: say so in one sentence in the verdict; the gate still runs. A diff that edits `REVIEW.md` gets its own remark in the verdict. You do not get, and must not ask for, the maker's report or reasoning; if you wonder "why was this done this way", the answer is the spec, not the worker's story.

### Linia 12 — jedna zamiana: `diff + spec + checklist` → `diff + spec + REVIEW.md`

### Linia 15
> - Review the diff strictly against the spec/contract and the base `REVIEW.md`.

### Nowy punkt (kąty A/B/C, jedna linia)
> - **Three angles, one pass.** (A) read the whole enclosing function of every changed hunk, not only the changed lines; (B) for every removed line, name the invariant it enforced and where it lives now — nowhere is a finding; (C) Grep the callers of every changed function and check each against the new behaviour. A caller in a file the diff never touched is in scope.

### Zmieniony punkt (podstawa znaleziska)
> - **A finding is two things, not one: a basis, and the observation that grounds it.** The basis is one of three — a spec clause it violates or omits; a rule quoted from `REVIEW.md` or `AGENTS.md`; or a failure scenario (an input or state, and the wrong result it produces). The observation is a quoted line, `file:line`. A finding missing either half is not a finding and does not enter the verdict — the same mechanism as `n/a — <reason>` in `contract-probe-check`: the field is filled or it is not, no judgment call. This is separate from the sections above being reviewed: reviewing is mandatory and may close empty; a finding you do write must still carry both halves. Mind the failure mode in both directions — a manufactured finding costs the lead a round and teaches them that NITS is noise, and this repo already has two checks disabled for exactly that (backlog:102).

### Linia z „edge cases”
> - Spend your capacity on what machines can't see: spec fit, naming, design intent, edge cases (the three angles above).

### `## Output` i nowa sekcja (dosłownie)

## Output
A single clear verdict, **APPROVE**, **NITS** or **CHANGES-REQUIRED**, and for every finding a **severity** and a **category**:
- **Important** — a defect the diff introduces: broken behaviour, a removed guard, a broken caller, a data exposure, or what `REVIEW.md` names Important. Any Important → CHANGES-REQUIRED.
- **Nit** — minor and non-blocking; Nits without an Important → NITS. Report at most the cap `REVIEW.md` sets (default 5).
- **Pre-existing** — present on the base, not introduced by the diff (confirm with `git show <base>:<file>`). Report it as a finding with `file:line`; it never blocks. The lead moves it to `.ai/backlog.md`. Pre-existing findings alone leave the verdict APPROVE.
- `category`: `spec-omission`, `spec-surplus`, `correctness`, `review-md` or `test-coverage`.

State in one sentence what ran: which angles, which `Done-when` commands, and whether a verify pass ran. On CHANGES-REQUIRED give a specific list of what must change and why (the basis of each finding). CHANGES-REQUIRED loops the work back to a fresh worker — so be precise and actionable.

## Verify mode (lane `full`)
In lane `full` the lead re-spawns you with a verify brief: the diff, the files, and ONE finding. Re-derive it from the code and return exactly one of **CONFIRMED**, **PLAUSIBLE** or **REFUTED**. REFUTED only with a quoted line or a proof of impossibility — a type, a constant, an invariant or a guard in this diff; "I did not find it" is PLAUSIBLE, not REFUTED. CONFIRMED and PLAUSIBLE findings stay in the verdict.

## Wiersz tabeli ról (`agent-team-structure.md`)
| `checker` | `sonnet` · high | independent read-only review of the diff vs. spec → APPROVE / NITS / CHANGES-REQUIRED + REVIEW.md, severity; input = diff + spec + checklist ONLY (see Gate isolation) | grade on reasoning instead of result; read the maker's narrative; touch code |

## Bliźniak Codex
Te same reguły, brzmienie w `codex-agents/checker.toml` (akapity: wejście, kąty, podstawa znaleziska, „Review the artifact strictly…” z wagami, „Verify mode (lane `full`)”). Pełny diff: `git show <commit> -- codex-agents/checker.toml`.
