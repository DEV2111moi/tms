import { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import { useNavigate } from 'react-router-dom';
import { fmtDate } from '../../components/UI/DataTable';

export default function ParentTracker() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.parent().then(d => {
      setData(d);
      setLoading(false);
    }).catch(err => {
      toast(err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div className="loading-center"><div className="spinner" /> Fetching live tracking...</div>;
  if (!data?.child) return <div className="empty"><p>No children linked to your parent account. Contact admin.</p></div>;

  const { child, location, attendance, stops } = data;
  const isPresent = attendance?.status === 'present';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎒</span>
          <span style={{ fontFamily: 'Oswald', fontWeight: 600, fontSize: 16 }}>TMS Parent App</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="topbar-who">{user?.name}</span>
          <button className="signout-btn" onClick={handleLogout}>Exit</button>
        </div>
      </header>

      <main className="page-body" style={{ flex: 1, padding: 16, maxWidth: 600, margin: '0 auto', width: '100%' }}>
        {/* Child Info */}
        <div className="card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 32 }}>🎒</div>
          <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 600, color: 'var(--navy)' }}>{child.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            Student ID: <b>{child.student_id}</b> · Class: <b>{child.class_grade}</b>
          </div>
          <div style={{ fontSize: 13, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--paper-2)' }}>
            Route: <b>{child.route_code} — {child.route_name}</b><br />
            Scheduled Stop: <b>{child.stop_name || '—'}</b>
          </div>
        </div>

        {/* Boarding Status */}
        <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${isPresent ? 'var(--present)' : 'var(--absent)'}` }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 600 }}>Today's Boarding Status</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span className={`tag ${isPresent ? 'tag--ok' : 'tag--danger'}`} style={{ fontSize: 14, padding: '4px 12px' }}>
              {isPresent ? 'Boarded' : 'Not Boarded Yet'}
            </span>
            {isPresent && (
              <span className="mono muted">
                Boarded at: {new Date(attendance.boarding_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Live GPS location */}
        {location && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 600, color: 'var(--navy)' }}>Bus Location</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Last Stop Reached: <b>{location.stop_name || 'In transit'}</b>
            </div>
            <div className="mono muted" style={{ fontSize: 11, marginTop: 4 }}>
              Coordinates: {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)} <br />
              Updated: {new Date(location.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        )}

        {/* Route Timeline */}
        <div className="card">
          <div style={{ fontFamily: 'Oswald', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Route Timeline</div>
          <div className="track-line">
            {stops.map((st, idx) => {
              // Highlight if this is the last stop the bus reached
              const isBusHere = location && location.stop_name === st.stop_name;
              const itemCls = isBusHere ? 'tstop here' : 'tstop';
              return (
                <div key={st.id} className={itemCls}>
                  <div className="tstop-node" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{st.stop_name}</div>
                    <div className="muted mono" style={{ fontSize: 12 }}>Scheduled: {st.scheduled_time?.slice(0, 5)}</div>
                  </div>
                  {isBusHere && <span style={{ fontSize: 12, background: 'var(--marigold-soft)', color: 'var(--marigold)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>BUS HERE</span>}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
