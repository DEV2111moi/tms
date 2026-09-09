import { useState, useEffect, Fragment } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/UI/Toast';
import { fmtDate, money } from '../../components/UI/DataTable';

const REPORT_TYPES = [
  { value: 'bus_wise', label: 'Bus Wise Report' },
  { value: 'distance', label: 'Distance Travelled' },
  { value: 'attendance', label: 'Attendance Register' },
  { value: 'absentees', label: 'Absentees (date range)' },
  { value: 'routes_stops', label: 'Routes & Stops List' },
  { value: 'fuel', label: 'Fuel Usage' },
  { value: 'maintenance', label: 'Maintenance / Spare Parts' },
  { value: 'drivertrips', label: 'Driver Trips (date range)' }
];

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [st, setSt] = useState({ type: 'bus_wise', date: today, from: today, to: today, routeId: '', shift: '', institutionId: '', busId: '' });
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
        data = await api.repDistance(st.from, st.to, st.institutionId, st.busId);
      } else if (st.type === 'bus_wise') {
        data = await api.repBusWise(st.from, st.to, st.institutionId, st.busId);
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
    } else if (type === 'bus_wise') {
      download(`bus_wise_report_${data.from}_${data.to}.csv`, [
        '#', 'Bus Number', 'Institution', 'Total Trips', 'Total KM',
        'Trip 1 (Morning 1) KM', 'Trip 1 (Morning 1) Trips',
        'Trip 2 (Morning 2) KM', 'Trip 2 (Morning 2) Trips',
        'Trip 3 (Evening 1) KM', 'Trip 3 (Evening 1) Trips',
        'Trip 4 (Evening 2) KM', 'Trip 4 (Evening 2) Trips',
        'Routes Operated', 'Drivers'
      ], data.buses.map((b, i) => [
        i + 1,
        b.registration_number,
        b.institution || '',
        b.total_trips,
        b.total_km,
        b.morning1_km,
        b.morning1_trips,
        b.morning2_km,
        b.morning2_trips,
        b.evening1_km,
        b.evening1_trips,
        b.evening2_km,
        b.evening2_trips,
        b.routes || '',
        b.drivers || ''
      ]));
    } else if (type === 'distance') {
      download(`distance_${data.from}_${data.to}.csv`, ['Bus', 'Institution', 'Route', 'Driver', 'Trip 1 (Morning 1)', 'Trip 2 (Morning 2)', 'Trip 3 (Evening 1)', 'Trip 4 (Evening 2)', 'Total KM'],
        data.byBus.map(b => [
          b.registration_number, 
          b.institution || '', 
          b.route_code !== '—' ? `${b.route_code} · ${b.route_name}` : '',
          b.driver_name || '',
          b.morning1_km > 0 ? `${b.morning1_km} km` : '',
          b.morning2_km > 0 ? `${b.morning2_km} km` : '',
          b.evening1_km > 0 ? `${b.evening1_km} km` : '',
          b.evening2_km > 0 ? `${b.evening2_km} km` : '',
          b.km
        ]));
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

            {(st.type === 'bus_wise' || st.type === 'distance') && (
              <label className="flabel">
                <span>Bus Number</span>
                <select className="fselect" value={st.busId} onChange={e => setSt(prev => ({ ...prev, busId: e.target.value }))}>
                  <option value="">All Buses</option>
                  {(refs.buses || [])
                    .filter(b => !st.institutionId || !b.institution_id || String(b.institution_id) === String(st.institutionId))
                    .map(b => (
                      <option key={b.id} value={b.id}>{b.registration_number}</option>
                    ))}
                </select>
              </label>
            )}

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
          {(st.type === 'distance' || st.type === 'bus_wise') && (
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
            {result.type === 'bus_wise' && <BusWiseReportView data={result.data} selectedBusId={st.busId} st={st} insts={insts} />}
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

function BusWiseReportView({ data, selectedBusId, st, insts }) {
  const [search, setSearch] = useState('');
  const [expandedBus, setExpandedBus] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'summary'

  const buses = data?.buses || [];
  const trips = data?.trips || [];

  // Index trips by bus ID and registration number for instant retrieval
  const tripsByBusId = {};
  const tripsByRegNum = {};
  trips.forEach(t => {
    if (t.bus_id) {
      if (!tripsByBusId[t.bus_id]) tripsByBusId[t.bus_id] = [];
      tripsByBusId[t.bus_id].push(t);
    }
    if (t.registration_number) {
      const reg = String(t.registration_number).trim().toUpperCase();
      if (!tripsByRegNum[reg]) tripsByRegNum[reg] = [];
      tripsByRegNum[reg].push(t);
    }
  });

  const getBusTrips = (b) => {
    if (b.bus_id && tripsByBusId[b.bus_id]) return tripsByBusId[b.bus_id];
    if (b.id && tripsByBusId[b.id]) return tripsByBusId[b.id];
    if (b.registration_number) {
      const reg = String(b.registration_number).trim().toUpperCase();
      if (tripsByRegNum[reg]) return tripsByRegNum[reg];
    }
    return [];
  };

  const filteredBuses = buses.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (b.registration_number && b.registration_number.toLowerCase().includes(q)) ||
           (b.institution && b.institution.toLowerCase().includes(q)) ||
           (b.routes && b.routes.toLowerCase().includes(q)) ||
           (b.drivers && b.drivers.toLowerCase().includes(q));
  });

  const totalKm = filteredBuses.reduce((sum, b) => sum + b.total_km, 0);
  const totalTrips = filteredBuses.reduce((sum, b) => sum + b.total_trips, 0);
  const avgKm = filteredBuses.length > 0 ? (totalKm / filteredBuses.length).toFixed(1) : 0;

  // Active institution info for PDF printout header
  const activeInst = (insts || []).find(i => String(i.id) === String(st?.institutionId));
  const collegeName = activeInst ? activeInst.name.toUpperCase() : 'NADAR SARASWATHI COLLEGE OF ENGINEERING AND TECHNOLOGY';
  const selectedInstitutionName = activeInst ? (activeInst.short_name || activeInst.name) : (st?.institutionId ? 'Selected Institution' : 'All Institutions');

  const handlePrintDetailed = () => {
    setViewMode('detailed');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div>
      {/* Stat Cards - Screen Only */}
      <div className="cards-grid hide-on-print" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card__label">Buses Tracked</div>
          <div className="stat-card__value">
            {filteredBuses.length} 
            {filteredBuses.length !== buses.length && (
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-dim)', marginLeft: '6px' }}>
                of {buses.length}
              </span>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Distance</div>
          <div className="stat-card__value stat-card__value--amber">{totalKm.toLocaleString('en-IN')} km</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Trips Logged</div>
          <div className="stat-card__value stat-card__value--green">{totalTrips.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Avg Distance / Bus</div>
          <div className="stat-card__value">{Number(avgKm).toLocaleString('en-IN')} km</div>
        </div>
      </div>

      {/* Institutional Print / PDF Header */}
      <div className="print-header" style={{ marginBottom: '18px', textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a', letterSpacing: '0.5px' }}>
          {collegeName}
        </h2>
        <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {viewMode === 'detailed' ? 'BUS WISE DETAILED FLEET PERFORMANCE REPORT' : 'BUS WISE FLEET SUMMARY REPORT'}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
          <span>Period: <b>{fmtDate(data?.from || st?.from)}</b> to <b>{fmtDate(data?.to || st?.to)}</b></span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Institution: <b>{selectedInstitutionName}</b></span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Generated: <b>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
        </div>
        <div style={{ fontSize: '11px', color: '#0f172a', marginTop: '4px', fontWeight: '600' }}>
          Buses: {filteredBuses.length} &nbsp;|&nbsp; Total Distance: {totalKm.toLocaleString('en-IN')} km &nbsp;|&nbsp; Total Trips: {totalTrips.toLocaleString('en-IN')} &nbsp;|&nbsp; Avg Distance: {avgKm} km/bus
        </div>
      </div>

      {/* Navigation Toolbar: Search, Mode Switcher, Expand All, Print */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }} className="hide-on-print">
        <div>
          <div className="section-h" style={{ margin: 0 }}>Bus Wise Performance Report</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
            {search ? (
              <span>Found <b>{filteredBuses.length}</b> {filteredBuses.length === 1 ? 'bus' : 'buses'} matching <b>"{search}"</b></span>
            ) : (
              <span>Showing all <b>{buses.length}</b> buses with complete mileage & trip metrics</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--paper-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--paper-3)' }}>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'detailed' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
              onClick={() => setViewMode('detailed')}
            >
              📑 Detailed Trip Cards (PDF)
            </button>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
              onClick={() => setViewMode('summary')}
            >
              📊 Summary Table View
            </button>
          </div>

          {/* Quick Print Button */}
          <button
            type="button"
            className="btn btn-xs btn-primary"
            style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={handlePrintDetailed}
            title="Print or Save as PDF with full trip breakdowns"
          >
            <span>🖨️</span> Print Detailed PDF
          </button>

          {/* Instant Search Bar */}
          <div style={{ position: 'relative', width: '250px' }}>
            <input
              type="text"
              className="finput"
              style={{
                paddingLeft: '34px',
                paddingRight: search ? '30px' : '12px',
                height: '36px',
                borderRadius: '8px',
                border: '1.5px solid var(--paper-3)',
                fontSize: '13px',
                background: 'var(--white)'
              }}
              placeholder="Search bus, route, driver..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>🔍</span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-dim)',
                  fontSize: '15px',
                  lineHeight: '1'
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DETAILED TRIP CARDS (PDF READY)                                   */}
      {/* ========================================================================= */}
      {viewMode === 'detailed' && (
        <div>
          {filteredBuses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
              No buses found matching <b>"{search}"</b>.
            </div>
          ) : (
            filteredBuses.map((b, i) => {
              const busTrips = getBusTrips(b);
              return (
                <div 
                  key={b.bus_id || b.registration_number || i} 
                  className="bus-print-card"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Bus Header Bar */}
                  <div 
                    className="bus-print-card__header"
                    style={{
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderBottom: '1.5px solid #94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span 
                        className="bus-badge"
                        style={{
                          fontWeight: '800',
                          fontSize: '13px',
                          background: '#0f172a',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.5px',
                          display: 'inline-block'
                        }}
                      >
                        {b.registration_number}
                      </span>
                      <span style={{ fontSize: '12px', color: '#334155' }}>
                        Institution: <strong style={{ color: '#0f172a' }}>{b.institution || '—'}</strong>
                      </span>
                      <span style={{ color: '#94a3b8' }}>|</span>
                      <span style={{ fontSize: '12px', color: '#334155' }}>
                        Routes: <strong style={{ color: '#0369a1' }}>{b.routes || '—'}</strong>
                      </span>
                      <span style={{ color: '#94a3b8' }}>|</span>
                      <span style={{ fontSize: '12px', color: '#334155' }}>
                        Drivers: <strong style={{ color: '#0f172a' }}>{b.drivers || '—'}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', fontSize: '12px', flexShrink: 0 }}>
                      <span style={{ color: '#334155' }}>Total Distance: <strong style={{ color: '#b45309' }}>{b.total_km.toLocaleString('en-IN')} km</strong></span>
                      <span style={{ color: '#94a3b8' }}>|</span>
                      <span style={{ color: '#334155' }}>Trips: <strong style={{ color: '#15803d' }}>{b.total_trips}</strong></span>
                    </div>
                  </div>

                  {/* Trips Breakdown Table */}
                  {busTrips.length === 0 ? (
                    <div style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '12.5px', fontStyle: 'italic' }}>
                      No detailed trip records logged for this bus in the selected date range.
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ margin: 0, overflowX: 'auto' }}>
                      <table className="tbl bus-print-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ width: '28px', textAlign: 'center' }}>#</th>
                            <th style={{ width: '85px', whiteSpace: 'nowrap' }}>Date</th>
                            <th style={{ width: '80px', whiteSpace: 'nowrap' }}>Shift</th>
                            <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Institution</th>
                            <th style={{ minWidth: '140px' }}>Route</th>
                            <th style={{ minWidth: '115px', whiteSpace: 'nowrap' }}>Driver</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Stoppages (From ➔ To)</th>
                            <th style={{ textAlign: 'right', width: '95px', whiteSpace: 'nowrap' }}>Odometer</th>
                            <th style={{ textAlign: 'right', width: '70px', whiteSpace: 'nowrap' }}>Trip KM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {busTrips.map((t, idx) => (
                            <tr key={t.id || idx}>
                              <td className="muted mono nowrap" style={{ textAlign: 'center' }}>{idx + 1}</td>
                              <td className="mono nowrap">{fmtDate(t.date)}</td>
                              <td className="nowrap">
                                <span 
                                  className="shift-badge"
                                  style={{
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    background: t.shift?.startsWith('morning') ? '#e6f4ea' : '#fef7e0',
                                    color: t.shift?.startsWith('morning') ? '#137333' : '#b06000',
                                    display: 'inline-block'
                                  }}
                                >
                                  {t.shift}
                                </span>
                              </td>
                              <td className="nowrap">{t.institution || b.institution || '—'}</td>
                              <td>
                                {t.route_code !== '—' ? (
                                  <span><strong className="mono">{t.route_code}</strong> <span style={{ color: '#64748b', fontWeight: 'normal' }}>· {t.route_name}</span></span>
                                ) : '—'}
                              </td>
                              <td className="nowrap"><strong>{t.driver_name || '—'}</strong></td>
                              <td style={{ fontSize: '11.5px' }}>
                                {t.start_stop || '—'} ➔ {t.end_stop || '—'}
                              </td>
                              <td className="mono nowrap" style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                                {t.start_km} ➔ {t.end_km}
                              </td>
                              <td className="mono nowrap" style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                {t.km.toLocaleString('en-IN')} km
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {busTrips.length > 1 && (
                          <tfoot>
                            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                              <td colSpan="8" style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                                Total for {b.registration_number}:
                              </td>
                              <td className="mono" style={{ textAlign: 'right', color: '#0f172a', fontWeight: '800' }}>
                                {b.total_km.toLocaleString('en-IN')} km
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SUMMARY TABLE VIEW (WITH ACCORDION EXPANSION)                     */}
      {/* ========================================================================= */}
      {viewMode === 'summary' && (
        <div className="table-wrap" style={{ marginBottom: 24 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Bus Number</th>
                <th>Institution</th>
                <th style={{ textAlign: 'center' }}>Total Trips</th>
                <th style={{ textAlign: 'right' }}>Total KM</th>
                <th style={{ textAlign: 'center' }}>Morning 1</th>
                <th style={{ textAlign: 'center' }}>Morning 2</th>
                <th style={{ textAlign: 'center' }}>Evening 1</th>
                <th style={{ textAlign: 'center' }}>Evening 2</th>
                <th>Routes Operated</th>
                <th>Drivers</th>
                <th className="hide-on-print" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No buses found matching <b>"{search}"</b>. Try clearing your search or selecting "All Buses".
                  </td>
                </tr>
              ) : (
                filteredBuses.map((b, i) => {
                  const isSelected = expandedBus && (expandedBus.bus_id === b.bus_id || expandedBus.registration_number === b.registration_number);
                  const busTrips = getBusTrips(b);

                  return (
                    <Fragment key={b.bus_id || b.registration_number || i}>
                      <tr 
                        style={{ 
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(244, 165, 33, 0.12)' : undefined,
                          borderLeft: isSelected ? '4px solid var(--marigold)' : '4px solid transparent',
                          transition: 'background 0.15s ease'
                        }}
                        onClick={() => setExpandedBus(isSelected ? null : b)}
                      >
                        <td className="muted mono">{i + 1}</td>
                        <td className="mono">
                          <span style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            background: 'var(--navy)',
                            color: '#fff',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            letterSpacing: '0.5px'
                          }}>
                            {b.registration_number}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: '600',
                            color: 'var(--navy-2)',
                            display: 'inline-block'
                          }}>
                            {b.institution || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            background: 'var(--present-soft)',
                            color: 'var(--present)',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {b.total_trips} trips
                          </span>
                        </td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px', color: 'var(--navy)' }}>
                          {b.total_km.toLocaleString('en-IN')} km
                        </td>
                        <td style={{ textAlign: 'center' }} className="mono">
                          {b.morning1_km > 0 ? (
                            <span><b>{b.morning1_km} km</b> <span className="muted" style={{ fontSize: '10.5px' }}>({b.morning1_trips}t)</span></span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td style={{ textAlign: 'center' }} className="mono">
                          {b.morning2_km > 0 ? (
                            <span><b>{b.morning2_km} km</b> <span className="muted" style={{ fontSize: '10.5px' }}>({b.morning2_trips}t)</span></span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td style={{ textAlign: 'center' }} className="mono">
                          {b.evening1_km > 0 ? (
                            <span><b>{b.evening1_km} km</b> <span className="muted" style={{ fontSize: '10.5px' }}>({b.evening1_trips}t)</span></span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td style={{ textAlign: 'center' }} className="mono">
                          {b.evening2_km > 0 ? (
                            <span><b>{b.evening2_km} km</b> <span className="muted" style={{ fontSize: '10.5px' }}>({b.evening2_trips}t)</span></span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '180px' }}>
                          {b.routes !== '—' ? <b>{b.routes}</b> : <span className="muted">—</span>}
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '180px' }}>
                          {b.drivers !== '—' ? b.drivers : <span className="muted">—</span>}
                        </td>
                        <td className="hide-on-print" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBus(isSelected ? null : b);
                            }}
                          >
                            {isSelected ? 'Hide Details ▲' : 'View Trips ▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Accordion Row directly underneath this bus */}
                      {isSelected && (
                        <tr key={`trips-${b.bus_id || b.registration_number}`}>
                          <td colSpan="12" style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '2px solid var(--marigold)', borderLeft: '4px solid var(--marigold)' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    background: 'var(--navy)',
                                    color: '#fff',
                                    padding: '3px 8px',
                                    borderRadius: '4px'
                                  }}>
                                    {b.registration_number}
                                  </span>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-2)' }}>
                                    Detailed Trip History & Stoppages
                                  </span>
                                  <span className="tag tag--ok">
                                    {busTrips.length} {busTrips.length === 1 ? 'Trip' : 'Trips'} Logged
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                  Institution: <b>{b.institution || '—'}</b> &nbsp;|&nbsp; Total Distance: <b>{b.total_km.toLocaleString('en-IN')} km</b> &nbsp;|&nbsp; Routes: <b>{b.routes || '—'}</b>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="btn btn-xs btn-outline hide-on-print"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedBus(null);
                                }}
                              >
                                Close Details ✕
                              </button>
                            </div>

                            {busTrips.length === 0 ? (
                              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', background: '#fff', borderRadius: '6px', border: '1px solid var(--paper-2)' }}>
                                No detailed trip records logged for this bus in the selected date range.
                              </div>
                            ) : (
                              <div className="table-wrap" style={{ maxHeight: '380px', overflowY: 'auto', background: '#ffffff', borderRadius: '6px', border: '1px solid var(--paper-2)' }}>
                                <table className="tbl" style={{ margin: 0 }}>
                                  <thead>
                                    <tr style={{ background: 'var(--paper-2)' }}>
                                      <th style={{ width: '35px' }}>#</th>
                                      <th>Date</th>
                                      <th>Shift</th>
                                      <th>Institution</th>
                                      <th>Route</th>
                                      <th>Driver</th>
                                      <th>Stoppages (From ➔ To)</th>
                                      <th style={{ textAlign: 'right' }}>Odometer</th>
                                      <th style={{ textAlign: 'right' }}>Trip KM</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {busTrips.map((t, idx) => (
                                      <tr key={t.id || idx}>
                                        <td className="muted mono">{idx + 1}</td>
                                        <td className="mono">{fmtDate(t.date)}</td>
                                        <td>
                                          <span style={{
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            fontWeight: '700',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: t.shift?.startsWith('morning') ? '#e6f4ea' : '#fef7e0',
                                            color: t.shift?.startsWith('morning') ? '#137333' : '#b06000'
                                          }}>
                                            {t.shift}
                                          </span>
                                        </td>
                                        <td>{t.institution || b.institution || '—'}</td>
                                        <td className="mono">
                                          {t.route_code !== '—' ? <b>{t.route_code} <span className="muted" style={{ fontWeight: 'normal' }}>· {t.route_name}</span></b> : '—'}
                                        </td>
                                        <td><b>{t.driver_name || '—'}</b></td>
                                        <td style={{ fontSize: '12px' }}>
                                          {t.start_stop || '—'} ➔ {t.end_stop || '—'}
                                        </td>
                                        <td className="mono" style={{ textAlign: 'right', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                                          {t.start_km} ➔ {t.end_km}
                                        </td>
                                        <td className="mono" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--navy)' }}>
                                          {t.km.toLocaleString('en-IN')} km
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DistanceReportView({ data }) {
  const [busSearch, setBusSearch] = useState('');
  const totalKm = data.byBus.reduce((sum, r) => sum + r.km, 0);

  const filteredByBus = (data.byBus || []).filter(b => {
    if (!busSearch.trim()) return true;
    const q = busSearch.toLowerCase().trim();
    return (b.registration_number && b.registration_number.toLowerCase().includes(q)) ||
           (b.institution && b.institution.toLowerCase().includes(q)) ||
           (b.driver_name && b.driver_name.toLowerCase().includes(q)) ||
           (b.route_code && b.route_code.toLowerCase().includes(q));
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div className="section-h" style={{ margin: 0 }}>By Bus & Driver</div>
        <div className="hide-on-print" style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            className="finput" 
            style={{ paddingLeft: '32px', height: '36px', borderRadius: '8px' }}
            placeholder="Search bus number, driver..." 
            value={busSearch} 
            onChange={e => setBusSearch(e.target.value)} 
          />
          <span style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-dim)' }}>🔍</span>
          {busSearch && (
            <button 
              type="button" 
              onClick={() => setBusSearch('')} 
              style={{ position: 'absolute', right: '10px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '14px' }}>
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Bus</th><th>Institution</th><th>Route</th><th>Driver</th><th>Trip 1 (Morning 1)</th><th>Trip 2 (Morning 2)</th><th>Trip 3 (Evening 1)</th><th>Trip 4 (Evening 2)</th><th>Total KM</th></tr></thead>
          <tbody>
            {filteredByBus.map((b, i) => {
              const hasOtherMorning1Driver = data.byBus.some(other => 
                other.route_code === b.route_code && 
                other.driver_name !== b.driver_name && 
                other.morning1_km > 0
              );
              const hasOtherMorning2Driver = data.byBus.some(other => 
                other.route_code === b.route_code && 
                other.driver_name !== b.driver_name && 
                other.morning2_km > 0
              );
              const hasOtherEvening1Driver = data.byBus.some(other => 
                other.route_code === b.route_code && 
                other.driver_name !== b.driver_name && 
                other.evening1_km > 0
              );
              const hasOtherEvening2Driver = data.byBus.some(other => 
                other.route_code === b.route_code && 
                other.driver_name !== b.driver_name && 
                other.evening2_km > 0
              );

              return (
                <tr key={i}>
                  <td className="mono"><b>{b.registration_number}</b></td>
                  <td>{b.institution || '—'}</td>
                  <td>{b.route_code !== '—' ? <b>{b.route_code} <span className="muted">· {b.route_name}</span></b> : '—'}</td>
                  <td><b>{b.driver_name || '—'}</b></td>
                  <td>
                    {b.morning1_km > 0 ? (
                      <>
                        <span className="mono">{b.morning1_km.toLocaleString('en-IN')} km</span>
                        {b.morning1_start && b.morning1_end && (
                          <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                            {b.morning1_start} ➔ {b.morning1_end}
                          </div>
                        )}
                      </>
                    ) : hasOtherMorning1Driver ? (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '11px' }}>(DIFFERENT DRIVER)</span>
                    ) : '—'}
                  </td>
                  <td>
                    {b.morning2_km > 0 ? (
                      <>
                        <span className="mono">{b.morning2_km.toLocaleString('en-IN')} km</span>
                        {b.morning2_start && b.morning2_end && (
                          <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                            {b.morning2_start} ➔ {b.morning2_end}
                          </div>
                        )}
                      </>
                    ) : hasOtherMorning2Driver ? (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '11px' }}>(DIFFERENT DRIVER)</span>
                    ) : '—'}
                  </td>
                  <td>
                    {b.evening1_km > 0 ? (
                      <>
                        <span className="mono">{b.evening1_km.toLocaleString('en-IN')} km</span>
                        {b.evening1_start && b.evening1_end && (
                          <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                            {b.evening1_start} ➔ {b.evening1_end}
                          </div>
                        )}
                      </>
                    ) : hasOtherEvening1Driver ? (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '11px' }}>(DIFFERENT DRIVER)</span>
                    ) : '—'}
                  </td>
                  <td>
                    {b.evening2_km > 0 ? (
                      <>
                        <span className="mono">{b.evening2_km.toLocaleString('en-IN')} km</span>
                        {b.evening2_start && b.evening2_end && (
                          <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                            {b.evening2_start} ➔ {b.evening2_end}
                          </div>
                        )}
                      </>
                    ) : hasOtherEvening2Driver ? (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '11px' }}>(DIFFERENT DRIVER)</span>
                    ) : '—'}
                  </td>
                  <td className="mono"><b>{b.km.toLocaleString('en-IN')} km</b></td>
                </tr>
              );
            })}
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
        <div>
          <div className="print-header" style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 5px 0', color: '#000', letterSpacing: '0.4px' }}>{collegeName}</h2>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', letterSpacing: '0.8px' }}>ROUTES SUMMARY REPORT</div>
          </div>
          <div className="section-h hide-on-print">Routes Summary</div>
          <div className="table-wrap">
            <table className="tbl tbl-spacious">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>#</th>
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
        <div>
          <div className="print-header" style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 5px 0', color: '#000', letterSpacing: '0.4px' }}>{collegeName}</h2>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', letterSpacing: '0.8px' }}>STOPS DETAILS REPORT</div>
          </div>
          <div className="section-h hide-on-print">Stops Details</div>
          <div className="table-wrap">
            <table className="tbl tbl-spacious">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>#</th>
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
