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
    throw new Error(b.error || 'Request failed');
  }
  return res.json();
}

const api = {
  // Auth
  login: (email, password) => call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => call('/auth/me'),

  // Dashboard
  dashboard: () => call('/dashboard'),

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
  repDriverTrips: (from, to) => call(`/reports/driver-trips?from=${from}&to=${to}`),
  repRoutesStops: (inst) => call(`/reports/routes-stops${inst ? `?institutionId=${inst}` : ''}`),
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
};

export default api;
