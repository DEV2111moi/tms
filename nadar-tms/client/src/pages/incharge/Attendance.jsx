import { useState, useEffect, useRef } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import { useNavigate } from 'react-router-dom';

export default function Attendance() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [shift, setShift] = useState('morning');
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [trip, setTrip] = useState(null);
  const [roster, setRoster] = useState(null);
  const [expandedStops, setExpandedStops] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const locTimer = useRef(null);

  const loadTrip = async (sh, rId) => {
    setLoading(true);
    setTrip(null);
    setRoster(null);
    try {
      const res = await api.todayTrip(sh, rId);
      setTrip(res.trip);
      if (res.routes?.length) {
        setRoutes(res.routes);
        if (!rId && res.trip) setRouteId(res.trip.route_id);
      }
      if (res.trip) {
        const ros = await api.roster(res.trip.id);
        setRoster(ros);
        // Expand first stop by default
        if (ros.stops?.length) {
          setExpandedStops({ [ros.stops[0].id]: true });
        }
      }
    } catch (e) {
      toast(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrip(shift, routeId);
    return () => {
      if (locTimer.current) clearInterval(locTimer.current);
    };
  }, [shift, routeId]);

  // GPS Tracking effect when trip is running
  useEffect(() => {
    if (trip && trip.status === 'running') {
      const pushGps = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await api.pushLocation(trip.id, pos.coords.latitude, pos.coords.longitude, null);
            } catch (err) {
              console.error('GPS send failed', err);
            }
          },
          (err) => console.warn('GPS access error', err),
          { enableHighAccuracy: true }
        );
      };
      pushGps();
      locTimer.current = setInterval(pushGps, 30000);
    } else {
      if (locTimer.current) {
        clearInterval(locTimer.current);
        locTimer.current = null;
      }
    }
    return () => {
      if (locTimer.current) clearInterval(locTimer.current);
    };
  }, [trip]);

  const handleMark = async (studentId, stopId, curStatus) => {
    const nextStatus = curStatus === 'present' ? 'absent' : 'present';
    setSavingId(studentId);
    try {
      await api.mark(trip.id, studentId, stopId, nextStatus);
      // update state locally
      setRoster(prev => {
        const stops = prev.stops.map(st => {
          if (st.id !== stopId) return st;
          return {
            ...st,
            students: st.students.map(s => {
              if (s.id !== studentId) return s;
              return { ...s, status: nextStatus, boarding_time: nextStatus === 'present' ? new Date().toISOString() : null };
            })
          };
        });
        const allSt = stops.flatMap(s => s.students);
        const pres = allSt.filter(s => s.status === 'present').length;
        return {
          ...prev,
          stops,
          summary: { total: allSt.length, present: pres, absent: allSt.length - pres }
        };
      });
    } catch (e) {
      toast(e.message);
    }
    setSavingId(null);
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to finish marking attendance for this trip?')) return;
    try {
      await api.submit(trip.id);
      toast('Attendance submitted successfully');
      loadTrip(shift, routeId);
    } catch (e) {
      toast(e.message);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleStopExpand = (stopId) => {
    setExpandedStops(prev => ({ ...prev, [stopId]: !prev[stopId] }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile-first top bar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🚍</span>
          <span style={{ fontFamily: 'Oswald', fontWeight: 600, fontSize: 16 }}>TMS Incharge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="topbar-who">{user?.name}</span>
          <button className="signout-btn" onClick={handleLogout}>Exit</button>
        </div>
      </header>

      {/* Roster Controls */}
      <section className="blind">
        <div className="blind-eyebrow">Active Session</div>
        <div className="blind-row">
          <select className="fselect" value={shift} onChange={e => setShift(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: 'auto', padding: '6px 12px', fontFamily: 'Oswald', fontWeight: 600, fontSize: 18 }}>
            <option value="morning" style={{ color: '#000' }}>☀️ Morning Shift</option>
            <option value="evening" style={{ color: '#000' }}>🌙 Evening Shift</option>
          </select>
          {routes.length > 1 && (
            <select className="fselect" value={routeId} onChange={e => setRouteId(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: 'auto', padding: '6px 12px' }}>
              {routes.map(r => <option key={r.id} value={r.id} style={{ color: '#000' }}>{r.route_code}</option>)}
            </select>
          )}
        </div>
        {trip && (
          <div className="blind-meta">
            <div>Bus: <b>{trip.registration_number || '—'}</b></div>
            <div>Driver: <b>{trip.driver_name || '—'}</b></div>
            <div>Status: <span className={`tag ${trip.status === 'running' ? 'tag--ok' : 'tag--off'}`} style={{ padding: '2px 8px', fontSize: 11 }}>{trip.status}</span></div>
          </div>
        )}
      </section>

      {/* Main body */}
      <main className="page-body" style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /> Loading trip...</div>
        ) : trip ? (
          <div>
            {roster?.summary && (
              <div className="summary-strip">
                <div className="summary-item"><div className="summary-n" style={{ color: 'var(--navy)' }}>{roster.summary.total}</div><div className="summary-l">Students</div></div>
                <div className="summary-item"><div className="summary-n" style={{ color: 'var(--present)' }}>{roster.summary.present}</div><div className="summary-l">Boarded</div></div>
                <div className="summary-item"><div className="summary-n" style={{ color: 'var(--absent)' }}>{roster.summary.absent}</div><div className="summary-l">Missing</div></div>
              </div>
            )}

            <div className="section-h">Route Timeline ({roster?.direction?.from} → {roster?.direction?.to})</div>

            {roster?.stops?.map(st => {
              const isOpen = !!expandedStops[st.id];
              const boardedCount = st.students.filter(s => s.status === 'present').length;
              return (
                <div className="stop-card" key={st.id}>
                  <div className="stop-head" onClick={() => toggleStopExpand(st.id)}>
                    <div>
                      <span className="stop-name">{st.stop_name}</span>
                      <span className="muted mono" style={{ marginLeft: 8, fontSize: 12 }}>{st.scheduled_time ? st.scheduled_time.slice(0, 5) : ''}</span>
                    </div>
                    <span className="stop-count">
                      {boardedCount} / {st.students.length} boarded {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="stop-body">
                      {st.students.length ? st.students.map(s => (
                        <div className="student-row" key={s.id}>
                          <div>
                            <div className="student-name">{s.name}</div>
                            <div className="student-meta">{s.class_grade || '—'} · {s.student_id}</div>
                          </div>
                          <button className={`mark-btn ${s.status === 'present' ? 'present' : 'absent'}`}
                            disabled={savingId === s.id || trip.status !== 'running'} onClick={() => handleMark(s.id, st.id, s.status)}>
                            {savingId === s.id ? '...' : s.status === 'present' ? 'Present ✓' : 'Mark Present'}
                          </button>
                        </div>
                      )) : (
                        <div className="muted" style={{ padding: '8px 0', fontSize: 13 }}>No students assigned to this stop.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {trip.status === 'running' && (
              <button className="btn btn-primary btn-full" style={{ marginTop: 24, padding: 14 }} onClick={handleSubmit}>
                Submit Attendance (End Trip)
              </button>
            )}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>No active trip assigned for this session.</p>
          </div>
        )}
      </main>
    </div>
  );
}
