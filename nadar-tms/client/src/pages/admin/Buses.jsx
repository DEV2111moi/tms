import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

export default function Buses() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  
  // Breakdown & Substitution Modal state
  const [breakdownModal, setBreakdownModal] = useState(null);
  const [savingSub, setSavingSub] = useState(false);

  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const load = (inst, dateVal = selectedDate) => {
    setLoading(true);
    const filter = (inst && inst !== 'all') 
      ? { institution_id: inst, date: dateVal } 
      : { institution_id: 'all', date: dateVal };

    api.listRes('buses', filter).then(d => {
      setItems(d.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r || {})).catch(() => {});
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'all';
    setInstFilter(initialInst);
    load(initialInst, selectedDate);
  }, []);

  const handleInstChange = (v) => { 
    setInstFilter(v); 
    load(v, selectedDate); 
  };

  const handleDateChange = (d) => {
    setSelectedDate(d);
    load(instFilter, d);
  };

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
    toast(id ? 'Saved' : 'Added');
    load(instFilter, selectedDate);
  };

  const handleDel = async (item) => { 
    if (!confirm('Delete this bus?')) return; 
    await api.delRes('buses', item.id); 
    toast('Deleted'); 
    load(instFilter, selectedDate); 
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

  // Open breakdown / substitute modal
  const openBreakdownModal = (bus) => {
    const primaryRouteId = (bus.assigned_route_ids && bus.assigned_route_ids.split(',')[0]) || bus.route_id || '';
    const origDriverInfo = getBusDriverInfo(bus.id);
    setBreakdownModal({
      bus,
      sub_date: selectedDate,
      original_bus_id: bus.id,
      route_id: primaryRouteId,
      original_driver_id: origDriverInfo.id || bus.current_driver_id || '',
      substitute_bus_id: bus.substitute_bus_id || '',
      substitute_driver_id: bus.substitute_driver_id || origDriverInfo.id || '',
      shifts: bus.breakdown_shifts || 'all',
      reason: bus.breakdown_reason || 'Engine breakdown',
      notes: bus.breakdown_notes || ''
    });
  };

  // Save breakdown & substitute assignment
  const handleSaveSubstitution = async (e) => {
    e.preventDefault();
    if (!breakdownModal.substitute_bus_id) {
      toast('Please select a substitute / alternate bus.');
      return;
    }
    setSavingSub(true);
    try {
      await api.createSubstitution({
        sub_date: breakdownModal.sub_date,
        original_bus_id: breakdownModal.original_bus_id,
        route_id: breakdownModal.route_id || null,
        original_driver_id: breakdownModal.original_driver_id || null,
        substitute_bus_id: breakdownModal.substitute_bus_id,
        substitute_driver_id: breakdownModal.substitute_driver_id || null,
        shifts: breakdownModal.shifts || 'all',
        reason: breakdownModal.reason || 'Breakdown',
        is_extra_trip: 0,
        notes: breakdownModal.notes || ''
      });
      toast(`Bus ${breakdownModal.bus.registration_number} marked as breakdown. Alternate bus dispatched.`);
      setBreakdownModal(null);
      load(instFilter, selectedDate);
    } catch (err) {
      toast(err.message || 'Could not save substitution');
    } finally {
      setSavingSub(false);
    }
  };

  // Resolve breakdown and restore original bus
  const handleResolveBreakdown = async (subId, busNumber) => {
    if (!confirm(`Is bus ${busNumber} ready to return to its regular route?`)) return;
    try {
      await api.resolveSubstitution(subId);
      toast(`✅ Bus ${busNumber} is ready! Successfully restored to its original route.`);
      load(instFilter, selectedDate);
    } catch (err) {
      toast(err.message || 'Could not resolve breakdown');
    }
  };

  // Table Columns
  const COLUMNS = useMemo(() => [
    { 
      key: 'registration_number', 
      label: 'Reg. Number', 
      render: (v) => (
        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{v}</span>
      )
    },
    { 
      key: 'assigned_route_code', 
      label: 'Assigned Route', 
      render: (v) => (
        <span className="mono" style={{ fontWeight: 600 }}>{v || '—'}</span>
      )
    },
    { 
      key: 'driver_name', 
      label: 'Driver Name', 
      render: (v) => v && v !== '—' ? (
        <span style={{ fontWeight: 600, color: 'var(--navy-2, #1e293b)' }}>{v}</span>
      ) : (
        <span style={{ color: 'var(--text-dim, #94a3b8)' }}>—</span>
      )
    },
    { key: 'bus_model', label: 'Model' },
    { key: 'capacity', label: 'Seats', mono: true },
    { 
      key: 'status', 
      label: 'Status', 
      render: (v, item) => item.is_breakdown ? (
        <span className="tag" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700, border: '1px solid #fecaca' }}>
          breakdown
        </span>
      ) : (
        <span className={`tag ${v === 'active' ? 'tag--ok' : v === 'repair' ? 'tag--warn' : 'tag--off'}`}>{v || '—'}</span>
      )
    },
    { key: 'fc_expiry', label: 'FC Expiry', date: true },
    { key: 'insurance_expiry', label: 'Insurance Expiry', date: true },
  ], []);

  // Filter items by search query
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (item.registration_number || '').toLowerCase().includes(query) ||
      (item.assigned_route_code || '').toLowerCase().includes(query) ||
      (item.assigned_route_name || '').toLowerCase().includes(query) ||
      (item.driver_name || '').toLowerCase().includes(query) ||
      (item.substitute_bus_number || '').toLowerCase().includes(query) ||
      (item.substitute_driver_name || '').toLowerCase().includes(query) ||
      (item.bus_model || '').toLowerCase().includes(query) ||
      (item.bus_name || '').toLowerCase().includes(query) ||
      (item.bus_code || '').toLowerCase().includes(query)
    );
  });



  const breakdownCount = items.filter(i => i.is_breakdown).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Buses</div>
          <div className="page-sub">
            {filteredItems.length} bus(es) {breakdownCount > 0 ? `· 🚨 ${breakdownCount} active incident(s)` : ''}
          </div>
        </div>
        {canEdit && <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>+ Add Bus</button>}
      </div>

      <div className="page-body">
        {/* Breakdown Alert Banner */}
        {breakdownCount > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '1.5px solid #f87171',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#991b1b',
            fontWeight: 600,
            fontSize: 13
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <span>
                <b>{breakdownCount} bus(es)</b> reported broken down on <b>{selectedDate}</b>. Substitute buses are dispatched and marked with extra trips below.
              </span>
            </div>
            <span style={{ fontSize: 12, background: '#fee2e2', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              Live Daily Substitution Active
            </span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          {/* Instant Search Bar */}
          <input
            type="text"
            className="fselect"
            placeholder="🔍 Search registration, route, driver, model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: 300 }}
          />

          {/* Date Picker (Daily Basis) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>📅 Date:</span>
            <input
              type="date"
              className="finput"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              style={{ height: 28, padding: '2px 6px', fontSize: 12, border: 'none', background: 'transparent', fontWeight: 600 }}
            />
          </div>

          {/* Campus Filter */}
          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => handleInstChange(e.target.value)}
              style={{ maxWidth: 280, fontWeight: 600 }}
            >
              <option value="all">All Fleet Buses</option>
              {refs.institutions.map(i => (
                <option key={i.id} value={String(i.id)}>
                  {i.short_name || i.name} {String(i.id) === String(user?.institution_id) ? '(My Campus)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Buses Table */}
        <DataTable
          columns={COLUMNS}
          data={filteredItems}
          onEdit={canEdit ? setEditing : undefined}
          onDelete={canEdit ? handleDel : undefined}
          emptyIcon="🚌"
          emptyText="No buses found."
        />
      </div>

      {/* Standard Bus Profile Modal (Admin only) */}
      {editing !== null && (
        <FormModal
          title="Bus"
          fields={FIELDS}
          initial={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          refs={refs}
        />
      )}

      {/* Daily Breakdown & Substitute Assignment Modal */}
      {breakdownModal && (
        <div className="modal-backdrop" style={{
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
          padding: 16
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: 540,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            padding: 0
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#991b1b',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  🚨 Report Bus Breakdown & Assign Substitute
                </h3>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                  Daily emergency assignment for route continuation
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownModal(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSubstitution} style={{ padding: '20px' }}>
              {/* Breakdown Bus Info Banner */}
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Breakdown Bus: <strong style={{ color: '#b91c1c' }}>{breakdownModal.bus.registration_number}</strong></span>
                  <span>Route: <strong>{breakdownModal.bus.assigned_route_code || '—'}</strong></span>
                </div>
                <div style={{ color: '#475569', fontSize: 12 }}>
                  Current Driver: <b>{breakdownModal.bus.driver_name || '—'}</b>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="flabel"><span>Date</span></label>
                  <input
                    type="date"
                    className="finput"
                    value={breakdownModal.sub_date}
                    onChange={e => setBreakdownModal({ ...breakdownModal, sub_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="flabel"><span>Breakdown Issue</span></label>
                  <select
                    className="fselect"
                    value={breakdownModal.reason}
                    onChange={e => setBreakdownModal({ ...breakdownModal, reason: e.target.value })}
                  >
                    <option value="Engine breakdown">Engine breakdown</option>
                    <option value="Puncture / Tyre burst">Puncture / Tyre burst</option>
                    <option value="Accident / Collision">Accident / Collision</option>
                    <option value="Mechanical / Gear failure">Mechanical / Gear failure</option>
                    <option value="AC / Electrical failure">AC / Electrical failure</option>
                    <option value="Routine repair / Maintenance">Routine repair / Maintenance</option>
                    <option value="Other emergency issue">Other emergency issue</option>
                  </select>
                </div>
              </div>

              {/* Substitute Bus Selection */}
              <div style={{ marginBottom: 12 }}>
                <label className="flabel">
                  <span style={{ fontWeight: 700, color: '#0369a1' }}>👉 Select Alternate / Replacement Bus: *</span>
                </label>
                <select
                  className="fselect"
                  value={breakdownModal.substitute_bus_id}
                  onChange={e => {
                    const chosenBusId = e.target.value;
                    const subDriver = getBusDriverInfo(chosenBusId);
                    const origDriver = getBusDriverInfo(breakdownModal.original_bus_id);
                    const defaultDriverId = subDriver.id || origDriver.id || breakdownModal.original_driver_id || '';

                    setBreakdownModal(prev => ({
                      ...prev,
                      substitute_bus_id: chosenBusId,
                      substitute_driver_id: defaultDriverId
                    }));
                  }}
                  required
                  style={{ border: '2px solid #0284c7', background: '#f0f9ff', fontWeight: 600 }}
                >
                  <option value="">-- Choose available substitute bus --</option>
                  {items
                    .filter(b => b.id !== breakdownModal.original_bus_id && !b.is_breakdown)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.registration_number} ({b.bus_model || 'Bus'}, Seats: {b.capacity}) {b.assigned_route_code ? `· Normally ${b.assigned_route_code}` : '· (Spare Bus)'} {b.driver_name && b.driver_name !== '—' ? `· Driver: ${b.driver_name}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Substitute Driver Selection with Prioritized Order */}
              {(() => {
                const selectedSubBus = items.find(b => String(b.id) === String(breakdownModal.substitute_bus_id));
                const subDriverInfo = getBusDriverInfo(breakdownModal.substitute_bus_id);
                const origDriverInfo = getBusDriverInfo(breakdownModal.original_bus_id);

                const selectedBusDriverId = subDriverInfo.id;
                const selectedBusDriverName = subDriverInfo.name;

                const origDriverId = origDriverInfo.id || breakdownModal.original_driver_id;
                const origDriverName = origDriverInfo.name || breakdownModal.bus?.driver_name || null;

                const otherDrivers = (refs.drivers || []).filter(d => 
                  String(d.id) !== String(selectedBusDriverId) && 
                  String(d.id) !== String(origDriverId)
                );

                return (
                  <div style={{ marginBottom: 12 }}>
                    <label className="flabel">
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>Driver Operating Alternate Bus:</span>
                    </label>
                    <select
                      className="fselect"
                      value={breakdownModal.substitute_driver_id}
                      onChange={e => {
                        setBreakdownModal(prev => ({
                          ...prev,
                          substitute_driver_id: e.target.value
                        }));
                      }}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="">-- Select Driver --</option>

                      {/* 1. Selected Bus Driver (Top in order) */}
                      {selectedBusDriverId && selectedBusDriverName && (
                        <option value={selectedBusDriverId} style={{ fontWeight: 'bold', color: '#1d4ed8', background: '#eff6ff' }}>
                          ⭐ {selectedBusDriverName} (Driver of Alternate Bus - {selectedSubBus?.registration_number || 'Selected Bus'})
                        </option>
                      )}

                      {/* 2. Original Bus Driver (Second in order) */}
                      {origDriverId && origDriverName && String(origDriverId) !== String(selectedBusDriverId) && (
                        <option value={origDriverId} style={{ fontWeight: 'bold', color: '#b45309', background: '#fefce8' }}>
                          🔄 {origDriverName} (Original Driver of Breakdown Bus - {breakdownModal.bus?.registration_number || 'Breakdown Bus'})
                        </option>
                      )}

                      {/* 3. All Other Drivers */}
                      {otherDrivers.length > 0 && (
                        <optgroup label="──────── All Other Drivers ────────">
                          {otherDrivers.map(d => (
                            <option key={d.id} value={d.id}>
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
                  placeholder="e.g. Broken down near bypass, towed to garage."
                  value={breakdownModal.notes}
                  onChange={e => setBreakdownModal({ ...breakdownModal, notes: e.target.value })}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setBreakdownModal(null)}
                  disabled={savingSub}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#b91c1c', borderColor: '#991b1b' }}
                  disabled={savingSub}
                >
                  {savingSub ? 'Saving...' : '🚨 Confirm Breakdown & Dispatch Sub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const FIELDS = [
  { key: 'registration_number', label: 'Registration Number', required: true },
  { key: 'bus_model', label: 'Bus Model' },
  { key: 'capacity', label: 'Capacity (seats)', type: 'number', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'repair'] },
  { key: 'route_id', label: 'Route', type: 'route' },
  { key: 'institution_id', label: 'Institution', type: 'instref' },
  { key: 'bus_code', label: 'Bus Code' },
  { key: 'bus_name', label: 'Bus Name' },
  { key: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['bus', 'mini_bus', 'van'] },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'manufacturing_year', label: 'Year of Manufacture', type: 'number' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['diesel', 'petrol', 'cng', 'electric'] },
  { key: 'chassis_no', label: 'Chassis No.' },
  { key: 'engine_no', label: 'Engine No.' },
  { key: 'insurance_no', label: 'Insurance No.' },
  { key: 'insurance_company', label: 'Insurance Company' },
  { key: 'insurance_expiry', label: 'Insurance Expiry', type: 'date' },
  { key: 'permit_no', label: 'Permit No.' },
  { key: 'permit_type', label: 'Permit Type' },
  { key: 'permit_expiry', label: 'Permit Expiry', type: 'date' },
  { key: 'fc_number', label: 'FC Number' },
  { key: 'fc_expiry', label: 'FC Expiry', type: 'date' },
  { key: 'puc_expiry', label: 'PUC Expiry', type: 'date' },
  { key: 'gps_device_id', label: 'GPS Device ID' },
  { key: 'gps_enabled', label: 'GPS Enabled', type: 'bool' },
  { key: 'current_odometer_km', label: 'Odometer (km)', type: 'number' },
  { key: 'ownership_type', label: 'Ownership', type: 'select', options: ['owned', 'leased', 'contract'] },
];
