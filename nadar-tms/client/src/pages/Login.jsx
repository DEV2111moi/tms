import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.role] || '/admin');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <h1><span className="dot"></span>NADAR TMS</h1>
          <p>Transport Management System · Theni</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="finput" type="email" value={email} placeholder="admin@nadartms.in"
              onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="finput" type="password" value={password} placeholder="password123"
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="err" style={{ marginBottom: 14 }}>{error}</div>}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginTop: 20 }}>
          Demo: admin@nadartms.in / deva
        </p>
      </div>
    </div>
  );
}
