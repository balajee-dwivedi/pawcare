const API_ROOT = '/api';

/** Send a REST request and normalize JSON/error responses. */
export async function request(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  const nextHeaders = { ...headers };
  if (token) nextHeaders.Authorization = `Bearer ${token}`;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isForm && !nextHeaders['Content-Type']) nextHeaders['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...rest, method: rest.method || (body ? 'POST' : 'GET'), headers: nextHeaders,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined
    });
  } catch {
    throw new Error('PawCare could not reach the API. Check that the server is running and MongoDB is configured.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { body: payload }),
  forgotPassword: (email) => request('/auth/forgot-password', { body: { email } }),
resetPassword: (token, password) => request('/auth/reset-password', { body: { token, password } }),
  register: (payload) => request('/auth/register', { body: payload }),
  sendVerificationCode: (token) => request('/auth/send-code', { token, method: 'POST' }),
  verifyEmailCode: (token, code) => request('/auth/verify-code', { token, method: 'POST', body: { code } }),
  me: (token) => request('/auth/me', { token }),
  reports: () => request('/reports'),
  myReports: (token) => request('/reports/mine', { token }),
  createReport: (token, body) => request('/reports', { token, body }),
  acceptReport: (token, id) => request(`/reports/${id}/accept`, { token, method: 'POST' }),
  updateReportStatus: (token, id, status) => request(`/reports/${id}/status`, { token, method: 'PATCH', body: { status } }),
  verifyReport: (token, id, verified) => request(`/reports/${id}/verify`, { token, method: 'PATCH', body: { verified } }),
  removeReport: (token, id) => request(`/reports/${id}`, { token, method: 'DELETE' }),
  adoptions: () => request('/adoptions'),
  myAdoptions: (token) => request('/adoptions?status=all', { token }),
  createAdoption: (token, body) => request('/adoptions', { token, body }),
  updateAdoption: (token, id, body) => request(`/adoptions/${id}`, { token, method: 'PATCH', body }),
  shelters: () => request('/shelters'),
  createShelter: (token, body) => request('/shelters', { token, body }),
  updateShelter: (token, id, body) => request(`/shelters/${id}`, { token, method: 'PATCH', body }),
  removeShelter: (token, id) => request(`/shelters/${id}`, { token, method: 'DELETE' }),
  shelterRequests: (token) => request('/shelters/requests', { token }),
  lostFound: (type) => request(`/lost-found${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  createLostFound: (token, body) => request('/lost-found', { token, body }),
  updateLostFound: (token, id, status) => request(`/lost-found/${id}/status`, { token, method: 'PATCH', body: { status } }),
  volunteerRequests: (token) => request('/volunteers/requests', { token }),
  volunteerSummary: (token) => request('/volunteers/summary', { token }),
  updateAvailability: (token, body) => request('/volunteers/availability', { token, method: 'PATCH', body }),
  adminOverview: (token) => request('/admin/overview', { token }),
  updateUser: (token, id, body) => request(`/admin/users/${id}`, { token, method: 'PATCH', body }),
  deleteUser: (token, id) => request(`/admin/users/${id}`, { token, method: 'DELETE' })
  
};
