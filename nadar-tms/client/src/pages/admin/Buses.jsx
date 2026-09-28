import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

function BusIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    tools: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    route: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/></>,
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
      {icons[name] || icons.bus}
    </svg>
  );
}

function checkFcStatus(dateStr) {
  if (!dateStr) return { status: 'none', label: '—' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { status: 'none', label: '—' };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'expired', label: `Expired (${Math.abs(diffDays)}d ago)`, isAlert: true };
    if (diffDays <= 60) return { status: 'due', label: `Due in ${diffDays}d`, isWarn: true };
    return { status: 'valid', label: 'Valid' };
  } catch {
    return { status: 'none', label: '—' };
  }
}

const COLUMNS = [
  { key: 'registration_number', label: 'Reg. Number', mono: true },
  { key: 'assigned_route_code', label: 'Assigned Route', mono: true },
  { key: 'bus_model', label: 'Model' },
  { key: 'capacity', label: 'Seats', mono: true },
  { key: 'status', label: 'Status', tag: true },
  { key: 'fc_expiry', label: 'FC Expiry', date: true },
  { key: 'insurance_expiry', label: 'Insurance Expiry', date: true },
];

const FIELDS = [
  { key: 'registration_number', label: 'Registration Number', required: true },
  { key: 'bus_model', label: 'Bus Model' },
  { key: 'capacity', label: 'Capacity (seats)', type: 'number', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'repair'] },
  { key: 'route_id', label: 'Route', type: 'route' },
  { key: 'institution_id', label: 'Institution', type: 'instref' },
  { key: 'bus_code', label: 'Bus Code' },
  { key: 'bus_name', label: 'Bus Name' },
  { key: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['bus', 'mini_bus', 'van'] },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'manufacturing_year', label: 'Year of Manufacture', type: 'number' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['diesel', 'petrol', 'cng', 'electric'] },
  { key: 'chassis_no', label: 'Chassis No.' },
  { key: 'engine_no', label: 'Engine No.' },
  { key: 'insurance_no', label: 'Insurance No.' },
  { key: 'insurance_company', label: 'Insurance Company' },
  { key: 'insurance_expiry', label: 'Insurance Expiry', type: 'date' },
  { key: 'permit_no', label: 'Permit No.' },
  { key: 'permit_type', label: 'Permit Type' },
  { key: 'permit_expiry', label: 'Permit Expiry', type: 'date' },
  { key: 'fc_number', label: 'FC Number' },
  { key: 'fc_expiry', label: 'FC Expiry', type: 'date' },
  { key: 'puc_expiry', label: 'PUC Expiry', type: 'date' },
  { key: 'gps_device_id', label: 'GPS Device ID' },
  { key: 'gps_enabled', label: 'GPS Enabled', type: 'bool' },
  { key: 'current_odometer_km', label: 'Odometer (km)', type: 'number' },
  { key: 'ownership_type', label: 'Ownership', type: 'select', options: ['owned', 'leased', 'contract'] },
];

export default function Buses() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const load = (inst) => {
    setLoading(true);
    const filter = (inst && inst !== 'all') ? { institution_id: inst } : { institution_id: 'all' };
    api.listRes('buses', filter).then(d => {
      setItems(d.items || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'all';
    setInstFilter(initialInst);
    load(initialInst);
  }, []);

  const handleInstChange = (v) => { setInstFilter(v); load(v); };

  const handleSave = async (data, id) => {
    const cleanData = { ...data };
    ['fc_expiry', 'insurance_expiry', 'permit_expiry', 'puc_expiry', 'purchase_date'].forEach(k => {
      if (k in cleanData) {
        const v = cleanData[k];
        if (!v) cleanData[k] = null;
        else if (typeof v === 'string') {
          const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
          cleanData[k] = m ? m[1] : null;
        }
      }
    });
    await api.saveRes('buses', cleanData, id);
    toast(id ? 'Saved' : 'Added');
    load(instFilter);
  };

  const handleDel = async (item) => { 
    if (!confirm('Delete this bus?')) return; 
    await api.delRes('buses', item.id); 
    toast('Deleted'); 
    load(instFilter); 
  };

  // KPIs
  const stats = useMemo(() => {
    const total = items.length;
    let active = 0;
    let inRepair = 0;
    let assigned = 0;
    let fcDue = 0;

    items.forEach(b => {
      const st = (b.status || '').toLowerCase();
      if (st === 'active') active++;
      if (st === 'repair' || st === 'inactive') inRepair++;
      if (b.assigned_route_code || b.route_id) assigned++;
      const fc = checkFcStatus(b.fc_expiry);
      if (fc.isAlert || fc.isWarn) fcDue++;
    });

    return { total, active, inRepair, assigned, fcDue };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const st = (item.status || '').toLowerCase();
      if (statusFilter === 'active' && st !== 'active') return false;
      if (statusFilter === 'repair' && st !== 'repair') return false;
      if (statusFilter === 'inactive' && st !== 'inactive') return false;
      if (statusFilter === 'assigned' && !item.assigned_route_code && !item.route_id) return false;
      if (statusFilter === 'unassigned' && (item.assigned_route_code || item.route_id)) return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (item.registration_number || '').toLowerCase().includes(query) ||
        (item.assigned_route_code || '').toLowerCase().includes(query) ||
        (item.assigned_route_name || '').toLowerCase().includes(query) ||
        (item.bus_model || '').toLowerCase().includes(query) ||
        (item.bus_name || '').toLowerCase().includes(query) ||
        (item.bus_code || '').toLowerCase().includes(query) ||
        (item.institution_name || '').toLowerCase().includes(query)
      );
    });
  }, [items, statusFilter, searchQuery]);

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Fleet & Buses</div>
          <div className="page-sub">Vehicle asset registry, compliance tracking, and route assignments</div>
        </div>
        {canEdit && (
          <button 
            className="btn btn-sm btn-primary" 
            onClick={() => setEditing({ status: 'active', vehicle_type: 'bus', fuel_type: 'diesel' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <BusIcon name="plus" size={15} color="#fff" /> Add Bus
          </button>
        )}
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon */}
        <div className="att-kpi-ribbon">
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <BusIcon name="bus" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{stats.total}</div>
              <div className="att-kpi-label">Total Fleet</div>
              <div className="att-kpi-sub">Registered vehicles</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <BusIcon name="check" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{stats.active}</div>
              <div className="att-kpi-label">Active & Ready</div>
              <div className="att-kpi-sub">{stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% available` : '—'}</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--blue">
              <BusIcon name="route" size={22} color="#3b82f6" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#3b82f6' }}>{stats.assigned}</div>
              <div className="att-kpi-label">Assigned Routes</div>
              <div className="att-kpi-sub">{stats.total - stats.assigned} standby / spare</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.inRepair > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--amber">
              <BusIcon name="tools" size={22} color="#f59e0b" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.inRepair > 0 ? '#d97706' : '#64748b' }}>
                {stats.inRepair}
              </div>
              <div className="att-kpi-label">In Maintenance</div>
              <div className="att-kpi-sub">{stats.inRepair > 0 ? 'Under repair/inactive' : 'Fleet operational'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.fcDue > 0 ? 'att-kpi-card--alert' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--red">
              <BusIcon name="shield" size={22} color="#ef4444" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.fcDue > 0 ? '#ef4444' : '#64748b' }}>
                {stats.fcDue}
              </div>
              <div className="att-kpi-label">FC / Compliance Due</div>
              <div className="att-kpi-sub">{stats.fcDue > 0 ? 'Attention required' : 'All certificates valid'}</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <BusIcon name="search" size={15} color="#94a3b8" />
            </span>
            <input
              type="text"
              className="fselect"
              placeholder="Search registration, route, model..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, height: 38 }}
            />
          </div>

          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => handleInstChange(e.target.value)}
              style={{ maxWidth: 280, fontWeight: 600, height: 38 }}
            >
              <option value="all">All Fleet Buses</option>
              {refs.institutions.map(i => (
                <option key={i.id} value={String(i.id)}>
                  {i.short_name || i.name} {String(i.id) === String(user?.institution_id) ? '(My Campus)' : ''}
                </option>
              ))}
            </select>
          )}

          <select
            className="fselect"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: 200, fontWeight: 600, height: 38 }}
          >
            <option value="all">All Status ({items.length})</option>
            <option value="active">Active Only ({stats.active})</option>
            <option value="repair">In Repair ({items.filter(b => (b.status || '').toLowerCase() === 'repair').length})</option>
            <option value="inactive">Inactive ({items.filter(b => (b.status || '').toLowerCase() === 'inactive').length})</option>
            <option value="assigned">Assigned ({stats.assigned})</option>
            <option value="unassigned">Unassigned ({stats.total - stats.assigned})</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredItems.length}</b> of {items.length} buses
            </span>
          </div>
        </div>

        <DataTable 
          columns={COLUMNS} 
          data={filteredItems} 
          onEdit={canEdit ? setEditing : undefined} 
          onDelete={canEdit ? handleDel : undefined} 
          emptyIcon="🚌" 
          emptyText="No buses found matching your criteria." 
        />
      </div>

      {editing !== null && (
        <FormModal 
          title="Bus" 
          fields={FIELDS} 
          initial={editing} 
          onSave={handleSave} 
          onClose={() => setEditing(null)} 
          refs={refs} 
        />
      )}
    </>
  );
}

