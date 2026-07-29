# agents/ — the Sailes agent team

> **Why this lives in `docs/` and not `agents/`.** Claude Code auto-discovers every `.md`
> in a plugin's `agents/` directory and registers it as an agent — frontmatter or not. While this
> file sat there it shipped as a phantom agent type named `README` on every machine with the
> plugin: no description, so the model had no basis to choose it, and no `tools` list, so it
> inherited everything including `Agent`. Found 2026-07-26 by installing the plugin and reading
> `claude plugin details`, which listed **Agents (9)** for eight roles.

These are the role definitions the `sailes-bootstrap` skill describes in
`skills/sailes-bootstrap/agent-team-structure.md` (the canonical spec: roles,
pipeline order, gates, lifecycle). This directory is the **installable** form of
that team — Claude Code auto-discovers `agents/` at the plugin root, so
`plugin install sailes-app-builder@sailes` from the marketplace pulls them in.

> The directory MUST be `agents/` (no dot). A dot-prefixed `.agents/` is ignored
> by plugin component discovery — that was the original "marketplace doesn't
> install agents" bug: the roles existed only as prose, and any folder that did
> exist used a dot prefix.

Ten files, one per role: `team-lead.md`, `explorer.md`, `researcher.md`, `designer.md`, `be-dev.md`,
`fe-dev.md`, `tester.md`, `checker.md`, `qa.md`, `docs-author.md`.

**What each role does, and what model and effort it is pinned to, lives in exactly one place:**
`skills/sailes-bootstrap/agent-team-structure.md`. Do not restate it here. That table used to exist in
three files, and on 2026-07-26 all three had drifted — two of them had silently lost `tester`
altogether, so a reader of either ran a pipeline with one gate missing and no way to notice. One table
with pointers is the fix; a second copy is a second thing to forget.

Pipeline: `explorer → designer → BE contract frozen → fe-dev → tester → checker → qa`.
`docs-author` sits outside that order — it runs at bootstrap/adopt and before the docs-delta
step of spec closure (`sailes-docs`).

Edit the canonical skill and these files together — the skill is the source of
truth for behavior; these files are how the roles become real, installable agents.
