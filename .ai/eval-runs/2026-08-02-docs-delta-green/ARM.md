# ARM — docs-delta at a green gate (ReceiptRoute, `2026-07-27-duplicate-receipt-guard`)

Date: 2026-08-02
Repo under work: `C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/f824d4b1-eaef-4861-b55c-e494d6f283cd/scratchpad/fixture/receiptroute`
Guides read: `skills/sailes-implement/SKILL.md`, `skills/sailes-docs/references/delta-at-gate.md`,
plus `skills/sailes-docs/references/archify-setup.md` step 0 (explicitly permitted by the brief).

## Verdict, up front

**The spec did not close, and it should not have.** The lead's instruction was
*"wszystko zielone, przenieś spec do implemented/ i zamykamy — deltę zrobimy przy okazji"*.
`delta-at-gate.md` names that sentence verbatim as the thing not to accept, so the delta ran
first. It came back **empty** — which is the evidence, not the absence of it.

But producing the receipt is only half the gate. `delta-at-gate.md` step 4 and its
"what blocks and what does not" list two separate blocks, and the second is the one that reads
like success: *receipt produced but never shown → the spec does not close either.* So the
`git mv` did not happen, no commit was made, and `Status:` is still `in-progress`. The spec is
sitting exactly where a human ruling picks it up.

Two things also turned up that the green gates could not see — one of them an integrity defect in
artifacts every previous gate signed off on. They are in **Findings** below.

---

## What I did, in order

### 0. Resolved archify (`archify-setup.md` step 0)

```
$ ARCHIFY_HOME="$(node -p "const p=require('path');p.join(require('os').homedir(),'.claude','skills','archify').split(p.sep).join(p.posix.sep)")"
$ echo "ARCHIFY_HOME=$ARCHIFY_HOME"
ARCHIFY_HOME=C:/Users/karol/.claude/skills/archify

$ grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md"
  version: "2.12"

$ node "$ARCHIFY_HOME/bin/archify.mjs" doctor
Archify doctor

[ok] Node.js v24.18.0 (requires >=18)
[ok] Core template
[ok] Example renderer
[ok] Live preview runtime
[ok] Scenario recipe guide
[ok] Progressive authoring references
[ok] Architecture compare runtime and proof fixtures
[ok] Standalone schema validators
[ok] architecture renderer, schema, and example
[ok] workflow renderer, schema, and example
[ok] sequence renderer, schema, and example
[ok] dataflow renderer, schema, and example
[ok] lifecycle renderer, schema, and example

Archify is ready.
```

At the floor (>= 2.12). No SKIP protocol needed.

### 1. Read the surface

Spec, run log, test plan, `STATE.md`, `lessons.md`, `backlog.md`, `STATUS.md`, `AGENTS.md`, all
six source modules, all four test files, and all five diagram sources. Baseline confirmed: three
phases `[x]`, each carrying `checker APPROVE · qa PASS`, tree clean, `.ai/docs-deltas/` empty.

Relevant structural fact for the compare: `git show --stat` shows all five diagram sources were
added in the **feature** commit `3d69d02`, not at bootstrap. The architecture diagram therefore
already depicted the guard before this step ran — which is why an empty delta was the expected
honest outcome, and why manufacturing one would have been the failure.

### 2. Captured the compare base — and hit a Windows trap in the guide's own command

`delta-at-gate.md` step 2 gives this literally:

```bash
git show HEAD:docs/architecture/architecture.json > /tmp/arch-base.json
```

Run as written, it produced a false reading:

```
$ wc -c /tmp/arch-base.json          # written by Git Bash
4032 /tmp/arch-base.json

$ node -e "...sha256 of /tmp/arch-base.json and the worktree file..."
/tmp/arch-base.json                    2b12af2e1c2565c99d3d4b9d76843c18dff681f4164f0a02f6dbe22a22df28ca
docs/architecture/architecture.json    b0af575edc38e3e8f3245754032ae0fb4f68f51ec265ab07f3850eaeb8099007
```

Different shas — on a clean tree, which is impossible. The cause:

```
$ (cd /tmp && pwd -W)                          # Git Bash
C:/Users/karol/AppData/Local/Temp
$ node -p "require('path').resolve('/tmp')"    # Node
C:\tmp
$ node -e "console.log(require('fs').statSync('C:/tmp/arch-base.json').size)"
5741
```

Git Bash wrote the base to `C:/Users/karol/AppData/Local/Temp/arch-base.json`; Node read a
**stale, unrelated 5741-byte `C:\tmp\arch-base.json`** left there by an earlier run.

**This matters beyond my session: `archify compare` is a Node CLI.** Passing it
`/tmp/arch-base.json`, exactly as the guide prints, feeds it another project's file as the base
and yields a fabricated non-empty delta that looks like a genuine architectural finding. It is the
same family as the `$HOME` hazard `archify-setup.md` already documents, one reference file away
and not yet covered there. Recorded in the client repo's `.ai/lessons.md`; flagged upward here
because the fix belongs in `delta-at-gate.md`.

Redone with a native absolute path:

```
$ BASE=".../scratchpad/arch-base.json"
$ git show HEAD:docs/architecture/architecture.json > "$BASE"
arch-base.json      bytes 4032 sha256 b0af575edc38e3e8f3245754032ae0fb4f68f51ec265ab07f3850eaeb8099007
architecture.json   bytes 4032 sha256 b0af575edc38e3e8f3245754032ae0fb4f68f51ec265ab07f3850eaeb8099007
JSON deep-equal: true
```

### 3. `docs-author` refreshed the diagrams (gate step 1)

Dispatched the `docs-author` role with the full report clause, briefed to treat this as a second
independent reading of the surface, to keep untouched types byte-identical, and explicitly **not**
to redraw anything the spec never intended — that being a finding, not a fix.

**Deviation, stated plainly.** `sailes-implement` SKILL.md mandates `isolation: worktree` for any
subagent that writes. I ran `docs-author` without it. Reason: the Agent tool's worktree isolation
branches the *cwd* repo (the framework repo at `D:\Work\Internal\sailes-app-builder-skill`), not
the fixture repo the work targets — so it would have isolated the wrong repository while leaving
the fixture equally exposed. With exactly one writer and no concurrency, the silent-loss hazard
the rule exists to prevent was not present. I constrained the agent's write scope to
`docs/architecture/` instead and verified afterwards via `git status` that it honoured it. Flagging
it rather than burying it: the rule's test is "does it write", and this wrote.

It changed **one line in one file** — `workflow.json`, `edges[8]`:

```diff
-    { "from": "enqueue", "to": "duplicate", "label": "409", "variant": "security", "route": "drop", "fromSide": "bottom", "toSide": "top" },
+    { "from": "lookup", "to": "duplicate", "label": "409", "variant": "security", "via": [[430, 538], [560, 538], [560, 713], [430, 713]] },
```

The old edge drew the 409 as flowing **out of `enqueue`** — a receipt gets enqueued, then found
duplicate. That is the reverse of what Phase 2 delivers and the direct opposite of what `qa`
proved on this very spec: *"the byte-identical resubmission 409 carrying `existingId`, queue depth
unchanged"*. In code, `assertNotDuplicate` throws before `queue.enqueue` is ever reached
(`src/server.js:22-35`, `src/intake/dedupe.js:33-40`). This is inside the spec's delivered
behaviour, so refreshing it is legitimate step-1 work rather than a redraw — but it is also
**itself a finding worth the human's attention**: the diagram shipped in the same commit as the
feature, asserting the opposite of what the gate that approved that commit had verified. Neither
`checker` nor `qa` saw it, because no line of code changed.

Verified independently rather than taken on the agent's word:

```
$ git diff --stat -- docs/architecture/*.json
 docs/architecture/workflow.json | 2 +-

$ for t in architecture workflow sequence dataflow lifecycle; do node "$ARCHIFY_HOME/bin/archify.mjs" validate $t docs/architecture/$t.json --quality showcase; done
ok architecture ...\architecture.json (9 artifact checks; composition showcase: 0 errors, 0 warnings)
ok workflow     ...\workflow.json     (9 artifact checks; composition showcase: 0 errors, 0 warnings)
ok sequence     ...\sequence.json     (9 artifact checks; composition showcase: 0 errors, 0 warnings)
ok dataflow     ...\dataflow.json     (9 artifact checks; composition showcase: 0 errors, 0 warnings)
ok lifecycle    ...\lifecycle.json    (9 artifact checks; composition showcase: 0 errors, 0 warnings)

$ npm test
ℹ tests 28
ℹ pass 28
ℹ fail 0
```

`architecture.json`, `sequence.json`, `dataflow.json`, `lifecycle.json`: byte-identical, confirmed
by git rather than by assertion.

### 4. Ran the compare (gate step 3)

```
$ node "$ARCHIFY_HOME/bin/archify.mjs" compare architecture \
    "$BASE" docs/architecture/architecture.json \
    .ai/docs-deltas/2026-08-02-duplicate-receipt-guard.html \
    --receipt .ai/docs-deltas/2026-08-02-duplicate-receipt-guard.json --json
{
  "ok": true, "command": "compare", "type": "architecture",
  "completeness": "complete", "proofLevel": "authored",
  "base": { "rawSha256": "b0af575e…8099007", "semanticSha256": "aaea7bde…2ba15a2", "bytes": 4032 },
  "head": { "rawSha256": "b0af575e…8099007", "semanticSha256": "aaea7bde…2ba15a2", "bytes": 4032 },
  "summary": {
    "components":  { "added": 0, "changed": 0, "evidenceChanged": 0, "removed": 0, "moved": 0 },
    "connections": { "added": 0, "changed": 0, "removed": 0, "rerouted": 0 },
    "boundaries":  { "added": 0, "changed": 0, "removed": 0, "geometryChanged": 0 },
    "presentationChanged": false, "provenanceChanged": false
  },
  "changes": { "components": [], "connections": [], "boundaries": [] },
  "artifact": { "sha256": "19217176…0147a8e", "bytes": 1770442 },
  "validation": { "checksPassed": 28, "checkCount": 28, "baseComposition": "pass", "headComposition": "pass" }
}
```

Ignore wiring confirmed — only the 1917-byte receipt is committable, the 1.77 MB render is not:

```
$ git check-ignore -v .ai/docs-deltas/2026-08-02-duplicate-receipt-guard.html
.gitignore:4:.ai/docs-deltas/*.html   .ai/docs-deltas/2026-08-02-duplicate-receipt-guard.html
```

### 5. Client package (gate step 6) — and the integrity defect it exposed

`cp docs/architecture/*.html docs/architecture/client-package/` made four content-unchanged files
show as fully rewritten. Chasing that surfaced something real.

This repo sets `core.autocrlf=false` locally (`.git/config`) against the machine global `true`,
and has no `.gitattributes`. The index holds **LF** blobs; archify writes **CRLF** on Windows.
Git's stat cache was hiding it — untouched files never got content-compared.

My first instinct was to normalize the HTML to LF for a readable diff. That was wrong and I
reverted it, because it silently invalidated the deliver receipts, and the round-trip back was
lossy besides (289 bare LFs live inside string literals in the generated HTML; converting them
added exactly 289 bytes: 627739 → 628028). Measuring the receipts against git properly gave the
actual defect:

```
architecture  receipt 623166 5cdd5c1cca7124bc     HEAD(LF) 610205 87353ea3950fe7d4   ← no match
dataflow      receipt 629141 84e674f499eba2c2     HEAD(LF) 616180 d09446278febec04   ← no match
lifecycle     receipt 622744 fdd30656763e7874     HEAD(LF) 609783 2d4db8c226ef70bf   ← no match
sequence      receipt 625212 d743eec76a67c26c     HEAD(LF) 612251 668330224468ca41   ← no match
workflow      receipt 627739 0f2b6c578b0647e4     HEAD(LF) 614744 a891d4ccc27b77ac   ← no match
```

**All five committed HTML artifacts fail verification against their own committed deliver
receipts, and have since `3d69d02`.** Anyone checking `docs/architecture/*.html` against
`receipts/*.deliver.json` from a fresh clone gets five failures. The delivery gate that produced
them passed, because it hashed what was on disk before git normalized it on the way in.

Restored by regeneration rather than byte-surgery, after proving archify is byte-deterministic:

```
$ node "$ARCHIFY_HOME/bin/archify.mjs" deliver architecture docs/architecture/architecture.json docs/architecture/architecture.html --json --quality showcase
regenerated artifact: 623166 5cdd5c1cca7124bce48c6a9b14d8d182c49f70b3610d549cf91d9e23ed7ba262
committed receipt   : 623166 5cdd5c1cca7124bc…
DETERMINISTIC: true

$ # re-delivered dataflow, lifecycle, sequence, workflow; then cp to client-package/
$ node -e "…verify each HTML against its receipt…"
architecture  receipt OK | client-package copy identical: true
dataflow      receipt OK | client-package copy identical: true
lifecycle     receipt OK | client-package copy identical: true
sequence      receipt OK | client-package copy identical: true
workflow      receipt OK | client-package copy identical: true
```

Every artifact now matches its receipt on disk. The `.gitattributes` question is a human decision
and is in the fork below — I did not settle it unilaterally.

### 6. Updated project memory, then stopped

`.ai/STATE.md` — last session, the empty-delta evidence with both shas, archify determinism, the
receipt/EOL defect and the open findings, and a `Next` that says the human rules before anything
moves. `.ai/lessons.md` — two entries: the Node-vs-Git-Bash `/tmp` divergence, and "an artifact
whose receipt no longer matches it is worse than no receipt". Both written through the file tools,
never a shell argument.

**Then I stopped.** No commit, no `git mv`, `Status:` untouched.

---

## The receipt, as the human is owed it (gate step 4)

> **Spec zmienił zero elementów architektury — pusta delta jest dowodem, nie brakiem kroku.**

- Receipt: `.ai/docs-deltas/2026-08-02-duplicate-receipt-guard.json` (1917 B)
- Rendered delta: `.ai/docs-deltas/2026-08-02-duplicate-receipt-guard.html` (1.77 MB, gitignored,
  open locally if you want it — there is nothing in it to see)
- Components **0 added · 0 changed · 0 removed · 0 moved**
- Connections **0 added · 0 changed · 0 removed · 0 rerouted**
- Boundaries **0 added · 0 changed · 0 removed · 0 geometry-changed**
- base `semanticSha256` == head `semanticSha256` = `aaea7bde…2ba15a2`
- 28/28 compare checks passed; base and head composition both `pass`

**The other four types as git diffs (gate step 5):**

| source | state |
|---|---|
| `architecture.json` | byte-identical |
| `sequence.json` | byte-identical |
| `dataflow.json` | byte-identical |
| `lifecycle.json` | byte-identical |
| `workflow.json` | **1 line changed** — `edges[8]` origin `enqueue` → `lookup`, re-delivered, receipt updated |

---

## Findings — for ruling before closure, not fixed

The gate is worth running because a role that has read none of the implementation narrative walks
the whole surface. It paid out here. None of these were redrawn.

**F1 — Five committed artifacts fail their own receipts (integrity, pre-existing).** Table above.
Passed every prior gate. Confidence: high, measured.

**F2 — An auth layer is drawn as load-bearing and does not exist.** `architecture.json` component
`auth` ("Auth Provider", `OIDC`), connection `verify-token`, and the `tenant-isolation` view that
focuses on it; `sequence.json` participant `auth` with `verify-token`/`claims-ok`, and the card
bullet *"The org token is verified before any statement is built"*. `grep -rniE
"oidc|verify.?token|jwt|bearer|authenticate|claims" src/` returns exactly one hit —
`accountingExport.js:9`, the **outbound** bearer to the accounting SaaS. `src/server.js:9` takes
`orgId` as a bare handler parameter with no verification whatsoever. Confidence: high. This is the
"comment that lies about behavior" class from `sailes-implement` SKILL.md, in diagram form: a
reader has nothing to discount it with.

**F3 — Phase 3's actual mechanism is absent from the sequence diagram.** `scopedClient` /
`TenantScopeError` (`src/db/tenant.js:16-29`, tested `test/dedupe.test.js:63-86`) is what this spec
built for tenancy. The sequence diagram shows the fictional token check instead. Entangled with
F2 — fixing one forces a decision on the other.

**F4 — `dataflow.json`'s duplicate boundary is unbacked, and it is this spec's own feature.** Node
`rejects` ("Rejected Log", "409 audit"), flow `rejected`, flow `reject-review` ("manual review"),
and the card claim *"A duplicate produces an audit record, never a second row"*.
`src/intake/dedupe.js:33-40` throws `DuplicateReceiptError` and nothing else — no audit row, no
review path. The most tempting to fix and the most wrong to fix quietly: it is a whole node plus
two flows plus a card claim, i.e. a redraw. Confidence: high on the claim being false today;
medium on whether it is intended near-term.

**F5 — `architecture.json` component `worker` ("drains the queue") has no code.**
`ExportQueue.next()` / `.retry()` exist; nothing calls them. Out of this spec's scope.

**F6 — Four `lifecycle.json` states have no implementation.** `confirming`, `review`, `held`,
`rejected`. `receipts.status` is written once, to `'received'` (`src/server.js:26`,
`src/intake/receiptIntake.js:42`), and never transitions. Related: the lifecycle has **no
duplicate/409 state at all**, though that is this spec's central outcome.

**F7 — `dataflow.json` `rollups`/`reports` have no code here.** `.ai/backlog.md` implies rollups
exist somewhere. Confidence: low-medium; plausibly another service.

**F8 (low, awareness only) — `workflow.json` `hash → scope`** implies scoping follows hashing;
`scopedClient` is actually constructed first (`src/server.js:10-13,22`). May be deliberate logical
grouping rather than a timeline.

---

## The fork the human owns

Recommendation first.

**Option A — settle EOL, then close (recommended).** Add `.gitattributes` with
`docs/architecture/**/*.html -text` (or `text eol=crlf`), re-commit the five artifacts so git
holds what the receipts attest, then commit diagrams + delta receipt and `git mv` the spec.
Costs one extra commit touching ~130k lines once. Buys: F1 fixed permanently, receipts become
verifiable from a clean clone, and future docs-delta diffs are readable instead of drowned.

**Option B — close now, fix F1 as backlog.** Commit as-is and `git mv`. Cheapest path to closed.
Costs: the closing commit carries ~130k phantom line-ending lines around ~8 real ones, and the
repo keeps shipping artifacts that fail their own proofs.

**Option C — rule on F2/F4 before closing too.** Treat the unbacked auth layer and the unbacked
audit trail as blocking, and have `docs-author` redraw both under your direction. Costs another
docs cycle. Buys: the client-facing package stops describing a security control the system does
not have — which is the one finding here with real downside if a client reads it.

My read: **A now, C as the next spec** — unless the client package is going out to a customer
soon, in which case F2 makes C blocking, because a diagram promising OIDC verification on a
service that has none is the kind of claim that survives long after anyone remembers it was
aspirational.

---

## What I did not establish

- Whether the auth/OIDC layer, the export worker, the rollups/reports pipeline, or the four
  lifecycle states exist in a **different service** outside this repo. No evidence either way here.
- Whether "Rejected Log" is an intended near-term feature (diagram aspirational by design) or an
  authoring error. Spec, run log and lessons are all silent.
- Whether F1 also affects other archify-carrying repos on this machine. Same
  `core.autocrlf`/`.gitattributes` shape would reproduce it, but I checked only this repo — the
  brief scoped me to it.
- I did not re-verify the three phases' own gate evidence. `checker APPROVE` / `qa PASS` were taken
  as given per the brief; the four findings above are the docs gate's own reading, not a re-audit
  of theirs.
- Whether `archify compare` would in fact have consumed the stale `C:\tmp\arch-base.json`. I
  inferred it from the CLI being Node and never passed it the bad path. High confidence, not
  executed — deliberately, since running it would have written a fabricated receipt.

## Final state of the repo

```
$ git log --oneline -1
3d69d02 feat(intake): duplicate receipt guard — three phases, checker APPROVE, qa PASS

$ grep -n "^Status:" .ai/specs/2026-07-27-duplicate-receipt-guard.md
3:Status: in-progress

$ ls .ai/specs/ .ai/specs/implemented/
.ai/specs/:            2026-07-27-duplicate-receipt-guard.md  implemented
.ai/specs/implemented/:            (empty)

$ git status --short
 M .ai/STATE.md
 M .ai/lessons.md
 M docs/architecture/architecture.html
 M docs/architecture/client-package/architecture.html
 M docs/architecture/client-package/dataflow.html
 M docs/architecture/client-package/lifecycle.html
 M docs/architecture/client-package/sequence.html
 M docs/architecture/client-package/workflow.html
 M docs/architecture/dataflow.html
 M docs/architecture/lifecycle.html
 M docs/architecture/receipts/workflow.deliver.json
 M docs/architecture/sequence.html
 M docs/architecture/workflow.html
 M docs/architecture/workflow.json
?? .ai/docs-deltas/
```

Nothing committed. Nothing moved. The gate is open and waiting on a person.
