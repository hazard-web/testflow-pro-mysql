// ─────────────────────────────────────────────
//  Test Case Advanced Filters with Presets & Suggestions
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
  const [expanded, setExpanded] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState([]);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
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
    let newFilters = { ...filters };
    
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
        <div className="search-wrap-main" style={{ position: 'relative' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search test cases by name, description... (Try: login OR auth AND password)"
            value={filters.search || ''}
            onChange={e => handleSearchChange(e.target.value)}
            className="search-input-main"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  className="suggestion-item"
                  onClick={() => applySuggestion(sug)}
                >
                  <span className="suggestion-type">{sug.type}</span>
                  <span className="suggestion-value">{sug.value}</span>
                </button>
              ))}
            </div>
          )}
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

          {/* Preset Controls */}
          <div className="preset-controls">
            <div className="preset-input-group">
              <input
                type="text"
                placeholder="Name this filter preset..."
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                className="preset-input"
                onKeyPress={e => e.key === 'Enter' && savePreset()}
              />
              <button className="preset-save-btn" onClick={savePreset}>
                💾 Save
              </button>
            </div>

            {presets.length > 0 && (
              <div className="preset-menu-wrapper">
                <button
                  className="preset-menu-btn"
                  onClick={() => setShowPresetMenu(!showPresetMenu)}
                >
                  📋 Presets ({presets.length})
                </button>
                {showPresetMenu && (
                  <div className="preset-dropdown">
                    {presets.map(preset => (
                      <div key={preset.id} className="preset-item">
                        <button
                          className="preset-load-btn"
                          onClick={() => loadPreset(preset)}
                        >
                          {preset.name}
                        </button>
                        <button
                          className="preset-delete-btn"
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
          </div>

          {/* Filter Actions Footer */}
          <div className="filter-footer">
            {activeFiltersCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                ✕ Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
