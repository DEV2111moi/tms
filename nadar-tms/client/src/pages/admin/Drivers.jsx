import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { exportDriverShiftBackupPdf } from '../../utils/driverBackupPdf';

const COLUMNS = [
  {
    key: 'sno',
    label: 'S.NO',
    width: 55
  },
  {
    key: 'name',
    label: 'Name',
    render: (val) => (
      <span style={{ fontWeight: 700, color: 'var(--ink, #0f172a)' }}>{val}</span>
    )
  },
  {
    key: 'assigned_bus_numbers',
    label: 'Bus No',
    render: (val) => {
      if (!val) return <span style={{ color: 'var(--text-dim, #94a3b8)', fontStyle: 'italic' }}>—</span>;
      const buses = val.split(', ').map(b => b.trim()).filter(Boolean);
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {buses.map(b => (
            <span
              key={b}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '2px 7px',
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              <span style={{ fontSize: 11 }}>🚌</span> {b}
            </span>
          ))}
        </div>
      );
    }
  },
  { key: 'assigned_route_code', label: 'Assigned Route', mono: true },
  { key: 'license_number', label: 'Licence', mono: true },
  { key: 'phone', label: 'Mobile', mono: true },
  { key: 'license_expiry', label: 'Licence Expiry', date: true },
  { key: 'status', label: 'Status', tag: true },
];

const FIELDS = [
  { key: 'name', label: 'Driver Name', required: true },
  { key: 'license_number', label: 'Licence Number', required: true },
  { key: 'license_expiry', label: 'Licence Expiry', type: 'date' },
  { key: 'phone', label: 'Mobile' },
  { key: 'route_id', label: 'Route', type: 'route' },
  { key: 'institution_id', label: 'Institution', type: 'instref' },
  { key: 'user_id', label: 'Linked Login', type: 'userref', role: 'driver' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
  { key: 'employee_code', label: 'Employee Code' },
  { key: 'father_name', label: "Father's Name" },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  { key: 'blood_group', label: 'Blood Group' },
  { key: 'alternate_mobile', label: 'Alternate Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'current_address', label: 'Current Address', type: 'textarea', full: true },
  { key: 'aadhaar_no', label: 'Aadhaar No.' },
  { key: 'joining_date', label: 'Joining Date', type: 'date' },
  { key: 'experience_years', label: 'Experience (years)', type: 'number' },
  { key: 'emergency_contact_name', label: 'Emergency Contact' },
  { key: 'emergency_contact_no', label: 'Emergency Phone' },
];

function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime()) || dt.getFullYear() < 1920) return '—';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getLicenseStatus(expiryDate) {
  if (!expiryDate) return { label: 'Not Specified', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  try {
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime()) || exp.getFullYear() < 1920) {
      return { label: 'Not Specified', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: `Expired (${Math.abs(diffDays)}d ago)`, color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', isExpired: true };
    }
    if (diffDays <= 60) {
      return { label: `Expires in ${diffDays}d`, color: '#b45309', bg: '#fef3c7', border: '#fde68a', isExpiringSoon: true };
    }
    return { label: 'Valid', color: '#15803d', bg: '#dcfce7', border: '#86efac', isValid: true };
  } catch {
    return { label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  }
}

export default function Drivers() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState('all'); // 'all', 'assigned', 'unassigned'
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const load = (inst) => {
    setLoading(true);
    const filter = (inst && inst !== 'all') ? { institution_id: inst } : { institution_id: 'all' };
    api.listRes('drivers', filter).then(d => {
      setItems(d.items || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    api.refs().then(r => {
      setRefs({ ...r, users: [] });
      api.listUsers().then(u => setRefs(prev => ({ ...prev, users: u.items || [] }))).catch(() => {});
    }).catch(() => {});
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'all';
    setInstFilter(initialInst);
    load(initialInst);
  }, []);

  const handleInstChange = (v) => { setInstFilter(v); load(v); };
  const handleSave = async (data, id) => {
    const cleanData = { ...data };
    ['license_expiry', 'date_of_birth', 'joining_date', 'license_issue_date', 'badge_expiry_date'].forEach(k => {
      if (k in cleanData) {
        const v = cleanData[k];
        if (!v) cleanData[k] = null;
        else if (typeof v === 'string') {
          const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
          cleanData[k] = m ? m[1] : null;
        }
      }
    });
    await api.saveRes('drivers', cleanData, id);
    toast(id ? 'Saved' : 'Added');
    load(instFilter);
  };
  const handleDel = async (item) => { if (!confirm('Delete this driver?')) return; await api.delRes('drivers', item.id); toast('Deleted'); load(instFilter); };

  const filteredItems = items.filter(item => {
    const isAssigned = !!(item.assigned_bus_numbers || item.assigned_route_code);
    if (statusFilter === 'assigned' && !isAssigned) return false;
    if (statusFilter === 'unassigned' && isAssigned) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.assigned_bus_numbers || '').toLowerCase().includes(query) ||
      (item.assigned_route_code || '').toLowerCase().includes(query) ||
      (item.assigned_route_name || '').toLowerCase().includes(query) ||
      (item.license_number || '').toLowerCase().includes(query) ||
      (item.phone || '').toLowerCase().includes(query) ||
      (item.employee_code || '').toLowerCase().includes(query) ||
      (item.institution_name || '').toLowerCase().includes(query)
    );
  });

  // Calculate quick summary metrics
  const totalCount = items.length;
  const activeCount = items.filter(d => (d.status || '').toLowerCase() === 'active').length;
  const assignedCount = items.filter(d => !!(d.assigned_bus_numbers || d.assigned_route_code)).length;
  const unassignedCount = totalCount - assignedCount;
  const expiringOrExpiredCount = items.filter(d => {
    const st = getLicenseStatus(d.license_expiry);
    return st.isExpired || st.isExpiringSoon;
  }).length;

  const activeInst = refs.institutions?.find(i => String(i.id) === String(instFilter));
  const institutionTitle = activeInst 
    ? (activeInst.name || activeInst.short_name).toUpperCase() 
    : 'NADAR GROUP OF INSTITUTIONS — FLEET MANAGEMENT';

  // Helper: Open Print Window and Trigger Native Browser PDF Printing
  const printReportWindow = (title, htmlBody, landscape = true) => {
    const printWin = window.open('', '_blank', 'width=1180,height=820');
    if (!printWin) {
      alert('Please allow popups in your browser to print / save the PDF report.');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: ${landscape ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm 8mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            padding: 14px;
            margin: 0;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.45;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-header {
            text-align: center;
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .inst-name {
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }
          .report-title {
            font-size: 13px;
            font-weight: 700;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin: 0 0 3px 0;
          }
          .report-subtitle {
            font-size: 11px;
            color: #475569;
            font-weight: 500;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 10.5px;
          }
          .kpi-row {
            display: flex;
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            flex: 1;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 8px 10px;
            border-radius: 6px;
            text-align: center;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }
          .kpi-lbl {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 18px;
            table-layout: auto;
          }
          thead {
            display: table-header-group;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.4px;
            border: 1px solid #94a3b8;
            padding: 9px 8px;
            text-align: left;
            vertical-align: middle;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 8.5px 8px;
            vertical-align: middle;
            color: #1e293b;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
          .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 10px;
          }
          .tag-pill {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
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
            margin-top: 36px;
            padding-top: 14px;
            page-break-inside: avoid;
          }
          .sig-box {
            text-align: center;
            width: 180px;
            border-top: 1.5px solid #0f172a;
            padding-top: 5px;
            font-size: 10.5px;
            font-weight: 600;
            color: #1e293b;
          }
          .sig-title {
            font-size: 9.5px;
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
  };

  // 1. Generate Full Roster PDF Report
  const handlePrintAllDrivers = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const printList = searchQuery ? filteredItems : items;
    const rowsHtml = printList.map((d, idx) => {
      const licStatus = getLicenseStatus(d.license_expiry);
      const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
      const isActive = (d.status || '').toLowerCase() === 'active';

      return `
        <tr>
          <td style="text-align: center; font-weight: 600; color: #64748b;" class="mono">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${d.name || '—'}</div>
            ${d.father_name ? `<div style="font-size: 9.5px; color: #64748b;">S/o ${d.father_name}</div>` : ''}
            ${d.employee_code ? `<div style="font-size: 9.5px; color: #2563eb;" class="mono">ID: ${d.employee_code}</div>` : ''}
          </td>
          <td>
            ${d.assigned_bus_numbers 
              ? `<b style="color: #0369a1;" class="mono">🚌 ${d.assigned_bus_numbers}</b>` 
              : `<span style="color: #94a3b8; font-style: italic;">—</span>`
            }
          </td>
          <td>
            ${isAssigned 
              ? `<b style="color: #0f172a;" class="mono">${d.assigned_route_code}</b>` 
              : `<span style="color: #94a3b8; font-style: italic;">— Standby</span>`
            }
          </td>
          <td class="mono" style="font-weight: 600;">${d.license_number || '—'}</td>
          <td>
            <div class="mono" style="font-weight: 600;">${fmtDate(d.license_expiry)}</div>
            <span class="tag-pill" style="background: ${licStatus.bg} !important; color: ${licStatus.color} !important; border: 1px solid ${licStatus.border}; margin-top: 2px;">
              ${licStatus.label}
            </span>
          </td>
          <td>
            <div class="mono" style="font-weight: 600;">${d.phone || '—'}</div>
            ${d.emergency_contact_no ? `<div style="font-size: 9.5px; color: #dc2626;" class="mono">Emg: ${d.emergency_contact_no}</div>` : ''}
          </td>
          <td style="font-weight: 600; color: #334155;">${d.institution_name || '—'}</td>
          <td style="text-align: center;" class="mono">${d.blood_group || '—'}</td>
          <td style="text-align: center;" class="mono">${d.experience_years ? `${d.experience_years} yrs` : '—'}</td>
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
        <div class="report-title">FLEET DRIVERS MASTER DIRECTORY & COMPLIANCE REPORT</div>
        <div class="report-subtitle">Official Transport Personnel Register, Route Assignments & Licence Status</div>
      </div>

      <div class="meta-row">
        <div><b>Scope:</b> ${activeInst ? activeInst.name : 'All Campuses (Consolidated Fleet)'} &bull; <b>Total:</b> ${totalCount} Drivers</div>
        <div><b>Generated:</b> ${timestamp} &bull; <b>By:</b> ${user?.name || 'Administrator'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-val" style="color: #2563eb;">${totalCount}</div>
          <div class="kpi-lbl">Total Drivers</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #15803d;">${activeCount}</div>
          <div class="kpi-lbl">Active on Duty</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #d97706;">${assignedCount}</div>
          <div class="kpi-lbl">Assigned on Routes</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #475569;">${unassignedCount}</div>
          <div class="kpi-lbl">Standby / Reserve</div>
        </div>
        <div class="kpi-card" style="${expiringOrExpiredCount > 0 ? 'border-color: #fca5a5; background: #fff5f5;' : ''}">
          <div class="kpi-val" style="color: ${expiringOrExpiredCount > 0 ? '#b91c1c' : '#15803d'};">${expiringOrExpiredCount}</div>
          <div class="kpi-lbl">Licence Due / Alert</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th style="width: 150px;">Driver Details</th>
            <th style="width: 110px;">Bus No</th>
            <th style="width: 120px;">Assigned Route(s)</th>
            <th style="width: 115px;">Licence No</th>
            <th style="width: 110px;">Licence Expiry</th>
            <th style="width: 105px;">Contact Phone</th>
            <th>Campus / Institution</th>
            <th style="width: 50px; text-align: center;">Blood</th>
            <th style="width: 55px; text-align: center;">Exp</th>
            <th style="width: 65px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          <div>Prepared By</div>
          <div class="sig-title">Fleet / Transport Assistant</div>
        </div>
        <div class="sig-box">
          <div>Verified By</div>
          <div class="sig-title">Transport Manager / Incharge</div>
        </div>
        <div class="sig-box">
          <div>Approved By</div>
          <div class="sig-title">Principal / Director</div>
        </div>
      </div>
    `;

    printReportWindow(`Fleet Drivers Report - ${institutionTitle}`, htmlBody, true);
  };

  // 1b. Generate Assigned Drivers Only PDF Report
  const handlePrintAssignedDrivers = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const baseList = searchQuery ? filteredItems : items;
    const assignedList = baseList.filter(d => !!(d.assigned_bus_numbers || d.assigned_route_code));

    if (assignedList.length === 0) {
      alert('No assigned drivers found for the current campus/filter.');
      return;
    }

    const rowsHtml = assignedList.map((d, idx) => {
      const licStatus = getLicenseStatus(d.license_expiry);
      const isActive = (d.status || '').toLowerCase() === 'active';

      return `
        <tr>
          <td style="text-align: center; font-weight: 600; color: #64748b;" class="mono">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 11.5px;">${d.name || '—'}</div>
            ${d.employee_code ? `<div style="font-size: 9.5px; color: #2563eb;" class="mono">ID: ${d.employee_code}</div>` : ''}
            ${d.father_name ? `<div style="font-size: 9px; color: #64748b;">S/o ${d.father_name}</div>` : ''}
          </td>
          <td>
            ${d.assigned_bus_numbers 
              ? `<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 4px; font-weight: 700; display: inline-block;" class="mono">🚌 ${d.assigned_bus_numbers}</span>` 
              : `<span style="color: #94a3b8; font-style: italic;">—</span>`
            }
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;" class="mono">${d.assigned_route_code || '—'}</div>
            ${d.assigned_route_name ? `<div style="font-size: 9.5px; color: #64748b;">${d.assigned_route_name}</div>` : ''}
          </td>
          <td style="font-weight: 600; color: #334155;">${d.institution_name || '—'}</td>
          <td class="mono" style="font-weight: 600;">${d.license_number || '—'}</td>
          <td>
            <div class="mono" style="font-weight: 600;">${fmtDate(d.license_expiry)}</div>
            <span class="tag-pill" style="background: ${licStatus.bg} !important; color: ${licStatus.color} !important; border: 1px solid ${licStatus.border}; margin-top: 2px;">
              ${licStatus.label}
            </span>
          </td>
          <td class="mono" style="font-weight: 600;">
            ${d.phone || '—'}
            ${d.alternate_mobile ? `<div style="font-size: 9.5px; color: #64748b;">Alt: ${d.alternate_mobile}</div>` : ''}
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
        <div class="report-title" style="color: #15803d;">ASSIGNED FLEET DRIVERS & ROUTE DEPLOYMENT REPORT</div>
        <div class="report-subtitle">Official Register of Active Drivers Mapped to Bus Numbers, Routes & Campuses</div>
      </div>

      <div class="meta-row">
        <div><b>Report Scope:</b> ${activeInst ? activeInst.name : 'All Campuses'} &bull; <b>Assigned Drivers:</b> ${assignedList.length} of ${totalCount} Total</div>
        <div><b>Generated:</b> ${timestamp} &bull; <b>By:</b> ${user?.name || 'Transport Admin'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #16a34a;">
          <div class="kpi-val" style="color: #15803d;">${assignedList.length}</div>
          <div class="kpi-lbl">Assigned Drivers</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #2563eb;">${assignedList.filter(d => (d.status || '').toLowerCase() === 'active').length}</div>
          <div class="kpi-lbl">Active on Duty</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #0284c7;">
            ${new Set(assignedList.flatMap(d => (d.assigned_bus_numbers || '').split(', ').map(b => b.trim()).filter(Boolean))).size}
          </div>
          <div class="kpi-lbl">Assigned Buses</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #d97706;">
            ${new Set(assignedList.flatMap(d => (d.assigned_route_code || '').split(', ').map(r => r.trim()).filter(Boolean))).size}
          </div>
          <div class="kpi-lbl">Active Routes</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th style="width: 155px;">Driver Details</th>
            <th style="width: 140px;">Assigned Bus No</th>
            <th style="width: 150px;">Assigned Route</th>
            <th style="width: 140px;">Campus / Institution</th>
            <th style="width: 110px;">Licence No</th>
            <th style="width: 110px;">Licence Expiry</th>
            <th style="width: 110px;">Mobile Phone</th>
            <th style="width: 70px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          <div>Prepared By</div>
          <div class="sig-title">Transport Operations Assistant</div>
        </div>
        <div class="sig-box">
          <div>Verified By</div>
          <div class="sig-title">Transport Manager / Incharge</div>
        </div>
        <div class="sig-box">
          <div>Approved By</div>
          <div class="sig-title">Principal / Fleet Director</div>
        </div>
      </div>
    `;

    printReportWindow(`Assigned Drivers Report - ${institutionTitle}`, htmlBody, true);
  };

  // 1c. Generate Unassigned / Standby Drivers Only PDF Report
  const handlePrintUnassignedDrivers = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const baseList = searchQuery ? filteredItems : items;
    const unassignedList = baseList.filter(d => !(d.assigned_bus_numbers || d.assigned_route_code));

    if (unassignedList.length === 0) {
      alert('All drivers are currently assigned to buses and routes. No standby drivers found.');
      return;
    }

    const rowsHtml = unassignedList.map((d, idx) => {
      const licStatus = getLicenseStatus(d.license_expiry);
      const isActive = (d.status || '').toLowerCase() === 'active';

      return `
        <tr>
          <td style="text-align: center; font-weight: 600; color: #64748b;" class="mono">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 11.5px;">${d.name || '—'}</div>
            ${d.employee_code ? `<div style="font-size: 9.5px; color: #2563eb;" class="mono">ID: ${d.employee_code}</div>` : ''}
            ${d.father_name ? `<div style="font-size: 9px; color: #64748b;">S/o ${d.father_name}</div>` : ''}
          </td>
          <td style="font-weight: 600; color: #334155;">${d.institution_name || 'Consolidated / Unassigned'}</td>
          <td class="mono" style="font-weight: 600;">${d.license_number || '—'}</td>
          <td>
            <div class="mono" style="font-weight: 600;">${fmtDate(d.license_expiry)}</div>
            <span class="tag-pill" style="background: ${licStatus.bg} !important; color: ${licStatus.color} !important; border: 1px solid ${licStatus.border}; margin-top: 2px;">
              ${licStatus.label}
            </span>
          </td>
          <td class="mono" style="font-weight: 600;">
            ${d.phone || '—'}
            ${d.alternate_mobile ? `<div style="font-size: 9.5px; color: #64748b;">Alt: ${d.alternate_mobile}</div>` : ''}
          </td>
          <td style="text-align: center;" class="mono">${d.experience_years ? `${d.experience_years} yrs` : '—'}</td>
          <td style="text-align: center;" class="mono">${d.blood_group || '—'}</td>
          <td style="text-align: center;">
            <span class="tag-pill" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">
              Standby
            </span>
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
        <div class="report-title" style="color: #b45309;">UNASSIGNED & STANDBY DRIVERS ROSTER REPORT</div>
        <div class="report-subtitle">Reserve Transport Personnel Available for Immediate Route & Bus Allocation</div>
      </div>

      <div class="meta-row">
        <div><b>Report Scope:</b> ${activeInst ? activeInst.name : 'All Campuses'} &bull; <b>Unassigned Drivers:</b> ${unassignedList.length} of ${totalCount} Total</div>
        <div><b>Generated:</b> ${timestamp} &bull; <b>By:</b> ${user?.name || 'Transport Admin'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
          <div class="kpi-val" style="color: #b45309;">${unassignedList.length}</div>
          <div class="kpi-lbl">Unassigned Drivers</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #15803d;">${unassignedList.filter(d => (d.status || '').toLowerCase() === 'active').length}</div>
          <div class="kpi-lbl">Active on Standby</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #2563eb;">
            ${unassignedList.filter(d => !getLicenseStatus(d.license_expiry).isExpired).length}
          </div>
          <div class="kpi-lbl">Valid Licences</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #dc2626;">
            ${unassignedList.filter(d => getLicenseStatus(d.license_expiry).isExpired).length}
          </div>
          <div class="kpi-lbl">Expired Licences</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th style="width: 170px;">Driver Details</th>
            <th style="width: 160px;">Campus / Institution</th>
            <th style="width: 120px;">Licence No</th>
            <th style="width: 110px;">Licence Expiry</th>
            <th style="width: 110px;">Mobile Phone</th>
            <th style="width: 60px; text-align: center;">Exp</th>
            <th style="width: 55px; text-align: center;">Blood</th>
            <th style="width: 75px; text-align: center;">Allocation</th>
            <th style="width: 70px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          <div>Prepared By</div>
          <div class="sig-title">Transport Operations Assistant</div>
        </div>
        <div class="sig-box">
          <div>Verified By</div>
          <div class="sig-title">Transport Manager / Incharge</div>
        </div>
        <div class="sig-box">
          <div>Approved By</div>
          <div class="sig-title">Principal / Fleet Director</div>
        </div>
      </div>
    `;

    printReportWindow(`Unassigned Drivers Report - ${institutionTitle}`, htmlBody, true);
  };

  // 2. Generate Single Driver Bio-Data Profile PDF
  const handlePrintSingleDriver = (driver) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const licStatus = getLicenseStatus(driver.license_expiry);

    const htmlBody = `
      <div class="report-header">
        <div class="inst-name">${driver.institution_name !== '—' ? driver.institution_name.toUpperCase() : institutionTitle}</div>
        <div class="report-title">DRIVER SERVICE & CREDENTIALS BIO-DATA SHEET</div>
        <div class="report-subtitle">Official Transport Staff Profile & Verification Record</div>
      </div>

      <div class="meta-row">
        <div><b>Driver Name:</b> ${driver.name || '—'} ${driver.employee_code ? `&bull; <b>Emp Code:</b> ${driver.employee_code}` : ''}</div>
        <div><b>Status:</b> ${driver.status?.toUpperCase() || 'ACTIVE'} &bull; <b>Printed:</b> ${timestamp}</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            👤 PERSONAL INFORMATION
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Full Name</td><td><b>${driver.name || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Father's Name</td><td>${driver.father_name || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Date of Birth</td><td>${fmtDate(driver.date_of_birth)}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Gender</td><td style="text-transform: capitalize;">${driver.gender || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Blood Group</td><td><b>${driver.blood_group || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Aadhaar Number</td><td class="mono">${driver.aadhaar_no || '—'}</td></tr>
          </table>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            🪪 LICENCE & CREDENTIALS
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Licence Number</td><td class="mono"><b>${driver.license_number || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Licence Expiry</td><td>
              <span class="mono" style="font-weight: 700;">${fmtDate(driver.license_expiry)}</span>
              <span class="tag-pill" style="background: ${licStatus.bg}; color: ${licStatus.color}; margin-left: 6px;">${licStatus.label}</span>
            </td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Licence Issue Date</td><td class="mono">${fmtDate(driver.license_issue_date)}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Badge Number</td><td class="mono">${driver.badge_no || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Experience</td><td>${driver.experience_years ? `${driver.experience_years} Years` : '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Designation</td><td>${driver.designation || 'DRIVER'}</td></tr>
          </table>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            📞 CONTACT & ADDRESS
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Primary Mobile</td><td class="mono"><b>${driver.phone || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Alternate Mobile</td><td class="mono">${driver.alternate_mobile || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Email</td><td>${driver.email || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Current Address</td><td>${driver.current_address || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Native Place / Dist</td><td>${[driver.native_place, driver.district, driver.state].filter(Boolean).join(', ') || '—'}</td></tr>
          </table>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            🛣️ FLEET ASSIGNMENT & EMERGENCY
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Assigned Bus</td><td><b class="mono" style="color: #0369a1;">${driver.assigned_bus_numbers ? `🚌 ${driver.assigned_bus_numbers}` : 'Standby (No Bus)'}</b></td></tr>
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Assigned Routes</td><td><b class="mono" style="color: #2563eb;">${driver.assigned_route_code || 'Standby (Not Assigned)'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Campus / Inst</td><td><b>${driver.institution_name || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Emergency Contact</td><td><b>${driver.emergency_contact_name || '—'}</b> ${driver.emergency_contact_relation ? `(${driver.emergency_contact_relation})` : ''}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Emergency Phone</td><td class="mono" style="color: #dc2626; font-weight: 700;">${driver.emergency_contact_no || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Daily Trips</td><td class="mono">${driver.daily_trips || '—'}</td></tr>
          </table>
        </div>
      </div>

      <div class="signature-section" style="margin-top: 50px;">
        <div class="sig-box">
          <div>Driver's Signature</div>
          <div class="sig-title">I confirm the above details are accurate</div>
        </div>
        <div class="sig-box">
          <div>Transport Officer</div>
          <div class="sig-title">Verified & Recorded</div>
        </div>
        <div class="sig-box">
          <div>Principal / Authority</div>
          <div class="sig-title">Official Endorsement</div>
        </div>
      </div>
    `;

    printReportWindow(`Driver Profile - ${driver.name}`, htmlBody, false);
  };

  // 3. Export CSV Helper
  const handleExportCSV = () => {
    const headers = [
      '#', 'Name', 'Employee Code', 'Father Name', 'Assigned Bus', 'Assigned Route',
      'Licence Number', 'Licence Expiry', 'Phone', 'Emergency Contact',
      'Campus', 'Blood Group', 'Experience', 'Status'
    ];
    const rows = filteredItems.map((d, i) => [
      i + 1,
      d.name || '',
      d.employee_code || '',
      d.father_name || '',
      d.assigned_bus_numbers || 'Standby',
      d.assigned_route_code || 'Standby',
      d.license_number || '',
      fmtDate(d.license_expiry),
      d.phone || '',
      d.emergency_contact_no || '',
      d.institution_name || '',
      d.blood_group || '',
      d.experience_years ? `${d.experience_years} yrs` : '',
      d.status || 'active'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `drivers_master_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Drivers list downloaded as CSV');
  };

  const handlePrintDriverShiftBackup = async () => {
    try {
      await exportDriverShiftBackupPdf({
        institutionTitle,
        userName: user?.name || 'Administrator',
        activeInstId: instFilter,
        searchQuery
      });
    } catch (err) {
      console.error('Failed to export driver shift backup PDF:', err);
      toast('Could not generate Driver Shift Backup PDF');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Drivers</div>
          <div className="page-sub">{filteredItems.length} driver(s)</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-sm"
            onClick={handlePrintAssignedDrivers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
              cursor: 'pointer'
            }}
            title="Download / Print Assigned Drivers Report (Bus, Route & Duty Mapped)"
          >
            <span>📋</span> Assigned Report (PDF)
          </button>

          <button
            className="btn btn-sm"
            onClick={handlePrintUnassignedDrivers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
              cursor: 'pointer'
            }}
            title="Download / Print Unassigned & Standby Drivers Report"
          >
            <span>⚠️</span> Unassigned Report (PDF)
          </button>

          <button
            className="btn btn-sm btn-outline"
            onClick={handlePrintAllDrivers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600
            }}
            title="Direct print / Save all driver details as PDF"
          >
            <span>🖨️</span> All Drivers (PDF)
          </button>

          <button
            className="btn btn-sm"
            onClick={handlePrintDriverShiftBackup}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              cursor: 'pointer'
            }}
            title="Download / Print Complete Driver Backup (Driver, Bus, Campus, Route & Morning/Evening Shifts)"
          >
            <span>💾</span> Driver Shift Backup (PDF)
          </button>

          {canEdit && (
            <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>
              + Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          <input
            type="text"
            className="fselect"
            placeholder="🔍 Search name, bus, route, license, mobile..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => handleInstChange(e.target.value)}
              style={{ maxWidth: 260, fontWeight: 600 }}
            >
              <option value="all">All Fleet Drivers</option>
              {refs.institutions.map(i => (
                <option key={i.id} value={String(i.id)}>
                  {i.short_name || i.name} {String(i.id) === String(user?.institution_id) ? '(My Campus)' : ''}
                </option>
              ))}
            </select>
          )}

          <select
            className="fselect"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: 220, fontWeight: 600 }}
          >
            <option value="all">All Status ({items.length})</option>
            <option value="assigned">📋 Assigned Only ({assignedCount})</option>
            <option value="unassigned">⚠️ Unassigned Standby ({unassignedCount})</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredItems.length}</b> of {items.length}
            </span>
          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          data={filteredItems}
          onEdit={canEdit ? setEditing : undefined}
          onDelete={canEdit ? handleDel : undefined}
          onPdf={handlePrintSingleDriver}
          emptyIcon="🪪"
          emptyText="No drivers found."
        />
      </div>

      {editing !== null && (
        <FormModal
          title="Driver"
          fields={FIELDS}
          initial={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          refs={refs}
        />
      )}

      {/* ========================================================================= */}
      {/* DRIVER MASTER REPORT PREVIEW & PDF EXPORT MODAL                            */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div
          className="modal-bg"
          onClick={() => setShowReportModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: '92vw',
              width: 1200,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 14,
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              animation: 'slideUp 0.25s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid var(--paper-2)',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff'
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🖨️</span>
                  <span>Driver Master Report & PDF Export</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {institutionTitle} &bull; {filteredItems.length} Driver(s) Selected
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className="btn btn-sm"
                  onClick={handleExportCSV}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  title="Export raw data to Excel / CSV"
                >
                  📥 Export CSV
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handlePrintAllDrivers}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                  }}
                  title="Open Print Dialog to Save as PDF"
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 18,
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Report Preview */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              {/* Document Banner */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 20px',
                  marginBottom: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 14 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{institutionTitle}</h2>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', letterSpacing: '0.6px' }}>
                    FLEET DRIVERS MASTER DIRECTORY & COMPLIANCE REPORT
                  </div>
                </div>

                {/* KPI Statistics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>{totalCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Drivers</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{activeCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active On Duty</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{assignedCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Routes</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#475569' }}>{unassignedCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Standby / Reserve</div>
                  </div>
                  <div style={{ background: expiringOrExpiredCount > 0 ? '#fff5f5' : '#f8fafc', border: `1px solid ${expiringOrExpiredCount > 0 ? '#fca5a5' : '#e2e8f0'}`, padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: expiringOrExpiredCount > 0 ? '#b91c1c' : '#15803d' }}>{expiringOrExpiredCount}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Licence Alert</div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
              >
                <table className="tbl tbl-spacious" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: 45, textAlign: 'center' }}>#</th>
                      <th>Driver Name</th>
                      <th>Bus No</th>
                      <th>Assigned Route</th>
                      <th>Licence Number</th>
                      <th>Licence Expiry</th>
                      <th>Phone</th>
                      <th>Campus</th>
                      <th style={{ textAlign: 'center' }}>Blood</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center', width: 80 }}>Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((d, idx) => {
                      const licStatus = getLicenseStatus(d.license_expiry);
                      const isAssigned = !!d.assigned_route_code;
                      const isActive = (d.status || '').toLowerCase() === 'active';

                      return (
                        <tr key={d.id || idx}>
                          <td style={{ textAlign: 'center', color: '#64748b' }} className="mono">{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                            {d.employee_code && <div style={{ fontSize: 11, color: '#2563eb' }} className="mono">{d.employee_code}</div>}
                          </td>
                          <td>
                            {d.assigned_bus_numbers ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {d.assigned_bus_numbers.split(', ').map(b => (
                                  <span
                                    key={b}
                                    className="mono"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #bfdbfe',
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 700
                                    }}
                                  >
                                    <span>🚌</span> {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                            )}
                          </td>
                          <td>
                            {isAssigned ? (
                              <b style={{ color: '#0f172a' }} className="mono">{d.assigned_route_code}</b>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>— Standby</span>
                            )}
                          </td>
                          <td className="mono" style={{ fontWeight: 600 }}>{d.license_number || '—'}</td>
                          <td>
                            <div className="mono" style={{ fontWeight: 600 }}>{fmtDate(d.license_expiry)}</div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                background: licStatus.bg,
                                color: licStatus.color,
                                border: `1px solid ${licStatus.border}`,
                                marginTop: 2
                              }}
                            >
                              {licStatus.label}
                            </span>
                          </td>
                          <td className="mono" style={{ fontWeight: 600 }}>{d.phone || '—'}</td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>{d.institution_name || '—'}</td>
                          <td style={{ textAlign: 'center' }} className="mono">{d.blood_group || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: isActive ? '#dcfce7' : '#fee2e2',
                                color: isActive ? '#15803d' : '#b91c1c'
                              }}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handlePrintSingleDriver(d)}
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              title="Print Single Driver Bio-Data Sheet"
                            >
                              🖨️ Sheet
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 24px',
                borderTop: '1px solid var(--paper-2)',
                background: '#ffffff'
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                💡 <b>Tip:</b> Click <b>Print / Save as PDF</b> and select <i>"Save as PDF"</i> in your browser's print destination to export an official high-resolution PDF.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-sm btn-outline" onClick={() => setShowReportModal(false)}>
                  Close
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handlePrintAllDrivers}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700
                  }}
                >
                  🖨️ Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
