# Business logic — fixture (valid)

## 0. Mission and index

Exists so the next session does not have to re-derive the domain. Detail lives in the specs.

| where | covers |
|---|---|
| `.ai/incidents/` | what went wrong and why |

## 3. Rules

- **[R-COMM-01]** A carrier MAY hold several portal accounts; `supplier_id` is not a company key.
  · source: owner 2026-08-04 · enforced: NONE
  · cost: incident 2026-07-29-winner-commission-resolved-from-wrong-account

- **[R-COMM-03]** A null commission means 0%. A deliberate decision, not an oversight.
  · source: owner 2026-08-04 · enforced: CommissionResolverService.toPercent

- **[R-PRIO-01]** Commission priority lasts 4h counted in WORKING HOURS only.
  · źródło: system-flows.md §5 · egzekwowane: tools/business-logic-check.js:1

- **[R-SCOPE-01]** HOURLY orders practically never occur — we do not optimise for them.
  · source: owner 2026-07-27, quoted "taki typ zlecenia praktycznie nigdy nie wystąpi"
  · enforced: N/A
