const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAssignedEmployees } = require('../utils/taskAssignmentValidation');

test('allows assignment up to the required number of employees and rejects duplicates', () => {
  assert.doesNotThrow(() => validateAssignedEmployees(['emp-1', 'emp-2'], 2));
  assert.throws(() => validateAssignedEmployees(['emp-1', 'emp-2'], 1), /cannot exceed/i);
  assert.throws(() => validateAssignedEmployees(['emp-1', 'emp-1'], 2), /same employee/i);
});
