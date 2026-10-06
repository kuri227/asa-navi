# 朝ナビ 実装計画

更新日: 2026-10-06
対象: 第1段階（コアMVP）

## 1. プロジェクト概要

朝ナビは、学生の最初の予定、通学時間、朝の準備タスクから起床・出発時刻を逆算し、寝坊や進捗の遅れが生じたときも実行可能な朝プランへ再計画するローカルファーストのモバイルアプリである。

一次資料は `asanavi_spec_v0_3.md` と「朝ナビの一日を支えるアプリ画面フロー.png」。開発運用は`docs/DEVELOPMENT_GUIDE.md`も参照する。資料が競合する場合は、最新のユーザー要件、実装仕様書、実装計画、画面フロー、既存コードの順で優先する。

## 2. MVPの目的

- 曜日別の最初の予定と日付別の例外を登録できる。
- 徒歩・電車・バス等を組み合わせた複数区間の通学ルートを登録できる。
- 朝タスクに通常時間、最短時間、必須・省略可、優先順位を設定できる。
- 起床・最終出発時刻を決定論的に算出できる。
- 現在時刻と完了状況に応じ、短縮、省略、遅刻予測を含む再計画ができる。
- 永続データをSQLiteに保存し、オフラインで主要機能が動く。
- ローカル通知から朝セッションを開始できる。

## 3. 現在の状態

### Repository

- GitHub: `https://github.com/kuri227/asa-navi`
- 2026-10-06に空のリモートから初回計画commitを作成した。
- Phase 1-AとPhase 1-Bは`feat/project-foundation` branchで完了。remoteは`origin`。
- Phase 1-A-1でExpo SDK 57.0.26、React Native 0.86.3、React 19.2.3、TypeScript 6.0.3、Expo Router 57.0.24を公式default templateから初期化した。
- ESLint、Prettier、Jest、React Native Testing Library、CIを導入済み。SQLiteはPhase 1-Cで導入する。
  - Planning EngineとSchedule Resolverを実装し、TC-P01〜TC-P10を含むtestが成功している。
  - Phase 1-CでSQLite migration、Repository、constraint / reopen integration testを実装した。
  - Phase 1-D-1でDesign Tokenとアクセシブルな共通フォーム部品を実装した。
- `README.md`とExpo公式`AGENTS.md`を追加済み。READMEの本格整備はPhase 1-A-6で行う。

### Development environment

- OS: Windows（PowerShell）
- Node.js: `v22.17.1`
- npm / npx: `11.6.2`（ホスト環境で動作確認済み）
- Git: `2.46.1.windows.1`
- Codexの制限実行環境ではユーザー領域のnpm prefixを直接読めないため、npmコマンドは必要に応じて許可付きで実行する。これは端末側npmの故障ではない。

### Specification gap

実装は存在しないため、仕様との差分はコアMVP全体である。既存データや既存機能との互換性問題は現時点ではない。

## 4. 対象外機能

第1段階では次を実装しない。

- Google / Apple Calendar連携
- 天気、鉄道、バス等の外部API
- GPS徒歩ペース、駅・バス停の自動補完、自動経路探索
- 学校PDF/OCR、AI/LLM、自動行動検知
- バックエンド、ログイン、クラウド同期
- AlarmKit / Android AlarmManagerの本実装（Phase 1-Gの実機結果で必要性を判定）

## 5. 技術構成

| 領域         | 方針                                                          |
| ------------ | ------------------------------------------------------------- |
| App          | React Native + Expo SDK 57安定版を初期候補とする              |
| Navigation   | Expo Router                                                   |
| Language     | TypeScript `strict: true`、`any`禁止                          |
| Domain       | React Native / Expo / SQLite非依存の純粋TypeScript            |
| Persistence  | `expo-sqlite` + versioned migration + Repository              |
| Validation   | ZodをUI・DB境界で使用                                         |
| Date/time    | date-fnsを境界・UseCaseで使用。Domainは入力された`Date`を扱う |
| UI state     | Zustand。永続データの正本にはしない                           |
| Notification | `AlarmService`越しの`expo-notifications`                      |
| Test         | jest-expo + React Native Testing Library                      |
| Quality      | ESLint + Prettier + `tsc --noEmit`                            |
| CI           | GitHub Actionsでinstall、format、lint、typecheck、test        |

Expo公式の2026-10-06時点のSDK表ではSDK 57はReact Native 0.86、React 19.2.3、Node 22.13以上を対象としており、現在のNode 22.17.1は要件を満たす。実際の初期化時に安定版タグと依存整合性を再確認し、pre-releaseは採用しない。

## 6. OSごとの懸念

### iOS

- WindowsではローカルXcode buildができない。共通部分はAndroid中心で進め、iOS固有検証はmacOS実機環境またはEAS Development Buildを別途使う。
- 通知と時計アプリ相当のアラームは同一ではない。AlarmKit採用時は権限説明、最低OS、Expo Module / Native Module、ストア要件を再評価する。
- Dynamic Type、Safe Area、VoiceOver、通知拒否・制限時の代替導線を検証する。

### Android

- Android 12以降のexact alarm、Android 13以降の通知権限、Android 14以降の既定拒否とGoogle Play適格性を考慮する。
- メーカー独自の省電力制御による遅延を実機で測る。
- TalkBack、フォント拡大、戻る操作、キーボード表示、最小タッチ領域を検証する。

### 共通

- バックグラウンド処理で当日計画を初生成しない。前夜または設定変更時に計画し、アプリ復帰時に再計画する。
- 小型画面と大きい文字でも主要CTA、残り時間、遅刻警告が欠落しないレイアウトにする。

## 7. 開発サイクル

各Sub Phaseで次を完了してからcommitする。

1. PLAN: 対象仕様、変更範囲、Acceptance Criteriaを確認
2. IMPLEMENT: 1つの説明可能な変更を実装
3. FORMAT / LINT / TYPECHECK / TEST
4. REVIEW: correctness、readability、architecture、type safety、testing、mobile、UX、accessibility、securityを確認
5. FIX / RETEST
6. COMMIT / DEVELOPMENT_LOG更新

失敗した品質ゲートをskipして次へ進まない。

## 8. Phase一覧とAcceptance Criteria

### Phase 0-A: リポジトリ・仕様・技術調査

実施内容:

- 仕様書、画面フロー、リポジトリ、開発環境を確認
- Expo、SQLite、通知、AlarmKit、Android exact alarmの公式資料を確認
- 現状とリスクを記録

Acceptance Criteria:

- 現状、未導入要素、資料の優先順位、技術上の主要リスクが本書に記録されている。

### Phase 0-B: 設計と開発運用

Sub Phase:

- 0-B-1: `ARCHITECTURE.md`で境界と依存方向を定義
- 0-B-2: `TEST_PLAN.md`でレイヤ別テストと実機試験を定義
- 0-B-3: `MOBILE_NOTES.md`でOS差分と調査根拠を記録
- 0-B-4: branch、commit、PR、CI方針を確定

Acceptance Criteria:

- 実装前に各Phaseの入力、出力、品質ゲート、停止条件が明文化されている。

### Phase 1-A: プロジェクト土台

Sub Phase:

- 1-A-1: 最新安定版Expo + Router + TypeScriptテンプレートを初期化
- 1-A-2: strict TypeScript、path alias、基本ディレクトリを設定
- 1-A-3: ESLint / Prettier / format checkを設定
- 1-A-4: jest-expo / React Native Testing Libraryを設定しsmoke testを追加
- 1-A-5: GitHub Actionsを追加
- 1-A-6: 初学者向けREADME初版を追加

Acceptance Criteria:

- Android向けの空アプリが起動できる。
- `format:check`、`lint`、`typecheck`、`test`がローカルで成功する。
- `npx expo-doctor`で重大な問題が検出されない。
- PR時に同じ品質ゲートをCIで実行できる。
- secretや生成物がcommit対象にならない。

### Phase 1-B: Planning Engine

Sub Phase:

- 1-B-1: Domain typesと入力validation方針
- 1-B-2: route duration / latest departure
- 1-B-3: recommended wake time / base plan
- 1-B-4: task compression
- 1-B-5: optional task skipping
- 1-B-6: late calculation / status
- 1-B-7: completed taskを除外する`replan`
- 1-B-8: weekday / date override解決
- 1-B-9: 境界値、日付跨ぎ、無効入力、可読性refactor

Acceptance Criteria:

- React Native、Expo、SQLite、Repositoryをimportしない純粋TypeScriptである。
- Engine内で現在時刻を取得せず、同じ入力へ同じ結果を返す。
- TC-P01〜TC-P10と追加境界値がすべてpassする。
- required taskを省略せず、minimumを下回らない。

### Phase 1-C: SQLite / Repository

Sub Phase:

- 1-C-1: Repository interfacesとdomain persistence model
- 1-C-2: migration runnerと`001_initial_schema.sql`
- 1-C-3: schedule / route / routine repositories
- 1-C-4: morning session / task execution repository
- 1-C-5: alarm record repository
- 1-C-6: SQLite integration testsと復元テスト

Acceptance Criteria:

- SQLiteが永続データの唯一の正本である。
- UIとDomainがSQLを直接扱わない。
- migrationを再実行しても安全で、一度適用したmigrationを変更しない運用になっている。
- アプリ再起動相当の再open後も設定とactive sessionを復元できる。

### Phase 1-D: 初回セットアップUI

Sub Phase:

- 1-D-1: design tokens、共通フォーム、アクセシブルな入力部品
- 1-D-2: onboarding
- 1-D-3: 複数区間の通学ルート設定
- 1-D-4: 曜日予定設定
- 1-D-5: 例外日設定（cancel / replace）
- 1-D-6: 朝ルーティン設定
- 1-D-7: 通知権限の事前説明

Acceptance Criteria:

- 初回設定だけで翌日のPlanningInputを構築できる。
- 画面フローの意図を保ちつつ、仕様に必要な複数区間、予定なし、例外日、通常/最短時間を入力できる。
- 小型画面、文字拡大、Safe Area、キーボード、読み上げ、44pt/48dp相当の操作領域を確認する。

### Phase 1-E: ホーム / 朝セッションUI

Sub Phase:

- 1-E-1: 前夜ホームと翌朝プラン
- 1-E-2: 手動開始 / 通知遷移とsession復元
- 1-E-3: 起床後プラン
- 1-E-4: タスク実行 / 完了 / 許可された省略
- 1-E-5: 再計画とリカバリー提案
- 1-E-6: 出発前確認

Acceptance Criteria:

- 手動開始から出発まで一連のフローが動作する。
- 完了のたびに現在時刻で再計画し、再起動後も続行できる。
- 遅れ、短縮、省略、遅刻見込みを色だけに依存せず伝える。

### Phase 1-F: ローカル通知

Sub Phase:

- 1-F-1: `AlarmService` interfaceとfake
- 1-F-2: permission use caseと拒否時UX
- 1-F-3: `ExpoNotificationAlarmService`
- 1-F-4: 予約、取消、再予約、DB記録
- 1-F-5: Expo Router deep link
- 1-F-6: adapter testと実機手順

Acceptance Criteria:

- UseCaseとUIが`expo-notifications`を直接importしない。
- 予定変更時に古い予約を取消し、新しい予約とDB記録が整合する。
- Android/iOS実機で通知を受け、対象sessionへ遷移できる。

### Phase 1-G: E2E・OS差分・実機検証

Sub Phase:

- 1-G-1: Android実機の通常・省電力・権限変更・再起動
- 1-G-2: iOS実機またはDevelopment Buildの通知・権限・再起動
- 1-G-3: 小型/大型画面、文字拡大、TalkBack / VoiceOver
- 1-G-4: 不具合修正、README、MOBILE_NOTES、release readiness更新

Acceptance Criteria:

- 実機結果と未検証項目を明確に区別して記録する。
- コアフローに既知の重大不具合がない。
- Expo通知で十分か、Phase 1-Hが必要かを根拠付きで判断する。

### Phase 1-H: 製品アラームPoC（条件付き）

Phase 1-Gで通常通知の精度またはUXが要件を満たさない場合だけ開始する。大きなNative Module導入やストア要件への影響があるため、着手前にユーザー確認する。

Acceptance Criteria:

- iOS AlarmKit / Android AlarmManagerのうち必要な側だけを小さく検証する。
- Planning Engine、UI、Repositoryを変更せず`AlarmService`実装だけを差し替えられる。

## 9. テスト方法

- Domain: 純粋unit test。仕様TC-P01〜P10、境界値、無効入力、決定性。
- Repository: 一時SQLite DBによるmigration / CRUD / constraint / reopen integration test。
- UseCase: in-memory fake repository、fake clock、fake alarm service。
- Component: React Native Testing Libraryで表示、入力、読み上げ名、エラー回復、文字拡大に耐える構造を確認。
- Navigation: onboarding、setup、morning、notification deep linkの主要経路。
- 通知: adapter単体test + 実機チェックリスト。
- Phase完了時: 全format、lint、typecheck、test。

詳細は`docs/TEST_PLAN.md`を参照する。

## 10. 実機検証方法

- 初期はAndroid emulatorまたはAndroid実機で共通UIとLocal-first動作を確認する。
- 通知PhaseからDevelopment Buildを標準にする。
- iOSはmacOS/XcodeまたはEAS Development Buildを使える環境で確認する。
- 通知時刻、アプリ状態（foreground/background/terminated）、端末再起動、権限変更、省電力、タイムゾーン変更を記録する。
- 実機結果は端末、OS、build、条件、期待、実際を`MOBILE_NOTES.md`へ残す。

## 11. Git / branch / commit / CI戦略

- 最初の計画commitだけは空リポジトリの`main`へ置く。
- 以後はPhase単位のfeature branch（例: `feat/project-foundation`, `feat/planning-engine`）を使う。
- 1 commit = 1つの説明可能な変更。WIPのままpushしない。
- commit前にformat、lint、typecheck、関連test。Phase完了時に全品質ゲート。
- Phase単位でPRを作り、Purpose、Changes、Architecture decisions、Tests、Screenshots、Known limitations、Next stepを書く。
- CIは`npm ci`とdependency cacheを使い、format check、lint、typecheck、unit testを別stepで可視化する。
- Foundationでは`npx expo-doctor`も実行し、Expo / React Native / Reactの互換性を確認する。
- force push、main履歴書き換え、大量squashはユーザー確認なしに行わない。

## 12. リスクと対策

| リスク                        | 対策                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| 通知を目覚まし相当に誤認      | 通知と本格アラームを明確に分け、実機評価後にnative PoCを判断 |
| 日時・日付跨ぎ・タイムゾーン  | Clock境界、固定入力、日付跨ぎtest、端末TZ変更試験            |
| 仕様のUI入力不足              | 仕様を優先し、勝手に簡略化せずADRで提案                      |
| UIからDBへ直接依存            | UseCaseとRepository interfaceで境界を強制                    |
| session状態と通知記録の不整合 | UseCase単位の更新順序、失敗型、再試行方針をtest              |
| 初学者に追えない履歴          | 小さいcommit、README、Development Log、理由中心のADR         |
| Expo / store要件の更新        | Phase開始時に公式docsを再確認し、versionをcommitで固定       |
| npmや依存導入の再現性         | `package-lock.json`をcommitし、CIは`npm ci`を使う            |
| 主要依存の肥大化・lock-in     | 目的、互換性、maintenance、license、代替案を確認しADRへ記録  |

## 13. 将来拡張

- AlarmKit / Android exact alarm adapter
- Calendar、Weather、Place Search、Transit Route / Status provider
- 駅・バス停候補、自動経路、運行情報
- バックエンド、認証、同期

いずれもProvider / Service interfaceの外側へ追加し、Planning Engineへ直接依存させない。

## 14. 停止して確認する条件

仕様変更、有料サービス、カード必須API、大規模DB変更、データ削除、force push、main履歴変更、大きなnative module、ストア要件へ大きく影響する判断、MVP機能削除は実装前にユーザーへ確認する。

## 15. 次の最小Sub Phase

`Phase 1-A-1: Expo + Router + TypeScriptプロジェクト初期化`。

初期化前にExpo安定版とNode互換性を再確認し、生成差分をレビューする。完了条件は、生成直後のアプリが起動可能で、依存関係を`package-lock.json`へ固定し、不要なsample codeを理由なく削除していないこと。

## 16. 参照した公式資料

- Expo SDK reference: https://docs.expo.dev/versions/latest/
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo Notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Development Builds: https://docs.expo.dev/develop/development-builds/introduction/
- Apple AlarmKit: https://developer.apple.com/documentation/alarmkit
- Android exact alarms: https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
