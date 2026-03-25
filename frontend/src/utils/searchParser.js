// ─────────────────────────────────────────────
//  Advanced Search Parser & Filter Suggestions
// ─────────────────────────────────────────────

/**
 * Parse advanced search syntax with Boolean operators
 * Supports: AND, OR, NOT, quoted phrases
 * Examples:
 *   "login form" AND password
 *   authentication OR "two factor"
 *   NOT deprecated
 */
export function parseAdvancedSearch(query) {
  if (!query || !query.trim()) {
    return { type: 'simple', value: '' };
  }

  const trimmed = query.trim();

  // Check for Boolean operators
  const hasAND = /\sAND\s/i.test(trimmed);
  const hasOR = /\sOR\s/i.test(trimmed);
  const hasNOT = /\bNOT\s/i.test(trimmed);
  const hasQuotes = /"[^"]*"/g.test(trimmed);

  if (hasAND || hasOR || hasNOT || hasQuotes) {
    return { type: 'advanced', value: trimmed };
  }

  return { type: 'simple', value: trimmed };
}

/**
 * Build search query for backend based on parsed syntax
 */
export function buildSearchQuery(parsedSearch, baseFilters = {}) {
  const { type, value } = parsedSearch;

  if (type === 'simple') {
    return { ...baseFilters, search: value };
  }

  // Advanced search processing
  const parts = [];

  // Extract quoted phrases
  const quotes = [];
  let queryStr = value;
  const quoteRegex = /"([^"]*)"/g;
  let match;
  while ((match = quoteRegex.exec(value)) !== null) {
    quotes.push({ phrase: match[1], regex: new RegExp(`"${match[1]}"`, 'gi') });
    queryStr = queryStr.replace(quotes[quotes.length - 1].regex, '');
  }

  // Split by AND, OR, NOT (case-insensitive)
  const tokens = queryStr
    .split(/\s+(AND|OR|NOT)\s+/i)
    .map(t => t.trim())
    .filter(t => t);

  // Build search string - for now, join all terms (backend will handle)
  // In production, you might want to send the parsed structure to backend
  const allTerms = [...quotes.map(q => `"${q.phrase}"`), ...tokens.filter(t => !/(AND|OR|NOT)/i.test(t))];

  return {
    ...baseFilters,
    search: allTerms.join(' '),
    searchType: 'advanced',
  };
}

/**
 * Filter suggestions based on history and popular filters
 */
export function getFilterSuggestions(history = [], popular = []) {
  const suggestions = {
    recent: history.slice(0, 5),
    popular: popular.slice(0, 5),
    combined: [...new Set([...history.slice(0, 3), ...popular.slice(0, 2)])],
  };
  return suggestions;
}

/**
 * Track filter history in localStorage
 */
export function trackFilterHistory(filters) {
  try {
    const history = JSON.parse(localStorage.getItem('tc_filter_history') || '[]');
    
    // Create filter summary
    const summary = {
      id: Date.now(),
      filters,
      timestamp: new Date().toISOString(),
      label: generateFilterLabel(filters),
    };

    // Keep only last 20
    const updated = [summary, ...history].slice(0, 20);
    localStorage.setItem('tc_filter_history', JSON.stringify(updated));

    return updated;
  } catch (e) {
    console.error('Error tracking filter history:', e);
    return [];
  }
}

/**
 * Generate human-readable label for a filter combination
 */
export function generateFilterLabel(filters) {
  const parts = [];

  if (filters.search) parts.push(`Search: "${filters.search.substring(0, 20)}..."`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.priority) parts.push(`Priority: ${filters.priority}`);
  if (filters.module) parts.push(`Module: ${filters.module}`);
  if (filters.project_id) parts.push(`Project: ${filters.project_id}`);

  return parts.join(' • ') || 'Unnamed Filter';
}

/**
 * Get popular filters based on frequency
 */
export function getPopularFilters(history = []) {
  const frequency = {};

  history.forEach(item => {
    const key = JSON.stringify({
      status: item.filters.status,
      priority: item.filters.priority,
      module: item.filters.module,
    });

    frequency[key] = (frequency[key] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([filterStr]) => JSON.parse(filterStr));
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query) {
  if (!query) return '';

  // Remove potentially harmful characters but allow search operators
  const sanitized = query
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\\/g, '') // Remove backslashes
    .substring(0, 500); // Limit length

  return sanitized.trim();
}

/**
 * Suggest filter completions based on current input
 */
export function getAutocompleteSuggestions(input, availableFilters = {}) {
  if (!input || input.length < 2) return [];

  const { modules = [], projects = [], testers = [] } = availableFilters;

  const suggestions = [];

  // Search in modules
  modules.forEach(m => {
    if (m.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({ type: 'module', value: m });
    }
  });

  // Search in projects
  projects.forEach(p => {
    if (p.name && p.name.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({ type: 'project', value: p.name, id: p.id });
    }
  });

  // Search in testers
  testers.forEach(t => {
    if (t.name && t.name.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({ type: 'tester', value: t.name, id: t.id });
    }
  });

  // Status suggestions
  ['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'].forEach(s => {
    if (s.toLowerCase().includes(input.toLowerCase())) {
      suggestions.push({ type: 'status', value: s });
    }
  });

  return suggestions.slice(0, 8); // Limit to 8 suggestions
}
