import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 5000,
    color: '#4CC9F0',
    border: '#1C2B4A',
    features: [
      'Up to 2 salespersons',
      'Sales recording and history',
      'Basic inventory management',
      'Email stock alerts',
      'Basic analytics dashboard',
    ],
    notIncluded: ['CSV export', 'Revenue forecasting', 'API access'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 10000,
    color: '#FF6B35',
    border: '#4A1A00',
    popular: true,
    features: [
      'Up to 5 salespersons',
      'Everything in Starter',
      'Advanced analytics',
      'CSV export and reports',
      '1 API key for integrations',
    ],
    notIncluded: ['Revenue forecasting', '3 API keys'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 50000,
    color: '#52B788',
    border: '#1B4332',
    features: [
      'Unlimited salespersons',
      'Everything in Professional',
      'AI revenue forecasting',
      '3 API keys for integrations',
      'Priority WhatsApp support',
      'Custom onboarding session',
    ],
    notIncluded: [],
  },
];

const MONTHS = [
  { value: 1, label: '1 Month', discount: '' },
  { value: 2, label: '2 Months', discount: '' },
  { value: 3, label: '3 Months', discount: '5% off' },
  { value: 6, label: '6 Months', discount: '10% off' },
  { value: 12, label: '12 Months', discount: '15% off' },
];

export default function SubscribePage({ token, user, onClose, dailyCount,
  dailyLimit, isFullAccess }) {

  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billingHistory, setBillingHistory] = useState([]);

  const fmt = (n) => new Intl.NumberFormat().format(n);

  const getAmount = () => {
    const plan = PLANS.find(p => p.key === selectedPlan);
    const base = plan.price * selectedMonths;
    if (selectedMonths === 3) return Math.round(base * 0.95);
    if (selectedMonths === 6) return Math.round(base * 0.90);
    if (selectedMonths === 12) return Math.round(base * 0.85);
    return base;
  };

  useEffect(() => {
    axios.get(`${API}/api/billing/history`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBillingHistory(res.data.data || []))
      .catch(() => {});
  }, [token]);

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/billing/checkout`,
        { plan: selectedPlan, months: selectedMonths },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.checkoutUrl) {
        // Redirect to OneKhusa checkout page
        window.location.href = res.data.checkoutUrl;
      } else {
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error
        || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = PLANS.find(p => p.key === selectedPlan);
  const amount = getAmount();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto', fontFamily: 'Arial'
    }}>
      <div style={{
        background: '#FFF8F0', borderRadius: 16, width: '100%',
        maxWidth: 860, maxHeight: '95vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>

        {/* Header */}
        <div style={{
          background: '#3E1F00', padding: '24px 32px',
          borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              color: '#FFB800', fontWeight: 'bold',
              fontSize: 22, letterSpacing: 3
            }}>
              SABIAS
            </div>
            <div style={{ color: '#FF6B35', fontSize: 13, marginTop: 2 }}>
              Subscribe for Unlimited Access
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', width: 36, height: 36, borderRadius: '50%',
              cursor: 'pointer', fontSize: 18, fontWeight: 'bold'
            }}>
              ×
            </button>
          )}
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Daily limit warning */}
          {!isFullAccess && (
            <div style={{
              background: '#FFF3E0', border: '1px solid #FFB800',
              borderLeft: '4px solid #FF6B35', borderRadius: 10,
              padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
            }}>
              <div>
                <div style={{
                  color: '#3E1F00', fontWeight: 'bold', fontSize: 14
                }}>
                  Limited Access — {Math.max(0, dailyLimit - dailyCount)} of{' '}
                  {dailyLimit} transactions remaining today
                </div>
                <div style={{ color: '#7A5C3A', fontSize: 12, marginTop: 4 }}>
                  Subscribe to SABIAS for unlimited daily transactions
                </div>
              </div>
              <div style={{
                background: '#FF6B35', color: 'white',
                padding: '4px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 'bold'
              }}>
                {dailyCount}/{dailyLimit} used today
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div style={{
            color: '#3E1F00', fontWeight: 'bold',
            fontSize: 16, marginBottom: 16
          }}>
            Choose Your Plan
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16, marginBottom: 24
          }}>
            {PLANS.map(plan => (
              <div key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                style={{
                  border: selectedPlan === plan.key
                    ? `2px solid ${plan.color}`
                    : '2px solid #FFE8D0',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  background: selectedPlan === plan.key
                    ? '#FFF3E0' : 'white',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}>

                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -10, right: 16,
                    background: '#FF6B35', color: 'white',
                    fontSize: 10, fontWeight: 'bold',
                    padding: '2px 10px', borderRadius: 10
                  }}>
                    POPULAR
                  </div>
                )}

                <div style={{
                  color: plan.color, fontWeight: 'bold',
                  fontSize: 15, marginBottom: 6
                }}>
                  {plan.name}
                </div>
                <div style={{
                  color: '#3E1F00', fontWeight: 'bold', fontSize: 22
                }}>
                  MWK {fmt(plan.price)}
                  <span style={{
                    color: '#888', fontSize: 12, fontWeight: 'normal'
                  }}>
                    /month
                  </span>
                </div>

                <div style={{ marginTop: 14 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start',
                      gap: 8, marginBottom: 6
                    }}>
                      <span style={{
                        color: '#52B788', fontSize: 13,
                        marginTop: 1, flexShrink: 0
                      }}>✓</span>
                      <span style={{ color: '#444', fontSize: 12 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                  {plan.notIncluded.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start',
                      gap: 8, marginBottom: 6
                    }}>
                      <span style={{
                        color: '#ccc', fontSize: 13,
                        marginTop: 1, flexShrink: 0
                      }}>✗</span>
                      <span style={{ color: '#bbb', fontSize: 12 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedPlan === plan.key && (
                  <div style={{
                    marginTop: 12, background: plan.color,
                    color: 'white', textAlign: 'center',
                    padding: '4px 0', borderRadius: 6,
                    fontSize: 12, fontWeight: 'bold'
                  }}>
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Duration Selection */}
          <div style={{
            color: '#3E1F00', fontWeight: 'bold',
            fontSize: 16, marginBottom: 14
          }}>
            Choose Duration
          </div>

          <div style={{
            display: 'flex', gap: 10,
            flexWrap: 'wrap', marginBottom: 24
          }}>
            {MONTHS.map(m => (
              <button key={m.value}
                onClick={() => setSelectedMonths(m.value)}
                style={{
                  padding: '10px 18px', borderRadius: 8,
                  border: selectedMonths === m.value
                    ? '2px solid #FF6B35' : '2px solid #FFE8D0',
                  background: selectedMonths === m.value
                    ? '#FFF3E0' : 'white',
                  color: selectedMonths === m.value
                    ? '#FF6B35' : '#7A5C3A',
                  cursor: 'pointer', fontWeight: 'bold',
                  fontSize: 13, fontFamily: 'Arial'
                }}>
                {m.label}
                {m.discount && (
                  <div style={{
                    color: '#52B788', fontSize: 10,
                    fontWeight: 'bold', marginTop: 2
                  }}>
                    {m.discount}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{
            background: '#3E1F00', borderRadius: 12,
            padding: '20px 24px', marginBottom: 20
          }}>
            <div style={{
              color: '#FFB800', fontWeight: 'bold',
              fontSize: 14, marginBottom: 14
            }}>
              Order Summary
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 8
            }}>
              <span style={{ color: '#FFE8D0', fontSize: 13 }}>
                {selectedPlanData?.name} Plan
              </span>
              <span style={{ color: 'white', fontSize: 13 }}>
                MWK {fmt(selectedPlanData?.price)} × {selectedMonths}
              </span>
            </div>
            {selectedMonths >= 3 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <span style={{ color: '#52B788', fontSize: 13 }}>
                  Discount ({selectedMonths === 3 ? '5%'
                    : selectedMonths === 6 ? '10%' : '15%'})
                </span>
                <span style={{ color: '#52B788', fontSize: 13 }}>
                  - MWK {fmt(
                    selectedPlanData.price * selectedMonths - amount
                  )}
                </span>
              </div>
            )}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.2)',
              paddingTop: 12, marginTop: 8,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                color: '#FFB800', fontWeight: 'bold', fontSize: 15
              }}>
                Total
              </span>
              <span style={{
                color: '#FFB800', fontWeight: 'bold', fontSize: 22
              }}>
                MWK {fmt(amount)}
              </span>
            </div>
            <div style={{
              color: '#FF6B35', fontSize: 11,
              marginTop: 8, textAlign: 'right'
            }}>
              Access valid for {selectedMonths} month(s) from payment date
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFEBEE', border: '1px solid #FFCDD2',
              borderRadius: 8, padding: '10px 16px',
              color: '#C62828', fontSize: 13, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {/* Pay Button */}
          <button onClick={handleCheckout} disabled={loading}
            style={{
              width: '100%', padding: '16px 0',
              background: loading ? '#ccc' : '#FF6B35',
              border: 'none', borderRadius: 10, color: 'white',
              fontWeight: 'bold', fontSize: 16, cursor: loading
                ? 'not-allowed' : 'pointer',
              fontFamily: 'Arial', transition: 'all 0.2s',
              letterSpacing: 0.5
            }}>
            {loading
              ? 'Initiating Payment...'
              : `Pay MWK ${fmt(amount)} via OneKhusa`}
          </button>

          <div style={{
            textAlign: 'center', color: '#888',
            fontSize: 11, marginTop: 10
          }}>
            You will be redirected to the secure OneKhusa checkout page
            to pay via Airtel Money, TNM Mpamba or Bank Transfer.
            Your subscription activates automatically after payment.
          </div>

          {/* Payment methods */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 16, marginTop: 14
          }}>
            {['Airtel Money', 'TNM Mpamba', 'Bank Transfer'].map(m => (
              <div key={m} style={{
                background: '#FFE8D0', borderRadius: 6,
                padding: '4px 12px', fontSize: 11,
                color: '#7A5C3A', fontWeight: 'bold'
              }}>
                {m}
              </div>
            ))}
          </div>

          {/* Billing History */}
          {billingHistory.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{
                color: '#3E1F00', fontWeight: 'bold',
                fontSize: 15, marginBottom: 12
              }}>
                Payment History
              </div>
              <div style={{
                border: '1px solid #FFE8D0', borderRadius: 10,
                overflow: 'hidden'
              }}>
                {billingHistory.map((b, i) => (
                  <div key={b.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '12px 16px',
                    background: i % 2 === 0 ? 'white' : '#FFF8F0',
                    borderBottom: i < billingHistory.length - 1
                      ? '1px solid #FFE8D0' : 'none',
                    flexWrap: 'wrap', gap: 8
                  }}>
                    <div>
                      <div style={{
                        color: '#3E1F00', fontSize: 13,
                        fontWeight: 'bold'
                      }}>
                        {b.plan?.toUpperCase()} — {b.months} Month(s)
                      </div>
                      <div style={{ color: '#888', fontSize: 11 }}>
                        Ref: {b.reference_number} ·{' '}
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 12 }}>
                      <div style={{
                        color: '#3E1F00', fontWeight: 'bold', fontSize: 13
                      }}>
                        MWK {fmt(b.amount_mwk)}
                      </div>
                      <span style={{
                        background: b.status === 'paid'
                          ? '#E8F5E9' : '#FFF3E0',
                        color: b.status === 'paid' ? '#2D6A4F' : '#E65100',
                        padding: '2px 10px', borderRadius: 10,
                        fontSize: 11, fontWeight: 'bold'
                      }}>
                        {b.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support */}
          <div style={{
            marginTop: 24, background: '#E8F5E9',
            border: '1px solid #A5D6A7', borderRadius: 10,
            padding: '12px 16px', textAlign: 'center'
          }}>
            <div style={{
              color: '#2D6A4F', fontSize: 13, fontWeight: 'bold'
            }}>
              Need help? WhatsApp us on 0996 175 162
            </div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
              sabiascustomercare@gmail.com · Same day activation guaranteed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
