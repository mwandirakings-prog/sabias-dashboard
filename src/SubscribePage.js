import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://api.sabiasanalytics.com';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 5000,
    daily_limit: 10,
    users: 1,
    color: '#4CC9F0',
    border: '#1C2B4A',
    features: [
      '10 transactions per day',
      'POS Access',
      'Offline Mode',
      'Inventory Management',
      'Basic Dashboard',
      'Basic KPI Analytics',
      '1 Admin + 1 Salesperson',
      'Unlimited Viewers',
      'Email Support'
    ],
    notIncluded: [
      'Barcode Scanner',
      'QR Receipts',
      'Full Analytics',
      'Forecasting',
      'Loyalty Program',
      'Branch Reports',
      'Till Reports',
      'Reconciliation',
      'Multi-Till Dashboard',
      'API Access'
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 10000,
    daily_limit: 'Unlimited',
    users: 2,
    color: '#FF6B35',
    border: '#4A1A00',
    popular: true,
    features: [
      'Unlimited transactions',
      'Full POS Access',
      'Offline Mode',
      'Inventory Management',
      'Barcode Scanner',
      'QR Receipts',
      'Full Analytics',
      'Category & Region Analytics',
      'Product Performance',
      'Salesperson Performance',
      'CSV/PDF Reports Export',
      '2 Admins + 2 Salespersons',
      'Unlimited Viewers',
      'Email + WhatsApp Support'
    ],
    notIncluded: [
      'Loyalty Program',
      'Branch Reports',
      'Till Reports',
      'Reconciliation',
      'Multi-Till Dashboard',
      'Advanced Analytics',
      'Forecasting',
      'API Access'
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 50000,
    daily_limit: 'Unlimited',
    users: '10+',
    color: '#52B788',
    border: '#1B4332',
    features: [
      'Unlimited transactions',
      'Full POS Access',
      'Offline Mode',
      'Inventory Management',
      'Barcode Scanner',
      'QR Receipts',
      'Loyalty Program',
      'Branch Reports',
      'Till Reports',
      'Reconciliation',
      'Multi-Till Dashboard',
      'Advanced Analytics',
      'Customer Analytics',
      'Loyalty Analytics',
      'Advanced Forecasting',
      'Stock Forecasting',
      'Seasonal Trends',
      'Demand Prediction',
      '10+ Admins + 10+ Salespersons',
      'Unlimited Viewers',
      'API Access',
      'Priority Support'
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
  
  // CtechPay states
  const [showCtechPayOptions, setShowCtechPayOptions] = useState(false);
  const [ctechPayMethod, setCtechPayMethod] = useState(null);
  const [ctechPayPhone, setCtechPayPhone] = useState('');
  const [ctechPayPhoneInput, setCtechPayPhoneInput] = useState(false);
  const [ctechPayError, setCtechPayError] = useState('');
  const [pollingStatus, setPollingStatus] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

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

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const startPolling = (trans_id, reference) => {
    let attempts = 0;
    const maxAttempts = 18;
    
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axios.get(
          `${API}/api/billing/ctechpay/status/${trans_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.data.success && res.data.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          setPollingStatus({
            completed: true,
            message: 'Payment successful! Your subscription is now active.'
          });
          setTimeout(() => {
            if (onClose) onClose();
            window.location.reload();
          }, 3000);
        } else if (res.data.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setPollingStatus({
            failed: true,
            message: 'Payment failed. Please try again.'
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollingInterval(null);
        setPollingStatus({
          timeout: true,
          message: 'Payment is taking longer than expected. Please check your phone or contact support.'
        });
      }
    }, 5000);
    
    setPollingInterval(interval);
  };

  const handleCheckout = async (gateway) => {
    setLoading(true);
    setError('');
    
    try {
      const payload = { 
        plan: selectedPlan, 
        months: selectedMonths
      };
      
      const res = await axios.post(`${API}/api/billing/checkout`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCtechPayCheckout = async (paymentMethod, phone) => {
    setLoading(true);
    setError('');
    setCtechPayError('');
    
    try {
      const payload = {
        plan: selectedPlan,
        months: selectedMonths,
        payment_method: paymentMethod
      };
      
      if (phone) {
        payload.phone = phone;
      }
      
      const res = await axios.post(`${API}/api/billing/ctechpay/checkout`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        if (res.data.checkoutUrl) {
          // Card payment - redirect to hosted page
          window.location.href = res.data.checkoutUrl;
        } else if (res.data.trans_id) {
          // Mobile money - start polling
          setShowCtechPayOptions(false);
          setPollingStatus({
            trans_id: res.data.trans_id,
            reference: res.data.reference,
            message: res.data.message || 'Payment initiated. Please approve on your phone.'
          });
          startPolling(res.data.trans_id, res.data.reference);
        } else if (res.data.bank_details) {
          // Bank transfer - show details
          setShowCtechPayOptions(false);
          setPollingStatus({
            bank_details: res.data.bank_details,
            message: 'Please complete bank transfer'
          });
        }
      } else {
        setError('Failed to initiate CtechPay payment. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'CtechPay payment failed. Please try again.');
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

                <div style={{
                  marginTop: 6,
                  background: '#FFF8F0',
                  border: '1px solid #FFE8D0',
                  borderRadius: 6,
                  padding: '4px 10px',
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#3E1F00'
                }}>
                   {plan.daily_limit} transactions/day
                </div>

                <div style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: '#888'
                }}>
                  {plan.users} user{plan.users !== 1 ? 's' : ''}
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

          {/* Payment Options - Two separate methods */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: 14, marginBottom: 20
          }}>
            
            {/* Option 1: OneKhusa (Existing) */}
            <div style={{
              border: '2px solid #FF6B35',
              borderRadius: 12,
              padding: '16px 20px',
              background: '#FFF8F0'
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 10
              }}>
                <div>
                  <div style={{
                    color: '#FF6B35', fontWeight: 'bold', fontSize: 15
                  }}>
                    Pay via OneKhusa
                  </div>
                  <div style={{
                    color: '#888', fontSize: 12, marginTop: 4
                  }}>
                    Airtel Money · TNM Mpamba · Bank Transfer
                  </div>
                </div>
                <button
                  onClick={() => handleCheckout('onekhusa')}
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    background: loading ? '#ccc' : '#FF6B35',
                    border: 'none', borderRadius: 6,
                    color: 'white', fontWeight: 'bold', fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Arial'
                  }}
                >
                  Pay MWK {fmt(amount)}
                </button>
              </div>
            </div>

            {/* Option 2: CtechPay (New) */}
            <div style={{
              border: '2px solid #52B788',
              borderRadius: 12,
              padding: '16px 20px',
              background: '#F5FFF8'
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 10
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#2D6A4F', fontWeight: 'bold', fontSize: 15
                  }}>
                    Pay via CtechPay
                    <span style={{
                      background: '#52B788',
                      color: 'white',
                      fontSize: 9,
                      padding: '2px 10px',
                      borderRadius: 10,
                      marginLeft: 8
                    }}>
                      NEW
                    </span>
                  </div>
                  <div style={{
                    color: '#888', fontSize: 12, marginTop: 4
                  }}>
                    Credit/Debit Card · Airtel Money · TNM Mpamba · Bank Transfer
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCtechPayOptions(!showCtechPayOptions);
                    setCtechPayError('');
                  }}
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    background: loading ? '#ccc' : '#2D6A4F',
                    border: 'none', borderRadius: 6,
                    color: 'white', fontWeight: 'bold', fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Arial'
                  }}
                >
                  {showCtechPayOptions ? 'Hide Options' : `Pay MWK ${fmt(amount)}`}
                </button>
              </div>

              {/* CtechPay Payment Method Selection */}
              {showCtechPayOptions && (
                <div style={{
                  marginTop: 16,
                  padding: '16px 20px',
                  background: 'white',
                  border: '1px solid #A5D6A7',
                  borderRadius: 10
                }}>
                  <div style={{
                    color: '#3E1F00', fontWeight: 'bold',
                    fontSize: 14, marginBottom: 12
                  }}>
                    Select CtechPay Payment Method
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 10
                  }}>
                    <button
                      onClick={() => handleCtechPayCheckout('card')}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: '1px solid #A5D6A7',
                        background: '#F5FFF8',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        fontFamily: 'Arial'
                      }}
                    >
                      <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 13 }}>
                        Credit/Debit Card
                      </div>
                      <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                        Visa · Mastercard
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setCtechPayPhoneInput(true);
                        setCtechPayMethod('airtel');
                        setCtechPayError('');
                      }}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: '1px solid #A5D6A7',
                        background: '#F5FFF8',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        fontFamily: 'Arial'
                      }}
                    >
                      <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 13 }}>
                        Airtel Money
                      </div>
                      <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                        Mobile Money
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setCtechPayPhoneInput(true);
                        setCtechPayMethod('tnm');
                        setCtechPayError('');
                      }}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: '1px solid #A5D6A7',
                        background: '#F5FFF8',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        fontFamily: 'Arial'
                      }}
                    >
                      <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 13 }}>
                        TNM Mpamba
                      </div>
                      <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                        Mobile Money
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleCtechPayCheckout('bank')}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: '1px solid #A5D6A7',
                        background: '#F5FFF8',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        fontFamily: 'Arial'
                      }}
                    >
                      <div style={{ color: '#3E1F00', fontWeight: 'bold', fontSize: 13 }}>
                        Bank Transfer
                      </div>
                      <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                        Standard Bank
                      </div>
                    </button>
                  </div>

                  {/* Phone Input for Mobile Money */}
                  {ctechPayPhoneInput && (
                    <div style={{ marginTop: 14 }}>
                      <input
                        type="tel"
                        placeholder="Enter phone number (e.g., 0999123456)"
                        value={ctechPayPhone}
                        onChange={(e) => setCtechPayPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #A5D6A7',
                          fontSize: 14,
                          fontFamily: 'Arial',
                          background: 'white'
                        }}
                      />
                      <div style={{
                        display: 'flex', gap: 12, marginTop: 10
                      }}>
                        <button
                          onClick={() => {
                            setCtechPayPhoneInput(false);
                            setCtechPayMethod(null);
                            setCtechPayPhone('');
                            setCtechPayError('');
                          }}
                          style={{
                            padding: '8px 20px',
                            background: '#f0f0f0',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontFamily: 'Arial'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (ctechPayPhone) {
                              handleCtechPayCheckout(ctechPayMethod, ctechPayPhone);
                            } else {
                              setCtechPayError('Please enter your phone number');
                            }
                          }}
                          disabled={loading}
                          style={{
                            padding: '8px 20px',
                            background: loading ? '#ccc' : '#2D6A4F',
                            border: 'none',
                            borderRadius: 6,
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: 13,
                            fontFamily: 'Arial'
                          }}
                        >
                          Pay MWK {fmt(amount)}
                        </button>
                      </div>
                      {ctechPayError && (
                        <div style={{
                          color: '#C62828', fontSize: 12, marginTop: 6
                        }}>
                          {ctechPayError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Polling / Bank Transfer Status */}
          {pollingStatus && (
            <div style={{
              marginTop: 16,
              padding: '16px 20px',
              borderRadius: 10,
              background: pollingStatus.completed 
                ? '#E8F5E9' 
                : pollingStatus.failed || pollingStatus.timeout
                  ? '#FFEBEE'
                  : '#FFF8E1',
              border: `1px solid ${
                pollingStatus.completed 
                  ? '#A5D6A7' 
                  : pollingStatus.failed || pollingStatus.timeout
                    ? '#FFCDD2'
                    : '#FFE082'
              }`
            }}>
              {pollingStatus.bank_details ? (
                <>
                  <div style={{
                    color: '#3E1F00',
                    fontWeight: 'bold',
                    fontSize: 14,
                    marginBottom: 8
                  }}>
                    Bank Transfer Details
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                    <div><strong>Bank:</strong> {pollingStatus.bank_details.bank}</div>
                    <div><strong>Account Name:</strong> {pollingStatus.bank_details.account_name}</div>
                    <div><strong>Account Number:</strong> {pollingStatus.bank_details.account_number}</div>
                    <div><strong>Branch:</strong> {pollingStatus.bank_details.branch}</div>
                    <div><strong>Reference:</strong> {pollingStatus.bank_details.reference}</div>
                  </div>
                  <div style={{
                    marginTop: 12,
                    padding: '10px',
                    background: '#FFF3E0',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#E65100'
                  }}>
                    Please use the reference number above when making the transfer.
                    Your subscription will be activated once we confirm the payment.
                  </div>
                  <button
                    onClick={() => setPollingStatus(null)}
                    style={{
                      marginTop: 12,
                      padding: '6px 16px',
                      background: '#FF6B35',
                      border: 'none',
                      borderRadius: 6,
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 'bold',
                      fontFamily: 'Arial'
                    }}
                  >
                    Close
                  </button>
                </>
              ) : pollingStatus.completed ? (
                <>
                  <div style={{ color: '#2D6A4F', fontWeight: 'bold' }}>
                    ✓ {pollingStatus.message}
                  </div>
                  <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
                    Redirecting to dashboard...
                  </div>
                </>
              ) : pollingStatus.failed || pollingStatus.timeout ? (
                <>
                  <div style={{ color: '#C62828', fontWeight: 'bold' }}>
                    ✗ {pollingStatus.message}
                  </div>
                  <button
                    onClick={() => setPollingStatus(null)}
                    style={{
                      marginTop: 8,
                      padding: '6px 16px',
                      background: '#FF6B35',
                      border: 'none',
                      borderRadius: 6,
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 'bold',
                      fontFamily: 'Arial'
                    }}
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      border: '3px solid #FFB800',
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <div>
                      <div style={{ color: '#3E1F00', fontWeight: 'bold' }}>
                        {pollingStatus.message}
                      </div>
                      <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                        Reference: {pollingStatus.reference}
                      </div>
                    </div>
                  </div>
                  <style>
                    {`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                </>
              )}
            </div>
          )}

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
                        {b.gateway && (
                          <span style={{
                            fontSize: 10,
                            color: b.gateway === 'ctechpay' ? '#2D6A4F' : '#FF6B35',
                            marginLeft: 8,
                            background: b.gateway === 'ctechpay' ? '#E8F5E9' : '#FFF3E0',
                            padding: '1px 8px',
                            borderRadius: 10
                          }}>
                            {b.gateway === 'ctechpay' ? 'CtechPay' : 'OneKhusa'}
                          </span>
                        )}
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