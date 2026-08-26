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
  { key: 'shift', label: 'Shift', render: (val) => SHIFT_MAP[val] || val },
  { key: 'registration_number', label: 'Bus', mono: true },
  { key: 'driver_name', label: 'Driver' },
  { key: 'incharge_name', label: 'Bus Incharge' },
];

export default function Assignments() {
  const [items, setItems] = useState([]);
  const [refs, setRefs] = useState({});
  const [form, setForm] = useState({ route_id: '', shift: 'both', bus_id: '', driver_id: '', incharge_id: '' });
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
      await api.assign(form);
      toast('Assignment saved');
      setForm({ route_id: '', shift: 'both', bus_id: '', driver_id: '', incharge_id: '' });
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
      incharge_id: item.incharge_id || ''
    });
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

            <label className="flabel">
              <span>Route *</span>
              <select className="fselect" value={form.route_id} required onChange={e => setForm(prev => ({ ...prev, route_id: e.target.value }))}>
                <option value="">Choose route</option>
                {filteredRoutes.map(r => <option key={r.id} value={r.id}>{r.route_code} — {r.route_name}</option>)}
              </select>
            </label>

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

            {!isInst && (
              <>
                <label className="flabel">
                  <span>Bus</span>
                  <select className="fselect" value={form.bus_id} onChange={e => setForm(prev => ({ ...prev, bus_id: e.target.value }))}>
                    <option value="">—</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number}</option>)}
                  </select>
                </label>

                <label className="flabel">
                  <span>Driver</span>
                  <select className="fselect" value={form.driver_id} onChange={e => setForm(prev => ({ ...prev, driver_id: e.target.value }))}>
                    <option value="">—</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
              </>
            )}

            <label className="flabel full">
              <span>Bus Incharge</span>
              <select className="fselect" value={form.incharge_id} onChange={e => setForm(prev => ({ ...prev, incharge_id: e.target.value }))}>
                <option value="">—</option>
                {filteredIncharges.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            {form.route_id && (
              <button type="button" className="btn btn-sm btn-outline"
                onClick={() => setForm({ route_id: '', shift: 'both', bus_id: '', driver_id: '', incharge_id: '' })}>
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
