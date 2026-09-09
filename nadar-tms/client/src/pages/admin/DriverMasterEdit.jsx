import React, { useState, useEffect, useRef, Fragment } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

// =========================================================================
// 1. MultiBusSearchPicker: Searchable & supports MULTIPLE buses for one driver
// =========================================================================
function MultiBusSearchPicker({ buses = [], selectedBusIds = [], onChange, activeInstId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedBuses = buses.filter(b => (selectedBusIds || []).includes(Number(b.id)));

  // Filter available buses that are not yet selected
  const availableBuses = buses.filter(b => !(selectedBusIds || []).includes(Number(b.id)));

  const q = query.toLowerCase().trim();
  const matchedBuses = availableBuses.filter(b => {
    if (!q) return true;
    return (b.registration_number || '').toLowerCase().includes(q) ||
           (b.bus_code || '').toLowerCase().includes(q) ||
           String(b.capacity || '').includes(q);
  });

  // Prioritize buses for the current institution at top
  const sortedMatches = [...matchedBuses].sort((a, b) => {
    if (activeInstId) {
      const aMatch = String(a.institution_id) === String(activeInstId);
      const bMatch = String(b.institution_id) === String(activeInstId);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return (a.registration_number || '').localeCompare(b.registration_number || '');
  });

  const addBus = (busId) => {
    const next = [...(selectedBusIds || []), Number(busId)];
    onChange(next);
    setQuery('');
    // Keep focus for fast multiple additions
    if (inputRef.current) inputRef.current.focus();
  };

  const removeBus = (busId) => {
    const next = (selectedBusIds || []).filter(id => Number(id) !== Number(busId));
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sortedMatches.length > 0) {
        addBus(sortedMatches[0].id);
      }
    } else if (e.key === 'Backspace' && !query && selectedBusIds.length > 0) {
      // Remove last chip on backspace
      removeBus(selectedBusIds[selectedBusIds.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Box containing selected bus chips + inline search input */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          alignItems: 'center',
          background: '#ffffff',
          border: isOpen ? '1.5px solid #0284c7' : '1.5px solid #93c5fd',
          borderRadius: 6,
          padding: '4px 6px',
          minHeight: 36,
          boxShadow: isOpen ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none',
          cursor: 'text'
        }}
        onClick={() => {
          setIsOpen(true);
          if (inputRef.current) inputRef.current.focus();
        }}
      >
        {/* Selected Bus Chips */}
        {selectedBuses.map(b => (
          <span
            key={b.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            <span>🚌 {b.registration_number}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeBus(b.id);
              }}
              style={{
                cursor: 'pointer',
                color: '#dc2626',
                fontWeight: 900,
                fontSize: 12,
                marginLeft: 2,
                lineHeight: 1
              }}
              title="Remove this bus"
            >
              ✕
            </span>
          </span>
        ))}

        {/* Search & Enter Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedBuses.length ? "+ bus (type & Enter)..." : "🔍 Search bus no & Enter..."}
          style={{
            flex: 1,
            minWidth: 105,
            border: 'none',
            outline: 'none',
            fontSize: 11.5,
            padding: '2px 4px',
            fontFamily: 'inherit',
            background: 'transparent'
          }}
        />

        {selectedBuses.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 11,
              cursor: 'pointer',
              padding: '0 2px'
            }}
            title="Clear all assigned buses"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            width: '100%',
            minWidth: 220,
            maxHeight: 200,
            overflowY: 'auto',
            background: '#ffffff',
            border: '1.5px solid #0284c7',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 100
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <span>PRESS ENTER TO ADD TOP MATCH:</span>
            <span>{sortedMatches.length} available</span>
          </div>

          {sortedMatches.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              No matching buses found
            </div>
          ) : (
            sortedMatches.map((b, i) => {
              const isCampusBus = activeInstId && String(b.institution_id) === String(activeInstId);
              return (
                <div
                  key={b.id}
                  onClick={() => addBus(b.id)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: i === 0 && query ? '#f0f9ff' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = (i === 0 && query ? '#f0f9ff' : 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1d4ed8' }}>
                      🚌 {b.registration_number}
                    </span>
                    {b.capacity && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>({b.capacity} seats)</span>
                    )}
                    {isCampusBus && (
                      <span style={{ fontSize: 9.5, background: '#dcfce7', color: '#15803d', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>
                        Campus
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>+ Add</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 2. RouteSearchPicker: Search & Enter for Route Selection
// =========================================================================
function RouteSearchPicker({ routes = [], selectedRouteId, onChange, activeInstId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRoute = routes.find(r => String(r.id) === String(selectedRouteId));

  const q = query.toLowerCase().trim();
  const matchedRoutes = routes.filter(r => {
    if (!q) return true;
    return (r.route_code || '').toLowerCase().includes(q) ||
           (r.route_name || '').toLowerCase().includes(q) ||
           (r.name || '').toLowerCase().includes(q) ||
           (r.destination || '').toLowerCase().includes(q);
  });

  const sortedMatches = [...matchedRoutes].sort((a, b) => {
    if (activeInstId) {
      const aMatch = String(a.institution_id) === String(activeInstId);
      const bMatch = String(b.institution_id) === String(activeInstId);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return (a.route_code || '').localeCompare(b.route_code || '');
  });

  const selectRoute = (routeId) => {
    onChange(routeId ? String(routeId) : '');
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sortedMatches.length > 0) {
        selectRoute(sortedMatches[0].id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: isOpen ? '1.5px solid #0284c7' : '1.5px solid #93c5fd',
          borderRadius: 6,
          padding: '4px 8px',
          minHeight: 36,
          boxShadow: isOpen ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedRoute ? `${selectedRoute.route_code} · ${selectedRoute.route_name || selectedRoute.name || ''}` : '')}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="🛣️ Search route code & Enter..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 12,
            fontWeight: selectedRoute && !isOpen ? 700 : 500,
            fontFamily: selectedRoute && !isOpen ? 'JetBrains Mono, monospace' : 'inherit',
            color: selectedRoute && !isOpen ? '#0f172a' : '#334155',
            background: 'transparent'
          }}
        />

        {selectedRoute && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              selectRoute('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
              padding: '0 4px',
              fontWeight: 800
            }}
            title="Remove route (set Standby)"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            width: '100%',
            minWidth: 260,
            maxHeight: 220,
            overflowY: 'auto',
            background: '#ffffff',
            border: '1.5px solid #0284c7',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 100
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <span>PRESS ENTER TO SELECT:</span>
            <span
              onClick={() => selectRoute('')}
              style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
            >
              Standby (No Route)
            </span>
          </div>

          {sortedMatches.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              No matching routes found
            </div>
          ) : (
            sortedMatches.map((r, i) => {
              const isCampusRoute = activeInstId && String(r.institution_id) === String(activeInstId);
              return (
                <div
                  key={r.id}
                  onClick={() => selectRoute(r.id)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: i === 0 && query ? '#f0f9ff' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = (i === 0 && query ? '#f0f9ff' : 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <b className="mono" style={{ color: '#0f172a' }}>🛣️ {r.route_code}</b>
                    {isCampusRoute && (
                      <span style={{ fontSize: 9.5, background: '#dcfce7', color: '#15803d', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>
                        Campus
                      </span>
                    )}
                  </div>
                  {(r.route_name || r.name) && (
                    <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.route_name || r.name}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 3. InstSearchPicker: Search & Enter for Campus / Institution
// =========================================================================
function InstSearchPicker({ institutions = [], selectedInstId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedInst = institutions.find(i => String(i.id) === String(selectedInstId));

  const q = query.toLowerCase().trim();
  const matchedInsts = institutions.filter(i => {
    if (!q) return true;
    return (i.name || '').toLowerCase().includes(q) ||
           (i.short_name || '').toLowerCase().includes(q) ||
           (i.code || '').toLowerCase().includes(q);
  });

  const selectInst = (instId) => {
    onChange(instId ? String(instId) : '');
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchedInsts.length > 0) {
        selectInst(matchedInsts[0].id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: isOpen ? '1.5px solid #0284c7' : '1.5px solid #93c5fd',
          borderRadius: 6,
          padding: '4px 8px',
          minHeight: 36,
          boxShadow: isOpen ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedInst ? (selectedInst.short_name || selectedInst.name) : '')}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="🏫 Campus (search & Enter)..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 12,
            fontWeight: selectedInst && !isOpen ? 700 : 500,
            color: selectedInst && !isOpen ? '#334155' : '#64748b',
            background: 'transparent'
          }}
        />

        {selectedInst && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              selectInst('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
              padding: '0 4px',
              fontWeight: 800
            }}
            title="Clear institution"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            width: '100%',
            minWidth: 200,
            maxHeight: 200,
            overflowY: 'auto',
            background: '#ffffff',
            border: '1.5px solid #0284c7',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 100
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <span>PRESS ENTER TO SELECT:</span>
            <span
              onClick={() => selectInst('')}
              style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
            >
              Unassigned
            </span>
          </div>

          {matchedInsts.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              No matching campuses found
            </div>
          ) : (
            matchedInsts.map((inst, i) => (
              <div
                key={inst.id}
                onClick={() => selectInst(inst.id)}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  background: i === 0 && query ? '#f0f9ff' : 'transparent',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = (i === 0 && query ? '#f0f9ff' : 'transparent')}
              >
                🏫 {inst.short_name || inst.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Main DriverMasterEdit Component
// =========================================================================
export default function DriverMasterEdit() {
  const [drivers, setDrivers] = useState([]);
  const [refs, setRefs] = useState({ institutions: [], routes: [], buses: [] });
  const [loading, setLoading] = useState(true);
  const [instFilter, setInstFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inline row editing state
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [rowForm, setRowForm] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Add new driver modal state (asks only Name, Assigned Bus No (Multiple), Assigned Route, Campus / Institution)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    bus_ids: [],
    route_id: '',
    institution_id: '',
    shift: 'both',
    phone: '',
    license_number: '',
    license_expiry: '',
    status: 'active'
  });
  const [addSaving, setAddSaving] = useState(false);

  const toast = useToast();
  const { user } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [drvRes, refRes] = await Promise.all([
        api.listRes('drivers', { institution_id: 'all' }),
        api.refs()
      ]);
      setDrivers(drvRes.items || []);
      setRefs(refRes || { institutions: [], routes: [], buses: [] });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load driver master edit data:', err);
      toast('Could not load driver data');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Start inline row editing: support MULTIPLE bus IDs
  const startRowEdit = (d) => {
    setEditingDriverId(d.id);

    let initialBusIds = [];
    if (d.current_bus_ids) {
      initialBusIds = String(d.current_bus_ids)
        .split(',')
        .map(s => Number(s.trim()))
        .filter(Boolean);
    } else if (d.current_bus_id) {
      initialBusIds = [Number(d.current_bus_id)];
    }

    setRowForm({
      driver_id: d.id,
      name: d.name || '',
      institution_id: d.current_institution_id ? String(d.current_institution_id) : (d.institution_id ? String(d.institution_id) : ''),
      route_id: d.current_route_id ? String(d.current_route_id) : (d.route_id ? String(d.route_id) : ''),
      bus_ids: initialBusIds,
      shift: 'both',
      phone: d.phone || '',
      status: d.status || 'active'
    });
  };

  // Cancel inline editing
  const cancelRowEdit = () => {
    setEditingDriverId(null);
    setRowForm(null);
  };

  // Save inline row edit
  const handleRowSave = async (driverId) => {
    if (!rowForm) return;
    if (!rowForm.name?.trim()) {
      toast('Driver name cannot be empty');
      return;
    }

    setSavingId(driverId);
    try {
      await api.driverMasterEdit(driverId, rowForm);

      // Collect updated bus objects
      const assignedBuses = (refs.buses || []).filter(b => (rowForm.bus_ids || []).includes(Number(b.id)));
      const busNumbersStr = assignedBuses.map(b => b.registration_number).join(', ');
      const busIdsStr = rowForm.bus_ids?.join(',');

      const routeObj = refs.routes?.find(r => String(r.id) === String(rowForm.route_id));
      const instObj = refs.institutions?.find(i => String(i.id) === String(rowForm.institution_id));

      // Update in local state immediately
      setDrivers(prev => prev.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            name: rowForm.name.trim(),
            current_institution_id: rowForm.institution_id || null,
            institution_id: rowForm.institution_id || null,
            current_route_id: rowForm.route_id || null,
            route_id: rowForm.route_id || null,
            current_bus_id: rowForm.bus_ids?.[0] || null,
            current_bus_ids: busIdsStr || null,
            assigned_bus_numbers: busNumbersStr || null,
            assigned_route_code: routeObj ? routeObj.route_code : null,
            assigned_route_name: routeObj ? (routeObj.route_name || routeObj.name) : null,
            institution_name: instObj ? (instObj.short_name || instObj.name) : (rowForm.institution_id ? 'Consolidated' : '—'),
            phone: rowForm.phone,
            status: rowForm.status
          };
        }
        return d;
      }));

      toast(`✓ Saved master details for ${rowForm.name}`);
      setSavingId(null);
      setEditingDriverId(null);
      setRowForm(null);
    } catch (err) {
      setSavingId(null);
      toast(err.message || 'Could not save driver details');
    }
  };

  // Open Add Driver Modal
  const openAddModal = () => {
    setAddForm({
      name: '',
      bus_ids: [],
      route_id: '',
      institution_id: instFilter !== 'ALL' ? String(instFilter) : '',
      shift: 'both',
      phone: '',
      license_number: '',
      license_expiry: '',
      status: 'active'
    });
    setShowAddModal(true);
  };

  // Save New Driver (asks only Driver Name, Assigned Bus No (Multiple), Assigned Route, Campus / Institution)
  const handleSaveNewDriver = async (e) => {
    if (e) e.preventDefault();
    if (!addForm.name || !addForm.name.trim()) {
      toast('Driver name is required');
      return;
    }

    setAddSaving(true);
    try {
      await api.driverMasterAdd({
        name: addForm.name.trim(),
        bus_ids: addForm.bus_ids || [],
        route_id: addForm.route_id || null,
        institution_id: addForm.institution_id || null,
        shift: 'both',
        phone: addForm.phone ? addForm.phone.trim() : null,
        license_number: addForm.license_number ? addForm.license_number.trim() : null,
        license_expiry: addForm.license_expiry ? addForm.license_expiry.trim() : null,
        status: addForm.status || 'active'
      });

      toast(`✓ Successfully added driver "${addForm.name.trim()}"`);
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      console.error('Error adding driver:', err);
      toast(err.message || 'Could not add driver');
    } finally {
      setAddSaving(false);
    }
  };

  // Filtered driver list
  const filteredDrivers = drivers.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.assigned_bus_numbers || '').toLowerCase().includes(q) ||
      (d.assigned_route_code || '').toLowerCase().includes(q) ||
      (d.institution_name || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q);

    const matchesInst = instFilter === 'ALL' ||
      String(d.current_institution_id) === String(instFilter) ||
      String(d.institution_id) === String(instFilter);

    const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'assigned' && isAssigned) ||
      (statusFilter === 'unassigned' && !isAssigned);

    return matchesSearch && matchesInst && matchesStatus;
  });

  // KPIs
  const totalCount = drivers.length;
  const assignedCount = drivers.filter(d => !!(d.assigned_bus_numbers && d.assigned_route_code)).length;
  const unassignedCount = totalCount - assignedCount;

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading Driver Master Editor...</div>;

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚡ Driver Master Edit</span>
            <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 11, fontWeight: 700 }}>
              SEARCH & MULTI-BUS MAPPING
            </span>
          </div>
          <div className="page-sub">
            Click <b>Edit</b> to search & select <b>Multiple Buses</b>, <b>Routes</b>, and <b>Campus Institution</b> using instant search-and-enter dropdowns.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={openAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 6,
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
              cursor: 'pointer'
            }}
            title="Add a new driver with bus, route & campus mapping"
          >
            <span>➕</span> Add New Driver
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh driver fleet data"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Summary Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Registered Drivers</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalCount}</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>In TMHNU central roster</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mapped on Bus & Route</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d', marginTop: 4 }}>{assignedCount}</div>
            <div style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>Active bus operators</div>
          </div>

          <div style={{ background: '#ffffff', border: unassignedCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0', padding: '12px 16px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Standby / Unassigned</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: unassignedCount > 0 ? '#b45309' : '#15803d', marginTop: 4 }}>{unassignedCount}</div>
            <div style={{ fontSize: 11.5, color: unassignedCount > 0 ? '#b45309' : '#16a34a', fontWeight: 600, marginTop: 2 }}>Reserve drivers needing bus/route</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Campuses & Fleet Size</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
              {refs.institutions?.length || 0} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Institutions</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 600, marginTop: 2 }}>{refs.buses?.length || 0} Buses · {refs.routes?.length || 0} Routes</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center', background: '#ffffff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <input
            type="text"
            className="fselect"
            placeholder="🔍 Search driver name, bus no, route, mobile..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: 320 }}
          />

          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => setInstFilter(e.target.value)}
              style={{ maxWidth: 260, fontWeight: 600 }}
            >
              <option value="ALL">All Campuses / Institutions</option>
              {refs.institutions.map(i => (
                <option key={i.id} value={String(i.id)}>
                  {i.short_name || i.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="fselect"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: 200, fontWeight: 600 }}
          >
            <option value="ALL">All Drivers</option>
            <option value="assigned">✅ Assigned to Bus & Route</option>
            <option value="unassigned">⚠️ Standby (Unassigned)</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn btn-sm"
              onClick={openAddModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#f0fdf4',
                color: '#15803d',
                border: '1.5px solid #86efac',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
              title="Add a new driver"
            >
              <span>➕</span> Add Driver
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredDrivers.length}</b> of {drivers.length} drivers
            </span>
          </div>
        </div>

        {/* Master Edit Table with Search & Multi-Bus Inline Pickers */}
        <div className="table-wrap" style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table className="tbl tbl-spacious" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ width: 40, textAlign: 'center' }}>S.NO</th>
                <th style={{ minWidth: 150 }}>Driver Name</th>
                <th style={{ minWidth: 260 }}>Assigned Bus No (Multiple)</th>
                <th style={{ minWidth: 220 }}>Assigned Route</th>
                <th style={{ minWidth: 170 }}>Campus / Institution</th>
                <th style={{ minWidth: 110 }}>Mobile</th>
                <th style={{ width: 85, textAlign: 'center' }}>Status</th>
                <th style={{ width: 120, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((d, idx) => {
                const isEditing = editingDriverId === d.id;
                const isActive = (d.status || '').toLowerCase() === 'active';

                if (isEditing && rowForm) {
                  // --- INLINE EDITING ROW WITH SEARCH & ENTER PICKERS ---
                  return (
                    <Fragment key={d.id}>
                      <tr style={{ background: '#f0f9ff', borderTop: '2px solid #0284c7', borderBottom: '1px solid #bae6fd' }}>
                        {/* S.No */}
                        <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 800 }} className="mono">
                          {idx + 1}
                        </td>

                        {/* 1. Driver Name (Input) */}
                        <td style={{ verticalAlign: 'top', paddingTop: 10 }}>
                          <input
                            type="text"
                            className="finput"
                            value={rowForm.name}
                            onChange={e => setRowForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Driver Name"
                            style={{
                              width: '100%',
                              fontWeight: 700,
                              fontSize: 13,
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '1.5px solid #0284c7',
                              background: '#ffffff',
                              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.15)'
                            }}
                            autoFocus
                          />
                        </td>

                        {/* 2. Assigned Bus No (Multi-Bus Search & Enter) */}
                        <td style={{ verticalAlign: 'top', paddingTop: 10 }}>
                          <MultiBusSearchPicker
                            buses={refs.buses || []}
                            selectedBusIds={rowForm.bus_ids || []}
                            activeInstId={rowForm.institution_id}
                            onChange={(newBusIds) => {
                              setRowForm(prev => {
                                const updated = { ...prev, bus_ids: newBusIds };
                                // Auto-set campus from bus if not set
                                if (newBusIds.length > 0 && !prev.institution_id) {
                                  const firstBus = refs.buses?.find(b => Number(b.id) === Number(newBusIds[0]));
                                  if (firstBus?.institution_id) {
                                    updated.institution_id = String(firstBus.institution_id);
                                  }
                                }
                                return updated;
                              });
                            }}
                          />
                        </td>

                        {/* 3. Assigned Route (Search & Enter Picker) */}
                        <td style={{ verticalAlign: 'top', paddingTop: 10 }}>
                          <RouteSearchPicker
                            routes={refs.routes || []}
                            selectedRouteId={rowForm.route_id}
                            activeInstId={rowForm.institution_id}
                            onChange={(newRouteId) => {
                              setRowForm(prev => {
                                const updated = { ...prev, route_id: newRouteId };
                                if (newRouteId) {
                                  const rMatch = refs.routes?.find(r => String(r.id) === String(newRouteId));
                                  if (rMatch?.institution_id && (!prev.institution_id || prev.institution_id !== String(rMatch.institution_id))) {
                                    updated.institution_id = String(rMatch.institution_id);
                                  }
                                }
                                return updated;
                              });
                            }}
                          />
                        </td>

                        {/* 4. Campus / Institution (Search & Enter Picker) */}
                        <td style={{ verticalAlign: 'top', paddingTop: 10 }}>
                          <InstSearchPicker
                            institutions={refs.institutions || []}
                            selectedInstId={rowForm.institution_id}
                            onChange={(newInstId) => {
                              setRowForm(prev => ({ ...prev, institution_id: newInstId }));
                            }}
                          />
                        </td>

                        {/* Mobile (Input) */}
                        <td style={{ verticalAlign: 'top', paddingTop: 10 }}>
                          <input
                            type="text"
                            className="finput mono"
                            value={rowForm.phone || ''}
                            onChange={e => setRowForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Mobile"
                            style={{
                              width: '100%',
                              fontSize: 12,
                              padding: '6px 6px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff'
                            }}
                          />
                        </td>

                        {/* Status (Dropdown) */}
                        <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: 10 }}>
                          <select
                            className="fselect"
                            value={rowForm.status || 'active'}
                            onChange={e => setRowForm(prev => ({ ...prev, status: e.target.value }))}
                            style={{
                              width: '100%',
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '5px 4px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff'
                            }}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>

                        {/* Action buttons (Save / Cancel) */}
                        <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: 10 }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleRowSave(d.id)}
                              disabled={savingId === d.id}
                              style={{
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: 12,
                                padding: '6px 10px',
                                borderRadius: 6,
                                boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                              }}
                              title="Save changes to this driver"
                            >
                              {savingId === d.id ? '...' : '💾 Save'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={cancelRowEdit}
                              disabled={savingId === d.id}
                              style={{
                                padding: '6px 8px',
                                fontSize: 12,
                                borderRadius: 6,
                                color: '#64748b',
                                borderColor: '#cbd5e1',
                                cursor: 'pointer'
                              }}
                              title="Cancel editing"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Live Sync Sub-Row Preview */}
                      <tr style={{ background: '#f0fdf4', borderBottom: '2px solid #22c55e' }}>
                        <td colSpan={8} style={{ padding: '8px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span>⚡ Live Linked:</span>
                              </span>
                              <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#0f172a' }}>
                                👤 {rowForm.name || 'Unnamed Driver'}
                              </span>
                              <span style={{ color: '#15803d', fontWeight: 800 }}>➔</span>

                              {/* Multiple Buses Preview */}
                              <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                {(rowForm.bus_ids || []).length === 0 ? (
                                  <span style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace' }}>
                                    No Bus (Standby)
                                  </span>
                                ) : (
                                  (rowForm.bus_ids || []).map(bId => {
                                    const bObj = refs.buses?.find(b => Number(b.id) === Number(bId));
                                    return (
                                      <span
                                        key={bId}
                                        style={{
                                          background: '#eff6ff',
                                          color: '#1d4ed8',
                                          border: '1px solid #bfdbfe',
                                          padding: '2px 7px',
                                          borderRadius: 4,
                                          fontWeight: 700,
                                          fontFamily: 'monospace'
                                        }}
                                      >
                                        🚌 {bObj?.registration_number || `Bus #${bId}`}
                                      </span>
                                    );
                                  })
                                )}
                              </div>

                              <span style={{ color: '#15803d', fontWeight: 800 }}>➔</span>
                              <span style={{ background: rowForm.route_id ? '#fef3c7' : '#f8fafc', color: rowForm.route_id ? '#b45309' : '#64748b', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace' }}>
                                🛣️ {refs.routes?.find(r => String(r.id) === String(rowForm.route_id))?.route_code || 'No Route'}
                              </span>
                              <span style={{ color: '#15803d', fontWeight: 800 }}>➔</span>
                              <span style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                🏫 {refs.institutions?.find(i => String(i.id) === String(rowForm.institution_id))?.short_name || refs.institutions?.find(i => String(i.id) === String(rowForm.institution_id))?.name || 'Consolidated / Unassigned'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>Shift:</span>
                                <select
                                  className="fselect"
                                  value={rowForm.shift || 'both'}
                                  onChange={e => setRowForm(prev => ({ ...prev, shift: e.target.value }))}
                                  style={{ fontSize: 11.5, padding: '3px 8px', fontWeight: 600, background: '#ffffff' }}
                                >
                                  <option value="both">☀️🌙 Both Shifts (Morning & Evening)</option>
                                  <option value="morning1">☀️ Morning Shift Only</option>
                                  <option value="evening1">🌙 Evening Shift Only</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleRowSave(d.id)}
                                disabled={savingId === d.id}
                                style={{
                                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: 12,
                                  padding: '5px 14px',
                                  borderRadius: 6,
                                  border: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: '0 1px 3px rgba(22, 163, 74, 0.4)',
                                  cursor: 'pointer'
                                }}
                              >
                                {savingId === d.id ? 'Saving...' : '💾 Save Changes'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                }

                // --- NORMAL READ-ONLY ROW ---
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }} className="mono">
                      {idx + 1}
                    </td>

                    {/* 1. Driver Name */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{d.name}</div>
                      {d.employee_code && (
                        <div style={{ fontSize: 11, color: '#2563eb' }} className="mono">
                          ID: {d.employee_code}
                        </div>
                      )}
                    </td>

                    {/* 2. Assigned Bus Number (Supports multiple bus badges) */}
                    <td>
                      {d.assigned_bus_numbers ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {d.assigned_bus_numbers.split(', ').map(b => (
                            <span
                              key={b}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '2px 7px',
                                borderRadius: 5,
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: 'JetBrains Mono, monospace'
                              }}
                            >
                              <span style={{ fontSize: 11 }}>🚌</span> {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>— No Bus (Standby)</span>
                      )}
                    </td>

                    {/* 3. Assigned Route */}
                    <td>
                      {d.assigned_route_code ? (
                        <div>
                          <b className="mono" style={{ color: '#0f172a' }}>{d.assigned_route_code}</b>
                          {d.assigned_route_name && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>{d.assigned_route_name}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>— No Route</span>
                      )}
                    </td>

                    {/* 4. Campus / Institution */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {d.institution_name && d.institution_name !== '—' ? d.institution_name : 'Consolidated / Unassigned'}
                      </span>
                    </td>

                    {/* Mobile */}
                    <td className="mono" style={{ fontSize: 12 }}>
                      {d.phone || '—'}
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`tag ${isActive ? 'tag--ok' : 'tag--off'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Action button */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => startRowEdit(d)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '5px 12px',
                          borderRadius: 6,
                          boxShadow: '0 1px 3px rgba(2, 132, 199, 0.3)',
                          cursor: 'pointer'
                        }}
                        title="Edit driver name, multiple buses, route, and institution in this row"
                      >
                        <span>⚡</span> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW DRIVER MODAL (Driver Name, Bus No (Multiple), Route, Institution) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          className="modal-bg"
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 14,
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              animation: 'slideUp 0.25s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderBottom: '1px solid #334155'
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#4ade80', fontSize: 20 }}>➕</span>
                  <span>Add New Driver (Master Allocation)</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  Quick registration with Multiple Buses, Route & Campus. Remaining profile fields stay empty.
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveNewDriver} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '24px 26px', background: '#f8fafc', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                
                {/* 1. Driver Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    1. Driver Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="finput"
                    value={addForm.name}
                    onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full driver name (e.g. KARTHIK S)"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 7,
                      border: '1.5px solid #94a3b8',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    autoFocus
                    required
                  />
                </div>

                {/* 2. Assigned Bus No (Multiple) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      2. Assigned Bus No (Multiple Allowed)
                    </label>
                    <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                      Type & Enter to add chips
                    </span>
                  </div>
                  <MultiBusSearchPicker
                    buses={refs.buses || []}
                    selectedBusIds={addForm.bus_ids || []}
                    activeInstId={addForm.institution_id}
                    onChange={(newBusIds) => {
                      setAddForm(prev => {
                        const updated = { ...prev, bus_ids: newBusIds };
                        // Auto-set campus if not yet set
                        if (newBusIds.length > 0 && !prev.institution_id) {
                          const firstBus = refs.buses?.find(b => Number(b.id) === Number(newBusIds[0]));
                          if (firstBus?.institution_id) {
                            updated.institution_id = String(firstBus.institution_id);
                          }
                        }
                        return updated;
                      });
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    💡 One driver can drive multiple buses. Search registration number and press <b>Enter</b> to attach multiple buses.
                  </div>
                </div>

                {/* 3. Campus / Institution */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    3. Campus / Institution
                  </label>
                  <InstSearchPicker
                    institutions={refs.institutions || []}
                    selectedInstId={addForm.institution_id}
                    onChange={(newInstId) => {
                      setAddForm(prev => ({ ...prev, institution_id: newInstId }));
                    }}
                  />
                </div>

                {/* 4. Assigned Route */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    4. Assigned Route
                  </label>
                  <RouteSearchPicker
                    routes={refs.routes || []}
                    selectedRouteId={addForm.route_id}
                    activeInstId={addForm.institution_id}
                    onChange={(newRouteId) => {
                      setAddForm(prev => {
                        const updated = { ...prev, route_id: newRouteId };
                        if (newRouteId) {
                          const rMatch = refs.routes?.find(r => String(r.id) === String(newRouteId));
                          if (rMatch?.institution_id && (!prev.institution_id || prev.institution_id !== String(rMatch.institution_id))) {
                            updated.institution_id = String(rMatch.institution_id);
                          }
                        }
                        return updated;
                      });
                    }}
                  />
                </div>

                {/* Information Card on Balance Fields */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 11.5,
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    lineHeight: 1.5
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>📄</span>
                  <div>
                    <b style={{ color: '#0f172a' }}>Balance Details (Licence, Mobile, Licence Expiry, Status):</b>
                    <br />
                    Licence, Mobile, and Licence Expiry will remain <i>empty / unassigned</i> on creation. Status will automatically be set to <b style={{ color: '#15803d' }}>Active</b>. You can update these anytime later from the full profile editor.
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 24px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#ffffff'
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={addSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addSaving || !addForm.name.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    fontWeight: 700,
                    padding: '8px 22px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  {addSaving ? 'Adding Driver...' : '💾 Save & Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
