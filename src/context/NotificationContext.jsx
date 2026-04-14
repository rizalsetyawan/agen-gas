import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmRequest, setConfirmRequest] = useState(null);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, removing: true } : n));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 400); 
  }, []);

  const addNotification = useCallback(({ title, message, type = 'info', duration = 3000 }) => {
    const id = Date.now();
    const newNotification = { id, title, message, type, removing: false };
    
    setNotifications((prev) => [...prev, newNotification]);

    if (duration !== Infinity) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const success = (message, title = 'Berhasil') => addNotification({ title, message, type: 'success' });
  const error = (message, title = 'Gagal') => addNotification({ title, message, type: 'error', duration: 5000 });
  const warning = (message, title = 'Peringatan') => addNotification({ title, message, type: 'warning' });
  const info = (message, title = 'Informasi') => addNotification({ title, message, type: 'info' });

  const confirm = (message, title = 'Konfirmasi Tindakan') => {
    return new Promise((resolve) => {
      setConfirmRequest({ title, message, resolve });
    });
  };

  const handleConfirmResponse = (choice) => {
    if (confirmRequest) {
      confirmRequest.resolve(choice);
      setConfirmRequest(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ success, error, warning, info, confirm }}>
      {children}
      
      {/* Informational Toast Notifications */}
      {notifications.length > 0 && (
        <>
          <div className="notification-overlay" onClick={() => removeNotification(notifications[notifications.length-1].id)} />
          <div className="toast-container">
            {notifications.slice(-1).map((n) => (
              <div key={n.id} className={`toast toast-${n.type} ${n.removing ? 'removing' : ''}`}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                   <button onClick={() => removeNotification(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', opacity: 0.5 }}>
                      <X size={20} />
                   </button>
                </div>
                <div className="toast-icon">
                  {n.type === 'success' && <CheckCircle2 size={40} />}
                  {n.type === 'error' && <AlertCircle size={40} />}
                  {n.type === 'warning' && <AlertTriangle size={40} />}
                  {n.type === 'info' && <Info size={40} />}
                </div>
                <div className="toast-content">
                  <div className="toast-title">{n.title}</div>
                  <div className="toast-message">{n.message}</div>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '16px', fontWeight: 900 }} 
                  onClick={() => removeNotification(n.id)}
                >
                  Selesai
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- CUSTOM CONFIRM MODAL --- */}
      {confirmRequest && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(30px)', 
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div className="card glass" style={{ 
             maxWidth: '450px', width: '100%', padding: '2.5rem', textAlign: 'center',
             animation: 'fadeInScale 0.4s ease-out', borderRadius: '32px'
          }}>
             <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                width: '80px', height: '80px', borderRadius: '30px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
             }}>
                <AlertTriangle size={40} />
             </div>
             
             <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem' }}>{confirmRequest.title}</h3>
             <p style={{ color: 'var(--text-muted)', fontWeight: 500, lineHeight: '1.6', marginBottom: '2rem' }}>{confirmRequest.message}</p>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  onClick={() => handleConfirmResponse(false)}
                  style={{ 
                    padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--border-glass)',
                    background: 'var(--bg-app)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleConfirmResponse(true)}
                  className="btn btn-primary"
                  style={{ padding: '1.25rem', borderRadius: '18px', fontWeight: 900 }}
                >
                  Ya, Lanjutkan
                </button>
             </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  return context;
};
