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

The Codex schema intentionally has only `name`, `description`, and `developer_instructions`. The Claude roles' `opus`, `sonnet`, and `haiku` labels and tool allow-lists are not copied: they are Claude-specific and unsupported here. The role instructions preserve the intended capability split, pipeline order, isolation, and permissions without pinning unavailable model settings.

The managed config contract is:

```toml
# BEGIN sailes-app-builder managed agents
[agents.explorer]
config_file = "agents/explorer.toml"
# ... remaining Sailes roles
# END sailes-app-builder managed agents
```

Do not edit that region by hand. The installer replaces it as a unit, preserves all content outside it, and refuses a same-name Sailes agent declared outside it. When a Claude role changes, update its matching TOML alongside it.
