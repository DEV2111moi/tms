import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@tms.in');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const ROLE_ROUTES = {
    admin: '/admin',
    executive: '/admin',
    institution: '/admin',
    incharge: '/incharge',
    driver: '/driver',
    parent: '/parent',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(ROLE_ROUTES[user.role] || '/admin');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleQuickFill = () => {
    setEmail('admin@tms.in');
    setPassword('1234');
    setError('');
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo-wrap" title="TMHNU Transport">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6m8-6v6" />
              <path d="M4 16h16" />
              <path d="M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
              <circle cx="8" cy="14" r="1.5" />
              <circle cx="16" cy="14" r="1.5" />
              <path d="M6 18v2m12-2v2" />
            </svg>
          </div>
          <h1>TMHNU</h1>
          <p>Transport Management System · Theni</p>
          <div className="login-security-tag">
            <span>🔒 Central Control Room Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="login-email"
                className="login-input"
                type="email"
                value={email}
                placeholder="admin@tms.in"
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="login-input-group">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                className="login-input"
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="••••"
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="err" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            className="login-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-btn-spinner"></span>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to TMHNU</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill helper */}
        <div className="login-demo-card">
          <div className="login-demo-text">
            <span className="login-demo-title">Default Credentials</span>
            <span className="login-demo-creds">admin@tms.in · 1234</span>
          </div>
          <button
            type="button"
            className="login-demo-btn"
            onClick={handleQuickFill}
            title="Auto fill credentials"
          >
            Auto Fill
          </button>
        </div>

        <div className="login-foot-note">
          TMHNU Central Fleet Control · Theni<br />
          Authorized personnel access only
        </div>
      </div>
    </div>
  );
}
