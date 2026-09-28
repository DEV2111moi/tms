import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

function RouteIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    route: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {icons[name] || icons.route}
    </svg>
  );
}

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
    { key: 'morning3', label: 'Morning 3' },
    { key: 'morning4', label: 'Morning 4' },
    { key: 'evening1', label: 'Evening 1' },
    { key: 'evening2', label: 'Evening 2' },
    { key: 'evening3', label: 'Evening 3' },
    { key: 'evening4', label: 'Evening 4' },
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

  // KPI calculations (must be unconditionally before if (loading) return)
  const stats = useMemo(() => {
    const totalRoutes = routes.length;
    const totalStops = allStops.length;
    const morningCount = routes.filter(r => (r.shift || '').toLowerCase().includes('morning')).length;
    const eveningCount = routes.filter(r => (r.shift || '').toLowerCase().includes('evening')).length;
    const totalKm = routes.reduce((sum, r) => sum + (Number(r.total_distance) || 0), 0);
    return {
      totalRoutes,
      totalStops,
      morningCount,
      eveningCount,
      totalKm: totalKm.toFixed(1)
    };
  }, [routes, allStops]);

  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      if (shiftFilter && !routeHasShift(r, shiftFilter)) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchRoute = (r.route_code || '').toLowerCase().includes(term) || (r.route_name || '').toLowerCase().includes(term);
      const matchStop = allStops.some(st => st.route_id === r.id && (st.stop_name || '').toLowerCase().includes(term));
      return matchRoute || matchStop;
    });
  }, [routes, shiftFilter, assignments, searchTerm, allStops]);

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
    { key: 'shift', label: 'Shift', type: 'select', options: ['morning1', 'morning2', 'morning3', 'morning4', 'evening1', 'evening2', 'evening3', 'evening4'], required: true }
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
          <div className="page-title">Routes & Stoppages</div>
          <div className="page-sub">Campus transit corridors, pick-up points, timings, and waypoints</div>
        </div>
        {canEdit && (
          <button 
            className="btn btn-sm btn-primary" 
            onClick={() => setEditingRoute({ shift: 'morning1' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <RouteIcon name="plus" size={15} color="#fff" /> Add Route
          </button>
        )}
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon */}
        <div className="att-kpi-ribbon">
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <RouteIcon name="route" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{stats.totalRoutes}</div>
              <div className="att-kpi-label">Total Routes</div>
              <div className="att-kpi-sub">Active transit corridors</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--blue">
              <RouteIcon name="mapPin" size={22} color="#3b82f6" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#3b82f6' }}>{stats.totalStops}</div>
              <div className="att-kpi-label">Total Stoppages</div>
              <div className="att-kpi-sub">Boarding & drop points</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--amber">
              <RouteIcon name="sun" size={22} color="#f59e0b" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#d97706' }}>{stats.morningCount}</div>
              <div className="att-kpi-label">Morning Shifts</div>
              <div className="att-kpi-sub">Inbound student routes</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <RouteIcon name="moon" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{stats.eveningCount}</div>
              <div className="att-kpi-label">Evening Shifts</div>
              <div className="att-kpi-sub">Outbound return trips</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <RouteIcon name="compass" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{stats.totalKm} <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>km</span></div>
              <div className="att-kpi-label">Fleet Coverage</div>
              <div className="att-kpi-sub">Total one-way distance</div>
            </div>
          </div>
        </div>

        {/* Filter by Shift pills */}
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
            Filter by Shift:
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

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => handleInstChange(e.target.value)}
              style={{ maxWidth: 240, fontWeight: 600, height: 38 }}
            >
              <option value="all">All Institutions</option>
              {refs.institutions.map(i => (
                <option key={i.id} value={String(i.id)}>
                  {i.short_name || i.name} {String(i.id) === String(user?.institution_id) ? '(My Campus)' : ''}
                </option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <RouteIcon name="search" size={15} color="#94a3b8" />
            </span>
            <input 
              className="finput" 
              type="text" 
              placeholder="Search route code, name, or stop name..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ width: '100%', paddingLeft: 34, height: 38 }} 
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredRoutes.length}</b> of {routes.length} routes
            </span>
          </div>
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
                        <RouteIcon name="bus" size={13} color="#2563eb" style={{ marginRight: 3 }} /> {r.initial_point} ➔
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
                    <div style={{ fontSize: 12, color: 'var(--marigold)', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RouteIcon name="mapPin" size={13} color="var(--marigold)" /> Matched Stop: {getMatchingStop(r.id, searchTerm)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => toggleStops(r.id)}>
                    {isOpen ? 'Hide stops' : 'Manage stops'}
                  </button>
                  {canEdit && (
                    <>
                      <button className="icon-btn" onClick={() => setEditingRoute(r)} title="Edit Route">
                        <RouteIcon name="edit" size={14} color="#64748b" />
                      </button>
                      <button className="icon-btn icon-btn--danger" onClick={() => handleDelRoute(r.id)} title="Delete Route">
                        <RouteIcon name="trash" size={14} color="#ef4444" />
                      </button>
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
                        <RouteIcon name="bus" size={15} color="#2563eb" />
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>initial point</span>
                        <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>
                          Bus Departure Origin
                        </span>
                      </div>
                      {canEdit && editingInitialRouteId !== r.id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '2px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => handleStartEditInitial(r)}
                        >
                          <RouteIcon name="edit" size={12} color="currentColor" /> Edit
                        </button>
                      )}
                    </div>

                    <div className="table-wrap" style={{ margin: 0, border: '1.5px solid #dbeafe', borderRadius: 8, overflow: 'hidden' }}>
                      <table className="tbl" style={{ margin: 0 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ width: 80, fontWeight: 700, fontSize: 12, color: '#475569' }}>Seq</th>
                            <th style={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Stop Name</th>
                            <th style={{ width: 220, fontWeight: 700, fontSize: 12, color: '#475569' }}>Timing</th>
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
                                    style={{ padding: '3px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => handleSaveInitialPoint(r.id)}
                                    title="Save Initial Point"
                                  >
                                    <RouteIcon name="check" size={13} color="#fff" /> Save
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    style={{ padding: '3px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center' }}
                                    onClick={() => setEditingInitialRouteId(null)}
                                    title="Cancel"
                                  >
                                    <RouteIcon name="close" size={13} color="currentColor" />
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
                                  >
                                    <RouteIcon name="edit" size={14} color="#64748b" />
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
                        <RouteIcon name="mapPin" size={15} color="#16a34a" />
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>boarding points</span>
                        <span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>
                          {boardingStops.length} stoppage{boardingStops.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '2px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setEditingStop({ route_id: r.id, sequence: boardingStops.length + 1 })}
                        >
                          <RouteIcon name="plus" size={12} color="currentColor" /> Add Stops
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
                                    <button className="icon-btn" onClick={() => setEditingStop(st)} title="Edit stop">
                                      <RouteIcon name="edit" size={14} color="#64748b" />
                                    </button>
                                    <button className="icon-btn icon-btn--danger" onClick={() => handleDelStop(st)} title="Delete stop">
                                      <RouteIcon name="trash" size={14} color="#ef4444" />
                                    </button>
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
                          <RouteIcon name="plus" size={13} color="currentColor" /> Add Stops
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. END POINT TABLE */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RouteIcon name="building" size={15} color="#b45309" />
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>end point</span>
                        <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>
                          Campus Destination
                        </span>
                      </div>
                      {canEdit && editingEndRouteId !== r.id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: '2px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => handleStartEditEnd(r, endStop)}
                        >
                          <RouteIcon name="edit" size={12} color="currentColor" /> Edit
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
                                    style={{ padding: '3px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => handleSaveEndPoint(r.id, endStop)}
                                    title="Save End Point"
                                  >
                                    <RouteIcon name="check" size={13} color="#fff" /> Save
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    style={{ padding: '3px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center' }}
                                    onClick={() => setEditingEndRouteId(null)}
                                    title="Cancel"
                                  >
                                    <RouteIcon name="close" size={13} color="currentColor" />
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
                                  >
                                    <RouteIcon name="edit" size={14} color="#64748b" />
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
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <RouteIcon name="route" size={48} color="#94a3b8" />
            </div>
            <p>No routes found matching your filter criteria.</p>
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

