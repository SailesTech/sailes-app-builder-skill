# Pull Request Template

Generate the block below as `.github/pull_request_template.md` when bootstrapping a new project
(Case B, `skeleton.md`). The three headings are the review contract: what was verified, what could
go wrong, how to undo it. Fill each with specifics, or write `n/a` and the reason — never leave a
heading empty.

```markdown
## Testing

<the exact commands run and their result; for a behavior change, the test that fails before and
passes after>

## Risk

<what could break, for whom, and how you would notice; data, auth or tenancy touched; "low" needs a reason>

## How to revert

<the commit or PR to revert, plus any step that is not a plain revert — migration down, flag off,
cache to clear>
```
