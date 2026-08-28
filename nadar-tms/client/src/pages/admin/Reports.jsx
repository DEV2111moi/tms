import { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { fmtDate, money } from '../../components/UI/DataTable';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Attendance Register' },
  { value: 'absentees', label: 'Absentees (date range)' },
  { value: 'routes_stops', label: 'Routes & Stops List' },
  { value: 'fuel', label: 'Fuel Usage' },
  { value: 'distance', label: 'Distance Travelled' },
  { value: 'maintenance', label: 'Maintenance / Spare Parts' },
  { value: 'drivertrips', label: 'Driver Trips (date range)' }
];

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [st, setSt] = useState({ type: 'attendance', date: today, from: today, to: today, routeId: '', shift: '', institutionId: '' });
  const [refs, setRefs] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    try {
      let data;
      if (st.type === 'attendance') {
        data = await api.report(st.date, st.routeId, st.shift, st.institutionId);
      } else if (st.type === 'absentees') {
        data = await api.repAbsentees(st.from, st.to, st.institutionId);
      } else if (st.type === 'fuel') {
        data = await api.repFuel(st.from, st.to, st.institutionId);
      } else if (st.type === 'distance') {
        data = await api.repDistance(st.from, st.to, st.institutionId);
      } else if (st.type === 'maintenance') {
        data = await api.repMaint(st.from, st.to, st.institutionId);
      } else if (st.type === 'drivertrips') {
        data = await api.repDriverTrips(st.from, st.to);
      } else if (st.type === 'routes_stops') {
        data = await api.repRoutesStops(st.institutionId);
      }
      setResult({ type: st.type, data });
    } catch (err) {
      toast(err.message);
    }
    setLoading(false);
  };

  const handleCsv = () => {
    if (!result) { toast('Run a report first.'); return; }
    const { type, data } = result;
    const escVal = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const download = (filename, headers, rows) => {
      const csv = [headers.join(',')].concat(rows.map(r => r.map(escVal).join(','))).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      toast('CSV downloaded');
    };

    if (type === 'attendance') {
      download(`attendance_${data.date}.csv`, ['#', 'StudentID', 'Name', 'Institution', 'Class', 'Route', 'Stop', 'Status'],
        data.rows.map((r, i) => [i + 1, r.student_id, r.name, r.institution || '', r.class_grade || '', r.route_code || '', r.stop_name || '', r.status]));
    } else if (type === 'absentees') {
      download(`absentees_${data.from}_${data.to}.csv`, ['Name', 'Institution', 'Class', 'Route', 'SchoolDays', 'Present', 'Absent'],
        data.students.map(r => [r.name, r.institution || '', r.class_grade || '', r.route_code || '', r.school_days, r.present_days, r.absent_days]));
    } else if (type === 'fuel') {
      download(`fuel_${data.from}_${data.to}.csv`, ['Bus', 'Institution', 'Fills', 'Litres', 'Cost'],
        data.byBus.map(b => [b.registration_number, b.institution || '', b.fills, b.liters, Math.round(b.cost)]));
    } else if (type === 'distance') {
      download(`distance_${data.from}_${data.to}.csv`, ['Bus', 'Institution', 'Trips', 'KM'],
        data.byBus.map(b => [b.registration_number, b.institution || '', b.trips, b.km]));
    } else if (type === 'drivertrips') {
      download(`driver_trips_${data.from}_${data.to}.csv`, ['Driver', 'Trips', 'Completed', 'Days', 'KM'],
        data.byDriver.map(r => [r.driver_name || '', r.trips, r.completed, r.days, r.km]));
    } else if (type === 'maintenance') {
      download(`maintenance_${data.from}_${data.to}.csv`, ['Date', 'Bus', 'Institution', 'Work', 'Cost', 'Odometer', 'Notes'],
        data.records.map(r => [r.service_date, r.registration_number || '', r.institution || '', r.service_type || '', Math.round(r.cost), r.odometer || '', r.notes || '']));
    } else if (type === 'routes_stops') {
      download(`routes_list.csv`, ['#', 'Institution', 'Route Code', 'Route Name', 'Origin', 'Destination', 'Distance', 'Shift', 'Stops Count'],
        data.routes.map((r, i) => [i + 1, r.institution, r.route_code, r.route_name, r.origin, r.destination, r.total_distance, r.shift, r.total_stops]));
      download(`stops_list.csv`, ['#', 'Institution', 'Route Code', 'Route Name', 'Sequence', 'Stop Name', 'Scheduled Time'],
        data.stops.map((s, i) => [i + 1, s.institution, s.route_code, s.route_name, s.sequence, s.stop_name, s.scheduled_time || '']));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isAtt = st.type === 'attendance';
  const isRoutesStops = st.type === 'routes_stops';
  const routes = refs.routes || [];
  const insts = refs.institutions || [];

  return (
    <>
      <div className="page-head hide-on-print">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-sub">Attendance, compliance, fuel, and trip metrics</div>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="card hide-on-print" style={{ marginBottom: 20 }}>
          <div className="form-grid" style={{ alignItems: 'end' }}>
            <label className="flabel">
              <span>Report Type</span>
              <select className="fselect" value={st.type} onChange={e => setSt(prev => ({ ...prev, type: e.target.value }))}>
                {REPORT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>

            <label className="flabel">
              <span>Institution</span>
              <select className="fselect" value={st.institutionId} onChange={e => setSt(prev => ({ ...prev, institutionId: e.target.value }))}>
                <option value="">All institutions</option>
                {insts.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
              </select>
            </label>

            {!isRoutesStops && (
              isAtt ? (
                <>
                  <label className="flabel">
                    <span>Date</span>
                    <input className="finput" type="date" value={st.date} onChange={e => setSt(prev => ({ ...prev, date: e.target.value }))} />
                  </label>
                  <label className="flabel">
                    <span>Route</span>
                    <select className="fselect" value={st.routeId} onChange={e => setSt(prev => ({ ...prev, routeId: e.target.value }))}>
                      <option value="">All routes</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.route_code} — {r.route_name}</option>)}
                    </select>
                  </label>
                  <label className="flabel">
                    <span>Shift</span>
                    <select className="fselect" value={st.shift} onChange={e => setSt(prev => ({ ...prev, shift: e.target.value }))}>
                      <option value="">All shifts</option>
                      <option value="morning1">Morning 1</option>
                      <option value="morning2">Morning 2</option>
                      <option value="evening1">Evening 1</option>
                      <option value="evening2">Evening 2</option>
                      <option value="morning">Morning (Legacy)</option>
                      <option value="evening">Evening (Legacy)</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="flabel">
                    <span>From Date</span>
                    <input className="finput" type="date" value={st.from} onChange={e => setSt(prev => ({ ...prev, from: e.target.value }))} />
                  </label>
                  <label className="flabel">
                    <span>To Date</span>
                    <input className="finput" type="date" value={st.to} onChange={e => setSt(prev => ({ ...prev, to: e.target.value }))} />
                  </label>
                </>
              )
            )}
          </div>
          {st.type === 'distance' && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '6px',
              background: 'var(--paper-2)',
              borderLeft: '4px solid var(--amber)',
              fontSize: '13px',
              color: 'var(--text-dim)',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>💡</span>
              <span>
                <b>Note:</b> Today's trips are automatically logged as soon as each shift passes its scheduled completion time (e.g., 9:00 AM for morning shift). Trips for past days are logged immediately.
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="btn btn-sm btn-outline" onClick={handleCsv} disabled={!result}>Export CSV</button>
            <button className="btn btn-sm btn-outline" onClick={handlePrint} disabled={!result}>Print</button>
            <button className="btn btn-sm btn-primary" onClick={handleRun} disabled={loading}>{loading ? 'Running...' : 'Run Report'}</button>
          </div>
        </div>

        {/* Results */}
        {loading && <div className="loading-center"><div className="spinner" /> Generating report...</div>}

        {result && (
          <div>
            {result.type === 'attendance' && <AttendanceReportView data={result.data} />}
            {result.type === 'absentees' && <AbsenteesReportView data={result.data} />}
            {result.type === 'fuel' && <FuelReportView data={result.data} />}
            {result.type === 'distance' && <DistanceReportView data={result.data} />}
            {result.type === 'drivertrips' && <DriverTripsReportView data={result.data} />}
            {result.type === 'maintenance' && <MaintenanceReportView data={result.data} />}
            {result.type === 'routes_stops' && <RoutesStopsReportView data={result.data} insts={insts} st={st} />}
          </div>
        )}
      </div>
    </>
  );
}

function AttendanceReportView({ data }) {
  const s = data.summary;
  return (
    <div>
      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-card__label">Total Students</div><div className="stat-card__value">{s.total}</div></div>
        <div className="stat-card"><div className="stat-card__label">Present</div><div className="stat-card__value stat-card__value--green">{s.present}</div></div>
        <div className="stat-card"><div className="stat-card__label">Absent</div><div className="stat-card__value stat-card__value--red">{s.absent}</div></div>
        <div className="stat-card"><div className="stat-card__label">Rate</div><div className="stat-card__value stat-card__value--amber">{s.rate}%</div></div>
      </div>
      <div className="section-h">Records for {fmtDate(data.date)}</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>#</th><th>Student ID</th><th>Name</th><th>Institution</th><th>Class</th><th>Route</th><th>Stop</th><th>Status</th></tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i}>
                <td className="muted mono">{i + 1}</td>
                <td className="mono">{r.student_id}</td>
                <td><b>{r.name}</b></td>
                <td>{r.institution || '—'}</td>
                <td>{r.class_grade || '—'}</td>
                <td className="mono">{r.route_code || '—'}</td>
                <td>{r.stop_name || '—'}</td>
                <td>
                  <span className={`tag ${r.status === 'present' ? 'tag--ok' : 'tag--danger'}`}>
                    {r.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbsenteesReportView({ data }) {
  const totalAbsent = data.students.reduce((sum, r) => sum + r.absent_days, 0);
  return (
    <div>
      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-card__label">Students Tracked</div><div className="stat-card__value">{data.students.length}</div></div>
        <div className="stat-card"><div className="stat-card__label">Total Absences</div><div className="stat-card__value stat-card__value--red">{totalAbsent}</div></div>
        <div className="stat-card"><div className="stat-card__label">Days Covered</div><div className="stat-card__value">{data.days.length}</div></div>
      </div>
      <div className="section-h">Day-Wise Absent Summary</div>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Expected</th><th>Present</th><th>Absent</th></tr></thead>
          <tbody>
            {data.days.map((d, i) => (
              <tr key={i}>
                <td className="mono">{fmtDate(d.date)}</td>
                <td className="mono">{d.expected}</td>
                <td className="mono">{d.present}</td>
                <td className="mono" style={{ color: 'var(--absent)', fontWeight: 600 }}>{d.absent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-h">Most Absences First</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Institution</th><th>Class</th><th>Route</th><th>Days</th><th>Present</th><th>Absent</th></tr></thead>
          <tbody>
            {data.students.map((r, i) => (
              <tr key={i}>
                <td><b>{r.name}</b></td>
                <td>{r.institution || '—'}</td>
                <td>{r.class_grade || '—'}</td>
                <td className="mono">{r.route_code || '—'}</td>
                <td className="mono">{r.school_days}</td>
                <td className="mono">{r.present_days}</td>
                <td className="mono" style={{ color: 'var(--absent)', fontWeight: 600 }}>{r.absent_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FuelReportView({ data }) {
  const totalLiters = data.byBus.reduce((sum, r) => sum + r.liters, 0);
  const totalCost = data.byBus.reduce((sum, r) => sum + r.cost, 0);
  return (
    <div>
      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-card__label">Total Diesel Fill</div><div className="stat-card__value stat-card__value--amber">{totalLiters.toFixed(1)} L</div></div>
        <div className="stat-card"><div className="stat-card__label">Total Spend</div><div className="stat-card__value">{money(totalCost)}</div></div>
        <div className="stat-card"><div className="stat-card__label">Fills Count</div><div className="stat-card__value">{data.days.reduce((s,d)=>s+d.fills, 0)}</div></div>
      </div>
      <div className="section-h">Fills by Day</div>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Fills</th><th>Litres</th><th>Cost</th></tr></thead>
          <tbody>
            {data.days.map((d, i) => (
              <tr key={i}>
                <td className="mono">{fmtDate(d.date)}</td>
                <td className="mono">{d.fills}</td>
                <td className="mono">{d.liters.toFixed(1)} L</td>
                <td className="mono">{money(d.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-h">By Institution</div>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="tbl">
          <thead><tr><th>Institution</th><th>Fills</th><th>Litres</th><th>Cost</th></tr></thead>
          <tbody>
            {data.byInstitution.map((g, i) => (
              <tr key={i}>
                <td><b>{g.institution}</b></td>
                <td className="mono">{g.fills}</td>
                <td className="mono">{g.liters.toFixed(1)} L</td>
                <td className="mono">{money(g.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-h">By Bus</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Bus</th><th>Institution</th><th>Fills</th><th>Litres</th><th>Cost</th></tr></thead>
          <tbody>
            {data.byBus.map((b, i) => (
              <tr key={i}>
                <td className="mono"><b>{b.registration_number}</b></td>
                <td>{b.institution || '—'}</td>
                <td className="mono">{b.fills}</td>
                <td className="mono">{b.liters.toFixed(1)} L</td>
                <td className="mono">{money(b.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DistanceReportView({ data }) {
  const totalKm = data.byBus.reduce((sum, r) => sum + r.km, 0);
  return (
    <div>
      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-card__label">Total Distance</div><div className="stat-card__value stat-card__value--amber">{totalKm.toLocaleString('en-IN')} km</div></div>
        <div className="stat-card"><div className="stat-card__label">Total Trips</div><div className="stat-card__value">{data.days.reduce((s,d)=>s+d.trips, 0)}</div></div>
      </div>
      <div className="section-h">By Day</div>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Trips Logged</th><th>Distance (km)</th></tr></thead>
          <tbody>
            {data.days.map((d, i) => (
              <tr key={i}>
                <td className="mono">{fmtDate(d.date)}</td>
                <td className="mono">{d.trips}</td>
                <td className="mono">{d.km.toLocaleString('en-IN')} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-h">By Bus & Driver</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Bus</th><th>Institution</th><th>Route</th><th>Driver</th><th>Trips</th><th>Distance</th></tr></thead>
          <tbody>
            {data.byBus.map((b, i) => (
              <tr key={i}>
                <td className="mono"><b>{b.registration_number}</b></td>
                <td>{b.institution || '—'}</td>
                <td>{b.route_code !== '—' ? <b>{b.route_code} <span className="muted">· {b.route_name}</span></b> : '—'}</td>
                <td><b>{b.driver_name || '—'}</b></td>
                <td className="mono">{b.trips}</td>
                <td className="mono">{b.km.toLocaleString('en-IN')} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriverTripsReportView({ data }) {
  const totalTrips = data.byDriver.reduce((sum, r) => sum + r.trips, 0);
  return (
    <div>
      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-card__label">Total Trips</div><div className="stat-card__value">{totalTrips}</div></div>
        <div className="stat-card"><div className="stat-card__label">Active Days</div><div className="stat-card__value">{data.byDriver.reduce((s,d)=>s+d.days, 0)}</div></div>
      </div>
      <div className="section-h">Trips Per Driver</div>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="tbl">
          <thead><tr><th>Driver</th><th>Trips Logged</th><th>Completed</th><th>Days Worked</th><th>Distance</th></tr></thead>
          <tbody>
            {data.byDriver.map((d, i) => (
              <tr key={i}>
                <td><b>{d.driver_name || '—'}</b></td>
                <td className="mono">{d.trips}</td>
                <td className="mono">{d.completed}</td>
                <td className="mono">{d.days}</td>
                <td className="mono">{d.km.toLocaleString('en-IN')} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="section-h">Detailed Trip Records</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Trip</th><th>Driver</th><th>Bus</th><th>Opening km</th><th>Closing km</th><th>Distance</th><th>Reached Stop</th></tr></thead>
          <tbody>
            {data.records.map((r, i) => (
              <tr key={i}>
                <td className="mono">{fmtDate(r.log_date)}</td>
                <td>{String(r.shift || '—').replace('trip', 'Trip ')}</td>
                <td>{r.driver_name || '—'}</td>
                <td className="mono">{r.registration_number || '—'}</td>
                <td className="mono">{r.start_km ?? '—'}</td>
                <td className="mono">{r.end_km ?? '—'}</td>
                <td className="mono">{r.km != null ? r.km + ' km' : '—'}</td>
                <td>{r.end_stop || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaintenanceReportView({ data }) {
  const totalCost = data.records.reduce((sum, r) => sum + r.cost, 0);
  return (
    <div>
      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-card__label">Service Jobs</div><div className="stat-card__value">{data.records.length}</div></div>
        <div className="stat-card"><div className="stat-card__label">Total Cost</div><div className="stat-card__value stat-card__value--amber">{money(totalCost)}</div></div>
      </div>
      <div className="section-h">Spare Parts & Service Records</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Bus</th><th>Institution</th><th>Service Work</th><th>Cost</th><th>Odometer</th><th>Notes</th></tr></thead>
          <tbody>
            {data.records.map((r, i) => (
              <tr key={i}>
                <td className="mono">{fmtDate(r.service_date)}</td>
                <td className="mono"><b>{r.registration_number}</b></td>
                <td>{r.institution || '—'}</td>
                <td>{r.service_type || '—'}</td>
                <td className="mono">{money(r.cost)}</td>
                <td className="mono">{r.odometer != null ? Number(r.odometer).toLocaleString('en-IN') : '—'}</td>
                <td>{r.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoutesStopsReportView({ data, insts = [], st = {} }) {
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' or 'stops' or 'board'

  // Helper to format time as HH.MM AM/PM
  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '—';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${String(displayHr).padStart(2, '0')}.${m} ${ampm}`;
  };

  // Group stops by route_id
  const stopsByRouteId = {};
  (data.stops || []).forEach(s => {
    if (!stopsByRouteId[s.route_id]) {
      stopsByRouteId[s.route_id] = [];
    }
    stopsByRouteId[s.route_id].push(s);
  });

  // Sort each route's stops by sequence
  Object.keys(stopsByRouteId).forEach(rId => {
    stopsByRouteId[rId].sort((a, b) => a.sequence - b.sequence);
  });

  // Evaluate dynamic header names based on selected institution
  const activeInst = insts.find(i => i.id == st.institutionId);
  const collegeName = activeInst ? activeInst.name.toUpperCase() : 'NADAR SARASWATHI COLLEGE OF ENGINEERING AND TECHNOLOGY';
  const collegeLocation = activeInst?.short_name?.toLowerCase().includes('school') 
    ? 'THENI' 
    : 'VADAPUTHUPATTI-THENI - 625531';

  return (
    <div>
      <div className="cards-grid hide-on-print" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card__label">Total Routes</div>
          <div className="stat-card__value">{data.routes?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Stops</div>
          <div className="stat-card__value">{data.stops?.length || 0}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--paper-2)', paddingBottom: 10 }} className="hide-on-print">
        <button
          className={`btn btn-sm ${activeTab === 'routes' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('routes')}
        >
          🛣️ Routes Summary
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'stops' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('stops')}
        >
          📍 Stops Details
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'board' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('board')}
        >
          📋 Print Board
        </button>
      </div>

      {activeTab === 'routes' && (
        <div className="hide-on-print">
          <div className="section-h">Routes Summary</div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Institution</th>
                  <th>Route Code</th>
                  <th>Route Name</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Distance</th>
                  <th>Shift</th>
                  <th>Stops Count</th>
                </tr>
              </thead>
              <tbody>
                {(data.routes || []).map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="muted mono">{i + 1}</td>
                    <td><b>{r.institution}</b></td>
                    <td className="mono"><b>{r.route_code}</b></td>
                    <td>{r.route_name}</td>
                    <td>{r.origin}</td>
                    <td>{r.destination}</td>
                    <td className="mono">{r.total_distance} km</td>
                    <td>
                      <span className="tag tag--ok" style={{ textTransform: 'uppercase' }}>{r.shift || 'morning1'}</span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>{r.total_stops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stops' && (
        <div className="hide-on-print">
          <div className="section-h">Stops Details</div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Institution</th>
                  <th>Route Code</th>
                  <th>Route Name</th>
                  <th>Seq</th>
                  <th>Stop Name</th>
                  <th>Scheduled Time</th>
                </tr>
              </thead>
              <tbody>
                {(data.stops || []).map((s, i) => (
                  <tr key={s.id || i}>
                    <td className="muted mono">{i + 1}</td>
                    <td>{s.institution}</td>
                    <td className="mono"><b>{s.route_code}</b></td>
                    <td className="muted">{s.route_name}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{s.sequence}</td>
                    <td><b>{s.stop_name}</b></td>
                    <td className="mono">{s.scheduled_time ? s.scheduled_time.slice(0, 5) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'board' && (() => {
        // Group routes in pairs of 2 to match 2-column print layouts and determine maximum stops per row
        const pairedRoutes = [];
        const rawRoutes = data.routes || [];
        for (let i = 0; i < rawRoutes.length; i += 2) {
          const rA = rawRoutes[i];
          const rB = rawRoutes[i + 1];

          const stopsA = stopsByRouteId[rA.id] || [];
          const stopsB = rB ? (stopsByRouteId[rB.id] || []) : [];

          const maxStops = Math.max(stopsA.length, stopsB.length);

          pairedRoutes.push({
            route: rA,
            stops: stopsA,
            padCount: maxStops - stopsA.length
          });

          if (rB) {
            pairedRoutes.push({
              route: rB,
              stops: stopsB,
              padCount: maxStops - stopsB.length
            });
          }
        }

        return (
          <div style={{ background: '#fff', color: '#000', padding: 20, borderRadius: 8, border: '1px solid var(--paper-2)' }} className="print-board-container">
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2.5px solid #000', paddingBottom: 16 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0', color: '#000', letterSpacing: '0.5px' }}>{collegeName}</h1>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#000' }}>{collegeLocation}</h2>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: 'uppercase', color: '#000', textDecoration: 'underline', letterSpacing: '0.3px' }}>
                SPECIAL BUS TIMING LIST
              </h3>
            </div>

            <div className="routes-board-grid">
              {pairedRoutes.map((item, rIndex) => {
                const r = item.route;
                const routeStops = item.stops;
                return (
                  <div key={r.id || rIndex} className="route-board-card">
                    <div className="route-board-header">
                      {rIndex + 1}. {r.route_name.toUpperCase()}
                    </div>
                    <table className="route-board-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>S.NO</th>
                          <th style={{ width: 110 }}>BUS TIMING</th>
                          <th>NAME OF THE PLACE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routeStops.length > 0 ? (
                          <>
                            {routeStops.map((st, sIndex) => (
                              <tr key={st.id || sIndex}>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{sIndex + 1}</td>
                                <td style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'monospace' }}>
                                  {formatTimeAMPM(st.scheduled_time)}
                                </td>
                                <td style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                  {st.stop_name}
                                </td>
                              </tr>
                            ))}
                            {Array.from({ length: item.padCount }).map((_, idx) => (
                              <tr key={`pad-${idx}`}>
                                <td style={{ border: 'none' }}>&nbsp;</td>
                                <td style={{ border: 'none' }}>&nbsp;</td>
                                <td style={{ border: 'none' }}>&nbsp;</td>
                              </tr>
                            ))}
                          </>
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                              No stops defined for this route.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 60, display: 'flex', justifyContent: 'flex-end', paddingRight: 40 }}>
              <div style={{ textAlign: 'center', width: 220 }}>
                <div style={{ borderBottom: '1.5px dashed #000', height: 40 }}></div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8, letterSpacing: '0.5px' }}>PRINCIPAL</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
