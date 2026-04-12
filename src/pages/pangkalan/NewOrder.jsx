import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getPangkalanById } from '../../services/dataService';
import { ShoppingCart, Package, Info, CheckCircle2, AlertCircle, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pangkalanData, setPangkalanData] = useState(null);
  const [items, setItems] = useState({
    '3kg': 0,
    '5.5kg': 0,
    '12kg': 0
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.pangkalanId) {
      getPangkalanById(user.pangkalanId).then(setPangkalanData);
    }
  }, [user]);

  const handleQtyChange = (type, delta) => {
    setItems(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const handleInputChange = (type, val) => {
    let numVal = parseInt(val);
    if (isNaN(numVal)) numVal = 0;
    setItems(prev => ({ ...prev, [type]: Math.max(0, numVal) }));
  };

  const hasItems = Object.values(items).some(val => val > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pangkalanData || !hasItems) return;
    
    setLoading(true);
    try {
      await createOrder({
        pangkalanId: user.pangkalanId,
        pangkalanName: pangkalanData.name,
        branchId: pangkalanData.branchId,
        items,
        status: 'menunggu'
      });
      setSuccess(true);
      setTimeout(() => navigate('/user/riwayat'), 2000);
    } catch (error) {
      alert("Gagal membuat pesanan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', animation: 'fadeInScale 0.5s ease' }}>
         <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={64} />
         </div>
         <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Pesanan Terkirim!</h1>
         <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cek status pengiriman Anda di menu Riwayat.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeInUp 0.6s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Pemesanan Stok</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Bisa memesan berbagai jenis tabung sekaligus dalam satu kiriman.</p>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {['3kg', '5.5kg', '12kg'].map((type) => (
             <div key={type} className="card glass" style={{ 
               padding: '1.5rem 2rem', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'space-between',
               border: items[type] > 0 ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
               transition: 'all 0.3s'
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                   <div style={{ 
                     background: items[type] > 0 ? 'var(--primary)' : 'var(--bg-app)', 
                     width: '64px', height: '64px', 
                     borderRadius: '16px', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     transition: 'all 0.3s'
                   }}>
                      <Package size={32} color={items[type] > 0 ? 'white' : 'var(--text-light)'} />
                   </div>
                   <div>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>{type === '3kg' ? 'LPG 3kg' : (type === '5.5kg' ? 'B-Gas 5.5kg' : 'LPG 12kg')}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ready Stock • Cabang {pangkalanData?.branchId}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                   <button 
                      onClick={() => handleQtyChange(type, -1)}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   >
                      <Minus size={20} />
                   </button>
                   <input 
                      type="number"
                      className="input-field"
                      style={{ width: '80px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, background: 'transparent', border: 'none' }}
                      value={items[type] || ''}
                      onChange={(e) => handleInputChange(type, e.target.value)}
                   />
                   <button 
                      onClick={() => handleQtyChange(type, 1)}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   >
                      <Plus size={20} />
                   </button>
                </div>
             </div>
           ))}

           <button 
              onClick={handleSubmit}
              className="btn btn-primary" 
              style={{ padding: '1.5rem', fontSize: '1.1rem', fontWeight: 900, marginTop: '1rem' }}
              disabled={loading || !pangkalanData || !hasItems}
           >
              {loading ? 'Memproses Order...' : 'Konfirmasi & Kirim Pesanan'}
           </button>
        </div>

        <div>
          <div className="card glass" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 900 }}>
               <ShoppingCart size={22} color="var(--primary)" /> Ringkasan Pesanan
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
               {Object.entries(items).map(([type, qty]) => qty > 0 && (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                     <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{type === '3kg' ? 'LPG 3kg' : (type === '5.5kg' ? 'B-Gas 5.5kg' : 'LPG 12kg')}</span>
                     <span style={{ fontWeight: 800 }}>{qty} Pcs</span>
                  </div>
               ))}
               {!hasItems && <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada item dipilih.</p>}
            </div>

            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Lokasi Pengiriman</div>
                  <div style={{ fontWeight: 700 }}>{pangkalanData?.name || '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pangkalanData?.address || '-'}</div>
               </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
               <Info size={18} style={{ flexShrink: 0 }} />
               <p style={{ fontWeight: 600 }}>Pesanan akan digabung dalam satu kali pengiriman oleh agen.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
