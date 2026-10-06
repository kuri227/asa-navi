const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(
  projectRoot,
  "src",
  "infrastructure",
  "db",
  "migrations",
  "001_initial_schema.sql",
);
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "asanavi-sqlite-"));
const databasePath = path.join(tempDirectory, "integration.db");
const schema = fs.readFileSync(schemaPath, "utf8");

function execute(sql, options = {}) {
  const result = spawnSync("sqlite3", ["-batch", databasePath], {
    encoding: "utf8",
    input: `.bail on\n${sql}\n`,
  });
  const expectFailure = options.expectFailure === true;
  if (expectFailure ? result.status === 0 : result.status !== 0) {
    throw new Error(
      expectFailure
        ? "Expected SQLite statement to fail, but it succeeded."
        : `SQLite failed: ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout.trim();
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

try {
  const sqliteVersion = spawnSync("sqlite3", ["--version"], {
    encoding: "utf8",
  });
  if (sqliteVersion.status !== 0) {
    throw new Error("sqlite3 command is required for integration tests.");
  }

  execute(schema);
  execute(schema);
  assertEqual(execute("PRAGMA integrity_check;"), "ok", "integrity_check");
  assertEqual(
    execute("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table';"),
    "10",
    "table count",
  );
  assertEqual(
    execute(
      "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%';",
    ),
    "5",
    "application index count",
  );

  execute(
    `INSERT INTO morning_task_templates (
      id, name, normal_duration_min, minimum_duration_min, requirement,
      compression_priority, skip_priority, sort_order, enabled, created_at, updated_at
    ) VALUES ('invalid', 'invalid', 5, 6, 'required', 1, 1, 0, 1,
              '2026-10-06T00:00:00.000Z', '2026-10-06T00:00:00.000Z');`,
    { expectFailure: true },
  );

  execute(`
    PRAGMA foreign_keys = ON;
    INSERT INTO app_settings (
      id, arrival_buffer_min, tight_threshold_min, onboarding_completed, created_at, updated_at
    ) VALUES (1, 12, 8, 1, '2026-10-06T00:00:00.000Z', '2026-10-06T00:00:00.000Z');
    INSERT INTO morning_task_templates (
      id, name, normal_duration_min, minimum_duration_min, requirement,
      compression_priority, skip_priority, sort_order, enabled, created_at, updated_at
    ) VALUES ('task-1', '朝食', 15, 8, 'required', 1, 1, 0, 1,
              '2026-10-06T00:00:00.000Z', '2026-10-06T00:00:00.000Z');
    INSERT INTO morning_sessions (
      id, target_date, first_event_title, first_event_start_at,
      planned_wake_at, latest_departure_at, status, late_by_min, created_at, updated_at
    ) VALUES ('session-1', '2026-10-06', '1限', '2026-10-06T08:50:00+09:00',
              '2026-10-06T06:30:00+09:00', '2026-10-06T08:00:00+09:00',
              'active', 0, '2026-10-06T00:00:00.000Z', '2026-10-06T00:00:00.000Z');
    INSERT INTO morning_task_executions (
      id, session_id, task_template_id, sort_order, planned_duration_min,
      action, status, created_at, updated_at
    ) VALUES ('execution-1', 'session-1', 'task-1', 0, 15, 'normal', 'pending',
              '2026-10-06T00:00:00.000Z', '2026-10-06T00:00:00.000Z');
  `);

  assertEqual(
    execute(
      "SELECT arrival_buffer_min || '|' || tight_threshold_min || '|' || onboarding_completed FROM app_settings WHERE id = 1;",
    ),
    "12|8|1",
    "reopened settings",
  );
  assertEqual(
    execute("SELECT status FROM morning_sessions WHERE id = 'session-1';"),
    "active",
    "reopened active session",
  );
  execute(
    "PRAGMA foreign_keys = ON; DELETE FROM morning_sessions WHERE id = 'session-1';",
  );
  assertEqual(
    execute("SELECT COUNT(*) FROM morning_task_executions;"),
    "0",
    "session cascade delete",
  );

  console.log(
    `SQLite integration tests passed (${sqliteVersion.stdout.trim()}).`,
  );
} finally {
  const resolvedTemp = path.resolve(tempDirectory);
  const resolvedRoot = path.resolve(os.tmpdir());
  if (!resolvedTemp.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(
      "Refusing to remove a directory outside the system temp folder.",
    );
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
