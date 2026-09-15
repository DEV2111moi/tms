import { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/UI/DataTable';

const SHIFT_MAP = {
  morning: '☀️ Morning',
  evening: '🌙 Evening',
  morning1: '☀️ Morning 1',
  morning2: '☀️ Morning 2',
  evening1: '🌙 Evening 1',
  evening2: '🌙 Evening 2'
};

const COLUMNS = [
  { key: 'route_code', label: 'Route', render: (val, item) => <b>{val} · {item.route_name}</b> },
  { key: 'institution_name', label: 'Institution' },
  { key: 'total_distance', label: 'KM', render: (val) => val ? `${val} km` : '—', mono: true },
  { key: 'shift', label: 'Shift', render: (val) => SHIFT_MAP[val] || val },
  { key: 'registration_number', label: 'Bus', mono: true },
  { key: 'driver_name', label: 'Driver' },
  { key: 'incharge_name', label: 'Bus Incharge' },
];

function SearchableSelect({ label, value, options, onChange, placeholder = "Search...", emptyText = "—", currentDriverName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0); // 0 is emptyText, 1+ are filteredOptions
  
  const selectedOption = options.find(o => String(o.value) === String(value));
  const activeDriverName = currentDriverName !== undefined ? currentDriverName : (selectedOption?.driver_name || '');
  
  const filteredOptions = options.filter(o => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.label || '').toLowerCase().includes(q) ||
      (o.searchText || '').toLowerCase().includes(q) ||
      (o.registration_number || '').toLowerCase().includes(q) ||
      (o.driver_name || '').toLowerCase().includes(q)
    );
  });
  
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [search]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % (filteredOptions.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + filteredOptions.length + 1) % (filteredOptions.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex === 0) {
        onChange('');
      } else {
        const option = filteredOptions[focusedIndex - 1];
        if (option) onChange(option.value, option);
      }
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <label className="flabel" onClick={e => e.stopPropagation()}>
      <span>{label}</span>
      <div style={{ position: 'relative' }}>
        <div 
          className="fselect" 
          onClick={toggleDropdown}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'var(--paper)',
            border: '1px solid var(--paper-2)',
            borderRadius: '4px',
            padding: '8px 12px',
            minHeight: '38px'
          }}
        >
          {selectedOption ? (
            selectedOption.driver_name !== undefined ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--navy)' }}>
                  🚌 {selectedOption.registration_number || selectedOption.label.split(' · ')[0]}
                </span>
                {activeDriverName ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '1px 7px',
                      borderRadius: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>👤</span> {activeDriverName}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    (Standby)
                  </span>
                )}
              </div>
            ) : (
              <span>{selectedOption.label}</span>
            )
          ) : (
            <span style={{ color: 'var(--text-dim)' }}>{emptyText}</span>
          )}
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: 8 }}>▼</span>
        </div>
        
        {isOpen && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: 'var(--paper)', 
              border: '1px solid var(--paper-2)', 
              borderRadius: '4px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              zIndex: 1000,
              marginTop: '4px',
              padding: '6px',
              maxHeight: '280px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <input 
              type="text" 
              className="fselect"
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ 
                marginBottom: '6px', 
                width: '100%', 
                boxSizing: 'border-box',
                padding: '7px 9px',
                fontSize: '13px'
              }}
              onClick={e => e.stopPropagation()}
            />
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div 
                style={{ 
                  padding: '6px 8px', 
                  cursor: 'pointer', 
                  fontSize: '13px',
                  borderRadius: '3px',
                  background: focusedIndex === 0 ? 'var(--paper-2)' : 'transparent',
                  fontWeight: !value ? '600' : 'normal',
                  color: 'var(--text-dim)'
                }}
                onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              >
                {emptyText}
              </div>
              {filteredOptions.map((o, sIndex) => {
                const isFocused = sIndex === (focusedIndex - 1);
                const isSelected = String(o.value) === String(value);
                const bg = isFocused 
                  ? 'var(--paper-2)' 
                  : isSelected 
                    ? 'var(--marigold-soft)' 
                    : 'transparent';

                return (
                  <div 
                    key={o.value} 
                    style={{ 
                      padding: '7px 10px', 
                      cursor: 'pointer', 
                      fontSize: '13px',
                      borderRadius: '4px',
                      background: bg,
                      color: isSelected ? 'var(--navy)' : 'inherit',
                      fontWeight: isSelected ? '600' : 'normal',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      borderBottom: '1px solid rgba(0,0,0,0.03)'
                    }}
                    onClick={() => { onChange(o.value, o); setIsOpen(false); setSearch(''); }}
                  >
                    {o.driver_name !== undefined ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 13 }}>🚌</span>
                          <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                            {o.registration_number || o.label.split(' · ')[0]}
                          </span>
                        </div>
                        {o.driver_name ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '2px 8px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>👤</span> {o.driver_name}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: '#94a3b8',
                              fontStyle: 'italic',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Standby
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{o.label}</span>
                    )}
                  </div>
                );
              })}
              {filteredOptions.length === 0 && (
                <div style={{ padding: '8px', color: 'var(--text-dim)', fontSize: '13px', fontStyle: 'italic', textAlign: 'center' }}>
                  No matching options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

export default function Assignments() {
  const [items, setItems] = useState([]);
  const [refs, setRefs] = useState({});
  const [form, setForm] = useState({
    assignment_id: null,
    route_id: '',
    shift: 'both',
    bus_id: '',
    driver_id: '',
    evening_bus_id: '',
    evening_driver_id: '',
    incharge_id: ''
  });
  const [sameForBoth, setSameForBoth] = useState(true);
  const [instFilter, setInstFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('assigned'); // 'assigned' | 'unassigned'
  const [selectedInstChip, setSelectedInstChip] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const isInst = user?.role === 'institution';

  const load = () => {
    Promise.all([
      api.assignments(),
      api.refs()
    ]).then(([a, r]) => {
      setItems(a.items || []);
      setRefs(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.route_id) { toast('Please select a route'); return; }
    try {
      if (form.shift === 'both' && !sameForBoth) {
        // Save morning 1
        await api.assign({
          route_id: form.route_id,
          shift: 'morning1',
          bus_id: form.bus_id || null,
          driver_id: form.driver_id || null,
          incharge_id: form.incharge_id || null
        });
        // Save evening 1
        await api.assign({
          route_id: form.route_id,
          shift: 'evening1',
          bus_id: form.evening_bus_id || null,
          driver_id: form.evening_driver_id || null,
          incharge_id: form.incharge_id || null
        });
      } else {
        // Standard single assign or 'both' with same bus and driver
        await api.assign({
          route_id: form.route_id,
          shift: form.shift,
          bus_id: form.bus_id || null,
          driver_id: form.driver_id || null,
          incharge_id: form.incharge_id || null
        });
      }
      toast('Assignment saved');
      setForm({ assignment_id: null, route_id: '', shift: 'both', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
      setSameForBoth(true);
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleEdit = (item) => {
    const routeAssignments = items.filter(a => a.route_id === item.route_id);
    const morningAssign = routeAssignments.find(a => a.shift === 'morning1' || a.shift === 'morning');
    const eveningAssign = routeAssignments.find(a => a.shift === 'evening1' || a.shift === 'evening');

    if (morningAssign && eveningAssign && (morningAssign.bus_id !== eveningAssign.bus_id || morningAssign.driver_id !== eveningAssign.driver_id)) {
      setForm({
        assignment_id: item.id,
        route_id: item.route_id,
        shift: 'both',
        bus_id: morningAssign.bus_id || '',
        driver_id: morningAssign.driver_id || '',
        evening_bus_id: eveningAssign.bus_id || '',
        evening_driver_id: eveningAssign.driver_id || '',
        incharge_id: item.incharge_id || ''
      });
      setSameForBoth(false);
    } else {
      setForm({
        assignment_id: item.id,
        route_id: item.route_id,
        shift: item.shift,
        bus_id: item.bus_id || '',
        driver_id: item.driver_id || '',
        evening_bus_id: '',
        evening_driver_id: '',
        incharge_id: item.incharge_id || ''
      });
      setSameForBoth(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item) => {
    const shiftLabel = SHIFT_MAP[item.shift] || item.shift;
    const routeCode = item.route_code || 'this route';
    const confirmMsg = `Are you sure you want to delete the assignment for ${routeCode} (${shiftLabel})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.deleteAssignment(item.id);
      toast(`Assignment deleted for ${routeCode}`);
      if (form.route_id === item.route_id) {
        setForm({ assignment_id: null, route_id: '', shift: 'both', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
        setSameForBoth(true);
      }
      load();
    } catch (err) {
      toast(err.message || 'Could not delete assignment');
    }
  };

  const handleDeleteForm = async () => {
    if (!form.route_id) return;
    const route = (refs.routes || []).find(r => String(r.id) === String(form.route_id));
    const routeCode = route ? route.route_code : 'this route';

    let confirmMsg = '';
    if (form.assignment_id) {
      const curAssign = items.find(a => a.id === form.assignment_id);
      const shiftLabel = curAssign ? (SHIFT_MAP[curAssign.shift] || curAssign.shift) : (SHIFT_MAP[form.shift] || form.shift);
      confirmMsg = `Are you sure you want to delete the ${shiftLabel} assignment for ${routeCode}?`;
    } else {
      confirmMsg = `Are you sure you want to delete all assignments for ${routeCode}?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      if (form.assignment_id) {
        await api.deleteAssignment(form.assignment_id);
      } else {
        const matches = items.filter(a => String(a.route_id) === String(form.route_id));
        for (const m of matches) {
          if (form.shift === 'both' || m.shift === form.shift) {
            await api.deleteAssignment(m.id);
          }
        }
      }
      toast(`Assignment deleted for ${routeCode}`);
      setForm({ assignment_id: null, route_id: '', shift: 'both', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
      setSameForBoth(true);
      load();
    } catch (err) {
      toast(err.message || 'Could not delete assignment');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  const routes = refs.routes || [];
  const buses = refs.buses || [];
  const drivers = refs.drivers || [];
  const incharges = refs.incharges || [];
  const insts = refs.institutions || [];

  const curInst = isInst ? user.institution_id : instFilter;
  const filteredRoutes = routes.filter(r => !curInst || r.institution_id == curInst || String(r.id) === String(form.route_id));
  const filteredIncharges = incharges.filter(u => !curInst || u.institution_id == curInst);

  const routeOptions = filteredRoutes.map(r => {
    const assigned = items.filter(a => a.route_id === r.id);
    const driverNames = [...new Set(assigned.map(a => a.driver_name).filter(Boolean))].join(', ');
    const hasBus = assigned.some(a => a.bus_id != null);
    const statusBadge = hasBus ? (driverNames ? ` · 👤 ${driverNames}` : '') : ' · ⚠️ Unassigned';
    return {
      value: r.id,
      label: `${r.route_code} — ${r.route_name}${statusBadge}`
    };
  });

  const busOptions = buses.map(b => {
    const assignedInItems = items.filter(a => String(a.bus_id) === String(b.id) && a.driver_name);
    // Take the latest assigned driver from items to ensure a bus only has a single driver
    const latestAssign = [...assignedInItems].reverse()[0];
    const driverName = b.driver_name || latestAssign?.driver_name || '';
    let driverId = b.driver_id || latestAssign?.driver_id || null;

    if (!driverId && driverName) {
      const dMatch = drivers.find(d => d.name.trim().toLowerCase() === driverName.trim().toLowerCase());
      if (dMatch) driverId = dMatch.id;
    }

    return {
      value: b.id,
      registration_number: b.registration_number,
      driver_name: driverName || '',
      driver_id: driverId || null,
      label: driverName ? `${b.registration_number} · 👤 ${driverName}` : `${b.registration_number} · Standby`,
      searchText: `${b.registration_number} ${driverName || ''}`
    };
  });

  const driverOptions = drivers.map(d => ({ value: d.id, label: d.name }));
  const inchargeOptions = filteredIncharges.map(u => ({ value: u.id, label: u.name }));

  const handleRouteChange = (val) => {
    if (!val) {
      setForm(prev => ({ ...prev, route_id: '', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '' }));
      return;
    }
    const existing = items.filter(a => String(a.route_id) === String(val));
    if (existing.length > 0) {
      const morning = existing.find(a => a.shift === 'morning1' || a.shift === 'morning');
      const evening = existing.find(a => a.shift === 'evening1' || a.shift === 'evening');

      const resolveBusDriverId = (busId, existingDriverId) => {
        if (existingDriverId) return String(existingDriverId);
        if (!busId) return '';
        const bOpt = busOptions.find(b => String(b.value) === String(busId));
        return bOpt?.driver_id ? String(bOpt.driver_id) : '';
      };

      if (morning && evening && (morning.bus_id !== evening.bus_id || morning.driver_id !== evening.driver_id)) {
        setSameForBoth(false);
        setForm(prev => ({
          ...prev,
          route_id: val,
          shift: 'both',
          bus_id: morning.bus_id || '',
          driver_id: resolveBusDriverId(morning.bus_id, morning.driver_id),
          evening_bus_id: evening.bus_id || '',
          evening_driver_id: resolveBusDriverId(evening.bus_id, evening.driver_id),
          incharge_id: morning.incharge_id || evening.incharge_id || prev.incharge_id
        }));
      } else {
        const first = existing[0];
        setSameForBoth(true);
        setForm(prev => ({
          ...prev,
          route_id: val,
          shift: existing.length > 1 ? 'both' : (first.shift || 'both'),
          bus_id: first.bus_id || '',
          driver_id: resolveBusDriverId(first.bus_id, first.driver_id),
          evening_bus_id: '',
          evening_driver_id: '',
          incharge_id: first.incharge_id || prev.incharge_id
        }));
      }
    } else {
      setForm(prev => ({ ...prev, route_id: val }));
    }
  };

  // Calculate unassigned routes (no bus assigned or missing session/driver)
  const allUnassignedRoutes = routes.map(r => {
    const assigned = items.filter(a => a.route_id === r.id);
    const hasBus = assigned.some(a => a.bus_id != null);
    const hasDriver = assigned.some(a => a.driver_id != null);

    // Check morning and evening shifts (supports morning, morning1, morning2, evening, evening1, evening2)
    const morningAssign = assigned.find(a => a.shift && a.shift.toLowerCase().includes('morning'));
    const eveningAssign = assigned.find(a => a.shift && a.shift.toLowerCase().includes('evening'));
    const hasMorningBus = assigned.some(a => a.bus_id != null && a.shift && a.shift.toLowerCase().includes('morning'));
    const hasEveningBus = assigned.some(a => a.bus_id != null && a.shift && a.shift.toLowerCase().includes('evening'));

    let isUnassigned = false;
    let status = 'unassigned';
    let statusLabel = '❌ No Bus Assigned';

    if (assigned.length === 0 || (!hasBus && !hasDriver)) {
      isUnassigned = true;
      status = 'no_assignment';
      statusLabel = '❌ No Bus Assigned';
    } else if (!hasBus && hasDriver) {
      isUnassigned = true;
      status = 'no_bus';
      statusLabel = '⚠️ Bus Missing';
    } else if (hasBus && !hasDriver) {
      isUnassigned = true;
      status = 'no_driver';
      statusLabel = '⚠️ Driver Missing';
    } else if (morningAssign && eveningAssign && !hasMorningBus && hasEveningBus) {
      isUnassigned = true;
      status = 'morning_missing';
      statusLabel = '⚠️ Morning Bus Missing';
    } else if (morningAssign && eveningAssign && hasMorningBus && !hasEveningBus) {
      isUnassigned = true;
      status = 'evening_missing';
      statusLabel = '⚠️ Evening Bus Missing';
    }

    const inst = insts.find(i => i.id === r.institution_id);
    const institution_name = r.institution_name || inst?.short_name || inst?.name || '—';

    return {
      ...r,
      institution_name,
      isUnassigned,
      status,
      statusLabel,
      assignedCount: assigned.length
    };
  }).filter(r => r.isUnassigned);

  const instSummaryList = insts.map(i => {
    const count = allUnassignedRoutes.filter(r => r.institution_id === i.id).length;
    return {
      id: i.id,
      name: i.short_name || i.name,
      count
    };
  });

  const activeUnassignedInst = curInst || selectedInstChip;

  const filteredUnassigned = allUnassignedRoutes.filter(r => {
    if (activeUnassignedInst && r.institution_id != activeUnassignedInst) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.route_code || '').toLowerCase().includes(q) ||
      (r.route_name || '').toLowerCase().includes(q) ||
      (r.institution_name || '').toLowerCase().includes(q) ||
      (r.origin || '').toLowerCase().includes(q) ||
      (r.destination || '').toLowerCase().includes(q) ||
      (r.statusLabel || '').toLowerCase().includes(q)
    );
  });

  const handleAssignRoute = (routeItem) => {
    if (!isInst && routeItem.institution_id) {
      setInstFilter(String(routeItem.institution_id));
    }
    handleRouteChange(routeItem.id);
    toast(`Selected ${routeItem.route_code} (${routeItem.institution_name}). Choose bus & driver.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const UNASSIGNED_COLUMNS = [
    {
      key: 'route_code',
      label: 'Route',
      render: (val, item) => (
        <div>
          <b style={{ color: 'var(--navy)' }}>{val}</b> · {item.route_name}
        </div>
      )
    },
    {
      key: 'institution_name',
      label: 'Institution',
      render: (val) => (
        <span style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: 4,
          background: 'rgba(244, 165, 33, 0.12)',
          color: '#b45309',
          fontWeight: 600,
          fontSize: 12
        }}>
          {val}
        </span>
      )
    },
    {
      key: 'stoppages',
      label: 'Stoppages (From ➔ To)',
      render: (_, item) => (
        <span style={{ fontSize: 13, color: 'var(--text-main)' }}>
          {item.origin || '—'} <span style={{ color: 'var(--marigold)', fontWeight: 'bold' }}>➔</span> {item.destination || '—'}
        </span>
      )
    },
    {
      key: 'total_distance',
      label: 'KM',
      render: (val) => (val && Number(val) > 0) ? `${Number(val).toFixed(2)} km` : '—',
      mono: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, item) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          borderRadius: 12,
          background: item.status === 'no_assignment' || item.status === 'no_bus' ? '#fee2e2' : '#fef3c7',
          color: item.status === 'no_assignment' || item.status === 'no_bus' ? '#b91c1c' : '#b45309',
          fontWeight: 700,
          fontSize: 11
        }}>
          {item.statusLabel}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, item) => (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          style={{
            padding: '5px 12px',
            fontSize: 12,
            textTransform: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
          onClick={() => handleAssignRoute(item)}
          title={`Assign bus and driver to ${item.route_code}`}
        >
          ⚡ Assign
        </button>
      )
    }
  ];

  const SHIFT_OPTIONS = [
    { key: 'morning1', label: 'Morning 1' },
    { key: 'morning2', label: 'Morning 2' },
    { key: 'evening1', label: 'Evening 1' },
    { key: 'evening2', label: 'Evening 2' },
  ];

  const getAssignShiftCount = (s) => {
    const list = items.filter(item => !curInst || item.institution_id == curInst);
    if (!s) return list.length;
    return list.filter(item => item.shift === s).length;
  };

  const filteredItems = items.filter(item => {
    if (curInst && item.institution_id && item.institution_id != curInst) return false;
    if (shiftFilter && item.shift !== shiftFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.route_code || '').toLowerCase().includes(q) ||
      (item.route_name || '').toLowerCase().includes(q) ||
      (item.driver_name || '').toLowerCase().includes(q) ||
      (item.registration_number || '').toLowerCase().includes(q) ||
      (item.institution_name || '').toLowerCase().includes(q) ||
      (item.incharge_name || '').toLowerCase().includes(q) ||
      (item.shift || '').toLowerCase().includes(q) ||
      (SHIFT_MAP[item.shift] || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Assign Route</div>
          <div className="page-sub">Standing assignment — applies daily until updated</div>
        </div>
        {allUnassignedRoutes.length > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setViewMode('unassigned');
              const el = document.getElementById('assignment-list-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: '#fef3c7',
              border: '1.5px solid #f59e0b',
              color: '#b45309',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.12)'
            }}
          >
            <span>⚠️ {allUnassignedRoutes.length} Routes Not Assigned</span>
            <span style={{ fontSize: '11px', background: '#f59e0b', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
              View List ➔
            </span>
          </button>
        )}
      </div>
      <div className="page-body">
        <form className="card" onSubmit={handleSave} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>
            {form.route_id ? 'Edit Assignment' : 'New / Update Assignment'}
          </div>
          <div className="form-grid">
            {(!isInst && insts.length > 0) && (
              <label className="flabel full">
                <span>Institution (filters routes & incharges)</span>
                <select className="fselect" value={instFilter} onChange={e => { setInstFilter(e.target.value); setForm(prev => ({ ...prev, route_id: '', incharge_id: '' })); }}>
                  <option value="">All institutions</option>
                  {insts.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
                </select>
              </label>
            )}

            <SearchableSelect
              label="Route *"
              value={form.route_id}
              options={routeOptions}
              onChange={handleRouteChange}
              placeholder="🔍 Search route code, name, or driver..."
              emptyText="Choose route"
            />

            <label className="flabel">
              <span>Apply to *</span>
              <select className="fselect" value={form.shift} required onChange={e => setForm(prev => ({ ...prev, shift: e.target.value }))}>
                <option value="both">Both sessions (morning 1 + evening 1)</option>
                <option value="morning1">Morning 1</option>
                <option value="morning2">Morning 2</option>
                <option value="evening1">Evening 1</option>
                <option value="evening2">Evening 2</option>
              </select>
            </label>

            {form.shift === 'both' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2', cursor: 'pointer', marginTop: 6, marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={sameForBoth}
                  onChange={e => setSameForBoth(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>
                  Same bus and driver for both sessions
                </span>
              </label>
            )}

            {!isInst && (
              <>
                {form.shift === 'both' && !sameForBoth ? (
                  <>
                    <SearchableSelect
                      label="Morning Bus"
                      value={form.bus_id}
                      options={busOptions}
                      currentDriverName={drivers.find(d => String(d.id) === String(form.driver_id))?.name}
                      onChange={val => {
                        const chosenBus = busOptions.find(o => String(o.value) === String(val));
                        const autoDriver = chosenBus?.driver_id ? String(chosenBus.driver_id) : '';
                        setForm(prev => ({
                          ...prev,
                          bus_id: val,
                          driver_id: autoDriver || (val ? prev.driver_id : '')
                        }));
                      }}
                      placeholder="🔍 Search morning bus number or driver..."
                    />

                    <SearchableSelect
                      label="Morning Driver"
                      value={form.driver_id}
                      options={driverOptions}
                      onChange={val => setForm(prev => ({ ...prev, driver_id: val }))}
                      placeholder="🔍 Search morning driver name..."
                    />

                    <SearchableSelect
                      label="Evening Bus"
                      value={form.evening_bus_id}
                      options={busOptions}
                      currentDriverName={drivers.find(d => String(d.id) === String(form.evening_driver_id))?.name}
                      onChange={val => {
                        const chosenBus = busOptions.find(o => String(o.value) === String(val));
                        const autoDriver = chosenBus?.driver_id ? String(chosenBus.driver_id) : '';
                        setForm(prev => ({
                          ...prev,
                          evening_bus_id: val,
                          evening_driver_id: autoDriver || (val ? prev.evening_driver_id : '')
                        }));
                      }}
                      placeholder="🔍 Search evening bus number or driver..."
                    />

                    <SearchableSelect
                      label="Evening Driver"
                      value={form.evening_driver_id}
                      options={driverOptions}
                      onChange={val => setForm(prev => ({ ...prev, evening_driver_id: val }))}
                      placeholder="🔍 Search evening driver name..."
                    />
                  </>
                ) : (
                  <>
                    <SearchableSelect
                      label="Bus"
                      value={form.bus_id}
                      options={busOptions}
                      currentDriverName={drivers.find(d => String(d.id) === String(form.driver_id))?.name}
                      onChange={val => {
                        const chosenBus = busOptions.find(o => String(o.value) === String(val));
                        const autoDriver = chosenBus?.driver_id ? String(chosenBus.driver_id) : '';
                        setForm(prev => ({
                          ...prev,
                          bus_id: val,
                          driver_id: autoDriver || (val ? prev.driver_id : '')
                        }));
                      }}
                      placeholder="🔍 Search bus number or driver..."
                    />

                    <SearchableSelect
                      label="Driver"
                      value={form.driver_id}
                      options={driverOptions}
                      onChange={val => setForm(prev => ({ ...prev, driver_id: val }))}
                      placeholder="🔍 Search driver name..."
                    />
                  </>
                )}
              </>
            )}

            <div className="full">
              <SearchableSelect
                label="Bus Incharge"
                value={form.incharge_id}
                options={inchargeOptions}
                onChange={val => setForm(prev => ({ ...prev, incharge_id: val }))}
                placeholder="🔍 Search incharge name..."
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            {form.route_id && (
              <>
                <button type="button" className="btn btn-sm btn-outline"
                  onClick={() => {
                    setForm({ assignment_id: null, route_id: '', shift: 'both', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
                    setSameForBoth(true);
                  }}>
                  Cancel edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleDeleteForm}
                  style={{
                    borderColor: '#ef4444',
                    color: '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Delete this assignment and make route unassigned"
                >
                  <span>🗑️</span> Delete assignment
                </button>
              </>
            )}
            <button className="btn btn-sm btn-primary" type="submit">Save assignment</button>
          </div>
        </form>

        <div id="assignment-list-section" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 12, 
          marginTop: 28, 
          marginBottom: 14 
        }}>
          {/* Toggle buttons: Assigned vs Unassigned */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('assigned')}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px'
              }}
            >
              <span>📋 Current Assignments</span>
              <span style={{
                background: viewMode === 'assigned' ? 'rgba(0,0,0,0.15)' : 'var(--paper-2)',
                color: viewMode === 'assigned' ? 'var(--navy)' : 'inherit',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700
              }}>
                {filteredItems.length}
              </span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'unassigned' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setViewMode('unassigned')}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                ...(viewMode === 'unassigned'
                  ? { background: '#d97706', borderColor: '#d97706', color: '#fff' }
                  : { borderColor: '#f59e0b', color: '#b45309', background: 'rgba(245, 158, 11, 0.08)' })
              }}
            >
              <span>⚠️ Unassigned Routes</span>
              <span style={{
                background: viewMode === 'unassigned' ? 'rgba(0,0,0,0.25)' : '#f59e0b',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700
              }}>
                {filteredUnassigned.length}
              </span>
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <input
              type="text"
              className="fselect"
              placeholder={viewMode === 'unassigned' ? "🔍 Search unassigned route, institution..." : "🔍 Search route, driver, bus..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: searchQuery ? 30 : 12, borderRadius: 6, background: '#fff' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-dim)',
                  fontSize: 14,
                  padding: 2
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Shift filter chips when on Current Assignments */}
        {viewMode === 'assigned' && (
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
              All Shifts ({items.filter(item => !curInst || item.institution_id == curInst).length})
            </button>
            {SHIFT_OPTIONS.map(s => {
              const isSelected = shiftFilter === s.key;
              const count = getAssignShiftCount(s.key);
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
        )}

        {/* Filter chips when on Unassigned Routes: Shift filter for Institution, Institution filter for Admin */}
        {viewMode === 'unassigned' && (
          isInst ? (
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
                All Shifts ({allUnassignedRoutes.length})
              </button>
              {SHIFT_OPTIONS.map(s => {
                const isSelected = shiftFilter === s.key;
                const count = allUnassignedRoutes.filter(r => r.shift === s.key).length;
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
          ) : (
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
              Filter by Institution:
            </span>
            <button
              type="button"
              onClick={() => { setSelectedInstChip(''); if (!isInst) setInstFilter(''); }}
              style={{
                padding: '4px 11px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: (!activeUnassignedInst) ? 'var(--navy)' : 'var(--paper-2)',
                background: (!activeUnassignedInst) ? 'var(--navy)' : '#fff',
                color: (!activeUnassignedInst) ? '#fff' : 'var(--ink)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All Institutions ({allUnassignedRoutes.length})
            </button>
            {instSummaryList.map(item => {
              const isSelected = String(activeUnassignedInst) === String(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedInstChip('');
                      if (!isInst) setInstFilter('');
                    } else {
                      setSelectedInstChip(item.id);
                      if (!isInst) setInstFilter(String(item.id));
                    }
                  }}
                  style={{
                    padding: '4px 11px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: isSelected ? '#d97706' : 'var(--paper-2)',
                    background: isSelected ? '#d97706' : '#fff',
                    color: isSelected ? '#fff' : (item.count > 0 ? 'var(--ink)' : 'var(--text-dim)'),
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                    opacity: item.count === 0 ? 0.6 : 1
                  }}
                >
                  <span>{item.name}</span>
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: 11,
                    background: isSelected ? 'rgba(0,0,0,0.2)' : (item.count > 0 ? '#fee2e2' : '#f3f4f6'),
                    color: isSelected ? '#fff' : (item.count > 0 ? '#b91c1c' : '#6b7280'),
                    fontWeight: 700
                  }}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
          )
        )}

        {viewMode === 'assigned' ? (
          <DataTable
            columns={COLUMNS}
            data={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyIcon="🔗"
            emptyText={searchQuery ? 'No matching assignments found.' : 'No assignments set up.'}
          />
        ) : (
          <DataTable
            columns={UNASSIGNED_COLUMNS}
            data={filteredUnassigned}
            emptyIcon="🎉"
            emptyText={searchQuery ? 'No matching unassigned routes found.' : 'All routes have buses assigned! Great job!'}
          />
        )}
      </div>
    </>
  );
}
