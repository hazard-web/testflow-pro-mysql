import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import '../styles/reports.css';

const Charts = {
  PieChart: ({ data, title }) => {
    const canvas = React.useRef(null);

    React.useEffect(() => {
      if (!canvas.current) return;
      const ctx = canvas.current.getContext('2d');
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

      const labels = data.map(d => d.status || d.priority || d.severity || d.type || 'Other');
      const values = data.map(d => d.count);

      const radius = 80;
      const cx = 100;
      const cy = 100;

      ctx.clearRect(0, 0, 200, 200);
      let currentAngle = -Math.PI / 2;

      values.forEach((value, index) => {
        const sliceAngle = (value / values.reduce((a, b) => a + b, 0)) * 2 * Math.PI;
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.arc(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(cx, cy);
        ctx.fill();
        currentAngle += sliceAngle;
      });
    }, [data]);

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <canvas
          ref={canvas}
          width="200"
          height="200"
          style={{ display: 'block', margin: '0 auto' }}
        />
        <div className="chart-legend">
          {data.map((d, i) => (
            <div key={i} className="legend-item">
              <span
                className="legend-color"
                style={{
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][i % 5],
                }}
              ></span>
              <span>
                {d.status || d.priority || d.severity || d.type || 'Other'}: {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },

  BarChart: ({ data, title, xLabel, yLabel }) => {
    const canvas = React.useRef(null);

    React.useEffect(() => {
      if (!canvas.current) return;
      const ctx = canvas.current.getContext('2d');

      const labels = data.map(d => d.status || d.priority || d.type || 'Other');
      const values = data.map(d => d.count);
      const maxValue = Math.max(...values, 10);

      const width = 400;
      const height = 250;
      const padding = 40;
      const barWidth = (width - 2 * padding) / labels.length;

      ctx.clearRect(0, 0, width, height);

      // Draw axes
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.stroke();

      // Draw bars
      values.forEach((value, index) => {
        const barHeight = (value / maxValue) * (height - 2 * padding);
        const x = padding + index * barWidth + barWidth * 0.2;
        const y = height - padding - barHeight;

        ctx.fillStyle = '#45B7D1';
        ctx.fillRect(x, y, barWidth * 0.6, barHeight);

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth * 0.3, height - padding + 20);
        ctx.fillText(value, x + barWidth * 0.3, y - 5);
      });
    }, [data]);

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <canvas
          ref={canvas}
          width="400"
          height="250"
          style={{ display: 'block', margin: '0 auto' }}
        />
      </div>
    );
  },
};

export default function Reports({ projectId }) {
  const [stats, setStats] = useState(null);
  const [bugStats, setBugStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [projectId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, bugsRes] = await Promise.all([
        api.get(`/reports/stats/${projectId}`),
        api.get(`/reports/bug-stats/${projectId}`),
      ]);
      setStats(statsRes);
      setBugStats(bugsRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = await api.post(`/reports/export/${projectId}`, { format });
      
      if (format === 'csv') {
        // Handle CSV export
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `testflow-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON export
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `testflow-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="report-loading">Loading reports...</div>;

  return (
    <div className="reports-dashboard">
      <div className="reports-header">
        <h2>📊 Reports & Analytics</h2>
        <div className="header-controls">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'bugs' ? 'active' : ''}`}
              onClick={() => setActiveTab('bugs')}
            >
              Bugs
            </button>
            <button
              className={`tab ${activeTab === 'coverage' ? 'active' : ''}`}
              onClick={() => setActiveTab('coverage')}
            >
              Coverage
            </button>
          </div>
          <div className="export-buttons">
            <button
              className="export-btn csv"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              title="Export as CSV file"
            >
              {exporting ? '⏳ Exporting...' : '📥 CSV'}
            </button>
            <button
              className="export-btn json"
              onClick={() => handleExport('json')}
              disabled={exporting}
              title="Export as JSON file"
            >
              {exporting ? '⏳ Exporting...' : '📥 JSON'}
            </button>
          </div>
        </div>
      </div>

      <div className="reports-content">
        {activeTab === 'overview' && stats && (
          <div className="charts-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.testCases.total}</div>
              <div className="stat-label">Total Test Cases</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.bugs.total}</div>
              <div className="stat-label">Total Bugs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.testRuns.total}</div>
              <div className="stat-label">Test Runs</div>
            </div>

            {stats.testCases.byStatus && stats.testCases.byStatus.length > 0 && (
              <Charts.PieChart data={stats.testCases.byStatus} title="Test Cases by Status" />
            )}

            {stats.testCases.byPriority && stats.testCases.byPriority.length > 0 && (
              <Charts.BarChart data={stats.testCases.byPriority} title="Test Cases by Priority" />
            )}

            {stats.testCases.byType && stats.testCases.byType.length > 0 && (
              <Charts.PieChart data={stats.testCases.byType} title="Test Cases by Type" />
            )}

            {stats.testCases.byEnvironment && stats.testCases.byEnvironment.length > 0 && (
              <Charts.BarChart
                data={stats.testCases.byEnvironment}
                title="Test Cases by Environment"
              />
            )}
          </div>
        )}

        {activeTab === 'bugs' && bugStats && (
          <div className="charts-grid">
            {bugStats.bugs.bySeverity && bugStats.bugs.bySeverity.length > 0 && (
              <Charts.PieChart data={bugStats.bugs.bySeverity} title="Bugs by Severity" />
            )}

            {bugStats.bugs.byStatus && bugStats.bugs.byStatus.length > 0 && (
              <Charts.BarChart data={bugStats.bugs.byStatus} title="Bugs by Status" />
            )}
          </div>
        )}

        {activeTab === 'coverage' && stats && (
          <div className="charts-grid">
            {stats.testCases.byType && (
              <Charts.BarChart data={stats.testCases.byType} title="Coverage by Type" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
