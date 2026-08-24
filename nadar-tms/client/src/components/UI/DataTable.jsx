export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const money = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');

export default function DataTable({ columns, data, onEdit, onDelete, onPdf, emptyIcon, emptyText }) {
  if (!data?.length) {
    return (
      <div className="empty">
        <div className="empty-icon">{emptyIcon || '📋'}</div>
        <p>{emptyText || 'No records found.'}</p>
      </div>
    );
  }

  const renderCell = (item, col) => {
    const val = item[col.key];
    if (col.render) return col.render(val, item);
    if (col.date) return fmtDate(val);
    if (col.money) return val ? money(val) : '—';
    if (col.mono) return <span className="mono">{val ?? '—'}</span>;
    if (col.tag) {
      const cls = val === 'active' ? 'tag--ok' : val === 'repair' ? 'tag--warn' : 'tag--off';
      return <span className={`tag ${cls}`}>{val || '—'}</span>;
    }
    return val ?? '—';
  };

  const showActions = onEdit || onDelete || onPdf;

  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((c, i) => <th key={i}>{c.label}</th>)}
            {showActions && <th></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.id || i}>
              {columns.map((c, j) => <td key={j}>{renderCell(item, c)}</td>)}
              {showActions && (
                <td>
                  <div className="row-actions">
                    {onPdf && <button className="icon-btn" title="Profile PDF" onClick={() => onPdf(item)}>🖨</button>}
                    {onEdit && <button className="icon-btn" onClick={() => onEdit(item)}>✎</button>}
                    {onDelete && <button className="icon-btn icon-btn--danger" onClick={() => onDelete(item)}>🗑</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
