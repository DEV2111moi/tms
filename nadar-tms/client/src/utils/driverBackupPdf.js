import api from '../api/api';

/**
 * Format a time string (e.g. "08:00:00", "08:30", "14:15:00") into 12-hour AM/PM format (e.g. "08:00 AM", "02:15 PM")
 */
export function formatTime12(t) {
  if (!t) return '';
  const parts = String(t).trim().split(':');
  if (parts.length < 2) return t;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

/**
 * Format date nicely
 */
function formatDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return d;
  }
}

/**
 * Core export function for Driver Shift & Route Backup PDF
 */
export async function exportDriverShiftBackupPdf({
  institutionTitle = 'NADAR GROUP OF INSTITUTIONS — FLEET MANAGEMENT',
  userName = 'Administrator',
  activeInstId = 'all',
  searchQuery = ''
} = {}) {
  // 1. Fetch fresh live data concurrently
  const filter = (activeInstId && activeInstId !== 'all') ? { institution_id: activeInstId } : { institution_id: 'all' };
  const [driversRes, assignRes, refRes] = await Promise.all([
    api.listRes('drivers', filter).catch(() => ({ items: [] })),
    api.assignments().catch(() => ({ items: [] })),
    api.refs().catch(() => ({}))
  ]);

  const rawDrivers = driversRes.items || [];
  const assignments = assignRes.items || [];
  const routesRef = refRes.routes || [];

  // Build route lookup map by id and by code
  const routeMap = {};
  routesRef.forEach(r => {
    routeMap[String(r.id)] = r;
    if (r.route_code) {
      routeMap[r.route_code.trim().toUpperCase()] = r;
    }
  });

  // Filter drivers if search query is provided
  const query = (searchQuery || '').toLowerCase().trim();
  const drivers = rawDrivers.filter(d => {
    if (!query) return true;
    return (
      (d.name || '').toLowerCase().includes(query) ||
      (d.assigned_bus_numbers || '').toLowerCase().includes(query) ||
      (d.assigned_route_code || '').toLowerCase().includes(query) ||
      (d.assigned_route_name || '').toLowerCase().includes(query) ||
      (d.license_number || '').toLowerCase().includes(query) ||
      (d.phone || '').toLowerCase().includes(query) ||
      (d.employee_code || '').toLowerCase().includes(query) ||
      (d.institution_name || '').toLowerCase().includes(query)
    );
  });

  // Map drivers with assignments and detailed trip timings
  let totalAssignedDrivers = 0;
  let totalTripsLogged = 0;
  let m1Total = 0;
  let m2Total = 0;
  let e1Total = 0;
  let e2Total = 0;

  const driverRows = drivers.map(d => {
    // Find all assignments linked to this driver
    const dAssigns = assignments.filter(a => Number(a.driver_id) === Number(d.id));

    // Group assignments by shift
    const m1 = dAssigns.filter(a => a.shift === 'morning1');
    const m2 = dAssigns.filter(a => a.shift === 'morning2');
    const e1 = dAssigns.filter(a => a.shift === 'evening1');
    const e2 = dAssigns.filter(a => a.shift === 'evening2');

    const tripsCount = dAssigns.length;
    if (tripsCount > 0) {
      totalAssignedDrivers++;
      totalTripsLogged += tripsCount;
      m1Total += m1.length;
      m2Total += m2.length;
      e1Total += e1.length;
      e2Total += e2.length;
    }

    // Bus numbers set
    const busSet = new Set();
    dAssigns.forEach(a => {
      if (a.registration_number) busSet.add(a.registration_number.trim());
    });
    if (d.assigned_bus_numbers) {
      d.assigned_bus_numbers.split(',').forEach(b => {
        const tr = b.trim();
        if (tr) busSet.add(tr);
      });
    }
    const buses = Array.from(busSet);

    // Routes set
    const routeCodeSet = new Set();
    dAssigns.forEach(a => {
      if (a.route_code) routeCodeSet.add(a.route_code.trim());
    });
    if (d.assigned_route_code) {
      d.assigned_route_code.split(',').forEach(r => {
        const tr = r.trim();
        if (tr) routeCodeSet.add(tr);
      });
    }
    const routes = Array.from(routeCodeSet);

    // Institution / Campus name
    const campus = dAssigns[0]?.institution_name || d.institution_name || '—';

    // Enrich an assignment with route stop timings from routeMap
    const enrichTrip = (a) => {
      const rObj = (a.route_id ? routeMap[String(a.route_id)] : null) ||
                   (a.route_code ? routeMap[a.route_code.trim().toUpperCase()] : null) || {};
      const initialPoint = a.initial_point || rObj.initial_point || '';
      const initialTime = a.initial_time ? formatTime12(a.initial_time) : (rObj.initial_time ? formatTime12(rObj.initial_time) : '');
      const origin = a.origin || rObj.origin || '';
      const boardingTime = a.boarding_time ? formatTime12(a.boarding_time) : (rObj.boarding_time ? formatTime12(rObj.boarding_time) : '');
      const destination = a.destination || rObj.destination || '';
      const endTime = a.end_time ? formatTime12(a.end_time) : (rObj.end_time ? formatTime12(rObj.end_time) : '');

      return {
        bus: a.registration_number || '—',
        route_code: a.route_code || rObj.route_code || '—',
        route_name: a.route_name || rObj.route_name || '',
        initial_point: initialPoint,
        initial_time: initialTime,
        origin: origin,
        boarding_time: boardingTime,
        destination: destination,
        end_time: endTime,
        distance: a.total_distance || rObj.total_distance || ''
      };
    };

    return {
      driver: d,
      buses,
      routes,
      campus,
      tripsCount,
      m1Trips: m1.map(enrichTrip),
      m2Trips: m2.map(enrichTrip),
      e1Trips: e1.map(enrichTrip),
      e2Trips: e2.map(enrichTrip)
    };
  });

  const timestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Helper to render a single shift cell's content
  const renderShiftCell = (trips, shiftBg, shiftBorder, shiftLabel) => {
    if (!trips || trips.length === 0) {
      return `<div style="text-align: center; color: #94a3b8; font-weight: 700; font-size: 13px;">—</div>`;
    }

    const isEvening = shiftLabel.toLowerCase().includes('evening');

    return `
      <div style="display: flex; flex-direction: column; gap: 5px;">
        ${trips.map(t => {
          const hasInitial = !isEvening && t.initial_point && String(t.initial_point).trim().length > 0;
          return `
          <div style="background: ${shiftBg}; border: 1px solid ${shiftBorder}; border-radius: 5px; padding: 5px 6px; text-align: left; font-size: 9.5px; line-height: 1.35; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-weight: 800; color: #0f172a; font-family: ui-monospace, monospace; font-size: 10.5px;">
                ${t.route_code}
              </span>
              <span style="font-weight: 700; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 3px; padding: 1.5px 5px; font-size: 9px; font-family: ui-monospace, monospace;">
                🚌 ${t.bus}
              </span>
            </div>

            ${t.route_name ? `<div style="font-size: 8.5px; color: #475569; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${t.route_name}</div>` : ''}

            <div style="border-top: 1px dashed ${shiftBorder}; padding-top: 3px; display: flex; flex-direction: column; gap: 2.5px; font-size: 8.5px;">
              ${!isEvening ? `
                <!-- 1. INITIAL STARTING POINT -->
                <div style="display: flex; gap: 3px; align-items: center; background: #e0f2fe; border: 1px solid #bae6fd; padding: 2px 5px; border-radius: 3px;">
                  <span style="color: #0369a1; font-weight: 800; font-size: 8px; letter-spacing: 0.2px;">🚩 INITIAL:</span>
                  ${t.initial_point && String(t.initial_point).trim().length > 0 ? `
                    <span style="font-weight: 800; color: #0f172a; font-size: 9px;">${t.initial_point}</span>
                    ${t.initial_time ? `<span style="font-weight: 800; color: #0284c7; font-family: monospace; font-size: 8.5px;">(${t.initial_time})</span>` : ''}
                  ` : `
                    <span style="color: #64748b; font-weight: 700; font-size: 9px;">—</span>
                  `}
                </div>
              ` : ''}

              <!-- 2. BOARDING POINT -->
              <div style="display: flex; gap: 3px; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 2px 5px; border-radius: 3px;">
                <span style="color: #15803d; font-weight: 800; font-size: 8px; letter-spacing: 0.2px;">🚏 BOARD:</span>
                <span style="font-weight: 700; color: #0f172a; font-size: 9px;">${t.origin || 'Origin'}</span>
                ${t.boarding_time ? `<span style="font-weight: 800; color: #16a34a; font-family: monospace; font-size: 8.5px;">(${t.boarding_time})</span>` : ''}
              </div>

              <!-- 3. END POINT -->
              <div style="display: flex; gap: 3px; align-items: center; background: #fef2f2; border: 1px solid #fecaca; padding: 2px 5px; border-radius: 3px;">
                <span style="color: #b91c1c; font-weight: 800; font-size: 8px; letter-spacing: 0.2px;">🏁 END:</span>
                <span style="font-weight: 700; color: #0f172a; font-size: 9px;">${t.destination || 'Campus'}</span>
                ${t.end_time ? `<span style="font-weight: 800; color: #dc2626; font-family: monospace; font-size: 8.5px;">(${t.end_time})</span>` : ''}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: 8px; color: #64748b;">
              <span style="font-weight: 600; color: #15803d;">✓ ${shiftLabel}</span>
              ${t.distance ? `<span style="font-family: monospace; font-weight: 600; color: #475569;">${t.distance} km</span>` : ''}
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;
  };

  // Build table rows HTML
  const rowsHtml = driverRows.map((row, idx) => {
    const d = row.driver;
    const isActive = (d.status || '').toLowerCase() === 'active';

    return `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;" class="mono">${idx + 1}</td>
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 11px;">${d.name || '—'}</div>
          ${d.employee_code ? `<div style="font-size: 9px; color: #2563eb;" class="mono">ID: ${d.employee_code}</div>` : ''}
          ${d.phone ? `<div style="font-size: 9px; color: #475569;" class="mono">📞 ${d.phone}</div>` : ''}
          ${d.license_number ? `<div style="font-size: 8.5px; color: #64748b;" class="mono">DL: ${d.license_number}</div>` : ''}
        </td>
        <td>
          ${row.buses.length > 0 
            ? `<div style="display: flex; flex-wrap: wrap; gap: 3px;">
                ${row.buses.map(b => `<span style="display: inline-block; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700; border-radius: 4px; padding: 2px 5px; font-size: 9.5px;" class="mono">🚌 ${b}</span>`).join('')}
               </div>`
            : `<span style="color: #94a3b8; font-style: italic;">—</span>`
          }
        </td>
        <td style="font-weight: 600; color: #1e293b; font-size: 10px;">
          ${row.campus}
        </td>
        <td>
          ${row.routes.length > 0
            ? `<div style="display: flex; flex-wrap: wrap; gap: 3px;">
                ${row.routes.map(r => `<span style="display: inline-block; background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; font-weight: 700; border-radius: 4px; padding: 2px 5px; font-size: 9.5px;" class="mono">${r}</span>`).join('')}
               </div>`
            : `<span style="color: #94a3b8; font-style: italic;">— Standby</span>`
          }
        </td>
        <td style="text-align: center;">
          ${row.tripsCount > 0 
            ? `<span style="display: inline-block; background: #dcfce7; color: #166534; font-weight: 800; border: 1px solid #86efac; border-radius: 12px; padding: 2.5px 8px; font-size: 10px; white-space: nowrap;">
                 ${row.tripsCount} ${row.tripsCount === 1 ? 'trip' : 'trips'}
               </span>`
            : `<span style="display: inline-block; background: #f8fafc; color: #94a3b8; font-weight: 600; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2.5px 7px; font-size: 9.5px; white-space: nowrap;">
                 0 trips
               </span>`
          }
        </td>
        <td style="vertical-align: top; width: 14%;">
          ${renderShiftCell(row.m1Trips, '#f0fdf4', '#bbf7d0', 'Morning 1')}
        </td>
        <td style="vertical-align: top; width: 14%;">
          ${renderShiftCell(row.m2Trips, '#fefce8', '#fef08a', 'Morning 2')}
        </td>
        <td style="vertical-align: top; width: 14%;">
          ${renderShiftCell(row.e1Trips, '#fff7ed', '#fed7aa', 'Evening 1')}
        </td>
        <td style="vertical-align: top; width: 14%;">
          ${renderShiftCell(row.e2Trips, '#f5f3ff', '#ddd6fe', 'Evening 2')}
        </td>
        <td style="text-align: center;">
          <span class="tag-pill ${isActive ? 'tag-active' : 'tag-inactive'}">
            ${isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const htmlBody = `
    <div class="report-header">
      <div class="inst-name">${institutionTitle}</div>
      <div class="report-title">DRIVER FLEET, ROUTE & SHIFT ASSIGNMENT BACKUP REPORT</div>
      <div class="report-subtitle">Official Transport System Backup — Driver Name, Bus No, Campus, Routes, Trip Counts & Shift-Wise Route Timings (Morning 1, Morning 2, Evening 1, Evening 2)</div>
    </div>

    <div class="meta-row">
      <div>
        <b>Scope:</b> ${activeInstId !== 'all' ? institutionTitle : 'All Campuses Consolidated'} &bull; 
        <b>Total Drivers:</b> ${drivers.length} &bull; 
        <b>Total Logged Trips:</b> ${totalTripsLogged}
      </div>
      <div>
        <b>Backup Generated:</b> ${timestamp} &bull; 
        <b>Admin:</b> ${userName || 'Administrator'} &bull; 
        <span style="background: #e0e7ff; color: #4338ca; padding: 1.5px 6px; border-radius: 3px; font-weight: 700;" class="mono">SYSTEM BACKUP</span>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-val" style="color: #2563eb;">${drivers.length}</div>
        <div class="kpi-lbl">Total Drivers</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val" style="color: #16a34a;">${totalAssignedDrivers}</div>
        <div class="kpi-lbl">Assigned on Duty</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val" style="color: #d97706;">${drivers.length - totalAssignedDrivers}</div>
        <div class="kpi-lbl">Standby / Unassigned</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val" style="color: #0f172a;">${totalTripsLogged}</div>
        <div class="kpi-lbl">Total Shift Trips</div>
      </div>
      <div class="kpi-card" style="background: #f0fdf4;">
        <div class="kpi-val" style="color: #15803d;">${m1Total}</div>
        <div class="kpi-lbl">Morning 1 Trips</div>
      </div>
      <div class="kpi-card" style="background: #fefce8;">
        <div class="kpi-val" style="color: #ca8a04;">${m2Total}</div>
        <div class="kpi-lbl">Morning 2 Trips</div>
      </div>
      <div class="kpi-card" style="background: #fff7ed;">
        <div class="kpi-val" style="color: #ea580c;">${e1Total}</div>
        <div class="kpi-lbl">Evening 1 Trips</div>
      </div>
      <div class="kpi-card" style="background: #f5f3ff;">
        <div class="kpi-val" style="color: #7c3aed;">${e2Total}</div>
        <div class="kpi-lbl">Evening 2 Trips</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 3%; text-align: center;">#</th>
          <th style="width: 14%;">Driver Name & Contact</th>
          <th style="width: 10%;">Bus No</th>
          <th style="width: 9%;">Campus / Inst</th>
          <th style="width: 11%;">Assigned Route(s)</th>
          <th style="width: 7%; text-align: center;">Total Trips</th>
          <th style="width: 12%; background: #e2f7e8 !important; border-bottom: 2px solid #16a34a;">☀️ Morning 1</th>
          <th style="width: 12%; background: #fef9c3 !important; border-bottom: 2px solid #ca8a04;">☀️ Morning 2</th>
          <th style="width: 12%; background: #ffedd5 !important; border-bottom: 2px solid #ea580c;">🌙 Evening 1</th>
          <th style="width: 12%; background: #ede9fe !important; border-bottom: 2px solid #7c3aed;">🌙 Evening 2</th>
          <th style="width: 5%; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr style="background: #f1f5f9; font-weight: 800;">
          <td colspan="5" style="text-align: right; padding-right: 12px; font-size: 10.5px;">
            FLEET CONSOLIDATED TOTALS:
          </td>
          <td style="text-align: center; font-size: 10.5px;" class="mono">
            <b style="color: #166534;">${totalTripsLogged} trips</b>
          </td>
          <td style="text-align: center; color: #15803d; font-size: 10px;" class="mono">
            <b>${m1Total} trips</b>
          </td>
          <td style="text-align: center; color: #ca8a04; font-size: 10px;" class="mono">
            <b>${m2Total} trips</b>
          </td>
          <td style="text-align: center; color: #ea580c; font-size: 10px;" class="mono">
            <b>${e1Total} trips</b>
          </td>
          <td style="text-align: center; color: #7c3aed; font-size: 10px;" class="mono">
            <b>${e2Total} trips</b>
          </td>
          <td style="text-align: center; color: #15803d; font-size: 9.5px;">
            <b>${totalAssignedDrivers}/${drivers.length}</b>
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="signature-section">
      <div class="sig-box">
        Transport Incharge
        <div class="sig-title">Prepared By</div>
      </div>
      <div class="sig-box">
        Fleet Manager
        <div class="sig-title">Verified & Recorded</div>
      </div>
      <div class="sig-box">
        Principal / Director
        <div class="sig-title">Executive Approval</div>
      </div>
    </div>
  `;

  // Open native print window with A4 Landscape layout
  const printWin = window.open('', '_blank', 'width=1280,height=880');
  if (!printWin) {
    alert('Please allow popups in your browser to download / print the Backup PDF report.');
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Driver Shift & Route Backup Report - ${institutionTitle}</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4 landscape;
          margin: 7mm 7mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #0f172a;
          padding: 12px;
          margin: 0;
          background: #ffffff;
          font-size: 10.5px;
          line-height: 1.4;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .report-header {
          text-align: center;
          border-bottom: 2.5px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .inst-name {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.5px;
          margin: 0 0 3px 0;
        }
        .report-title {
          font-size: 12.5px;
          font-weight: 800;
          color: #4338ca;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin: 0 0 3px 0;
        }
        .report-subtitle {
          font-size: 10px;
          color: #475569;
          font-weight: 500;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          border-radius: 5px;
          margin-bottom: 10px;
          font-size: 10px;
        }
        .kpi-row {
          display: flex;
          gap: 7px;
          margin-bottom: 12px;
        }
        .kpi-card {
          flex: 1;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 6px 8px;
          border-radius: 5px;
          text-align: center;
        }
        .kpi-val {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          font-family: ui-monospace, monospace;
        }
        .kpi-lbl {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          margin-bottom: 16px;
          table-layout: auto;
        }
        thead {
          display: table-header-group;
        }
        th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 9.5px;
          letter-spacing: 0.3px;
          border: 1px solid #94a3b8;
          padding: 7px 6px;
          text-align: left;
          vertical-align: middle;
        }
        td {
          border: 1px solid #cbd5e1;
          padding: 6px 6px;
          vertical-align: middle;
          color: #1e293b;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        tr:nth-child(even) td {
          background-color: #fcfdfd !important;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .tag-pill {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .tag-active {
          background: #dcfce7 !important;
          color: #15803d !important;
          border: 1px solid #86efac;
        }
        .tag-inactive {
          background: #fee2e2 !important;
          color: #b91c1c !important;
          border: 1px solid #fca5a5;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 26px;
          padding-top: 10px;
          page-break-inside: avoid;
        }
        .sig-box {
          text-align: center;
          width: 180px;
          border-top: 1.5px solid #0f172a;
          padding-top: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #1e293b;
        }
        .sig-title {
          font-size: 9px;
          color: #64748b;
          font-weight: 500;
        }
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
  }, 450);
}
