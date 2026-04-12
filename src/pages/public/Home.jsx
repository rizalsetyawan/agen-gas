import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStock, getPangkalan, getStockLabel } from '../../services/dataService';
import { 
  MapPin, 
  Phone, 
  ChevronRight, 
  LayoutDashboard, 
  Search, 
  Home as HomeIcon,
  Info,
  Layers,
  PhoneCall
} from 'lucide-react';

const Home = () => {
  const [stocks, setStocks] = useState([]);
  const [pangkalan, setPangkalan] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getStock().then(setStocks);
    getPangkalan().then(setPangkalan);
  }, []);

  const filteredPangkalan = pangkalan.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.branchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="public-wrapper">
      {/* 
         PC CONTAINER (Reference 1: Floating Rounded Container)
      */}
      <div className="home-container">
        
        {/* Navigation */}
        <nav className="nav-public">
          <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '1px' }}>AGENGAS</div>
          <ul className="nav-links">
            <li><a href="#stok">Ketersediaan Stok</a></li>
            <li><a href="#pangkalan">Cari Pangkalan</a></li>
            <li><a href="#kontak">Hubungi Kami</a></li>
          </ul>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            <LayoutDashboard size={18} />
            Portal Mitra
          </button>
        </nav>

        {/* Hero Section (Reference 1: Centered Bold Text) */}
        <section className="hero-section">
          <h1 className="hero-title">
            Distribusi LPG <br />
            Lancer & Aman!
          </h1>
          <p className="hero-subtitle">
            Penyedia energi terpercaya untuk ribuan masyarakat. Cek ketersediaan stok di cabang terdekat Anda secara real-time.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => document.getElementById('pangkalan').scrollIntoView()}>
               Cari Pangkalan Terdekat
            </button>
            <button className="btn btn-white" onClick={() => document.getElementById('stok').scrollIntoView()}>
               Lihat Info Stok
            </button>
          </div>
        </section>

        {/* Stock Dashboard (Modern Logistics Cards) */}
        <section id="stok" className="stock-grid">
           {stocks.map((s) => (
             <div key={s.id} className="stock-card">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <MapPin size={20} color="var(--primary)" />
                   Cabang {s.branchId}
                </h3>
                
                <div className="stock-item">
                   <span>LPG 3Kg</span>
                   <span style={{ color: getStockLabel(s.gas3kg?.filled).color, fontWeight: 700 }}>
                     {getStockLabel(s.gas3kg?.filled).text}
                   </span>
                </div>
                <div className="stock-item">
                   <span>Bright Gas 5.5Kg</span>
                   <span style={{ color: getStockLabel(s.gas5_5kg?.filled).color, fontWeight: 700 }}>
                     {getStockLabel(s.gas5_5kg?.filled).text}
                   </span>
                </div>
                <div className="stock-item">
                   <span>LPG 12Kg</span>
                   <span style={{ color: getStockLabel(s.gas12kg?.filled).color, fontWeight: 700 }}>
                     {getStockLabel(s.gas12kg?.filled).text}
                   </span>
                </div>
             </div>
           ))}
        </section>

        {/* Pangkalan Directory (Reference 2: Mobile/Modern Cards) */}
        <section id="pangkalan" className="pangkalan-section">
          <div className="section-header">
             <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Jaringan Mitra Pangkalan</h2>
             <div className="card" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Search size={20} color="var(--text-muted)" />
                <input 
                  type="text" placeholder="Cari berdasarkan nama atau kota..."
                  style={{ border: 'none', width: '100%', outline: 'none' }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="pangkalan-grid">
             {filteredPangkalan.map((p) => (
               <div key={p.id} className="p-card">
                  <div className="p-card-image">
                     <HomeIcon size={48} strokeWidth={1} style={{ opacity: 0.2 }} />
                  </div>
                  <div className="p-card-content">
                     <div className="p-card-branch">{p.branchId}</div>
                     <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                     <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{p.address}</p>
                     
                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <a 
                          href={`https://wa.me/${p.phone}`} target="_blank" rel="noreferrer"
                          className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}
                        >
                           WhatsApp
                        </a>
                        <a 
                          href={`https://maps.google.com/?q=${p.address}`} target="_blank" rel="noreferrer"
                          className="btn btn-white" style={{ flex: 1, fontSize: '0.8rem' }}
                        >
                           Maps
                        </a>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '4rem 3rem', background: '#f8fafc', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© 2026 Agen LPG Digital Indonesia. Berlisensi Pertamina.</p>
        </footer>

      </div>

      {/* Floating Bottom Nav for Mobile (Reference 2) */}
      <div className="mobile-nav">
         <div className="mobile-nav-item active"><HomeIcon size={20} /></div>
         <div className="mobile-nav-item" onClick={() => document.getElementById('stok').scrollIntoView()}><Layers size={20} /></div>
         <div className="mobile-nav-item" onClick={() => document.getElementById('pangkalan').scrollIntoView()}><Search size={20} /></div>
         <div className="mobile-nav-item" onClick={() => navigate('/login')}><LayoutDashboard size={20} /></div>
      </div>
    </div>
  );
};

export default Home;
