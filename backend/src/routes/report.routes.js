// ─────────────────────────────────────────────
//  Reporting Routes — Analytics & Charts
// ─────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');

// Helper to cache reports
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
// Export comprehensive report data (CSV or JSON)
router.post('/export/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'json' } = req.body; // json or csv

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

    if (format === 'csv') {
      // Generate CSV
      let csv = 'TESTFLOW PRO - COMPREHENSIVE REPORT\n';
      csv += `Generated,${new Date().toISOString()}\n`;
      csv += `Project ID,${projectId}\n\n`;

      csv += 'SUMMARY METRICS\n';
      csv += 'Category,Value\n';
      csv += `Total Test Cases,${report.summary.totalTestCases}\n`;
      csv += `Passed Tests,${report.summary.passedTests}\n`;
      csv += `Failed Tests,${report.summary.failedTests}\n`;
      csv += `Blocked Tests,${report.summary.blockedTests}\n`;
      csv += `Open Bugs,${report.summary.openBugs}\n`;
      csv += `Resolved Bugs,${report.summary.resolvedBugs}\n`;
      csv += `Total Bugs,${report.summary.totalBugs}\n`;
      csv += `Pass Rate %,${report.summary.totalTestCases > 0 ? Math.round((report.summary.passedTests / report.summary.totalTestCases) * 100) : 0}\n\n`;

      csv += 'TEST CASES BY STATUS\n';
      csv += 'Status,Count\n';
      report.breakdown.byStatus.forEach(s => (csv += `${s.status},${s.count}\n`));
      csv += '\n';

      csv += 'TEST CASES BY PRIORITY\n';
      csv += 'Priority,Count\n';
      report.breakdown.byPriority.forEach(p => (csv += `${p.priority},${p.count}\n`));
      csv += '\n';

      csv += 'BUGS BY SEVERITY\n';
      csv += 'Severity,Count\n';
      report.breakdown.bugsBySeverity.forEach(s => (csv += `${s.severity},${s.count}\n`));
      csv += '\n';

      csv += 'BUGS BY STATUS\n';
      csv += 'Status,Count\n';
      report.breakdown.bugsByStatus.forEach(s => (csv += `${s.status},${s.count}\n`));

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
