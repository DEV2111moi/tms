export default function DonutChart({ active, total, color = '#F4A521', size = 128 }) {
  const r = 52, c = 2 * Math.PI * r, frac = total ? active / total : 0;
  return (
    <svg viewBox="0 0 140 140" width={size} height={size}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#E6ECF0" strokeWidth="16" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="16"
        strokeDasharray={`${(frac * c).toFixed(1)} ${c.toFixed(1)}`}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="70" y="68" textAnchor="middle" fontSize="30" fontWeight="700" fill="#0E2A3B">{active}</text>
      <text x="70" y="88" textAnchor="middle" fontSize="11" fill="#5A6B76">of {total}</text>
    </svg>
  );
}
