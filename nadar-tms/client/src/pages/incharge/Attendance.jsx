import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/UI/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';

export default function Attendance() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const toast = useToast();

  const [shift, setShift] = useState('morning1');
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [trip, setTrip] = useState(null);
  const [roster, setRoster] = useState(null);
  const [expandedStops, setExpandedStops] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        // Expand first stop by default or all stops if small
        if (ros.stops?.length) {
          const initialExpanded = {};
          ros.stops.forEach((st, idx) => {
            if (idx === 0) initialExpanded[st.id] = true;
          });
          setExpandedStops(initialExpanded);
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
        if (!prev) return prev;
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

  const handleMarkAllAtStop = async (stopId, students) => {
    const unboarded = students.filter(s => s.status !== 'present');
    if (!unboarded.length) return;
    setSavingId(`stop-${stopId}`);
    try {
      for (const s of unboarded) {
        await api.mark(trip.id, s.id, stopId, 'present');
      }
      setRoster(prev => {
        if (!prev) return prev;
        const stops = prev.stops.map(st => {
          if (st.id !== stopId) return st;
          return {
            ...st,
            students: st.students.map(s => ({
              ...s,
              status: 'present',
              boarding_time: s.boarding_time || new Date().toISOString()
            }))
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
      toast(`Marked ${unboarded.length} student(s) present`);
    } catch (e) {
      toast(e.message);
    }
    setSavingId(null);
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to finish marking attendance for this trip? This will end the active trip.')) return;
    try {
      await api.submit(trip.id);
      toast('Attendance submitted successfully! Trip marked completed.');
      loadTrip(shift, routeId);
    } catch (e) {
      toast(e.message);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleStopExpand = (stopId) => {
    setExpandedStops(prev => ({ ...prev, [stopId]: !prev[stopId] }));
  };

  const expandAll = () => {
    if (!roster?.stops) return;
    const all = {};
    roster.stops.forEach(st => { all[st.id] = true; });
    setExpandedStops(all);
  };

  const collapseAll = () => {
    setExpandedStops({});
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filtered stops and students based on search
  const filteredStops = useMemo(() => {
    if (!roster?.stops) return [];
    if (!searchQuery.trim()) return roster.stops;
    const q = searchQuery.toLowerCase();
    return roster.stops.map(st => {
      const matchedStudents = st.students.filter(s => 
        s.name?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q) ||
        s.class_grade?.toLowerCase().includes(q)
      );
      return {
        ...st,
        students: matchedStudents,
        hasMatch: matchedStudents.length > 0 || st.stop_name?.toLowerCase().includes(q)
      };
    }).filter(st => st.hasMatch);
  }, [roster, searchQuery]);

  // Calculate boarding progress
  const totalStudents = roster?.summary?.total || 0;
  const presentStudents = roster?.summary?.present || 0;
  const absentStudents = roster?.summary?.absent || 0;
  const completionPct = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  const shiftsList = [
    { key: 'morning1', label: 'Morning 1', icon: '☀️' },
    { key: 'morning2', label: 'Morning 2', icon: '🌤️' },
    { key: 'morning3', label: 'Morning 3', icon: '☀️' },
    { key: 'morning4', label: 'Morning 4', icon: '🌤️' },
    { key: 'evening1', label: 'Evening 1', icon: '🌙' },
    { key: 'evening2', label: 'Evening 2', icon: '⭐' },
    { key: 'evening3', label: 'Evening 3', icon: '🌙' },
    { key: 'evening4', label: 'Evening 4', icon: '⭐' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top Header */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/>
              <circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>
              <path d="M4 11h16M9 4v7M15 4v7"/>
            </svg>
          </div>
          <div className="topbar-title-wrap">
            <span className="topbar-kicker">{t('TMHNU FLEET') || 'TMHNU FLEET'}</span>
            <span className="topbar-title">{t('Live Attendance & Boarding')}</span>
          </div>
        </div>

        <div className="topbar-user-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LanguageSwitcher compact={true} />
          <div className="topbar-user-chip">
            <div className="topbar-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="topbar-who">{user?.name || t('Incharge')}</div>
              <div className="topbar-role-tag">{t('Shift Supervisor')}</div>
            </div>
          </div>
          <button className="signout-btn" onClick={handleLogout} title={t('Exit session')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t('Exit')}
          </button>
        </div>
      </header>


      {/* Session Header & Telemetry Banner */}
      <section className="attendance-session-banner">
        <div className="session-top-row">
          <div className="session-shift-pills">
            {shiftsList.map(s => (
              <button
                key={s.key}
                type="button"
                className={`session-shift-btn ${shift === s.key ? 'active' : ''}`}
                onClick={() => setShift(s.key)}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {routes.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Route:</span>
              <select
                className="session-route-picker"
                value={routeId}
                onChange={e => setRouteId(e.target.value)}
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.route_code} — {r.route_name || r.name || 'Route'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {trip && (
          <div className="session-telemetry-ribbon">
            <div className="telemetry-chip mono">
              <span>🚌 Bus:</span>
              <strong>{trip.registration_number || '—'}</strong>
            </div>
            <div className="telemetry-chip">
              <span>👤 Driver:</span>
              <strong>{trip.driver_name || '—'}</strong>
            </div>
            {trip.driver_phone && (
              <div className="telemetry-chip">
                <span>📞</span>
                <a href={`tel:${trip.driver_phone}`} style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>
                  {trip.driver_phone}
                </a>
              </div>
            )}
            <div className="telemetry-chip">
              <span>📍 Route:</span>
              <strong>{trip.route_code || 'Assigned'}</strong>
            </div>

            <div className={`telemetry-pill-status ${trip.status === 'running' ? 'telemetry-pill-status--running' : 'telemetry-pill-status--completed'}`}>
              {trip.status === 'running' && <span className="telemetry-pulse-dot" />}
              {trip.status === 'running' ? 'Live In-Transit' : trip.status.toUpperCase()}
            </div>
          </div>
        )}
      </section>

      {/* Main Boarding Content */}
      <main className="page-body" style={{ flex: 1, padding: '20px 24px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div className="loading-center" style={{ minHeight: 280 }}>
            <div className="spinner" />
            <div style={{ marginTop: 14, fontWeight: 600, color: 'var(--text-dim)' }}>Loading trip manifest...</div>
          </div>
        ) : trip ? (
          <div>
            {/* Metric Summary Cards */}
            <div className="attendance-summary-strip">
              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  👥
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: 'var(--navy)' }}>{totalStudents}</div>
                  <div className="attendance-summary-lbl">Total Enrolled</div>
                </div>
              </div>

              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                  ✓
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: 'var(--present)' }}>{presentStudents}</div>
                  <div className="attendance-summary-lbl">Boarded ({completionPct}%)</div>
                </div>
              </div>

              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  ✕
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: 'var(--absent)' }}>{absentStudents}</div>
                  <div className="attendance-summary-lbl">Not Boarded</div>
                </div>
              </div>

              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  🚏
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: '#b45309' }}>{roster?.stops?.length || 0}</div>
                  <div className="attendance-summary-lbl">Route Stops</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {totalStudents > 0 && (
              <div style={{ background: '#ffffff', borderRadius: 10, padding: '12px 18px', border: '1px solid #e2e8f0', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Boarding Progress
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: completionPct === 100 ? '#15803d' : '#d97706' }}>
                    {presentStudents} of {totalStudents} boarded ({completionPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${completionPct}%`,
                      background: completionPct === 100
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : 'linear-gradient(90deg, #f59e0b, #eab308)',
                      borderRadius: 6,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Journey Timeline Section */}
            <div className="journey-timeline-section">
              <div className="journey-timeline-header">
                <div>
                  <div className="journey-direction-title">
                    <span>🚏</span>
                    <span>Route Timeline:</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      {roster?.direction?.from || 'Start Point'} → {roster?.direction?.to || 'Destination'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>
                    Expand any stop to view passengers or tap "Mark All" to board an entire stop.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Search filter */}
                  <div style={{ position: 'relative', minWidth: 220 }}>
                    <input
                      type="text"
                      className="finput"
                      placeholder="Search student or roll #..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 32, height: 36, fontSize: 12.5, borderRadius: 8 }}
                    />
                    <span style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8', fontSize: 13 }}>🔍</span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: 8, top: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={expandAll}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Collapse
                  </button>
                </div>
              </div>

              {/* Stop cards */}
              {filteredStops.length > 0 ? (
                filteredStops.map((st, idx) => {
                  const isOpen = !!expandedStops[st.id] || searchQuery.length > 0;
                  const boardedCount = st.students.filter(s => s.status === 'present').length;
                  const isAllBoarded = st.students.length > 0 && boardedCount === st.students.length;
                  const isBatchSaving = savingId === `stop-${st.id}`;

                  return (
                    <div className={`stop-card ${isOpen ? 'is-open' : ''}`} key={st.id}>
                      <div className="stop-head" onClick={() => toggleStopExpand(st.id)}>
                        <div className="stop-left">
                          <span className="stop-seq-badge">{idx + 1}</span>
                          <div>
                            <span className="stop-name">{st.stop_name}</span>
                            {st.scheduled_time && (
                              <span className="stop-time-tag">
                                🕒 {st.scheduled_time.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="stop-right" onClick={e => e.stopPropagation()}>
                          {st.students.length > 0 && trip.status === 'running' && !isAllBoarded && (
                            <button
                              type="button"
                              className="btn-batch-mark"
                              disabled={isBatchSaving}
                              onClick={() => handleMarkAllAtStop(st.id, st.students)}
                              title="Mark all unboarded students at this stop as Present"
                            >
                              {isBatchSaving ? 'Boarding...' : 'Mark All Present ✓'}
                            </button>
                          )}

                          <span className={`stop-count-pill ${isAllBoarded ? 'stop-count-pill--complete' : ''}`}>
                            {boardedCount} / {st.students.length} boarded
                          </span>

                          <div
                            className="stop-chevron"
                            style={{ cursor: 'pointer', padding: '4px' }}
                            onClick={() => toggleStopExpand(st.id)}
                          >
                            ▼
                          </div>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="stop-body">
                          {st.students.length > 0 ? (
                            st.students.map(s => {
                              const isPresent = s.status === 'present';
                              const isSaving = savingId === s.id;
                              return (
                                <div className="student-row" key={s.id}>
                                  <div className="student-info-left">
                                    <div className={`student-avatar-circle ${isPresent ? 'is-present' : ''}`}>
                                      {getInitials(s.name)}
                                    </div>
                                    <div>
                                      <div className="student-name">{s.name}</div>
                                      <div className="student-meta">
                                        <span>{s.class_grade || 'Student'}</span>
                                        <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{s.student_id}</span>
                                        {s.boarding_time && isPresent && (
                                          <>
                                            <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                                            <span style={{ color: '#15803d', fontWeight: 600 }}>
                                              {new Date(s.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <button
                                      type="button"
                                      className={`mark-btn ${isPresent ? 'present' : 'absent'}`}
                                      disabled={isSaving || trip.status !== 'running'}
                                      onClick={() => handleMark(s.id, st.id, s.status)}
                                    >
                                      {isSaving ? (
                                        'Saving...'
                                      ) : isPresent ? (
                                        <>✓ Present</>
                                      ) : (
                                        <>Mark Present</>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: '14px 0', fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                              No registered passengers scheduled for this stop.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontWeight: 600 }}>No stops or students match "{searchQuery}"</div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ marginTop: 10, padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 12 }}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty" style={{ background: '#ffffff', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚍</div>
            <div style={{ fontFamily: 'Oswald', fontSize: 20, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
              No Active Trip Assigned
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, maxWidth: 440, margin: '0 auto 18px' }}>
              There is currently no running trip assigned for <b>{shiftsList.find(s => s.key === shift)?.label}</b>.
              Try selecting another shift session or check with dispatch.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {shiftsList.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setShift(s.key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: shift === s.key ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: shift === s.key ? '#fffbeb' : '#ffffff',
                    color: shift === s.key ? '#b45309' : '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Submission Bar */}
      {trip && (
        <footer className="attendance-bottom-bar">
          <div className="bottom-bar-summary">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: trip.status === 'running' ? '#22c55e' : '#94a3b8' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                {presentStudents} of {totalStudents} Passengers Boarded
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Trip Status: <b style={{ textTransform: 'capitalize' }}>{trip.status}</b> • Bus {trip.registration_number || '—'}
              </div>
            </div>
          </div>

          {trip.status === 'running' ? (
            <button
              type="button"
              className="bottom-bar-btn-submit"
              onClick={handleSubmit}
            >
              <span>Submit Attendance & End Trip</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', padding: '10px 16px', background: '#f1f5f9', borderRadius: 8 }}>
              ✓ Trip Closed & Attendance Submitted
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
