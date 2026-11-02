import assert from 'node:assert/strict';
import test from 'node:test';
import { hasStaffPermission } from '../app/lib/permissions.ts';

test('super administrators can access every staff module', () => {
  assert.equal(hasStaffPermission(['super_admin'], ['pricing_manager']), true);
});

test('a staff role grants only its assigned module permission', () => {
  assert.equal(hasStaffPermission(['inventory_manager'], ['inventory_manager']), true);
  assert.equal(hasStaffPermission(['inventory_manager'], ['order_manager']), false);
});

test('customers without staff roles cannot access an admin module', () => {
  assert.equal(hasStaffPermission([], ['customer_support']), false);
});