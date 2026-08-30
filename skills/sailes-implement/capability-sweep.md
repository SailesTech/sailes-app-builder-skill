# The capability sweep

Cited from `sailes-implement/SKILL.md`, "On completion". It sits here rather than in the
always-loaded skill body because it runs once per capability, not once per commit.

**Delivered a CAPABILITY? Sweep the repo for comments that justified its absence** — before closing:
```bash
grep -rn "DOES NOT EXIST\|NIE ISTNIEJE\|AT INTEGRATION\|PRZY INTEGRACJI\|TODO\|for now\|na razie" --include=*.ts --include=*.tsx src apps packages
```
**Sweep the mirror-image class too — a comment claiming something IS enforced:**
```bash
grep -rn "is enforced\|is validated\|is guaranteed\|always \|never \|jest wymuszan\|zawsze \|nigdy " --include=*.ts --include=*.tsx src apps packages
```
The first pattern finds a comment saying a capability is missing after it arrived. This one finds
the opposite and more dangerous shape: a comment describing behavior the code does not have.
Measured 2026-08-01, twice in one day, and **both were correct when written**. One asserted that
a requirement was globally enforced — an aspiration, not a description; `checker` found it and
graded it a **defect, not a nit**, correctly, because *a comment that lies about behavior is worse
than no comment: the reader has nothing to discount it with*, and the named failure mode was the
next milestone's author trusting that line. The other computed a response field from a narrower
source; **defensible in the morning** and **wrong in both directions by the afternoon**, because
the mechanism it approximated had come into existence in between. Neither was findable by reading
a diff — the diff does not touch those lines. Only a gate reading the whole surface on a clean
context finds them, and it took **two different roles** to find these two, `checker` and the
closing docs-delta, because they were looking from different sides.

Every hit is a claim that was true when written and may not be now. Measured 2026-07-30: a comment
read *"call the storage adapter AT INTEGRATION — `packages/files` DOES NOT EXIST"*; the package had
existed for a week, `deleteObject` included, and the erasure path was leaving files in the bucket
indefinitely. **One sweep on the day `packages/files` landed would have found it that day instead
of a week later.** The sweep is cheap because it runs once per capability, not once per commit —
and it is the only step that connects "the dependency arrived" to "the things waiting on it".
