import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

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
    label: 'FC (Fitness Cert)',
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
    label: 'Other',
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
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'spare', 'active_route', 'breakdown', 'fc', 'emergency', 'maintenance', 'other'

  // Action / Substitution Modal state
  const [actionModal, setActionModal] = useState(null);
  const [savingSub, setSavingSub] = useState(false);

  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'institution';

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

  // Helper to extract driver id and name for any bus
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

  // Open modal for a specific action (breakdown, fc, emergency, maintenance, other)
  const openActionModal = (bus, actionType = 'breakdown') => {
    const primaryRouteId = (bus.assigned_route_ids && bus.assigned_route_ids.split(',')[0]) || bus.route_id || '';
    const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.breakdown;
    const origDriverInfo = getBusDriverInfo(bus.id);

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

  // Save substitution & action
  const handleSaveAction = async (e) => {
    e.preventDefault();
    if (!actionModal.substitute_bus_id) {
      toast('Please select an alternate / replacement bus.');
      return;
    }
    setSavingSub(true);
    try {
      const config = ACTION_CONFIG[actionModal.actionType] || ACTION_CONFIG.breakdown;
      const fullReason = `${config.label.toUpperCase()}: ${actionModal.reason || config.defaultReason}`;

      await api.createSubstitution({
        sub_date: actionModal.sub_date,
        original_bus_id: actionModal.original_bus_id,
        route_id: actionModal.route_id || null,
        original_driver_id: actionModal.original_driver_id || null,
        substitute_bus_id: actionModal.substitute_bus_id,
        substitute_driver_id: actionModal.substitute_driver_id || null,
        shifts: actionModal.shifts || 'all',
        reason: fullReason,
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

  // Table Columns (Matches user requirement: S.NO, Reg. Number, Assigned Route, Driver Name, Status, Actions)
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
            <span style={{
              marginLeft: 8,
              fontSize: 10.5,
              fontWeight: 800,
              background: config?.tagBg || '#fee2e2',
              color: config?.tagColor || '#b91c1c',
              border: `1px solid ${config?.borderColor || '#fecaca'}`,
              padding: '2px 7px',
              borderRadius: 4,
              display: 'inline-block',
              textTransform: 'uppercase'
            }}>
              {config?.icon || '⚠️'} {config?.label.toUpperCase() || 'ACTION ACTIVE'}
            </span>
          </div>
        ) : (
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
                display: 'inline-block'
              }}
            >
              {v}
            </span>
            {!item.assigned_route_code && (
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                padding: '2px 6px',
                borderRadius: 4
              }}>
                STANDBY SPARE
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
        <span>
          <strong className="mono" style={{ color: '#0369a1' }}>{v}</strong>
          {item.assigned_route_name && (
            <span className="muted" style={{ fontSize: 12, marginLeft: 6 }}>
              · {item.assigned_route_name}
            </span>
          )}
        </span>
      ) : (
        <span style={{ color: '#0284c7', fontStyle: 'italic', fontWeight: 600, fontSize: 12 }}>
          ⚡ Standby (Available as Spare)
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
        <strong style={{ color: '#1e293b' }}>{v}</strong>
      ) : (
        <span style={{ color: '#94a3b8' }}>—</span>
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
            <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 700 }}>
              STANDBY / SPARE
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

  // Actions column rendering with 5 requested actions
  const extraAction = (item) => {
    if (!canEdit) return null;

    if (item.is_breakdown) {
      return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => handleResolveAction(item.substitution_id, item.registration_number)}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 11
            }}
            title="Mark bus as ready to return to normal route"
          >
            ✅ Bus Ready
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-xs"
          onClick={() => openActionModal(item, 'breakdown')}
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            fontWeight: 700,
            padding: '3px 7px',
            fontSize: 11,
            borderRadius: 4
          }}
          title="Mark bus as broken down and assign replacement"
        >
          ⚠️ Breakdown
        </button>
        <button
          type="button"
          className="btn btn-xs"
          onClick={() => openActionModal(item, 'fc')}
          style={{
            background: '#dbeafe',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            fontWeight: 700,
            padding: '3px 7px',
            fontSize: 11,
            borderRadius: 4
          }}
          title="Send for FC inspection and deploy substitute"
        >
          📋 FC
        </button>
        <button
          type="button"
          className="btn btn-xs"
          onClick={() => openActionModal(item, 'emergency')}
          style={{
            background: '#ffe4e6',
            color: '#be123c',
            border: '1px solid #fecdd3',
            fontWeight: 700,
            padding: '3px 7px',
            fontSize: 11,
            borderRadius: 4
          }}
          title="Emergency substitute deployment"
        >
          🚨 Emergency
        </button>
        <button
          type="button"
          className="btn btn-xs"
          onClick={() => openActionModal(item, 'maintenance')}
          style={{
            background: '#ccfbf1',
            color: '#0f766e',
            border: '1px solid #99f6e4',
            fontWeight: 700,
            padding: '3px 7px',
            fontSize: 11,
            borderRadius: 4
          }}
          title="Send for workshop maintenance & assign standby"
        >
          🔧 Maint.
        </button>
        <button
          type="button"
          className="btn btn-xs"
          onClick={() => openActionModal(item, 'other')}
          style={{
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            fontWeight: 600,
            padding: '3px 7px',
            fontSize: 11,
            borderRadius: 4
          }}
          title="Other operational change / replacement"
        >
          ⚙️ Other
        </button>
      </div>
    );
  };

  const activeModalConfig = actionModal ? (ACTION_CONFIG[actionModal.actionType] || ACTION_CONFIG.breakdown) : null;

  return (
    <>
      <div className="page-head hide-on-print">
        <div>
          <div className="page-title">Spare & Fleet Status Management</div>
          <div className="page-sub">
            Date-wise standby fleet, spare deployment & emergency substitutions ({filteredItems.length} buses shown)
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Top Summary Stats Cards */}
        <div className="cards-grid hide-on-print" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-card__label">Total Fleet Buses</div>
            <div className="stat-card__value">{stats.total}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="stat-card__label">Available Standby Spares</div>
            <div className="stat-card__value" style={{ color: '#0284c7' }}>{stats.spares}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="stat-card__label">Active On Routes</div>
            <div className="stat-card__value" style={{ color: '#16a34a' }}>{stats.activeRoutes}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: stats.totalActions > 0 ? '4px solid #dc2626' : undefined }}>
            <div className="stat-card__label">Buses Under Action ({selectedDate})</div>
            <div className="stat-card__value" style={{ color: stats.totalActions > 0 ? '#dc2626' : 'inherit' }}>
              {stats.totalActions}
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
                  <b>{stats.totalActions} bus(es)</b> reported under action on <b>{selectedDate}</b>:
                  {stats.breakdown > 0 && <span> ⚠️ {stats.breakdown} Breakdown</span>}
                  {stats.fc > 0 && <span> · 📋 {stats.fc} FC Work</span>}
                  {stats.emergency > 0 && <span> · 🚨 {stats.emergency} Emergency</span>}
                  {stats.maintenance > 0 && <span> · 🔧 {stats.maintenance} Maintenance</span>}
                  {stats.other > 0 && <span> · ⚙️ {stats.other} Other</span>}
                </div>
                <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 500, marginTop: 2 }}>
                  Standby / alternate buses are currently deployed with cover duties.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, background: '#fee2e2', padding: '3px 10px', borderRadius: 12, fontWeight: 800 }}>
              Date-wise Actions Active
            </span>
          </div>
        )}

        {/* Toolbar: Search, Date Picker, Campus Filter */}
        <div className="card hide-on-print" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
                <input
                  type="text"
                  className="finput"
                  placeholder="🔍 Search Reg. Number, Route, Driver..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', height: 38, paddingLeft: 12 }}
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

              {/* Date-wise Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>📅 Date:</span>
                <input
                  type="date"
                  className="finput"
                  value={selectedDate}
                  onChange={e => handleDateChange(e.target.value)}
                  style={{ height: 30, padding: '2px 8px', fontSize: 12.5, border: 'none', background: 'transparent', fontWeight: 700 }}
                />
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

            {/* Quick Status Count Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('all')}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'spare' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('spare')}
                style={{ borderColor: '#0284c7', color: statusTab === 'spare' ? '#fff' : '#0284c7' }}
              >
                ⚡ Spares ({stats.spares})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'active_route' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('active_route')}
              >
                Active Route ({stats.activeRoutes})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'breakdown' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('breakdown')}
                style={{ borderColor: '#ef4444', color: statusTab === 'breakdown' ? '#fff' : '#b91c1c' }}
              >
                ⚠️ Breakdown ({stats.breakdown})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'fc' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('fc')}
                style={{ borderColor: '#3b82f6', color: statusTab === 'fc' ? '#fff' : '#1d4ed8' }}
              >
                📋 FC ({stats.fc})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'emergency' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('emergency')}
                style={{ borderColor: '#f43f5e', color: statusTab === 'emergency' ? '#fff' : '#be123c' }}
              >
                🚨 Emergency ({stats.emergency})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'maintenance' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('maintenance')}
                style={{ borderColor: '#14b8a6', color: statusTab === 'maintenance' ? '#fff' : '#0f766e' }}
              >
                🔧 Maint. ({stats.maintenance})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusTab === 'other' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusTab('other')}
                style={{ borderColor: '#64748b', color: statusTab === 'other' ? '#fff' : '#334155' }}
              >
                ⚙️ Other ({stats.other})
              </button>
            </div>
          </div>
        </div>

        {/* Main Table: S.NO, Reg. Number, Assigned Route, Driver Name, Status, Actions */}
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
      {/* ACTION & SUBSTITUTION MODAL (MATCHES USER ATTACHED IMAGE)                  */}
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
            maxWidth: 540,
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
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAction} style={{ padding: '20px' }}>
              {/* Bus Information Banner */}
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>
                    Selected Bus: <strong style={{ color: activeModalConfig.btnColor }}>{actionModal.bus.registration_number}</strong>
                  </span>
                  <span>
                    Route: <strong>{actionModal.bus.assigned_route_code || '— (Spare / Unassigned)'}</strong>
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
                  <label className="flabel"><span style={{ fontWeight: 600 }}>{activeModalConfig.label} Issue / Detail</span></label>
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
                  <optgroup label="⭐ Standby Spare Buses (Unassigned)">
                    {items
                      .filter(b => b.id !== actionModal.original_bus_id && !b.is_breakdown && !b.assigned_route_code)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          ⭐ {b.registration_number} ({b.bus_model || 'Bus'}, Seats: {b.capacity}) · [STANDBY SPARE] {b.driver_name && b.driver_name !== '—' ? `· Driver: ${b.driver_name}` : ''}
                        </option>
                      ))}
                  </optgroup>
                  {/* Second, list other normally assigned fleet buses */}
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
                  placeholder="e.g. Sent to workshop, replacement bus dispatched for morning/evening shifts."
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
