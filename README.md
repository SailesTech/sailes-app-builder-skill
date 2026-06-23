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

### How Claude Code finds skills

Claude Code loads skills from `~/.claude/skills/<name>/SKILL.md` (global) — that's where `install.sh` puts them. It activates a skill automatically when your request matches the skill's `description` triggers, or when you type `/<skill-name>`.

## What you get

| Skill | Use it for |
|---|---|
| **sailes-start** | "Lead me through the whole thing." End-to-end orchestrator: routes the project, runs the phases below with a gate at each boundary. |
| **sailes-discovery** | The interview before the spec. Pulls full intent into a structured Brief; every key decision is the user's (decision cards with pros/cons); deep business + existing-infrastructure probing. |
| **sailes-bootstrap** | Stack + architecture + agentic-first methodology. Generates/validates the repo standard (AGENTS.md, `.ai/`, git), runs the design gate, **verifies artifacts on disk** before handoff. |
| **sailes-design** | The frontend/visual design phase. Deliberate direction (palette/type/layout/signature) + anti-AI-default check + a11y discipline → a persisted design artifact. |
| **sailes-spec** | Turns the brief into a phased, testable spec (skeleton → Open Questions gate → data model / API-UI / integration coverage / security / non-goals). Used when a repo has no local `.ai/skills/spec-writing/`; bootstrap generates a local copy for new repos. |
| **sailes-pipedrive** | Reference for building Pipedrive app extensions (JSON panel, custom UI iframe, floating window, manifest/OAuth, signed-JWT auth, ACL, API proxy). A domain sibling, not part of the core pipeline. |

Full pipeline diagram, invariants, and per-skill file lists: see **[`skills/README.md`](skills/README.md)**.

## The pipeline (one line)

```
sailes-start → sailes-discovery (Brief) → sailes-bootstrap (repo standard + stack)
            → sailes-design (design artifact) → sailes-spec (local copy if present) → implementation
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
