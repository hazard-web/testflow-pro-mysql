// ─────────────────────────────────────────────
//  Test Case Advanced Filters - Sleek Inline Design
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { trackFilterHistory, getAutocompleteSuggestions } from '../utils/searchParser';
import './testcase-filters.css';

export function TestCaseFilters({
  filters,
  onFiltersChange,
  modules = [],
  testers = [],
  projects = [],
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState([]);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
  });
  const [timeRange, setTimeRange] = useState({
    startTime: filters.startTime || '',
    endTime: filters.endTime || '',
  });

  // Load presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tc_filter_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        // Handle corrupted data
      }
    }
  }, []);

  // Track filter history when filters change
  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(v => v);
    if (hasActiveFilters) {
      trackFilterHistory(filters);
    }
  }, [filters]);

  const savePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }
    const newPreset = {
      id: Date.now(),
      name: presetName,
      filters: { ...filters },
      createdAt: new Date().toLocaleString(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('tc_filter_presets', JSON.stringify(updated));
    setPresetName('');
    alert(`✓ Preset "${presetName}" saved!`);
  };

  const loadPreset = (preset) => {
    onFiltersChange(preset.filters);
    setDateRange({
      startDate: preset.filters.startDate || '',
      endDate: preset.filters.endDate || '',
    });
    setShowPresetMenu(false);
  };

  const deletePreset = (id) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('tc_filter_presets', JSON.stringify(updated));
  };

  const handleSearchChange = (value) => {
    onFiltersChange({ ...filters, search: value });
    
    // Show suggestions if input is long enough
    if (value.length > 2) {
      const sug = getAutocompleteSuggestions(value, { modules, testers, projects });
      setSuggestions(sug);
      setShowSuggestions(sug.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (suggestion) => {
    const newFilters = { ...filters };
    
    switch (suggestion.type) {
      case 'module':
        newFilters.module = suggestion.value;
        break;
      case 'project':
        newFilters.project_id = suggestion.id;
        break;
      case 'tester':
        newFilters.tester_id = suggestion.id;
        break;
      case 'status':
        newFilters.status = suggestion.value;
        break;
      default:
        break;
    }
    
    onFiltersChange(newFilters);
    setShowSuggestions(false);
    setSuggestions([]);
  };

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

  const handleTimeChange = (type, value) => {
    const newRange = { ...timeRange, [type]: value };
    setTimeRange(newRange);
    onFiltersChange({
      ...filters,
      startTime: newRange.startTime,
      endTime: newRange.endTime,
    });
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTimeRange({ startTime: '', endTime: '' });
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
      startTime: '',
      endTime: '',
    });
    setShowAdvanced(false);
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
    filters.startTime,
    filters.endTime,
  ].filter(Boolean).length;

  return (
    <div className="tc-filters-inline">
      {/* Main Filter Row */}
      <div className="filter-row-inline">
        {/* Search Input */}
        <div className="search-wrap-inline" style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, description, module... (AND, OR, NOT)"
            value={filters.search || ''}
            onChange={e => handleSearchChange(e.target.value)}
            className="search-input-inline"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions-inline">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  className="suggestion-item-inline"
                  onClick={() => applySuggestion(sug)}
                >
                  <span className="suggestion-type-inline">{sug.type}</span>
                  <span className="suggestion-value-inline">{sug.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <select
          value={filters.priority || ''}
          onChange={e => handleFilterChange('priority', e.target.value)}
          className="filter-select-inline"
          title="Priority"
        >
          <option value="">All Priorities</option>
          {['Critical', 'High', 'Medium', 'Low'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filters.module || ''}
          onChange={e => handleFilterChange('module', e.target.value)}
          className="filter-select-inline"
          title="Module"
        >
          <option value="">All Modules</option>
          {modules.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filters.status || ''}
          onChange={e => handleFilterChange('status', e.target.value)}
          className="filter-select-inline"
          title="Status"
        >
          <option value="">All Status</option>
          {['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Advanced Filters Toggle */}
        <button
          className="btn-advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Show advanced filters"
        >
          ⚙️ More
        </button>

        {/* Active Filters Indicator */}
        {activeFiltersCount > 0 && (
          <span className="active-badge" title={`${activeFiltersCount} active filters`}>
            {activeFiltersCount}
          </span>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="advanced-filters-panel">
          <div className="advanced-filters-grid">
            {/* Project */}
            <div className="filter-group-inline">
              <label>Project</label>
              <select
                value={filters.project_id || ''}
                onChange={e => handleFilterChange('project_id', e.target.value)}
                className="filter-select-inline"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Environment */}
            <div className="filter-group-inline">
              <label>Environment</label>
              <select
                value={filters.environment || ''}
                onChange={e => handleFilterChange('environment', e.target.value)}
                className="filter-select-inline"
              >
                <option value="">All Environments</option>
                {['Development', 'Staging', 'Production', 'QA'].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="filter-group-inline">
              <label>Type</label>
              <select
                value={filters.type || ''}
                onChange={e => handleFilterChange('type', e.target.value)}
                className="filter-select-inline"
              >
                <option value="">All Types</option>
                {['Functional', 'Regression', 'Smoke', 'Performance', 'Integration'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Tester */}
            <div className="filter-group-inline">
              <label>Assigned to</label>
              <select
                value={filters.tester_id || ''}
                onChange={e => handleFilterChange('tester_id', e.target.value)}
                className="filter-select-inline"
              >
                <option value="">All Testers</option>
                {testers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Created From */}
            <div className="filter-group-inline">
              <label>Created From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={e => handleDateChange('startDate', e.target.value)}
                className="filter-date-inline"
              />
            </div>

            {/* Created To */}
            <div className="filter-group-inline">
              <label>Created To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={e => handleDateChange('endDate', e.target.value)}
                className="filter-date-inline"
              />
            </div>

            {/* Time From */}
            <div className="filter-group-inline">
              <label>Time From</label>
              <input
                type="time"
                value={timeRange.startTime}
                onChange={e => handleTimeChange('startTime', e.target.value)}
                className="filter-date-inline"
              />
            </div>

            {/* Time To */}
            <div className="filter-group-inline">
              <label>Time To</label>
              <input
                type="time"
                value={timeRange.endTime}
                onChange={e => handleTimeChange('endTime', e.target.value)}
                className="filter-date-inline"
              />
            </div>
          </div>

          {/* Preset Controls */}
          {presets.length > 0 && (
            <div className="preset-controls-inline">
              <button
                className="preset-menu-btn-inline"
                onClick={() => setShowPresetMenu(!showPresetMenu)}
              >
                📋 Presets ({presets.length})
              </button>
              {showPresetMenu && (
                <div className="preset-dropdown-inline">
                  {presets.map(preset => (
                    <div key={preset.id} className="preset-item-inline">
                      <button
                        className="preset-load-btn-inline"
                        onClick={() => loadPreset(preset)}
                      >
                        {preset.name}
                      </button>
                      <button
                        className="preset-delete-btn-inline"
                        onClick={() => {
                          if (confirm(`Delete "${preset.name}"?`)) {
                            deletePreset(preset.id);
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save Preset & Clear Filters */}
          <div className="filter-actions-inline">
            <div className="preset-save-group">
              <input
                type="text"
                placeholder="Save as preset..."
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                className="preset-input-inline"
                onKeyPress={e => e.key === 'Enter' && savePreset()}
              />
              <button className="preset-save-btn-inline" onClick={savePreset}>
                💾 Save
              </button>
            </div>
            {activeFiltersCount > 0 && (
              <button className="clear-filters-btn-inline" onClick={clearFilters}>
                ✕ Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
