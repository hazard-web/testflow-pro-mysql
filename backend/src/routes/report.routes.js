// ─────────────────────────────────────────────
//  Reporting Routes — Analytics & Charts
// ─────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// Helper to cache reports
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to draw a simple table in PDF
function drawTable(doc, title, headers, rows, startX = 50, startY = null) {
  const colWidth = 150;
  const rowHeight = 25;
  
  if (startY) doc.y = startY;
  
  // Draw title
  doc.fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveDown(0.5);
  
  const tableStartY = doc.y;
  const tableStartX = startX;
  
  // Draw header
  let x = tableStartX;
  doc.fontSize(10).font('Helvetica-Bold');
  doc.fillColor('#5b8dee');
  doc.rect(x, doc.y, colWidth * headers.length, rowHeight).fill();
  
  doc.fillColor('#FFFFFF');
  headers.forEach((header, i) => {
    doc.text(header, x + 10, doc.y - rowHeight + 8, { width: colWidth - 20 });
    x += colWidth;
  });
  
  // Draw rows
  doc.moveDown();
  doc.fillColor('#333333');
  doc.font('Helvetica');
  
  rows.forEach((row, rowIndex) => {
    x = tableStartX;
    const rowY = doc.y;
    
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.fillColor('#f5f5f5');
      doc.rect(x, rowY, colWidth * headers.length, rowHeight).fill();
      doc.fillColor('#333333');
    }
    
    doc.fontSize(9);
    row.forEach((cell, colIndex) => {
      doc.text(cell.toString(), x + 10, rowY + 8, { width: colWidth - 20 });
      x += colWidth;
    });
    
    doc.moveDown(1.5);
  });
  
  doc.moveDown(0.5);
}

// Helper function to draw a bar chart visualization
function drawBarChart(doc, title, data) {
  doc.fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);
  
  const maxValue = Math.max(...data.map(d => d.count));
  const maxWidth = 300;
  const barHeight = 20;
  
  data.forEach((item, index) => {
    const label = item.status || item.priority || item.severity || 'Other';
    const barWidth = (item.count / maxValue) * maxWidth;
    const y = doc.y;
    
    // Draw label
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text(`${label}:`, 50, y, { width: 80 });
    
    // Draw bar
    doc.fillColor('#45B7D1');
    doc.rect(130, y + 5, barWidth, barHeight).fill();
    
    // Draw value
    doc.fillColor('#333');
    doc.text(item.count.toString(), 130 + barWidth + 10, y);
    
    doc.moveDown(1.5);
  });
  
  doc.moveDown(0.5);
}

// ─────────────────────────────────────────────
// LEGACY ROUTES (from all.routes.js)
// ─────────────────────────────────────────────

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const [tc, bugs, testers, runs] = await Promise.all([
      db('test_cases').select(db.raw('status, count(*) as count')).groupBy('status'),
      db('bugs')
        .select(db.raw('severity, status, count(*) as count'))
        .groupBy('severity', 'status'),
      db('testers').count('id as total').first(),
      db('test_runs').count('id as total').first(),
    ]);
    const byModule = await db('test_cases')
      .select(db.raw('module, status, count(*) as count'))
      .groupBy('module', 'status')
      .whereNotNull('module');
    res.json({
      testCases: tc,
      bugs,
      testers: parseInt(testers.total),
      runs: parseInt(runs.total),
      byModule,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/tester-performance', authenticate, async (req, res, next) => {
  try {
    const testers = await db('testers').where('is_active', 1);
    const data = await Promise.all(
      testers.map(async t => {
        const tcs = await db('test_cases').where('tester_id', t.id).select('status');
        const passed = tcs.filter(x => x.status === 'Pass').length;
        return {
          ...t,
          total: tcs.length,
          passed,
          failed: tcs.filter(x => x.status === 'Fail').length,
          pass_rate: tcs.length ? Math.round((passed / tcs.length) * 100) : 0,
        };
      })
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// NEW ROUTES (Project-specific statistics)
// ─────────────────────────────────────────────

// GET /reports/stats/:projectId
// Get test case statistics (counts by status, priority, etc)
router.get('/stats/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Test Cases by Status
    const byStatus = await db('test_cases')
      .where('project_id', projectId)
      .select('status')
      .count('* as count')
      .groupBy('status');

    // Test Cases by Priority
    const byPriority = await db('test_cases')
      .where('project_id', projectId)
      .select('priority')
      .count('* as count')
      .groupBy('priority');

    // Test Cases by Type
    const byType = await db('test_cases')
      .where('project_id', projectId)
      .select('type')
      .count('* as count')
      .groupBy('type');

    // Test Cases by Environment
    const byEnvironment = await db('test_cases')
      .where('project_id', projectId)
      .select('environment')
      .count('* as count')
      .groupBy('environment');

    // Total counts
    const totalTestCases = await db('test_cases')
      .where('project_id', projectId)
      .count('* as count')
      .first();

    const totalBugs = await db('bugs')
      .join('test_cases', 'bugs.tc_id', '=', 'test_cases.id')
      .where('test_cases.project_id', projectId)
      .count('* as count')
      .first();

    const totalTestRuns = await db('test_runs').count('* as count').first();

    res.json({
      testCases: {
        total: totalTestCases.count,
        byStatus,
        byPriority,
        byType,
        byEnvironment,
      },
      bugs: {
        total: totalBugs.count,
      },
      testRuns: {
        total: totalTestRuns.count,
      },
    });
  } catch (err) {
    console.error('❌ Fetch stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /reports/bug-stats/:projectId
// Get bug severity breakdown
router.get('/bug-stats/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Bugs by Severity
    const bySeverity = await db('bugs')
      .join('test_cases', 'bugs.tc_id', '=', 'test_cases.id')
      .where('test_cases.project_id', projectId)
      .select('bugs.severity')
      .count('* as count')
      .groupBy('bugs.severity');

    // Bugs by Status
    const byStatus = await db('bugs')
      .join('test_cases', 'bugs.tc_id', '=', 'test_cases.id')
      .where('test_cases.project_id', projectId)
      .select('bugs.status')
      .count('* as count')
      .groupBy('bugs.status');

    res.json({
      bugs: {
        bySeverity,
        byStatus,
      },
    });
  } catch (err) {
    console.error('❌ Fetch bug stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bug statistics' });
  }
});

// GET /reports/execution-trend/:projectId
// Get test execution trend (last 30 days)
router.get('/execution-trend/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get test runs from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trend = await db('test_runs')
      .where('created_at', '>=', thirtyDaysAgo)
      .select(db.raw('DATE(created_at) as date'), 'status')
      .count('* as count')
      .groupBy(db.raw('DATE(created_at)'), 'status')
      .orderBy(db.raw('DATE(created_at)'));

    res.json({ trend });
  } catch (err) {
    console.error('❌ Fetch execution trend error:', err.message);
    res.status(500).json({ error: 'Failed to fetch execution trend' });
  }
});

// GET /reports/tester-workload/:projectId
// Get test case assignment by tester
router.get('/tester-workload/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    const workload = await db('test_cases')
      .where('project_id', projectId)
      .leftJoin('testers', 'test_cases.tester_id', '=', 'testers.id')
      .select('testers.name', 'test_cases.status')
      .count('* as count')
      .groupBy('testers.name', 'test_cases.status');

    res.json({ workload });
  } catch (err) {
    console.error('❌ Fetch tester workload error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tester workload' });
  }
});

// GET /reports/coverage/:projectId
// Get test coverage metrics
router.get('/coverage/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Coverage by Module
    const byModule = await db('test_cases')
      .where('project_id', projectId)
      .select('module')
      .count('* as count')
      .groupBy('module');

    // Coverage by Type
    const byType = await db('test_cases')
      .where('project_id', projectId)
      .select('type')
      .count('* as count')
      .groupBy('type');

    res.json({
      coverage: {
        byModule,
        byType,
      },
    });
  } catch (err) {
    console.error('❌ Fetch coverage error:', err.message);
    res.status(500).json({ error: 'Failed to fetch coverage metrics' });
  }
});

// POST /reports/custom
// Generate custom report
router.post('/custom', authenticate, async (req, res) => {
  try {
    const { projectId, name, reportType } = req.body;

    if (!reportType) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    let data = {};

    switch (reportType) {
      case 'test_cases_by_status':
        data = await db('test_cases')
          .where('project_id', projectId)
          .select('status')
          .count('* as count')
          .groupBy('status');
        break;

      case 'bug_severity':
        data = await db('bugs')
          .join('test_cases', 'bugs.tc_id', '=', 'test_cases.id')
          .where('test_cases.project_id', projectId)
          .select('bugs.severity')
          .count('* as count')
          .groupBy('bugs.severity');
        break;

      case 'execution_summary':
        const total = await db('test_cases')
          .where('project_id', projectId)
          .count('* as count')
          .first();
        const passed = await db('test_cases')
          .where('project_id', projectId)
          .where('status', 'Passed')
          .count('* as count')
          .first();
        const failed = await db('test_cases')
          .where('project_id', projectId)
          .where('status', 'Failed')
          .count('* as count')
          .first();
        const pending = await db('test_cases')
          .where('project_id', projectId)
          .where('status', 'Pending')
          .count('* as count')
          .first();
        data = {
          total: total.count,
          passed: passed.count,
          failed: failed.count,
          pending: pending.count,
          passRate: total.count > 0 ? ((passed.count / total.count) * 100).toFixed(2) : 0,
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Store report for caching
    const reportId = uuidv4();
    const expiresAt = new Date(Date.now() + CACHE_DURATION);

    await db('reports').insert({
      id: reportId,
      project_id: projectId,
      name: name || `Report ${new Date().toLocaleDateString()}`,
      report_type: reportType,
      data: JSON.stringify(data),
      generated_at: new Date(),
      expires_at: expiresAt,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ reportId, data });
  } catch (err) {
    console.error('❌ Generate report error:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /reports/get/:reportId
// Get cached report
router.get('/get/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await db('reports').where('id', reportId).first();
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Check if expired
    if (report.expires_at && new Date(report.expires_at) < new Date()) {
      await db('reports').where('id', reportId).delete();
      return res.status(410).json({ error: 'Report has expired' });
    }

    res.json({
      id: report.id,
      name: report.name,
      type: report.report_type,
      data: JSON.parse(report.data),
      generatedAt: report.generated_at,
    });
  } catch (err) {
    console.error('❌ Fetch report error:', err.message);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST /reports/export/:projectId
// Export comprehensive report data (CSV, JSON, or PDF with charts)
router.post('/export/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'json' } = req.body; // json, csv, or pdf

    // Fetch all report data
    const testCases = await db('test_cases').where('project_id', projectId).select('*');
    const bugs = await db('bugs')
      .join('test_cases', 'bugs.tc_id', '=', 'test_cases.id')
      .where('test_cases.project_id', projectId)
      .select('bugs.*');

    // Aggregate metrics
    const report = {
      metadata: {
        projectId,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalTestCases: testCases.length,
        passedTests: testCases.filter(t => t.status === 'Pass').length,
        failedTests: testCases.filter(t => t.status === 'Fail').length,
        blockedTests: testCases.filter(t => t.status === 'Blocked').length,
        openBugs: bugs.filter(b => b.status !== 'Fixed').length,
        resolvedBugs: bugs.filter(b => b.status === 'Fixed').length,
        totalBugs: bugs.length,
      },
      breakdown: {
        byStatus: testCases.reduce((acc, tc) => {
          const existing = acc.find(x => x.status === tc.status);
          if (existing) existing.count++;
          else acc.push({ status: tc.status, count: 1 });
          return acc;
        }, []),
        byPriority: testCases.reduce((acc, tc) => {
          const existing = acc.find(x => x.priority === tc.priority);
          if (existing) existing.count++;
          else acc.push({ priority: tc.priority, count: 1 });
          return acc;
        }, []),
        bugsBySeverity: bugs.reduce((acc, bug) => {
          const existing = acc.find(x => x.severity === bug.severity);
          if (existing) existing.count++;
          else acc.push({ severity: bug.severity, count: 1 });
          return acc;
        }, []),
        bugsByStatus: bugs.reduce((acc, bug) => {
          const existing = acc.find(x => x.status === bug.status);
          if (existing) existing.count++;
          else acc.push({ status: bug.status, count: 1 });
          return acc;
        }, []),
      },
    };

    if (format === 'pdf') {
      // Generate PDF with tables and charts
      const doc = new PDFDocument({ size: 'A4', margins: 30 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=testflow-report.pdf');
      
      doc.pipe(res);

      // Title Page
      doc.fontSize(28).font('Helvetica-Bold').text('TestFlow Pro', { align: 'center' });
      doc.fontSize(20).text('Comprehensive Test Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text(`Project ID: ${projectId}`, { align: 'center' });
      doc.moveDown();

      // Summary Section
      doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica');
      const passRate = report.summary.totalTestCases > 0 
        ? Math.round((report.summary.passedTests / report.summary.totalTestCases) * 100) 
        : 0;
      
      doc.text(`Total Test Cases: ${report.summary.totalTestCases}`, { color: '#333' });
      doc.text(`Passed: ${report.summary.passedTests} (${passRate}%)`, { color: passRate >= 80 ? '#10b981' : '#ef4444' });
      doc.text(`Failed: ${report.summary.failedTests}`, { color: '#ef4444' });
      doc.text(`Blocked: ${report.summary.blockedTests}`, { color: '#f59e0b' });
      doc.text(`Open Bugs: ${report.summary.openBugs}`, { color: '#ef4444' });
      doc.text(`Resolved Bugs: ${report.summary.resolvedBugs}`, { color: '#10b981' });
      doc.text(`Total Bugs: ${report.summary.totalBugs}`);
      doc.moveDown();

      // Test Cases by Status
      if (report.breakdown.byStatus.length > 0) {
        drawBarChart(doc, 'Test Cases by Status', report.breakdown.byStatus);
      }

      // Test Cases by Priority
      if (report.breakdown.byPriority.length > 0) {
        drawBarChart(doc, 'Test Cases by Priority', report.breakdown.byPriority);
      }

      // Add new page for bug metrics
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Bug Metrics', { underline: true });
      doc.moveDown(0.5);

      // Bugs by Severity
      if (report.breakdown.bugsBySeverity.length > 0) {
        drawBarChart(doc, 'Bugs by Severity', report.breakdown.bugsBySeverity);
      }

      // Bugs by Status
      if (report.breakdown.bugsByStatus.length > 0) {
        drawBarChart(doc, 'Bugs by Status', report.breakdown.bugsByStatus);
      }

      // Detailed Summary Table
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Summary Metrics', { underline: true });
      doc.moveDown(0.5);
      
      drawTable(doc, 'Key Metrics', ['Metric', 'Value'], [
        ['Total Test Cases', report.summary.totalTestCases],
        ['Passed Tests', report.summary.passedTests],
        ['Failed Tests', report.summary.failedTests],
        ['Blocked Tests', report.summary.blockedTests],
        ['Pass Rate', `${passRate}%`],
        ['Open Bugs', report.summary.openBugs],
        ['Resolved Bugs', report.summary.resolvedBugs],
        ['Total Bugs', report.summary.totalBugs],
      ]);

      doc.end();
    } else if (format === 'csv') {
      // Generate Professional CSV with enhanced formatting
      let csv = '';
      
      // Header
      csv += 'TESTFLOW PRO - COMPREHENSIVE TEST REPORT\n';
      csv += '===========================================\n\n';
      csv += `Generated Date: ${new Date().toLocaleString()}\n`;
      csv += `Project ID: ${projectId}\n`;
      csv += `Report Type: Comprehensive Analysis\n\n`;

      // Calculate metrics
      const passRate = report.summary.totalTestCases > 0 
        ? Math.round((report.summary.passedTests / report.summary.totalTestCases) * 100)
        : 0;
      const failRate = report.summary.totalTestCases > 0
        ? Math.round((report.summary.failedTests / report.summary.totalTestCases) * 100)
        : 0;
      const bugResolutionRate = report.summary.totalBugs > 0
        ? Math.round((report.summary.resolvedBugs / report.summary.totalBugs) * 100)
        : 0;

      // EXECUTIVE SUMMARY
      csv += 'EXECUTIVE SUMMARY\n';
      csv += '=================\n';
      csv += 'Metric,Value,Status\n';
      csv += `Total Test Cases,${report.summary.totalTestCases},\n`;
      csv += `Passed Tests,${report.summary.passedTests} (${passRate}%),${passRate >= 80 ? 'PASS' : 'NEEDS ATTENTION'}\n`;
      csv += `Failed Tests,${report.summary.failedTests} (${failRate}%),${failRate === 0 ? 'EXCELLENT' : 'ACTION REQUIRED'}\n`;
      csv += `Blocked Tests,${report.summary.blockedTests},\n`;
      csv += `Total Bugs,${report.summary.totalBugs},\n`;
      csv += `Open Bugs,${report.summary.openBugs},PENDING\n`;
      csv += `Resolved Bugs,${report.summary.resolvedBugs} (${bugResolutionRate}%),\n`;
      csv += `Bug Resolution Rate,${bugResolutionRate}%,${bugResolutionRate >= 70 ? 'GOOD' : 'IMPROVE'}\n\n`;

      // DETAILED BREAKDOWN - Test Cases by Status
      csv += 'TEST CASES BREAKDOWN BY STATUS\n';
      csv += '=============================\n';
      csv += 'Status,Count,Percentage\n';
      report.breakdown.byStatus.forEach(s => {
        const pct = report.summary.totalTestCases > 0 
          ? Math.round((s.count / report.summary.totalTestCases) * 100)
          : 0;
        csv += `${s.status},${s.count},${pct}%\n`;
      });
      csv += `TOTAL,${report.summary.totalTestCases},100%\n\n`;

      // Test Cases by Priority
      csv += 'TEST CASES BREAKDOWN BY PRIORITY\n';
      csv += '===============================\n';
      csv += 'Priority,Count,Percentage\n';
      report.breakdown.byPriority.forEach(p => {
        const pct = report.summary.totalTestCases > 0
          ? Math.round((p.count / report.summary.totalTestCases) * 100)
          : 0;
        csv += `${p.priority},${p.count},${pct}%\n`;
      });
      csv += `TOTAL,${report.summary.totalTestCases},100%\n\n`;

      // BUGS ANALYSIS
      csv += 'BUGS ANALYSIS\n';
      csv += '=============\n';
      csv += 'Metric,Count,Percentage,Priority\n';
      report.breakdown.bugsBySeverity.forEach(s => {
        const pct = report.summary.totalBugs > 0
          ? Math.round((s.count / report.summary.totalBugs) * 100)
          : 0;
        const priority = s.severity === 'Critical' || s.severity === 'High' ? 'URGENT' : 'NORMAL';
        csv += `${s.severity} Severity,${s.count},${pct}%,${priority}\n`;
      });
      csv += `TOTAL BUGS,${report.summary.totalBugs},100%,\n\n`;

      // Bugs by Status
      csv += 'BUGS BREAKDOWN BY STATUS\n';
      csv += '=======================\n';
      csv += 'Status,Count,Percentage\n';
      report.breakdown.bugsByStatus.forEach(s => {
        const pct = report.summary.totalBugs > 0
          ? Math.round((s.count / report.summary.totalBugs) * 100)
          : 0;
        csv += `${s.status},${s.count},${pct}%\n`;
      });
      csv += `TOTAL,${report.summary.totalBugs},100%\n\n`;

      // RECOMMENDATIONS
      csv += 'QUALITY METRICS & RECOMMENDATIONS\n';
      csv += '=================================\n';
      csv += `Test Pass Rate,${passRate}%,${passRate >= 90 ? 'EXCELLENT' : passRate >= 80 ? 'GOOD' : passRate >= 70 ? 'ACCEPTABLE' : 'POOR'}\n`;
      csv += `Test Failure Rate,${failRate}%,${failRate === 0 ? 'EXCELLENT' : failRate <= 10 ? 'GOOD' : 'ACTION NEEDED'}\n`;
      csv += `Bug Resolution Rate,${bugResolutionRate}%,${bugResolutionRate >= 80 ? 'EXCELLENT' : bugResolutionRate >= 60 ? 'GOOD' : 'IMPROVEMENT NEEDED'}\n`;
      csv += `Critical Bugs Open,${report.breakdown.bugsBySeverity.find(b => b.severity === 'Critical')?.count || 0},${(report.breakdown.bugsBySeverity.find(b => b.severity === 'Critical')?.count || 0) > 0 ? 'NEEDS ATTENTION' : 'NONE'}\n\n`;

      // FOOTER
      csv += 'NOTES\n';
      csv += '=====\n';
      csv += 'Generated by TestFlow Pro - Professional Test Management\n';
      csv += 'For more details, visit the TestFlow Pro Dashboard\n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=testflow-report.csv');
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=testflow-report.json');
      res.json(report);
    }
  } catch (err) {
    console.error('❌ Export error:', err.message);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;
