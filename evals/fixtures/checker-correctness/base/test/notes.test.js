'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('../src/db');
const { NotFound } = require('../src/errors');
const { createNote, getNote, archiveNote, listNotes } = require('../src/notes/notes.service');

const ann = { id: 'u1', tenantId: 't1' };

beforeEach(() => db.reset());

test('getNote returns the note view', () => {
  const { id } = createNote(ann, { title: 'plan', body: 'x' });
  assert.deepEqual(getNote(ann, id), { id, title: 'plan', body: 'x', archived: false });
});

test('archiveNote stamps archivedAt', () => {
  const { id } = createNote(ann, { title: 'plan', body: 'x' });
  const archived = archiveNote(ann, id);
  assert.match(archived.archivedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('archiveNote on an unknown id throws NotFound', () => {
  assert.throws(() => archiveNote(ann, 'nope'), NotFound);
});

test('listNotes returns only the caller\'s own notes', () => {
  createNote(ann, { title: 'mine', body: '' });
  createNote({ id: 'u2', tenantId: 't1' }, { title: 'theirs', body: '' });
  assert.deepEqual(listNotes(ann).map((n) => n.title), ['mine']);
});
