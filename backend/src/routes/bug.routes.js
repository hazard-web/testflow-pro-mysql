// ─────────────────────────────────────────────
//  Bug Routes — /api/bugs  (MySQL)
// ─────────────────────────────────────────────
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET all bugs
router.get('/', async (req, res, next) => {
  try {
    const { status, severity, developer_id, search } = req.query;
    let qry = db('bugs as b')
      .leftJoin('developers as d', 'b.developer_id', 'd.id')
      .leftJoin('test_cases as tc', 'b.tc_id', 'tc.id')
      .select(
        'b.*',
        'd.name as developer_name',
        'd.initials as developer_initials',
        'd.avatar_color as developer_color',
        'tc.title as tc_title'
      )
      .orderBy('b.created_at', 'desc');
    if (status) qry = qry.where('b.status', status);
    if (severity) qry = qry.where('b.severity', severity);
    if (developer_id) qry = qry.where('b.developer_id', developer_id);
    if (search) qry = qry.where('b.title', 'like', `%${search}%`);
    res.json(await qry);
  } catch (err) {
    next(err);
  }
});

// GET single bug
router.get('/:id', async (req, res, next) => {
  try {
    const bug = await db('bugs as b')
      .leftJoin('developers as d', 'b.developer_id', 'd.id')
      .leftJoin('test_cases as tc', 'b.tc_id', 'tc.id')
      .select('b.*', 'd.name as developer_name', 'tc.title as tc_title')
      .where('b.id', req.params.id)
      .first();
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    res.json(bug);
  } catch (err) {
    next(err);
  }
});

// POST create bug
router.post('/', [body('title').trim().notEmpty()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    // Get the highest bug number to avoid duplicates
    const lastBug = await db('bugs')
      .select('bug_id')
      .orderByRaw('CAST(SUBSTRING(bug_id, 5) AS UNSIGNED) DESC')
      .limit(1)
      .first();

    let nextNum = 1;
    if (lastBug && lastBug.bug_id) {
      const lastNum = parseInt(lastBug.bug_id.substring(4));
      nextNum = lastNum + 1;
    }

    const bugId = 'BUG-' + String(nextNum).padStart(3, '0');
    const id = uuidv4();
    await db('bugs').insert({
      id,
      bug_id: bugId,
      status: 'Open',
      reporter: req.user.name,
      ...req.body,
    });
    await db('notifications').insert({
      id: uuidv4(),
      title: `Bug reported: ${bugId}`,
      sub: req.body.title.slice(0, 80),
      type: 'bug',
    });
    const bug = await db('bugs').where({ id }).first();
    res.status(201).json(bug);
  } catch (err) {
    next(err);
  }
});

// PATCH update bug
router.patch('/:id', async (req, res, next) => {
  try {
    const bug = await db('bugs').where({ id: req.params.id }).first();
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    const allowed = [
      'title',
      'severity',
      'status',
      'tc_id',
      'developer_id',
      'environment',
      'platform',
      'steps_to_reproduce',
      'actual_result',
      'expected_result',
    ];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    updates.updated_at = new Date();
    await db('bugs').where({ id: req.params.id }).update(updates);
    res.json(await db('bugs').where({ id: req.params.id }).first());
  } catch (err) {
    next(err);
  }
});

// DELETE bug
router.delete('/:id', async (req, res, next) => {
  try {
    await db('bugs').where({ id: req.params.id }).del();
    res.json({ message: 'Bug deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
