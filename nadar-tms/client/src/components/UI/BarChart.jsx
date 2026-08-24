export default function BarChart({ rows }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  if (!rows.length) return <p className="muted">No data.</p>;
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '7px 0', cursor: r.onClick ? 'pointer' : 'default' }}
          onClick={r.onClick}>
          <div style={{ width: 130, fontSize: '12.5px', color: '#33454f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.label}
          </div>
          <div style={{ flex: 1, background: '#E6ECF0', borderRadius: 6, height: 18 }}>
            <div style={{ width: `${(r.value / max * 100).toFixed(0)}%`, background: 'var(--marigold)', height: 18, borderRadius: 6, minWidth: 2, transition: 'width 0.5s ease' }} />
          </div>
          <div className="mono" style={{ width: 28, textAlign: 'right' }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}
