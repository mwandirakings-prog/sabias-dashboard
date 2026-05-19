import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://malawi-sales-backend.onrender.com';

const MALAWI_DISTRICTS = [
  'Balaka', 'Blantyre', 'Chikwawa', 'Chiradzulu', 'Chitipa',
  'Dedza', 'Dowa', 'Karonga', 'Kasungu', 'Likoma',
  'Lilongwe', 'Machinga', 'Mangochi', 'Mchinji', 'Mulanje',
  'Mwanza', 'Mzimba', 'Neno', 'Nkhata Bay', 'Nkhotakota',
  'Nsanje', 'Ntcheu', 'Ntchisi', 'Phalombe', 'Rumphi',
  'Salima', 'Thyolo', 'Zomba'
];

// All valid Malawi prefixes
// Airtel: 099, 098 
// TNM:    088, 084
const MALAWI_PREFIXES = [
  '99', '98', // Airtel
  '88', '84', // TNM
];

const validateMalawiPhone = (phone) => {
  const cleaned = phone.replace(/[\s\-()/]/g, '');
  return MALAWI_PREFIXES.some(prefix => (
    cleaned === `+265${prefix}${'.'.repeat(7)}`.replace(/\./g, '') ||
    new RegExp(`^\\+265${prefix}\\d{7}$`).test(cleaned) ||
    new RegExp(`^265${prefix}\\d{7}$`).test(cleaned) ||
    new RegExp(`^0${prefix}\\d{7}$`).test(cleaned) ||
    new RegExp(`^${prefix}\\d{7}$`).test(cleaned)
  ));

export default function Register({ onBack }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    admin_name: '',
    password: '',
    confirm_password: '',
  });

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handlePhoneChange = (value) => {
    update('phone', value);
    if (value.length > 5) {
      if (!validateMalawiPhone(value)) {
        setPhoneError('Please enter a valid Malawian phone number.');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateMalawiPhone(form.phone)) {
      setPhoneError('Please enter a valid Malawian phone number.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match!');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API}/api/companies/register`, form);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already exists')) {
        setError(
          'This email address is already registered. ' +
          'Please use a different email address to register a new company.'
        );
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'Arial',
                  padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 48,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                    textAlign: 'center', maxWidth: 480,
                    width: '100%', boxSizing: 'border-box' }}>

        <div style={{ width: 64, height: 64, borderRadius: '50%',
                      background: '#E8F5E9', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px', border: '3px solid #2D6A4F' }}>
          <div style={{ fontSize: 28, color: '#2D6A4F', fontWeight: 'bold' }}>
            ✓
          </div>
        </div>

        <h2 style={{ color: '#3E1F00', marginBottom: 8, fontSize: 22 }}>
          Registration Successful!
        </h2>
        <p style={{ color: '#888', marginBottom: 8, fontSize: 14 }}>
          Your company <strong>{form.company_name}</strong> has been
          registered successfully.
        </p>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 13 }}>
          A confirmation email has been sent to{' '}
          <strong style={{ color: '#FF6B35' }}>{form.email}</strong>.
          Please check your inbox.
        </p>

        <div style={{ background: '#FFF8F0', borderRadius: 10,
                      padding: 16, marginBottom: 24, fontSize: 13,
                      color: '#555', textAlign: 'left',
                      border: '1px solid #FFE8D0' }}>
          <div>Company: <strong>{form.company_name}</strong></div>
          <div style={{ marginTop: 6 }}>
            District: <strong>{form.city}</strong>
          </div>
          <div style={{ marginTop: 6 }}>
            Admin: <strong>{form.admin_name}</strong>
          </div>
        </div>

        <button onClick={onBack}
          style={{ background: '#FF6B35', border: 'none', color: 'white',
                   padding: '12px 32px', borderRadius: 8, cursor: 'pointer',
                   fontWeight: 'bold', fontSize: 15 }}>
          Go to Login
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: '#AAA' }}>
          By SABIAS · Kings Mwandira, CEO
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'Arial',
                  padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                    width: '100%', maxWidth: 560,
                    boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ background: '#3E1F00', borderRadius: 12,
                        padding: '12px 24px', display: 'inline-block',
                        marginBottom: 16 }}>
            <div style={{ color: '#FFB800', fontWeight: 'bold',
                          fontSize: 22, letterSpacing: 2 }}>SABIAS</div>
            <div style={{ color: '#FF6B35', fontSize: 10 }}>
              Sales & Business Intelligence Analytics System
            </div>
          </div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 20 }}>
            Register Your Business
          </h2>
          <p style={{ color: '#888', margin: '8px 0 0', fontSize: 13 }}>
            Get your own SABIAS dashboard in minutes
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'center', marginBottom: 28, gap: 8 }}>
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= s ? '#FF6B35' : '#EEE',
                color: step >= s ? 'white' : '#888',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 'bold', fontSize: 13
              }}>{s}</div>
              {s < 2 && (
                <div style={{ width: 60, height: 2,
                              background: step > s ? '#FF6B35' : '#EEE' }}/>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around',
                      marginBottom: 24, fontSize: 11, color: '#888' }}>
          <span style={{ color: step >= 1 ? '#FF6B35' : '#888',
                         fontWeight: step >= 1 ? 'bold' : 'normal' }}>
            Company Info
          </span>
          <span style={{ color: step >= 2 ? '#FF6B35' : '#888',
                         fontWeight: step >= 2 ? 'bold' : 'normal' }}>
            Admin Account
          </span>
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                        color: '#C62828', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Step 1 — Company Info */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: '#555',
                                fontWeight: 'bold', display: 'block',
                                marginBottom: 6 }}>
                  Company Name *
                </label>
                <input type="text" required value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                  placeholder="e.g. Mwandira Trading Ltd"
                  style={{ width: '100%', padding: '11px 13px',
                           borderRadius: 8, border: '1.5px solid #FFB800',
                           fontSize: 13, boxSizing: 'border-box' }}/>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: '#555',
                                fontWeight: 'bold', display: 'block',
                                marginBottom: 6 }}>
                  Business Email *
                </label>
                <input type="email" required value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="e.g. info@mwandiratrading.com"
                  style={{ width: '100%', padding: '11px 13px',
                           borderRadius: 8, border: '1.5px solid #FFB800',
                           fontSize: 13, boxSizing: 'border-box' }}/>
              </div>

              <div style={{ display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#555',
                                  fontWeight: 'bold', display: 'block',
                                  marginBottom: 6 }}>
                    Phone Number *
                  </label>
                  <input type="text" required value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+265 99x xxxxxxx"
                    style={{ width: '100%', padding: '11px 13px',
                             borderRadius: 8,
                             border: `1.5px solid ${phoneError
                               ? '#C62828' : '#FFB800'}`,
                             fontSize: 13, boxSizing: 'border-box' }}/>
                  {phoneError && (
                    <div style={{ color: '#C62828', fontSize: 11,
                                  marginTop: 4 }}>
                      {phoneError}
                    </div>
                  )}
                  {/* Phone hint box */}
                  <div style={{ background: '#FFF8F0', borderRadius: 6,
                                padding: '6px 8px', marginTop: 6,
                                border: '1px solid #FFE8D0' }}>
                    <div style={{ color: '#888', fontSize: 10,
                                  fontWeight: 'bold', marginBottom: 3 }}>
                      Accepted Malawi numbers:
                    </div>
                    <div style={{ color: '#AAA', fontSize: 10,
                                  lineHeight: 1.6 }}>
                      Airtel: +26599x, +26598x, +26597x,
                      +26596x, +26591x, +26590x
                    </div>
                    <div style={{ color: '#AAA', fontSize: 10,
                                  lineHeight: 1.6 }}>
                      TNM: +26588x, +26587x, +26586x,
                      +26585x, +26584x, +26583x
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#555',
                                  fontWeight: 'bold', display: 'block',
                                  marginBottom: 6 }}>
                    District *
                  </label>
                  <select required value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    style={{ width: '100%', padding: '11px 13px',
                             borderRadius: 8, border: '1.5px solid #FFB800',
                             fontSize: 13, boxSizing: 'border-box',
                             background: '#FFFDF8' }}>
                    <option value="">-- Select District --</option>
                    {MALAWI_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: '#555',
                                fontWeight: 'bold', display: 'block',
                                marginBottom: 6 }}>
                  Business Address
                </label>
                <input type="text" value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="e.g. Area 3, Lilongwe"
                  style={{ width: '100%', padding: '11px 13px',
                           borderRadius: 8, border: '1.5px solid #FFB800',
                           fontSize: 13, boxSizing: 'border-box' }}/>
              </div>

              <button type="button"
                onClick={() => {
                  if (!form.company_name || !form.email ||
                      !form.phone || !form.city) {
                    setError('Please fill all required fields!');
                    return;
                  }
                  if (!validateMalawiPhone(form.phone)) {
                    setPhoneError(
                      'Please enter a valid Malawian phone number.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                style={{ width: '100%', background: '#FF6B35',
                         border: 'none', color: 'white', padding: '13px',
                         borderRadius: 8, cursor: 'pointer',
                         fontWeight: 'bold', fontSize: 15 }}>
                Next — Admin Account
              </button>
            </div>
          )}

          {/* Step 2 — Admin Account */}
          {step === 2 && (
            <div>
              <div style={{ background: '#FFF8F0', borderRadius: 10,
                            padding: 14, marginBottom: 20,
                            border: '1px solid #FFE8D0' }}>
                <div style={{ fontSize: 11, color: '#888',
                              marginBottom: 8, fontWeight: 'bold' }}>
                  COMPANY SUMMARY
                </div>
                <div style={{ fontSize: 13, color: '#3E1F00',
                              marginBottom: 4 }}>
                  Company: <strong>{form.company_name}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                  District: <strong>{form.city}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                  Email: <strong>{form.email}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  Phone: <strong>{form.phone}</strong>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: '#555',
                                fontWeight: 'bold', display: 'block',
                                marginBottom: 6 }}>
                  Admin Full Name *
                </label>
                <input type="text" required value={form.admin_name}
                  onChange={(e) => update('admin_name', e.target.value)}
                  placeholder="e.g. Kings Mwandira"
                  style={{ width: '100%', padding: '11px 13px',
                           borderRadius: 8, border: '1.5px solid #FFB800',
                           fontSize: 13, boxSizing: 'border-box' }}/>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: '#555',
                                fontWeight: 'bold', display: 'block',
                                marginBottom: 6 }}>
                  Password *
                </label>
                <input type="password" required value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 8 characters"
                  style={{ width: '100%', padding: '11px 13px',
                           borderRadius: 8, border: '1.5px solid #FFB800',
                           fontSize: 13, boxSizing: 'border-box' }}/>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: '#555',
                                fontWeight: 'bold', display: 'block',
                                marginBottom: 6 }}>
                  Confirm Password *
                </label>
                <input type="password" required value={form.confirm_password}
                  onChange={(e) => update('confirm_password', e.target.value)}
                  placeholder="Repeat password"
                  style={{ width: '100%', padding: '11px 13px',
                           borderRadius: 8, border: '1.5px solid #FFB800',
                           fontSize: 13, boxSizing: 'border-box' }}/>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, background: '#3E1F00', border: 'none',
                           color: '#FFB800', padding: '13px', borderRadius: 8,
                           cursor: 'pointer', fontWeight: 'bold',
                           fontSize: 14 }}>
                  Back
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 2,
                           background: submitting ? '#AAA' : '#FF6B35',
                           border: 'none', color: 'white', padding: '13px',
                           borderRadius: 8, cursor: 'pointer',
                           fontWeight: 'bold', fontSize: 15 }}>
                  {submitting ? 'Registering...' : 'Register Company'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#888', fontSize: 13 }}>
            Already have an account?{' '}
            <span onClick={onBack}
              style={{ color: '#FF6B35', cursor: 'pointer',
                       fontWeight: 'bold' }}>
              Sign In
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}