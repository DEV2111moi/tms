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
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

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
    await api.saveRes('stops', data, id);
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
    { key: 'origin', label: 'Origin', required: true },
    { key: 'destination', label: 'Destination', required: true },
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
          return (
            <div className="card" key={r.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 600 }}>
                    {r.route_code} · {r.route_name}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {r.origin} → {r.destination} · {r.total_distance || 0} km · <b style={{ color: 'var(--navy)' }}>{instLabel(r.institution_id)}</b> · {
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
                  <div className="table-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Seq</th>
                          <th>Stop Name</th>
                          <th>Scheduled Time</th>
                          {canEdit && <th></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {stops.length ? stops.map(st => (
                          <tr key={st.id}>
                            <td className="mono" style={{ fontWeight: 600 }}>{st.sequence}</td>
                            <td>{st.stop_name}</td>
                            <td className="mono">{st.scheduled_time ? st.scheduled_time.slice(0, 5) : '—'}</td>
                            {canEdit && (
                              <td>
                                <div className="row-actions">
                                  <button className="icon-btn" onClick={() => setEditingStop(st)}>✎</button>
                                  <button className="icon-btn icon-btn--danger" onClick={() => handleDelStop(st)}>🗑</button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )) : (
                          <tr><td colSpan={canEdit ? 4 : 3} className="muted" style={{ textAlign: 'center' }}>No stops added to this route yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {canEdit && (
                    <button className="btn btn-sm btn-outline" style={{ marginTop: 12 }}
                      onClick={() => setEditingStop({ route_id: r.id, sequence: stops.length + 1 })}>
                      + Add Stop
                    </button>
                  )}
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
