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
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    gauge: <><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    satellite: <><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4"/><path d="m16 8-4-4"/><circle cx="12" cy="12" r="2"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1920) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function checkComplianceStatus(dateStr) {
  if (!dateStr) return { status: 'none', label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1920) return { status: 'none', label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { status: 'expired', label: `Expired (${Math.abs(diffDays)}d ago)`, isAlert: true, color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
    }
    if (diffDays <= 60) {
      return { status: 'due', label: `Due in ${diffDays}d`, isWarn: true, color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
    }
    return { status: 'valid', label: 'Valid', isValid: true, color: '#16a34a', bg: '#dcfce7', border: '#86efac' };
  } catch {
    return { status: 'none', label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  }
}

const FIELDS = [
  { key: 'registration_number', label: 'Registration Number', required: true },
  { key: 'bus_code', label: 'Bus Code (e.g. 054, 301)' },
  { key: 'bus_name', label: 'Bus Name / Fleet Label' },
  { key: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['bus', 'mini_bus', 'van'] },
  { key: 'manufacturer', label: 'Manufacturer (e.g. ASHOK LEYLAND, MAHINDRA)' },
  { key: 'bus_model', label: 'Bus Model (e.g. SEMI SALOON, SALOON)' },
  { key: 'manufacturing_year', label: 'Year of Manufacture', type: 'number' },
  { key: 'capacity', label: 'Seating Capacity (seats)', type: 'number', required: true },
  { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['diesel', 'petrol', 'cng', 'electric'] },
  { key: 'ownership_type', label: 'Ownership Type', type: 'select', options: ['owned', 'leased', 'contract'] },
  { key: 'status', label: 'Operational Status', type: 'select', options: ['active', 'inactive', 'repair'] },
  { key: 'institution_id', label: 'Institution / Campus', type: 'instref' },
  { key: 'current_odometer_km', label: 'Current Odometer (km)', type: 'number' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'chassis_no', label: 'Chassis Number' },
  { key: 'engine_no', label: 'Engine Number' },
  { key: 'fc_number', label: 'FC (Fitness) Number' },
  { key: 'fc_expiry', label: 'FC Expiry Date', type: 'date' },
  { key: 'insurance_company', label: 'Insurance Provider' },
  { key: 'insurance_no', label: 'Insurance Policy Number' },
  { key: 'insurance_expiry', label: 'Insurance Expiry Date', type: 'date' },
  { key: 'permit_no', label: 'Permit Number' },
  { key: 'permit_type', label: 'Permit Type' },
  { key: 'permit_expiry', label: 'Permit Expiry Date', type: 'date' },
  { key: 'pollution_certificate_no', label: 'Pollution (PUC) Cert No.' },
  { key: 'puc_expiry', label: 'PUC Expiry Date', type: 'date' },
  { key: 'gps_device_id', label: 'GPS Device ID' },
  { key: 'gps_enabled', label: 'GPS Tracking Active', type: 'bool' },
];

export default function Buses() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
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
    toast(id ? 'Bus profile updated' : 'Bus registered successfully');
    load(instFilter);
  };

  const handleDel = async (item) => { 
    if (!confirm(`Are you sure you want to delete bus ${item.registration_number}?`)) return; 
    await api.delRes('buses', item.id); 
    toast('Bus record deleted'); 
    load(instFilter); 
  };

  // KPIs without Assigned Route
  const stats = useMemo(() => {
    const total = items.length;
    let active = 0;
    let inRepair = 0;
    let fcDue = 0;
    let insDue = 0;

    items.forEach(b => {
      const st = (b.status || '').toLowerCase();
      if (st === 'active') active++;
      if (st === 'repair' || st === 'inactive') inRepair++;
      const fc = checkComplianceStatus(b.fc_expiry);
      if (fc.isAlert || fc.isWarn) fcDue++;
      const ins = checkComplianceStatus(b.insurance_expiry);
      if (ins.isAlert || ins.isWarn) insDue++;
    });

    return { total, active, inRepair, fcDue, insDue };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const st = (item.status || '').toLowerCase();
      const fc = checkComplianceStatus(item.fc_expiry);
      const ins = checkComplianceStatus(item.insurance_expiry);
      const vtype = (item.vehicle_type || '').toLowerCase();

      if (statusFilter === 'active' && st !== 'active') return false;
      if (statusFilter === 'repair' && st !== 'repair') return false;
      if (statusFilter === 'inactive' && st !== 'inactive') return false;
      if (statusFilter === 'fc_due' && !fc.isAlert && !fc.isWarn) return false;
      if (statusFilter === 'ins_due' && !ins.isAlert && !ins.isWarn) return false;
      if (statusFilter === 'mini_bus' && vtype !== 'mini_bus') return false;
      if (statusFilter === 'bus' && vtype !== 'bus') return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (item.registration_number || '').toLowerCase().includes(query) ||
        (item.bus_code || '').toLowerCase().includes(query) ||
        (item.bus_name || '').toLowerCase().includes(query) ||
        (item.manufacturer || '').toLowerCase().includes(query) ||
        (item.bus_model || '').toLowerCase().includes(query) ||
        (item.chassis_no || '').toLowerCase().includes(query) ||
        (item.engine_no || '').toLowerCase().includes(query) ||
        (item.insurance_company || '').toLowerCase().includes(query) ||
        (item.permit_no || '').toLowerCase().includes(query) ||
        (item.institution_name || '').toLowerCase().includes(query)
      );
    });
  }, [items, statusFilter, searchQuery]);

  // Table Columns with comprehensive database details — NO Assigned Route
  const COLUMNS = useMemo(() => [
    {
      key: 'registration_number',
      label: 'Vehicle & Reg. Plate',
      render: (val, item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.6px',
                color: '#1e293b',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                padding: '2px 8px',
                borderRadius: 5,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {val}
            </span>
            {item.bus_code && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: '#f5f3ff',
                  color: '#7c6cfc',
                  border: '1px solid #ddd6fe',
                  padding: '1px 6px',
                  borderRadius: 4
                }}
              >
                #{item.bus_code}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#f1f5f9',
                color: '#475569',
                padding: '1px 5px',
                borderRadius: 3
              }}
            >
              {item.vehicle_type ? item.vehicle_type.replace('_', ' ') : 'BUS'}
            </span>
            {item.ownership_type && (
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>
                • {item.ownership_type}
              </span>
            )}
            {item.bus_name && (
              <span style={{ fontSize: 10, color: '#7c6cfc', fontWeight: 600 }}>
                • {item.bus_name}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'manufacturer',
      label: 'Make, Model & Year',
      render: (_, item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 12.5 }}>
            {item.manufacturer || item.bus_model || '—'}
          </span>
          <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#64748b' }}>
            {item.bus_model && <span>{item.bus_model}</span>}
            {item.manufacturing_year && <span>({item.manufacturing_year})</span>}
          </div>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Seats & Specs',
      render: (val, item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace' }}>
            {val ? `${val} Seats` : '—'}
          </span>
          <div style={{ display: 'flex', gap: 6, fontSize: 10.5, color: '#64748b', textTransform: 'capitalize' }}>
            {item.fuel_type && <span>⛽ {item.fuel_type}</span>}
            {item.current_odometer_km ? <span>• {Number(item.current_odometer_km).toLocaleString('en-IN')} km</span> : null}
          </div>
        </div>
      )
    },
    {
      key: 'fc_expiry',
      label: 'Fitness (FC)',
      render: (val, item) => {
        const fc = checkComplianceStatus(val);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
              {formatDate(val)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: fc.bg,
                  color: fc.color,
                  border: `1px solid ${fc.border}`
                }}
              >
                {fc.label}
              </span>
              {item.fc_number && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9.5,
                    color: '#64748b',
                    maxWidth: 110,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.fc_number}
                >
                  #{item.fc_number}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'insurance_expiry',
      label: 'Insurance Policy',
      render: (val, item) => {
        const ins = checkComplianceStatus(val);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
              {formatDate(val)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: ins.bg,
                  color: ins.color,
                  border: `1px solid ${ins.border}`
                }}
              >
                {item.insurance_company || ins.label}
              </span>
              {item.insurance_no && (
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9.5,
                    color: '#64748b',
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.insurance_no}
                >
                  Pol: {item.insurance_no}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'permit_expiry',
      label: 'Permit & PUC',
      render: (_, item) => {
        const permitStatus = checkComplianceStatus(item.permit_expiry);
        const pucStatus = checkComplianceStatus(item.puc_expiry);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Permit:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: permitStatus.color, fontWeight: 700 }}>
                {formatDate(item.permit_expiry)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>PUC:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: pucStatus.color, fontWeight: 700 }}>
                {formatDate(item.puc_expiry)}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const st = (val || 'active').toLowerCase();
        const isOk = st === 'active';
        const isRepair = st === 'repair';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              background: isOk ? '#dcfce7' : isRepair ? '#fef3c7' : '#fee2e2',
              color: isOk ? '#15803d' : isRepair ? '#b45309' : '#b91c1c',
              border: `1px solid ${isOk ? '#86efac' : isRepair ? '#fde68a' : '#fca5a5'}`
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            {val || 'active'}
          </span>
        );
      }
    },
    {
      key: 'specs_btn',
      label: 'Details',
      render: (_, item) => {
        const isExp = expandedId === item.id;
        return (
          <button
            type="button"
            className="btn btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId(prev => (prev === item.id ? null : item.id));
            }}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: isExp ? '#7c6cfc' : '#f5f3ff',
              color: isExp ? '#ffffff' : '#7c6cfc',
              border: '1px solid #ddd6fe',
              borderRadius: 5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
            title="Toggle full vehicle database details"
          >
            <BusIcon name="info" size={13} color={isExp ? '#fff' : '#7c6cfc'} />
            {isExp ? 'Close' : 'Specs ▾'}
          </button>
        );
      }
    }
  ], [expandedId]);

  // Expandable Technical Dossier Sub-Row rendering full database details
  const renderSubRow = (item) => {
    if (expandedId !== item.id) return null;
    const totalCols = COLUMNS.length + 2;

    return (
      <tr
        key={`sub-${item.id}`}
        style={{
          background: 'linear-gradient(180deg, #fbfbfe 0%, #f8fafc 100%)',
          borderLeft: '4px solid #7c6cfc',
          borderBottom: '2px solid #e2e8f0'
        }}
      >
        <td colSpan={totalCols} style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                  🚌 Vehicle Technical Dossier: {item.registration_number}
                </span>
                {item.bus_code && (
                  <span style={{ fontSize: 12, fontWeight: 700, background: '#7c6cfc', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                    Bus Code #{item.bus_code}
                  </span>
                )}
                {item.institution_name && (
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    • Campus: <b style={{ color: '#0f172a' }}>{item.institution_name}</b>
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setExpandedId(null)}
                style={{ padding: '2px 8px', fontSize: 11 }}
              >
                ✕ Close
              </button>
            </div>

            {/* Grid of full database fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {/* Card 1: Engine & Chassis */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7c6cfc', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  ⚙️ Mechanical & Identity
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Chassis No:</span> <b className="mono">{item.chassis_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Engine No:</span> <b className="mono">{item.engine_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Fuel Type:</span> <b style={{ textTransform: 'capitalize' }}>{item.fuel_type || 'Diesel'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Mfg Year:</span> <b>{item.manufacturing_year || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Purchase Date:</span> <b>{formatDate(item.purchase_date)}</b></div>
                </div>
              </div>

              {/* Card 2: Fitness (FC) & Pollution (PUC) */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  🛡️ FC & Environmental Compliance
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>FC Number:</span> <b className="mono">{item.fc_number || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>FC Expiry:</span> <b className="mono">{formatDate(item.fc_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>PUC Cert No:</span> <b className="mono">{item.pollution_certificate_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>PUC Expiry:</span> <b className="mono">{formatDate(item.puc_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>RC Book File:</span> <b>{item.rc_book_file || 'Attached in Office'}</b></div>
                </div>
              </div>

              {/* Card 3: Insurance & Permit */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  📜 Insurance & Permit Records
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Ins Company:</span> <b>{item.insurance_company || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Policy No:</span> <b className="mono">{item.insurance_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Policy Expiry:</span> <b className="mono">{formatDate(item.insurance_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Permit No:</span> <b className="mono">{item.permit_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Permit Expiry:</span> <b className="mono">{formatDate(item.permit_expiry)}</b></div>
                </div>
              </div>

              {/* Card 4: GPS Tracking & Meter */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  📡 Telematics & Telemetry
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>GPS Enabled:</span> <b>{item.gps_enabled ? '✅ Active Live Tracking' : '❌ Inactive / Not Fitted'}</b></div>
                  <div><span style={{ color: '#64748b' }}>GPS Device ID:</span> <b className="mono">{item.gps_device_id || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Odometer Run:</span> <b>{item.current_odometer_km ? `${Number(item.current_odometer_km).toLocaleString('en-IN')} KM` : '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Seating Capacity:</span> <b>{item.capacity || '—'} Passengers</b></div>
                  <div><span style={{ color: '#64748b' }}>Ownership:</span> <b style={{ textTransform: 'capitalize' }}>{item.ownership_type || 'Owned'}</b></div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading fleet database...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Fleet & Buses</div>
          <div className="page-sub">Asset registry, technical specifications, and compliance monitoring</div>
        </div>
        {canEdit && (
          <button 
            className="btn btn-sm btn-primary" 
            onClick={() => setEditing({ status: 'active', vehicle_type: 'bus', fuel_type: 'diesel', ownership_type: 'owned' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <BusIcon name="plus" size={15} color="#fff" /> Add Bus
          </button>
        )}
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon — Focused on Fleet Readiness and Compliance, without Assigned Route */}
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
              <div className="att-kpi-sub">{stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% operational` : '—'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.insDue > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--blue">
              <BusIcon name="file" size={22} color="#3b82f6" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.insDue > 0 ? '#d97706' : '#3b82f6' }}>{stats.insDue}</div>
              <div className="att-kpi-label">Insurance Due / Alert</div>
              <div className="att-kpi-sub">{stats.insDue > 0 ? 'Action required within 60d' : 'Policies active'}</div>
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
              <div className="att-kpi-label">FC / Fitness Due</div>
              <div className="att-kpi-sub">{stats.fcDue > 0 ? 'Renewal required' : 'All certificates valid'}</div>
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
              placeholder="Search reg plate, model, make, chassis..."
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
            style={{ maxWidth: 220, fontWeight: 600, height: 38 }}
          >
            <option value="all">All Status ({items.length})</option>
            <option value="active">Active Only ({stats.active})</option>
            <option value="fc_due">FC Due / Alert ({stats.fcDue})</option>
            <option value="ins_due">Insurance Due ({stats.insDue})</option>
            <option value="repair">In Repair ({items.filter(b => (b.status || '').toLowerCase() === 'repair').length})</option>
            <option value="mini_bus">Mini Buses Only</option>
            <option value="bus">Standard Buses Only</option>
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
          renderSubRow={renderSubRow}
          emptyIcon="🚌" 
          emptyText="No buses found matching your criteria." 
        />
      </div>

      {editing !== null && (
        <FormModal 
          title={editing?.id ? `Edit Bus (${editing.registration_number})` : "Add Bus to Fleet"} 
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
