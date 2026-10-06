CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  arrival_buffer_min INTEGER NOT NULL DEFAULT 10 CHECK (arrival_buffer_min >= 0),
  tight_threshold_min INTEGER NOT NULL DEFAULT 10 CHECK (tight_threshold_min >= 0),
  onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('home','school','station','bus_stop','other')),
  address_text TEXT,
  latitude REAL,
  longitude REAL,
  external_place_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commute_routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  origin_place_id TEXT,
  destination_place_id TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (origin_place_id) REFERENCES places(id),
  FOREIGN KEY (destination_place_id) REFERENCES places(id)
);

CREATE TABLE IF NOT EXISTS route_segments (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('walk','train','bus','bicycle','other')),
  from_label TEXT NOT NULL,
  to_label TEXT NOT NULL,
  line_name TEXT,
  duration_min INTEGER NOT NULL CHECK (duration_min >= 0),
  from_place_id TEXT,
  to_place_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES commute_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (from_place_id) REFERENCES places(id),
  FOREIGN KEY (to_place_id) REFERENCES places(id),
  UNIQUE(route_id, sort_order)
);

CREATE TABLE IF NOT EXISTS weekday_schedules (
  id TEXT PRIMARY KEY,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  location_label TEXT,
  route_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES commute_routes(id)
);

CREATE TABLE IF NOT EXISTS date_schedule_overrides (
  id TEXT PRIMARY KEY,
  target_date TEXT NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('replace','cancel')),
  title TEXT,
  start_time TEXT,
  location_label TEXT,
  route_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES commute_routes(id),
  UNIQUE(target_date)
);

CREATE TABLE IF NOT EXISTS morning_task_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normal_duration_min INTEGER NOT NULL CHECK (normal_duration_min >= 1),
  minimum_duration_min INTEGER NOT NULL CHECK (minimum_duration_min >= 0),
  requirement TEXT NOT NULL CHECK (requirement IN ('required','optional')),
  compression_priority INTEGER NOT NULL DEFAULT 100,
  skip_priority INTEGER NOT NULL DEFAULT 100,
  sort_order INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  special_type TEXT CHECK (special_type IN ('meal','bath','grooming','clothing','belongings','other')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (minimum_duration_min <= normal_duration_min)
);

CREATE TABLE IF NOT EXISTS morning_sessions (
  id TEXT PRIMARY KEY,
  target_date TEXT NOT NULL,
  first_event_title TEXT NOT NULL,
  first_event_start_at TEXT NOT NULL,
  route_id TEXT,
  planned_wake_at TEXT NOT NULL,
  actual_wake_at TEXT,
  latest_departure_at TEXT NOT NULL,
  predicted_departure_at TEXT,
  predicted_arrival_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('planned','active','completed','cancelled')),
  plan_status TEXT CHECK (plan_status IN ('comfortable','tight','late')),
  late_by_min INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES commute_routes(id)
);

CREATE TABLE IF NOT EXISTS morning_task_executions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  task_template_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  planned_duration_min INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('normal','compressed','skipped')),
  planned_start_at TEXT,
  planned_end_at TEXT,
  actual_start_at TEXT,
  actual_end_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','active','completed','skipped')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES morning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (task_template_id) REFERENCES morning_task_templates(id)
);

CREATE TABLE IF NOT EXISTS alarm_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  platform_notification_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled','triggered','cancelled','failed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES morning_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_route_segments_route ON route_segments(route_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_weekday_schedules_weekday ON weekday_schedules(weekday, is_active);
CREATE INDEX IF NOT EXISTS idx_overrides_date ON date_schedule_overrides(target_date);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON morning_sessions(target_date);
CREATE INDEX IF NOT EXISTS idx_task_exec_session ON morning_task_executions(session_id, sort_order);
