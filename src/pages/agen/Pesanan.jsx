import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, getPangkalan } from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { ShoppingCart, CheckCircle, Truck, Package, Download, Milestone, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [pangkalan, setPangkalan] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const setNotification = useNotification();

  const toggleExpand = (pid) => {
    setExpandedCards(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  useEffect(() => {
    const unsubscribe = getAllOrders((data) => {
      setOrders(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    getPangkalan().then(setPangkalan);
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setNotification.success("Status pesanan berhasil diperbarui!");
    } catch (error) {
      setNotification.error("Gagal memperbarui status: " + error.message);
    }
  };

  const getProgress = (order) => {
    if (order.status === 'selesai') return 100;
    let total = 0;
    let fulfilled = 0;
    Object.keys(order.items || {}).forEach(type => {
      total += order.items[type] || 0;
      fulfilled += order.fulfilledItems?.[type] || 0;
    });
    if (total === 0) return 10;
    
    // Add a minimum 10% just visually so bar isn't completely empty when pending
    return Math.max(10, (fulfilled / total) * 100);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'selesai': return '#10b981';
      case 'terkirim_sebagian': return '#f59e0b';
      case 'diproses': return '#6366f1';
      case 'menunggu': return '#94a3b8';
      default: return '#000';
    }
  };

  // Aggregate raw orders into Pangkalan summaries
  const aggregatedOrders = Object.values(orders.reduce((acc, o) => {
      const pid = o.pangkalanId;
      if (!acc[pid]) {
          acc[pid] = {
             id: pid, // Temporary aggregated ID
             realOrderId: o.id, // Store real ID for actions
             pangkalanId: pid,
             pangkalanName: o.pangkalanName || 'Tanpa Nama',
             branchId: o.branchId,
             status: 'selesai',
             items: {},
             fulfilledItems: {},
             receivedItems: {},
             history: []
          };
      }
      
      const target = acc[pid];
      target.history.push(o);
      
      if (o.status === 'menunggu') {
          target.status = 'menunggu';
          target.realOrderId = o.id;
      }
      else if (o.status === 'diproses' && target.status !== 'menunggu') {
          target.status = 'diproses';
          target.realOrderId = o.id;
      }
      else if (o.status === 'terkirim_sebagian' && target.status === 'selesai') {
          target.status = 'terkirim_sebagian';
          target.realOrderId = o.id;
      }
      
      Object.entries(o.items || {}).forEach(([k, v]) => target.items[k] = (target.items[k] || 0) + v);
      Object.entries(o.fulfilledItems || {}).forEach(([k, v]) => target.fulfilledItems[k] = (target.fulfilledItems[k] || 0) + v);
      Object.entries(o.receivedItems || {}).forEach(([k, v]) => target.receivedItems[k] = (target.receivedItems[k] || 0) + v);
      
      return acc;
  }, {}));

  const filteredOrders = filter === 'all' 
    ? aggregatedOrders 
    : aggregatedOrders.filter(o => o.status === filter);

  const exportToExcel = () => {
    const dataToExport = orders.map(o => {
      const pName = pangkalan.find(p => p.id === o.pangkalanId)?.name || o.pangkalanName || o.pangkalanId;
      const itemsText = o.items 
        ? Object.entries(o.items).filter(([_, q]) => q > 0).map(([t, q]) => `${t}: ${q}`).join(', ')
        : `${o.gasType}: ${o.totalQty || o.quantity}`;
        
      return {
        ID: o.id,
        Pangkalan: pName,
        Cabang: o.branchId,
        'Detail Pesanan': itemsText,
        Status: o.status,
        Tanggal: o.createdAt?.toDate().toLocaleString() || '-'
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Laporan_Distribusi_Pesanan.xlsx");
  };

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }} className="mobile-stack stagger-1">
        <div>
          <h1 style={{ fontSize: 'var(--radius-lg)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Manajemen Pesanan</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pantau dan kelola pemenuhan kuota gas untuk seluruh mitra pangkalan.</p>
        </div>
        <button onClick={exportToExcel} className="btn btn-white" style={{ width: 'fit-content' }}>
          <Download size={18} /> Export Data
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }} className="stagger-1">
        {['all', 'menunggu', 'diproses', 'terkirim_sebagian', 'selesai'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-white glass'}`}
            style={{ textTransform: 'capitalize', fontSize: '0.8rem', padding: '0.6rem 1.5rem', borderRadius: '12px' }}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '2rem' }}>
        {filteredOrders.length === 0 ? (
          <div className="card glass stagger-2" style={{ padding: '5rem', textAlign: 'center', gridColumn: '1/-1' }}>
              <ShoppingCart size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Tidak ada pesanan dalam kategori ini.</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => (
            <div key={order.id} className="card glass stagger-{(i % 5) + 1}" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                fontSize: '1.25rem', fontWeight: 900, color: getStatusColor(order.status), opacity: 0.8
              }}>
                {Math.round(getProgress(order))} %
              </div>
              
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '2rem' }}>
                 <div style={{ 
                    background: 'var(--primary-light)', 
                    width: '52px', height: '52px', 
                    borderRadius: '16px', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' 
                 }}>
                    <Package size={24} />
                 </div>
                 <div>
                    <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>{order.pangkalanName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Cabang {order.branchId}</div>
                 </div>
               </div>

               <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                     <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>DETAIL PESANAN</span>
                     <span style={{ fontWeight: 900, color: getStatusColor(order.status) }}>{order.status === 'menunggu' ? 'Belum Rute' : (order.status === 'selesai' ? 'Tuntas' : 'On Road')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                     {order.items ? Object.entries(order.items).map(([type, qty]) => {
                        if (qty <= 0) return null;
                        const fulfilled = order.fulfilledItems?.[type] || 0;
                        const received = order.receivedItems?.[type] || 0;
                        const onRoad = Math.max(0, fulfilled - received);
                        const remaining = Math.max(0, qty - fulfilled);
                        
                        return (
                        <div key={type} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.75rem', fontSize: '0.8rem', fontWeight: 800, width: '100%' }}>
                           <div style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                              {type === '3kg' ? 'LPG 3kg' : (type === '5.5kg' ? 'B-Gas 5.5kg' : 'LPG 12kg')}
                           </div>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                              <div style={{ background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '8px' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>Total Pesan</div>
                                 <div>{qty}</div>
                              </div>
                              <div style={{ background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '8px' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>On Road</div>
                                 <div style={{ color: onRoad > 0 ? '#6366f1' : 'inherit' }}>{onRoad}</div>
                              </div>
                              <div style={{ background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '8px' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>Sudah Tiba</div>
                                 <div style={{ color: received > 0 ? '#10b981' : 'inherit' }}>{received}</div>
                              </div>
                              <div style={{ background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '8px' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>Sisa Antre</div>
                                 <div style={{ color: remaining > 0 ? '#f59e0b' : 'inherit' }}>{remaining}</div>
                              </div>
                           </div>
                        </div>
                     )}) : (
                        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 800 }}>
                           {order.gasType}: <span style={{ color: 'var(--primary)' }}>{order.totalQty || order.quantity} Unit</span>
                        </div>
                     )}
                  </div>

                  <div className="order-progress-container" style={{ height: '6px', background: 'var(--bg-app)' }}>
                     <div className="order-progress-bar" style={{ width: `${getProgress(order)}%`, background: getStatusColor(order.status), boxShadow: `0 0 10px ${getStatusColor(order.status)}40` }}></div>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                     background: `${getStatusColor(order.status)}15`,
                     color: getStatusColor(order.status),
                     padding: '0.5rem 1rem',
                     borderRadius: '10px',
                     fontSize: '0.75rem',
                     fontWeight: 900,
                     textTransform: 'uppercase',
                     letterSpacing: '0.05em',
                     border: `1px solid ${getStatusColor(order.status)}30`
                  }}>
                     {order.status.replace('_', ' ')}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 700 }}>
                    #{order.id.substring(0,8).toUpperCase()}
                  </span>
               </div>
               
               <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                  {order.status === 'menunggu' && (
                     <button onClick={() => order.realOrderId && handleStatusUpdate(order.realOrderId, 'diproses')} className="btn btn-primary" style={{ width: '100%', height: '48px', borderRadius: '14px' }}>
                        Terima & Proses Pesanan
                     </button>
                  )}
                  {(order.status === 'diproses' || order.status === 'terkirim_sebagian') && (
                     <div style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--bg-app)', height: '48px', borderRadius: '14px', fontWeight: 700 }}>
                        <Milestone size={18} className="animate-pulse" /> Pantau di Penjadwalan Rute
                     </div>
                  )}
               </div>

               <button onClick={() => toggleExpand(order.id)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-glass)', marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '12px', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} className="btn-white">
                  {expandedCards[order.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Riwayat Pesanan ({order.history?.length || 0})
               </button>

               {expandedCards[order.id] && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.3s ease-out' }}>
                     {order.history?.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(hist => (
                        <div key={hist.id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                           <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hist.createdAt?.toDate().toLocaleString() || '-'}</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-main)' }}>
                                 {Object.entries(hist.items || {}).filter(([t,q]) => q > 0).map(([t, q]) => `${t}: ${q}`).join(', ')}
                              </div>
                           </div>
                           <div style={{ fontSize: '0.65rem', fontWeight: 800, color: getStatusColor(hist.status), background: `${getStatusColor(hist.status)}15`, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                              {hist.status.replace('_', ' ').toUpperCase()}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
