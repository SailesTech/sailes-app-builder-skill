'use strict';

const { db } = require('../db');
const { NotFound, Forbidden } = require('../errors');

function createNote(user, { title, body }) {
  const note = {
    id: db.nextId(),
    ownerId: user.id,
    tenantId: user.tenantId,
    title,
    body,
    archivedAt: null,
  };
  return db.notes.put(note);
}

function getNote(user, noteId) {
  const note = db.notes.get(noteId);
  if (!note || note.tenantId !== user.tenantId) throw new NotFound(`note ${noteId}`);
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    archived: note.archivedAt !== null,
  };
}

function archiveNote(user, noteId) {
  const note = db.notes.get(noteId);
  if (!note) throw new NotFound(`note ${noteId}`);
  if (note.ownerId !== user.id) throw new Forbidden('not your note');
  note.archivedAt = new Date().toISOString();
  return db.notes.put(note);
}

/**
 * The caller's own notes, newest last.
 * @param {{ id: string, tenantId: string }} user
 * @param {{ page?: number, pageSize?: number }} opts  page is 1-based
 */
function listNotes(user, { page = 1, pageSize = 20 } = {}) {
  const mine = db.notes.listByTenant(user.tenantId).filter((n) => n.ownerId === user.id);
  const offset = (page - 1) * pageSize;
  return mine.slice(offset, offset + pageSize - 1);
}

module.exports = { createNote, getNote, archiveNote, listNotes };
