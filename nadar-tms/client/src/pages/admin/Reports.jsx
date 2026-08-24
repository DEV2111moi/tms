import { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { fmtDate, money } from '../../components/UI/DataTable';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Attendance Register' },
  { value: 'absentees', label: 'Absentees (date range)' },
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
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isAtt = st.type === 'attendance';
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

            {isAtt ? (
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
                    <option value="">Both shifts</option>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
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
            )}
          </div>
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
      <div className="section-h">By Bus</div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Bus</th><th>Institution</th><th>Trips</th><th>Distance</th></tr></thead>
          <tbody>
            {data.byBus.map((b, i) => (
              <tr key={i}>
                <td className="mono"><b>{b.registration_number}</b></td>
                <td>{b.institution || '—'}</td>
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
