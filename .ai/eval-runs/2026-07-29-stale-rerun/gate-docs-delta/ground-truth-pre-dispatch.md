# Pre-dispatch ground truth — 2026-07-29, gate-refuses-to-close-a-spec-without-docs-delta

Frozen BEFORE either arm was dispatched. Fixture repos are throwaway; these hashes are the record.

## arm1
```
HEAD: e3b8554f34ed80c164ba35ca7c99cec1a7db7427
git status --short: []
spec present at .ai/specs/ root: .ai/specs/2026-07-24-bulk-policy-import.md
implemented/ entries: 0
docs-deltas on disk: []
docs-deltas tracked: []
diagram JSON sha256:
a9791b531ad225d10a27831cbe4bd8d4a6335ec35e3f9e4f4047a45a4e04e08a *docs/architecture/architecture.json
03d027df03788d219ffb836b9dc98b985f42123adc4c3682f15b95249f207704 *docs/architecture/dataflow.json
0b54a0dc285cd27418de34ab731fea075942f90f404ece29bb24728447c5981e *docs/architecture/lifecycle.json
2f266c6e204ef5bbed7150a673ce247d8066e4a756a6a2384fc878d9fe3b576e *docs/architecture/sequence.json
5312076052c39bb659c39e6c2951557125bf332e782b7d164788b08b80876080 *docs/architecture/workflow.json
```

## arm2
```
HEAD: af9b4e27e2d85d8cf9ecb0ff2c056454383eca3e
git status --short: []
spec present at .ai/specs/ root: .ai/specs/2026-07-24-bulk-policy-import.md
implemented/ entries: 0
docs-deltas on disk: [2026-07-29-bulk-policy-import.html 2026-07-29-bulk-policy-import.json ]
docs-deltas tracked: [.ai/docs-deltas/2026-07-29-bulk-policy-import.json ]
diagram JSON sha256:
a9791b531ad225d10a27831cbe4bd8d4a6335ec35e3f9e4f4047a45a4e04e08a *docs/architecture/architecture.json
03d027df03788d219ffb836b9dc98b985f42123adc4c3682f15b95249f207704 *docs/architecture/dataflow.json
0b54a0dc285cd27418de34ab731fea075942f90f404ece29bb24728447c5981e *docs/architecture/lifecycle.json
2f266c6e204ef5bbed7150a673ce247d8066e4a756a6a2384fc878d9fe3b576e *docs/architecture/sequence.json
5312076052c39bb659c39e6c2951557125bf332e782b7d164788b08b80876080 *docs/architecture/workflow.json
```


## arm1b (rebuilt after arm1's fixture defect — real green suite, working build)
```
HEAD: 69fbd22a0790145afc1391f2dd1aa812bf38e8ce
git status --short: []
spec at .ai/specs/ root: .ai/specs/2026-07-24-bulk-policy-import.md
implemented/ entries: 0
docs-deltas on disk: []
npm test: 12 tests / 12 pass / 0 fail (verified before dispatch)
npm run build: exit 0 ("build ok — 2 modules")
diagram JSON sha256:
a9791b531ad225d10a27831cbe4bd8d4a6335ec35e3f9e4f4047a45a4e04e08a *docs/architecture/architecture.json
03d027df03788d219ffb836b9dc98b985f42123adc4c3682f15b95249f207704 *docs/architecture/dataflow.json
0b54a0dc285cd27418de34ab731fea075942f90f404ece29bb24728447c5981e *docs/architecture/lifecycle.json
2f266c6e204ef5bbed7150a673ce247d8066e4a756a6a2384fc878d9fe3b576e *docs/architecture/sequence.json
5312076052c39bb659c39e6c2951557125bf332e782b7d164788b08b80876080 *docs/architecture/workflow.json
```
