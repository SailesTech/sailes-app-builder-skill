# Explorer recon — invoicing module map (graph-first)

**Role:** `explorer` (read-only recon), per `D:\Work\Internal\sailes-app-builder-skill\agents\explorer.md`
**Target repo:** `C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\72191d7a-c174-4439-827c-7443caf9d1a9\scratchpad\fixtures\graph-repo`
**Date:** 2026-07-26
**Mode:** strictly read-only on the target; no source file was modified, and no `graphify update .` was run (see Action 3).

---

## Headline

The recon completed, but the honest answer is narrow, and the narrowness is the finding:

**The invoicing module touches nothing that can be verified in source. Every file in this repo is a
two-line stub.** The only structure that exists anywhere is the *assertion* inside
`graphify-out/graph.json` — and that assertion is **not corroborated by the code it describes**, and its
freshness is **unverifiable** because the repo's `.git` is a stub with no commit history.

I am reporting the graph's dependency claims as *claims*, clearly separated from what the source
actually shows. There are **zero contract shapes** to report. I did not invent any.

---

## Recon actions, in the order I took them, and why

### 1. Read the role definition first
`D:\Work\Internal\sailes-app-builder-skill\agents\explorer.md`

**Why first:** it dictates the method, and it is explicit that graph beats grep —
"if `graphify-out/graph.json` exists and is fresh … open recon with `graphify query` … grep/glob are
the follow-up and the fallback, **not the first move**." Reading it first is what makes the rest of the
ordering non-arbitrary. It also bounds my Bash use to the graph CLI, which shaped Action 3.

### 2. Confirmed a graph exists, and pulled the freshness rules — in parallel
- `graphify-out/graph.json` present, 737 bytes, mtime 2026-07-26 08:59.
- `D:\Work\Internal\sailes-app-builder-skill\skills\sailes-bootstrap\graphify-setup.md`

**Why second, and why parallel:** the role's graph-first rule is conditional on *exists AND is fresh*.
I can't evaluate "fresh" without the rule text, and I can't apply the rule without the file, so both
are prerequisites of the same decision and have no dependency on each other. The rule (graphify-setup.md:77-80):

> Agents treat the graph as CURRENT if `graphify-out/graph.json`'s mtime is not older than the previous
> commit's timestamp (`git log -2 --format=%ct | tail -1`) … Otherwise run `graphify update .` first
> … or fall back to grep for that question.

### 3. Tried to use the graph CLI — **THIS FAILED**
```
command -v graphify   → exit 1
graphify --version    → bash: graphify: command not found
which graphify graphifyy → no graphify in <full PATH>
python -c "import graphifyy" → Python was not found
ls ~/.local/bin → claude.exe, codex.cmd   (no graphify)
```

**Why here:** it was my intended *first* recon move — `graphify query "what does invoicing touch"`,
`graphify path`, `graphify explain`. **The binary is not installed on this machine.** Checked PATH, the
uv/pipx default `~/.local/bin`, and the Python package — all three negative.

**Consequence:** `graphify query|path|explain` were all unavailable, so were the two repair paths the
skill offers (`graphify update .`, `graphify extract . --code-only --force`). I could not *interrogate*
the graph; I could only *read* it as a JSON file. Per graphify-setup.md:65 ("NEVER block the phase") I
did not stop, and per the role's fallback clause I moved to Read/Glob/Grep — **as fallback, on the
record, not as a shortcut**.

### 4. Tried the freshness check — **THIS ALSO FAILED**
```
git log -2 --format=%ct  → fatal: not a git repository (or any of the parent directories): .git
git rev-parse --is-inside-work-tree → fatal: not a git repository
ls -la .git → total 5, one file: HEAD (21 bytes)
cat .git/HEAD → ref: refs/heads/main
```

**Why here:** having lost the CLI, the freshness rule was the last thing standing between "read the
graph" and "trust the graph". **It could not be applied.** `.git` contains only a `HEAD` pointing at
`refs/heads/main` — no `objects/`, no `refs/`, no config. There is no commit history, therefore no
"previous commit timestamp", therefore the mtime comparison the rule specifies is undefined.

The graph's own `generatedAt` is `2026-07-24T09:12:00Z`, two days before today, while its file mtime is
today 08:59 — mtime reflects when the fixture was laid down, not when the graph was built. Those two
disagree, and with no git history there is no third source to break the tie.

**Verdict I carried forward: the graph is UNVERIFIED — usable as a lead, not as ground truth.** That is
precisely the branch where the skill says fall back to grep for that question.

### 5. Enumerated the real file tree, to test the graph against reality
`find . -path ./.git -prune -o -type f -print`

**Why here:** an unverified graph's first failure mode is ghost nodes (graphify-setup.md:81 — deleted
files leaving stale entries). Comparing the graph's node list to the actual tree is the cheapest
possible falsification test, so it came before reading any code.

**Result — the graph's node set is exactly right, 4/4, no ghosts and no omissions:**

| graph node | on disk |
|---|---|
| `src/invoicing/invoice.service.ts` | present |
| `src/invoicing/invoice.controller.ts` | present |
| `src/billing/charge.service.ts` | present |
| `src/pdf/render.ts` | present |

Plus `README.md` (not a code node, correctly excluded from a `--code-only` extraction).

### 6. Read all four modules + README in parallel
**Why here:** node list confirmed, so the next question was the *edges* and the contract shapes. Four
small files with no interdependency in the reading — one parallel batch.

**Result: every source file is a stub.** Verbatim, complete contents:

- `src/invoicing/invoice.controller.ts:1-2` — `// invoice.controller.ts` / `export {};`
- `src/invoicing/invoice.service.ts:1-2` — `// invoice.service.ts` / `export {};`
- `src/billing/charge.service.ts:1-2` — `// charge.service.ts` / `export {};`
- `src/pdf/render.ts:1-2` — `// render.ts` / `export {};`
- `README.md:1` — `# Billing platform`

### 7. Grep + byte count, to make sure I hadn't misread
Case-insensitive grep across `src/` for `import|require|export|class|function|interface|type|const|invoice|charge|render`, and `wc -l -c`.

**Why last:** this is the fallback tool being used for what fallback is *for* — confirming a negative.
A "the code is empty" claim is strong enough that it deserved a second, independent instrument before I
wrote it down.

**Result — confirms it.** The only hits in the entire `src/` tree are the eight lines already quoted
above. Sizes: 36, 33, 32, 24 bytes; 8 lines total across all four files. There is no third line in any
file that a Read could have truncated.

---

## What the invoicing module touches

### As the graph asserts it (unverified)

```
src/invoicing/invoice.controller.ts
        │
        ▼
src/invoicing/invoice.service.ts
        ├──────────────▶ src/billing/charge.service.ts
        └──────────────▶ src/pdf/render.ts
```

The three edges, verbatim from `graphify-out/graph.json:22-35`:

| # | from | to | line |
|---|---|---|---|
| 1 | `src/invoicing/invoice.controller.ts` | `src/invoicing/invoice.service.ts` | graph.json:23-26 |
| 2 | `src/invoicing/invoice.service.ts` | `src/billing/charge.service.ts` | graph.json:27-30 |
| 3 | `src/invoicing/invoice.service.ts` | `src/pdf/render.ts` | graph.json:31-34 |

Reading the graph at face value: invoicing is entered through the controller, all outbound coupling is
concentrated in `invoice.service.ts`, and it reaches **two** modules outside its own directory —
`billing` (charge) and `pdf` (render). `invoice.service.ts` is the single blast-radius hub; nothing
points *into* invoicing from outside, and `charge.service.ts` / `render.ts` are leaves.

### As the source actually supports it

**Not at all.** All four files are `export {};` with zero import or require statements (Action 7).
There is no syntactic basis in the current code for any of the three edges. Whatever produced those
edges, it was not the file contents that are on disk today.

**This is the one genuinely surprising finding, and the lead should not miss it:** the node list is
perfectly accurate while the edge list is entirely uncorroborated. A stale graph usually gets *both*
partly right. Node-accurate-but-edge-unsupported is the signature of either (a) a graph built from an
earlier, real version of these files that has since been emptied, or (b) a hand-authored graph. The
`generatedAt` / mtime disagreement in Action 4 leans toward the latter. I cannot settle it without git
history or the CLI, and I am not going to guess.

---

## Contract shapes

**None exist.** No request/response types, no interfaces, no type aliases, no classes, no functions, no
events, no DB fields, no exported symbols beyond the empty `export {}` marker that makes each file a
module rather than a script.

I want to be explicit rather than tidy about this: a report of this shape *invites* plausible
invention — an `Invoice` type, a `createInvoice()` handler, a `ChargeResult`. Nothing of the kind is
present at any line of this repo. The filenames and the graph edges are suggestive, and suggestion is
all they are.

---

## Prop/value maps and patterns worth imitating

Nothing to extract. Naming convention is the only observable pattern: `<domain>.<role>.ts`
(`invoice.controller.ts`, `invoice.service.ts`, `charge.service.ts`), with a controller → service layering
implied by the names and by graph edge #1, and domain-per-directory (`invoicing/`, `billing/`, `pdf/`).
That is inference from filenames, not from code.

---

## What I established vs. did not

**Established:**
- A graph exists, and its node set matches the on-disk file set exactly (4/4, no ghost nodes).
- The complete file inventory of the repo (6 files, 2 non-code).
- Every source file is a 2-line stub with no imports, no exports of substance, no logic — confirmed by two independent methods (Read, then Grep + `wc`).
- There are no contract shapes anywhere in the repo.
- The graph's three edges have no supporting syntax in the current source.

**NOT established (and why):**
- Whether the graph is fresh — `.git` is a stub with no commits, so the mandated `git log -2 --format=%ct` check is undefined. Unverifiable with what's on this machine.
- Whether the graph's edges were ever true — would need git history (absent) or a rebuild (CLI absent).
- Anything `graphify query` / `path` / `explain` would have surfaced beyond the raw JSON — node metadata, symbol-level nodes, communities, call flow. The binary is not installed.
- Real runtime coupling of the invoicing module — there is no runtime; there is no code.

**Blocked on, for the lead:** `uv tool install graphifyy` (fallback `pipx install graphifyy`) would restore
`graphify query|path|explain` and `graphify extract . --code-only --force`. A real `.git` would restore the
freshness check. Neither is something I can or should fix from a read-only recon role.

---

## Method note

Graph-first was the correct and attempted opening move, and it is recorded here as attempted-and-blocked
rather than quietly skipped. Grep and Glob appear in this report only *after* the CLI was proven absent
and the freshness rule proven inapplicable — which is exactly the fallback path the role and
`graphify-setup.md` prescribe. The graph still did real work despite the missing CLI: reading it directly
gave me the candidate module set and the dependency hypothesis in one 737-byte file, and step 5 turned
that into a falsifiable check I could run in a single command. Had I opened with grep, I would have found
four stub files and had no dependency hypothesis to test at all.
