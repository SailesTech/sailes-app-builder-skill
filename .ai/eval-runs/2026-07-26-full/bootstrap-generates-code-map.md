# Eval run — bootstrap generates a code map

- **Date:** 2026-07-26
- **Framework:** `sailes-app-builder` VERSION `1.16.2`, branch `fix/spawn-named-roles-not-general-purpose`
- **Skill under test:** `skills/sailes-bootstrap/` — `SKILL.md`, `graphify-setup.md`, `repo-done-checklist.md` (only these three were read from the framework repo)
- **Working repo (fixture):** `C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\c034406e-1158-4939-a24a-eca7a55d6aca\fixtures\empty-repo`
- **Task from the owner:** "bootstrap this repo for a small B2B tool — the stack is already confirmed as the baseline."
- **Outcome:** bootstrap complete. Repo Definition of Done verification block: **all OK, zero MISS**. Code map built, queried, committed, and kept fresh by hooks. Four items are green *structurally* but not *substantively* — listed under "What is NOT green".

---

## Environment prerequisite

`graphify` verified before anything else, as `graphify-setup.md` step 0 requires:

```
$ command -v graphify
/c/Users/karol/.local/bin/graphify
$ graphify --version
graphify 0.9.26          # ≥ 0.9.23, the validated floor
```

`pnpm 9.12.0` also present.

---

## Steps run, in order

### Step 0 — detect repo methodology state
Inspected the fixture on disk rather than trusting the prompt. Found: `.git` with **1 commit** (`a8a1cb9 initial`), a 60-byte `README.md` ("# Ofertownik / Internal B2B quoting tool. Nothing built yet."), and nothing else. No `AGENTS.md`, no `.ai/`, no `package.json`.

→ **Case B** (empty repo, no methodology). The filesystem matched the prompt, so no discrepancy to surface.

### Step 1 — classify the project → module manifest
Product read: internal quoting tool for one company — build a quote, price it, render a PDF, send it, track state.

Manifest recorded in `.ai/adr/ADR-001-stack-selection.md`:

| Module | State | Reason |
|---|---|---|
| Core + worker + auth + DB + observability + testing | ON (baseline) | always |
| Files | ON | quote PDFs need private storage + signed URLs |
| Email | **OPEN** | a quoting tool sends quotes, but the level (0–5) was never scoped |
| Reporting / integrations / feature flags / workflow engine | OFF | not implied by the brief |
| Tenancy | single-tenant | one company, internal |
| Security gate | **production** | real client data + commercially sensitive prices |

**Decision-card handling.** The owner pre-confirmed "the stack is the baseline", which legitimately closes the Step 4 stack cards. It does **not** close everything, and the skill is explicit that a silently-defaulted choice is the #1 failure mode. So four decisions were recorded as **open**, not slipstreamed:

1. **PDF / document engine** — Puppeteer vs `@react-pdf` (Step 1 names this as a card that must not be silently deferred). The app's core output is a document, so this is load-bearing.
2. **Email module level** (0–5) — changes the data model.
3. **Q21 browser-inspection MCP** — recommended (A) for a UI repo; unanswered, so **no `.mcp.json` was written** and the Codex `[mcp_servers.chrome-devtools]` block was left commented with a pointer to the ADR. UI runs carry `SKIP browser-inspect`.
4. **Design-direction sign-off** — see Step 4.5.

The worker+monorepo card (Step 1's first named non-free-pass) was treated as answered by the baseline confirmation, and the reasoning for why the *fullstack* shape genuinely fits here — login-only UI, web is the only backend consumer, one async job type — was written into the ADR rather than assumed.

### Step 2 — establish agent working discipline
Read `agentic-first-principles.md` (§0 developer owns the vision, §A verifiable done, §B security-by-default + the ratchet, §C adversarial review, §E parallel-safe layout, §G git, §H institutional memory) and committed to it for the session. Its rules are reflected in the generated `AGENTS.md` spine, Verification, Hard Safety Rules, and Lessons sections.

### Step 3 — methodology generation (Case B)
Read `skeleton.md`, `agents-md-template.md`, `settings-template.json`, `codex-config-template.md`, `spec-writing-template.md`, `backlog-template.md`, then generated:

- `AGENTS.md` — adapted to this product (money as integer minor units, prices never logged, PDF worker path), stamped `Framework-Version: 1.16.2`, ~135 lines (inside the ≤150 budget).
- `CLAUDE.md` → `@AGENTS.md` · `README.md` (extended, original heading preserved) · `STATUS.md` (header-only)
- `.ai/` in full: `specs/` (+ `implemented/`, `archived/`, `AGENTS.md` conventions, `ui-spec.md`), `checklists/{security,testing,deployment}.md`, `adr/template.md` + `ADR-001-stack-selection.md`, `skills/spec-writing/SKILL.md` (tuned to the locked stack), `backlog.md`, `lessons.md`, `STATE.md`
- pnpm monorepo: `apps/web` + `apps/worker` (mandatory) + `packages/{db,contracts,auth,ui,files,jobs}`, `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.env.example`
- Harness guardrails, both twins: `.claude/settings.json` + `.claude/hooks/*.sh` **copied** from `hooks-template/` (not retyped, per the 1.9.0 note), `.codex/config.toml` referencing the same scripts, `.github/copilot-instructions.md`
- Thin but real TypeScript in the workspace (pricing, contracts, job handlers) so the code map has actual nodes and cross-package edges to extract.

Idempotency: the only pre-existing file was `README.md`; it was extended, keeping its original heading. Nothing was overwritten.

### Step 4 — stack decision
Baseline confirmed by the owner and recorded per layer in ADR-001, sourced from `stack-baseline.md` (not from memory): Node 24 · pnpm monorepo · TS strict · Next.js App Router · Tailwind+shadcn · Railway Postgres · Drizzle · Better Auth · mandatory worker · jobs tier 1 (DB jobs + cron) · Railway Buckets · Sentry/PostHog at prod · Vitest/MSW/Testcontainers/Playwright.

### Step 4.5 — design gate
The app has a UI, so the gate applies. Produced `.ai/specs/ui-spec.md`: a deliberate direction ("quiet instrument" — near-monochrome, one accent, signature sticky **totals rail**), token table with a contrast rule, tabular-figures typography rule, layout, interaction states, accessibility, and an explicit **anti-AI-default check** (no purple gradient, no glassmorphic card, no emoji icons, no shadow-2xl-on-everything).

Marked `Status: draft — NOT signed off by a human`, with a gate note stating the artifact meets the gate structurally while a real `sailes-design` run would present 2–3 directions for the owner to choose.

### Step 4.9 — code map (graphify)
`graphify-setup.md` → "The procedure" run **verbatim and in order**. Order held: `.claude/settings.json` existed first, extraction preceded `hook install`, commit came last.

| # | Command | Result |
|---|---|---|
| 0 | `command -v graphify` | present, 0.9.26 |
| 1 | `graphify extract . --code-only` | **153 nodes, 159 edges, 17 communities** over 26 code files; deterministic AST, no API key |
| 2 | `graphify hook install` | post-commit + post-checkout installed; merge driver registered |
| 3 | `graphify claude install` | CLAUDE.md section + PreToolUse nudge hooks **merged** into the existing `.claude/settings.json` |
| 4 | `graphify codex install` | AGENTS.md section + `.codex/hooks.json` (separate from our `.codex/config.toml` — no conflict) |
| 5 | portability `sed` | see below |
| — | `.gitignore` / `.claudeignore` | appended, not overwritten |
| — | commit | `f7d19dd chore: graphify code map + freshness hooks (Sailes default)` |

**The merge claim held.** `.claude/settings.json` kept our `permissions.allow/deny` untouched and kept our `Edit|Write` → `guard-protected-paths.sh` hook; graphify appended only its own `Bash|Grep` and `Read|Glob` entries.

**Step 5 was load-bearing, exactly as documented.** Both installers wrote the absolute local binary path into files that get committed:

```
BEFORE  .claude/settings.json: "C:/Users/karol/.local/bin/graphify.EXE hook-guard search"
        .claude/settings.json: "C:/Users/karol/.local/bin/graphify.EXE hook-guard read"
        .codex/hooks.json:     "C:/Users/karol/.local/bin/graphify.EXE hook-check"
AFTER   "graphify hook-guard search" · "graphify hook-guard read" · "graphify hook-check"
        (grep for absolute paths → none)
```

Skipping that step would have shipped hooks that break on every other machine. The `sed` in the skill works as written under Git Bash on Windows.

**Behavior proof — the map answers, it doesn't just exist:**

```
$ graphify query "where are quote totals calculated"
Traversal: BFS depth=2 | Start: ['QuoteTotals','quoteTotalsSchema','totalsFor()','quote.ts'] | 14 nodes
NODE totalsFor()      [src=apps/web/src/lib/pricing.ts   loc=L9]
NODE lineTotalMinor() [src=apps/web/src/lib/pricing.ts   loc=L3]
EDGE pricing.ts --imports--> QuoteTotals  at=apps/web/src/lib/pricing.ts:L1
EDGE HomePage() --calls--> totalsFor()    at=apps/web/src/app/page.tsx:L4

$ graphify path "renderQuotePdf" "signedUrlTtlSeconds"
Shortest path (1 hops):
  renderQuotePdf() --calls--> signedUrlTtlSeconds()
```

Cross-package edges (`apps/web` → `packages/contracts`, `apps/worker` → `packages/files`) resolved correctly.

**Freshness proved itself:** every `git commit` printed `[graphify hook] launching background rebuild`. After a final `graphify update .`, `graph.json` mtime `1785057846` > previous commit ts `1785057797` → the graph is CURRENT by the skill's own rule.

### Step 5 — handoff verification
Ran the `repo-done-checklist.md` verification block. Output below.

---

## Final checklist state

### Green — verified on disk, zero `MISS`

```
== mandatory files ==            == full .ai/ structure ==
OK   AGENTS.md                   OK   .ai/specs
OK   CLAUDE.md                   OK   .ai/specs/implemented
OK   README.md                   OK   .ai/specs/archived
OK   .gitignore                  OK   .ai/backlog.md
OK   package.json                OK   .ai/lessons.md
OK   pnpm-workspace.yaml         OK   .ai/STATE.md
OK   .ai/skills/spec-writing/SKILL.md
OK   .ai/adr/template.md         == harness guardrails + client status ==
                                 OK   .claude/settings.json
== mandatory dirs ==             OK   STATUS.md
OK   apps/web/
OK   apps/worker/                == Codex twin + multi-harness interop ==
OK   .ai/checklists/             OK   .codex/config.toml
OK   .ai/adr/                    OK   .github/copilot-instructions.md
                                 OK   .codex refs .claude/hooks/guard-protected-paths.sh
== design artifact ==            OK   .codex refs .claude/hooks/session-start.sh
OK   design artifact present
                                 == code map (graphify — Step 4.9) ==
== CLAUDE.md → AGENTS.md ==      OK   graphify-out/graph.json
OK   CLAUDE.md → @AGENTS.md      OK   .claudeignore covers graphify-out/
                                 OK   freshness hooks (post-commit)
== git ==
OK   git initialized
commits: 7          clean tree: yes
```

Also green: `.ai/adr/ADR-001-stack-selection.md`, both `.claude/hooks/*.sh`, `graphify-out/graph.json` tracked by git, `graphify hook status` → post-commit installed / post-checkout installed / merge driver registered.

### NOT green — stated plainly

| Item | State | Why |
|---|---|---|
| **ONE-COMMAND BOOT** (Environment block) | ✗ | No dependencies pinned or installed; Next.js is absent. A clean clone does not produce a running app. |
| **FIXTURE USERS** (Environment block) | ✗ | No `packages/db/src/seed.ts`, so no seeded user per RBAC role. `qa` cannot log in — an ENV-DEFECT to close, not a proof to skip. |
| **FAST VERDICT** (Environment block) | ~ | `pnpm check` exists and completes in seconds across 8 packages, but every package script is a placeholder `echo`. It verifies nothing until real lint/typecheck/test are wired. |
| **Design direction** | ~ | Artifact exists and the gate passes on presence, but no human chose the direction. Structural, not substantive. |
| **Four ADR-001 open decisions** | open | PDF engine · email level · Q21 browser MCP · design sign-off. Recorded as open, deliberately not defaulted. |
| **`.mcp.json`** | absent | Correct per the checklist — that row applies only if Q21 = A, and Q21 is unanswered. The answer is in the ledger and UI runs carry `SKIP browser-inspect`. |

`.env.example` is ✓ (14 variables, placeholders only). All of the above is written into `.ai/STATE.md` → Open failures and `.ai/backlog.md`, so the next session inherits them rather than rediscovering them.

### Doc-drift check — 4 lines, none a repo defect

The freshness pass initially printed 7 `DRIFT` lines. Three were real and fixed (bare `STATE.md` and `graph.json` mentions in prose → qualified to `.ai/STATE.md` / `graphify-out/graph.json`; "pnpm monorepo" reworded to "monorepo via pnpm"). The remaining four were each traced to source:

| DRIFT line | Cause | Verdict |
|---|---|---|
| `GRAPH_REPORT.md` | bare filename inside **graphify's own injected AGENTS.md section**; the file exists at `graphify-out/GRAPH_REPORT.md` | false positive |
| `graphify-out/wiki/index.md` | conditional reference ("if it exists") in graphify's injected section; the wiki is an optional upgrade that was not run | false positive |
| script `install` | `pnpm install` is a package-manager builtin, not a package script | heuristic limitation |
| script `test:e` | the check's regex `pnpm [a-z:-]+` excludes digits, truncating `pnpm test:e2e`; `"test:e2e"` **is** in package.json | **regex bug in `repo-done-checklist.md`** |

---

## Findings for the framework

1. **`repo-done-checklist.md` drift regex drops digits.** `grep -oE 'pnpm [a-z:-]+'` turns `pnpm test:e2e` into `test:e` and reports a false DRIFT on a script that exists. Suggested fix: `'pnpm [a-z0-9:-]+'`. It also cannot distinguish pnpm builtins (`install`) from scripts — worth an exclusion list or a note, since `pnpm install` is in the template's own Key Commands.
2. **`graphify-setup.md`'s commit list omits `.gitattributes`.** `graphify hook install` registers the union-merge driver by writing `graphify-out/graph.json merge=graphify` to `.gitattributes`, but the documented `git add` line (`graphify-out/ .gitignore .claudeignore .claude/settings.json CLAUDE.md AGENTS.md .codex/`) does not include it. Left uncommitted, the conflict-free merge of `graph.json` silently does not apply for anyone else on the team — the exact failure the driver exists to prevent. I committed it explicitly.
3. **`graphify update .` writes a dated snapshot** (`graphify-out/2026-07-26/` — a full duplicate of graph.json, GRAPH_REPORT.md, manifest) which the documented `.gitignore` lines (`cost.json`, `cache/`) do not cover, so it lands in the commit. Over months that is a committed copy of the whole map per update day. Worth an explicit keep-or-ignore line in the skill.
4. **Step 5 portability normalization is essential, not optional** — confirmed empirically: both installers wrote `C:/Users/karol/.local/bin/graphify.EXE` into committed files. The skill is right to mark it REQUIRED; the `sed` works as written under Git Bash on Windows.
5. **The graphify/Sailes hook merge is genuinely non-destructive** — our `permissions` block and our `Edit|Write` guard hook survived `graphify claude install` intact, and `graphify codex install` wrote to `.codex/hooks.json` without touching `.codex/config.toml`. Both claims in the skill hold.
6. **A checklist that only tests presence can pass on an unusable repo.** Every mandatory row went green while the app cannot boot and `qa` cannot log in. The Environment block catches this, but it sits *below* the "any MISS means not done" line and is not part of the pass/fail script — so an agent optimizing for the green block can hand off a repo no one can run. Consider promoting ONE-COMMAND BOOT / FIXTURE USERS into the scripted block, or making the handoff state them explicitly.
7. **Empty `.ai/` dirs are invisible to git.** `specs/implemented/` and `specs/archived/` pass the on-disk check but do not survive a clone. Added `.gitkeep` files; the skeleton could ship them by default.

---

## Commit history produced

```
d37577b  chore: commit graphify union-merge driver (.gitattributes) + refreshed map
4c891cd  docs(state): record bootstrap verification evidence and open failures
9028a9b  docs: fix AGENTS.md path drift; track empty spec lifecycle dirs
f7d19dd  chore: graphify code map + freshness hooks (Sailes default)
dbf4b16  chore: agentic-first bootstrap skeleton (Case B)
a8a1cb9  initial                                    ← pre-existing
```
(plus `docs(backlog): note graphify dated-snapshot growth` — 7 commits total)

## Handoff

Bootstrap is complete and the checklist is green. The correct next move is **not** straight to spec: the owner should first answer the four open ADR-001 decisions (PDF engine especially — it shapes the worker and the design system), and the first spec must close the environment gap (pin dependencies, seed one user per RBAC role) so `qa` can drive a real flow. Spec phase then uses the local `.ai/skills/spec-writing/SKILL.md`.
