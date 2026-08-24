import { useState, useEffect } from 'react';
import api from '../../api/api';
import StatCard from '../../components/UI/StatCard';
import DonutChart from '../../components/UI/DonutChart';
import BarChart from '../../components/UI/BarChart';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [refs, setRefs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.dashboard(),
      api.listRes('drivers').then(r => r.items || []),
      api.listRes('buses').then(r => r.items || []),
      api.listRes('routes').then(r => r.items || []),
      api.refs().catch(() => ({})),
    ]).then(([d, dr, bu, ro, rf]) => {
      setData(d); setDrivers(dr); setBuses(bu); setRoutes(ro); setRefs(rf);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;
  if (!data) return <div className="empty"><p>Could not load dashboard.</p></div>;

  const { stats, trips } = data;
  const dActive = drivers.filter(x => (x.status || 'active') === 'active').length;
  const bActive = buses.filter(x => (x.status || 'active') === 'active').length;
  const insts = refs.institutions || [];
  const instRows = insts.map(i => ({ label: i.short_name || i.name, value: routes.filter(r => r.institution_id == i.id).length }));

  const pillCls = (s) => s === 'running' ? 'tag tag--ok' : s === 'completed' ? 'tag tag--off' : 'tag tag--warn';

  return (
    <>
      <div className="page-head">
        <div><div className="page-title">Dashboard</div><div className="page-sub">Live overview for today</div></div>
      </div>
      <div className="page-body">
        <div className="cards-grid">
          <StatCard label="Active Buses" value={stats.activeBuses} />
          <StatCard label="Students" value={stats.students} />
          <StatCard label="Routes" value={stats.routes} color="amber" />
          <StatCard label="Boarded Today" value={stats.presentToday} color="green" />
        </div>

        <div className="section-h">Visual Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-card__label" style={{ marginBottom: 8 }}>Drivers — Active</div>
            <DonutChart active={dActive} total={drivers.length} color="#2E9E6B" />
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{dActive} active · {drivers.length - dActive} not active</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-card__label" style={{ marginBottom: 8 }}>Buses — Active</div>
            <DonutChart active={bActive} total={buses.length} color="#F4A521" />
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{bActive} active · {buses.length - bActive} not active</div>
          </div>
          <div className="card" style={{ minWidth: 260 }}>
            <div className="stat-card__label" style={{ marginBottom: 10 }}>Routes by Institution</div>
            <BarChart rows={instRows} />
          </div>
        </div>

        <div className="section-h">Today's Trips</div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Route</th><th>Shift</th><th>Bus</th><th>Driver</th><th>Incharge</th><th>Status</th></tr></thead>
            <tbody>
              {trips?.length ? trips.map(t => (
                <tr key={t.id}>
                  <td><b>{t.route_code}</b> · {t.route_name || ''}</td>
                  <td>{t.shift || '—'}</td>
                  <td className="mono">{t.registration_number || '—'}</td>
                  <td>{t.driver_name || '—'}</td>
                  <td>{t.incharge_name || '—'}</td>
                  <td><span className={pillCls(t.status)}>{t.status}</span></td>
                </tr>
              )) : <tr><td colSpan={6} className="muted">No trips today.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
