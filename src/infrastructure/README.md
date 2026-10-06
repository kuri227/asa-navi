# Infrastructure

Applicationが定義したportの具体実装を置く外側の層。

予定しているdirectory:

- `db/migrations/`: 追記専用のSQLite migration
- `db/repositories/`: SQLite Repository実装
- `clock/`: 端末時刻を返すClock実装
- `notifications/`: Expo Notifications等のAlarmService adapter

DB rowやSDK固有型をDomainやUIへ漏らさない。
