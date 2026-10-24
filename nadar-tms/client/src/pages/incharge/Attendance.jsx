import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  UserX,
  MapPin,
  Sun,
  Moon,
  Clock,
  Bus,
  Phone,
  User,
  Navigation,
  Search,
  Check,
  ChevronDown,
  LogOut,
  Key,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

function getShiftTimingInfo() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMins = hours * 60 + minutes;

  // 6:00 AM = 360 mins, 11:00 AM = 660 mins
  // 3:00 PM (15:00) = 900 mins, 7:00 PM (19:00) = 1140 mins
  const isMorningActive = totalMins >= 360 && totalMins < 660; // 06:00 - 11:00
  const isEveningActive = totalMins >= 900 && totalMins < 1140; // 15:00 - 19:00
  const isMorningEnded = totalMins >= 660; // 11:00 AM or later
  const isEveningEnded = totalMins >= 1140; // 7:00 PM or later

  // Once morning ends (11:00 AM = 660 mins), automatically switch to evening
  const autoShift = totalMins >= 660 ? 'evening' : 'morning';

  return {
    totalMins,
    autoShift,
    isMorningActive,
    isEveningActive,
    isMorningEnded,
    isEveningEnded,
    currentTimeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function Attendance() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();

  const [timingInfo, setTimingInfo] = useState(getShiftTimingInfo);
  const [shift, setShift] = useState(() => getShiftTimingInfo().autoShift);
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [trip, setTrip] = useState(null);
  const [roster, setRoster] = useState(null);
  const [expandedStops, setExpandedStops] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Gmail-style profile popover & password state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwdText, setShowPwdText] = useState(false);
  const profileMenuRef = useRef(null);

  const locTimer = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
        setShowPasswordForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.');
      return;
    }
    setPwdSaving(true);
    try {
      await api.changePassword({ newPassword });
      toast('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      toast(err.message || 'Could not update password');
    }
    setPwdSaving(false);
  };

  // Periodically update live time and window detection
  useEffect(() => {
    const timer = setInterval(() => {
      const nextTiming = getShiftTimingInfo();
      setTimingInfo(prev => {
        if (!prev.isMorningEnded && nextTiming.isMorningEnded) {
          // 11:00 AM boundary just crossed! Auto-switch to evening
          setShift('evening');
        }
        return nextTiming;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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

  const isShiftWindowActive = shift === 'morning' ? timingInfo.isMorningActive : timingInfo.isEveningActive;
  const isMorningPast = timingInfo.isMorningEnded;
  const isEveningPast = timingInfo.isEveningEnded;
  const isShiftClosed = (shift === 'morning' && isMorningPast) ||
                        (shift === 'evening' && isEveningPast) ||
                        trip?.status === 'completed';
  const canMarkAttendance = !isShiftClosed && trip?.status === 'running';

  const handleMark = async (studentId, stopId, curStatus) => {
    if (!canMarkAttendance) {
      toast('Attendance window is closed for this shift.');
      return;
    }
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
    if (!canMarkAttendance) {
      toast('Attendance window is closed for this shift.');
      return;
    }
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
    if (!canMarkAttendance) {
      toast('Attendance window is closed for this shift.');
      return;
    }
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
    const clean = name.replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return name.trim().charAt(0).toUpperCase() || 'ST';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getUserAvatarLetter = (name) => {
    if (!name) return 'M';
    const clean = name.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (!clean) return name.trim().charAt(0) || 'M';
    return clean.charAt(0);
  };

  const getDisplayName = (name) => {
    if (!name) return t('Incharge');
    const clean = name.replace(/\s*\(Incharge\)/i, '').trim();
    return clean || name;
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top Header */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo-badge">
            <Bus size={20} />
          </div>
          <div className="topbar-title-wrap">
            <span className="topbar-kicker">{t('TMHNU FLEET') || 'TMHNU FLEET'}</span>
            <span className="topbar-title">{t('Live Attendance & Boarding')}</span>
          </div>
        </div>

        <div className="topbar-user-wrap" style={{ position: 'relative' }} ref={profileMenuRef}>
          <button
            type="button"
            className={`gmail-avatar-btn ${showProfileMenu ? 'active' : ''}`}
            onClick={() => setShowProfileMenu(prev => !prev)}
            title={`${user?.name || 'Incharge'} — Profile & Bus Details`}
            aria-label="Account details"
          >
            {getUserAvatarLetter(user?.name)}
          </button>

          {/* Gmail-Style Account & Bus Details Popover */}
          {showProfileMenu && (
            <div className="gmail-profile-popover">
              {/* Incharge Profile Header */}
              <div className="gmail-popover-header">
                <div className="gmail-popover-avatar-lg">
                  {getUserAvatarLetter(user?.name)}
                </div>
                <div className="gmail-popover-name">{user?.name || 'Murugan (Incharge)'}</div>
                <div className="gmail-popover-email">{user?.email || 'incharge@tms.in'}</div>
                <span className="gmail-popover-badge">{t('Shift Supervisor')}</span>
              </div>

              <div className="gmail-popover-body">
                {/* Assigned Bus & Trip Details Card */}
                <div className="gmail-bus-info-card">
                  <div className="gmail-bus-info-title">
                    <Bus size={13} />
                    <span>Assigned Bus Details</span>
                  </div>
                  <div className="gmail-bus-info-grid">
                    <div className="gmail-bus-info-row">
                      <span className="gmail-bus-info-label">Bus:</span>
                      <span className="gmail-bus-info-value mono">{trip?.registration_number || 'TN27L4419'}</span>
                    </div>
                    <div className="gmail-bus-info-row">
                      <span className="gmail-bus-info-label">Driver:</span>
                      <span className="gmail-bus-info-value">{trip?.driver_name || 'UDHAYAMOORTHI K'}</span>
                    </div>
                    <div className="gmail-bus-info-row">
                      <span className="gmail-bus-info-label">Phone:</span>
                      {trip?.driver_phone || '9655343934' ? (
                        <a
                          href={`tel:${trip?.driver_phone || '9655343934'}`}
                          className="gmail-bus-info-value"
                          style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Phone size={11} />
                          <span>{trip?.driver_phone || '9655343934'}</span>
                        </a>
                      ) : (
                        <span className="gmail-bus-info-value">—</span>
                      )}
                    </div>
                    <div className="gmail-bus-info-row">
                      <span className="gmail-bus-info-label">Route:</span>
                      <span className="gmail-bus-info-value">{trip?.route_code || 'ROUTE 102'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Forgot / Change Password */}
                <div className="gmail-popover-actions">
                  <button
                    type="button"
                    className="gmail-btn-action"
                    onClick={() => setShowPasswordForm(prev => !prev)}
                  >
                    <Key size={14} style={{ color: '#6854ec' }} />
                    <span>{showPasswordForm ? 'Hide Password Form' : 'Forgot / Change Password'}</span>
                  </button>

                  {showPasswordForm && (
                    <form onSubmit={handleUpdatePassword} className="gmail-password-box">
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 2 }}>
                        Set New Password:
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPwdText ? 'text' : 'password'}
                          className="gmail-pwd-input"
                          placeholder="New password (min 4 chars)"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwdText(!showPwdText)}
                          style={{ position: 'absolute', right: 8, top: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          {showPwdText ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <input
                        type={showPwdText ? 'text' : 'password'}
                        className="gmail-pwd-input"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className="gmail-pwd-submit"
                      >
                        {pwdSaving ? 'Saving...' : 'Update Password'}
                      </button>
                    </form>
                  )}

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    className="gmail-popover-signout"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Boarding Content */}
      <main className="page-body attendance-page-main">
        {/* Session Header & Timing Banner */}
        <section className="attendance-session-banner">
          <div className="session-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Segmented Shift Mode Controls */}
              <div className="attendance-shift-segmented">
                <button
                  type="button"
                  className={`attendance-shift-mode-btn ${shift === 'morning' ? 'active' : ''}`}
                  onClick={() => setShift('morning')}
                >
                  <Sun size={15} style={{ color: shift === 'morning' ? '#eab308' : '#94a3b8' }} />
                  <span>Morning Shift</span>
                  {timingInfo.isMorningActive ? (
                    <span className="attendance-auto-badge">LIVE</span>
                  ) : timingInfo.isMorningEnded ? (
                    <span className="attendance-auto-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>CLOSED</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  className={`attendance-shift-mode-btn ${shift === 'evening' ? 'active' : ''}`}
                  onClick={() => setShift('evening')}
                >
                  <Moon size={15} style={{ color: shift === 'evening' ? '#6854ec' : '#94a3b8' }} />
                  <span>Evening Shift</span>
                  {(timingInfo.isEveningActive || timingInfo.autoShift === 'evening') && (
                    <span className="attendance-auto-badge">LIVE</span>
                  )}
                </button>
              </div>

              {/* Timing & Window Status Indicator */}
              <div className={`attendance-window-status-pill ${isShiftWindowActive ? 'is-active' : ''}`}>
                <Clock size={14} />
                <span>
                  {shift === 'morning'
                    ? (timingInfo.isMorningEnded
                        ? 'Morning Window Closed (11:00 AM) • Read Only'
                        : timingInfo.isMorningActive
                        ? 'Live Morning Window Active (6:00 AM – 11:00 AM)'
                        : 'Morning Window: 6:00 AM – 11:00 AM')
                    : (timingInfo.isEveningActive
                        ? 'Live Evening Window Active (3:00 PM – 7:00 PM)'
                        : 'Evening Window: 3:00 PM – 7:00 PM')
                  }
                </span>
                <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 2 }}>• {timingInfo.currentTimeStr}</span>
              </div>
            </div>

            {routes.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Route:</span>
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
        </section>

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
                <div className="attendance-summary-icon" style={{ background: '#ede9fe', color: '#6854ec' }}>
                  <Users size={20} />
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num">{totalStudents}</div>
                  <div className="attendance-summary-lbl">Enrolled</div>
                </div>
              </div>

              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: '#059669' }}>{presentStudents}</div>
                  <div className="attendance-summary-lbl">Boarded ({completionPct}%)</div>
                </div>
              </div>

              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <UserX size={20} />
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: '#dc2626' }}>{absentStudents}</div>
                  <div className="attendance-summary-lbl">Pending</div>
                </div>
              </div>

              <div className="attendance-summary-card">
                <div className="attendance-summary-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <MapPin size={20} />
                </div>
                <div className="attendance-summary-content">
                  <div className="attendance-summary-num" style={{ color: '#2563eb' }}>{roster?.stops?.length || 0}</div>
                  <div className="attendance-summary-lbl">Stops</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {totalStudents > 0 && (
              <div className="attendance-progress-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Boarding Progress
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: completionPct === 100 ? '#059669' : '#6854ec' }}>
                    {presentStudents} of {totalStudents} boarded ({completionPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: 7, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${completionPct}%`,
                      background: completionPct === 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #7c6cfc, #6854ec)',
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
                    <Navigation size={17} style={{ color: '#6854ec', flexShrink: 0 }} />
                    <span>Route Timeline:</span>
                    <span style={{ color: '#6854ec', fontWeight: 800 }}>
                      {roster?.direction?.from || 'Start Point'} → {roster?.direction?.to || 'Destination'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                    Expand stop to mark passengers or tap "Mark All" to board stop.
                  </div>
                </div>

                <div className="journey-timeline-controls">
                  {/* Search filter */}
                  <div className="attendance-search-wrap">
                    <input
                      type="text"
                      className="finput"
                      placeholder="Search student or roll #..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 32, height: 34, fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: 8, top: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="attendance-action-btns-row">
                    <button
                      type="button"
                      onClick={expandAll}
                      className="attendance-action-btn"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="attendance-action-btn"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
              </div>

              {/* Read-Only Notice when shift closed */}
              {isShiftClosed && shift === 'morning' && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12.5,
                  color: '#475569',
                  fontWeight: 600
                }}>
                  <Lock size={15} style={{ color: '#6854ec', flexShrink: 0 }} />
                  <span>Morning attendance window ended at 11:00 AM. Showing entered records in read-only mode.</span>
                </div>
              )}

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
                                <Clock size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                                {st.scheduled_time.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="stop-right" onClick={e => e.stopPropagation()}>
                          {st.students.length > 0 && canMarkAttendance && !isAllBoarded && (
                            <button
                              type="button"
                              className="btn-batch-mark"
                              disabled={isBatchSaving}
                              onClick={() => handleMarkAllAtStop(st.id, st.students)}
                              title="Mark all unboarded students at this stop as Present"
                            >
                              <Check size={12} />
                              <span>{isBatchSaving ? 'Boarding...' : 'Mark All'}</span>
                            </button>
                          )}

                          <span className={`stop-count-pill ${isAllBoarded ? 'stop-count-pill--complete' : ''}`}>
                            {boardedCount} / {st.students.length} boarded
                          </span>

                          <div
                            className="stop-chevron"
                            style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            onClick={() => toggleStopExpand(st.id)}
                          >
                            <ChevronDown
                              size={16}
                              style={{
                                transform: isOpen ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s ease',
                                color: '#94a3b8'
                              }}
                            />
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
                                            <span style={{ color: '#059669', fontWeight: 600 }}>
                                              {new Date(s.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    {canMarkAttendance ? (
                                      <button
                                        type="button"
                                        className={`mark-btn ${isPresent ? 'present' : 'absent'}`}
                                        disabled={isSaving}
                                        onClick={() => handleMark(s.id, st.id, s.status)}
                                      >
                                        {isSaving ? (
                                          'Saving...'
                                        ) : isPresent ? (
                                          <>
                                            <Check size={13} />
                                            <span>Present</span>
                                          </>
                                        ) : (
                                          <>Mark Present</>
                                        )}
                                      </button>
                                    ) : (
                                      <span className={`mark-badge-readonly ${isPresent ? 'present' : 'absent'}`}>
                                        {isPresent ? (
                                          <>
                                            <Check size={12} />
                                            <span>Present</span>
                                          </>
                                        ) : (
                                          <span>Absent</span>
                                        )}
                                      </span>
                                    )}
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
                  <Search size={28} style={{ color: '#94a3b8', margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>No stops or students match "{searchQuery}"</div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty" style={{ background: '#ffffff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ede9fe', color: '#6854ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Bus size={32} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
              No Active Trip Manifest Found
            </div>
            <p style={{ color: '#64748b', fontSize: 13.5, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
              There is currently no running trip scheduled for <b>{shift === 'morning' ? 'Morning Shift' : 'Evening Shift'}</b>.
              The system automatically detects shifts based on time ({shift === 'morning' ? '6:00 AM – 11:00 AM' : '3:00 PM – 7:00 PM'}).
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShift(shift === 'morning' ? 'evening' : 'morning')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: '1.5px solid #6854ec',
                  background: '#6854ec',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {shift === 'morning' ? <Moon size={15} /> : <Sun size={15} />}
                <span>Switch to {shift === 'morning' ? 'Evening Shift' : 'Morning Shift'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Submission Bar */}
      {trip && (
        <footer className="attendance-bottom-bar">
          <div className="bottom-bar-summary">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: canMarkAttendance ? '#10b981' : '#94a3b8' }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                {presentStudents} of {totalStudents} Passengers Boarded
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                Trip Status: <b style={{ textTransform: 'capitalize', color: canMarkAttendance ? '#059669' : '#64748b' }}>{trip.status}</b> • Bus {trip.registration_number || '—'}
              </div>
            </div>
          </div>

          {canMarkAttendance ? (
            <button
              type="button"
              className="bottom-bar-btn-submit"
              onClick={handleSubmit}
            >
              <span>Submit Attendance & End Trip</span>
              <Check size={16} />
            </button>
          ) : isShiftClosed && shift === 'morning' ? (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', padding: '10px 16px', background: '#f1f5f9', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={15} style={{ color: '#6854ec' }} />
              <span>Morning Window Closed (Read Only)</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', padding: '10px 16px', background: '#f1f5f9', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={15} style={{ color: '#059669' }} />
              <span>Trip Closed & Attendance Submitted</span>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
