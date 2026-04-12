import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByPangkalan } from '../../services/dataService';
import { History, ShoppingBag, Clock, CheckCircle2, Truck } from 'lucide-react';

const UserHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user?.pangkalanId) {
      const unsubscribe = getOrdersByPangkalan(user.pangkalanId, setOrders);
      return () => unsubscribe();
    }
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'menunggu': return { bg: 'var(--primary-light)', color: 'var(--primary)', icon: <Clock size={16} /> };
      case 'diproses': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', icon: <ShoppingBag size={16} /> };
      case 'dikirim': return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', icon: <Truck size={16} /> };
      case 'selesai': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', icon: <CheckCircle2 size={16} /> };
      default: return { bg: 'var(--bg-app)', color: 'var(--text-muted)', icon: <Clock size={16} /> };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Riwayat Pesanan</h1>
        <p style={{ color: 'var(--text-muted)' }}>Pantau status dan riwayat distribusi gas ke pangkalan Anda.</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
               <th style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)' }}>TANGGAL</th>
               <th style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)' }}>JENIS GAS</th>
               <th style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)' }}>JUMLAH</th>
               <th style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)' }}>STATUS</th>
               <th style={{ padding: '1.25rem 2rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)' }}>CABANG</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
               <tr>
                  <td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                     <History size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                     <p>Belum ada riwayat pesanan.</p>
                  </td>
               </tr>
            ) : (
              orders.map((order) => {
                const style = getStatusStyle(order.status);
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 2rem', fontSize: '0.9rem' }}>
                       {order.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>{order.gasType === '3kg' ? 'LPG 3kg' : (order.gasType === '5.5kg' ? 'B-Gas 5.5kg' : 'LPG 12kg')}</td>
                    <td style={{ padding: '1.25rem 2rem' }}>{order.quantity} Tabung</td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                       <div style={{ 
                          background: style.bg, 
                          color: style.color, 
                          padding: '0.4rem 1rem', 
                          borderRadius: '100px', 
                          fontSize: '0.75rem', 
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textTransform: 'uppercase'
                       }}>
                          {style.icon}
                          {order.status}
                       </div>
                    </td>
                    <td style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.branchId}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
       </div>
      </div>
    </div>
  );
};

export default UserHistory;
