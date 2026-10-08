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
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    refresh: <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    card: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
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

const CATEGORIES = [
  'Fasteners & Hardware',
  'Brakes',
  'Engine & Filters',
  'Oils & Lubricants',
  'Springs & Controls',
  'Clutch & Gearbox',
  'Electrical & Lighting',
  'Belts & Hoses',
  'Suspension & Steering',
  'Body & Cabin',
  'General Spares'
];

const UNITS = ['pcs', 'sets', 'liters', 'boxes', 'meters', 'kg', 'cans'];

/**
 * Modern Searchable Select for Spare Parts in Maintenance Billing
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
      {/* Trigger Display */}
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

      {/* Popover Dropdown */}
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
          {/* Search Input */}
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

          {/* Category Filter Pills (if multiple) */}
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

          {/* Results List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                <div>No spare parts found matching "{searchTerm}"</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                  Check spelling or add new parts in Spare Parts Inventory tab.
                </div>
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
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background 0.1s ease'
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
                        {inv.category && (
                          <span style={{ fontSize: 10, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0 4px', borderRadius: 3 }}>
                            {inv.category}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Unit Rate: <b style={{ color: '#0f172a' }}>₹{Number(inv.unit_cost || 0).toFixed(2)}</b> per {inv.unit || 'pcs'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: isOut ? '#fee2e2' : '#dcfce7',
                        color: isOut ? '#dc2626' : '#15803d',
                        display: 'inline-block'
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

export default function Maintenance({ defaultTab = 'maintenance' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [refs, setRefs] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusFilter, setSelectedBusFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Modals
  const [editingBill, setEditingBill] = useState(null); // Maintenance Billing modal
  const [editingItem, setEditingItem] = useState(null); // Add/Edit Inventory Part modal
  const [restockingItem, setRestockingItem] = useState(null); // Quick restock modal
  const [viewingInvoice, setViewingInvoice] = useState(null); // Invoice preview & print modal
  const [viewingJobCard, setViewingJobCard] = useState(null); // Official TMHNU Pink Job Card modal

  const toast = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();


  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const loadData = () => {
    Promise.all([
      api.listRes('maintenance_logs'),
      api.listRes('inventory_items'),
      api.inventoryStats().catch(() => null),
      api.refs()
    ]).then(([maintRes, invRes, statsRes, refsRes]) => {
      setMaintenanceList(maintRes.items || []);
      setInventoryList(invRes.items || []);
      if (statsRes?.stats) setInventoryStats(statsRes);
      setRefs(refsRes || {});
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const buses = refs.buses || [];
  const drivers = refs.drivers || [];

  const getBusReg = (busId) => {
    const b = buses.find(x => String(x.id) === String(busId));
    return b ? b.registration_number : '—';
  };

  // --------------------------------------------------------------------------
  // MAINTENANCE BILLING MODAL HELPERS & COMPUTATIONS
  // --------------------------------------------------------------------------
  const openNewBillModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ymd = today.replace(/-/g, '');

    setEditingBill({
      id: null,
      bill_no: `TMHNU-MN-${ymd}-${rand}`,
      job_card_no: String(Math.floor(1000 + Math.random() * 9000)),
      bus_id: '',
      driver_name: '',
      driver_id: '',
      service_date: today,
      service_type: '',
      odometer: '',
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

  const handleBusSelect = (busId) => {
    const selectedBus = buses.find(b => String(b.id) === String(busId));
    let matchedDriverName = editingBill?.driver_name || '';
    let matchedDriverId = editingBill?.driver_id || '';
    if (selectedBus) {
      const d = drivers.find(drv => String(drv.bus_id) === String(busId) || String(drv.id) === String(selectedBus.driver_id));
      if (d) {
        matchedDriverName = d.name;
        matchedDriverId = d.id;
      }
    }
    setEditingBill(prev => ({
      ...prev,
      bus_id: busId,
      driver_name: matchedDriverName,
      driver_id: matchedDriverId
    }));
  };

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
    const newPartLine = {
      part_id: '',
      part_name: '',
      part_number: '',
      unit: 'pcs',
      quantity: 1,
      unit_cost: 0,
      total_cost: 0
    };
    setEditingBill(prev => ({
      ...prev,
      parts_data: [...prev.parts_data, newPartLine]
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

    // Recalculate parts total & grand total
    const newPartsCost = updated.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);
    const newGrandTotal = newPartsCost + (Number(editingBill.labor_charges) || 0);

    setEditingBill(prev => ({
      ...prev,
      parts_data: updated,
      parts_cost: newPartsCost,
      cost: newGrandTotal
    }));
  };

  const handleRemovePartFromBill = (index) => {
    if (!editingBill) return;
    const updated = editingBill.parts_data.filter((_, i) => i !== index);
    const newPartsCost = updated.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);
    const newGrandTotal = newPartsCost + (Number(editingBill.labor_charges) || 0);

    setEditingBill(prev => ({
      ...prev,
      parts_data: updated,
      parts_cost: newPartsCost,
      cost: newGrandTotal
    }));
  };

  const handleLaborChange = (val) => {
    const labor = Math.max(0, Number(val) || 0);
    setEditingBill(prev => ({
      ...prev,
      labor_charges: labor,
      cost: (Number(prev.parts_cost) || 0) + labor
    }));
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!editingBill.bus_id) {
      toast('Please select a bus for maintenance');
      return;
    }
    if (!editingBill.service_type) {
      toast('Please enter the work done / service description');
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
      toast(editingBill.id ? 'Maintenance bill updated & stock synchronized!' : 'Maintenance bill created & spare parts deducted from inventory!');
      setEditingBill(null);
      loadData();
    } catch (err) {
      toast(err.message || 'Failed to save maintenance bill');
    }
  };

  const handleDeleteBill = async (item) => {
    if (!window.confirm(`Delete maintenance record for Bus ${getBusReg(item.bus_id)} (${item.bill_no || 'Bill'})? Deducted spare parts will be returned to inventory.`)) {
      return;
    }
    try {
      await api.maintenanceDelete(item.id);
      toast('Maintenance record deleted and stock restored');
      loadData();
    } catch (err) {
      toast(err.message || 'Could not delete record');
    }
  };

  // --------------------------------------------------------------------------
  // INVENTORY PART MANAGEMENT (ADD, EDIT, RESTOCK, DELETE)
  // --------------------------------------------------------------------------
  const openNewItemModal = () => {
    setEditingItem({
      id: null,
      part_name: '',
      part_number: '',
      category: 'General Spares',
      unit: 'pcs',
      unit_cost: '',
      quantity: '',
      min_stock_alert: 5,
      supplier_name: '',
      invoice_no: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      notes: ''
    });
  };

  const handleSaveInventoryItem = async (e) => {
    e.preventDefault();
    if (!editingItem.part_name) {
      toast('Part name is required');
      return;
    }
    try {
      await api.saveRes('inventory_items', {
        ...editingItem,
        unit_cost: Number(editingItem.unit_cost) || 0,
        quantity: Number(editingItem.quantity) || 0,
        min_stock_alert: Number(editingItem.min_stock_alert) || 5
      }, editingItem.id);
      toast(editingItem.id ? 'Inventory item updated' : 'New spare part added to inventory');
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast(err.message || 'Could not save inventory item');
    }
  };

  const handleDeleteInventoryItem = async (item) => {
    if (!window.confirm(`Delete "${item.part_name}" from inventory?`)) return;
    try {
      await api.delRes('inventory_items', item.id);
      toast('Spare part deleted from inventory');
      loadData();
    } catch (err) {
      toast(err.message || 'Could not delete item');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockingItem || !restockingItem.add_quantity || Number(restockingItem.add_quantity) <= 0) {
      toast('Please enter a valid quantity to add');
      return;
    }
    try {
      await api.inventoryRestock(restockingItem);
      toast(`Successfully restocked ${restockingItem.add_quantity} units of ${restockingItem.part_name}`);
      setRestockingItem(null);
      loadData();
    } catch (err) {
      toast(err.message || 'Could not restock item');
    }
  };

  // --------------------------------------------------------------------------
  // PRINT MAINTENANCE BILL INVOICE
  // --------------------------------------------------------------------------
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
        <td>
          <b>${p.part_name || 'Spare Part'}</b>
          ${p.part_number ? `<div style="font-size: 10px; color: #64748b;">Code: ${p.part_number}</div>` : ''}
        </td>
        <td style="text-align: center;">${p.unit || 'pcs'}</td>
        <td style="text-align: center; font-weight: bold;">${p.quantity}</td>
        <td style="text-align: right;">₹${Number(p.unit_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: bold;">₹${Number(p.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Maintenance Bill - ${maint.bill_no || 'Invoice'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            padding: 30px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .title { font-size: 18px; font-weight: 800; color: #1e3a8a; }
          .subtitle { font-size: 12px; font-weight: 600; color: #475569; }
          .badge {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 700;
            margin-top: 6px;
            border: 1px solid #bfdbfe;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 18px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .meta-item b { color: #334155; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 7px 10px;
          }
          th {
            background: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            margin-bottom: 30px;
          }
          .totals-table td {
            padding: 6px 10px;
          }
          .grand-total {
            background: #eff6ff;
            font-size: 14px;
            font-weight: 800;
            color: #1e3a8a;
          }
          .sig-row {
            display: flex;
            justifyContent: space-between;
            margin-top: 50px;
            padding-top: 20px;
          }
          .sig-box {
            text-align: center;
            width: 180px;
            border-top: 1.5px solid #0f172a;
            padding-top: 6px;
            font-size: 11px;
            font-weight: 600;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">THENI MELAPETTAI HINDU NADARGAL URAVINMURAI (TMHNU)</div>
          <div class="subtitle">Central Transport Fleet & Garage Operations</div>
          <div class="badge">VEHICLE MAINTENANCE & SPARE PARTS BILL</div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="meta-item"><b>Bill / Invoice No:</b> ${maint.bill_no || '—'}</div>
            <div class="meta-item"><b>Service Date:</b> ${maint.service_date || '—'}</div>
            <div class="meta-item"><b>Workshop / Garage:</b> ${maint.workshop_name || 'TMHNU Fleet Workshop'}</div>
            <div class="meta-item"><b>Mechanic / Technician:</b> ${maint.mechanic_name || '—'}</div>
          </div>
          <div>
            <div class="meta-item"><b>Bus Registration:</b> <span style="font-family: monospace; font-weight: 800; color: #1d4ed8;">${bus?.registration_number || getBusReg(maint.bus_id)}</span></div>
            <div class="meta-item"><b>Vehicle Model:</b> ${bus?.bus_model || bus?.vehicle_type || 'Transport Bus'}</div>
            <div class="meta-item"><b>Odometer at Service:</b> ${maint.odometer ? `${Number(maint.odometer).toLocaleString('en-IN')} km` : '—'}</div>
            <div class="meta-item"><b>Work Type:</b> <b>${maint.service_type || 'General Service'}</b></div>
          </div>
        </div>

        ${parts.length > 0 ? `
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; color: #1e3a8a;">
            📦 Spare Parts Consumed & Billed:
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
              ${partsRows}
            </tbody>
          </table>
        ` : `
          <div style="padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; margin-bottom: 20px; font-style: italic; color: #64748b;">
            No inventory spare parts billed for this maintenance service.
          </div>
        `}

        <table class="totals-table">
          <tr>
            <td>Spare Parts Subtotal:</td>
            <td style="text-align: right; font-weight: bold;">₹${Number(maint.parts_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Labor / Workshop Charges:</td>
            <td style="text-align: right; font-weight: bold;">₹${Number(maint.labor_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr class="grand-total">
            <td>GRAND TOTAL BILL:</td>
            <td style="text-align: right;">₹${Number(maint.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>

        ${maint.notes ? `
          <div style="margin-bottom: 24px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
            <b>Technician Notes / Remarks:</b>
            <div style="margin-top: 4px; color: #475569;">${maint.notes}</div>
          </div>
        ` : ''}

        <div class="sig-row">
          <div class="sig-box">
            <div>Mechanic / Technician</div>
            <div style="font-size: 9px; color: #64748b;">Work Execution</div>
          </div>
          <div class="sig-box">
            <div>Store / Spare Parts Incharge</div>
            <div style="font-size: 9px; color: #64748b;">Stock Verification</div>
          </div>
          <div class="sig-box">
            <div>Transport Manager</div>
            <div style="font-size: 9px; color: #64748b;">Approval & Clearance</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  // --------------------------------------------------------------------------
  // PRINT AUTHENTIC T.M.H.N.U. PINK JOB CARD
  // --------------------------------------------------------------------------
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

    const regNo = bus?.registration_number || getBusReg(maint.bus_id);
    const shortVehicleNo = (regNo && regNo.replace(/[^0-9]/g, '').slice(-4)) || regNo || '4685';

    // Format date like '23.9.26'
    let formattedDate = maint.service_date || '';
    if (formattedDate.includes('-')) {
      const partsDate = formattedDate.split('-');
      if (partsDate.length === 3) {
        const yearShort = partsDate[0].slice(-2);
        const monthShort = parseInt(partsDate[1], 10);
        const dayShort = parseInt(partsDate[2], 10);
        formattedDate = `${dayShort}.${monthShort}.${yearShort}`;
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

    // Build the ruled lines
    const lineEntries = [];
    if (maint.service_type) {
      lineEntries.push(maint.service_type);
    }
    lineEntries.push(''); // Blank spacing line like photo
    if (Array.isArray(parts)) {
      parts.forEach(p => {
        if (p.part_name) {
          lineEntries.push(`${p.part_name} - ${p.quantity} ${p.unit || ''}`);
        }
      });
    }

    // Pad lines up to 13 lines
    const totalLines = 13;
    while (lineEntries.length < totalLines) {
      lineEntries.push('');
    }

    const linesHtml = lineEntries.slice(0, totalLines).map(text => `
      <div class="ruled-line">
        <span class="line-content">${text}</span>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TMHNU Job Card #${jobCardNum}</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Times New Roman', Times, Georgia, serif;
            color: #000;
            background: ${isPinkPaper ? '#ffccd5' : '#ffffff'};
            display: flex;
            justify-content: center;
          }
          .card-outer-border {
            width: 100%;
            max-width: 520px;
            border: 2px solid #000;
            padding: 8px 10px;
            background: ${isPinkPaper ? '#ffccd5' : '#ffffff'};
          }
          .header-box {
            border: 1.5px solid #000;
            padding: 6px 4px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 4px;
          }
          .inst-title {
            font-size: 14.5px;
            font-weight: bold;
            letter-spacing: 0.5px;
            line-height: 1.25;
          }
          .inst-sub {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.5px;
            line-height: 1.25;
            margin-top: 1px;
          }
          .inst-loc {
            font-size: 13.5px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 1px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 6px;
            line-height: 1.35;
          }
          .card-num {
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 2px;
          }
          .veh-num {
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 1px;
          }
          .work-details-header {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            border-top: 1.5px solid #000;
            border-bottom: 1px solid #4a6b82;
            padding: 3px 0 2px 0;
            margin-top: 4px;
          }
          .ruled-lines-container {
            width: 100%;
            margin-top: 0;
          }
          .ruled-line {
            height: 30px;
            border-bottom: 1.2px solid #4a6b82;
            display: flex;
            align-items: flex-end;
            padding-bottom: 3px;
            padding-left: 12px;
          }
          .line-content {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.3px;
            color: #000;
          }
          .sig-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 28px;
            padding: 0 4px 6px 4px;
          }
          .sig-col {
            text-align: center;
            flex: 1;
          }
          .sig-handwritten {
            height: 24px;
            font-family: 'Brush Script MT', cursive, sans-serif;
            font-size: 16px;
            color: #1e3a8a;
          }
          .sig-label {
            font-size: 12.5px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="card-outer-border">
          <div class="header-box">
            <!-- Left Emblem -->
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
                <line x1="6" y1="12" x2="18" y2="12" stroke="#000" stroke-width="1.2" />
              </g>
            </svg>

            <!-- Center Text -->
            <div class="header-center">
              <div class="inst-title">T.M.H.N.U.EDUCATION INSTITUTIONS</div>
              <div class="inst-sub">VEHICLE MAINTENANCE,</div>
              <div class="inst-loc">THENI.</div>
            </div>

            <!-- Right Emblem -->
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
                <path d="M 8,22 L 16,22" stroke="#000" stroke-width="1.5" />
              </g>
            </svg>
          </div>

          <!-- Metadata Rows -->
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

          <!-- Work Details Rule -->
          <div class="work-details-header">Work Details</div>

          <!-- Ruled lines -->
          <div class="ruled-lines-container">
            ${linesHtml}
          </div>

          <!-- Signatures -->
          <div class="sig-row">
            <div class="sig-col">
              <div class="sig-handwritten">${driverName !== '—' ? driverName.slice(0, 8) : ''}</div>
              <div class="sig-label">Driver Sign</div>
            </div>
            <div class="sig-col">
              <div class="sig-handwritten">${mechanicName !== '—' ? mechanicName.slice(0, 8) : ''}</div>
              <div class="sig-label">Mechanic Sign</div>
            </div>
            <div class="sig-col">
              <div class="sig-handwritten"></div>
              <div class="sig-label">Manager Sign</div>
            </div>
            <div class="sig-col">
              <div class="sig-handwritten"></div>
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

  // --------------------------------------------------------------------------
  // FILTERED DATASETS & KPIS
  // --------------------------------------------------------------------------
  const filteredMaintenance = useMemo(() => {
    let list = maintenanceList;
    if (selectedBusFilter) {
      list = list.filter(m => String(m.bus_id) === String(selectedBusFilter));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        (m.bill_no || '').toLowerCase().includes(q) ||
        (m.service_type || '').toLowerCase().includes(q) ||
        (m.workshop_name || '').toLowerCase().includes(q) ||
        (m.mechanic_name || '').toLowerCase().includes(q) ||
        getBusReg(m.bus_id).toLowerCase().includes(q) ||
        (m.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [maintenanceList, selectedBusFilter, searchQuery, buses]);

  const filteredInventory = useMemo(() => {
    let list = inventoryList;
    if (selectedCategoryFilter) {
      list = list.filter(i => i.category === selectedCategoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i =>
        (i.part_name || '').toLowerCase().includes(q) ||
        (i.part_number || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q) ||
        (i.supplier_name || '').toLowerCase().includes(q) ||
        (i.invoice_no || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [inventoryList, selectedCategoryFilter, searchQuery]);

  // Overall KPIs
  const totalMaintCost = useMemo(() => {
    return maintenanceList.reduce((acc, m) => acc + (Number(m.cost) || 0), 0);
  }, [maintenanceList]);

  const totalPartsCost = useMemo(() => {
    return maintenanceList.reduce((acc, m) => acc + (Number(m.parts_cost) || 0), 0);
  }, [maintenanceList]);

  const totalLaborCost = useMemo(() => {
    return maintenanceList.reduce((acc, m) => acc + (Number(m.labor_charges) || 0), 0);
  }, [maintenanceList]);

  const totalInventoryValuation = useMemo(() => {
    return inventoryList.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.unit_cost) || 0)), 0);
  }, [inventoryList]);

  const lowStockCount = useMemo(() => {
    return inventoryList.filter(i => Number(i.quantity) <= Number(i.min_stock_alert) && Number(i.quantity) > 0).length;
  }, [inventoryList]);

  const outOfStockCount = useMemo(() => {
    return inventoryList.filter(i => Number(i.quantity) <= 0).length;
  }, [inventoryList]);

  if (loading) {
    return <div className="loading-center"><div className="spinner" /> Loading Maintenance & Inventory...</div>;
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="page-title">{t('Fleet Maintenance & Spare Parts Billing')}</div>
          <div className="page-sub">
            {t('Complete management of vehicle servicing, spare parts store, inventory stock deduction, and billing')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {activeTab === 'maintenance' ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={openNewBillModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <MaintIcon name="plus" size={15} color="#fff" />
              <span>{t('+ New Service & Bill')}</span>
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={openNewItemModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <MaintIcon name="plus" size={15} color="#fff" />
              <span>{t('+ Add Spare Part')}</span>
            </button>
          )}
        </div>
      </div>


      <div className="page-body">
        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          background: '#ffffff',
          padding: '6px 10px',
          borderRadius: 10,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('maintenance'); setSearchQuery(''); }}
              style={{
                padding: '8px 18px',
                borderRadius: 7,
                border: 'none',
                background: activeTab === 'maintenance' ? '#1e3a8a' : 'transparent',
                color: activeTab === 'maintenance' ? '#fff' : '#475569',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <MaintIcon name="wrench" size={15} color={activeTab === 'maintenance' ? '#fff' : 'currentColor'} />
              <span>{t('Maintenance & Bills')}</span>
              <span style={{
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 10,
                background: activeTab === 'maintenance' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                color: activeTab === 'maintenance' ? '#fff' : '#64748b'
              }}>
                {maintenanceList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }}
              style={{
                padding: '8px 18px',
                borderRadius: 7,
                border: 'none',
                background: activeTab === 'inventory' ? '#1e3a8a' : 'transparent',
                color: activeTab === 'inventory' ? '#fff' : '#475569',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <MaintIcon name="box" size={15} color={activeTab === 'inventory' ? '#fff' : 'currentColor'} />
              <span>{t('Spare Parts Inventory')}</span>
              <span style={{
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 10,
                background: activeTab === 'inventory' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                color: activeTab === 'inventory' ? '#fff' : '#64748b'
              }}>
                {inventoryList.length}
              </span>
              {(lowStockCount > 0 || outOfStockCount > 0) && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: '#ef4444',
                  color: '#fff'
                }}>
                  {lowStockCount + outOfStockCount} Alert
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/job-cards')}
              style={{
                padding: '8px 18px',
                borderRadius: 7,
                border: '1.5px solid #fbcfe8',
                background: '#fdf2f8',
                color: '#be185d',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
              title="Open dedicated Bus-Wise Job Cards & Daily Reports"
            >
              <MaintIcon name="card" size={15} color="#be185d" />
              <span>📋 Bus Job Cards Directory</span>
              <span style={{
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 10,
                background: '#fce7f3',
                color: '#be185d',
                fontWeight: 800
              }}>
                {buses.length} Buses
              </span>
            </button>
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <MaintIcon name="search" size={14} color="#94a3b8" />
            </span>
            <input
              type="text"
              placeholder={activeTab === 'maintenance' ? "Search bus, bill no, mechanic..." : "Search part name, SKU, vendor..."}
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

        {/* ========================================================================= */}
        {/* TAB 1: MAINTENANCE RECORDS & BILLING                                    */}
        {/* ========================================================================= */}
        {activeTab === 'maintenance' && (
          <>
            {/* KPI Ribbon */}
            <div className="att-kpi-ribbon" style={{ marginBottom: 20 }}>
              <div className="att-kpi-card">
                <div className="att-kpi-icon att-kpi-icon--blue">
                  <MaintIcon name="wrench" size={20} color="#2563eb" />
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: '#2563eb' }}>{maintenanceList.length}</div>
                  <div className="att-kpi-label">{t('Service Records')}</div>
                  <div className="att-kpi-sub">{t('Total vehicle jobs logged')}</div>
                </div>
              </div>

              <div className="att-kpi-card">
                <div className="att-kpi-icon att-kpi-icon--purple">
                  <MaintIcon name="box" size={20} color="#7c3aed" />
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: '#7c3aed' }}>
                    ₹{totalPartsCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="att-kpi-label">{t('Spare Parts Consumed')}</div>
                  <div className="att-kpi-sub">{t('Inventory items billed to buses')}</div>
                </div>
              </div>

              <div className="att-kpi-card">
                <div className="att-kpi-icon att-kpi-icon--green">
                  <MaintIcon name="wrench" size={20} color="#16a34a" />
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: '#16a34a' }}>
                    ₹{totalLaborCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="att-kpi-label">{t('Labor & Workshop')}</div>
                  <div className="att-kpi-sub">{t('Mechanic service charges')}</div>
                </div>
              </div>

              <div className="att-kpi-card">
                <div className="att-kpi-icon att-kpi-icon--blue">
                  <span style={{ fontSize: 20 }}>💰</span>
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: '#1e3a8a', fontWeight: 800 }}>
                    ₹{totalMaintCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="att-kpi-label">{t('Total Fleet Spend')}</div>
                  <div className="att-kpi-sub">{t('Parts + Labor combined')}</div>
                </div>
              </div>
            </div>

            {/* Filter by bus selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{t('Filter by Bus:')}</span>
              <select
                className="fselect"
                value={selectedBusFilter}
                onChange={e => setSelectedBusFilter(e.target.value)}
                style={{ width: 220, height: 34, fontSize: 12.5, borderRadius: 6 }}
              >
                <option value="">All Fleet Buses</option>
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.registration_number} {b.bus_model ? `(${b.bus_model})` : ''}
                  </option>
                ))}
              </select>
              {selectedBusFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedBusFilter('')}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  ✕ Clear Filter
                </button>
              )}
            </div>

            {/* Maintenance Records Data Table */}
            <DataTable
              columns={[
                {
                  key: 'bill_no',
                  label: 'Bill / Job Card',
                  render: (val, item) => (
                    <div>
                      <span className="mono" style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 11.5, background: '#eff6ff', padding: '2px 6px', borderRadius: 4, border: '1px solid #bfdbfe' }}>
                        {val || `MN-${String(item.id).padStart(4, '0')}`}
                      </span>
                      {item.job_card_no && (
                        <div style={{ marginTop: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', padding: '1px 5px', borderRadius: 3 }}>
                            Card #{item.job_card_no}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 3 }}>
                        {item.service_date}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'bus_id',
                  label: 'Bus',
                  render: (v) => (
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', fontSize: 12 }}>
                      🚌 {getBusReg(v)}
                    </span>
                  )
                },
                {
                  key: 'service_type',
                  label: 'Work Done / Service',
                  render: (val, item) => (
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{val}</div>
                      {item.workshop_name && (
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                          📍 {item.workshop_name} {item.mechanic_name ? `(${item.mechanic_name})` : ''}
                        </div>
                      )}
                      {item.odometer && (
                        <div style={{ fontSize: 10, color: '#2563eb', marginTop: 1 }} className="mono">
                          ⏱️ {Number(item.odometer).toLocaleString('en-IN')} km
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'parts_cost',
                  label: 'Spare Parts Billed',
                  render: (val, item) => {
                    let parts = [];
                    if (item.parts_data) {
                      try {
                        parts = typeof item.parts_data === 'string' ? JSON.parse(item.parts_data) : item.parts_data;
                      } catch (e) {
                        parts = [];
                      }
                    }
                    const partsCount = Array.isArray(parts) ? parts.length : 0;
                    return (
                      <div>
                        <div style={{ fontWeight: 700, color: partsCount > 0 ? '#7c3aed' : '#94a3b8' }}>
                          ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {partsCount > 0 && (
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                            📦 {partsCount} part{partsCount === 1 ? '' : 's'} used
                          </div>
                        )}
                      </div>
                    );
                  }
                },
                {
                  key: 'labor_charges',
                  label: 'Labor (₹)',
                  render: (val) => (
                    <span style={{ fontWeight: 600, color: '#475569' }}>
                      ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                {
                  key: 'cost',
                  label: 'Grand Total Bill',
                  render: (val) => (
                    <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 13, background: '#eff6ff', padding: '3px 8px', borderRadius: 4, border: '1px solid #bfdbfe', display: 'inline-block' }}>
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
                        className="maint-btn-pink"
                        onClick={() => setViewingJobCard(item)}
                        title="View & print official TMHNU Pink Job Card"
                      >
                        📋 {t('Pink Job Card')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => printMaintenanceInvoice(item)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#1e293b',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Print official maintenance invoice"
                      >
                        <MaintIcon name="printer" size={13} color="#1e293b" />
                        <span>{t('Print Bill')}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditBillModal(item)}
                        style={{ padding: '4px 8px', fontSize: 11.5 }}
                        title="Edit record & parts"
                      >
                        {t('Edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDeleteBill(item)}
                        style={{ padding: '4px 8px', borderColor: '#fca5a5', color: '#dc2626', fontSize: 11.5 }}
                        title="Delete bill and restore stock"
                      >
                        {t('Delete')}
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredMaintenance}
              emptyIcon="🔧"
              emptyText={searchQuery ? 'No matching service records found.' : 'No maintenance jobs logged yet. Click "+ New Service & Bill" to create one!'}
            />
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SPARE PARTS INVENTORY STORE                                      */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <>
            {/* Inventory KPI Ribbon */}
            <div className="att-kpi-ribbon" style={{ marginBottom: 20 }}>
              <div className="att-kpi-card">
                <div className="att-kpi-icon att-kpi-icon--purple">
                  <MaintIcon name="box" size={20} color="#7c3aed" />
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: '#7c3aed' }}>{inventoryList.length}</div>
                  <div className="att-kpi-label">Store Products</div>
                  <div className="att-kpi-sub">Total spare parts catalog</div>
                </div>
              </div>

              <div className="att-kpi-card">
                <div className="att-kpi-icon att-kpi-icon--green">
                  <span style={{ fontSize: 20 }}>💰</span>
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: '#16a34a' }}>
                    ₹{totalInventoryValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="att-kpi-label">Stock Asset Valuation</div>
                  <div className="att-kpi-sub">Current warehouse stock value</div>
                </div>
              </div>

              <div className={`att-kpi-card ${lowStockCount > 0 ? 'att-kpi-card--warn' : ''}`}>
                <div className="att-kpi-icon att-kpi-icon--amber">
                  <MaintIcon name="alert" size={20} color="#f59e0b" />
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: lowStockCount > 0 ? '#d97706' : '#10b981' }}>
                    {lowStockCount}
                  </div>
                  <div className="att-kpi-label">Low Stock Alerts</div>
                  <div className="att-kpi-sub">{lowStockCount > 0 ? 'Below minimum threshold' : 'All stock levels healthy'}</div>
                </div>
              </div>

              <div className={`att-kpi-card ${outOfStockCount > 0 ? 'att-kpi-card--warn' : ''}`}>
                <div className="att-kpi-icon att-kpi-icon--red">
                  <MaintIcon name="alert" size={20} color="#ef4444" />
                </div>
                <div className="att-kpi-body">
                  <div className="att-kpi-val" style={{ color: outOfStockCount > 0 ? '#dc2626' : '#10b981' }}>
                    {outOfStockCount}
                  </div>
                  <div className="att-kpi-label">Out of Stock</div>
                  <div className="att-kpi-sub">{outOfStockCount > 0 ? 'Needs immediate purchase' : 'Zero depleted items'}</div>
                </div>
              </div>
            </div>

            {/* Filter by Category bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Filter by Category:</span>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('')}
                style={{
                  padding: '4px 11px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: !selectedCategoryFilter ? '#1e3a8a' : '#cbd5e1',
                  background: !selectedCategoryFilter ? '#1e3a8a' : '#fff',
                  color: !selectedCategoryFilter ? '#fff' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                All Categories ({inventoryList.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = inventoryList.filter(i => i.category === cat).length;
                if (count === 0) return null;
                const isSelected = selectedCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(isSelected ? '' : cat)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: isSelected ? '#1e3a8a' : '#cbd5e1',
                      background: isSelected ? '#1e3a8a' : '#fff',
                      color: isSelected ? '#fff' : '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{cat}</span> <span style={{ opacity: 0.8, fontSize: 11 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Inventory Table */}
            <DataTable
              columns={[
                {
                  key: 'part_name',
                  label: 'Part Name & Code',
                  render: (val, item) => (
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{val}</div>
                      {item.part_number && (
                        <span className="mono" style={{ fontSize: 10.5, color: '#2563eb', background: '#eff6ff', padding: '1px 5px', borderRadius: 4, border: '1px solid #bfdbfe' }}>
                          SKU: {item.part_number}
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'category',
                  label: 'Category',
                  render: (val) => (
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#334155'
                    }}>
                      {val || 'General Spares'}
                    </span>
                  )
                },
                {
                  key: 'quantity',
                  label: 'Available Stock',
                  render: (val, item) => {
                    const q = Number(val) || 0;
                    const min = Number(item.min_stock_alert) || 5;
                    const isOut = q <= 0;
                    const isLow = q > 0 && q <= min;

                    return (
                      <div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 800,
                          color: isOut ? '#dc2626' : (isLow ? '#d97706' : '#15803d')
                        }}>
                          <span>{q.toLocaleString('en-IN')} {item.unit || 'pcs'}</span>
                          {isOut && (
                            <span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                              Out of Stock
                            </span>
                          )}
                          {isLow && (
                            <span style={{ fontSize: 10, background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                              Low Stock (&lt;{min})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  key: 'unit_cost',
                  label: 'Unit Purchase Cost',
                  render: (val, item) => (
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span style={{ fontSize: 11, color: '#64748b' }}>/ {item.unit || 'pcs'}</span>
                    </span>
                  )
                },
                {
                  key: 'total_value',
                  label: 'Stock Asset Value',
                  render: (_, item) => {
                    const totalVal = (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
                    return (
                      <span style={{ fontWeight: 800, color: '#1e3a8a' }}>
                        ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    );
                  }
                },
                {
                  key: 'supplier_name',
                  label: 'Supplier / Invoice',
                  render: (val, item) => (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{val || '—'}</div>
                      {item.invoice_no && (
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>Bill: {item.invoice_no}</div>
                      )}
                    </div>
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
                        onClick={() => setRestockingItem({
                          id: item.id,
                          part_name: item.part_name,
                          current_qty: item.quantity,
                          unit: item.unit || 'pcs',
                          add_quantity: '',
                          new_unit_cost: item.unit_cost,
                          supplier_name: item.supplier_name || '',
                          invoice_no: '',
                          purchase_date: new Date().toISOString().slice(0, 10),
                          notes: ''
                        })}
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 11.5,
                          cursor: 'pointer'
                        }}
                        title="Add incoming shipment / purchase to stock"
                      >
                        + Restock
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setEditingItem(item)}
                        style={{ padding: '4px 8px', fontSize: 11.5 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDeleteInventoryItem(item)}
                        style={{ padding: '4px 8px', borderColor: '#fca5a5', color: '#dc2626', fontSize: 11.5 }}
                      >
                        Delete
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredInventory}
              emptyIcon="📦"
              emptyText={searchQuery ? 'No matching spare parts in store.' : 'No spare parts in store catalog yet. Click "+ Add Spare Part" to enter bolts, parts or lubricants!'}
            />
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MAINTENANCE SERVICE & SPARE PARTS BILLING SYSTEM                */}
      {/* ========================================================================= */}
      {editingBill !== null && (
        <div className="maint-modal-overlay" onClick={() => setEditingBill(null)}>
          <div
            className="maint-modal-card"
            style={{ maxWidth: 900, maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                    Bill Reference: <span className="mono" style={{ fontWeight: 800, color: '#1e3a8a' }}>{editingBill.bill_no}</span> · Vehicle servicing & inventory stock sync
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
                {/* Section 1: Vehicle & Service Particulars */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 18
                }}>
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
                        onChange={e => handleBusSelect(e.target.value)}
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
                      <label className="maint-form-label">
                        Driver Name
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="Auto-detected or enter name"
                        value={editingBill.driver_name || ''}
                        onChange={e => setEditingBill({ ...editingBill, driver_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Service Date <span className="maint-req">*</span>
                      </label>
                      <input
                        type="date"
                        className="maint-input-field"
                        required
                        value={editingBill.service_date}
                        onChange={e => setEditingBill({ ...editingBill, service_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Odometer at Service (km)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="maint-input-field"
                        placeholder="e.g. 327363"
                        value={editingBill.odometer || ''}
                        onChange={e => setEditingBill({ ...editingBill, odometer: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Mechanic / Technician Name
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="e.g. K. Murugesan"
                        value={editingBill.mechanic_name || ''}
                        onChange={e => setEditingBill({ ...editingBill, mechanic_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Mileage (kmpl)
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="e.g. 4.6"
                        value={editingBill.mileage || ''}
                        onChange={e => setEditingBill({ ...editingBill, mileage: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Lamp (Count)
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="e.g. 2"
                        value={editingBill.lamp || ''}
                        onChange={e => setEditingBill({ ...editingBill, lamp: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        S.No
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="e.g. 6"
                        value={editingBill.serial_no || ''}
                        onChange={e => setEditingBill({ ...editingBill, serial_no: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Next Service Due Date
                      </label>
                      <input
                        type="date"
                        className="maint-input-field"
                        value={editingBill.next_due_date || ''}
                        onChange={e => setEditingBill({ ...editingBill, next_due_date: e.target.value })}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="maint-form-label">
                        Work Done / Service Description <span className="maint-req">*</span>
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        required
                        placeholder="e.g. Full Oil Service + Brake Overhaul + Front Wheel Hub Bolt Replacement"
                        value={editingBill.service_type}
                        onChange={e => setEditingBill({ ...editingBill, service_type: e.target.value })}
                        style={{ fontWeight: 600 }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="maint-form-label">
                        Workshop / Garage Name
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        value={editingBill.workshop_name}
                        onChange={e => setEditingBill({ ...editingBill, workshop_name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Interactive Spare Parts Billing (Itemizer) */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 18
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MaintIcon name="box" size={17} color="#2563eb" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                        2. Spare Parts Billed / Consumed From Store
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '2px 8px',
                        borderRadius: 12
                      }}>
                        {editingBill.parts_data.length} item{editingBill.parts_data.length === 1 ? '' : 's'}
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MaintIcon name="plus" size={14} color="#1d4ed8" />
                      <span>+ Add Spare Part</span>
                    </button>
                  </div>

                  {editingBill.parts_data.length === 0 ? (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      border: '1.5px dashed #cbd5e1',
                      borderRadius: 10,
                      color: '#64748b'
                    }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>🔩 📦 🛢️</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>No spare parts added to this bill yet</div>
                      <div style={{ fontSize: 11.5, marginTop: 4 }}>
                        Click <b>"+ Add Spare Part"</b> above to choose bolts, lubricants, filters or brake sets from inventory.
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'visible' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, overflow: 'visible' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                            <th style={{ padding: '9px 12px', fontSize: 11, textAlign: 'left', fontWeight: 700, color: '#475569', width: '38%' }}>SELECT SPARE PART</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, textAlign: 'center', fontWeight: 700, color: '#475569', width: '14%' }}>STOCK AVAILABLE</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, textAlign: 'center', fontWeight: 700, color: '#475569', width: '14%' }}>QUANTITY</th>
                            <th style={{ padding: '9px 12px', fontSize: 11, textAlign: 'right', fontWeight: 700, color: '#475569', width: '16%' }}>UNIT COST (₹)</th>
                            <th style={{ padding: '9px 12px', fontSize: 11, textAlign: 'right', fontWeight: 700, color: '#475569', width: '14%' }}>LINE TOTAL (₹)</th>
                            <th style={{ width: 34 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingBill.parts_data.map((partItem, idx) => {
                            const invMatch = inventoryList.find(p => String(p.id) === String(partItem.part_id));
                            const currentStock = invMatch ? Number(invMatch.quantity) : (partItem.available_stock || 0);
                            const isOverStock = Number(partItem.quantity) > currentStock && !editingBill.id;

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', minWidth: 260, position: 'relative' }}>
                                  <SparePartSearchSelect
                                    value={partItem.part_id}
                                    onChange={val => handleBillPartChange(idx, 'part_id', val)}
                                    inventoryList={inventoryList}
                                  />
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <span style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: currentStock > 0 ? '#15803d' : '#dc2626',
                                    background: currentStock > 0 ? '#dcfce7' : '#fee2e2',
                                    padding: '3px 9px',
                                    borderRadius: 12,
                                    display: 'inline-block'
                                  }}>
                                    {currentStock} {partItem.unit || 'pcs'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    required
                                    className="maint-input-field"
                                    value={partItem.quantity}
                                    onChange={e => handleBillPartChange(idx, 'quantity', e.target.value)}
                                    style={{
                                      width: 80,
                                      height: 36,
                                      textAlign: 'center',
                                      borderColor: isOverStock ? '#ef4444' : '#e2e8f0',
                                      fontWeight: 700
                                    }}
                                  />
                                  {isOverStock && (
                                    <div style={{ fontSize: 9.5, color: '#dc2626', marginTop: 2, fontWeight: 700 }}>
                                      Exceeds stock!
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className="maint-input-field"
                                    value={partItem.unit_cost}
                                    onChange={e => handleBillPartChange(idx, 'unit_cost', e.target.value)}
                                    style={{
                                      width: 100,
                                      height: 36,
                                      textAlign: 'right',
                                      fontWeight: 600
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a', fontSize: 13 }}>
                                  ₹{Number(partItem.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePartFromBill(idx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      fontSize: 16,
                                      padding: 4,
                                      borderRadius: 4,
                                      transition: 'color 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                    title="Remove part"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                          Spare Parts Subtotal:
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1e3a8a' }}>
                          ₹{Number(editingBill.parts_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Labor & Grand Total Bill Computation */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 10
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <label className="maint-form-label">
                        Labor & Workshop Service Charges
                      </label>
                      <div className="maint-currency-group">
                        <span className="maint-currency-prefix">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="maint-currency-input"
                          value={editingBill.labor_charges}
                          onChange={e => handleLaborChange(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="maint-form-label">
                        Technician Remarks / Service Notes
                      </label>
                      <input
                        type="text"
                        className="maint-input-field"
                        placeholder="Additional remarks, fitment notes, torque check..."
                        value={editingBill.notes}
                        onChange={e => setEditingBill({ ...editingBill, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Grand Total POS Invoice Ribbon */}
                  <div style={{
                    marginTop: 16,
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ fontSize: 13, color: '#1e3a8a', fontWeight: 600 }}>
                      Parts Total: <b style={{ color: '#0f172a' }}>₹{Number(editingBill.parts_cost || 0).toFixed(2)}</b> + Labor: <b style={{ color: '#0f172a' }}>₹{Number(editingBill.labor_charges || 0).toFixed(2)}</b>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Grand Total Bill:
                      </span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        ₹{Number(editingBill.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  <span>{editingBill.id ? 'Save & Update Bill' : 'Confirm & Save Bill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT INVENTORY SPARE PART                                 */}
      {/* ========================================================================= */}
      {editingItem !== null && (
        <div className="maint-modal-overlay" onClick={() => setEditingItem(null)}>
          <div
            className="maint-modal-card"
            style={{ maxWidth: 580 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="maint-modal-header">
              <div className="maint-header-left">
                <div className="maint-avatar-icon maint-avatar--blue">
                  <MaintIcon name="box" size={22} color="#2563eb" />
                </div>
                <div>
                  <h3 className="maint-header-title">
                    {editingItem.id ? 'Edit Spare Part' : 'Add New Spare Part / Product to Store'}
                  </h3>
                  <div className="maint-header-sub">
                    Configure part specifications, category, unit rate, and minimum stock threshold
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="maint-close-btn"
                onClick={() => setEditingItem(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInventoryItem} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="maint-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label className="maint-form-label">
                      Part Name / Description <span className="maint-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="maint-input-field"
                      required
                      placeholder="e.g. Wheel Hub Bolt M16"
                      value={editingItem.part_name}
                      onChange={e => setEditingItem({ ...editingItem, part_name: e.target.value })}
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label className="maint-form-label">
                      Part Number / SKU
                    </label>
                    <input
                      type="text"
                      className="maint-input-field"
                      placeholder="e.g. BLT-16-01"
                      value={editingItem.part_number}
                      onChange={e => setEditingItem({ ...editingItem, part_number: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label className="maint-form-label">
                      Category
                    </label>
                    <select
                      className="maint-input-field"
                      value={editingItem.category}
                      onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="maint-form-label">
                      Unit of Measurement
                    </label>
                    <select
                      className="maint-input-field"
                      value={editingItem.unit}
                      onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="maint-form-label">
                      Unit Cost <span className="maint-req">*</span>
                    </label>
                    <div className="maint-currency-group">
                      <span className="maint-currency-prefix">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="maint-currency-input"
                        placeholder="45.00"
                        value={editingItem.unit_cost}
                        onChange={e => setEditingItem({ ...editingItem, unit_cost: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="maint-form-label">
                      {editingItem.id ? 'Current Stock' : 'Initial Stock'} <span className="maint-req">*</span>
                    </label>
                    <div className="maint-qty-group">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        className="maint-qty-input"
                        placeholder="50"
                        value={editingItem.quantity}
                        onChange={e => setEditingItem({ ...editingItem, quantity: e.target.value })}
                      />
                      <span className="maint-qty-suffix">{editingItem.unit || 'pcs'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="maint-form-label">
                      Low Alert Level
                    </label>
                    <div className="maint-qty-group">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="maint-qty-input"
                        placeholder="5"
                        value={editingItem.min_stock_alert}
                        onChange={e => setEditingItem({ ...editingItem, min_stock_alert: e.target.value })}
                      />
                      <span className="maint-qty-suffix">{editingItem.unit || 'pcs'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                  <div>
                    <label className="maint-form-label">
                      Supplier / Vendor Name
                    </label>
                    <input
                      type="text"
                      className="maint-input-field"
                      placeholder="e.g. Sri Murugan Auto Spares"
                      value={editingItem.supplier_name}
                      onChange={e => setEditingItem({ ...editingItem, supplier_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="maint-form-label">
                      Purchase Bill / Invoice No
                    </label>
                    <input
                      type="text"
                      className="maint-input-field"
                      placeholder="e.g. INV-2026-442"
                      value={editingItem.invoice_no}
                      onChange={e => setEditingItem({ ...editingItem, invoice_no: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="maint-modal-footer">
                <button
                  type="button"
                  className="maint-btn-cancel"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="maint-btn-primary"
                >
                  <MaintIcon name="check" size={16} color="#fff" />
                  <span>{editingItem.id ? 'Update Part' : 'Save to Inventory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK RESTOCK MODAL (RECORD PURCHASE SHIPMENT)                  */}
      {/* ========================================================================= */}
      {restockingItem !== null && (
        <div className="maint-modal-overlay" onClick={() => setRestockingItem(null)}>
          <div
            className="maint-modal-card"
            style={{ maxWidth: 500 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="maint-modal-header">
              <div className="maint-header-left">
                <div className="maint-avatar-icon maint-avatar--green">
                  <MaintIcon name="refresh" size={22} color="#059669" />
                </div>
                <div>
                  <h3 className="maint-header-title">
                    Record Incoming Purchase / Restock
                  </h3>
                  <div className="maint-header-sub">
                    Receive new stock shipment for <strong style={{ color: '#0f172a' }}>{restockingItem.part_name}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="maint-close-btn"
                onClick={() => setRestockingItem(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="maint-modal-body">
                {/* Stock Status & Live Computation Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Current Stock in Store
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                        {restockingItem.part_name} {restockingItem.part_number ? `(${restockingItem.part_number})` : ''}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#15803d',
                      background: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: 8,
                      border: '1px solid #bbf7d0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      {Number(restockingItem.current_qty).toFixed(2)} {restockingItem.unit}
                    </div>
                  </div>

                  {Number(restockingItem.add_quantity) > 0 && (
                    <div style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px dashed #bbf7d0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      color: '#166534'
                    }}>
                      <span>New Projected Stock:</span>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>
                        {(Number(restockingItem.current_qty) + Number(restockingItem.add_quantity)).toFixed(2)} {restockingItem.unit}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="maint-form-label">
                      Quantity to Add <span className="maint-req">*</span>
                    </label>
                    <div className="maint-qty-group">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        required
                        autoFocus
                        placeholder="e.g. 50"
                        className="maint-qty-input"
                        value={restockingItem.add_quantity}
                        onChange={e => setRestockingItem({ ...restockingItem, add_quantity: e.target.value })}
                      />
                      <span className="maint-qty-suffix">{restockingItem.unit || 'pcs'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="maint-form-label">
                      Unit Purchase Cost
                    </label>
                    <div className="maint-currency-group">
                      <span className="maint-currency-prefix">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="45.00"
                        className="maint-currency-input"
                        value={restockingItem.new_unit_cost}
                        onChange={e => setRestockingItem({ ...restockingItem, new_unit_cost: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="maint-form-label">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    className="maint-input-field"
                    placeholder="e.g. Sri Murugan Auto Spares"
                    value={restockingItem.supplier_name}
                    onChange={e => setRestockingItem({ ...restockingItem, supplier_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="maint-form-label">
                      Invoice / Bill No
                    </label>
                    <input
                      type="text"
                      className="maint-input-field"
                      placeholder="e.g. INV-9901"
                      value={restockingItem.invoice_no}
                      onChange={e => setRestockingItem({ ...restockingItem, invoice_no: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="maint-form-label">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      className="maint-input-field"
                      value={restockingItem.purchase_date}
                      onChange={e => setRestockingItem({ ...restockingItem, purchase_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="maint-modal-footer">
                <button
                  type="button"
                  className="maint-btn-cancel"
                  onClick={() => setRestockingItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="maint-btn-emerald"
                >
                  <MaintIcon name="check" size={16} color="#fff" />
                  <span>Confirm Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: AUTHENTIC TMHNU PINK JOB CARD PREVIEW & DUAL PRINT              */}
      {/* ========================================================================= */}
      {viewingJobCard !== null && (() => {
        const item = viewingJobCard;
        const bus = buses.find(b => String(b.id) === String(item.bus_id));
        let parts = [];
        if (item.parts_data) {
          try {
            parts = typeof item.parts_data === 'string' ? JSON.parse(item.parts_data) : item.parts_data;
          } catch (e) {
            parts = [];
          }
        }
        const regNo = bus?.registration_number || getBusReg(item.bus_id);
        const shortVehicleNo = (regNo && regNo.replace(/[^0-9]/g, '').slice(-4)) || regNo || '4685';

        let formattedDate = item.service_date || '';
        if (formattedDate.includes('-')) {
          const partsDate = formattedDate.split('-');
          if (partsDate.length === 3) {
            formattedDate = `${parseInt(partsDate[2], 10)}.${parseInt(partsDate[1], 10)}.${partsDate[0].slice(-2)}`;
          }
        }
        const jobCardNum = item.job_card_no || item.bill_no?.split('-').pop() || '1277';
        const driverName = item.driver_name || '—';
        const mechanicName = item.mechanic_name || '—';
        const odometerVal = item.odometer ? String(item.odometer) : '—';
        const lampVal = item.lamp || '2';
        const mileageVal = item.mileage || '4.6';
        const sNoVal = item.serial_no || '6';

        const lines = [];
        if (item.service_type) lines.push(item.service_type);
        lines.push('');
        if (Array.isArray(parts)) {
          parts.forEach(p => {
            if (p.part_name) lines.push(`${p.part_name} - ${p.quantity} ${p.unit || ''}`);
          });
        }
        while (lines.length < 13) {
          lines.push('');
        }

        return (
          <div className="maint-modal-overlay" onClick={() => setViewingJobCard(null)}>
            <div
              className="maint-modal-card"
              style={{ maxWidth: 640, maxHeight: '94vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
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
                      Slip No: <b style={{ fontFamily: 'monospace', color: '#be185d', fontSize: 13 }}>#{jobCardNum}</b> · Bus: <b style={{ color: '#0f172a' }}>{regNo}</b>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="maint-btn-pink"
                    onClick={() => printTMHNUJobCard(item, true)}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    title="Print authentic colored pink slip on standard paper"
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

              {/* Body: Authentic Job Card Replica */}
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
                    {/* Left Seal */}
                    <svg width="60" height="60" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#000" strokeWidth="2.5" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="#000" strokeWidth="1.5" />
                      <path id="modalLeftTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
                      <path id="modalLeftBot" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
                      <text fontFamily="'Times New Roman', serif" fontSize="7.5" fontWeight="bold" fill="#000">
                        <textPath href="#modalLeftTop" startOffset="50%" textAnchor="middle">T.M.H.N.U.</textPath>
                      </text>
                      <text fontFamily="'Times New Roman', serif" fontSize="6.2" fontWeight="bold" fill="#000">
                        <textPath href="#modalLeftBot" startOffset="50%" textAnchor="middle">VEHICLE MAINTENANCE</textPath>
                      </text>
                      <g transform="translate(37, 36) scale(1.1)">
                        <rect x="2" y="2" width="20" height="15" rx="3" fill="none" stroke="#000" strokeWidth="1.8" />
                        <line x1="2" y1="8" x2="22" y2="8" stroke="#000" strokeWidth="1.2" />
                        <circle cx="7" cy="18" r="2" fill="#000" />
                        <circle cx="17" cy="18" r="2" fill="#000" />
                        <rect x="5" y="4" width="4" height="3" fill="#000" />
                        <rect x="15" y="4" width="4" height="3" fill="#000" />
                        <line x1="6" y1="12" x2="18" y2="12" stroke="#000" strokeWidth="1.2" />
                      </g>
                    </svg>

                    {/* Center Text */}
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

                    {/* Right Seal */}
                    <svg width="60" height="60" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#000" strokeWidth="2.5" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,2" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="#000" strokeWidth="1.5" />
                      <path id="modalRightTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
                      <path id="modalRightBot" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
                      <text fontFamily="'Times New Roman', serif" fontSize="7.5" fontWeight="bold" fill="#000">
                        <textPath href="#modalRightTop" startOffset="50%" textAnchor="middle">T.M.H.N.U.</textPath>
                      </text>
                      <text fontFamily="'Times New Roman', serif" fontSize="7.5" fontWeight="bold" fill="#000">
                        <textPath href="#modalRightBot" startOffset="50%" textAnchor="middle">THENI</textPath>
                      </text>
                      <g transform="translate(37, 36) scale(1.1)">
                        <circle cx="12" cy="8" r="6" fill="none" stroke="#000" strokeWidth="1.8" />
                        <path d="M 4,22 C 4,16 8,15 12,15 C 16,15 20,16 20,22" fill="none" stroke="#000" strokeWidth="1.8" />
                        <circle cx="12" cy="7" r="1.5" fill="#000" />
                        <path d="M 8,22 L 16,22" stroke="#000" strokeWidth="1.5" />
                      </g>
                    </svg>
                  </div>

                  {/* Metadata Rows */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, fontWeight: 'bold', marginBottom: 5 }}>
                    <div>
                      Job card No <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 17, fontWeight: 900, letterSpacing: 2, marginLeft: 2 }}>{jobCardNum}</span>
                    </div>
                    <div>
                      Date : <span style={{ fontWeight: 700 }}>{formattedDate}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, fontWeight: 'bold', marginBottom: 5 }}>
                    <div>
                      Driver Name : <span style={{ fontWeight: 700 }}>{driverName}</span>
                    </div>
                    <div>
                      Vehicle No : <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>{shortVehicleNo}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, fontWeight: 'bold', marginBottom: 5 }}>
                    <div>
                      Mechanic Name : <span style={{ fontWeight: 700 }}>{mechanicName}</span>
                    </div>
                    <div>
                      km : <span style={{ fontWeight: 900 }}>{odometerVal}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, fontWeight: 'bold', marginBottom: 3 }}>
                    <div>Lamp : ( {lampVal} ) ,</div>
                    <div>Mileage : ${mileageVal} ,</div>
                    <div>S.No : ( {sNoVal} )</div>
                  </div>

                  {/* Work Details Rule */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: 13.5,
                    fontWeight: 'bold',
                    borderTop: '1.5px solid #000',
                    borderBottom: '1px solid #4a6b82',
                    padding: '3px 0 2px 0',
                    marginTop: 4
                  }}>
                    Work Details
                  </div>

                  {/* Ruled Lines */}
                  <div>
                    {lines.map((text, idx) => (
                      <div
                        key={idx}
                        style={{
                          height: 28,
                          borderBottom: '1.2px solid #4a6b82',
                          display: 'flex',
                          alignItems: 'flex-end',
                          paddingBottom: 2,
                          paddingLeft: 10
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Signatures */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: 24,
                    padding: '0 4px 6px 4px'
                  }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ height: 22, fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: 15, color: '#1e3a8a' }}>
                        {driverName !== '—' ? driverName.slice(0, 8) : ''}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2, marginTop: 3 }}>
                        Driver Sign
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ height: 22, fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: 15, color: '#1e3a8a' }}>
                        {mechanicName !== '—' ? mechanicName.slice(0, 8) : ''}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2, marginTop: 3 }}>
                        Mechanic Sign
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ height: 22 }}></div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2, marginTop: 3 }}>
                        Manager Sign
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ height: 22 }}></div>
                      <div style={{ fontSize: 11.5, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 2, marginTop: 3 }}>
                        Secretary Sign
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
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
                  onClick={() => printTMHNUJobCard(item, false)}
                  style={{ fontWeight: 600, fontSize: 12.5 }}
                  title="Print black ink on physical pink stationery paper loaded into printer"
                >
                  📄 Print for Pink Stationery
                </button>
                <button
                  type="button"
                  className="maint-btn-pink"
                  onClick={() => printTMHNUJobCard(item, true)}
                  style={{ padding: '9px 18px', fontSize: 13 }}
                >
                  <MaintIcon name="printer" size={15} color="#be185d" />
                  <span>Print Authentic Pink Slip</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
