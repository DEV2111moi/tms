import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'license_number', label: 'Licence', mono: true },
  { key: 'phone', label: 'Mobile', mono: true },
  { key: 'license_expiry', label: 'Licence Expiry', date: true },
  { key: 'status', label: 'Status', tag: true },
];

const FIELDS = [
  { key: 'name', label: 'Driver Name', required: true },
  { key: 'license_number', label: 'Licence Number', required: true },
  { key: 'license_expiry', label: 'Licence Expiry', type: 'date' },
  { key: 'phone', label: 'Mobile' },
  { key: 'route_id', label: 'Route', type: 'route' },
  { key: 'institution_id', label: 'Institution', type: 'instref' },
  { key: 'user_id', label: 'Linked Login', type: 'userref', role: 'driver' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
  { key: 'employee_code', label: 'Employee Code' },
  { key: 'father_name', label: "Father's Name" },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  { key: 'blood_group', label: 'Blood Group' },
  { key: 'alternate_mobile', label: 'Alternate Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'current_address', label: 'Current Address', type: 'textarea', full: true },
  { key: 'aadhaar_no', label: 'Aadhaar No.' },
  { key: 'joining_date', label: 'Joining Date', type: 'date' },
  { key: 'experience_years', label: 'Experience (years)', type: 'number' },
  { key: 'emergency_contact_name', label: 'Emergency Contact' },
  { key: 'emergency_contact_no', label: 'Emergency Phone' },
];

export default function Drivers() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const load = (inst) => {
    const filter = inst ? { institution_id: inst } : undefined;
    api.listRes('drivers', filter).then(d => { setItems(d.items || []); setLoading(false); });
  };

  useEffect(() => {
    api.refs().then(r => {
      setRefs({ ...r, users: [] });
      api.listUsers().then(u => setRefs(prev => ({ ...prev, users: u.items || [] }))).catch(() => {});
    }).catch(() => {});
    load(user?.role === 'institution' ? user.institution_id : '');
  }, []);

  const handleInstChange = (v) => { setInstFilter(v); load(v); };
  const handleSave = async (data, id) => { await api.saveRes('drivers', data, id); toast(id ? 'Saved' : 'Added'); load(instFilter); };
  const handleDel = async (item) => { if (!confirm('Delete this driver?')) return; await api.delRes('drivers', item.id); toast('Deleted'); load(instFilter); };

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.license_number || '').toLowerCase().includes(query) ||
      (item.phone || '').toLowerCase().includes(query) ||
      (item.employee_code || '').toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div><div className="page-title">Drivers</div><div className="page-sub">{filteredItems.length} driver(s)</div></div>
        {canEdit && <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>+ Add Driver</button>}
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            type="text"
            className="fselect"
            placeholder="🔍 Search name, license, mobile..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          {(refs.institutions?.length > 0 && user?.role !== 'institution') && (
            <select className="fselect" value={instFilter} onChange={e => handleInstChange(e.target.value)} style={{ maxWidth: 280 }}>
              <option value="">All institutions</option>
              {refs.institutions.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
            </select>
          )}
        </div>
        <DataTable columns={COLUMNS} data={filteredItems} onEdit={canEdit ? setEditing : undefined} onDelete={canEdit ? handleDel : undefined} emptyIcon="🪪" emptyText="No drivers found." />
      </div>
      {editing !== null && <FormModal title="Driver" fields={FIELDS} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} refs={refs} />}
    </>
  );
}
