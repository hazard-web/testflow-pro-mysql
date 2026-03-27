// ─────────────────────────────────────────────
//  Test Case Routes — /api/test-cases  (MySQL)
// ─────────────────────────────────────────────
const router = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
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

module.exports = router;
