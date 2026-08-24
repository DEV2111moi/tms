import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';

const FIELDS = [
  { key: 'bus_id', label: 'Bus Registration', type: 'busref', required: true },
  { key: 'tyre_position', label: 'Tyre Position (e.g. Front Left, Rear Right Outer)', required: true },
  { key: 'tyre_brand', label: 'Brand', required: true },
  { key: 'tyre_size', label: 'Size', required: true },
  { key: 'year_of_make', label: 'Year of Manufacture', type: 'number' },
  { key: 'tyre_quality', label: 'Quality', type: 'select', options: ['original', 'second'] },
  { key: 'serial_no', label: 'Serial No.' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'purchase_price', label: 'Purchase Price (₹)', type: 'number' },
  { key: 'fitted_date', label: 'Fitted Date', type: 'date' },
  { key: 'fitted_odometer_km', label: 'Fitted Odometer (km)', type: 'number' },
  { key: 'current_km_run', label: 'Current Run Distance (km)', type: 'number' },
  { key: 'expected_life_km', label: 'Expected Life (km)', type: 'number' },
  { key: 'condition_status', label: 'Condition', type: 'select', options: ['new', 'good', 'average', 'worn'] },
  { key: 'tyre_status', label: 'Tyre Status', type: 'select', options: ['active', 'replaced', 'retreaded', 'damaged'] },
  { key: 'remarks', label: 'Remarks / Notes', type: 'textarea', full: true }
];

export default function Tyres() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const toast = useToast();

  const load = () => {
    Promise.all([
      api.listRes('tyres'),
      api.refs()
    ]).then(([d, r]) => {
      setItems(d.items || []);
      setRefs(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data, id) => {
    await api.saveRes('tyres', data, id);
    toast(id ? 'Tyre log saved' : 'Tyre log created');
    load();
  };

  const handleDel = async (item) => {
    if (!confirm('Delete this tyre record?')) return;
    await api.delRes('tyres', item.id);
    toast('Record deleted');
    load();
  };

  const busLabel = (id) => {
    const b = refs.buses?.find(x => x.id == id);
    return b ? b.registration_number : '—';
  };

  const columns = [
    { key: 'bus_id', label: 'Bus', render: (v) => <span className="mono">{busLabel(v)}</span> },
    { key: 'tyre_position', label: 'Position' },
    { key: 'tyre_brand', label: 'Brand & Size', render: (v, item) => <span>{v} ({item.tyre_size})</span> },
    { key: 'condition_status', label: 'Condition', render: (v) => {
      const cls = v === 'new' || v === 'good' ? 'tag--ok' : v === 'average' ? 'tag--warn' : 'tag--danger';
      return <span className={`tag ${cls}`}>{v}</span>;
    } },
    { key: 'tyre_status', label: 'Status', render: (v) => {
      const cls = v === 'active' ? 'tag--ok' : 'tag--off';
      return <span className={`tag ${cls}`}>{v}</span>;
    } },
    { key: 'current_km_run', label: 'Run Distance', render: (v, item) => <span className="mono">{Number(v || 0).toLocaleString('en-IN')} / {Number(item.expected_life_km || 0).toLocaleString('en-IN')} km</span> }
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Tyres Management</div>
          <div className="page-sub">{items.length} tyre record(s)</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing({ purchase_date: new Date().toISOString().slice(0, 10) })}>
          + Fit Tyre
        </button>
      </div>
      <div className="page-body">
        <DataTable columns={columns} data={items} onEdit={setEditing} onDelete={handleDel} emptyIcon="🛞" emptyText="No tyres logged." />
      </div>
      {editing !== null && (
        <FormModal title="Tyre Details" fields={FIELDS} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} refs={refs} />
      )}
    </>
  );
}
