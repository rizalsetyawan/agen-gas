import React, { useEffect, useState } from 'react';
import { 
  getStock, 
  updateStock, 
  getAllUsers, 
  updateUserDoc, 
  getPangkalan, 
  updatePangkalanDoc,
  getAllOrders,
  updateOrderDoc,
  deleteOrder,
  getAllPangkalanStock,
  updatePangkalanStockDoc,
  sendResetEmail,
  getDeliveries,
  updateDeliveryDoc,
  deleteDelivery
} from '../../services/dataService';
import { useNotification } from '../../context/NotificationContext';
import { 
  Database, 
  Save, 
  User as UserIcon, 
  Package, 
  Users as PangkalanIcon, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Lock,
  Mail,
  Home,
  MapPin,
  Settings2,
  X,
  Search,
  ChevronRight,
  Truck
} from 'lucide-react';

const DatabaseManager = () => {
    const [stocks, setStocks] = useState([]);
    const [users, setUsers] = useState([]);
    const [pangkalan, setPangkalan] = useState([]);
    const [orders, setOrders] = useState([]);
    const [pStocks, setPStocks] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const setNotification = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [selectedPangkalan, setSelectedPangkalan] = useState(null);
    const [modalTab, setModalTab] = useState('account'); // 'account', 'stock', 'orders', 'profile'

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [s, u, p] = await Promise.all([
                getStock(),
                getAllUsers(),
                getPangkalan()
            ]);
            setStocks(s);
            setUsers(u);
            setPangkalan(p);

            getAllOrders((data) => setOrders(data));
            getDeliveries((data) => setDeliveries(data));
            const ps = await getAllPangkalanStock();
            setPStocks(ps);
        } catch (error) {
            console.error("Load Data Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const wrapSave = async (fn, successMsg) => {
        setSaving(true);
        try {
            await fn();
            setNotification.success(successMsg);
        } catch (error) {
            setNotification.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    // --- LOGIC: AGEN STOCK ---
    const handleAgenStockChange = (id, type, field, val) => {
        setStocks(prev => prev.map(s => s.id === id ? { ...s, [type]: { ...s[type], [field]: parseInt(val) || 0 } } : s));
    };
    const saveAgenStock = (id) => {
        const item = stocks.find(s => s.id === id);
        const { id: _, ...clean } = item;
        wrapSave(() => updateStock(id, clean), `Stok ${item.branchId} diperbarui.`);
    };
    const handleResetPass = (email) => {
        wrapSave(() => sendResetEmail(email), `Email pemulihan dikirim ke ${email}`);
    };

    // --- LOGIC: PANGKALAN SPECIFIC ---
    const handleUserChange = (uid, field, val) => {
        setUsers(prev => prev.map(u => u.id === uid ? { ...u, [field]: val } : u));
    };
    const saveUser = (uid) => {
        const u = users.find(x => x.id === uid);
        wrapSave(() => updateUserDoc(uid, { username: u.username, role: u.role }), "Akun diperbarui.");
    };

    const handlePStockChange = (id, type, field, val) => {
        setPStocks(prev => prev.map(s => s.id === id ? { ...s, [type]: { ...(s[type]||{filled:0,empty:0}), [field]: parseInt(val) || 0 } } : s));
    };
    const savePStock = (id) => {
        const s = pStocks.find(x => x.id === id);
        const { id: _, ...clean } = s;
        wrapSave(() => updatePangkalanStockDoc(id, clean), "Stok pangkalan diperbarui.");
    };

    const handleOrderChange = (id, field, val, sub = null) => {
        setOrders(prev => prev.map(o => {
            if (o.id === id) {
                if (sub) return { ...o, [field]: { ...o[field], [sub]: parseInt(val) || 0 } };
                return { ...o, [field]: val };
            }
            return o;
        }));
    };
    const saveOrder = (id) => {
        const o = orders.find(x => x.id === id);
        wrapSave(() => updateOrderDoc(id, { items: o.items, status: o.status }), "Pesanan diperbarui.");
    };
    const delOrder = async (id) => {
        if (await setNotification.confirm("Hapus pesanan permanen?", "Konfirmasi Hapus")) {
            wrapSave(() => deleteOrder(id), "Pesanan dihapus!");
        }
    };

    const handleProfileChange = (id, field, val) => {
        setPangkalan(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };
    const saveProfile = (id) => {
        const p = pangkalan.find(x => x.id === id);
        const { id: _, userId, ...clean } = p;
        wrapSave(() => updatePangkalanDoc(id, clean), "Profil mitra diperbarui.");
    };

    const handleShipmentChange = (id, field, val) => {
        setDeliveries(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
    };
    const saveShipment = (id) => {
        const d = deliveries.find(x => x.id === id);
        wrapSave(() => updateDeliveryDoc(id, { 
            driverName: d.driverName || '', 
            truckNumber: d.truckNumber || '', 
            status: d.status || 'berjalan',
            currentLocation: d.currentLocation || ''
        }), "Data Pengiriman diperbarui.");
    };
    const delShipment = async (id) => {
        if (await setNotification.confirm("Hapus rute pengiriman permanen? (Data perhentian terkait akan ikut terhapus)", "Konfirmasi Hapus Rute")) {
            wrapSave(() => deleteDelivery(id), "Pengiriman dihapus!");
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}><RefreshCw className="spin" /></div>;

    const filteredPangkalan = pangkalan.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.branchId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Database size={36} color="var(--primary)" />
                    Pusat Basis Data Utama
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Kelola basis data sitem secara menyeluruh per pangkalan mitra.</p>
            </div>

            {/* --- SECTION: AGEN STOCKS --- */}
            <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Package size={24} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.5rem' }}>Stok Gudang Agen (Pusat)</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {stocks.map(s => (
                        <div key={s.id} className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Cabang {s.branchId}</div>
                                <button className="btn btn-primary" onClick={() => saveAgenStock(s.id)} disabled={saving} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                    <Save size={14} /> Simpan
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                {['gas3kg', 'gas5_5kg', 'gas12kg'].map(type => (
                                    <div key={type} style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>{type.replace('gas','').replace('_','.')}KG</div>
                                        {['filled', 'empty', 'damaged'].map(f => (
                                            <div key={f} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.4rem' }}>
                                                <span style={{ fontSize: '0.65rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{f}</span>
                                                <input type="number" className="input-field" style={{ padding: '0.2rem', fontSize: '0.8rem', textAlign: 'center' }}
                                                    value={s[type][f] || 0} onChange={(e) => handleAgenStockChange(s.id, type, f, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            {/* --- SECTION: GLOBAL SHIPMENTS --- */}
            <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Truck size={24} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.5rem' }}>Manajemen Pengiriman Global</h2>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: 'var(--bg-app)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Info Armada / ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Lokasi Terakhir</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(d => (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input type="text" className="input-field" style={{ padding: '0.2rem', fontSize: '0.8rem', fontWeight: 800 }} 
                                                    value={d.truckNumber} onChange={(e) => handleShipmentChange(d.id, 'truckNumber', e.target.value)} placeholder="Plat Nomor" />
                                                <input type="text" className="input-field" style={{ padding: '0.2rem', fontSize: '0.8rem' }} 
                                                    value={d.driverName} onChange={(e) => handleShipmentChange(d.id, 'driverName', e.target.value)} placeholder="Supir" />
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {d.id}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select value={d.status} onChange={(e) => handleShipmentChange(d.id, 'status', e.target.value)} className="input-field" style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                                            <option value="berjalan">Berjalan</option>
                                            <option value="selesai">Selesai</option>
                                            <option value="batal">Batal</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                                            {d.currentLocation || 'Gudang Agen'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button className="btn btn-primary" onClick={() => saveShipment(d.id)} style={{ padding: '0.4rem' }}><Save size={16} /></button>
                                            <button onClick={() => delShipment(d.id)} style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {deliveries.length === 0 && (
                                <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada rute pengiriman aktif.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* --- SECTION: PANGKALAN LIST --- */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PangkalanIcon size={24} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.5rem' }}>Manajemen Data Mitra Pangkalan</h2>
                    </div>
                    <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '300px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input type="text" placeholder="Cari pangkalan..." className="input-field" style={{ border: 'none', background: 'transparent', padding: 0 }}
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--bg-app)' }}>
                            <tr>
                                <th style={{ padding: '1.25rem', textAlign: 'left' }}>Pangkalan</th>
                                <th style={{ padding: '1.25rem', textAlign: 'left' }}>Wilayah</th>
                                <th style={{ padding: '1.25rem', textAlign: 'left' }}>Kontak</th>
                                <th style={{ padding: '1.25rem', textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPangkalan.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {p.id}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span className="badge badge-diproses">{p.branchId}</span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>{p.phone}</td>
                                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => setSelectedPangkalan(p)}
                                            className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                                            <Settings2 size={16} /> Kelola Database
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* --- PANEL KONTROL MITRA (MODAL) --- */}
            {selectedPangkalan && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                        {/* Header Modal */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)', color: 'white' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Database: {selectedPangkalan.name}</h2>
                                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>ID Mitra: {selectedPangkalan.id}</p>
                            </div>
                            <button onClick={() => setSelectedPangkalan(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
                            {[
                                { id: 'account', icon: <UserIcon size={16} />, label: 'Akun' },
                                { id: 'stock', icon: <Package size={16} />, label: 'Stok' },
                                { id: 'orders', icon: <ShoppingBag size={16} />, label: 'Pesanan' },
                                { id: 'profile', icon: <MapPin size={16} />, label: 'Profil' }
                            ].map(t => (
                                <button key={t.id} onClick={() => setModalTab(t.id)} 
                                        style={{ border:'none', padding:'0.5rem 1rem', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.4rem', background: modalTab === t.id ? 'var(--primary)' : 'transparent', color: modalTab === t.id ? 'white' : 'var(--text-muted)' }}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '2rem' }}>
                            {/* TAB: ACCOUNT */}
                            {modalTab === 'account' && (
                                <div>
                                    {users.filter(u => u.pangkalanId === selectedPangkalan.id).map(u => (
                                        <div key={u.id} className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) minmax(150px, 120px)', gap: '1.5rem', marginBottom: '2rem' }}>
                                                <div>
                                                    <label className="input-label">Username</label>
                                                    <input value={u.username} onChange={(e) => handleUserChange(u.id, 'username', e.target.value)} className="input-field" />
                                                </div>
                                                <div>
                                                    <label className="input-label">Password (Sistem)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                        <input 
                                                            value={u.password || '••••••'} 
                                                            onChange={(e) => handleUserChange(u.id, 'password', e.target.value)} 
                                                            className="input-field" 
                                                            style={{ paddingLeft: '2.5rem' }} 
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="input-label">Role</label>
                                                    <select value={u.role} onChange={(e) => handleUserChange(u.id, 'role', e.target.value)} className="input-field">
                                                        <option value="pangkalan">Pangkalan</option>
                                                        <option value="agen">Agen</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Mail size={14} /> {u.email}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                        Gunakan tombol reset untuk memaksa perubahan sandi lewat email resmi.
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button onClick={() => handleResetPass(u.email)} className="btn" style={{ background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '0.8rem' }}>
                                                       Girim Link Reset
                                                    </button>
                                                    <button className="btn btn-primary" onClick={() => {
                                                        const userToSave = users.find(x => x.id === u.id);
                                                        wrapSave(() => updateUserDoc(u.id, { 
                                                            username: userToSave.username, 
                                                            role: userToSave.role,
                                                            password: userToSave.password 
                                                        }), "Data Login diperbarui!");
                                                    }} disabled={saving} style={{ fontSize: '0.8rem' }}>
                                                        <Save size={16} /> Simpan Akun
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: STOCK */}
                            {modalTab === 'stock' && (
                                <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                        <h3 style={{ fontWeight: 800 }}>Koreksi Saldo Stok Mitra</h3>
                                        <button className="btn btn-primary" onClick={() => savePStock(selectedPangkalan.id)} disabled={saving}>
                                            <Save size={18} /> Simpan Perubahan Stok
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                        {['gas3kg', 'gas5_5kg', 'gas12kg'].map(type => {
                                            const ps = pStocks.find(s => s.id === selectedPangkalan.id) || {};
                                            return (
                                                <div key={type} style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '16px' }}>
                                                    <div style={{ fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary)' }}>{type.replace('gas','').replace('_','.')}KG</div>
                                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TABUNG TERISI</span>
                                                            <input type="number" className="input-field" style={{ textAlign: 'center' }} 
                                                                value={ps[type]?.filled || 0} onChange={(e) => handlePStockChange(selectedPangkalan.id, type, 'filled', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TABUNG KOSONG</span>
                                                            <input type="number" className="input-field" style={{ textAlign: 'center' }} 
                                                                value={ps[type]?.empty || 0} onChange={(e) => handlePStockChange(selectedPangkalan.id, type, 'empty', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TAB: ORDERS */}
                            {modalTab === 'orders' && (
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead style={{ background: 'var(--bg-app)' }}>
                                            <tr>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Waktu / ID</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                                <th style={{ padding: '1rem' }}>Items (3|5.5|12)</th>
                                                <th style={{ padding: '1rem' }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.filter(o => o.pangkalanId === selectedPangkalan.id).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).map(o => (
                                                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 800 }}>{o.createdAt ? new Date(o.createdAt.seconds*1000).toLocaleDateString() : 'Baru'}</div>
                                                        <div style={{ fontSize: '0.65rem' }}>{o.id}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <select value={o.status} onChange={(e) => handleOrderChange(o.id, 'status', e.target.value)} className="input-field" style={{ padding: '0.25rem' }}>
                                                            <option value="menunggu">Menunggu</option>
                                                            <option value="diproses">Proses Muat</option>
                                                            <option value="dikirim">Di Jalan</option>
                                                            <option value="selesai">Selesai</option>
                                                            <option value="batal">Batal</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                            <input type="number" className="input-field" style={{width:'50px', padding:'0.2rem', textAlign:'center'}} value={o.items?.['3kg'] || 0} onChange={(e)=>handleOrderChange(o.id, 'items', e.target.value, '3kg')} />
                                                            <input type="number" className="input-field" style={{width:'50px', padding:'0.2rem', textAlign:'center'}} value={o.items?.['5.5kg'] || 0} onChange={(e)=>handleOrderChange(o.id, 'items', e.target.value, '5.5kg')} />
                                                            <input type="number" className="input-field" style={{width:'50px', padding:'0.2rem', textAlign:'center'}} value={o.items?.['12kg'] || 0} onChange={(e)=>handleOrderChange(o.id, 'items', e.target.value, '12kg')} />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-primary" onClick={() => saveOrder(o.id)} style={{ padding: '0.4rem' }}><Save size={14} /></button>
                                                            <button onClick={() => delOrder(o.id)} style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.filter(o => o.pangkalanId === selectedPangkalan.id).length === 0 && (
                                                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada pesanan.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB: PROFILE */}
                            {modalTab === 'profile' && (
                                <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <label className="input-label">Nama Pangkalan</label>
                                            <input value={selectedPangkalan.name} onChange={(e) => handleProfileChange(selectedPangkalan.id, 'name', e.target.value)} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="input-label">Wilayah Cabang</label>
                                            <select value={selectedPangkalan.branchId} onChange={(e) => handleProfileChange(selectedPangkalan.id, 'branchId', e.target.value)} className="input-field">
                                                <option>Madiun</option>
                                                <option>Nganjuk</option>
                                                <option>Ponorogo</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="input-label">No. WhatsApp</label>
                                        <input value={selectedPangkalan.phone} onChange={(e) => handleProfileChange(selectedPangkalan.id, 'phone', e.target.value)} className="input-field" />
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label className="input-label">Alamat Lengkap</label>
                                        <textarea value={selectedPangkalan.address} onChange={(e) => handleProfileChange(selectedPangkalan.id, 'address', e.target.value)} className="input-field" style={{ height: '80px' }} />
                                    </div>
                                    <button className="btn btn-primary" onClick={() => saveProfile(selectedPangkalan.id)} disabled={saving} style={{ width: '100%', padding: '1rem' }}>
                                        <Save size={20} /> Simpan Perubahan Profil
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', display: 'flex', gap: '1rem' }}>
                <AlertCircle color="#d97706" />
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                    <strong>Master Control Aktif:</strong> Gunakan menu kelola untuk memperbaiki data sitem yang tidak sinkron per mitra. Pastikan untuk menyimpan setiap perubahan di masing-masing tab.
                </div>
            </div>
        </div>
    );
};

export default DatabaseManager;
