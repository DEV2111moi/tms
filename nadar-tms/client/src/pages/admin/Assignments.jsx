import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/UI/DataTable';

function AssignIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    badge: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></>,
    route: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/></>,
    printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    refresh: <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
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
      {icons[name] || icons.clipboard}
    </svg>
  );
}

const SHIFT_MAP = {
  morning: 'Morning',
  evening: 'Evening',
  morning1: 'Morning 1',
  morning2: 'Morning 2',
  morning3: 'Morning 3',
  morning4: 'Morning 4',
  evening1: 'Evening 1',
  evening2: 'Evening 2',
  evening3: 'Evening 3',
  evening4: 'Evening 4'
};

const PRESET_COMBINATIONS = [
  { value: 'm1_e1', label: 'Both sessions (Morning 1 + Evening 1)', shifts: ['morning1', 'evening1'] },
  { value: 'm1_e2', label: 'Morning 1 + Evening 2', shifts: ['morning1', 'evening2'] },
  { value: 'm2_e1', label: 'Morning 2 + Evening 1', shifts: ['morning2', 'evening1'] },
  { value: 'm2_e2', label: 'Morning 2 + Evening 2', shifts: ['morning2', 'evening2'] },
  { value: 'all_m', label: 'All 4 Morning (M1-M4)', shifts: ['morning1', 'morning2', 'morning3', 'morning4'] },
  { value: 'all_e', label: 'All 4 Evening (E1-E4)', shifts: ['evening1', 'evening2', 'evening3', 'evening4'] },
  { value: 'all', label: 'All 8 sessions (M1-M4, E1-E4)', shifts: ['morning1', 'morning2', 'morning3', 'morning4', 'evening1', 'evening2', 'evening3', 'evening4'] },
  { value: 'morning1', label: 'Morning 1 only', shifts: ['morning1'] },
  { value: 'morning2', label: 'Morning 2 only', shifts: ['morning2'] },
  { value: 'morning3', label: 'Morning 3 only', shifts: ['morning3'] },
  { value: 'morning4', label: 'Morning 4 only', shifts: ['morning4'] },
  { value: 'evening1', label: 'Evening 1 only', shifts: ['evening1'] },
  { value: 'evening2', label: 'Evening 2 only', shifts: ['evening2'] },
  { value: 'evening3', label: 'Evening 3 only', shifts: ['evening3'] },
  { value: 'evening4', label: 'Evening 4 only', shifts: ['evening4'] },
];

const getSelectValue = (shifts) => {
  if (!shifts || shifts.length === 0) return 'custom';
  for (const preset of PRESET_COMBINATIONS) {
    if (preset.shifts.length === shifts.length && preset.shifts.every(s => shifts.includes(s))) {
      return preset.value;
    }
  }
  return 'custom';
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
    <label className="flabel" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <div 
          className="fselect" 
          onClick={toggleDropdown}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: '#ffffff',
            border: isOpen ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
            borderRadius: '8px',
            padding: '9px 12px',
            minHeight: '40px',
            boxShadow: isOpen ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          {selectedOption ? (
            selectedOption.driver_name !== undefined ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <AssignIcon name="bus" size={14} color="#1d4ed8" /> {selectedOption.registration_number || selectedOption.label.split(' · ')[0]}
                </span>
                {activeDriverName ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '2px 7px',
                      borderRadius: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <AssignIcon name="user" size={11} color="#1d4ed8" /> {activeDriverName}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                    (Standby)
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOption.label}</span>
            )
          ) : (
            <span style={{ color: '#94a3b8' }}>{emptyText}</span>
          )}
          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: 8 }}>▼</span>
        </div>
        
        {isOpen && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: '#ffffff', 
              border: '1.5px solid #e2e8f0', 
              borderRadius: '8px',
              boxShadow: '0 12px 28px -4px rgba(0,0,0,0.18)',
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
                          <span style={{ fontSize: 13 }}>
                            {o.vehicle_type === 'tractor' ? '🚜' : o.vehicle_type === 'winger' ? '🚐' : '🚌'}
                          </span>
                          <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                            {o.registration_number || o.label.split(' · ')[0]}
                          </span>
                          {o.vehicle_type === 'winger' && (
                            <span style={{ fontSize: 9.5, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '1px 5px', borderRadius: 3 }}>
                              Winger
                            </span>
                          )}
                          {o.vehicle_type === 'tractor' && (
                            <span style={{ fontSize: 9.5, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1px 5px', borderRadius: 3 }}>
                              Tractor (Non-Route)
                            </span>
                          )}
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
    shift: 'm1_e1',
    bus_id: '',
    driver_id: '',
    evening_bus_id: '',
    evening_driver_id: '',
    incharge_id: ''
  });
  const [selectedShifts, setSelectedShifts] = useState(['morning1', 'evening1']);
  const [sameForBoth, setSameForBoth] = useState(true);
  const [instFilter, setInstFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('assigned'); // 'assigned' | 'unassigned'
  const [selectedInstChip, setSelectedInstChip] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('assigned'); // 'assigned' | 'unassigned'
  const [reportInst, setReportInst] = useState('all');
  const [reportShift, setReportShift] = useState('all');
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

  const handleShiftSelectChange = (val) => {
    if (val === 'custom') return;
    const match = PRESET_COMBINATIONS.find(p => p.value === val);
    if (match) {
      setSelectedShifts(match.shifts);
      setForm(prev => ({ ...prev, shift: val }));
    }
  };

  const handleToggleShift = (shiftKey) => {
    if (selectedShifts.includes(shiftKey) && selectedShifts.length <= 1) {
      toast('At least one session must be selected');
      return;
    }
    const next = selectedShifts.includes(shiftKey)
      ? selectedShifts.filter(s => s !== shiftKey)
      : [...selectedShifts, shiftKey];

    setSelectedShifts(next);
    const presetVal = getSelectValue(next);
    setForm(f => ({ ...f, shift: presetVal }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.route_id) { toast('Please select a route'); return; }
    if (!selectedShifts || selectedShifts.length === 0) { toast('Please select at least one session'); return; }

    const isTractor = (busId) => {
      const found = buses.find(b => String(b.id) === String(busId));
      return (found?.vehicle_type || '').toLowerCase() === 'tractor';
    };
    if (isTractor(form.bus_id) || (!sameForBoth && isTractor(form.evening_bus_id))) {
      toast('🚜 Tractors are campus utility units and cannot be assigned to student routes. Please select a Bus or Winger.');
      return;
    }

    const checkActiveDriver = (driverId, shiftTitle) => {
      if (!driverId) return true;
      const d = drivers.find(drv => String(drv.id) === String(driverId));
      if (d && (d.status || 'active').toLowerCase() === 'inactive') {
        toast(`⚠️ Cannot assign route: Driver ${d.name} (${shiftTitle}) is Inactive. Please activate driver first.`);
        return false;
      }
      return true;
    };

    if (!checkActiveDriver(form.driver_id, 'Morning')) return;
    if (!sameForBoth && !checkActiveDriver(form.evening_driver_id, 'Evening')) return;

    try {
      const mShifts = selectedShifts.filter(s => s.toLowerCase().includes('morning'));
      const eShifts = selectedShifts.filter(s => s.toLowerCase().includes('evening'));

      if (!sameForBoth && mShifts.length > 0 && eShifts.length > 0) {
        // Save morning shifts
        for (const sh of mShifts) {
          await api.assign({
            route_id: form.route_id,
            shift: sh,
            bus_id: form.bus_id || null,
            driver_id: form.driver_id || null,
            incharge_id: form.incharge_id || null
          });
        }
        // Save evening shifts
        for (const sh of eShifts) {
          await api.assign({
            route_id: form.route_id,
            shift: sh,
            bus_id: form.evening_bus_id || null,
            driver_id: form.evening_driver_id || null,
            incharge_id: form.incharge_id || null
          });
        }
      } else {
        // Standard assign for all selected shifts with same bus & driver
        await api.assign({
          route_id: form.route_id,
          shifts: selectedShifts,
          bus_id: form.bus_id || null,
          driver_id: form.driver_id || null,
          incharge_id: form.incharge_id || null
        });
      }
      toast('Assignment saved');
      setForm({ assignment_id: null, route_id: '', shift: 'm1_e1', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
      setSelectedShifts(['morning1', 'evening1']);
      setSameForBoth(true);
      load();
    } catch (err) {
      toast(err.message || 'Could not save assignment');
    }
  };

  const handleEdit = (item) => {
    const routeAssignments = items.filter(a => a.route_id === item.route_id);
    const morningAssign = routeAssignments.find(a => a.shift && a.shift.toLowerCase().includes('morning'));
    const eveningAssign = routeAssignments.find(a => a.shift && a.shift.toLowerCase().includes('evening'));

    const routeShifts = routeAssignments.map(a => a.shift).filter(Boolean);
    const activeShifts = routeShifts.length > 0 ? routeShifts : [item.shift || 'morning1'];
    setSelectedShifts(activeShifts);
    const presetVal = getSelectValue(activeShifts);

    if (morningAssign && eveningAssign && (morningAssign.bus_id !== eveningAssign.bus_id || morningAssign.driver_id !== eveningAssign.driver_id)) {
      setForm({
        assignment_id: item.id,
        route_id: item.route_id,
        shift: presetVal,
        bus_id: morningAssign.bus_id || '',
        driver_id: morningAssign.driver_id || '',
        evening_bus_id: eveningAssign.bus_id || '',
        evening_driver_id: eveningAssign.driver_id || '',
        incharge_id: item.incharge_id || ''
      });
      setSameForBoth(false);
    } else {
      const currentAss = routeAssignments.find(a => a.id === item.id) || item;
      setForm({
        assignment_id: item.id,
        route_id: item.route_id,
        shift: presetVal,
        bus_id: currentAss.bus_id || '',
        driver_id: currentAss.driver_id || '',
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
        setForm({ assignment_id: null, route_id: '', shift: 'm1_e1', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
        setSelectedShifts(['morning1', 'evening1']);
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
      confirmMsg = `Are you sure you want to delete selected sessions for ${routeCode}?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      if (form.assignment_id) {
        await api.deleteAssignment(form.assignment_id);
      } else {
        const matches = items.filter(a => String(a.route_id) === String(form.route_id));
        for (const m of matches) {
          if (selectedShifts.includes(m.shift)) {
            await api.deleteAssignment(m.id);
          }
        }
      }
      toast(`Assignment deleted for ${routeCode}`);
      setForm({ assignment_id: null, route_id: '', shift: 'm1_e1', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
      setSelectedShifts(['morning1', 'evening1']);
      setSameForBoth(true);
      load();
    } catch (err) {
      toast(err.message || 'Could not delete assignment');
    }
  };

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
    const statusBadge = hasBus ? (driverNames ? ` · ${driverNames}` : '') : ' · Unassigned';
    return {
      value: r.id,
      label: `${r.route_code} — ${r.route_name}${statusBadge}`,
      searchText: `${r.route_code} ${r.route_name || ''} ${r.stops_list || ''} ${driverNames}`
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

    const vt = (b.vehicle_type || 'bus').toLowerCase();

    return {
      value: b.id,
      registration_number: b.registration_number,
      vehicle_type: vt,
      driver_name: driverName || '',
      driver_id: driverId || null,
      label: driverName ? `${b.registration_number} · ${driverName}` : `${b.registration_number} · Standby`,
      searchText: `${b.registration_number} ${driverName || ''} ${vt}`
    };
  });
  const driverOptions = drivers
    .filter(d => {
      const isActive = (d.status || 'active').toLowerCase() === 'active';
      const isSelected = String(d.id) === String(form.driver_id) || String(d.id) === String(form.evening_driver_id);
      return isActive || isSelected;
    })
    .map(d => {
      const isActive = (d.status || 'active').toLowerCase() === 'active';
      return {
        value: d.id,
        label: !isActive 
          ? `🚫 ${d.name} (INACTIVE - Cannot Assign)` 
          : d.driver_type === 'spare' 
            ? `🔄 ${d.name} (Spare Driver)` 
            : d.name
      };
    });
  const inchargeOptions = filteredIncharges.map(u => ({ value: u.id, label: u.name }));

  const handleRouteChange = (val) => {
    if (!val) {
      setForm(prev => ({ ...prev, route_id: '', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '' }));
      return;
    }
    const existing = items.filter(a => String(a.route_id) === String(val));
    if (existing.length > 0) {
      const activeShifts = existing.map(a => a.shift).filter(Boolean);
      const newSelectedShifts = activeShifts.length > 0 ? activeShifts : ['morning1', 'evening1'];
      setSelectedShifts(newSelectedShifts);
      const presetVal = getSelectValue(newSelectedShifts);

      const morning = existing.find(a => a.shift && a.shift.toLowerCase().includes('morning'));
      const evening = existing.find(a => a.shift && a.shift.toLowerCase().includes('evening'));

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
          shift: presetVal,
          bus_id: morning.bus_id || '',
          driver_id: resolveBusDriverId(morning.bus_id, morning.driver_id),
          evening_bus_id: evening.bus_id || '',
          evening_driver_id: resolveBusDriverId(evening.bus_id, evening.driver_id),
          incharge_id: morning.incharge_id || evening.incharge_id || prev.incharge_id
        }));
      } else {
        const first = morning || evening || existing[0];
        setSameForBoth(true);
        setForm(prev => ({
          ...prev,
          route_id: val,
          shift: presetVal,
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
            gap: 5,
            fontWeight: 700
          }}
          onClick={() => handleAssignRoute(item)}
          title={`Assign bus and driver to ${item.route_code}`}
        >
          <AssignIcon name="zap" size={13} color="#fff" /> Assign
        </button>
      )
    }
  ];

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

  const morningShifts = selectedShifts.filter(s => s.toLowerCase().includes('morning'));
  const eveningShifts = selectedShifts.filter(s => s.toLowerCase().includes('evening'));
  const morningLabel = morningShifts.map(s => SHIFT_MAP[s] || s).join(' + ') || 'Morning';
  const eveningLabel = eveningShifts.map(s => SHIFT_MAP[s] || s).join(' + ') || 'Evening';
  const hasMultipleSessions = selectedShifts.length > 1;
  const isSplitSessions = hasMultipleSessions && !sameForBoth && morningShifts.length > 0 && eveningShifts.length > 0;

  const selectedRoute = routes.find(r => String(r.id) === String(form.route_id));
  const existingRouteAssignments = selectedRoute ? items.filter(a => String(a.route_id) === String(selectedRoute.id)) : [];
  const isRouteAlreadyAssigned = existingRouteAssignments.length > 0;

  // KPI Calculations
  const stats = useMemo(() => {
    const total = items.length;
    const uniqueBuses = new Set(items.map(a => a.bus_id).filter(Boolean)).size;
    const uniqueDrivers = new Set(items.map(a => a.driver_id).filter(Boolean)).size;
    const uniqueIncharges = new Set(items.map(a => a.incharge_id).filter(Boolean)).size;
    const unassigned = allUnassignedRoutes.length;
    return { total, uniqueBuses, uniqueDrivers, uniqueIncharges, unassigned };
  }, [items, allUnassignedRoutes]);

  // Helper: Open Print Window and Trigger Native Browser PDF Printing
  const printReportWindow = (title, htmlBody, landscape = true) => {
    const printWin = window.open('', '_blank', 'width=1180,height=820');
    if (!printWin) {
      alert('Please allow popups in your browser to print / save the PDF report.');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: ${landscape ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm 8mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            padding: 14px;
            margin: 0;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.45;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-header {
            text-align: center;
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .inst-name {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }
          .report-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin: 0 0 3px 0;
          }
          .report-subtitle {
            font-size: 11px;
            color: #475569;
            font-weight: 500;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 14px;
            font-size: 10.5px;
          }
          .kpi-row {
            display: flex;
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            flex: 1;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 8px 10px;
            border-radius: 6px;
            text-align: center;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }
          .kpi-lbl {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 18px;
            table-layout: auto;
          }
          thead {
            display: table-header-group;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9.5px;
            letter-spacing: 0.4px;
            border: 1px solid #94a3b8;
            padding: 8px 6px;
            text-align: left;
            vertical-align: middle;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 7px 6px;
            vertical-align: middle;
            color: #1e293b;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
          .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 10px;
          }
          .tag-pill {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 32px;
            padding-top: 14px;
            page-break-inside: avoid;
          }
          .sig-box {
            text-align: center;
            width: 190px;
            border-top: 1.5px solid #0f172a;
            padding-top: 5px;
            font-size: 10.5px;
            font-weight: 600;
            color: #1e293b;
          }
          .sig-title {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 500;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 450);
  };

  // 1. Generate Assigned Routes PDF Report
  const handlePrintAssignedReport = (customScope = null) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    let assignedList = items;
    if (customScope?.inst && customScope.inst !== 'all') {
      assignedList = assignedList.filter(a => String(a.institution_id) === String(customScope.inst));
    } else if (curInst) {
      assignedList = assignedList.filter(a => String(a.institution_id) === String(curInst));
    }

    if (customScope?.shift && customScope.shift !== 'all') {
      assignedList = assignedList.filter(a => a.shift === customScope.shift);
    } else if (shiftFilter) {
      assignedList = assignedList.filter(a => a.shift === shiftFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      assignedList = assignedList.filter(item =>
        (item.route_code || '').toLowerCase().includes(q) ||
        (item.route_name || '').toLowerCase().includes(q) ||
        (item.driver_name || '').toLowerCase().includes(q) ||
        (item.registration_number || '').toLowerCase().includes(q) ||
        (item.institution_name || '').toLowerCase().includes(q) ||
        (item.incharge_name || '').toLowerCase().includes(q)
      );
    }

    if (assignedList.length === 0) {
      toast('No route assignments found for the selected scope.');
      return;
    }

    const targetInstId = customScope?.inst && customScope.inst !== 'all' ? customScope.inst : curInst;
    const activeInst = (refs.institutions || []).find(i => String(i.id) === String(targetInstId));
    const instTitle = activeInst 
      ? (activeInst.name || activeInst.short_name).toUpperCase() 
      : 'THENI MELAPETTAI HINDU NADARGAL URAVINMURAI (TMHNU) — CENTRAL FLEET MANAGEMENT';

    const uniqueBuses = new Set(assignedList.map(a => a.bus_id).filter(Boolean)).size;
    const uniqueDrivers = new Set(assignedList.map(a => a.driver_id).filter(Boolean)).size;
    const uniqueIncharges = new Set(assignedList.map(a => a.incharge_id).filter(Boolean)).size;
    const totalKm = assignedList.reduce((acc, a) => acc + (Number(a.total_distance) || 0), 0);

    const rowsHtml = assignedList.map((a, idx) => {
      const drv = (refs.drivers || []).find(d => Number(d.id) === Number(a.driver_id));
      const busObj = (refs.buses || []).find(b => Number(b.id) === Number(a.bus_id));
      const shiftName = SHIFT_MAP[a.shift] || a.shift || '—';
      const isMorning = a.shift && a.shift.toLowerCase().includes('morning');

      return `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #64748b;" class="mono">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; color: #0f172a; font-size: 11px;" class="mono">${a.route_code || '—'}</div>
            <div style="font-size: 9.5px; color: #334155; font-weight: 600;">${a.route_name || ''}</div>
          </td>
          <td>
            <span class="tag-pill" style="background: ${isMorning ? '#e0f2fe' : '#fef3c7'}; color: ${isMorning ? '#0369a1' : '#b45309'}; border: 1px solid ${isMorning ? '#bae6fd' : '#fde68a'};">
              ${isMorning ? '☀️' : '🌙'} ${shiftName}
            </span>
          </td>
          <td>
            ${a.registration_number ? `
              <span class="mono" style="font-weight: 800; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 4px; display: inline-block;">
                🚌 ${a.registration_number}
              </span>
              ${busObj?.vehicle_type ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${busObj.vehicle_type} (${busObj.seating_capacity || 40} Seats)</div>` : ''}
            ` : `<span style="color: #dc2626; font-style: italic; font-weight: 600;">❌ No Bus</span>`}
          </td>
          <td>
            ${a.driver_name ? `
              <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${a.driver_name}</div>
              ${drv?.phone ? `<div class="mono" style="font-size: 9.5px; color: #2563eb; margin-top: 1px;">📞 ${drv.phone}</div>` : ''}
              ${drv?.driver_type === 'spare' ? `<span class="tag-pill" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; margin-top: 2px;">🔄 Spare Pilot</span>` : ''}
            ` : `<span style="color: #dc2626; font-style: italic; font-weight: 600;">⚠️ No Driver</span>`}
          </td>
          <td>
            ${a.incharge_name ? `
              <div style="font-weight: 600; color: #1e293b;">${a.incharge_name}</div>
              <div style="font-size: 8.5px; color: #64748b;">Faculty Escort</div>
            ` : `<span style="color: #94a3b8; font-style: italic;">— None —</span>`}
          </td>
          <td style="font-weight: 600; color: #334155;">
            ${a.institution_name || 'Central Roster'}
          </td>
          <td>
            <div style="font-size: 10px; color: #1e293b;">
              <span>${a.origin || '—'}</span>
              <span style="color: #d97706; font-weight: bold; margin: 0 4px;">➔</span>
              <span>${a.destination || '—'}</span>
            </div>
            ${a.boarding_time || a.end_time ? `
              <div class="mono" style="font-size: 9px; color: #64748b; margin-top: 2px;">
                ⏱️ ${a.boarding_time ? a.boarding_time.slice(0, 5) : '—'} - ${a.end_time ? a.end_time.slice(0, 5) : '—'}
              </div>
            ` : ''}
          </td>
          <td style="text-align: center;" class="mono">
            <b>${a.total_distance ? `${a.total_distance} km` : '—'}</b>
          </td>
        </tr>
      `;
    }).join('');

    const htmlBody = `
      <div class="report-header">
        <div class="inst-name">${instTitle}</div>
        <div class="report-title" style="color: #1e3a8a;">ROUTE ASSIGNMENTS & FLEET DEPLOYMENT REPORT</div>
        <div class="report-subtitle">Standing Master Register of Buses, Drivers & Faculty Incharges Mapped to Daily Operational Routes</div>
      </div>

      <div class="meta-row">
        <div><b>Scope:</b> ${activeInst ? (activeInst.name || activeInst.short_name) : 'All Campuses / Central Network'} &bull; <b>Active Mappings:</b> ${assignedList.length} Total</div>
        <div><b>Generated:</b> ${timestamp} &bull; <b>Generated By:</b> ${user?.name || 'Transport Admin'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #3b82f6;">
          <div class="kpi-val" style="color: #1d4ed8;">${assignedList.length}</div>
          <div class="kpi-lbl">Active Mappings</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #0284c7;">${uniqueBuses}</div>
          <div class="kpi-lbl">Buses in Service</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #16a34a;">${uniqueDrivers}</div>
          <div class="kpi-lbl">Drivers on Duty</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #7c6cfc;">${uniqueIncharges}</div>
          <div class="kpi-lbl">Faculty Incharges</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #d97706;">${totalKm.toFixed(1)} km</div>
          <div class="kpi-lbl">Total Route Mileage</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th style="width: 170px;">Route Details</th>
            <th style="width: 95px;">Shift / Session</th>
            <th style="width: 125px;">Assigned Bus</th>
            <th style="width: 145px;">Assigned Driver</th>
            <th style="width: 120px;">Bus Incharge</th>
            <th style="width: 110px;">Institution</th>
            <th style="width: 175px;">Stoppages & Timings</th>
            <th style="width: 55px; text-align: center;">Distance</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          <div>Prepared By</div>
          <div class="sig-title">Transport Operations Assistant</div>
        </div>
        <div class="sig-box">
          <div>Verified By</div>
          <div class="sig-title">Transport Manager / Fleet Incharge</div>
        </div>
        <div class="sig-box">
          <div>Approved By</div>
          <div class="sig-title">Principal / Fleet Director</div>
        </div>
      </div>
    `;

    printReportWindow(`Route Assignments Report - ${instTitle}`, htmlBody, true);
  };

  // 2. Generate Unassigned Routes Deficit PDF Report
  const handlePrintUnassignedReport = (customScope = null) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    let unassignedList = allUnassignedRoutes;
    if (customScope?.inst && customScope.inst !== 'all') {
      unassignedList = unassignedList.filter(r => String(r.institution_id) === String(customScope.inst));
    } else if (activeUnassignedInst) {
      unassignedList = unassignedList.filter(r => String(r.institution_id) === String(activeUnassignedInst));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      unassignedList = unassignedList.filter(r =>
        (r.route_code || '').toLowerCase().includes(q) ||
        (r.route_name || '').toLowerCase().includes(q) ||
        (r.institution_name || '').toLowerCase().includes(q) ||
        (r.origin || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q)
      );
    }

    if (unassignedList.length === 0) {
      toast('All routes in the selected scope are fully assigned!');
      return;
    }

    const targetInstId = customScope?.inst && customScope.inst !== 'all' ? customScope.inst : activeUnassignedInst;
    const activeInst = (refs.institutions || []).find(i => String(i.id) === String(targetInstId));
    const instTitle = activeInst 
      ? (activeInst.name || activeInst.short_name).toUpperCase() 
      : 'THENI MELAPETTAI HINDU NADARGAL URAVINMURAI (TMHNU) — CENTRAL FLEET MANAGEMENT';

    const noAssignmentCount = unassignedList.filter(r => r.status === 'no_assignment').length;
    const noDriverCount = unassignedList.filter(r => r.status === 'no_driver').length;
    const noBusCount = unassignedList.filter(r => r.status === 'no_bus' || r.status.includes('missing')).length;
    const totalKm = unassignedList.reduce((acc, r) => acc + (Number(r.total_distance) || 0), 0);

    const rowsHtml = unassignedList.map((r, idx) => {
      const statusColor = r.status === 'no_assignment' ? '#b91c1c' : '#c2410c';
      const statusBg = r.status === 'no_assignment' ? '#fee2e2' : '#ffedd5';
      const statusBorder = r.status === 'no_assignment' ? '#fca5a5' : '#fed7aa';

      return `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #64748b;" class="mono">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; color: #0f172a; font-size: 11px;" class="mono">${r.route_code || '—'}</div>
            <div style="font-size: 9.5px; color: #334155; font-weight: 600;">${r.route_name || ''}</div>
          </td>
          <td>
            <span class="tag-pill" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">
              ${r.institution_name || 'Central Roster'}
            </span>
          </td>
          <td>
            <div style="font-size: 10px; color: #1e293b;">
              <span>${r.origin || '—'}</span>
              <span style="color: #d97706; font-weight: bold; margin: 0 4px;">➔</span>
              <span>${r.destination || '—'}</span>
            </div>
            ${r.stops_list ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">Stops: ${r.stops_list.split(',').slice(0, 3).join(', ')}...</div>` : ''}
          </td>
          <td>
            ${r.initial_point ? `
              <div style="font-size: 10px; font-weight: 600; color: #0f172a;">${r.initial_point}</div>
              ${r.initial_time ? `<div class="mono" style="font-size: 9.5px; color: #2563eb;">⏰ ${r.initial_time.slice(0, 5)}</div>` : ''}
            ` : `<span style="color: #94a3b8; font-style: italic;">—</span>`}
          </td>
          <td style="text-align: center;" class="mono">
            <b>${r.total_distance ? `${r.total_distance} km` : '—'}</b>
          </td>
          <td>
            <span class="tag-pill" style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; font-weight: 800;">
              ${r.statusLabel || 'Unassigned'}
            </span>
          </td>
          <td>
            <span style="font-size: 9.5px; color: #475569; font-weight: 600;">
              ${r.assignedCount ? `⚠️ ${r.assignedCount} session(s) mapped` : '❌ 0 sessions mapped'}
            </span>
          </td>
          <td>
            <span style="font-size: 9.5px; color: #b91c1c; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
              ⚡ Urgent Fleet Allocation
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlBody = `
      <div class="report-header">
        <div class="inst-name">${instTitle}</div>
        <div class="report-title" style="color: #c2410c;">UNASSIGNED ROUTES & FLEET DEFICIT REPORT</div>
        <div class="report-subtitle">Priority Action Register of Operational Routes Lacking Bus, Driver, or Shift Allocation</div>
      </div>

      <div class="meta-row">
        <div><b>Scope:</b> ${activeInst ? (activeInst.name || activeInst.short_name) : 'All Campuses / Central Network'} &bull; <b>Deficit Slots:</b> ${unassignedList.length} Routes Requiring Action</div>
        <div><b>Generated:</b> ${timestamp} &bull; <b>Generated By:</b> ${user?.name || 'Transport Admin'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #ea580c;">
          <div class="kpi-val" style="color: #c2410c;">${unassignedList.length}</div>
          <div class="kpi-lbl">Unassigned Routes</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #dc2626;">${noAssignmentCount}</div>
          <div class="kpi-lbl">Missing Bus & Driver</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #d97706;">${noDriverCount}</div>
          <div class="kpi-lbl">Driver Missing</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #7c6cfc;">${noBusCount}</div>
          <div class="kpi-lbl">Bus Missing / Shift Gap</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #2563eb;">${totalKm.toFixed(1)} km</div>
          <div class="kpi-lbl">Uncovered Distance</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th style="width: 175px;">Route Code & Name</th>
            <th style="width: 110px;">Institution</th>
            <th style="width: 180px;">Stoppages (From ➔ To)</th>
            <th style="width: 110px;">Initial Point</th>
            <th style="width: 55px; text-align: center;">Distance</th>
            <th style="width: 130px;">Deficit Status</th>
            <th style="width: 105px;">Coverage</th>
            <th style="width: 135px;">Action Required</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          <div>Prepared By</div>
          <div class="sig-title">Transport Operations Assistant</div>
        </div>
        <div class="sig-box">
          <div>Verified By</div>
          <div class="sig-title">Transport Manager / Fleet Incharge</div>
        </div>
        <div class="sig-box">
          <div>Approved By</div>
          <div class="sig-title">Principal / Fleet Director</div>
        </div>
      </div>
    `;

    printReportWindow(`Unassigned Routes Report - ${instTitle}`, htmlBody, true);
  };

  // 3. Export Assigned Routes to CSV
  // 3. Export Assigned Routes to CSV
  const handleExportAssignedCSV = (customScope = null) => {
    let baseList = items;
    if (customScope?.inst && customScope.inst !== 'all') {
      baseList = baseList.filter(a => String(a.institution_id) === String(customScope.inst));
    } else if (curInst) {
      baseList = baseList.filter(a => String(a.institution_id) === String(curInst));
    }

    if (customScope?.shift && customScope.shift !== 'all') {
      baseList = baseList.filter(a => a.shift === customScope.shift);
    } else if (shiftFilter) {
      baseList = baseList.filter(a => a.shift === shiftFilter);
    }

    if (searchQuery && !customScope) {
      const q = searchQuery.toLowerCase().trim();
      baseList = baseList.filter(item =>
        (item.route_code || '').toLowerCase().includes(q) ||
        (item.route_name || '').toLowerCase().includes(q) ||
        (item.driver_name || '').toLowerCase().includes(q) ||
        (item.registration_number || '').toLowerCase().includes(q) ||
        (item.institution_name || '').toLowerCase().includes(q) ||
        (item.incharge_name || '').toLowerCase().includes(q)
      );
    }

    if (baseList.length === 0) {
      toast('No route assignments found to export.');
      return;
    }
    const headers = [
      '#', 'Route Code', 'Route Name', 'Shift', 'Bus Number', 'Vehicle Type',
      'Driver Name', 'Driver Phone', 'Bus Incharge', 'Institution',
      'Origin', 'Destination', 'Distance (KM)'
    ];
    const rows = baseList.map((a, i) => {
      const drv = (refs.drivers || []).find(d => Number(d.id) === Number(a.driver_id));
      const busObj = (refs.buses || []).find(b => Number(b.id) === Number(a.bus_id));
      return [
        i + 1,
        a.route_code || '',
        a.route_name || '',
        SHIFT_MAP[a.shift] || a.shift || '',
        a.registration_number || '—',
        busObj?.vehicle_type || 'Bus',
        a.driver_name || '—',
        drv?.phone || '',
        a.incharge_name || '—',
        a.institution_name || '',
        a.origin || '',
        a.destination || '',
        a.total_distance || ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `route_assignments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Assigned routes exported as CSV');
  };

  // 4. Export Unassigned Routes to CSV
  const handleExportUnassignedCSV = (customScope = null) => {
    let baseList = allUnassignedRoutes;
    if (customScope?.inst && customScope.inst !== 'all') {
      baseList = baseList.filter(r => String(r.institution_id) === String(customScope.inst));
    } else if (activeUnassignedInst) {
      baseList = baseList.filter(r => String(r.institution_id) === String(activeUnassignedInst));
    }

    if (searchQuery && !customScope) {
      const q = searchQuery.toLowerCase().trim();
      baseList = baseList.filter(r =>
        (r.route_code || '').toLowerCase().includes(q) ||
        (r.route_name || '').toLowerCase().includes(q) ||
        (r.institution_name || '').toLowerCase().includes(q) ||
        (r.origin || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q)
      );
    }

    if (baseList.length === 0) {
      toast('No unassigned routes to export for selected criteria.');
      return;
    }
    const headers = [
      '#', 'Route Code', 'Route Name', 'Institution', 'Origin', 'Destination',
      'Distance (KM)', 'Deficit Status', 'Covered Mappings Count', 'Initial Point', 'Initial Time'
    ];
    const rows = baseList.map((r, i) => [
      i + 1,
      r.route_code || '',
      r.route_name || '',
      r.institution_name || '',
      r.origin || '',
      r.destination || '',
      r.total_distance || '',
      r.statusLabel || 'Unassigned',
      r.assignedCount || 0,
      r.initial_point || '',
      r.initial_time || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unassigned_routes_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Unassigned routes exported as CSV');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Route Assignments</div>
          <div className="page-sub">Standing mapping of buses, drivers, and faculty incharges to daily routes</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
              <AssignIcon name="alert" size={15} color="#b45309" />
              <span>{allUnassignedRoutes.length} Routes Need Assignment</span>
              <span style={{ fontSize: '11px', background: '#f59e0b', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                View List ➔
              </span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setReportType(viewMode === 'unassigned' ? 'unassigned' : 'assigned');
              setShowReportModal(true);
            }}
            style={{
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              boxShadow: '0 2px 8px rgba(30, 58, 138, 0.18)'
            }}
          >
            <AssignIcon name="printer" size={15} color="#fff" />
            <span>Reports & PDF</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon */}
        <div className="att-kpi-ribbon">
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <AssignIcon name="clipboard" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{stats.total}</div>
              <div className="att-kpi-label">Active Assignments</div>
              <div className="att-kpi-sub">Total shift mappings</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--blue">
              <AssignIcon name="bus" size={22} color="#3b82f6" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#3b82f6' }}>{stats.uniqueBuses}</div>
              <div className="att-kpi-label">Buses Deployed</div>
              <div className="att-kpi-sub">Active fleet in service</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <AssignIcon name="user" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{stats.uniqueDrivers}</div>
              <div className="att-kpi-label">Drivers on Duty</div>
              <div className="att-kpi-sub">Pilots rostered</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <AssignIcon name="badge" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#7c6cfc' }}>{stats.uniqueIncharges}</div>
              <div className="att-kpi-label">Bus Incharges</div>
              <div className="att-kpi-sub">Faculty / staff escorts</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.unassigned > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--amber">
              <AssignIcon name="alert" size={22} color="#f59e0b" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.unassigned > 0 ? '#d97706' : '#10b981' }}>
                {stats.unassigned}
              </div>
              <div className="att-kpi-label">Unassigned Slots</div>
              <div className="att-kpi-sub">{stats.unassigned > 0 ? 'Routes without bus/driver' : '100% routes covered'}</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASTER ASSIGNMENT CONSOLE (REDESIGNED PREMIUM CARD)                     */}
        {/* ========================================================================= */}
        <form
          className="assignment-console-card"
          onSubmit={handleSave}
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
            marginBottom: 28,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Top Decorative Gradient Accent Line */}
          <div style={{
            height: 4,
            background: form.route_id
              ? 'linear-gradient(90deg, #3b82f6, #6366f1, #a855f7)'
              : 'linear-gradient(90deg, #2563eb, #3b82f6, #06b6d4)'
          }} />

          {/* Console Header Bar */}
          <div style={{
            padding: '18px 24px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            borderBottom: '1px solid #edf2f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: form.route_id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                border: `1.5px solid ${form.route_id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: form.route_id ? '#4f46e5' : '#2563eb'
              }}>
                <AssignIcon name={form.route_id ? 'zap' : 'route'} size={20} color="currentColor" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
                    {form.assignment_id
                      ? 'Edit Route Assignment'
                      : (form.route_id ? 'Update Route Assignment' : 'New / Update Route Assignment')}
                  </h3>
                  {form.route_id && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe'
                    }}>
                      Active Route
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Standing allocation of vehicle fleet, pilots, and faculty escorts across operating shifts
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {form.route_id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ assignment_id: null, route_id: '', shift: 'm1_e1', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
                    setSelectedShifts(['morning1', 'evening1']);
                    setSameForBoth(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <AssignIcon name="refresh" size={13} color="#475569" />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* ------------------------------------------------------------- */}
            {/* SECTION 1: ROUTE & TIMETABLE SPECIFICATION                   */}
            {/* ------------------------------------------------------------- */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11.5,
                fontWeight: 800,
                color: '#6366f1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: 14
              }}>
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  1
                </span>
                <span>Operating Route & Sessions Scope</span>
              </div>

              {/* Grid: Institution Filter + Route Selector */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: (!isInst && insts.length > 0) ? 'minmax(220px, 320px) 1fr' : '1fr',
                gap: 16,
                alignItems: 'flex-start'
              }}>
                {(!isInst && insts.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <AssignIcon name="building" size={14} color="#6366f1" />
                      <span>Campus / Institution</span>
                    </label>
                    <select
                      className="fselect"
                      value={instFilter}
                      onChange={e => {
                        setInstFilter(e.target.value);
                        setForm(prev => ({ ...prev, route_id: '', incharge_id: '' }));
                      }}
                      style={{
                        height: 40,
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#0f172a',
                        padding: '0 12px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">🏫 All Institutions (Entire Network)</option>
                      {insts.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.short_name || i.name}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Filters available routes and campus incharge faculty
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <SearchableSelect
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AssignIcon name="route" size={14} color="#2563eb" />
                        <span>Target Route *</span>
                        {filteredRoutes.length > 0 && (
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                            ({filteredRoutes.length} available)
                          </span>
                        )}
                      </div>
                    }
                    value={form.route_id}
                    options={routeOptions}
                    onChange={handleRouteChange}
                    placeholder="Search by route code, route name, stoppages, or driver..."
                    emptyText="Click to select a route..."
                  />
                </div>
              </div>

              {/* Selected Route Live Information Strip */}
              {selectedRoute && (
                <div style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  background: isRouteAlreadyAssigned ? '#f0fdf4' : '#fffbeb',
                  border: `1.5px solid ${isRouteAlreadyAssigned ? '#bbf7d0' : '#fde68a'}`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: 14,
                      background: isRouteAlreadyAssigned ? '#dcfce7' : '#fef3c7',
                      color: isRouteAlreadyAssigned ? '#15803d' : '#b45309',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {isRouteAlreadyAssigned ? '✓ Active Roster' : '⚠️ Deficit / Unassigned'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {selectedRoute.route_code}: {selectedRoute.origin || 'Origin'}
                      <span style={{ color: '#d97706', margin: '0 6px', fontWeight: 800 }}>➔</span>
                      {selectedRoute.destination || 'Destination'}
                    </span>
                    {selectedRoute.total_distance && (
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: '#475569',
                        background: 'rgba(0,0,0,0.05)',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        📏 {selectedRoute.total_distance} km
                      </span>
                    )}
                    {selectedRoute.initial_point && (
                      <span style={{ fontSize: 11.5, color: '#2563eb', fontWeight: 600 }}>
                        ⏰ Starts {selectedRoute.initial_time ? selectedRoute.initial_time.slice(0, 5) : '07:00'} at {selectedRoute.initial_point}
                      </span>
                    )}
                  </div>
                  {isRouteAlreadyAssigned && (
                    <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
                      Currently mapped: {existingRouteAssignments.map(a => `${SHIFT_MAP[a.shift] || a.shift}: ${a.registration_number || 'No Bus'} (${a.driver_name || 'No Driver'})`).join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {/* Sessions Selector Container */}
              <div style={{
                marginTop: 18,
                padding: '16px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      Operating Sessions Coverage *
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '2px 8px',
                      borderRadius: 12,
                      border: '1px solid #bfdbfe'
                    }}>
                      {selectedShifts.length} session{selectedShifts.length === 1 ? '' : 's'} selected
                    </span>
                  </div>

                  {/* Preset Shortcuts */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
                    {[
                      { label: 'Morning 1 + Evening 1 (Standard)', val: 'm1_e1', shifts: ['morning1', 'evening1'] },
                      { label: 'Morning 1 only', val: 'morning1', shifts: ['morning1'] },
                      { label: 'Evening 1 only', val: 'evening1', shifts: ['evening1'] },
                      { label: 'All 4 Sessions', val: 'all_4', shifts: ['morning1', 'morning2', 'evening1', 'evening2'] }
                    ].map(preset => {
                      const isActive = preset.shifts.length === selectedShifts.length &&
                        preset.shifts.every(s => selectedShifts.includes(s));
                      return (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setSelectedShifts(preset.shifts);
                            setForm(f => ({ ...f, shift: getSelectValue(preset.shifts) }));
                          }}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 14,
                            border: `1px solid ${isActive ? '#2563eb' : '#cbd5e1'}`,
                            background: isActive ? '#2563eb' : '#fff',
                            color: isActive ? '#fff' : '#475569',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4 Interactive Session Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: 10
                }}>
                  {[
                    { key: 'morning1', label: 'Morning 1', tag: 'Standard Inbound', isMorning: true },
                    { key: 'morning2', label: 'Morning 2', tag: 'Late Inbound', isMorning: true },
                    { key: 'evening1', label: 'Evening 1', tag: 'Standard Return', isMorning: false },
                    { key: 'evening2', label: 'Evening 2', tag: 'Late Return', isMorning: false }
                  ].map(({ key, label, tag, isMorning }) => {
                    const isSelected = selectedShifts.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => handleToggleShift(key)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${isSelected ? (isMorning ? '#3b82f6' : '#6366f1') : '#e2e8f0'}`,
                          background: isSelected ? (isMorning ? '#eff6ff' : '#f5f3ff') : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isSelected
                              ? (isMorning ? '#dbeafe' : '#ede9fe')
                              : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isMorning ? '#d97706' : '#6366f1'
                          }}>
                            <AssignIcon name={isMorning ? 'sun' : 'moon'} size={15} color="currentColor" />
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#0f172a' : '#475569' }}>
                              {label}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#64748b' }}>
                              {tag}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `1.5px solid ${isSelected ? (isMorning ? '#2563eb' : '#6366f1') : '#cbd5e1'}`,
                          background: isSelected ? (isMorning ? '#2563eb' : '#6366f1') : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 800
                        }}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 2: FLEET & CREW ALLOCATION                            */}
            {/* ------------------------------------------------------------- */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11.5,
                fontWeight: 800,
                color: '#6366f1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: 14
              }}>
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  2
                </span>
                <span>Fleet & Crew Assignment</span>
              </div>

              {/* Same Bus and Driver Toggle Switch */}
              {hasMultipleSessions && (
                <div
                  onClick={() => setSameForBoth(!sameForBoth)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: sameForBoth ? '#f8fafc' : '#fffbeb',
                    border: `1.5px solid ${sameForBoth ? '#e2e8f0' : '#fde68a'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.18s ease',
                    marginBottom: 18
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 24,
                      borderRadius: 14,
                      background: sameForBoth ? '#2563eb' : '#cbd5e1',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 3,
                        left: sameForBoth ? 23 : 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        transition: 'left 0.2s ease'
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        Same Bus & Driver for all selected sessions
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        {sameForBoth
                          ? `Deploy identical bus and pilot for both Morning & Evening trips`
                          : `Split shift mode: Assign distinct buses or drivers for morning vs evening`}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: sameForBoth ? '#eff6ff' : '#fef3c7',
                    color: sameForBoth ? '#1d4ed8' : '#b45309'
                  }}>
                    {sameForBoth ? 'Unified Crew' : 'Split Shift Crew'}
                  </span>
                </div>
              )}

              {/* Resource Selectors Layout */}
              {!isSplitSessions ? (
                /* Mode A: Unified Crew (Bus + Driver + Incharge in balanced 3-column row) */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 16,
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <SearchableSelect
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AssignIcon name="bus" size={14} color="#3b82f6" />
                          <span>Bus ({selectedShifts.length > 1 ? 'Both Sessions' : 'Session'})</span>
                        </div>
                      }
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
                      placeholder="Search bus registration number..."
                      emptyText="Select bus..."
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AssignIcon name="user" size={14} color="#10b981" />
                          <span>Driver ({selectedShifts.length > 1 ? 'Both Sessions' : 'Session'})</span>
                        </div>
                      }
                      value={form.driver_id}
                      options={driverOptions}
                      onChange={val => setForm(prev => ({ ...prev, driver_id: val }))}
                      placeholder="Search driver name..."
                      emptyText="Select driver..."
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AssignIcon name="badge" size={14} color="#7c6cfc" />
                          <span>Bus Incharge (Faculty Escort)</span>
                        </div>
                      }
                      value={form.incharge_id}
                      options={inchargeOptions}
                      onChange={val => setForm(prev => ({ ...prev, incharge_id: val }))}
                      placeholder="Search faculty incharge name..."
                      emptyText="Select incharge (optional)..."
                    />
                  </div>
                </div>
              ) : (
                /* Mode B: Split Sessions (Morning Panel + Evening Panel + Incharge) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 16
                  }}>
                    {/* Morning Panel */}
                    <div style={{
                      padding: '16px',
                      background: '#f0f9ff',
                      borderRadius: 10,
                      border: '1.5px solid #bae6fd'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#0369a1',
                        marginBottom: 12
                      }}>
                        <AssignIcon name="sun" size={15} color="#0284c7" />
                        <span>Morning Shift Crew ({morningLabel})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                          placeholder="Select morning bus..."
                        />
                        <SearchableSelect
                          label="Morning Driver"
                          value={form.driver_id}
                          options={driverOptions}
                          onChange={val => setForm(prev => ({ ...prev, driver_id: val }))}
                          placeholder="Select morning driver..."
                        />
                      </div>
                    </div>

                    {/* Evening Panel */}
                    <div style={{
                      padding: '16px',
                      background: '#fdf4ff',
                      borderRadius: 10,
                      border: '1.5px solid #f0abfc'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#a21caf',
                        marginBottom: 12
                      }}>
                        <AssignIcon name="moon" size={15} color="#c026d3" />
                        <span>Evening Shift Crew ({eveningLabel})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                          placeholder="Select evening bus..."
                        />
                        <SearchableSelect
                          label="Evening Driver"
                          value={form.evening_driver_id}
                          options={driverOptions}
                          onChange={val => setForm(prev => ({ ...prev, evening_driver_id: val }))}
                          placeholder="Select evening driver..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Faculty Incharge */}
                  <div style={{ maxWidth: 400 }}>
                    <SearchableSelect
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AssignIcon name="badge" size={14} color="#7c6cfc" />
                          <span>Bus Incharge (Faculty Escort)</span>
                        </div>
                      }
                      value={form.incharge_id}
                      options={inchargeOptions}
                      onChange={val => setForm(prev => ({ ...prev, incharge_id: val }))}
                      placeholder="Search faculty incharge name..."
                      emptyText="Select incharge (optional)..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Console Action Bar / Footer */}
          <div style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              {form.route_id && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleDeleteForm}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #fca5a5',
                    color: '#dc2626',
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '8px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                  title="Remove assignment and make route unassigned"
                >
                  <AssignIcon name="trash" size={14} color="#dc2626" />
                  <span>Delete Assignment</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {form.route_id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ assignment_id: null, route_id: '', shift: 'm1_e1', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
                    setSelectedShifts(['morning1', 'evening1']);
                    setSameForBoth(true);
                  }}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #cbd5e1',
                    color: '#475569',
                    fontWeight: 600,
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 24px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
                  transition: 'all 0.15s ease'
                }}
              >
                <AssignIcon name="check" size={15} color="#fff" />
                <span>{form.assignment_id ? 'Update Assignment' : 'Save Assignment'}</span>
              </button>
            </div>
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
              <AssignIcon name="clipboard" size={14} color="currentColor" />
              <span>Current Assignments</span>
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
              <AssignIcon name="alert" size={14} color="currentColor" />
              <span>Unassigned Routes</span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '100%', minWidth: 220, maxWidth: 280 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <AssignIcon name="search" size={15} color="#94a3b8" />
              </span>
              <input
                type="text"
                className="fselect"
                placeholder={viewMode === 'unassigned' ? "Search unassigned route, institution..." : "Search route, driver, bus..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 34, paddingRight: searchQuery ? 30 : 12, borderRadius: 6, background: '#fff', height: 38 }}
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

            {viewMode === 'assigned' ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handlePrintAssignedReport()}
                  className="btn btn-sm"
                  style={{
                    background: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '8px 13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 12.5
                  }}
                  title="Print official assigned routes deployment register (A4 PDF)"
                >
                  <AssignIcon name="printer" size={14} color="#1d4ed8" />
                  <span>Print Assigned Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportAssignedCSV()}
                  className="btn btn-sm"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '8px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 12.5
                  }}
                  title="Download assigned routes as CSV spreadsheet"
                >
                  <AssignIcon name="download" size={14} color="#334155" />
                  <span>Export CSV</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handlePrintUnassignedReport()}
                  className="btn btn-sm"
                  style={{
                    background: '#fff7ed',
                    border: '1.5px solid #fed7aa',
                    color: '#c2410c',
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '8px 13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 12.5
                  }}
                  title="Print unassigned routes & fleet deficit report (A4 PDF)"
                >
                  <AssignIcon name="printer" size={14} color="#c2410c" />
                  <span>Print Unassigned Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportUnassignedCSV()}
                  className="btn btn-sm"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '8px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 12.5
                  }}
                  title="Download unassigned deficit list as CSV spreadsheet"
                >
                  <AssignIcon name="download" size={14} color="#334155" />
                  <span>Export CSV</span>
                </button>
              </div>
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

        {/* Filter chips when on Unassigned Routes */}
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
            emptyIcon="📋"
            emptyText={searchQuery ? 'No matching assignments found.' : 'No assignments set up.'}
          />
        ) : (
          <DataTable
            columns={UNASSIGNED_COLUMNS}
            data={filteredUnassigned}
            emptyIcon="✓"
            emptyText={searchQuery ? 'No matching unassigned routes found.' : 'All routes have buses assigned! Great job!'}
          />
        )}

        {/* Reports & PDF Scope Modal */}
        {showReportModal && (() => {
          // Compute modal preview stats
          let modalAssignedList = items;
          if (reportInst !== 'all') {
            modalAssignedList = modalAssignedList.filter(a => String(a.institution_id) === String(reportInst));
          }
          if (reportShift !== 'all') {
            modalAssignedList = modalAssignedList.filter(a => a.shift === reportShift);
          }
          const modalBuses = new Set(modalAssignedList.map(a => a.bus_id).filter(Boolean)).size;
          const modalDrivers = new Set(modalAssignedList.map(a => a.driver_id).filter(Boolean)).size;
          const modalIncharges = new Set(modalAssignedList.map(a => a.incharge_id).filter(Boolean)).size;
          const modalTotalKm = modalAssignedList.reduce((acc, a) => acc + (Number(a.total_distance) || 0), 0);

          let modalUnassignedList = allUnassignedRoutes;
          if (reportInst !== 'all') {
            modalUnassignedList = modalUnassignedList.filter(r => String(r.institution_id) === String(reportInst));
          }
          const modalNoAssign = modalUnassignedList.filter(r => r.status === 'no_assignment').length;
          const modalNoDriver = modalUnassignedList.filter(r => r.status === 'no_driver').length;
          const modalNoBus = modalUnassignedList.filter(r => r.status === 'no_bus' || r.status.includes('missing')).length;
          const modalUnassignedKm = modalUnassignedList.reduce((acc, r) => acc + (Number(r.total_distance) || 0), 0);

          return (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 20
              }}
              onClick={() => setShowReportModal(false)}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  width: '100%',
                  maxWidth: 640,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.18s ease-out'
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '18px 24px',
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AssignIcon name="file" size={20} color="#fff" />
                      <span>Route & Fleet Reports</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                      Generate print-ready A4 reports or export CSV data registers
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AssignIcon name="x" size={16} color="#fff" />
                  </button>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {/* Report Type Selector Tabs */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 20,
                    background: 'var(--paper)',
                    padding: 4,
                    borderRadius: 8
                  }}>
                    <button
                      type="button"
                      onClick={() => setReportType('assigned')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: reportType === 'assigned' ? '#fff' : 'transparent',
                        color: reportType === 'assigned' ? 'var(--navy)' : 'var(--text-dim)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: reportType === 'assigned' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <AssignIcon name="clipboard" size={16} color={reportType === 'assigned' ? 'var(--navy)' : 'currentColor'} />
                      <span>Assigned Register</span>
                      <span style={{
                        fontSize: 11,
                        background: reportType === 'assigned' ? 'var(--navy)' : 'var(--paper-2)',
                        color: reportType === 'assigned' ? '#fff' : 'inherit',
                        padding: '2px 7px',
                        borderRadius: 10
                      }}>
                        {items.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportType('unassigned')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: reportType === 'unassigned' ? '#fff' : 'transparent',
                        color: reportType === 'unassigned' ? '#c2410c' : 'var(--text-dim)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: reportType === 'unassigned' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <AssignIcon name="alert" size={16} color={reportType === 'unassigned' ? '#c2410c' : 'currentColor'} />
                      <span>Unassigned Deficit</span>
                      <span style={{
                        fontSize: 11,
                        background: reportType === 'unassigned' ? '#ea580c' : '#f59e0b',
                        color: '#fff',
                        padding: '2px 7px',
                        borderRadius: 10
                      }}>
                        {allUnassignedRoutes.length}
                      </span>
                    </button>
                  </div>

                  {/* Filter Controls Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: reportType === 'assigned' ? '1.2fr 1fr' : '1fr',
                    gap: 14,
                    marginBottom: 20
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                        Scope by Institution:
                      </label>
                      <select
                        className="fselect"
                        value={reportInst}
                        onChange={e => setReportInst(e.target.value)}
                        style={{ width: '100%', height: 38, borderRadius: 6 }}
                      >
                        <option value="all">🏢 All Institutions (Entire Network)</option>
                        {(refs.institutions || []).map(inst => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name || inst.short_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {reportType === 'assigned' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                          Session / Shift:
                        </label>
                        <select
                          className="fselect"
                          value={reportShift}
                          onChange={e => setReportShift(e.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 6 }}
                        >
                          <option value="all">🕒 All Daily Sessions (M1-M4, E1-E4)</option>
                          {SHIFT_OPTIONS.map(s => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Scope Preview Card */}
                  {reportType === 'assigned' ? (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '14px 16px',
                      marginBottom: 24
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AssignIcon name="check" size={14} color="#166534" />
                        <span>REPORT SUMMARY PREVIEW</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>{modalAssignedList.length}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Active Mappings</div>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{modalBuses}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Buses Mapped</div>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#0d9488' }}>{modalDrivers}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Drivers Rostered</div>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>{modalTotalKm.toFixed(0)} km</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Total Route KM</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                      padding: '14px 16px',
                      marginBottom: 24
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AssignIcon name="alert" size={14} color="#ea580c" />
                        <span>DEFICIT REPORT PREVIEW</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #ffedd5' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#c2410c' }}>{modalUnassignedList.length}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Deficit Routes</div>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #ffedd5' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{modalNoAssign}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>No Bus & Driver</div>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #ffedd5' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{modalNoDriver}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Missing Driver</div>
                        </div>
                        <div style={{ background: '#fff', padding: '8px 4px', borderRadius: 6, border: '1px solid #ffedd5' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c' }}>{modalUnassignedKm.toFixed(0)} km</div>
                          <div style={{ fontSize: 10.5, color: '#4b5563', fontWeight: 600 }}>Uncovered KM</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Action Buttons */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowReportModal(false)}
                      style={{ padding: '9px 18px', borderRadius: 6, fontWeight: 600 }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        if (reportType === 'assigned') {
                          handleExportAssignedCSV({ inst: reportInst, shift: reportShift });
                        } else {
                          handleExportUnassignedCSV({ inst: reportInst });
                        }
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1.5px solid #cbd5e1',
                        color: '#1e293b',
                        padding: '9px 18px',
                        borderRadius: 6,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <AssignIcon name="download" size={15} color="#1e293b" />
                      <span>Download CSV</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (reportType === 'assigned') {
                          handlePrintAssignedReport({ inst: reportInst, shift: reportShift });
                        } else {
                          handlePrintUnassignedReport({ inst: reportInst });
                        }
                      }}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 6,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      <AssignIcon name="printer" size={15} color="#fff" />
                      <span>Print PDF Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
