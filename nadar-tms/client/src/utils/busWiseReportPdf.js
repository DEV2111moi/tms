/**
 * Utility for Generating and Directly Downloading Institution-Wise Bus Reports as PDFs
 * Nadar Saraswathi Group of Institutions — Fleet Management System
 */

// Helper to format date into "DD-MMM-YYYY"
export function formatReportDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return d;
  }
}

// Format 24h / time string to 12-hour AM/PM
export function formatTime12(t) {
  if (!t) return '';
  if (typeof t === 'string' && t.includes(' ')) {
    t = t.split(' ')[1];
  }
  const parts = String(t).trim().split(':');
  if (parts.length < 2) return t;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

const SHIFT_LABELS = {
  morning1: 'Morning 1 (Main Inbound)',
  morning2: 'Morning 2 (Late Inbound)',
  morning3: 'Morning 3',
  morning4: 'Morning 4',
  evening1: 'Evening 1 (Main Return)',
  evening2: 'Evening 2 (Late Return)',
  evening3: 'Evening 3',
  evening4: 'Evening 4',
  morning: 'Morning Trip',
  evening: 'Evening Trip'
};

/**
 * Group buses and trips cleanly by institution
 */
export function groupBusesByInstitution(buses = [], institutions = [], trips = [], substitutions = []) {
  // Index trips by bus ID and registration number
  const tripsByBus = {};
  (trips || []).forEach(t => {
    const bId = String(t.bus_id || '');
    const reg = String(t.registration_number || '').trim().toUpperCase();
    if (bId) {
      if (!tripsByBus[bId]) tripsByBus[bId] = [];
      tripsByBus[bId].push(t);
    }
    if (reg) {
      if (!tripsByBus[reg]) tripsByBus[reg] = [];
      tripsByBus[reg].push(t);
    }
  });

  // Index substitutions
  const getSubstitutionsForBus = (b) => {
    if (b.breakdowns && b.breakdowns.length > 0) return b.breakdowns;
    const busId = String(b.bus_id || b.id || '');
    const reg = String(b.registration_number || '').trim().toUpperCase();
    return (substitutions || []).filter(s =>
      (busId && String(s.original_bus_id) === busId) ||
      (reg && String(s.original_bus_number).trim().toUpperCase() === reg)
    );
  };

  const getCoversForBus = (b) => {
    if (b.cover_duties && b.cover_duties.length > 0) return b.cover_duties;
    const busId = String(b.bus_id || b.id || '');
    const reg = String(b.registration_number || '').trim().toUpperCase();
    return (substitutions || []).filter(s =>
      (busId && String(s.substitute_bus_id) === busId) ||
      (reg && String(s.substitute_bus_number).trim().toUpperCase() === reg)
    );
  };

  const instMap = new Map();

  // Populate known institutions
  (institutions || []).forEach(inst => {
    instMap.set(String(inst.id), {
      id: inst.id,
      name: inst.name || inst.short_name,
      short_name: inst.short_name || inst.name,
      buses: []
    });
  });

  const centralGroup = {
    id: 'central',
    name: 'Theni Melapettai Hindu Nadars Uravinmurai (Central Fleet)',
    short_name: 'Central Fleet',
    buses: []
  };

  buses.forEach(b => {
    let matched = false;
    const bInstId = b.institution_id ? String(b.institution_id) : null;
    const bInstStr = (b.institution || '').toLowerCase().trim();

    // Primary matching by institution_id (exact foreign key)
    if (bInstId && instMap.has(bInstId)) {
      instMap.get(bInstId).buses.push(b);
      matched = true;
    } else if (bInstStr && bInstStr !== '—') {
      // Fallback matching by institution short_name or full name
      for (const [id, inst] of instMap.entries()) {
        const sName = (inst.short_name || '').toLowerCase().trim();
        const fName = (inst.name || '').toLowerCase().trim();
        if ((sName && bInstStr.includes(sName)) || (fName && bInstStr.includes(fName))) {
          inst.buses.push(b);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      centralGroup.buses.push(b);
    }
  });

  const result = [];
  for (const [id, inst] of instMap.entries()) {
    if (inst.buses.length > 0) {
      // Calculate totals
      const totalKm = inst.buses.reduce((sum, b) => sum + Number(b.total_km || 0), 0);
      const totalTrips = inst.buses.reduce((sum, b) => sum + Number(b.total_trips || 0), 0);
      const avgKm = inst.buses.length > 0 ? (totalKm / inst.buses.length).toFixed(1) : 0;
      
      // Attach trips and substitutions to each bus
      inst.buses.forEach(b => {
        const bId = String(b.bus_id || b.id || '');
        const reg = String(b.registration_number || '').trim().toUpperCase();
        b.allTrips = tripsByBus[bId] || tripsByBus[reg] || [];
        b.breakdownsList = getSubstitutionsForBus(b);
        b.coversList = getCoversForBus(b);
      });

      result.push({
        ...inst,
        busesCount: inst.buses.length,
        totalKm,
        totalTrips,
        avgKm
      });
    }
  }

  if (centralGroup.buses.length > 0) {
    const totalKm = centralGroup.buses.reduce((sum, b) => sum + Number(b.total_km || 0), 0);
    const totalTrips = centralGroup.buses.reduce((sum, b) => sum + Number(b.total_trips || 0), 0);
    const avgKm = centralGroup.buses.length > 0 ? (totalKm / centralGroup.buses.length).toFixed(1) : 0;
    centralGroup.buses.forEach(b => {
      const bId = String(b.bus_id || b.id || '');
      const reg = String(b.registration_number || '').trim().toUpperCase();
      b.allTrips = tripsByBus[bId] || tripsByBus[reg] || [];
      b.breakdownsList = getSubstitutionsForBus(b);
      b.coversList = getCoversForBus(b);
    });
    result.push({
      ...centralGroup,
      busesCount: centralGroup.buses.length,
      totalKm,
      totalTrips,
      avgKm
    });
  }

  return result;
}

/**
 * Builds the HTML content for an individual institution section
 */
function buildInstitutionSectionHtml(instGroup, from, to, isStandalone = true) {
  const institutionName = (instGroup.name || instGroup.short_name || 'INSTITUTION').toUpperCase();
  const shortName = instGroup.short_name || instGroup.name || 'INSTITUTION';
  const buses = instGroup.buses || [];

  const busesRowsHtml = buses.map((b, idx) => {
    const bdCount = (b.breakdownsList || []).length;
    const cdCount = (b.coversList || []).length;
    let incidentBadge = '<span style="color: #15803d; font-weight: 700;">✓ Normal</span>';
    if (bdCount > 0) {
      incidentBadge = `<span style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9.5px;">⚠️ ${bdCount} Breakdown(s)</span>`;
    } else if (cdCount > 0) {
      incidentBadge = `<span style="background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9.5px;">🔄 ${cdCount} Cover Duty</span>`;
    }

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: #475569;">${idx + 1}</td>
        <td>
          <span style="font-family: 'JetBrains Mono', Consolas, monospace; font-weight: 800; color: #1d4ed8; font-size: 11.5px;">
            ${b.registration_number}
          </span>
        </td>
        <td style="color: #1e293b; font-size: 10px;">${b.routes || '—'}</td>
        <td style="color: #0f172a; font-weight: 600; font-size: 10.5px;">${b.drivers || '—'}</td>
        <td style="text-align: center;" class="mono">${Number(b.morning1_km || 0) > 0 ? `${Number(b.morning1_km).toFixed(1)} km <span class="trips-tag">(${b.morning1_trips})</span>` : '—'}</td>
        <td style="text-align: center;" class="mono">${Number(b.morning2_km || 0) > 0 ? `${Number(b.morning2_km).toFixed(1)} km <span class="trips-tag">(${b.morning2_trips})</span>` : '—'}</td>
        <td style="text-align: center;" class="mono">${Number(b.evening1_km || 0) > 0 ? `${Number(b.evening1_km).toFixed(1)} km <span class="trips-tag">(${b.evening1_trips})</span>` : '—'}</td>
        <td style="text-align: center;" class="mono">${Number(b.evening2_km || 0) > 0 ? `${Number(b.evening2_km).toFixed(1)} km <span class="trips-tag">(${b.evening2_trips})</span>` : '—'}</td>
        <td style="text-align: center; font-weight: 800; color: #0284c7;" class="mono">${b.total_trips || 0}</td>
        <td style="text-align: right; font-weight: 800; color: #0f172a; font-size: 11.5px;" class="mono">${Number(b.total_km || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</td>
        <td style="text-align: center;">${incidentBadge}</td>
      </tr>
    `;
  }).join('');

  // Detailed Bus Cards with full breakdown of logged trips
  const detailedBusCardsHtml = buses.map((b) => {
    const bTrips = b.allTrips || [];
    const bBreakdowns = b.breakdownsList || [];
    const bCovers = b.coversList || [];

    let tripsRowsHtml = '';
    if (bTrips.length === 0) {
      tripsRowsHtml = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 10px; color: #64748b; font-style: italic;">
            No operational trip entries logged for this vehicle between ${formatReportDate(from)} and ${formatReportDate(to)}.
          </td>
        </tr>
      `;
    } else {
      tripsRowsHtml = bTrips.map(t => {
        const sDist = Number(t.km || 0);
        return `
          <tr>
            <td style="white-space: nowrap;" class="mono">${formatReportDate(t.date)}</td>
            <td>
              <span class="shift-badge ${String(t.shift).toLowerCase().includes('morning') ? 'shift-morning' : 'shift-evening'}">
                ${SHIFT_LABELS[t.shift] || t.shift || 'Shift'}
              </span>
            </td>
            <td><b>${t.route_code || '—'}</b> ${t.route_name && t.route_name !== '—' ? `· ${t.route_name}` : ''}</td>
            <td>${t.driver_name || '—'}</td>
            <td style="font-size: 9.5px;">${t.start_stop || 'Origin'} ${t.start_time ? `<br/><span class="mono" style="color:#64748b;">${formatTime12(t.start_time)}</span>` : ''}</td>
            <td style="font-size: 9.5px;">${t.end_stop || 'Dest'} ${t.end_time ? `<br/><span class="mono" style="color:#64748b;">${formatTime12(t.end_time)}</span>` : ''}</td>
            <td style="text-align: right;" class="mono">${t.start_km !== null && t.start_km !== undefined ? t.start_km : '—'}</td>
            <td style="text-align: right;" class="mono">${t.end_km !== null && t.end_km !== undefined ? t.end_km : '—'}</td>
            <td style="text-align: right; font-weight: 800; color: #1e3a8a;" class="mono">${sDist > 0 ? `${sDist.toFixed(1)} km` : '—'}</td>
          </tr>
        `;
      }).join('');
    }

    let incidentAlertsHtml = '';
    if (bBreakdowns.length > 0) {
      incidentAlertsHtml += `
        <div style="background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-size: 10px; color: #991b1b;">
          <b>⚠️ VEHICLE BREAKDOWN / REPLACEMENT RECORD:</b>
          ${bBreakdowns.map(s => `
            <div style="margin-top: 2px;">
              • <b>${formatReportDate(s.sub_date)}</b>: Replacement deployed: <b>${s.substitute_bus_number || 'Alternate Bus'}</b> 
              (Pilot: ${s.substitute_driver_name || '—'}) on Route <b>${s.route_code || '—'}</b>. Reason: <i>${s.reason || 'Mechanical failure'}</i>.
            </div>
          `).join('')}
        </div>
      `;
    }
    if (bCovers.length > 0) {
      incidentAlertsHtml += `
        <div style="background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-size: 10px; color: #5b21b6;">
          <b>🔄 SUBSTITUTE COVER DUTY RECORD:</b>
          ${bCovers.map(s => `
            <div style="margin-top: 2px;">
              • <b>${formatReportDate(s.sub_date)}</b>: Deployed as substitute for <b>${s.original_bus_number}</b> on Route <b>${s.route_code || '—'}</b> (${s.shifts || 'Assigned Shifts'}).
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="bus-detail-card" style="page-break-inside: avoid; break-inside: avoid; border: 1.5px solid #94a3b8; border-radius: 6px; margin-bottom: 14px; background: #ffffff; overflow: hidden;">
        <!-- Bus Card Header -->
        <div style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 15px;">🚌</span>
            <div>
              <span style="font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13.5px; font-weight: 800; color: #1e40af;">
                ${b.registration_number}
              </span>
              <span style="margin-left: 8px; font-size: 10.5px; font-weight: 600; color: #334155;">
                Routes: <b>${b.routes || '—'}</b> &bull; Pilot: <b>${b.drivers || '—'}</b>
              </span>
            </div>
          </div>
          <div style="display: flex; gap: 10px; font-size: 11px;">
            <span style="background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; padding: 2px 7px; border-radius: 4px; font-weight: 700;">
              Distance: ${Number(b.total_km || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
            </span>
            <span style="background: #f0fdf4; color: #166534; border: 1px solid #86efac; padding: 2px 7px; border-radius: 4px; font-weight: 700;">
              Trips: ${b.total_trips || 0}
            </span>
          </div>
        </div>

        <!-- Bus Card Content -->
        <div style="padding: 10px 12px;">
          ${incidentAlertsHtml}
          
          <table class="report-table" style="width: 100%;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="width: 10%;">Date</th>
                <th style="width: 15%;">Shift</th>
                <th style="width: 18%;">Route</th>
                <th style="width: 14%;">Driver</th>
                <th style="width: 13%;">Origin</th>
                <th style="width: 13%;">Destination</th>
                <th style="width: 5%; text-align: right;">Start</th>
                <th style="width: 5%; text-align: right;">End</th>
                <th style="width: 7%; text-align: right;">KM</th>
              </tr>
            </thead>
            <tbody>
              ${tripsRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="institution-report-wrapper ${!isStandalone ? 'institution-page-break' : ''}" style="${!isStandalone ? 'page-break-before: always; break-before: page;' : ''}">
      <!-- Institutional Document Header -->
      <div class="doc-header">
        <h1 class="org-title">${institutionName}</h1>
        <div class="report-subtitle">OFFICIAL BUS-WISE FLEET PERFORMANCE & TRIP AUDIT REPORT</div>
        <div class="meta-strip">
          <span>Reporting Period: <b>${formatReportDate(from)}</b> to <b>${formatReportDate(to)}</b></span>
          <span>&bull;</span>
          <span>Campus Scope: <b>${shortName}</b></span>
          <span>&bull;</span>
          <span>Generated: <b>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
          <span>&bull;</span>
          <span>System: <b>Nadar TMS</b></span>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #2563eb;">
          <div class="kpi-val">${instGroup.busesCount}</div>
          <div class="kpi-lbl">Buses Allocated</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #059669;">
          <div class="kpi-val">${Number(instGroup.totalKm || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div>
          <div class="kpi-lbl">Total Distance Covered</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #d97706;">
          <div class="kpi-val">${instGroup.totalTrips || 0}</div>
          <div class="kpi-lbl">Total Trips Executed</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #7c3aed;">
          <div class="kpi-val">${instGroup.avgKm} km</div>
          <div class="kpi-lbl">Average Distance / Bus</div>
        </div>
      </div>

      <!-- SECTION 1: CONSOLIDATED FLEET SUMMARY TABLE -->
      <div class="section-heading">1. Consolidated Vehicle Fleet Summary — ${shortName}</div>
      <table class="report-table" style="margin-bottom: 18px;">
        <thead>
          <tr>
            <th style="width: 3%; text-align: center;">#</th>
            <th style="width: 11%;">Bus Number</th>
            <th style="width: 14%;">Routes Operated</th>
            <th style="width: 14%;">Primary Driver</th>
            <th style="width: 9%; text-align: center;">Morning 1</th>
            <th style="width: 9%; text-align: center;">Morning 2</th>
            <th style="width: 9%; text-align: center;">Evening 1</th>
            <th style="width: 9%; text-align: center;">Evening 2</th>
            <th style="width: 6%; text-align: center;">Trips</th>
            <th style="width: 8%; text-align: right;">Total KM</th>
            <th style="width: 8%; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${busesRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #e2e8f0; font-weight: 800;">
            <td colspan="4" style="text-align: right;">FLEET TOTAL (${shortName}):</td>
            <td colspan="4" style="text-align: center; color: #334155;" class="mono">${instGroup.busesCount} Active Vehicles</td>
            <td style="text-align: center; color: #0284c7;" class="mono">${instGroup.totalTrips || 0}</td>
            <td style="text-align: right; color: #0f172a; font-size: 11.5px;" class="mono">${Number(instGroup.totalKm || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</td>
            <td style="text-align: center; color: #166534;">Verified</td>
          </tr>
        </tfoot>
      </table>

      <!-- SECTION 2: BUS-BY-BUS DETAILED TRIP REGISTER -->
      <div class="section-heading" style="page-break-before: always; break-before: page;">2. Bus-by-Bus Detailed Trip & Incident Register — ${shortName}</div>
      <div style="font-size: 10px; color: #64748b; margin-bottom: 10px;">
        Itemized shift logs, odometer intervals, origin/destination check-ins, and substitution records for each vehicle assigned to ${shortName}.
      </div>

      ${detailedBusCardsHtml}

      <!-- SIGNATURES BLOCK -->
      <div class="sig-row">
        <div class="sig-box">
          Transport Officer / Supervisor
          <div class="sig-sub">Prepared & Audited</div>
        </div>
        <div class="sig-box">
          Fleet & Mechanical Engineer
          <div class="sig-sub">Technical Verification</div>
        </div>
        <div class="sig-box">
          Principal / Institutional Head
          <div class="sig-sub">Executive Approval & Sign-Off</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Standard CSS rules for all report documents
 */
const BASE_REPORT_CSS = `
  @page {
    size: A4 landscape;
    margin: 8mm 8mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 12px;
    font-size: 10px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .mono {
    font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  }

  /* Screen only action bar */
  .screen-bar {
    position: sticky;
    top: 0;
    z-index: 10000;
    background: #0f172a;
    color: #ffffff;
    padding: 10px 18px;
    margin: -12px -12px 16px -12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .btn-print {
    background: #2563eb;
    color: #ffffff;
    border: none;
    padding: 7px 16px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
  }
  .btn-print:hover { background: #1d4ed8; }

  @media print {
    .screen-bar { display: none !important; }
    body { padding: 0; background: #ffffff; }
    .page-break { page-break-before: always; break-before: page; }
    .institution-page-break { page-break-before: always !important; break-before: page !important; }
  }

  /* Institutional Document Header */
  .doc-header {
    text-align: center;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .org-title {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.5px;
    margin: 0 0 3px 0;
  }
  .report-subtitle {
    font-size: 11.5px;
    font-weight: 700;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 5px 0;
  }
  .meta-strip {
    font-size: 10px;
    color: #475569;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 14px;
  }
  .meta-strip b { color: #0f172a; }

  /* KPI summary strip */
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .kpi-card {
    border: 1.5px solid #94a3b8;
    border-radius: 6px;
    padding: 8px 12px;
    background: #f8fafc;
  }
  .kpi-val {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    font-family: 'JetBrains Mono', monospace;
  }
  .kpi-lbl {
    font-size: 9.5px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  /* Tables */
  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  .report-table th, .report-table td {
    border: 1px solid #94a3b8;
    padding: 4px 6px;
    vertical-align: middle;
  }
  .report-table th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
    text-align: left;
  }
  .report-table tr:nth-child(even) {
    background: #f8fafc;
  }

  .trips-tag {
    font-size: 9px;
    color: #64748b;
    font-weight: normal;
  }

  .shift-badge {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 8.5px;
    font-weight: 700;
  }
  .shift-morning {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  .shift-evening {
    background: #faf5ff;
    color: #7e22ce;
    border: 1px solid #e9d5ff;
  }

  /* Section Headings */
  .section-heading {
    font-size: 11.5px;
    font-weight: 800;
    color: #0f172a;
    border-left: 4px solid #2563eb;
    padding-left: 8px;
    margin: 14px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Signature block */
  .sig-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-top: 24px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sig-box {
    border-top: 1.5px dashed #475569;
    padding-top: 8px;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    color: #1e293b;
  }
  .sig-sub {
    font-size: 8.5px;
    color: #64748b;
    font-weight: normal;
    margin-top: 2px;
  }
`;

/**
 * Builds standalone HTML for a single institution
 */
export function buildInstitutionBusReportHtml({ instGroup, from, to }) {
  const shortName = instGroup.short_name || instGroup.name || 'INSTITUTION';
  const safeFilename = `${shortName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Bus_Report_${from}_to_${to}`;
  const bodyContent = buildInstitutionSectionHtml(instGroup, from, to, true);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${safeFilename}</title>
      <style>${BASE_REPORT_CSS}</style>
    </head>
    <body>
      <div class="screen-bar">
        <div style="font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px;">
          <span>📑</span>
          <span><b>${shortName}</b> &bull; Official Bus-Wise Report (${formatReportDate(from)} to ${formatReportDate(to)})</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
        </div>
      </div>

      ${bodyContent}

      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Builds the Master Consolidated PDF HTML containing ALL institutions,
 * where each institution starts on its own page with its own headers, tables, and signatures.
 */
export function buildAllInstitutionsConsolidatedHtml({ institutionsGroups, from, to }) {
  const safeFilename = `All_Institutions_Bus_Wise_Report_${from}_to_${to}`;
  const totalBuses = institutionsGroups.reduce((sum, g) => sum + g.busesCount, 0);
  const totalKm = institutionsGroups.reduce((sum, g) => sum + g.totalKm, 0);
  const totalTrips = institutionsGroups.reduce((sum, g) => sum + g.totalTrips, 0);

  // Executive summary page at the beginning
  const summaryRowsHtml = institutionsGroups.map((g, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 700; color: #475569;">${idx + 1}</td>
      <td style="font-weight: 700; color: #0f172a; font-size: 11px;">${g.name} (${g.short_name})</td>
      <td style="text-align: center; font-weight: 800; color: #1d4ed8;" class="mono">${g.busesCount}</td>
      <td style="text-align: center; font-weight: 700; color: #0284c7;" class="mono">${g.totalTrips}</td>
      <td style="text-align: right; font-weight: 800; color: #0f172a;" class="mono">${Number(g.totalKm).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</td>
      <td style="text-align: right; color: #475569;" class="mono">${g.avgKm} km</td>
      <td style="text-align: center;"><span style="color: #166534; font-weight: 700;">✓ Active</span></td>
    </tr>
  `).join('');

  const institutionsSectionsHtml = institutionsGroups.map(g => {
    return buildInstitutionSectionHtml(g, from, to, false);
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${safeFilename}</title>
      <style>${BASE_REPORT_CSS}</style>
    </head>
    <body>
      <div class="screen-bar">
        <div style="font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px;">
          <span>🏛️</span>
          <span><b>All Institutions Consolidated Fleet Report</b> &bull; ${institutionsGroups.length} Campuses (${formatReportDate(from)} to ${formatReportDate(to)})</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print All Campuses</button>
        </div>
      </div>

      <!-- Executive Network Cover / Summary Sheet -->
      <div class="doc-header">
        <h1 class="org-title">NADAR GROUP OF INSTITUTIONS &bull; CENTRAL FLEET MANAGEMENT</h1>
        <div class="report-subtitle">EXECUTIVE MASTER FLEET PERFORMANCE & AUDIT REGISTER (ALL CAMPUSES)</div>
        <div class="meta-strip">
          <span>Reporting Period: <b>${formatReportDate(from)}</b> to <b>${formatReportDate(to)}</b></span>
          <span>&bull;</span>
          <span>Campuses Audited: <b>${institutionsGroups.length} Institutions</b></span>
          <span>&bull;</span>
          <span>Generated On: <b>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
        </div>
      </div>

      <!-- Network KPI Summary Cards -->
      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #2563eb;">
          <div class="kpi-val">${institutionsGroups.length} Campuses</div>
          <div class="kpi-lbl">Institutions Enrolled</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #059669;">
          <div class="kpi-val">${totalBuses} Buses</div>
          <div class="kpi-lbl">Total Fleet Deployed</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #d97706;">
          <div class="kpi-val">${Number(totalKm).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div>
          <div class="kpi-lbl">Total Network Mileage</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #7c3aed;">
          <div class="kpi-val">${totalTrips} Trips</div>
          <div class="kpi-lbl">Total Operational Trips</div>
        </div>
      </div>

      <div class="section-heading">Campus-by-Campus Mileage & Fleet Allocation Roll</div>
      <table class="report-table" style="margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="width: 4%; text-align: center;">#</th>
            <th style="width: 32%;">Institution Name</th>
            <th style="width: 12%; text-align: center;">Buses Deployed</th>
            <th style="width: 12%; text-align: center;">Trips Executed</th>
            <th style="width: 16%; text-align: right;">Total Distance</th>
            <th style="width: 12%; text-align: right;">Avg / Bus</th>
            <th style="width: 12%; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #e2e8f0; font-weight: 800;">
            <td colspan="2" style="text-align: right;">NETWORK FLEET TOTAL:</td>
            <td style="text-align: center; color: #1d4ed8;" class="mono">${totalBuses} Buses</td>
            <td style="text-align: center; color: #0284c7;" class="mono">${totalTrips}</td>
            <td style="text-align: right; color: #0f172a; font-size: 11.5px;" class="mono">${Number(totalKm).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</td>
            <td style="text-align: right; color: #475569;" class="mono">${totalBuses > 0 ? (totalKm / totalBuses).toFixed(1) : 0} km</td>
            <td style="text-align: center; color: #166534;">Verified</td>
          </tr>
        </tfoot>
      </table>

      <!-- Network Signatures Block -->
      <div class="sig-row" style="margin-bottom: 30px;">
        <div class="sig-box">
          Central Transport Officer
          <div class="sig-sub">Audited & Consolidated</div>
        </div>
        <div class="sig-box">
          Chief Fleet Engineer
          <div class="sig-sub">Technical Sign-off</div>
        </div>
        <div class="sig-box">
          President / General Secretary (TMHNU)
          <div class="sig-sub">Executive Administration Approval</div>
        </div>
      </div>

      <!-- Campus Specific Sections with page breaks -->
      ${institutionsSectionsHtml}

      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Trigger download/print of a single institution's bus-wise PDF report
 */
export function exportSingleInstitutionBusReportPdf({
  instGroup,
  from,
  to
}) {
  if (!instGroup) return false;

  const html = buildInstitutionBusReportHtml({ instGroup, from, to });
  const printWin = window.open('', '_blank', 'width=1280,height=900');
  if (!printWin) {
    alert('Please allow popups in your browser to download/print the PDF report.');
    return false;
  }

  printWin.document.write(html);
  printWin.document.close();
  return true;
}

/**
 * Trigger download/print of ALL institutions in a single consolidated PDF report
 * where each institution starts on its own page.
 */
export function exportAllInstitutionsConsolidatedPdf({
  institutionsGroups,
  from,
  to
}) {
  if (!institutionsGroups || institutionsGroups.length === 0) {
    alert('No institution fleet data available to export.');
    return false;
  }

  const html = buildAllInstitutionsConsolidatedHtml({ institutionsGroups, from, to });
  const printWin = window.open('', '_blank', 'width=1280,height=900');
  if (!printWin) {
    alert('Please allow popups in your browser to download/print the PDF report.');
    return false;
  }

  printWin.document.write(html);
  printWin.document.close();
  return true;
}

// Backward-compatible alias
export const exportAllInstitutionsBusReportPdf = exportAllInstitutionsConsolidatedPdf;

/**
 * Direct file download helper using Blob (never blocked by popup blockers!)
 */
function downloadHtmlBlob(filename, htmlContent) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all separate institution reports as individual offline HTML/PDF files
 * directly into the browser's Downloads folder without opening popups!
 */
export function downloadAllSeparateInstitutionFiles({
  institutionsGroups,
  from,
  to
}) {
  if (!institutionsGroups || institutionsGroups.length === 0) {
    alert('No institution fleet data available.');
    return;
  }

  institutionsGroups.forEach((instGroup, idx) => {
    setTimeout(() => {
      const shortName = instGroup.short_name || instGroup.name || 'INSTITUTION';
      const safeFilename = `Bus_Report_${shortName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${from}_to_${to}.html`;
      const html = buildInstitutionBusReportHtml({ instGroup, from, to });
      downloadHtmlBlob(safeFilename, html);
    }, idx * 250);
  });
}

// Re-export vector PDF generators and ZIP bundle utilities
export {
  generateInstitutionPdfDoc,
  generateAllInstitutionsConsolidatedPdfDoc,
  downloadAllInstitutionsZip,
  downloadSingleInstitutionPdf,
  downloadAllInstitutionsConsolidatedPdf
} from './busWisePdfGenerator';
