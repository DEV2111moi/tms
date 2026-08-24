import { useState, useEffect } from 'react';
import api from '../../api/api';
import DataTable, { fmtDate, money } from '../../components/UI/DataTable';
import FormModal from '../../components/UI/FormModal';
import Modal from '../../components/UI/Modal';
import { useToast } from '../../components/UI/Toast';

export default function DieselUsage() {
  const [rows, setRows] = useState([]);
  const [byInst, setByInst] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [detailBus, setDetailBus] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [refs, setRefs] = useState({});
  const toast = useToast();

  const load = () => {
    Promise.all([
      api.fuelReport(),
      api.refs()
    ]).then(([d, r]) => {
      setRows(d.rows || []);
      setByInst(d.byInstitution || []);
      setRefs(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data) => {
    await api.addFuelAdmin(data);
    toast('Diesel entry logged');
    load();
  };

  const handleShowBusDetail = async (bus) => {
    setDetailBus(bus);
    setDetailData(null);
    try {
      const d = await api.busFuel(bus.id);
      setDetailData(d);
    } catch (e) {
      toast(e.message);
    }
  };

  const totL = rows.reduce((s, r) => s + Number(r.liters || 0), 0);
  const totC = rows.reduce((s, r) => s + Number(r.cost || 0), 0);

  if (loading) return <div className="loading-center"><div className="spinner" /> Loading...</div>;

  const BUS_COLUMNS = [
    { key: 'registration_number', label: 'Bus', render: (v, item) => <b style={{ cursor: 'pointer', color: 'var(--navy)' }} onClick={() => handleShowBusDetail(item)}>{v}</b> },
    { key: 'institution', label: 'Institution' },
    { key: 'fills', label: 'Fills', mono: true },
    { key: 'liters', label: 'Diesel Litres', render: (v) => <span className="mono">{Number(v).toFixed(1)} L</span> },
    { key: 'cost', label: 'Cost Spent', money: true },
    { key: 'km', label: 'Distance', render: (v) => <span className="mono">{Number(v).toLocaleString('en-IN')} km</span> },
    { key: 'mileage', label: 'Mileage', render: (v) => v ? <span className="mono">{v} km/L</span> : '—' },
  ];

  const INST_COLUMNS = [
    { key: 'institution', label: 'Institution', render: (v) => <b>{v}</b> },
    { key: 'buses', label: 'Buses Count', mono: true },
    { key: 'fills', label: 'Fills', mono: true },
    { key: 'liters', label: 'Total Litres', render: (v) => <span className="mono">{Number(v).toFixed(1)} L</span> },
    { key: 'cost', label: 'Total Cost', money: true },
  ];

  const fields = [
    { key: 'bus_id', label: 'Bus Registration', type: 'busref', required: true },
    { key: 'liters', label: 'Diesel Litres', type: 'number', required: true },
    { key: 'cost', label: 'Total Cost (₹)', type: 'number' },
    { key: 'odometer', label: 'Odometer (km)', type: 'number' },
    { key: 'fuel_date', label: 'Date', type: 'date', required: true }
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Diesel Usage</div>
          <div className="page-sub">Fuel logging per bus and institution</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing({ fuel_date: new Date().toISOString().slice(0, 10) })}>
          + Diesel Entry
        </button>
      </div>
      <div className="page-body">
        <div className="cards-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card"><div className="stat-card__label">Active Vehicles</div><div className="stat-card__value">{rows.length}</div></div>
          <div className="stat-card"><div className="stat-card__label">Total Litres Fill</div><div className="stat-card__value stat-card__value--amber">{totL.toFixed(1)} L</div></div>
          <div className="stat-card"><div className="stat-card__label">Total Cost Spend</div><div className="stat-card__value">{money(totC)}</div></div>
        </div>

        <div className="section-h">Diesel by Institution</div>
        <DataTable columns={INST_COLUMNS} data={byInst} emptyIcon="🏫" emptyText="No institution entries." />

        <div className="section-h" style={{ marginTop: 24 }}>Diesel by Vehicle (click vehicle reg to view all logs)</div>
        <DataTable columns={BUS_COLUMNS} data={rows} emptyIcon="🚌" emptyText="No vehicle entries." />
      </div>

      {editing !== null && (
        <FormModal title="Diesel Entry" fields={fields} initial={editing} onSave={handleAdd} onClose={() => setEditing(null)} refs={refs} />
      )}

      {detailBus && (
        <Modal title={`Fuel Logs for Bus ${detailBus.registration_number}`} onClose={() => setDetailBus(null)} wide>
          {detailData ? (
            <div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                <div>Total Fills: <b>{detailData.count}</b></div>
                <div>Total Litres: <b>{detailData.totalLiters} L</b></div>
                <div>Total Cost: <b>{money(detailData.totalCost)}</b></div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr><th>Date</th><th>Liters</th><th>Cost</th><th>Odometer</th><th>Logged By</th></tr>
                  </thead>
                  <tbody>
                    {detailData.fills.map(f => (
                      <tr key={f.id}>
                        <td className="mono">{fmtDate(f.fuel_date)}</td>
                        <td className="mono">{f.liters} L</td>
                        <td className="mono">{money(f.cost)}</td>
                        <td className="mono">{f.odometer ? `${f.odometer} km` : '—'}</td>
                        <td>{f.driver_name || 'System / Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="loading-center"><div className="spinner" /> Loading details...</div>
          )}
        </Modal>
      )}
    </>
  );
}
