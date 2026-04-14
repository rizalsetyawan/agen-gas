import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Package, 
  LogOut, 
  PlusCircle, 
  History,
  Menu,
  X,
  Bell,
  Search,
  Truck,
  FileText,
  User as UserIcon,
  LayoutDashboard,
  TrendingUp,
  Sun,
  Moon,
  Database
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = role === 'agen' ? [
    { name: 'Dashboard', path: '/admin', icon: <BarChart3 size={20} /> },
    { name: 'Rute Planner', path: '/admin/planner', icon: <PlusCircle size={20} /> },
    { name: 'Monitoring Sales', path: '/admin/penjualan', icon: <TrendingUp size={20} /> },
    { name: 'Pengiriman', path: '/admin/pengiriman', icon: <Truck size={20} /> },
    { name: 'Pesanan', path: '/admin/pesanan', icon: <ShoppingBag size={20} /> },
    { name: 'Pangkalan', path: '/admin/pangkalan', icon: <Users size={20} /> },
    { name: 'Stok Gas', path: '/admin/stok', icon: <Package size={20} /> },
    { name: 'Laporan', path: '/admin/laporan', icon: <FileText size={20} /> },
    { name: 'Master Data', path: '/admin/database', icon: <Database size={20} /> },
  ] : [
    { name: 'Dashboard', path: '/user', icon: <LayoutDashboard size={20} /> },
    { name: 'Catat Penjualan', path: '/user/penjualan', icon: <TrendingUp size={20} /> },
    { name: 'Pesan Gas', path: '/user/pesan', icon: <ShoppingBag size={20} /> },
    { name: 'Riwayat', path: '/user/riwayat', icon: <History size={20} /> },
  ];

  return (
    <div className="dashboard-container" style={{ background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar (Premium Floating Transparent Glass) */}
      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 2rem)', 
        width: '280px',
        borderRadius: '32px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        animation: 'none',
        zIndex: 1000,
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s, margin 0.4s'
      }}>
        <div className="sidebar-logo" style={{ padding: '2rem 1.5rem', marginBottom: '1rem' }}>
          <Logo size={32} />
        </div>
        
        <nav className="nav-menu" style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem' }}>
           <div style={{ paddingLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Sistem Logistik</div>
           {navItems.map((item) => (
             <NavLink 
                key={item.path} 
                to={item.path} 
                end={item.path === '/admin' || item.path === '/user'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ borderRadius: '14px', marginBottom: '0.25rem' }}
                onClick={() => setIsSidebarOpen(false)}
             >
               {item.icon}
               <span>{item.name}</span>
             </NavLink>
           ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', padding: '1.5rem 0.75rem' }}>
           <button onClick={handleLogout} className="nav-item" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', borderRadius: '14px' }}>
              <LogOut size={20} />
              <span>Keluar</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        
        {/* Modern Header (Floating Glass) */}
        <header className="glass header-glass" style={{ 
          height: '80px', margin: '1rem', borderRadius: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem',
          zIndex: 100
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                style={{ background: 'var(--primary-light)', border: 'none', display: 'none', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer' }} 
                className="mobile-toggle"
              >
                  <Menu size={22} color="var(--primary)" />
              </button>
              <div style={{ position: 'relative', width: '320px' }} className="pc-search">
                 <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input 
                   type="text" placeholder="Cari data logistik..." 
                   className="input-field"
                   style={{ 
                     padding: '0.7rem 1rem 0.7rem 2.75rem', 
                     borderRadius: '16px', 
                     border: '1px solid var(--border-glass)', 
                     background: 'rgba(255,255,255,0.05)',
                     fontSize: '0.9rem'
                   }} 
                 />
              </div>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                style={{ 
                  background: 'var(--primary-light)', 
                  border: 'none', 
                  width: '44px', height: '44px', 
                  borderRadius: '12px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {theme === 'light' ? <Moon size={20} color="var(--primary)" /> : <Sun size={20} color="var(--primary)" />}
              </button>

              <button style={{ position: 'relative', background: 'var(--primary-light)', border: 'none', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Bell size={20} color="var(--primary)" />
                 <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid var(--bg-glass)' }}></span>
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-glass)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
                 <div style={{ textAlign: 'right' }} className="pc-only">
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user?.username || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>{role} Access</div>
                 </div>
                 <div style={{ 
                   width: '44px', height: '44px', 
                   background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                   borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                   color: 'white', flexShrink: 0,
                   boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
                 }}>
                    <UserIcon size={20} />
                 </div>
              </div>
           </div>
        </header>

        {/* Content Render Area */}
        <div className="content-area" style={{ flex: 1, overflowY: 'auto' }}>
           <div style={{ padding: '2rem', maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%' }}>
              {children}
           </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 900 }} 
        />
      )}
    </div>
  );
};

export default Layout;
