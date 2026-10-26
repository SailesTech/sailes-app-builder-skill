# REVIEW.md Template — what the review gate reports, and how severe

Generate this at the **repo root as `REVIEW.md`** when bootstrapping a new project (Case B), and
*propose* it — never auto-write — to an existing repo in Upgrade mode (`adopt-existing-repo.md`).
It is the review checklist `checker` receives.

- **Where it is read from.** `checker` reads it from the diff's **base commit**
  (`git show <base>:REVIEW.md`), never from the working tree: a diff must not be able to loosen the
  rules it is judged by. A diff that edits `REVIEW.md` gets its own remark in the verdict.
  No file on the base → the verdict says so in one sentence and the gate still runs.
- **Format.** The section layout and wording follow Anthropic's Code Review `REVIEW.md`, so a
  repo that later gets a Team/Enterprise plan can switch to the managed service without rewriting
  the file. Today only `checker` reads it.
- **Split rule.** Code conventions live in `AGENTS.md`. What to report and how severe lives in
  `REVIEW.md`. A rule the toolchain enforces (lint, types, convention test) belongs in neither as
  prose — see the ratchet, `agentic-first-principles.md` §B.3.
- **Keep it short.** Model: Anthropic's own SDK `REVIEW.md` — two sections, every bullet a concrete
  class of defect, no generic advice ("write clean code", "add tests"). A bullet that would be
  true of every repo is deleted.

**Filling it in.** The block below is the default. At bootstrap, adjust it to the locked stack and
extend the checks section from the active modules in `modules-catalog.md`:

| Active module / axis | Bullet to add to the checks section |
|---|---|
| Multi-tenant (`organization_id` in the manifest) | Every query and mutation is scoped to the caller's tenant; a missing scope is Important |
| Integrations / webhooks | Every mocked external boundary has a paired probe against the real one; the webhook handler only verifies, validates, persists and returns |
| UI app (`ui-spec.md` / `design-system/`) | Components use design tokens only — no raw color, spacing or font literals |
| Auth / RBAC | Every new route or action has an explicit permission check and a test for the denied path |
| Files | Download URLs are signed and access-checked before the URL is issued |

Delete rows that don't apply; add repo-specific classes of defect as the repo produces them (a
finding `checker` keeps making that no rule backs belongs here).

```markdown
# Review instructions

## What Important means here

Reserve Important for findings that would break behavior the spec promises, leak data, or block a
rollback: incorrect logic, a removed guard or permission check, a caller broken by a changed
signature or return shape, unscoped database queries, PII in logs or error messages, migrations
that are not backward compatible, and a change to a frozen contract without a spec. Style, naming
and refactoring suggestions are Nit at most. A defect that was already in the code before this diff
is Pre-existing, never Important.

## Cap the nits

Report at most five Nits per review.

## Do not report

- Anything the toolchain already enforces: lint, formatting, type errors, no-`any`, design tokens,
  import direction
- Generated files, lockfiles, and `graphify-out/`
- Test-only code that intentionally violates production rules

## Always check

- Database queries are scoped to the caller's tenant (delete if the project is single-tenant)
- Log lines and error messages do not include email addresses, user IDs, or request bodies
- Every behavior change has a test that fails before it and passes after
- <add one bullet per active module: see the fill-in table in the header>

## Evidence

A claim about behavior needs a `file:line` citation in the source, not an inference from a name.
Quote the rule you are applying when the finding rests on this file or on `AGENTS.md`.

## Summary

Start with the number of findings by severity. Say plainly "nothing to fix" when there is nothing.
```
