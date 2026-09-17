export const meta = {
  name: 'invoices-csv-export-wave1',
  description: 'Wave 1 of eksport faktur do CSV i powiadomienie e-mail: recon, then F1 (CSV generator) + F2 (email template) in parallel, then one tester+checker pass covering both.',
  phases: [
    { title: 'Recon' },
    { title: 'Implement F1' },
    { title: 'Implement F2' },
    { title: 'Test' },
    { title: 'Review' },
  ],
}

const RECON_SCHEMA = {
  type: 'object',
  properties: {
    mail_template_conventions: { type: 'string' },
    money_formatting_utils: { type: 'string' },
    controller_job_conventions: { type: 'string' },
    existing_s3_client: { type: 'string' },
    existing_bytea_blob_usage: { type: 'string' },
  },
  required: [
    'mail_template_conventions',
    'money_formatting_utils',
    'controller_job_conventions',
    'existing_s3_client',
    'existing_bytea_blob_usage',
  ],
}

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
        required: ['command', 'exit', 'output_tail'],
      },
    },
    note: { type: 'string' },
  },
  required: ['status', 'commit', 'touched', 'done_when', 'note'],
}

const TEST_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    commit: { type: 'string' },
    plan: { type: 'array', items: { type: 'string' } },
    detection_proof: { type: 'array', items: { type: 'string' } },
    defects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string' },
        },
        required: ['id', 'description', 'severity'],
      },
    },
  },
  required: ['status', 'commit', 'plan', 'detection_proof', 'defects'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVE', 'NITS', 'CHANGES-REQUIRED'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
        },
        required: ['id', 'description', 'location'],
      },
    },
    commands_run: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'findings', 'commands_run'],
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

const { leadSha, bootResult } = args

const BRIEF_PREAMBLE = `
Before any edit:
1. Sync to base: run "git merge --ff-only ${leadSha}", then "git log --oneline -1" to confirm. If that merge is not a fast-forward, STOP and report status:"blocked" with what you saw — never "git reset --hard" to force it.
2. Environment: the lead already booted the stack once, result below. Do not repeat the boot. If it shows a failure and it affects your files, return status:"blocked" naming the ENV-DEFECT instead of guessing around it.
${bootResult}
3. Turn budget: at ~70% of your role's maxTurns, commit with a "WIP:" message and immediately return status:"blocked" via StructuredOutput.
4. Context economy: read only the spec section and files named below for your phase. Grep with line ranges. Never read a whole large file you are not editing. Never run the full test suite — only the exact Done-when command named below.
`

phase('Recon')
const recon = await safe(
  () =>
    agent(
      `Read-only recon for a new spec ("eksport faktur do CSV i powiadomienie e-mail"). Do not propose code, do not review anything.
Report, file:line where you find it:
1. mail_template_conventions — how existing email templates in this repo are structured/exported (props, framework), so a new "export-ready" template matches the sibling pattern.
2. money_formatting_utils — any existing helper for formatting/storing monetary amounts in cents/grosze, so the new CSV generator reuses it instead of reinventing it.
3. controller_job_conventions — how existing HTTP controllers that enqueue a background job, and the worker jobs that consume them, are structured in this repo (naming, queue client, response shape for a 202).
4. existing_s3_client — is there already an S3 (or S3-compatible) client configured and used anywhere in this repo for storing generated files? Name it and where, or say clearly there is none.
5. existing_bytea_blob_usage — is there already a Postgres column storing binary/blob data (bytea) anywhere in this repo? Name it and where, or say clearly there is none.
If something is genuinely absent, say so plainly rather than guessing — this recon grounds a human decision about file storage for a later phase.`,
      { agentType: 'sailes-app-builder:explorer', schema: RECON_SCHEMA, phase: 'Recon' }
    ),
  'explorer:recon'
)

const reconText = recon
  ? `Recon findings — mail templates: ${recon.mail_template_conventions}
Money formatting: ${recon.money_formatting_utils}
Controller/job conventions: ${recon.controller_job_conventions}`
  : 'Recon did not return — no repo-convention findings available, use the most conventional approach and note the assumption in your report.'

phase('Implement F1')
const f1Prompt = `${BRIEF_PREAMBLE}
${reconText}

Spec — Faza F1 (generator CSV faktur) only:
exportMonth(orgId, yyyymm) zwraca CSV (nagłówek, jedna linia na fakturę, kwoty w groszach).
Files you own — do not touch anything outside this list:
  - apps/api/src/invoices/csv-export.service.ts
  - apps/api/src/invoices/csv-export.service.spec.ts
Contract: this is a new file, but Faza F3 (a later phase) will import exportMonth from it. Keep the signature (orgId: string, yyyymm: string) => Promise<string> unless you hit a concrete reason it cannot work — if so, return status:"blocked" with why rather than silently choosing a different shape.
Done-when: run "pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts" and confirm 0 failures. Paste its tail in done_when.
Report via StructuredOutput only.`

const f2Prompt = `${BRIEF_PREAMBLE}
${reconText}

Spec — Faza F2 (szablon e-maila "eksport gotowy") only:
Szablon z linkiem do pobrania i nazwą miesiąca.
Files you own — do not touch anything outside this list:
  - apps/worker/src/mail/templates/export-ready.tsx
  - apps/worker/src/mail/templates/export-ready.spec.tsx
Contract: this is a new file, but Faza F3 (a later phase) will import it from the export job. Follow the sibling mail-template convention recon reported above; if none was found, pick the most conventional shape for a template with a download-link prop and a month-name prop, and note that choice in your report's "note" field so it can be locked before F3 depends on it.
Done-when: run "pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx" and confirm 0 failures. Paste its tail in done_when.
Report via StructuredOutput only.`

const [f1, f2] = await parallel([
  () =>
    safe(
      () =>
        agent(f1Prompt, {
          agentType: 'sailes-app-builder:be-dev',
          schema: IMPL_SCHEMA,
          isolation: 'worktree',
          phase: 'Implement F1',
        }),
      'be-dev:F1'
    ),
  () =>
    safe(
      () =>
        agent(f2Prompt, {
          agentType: 'sailes-app-builder:be-dev',
          schema: IMPL_SCHEMA,
          isolation: 'worktree',
          phase: 'Implement F2',
        }),
      'be-dev:F2'
    ),
])

if (!f1 || f1.status !== 'done') log('F1 did not complete cleanly — inspect its worktree/branch before any retry, do not re-run the same brief blind.')
if (!f2 || f2.status !== 'done') log('F2 did not complete cleanly — inspect its worktree/branch before any retry, do not re-run the same brief blind.')

phase('Test')
const testerPrompt = `Middle lane, tier C for both F1 and F2 (per the spec's Lane lines) — write the DERIVED plan and the suite in this same pass, no human-freeze STOP.

Derive expected behavior from this spec text, then write the suite (ADD-only from the diff — never delete or weaken an existing scaffolding test to reach green):

### F1 — generator CSV faktur
exportMonth(orgId, yyyymm) zwraca CSV (nagłówek, jedna linia na fakturę, kwoty w groszach).
Done-when: pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts → 0 failures.

### F2 — szablon e-maila "eksport gotowy"
Szablon z linkiem do pobrania i nazwą miesiąca.
Done-when: pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx → 0 failures.

F1 commit: ${f1 ? f1.commit : '(F1 did not complete — treat as blocked, do not invent a commit)'}
F2 commit: ${f2 ? f2.commit : '(F2 did not complete — treat as blocked, do not invent a commit)'}

Give a tiered detection proof per case (how each case is proven to fail without the fix). Report any real defect you find as a "defects" entry rather than silently fixing it.
Report via StructuredOutput only.`

const tester = await safe(
  () =>
    agent(testerPrompt, {
      agentType: 'sailes-app-builder:tester',
      schema: TEST_SCHEMA,
      isolation: 'worktree',
      phase: 'Test',
    }),
  'tester:wave1'
)

phase('Review')
const checkerPrompt = `You receive ONLY this diff description, the spec excerpt, and the standard review checklist (correctness, contracts, security, scope creep) — no worker report, no self-assessment.

Spec excerpt — Faza F1 and F2 (text above in this run's Test-phase prompt).
Commits to review: F1=${f1 ? f1.commit : '(none — F1 blocked)'}, F2=${f2 ? f2.commit : '(none — F2 blocked)'}, tests=${tester ? tester.commit : '(none — tester blocked)'}.

Confirm every frozen behavior ID from the tester's plan has a covering test. Additionally run "git grep -l" for the changed symbols (exportMonth, the export-ready template) across the whole repo's tests/, not just the two spec files touched this wave, and execute whatever that turns up — this wave's phases are new files, but something elsewhere may already reference them.
Report via StructuredOutput only.`

const checker = await safe(
  () =>
    agent(checkerPrompt, {
      agentType: 'sailes-app-builder:checker',
      schema: REVIEW_SCHEMA,
      phase: 'Review',
    }),
  'checker:wave1'
)

log(
  `Wave 1 done. f1=${f1 ? f1.status : 'null'} f2=${f2 ? f2.status : 'null'} tester=${tester ? tester.status : 'null'} checker=${checker ? checker.verdict : 'null'}`
)

return { recon, f1, f2, tester, checker }
