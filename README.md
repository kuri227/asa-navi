# 朝ナビ

朝ナビは、学生の最初の予定と通学時間、朝の準備タスクから、起床時刻と出発時刻を逆算するモバイルアプリです。寝坊や準備の遅れが起きたときも、短縮・省略・遅刻見込みを含む実行可能な朝プランへ組み直します。

現在はコアMVPの開発中です。Expo SDK 57の開発基盤と品質ゲートまで完了しており、画面にはまだExpoのsample UIが表示されます。

## 何を解決するアプリか

朝は「何時に起きればよいか」「今の遅れで間に合うか」「何を短縮できるか」の判断が集中します。朝ナビは予定・移動・朝タスクを一つの計画として扱い、今やることと出発までの見通しを示します。

## 主な機能

コアMVPで実装する機能は次のとおりです。

- 曜日別予定と日付別の休講・特別予定
- 徒歩、電車、バス等を組み合わせる複数区間の通学ルート
- 通常時間、最短時間、必須・省略可を持つ朝タスク
- 起床時刻、最終出発時刻、遅刻見込みの計算
- 完了状況と現在時刻に応じた再計画
- SQLiteによるlocal-firstな保存
- ローカル通知からの朝セッション開始

外部カレンダー、天気・交通API、GPS、OCR、AI、login、cloud syncは第1段階の対象外です。

## 画面イメージ

仕様の画面フローは、スプラッシュ、初回設定、前夜ホーム、アラーム、起床後プラン、タスク実行、遅延時の提案、出発前確認で構成されています。実装時は図の情報階層を基準にしつつ、iOS / Android、Safe Area、文字拡大、読み上げ、小型画面へ適応させます。

## 技術構成

| 領域         | 技術・方針                                      |
| ------------ | ----------------------------------------------- |
| Mobile       | Expo SDK 57 / React Native 0.86 / React 19.2    |
| Navigation   | Expo Router                                     |
| Language     | TypeScript 6 / strict mode                      |
| Domain       | React Native非依存の純粋TypeScript              |
| Database     | expo-sqlite + versioned migration               |
| Validation   | Zod（UI・DB等の信頼境界）                       |
| Notification | AlarmService + expo-notifications（実装予定）   |
| Test         | Jest / jest-expo / React Native Testing Library |
| Quality      | ESLint / Prettier / TypeScript / expo-doctor    |
| CI           | GitHub Actions                                  |

## ディレクトリ構成

```text
src/
  app/             Expo Routerのroute。薄い画面入口に保つ
  application/     UseCaseとRepository等のinterface
  domain/          Planning Engineと朝ナビ固有ルール
  infrastructure/ SQLite、通知、端末時刻等のadapter
  features/        機能別のUI、hook、view model
  components/      複数機能で共有するUI
  stores/          未保存の一時的UI状態
  theme/           design token
  validation/      UI・DB等の境界validation
docs/              計画、設計、テスト、技術判断、開発記録
```

詳しい依存方向は[アーキテクチャ](docs/ARCHITECTURE.md)を参照してください。

## 必要環境

- Node.js 22.13以上、23未満（開発確認version: 22.17.1）
- npm（開発確認version: 11.6.2）
- Git
- Android端末またはAndroid Emulator
- iOS確認にはiPhone、macOSのSimulator、またはEAS Build環境

Node.jsのmajorが異なる場合は、Node version managerで22系へ切り替えてください。

## セットアップ

```bash
git clone https://github.com/kuri227/asa-navi.git
cd asa-navi
npm ci
```

`npm ci`は`package-lock.json`どおりに依存を再現します。packageを追加するときはSDK互換versionを選ぶため、`npm install`ではなく`npx expo install <package>`を使用します。

## 起動方法

```bash
npx expo start
```

terminalに表示されるQR codeまたはshortcutから対象platformを開きます。Metro cacheに問題がある場合は`npx expo start --clear`を試してください。

## Androidで試す方法

1. Android端末へExpo Goをinstallし、PCと同じnetworkへ接続します。
2. `npx expo start`を実行します。
3. Expo GoでQR codeを読み取ります。

Android Emulatorを設定済みの場合は`npm run android`でも起動できます。native codeを追加したPhase以降はExpo GoではなくDevelopment Buildが必要です。

## iOSで試す方法

iPhoneではExpo GoでQR codeを読み取れます。iOS SimulatorはmacOSとXcodeが必要なため、Windowsだけでは起動できません。native codeが必要になった場合は、macOSで`npx expo run:ios`を使うか、EAS Development Buildを作成します。

## Expo GoとDevelopment Buildの違い

- Expo Go: Expo Goに組み込まれたnative moduleだけを使う簡易確認環境です。現時点のsample appをすぐ確認できます。
- Development Build: 朝ナビ専用のnative moduleと設定を含む開発用アプリです。通知や将来のnative adapter等を正確に検証するときに使います。

`ios/`と`android/`はContinuous Native Generationで生成し、手編集しません。native設定は`app.json`とconfig pluginで管理します。

## テスト方法

```bash
npm test
```

watch modeは`npm run test:watch`です。Domainはunit test、Repositoryは`npm run test:sqlite`によるSQLite integration test、UseCaseはfake Repository、UIはReact Native Testing Libraryで検証します。詳細は[テスト計画](docs/TEST_PLAN.md)を参照してください。

## Format / Lint / Typecheck

```bash
npm run format:check
npm run lint
npm run typecheck
npx expo-doctor
```

自動整形は`npm run format`です。Pull RequestではGitHub Actionsが同じ品質ゲートを実行します。

## Dependency security

```bash
npm audit
```

修正版があるtransitive dependencyは検証付きoverrideで対処しています。2026-10-06時点では上流修正版がないadvisoryが残っているため、`npm audit fix --force`は実行しません。理由、到達可能性、更新条件は[依存関係セキュリティ](docs/DEPENDENCY_SECURITY.md)に記録しています。

## DB / Migration

SQLiteは永続データの唯一の正本とします。migrationは`001_initial_schema.sql`のように番号を付け、適用済みfileは変更せず新しいmigrationを追加します。UIからSQLを直接実行しません。

`expo-sqlite`とmigration runnerは実装済みです。SQL fileを変更した場合は`npm run migration:generate`でアプリbundle用moduleを更新し、`npm run migration:check`で同期を確認します。適用済みmigrationは変更せず、次の番号のfileを追加してください。Repository実装はPhase 1-Cで継続中です。

## アーキテクチャ

依存は次の方向に限定します。

```text
UI → Application / UseCases → Domain
                 ↓
          Repository interface
                 ↑
            Infrastructure
```

DomainはExpo、React Native、SQLite、Repositoryへ依存しません。通知も`AlarmService`で抽象化し、UseCaseから`expo-notifications`を直接呼びません。

## Planning Engineとは

朝ナビの中心となる純粋TypeScriptの計算moduleです。解決済みの予定日時、通学区間、朝タスク、現在時刻を入力し、起床・出発・短縮・省略・遅刻見込みを返します。

Engine内部で現在時刻を取得せず、同じ入力には同じ結果を返します。React Native、Expo、SQLite、UIから独立させることで、端末なしでも境界値をunit testできます。

## Git branch / commitルール

- `main`は品質ゲートが通る状態に保ちます。
- Phaseごとに`feat/<phase-or-feature>` branchを使います。
- 1 commitを1つの説明可能な変更にします。
- commit前にformat、lint、typecheck、関連testを実行します。
- force pushやmainの履歴変更はユーザー確認なしに行いません。

## 現在実装済みの機能

- Expo SDK 57 / Expo Router / TypeScript strictの初期化
- iOS / Android / Web共通のsample app起動基盤
- architecture directoryとpath alias
- ESLint、Prettier、typecheck
- Jest / React Native Testing Libraryのsmoke test
- GitHub Actionsのquality workflow
- dependency auditの調査、互換override、残存リスク記録
- Planning Engine（基本計画、短縮、省略、遅刻判定、completed task再計画）
- 曜日予定と日付例外を絶対日時へ変換するSchedule Resolver
- 仕様TC-P01〜TC-P10と追加境界値のunit / acceptance test
- SQLite migrationとschedule / route / routine / session / task execution / settings / alarm Repository
- light / dark Design Tokenとアクセシブルな共通フォーム部品

## 未実装

- 朝ナビ固有UIとdesign token
- 曜日予定、例外日、通学ルート、朝ルーティンの設定
- 朝セッションと再計画画面
- ローカル通知
- Android / iOS実機検証

## 今後のロードマップ

1. Planning Engine
2. SQLite / Repository
3. 初回セットアップUI
4. ホーム / 朝セッションUI
5. ローカル通知
6. OS差分・accessibility・実機検証

細かなSub PhaseとAcceptance Criteriaは[実装計画](docs/IMPLEMENTATION_PLAN.md)を参照してください。

## Troubleshooting

### `npm ci`でNode.js versionの警告が出る

`node --version`を確認し、Node 22.13以上の22系へ切り替えてください。

### packageのversionがExpoと合わない

```bash
npx expo install --check
npx expo install --fix
npx expo-doctor
```

`--fix`後は必ずdiffと全品質ゲートを確認してください。

### QR codeから接続できない

PCと端末を同じnetworkに接続します。network制限がある場合は`npx expo start --tunnel`を試せますが、通常より遅くなることがあります。

### `npm audit`がhighを報告する

[依存関係セキュリティ](docs/DEPENDENCY_SECURITY.md)の既知advisoryと一致するか確認してください。`npm audit fix --force`はExpo SDK互換性を壊す可能性があるため実行しません。

## 開発資料

- [実装計画](docs/IMPLEMENTATION_PLAN.md)
- [アーキテクチャ](docs/ARCHITECTURE.md)
- [テスト計画](docs/TEST_PLAN.md)
- [モバイル技術メモ](docs/MOBILE_NOTES.md)
- [開発ログ](docs/DEVELOPMENT_LOG.md)
- [ADR](docs/decisions/README.md)
