// ─────────────────────────────────────────────
//  Security Settings Page
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// eslint-disable-next-line no-unused-vars
function _TabComponent({ tabs, active, onSwitch }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSwitch(tab.id)}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: active === tab.id ? 'var(--accent)' : 'var(--text2)',
            fontSize: '14px',
            fontWeight: active === tab.id ? '600' : '500',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function _ModalComponent({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 1000,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text2)',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </>
  );
}

export function SecuritySettingsPage() {
  useAuth(); // Ensure user is authenticated
  const [tab, setTab] = useState('2fa');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  // 2FA State
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  // Activity Log State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Password Change State
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    // Check 2FA status
    checkTwoFAStatus();
    // Load activity logs
    loadActivityLogs();
  }, []);

  const checkTwoFAStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = await res.json();
      if (res.ok) setTwoFaEnabled(data.enabled);
    } catch (e) {
      console.error('Failed to check 2FA status');
    }
  };

  const loadActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/audit-logs/my-activity?limit=20&offset=0', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = await res.json();
      if (res.ok) setLogs(data.data || []);
    } catch (e) {
      console.error('Failed to load activity logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const setupTwoFA = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes || []);
      setShowQR(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmTwoFA = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ code: twoFACode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('✓ 2FA enabled successfully!');
      setTwoFaEnabled(true);
      setShowQR(false);
      setShowBackupCodes(false);
      setTwoFACode('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFA = async () => {
    if (!confirm('Are you sure? This will disable 2FA on your account.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!res.ok) throw new Error('Failed to disable 2FA');

      setSuccess('✓ 2FA disabled');
      setTwoFaEnabled(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async e => {
    e.preventDefault();
    setPwdLoading(true);
    setErr('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          currentPassword: pwdForm.current,
          newPassword: pwdForm.newPwd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('✓ Password changed successfully');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setPwdLoading(false);
    }
  };

  const validatePassword = pwd => pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, marginBottom: '8px' }}>
          Security Settings
        </h1>
        <p style={{ margin: 0, color: 'var(--text2)', fontSize: '14px' }}>
          Manage your account security and privacy
        </p>
      </div>

      {success && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--green)',
            color: 'white',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {success}
        </div>
      )}

      {err && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--red-dim)',
            border: '1px solid var(--red-border)',
            color: 'var(--red)',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {err}
        </div>
      )}

      <Tab
        tabs={[
          { id: '2fa', label: '🔐 Two-Factor Auth' },
          { id: 'password', label: '🔑 Password' },
          { id: 'activity', label: '📊 Activity Log' },
        ]}
        active={tab}
        onSwitch={setTab}
      />

      {/* 2FA Tab */}
      {tab === '2fa' && (
        <div>
          <div
            style={{
              padding: '20px',
              background: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                  Two-Factor Authentication
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)' }}>
                  {twoFaEnabled
                    ? '✓ Enabled'
                    : 'Protect your account with a second authentication factor'}
                </p>
              </div>
              {twoFaEnabled ? (
                <button
                  onClick={disableTwoFA}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red-border)',
                    color: 'var(--red)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={setupTwoFA}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Enable 2FA
                </button>
              )}
            </div>
          </div>

          {!twoFaEnabled && (
            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6' }}>
              <p>Two-factor authentication adds an extra layer of security to your account:</p>
              <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                <li>
                  Requires an authenticator app (Google Authenticator, Authy, Microsoft
                  Authenticator)
                </li>
                <li>
                  You'll need to enter a 6-digit code in addition to your password when logging in
                </li>
                <li>
                  Keep your backup codes safe - you can use them if you lose access to your
                  authenticator
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div>
          <div
            style={{
              padding: '24px',
              background: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <form onSubmit={changePassword}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Current Password
                </label>
                <input
                  type="password"
                  value={pwdForm.current}
                  onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  New Password
                </label>
                <input
                  type="password"
                  value={pwdForm.newPwd}
                  onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                  }}
                />
                {pwdForm.newPwd && (
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    <div
                      style={{
                        color: pwdForm.newPwd.length >= 8 ? 'var(--green)' : 'var(--text3)',
                      }}
                    >
                      ✓ At least 8 characters
                    </div>
                    <div
                      style={{
                        color: /[A-Z]/.test(pwdForm.newPwd) ? 'var(--green)' : 'var(--text3)',
                      }}
                    >
                      ✓ Uppercase letter
                    </div>
                    <div
                      style={{
                        color: /[0-9]/.test(pwdForm.newPwd) ? 'var(--green)' : 'var(--text3)',
                      }}
                    >
                      ✓ Number
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border:
                      pwdForm.confirm && pwdForm.newPwd !== pwdForm.confirm
                        ? '1px solid var(--red-border)'
                        : '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={
                  pwdLoading ||
                  !validatePassword(pwdForm.newPwd) ||
                  pwdForm.newPwd !== pwdForm.confirm
                }
                style={{
                  padding: '10px 20px',
                  background:
                    pwdLoading ||
                    !validatePassword(pwdForm.newPwd) ||
                    pwdForm.newPwd !== pwdForm.confirm
                      ? 'var(--text3)'
                      : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {pwdLoading ? '🔄 Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div>
          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
              Loading activity...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
              No activity logged yet
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--surface)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text)',
                      }}
                    >
                      Action
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text)',
                      }}
                    >
                      Date & Time
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--text)',
                      }}
                    >
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text)' }}>
                        <div style={{ fontWeight: '500' }}>{log.action}</div>
                        <div style={{ color: 'var(--text3)', fontSize: '12px' }}>
                          {log.entity_type}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px' }}>
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2FA Setup Modal */}
      <Modal
        open={showQR}
        onClose={() => {
          setShowQR(false);
          setTwoFACode('');
        }}
        title="Set Up Two-Factor Authentication"
      >
        <div>
          {!showBackupCodes ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc):
              </p>

              {qrCode && (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '300px' }} />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Enter 6-digit code from your authenticator:
                </label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '16px',
                    textAlign: 'center',
                    letterSpacing: '4px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowQR(false);
                    setTwoFACode('');
                  }}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTwoFA}
                  disabled={twoFACode.length !== 6 || loading}
                  style={{
                    padding: '10px 16px',
                    background:
                      twoFACode.length === 6 && !loading ? 'var(--accent)' : 'var(--text3)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>

              <button
                onClick={() => setShowBackupCodes(true)}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                View Backup Codes
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
                📋 Save these backup codes in a safe place. You can use them if you lose access to
                your authenticator:
              </p>

              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '20px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              >
                {backupCodes.map((code, i) => (
                  <div key={i} style={{ marginBottom: i < backupCodes.length - 1 ? '8px' : 0 }}>
                    {code}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'));
                  alert('Backup codes copied to clipboard!');
                }}
                style={{
                  width: '100%',
                  marginBottom: '12px',
                  padding: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                📋 Copy to Clipboard
              </button>

              <button
                onClick={() => setShowBackupCodes(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Back to Setup
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
