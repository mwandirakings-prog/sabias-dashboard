import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SubscribePage from './SubscribePage';

const API = 'https://api.sabiasanalytics.com';

export default function TrialBanner({ token, onLocked, user }) {
  const [status, setStatus] = useState(null);
  const [showSubscribe, setShowSubscribe] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/trial/status`,
        { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data;
      setStatus(data);

      // No longer locks — just limits to 10 tx/day
      // onLocked only called if company is completely deactivated
      if (data.active === false && onLocked) {
        onLocked('Your account has been deactivated. Contact SABIAS support.');
      }
    } catch (err) {
      console.error('Trial status error:', err.message);
    }
  }, [token, onLocked]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!status) return null;

  const { status: s, daysLeft, dailyCount,
          dailyLimit, remaining, limited } = status;

  // Active subscription or active trial with plenty of days — no banner
  if (s === 'active' && !limited) return null;
  if (s === 'trial' && daysLeft > 3) return null;

  // ── LIMITED — trial or subscription expired ───────────────
  if (limited || s === 'limited') {
    const rem = typeof remaining === 'number' ? remaining : 0;
    const used = dailyCount || 0;
    const limit = dailyLimit || 10;
    const pct = Math.min((used / limit) * 100, 100);

    return (
      <>
        <div style={{
          background: rem === 0 ? '#FFEBEE' : '#FFF3E0',
          border: `1px solid ${rem === 0 ? '#FFCDD2' : '#FFE082'}`,
          borderLeft: `4px solid ${rem === 0 ? '#E53935' : '#FF6B35'}`,
          borderRadius: 10, padding: '12px 16px',
          marginBottom: 16, fontFamily: 'Arial'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 10
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#3E1F00', fontWeight: 'bold', fontSize: 14,
                marginBottom: 4
              }}>
                {rem === 0
                  ? 'Daily transaction limit reached — resets at midnight'
                  : `Limited Access — ${rem} transaction${rem !== 1
                      ? 's' : ''} remaining today`}
              </div>

              {/* Progress bar */}
              <div style={{
                background: '#FFE8D0', borderRadius: 4,
                height: 6, marginBottom: 6, overflow: 'hidden'
              }}>
                <div style={{
                  width: `${pct}%`,
                  background: rem === 0 ? '#E53935' : '#FF6B35',
                  height: '100%', borderRadius: 4,
                  transition: 'width 0.3s ease'
                }}/>
              </div>

              <div style={{ color: '#7A5C3A', fontSize: 12 }}>
                {used} of {limit} transactions used today ·
                Subscribe for unlimited daily transactions
              </div>
            </div>

            <button onClick={() => setShowSubscribe(true)} style={{
              background: '#FF6B35', border: 'none', color: 'white',
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial',
              whiteSpace: 'nowrap'
            }}>
              Subscribe Now
            </button>
          </div>
        </div>

        {showSubscribe && (
          <SubscribePage
            token={token}
            user={user}
            onClose={() => setShowSubscribe(false)}
            dailyCount={used}
            dailyLimit={limit}
            isFullAccess={false}
          />
        )}
      </>
    );
  }

  // ── TRIAL WARNING — 1-3 days left ────────────────────────
  if (s === 'trial_warning' || (s === 'trial' && daysLeft <= 3)) {
    return (
      <>
        <div style={{
          background: '#FFF8E1',
          border: '1px solid #FFE082',
          borderLeft: '4px solid #FFB800',
          borderRadius: 10, padding: '12px 16px',
          marginBottom: 16, fontFamily: 'Arial',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <div>
            <div style={{
              color: '#3E1F00', fontWeight: 'bold',
              fontSize: 14, marginBottom: 2
            }}>
              Free trial expires in {daysLeft} day{daysLeft !== 1
                ? 's' : ''}!
            </div>
            <div style={{ color: '#7A5C3A', fontSize: 12 }}>
              After trial ends you get 10 transactions per day.
              Subscribe now for unlimited access.
            </div>
          </div>
          <button onClick={() => setShowSubscribe(true)} style={{
            background: '#FFB800', border: 'none', color: '#3E1F00',
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial',
            whiteSpace: 'nowrap'
          }}>
            Subscribe Now
          </button>
        </div>

        {showSubscribe && (
          <SubscribePage
            token={token}
            user={user}
            onClose={() => setShowSubscribe(false)}
            dailyCount={dailyCount || 0}
            dailyLimit={dailyLimit || 10}
            isFullAccess={true}
          />
        )}
      </>
    );
  }

  // ── SUBSCRIPTION WARNING — 1-3 days left ─────────────────
  if (s === 'sub_warning') {
    return (
      <>
        <div style={{
          background: '#E3F2FD',
          border: '1px solid #90CAF9',
          borderLeft: '4px solid #1565C0',
          borderRadius: 10, padding: '12px 16px',
          marginBottom: 16, fontFamily: 'Arial',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <div>
            <div style={{
              color: '#1565C0', fontWeight: 'bold',
              fontSize: 14, marginBottom: 2
            }}>
              Subscription expires in {daysLeft} day{daysLeft !== 1
                ? 's' : ''}!
            </div>
            <div style={{ color: '#555', fontSize: 12 }}>
              Renew now to keep unlimited access and avoid the
              10 transaction daily limit.
            </div>
          </div>
          <button onClick={() => setShowSubscribe(true)} style={{
            background: '#1565C0', border: 'none', color: 'white',
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 'bold', fontSize: 13, fontFamily: 'Arial',
            whiteSpace: 'nowrap'
          }}>
            Renew Now
          </button>
        </div>

        {showSubscribe && (
          <SubscribePage
            token={token}
            user={user}
            onClose={() => setShowSubscribe(false)}
            dailyCount={dailyCount || 0}
            dailyLimit={dailyLimit || 10}
            isFullAccess={true}
          />
        )}
      </>
    );
  }

  return null;
}