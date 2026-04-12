import React, { useState, useEffect } from 'react';
import { getSales, getPangkalan } from '../../services/dataService';
import { 
  BarChart3, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight, 
  Store, 
  ArrowUpRight, 
  Download,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminSales = () => {
  const [sales, setSales] = useState([]);
  const [pangkalan, setPangkalan] = useState([]);
  
  // Filters
  const [filterPangkalan, setFilterPangkalan] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubSales = getSales({}, setSales);
    getPangkalan().then(setPangkalan);
    return () => unsubSales();
  }, []);

  const filteredSales = sales.filter(s => {
    const matchPangkalan = filterPangkalan === 'all' || s.pangkalanId === filterPangkalan;
    const matchSearch = (s.pangkalanName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = !filterDate || s.createdAt?.toDate().toISOString().split('T')[0] === filterDate;
    return matchPangkalan && matchSearch && matchDate;
  });

  const exportToExcel = () => {
    const dataToExport = filteredSales.map(s => {
      const pName = pangkalan.find(p => p.id === s.pangkalanId)?.name || s.pangkalanName || s.pangkalanId;
      return {
        'Waktu': s.createdAt?.toDate().toLocaleString(),
        'Nama Pangkalan': pName,
        'Jenis Gas': s.gasType.replace('gas', 'LPG '),
        'Jumlah': s.quantity,
        'Pangkalan ID': s.pangkalanId
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "Laporan_Penjualan_Konsumen.xlsx");
  };

  // Stats
  const totalSales = filteredSales.reduce((acc, curr) => acc + curr.quantity, 0);
  const pangkalanCount = new Set(filteredSales.map(s => s.pangkalanId)).size;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }} className="mobile-stack">
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Monitoring Penjualan</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Distribusi LPG dari mitra pangkalan ke konsumen (B2C).</p>
        </div>
        <button onClick={exportToExcel} className="btn btn-white" style={{ width: 'fit-content' }}>
          <Download size={18} /> Export
        </button>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Tabung Terjual</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>{totalSales} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>UNIT</span></div>
         </div>
         <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pangkalan Aktif Menjual</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>{pangkalanCount} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>MITRA</span></div>
         </div>
         <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Rata-rata Penjualan</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>{pangkalanCount ? Math.round(totalSales / pangkalanCount) : 0} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>AVG</span></div>
         </div>
         <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Efisiensi Distribusi</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>94% <ArrowUpRight size={18} color="#10b981" /></div>
         </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="mobile-stack">
            <div style={{ position: 'relative', flex: 1, width: '100%' }}>
               <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
               <input 
                  type="text" className="input-field" 
                  placeholder="Cari pangkalan..." 
                  style={{ paddingLeft: '3rem' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <div style={{ width: '100%', maxWidth: '250px' }} className="mobile-stack">
               <select 
                  className="input-field"
                  value={filterPangkalan}
                  onChange={e => setFilterPangkalan(e.target.value)}
               >
                  <option value="all">Semua Pangkalan</option>
                  {pangkalan.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
               </select>
            </div>
            <div style={{ width: '100%', maxWidth: '200px' }}>
               <input 
                  type="date" className="input-field" 
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
               />
            </div>
         </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
         <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                     <th style={{ padding: '1.5rem' }}>Pangkalan</th>
                     <th style={{ padding: '1.5rem' }}>Jenis Gas</th>
                     <th style={{ padding: '1.5rem' }}>Jumlah</th>
                     <th style={{ padding: '1.5rem' }}>Waktu Penjualan</th>
                     <th style={{ padding: '1.5rem' }}>Status</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                       <td style={{ padding: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Store size={20} />
                             </div>
                             <div>
                                <div style={{ fontWeight: 800 }}>{sale.pangkalanName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ID: {sale.pangkalanId.substring(0,6)}</div>
                             </div>
                          </div>
                       </td>
                       <td style={{ padding: '1.5rem' }}>
                          <span style={{ 
                             padding: '0.4rem 0.75rem', 
                             borderRadius: '8px', 
                             fontSize: '0.8rem', 
                             fontWeight: 700,
                             background: sale.gasType === 'gas3kg' ? 'var(--primary-light)' : 'rgba(124, 58, 237, 0.1)',
                             color: sale.gasType === 'gas3kg' ? 'var(--primary)' : 'var(--secondary)'
                          }}>
                             {sale.gasType.replace('gas', 'LPG ')}
                          </span>
                       </td>
                       <td style={{ padding: '1.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
                          {sale.quantity} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>PCS</span>
                       </td>
                       <td style={{ padding: '1.5rem', fontSize: '0.85rem' }}>
                          <div style={{ fontWeight: 600 }}>{sale.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          <div style={{ opacity: 0.6 }}>{sale.createdAt?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                       </td>
                       <td style={{ padding: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                             <ChevronRight size={14} /> Terverifikasi
                          </div>
                       </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                       <td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-light)' }}>
                          <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                          <p>Tidak ditemukan data penjualan untuk kriteria ini.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AdminSales;
