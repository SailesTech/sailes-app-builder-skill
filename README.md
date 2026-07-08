# Sailes App-Builder Skills

A modular set of Claude Code skills that lead agents **and** developers through building custom B2B web apps in a **repeatable, standardized, agentic-first** way — from business discovery to an implementation-ready repo. The goal: everyone at the company builds apps the same way, with the **developer consciously owning every key decision** (the AI recommends with pros/cons; the human chooses).

## Install (global)

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

## Distribute to the team as a Claude Code plugin (marketplace)

This repo is also a **Claude Code plugin marketplace** (`.claude-plugin/marketplace.json` → the `sailes-app-builder` plugin, which ships every `skills/sailes-*`). This is the go-forward way to give the whole team the skills — no manual `git clone` / `install.sh` per person.

> **Reality check:** Claude Code plugin config is **not** synced by your Anthropic account. It lives in per-machine `settings.json`. So "everyone auto-gets it" means the marketplace must be registered in each machine's settings **once** — after that the plugin auto-installs in *every* project on that machine.

**Each teammate runs once per machine:**

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File .\enable-plugin.ps1
# macOS / Linux
./enable-plugin.sh
```

The script merges into `~/.claude/settings.json` (without clobbering your other keys):

```json
{
  "extraKnownMarketplaces": {
    "sailes": { "source": { "source": "github", "repo": "SailesTech/sailes-app-builder-skill" } }
  },
  "enabledPlugins": { "sailes-app-builder@sailes": true }
}
```

Restart Claude Code → the plugin auto-installs and updates from GitHub. Manual equivalent, if you prefer typing it:

```
/plugin marketplace add SailesTech/sailes-app-builder-skill
/plugin install sailes-app-builder@sailes
```

**Fully zero-touch (org-enforced):** deploy the same JSON as a read-only *managed settings* file to each Windows machine via IT/MDM/login-script at `C:\ProgramData\ClaudeCode\managed-settings.json`. This can't be disabled by users, but requires a way to push a file to every machine.

> **Plugin vs `install.sh`:** the plugin is the team distribution channel; `install.sh` is the local-dev path (edit under `skills/`, install a copy). On a machine using the plugin, you don't also need `install.sh` — running both just loads the skills twice.

### How Claude Code finds skills

Claude Code loads skills from `~/.claude/skills/<name>/SKILL.md` (global) — that's where `install.sh` puts them. It activates a skill automatically when your request matches the skill's `description` triggers, or when you type `/<skill-name>`.

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
skills/                 # the skills (source of truth) — installed by install.sh
  sailes-*/SKILL.md     #   one folder per skill (+ reference files)
  README.md             #   pipeline overview, invariants, file index
install.sh              # global installer (copy into ~/.claude/skills/)
skile do inspiracji/    # provenance: source material the skills were distilled from
```

## Working on the skills

Maintained with the `superpowers:writing-skills` discipline: **no skill edit without a failing test first** (baseline a real behavior on a subagent → edit → re-test). Edit under `skills/` here, then `./install.sh` to make the change active locally.
