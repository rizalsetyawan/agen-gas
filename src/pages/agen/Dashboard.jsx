import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  getAllOrders, 
  getDeliveries, 
  getStock 
} from '../../services/dataService';
import { 
  ShoppingCart, 
  Truck, 
  TrendingUp, 
  Package,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Box
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeDeliveries: 0,
    totalPangkalan: 0,
    totalSales3kg: 0
  });

  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    // Top Stats Listeners
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setStats(prev => ({ ...prev, totalOrders: snapshot.size }));
    });

    const unsubscribeActiveDev = onSnapshot(query(collection(db, 'deliveries'), where('status', '==', 'berjalan')), (snapshot) => {
      setStats(prev => ({ ...prev, activeDeliveries: snapshot.size }));
    });

    getDocs(collection(db, 'pangkalan')).then(snapshot => {
      setStats(prev => ({ ...prev, totalPangkalan: snapshot.size }));
    });

    // Real-time Data Feed
    const unsubStock = onSnapshot(collection(db, 'stock'), (snapshot) => {
      setStocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRecentOrders = getAllOrders((data) => {
      setOrders(data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5));
    });

    const unsubShipping = getDeliveries((data) => {
       setDeliveries(data.filter(d => d.status === 'berjalan').slice(0, 5));
    });

    return () => {
        unsubscribeOrders();
        unsubscribeActiveDev();
        unsubStock();
        unsubRecentOrders();
        unsubShipping();
    };
  }, []);

  const getStockStatus = (val) => {
    if (val < 20) return { color: '#ef4444', label: 'KRITIS' };
    if (val < 50) return { color: '#f59e0b', label: 'WARNING' };
    return { color: '#10b981', label: 'AMAN' };
  };

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '2.5rem' }} className="stagger-1">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Dashboard Ringkasan
        </h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Operasional agen terpantau aman. Klik kartu untuk rincian.</p>
      </div>

      {/* TOP STATS CARDS */}
      <div className="responsive-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <div className="card glass stagger-1">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ShoppingCart size={24} />
            </div>
            <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>LIVE</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pesanan</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.25rem' }}>{stats.totalOrders}</div>
        </div>

        <div className="card glass stagger-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Truck size={24} />
            </div>
            <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>ON ROAD</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pengiriman Aktif</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.25rem' }}>{stats.activeDeliveries}</div>
        </div>

        <div className="card glass stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <TrendingUp size={24} />
             </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Mitra</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.25rem' }}>{stats.totalPangkalan} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mitra</span></div>
        </div>

        <div className="card glass stagger-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <div style={{ width: '48px', height: '48px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <Activity size={24} />
             </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Sistem</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.25rem', color: '#22c55e' }}>ONLINE</div>
        </div>
      </div>

      {/* DASHBOARD GRID CONTENT */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* SECTION: LIVE STOCK INVENTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div className="card glass stagger-5" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Pusat Inventory Tabung</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status stok isi di gudang agen saat ini.</p>
                 </div>
                 <Link to="/admin/stok" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8rem', borderRadius: '12px' }}>Lihat Semua</Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                 {stocks.map(branch => (
                    <div key={branch.id} style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-glass)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                          <Box size={20} color="var(--primary)" />
                          <span style={{ fontWeight: 800 }}>Cabang {branch.branchId}</span>
                       </div>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {['gas3kg', 'gas5_5kg', 'gas12kg'].map(type => {
                             const qty = branch[type]?.filled || 0;
                             const status = getStockStatus(qty);
                             return (
                                <div key={type}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{type === 'gas3kg' ? 'LPG 3kg' : (type === 'gas5_5kg' ? 'B-Gas 5.5kg' : 'LPG 12kg')}</span>
                                      <span style={{ fontWeight: 800 }}>{qty} Unit</span>
                                   </div>
                                   <div className="order-progress-container" style={{ height: '6px' }}>
                                      <div className="order-progress-bar" style={{ width: `${Math.min(100, (qty/200)*100)}%`, background: status.color }}></div>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                 ))}
                 {stocks.length === 0 && <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem', color: 'var(--text-light)' }}>Sedang memuat data stok...</div>}
              </div>
           </div>
        </div>

        {/* SECTION: LOGISTICS & ORDERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           
           {/* RECENT ORDERS */}
           <div className="card glass stagger-6" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <Clock size={22} color="var(--primary)" /> 
                 Antrean Pesanan
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {orders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Belum ada antrean pesanan.</p>
                 ) : (
                    orders.map(order => (
                       <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                          <div>
                             <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{order.pangkalanName}</div>
                             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.quantity} x {order.gasType}</div>
                          </div>
                          <div style={{ 
                             fontSize: '0.65rem', 
                             fontWeight: 900, 
                             padding: '0.3rem 0.6rem', 
                             borderRadius: '8px', 
                             background: order.status === 'menunggu' ? 'var(--primary-light)' : 'rgba(34, 197, 94, 0.1)',
                             color: order.status === 'menunggu' ? 'var(--primary)' : '#22c55e',
                             textTransform: 'uppercase'
                          }}>
                             {order.status}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* ON-ROAD SHIPPING */}
           <div className="card glass stagger-7" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <Truck size={22} color="var(--accent)" /> 
                 Armada On-Road
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {deliveries.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Tidak ada armada di jalan.</p>
                 ) : (
                    deliveries.map(ship => (
                       <div key={ship.id} style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                             <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{ship.driverName}</span>
                             <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{ship.truckPlate}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                             <span style={{ color: 'var(--text-muted)' }}>Progres Rute:</span>
                             <span style={{ fontWeight: 800 }}>{ship.completedStops} / {ship.stopCount} Drop</span>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
