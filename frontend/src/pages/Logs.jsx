import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/logs.css';

const LogsDashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    currentPage: 1,
  });

  // Action types to display in filter dropdown
  const actionTypes = [
    'login',
    'logout',
    'password_reset',
    'two_fa_enabled',
    'two_fa_disabled',
    'account_locked',
    'password_changed',
    'email_verified',
    'created_resource',
    'updated_resource',
    'deleted_resource',
  ];

  // Fetch logs
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const offset = (page - 1) * pagination.limit;
      const query = new URLSearchParams({
        limit: pagination.limit,
        offset,
        ...(filters.action && { action: filters.action }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await api.get(`/audit-logs?${query}`);
      setLogs(response.data.data);
      setSummary(response.data.summary || {});
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        offset,
        currentPage: page,
      }));
    } catch (err) {
      setError('Failed to load logs: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      status: '',
      search: '',
      startDate: '',
      endDate: '',
    });
    fetchLogs(1);
  };

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      fetchLogs(newPage);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="logs-container">
        <div className="error-box">
          <h2>🔒 Access Denied</h2>
          <p>Only administrators can view the logs dashboard.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="logs-container">
      {/* Header */}
      <div className="logs-header">
        <div className="logs-title">
          <h1>📊 Access Logs Dashboard</h1>
          <p>Monitor all user activities, access attempts, and security events</p>
        </div>

        {/* Summary Cards */}
        <div className="logs-summary">
          <div className="summary-card">
            <div className="summary-icon">📋</div>
            <div className="summary-content">
              <span className="summary-label">Total Logs</span>
              <span className="summary-value">{pagination.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <span className="summary-label">Total Users</span>
              <span className="summary-value">{summary.total_users?.count || 0}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🔐</div>
            <div className="summary-content">
              <span className="summary-label">Admins</span>
              <span className="summary-value">{summary.total_admins?.count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="logs-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by name, email, IP, or action..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>⚡ Action</label>
            <select
              value={filters.action}
              onChange={e => handleFilterChange('action', e.target.value)}
              className="filter-input"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>✅ Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="filter-input"
            >
              <option value="">All Statuses</option>
              <option value="success">✓ Success</option>
              <option value="failure">✗ Failure</option>
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>📅 Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>📅 End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-actions">
            <button onClick={handleApplyFilters} className="btn-filter-apply">
              Apply Filters
            </button>
            <button onClick={handleClearFilters} className="btn-filter-clear">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="logs-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className={`log-row status-${log.status}`}>
                    <td className="timestamp">
                      <span className="time">{new Date(log.created_at).toLocaleString()}</span>
                    </td>
                    <td className="user-name">
                      <div className="user-badge">
                        <span
                          className="avatar"
                          style={{ backgroundColor: `var(--${log.avatar_color})` }}
                        >
                          {log.initials}
                        </span>
                        <span>{log.user_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="user-email">{log.user_email || '-'}</td>
                    <td className="user-role">
                      <span className={`role-badge role-${log.user_role}`}>
                        {log.user_role || 'N/A'}
                      </span>
                    </td>
                    <td className="action">
                      <span className="action-badge">{log.action}</span>
                    </td>
                    <td className="ip-address" title={log.user_agent || 'No user agent'}>
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="status">
                      <span className={`status-badge status-${log.status}`}>
                        {log.status === 'success' ? '✓ Success' : '✗ Failure'}
                      </span>
                    </td>
                    <td className="details">
                      <button
                        className="btn-view-details"
                        title={`Entity: ${log.entity_type} | ID: ${log.entity_id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="btn-pagination"
              >
                ← Previous
              </button>

              <div className="pagination-info">
                Page <span className="current-page">{pagination.currentPage}</span> of{' '}
                <span className="total-pages">{totalPages}</span> | Showing{' '}
                <span className="log-count">{logs.length}</span> of{' '}
                <span className="total-count">{pagination.total}</span> logs
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === totalPages}
                className="btn-pagination"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>📭 No Logs Found</h2>
            <p>
              {Object.values(filters).some(f => f)
                ? 'Try adjusting your filters to find logs.'
                : 'No access logs recorded yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsDashboard;
