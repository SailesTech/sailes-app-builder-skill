# Explorer 1 — recon: `skills/sailes-bootstrap/`

Slice: `skills/sailes-bootstrap/`. All files read in full. No subagents spawned.

## External tools found

| Tool | Location | Version constraint | If absent |
|---|---|---|---|
| graphify (`graphifyy`) | `skills/sailes-bootstrap/graphify-setup.md:6` | `graphifyy >= 0.9.23` | one-line install hint → explicit `SKIP` recorded in `.ai/STATE.md` and the done-checklist → grep fallback. "Never block, never skip silently." |
| chrome-devtools MCP | `skills/sailes-bootstrap/decision-engine.md:44` | `chrome-devtools-mcp@latest` | per-project opt-in via `.mcp.json` (bootstrap Q21) |
| pnpm | `skills/sailes-bootstrap/repo-done-checklist.md` | none stated | none stated |

Verbatim, `graphify-setup.md:6`:

> Validated against `graphifyy >= 0.9.23`

## Notes

`graphify` is the only tool in my slice carrying a true `>=` floor. Everything else is either an
`@latest` tag or unversioned. I did not look outside my slice.
