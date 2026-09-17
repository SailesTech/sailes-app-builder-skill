export const meta = {
  name: 'invoice-csv-export-wave1',
  description: 'Spec 2026-09-17-invoice-csv-export — Wave 1: F1 (CSV generator) + F2 (email template), parallel, disjoint files',
  phases: [
    { title: 'Wave 1 — F1 + F2' },
  ],
}

// Expected args (set by the lead before calling Workflow, computed in Bash in the target repo):
//   args.leadSha    — full SHA of the integration branch tip each worktree must fast-forward to
//   args.bootResult — raw stdout/exit of the repo's documented one-command boot, run ONCE by the
//                     lead before this call (per workflow-orchestration.md "Boot e2e once, before WF2")
//   args.specPath   — repo-relative path to the frozen spec file

const SPEC_PATH = args.specPath
const LEAD_SHA = args.leadSha
const BOOT_RESULT = args.bootResult || 'not captured — ask the lead before assuming the stack boots clean'

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

function preamble() {
  return [
    'Before anything else:',
    `1. Sync to base: run \`git merge --ff-only ${LEAD_SHA}\` in your worktree, then \`git log --oneline -1\` to confirm it landed — your worktree base is \`main\`, not this run's branch, until you do this.`,
    '2. Never `git reset --hard`. Use `git merge --ff-only` for the sync above — `--hard` is blocked non-deterministically here and has cost real runs before.',
    "3. At ~70% of your maxTurns budget, commit `WIP:` and immediately return status=\"blocked\" via StructuredOutput rather than run out silently.",
    '4. Read only the spec section named below plus the files you own. Grep with line ranges; never read a whole large file you are not editing; never run the full test suite — only the exact Done-when command for this phase.',
    `5. Known environment state from the one-time boot check: ${BOOT_RESULT}`,
  ].join('\n')
}

phase('Wave 1 — F1 + F2')

const f1Brief = [
  preamble(),
  '',
  `You are implementing Phase F1 of ${SPEC_PATH} ("eksport faktur do CSV i powiadomienie e-mail").`,
  'Read ONLY the spec section "F1 — generator CSV faktur". Do not read F2 or F3.',
  '',
  'Goal: `exportMonth(orgId, yyyymm)` returns CSV — header row, one line per invoice, amounts in grosze (cents).',
  '',
  'Files you own — create/edit ONLY these:',
  '  - apps/api/src/invoices/csv-export.service.ts',
  '  - apps/api/src/invoices/csv-export.service.spec.ts',
  '',
  'Constraints:',
  '  - Nothing outside those two files. F2 is running in parallel against apps/worker/** — disjoint from you, do not touch it.',
  '  - Lane: middle, tier C. No design artifact needed; this phase has no UI.',
  '  - This is new-file-only work (Blast-radius: n/a per the spec) — no existing behavior to preserve.',
  '',
  'Done-when (run this exact command, paste the full output in your report):',
  '  pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts',
  'Expected: 0 failures.',
  '',
  'Report via StructuredOutput per the given schema: status, the full commit SHA (empty only if blocked),',
  'every touched path, the Done-when command with its exit code and output tail, and a short note —',
  'deviations, substitute decisions, blockers, and a `Promotion candidate:` line if any inner-loop check',
  'caught a real defect (name + what it caught).',
].join('\n')

const f2Brief = [
  preamble(),
  '',
  `You are implementing Phase F2 of ${SPEC_PATH} ("eksport faktur do CSV i powiadomienie e-mail").`,
  'Read ONLY the spec section "F2 — szablon e-maila „eksport gotowy"". Do not read F1 or F3.',
  '',
  'Goal: an email template with a download link and the export month name.',
  '',
  'Files you own — create/edit ONLY these:',
  '  - apps/worker/src/mail/templates/export-ready.tsx',
  '  - apps/worker/src/mail/templates/export-ready.spec.tsx',
  '',
  'Constraints:',
  '  - Nothing outside those two files. F1 is running in parallel against apps/api/** — disjoint from you, do not touch it.',
  '  - Lane: middle, tier C. No design artifact needed for a transactional email template.',
  '  - This is new-file-only work (Blast-radius: n/a per the spec) — no existing behavior to preserve.',
  '',
  'Done-when (run this exact command, paste the full output in your report):',
  '  pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx',
  'Expected: 0 failures.',
  '',
  'Report via StructuredOutput per the given schema: status, the full commit SHA (empty only if blocked),',
  'every touched path, the Done-when command with its exit code and output tail, and a short note —',
  'deviations, substitute decisions, blockers, and a `Promotion candidate:` line if any inner-loop check',
  'caught a real defect (name + what it caught).',
].join('\n')

log('Dispatching Wave 1: F1 (csv-export.service) + F2 (export-ready template) — disjoint files, parallel, both middle-lane tier C.')

const [f1, f2] = await parallel([
  () => safe(() => agent(f1Brief, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    phase: 'Wave 1 — F1 + F2',
    label: 'be-dev:F1',
  }), 'be-dev:F1'),
  () => safe(() => agent(f2Brief, {
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    phase: 'Wave 1 — F1 + F2',
    label: 'be-dev:F2',
  }), 'be-dev:F2'),
])

log(`F1: ${f1 ? f1.status : 'null/blocked'}${f1 && f1.commit ? ' — commit ' + f1.commit : ''}`)
log(`F2: ${f2 ? f2.status : 'null/blocked'}${f2 && f2.commit ? ' — commit ' + f2.commit : ''}`)

// No tester/checker in this run on purpose: F3 (wave 2) is blocked on a human decision the spec
// leaves open (bytea vs S3), and gate-placement evidence favors ONE tester+checker pass over the
// WHOLE diff at the end, not one per wave (.ai/eval-runs/2026-09-16-gate-placement/VERDICT-round1.md).
// That pass runs in the wave-2 script, after F3 lands, over F1+F2+F3 together.
return { f1, f2 }
