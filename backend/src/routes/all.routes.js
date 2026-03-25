// ─────────────────────────────────────────────
//  All remaining routes — MySQL version
// ─────────────────────────────────────────────
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ── TESTERS ──────────────────────────────────
const testerRouter = express.Router();
testerRouter.use(authenticate);

// ── MANAGERS ─────────────────────────────────
const managerRouter = express.Router();
managerRouter.use(authenticate);

managerRouter.get('/', async (req, res, next) => {
  try {
    const managers = await db('managers').orderBy('name');
    res.json(managers);
  } catch (err) {
    next(err);
  }
});

// Admin-only helper
const requireAdmin = (req, res, next) => {
  if (req.user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action' });
  }
  next();
};

managerRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidv4();
    await db('managers').insert({ id, ...req.body });
    res.status(201).json(await db('managers').where({ id }).first());
  } catch (err) {
    next(err);
  }
});

managerRouter.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db('managers')
      .where({ id: req.params.id })
      .update({ ...req.body, updated_at: new Date() });
    const m = await db('managers').where({ id: req.params.id }).first();
    if (!m) return res.status(404).json({ error: 'Manager not found' });
    res.json(m);
  } catch (err) {
    next(err);
  }
});

managerRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db('managers').where({ id: req.params.id }).del();
    res.json({ message: 'Manager removed' });
  } catch (err) {
    next(err);
  }
});

testerRouter.get('/', async (req, res, next) => {
  try {
    const testers = await db('testers').orderBy('name');
    const withStats = await Promise.all(
      testers.map(async t => {
        const [assigned, passed] = await Promise.all([
          db('test_cases').where('tester_id', t.id).count('id as c').first(),
          db('test_cases').where({ tester_id: t.id, status: 'Pass' }).count('id as c').first(),
        ]);
        const a = parseInt(assigned.c),
          p = parseInt(passed.c);
        return {
          ...t,
          cases_assigned: a,
          cases_passed: p,
          pass_rate: a ? Math.round((p / a) * 100) : 0,
        };
      })
    );
    res.json(withStats);
  } catch (err) {
    next(err);
  }
});

testerRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidv4();
    await db('testers').insert({ id, ...req.body });
    res.status(201).json(await db('testers').where({ id }).first());
  } catch (err) {
    next(err);
  }
});

testerRouter.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db('testers')
      .where({ id: req.params.id })
      .update({ ...req.body, updated_at: new Date() });
    const t = await db('testers').where({ id: req.params.id }).first();
    if (!t) return res.status(404).json({ error: 'Tester not found' });
    res.json(t);
  } catch (err) {
    next(err);
  }
});

testerRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await db('testers').where({ id: req.params.id }).del();
    res.json({ message: 'Tester removed' });
  } catch (err) {
    next(err);
  }
});

// ── RUNS ─────────────────────────────────────
const runRouter = express.Router();
runRouter.use(authenticate);

runRouter.get('/', async (req, res, next) => {
  try {
    const runs = await db('test_runs').orderBy('created_at', 'desc');
    const withStats = await Promise.all(
      runs.map(async r => {
        const tcIds = await db('run_test_cases').where('run_id', r.id).pluck('tc_id');
        const passed = tcIds.length
          ? await db('test_cases')
              .whereIn('id', tcIds)
              .where('status', 'Pass')
              .count('id as c')
              .first()
          : { c: 0 };
        return {
          ...r,
          tc_count: tcIds.length,
          passed: parseInt(passed.c),
          pass_rate: tcIds.length ? Math.round((parseInt(passed.c) / tcIds.length) * 100) : 0,
        };
      })
    );
    res.json(withStats);
  } catch (err) {
    next(err);
  }
});

runRouter.post('/', async (req, res, next) => {
  try {
    const count = await db('test_runs').count('id as c').first();
    const runId = 'RUN-' + String(parseInt(count.c) + 1).padStart(3, '0');
    const id = uuidv4();
    await db('test_runs').insert({
      id,
      ...req.body,
      run_id: runId,
      status: 'In Progress',
      created_by: req.user.name,
    });
    const allTCs = await db('test_cases').pluck('id');
    if (allTCs.length) {
      await db('run_test_cases').insert(allTCs.map(tcId => ({ run_id: id, tc_id: tcId })));
    }
    res
      .status(201)
      .json({ ...(await db('test_runs').where({ id }).first()), tc_count: allTCs.length });
  } catch (err) {
    next(err);
  }
});

runRouter.patch('/:id', async (req, res, next) => {
  try {
    await db('test_runs')
      .where({ id: req.params.id })
      .update({ ...req.body, updated_at: new Date() });
    const r = await db('test_runs').where({ id: req.params.id }).first();
    if (!r) return res.status(404).json({ error: 'Run not found' });
    res.json(r);
  } catch (err) {
    next(err);
  }
});

runRouter.delete('/:id', async (req, res, next) => {
  try {
    await db('test_runs').where({ id: req.params.id }).del();
    res.json({ message: 'Run deleted' });
  } catch (err) {
    next(err);
  }
});

// ── COMMENTS ─────────────────────────────────
const commentRouter = express.Router();
commentRouter.use(authenticate);

commentRouter.get('/', async (req, res, next) => {
  try {
    const { tc_id, bug_id, is_dev_thread } = req.query;
    let qry = db('comments').orderBy('created_at', 'asc');
    if (tc_id) qry = qry.where('tc_id', tc_id);
    if (bug_id) qry = qry.where('bug_id', bug_id);
    if (is_dev_thread !== undefined)
      qry = qry.where('is_dev_thread', is_dev_thread === 'true' ? 1 : 0);
    res.json(await qry);
  } catch (err) {
    next(err);
  }
});

commentRouter.post('/', async (req, res, next) => {
  try {
    const u = req.user;
    const id = uuidv4();
    await db('comments').insert({
      id,
      body: req.body.body,
      author_name: u.name,
      author_initials:
        u.initials ||
        u.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2),
      author_color: u.avatar_color || 'av-blue',
      author_role: u.role || 'qa',
      role_label: req.body.role_label || 'QA',
      tc_id: req.body.tc_id || null,
      bug_id: req.body.bug_id || null,
      is_dev_thread: req.body.is_dev_thread ? 1 : 0,
    });

    // ── Detect @mentions and create notifications ──
    const mentionRegex = /@([\w]+(?:\s[\w]+)?)/g;
    const body = req.body.body || '';
    const mentionedNames = [];
    let match;
    while ((match = mentionRegex.exec(body)) !== null) {
      mentionedNames.push(match[1].trim());
    }

    if (mentionedNames.length > 0) {
      // Find matching users by name (case-insensitive)
      const mentionedUsers = await db('users')
        .whereIn(
          db.raw('LOWER(name)'),
          mentionedNames.map(n => n.toLowerCase())
        )
        .andWhereNot('id', u.id); // Don't notify yourself

      const context = req.body.tc_id ? 'a test case' : req.body.bug_id ? 'a bug' : 'Dev Connect';

      const relatedUrl = req.body.tc_id
        ? `/test-cases/${req.body.tc_id}`
        : req.body.bug_id
          ? `/bugs`
          : `/dev-connect`;

      // Create a notification for each mentioned user
      for (const mentionedUser of mentionedUsers) {
        await db('notifications').insert({
          id: uuidv4(),
          user_id: mentionedUser.id,
          title: `${u.name} mentioned you in ${context}`,
          sub: body.length > 80 ? body.substring(0, 80) + '...' : body,
          type: 'mention',
          related_url: relatedUrl,
          is_read: 0,
        });
      }
    }

    res.status(201).json(await db('comments').where({ id }).first());
  } catch (err) {
    next(err);
  }
});

commentRouter.delete('/:id', async (req, res, next) => {
  try {
    await db('comments').where({ id: req.params.id }).del();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

// ── REPORTS ──────────────────────────────────
const reportRouter = express.Router();
reportRouter.use(authenticate);

reportRouter.get('/summary', async (req, res, next) => {
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

reportRouter.get('/tester-performance', async (req, res, next) => {
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

// ── NOTIFICATIONS ────────────────────────────
const notifRouter = express.Router();
notifRouter.use(authenticate);

// Get notifications for current user (user-specific + global where user_id is null)
notifRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifs = await db('notifications')
      .where('user_id', userId)
      .orWhereNull('user_id')
      .orderBy('created_at', 'desc')
      .limit(50);
    res.json(notifs);
  } catch (err) {
    next(err);
  }
});

// Get only unread count (lightweight endpoint for polling)
notifRouter.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await db('notifications')
      .where(function () {
        this.where('user_id', userId).orWhereNull('user_id');
      })
      .andWhere('is_read', 0)
      .count('id as count')
      .first();
    res.json({ count: parseInt(result.count) });
  } catch (err) {
    next(err);
  }
});

// Create a notification (internal use or admin)
notifRouter.post('/', async (req, res, next) => {
  try {
    const id = uuidv4();
    await db('notifications').insert({
      id,
      user_id: req.body.user_id || null,
      title: req.body.title,
      sub: req.body.sub || null,
      type: req.body.type || 'info',
      related_url: req.body.related_url || null,
    });
    res.status(201).json(await db('notifications').where({ id }).first());
  } catch (err) {
    next(err);
  }
});

notifRouter.patch('/mark-all-read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await db('notifications')
      .where(function () {
        this.where('user_id', userId).orWhereNull('user_id');
      })
      .update({ is_read: 1 });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
});

notifRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await db('notifications').where({ id: req.params.id }).update({ is_read: 1 });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

// ── USERS / DEVELOPERS ───────────────────────
const userRouter = express.Router();
userRouter.use(authenticate);

userRouter.get('/', async (req, res, next) => {
  try {
    const users = await db('users').select(
      'id',
      'name',
      'email',
      'role',
      'initials',
      'avatar_color',
      'is_active',
      'last_login',
      'created_at'
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
});

userRouter.patch('/profile', async (req, res, next) => {
  try {
    const allowed = ['name', 'initials', 'avatar_color', 'role'];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f]) updates[f] = req.body[f];
    });
    await db('users')
      .where({ id: req.user.id })
      .update({ ...updates, updated_at: new Date() });
    res.json(
      await db('users')
        .where({ id: req.user.id })
        .select('id', 'name', 'email', 'role', 'initials', 'avatar_color')
        .first()
    );
  } catch (err) {
    next(err);
  }
});

// Admin-only: update a user's role by email
userRouter.patch('/update-role', requireAdmin, async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'email and role are required' });
    const validRoles = ['Admin', 'Manager', 'QA Engineer', 'Lead QA', 'Developer'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role', validRoles });
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    await db('users').where({ email }).update({ role, updated_at: new Date() });
    res.json({ message: `Role updated to ${role}`, email, role });
  } catch (err) {
    next(err);
  }
});

userRouter.get('/developers', async (req, res, next) => {
  try {
    const devs = await db('developers').orderBy('name');
    const withStats = await Promise.all(
      devs.map(async d => {
        const open = await db('bugs')
          .where({ developer_id: d.id })
          .whereIn('status', ['Open', 'In Progress'])
          .count('id as c')
          .first();
        return { ...d, open_bugs: parseInt(open.c) };
      })
    );
    res.json(withStats);
  } catch (err) {
    next(err);
  }
});

userRouter.post('/developers', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidv4();
    await db('developers').insert({ id, ...req.body });
    res.status(201).json(await db('developers').where({ id }).first());
  } catch (err) {
    next(err);
  }
});

userRouter.patch('/developers/:id', requireAdmin, async (req, res, next) => {
  try {
    await db('developers')
      .where({ id: req.params.id })
      .update({ ...req.body, updated_at: new Date() });
    res.json(await db('developers').where({ id: req.params.id }).first());
  } catch (err) {
    next(err);
  }
});

userRouter.delete('/developers/:id', requireAdmin, async (req, res, next) => {
  try {
    await db('developers').where({ id: req.params.id }).del();
    res.json({ message: 'Developer removed' });
  } catch (err) {
    next(err);
  }
});

// ── PROJECTS ─────────────────────────────────
const projectRouter = express.Router();
projectRouter.use(authenticate);

projectRouter.get('/', async (req, res, next) => {
  try {
    const projects = await db('projects').orderBy('created_at', 'desc');
    const withCounts = await Promise.all(
      projects.map(async p => {
        const count = await db('test_cases').where('project_id', p.id).count('id as c').first();
        return { ...p, test_case_count: parseInt(count.c) || 0 };
      })
    );
    res.json(withCounts);
  } catch (err) {
    next(err);
  }
});

projectRouter.post('/', async (req, res, next) => {
  try {
    const { name, description, status, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Project name required' });
    const id = uuidv4();
    await db('projects').insert({
      id,
      name: name.trim(),
      description: description || null,
      status: status || 'Active',
      color: color || 'av-blue',
    });
    res.status(201).json(await db('projects').where({ id }).first());
  } catch (err) {
    next(err);
  }
});

projectRouter.patch('/:id', async (req, res, next) => {
  try {
    const p = await db('projects').where({ id: req.params.id }).first();
    if (!p) return res.status(404).json({ error: 'Project not found' });
    await db('projects')
      .where({ id: req.params.id })
      .update({ ...req.body, updated_at: db.fn.now() });
    res.json(await db('projects').where({ id: req.params.id }).first());
  } catch (err) {
    next(err);
  }
});

projectRouter.delete('/:id', async (req, res, next) => {
  try {
    const p = await db('projects').where({ id: req.params.id }).first();
    if (!p) return res.status(404).json({ error: 'Project not found' });
    await db('test_cases').where('project_id', req.params.id).update({ project_id: null });
    await db('projects').where({ id: req.params.id }).del();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  testerRouter,
  managerRouter,
  runRouter,
  commentRouter,
  reportRouter,
  notifRouter,
  userRouter,
  projectRouter,
};
