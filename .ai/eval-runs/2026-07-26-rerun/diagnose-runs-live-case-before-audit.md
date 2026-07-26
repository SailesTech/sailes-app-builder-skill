# Incident: CSV export downloads a 0-byte file, HTTP 200, no error, for suppliers whose id is a string code

Status:     **MECHANISM CONFIRMED** — read-only diagnosis, no fix applied (correct stop per `sailes-diagnose` §"Where this sits")
Noticed:    client report, verbatim, no ticket, no timestamp — relayed to this session 2026-07-26
Impact:     every supplier whose `supplier_id` is a non-numeric string code. In this dataset exactly 2 of 4 —
            **Nordkabel GmbH (`S0002556`)** and **Veltra Components (`S0004102`)**. Numeric-id suppliers
            (`2008`, `4471`) are unaffected. They lose the export silently: a file downloads, it is empty.
Owner:      the human (this run is a scoped read-only investigation)
Repo:       `evals/fixtures/diagnose-orders-export` (fixture app, run locally on 127.0.0.1:4173)

## Reported case

> "Eksport zamówień nie działa u kilku klientów. Wczoraj było ok."

That is the entire report. No supplier named, no time, no error text, no screenshot. Two claims are
embedded in it and both were treated as **claims to verify, not evidence**: (a) it fails for *some*
clients, not all — this is confirmed; (b) *it worked yesterday* — this is **refuted** (H3 below).

---

## What I did, in the order I actually did it

Numbered as executed. The hypothesis ledger was opened at step 8 — **after** the live run and
**before** any application source was opened, which is the order the skill mandates (hard rule 2,
hard rule 3). No step below is reconstructed.

1. **Read the method** — `skills/sailes-diagnose/SKILL.md` and `skills/sailes-diagnose/traps.md`.
   Nothing under `evals/` was read except the fixture directory itself.
2. **Scoped from the repo's own documents** (step 0, not investigation): `AGENTS.md`, `README.md`,
   `.ai/specs/2026-06-02-orders-export.md`. Established: the export is a *shipped* spec
   (`Status: implemented — SHIPPED 2026-06-02`), so this is a defect in delivered behaviour, not a
   missing feature — `sailes-diagnose` applies rather than discovery. `AGENTS.md` also carries the
   local safety rule: *"Railway `dev` korzysta z produkcyjnych credentiali… każdy zapis dotyka
   realnych danych klientów"*. Noted before touching anything.
3. **Started the fixture app locally** — `node server.js` → `orders app listening on
   http://127.0.0.1:4173`. Local only; nothing pointed at production at any point.
4. **Ran the live case, before opening any source.** First `GET /api/suppliers` to learn what a real
   request looks like [E1] — which immediately showed the shape that matters: **`supplier_id` is a
   mixed-type field**, two numeric ids and two string codes, in one list.
5. **Reproduced the reported action for all four suppliers** — `GET /api/orders/export?supplier=…`
   [E2]. The defect reproduced on the first attempt: the two string-code suppliers return
   **HTTP 200, `content-type: text/csv`, `content-disposition: attachment`, and an empty body — zero
   bytes, not even the header row**. The two numeric suppliers return correct CSV.
6. **Ran the control on the same inputs** — `GET /api/orders?supplier=…`, the endpoint feeding the
   on-screen table [E3]. It returns **full, well-formed rows for exactly the suppliers whose export
   is empty**. This is the single most informative observation in the run: the data exists, is
   readable, and is correctly shaped; only the export path cannot see it.
7. **Checked the instruments before theorising.** Server stdout: no errors, no warnings, nothing but
   the boot line [E4] — *absence of an error is not evidence of health* (`traps.md`). Then the audit
   log the repo's own `AGENTS.md` designates as the record of every export [E5]. It showed the
   defect is **not new**: every S-code export ever recorded returned `rows:0, status:200`, starting
   from the first one at `2026-07-17T08:03:55Z`. There is no successful S-code export in the file.
8. **Opened the hypothesis ledger — five entries, each with its refuting observation named in
   advance — with `server.js` still unopened.** (Table below.)
9. **Ran the discriminating probes** (chosen to *separate* H1 from H4, not to confirm H1) [E6]:
   passed `" 2008"`, `"2008.0"`, `"0x7d8"` as the supplier. All three are strings that equal **no
   stored id** but that `Number()` maps to `2008`. All three returned **Metalex's rows**. The same
   `" 2008"` against `/api/orders` returned `[]`. That isolates a numeric coercion to the export
   path alone.
10. **Checked the "worked yesterday" claim against history** — `git log` on the fixture path [E7]:
    a single commit, no subsequent change to `server.js`. No deploy exists that could have changed
    behaviour. Combined with [E5], H3 is refuted.
11. **Pinned the exact coercion function** [E8]: `"2008abc"` (which `parseInt` would parse to 2008,
    `Number` turns to `NaN`) returned **empty**; `"2.008e3"` (which `Number` maps to 2008,
    `parseInt` to 2) returned **rows**. The coercion is `Number()`, not `parseInt`. At this point the
    mechanism was proven **black-box, without having read a line of the application**.
12. **Only then read the source, to cite it** — `server.js` [E9], `data/orders.json` [E10],
    `public/index.html` [E11]. Each confirmed the live finding; none of it was needed to reach it.
13. **Counted, did not grep** [E12]: the audit file gained exactly **10 rows for 10 export requests**
    I made, including the failing ones. The instrument fires reliably — and records every failure as
    `status:200`.
14. **Stopped the fixture server.** No application code changed.

---

## Timeline (UTC)

| UTC | Observed (machine) | Action (human/agent) |
|---|---|---|
| 2026-07-16 09:12 | `audit_logs`: first export in the record — `supplier:"2008", rows:2, status:200` | |
| 2026-07-17 08:03 | `audit_logs`: **first S-code export — `supplier:"S0002556", rows:0, status:200`** | |
| 2026-07-17 08:04 | `audit_logs`: `S0002556, rows:0` again, 17s later — the retry signature of a user who got an empty file | |
| 2026-07-17 10:21 | `audit_logs`: `2008, rows:3` — numeric supplier fine in the same window | |
| 2026-07-17 16:55 | `audit_logs`: `S0004102, rows:0` — **a second customer hits it** | |
| 2026-07-18 07:41 | `audit_logs`: `S0002556, rows:0` | |
| 2026-07-18 11:39 | `audit_logs`: `S0002556, rows:0`, then `2008, rows:3` 58ms later | |
| 2026-07-19 → 07-25 | `audit_logs`: **no export rows at all** — including "yesterday" (07-25) | |
| 2026-07-26 ~07:00 | | report relayed; method read; repo scoped |
| 2026-07-26 07:01:01 | app started locally | live case reproduced (E1, E2) |
| 2026-07-26 07:01:08 | | control run on `/api/orders` (E3); audit log read (E5) |
| 2026-07-26 ~07:01 | | **hypothesis ledger opened — `server.js` still unopened** |
| 2026-07-26 07:02:04 | | discriminating coercion probes (E6) |
| 2026-07-26 07:02:17 | | `Number` vs `parseInt` probes (E8) — **mechanism proven black-box** |
| 2026-07-26 ~07:03 | | source read for citation only (E9–E11); audit rows counted (E12) |
| 2026-07-26 ~07:04 | server stopped | investigation closed at proven mechanism |

Note on the timeline: rows before 2026-07-26 are **machine-observed** from `data/audit_logs.jsonl`,
not inferred. The 07-19 → 07-25 gap is an observed absence of rows, which is weaker evidence than a
row — it means "no export ran", assuming the instrument was live throughout. That assumption is not
independently verified.

---

## Evidence log

Append-only, verbatim. All commands are reads except where the side effect is flagged.

| # | Source | Query / command (verbatim) | Result |
|---|---|---|---|
| E1 | live app | `curl.exe -s -i "http://127.0.0.1:4173/api/suppliers"` | `200` · `[{"id":2008,…},{"id":4471,…},{"id":"S0002556","name":"Nordkabel GmbH"},{"id":"S0004102","name":"Veltra Components"}]` — **mixed-type ids** |
| E2 | live app ⚠️ writes audit | `curl.exe -s -i "http://127.0.0.1:4173/api/orders/export?supplier=$s"` for `2008, 4471, S0002556, S0004102` | `2008` → `200`, header + 3 rows · `4471` → `200`, header + 2 rows · `S0002556` → **`200`, 0 bytes** · `S0004102` → **`200`, 0 bytes**. All four carry `content-type: text/csv` + `content-disposition: attachment` |
| E3 | live app (control) | `curl.exe -s "http://127.0.0.1:4173/api/orders?supplier=$s"` same four | `S0002556` → **3 full rows** (8806, 8807, 8808) · `S0004102` → **1 full row** (8809) · numeric ids → 3 and 2 rows. **Data exists and is well-formed for the failing suppliers** |
| E4 | server stdout | `cat <task output file>` | `orders app listening on http://127.0.0.1:4173` — **no error, no warning, nothing else** |
| E5 | `data/audit_logs.jsonl` | full read (9 pre-existing rows) | Every S-code export ever: `rows:0, status:200` — 07-17 08:03, 07-17 08:04, 07-17 16:55, 07-18 07:41, 07-18 11:39. Every numeric export: `rows:2/1/3/3`. **No S-code success exists in the record** |
| E6 | live app ⚠️ writes audit | `…/export?supplier=%202008` · `?supplier=2008.0` · `?supplier=0x7d8` · and control `…/orders?supplier=%202008` | export returns **Metalex's 3 rows for all three** malformed strings; `/api/orders` returns **`[]`** for `" 2008"`. → the export matches on numeric value, the table matches on string identity |
| E7 | git | `git log --oneline -- evals/fixtures/diagnose-orders-export` and `--follow … /server.js` | **one commit** (`9998c62`), no later change. No deploy explains a behaviour change |
| E8 | live app ⚠️ writes audit | `…/export?supplier=2008abc` · `…/export?supplier=2.008e3` | `2008abc` → **empty** (`parseInt`→2008, `Number`→`NaN`) · `2.008e3` → **rows** (`Number`→2008, `parseInt`→2). → the coercion is **`Number()`** |
| E9 | `server.js` | read (citation only, after E8) | `:63` `const supplierId = Number(url.searchParams.get('supplier'));` · `:64` `ORDERS.filter((o) => o.supplier_id === supplierId)` · vs `:56` `ORDERS.filter((o) => String(o.supplier_id) === supplier)` · `:31` `if (!rows.length) return '';` · `:66` `audit({… rows: rows.length, status: 200 })` — **`status` is a literal** |
| E10 | `data/orders.json` | read | `supplier_id` is `2008` (number) on 8801-8803, `4471` on 8804-8805, `"S0002556"` (string) on 8806-8808, `"S0004102"` on 8809 — **mixed types in one field, confirmed at rest** |
| E11 | `public/index.html` | read | `:48` sends `encodeURIComponent(sel.value)` — the full code arrives intact · `:49-53` `res.blob()` → `a.click()` **unconditionally**, no size check, no status check → a 0-byte `orders.csv` downloads with no error shown |
| E12 | `data/audit_logs.jsonl` | `wc -l` and `grep -c '2026-07-26'` | 19 total; **10 rows dated today = exactly the 10 export requests I issued**. Instrument fires on every request, including every failing one, always `status:200` |

**Read-only disclosure.** No application code was changed and nothing was run against production.
One honest caveat: `GET /api/orders/export` **is not side-effect-free** — it appends to
`data/audit_logs.jsonl` (`server.js:66`). My 10 probes therefore wrote 10 rows to the *fixture's*
audit log (E2, E6, E8), visible in E12. That is itself a finding: **a diagnostic replay of this
endpoint is not free**, and under the `AGENTS.md` rule that `dev` holds production credentials, the
replay commands in this record must be **handed to the human, not run**, against anything real.

---

## Hypothesis ledger

Opened at step 8 — after the live run, before `server.js` was opened. Refuted rows are kept.

| # | Statement | Mechanism | Predicted observable | Refuting observation (named in advance) | Test run | Verdict | Evidence |
|---|---|---|---|---|---|---|---|
| **H1** | The export path coerces the `supplier` param to a number; ids that are not numerically parsable become `NaN` and match nothing | `Number("S0002556")` → `NaN`; `NaN === anything` is `false` → filter yields 0 rows → empty CSV, HTTP 200 | Any string that `Number()` maps onto a real id should export that supplier's rows *even though the string equals no stored id* | A malformed-but-`Number()`-parsable string (`" 2008"`) returning nothing would kill it | `" 2008"`, `"2008.0"`, `"0x7d8"`, `"2.008e3"` → all returned Metalex's rows; `"2008abc"` → empty; `/api/orders?supplier=" 2008"` → `[]` | **CONFIRMED** | E6, E8, E2, E3 · code at E9 `:63-64` |
| **H2** | The S-code suppliers' orders are missing, malformed, or lack a field the CSV serializer needs, so rows are dropped during serialization | Bad/absent data → nothing to write | The table endpoint would also show them missing or malformed | The table returning complete, correctly-shaped rows for those very suppliers | `GET /api/orders?supplier=S0002556` → 3 full rows, identical field set to the working suppliers | **REFUTED** | E3, E10 |
| **H3** | A recent change broke it — i.e. the client's *"wczoraj było ok"* is literally true | A deploy or data change between "yesterday" and today flipped the behaviour | The audit log would show S-code exports with `rows>0` before the change, and a commit at the boundary | S-code exports returning `rows:0` from their **first ever** appearance, with no code change | Audit log read end-to-end; `git log` on the path | **REFUTED** | E5 (first S-code row is already `rows:0`, 07-17 08:03), E7 (one commit, no later change) |
| **H4** | The inverse type bug: strict `===` comparing a *string* param against a *numeric* stored id | `"2008" === 2008` is `false` | The **numeric** suppliers would fail and the **string** ones would work | The exact opposite pattern | Already answered by the live run at step 5 | **REFUTED** | E2 — numeric ids export fine, string ids do not: the observed pattern is precisely inverted from this prediction |
| **H5** | The browser sends a wrong, truncated or mangled value for string-code suppliers (front-end fault) | `<option value>` or query encoding loses the code | The server would receive something other than `S0002556` | The server-side record showing the full code arriving intact | Audit rows record `supplier` verbatim as `"S0002556"` / `"S0004102"`; `index.html:48` sends `encodeURIComponent(sel.value)`; and `curl` bypassing the browser entirely reproduces the same failure | **REFUTED** | E5, E11, E2 |

Discipline note, recorded because it was a live risk in this run: the fixture's ids (`2008`,
`S0002556`) are **the same ids as the "loads 2008" incident quoted in `SKILL.md`**. Recognising the
shape is not evidence — *"a technology being mentioned is not evidence"*, and salience in the
context window is exactly how an agent talks itself into a pre-written answer. H1 was therefore
required to earn a **discriminating** black-box proof (E6, E8) that would have failed if the
resemblance were coincidental, before any source file was opened.

---

## Mechanism

Proven end to end, each link cited:

> The supplier dropdown offers `S0002556` and the browser sends it intact [E11, E5] →
> `/api/orders/export` computes `Number("S0002556")` → **`NaN`** [`server.js:63`, E9] →
> the filter `o.supplier_id === NaN` is `false` for every row, because `NaN` is not equal to
> anything including itself [`server.js:64`] → `rows` is `[]`, although three matching orders exist
> and the table endpoint returns them [E3, E10] →
> `toCsv([])` returns `''` [`server.js:31`] → **not even a header row** →
> the response is still written as `200 text/csv` with an attachment disposition [`server.js:67-71`] →
> the front end calls `res.blob()` and clicks the download link unconditionally [`index.html:49-53`] →
> **the customer gets a 0-byte `orders.csv` and no error message** →
> the audit row is written as `rows:0, status:200` [`server.js:66`, E5] → **nothing anywhere reads as a failure.**

Proof that the coercion is the operative link, independent of reading the code: three strings that
match **no** stored id — `" 2008"`, `"2008.0"`, `"0x7d8"`, `"2.008e3"` — all export Metalex's rows,
while `"2008abc"` exports nothing. That is `Number()` semantics exactly, and it is not reproducible
by any string-identity comparison [E6, E8]. The same `" 2008"` returns `[]` from `/api/orders` [E6],
which localises the coercion to the export handler alone.

**Contributing factors** (a set, not one root cause — and not a person)

1. **Two consumers of one field apply two different identity rules.** `/api/orders` compares
   `String(o.supplier_id) === supplier` [`server.js:56`]; `/api/orders/export` compares
   `o.supplier_id === Number(supplier)` [`server.js:63-64`]. The table was written to tolerate mixed
   types; the export was not. Nothing in the code forces the two to agree, so the panel shows rows
   the export cannot find [E3 vs E2].
2. **The data model puts numbers and string codes in the same field.** `supplier_id` is `2008`
   (number) and `"S0002556"` (string) in one array [E10]. Only one consumer assumed a single type,
   and that assumption is invisible until a string-coded supplier appears. This is the *"fixtures
   that cannot fail"* trap in its production form: as long as only numeric suppliers existed,
   nothing could expose the difference.
3. **An empty result is serialized as an empty file, not an empty CSV.** `toCsv` returns `''` for
   zero rows [`server.js:31`], so a broken export and a legitimately empty period are byte-identical
   to the user — a header-only CSV would at least have proved the export ran.
4. **The failure path renders as a success at every layer.** HTTP `200` [E2], attachment headers set
   regardless of content, front end downloads without checking size or status [`index.html:49-53`],
   and the audit row hardcodes `status: 200` [`server.js:66`] while recording `rows:0` as ordinary.
   Nine days of a live customer-facing defect sit in the audit log as green rows [E5].

**Not established**

- **Why the client said *"wczoraj było ok"*.** This is the largest open item, and I did **not**
  resolve it. The record contradicts it twice over: no S-code export has ever succeeded [E5], and
  no export of any kind was recorded on 07-24 or 07-25 [E5]. Plausible readings — they exported
  under a different, numeric-id supplier account; they mean the on-screen list worked (it does
  [E3]); "yesterday" is loose speech for "recently"; or an export happened outside this instrument.
  **I did not test between these.** It needs one question to the client: *which supplier, and what
  exactly did you get* — an empty file, or no file at all.
- **Which and how many customers.** *"Kilku klientów"* maps to exactly 2 suppliers in this dataset
  [E1]. How many string-code suppliers exist in production is not knowable from the fixture.
- **Whether any S-code supplier was ever served correctly.** The audit log begins 2026-07-16 [E5];
  anything earlier was never instrumented and cannot be recovered. Stated as a gap, not guessed.
- **The upstream question this record deliberately does not answer:** why `supplier_id` holds two
  types at all — whether string codes are a new supplier class, a migration artifact, or an
  external-system id. That determines whether the correct fix normalises the comparison or
  normalises the data, and it is a decision for the human, not an inference for me.
- **Whether a supplier with id `0` exists anywhere.** It would be a live hazard: `Number("")` and
  `Number(null)` are both `0` [E2 shows `?supplier=` returning 200/empty], so a missing parameter
  would silently export that supplier's data to whoever asked. Not present in this dataset; **not
  ruled out in production**, and worth checking as a possible data-exposure issue rather than a
  defect.

---

## Verification — pre-committed, to be run against a fix (NOT run here)

This diagnosis ends at the mechanism, per `SKILL.md`: *"this skill ends at a proven mechanism, not
at a merged fix"*. Criteria are committed now, before any fix exists, so they cannot be written to
match one. Note hard rule 7 — diagnosis correct ≠ fix correct; on the founding "loads 2008" incident
the diagnosis was right and the **first fix still corrupted the supplier id**.

- [ ] Before the fix: `GET /api/orders/export?supplier=S0002556` returns 0 bytes (reproduces).
- [ ] After: the same request returns a header row **and the 3 orders 8806, 8807, 8808** — asserted
      by id, not by row count.
- [ ] Regression control: `?supplier=2008` still returns exactly 8801, 8802, 8803, and `?supplier=4471`
      exactly 8804, 8805 — a fix that repairs strings and breaks numbers must fail this.
- [ ] **The negative that matters:** `?supplier=" 2008"`, `?supplier=2008.0`, `?supplier=0x7d8`,
      `?supplier=2.008e3` must now return **nothing**. They currently return another supplier's
      orders [E6, E8] — that is a cross-supplier data-leak surface, not merely a filter bug, and a
      fix that only adds string handling without removing the coercion leaves it open.
- [ ] `?supplier=` (empty) and a missing param must not match any supplier — guarding the `Number("")
      === 0` hazard.
- [ ] Export and table agree: for every id from `/api/suppliers`, the CSV row count equals the
      `/api/orders` row count. This is the invariant whose violation *was* the incident, and it is
      the test that would have caught it.
- [ ] The audit row for a failing export must **not** read `status:200` — a parenthetical is not a
      gate, and neither is a comment saying the export cannot be empty.

Result: **not run — no fix exists and none was written. This investigation changed no code.**

## Detection gap

The defect was customer-visible for at least 9 days [E5] and every instrument reported success.

- **The audit instrument records the outcome it wants, not the one it got.** `status: 200` is a
  literal in the call [`server.js:66`]; it cannot ever record a failure. `rows: 0` is recorded
  faithfully but nothing treats it as abnormal.
- **There is no notion of an expected non-zero result.** A supplier with orders visible in the panel
  exporting 0 rows is precisely the *"query for the expected artifact, not the absence of errors"*
  case from `traps.md` — the query "did any export return 0 rows for a supplier that has rows?"
  would have fired on 2026-07-17 at 08:03.
- **The retry signature was already in the data and nobody was looking.** Two `S0002556` exports 17
  seconds apart [E5] is a user clicking again because they got an empty file. That pattern is
  detectable without knowing the cause.
- **The front end cannot report a failure it never inspects.** It downloads whatever arrives
  [`index.html:49-53`], so a 0-byte body is indistinguishable from a successful export in the UI.
- **No test covers a string-typed `supplier_id`.** There is no test suite in this repo at all; had
  there been one built on numeric ids only, it would have passed over this defect for the same
  reason the numeric suppliers work.

## Action items

| Action | Owner | Status |
|---|---|---|
| **Fix spec, not a one-liner.** The comparison at `server.js:64` is one line, but ≥3 further defects share the same failure (empty CSV has no header `:31`; audit hardcodes `status:200` `:66`; front end never inspects the response `index.html:49-53`), and the `Number()` coercion is a **cross-supplier leak surface** [E6], not just a miss. Route through `.ai/specs/` carrying this record as its evidence section | human | open |
| Decide the identity rule for `supplier_id` — normalise the comparison, or normalise the data. This is a 🔀 decision, not an inference; see "Not established" | human | open |
| Check production for a supplier with id `0`, and for how many string-code suppliers exist (sizes the real impact of the report's *"kilku klientów"*) | human | open |
| Ask the client: which supplier, and what did "yesterday" actually look like — empty file or no file. The one question that closes the largest open item | human | open |
| Add the export↔table row-count invariant as a test; add the negative cases (`" 2008"`, `0x7d8`, empty param) so a future coercion fix cannot silently reopen the leak | human | open |
| Make the audit row capable of recording failure, and alert on `rows:0` where the table has rows | human | open |

---

## Method compliance

| Rule | How it was honoured |
|---|---|
| 🔒 1 Read-only | No app code changed; app run locally only. Honest exception disclosed: the export endpoint appends to the audit log, so 10 probe requests wrote 10 rows to the fixture's `audit_logs.jsonl` [E12]. Flagged as a reason to hand replays to the human in a real environment |
| 🔒 2 Live case before audit | Steps 3–7 are entirely live. `server.js` was first opened at **step 12**, after the mechanism was already proven black-box at step 11 |
| 🔒 3 Three hypotheses first | Five, opened at step 8 with `server.js` unopened, each with its refuting observation named in advance; the probes at step 9 were chosen to **discriminate** (H1 vs H4), not to confirm |
| 🔒 4 Every causal claim cited | Every link in the mechanism carries an `[E#]` or a `server.js:line` |
| 🔒 5 Count, do not grep | Audit arrivals counted: 10 rows for 10 requests [E12], rather than inferring from log searches |
| 🔒 6 Mechanism shown | Full chain from dropdown value to 0-byte download, reproducible from the commands in the evidence log |
| 🔒 7 Diagnosis ≠ fix | No fix written. Verification criteria pre-committed, including the negative case, and handed off as a spec rather than a one-liner |
| Traps hit and named | *Absence of an error ≠ health* (clean stdout, HTTP 200 everywhere) · *the docs/report are hypotheses* ("wczoraj było ok" refuted) · *symptom is not cause* (an empty file means a filter matched nothing — go to the filter) · *salience is not evidence* (the "loads 2008" resemblance was made to earn a discriminating proof) |
| Stop trigger | None fired: mechanism confirmed well inside 60 minutes, no production write needed, no hypothesis stranded without evidence |
