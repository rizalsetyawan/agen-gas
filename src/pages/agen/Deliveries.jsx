import React, { useEffect, useState } from 'react';
import { getDeliveries, getDeliveryStops } from '../../services/dataService';
import { Truck, MapPin, Calendar, Hash, UserCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const DeliveryCard = ({ delivery }) => {
  const [stops, setStops] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = getDeliveryStops(delivery.id, setStops);
    return () => unsubscribe();
  }, [delivery.id]);

  const completedCount = stops.filter(s => s.status === 'selesai').length;
  const progress = stops.length > 0 ? (completedCount / stops.length) * 100 : 0;

  const getProgressColor = (p) => {
    if (p === 100) return '#10b981';
    if (p > 0) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="order-card" style={{ padding: 'clamp(1.25rem, 5vw, 2.5rem)', background: 'var(--bg-card)' }}>
      <div className="status-percentage" style={{ 
        color: getProgressColor(progress),
        fontSize: 'clamp(1rem, 4vw, 1.25rem)',
        opacity: progress > 0 ? 1 : 0.6
      }}>{Math.round(progress)}%</div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
               background: 'var(--primary-light)', 
               color: 'var(--primary)', 
               padding: '0.6rem', 
               borderRadius: '12px' 
            }} className="mobile-hide">
               <Truck size={24} />
            </div>
            <div>
               <div style={{ fontWeight: 800, fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>{delivery.truckNumber} • {delivery.driverName}</div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} /> 
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {delivery.createdAt?.toDate().toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
            </div>
          </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Progres Rute: {completedCount}/{stops.length} Pangkalan</span>
            <span style={{ color: getProgressColor(progress) }}>{delivery.status.toUpperCase()}</span>
         </div>
         <div className="order-progress-container" style={{ height: '10px' }}>
            <div 
               className="order-progress-bar" 
               style={{ 
                  width: `${progress}%`, 
                  background: getProgressColor(progress),
                  boxShadow: `0 0 10px ${getProgressColor(progress)}44`
               }}
            ></div>
         </div>
      </div>

      <button 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          width: '100%', 
          background: 'var(--bg-app)', 
          border: '1px solid var(--border-glass)', 
          borderRadius: '12px', 
          padding: '0.75rem', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          fontWeight: 600, 
          color: 'var(--text-main)', 
          transition: 'var(--transition)'
        }}
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {expanded ? 'Sembunyikan Detail Rute' : 'Lihat Detail Perhentian'}
      </button>

      {expanded && (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
           {stops.map((stop, idx) => (
             <div key={stop.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'var(--bg-app)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: stop.status === 'selesai' ? 'var(--primary-light)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stop.status === 'selesai' ? 'var(--primary)' : 'var(--text-light)' }}>
                   {stop.status === 'selesai' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{stop.pangkalanName}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stop.gasType} • Rencana: {stop.plannedQty} unit</div>
                </div>
                {stop.status === 'selesai' && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{stop.actualQty} Diterima</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Selesai pada {stop.confirmedAt?.toDate().toLocaleTimeString()}</div>
                  </div>
                )}
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

const AdminDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    const unsubscribe = getDeliveries((data) => {
      setDeliveries(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Monitoring Armada</h1>
        <p style={{ color: 'var(--text-muted)' }}>Lacak pergerakan truk dan progres pengiriman ke setiap mitra pangkalan.</p>
      </div>

      <div className="responsive-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem' 
      }}>
        {deliveries.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
             <Truck size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
             <p>Belum ada rute pengiriman aktif hari ini.</p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDeliveries;
