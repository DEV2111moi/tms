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
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const loadRoutes = (inst) => {
    const filter = inst ? { institution_id: inst } : undefined;
    api.listRes('routes', filter).then(d => {
      setRoutes(d.items || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
    loadRoutes(user?.role === 'institution' ? user.institution_id : '');
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
  };

  const handleDelStop = async (stop) => {
    if (!confirm('Delete stop?')) return;
    await api.delRes('stops', stop.id);
    toast('Stop deleted');
    const d = await api.listRes('stops', { route_id: stop.route_id });
    const sorted = (d.items || []).sort((a, b) => a.sequence - b.sequence);
    setStopsByRoute(prev => ({ ...prev, [stop.route_id]: sorted }));
  };

  const instLabel = (id) => {
    const inst = refs.institutions?.find(i => i.id == id);
    return inst ? (inst.short_name || inst.name) : 'Unassigned';
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  const ROUTE_FIELDS = [
    { key: 'route_code', label: 'Route Code', required: true },
    { key: 'route_name', label: 'Route Name', required: true },
    { key: 'origin', label: 'Origin', required: true },
    { key: 'destination', label: 'Destination', required: true },
    { key: 'total_distance', label: 'Distance (km)', type: 'number' },
    { key: 'institution_id', label: 'Institution', type: 'instref' }
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
        {canEdit && <button className="btn btn-sm btn-primary" onClick={() => setEditingRoute({})}>+ Add Route</button>}
      </div>
      <div className="page-body">
        {(refs.institutions?.length > 0 && user?.role !== 'institution') && (
          <select className="fselect" value={instFilter} onChange={e => handleInstChange(e.target.value)} style={{ maxWidth: 280, marginBottom: 20 }}>
            <option value="">All institutions</option>
            {refs.institutions.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
          </select>
        )}

        {routes.map(r => {
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
                    {r.origin} → {r.destination} · {r.total_distance || 0} km · <b style={{ color: 'var(--navy)' }}>{instLabel(r.institution_id)}</b>
                  </div>
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

        {routes.length === 0 && (
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
