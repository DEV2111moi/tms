const API_BASE = '/api';

async function call(path, opts = {}) {
  const token = localStorage.getItem('tms_token');
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.includes('/auth/login')) {
      localStorage.removeItem('tms_token');
      localStorage.removeItem('tms_user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    throw new Error(b.error || 'Request failed');
  }
  return res.json();
}

const api = {
  // Auth
  login: (email, password) => call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => call('/auth/me'),

  // Dashboard
  dashboard: (date) => call(`/dashboard${date ? `?date=${date}` : ''}`),

  // Generic CRUD
  listRes: (t, filter) => {
    const qs = [];
    if (filter?.route_id) qs.push('route_id=' + filter.route_id);
    if (filter?.institution_id) qs.push('institution_id=' + filter.institution_id);
    return call(`/${t}${qs.length ? '?' + qs.join('&') : ''}`);
  },
  saveRes: (t, data, id) => call(`/${t}${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }),
  delRes: (t, id) => call(`/${t}/${id}`, { method: 'DELETE' }),

  // Fleet
  refs: () => call('/fleet/refs'),
  alerts: (days = 30) => call(`/fleet/alerts?days=${days}`),
  assignments: () => call('/assignments'),
  assign: (body) => call('/assignments', { method: 'POST', body: JSON.stringify(body) }),
  deleteAssignment: (id) => call(`/assignments/${id}`, { method: 'DELETE' }),
  driverMasterEdit: (id, data) => call(`/drivers/${id}/master-edit`, { method: 'PUT', body: JSON.stringify(data) }),
  driverMasterAdd: (data) => call('/drivers/master-add', { method: 'POST', body: JSON.stringify(data) }),

  // Attendance / Incharge
  todayTrip: (shift, routeId) => call(`/trips/today?shift=${shift || 'morning'}${routeId ? `&route_id=${routeId}` : ''}`),
  roster: (id) => call(`/trips/${id}/roster`),
  mark: (tripId, studentId, stopId, status) => call('/attendance/mark', { method: 'POST', body: JSON.stringify({ tripId, studentId, stopId, status }) }),
  submit: (id) => call('/attendance/submit', { method: 'POST', body: JSON.stringify({ tripId: id }) }),
  pushLocation: (tripId, lat, lng, stopId) => call(`/trips/${tripId}/location`, { method: 'POST', body: JSON.stringify({ latitude: lat, longitude: lng, stopId }) }),

  // Reports
  report: (date, routeId, shift, institutionId) => {
    const q = `?date=${date}${routeId ? `&routeId=${routeId}` : ''}${shift ? `&shift=${shift}` : ''}${institutionId ? `&institutionId=${institutionId}` : ''}`;
    return call(`/reports/attendance${q}`);
  },
  repAbsentees: (from, to, inst) => call(`/reports/absentees?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}`),
  repFuel: (from, to, inst) => call(`/reports/fuel-usage?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}`),
  repDistance: (from, to, inst, busId) => call(`/reports/distance?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}${busId ? `&busId=${busId}` : ''}`),
  repBusWise: (from, to, inst, busId) => call(`/reports/bus-wise?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}${busId ? `&busId=${busId}` : ''}`),
  repMaint: (from, to, inst) => call(`/reports/maintenance?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}`),
  repDriverTrips: (from, to, inst) => call(`/reports/driver-trips?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}`),
  repRoutesStops: (inst) => call(`/reports/routes-stops${inst ? `?institutionId=${inst}` : ''}`),
  repSubstitutions: (from, to, inst, busId) => call(`/reports/substitutions?from=${from}&to=${to}${inst ? `&institutionId=${inst}` : ''}${busId ? `&busId=${busId}` : ''}`),
  fuelReport: () => call('/reports/fuel'),
  busFuel: (busId) => call(`/fuel/bus/${busId}`),

  // Driver
  driverMe: () => call('/driver/me'),
  driverBuses: () => call('/driver/buses'),
  driverOpen: () => call('/driver/open'),
  startTrip: (body) => call('/driver/trip/start', { method: 'POST', body: JSON.stringify(body) }),
  endTrip: (body) => call('/driver/trip/end', { method: 'POST', body: JSON.stringify(body) }),
  addFuel: (body) => call('/driver/fuel', { method: 'POST', body: JSON.stringify(body) }),
  addFuelAdmin: (body) => call('/fuel', { method: 'POST', body: JSON.stringify(body) }),
  driverLogs: () => call('/driver/logs'),

  // Users
  listUsers: (role) => call(`/users${role ? `?role=${role}` : ''}`),
  saveUser: (data, id) => call(`/users${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }),
  delUser: (id) => call(`/users/${id}`, { method: 'DELETE' }),

  // Parent
  parent: () => call('/parent/me'),

  // Notifications
  notifications: () => call('/notifications'),

  // Upload
  upload: (name, data) => call('/upload', { method: 'POST', body: JSON.stringify({ name, data }) }),

  // Driver Salary & Bata
  listSalaries: (params = {}) => {
    const qs = [];
    if (params.month) qs.push('month=' + encodeURIComponent(params.month));
    if (params.institution_id) qs.push('institution_id=' + encodeURIComponent(params.institution_id));
    if (params.status) qs.push('status=' + encodeURIComponent(params.status));
    if (params.search) qs.push('search=' + encodeURIComponent(params.search));
    if (params.driver_id) qs.push('driver_id=' + encodeURIComponent(params.driver_id));
    return call(`/salaries${qs.length ? '?' + qs.join('&') : ''}`);
  },
  getSalary: (id) => call(`/salaries/${id}`),
  saveSalary: (data, id) => call(`/salaries${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }),
  delSalary: (id) => call(`/salaries/${id}`, { method: 'DELETE' }),
  autoGenerateSalaries: (body) => call('/salaries/auto-generate', { method: 'POST', body: JSON.stringify(body) }),
  bulkMarkPaid: (body) => call('/salaries/bulk-mark-paid', { method: 'POST', body: JSON.stringify(body) }),

  // Daily Bus Breakdown & Substitutions
  listSubstitutions: (params = {}) => {
    const qs = [];
    if (params.date) qs.push('date=' + encodeURIComponent(params.date));
    if (params.status) qs.push('status=' + encodeURIComponent(params.status));
    return call(`/substitutions${qs.length ? '?' + qs.join('&') : ''}`);
  },
  createSubstitution: (data) => call('/substitutions', { method: 'POST', body: JSON.stringify(data) }),
  resolveSubstitution: (id) => call(`/substitutions/${id}/resolve`, { method: 'PUT' }),
  deleteSubstitution: (id) => call(`/substitutions/${id}`, { method: 'DELETE' }),
};

export default api;
