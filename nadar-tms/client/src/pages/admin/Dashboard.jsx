import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import DonutChart from '../../components/UI/DonutChart';
import BarChart from '../../components/UI/BarChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedInstFilter, setSelectedInstFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadDashboard = () => {
    setLoading(true);
    api.dashboard()
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard load error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" /> Loading Dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty">
        <p>Could not load dashboard data.</p>
        <button className="btn btn-primary" onClick={loadDashboard} style={{ marginTop: 12 }}>
          Retry
        </button>
      </div>
    );
  }

  const isInstitution = data.isInstitution || user?.role === 'institution';

  // ===========================================================================
  // 1. INSTITUTION / CAMPUS DASHBOARD VIEW
  // ===========================================================================
  if (isInstitution) {
    const { institution, kpis, shiftOverview, campusRoster, unassignedRoutes, absentStudentsList } = data;

    return (
      <>
        {/* Campus Header */}
        <div className="page-head">
          <div>
            <div className="page-title">{institution?.name || 'Campus'} · Fleet & Attendance Hub</div>
            <div className="page-sub">Live student boarding and campus bus operations · {institution?.code || 'CAMPUS'}</div>
          </div>
          <div className="dashboard-head-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin/attendance-report')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="m9 16 2 2 4-4" />
              </svg>
              <span>Attendance Report</span>
            </button>
            <div className="live-badge">
              <span className="dot" />
              <span>CAMPUS ACTIVE</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={loadDashboard}
              title="Refresh campus data"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="page-body">
          {/* Top Operational Campus Cards */}
          <div className="cards-grid--5">
            <div className="stat-card">
              <div className="stat-card__label">Campus Buses Running</div>
              <div className="stat-card__value stat-card__value--amber">{kpis.busesRunning}</div>
              <div className="stat-card__meta">
                <span>Active for this campus</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__label">Campus Routes</div>
              <div className="stat-card__value">{kpis.routesCount}</div>
              <div className="stat-card__meta">
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{kpis.assignedRoutesCount} Assigned</span>
                {kpis.unassignedRoutesCount > 0 && (
                  <>
                    <span>·</span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{kpis.unassignedRoutesCount} Unassigned</span>
                  </>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__label">Enrolled Students</div>
              <div className="stat-card__value stat-card__value--green">{kpis.totalStudents}</div>
              <div className="stat-card__meta">
                <span>Registered on bus routes</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__label">Students Boarded Today</div>
              <div className="stat-card__value stat-card__value--green">{kpis.boardedToday}</div>
              <div className="stat-card__meta">
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{kpis.attendanceRate}% Attendance Rate</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: kpis.absentToday > 0 ? '3.5px solid #ef4444' : '3.5px solid #22c55e' }}>
              <div className="stat-card__label">Absent Today</div>
              <div className={`stat-card__value ${kpis.absentToday > 0 ? 'stat-card__value--red' : 'stat-card__value--green'}`}>
                {kpis.absentToday}
              </div>
              <div className="stat-card__meta">
                <span>{kpis.absentToday > 0 ? 'Students did not board' : 'Zero absentees reported'}</span>
              </div>
            </div>
          </div>

          {/* Shift Operations Matrix for this Campus */}
          <div style={{ marginBottom: 14 }}>
            <div className="section-h" style={{ margin: 0 }}>Campus Shift Operations Matrix</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              Active route coverage and buses deployed for {institution?.short_name || 'this campus'}
            </p>
          </div>

          <div className="shift-grid">
            {(shiftOverview || []).map(sh => {
              const isMorning = sh.shiftGroup === 'Morning';
              const isSelected = selectedShift === sh.key;
              return (
                <div
                  key={sh.key}
                  className={`shift-card ${isSelected ? 'shift-card--active' : ''}`}
                  onClick={() => setSelectedShift(isSelected ? null : sh.key)}
                  style={{ cursor: 'pointer' }}
                  title={`Click to focus on ${sh.label}`}
                >
                  <div className="shift-card-header">
                    <div className="shift-card-title">
                      <span style={{ fontSize: 18 }}>{isMorning ? '☀️' : '🌙'}</span>
                      <span>{sh.label}</span>
                    </div>
                    <span className={`shift-tag ${isMorning ? 'shift-tag--morning' : 'shift-tag--evening'}`}>
                      {sh.shiftGroup}
                    </span>
                  </div>

                  <div className="shift-metrics-grid">
                    <div className="shift-metric-item">
                      <div className="shift-metric-label">Routes</div>
                      <div className="shift-metric-val">{sh.routesCount}</div>
                    </div>
                    <div className="shift-metric-item">
                      <div className="shift-metric-label">Buses</div>
                      <div className="shift-metric-val">{sh.busesCount}</div>
                    </div>
                    <div className="shift-metric-item">
                      <div className="shift-metric-label">Drivers</div>
                      <div className="shift-metric-val">{sh.driversCount}</div>
                    </div>
                    <div className="shift-metric-item">
                      <div className="shift-metric-label">Distance</div>
                      <div className="shift-metric-val" style={{ color: '#16a34a' }}>
                        {sh.totalKm} <span style={{ fontSize: 12 }}>km</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incharge Pending Submission Alert Banner */}
          {kpis.pendingSubmissionCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              padding: '12px 18px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fcd34d',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>
                    {kpis.pendingSubmissionCount} Route Incharges Have Not Yet Submitted Today's Attendance
                  </div>
                  <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 2 }}>
                    Bus incharges are assigned to these routes but attendance submission for today is still pending.
                  </div>
                </div>
              </div>
              <button
                className="btn"
                style={{
                  background: '#d97706',
                  color: '#fff', fontSize: 12, padding: '6px 14px', fontWeight: 600, borderRadius: 6, border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/admin/attendance-report')}
              >
                Review in Attendance Report →
              </button>
            </div>
          )}

          {/* Absent Students Alert Banner (if any) */}
          {absentStudentsList && absentStudentsList.length > 0 && (
            <div className="unassigned-panel" style={{ border: '1px solid #fca5a5', background: '#fffafa' }}>
              <div className="unassigned-panel-head">
                <div className="unassigned-panel-title">
                  <span style={{ fontSize: 22 }}>⚠️</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#b91c1c' }}>Absent Students Today ({absentStudentsList.length})</h3>
                    <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                      The following students were marked absent on today's bus trips. Please follow up with parents if needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="table-wrap" style={{ maxHeight: 220 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class / Grade</th>
                      <th>Route Code</th>
                      <th>Bus Stop</th>
                      <th>Parent Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentStudentsList.map((st, idx) => (
                      <tr key={idx}>
                        <td><b>{st.name}</b></td>
                        <td>{st.classGrade}</td>
                        <td><span className="mono" style={{ fontWeight: 600 }}>{st.routeCode}</span></td>
                        <td>{st.stopName}</td>
                        <td className="mono">
                          {st.parentPhone !== '—' ? (
                            <a href={`tel:${st.parentPhone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                              📞 {st.parentPhone}
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance & Incharge Live Summary Card */}
          <div className="card" style={{ marginBottom: 24, padding: 22, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontFamily: 'Oswald', fontSize: 20, color: 'var(--navy)' }}>
                    Campus Route & Bus Attendance Summary
                  </h3>
                  <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 11, fontWeight: 700 }}>
                    LIVE TODAY
                  </span>
                </div>
                <p className="muted" style={{ fontSize: 12.5, margin: '3px 0 0' }}>
                  Complete route-wise student manifests, teacher incharge submissions, and exportable reports are located in the dedicated <b>Attendance Report</b> section in the slide bar.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/admin/attendance-report')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600 }}
                >
                  <span>Open Attendance Report & Roster</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Boarded Students</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                  {kpis.boardedToday || 0} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>/ {kpis.totalStudents || 0}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                  {kpis.attendanceRate || 0}% Campus Attendance Rate
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Submitted Routes</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                  {kpis.submittedCount || 0} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>/ {(campusRoster || []).length}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Attendance finalised
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: kpis.pendingSubmissionCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Pending Submissions</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: kpis.pendingSubmissionCount > 0 ? '#b45309' : '#15803d', marginTop: 4 }}>
                  {kpis.pendingSubmissionCount || 0}
                </div>
                <div style={{ fontSize: 11.5, color: kpis.pendingSubmissionCount > 0 ? '#b45309' : '#16a34a', fontWeight: 600, marginTop: 2 }}>
                  {kpis.pendingSubmissionCount > 0 ? 'Submissions waiting' : 'All submitted'}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>In Transit</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                  {kpis.inTransitCount || 0}
                </div>
                <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                  Buses running live
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>No Incharge</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#64748b', marginTop: 4 }}>
                  {kpis.noInchargeCount || 0}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Routes unallocated
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
              background: '#f1f5f9', padding: '12px 16px', borderRadius: 8, fontSize: 12.5
            }}>
              <span style={{ color: '#475569' }}>
                💡 <b>Looking for the full 42-route attendance roster?</b> Reassign faculty incharges, print student manifests, and download CSV reports in the slide bar.
              </span>
              <button
                onClick={() => navigate('/admin/attendance-report')}
                style={{
                  background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, fontSize: 13
                }}
              >
                Go to Attendance Report in Slide Bar →
              </button>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div
              className="card stat-card--clickable"
              onClick={() => navigate('/admin/students')}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                🎒
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 15 }}>Manage Campus Students</h4>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Enroll students, update stops, and map routes</p>
              </div>
            </div>

            <div
              className="card stat-card--clickable"
              onClick={() => navigate('/admin/users')}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.12)', color: '#d97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                🔑
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 15 }}>Bus Incharge Accounts</h4>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Create & manage teacher attendance logins</p>
              </div>
            </div>

            <div
              className="card stat-card--clickable"
              onClick={() => navigate('/admin/assignments')}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(46, 158, 107, 0.12)', color: '#16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                🔗
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 15 }}>Assign Bus Incharges</h4>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Allocate teachers to specific bus routes & shifts</p>
              </div>
            </div>

            <div
              className="card stat-card--clickable"
              onClick={() => navigate('/admin/drivers?masterEdit=true')}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
              title="Open Driver Master Edit (Name, Bus No, Route, Institution)"
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                ⚡
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 15 }}>Driver Master Edit</h4>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Edit driver name, bus no, route & campus institution</p>
              </div>
            </div>
          </div>
        </div>

      </>
    );
  }

  // ===========================================================================
  // 2. ADMIN / EXECUTIVE CENTRAL CONTROL ROOM DASHBOARD
  // ===========================================================================
  const { kpis, shiftOverview, unassignedRoutes, institutionSummary, complianceSummary, trips } = data;

  // Filter unassigned routes by institution and search query
  const filteredUnassigned = (unassignedRoutes || []).filter(r => {
    const matchesInst = selectedInstFilter === 'ALL' || String(r.institution_id) === String(selectedInstFilter);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      String(r.route_code || '').toLowerCase().includes(q) ||
      String(r.route_name || '').toLowerCase().includes(q) ||
      String(r.institution_name || '').toLowerCase().includes(q);
    return matchesInst && matchesSearch;
  });

  const instRows = (institutionSummary || []).map(inst => ({
    label: inst.short_name || inst.name,
    value: inst.totalRoutes,
    sub: `${inst.totalKm} km`,
  }));

  const pillCls = (s) => (s === 'running' ? 'tag tag--ok' : s === 'completed' ? 'tag tag--off' : 'tag tag--warn');

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="page-title">TMHNU Fleet Control Hub</div>
          <div className="page-sub">Central real-time fleet overview · Theni</div>
        </div>
        <div className="dashboard-head-actions">
          <div className="live-badge">
            <span className="dot" />
            <span>LIVE FLEET ACTIVE</span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={loadDashboard}
            title="Refresh dashboard data"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Top Operational KPI Cards */}
        <div className="cards-grid--5">
          <div className="stat-card">
            <div className="stat-card__label">Active Fleet Buses</div>
            <div className="stat-card__value stat-card__value--amber">{kpis.activeBuses}</div>
            <div className="stat-card__meta">
              <span>{kpis.totalBuses} buses in fleet</span>
              {kpis.inactiveBuses > 0 && <span style={{ color: '#ef4444' }}>({kpis.inactiveBuses} idle/shop)</span>}
            </div>
          </div>

          <div
            className="stat-card stat-card--clickable"
            onClick={() => navigate('/admin/driver-master-edit')}
            title="Click to open Driver Master Edit (Name, Bus No, Route, Institution)"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-card__label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Duty Drivers</span>
              <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>⚡ Master Edit →</span>
            </div>
            <div className="stat-card__value stat-card__value--green">{kpis.activeDrivers}</div>
            <div className="stat-card__meta">
              <span>{kpis.totalDrivers} drivers registered · Click to edit</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Total Routes</div>
            <div className="stat-card__value">{kpis.totalRoutes}</div>
            <div className="stat-card__meta">
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{kpis.assignedRoutesCount} Assigned</span>
              <span>·</span>
              <span style={{ color: kpis.unassignedRoutesCount > 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                {kpis.unassignedRoutesCount} Unassigned
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Total Planned Daily KM</div>
            <div className="stat-card__value stat-card__value--green">
              {Number(kpis.totalDailyKm).toLocaleString()} <span style={{ fontSize: 16 }}>km</span>
            </div>
            <div className="stat-card__meta">
              <span>Combined across all 4 shifts</span>
            </div>
          </div>

          <div
            className="stat-card stat-card--clickable"
            onClick={() => navigate('/admin/alerts')}
            title="Click to view all FC & Compliance Alerts"
            style={{ borderLeft: '3.5px solid #ef4444' }}
          >
            <div className="stat-card__label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>FC & Compliance</span>
              <span style={{ color: '#ef4444' }}>View →</span>
            </div>
            <div className="stat-card__value stat-card__value--red">{kpis.fcAlertsTotal}</div>
            <div className="stat-card__meta">
              <span style={{ color: '#dc2626', fontWeight: 600 }}>{kpis.fcExpiredCount} Expired</span>
              <span>·</span>
              <span>{kpis.fcExpiringSoonCount} due in 30d</span>
            </div>
          </div>
        </div>

        {/* Section 1: Shift & Trip Operations Overview */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="section-h" style={{ margin: 0 }}>Shift & Trip Operations Matrix</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              Daily route coverage, bus deployment, and distance for Morning 1, Morning 2, Evening 1, Evening 2
            </p>
          </div>
        </div>

        <div className="shift-grid">
          {(shiftOverview || []).map(sh => {
            const isMorning = sh.shiftGroup === 'Morning';
            const isSelected = selectedShift === sh.key;
            return (
              <div
                key={sh.key}
                className={`shift-card ${isSelected ? 'shift-card--active' : ''}`}
                onClick={() => setSelectedShift(isSelected ? null : sh.key)}
                style={{ cursor: 'pointer' }}
                title={`Click to focus on ${sh.label}`}
              >
                <div className="shift-card-header">
                  <div className="shift-card-title">
                    <span style={{ fontSize: 18 }}>{isMorning ? '☀️' : '🌙'}</span>
                    <span>{sh.label}</span>
                  </div>
                  <span className={`shift-tag ${isMorning ? 'shift-tag--morning' : 'shift-tag--evening'}`}>
                    {sh.shiftGroup}
                  </span>
                </div>

                <div className="shift-metrics-grid">
                  <div className="shift-metric-item">
                    <div className="shift-metric-label">Routes</div>
                    <div className="shift-metric-val">{sh.routesCount}</div>
                  </div>
                  <div className="shift-metric-item">
                    <div className="shift-metric-label">Buses</div>
                    <div className="shift-metric-val">{sh.busesCount}</div>
                  </div>
                  <div className="shift-metric-item">
                    <div className="shift-metric-label">Drivers</div>
                    <div className="shift-metric-val">{sh.driversCount}</div>
                  </div>
                  <div className="shift-metric-item">
                    <div className="shift-metric-label">Shift Distance</div>
                    <div className="shift-metric-val" style={{ color: '#16a34a' }}>
                      {sh.totalKm} <span style={{ fontSize: 12 }}>km</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Unassigned Routes Tracker */}
        <div className="unassigned-panel">
          <div className="unassigned-panel-head">
            <div className="unassigned-panel-title">
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0 }}>Unassigned & Missing Shift Tracker</h3>
                <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                  Routes requiring vehicle/driver assignment to prevent operational disruptions
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                className="finput"
                placeholder="Search route code or town..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: 220, height: 36, padding: '4px 10px', fontSize: 13 }}
              />
              <button
                className="btn btn-outline"
                onClick={() => navigate('/admin/drivers?masterEdit=true')}
                style={{ whiteSpace: 'nowrap', fontSize: 12.5, padding: '7px 14px', borderColor: '#0284c7', color: '#0369a1', fontWeight: 600 }}
                title="Open Master Edit to map Driver Name, Bus No, Route, and Institution"
              >
                ⚡ Driver Master Edit
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/assignments')}
                style={{ whiteSpace: 'nowrap', fontSize: 12.5, padding: '7px 14px' }}
              >
                Go to Assign Route →
              </button>
            </div>
          </div>

          {/* Campus Filter Chips */}
          <div className="filter-chips">
            <button
              className={`filter-chip ${selectedInstFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedInstFilter('ALL')}
            >
              All Campuses ({unassignedRoutes.length})
            </button>
            {(institutionSummary || []).map(inst => (
              <button
                key={inst.id}
                className={`filter-chip ${String(selectedInstFilter) === String(inst.id) ? 'active' : ''}`}
                onClick={() => setSelectedInstFilter(inst.id)}
              >
                {inst.short_name} ({inst.unassignedRoutes})
              </button>
            ))}
          </div>

          {/* Unassigned Routes List */}
          {filteredUnassigned.length === 0 ? (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '16px 20px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#166534',
            }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <strong>No Unassigned Routes Found</strong>
                <p style={{ margin: 0, fontSize: 12.5, color: '#15803d' }}>
                  {unassignedRoutes.length === 0
                    ? 'All 189 routes across TMHNU campuses are successfully assigned!'
                    : 'No unassigned routes match your selected campus filter or search criteria.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 340 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Campus / Institution</th>
                    <th>Distance</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnassigned.map(r => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.route_code}</b> · {r.route_name || '—'}
                      </td>
                      <td>
                        <span className="tag" style={{ background: '#f1f5f9', color: '#334155' }}>
                          {r.institution_name}
                        </span>
                      </td>
                      <td className="mono">
                        {r.total_distance ? `${r.total_distance} km` : '—'}
                      </td>
                      <td>
                        <span className="tag tag--warn" style={{ color: '#b91c1c', background: '#fee2e2' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>
                        {r.reason}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '3px 9px', fontSize: 11.5 }}
                          onClick={() => navigate(`/admin/assignments?route=${r.id}`)}
                        >
                          Assign Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Fleet Health, Compliance & Campus Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Fleet Availability Donut */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-card__label" style={{ marginBottom: 12 }}>
              Bus Fleet Availability
            </div>
            <DonutChart active={kpis.activeBuses} total={kpis.totalBuses} color="#F4A521" size={130} />
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              <strong>{kpis.activeBuses} active</strong> · {kpis.inactiveBuses} idle or in workshop
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11.5, padding: '4px 10px' }}
                onClick={() => navigate('/admin/buses')}
              >
                View Bus Inventory →
              </button>
            </div>
          </div>

          {/* Driver Duty Strength Donut */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-card__label" style={{ marginBottom: 12 }}>
              Driver Duty Strength
            </div>
            <DonutChart active={kpis.activeDrivers} total={kpis.totalDrivers} color="#2E9E6B" size={130} />
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              <strong>{kpis.activeDrivers} active drivers</strong> · {kpis.inactiveDrivers} on leave / standby
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 11.5, padding: '4px 10px' }}
                onClick={() => navigate('/admin/drivers')}
              >
                View Driver Roster →
              </button>
            </div>
          </div>

          {/* FC & Compliance Health Card */}
          <div className="compliance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="stat-card__label" style={{ margin: 0 }}>
                Vehicle Compliance Status
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: 11 }}
                onClick={() => navigate('/admin/alerts')}
              >
                View Alerts →
              </button>
            </div>

            <div className="compliance-stat-row">
              <div className="compliance-badge-box compliance-badge-box--red">
                <div className="compliance-badge-number">{complianceSummary.expiredCount}</div>
                <div className="compliance-badge-label">Expired Docs</div>
              </div>
              <div className="compliance-badge-box compliance-badge-box--amber">
                <div className="compliance-badge-number">{complianceSummary.expiringSoonCount}</div>
                <div className="compliance-badge-label">Expiring in 30d</div>
              </div>
            </div>

            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
              Most Urgent Compliance Items
            </div>

            <div>
              {(complianceSummary.urgentList || []).slice(0, 4).map((alert, idx) => (
                <div key={idx} className="urgent-alert-item">
                  <div>
                    <b>{alert.subject}</b>
                    <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>({alert.type})</span>
                  </div>
                  <div>
                    {alert.expired ? (
                      <span className="tag" style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11 }}>
                        Overdue by {Math.abs(alert.daysLeft)}d
                      </span>
                    ) : (
                      <span className="tag" style={{ background: '#fef3c7', color: '#b45309', fontSize: 11 }}>
                        Due in {alert.daysLeft}d
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Institution Distance & Route Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card">
            <div className="stat-card__label" style={{ marginBottom: 12 }}>
              Route Distribution by Campus
            </div>
            <BarChart rows={instRows} />
          </div>

          <div className="card">
            <div className="stat-card__label" style={{ marginBottom: 12 }}>
              Campus Daily Fleet Distance (KM)
            </div>
            <div className="table-wrap" style={{ boxShadow: 'none' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Campus</th>
                    <th>Routes</th>
                    <th>Buses</th>
                    <th>Daily KM</th>
                  </tr>
                </thead>
                <tbody>
                  {(institutionSummary || []).map(inst => (
                    <tr key={inst.id}>
                      <td><b>{inst.short_name}</b></td>
                      <td>{inst.totalRoutes}</td>
                      <td>{inst.busesCount}</td>
                      <td className="mono" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {inst.totalKm} km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 5: Today's Live Trips Feed (if any trips exist today) */}
        {trips && trips.length > 0 && (
          <>
            <div className="section-h">Today's Active Trips Feed</div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Shift</th>
                    <th>Bus</th>
                    <th>Driver</th>
                    <th>Incharge</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(t => (
                    <tr key={t.id}>
                      <td><b>{t.route_code}</b> · {t.route_name || ''}</td>
                      <td>
                        <span className="tag" style={{ background: '#f1f5f9' }}>
                          {t.shift || '—'}
                        </span>
                      </td>
                      <td className="mono">{t.registration_number || '—'}</td>
                      <td>{t.driver_name || '—'}</td>
                      <td>{t.incharge_name || '—'}</td>
                      <td><span className={pillCls(t.status)}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
