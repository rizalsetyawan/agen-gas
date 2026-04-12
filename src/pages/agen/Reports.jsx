import React from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Download, FileSpreadsheet, FileText, PieChart, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports = () => {

  const exportData = async (collectionName, fileName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => {
        const d = doc.data();
        // Convert Firebase Timestamps to readable strings
        Object.keys(d).forEach(key => {
          if (d[key]?.seconds) {
            d[key] = new Date(d[key].seconds * 1000).toLocaleString();
          }
        });
        return { id: doc.id, ...d };
      });

      if (data.length === 0) {
        alert(`Tidak ada data di koleksi ${collectionName}`);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, collectionName);
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Export Error:", error);
      alert("Gagal melakukan export data.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Pusat Laporan & Data</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ekspor data operasional ke format Excel untuk kebutuhan audit dan pembukuan.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Laporan Pesanan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Seluruh riwayat pesanan dari pangkalan mitra beserta status akhirnya.</p>
          </div>
          <button onClick={() => exportData('orders', 'Laporan_Pesanan')} className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Export Excel (.xlsx)
          </button>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Laporan Pengiriman</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data logistik mencakup Driver, Plat Nomor Truk, dan rute cabang ke pangkalan.</p>
          </div>
          <button onClick={() => exportData('deliveries', 'Laporan_Logistik')} className="btn btn-white" style={{ marginTop: 'auto', border: '1px solid #d97706', color: '#d97706' }}>
            <Download size={18} style={{ marginRight: '0.5rem' }} /> Export Excel
          </button>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#dcfce7', color: '#166534', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Laporan Stok</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rangkuman ketersediaan tabung (Terisi/Kosong/Rusak) di setiap cabang.</p>
          </div>
          <button onClick={() => exportData('stock', 'Laporan_Stok')} className="btn btn-white" style={{ marginTop: 'auto', border: '1px solid #166534', color: '#166534' }}>
            <Download size={18} style={{ marginRight: '0.5rem' }} /> Export Excel
          </button>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#f1f5f9', color: '#64748b', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Data Pangkalan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Daftar lengkap pangkalan mitra, alamat, dan nomor kontak yang terdata.</p>
          </div>
          <button onClick={() => exportData('pangkalan', 'Daftar_Pangkalan')} className="btn btn-white" style={{ marginTop: 'auto', border: '1px solid #64748b', color: '#64748b' }}>
            <Download size={18} style={{ marginRight: '0.5rem' }} /> Export Excel
          </button>
        </div>

      </div>

      <div style={{ 
        marginTop: '3rem', 
        padding: '1.5rem', 
        background: 'var(--bg-app)', 
        borderRadius: '12px', 
        border: '1px solid var(--border)', 
        color: 'var(--text-muted)', 
        fontSize: '0.85rem' 
      }}>
         <p><strong>Catatan:</strong> Data yang diekspor adalah data real-time dari server. Gunakan data ini untuk rekonsiliasi stok setiap akhir periode pengiriman.</p>
      </div>
    </div>
  );
};

export default Reports;
