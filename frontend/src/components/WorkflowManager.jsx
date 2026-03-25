import { useEffect, useState } from 'react';
import api from '../../utils/api';
import '../styles/workflow.css';

export default function WorkflowManager({ projectId, testcaseId, currentState, onStateChange }) {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newState, setNewState] = useState({ name: '', color: '#5B8DEE', isDefault: false });
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/workflow/states/${projectId}`);
      setStates(data);
    } catch (err) {
      console.error('Failed to load workflow states:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const user = await api.get('/auth/me');
      const r = user?.role?.toLowerCase();
      setIsAdmin(r === 'admin' || r === 'project_admin');
    } catch (err) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchStates();
      checkAdminStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCreateState = async () => {
    if (!newState.name.trim()) return;

    try {
      await api.post(`/workflow/states/${projectId}`, newState);
      setNewState({ name: '', color: '#5B8DEE', isDefault: false });
      setShowForm(false);
      fetchStates();
    } catch (err) {
      console.error('Failed to create state:', err);
    }
  };

  const handleTransition = async toState => {
    if (!testcaseId || currentState === toState) return;

    try {
      await api.put(`/workflow/transition/${testcaseId}`, {
        toState,
        notes: `Transitioned from ${currentState || 'N/A'} to ${toState}`,
      });
      onStateChange?.(toState);
    } catch (err) {
      console.error('Failed to transition state:', err);
    }
  };

  const handleDeleteState = async stateId => {
    if (!window.confirm('Delete this workflow state?')) return;

    try {
      await api.delete(`/workflow/states/${stateId}`);
      fetchStates();
    } catch (err) {
      console.error('Failed to delete state:', err);
    }
  };

  if (loading) return <div className="workflow-loading">Loading workflow states...</div>;

  return (
    <div className="workflow-manager">
      <div className="workflow-header">
        <h3>Workflow States</h3>
        {isAdmin && (
          <button className="btn-add" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕' : '+ Add State'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="workflow-form">
          <input
            type="text"
            placeholder="State name (e.g., In Review)"
            value={newState.name}
            onChange={e => setNewState({ ...newState, name: e.target.value })}
          />
          <input
            type="color"
            value={newState.color}
            onChange={e => setNewState({ ...newState, color: e.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={newState.isDefault}
              onChange={e => setNewState({ ...newState, isDefault: e.target.checked })}
            />
            Default for new test cases
          </label>
          <div className="form-buttons">
            <button className="btn-primary" onClick={handleCreateState}>
              Create
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="workflow-states">
        {states.map(state => (
          <div
            key={state.id}
            className={`state-card ${currentState === state.name ? 'active' : ''}`}
            style={{ borderLeft: `4px solid ${state.color}` }}
          >
            <div
              className="state-circle"
              style={{ backgroundColor: state.color }}
              onClick={() => testcaseId && handleTransition(state.name)}
              title={testcaseId ? 'Click to transition' : 'View state'}
            />
            <div className="state-info">
              <div className="state-name">{state.name}</div>
              {state.is_default && <span className="badge-default">Default</span>}
              {state.is_final && <span className="badge-final">Final</span>}
            </div>
            {isAdmin && (
              <button
                className="btn-delete"
                onClick={() => handleDeleteState(state.id)}
                title="Delete state"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
