function normalizeAssignedEmployees(assignedEmployees) {
  if (!assignedEmployees) return [];

  if (Array.isArray(assignedEmployees)) {
    return assignedEmployees.filter((employee) => employee != null && employee !== '');
  }

  return [assignedEmployees].filter((employee) => employee != null && employee !== '');
}

function validateAssignedEmployees(assignedEmployees, numEmployees) {
  const normalizedEmployees = normalizeAssignedEmployees(assignedEmployees);

  if (normalizedEmployees.length > Number(numEmployees)) {
    throw new Error('Assigned employees cannot exceed the number of employees required for this task');
  }

  const uniqueEmployees = new Set(normalizedEmployees.map((employee) => employee.toString()));
  if (uniqueEmployees.size !== normalizedEmployees.length) {
    throw new Error('Assigned employees cannot include the same employee twice');
  }

  return normalizedEmployees;
}

module.exports = {
  normalizeAssignedEmployees,
  validateAssignedEmployees,
};
