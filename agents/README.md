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

| File | Role | Model | Stage in pipeline |
|---|---|---|---|
| `team-lead.md` | plan · decompose · assign · integrate · run gates · final verdict | opus | (lead) |
| `explorer.md` | read-only recon → `file:line` findings | haiku | 1 |
| `designer.md` | UX/UI spec from design tokens | sonnet | 2 |
| `be-dev.md` | implement approved backend scope | sonnet | 3 |
| `fe-dev.md` | implement approved UI scope | sonnet | 4 |
| `checker.md` | independent diff-vs-spec review gate | sonnet | 5 |
| `qa.md` | real-flow behavior proof + vision-verify | sonnet | 6 |

Pipeline: `explorer → designer → BE contract frozen → fe-dev → checker → qa`.

Edit the canonical skill and these files together — the skill is the source of
truth for behavior; these files are how the roles become real, installable agents.
