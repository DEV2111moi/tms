import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../api/api';
import Modal from '../../components/UI/Modal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import {
  exportSingleSalarySlipPdf,
  exportMonthlySalarySummaryPdf,
  formatCurrency,
  formatMonthYear,
  formatDate
} from '../../utils/salaryPdf';

function SalIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    wallet: <><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="18" cy="14" r="2"/></>,
    cash: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></>,
    coins: <><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    badge: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></>,
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    route: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    minus: <><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    creditCard: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>
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
      {icons[name] || icons.wallet}
    </svg>
  );
}

// =========================================================================
// DriverSearchPicker: Search Tab for Drivers (Excludes already entered drivers)
// =========================================================================
function DriverSearchPicker({
  drivers = [],
  selectedDriverId,
  existingDriverIds = new Set(),
  currentEditingId = null,
  month = '',
  onSelect,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showEnteredToggle, setShowEnteredToggle] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDriver = drivers.find(d => String(d.id) === String(selectedDriverId));

  const q = query.toLowerCase().trim();

  // Separate drivers into:
  // 1. Available drivers (NOT entered yet for this month)
  // 2. Already entered drivers (already entered for this month)
  const { availableDrivers, alreadyEnteredDrivers } = useMemo(() => {
    const avail = [];
    const entered = [];

    drivers.forEach(d => {
      const isAlreadyInMonth = existingDriverIds && (existingDriverIds.has(Number(d.id)) || existingDriverIds.has(String(d.id)));
      const isCurrentlyEdited = currentEditingId && String(d.id) === String(selectedDriverId);

      if (isAlreadyInMonth && !isCurrentlyEdited) {
        entered.push(d);
      } else {
        avail.push(d);
      }
    });

    return { availableDrivers: avail, alreadyEnteredDrivers: entered };
  }, [drivers, existingDriverIds, currentEditingId, selectedDriverId]);

  // Filter available drivers by search query
  const filteredAvailable = useMemo(() => {
    if (!q) return availableDrivers;
    return availableDrivers.filter(d => {
      return (
        (d.name || '').toLowerCase().includes(q) ||
        (d.phone || '').toLowerCase().includes(q) ||
        (d.employee_code || '').toLowerCase().includes(q) ||
        (d.license_number || '').toLowerCase().includes(q) ||
        (d.assigned_bus_numbers || '').toLowerCase().includes(q) ||
        (d.institution_name || '').toLowerCase().includes(q)
      );
    });
  }, [availableDrivers, q]);

  // Filter already entered drivers (shown if user searches or toggles)
  const filteredEntered = useMemo(() => {
    if (!q && !showEnteredToggle) return [];
    const source = alreadyEnteredDrivers;
    if (!q && showEnteredToggle) return source;
    return source.filter(d => {
      return (
        (d.name || '').toLowerCase().includes(q) ||
        (d.phone || '').toLowerCase().includes(q) ||
        (d.employee_code || '').toLowerCase().includes(q) ||
        (d.license_number || '').toLowerCase().includes(q) ||
        (d.assigned_bus_numbers || '').toLowerCase().includes(q) ||
        (d.institution_name || '').toLowerCase().includes(q)
      );
    });
  }, [alreadyEnteredDrivers, q, showEnteredToggle]);

  const handleOpen = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 60);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Box */}
      <div
        onClick={handleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: disabled ? '#f8fafc' : '#ffffff',
          border: isOpen ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
          borderRadius: 6,
          padding: '6px 10px',
          minHeight: 38,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
          <SalIcon name="user" size={16} color="#64748b" />
          {selectedDriver ? (
            <div style={{ textAlign: 'left', lineHeight: 1.25, overflow: 'hidden' }}>
              <div style={{
                fontWeight: 800,
                color: (!currentEditingId && existingDriverIds && (existingDriverIds.has(Number(selectedDriver.id)) || existingDriverIds.has(String(selectedDriver.id)))) ? '#dc2626' : '#0f172a',
                fontSize: 13,
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedDriver.name}
                {!currentEditingId && existingDriverIds && (existingDriverIds.has(Number(selectedDriver.id)) || existingDriverIds.has(String(selectedDriver.id))) && (
                  <span style={{ fontSize: 10, color: '#dc2626', marginLeft: 6, fontWeight: 700 }}>
                    (Already Entered)
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 1, alignItems: 'center' }}>
                {selectedDriver.employee_code && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <SalIcon name="badge" size={11} color="#64748b" />
                    <span>{selectedDriver.employee_code}</span>
                  </span>
                )}
                {selectedDriver.assigned_bus_numbers && (
                  <span style={{ color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <SalIcon name="bus" size={11} color="#0284c7" />
                    <span>{selectedDriver.assigned_bus_numbers}</span>
                  </span>
                )}
                {selectedDriver.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <SalIcon name="phone" size={11} color="#64748b" />
                    <span>{selectedDriver.phone}</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>
              {availableDrivers.length === 0 ? '— All drivers already entered for this month —' : `— Click to select driver (${availableDrivers.length} available) —`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {!disabled && (
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <SalIcon name="search" size={11} color="#0369a1" />
              <span>Search</span>
            </span>
          )}
          <span style={{ fontSize: 10, color: '#64748b' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Dropdown Menu with Search Tab */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            minWidth: 320,
            maxWidth: 480,
            background: '#ffffff',
            border: '2px solid #0284c7',
            borderRadius: 8,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
            zIndex: 99999,
            overflow: 'hidden'
          }}
        >
          {/* Search Box Tab */}
          <div style={{ padding: '8px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 6, alignItems: 'center' }}>
            <SalIcon name="search" size={14} color="#64748b" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search unentered driver by name, phone, bus..."
              style={{
                flex: 1,
                border: '1.5px solid #94a3b8',
                borderRadius: 5,
                padding: '6px 10px',
                fontSize: 12,
                outline: 'none'
              }}
              onClick={e => e.stopPropagation()}
            />
            {query && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setQuery(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 800, fontSize: 13 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Results List */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {/* 1. Available (Unentered) Drivers List */}
            {filteredAvailable.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                {q ? (
                  <div>No unentered drivers matching "<strong>{query}</strong>"</div>
                ) : (
                  <div style={{ color: '#16a34a', fontWeight: 700, padding: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <SalIcon name="check" size={14} color="#16a34a" />
                    <span>All active drivers have already been entered for this month!</span>
                  </div>
                )}
              </div>
            ) : (
              filteredAvailable.map(d => {
                const isSelected = String(d.id) === String(selectedDriverId);
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      onSelect(d.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: isSelected ? '#166534' : '#0f172a', fontSize: 12.5 }}>
                        {d.name} {isSelected && '✓'}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {d.employee_code && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <SalIcon name="badge" size={10} color="#64748b" />
                            <span>{d.employee_code}</span>
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <SalIcon name="phone" size={10} color="#64748b" />
                          <span>{d.phone || 'No phone'}</span>
                        </span>
                        {d.assigned_bus_numbers && (
                          <span style={{ color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <SalIcon name="bus" size={10} color="#0284c7" />
                            <span>{d.assigned_bus_numbers}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {d.institution_name && (
                      <span style={{ fontSize: 9.5, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {d.institution_name}
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {/* 2. Already Entered Section (Disabled & Not Selectable) */}
            {filteredEntered.length > 0 && (
              <div style={{ borderTop: '2px dashed #cbd5e1', marginTop: 4 }}>
                <div style={{
                  padding: '6px 10px',
                  background: '#fef2f2',
                  color: '#991b1b',
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <SalIcon name="alert" size={12} color="#991b1b" />
                    <span>Already Entered for this Month ({filteredEntered.length})</span>
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#b91c1c' }}>Not Selectable</span>
                </div>
                {filteredEntered.map(d => (
                  <div
                    key={d.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Driver "${d.name}" is already entered for this month and cannot be selected again. Please edit the existing entry from the list.`);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #fee2e2',
                      background: '#fff1f2',
                      opacity: 0.65,
                      cursor: 'not-allowed',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none'
                    }}
                    title="Already entered for this month. Click to see reason."
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#475569', fontSize: 12 }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <SalIcon name="phone" size={10} color="#94a3b8" />
                          <span>{d.phone || 'No phone'}</span>
                        </span>
                        {d.assigned_bus_numbers && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <SalIcon name="bus" size={10} color="#94a3b8" />
                            <span>{d.assigned_bus_numbers}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 9,
                      background: '#fee2e2',
                      color: '#b91c1c',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 800,
                      border: '1px solid #fca5a5'
                    }}>
                      ALREADY ENTERED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer count with toggle */}
          <div style={{
            padding: '7px 12px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: 10.5,
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              Available: <strong style={{ color: '#16a34a' }}>{availableDrivers.length}</strong>
              {alreadyEnteredDrivers.length > 0 && (
                <span style={{ color: '#94a3b8', marginLeft: 6 }}>
                  ({alreadyEnteredDrivers.length} already entered)
                </span>
              )}
            </span>

            {alreadyEnteredDrivers.length > 0 && !q && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEnteredToggle(prev => !prev);
                }}
                style={{
                  background: showEnteredToggle ? '#fee2e2' : '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  color: showEnteredToggle ? '#b91c1c' : '#475569',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 8px'
                }}
              >
                {showEnteredToggle ? 'Hide' : 'Show'} entered ({alreadyEnteredDrivers.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriverSalary() {
  const { user } = useAuth();
  const toast = useToast();

  const currentYearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [instFilter, setInstFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [monthEnteredDriverIds, setMonthEnteredDriverIds] = useState(new Set());
  const [modalEnteredDriverIds, setModalEnteredDriverIds] = useState(new Set());

  // Modals
  const [editItem, setEditItem] = useState(null); // Salary item being added or edited
  const [showBulkPaidModal, setShowBulkPaidModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // Bulk paid form
  const [bulkPaidForm, setBulkPaidForm] = useState({
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'bank_transfer',
    transaction_ref: ''
  });

  // Load Initial Refs (Drivers & Institutions)
  useEffect(() => {
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'ALL';
    setInstFilter(initialInst);

    Promise.all([
      api.listRes('drivers', { institution_id: 'all' }).catch(() => ({ items: [] })),
      api.listRes('institutions').catch(() => ({ items: [] }))
    ]).then(([dRes, iRes]) => {
      setDrivers(dRes.items || []);
      setInstitutions(iRes.items || []);
    });
  }, [user]);

  // Load Salary Records
  const loadSalaries = () => {
    setLoading(true);
    api.listSalaries({
      month: selectedMonth,
      institution_id: instFilter !== 'ALL' ? instFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }).then(res => {
      setItems(res.items || []);
      setStats(res.stats || {});
      const enteredSet = new Set((res.entered_driver_ids || res.items?.map(i => Number(i.driver_id)) || []));
      setMonthEnteredDriverIds(enteredSet);
      setLoading(false);
      setSelectedIds([]);
    }).catch(err => {
      console.error('Error loading salaries:', err);
      toast(err.message || 'Failed to load driver salaries');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSalaries();
  }, [selectedMonth, instFilter, statusFilter]);

  // Keep modalEnteredDriverIds in sync when editItem month changes
  useEffect(() => {
    if (!editItem) return;
    const targetMonth = editItem.salary_month || selectedMonth;
    if (targetMonth === selectedMonth) {
      setModalEnteredDriverIds(monthEnteredDriverIds);
    } else {
      api.listSalaries({
        month: targetMonth,
        institution_id: instFilter !== 'ALL' ? instFilter : undefined
      }).then(res => {
        const entered = new Set((res.entered_driver_ids || res.items?.map(i => Number(i.driver_id)) || []));
        setModalEnteredDriverIds(entered);
      }).catch(() => {});
    }
  }, [editItem?.salary_month, selectedMonth, monthEnteredDriverIds, instFilter]);

  // Filtered Items by Search Query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item => {
      return (
        (item.driver_name || '').toLowerCase().includes(q) ||
        (item.employee_code || '').toLowerCase().includes(q) ||
        (item.license_number || '').toLowerCase().includes(q) ||
        (item.driver_phone || '').toLowerCase().includes(q) ||
        (item.assigned_bus_numbers || '').toLowerCase().includes(q) ||
        (item.institution_name || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  // Handle Open Create / Edit Modal
  const openEditModal = (item = null) => {
    if (item) {
      setEditItem({
        ...item,
        working_days: item.working_days || 26,
        present_days: item.present_days !== undefined ? item.present_days : 26,
        basic_salary: item.basic_salary || 0,
        daily_bata_rate: item.daily_bata_rate || 200,
        bata_amount: item.bata_amount || 0,
        special_bata: item.special_bata || 0,
        overtime_amount: item.overtime_amount || 0,
        other_allowances: item.other_allowances || 0,
        advance_deduction: item.advance_deduction || 0,
        epf_deduction: item.epf_deduction || 0,
        esi_deduction: item.esi_deduction || 0,
        other_deductions: item.other_deductions || 0,
        payment_status: item.payment_status || 'pending',
        payment_mode: item.payment_mode || 'bank_transfer',
        payment_date: item.payment_date ? item.payment_date.slice(0, 10) : '',
        transaction_ref: item.transaction_ref || '',
        remarks: item.remarks || ''
      });
    } else {
      // Pick first driver who has NOT been entered yet for this month!
      const availableDrivers = drivers.filter(d => !monthEnteredDriverIds.has(Number(d.id)));
      const firstAvailableDriver = availableDrivers[0] || null;

      if (drivers.length > 0 && availableDrivers.length === 0) {
        toast(`All ${drivers.length} drivers already have a salary entry for ${formatMonthYear(selectedMonth)}.`);
      }

      setEditItem({
        driver_id: firstAvailableDriver ? firstAvailableDriver.id : '',
        salary_month: selectedMonth,
        institution_id: firstAvailableDriver?.institution_id || (instFilter !== 'ALL' ? instFilter : ''),
        working_days: 26,
        present_days: 26,
        total_trips: 0,
        basic_salary: 18000,
        daily_bata_rate: 200,
        bata_amount: 5200, // 26 * 200
        special_bata: 0,
        overtime_amount: 0,
        other_allowances: 0,
        advance_deduction: 0,
        epf_deduction: 0,
        esi_deduction: 0,
        other_deductions: 0,
        payment_status: 'pending',
        payment_mode: 'bank_transfer',
        payment_date: '',
        transaction_ref: '',
        remarks: ''
      });
    }
  };

  // Live calculation of Gross & Net in Edit Form
  const formCalculations = useMemo(() => {
    if (!editItem) return { gross: 0, deductions: 0, net: 0, computedBata: 0 };

    const basic = parseFloat(editItem.basic_salary) || 0;
    const days = parseFloat(editItem.present_days) || 0;
    const rate = parseFloat(editItem.daily_bata_rate) || 0;
    const computedBata = Math.round(days * rate * 100) / 100;
    const actualBata = editItem.bata_amount !== undefined && editItem.bata_amount !== ''
      ? (parseFloat(editItem.bata_amount) || 0)
      : computedBata;

    const specialBata = parseFloat(editItem.special_bata) || 0;
    const ot = parseFloat(editItem.overtime_amount) || 0;
    const allowances = parseFloat(editItem.other_allowances) || 0;

    const gross = Math.round((basic + actualBata + specialBata + ot + allowances) * 100) / 100;

    const adv = parseFloat(editItem.advance_deduction) || 0;
    const epf = parseFloat(editItem.epf_deduction) || 0;
    const esi = parseFloat(editItem.esi_deduction) || 0;
    const other = parseFloat(editItem.other_deductions) || 0;

    const deductions = Math.round((adv + epf + esi + other) * 100) / 100;
    const net = Math.max(0, Math.round((gross - deductions) * 100) / 100);

    return { gross, deductions, net, computedBata };
  }, [editItem]);

  // When changing driver in Edit Form, auto-fill institution
  const handleDriverChange = (driverId) => {
    const drv = drivers.find(d => String(d.id) === String(driverId));
    setEditItem(prev => ({
      ...prev,
      driver_id: driverId,
      institution_id: drv?.institution_id || prev.institution_id
    }));
  };

  // When changing Present Days or Daily Bata Rate, auto-update Bata Amount
  const handleBataRecalculate = (newDays, newRate) => {
    const d = parseFloat(newDays) || 0;
    const r = parseFloat(newRate) || 0;
    const computed = Math.round(d * r * 100) / 100;
    setEditItem(prev => ({
      ...prev,
      bata_amount: computed
    }));
  };

  // Save Salary Entry
  const handleSaveSalary = async (e) => {
    e.preventDefault();
    if (!editItem.driver_id) {
      toast('Please select an unentered driver');
      return;
    }
    // Prevent creating duplicate salary entry for the same driver and month
    if (!editItem.id && modalEnteredDriverIds && (modalEnteredDriverIds.has(Number(editItem.driver_id)) || modalEnteredDriverIds.has(String(editItem.driver_id)))) {
      const drv = drivers.find(d => String(d.id) === String(editItem.driver_id));
      toast(`⚠️ Driver "${drv?.name || 'Selected'}" already has a salary record for this month. Duplicate not allowed.`);
      return;
    }
    setSaving(true);
    try {
      await api.saveSalary(editItem, editItem.id);
      toast(editItem.id ? '✓ Salary record updated' : '✓ Salary record created');
      setEditItem(null);
      loadSalaries();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Could not save salary record');
    }
    setSaving(false);
  };

  // Delete Salary Entry
  const handleDeleteSalary = async (id) => {
    if (!confirm('Are you sure you want to delete this salary & bata entry?')) return;
    try {
      await api.delSalary(id);
      toast('Record deleted');
      loadSalaries();
    } catch (err) {
      toast(err.message || 'Could not delete record');
    }
  };

  // Bulk Mark Paid
  const handleBulkMarkPaid = async () => {
    if (!selectedIds.length) {
      toast('Please select at least one record');
      return;
    }
    setSaving(true);
    try {
      await api.bulkMarkPaid({
        ids: selectedIds,
        ...bulkPaidForm
      });
      toast(`Marked ${selectedIds.length} driver(s) as Paid`);
      setShowBulkPaidModal(false);
      setSelectedIds([]);
      loadSalaries();
    } catch (err) {
      toast(err.message || 'Could not update payment status');
    }
    setSaving(false);
  };

  // Select all checkbox handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredItems.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Print single payslip
  const handlePrintSlip = async (salary) => {
    try {
      const fullDetail = await api.getSalary(salary.id);
      exportSingleSalarySlipPdf(fullDetail);
    } catch (err) {
      exportSingleSalarySlipPdf(salary);
    }
  };

  // Print monthly summary PDF
  const handlePrintSummary = () => {
    if (!filteredItems.length) {
      toast('No salary records to print');
      return;
    }
    const currentInstObj = institutions.find(i => String(i.id) === String(instFilter));
    const campusName = currentInstObj ? (currentInstObj.short_name || currentInstObj.name) : 'All Campuses';
    const institutionTitle = currentInstObj ? currentInstObj.name.toUpperCase() : 'NADAR GROUP OF INSTITUTIONS — FLEET MANAGEMENT';

    exportMonthlySalarySummaryPdf({
      month: selectedMonth,
      items: filteredItems,
      stats,
      institutionTitle,
      campusName
    });
  };

  return (
    <div className="driver-salary-page" style={{ paddingBottom: 60 }}>
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER & ACTIONS                                                  */}
      {/* ========================================================================= */}
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SalIcon name="wallet" size={24} color="#7c6cfc" />
            <span>Driver Salary & Daily Bata Management</span>
            <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 11, fontWeight: 700 }}>
              {formatMonthYear(selectedMonth)}
            </span>
          </div>
          <div className="page-sub">
            Manage monthly basic salary, duty bata allowances, overtime, deductions & print official payslips
          </div>
        </div>

        <div className="dashboard-head-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handlePrintSummary}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '7px 14px' }}
          >
            <SalIcon name="download" size={14} color="currentColor" />
            <span>Download Summary (PDF)</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => openEditModal(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '7px 14px' }}
          >
            <SalIcon name="plus" size={14} color="#fff" />
            <span>New Salary Entry</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI METRICS CARDS BANNER (Ribbon Layout)                              */}
      {/* ========================================================================= */}
      <div className="att-kpi-ribbon">
        {/* Total Net Payout */}
        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--green">
            <SalIcon name="cash" size={20} color="#10b981" />
          </div>
          <div className="att-kpi-body">
            <div className="att-kpi-val" style={{ color: '#10b981' }}>
              {formatCurrency(stats.total_net || 0)}
            </div>
            <div className="att-kpi-label">Total Net Payout</div>
            <div className="att-kpi-sub">
              Gross: {formatCurrency(stats.total_gross || 0)}
            </div>
          </div>
        </div>

        {/* Total Bata Disbursed */}
        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--amber">
            <SalIcon name="coins" size={20} color="#f59e0b" />
          </div>
          <div className="att-kpi-body">
            <div className="att-kpi-val" style={{ color: '#f59e0b' }}>
              {formatCurrency(stats.total_bata || 0)}
            </div>
            <div className="att-kpi-label">Total Bata Disbursed</div>
            <div className="att-kpi-sub">Daily duty & special outstation bata</div>
          </div>
        </div>

        {/* Basic Salaries */}
        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--blue">
            <SalIcon name="user" size={20} color="#3b82f6" />
          </div>
          <div className="att-kpi-body">
            <div className="att-kpi-val" style={{ color: '#3b82f6' }}>
              {formatCurrency(stats.total_basic || 0)}
            </div>
            <div className="att-kpi-label">Total Basic Salaries</div>
            <div className="att-kpi-sub">For {stats.total_drivers || items.length} Driver(s)</div>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--red">
            <SalIcon name="minus" size={20} color="#ef4444" />
          </div>
          <div className="att-kpi-body">
            <div className="att-kpi-val" style={{ color: '#ef4444' }}>
              {formatCurrency(stats.total_deductions || 0)}
            </div>
            <div className="att-kpi-label">Total Deductions</div>
            <div className="att-kpi-sub">Advances, EPF, ESI & penalties</div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--purple">
            <SalIcon name="clock" size={20} color="#7c6cfc" />
          </div>
          <div className="att-kpi-body">
            <div className="att-kpi-val" style={{ fontSize: 18, color: '#7c6cfc' }}>
              <span style={{ color: '#10b981' }}>{stats.paid_count || 0} Paid</span>
              <span style={{ color: '#94a3b8', margin: '0 4px' }}>/</span>
              <span style={{ color: '#f59e0b' }}>{stats.pending_count || 0} Pending</span>
            </div>
            <div className="att-kpi-label">Payment Status</div>
            <div className="att-kpi-sub">
              {stats.total_drivers ? `${Math.round(((stats.paid_count || 0) / stats.total_drivers) * 100)}% disbursed` : '0% disbursed'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER TOOLBAR                                                         */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Month Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Month:</label>
            <input
              type="month"
              className="finput"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '5px 10px', fontSize: 12, fontWeight: 700, width: 145, height: 34 }}
            />
          </div>

          {/* Campus Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Campus:</label>
            <select
              className="fselect"
              value={instFilter}
              onChange={(e) => setInstFilter(e.target.value)}
              style={{ padding: '5px 10px', fontSize: 12, width: 220, height: 34 }}
            >
              <option value="ALL">All Campuses / Institutions</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.short_name ? `${inst.short_name} — ${inst.name}` : inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status:</label>
            <select
              className="fselect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '5px 10px', fontSize: 12, width: 140, height: 34 }}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <SalIcon name="search" size={13} color="#94a3b8" />
              </span>
              <input
                type="text"
                className="finput"
                placeholder="Search driver name, bus no, mobile, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '6px 12px 6px 30px', fontSize: 12.5, width: '100%', height: 34 }}
              />
            </div>
          </div>

          {/* Bulk Mark Paid Button */}
          {selectedIds.length > 0 && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowBulkPaidModal(true)}
              style={{ background: '#16a34a', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34 }}
            >
              <SalIcon name="creditCard" size={13} color="#fff" />
              <span>Mark {selectedIds.length} as Paid</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DRIVER SALARY & BATA DATA TABLE                                       */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading salary records for {formatMonthYear(selectedMonth)}...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#ede9fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
            }}>
              <SalIcon name="wallet" size={32} color="#7c6cfc" />
            </div>
            <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontFamily: 'Oswald', fontSize: 20 }}>
              No Salary Records Found
            </h3>
            <p style={{ margin: '0 0 18px 0', color: '#64748b', fontSize: 13, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              No salary entries have been created for {formatMonthYear(selectedMonth)}. Click below to create the first entry for this month.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => openEditModal(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', fontWeight: 700 }}
              >
                <SalIcon name="plus" size={14} color="#fff" />
                <span>Enter Driver Salary</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="table-wrap" style={{ margin: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ width: 45, textAlign: 'center' }}>S.NO</th>
                  <th>Driver Details</th>
                  <th>Assigned Bus & Route</th>
                  <th>Campus / Inst</th>
                  <th style={{ textAlign: 'center' }}>Days</th>
                  <th style={{ textAlign: 'right' }}>Basic Pay (₹)</th>
                  <th style={{ textAlign: 'right', background: '#fffbeb', color: '#b45309' }}>Bata Allowance (₹)</th>
                  <th style={{ textAlign: 'right' }}>Gross Pay (₹)</th>
                  <th style={{ textAlign: 'right', color: '#dc2626' }}>Deductions (₹)</th>
                  <th style={{ textAlign: 'right', background: '#f0fdf4', color: '#15803d' }}>Net Payable (₹)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ width: 140, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const basic = parseFloat(item.basic_salary) || 0;
                  const dailyBata = parseFloat(item.bata_amount) || 0;
                  const spBata = parseFloat(item.special_bata) || 0;
                  const totalBata = dailyBata + spBata;
                  const gross = parseFloat(item.gross_salary) || 0;
                  const ded = (parseFloat(item.advance_deduction) || 0) + (parseFloat(item.epf_deduction) || 0) + (parseFloat(item.esi_deduction) || 0) + (parseFloat(item.other_deductions) || 0);
                  const net = parseFloat(item.net_salary) || 0;
                  const isPaid = item.payment_status === 'paid';

                  return (
                    <tr key={item.id} style={{ background: selectedIds.includes(item.id) ? '#f0fdf4' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                        />
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                          {item.driver_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 10, marginTop: 2, alignItems: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <SalIcon name="badge" size={11} color="#64748b" />
                            <span>{item.employee_code || `DRV-${item.driver_id}`}</span>
                          </span>
                          {item.driver_phone && item.driver_phone !== '—' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <SalIcon name="phone" size={11} color="#64748b" />
                              <span>{item.driver_phone}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <SalIcon name="bus" size={12} color="#0284c7" />
                          <span>{item.assigned_bus_numbers || '—'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <SalIcon name="route" size={11} color="#64748b" />
                          <span>{item.assigned_route_codes ? `${item.assigned_route_codes}` : 'General / Spare'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 11.5, color: '#334155' }}>
                        <span className="tag" style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 700 }}>
                          {item.institution_name || 'Central'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>
                          {item.present_days} / {item.working_days}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>duty days</div>
                      </td>
                      <td style={{ textAlign: 'right' }} className="mono">
                        {basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', background: '#fffbeb' }} className="mono">
                        <div style={{ fontWeight: 800, color: '#b45309', fontSize: 12 }}>
                          ₹ {totalBata.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 9.5, color: '#b45309' }}>
                          (@ ₹{parseFloat(item.daily_bata_rate || 0)}/day{spBata > 0 ? ` + ₹${spBata} sp` : ''})
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="mono">
                        {gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }} className="mono">
                        - {ded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', background: '#f0fdf4' }} className="mono">
                        <div style={{ fontWeight: 900, color: '#15803d', fontSize: 13.5 }}>
                          ₹ {net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background: isPaid ? '#dcfce7' : '#fef9c3',
                            color: isPaid ? '#166534' : '#854d0e',
                            border: `1px solid ${isPaid ? '#86efac' : '#fde047'}`
                          }}
                        >
                          <SalIcon name={isPaid ? 'check' : 'clock'} size={10} color={isPaid ? '#166534' : '#854d0e'} />
                          <span>{isPaid ? 'PAID' : 'PENDING'}</span>
                        </span>
                        {isPaid && item.payment_mode && (
                          <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>
                            {item.payment_mode.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => handlePrintSlip(item)}
                            title="Download / Print Payslip PDF"
                            style={{ color: '#0284c7', borderColor: '#bae6fd', padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            <SalIcon name="print" size={11} color="#0284c7" />
                            <span>Slip</span>
                          </button>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => openEditModal(item)}
                            title="Edit Details"
                            style={{ padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            <SalIcon name="edit" size={11} color="currentColor" />
                            <span>Edit</span>
                          </button>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => handleDeleteSalary(item.id)}
                            title="Delete Entry"
                            style={{ color: '#dc2626', borderColor: '#fecaca', padding: '3px 7px' }}
                          >
                            <SalIcon name="trash" size={11} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT SALARY & BATA MODAL                                         */}
      {/* ========================================================================= */}
      {editItem && (
        <Modal
          title={editItem.id ? `Edit Salary & Bata: ${editItem.driver_name || 'Driver'}` : 'New Driver Salary & Bata Entry'}
          onClose={() => setEditItem(null)}
          wide
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                Net Payable: <strong style={{ fontSize: 16 }}>{formatCurrency(formCalculations.net)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditItem(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="salaryForm"
                  className="btn btn-sm btn-primary"
                  disabled={saving || !editItem.driver_id || (!editItem.id && modalEnteredDriverIds && (modalEnteredDriverIds.has(Number(editItem.driver_id)) || modalEnteredDriverIds.has(String(editItem.driver_id))))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <SalIcon name="save" size={13} color="#fff" />
                  <span>{saving ? 'Saving...' : 'Save Salary Entry'}</span>
                </button>
              </div>
            </div>
          }
        >
          <form id="salaryForm" onSubmit={handleSaveSalary} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Row 1: Driver, Month, Campus */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <label className="flabel" style={{ position: 'relative' }}>
                <span>Select Driver *</span>
                <DriverSearchPicker
                  drivers={drivers}
                  selectedDriverId={editItem.driver_id}
                  existingDriverIds={modalEnteredDriverIds}
                  currentEditingId={editItem.id}
                  month={formatMonthYear(editItem.salary_month)}
                  onSelect={handleDriverChange}
                  disabled={!!editItem.id}
                />
                {!editItem.id && editItem.driver_id && modalEnteredDriverIds && (modalEnteredDriverIds.has(Number(editItem.driver_id)) || modalEnteredDriverIds.has(String(editItem.driver_id))) && (
                  <div style={{ color: '#dc2626', fontSize: 11, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <SalIcon name="alert" size={12} color="#dc2626" />
                    <span>This driver already has a salary entry for {formatMonthYear(editItem.salary_month)}. Duplicate not allowed.</span>
                  </div>
                )}
              </label>

              <label className="flabel">
                <span>Salary Month (YYYY-MM) *</span>
                <input
                  type="month"
                  className="finput"
                  value={editItem.salary_month}
                  onChange={(e) => setEditItem({ ...editItem, salary_month: e.target.value })}
                  required
                />
              </label>

              <label className="flabel">
                <span>Campus / Institution</span>
                <select
                  className="fselect"
                  value={editItem.institution_id || ''}
                  onChange={(e) => setEditItem({ ...editItem, institution_id: e.target.value })}
                >
                  <option value="">Consolidated / Main Campus</option>
                  {institutions.map(i => (
                    <option key={i.id} value={i.id}>{i.short_name || i.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Row 2: Attendance & Duty Days */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1e3a8a', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SalIcon name="calendar" size={13} color="#1e3a8a" />
                <span>Duty & Attendance Details</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <label className="flabel">
                  <span>Total Working Days</span>
                  <input
                    type="number"
                    className="finput"
                    value={editItem.working_days}
                    onChange={(e) => setEditItem({ ...editItem, working_days: e.target.value })}
                    min="1"
                    max="31"
                  />
                </label>

                <label className="flabel">
                  <span>Present / Worked Days *</span>
                  <input
                    type="number"
                    step="0.5"
                    className="finput"
                    value={editItem.present_days}
                    onChange={(e) => {
                      const newDays = e.target.value;
                      setEditItem({ ...editItem, present_days: newDays });
                      handleBataRecalculate(newDays, editItem.daily_bata_rate);
                    }}
                    min="0"
                    max="31"
                    required
                  />
                </label>

                <label className="flabel">
                  <span>Total Trips Logged</span>
                  <input
                    type="number"
                    className="finput"
                    value={editItem.total_trips}
                    onChange={(e) => setEditItem({ ...editItem, total_trips: e.target.value })}
                    min="0"
                  />
                </label>
              </div>
            </div>

            {/* Row 3: Earnings & Bata Section */}
            <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SalIcon name="coins" size={13} color="#b45309" />
                <span>Earnings & Driver Bata Breakdown</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <label className="flabel">
                  <span>Basic Salary (₹) *</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.basic_salary}
                    onChange={(e) => setEditItem({ ...editItem, basic_salary: e.target.value })}
                    required
                  />
                </label>

                <label className="flabel">
                  <span>Daily Bata Rate (₹/day)</span>
                  <input
                    type="number"
                    step="1"
                    className="finput"
                    value={editItem.daily_bata_rate}
                    onChange={(e) => {
                      const newRate = e.target.value;
                      setEditItem({ ...editItem, daily_bata_rate: newRate });
                      handleBataRecalculate(editItem.present_days, newRate);
                    }}
                  />
                </label>

                <label className="flabel">
                  <span>Total Duty Bata (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.bata_amount}
                    onChange={(e) => setEditItem({ ...editItem, bata_amount: e.target.value })}
                    style={{ fontWeight: 700, color: '#b45309' }}
                  />
                  <span style={{ fontSize: 9.5, color: '#92400e' }}>
                    Auto: {editItem.present_days || 0} days × ₹{editItem.daily_bata_rate || 0}
                  </span>
                </label>

                <label className="flabel">
                  <span>Special / Tour Bata (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.special_bata}
                    onChange={(e) => setEditItem({ ...editItem, special_bata: e.target.value })}
                    placeholder="Weekend / Outstation"
                  />
                </label>

                <label className="flabel">
                  <span>Overtime (OT) Amount (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.overtime_amount}
                    onChange={(e) => setEditItem({ ...editItem, overtime_amount: e.target.value })}
                  />
                </label>

                <label className="flabel">
                  <span>Other Allowances / Bonus (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.other_allowances}
                    onChange={(e) => setEditItem({ ...editItem, other_allowances: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Row 4: Deductions Section */}
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SalIcon name="minus" size={13} color="#b91c1c" />
                <span>Deductions & Recoveries</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <label className="flabel">
                  <span>Advance Deducted (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.advance_deduction}
                    onChange={(e) => setEditItem({ ...editItem, advance_deduction: e.target.value })}
                  />
                </label>

                <label className="flabel">
                  <span>EPF Deduction (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.epf_deduction}
                    onChange={(e) => setEditItem({ ...editItem, epf_deduction: e.target.value })}
                  />
                </label>

                <label className="flabel">
                  <span>ESI Deduction (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.esi_deduction}
                    onChange={(e) => setEditItem({ ...editItem, esi_deduction: e.target.value })}
                  />
                </label>

                <label className="flabel">
                  <span>Other Fines / Cuts (₹)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="finput"
                    value={editItem.other_deductions}
                    onChange={(e) => setEditItem({ ...editItem, other_deductions: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Row 5: Live Summary Box */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: 8,
              padding: '10px 14px'
            }}>
              <div>
                <span style={{ fontSize: 10, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Total Gross</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{formatCurrency(formCalculations.gross)}</div>
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>Total Deductions</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>- {formatCurrency(formCalculations.deductions)}</div>
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#15803d', fontWeight: 800, textTransform: 'uppercase' }}>Net Salary & Bata</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#15803d' }}>{formatCurrency(formCalculations.net)}</div>
              </div>
            </div>

            {/* Row 6: Payment Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <label className="flabel">
                <span>Payment Status</span>
                <select
                  className="fselect"
                  value={editItem.payment_status}
                  onChange={(e) => setEditItem({ ...editItem, payment_status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                </select>
              </label>

              <label className="flabel">
                <span>Payment Mode</span>
                <select
                  className="fselect"
                  value={editItem.payment_mode}
                  onChange={(e) => setEditItem({ ...editItem, payment_mode: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>

              <label className="flabel">
                <span>Payment Date</span>
                <input
                  type="date"
                  className="finput"
                  value={editItem.payment_date}
                  onChange={(e) => setEditItem({ ...editItem, payment_date: e.target.value })}
                />
              </label>

              <label className="flabel">
                <span>UTR / Ref / Cheque No</span>
                <input
                  type="text"
                  className="finput"
                  placeholder="e.g. UTR12345678"
                  value={editItem.transaction_ref}
                  onChange={(e) => setEditItem({ ...editItem, transaction_ref: e.target.value })}
                />
              </label>
            </div>

            <label className="flabel">
              <span>Remarks / Memo</span>
              <input
                type="text"
                className="finput"
                placeholder="Optional notes or reasons for deductions/allowances..."
                value={editItem.remarks}
                onChange={(e) => setEditItem({ ...editItem, remarks: e.target.value })}
              />
            </label>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. BULK MARK PAID MODAL                                                   */}
      {/* ========================================================================= */}
      {showBulkPaidModal && (
        <Modal
          title={`Mark ${selectedIds.length} Driver(s) as Paid`}
          onClose={() => setShowBulkPaidModal(false)}
          footer={
            <>
              <button className="btn btn-sm btn-outline" onClick={() => setShowBulkPaidModal(false)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleBulkMarkPaid} disabled={saving} style={{ background: '#16a34a', border: 'none' }}>
                {saving ? 'Updating...' : `Confirm Payment for ${selectedIds.length} Driver(s)`}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
              Set the disbursement date and payment mode for the <strong>{selectedIds.length}</strong> selected drivers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="flabel">
                <span>Payment Date *</span>
                <input
                  type="date"
                  className="finput"
                  value={bulkPaidForm.payment_date}
                  onChange={(e) => setBulkPaidForm({ ...bulkPaidForm, payment_date: e.target.value })}
                  required
                />
              </label>

              <label className="flabel">
                <span>Payment Mode</span>
                <select
                  className="fselect"
                  value={bulkPaidForm.payment_mode}
                  onChange={(e) => setBulkPaidForm({ ...bulkPaidForm, payment_mode: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>
            </div>

            <label className="flabel">
              <span>Transaction Ref / Batch ID / Memo</span>
              <input
                type="text"
                className="finput"
                placeholder="Optional payment reference or bank transfer batch ID..."
                value={bulkPaidForm.transaction_ref}
                onChange={(e) => setBulkPaidForm({ ...bulkPaidForm, transaction_ref: e.target.value })}
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
