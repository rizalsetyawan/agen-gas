import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, recordPangkalanSale, getSales, getPangkalanById } from '../../services/dataService';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  TrendingUp, 
  Package, 
  History, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  ArrowDownCircle, 
  ShoppingCart 
} from 'lucide-react';

const UserSales = () => {
  const { user } = useAuth();
  const [pStock, setPStock] = useState({ gas3kg: 0, gas5_5kg: 0, gas12kg: 0 });
  const [pangkalanName, setPangkalanName] = useState('');
  const [sales, setSales] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({ gasType: 'gas3kg', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.pangkalanId) {
       // Get Name
       getPangkalanById(user.pangkalanId).then(p => setPangkalanName(p?.name || ''));

       // Stock Listener
       const unsubStock = onSnapshot(doc(db, 'pangkalanStock', user.pangkalanId), (doc) => {
         if (doc.exists()) setPStock(doc.data());
       });

       // Sales Listener
       const unsubSales = getSales({ pangkalanId: user.pangkalanId }, setSales);

       return () => {
         unsubStock();
         unsubSales();
       };
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quantity || parseInt(formData.quantity) <= 0) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await recordPangkalanSale(user.pangkalanId, pangkalanName, formData.gasType, formData.quantity);
      setMessage({ type: 'success', text: 'Penjualan berhasil dicatat & stok terpotong.' });
      setFormData({ ...formData, quantity: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const todaySales = sales.filter(s => {
    const today = new Date().toDateString();
    return s.createdAt?.toDate().toDateString() === today;
  });

  const aggregateSales = (type) => {
    return todaySales
      .filter(s => s.gasType === type)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Pencatatan Penjualan (B2C)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Catat setiap tabung yang keluar ke konsumen untuk menjaga akurasi stok gudang.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 1.8fr', gap: '2rem' }} className="responsive-grid">
        {/* LEFT: FORM & STOCK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {/* STOCK WIDGET */}
           <div className="card glass" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontWeight: 900 }}>
                 <Package size={20} color="var(--primary)" /> Persediaan Saat Ini
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                 {[
                   { label: 'LPG 3kg', key: 'gas3kg', color: 'var(--primary)' },
                   { label: 'Bright 5.5kg', key: 'gas5_5kg', color: 'var(--accent)' },
                   { label: 'LPG 12kg', key: 'gas12kg', color: '#3b82f6' }
                 ].map(item => {
                    const stock = pStock[item.key] || { filled: 0, empty: 0 };
                    const fVal = typeof stock === 'object' ? stock.filled : stock;
                    const eVal = typeof stock === 'object' ? (stock.empty || 0) : 0;
                    
                    const safeFVal = isNaN(fVal) ? 0 : (fVal || 0);
                    const safeEVal = isNaN(eVal) ? 0 : (eVal || 0);
                    
                    return (
                      <div key={item.key} style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.label}</div>
                         <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>ISI</div>
                               <div style={{ fontSize: '1.25rem', fontWeight: 900, color: item.color }}>{safeFVal}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>KOSONG</div>
                               <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-light)' }}>{safeEVal}</div>
                            </div>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>

           {/* RECORD FORM */}
           <div className="card glass" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Tambah Penjualan Baru</h3>
              <form onSubmit={handleSubmit}>
                 <div className="input-group">
                    <label className="input-label">Pilih Jenis Gas</label>
                    <select 
                       className="input-field"
                       value={formData.gasType}
                       onChange={e => setFormData({...formData, gasType: e.target.value})}
                    >
                       <option value="gas3kg">LPG 3kg (Subsidi)</option>
                       <option value="gas5_5kg">Bright Gas 5.5kg</option>
                       <option value="gas12kg">LPG 12kg</option>
                    </select>
                 </div>
                 <div className="input-group">
                    <label className="input-label">Jumlah Tabung Terjual</label>
                    <input 
                       type="number" 
                       className="input-field" 
                       placeholder="Contoh: 5"
                       value={formData.quantity}
                       onChange={e => setFormData({...formData, quantity: e.target.value})}
                       required
                    />
                 </div>

                 {message.text && (
                   <div style={{ 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      marginBottom: '1.5rem', 
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: message.type === 'error' ? '#ef4444' : '#22c55e',
                      border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                   }}>
                      {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      {message.text}
                   </div>
                 )}

                 <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '1rem', borderRadius: '16px' }}
                    disabled={loading}
                 >
                    <ShoppingCart size={18} /> {loading ? 'Menyimpan...' : 'Catat Penjualan'}
                 </button>
              </form>
           </div>
        </div>

        {/* RIGHT: HISTORY & SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {/* SUMMARY ROW */}
           <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[
                { label: 'Terjual 3kg', val: aggregateSales('gas3kg'), color: '#10b981' },
                { label: 'Terjual 5.5kg', val: aggregateSales('gas5_5kg'), color: 'var(--accent)' },
                { label: 'Terjual 12kg', val: aggregateSales('gas12kg'), color: '#3b82f6' }
              ].map((stat, i) => (
                <div key={i} className="card glass" style={{ padding: '1.5rem', borderLeft: `4px solid ${stat.color}` }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{stat.label}</div>
                   <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.25rem' }}>{stat.val} <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>UNIT</span></div>
                </div>
              ))}
           </div>

           {/* LOG TABLE */}
           <div className="card glass" style={{ padding: '1.5rem', flex: 1 }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>
                 <History size={20} color="var(--text-muted)" /> Transaksi Hari Ini
              </h3>
              <div className="table-container">
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <th style={{ padding: '1rem 0' }}>WAKTU</th>
                          <th style={{ padding: '1rem 0' }}>JENIS GAS</th>
                          <th style={{ padding: '1rem 0' }}>JUMLAH</th>
                          <th style={{ padding: '1rem 0' }}>STATUS STOK</th>
                       </tr>
                    </thead>
                    <tbody>
                       {todaySales.map(sale => (
                         <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                            <td style={{ padding: '1.25rem 0', fontSize: '0.85rem' }}>{sale.createdAt?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '1.25rem 0' }}>
                               <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{sale.gasType.replace('gas', 'LPG ')}</span>
                            </td>
                            <td style={{ padding: '1.25rem 0', fontWeight: 800, color: 'var(--primary)' }}>- {sale.quantity} Unit</td>
                            <td style={{ padding: '1.25rem 0' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                                  <ArrowDownCircle size={14} /> Terpotong
                               </div>
                            </td>
                         </tr>
                       ))}
                       {todaySales.length === 0 && (
                         <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                               Belum ada histori penjualan hari ini.
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserSales;
