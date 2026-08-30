# Spec: partner profile form validation

Status: approved

`validateProfile(input)` returns `{ ok: true, value }` or `{ ok: false, errors }` where `errors`
maps a field name to one error code. All failing fields are reported together, not just the first.

## Fields

| Field | Required | Rules | Error codes |
|---|---|---|---|
| `companyName` | yes | trimmed; **3–80 characters inclusive** | `required`, `too_short`, `too_long` |
| `email` | yes | trimmed + lowercased; must look like an email | `required`, `invalid` |
| `nip` | yes | spaces and hyphens stripped; then **exactly 10 digits** | `required`, `invalid` |
| `seats` | yes | an integer, **1–500 inclusive** | `required`, `invalid`, `too_low`, `too_high` |
| `website` | no | when present and non-empty: `https://` URL | `invalid` |

## Behaviour

1. A non-object input is treated as an empty submission: every required field reports `required`.
2. `value` carries the **normalised** forms — trimmed name, trimmed+lowercased email, stripped nip.
   `website` is `null` when omitted.
3. An empty string counts as absent for required fields (`required`, never `invalid`).
4. `website` is skipped entirely when absent, empty or null — never `required`.
5. Error codes are checked in the order given in the table: a field reports exactly one code.

Done-when: `node --test` passes against the implementation as written.
