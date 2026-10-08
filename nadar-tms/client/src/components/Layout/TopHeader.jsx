import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../UI/LanguageSwitcher';

const ROUTE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/institutions': 'Institutions',
  '/admin/buses': 'Fleet & Buses',
  '/admin/spare': 'Spare Buses',
  '/admin/drivers': 'Drivers',
  '/admin/driver-master-edit': 'Driver Master Edit',
  '/admin/driver-salary': 'Driver Salary',
  '/admin/students': 'Students',
  '/admin/routes': 'Routes & Stops',
  '/admin/assignments': 'Assign Route',
  '/admin/users': 'Logins',
  '/admin/attendance-report': 'Attendance Report',
  '/admin/reports': 'All Reports',
  '/admin/diesel': 'Diesel Usage',
  '/admin/maintenance': 'Maintenance & Billing',
  '/admin/job-cards': 'Job Cards (Bus-Wise)',
  '/admin/inventory': 'Spare Parts Inventory',
  '/admin/tyres': 'Tyres',
  '/admin/alerts': 'FC Alerts'
};

export default function TopHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isTamil } = useLanguage();

  const currentPath = location.pathname.replace(/\/$/, '') || '/admin';
  const pageRawTitle = ROUTE_TITLES[currentPath] || 'TMHNU Fleet Console';
  const pageTitle = t(pageRawTitle);

  // Formatted date string
  const todayStr = new Date().toLocaleDateString(isTamil ? 'ta-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header
      className="top-head-bar hide-on-print"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 54,
        background: '#ffffff',
        borderBottom: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Left: Breadcrumbs & Current Page Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          onClick={() => navigate('/admin')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          title="Return to Dashboard"
        >
          <span style={{ color: '#2563eb', fontSize: 14 }}>🚌</span>
          <span className="hide-on-mobile">{t('TMHNU Fleet')}</span>
        </div>

        <span style={{ color: '#cbd5e1', fontSize: 13, userSelect: 'none' }}>/</span>

        {/* Current Module Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {pageTitle}
          </h2>

          <span
            className="hide-on-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#16a34a',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '2px 8px',
              borderRadius: 12
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)'
              }}
            />
            <span>{t('Live Operations')}</span>
          </span>
        </div>
      </div>

      {/* Right: Date, Language Switcher Button & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Date Display */}
        <div
          className="hide-on-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#64748b',
            fontWeight: 600,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '4px 10px',
            borderRadius: 8
          }}
        >
          <span style={{ fontSize: 13 }}>📅</span>
          <span>{todayStr}</span>
        </div>

        {/* Multilingual Button (English / தமிழ்) */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LanguageSwitcher />
        </div>

        {/* User Role Badge */}
        <div
          className="hide-on-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 8,
            borderLeft: '1.5px solid #e2e8f0'
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 11.5
            }}
          >
            {(user?.name || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
            {user?.name?.split(' ')[0] || t('Administrator')}
          </span>
        </div>
      </div>
    </header>
  );
}
