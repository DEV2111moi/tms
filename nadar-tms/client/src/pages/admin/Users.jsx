import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = {
  admin: 'Admin',
  executive: 'Executive',
  institution: 'Institution Incharge',
  incharge: 'Bus Incharge',
  driver: 'Driver',
  parent: 'Parent'
};

const COLUMNS = [
  { key: 'name', label: 'Name', render: (v) => <b>{v}</b> },
  { key: 'email', label: 'Email / Username', mono: true },
  { key: 'phone', label: 'Phone', mono: true },
  { key: 'role', label: 'Role', render: (v) => {
    const cls = v === 'admin' ? 'tag--danger' : v === 'driver' ? 'tag--ok' : v === 'incharge' ? 'tag--warn' : 'tag--off';
    return <span className={`tag ${cls}`}>{ROLE_LABEL[v] || v}</span>;
  } },
];

export default function Users() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const isInst = user?.role === 'institution';

  const load = () => {
    api.listUsers().then(d => {
      let list = d.items || [];
      if (isInst) {
        list = list.filter(u => u.role === 'incharge' && u.institution_id == user.institution_id);
      }
      setItems(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
    load();
  }, []);

  const handleSave = async (data, id) => {
    if (isInst) {
      data.role = 'incharge';
      data.institution_id = user.institution_id;
    }
    await api.saveUser(data, id);
    toast(id ? 'Login saved' : 'Login created');
    load();
  };

  const handleDel = async (item) => {
    if (!confirm('Delete this login? The user will no longer be able to sign in.')) return;
    await api.delUser(item.id);
    toast('Login deleted');
    load();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  const roles = isInst ? ['incharge'] : ['executive', 'institution', 'driver', 'parent', 'admin'];

  const fields = [
    { key: 'name', label: 'Full Name', required: true },
    { key: 'email', label: 'Email (login username)', required: true },
    { key: 'phone', label: 'Phone Number' },
    ...(!isInst ? [{ key: 'role', label: 'Role', type: 'select', options: roles, required: true }] : []),
    ...(!isInst ? [{ key: 'institution_id', label: 'Institution', type: 'instref' }] : []),
    { key: 'password', label: editing?.id ? 'Password (leave blank to keep current)' : 'Password', required: !editing?.id }
  ];

  const shownItems = instFilter ? items.filter(u => u.institution_id == instFilter) : items;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">{isInst ? 'Bus Incharge Logins' : 'Logins'}</div>
          <div className="page-sub">{shownItems.length} account(s)</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>+ Add Login</button>
      </div>
      <div className="page-body">
        {(!isInst && refs.institutions?.length > 0) && (
          <select className="fselect" value={instFilter} onChange={e => setInstFilter(e.target.value)} style={{ maxWidth: 280, marginBottom: 14 }}>
            <option value="">All institutions</option>
            {refs.institutions.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
          </select>
        )}
        <DataTable columns={COLUMNS} data={shownItems} onEdit={setEditing} onDelete={handleDel} emptyIcon="🔑" emptyText="No logins created yet." />
      </div>
      {editing !== null && (
        <FormModal title="Login" fields={fields} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} refs={refs} />
      )}
    </>
  );
}
