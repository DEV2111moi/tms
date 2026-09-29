import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

function SpareIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    route: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    tools: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronUp: <polyline points="18 15 12 9 6 15"/>,
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

const ACTION_CONFIG = {
  breakdown: {
    label: 'Breakdown',
    icon: '⚠️',
    headerBg: '#991b1b',
    headerTitle: '🚨 Report Bus Breakdown & Assign Substitute',
    subTitle: 'Daily emergency assignment for route continuation',
    tagColor: '#b91c1c',
    tagBg: '#fee2e2',
    borderColor: '#f87171',
    btnColor: '#b91c1c',
    btnText: '🚨 Confirm Breakdown & Dispatch Sub',
    defaultReason: 'Engine breakdown',
    reasons: [
      'Engine breakdown',
      'Puncture / Tyre burst',
      'Accident / Collision',
      'Mechanical / Gear failure',
      'AC / Electrical failure',
      'Brake / Clutch problem',
      'Other breakdown issue'
    ]
  },
  fc: {
    label: 'FC Renewal',
    icon: '📋',
    headerBg: '#1e3a8a',
    headerTitle: '📋 Bus FC Renewal / Inspection & Assign Substitute',
    subTitle: 'Temporary substitute assignment during vehicle RTO FC process',
    tagColor: '#1d4ed8',
    tagBg: '#dbeafe',
    borderColor: '#60a5fa',
    btnColor: '#1d4ed8',
    btnText: '📋 Confirm FC Duty & Dispatch Sub',
    defaultReason: 'Annual RTO Fitness Certificate Inspection',
    reasons: [
      'Annual RTO Fitness Certificate Inspection',
      'FC Work / Body & Paint Preparation',
      'RTO Track & Brake Testing',
      'Speed Governor / Retrofit / GPS Inspection',
      'Other FC related work'
    ]
  },
  emergency: {
    label: 'Emergency',
    icon: '🚨',
    headerBg: '#be123c',
    headerTitle: '🚨 Emergency Event & Route Substitution',
    subTitle: 'Urgent replacement bus deployment for unexpected emergencies',
    tagColor: '#be123c',
    tagBg: '#ffe4e6',
    borderColor: '#fb7185',
    btnColor: '#be123c',
    btnText: '🚨 Dispatch Emergency Substitute',
    defaultReason: 'Driver sudden medical emergency',
    reasons: [
      'Driver sudden medical emergency / illness',
      'Road accident / Police inquiry',
      'Severe weather / Road flooded / Impasse',
      'Immediate campus special deployment',
      'Other urgent emergency'
    ]
  },
  maintenance: {
    label: 'Maintenance',
    icon: '🔧',
    headerBg: '#0f766e',
    headerTitle: '🔧 Scheduled Maintenance & Assign Substitute',
    subTitle: 'Dispatch standby bus while primary bus is in the workshop',
    tagColor: '#0f766e',
    tagBg: '#ccfbf1',
    borderColor: '#5eead4',
    btnColor: '#0f766e',
    btnText: '🔧 Confirm Workshop & Dispatch Sub',
    defaultReason: 'Scheduled periodic service & oil change',
    reasons: [
      'Scheduled periodic service & oil change',
      'Brake overhaul / Lining change',
      'Clutch / Transmission repair',
      'Suspension & steering maintenance',
      'Tyre replacement & wheel alignment',
      'Electrical / Battery servicing',
      'Other scheduled repair'
    ]
  },
  other: {
    label: 'Other Reassignment',
    icon: '⚙️',
    headerBg: '#334155',
    headerTitle: '⚙️ Report Vehicle Status & Assign Substitute',
    subTitle: 'Operational substitution for special duties or temporary reassignment',
    tagColor: '#334155',
    tagBg: '#f1f5f9',
    borderColor: '#cbd5e1',
    btnColor: '#334155',
    btnText: '⚙️ Confirm & Dispatch Sub',
    defaultReason: 'Special event / Campus event duty',
    reasons: [
      'Special event / Campus event duty',
      'Driver on official leave / Replacement duty',
      'Temporary route reorganization',
      'Educational tour / Sports meet duty',
      'Other operational assignment'
    ]
  }
};

export default function Spare() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [statusTab, setStatusTab] = useState('all');
  const [activeDropdownBusId, setActiveDropdownBusId] = useState(null);

  // Action / Substitution Modal state
  const [actionModal, setActionModal] = useState(null);
  const [savingSub, setSavingSub] = useState(false);

  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'institution';

  // Close open action dropdowns when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => setActiveDropdownBusId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const load = (inst = instFilter, dateVal = selectedDate) => {
    setLoading(true);
    const filter = (inst && inst !== 'all') 
      ? { institution_id: inst, date: dateVal } 
      : { institution_id: 'all', date: dateVal };

    api.listRes('buses', filter)
      .then(d => {
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r || {})).catch(() => {});
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'all';
    setInstFilter(initialInst);
    load(initialInst, selectedDate);
  }, []);

  const handleDateChange = (d) => {
    setSelectedDate(d);
    load(instFilter, d);
  };

  const handleInstChange = (v) => {
    setInstFilter(v);
    load(v, selectedDate);
  };

  // Helper to resolve driver id and name for any bus
  const getBusDriverInfo = (busId) => {
    if (!busId) return { id: '', name: '' };
    const busItem = items.find(b => String(b.id) === String(busId));
    const refBus = (refs.buses || []).find(b => String(b.id) === String(busId));

    let driverId = busItem?.current_driver_id || refBus?.driver_id || '';
    let driverName = (busItem?.driver_name && busItem.driver_name !== '—')
      ? busItem.driver_name
      : (refBus?.driver_name && refBus.driver_name !== '—') ? refBus.driver_name : '';

    if (driverName && driverName.includes(',')) {
      driverName = driverName.split(',')[0].trim();
    }

    if (!driverId && driverName && refs.drivers) {
      const dMatch = refs.drivers.find(d =>
        d.name?.trim().toLowerCase() === driverName.toLowerCase() ||
        driverName.toLowerCase().includes(d.name?.trim().toLowerCase())
      );
      if (dMatch) {
        driverId = dMatch.id;
        driverName = dMatch.name;
      }
    }

    if (driverId && !driverName && refs.drivers) {
      const dMatch = refs.drivers.find(d => String(d.id) === String(driverId));
      if (dMatch) driverName = dMatch.name;
    }

    if (!driverId && busItem?.route_id && refs.drivers) {
      const dMatch = refs.drivers.find(d => String(d.route_id) === String(busItem.route_id));
      if (dMatch) {
        driverId = dMatch.id;
        driverName = dMatch.name;
      }
    }

    return { id: driverId ? String(driverId) : '', name: driverName || '' };
  };

  // Open action modal for a specific bus and action category
  const openActionModal = (bus, actionType = 'breakdown') => {
    setActiveDropdownBusId(null);
    const primaryRouteId = (bus.assigned_route_ids && bus.assigned_route_ids.split(',')[0]) || bus.route_id || '';
    const origDriverInfo = getBusDriverInfo(bus.id);
    const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.breakdown;

    setActionModal({
      bus,
      actionType,
      sub_date: selectedDate,
      original_bus_id: bus.id,
      route_id: primaryRouteId,
      original_driver_id: origDriverInfo.id || bus.current_driver_id || '',
      substitute_bus_id: bus.substitute_bus_id || '',
      substitute_driver_id: bus.substitute_driver_id || origDriverInfo.id || '',
      shifts: bus.breakdown_shifts || 'all',
      reason: bus.breakdown_reason || config.defaultReason,
      notes: bus.breakdown_notes || ''
    });
  };

  // Save the substitution action
  const handleSaveAction = async (e) => {
    e.preventDefault();
    if (!actionModal.substitute_bus_id) {
      toast('Please select an alternate / substitute bus from the list.');
      return;
    }
    setSavingSub(true);
    const config = ACTION_CONFIG[actionModal.actionType] || ACTION_CONFIG.breakdown;
    const finalReason = actionModal.reason.includes(':') 
      ? actionModal.reason 
      : `${config.label}: ${actionModal.reason}`;

    try {
      await api.createSubstitution({
        sub_date: actionModal.sub_date,
        original_bus_id: actionModal.original_bus_id,
        route_id: actionModal.route_id || null,
        original_driver_id: actionModal.original_driver_id || null,
        substitute_bus_id: actionModal.substitute_bus_id,
        substitute_driver_id: actionModal.substitute_driver_id || null,
        shifts: actionModal.shifts || 'all',
        reason: finalReason,
        is_extra_trip: 0,
        notes: actionModal.notes || ''
      });
      toast(`Bus ${actionModal.bus.registration_number} recorded as ${config.label}. Substitute dispatched.`);
      setActionModal(null);
      load(instFilter, selectedDate);
    } catch (err) {
      toast(err.message || 'Could not save substitution');
    } finally {
      setSavingSub(false);
    }
  };

  // Resolve incident and mark bus ready to return to its original route
  const handleResolveAction = async (subId, busNumber) => {
    if (!confirm(`Is bus ${busNumber} ready to return to its regular route?`)) return;
    try {
      await api.resolveSubstitution(subId);
      toast(`✅ Bus ${busNumber} is ready! Successfully restored to its original route.`);
      load(instFilter, selectedDate);
    } catch (err) {
      toast(err.message || 'Could not restore bus');
    }
  };

  // Helper to determine bus action category
  const getActionCategory = (item) => {
    if (!item.is_breakdown) return null;
    const r = (item.breakdown_reason || '').toLowerCase();
    if (r.includes('fc') || r.includes('fitness')) return 'fc';
    if (r.includes('emergency')) return 'emergency';
    if (r.includes('maintenance') || r.includes('service') || r.includes('repair')) return 'maintenance';
    if (r.includes('breakdown') || r.includes('puncture') || r.includes('engine') || r.includes('accident')) return 'breakdown';
    return 'other';
  };

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches = (
          (item.registration_number || '').toLowerCase().includes(q) ||
          (item.assigned_route_code || '').toLowerCase().includes(q) ||
          (item.assigned_route_name || '').toLowerCase().includes(q) ||
          (item.driver_name || '').toLowerCase().includes(q) ||
          (item.substitute_bus_number || '').toLowerCase().includes(q) ||
          (item.substitute_driver_name || '').toLowerCase().includes(q) ||
          (item.breakdown_reason || '').toLowerCase().includes(q) ||
          (item.bus_model || '').toLowerCase().includes(q) ||
          (item.status || '').toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      // 2. Status Tab Filter
      const cat = getActionCategory(item);
      const isSpare = !item.assigned_route_code && !item.is_breakdown;
      const isActiveRoute = item.assigned_route_code && !item.is_breakdown;

      if (statusTab === 'spare') return isSpare;
      if (statusTab === 'active_route') return isActiveRoute;
      if (statusTab === 'breakdown') return cat === 'breakdown';
      if (statusTab === 'fc') return cat === 'fc';
      if (statusTab === 'emergency') return cat === 'emergency';
      if (statusTab === 'maintenance') return cat === 'maintenance';
      if (statusTab === 'other') return cat === 'other';

      return true;
    });
  }, [items, searchQuery, statusTab]);

  // Aggregate stats
  const stats = useMemo(() => {
    let total = items.length;
    let spares = 0;
    let activeRoutes = 0;
    let breakdown = 0;
    let fc = 0;
    let emergency = 0;
    let maintenance = 0;
    let other = 0;

    items.forEach(b => {
      if (b.is_breakdown) {
        const cat = getActionCategory(b);
        if (cat === 'breakdown') breakdown++;
        else if (cat === 'fc') fc++;
        else if (cat === 'emergency') emergency++;
        else if (cat === 'maintenance') maintenance++;
        else other++;
      } else if (!b.assigned_route_code) {
        spares++;
      } else {
        activeRoutes++;
      }
    });

    const totalActions = breakdown + fc + emergency + maintenance + other;

    return { total, spares, activeRoutes, breakdown, fc, emergency, maintenance, other, totalActions };
  }, [items]);

  // Table Columns (S.NO, Reg. Number, Assigned Route, Driver Name, Status, Action)
  const COLUMNS = useMemo(() => [
    {
      key: 'registration_number',
      label: 'Reg. Number',
      render: (v, item) => {
        const cat = getActionCategory(item);
        const config = cat ? ACTION_CONFIG[cat] : null;

        return item.is_breakdown ? (
          <div>
            <span className="mono" style={{ textDecoration: 'line-through', color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>
              {v}
            </span>
            <div style={{ marginTop: 2 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                background: config?.tagBg || '#fee2e2',
                color: config?.tagColor || '#b91c1c',
                border: `1px solid ${config?.borderColor || '#fecaca'}`,
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-block',
                textTransform: 'uppercase'
              }}>
                {config?.icon || '⚠️'} {config?.label.toUpperCase() || 'ACTION ACTIVE'}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span 
                className="mono" 
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  display: 'inline-block',
                  letterSpacing: '0.5px'
                }}
              >
                {v}
              </span>
              {!item.assigned_route_code && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  STANDBY
                </span>
              )}
            </div>
            {item.institution_name && (
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {item.institution_name}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'assigned_route_code',
      label: 'Assigned Route',
      render: (v, item) => item.is_breakdown ? (
        <span className="mono" style={{ textDecoration: 'line-through', color: '#94a3b8', opacity: 0.8 }}>
          {v || '—'}
        </span>
      ) : v ? (
        <div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {v.split(',').map((rc, idx) => (
              <span 
                key={idx}
                className="mono"
                style={{
                  background: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 11.5
                }}
              >
                {rc.trim()}
              </span>
            ))}
          </div>
          {item.assigned_route_name && (
            <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
              {item.assigned_route_name}
            </div>
          )}
        </div>
      ) : (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          color: '#0284c7',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11.5,
          fontWeight: 600
        }}>
          <span>⚡</span> <span>Standby in Depot (Available as Spare)</span>
        </span>
      )
    },
    {
      key: 'driver_name',
      label: 'Driver Name',
      render: (v, item) => item.is_breakdown ? (
        <span style={{ textDecoration: 'line-through', color: '#94a3b8', opacity: 0.8 }}>
          {v || '—'}
        </span>
      ) : v && v !== '—' ? (
        <strong style={{ color: '#1e293b', fontSize: 12.5 }}>{v}</strong>
      ) : (
        <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>— (Standby)</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (v, item) => {
        if (item.is_breakdown) {
          const cat = getActionCategory(item);
          const config = cat ? ACTION_CONFIG[cat] : null;
          return (
            <span style={{
              fontWeight: 800,
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 4,
              background: config?.tagBg || '#fee2e2',
              color: config?.tagColor || '#b91c1c',
              border: `1px solid ${config?.borderColor || '#fca5a5'}`
            }}>
              {config?.icon} {item.breakdown_reason?.split(':')[0] || config?.label || 'Action Active'}
            </span>
          );
        }
        if (!item.assigned_route_code) {
          return (
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              fontWeight: 800,
              fontSize: 10.5,
              padding: '3px 8px',
              borderRadius: 4,
              letterSpacing: '0.4px'
            }}>
              ⚡ STANDBY SPARE
            </span>
          );
        }
        return (
          <span className={`tag ${v === 'active' ? 'tag--ok' : v === 'repair' ? 'tag--warn' : 'tag--off'}`}>
            {v || 'active'}
          </span>
        );
      }
    }
  ], []);

  // Row Styling for broken down / action active buses
  const rowStyle = (item) => {
    if (item.is_breakdown) {
      const cat = getActionCategory(item);
      const config = cat ? ACTION_CONFIG[cat] : null;
      return {
        background: 'rgba(254, 242, 242, 0.75)',
        borderLeft: `4px solid ${config?.btnColor || '#ef4444'}`
      };
    }
    if (!item.assigned_route_code) {
      return {
        background: '#f8fafc'
      };
    }
    return undefined;
  };

  // Sub-row rendering for substitution details
  const renderSubRow = (item) => {
    if (!item.is_breakdown) return null;
    const cat = getActionCategory(item);
    const config = cat ? ACTION_CONFIG[cat] : null;
    const totalCols = COLUMNS.length + 2;

    return (
      <tr 
        key={`sub-${item.id}`} 
        style={{ 
          background: '#fefce8', 
          borderLeft: '4px solid #eab308', 
          borderBottom: '2px solid #fde047' 
        }}
      >
        <td colSpan={totalCols} style={{ padding: '10px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 800,
                  background: config?.btnColor || '#ca8a04',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span>{config?.icon || '🔁'}</span>
                  <span>SUBSTITUTE DISPATCHED</span>
                </span>
                <span style={{ fontSize: 13, color: '#854d0e', fontWeight: 600 }}>
                  ➔ Replacement Bus:
                </span>
                <span className="mono" style={{
                  fontWeight: 800,
                  fontSize: 13.5,
                  background: '#1e293b',
                  color: '#facc15',
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.5px'
                }}>
                  {item.substitute_bus_number || 'Alternate Bus'}
                </span>
                {item.substitute_bus_model && (
                  <span style={{ fontSize: 12, color: '#713f12' }}>
                    ({item.substitute_bus_model}, Seats: {item.substitute_capacity})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#713f12' }}>
                <span>👨‍✈️ Driver:</span>
                <strong style={{ color: '#0f172a' }}>
                  {item.substitute_driver_name || item.driver_name || 'Assigned Driver'}
                </strong>
              </div>

              {item.breakdown_reason && (
                <div style={{ fontSize: 12, color: '#854d0e' }}>
                  Reason: <b>{item.breakdown_reason}</b>
                  {item.breakdown_notes ? ` · Note: "${item.breakdown_notes}"` : ''}
                </div>
              )}
            </div>

            {canEdit && item.substitution_id && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => openActionModal(item, cat || 'breakdown')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #ca8a04',
                    color: '#854d0e',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 4
                  }}
                  title="Edit or change the substitute bus / driver"
                >
                  ✏️ Change Sub
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={() => handleResolveAction(item.substitution_id, item.registration_number)}
                  style={{
                    background: '#15803d',
                    borderColor: '#166534',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: 4
                  }}
                  title="Mark this bus as ready and restore its normal route"
                >
                  ✅ Bus Ready (Restore Route)
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Actions column rendering with clean action button & floating dropdown
  const extraAction = (item) => {
    if (!canEdit) return null;

    if (item.is_breakdown) {
      return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => handleResolveAction(item.substitution_id, item.registration_number)}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 11.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 1px 2px rgba(22, 101, 52, 0.2)'
            }}
            title="Mark bus as ready to return to normal route"
          >
            <span>✅</span> <span>Bus Ready</span>
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => openActionModal(item, getActionCategory(item) || 'breakdown')}
            style={{
              borderColor: '#ca8a04',
              color: '#a16207',
              fontWeight: 600,
              padding: '4px 9px',
              borderRadius: 6,
              fontSize: 11
            }}
            title="Edit substitution details"
          >
            ✏️ Sub
          </button>
        </div>
      );
    }

    const isSpareBus = !item.assigned_route_code;
    const isMenuOpen = activeDropdownBusId === item.id;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          {isSpareBus ? (
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => openActionModal(item, 'breakdown')}
              style={{
                background: 'linear-gradient(135deg, #7c6cfc 0%, #6854ec 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 11.5,
                padding: '5px 12px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 2px 8px rgba(124, 108, 252, 0.3)',
                cursor: 'pointer'
              }}
              title="Deploy this standby bus to cover an incident or route"
            >
              <span>⚡</span> <span>Deploy as Spare</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-xs"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownBusId(isMenuOpen ? null : item.id);
              }}
              style={{
                background: isMenuOpen ? '#f1f5f9' : '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: 13 }}>⚡</span>
              <span>Action / Sub</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>{isMenuOpen ? '▲' : '▼'}</span>
            </button>
          )}

          {/* More actions trigger for spare bus */}
          {isSpareBus && (
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownBusId(isMenuOpen ? null : item.id);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                borderColor: '#cbd5e1',
                color: '#475569'
              }}
              title="Other fleet status actions"
            >
              ▾
            </button>
          )}
        </div>

        {/* Floating Action Menu */}
        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              background: '#ffffff',
              borderRadius: 8,
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.18), 0 0 1px 1px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
              width: 240,
              zIndex: 100,
              overflow: 'hidden',
              padding: '6px',
              animation: 'fadeIn 0.12s ease'
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#64748b',
              padding: '4px 8px 8px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>SELECT ACTION:</span>
              <span className="mono" style={{ color: '#0f172a' }}>{item.registration_number}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setActiveDropdownBusId(null); openActionModal(item, 'breakdown'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  ⚠️
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#b91c1c' }}>Breakdown</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Mechanical / engine failure</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveDropdownBusId(null); openActionModal(item, 'fc'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  📋
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1d4ed8' }}>FC Renewal</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>RTO fitness test & inspection</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveDropdownBusId(null); openActionModal(item, 'emergency'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#ffe4e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  🚨
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#be123c' }}>Emergency</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Driver or urgent route incident</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveDropdownBusId(null); openActionModal(item, 'maintenance'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0fdfa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#ccfbf1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  🔧
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#0f766e' }}>Maintenance</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Periodic service & workshop</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveDropdownBusId(null); openActionModal(item, 'other'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  ⚙️
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>Other Duty</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Special event / reorganization</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeModalConfig = actionModal ? (ACTION_CONFIG[actionModal.actionType] || ACTION_CONFIG.breakdown) : null;

  return (
    <>
      <div className="page-head hide-on-print">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Spare & Fleet Status Management</span>
            <span className="live-badge" style={{ background: '#f0eeff', color: '#6854ec', borderColor: '#e0dcfc' }}>
              <span className="dot" />
              <span>STANDBY DISPATCH</span>
            </span>
          </div>
          <div className="page-sub">
            Date-wise standby fleet, spare deployment & emergency substitutions ({filteredItems.length} buses shown)
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Top Summary Stats Cards (Modern KPI Ribbon) */}
        <div className="att-kpi-ribbon hide-on-print" style={{ marginBottom: 16 }}>
          {/* Total Fleet */}
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <SpareIcon name="bus" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{stats.total}</div>
              <div className="att-kpi-label">Total Fleet</div>
              <div className="att-kpi-sub">Registered vehicles</div>
            </div>
          </div>

          {/* Standby Spares Available */}
          <div className="att-kpi-card" style={{ borderColor: stats.spares > 0 ? '#38bdf8' : undefined }}>
            <div className="att-kpi-icon att-kpi-icon--blue" style={{ background: '#e0f2fe' }}>
              <SpareIcon name="zap" size={22} color="#0284c7" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#0284c7' }}>{stats.spares}</div>
              <div className="att-kpi-label">Available Standby Spares</div>
              <div className="att-kpi-sub">Ready in yard for deployment</div>
            </div>
          </div>

          {/* Active on Routes */}
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <SpareIcon name="route" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{stats.activeRoutes}</div>
              <div className="att-kpi-label">Active on Routes</div>
              <div className="att-kpi-sub">{Math.round((stats.activeRoutes / (stats.total || 1)) * 100)}% route coverage</div>
            </div>
          </div>

          {/* Buses Under Action / Incident */}
          <div className={`att-kpi-card ${stats.totalActions > 0 ? 'att-kpi-card--alert' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--amber" style={{ background: stats.totalActions > 0 ? '#fee2e2' : undefined }}>
              <SpareIcon name="alert" size={22} color={stats.totalActions > 0 ? '#ef4444' : '#f59e0b'} />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.totalActions > 0 ? '#dc2626' : '#64748b' }}>
                {stats.totalActions}
              </div>
              <div className="att-kpi-label">Buses Under Action ({selectedDate})</div>
              <div className="att-kpi-sub">
                {stats.totalActions > 0 ? `${stats.totalActions} replacement(s) active` : 'All routes operating normally'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Alert Banner if any buses have active substitution */}
        {stats.totalActions > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '1.5px solid #f87171',
            borderRadius: 8,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#991b1b',
            fontWeight: 600,
            fontSize: 13
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🚨</span>
              <div>
                <div>
                  <b>{stats.totalActions} bus(es)</b> under action on <b>{selectedDate}</b>:
                  {stats.breakdown > 0 && <span> ⚠️ {stats.breakdown} Breakdown</span>}
                  {stats.fc > 0 && <span> · 📋 {stats.fc} FC Work</span>}
                  {stats.emergency > 0 && <span> · 🚨 {stats.emergency} Emergency</span>}
                  {stats.maintenance > 0 && <span> · 🔧 {stats.maintenance} Maintenance</span>}
                  {stats.other > 0 && <span> · ⚙️ {stats.other} Other</span>}
                </div>
                <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 500, marginTop: 2 }}>
                  Standby / substitute buses are currently deployed with cover duties.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, background: '#fee2e2', padding: '3px 10px', borderRadius: 12, fontWeight: 800 }}>
              Date-wise Actions Active
            </span>
          </div>
        )}

        {/* Unified Modern Toolbar */}
        <div className="card hide-on-print" style={{ padding: '14px 18px', marginBottom: 16 }}>
          {/* Top Line: Search, Date Picker, Campus Filter */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                  <SpareIcon name="search" size={15} color="#94a3b8" />
                </span>
                <input
                  type="text"
                  className="finput"
                  placeholder="Search Reg. Number, Route, Driver..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', height: 38, paddingLeft: 34 }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Date-wise Picker with Quick "Today" shortcut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <SpareIcon name="calendar" size={15} color="#475569" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Date:</span>
                <input
                  type="date"
                  className="finput"
                  value={selectedDate}
                  onChange={e => handleDateChange(e.target.value)}
                  style={{ height: 30, padding: '2px 6px', fontSize: 12.5, border: 'none', background: 'transparent', fontWeight: 700 }}
                />
                {selectedDate !== new Date().toLocaleDateString('en-CA') && (
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => handleDateChange(new Date().toLocaleDateString('en-CA'))}
                    style={{ background: '#e2e8f0', color: '#0f172a', fontWeight: 700, padding: '2px 6px', fontSize: 11, borderRadius: 4 }}
                    title="Jump to today's date"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* Campus Filter */}
              {refs.institutions?.length > 0 && (
                <select
                  className="fselect"
                  value={instFilter}
                  onChange={e => handleInstChange(e.target.value)}
                  style={{ maxWidth: 220, height: 38, fontWeight: 600 }}
                >
                  <option value="all">All Campuses</option>
                  {refs.institutions.map(i => (
                    <option key={i.id} value={String(i.id)}>
                      {i.short_name || i.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredItems.length}</b> of {items.length} buses
            </div>
          </div>

          {/* Bottom Line: Segmented Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('all')}
              style={{ fontWeight: 700, height: 30, borderRadius: 6 }}
            >
              All Buses ({stats.total})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'spare' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('spare')}
              style={{
                borderColor: '#7c6cfc',
                color: statusTab === 'spare' ? '#fff' : '#6854ec',
                background: statusTab === 'spare' ? 'linear-gradient(135deg, #7c6cfc 0%, #6854ec 100%)' : '#f0eeff',
                fontWeight: 700,
                height: 30,
                borderRadius: 6
              }}
            >
              ⚡ Standby Spares ({stats.spares})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'active_route' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('active_route')}
              style={{ fontWeight: 700, height: 30, borderRadius: 6 }}
            >
              Active Routes ({stats.activeRoutes})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'breakdown' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('breakdown')}
              style={{
                borderColor: '#ef4444',
                color: statusTab === 'breakdown' ? '#fff' : '#b91c1c',
                background: statusTab === 'breakdown' ? '#b91c1c' : stats.breakdown > 0 ? '#fef2f2' : undefined,
                fontWeight: 700,
                height: 30,
                borderRadius: 6
              }}
            >
              ⚠️ Breakdown ({stats.breakdown})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'fc' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('fc')}
              style={{
                borderColor: '#3b82f6',
                color: statusTab === 'fc' ? '#fff' : '#1d4ed8',
                background: statusTab === 'fc' ? '#1d4ed8' : stats.fc > 0 ? '#eff6ff' : undefined,
                fontWeight: 700,
                height: 30,
                borderRadius: 6
              }}
            >
              📋 FC Renewal ({stats.fc})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'emergency' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('emergency')}
              style={{
                borderColor: '#f43f5e',
                color: statusTab === 'emergency' ? '#fff' : '#be123c',
                background: statusTab === 'emergency' ? '#be123c' : stats.emergency > 0 ? '#fff1f2' : undefined,
                fontWeight: 700,
                height: 30,
                borderRadius: 6
              }}
            >
              🚨 Emergency ({stats.emergency})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'maintenance' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('maintenance')}
              style={{
                borderColor: '#14b8a6',
                color: statusTab === 'maintenance' ? '#fff' : '#0f766e',
                background: statusTab === 'maintenance' ? '#0f766e' : stats.maintenance > 0 ? '#f0fdfa' : undefined,
                fontWeight: 700,
                height: 30,
                borderRadius: 6
              }}
            >
              🔧 In Workshop ({stats.maintenance})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${statusTab === 'other' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusTab('other')}
              style={{
                borderColor: '#64748b',
                color: statusTab === 'other' ? '#fff' : '#334155',
                background: statusTab === 'other' ? '#334155' : undefined,
                fontWeight: 600,
                height: 30,
                borderRadius: 6
              }}
            >
              ⚙️ Other ({stats.other})
            </button>
          </div>
        </div>

        {/* Clean Master Fleet & Spares Table */}
        <DataTable
          columns={COLUMNS}
          data={filteredItems}
          rowStyle={rowStyle}
          renderSubRow={renderSubRow}
          extraAction={extraAction}
          emptyIcon="🚌"
          emptyText={`No buses found matching "${searchQuery || statusTab}".`}
        />
      </div>

      {/* ========================================================================= */}
      {/* ACTION & SUBSTITUTION MODAL WITH CATEGORY SELECTOR TABS                    */}
      {/* ========================================================================= */}
      {actionModal && activeModalConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
          backdropFilter: 'blur(3px)'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: 560,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            padding: 0,
            animation: 'fadeIn 0.15s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              background: activeModalConfig.headerBg,
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  {activeModalConfig.headerTitle}
                </h3>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                  {activeModalConfig.subTitle}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Quick Category Switcher Tabs inside Modal */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              gap: '4px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
                const isSel = actionModal.actionType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActionModal(prev => ({
                      ...prev,
                      actionType: key,
                      reason: cfg.defaultReason
                    }))}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '8px 4px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isSel ? '#ffffff' : 'transparent',
                      color: isSel ? cfg.tagColor : '#64748b',
                      boxShadow: isSel ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAction} style={{ padding: '20px' }}>
              {/* Bus Information Banner */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>
                    Selected Bus: <strong className="mono" style={{ color: activeModalConfig.btnColor, fontSize: 14 }}>{actionModal.bus.registration_number}</strong>
                  </span>
                  <span>
                    Route: <strong style={{ color: '#0369a1' }}>{actionModal.bus.assigned_route_code || '— (Standby Spare)'}</strong>
                  </span>
                </div>
                <div style={{ color: '#475569', fontSize: 12 }}>
                  Current Driver: <b>{actionModal.bus.driver_name || '—'}</b>
                </div>
              </div>

              {/* Form Fields: Date & Action Reason */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="flabel"><span style={{ fontWeight: 600 }}>Date</span></label>
                  <input
                    type="date"
                    className="finput"
                    value={actionModal.sub_date}
                    onChange={e => setActionModal({ ...actionModal, sub_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="flabel"><span style={{ fontWeight: 600 }}>{activeModalConfig.label} Reason</span></label>
                  <select
                    className="fselect"
                    value={actionModal.reason}
                    onChange={e => setActionModal({ ...actionModal, reason: e.target.value })}
                  >
                    {activeModalConfig.reasons.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Substitute / Alternate Bus Selection */}
              <div style={{ marginBottom: 12 }}>
                <label className="flabel">
                  <span style={{ fontWeight: 700, color: '#0369a1' }}>👉 Select Alternate / Replacement Bus: *</span>
                </label>
                <select
                  className="fselect"
                  value={actionModal.substitute_bus_id}
                  onChange={e => {
                    const chosenBusId = e.target.value;
                    const subDriver = getBusDriverInfo(chosenBusId);
                    const origDriver = getBusDriverInfo(actionModal.original_bus_id);

                    const defaultDriverId = subDriver.id || origDriver.id || '';

                    setActionModal(prev => ({
                      ...prev,
                      substitute_bus_id: chosenBusId,
                      substitute_driver_id: defaultDriverId
                    }));
                  }}
                  required
                  style={{ border: '2px solid #0284c7', background: '#f0f9ff', fontWeight: 600 }}
                >
                  <option value="">-- Choose available substitute bus --</option>
                  {/* First, list Standby Spare buses at top */}
                  <optgroup label="⭐ Standby Spare Buses (Unassigned & Ready)">
                    {items
                      .filter(b => b.id !== actionModal.original_bus_id && !b.is_breakdown && !b.assigned_route_code)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          ⭐ {b.registration_number} ({b.bus_model || 'Bus'}, Seats: {b.capacity}) · [STANDBY SPARE] {b.driver_name && b.driver_name !== '—' ? `· Driver: ${b.driver_name}` : ''}
                        </option>
                      ))}
                  </optgroup>
                  {/* Second, list other fleet buses */}
                  <optgroup label="──────── Other Fleet Buses ────────">
                    {items
                      .filter(b => b.id !== actionModal.original_bus_id && !b.is_breakdown && b.assigned_route_code)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.registration_number} ({b.bus_model || 'Bus'}, Seats: {b.capacity}) · Normally {b.assigned_route_code} {b.driver_name && b.driver_name !== '—' ? `· Driver: ${b.driver_name}` : ''}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Substitute Driver Selection with Prioritized Order */}
              {(() => {
                const chosenSubBus = items.find(b => String(b.id) === String(actionModal.substitute_bus_id));
                const subDriver = getBusDriverInfo(actionModal.substitute_bus_id);
                const origDriver = getBusDriverInfo(actionModal.original_bus_id);

                const otherDrivers = (refs.drivers || []).filter(d => 
                  String(d.id) !== String(subDriver.id) && 
                  String(d.id) !== String(origDriver.id)
                );

                return (
                  <div style={{ marginBottom: 16 }}>
                    <label className="flabel">
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>Driver Operating Substitute Bus:</span>
                    </label>
                    <select
                      className="fselect"
                      value={actionModal.substitute_driver_id}
                      onChange={e => setActionModal(prev => ({ ...prev, substitute_driver_id: e.target.value }))}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="">-- Select Driver --</option>

                      {/* 1. Alternate Bus Driver (if available) */}
                      {subDriver.id && subDriver.name && (
                        <option value={subDriver.id} style={{ fontWeight: 'bold', color: '#1d4ed8', background: '#eff6ff' }}>
                          ⭐ {subDriver.name} (Driver of Alternate Bus {chosenSubBus ? `- ${chosenSubBus.registration_number}` : ''})
                        </option>
                      )}

                      {/* 2. Original Bus Driver (from breakdown bus) */}
                      {origDriver.id && origDriver.name && String(origDriver.id) !== String(subDriver.id) && (
                        <option value={origDriver.id} style={{ fontWeight: 'bold', color: '#b45309', background: '#fefce8' }}>
                          🔄 {origDriver.name} (Original Driver of Breakdown Bus - {actionModal.bus.registration_number})
                        </option>
                      )}

                      {/* 3. All Other Fleet Drivers */}
                      {otherDrivers.length > 0 && (
                        <optgroup label="──────── All Other Drivers ────────">
                          {otherDrivers.map(d => (
                            <option key={d.id} value={String(d.id)}>
                              {d.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                );
              })()}

              {/* Notes */}
              <div style={{ marginBottom: 18 }}>
                <label className="flabel"><span>Notes / Remarks (Optional):</span></label>
                <input
                  type="text"
                  className="finput"
                  placeholder="e.g. Sent to workshop, replacement bus dispatched for shifts."
                  value={actionModal.notes}
                  onChange={e => setActionModal({ ...actionModal, notes: e.target.value })}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActionModal(null)}
                  disabled={savingSub}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: activeModalConfig.btnColor, borderColor: activeModalConfig.btnColor }}
                  disabled={savingSub}
                >
                  {savingSub ? 'Saving...' : activeModalConfig.btnText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
