import React, { useState, useRef } from 'react';
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

// ── VALIDATORS ────────────────────────────────────────────
const validatePhone = (phone) => {
  const cleaned = phone.replace(/[\s\-()/]/g, '');
  return (
    /^\+265(99|98|88|84)\d{7}$/.test(cleaned) ||
    /^265(99|98|88|84)\d{7}$/.test(cleaned) ||
    /^0(99|98|88|84)\d{7}$/.test(cleaned) ||
    /^(99|98|88|84)\d{7}$/.test(cleaned)
  );
};

const validateEmail = (email) => {
  // Must have @ and a proper domain with at least one dot after @
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email.trim());
};

const validateCompanyName = (name) => {
  const trimmed = name.trim();
  // Must be at least 4 characters
  if (trimmed.length < 4) return false;
  // Must have at least 2 characters that are letters
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 2) return false;
  return true;
};

const validateAdminName = (name) => {
  const trimmed = name.trim();
  // Must have at least 2 words
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return false;
  // Each word must be at least 2 chars
  if (words.some(w => w.length < 2)) return false;
  return true;
};

const validatePassword = (password) => {
  return password.length >= 8;
};

// ── INPUT FIELD COMPONENT ─────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      fontSize: 11, color: '#555', fontWeight: 'bold',
      display: 'block', marginBottom: 6
    }}>
      {label} {required && <span style={{ color: '#E53935' }}>*</span>}
    </label>
    {children}
    {error && (
      <div style={{
        color: '#C62828', fontSize: 11, marginTop: 5,
        display: 'flex', alignItems: 'center', gap: 4
      }}>
        <span>⚠</span> {error}
      </div>
    )}
  </div>
);

const inputStyle = (hasError) => ({
  width: '100%', padding: '11px 13px', borderRadius: 8,
  border: `1.5px solid ${hasError ? '#E53935' : '#FFB800'}`,
  fontSize: 13, boxSizing: 'border-box', fontFamily: 'Arial',
  outline: 'none', background: hasError ? '#FFF5F5' : 'white'
});

export default function Register({ onBack }) {
  const [step, setStep] = useState(1); // 1=company, 2=admin, 3=otp
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  const [form, setForm] = useState({
    company_name: '', email: '', phone: '',
    city: '', address: '', admin_name: '',
    password: '', confirm_password: '',
  });

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // ── VALIDATE STEP 1 ───────────────────────────────────────
  const validateStep1 = () => {
    const newErrors = {};

    if (!form.company_name.trim()) {
      newErrors.company_name = 'Company name is required.';
    } else if (!validateCompanyName(form.company_name)) {
      newErrors.company_name =
        'Company name must be at least 4 characters. ' +
        'Please enter your full business name.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!validateEmail(form.email)) {
      newErrors.email =
        'Please enter a valid email address ' +
        '(e.g. yourname@gmail.com or business@company.com).';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!validatePhone(form.phone)) {
      newErrors.phone =
        'Please enter a valid Malawian phone number ' +
        '(e.g. 0991234567 or +265991234567).';
    }

    if (!form.city) {
      newErrors.city = 'Please select your district.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── VALIDATE STEP 2 ───────────────────────────────────────
  const validateStep2 = () => {
    const newErrors = {};

    if (!form.admin_name.trim()) {
      newErrors.admin_name = 'Admin full name is required.';
    } else if (!validateAdminName(form.admin_name)) {
      newErrors.admin_name =
        'Please enter your full name with first and last name ' +
        '(e.g. Kings Mwandira).';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (!validatePassword(form.password)) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!form.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password.';
    } else if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── SEND OTP ──────────────────────────────────────────────
  const sendOtp = async () => {
    setSendingOtp(true);
    setOtpError('');
    setGlobalError('');
    try {
      await axios.post(`${API}/api/auth/send-otp`, {
        email: form.email,
        company_name: form.company_name
      });
      setOtpSent(true);
      // Start 60 second resend cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already exists')) {
        setGlobalError(
          'This email address is already registered. ' +
          'Please use a different email or sign in.'
        );
        setStep(1);
      } else {
        setOtpError('Failed to send OTP. Please check your email and try again.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // ── HANDLE STEP 1 NEXT ────────────────────────────────────
  const handleStep1Next = () => {
    setGlobalError('');
    if (!validateStep1()) return;
    setStep(2);
  };

  // ── HANDLE STEP 2 NEXT ────────────────────────────────────
  const handleStep2Next = async () => {
    setGlobalError('');
    if (!validateStep2()) return;
    setStep(3);
    await sendOtp();
  };

  // ── HANDLE OTP INPUT ──────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // numbers only
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // only last digit
    setOtpCode(newOtp);
    setOtpError('');
    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── HANDLE FINAL SUBMIT WITH OTP ──────────────────────────
  const handleSubmit = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setOtpError('Please enter the complete 6-digit code.');
      return;
    }
    setSubmitting(true);
    setOtpError('');
    setGlobalError('');
    try {
      await axios.post(`${API}/api/companies/register`, {
        ...form,
        otp: code
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('otp') ||
          msg.toLowerCase().includes('code')) {
        setOtpError(
          'The code you entered is incorrect or has expired. ' +
          'Please try again or request a new code.'
        );
      } else if (msg.toLowerCase().includes('already exists')) {
        setGlobalError(
          'This email is already registered. Please sign in.'
        );
        setStep(1);
      } else {
        setGlobalError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────
  if (success) return (
    <div style={{
      minHeight: '100vh', background: '#FFF8F0',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Arial', padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 48,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        textAlign: 'center', maxWidth: 480,
        width: '100%', boxSizing: 'border-box'
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#E8F5E9', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', border: '3px solid #2D6A4F',
          fontSize: 32
        }}>
          ✓
        </div>
        <h2 style={{ color: '#3E1F00', marginBottom: 8, fontSize: 22 }}>
          Account Created Successfully!
        </h2>
        <p style={{ color: '#555', marginBottom: 8, fontSize: 14,
                    lineHeight: 1.7 }}>
          Welcome to SABIAS! Your company{' '}
          <strong style={{ color: '#FF6B35' }}>{form.company_name}</strong>{' '}
          has been registered and your 7-day free trial has started.
        </p>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 13 }}>
          A welcome email has been sent to{' '}
          <strong style={{ color: '#FF6B35' }}>{form.email}</strong>.
        </p>

        <div style={{
          background: '#FFF8F0', borderRadius: 10,
          padding: 16, marginBottom: 24, fontSize: 13,
          color: '#555', textAlign: 'left',
          border: '1px solid #FFE8D0'
        }}>
          <div style={{ marginBottom: 6 }}>
            Company: <strong>{form.company_name}</strong>
          </div>
          <div style={{ marginBottom: 6 }}>
            District: <strong>{form.city}</strong>
          </div>
          <div style={{ marginBottom: 6 }}>
            Admin: <strong>{form.admin_name}</strong>
          </div>
          <div>
            Email: <strong>{form.email}</strong>
          </div>
        </div>

        <button onClick={onBack} style={{
          background: '#FF6B35', border: 'none', color: 'white',
          padding: '12px 32px', borderRadius: 8, cursor: 'pointer',
          fontWeight: 'bold', fontSize: 15, fontFamily: 'Arial',
          width: '100%'
        }}>
          Login to SABIAS
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: '#AAA' }}>
          SABIAS · Kings Mwandira, CEO · 0996 175 162
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#FFF8F0',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Arial', padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        width: '100%', maxWidth: 560, boxSizing: 'border-box'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            background: '#3E1F00', borderRadius: 12,
            padding: '10px 24px', display: 'inline-block', marginBottom: 14
          }}>
            <div style={{
              color: '#FFB800', fontWeight: 'bold',
              fontSize: 20, letterSpacing: 2
            }}>
              SABIAS
            </div>
            <div style={{ color: '#FF6B35', fontSize: 10 }}>
              Sales & Business Intelligence Analytics System
            </div>
          </div>
          <h2 style={{ color: '#3E1F00', margin: 0, fontSize: 19 }}>
            Register Your Business
          </h2>
          <p style={{ color: '#888', margin: '6px 0 0', fontSize: 13 }}>
            Get started with a free 7-day trial
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 8, gap: 6
        }}>
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: step >= s ? '#FF6B35' : '#EEE',
                color: step >= s ? 'white' : '#999',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 'bold',
                fontSize: 13, transition: 'all 0.2s'
              }}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div style={{
                  width: 50, height: 2,
                  background: step > s ? '#FF6B35' : '#EEE',
                  transition: 'all 0.2s'
                }}/>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          marginBottom: 24, fontSize: 10, color: '#888'
        }}>
          {['Company Info', 'Admin Account', 'Verify Email'].map((label, i) => (
            <span key={label} style={{
              color: step >= i + 1 ? '#FF6B35' : '#888',
              fontWeight: step === i + 1 ? 'bold' : 'normal'
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* Global Error */}
        {globalError && (
          <div style={{
            background: '#FFEBEE', border: '1px solid #FFCDD2',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: '#C62828', fontSize: 13, lineHeight: 1.5
          }}>
            {globalError}
          </div>
        )}

        {/* ── STEP 1 — COMPANY INFO ──────────────────────── */}
        {step === 1 && (
          <div>
            <Field label="Company / Business Name"
              error={errors.company_name} required>
              <input type="text" value={form.company_name}
                onChange={(e) => update('company_name', e.target.value)}
                placeholder="e.g. Mwandira Trading Limited"
                style={inputStyle(!!errors.company_name)}/>
              <div style={{
                color: '#888', fontSize: 10, marginTop: 4
              }}>
                Enter your full business name — minimum 4 characters
              </div>
            </Field>

            <Field label="Business Email Address"
              error={errors.email} required>
              <input type="text" value={form.email}
                onChange={(e) => update('email', e.target.value.trim())}
                placeholder="e.g. yourname@gmail.com"
                style={inputStyle(!!errors.email)}/>
              <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
                Must be a valid email with @ symbol
                (e.g. name@gmail.com or name@company.com)
              </div>
            </Field>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 14
            }}>
              <Field label="Phone Number" error={errors.phone} required>
                <input type="text" value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="e.g. 0991234567"
                  style={inputStyle(!!errors.phone)}/>
                <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
                  Airtel: 099/098 · TNM: 088/084
                </div>
              </Field>

              <Field label="District" error={errors.city} required>
                <select value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  style={{
                    ...inputStyle(!!errors.city),
                    background: errors.city ? '#FFF5F5' : '#FFFDF8'
                  }}>
                  <option value="">-- Select District --</option>
                  {MALAWI_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Business Address (Optional)">
              <input type="text" value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="e.g. Area 3, Lilongwe"
                style={inputStyle(false)}/>
            </Field>

            <button type="button" onClick={handleStep1Next}
              style={{
                width: '100%', background: '#FF6B35',
                border: 'none', color: 'white', padding: '13px',
                borderRadius: 8, cursor: 'pointer',
                fontWeight: 'bold', fontSize: 15, fontFamily: 'Arial',
                marginTop: 8
              }}>
              Next — Set Up Admin Account
            </button>
          </div>
        )}

        {/* ── STEP 2 — ADMIN ACCOUNT ─────────────────────── */}
        {step === 2 && (
          <div>
            {/* Summary */}
            <div style={{
              background: '#FFF8F0', borderRadius: 10,
              padding: 14, marginBottom: 20,
              border: '1px solid #FFE8D0'
            }}>
              <div style={{
                fontSize: 10, color: '#888',
                marginBottom: 8, fontWeight: 'bold',
                letterSpacing: 1, textTransform: 'uppercase'
              }}>
                Company Summary
              </div>
              <div style={{ fontSize: 13, color: '#3E1F00', marginBottom: 4 }}>
                Company: <strong>{form.company_name}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                Email: <strong>{form.email}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                Phone: <strong>{form.phone}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                District: <strong>{form.city}</strong>
              </div>
            </div>

            <Field label="Admin Full Name"
              error={errors.admin_name} required>
              <input type="text" value={form.admin_name}
                onChange={(e) => update('admin_name', e.target.value)}
                placeholder="e.g. Kings Mwandira"
                style={inputStyle(!!errors.admin_name)}/>
              <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
                Enter your first and last name
              </div>
            </Field>

            <Field label="Password" error={errors.password} required>
              <input type="password" value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Minimum 8 characters"
                style={inputStyle(!!errors.password)}/>
            </Field>

            <Field label="Confirm Password"
              error={errors.confirm_password} required>
              <input type="password" value={form.confirm_password}
                onChange={(e) => update('confirm_password', e.target.value)}
                placeholder="Repeat your password"
                style={inputStyle(!!errors.confirm_password)}/>
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)}
                style={{
                  flex: 1, background: '#3E1F00', border: 'none',
                  color: '#FFB800', padding: '13px', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 'bold',
                  fontSize: 14, fontFamily: 'Arial'
                }}>
                Back
              </button>
              <button type="button" onClick={handleStep2Next}
                disabled={sendingOtp}
                style={{
                  flex: 2,
                  background: sendingOtp ? '#AAA' : '#FF6B35',
                  border: 'none', color: 'white', padding: '13px',
                  borderRadius: 8, cursor: sendingOtp
                    ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', fontSize: 15, fontFamily: 'Arial'
                }}>
                {sendingOtp ? 'Sending Code...' : 'Continue — Verify Email'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — OTP VERIFICATION ──────────────────── */}
        {step === 3 && (
          <div>
            {/* Email icon */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#FFF3E0', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontSize: 28,
                border: '2px solid #FFB800'
              }}>
                ✉
              </div>
              <div style={{
                color: '#3E1F00', fontWeight: 'bold', fontSize: 16
              }}>
                Check Your Email
              </div>
              <div style={{
                color: '#888', fontSize: 13, marginTop: 6,
                lineHeight: 1.6
              }}>
                We sent a 6-digit verification code to
                <br/>
                <strong style={{ color: '#FF6B35' }}>{form.email}</strong>
              </div>
              {otpSent && (
                <div style={{
                  background: '#E8F5E9', border: '1px solid #A5D6A7',
                  borderRadius: 8, padding: '8px 14px', marginTop: 10,
                  color: '#2D6A4F', fontSize: 12
                }}>
                  Code sent! Check your inbox and spam folder.
                </div>
              )}
            </div>

            {/* OTP Boxes */}
            <div style={{
              display: 'flex', gap: 10, justifyContent: 'center',
              marginBottom: 20
            }}>
              {otpCode.map((digit, index) => (
                <input key={index}
                  ref={el => otpRefs.current[index] = el}
                  type="text" inputMode="numeric"
                  value={digit} maxLength={1}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center',
                    fontSize: 22, fontWeight: 'bold',
                    border: `2px solid ${otpError ? '#E53935'
                      : digit ? '#FF6B35' : '#FFB800'}`,
                    borderRadius: 10, outline: 'none',
                    fontFamily: 'Arial', color: '#3E1F00',
                    background: digit ? '#FFF3E0' : 'white',
                    transition: 'all 0.15s'
                  }}/>
              ))}
            </div>

            {/* OTP Error */}
            {otpError && (
              <div style={{
                background: '#FFEBEE', border: '1px solid #FFCDD2',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                color: '#C62828', fontSize: 13, textAlign: 'center'
              }}>
                {otpError}
              </div>
            )}

            {/* Submit Button */}
            <button onClick={handleSubmit} disabled={submitting}
              style={{
                width: '100%', padding: '14px',
                background: submitting ? '#AAA' : '#FF6B35',
                border: 'none', borderRadius: 8, color: 'white',
                fontWeight: 'bold', fontSize: 15, cursor: submitting
                  ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial', marginBottom: 14
              }}>
              {submitting ? 'Creating Account...' : 'Verify and Create Account'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center' }}>
              {resendCooldown > 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>
                  Resend code in{' '}
                  <strong style={{ color: '#FF6B35' }}>
                    {resendCooldown}s
                  </strong>
                </div>
              ) : (
                <div style={{ color: '#888', fontSize: 13 }}>
                  Did not receive the code?{' '}
                  <span onClick={sendOtp}
                    style={{
                      color: '#FF6B35', cursor: 'pointer',
                      fontWeight: 'bold', textDecoration: 'underline'
                    }}>
                    Resend Code
                  </span>
                </div>
              )}
            </div>

            {/* Back button */}
            <button type="button" onClick={() => setStep(2)}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid #FFE8D0', color: '#7A5C3A',
                padding: '10px', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontFamily: 'Arial', marginTop: 12
              }}>
              Back — Change Details
            </button>
          </div>
        )}

        {/* Sign in link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#888', fontSize: 13 }}>
            Already have an account?{' '}
            <span onClick={onBack} style={{
              color: '#FF6B35', cursor: 'pointer', fontWeight: 'bold'
            }}>
              Sign In
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}