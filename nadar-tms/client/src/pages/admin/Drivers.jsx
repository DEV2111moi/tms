import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/api';
import DataTable from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { exportDriverShiftBackupPdf } from '../../utils/driverBackupPdf';

function DrvIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const icons = {
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bus: <><rect x="3" y="4" width="18" height="15" rx="3"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/><path d="M3 10h18"/><path d="M7 4v3"/><path d="M17 4v3"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    badge: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    id: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    refresh: <><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
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
      {icons[name] || icons.user}
    </svg>
  );
}

const FIELDS = [
  { key: 'name', label: 'Driver Name', required: true },
  { key: 'employee_code', label: 'Employee Code / ID' },
  { 
    key: 'driver_type', 
    label: 'Driver Duty Role & Allocation', 
    type: 'select', 
    options: [
      { value: 'regular', label: '🚌 Regular Route Driver (Scheduled Bus Route Duty)' },
      { value: 'spare', label: '🔄 Spare / Reliever Driver (Standby & Substitution Duty)' },
      { value: 'others', label: '🚙 Other / Campus Utility Pilot (Internal/Non-Route)' }
    ] 
  },
  { key: 'father_name', label: "Father's Name" },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  { key: 'blood_group', label: 'Blood Group' },
  { key: 'aadhaar_no', label: 'Aadhaar Card No.' },
  { key: 'phone', label: 'Primary Mobile Number', required: true },
  { key: 'alternate_mobile', label: 'Alternate Mobile' },
  { key: 'email', label: 'Email Address' },
  { key: 'current_address', label: 'Current Residential Address', type: 'textarea', full: true },
  { key: 'permanent_address', label: 'Permanent Address', type: 'textarea', full: true },
  { key: 'native_place', label: 'Native Place / Town' },
  { key: 'district', label: 'District (e.g. Theni)' },
  { key: 'state', label: 'State (e.g. Tamilnadu)' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'status', label: 'Operational Status (Active allows route duty; Inactive blocks routes)', type: 'select', options: ['active', 'inactive'] },
  { key: 'institution_id', label: 'Institution / Campus', type: 'instref' },
  { key: 'route_id', label: 'Assigned Route (Only available for Active drivers)', type: 'route' },
  { key: 'user_id', label: 'Linked Login Account', type: 'userref', role: 'driver' },
  { key: 'designation', label: 'Designation (e.g. DRIVER)' },
  { key: 'employment_type', label: 'Employment Type', type: 'select', options: ['REGULAR', 'CONTRACT', 'TEMPORARY'] },
  { key: 'joining_date', label: 'Date of Joining', type: 'date' },
  { key: 'experience_years', label: 'Total Experience (years)', type: 'number' },
  { key: 'previous_employer', label: 'Previous Employer' },
  { key: 'epf_applicable', label: 'EPF Applicable', type: 'bool' },
  { key: 'epf_uan_no', label: 'EPF UAN Number' },
  { key: 'esi_applicable', label: 'ESI Applicable', type: 'bool' },
  { key: 'esi_no', label: 'ESI Number' },
  { key: 'license_number', label: 'Licence Number', required: true },
  { key: 'license_type', label: 'Licence Type (e.g. HMV, Transport)' },
  { key: 'license_issue_date', label: 'Licence Issue Date', type: 'date' },
  { key: 'license_expiry', label: 'Licence Expiry Date', type: 'date' },
  { key: 'badge_no', label: 'Badge Number' },
  { key: 'badge_expiry_date', label: 'Badge Expiry Date', type: 'date' },
  { key: 'emergency_contact_name', label: 'Emergency Contact Person' },
  { key: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
  { key: 'emergency_contact_relation', label: 'Relationship to Contact' },
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
  const [reportType, setReportType] = useState('overall'); // 'overall', 'detailed', 'shift_backup'
  const [rosterScope, setRosterScope] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [selectedDriverId, setSelectedDriverId] = useState('all');
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const [expandedId, setExpandedId] = useState(null);

  const columns = useMemo(() => [
    {
      key: 'sno',
      label: 'S.NO',
      width: 50
    },
    {
      key: 'name',
      label: 'Driver & Identity',
      render: (val, item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{val}</span>
            {item.employee_code && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: '#f5f3ff',
                  color: '#7c6cfc',
                  border: '1px solid #ddd6fe',
                  padding: '1px 6px',
                  borderRadius: 4
                }}
              >
                #{item.employee_code}
              </span>
            )}
            {item.blood_group && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  padding: '1px 5px',
                  borderRadius: 3
                }}
              >
                🩸 {item.blood_group}
              </span>
            )}
          </div>
          {item.father_name && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              S/o {item.father_name}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact & Aadhaar',
      render: (val, item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="mono" style={{ fontWeight: 700, color: '#1e293b', fontSize: 12 }}>
            📞 {val || '—'}
          </span>
          {item.aadhaar_no && (
            <span className="mono" style={{ fontSize: 10.5, color: '#64748b' }} title="Aadhaar Card Number">
              🪪 {item.aadhaar_no}
            </span>
          )}
          {item.alternate_mobile && (
            <span className="mono" style={{ fontSize: 10, color: '#94a3b8' }}>
              Alt: {item.alternate_mobile}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'assigned_bus_numbers',
      label: 'Bus & Route',
      render: (val, item) => {
        const buses = val ? val.split(', ').map(b => b.trim()).filter(Boolean) : [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {buses.length > 0 ? (
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
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  >
                    🚌 {b}
                  </span>
                ))}
              </div>
            ) : item.driver_type === 'spare' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700
                }}
                title="Spare / Reliever Pilot on Standby for Breakdown & Leave Coverage"
              >
                🔄 Spare Driver
              </span>
            ) : item.driver_type === 'others' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  background: '#f5f3ff',
                  color: '#6d28d9',
                  border: '1px solid #ddd6fe',
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 700
                }}
                title="Campus Internal Utility / Non-Route Pilot"
              >
                🚙 Utility Pilot
              </span>
            ) : (item.status || 'active').toLowerCase() === 'inactive' ? (
              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11, fontWeight: 600 }}>
                🚫 Inactive (Off-duty)
              </span>
            ) : (
              <span style={{ color: '#dc2626', fontStyle: 'italic', fontSize: 11, fontWeight: 600 }}>
                ⏳ Standby (Unassigned)
              </span>
            )}
            {item.assigned_route_code && (
              <span className="mono" style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                🛣️ {item.assigned_route_code}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'license_number',
      label: 'Licence & Badge',
      render: (val, item) => {
        const lic = getLicenseStatus(item.license_expiry);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 11.5, color: '#0f172a' }}>
              {val || '—'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 11, color: '#64748b' }}>
                {fmtDate(item.license_expiry)}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: lic.bg,
                  color: lic.color,
                  border: `1px solid ${lic.border}`
                }}
              >
                {lic.label}
              </span>
            </div>
            {item.badge_no && (
              <span className="mono" style={{ fontSize: 10, color: '#64748b' }}>
                Badge: #{item.badge_no}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'institution_name',
      label: 'Campus & Domicile',
      render: (val, item) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>
            {val || '—'}
          </span>
          {(item.native_place || item.district) && (
            <span style={{ fontSize: 10.5, color: '#64748b' }}>
              📍 {[item.native_place, item.district].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, item) => {
        const isActive = (val || '').toLowerCase() === 'active';
        const dtype = (item.driver_type || 'regular').toLowerCase();
        const isSpare = dtype === 'spare';
        const isOther = dtype === 'others' || dtype === 'other';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
            {/* Status Pill and Role Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: isActive ? '#dcfce7' : '#fee2e2',
                  color: isActive ? '#15803d' : '#b91c1c',
                  border: `1px solid ${isActive ? '#86efac' : '#fca5a5'}`
                }}
                title={isActive ? 'Active Driver on Duty' : 'Inactive / Off-Duty (Cannot be assigned routes)'}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                {isActive ? 'Active' : 'Inactive'}
              </span>

              {isSpare ? (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '1px 6px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                  title="Spare / Reliever Driver on standby (available for substitutions)"
                >
                  🔄 SPARE DRIVER
                </span>
              ) : isOther ? (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: '#f5f3ff',
                    color: '#6d28d9',
                    border: '1px solid #ddd6fe',
                    padding: '1px 6px',
                    borderRadius: 4
                  }}
                  title="Campus Internal Utility Pilot"
                >
                  🚙 UTILITY
                </span>
              ) : null}
            </div>

            {/* Service & Experience details (transferred from removed Service & Exp column) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
              <span style={{ fontSize: 10.5, color: '#334155', fontWeight: 600 }}>
                {item.experience_years != null && item.experience_years !== '' 
                  ? `${Number(item.experience_years).toFixed(1)} Yrs Exp` 
                  : '—'}
              </span>
              <span style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {item.employment_type ? `${item.employment_type} DRIVER` : 'REGULAR DRIVER'}
              </span>
            </div>

            {!isActive && (
              <span style={{ fontSize: 9.5, color: '#dc2626', fontWeight: 700, marginTop: 1 }}>
                🚫 Route assignment blocked
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'dossier_btn',
      label: 'Dossier',
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
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: isExp ? '#7c6cfc' : '#f5f3ff',
              color: isExp ? '#ffffff' : '#7c6cfc',
              border: '1px solid #ddd6fe',
              borderRadius: 5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
            title="Toggle full staff bio-data and database dossier"
          >
            <DrvIcon name="badge" size={13} color={isExp ? '#fff' : '#7c6cfc'} />
            {isExp ? 'Close' : 'Dossier ▾'}
          </button>
        );
      }
    }
  ], [expandedId]);

  const renderSubRow = (item) => {
    if (expandedId !== item.id) return null;
    const totalCols = columns.length + 2;

    return (
      <tr
        key={`drv-sub-${item.id}`}
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
                  👤 Staff Master Dossier: {item.name}
                </span>
                {item.employee_code && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: '#7c6cfc', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                    EMP ID #{item.employee_code}
                  </span>
                )}
                {item.blood_group && (
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '1px 7px', borderRadius: 4 }}>
                    🩸 {item.blood_group}
                  </span>
                )}
                {item.institution_name && (
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    • Campus: <b style={{ color: '#0f172a' }}>{item.institution_name}</b>
                  </span>
                )}
                {canEdit && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginLeft: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Role:</span>
                      <select
                        className="fselect"
                        value={item.driver_type || 'regular'}
                        onChange={async (e) => {
                          const newType = e.target.value;
                          try {
                            const updatePayload = { driver_type: newType };
                            if (newType === 'spare') {
                              updatePayload.status = 'active';
                            }
                            await api.saveRes('drivers', updatePayload, item.id);
                            toast(`Updated role to ${newType === 'spare' ? 'Spare Driver (Active)' : newType === 'others' ? 'Other Utility' : 'Regular Driver'}`);
                            load(instFilter);
                          } catch (err) {
                            toast('Failed to update driver role');
                          }
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          height: 28,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: item.driver_type === 'spare' ? '#fef3c7' : item.driver_type === 'others' ? '#f5f3ff' : '#eff6ff',
                          color: item.driver_type === 'spare' ? '#b45309' : item.driver_type === 'others' ? '#6d28d9' : '#1d4ed8',
                          border: item.driver_type === 'spare' ? '1.5px solid #fde68a' : item.driver_type === 'others' ? '1.5px solid #ddd6fe' : '1.5px solid #bfdbfe',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="regular">🚌 Regular Route Driver</option>
                        <option value="spare">🔄 Spare / Reliever Driver</option>
                        <option value="others">🚙 Other / Campus Utility</option>
                      </select>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Status:</span>
                      <select
                        className="fselect"
                        value={item.status || 'active'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'inactive' && (item.route_id || item.assigned_route_code)) {
                            if (!confirm(`Warning: Setting ${item.name} to Inactive will remove them from route duty. Inactive drivers cannot be assigned routes. Continue?`)) {
                              return;
                            }
                          }
                          try {
                            await api.saveRes('drivers', {
                              status: newStatus,
                              ...(newStatus === 'inactive' ? { route_id: null } : {})
                            }, item.id);
                            toast(`Status set to ${newStatus.toUpperCase()}${newStatus === 'inactive' ? ' (Route duty unassigned)' : ''}`);
                            load(instFilter);
                          } catch (err) {
                            toast('Failed to update driver status');
                          }
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          height: 28,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: item.status === 'inactive' ? '#fee2e2' : '#dcfce7',
                          color: item.status === 'inactive' ? '#b91c1c' : '#15803d',
                          border: item.status === 'inactive' ? '1.5px solid #fca5a5' : '1.5px solid #86efac',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="active">Active (On Duty / Available)</option>
                        <option value="inactive">Inactive (Off Duty / Route Blocked)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handlePrintSingleDriver(item)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: '#7c6cfc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                  title="Download / Print Driver Bio-Data Dossier PDF"
                >
                  <span>📥 Download Dossier (PDF)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setExpandedId(null)}
                  style={{ padding: '3px 8px', fontSize: 11 }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Grid of full database fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {/* Card 1: Personal & Bio */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7c6cfc', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  👤 Personal & Identity
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Father's Name:</span> <b>{item.father_name || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Date of Birth:</span> <b>{fmtDate(item.date_of_birth)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Gender:</span> <b style={{ textTransform: 'capitalize' }}>{item.gender || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Aadhaar No:</span> <b className="mono">{item.aadhaar_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Native Place:</span> <b>{item.native_place || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>District / State:</span> <b>{[item.district, item.state].filter(Boolean).join(', ') || '—'}</b></div>
                </div>
              </div>

              {/* Card 2: Contact & Residential */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  📞 Contact & Address
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Primary Phone:</span> <b className="mono">{item.phone || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Alternate Phone:</span> <b className="mono">{item.alternate_mobile || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Email:</span> <b>{item.email || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Pincode:</span> <b className="mono">{item.pincode || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Current Address:</span> <span style={{ fontSize: 11 }}>{item.current_address || '—'}</span></div>
                  <div><span style={{ color: '#64748b' }}>Permanent Address:</span> <span style={{ fontSize: 11 }}>{item.permanent_address || '—'}</span></div>
                </div>
              </div>

              {/* Card 3: Licence & Authorities */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  🪪 Licence & Authorities
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Licence No:</span> <b className="mono">{item.license_number || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Licence Type:</span> <b>{item.license_type || 'Transport / Heavy'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Issue Date:</span> <b className="mono">{fmtDate(item.license_issue_date)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Expiry Date:</span> <b className="mono">{fmtDate(item.license_expiry)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Badge Number:</span> <b className="mono">{item.badge_no || '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Badge Expiry:</span> <b className="mono">{fmtDate(item.badge_expiry_date)}</b></div>
                </div>
              </div>

              {/* Card 4: Employment, PF & Emergency */}
              <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  💼 Service, PF & Emergency
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Designation:</span> <b>{item.designation || 'DRIVER'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Employment:</span> <b>{item.employment_type || 'REGULAR'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Date of Joining:</span> <b className="mono">{fmtDate(item.joining_date)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Experience:</span> <b>{item.experience_years ? `${item.experience_years} Years` : '—'}</b></div>
                  <div><span style={{ color: '#64748b' }}>EPF UAN:</span> <b className="mono">{item.epf_uan_no ? `${item.epf_uan_no} (Active)` : 'Not Applicable'}</b></div>
                  <div><span style={{ color: '#64748b' }}>ESI No:</span> <b className="mono">{item.esi_no ? `${item.esi_no} (Active)` : 'Not Applicable'}</b></div>
                  <div><span style={{ color: '#64748b' }}>Emergency Contact:</span> <b>{item.emergency_contact_name || '—'} {item.emergency_contact_relation ? `(${item.emergency_contact_relation})` : ''}</b></div>
                  <div><span style={{ color: '#64748b' }}>Emergency Phone:</span> <b className="mono" style={{ color: '#dc2626' }}>{item.emergency_contact_phone || item.emergency_contact_no || '—'}</b></div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

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

    // Check inactive route assignment rule
    if (cleanData.status === 'inactive' && cleanData.route_id) {
      toast('Cannot assign route to an inactive driver. Please set status to Active or remove the assigned route.');
      return;
    }
    if (cleanData.status === 'inactive') {
      cleanData.route_id = null;
    }

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
    if (cleanData.emergency_contact_phone && !cleanData.emergency_contact_no) {
      cleanData.emergency_contact_no = cleanData.emergency_contact_phone;
    } else if (cleanData.emergency_contact_no && !cleanData.emergency_contact_phone) {
      cleanData.emergency_contact_phone = cleanData.emergency_contact_no;
    }
    await api.saveRes('drivers', cleanData, id);
    toast(id ? 'Saved' : 'Added');
    load(instFilter);
  };
  const handleDel = async (item) => { if (!confirm('Delete this driver?')) return; await api.delRes('drivers', item.id); toast('Deleted'); load(instFilter); };

  const filteredItems = items.filter(item => {
    const isAssigned = !!(item.assigned_bus_numbers || item.assigned_route_code);
    const dtype = (item.driver_type || 'regular').toLowerCase();
    const isSpare = dtype === 'spare';
    const isOther = dtype === 'others' || dtype === 'other';
    const isActive = (item.status || 'active').toLowerCase() === 'active';

    if (statusFilter === 'assigned' && !isAssigned) return false;
    // CRITICAL USER RULES:
    // 1. If marked as spare (or others), that should NOT show in unassigned until route is assigned for him!
    // 2. If marked as inactive, that should NOT show in unassigned either!
    if (statusFilter === 'unassigned') {
      if (!isActive || isAssigned || isSpare || isOther) return false;
    }
    if (statusFilter === 'spare' && !isSpare) return false;
    if (statusFilter === 'others' && !isOther) return false;
    if (statusFilter === 'inactive' && isActive) return false;

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
      (item.institution_name || '').toLowerCase().includes(query) ||
      (item.driver_type || '').toLowerCase().includes(query)
    );
  });

  // Calculate quick summary metrics
  const totalCount = items.length;
  const activeCount = items.filter(d => (d.status || '').toLowerCase() === 'active').length;
  const inactiveCount = totalCount - activeCount;
  const assignedCount = items.filter(d => !!(d.assigned_bus_numbers || d.assigned_route_code)).length;

  // Spare drivers
  const totalSpareCount = items.filter(d => (d.driver_type || '').toLowerCase() === 'spare').length;
  const spareStandbyCount = items.filter(d => {
    const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
    const dtype = (d.driver_type || 'regular').toLowerCase();
    const isActive = (d.status || 'active').toLowerCase() === 'active';
    return isActive && !isAssigned && dtype === 'spare';
  }).length;

  // Other / Utility pilots
  const othersCount = items.filter(d => {
    const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
    const dtype = (d.driver_type || 'regular').toLowerCase();
    return !isAssigned && (dtype === 'others' || dtype === 'other');
  }).length;

  // Unassigned Route Drivers:
  // ONLY ACTIVE regular drivers without route/bus assigned!
  // Inactive drivers are excluded!
  // Spare drivers and Others are excluded until route is assigned for him!
  const unassignedCount = items.filter(d => {
    const isActive = (d.status || 'active').toLowerCase() === 'active';
    const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
    const dtype = (d.driver_type || 'regular').toLowerCase();
    return isActive && !isAssigned && dtype !== 'spare' && dtype !== 'others' && dtype !== 'other';
  }).length;

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

  // 1c. Generate Unassigned / Standby Drivers Only PDF Report (Excluding Spare Drivers)
  const handlePrintUnassignedDrivers = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const baseList = searchQuery ? filteredItems : items;
    const unassignedList = baseList.filter(d => {
      const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
      const dtype = (d.driver_type || 'regular').toLowerCase();
      return !isAssigned && dtype !== 'spare' && dtype !== 'others' && dtype !== 'other';
    });

    if (unassignedList.length === 0) {
      alert('All regular route drivers are assigned. (Spare and utility drivers are managed separately under Spare Roster).');
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

  // 1d. Generate Spare & Reliever Drivers PDF Report
  const handlePrintSpareDrivers = () => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const baseList = searchQuery ? filteredItems : items;
    const spareList = baseList.filter(d => {
      const dtype = (d.driver_type || '').toLowerCase();
      return dtype === 'spare';
    });

    if (spareList.length === 0) {
      alert('No designated spare / reliever drivers found in the current filter.');
      return;
    }

    const rowsHtml = spareList.map((d, idx) => {
      const licStatus = getLicenseStatus(d.license_expiry);
      const isAssigned = !!(d.assigned_bus_numbers || d.assigned_route_code);
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
            <span class="tag-pill" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 800;">
              🔄 SPARE / RELIEVER
            </span>
          </td>
          <td>
            ${isAssigned 
              ? `<b style="color: #0369a1;" class="mono">🚌 ${d.assigned_bus_numbers || ''} (${d.assigned_route_code || ''})</b>`
              : `<span style="color: #059669; font-weight: 700;">🟢 Standby Available</span>`
            }
          </td>
          <td style="font-weight: 600; color: #334155;">${d.institution_name || 'Central Roster'}</td>
          <td class="mono" style="font-weight: 600;">${d.license_number || '—'}</td>
          <td>
            <div class="mono" style="font-weight: 600;">${fmtDate(d.license_expiry)}</div>
            <span class="tag-pill" style="background: ${licStatus.bg} !important; color: ${licStatus.color} !important; border: 1px solid ${licStatus.border}; margin-top: 2px;">
              ${licStatus.label}
            </span>
          </td>
          <td class="mono" style="font-weight: 600;">
            ${d.phone || '—'}
            ${d.emergency_contact_no ? `<div style="font-size: 9.5px; color: #dc2626;">Emg: ${d.emergency_contact_no}</div>` : ''}
          </td>
          <td style="text-align: center;" class="mono">${d.experience_years ? `${d.experience_years} yrs` : '—'}</td>
          <td style="text-align: center;" class="mono">${d.blood_group || '—'}</td>
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
        <div class="report-title" style="color: #b45309;">SPARE & RELIEVER DRIVERS ROSTER REPORT</div>
        <div class="report-subtitle">Designated Reserve Personnel Available for Breakdown Relief, Leave Substitution & Contingency</div>
      </div>

      <div class="meta-row">
        <div><b>Report Scope:</b> ${activeInst ? activeInst.name : 'All Campuses'} &bull; <b>Spare Drivers:</b> ${spareList.length} of ${totalCount} Total</div>
        <div><b>Generated:</b> ${timestamp} &bull; <b>By:</b> ${user?.name || 'Transport Admin'}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
          <div class="kpi-val" style="color: #b45309;">${spareList.length}</div>
          <div class="kpi-lbl">Total Spare Drivers</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #15803d;">${spareList.filter(d => !(d.assigned_bus_numbers || d.assigned_route_code)).length}</div>
          <div class="kpi-lbl">Standby Ready</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #0284c7;">${spareList.filter(d => !!(d.assigned_bus_numbers || d.assigned_route_code)).length}</div>
          <div class="kpi-lbl">On Temporary Route</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #2563eb;">
            ${spareList.filter(d => !getLicenseStatus(d.license_expiry).isExpired).length}
          </div>
          <div class="kpi-lbl">Valid Licences</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th style="width: 155px;">Driver Details</th>
            <th style="width: 110px;">Role</th>
            <th style="width: 140px;">Current Duty</th>
            <th style="width: 140px;">Campus</th>
            <th style="width: 110px;">Licence No</th>
            <th style="width: 100px;">Licence Expiry</th>
            <th style="width: 110px;">Mobile Phone</th>
            <th style="width: 55px; text-align: center;">Exp</th>
            <th style="width: 50px; text-align: center;">Blood</th>
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
          <div class="sig-title">Principal / Fleet Director</div>
        </div>
      </div>
    `;

    printReportWindow(`Spare Drivers Report - ${institutionTitle}`, htmlBody, true);
  };

  // 2. Generate Single Driver Bio-Data Profile HTML
  const generateSingleDriverDossierHtml = (driver, timestamp) => {
    const licStatus = getLicenseStatus(driver.license_expiry);
    const isAssigned = !!(driver.assigned_bus_numbers || driver.assigned_route_code);
    const isActive = (driver.status || '').toLowerCase() === 'active';

    return `
      <div class="report-header">
        <div class="inst-name">${driver.institution_name && driver.institution_name !== '—' ? driver.institution_name.toUpperCase() : institutionTitle}</div>
        <div class="report-title">DRIVER SERVICE & CREDENTIALS BIO-DATA SHEET</div>
        <div class="report-subtitle">Official Transport Staff Profile, Statutory Licence & Fleet Deployment Record</div>
      </div>

      <div class="meta-row">
        <div><b>Driver Name:</b> <span class="mono" style="font-size: 13.5px; font-weight: 800; color: #1e293b;">${driver.name || '—'}</span> ${driver.employee_code ? `&bull; <b>Emp Code:</b> #${driver.employee_code}` : ''}</div>
        <div><b>Campus:</b> <b>${driver.institution_name || 'Central Transport Department'}</b></div>
        <div><b>Status:</b> <span class="tag-pill ${isActive ? 'tag-active' : 'tag-inactive'}">${(driver.status || 'ACTIVE').toUpperCase()}</span></div>
        <div><b>Generated:</b> ${timestamp}</div>
      </div>

      ${isAssigned ? `
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; color: #1e40af;">
          <b>🚌 ASSIGNED ROUTE PILOT:</b> Regular operational duty allocated for <b>Bus ${driver.assigned_bus_numbers || '—'}</b> on <b>Route ${driver.assigned_route_code || '—'}</b> (${driver.institution_name || 'Central Roster'}).
        </div>
      ` : `
        <div style="background: #fffbeb; border: 1.5px solid #fde68a; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; color: #92400e;">
          <b>⚠️ STANDBY / RELIEVER PILOT:</b> Transport department reserve roster. Available for immediate route assignment, relief substitution, and contingency backup.
        </div>
      `}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            👤 PERSONAL & IDENTITY INFORMATION
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Full Name</td><td><b>${driver.name || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Father's Name</td><td>${driver.father_name || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Date of Birth</td><td class="mono">${fmtDate(driver.date_of_birth)}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Gender</td><td style="text-transform: capitalize;">${driver.gender || '—'}</td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Blood Group</td><td><b>${driver.blood_group || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Aadhaar Number</td><td class="mono">${driver.aadhaar_no || '—'}</td></tr>
          </table>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            🪪 LICENCE & CREDENTIALS
          </div>
          <table style="margin: 0;">
            <tr><td style="width: 120px; font-weight: 600; background: #f8fafc;">Licence Number</td><td class="mono"><b>${driver.license_number || '—'}</b></td></tr>
            <tr><td style="font-weight: 600; background: #f8fafc;">Licence Expiry</td><td>
              <span class="mono" style="font-weight: 700;">${fmtDate(driver.license_expiry)}</span>
              <span class="tag-pill" style="background: ${licStatus.bg} !important; color: ${licStatus.color} !important; border: 1px solid ${licStatus.border}; margin-left: 6px;">${licStatus.label}</span>
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
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
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
          <div style="font-weight: 700; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
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
  };

  // 2b. Download / Print Single Driver Dossier
  const handlePrintSingleDriver = (driver) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const htmlBody = generateSingleDriverDossierHtml(driver, timestamp);
    printReportWindow(`Driver Dossier - ${driver.name}`, htmlBody, false);
  };

  // 2c. Download / Print Detailed Dossiers by Selection or All (Multi-page Book)
  const handlePrintDetailedDrivers = (driverId) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    if (driverId && driverId !== 'all') {
      const drv = items.find(d => String(d.id) === String(driverId));
      if (drv) {
        handlePrintSingleDriver(drv);
        return;
      }
    }
    // All filtered drivers dossier book
    const list = filteredItems;
    if (!list.length) {
      alert('No drivers found in current filter to generate dossiers.');
      return;
    }
    const htmlBody = list.map((drv, idx) => `
      <div style="${idx > 0 ? 'page-break-before: always; padding-top: 14px;' : ''}">
        ${generateSingleDriverDossierHtml(drv, timestamp)}
      </div>
    `).join('');

    printReportWindow(`Fleet Drivers Detailed Dossiers - ${institutionTitle}`, htmlBody, false);
  };

  // Helper: Dispatch roster print by scope
  const handlePrintDriversRoster = (scope = rosterScope) => {
    if (scope === 'assigned') {
      handlePrintAssignedDrivers();
    } else if (scope === 'spare') {
      handlePrintSpareDrivers();
    } else if (scope === 'unassigned') {
      handlePrintUnassignedDrivers();
    } else {
      handlePrintAllDrivers();
    }
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
          <div className="page-title">Drivers & Pilots</div>
          <div className="page-sub">Driver roster, bus mapping, licence compliance, and shift schedules</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowReportModal(true)}
            title="Download / Print Official Driver Reports & Staff Dossiers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              background: '#f5f3ff',
              color: '#7c6cfc',
              border: '1.5px solid #ddd6fe',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            <DrvIcon name="file" size={15} color="#7c6cfc" />
            <span>📄 Driver Report (PDF) ▾</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportCSV}
            title="Download Full Driver Register to Excel / CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              background: '#ecfdf5',
              color: '#059669',
              border: '1.5px solid #a7f3d0',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            <DrvIcon name="download" size={15} color="#059669" />
            <span>📥 Export CSV</span>
          </button>

          {canEdit && (
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => setEditing({ status: 'active', gender: 'male', driver_type: 'regular' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <DrvIcon name="plus" size={15} color="#fff" /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* KPI Summary Ribbon */}
        <div className="att-kpi-ribbon">
          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--purple">
              <DrvIcon name="user" size={22} color="#7c6cfc" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val">{totalCount}</div>
              <div className="att-kpi-label">Total Drivers</div>
              <div className="att-kpi-sub">Registered staff</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--green">
              <DrvIcon name="check" size={22} color="#10b981" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#10b981' }}>{activeCount}</div>
              <div className="att-kpi-label">Active Drivers</div>
              <div className="att-kpi-sub">{totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% roster active` : '—'}</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--blue">
              <DrvIcon name="bus" size={22} color="#3b82f6" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#3b82f6' }}>{assignedCount}</div>
              <div className="att-kpi-label">Assigned to Bus</div>
              <div className="att-kpi-sub">Regular duty assigned</div>
            </div>
          </div>

          <div className="att-kpi-card">
            <div className="att-kpi-icon att-kpi-icon--amber">
              <DrvIcon name="refresh" size={22} color="#f59e0b" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: '#d97706' }}>
                {totalSpareCount}
              </div>
              <div className="att-kpi-label">Spare Relievers</div>
              <div className="att-kpi-sub">{spareStandbyCount > 0 ? `${spareStandbyCount} standby ready` : 'Designated spare staff'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${unassignedCount > 0 ? 'att-kpi-card--warn' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--red">
              <DrvIcon name="alert" size={22} color="#ef4444" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: unassignedCount > 0 ? '#dc2626' : '#64748b' }}>
                {unassignedCount}
              </div>
              <div className="att-kpi-label">Unassigned Route Drivers</div>
              <div className="att-kpi-sub">{unassignedCount > 0 ? 'Awaiting route allocation' : 'All regular drivers mapped'}</div>
            </div>
          </div>

          <div className={`att-kpi-card ${expiringOrExpiredCount > 0 ? 'att-kpi-card--alert' : ''}`}>
            <div className="att-kpi-icon att-kpi-icon--red">
              <DrvIcon name="shield" size={22} color="#ef4444" />
            </div>
            <div className="att-kpi-body">
              <div className="att-kpi-val" style={{ color: expiringOrExpiredCount > 0 ? '#ef4444' : '#64748b' }}>
                {expiringOrExpiredCount}
              </div>
              <div className="att-kpi-label">Licence Due / Expired</div>
              <div className="att-kpi-sub">{expiringOrExpiredCount > 0 ? 'Renewal required' : 'All licences valid'}</div>
            </div>
          </div>
        </div>

        {/* Quick Driver Role & Status Filter Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim, #64748b)', marginRight: 4 }}>
            Driver Filter:
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 20,
              background: statusFilter === 'all' ? '#7c6cfc' : '#ffffff',
              color: statusFilter === 'all' ? '#ffffff' : '#334155',
              border: statusFilter === 'all' ? '1px solid #7c6cfc' : '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            All Staff ({totalCount})
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setStatusFilter('assigned')}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 20,
              background: statusFilter === 'assigned' ? '#16a34a' : '#ffffff',
              color: statusFilter === 'assigned' ? '#ffffff' : '#16a34a',
              border: statusFilter === 'assigned' ? '1px solid #16a34a' : '1px solid #bbf7d0',
              cursor: 'pointer'
            }}
          >
            🚌 Assigned to Route ({assignedCount})
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setStatusFilter('spare')}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 20,
              background: statusFilter === 'spare' ? '#b45309' : '#ffffff',
              color: statusFilter === 'spare' ? '#ffffff' : '#b45309',
              border: statusFilter === 'spare' ? '1px solid #b45309' : '1px solid #fde68a',
              cursor: 'pointer'
            }}
          >
            🔄 Spare / Relievers ({totalSpareCount})
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setStatusFilter('unassigned')}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 20,
              background: statusFilter === 'unassigned' ? '#dc2626' : '#ffffff',
              color: statusFilter === 'unassigned' ? '#ffffff' : '#dc2626',
              border: statusFilter === 'unassigned' ? '1px solid #dc2626' : '1px solid #fca5a5',
              cursor: 'pointer'
            }}
          >
            ⏳ Unassigned Route Drivers ({unassignedCount})
          </button>
          {inactiveCount > 0 && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setStatusFilter('inactive')}
              style={{
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 20,
                background: statusFilter === 'inactive' ? '#475569' : '#ffffff',
                color: statusFilter === 'inactive' ? '#ffffff' : '#475569',
                border: statusFilter === 'inactive' ? '1px solid #475569' : '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              🚫 Inactive Staff ({inactiveCount})
            </button>
          )}
          {othersCount > 0 && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setStatusFilter('others')}
              style={{
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 20,
                background: statusFilter === 'others' ? '#6d28d9' : '#ffffff',
                color: statusFilter === 'others' ? '#ffffff' : '#6d28d9',
                border: statusFilter === 'others' ? '1px solid #6d28d9' : '1px solid #ddd6fe',
                cursor: 'pointer'
              }}
            >
              🚙 Other / Utility ({othersCount})
            </button>
          )}
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <DrvIcon name="search" size={15} color="#94a3b8" />
            </span>
            <input
              type="text"
              className="fselect"
              placeholder="Search name, bus, route, license, mobile..."
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
              style={{ maxWidth: 260, fontWeight: 600, height: 38 }}
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
            style={{ maxWidth: 240, fontWeight: 600, height: 38 }}
          >
            <option value="all">All Status ({items.length})</option>
            <option value="assigned">Assigned Only ({assignedCount})</option>
            <option value="spare">Spare / Relievers ({totalSpareCount})</option>
            <option value="unassigned">Unassigned Route Drivers ({unassignedCount})</option>
            {inactiveCount > 0 && <option value="inactive">Inactive Staff ({inactiveCount})</option>}
            {othersCount > 0 && <option value="others">Other Utility Pilots ({othersCount})</option>}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Showing <b>{filteredItems.length}</b> of {items.length} drivers
            </span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          onEdit={canEdit ? setEditing : undefined}
          onDelete={canEdit ? handleDel : undefined}
          extraAction={(item) => (
            <button
              type="button"
              className="icon-btn"
              title={`Download / Print Dossier for ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePrintSingleDriver(item);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c6cfc',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: 5,
                padding: '3px 6px',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              <span style={{ fontSize: 13 }}>📥</span>
            </button>
          )}
          renderSubRow={renderSubRow}
          emptyIcon="👤"
          emptyText="No drivers found matching your criteria."
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

      {/* DRIVER REPORT SELECTION MODAL */}
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
                    Select Driver Report Format
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Choose between overall driver roster report, detailed staff bio-data dossier, or shift backup sheet
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
              {/* Option 1: Overall Driver Roster Report */}
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
                      name="driverReportType"
                      checked={reportType === 'overall'}
                      onChange={() => setReportType('overall')}
                      style={{ width: 17, height: 17, accentColor: '#7c6cfc', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#1e293b' }}>
                      📋 Overall Driver Roster Report (Summary Table)
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
                    Master Roster Format
                  </span>
                </div>
                <p style={{ margin: '0 0 0 27px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                  Consolidated master personnel register of drivers with employee ID, father's name, assigned bus & route, licence details & validity, contact phone, campus, blood group, experience, and operational status.
                </p>

                {/* Sub-selector for roster scope */}
                <div
                  style={{
                    marginLeft: 27,
                    marginTop: 4,
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Scope:</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="drvRosterScope"
                      checked={rosterScope === 'all'}
                      onChange={() => setRosterScope('all')}
                      style={{ accentColor: '#7c6cfc', cursor: 'pointer' }}
                    />
                    All Drivers ({items.length})
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#16a34a' }}>
                    <input
                      type="radio"
                      name="drvRosterScope"
                      checked={rosterScope === 'assigned'}
                      onChange={() => setRosterScope('assigned')}
                      style={{ accentColor: '#16a34a', cursor: 'pointer' }}
                    />
                    Assigned ({assignedCount})
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#b45309' }}>
                    <input
                      type="radio"
                      name="drvRosterScope"
                      checked={rosterScope === 'spare'}
                      onChange={() => setRosterScope('spare')}
                      style={{ accentColor: '#b45309', cursor: 'pointer' }}
                    />
                    Spare Relievers ({totalSpareCount})
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#dc2626' }}>
                    <input
                      type="radio"
                      name="drvRosterScope"
                      checked={rosterScope === 'unassigned'}
                      onChange={() => setRosterScope('unassigned')}
                      style={{ accentColor: '#dc2626', cursor: 'pointer' }}
                    />
                    Unassigned ({unassignedCount})
                  </label>
                </div>

                <div style={{ marginLeft: 27, display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • A4 Landscape
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • Management & Compliance Ready
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • Official Sign-offs
                  </span>
                </div>
              </div>

              {/* Option 2: Detailed Driver Bio-Data Profile */}
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
                      name="driverReportType"
                      checked={reportType === 'detailed'}
                      onChange={() => setReportType('detailed')}
                      style={{ width: 17, height: 17, accentColor: '#7c6cfc', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#1e293b' }}>
                      📑 Detailed Driver Bio-Data Dossier
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
                    4-Card Profile Sheet
                  </span>
                </div>
                <p style={{ margin: '0 0 0 27px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                  In-depth staff bio-data dossier featuring the 4 specification cards: Personal & Identity, Licence & Credentials, Contact & Domicile, and Fleet Assignment & Emergency contacts.
                </p>

                {/* Select Driver Dropdown */}
                <div style={{ marginLeft: 27, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Choose Driver for Dossier:
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={e => setSelectedDriverId(e.target.value)}
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
                    <option value="all">📚 All Drivers in Scope ({filteredItems.length} drivers - Multi-page Dossier)</option>
                    {filteredItems.map(d => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name} {d.employee_code ? `(#${d.employee_code})` : ''} — {d.assigned_bus_numbers ? `🚌 Bus ${d.assigned_bus_numbers}` : 'Standby'} • Lic: {d.license_number || '—'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Option 3: Shift Backup Sheet */}
              <div
                onClick={() => setReportType('shift_backup')}
                style={{
                  border: reportType === 'shift_backup' ? '2px solid #7c6cfc' : '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: reportType === 'shift_backup' ? '#f5f3ff' : '#ffffff',
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
                      name="driverReportType"
                      checked={reportType === 'shift_backup'}
                      onChange={() => setReportType('shift_backup')}
                      style={{ width: 17, height: 17, accentColor: '#7c6cfc', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#1e293b' }}>
                      🚌 Driver Shift & Route Backup Sheet (PDF)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#e0e7ff',
                      color: '#4338ca'
                    }}
                  >
                    Operational Shifts
                  </span>
                </div>
                <p style={{ margin: '0 0 0 27px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                  Daily operations roster covering morning and evening shift schedules, assigned routes, and standby reliever backup allocations for operational contingency.
                </p>
                <div style={{ marginLeft: 27, display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • Morning & Evening Shifts
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • Emergency Relievers
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 7px', borderRadius: 4, color: '#334155' }}>
                    • High-Res Vector PDF
                  </span>
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
                      handlePrintDriversRoster(rosterScope);
                    } else if (reportType === 'detailed') {
                      handlePrintDetailedDrivers(selectedDriverId);
                    } else if (reportType === 'shift_backup') {
                      handlePrintDriverShiftBackup();
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
                  <DrvIcon name="file" size={15} color="#fff" />
                  <span>
                    {reportType === 'overall'
                      ? 'Print / Save Roster (PDF)'
                      : reportType === 'detailed'
                      ? 'Print / Save Dossier (PDF)'
                      : 'Export Shift Backup (PDF)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
