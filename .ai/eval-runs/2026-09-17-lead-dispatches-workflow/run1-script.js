export const meta = {
  name: 'invoices-csv-export-wave1',
  description: 'Spec 2026-09-17 eksport faktur CSV+email — Fala 1 (F1 generator CSV, F2 szablon e-mail), be-dev, parallel, Lane: middle',
  phases: [
    { title: 'Wave 1 — F1 + F2 (parallel)' },
    { title: 'Report' },
  ],
}

// IMPL result schema — be-dev (skills/sailes-bootstrap/workflow-orchestration.md, D3)
const IMPL_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    commit: { type: 'string', description: 'full SHA, empty unless status=done' },
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
  required: ['status', 'commit', 'touched', 'done_when'],
}

async function safe(fn, label) {
  try {
    const result = await fn()
    if (!result) {
      log(`[${label}] empty result — treat as blocked, do not read as "no issues"`)
      return null
    }
    return result
  } catch (err) {
    log(`[${label}] threw: ${err.message}`)
    return null
  }
}

// args.leadBaseSha = full SHA of feat/2026-09-17-invoices-csv-export HEAD at dispatch time
// (git rev-parse HEAD, run by the lead before calling Workflow — never Date.now()/git inside the script).
const LEAD_BASE_SHA = args && args.leadBaseSha
if (!LEAD_BASE_SHA) {
  log('ABORT: args.leadBaseSha is required (full SHA of the feature branch HEAD) and was not provided.')
  return { blocked: 'missing args.leadBaseSha' }
}

const SPEC = '.ai/specs/2026-09-17-eksport-faktur-csv.md'

const BRIEF_PREAMBLE = `
Preamble — verbatim, do this before touching any file:
1. Sync to base: run "git merge --ff-only ${LEAD_BASE_SHA}", then "git log --oneline -3" and paste it in your note — confirm that commit is present before editing. Never "git reset --hard"; use ff-only for the sync.
2. Turn budget: at ~70% of your maxTurns, commit "WIP:" and immediately return StructuredOutput with status "blocked" — do not keep working past that point.
3. Context economy: read only the files this brief names plus the cited spec section. Grep with line ranges. Never read a whole large file you are not editing. Never run the full test suite — only the named Done-when command.
4. Lane: middle, tier C — "tester" derives a DERIVED test plan later against the whole spec with your implementation unread and no human freeze; that suite is the gate, not your own inner-loop RED test.
`

const F1_BRIEF = `${BRIEF_PREAMBLE}
You are be-dev. Spec: ${SPEC}, Faza F1 — generator CSV faktur.

Goal (F1.1): implement exportMonth(orgId, yyyymm) returning a CSV string — header row, one line per invoice, kwoty w groszach (integer cents, never floats).

Own only these files (create them, touch nothing else):
- apps/api/src/invoices/csv-export.service.ts
- apps/api/src/invoices/csv-export.service.spec.ts

Do not implement F2 or F3 — separate phases, separate agents.

Done-when (run exactly this, paste the full output, record the exit code):
pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts

Report via the IMPL schema: status; commit (full SHA of your last commit, empty only if blocked); touched (repo-relative paths); done_when ([{command, exit, output_tail}]); note (deviations/blockers in a few lines, plus "Promotion candidate: <test> — <defect>" if an inner-loop test caught a real defect).
`

const F2_BRIEF = `${BRIEF_PREAMBLE}
You are be-dev. Spec: ${SPEC}, Faza F2 — szablon e-maila „eksport gotowy”.

Goal (F2.1): email template with a download link and the month name.

Own only these files (create them, touch nothing else):
- apps/worker/src/mail/templates/export-ready.tsx
- apps/worker/src/mail/templates/export-ready.spec.tsx

Do not implement F1 or F3 — separate phases, separate agents.

Done-when (run exactly this, paste the full output, record the exit code):
pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx

Report via the IMPL schema, same fields as above.
`

phase('Wave 1 — F1 + F2 (parallel)')

const [f1, f2] = await parallel([
  () => safe(() => agent(F1_BRIEF, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    phase: 'Wave 1 — F1 + F2 (parallel)',
    label: 'be-dev:F1',
  }), 'be-dev:F1'),
  () => safe(() => agent(F2_BRIEF, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    phase: 'Wave 1 — F1 + F2 (parallel)',
    label: 'be-dev:F2',
  }), 'be-dev:F2'),
])

phase('Report')
log(`F1: ${f1 ? f1.status : 'NULL/THREW — treat as blocked'}${f1 && f1.commit ? ' · commit ' + f1.commit : ''}`)
log(`F2: ${f2 ? f2.status : 'NULL/THREW — treat as blocked'}${f2 && f2.commit ? ' · commit ' + f2.commit : ''}`)
log('No tester/checker here on purpose: F3 (Fala 2) is still open pending the human storage decision, and gates run once, on the whole diff, not per wave (D8).')
log('Lead next: verify each done_when actually ran green, then git merge --no-ff each branch into the feature branch in the main checkout (a worktree agent cannot reach it) — before dispatching Wave 2 (F3).')

return { f1, f2 }
