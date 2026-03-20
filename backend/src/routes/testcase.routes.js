// ─────────────────────────────────────────────
//  Test Case Routes — /api/test-cases  (MySQL)
// ─────────────────────────────────────────────
const router = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

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
      search,
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
    if (search) qry = qry.where('tc.title', 'like', `%${search}%`);

    let countQry = db('test_cases');
    if (status) countQry = countQry.where('status', status);
    if (priority) countQry = countQry.where('priority', priority);
    if (mod) countQry = countQry.where('module', mod);
    if (tester_id) countQry = countQry.where('tester_id', tester_id);
    if (project_id) countQry = countQry.where('project_id', project_id);
    if (search) countQry = countQry.where('title', 'like', `%${search}%`);
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

// GET modules list
router.get('/meta/modules', async (req, res, next) => {
  try {
    const rows = await db('test_cases').distinct('module').whereNotNull('module').orderBy('module');
    res.json(rows.map(r => r.module));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
