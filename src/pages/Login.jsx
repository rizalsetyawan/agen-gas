import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Mail, Lock, LogIn, AlertCircle, ChevronRight, Database } from 'lucide-react';
import { seedInitialData } from '../services/dataService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { user, role } = await login(username, password);
      // Success is handled by RootRoute in App.jsx but we can redirect here too
      if (role === 'agen') navigate('/admin');
      else navigate('/user');
    } catch (err) {
      setError(err.message || 'Gagal masuk. Cek kembali username & password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-login)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blobs */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--primary-light)', filter: 'blur(100px)', opacity: 0.5, borderRadius: '50%', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%', zIndex: 0 }}></div>

      <div className="glass" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '3.5rem 3rem', 
        borderRadius: '32px',
        position: 'relative',
        zIndex: 10,
        animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)',
        border: '1px solid var(--border-glass)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <Logo size={42} className="stagger-1" style={{ justifyContent: 'center', marginBottom: '1.5rem' }} />
          <h2 className="stagger-2" style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', background: 'linear-gradient(135deg, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Selamat Datang
          </h2>
          <p className="stagger-2" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            Silakan masuk ke portal manajemen logistik.
          </p>
        </div>

        {error && (
          <div className="stagger-3" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            padding: '1rem', 
            borderRadius: '16px', 
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group stagger-3">
            <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>USERNAME MITRA</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: '3rem', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
          </div>

          <div className="input-group stagger-4">
            <label className="input-label" style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>KATA SANDI</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '3rem', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', marginTop: '1rem', padding: '1.25rem', 
              fontSize: '1rem', background: 'white', color: '#0f172a', fontWeight: 800,
              borderRadius: '18px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
            disabled={loading}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
          </button>
        </form>

          <button 
            onClick={() => {
              if(window.confirm("Ingin melakukan inisialisasi ulang database and admin?")) {
                seedInitialData();
              }
            }}
            style={{ 
              background: 'transparent', 
              color: 'var(--text-light)', 
              fontSize: '0.65rem', 
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              width: '100%',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 800,
              opacity: 0.5
            }}
          >
            <Database size={11} /> Reset System Data
          </button>
      </div>
    </div>
  );
};

export default Login;
