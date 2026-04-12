import React from 'react';

const Logo = ({ size = 32, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(109, 40, 217, 0.3))' }}
      >
        <rect width="40" height="40" rx="12" fill="url(#logo_grad)" />
        <path
          d="M20 10V30M12 20H28M20 15L25 20L20 25L15 20L20 15Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logo_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
      <span style={{ 
        fontFamily: "'Outfit', sans-serif", 
        fontSize: '1.25rem', 
        fontWeight: 900, 
        letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textTransform: 'uppercase'
      }}>
        Agen Gas
      </span>
    </div>
  );
};

export default Logo;
