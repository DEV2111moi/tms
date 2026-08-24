import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';

const FIELDS = [
  { key: 'bus_id', label: 'Bus', type: 'busref', required: true },
  { key: 'service_date', label: 'Service Date', type: 'date', required: true },
  { key: 'service_type', label: 'Work Done / Service Type', required: true },
  { key: 'cost', label: 'Cost Spent (₹)', type: 'number' },
  { key: 'odometer', label: 'Odometer (km)', type: 'number' },
  { key: 'next_due_date', label: 'Next Service Due Date', type: 'date' },
  { key: 'notes', label: 'Notes / Remarks', type: 'textarea', full: true }
];

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const toast = useToast();

  const load = () => {
    Promise.all([
      api.listRes('maintenance_logs'),
      api.refs()
    ]).then(([d, r]) => {
      setItems(d.items || []);
      setRefs(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data, id) => {
    await api.saveRes('maintenance_logs', data, id);
    toast(id ? 'Service log saved' : 'Service log created');
    load();
  };

  const handleDel = async (item) => {
    if (!confirm('Delete this service record?')) return;
    await api.delRes('maintenance_logs', item.id);
    toast('Record deleted');
    load();
  };

  const busLabel = (id) => {
    const b = refs.buses?.find(x => x.id == id);
    return b ? b.registration_number : '—';
  };

  const columns = [
    { key: 'service_date', label: 'Date', date: true },
    { key: 'bus_id', label: 'Bus', render: (v) => <span className="mono">{busLabel(v)}</span> },
    { key: 'service_type', label: 'Work Done / Service' },
    { key: 'cost', label: 'Cost Spent', money: true },
    { key: 'odometer', label: 'Odometer', render: (v) => v ? <span className="mono">{Number(v).toLocaleString('en-IN')} km</span> : '—' },
    { key: 'next_due_date', label: 'Next Due', date: true }
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Maintenance</div>
          <div className="page-sub">{items.length} service record(s)</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing({ service_date: new Date().toISOString().slice(0, 10) })}>
          + Service Record
        </button>
      </div>
      <div className="page-body">
        <DataTable columns={columns} data={items} onEdit={setEditing} onDelete={handleDel} emptyIcon="🔧" emptyText="No maintenance records logged." />
      </div>
      {editing !== null && (
        <FormModal title="Maintenance Record" fields={FIELDS} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} refs={refs} />
      )}
    </>
  );
}
