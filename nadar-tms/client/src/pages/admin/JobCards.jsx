import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';


function MaintIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
    box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    card: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></>
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
      {icons[name] || icons.wrench}
    </svg>
  );
}

/**
 * Modern Searchable Select for Spare Parts
 */
function SparePartSearchSelect({ value, onChange, inventoryList }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedItem = inventoryList.find(p => String(p.id) === String(value));

  const filteredItems = useMemo(() => {
    return inventoryList.filter(item => {
      const matchCat = selectedCat === 'All' || item.category === selectedCat;
      if (!matchCat) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (item.part_name || '').toLowerCase().includes(term) ||
        (item.part_number || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term)
      );
    });
  }, [inventoryList, searchTerm, selectedCat]);

  const availableCats = useMemo(() => {
    const cats = new Set(inventoryList.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [inventoryList]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          minHeight: 36,
          padding: '4px 10px',
          border: isOpen ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
          borderRadius: 8,
          background: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          boxShadow: isOpen ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        {selectedItem ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedItem.part_name}
            </span>
            {selectedItem.part_number && (
              <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 600 }}>
                {selectedItem.part_number}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, marginLeft: 'auto', flexShrink: 0 }}>
              ₹{Number(selectedItem.unit_cost || 0).toFixed(2)}/{selectedItem.unit || 'pcs'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
            <MaintIcon name="search" size={13} color="#94a3b8" />
            <span>Search & choose spare part...</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {selectedItem && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              style={{
                color: '#94a3b8',
                fontSize: 13,
                padding: '0 3px',
                borderRadius: 4,
                cursor: 'pointer',
                lineHeight: 1
              }}
              title="Clear selection"
            >
              ✕
            </span>
          )}
          <span style={{ color: '#64748b', fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
            ▼
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: 380,
            maxWidth: '90vw',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: 10,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
            zIndex: 99999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MaintIcon name="search" size={14} color="#64748b" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search part name, code, category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: 12.5,
                color: '#0f172a',
                fontWeight: 600
              }}
            />
            {searchTerm && (
              <span
                onClick={() => setSearchTerm('')}
                style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 12, padding: '0 4px' }}
              >
                ✕
              </span>
            )}
          </div>

          {availableCats.length > 2 && (
            <div style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 4, overflowX: 'auto', background: '#ffffff' }}>
              {availableCats.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    border: 'none',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 10.5,
                    fontWeight: selectedCat === cat ? 700 : 500,
                    background: selectedCat === cat ? '#eff6ff' : '#f1f5f9',
                    color: selectedCat === cat ? '#1d4ed8' : '#64748b',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                <div>No spare parts found matching "{searchTerm}"</div>
              </div>
            ) : (
              filteredItems.map(inv => {
                const isSelected = String(inv.id) === String(value);
                const stockNum = Number(inv.quantity) || 0;
                const isOut = stockNum <= 0;

                return (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onChange(String(inv.id));
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      background: isSelected ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isSelected ? '#eff6ff' : '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent'}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                          {inv.part_name}
                        </span>
                        {inv.part_number && (
                          <span style={{ fontSize: 10.5, background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>
                            {inv.part_number}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Rate: <b style={{ color: '#0f172a' }}>₹{Number(inv.unit_cost || 0).toFixed(2)}</b>/{inv.unit || 'pcs'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: isOut ? '#fee2e2' : '#dcfce7',
                        color: isOut ? '#dc2626' : '#15803d'
                      }}>
                        {isOut ? 'Out of stock' : `${stockNum} ${inv.unit || 'pcs'}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobCards() {
  const [buses, setBuses] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateFilterMode, setDateFilterMode] = useState('today'); // 'today', 'month', 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedBusForHistory, setSelectedBusForHistory] = useState(null); // Bus row click history popup
  const [viewingJobCard, setViewingJobCard] = useState(null); // TMHNU Pink Job Card modal
  const [editingBill, setEditingBill] = useState(null); // Edit/Create maintenance bill modal

  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const loadData = () => {
    Promise.all([
      api.listRes('buses'),
      api.listRes('maintenance_logs'),
      api.listRes('drivers'),
      api.listRes('institutions'),
      api.listRes('assignments'),
      api.listRes('inventory_items')
    ]).then(([busesRes, maintRes, driversRes, instRes, assignRes, invRes]) => {
      setBuses(busesRes.items || []);
      setMaintenanceList(maintRes.items || []);
      setDrivers(driversRes.items || []);
      setInstitutions(instRes.items || []);
      setAssignments(assignRes.items || []);
      setInventoryList(invRes.items || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load job cards data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper mappings
  const instMap = useMemo(() => {
    const map = {};
    institutions.forEach(inst => {
      map[String(inst.id)] = inst.name;
    });
    return map;
  }, [institutions]);

  const driverByBusMap = useMemo(() => {
    const map = {};
    assignments.forEach(a => {
      if (a.bus_id && a.driver_id) {
        const d = drivers.find(drv => String(drv.id) === String(a.driver_id));
        if (d) map[String(a.bus_id)] = d;
      }
    });
    // Fallback: driver with bus_id
    drivers.forEach(d => {
      if (d.bus_id && !map[String(d.bus_id)]) {
        map[String(d.bus_id)] = d;
      }
    });
    return map;
  }, [assignments, drivers]);

  // Aggregate bus maintenance records
  const busRecords = useMemo(() => {
    return buses.map(bus => {
      const busMaint = maintenanceList.filter(m => String(m.bus_id) === String(bus.id));
      busMaint.sort((a, b) => new Date(b.service_date || 0) - new Date(a.service_date || 0));

      const assignedDriver = driverByBusMap[String(bus.id)];
      // If no assigned driver, check latest maintenance log driver_name
      const driverName = assignedDriver?.name || busMaint[0]?.driver_name || '—';
      const driverPhone = assignedDriver?.phone || '';
      const institutionName = instMap[String(bus.institution_id)] || 'General Fleet';

      const totalSpend = busMaint.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const latestService = busMaint[0] || null;

      return {
        ...bus,
        bus_id: bus.id,
        driverName,
        driverPhone,
        institutionName,
        jobCards: busMaint,
        jobCardsCount: busMaint.length,
        totalSpend,
        latestService
      };
    });
  }, [buses, maintenanceList, driverByBusMap, instMap]);

  // Daily / Date-Filtered Metrics & Records
  const dateFilteredMaintenance = useMemo(() => {
    if (dateFilterMode === 'all') return maintenanceList;
    if (dateFilterMode === 'month') {
      const monthPrefix = reportDate.slice(0, 7); // YYYY-MM
      return maintenanceList.filter(m => (m.service_date || '').startsWith(monthPrefix));
    }
    // Default 'today' / selected exact date
    return maintenanceList.filter(m => (m.service_date || '').slice(0, 10) === reportDate);
  }, [maintenanceList, reportDate, dateFilterMode]);

  const uniqueBusesInDateMaint = useMemo(() => {
    const ids = new Set(dateFilteredMaintenance.map(m => m.bus_id).filter(Boolean));
    return ids.size;
  }, [dateFilteredMaintenance]);

  const totalDateSpend = useMemo(() => {
    return dateFilteredMaintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  }, [dateFilteredMaintenance]);

  const totalAllTimeSpend = useMemo(() => {
    return maintenanceList.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  }, [maintenanceList]);

  // Filtered Bus Table List
  const filteredBuses = useMemo(() => {
    let list = busRecords;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(b =>
        (b.registration_number || '').toLowerCase().includes(q) ||
        (b.bus_model || '').toLowerCase().includes(q) ||
        (b.driverName || '').toLowerCase().includes(q) ||
        (b.institutionName || '').toLowerCase().includes(q) ||
        b.jobCards.some(jc => (jc.job_card_no || '').toLowerCase().includes(q) || (jc.service_type || '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [busRecords, searchQuery]);

  // Print Daily Summary Report
  const printDailyReport = () => {
    const printWin = window.open('', '_blank', 'width=950,height=800');
    if (!printWin) {
      alert('Please allow popups to print report.');
      return;
    }

    const rows = dateFilteredMaintenance.map((m, idx) => {
      const b = buses.find(x => String(x.id) === String(m.bus_id));
      const busReg = b?.registration_number || `Bus #${m.bus_id}`;
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${busReg}</b></td>
          <td style="font-family: monospace; font-weight: bold; color: #be185d; text-align: center;">#${m.job_card_no || '—'}</td>
          <td>${m.driver_name || '—'}</td>
          <td>${m.mechanic_name || '—'}</td>
          <td>${m.service_type || 'Maintenance Service'}</td>
          <td style="text-align: right;">₹${Number(m.parts_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">₹${Number(m.labor_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold; color: #1e3a8a;">₹${Number(m.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TMHNU Daily Maintenance & Job Cards Report - ${reportDate}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 17px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
          .sub { font-size: 12px; color: #475569; margin-top: 3px; }
          .kpi-bar { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 18px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11.5px; }
          th { background: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 10.5px; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 60px; }
          .sig-box { width: 200px; text-align: center; border-top: 1.5px solid #000; padding-top: 4px; font-weight: bold; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">THENI MELAPETTAI HINDU NADARGAL URAVINMURAI (TMHNU)</div>
          <div class="sub">Central Fleet Maintenance & Daily Job Cards Report · Date: <b>${reportDate}</b></div>
        </div>

        <div class="kpi-bar">
          <div>Total Job Cards Today: <b>${dateFilteredMaintenance.length}</b></div>
          <div>Buses in Maintenance: <b>${uniqueBusesInDateMaint}</b></div>
          <div>Total Daily Maintenance Spend: <b>₹${totalDateSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Bus Number</th>
              <th>Job Card #</th>
              <th>Driver Name</th>
              <th>Mechanic</th>
              <th>Work Details / Service</th>
              <th style="text-align: right;">Parts (₹)</th>
              <th style="text-align: right;">Labor (₹)</th>
              <th style="text-align: right;">Total Bill (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No maintenance job cards recorded for this date.</td></tr>'}
          </tbody>
        </table>

        <div class="sig-row">
          <div class="sig-box">Fleet Workshop Incharge</div>
          <div class="sig-box">Transport Manager</div>
          <div class="sig-box">Secretary Sign</div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  // Print Official Pink Job Card (Dual Mode)
  const printTMHNUJobCard = (maint, isPinkPaper = true) => {
    const bus = buses.find(b => String(b.id) === String(maint.bus_id));
    let parts = [];
    if (maint.parts_data) {
      try {
        parts = typeof maint.parts_data === 'string' ? JSON.parse(maint.parts_data) : maint.parts_data;
      } catch (e) {
        parts = [];
      }
    }

    const regNo = bus?.registration_number || `Bus #${maint.bus_id}`;
    const shortVehicleNo = (regNo && regNo.replace(/[^0-9]/g, '').slice(-4)) || regNo || '4685';

    let formattedDate = maint.service_date || '';
    if (formattedDate.includes('-')) {
      const partsDate = formattedDate.split('-');
      if (partsDate.length === 3) {
        formattedDate = `${parseInt(partsDate[2], 10)}.${parseInt(partsDate[1], 10)}.${partsDate[0].slice(-2)}`;
      }
    }

    const jobCardNum = maint.job_card_no || maint.bill_no?.split('-').pop() || '1277';
    const driverName = maint.driver_name || '—';
    const mechanicName = maint.mechanic_name || '—';
    const odometerVal = maint.odometer ? String(maint.odometer) : '—';
    const lampVal = maint.lamp || '2';
    const mileageVal = maint.mileage || '4.6';
    const sNoVal = maint.serial_no || '6';

    const printWin = window.open('', '_blank', 'width=750,height=950');
    if (!printWin) {
      alert('Please allow popups to print the TMHNU Job Card.');
      return;
    }

    const lineEntries = [];
    if (maint.service_type) lineEntries.push(maint.service_type);
    lineEntries.push('');
    if (Array.isArray(parts)) {
      parts.forEach(p => {
        if (p.part_name) lineEntries.push(`${p.part_name} - ${p.quantity} ${p.unit || ''}`);
      });
    }
    while (lineEntries.length < 13) {
      lineEntries.push('');
    }

    const linesHtml = lineEntries.slice(0, 13).map(text => `
      <div style="height: 30px; border-bottom: 1.2px solid #4a6b82; display: flex; align-items: flex-end; padding-bottom: 3px; padding-left: 12px;">
        <span style="font-size: 14px; font-weight: bold; color: #000;">${text}</span>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TMHNU Job Card #${jobCardNum}</title>
        <style>
          @page { size: A5 portrait; margin: 8mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; padding: 10px; font-family: 'Times New Roman', Times, Georgia, serif; color: #000; background: ${isPinkPaper ? '#ffccd5' : '#ffffff'}; display: flex; justify-content: center; }
          .card-outer-border { width: 100%; max-width: 520px; border: 2px solid #000; padding: 8px 10px; background: ${isPinkPaper ? '#ffccd5' : '#ffffff'}; }
          .header-box { border: 1.5px solid #000; padding: 6px 4px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
          .header-center { text-align: center; flex: 1; padding: 0 4px; }
          .inst-title { font-size: 14.5px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.25; }
          .inst-sub { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.25; margin-top: 1px; }
          .inst-loc { font-size: 13.5px; font-weight: bold; letter-spacing: 1px; margin-top: 1px; }
          .meta-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: bold; margin-bottom: 6px; line-height: 1.35; }
          .card-num { font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 900; letter-spacing: 2px; }
          .veh-num { font-size: 17px; font-weight: 900; letter-spacing: 1px; }
          .work-details-header { text-align: center; font-size: 14px; font-weight: bold; border-top: 1.5px solid #000; border-bottom: 1px solid #4a6b82; padding: 3px 0 2px 0; margin-top: 4px; }
          .sig-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; padding: 0 4px 6px 4px; }
          .sig-col { text-align: center; flex: 1; }
          .sig-label { font-size: 12.5px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="card-outer-border">
          <div class="header-box">
            <svg width="64" height="64" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#000" stroke-width="2.5" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2,2" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-width="1.5" />
              <path id="leftArcTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
              <path id="leftArcBot" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
              <text font-family="'Times New Roman', serif" font-size="7.5" font-weight="bold" fill="#000">
                <textPath href="#leftArcTop" startOffset="50%" text-anchor="middle">T.M.H.N.U.</textPath>
              </text>
              <text font-family="'Times New Roman', serif" font-size="6.2" font-weight="bold" fill="#000">
                <textPath href="#leftArcBot" startOffset="50%" text-anchor="middle">VEHICLE MAINTENANCE</textPath>
              </text>
              <g transform="translate(37, 36) scale(1.1)">
                <rect x="2" y="2" width="20" height="15" rx="3" fill="none" stroke="#000" stroke-width="1.8" />
                <line x1="2" y1="8" x2="22" y2="8" stroke="#000" stroke-width="1.2" />
                <circle cx="7" cy="18" r="2" fill="#000" />
                <circle cx="17" cy="18" r="2" fill="#000" />
                <rect x="5" y="4" width="4" height="3" fill="#000" />
                <rect x="15" y="4" width="4" height="3" fill="#000" />
              </g>
            </svg>

            <div class="header-center">
              <div class="inst-title">T.M.H.N.U.EDUCATION INSTITUTIONS</div>
              <div class="inst-sub">VEHICLE MAINTENANCE,</div>
              <div class="inst-loc">THENI.</div>
            </div>

            <svg width="64" height="64" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#000" stroke-width="2.5" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2,2" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-width="1.5" />
              <path id="rightArcTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
              <path id="rightArcBot" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
              <text font-family="'Times New Roman', serif" font-size="7.5" font-weight="bold" fill="#000">
                <textPath href="#rightArcTop" startOffset="50%" text-anchor="middle">T.M.H.N.U.</textPath>
              </text>
              <text font-family="'Times New Roman', serif" font-size="7.5" font-weight="bold" fill="#000">
                <textPath href="#rightArcBot" startOffset="50%" text-anchor="middle">THENI</textPath>
              </text>
              <g transform="translate(37, 36) scale(1.1)">
                <circle cx="12" cy="8" r="6" fill="none" stroke="#000" stroke-width="1.8" />
                <path d="M 4,22 C 4,16 8,15 12,15 C 16,15 20,16 20,22" fill="none" stroke="#000" stroke-width="1.8" />
                <circle cx="12" cy="7" r="1.5" fill="#000" />
              </g>
            </svg>
          </div>

          <div class="meta-row">
            <div>Job card No <span class="card-num">${jobCardNum}</span></div>
            <div>Date : <span style="font-weight: 700;">${formattedDate}</span></div>
          </div>

          <div class="meta-row">
            <div>Driver Name : <span>${driverName}</span></div>
            <div>Vehicle No : <span class="veh-num">${shortVehicleNo}</span></div>
          </div>

          <div class="meta-row">
            <div>Mechanic Name : <span>${mechanicName}</span></div>
            <div>km : <span>${odometerVal}</span></div>
          </div>

          <div class="meta-row" style="font-size: 13.5px; margin-bottom: 2px;">
            <div>Lamp : ( ${lampVal} ) ,</div>
            <div>Mileage : ${mileageVal} ,</div>
            <div>S.No : ( ${sNoVal} )</div>
          </div>

          <div class="work-details-header">Work Details</div>
          <div>${linesHtml}</div>

          <div class="sig-row">
            <div class="sig-col">
              <div style="height: 22px; font-family: 'Brush Script MT', cursive; font-size: 15px; color: #1e3a8a;">${driverName !== '—' ? driverName.slice(0, 8) : ''}</div>
              <div class="sig-label">Driver Sign</div>
            </div>
            <div class="sig-col">
              <div style="height: 22px; font-family: 'Brush Script MT', cursive; font-size: 15px; color: #1e3a8a;">${mechanicName !== '—' ? mechanicName.slice(0, 8) : ''}</div>
              <div class="sig-label">Mechanic Sign</div>
            </div>
            <div class="sig-col">
              <div style="height: 22px;"></div>
              <div class="sig-label">Manager Sign</div>
            </div>
            <div class="sig-col">
              <div style="height: 22px;"></div>
              <div class="sig-label">Secretary Sign</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  // Print Maintenance Bill Invoice
  const printMaintenanceInvoice = (maint) => {
    const bus = buses.find(b => String(b.id) === String(maint.bus_id));
    let parts = [];
    if (maint.parts_data) {
      try {
        parts = typeof maint.parts_data === 'string' ? JSON.parse(maint.parts_data) : maint.parts_data;
      } catch (e) {
        parts = [];
      }
    }

    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) {
      alert('Please allow popups to view and print the maintenance invoice.');
      return;
    }

    const partsRows = (parts || []).map((p, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><b>${p.part_name || 'Spare Part'}</b> ${p.part_number ? `(${p.part_number})` : ''}</td>
        <td style="text-align: center;">${p.unit || 'pcs'}</td>
        <td style="text-align: center; font-weight: bold;">${p.quantity}</td>
        <td style="text-align: right;">₹${Number(p.unit_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: bold;">₹${Number(p.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Maintenance Bill - ${maint.bill_no || 'Invoice'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 30px; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; }
          .title { font-size: 18px; font-weight: 800; color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 10px; }
          th { background: #f1f5f9; font-weight: 700; text-align: left; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 50px; }
          .sig-box { text-align: center; width: 180px; border-top: 1.5px solid #0f172a; padding-top: 6px; font-weight: 600; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">THENI MELAPETTAI HINDU NADARGAL URAVINMURAI (TMHNU)</div>
          <div>Central Transport Fleet & Garage Operations</div>
          <div style="font-weight: bold; margin-top: 6px; color: #1d4ed8;">VEHICLE MAINTENANCE BILL · JOB CARD #${maint.job_card_no || '—'}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <div>
            <div><b>Bill No:</b> ${maint.bill_no || '—'}</div>
            <div><b>Service Date:</b> ${maint.service_date || '—'}</div>
            <div><b>Workshop:</b> ${maint.workshop_name || 'TMHNU Fleet Workshop'}</div>
            <div><b>Mechanic:</b> ${maint.mechanic_name || '—'}</div>
          </div>
          <div>
            <div><b>Bus Number:</b> <span style="font-family: monospace; font-weight: bold; color: #1d4ed8;">${bus?.registration_number || `Bus #${maint.bus_id}`}</span></div>
            <div><b>Driver:</b> ${maint.driver_name || '—'}</div>
            <div><b>Odometer:</b> ${maint.odometer ? `${Number(maint.odometer).toLocaleString('en-IN')} km` : '—'}</div>
            <div><b>Work Done:</b> <b>${maint.service_type || 'General Service'}</b></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Part Description</th>
              <th style="width: 60px; text-align: center;">Unit</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 100px; text-align: right;">Rate (₹)</th>
              <th style="width: 110px; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${partsRows || '<tr><td colspan="6" style="text-align: center; color: #64748b; font-style: italic;">No inventory spare parts billed.</td></tr>'}
          </tbody>
        </table>

        <div style="width: 300px; margin-left: auto; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Parts Subtotal:</span>
            <b>₹${Number(maint.parts_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Labor Charges:</span>
            <b>₹${Number(maint.labor_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1.5px solid #cbd5e1; font-size: 14px; color: #1e3a8a; font-weight: bold;">
            <span>GRAND TOTAL:</span>
            <span>₹${Number(maint.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="sig-row">
          <div class="sig-box">Mechanic / Technician</div>
          <div class="sig-box">Store Incharge</div>
          <div class="sig-box">Transport Manager</div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  // Open Edit Bill Modal
  const openEditBillModal = (item) => {
    let parsedParts = [];
    if (item.parts_data) {
      try {
        parsedParts = typeof item.parts_data === 'string' ? JSON.parse(item.parts_data) : item.parts_data;
      } catch (e) {
        parsedParts = [];
      }
    }

    setEditingBill({
      ...item,
      job_card_no: item.job_card_no || item.bill_no?.split('-').pop() || '1277',
      driver_name: item.driver_name || '',
      driver_id: item.driver_id || '',
      mileage: item.mileage || '4.6',
      lamp: item.lamp || '2',
      serial_no: item.serial_no || '6',
      bus_id: item.bus_id || '',
      service_date: item.service_date ? item.service_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      service_type: item.service_type || '',
      odometer: item.odometer || '',
      next_due_date: item.next_due_date ? item.next_due_date.slice(0, 10) : '',
      workshop_name: item.workshop_name || 'TMHNU Fleet Workshop',
      mechanic_name: item.mechanic_name || '',
      labor_charges: Number(item.labor_charges) || 0,
      parts_cost: Number(item.parts_cost) || 0,
      cost: Number(item.cost) || 0,
      notes: item.notes || '',
      parts_data: Array.isArray(parsedParts) ? parsedParts : []
    });
  };

  const handleAddPartToBill = () => {
    if (!editingBill) return;
    setEditingBill(prev => ({
      ...prev,
      parts_data: [...prev.parts_data, { part_id: '', part_name: '', unit: 'pcs', quantity: 1, unit_cost: 0, total_cost: 0 }]
    }));
  };

  const handleBillPartChange = (index, field, value) => {
    if (!editingBill) return;
    const updated = [...editingBill.parts_data];
    const target = { ...updated[index] };

    if (field === 'part_id') {
      const selectedInv = inventoryList.find(p => String(p.id) === String(value));
      if (selectedInv) {
        target.part_id = selectedInv.id;
        target.part_name = selectedInv.part_name;
        target.part_number = selectedInv.part_number || '';
        target.unit = selectedInv.unit || 'pcs';
        target.unit_cost = Number(selectedInv.unit_cost) || 0;
        target.available_stock = Number(selectedInv.quantity) || 0;
        target.total_cost = Number(target.quantity) * Number(selectedInv.unit_cost);
      } else {
        target.part_id = '';
        target.part_name = '';
        target.unit_cost = 0;
        target.total_cost = 0;
      }
    } else if (field === 'quantity') {
      const q = Math.max(0, Number(value) || 0);
      target.quantity = q;
      target.total_cost = q * (Number(target.unit_cost) || 0);
    } else if (field === 'unit_cost') {
      const c = Math.max(0, Number(value) || 0);
      target.unit_cost = c;
      target.total_cost = (Number(target.quantity) || 0) * c;
    }

    updated[index] = target;
    const newPartsCost = updated.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);

    setEditingBill(prev => ({
      ...prev,
      parts_data: updated,
      parts_cost: newPartsCost,
      cost: newPartsCost + (Number(prev.labor_charges) || 0)
    }));
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!editingBill.bus_id) {
      toast('Please select a bus');
      return;
    }
    if (!editingBill.service_type) {
      toast('Please enter service description');
      return;
    }

    try {
      const payload = {
        bus_id: editingBill.bus_id,
        service_date: editingBill.service_date,
        service_type: editingBill.service_type,
        cost: editingBill.cost,
        odometer: editingBill.odometer || null,
        next_due_date: editingBill.next_due_date || null,
        notes: editingBill.notes || '',
        bill_no: editingBill.bill_no,
        workshop_name: editingBill.workshop_name,
        mechanic_name: editingBill.mechanic_name,
        labor_charges: editingBill.labor_charges,
        parts_cost: editingBill.parts_cost,
        parts_data: editingBill.parts_data,
        job_card_no: editingBill.job_card_no || '',
        driver_name: editingBill.driver_name || '',
        driver_id: editingBill.driver_id || null,
        mileage: editingBill.mileage || '',
        lamp: editingBill.lamp || '',
        serial_no: editingBill.serial_no || ''
      };

      await api.maintenanceSaveWithParts(payload, editingBill.id);
      toast(editingBill.id ? 'Maintenance bill & Job Card updated!' : 'Job Card & Maintenance bill saved successfully!');
      setEditingBill(null);
      loadData();
    } catch (err) {
      toast(err.message || 'Failed to save maintenance bill');
    }
  };

  const handleDeleteBill = async (item) => {
    if (!window.confirm(`Delete maintenance record (Job Card #${item.job_card_no || item.bill_no})? Deducted spare parts will be restored to store inventory.`)) {
      return;
    }
    try {
      await api.maintenanceDelete(item.id);
      toast('Job card record deleted and inventory restored');
      // If history popup was open, update its list
      if (selectedBusForHistory) {
        setSelectedBusForHistory(prev => ({
          ...prev,
          jobCards: prev.jobCards.filter(jc => jc.id !== item.id)
        }));
      }
      loadData();
    } catch (err) {
      toast(err.message || 'Could not delete job card');
    }
  };

  const openNewBillForBus = (bus) => {
    const today = new Date().toISOString().slice(0, 10);
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ymd = today.replace(/-/g, '');

    const assignedDriver = driverByBusMap[String(bus.id)];

    setEditingBill({
      id: null,
      bill_no: `TMHNU-MN-${ymd}-${rand}`,
      job_card_no: String(Math.floor(1000 + Math.random() * 9000)),
      bus_id: bus.id,
      driver_name: assignedDriver?.name || '',
      driver_id: assignedDriver?.id || null,
      service_date: today,
      service_type: '',
      odometer: bus.current_odometer_km || '',
      mileage: '4.6',
      lamp: '2',
      serial_no: '6',
      next_due_date: '',
      workshop_name: 'TMHNU Fleet Workshop',
      mechanic_name: '',
      labor_charges: 0,
      parts_cost: 0,
      cost: 0,
      notes: '',
      parts_data: []
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <div className="spinner"></div>
        <span style={{ fontWeight: 600, color: '#475569' }}>Loading Fleet Job Cards & Reports...</span>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ padding: '24px 28px' }}>
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>📋</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              {t('Fleet Job Cards & Maintenance Reports')}
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 36px', color: '#64748b', fontSize: 13 }}>
            {t('Bus-wise maintenance job cards, daily workshop logs, service history, and official TMHNU pink slips')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/admin/maintenance')}
            style={{ fontWeight: 600, fontSize: 12.5 }}
          >
            <MaintIcon name="wrench" size={14} color="#475569" />
            <span>{t('Billing & Store')}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openNewBillForBus(buses[0] || {})}
            style={{ fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <MaintIcon name="plus" size={15} color="#fff" />
            <span>{t('+ Issue New Job Card')}</span>
          </button>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* SECTION 1: DAILY / DATE-WISE MAINTENANCE AUDIT & REPORTS                  */}
      {/* ========================================================================= */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 24,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MaintIcon name="calendar" size={18} color="#2563eb" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              {t('Maintenance Report by Date')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setDateFilterMode('today');
                  setReportDate(new Date().toISOString().slice(0, 10));
                }}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: dateFilterMode === 'today' ? 700 : 500,
                  background: dateFilterMode === 'today' ? '#ffffff' : 'transparent',
                  color: dateFilterMode === 'today' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: dateFilterMode === 'today' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {t('Today')}
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('month')}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: dateFilterMode === 'month' ? 700 : 500,
                  background: dateFilterMode === 'month' ? '#ffffff' : 'transparent',
                  color: dateFilterMode === 'month' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: dateFilterMode === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {t('This Month')}
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: dateFilterMode === 'all' ? 700 : 500,
                  background: dateFilterMode === 'all' ? '#ffffff' : 'transparent',
                  color: dateFilterMode === 'all' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: dateFilterMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {t('All Time')}
              </button>
            </div>

            <input
              type="date"
              value={reportDate}
              onChange={e => {
                setReportDate(e.target.value);
                setDateFilterMode('custom');
              }}
              style={{
                height: 34,
                padding: '0 10px',
                borderRadius: 6,
                border: '1.5px solid #cbd5e1',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#0f172a'
              }}
            />

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={printDailyReport}
              style={{ height: 34, padding: '0 14px', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <MaintIcon name="printer" size={14} color="#1e3a8a" />
              <span>{t('Print Date Summary Report')}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* Card 1: Job Cards Count */}
          <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>
              {dateFilterMode === 'all' ? t('Total Job Cards') : `${t('Job Cards')} (${reportDate})`}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#be185d', marginTop: 4 }}>
              {dateFilteredMaintenance.length} <span style={{ fontSize: 13, fontWeight: 600 }}>{t('cards')}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9d174d', marginTop: 2 }}>
              {dateFilteredMaintenance.length === 0 ? t('No records found.') : t('Service Records')}
            </div>
          </div>

          {/* Card 2: Buses in Maintenance */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
              {t('Buses Serviced / In Maintenance')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#1d4ed8', marginTop: 4 }}>
              {uniqueBusesInDateMaint} <span style={{ fontSize: 13, fontWeight: 600 }}>{t('Buses')}</span>
            </div>
            <div style={{ fontSize: 11, color: '#1e40af', marginTop: 2 }}>
              {t('Maintenance')}
            </div>
          </div>

          {/* Card 3: Maintenance Spend for Date */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
              {t('Maintenance Bill Total')} ({dateFilterMode === 'all' ? t('All Time') : reportDate})
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>
              ₹{totalDateSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 11, color: '#065f46', marginTop: 2 }}>
              {t('Parts + Labor combined')}
            </div>
          </div>

          {/* Card 4: All-Time Fleet Summary */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              {t('All-Time Fleet Records')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              {maintenanceList.length} <span style={{ fontSize: 13, fontWeight: 600 }}>{t('cards')}</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {t('Total Fleet Spend')}: <b>₹{totalAllTimeSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: BUS-WISE MASTER FLEET TABLE WITH JOB CARDS HISTORY             */}
      {/* ========================================================================= */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        {/* Table Filters & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {t('Fleet Bus Directory & Job Card Logs')}
            </h2>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {t('Click any bus row to inspect its full date-wise job card history, print slips, and manage bills')}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: 300 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                <MaintIcon name="search" size={14} color="#94a3b8" />
              </span>
              <input
                type="text"
                placeholder={t('Search bus, driver, job card #...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 32,
                  paddingRight: 10,
                  height: 36,
                  fontSize: 12.5,
                  borderRadius: 6,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

        </div>


        {/* Bus-Wise Data Table */}
        <DataTable
          columns={[
            {
              key: 'id',
              label: 'S.No',
              render: (_, __, idx) => <span style={{ fontWeight: 600, color: '#64748b' }}>{idx + 1}</span>
            },
            {
              key: 'registration_number',
              label: 'Bus Number',
              render: (val, item) => (
                <div
                  onClick={() => setSelectedBusForHistory(item)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view all Job Cards for this bus"
                >
                  <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8', fontSize: 13 }}>
                    🚌 {val}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                    {item.bus_model || item.vehicle_type || 'Transport Bus'}
                  </div>
                </div>
              )
            },
            {
              key: 'driverName',
              label: 'Driver',
              render: (val, item) => (
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{val}</div>
                  {item.driverPhone && (
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>📞 {item.driverPhone}</div>
                  )}
                </div>
              )
            },
            {
              key: 'institutionName',
              label: 'Institution',
              render: (val) => (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  {val}
                </span>
              )
            },
            {
              key: 'jobCardsCount',
              label: 'Job Cards Have',
              render: (val, item) => (
                <button
                  type="button"
                  onClick={() => setSelectedBusForHistory(item)}
                  style={{
                    border: '1px solid #fbcfe8',
                    background: val > 0 ? '#fdf2f8' : '#f8fafc',
                    color: val > 0 ? '#be185d' : '#94a3b8',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Click to view history"
                >
                  <span>📋</span>
                  <span>{val} {val === 1 ? 'Job Card' : 'Job Cards'}</span>
                </button>
              )
            },
            {
              key: 'latestService',
              label: 'Latest Service Date',
              render: (val) => {
                if (!val) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No service yet</span>;
                return (
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {val.service_date}
                    </div>
                    {val.odometer && (
                      <div style={{ fontSize: 10.5, color: '#2563eb', fontFamily: 'monospace' }}>
                        ⏱️ {Number(val.odometer).toLocaleString('en-IN')} km
                      </div>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'totalSpend',
              label: 'Total Maint Bill (₹)',
              render: (val) => (
                <span style={{ fontWeight: 800, color: val > 0 ? '#1e3a8a' : '#94a3b8', fontSize: 13 }}>
                  ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, item) => (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setSelectedBusForHistory(item)}
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="View date-wise list of job cards"
                  >
                    📋 {t('View Cards')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => openNewBillForBus(item)}
                    style={{ padding: '4px 8px', fontSize: 11.5 }}
                    title="Log new maintenance bill for this bus"
                  >
                    {t('+ Add Service')}
                  </button>

                </div>
              )
            }
          ]}
          data={filteredBuses}
          emptyText="No buses found matching your search or filters."
        />
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: DATE-WISE LIST OF JOB CARDS FOR SELECTED BUS                 */}
      {/* ========================================================================= */}
      {selectedBusForHistory !== null && (
        <div className="maint-modal-overlay" onClick={() => setSelectedBusForHistory(null)}>
          <div
            className="maint-modal-card"
            style={{ maxWidth: 860, maxHeight: '92vh', borderRadius: 16, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="maint-modal-header" style={{ padding: '16px 22px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
              <div className="maint-header-left" style={{ gap: 14 }}>
                <div className="maint-avatar-icon" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', width: 44, height: 44, borderRadius: 12 }}>
                  <MaintIcon name="bus" size={22} color="#2563eb" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                      {t('Job Cards History')}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '2px 9px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      letterSpacing: '0.03em'
                    }}>
                      <span>🚌</span>
                      <span>{selectedBusForHistory.registration_number}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span>🏛️</span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>{selectedBusForHistory.institutionName || 'All Institutions'}</span>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span>👤</span>
                      <span>{t('Driver')}:</span>
                      {selectedBusForHistory.driverName && selectedBusForHistory.driverName !== '—' ? (
                        <b style={{ color: '#1e293b' }}>{selectedBusForHistory.driverName}</b>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{t('Unassigned')}</span>
                      )}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {selectedBusForHistory.jobCards.length} {selectedBusForHistory.jobCards.length === 1 ? t('Job Card') : t('Job Cards')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    openNewBillForBus(selectedBusForHistory);
                    setSelectedBusForHistory(null);
                  }}
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    padding: '7px 14px',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <MaintIcon name="plus" size={14} color="#ffffff" />
                  <span>{t('+ Issue New Job Card')}</span>
                </button>
                <button
                  type="button"
                  className="maint-close-btn"
                  onClick={() => setSelectedBusForHistory(null)}
                  title={t('Close')}
                >
                  <MaintIcon name="x" size={15} color="#64748b" />
                </button>
              </div>
            </div>

            {/* Modal Body: Date-wise List of Job Cards */}
            <div className="maint-modal-body" style={{ padding: '20px 22px', background: '#f8fafc', overflowY: 'auto' }}>
              {selectedBusForHistory.jobCards.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: '#ffffff',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: 12
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋 🚌</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                    {t('No records found.')} ({selectedBusForHistory.registration_number})
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                    {t('Click below to generate the first vehicle maintenance job card for this bus.')}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      openNewBillForBus(selectedBusForHistory);
                      setSelectedBusForHistory(null);
                    }}
                    style={{ marginTop: 16, fontWeight: 700 }}
                  >
                    {t('+ Issue New Job Card')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {selectedBusForHistory.jobCards.map((card, idx) => {
                    let parts = [];
                    if (card.parts_data) {
                      try {
                        parts = typeof card.parts_data === 'string' ? JSON.parse(card.parts_data) : card.parts_data;
                      } catch (e) {
                        parts = [];
                      }
                    }

                    return (
                      <div
                        key={card.id || idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '16px 18px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Card Top Ribbon */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: 10,
                          marginBottom: 12,
                          flexWrap: 'wrap',
                          gap: 8
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontWeight: 700,
                              fontSize: 12,
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '3px 9px',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0'
                            }}>
                              <span>📅</span>
                              <span>{card.service_date}</span>
                            </span>

                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 12,
                              background: '#fdf2f8',
                              color: '#be185d',
                              padding: '3px 8px',
                              borderRadius: 6,
                              border: '1px solid #fbcfe8'
                            }}>
                              <span>📋</span>
                              <span>Job Card #{card.job_card_no || '1277'}</span>
                            </span>

                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11.5,
                              color: '#64748b',
                              background: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0'
                            }}>
                              <span>🧾</span>
                              <span>Bill: <b style={{ color: '#0f172a' }}>{card.bill_no || `MN-${String(card.id).padStart(4, '0')}`}</b></span>
                            </span>
                          </div>

                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '3px 10px',
                            borderRadius: 7
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                              Grand Total Bill:
                            </span>
                            <span style={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: '#1d4ed8'
                            }}>
                              ₹{Number(card.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Card Particulars Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: 10,
                          fontSize: 12,
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          padding: '10px 14px',
                          borderRadius: 8,
                          marginBottom: 12
                        }}>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
                              {t('Driver')}
                            </div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {card.driver_name && card.driver_name !== '—'
                                ? card.driver_name
                                : (selectedBusForHistory.driverName && selectedBusForHistory.driverName !== '—'
                                    ? selectedBusForHistory.driverName
                                    : <span style={{ color: '#94a3b8' }}>—</span>)}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
                              {t('Mechanic')}
                            </div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {card.mechanic_name && card.mechanic_name !== '—'
                                ? card.mechanic_name
                                : <span style={{ color: '#94a3b8' }}>Workshop Team</span>}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
                              {t('Odometer')}
                            </div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                              {card.odometer ? `${Number(card.odometer).toLocaleString('en-IN')} km` : <span style={{ color: '#94a3b8' }}>—</span>}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
                              {t('Pink Slip Meta')}
                            </div>
                            <div style={{ color: '#475569', fontSize: 11.5 }}>
                              {card.lamp || card.mileage || card.serial_no ? (
                                <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                                  {card.serial_no && <span>S.No: <b>#{card.serial_no}</b></span>}
                                  {card.mileage && <span>Mil: <b>{card.mileage}</b></span>}
                                  {card.lamp && <span>Lamp: <b>{card.lamp}</b></span>}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Work Done / Service Description */}
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid #f1f5f9',
                          borderRadius: 8,
                          padding: '10px 12px',
                          marginBottom: 12
                        }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                            {t('Work Done / Service Description')}
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                            {card.service_type || 'General Service'}
                          </div>
                          {card.notes && (
                            <div style={{
                              fontSize: 12,
                              color: '#64748b',
                              marginTop: 5,
                              paddingTop: 5,
                              borderTop: '1px dashed #f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}>
                              <span style={{ color: '#94a3b8' }}>💬</span>
                              <span>{t('Note')}: <span style={{ color: '#334155' }}>{card.notes}</span></span>
                            </div>
                          )}
                        </div>

                        {/* Consumed Spare Parts */}
                        {Array.isArray(parts) && parts.length > 0 && (
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 12
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 6
                            }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span>📦</span>
                                <span>{t('Spare Parts Consumed')} ({parts.length})</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {parts.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  style={{
                                    fontSize: 11.5,
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    padding: '4px 9px',
                                    borderRadius: 6,
                                    color: '#334155',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                  }}
                                >
                                  <b style={{ color: '#0f172a' }}>{p.part_name}</b>
                                  <span style={{ color: '#94a3b8' }}>·</span>
                                  <span style={{ color: '#64748b' }}>{p.quantity} {p.unit || 'pcs'}</span>
                                  <span style={{ color: '#94a3b8' }}>·</span>
                                  <b style={{ color: '#1d4ed8' }}>₹{Number(p.total_cost || 0).toFixed(2)}</b>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions Suite */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 8,
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: 10,
                          flexWrap: 'wrap'
                        }}>
                          <button
                            type="button"
                            onClick={() => setViewingJobCard(card)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 6,
                              border: '1px solid #fbcfe8',
                              background: '#fdf2f8',
                              color: '#be185d',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="View official TMHNU Pink Slip"
                          >
                            <span>📋</span>
                            <span>{t('Pink Job Card')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => printMaintenanceInvoice(card)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Print detailed invoice bill"
                          >
                            <MaintIcon name="printer" size={13} color="#475569" />
                            <span>{t('Print Bill')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditBillModal(card)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#2563eb',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Edit this record and spare parts"
                          >
                            <MaintIcon name="wrench" size={13} color="#2563eb" />
                            <span>{t('Edit')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBill(card)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: '1px solid #fecaca',
                              background: '#ffffff',
                              color: '#dc2626',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Delete this record"
                          >
                            <MaintIcon name="trash" size={13} color="#dc2626" />
                            <span>{t('Delete')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="maint-modal-footer" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 22px',
              background: '#ffffff',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>
                {t('Total Records')}: <b style={{ color: '#0f172a' }}>{selectedBusForHistory.jobCards.length}</b> {selectedBusForHistory.jobCards.length === 1 ? t('job card') : t('job cards')}
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedBusForHistory(null)}
                style={{ fontWeight: 600, padding: '7px 18px', fontSize: 13 }}
              >
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TMHNU PINK JOB CARD PREVIEW & DUAL PRINT                           */}
      {/* ========================================================================= */}
      {viewingJobCard !== null && (
        <div className="maint-modal-overlay" onClick={() => setViewingJobCard(null)}>
          <div
            className="maint-modal-card"
            style={{ maxWidth: 640, maxHeight: '94vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="maint-modal-header" style={{ padding: '14px 20px' }}>
              <div className="maint-header-left">
                <div className="maint-avatar-icon" style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#be185d' }}>
                  <MaintIcon name="fileText" size={20} color="#be185d" />
                </div>
                <div>
                  <h3 className="maint-header-title" style={{ fontSize: 16 }}>
                    T.M.H.N.U. Vehicle Maintenance Job Card
                  </h3>
                  <div className="maint-header-sub">
                    Slip No: <b style={{ fontFamily: 'monospace', color: '#be185d', fontSize: 13 }}>#{viewingJobCard.job_card_no || '1277'}</b>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="maint-btn-pink"
                  onClick={() => printTMHNUJobCard(viewingJobCard, true)}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  <MaintIcon name="printer" size={13} color="#be185d" />
                  <span>Print Pink Slip</span>
                </button>
                <button
                  type="button"
                  className="maint-close-btn"
                  onClick={() => setViewingJobCard(null)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="maint-modal-body" style={{ background: '#f1f5f9', padding: '20px 14px', display: 'flex', justifyContent: 'center' }}>
              <div className="tmhnu-jobcard-preview">
                {/* Header Box */}
                <div style={{
                  border: '1.5px solid #000',
                  padding: '6px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <svg width="60" height="60" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#000" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#000" strokeWidth="1.5" />
                    <path id="jcLeftTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
                    <path id="jcLeftBot" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
                    <text fontFamily="'Times New Roman', serif" fontSize="7.5" fontWeight="bold" fill="#000">
                      <textPath href="#jcLeftTop" startOffset="50%" textAnchor="middle">T.M.H.N.U.</textPath>
                    </text>
                    <text fontFamily="'Times New Roman', serif" fontSize="6.2" fontWeight="bold" fill="#000">
                      <textPath href="#jcLeftBot" startOffset="50%" textAnchor="middle">VEHICLE MAINTENANCE</textPath>
                    </text>
                    <g transform="translate(37, 36) scale(1.1)">
                      <rect x="2" y="2" width="20" height="15" rx="3" fill="none" stroke="#000" strokeWidth="1.8" />
                      <line x1="2" y1="8" x2="22" y2="8" stroke="#000" strokeWidth="1.2" />
                      <circle cx="7" cy="18" r="2" fill="#000" />
                      <circle cx="17" cy="18" r="2" fill="#000" />
                    </g>
                  </svg>

                  <div style={{ textAlign: 'center', flex: 1, padding: '0 4px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 'bold', letterSpacing: 0.5, lineHeight: 1.25 }}>
                      T.M.H.N.U.EDUCATION INSTITUTIONS
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, lineHeight: 1.25, marginTop: 1 }}>
                      VEHICLE MAINTENANCE,
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 'bold', letterSpacing: 1, marginTop: 1 }}>
                      THENI.
                    </div>
                  </div>

                  <svg width="60" height="60" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#000" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#000" strokeWidth="1.5" />
                    <path id="jcRightTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
                    <path id="jcRightBot" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
                    <text fontFamily="'Times New Roman', serif" fontSize="7.5" fontWeight="bold" fill="#000">
                      <textPath href="#jcRightTop" startOffset="50%" textAnchor="middle">T.M.H.N.U.</textPath>
                    </text>
                    <text fontFamily="'Times New Roman', serif" fontSize="7.5" fontWeight="bold" fill="#000">
                      <textPath href="#jcRightBot" startOffset="50%" textAnchor="middle">THENI</textPath>
                    </text>
                    <g transform="translate(37, 36) scale(1.1)">
                      <circle cx="12" cy="8" r="6" fill="none" stroke="#000" strokeWidth="1.8" />
                      <path d="M 4,22 C 4,16 8,15 12,15 C 16,15 20,16 20,22" fill="none" stroke="#000" strokeWidth="1.8" />
                    </g>
                  </svg>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, fontWeight: 'bold', marginBottom: 5 }}>
                  <div>
                    Job card No <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>{viewingJobCard.job_card_no || '1277'}</span>
                  </div>
                  <div>
                    Date : <span style={{ fontWeight: 700 }}>{viewingJobCard.service_date}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, fontWeight: 'bold', marginBottom: 5 }}>
                  <div>
                    Driver Name : <span>{viewingJobCard.driver_name || '—'}</span>
                  </div>
                  <div>
                    Vehicle No : <span style={{ fontSize: 16, fontWeight: 900 }}>{viewingJobCard.bus_id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, fontWeight: 'bold', marginBottom: 5 }}>
                  <div>
                    Mechanic Name : <span>{viewingJobCard.mechanic_name || '—'}</span>
                  </div>
                  <div>
                    km : <span style={{ fontWeight: 900 }}>{viewingJobCard.odometer || '—'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, fontWeight: 'bold', marginBottom: 3 }}>
                  <div>Lamp : ( {viewingJobCard.lamp || '2'} ) ,</div>
                  <div>Mileage : {viewingJobCard.mileage || '4.6'} ,</div>
                  <div>S.No : ( {viewingJobCard.serial_no || '6'} )</div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 'bold', borderTop: '1.5px solid #000', borderBottom: '1px solid #4a6b82', padding: '3px 0 2px 0', marginTop: 4 }}>
                  Work Details
                </div>

                <div>
                  <div style={{ height: 28, borderBottom: '1.2px solid #4a6b82', display: 'flex', alignItems: 'flex-end', paddingBottom: 2, paddingLeft: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>
                      {viewingJobCard.service_type}
                    </span>
                  </div>
                  {[...Array(12)].map((_, i) => (
                    <div key={i} style={{ height: 28, borderBottom: '1.2px solid #4a6b82' }}></div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, padding: '0 4px 6px 4px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ height: 22, fontFamily: "'Brush Script MT', cursive", fontSize: 15, color: '#1e3a8a' }}>{viewingJobCard.driver_name?.slice(0, 8) || ''}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2 }}>Driver Sign</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ height: 22, fontFamily: "'Brush Script MT', cursive", fontSize: 15, color: '#1e3a8a' }}>{viewingJobCard.mechanic_name?.slice(0, 8) || ''}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2 }}>Mechanic Sign</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ height: 22 }}></div>
                    <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2 }}>Manager Sign</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ height: 22 }}></div>
                    <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2 }}>Secretary Sign</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="maint-modal-footer">
              <button
                type="button"
                className="maint-btn-cancel"
                onClick={() => setViewingJobCard(null)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => printTMHNUJobCard(viewingJobCard, false)}
                style={{ fontWeight: 600, fontSize: 12.5 }}
              >
                📄 Print for Pink Stationery
              </button>
              <button
                type="button"
                className="maint-btn-pink"
                onClick={() => printTMHNUJobCard(viewingJobCard, true)}
                style={{ padding: '9px 18px', fontSize: 13 }}
              >
                <MaintIcon name="printer" size={15} color="#be185d" />
                <span>Print Authentic Pink Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / CREATE MAINTENANCE BILL                                     */}
      {/* ========================================================================= */}
      {editingBill !== null && (
        <div className="maint-modal-overlay" onClick={() => setEditingBill(null)}>
          <div
            className="maint-modal-card"
            style={{ maxWidth: 900, maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="maint-modal-header">
              <div className="maint-header-left">
                <div className="maint-avatar-icon maint-avatar--indigo">
                  <MaintIcon name="wrench" size={22} color="#4f46e5" />
                </div>
                <div>
                  <h3 className="maint-header-title">
                    {editingBill.id ? 'Edit Maintenance Service & Parts Bill' : 'New Maintenance Service & Spare Parts Bill'}
                  </h3>
                  <div className="maint-header-sub">
                    Reference: <span className="mono" style={{ fontWeight: 800, color: '#1e3a8a' }}>{editingBill.bill_no}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="maint-close-btn"
                onClick={() => setEditingBill(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="maint-modal-body">
                {/* Section 1 */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MaintIcon name="bus" size={15} color="#2563eb" />
                    <span>1. Vehicle & Service Particulars</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div>
                      <label className="maint-form-label">
                        Select Bus <span className="maint-req">*</span>
                      </label>
                      <select
                        className="maint-input-field"
                        required
                        value={editingBill.bus_id}
                        onChange={e => {
                          const bId = e.target.value;
                          const b = buses.find(x => String(x.id) === String(bId));
                          const drv = driverByBusMap[String(bId)];
                          setEditingBill(prev => ({
                            ...prev,
                            bus_id: bId,
                            driver_name: drv?.name || prev.driver_name,
                            driver_id: drv?.id || prev.driver_id,
                            odometer: b?.current_odometer_km || prev.odometer
                          }));
                        }}
                        style={{ fontWeight: 600 }}
                      >
                        <option value="">— Choose Bus —</option>
                        {buses.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.registration_number} {b.bus_model ? `(${b.bus_model})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Job Card Slip No <span style={{ color: '#be185d', fontWeight: 700, fontSize: 11 }}>(Pink Slip #)</span>
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="e.g. 1277"
                        value={editingBill.job_card_no || ''}
                        onChange={e => setEditingBill({ ...editingBill, job_card_no: e.target.value })}
                        style={{ fontFamily: 'monospace', fontWeight: 700, color: '#be185d' }}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">Driver Name</label>
                      <input
                        type="text"
                        className="maint-input-field"
                        value={editingBill.driver_name || ''}
                        onChange={e => setEditingBill({ ...editingBill, driver_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">Service Date <span className="maint-req">*</span></label>
                      <input
                        type="date"
                        className="maint-input-field"
                        required
                        value={editingBill.service_date}
                        onChange={e => setEditingBill({ ...editingBill, service_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">Odometer (km)</label>
                      <input
                        type="number"
                        min="0"
                        className="maint-input-field"
                        value={editingBill.odometer || ''}
                        onChange={e => setEditingBill({ ...editingBill, odometer: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">Mechanic Name</label>
                      <input
                        type="text"
                        className="maint-input-field"
                        value={editingBill.mechanic_name || ''}
                        onChange={e => setEditingBill({ ...editingBill, mechanic_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">Mileage (kmpl)</label>
                      <input
                        type="text"
                        className="maint-input-field"
                        value={editingBill.mileage || ''}
                        onChange={e => setEditingBill({ ...editingBill, mileage: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">Lamp</label>
                      <input
                        type="text"
                        className="maint-input-field"
                        value={editingBill.lamp || ''}
                        onChange={e => setEditingBill({ ...editingBill, lamp: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">S.No</label>
                      <input
                        type="text"
                        className="maint-input-field"
                        value={editingBill.serial_no || ''}
                        onChange={e => setEditingBill({ ...editingBill, serial_no: e.target.value })}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="maint-form-label">Work Done / Description <span className="maint-req">*</span></label>
                      <input
                        type="text"
                        className="maint-input-field"
                        required
                        placeholder="e.g. Full Oil Service + Brake Overhaul + Front Wheel Hub Bolt"
                        value={editingBill.service_type}
                        onChange={e => setEditingBill({ ...editingBill, service_type: e.target.value })}
                        style={{ fontWeight: 600 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MaintIcon name="box" size={17} color="#2563eb" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                        2. Spare Parts Billed / Consumed From Store
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPartToBill}
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        fontWeight: 600,
                        fontSize: 12.5,
                        borderRadius: 7,
                        padding: '6px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Spare Part
                    </button>
                  </div>

                  {editingBill.parts_data.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, color: '#64748b', fontSize: 12 }}>
                      No spare parts attached. Click "+ Add Spare Part" above.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'visible' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, overflow: 'visible' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 12px', fontSize: 11, textAlign: 'left', fontWeight: 700, color: '#475569', width: '40%' }}>SELECT SPARE PART</th>
                            <th style={{ padding: '8px 10px', fontSize: 11, textAlign: 'center', fontWeight: 700, color: '#475569', width: '15%' }}>QTY</th>
                            <th style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', fontWeight: 700, color: '#475569', width: '20%' }}>RATE (₹)</th>
                            <th style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', fontWeight: 700, color: '#475569', width: '20%' }}>AMOUNT (₹)</th>
                            <th style={{ width: 34 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingBill.parts_data.map((partItem, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', minWidth: 260, position: 'relative' }}>
                                <SparePartSearchSelect
                                  value={partItem.part_id}
                                  onChange={val => handleBillPartChange(idx, 'part_id', val)}
                                  inventoryList={inventoryList}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  className="maint-input-field"
                                  value={partItem.quantity}
                                  onChange={e => handleBillPartChange(idx, 'quantity', e.target.value)}
                                  style={{ width: 75, height: 36, textAlign: 'center', fontWeight: 700 }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="maint-input-field"
                                  value={partItem.unit_cost}
                                  onChange={e => handleBillPartChange(idx, 'unit_cost', e.target.value)}
                                  style={{ width: 90, height: 36, textAlign: 'right', fontWeight: 600 }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a' }}>
                                ₹{Number(partItem.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = editingBill.parts_data.filter((_, i) => i !== idx);
                                    const newCost = updated.reduce((s, it) => s + (Number(it.total_cost) || 0), 0);
                                    setEditingBill({
                                      ...editingBill,
                                      parts_data: updated,
                                      parts_cost: newCost,
                                      cost: newCost + (Number(editingBill.labor_charges) || 0)
                                    });
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 3: Totals & Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="maint-form-label">Labor & Workshop Service Charges</label>
                    <div className="maint-currency-group">
                      <span className="maint-currency-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        className="maint-currency-input"
                        value={editingBill.labor_charges}
                        onChange={e => {
                          const l = Number(e.target.value) || 0;
                          setEditingBill(prev => ({
                            ...prev,
                            labor_charges: l,
                            cost: (Number(prev.parts_cost) || 0) + l
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="maint-form-label">Technician Remarks / Service Notes</label>
                    <input
                      type="text"
                      className="maint-input-field"
                      value={editingBill.notes}
                      onChange={e => setEditingBill({ ...editingBill, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#1e40af' }}>
                    Parts: <b>₹{Number(editingBill.parts_cost || 0).toFixed(2)}</b> + Labor: <b>₹{Number(editingBill.labor_charges || 0).toFixed(2)}</b>
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#1e3a8a' }}>
                    GRAND TOTAL: ₹{Number(editingBill.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="maint-modal-footer">
                <button
                  type="button"
                  className="maint-btn-cancel"
                  onClick={() => setEditingBill(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="maint-btn-primary"
                >
                  <MaintIcon name="check" size={16} color="#fff" />
                  <span>Save & Sync Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
