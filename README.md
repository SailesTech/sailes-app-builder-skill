# Sailes App-Builder Skills

A modular set of agentic-coding skills — for **Claude Code** and **OpenAI Codex CLI** — that lead agents **and** developers through building custom B2B web apps in a **repeatable, standardized, agentic-first** way — from business discovery to an implementation-ready repo. The goal: everyone at the company builds apps the same way, with the **developer consciously owning every key decision** (the AI recommends with pros/cons; the human chooses).

> **Two harnesses, one source of truth.** The skills (`SKILL.md`) run in both Claude Code and Codex; the repos they generate carry guardrail twins for both (`.claude/settings.json` **and** `.codex/config.toml`, sharing the same hook scripts) plus a Copilot pointer. See **[Codex CLI support](#codex-cli-support)** below.

## Which install method? — you choose (recommended: **the plugin**)

Two ways to get these skills. Both make the same `sailes-*` skills active; they differ in **how updates reach you**. Pick one — don't run both on the same machine (the skills would load twice).

| | **A. Plugin — Claude Code marketplace** ✅ recommended | **B. `install.sh` — global copies** |
|---|---|---|
| **How updates reach you** | **Central source on GitHub.** One command per machine — `/plugin marketplace update sailes` — pulls the latest; no repo on disk, no re-clone. Can be made automatic (see the update note below). | **Manual, per machine.** Everyone must have the repo on disk, `git pull`, then re-run `./install.sh`. Versions drift when people forget. |
| **First-time setup (per machine)** | Run `enable-plugin.ps1` / `.sh` **once** (or 2 `/plugin` commands). | `git clone` + `./install.sh`. |
| **Needs the repo on disk** | No — Claude Code fetches from GitHub. | Yes — the repo is the source of the copies. |
| **Team consistency** | High — one source of truth, auto-synced. | Low — depends on each person re-running the installer. |
| **Best for** | **Teams**, staying in sync, "set once & forget". | **Editing the skills themselves** (change under `skills/`, install a copy, test), or offline/air-gapped machines. |

**Recommendation:** use the **plugin** (Method A) unless you're actively developing the skills. It's the go-forward team channel: change once, everyone gets it. `install.sh` (Method B) stays as the local-dev path.

> **Note on "automatic for everyone":** Claude Code plugin config is **not** synced by your Anthropic account — it lives in per-machine `settings.json`. "Auto for everyone" therefore means the marketplace is registered on each machine **once** (the enable script); after that, updates are one central command (or automatic — see the update note in Method A). Truly zero-touch (nothing to run per machine) needs *managed settings* pushed by IT/MDM — see Method A below.

---

## Method A — Plugin (marketplace) · recommended

**Each teammate runs once per machine:**

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File .\enable-plugin.ps1
# macOS / Linux
./enable-plugin.sh
```

Restart Claude Code → the `sailes-app-builder` plugin auto-installs from GitHub. Manual equivalent, if you prefer typing it:

```
/plugin marketplace add SailesTech/sailes-app-builder-skill
/plugin install sailes-app-builder@sailes
```

The enable script merges this into `~/.claude/settings.json` without clobbering your other keys:

```json
{
  "extraKnownMarketplaces": {
    "sailes": {
      "source": { "source": "github", "repo": "SailesTech/sailes-app-builder-skill" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": { "sailes-app-builder@sailes": true }
}
```

**Getting updates.** Third-party marketplaces do **not** auto-update by default. Two options:
- **Manual (always works):** run `/plugin marketplace update sailes` when you want the latest. One command, no repo on disk.
- **Automatic (best-effort):** the `autoUpdate: true` above tells Claude Code to refresh this marketplace at session start. It's officially documented for *managed settings*; in user settings it's undocumented (harmless if ignored). Note a known Claude Code issue where `autoUpdate` refreshes the catalog but may not always re-install a plugin to its newest version — so keep the manual command as the reliable fallback.

**Fully zero-touch (org-enforced):** deploy the same JSON as a read-only *managed settings* file to each machine via IT/MDM/login-script (`C:\ProgramData\ClaudeCode\managed-settings.json` on Windows). There `autoUpdate` is officially supported, can't be disabled by users — but you need a way to push a file to every machine.

## Method B — `install.sh` (global copies)

These skills install into `~/.claude/skills/`, which makes them active in **every** project on your machine.

```bash
git clone <this-repo-url> sailes-app-builder-skill
cd sailes-app-builder-skill
./install.sh
```

Then restart Claude Code (or open a new session). Verify:

```bash
ls ~/.claude/skills      # → sailes-discovery sailes-bootstrap sailes-start sailes-design sailes-pipedrive
```

**Update** to the latest version any time: `git pull` then `./install.sh` again (it overwrites the installed copies).
**Options:** `./install.sh --dry-run` (preview, change nothing) · `./install.sh --force` (overwrite without prompting) · `./install.sh --help`.

> Installs **copies**, not symlinks — stable even if you move or delete this repo. The repo stays the source of truth; re-run `install.sh` after pulling changes.

### How Claude Code finds skills

- **Plugin (Method A):** loaded from the installed plugin; auto-triggered when your request matches a skill's `description`.
- **`install.sh` (Method B):** loaded from `~/.claude/skills/<name>/SKILL.md`; same auto-trigger, or type `/<skill-name>`.

## Codex CLI support

These skills — and the repos they generate — work under **OpenAI Codex CLI**, not just Claude Code. Codex has no plugin marketplace, so the distribution is a global copy (the analog of Method B), and the two harnesses map cleanly:

| Layer | Claude Code | Codex CLI |
|---|---|---|
| Repo instructions | `AGENTS.md` (via `CLAUDE.md`→`@AGENTS.md`) | `AGENTS.md` (read natively; global → repo → subdir) |
| The `sailes-*` skills | plugin / `~/.claude/skills/` | `~/.agents/skills/` (same `SKILL.md`, `name`+`description` frontmatter) |
| Guardrails | `.claude/settings.json` (permissions + hooks) | `.codex/config.toml` (`sandbox_mode`/`approval_policy` + `[hooks]`) |
| Hook **scripts** | `.claude/hooks/*.sh` | **the same scripts** — identical stdin-JSON + exit-2-to-block contract |

**Enable the skills for Codex (once per machine):**

```bash
# macOS / Linux
./enable-codex.sh
# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File .\enable-codex.ps1
```

This copies every `sailes-*` skill into `~/.agents/skills/` (Codex's USER-scope skill path), active in **every** repo. Start a new Codex session, then `/skills` (or reference one inline, e.g. `$sailes-discovery`). Options mirror `install.sh`: `--dry-run`, `--force`.

```bash
ls ~/.agents/skills      # → sailes-discovery sailes-bootstrap sailes-start …
```

### Codex agent team (global install)

Skills and agents are installed separately: `enable-codex.ps1` / `.sh` installs the
`sailes-*` **skills**, while the commands below install seven global Codex
**subagent roles**: `team-lead`, `explorer`, `designer`, `be-dev`, `fe-dev`,
`checker`, and `qa`. Codex must support local agent TOML configuration; start a
fresh Codex session after installing them.

```powershell
# PowerShell — preview only; creates and changes nothing
.\enable-codex-agents.ps1 -DryRun

# Install or safely update (asks once before an update)
.\enable-codex-agents.ps1

# Update Sailes-owned agent files without the prompt
.\enable-codex-agents.ps1 -Force
```

```bash
# macOS / Linux — preview, install, or non-interactive update
./enable-codex-agents.sh --dry-run
./enable-codex-agents.sh
./enable-codex-agents.sh --force
```

The installer copies only those seven TOMLs to `~/.codex/agents/` and owns one
clearly marked Sailes block in `~/.codex/config.toml`. It preserves unrelated
agents and settings. Before it changes an existing config it creates and prints a
timestamped backup; a second identical run makes no write or backup. `-Force`
skips the confirmation only — it never bypasses malformed-config or conflicting-
agent safety checks.

Verify the installation (PowerShell):

```powershell
Get-ChildItem ~/.codex/agents/*.toml | Where-Object Name -in @('team-lead.toml','explorer.toml','designer.toml','be-dev.toml','fe-dev.toml','checker.toml','qa.toml')
```

Start a fresh Codex session after installation. For non-trivial work, invoke
`team-lead`; it coordinates the relevant roles in the order
`explorer → designer → be-dev → fe-dev → checker → qa` and retains the
independent checker and QA gates.

To recover, restore the exact `.bak` path printed by the installer, or remove
only the documented Sailes managed block and these seven Sailes-owned role files:
`team-lead.toml`, `explorer.toml`, `designer.toml`, `be-dev.toml`, `fe-dev.toml`,
`checker.toml`, and `qa.toml` from `~/.codex/agents/`.

**Generated projects are Codex-ready.** `sailes-bootstrap` emits the `.codex/config.toml` guardrail twin (reusing the shared `.claude/hooks/*.sh`) and a `.github/copilot-instructions.md` pointer by default — so a Sailes app runs *guarded* under Codex, not merely readable. See `skills/sailes-bootstrap/codex-config-template.md`.

> **One known Codex caveat, handled honestly:** on some Codex versions `PreToolUse` fires only for the `Bash` tool, so shell-driven writes to protected paths are blocked but `apply_patch` edits fall back to sandbox/approval + the AGENTS.md prose rules. The template documents this rather than pretending the file-edit guard is airtight.

## What you get

| Skill | Use it for |
|---|---|
| **sailes-start** | "Lead me through the whole thing." End-to-end orchestrator: routes the project, runs the phases below with a gate at each boundary. |
| **sailes-discovery** | The interview before the spec. Pulls full intent into a structured Brief; every key decision is the user's (decision cards with pros/cons); deep business + existing-infrastructure probing. |
| **sailes-bootstrap** | Stack + architecture + agentic-first methodology. Generates/validates the repo standard (AGENTS.md, `.ai/`, git), runs the design gate, **verifies artifacts on disk** before handoff. |
| **sailes-design** | The frontend/visual design phase. Deliberate direction (palette/type/layout/signature) + anti-AI-default check + a11y discipline + premium finish on both axes (looks expensive *and* feels expensive) → a persisted design artifact with a Design log. |
| **sailes-spec** | Turns the brief into a phased, testable spec (skeleton → Open Questions gate → data model / API-UI / integration coverage / security / non-goals + spec lifecycle: status + implemented/ + archived/). Used when a repo has no local `.ai/skills/spec-writing/`; bootstrap generates a local copy for new repos. |
| **sailes-pre-implement** | Analyze an approved spec before coding — backward-compat impact, risks, gaps → readiness report (READY / WITH-FIXES / NOT-READY). Catches problems on paper. |
| **sailes-database** | When the spec touches the DB: design the PostgreSQL schema and write safe, zero-downtime migrations. 🔒 hard rules (types, migration safety) applied; 🔀 decisions (key type, jsonb/column, tenancy+RLS, soft-delete, tooling) chosen via decision cards. Drizzle / Prisma / SQL-first scaffolds. |
| **sailes-async** | When a slow/brittle integration flow (often Make/n8n) must become a fast, durable, code-first async backend: webhook intake + durable engine, parallel fan-out, retry-from-step, and a hard harness (idempotency, audit, failure alerts) under a measured latency budget. 🔒 harness rules applied; 🔀 decisions (build-vs-low-code, engine, self-host, sync-vs-defer) via decision cards. Distilled from the SRF "≤5s" build. |
| **sailes-implement** | Execute an approved+ready spec phase by phase: RED test → implement → verify with evidence → commit per step → adversarial review gate → mark spec implemented. |
| **sailes-pipedrive** | Reference for building Pipedrive app extensions (JSON panel, custom UI iframe, floating window, manifest/OAuth, signed-JWT auth, ACL, API proxy). A domain sibling, not part of the core pipeline. |

Full pipeline diagram, invariants, and per-skill file lists: see **[`skills/README.md`](skills/README.md)**.

## The pipeline (one line)

```
sailes-start → sailes-discovery (Brief) → sailes-bootstrap (repo standard + stack)
            → sailes-design (design artifact) → sailes-spec (local copy if present)
            → sailes-pre-implement (readiness) → sailes-database (schema + safe migrations, if DB touched)
            → sailes-async (durable async backend + latency speed-up, if the flow is async/slow)
            → sailes-implement (build, verifiably)
```

Each skill is **independently callable** — invoke `sailes-discovery` alone for a scope interview, `sailes-design` alone for a UI direction, etc. `sailes-start` just sequences them with hard gates.

## Repo layout

```
skills/                 # the skills (source of truth) — installed by install.sh / enable-codex.sh
  sailes-*/SKILL.md     #   one folder per skill (+ reference files) — Claude & Codex compatible
  README.md             #   pipeline overview, invariants, file index
enable-plugin.sh/.ps1   # Claude Code: register the marketplace + plugin (Method A)
install.sh              # Claude Code: global copy into ~/.claude/skills/ (Method B)
enable-codex.sh/.ps1    # Codex CLI: global copy into ~/.agents/skills/
skile do inspiracji/    # provenance: source material the skills were distilled from
```

## Working on the skills

Maintained with the `superpowers:writing-skills` discipline: **no skill edit without a failing test first** (baseline a real behavior on a subagent → edit → re-test). Edit under `skills/` here, then `./install.sh` to make the change active locally.
