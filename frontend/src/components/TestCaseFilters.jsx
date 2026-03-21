// ─────────────────────────────────────────────
//  Test Case Advanced Filters
// ─────────────────────────────────────────────
import { useState } from 'react';
import './testcase-filters.css';

export function TestCaseFilters({
  filters,
  onFiltersChange,
  modules = [],
  testers = [],
  projects = [],
}) {
  const [expanded, setExpanded] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  });

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateChange = (type, value) => {
    const newRange = { ...dateRange, [type]: value };
    setDateRange(newRange);
    onFiltersChange({
      ...filters,
      startDate: newRange.startDate,
      endDate: newRange.endDate,
    });
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    onFiltersChange({
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
  };

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.module,
    filters.tester_id,
    filters.project_id,
    filters.environment,
    filters.type,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <div className="tc-filters">
      {/* Search Bar */}
      <div className="filter-row-main">
        <div className="search-wrap-main">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search test cases by name, description..."
            value={filters.search || ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="search-input-main"
          />
        </div>

        <button
          className={`filter-toggle ${expanded ? 'active' : ''}`}
          onClick={() => setExpanded(!expanded)}
        >
          <span>⚙️ Filters</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Expandable Filters */}
      {expanded && (
        <div className="filter-panel">
          <div className="filter-grid">
            {/* Project */}
            <div className="filter-group">
              <label>Project</label>
              <select
                value={filters.project_id || ''}
                onChange={e => handleFilterChange('project_id', e.target.value)}
                className="filter-select"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div className="filter-group">
              <label>Module</label>
              <select
                value={filters.module || ''}
                onChange={e => handleFilterChange('module', e.target.value)}
                className="filter-select"
              >
                <option value="">All Modules</option>
                {modules.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status || ''}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                {['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'].map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="filter-group">
              <label>Priority</label>
              <select
                value={filters.priority || ''}
                onChange={e => handleFilterChange('priority', e.target.value)}
                className="filter-select"
              >
                <option value="">All Priority</option>
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Tester */}
            <div className="filter-group">
              <label>Assigned to</label>
              <select
                value={filters.tester_id || ''}
                onChange={e => handleFilterChange('tester_id', e.target.value)}
                className="filter-select"
              >
                <option value="">All Testers</option>
                {testers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Environment */}
            <div className="filter-group">
              <label>Environment</label>
              <select
                value={filters.environment || ''}
                onChange={e => handleFilterChange('environment', e.target.value)}
                className="filter-select"
              >
                <option value="">All Environments</option>
                {['Development', 'Staging', 'Production', 'QA'].map(e => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="filter-group">
              <label>Type</label>
              <select
                value={filters.type || ''}
                onChange={e => handleFilterChange('type', e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                {['Functional', 'Regression', 'Smoke', 'Performance', 'Integration'].map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Created Date (Start) */}
            <div className="filter-group">
              <label>Created From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={e => handleDateChange('startDate', e.target.value)}
                className="filter-date"
              />
            </div>

            {/* Created Date (End) */}
            <div className="filter-group">
              <label>Created To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={e => handleDateChange('endDate', e.target.value)}
                className="filter-date"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <div className="filter-footer">
              <button className="clear-filters-btn" onClick={clearFilters}>
                ✕ Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
