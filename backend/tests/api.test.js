/* eslint-env jest */
/**
 * @jest-environment node
 */
// ─────────────────────────────────────────────
//  Tests — Auth + Test Cases + Bugs
// ─────────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/database');

let token = '';
let tcId = '';
let bugId = '';

beforeAll(async () => {
  // Login and get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@testflow.dev', password: 'Password@123' });
  token = res.body.accessToken;
});

afterAll(async () => {
  await db.destroy();
});

// ── AUTH ─────────────────────────────────────
describe('Auth', () => {
  test('POST /api/auth/login — valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@testflow.dev', password: 'Password@123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('admin@testflow.dev');
  });

  test('POST /api/auth/login — wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@testflow.dev', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — returns current user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email');
  });

  test('GET /api/auth/me — no token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── TEST CASES ───────────────────────────────
describe('Test Cases', () => {
  test('GET /api/test-cases — returns array', async () => {
    const res = await request(app).get('/api/test-cases').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  test('POST /api/test-cases — creates test case', async () => {
    const res = await request(app)
      .post('/api/test-cases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'TEST: Sample test case from jest',
        module: 'Testing',
        priority: 'Medium',
        steps: [{ action: 'Do something', expected: 'Something happens' }],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    tcId = res.body.id;
  });

  test('GET /api/test-cases/:id — returns single TC', async () => {
    const res = await request(app)
      .get(`/api/test-cases/${tcId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(tcId);
  });

  test('PATCH /api/test-cases/:id — updates status', async () => {
    const res = await request(app)
      .patch(`/api/test-cases/${tcId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Pass' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Pass');
  });

  test('POST /api/test-cases — missing title → 422', async () => {
    const res = await request(app)
      .post('/api/test-cases')
      .set('Authorization', `Bearer ${token}`)
      .send({ module: 'NoTitle' });
    expect(res.status).toBe(422);
  });

  test('GET /api/test-cases?status=Pass — filters by status', async () => {
    const res = await request(app)
      .get('/api/test-cases?status=Pass')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(tc => expect(tc.status).toBe('Pass'));
  });

  test('DELETE /api/test-cases/:id — deletes TC', async () => {
    const res = await request(app)
      .delete(`/api/test-cases/${tcId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ── BUGS ─────────────────────────────────────
describe('Bugs', () => {
  test('GET /api/bugs — returns array', async () => {
    const res = await request(app).get('/api/bugs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/bugs — creates bug', async () => {
    const res = await request(app).post('/api/bugs').set('Authorization', `Bearer ${token}`).send({
      title: 'TEST: Sample bug from jest',
      severity: 'Medium',
      environment: 'Staging',
      actual_result: 'Error occurred',
      expected_result: 'Should succeed',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    bugId = res.body.id;
  });

  test('PATCH /api/bugs/:id — updates status', async () => {
    const res = await request(app)
      .patch(`/api/bugs/${bugId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Resolved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });

  test('DELETE /api/bugs/:id — deletes bug', async () => {
    const res = await request(app)
      .delete(`/api/bugs/${bugId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ── TESTERS ──────────────────────────────────
describe('Testers', () => {
  test('GET /api/testers — returns testers with stats', async () => {
    const res = await request(app).get('/api/testers').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      expect(res.body[0]).toHaveProperty('pass_rate');
      expect(res.body[0]).toHaveProperty('cases_assigned');
    }
  });
});

// ── REPORTS ──────────────────────────────────
describe('Reports', () => {
  test('GET /api/reports/summary — returns summary stats', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('testCases');
    expect(res.body).toHaveProperty('bugs');
  });
});
