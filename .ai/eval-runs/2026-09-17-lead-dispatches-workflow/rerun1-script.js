export const meta = {
  name: 'invoice-export-wave1',
  description: 'F1 (CSV generator) + F2 (email template) dispatched in parallel — disjoint files, no Human-STOP. F3 held for the storage decision; no gates run here (D8: tester/checker run once, after the last phase of the spec).',
  phases: [
    { title: 'Wave 1', detail: 'be-dev x2, parallel, worktree-isolated' },
  ],
}

// args expected: { baseSha: '<full sha of the commit both worktrees sync to>',
//                   specPath: '<repo-relative path to the approved spec>' }
const BASE_SHA = args.baseSha
const SPEC_PATH = args.specPath

const briefPreamble = `
Sync to base: git merge --ff-only ${BASE_SHA} in your worktree, then git log --oneline -3 to confirm
both the named sha and a file that only exists after it. Never git reset --hard.
Turn budget: at ~70% of your maxTurns, commit WIP: with whatever is done and return
status:"blocked" via StructuredOutput immediately — do not keep working past that point.
Context economy: read only the named spec section and the files you own. grep with line ranges.
Never read a whole large file you are not editing. Never run the full test suite or e2e — only
your own Done-when command, on the file(s) you touched.
Lane: middle (tier C). Write your own scaffolding tests as you go (inner loop, disposable) — the
graded suite is authored later by tester from the spec with your implementation unread, so do not
treat your own tests as the gate and do not try to make them look like the frozen suite.
Report ONLY via the given StructuredOutput schema — no prose report file, this is an implementer role.
If you hit anything the spec does not settle, stop and return status:"blocked" with why — never guess.
`

const IMPL_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    commit: { type: 'string' },
    touched: { type: 'array', items: { type: 'string' } },
    done_when: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          exit: { type: 'number' },
          output_tail: { type: 'string' },
        },
        required: ['command', 'exit'],
      },
    },
    note: { type: 'string' },
  },
  required: ['status', 'touched'],
}

const f1Brief = `${briefPreamble}
Phase F1 — generator CSV faktur. Spec: ${SPEC_PATH}, section "F1 — generator CSV faktur".
Owns (touch ONLY these two files):
  - apps/api/src/invoices/csv-export.service.ts
  - apps/api/src/invoices/csv-export.service.spec.ts
Implement F1.1: exportMonth(orgId, yyyymm) returns a CSV string — header row, one line per
invoice, amounts in grosze (integer cents), for the given org and YYYY-MM.
Done-when (run this exact command, paste the tail):
  pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts
Expected: 0 failures.
`

const f2Brief = `${briefPreamble}
Phase F2 — szablon e-maila "eksport gotowy". Spec: ${SPEC_PATH}, section "F2 — szablon e-maila".
Owns (touch ONLY these two files):
  - apps/worker/src/mail/templates/export-ready.tsx
  - apps/worker/src/mail/templates/export-ready.spec.tsx
Implement F2.1: an email template with a download link and the month name shown to the recipient.
Done-when (run this exact command, paste the tail):
  pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx
Expected: 0 failures.
`

log('Wave 1: F1 (csv-export.service) and F2 (export-ready template) — disjoint file sets per the spec\'s own Plan wykonania, dispatched in parallel. F3 stays out of this script: it depends on F1+F2 and its Human-STOP (bytea vs S3 storage) is unresolved.')

const [f1, f2] = await parallel([
  () => agent(f1Brief, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    phase: 'Wave 1',
    label: 'be-dev:F1',
  }),
  () => agent(f2Brief, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    phase: 'Wave 1',
    label: 'be-dev:F2',
  }),
])

return {
  f1,
  f2,
  next: 'F3 held on Human-STOP (CSV storage: bytea vs S3+signed URL). No tester/checker in this ' +
        'script — D8: gates run exactly once, after the last phase of the whole spec, in the ' +
        'workflow that finishes it (F3\'s workflow), never at the end of this earlier wave.',
}
