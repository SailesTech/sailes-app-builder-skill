# Explorer 2 — recon: `skills/sailes-design/`

Slice: `skills/sailes-design/`. All files read.

## Summary table

| Tool | Version constraint | Confidence |
|---|---|---|
| chrome-devtools MCP | **>= 1.14.0** (1.14.0 broken, fixed in 1.14.1) | high |
| Tailwind | v4 | high |
| React | 19 | high |

## Detail

**chrome-devtools MCP.** Referenced in five of the files in my slice. The install command is
`claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest`. Absence behaviour
is stated repeatedly and identically: record `SKIP browser-inspect (chrome-devtools MCP absent)` in
the artifact, plus a screenshot fallback.

On versions: **no version floor is stated for this MCP server anywhere in my slice** — the install
pins `@latest` and nothing narrows it. The numbers 1.14.0 and 1.14.1 that appear near it are run
evidence with a repo version stamp, not a constraint on the server.

**Tailwind v4** and **React 19** appear in `premium-craft.md:7`.
