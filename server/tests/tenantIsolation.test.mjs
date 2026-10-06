import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { saveArchitecture, deleteArchitecture, updateArchitecture, createUser, initPostgres } from '../db/postgres.mjs';

describe('Tenant Isolation & IDOR Protection', () => {
  let victimUser;
  let attackerUser;
  let victimArch;

  before(async () => {
    await initPostgres();
    victimUser = await createUser({ email: `victim_${Date.now()}@test.local`, passwordHash: 'hash', name: 'Victim' });
    attackerUser = await createUser({ email: `attacker_${Date.now()}@test.local`, passwordHash: 'hash', name: 'Attacker' });
    victimArch = await saveArchitecture({
      userId: victimUser.id,
      name: 'Confidential Production Architecture',
      nodes: [],
      edges: []
    });
  });

  test('Attacker cannot delete victim architecture', async () => {
    const deleted = await deleteArchitecture(victimArch.id, attackerUser.id);
    assert.equal(deleted, false, 'Attacker should not be able to delete another tenant architecture');
  });

  test('Attacker cannot update victim architecture', async () => {
    const updated = await updateArchitecture(victimArch.id, attackerUser.id, { name: 'Compromised Name' });
    assert.equal(updated, null, 'Attacker should not be able to update another tenant architecture');
  });

  test('Owner can successfully update and delete their own architecture', async () => {
    const updated = await updateArchitecture(victimArch.id, victimUser.id, { name: 'Updated by Owner' });
    assert.ok(updated);
    assert.equal(updated.name, 'Updated by Owner');

    const deleted = await deleteArchitecture(victimArch.id, victimUser.id);
    assert.equal(deleted, true);
  });
});
