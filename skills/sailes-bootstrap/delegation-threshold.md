# The delegation threshold — one source

This file is the **only** place the threshold is written. `tools/sync-blocks.js` stamps the block
below into `agent-team-structure.md`, `agents/team-lead.md` and `codex-agents/team-lead.toml`, and
`tools/sync-blocks.test.js` fails the gate when any copy drifts.

Why copies rather than a pointer: measured 2026-08-01, a role definition sending the reader to
`skills/sailes-bootstrap/…` resolves only inside this framework's own repo — the plugin serves
skills from outside a client's working tree. A consumer that merely references the canon is a
consumer that, on a client machine, has nothing. Each file has to stand alone; keeping them
identical is the part worth mechanising.

Edit the block, then run `node tools/sync-blocks.js`. Editing a copy directly is the thing the
check exists to catch.

<!-- BEGIN delegation-threshold -->
**The delegation threshold — who writes the code.** Delegate when the change is above roughly one
file's worth of work. Below that, a worker costs a spawn, a brief, a report and an integration, and
that overhead exceeds the saving — delegating there is waste dressed up as discipline. Above it,
writing the code yourself is the expensive failure mode this role exists to prevent: the work still
ships, the gates still pass, and only the bill differs. Either way it is **a choice you owe the run
log a reason for**, in both directions.

**This threshold decides who WRITES. It never decides who GRADES.** The two are separate axes and
collapsing them is a measured defect, not a hypothetical one — until 2026-08-01 the doctrine
demanded both gates on a two-character README typo, two paragraphs above the rule saying not to
spend a worker on it. Gates scale with what can break, never with who wrote it: `checker` on any
diff that can change behavior including your own, `qa` wherever there is behavior to observe, and
`qa: n/a` **with its reason, recorded** where there is not.
<!-- END delegation-threshold -->
