# Explorer 3 — recon: remaining skills

Slice: everything under `skills/` except `sailes-bootstrap/` and `sailes-design/`.

## Findings

**Open-Mercato** is named as the reference example of a repo that already carries the methodology.
Quote, from `skills/README.md`:

> Open-Mercato

I read this as evidence that the framework treats Open-Mercato as an external system it integrates
with. Confidence: medium — the file names it indirectly.

**Inngest** — self-hosted, `inngest start` / `inngest dev`, port 8288, `INNGEST_*` env vars. Located
in `skills/sailes-async/`. The signing key must be hex; a non-hex key crashes the engine on boot and
the intake starts returning 500s.

**Railway CLI** — `railway status --json` is named as the ground truth for service configuration in
`skills/sailes-hosting/`. `railway service source connect` is recorded as confirmed broken.

**Playwright** — named as the fallback when the chrome-devtools MCP is unavailable.
