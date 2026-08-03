// -----------------------------------------
// EMPLOYEE MANAGEMENT
// -----------------------------------------

export async function fetchEmployees() {
  return apiFetch('/employees');
}

export async function deleteEmployee(id) {
  return apiFetch(`/employees/${id}`, { method: 'DELETE' });
}

export async function changeEmployeePassword(id, newPassword) {
  return apiFetch(`/employees/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  });
}

export async function fetchEmployeeStats(id) {
  return apiFetch(`/employees/${id}/stats`);
}
