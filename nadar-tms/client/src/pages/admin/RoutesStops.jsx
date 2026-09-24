import { useState, useEffect } from 'react';
import api from '../../api/api';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

export default function RoutesStops() {
  const [routes, setRoutes] = useState([]);
  const [refs, setRefs] = useState({});
  const [stopsByRoute, setStopsByRoute] = useState({});
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [editingStop, setEditingStop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instFilter, setInstFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allStops, setAllStops] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [editingInitialRouteId, setEditingInitialRouteId] = useState(null);
  const [initialForm, setInitialForm] = useState({ point: '', time: '' });
  const [editingEndRouteId, setEditingEndRouteId] = useState(null);
  const [endForm, setEndForm] = useState({ destination: '', institution_id: '', time: '' });
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'institution';

  const loadRoutes = (inst) => {
    setLoading(true);
    const filter = (inst && inst !== 'all') ? { institution_id: inst } : { institution_id: 'all' };
    api.listRes('routes', filter).then(d => {
      setRoutes(d.items || []);
      setLoading(false);
    });
  };

  const reloadStops = () => {
    api.listRes('stops').then(d => setAllStops(d.items || [])).catch(() => {});
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
    api.assignments().then(a => setAssignments(a.items || [])).catch(() => {});
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'all';
    setInstFilter(initialInst);
    loadRoutes(initialInst);
    reloadStops();
  }, []);

  const handleInstChange = (v) => {
    setInstFilter(v);
    loadRoutes(v);
  };

  const getRouteStopPartition = (r, stops) => {
    if (!stops || stops.length === 0) {
      return { boardingStops: [], endStop: null };
    }

    const destName = (r.destination || '').toLowerCase().trim();
    let endStopIndex = -1;

    if (destName) {
      endStopIndex = stops.findIndex(s => {
        const sName = (s.stop_name || '').toLowerCase().trim();
        return sName === destName || (destName.length >= 3 && sName.includes(destName)) || (sName.length >= 3 && destName.includes(sName));
      });
    }

    if (endStopIndex === -1 && stops.length > 1) {
      const lastStop = stops[stops.length - 1];
      const lastName = (lastStop.stop_name || '').toLowerCase();
      if (lastName.includes('clg') || lastName.includes('college') || lastName.includes('campus') || lastName.includes('nscet') || lastName.includes('inst')) {
        endStopIndex = stops.length - 1;
      }
    }

    if (endStopIndex !== -1) {
      const endStop = stops[endStopIndex];
      const boardingStops = stops.filter((_, idx) => idx !== endStopIndex);
      return { boardingStops, endStop };
    }

    return { boardingStops: stops, endStop: null };
  };

  const handleStartEditInitial = (r) => {
    setEditingInitialRouteId(r.id);
    setInitialForm({
      point: r.initial_point || '',
      time: r.initial_time ? r.initial_time.slice(0, 5) : ''
    });
  };

  const handleSaveInitialPoint = async (routeId) => {
    const route = routes.find(rt => rt.id === routeId);
    if (!route) return;

    try {
      const newPoint = initialForm.point?.trim() || null;
      let newTime = initialForm.time?.trim() || null;
      if (newTime && newTime.length === 5) {
        newTime = `${newTime}:00`;
      }

      const payload = {
        ...route,
        initial_point: newPoint,
        initial_time: newTime
      };

      await api.saveRes('routes', payload, routeId);
      setRoutes(prev => prev.map(rt => rt.id === routeId ? { ...rt, ...payload } : rt));
      setEditingInitialRouteId(null);
      toast('Initial point updated successfully');
      loadRoutes(instFilter);
    } catch (err) {
      toast(err.message || 'Could not update initial point');
    }
  };

  const handleStartEditEnd = (r, endStop) => {
    setEditingEndRouteId(r.id);
    setEndForm({
      destination: endStop?.stop_name || r.destination || '',
      institution_id: r.institution_id || '',
      time: endStop?.scheduled_time ? endStop.scheduled_time.slice(0, 5) : '09:00'
    });
  };

  const handleSaveEndPoint = async (routeId, currentEndStop) => {
    const route = routes.find(rt => rt.id === routeId);
    if (!route) return;
    if (!endForm.destination?.trim()) {
      toast('End point destination is required');
      return;
    }

    try {
      const newDest = endForm.destination.trim();
      const newInstId = endForm.institution_id ? Number(endForm.institution_id) : route.institution_id;
      let newTime = endForm.time?.trim() || null;
      if (newTime && newTime.length === 5) {
        newTime = `${newTime}:00`;
      }

      // 1. Update route
      const payload = {
        ...route,
        destination: newDest,
        institution_id: newInstId
      };
      await api.saveRes('routes', payload, routeId);

      // 2. If endStop exists, update it in stops table; otherwise create it
      if (currentEndStop) {
        await api.saveRes('stops', {
          ...currentEndStop,
          stop_name: newDest,
          scheduled_time: newTime || currentEndStop.scheduled_time
        }, currentEndStop.id);
      } else {
        const stops = stopsByRoute[routeId] || [];
        await api.saveRes('stops', {
          route_id: routeId,
          stop_name: newDest,
          sequence: stops.length + 1,
          scheduled_time: newTime || '09:00:00'
        });
      }

      // Reload stops and routes
      const d = await api.listRes('stops', { route_id: routeId });
      const sorted = (d.items || []).sort((a, b) => a.sequence - b.sequence);
      setStopsByRoute(prev => ({ ...prev, [routeId]: sorted }));
      reloadStops();

      setRoutes(prev => prev.map(rt => rt.id === routeId ? { ...rt, ...payload } : rt));
      setEditingEndRouteId(null);
      toast('End point updated successfully');
      loadRoutes(instFilter);
    } catch (err) {
      toast(err.message || 'Could not update end point');
    }
  };

  const handleSaveRoute = async (data, id) => {
    await api.saveRes('routes', data, id);
    toast(id ? 'Route saved' : 'Route added');
    loadRoutes(instFilter);
  };

  const handleDelRoute = async (id) => {
    if (!confirm('Delete route and all its stops?')) return;
    await api.delRes('routes', id);
    toast('Route deleted');
    loadRoutes(instFilter);
  };

  const toggleStops = async (routeId) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
      return;
    }
    const d = await api.listRes('stops', { route_id: routeId });
    const sorted = (d.items || []).sort((a, b) => a.sequence - b.sequence);
    setStopsByRoute(prev => ({ ...prev, [routeId]: sorted }));
    setExpandedRoute(routeId);
  };

  const handleSaveStop = async (data, id) => {
    data.route_id = editingStop.route_id;
    const currentStops = stopsByRoute[editingStop.route_id] || [];
    const route = routes.find(rt => rt.id === editingStop.route_id);
    const { endStop } = getRouteStopPartition(route, currentStops);

    if (!id && endStop && Number(data.sequence) >= Number(endStop.sequence)) {
      await api.saveRes('stops', { ...endStop, sequence: Number(data.sequence) + 1 }, endStop.id);
    }

    await api.saveRes('stops', data, id);
    if (Number(data.sequence) === 1 && data.stop_name && route && route.origin !== data.stop_name) {
      try {
        await api.saveRes('routes', { ...route, origin: data.stop_name }, route.id);
        loadRoutes(instFilter);
      } catch (rErr) {
        console.warn('Could not sync route origin:', rErr);
      }
    }
    toast(id ? 'Stop saved' : 'Stop added');
    // reload stops
    const d = await api.listRes('stops', { route_id: editingStop.route_id });
    const sorted = (d.items || []).sort((a, b) => a.sequence - b.sequence);
    setStopsByRoute(prev => ({ ...prev, [editingStop.route_id]: sorted }));
    reloadStops();
  };

  const handleDelStop = async (stop) => {
    if (!confirm('Delete stop?')) return;
    await api.delRes('stops', stop.id);
    toast('Stop deleted');
    const d = await api.listRes('stops', { route_id: stop.route_id });
    const sorted = (d.items || []).sort((a, b) => a.sequence - b.sequence);
    setStopsByRoute(prev => ({ ...prev, [stop.route_id]: sorted }));
    reloadStops();
  };

  const instLabel = (id) => {
    const inst = refs.institutions?.find(i => i.id == id);
    return inst ? (inst.short_name || inst.name) : 'Unassigned';
  };

  const getMatchingStop = (routeId, term) => {
    if (!term) return null;
    const match = allStops.find(st => st.route_id === routeId && (st.stop_name || '').toLowerCase().includes(term.toLowerCase()));
    return match ? match.stop_name : null;
  };

  const SHIFT_OPTIONS = [
    { key: 'morning1', label: 'Morning 1' },
    { key: 'morning2', label: 'Morning 2' },
    { key: 'evening1', label: 'Evening 1' },
    { key: 'evening2', label: 'Evening 2' },
  ];

  const routeHasShift = (r, s) => {
    if (!s) return true;
    if (r.shift === s) return true;
    return assignments.some(a => a.route_id === r.id && a.shift === s);
  };

  const getShiftCount = (s) => {
    if (!s) return routes.length;
    return routes.filter(r => routeHasShift(r, s)).length;
  };

  const getRouteShifts = (r) => {
    const sSet = new Set();
    if (r.shift) sSet.add(r.shift);
    const rAssigns = assignments.filter(a => a.route_id === r.id);
    rAssigns.forEach(a => { if (a.shift) sSet.add(a.shift); });
    return Array.from(sSet);
  };

  const filteredRoutes = routes.filter(r => {
    if (shiftFilter && !routeHasShift(r, shiftFilter)) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchRoute = (r.route_code || '').toLowerCase().includes(term) || (r.route_name || '').toLowerCase().includes(term);
    const matchStop = allStops.some(st => st.route_id === r.id && (st.stop_name || '').toLowerCase().includes(term));
    return matchRoute || matchStop;
  });

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  const ROUTE_FIELDS = [
    { key: 'route_code', label: 'Route Code', required: true },
    { key: 'route_name', label: 'Route Name', required: true },
    { key: 'initial_point', label: 'Initial Starting Point (Bus Start Location)', placeholder: 'e.g. Periyakulam' },
    { key: 'initial_time', label: 'Initial Timing (Departure Time)', placeholder: 'e.g. 07:30:00' },
    { key: 'origin', label: 'Boarding Point (Route Origin)', required: true, placeholder: 'e.g. Vadugapatti' },
    { key: 'destination', label: 'Ending Point (Destination / Campus)', required: true, placeholder: 'e.g. NSCET CLG' },
    { key: 'total_distance', label: 'Distance (km)', type: 'number' },
    { key: 'institution_id', label: 'Institution', type: 'instref' },
    { key: 'shift', label: 'Shift', type: 'select', options: ['morning1', 'morning2', 'evening1', 'evening2'], required: true }
  ];

  const STOP_FIELDS = [
    { key: 'stop_name', label: 'Stop Name', required: true },
    { key: 'sequence', label: 'Sequence Number', type: 'number', required: true },
    { key: 'scheduled_time', label: 'Scheduled Time (HH:MM:SS)' },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' }
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Routes & Stops</div>
          <div className="page-sub">{routes.length} route(s)</div>
        </div>
        {canEdit && <button className="btn btn-sm btn-primary" onClick={() => setEditingRoute({ shift: 'morning1' })}>+ Add Route</button>}
      </div>
      <div className="page-body">
        {/* Filter by Shift pills (Identical style to institution filter in image 1) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
          padding: '10px 14px',
          background: 'var(--paper)',
          borderRadius: 8,
          border: '1px solid var(--paper-2)'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            FILTER BY SHIFT:
          </span>
          <button
            type="button"
            onClick={() => setShiftFilter('')}
            style={{
              padding: '4px 11px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: !shiftFilter ? 'var(--navy)' : 'var(--paper-2)',
              background: !shiftFilter ? 'var(--navy)' : '#fff',
              color: !shiftFilter ? '#fff' : 'var(--ink)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Shifts ({routes.length})
          </button>
          {SHIFT_OPTIONS.map(s => {
            const isSelected = shiftFilter === s.key;
            const count = getShiftCount(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setShiftFilter(isSelected ? '' : s.key)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--navy)' : 'var(--paper-2)',
                  background: isSelected ? 'var(--navy)' : '#fff',
                  color: isSelected ? '#fff' : (count > 0 ? 'var(--ink)' : 'var(--text-dim)'),
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  opacity: count === 0 ? 0.6 : 1
                }}
              >
                <span>{s.label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  background: isSelected ? 'rgba(255,255,255,0.25)' : (count > 0 ? '#fee2e2' : '#f3f4f6'),
                  color: isSelected ? '#fff' : (count > 0 ? '#b91c1c' : '#6b7280'),
                  fontWeight: 700
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => handleInstChange(e.target.value)}
              style={{ maxWidth: 240, fontWeight: 600 }}
            >
              <option value="all">All institutions</option>
              {refs.institutions.map(i => (
                <option key={i.id} value={String(i.id)}>
                  {i.short_name || i.name} {String(i.id) === String(user?.institution_id) ? '(My Campus)' : ''}
                </option>
              ))}
            </select>
          )}

          <input className="finput" type="text" placeholder="🔍 Search route code, name, or stop name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 260 }} />
        </div>

        {filteredRoutes.map(r => {
          const stops = stopsByRoute[r.id] || [];
          const isOpen = expandedRoute === r.id;
          const { boardingStops, endStop } = getRouteStopPartition(r, stops);
          return (
            <div className="card" key={r.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 600 }}>
                    {r.route_code} · {r.route_name}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {r.initial_point && (
                      <span style={{ color: '#2563eb', fontWeight: 600, marginRight: 6 }}>
                        🚌 {r.initial_point} ➔
                      </span>
                    )}
                    <b>{r.origin}</b> → <b>{r.destination}</b> · {r.total_distance || 0} km · <b style={{ color: 'var(--navy)' }}>{instLabel(r.institution_id)}</b> · {
                      getRouteShifts(r).map(sh => (
                        <span key={sh} className="tag tag--ok" style={{ padding: '2px 8px', fontSize: 11, textTransform: 'uppercase', marginRight: 4 }}>
                          {sh}
                        </span>
                      ))
                    }
                  </div>
                  {getMatchingStop(r.id, searchTerm) && (
                    <div style={{ fontSize: 12, color: 'var(--marigold)', marginTop: 6, fontWeight: 600 }}>
                      📍 Matched Stop: {getMatchingStop(r.id, searchTerm)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => toggleStops(r.id)}>
                    {isOpen ? 'Hide stops' : 'Manage stops'}
                  </button>
                  {canEdit && (
                    <>
                      <button className="icon-btn" onClick={() => setEditingRoute(r)}>✎</button>
                      <button className="icon-btn icon-btn--danger" onClick={() => handleDelRoute(r.id)}>🗑</button>
                    </>
                  )}
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--paper-2)' }}>
                  {/* 1. INITIAL POINT TABLE */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15 }}>🚌</span>
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>initial point</span>
                        <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>
                          Bus Departure Origin
                        </span>
                      </div>
                      {canEdit && editingInitialRouteId !== r.id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '2px 10px', fontSize: 11.5 }}
                          onClick={() => handleStartEditInitial(r)}
                        >
                          ✎ Edit
                        </button>
                      )}
                    </div>

                    <div className="table-wrap" style={{ margin: 0, border: '1.5px solid #dbeafe', borderRadius: 8, overflow: 'hidden' }}>
                      <table className="tbl" style={{ margin: 0 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ width: 80, fontWeight: 700, fontSize: 12, color: '#475569' }}>Seq</th>
                            <th style={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Stop Name</th>
                            <th style={{ width: 220, fontWeight: 700, fontSize: 12, color: '#475569' }}>timing</th>
                            {canEdit && <th style={{ width: 120, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#475569' }}>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {editingInitialRouteId === r.id ? (
                            <tr style={{ background: '#eff6ff' }}>
                              <td className="mono" style={{ fontWeight: 700, color: '#2563eb' }}>0</td>
                              <td>
                                <input
                                  type="text"
                                  className="finput"
                                  value={initialForm.point}
                                  onChange={e => setInitialForm(prev => ({ ...prev, point: e.target.value }))}
                                  placeholder="e.g. Periyakulam (Bus start point)"
                                  style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: '#fff' }}
                                  autoFocus
                                />
                              </td>
                              <td>
                                <input
                                  type="time"
                                  className="finput"
                                  value={initialForm.time}
                                  onChange={e => setInitialForm(prev => ({ ...prev, time: e.target.value }))}
                                  placeholder="e.g. 07:30"
                                  style={{ width: '100%', maxWidth: 150, padding: '6px 10px', fontSize: 13, background: '#fff' }}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    style={{ padding: '3px 10px', fontSize: 12 }}
                                    onClick={() => handleSaveInitialPoint(r.id)}
                                    title="Save Initial Point"
                                  >
                                    ✓ Save
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    style={{ padding: '3px 8px', fontSize: 12 }}
                                    onClick={() => setEditingInitialRouteId(null)}
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td className="mono" style={{ fontWeight: 600, color: '#64748b' }}>0</td>
                              <td>
                                {r.initial_point ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{r.initial_point}</span>
                                    <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>
                                      Bus Start Location
                                    </span>
                                  </div>
                                ) : (
                                  <span className="muted" style={{ fontStyle: 'italic', fontSize: 12.5 }}>
                                    — Not set (Bus starts at Boarding Point) —
                                  </span>
                                )}
                              </td>
                              <td className="mono" style={{ fontWeight: 600, color: r.initial_time ? '#2563eb' : '#94a3b8' }}>
                                {r.initial_time ? r.initial_time.slice(0, 5) : '—'}
                              </td>
                              {canEdit && (
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => handleStartEditInitial(r)}
                                    title="Edit Initial Point"
                                    style={{ fontSize: 13 }}
                                  >
                                    ✎
                                  </button>
                                </td>
                              )}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. BOARDING POINTS TABLE */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15 }}>🚏</span>
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>boarding points</span>
                        <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>
                          {boardingStops.length} stoppage{boardingStops.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '2px 10px', fontSize: 11.5 }}
                          onClick={() => setEditingStop({ route_id: r.id, sequence: boardingStops.length + 1 })}
                        >
                          + add stops
                        </button>
                      )}
                    </div>

                    <div className="table-wrap" style={{ margin: 0, border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                      <table className="tbl" style={{ margin: 0 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ width: 80, fontWeight: 700, fontSize: 12, color: '#475569' }}>Seq</th>
                            <th style={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Stop Name</th>
                            <th style={{ width: 220, fontWeight: 700, fontSize: 12, color: '#475569' }}>Scheduled Time</th>
                            {canEdit && <th style={{ width: 120, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#475569' }}>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {boardingStops.length ? boardingStops.map((st, idx) => (
                            <tr key={st.id} style={{ background: idx === 0 ? '#fafafa' : '#fff' }}>
                              <td className="mono" style={{ fontWeight: 600 }}>{st.sequence}</td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{st.stop_name}</span>
                                {idx === 0 && (
                                  <span style={{ marginLeft: 8, fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                    Route Starting Point
                                  </span>
                                )}
                              </td>
                              <td className="mono">{st.scheduled_time ? st.scheduled_time.slice(0, 5) : '—'}</td>
                              {canEdit && (
                                <td style={{ textAlign: 'center' }}>
                                  <div className="row-actions" style={{ justifyContent: 'center' }}>
                                    <button className="icon-btn" onClick={() => setEditingStop(st)} title="Edit stop">✎</button>
                                    <button className="icon-btn icon-btn--danger" onClick={() => handleDelStop(st)} title="Delete stop">🗑</button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={canEdit ? 4 : 3} className="muted" style={{ textAlign: 'center', padding: '16px' }}>
                                No boarding points added yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {canEdit && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '4px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          onClick={() => setEditingStop({ route_id: r.id, sequence: boardingStops.length + 1 })}
                        >
                          <span style={{ fontWeight: 700 }}>+</span> add stops
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. END POINT TABLE */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15 }}>🏫</span>
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>end point</span>
                        <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>
                          Campus Destination
                        </span>
                      </div>
                      {canEdit && editingEndRouteId !== r.id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '2px 10px', fontSize: 11.5 }}
                          onClick={() => handleStartEditEnd(r, endStop)}
                        >
                          ✎ Edit
                        </button>
                      )}
                    </div>

                    <div className="table-wrap" style={{ margin: 0, border: '1.5px solid #fed7aa', borderRadius: 8, overflow: 'hidden' }}>
                      <table className="tbl" style={{ margin: 0 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ width: 80, fontWeight: 700, fontSize: 12, color: '#475569' }}>Seq</th>
                            <th style={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Stop Name</th>
                            <th style={{ width: 220, fontWeight: 700, fontSize: 12, color: '#475569' }}>Scheduled Time</th>
                            {canEdit && <th style={{ width: 120, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#475569' }}>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {editingEndRouteId === r.id ? (
                            <tr style={{ background: '#fffbeb' }}>
                              <td className="mono" style={{ fontWeight: 700, color: '#d97706' }}>
                                {endStop?.sequence || (boardingStops.length + 1)}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <input
                                    type="text"
                                    className="finput"
                                    value={endForm.destination}
                                    onChange={e => setEndForm(prev => ({ ...prev, destination: e.target.value }))}
                                    placeholder="e.g. NSCET CLG (Campus destination)"
                                    style={{ flex: 1, minWidth: 160, padding: '6px 10px', fontSize: 13, background: '#fff' }}
                                    autoFocus
                                  />
                                  {refs.institutions?.length > 0 && (
                                    <select
                                      className="fselect"
                                      value={endForm.institution_id || ''}
                                      onChange={e => {
                                        const instId = e.target.value;
                                        const chosen = refs.institutions.find(i => String(i.id) === String(instId));
                                        setEndForm(prev => ({
                                          ...prev,
                                          institution_id: instId,
                                          destination: prev.destination || (chosen ? (chosen.short_name || chosen.name) : prev.destination)
                                        }));
                                      }}
                                      style={{ padding: '6px 10px', fontSize: 12, maxWidth: 160, background: '#fff' }}
                                      title="Select Campus / Institution"
                                    >
                                      <option value="">Choose Institution</option>
                                      {refs.institutions.map(i => (
                                        <option key={i.id} value={i.id}>{i.short_name || i.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </td>
                              <td>
                                <input
                                  type="time"
                                  className="finput"
                                  value={endForm.time}
                                  onChange={e => setEndForm(prev => ({ ...prev, time: e.target.value }))}
                                  placeholder="e.g. 09:00"
                                  style={{ width: '100%', maxWidth: 150, padding: '6px 10px', fontSize: 13, background: '#fff' }}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    style={{ padding: '3px 10px', fontSize: 12 }}
                                    onClick={() => handleSaveEndPoint(r.id, endStop)}
                                    title="Save End Point"
                                  >
                                    ✓ Save
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    style={{ padding: '3px 8px', fontSize: 12 }}
                                    onClick={() => setEditingEndRouteId(null)}
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td className="mono" style={{ fontWeight: 600, color: '#64748b' }}>
                                {endStop?.sequence || (boardingStops.length + 1)}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                                    {endStop?.stop_name || r.destination || '—'}
                                  </span>
                                  <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>
                                    {instLabel(r.institution_id)}
                                  </span>
                                </div>
                              </td>
                              <td className="mono" style={{ fontWeight: 600, color: '#b45309' }}>
                                {endStop?.scheduled_time ? endStop.scheduled_time.slice(0, 5) : (r.shift?.includes('morning') ? '09:00' : '—')}
                              </td>
                              {canEdit && (
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => handleStartEditEnd(r, endStop)}
                                    title="Edit End Point"
                                    style={{ fontSize: 13 }}
                                  >
                                    ✎
                                  </button>
                                </td>
                              )}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🛣️</div>
            <p>No routes found.</p>
          </div>
        )}
      </div>

      {editingRoute !== null && (
        <FormModal title="Route" fields={ROUTE_FIELDS} initial={editingRoute} onSave={handleSaveRoute} onClose={() => setEditingRoute(null)} refs={refs} />
      )}
      {editingStop !== null && (
        <FormModal title="Stop" fields={STOP_FIELDS} initial={editingStop} onSave={handleSaveStop} onClose={() => setEditingStop(null)} />
      )}
    </>
  );
}
