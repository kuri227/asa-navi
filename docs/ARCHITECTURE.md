# 朝ナビ アーキテクチャ

更新日: 2026-10-06
状態: 初版（実装前）

## 1. 設計目標

- Local-first: ネットワークがなくても主要機能を使える。
- Domain-first: Planning EngineをUI、DB、OS機能から分離する。
- Deterministic: 同じ入力に同じ計画を返す。
- Replaceable adapters: SQLite、通知、将来のnative alarmを境界の外へ隔離する。
- Recoverable: アプリ終了後もactiveな朝sessionを復元し、現在時刻で再計画できる。
- Teachable: レイヤと依存方向が初学者にも追える。

## 2. レイヤと依存方向

```text
Expo Router Screens / Feature UI
              |
              v
Application UseCases
       |             |
       v             v
Domain Models     Ports (interfaces)
Planning Engine   Repository / Clock / AlarmService
                       ^
                       |
Infrastructure Adapters
SQLite / SystemClock / Expo Notifications
```

依存は内側へ向ける。InfrastructureはApplication/Domainで定義したinterfaceを実装する。

禁止する依存:

- UI -> SQLite / SQL
- UI / UseCase -> `expo-notifications`
- Domain -> React Native / Expo / SQLite / Repository
- Planning Engine -> clock、乱数、I/O、global mutable state
- Infrastructure model -> UI component

## 3. 推奨ディレクトリ

```text
src/
  app/                         # Expo Router route entry points（薄く保つ）
  application/
    errors/
    ports/                     # Repository, Clock, AlarmService
    usecases/
  domain/
    planning/
    route/
    schedule/
  infrastructure/
    clock/
    db/
      migrations/
      repositories/
    notifications/
  features/                    # feature固有UI、hooks、view models
    onboarding/
    route-setup/
    schedule-setup/
    routine-setup/
    morning-session/
  components/                  # 複数featureで共有するUI
  stores/                      # 一時的な画面横断状態のみ
  theme/                       # color, spacing, typography, radius, motion
  validation/                  # 外部入力・DB値のschema
```

## 4. Planning Engine境界

### 入力

- 呼び出し側が渡す`now`
- 最初の予定
- 到着余裕
- sort済みであることに依存しないroute segments / morning tasks
- 完了済みtask IDs

### 出力

- 推奨起床、最終出発、予想出発・到着
- slack、late、status
- 各taskの予定時間とaction
- compress / skip / late adjustments

### 不変条件

- 現在時刻を内部取得しない。
- 入力をmutationしない。
- `any`、unsafe cast、I/Oを使わない。
- disabled / completed taskを計算対象にしない。
- required taskをskipしない。
- planned durationはminimum未満にしない。
- priority同値時は`sortOrder`、さらに必要なら安定したID順で決定性を保つ。
- 分単位の丸め規則を1か所へ集約する。

### 日時方針

- Domain APIは`Date`を受け取るが、DB境界ではISO 8601文字列としてvalidate / serializeする。
- 曜日テンプレートは`HH:mm`、例外日は対象日と時刻として保持する。
- ApplicationのSchedule Resolverが曜日・対象日・timezoneから具体的な絶対日時を作り、Planning Engineへ渡す。
- Planning Engineは曜日や`HH:mm`を解釈しない。
- 日付跨ぎ、DSTがあるtimezone、端末timezone変更をtest対象とする。

### Validation責務

- Zod等の境界validationは、UI、DB、外部入力の負数、空文字、不正enum、不正日時を拒否する。
- Domainは`minimumDurationMin <= normalDurationMin`、required taskをskipしないこと、route順序、計算整合性等のinvariantを自身で守る。
- Domain invariantを境界schemaだけへ委ねない。

## 5. Application / UseCase

主要UseCase:

- `resolveDaySchedule(date)`
- `buildTomorrowPlan(date)`
- `startMorningSession(sessionId)`
- `completeMorningTask(sessionId, executionId)`
- `rescheduleAlarm(date)`

UseCaseの責務:

- Repositoryから必要データを集める。
- 外部値をvalidateしてDomain型へ変換する。
- Planning Engineを呼ぶ。
- 永続化とadapter呼び出しを調整する。
- ユーザーに回復可能な失敗を型として返す。

UseCaseは画面表示の文言・色・navigation componentを知らない。

## 6. Repository境界

interfaceはApplication側に置き、SQLite実装はInfrastructure側に置く。

```text
ScheduleRepository
RouteRepository
RoutineRepository
MorningSessionRepository
AlarmRecordRepository
SettingsRepository
```

RepositoryはDB rowをそのまま外へ漏らさず、validation済みmodelへ変換する。SQLの動的値はbind parameterまたはprepared statementを使う。

## 7. SQLite / Migration

- `PRAGMA foreign_keys = ON`とWALをopen時に設定する。
- `schema_migrations`で適用済みversionを追跡する。
- migrationは`001_initial_schema.sql`のように単調増加させ、適用済みfileを編集しない。
- migrationはtransaction内で実行し、失敗時にversionだけ進めない。
- DB constraintとZod validationを併用し、責務を分ける。
- ユーザー操作なしの物理削除はしない。

初版schemaは仕様書のDDLを基準とする。実装時にschema変更が必要ならADRと影響評価を先に行う。

## 8. AlarmService境界

```ts
type AlarmPermissionState = 'granted' | 'denied' | 'notDetermined';

interface AlarmService {
  schedule(input: AlarmScheduleInput): Promise<{ alarmId: string }>;
  cancel(alarmId: string): Promise<void>;
  requestPermission(): Promise<AlarmPermissionState>;
  getPermissionState(): Promise<AlarmPermissionState>;
}
```

実装候補:

- `FakeAlarmService`: UseCase test
- `ExpoNotificationAlarmService`: コアMVP
- `IOSAlarmKitAlarmService`: 条件付き将来実装
- `AndroidExactAlarmService`: 条件付き将来実装

予約は前夜または予定変更時に行う。指定時刻にバックグラウンドでPlanning Engineを初実行する設計にはしない。

## 9. Clock境界

`Clock.now(): Date`はApplicationでだけ使う。SystemClockはInfrastructure、FakeClockはtestに置く。Planning EngineにはClockを注入せず、UseCaseが取得した`now`を値として渡す。

## 10. 状態管理

- SQLite: 設定、schedule、route、task template、session、task execution、alarm recordの正本。
- Zustand: 編集途中、選択中tab、未保存フォーム等の一時状態。
- React component local state: 画面内だけのpresentation state。
- DB値をZustandへ恒久複製しない。

## 11. エラー設計

```text
ValidationError  入力・DB値が契約を満たさない
DomainError      不変条件を満たさず計画できない
RepositoryError  SQLite open / query / migration / mapping失敗
NotificationError permission / schedule / cancel失敗
```

- 原因を握りつぶさない。
- UIには回復手段と次の行動を示す。
- 開発ログには個人情報やsecretを含めない。
- adapter由来の例外をそのままUIへ露出せず、typed errorへ変換する。

## 12. 主要データフロー

### 翌朝計画

```text
Settings changed / app opened
  -> buildTomorrowPlan
  -> resolve override before weekday schedule
  -> load route + tasks + settings
  -> calculateBasePlan
  -> save planned session
  -> AlarmService.schedule
  -> save alarm record
```

### 起床・再計画

```text
Notification tap or manual start
  -> startMorningSession
  -> load or create executions
  -> Clock.now
  -> replan(remaining tasks)
  -> persist result
  -> render next task
```

### task完了

```text
Complete action
  -> save actual_end_at + completed
  -> Clock.now
  -> replan(remaining tasks)
  -> persist new plan
  -> next task / departure confirmation
```

## 13. UIアーキテクチャ

- `src/app`はroute compositionだけにし、business logicを置かない。
- 画面フロー図は情報階層と操作順の参照とし、固定pixel配置はコピーしない。
- `theme/`にcolors、spacing、typography、radius、motionを定義する。
- 状態はloading、empty、validation error、system error、permission denied、offline、restored sessionを用意する。
- 色だけで状態を伝えない。Dynamic Typeで切れない。主要操作は44pt/48dp相当以上を確保する。
- 朝の利用場面を考え、主要情報と主CTAを一画面目で走査できるOperate型UIとする。

## 14. Architecture enforcement

- ESLintのimport制約またはproject convention testでDomainからExpo/React Native/Infrastructureへのimportを禁止する。
- TypeScript strictと`any`禁止をlintで強制する。
- Repository、Clock、AlarmServiceにはcontract testまたはfakeを用意する。
- PR templateでlayer違反、migration、mobile、accessibilityを確認する。

## 15. ADRが必要な変更

- 仕様の型や計算規則の変更
- 初版DDLからの大幅変更
- 新規native moduleまたは外部サービス
- Expo Notificationsからnative alarmへの切替
- Local-firstまたは依存方向に影響する判断
- 仕様書にない主要package（state / UI / form / ORM / date-time / native / analytics / logging等）の追加

主要依存のADRでは目的、標準機能では不足する理由、maintenance、Expo / React Native互換性、native依存、削除容易性、license、代替案も記録する。ADRには問題、背景、選択肢、推奨、影響、決定者と日付を記録する。
