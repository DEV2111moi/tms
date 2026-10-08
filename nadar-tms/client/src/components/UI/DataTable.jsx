import React, { Fragment } from 'react';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();

  if (!data?.length) {
    return (
      <div className="empty">
        <div className="empty-icon">{emptyIcon || '📋'}</div>
        <p>{t(emptyText || 'No records found.')}</p>
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
      return <span className={`tag ${cls}`}>{t(val || '—')}</span>;
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
                {t('S.No')}
              </th>
            )}
            {columns.map((c, i) => (
              <th key={i} style={c.key === 'sno' || c.key === 'serial' ? { width: c.width || 55, textAlign: 'center' } : undefined}>
                {t(c.label)}
              </th>
            ))}
            {showActions && <th style={{ textAlign: 'center' }}>{t('Action')}</th>}
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
                      <div className="row-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {extraAction && extraAction(item, i)}
                        {onMasterEdit && (
                          <button
                            type="button"
                            title={t('Edit')}
                            onClick={() => onMasterEdit(item)}
                            style={{
                              width: 28,
                              height: 28,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              border: '1px solid #fed7aa',
                              background: '#fffbeb',
                              color: '#d97706',
                              cursor: 'pointer',
                              fontSize: 13
                            }}
                          >
                            ⚡
                          </button>
                        )}
                        {onPdf && (
                          <button
                            type="button"
                            title={t('Print')}
                            onClick={() => onPdf(item)}
                            style={{
                              width: 28,
                              height: 28,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#475569',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                            </svg>
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            title={t('Edit')}
                            onClick={() => onEdit(item)}
                            style={{
                              width: 28,
                              height: 28,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#2563eb',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            title={t('Delete')}
                            onClick={() => onDelete(item)}
                            style={{
                              width: 28,
                              height: 28,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#dc2626',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
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
