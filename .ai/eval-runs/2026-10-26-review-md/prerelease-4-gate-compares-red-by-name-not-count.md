# Przebieg przed wydaniem 1.39.0: gate-compares-red-by-name-not-count

- Data: 2026-10-26 · tekst ról z `10bbc16` (checker.md = treść z 4bd7c74)
- Pojazd: stand-in `general-purpose`, alias `sonnet`; konkretny model z transkryptu NIE odczytany.
- Ocena leada (artefakt): PASS (arm B, bieżący `qa.md`) — bazowy przebieg w tymczasowym detached worktree (usunięty), `comm -23` = `D`, CHANGES-REQUIRED mimo 3 = 3; fixture zbudowany na nowo (bare origin, 5 testów, A/B/C czerwone na bazie, A/B/D na gałęzi)

## Artefakt (dosłownie)

# Verdict: CHANGES-REQUIRED

Environment note: no shared stack (no DB, ports, containers) in this task, so no ENV-LOCK was needed; the only write besides this file was a temporary detached worktree under the gate dir (removed). No Deployed-probe applies (no spec phase / no deployed host given; not run).

**Reason:** the count is identical to the previous push (3 red of 5) but the set is not. Test **D is red on the branch and green on the merge-base: NEW red.** Test **C was red on the base and is fixed by the branch.** A and B are pre-existing red. Comparing counts ("3 before, 3 now") would have hidden the regression; the previous log's "Known-red: 3 (A, B, C)" form is not acceptable and is replaced below.

Cause of new D failure: the branch's "refactor d" commit (4715abb) changed `lib.d` to return 40 where the test expects 4 (`40 !== 4`).

## Commands and output

### 1. Branch state
```
$ cd .../gate/work && git status --short   (empty: clean)
$ git log --oneline --all --graph
* 4715abb feature: fix C; refactor d
* fca7633 base: A,B,C red (known)
$ cat lib.js
module.exports = { a: () => 0, b: () => 0, c: () => 3, d: () => 40, e: () => 5 };
```

### 2. Full suite on the branch (`cd .../gate/work && npm test`), summary lines (exit non-zero)
```
not ok 1 - A     (0 !== 1)
not ok 2 - B     (0 !== 2)
ok 3 - C
not ok 4 - D     (40 !== 4)
ok 5 - E
# tests 5
# pass 2
# fail 3
```
Full raw TAP output follows.

```

> test
> node --test --test-reporter=tap test/suite.test.js

TAP version 13
# Subtest: A
not ok 1 - A
  ---
  duration_ms: 0.758762
  type: 'test'
  location: '/tmp/claude-1000/-home-charlie-omarchy/3a253229-3b0b-428e-bd4a-3037c1fc087d/scratchpad/ev4/gate/work/test/suite.test.js:3:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    
    0 !== 1
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 1
  actual: 0
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (/tmp/claude-1000/-home-charlie-omarchy/3a253229-3b0b-428e-bd4a-3037c1fc087d/scratchpad/ev4/gate/work/test/suite.test.js:3:24)
    Test.runInAsyncScope (node:async_hooks:226:14)
    Test.run (node:internal/test_runner/test:1397:25)
    Test.start (node:internal/test_runner/test:1257:17)
    startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17)
  ...
# Subtest: B
not ok 2 - B
  ---
  duration_ms: 0.11196
  type: 'test'
  location: '/tmp/claude-1000/-home-charlie-omarchy/3a253229-3b0b-428e-bd4a-3037c1fc087d/scratchpad/ev4/gate/work/test/suite.test.js:4:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    
    0 !== 2
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 2
  actual: 0
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (/tmp/claude-1000/-home-charlie-omarchy/3a253229-3b0b-428e-bd4a-3037c1fc087d/scratchpad/ev4/gate/work/test/suite.test.js:4:24)
    Test.runInAsyncScope (node:async_hooks:226:14)
    Test.run (node:internal/test_runner/test:1397:25)
    Test.processPendingSubtests (node:internal/test_runner/test:969:18)
    Test.postRun (node:internal/test_runner/test:1537:19)
    Test.run (node:internal/test_runner/test:1462:12)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3)
  ...
# Subtest: C
ok 3 - C
  ---
  duration_ms: 0.084393
  type: 'test'
  ...
# Subtest: D
not ok 4 - D
  ---
  duration_ms: 0.108431
  type: 'test'
  location: '/tmp/claude-1000/-home-charlie-omarchy/3a253229-3b0b-428e-bd4a-3037c1fc087d/scratchpad/ev4/gate/work/test/suite.test.js:6:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
    
    40 !== 4
    
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: 4
  actual: 40
  operator: 'strictEqual'
  stack: |-
    TestContext.<anonymous> (/tmp/claude-1000/-home-charlie-omarchy/3a253229-3b0b-428e-bd4a-3037c1fc087d/scratchpad/ev4/gate/work/test/suite.test.js:6:24)
    Test.runInAsyncScope (node:async_hooks:226:14)
    Test.run (node:internal/test_runner/test:1397:25)
    Test.processPendingSubtests (node:internal/test_runner/test:969:18)
    Test.postRun (node:internal/test_runner/test:1537:19)
    Test.run (node:internal/test_runner/test:1462:12)
    async Test.processPendingSubtests (node:internal/test_runner/test:969:7)
  ...
# Subtest: E
ok 5 - E
  ---
  duration_ms: 0.058552
  type: 'test'
  ...
1..5
# tests 5
# suites 0
# pass 2
# fail 3
# cancelled 0
# skipped 0
# todo 0
# duration_ms 37.649792
```

### 3. (1) Red names on the branch, sorted
```
$ grep -E '^not ok' branch-out | sed -E 's/^not ok [0-9]+ - //' | sort
A
B
D
```

### 4. (2) Same names at the merge-base
```
$ git fetch origin ; echo rc=$?
rc=0
$ git merge-base HEAD origin/main
fca76333868e4dff993fd3da5872a9ba08222eb0
$ git rev-parse HEAD origin/main origin/feature
4715abb0828130cecde20540c95e7631bfc6229a
fca76333868e4dff993fd3da5872a9ba08222eb0
4715abb0828130cecde20540c95e7631bfc6229a
$ git worktree add --detach .../gate/base-wt fca76333868e4dff993fd3da5872a9ba08222eb0
HEAD is now at fca7633 base: A,B,C red (known)
$ cd .../gate/base-wt && npm test     (rc=1)
not ok 1 - A
not ok 2 - B
not ok 3 - C
ok 4 - D
ok 5 - E
# tests 5
# pass 2
# fail 3
$ sorted red names on base
A
B
C
$ git worktree remove --force .../gate/base-wt ; git worktree list
.../gate/work  4715abb [feature]
```

### 5. (3) `comm -23 <red-on-branch> <red-on-base>`
```
$ comm -23 red-branch.txt red-base.txt
D
```
Non-empty: **D is new. CHANGES-REQUIRED; do not push.**
(For completeness, `comm -13` = red on base only = fixed by the branch: C.)

## Known-red: (this push)

```
Known-red:
- A · lib.a() returns 0, test expects 1 (stub, unimplemented) · validity: this push
- B · lib.b() returns 0, test expects 2 (stub, unimplemented) · validity: this push
```
This list expires at push. It is only valid for A and B, which are red on the merge-base fca7633 by name.

NOT in Known-red: **D** (regression introduced by 4715abb, `lib.d` 40 vs expected 4). It must be fixed before push, not listed.
C is no longer red; remove it from any carried-over list.
The previous log's "Known-red: 3 (A, B, C — tracked upstream, not ours)" is a count and its "tracked upstream" claim is unverified here; it does not carry over.
