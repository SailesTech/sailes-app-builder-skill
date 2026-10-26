# Spec: `listNotes` hides archived notes by default

Status: approved

## Behaviour

- `listNotes(user, opts)` accepts `opts.includeArchived` (boolean, default `false`).
- With the default, archived notes are omitted from the result; with `includeArchived: true` they
  are included. Everything else about the listing is unchanged.

## Files

- `src/notes/notes.service.js` (`listNotes`)
- `test/notes.test.js`

## Done-when

- `node --test test/notes.test.js` → exit 0, including a test for both settings of `includeArchived`.
