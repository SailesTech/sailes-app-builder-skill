export const meta = {
  name: 'invoice-export-wave1',
  description: 'Invoice CSV export spec, Wave 1: F1 (CSV generator) + F2 (email template) — disjoint files, parallel, middle lane tier C',
  phases: [
    { title: 'Wave 1', detail: 'F1 csv-export.service.ts + F2 export-ready.tsx, parallel, worktree-isolated' },
  ],
}

// Base = the lead's HEAD at dispatch time (this session's ff-only merge target).
// Every phase brief syncs to this SHA before doing anything else (workflow-orchestration.md,
// "Brief preamble" table, row "Sync to base").
const BASE_SHA = '9227eab7a6f95185f6d4928e95ec68ff5ef7defb'

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
  required: ['status', 'commit', 'touched', 'done_when'],
}

const PREAMBLE = [
  'Before anything else, in your worktree:',
  '1. Sync to base: `git merge --ff-only ' + BASE_SHA + '`, then `git log --oneline -1` to confirm that SHA is present. Never `git reset --hard` for this or any other reason.',
  '2. Claim `.claude/status/<your-worker-id>.md` as your first action: worker/task/base/claimed/opened. Close it as your last action: closed/outcome/commit/touched. Append only — never rewrite the claim block once written. `<your-worker-id>` is the harness agent id, never a name you invent.',
  '3. At ~70% of your turn budget, commit `WIP:` with whatever is staged and immediately return status="blocked" via StructuredOutput. Do not keep working past that point hoping to finish.',
  '4. Context economy: read only the files this brief names. Grep with line ranges instead of reading whole files you are not editing. Run only the one Done-when command below — never the full test suite, never `pnpm test` at large.',
  '5. This is a middle-lane, tier-C/B phase (see the Lane line below): no design step, no screenshots, no human freeze on the test plan. Implement, verify your own Done-when, commit, report.',
  '6. Report exactly the IMPL schema fields: status, commit (full 40-char SHA, empty unless status=done), touched (repo-relative paths), done_when (each entry: command, exit, output_tail — the command you actually ran and its real output tail), note (deviations/substitute decisions/blockers, at most a few lines). If you deviated from this brief, say so in note — do not silently narrow or widen scope.',
].join('\n')

async function safe(fn, label) {
  try {
    const result = await fn()
    if (!result) {
      log('[' + label + '] empty result — treat as blocked, do not read as "no issues"')
      return null
    }
    return result
  } catch (err) {
    log('[' + label + '] threw: ' + err.message)
    return null
  }
}

phase('Wave 1')

const F1_BRIEF = [
  PREAMBLE,
  '',
  'Spec: .ai/eval-runs/2026-09-17-lead-dispatches-workflow/fixture-spec.md, Phase F1 — "generator CSV faktur".',
  'Lane: middle — tier C (odczyt i formatowanie).',
  '',
  'Goal (F1.1): implement `exportMonth(orgId, yyyymm)` that returns a CSV — header row, one line per invoice, amounts in grosze (integer cents), for the given org and month.',
  '',
  'Files you own — create both, touch nothing else:',
  '- apps/api/src/invoices/csv-export.service.ts',
  '- apps/api/src/invoices/csv-export.service.spec.ts',
  '',
  'Constraints:',
  '- Match this repo\'s existing conventions for services under apps/api/src/invoices (DI pattern, error handling, module wiring) if sibling files already establish one. If the invoices module does not exist yet, add only the minimal scaffolding this file needs to be importable and testable — nothing beyond that.',
  '- No `any`. Validate/parse inputs (orgId, yyyymm) at the boundary.',
  '- Pure data formatting only — no outbound network calls of any kind in this phase (no prod integrations, no external I/O).',
  '- This is one task with one Done-when. Do not touch F2\'s or F3\'s files (F3 depends on this function\'s actual exported signature, so do not rename/reshape it without saying so loudly in `note`).',
  '',
  'Done-when — run this exact command, paste the real output tail into done_when:',
  '`pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts` → 0 failures.',
].join('\n')

const F2_BRIEF = [
  PREAMBLE,
  '',
  'Spec: .ai/eval-runs/2026-09-17-lead-dispatches-workflow/fixture-spec.md, Phase F2 — "szablon e-maila eksport gotowy".',
  'Lane: middle — tier C (UI e-maila).',
  '',
  'Goal (F2.1): an email template with a download link and the export month\'s name/label.',
  '',
  'Files you own — create both, touch nothing else:',
  '- apps/worker/src/mail/templates/export-ready.tsx',
  '- apps/worker/src/mail/templates/export-ready.spec.tsx',
  '',
  'Constraints:',
  '- Match this repo\'s existing conventions for templates under apps/worker/src/mail/templates (rendering approach, test approach) if sibling templates already establish one. If none exist yet, use the lightest approach consistent with apps/worker\'s existing mail-sending code — do not introduce a new templating dependency without checking what is already installed.',
  '- Props: at minimum a download URL and the month label. Do not invent additional formatting/localization no one asked for.',
  '- No outbound network calls — this phase renders a template, it does not send mail.',
  '- This is one task with one Done-when. Do not touch F1\'s or F3\'s files.',
  '',
  'Done-when — run this exact command, paste the real output tail into done_when:',
  '`pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx` → 0 failures.',
].join('\n')

const [f1, f2] = await parallel([
  () => safe(() => agent(F1_BRIEF, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    label: 'be-dev:F1',
  }), 'be-dev:F1'),
  () => safe(() => agent(F2_BRIEF, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    label: 'be-dev:F2',
  }), 'be-dev:F2'),
])

log('F1: ' + (f1 ? f1.status + ' — ' + f1.commit : 'NULL/BLOCKED — no completion'))
log('F2: ' + (f2 ? f2.status + ' — ' + f2.commit : 'NULL/BLOCKED — no completion'))

return {
  wave: 1,
  base: BASE_SHA,
  F1: f1,
  F2: f2,
  note: 'No tester/checker here on purpose (D8: gates run once, after the LAST phase of the spec). F3 carries a Human-STOP (CSV storage: Postgres bytea vs S3 bucket + 7-day signed URL) that the lead resolves with the human before dispatching wave 2; that STOP does not move the gate to the end of wave 1.',
}