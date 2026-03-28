// ─────────────────────────────────────────────
//  Test Case Routes — /api/test-cases  (MySQL)
// ─────────────────────────────────────────────
const router = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const { uploadToCloud, deleteFromCloud, isCloudConfigured } = require('../utils/cloudStorage');

// ── MULTER CONFIG ────────────────────────────
const uploadsDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Use memoryStorage when Cloudinary is configured (buffer → cloud), otherwise disk
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const storage = isCloudConfigured() ? multer.memoryStorage() : diskStorage;

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (png/jpg/gif/webp) and videos (mp4/webm/mov) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.use(authenticate);

// GET all test cases
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      priority,
      module: mod,
      tester_id,
      project_id,
      environment,
      type,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    let qry = db('test_cases as tc')
      .leftJoin('testers as t', 'tc.tester_id', 't.id')
      .leftJoin('projects as p', 'tc.project_id', 'p.id')
      .select(
        'tc.id',
        'tc.title',
        'tc.module',
        'tc.priority',
        'tc.status',
        'tc.environment',
        'tc.type',
        'tc.description',
        'tc.steps',
        'tc.project_id',
        'tc.tester_id',
        'tc.created_by',
        'tc.created_at',
        'tc.updated_at',
        't.name as tester_name',
        't.initials as tester_initials',
        't.avatar_color as tester_color',
        'p.name as project_name',
        'p.color as project_color'
      )
      .orderBy('tc.updated_at', 'desc');

    if (status) qry = qry.where('tc.status', status);
    if (priority) qry = qry.where('tc.priority', priority);
    if (mod) qry = qry.where('tc.module', mod);
    if (tester_id) qry = qry.where('tc.tester_id', tester_id);
    if (project_id) qry = qry.where('tc.project_id', project_id);
    if (environment) qry = qry.where('tc.environment', environment);
    if (type) qry = qry.where('tc.type', type);
    if (search)
      qry = qry
        .where('tc.title', 'like', `%${search}%`)
        .orWhere('tc.description', 'like', `%${search}%`);
    if (startDate) qry = qry.whereDate('tc.created_at', '>=', startDate);
    if (endDate) qry = qry.whereDate('tc.created_at', '<=', endDate);

    let countQry = db('test_cases');
    if (status) countQry = countQry.where('status', status);
    if (priority) countQry = countQry.where('priority', priority);
    if (mod) countQry = countQry.where('module', mod);
    if (tester_id) countQry = countQry.where('tester_id', tester_id);
    if (project_id) countQry = countQry.where('project_id', project_id);
    if (environment) countQry = countQry.where('environment', environment);
    if (type) countQry = countQry.where('type', type);
    if (search)
      countQry = countQry
        .where('title', 'like', `%${search}%`)
        .orWhere('description', 'like', `%${search}%`);
    if (startDate) countQry = countQry.whereDate('created_at', '>=', startDate);
    if (endDate) countQry = countQry.whereDate('created_at', '<=', endDate);
    const total = await countQry.count('id as count').first();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const items = await qry.limit(parseInt(limit)).offset(offset);

    // Parse JSON steps (MySQL returns string)
    const parsed = items.map(tc => {
      let steps = [];
      try {
        if (typeof tc.steps === 'string') {
          steps = JSON.parse(tc.steps || '[]');
        } else {
          steps = tc.steps || [];
        }
      } catch (e) {
        logger.warn('Error parsing steps in list:', e.message);
      }
      return { ...tc, steps };
    });

    res.json({
      data: parsed,
      total: parseInt(total.count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});

// ─── EXCEL IMPORT (before /:id to avoid param conflict) ───

const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

function matchTester(name, testers) {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  let match = testers.find(t => t.name.toLowerCase() === clean);
  if (match) return match.id;
  match = testers.find(t => {
    const parts = t.name.toLowerCase().split(/\s+/);
    return parts.some(p => p === clean) || t.name.toLowerCase().includes(clean);
  });
  if (match) return match.id;
  match = testers.find(t => t.email && t.email.toLowerCase() === clean);
  if (match) return match.id;
  return null;
}

function normalizeHeader(h) {
  if (!h) return '';
  return h
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const HEADER_MAP = {
  // Title variations
  title: 'title',
  name: 'title',
  test_case: 'title',
  test_case_name: 'title',
  test_case_title: 'title',
  testcase: 'title',
  testcase_name: 'title',
  testcase_title: 'title',
  tc_name: 'title',
  tc_title: 'title',
  test_name: 'title',
  test_title: 'title',
  scenario: 'title',
  test_scenario: 'title',
  scenario_name: 'title',
  summary: 'title',
  case_name: 'title',
  case_title: 'title',
  test_case_description: 'title',
  tc: 'title',
  use_case: 'title',
  requirement: 'title',
  // Description
  description: 'description',
  desc: 'description',
  details: 'description',
  notes: 'description',
  comments: 'description',
  remark: 'description',
  remarks: 'description',
  // Module
  module: 'module',
  component: 'module',
  area: 'module',
  feature: 'module',
  section: 'module',
  page: 'module',
  screen: 'module',
  functionality: 'module',
  // Priority
  priority: 'priority',
  prio: 'priority',
  severity: 'priority',
  // Status
  status: 'status',
  state: 'status',
  result: 'status',
  test_result: 'status',
  outcome: 'status',
  // Environment
  environment: 'environment',
  env: 'environment',
  // Type
  type: 'type',
  test_type: 'type',
  category: 'type',
  // Tester
  tester: 'tester',
  tester_name: 'tester',
  assigned_to: 'tester',
  assignee: 'tester',
  assigned: 'tester',
  assigned_tester: 'tester',
  qa: 'tester',
  tested_by: 'tester',
  owner: 'tester',
  responsible: 'tester',
  executor: 'tester',
  executed_by: 'tester',
  // Project
  project: 'project',
  project_name: 'project',
  // Steps
  steps: 'steps',
  test_steps: 'steps',
  steps_to_reproduce: 'steps',
  procedure: 'steps',
  actions: 'steps',
  // Expected result
  expected: 'expected_result',
  expected_result: 'expected_result',
  expected_outcome: 'expected_result',
  expected_output: 'expected_result',
  // Serial / ID columns (ignore, but don't block)
  sr_no: '_skip',
  s_no: '_skip',
  serial: '_skip',
  sl_no: '_skip',
  id: '_skip',
  test_case_id: '_skip',
  tc_id: '_skip',
};

router.post('/import/excel', excelUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
      defval: '',
    });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or has no data rows' });
    }

    const rawHeaders = Object.keys(rawRows[0]);
    const headerMapping = {};
    rawHeaders.forEach(h => {
      const n = normalizeHeader(h);
      if (HEADER_MAP[n] && HEADER_MAP[n] !== '_skip') headerMapping[h] = HEADER_MAP[n];
    });

    // If no title column found, try to use the first text column that looks like a title
    if (!Object.values(headerMapping).includes('title')) {
      const skipPatterns = /^(sr|s|sl|id|no|serial|index|tc_id|test_case_id|\d)/i;
      const firstTextCol = rawHeaders.find(h => {
        const norm = normalizeHeader(h);
        return !skipPatterns.test(norm) && typeof rawRows[0][h] === 'string' && rawRows[0][h].length > 2;
      });
      if (firstTextCol) {
        headerMapping[firstTextCol] = 'title';
        logger.info(`Excel import: auto-detected "${firstTextCol}" as title column`);
      }
    }

    if (!Object.values(headerMapping).includes('title')) {
      return res
        .status(400)
        .json({ error: 'Could not find a "Title" column.', detectedHeaders: rawHeaders });
    }

    const testers = await db('testers').select('id', 'name', 'email');
    const projects = await db('projects').select('id', 'name');
    const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
    const validStatuses = ['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'];
    const validEnvs = ['Production', 'Staging', 'QA', 'Development', 'UAT'];
    const validTypes = [
      'Functional',
      'Regression',
      'Smoke',
      'Integration',
      'E2E',
      'Performance',
      'Security',
      'Usability',
      'API',
      'UI',
    ];
    const created = [],
      skipped = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const mapped = {};
      Object.entries(headerMapping).forEach(([orig, field]) => {
        mapped[field] = row[orig]?.toString().trim() || '';
      });
      if (!mapped.title) {
        skipped.push({ row: i + 2, reason: 'Missing title' });
        continue;
      }

      let tester_id = mapped.tester ? matchTester(mapped.tester, testers) : null;
      let project_id = req.body.project_id || null;
      if (mapped.project && !project_id) {
        const proj = projects.find(p => p.name.toLowerCase() === mapped.project.toLowerCase());
        if (proj) project_id = proj.id;
      }

      let priority = 'Medium';
      if (mapped.priority) {
        const m = validPriorities.find(v => v.toLowerCase() === mapped.priority.toLowerCase());
        if (m) priority = m;
        else if (/^(p0|p1|crit)/i.test(mapped.priority)) priority = 'Critical';
        else if (/^(p2|high)/i.test(mapped.priority)) priority = 'High';
        else if (/^(p3|med)/i.test(mapped.priority)) priority = 'Medium';
        else if (/^(p4|low)/i.test(mapped.priority)) priority = 'Low';
      }

      let status = 'Pending';
      if (mapped.status) {
        const m = validStatuses.find(v => v.toLowerCase() === mapped.status.toLowerCase());
        if (m) status = m;
        else if (/pass|passed|success/i.test(mapped.status)) status = 'Pass';
        else if (/fail|failed/i.test(mapped.status)) status = 'Fail';
        else if (/progress|wip|running/i.test(mapped.status)) status = 'In Progress';
        else if (/block/i.test(mapped.status)) status = 'Blocked';
      }

      let environment = 'Staging';
      if (mapped.environment) {
        const m = validEnvs.find(v => v.toLowerCase() === mapped.environment.toLowerCase());
        if (m) environment = m;
      }
      let type = 'Functional';
      if (mapped.type) {
        const m = validTypes.find(v => v.toLowerCase() === mapped.type.toLowerCase());
        if (m) type = m;
      }

      let stepsJson = '[]';
      if (mapped.steps) {
        const stepLines = mapped.steps
          .split(/\n|(?=\d+[.)]\s)/)
          .filter(Boolean)
          .map(s => s.replace(/^\d+[.)]\s*/, '').trim())
          .filter(Boolean);
        const stepsArr = stepLines.map((action, idx) => ({
          action,
          expected:
            idx === stepLines.length - 1 && mapped.expected_result ? mapped.expected_result : '',
        }));
        if (stepsArr.length > 0) stepsJson = JSON.stringify(stepsArr);
      }

      const id = uuidv4();
      await db('test_cases').insert({
        id,
        title: mapped.title,
        project_id,
        module: mapped.module || null,
        priority,
        tester_id,
        environment,
        type,
        description: mapped.description || null,
        status,
        steps: stepsJson,
        created_by: req.user.name,
      });

      created.push({
        id,
        title: mapped.title,
        priority,
        status,
        module: mapped.module || null,
        tester: tester_id ? testers.find(t => t.id === tester_id)?.name : mapped.tester || null,
        testerMatched: !!tester_id,
      });
    }

    if (created.length > 0) {
      try {
        await db('notifications').insert({
          id: uuidv4(),
          title: `${created.length} test case(s) imported`,
          sub: `From ${req.file.originalname}`,
          type: 'info',
        });
      } catch (e) {
        /* silent */
      }
    }

    logger.info(
      `Excel import: ${created.length} created, ${skipped.length} skipped from ${req.file.originalname}`
    );
    res
      .status(201)
      .json({
        message: `${created.length} test case(s) imported successfully`,
        created: created.length,
        skipped: skipped.length,
        skippedDetails: skipped,
        testCases: created,
      });
  } catch (err) {
    logger.error('Excel import error:', err.message);
    next(err);
  }
});

router.get('/import/template', (req, res) => {
  const templateData = [
    {
      Title: 'Login with valid credentials',
      Description: 'Verify user can login with correct email and password',
      Module: 'Authentication',
      Priority: 'High',
      Status: 'Pending',
      Environment: 'Staging',
      Type: 'Functional',
      Tester: 'John Doe',
      Steps: '1. Go to login page\n2. Enter valid email\n3. Enter valid password\n4. Click Login',
      'Expected Result': 'User is redirected to dashboard',
    },
    {
      Title: 'Search functionality',
      Description: 'Verify search returns relevant results',
      Module: 'Search',
      Priority: 'Medium',
      Status: 'Pending',
      Environment: 'Staging',
      Type: 'Functional',
      Tester: '',
      Steps: '1. Click search bar\n2. Type keyword\n3. Press Enter',
      'Expected Result': 'Relevant results are displayed',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');
  ws['!cols'] = [
    { wch: 35 },
    { wch: 50 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 50 },
    { wch: 35 },
  ];
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=testflow-import-template.xlsx');
  res.send(buffer);
});

// GET single test case
router.get('/:id', async (req, res, next) => {
  try {
    const tc = await db('test_cases as tc')
      .leftJoin('testers as t', 'tc.tester_id', 't.id')
      .select(
        'tc.*',
        't.name as tester_name',
        't.initials as tester_initials',
        't.avatar_color as tester_color',
        't.role as tester_role'
      )
      .where('tc.id', req.params.id)
      .first();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });

    const bugs = await db('bugs')
      .where('tc_id', tc.id)
      .select('id', 'bug_id', 'title', 'severity', 'status');
    const comments = await db('comments').where('tc_id', tc.id).orderBy('created_at', 'asc');
    const attachments = await db('test_case_attachments')
      .where('tc_id', tc.id)
      .orderBy('created_at', 'desc');

    res.json({
      ...tc,
      steps: (() => {
        try {
          if (typeof tc.steps === 'string') {
            return JSON.parse(tc.steps || '[]');
          }
          return tc.steps || [];
        } catch (e) {
          logger.warn('Error parsing steps in GET:', e.message);
          return [];
        }
      })(),
      bugs,
      comments,
      attachments,
    });
  } catch (err) {
    next(err);
  }
});

// POST create test case
router.post('/', [body('title').trim().notEmpty()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const {
      title,
      project_id,
      module: mod,
      priority,
      tester_id,
      environment,
      type,
      description,
      steps,
    } = req.body;
    const id = uuidv4();

    // Ensure steps is an array of valid step objects
    let stepsJson = '[]';
    if (Array.isArray(steps) && steps.length > 0) {
      // Filter out empty steps and validate each step
      const validSteps = steps
        .filter(s => {
          if (!s) return false;
          // Check if it's an object with action or expected properties
          if (typeof s === 'object' && (s.action || s.expected)) {
            return true;
          }
          // Check if it's a string representation
          if (typeof s === 'string') {
            try {
              const parsed = JSON.parse(s);
              return parsed && (parsed.action || parsed.expected);
            } catch {
              return false;
            }
          }
          return false;
        })
        .map(s => {
          // Ensure each step is an object
          if (typeof s === 'string') {
            try {
              return JSON.parse(s);
            } catch {
              return s;
            }
          }
          return s;
        });
      stepsJson = JSON.stringify(validSteps);
    }

    await db('test_cases').insert({
      id,
      title,
      project_id: project_id || null,
      module: mod || null,
      priority: priority || 'Medium',
      tester_id: tester_id || null,
      environment: environment || 'Staging',
      type: type || 'Functional',
      description: description || null,
      status: 'Pending',
      steps: stepsJson,
      created_by: req.user.name,
    });
    // Create notification - silently fail if it errors
    try {
      await db('notifications').insert({
        id: uuidv4(),
        title: 'Test case created',
        sub: title.slice(0, 80),
        type: 'info',
      });
    } catch (notifErr) {
      // Silently handle notification errors
    }
    const tc = await db('test_cases').where({ id }).first();

    // Parse steps safely
    let parsedSteps = [];
    try {
      if (tc.steps) {
        // If it's already a string, parse it
        if (typeof tc.steps === 'string') {
          parsedSteps = JSON.parse(tc.steps);
        } else {
          // If it's already an object/array, use it directly
          parsedSteps = tc.steps;
        }
      }
    } catch (parseErr) {
      logger.warn('Failed to parse steps:', parseErr.message);
      parsedSteps = [];
    }

    res.status(201).json({ ...tc, steps: parsedSteps });
  } catch (err) {
    logger.error('Test case creation error:', err.message);
    next(err);
  }
});

// PATCH update test case
router.patch('/:id', async (req, res, next) => {
  try {
    const tc = await db('test_cases').where({ id: req.params.id }).first();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });
    const allowed = [
      'title',
      'project_id',
      'module',
      'priority',
      'status',
      'tester_id',
      'environment',
      'type',
      'description',
      'steps',
    ];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'steps') {
          // Ensure steps is properly serialized
          if (Array.isArray(req.body[f])) {
            const validSteps = req.body[f].filter(s => s && (s.action || s.expected));
            updates[f] = JSON.stringify(validSteps);
          } else {
            updates[f] = JSON.stringify([]);
          }
        } else {
          updates[f] = req.body[f];
        }
      }
    });
    updates.updated_at = new Date();
    await db('test_cases').where({ id: req.params.id }).update(updates);

    // If status changed to Fail and there's no existing bug for this test case, create one
    if (req.body.status === 'Fail' && req.body.status !== tc.status) {
      const existingBug = await db('bugs')
        .where('tc_id', req.params.id)
        .where('status', '!=', 'Closed')
        .first();
      if (!existingBug) {
        const bugId = `BUG-${Date.now()}`;
        await db('bugs').insert({
          id: uuidv4(),
          bug_id: bugId,
          tc_id: req.params.id,
          title: `Failed: ${tc.title}`,
          status: 'Open',
          severity: req.body.priority || tc.priority || 'Medium',
          environment: req.body.environment || tc.environment || 'Staging',
          steps_to_reproduce: tc.description || 'See linked test case',
        });
        await db('notifications').insert({
          id: uuidv4(),
          title: `Bug created: ${bugId}`,
          sub: tc.title.slice(0, 80),
          type: 'bug',
        });
      }
    }

    if (req.body.status && req.body.status !== tc.status) {
      await db('notifications').insert({
        id: uuidv4(),
        title: `TC status → ${req.body.status}`,
        sub: tc.title.slice(0, 80),
        type: req.body.status === 'Fail' ? 'fail' : 'info',
      });
    }
    const updated = await db('test_cases').where({ id: req.params.id }).first();
    let steps = [];
    try {
      if (typeof updated.steps === 'string') {
        steps = JSON.parse(updated.steps || '[]');
      } else {
        steps = updated.steps || [];
      }
    } catch (e) {
      logger.warn('Error parsing steps in PATCH:', e.message);
    }
    res.json({
      ...updated,
      steps,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE single
router.delete('/:id', async (req, res, next) => {
  try {
    const tc = await db('test_cases').where({ id: req.params.id }).first();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });
    await db('test_cases').where({ id: req.params.id }).del();
    res.json({ message: 'Test case deleted' });
  } catch (err) {
    next(err);
  }
});

// DELETE bulk
router.delete('/', [body('ids').isArray().notEmpty()], async (req, res, next) => {
  try {
    const deleted = await db('test_cases').whereIn('id', req.body.ids).del();
    res.json({ message: `${deleted} test case(s) deleted` });
  } catch (err) {
    next(err);
  }
});

// PATCH bulk update test cases
router.patch(
  '/bulk/update',
  [
    body('ids').isArray().notEmpty().withMessage('IDs array required'),
    body('action').isIn(['status', 'priority', 'tester_id']).withMessage('Invalid action'),
    body('value').notEmpty().withMessage('Value required'),
  ],
  async (req, res, next) => {
    try {
      const { ids, action, value } = req.body;

      // Validate action
      const validActions = {
        status: ['Pass', 'Fail', 'In Progress', 'Pending', 'Blocked'],
        priority: ['Critical', 'High', 'Medium', 'Low'],
        tester_id: value, // Any tester ID is valid
      };

      if (action !== 'tester_id') {
        if (!validActions[action].includes(value)) {
          return res.status(400).json({ error: `Invalid ${action} value` });
        }
      }

      // Update test cases
      const updated = await db('test_cases')
        .whereIn('id', ids)
        .update({
          [action]: value,
          updated_at: new Date(),
        });

      logger.info(`Bulk updated ${updated} test cases: ${action}=${value}`);

      res.json({
        message: `${updated} test case(s) updated`,
        updated,
        action,
        value,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET modules list
router.get('/meta/modules', async (req, res, next) => {
  try {
    const rows = await db('test_cases').distinct('module').whereNotNull('module').orderBy('module');
    res.json(rows.map(r => r.module));
  } catch (err) {
    next(err);
  }
});

// ─── ATTACHMENTS ─────────────────────────────

// POST upload attachment(s) to a test case
router.post('/:id/attachments', upload.array('files', 10), async (req, res, next) => {
  try {
    const tcId = req.params.id;
    const tc = await db('test_cases').where('id', tcId).first();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const useCloud = isCloudConfigured();
    const records = [];

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      let filename, url;

      if (useCloud) {
        // Upload buffer to Cloudinary
        const cloudResult = await uploadToCloud(file.buffer, file.originalname, file.mimetype);
        filename = cloudResult.publicId; // Cloudinary public_id for deletion
        url = cloudResult.url; // Secure URL for display
      } else {
        // Disk storage fallback (file already saved by multer)
        filename = file.filename;
        url = null;
      }

      records.push({
        id: uuidv4(),
        tc_id: tcId,
        filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        type: isVideo ? 'recording' : 'screenshot',
        uploaded_by: req.user?.name || req.user?.email || 'Unknown',
        url,
      });
    }

    await db('test_case_attachments').insert(records);
    logger.info(
      `Uploaded ${records.length} attachment(s) for TC ${tcId}${useCloud ? ' (Cloudinary)' : ' (disk)'}`
    );

    res.status(201).json(records);
  } catch (err) {
    next(err);
  }
});

// GET attachments for a test case
router.get('/:id/attachments', async (req, res, next) => {
  try {
    const attachments = await db('test_case_attachments')
      .where('tc_id', req.params.id)
      .orderBy('created_at', 'desc');
    res.json(attachments);
  } catch (err) {
    next(err);
  }
});

// DELETE a single attachment
router.delete('/:id/attachments/:attachmentId', async (req, res, next) => {
  try {
    const att = await db('test_case_attachments')
      .where({ id: req.params.attachmentId, tc_id: req.params.id })
      .first();
    if (!att) return res.status(404).json({ error: 'Attachment not found' });

    if (att.url && isCloudConfigured()) {
      // Delete from Cloudinary
      await deleteFromCloud(att.filename, att.mime_type); // filename stores the Cloudinary public_id
    } else {
      // Delete from local disk
      const filePath = path.join(uploadsDir, att.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db('test_case_attachments').where('id', att.id).del();
    logger.info(`Deleted attachment ${att.id} from TC ${req.params.id}`);

    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    next(err);
  }
});

// DELETE orphaned attachments (no cloud URL, files lost after redeploy)
router.delete('/cleanup/orphaned-attachments', async (req, res, next) => {
  try {
    const deleted = await db('test_case_attachments').whereNull('url').orWhere('url', '').del();
    logger.info(`Cleaned up ${deleted} orphaned attachment(s)`);
    res.json({ message: `${deleted} orphaned attachment(s) removed` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
