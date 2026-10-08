import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher({ compact = false, className = '', style = {} }) {
  const { lang, setLang, toggleLang } = useLanguage();

  return (
    <div
      className={`lang-switcher-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: 24,
        padding: '3px 4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        ...style
      }}
      title="Switch Language / மொழியை மாற்றவும்"
    >
      {/* Globe Icon */}
      <div
        onClick={toggleLang}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px 0 8px',
          cursor: 'pointer',
          color: '#2563eb'
        }}
        title="Toggle language (English / தமிழ்)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>

      {/* English Option */}
      <button
        type="button"
        onClick={() => setLang('en')}
        style={{
          border: 'none',
          borderRadius: 20,
          padding: compact ? '4px 10px' : '5px 12px',
          fontSize: compact ? 12 : 12.5,
          fontWeight: lang === 'en' ? 700 : 500,
          background: lang === 'en' ? 'linear-gradient(135deg, #1e40af, #2563eb)' : 'transparent',
          color: lang === 'en' ? '#ffffff' : '#64748b',
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: lang === 'en' ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none',
          letterSpacing: lang === 'en' ? '0.3px' : 'normal'
        }}
      >
        {compact ? 'EN' : 'English'}
      </button>

      {/* Separator */}
      <span style={{ color: '#cbd5e1', fontSize: 12, margin: '0 2px', pointerEvents: 'none' }}>|</span>

      {/* Tamil Option */}
      <button
        type="button"
        onClick={() => setLang('ta')}
        style={{
          border: 'none',
          borderRadius: 20,
          padding: compact ? '4px 10px' : '5px 12px',
          fontSize: compact ? 12 : 12.5,
          fontWeight: lang === 'ta' ? 700 : 500,
          background: lang === 'ta' ? 'linear-gradient(135deg, #be185d, #ec4899)' : 'transparent',
          color: lang === 'ta' ? '#ffffff' : '#64748b',
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: lang === 'ta' ? '0 2px 6px rgba(190, 24, 93, 0.35)' : 'none',
          fontFamily: lang === 'ta' ? "'Latha', 'Mukta Malar', 'Noto Sans Tamil', sans-serif" : 'inherit'
        }}
      >
        தமிழ்
      </button>
    </div>
  );
}
