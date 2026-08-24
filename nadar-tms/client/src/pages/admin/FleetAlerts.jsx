import { useState, useEffect } from 'react';
import api from '../../api/api';
import { fmtDate } from '../../components/UI/DataTable';

export default function FleetAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = (d) => {
    setLoading(true);
    api.alerts(d).then(res => {
      setAlerts(res.alerts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(days); }, []);

  const handleDaysChange = (d) => {
    setDays(d);
    load(d);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Fleet Compliance Alerts</div>
          <div className="page-sub">Upcoming document and maintenance due dates</div>
        </div>
      </div>
      <div className="page-body">
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Filter limit:</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 15, 30, 60, 90].map(d => (
              <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleDaysChange(d)}>
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /> Fetching alerts...</div>
        ) : alerts.length ? (
          <div>
            {alerts.map((al, idx) => (
              <div key={idx} className={`alert-card ${al.expired ? 'is-expired' : ''}`}>
                <div className="alert-card__icon">{al.expired ? '🚨' : '⚠️'}</div>
                <div style={{ flex: 1 }}>
                  <div className="alert-card__title">
                    {al.subject} — <span style={{ color: 'var(--navy)' }}>{al.type}</span>
                  </div>
                  <div className="alert-card__sub">
                    Due Date: <b>{fmtDate(al.date)}</b> · {al.expired ? <span style={{ color: 'var(--absent)', fontWeight: 600 }}>Expired {Math.abs(al.daysLeft)} days ago</span> : <span>Due in {al.daysLeft} days</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">✅</div>
            <p>All clean! No compliance issues within the next {days} days.</p>
          </div>
        )}
      </div>
    </>
  );
}
