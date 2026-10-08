import { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';

function BusIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    tools: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {icons[name] || icons.bus}
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1920) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function checkComplianceStatus(dateStr) {
  if (!dateStr) return { status: 'none', label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1920) return { status: 'none', label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { status: 'expired', label: 'Expired', daysAgo: Math.abs(diffDays), isAlert: true, color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
    }
    if (diffDays <= 60) {
      return { status: 'due', label: 'Due Soon', daysLeft: diffDays, isWarn: true, color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
    }
    return { status: 'valid', label: 'Valid', isValid: true, color: '#16a34a', bg: '#dcfce7', border: '#86efac' };
  } catch {
    return { status: 'none', label: '—', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
  }
}

const FIELDS = [
  { key: 'registration_number', label: 'Registration Number', required: true },
  { key: 'bus_code', label: 'Bus Code (e.g. 054, 301)' },
  { key: 'bus_name', label: 'Bus Name / Fleet Label' },
  { 
    key: 'vehicle_type', 
    label: 'Vehicle Classification & Route Role', 
    type: 'select', 
    options: [
      { value: 'bus', label: '🚌 Bus (Standard Student Route Transport)' },
      { value: 'winger', label: '🚐 Winger (Route Relief / Support)' },
      { value: 'tractor', label: '🚜 Tractor (Campus Utility / Farm / Non-Route)' },
      { value: 'mini_bus', label: '🚐 Mini Bus (Campus Shuttle)' },
      { value: 'van', label: '🚙 Van (Staff / Utility)' },
    ] 
  },
  { key: 'manufacturer', label: 'Manufacturer (e.g. ASHOK LEYLAND, MAHINDRA, TATA)' },
  { key: 'bus_model', label: 'Bus Model (e.g. SEMI SALOON, SALOON, WINGER)' },
  { key: 'manufacturing_year', label: 'Year of Manufacture', type: 'number' },
  { key: 'capacity', label: 'Seating Capacity (seats)', type: 'number', required: true },
  { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['diesel', 'petrol', 'cng', 'electric'] },
  { key: 'ownership_type', label: 'Ownership Type', type: 'select', options: ['owned', 'leased', 'contract'] },
  { key: 'status', label: 'Operational Status', type: 'select', options: ['active', 'inactive', 'repair'] },
  { key: 'institution_id', label: 'Institution / Campus', type: 'instref' },
  { key: 'current_odometer_km', label: 'Current Odometer (km)', type: 'number' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'chassis_no', label: 'Chassis Number' },
  { key: 'engine_no', label: 'Engine Number' },
  { key: 'fc_number', label: 'FC (Fitness) Number' },
  { key: 'fc_expiry', label: 'FC Expiry Date', type: 'date' },
  { key: 'insurance_company', label: 'Insurance Provider' },
  { key: 'insurance_no', label: 'Insurance Policy Number' },
  { key: 'insurance_expiry', label: 'Insurance Expiry Date', type: 'date' },
  { key: 'permit_no', label: 'Permit Number' },
  { key: 'permit_type', label: 'Permit Type' },
  { key: 'permit_expiry', label: 'Permit Expiry Date', type: 'date' },
  { key: 'pollution_certificate_no', label: 'Pollution (PUC) Cert No.' },
  { key: 'puc_expiry', label: 'PUC Expiry Date', type: 'date' },
  { key: 'gps_device_id', label: 'GPS Device ID' },
  { key: 'gps_enabled', label: 'GPS Tracking Active', type: 'bool' },
];

export default function Buses() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [instFilter, setInstFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'bus', 'winger', 'tractor', 'mini_bus', 'van'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('overall'); // 'overall' (2nd image) or 'detailed' (3rd image)
  const [selectedVehicleId, setSelectedVehicleId] = useState('all');
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const load = (inst) => {
    setLoading(true);
    const filter = (inst && inst !== 'all') ? { institution_id: inst } : { institution_id: 'all' };
    api.listRes('buses', filter).then(d => {
      setItems(d.items || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    api.refs().then(r => setRefs(r)).catch(() => {});
    const initialInst = user?.role === 'institution' && user.institution_id ? String(user.institution_id) : 'all';
    setInstFilter(initialInst);
    load(initialInst);
  }, []);

  const handleInstChange = (v) => { setInstFilter(v); load(v); };

  const handleSave = async (data, id) => {
    const cleanData = { ...data };
    ['fc_expiry', 'insurance_expiry', 'permit_expiry', 'puc_expiry', 'purchase_date'].forEach(k => {
      if (k in cleanData) {
        const v = cleanData[k];
        if (!v) cleanData[k] = null;
        else if (typeof v === 'string') {
          const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
          cleanData[k] = m ? m[1] : null;
        }
      }
    });
    await api.saveRes('buses', cleanData, id);
    toast(id ? 'Bus profile updated' : 'Bus registered successfully');
    load(instFilter);
  };

  // Quick Inline Type Changer (Bus, Winger, Tractor, Mini Bus, Van)
  const handleQuickTypeChange = async (busId, newType, regNo) => {
    setItems(prev => prev.map(b => b.id === busId ? { ...b, vehicle_type: newType } : b));
    try {
      await api.saveRes('buses', { vehicle_type: newType }, busId);
      const labels = {
        bus: 'Bus (Route Fleet) 🚌',
        winger: 'Winger (Route / Relief) 🚐',
        tractor: 'Tractor (Non-Route Utility) 🚜',
        mini_bus: 'Mini Bus 🚐',
        van: 'Van 🚙'
      };
      toast(`${regNo} marked as ${labels[newType] || newType}`);
    } catch (err) {
      toast(err.message || 'Failed to update vehicle classification');
      load(instFilter);
    }
  };

  const handleDel = async (item) => { 
    if (!confirm(`Are you sure you want to delete bus ${item.registration_number}?`)) return; 
    await api.delRes('buses', item.id); 
    toast('Bus record deleted'); 
    load(instFilter); 
  };

  // Institution Name for Official Reports
  const institutionTitle = useMemo(() => {
    if (instFilter && instFilter !== 'all' && refs.institutions) {
      const inst = refs.institutions.find(i => String(i.id) === String(instFilter));
      return inst ? (inst.name || inst.short_name).toUpperCase() : 'CENTRAL TRANSPORT DIVISION';
    }
    return 'THENI MELAPETTAI HINDU NADARGAL URAVINMURAI - CENTRAL FLEET';
  }, [instFilter, refs.institutions]);

  // Standard Printable Report Window Generator (A4 Landscape / Portrait)
  const printReportWindow = (title, htmlBody, landscape = false) => {
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
            color: #7c6cfc;
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

  // Helper: Generates HTML string for single vehicle dossier
  const generateSingleBusDossierHtml = (bus, timestamp) => {
    const vtype = (bus.vehicle_type || 'bus').toLowerCase();
    const isTractor = vtype === 'tractor';
    const isWinger = vtype === 'winger';
    const fc = checkComplianceStatus(bus.fc_expiry);
    const ins = checkComplianceStatus(bus.insurance_expiry);
    const permit = checkComplianceStatus(bus.permit_expiry);
    const puc = checkComplianceStatus(bus.puc_expiry);

    const typeLabel = isTractor 
      ? '🚜 TRACTOR (CAMPUS UTILITY / NON-ROUTE)' 
      : isWinger 
      ? '🚐 WINGER (ROUTE / RELIEF FLEET)' 
      : vtype === 'mini_bus'
      ? '🚐 MINI BUS (CAMPUS SHUTTLE)'
      : vtype === 'van'
      ? '🚙 VAN (STAFF UTILITY)'
      : '🚌 BUS (STANDARD ROUTE FLEET)';

    return `
      <div class="report-header">
        <div class="inst-name">${institutionTitle}</div>
        <div class="report-title">VEHICLE TECHNICAL SPECIFICATIONS & COMPLIANCE DOSSIER</div>
        <div class="report-subtitle">Official Transport Asset Registration, Specifications & Statutory Validity Record</div>
      </div>

      <div class="meta-row">
        <div><b>Vehicle Reg No:</b> <span class="mono" style="font-size: 14px; font-weight: 800; color: #1e293b;">${bus.registration_number}</span> ${bus.bus_code ? `(#${bus.bus_code})` : ''}</div>
        <div><b>Classification:</b> <b>${typeLabel}</b></div>
        <div><b>Status:</b> <span class="tag-pill ${bus.status === 'active' ? 'tag-active' : 'tag-inactive'}">${(bus.status || 'active').toUpperCase()}</span></div>
        <div><b>Generated:</b> ${timestamp}</div>
      </div>

      ${isTractor ? `
        <div style="background: #fffbeb; border: 1.5px solid #fde68a; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; color: #92400e;">
          <b>🚜 TRACTOR / CAMPUS UTILITY NOTICE:</b> This vehicle is classified for campus maintenance, agricultural grounds, and freight hauling only. It is <u>strictly restricted from scheduled student passenger routes</u>.
        </div>
      ` : isWinger ? `
        <div style="background: #f5f3ff; border: 1.5px solid #ddd6fe; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; color: #5b21b6;">
          <b>🚐 WINGER FLEET NOTICE:</b> Multi-purpose asset authorized for scheduled student routes, faculty transit, and rapid breakdown standby / relief substitution.
        </div>
      ` : `
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; color: #1e40af;">
          <b>🚌 STANDARD PASSENGER FLEET:</b> Primary student transportation vehicle allocated to scheduled morning and evening route operations.
        </div>
      `}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <!-- Card 1: Mechanical & Identity -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            ⚙️ MECHANICAL & IDENTITY SPECIFICATIONS
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 130px; font-weight: 600; background: #f8fafc;">Registration Number</td><td class="mono"><b>${bus.registration_number || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Manufacturer / Make</td><td><b>${bus.manufacturer || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Model Name</td><td>${bus.bus_model || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Year of Manufacture</td><td class="mono">${bus.manufacturing_year || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Chassis Number</td><td class="mono"><b>${bus.chassis_no || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Engine Number</td><td class="mono"><b>${bus.engine_no || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Fuel Type</td><td style="text-transform: capitalize;">${bus.fuel_type || 'Diesel'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Purchase Date</td><td class="mono">${formatDate(bus.purchase_date)}</td></tr>
          </table>
        </div>

        <!-- Card 2: Fitness & Environmental -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            🛡️ FITNESS (FC) & ENVIRONMENTAL COMPLIANCE
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 130px; font-weight: 600; background: #f8fafc;">FC Certificate No</td><td class="mono"><b>${bus.fc_number || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">FC Expiry Date</td><td class="mono"><b>${formatDate(bus.fc_expiry)}</b> <span class="tag-pill" style="background:${fc.bg};color:${fc.color};border:1px solid ${fc.border};">${fc.label}</span></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">PUC Certificate No</td><td class="mono">${bus.pollution_certificate_no || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">PUC Expiry Date</td><td class="mono">${formatDate(bus.puc_expiry)} <span class="tag-pill" style="background:${puc.bg};color:${puc.color};border:1px solid ${puc.border};">${puc.label}</span></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">RC Book Status</td><td>Attached in Transport Office</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Campus Allocation</td><td><b>${bus.institution_name || 'Central Roster'}</b></td></tr>
          </table>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <!-- Card 3: Insurance & Permit -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            📜 INSURANCE POLICY & TRANSPORT PERMIT
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 130px; font-weight: 600; background: #f8fafc;">Insurance Provider</td><td><b>${bus.insurance_company || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Policy Number</td><td class="mono"><b>${bus.insurance_no || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Policy Expiry Date</td><td class="mono"><b>${formatDate(bus.insurance_expiry)}</b> <span class="tag-pill" style="background:${ins.bg};color:${ins.color};border:1px solid ${ins.border};">${ins.label}</span></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Permit Number</td><td class="mono">${bus.permit_no || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Permit Type</td><td>${bus.permit_type || 'Educational Institution'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Permit Expiry Date</td><td class="mono">${formatDate(bus.permit_expiry)} <span class="tag-pill" style="background:${permit.bg};color:${permit.color};border:1px solid ${permit.border};">${permit.label}</span></td></tr>
          </table>
        </div>

        <!-- Card 4: Telematics & Telemetry -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            📡 TELEMATICS, CAPACITY & OPERATIONAL DATA
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 130px; font-weight: 600; background: #f8fafc;">Seating Capacity</td><td class="mono"><b>${isTractor ? 'Utility Unit' : bus.capacity ? `${bus.capacity} Passengers` : '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Odometer Reading</td><td class="mono">${bus.current_odometer_km ? `${Number(bus.current_odometer_km).toLocaleString('en-IN')} KM` : '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">GPS Telemetry</td><td>${bus.gps_enabled ? '✅ Active Live GPS Tracking' : '❌ Inactive / Not Fitted'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">GPS Device ID</td><td class="mono">${bus.gps_device_id || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Asset Ownership</td><td style="text-transform: capitalize;">${bus.ownership_type || 'Owned'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Operational State</td><td><span class="tag-pill ${bus.status === 'active' ? 'tag-active' : 'tag-inactive'}">${bus.status || 'Active'}</span></td></tr>
          </table>
        </div>
      </div>

      <div class="signature-section" style="margin-top: 45px;">
        <div class="sig-box">
          <div>Maintenance Engineer / Mechanic</div>
          <div class="sig-title">Vehicle Roadworthiness Verified</div>
        </div>
        <div class="sig-box">
          <div>Transport Manager / Incharge</div>
          <div class="sig-title">Roster & Documents Endorsed</div>
        </div>
        <div class="sig-box">
          <div>Secretary / Principal</div>
          <div class="sig-title">Official Institutional Sign-Off</div>
        </div>
      </div>
    `;
  };

  // 1. Download / Print Single Bus Technical Dossier (3rd Image Format)
  const handlePrintSingleBus = (bus) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const htmlBody = generateSingleBusDossierHtml(bus, timestamp);
    printReportWindow(`Vehicle Dossier - ${bus.registration_number}`, htmlBody, false);
  };

  // 1b. Download / Print Detailed Dossier by Selection or All (3rd Image Format)
  const handlePrintDetailedDossier = (vehicleId) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    if (vehicleId && vehicleId !== 'all') {
      const bus = items.find(b => String(b.id) === String(vehicleId) || b.registration_number === vehicleId);
      if (bus) {
        handlePrintSingleBus(bus);
        return;
      }
    }
    // All filtered vehicles dossier book
    const list = filteredItems;
    if (!list.length) {
      alert('No vehicles found in current filter to generate dossiers.');
      return;
    }
    const htmlBody = list.map((bus, idx) => `
      <div style="${idx > 0 ? 'page-break-before: always; padding-top: 14px;' : ''}">
        ${generateSingleBusDossierHtml(bus, timestamp)}
      </div>
    `).join('');

    printReportWindow(`Fleet Detailed Dossiers - ${institutionTitle}`, htmlBody, false);
  };

  // 2. Download / Print Full Fleet Register (All Vehicles)
  const handlePrintAllBuses = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const exportList = filteredItems;
    const rowsHtml = exportList.map((b, idx) => {
      const vtype = (b.vehicle_type || 'bus').toLowerCase();
      const fc = checkComplianceStatus(b.fc_expiry);
      const ins = checkComplianceStatus(b.insurance_expiry);
      const isActive = (b.status || '').toLowerCase() === 'active';
      const typeIcon = vtype === 'tractor' ? '🚜' : vtype === 'winger' ? '🚐' : '🚌';
      const typeName = vtype === 'tractor' ? 'Tractor' : vtype === 'winger' ? 'Winger' : vtype === 'mini_bus' ? 'Mini Bus' : vtype === 'van' ? 'Van' : 'Bus';

      return `
        <tr>
          <td style="text-align: center; font-weight: 600; color: #64748b;" class="mono">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; color: #0f172a; font-size: 11.5px;" class="mono">${b.registration_number}</div>
            ${b.bus_code ? `<div style="font-size: 9.5px; color: #7c6cfc;" class="mono">Code: #${b.bus_code}</div>` : ''}
          </td>
          <td style="font-weight: 700;">
            <span>${typeIcon} ${typeName}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${b.manufacturer || b.bus_model || '—'}</div>
            ${b.bus_model ? `<div style="font-size: 9.5px; color: #64748b;">${b.bus_model} ${b.manufacturing_year ? `(${b.manufacturing_year})` : ''}</div>` : ''}
          </td>
          <td style="text-align: center;" class="mono">
            ${vtype === 'tractor' ? 'Utility' : b.capacity ? `${b.capacity} Seats` : '—'}
          </td>
          <td style="text-align: center; text-transform: capitalize;">
            ${b.fuel_type || 'Diesel'}
          </td>
          <td>
            <div class="mono" style="font-weight: 600;">${formatDate(b.fc_expiry)}</div>
            <span class="tag-pill" style="background: ${fc.bg} !important; color: ${fc.color} !important; border: 1px solid ${fc.border}; margin-top: 2px;">
              ${fc.label}
            </span>
          </td>
          <td>
            <div class="mono" style="font-weight: 600;">${formatDate(b.insurance_expiry)}</div>
            <span class="tag-pill" style="background: ${ins.bg} !important; color: ${ins.color} !important; border: 1px solid ${ins.border}; margin-top: 2px;">
              ${b.insurance_company || ins.label}
            </span>
          </td>
          <td class="mono" style="font-size: 9.5px;">
            ${b.chassis_no || '—'}
          </td>
          <td style="font-size: 10px; color: #334155;">
            ${b.institution_name || 'Central Roster'}
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
        <div class="report-title">FLEET ASSET REGISTER & TECHNICAL COMPLIANCE REPORT</div>
        <div class="report-subtitle">Official Transport Fleet Inventory, Vehicle Classification (Bus, Winger, Tractor), Fitness & Insurance Records</div>
      </div>

      <div class="meta-row">
        <div><b>Filter Scope:</b> ${typeFilter === 'all' ? 'All Fleet Vehicles' : typeFilter.toUpperCase()} | ${statusFilter === 'all' ? 'All Status' : statusFilter.toUpperCase()}</div>
        <div><b>Total Vehicles in Scope:</b> <b class="mono" style="color: #7c6cfc; font-size: 13px;">${exportList.length}</b></div>
        <div><b>Report Date:</b> ${timestamp}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-val" style="color: #7c6cfc;">${stats.total}</div>
          <div class="kpi-lbl">Total Fleet</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #15803d;">${stats.active}</div>
          <div class="kpi-lbl">Active & Ready</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #1d4ed8;">${stats.busesCount}</div>
          <div class="kpi-lbl">Route Buses</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #7c3aed;">${stats.wingersCount}</div>
          <div class="kpi-lbl">Wingers</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #b45309;">${stats.tractorsCount}</div>
          <div class="kpi-lbl">Tractors</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #dc2626;">${stats.fcDue}</div>
          <div class="kpi-lbl">FC Due</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #d97706;">${stats.insDue}</div>
          <div class="kpi-lbl">Insurance Due</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th style="width: 110px;">Reg Number</th>
            <th style="width: 100px;">Classification</th>
            <th style="width: 140px;">Make & Model</th>
            <th style="width: 70px; text-align: center;">Capacity</th>
            <th style="width: 60px; text-align: center;">Fuel</th>
            <th style="width: 100px;">Fitness (FC)</th>
            <th style="width: 110px;">Insurance</th>
            <th style="width: 120px;">Chassis No</th>
            <th style="width: 140px;">Campus</th>
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
          <div class="sig-title">Transport Operations Assistant</div>
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

    printReportWindow(`Fleet Register - ${institutionTitle}`, htmlBody, true);
  };

  // 3. Export CSV of all filtered vehicles
  const handleExportCSV = () => {
    const headers = [
      '#', 'Registration Number', 'Bus Code', 'Vehicle Type', 'Make / Manufacturer',
      'Model', 'Mfg Year', 'Seating Capacity', 'Fuel Type', 'Ownership',
      'Fitness Expiry', 'FC Certificate Number', 'Insurance Expiry', 'Insurance Company', 'Insurance Policy No',
      'Permit Expiry', 'Permit Number', 'PUC Expiry', 'Pollution Cert No',
      'Chassis Number', 'Engine Number', 'Odometer (KM)', 'GPS Enabled', 'GPS Device ID',
      'Campus / Institution', 'Status'
    ];
    const rows = filteredItems.map((b, i) => [
      i + 1,
      b.registration_number || '',
      b.bus_code || '',
      b.vehicle_type || 'bus',
      b.manufacturer || '',
      b.bus_model || '',
      b.manufacturing_year || '',
      b.capacity || '',
      b.fuel_type || 'diesel',
      b.ownership_type || 'owned',
      formatDate(b.fc_expiry),
      b.fc_number || '',
      formatDate(b.insurance_expiry),
      b.insurance_company || '',
      b.insurance_no || '',
      formatDate(b.permit_expiry),
      b.permit_no || '',
      formatDate(b.puc_expiry),
      b.pollution_certificate_no || '',
      b.chassis_no || '',
      b.engine_no || '',
      b.current_odometer_km || '',
      b.gps_enabled ? 'Yes' : 'No',
      b.gps_device_id || '',
      b.institution_name || '',
      b.status || 'active'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tms_fleet_master_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Fleet register downloaded as Excel / CSV');
  };

  // KPIs & Vehicle Type Breakdown
  const stats = useMemo(() => {
    const total = items.length;
    let active = 0;
    let inRepair = 0;
    let fcDue = 0;
    let insDue = 0;
    let busesCount = 0;
    let wingersCount = 0;
    let tractorsCount = 0;
    let miniBusesCount = 0;
    let vansCount = 0;

    items.forEach(b => {
      const st = (b.status || '').toLowerCase();
      if (st === 'active') active++;
      if (st === 'repair' || st === 'inactive') inRepair++;
      const fc = checkComplianceStatus(b.fc_expiry);
      if (fc.isAlert || fc.isWarn) fcDue++;
      const ins = checkComplianceStatus(b.insurance_expiry);
      if (ins.isAlert || ins.isWarn) insDue++;

      const vt = (b.vehicle_type || 'bus').toLowerCase();
      if (vt === 'winger') wingersCount++;
      else if (vt === 'tractor') tractorsCount++;
      else if (vt === 'mini_bus') miniBusesCount++;
      else if (vt === 'van') vansCount++;
      else busesCount++;
    });

    return { 
      total, 
      active, 
      inRepair, 
      fcDue, 
      insDue,
      busesCount,
      wingersCount,
      tractorsCount,
      miniBusesCount,
      vansCount
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const st = (item.status || '').toLowerCase();
      const fc = checkComplianceStatus(item.fc_expiry);
      const ins = checkComplianceStatus(item.insurance_expiry);
      const vt = (item.vehicle_type || 'bus').toLowerCase();

      // Vehicle Type Filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'bus' && vt !== 'bus') return false;
        if (typeFilter === 'winger' && vt !== 'winger') return false;
        if (typeFilter === 'tractor' && vt !== 'tractor') return false;
        if (typeFilter === 'mini_bus' && vt !== 'mini_bus') return false;
        if (typeFilter === 'van' && vt !== 'van') return false;
      }

      // Operational Status Filter
      if (statusFilter === 'active' && st !== 'active') return false;
      if (statusFilter === 'repair' && st !== 'repair') return false;
      if (statusFilter === 'inactive' && st !== 'inactive') return false;
      if (statusFilter === 'fc_due' && !fc.isAlert && !fc.isWarn) return false;
      if (statusFilter === 'ins_due' && !ins.isAlert && !ins.isWarn) return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (item.registration_number || '').toLowerCase().includes(query) ||
        (item.bus_code || '').toLowerCase().includes(query) ||
        (item.bus_name || '').toLowerCase().includes(query) ||
        (item.vehicle_type || '').toLowerCase().includes(query) ||
        (item.manufacturer || '').toLowerCase().includes(query) ||
        (item.bus_model || '').toLowerCase().includes(query) ||
        (item.chassis_no || '').toLowerCase().includes(query) ||
        (item.engine_no || '').toLowerCase().includes(query) ||
        (item.insurance_company || '').toLowerCase().includes(query) ||
        (item.permit_no || '').toLowerCase().includes(query) ||
        (item.institution_name || '').toLowerCase().includes(query)
      );
    });
  }, [items, statusFilter, typeFilter, searchQuery]);

  // Table Columns with comprehensive database details & Quick Type Changer
  const COLUMNS = useMemo(() => [
    {
      key: 'registration_number',
      label: 'Vehicle & Classification',
      render: (val, item) => {
        const vtype = (item.vehicle_type || 'bus').toLowerCase();
        const isTractor = vtype === 'tractor';
        const isWinger = vtype === 'winger';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '2px 8px',
                  borderRadius: 6
                }}
              >
                {val}
              </span>
              {item.bus_code && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '1px 6px',
                    borderRadius: 4
                  }}
                >
                  #{item.bus_code}
                </span>
              )}
            </div>

            {/* Quick Type Changer Dropdown Pill */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={vtype}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleQuickTypeChange(item.id, e.target.value, item.registration_number)}
                  title="Click to change vehicle classification"
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 20px 2px 7px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    height: 22,
                    border: '1px solid #e2e8f0',
                    background: isTractor ? '#fffbeb' : isWinger ? '#f5f3ff' : vtype === 'mini_bus' ? '#ecfeff' : vtype === 'van' ? '#f8fafc' : '#eff6ff',
                    color: isTractor ? '#b45309' : isWinger ? '#6d28d9' : vtype === 'mini_bus' ? '#0e7490' : vtype === 'van' ? '#475569' : '#1d4ed8',
                    outline: 'none',
                    lineHeight: '18px'
                  }}
                >
                  <option value="bus">🚌 Bus</option>
                  <option value="winger">🚐 Winger</option>
                  <option value="tractor">🚜 Tractor</option>
                  <option value="mini_bus">🚐 Mini Bus</option>
                  <option value="van">🚙 Van</option>
                </select>
                <span style={{ position: 'absolute', right: 7, pointerEvents: 'none', fontSize: 8, opacity: 0.6, color: 'currentColor' }}>
                  ▼
                </span>
              </div>

              {item.ownership_type && (
                <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>
                  • {item.ownership_type}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'manufacturer',
      label: 'Make',
      render: (_, item) => {
        const raw = item.manufacturer || item.bus_model || '—';
        const formatted = raw === '—' ? '—' : raw
          .toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
          .replace(/\bLtd\b/gi, 'Ltd')
          .replace(/\bTata\b/gi, 'Tata');

        return (
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
            {formatted}
          </span>
        );
      }
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (val, item) => (
        <span style={{ fontWeight: 500, color: '#475569', fontSize: 13 }}>
          {item.vehicle_type === 'tractor' ? 'Utility' : val ? `${val} Seats` : '—'}
        </span>
      )
    },
    {
      key: 'fc_expiry',
      label: 'Fitness (FC)',
      render: (val) => {
        const fc = checkComplianceStatus(val);
        if (!val || fc.status === 'none') return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>
              {formatDate(val)}
            </span>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 12,
                  background: fc.bg,
                  color: fc.color,
                  border: `1px solid ${fc.border}`
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                {fc.label}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'insurance_expiry',
      label: 'Insurance',
      render: (val) => {
        const ins = checkComplianceStatus(val);
        if (!val || ins.status === 'none') return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>
              {formatDate(val)}
            </span>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 12,
                  background: ins.bg,
                  color: ins.color,
                  border: `1px solid ${ins.border}`
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                {ins.label}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const st = (val || 'active').toLowerCase();
        const isOk = st === 'active';
        const isRepair = st === 'repair';
        const label = isOk ? 'Active' : isRepair ? 'In Repair' : 'Inactive';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 9px',
              borderRadius: 12,
              fontSize: 11.5,
              fontWeight: 700,
              background: isOk ? '#ecfdf5' : isRepair ? '#fef3c7' : '#fee2e2',
              color: isOk ? '#059669' : isRepair ? '#b45309' : '#dc2626',
              border: `1px solid ${isOk ? '#a7f3d0' : isRepair ? '#fde68a' : '#fca5a5'}`
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            {label}
          </span>
        );
      }
    },
    {
      key: 'specs_btn',
      label: 'Details',
      render: (_, item) => {
        const isExp = expandedId === item.id;
        return (
          <button
            type="button"
            className="btn btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId(prev => (prev === item.id ? null : item.id));
            }}
            style={{
              padding: '3px 9px',
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 6,
              background: isExp ? '#2563eb' : '#ffffff',
              color: isExp ? '#ffffff' : '#475569',
              border: isExp ? '1px solid #2563eb' : '1px solid #cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Toggle full vehicle specifications"
          >
            <span style={{ fontSize: 11 }}>📋</span>
            <span>{isExp ? 'Close' : 'Specs ▾'}</span>
          </button>
        );
      }
    }
  ], [expandedId]);

  // Expandable Technical Dossier Sub-Row rendering full database details
  const renderSubRow = (item) => {
    if (expandedId !== item.id) return null;
    const totalCols = COLUMNS.length + 2;
    const vtype = (item.vehicle_type || 'bus').toLowerCase();

    return (
      <tr
        key={`sub-${item.id}`}
        style={{
          background: 'linear-gradient(180deg, #fbfbfe 0%, #f8fafc 100%)',
          borderLeft: '4px solid #7c6cfc',
          borderBottom: '2px solid #e2e8f0'
        }}
      >
        <td colSpan={totalCols} style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                  {vtype === 'tractor' ? '🚜' : vtype === 'winger' ? '🚐' : '🚌'} Vehicle Technical Dossier: {item.registration_number}
                </span>
                {item.bus_code && (
                  <span style={{ fontSize: 12, fontWeight: 700, background: '#7c6cfc', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                    Code #{item.bus_code}
                  </span>
                )}
                {item.institution_name && (
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    • Campus: <b style={{ color: '#0f172a' }}>{item.institution_name}</b>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handlePrintSingleBus(item)}
                  title="Print / Save this vehicle's technical dossier as PDF"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    background: '#7c6cfc',
                    color: '#fff',
                    border: 'none',
                    padding: '3px 9px',
                    borderRadius: 5,
                    cursor: 'pointer'
                  }}
                >
                  <BusIcon name="download" size={13} color="#fff" />
                  <span>Download Dossier (PDF)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setExpandedId(null)}
                  style={{ padding: '2px 8px', fontSize: 11 }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Route Role & Operational Suitability Notice */}
            {vtype === 'tractor' && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚜</span>
                <span><b>TRACTOR CLASSIFICATION:</b> Dedicated utility, ground maintenance, and farm vehicle. Not eligible for student route dispatch.</span>
              </div>
            )}
            {vtype === 'winger' && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#5b21b6', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚐</span>
                <span><b>WINGER CLASSIFICATION:</b> Flexible relief and route support vehicle. Can be deployed for designated routes or breakdown standby.</span>
              </div>
            )}
            {vtype === 'bus' && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚌</span>
                <span><b>STANDARD BUS CLASSIFICATION:</b> Primary student transportation vehicle allocated to scheduled morning and evening route assignments.</span>
              </div>
            )}

            {/* Grid of full database fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {/* Card 1: Engine & Chassis */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7c6cfc', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  ⚙️ Mechanical & Identity
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Chassis No:</span> <b className="mono">{item.chassis_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Engine No:</span> <b className="mono">{item.engine_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Fuel Type:</span> <b style={{ textTransform: 'capitalize' }}>{item.fuel_type || 'Diesel'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Mfg Year:</span> <b>{item.manufacturing_year || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Purchase Date:</span> <b>{formatDate(item.purchase_date)}</b></div>
                </div>
              </div>

              {/* Card 2: Fitness (FC) & Pollution (PUC) */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  🛡️ FC & Environmental Compliance
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>FC Number:</span> <b className="mono">{item.fc_number || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>FC Expiry:</span> <b className="mono">{formatDate(item.fc_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>PUC Cert No:</span> <b className="mono">{item.pollution_certificate_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>PUC Expiry:</span> <b className="mono">{formatDate(item.puc_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>RC Book File:</span> <b>{item.rc_book_file || 'Attached in Office'}</b></div>
                </div>
              </div>

              {/* Card 3: Insurance & Permit */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  📜 Insurance & Permit Records
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Ins Company:</span> <b>{item.insurance_company || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Policy No:</span> <b className="mono">{item.insurance_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Policy Expiry:</span> <b className="mono">{formatDate(item.insurance_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Permit No:</span> <b className="mono">{item.permit_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Permit Expiry:</span> <b className="mono">{formatDate(item.permit_expiry)}</b></div>
                </div>
              </div>

              {/* Card 4: GPS Tracking & Meter */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  📡 Telematics & Telemetry
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>GPS Enabled:</span> <b>{item.gps_enabled ? '✅ Active Live Tracking' : '❌ Inactive / Not Fitted'}</b></div>
                  <div><span style={{ color: '#64748b' }}>GPS Device ID:</span> <b className="mono">{item.gps_device_id || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Odometer Run:</span> <b>{item.current_odometer_km ? `${Number(item.current_odometer_km).toLocaleString('en-IN')} KM` : '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Seating Capacity:</span> <b>{item.capacity || '—'} Passengers</b></div>
                  <div><span style={{ color: '#64748b' }}>Ownership:</span> <b style={{ textTransform: 'capitalize' }}>{item.ownership_type || 'Owned'}</b></div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading fleet database...</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Fleet & Buses</div>
          <div className="page-sub">Asset registry, vehicle classification (Bus, Winger, Tractor), and compliance monitoring</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-sm"
            onClick={() => setShowReportModal(true)}
            title="Choose Fleet Report format: Overall Summary Register or Detailed Vehicle Dossier"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 13px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12.5,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <BusIcon name="file" size={14} color="#64748b" />
            <span>Fleet Report (PDF) ▾</span>
          </button>

          <button 
            type="button"
            className="btn btn-sm" 
            onClick={handleExportCSV}
            title="Download Full Fleet Specifications to Excel / CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 13px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12.5,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <BusIcon name="download" size={14} color="#64748b" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => setEditing({ status: 'active', vehicle_type: 'bus', fuel_type: 'diesel', ownership_type: 'owned' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <BusIcon name="plus" size={15} color="#fff" /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon — Focused on Fleet Readiness and Compliance, without Assigned Route */}
        <div className="att-kpi-ribbon">
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <BusIcon name="bus" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{stats.total}</div>
              <div className="att-kpi-label">Total Fleet</div>
              <div className="att-kpi-sub">Registered vehicles</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <BusIcon name="check" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{stats.active}</div>
              <div className="att-kpi-label">Active & Ready</div>
              <div className="att-kpi-sub">{stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% operational` : '—'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.insDue > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--blue">
              <BusIcon name="file" size={22} color="#3b82f6" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.insDue > 0 ? '#d97706' : '#3b82f6' }}>{stats.insDue}</div>
              <div className="att-kpi-label">Insurance Due / Alert</div>
              <div className="att-kpi-sub">{stats.insDue > 0 ? 'Action required within 60d' : 'Policies active'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.inRepair > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--amber">
              <BusIcon name="tools" size={22} color="#f59e0b" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.inRepair > 0 ? '#d97706' : '#64748b' }}>
                {stats.inRepair}
              </div>
              <div className="att-kpi-label">In Maintenance</div>
              <div className="att-kpi-sub">{stats.inRepair > 0 ? 'Under repair/inactive' : 'Fleet operational'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${stats.fcDue > 0 ? 'att-kpi-card--alert' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--red">
              <BusIcon name="shield" size={22} color="#ef4444" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: stats.fcDue > 0 ? '#ef4444' : '#64748b' }}>
                {stats.fcDue}
              </div>
              <div className="att-kpi-label">FC / Fitness Due</div>
              <div className="att-kpi-sub">{stats.fcDue > 0 ? 'Renewal required' : 'All certificates valid'}</div>
            </div>
          </div>
        </div>

        {/* Quick Vehicle Type Filter Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 4 }}>
            Vehicle Filter:
          </span>
          {[
            { id: 'all', label: `All Fleet (${items.length})` },
            { id: 'bus', label: `🚌 Buses (${stats.busesCount})`, count: stats.busesCount },
            { id: 'mini_bus', label: `🚐 Mini Buses (${stats.miniBusesCount})`, count: stats.miniBusesCount },
            { id: 'van', label: `🚙 Vans (${stats.vansCount})`, count: stats.vansCount },
            { id: 'winger', label: `🚐 Wingers (${stats.wingersCount})`, count: stats.wingersCount },
            { id: 'tractor', label: `🚜 Tractors (${stats.tractorsCount})`, count: stats.tractorsCount },
          ].map(tab => {
            const active = typeFilter === tab.id;
            const isZero = tab.count === 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  borderRadius: 20,
                  background: active ? '#0f172a' : '#ffffff',
                  color: active ? '#ffffff' : isZero ? '#94a3b8' : '#334155',
                  border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 1px 3px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.02)',
                  opacity: isZero && !active ? 0.65 : 1
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <BusIcon name="search" size={15} color="#94a3b8" />
            </span>
            <input
              type="text"
              className="fselect"
              placeholder="Search reg plate, model, make, tractor, winger..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, height: 38 }}
            />
          </div>

          {refs.institutions?.length > 0 && (
            <select
              className="fselect"
              value={instFilter}
              onChange={e => handleInstChange(e.target.value)}
              style={{ maxWidth: 280, fontWeight: 600, height: 38 }}
            >
              <option value="all">All Fleet Vehicles</option>
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
            style={{ maxWidth: 220, fontWeight: 600, height: 38 }}
          >
            <option value="all">All Status ({items.length})</option>
            <option value="active">Active Only ({stats.active})</option>
            <option value="fc_due">FC Due / Alert ({stats.fcDue})</option>
            <option value="ins_due">Insurance Due ({stats.insDue})</option>
            <option value="repair">In Repair ({items.filter(b => (b.status || '').toLowerCase() === 'repair').length})</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredItems.length}</b> of {items.length} vehicles
            </span>
          </div>
        </div>

        <DataTable 
          columns={COLUMNS} 
          data={filteredItems} 
          onEdit={canEdit ? setEditing : undefined} 
          onDelete={canEdit ? handleDel : undefined} 
          extraAction={(item) => (
            <button
              type="button"
              title={`Download Technical Dossier for ${item.registration_number}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePrintSingleBus(item);
              }}
              style={{
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
          renderSubRow={renderSubRow}
          emptyIcon="🚌" 
          emptyText="No vehicles found matching your criteria." 
        />
      </div>

      {editing !== null && (
        <FormModal 
          title={editing?.id ? `Edit Vehicle (${editing.registration_number})` : "Add Vehicle to Fleet"} 
          fields={FIELDS} 
          initial={editing} 
          onSave={handleSave} 
          onClose={() => setEditing(null)} 
          refs={refs} 
        />
      )}

      {/* FLEET REPORT SELECTION MODAL */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: 640,
              width: '100%',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: 'linear-gradient(135deg, #fbfbfe 0%, #f5f3ff 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#7c6cfc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                    boxShadow: '0 4px 10px rgba(124, 108, 252, 0.3)'
                  }}
                >
                  📄
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                    Select Fleet Report Format
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Choose between overall fleet summary or detailed vehicle technical dossier
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#94a3b8',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Option 1: Overall Fleet Report (2nd Image) */}
              <div
                onClick={() => setReportType('overall')}
                style={{
                  border: reportType === 'overall' ? '2px solid #7c6cfc' : '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: reportType === 'overall' ? '#f5f3ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="radio"
                      name="fleetReportType"
                      checked={reportType === 'overall'}
                      onChange={() => setReportType('overall')}
                      style={{ width: 17, height: 17, accentColor: '#7c6cfc', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#1e293b' }}>
                      📋 Overall Fleet Report (Summary Table)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#ede9fe',
                      color: '#7c6cfc'
                    }}
                  >
                    2nd Image Format
                  </span>
                </div>
                <p style={{ margin: '0 0 0 27px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                  Consolidated master register table of all registered vehicles with vehicle classification (Bus, Winger, Tractor), seating capacity, fuel, fitness (FC) & insurance expiry, chassis number, and campus. Includes top KPI summary ribbon.
                </p>
                <div style={{ marginLeft: 27, display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • A4 Landscape
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • Scope: {filteredItems.length} vehicles
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • Management & Audit Ready
                  </span>
                </div>
              </div>

              {/* Option 2: Detailed Vehicle Dossier (3rd Image) */}
              <div
                onClick={() => setReportType('detailed')}
                style={{
                  border: reportType === 'detailed' ? '2px solid #7c6cfc' : '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: reportType === 'detailed' ? '#f5f3ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="radio"
                      name="fleetReportType"
                      checked={reportType === 'detailed'}
                      onChange={() => setReportType('detailed')}
                      style={{ width: 17, height: 17, accentColor: '#7c6cfc', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#1e293b' }}>
                      📑 Detailed Vehicle Technical Dossier
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#ede9fe',
                      color: '#7c6cfc'
                    }}
                  >
                    3rd Image Format
                  </span>
                </div>
                <p style={{ margin: '0 0 0 27px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                  In-depth technical profile featuring the 4 specification cards: Mechanical & Identity, Fitness & Pollution (PUC), Insurance & Permits, and Telematics & GPS.
                </p>

                {/* Select Vehicle Dropdown */}
                <div style={{ marginLeft: 27, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Choose Vehicle for Dossier:
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={e => setSelectedVehicleId(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      borderRadius: 6,
                      border: '1.5px solid #cbd5e1',
                      padding: '0 10px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">📚 All Vehicles in Scope ({filteredItems.length} vehicles - Multi-page Dossier)</option>
                    {filteredItems.map(b => (
                      <option key={b.id} value={String(b.id)}>
                        {b.registration_number} {b.bus_code ? `(#${b.bus_code})` : ''} — {(b.vehicle_type || 'bus').toUpperCase()} • {b.manufacturer || b.bus_model || 'Ashok Leyland'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #f1f5f9',
                background: '#fafafa',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowReportModal(false)}
                style={{ padding: '7px 14px', fontWeight: 600 }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {reportType === 'overall' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      handleExportCSV();
                      setShowReportModal(false);
                    }}
                    style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      padding: '7px 14px',
                      borderRadius: 6,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    📥 Export CSV
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setShowReportModal(false);
                    if (reportType === 'overall') {
                      handlePrintAllBuses();
                    } else {
                      handlePrintDetailedDossier(selectedVehicleId);
                    }
                  }}
                  style={{
                    background: '#7c6cfc',
                    color: '#ffffff',
                    padding: '7px 16px',
                    borderRadius: 6,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 108, 252, 0.35)'
                  }}
                >
                  <BusIcon name="file" size={15} color="#fff" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
