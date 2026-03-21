// ─────────────────────────────────────────────
//  Bulk Update Modal for Test Cases
// ─────────────────────────────────────────────
import { useState } from 'react';
import './bulk-operations.css';

export function BulkUpdateModal({ open, onClose, selectedCount, onConfirm, testers = [] }) {
  const [action, setAction] = useState('status');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!value) {
      alert('Please select a value');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(action, value);
      setValue('');
      setAction('status');
      onClose();
    } catch (err) {
      alert('Error updating test cases');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="bulk-modal">
        <div className="bulk-modal-header">
          <h2>Bulk Update Test Cases</h2>
          <button className="bulk-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="bulk-modal-body">
          <div className="bulk-info">
            <div className="bulk-badge">{selectedCount} items selected</div>
            <p>Choose what to update for all selected test cases:</p>
          </div>

          {/* Action Selector */}
          <div className="bulk-action-group">
            <label>What would you like to update?</label>
            <div className="action-buttons">
              <button
                className={`action-btn ${action === 'status' ? 'active' : ''}`}
                onClick={() => {
                  setAction('status');
                  setValue('');
                }}
              >
                Status
              </button>
              <button
                className={`action-btn ${action === 'priority' ? 'active' : ''}`}
                onClick={() => {
                  setAction('priority');
                  setValue('');
                }}
              >
                Priority
              </button>
              <button
                className={`action-btn ${action === 'tester_id' ? 'active' : ''}`}
                onClick={() => {
                  setAction('tester_id');
                  setValue('');
                }}
              >
                Assign To
              </button>
            </div>
          </div>

          {/* Value Selector */}
          <div className="bulk-value-group">
            <label>Select {action === 'status' ? 'Status' : action === 'priority' ? 'Priority' : 'Tester'}:</label>

            {action === 'status' && (
              <select
                value={value}
                onChange={e => setValue(e.target.value)}
                className="bulk-select"
              >
                <option value="">— Choose Status —</option>
                {['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'].map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {action === 'priority' && (
              <select
                value={value}
                onChange={e => setValue(e.target.value)}
                className="bulk-select"
              >
                <option value="">— Choose Priority —</option>
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {action === 'tester_id' && (
              <select
                value={value}
                onChange={e => setValue(e.target.value)}
                className="bulk-select"
              >
                <option value="">— Choose Tester —</option>
                {testers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preview */}
          {value && (
            <div className="bulk-preview">
              <div className="preview-item">
                <span>Action:</span>
                <strong>
                  {action === 'status' && 'Update Status'}
                  {action === 'priority' && 'Update Priority'}
                  {action === 'tester_id' && 'Assign Tester'}
                </strong>
              </div>
              <div className="preview-item">
                <span>Value:</span>
                <strong>{value}</strong>
              </div>
              <div className="preview-item">
                <span>Affected Items:</span>
                <strong>{selectedCount} test cases</strong>
              </div>
            </div>
          )}
        </div>

        <div className="bulk-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!value || loading}
          >
            {loading ? '⏳ Updating...' : '✓ Update'}
          </button>
        </div>
      </div>
    </>
  );
}
