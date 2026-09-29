import React, { useState, useEffect, useRef, Fragment } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { exportDriverShiftBackupPdf } from '../../utils/driverBackupPdf';

function DmIcon({ name, size = 18, color = 'currentColor', style = {} }) {
  const icons = {
    driver: <><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/></>,
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    refresh: <><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0, ...style }}>
      {icons[name] || icons.driver}
    </svg>
  );
}

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
// 1b. SingleBusSearchPicker: Search button & quick selection for single bus
// =========================================================================
function SingleBusSearchPicker({ buses = [], selectedBusId, onChange, activeInstId }) {
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

  const selectedBus = buses.find(b => String(b.id) === String(selectedBusId));

  const q = query.toLowerCase().trim();
  const matchedBuses = buses.filter(b => {
    if (!q) return true;
    return (b.registration_number || '').toLowerCase().includes(q) ||
           (b.bus_code || '').toLowerCase().includes(q) ||
           String(b.capacity || '').includes(q);
  });

  const sortedMatches = [...matchedBuses].sort((a, b) => {
    if (activeInstId) {
      const aMatch = String(a.institution_id) === String(activeInstId);
      const bMatch = String(b.institution_id) === String(activeInstId);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return (a.registration_number || '').localeCompare(b.registration_number || '');
  });

  const selectBus = (busId) => {
    onChange(busId ? String(busId) : '');
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sortedMatches.length > 0) {
        selectBus(sortedMatches[0].id);
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
          gap: 6,
          background: '#ffffff',
          border: isOpen ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
          borderRadius: 6,
          padding: '4px 6px 4px 8px',
          minHeight: 38,
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <span style={{ fontSize: 14 }}>🚌</span>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedBus ? `${selectedBus.registration_number} ${selectedBus.bus_code ? `(${selectedBus.bus_code})` : ''} ${selectedBus.capacity ? `· ${selectedBus.capacity} seats` : ''}` : '')}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedBus ? selectedBus.registration_number : "Search bus no (e.g. TN45, 2337)..."}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 12.5,
            fontWeight: selectedBus && !isOpen ? 700 : 500,
            fontFamily: selectedBus && !isOpen ? 'JetBrains Mono, monospace' : 'inherit',
            color: selectedBus && !isOpen ? '#1d4ed8' : '#0f172a',
            background: 'transparent'
          }}
        />

        {selectedBus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              selectBus('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
              padding: '0 4px',
              fontWeight: 800
            }}
            title="Clear selected bus"
          >
            ✕
          </button>
        )}

        {/* Search Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && inputRef.current) inputRef.current.focus();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 4,
            padding: '5px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
          }}
          title="Search and select bus number"
        >
          <span>🔍</span>
          <span>Search</span>
        </button>
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
            border: '1.5px solid #2563eb',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 150
          }}
        >
          <div style={{ padding: '5px 8px', fontSize: 10.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>PRESS ENTER TO SELECT:</span>
            <span>{sortedMatches.length} matching buses</span>
          </div>

          {sortedMatches.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              No matching buses found
            </div>
          ) : (
            sortedMatches.map((b, i) => {
              const isSelected = selectedBusId && String(b.id) === String(selectedBusId);
              const isCampusBus = activeInstId && String(b.institution_id) === String(activeInstId);
              return (
                <div
                  key={b.id}
                  onClick={() => selectBus(b.id)}
                  style={{
                    padding: '7px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: isSelected ? '#eff6ff' : (i === 0 && query ? '#f8fafc' : 'transparent'),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = (isSelected ? '#eff6ff' : (i === 0 && query ? '#f8fafc' : 'transparent'))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8', fontSize: 12.5 }}>
                      🚌 {b.registration_number}
                    </span>
                    {b.bus_code && (
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>({b.bus_code})</span>
                    )}
                    {b.capacity && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>· {b.capacity} seats</span>
                    )}
                    {isCampusBus && (
                      <span style={{ fontSize: 9.5, background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                        Campus
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 11, color: '#15803d', fontWeight: 800 }}>✓ Selected</span>
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
// 2. RouteSearchPicker: Search button & quick selection for Route
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
    const matchesCode = (r.route_code || '').toLowerCase().includes(q);
    const matchesName = (r.route_name || '').toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q);
    const matchesOrigin = (r.origin || '').toLowerCase().includes(q);
    const matchesDest = (r.destination || '').toLowerCase().includes(q);
    const matchesStops = (r.stops_list || '').toLowerCase().includes(q);
    return matchesCode || matchesName || matchesOrigin || matchesDest || matchesStops;
  });

  const sortedMatches = [...matchedRoutes].sort((a, b) => {
    if (activeInstId) {
      const aMatch = String(a.institution_id) === String(activeInstId);
      const bMatch = String(b.institution_id) === String(activeInstId);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }

    if (q) {
      // Direct route_code match prioritized
      const aCode = (a.route_code || '').toLowerCase().includes(q);
      const bCode = (b.route_code || '').toLowerCase().includes(q);
      if (aCode && !bCode) return -1;
      if (!aCode && bCode) return 1;

      // Then route_name match
      const aName = (a.route_name || a.name || '').toLowerCase().includes(q);
      const bName = (b.route_name || b.name || '').toLowerCase().includes(q);
      if (aName && !bName) return -1;
      if (!aName && bName) return 1;
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
          gap: 6,
          background: '#ffffff',
          border: isOpen ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
          borderRadius: 6,
          padding: '4px 6px 4px 8px',
          minHeight: 38,
          boxShadow: isOpen ? '0 0 0 3px rgba(5, 150, 105, 0.15)' : '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <span style={{ fontSize: 14 }}>🛣️</span>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedRoute ? `${selectedRoute.route_code} · ${selectedRoute.route_name || selectedRoute.name || ''} (${selectedRoute.origin || 'Start'} ➔ ${selectedRoute.destination || 'Campus'})` : '')}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedRoute ? selectedRoute.route_code : "Search by route code, name, or stop name (e.g. Odaipatti, Bodi, 601)..."}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 12.5,
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
              fontSize: 13,
              cursor: 'pointer',
              padding: '0 4px',
              fontWeight: 800
            }}
            title="Remove route (set Standby)"
          >
            ✕
          </button>
        )}

        {/* Search Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && inputRef.current) inputRef.current.focus();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 4,
            padding: '5px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)'
          }}
          title="Search by route code, name or bus stop"
        >
          <span>🔍</span>
          <span>Search</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            width: '100%',
            minWidth: 360,
            maxWidth: 540,
            maxHeight: 280,
            overflowY: 'auto',
            background: '#ffffff',
            border: '1.5px solid #059669',
            borderRadius: 6,
            boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
            zIndex: 99999
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: 10.5, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {sortedMatches.length} matching route{sortedMatches.length === 1 ? '' : 's'} {q ? `for "${query}"` : '(searches routes & stops)'}
            </span>
            <span
              onClick={() => selectRoute('')}
              style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 700, background: '#fee2e2', padding: '1px 6px', borderRadius: 3 }}
            >
              Standby (No Route)
            </span>
          </div>

          {sortedMatches.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              No routes or stops matching "<strong>{query}</strong>"
            </div>
          ) : (
            sortedMatches.map((r, i) => {
              const isSelected = selectedRouteId && String(r.id) === String(selectedRouteId);
              const isCampusRoute = activeInstId && String(r.institution_id) === String(activeInstId);

              // Check if query matched any intermediate stops
              const matchingStops = q && r.stops_list
                ? r.stops_list.split(',').map(s => s.trim()).filter(s => s.toLowerCase().includes(q))
                : [];

              return (
                <div
                  key={r.id}
                  onClick={() => selectRoute(r.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: isSelected ? '#ecfdf5' : (i === 0 && query ? '#f8fafc' : 'transparent'),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
                  onMouseLeave={e => e.currentTarget.style.background = (isSelected ? '#ecfdf5' : (i === 0 && query ? '#f8fafc' : 'transparent'))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <b className="mono" style={{ color: '#047857', fontSize: 12.5 }}>🛣️ {r.route_code}</b>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {isSelected && (
                        <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 800 }}>✓ Selected</span>
                      )}
                      {r.total_stops > 0 && (
                        <span style={{ fontSize: 9.5, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                          🚏 {r.total_stops} stops
                        </span>
                      )}
                      {isCampusRoute && (
                        <span style={{ fontSize: 9.5, background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                          Campus
                        </span>
                      )}
                    </div>
                  </div>

                  {(r.route_name || r.name) && (
                    <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 700 }}>
                      {r.route_name || r.name}
                    </div>
                  )}

                  {(r.origin || r.destination) && (
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {r.origin || 'Start'} ➔ {r.destination || 'Campus'}
                    </div>
                  )}

                  {/* Matching Stop Badge (shown when user searches a stop name) */}
                  {matchingStops.length > 0 && (
                    <div style={{
                      fontSize: 10.5,
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      borderRadius: 4,
                      padding: '2px 7px',
                      marginTop: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontWeight: 700,
                      alignSelf: 'flex-start'
                    }}>
                      <span>📍 Matching Stop:</span>
                      <span style={{ color: '#b45309', textDecoration: 'underline' }}>
                        {matchingStops.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Full Intermediate Stops Sequence */}
                  {r.stops_list && (
                    <div
                      title={`All Stops along this route: ${r.stops_list}`}
                      style={{
                        fontSize: 10,
                        color: '#64748b',
                        marginTop: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ color: '#0284c7', fontWeight: 700, flexShrink: 0 }}>🚏 Stops:</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.stops_list}
                      </span>
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

const SHIFT_MAP = {
  morning1: '☀️ Morning 1',
  morning2: '☀️ Morning 2',
  morning3: '☀️ Morning 3',
  morning4: '☀️ Morning 4',
  evening1: '🌙 Evening 1',
  evening2: '🌙 Evening 2',
  evening3: '🌙 Evening 3',
  evening4: '🌙 Evening 4'
};

const PRESET_COMBINATIONS = [
  { value: 'm1_e1', label: '☀️ 🌙 Both sessions (Morning 1 + Evening 1)', shifts: ['morning1', 'evening1'] },
  { value: 'm1_e2', label: '☀️ 🌙 Morning 1 + Evening 2', shifts: ['morning1', 'evening2'] },
  { value: 'm2_e1', label: '☀️ 🌙 Morning 2 + Evening 1', shifts: ['morning2', 'evening1'] },
  { value: 'm2_e2', label: '☀️ 🌙 Morning 2 + Evening 2', shifts: ['morning2', 'evening2'] },
  { value: 'all_m', label: '☀️ All 4 Morning sessions (M1, M2, M3, M4)', shifts: ['morning1', 'morning2', 'morning3', 'morning4'] },
  { value: 'all_e', label: '🌙 All 4 Evening sessions (E1, E2, E3, E4)', shifts: ['evening1', 'evening2', 'evening3', 'evening4'] },
  { value: 'all', label: '🔄 All 8 sessions (M1-M4, E1-E4)', shifts: ['morning1', 'morning2', 'morning3', 'morning4', 'evening1', 'evening2', 'evening3', 'evening4'] },
  { value: 'morning1', label: '☀️ Morning 1 only', shifts: ['morning1'] },
  { value: 'morning2', label: '☀️ Morning 2 only', shifts: ['morning2'] },
  { value: 'morning3', label: '☀️ Morning 3 only', shifts: ['morning3'] },
  { value: 'morning4', label: '☀️ Morning 4 only', shifts: ['morning4'] },
  { value: 'evening1', label: '🌙 Evening 1 only', shifts: ['evening1'] },
  { value: 'evening2', label: '🌙 Evening 2 only', shifts: ['evening2'] },
  { value: 'evening3', label: '🌙 Evening 3 only', shifts: ['evening3'] },
  { value: 'evening4', label: '🌙 Evening 4 only', shifts: ['evening4'] },
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

  // Multi-tab trip edit modal for single driver
  const [modalDriver, setModalDriver] = useState(null);
  const [driverTrips, setDriverTrips] = useState([]);
  const [activeTripTab, setActiveTripTab] = useState(0);
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', status: 'active', institution_id: '' });
  const [modalSaving, setModalSaving] = useState(false);

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

  const handlePrintDriverShiftBackup = async () => {
    try {
      const activeInst = refs.institutions?.find(i => String(i.id) === String(instFilter));
      const institutionTitle = activeInst 
        ? (activeInst.name || activeInst.short_name).toUpperCase() 
        : 'NADAR GROUP OF INSTITUTIONS — FLEET MANAGEMENT';
      await exportDriverShiftBackupPdf({
        institutionTitle,
        userName: user?.name || 'Administrator',
        activeInstId: instFilter !== 'ALL' ? instFilter : 'all',
        searchQuery
      });
    } catch (err) {
      console.error('Failed to export driver shift backup PDF:', err);
      toast('Could not generate Driver Shift Backup PDF');
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

  // =========================================================================
  // MULTI-TAB DRIVER EDIT POPUP MODAL (S.No wise trips & buses)
  // =========================================================================
  const openDriverEditModal = async (d) => {
    setModalDriver(d);
    setDriverForm({
      name: d.name || '',
      phone: d.phone || '',
      status: d.status || 'active',
      institution_id: d.current_institution_id ? String(d.current_institution_id) : (d.institution_id ? String(d.institution_id) : '')
    });

    let existingTrips = [];
    let currentRefs = refs;
    try {
      // Re-fetch latest refs and assignments so any changes in Routes & Stops or Driver Edit are immediately fresh
      const [freshRefs, assignRes] = await Promise.all([
        api.refs(),
        api.assignments()
      ]);
      if (freshRefs) {
        currentRefs = freshRefs;
        setRefs(freshRefs);
      }
      const drvAssigns = (assignRes.items || []).filter(a => Number(a.driver_id) === Number(d.id));

      if (drvAssigns.length > 0) {
        const grouped = {};
        drvAssigns.forEach(a => {
          const key = `${a.bus_id || ''}_${a.route_id || ''}`;
          if (!grouped[key]) {
            grouped[key] = {
              ...a,
              shifts: a.shift ? [a.shift] : ['morning1']
            };
          } else {
            if (a.shift && !grouped[key].shifts.includes(a.shift)) {
              grouped[key].shifts.push(a.shift);
            }
          }
        });

        existingTrips = Object.values(grouped).map((a, idx) => {
          const rObj = currentRefs.routes?.find(r => Number(r.id) === Number(a.route_id));
          return {
            id: a.id || idx + 1,
            sno: idx + 1,
            bus_id: a.bus_id ? String(a.bus_id) : '',
            route_id: a.route_id ? String(a.route_id) : '',
            shifts: a.shifts || [a.shift || (idx === 0 ? 'morning1' : 'morning2')],
            shift: a.shifts?.[0] || a.shift || 'morning1',
            initial_point: rObj?.initial_point || '',
            initial_time: rObj?.initial_time ? rObj.initial_time.slice(0, 5) : '',
            origin: rObj?.origin || '',
            boarding_time: rObj?.boarding_time ? rObj.boarding_time.slice(0, 5) : '',
            destination: rObj?.destination || '',
            end_time: rObj?.end_time ? rObj.end_time.slice(0, 5) : ''
          };
        });
      }
    } catch (err) {
      console.warn('Could not load specific assignments, using fallback', err);
    }

    if (existingTrips.length === 0) {
      const primaryRouteObj = currentRefs.routes?.find(r => Number(r.id) === Number(d.current_route_id || d.route_id));
      const primaryBusId = d.current_bus_ids ? d.current_bus_ids.split(',')[0] : (d.current_bus_id ? String(d.current_bus_id) : '');

      existingTrips = [
        {
          id: 1,
          sno: 1,
          bus_id: primaryBusId || '',
          route_id: primaryRouteObj ? String(primaryRouteObj.id) : '',
          shifts: ['morning1', 'evening1'],
          shift: 'morning1',
          initial_point: primaryRouteObj?.initial_point || '',
          initial_time: primaryRouteObj?.initial_time ? primaryRouteObj.initial_time.slice(0, 5) : '',
          origin: primaryRouteObj?.origin || '',
          boarding_time: primaryRouteObj?.boarding_time ? primaryRouteObj.boarding_time.slice(0, 5) : '',
          destination: primaryRouteObj?.destination || '',
          end_time: primaryRouteObj?.end_time ? primaryRouteObj.end_time.slice(0, 5) : ''
        }
      ];
    }

    setDriverTrips(existingTrips);
    setActiveTripTab(0);
  };

  const handleAddTripTab = () => {
    const nextSno = driverTrips.length + 1;
    let defaultShifts = ['morning2'];
    if (driverTrips.some(t => (t.shifts || [t.shift]).includes('morning2'))) defaultShifts = ['evening2'];

    const lastBus = driverTrips[driverTrips.length - 1]?.bus_id || '';

    const newTrip = {
      id: Date.now(),
      sno: nextSno,
      bus_id: lastBus,
      route_id: '',
      shifts: defaultShifts,
      shift: defaultShifts[0],
      initial_point: '',
      initial_time: '',
      origin: '',
      boarding_time: '',
      destination: '',
      end_time: ''
    };
    setDriverTrips(prev => [...prev, newTrip]);
    setActiveTripTab(driverTrips.length);
  };

  const handleTripPresetChange = (presetValue) => {
    const preset = PRESET_COMBINATIONS.find(p => p.value === presetValue);
    if (!preset) return;
    setDriverTrips(prev => prev.map((t, idx) => {
      if (idx === activeTripTab) {
        return {
          ...t,
          shifts: preset.shifts,
          shift: preset.shifts[0] || 'morning1'
        };
      }
      return t;
    }));
  };

  const handleToggleTripShift = (shiftKey) => {
    const currentTrip = driverTrips[activeTripTab];
    if (!currentTrip) return;
    const currentShifts = currentTrip.shifts || (currentTrip.shift ? [currentTrip.shift] : ['morning1']);
    if (currentShifts.includes(shiftKey) && currentShifts.length <= 1) {
      toast('At least one session/shift must remain selected.');
      return;
    }
    const nextShifts = currentShifts.includes(shiftKey)
      ? currentShifts.filter(s => s !== shiftKey)
      : [...currentShifts, shiftKey];

    setDriverTrips(prev => prev.map((t, idx) => {
      if (idx === activeTripTab) {
        return {
          ...t,
          shifts: nextShifts,
          shift: nextShifts[0] || 'morning1'
        };
      }
      return t;
    }));
  };

  const handleRemoveTripTab = (indexToRemove, e) => {
    if (e) e.stopPropagation();
    if (driverTrips.length <= 1) {
      toast('At least one trip must remain.');
      return;
    }
    const updated = driverTrips.filter((_, idx) => idx !== indexToRemove).map((t, idx) => ({ ...t, sno: idx + 1 }));
    setDriverTrips(updated);
    if (activeTripTab >= updated.length) {
      setActiveTripTab(updated.length - 1);
    }
  };

  const handleTripRouteChange = (routeId) => {
    const rObj = refs.routes?.find(r => String(r.id) === String(routeId));
    setDriverTrips(prev => prev.map((t, idx) => {
      if (idx === activeTripTab) {
        return {
          ...t,
          route_id: routeId,
          initial_point: rObj?.initial_point || '',
          initial_time: rObj?.initial_time ? rObj.initial_time.slice(0, 5) : '',
          origin: rObj?.origin || '',
          boarding_time: rObj?.boarding_time ? rObj.boarding_time.slice(0, 5) : '',
          destination: rObj?.destination || '',
          end_time: rObj?.end_time ? rObj.end_time.slice(0, 5) : ''
        };
      }
      return t;
    }));
  };

  const updateActiveTripField = (field, value) => {
    setDriverTrips(prev => prev.map((t, idx) => {
      if (idx === activeTripTab) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const handleSaveDriverTripsModal = async () => {
    if (!driverForm.name?.trim()) {
      toast('Driver name cannot be empty');
      return;
    }

    setModalSaving(true);
    try {
      await api.driverMasterEdit(modalDriver.id, {
        ...driverForm,
        trips: driverTrips
      });

      toast(`✓ Successfully saved multi-trip assignments for ${driverForm.name}`);
      setModalSaving(false);
      setModalDriver(null);
      loadData();
    } catch (err) {
      setModalSaving(false);
      toast(err.message || 'Could not save driver trips');
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
      (d.assigned_route_name || '').toLowerCase().includes(q) ||
      (d.institution_name || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q) ||
      (q && refs.routes?.some(r => {
        const isDriverRoute = d.current_route_ids
          ? d.current_route_ids.split(',').map(s => s.trim()).includes(String(r.id))
          : (String(r.id) === String(d.current_route_id || d.route_id));
        return isDriverRoute && (r.stops_list || '').toLowerCase().includes(q);
      }));

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
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚡ Driver Master Edit</span>
            <span className="live-badge" style={{ background: '#f0eeff', color: '#6854ec', borderColor: '#e0dcfc' }}>
              <span className="dot" />
              <span>ROSTER CONTROL</span>
            </span>
          </div>
          <div className="page-sub">
            Click <b>Edit</b> to search & select <b>Multiple Buses</b>, <b>Routes</b>, and <b>Campus Institution</b> using instant search-and-enter dropdowns.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={openAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700
            }}
            title="Add a new driver with bus, route & campus mapping"
          >
            <DmIcon name="plus" size={15} color="#ffffff" />
            <span>Add New Driver</span>
          </button>
          <button
            className="btn btn-sm"
            onClick={handlePrintDriverShiftBackup}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #7c6cfc 0%, #6854ec 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(124, 108, 252, 0.35)',
              cursor: 'pointer'
            }}
            title="Download / Print Complete Driver Backup before/after editing (Driver, Bus, Campus, Route & Morning/Evening Shifts)"
          >
            <DmIcon name="download" size={15} color="#ffffff" />
            <span>Driver Shift Backup (PDF)</span>
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh driver fleet data"
          >
            <DmIcon name="refresh" size={14} color="#475569" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon (Dashboard UI Theme) */}
        <div className="att-kpi-ribbon" style={{ marginBottom: 18 }}>
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <DmIcon name="driver" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{totalCount}</div>
              <div className="att-kpi-label">Total Registered Drivers</div>
              <div className="att-kpi-sub">In TMHNU central roster</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <DmIcon name="check" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{assignedCount}</div>
              <div className="att-kpi-label">Mapped on Bus & Route</div>
              <div className="att-kpi-sub">{totalCount > 0 ? `${Math.round((assignedCount / totalCount) * 100)}% active duty` : 'Active bus operators'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${unassignedCount > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--amber">
              <DmIcon name="alert" size={22} color={unassignedCount > 0 ? '#f59e0b' : '#10b981'} />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: unassignedCount > 0 ? '#d97706' : '#10b981' }}>
                {unassignedCount}
              </div>
              <div className="att-kpi-label">Standby / Unassigned</div>
              <div className="att-kpi-sub">{unassignedCount > 0 ? 'Reserve drivers available' : 'All drivers mapped'}</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--blue">
              <DmIcon name="building" size={22} color="#0284c7" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#0284c7' }}>
                {refs.institutions?.length || 0} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Institutions</span>
              </div>
              <div className="att-kpi-label">Fleet Infrastructure</div>
              <div className="att-kpi-sub">{refs.buses?.length || 0} Buses · {refs.routes?.length || 0} Routes</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar (Dashboard Card Style) */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                  <DmIcon name="search" size={15} color="#94a3b8" />
                </span>
                <input
                  type="text"
                  className="finput"
                  placeholder="Search driver name, bus no, route, mobile..."
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

              {refs.institutions?.length > 0 && (
                <select
                  className="fselect"
                  value={instFilter}
                  onChange={e => setInstFilter(e.target.value)}
                  style={{ maxWidth: 260, height: 38, fontWeight: 600 }}
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
                style={{ maxWidth: 200, height: 38, fontWeight: 600 }}
              >
                <option value="ALL">All Drivers ({drivers.length})</option>
                <option value="assigned">✅ Assigned to Bus & Route ({assignedCount})</option>
                <option value="unassigned">⚠️ Standby (Unassigned) ({unassignedCount})</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Showing <b>{filteredDrivers.length}</b> of {drivers.length} drivers
              </span>
            </div>
          </div>
        </div>

        {/* Master Edit Table with Search & Multi-Bus Inline Pickers */}
        <div className="table-wrap">
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
                        onClick={() => openDriverEditModal(d)}
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

      {/* ========================================================================= */}
      {/* MULTI-TAB DRIVER EDIT POPUP MODAL (S.No wise trips & multiple buses)     */}
      {/* ========================================================================= */}
      {modalDriver && (
        <div
          className="modal-bg"
          onClick={() => setModalDriver(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20
          }}
        >
          {(() => {
            const currentTrip = driverTrips[activeTripTab] || driverTrips[0] || {};
            const activeBus = refs.buses?.find(b => String(b.id) === String(currentTrip.bus_id));
            const activeRoute = refs.routes?.find(r => String(r.id) === String(currentTrip.route_id));

            return (
              <div
                className="modal"
                style={{
                  maxWidth: 960,
                  width: '100%',
                  maxHeight: '92vh',
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
                {/* 1. Modal Header */}
                <div
                  style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #334155'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22
                      }}
                    >
                      👨‍✈️
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px', fontFamily: 'Oswald, sans-serif' }}>
                          {driverForm.name || modalDriver.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            background: driverForm.status === 'active' ? '#22c55e' : '#ef4444',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          {driverForm.status}
                        </span>
                        {modalDriver.employee_code && (
                          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: '#93c5fd', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace' }}>
                            ID: {modalDriver.employee_code}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        Driver Name is constant · Single driver can be assigned multiple buses, routes & trips
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalDriver(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: 24,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                      lineHeight: 1
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* 2. Constant Driver Info Bar */}
                <div
                  style={{
                    padding: '10px 24px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Driver Name:</span>
                      <span style={{ fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 10px', borderRadius: 6 }}>
                        👤 {driverForm.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Mobile:</span>
                      <input
                        type="text"
                        className="finput"
                        value={driverForm.phone}
                        onChange={e => setDriverForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Mobile number"
                        style={{ padding: '3px 8px', fontSize: 12, width: 130, background: '#ffffff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Campus:</span>
                      <select
                        className="fselect"
                        value={driverForm.institution_id || ''}
                        onChange={e => setDriverForm(prev => ({ ...prev, institution_id: e.target.value }))}
                        style={{ padding: '3px 8px', fontSize: 12, minWidth: 160, background: '#ffffff' }}
                      >
                        <option value="">Consolidated / Unassigned</option>
                        {(refs.institutions || []).map(i => (
                          <option key={i.id} value={i.id}>{i.short_name || i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                      <select
                        className="fselect"
                        value={driverForm.status}
                        onChange={e => setDriverForm(prev => ({ ...prev, status: e.target.value }))}
                        style={{ padding: '3px 8px', fontSize: 12, background: '#ffffff' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Multi-Tab Navigation (S.No wise for trips/buses) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px 0',
                    background: '#f1f5f9',
                    borderBottom: '1px solid #cbd5e1',
                    overflowX: 'auto'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: 4, whiteSpace: 'nowrap', paddingBottom: 10 }}>
                    TRIP TABS (S.NO WISE):
                  </div>
                  {driverTrips.map((trip, idx) => {
                    const isActive = activeTripTab === idx;
                    const bObj = refs.buses?.find(b => String(b.id) === String(trip.bus_id));
                    const rObj = refs.routes?.find(r => String(r.id) === String(trip.route_id));
                    return (
                      <div
                        key={trip.id || idx}
                        onClick={() => setActiveTripTab(idx)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 14px',
                          borderRadius: '8px 8px 0 0',
                          borderTop: isActive ? '3px solid #0284c7' : '1px solid #cbd5e1',
                          borderLeft: '1px solid #cbd5e1',
                          borderRight: '1px solid #cbd5e1',
                          borderBottom: isActive ? '1px solid #ffffff' : '1px solid #cbd5e1',
                          background: isActive ? '#ffffff' : '#e2e8f0',
                          color: isActive ? '#0284c7' : '#475569',
                          fontWeight: 700,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 -2px 6px rgba(0,0,0,0.04)' : 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          position: 'relative',
                          marginBottom: -1
                        }}
                      >
                        <span
                          style={{
                            background: isActive ? '#0284c7' : '#94a3b8',
                            color: '#ffffff',
                            padding: '1px 7px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                        >
                          S.No {idx + 1}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>🚌</span>
                          <span>{bObj ? bObj.registration_number : `Bus #${idx + 1}`}</span>
                          {rObj && (
                            <span style={{ color: isActive ? '#0369a1' : '#64748b', fontSize: 11.5, fontWeight: 600 }}>
                              · {rObj.route_code}
                            </span>
                          )}
                          <span style={{ 
                            background: isActive ? '#0284c7' : '#e2e8f0', 
                            color: isActive ? '#ffffff' : '#475569', 
                            fontSize: 10, 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: 10,
                            marginLeft: 3
                          }}>
                            {(trip.shifts || [trip.shift || 'morning1']).map(s => {
                              const sm = { morning1: 'M1', morning2: 'M2', morning3: 'M3', morning4: 'M4', evening1: 'E1', evening2: 'E2', evening3: 'E3', evening4: 'E4' };
                              return sm[s] || s;
                            }).join('+')}
                          </span>
                        </span>
                        {driverTrips.length > 1 && (
                          <span
                            onClick={(e) => handleRemoveTripTab(idx, e)}
                            style={{
                              marginLeft: 4,
                              fontSize: 13,
                              color: '#ef4444',
                              padding: '2px 5px',
                              borderRadius: 4,
                              lineHeight: 1,
                              cursor: 'pointer'
                            }}
                            title={`Remove Trip ${idx + 1}`}
                          >
                            ✕
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddTripTab}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '7px 14px',
                      borderRadius: 6,
                      border: '1.5px dashed #0284c7',
                      background: '#f0f9ff',
                      color: '#0284c7',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      marginLeft: 6,
                      marginBottom: 6
                    }}
                    title="Add Another Trip / Bus (Trip 2, Trip 3, etc.)"
                  >
                    <span>+ Add Trip {driverTrips.length + 1}</span>
                  </button>
                </div>

                {/* 4. Active Tab Form Body */}
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#ffffff' }}>
                  {/* Trip Header Banner */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: 8,
                      padding: '10px 16px',
                      marginBottom: 18,
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🚌</span>
                      <span style={{ fontWeight: 800, fontSize: 13.5, color: '#1e3a8a' }}>
                        CONFIGURATION FOR S.NO {activeTripTab + 1}: TRIP {activeTripTab + 1}
                      </span>
                      <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                        Driver: {driverForm.name}
                      </span>
                    </div>
                    {/* Selectable Trip / Sessions (Matching 1st Image) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a' }}>Trip / Shift:</span>
                        <select
                          className="fselect"
                          value={getSelectValue(currentTrip.shifts || [currentTrip.shift || 'morning1'])}
                          onChange={e => handleTripPresetChange(e.target.value)}
                          style={{ padding: '5px 12px', fontSize: 12.5, background: '#ffffff', fontWeight: 600, minWidth: 280, borderRadius: 6, border: '1.5px solid #cbd5e1' }}
                        >
                          {PRESET_COMBINATIONS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                          <option value="custom" disabled={getSelectValue(currentTrip.shifts || [currentTrip.shift || 'morning1']) !== 'custom'}>
                            ⚡ Custom Selection ({(currentTrip.shifts || [currentTrip.shift || 'morning1']).map(s => SHIFT_MAP[s] || s).join(', ')})
                          </option>
                        </select>
                      </div>

                      {/* Selectable toggle chips like in Image 1 */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                        {[
                          { key: 'morning1', label: 'Morning 1', icon: '☀️' },
                          { key: 'morning2', label: 'Morning 2', icon: '☀️' },
                          { key: 'morning3', label: 'Morning 3', icon: '☀️' },
                          { key: 'morning4', label: 'Morning 4', icon: '☀️' },
                          { key: 'evening1', label: 'Evening 1', icon: '🌙' },
                          { key: 'evening2', label: 'Evening 2', icon: '🌙' },
                          { key: 'evening3', label: 'Evening 3', icon: '🌙' },
                          { key: 'evening4', label: 'Evening 4', icon: '🌙' }
                        ].map(({ key, label, icon }) => {
                          const isSelected = (currentTrip.shifts || [currentTrip.shift || 'morning1']).includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleToggleTripShift(key)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                                background: isSelected ? '#eff6ff' : '#ffffff',
                                color: isSelected ? '#1d4ed8' : '#64748b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: isSelected ? '0 1px 3px rgba(37,99,235,0.2)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                              title={`Toggle ${label}`}
                            >
                              <span>{icon}</span>
                              <span>{label}</span>
                              <span style={{ 
                                fontSize: 11, 
                                fontWeight: 800, 
                                color: isSelected ? '#2563eb' : '#94a3b8' 
                              }}>
                                {isSelected ? '✓' : '+'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Bus & Route Selection with Search Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 18 }}>
                    {/* Bus Selection with Search Button */}
                    <div className="card" style={{ padding: 14, margin: 0, border: '1.5px solid #e2e8f0', borderRadius: 8 }}>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 6 }}>
                        🚌 ASSIGNED BUS NUMBER (S.NO {activeTripTab + 1})
                      </label>
                      <SingleBusSearchPicker
                        buses={refs.buses || []}
                        selectedBusId={currentTrip.bus_id || ''}
                        activeInstId={driverForm.institution_id || modalDriver?.current_institution_id || modalDriver?.institution_id}
                        onChange={newBusId => updateActiveTripField('bus_id', newBusId)}
                      />
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                        Click <b>Search</b> or type registration number (e.g. TN45, 2337)
                      </div>
                    </div>

                    {/* Route Selection with Search Button */}
                    <div className="card" style={{ padding: 14, margin: 0, border: '1.5px solid #e2e8f0', borderRadius: 8 }}>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 6 }}>
                        🛣️ ASSIGNED ROUTE (S.NO {activeTripTab + 1})
                      </label>
                      <RouteSearchPicker
                        routes={refs.routes || []}
                        selectedRouteId={currentTrip.route_id || ''}
                        activeInstId={driverForm.institution_id || modalDriver?.current_institution_id || modalDriver?.institution_id}
                        onChange={newRouteId => handleTripRouteChange(newRouteId)}
                      />
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                        Click <b>Search</b> or type route code (pre-fills initial stop, timings & boarding)
                      </div>
                    </div>
                  </div>

                  {/* Route Schedule & Stoppages Editable Section */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 18
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⏱️</span>
                      <span>ROUTE JOURNEY SCHEDULE & TIMINGS (EDITABLE IN THIS PLACE)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                      {/* Initial Point & Timing */}
                      <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 15 }}>🚌</span>
                          <span style={{ fontWeight: 800, fontSize: 12, color: '#1d4ed8' }}>INITIAL STARTING POINT</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                            Initial Stop Name (Bus Starts From)
                          </label>
                          <input
                            type="text"
                            className="finput"
                            value={currentTrip.initial_point || ''}
                            onChange={e => updateActiveTripField('initial_point', e.target.value)}
                            placeholder="e.g. Periyakulam (Bus start point)"
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                            Initial Timing (Departure Time)
                          </label>
                          <input
                            type="time"
                            className="finput"
                            value={currentTrip.initial_time || ''}
                            onChange={e => updateActiveTripField('initial_time', e.target.value)}
                            placeholder="HH:MM"
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                          />
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 6 }}>
                          Where the bus starts before passenger boarding
                        </div>
                      </div>

                      {/* Boarding Point & Time */}
                      <div style={{ background: '#ffffff', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 15 }}>🚏</span>
                          <span style={{ fontWeight: 800, fontSize: 12, color: '#15803d' }}>BOARDING POINT (FIRST PICKUP)</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                            Boarding Stop Name (First Pickup)
                          </label>
                          <input
                            type="text"
                            className="finput"
                            value={currentTrip.origin || ''}
                            onChange={e => updateActiveTripField('origin', e.target.value)}
                            placeholder="e.g. Vadugapatti (First pickup stop)"
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                            Boarding Time (Scheduled Pickup Time)
                          </label>
                          <input
                            type="time"
                            className="finput"
                            value={currentTrip.boarding_time || ''}
                            onChange={e => updateActiveTripField('boarding_time', e.target.value)}
                            placeholder="HH:MM"
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                          />
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 6 }}>
                          Starting point of the route where passengers first board the bus
                        </div>
                      </div>

                      {/* End Point & Time */}
                      <div style={{ background: '#ffffff', border: '1.5px solid #fed7aa', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 15 }}>🏫</span>
                          <span style={{ fontWeight: 800, fontSize: 12, color: '#b45309' }}>END POINT</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                            End Point Stop Name (Destination Campus)
                          </label>
                          <input
                            type="text"
                            className="finput"
                            value={currentTrip.destination || ''}
                            onChange={e => updateActiveTripField('destination', e.target.value)}
                            placeholder="e.g. NSCET CLG"
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>
                            End Point Time (Arrival Time)
                          </label>
                          <input
                            type="time"
                            className="finput"
                            value={currentTrip.end_time || ''}
                            onChange={e => updateActiveTripField('end_time', e.target.value)}
                            placeholder="HH:MM"
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                          />
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 6 }}>
                          Institution destination / college campus where the route ends
                        </div>
                      </div>
                    </div>

                    {/* Live Journey Chain Banner */}
                    <div
                      style={{
                        marginTop: 14,
                        padding: '10px 14px',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                        fontSize: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>⚡ Trip Journey:</span>
                        <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#1e40af' }}>
                          🚌 {currentTrip.initial_point || 'Initial Point'} ({currentTrip.initial_time || '--:--'})
                        </span>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>➔</span>
                        <span style={{ background: '#ffffff', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#15803d' }}>
                          🚏 {currentTrip.origin || 'Boarding Point'} ({currentTrip.boarding_time || '--:--'})
                        </span>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>➔</span>
                        <span style={{ background: '#ffffff', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#b45309' }}>
                          🏫 {currentTrip.destination || 'End Point'} ({currentTrip.end_time || '--:--'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Table of All Trips Configured for this Driver */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      📋 ALL CONFIGURED TRIPS ({driverTrips.length}):
                    </div>
                    <div className="table-wrap" style={{ margin: 0, border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                      <table className="tbl" style={{ margin: 0, fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ width: 50, textAlign: 'center' }}>S.No</th>
                            <th>Shift / Trip</th>
                            <th>Bus Number</th>
                            <th>Assigned Route</th>
                            <th>Initial Point & Timing</th>
                            <th>Boarding Point & Timing</th>
                            <th>End Point & Timing</th>
                            <th style={{ width: 70, textAlign: 'center' }}>Switch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driverTrips.map((t, idx) => {
                            const b = refs.buses?.find(item => String(item.id) === String(t.bus_id));
                            const r = refs.routes?.find(item => String(item.id) === String(t.route_id));
                            const isSel = activeTripTab === idx;
                            return (
                              <tr key={t.id || idx} style={{ background: isSel ? '#eff6ff' : '#ffffff' }}>
                                <td style={{ textAlign: 'center', fontWeight: 700 }} className="mono">{idx + 1}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {(t.shifts && t.shifts.length > 0 ? t.shifts : [t.shift || 'morning1']).map(s => (
                                      <span
                                        key={s}
                                        className="tag tag--ok"
                                        style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 12 }}
                                      >
                                        {SHIFT_MAP[s] || s}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="mono" style={{ fontWeight: 700, color: '#1d4ed8' }}>
                                  {b ? `🚌 ${b.registration_number}` : '— Not selected —'}
                                </td>
                                <td>
                                  {r ? <b>{r.route_code} · {r.route_name}</b> : '— Not selected —'}
                                </td>
                                <td>
                                  {t.initial_point ? (
                                    <span>{t.initial_point} {t.initial_time ? `(${t.initial_time})` : ''}</span>
                                  ) : '—'}
                                </td>
                                <td>
                                  {t.origin ? (
                                    <span>{t.origin} {t.boarding_time ? `(${t.boarding_time})` : ''}</span>
                                  ) : '—'}
                                </td>
                                <td>
                                  {t.destination ? (
                                    <span>{t.destination} {t.end_time ? `(${t.end_time})` : ''}</span>
                                  ) : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={() => setActiveTripTab(idx)}
                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                  >
                                    {isSel ? 'Active' : 'Edit'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 5. Modal Footer */}
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
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    Configured <b>{driverTrips.length}</b> trip(s) for <b>{driverForm.name}</b>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setModalDriver(null)}
                      disabled={modalSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveDriverTripsModal}
                      disabled={modalSaving || !driverForm.name?.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        fontWeight: 700,
                        padding: '8px 24px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: 'none',
                        color: '#ffffff',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      {modalSaving ? 'Saving...' : '💾 Save All Assignments'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
