# Spec: browser inspection as an optional instrument for the UI and diagnosis gates

Status: edits complete on branch — shape approved by the human in session, 2026-07-25. **Not yet
proven:** both evals are RED/GREEN pending, so this stays in `.ai/specs/` root (live) and does not
move to `implemented/` until they return a verdict and the PR merges.
Framework-Version target: 1.14.0
Branch: `feat/browser-devtools-instrument` (based on `origin/main` = 1.13.0)
Author: session 2026-07-25 (human present; the shape below was presented as an 8/10 recommendation and approved before any edit)

---

## 1. TLDR & Context

We were asked to evaluate `chrome-devtools-mcp` (Chrome DevTools over CDP as an MCP server) against
this framework and decide whether to adopt it. Verdict: **adopt as an optional instrument, not as a
skill and not as a requirement.**

The reason is narrow and specific. Three of our own gates state a **binary** requirement and then
hand the agent an instrument that cannot produce a binary answer:

| Gate | Stated in | Instrument before this change |
|---|---|---|
| Physical-integrity — six pass/fail checks | `sailes-design/SKILL.md` §Render and self-verify | a screenshot + the model's eyes |
| Contrast ≥4.5:1 · focus visible · keyboard nav · dark mode checked separately | `sailes-design/ux-rules.md:7,37,66` | an unticked checkbox |
| Latency budget (<100ms / 100–300ms / 300ms–2s) | `sailes-design/premium-ux.md` §1 | nothing |

The gate's own wording is *"categorical checks — pass/fail, not opinion"*. A model reading a PNG
delivers neither. CDP measures all three directly, so this is not a new capability bolted on — it is
the missing instrument for gates we already mandate.

Fourth, independent gain: `sailes-diagnose` rule #2 requires the real flow with *"request URL +
response + console"* captured before any code audit, and `diagnosis-loop.md` §1 concedes that a
fresh Playwright context **structurally cannot** reproduce a stale-`localStorage` bug. The
DevTools server does not start fresh (persistent profile; `--browserUrl` attaches to a running
browser), so the state-dependent branch of that tree becomes observable rather than reconstructed.
That branch is the founding case of the skill ("loads 2008").

**Why now:** we hit the instrument gap in practice, and adopting it costs one reference file plus
pointers — no new skill, no new agent, no new phase.

## 2. Decisions (approved in session)

| # | Decision | Options considered | Call | Cost / regret if flipped |
|---|---|---|---|---|
| D1 | **New skill, or an instrument reference?** | (A) new `sailes-browser` skill; (B) one shared reference linked cross-skill | **(B) reference** — `skills/sailes-design/browser-inspect.md`, linked from diagnose and test via `../`, matching the existing `../sailes-bootstrap/ui-libraries.md` pattern | Low. A skill implies a process; this is a measuring device used *inside* three existing processes. Flipping to A later is a file move. |
| D2 | **Mandatory or optional?** | (A) required for UI work; (B) optional with explicit-SKIP fallback | **(B) optional** | **Load-bearing.** Precedent is our own: the `implemented/`-hook was rejected in `backlog.md` on blast radius ("a hook changes behavior in every repo on the machine"), and `main` auto-deploys to every machine. A mandatory tool absent from a machine points agents at a nonexistent instrument, repo-wide. Graceful degradation follows `graphify` (1.12.0): fallback + `SKIP` line, never silence. |
| D3 | **How is the Playwright boundary protected?** | (A) trust; (B) an explicit hard rule in the test doctrine + its own eval | **(B)** — `browser-e2e.md` §Devtools is not a test, plus `evals/devtools-evidence-does-not-replace-a-suite-test.md` | **Highest-risk item in this change.** CDP evidence is ephemeral: an agent can "verify" a behavior by clicking and leave no test, which runs the ratchet backwards. The tempting path is cheaper than the correct one, so it needs a rule and a regression scenario, not goodwill. Without D3 this adoption is net-negative. |
| D4 | **Machine-global or per-project?** | (A) document a global `claude mcp add --scope user`; (B) a committed `.mcp.json` decision card in bootstrap; (C) both | **(C)** — machine prereq documented in the reference; per-project opt-in as `decision-engine.md` **Q21**, human chooses, logged in the Decisions Ledger | Low. Q21 names option C (per-developer only) as the *bad* path explicitly, because it makes the gate measured on one machine and skipped on another with no signal in the repo. |
| D5 | **Which agents get the tools?** | (A) qa + fe-dev; (B) also designer; (C) also be-dev/tester | **(A) qa + fe-dev** | See §5 — the one item left open. `designer` deliberately has no Bash today (it writes artifacts, it does not run things); giving it a browser widens a role boundary and that is a call for the human, not a side effect of this change. |
| D6 | **Is Lighthouse performance a gate?** | (A) yes, thresholds; (B) accessibility only as a gate; performance measured but relative on dev | **(B)** | Low, and it protects us: `lighthouse_audit` excludes performance by design, and a dev server's LCP comes from an unminified HMR bundle with no CDN. A green threshold computed there is *"a step that reports success for a reason other than the one claimed"* — the exact pattern `.ai/STATE.md` records as this repo's recurring failure. Absolute thresholds are asserted on production/preview builds only. |

## 3. Problem Statement

An agent asked to pass the physical-integrity gate today renders a screenshot and forms an
impression. The gate's six checks are all *geometrically measurable* — a control covered by an
overlay is present, visible, correctly styled, and completely unusable, and no screenshot shows
that. The same holds for contrast ratios and interaction latency: stated as numbers, verified by
vibe. Meanwhile `sailes-diagnose` mandates live console/network evidence with no tool named, and
concedes a structural blind spot for state-dependent bugs.

## 4. What changed

| File | Change |
|---|---|
| `skills/sailes-design/browser-inspect.md` | **new** — the instrument reference: boundary rule, availability + fallback, the integrity probe (fixture-verified), a11y via `lighthouse_audit` + dark-mode `emulate`, CWV + the dev-server trap, diagnosis capture, invocation map |
| `skills/sailes-design/SKILL.md` | integrity gate gains "measure the six, don't eyeball them" (optional, with SKIP fallback); Quick Reference row; reference list; two Common Mistakes rows |
| `skills/sailes-design/ux-rules.md` | contrast (`:7`), dark mode (`:37`) and the pre-delivery checkbox (`:66`) now name the measurement or an explicit SKIP |
| `skills/sailes-design/premium-ux.md` | latency budget gains CWV measurement + the dev-server-is-relative-only caveat |
| `skills/sailes-diagnose/diagnosis-loop.md` | Step 1 Live: how to capture console/network/storage; read-only-on-production and no-dialog constraints restated for a browser; the state-dependent branch gains the persistent-profile answer |
| `skills/sailes-diagnose/SKILL.md` | reference table row pointing at the instrument |
| `skills/sailes-test/references/browser-e2e.md` | **§Devtools is not a test** — the boundary rule + the four-row division table |
| `agents/qa.md`, `codex-agents/qa.toml` | browser tools; measure the integrity gate on the real surface; never substitute a drive-through for the suite run |
| `agents/fe-dev.md`, `codex-agents/fe-dev.toml` | browser tools; render+measure before reporting; measurement (or SKIP) in the report |
| `skills/sailes-bootstrap/decision-engine.md` | **Q21** browser-inspection decision card (A/B/C + recommendation), Output-of-phase mention |
| `skills/sailes-bootstrap/codex-config-template.md` | concrete `[mcp_servers.chrome-devtools]` twin |
| `skills/sailes-bootstrap/repo-done-checklist.md` | conditional `.mcp.json` row (only when Q21 = A) |
| `evals/integrity-gate-reports-measurements-not-impressions.md` | **new** — two arms: instrument present → cites the defect list; absent → explicit SKIP, never a silent pass |
| `evals/devtools-evidence-does-not-replace-a-suite-test.md` | **new** — the D3 guard under time pressure |

## 5. Open question for the human (one)

**D5 — does `designer` get browser tools?** Today it has `Glob, Grep, Read, Write, Edit` and no
Bash, so it cannot render anything; the physical-integrity gate is executed by whoever builds
(`fe-dev`), and `SKILL.md:50` already says "if you also build". Giving `designer` read-only browser
tools would let it render and measure its own spec before handoff — a real improvement — but it
changes what that role *is*. Left unchanged deliberately. Answer it and it is a three-line edit.

## 6. Verification

- Integrity probe, fixture-verified 2026-07-25 (Chrome 151, 1280×783): a page with five deliberate
  defects (clipped container, off-canvas button, 2400px-wide overflow, overlay-covered button,
  10×10px control) returned all five; a clean page returned `PASS: true`. Output pasted in
  `browser-inspect.md` §1. Also documented there: an empty `overlap` does **not** mean nothing is
  covering anything — a non-interactive overlay is check 5's finding, which is what the fixture run
  actually demonstrated.
- `npm test` (workflow-router + TOML validation incl. both edited agent TOMLs and the ROLES-vs-disk
  guard): all passing.
- MCP server itself: 29 tools; end-to-end navigate → `evaluate_script` → console → network →
  performance trace → screenshot verified against a live page.

## 7. Non-goals

- No new skill, agent, or pipeline phase.
- Not a replacement for Playwright anywhere. The suite remains the only thing that protects a
  behavior over time (D3).
- No performance thresholds gated on dev-server numbers (D6).
- No visual-diff/pixel-comparison automation — `.ai/screens/` vision-verify stays as it is.
- Not wired into `sailes-async`, `sailes-database`, `sailes-hosting` — no browser surface there.

## 8. Follow-ups

- Both evals are **RED/GREEN pending** — they need a fresh-subagent run before this is claimed
  proven. Written first, per the `evals/README.md` rule.
- D5 (designer) awaits the human.
- If option A (`.mcp.json`) proves itself in a real client repo, consider whether the Q21 default
  should flip from "recommend" to "default for UI repos, opt-out".
