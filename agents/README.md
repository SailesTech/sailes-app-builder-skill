# agents/ — the Sailes agent team

These are the role definitions the `sailes-bootstrap` skill describes in
`skills/sailes-bootstrap/agent-team-structure.md` (the canonical spec: roles,
pipeline order, gates, lifecycle). This directory is the **installable** form of
that team — Claude Code auto-discovers `agents/` at the plugin root, so
`plugin install sailes-app-builder@sailes` from the marketplace pulls them in.

> The directory MUST be `agents/` (no dot). A dot-prefixed `.agents/` is ignored
> by plugin component discovery — that was the original "marketplace doesn't
> install agents" bug: the roles existed only as prose, and any folder that did
> exist used a dot prefix.

| File | Role | Model · effort | Stage in pipeline |
|---|---|---|---|
| `team-lead.md` | plan · decompose · assign · integrate · run gates · final verdict | `claude-opus-5` · high | (lead) |
| `explorer.md` | read-only recon → `file:line` findings | `claude-haiku-4-5` · — | 1 |
| `designer.md` | UX/UI spec from design tokens | `claude-sonnet-5` · high | 2 |
| `be-dev.md` | implement approved backend scope | `claude-sonnet-5` · high | 3 |
| `fe-dev.md` | implement approved UI scope | `claude-sonnet-5` · high | 4 |
| `checker.md` | independent diff-vs-spec review gate | `claude-sonnet-5` · high | 5 |
| `qa.md` | real-flow behavior proof + vision-verify | `claude-sonnet-5` · high | 6 |

Pipeline: `explorer → designer → BE contract frozen → fe-dev → checker → qa`.

Edit the canonical skill and these files together — the skill is the source of
truth for behavior; these files are how the roles become real, installable agents.
