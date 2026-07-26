# Sailes Codex agent definitions

Each file in this directory is a global Codex custom-agent definition. The installer copies the seven files to `~/.codex/agents/` and owns only the marked block it adds to `~/.codex/config.toml`.

| Codex role | Claude source | Pipeline responsibility |
| --- | --- | --- |
| `team-lead` | `agents/team-lead.md` | coordination and gates |
| `explorer` | `agents/explorer.md` | read-only recon |
| `designer` | `agents/designer.md` | UI specification |
| `be-dev` | `agents/be-dev.md` | frozen backend contract |
| `fe-dev` | `agents/fe-dev.md` | UI against frozen contract |
| `checker` | `agents/checker.md` | isolated review |
| `qa` | `agents/qa.md` | browser behavior proof |

The Codex schema intentionally has only `name`, `description`, and `developer_instructions`. The Claude roles' pinned model IDs (`claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`), their `effort:` levels, and their tool allow-lists are not copied: all three are Claude-specific and unsupported here. The role instructions preserve the intended capability split, pipeline order, isolation, and permissions without pinning unavailable model settings.

**Two 1.16.0 features are Claude-harness-only, by nature rather than by omission** — recorded here so a future parity audit reads this as a boundary, not as drift:

- **Per-task model escalation** relies on the Agent tool's per-invocation `model`/`effort` parameters, which have no Codex equivalent. The Codex analogue already exists and lives in `agents/team-lead.md`: pin `-m <model>` on every `codex exec`, read from the human's config rather than guessed. The *rule* transfers — escalate on judgment, never on volume, and log the reason — even though the mechanism does not.
- **Sub-teams ("commando mode")** need nested subagent spawning, which is a Claude Code runtime feature (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`). A Codex worker is invoked as one `codex exec` per task and spawns nothing, so there is no depth to cap. A Codex-only user loses no capability they could otherwise have had.

The managed config contract is:

```toml
# BEGIN sailes-app-builder managed agents
[agents.explorer]
config_file = "agents/explorer.toml"
# ... remaining Sailes roles
# END sailes-app-builder managed agents
```

Do not edit that region by hand. The installer replaces it as a unit, preserves all content outside it, and refuses a same-name Sailes agent declared outside it. When a Claude role changes, update its matching TOML alongside it.

One deliberate exception to that rule: the runtime-delegation block in `agents/team-lead.md` ("use Codex for the backend") has **no counterpart here**, and that is not an oversight. These roles already run on Codex, so delegating *to* Codex is meaningless; a hand-off back to Claude would make a second vendor a requirement rather than an option. Delegation is one-directional by design — see `sailes-bootstrap/agent-team-structure.md` (Delegation mechanism).
