import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';

// Helper to safely apply jspdf-autotable plugin across various bundler formats
function applyAutoTable(doc, options) {
  if (typeof autoTable === 'function') {
    return autoTable(doc, options);
  }
  if (autoTable && typeof autoTable.default === 'function') {
    return autoTable.default(doc, options);
  }
  if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  throw new Error('autoTable plugin is not available on jsPDF');
}

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
 * Draws 4 styled KPI Metric Cards
 */
function drawKpiBoxes(doc, startY, cards) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 32;
  const rightMargin = 32;
  const availableWidth = pageWidth - leftMargin - rightMargin;
  const gap = 12;
  const boxWidth = (availableWidth - gap * (cards.length - 1)) / cards.length;
  const boxHeight = 36;

  cards.forEach((c, idx) => {
    const x = leftMargin + idx * (boxWidth + gap);
    // Background card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 4, 4, 'FD');

    // Colored accent strip on left
    const accent = c.accent || [37, 99, 235];
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(x, startY, 4, boxHeight, 2, 2, 'F');

    // Value text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(String(c.value), x + 12, startY + 16);

    // Label text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(c.label).toUpperCase(), x + 12, startY + 28);
  });

  return startY + boxHeight + 14;
}

/**
 * Draws a 3-column Signatures Block
 */
function drawSignaturesBlock(doc, startY) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  // If there's not enough room at the bottom of the page, add a new page
  if (y + 50 > pageHeight - 25) {
    doc.addPage();
    y = 50;
  }

  const colWidth = 190;
  const leftX = 40;
  const midX = pageWidth / 2 - colWidth / 2;
  const rightX = pageWidth - leftX - colWidth;

  // Dashed lines
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.8);
  doc.line(leftX, y + 25, leftX + colWidth, y + 25);
  doc.line(midX, y + 25, midX + colWidth, y + 25);
  doc.line(rightX, y + 25, rightX + colWidth, y + 25);

  // Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Transport Officer / Supervisor', leftX + colWidth / 2, y + 36, { align: 'center' });
  doc.text('Fleet & Mechanical Engineer', midX + colWidth / 2, y + 36, { align: 'center' });
  doc.text('Principal / Institutional Head', rightX + colWidth / 2, y + 36, { align: 'center' });

  // Subtitles
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Prepared & Audited', leftX + colWidth / 2, y + 46, { align: 'center' });
  doc.text('Technical Verification', midX + colWidth / 2, y + 46, { align: 'center' });
  doc.text('Executive Approval & Sign-off', rightX + colWidth / 2, y + 46, { align: 'center' });

  return y + 55;
}

/**
 * Draws page footers and numbers across all pages of a document
 */
function drawPageFooters(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Nadar Saraswathi Group of Institutions • Fleet Management System (Nadar TMS)', 32, pageHeight - 12);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 32, pageHeight - 12, { align: 'right' });
  }
}

/**
 * Builds a standalone Vector PDF Document for a single institution
 */
export function generateInstitutionPdfDoc(instGroup, from, to) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const instName = (instGroup.name || instGroup.short_name || 'INSTITUTION').toUpperCase();
  const shortName = instGroup.short_name || instGroup.name || 'INSTITUTION';
  const buses = instGroup.buses || [];

  // 1. Institution Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('NADAR SARASWATHI GROUP OF INSTITUTIONS — FLEET MANAGEMENT', pageWidth / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(instName, pageWidth / 2, 44, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('OFFICIAL BUS-WISE FLEET PERFORMANCE & AUDIT REPORT', pageWidth / 2, 57, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const metaText = `Period: ${formatReportDate(from)} to ${formatReportDate(to)}   •   Campus: ${shortName}   •   Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}   •   System: Nadar TMS`;
  doc.text(metaText, pageWidth / 2, 69, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(32, 75, pageWidth - 32, 75);

  // 2. KPI Summary Boxes
  const kpiY = drawKpiBoxes(doc, 83, [
    { label: 'Buses Allocated', value: `${instGroup.busesCount || buses.length}`, accent: [37, 99, 235] },
    { label: 'Total Distance Covered', value: `${Number(instGroup.totalKm || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`, accent: [5, 150, 105] },
    { label: 'Total Trips Executed', value: `${instGroup.totalTrips || 0}`, accent: [217, 119, 6] },
    { label: 'Average Distance / Bus', value: `${instGroup.avgKm || 0} km`, accent: [124, 58, 237] }
  ]);

  // 3. Section 1 Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Consolidated Vehicle Fleet Summary — ${shortName}`, 32, kpiY + 2);

  // 4. Section 1 Table: Bus fleet summary
  const busesRows = buses.map((b, idx) => {
    const bdCount = (b.breakdownsList || []).length;
    const cdCount = (b.coversList || []).length;
    let statusText = 'Normal';
    if (bdCount > 0) statusText = `⚠️ ${bdCount} Breakdown`;
    else if (cdCount > 0) statusText = `🔄 ${cdCount} Cover`;

    return [
      idx + 1,
      b.registration_number,
      b.routes || '—',
      b.drivers || '—',
      Number(b.morning1_km || 0) > 0 ? `${Number(b.morning1_km).toFixed(1)} km (${b.morning1_trips})` : '—',
      Number(b.morning2_km || 0) > 0 ? `${Number(b.morning2_km).toFixed(1)} km (${b.morning2_trips})` : '—',
      Number(b.evening1_km || 0) > 0 ? `${Number(b.evening1_km).toFixed(1)} km (${b.evening1_trips})` : '—',
      Number(b.evening2_km || 0) > 0 ? `${Number(b.evening2_km).toFixed(1)} km (${b.evening2_trips})` : '—',
      b.total_trips || 0,
      `${Number(b.total_km || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`,
      statusText
    ];
  });

  applyAutoTable(doc, {
    startY: kpiY + 8,
    head: [['#', 'Bus Number', 'Routes Operated', 'Primary Driver', 'Morning 1', 'Morning 2', 'Evening 1', 'Evening 2', 'Trips', 'Total KM', 'Status']],
    body: busesRows,
    foot: [[
      '',
      `FLEET TOTAL (${shortName}):`,
      '',
      '',
      '',
      '',
      '',
      '',
      String(instGroup.totalTrips || 0),
      `${Number(instGroup.totalKm || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`,
      'Verified'
    ]],
    theme: 'grid',
    margin: { left: 32, right: 32, bottom: 25 },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.5,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 80, fontStyle: 'bold', textColor: [29, 78, 216] },
      2: { cellWidth: 105 },
      3: { cellWidth: 105, fontStyle: 'bold' },
      4: { cellWidth: 68, halign: 'center' },
      5: { cellWidth: 68, halign: 'center' },
      6: { cellWidth: 68, halign: 'center' },
      7: { cellWidth: 68, halign: 'center' },
      8: { cellWidth: 42, halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199] },
      9: { cellWidth: 78, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 70, halign: 'center' }
    }
  });

  // 5. Section 2: Detailed Bus Trip Log (starts on new page)
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Bus-by-Bus Detailed Trip & Incident Register — ${shortName}`, 32, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Itemized operational trip entries, route origins/destinations, and odometer readings for vehicles assigned to ${instName}.`, 32, 44);

  const tripsRows = [];
  buses.forEach(b => {
    const bTrips = b.allTrips || [];
    const bBreakdowns = b.breakdownsList || [];
    const bCovers = b.coversList || [];

    // Add note rows if breakdowns or covers exist
    if (bBreakdowns.length > 0) {
      bBreakdowns.forEach(s => {
        tripsRows.push([
          b.registration_number,
          formatReportDate(s.sub_date),
          'BREAKDOWN',
          `REPLACED BY ${s.substitute_bus_number || 'Alternate'} (Pilot: ${s.substitute_driver_name || '—'})`,
          `Route ${s.route_code || '—'}`,
          `Reason: ${s.reason || 'Mechanical Issue'}`,
          '—',
          '—',
          'INCIDENT'
        ]);
      });
    }

    if (bCovers.length > 0) {
      bCovers.forEach(s => {
        tripsRows.push([
          b.registration_number,
          formatReportDate(s.sub_date),
          'COVER DUTY',
          `SUBSTITUTE FOR ${s.original_bus_number} on ${s.route_code || '—'}`,
          'Cover Driver',
          `Shifts: ${s.shifts || 'Assigned'}`,
          '—',
          '—',
          'COVER'
        ]);
      });
    }

    if (bTrips.length === 0) {
      tripsRows.push([
        b.registration_number,
        '—',
        '—',
        b.routes || '—',
        b.drivers || '—',
        'No operational trips logged during selected period',
        '—',
        '—',
        '—'
      ]);
    } else {
      bTrips.forEach(t => {
        const sDist = Number(t.km || 0);
        tripsRows.push([
          b.registration_number,
          formatReportDate(t.date),
          SHIFT_LABELS[t.shift] || t.shift || 'Shift',
          `${t.route_code || '—'} ${t.route_name && t.route_name !== '—' ? `· ${t.route_name}` : ''}`.trim(),
          t.driver_name || '—',
          `${t.start_stop || 'Origin'} → ${t.end_stop || 'Dest'}`,
          t.start_km !== null && t.start_km !== undefined ? String(t.start_km) : '—',
          t.end_km !== null && t.end_km !== undefined ? String(t.end_km) : '—',
          sDist > 0 ? `${sDist.toFixed(1)} km` : '—'
        ]);
      });
    }
  });

  applyAutoTable(doc, {
    startY: 52,
    head: [['Bus Number', 'Date', 'Shift', 'Route Code & Name', 'Driver', 'Origin → Destination', 'Start', 'End', 'Distance']],
    body: tripsRows,
    theme: 'grid',
    margin: { left: 32, right: 32, bottom: 25 },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.5,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 72, fontStyle: 'bold', textColor: [29, 78, 216] },
      1: { cellWidth: 55, halign: 'center' },
      2: { cellWidth: 65, halign: 'center' },
      3: { cellWidth: 140 },
      4: { cellWidth: 105 },
      5: { cellWidth: 165 },
      6: { cellWidth: 50, halign: 'right' },
      7: { cellWidth: 50, halign: 'right' },
      8: { cellWidth: 60, halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] }
    }
  });

  // 6. Signatures Block
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 450;
  drawSignaturesBlock(doc, finalY + 12);

  // 7. Page Footers & Numbers
  drawPageFooters(doc);

  return doc;
}

/**
 * Builds the Master Consolidated PDF Document containing all institutions
 */
export function generateAllInstitutionsConsolidatedPdfDoc(institutionsGroups, from, to) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const totalBuses = institutionsGroups.reduce((sum, g) => sum + g.busesCount, 0);
  const totalKm = institutionsGroups.reduce((sum, g) => sum + g.totalKm, 0);
  const totalTrips = institutionsGroups.reduce((sum, g) => sum + g.totalTrips, 0);

  // Cover Sheet Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('NADAR GROUP OF INSTITUTIONS — CENTRAL FLEET MANAGEMENT', pageWidth / 2, 32, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text('EXECUTIVE MASTER FLEET PERFORMANCE & AUDIT REGISTER (ALL CAMPUSES)', pageWidth / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reporting Period: ${formatReportDate(from)} to ${formatReportDate(to)}   •   Campuses Audited: ${institutionsGroups.length} Institutions   •   Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth / 2, 62, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(32, 69, pageWidth - 32, 69);

  // Cover Sheet KPI Cards
  const kpiY = drawKpiBoxes(doc, 78, [
    { label: 'Institutions Enrolled', value: `${institutionsGroups.length} Campuses`, accent: [37, 99, 235] },
    { label: 'Total Fleet Deployed', value: `${totalBuses} Buses`, accent: [5, 150, 105] },
    { label: 'Total Network Mileage', value: `${Number(totalKm).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`, accent: [217, 119, 6] },
    { label: 'Total Operational Trips', value: `${totalTrips} Trips`, accent: [124, 58, 237] }
  ]);

  // Executive Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Campus-by-Campus Mileage & Fleet Allocation Roll', 32, kpiY + 4);

  const summaryRows = institutionsGroups.map((g, idx) => [
    idx + 1,
    `${g.name} (${g.short_name})`,
    `${g.busesCount} Buses`,
    g.totalTrips,
    `${Number(g.totalKm).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`,
    `${g.avgKm} km`,
    'Active & Verified'
  ]);

  applyAutoTable(doc, {
    startY: kpiY + 12,
    head: [['#', 'Institution Name', 'Buses Deployed', 'Trips Executed', 'Total Distance', 'Avg / Bus', 'Audit Status']],
    body: summaryRows,
    foot: [[
      '',
      'NETWORK FLEET TOTAL:',
      `${totalBuses} Buses`,
      String(totalTrips),
      `${Number(totalKm).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`,
      `${totalBuses > 0 ? (totalKm / totalBuses).toFixed(1) : 0} km`,
      'Verified'
    ]],
    theme: 'grid',
    margin: { left: 32, right: 32, bottom: 25 },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 260, fontStyle: 'bold' },
      2: { cellWidth: 100, halign: 'center', fontStyle: 'bold', textColor: [29, 78, 216] },
      3: { cellWidth: 90, halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199] },
      4: { cellWidth: 120, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 80, halign: 'right' },
      6: { cellWidth: 100, halign: 'center' }
    }
  });

  // Leadership sign-off on cover page
  const coverY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 420;
  drawSignaturesBlock(doc, coverY + 16);

  // Each campus gets its own full pages
  institutionsGroups.forEach(g => {
    doc.addPage();
    const instName = (g.name || g.short_name || 'INSTITUTION').toUpperCase();
    const shortName = g.short_name || g.name || 'INSTITUTION';
    const buses = g.buses || [];

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(instName, pageWidth / 2, 35, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('CAMPUS FLEET PERFORMANCE & AUDIT REGISTER', pageWidth / 2, 49, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(32, 57, pageWidth - 32, 57);

    // KPI Cards
    const instKpiY = drawKpiBoxes(doc, 65, [
      { label: 'Buses Allocated', value: `${g.busesCount}`, accent: [37, 99, 235] },
      { label: 'Total Distance', value: `${Number(g.totalKm || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`, accent: [5, 150, 105] },
      { label: 'Total Trips', value: `${g.totalTrips || 0}`, accent: [217, 119, 6] },
      { label: 'Average / Bus', value: `${g.avgKm || 0} km`, accent: [124, 58, 237] }
    ]);

    // Table
    const busesRows = buses.map((b, idx) => {
      const bdCount = (b.breakdownsList || []).length;
      const cdCount = (b.coversList || []).length;
      let statusText = 'Normal';
      if (bdCount > 0) statusText = `⚠️ ${bdCount} Breakdown`;
      else if (cdCount > 0) statusText = `🔄 ${cdCount} Cover`;

      return [
        idx + 1,
        b.registration_number,
        b.routes || '—',
        b.drivers || '—',
        Number(b.morning1_km || 0) > 0 ? `${Number(b.morning1_km).toFixed(1)} km (${b.morning1_trips})` : '—',
        Number(b.morning2_km || 0) > 0 ? `${Number(b.morning2_km).toFixed(1)} km (${b.morning2_trips})` : '—',
        Number(b.evening1_km || 0) > 0 ? `${Number(b.evening1_km).toFixed(1)} km (${b.evening1_trips})` : '—',
        Number(b.evening2_km || 0) > 0 ? `${Number(b.evening2_km).toFixed(1)} km (${b.evening2_trips})` : '—',
        b.total_trips || 0,
        `${Number(b.total_km || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`,
        statusText
      ];
    });

    applyAutoTable(doc, {
      startY: instKpiY + 8,
      head: [['#', 'Bus Number', 'Routes Operated', 'Primary Driver', 'Morning 1', 'Morning 2', 'Evening 1', 'Evening 2', 'Trips', 'Total KM', 'Status']],
      body: busesRows,
      foot: [[
        '',
        `FLEET TOTAL (${shortName}):`,
        '',
        '',
        '',
        '',
        '',
        '',
        String(g.totalTrips || 0),
        `${Number(g.totalKm || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`,
        'Verified'
      ]],
      theme: 'grid',
      margin: { left: 32, right: 32, bottom: 25 },
      styles: {
        fontSize: 8,
        cellPadding: 3.5,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      footStyles: {
        fillColor: [226, 232, 240],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 80, fontStyle: 'bold', textColor: [29, 78, 216] },
        2: { cellWidth: 105 },
        3: { cellWidth: 105, fontStyle: 'bold' },
        4: { cellWidth: 68, halign: 'center' },
        5: { cellWidth: 68, halign: 'center' },
        6: { cellWidth: 68, halign: 'center' },
        7: { cellWidth: 68, halign: 'center' },
        8: { cellWidth: 42, halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199] },
        9: { cellWidth: 78, halign: 'right', fontStyle: 'bold' },
        10: { cellWidth: 70, halign: 'center' }
      }
    });

    const pageInstY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 420;
    drawSignaturesBlock(doc, pageInstY + 12);
  });

  drawPageFooters(doc);
  return doc;
}

/**
 * Downloads all separate institution PDF reports packed inside a single ZIP file in 1-Click!
 */
export async function downloadAllInstitutionsZip({ institutionsGroups, from, to, onProgress }) {
  if (!institutionsGroups || institutionsGroups.length === 0) {
    alert('No institution fleet data available to export.');
    return;
  }

  const zip = new JSZip();
  const total = institutionsGroups.length;

  for (let i = 0; i < total; i++) {
    const instGroup = institutionsGroups[i];
    const shortName = (instGroup.short_name || instGroup.name || `Institution_${i + 1}`).trim();
    if (onProgress) {
      onProgress(i + 1, total, shortName);
    }

    // Generate individual institution PDF
    const doc = generateInstitutionPdfDoc(instGroup, from, to);
    const pdfBlob = doc.output('blob');
    const safeName = shortName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_Bus_Wise_Report_${from}_to_${to}.pdf`;

    zip.file(filename, pdfBlob);
  }

  // Also include the Master Consolidated PDF covering all institutions
  if (onProgress) {
    onProgress(total, total, 'Consolidated Master PDF');
  }
  const masterDoc = generateAllInstitutionsConsolidatedPdfDoc(institutionsGroups, from, to);
  zip.file(`All_Institutions_Consolidated_Master_Report_${from}_to_${to}.pdf`, masterDoc.output('blob'));

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFilename = `Institutions_Bus_Reports_${from}_to_${to}.zip`;
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single institution's report directly as a standalone .pdf file
 */
export function downloadSingleInstitutionPdf({ instGroup, from, to }) {
  if (!instGroup) return;
  const shortName = (instGroup.short_name || instGroup.name || 'INSTITUTION').trim();
  const safeName = shortName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Bus_Wise_Report_${from}_to_${to}.pdf`;
  const doc = generateInstitutionPdfDoc(instGroup, from, to);
  doc.save(filename);
}

/**
 * Downloads the Master Consolidated report directly as a standalone .pdf file
 */
export function downloadAllInstitutionsConsolidatedPdf({ institutionsGroups, from, to }) {
  if (!institutionsGroups || institutionsGroups.length === 0) return;
  const filename = `All_Institutions_Consolidated_Master_Report_${from}_to_${to}.pdf`;
  const doc = generateAllInstitutionsConsolidatedPdfDoc(institutionsGroups, from, to);
  doc.save(filename);
}
