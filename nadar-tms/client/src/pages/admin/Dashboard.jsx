import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';


// Clean SVG Icon Component (No Emojis)
function DashIcon({ name, size = 18, color = 'currentColor' }) {
  const s = { width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  switch (name) {
    case 'bus':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6m8-6v6"/><path d="M4 16h16"/><path d="M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z"/><circle cx="8" cy="14" r="1.2"/><circle cx="16" cy="14" r="1.2"/></svg></span>;
    case 'driver':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/></svg></span>;
    case 'route':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></svg></span>;
    case 'road':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19L8 5"/><path d="M16 5l4 14"/><path d="M12 6v2m0 4v2m0 4v2"/></svg></span>;
    case 'sun':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg></span>;
    case 'moon':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>;
    case 'building':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg></span>;
    case 'alert':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>;
    case 'shield':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></span>;
    case 'zap':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>;
    case 'check':
      return <span style={s}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg></span>;
    default:
      return null;
  }
}

// Mini Radial Progress Ring Component (Matching top KPI cards in reference)
function RadialRing({ value = 0, color = '#ff9f43', size = 50, strokeWidth = 3.6 }) {
  const r = 21;
  const c = 2 * Math.PI * r;
  const clampedVal = Math.min(100, Math.max(0, Math.round(value)));
  const offset = c - (clampedVal / 100) * c;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#f1f3f9" strokeWidth={strokeWidth} />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: 10.5, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.3px', textAlign: 'center' }}>
        {clampedVal}%
      </span>
    </div>
  );
}

// Concentric Two-Ring Gauge (Matching "Visitors" widget in reference)
function VisitorsDonut({ morning = 50, evening = 50, size = 125 }) {
  const r1 = 48, r2 = 35;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const off1 = c1 - (Math.min(100, morning) / 100) * c1;
  const off2 = c2 - (Math.min(100, evening) / 100) * c2;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Outer Ring: Morning (Purple) */}
        <circle cx="60" cy="60" r={r1} fill="none" stroke="#f0eeff" strokeWidth="7.5" />
        <circle
          cx="60"
          cy="60"
          r={r1}
          fill="none"
          stroke="#7c6cfc"
          strokeWidth="7.5"
          strokeDasharray={c1}
          strokeDashoffset={off1}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Inner Ring: Evening (Orange) */}
        <circle cx="60" cy="60" r={r2} fill="none" stroke="#fff5ec" strokeWidth="6.5" />
        <circle
          cx="60"
          cy="60"
          r={r2}
          fill="none"
          stroke="#ff9f43"
          strokeWidth="6.5"
          strokeDasharray={c2}
          strokeDashoffset={off2}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>100%</div>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: '#8c98a4', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>Active</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shiftTab, setShiftTab] = useState('morning'); // 'morning' | 'evening'
  const [selectedInstFilter, setSelectedInstFilter] = useState('ALL');
  const [activeViewTab, setActiveViewTab] = useState('overview'); // 'overview' | 'trips' | 'unassigned'
  const navigate = useNavigate();

  const loadDashboard = (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    api.dashboard()
      .then(d => {
        setData(d);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(err => {
        console.error('Dashboard load error:', err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const isInstitution = data?.isInstitution || user?.role === 'institution';

  // Selected institution summary from filter
  const selectedInstSummary = useMemo(() => {
    if (!data || !data.institutionSummary || selectedInstFilter === 'ALL') return null;
    return data.institutionSummary.find(i => String(i.id) === String(selectedInstFilter)) || null;
  }, [data, selectedInstFilter]);

  // Dynamic KPIs reactive to top Campus Filter
  const dynamicKPIs = useMemo(() => {
    if (!data || !data.kpis) return {};
    if (!selectedInstSummary) return data.kpis;

    return {
      ...data.kpis,
      totalBuses: selectedInstSummary.busesCount,
      activeBuses: selectedInstSummary.busesCount,
      totalDrivers: selectedInstSummary.driversCount,
      activeDrivers: selectedInstSummary.driversCount,
      totalRoutes: selectedInstSummary.totalRoutes,
      assignedRoutesCount: selectedInstSummary.assignedRoutes,
      unassignedRoutesCount: selectedInstSummary.unassignedRoutes,
      totalDailyKm: selectedInstSummary.totalKm,
    };
  }, [data, selectedInstSummary]);

  // Filtered shifts based on 'morning' | 'evening' and scaled to selected campus
  const filteredShifts = useMemo(() => {
    if (!data || !data.shiftOverview) return [];
    let shifts = data.shiftOverview;
    if (shiftTab === 'morning') {
      shifts = shifts.filter(s => s.shiftGroup === 'Morning');
    } else if (shiftTab === 'evening') {
      shifts = shifts.filter(s => s.shiftGroup === 'Evening');
    }

    if (selectedInstSummary && data.kpis?.totalRoutes > 0) {
      const ratio = selectedInstSummary.totalRoutes / data.kpis.totalRoutes;
      return shifts.map(s => ({
        ...s,
        routesCount: Math.max(1, Math.round(s.routesCount * ratio)),
        busesCount: Math.max(1, Math.round(s.busesCount * ratio)),
        totalKm: Math.round((s.totalKm * ratio) * 10) / 10,
      }));
    }
    return shifts;
  }, [data, shiftTab, selectedInstSummary]);

  // Filtered Unassigned Routes
  const filteredUnassigned = useMemo(() => {
    if (!data || !data.unassignedRoutes) return [];
    return data.unassignedRoutes.filter(r => {
      return selectedInstFilter === 'ALL' || String(r.institution_id) === String(selectedInstFilter);
    });
  }, [data, selectedInstFilter]);

  // Filtered Institutions table summary
  const filteredInstitutionSummary = useMemo(() => {
    if (!data || !data.institutionSummary) return [];
    if (selectedInstFilter === 'ALL') return data.institutionSummary;
    return data.institutionSummary.filter(inst => String(inst.id) === String(selectedInstFilter));
  }, [data, selectedInstFilter]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div className="login-btn-spinner" style={{ width: 34, height: 34, borderColor: 'rgba(124, 108, 252, 0.2)', borderTopColor: '#7c6cfc' }} />
        <div style={{ color: '#6854ec', fontWeight: 600, fontSize: 13.5 }}>Loading Fleet Command Hub...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 48, textAlign: 'center', background: '#ffffff', borderRadius: 18, margin: 32 }}>
        <p style={{ fontSize: 15, color: '#64748b' }}>Could not load dashboard data from server.</p>
        <button className="btn btn-primary" onClick={() => loadDashboard()} style={{ marginTop: 14 }}>
          Retry Connection
        </button>
      </div>
    );
  }

  const { complianceSummary, trips, institution } = data;

  const activeBusesPct = dynamicKPIs.totalBuses > 0 ? Math.round((dynamicKPIs.activeBuses / dynamicKPIs.totalBuses) * 100) : 0;
  const activeDriversPct = dynamicKPIs.totalDrivers > 0 ? Math.round((dynamicKPIs.activeDrivers / dynamicKPIs.totalDrivers) * 100) : 0;
  const assignedRoutesPct = dynamicKPIs.totalRoutes > 0 ? Math.round((dynamicKPIs.assignedRoutesCount / dynamicKPIs.totalRoutes) * 100) : 0;
  const maxShiftRoutes = Math.max(1, ...(filteredShifts.map(s => s.routesCount)));

  const userName = user?.name || (isInstitution ? institution?.name || 'Campus Incharge' : 'Admin');
  const activeCampusesCount = (data.institutionSummary || []).length;

  return (
    <>
      {/* 1. Header Row (Welcome Greeting + Campus Filter + Actions) */}
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{t('Welcome')} {userName.split(' ')[0]}</span>
          </div>
          <div className="page-sub">
            {selectedInstSummary
              ? `${selectedInstSummary.name} · Campus Fleet Command`
              : (isInstitution ? `${institution?.name || 'Campus'} · Live Student & Bus Operations` : 'TMHNU Fleet Control Hub · Theni Central')}
          </div>
        </div>

        <div className="dashboard-head-actions">
          {!isInstitution && (
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                className="finput"
                value={selectedInstFilter}
                onChange={e => setSelectedInstFilter(e.target.value)}
                style={{
                  width: 'auto',
                  minWidth: 175,
                  height: 38,
                  padding: '4px 30px 4px 14px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#1e293b',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
              >
                <option value="ALL">{t('All Campuses')} ({activeCampusesCount})</option>
                {(data.institutionSummary || []).map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.short_name} ({inst.totalRoutes} routes)
                  </option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', fontSize: 11, color: '#64748b' }}>▼</span>
            </div>
          )}

          <div className="live-badge">
            <span className="dot" />
            <span>{selectedInstSummary ? `${selectedInstSummary.short_name.toUpperCase()} ACTIVE` : (isInstitution ? t('CAMPUS ACTIVE') : t('FLEET ACTIVE'))}</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            style={{
              height: 38,
              borderRadius: 12,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#475569'
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{refreshing ? t('Refreshing...') : t('Refresh')}</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* ========================================================================= */}
        {/* ROW 1: 4 HERO KPI CARDS WITH RADIAL PROGRESS RINGS & NAVIGATION ARROWS       */}
        {/* ========================================================================= */}
        <div className="dashboard-kpi-grid">
          {/* Card 1: Fleet Buses */}
          <div
            className="socialeco-kpi-card stat-card--clickable"
            onClick={() => navigate('/admin/buses')}
            title="Click to manage Fleet Buses"
          >
            <div className="socialeco-kpi-card__header">
              <div className="socialeco-kpi-card__brand">
                <span className="socialeco-kpi-card__icon" style={{ color: '#ff9f43' }}><DashIcon name="bus" size={18} color="#ff9f43" /></span>
                <span>{t('Fleet Buses')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RadialRing value={activeBusesPct} color="#ff9f43" size={48} />
                <span className="socialeco-card-arrow">↗</span>
              </div>
            </div>

            <div className="socialeco-kpi-card__body">
              <div className="socialeco-kpi-card__val-row">
                <div className="socialeco-kpi-card__value">{dynamicKPIs.activeBuses || dynamicKPIs.busesRunning || 0}</div>
                <div className="socialeco-kpi-card__delta">+{activeBusesPct}%</div>
              </div>
              <div className="socialeco-kpi-card__label">{t('Active Buses in Service')}</div>
            </div>
          </div>

          {/* Card 2: Duty Drivers */}
          <div
            className="socialeco-kpi-card stat-card--clickable"
            onClick={() => navigate('/admin/driver-master-edit')}
            title="Click to manage Drivers Roster"
          >
            <div className="socialeco-kpi-card__header">
              <div className="socialeco-kpi-card__brand">
                <span className="socialeco-kpi-card__icon" style={{ color: '#7c6cfc' }}><DashIcon name="driver" size={18} color="#7c6cfc" /></span>
                <span>{t('Duty Drivers')}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RadialRing value={activeDriversPct || 92} color="#7c6cfc" size={48} />
                <span className="socialeco-card-arrow">↗</span>
              </div>
            </div>

            <div className="socialeco-kpi-card__body">
              <div className="socialeco-kpi-card__val-row">
                <div className="socialeco-kpi-card__value">{dynamicKPIs.activeDrivers || dynamicKPIs.totalDrivers || 0}</div>
                <div className="socialeco-kpi-card__delta socialeco-kpi-card__delta--purple" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><DashIcon name="zap" size={12} color="#7c6cfc" /> Edit</div>
              </div>
              <div className="socialeco-kpi-card__label">Drivers on Active Roster</div>
            </div>
          </div>

          {/* Card 3: Route Coverage */}
          <div
            className="socialeco-kpi-card stat-card--clickable"
            onClick={() => navigate('/admin/assignments')}
            title="Click to manage Route Assignments"
          >
            <div className="socialeco-kpi-card__header">
              <div className="socialeco-kpi-card__brand">
                <span className="socialeco-kpi-card__icon" style={{ color: '#ff9f43' }}><DashIcon name="route" size={18} color="#ff9f43" /></span>
                <span>Campus Routes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RadialRing value={assignedRoutesPct} color="#ff9f43" size={48} />
                <span className="socialeco-card-arrow">↗</span>
              </div>
            </div>

            <div className="socialeco-kpi-card__body">
              <div className="socialeco-kpi-card__val-row">
                <div className="socialeco-kpi-card__value">{dynamicKPIs.assignedRoutesCount || dynamicKPIs.routesCount || 0}</div>
                <div className="socialeco-kpi-card__delta">+{assignedRoutesPct}%</div>
              </div>
              <div className="socialeco-kpi-card__label">Allocated Bus Routes</div>
            </div>
          </div>

          {/* Card 4: Daily Mileage */}
          <div
            className="socialeco-kpi-card stat-card--clickable"
            onClick={() => navigate('/admin/reports')}
            title="Click to view Mileage Reports"
          >
            <div className="socialeco-kpi-card__header">
              <div className="socialeco-kpi-card__brand">
                <span className="socialeco-kpi-card__icon" style={{ color: '#7c6cfc' }}><DashIcon name="road" size={18} color="#7c6cfc" /></span>
                <span>Daily Mileage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RadialRing value={100} color="#7c6cfc" size={48} />
                <span className="socialeco-card-arrow">↗</span>
              </div>
            </div>

            <div className="socialeco-kpi-card__body">
              <div className="socialeco-kpi-card__val-row">
                <div className="socialeco-kpi-card__value">{Number(dynamicKPIs.totalDailyKm || 0).toLocaleString()}</div>
                <div className="socialeco-kpi-card__delta socialeco-kpi-card__delta--purple">KM / day</div>
              </div>
              <div className="socialeco-kpi-card__label">Total Planned Fleet Distance</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 2: MIDDLE 2-COLUMN SECTION (SHIFT BARS + FILLED COMMAND PROFILE CARD)   */}
        {/* ========================================================================= */}
        <div className="socialeco-mid-grid">
          {/* Left Large Card: Shift Operations Hub (Clean Morning/Evening Toggle) */}
          <div className="socialeco-card">
            <div className="socialeco-card__head">
              <div className="socialeco-card__title">Shift Operations & Fleet Engagement</div>
              <div className="shift-segmented-nav">
                <button
                  className={`shift-segment-btn ${shiftTab === 'morning' ? 'active' : ''}`}
                  onClick={() => setShiftTab('morning')}
                >
                  <DashIcon name="sun" size={14} color="#ff9f43" /> Morning
                </button>
                <button
                  className={`shift-segment-btn ${shiftTab === 'evening' ? 'active' : ''}`}
                  onClick={() => setShiftTab('evening')}
                >
                  <DashIcon name="moon" size={14} color="#7c6cfc" /> Evening
                </button>
              </div>
            </div>

            <div className="socialeco-shift-bars">
              {filteredShifts.slice(0, 4).map(sh => {
                const isMorning = sh.shiftGroup === 'Morning';
                const routePct = Math.round((sh.routesCount / maxShiftRoutes) * 100) || 15;
                const busPct = Math.round((sh.busesCount / Math.max(1, dynamicKPIs.activeBuses || 1)) * 100) || 10;

                const barColor = isMorning ? 'socialeco-bar-segment--purple' : 'socialeco-bar-segment--orange';

                return (
                  <div key={sh.key} className="socialeco-shift-row">
                    <div className="socialeco-shift-name">
                      <span style={{ marginRight: 6 }}><DashIcon name={isMorning ? 'sun' : 'moon'} size={14} color={isMorning ? '#ff9f43' : '#7c6cfc'} /></span>
                      <span>{sh.label.replace(/\(.*\)/, '')}</span>
                    </div>

                    <div className="socialeco-dual-bar-wrap">
                      <div
                        className={`socialeco-bar-segment ${barColor}`}
                        style={{ width: `${routePct}%` }}
                        title={`${sh.routesCount} routes`}
                      />
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: 13 }}>
                      {sh.totalKm} <span style={{ fontSize: 11, color: '#8c98a4', fontWeight: 500 }}>km</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f3f9', fontSize: 11.5, color: '#8c98a4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: shiftTab === 'morning' ? '#7c6cfc' : '#ff9f43', display: 'inline-block' }} />
                <span>{shiftTab === 'morning' ? 'Routes Allocation' : 'Buses Deployed'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: shiftTab === 'morning' ? '#7c6cfc' : '#ff9f43' }}>
                  {filteredShifts.reduce((a, s) => a + s.routesCount, 0)} routes · {filteredShifts.reduce((a, s) => a + s.busesCount, 0)} buses
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ROW 3: 4 BOTTOM MODULES (VISITORS DONUT + 2 METRIC TILES WITH ARROWS + BANNER) */}
        {/* ========================================================================= */}
        <div className="socialeco-bot-grid">
          {/* Module 1: Shift Coverage Concentric Ring Donut */}
          <div className="socialeco-card">
            <div className="socialeco-card__head">
              <div className="socialeco-card__title">Shift Coverage</div>
            </div>
            <VisitorsDonut morning={assignedRoutesPct || 85} evening={activeBusesPct || 70} size={125} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12, fontSize: 11.5, color: '#64748b' }}>
              <span style={{ color: '#7c6cfc', fontWeight: 600 }}>● Morning</span>
              <span style={{ color: '#ff9f43', fontWeight: 600 }}>● Evening</span>
            </div>
          </div>

          {/* Module 2: Small Metric Tile with Arrow Button (Unassigned Alert) */}
          <div
            className="socialeco-metric-tile stat-card--clickable"
            onClick={() => navigate('/admin/assignments')}
          >
            <div className="socialeco-tile-icon socialeco-tile-icon--purple">
              <DashIcon name="alert" size={20} color="#7c6cfc" />
            </div>
            <div className="socialeco-tile-value">{filteredUnassigned.length}</div>
            <div className="socialeco-tile-sub">
              <b>Unassigned Routes</b><br />Need vehicle allocation
            </div>
            <button className="socialeco-tile-action-btn">
              <span>Assign Routes</span>
              <span className="arrow">→</span>
            </button>
          </div>

          {/* Module 3: Small Metric Tile with Arrow Button (FC & Alerts) */}
          <div
            className="socialeco-metric-tile stat-card--clickable"
            onClick={() => navigate('/admin/alerts')}
          >
            <div className="socialeco-tile-icon socialeco-tile-icon--cyan">
              <DashIcon name="shield" size={20} color="#00cfe8" />
            </div>
            <div className="socialeco-tile-value">
              {complianceSummary ? complianceSummary.expiredCount + complianceSummary.expiringSoonCount : 0}
            </div>
            <div className="socialeco-tile-sub">
              <b>Compliance Alerts</b><br />FC & Licence due
            </div>
            <button className="socialeco-tile-action-btn socialeco-tile-action-btn--cyan">
              <span>View Alerts</span>
              <span className="arrow">→</span>
            </button>
          </div>

          {/* Module 4: Purple Gradient Promo Banner */}
          <div className="socialeco-banner-card">
            <div>
              <div className="socialeco-banner-title">
                {isInstitution ? 'Daily Student Attendance & Roster' : 'Need Full Fleet Attendance & Driver Payroll?'}
              </div>
              <div className="socialeco-banner-sub">
                {isInstitution
                  ? 'Access live student boarding records, absentees, and faculty verification.'
                  : 'Access live 42-route attendance manifests, teacher submissions, and driver salary reports.'}
              </div>
            </div>

            <button
              className="socialeco-banner-btn"
              onClick={() => navigate('/admin/attendance-report')}
            >
              Open Attendance →
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 4: OPERATIONAL DETAIL TABS (LIVE TRIPS & UNASSIGNED QUEUE)              */}
        {/* ========================================================================= */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button
              className={`filter-chip ${activeViewTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('overview')}
            >
              Campus Fleet Matrix
            </button>
            <button
              className={`filter-chip ${activeViewTab === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('trips')}
            >
              Today's Live Trips ({trips?.length || 0})
            </button>
            <button
              className={`filter-chip ${activeViewTab === 'unassigned' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('unassigned')}
            >
              Unassigned Queue ({filteredUnassigned.length})
            </button>
          </div>

          {/* Tab 1: Campus Matrix */}
          {activeViewTab === 'overview' && (
            <div className="socialeco-card" style={{ padding: 0 }}>
              <div className="table-wrap" style={{ boxShadow: 'none' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Campus / Institution</th>
                      <th style={{ width: 220 }}>Route Coverage</th>
                      <th style={{ textAlign: 'center' }}>Buses</th>
                      <th style={{ textAlign: 'center' }}>Drivers</th>
                      <th style={{ textAlign: 'right' }}>Daily Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstitutionSummary.map(inst => {
                      const coveragePct = inst.totalRoutes > 0 ? Math.round((inst.assignedRoutes / inst.totalRoutes) * 100) : 0;
                      return (
                        <tr key={inst.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{inst.short_name || inst.name}</div>
                            <div style={{ fontSize: 11.5, color: '#8c98a4' }}>{inst.name}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                              <span><b>{inst.assignedRoutes}</b> of {inst.totalRoutes}</span>
                              <span style={{ fontWeight: 700, color: '#7c6cfc' }}>{coveragePct}%</span>
                            </div>
                            <div style={{ height: 6, background: '#f1f3f9', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${coveragePct}%`, background: 'linear-gradient(90deg, #7c6cfc, #6854ec)', borderRadius: 99 }} />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }} className="mono">
                            <span className="tag" style={{ background: '#f0eeff', color: '#6854ec', fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                              {inst.busesCount}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }} className="mono">
                            <span className="tag" style={{ background: '#fff5ec', color: '#ff9f43', fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                              {inst.driversCount}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }} className="mono">
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{inst.totalKm} km</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Live Trips */}
          {activeViewTab === 'trips' && (
            <div className="socialeco-card" style={{ padding: 0 }}>
              <div className="table-wrap" style={{ maxHeight: 320, boxShadow: 'none' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Shift</th>
                      <th>Bus Number</th>
                      <th>Driver</th>
                      <th>Incharge</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trips || []).map(t => (
                      <tr key={t.id}>
                        <td><b>{t.route_code}</b> {t.route_name && <span className="muted" style={{ marginLeft: 6 }}>{t.route_name}</span>}</td>
                        <td><span className="tag" style={{ background: '#f0eeff', color: '#6854ec', padding: '4px 10px', borderRadius: 8 }}>{t.shift || '—'}</span></td>
                        <td className="mono" style={{ fontWeight: 700 }}>{t.registration_number || '—'}</td>
                        <td>{t.driver_name || '—'}</td>
                        <td>{t.incharge_name || '—'}</td>
                        <td>
                          <span className={`activity-pulse-tag activity-pulse-tag--${t.status}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Unassigned Queue */}
          {activeViewTab === 'unassigned' && (
            <div className="socialeco-card" style={{ padding: 20 }}>
              {filteredUnassigned.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#28c76f' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}><DashIcon name="check" size={28} color="#28c76f" /></div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>All routes are assigned!</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {filteredUnassigned.map(r => (
                    <div key={r.id} className="action-queue-item" style={{ border: '1px solid #fee2e2', borderRadius: 12 }}>
                      <div className="action-queue-item__left">
                        <span className="action-queue-item__code" style={{ color: '#ea5455' }}>{r.route_code}</span>
                        <div className="action-queue-item__name">{r.route_name} · {r.total_distance} km</div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/admin/assignments?route=${r.id}`)}
                        style={{ fontSize: 11.5, padding: '5px 12px', background: '#f0eeff', color: '#6854ec', border: 'none', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span>Assign</span>
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


