// ─────────────────────────────────────────────
//  Password Reset Page
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      setStep('reset');
    }
  }, [token]);

  const validatePassword = pwd => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const submitRequest = async e => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email: form.email });

      setSuccess(true);
      setForm({ email: '', password: '', confirmPassword: '' });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        navigate('/login');
      }, 3000);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async e => {
    e.preventDefault();
    setErr('');

    if (!validatePassword(form.password)) {
      setErr('Password must be at least 8 characters with uppercase & numbers');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, password: form.password });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          background: 'var(--bg2)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              {step === 'request' ? 'Reset Password' : 'Set New Password'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)', margin: 0 }}>
              {step === 'request'
                ? 'Enter your email to receive a reset link'
                : 'Enter your new password below'}
            </p>
          </div>

          {success ? (
            <div
              style={{
                padding: '20px',
                background: 'var(--green)',
                color: 'white',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              ✓{' '}
              {step === 'request'
                ? 'Check your email for reset link!'
                : 'Password reset successfully! Redirecting to login...'}
            </div>
          ) : null}

          {step === 'request' ? (
            <form onSubmit={submitRequest}>
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="name@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {err && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--red)',
                    marginBottom: '20px',
                  }}
                >
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: loading
                    ? 'var(--text3)'
                    : 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms',
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? '🔄 Sending...' : 'Send Reset Link'}
              </button>

              <div
                style={{
                  marginTop: '20px',
                  fontSize: '14px',
                  color: 'var(--text2)',
                  textAlign: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: 'none',
                    padding: 0,
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitReset}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      paddingRight: '40px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: 'var(--text)',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--accent)';
                      e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text2)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    <div
                      style={{ color: form.password.length >= 8 ? 'var(--green)' : 'var(--text3)' }}
                    >
                      ✓ At least 8 characters
                    </div>
                    <div
                      style={{
                        color: /[A-Z]/.test(form.password) ? 'var(--green)' : 'var(--text3)',
                      }}
                    >
                      ✓ Uppercase letter
                    </div>
                    <div
                      style={{
                        color: /[0-9]/.test(form.password) ? 'var(--green)' : 'var(--text3)',
                      }}
                    >
                      ✓ Number
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border:
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? '1px solid var(--red-border)'
                        : '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor =
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'var(--red-border)'
                        : 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--red)' }}>
                    Passwords don't match
                  </div>
                )}
              </div>

              {err && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--red)',
                    marginBottom: '20px',
                  }}
                >
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: loading
                    ? 'var(--text3)'
                    : 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms',
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? '🔄 Resetting...' : 'Reset Password'}
              </button>

              <div
                style={{
                  marginTop: '20px',
                  fontSize: '14px',
                  color: 'var(--text2)',
                  textAlign: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: 'none',
                    padding: 0,
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Info */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, var(--bg3) 0%, var(--bg) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: 'var(--text)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '450px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--text)',
            }}
          >
            Secure Your Account
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>
            Use a strong password with a mix of uppercase letters, lowercase letters, and numbers to
            keep your account secure.
          </div>
          <div
            style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}
          >
            {[
              { icon: '🔒', title: 'Strong Password', desc: 'Min 8 characters required' },
              { icon: '🛡️', title: 'Account Protected', desc: 'Enable 2FA for extra security' },
              { icon: '📝', title: 'Activity Logging', desc: 'All actions are tracked' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  background: 'var(--surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
