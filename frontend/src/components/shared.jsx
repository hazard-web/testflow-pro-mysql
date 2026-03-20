import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

// ── MODAL ────────────────────────────────────
export function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => {
    const esc = e => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="modal-ov"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${size}`}>
        <div className="modal-hd">
          <div className="modal-title">{title}</div>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── CONFIRM DIALOG ────────────────────────────
export function Confirm({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className="confirm-ov">
      <div className="confirm-box">
        <div className="confirm-icon">⚠️</div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-msg">{message}</div>
        <div className="confirm-btns">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BADGE ─────────────────────────────────────
export function Badge({ status }) {
  const cls =
    {
      Pass: 'pass',
      Fail: 'fail',
      'In Progress': 'progress',
      Pending: 'pending',
      Blocked: 'blocked',
      Open: 'fail',
      Resolved: 'pass',
      Closed: 'pending',
      Critical: 'critical',
      High: 'high',
      Medium: 'med',
      Low: 'low',
    }[status] || 'pending';
  return <span className={`badge badge-${cls}`}>{status}</span>;
}

// ── AVATAR ────────────────────────────────────
export function Avatar({ initials = '?', color = 'av-blue', size = 'sm' }) {
  return <div className={`av av-${size} ${color}`}>{initials}</div>;
}

// ── PROGRESS BAR ─────────────────────────────
export function ProgressBar({ value, max = 100, color = '', label, showPct = true }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="pbar-wrap">
      {label && (
        <div className="pbar-lbl">
          <span>{label}</span>
          {showPct && <span>{pct}%</span>}
        </div>
      )}
      <div className="pbar">
        <div className={`pbar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── METRIC CARD ──────────────────────────────
export function MetricCard({ value, label, delta, deltaType = 'neu', icon }) {
  return (
    <div className="mcard">
      {icon && (
        <div
          className="mcard-icon"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
        >
          {icon}
        </div>
      )}
      <div className="mcard-val">{value}</div>
      <div className="mcard-lbl">{label}</div>
      {delta && <div className={`mcard-delta ${deltaType}`}>{delta}</div>}
    </div>
  );
}

// ── STEP BUILDER ─────────────────────────────
export function StepBuilder({ steps = [], onChange }) {
  const addStep = () => onChange([...steps, { action: '', expected: '' }]);
  const removeStep = i => onChange(steps.filter((_, idx) => idx !== i));
  const updateStep = (i, field, val) => {
    const updated = steps.map((s, idx) => (idx === i ? { ...s, [field]: val } : s));
    onChange(updated);
  };
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} className="sb-step">
          <div className="sb-num">{i + 1}</div>
          <input
            id={`step-${i}-action`}
            name={`step-${i}-action`}
            className="fi"
            style={{ flex: 1, marginRight: 5 }}
            placeholder="Step action"
            value={s.action}
            onChange={e => updateStep(i, 'action', e.target.value)}
          />
          <input
            id={`step-${i}-expected`}
            name={`step-${i}-expected`}
            className="fi"
            style={{ flex: 1 }}
            placeholder="Expected result"
            value={s.expected}
            onChange={e => updateStep(i, 'expected', e.target.value)}
          />
          {steps.length > 1 && (
            <button
              className="icon-btn"
              style={{ marginTop: 5, flexShrink: 0 }}
              onClick={() => removeStep(i)}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button className="btn btn-xs" onClick={addStep} style={{ marginTop: 6 }}>
        + Add Step
      </button>
    </div>
  );
}

// ── COMMENT THREAD ────────────────────────────
export function CommentThread({ comments = [], onPost, loading }) {
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  
  // Mock registered users - in production, fetch from API
  const registeredUsers = [
    { id: 1, name: 'Alex Kumar', initials: 'AK', role: 'QA' },
    { id: 2, name: 'Shivam Bhardwaj', initials: 'SB', role: 'Developer' },
    { id: 3, name: 'Priya Singh', initials: 'PS', role: 'QA Lead' },
    { id: 4, name: 'Rahul Verma', initials: 'RV', role: 'Developer' },
    { id: 5, name: 'Neha Patel', initials: 'NP', role: 'Product Manager' },
    { id: 6, name: 'Vikram Roy', initials: 'VR', role: 'QA' },
    { id: 7, name: 'Anjali Gupta', initials: 'AG', role: 'Tester' },
  ];
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);
  
  const handleTextChange = (e) => {
    const newText = e.target.value;
    const newPos = e.target.selectionStart;
    setText(newText);
    setCursorPos(newPos);
    
    // Check for @ mention
    const lastAtIndex = newText.lastIndexOf('@', newPos - 1);
    if (lastAtIndex !== -1) {
      const query = newText.substring(lastAtIndex + 1, newPos).trim();
      if (query.length > 0) {
        const filtered = registeredUsers.filter(u =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.initials.toLowerCase().includes(query.toLowerCase())
        );
        setMentions(filtered);
        setShowMentions(true);
        setMentionQuery(query);
      } else if (query === '') {
        setMentions(registeredUsers);
        setShowMentions(true);
        setMentionQuery('');
      }
    } else {
      setShowMentions(false);
      setMentions([]);
    }
  };
  
  const insertMention = (user) => {
    const lastAtIndex = text.lastIndexOf('@');
    const beforeAt = text.substring(0, lastAtIndex);
    const afterAt = text.substring(cursorPos);
    const newText = `${beforeAt}@${user.name} ${afterAt}`;
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };
  
  const handlePost = () => {
    if (!text.trim()) return;
    onPost(text);
    setText('');
    setShowMentions(false);
  };
  
  const renderBody = t => t.replace(/@(\w+\s?\w+)/g, '<span class="mention">@$1</span>');
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {comments.map(c => (
          <div key={c.id} className="cmt">
            <div className="cmt-hd">
              <div className={`av av-sm ${c.author_color}`}>{c.author_initials}</div>
              <span className="cmt-name">{c.author_name}</span>
              <span className={`cmt-role ${c.author_role}`}>{c.role_label}</span>
              <span className="cmt-time">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="cmt-body" dangerouslySetInnerHTML={{ __html: renderBody(c.body) }} />
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ 
        flexShrink: 0, 
        borderTop: '1px solid var(--border)', 
        paddingTop: 12,
        marginTop: 8,
        position: 'relative'
      }}>
        <div className="cmt-in-wrap">
          <textarea
            ref={inputRef}
            id="comment-input"
            name="comment-input"
            className="cmt-in"
            value={text}
            placeholder="Comment or @mention... (type @ to mention someone)"
            onChange={handleTextChange}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !showMentions) handlePost();
              if (e.key === 'Escape') setShowMentions(false);
            }}
          />
          
          {showMentions && mentions.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r8)',
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 1000,
              marginBottom: 4,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}>
              {mentions.map(user => (
                <div
                  key={user.id}
                  onClick={() => insertMention(user)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid var(--border)',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="av av-sm av-blue">{user.initials}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                      {user.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            className="btn btn-sm btn-primary"
            onClick={handlePost}
            disabled={loading || !text.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────
export function EmptyState({ icon = '📋', title, subtitle, action }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <div className="empty-t">{title}</div>
      {subtitle && <div className="empty-s">{subtitle}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// ── EXPORT CSV ────────────────────────────────
export function exportToCSV(rows, filename) {
  const csv = rows
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

// ── HELPERS ───────────────────────────────────
export const moduleColor = m =>
  ({
    Authentication: 'violet',
    Payments: 'amber',
    API: 'cyan',
    Performance: 'green',
    Security: 'red',
    Media: '',
  })[m] || '';
export const prioColor = p =>
  ({ Critical: 'red', High: 'amber', Medium: '', Low: 'green' })[p] || '';

// ── AI TEST CASE GENERATOR ────────────────────
export function AITestCaseGenerator({ open, onClose, onGenerate }) {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testCases, setTestCases] = useState([]);

  const handleGenerate = async () => {
    if (!requirement.trim()) {
      setError('Please enter a requirement');
      return;
    }

    setLoading(true);
    setError('');
    setTestCases([]);

    try {
      const response = await fetch('/api/ai/generate-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ requirement }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test cases');
      }

      setTestCases(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertTestCases = () => {
    if (testCases.length > 0) {
      onGenerate(testCases);
      setRequirement('');
      setTestCases([]);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-ov"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal lg">
        <div className="modal-hd">
          <div className="modal-title">🤖 AI Test Case Generator</div>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-bd" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {!testCases.length ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Requirement Description
                </label>
                <textarea
                  id="requirement-input"
                  name="requirement-input"
                  value={requirement}
                  onChange={e => setRequirement(e.target.value)}
                  placeholder="Enter requirement (e.g., 'User should be able to login with email and password')"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px',
                    marginBottom: '16px',
                    backgroundColor: '#fee',
                    color: '#c33',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={loading || !requirement.trim()}
                  style={{ minWidth: '140px' }}
                >
                  {loading ? '⏳ Generating...' : '✨ Generate'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--primary)' }}>
                  Generated Test Cases ({testCases.length})
                </h4>
                {testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: 'var(--bg2)',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                      {idx + 1}. {tc.title}
                      {tc.priority && (
                        <span
                          className={`badge badge-${prioColor(tc.priority)}`}
                          style={{ marginLeft: '8px' }}
                        >
                          {tc.priority}
                        </span>
                      )}
                    </div>
                    {tc.steps && tc.steps.length > 0 && (
                      <ol style={{ marginLeft: '20px', fontSize: '13px', lineHeight: '1.5' }}>
                        {tc.steps.map((step, sidx) => (
                          <li key={sidx} style={{ marginBottom: '4px' }}>
                            <strong>{step.action}</strong> → {step.expected}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setTestCases([])}>
                  ← Back
                </button>
                <button className="btn btn-primary" onClick={handleInsertTestCases}>
                  ✓ Insert These
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
