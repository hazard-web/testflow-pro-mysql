// ─────────────────────────────────────────────
//  Database Migration Runner — MySQL 8
//  Run:   npm run migrate
//  Reset: npm run migrate -- --reset
// ─────────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/database');

const RESET = process.argv.includes('--reset');

async function migrate() {
  try {
    console.log(`\n📦 Running MySQL migrations [${process.env.NODE_ENV}]...\n`);

    if (RESET) {
      console.log('⚠️  RESET mode — dropping all tables...');
      await db.raw('SET FOREIGN_KEY_CHECKS = 0');
      const tables = [
        'notifications',
        'comments',
        'run_test_cases',
        'bugs',
        'test_cases',
        'test_runs',
        'developers',
        'managers',
        'testers',
        'two_fa_attempts',
        'two_fa_settings',
        'password_reset_tokens',
        'audit_logs',
        'failed_login_attempts',
        'refresh_tokens',
        'users',
        'projects',
        'custom_field_values',
        'custom_fields',
        'testcase_workflow_history',
        'workflow_states',
        'reports',
        'knex_migrations',
        'knex_migrations_lock',
      ];
      for (const t of tables) await db.schema.dropTableIfExists(t);
      await db.raw('SET FOREIGN_KEY_CHECKS = 1');
      console.log('  ✔ Tables dropped\n');
    }

    // ── USERS ──────────────────────────────────
    if (!(await db.schema.hasTable('users'))) {
      await db.schema.createTable('users', t => {
        t.string('id', 36).primary();
        t.string('name', 100).notNullable();
        t.string('email', 200).notNullable().unique();
        t.string('password_hash', 255).notNullable();
        t.string('role', 50).defaultTo('QA Engineer');
        t.string('initials', 10);
        t.string('avatar_color', 30).defaultTo('av-blue');
        t.boolean('is_active').defaultTo(true);
        t.timestamp('last_login').nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ users');
    }

    // ── TESTERS ────────────────────────────────
    if (!(await db.schema.hasTable('testers'))) {
      await db.schema.createTable('testers', t => {
        t.string('id', 36).primary();
        t.string('name', 100).notNullable();
        t.string('initials', 10);
        t.string('role', 60).defaultTo('QA Engineer');
        t.string('avatar_color', 30).defaultTo('av-blue');
        t.boolean('is_active').defaultTo(true);
        t.string('email', 200).nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ testers');
    }

    // ── DEVELOPERS ─────────────────────────────
    if (!(await db.schema.hasTable('developers'))) {
      await db.schema.createTable('developers', t => {
        t.string('id', 36).primary();
        t.string('name', 100).notNullable();
        t.string('initials', 10);
        t.string('specialisation', 60).defaultTo('Full Stack');
        t.string('avatar_color', 30).defaultTo('av-green');
        t.string('email', 200).nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ developers');
    }

    // ── MANAGERS ──────────────────────────────
    if (!(await db.schema.hasTable('managers'))) {
      await db.schema.createTable('managers', t => {
        t.string('id', 36).primary();
        t.string('name', 100).notNullable();
        t.string('initials', 10);
        t.string('department', 100).defaultTo('QA');
        t.string('avatar_color', 30).defaultTo('av-amber');
        t.boolean('is_active').defaultTo(true);
        t.string('email', 200).nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ managers');
    }

    // ── PROJECTS ───────────────────────────────
    if (!(await db.schema.hasTable('projects'))) {
      await db.schema.createTable('projects', t => {
        t.string('id', 36).primary();
        t.string('name', 200).notNullable();
        t.text('description').nullable();
        t.string('status', 30).defaultTo('Active');
        t.string('color', 30).defaultTo('av-blue');
        t.timestamps(true, true);
      });
      console.log('  ✔ projects');
    }

    // ── TEST CASES ─────────────────────────────
    if (!(await db.schema.hasTable('test_cases'))) {
      await db.schema.createTable('test_cases', t => {
        t.string('id', 36).primary();
        t.string('title', 500).notNullable();
        t.string('module', 100).nullable();
        t.string('priority', 20).defaultTo('Medium');
        t.string('status', 30).defaultTo('Pending');
        t.string('workflow_state', 50).nullable(); // New workflow state
        t.string('environment', 30).defaultTo('Staging');
        t.string('type', 40).defaultTo('Functional');
        t.text('description').nullable();
        t.json('steps');
        t.string('project_id', 36)
          .nullable()
          .references('id')
          .inTable('projects')
          .onDelete('SET NULL');
        t.string('tester_id', 36)
          .nullable()
          .references('id')
          .inTable('testers')
          .onDelete('SET NULL');
        t.string('created_by', 100).nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ test_cases');
    }

    // ── BUGS ───────────────────────────────────
    if (!(await db.schema.hasTable('bugs'))) {
      await db.schema.createTable('bugs', t => {
        t.string('id', 36).primary();
        t.string('bug_id', 30).notNullable().unique();
        t.string('title', 500).notNullable();
        t.string('severity', 20).defaultTo('Medium');
        t.string('status', 30).defaultTo('Open');
        t.string('tc_id', 36)
          .nullable()
          .references('id')
          .inTable('test_cases')
          .onDelete('SET NULL');
        t.string('developer_id', 36)
          .nullable()
          .references('id')
          .inTable('developers')
          .onDelete('SET NULL');
        t.string('environment', 30).defaultTo('Staging');
        t.string('platform', 100).nullable();
        t.text('steps_to_reproduce').nullable();
        t.text('actual_result').nullable();
        t.text('expected_result').nullable();
        t.string('reporter', 100).nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ bugs');
    }

    // ── TEST RUNS ──────────────────────────────
    if (!(await db.schema.hasTable('test_runs'))) {
      await db.schema.createTable('test_runs', t => {
        t.string('id', 36).primary();
        t.string('run_id', 30).notNullable().unique();
        t.string('name', 255).notNullable();
        t.string('environment', 30).defaultTo('Staging');
        t.string('sprint', 100).nullable();
        t.string('status', 30).defaultTo('In Progress');
        t.string('created_by', 100).nullable();
        t.timestamps(true, true);
      });
      console.log('  ✔ test_runs');
    }

    // ── RUN_TEST_CASES (join) ──────────────────
    if (!(await db.schema.hasTable('run_test_cases'))) {
      await db.schema.createTable('run_test_cases', t => {
        t.string('run_id', 36).references('id').inTable('test_runs').onDelete('CASCADE');
        t.string('tc_id', 36).references('id').inTable('test_cases').onDelete('CASCADE');
        t.primary(['run_id', 'tc_id']);
      });
      console.log('  ✔ run_test_cases');
    }

    // ── COMMENTS ──────────────────────────────
    if (!(await db.schema.hasTable('comments'))) {
      await db.schema.createTable('comments', t => {
        t.string('id', 36).primary();
        t.text('body').notNullable();
        t.string('author_name', 100).notNullable();
        t.string('author_initials', 10).nullable();
        t.string('author_color', 30).defaultTo('av-blue');
        t.string('author_role', 20).defaultTo('qa');
        t.string('role_label', 30).defaultTo('QA');
        t.string('tc_id', 36).nullable().references('id').inTable('test_cases').onDelete('CASCADE');
        t.string('bug_id', 36).nullable().references('id').inTable('bugs').onDelete('CASCADE');
        t.boolean('is_dev_thread').defaultTo(false);
        t.timestamps(true, true);
      });
      console.log('  ✔ comments');
    }

    // ── NOTIFICATIONS ─────────────────────────
    if (!(await db.schema.hasTable('notifications'))) {
      await db.schema.createTable('notifications', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36).nullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('title', 300).notNullable();
        t.string('sub', 300).nullable();
        t.string('type', 30).defaultTo('info');
        t.string('related_url', 500).nullable();
        t.boolean('is_read').defaultTo(false);
        t.timestamps(true, true);
        t.index('user_id');
      });
      console.log('  ✔ notifications');
    } else {
      // Add user_id column if missing (for existing installs)
      const hasCols = await db.schema.hasColumn('notifications', 'user_id');
      if (!hasCols) {
        await db.schema.alterTable('notifications', t => {
          t.string('user_id', 36).nullable().after('id');
          t.string('related_url', 500).nullable().after('type');
          t.index('user_id');
        });
        console.log('  ✔ notifications (added user_id, related_url)');
      }
    }

    // ── TEST CASE ATTACHMENTS ──────────────────
    if (!(await db.schema.hasTable('test_case_attachments'))) {
      await db.schema.createTable('test_case_attachments', t => {
        t.string('id', 36).primary();
        t.string('tc_id', 36)
          .notNullable()
          .references('id')
          .inTable('test_cases')
          .onDelete('CASCADE');
        t.string('filename', 500).notNullable();
        t.string('original_name', 500).notNullable();
        t.string('mime_type', 100).notNullable();
        t.integer('size').unsigned().notNullable();
        t.enum('type', ['screenshot', 'recording']).defaultTo('screenshot');
        t.string('uploaded_by', 100).nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('  ✔ test_case_attachments');
    }

    // ── SECURITY FEATURES ──────────────────────

    // 1. Refresh Tokens (Token Rotation)
    if (!(await db.schema.hasTable('refresh_tokens'))) {
      await db.schema.createTable('refresh_tokens', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('token_hash', 255).notNullable().unique();
        t.boolean('is_revoked').defaultTo(false);
        t.dateTime('expires_at').notNullable();
        t.timestamps(true, true);
        t.index('user_id');
        t.index('expires_at');
      });
      console.log('  ✔ refresh_tokens');
    }

    // 2. Failed Login Attempts (Account Lockout)
    if (!(await db.schema.hasTable('failed_login_attempts'))) {
      await db.schema.createTable('failed_login_attempts', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
        t.string('email', 255).notNullable();
        t.string('ip_address', 45).nullable();
        t.text('user_agent').nullable();
        t.timestamp('attempted_at').defaultTo(db.fn.now());
        t.index('email');
        t.index('attempted_at');
      });
      console.log('  ✔ failed_login_attempts');
    }

    // 3. Add Account Lockout Fields to Users
    if (await db.schema.hasTable('users')) {
      const hasIsLocked = await db.schema.hasColumn('users', 'is_locked');
      const hasLockedUntil = await db.schema.hasColumn('users', 'locked_until');

      if (!hasIsLocked) {
        await db.schema.table('users', t => {
          t.boolean('is_locked').defaultTo(false);
        });
      }
      if (!hasLockedUntil) {
        await db.schema.table('users', t => {
          t.dateTime('locked_until').nullable();
        });
      }
    }

    // 4. Audit Logs
    if (!(await db.schema.hasTable('audit_logs'))) {
      await db.schema.createTable('audit_logs', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
        t.string('action', 255).notNullable();
        t.string('entity_type', 100).nullable();
        t.string('entity_id', 36).nullable();
        t.json('changes').nullable();
        t.string('ip_address', 45).nullable();
        t.text('user_agent').nullable();
        t.enum('status', ['success', 'failure']).defaultTo('success');
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.index('user_id');
        t.index('action');
        t.index('created_at');
      });
      console.log('  ✔ audit_logs');
    }

    // 5. Password Reset Tokens
    if (!(await db.schema.hasTable('password_reset_tokens'))) {
      await db.schema.createTable('password_reset_tokens', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('token_hash', 255).notNullable().unique();
        t.dateTime('expires_at').notNullable();
        t.dateTime('used_at').nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.index('user_id');
        t.index('expires_at');
      });
      console.log('  ✔ password_reset_tokens');
    }

    // 6. 2FA Settings
    if (!(await db.schema.hasTable('two_fa_settings'))) {
      await db.schema.createTable('two_fa_settings', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36)
          .notNullable()
          .unique()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        t.boolean('is_enabled').defaultTo(false);
        t.string('secret_key', 255).nullable();
        t.json('backup_codes').nullable();
        t.dateTime('verified_at').nullable();
        t.timestamps(true, true);
        t.index('user_id');
      });
      console.log('  ✔ two_fa_settings');
    }

    // 7. 2FA Attempts
    if (!(await db.schema.hasTable('two_fa_attempts'))) {
      await db.schema.createTable('two_fa_attempts', t => {
        t.string('id', 36).primary();
        t.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.enum('code_type', ['totp', 'backup_code']).defaultTo('totp');
        t.boolean('is_verified').defaultTo(false);
        t.string('ip_address', 45).nullable();
        t.timestamp('attempted_at').defaultTo(db.fn.now());
        t.index('user_id');
        t.index('attempted_at');
      });
      console.log('  ✔ two_fa_attempts');
    }

    // ── WORKFLOW STATES ────────────────────────
    if (!(await db.schema.hasTable('workflow_states'))) {
      await db.schema.createTable('workflow_states', t => {
        t.string('id', 36).primary();
        t.string('project_id', 36)
          .notNullable()
          .references('id')
          .inTable('projects')
          .onDelete('CASCADE');
        t.string('name', 50).notNullable(); // New, In Progress, Blocked, Closed, etc.
        t.string('color', 30).defaultTo('#5B8DEE'); // For UI display
        t.integer('order').defaultTo(0); // Sort order in workflow
        t.boolean('is_default').defaultTo(false); // Default state for new test cases
        t.boolean('is_final').defaultTo(false); // Marks completion state
        t.timestamps(true, true);
        t.unique(['project_id', 'name']);
        t.index('project_id');
      });
      console.log('  ✔ workflow_states');
    }

    // ── TESTCASE WORKFLOW HISTORY ──────────────
    if (!(await db.schema.hasTable('testcase_workflow_history'))) {
      await db.schema.createTable('testcase_workflow_history', t => {
        t.string('id', 36).primary();
        t.string('tc_id', 36)
          .notNullable()
          .references('id')
          .inTable('test_cases')
          .onDelete('CASCADE');
        t.string('from_state', 50).nullable(); // Previous state
        t.string('to_state', 50).notNullable(); // New state
        t.string('changed_by', 100).nullable(); // User who changed it
        t.text('notes').nullable(); // Why state changed
        t.timestamps(true, true);
        t.index('tc_id');
        t.index('created_at');
      });
      console.log('  ✔ testcase_workflow_history');
    }

    // ── CUSTOM FIELDS ──────────────────────────
    if (!(await db.schema.hasTable('custom_fields'))) {
      await db.schema.createTable('custom_fields', t => {
        t.string('id', 36).primary();
        t.string('project_id', 36)
          .notNullable()
          .references('id')
          .inTable('projects')
          .onDelete('CASCADE');
        t.string('field_name', 100).notNullable(); // e.g., "Device Type", "Browser Version"
        t.enum('field_type', [
          'text',
          'select',
          'multiselect',
          'number',
          'date',
          'checkbox',
        ]).defaultTo('text');
        t.json('field_options').nullable(); // For select/multiselect: ["Option1", "Option2"]
        t.boolean('is_required').defaultTo(false);
        t.string('help_text', 500).nullable(); // Instructions for users
        t.integer('order').defaultTo(0); // Display order
        t.timestamps(true, true);
        t.unique(['project_id', 'field_name']);
        t.index('project_id');
      });
      console.log('  ✔ custom_fields');
    }

    // ── CUSTOM FIELD VALUES ────────────────────
    if (!(await db.schema.hasTable('custom_field_values'))) {
      await db.schema.createTable('custom_field_values', t => {
        t.string('id', 36).primary();
        t.string('tc_id', 36)
          .notNullable()
          .references('id')
          .inTable('test_cases')
          .onDelete('CASCADE');
        t.string('field_id', 36)
          .notNullable()
          .references('id')
          .inTable('custom_fields')
          .onDelete('CASCADE');
        t.text('value').nullable(); // Store as JSON string for complex types
        t.timestamps(true, true);
        t.unique(['tc_id', 'field_id']);
        t.index('tc_id');
        t.index('field_id');
      });
      console.log('  ✔ custom_field_values');
    }

    // ── REPORTS (Cache) ────────────────────────
    if (!(await db.schema.hasTable('reports'))) {
      await db.schema.createTable('reports', t => {
        t.string('id', 36).primary();
        t.string('project_id', 36)
          .nullable()
          .references('id')
          .inTable('projects')
          .onDelete('CASCADE');
        t.string('name', 200).notNullable();
        t.string('report_type', 50).notNullable(); // e.g., 'test_cases_by_status', 'bug_severity', 'execution_trend'
        t.json('data').notNullable(); // Chart data as JSON
        t.timestamp('generated_at').defaultTo(db.fn.now());
        t.timestamp('expires_at').nullable(); // For cache expiration
        t.timestamps(true, true);
        t.index('project_id');
        t.index('expires_at');
      });
      console.log('  ✔ reports');
    }

    console.log('\n✅ All MySQL migrations complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

migrate();
