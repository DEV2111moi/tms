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

function SearchableSelect({ label, value, options, onChange, placeholder = "Search...", emptyText = "—" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0); // 0 is emptyText, 1+ are filteredOptions
  
  const selectedOption = options.find(o => String(o.value) === String(value));
  
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  
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
        if (option) onChange(option.value);
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
          <span>{selectedOption ? selectedOption.label : emptyText}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>▼</span>
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              marginTop: '4px',
              padding: '6px',
              maxHeight: '260px',
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
                padding: '6px 8px',
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
                  fontWeight: !value ? '600' : 'normal'
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
                      padding: '6px 8px', 
                      cursor: 'pointer', 
                      fontSize: '13px',
                      borderRadius: '3px',
                      background: bg,
                      color: isSelected ? 'var(--navy)' : 'inherit',
                      fontWeight: isSelected ? '600' : 'normal'
                    }}
                    onClick={() => { onChange(o.value); setIsOpen(false); setSearch(''); }}
                  >
                    {o.label}
                  </div>
                );
              })}
              {filteredOptions.length === 0 && (
                <div style={{ padding: '6px 8px', color: 'var(--text-dim)', fontSize: '13px', fontStyle: 'italic' }}>
                  No results found
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
  const [loading, setLoading] = useState(true);
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
      setForm({ route_id: '', shift: 'both', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
      setSameForBoth(true);
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleEdit = (item) => {
    setForm({
      route_id: item.route_id,
      shift: item.shift,
      bus_id: item.bus_id || '',
      driver_id: item.driver_id || '',
      evening_bus_id: '',
      evening_driver_id: '',
      incharge_id: item.incharge_id || ''
    });
    setSameForBoth(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  const routes = refs.routes || [];
  const buses = refs.buses || [];
  const drivers = refs.drivers || [];
  const incharges = refs.incharges || [];
  const insts = refs.institutions || [];

  const curInst = isInst ? user.institution_id : instFilter;
  const filteredRoutes = routes.filter(r => !curInst || r.institution_id == curInst);
  const filteredIncharges = incharges.filter(u => !curInst || u.institution_id == curInst);

  const routeOptions = filteredRoutes.map(r => ({ value: r.id, label: `${r.route_code} — ${r.route_name}` }));
  const busOptions = buses.map(b => ({ value: b.id, label: b.registration_number }));
  const driverOptions = drivers.map(d => ({ value: d.id, label: d.name }));
  const inchargeOptions = filteredIncharges.map(u => ({ value: u.id, label: u.name }));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Assign Route</div>
          <div className="page-sub">Standing assignment — applies daily until updated</div>
        </div>
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
              onChange={val => setForm(prev => ({ ...prev, route_id: val }))}
              placeholder="🔍 Search route code or name..."
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
                      onChange={val => setForm(prev => ({ ...prev, bus_id: val }))}
                      placeholder="🔍 Search morning registration number..."
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
                      onChange={val => setForm(prev => ({ ...prev, evening_bus_id: val }))}
                      placeholder="🔍 Search evening registration number..."
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
                      onChange={val => setForm(prev => ({ ...prev, bus_id: val }))}
                      placeholder="🔍 Search registration number..."
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
              <button type="button" className="btn btn-sm btn-outline"
                onClick={() => {
                  setForm({ route_id: '', shift: 'both', bus_id: '', driver_id: '', evening_bus_id: '', evening_driver_id: '', incharge_id: '' });
                  setSameForBoth(true);
                }}>
                Cancel edit
              </button>
            )}
            <button className="btn btn-sm btn-primary" type="submit">Save assignment</button>
          </div>
        </form>

        <div className="section-h">Current assignments</div>
        <DataTable columns={COLUMNS} data={items} onEdit={handleEdit} emptyIcon="🔗" emptyText="No assignments set up." />
      </div>
    </>
  );
}
