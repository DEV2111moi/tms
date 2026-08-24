import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

const COLUMNS = [
  { key: 'student_id', label: 'ID', mono: true },
  { key: 'name', label: 'Name' },
  { key: 'class_grade', label: 'Class' },
  { key: 'guardian_phone', label: 'Guardian Phone', mono: true },
  { key: 'rfid_card', label: 'RFID', mono: true },
];

const FIELDS = [
  { key: 'student_id', label: 'Student ID', required: true },
  { key: 'name', label: 'Student Name', required: true },
  { key: 'class_grade', label: 'Class / Grade' },
  { key: 'route_id', label: 'Route', type: 'route' },
  { key: 'stop_id', label: 'Stop', type: 'stop' },
  { key: 'institution_id', label: 'Institution', type: 'instref' },
  { key: 'parent_user_id', label: 'Parent Login', type: 'userref', role: 'parent' },
  { key: 'rfid_card', label: 'RFID Card' },
  { key: 'guardian_phone', label: 'Guardian Phone' },
  { key: 'admission_no', label: 'Admission No.' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  { key: 'department', label: 'Department' },
  { key: 'course', label: 'Course' },
  { key: 'parent_name', label: 'Parent Name' },
  { key: 'parent_mobile', label: 'Parent Mobile' },
  { key: 'address', label: 'Address', type: 'textarea', full: true },
  { key: 'blood_group', label: 'Blood Group' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'completed'] },
];

export default function Students() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'institution';

  const load = (inst) => {
    const filter = inst ? { institution_id: inst } : user?.role === 'institution' ? { institution_id: user.institution_id } : undefined;
    api.listRes('students', filter).then(d => { setItems(d.items || []); setLoading(false); });
  };

  useEffect(() => {
    api.refs().then(r => {
      setRefs({ ...r, users: [], stops: [] });
      api.listUsers().then(u => setRefs(prev => ({ ...prev, users: u.items || [] }))).catch(() => {});
      api.listRes('stops').then(s => setRefs(prev => ({ ...prev, stops: s.items || [] }))).catch(() => {});
    }).catch(() => {});
    load(user?.role === 'institution' ? user.institution_id : '');
  }, []);

  const handleInstChange = (v) => { setInstFilter(v); load(v); };
  const handleSave = async (data, id) => {
    if (user?.role === 'institution') data.institution_id = user.institution_id;
    await api.saveRes('students', data, id); toast(id ? 'Saved' : 'Added'); load(instFilter);
  };
  const handleDel = async (item) => { if (!confirm('Delete this student?')) return; await api.delRes('students', item.id); toast('Deleted'); load(instFilter); };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div><div className="page-title">Students</div><div className="page-sub">{items.length} student(s)</div></div>
        {canEdit && <button className="btn btn-sm btn-primary" onClick={() => setEditing(user?.role === 'institution' ? { institution_id: user.institution_id } : {})}>+ Add Student</button>}
      </div>
      <div className="page-body">
        {(refs.institutions?.length > 0 && user?.role !== 'institution') && (
          <select className="fselect" value={instFilter} onChange={e => handleInstChange(e.target.value)} style={{ maxWidth: 280, marginBottom: 14 }}>
            <option value="">All institutions</option>
            {refs.institutions.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
          </select>
        )}
        <DataTable columns={COLUMNS} data={items} onEdit={canEdit ? setEditing : undefined} onDelete={canEdit ? handleDel : undefined} emptyIcon="🎒" emptyText="No students yet." />
      </div>
      {editing !== null && <FormModal title="Student" fields={FIELDS} initial={editing} onSave={handleSave} onClose={() => setEditing(null)} refs={refs} />}
    </>
  );
}
