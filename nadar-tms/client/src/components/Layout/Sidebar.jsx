import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../api/api';

function NavIcon({ name, className = "nav-icon-svg" }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case 'institution':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V10l7-5 7 5v11" />
          <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
          <circle cx="9" cy="10" r="0.8" fill="currentColor" />
          <circle cx="15" cy="10" r="0.8" fill="currentColor" />
          <circle cx="9" cy="14" r="0.8" fill="currentColor" />
          <circle cx="15" cy="14" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'bus':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6v6m8-6v6" />
          <path d="M4 16h16" />
          <path d="M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
          <circle cx="8" cy="14" r="1.5" />
          <circle cx="16" cy="14" r="1.5" />
          <path d="M6 18v2m12-2v2" />
        </svg>
      );
    case 'driver':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="9" cy="10" r="2.5" />
          <path d="M15 8h3m-3 4h3m-8 4h8" />
          <path d="M5 16.5c.8-1.5 2.3-2.5 4-2.5s3.2 1 4 2.5" />
        </svg>
      );
    case 'user':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'route':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </svg>
      );
    case 'link':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case 'report':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'fuel':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="22" x2="15" y2="22" />
          <path d="M4 22V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v17" />
          <rect x="6.5" y="6" width="5" height="4" rx="1" />
          <path d="M14 9h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L20 7" />
        </svg>
      );
    case 'wrench':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'tyre':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v5.5m0 7V21M3 12h5.5m7 0H21m-15.3-6.3 3.9 3.9m8.8 8.8 3.9 3.9m-16.6 0 3.9-3.9m8.8-8.8 3.9-3.9" />
        </svg>
      );
    case 'alert':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'student':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case 'attendance':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'salary':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="16" cy="15" r="1.5" fill="currentColor" />
          <path d="M6 14h4" />
        </svg>
      );
    case 'logout':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case 'external':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    default:
      return null;
  }
}

const GROUPS_ADMIN = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', icon: 'dashboard', label: 'Dashboard', end: true },
    ],
  },
  {
    title: 'Attendance & Reports',
    items: [
      { to: '/admin/attendance-report', icon: 'attendance', label: 'Attendance Report' },
      { to: '/admin/reports', icon: 'report', label: 'All Reports' },
    ],
  },
  {
    title: 'Core Management',
    items: [
      { to: '/admin/institutions', icon: 'institution', label: 'Institutions' },
      { to: '/admin/buses', icon: 'bus', label: 'Buses' },
      { to: '/admin/drivers', icon: 'driver', label: 'Drivers' },
      { to: '/admin/driver-master-edit', icon: 'edit', label: 'Driver Master Edit' },
      { to: '/admin/driver-salary', icon: 'salary', label: 'Driver Salary & Bata' },
      { to: '/admin/users', icon: 'user', label: 'Logins' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/routes', icon: 'route', label: 'Routes & Stops' },
      { to: '/admin/assignments', icon: 'link', label: 'Assign Route' },
    ],
  },
  {
    title: 'Fleet & Maintenance',
    items: [
      { to: '/admin/diesel', icon: 'fuel', label: 'Diesel Usage' },
      { to: '/admin/maintenance', icon: 'wrench', label: 'Maintenance' },
      { to: '/admin/tyres', icon: 'tyre', label: 'Tyres' },
      { to: '/admin/alerts', icon: 'alert', label: 'FC Alerts', badge: true },
    ],
  },
];

const GROUPS_INST = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', icon: 'dashboard', label: 'Dashboard', end: true },
    ],
  },
  {
    title: 'Attendance & Reports',
    items: [
      { to: '/admin/attendance-report', icon: 'attendance', label: 'Attendance Report' },
    ],
  },
  {
    title: 'Campus Incharge',
    items: [
      { to: '/admin/students', icon: 'student', label: 'Students' },
      { to: '/admin/users', icon: 'user', label: 'Bus Incharge Logins' },
      { to: '/admin/assignments', icon: 'link', label: 'Assign Incharge' },
    ],
  },
  {
    title: 'Fleet & Payroll',
    items: [
      { to: '/admin/routes', icon: 'route', label: 'Routes (view)' },
      { to: '/admin/buses', icon: 'bus', label: 'Buses (view)' },
      { to: '/admin/drivers', icon: 'driver', label: 'Drivers (view)' },
      { to: '/admin/driver-master-edit', icon: 'edit', label: 'Driver Master Edit' },
      { to: '/admin/driver-salary', icon: 'salary', label: 'Driver Salary & Bata' },
    ],
  },
];

const GROUPS_EXEC = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', icon: 'dashboard', label: 'Dashboard', end: true },
    ],
  },
  {
    title: 'Attendance, Audit & Payroll',
    items: [
      { to: '/admin/attendance-report', icon: 'attendance', label: 'Attendance Report' },
      { to: '/admin/reports', icon: 'report', label: 'Reports' },
      { to: '/admin/driver-salary', icon: 'salary', label: 'Driver Salaries & Bata' },
      { to: '/admin/diesel', icon: 'fuel', label: 'Diesel Usage' },
      { to: '/admin/maintenance', icon: 'wrench', label: 'Maintenance' },
      { to: '/admin/tyres', icon: 'tyre', label: 'Tyres' },
      { to: '/admin/alerts', icon: 'alert', label: 'FC Alerts', badge: true },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  const role = user?.role;
  const groups = role === 'executive' ? GROUPS_EXEC : role === 'institution' ? GROUPS_INST : GROUPS_ADMIN;
  const portalName = role === 'executive' ? 'Executive' : role === 'institution' ? 'Institution' : 'Control Room';

  useEffect(() => {
    api.alerts(30).then(d => setAlertCount(d.count || 0)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-top">
          <div className="brand-logo-badge" title="Nadar TMHNU Fleet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6m8-6v6" />
              <path d="M4 16h16" />
              <path d="M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
              <circle cx="8" cy="14" r="1.5" />
              <circle cx="16" cy="14" r="1.5" />
              <path d="M6 18v2m12-2v2" />
            </svg>
          </div>
          <div className="brand-titles">
            <span className="brand-kicker">THENI CENTRAL</span>
            <span className="brand-name">TMHNU</span>
          </div>
        </div>

        <div className="sidebar-status-pill">
          <span className="status-dot"></span>
          <span>{portalName}</span>
        </div>
      </div>

      {/* Navigation with categorized groups */}
      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.title} className="nav-group">
            <div className="nav-group-label">{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon-wrap">
                  <NavIcon name={item.icon} />
                </div>
                <span className="nav-label">{item.label}</span>
                {item.badge && alertCount > 0 && (
                  <span className="nav-badge">{alertCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer with user badge and quick links */}
      <div className="sidebar-foot">
        {role === 'admin' && (
          <NavLink to="/incharge" className="foot-action-link" title="Open Attendance Portal">
            <div className="foot-action-content">
              <NavIcon name="attendance" />
              <span>Open Attendance</span>
            </div>
            <NavIcon name="external" className="foot-action-arrow" />
          </NavLink>
        )}

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-user-meta">
            <span className="sidebar-user-name" title={user?.name || 'Administrator'}>
              {user?.name || 'Administrator'}
            </span>
            <span className="sidebar-user-role">
              {role === 'institution' ? 'Campus Incharge' : role === 'executive' ? 'Executive' : 'Super Admin'}
            </span>
          </div>
          <button
            type="button"
            className="btn-signout-icon"
            onClick={handleLogout}
            title="Sign out of TMS"
          >
            <NavIcon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  );
}
