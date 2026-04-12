import React, { useEffect, useState } from 'react';
import { getStock, updateStock } from '../../services/dataService';
import { Package, Plus, Minus, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';

const AdminStock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    const data = await getStock();
    setStocks(data);
    setLoading(false);
  };

  const handleAdjust = async (id, gasType, field, delta) => {
    const stock = stocks.find(s => s.id === id);
    const currentValue = stock[gasType][field] || 0;
    const newValue = Math.max(0, currentValue + delta);
    updateValue(id, gasType, field, newValue);
  };

  const handleDirectEdit = (id, gasType, field, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    updateValue(id, gasType, field, newValue);
  };

  const updateValue = async (id, gasType, field, newValue) => {
    try {
      await updateStock(id, {
        [`${gasType}.${field}`]: newValue
      });
      setStocks(prev => prev.map(s => 
        s.id === id ? { ...s, [gasType]: { ...s[gasType], [field]: newValue } } : s
      ));
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Pusat Kontrol Stok</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau dan atur ketersediaan tabung di seluruh cabang utama.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }}></div>
              <span>Terisi</span>
           </div>
           <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#94a3b8', borderRadius: '50%' }}></div>
              <span>Kosong</span>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {stocks.map((branch) => (
          <div key={branch.id} className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
               <MapPin size={24} color="var(--primary)" />
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Cabang {branch.branchId}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
               {['gas3kg', 'gas5_5kg', 'gas12kg'].map((type) => (
                 <div key={type} style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 900, color: 'var(--text-main)', marginBottom: '1.5rem', borderBottom: '1.5px solid var(--primary-light)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                       {type === 'gas3kg' ? 'LPG 3Kg' : (type === 'gas5_5kg' ? 'Bright Gas 5.5Kg' : 'LPG 12Kg')}
                    </div>
                    
                    {['filled', 'empty', 'damaged'].map((field) => (
                      <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {field === 'filled' ? <CheckCircle2 size={16} color="#10b981" /> : (field === 'empty' ? <Package size={16} color="#94a3b8" /> : <AlertTriangle size={16} color="#ef4444" />)}
                            <span style={{ textTransform: 'capitalize', fontSize: '0.9rem', fontWeight: 600 }}>{field === 'filled' ? 'Terisi' : (field === 'empty' ? 'Kosong' : 'Rusak')}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <button 
                               onClick={() => handleAdjust(branch.id, type, field, -1)}
                               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}
                            >
                               <Minus size={14} style={{ margin: 'auto' }} />
                            </button>
                             <input 
                               type="number"
                               value={branch[type][field] || 0}
                               onChange={(e) => handleDirectEdit(branch.id, type, field, e.target.value)}
                               style={{ 
                                 background: 'transparent', 
                                 border: 'none', 
                                 fontSize: '1.1rem', 
                                 fontWeight: 900, 
                                 width: '60px', 
                                 textAlign: 'center', 
                                 color: 'var(--text-main)',
                                 outline: 'none'
                               }}
                             />
                            <button 
                               onClick={() => handleAdjust(branch.id, type, field, 1)}
                               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}
                            >
                               <Plus size={14} style={{ margin: 'auto' }} />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminStock;
