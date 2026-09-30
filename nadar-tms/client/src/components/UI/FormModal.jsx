import { useState } from 'react';
import Modal from './Modal';

export default function FormModal({ title, fields, initial, onSave, onClose, refs }) {
  const [data, setData] = useState(() => {
    const d = {};
    fields.forEach(f => {
      let val = initial?.[f.key] ?? '';
      if (f.type === 'date' && val) {
        if (typeof val === 'string') {
          const m = val.match(/^(\d{4}-\d{2}-\d{2})/);
          if (m) val = m[1];
        } else if (val instanceof Date) {
          val = val.toISOString().slice(0, 10);
        }
      }
      d[f.key] = val;
    });
    return d;
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = !!(initial?.id);

  const set = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const missing = fields.find(f => f.required && !data[f.key]);
    if (missing) { setError(`${missing.label} is required.`); return; }
    setSaving(true);
    try {
      const sanitized = { ...data };
      fields.forEach(f => {
        if (f.type === 'date') {
          const v = sanitized[f.key];
          if (!v) {
            sanitized[f.key] = null;
          } else if (typeof v === 'string') {
            const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
            sanitized[f.key] = m ? m[1] : null;
          }
        }
      });
      await onSave(sanitized, initial?.id);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const renderInput = (f) => {
    const val = data[f.key] ?? '';
    if (f.type === 'select') {
      return (
        <select className="fselect" value={val} onChange={e => set(f.key, e.target.value)}>
          {(f.options || []).map(o => {
            const valStr = typeof o === 'object' && o !== null ? o.value : o;
            const lblStr = typeof o === 'object' && o !== null ? o.label : o;
            return <option key={valStr} value={valStr}>{lblStr}</option>;
          })}
        </select>
      );
    }
    if (f.type === 'route') {
      return (
        <select className="fselect" value={val} onChange={e => set(f.key, e.target.value)}>
          <option value="">Unassigned</option>
          {(refs?.routes || []).map(r => <option key={r.id} value={r.id}>{r.route_code} — {r.route_name}</option>)}
        </select>
      );
    }
    if (f.type === 'instref') {
      return (
        <select className="fselect" value={val} onChange={e => set(f.key, e.target.value)}>
          <option value="">Unassigned</option>
          {(refs?.institutions || []).map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
        </select>
      );
    }
    if (f.type === 'busref') {
      return (
        <select className="fselect" value={val} onChange={e => set(f.key, e.target.value)}>
          <option value="">—</option>
          {(refs?.buses || []).map(b => <option key={b.id} value={b.id}>{b.registration_number}</option>)}
        </select>
      );
    }
    if (f.type === 'userref') {
      const list = (refs?.users || []).filter(u => u.role === f.role);
      return (
        <select className="fselect" value={val} onChange={e => set(f.key, e.target.value)}>
          <option value="">Not linked</option>
          {list.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
        </select>
      );
    }
    if (f.type === 'stop') {
      return (
        <select className="fselect" value={val} onChange={e => set(f.key, e.target.value)}>
          <option value="">—</option>
          {(refs?.stops || []).map(s => <option key={s.id} value={s.id}>{s.stop_name}</option>)}
        </select>
      );
    }
    if (f.type === 'textarea') {
      return <textarea className="finput" rows={2} value={val} onChange={e => set(f.key, e.target.value)} />;
    }
    if (f.type === 'bool') {
      return (
        <select className="fselect" value={val ? '1' : '0'} onChange={e => set(f.key, e.target.value)}>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      );
    }
    const type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
    let inputVal = val;
    if (f.type === 'date' && typeof inputVal === 'string') {
      const m = inputVal.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) inputVal = m[1];
    }
    return <input className="finput" type={type} value={inputVal} required={f.required} onChange={e => set(f.key, e.target.value)} />;
  };

  return (
    <Modal
      title={`${editing ? 'Edit' : 'Add'} ${title}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-sm btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save changes' : `Add ${title}`}
          </button>
        </>
      }
    >
      <div className="form-grid">
        {fields.map(f => (
          <label key={f.key} className={`flabel ${f.full ? 'full' : ''}`}>
            <span>{f.label}{f.required ? ' *' : ''}</span>
            {renderInput(f)}
          </label>
        ))}
      </div>
      {error && <div className="err" style={{ marginTop: 10 }}>{error}</div>}
    </Modal>
  );
}
