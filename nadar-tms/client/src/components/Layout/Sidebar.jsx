import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../api/api';

const NAV_ADMIN = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/institutions', icon: '🏫', label: 'Institutions' },
  { to: '/admin/buses', icon: '🚌', label: 'Buses' },
  { to: '/admin/drivers', icon: '🪪', label: 'Drivers' },
  { to: '/admin/users', icon: '🔑', label: 'Logins' },
  { to: '/admin/routes', icon: '🛣️', label: 'Routes & Stops' },
  { to: '/admin/assignments', icon: '🔗', label: 'Assign Route' },
  { to: '/admin/reports', icon: '📋', label: 'Reports' },
  { to: '/admin/diesel', icon: '⛽', label: 'Diesel Usage' },
  { to: '/admin/maintenance', icon: '🔧', label: 'Maintenance' },
  { to: '/admin/tyres', icon: '🛞', label: 'Tyres' },
  { to: '/admin/alerts', icon: '⚠️', label: 'FC Alerts', badge: true },
];

const NAV_EXEC = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/reports', icon: '📋', label: 'Reports' },
  { to: '/admin/diesel', icon: '⛽', label: 'Diesel Usage' },
  { to: '/admin/maintenance', icon: '🔧', label: 'Maintenance' },
  { to: '/admin/tyres', icon: '🛞', label: 'Tyres' },
  { to: '/admin/alerts', icon: '⚠️', label: 'FC Alerts', badge: true },
];

const NAV_INST = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/students', icon: '🎒', label: 'Students' },
  { to: '/admin/users', icon: '🔑', label: 'Bus Incharge Logins' },
  { to: '/admin/assignments', icon: '🔗', label: 'Assign Incharge' },
  { to: '/admin/routes', icon: '🛣️', label: 'Routes (view)' },
  { to: '/admin/buses', icon: '🚌', label: 'Buses (view)' },
  { to: '/admin/drivers', icon: '🪪', label: 'Drivers (view)' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  const role = user?.role;
  const nav = role === 'executive' ? NAV_EXEC : role === 'institution' ? NAV_INST : NAV_ADMIN;
  const title = role === 'executive' ? 'Executive' : role === 'institution' ? 'Institution' : 'Control Room';

  useEffect(() => {
    api.alerts(30).then(d => setAlertCount(d.count || 0)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Nadar TMHNU · Theni</h2>
        <h1>{title}</h1>
      </div>
      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        {role === 'admin' && (
          <NavLink to="/incharge" className="nav-item">
            <span className="nav-icon">🚍</span>
            <span>Open Attendance</span>
          </NavLink>
        )}
        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon">↩</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
