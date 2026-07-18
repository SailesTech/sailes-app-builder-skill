# Codex config template — `.codex/config.toml` (the Codex twin of `.claude/settings.json`)

Generate this at repo root **alongside** `.claude/settings.json` so the repo's guardrails
work whether a developer drives it with **Claude Code** or **OpenAI Codex CLI**. Same
`AGENTS.md`, same hook *scripts*, two harness configs. This is what makes a Sailes-built app
"run correctly under Codex too" — not just *readable* by Codex (that's AGENTS.md), but
*guarded* by Codex.

## Why this file exists — the mapping

Codex reads `AGENTS.md` natively (global `~/.codex` → repo root → subdir hierarchy), so the
instructions transfer for free. What does **not** transfer for free is the mechanical backstop
— Claude's `.claude/settings.json`. Codex has its own equivalents:

| Claude Code (`.claude/settings.json`) | Codex CLI (`.codex/config.toml`) | Notes |
|---|---|---|
| `hooks.SessionStart` → inject `.ai/STATE.md` | `[[hooks.SessionStart]]` → same script, stdout is appended as context | **Identical contract.** Reuse the script verbatim. |
| `hooks.PreToolUse` (matcher `Edit\|Write`) → guard protected paths | `[[hooks.PreToolUse]]` (matcher `apply_patch\|Edit\|Write`) → same script | Same stdin-JSON payload + exit-2-to-block contract. **Caveat below.** |
| `permissions.allow` (verify cmds run without a prompt) | `sandbox_mode = "workspace-write"` + `approval_policy = "on-request"` | Codex has no per-command allowlist; the sandbox is the model — reads/writes inside the workspace run un-prompted, escapes prompt. |
| `permissions.deny` (force-push, prod migrate, secret reads) | `[[hooks.PreToolUse]]` matcher `Bash` → guard script inspects `tool_input.command` | Deny-by-command becomes a Bash PreToolUse hook that exits 2. |

**Hook contract is the same in both harnesses** (verified against Codex hooks reference):
a hook receives the event as a **single JSON object on stdin** (`tool_name`, `tool_input`,
`cwd`, `hook_event_name`, …); a `PreToolUse` hook **blocks** by either exiting **2** with the
reason on **stderr**, or printing `{"hookSpecificOutput":{"hookEventName":"PreToolUse",
"permissionDecision":"deny","permissionDecisionReason":"…"}}`. `SessionStart` **injects
context** by printing plain text to **stdout**. Because the payload and the block mechanism
match Claude Code, **one guard script serves both** — see `guard-protected-paths.sh` below.

> ⚠️ **Known Codex limitation (encode it, don't paper over it).** On some Codex versions
> `PreToolUse` fires **only for the `Bash` tool** — `apply_patch` file edits may **not** emit
> the event (openai/codex issue #16732). So the `apply_patch|Edit|Write` matcher below is
> best-effort: where it fires it guards protected-path edits; where it doesn't, the backstop is
> (a) the `Bash` matcher still catches shell-driven writes (`echo … > .env`, `sed -i` on a
> migration), (b) `sandbox_mode`/`approval_policy` still gate escapes, and (c) the AGENTS.md
> **Hard Safety Rules** remain the prose fallback. Do **not** claim file-edit protection is
> airtight under Codex — state the Bash-path is enforced and the edit-path is best-effort until
> your Codex version emits the event for `apply_patch`.

## `.codex/config.toml`

Adapt the command patterns to the repo's real package scripts (same edits you make to
`.claude/settings.json`). Scripts are resolved from the git root so `cwd` doesn't matter.

```toml
# Sailes app-builder — Codex CLI guardrails (twin of .claude/settings.json).
# Only Codex-specific keys live here; AGENTS.md is the shared source of truth.

# --- Sandbox & approvals: the "permissions" model -------------------------------
# workspace-write = reads/writes inside the repo run without a prompt (fast inner loop),
# anything escaping the workspace (or the deny-hooks below) needs approval.
sandbox_mode    = "workspace-write"
approval_policy = "on-request"

[sandbox_workspace_write]
network_access = false          # flip to true only if the dev loop needs it (installs, etc.)
exclude_slash_tmp = false

# --- SessionStart: inject session memory (same script as Claude) ----------------
[[hooks.SessionStart]]
[[hooks.SessionStart.hooks]]
type = "command"
command = 'sh "$(git rev-parse --show-toplevel)/.claude/hooks/session-start.sh"'
statusMessage = "Loading .ai/STATE.md + Task Router"
timeout = 15

# --- PreToolUse (Bash): deny the protected command surface ----------------------
[[hooks.PreToolUse]]
matcher = "Bash"
[[hooks.PreToolUse.hooks]]
type = "command"
command = 'sh "$(git rev-parse --show-toplevel)/.claude/hooks/guard-protected-paths.sh"'
statusMessage = "Checking command against protected surface"
timeout = 30

# --- PreToolUse (file edits): best-effort protected-path guard (see caveat) ------
[[hooks.PreToolUse]]
matcher = "apply_patch|Edit|Write"
[[hooks.PreToolUse.hooks]]
type = "command"
command = 'sh "$(git rev-parse --show-toplevel)/.claude/hooks/guard-protected-paths.sh"'
statusMessage = "Checking edit target against protected paths"
timeout = 30

# --- MCP servers (optional): the Codex equivalent of .mcp.json -------------------
# [mcp_servers.example]
# command = "npx"
# args = ["-y", "@some/mcp-server"]
# env = { API_KEY = "env:EXAMPLE_API_KEY" }
```

## Shared hook scripts — one implementation, both harnesses

The scripts are **harness-agnostic** (they parse the same stdin JSON and use the same exit
codes). Keep them under `.claude/hooks/` and let both configs point at them — do **not** fork a
`.codex/hooks/` copy that drifts. (If you'd rather not have Codex reference a `.claude/` path,
move them to `.ai/hooks/` and update both `.claude/settings.json` and `.codex/config.toml` — but
keep it a *single* copy.)

### The two shared hook scripts

They ship as **real files**, not as code blocks to transcribe:

| Source in this skill | Copy to |
|---|---|
| `hooks-template/session-start.sh` | `.claude/hooks/session-start.sh` |
| `hooks-template/guard-protected-paths.sh` | `.claude/hooks/guard-protected-paths.sh` |

`cp` them and `chmod +x`. They were prose here until 1.9.0, which meant the only mechanical
enforcement the framework owns depended on an agent retyping shell correctly — the bodies now
live in one place so this file cannot drift from what actually ships.

> The guard is intentionally a **string-match on the raw payload** (no `jq`) so it is portable
> across both harnesses and any OS shell. Tighten it per project — the point is a *mechanical*
> backstop for the AGENTS.md Hard Safety Rules, not a complete policy engine. For richer command
> policy on Codex, layer `execpolicy` rules or an `approval_policy = { granular = { … } }` block.

## What to also generate next to this file

- `CLAUDE.md` → `@AGENTS.md` (Claude entry point — unchanged).
- **`.github/copilot-instructions.md`** → a one-line pointer to `AGENTS.md` (or a short copy),
  so the third common harness reads the same source of truth.
- Keep `AGENTS.md`'s **Enforcement** section listing *both* backstops:
  `.claude/settings.json` **and** `.codex/config.toml`, with the note that in a harness without
  hooks the prose Hard Safety Rules are the fallback.

## Verify on disk (add to the repo Definition of Done)

```sh
ROOT="$(pwd)"
for f in .codex/config.toml .claude/hooks/session-start.sh .claude/hooks/guard-protected-paths.sh; do
  [ -e "$ROOT/$f" ] && echo "OK   $f" || echo "MISS $f"
done
# config references scripts that exist
grep -oE '\.claude/hooks/[A-Za-z0-9_.-]+\.sh' "$ROOT/.codex/config.toml" 2>/dev/null | sort -u | while read -r s; do
  [ -e "$ROOT/$s" ] && echo "OK   .codex refs $s" || echo "DRIFT .codex/config.toml references missing $s"
done
```
