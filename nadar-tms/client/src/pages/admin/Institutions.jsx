import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';

const COLUMNS = [
  { key: 'code', label: 'Code', mono: true },
  { key: 'name', label: 'Name' },
  { key: 'short_name', label: 'Short Name' },
];

const FIELDS = [
  { key: 'code', label: 'Code', required: true },
  { key: 'name', label: 'Institution Name', required: true },
  { key: 'short_name', label: 'Short Name' },
];

export default function Institutions() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () => api.listRes('institutions').then(d => { setItems(d.items || []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleSave = async (data, id) => { await api.saveRes('institutions', data, id); toast(id ? 'Saved' : 'Added'); load(); };
  const handleDel = async (item) => { if (!confirm('Delete this institution?')) return; await api.delRes('institutions', item.id); toast('Deleted'); load(); };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div><div className="page-title">Institutions</div><div className="page-sub">{items.length} institution(s)</div></div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>+ Add Institution</button>
      </div>
      <div className="page-body">
        <DataTable columns={COLUMNS} data={items} onEdit={setEditing} onDelete={handleDel} emptyIcon="🏫" emptyText="No institutions yet." />
      </div>
      {editing !== null && <FormModal title="Institution" fields={FIELDS} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </>
  );
}
