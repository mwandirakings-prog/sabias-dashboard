import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

export default function TrialBanner({ token, onLocked }) {
  const [trialData, setTrialData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const checkTrial = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/trial/status`,
        { headers: { Authorization: `Bearer ${token}` } });
      setTrialData(res.data.data);
      if (res.data.data.locked) {
        onLocked(res.data.data.message);
      }
    } catch (err) {
      console.error('Trial check error:', err);
    }
  }, [token, onLocked]);

  useEffect(() => { checkTrial(); }, [checkTrial]);

  if (!trialData) return null;
  if (trialData.locked) return null;
  if (trialData.status === 'active' && trialData.daysLeft > 3) return null;
  if (dismissed) return null;

  const isWarning = trialData.status === 'trial_warning' ||
                    trialData.status === 'sub_warning';
  const isTrial = trialData.status === 'trial';

  if (!isWarning && !isTrial) return null;

  const bg = isWarning ? '#7F1D1D' : '#1C2B4A';
  const border = isWarning ? '#E63946' : '#4CC9F0';
  const color = isWarning ? '#FCA5A5' : '#BAE6FD';
  const icon = isWarning ? '⚠️' : 'ℹ️';

  return (
    <div style={{ background: bg, border: `1px solid ${border}`,
                  borderRadius: 8, padding: '12px 20px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color, fontSize: 13, fontWeight: 'bold' }}>
          {trialData.message}
        </span>
        <span style={{ color, fontSize: 13 }}>
          Contact Kings Mwandira: +265 996 275 162
        </span>
      </div>
      {!isWarning && (
        <button onClick={() => setDismissed(true)}
          style={{ background: 'transparent', border: 'none',
                   color, cursor: 'pointer', fontSize: 18,
                   padding: '0 4px' }}>
          ✕
        </button>
      )}
    </div>
  );
}