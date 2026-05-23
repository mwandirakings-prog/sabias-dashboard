import React from 'react';

export default function LockedScreen({ message, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0D1117',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'Arial' }}>
      <div style={{ background: '#161B22', borderRadius: 16, padding: 48,
                    textAlign: 'center', maxWidth: 480,
                    border: '1px solid #E63946' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
        <div style={{ color: '#FFB800', fontWeight: 'bold',
                      fontSize: 28, letterSpacing: 4,
                      marginBottom: 8 }}>
          SABIAS
        </div>
        <div style={{ color: '#F0F6FC', fontWeight: 'bold',
                      fontSize: 18, marginBottom: 16 }}>
          Account Locked
        </div>
        <div style={{ color: '#8B949E', fontSize: 14, lineHeight: 1.8,
                      marginBottom: 28 }}>
          {message || 'Your trial or subscription has expired.'}
        </div>
        <div style={{ background: '#21262D', borderRadius: 12,
                      padding: 20, marginBottom: 24,
                      border: '1px solid #30363D' }}>
          <div style={{ color: '#FFB800', fontWeight: 'bold',
                        fontSize: 15, marginBottom: 12 }}>
            Contact SABIAS to Continue
          </div>
          <div style={{ color: '#F0F6FC', fontSize: 14, marginBottom: 6 }}>
            👤 Kings Mwandira
          </div>
          <div style={{ color: '#4CC9F0', fontSize: 14, marginBottom: 6 }}>
            📞 +265 996 275 162
          </div>
          <div style={{ color: '#4CC9F0', fontSize: 14, marginBottom: 6 }}>
            📧 mwandirakings@gmail.com
          </div>
          <div style={{ color: '#4CC9F0', fontSize: 14 }}>
            🌐 www.sabiasanalytics.com
          </div>
        </div>
        <div style={{ display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
                      marginBottom: 24 }}>
          {[
            { plan: 'Starter', price: 'MWK 5,000/mo' },
            { plan: 'Professional', price: 'MWK 10,000/mo' },
            { plan: 'Enterprise', price: 'MWK 50,000/mo' },
          ].map(({ plan, price }) => (
            <div key={plan} style={{ background: '#0D1117', borderRadius: 8,
                                     padding: 12,
                                     border: '1px solid #30363D' }}>
              <div style={{ color: '#FFB800', fontWeight: 'bold',
                            fontSize: 12 }}>{plan}</div>
              <div style={{ color: '#8B949E', fontSize: 11,
                            marginTop: 4 }}>{price}</div>
            </div>
          ))}
        </div>
        <button onClick={onLogout}
          style={{ background: '#21262D', border: '1px solid #30363D',
                   color: '#8B949E', padding: '10px 28px', borderRadius: 8,
                   cursor: 'pointer', fontSize: 13 }}>
          Logout
        </button>
      </div>
    </div>
  );
}