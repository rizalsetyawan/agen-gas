import React, { useEffect, useState } from 'react';
import { getPangkalan, registerPangkalanAccount } from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { Users, Plus, Search, MapPin, Phone, ExternalLink, X, Lock, User as UserIcon } from 'lucide-react';

const AdminPangkalan = () => {
  const [pangkalan, setPangkalan] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const setNotification = useNotification();

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    address: '',
    phone: '',
    branchId: 'Madiun'
  });

  useEffect(() => {
    fetchPangkalan();
  }, []);

  const fetchPangkalan = () => {
    getPangkalan().then(data => setPangkalan(data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        branchId: formData.branchId
      };
      await registerPangkalanAccount(formData.username, formData.password, pData);
      setNotification.success("Akun Pangkalan berhasil dibuat!");
      setShowModal(false);
      setFormData({ username: '', password: '', name: '', address: '', phone: '', branchId: 'Madiun' });
      fetchPangkalan();
    } catch (err) {
      setNotification.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pangkalan.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.branchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }} className="mobile-stack">
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Manajemen Pangkalan</h1>
          <p style={{ color: 'var(--text-muted)' }}>Melihat dan mendaftarkan mitra baru</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ width: 'fit-content' }}>
          <Plus size={18} />
          Daftar Mitra
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search size={20} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Cari nama pangkalan atau cabang..." 
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', background: 'transparent', color: 'var(--text-main)' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((p) => (
          <div key={p.id} className="card" style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                <span className="badge badge-diproses" style={{ fontSize: '0.7rem' }}>{p.branchId}</span>
             </div>
             
             <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--primary)" />
                {p.name}
             </h3>

             <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                   <MapPin size={16} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                   <span>{p.address}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                   <Phone size={16} color="var(--text-muted)" />
                   <span>{p.phone}</span>
                </div>
             </div>

             <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                   <ExternalLink size={14} /> Lihat Detail
                </button>
             </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
             <p>Tidak ada pangkalan yang ditemukan.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '95vh', overflowY: 'auto', padding: 'clamp(1.5rem, 5vw, 3rem)', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daftar Mitra</h2>
               <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-glass)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}>
                  <X size={20} color="var(--text-muted)" />
               </button>
            </div>

            <form onSubmit={handleSubmit}>
               <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Username</label>
                    <div style={{ position: 'relative' }}>
                       <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                       <input 
                         type="text" className="input-field" style={{ paddingLeft: '2.5rem' }}
                         placeholder="pangkalan_mitra" value={formData.username}
                         onChange={(e) => setFormData({...formData, username: e.target.value})}
                         required 
                       />
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Initial Password</label>
                    <div style={{ position: 'relative' }}>
                       <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                       <input 
                         type="password" className="input-field" style={{ paddingLeft: '2.5rem' }}
                         placeholder="••••••••" value={formData.password}
                         onChange={(e) => setFormData({...formData, password: e.target.value})}
                         required 
                       />
                    </div>
                  </div>
               </div>

               <div className="input-group">
                    <label className="input-label">Nama Pangkalan</label>
                    <input 
                      type="text" className="input-field" 
                      placeholder="Contoh: Pangkalan Berkah Jaya" value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
               </div>

               <div className="input-group">
                    <label className="input-label">Alamat Lengkap</label>
                    <textarea 
                      className="input-field" style={{ height: '100px', resize: 'none', lineHeight: '1.6' }}
                      placeholder="Masukkan alamat lengkap pangkalan..." value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required 
                    />
               </div>

               <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">No. WhatsApp</label>
                    <input 
                      type="text" className="input-field" 
                      placeholder="0812..." value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Wilayah Cabang</label>
                    <select 
                      className="input-field" value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                    >
                       <option>Madiun</option>
                       <option>Nganjuk</option>
                       <option>Ponorogo</option>
                    </select>
                  </div>
               </div>

               <button 
                 type="submit" className="btn btn-primary" 
                 style={{ width: '100%', padding: '1.25rem', fontSize: '1rem', borderRadius: '16px' }}
                 disabled={loading}
               >
                 {loading ? 'Memproses Registrasi...' : 'Daftarkan Akun Mitra'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPangkalan;
