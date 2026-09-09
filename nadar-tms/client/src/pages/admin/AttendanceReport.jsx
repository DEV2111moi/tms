import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

export default function AttendanceReport() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [rosterShiftFilter, setRosterShiftFilter] = useState('ALL');
  const [submissionFilter, setSubmissionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [assignModalData, setAssignModalData] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedInchargeId, setSelectedInchargeId] = useState('');
  const [showNewInchargeInput, setShowNewInchargeInput] = useState(false);
  const [newInchargeName, setNewInchargeName] = useState('');
  const [newInchargePhone, setNewInchargePhone] = useState('');
  const [newInchargeEmail, setNewInchargeEmail] = useState('');
  const [assignError, setAssignError] = useState('');

  const [routeReportModal, setRouteReportModal] = useState(null);
  const [allRoutesReportModal, setAllRoutesReportModal] = useState(false);

  const loadAttendanceData = (dateToFetch) => {
    setLoading(true);
    const d = dateToFetch || selectedDate;
    api.dashboard(d)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading attendance report data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAttendanceData(selectedDate);
  }, [selectedDate]);

  // Helper: Download CSV
  const downloadCSV = (filename, headers, rows) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Print formatted popup window
  const printReportWindow = (title, htmlBody) => {
    const printWin = window.open('', '_blank', 'width=920,height=800');
    if (!printWin) {
      alert('Please allow popups in your browser to print the report.');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; padding: 18px; margin: 0; font-size: 12px; line-height: 1.4; }
          .print-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
          .inst-name { font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .inst-sub { font-size: 11.5px; color: #475569; margin-top: 2px; }
          .report-title { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 14px; font-size: 11px; }
          .meta-item b { color: #475569; display: block; font-size: 10px; text-transform: uppercase; margin-bottom: 2px; }
          .kpi-row { display: flex; gap: 10px; margin-bottom: 14px; }
          .kpi-box { flex: 1; border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; text-align: center; background: #ffffff; }
          .kpi-val { font-size: 17px; font-weight: 800; color: #0f172a; }
          .kpi-lbl { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: left; }
          th { background: #f1f5f9; color: #0f172a; font-weight: 700; }
          .status-present { color: #15803d; font-weight: 700; }
          .status-absent { color: #b91c1c; font-weight: 700; }
          .status-pending { color: #b45309; font-weight: 600; }
          .sign-row { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px; }
          .sign-box { text-align: center; width: 180px; border-top: 1px solid #334155; padding-top: 6px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  const statusPill = (item) => {
    const st = item.submissionStatus;
    if (st === 'submitted') {
      return (
        <span className="tag tag--ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontWeight: 600 }}>
          <span>✓</span> Submitted
        </span>
      );
    }
    if (st === 'in_transit') {
      return (
        <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', fontWeight: 600 }}>
          <span>🚌</span> In Transit
        </span>
      );
    }
    if (st === 'pending') {
      return (
        <span className="tag tag--warn" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px' }}>
          <span>⚠️</span> Not Submitted
        </span>
      );
    }
    return (
      <span className="tag" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px' }}>
        <span>⭕</span> No Incharge
      </span>
    );
  };

  // Open Assign Modal
  const openAssignModal = (item) => {
    setAssignModalData(item);
    setSelectedInchargeId(item.incharge_id ? String(item.incharge_id) : '');
    setShowNewInchargeInput(false);
    setNewInchargeName('');
    setNewInchargePhone('');
    setNewInchargeEmail('');
    setAssignError('');
  };

  // Save Assignment
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignModalData) return;
    setAssignLoading(true);
    setAssignError('');

    try {
      let inchargeIdToAssign = selectedInchargeId === 'NEW' ? null : (selectedInchargeId ? Number(selectedInchargeId) : null);

      if (selectedInchargeId === 'NEW' || showNewInchargeInput) {
        if (!newInchargeName.trim()) {
          setAssignError('Please enter teacher / incharge name.');
          setAssignLoading(false);
          return;
        }
        const generatedEmail = newInchargeEmail.trim() || `incharge.${Date.now()}@tmhnu.edu.in`;
        const createdUser = await api.saveRes('users', {
          name: newInchargeName.trim(),
          phone: newInchargePhone.trim() || null,
          email: generatedEmail,
          password: 'Password@123',
          role: 'incharge',
          institution_id: data.institution?.id || 1,
        });
        inchargeIdToAssign = createdUser.id;
      }

      await api.assign({
        route_id: assignModalData.route_id,
        shift: assignModalData.shift,
        incharge_id: inchargeIdToAssign,
      });

      // Optimistic update
      if (data && data.campusRoster) {
        const availableIncharges = data.inchargesList || [];
        const selectedObj = availableIncharges.find(u => Number(u.id) === Number(inchargeIdToAssign));
        const updatedName = (selectedInchargeId === 'NEW' || showNewInchargeInput) ? newInchargeName.trim() : (selectedObj ? selectedObj.name : '—');
        const updatedPhone = (selectedInchargeId === 'NEW' || showNewInchargeInput) ? newInchargePhone.trim() : (selectedObj ? (selectedObj.phone || '—') : '—');

        const updatedRoster = data.campusRoster.map(r => {
          if (r.id === assignModalData.id || (r.route_id === assignModalData.route_id && r.shift === assignModalData.shift)) {
            const hasInc = !!inchargeIdToAssign;
            let subStatus = r.submissionStatus;
            let attStatus = r.attendanceStatus;
            if (subStatus === 'no_incharge' && hasInc) {
              subStatus = 'pending';
              attStatus = 'Pending Submission';
            } else if (!hasInc && (subStatus === 'pending' || subStatus === 'no_incharge')) {
              subStatus = 'no_incharge';
              attStatus = 'No Incharge';
            }
            return {
              ...r,
              incharge_id: inchargeIdToAssign,
              incharge_name: inchargeIdToAssign ? updatedName : '—',
              incharge_phone: inchargeIdToAssign ? updatedPhone : '—',
              hasIncharge: hasInc,
              submissionStatus: subStatus,
              attendanceStatus: attStatus,
            };
          }
          return r;
        });

        setData(prev => ({
          ...prev,
          campusRoster: updatedRoster,
          kpis: {
            ...prev.kpis,
            pendingSubmissionCount: updatedRoster.filter(x => x.submissionStatus === 'pending').length,
            noInchargeCount: updatedRoster.filter(x => x.submissionStatus === 'no_incharge').length,
          }
        }));
      }

      setAssignModalData(null);
      setAssignLoading(false);
      loadAttendanceData();
    } catch (err) {
      console.error('Assignment error:', err);
      setAssignError(err.message || 'Failed to save incharge assignment.');
      setAssignLoading(false);
    }
  };

  // Open Route Report Modal
  const openRouteReport = (item) => {
    setRouteReportModal({ route: item, data: null, loading: true, error: null });
    api.report(selectedDate, item.route_id, item.shift)
      .then(rep => {
        setRouteReportModal({ route: item, data: rep, loading: false, error: null });
      })
      .catch(err => {
        console.error('Error loading route report:', err);
        setRouteReportModal(prev => prev ? { ...prev, loading: false, error: 'Could not load route attendance report.' } : null);
      });
  };

  // Print single route report
  const handlePrintRouteReport = () => {
    if (!routeReportModal || !routeReportModal.data) return;
    const rep = routeReportModal.data;
    const r = routeReportModal.route;
    const routeInfo = rep.routeInfo || r;
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const html = `
      <div class="print-header">
        <div class="inst-name">${data?.institution?.name || 'THENI MELAPETTAI HINDU NADARGAL URAVINMURAI'}</div>
        <div class="inst-sub">Autonomous Institution · Transport Operations Department · Theni</div>
        <div class="report-title">Daily Route Attendance Roster & Audit Report</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><b>Route</b>${routeInfo.route_code} · ${routeInfo.route_name}</div>
        <div class="meta-item"><b>Shift</b>${String(r.shift || '').toUpperCase()}</div>
        <div class="meta-item"><b>Bus Registration</b>${routeInfo.registration_number || r.registration_number || '—'}</div>
        <div class="meta-item"><b>Report Date</b>${formattedDate}</div>
        <div class="meta-item"><b>Driver</b>${routeInfo.driver_name || r.driver_name || '—'}</div>
        <div class="meta-item"><b>Driver Phone</b>${routeInfo.driver_phone || r.driver_phone || '—'}</div>
        <div class="meta-item"><b>Bus Incharge</b>${routeInfo.incharge_name || r.incharge_name || '—'}</div>
        <div class="meta-item"><b>Submission Status</b>${r.attendanceStatus || 'Scheduled'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box"><div class="kpi-val">${rep.summary.total}</div><div class="kpi-lbl">Total Enrolled</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #15803d">${rep.summary.present}</div><div class="kpi-lbl">Boarded (Present)</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #b91c1c">${rep.summary.absent}</div><div class="kpi-lbl">Absent</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #b45309">${rep.summary.notMarked || 0}</div><div class="kpi-lbl">Pending / Unmarked</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #0284c7">${rep.summary.rate}%</div><div class="kpi-lbl">Attendance Rate</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 45px">S.No</th>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Department / Class</th>
            <th>Boarding Stop</th>
            <th>Boarding Time</th>
            <th>Status</th>
            <th>Parent Mobile</th>
          </tr>
        </thead>
        <tbody>
          ${(rep.rows || []).map((st, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><b>${st.student_id}</b></td>
              <td>${st.name}</td>
              <td>${st.class_grade || '—'}</td>
              <td>${st.stop_name || '—'}</td>
              <td>${st.boarding_time ? new Date(st.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              <td class="${st.status === 'present' ? 'status-present' : st.status === 'absent' ? 'status-absent' : 'status-pending'}">
                ${st.status === 'present' ? '✓ PRESENT' : st.status === 'absent' ? '✕ ABSENT' : '— PENDING'}
              </td>
              <td>${st.parent_phone || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="sign-row">
        <div class="sign-box">Bus Incharge Signature</div>
        <div class="sign-box">Transport Coordinator</div>
        <div class="sign-box">Principal / Authority</div>
      </div>
    `;

    printReportWindow(`Route_${r.route_code}_Attendance_${selectedDate}`, html);
  };

  // Export single route CSV
  const handleExportRouteCSV = () => {
    if (!routeReportModal || !routeReportModal.data) return;
    const rep = routeReportModal.data;
    const r = routeReportModal.route;
    const headers = ['S.No', 'Student ID', 'Student Name', 'Class / Department', 'Route', 'Bus Stop', 'Boarding Time', 'Attendance Status', 'Parent Mobile'];
    const rows = (rep.rows || []).map((st, idx) => [
      idx + 1,
      st.student_id,
      st.name,
      st.class_grade || '—',
      r.route_code,
      st.stop_name || '—',
      st.boarding_time ? new Date(st.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      st.status ? st.status.toUpperCase() : 'PENDING',
      st.parent_phone || '—'
    ]);
    downloadCSV(`${r.route_code}_${r.shift}_Attendance_${selectedDate}.csv`, headers, rows);
  };

  // Print All Routes Consolidated Report
  const handlePrintAllRoutesReport = () => {
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const kpis = data?.kpis || {};
    const campusRoster = data?.campusRoster || [];
    const inst = data?.institution;

    const html = `
      <div class="print-header">
        <div class="inst-name">${inst?.name || 'THENI MELAPETTAI HINDU NADARGAL URAVINMURAI'}</div>
        <div class="inst-sub">Autonomous Institution · Transport Operations Department · Theni</div>
        <div class="report-title">Campus Consolidated Route Attendance & Incharge Audit Report</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><b>Campus</b>${inst?.short_name || 'Campus'} (${inst?.code || 'CAMPUS'})</div>
        <div class="meta-item"><b>Report Date</b>${formattedDate}</div>
        <div class="meta-item"><b>Total Campus Routes</b>${kpis.routesCount || campusRoster.length}</div>
        <div class="meta-item"><b>Fleet Buses Running</b>${kpis.busesRunning || '—'}</div>
        <div class="meta-item"><b>Submitted Today</b>${kpis.submittedCount || 0} Routes</div>
        <div class="meta-item"><b>Pending Submission</b>${kpis.pendingSubmissionCount || 0} Routes</div>
        <div class="meta-item"><b>In Transit</b>${kpis.inTransitCount || 0} Routes</div>
        <div class="meta-item"><b>No Incharge</b>${kpis.noInchargeCount || 0} Routes</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box"><div class="kpi-val">${kpis.totalStudents || 0}</div><div class="kpi-lbl">Registered Students</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #15803d">${kpis.boardedToday || 0}</div><div class="kpi-lbl">Boarded Today</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #b91c1c">${kpis.absentToday || 0}</div><div class="kpi-lbl">Total Absent</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #0284c7">${kpis.attendanceRate || 0}%</div><div class="kpi-lbl">Campus Attendance Rate</div></div>
        <div class="kpi-box"><div class="kpi-val" style="color: #d97706">${kpis.totalDailyKm || 0} km</div><div class="kpi-lbl">Daily Fleet Distance</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px">S.No</th>
            <th>Route</th>
            <th>Shift</th>
            <th>Bus Number</th>
            <th>Driver Details</th>
            <th>Bus Incharge</th>
            <th>Enrolled</th>
            <th>Boarded</th>
            <th>Absent</th>
            <th>Attendance %</th>
            <th>Incharge Status</th>
          </tr>
        </thead>
        <tbody>
          ${campusRoster.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><b>${item.route_code}</b> · ${item.route_name}</td>
              <td>${item.shift}</td>
              <td><b>${item.registration_number}</b></td>
              <td>${item.driver_name} ${item.driver_phone !== '—' ? '(' + item.driver_phone + ')' : ''}</td>
              <td>${item.incharge_name} ${item.incharge_phone !== '—' ? '(' + item.incharge_phone + ')' : ''}</td>
              <td>${item.enrolledStudents}</td>
              <td style="color: #15803d; font-weight: 700">${item.boardedCount}</td>
              <td style="color: #b91c1c; font-weight: 700">${item.absentCount}</td>
              <td><b>${item.attendanceRate}%</b></td>
              <td>
                ${item.submissionStatus === 'submitted' ? '<span style="color: #15803d; font-weight: 700">✓ Submitted</span>' :
                  item.submissionStatus === 'in_transit' ? '<span style="color: #0369a1; font-weight: 700">🚌 In Transit</span>' :
                  item.submissionStatus === 'pending' ? '<span style="color: #b45309; font-weight: 700">⚠️ Not Submitted</span>' :
                  '<span style="color: #64748b">No Incharge</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="sign-row">
        <div class="sign-box">Fleet Supervisor</div>
        <div class="sign-box">Campus Transport Officer</div>
        <div class="sign-box">Principal / Dean</div>
      </div>
    `;

    printReportWindow(`Campus_All_Routes_Attendance_${selectedDate}`, html);
  };

  // Export Consolidated CSV
  const handleExportAllRoutesCSV = () => {
    const campusRoster = data?.campusRoster || [];
    const headers = ['S.No', 'Route Code', 'Route Name', 'Shift', 'Bus Number', 'Driver Name', 'Driver Phone', 'Bus Incharge', 'Incharge Phone', 'Enrolled Students', 'Students Boarded', 'Absent Students', 'Attendance Rate %', 'Submission Status'];
    const rows = campusRoster.map((item, idx) => [
      idx + 1,
      item.route_code,
      item.route_name,
      item.shift,
      item.registration_number,
      item.driver_name,
      item.driver_phone,
      item.incharge_name,
      item.incharge_phone,
      item.enrolledStudents,
      item.boardedCount,
      item.absentCount,
      `${item.attendanceRate}%`,
      item.attendanceStatus,
    ]);
    downloadCSV(`${data?.institution?.code || 'Campus'}_All_Routes_Attendance_${selectedDate}.csv`, headers, rows);
  };

  if (loading && !data) {
    return (
      <div className="loading-center">
        <div className="spinner" /> Loading Attendance Reports...
      </div>
    );
  }

  const { institution, kpis = {}, campusRoster = [], inchargesList = [], absentStudentsList = [] } = data || {};

  // Filtered Roster
  const filteredRoster = campusRoster.filter(item => {
    const matchesShift = rosterShiftFilter === 'ALL' || item.shift === rosterShiftFilter;
    const matchesSubmission = submissionFilter === 'ALL' ||
      (submissionFilter === 'pending' && item.submissionStatus === 'pending') ||
      (submissionFilter === 'submitted' && item.submissionStatus === 'submitted') ||
      (submissionFilter === 'in_transit' && item.submissionStatus === 'in_transit') ||
      (submissionFilter === 'no_incharge' && item.submissionStatus === 'no_incharge');

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      String(item.route_code || '').toLowerCase().includes(q) ||
      String(item.route_name || '').toLowerCase().includes(q) ||
      String(item.registration_number || '').toLowerCase().includes(q) ||
      String(item.driver_name || '').toLowerCase().includes(q) ||
      String(item.incharge_name || '').toLowerCase().includes(q);

    return matchesShift && matchesSubmission && matchesSearch;
  });

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="page-title">
            {institution?.name || 'Campus'} · Attendance Reports
          </div>
          <div className="page-sub">
            Route-wise student manifest, bus incharge submission tracking, and consolidated reports · {institution?.code || 'CAMPUS'}
          </div>
        </div>
        <div className="dashboard-head-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Date:</span>
            <input
              type="date"
              className="finput"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: '5px 10px', height: 34, fontSize: 12.5 }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setAllRoutesReportModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Consolidated Report</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => loadAttendanceData(selectedDate)}
            title="Refresh attendance records"
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
        {/* KPI Summary Ribbon */}
        <div className="cards-grid--5" style={{ marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-card__label">Campus Routes</div>
            <div className="stat-card__value">{kpis.routesCount || 0}</div>
            <div className="stat-card__meta">
              <span>{kpis.assignedRoutesCount || 0} active assignments</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Registered Riders</div>
            <div className="stat-card__value stat-card__value--green">{kpis.totalStudents || 0}</div>
            <div className="stat-card__meta">
              <span>Enrolled campus students</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Boarded Today</div>
            <div className="stat-card__value stat-card__value--green">{kpis.boardedToday || 0}</div>
            <div className="stat-card__meta">
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{kpis.attendanceRate || 0}% Attendance Rate</span>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: kpis.absentToday > 0 ? '3.5px solid #ef4444' : '3.5px solid #22c55e' }}>
            <div className="stat-card__label">Absent Today</div>
            <div className={`stat-card__value ${kpis.absentToday > 0 ? 'stat-card__value--red' : 'stat-card__value--green'}`}>
              {kpis.absentToday || 0}
            </div>
            <div className="stat-card__meta">
              <span>{kpis.absentToday > 0 ? 'Students marked absent' : 'No absentees reported'}</span>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: kpis.pendingSubmissionCount > 0 ? '3.5px solid #f59e0b' : '3.5px solid #22c55e' }}>
            <div className="stat-card__label">Pending Submissions</div>
            <div className={`stat-card__value ${kpis.pendingSubmissionCount > 0 ? 'stat-card__value--amber' : 'stat-card__value--green'}`}>
              {kpis.pendingSubmissionCount || 0}
            </div>
            <div className="stat-card__meta">
              <span>{kpis.submittedCount || 0} submitted · {kpis.inTransitCount || 0} running</span>
            </div>
          </div>
        </div>

        {/* Pending Incharges Alert Banner */}
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
                  {kpis.pendingSubmissionCount} Route Incharges Have Not Yet Submitted Attendance
                </div>
                <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 2 }}>
                  Teachers have been allocated to these routes but attendance submission for {selectedDate} is still pending.
                </div>
              </div>
            </div>
            <button
              className="btn"
              style={{
                background: submissionFilter === 'pending' ? '#92400e' : '#d97706',
                color: '#fff', fontSize: 12, padding: '6px 14px', fontWeight: 600, borderRadius: 6, border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setSubmissionFilter(submissionFilter === 'pending' ? 'ALL' : 'pending')}
            >
              {submissionFilter === 'pending' ? '✕ Clear Filter' : `View ${kpis.pendingSubmissionCount} Pending Routes`}
            </button>
          </div>
        )}

        {/* Absent Students Alert Banner (if any) */}
        {absentStudentsList && absentStudentsList.length > 0 && (
          <div className="unassigned-panel" style={{ border: '1px solid #fca5a5', background: '#fffafa', marginBottom: 16 }}>
            <div className="unassigned-panel-head">
              <div className="unassigned-panel-title">
                <span style={{ fontSize: 22 }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, color: '#b91c1c' }}>Absent Students ({absentStudentsList.length})</h3>
                  <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                    The following students were marked absent on bus trips for {selectedDate}.
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

        {/* Main Attendance Table Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontFamily: 'Oswald', fontSize: 20, color: 'var(--navy)' }}>
                  Campus Route & Bus Attendance Roster
                </h3>
                <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 11, fontWeight: 700 }}>
                  {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12.5, margin: '2px 0 0' }}>
                Live route attendance, incharge submissions, and student manifests
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setAllRoutesReportModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}
              >
                📊 Consolidated Report
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleExportAllRoutesCSV}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 12px' }}
              >
                📥 Export CSV
              </button>
              <input
                type="text"
                className="finput"
                placeholder="Search route, bus, driver, or incharge"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: 260, height: 36, padding: '4px 12px', fontSize: 13 }}
              />
            </div>
          </div>

          {/* Submission Status Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>SUBMISSION STATUS:</span>
            <button
              className={`filter-chip ${submissionFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSubmissionFilter('ALL')}
            >
              All Routes ({campusRoster.length})
            </button>
            <button
              className={`filter-chip ${submissionFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setSubmissionFilter('pending')}
              style={submissionFilter === 'pending' ? { background: '#d97706', borderColor: '#d97706' } : {}}
            >
              ⚠️ Pending Submission ({kpis.pendingSubmissionCount || 0})
            </button>
            <button
              className={`filter-chip ${submissionFilter === 'submitted' ? 'active' : ''}`}
              onClick={() => setSubmissionFilter('submitted')}
              style={submissionFilter === 'submitted' ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
            >
              ✓ Submitted ({kpis.submittedCount || 0})
            </button>
            <button
              className={`filter-chip ${submissionFilter === 'in_transit' ? 'active' : ''}`}
              onClick={() => setSubmissionFilter('in_transit')}
              style={submissionFilter === 'in_transit' ? { background: '#0284c7', borderColor: '#0284c7' } : {}}
            >
              🚌 In Transit ({kpis.inTransitCount || 0})
            </button>
            <button
              className={`filter-chip ${submissionFilter === 'no_incharge' ? 'active' : ''}`}
              onClick={() => setSubmissionFilter('no_incharge')}
            >
              No Incharge ({kpis.noInchargeCount || 0})
            </button>
          </div>

          {/* Shift Filter Chips */}
          <div className="filter-chips" style={{ marginBottom: 14 }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 600, marginRight: 6 }}>SHIFT:</span>
            <button
              className={`filter-chip ${rosterShiftFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setRosterShiftFilter('ALL')}
            >
              All Shifts
            </button>
            {['morning1', 'morning2', 'evening1', 'evening2'].map(sh => (
              <button
                key={sh}
                className={`filter-chip ${rosterShiftFilter === sh ? 'active' : ''}`}
                onClick={() => setRosterShiftFilter(sh)}
              >
                {sh === 'morning1' ? 'Morning 1' : sh === 'morning2' ? 'Morning 2' : sh === 'evening1' ? 'Evening 1' : 'Evening 2'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="table-wrap" style={{ maxHeight: 520 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>S.NO</th>
                  <th>Route</th>
                  <th>Shift</th>
                  <th>Bus Number</th>
                  <th>Driver Details</th>
                  <th>Bus Incharge</th>
                  <th>Student Boarding</th>
                  <th>Submission Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.length > 0 ? (
                  filteredRoster.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <b>{item.route_code}</b> · {item.route_name}
                      </td>
                      <td>
                        <span className={`shift-tag ${item.shift?.startsWith('morning') ? 'shift-tag--morning' : 'shift-tag--evening'}`}>
                          {item.shift}
                        </span>
                      </td>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {item.registration_number}
                      </td>
                      <td>
                        <div><b>{item.driver_name}</b></div>
                        {item.driver_phone !== '—' && (
                          <div className="muted" style={{ fontSize: 11 }}>📞 {item.driver_phone}</div>
                        )}
                      </td>
                      <td>
                        {item.hasIncharge ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{item.incharge_name}</div>
                              {item.incharge_phone !== '—' && (
                                <div className="muted" style={{ fontSize: 11 }}>📞 {item.incharge_phone}</div>
                              )}
                            </div>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '2px 7px', fontSize: 11, whiteSpace: 'nowrap' }}
                              onClick={() => openAssignModal(item)}
                              title="Reassign another incharge"
                            >
                              ✎ Reassign
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 11, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fca5a5', fontWeight: 700 }}
                            onClick={() => openAssignModal(item)}
                            title="Assign bus incharge to this route"
                          >
                            + Assign Incharge
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              {item.boardedCount} / {item.enrolledStudents}
                            </span>
                            <span style={{ fontSize: 11.5, color: item.attendanceRate >= 80 ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                              {item.attendanceRate}%
                            </span>
                          </div>
                          <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, item.attendanceRate)}%`,
                                background: item.attendanceRate >= 80 ? '#22c55e' : item.attendanceRate > 0 ? '#f59e0b' : '#94a3b8',
                                height: 6,
                                borderRadius: 4,
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {statusPill(item)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 9px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => openRouteReport(item)}
                          title="View student manifest & print route report"
                        >
                          <span>📄</span> Route Report
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                      No routes found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: INLINE ASSIGN INCHARGE                                           */}
      {/* ========================================================================= */}
      {assignModalData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 520,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Oswald', fontSize: 18, color: 'var(--navy)' }}>
                  Assign Bus Incharge
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {assignModalData.route_code} · {assignModalData.route_name} ({assignModalData.shift})
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: 14, border: 'none', background: 'transparent' }}
                onClick={() => setAssignModalData(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} style={{ padding: '20px' }}>
              <div style={{
                padding: '10px 14px', borderRadius: 8, background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 12, marginBottom: 16
              }}>
                <div>
                  <span className="muted">Bus: </span>
                  <b className="mono">{assignModalData.registration_number}</b>
                </div>
                <div>
                  <span className="muted">Driver: </span>
                  <b>{assignModalData.driver_name}</b>
                </div>
                <div>
                  <span className="muted">Shift: </span>
                  <span className="mono" style={{ textTransform: 'uppercase' }}>{assignModalData.shift}</span>
                </div>
              </div>

              {assignError && (
                <div style={{
                  padding: '8px 12px', borderRadius: 6, background: '#fee2e2',
                  border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 12, marginBottom: 14
                }}>
                  {assignError}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="flabel" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 12.5 }}>
                  Select Faculty / Teacher Incharge
                </label>
                <select
                  className="fselect"
                  value={showNewInchargeInput ? 'NEW' : selectedInchargeId}
                  onChange={e => {
                    if (e.target.value === 'NEW') {
                      setShowNewInchargeInput(true);
                      setSelectedInchargeId('NEW');
                    } else {
                      setShowNewInchargeInput(false);
                      setSelectedInchargeId(e.target.value);
                    }
                  }}
                  style={{ width: '100%', height: 38 }}
                >
                  <option value="">-- No Incharge (Leave Unassigned) --</option>
                  {inchargesList.map(inc => (
                    <option key={inc.id} value={inc.id}>
                      {inc.name} {inc.phone ? `(📞 ${inc.phone})` : ''}
                    </option>
                  ))}
                  <option value="NEW">➕ Add New Incharge Account...</option>
                </select>
              </div>

              {showNewInchargeInput && (
                <div style={{
                  padding: 14, borderRadius: 8, background: '#f8fafc',
                  border: '1px solid #cbd5e1', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>New Teacher Incharge Details</div>
                  <input
                    type="text"
                    className="finput"
                    placeholder="Teacher / Faculty Name (e.g. Prof. Ramanathan K)"
                    value={newInchargeName}
                    onChange={e => setNewInchargeName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="finput"
                    placeholder="Mobile Phone Number"
                    value={newInchargePhone}
                    onChange={e => setNewInchargePhone(e.target.value)}
                  />
                  <input
                    type="email"
                    className="finput"
                    placeholder="Email Address (Optional)"
                    value={newInchargeEmail}
                    onChange={e => setNewInchargeEmail(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAssignModalData(null)}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={assignLoading}
                  style={{ minWidth: 120 }}
                >
                  {assignLoading ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ROUTE ATTENDANCE REPORT & STUDENT MANIFEST                       */}
      {/* ========================================================================= */}
      {routeReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 780,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
            }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Oswald', fontSize: 18, color: 'var(--navy)' }}>
                  Route Attendance Report · {routeReportModal.route.route_code}
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {routeReportModal.route.route_name} · Shift: {routeReportModal.route.shift} · {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handleExportRouteCSV}
                  disabled={!routeReportModal.data}
                >
                  📥 Download CSV
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handlePrintRouteReport}
                  disabled={!routeReportModal.data}
                >
                  🖨️ Print Report
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 9px', fontSize: 14, border: 'none', background: 'transparent' }}
                  onClick={() => setRouteReportModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {routeReportModal.loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Loading route attendance roster...
                </div>
              ) : routeReportModal.error ? (
                <div style={{ padding: 16, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: 13 }}>
                  {routeReportModal.error}
                </div>
              ) : routeReportModal.data && (
                <>
                  {/* Route Meta Ribbon */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10,
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px',
                    fontSize: 12, marginBottom: 16
                  }}>
                    <div>
                      <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Bus Assigned</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{routeReportModal.route.registration_number}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Driver</div>
                      <div style={{ fontWeight: 600 }}>{routeReportModal.route.driver_name}</div>
                      {routeReportModal.route.driver_phone !== '—' && (
                        <div className="muted" style={{ fontSize: 11 }}>📞 {routeReportModal.route.driver_phone}</div>
                      )}
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Bus Incharge</div>
                      <div style={{ fontWeight: 600 }}>{routeReportModal.route.incharge_name}</div>
                      {routeReportModal.route.incharge_phone !== '—' && (
                        <div className="muted" style={{ fontSize: 11 }}>📞 {routeReportModal.route.incharge_phone}</div>
                      )}
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Submission Status</div>
                      <div>{statusPill(routeReportModal.route)}</div>
                    </div>
                  </div>

                  {/* Summary KPI Badges */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                    <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', background: '#ffffff' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{routeReportModal.data.summary.total}</div>
                      <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Enrolled Riders</div>
                    </div>
                    <div style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: 8, textAlign: 'center', background: '#f0fdf4' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>{routeReportModal.data.summary.present}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Boarded (Present)</div>
                    </div>
                    <div style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, textAlign: 'center', background: '#fef2f2' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c' }}>{routeReportModal.data.summary.absent}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Absent</div>
                    </div>
                    <div style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 8, textAlign: 'center', background: '#f0f9ff' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>{routeReportModal.data.summary.rate}%</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Attendance Rate</div>
                    </div>
                  </div>

                  {/* Student List Table */}
                  <div className="table-wrap" style={{ maxHeight: 360 }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>S.No</th>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Class / Dept</th>
                          <th>Bus Stop</th>
                          <th>Boarding Time</th>
                          <th>Attendance</th>
                          <th>Parent Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routeReportModal.data.rows && routeReportModal.data.rows.length > 0 ? (
                          routeReportModal.data.rows.map((st, idx) => (
                            <tr key={st.student_pk || idx}>
                              <td style={{ color: '#64748b' }}>{idx + 1}</td>
                              <td><b className="mono">{st.student_id}</b></td>
                              <td>{st.name}</td>
                              <td>{st.class_grade || '—'}</td>
                              <td>{st.stop_name || '—'}</td>
                              <td className="mono" style={{ fontSize: 11.5 }}>
                                {st.boarding_time ? new Date(st.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td>
                                {st.status === 'present' ? (
                                  <span className="tag tag--ok" style={{ padding: '2px 7px', fontSize: 11 }}>✓ Present</span>
                                ) : st.status === 'absent' ? (
                                  <span className="tag tag--warn" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '2px 7px', fontSize: 11 }}>✕ Absent</span>
                                ) : (
                                  <span className="tag" style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 7px', fontSize: 11 }}>Pending</span>
                                )}
                              </td>
                              <td className="mono">
                                {st.parent_phone !== '—' ? (
                                  <a href={`tel:${st.parent_phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                                    📞 {st.parent_phone}
                                  </a>
                                ) : '—'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                              No students registered on this route yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ALL ROUTES CONSOLIDATED REPORT                                   */}
      {/* ========================================================================= */}
      {allRoutesReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 940,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
            }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Oswald', fontSize: 19, color: 'var(--navy)' }}>
                  Campus Consolidated Route Attendance Report
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {institution?.name || 'Campus'} · {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handleExportAllRoutesCSV}
                >
                  📥 Download Campus CSV
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handlePrintAllRoutesReport}
                >
                  🖨️ Print Consolidated Report
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 9px', fontSize: 14, border: 'none', background: 'transparent' }}
                  onClick={() => setAllRoutesReportModal(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {/* Campus KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 18 }}>
                <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', background: '#f8fafc' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{kpis.routesCount || 0}</div>
                  <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>Total Routes</div>
                </div>
                <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', background: '#f8fafc' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{kpis.totalStudents || 0}</div>
                  <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>Registered Students</div>
                </div>
                <div style={{ padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: 8, textAlign: 'center', background: '#f0fdf4' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>{kpis.boardedToday || 0}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Boarded (Present)</div>
                </div>
                <div style={{ padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, textAlign: 'center', background: '#fef2f2' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c' }}>{kpis.absentToday || 0}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b' }}>Total Absent</div>
                </div>
                <div style={{ padding: '10px 12px', border: '1px solid #bae6fd', borderRadius: 8, textAlign: 'center', background: '#f0f9ff' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>{kpis.attendanceRate || 0}%</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>Attendance Rate</div>
                </div>
                <div style={{ padding: '10px 12px', border: '1px solid #fde68a', borderRadius: 8, textAlign: 'center', background: '#fffbeb' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>{kpis.pendingSubmissionCount || 0}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>Pending Submissions</div>
                </div>
              </div>

              {/* Consolidated Table */}
              <div className="table-wrap" style={{ maxHeight: 420 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>S.No</th>
                      <th>Route Code & Name</th>
                      <th>Shift</th>
                      <th>Bus</th>
                      <th>Driver Details</th>
                      <th>Bus Incharge</th>
                      <th>Enrolled</th>
                      <th>Boarded</th>
                      <th>Absent</th>
                      <th>Rate %</th>
                      <th>Incharge Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campusRoster.length > 0 ? (
                      campusRoster.map((item, idx) => (
                        <tr key={item.id}>
                          <td style={{ color: '#64748b' }}>{idx + 1}</td>
                          <td>
                            <b>{item.route_code}</b> · {item.route_name}
                          </td>
                          <td>
                            <span className={`shift-tag ${item.shift?.startsWith('morning') ? 'shift-tag--morning' : 'shift-tag--evening'}`}>
                              {item.shift}
                            </span>
                          </td>
                          <td className="mono" style={{ fontWeight: 600 }}>{item.registration_number}</td>
                          <td>
                            <div>{item.driver_name}</div>
                            {item.driver_phone !== '—' && <div className="muted" style={{ fontSize: 11 }}>📞 {item.driver_phone}</div>}
                          </td>
                          <td>
                            <div>{item.incharge_name}</div>
                            {item.incharge_phone !== '—' && <div className="muted" style={{ fontSize: 11 }}>📞 {item.incharge_phone}</div>}
                          </td>
                          <td><b>{item.enrolledStudents}</b></td>
                          <td style={{ color: '#15803d', fontWeight: 700 }}>{item.boardedCount}</td>
                          <td style={{ color: '#dc2626', fontWeight: 700 }}>{item.absentCount}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: item.attendanceRate >= 80 ? '#16a34a' : '#d97706' }}>
                              {item.attendanceRate}%
                            </span>
                          </td>
                          <td>{statusPill(item)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                          No routes registered in campus roster.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
