/**
 * Number to Indian English Currency Words converter
 */
export function numberToWords(num) {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function convertHundreds(val) {
    let str = '';
    if (val > 99) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
    } else if (val > 0) {
      str += a[val];
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const hundred = rem;

  if (crore > 0) words += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) words += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) words += convertHundreds(thousand) + ' Thousand ';
  if (hundred > 0) words += convertHundreds(hundred) + ' ';

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

/**
 * Format currency with commas (Indian numbering)
 */
export function formatCurrency(amount) {
  const n = parseFloat(amount) || 0;
  return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format YYYY-MM into readable month (e.g. '2026-09' -> 'September 2026')
 */
export function formatMonthYear(mStr) {
  if (!mStr) return '—';
  try {
    const parts = mStr.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const d = new Date(year, monthIndex, 1);
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  } catch (e) {}
  return mStr;
}

/**
 * Format YYYY-MM-DD
 */
export function formatDate(d) {
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
 * =========================================================================
 * 1. Single Driver Salary & Bata Pay Slip (PDF)
 * =========================================================================
 */
export function exportSingleSalarySlipPdf(salary) {
  if (!salary) return;

  const monthFormatted = formatMonthYear(salary.salary_month);
  const institutionName = (salary.institution_name || 'NADAR GROUP OF INSTITUTIONS').toUpperCase();
  const driverName = (salary.driver_name || 'DRIVER').toUpperCase();
  const netWords = numberToWords(salary.net_salary || 0);

  const basic = parseFloat(salary.basic_salary) || 0;
  const bataRate = parseFloat(salary.daily_bata_rate) || 0;
  const bataAmt = parseFloat(salary.bata_amount) || 0;
  const specialBata = parseFloat(salary.special_bata) || 0;
  const overtime = parseFloat(salary.overtime_amount) || 0;
  const otherAllow = parseFloat(salary.other_allowances) || 0;
  const gross = parseFloat(salary.gross_salary) || 0;

  const advance = parseFloat(salary.advance_deduction) || 0;
  const epf = parseFloat(salary.epf_deduction) || 0;
  const esi = parseFloat(salary.esi_deduction) || 0;
  const otherDed = parseFloat(salary.other_deductions) || 0;
  const totalDeductions = advance + epf + esi + otherDed;
  const net = parseFloat(salary.net_salary) || 0;

  const printWin = window.open('', '_blank', 'width=980,height=880');
  if (!printWin) {
    alert('Please allow popups in your browser to download / print the Salary Slip PDF.');
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Salary & Bata Slip - ${driverName} - ${salary.salary_month}</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 16px;
          font-size: 11px;
          line-height: 1.45;
        }
        .slip-container {
          border: 2px solid #1e3a8a;
          border-radius: 8px;
          padding: 16px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .inst-title {
          font-size: 19px;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          margin: 0 0 4px 0;
        }
        .dept-title {
          font-size: 13px;
          font-weight: 700;
          color: #0284c7;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .doc-title-badge {
          display: inline-block;
          background: #1e3a8a;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 18px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 4px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .info-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .info-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #1e3a8a;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 2.5px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 10.5px;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #64748b;
          font-weight: 600;
        }
        .info-val {
          color: #0f172a;
          font-weight: 700;
          text-align: right;
        }
        .tables-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          background: #ffffff;
        }
        th {
          background: #1e3a8a;
          color: #ffffff;
          padding: 6px 10px;
          text-align: left;
          font-weight: 700;
          font-size: 10.5px;
        }
        th.num {
          text-align: right;
        }
        td {
          padding: 5.5px 10px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }
        td.num {
          text-align: right;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 600;
        }
        tr.total-row td {
          font-weight: 800;
          background: #f1f5f9;
          border-top: 2px solid #94a3b8;
          border-bottom: 2px solid #94a3b8;
          color: #0f172a;
        }
        .net-pay-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #16a34a;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .net-title {
          font-size: 12px;
          font-weight: 800;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .net-words {
          font-size: 10.5px;
          font-style: italic;
          color: #15803d;
          margin-top: 2px;
          font-weight: 600;
        }
        .net-val {
          font-size: 20px;
          font-weight: 900;
          color: #15803d;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .payment-meta {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          justify-content: space-around;
          margin-bottom: 24px;
          font-size: 10px;
        }
        .payment-meta div {
          text-align: center;
        }
        .payment-meta span {
          display: block;
          color: #64748b;
          font-weight: 600;
        }
        .payment-meta strong {
          display: block;
          color: #0f172a;
          font-size: 11px;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 10px;
          text-transform: uppercase;
        }
        .status-paid {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .status-pending {
          background: #fef9c3;
          color: #854d0e;
          border: 1px solid #fde047;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 36px;
          padding-top: 14px;
        }
        .sig-box {
          border-top: 1.5px solid #0f172a;
          text-align: center;
          padding-top: 6px;
          font-weight: 700;
          font-size: 10.5px;
          color: #1e293b;
        }
        .sig-sub {
          font-size: 9px;
          color: #64748b;
          font-weight: 500;
        }
        .print-btn-bar {
          text-align: right;
          margin-bottom: 12px;
        }
        .btn-print {
          background: #1e3a8a;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          font-size: 12px;
        }
        @media print {
          .print-btn-bar { display: none; }
          body { padding: 0; background: #ffffff; }
          .slip-container { box-shadow: none; border-color: #000000; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      </div>

      <div class="slip-container">
        <!-- Header -->
        <div class="header">
          <h1 class="inst-title">${institutionName}</h1>
          <div class="dept-title">Department of Transport & Fleet Management</div>
          <div class="doc-title-badge">Driver Salary & Bata Pay Slip — ${monthFormatted}</div>
        </div>

        <!-- Information Cards -->
        <div class="grid-2">
          <!-- Driver Details -->
          <div class="info-card">
            <div class="info-title">Driver Profile & Vehicle Assignment</div>
            <div class="info-row">
              <span class="info-label">Driver Name:</span>
              <span class="info-val">${salary.driver_name || '—'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employee Code / ID:</span>
              <span class="info-val">${salary.employee_code || `DRV-${String(salary.driver_id).padStart(3, '0')}`}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Designation:</span>
              <span class="info-val">${salary.designation || 'Heavy Vehicle Driver'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Driving Licence No:</span>
              <span class="info-val">${salary.license_number || '—'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Mobile:</span>
              <span class="info-val">${salary.driver_phone || '—'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Assigned Bus(es):</span>
              <span class="info-val" style="color: #0284c7;">${salary.assigned_bus_numbers || 'Unassigned'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Assigned Route:</span>
              <span class="info-val">${salary.assigned_route_codes ? `${salary.assigned_route_codes} - ${salary.assigned_route_names || ''}` : 'General / Spare'}</span>
            </div>
          </div>

          <!-- Attendance & Period Details -->
          <div class="info-card">
            <div class="info-title">Pay Period & Attendance Record</div>
            <div class="info-row">
              <span class="info-label">Pay Period (Month):</span>
              <span class="info-val">${monthFormatted}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Working Days in Month:</span>
              <span class="info-val">${salary.working_days || 26} Days</span>
            </div>
            <div class="info-row">
              <span class="info-label">Actual Duty / Days Worked:</span>
              <span class="info-val" style="color: #166534; font-size: 11.5px;">${salary.present_days || 26} Days</span>
            </div>
            <div class="info-row">
              <span class="info-label">Daily Bata Rate:</span>
              <span class="info-val">${formatCurrency(bataRate)} / day</span>
            </div>
            <div class="info-row">
              <span class="info-label">Trips Completed:</span>
              <span class="info-val">${salary.total_trips || '—'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Status:</span>
              <span class="info-val">
                <span class="status-badge ${salary.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">
                  ${(salary.payment_status || 'PENDING').toUpperCase()}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Mode:</span>
              <span class="info-val" style="text-transform: capitalize;">${(salary.payment_mode || 'Bank Transfer').replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <!-- Tables: Earnings & Deductions -->
        <div class="tables-grid">
          <!-- Earnings -->
          <div>
            <table>
              <thead>
                <tr>
                  <th>EARNINGS & ALLOWANCES</th>
                  <th class="num">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td class="num">${formatCurrency(basic)}</td>
                </tr>
                <tr style="background: #fdfbf7;">
                  <td>
                    <strong>Daily Duty Bata</strong>
                    <div style="font-size: 9px; color: #b45309;">(${salary.present_days || 26} Days × ₹${bataRate.toFixed(2)})</div>
                  </td>
                  <td class="num" style="color: #b45309; font-weight: 700;">${formatCurrency(bataAmt)}</td>
                </tr>
                <tr>
                  <td>Special / Outstation Trip Bata</td>
                  <td class="num">${formatCurrency(specialBata)}</td>
                </tr>
                <tr>
                  <td>Overtime (OT) Allowance</td>
                  <td class="num">${formatCurrency(overtime)}</td>
                </tr>
                <tr>
                  <td>Other Allowances / Incentives</td>
                  <td class="num">${formatCurrency(otherAllow)}</td>
                </tr>
                <tr class="total-row">
                  <td>TOTAL GROSS EARNINGS (A)</td>
                  <td class="num">${formatCurrency(gross)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Deductions -->
          <div>
            <table>
              <thead>
                <tr>
                  <th>DEDUCTIONS & RECOVERIES</th>
                  <th class="num">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Salary Advance Recovered</td>
                  <td class="num">${formatCurrency(advance)}</td>
                </tr>
                <tr>
                  <td>Provident Fund (EPF)</td>
                  <td class="num">${formatCurrency(epf)}</td>
                </tr>
                <tr>
                  <td>Employee State Insurance (ESI)</td>
                  <td class="num">${formatCurrency(esi)}</td>
                </tr>
                <tr>
                  <td>Leave Deductions / Fines</td>
                  <td class="num">${formatCurrency(otherDed)}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">—</td>
                  <td class="num" style="color: #94a3b8;">₹ 0.00</td>
                </tr>
                <tr class="total-row">
                  <td>TOTAL DEDUCTIONS (B)</td>
                  <td class="num" style="color: #dc2626;">${formatCurrency(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Net Payable Salary Highlight Card -->
        <div class="net-pay-box">
          <div>
            <div class="net-title">NET SALARY & BATA PAYABLE (A - B)</div>
            <div class="net-words">In Words: ${netWords}</div>
          </div>
          <div class="net-val">${formatCurrency(net)}</div>
        </div>

        <!-- Payment Metadata -->
        <div class="payment-meta">
          <div>
            <span>Payment Mode</span>
            <strong>${(salary.payment_mode || 'Bank Transfer').replace('_', ' ').toUpperCase()}</strong>
          </div>
          <div>
            <span>Disbursement Date</span>
            <strong>${formatDate(salary.payment_date)}</strong>
          </div>
          <div>
            <span>UTR / Transaction Ref No</span>
            <strong>${salary.transaction_ref || '—'}</strong>
          </div>
          <div>
            <span>Remarks / Memo</span>
            <strong>${salary.remarks || 'Regular monthly pay & duty bata'}</strong>
          </div>
        </div>

        <!-- Signatures Block -->
        <div class="signatures">
          <div class="sig-box">
            Driver's Signature
            <div class="sig-sub">Received Cash / Pay Slip</div>
          </div>
          <div class="sig-box">
            Transport Supervisor
            <div class="sig-sub">Verified & Approved</div>
          </div>
          <div class="sig-box">
            Accounts / Principal
            <div class="sig-sub">Disbursed & Authorized</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  printWin.document.close();
}

/**
 * =========================================================================
 * 2. Monthly Consolidated Driver Salary & Bata Summary Sheet (PDF)
 * =========================================================================
 */
export function exportMonthlySalarySummaryPdf({
  month = '',
  items = [],
  stats = {},
  institutionTitle = 'NADAR GROUP OF INSTITUTIONS — FLEET MANAGEMENT',
  campusName = 'All Campuses'
} = {}) {
  const monthFormatted = formatMonthYear(month);

  const printWin = window.open('', '_blank', 'width=1280,height=900');
  if (!printWin) {
    alert('Please allow popups in your browser to download / print the Monthly Summary Report.');
    return;
  }

  const rowsHtml = items.map((item, idx) => {
    const basic = parseFloat(item.basic_salary) || 0;
    const bata = (parseFloat(item.bata_amount) || 0) + (parseFloat(item.special_bata) || 0);
    const ot = parseFloat(item.overtime_amount) || 0;
    const gross = parseFloat(item.gross_salary) || 0;
    const ded = (parseFloat(item.advance_deduction) || 0) + (parseFloat(item.epf_deduction) || 0) + (parseFloat(item.esi_deduction) || 0) + (parseFloat(item.other_deductions) || 0);
    const net = parseFloat(item.net_salary) || 0;

    return `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td>
          <div style="font-weight: 800; color: #1e3a8a;">${item.driver_name}</div>
          <div style="font-size: 9px; color: #64748b;">${item.employee_code || `DRV-${item.driver_id}`} | ${item.driver_phone || '—'}</div>
        </td>
        <td>
          <div style="font-weight: 700; color: #0284c7;">${item.assigned_bus_numbers || '—'}</div>
          <div style="font-size: 9px; color: #64748b;">${item.assigned_route_codes || 'General'}</div>
        </td>
        <td style="font-size: 10px;">${item.institution_name || '—'}</td>
        <td style="text-align: center; font-weight: 700;">${item.present_days}/${item.working_days}</td>
        <td style="text-align: right;" class="mono">${basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; color: #b45309; font-weight: 700;" class="mono">${bata.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right;" class="mono">${ot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: 700;" class="mono">${gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; color: #dc2626;" class="mono">${ded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: 800; color: #166534; font-size: 11px;" class="mono">
          ₹ ${net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; background: ${item.payment_status === 'paid' ? '#dcfce7; color: #166534;' : '#fef9c3; color: #854d0e;'}">
            ${(item.payment_status || 'PENDING').toUpperCase()}
          </span>
        </td>
        <td style="border-bottom: 1px dotted #94a3b8; width: 80px;"></td>
      </tr>
    `;
  }).join('');

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Monthly Driver Salary & Bata Sheet - ${monthFormatted}</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 12px;
          font-size: 10px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .title {
          font-size: 17px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0 0 2px 0;
        }
        .sub {
          font-size: 11.5px;
          font-weight: 700;
          color: #0284c7;
        }
        .meta-box {
          text-align: right;
          font-size: 10px;
        }
        .kpis {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .kpi {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 10px;
          text-align: center;
        }
        .kpi-val {
          font-size: 14px;
          font-weight: 900;
          font-family: monospace;
          color: #1e3a8a;
        }
        .kpi-lbl {
          font-size: 9px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
        }
        th {
          background: #1e3a8a;
          color: #ffffff;
          padding: 5px 6px;
          text-align: left;
          font-size: 9.5px;
          font-weight: 700;
          border: 1px solid #1e3a8a;
        }
        td {
          padding: 4.5px 6px;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        tfoot tr td {
          background: #f1f5f9;
          font-weight: 800;
          border-top: 2px solid #0f172a;
          border-bottom: 2px solid #0f172a;
          font-size: 10px;
        }
        .signatures {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 30px;
        }
        .sig-box {
          border-top: 1.5px solid #0f172a;
          text-align: center;
          padding-top: 4px;
          font-size: 10px;
          font-weight: 700;
        }
        .btn-print {
          background: #1e3a8a;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 4px;
          font-weight: 700;
          cursor: pointer;
          font-size: 11px;
        }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: right; margin-bottom: 8px;">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save Summary PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="title">${institutionTitle}</div>
          <div class="sub">DRIVER SALARY & BATA MASTER DISBURSEMENT REGISTER — ${monthFormatted}</div>
        </div>
        <div class="meta-box">
          <div><strong>Campus:</strong> ${campusName}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</div>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi">
          <div class="kpi-val">${stats.total_drivers || items.length}</div>
          <div class="kpi-lbl">Total Drivers</div>
        </div>
        <div class="kpi">
          <div class="kpi-val">₹ ${(stats.total_basic || 0).toLocaleString('en-IN')}</div>
          <div class="kpi-lbl">Basic Salary</div>
        </div>
        <div class="kpi" style="background: #fffbeb; border-color: #fde68a;">
          <div class="kpi-val" style="color: #b45309;">₹ ${(stats.total_bata || 0).toLocaleString('en-IN')}</div>
          <div class="kpi-lbl" style="color: #b45309;">Total Bata Disbursed</div>
        </div>
        <div class="kpi">
          <div class="kpi-val" style="color: #dc2626;">₹ ${(stats.total_deductions || 0).toLocaleString('en-IN')}</div>
          <div class="kpi-lbl">Total Deductions</div>
        </div>
        <div class="kpi" style="background: #f0fdf4; border-color: #bbf7d0;">
          <div class="kpi-val" style="color: #166534;">₹ ${(stats.total_net || 0).toLocaleString('en-IN')}</div>
          <div class="kpi-lbl" style="color: #166534;">Net Payout</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 3%; text-align: center;">#</th>
            <th style="width: 14%;">Driver Name & Contact</th>
            <th style="width: 10%;">Assigned Bus & Route</th>
            <th style="width: 10%;">Institution / Campus</th>
            <th style="width: 6%; text-align: center;">Days</th>
            <th style="width: 8%; text-align: right;">Basic (₹)</th>
            <th style="width: 8%; text-align: right;">Bata (₹)</th>
            <th style="width: 6%; text-align: right;">OT (₹)</th>
            <th style="width: 8%; text-align: right;">Gross (₹)</th>
            <th style="width: 7%; text-align: right;">Ded. (₹)</th>
            <th style="width: 9%; text-align: right;">Net Payable (₹)</th>
            <th style="width: 5%; text-align: center;">Status</th>
            <th style="width: 6%; text-align: center;">Signature</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align: right; padding-right: 8px;">CONSOLIDATED TOTALS:</td>
            <td style="text-align: right;" class="mono">₹ ${(stats.total_basic || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; color: #b45309;" class="mono">₹ ${(stats.total_bata || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;" class="mono">—</td>
            <td style="text-align: right;" class="mono">₹ ${(stats.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; color: #dc2626;" class="mono">₹ ${(stats.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; color: #166534; font-size: 11px;" class="mono">₹ ${(stats.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: center; font-size: 8.5px;">${stats.paid_count || 0} Paid</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="signatures">
        <div class="sig-box">Prepared By (Transport Supervisor)</div>
        <div class="sig-box">Checked By (Fleet Incharge)</div>
        <div class="sig-box">Verified By (Accounts Officer)</div>
        <div class="sig-box">Approved By (Principal / Director)</div>
      </div>
    </body>
    </html>
  `);
  printWin.document.close();
}
