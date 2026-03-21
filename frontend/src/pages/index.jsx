// ─────────────────────────────────────────────
//  Pages — All page components
// ─────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  useTestCases,
  useTestCase,
  useCreateTC,
  useUpdateTC,
  useDeleteTC,
  useBulkDeleteTC,
  useModules,
  useBugs,
  useCreateBug,
  useUpdateBug,
  useDeleteBug,
  useTesters,
  useCreateTester,
  useUpdateTester,
  useDeleteTester,
  useDevelopers,
  useCreateDev,
  useDeleteDev,
  useRuns,
  useCreateRun,
  useDeleteRun,
  useComments,
  usePostComment,
  useReportSummary,
  useTesterPerformance,
  useUpdateProfile,
  useChangePassword,
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../hooks/useData';
import {
  exportToCSV,
  moduleColor,
  prioColor,
} from '../components/shared';

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    // Load cached email if available
    const userCache = localStorage.getItem('user_cache');
    const cachedEmail = userCache ? JSON.parse(userCache).email : '';
    return { email: cachedEmail, password: '' };
  });
  const [twoFACode, setTwoFACode] = useState('');
  const [step, setStep] = useState('login'); // 'login' or '2fa'
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tempTokens, setTempTokens] = useState(null);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', form);
      const data = response.data;

      // Check if 2FA is required
      if (data.requiresTwoFA) {
        setTempTokens(data.tempToken);
        setStep('2fa');
      } else {
        // Store tokens and redirect
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        await login(form.email, form.password);
        navigate('/dashboard');
      }
    } catch (ex) {
      const errorMsg = ex.response?.data?.error || ex.message || 'Login failed';
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const submitTwoFA = async e => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/verify-login', {
        tempToken: tempTokens,
        code: twoFACode,
      });
      const data = response.data;

      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      navigate('/dashboard');
    } catch (ex) {
      const errorMsg = ex.response?.data?.error || ex.message || '2FA verification failed';
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Left Side - Brand */}
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
          borderRight: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '450px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #60a5fa 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TestFlow Pro
          </div>
          <div
            style={{
              fontSize: '16px',
              color: 'var(--text2)',
              marginBottom: '48px',
              lineHeight: '1.6',
            }}
          >
            Powerful QA Management Platform for Modern Teams
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            {[
              { icon: '⚡', title: 'Fast Execution', desc: 'Run tests efficiently' },
              { icon: '🔍', title: 'Real Analytics', desc: 'Actionable insights' },
              { icon: '🤝', title: 'Team Tools', desc: 'Better collaboration' },
              { icon: '📊', title: 'Smart Reports', desc: 'Clear metrics' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  background: 'var(--surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                    color: 'var(--text)',
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
              {step === 'login' ? 'Welcome Back' : 'Verify Code'}
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text2)',
                margin: 0,
              }}
            >
              {step === 'login'
                ? 'Sign in to your QA dashboard'
                : 'Enter the 6-digit code from your authenticator'}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={submit}>
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
                    transition: 'all 200ms',
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
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
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
                      transition: 'all 200ms',
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
                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/password-reset')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'none',
                    }}
                    onMouseOver={e => (e.target.textDecoration = 'underline')}
                    onMouseOut={e => (e.target.textDecoration = 'none')}
                  >
                    Forgot password?
                  </button>
                </div>
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
                {loading ? '🔄 Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitTwoFA}>
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
                  6-Digit Code
                </label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontSize: '18px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                    fontWeight: '600',
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
                disabled={twoFACode.length !== 6 || loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background:
                    twoFACode.length === 6 && !loading
                      ? 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)'
                      : 'var(--text3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: twoFACode.length === 6 && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 200ms',
                  opacity: twoFACode.length === 6 && !loading ? 1 : 0.8,
                }}
              >
                {loading ? '🔄 Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setTwoFACode('');
                  setErr('');
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Back to Login
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: '20px',
              fontSize: '14px',
              color: 'var(--text2)',
              textAlign: 'center',
            }}
          >
            {step === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: 'none',
                    padding: 0,
                  }}
                  onMouseOver={e => (e.target.textDecoration = 'underline')}
                  onMouseOut={e => (e.target.textDecoration = 'none')}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SIGNUP
// ─────────────────────────────────────────────
export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    // Load cached name and email if available
    const userCache = localStorage.getItem('user_cache');
    const cached = userCache ? JSON.parse(userCache) : {};
    return {
      name: cached.name || '',
      email: cached.email || '',
      password: '',
      confirmPassword: '',
      teamType: 'qa',
    };
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const validatePassword = pwd => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const submit = async e => {
    e.preventDefault();
    setErr('');

    if (!form.name.trim()) {
      setErr('Full name is required');
      return;
    }
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
      await signup(form.name, form.email, form.password, form.teamType);
      navigate('/dashboard');
    } catch (ex) {
      const errorMsg = ex.response?.data?.error || 'Signup failed';
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Left Side - Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              Create Account
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text2)',
                margin: 0,
              }}
            >
              Join TestFlow Pro and start testing
            </p>
          </div>

          {/* Progress Indicator */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            {[1, 2].map(s => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  background: s <= step ? 'var(--accent)' : 'var(--border)',
                  borderRadius: '2px',
                  transition: 'all 200ms',
                }}
              />
            ))}
          </div>

          <form onSubmit={submit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 300ms' }}>
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
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Developer"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: 'var(--text)',
                      transition: 'all 200ms',
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="john@company.com"
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
                      transition: 'all 200ms',
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
                    Role *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { value: 'qa', label: '🧪 QA Tester', desc: 'Find & report bugs' },
                      { value: 'developer', label: '👨‍💻 Developer', desc: 'Fix issues & code' },
                    ].map(role => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, teamType: role.value }))}
                        style={{
                          padding: '16px',
                          border:
                            form.teamType === role.value
                              ? '2px solid var(--accent)'
                              : '1px solid var(--border)',
                          background:
                            form.teamType === role.value ? 'var(--accent-dim)' : 'var(--surface)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          textAlign: 'left',
                          color: form.teamType === role.value ? 'var(--accent)' : 'var(--text2)',
                          userSelect: 'none',
                        }}
                        onMouseOver={e => {
                          e.target.style.borderColor = 'var(--accent)';
                          e.target.style.background =
                            form.teamType === role.value ? 'var(--accent-dim)' : 'var(--bg3)';
                        }}
                        onMouseOut={e => {
                          if (form.teamType !== role.value) {
                            e.target.style.borderColor = 'var(--border)';
                            e.target.style.background = 'var(--surface)';
                          }
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            pointerEvents: 'none',
                          }}
                        >
                          {role.label}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text3)',
                            pointerEvents: 'none',
                          }}
                        >
                          {role.desc}
                        </div>
                      </button>
                    ))}
                  </div>
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
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 300ms' }}>
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
                    Password
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
                        transition: 'all 200ms',
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
                        style={{
                          color: form.password.length >= 8 ? 'var(--green)' : 'var(--text3)',
                        }}
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
                      transition: 'all 200ms',
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
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
                    {loading ? '🔄 Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div
            style={{
              marginTop: '20px',
              fontSize: '14px',
              color: 'var(--text2)',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <button
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
              onMouseOver={e => (e.target.style.textDecoration = 'underline')}
              onMouseOut={e => (e.target.style.textDecoration = 'none')}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Brand */}
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
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #60a5fa 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TestFlow Pro
          </div>
          <div
            style={{
              fontSize: '16px',
              color: 'var(--text2)',
              marginBottom: '48px',
              lineHeight: '1.6',
            }}
          >
            Powerful QA Management for Modern Teams
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '16px',
            }}
          >
            {[
              { icon: '⚡', title: 'Run Tests Fast', desc: 'Execute tests efficiently' },
              { icon: '🔍', title: 'Track Progress', desc: 'Real-time test analytics' },
              { icon: '🤝', title: 'Better Collaboration', desc: 'Team communication tools' },
              { icon: '📊', title: 'Smart Reporting', desc: 'Detailed test metrics' },
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
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                    color: 'var(--text)',
                  }}
                >
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

// ─────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────
export function Dashboard() {
  const { data: tcsData } = useTestCases({ limit: 100 });
  const { data: bugs = [] } = useBugs();
  const { data: testers = [] } = useTesters();
  const tcs = tcsData?.data || [];
  const total = tcs.length,
    passed = tcs.filter(t => t.status === 'Pass').length,
    failed = tcs.filter(t => t.status === 'Fail').length;
  const openBugs = bugs.filter(b => b.status === 'Open' || b.status === 'In Progress').length;
  const passRate = total ? Math.round((passed / total) * 100) : 0;
  const navigate = useNavigate();
  return (
    <div className="content">
      <div className="metrics-grid">
        <MetricCard value={total} label="Test Cases" delta={`Sprint 7`} deltaType="neu" icon="◻" />
        <MetricCard
          value={passed}
          label="Passed"
          delta={`${passRate}% pass rate`}
          deltaType={passRate >= 80 ? 'up' : 'dn'}
          icon="✓"
        />
        <MetricCard
          value={openBugs}
          label="Open Bugs"
          delta={`${bugs.filter(b => b.severity === 'Critical').length} critical`}
          deltaType={openBugs > 5 ? 'dn' : 'neu'}
          icon="⚑"
        />
        <MetricCard
          value={testers.filter(t => t.is_active).length}
          label="Active Testers"
          delta="All online"
          deltaType="up"
          icon="◎"
        />
      </div>
      <div className="split">
        <div>
          <div className="sec-lbl">Recent test runs</div>
          <div className="card card-flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Test Case</th>
                  <th>Tester</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {[...tcs]
                  .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                  .slice(0, 6)
                  .map(tc => (
                    <tr
                      key={tc.id}
                      className="tbl-click"
                      onClick={() => navigate(`/test-cases/${tc.id}`)}
                    >
                      <td
                        className="pk"
                        style={{
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tc.title}
                      </td>
                      <td>
                        {tc.tester_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div className={`av av-sm ${tc.tester_color}`}>
                              {tc.tester_initials}
                            </div>
                            {tc.tester_name}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <Badge status={tc.status} />
                      </td>
                      <td>
                        <Badge status={tc.priority} />
                      </td>
                      <td className="mono">
                        {formatDistanceToNow(new Date(tc.updated_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="sec-lbl" style={{ marginTop: 16 }}>
            Sprint progress
          </div>
          <div className="card">
            <ProgressBar
              value={passed}
              max={total}
              color="green"
              label={`Sprint 7 — ${passed}/${total} complete`}
            />
            <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-pass">✓ {passed} passed</span>
              <span className="badge badge-fail">✗ {failed} failed</span>
              <span className="badge badge-pending">
                ◌ {tcs.filter(t => t.status === 'Pending').length} pending
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="sec-lbl">Open bugs by severity</div>
          <div className="card">
            {['Critical', 'High', 'Medium', 'Low'].map(s => {
              const n = bugs.filter(
                b => (b.status === 'Open' || b.status === 'In Progress') && b.severity === s
              ).length;
              const cols = {
                Critical: 'var(--red)',
                High: 'var(--red)',
                Medium: 'var(--amber)',
                Low: 'var(--green)',
              };
              return (
                <div
                  key={s}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 60 }}>{s}</span>
                  <div style={{ flex: 1 }}>
                    <div className="pbar">
                      <div
                        className="pbar-fill"
                        style={{
                          width: `${bugs.length ? Math.round((n / Math.max(1, openBugs)) * 100) : 0}%`,
                          background: cols[s],
                        }}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text3)',
                      width: 16,
                      textAlign: 'right',
                    }}
                  >
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="sec-lbl" style={{ marginTop: 14 }}>
            Team workload
          </div>
          <div className="card">
            {testers
              .filter(t => t.is_active)
              .map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className={`av av-sm ${t.avatar_color}`}>{t.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {t.cases_assigned} cases · {t.pass_rate}% pass
                    </div>
                    <div
                      className="mini-bar"
                      style={{
                        height: 2,
                        background: 'var(--surface)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        marginTop: 4,
                        width: 70,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: 'var(--green)',
                          width: `${t.pass_rate}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TEST CASES LIST
// ─────────────────────────────────────────────
export function TestCases() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState({
    search: '',
    status: '',
    priority: '',
    module: '',
    tester_id: '',
    project_id: '',
    environment: '',
    type: '',
    startDate: '',
    endDate: '',
  });
  const [selected, setSelected] = useState(new Set());
  const [tcModal, setTCModal] = useState(false);
  const [aiModal, setAIModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    module: '',
    priority: 'Medium',
    tester_id: '',
    environment: 'Staging',
    type: 'Functional',
    description: '',
    steps: [],
  });

  const filters = {
    limit: 200,
    ...(tab !== 'all' && { status: tab }),
    ...Object.fromEntries(Object.entries(advancedFilters).filter(([, v]) => v)),
  };
  const { data, isLoading } = useTestCases(filters);
  const { data: allTCData } = useTestCases({ limit: 200 });
  const { data: modules = [] } = useModules();
  const { data: testers = [] } = useTesters();
  const { data: projects = [] } = useProjects();
  const createTC = useCreateTC();
  const bulkDel = useBulkDeleteTC();
  const tcs = data?.data || [];
  const allTCs = allTCData?.data || [];
  const tabs = ['all', 'Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'];
  const tabLabels = ['All', 'Passed', 'Failed', 'In Progress', 'Pending', 'Blocked'];
  const statusMap = {
    Pass: 'Pass',
    Fail: 'Fail',
    'In Progress': 'In Progress',
    Pending: 'Pending',
    Blocked: 'Blocked',
  };

  const resetForm = () =>
    setForm({
      title: '',
      project_id: '',
      module: '',
      priority: 'Medium',
      tester_id: '',
      environment: 'Staging',
      type: 'Functional',
      description: '',
      steps: [],
    });
  const openCreate = () => {
    resetForm();
    setTCModal(true);
  };
  const save = async () => {
    if (!form.title.trim()) return;
    try {
      await createTC.mutateAsync(form);
      setTCModal(false);
    } catch (err) {
      // Silent error handling
    }
  };
  const toggleSel = id =>
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const doBulkDel = async () => {
    try {
      await bulkDel.mutateAsync([...selected]);
      setSelected(new Set());
      setConfirmBulk(false);
    } catch (err) {
      // Silent error handling
    }
  };

  const doBulkUpdate = async (action, value) => {
    await api.patch('/test-cases/bulk/update', {
      ids: [...selected],
      action,
      value,
    });
    setSelected(new Set());
    setBulkModal(false);
    // Refetch data
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Main topbar */}
      <div className="topbar" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="topbar-l">
          <div className="page-title">Test Cases</div>
        </div>
        <div className="topbar-r" style={{ gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Total:</span>
            <span className="nb nb-blue">{tcs.length || 0}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Testing:</span>
            <span className="nb nb-amber">
              {tcs.filter(t => t.status === 'In Progress').length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters Component */}
      <TestCaseFilters
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        modules={modules}
        testers={testers}
        projects={projects}
      />

      {/* Action Bar */}
      <div className="topbar" style={{ height: 44, gap: 8 }}>
        <div className="topbar-r" style={{ gap: 6 }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {selected.size} selected
              </span>
              <button className="btn btn-sm btn-primary" onClick={() => setBulkModal(true)}>
                ⚡ Bulk Update
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => setConfirmBulk(true)}>
                Delete
              </button>
            </>
          )}
          <button
            className="btn btn-sm"
            onClick={() =>
              exportToCSV(
                [
                  ['Title', 'Module', 'Priority', 'Status', 'Tester', 'Updated'],
                  ...tcs.map(t => [
                    t.title,
                    t.module || '',
                    t.priority,
                    t.status,
                    t.tester_name || '',
                    t.updated_at,
                  ]),
                ],
                'test-cases.csv'
              )
            }
          >
            ↓ CSV
          </button>
          <button className="btn btn-sm" onClick={() => setAIModal(true)}>
            🤖 AI Generate
          </button>
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            + Create
          </button>
        </div>
      </div>
      <div className="tabs-bar">
        {tabs.map((t, i) => {
          const count =
            t === 'all'
              ? allTCs.length
              : allTCs.filter(tc => tc.status === statusMap[tabs[i]] || tc.status === t).length;
          return (
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {tabLabels[i]}{' '}
              <span
                style={{
                  fontSize: 10,
                  background: 'var(--surface)',
                  padding: '2px 6px',
                  borderRadius: 'var(--r4)',
                  color: 'var(--text2)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="content">
        {isLoading ? (
          <div className="loading-screen" style={{ height: 200 }}>
            <div className="spinner" />
          </div>
        ) : tcs.length === 0 ? (
          <EmptyState
            icon="☑"
            title="No test cases found"
            subtitle="Create one or adjust filters"
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                + Create Test Case
              </button>
            }
          />
        ) : (
          tcs.map(tc => (
            <div key={tc.id} className="tc-item" onClick={() => navigate(`/test-cases/${tc.id}`)}>
              <div
                className={`tc-check ${selected.has(tc.id) ? 'checked' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  toggleSel(tc.id);
                }}
                style={{
                  width: 16,
                  height: 16,
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--r4)',
                  flexShrink: 0,
                  marginTop: 2,
                  cursor: 'pointer',
                  background: selected.has(tc.id) ? 'var(--accent)' : 'transparent',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tc-title">{tc.title}</div>
                <div className="tc-meta">
                  {tc.project_name && (
                    <span
                      className={`ptag ${tc.project_color || 'gray'}`}
                      style={{
                        backgroundColor: tc.project_color
                          ? `var(--${tc.project_color.replace('av-', '')})`
                          : 'var(--surface)',
                        color: 'var(--text2)',
                      }}
                    >
                      {tc.project_name}
                    </span>
                  )}
                  {tc.module && (
                    <span className={`ptag ${moduleColor(tc.module)}`}>{tc.module}</span>
                  )}
                  <span className={`ptag ${prioColor(tc.priority)}`}>{tc.priority}</span>
                  {tc.type && <span className="ptag gray">{tc.type}</span>}
                  <span>{tc.steps?.length || 0} steps</span>
                  <span>{tc.tester_name || 'Unassigned'}</span>
                  <span>{formatDistanceToNow(new Date(tc.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <Badge status={tc.status} />
                <span
                  style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}
                >
                  {tc.environment}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create TC Modal */}
      <Modal open={tcModal} onClose={() => setTCModal(false)} title="Create Test Case" size="md">
        <div className="fg">
          <label className="fl">Title *</label>
          <input
            className="fi"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="TC-xxx: What is being tested"
          />
        </div>
        <div className="form-row3">
          <div className="fg">
            <label className="fl">Project</label>
            <select
              className="fi fi-sel"
              value={form.project_id}
              onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            >
              <option value="">— None —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Module</label>
            <input
              className="fi"
              value={form.module}
              onChange={e => setForm(f => ({ ...f, module: e.target.value }))}
              placeholder="e.g. Auth"
              list="mods"
            />
            <datalist id="mods">
              {modules.map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div className="fg">
            <label className="fl">Priority</label>
            <select
              className="fi fi-sel"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            >
              {['Critical', 'High', 'Medium', 'Low'].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Tester</label>
            <select
              className="fi fi-sel"
              value={form.tester_id}
              onChange={e => setForm(f => ({ ...f, tester_id: e.target.value }))}
            >
              <option value="">— Unassigned —</option>
              {testers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Environment</label>
            <select
              className="fi fi-sel"
              value={form.environment}
              onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
            >
              {['Staging', 'Production', 'Local', 'All'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Type</label>
            <select
              className="fi fi-sel"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {['Functional', 'Regression', 'Smoke', 'Performance', 'Security', 'API'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="fl">Description</label>
          <textarea
            className="fi fi-ta"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief description…"
          />
        </div>
        <div className="fg">
          <label
            className="fl"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            Test Steps{' '}
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Cmd+Enter to post</span>
          </label>
          <StepBuilder steps={form.steps} onChange={steps => setForm(f => ({ ...f, steps }))} />
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setTCModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={createTC.isPending}>
            {createTC.isPending ? 'Creating…' : 'Create Test Case'}
          </button>
        </div>
      </Modal>

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        open={bulkModal}
        onClose={() => setBulkModal(false)}
        selectedCount={selected.size}
        onConfirm={doBulkUpdate}
        testers={testers}
      />

      <Confirm
        open={confirmBulk}
        title="Delete Selected"
        message={`Delete ${selected.size} test case(s)?`}
        onConfirm={doBulkDel}
        onCancel={() => setConfirmBulk(false)}
      />

      <AITestCaseGenerator
        open={aiModal}
        onClose={() => setAIModal(false)}
        onGenerate={generatedTestCases => {
          // Convert generated test cases to app format and add to form
          const formattedSteps = generatedTestCases[0]?.steps || [];
          setForm(f => ({
            ...f,
            title: generatedTestCases[0]?.title || '',
            priority: generatedTestCases[0]?.priority || 'Medium',
            steps: formattedSteps,
          }));
          setTCModal(true);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  TEST CASE DETAIL
// ─────────────────────────────────────────────
export function TestCaseDetail() {
  const { id } = { id: window.location.pathname.split('/').pop() };
  const navigate = useNavigate();
  const { data: tc, isLoading } = useTestCase(id);
  const updateTC = useUpdateTC();
  const deleteTC = useDeleteTC();
  const { data: comments = [] } = useComments({ tc_id: id });
  const { data: testers = [] } = useTesters();
  const postCmt = usePostComment();
  const [editModal, setEditModal] = useState(false);
  const [bugModal, setBugModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const { data: devs = [] } = useDevelopers();
  const [bugForm, setBugForm] = useState({
    title: '',
    severity: 'High',
    tc_id: id,
    developer_id: '',
    environment: 'Staging',
    platform: '',
    steps_to_reproduce: '',
    actual_result: '',
    expected_result: '',
  });
  const createBug = useCreateBug();
  const [optimisticStatus, setOptimisticStatus] = useState(null);

  if (isLoading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  if (!tc)
    return (
      <div className="content">
        <EmptyState
          title="Test case not found"
          action={
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/test-cases')}>
              ← Back
            </button>
          }
        />
      </div>
    );

  const openEdit = () => {
    setEditForm({
      title: tc.title,
      module: tc.module || '',
      priority: tc.priority,
      tester_id: tc.tester_id || '',
      environment: tc.environment || 'Staging',
      type: tc.type || 'Functional',
      description: tc.description || '',
      steps: tc.steps || [],
    });
    setEditModal(true);
  };
  const saveEdit = async () => {
    try {
      await updateTC.mutateAsync({ id: tc.id, ...editForm });
      setEditModal(false);
    } catch (err) {
      // Silent error handling
    }
  };
  const doDelete = async () => {
    try {
      await deleteTC.mutateAsync(tc.id);
      navigate('/test-cases');
    } catch (err) {
      // Silent error handling
    }
  };
  const postComment = async text => {
    try {
      await postCmt.mutateAsync({ body: text, tc_id: tc.id });
    } catch (err) {
      // Silent error handling
    }
  };
  const saveBug = async () => {
    try {
      // Validate required fields
      if (!bugForm.title.trim()) {
        toast.error('Bug title is required');
        return;
      }
      await createBug.mutateAsync(bugForm);
      setBugModal(false);
      setBugForm({
        title: '',
        severity: 'High',
        tc_id: id,
        developer_id: '',
        environment: 'Staging',
        platform: '',
        steps_to_reproduce: '',
        actual_result: '',
        expected_result: '',
      });
    } catch (err) {
      // Error is handled by useCreateBug
    }
  };

  const handleStatusChange = newStatus => {
    setOptimisticStatus(newStatus);
    updateTC.mutate(
      { id: tc.id, status: newStatus },
      {
        onSettled: () => setOptimisticStatus(null),
      }
    );
  };

  const displayStatus = optimisticStatus || tc.status;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar">
        <div className="topbar-l" style={{ gap: 8, minWidth: 0 }}>
          <button className="btn btn-sm" onClick={() => navigate('/test-cases')}>
            ← Back
          </button>
          <div
            className="page-title"
            style={{
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tc.title}
          </div>
        </div>
        <div className="topbar-r">
          <select
            className="isel"
            value={displayStatus}
            onChange={e => handleStatusChange(e.target.value)}
          >
            {['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={() => setBugModal(true)}>
            ⚑ Report Bug
          </button>
          <button className="btn btn-sm btn-primary" onClick={openEdit}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirm(true)}>
            Delete
          </button>
        </div>
      </div>
      <div className="content">
        <div className="split">
          <div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              {tc.module && <span className={`ptag ${moduleColor(tc.module)}`}>{tc.module}</span>}
              {tc.priority && (
                <span className={`ptag ${prioColor(tc.priority)}`}>{tc.priority}</span>
              )}
              {tc.type && <span className="ptag gray">{tc.type}</span>}
              {tc.environment && <span className="ptag gray">{tc.environment}</span>}
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {(tc.steps || []).length} steps ·{' '}
                {formatDistanceToNow(new Date(tc.updated_at), { addSuffix: true })}
              </span>
            </div>
            {displayStatus === 'Fail' && tc.steps?.some(s => s.actual) && (
              <div
                style={{
                  background: 'var(--red-dim)',
                  border: '1px solid var(--red-border)',
                  borderRadius: 'var(--r6)',
                  padding: '9px 13px',
                  marginBottom: 12,
                  fontSize: 11,
                  color: 'var(--red)',
                }}
              >
                ⚠ {tc.steps.filter(s => s.actual).length} step(s) failed
              </div>
            )}
            <div className="sec-lbl">Test steps</div>
            <div className="card card-sm">
              {(tc.steps || []).map((s, i) => (
                <div key={i} className="step-row">
                  <div
                    className={`step-n ${s.actual ? 'fail' : displayStatus === 'Pass' ? 'pass' : ''}`}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="step-action">{s.action}</div>
                    <div className="step-exp">Expected: {s.expected}</div>
                    {s.actual && <div className="step-actual">Actual: {s.actual}</div>}
                  </div>
                  <Badge
                    status={s.actual ? 'Fail' : displayStatus === 'Pass' ? 'Pass' : 'Pending'}
                  />
                </div>
              ))}
            </div>
            {tc.bugs?.length > 0 && (
              <>
                <div className="sec-lbl" style={{ marginTop: 14 }}>
                  Linked bugs
                </div>
                {tc.bugs.map(b => (
                  <div
                    key={b.id}
                    style={{
                      background: 'var(--red-dim)',
                      border: '1px solid var(--red-border)',
                      borderRadius: 'var(--r8)',
                      padding: '10px 13px',
                      marginBottom: 7,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--red)',
                        }}
                      >
                        {b.bug_id}
                      </span>
                      <Badge status={b.severity} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                      {b.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: 3,
                      }}
                    >
                      {b.status}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <div>
            <div className="sec-lbl">Discussion</div>
            <CommentThread comments={comments} onPost={postComment} loading={postCmt.isPending} />
            {tc.tester_name && (
              <>
                <div className="sec-lbl" style={{ marginTop: 14 }}>
                  Assigned tester
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <Avatar initials={tc.tester_initials} color={tc.tester_color} size="md" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                      {tc.tester_name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {tc.tester_role}
                    </div>
                  </div>
                  <span className="badge badge-pass" style={{ marginLeft: 'auto' }}>
                    Active
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editForm && (
        <Modal
          open={editModal}
          onClose={() => setEditModal(false)}
          title="Edit Test Case"
          size="md"
        >
          <div className="fg">
            <label className="fl">Title</label>
            <input
              className="fi"
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="form-row3">
            <div className="fg">
              <label className="fl">Module</label>
              <input
                className="fi"
                value={editForm.module}
                onChange={e => setEditForm(f => ({ ...f, module: e.target.value }))}
              />
            </div>
            <div className="fg">
              <label className="fl">Priority</label>
              <select
                className="fi fi-sel"
                value={editForm.priority}
                onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
              >
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Tester</label>
              <select
                className="fi fi-sel"
                value={editForm.tester_id}
                onChange={e => setEditForm(f => ({ ...f, tester_id: e.target.value }))}
              >
                <option value="">— None —</option>
                {testers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="fg">
            <label className="fl">Steps</label>
            <StepBuilder
              steps={editForm.steps}
              onChange={steps => setEditForm(f => ({ ...f, steps }))}
            />
          </div>
          <div className="modal-ft">
            <button className="btn" onClick={() => setEditModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={updateTC.isPending}>
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Report bug modal */}
      <Modal open={bugModal} onClose={() => setBugModal(false)} title="Report Bug" size="md">
        <div className="fg">
          <label className="fl">Title *</label>
          <input
            className="fi"
            value={bugForm.title}
            onChange={e => setBugForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Short description"
          />
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Severity</label>
            <select
              className="fi fi-sel"
              value={bugForm.severity}
              onChange={e => setBugForm(f => ({ ...f, severity: e.target.value }))}
            >
              {['Critical', 'High', 'Medium', 'Low'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Assign Developer</label>
            <select
              className="fi fi-sel"
              value={bugForm.developer_id}
              onChange={e => setBugForm(f => ({ ...f, developer_id: e.target.value }))}
            >
              <option value="">— None —</option>
              {devs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="fl">Steps to Reproduce</label>
          <textarea
            className="fi fi-ta"
            value={bugForm.steps_to_reproduce}
            onChange={e => setBugForm(f => ({ ...f, steps_to_reproduce: e.target.value }))}
          />
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Actual Result</label>
            <input
              className="fi"
              value={bugForm.actual_result}
              onChange={e => setBugForm(f => ({ ...f, actual_result: e.target.value }))}
            />
          </div>
          <div className="fg">
            <label className="fl">Expected Result</label>
            <input
              className="fi"
              value={bugForm.expected_result}
              onChange={e => setBugForm(f => ({ ...f, expected_result: e.target.value }))}
            />
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setBugModal(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={saveBug} disabled={createBug.isPending}>
            Submit Bug
          </button>
        </div>
      </Modal>

      <Confirm
        open={confirm}
        title="Delete Test Case"
        message="This will permanently delete this test case."
        onConfirm={doDelete}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  BUGS
// ─────────────────────────────────────────────
export function Bugs() {
  const [tab, setTab] = useState('Open');
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({
    title: '',
    severity: 'High',
    tc_id: '',
    developer_id: '',
    environment: 'Staging',
    platform: '',
    steps_to_reproduce: '',
    actual_result: '',
    expected_result: '',
  });
  const filters = {
    ...(tab !== 'all' && { status: tab }),
    ...(search && { search }),
    ...(sevFilter && { severity: sevFilter }),
  };
  const { data: bugs = [], isLoading } = useBugs(filters);
  const { data: tcs } = useTestCases({ limit: 200 });
  const { data: devs = [] } = useDevelopers();
  const createBug = useCreateBug();
  const updateBug = useUpdateBug();
  const deleteBug = useDeleteBug();
  const openCreate = () => {
    setEditId(null);
    setForm({
      title: '',
      severity: 'High',
      tc_id: '',
      developer_id: '',
      environment: 'Staging',
      platform: '',
      steps_to_reproduce: '',
      actual_result: '',
      expected_result: '',
    });
    setModal(true);
  };
  const openEdit = b => {
    setEditId(b.id);
    setForm({
      title: b.title,
      severity: b.severity,
      tc_id: b.tc_id || '',
      developer_id: b.developer_id || '',
      environment: b.environment || 'Staging',
      platform: b.platform || '',
      steps_to_reproduce: b.steps_to_reproduce || '',
      actual_result: b.actual_result || '',
      expected_result: b.expected_result || '',
    });
    setModal(true);
  };
  const save = async () => {
    if (!form.title.trim()) return;
    try {
      editId
        ? await updateBug.mutateAsync({ id: editId, ...form })
        : await createBug.mutateAsync(form);
      setModal(false);
    } catch (err) {
      // Silent error handling
    }
  };
  const allTCs = tcs?.data || [];

  // Calculate counts for each tab
  const allBugs = bugs; // Note: useBugs already filters, so we need to fetch all first
  const openCount = allBugs.filter(b => b.status === 'Open').length;
  const inProgressCount = allBugs.filter(b => b.status === 'In Progress').length;
  const resolvedCount = allBugs.filter(b => b.status === 'Resolved').length;
  const closedCount = allBugs.filter(b => b.status === 'Closed').length;
  const totalCount = allBugs.length;

  const tabCounts = {
    Open: openCount,
    'In Progress': inProgressCount,
    Resolved: resolvedCount,
    Closed: closedCount,
    all: totalCount,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar" style={{ height: 44, gap: 8 }}>
        <div className="topbar-l" style={{ gap: 8, flex: 1 }}>
          <div className="search-wrap" style={{ maxWidth: 200 }}>
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search bugs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="isel" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
            <option value="">All Severity</option>
            {['Critical', 'High', 'Medium', 'Low'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="topbar-r" style={{ gap: 6 }}>
          <button
            className="btn btn-sm"
            onClick={() =>
              exportToCSV(
                [
                  ['Bug ID', 'Title', 'Severity', 'Status', 'Reporter', 'Created'],
                  ...bugs.map(b => [
                    b.bug_id,
                    b.title,
                    b.severity,
                    b.status,
                    b.reporter || '',
                    b.created_at,
                  ]),
                ],
                'bugs.csv'
              )
            }
          >
            ↓ CSV
          </button>
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            ⚑ Report Bug
          </button>
        </div>
      </div>
      <div className="tabs-bar">
        {['Open', 'In Progress', 'Resolved', 'Closed', 'all'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : t}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7, fontWeight: 600 }}>
              {tabCounts[t]}
            </span>
          </button>
        ))}
      </div>
      <div className="content">
        {isLoading ? (
          <div className="loading-screen" style={{ height: 200 }}>
            <div className="spinner" />
          </div>
        ) : bugs.length === 0 ? (
          <EmptyState icon="⚑" title="No bugs found" subtitle="Report a bug or adjust filters" />
        ) : (
          <div className="card card-flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bug ID</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Linked TC</th>
                  <th>Developer</th>
                  <th>Reporter</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bugs.map(b => {
                  const dev = devs.find(d => d.id === b.developer_id);
                  const tc = allTCs.find(t => t.id === b.tc_id);
                  return (
                    <tr key={b.id}>
                      <td className="mono" style={{ color: 'var(--text3)' }}>
                        {b.bug_id}
                      </td>
                      <td
                        className="pk"
                        style={{
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {b.title}
                      </td>
                      <td>
                        <Badge status={b.severity} />
                      </td>
                      <td>
                        <select
                          className="isel"
                          value={b.status}
                          onChange={e => updateBug.mutate({ id: b.id, status: e.target.value })}
                        >
                          {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {tc ? (
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--accent)',
                              fontFamily: 'var(--font-mono)',
                              cursor: 'pointer',
                            }}
                            onClick={() => (window.location.href = `/test-cases/${tc.id}`)}
                          >
                            {tc.title.slice(0, 30)}…
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {dev ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className={`av av-sm ${dev.avatar_color}`}>{dev.initials}</div>
                            <span style={{ fontSize: 11 }}>{dev.name}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text2)' }}>{b.reporter || '—'}</td>
                      <td className="mono">
                        {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-xs" onClick={() => openEdit(b)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => setConfirm(b.id)}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Bug' : 'Report Bug'}
        size="md"
      >
        <div className="fg">
          <label className="fl">Title *</label>
          <input
            className="fi"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Short title"
          />
        </div>
        <div className="form-row3">
          <div className="fg">
            <label className="fl">Severity</label>
            <select
              className="fi fi-sel"
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
            >
              {['Critical', 'High', 'Medium', 'Low'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Linked TC</label>
            <select
              className="fi fi-sel"
              value={form.tc_id}
              onChange={e => setForm(f => ({ ...f, tc_id: e.target.value }))}
            >
              <option value="">— None —</option>
              {allTCs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title.slice(0, 50)}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Developer</label>
            <select
              className="fi fi-sel"
              value={form.developer_id}
              onChange={e => setForm(f => ({ ...f, developer_id: e.target.value }))}
            >
              <option value="">— None —</option>
              {devs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Environment</label>
            <select
              className="fi fi-sel"
              value={form.environment}
              onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
            >
              {['Staging', 'Production', 'Local'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Platform</label>
            <input
              className="fi"
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              placeholder="e.g. Chrome 122"
            />
          </div>
        </div>
        <div className="fg">
          <label className="fl">Steps to Reproduce</label>
          <textarea
            className="fi fi-ta"
            value={form.steps_to_reproduce}
            onChange={e => setForm(f => ({ ...f, steps_to_reproduce: e.target.value }))}
          />
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Actual</label>
            <input
              className="fi"
              value={form.actual_result}
              onChange={e => setForm(f => ({ ...f, actual_result: e.target.value }))}
            />
          </div>
          <div className="fg">
            <label className="fl">Expected</label>
            <input
              className="fi"
              value={form.expected_result}
              onChange={e => setForm(f => ({ ...f, expected_result: e.target.value }))}
            />
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setModal(false)}>
            Cancel
          </button>
          <button
            className={`btn ${editId ? 'btn-primary' : 'btn-danger'}`}
            onClick={save}
            disabled={createBug.isPending || updateBug.isPending}
          >
            {editId ? 'Save' : 'Submit Bug'}
          </button>
        </div>
      </Modal>
      <Confirm
        open={!!confirm}
        title="Delete Bug"
        message="Delete this bug report?"
        onConfirm={async () => {
          try {
            await deleteBug.mutateAsync(confirm);
            setConfirm(null);
          } catch (err) {
            // Silent error handling
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  TESTERS
// ─────────────────────────────────────────────
export function Testers() {
  const { data: testers = [], isLoading } = useTesters();
  const createT = useCreateTester(),
    updateT = useUpdateTester(),
    deleteT = useDeleteTester();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    initials: '',
    role: 'QA Engineer',
    avatar_color: 'av-green',
    is_active: true,
  });
  const open = (t = null) => {
    setEditId(t?.id || null);
    setForm(
      t
        ? {
            name: t.name,
            initials: t.initials,
            role: t.role,
            avatar_color: t.avatar_color,
            is_active: t.is_active,
          }
        : { name: '', initials: '', role: 'QA Engineer', avatar_color: 'av-green', is_active: true }
    );
    setModal(true);
  };
  const save = async () => {
    if (!form.name.trim()) return;
    try {
      editId ? await updateT.mutateAsync({ id: editId, ...form }) : await createT.mutateAsync(form);
      setModal(false);
    } catch (err) {
      // Silent error handling
    }
  };
  const active = testers.filter(t => t.is_active).length;
  const avgRate = testers.length
    ? Math.round(testers.reduce((a, t) => a + t.pass_rate, 0) / testers.length)
    : 0;
  const inactive = testers.filter(t => !t.is_active).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar">
        <div className="topbar-l">
          <div className="page-title">Testers</div>
          <div className="breadcrumb" style={{ fontSize: 12, color: 'var(--text3)' }}>
            Total: {testers.length} · Active: {active} · Inactive: {inactive}
          </div>
        </div>
        <div className="topbar-r">
          <button className="btn btn-sm btn-primary" onClick={() => open()}>
            + Add Tester
          </button>
        </div>
      </div>
      <div className="content">
        <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <MetricCard
            value={testers.length}
            label="Total Testers"
            delta={`${active} active`}
            deltaType="up"
          />
          <MetricCard
            value={testers.reduce((a, t) => a + t.cases_assigned, 0)}
            label="Cases Assigned"
            delta="Sprint 7"
            deltaType="neu"
          />
          <MetricCard
            value={`${avgRate}%`}
            label="Avg Pass Rate"
            delta={avgRate >= 90 ? 'Excellent' : avgRate >= 75 ? 'Good' : 'Needs attention'}
            deltaType={avgRate >= 80 ? 'up' : 'dn'}
          />
        </div>
        <div className="card card-flush">
          {isLoading ? (
            <div className="loading-screen" style={{ height: 200 }}>
              <div className="spinner" />
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tester</th>
                  <th>Role</th>
                  <th>Assigned</th>
                  <th>Pass Rate</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {testers.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar initials={t.initials} color={t.avatar_color} size="md" />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                            {t.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--text3)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {t.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ptag gray">{t.role}</span>
                    </td>
                    <td>{t.cases_assigned}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="pbar" style={{ width: 70 }}>
                          <div className="pbar-fill green" style={{ width: `${t.pass_rate}%` }} />
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text3)',
                          }}
                        >
                          {t.pass_rate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge status={t.is_active ? 'Pass' : 'Pending'} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-xs" onClick={() => open(t)}>
                          Edit
                        </button>
                        <button className="btn btn-xs btn-danger" onClick={() => setConfirm(t.id)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Tester' : 'Add Tester'}
        size="sm"
      >
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Full Name *</label>
            <input
              className="fi"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="fg">
            <label className="fl">Initials</label>
            <input
              className="fi"
              value={form.initials}
              onChange={e => setForm(f => ({ ...f, initials: e.target.value.toUpperCase() }))}
              maxLength={3}
            />
          </div>
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Role</label>
            <select
              className="fi fi-sel"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              {['QA Engineer', 'Lead QA', 'Junior QA', 'SDET'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Avatar Color</label>
            <select
              className="fi fi-sel"
              value={form.avatar_color}
              onChange={e => setForm(f => ({ ...f, avatar_color: e.target.value }))}
            >
              {['av-blue', 'av-green', 'av-amber', 'av-violet', 'av-red', 'av-cyan'].map(c => (
                <option key={c} value={c}>
                  {c.replace('av-', '')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </Modal>
      <Confirm
        open={!!confirm}
        title="Remove Tester"
        message="Remove this tester from the platform?"
        onConfirm={async () => {
          try {
            await deleteT.mutateAsync(confirm);
            setConfirm(null);
          } catch (err) {
            // Silent error handling
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  TEST RUNS
// ─────────────────────────────────────────────
export function TestRuns() {
  const { data: runs = [], isLoading } = useRuns();
  const createRun = useCreateRun(),
    deleteRun = useDeleteRun();
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', environment: 'Staging', sprint: '' });
  const save = async () => {
    if (!form.name.trim()) return;
    try {
      await createRun.mutateAsync(form);
      setModal(false);
    } catch (err) {
      // Silent error handling
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar">
        <div className="topbar-l">
          <div className="page-title">Test Runs</div>
        </div>
        <div className="topbar-r">
          <button className="btn btn-sm btn-primary" onClick={() => setModal(true)}>
            + New Run
          </button>
        </div>
      </div>
      <div className="content">
        {isLoading ? (
          <div className="loading-screen" style={{ height: 200 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="card card-flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Name</th>
                  <th>Environment</th>
                  <th>Test Cases</th>
                  <th>Pass Rate</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id}>
                    <td className="mono" style={{ color: 'var(--text3)' }}>
                      {r.run_id}
                    </td>
                    <td className="pk">{r.name}</td>
                    <td>
                      <span className="ptag gray">{r.environment}</span>
                    </td>
                    <td>{r.tc_count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="pbar" style={{ width: 70 }}>
                          <div
                            className="pbar-fill green"
                            style={{ width: `${r.pass_rate || 0}%` }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--text3)',
                          }}
                        >
                          {r.pass_rate || 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge status={r.status === 'Complete' ? 'Pass' : 'In Progress'} />
                    </td>
                    <td className="mono">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </td>
                    <td>
                      <button className="btn btn-xs btn-danger" onClick={() => setConfirm(r.id)}>
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Create Test Run" size="sm">
        <div className="fg">
          <label className="fl">Run Name *</label>
          <input
            className="fi"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Sprint 8 Regression"
          />
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Environment</label>
            <select
              className="fi fi-sel"
              value={form.environment}
              onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
            >
              {['Staging', 'Production', 'Local'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Sprint</label>
            <input
              className="fi"
              value={form.sprint}
              onChange={e => setForm(f => ({ ...f, sprint: e.target.value }))}
              placeholder="e.g. Sprint 8"
            />
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={createRun.isPending}>
            Create Run
          </button>
        </div>
      </Modal>
      <Confirm
        open={!!confirm}
        title="Delete Run"
        message="Delete this test run?"
        onConfirm={async () => {
          try {
            await deleteRun.mutateAsync(confirm);
          } catch (err) {
            // Silent error handling
          }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  PROJECTS
// ─────────────────────────────────────────────
export function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const createProj = useCreateProject();
  const updateProj = useUpdateProject();
  const deleteProj = useDeleteProject();
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'Active',
    color: 'av-blue',
  });

  const tabs = ['all', 'Active', 'Inactive'];
  const tabLabels = ['All', 'Active', 'Inactive'];

  // Filter projects based on tab
  const filteredProjects = tab === 'all' ? projects : projects.filter(p => p.status === tab);

  const open = (p = null) => {
    setEditId(p?.id || null);
    setForm(
      p
        ? {
            name: p.name,
            description: p.description || '',
            status: p.status || 'Active',
            color: p.color || 'av-blue',
          }
        : { name: '', description: '', status: 'Active', color: 'av-blue' }
    );
    setModal(true);
  };
  const save = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        await updateProj.mutateAsync({ id: editId, ...form });
      } else {
        await createProj.mutateAsync(form);
      }
      setModal(false);
    } catch (err) {
      // Silent error handling
    }
  };

  const colors = [
    { value: 'av-blue', label: 'Blue' },
    { value: 'av-green', label: 'Green' },
    { value: 'av-violet', label: 'Violet' },
    { value: 'av-red', label: 'Red' },
    { value: 'av-amber', label: 'Amber' },
    { value: 'av-cyan', label: 'Cyan' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Main topbar with title and metrics */}
      <div className="topbar">
        <div className="topbar-l">
          <div className="page-title">Projects</div>
        </div>
        <div className="topbar-r" style={{ gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Total:</span>
            <span className="nb nb-violet">{projects.length || 0}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Active:</span>
            <span className="nb nb-green">
              {projects.filter(p => p.status === 'Active').length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="topbar" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="topbar-l" style={{ gap: 0, flex: 1 }}>
          {tabs.map((t, i) => {
            const count =
              t === 'all' ? projects.length : projects.filter(p => p.status === t).length;
            return (
              <button
                key={t}
                className={`tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {tabLabels[i]}{' '}
                <span
                  style={{
                    background: 'var(--surface)',
                    padding: '2px 6px',
                    borderRadius: 'var(--r4)',
                    fontSize: 11,
                    marginLeft: 6,
                    color: 'var(--text2)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="topbar-r">
          <button className="btn btn-sm btn-primary" onClick={() => open()}>
            + New Project
          </button>
        </div>
      </div>

      <div className="content">
        {isLoading ? (
          <div className="loading-screen" style={{ height: 200 }}>
            <div className="spinner" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>
            No projects in this category.{' '}
            {tab === 'all' && 'Create one to organize your test cases.'}
          </div>
        ) : (
          <div className="card card-flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Description</th>
                  <th>Test Cases</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className={`av av-sm ${p.color}`}
                          style={{ fontWeight: 600, fontSize: 11 }}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                          {p.name}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: 'var(--text3)',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.description || '—'}
                    </td>
                    <td>
                      <span className="nb nb-blue">{p.test_case_count || 0}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${p.status === 'Active' ? 'pass' : 'pending'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 10, color: 'var(--text3)' }}>
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-xs" onClick={() => open(p)}>
                          Edit
                        </button>
                        <button className="btn btn-xs btn-danger" onClick={() => setConfirm(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Project' : 'Create Project'}
        size="sm"
      >
        <div className="fg">
          <label className="fl">Project Name *</label>
          <input
            className="fi"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Payment Module"
          />
        </div>
        <div className="fg">
          <label className="fl">Description</label>
          <textarea
            className="fi fi-ta"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of the project"
          />
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Status</label>
            <select
              className="fi fi-sel"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Color</label>
            <select
              className="fi fi-sel"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            >
              {colors.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setModal(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={createProj.isPending || updateProj.isPending}
          >
            Save
          </button>
        </div>
      </Modal>

      <Confirm
        open={!!confirm}
        title="Delete Project"
        message="Delete this project? Test cases will remain unassigned."
        onConfirm={async () => {
          try {
            await deleteProj.mutateAsync(confirm);
          } catch (err) {
            // Silent error handling
          }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  DEV CONNECT
// ─────────────────────────────────────────────
export function DevConnect() {
  const { data: devs = [] } = useDevelopers();
  const { data: bugs = [] } = useBugs({ status: 'Open' });
  const { data: comments = [] } = useComments({ is_dev_thread: true });
  const postCmt = usePostComment();
  const createDev = useCreateDev(),
    deleteDev = useDeleteDev();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    initials: '',
    specialisation: 'Backend',
    avatar_color: 'av-green',
  });
  const save = async () => {
    if (!form.name.trim()) return;
    try {
      await createDev.mutateAsync(form);
      setModal(false);
    } catch (err) {
      // Silent error handling
    }
  };
  const devWithBugs = devs.filter(d => bugs.find(b => b.developer_id === d.id)).length;
  const devNoBugs = devs.filter(d => !bugs.find(b => b.developer_id === d.id)).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar">
        <div className="topbar-l">
          <div className="page-title">Dev Connect</div>
          <div className="breadcrumb">
            Total: {devs.length} · With Bugs: {devWithBugs} · Available: {devNoBugs}
          </div>
        </div>
        <div className="topbar-r">
          <button className="btn btn-sm btn-primary" onClick={() => setModal(true)}>
            + Link Developer
          </button>
        </div>
      </div>
      <div className="content">
        <div className="split">
          <div>
            <div className="sec-lbl">Developer team</div>
            <div className="card">
              {devs.map(d => {
                const openBugs = bugs.filter(b => b.developer_id === d.id).length;
                return (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '11px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <Avatar initials={d.initials} color={d.avatar_color} size="md" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        {d.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text3)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {d.specialisation} · {openBugs} bugs assigned
                      </div>
                    </div>
                    <Badge status={openBugs ? 'In Progress' : 'Pass'} />
                    <button
                      className="btn btn-xs btn-danger"
                      onClick={async () => {
                        try {
                          await deleteDev.mutateAsync(d.id);
                        } catch (err) {
                          // Silent error handling
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="sec-lbl" style={{ marginTop: 14 }}>
              Bugs awaiting dev action
            </div>
            <div className="card card-flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Developer</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bugs.map(b => {
                    const dev = devs.find(d => d.id === b.developer_id);
                    return (
                      <tr key={b.id}>
                        <td className="mono" style={{ color: 'var(--text3)' }}>
                          {b.bug_id}
                        </td>
                        <td
                          className="pk"
                          style={{
                            maxWidth: 140,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.title}
                        </td>
                        <td>
                          {dev ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className={`av av-sm ${dev.avatar_color}`}>{dev.initials}</div>
                              <span style={{ fontSize: 11 }}>{dev.name}</span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <Badge status={b.severity} />
                        </td>
                        <td>
                          <Badge status={b.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="sec-lbl">Team thread</div>
            <div className="comment-thread">
              <CommentThread
                comments={comments}
                onPost={async text => {
                  try {
                    await postCmt.mutateAsync({ body: text, is_dev_thread: true });
                  } catch (err) {
                    // Silent error handling
                  }
                }}
                loading={postCmt.isPending}
              />
            </div>
          </div>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Link Developer" size="sm">
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Name *</label>
            <input
              className="fi"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="fg">
            <label className="fl">Initials</label>
            <input
              className="fi"
              value={form.initials}
              onChange={e => setForm(f => ({ ...f, initials: e.target.value.toUpperCase() }))}
              maxLength={3}
            />
          </div>
        </div>
        <div className="form-row2">
          <div className="fg">
            <label className="fl">Specialisation</label>
            <select
              className="fi fi-sel"
              value={form.specialisation}
              onChange={e => setForm(f => ({ ...f, specialisation: e.target.value }))}
            >
              {['Backend', 'Frontend', 'Full Stack', 'Mobile', 'DevOps'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Avatar Color</label>
            <select
              className="fi fi-sel"
              value={form.avatar_color}
              onChange={e => setForm(f => ({ ...f, avatar_color: e.target.value }))}
            >
              {['av-green', 'av-blue', 'av-violet', 'av-cyan'].map(c => (
                <option key={c} value={c}>
                  {c.replace('av-', '')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" onClick={() => setModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Link Developer
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────
export function Reports() {
  const { data: summary } = useReportSummary();
  const { data: testerPerf = [] } = useTesterPerformance();
  const { data: bugs = [] } = useBugs();
  if (!summary)
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  const tcs = summary.testCases || [],
    total = tcs.reduce((a, r) => a + parseInt(r.count), 0);
  const passed = parseInt(tcs.find(r => r.status === 'Pass')?.count || 0);
  const failed = parseInt(tcs.find(r => r.status === 'Fail')?.count || 0);
  const openBugs = bugs.filter(b => b.status === 'Open' || b.status === 'In Progress').length;
  const resolved = bugs.filter(b => b.status === 'Resolved' || b.status === 'Closed').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar">
        <div className="topbar-l">
          <div className="page-title">Reports & Analytics</div>
        </div>
        <div className="topbar-r">
          <button
            className="btn btn-sm btn-primary"
            onClick={() =>
              exportToCSV(
                [
                  ['Category', 'Value'],
                  ['Total TCs', total],
                  ['Passed', passed],
                  ['Failed', failed],
                  ['Open Bugs', openBugs],
                  ['Resolved Bugs', resolved],
                ],
                'report-summary.csv'
              )
            }
          >
            ↓ Export
          </button>
        </div>
      </div>
      <div className="content">
        <div className="metrics-grid">
          <MetricCard
            value={total}
            label="Total Test Cases"
            delta={`${total ? Math.round((passed / total) * 100) : 0}% pass rate`}
            deltaType="up"
          />
          <MetricCard
            value={passed}
            label="Passed"
            delta={`${failed} failed`}
            deltaType={failed > 0 ? 'dn' : 'up'}
          />
          <MetricCard
            value={bugs.length}
            label="Total Bugs"
            delta={`${openBugs} open`}
            deltaType={openBugs > 5 ? 'dn' : 'neu'}
          />
          <MetricCard
            value={resolved}
            label="Bugs Resolved"
            delta={`${bugs.length ? Math.round((resolved / bugs.length) * 100) : 0}% resolved`}
            deltaType="up"
          />
        </div>
        <div className="split">
          <div>
            <div className="sec-lbl">Test status breakdown</div>
            <div className="card">
              {[
                ['Pass', passed, 'var(--green)'],
                ['Fail', failed, 'var(--red)'],
                [
                  'In Progress',
                  parseInt(tcs.find(r => r.status === 'In Progress')?.count || 0),
                  'var(--accent)',
                ],
                [
                  'Pending',
                  parseInt(tcs.find(r => r.status === 'Pending')?.count || 0),
                  'var(--text3)',
                ],
              ].map(([lbl, n, col]) => (
                <div
                  key={lbl}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 80 }}>{lbl}</span>
                  <div style={{ flex: 1 }}>
                    <div className="pbar">
                      <div
                        className="pbar-fill"
                        style={{
                          width: `${total ? Math.round((n / total) * 100) : 0}%`,
                          background: col,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text3)',
                      width: 50,
                      textAlign: 'right',
                    }}
                  >
                    {n} ({total ? Math.round((n / total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
            <div className="sec-lbl" style={{ marginTop: 14 }}>
              By module
            </div>
            <div className="card card-flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Total</th>
                    <th>Pass</th>
                    <th>Fail</th>
                    <th>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const mods = {};
                    (summary.byModule || []).forEach(r => {
                      if (!mods[r.module]) mods[r.module] = { total: 0, pass: 0, fail: 0 };
                      mods[r.module].total += parseInt(r.count);
                      if (r.status === 'Pass') mods[r.module].pass += parseInt(r.count);
                      if (r.status === 'Fail') mods[r.module].fail += parseInt(r.count);
                    });
                    return Object.entries(mods).map(([m, v]) => (
                      <tr key={m}>
                        <td className="pk">{m}</td>
                        <td>{v.total}</td>
                        <td style={{ color: 'var(--green)' }}>{v.pass}</td>
                        <td style={{ color: 'var(--red)' }}>{v.fail}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div className="pbar" style={{ width: 60 }}>
                              <div
                                className="pbar-fill green"
                                style={{
                                  width: `${v.total ? Math.round((v.pass / v.total) * 100) : 0}%`,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: 'var(--text3)',
                              }}
                            >
                              {v.total ? Math.round((v.pass / v.total) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="sec-lbl">Tester performance</div>
            <div className="card card-flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Tester</th>
                    <th>Cases</th>
                    <th>Passed</th>
                    <th>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {testerPerf.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className={`av av-sm ${t.avatar_color}`}>{t.initials}</div>
                          {t.name}
                        </div>
                      </td>
                      <td>{t.total}</td>
                      <td style={{ color: 'var(--green)' }}>{t.passed}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="pbar" style={{ width: 50 }}>
                            <div className="pbar-fill green" style={{ width: `${t.pass_rate}%` }} />
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              color: 'var(--text3)',
                            }}
                          >
                            {t.pass_rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sec-lbl" style={{ marginTop: 14 }}>
              Bug severity
            </div>
            <div className="card">
              {['Critical', 'High', 'Medium', 'Low'].map(s => {
                const n = bugs.filter(b => b.severity === s).length;
                const cols = {
                  Critical: 'var(--red)',
                  High: 'var(--red)',
                  Medium: 'var(--amber)',
                  Low: 'var(--green)',
                };
                return (
                  <div
                    key={s}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--text2)', width: 60 }}>{s}</span>
                    <div style={{ flex: 1 }}>
                      <div className="pbar">
                        <div
                          className="pbar-fill"
                          style={{
                            width: `${bugs.length ? Math.round((n / bugs.length) * 100) : 0}%`,
                            background: cols[s],
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text3)',
                        width: 30,
                        textAlign: 'right',
                      }}
                    >
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────────────
export function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePass = useChangePassword();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    initials: user?.initials || '',
    role: user?.role || '',
    avatar_color: user?.avatar_color || 'av-blue',
  });
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passErr, setPassErr] = useState('');
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    team_type: 'qa_engineer',
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserMsg, setCreateUserMsg] = useState(null);

  const saveProfile = async () => {
    try {
      const updated = await updateProfile.mutateAsync(profile);
      updateUser(updated);
    } catch (err) {
      // Silent error handling
    }
  };

  const savePass = async () => {
    setPassErr('');
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassErr('Passwords do not match');
      return;
    }
    if (passForm.newPassword.length < 8) {
      setPassErr('Password must be at least 8 characters');
      return;
    }
    try {
      await changePass.mutateAsync({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      // Silent error handling
    }
  };

  const handleCreateUser = async () => {
    setCreateUserLoading(true);
    setCreateUserMsg(null);
    try {
      const response = await api.post('/auth/create-user', createUserForm);
      const data = response.data;

      setCreateUserMsg({
        success: true,
        data: data.user,
        message: `User created successfully!\n\nEmail: ${data.user.email}\nTemporary Password: ${data.user.temporary_password}\n\nShare these credentials with the user.`,
      });
      setCreateUserForm({ name: '', email: '', team_type: 'qa_engineer' });
    } catch (err) {
      setCreateUserMsg({
        success: false,
        message: err.response?.data?.error || err.message || 'Failed to create user',
      });
    } finally {
      setCreateUserLoading(false);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="topbar">
        <div className="topbar-l">
          <div className="page-title">Settings</div>
        </div>
      </div>
      <div className="content">
        <div style={{ maxWidth: 560 }}>
          {user?.role === 'admin' && (
            <>
              <div className="sec-lbl">Admin - Create User</div>
              <div className="card">
                <div className="fg">
                  <label className="fl">User Name</label>
                  <input
                    className="fi"
                    placeholder="John Doe"
                    value={createUserForm.name}
                    onChange={e => setCreateUserForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Email</label>
                  <input
                    className="fi"
                    placeholder="john@example.com"
                    type="email"
                    value={createUserForm.email}
                    onChange={e => setCreateUserForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Role</label>
                  <select
                    className="fi fi-sel"
                    value={createUserForm.team_type}
                    onChange={e => setCreateUserForm(p => ({ ...p, team_type: e.target.value }))}
                  >
                    <option value="qa_engineer">QA Engineer</option>
                    <option value="developer">Developer</option>
                  </select>
                </div>
                {createUserMsg && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: createUserMsg.success ? '#10b981' : '#ef4444',
                      color: 'white',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {createUserMsg.success
                      ? `✅ ${createUserMsg.message}`
                      : `❌ ${createUserMsg.message}`}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateUser}
                  disabled={createUserLoading}
                >
                  {createUserLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </>
          )}
          <div className="sec-lbl">{user?.role === 'admin' ? 'Profile' : ''}</div>
          <div className="card">
            <div className="form-row2">
              <div className="fg">
                <label className="fl">Display Name</label>
                <input
                  className="fi"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="fg">
                <label className="fl">Initials</label>
                <input
                  className="fi"
                  value={profile.initials}
                  onChange={e =>
                    setProfile(p => ({ ...p, initials: e.target.value.toUpperCase() }))
                  }
                  maxLength={3}
                />
              </div>
            </div>
            <div className="form-row2">
              <div className="fg">
                <label className="fl">Role</label>
                <input
                  className="fi"
                  value={profile.role}
                  onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                />
              </div>
              <div className="fg">
                <label className="fl">Avatar Color</label>
                <select
                  className="fi fi-sel"
                  value={profile.avatar_color}
                  onChange={e => setProfile(p => ({ ...p, avatar_color: e.target.value }))}
                >
                  {['av-blue', 'av-green', 'av-amber', 'av-violet', 'av-red', 'av-cyan'].map(c => (
                    <option key={c} value={c}>
                      {c.replace('av-', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={saveProfile}
              disabled={updateProfile.isPending}
            >
              Save Profile
            </button>
          </div>
          <div className="sec-lbl" style={{ marginTop: 16 }}>
            Change Password
          </div>
          <div className="card">
            <div className="fg">
              <label className="fl">Current Password</label>
              <input
                className="fi"
                type="password"
                value={passForm.currentPassword}
                onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>
            <div className="form-row2">
              <div className="fg">
                <label className="fl">New Password</label>
                <input
                  className="fi"
                  type="password"
                  value={passForm.newPassword}
                  onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                />
              </div>
              <div className="fg">
                <label className="fl">Confirm</label>
                <input
                  className="fi"
                  type="password"
                  value={passForm.confirmPassword}
                  onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            {passErr && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--red)',
                  marginBottom: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {passErr}
              </div>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={savePass}
              disabled={changePass.isPending}
            >
              Change Password
            </button>
          </div>
          <div className="sec-lbl" style={{ marginTop: 16 }}>
            Security
          </div>
          <div className="card">
            <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text2)' }}>
                Manage your security settings including two-factor authentication, view activity
                logs, and more.
              </p>
              <button onClick={() => navigate('/security')} className="btn btn-primary btn-sm">
                Manage Security Settings →
              </button>
            </div>
          </div>
          <div className="sec-lbl" style={{ marginTop: 16 }}>
            Platform Info
          </div>
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {[
                ['Version', 'TestFlow Pro v1.0'],
                ['Environment', import.meta.env.VITE_ENV || 'development'],
                ['API URL', import.meta.env.VITE_API_URL],
                ['User Role', user?.role],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-danger" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PASSWORD RESET PAGE
// ─────────────────────────────────────────────
export { PasswordResetPage } from './PasswordResetPage';

// ─────────────────────────────────────────────
//  SECURITY SETTINGS PAGE
// ─────────────────────────────────────────────
export { SecuritySettingsPage } from './SecuritySettingsPage';

// ─────────────────────────────────────────────
//  LOGS DASHBOARD
// ─────────────────────────────────────────────
export { default as Logs } from './Logs';
