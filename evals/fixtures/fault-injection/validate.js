'use strict';

/** Validates a partner-profile form submission. Pure, no I/O. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIP = /^\d{10}$/;

function validateProfile(input) {
  const errors = {};
  const v = input && typeof input === 'object' ? input : {};

  const name = typeof v.companyName === 'string' ? v.companyName.trim() : '';
  if (name.length === 0) errors.companyName = 'required';
  else if (name.length < 3) errors.companyName = 'too_short';
  else if (name.length > 80) errors.companyName = 'too_long';

  const email = typeof v.email === 'string' ? v.email.trim().toLowerCase() : '';
  if (email.length === 0) errors.email = 'required';
  else if (!EMAIL.test(email)) errors.email = 'invalid';

  const nip = typeof v.nip === 'string' ? v.nip.replace(/[\s-]/g, '') : '';
  if (nip.length === 0) errors.nip = 'required';
  else if (!NIP.test(nip)) errors.nip = 'invalid';

  const seats = v.seats;
  if (seats === undefined || seats === null || seats === '') errors.seats = 'required';
  else if (typeof seats !== 'number' || !Number.isInteger(seats)) errors.seats = 'invalid';
  else if (seats < 1) errors.seats = 'too_low';
  else if (seats > 500) errors.seats = 'too_high';

  // optional
  if (v.website !== undefined && v.website !== null && v.website !== '') {
    if (typeof v.website !== 'string' || !/^https:\/\/\S+$/.test(v.website.trim())) {
      errors.website = 'invalid';
    }
  }

  return Object.keys(errors).length === 0
    ? { ok: true, value: { companyName: name, email, nip, seats, website: v.website || null } }
    : { ok: false, errors };
}

module.exports = { validateProfile };
