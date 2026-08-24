import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

const COLUMNS = [
  { key: 'registration_number', label: 'Reg. Number', mono: true },
  { key: 'bus_model', label: 'Model' },
  { key: 'capacity', label: 'Seats', mono: true },
  { key: 'status', label: 'Status', tag: true },
  { key: 'fc_expiry', label: 'FC Expiry', date: true },
  { key: 'insurance_expiry', label: 'Insurance Expiry', date: true },
];

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

export default function Buses() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const load = (inst) => {
    const filter = inst ? { institution_id: inst } : undefined;
    api.listRes('buses', filter).then(d => { setItems(d.items || []); setLoading(false); });
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
    load(user?.role === 'institution' ? user.institution_id : '');
  }, []);

  const handleInstChange = (v) => { setInstFilter(v); load(v); };
  const handleSave = async (data, id) => { await api.saveRes('buses', data, id); toast(id ? 'Saved' : 'Added'); load(instFilter); };
  const handleDel = async (item) => { if (!confirm('Delete this bus?')) return; await api.delRes('buses', item.id); toast('Deleted'); load(instFilter); };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div><div className="page-title">Buses</div><div className="page-sub">{items.length} bus(es)</div></div>
        {canEdit && <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>+ Add Bus</button>}
      </div>
      <div className="page-body">
        {(refs.institutions?.length > 0 && user?.role !== 'institution') && (
          <select className="fselect" value={instFilter} onChange={e => handleInstChange(e.target.value)} style={{ maxWidth: 280, marginBottom: 14 }}>
            <option value="">All institutions</option>
            {refs.institutions.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
          </select>
        )}
        <DataTable columns={COLUMNS} data={items} onEdit={canEdit ? setEditing : undefined} onDelete={canEdit ? handleDel : undefined} emptyIcon="🚌" emptyText="No buses yet." />
      </div>
      {editing !== null && <FormModal title="Bus" fields={FIELDS} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} refs={refs} />}
    </>
  );
}
