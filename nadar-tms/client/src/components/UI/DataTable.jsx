import React, { Fragment } from 'react';

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const money = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onPdf,
  onMasterEdit,
  extraAction,
  renderSubRow,
  rowStyle,
  rowClass,
  emptyIcon,
  emptyText,
  showSerial = true
}) {
  if (!data?.length) {
    return (
      <div className="empty">
        <div className="empty-icon">{emptyIcon || '📋'}</div>
        <p>{emptyText || 'No records found.'}</p>
      </div>
    );
  }

  const renderCell = (item, col, index) => {
    if (col.key === 'sno' || col.key === 'serial') {
      return (
        <span className="mono" style={{ fontWeight: 600, color: 'var(--text-dim, #64748b)' }}>
          {index + 1}
        </span>
      );
    }
    const val = item[col.key];
    if (col.render) return col.render(val, item, index);
    if (col.date) return fmtDate(val);
    if (col.money) return val ? money(val) : '—';
    if (col.mono) return <span className="mono">{val ?? '—'}</span>;
    if (col.tag) {
      const cls = val === 'active' ? 'tag--ok' : val === 'repair' ? 'tag--warn' : val === 'breakdown' ? 'tag--off' : 'tag--off';
      return <span className={`tag ${cls}`}>{val || '—'}</span>;
    }
    return val ?? '—';
  };

  const hasExplicitSerial = columns.some(c => /s\.?\s*no/i.test(c.label || '') || c.key === 'sno' || c.key === 'serial');
  const displaySerial = showSerial && !hasExplicitSerial;
  const showActions = Boolean(onEdit || onDelete || onPdf || onMasterEdit || extraAction);

  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {displaySerial && (
              <th style={{ width: 55, textAlign: 'center', fontWeight: 700, fontSize: 11, letterSpacing: '0.5px' }}>
                S.NO
              </th>
            )}
            {columns.map((c, i) => (
              <th key={i} style={c.key === 'sno' || c.key === 'serial' ? { width: c.width || 55, textAlign: 'center' } : undefined}>
                {c.label}
              </th>
            ))}
            {showActions && <th style={{ textAlign: 'center' }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const customStyle = rowStyle ? rowStyle(item, i) : undefined;
            const customClass = rowClass ? rowClass(item, i) : '';
            const subRow = renderSubRow ? renderSubRow(item, i) : null;

            return (
              <Fragment key={item.id || i}>
                <tr className={customClass} style={customStyle}>
                  {displaySerial && (
                    <td style={{ width: 55, textAlign: 'center', fontWeight: 600, color: 'var(--text-dim)', fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace' }}>
                      {i + 1}
                    </td>
                  )}
                  {columns.map((c, j) => (
                    <td key={j} style={c.key === 'sno' || c.key === 'serial' ? { width: c.width || 55, textAlign: 'center' } : undefined}>
                      {renderCell(item, c, i)}
                    </td>
                  ))}
                  {showActions && (
                    <td style={{ textAlign: 'center' }}>
                      <div className="row-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {extraAction && extraAction(item, i)}
                        {onMasterEdit && (
                          <button
                            className="icon-btn"
                            title="⚡ Master Edit (Driver, Bus, Route, Institution)"
                            onClick={() => onMasterEdit(item)}
                            style={{ color: '#d97706', fontSize: 14 }}
                          >
                            ⚡
                          </button>
                        )}
                        {onPdf && <button className="icon-btn" title="Profile PDF" onClick={() => onPdf(item)}>🖨</button>}
                        {onEdit && <button className="icon-btn" title="Edit Full Profile" onClick={() => onEdit(item)}>✎</button>}
                        {onDelete && <button className="icon-btn icon-btn--danger" title="Delete Driver" onClick={() => onDelete(item)}>🗑</button>}
                      </div>
                    </td>
                  )}
                </tr>
                {subRow}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
