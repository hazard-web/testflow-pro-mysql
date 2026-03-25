// ─────────────────────────────────────────────
//  Database Seed — MySQL version
//  Uses app-level UUIDs (no gen_random_uuid())
//  Run: npm run seed
// ─────────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

async function seed() {
  try {
    console.log('\n🌱 Seeding MySQL database...\n');

    // ── Disable FK checks for clean wipe ──
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');
    await db('notifications').del();
    await db('comments').del();
    await db('run_test_cases').del();
    await db('bugs').del();
    await db('test_cases').del();
    await db('test_runs').del();
    await db('developers').del();
    await db('testers').del();
    await db('users').del();
    await db('projects').del();
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  ✔ Cleared existing data');

    // ── Users ──
    const hash = await bcrypt.hash('Password@123', 12);
    const userRows = [
      {
        id: uuidv4(),
        name: 'Anil Kumar',
        email: 'anil@testflow.dev',
        password_hash: hash,
        role: 'lead_qa',
        initials: 'AK',
        avatar_color: 'av-blue',
      },
      {
        id: uuidv4(),
        name: 'Priya Sharma',
        email: 'priya@testflow.dev',
        password_hash: hash,
        role: 'qa_engineer',
        initials: 'PS',
        avatar_color: 'av-green',
      },
      {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@testflow.dev',
        password_hash: hash,
        role: 'admin',
        initials: 'AD',
        avatar_color: 'av-violet',
      },
      {
        id: uuidv4(),
        name: 'Manager User',
        email: 'manager@testflow.dev',
        password_hash: hash,
        role: 'manager',
        initials: 'MU',
        avatar_color: 'av-amber',
      },
    ];
    await db('users').insert(userRows);
    console.log('  ✔ Users (3)');

    // ── Testers ──
    const psId = uuidv4(),
      rmId = uuidv4(),
      arId = uuidv4(),
      vnId = uuidv4(),
      npId = uuidv4();
    await db('testers').insert([
      {
        id: psId,
        name: 'Priya Sharma',
        initials: 'PS',
        role: 'QA Engineer',
        avatar_color: 'av-green',
        is_active: true,
        email: 'priya@testflow.dev',
      },
      {
        id: rmId,
        name: 'Raj Mehta',
        initials: 'RM',
        role: 'QA Engineer',
        avatar_color: 'av-amber',
        is_active: true,
        email: 'raj@testflow.dev',
      },
      {
        id: arId,
        name: 'Anita Rao',
        initials: 'AR',
        role: 'QA Engineer',
        avatar_color: 'av-violet',
        is_active: true,
        email: 'anita@testflow.dev',
      },
      {
        id: vnId,
        name: 'Vikram Nair',
        initials: 'VN',
        role: 'SDET',
        avatar_color: 'av-blue',
        is_active: true,
        email: 'vikram@testflow.dev',
      },
      {
        id: npId,
        name: 'Neha Patil',
        initials: 'NP',
        role: 'Junior QA',
        avatar_color: 'av-red',
        is_active: false,
        email: 'neha@testflow.dev',
      },
    ]);
    console.log('  ✔ Testers (5)');

    // ── Developers ──
    const dkId = uuidv4(),
      srId = uuidv4(),
      apId = uuidv4();
    await db('developers').insert([
      {
        id: dkId,
        name: 'Dev Kumar',
        initials: 'DK',
        specialisation: 'Backend',
        avatar_color: 'av-green',
        email: 'devkumar@testflow.dev',
      },
      {
        id: srId,
        name: 'Sneha Rao',
        initials: 'SR',
        specialisation: 'Frontend',
        avatar_color: 'av-violet',
        email: 'sneha@testflow.dev',
      },
      {
        id: apId,
        name: 'Arjun Pillai',
        initials: 'AP',
        specialisation: 'Full Stack',
        avatar_color: 'av-blue',
        email: 'arjun@testflow.dev',
      },
    ]);
    console.log('  ✔ Developers (3)');

    // ── Projects ──
    const projAuthId = uuidv4(),
      projPayId = uuidv4(),
      projMediaId = uuidv4();
    await db('projects').insert([
      {
        id: projAuthId,
        name: 'Authentication Module',
        description: 'User login, signup, and password reset flows',
        status: 'Active',
        color: 'av-blue',
      },
      {
        id: projPayId,
        name: 'Payment System',
        description: 'Card payments, billing, and subscriptions',
        status: 'Active',
        color: 'av-green',
      },
      {
        id: projMediaId,
        name: 'Media Management',
        description: 'Photo upload, CDN, and image processing',
        status: 'Active',
        color: 'av-violet',
      },
    ]);
    console.log('  ✔ Projects (3)');

    // ── Test Cases ──
    const tc1 = uuidv4(),
      tc2 = uuidv4(),
      tc4 = uuidv4(),
      tc7 = uuidv4(),
      tc11 = uuidv4(),
      tc15 = uuidv4(),
      tc19 = uuidv4();

    await db('test_cases').insert([
      {
        id: tc1,
        project_id: projAuthId,
        title: 'TC-001: User login with valid credentials',
        module: 'Authentication',
        priority: 'High',
        status: 'Pass',
        environment: 'Staging',
        type: 'Functional',
        tester_id: psId,
        description: 'Verify login works with correct credentials.',
        steps: JSON.stringify([
          { action: 'Navigate to /login', expected: 'Login form renders <1s' },
          { action: 'Enter valid email and password', expected: 'Fields accept input' },
          { action: 'Click Sign In', expected: 'POST /auth/login fires' },
          { action: 'Verify redirect to /dashboard', expected: 'Dashboard loads <2s' },
        ]),
      },
      {
        id: tc2,
        project_id: projAuthId,
        title: 'TC-002: Login with invalid credentials',
        module: 'Authentication',
        priority: 'High',
        status: 'Pass',
        environment: 'Staging',
        type: 'Functional',
        tester_id: psId,
        description: 'Verify error shown on bad credentials.',
        steps: JSON.stringify([
          { action: 'Navigate to /login', expected: 'Login form visible' },
          { action: 'Enter wrong password', expected: 'Field accepts input' },
          { action: 'Click Sign In', expected: 'Error shown, no redirect' },
        ]),
      },
      {
        id: tc4,
        project_id: projPayId,
        title: 'TC-004: Checkout with card payment',
        module: 'Payments',
        priority: 'Critical',
        status: 'Fail',
        environment: 'Staging',
        type: 'Functional',
        tester_id: rmId,
        description: 'End-to-end card checkout flow.',
        steps: JSON.stringify([
          { action: 'Navigate to /checkout', expected: 'Page loads <2s' },
          { action: 'Add item to cart', expected: 'Correct item shown' },
          { action: 'Enter test card', expected: 'Luhn check passes' },
          { action: 'Click Pay Now', expected: 'POST /payment/charge fires' },
          {
            action: 'Payment gateway processes',
            expected: '200 OK within 5s',
            actual: '500 — STRIPE_SECRET_KEY not set',
          },
          {
            action: 'Verify success page',
            expected: 'Order ID shown',
            actual: 'Error screen shown',
          },
        ]),
      },
      {
        id: tc7,
        project_id: projMediaId,
        title: 'TC-007: Profile photo upload — all formats',
        module: 'Media',
        priority: 'Medium',
        status: 'Pass',
        environment: 'Staging',
        type: 'Functional',
        tester_id: arId,
        description: 'Verify JPG, PNG, WebP uploads all work.',
        steps: JSON.stringify([
          { action: 'Navigate to /profile', expected: 'Page loads' },
          { action: 'Click upload photo', expected: 'File picker opens' },
          { action: 'Select JPG file <5MB', expected: 'Preview shown' },
          { action: 'Click Save', expected: 'Photo saved' },
        ]),
      },
      {
        id: tc11,
        project_id: null,
        title: 'TC-011: API rate limit enforcement',
        module: 'API',
        priority: 'High',
        status: 'In Progress',
        environment: 'Staging',
        type: 'API',
        tester_id: vnId,
        description: 'Verify 429 returned after rate limit exceeded.',
        steps: JSON.stringify([
          { action: 'Send 100 requests in 60s', expected: 'All succeed initially' },
          { action: 'Send 101st request', expected: '429 Too Many Requests' },
          { action: 'Wait 60s and retry', expected: 'Request succeeds' },
        ]),
      },
      {
        id: tc15,
        project_id: null,
        title: 'TC-015: Dashboard load performance',
        module: 'Performance',
        priority: 'Medium',
        status: 'Pending',
        environment: 'Staging',
        type: 'Performance',
        tester_id: null,
        description: 'Dashboard should load under 3s on 4G.',
        steps: JSON.stringify([
          { action: 'Clear cache, navigate to /dashboard', expected: 'Rendering starts <1s' },
          { action: 'Measure full page load', expected: 'Complete load <3s on 4G' },
          { action: 'Check Core Web Vitals', expected: 'LCP <2.5s, CLS <0.1' },
        ]),
      },
      {
        id: tc19,
        project_id: projAuthId,
        title: 'TC-019: Password reset email delivery',
        module: 'Authentication',
        priority: 'High',
        status: 'Fail',
        environment: 'Staging',
        type: 'Functional',
        tester_id: psId,
        description: 'Verify password reset email is delivered.',
        steps: JSON.stringify([
          { action: 'Navigate to /forgot-password', expected: 'Form shown' },
          { action: 'Enter registered email', expected: 'Field accepts input' },
          { action: 'Click Send Reset Link', expected: 'Success message shown' },
          { action: 'Check inbox', expected: 'Email in 2 min', actual: 'Not delivered on Outlook' },
        ]),
      },
    ]);
    console.log('  ✔ Test cases (7)');

    // ── Bugs ──
    const b12 = uuidv4(),
      b13 = uuidv4(),
      b11 = uuidv4(),
      b10 = uuidv4(),
      b09 = uuidv4();
    await db('bugs').insert([
      {
        id: b12,
        bug_id: 'BUG-012',
        title: 'Payment API 500 on staging environment',
        severity: 'High',
        status: 'In Progress',
        tc_id: tc4,
        developer_id: dkId,
        environment: 'Staging',
        platform: 'All browsers',
        steps_to_reproduce: '1. Go to /checkout\n2. Add item\n3. Click Pay Now',
        actual_result: '500 — STRIPE_SECRET_KEY not set',
        expected_result: '200 OK, redirect to /order-confirm',
        reporter: 'Raj M.',
      },
      {
        id: b13,
        bug_id: 'BUG-013',
        title: 'Password reset email not delivered on Outlook',
        severity: 'High',
        status: 'Open',
        tc_id: tc19,
        developer_id: srId,
        environment: 'Staging',
        platform: 'All',
        steps_to_reproduce: '1. Go to /forgot-password\n2. Submit email',
        actual_result: 'Email not received',
        expected_result: 'Email within 2 min',
        reporter: 'Priya S.',
      },
      {
        id: b11,
        bug_id: 'BUG-011',
        title: 'Profile picture not saving on Safari 17',
        severity: 'Medium',
        status: 'Open',
        tc_id: tc7,
        developer_id: apId,
        environment: 'Production',
        platform: 'Safari 17 / macOS',
        steps_to_reproduce: '1. Go to /profile\n2. Upload photo\n3. Save',
        actual_result: 'Photo reverts after refresh',
        expected_result: 'Photo persists',
        reporter: 'Anita R.',
      },
      {
        id: b10,
        bug_id: 'BUG-010',
        title: 'Login redirect loop on session expiry',
        severity: 'High',
        status: 'Resolved',
        tc_id: null,
        developer_id: dkId,
        environment: 'Staging',
        platform: 'All',
        steps_to_reproduce: '1. Let session expire\n2. Access protected route',
        actual_result: 'Infinite redirect loop',
        expected_result: 'Redirect to /login once',
        reporter: 'Priya S.',
      },
      {
        id: b09,
        bug_id: 'BUG-009',
        title: 'Date picker z-index conflict on modals',
        severity: 'Low',
        status: 'Open',
        tc_id: null,
        developer_id: apId,
        environment: 'Staging',
        platform: 'Chrome 122',
        steps_to_reproduce: '1. Open modal with date picker\n2. Observe',
        actual_result: 'Date picker hidden behind overlay',
        expected_result: 'Date picker visible on top',
        reporter: 'Vikram N.',
      },
    ]);
    console.log('  ✔ Bugs (5)');

    // ── Test Runs ──
    const run7Id = uuidv4(),
      run6Id = uuidv4(),
      run5Id = uuidv4();
    await db('test_runs').insert([
      {
        id: run7Id,
        run_id: 'RUN-007',
        name: 'Sprint 7 — Full Regression',
        environment: 'Staging',
        sprint: 'Sprint 7',
        status: 'In Progress',
        created_by: 'Anil Kumar',
      },
      {
        id: run6Id,
        run_id: 'RUN-006',
        name: 'Sprint 6 — Final',
        environment: 'Staging',
        sprint: 'Sprint 6',
        status: 'Complete',
        created_by: 'Anil Kumar',
      },
      {
        id: run5Id,
        run_id: 'RUN-005',
        name: 'Hotfix — Payment module',
        environment: 'Production',
        sprint: 'Hotfix',
        status: 'Complete',
        created_by: 'Raj Mehta',
      },
    ]);
    // Link all TCs to run 7
    await db('run_test_cases').insert(
      [tc1, tc2, tc4, tc7, tc11, tc15, tc19].map(tcId => ({ run_id: run7Id, tc_id: tcId }))
    );
    console.log('  ✔ Test runs (3)');

    // ── Comments ──
    await db('comments').insert([
      {
        id: uuidv4(),
        body: 'All steps pass cleanly on Chrome, Firefox and Safari. @AK marking complete.',
        author_name: 'Priya S.',
        author_initials: 'PS',
        author_color: 'av-green',
        author_role: 'qa',
        role_label: 'QA',
        tc_id: tc1,
        bug_id: null,
        is_dev_thread: false,
      },
      {
        id: uuidv4(),
        body: 'Approved. Moving to regression baseline. Good job @Priya.',
        author_name: 'Anil K.',
        author_initials: 'AK',
        author_color: 'av-blue',
        author_role: 'lead',
        role_label: 'Lead QA',
        tc_id: tc1,
        bug_id: null,
        is_dev_thread: false,
      },
      {
        id: uuidv4(),
        body: 'Step 5 fails — 500 from payment API. STRIPE_SECRET_KEY not set. Tagging @DevKumar.',
        author_name: 'Raj M.',
        author_initials: 'RM',
        author_color: 'av-amber',
        author_role: 'qa',
        role_label: 'QA',
        tc_id: tc4,
        bug_id: null,
        is_dev_thread: false,
      },
      {
        id: uuidv4(),
        body: 'Confirmed — Stripe key missing after last deploy. Pushing fix. @Raj re-run in 30min.',
        author_name: 'Dev Kumar',
        author_initials: 'DK',
        author_color: 'av-green',
        author_role: 'dev',
        role_label: 'Developer',
        tc_id: tc4,
        bug_id: null,
        is_dev_thread: false,
      },
      {
        id: uuidv4(),
        body: '@DevKumar BUG-012 still open — TC-004 step 5 failing with 500. Check staging env?',
        author_name: 'Raj M.',
        author_initials: 'RM',
        author_color: 'av-amber',
        author_role: 'qa',
        role_label: 'QA',
        tc_id: null,
        bug_id: null,
        is_dev_thread: true,
      },
      {
        id: uuidv4(),
        body: 'Stripe secret wiped in last deploy. Fix pushed — live ~10min. @Raj re-run TC-004.',
        author_name: 'Dev Kumar',
        author_initials: 'DK',
        author_color: 'av-green',
        author_role: 'dev',
        role_label: 'Developer',
        tc_id: null,
        bug_id: null,
        is_dev_thread: true,
      },
      {
        id: uuidv4(),
        body: 'BUG-011: Safari FileReader handles blobs differently. Working on polyfill. ETA tmrw.',
        author_name: 'Sneha Rao',
        author_initials: 'SR',
        author_color: 'av-violet',
        author_role: 'dev',
        role_label: 'Developer',
        tc_id: null,
        bug_id: null,
        is_dev_thread: true,
      },
    ]);
    console.log('  ✔ Comments (7)');

    // ── Notifications ──
    await db('notifications').insert([
      {
        id: uuidv4(),
        title: 'TC-004 marked as Failed',
        sub: 'Raj M. · Payments module',
        type: 'fail',
        is_read: false,
      },
      {
        id: uuidv4(),
        title: 'BUG-012 assigned to Dev Kumar',
        sub: 'High severity · Staging',
        type: 'bug',
        is_read: false,
      },
      {
        id: uuidv4(),
        title: 'Dev Kumar commented on BUG-012',
        sub: '"Pushing fix to staging…"',
        type: 'comment',
        is_read: false,
      },
      {
        id: uuidv4(),
        title: 'Priya S. completed TC-001',
        sub: 'All 4 steps passed',
        type: 'pass',
        is_read: true,
      },
      {
        id: uuidv4(),
        title: 'New test run RUN-007 created',
        sub: 'Sprint 7 · 7 TCs linked',
        type: 'info',
        is_read: true,
      },
    ]);
    console.log('  ✔ Notifications (5)');

    console.log('\n✅ MySQL seed complete!\n');
    console.log('  Default login credentials:');
    console.log('  Email   : admin@testflow.dev');
    console.log('  Password: Password@123\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
