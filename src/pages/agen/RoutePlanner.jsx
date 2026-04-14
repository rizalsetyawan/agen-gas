import React, { useState, useEffect } from 'react';
import { getAllOrders, getPangkalan, createDeliveryRoute } from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { Truck, Users, Plus, X, Search, MapPin, Package, Save, CheckCircle2, Box, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoutePlanner = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [dispatchQuantities, setDispatchQuantities] = useState({});

  // Form State
  const [deliveryInfo, setDeliveryInfo] = useState({
    driverName: '',
    truckNumber: '',
    branchId: 'Madiun'
  });

  const [loading, setLoading] = useState(false);
  const setNotification = useNotification();

  useEffect(() => {
    // Get all unfulfilled orders based on pure math (remaining quantity > 0)
    const unsub = getAllOrders((data) => {
      setOrders(data.filter(o => {
         if (o.status === 'selesai') return false;
         
         let totalRemaining = 0;
         Object.keys(o.items || {}).forEach(t => {
            totalRemaining += (o.items[t] || 0) - (o.fulfilledItems?.[t] || 0);
         });
         return totalRemaining > 0;
      }));
    });
    return () => unsub();
  }, []);

  const toggleOrderSelection = (order) => {
    const isSelected = selectedOrders.find(o => o.id === order.id);
    if (isSelected) {
      setSelectedOrders(selectedOrders.filter(o => o.id !== order.id));
      setDispatchQuantities(prev => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } else {
      setSelectedOrders([...selectedOrders, order]);
      // Initialize with maximum remaining quantities
      const initialQtys = {};
      Object.keys(order.items || {}).forEach(type => {
         const remaining = (order.items[type] || 0) - (order.fulfilledItems?.[type] || 0);
         if (remaining > 0) {
            initialQtys[type] = remaining;
         }
      });
      setDispatchQuantities(prev => ({ ...prev, [order.id]: initialQtys }));
    }
  };
  
  const moveOrder = (index, direction) => {
    const newOrders = [...selectedOrders];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrders.length) return;
    
    // Swap
    const temp = newOrders[index];
    newOrders[index] = newOrders[targetIndex];
    newOrders[targetIndex] = temp;
    setSelectedOrders(newOrders);
  };

  const handleDispatch = async () => {
    if (!deliveryInfo.driverName || !deliveryInfo.truckNumber) {
      setNotification.warning("Harap lengkapi plat nomor dan nama supir.");
      return;
    }
    
    // Map exactly what was inputted in the customized dispatch quantity
    const stopsData = selectedOrders.map(o => {
       return {
          orderId: o.id,
          pangkalanId: o.pangkalanId,
          pangkalanName: o.pangkalanName,
          items: dispatchQuantities[o.id] || {}
       };
    }).filter(stop => Object.values(stop.items).some(q => q > 0)); // Only include if at least 1 unit is sent

    if (stopsData.length === 0) {
       setNotification.warning("Tidak ada barang yang dijadwalkan untuk dikirim pada rute ini.");
       return;
    }

    setLoading(true);
    try {
      await createDeliveryRoute(deliveryInfo, stopsData);
      
      setSelectedOrders([]);
      setDispatchQuantities({});
      setDeliveryInfo({ driverName: '', truckNumber: '', branchId: deliveryInfo.branchId });
      setNotification.success("Rute Pengiriman Berhasil Dibuat dan Pesanan Diperbarui!");
      navigate('/admin/pengiriman');
    } catch (err) {
      setNotification.error("Gagal membuat rute: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }} className="mobile-stack stagger-1">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Penyusunan Rute</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Sistem baru mendukung pengiriman berbagai jenis gas dalam satu jalur.</p>
        </div>
        <button 
          onClick={handleDispatch} 
          className="btn btn-primary" 
          disabled={loading || selectedOrders.length === 0}
          style={{ width: 'fit-content', padding: '1.25rem 2rem' }}
        >
           <Truck size={20} /> {loading ? 'Memproses...' : 'Dispatch Armada'}
        </button>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* LEFT: ORDER SELECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
             <Search size={20} color="var(--text-muted)" />
             <input 
               type="text" 
               placeholder="Cari pangkalan..." 
               className="input-field" 
               style={{ border: 'none', background: 'transparent', padding: 0 }}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
             {orders.filter(o => (o.pangkalanName || '').toLowerCase().includes(searchTerm.toLowerCase())).map((order, i) => {
                const isSelected = selectedOrders.find(s => s.id === order.id);
                const totalItems = Object.values(order.items || {}).reduce((a, b) => a + b, 0);
                
                return (
                  <div 
                    key={order.id} 
                    className={`card glass ${isSelected ? 'selected-item' : ''} stagger-${(i % 5) + 1}`}
                    onClick={() => toggleOrderSelection(order)}
                    style={{ 
                      cursor: 'pointer', 
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      padding: '1.5rem',
                      transition: 'all 0.3s'
                    }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                           <div style={{ background: isSelected ? 'var(--primary)' : 'var(--bg-app)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                              <Package size={22} color={isSelected ? 'white' : 'var(--primary)'} />
                           </div>
                           <div>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{order.pangkalanName}</div>
                              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                 {Object.entries(order.items || {}).map(([type, qty]) => qty > 0 && (
                                    <span key={type} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--border-glass)', borderRadius: '6px', fontWeight: 700 }}>
                                       {type}: {qty}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div style={{ 
                           width: '28px', height: '28px', borderRadius: '50%', 
                           border: '2px solid var(--border-glass)',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           background: isSelected ? 'var(--primary)' : 'transparent',
                           color: 'white'
                        }}>
                           {isSelected ? <CheckCircle2 size={16} /> : <Plus size={16} color="var(--text-light)" />}
                        </div>
                     </div>
                  </div>
                );
             })}
             {orders.length === 0 && <div className="card glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada pesanan masuk.</div>}
          </div>
        </div>

        {/* RIGHT: ROUTE DETAILS */}
        <div style={{ position: 'sticky', top: '1.5rem', alignSelf: 'start' }}>
           <div className="card glass stagger-2" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', fontWeight: 900 }}>
                 <Truck size={24} color="var(--primary)" /> Konfigurasi Armada
              </h3>
              
              <div className="input-group">
                 <label className="input-label" style={{ fontWeight: 800, fontSize: '0.7rem' }}>Nama Supir</label>
                 <input 
                   type="text" className="input-field" 
                   placeholder="Masukkan Nama Lengkap"
                   value={deliveryInfo.driverName}
                   onChange={e => setDeliveryInfo({...deliveryInfo, driverName: e.target.value})}
                   style={{ background: 'var(--bg-app)', borderRadius: '14px' }}
                 />
              </div>
              
              <div className="input-group">
                 <label className="input-label" style={{ fontWeight: 800, fontSize: '0.7rem' }}>Plat Nomor Truk</label>
                 <input 
                   type="text" className="input-field" 
                   placeholder="Contoh: AE 1234 XY"
                   value={deliveryInfo.truckNumber}
                   onChange={e => setDeliveryInfo({...deliveryInfo, truckNumber: e.target.value})}
                   style={{ background: 'var(--bg-app)', borderRadius: '14px' }}
                 />
              </div>

              <div className="input-group">
                 <label className="input-label" style={{ fontWeight: 800, fontSize: '0.7rem' }}>Region Berangkat</label>
                 <select 
                    className="input-field"
                    value={deliveryInfo.branchId}
                    onChange={e => setDeliveryInfo({...deliveryInfo, branchId: e.target.value})}
                    style={{ background: 'var(--bg-app)', borderRadius: '14px' }}
                 >
                    <option>Madiun</option>
                    <option>Nganjuk</option>
                    <option>Ponorogo</option>
                 </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '2rem', marginTop: '2.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em' }}>DRIVE PLAN ({selectedOrders.length} STOP)</h4>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedOrders.map((o, idx) => (
                      <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                               {idx + 1}
                             </div>
                             <div style={{ flex: 1, fontWeight: 800, fontSize: '0.85rem' }}>{o.pangkalanName}</div>
                             
                             <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); moveOrder(idx, 'up'); }} 
                                  disabled={idx === 0}
                                  title="Pindahkan ke atas"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === 0 ? 'var(--text-light)' : 'var(--primary)', opacity: idx === 0 ? 0.3 : 1 }}
                                >
                                   <ArrowUp size={16} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); moveOrder(idx, 'down'); }} 
                                  disabled={idx === selectedOrders.length - 1}
                                  title="Pindahkan ke bawah"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === selectedOrders.length - 1 ? 'var(--text-light)' : 'var(--primary)', opacity: idx === selectedOrders.length - 1 ? 0.3 : 1 }}
                                >
                                   <ArrowDown size={16} />
                                </button>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); toggleOrderSelection(o); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                               <X size={16} />
                             </button>
                          </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '2.5rem', marginTop: '0.5rem', paddingRight: '0.5rem' }}>
                              {Object.entries(o.items || {}).map(([type, totalQty]) => {
                                 if (totalQty === 0) return null;
                                 const remaining = totalQty - (o.fulfilledItems?.[type] || 0);
                                 if (remaining <= 0) return null; // fully packed
                                 const currentVal = dispatchQuantities[o.id]?.[type] !== undefined ? dispatchQuantities[o.id][type] : remaining;
                                 
                                 return (
                                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                          <Box size={12} /> {type === '3kg' ? 'LPG 3kg' : (type === '5.5kg' ? 'B-Gas 5.5kg' : 'LPG 12kg')} (Sisa: {remaining})
                                       </div>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <input 
                                             type="number"
                                             value={currentVal || ''}
                                             min="0"
                                             max={remaining}
                                             onChange={(e) => {
                                                let val = parseInt(e.target.value);
                                                if (isNaN(val)) val = 0;
                                                val = Math.min(Math.max(0, val), remaining); // limit exactly to max needed
                                                setDispatchQuantities(prev => ({
                                                   ...prev,
                                                   [o.id]: { ...(prev[o.id] || {}), [type]: val }
                                                }));
                                             }}
                                             style={{ width: '60px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.2rem', color: 'var(--text-main)', fontWeight: 800 }}
                                          />
                                          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Unit</span>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                      </div>
                    ))}
                    {selectedOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-app)', borderRadius: '16px', border: '2px dashed var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Pilih pesanan di sisi kiri untuk menyusun rute.
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
