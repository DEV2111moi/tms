import { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/UI/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';
import { fmtDate, money } from '../../components/UI/DataTable';

export default function DriverPanel() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const toast = useToast();

  const [data, setData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [tripForm, setTripForm] = useState({ bus_id: '', start_km: '', shift: 'trip1' });
  const [endKm, setEndKm] = useState('');
  const [endStop, setEndStop] = useState('');
  const [fuelForm, setFuelForm] = useState({ bus_id: '', liters: '', cost: '', odometer: '', fuel_date: new Date().toISOString().slice(0, 10) });

  const load = () => {
    Promise.all([
      api.driverMe(),
      api.driverBuses()
    ]).then(([d, b]) => {
      setData(d);
      setBuses(b.items || []);
      if (d.driver) {
        setTripForm(prev => ({ ...prev, bus_id: d.assignments?.[0]?.bus_id || b.items?.[0]?.id || '' }));
        setFuelForm(prev => ({ ...prev, bus_id: d.assignments?.[0]?.bus_id || b.items?.[0]?.id || '' }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStartTrip = async (e) => {
    e.preventDefault();
    try {
      await api.startTrip(tripForm);
      toast('Trip started successfully');
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleEndTrip = async (e) => {
    e.preventDefault();
    try {
      await api.endTrip({ id: data.open.id, end_km: endKm, end_stop: endStop });
      toast('Trip finished successfully');
      setEndKm('');
      setEndStop('');
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleLogFuel = async (e) => {
    e.preventDefault();
    try {
      await api.addFuel(fuelForm);
      toast('Fuel entry logged');
      setFuelForm(prev => ({ ...prev, liters: '', cost: '', odometer: '' }));
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;
  if (!data?.driver) return <div className="empty"><p>Driver profile details not found. Please contact admin.</p></div>;

  const { driver, assignments, open, today, logs } = data;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🪪</span>
          <span style={{ fontFamily: 'Oswald', fontWeight: 600, fontSize: 16 }}>{t('TMS Driver Portal')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSwitcher compact={true} />
          <span className="topbar-who">{user?.name}</span>
          <button className="signout-btn" onClick={handleLogout}>{t('Exit')}</button>
        </div>
      </header>


      <main className="page-body" style={{ flex: 1, padding: 16, maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {/* Info card */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 600, color: 'var(--navy)' }}>Driver Info</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            Emp Code: <b>{driver.employee_code || '—'}</b> · Licence: <b>{driver.license_number}</b>
          </div>
          {assignments?.length > 0 && (
            <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text-dim)' }}>
              Assigned Route: {assignments.map(a => `${a.shift === 'morning' ? '☀️ Morning' : '🌙 Evening'}: ${a.route_code}`).join(' & ')}
            </div>
          )}
        </div>

        {/* Start / Stop Trip */}
        {open ? (
          <form className="card" onSubmit={handleEndTrip} style={{ marginBottom: 16, borderLeft: '4px solid var(--marigold)' }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 600, color: 'var(--navy)' }}>Running Trip: {open.shift.replace('trip', 'Trip ')}</div>
            <div className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>
              Bus: <b>{open.registration_number}</b> · Started at: <b>{new Date(open.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</b> ({open.start_km} km)
            </div>
            <div className="form-grid">
              <label className="flabel">
                <span>Closing Odometer (km) *</span>
                <input className="finput" type="number" value={endKm} required onChange={e => setEndKm(e.target.value)} />
              </label>
              <label className="flabel">
                <span>End Stop Reached</span>
                <input className="finput" placeholder="e.g. School" value={endStop} onChange={e => setEndStop(e.target.value)} />
              </label>
            </div>
            <button className="btn btn-primary btn-full" type="submit" style={{ marginTop: 14 }}>
              Finish Trip
            </button>
          </form>
        ) : (
          <form className="card" onSubmit={handleStartTrip} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 600, color: 'var(--navy)' }}>Start New Trip</div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <label className="flabel">
                <span>Select Bus *</span>
                <select className="fselect" value={tripForm.bus_id} required onChange={e => setTripForm(prev => ({ ...prev, bus_id: e.target.value }))}>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number}</option>)}
                </select>
              </label>
              <label className="flabel">
                <span>Shift *</span>
                <select className="fselect" value={tripForm.shift} required onChange={e => setTripForm(prev => ({ ...prev, shift: e.target.value }))}>
                  <option value="trip1">Trip 1 (Morning pick up)</option>
                  <option value="trip2">Trip 2 (Morning drop off)</option>
                  <option value="trip3">Trip 3 (Evening pick up)</option>
                  <option value="trip4">Trip 4 (Evening drop off)</option>
                </select>
              </label>
              <label className="flabel full">
                <span>Opening Odometer (km) *</span>
                <input className="finput" type="number" value={tripForm.start_km} required onChange={e => setTripForm(prev => ({ ...prev, start_km: e.target.value }))} />
              </label>
            </div>
            <button className="btn btn-primary btn-full" type="submit" style={{ marginTop: 14 }}>
              Start Trip
            </button>
          </form>
        )}

        {/* Fuel logging */}
        <form className="card" onSubmit={handleLogFuel} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Oswald', fontSize: 18, fontWeight: 600, color: 'var(--navy)' }}>Log Diesel Fuel Entry</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="flabel">
              <span>Select Bus *</span>
              <select className="fselect" value={fuelForm.bus_id} required onChange={e => setFuelForm(prev => ({ ...prev, bus_id: e.target.value }))}>
                {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number}</option>)}
              </select>
            </label>
            <label className="flabel">
              <span>Date *</span>
              <input className="finput" type="date" value={fuelForm.fuel_date} required onChange={e => setFuelForm(prev => ({ ...prev, fuel_date: e.target.value }))} />
            </label>
            <label className="flabel">
              <span>Diesel Litres *</span>
              <input className="finput" type="number" step="0.01" value={fuelForm.liters} required onChange={e => setFuelForm(prev => ({ ...prev, liters: e.target.value }))} />
            </label>
            <label className="flabel">
              <span>Total Cost (₹)</span>
              <input className="finput" type="number" step="0.01" value={fuelForm.cost} onChange={e => setFuelForm(prev => ({ ...prev, cost: e.target.value }))} />
            </label>
            <label className="flabel full">
              <span>Odometer at Fill (km)</span>
              <input className="finput" type="number" value={fuelForm.odometer} onChange={e => setFuelForm(prev => ({ ...prev, odometer: e.target.value }))} />
            </label>
          </div>
          <button className="btn btn-primary btn-full" type="submit" style={{ marginTop: 14 }}>
            Log Diesel
          </button>
        </form>

        {/* Logs */}
        <div className="section-h">Recent Trip Logs</div>
        <div className="table-wrap" style={{ marginBottom: 20 }}>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Trip</th><th>Bus</th><th>Km Run</th></tr></thead>
            <tbody>
              {logs.trips?.length ? logs.trips.map(l => (
                <tr key={l.id}>
                  <td className="mono">{fmtDate(l.log_date)}</td>
                  <td>{l.shift.replace('trip', 'Trip ')}</td>
                  <td className="mono">{l.registration_number}</td>
                  <td className="mono">{l.end_km && l.start_km ? `${l.end_km - l.start_km} km` : 'running...'}</td>
                </tr>
              )) : <tr><td colSpan={4} className="muted">No trip logs.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="section-h">Recent Fuel Logs</div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Bus</th><th>Litres</th><th>Spent</th></tr></thead>
            <tbody>
              {logs.fuel?.length ? logs.fuel.map(f => (
                <tr key={f.id}>
                  <td className="mono">{fmtDate(f.fuel_date)}</td>
                  <td className="mono">{f.registration_number}</td>
                  <td className="mono">{f.liters} L</td>
                  <td className="mono">{money(f.cost)}</td>
                </tr>
              )) : <tr><td colSpan={4} className="muted">No fuel entries.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
