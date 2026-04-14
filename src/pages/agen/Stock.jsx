import React, { useEffect, useState } from 'react';
import { getStock, updateStock, recordSPBERefill, getSPBEHistory } from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { Package, Plus, Minus, AlertTriangle, CheckCircle2, MapPin, X, RefreshCw, Clock } from 'lucide-react';

const AdminStock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const setNotification = useNotification();
  const [refillData, setRefillData] = useState({
    branchId: 'Madiun',
    '3kg': '',
    '5.5kg': '',
    '12kg': ''
  });

  useEffect(() => {
    fetchStock();
    const unsub = getSPBEHistory((data) => {
      setHistory(data);
    });
    return () => unsub();
  }, []);

  const fetchStock = async () => {
    const data = await getStock();
    setStocks(data);
    setLoading(false);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordSPBERefill(refillData.branchId, {
        '3kg': refillData['3kg'],
        '5.5kg': refillData['5.5kg'],
        '12kg': refillData['12kg']
      });
      await fetchStock();
      setNotification.success("Pengisian ulang SPBE berhasil dicatat!");
      setShowRefillModal(false);
      setRefillData({ branchId: 'Madiun', '3kg': '', '5.5kg': '', '12kg': '' });
    } catch (error) {
      console.error("Refill error:", error);
      setNotification.error("Gagal mencatat pengisian ulang: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Audit & Monitoring Stok</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau ketersediaan tabung. Stok diperbarui otomatis melalui Pengisian SPBE & Pengiriman.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <button 
             onClick={() => setShowRefillModal(true)}
             style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
              <RefreshCw size={18} />
              Pengisian Ulang SPBE
           </button>
           <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }}></div>
              <span>Terisi</span>
           </div>
           <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#94a3b8', borderRadius: '50%' }}></div>
              <span>Kosong</span>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {stocks.map((branch) => (
          <div key={branch.id} className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
               <MapPin size={24} color="var(--primary)" />
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Cabang {branch.branchId}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
               {['gas3kg', 'gas5_5kg', 'gas12kg'].map((type) => (
                 <div key={type} style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 900, color: 'var(--text-main)', marginBottom: '1.5rem', borderBottom: '1.5px solid var(--primary-light)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                       {type === 'gas3kg' ? 'LPG 3Kg' : (type === 'gas5_5kg' ? 'Bright Gas 5.5Kg' : 'LPG 12Kg')}
                    </div>
                    
                    {['filled', 'empty', 'damaged'].map((field) => (
                      <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {field === 'filled' ? <CheckCircle2 size={16} color="#10b981" /> : (field === 'empty' ? <Package size={16} color="#94a3b8" /> : <AlertTriangle size={16} color="#ef4444" />)}
                            <span style={{ textTransform: 'capitalize', fontSize: '0.9rem', fontWeight: 600 }}>{field === 'filled' ? 'Terisi' : (field === 'empty' ? 'Kosong' : 'Rusak')}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ 
                               fontSize: '1.25rem', 
                               fontWeight: 900, 
                               color: 'var(--text-main)',
                               background: 'var(--bg-card)',
                               padding: '0.25rem 0.75rem',
                               borderRadius: '8px',
                               minWidth: '60px',
                               textAlign: 'center',
                               border: '1px solid var(--border)'
                            }}>
                               {branch[type][field] || 0}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={24} color="var(--primary)" />
          Riwayat Pengisian Ulang
        </h2>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Waktu</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Cabang</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Rincian Tambah Isi</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                 <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada riwayat pengisian ulang.</td></tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      {record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {record.branchId}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                         {record.quantities['3kg'] > 0 && <span>3Kg: <strong style={{color:'var(--primary)'}}>+{record.quantities['3kg']}</strong></span>}
                         {record.quantities['5.5kg'] > 0 && <span>5.5Kg: <strong style={{color:'var(--primary)'}}>+{record.quantities['5.5kg']}</strong></span>}
                         {record.quantities['12kg'] > 0 && <span>12Kg: <strong style={{color:'var(--primary)'}}>+{record.quantities['12kg']}</strong></span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refill Modal */}
      {showRefillModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative', padding: '2rem' }}>
            <button 
              onClick={() => setShowRefillModal(false)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
            
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCw size={24} color="var(--primary)" />
                Pengisian Ulang SPBE
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Catat tabung kosong yang telah selesai diisi ulang oleh SPBE. Stok Gudang (Kosong) akan otomatis dikurangi dan Stok (Isi) akan ditambahkan.
              </p>
            </div>

            <form onSubmit={handleRefillSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cabang Penerima</label>
                <select 
                  value={refillData.branchId}
                  onChange={(e) => setRefillData({...refillData, branchId: e.target.value})}
                  className="input-field"
                  required
                >
                  {stocks.map(s => (
                    <option key={s.id} value={s.branchId}>{s.branchId}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600 }}>Jumlah Tabung Diisi Ulang</label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ flex: 1, fontWeight: 600 }}>LPG 3Kg</div>
                  <input 
                    type="number" 
                    placeholder="0"
                    min="0"
                    className="input-field" 
                    style={{ width: '100px', textAlign: 'center' }}
                    value={refillData['3kg']}
                    onChange={(e) => setRefillData({...refillData, '3kg': e.target.value})}
                  />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '40px' }}>Tabung</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ flex: 1, fontWeight: 600 }}>Bright Gas 5.5Kg</div>
                  <input 
                    type="number" 
                    placeholder="0"
                    min="0"
                    className="input-field" 
                    style={{ width: '100px', textAlign: 'center' }}
                    value={refillData['5.5kg']}
                    onChange={(e) => setRefillData({...refillData, '5.5kg': e.target.value})}
                  />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '40px' }}>Tabung</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ flex: 1, fontWeight: 600 }}>LPG 12Kg</div>
                  <input 
                    type="number" 
                    placeholder="0"
                    min="0"
                    className="input-field" 
                    style={{ width: '100px', textAlign: 'center' }}
                    value={refillData['12kg']}
                    onChange={(e) => setRefillData({...refillData, '12kg': e.target.value})}
                  />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '40px' }}>Tabung</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowRefillModal(false)}
                  className="btn btn-secondary"
                  style={{ border: '1px solid var(--border)', background: 'transparent' }}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting || (!refillData['3kg'] && !refillData['5.5kg'] && !refillData['12kg'])}
                >
                  {isSubmitting ? 'Mencatat...' : 'Simpan Refill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStock;
