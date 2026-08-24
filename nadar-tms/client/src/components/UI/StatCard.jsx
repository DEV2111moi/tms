export default function StatCard({ label, value, color }) {
  const cls = color === 'amber' ? 'stat-card__value--amber'
    : color === 'green' ? 'stat-card__value--green'
    : color === 'red' ? 'stat-card__value--red' : '';
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className={`stat-card__value ${cls}`}>{value}</div>
    </div>
  );
}
