import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getOrdersByPangkalan, 
  getPangkalanById, 
  getActiveStopsForPangkalan, 
  getDeliveryStops,
  confirmStopReceipt,
  db
} from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  User, 
  Truck, 
  X, 
  MapPin, 
  TrendingUp, 
  BarChart4,
  Box,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pangkalan, setPangkalan] = useState(null);
  const [activeStops, setActiveStops] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [allStops, setAllStops] = useState([]);
  const [pStock, setPStock] = useState({ gas3kg: { filled: 0, empty: 0 }, gas5_5kg: { filled: 0, empty: 0 }, gas12kg: { filled: 0, empty: 0 } });
  
  // Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [confirmData, setConfirmData] = useState({}); // { '3kg': { actual: 100, empty: 100 } }
  const [submitting, setSubmitting] = useState(false);
  const setNotification = useNotification();

  useEffect(() => {
    if (user?.pangkalanId) {
      getPangkalanById(user.pangkalanId).then(setPangkalan);
      const unsubOrders = getOrdersByPangkalan(user.pangkalanId, setOrders);
      const unsubStops = getActiveStopsForPangkalan(user.pangkalanId, setActiveStops);
      
      const unsubStock = onSnapshot(doc(db, 'pangkalanStock', user.pangkalanId), (doc) => {
        if (doc.exists()) setPStock(doc.data());
      });

      return () => {
        unsubOrders();
        unsubStops();
        unsubStock();
      };
    }
  }, [user]);

  // Listener for active delivery details
  useEffect(() => {
    if (activeStops.length > 0 && activeStops[0].deliveryId) {
       // Get delivery status/location
       const unsubDel = onSnapshot(doc(db, 'deliveries', activeStops[0].deliveryId), (doc) => {
          if (doc.exists()) setActiveDelivery(doc.data());
       });
       
       // Get all stops path
       const unsubPath = getDeliveryStops(activeStops[0].deliveryId, setAllStops);
       
       return () => {
          unsubDel();
          unsubPath();
       };
    } else {
       setActiveDelivery(null);
       setAllStops([]);
    }
  }, [activeStops]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'menunggu' || o.status === 'diproses').length,
    finished: orders.filter(o => o.status === 'selesai').length
  };

  const handleOpenConfirm = (stop) => {
    setSelectedStop(stop);
    const initialData = {};
    Object.keys(stop.items || {}).forEach(type => {
       initialData[type] = { 
         actual: stop.items[type], 
         empty: stop.items[type] 
       };
    });
    setConfirmData(initialData);
    setShowConfirm(true);
  };

  const handleConfirmItemChange = (type, field, val) => {
     setConfirmData(prev => ({
        ...prev,
        [type]: { ...prev[type], [field]: Math.max(0, parseInt(val) || 0) }
     }));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await confirmStopReceipt(selectedStop.id, confirmData);
      setNotification.success("Penerimaan gas berhasil dikonfirmasi!");
      setShowConfirm(false);
    } catch (err) {
      setNotification.error("Gagal konfirmasi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }} className="mobile-stack stagger-1">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Halo, {pangkalan?.name || 'Mitra'}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Sistem distribusi Anda terpantau aman dan lancar.</p>
        </div>
        <Link to="/user/pesan" className="btn btn-primary" style={{ borderRadius: '16px', gap: '0.75rem', padding: '1.25rem 2rem' }}>
           <ShoppingBag size={20} /> <span style={{ fontWeight: 800 }}>Pesan Gas</span>
        </Link>
      </div>

      {/* ACTIVE SHIPMENT TRACKER - PREMIUM PATHWAY */}
      {activeStops.length > 0 && (
         <div className="card glass stagger-2" style={{ 
            background: 'var(--bg-card)', 
            marginBottom: '2.5rem', 
            padding: '2.5rem',
            border: '1px solid var(--border-glass)'
         }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }} className="mobile-stack">
               <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '20px', color: 'var(--primary)' }}>
                     <Truck size={32} />
                  </div>
                  <div>
                     <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Pengiriman Sedang Berlangsung</h2>
                     <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lacak rute armada secara real-time di bawah ini.</p>
                  </div>
               </div>
               <button onClick={() => handleOpenConfirm(activeStops[0])} className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                  <Package size={18} style={{marginRight: '0.5rem'}} /> Konfirmasi Penerimaan
               </button>
            </div>

            {/* ROUTE PATH VISUALIZATION */}
            <div style={{ padding: '0 1rem', marginBottom: '3rem' }}>
               <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }} className="mobile-stack">
                  {/* Line Background */}
                  <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: 'var(--border-glass)', zIndex: 0 }} className="mobile-hide"></div>
                  
                  {allStops.map((stop, idx) => {
                     const isCurrentPangkalan = stop.pangkalanId === user.pangkalanId;
                     const isFinished = stop.status === 'selesai';
                     const firstPendingIdx = allStops.findIndex(s => s.status !== 'selesai');
                     const isActive = idx === firstPendingIdx;

                     return (
                        <div key={stop.id} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                           {/* NODE ICON */}
                           <div style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', 
                              background: isFinished ? '#10b981' : (isActive ? 'var(--primary)' : 'var(--bg-app)'), 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', border: '4px solid var(--bg-card)',
                              boxShadow: isActive ? '0 0 20px var(--primary-light)' : 'none',
                              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              animation: isActive ? 'pulse 2s infinite' : 'none'
                           }}>
                              {isFinished ? <CheckCircle2 size={16} /> : (isActive ? <Truck size={16} /> : <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-light)'}}></div>)}
                           </div>
                           
                           {/* LABEL */}
                           <div style={{ marginTop: '1.25rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: isActive ? 'var(--primary)' : (isFinished ? '#10b981' : 'var(--text-main)'), marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                 {stop.pangkalanName} 
                                 {isCurrentPangkalan && <span style={{ background: 'var(--accent)', color: 'white', fontSize: '0.55rem', padding: '1px 5px', borderRadius: '4px' }}>ANDA</span>}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                 {isFinished ? 'Selesai' : (isActive ? 'Truk di Sini' : 'Antrean')}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* LIVE LOCATION BANNER */}
            {activeDelivery && (
               <div style={{ padding: '1.5rem', background: 'var(--bg-app)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-glass)' }}>
                  <Navigation size={18} color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Posisi Terakhir Armada: <b style={{color: 'var(--primary)', marginLeft: '0.5rem'}}>{activeDelivery.currentLocation || 'Kantor Agen'}</b></span>
               </div>
            )}
         </div>
      )}

      {/* MAIN DASHBOARD GRID */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* STATS TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
             <div className="card glass stagger-2">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>TOTAL ORDER</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.total}</div>
             </div>
             <div className="card glass stagger-3">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>ANTREAN</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>{stats.pending}</div>
             </div>
             <div className="card glass stagger-4">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>SELESAI</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{stats.finished}</div>
             </div>
          </div>

          {/* STOCK CAPACITY MONITOR */}
          <div className="card glass stagger-5" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem' }}>Kapasitas Gudang</h3>
              <div style={{ display: 'grid', gap: '2rem' }}>
                 {[
                   { label: 'LPG 3Kg', val: isNaN(pStock.gas3kg?.filled) ? 0 : (pStock.gas3kg?.filled || 0), max: 100, color: 'var(--primary)' },
                   { label: 'Bright Gas 5.5Kg', val: isNaN(pStock.gas5_5kg?.filled) ? 0 : (pStock.gas5_5kg?.filled || 0), max: 50, color: 'var(--accent)' },
                   { label: 'LPG 12Kg', val: isNaN(pStock.gas12kg?.filled) ? 0 : (pStock.gas12kg?.filled || 0), max: 30, color: '#3b82f6' }
                 ].map((item, idx) => (
                    <div key={idx}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem' }}>
                          <span style={{ fontWeight: 800 }}>{item.label}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{item.val} / {item.max} Unit</span>
                       </div>
                       <div className="order-progress-container" style={{ height: '12px', borderRadius: '6px' }}>
                          <div className="order-progress-bar" style={{ width: `${Math.min(100, (item.val / item.max) * 100)}%`, background: item.color }}></div>
                       </div>
                    </div>
                 ))}
              </div>
          </div>
        </div>

        {/* SIDEBAR INFO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div className="card glass stagger-3" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-glass)', background: 'var(--primary-light)' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border-glass)' }}>
                       <BarChart4 size={24} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Stok Detail</h3>
                 </div>
              </div>
              <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                  {[
                    { label: 'LPG 3kg', key: 'gas3kg', color: 'var(--primary)' },
                    { label: 'Bright 5.5kg', key: 'gas5_5kg', color: 'var(--accent)' },
                    { label: 'LPG 12kg', key: 'gas12kg', color: '#3b82f6' }
                  ].map(item => (
                    <div key={item.key} style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: '24px', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.9rem' }}>{item.label}</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <div style={{ flex: 1, background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '14px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>ISI</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: item.color }}>{isNaN(pStock[item.key]?.filled) ? 0 : (pStock[item.key]?.filled || 0)}</div>
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '14px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>KOSONG</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-light)' }}>{isNaN(pStock[item.key]?.empty) ? 0 : (pStock[item.key]?.empty || 0)}</div>
                          </div>
                        </div>
                    </div>
                  ))}
              </div>
           </div>

           <div className="card glass stagger-5" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={24} color="var(--text-muted)" />
                 </div>
                 <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{pangkalan?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Wilayah {pangkalan?.branchId}</div>
                 </div>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', padding: '1.25rem', background: 'var(--bg-app)', borderRadius: '16px', lineHeight: '1.6' }}>
                 {pangkalan?.address}
              </div>
           </div>
        </div>
      </div>

      {/* MULTI-ITEM CONFIRMATION MODAL */}
      {showConfirm && selectedStop && (
         <div style={{ 
           position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
           background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', 
           display: 'flex', alignItems: 'center', justifyContent: 'center', 
           zIndex: 2000, padding: '1.25rem' 
         }}>
            <div className="card glass" style={{ 
              maxWidth: '550px', width: '100%', padding: '2.5rem', 
              borderRadius: '32px', animation: 'fadeInScale 0.4s ease-out',
              maxHeight: '90vh', overflowY: 'auto'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Konfirmasi Barang</h3>
                  <button onClick={() => setShowConfirm(false)} className="btn-white" style={{ padding: '0.5rem', width: '44px', height: '44px', borderRadius: '14px' }}>
                    <X size={24} />
                  </button>
               </div>

               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', fontWeight: 500 }}>
                  Silakan periksa fisik tabung yang diturunkan oleh supir dan jumlah tabung kosong yang dikembalikan.
               </p>

               <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     {Object.keys(selectedStop.items || {}).map(type => (
                        <div key={type} style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-glass)' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
                              <Box size={20} />
                              <span style={{ fontWeight: 900, fontSize: '1rem' }}>{type === '3kg' ? 'LPG 3kg' : (type === '5.5kg' ? 'Bright 5.5kg' : 'LPG 12kg')}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--primary-light)', padding: '0.2rem 0.6rem', borderRadius: '6px', marginLeft: 'auto' }}>
                                 PLAN: {selectedStop.items[type]} UNIT
                              </span>
                           </div>
                           
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div className="input-group">
                                 <label className="input-label" style={{ fontSize: '0.65rem', fontWeight: 800 }}>DITERIMA (ISI)</label>
                                 <input 
                                    type="number" className="input-field" 
                                    value={confirmData[type]?.actual}
                                    onChange={e => handleConfirmItemChange(type, 'actual', e.target.value)}
                                    required
                                    style={{ background: 'var(--bg-card)', borderRadius: '12px', textAlign: 'center', fontWeight: 800 }}
                                 />
                              </div>
                              <div className="input-group">
                                 <label className="input-label" style={{ fontSize: '0.65rem', fontWeight: 800 }}>KEMBALI (KOSONG)</label>
                                 <input 
                                    type="number" className="input-field" 
                                    value={confirmData[type]?.empty}
                                    onChange={e => handleConfirmItemChange(type, 'empty', e.target.value)}
                                    required
                                    style={{ background: 'var(--bg-card)', borderRadius: '12px', textAlign: 'center', fontWeight: 800 }}
                                 />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '1rem', borderRadius: '16px', display: 'flex', gap: '0.75rem', color: 'var(--accent)' }}>
                     <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                     <p style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: '1.5' }}>
                        Pastikan jumlah tabung kosong yang dikembalikan sesuai dengan fisik yang dibawa supir ke gudang agen.
                     </p>
                  </div>

                  <button 
                     type="submit" className="btn btn-primary" 
                     style={{ width: '100%', height: '64px', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 900 }}
                     disabled={submitting}
                  >
                     {submitting ? 'Menyinkronkan Stok...' : 'Konfirmasi Terima & Selesai'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default UserDashboard;
