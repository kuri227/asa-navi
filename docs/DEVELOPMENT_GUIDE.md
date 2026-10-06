# 朝ナビ Codex開発指示書 v1.1

更新日: 2026-10-06
対象: 朝ナビ 第1段階（コアMVP）

## 0. 基本方針

Codexは朝ナビのリードエンジニア兼レビュアーとして、要件理解、技術調査、段階的実装、テスト、自己レビュー、Git/GitHub履歴、初学者向けドキュメントまでを開発作業に含める。一括で全機能を実装しない。

## 1. 最初に読む資料

実装前に次を確認する。

- `asanavi_spec_v0_3.md`
- 「朝ナビの一日を支えるアプリ画面フロー.png」
- `docs/IMPLEMENTATION_PLAN.md`
- `README.md`（存在する場合）
- `AGENTS.md`（存在する場合）
- その他の朝ナビ関連資料

優先順位は、最新ユーザー要件、実装仕様書、実装計画、画面フロー、既存コードの順とする。勝手な仕様変更は禁止する。必要な場合は`docs/decisions/`にADRを作り、問題、理由、代替案、推奨、影響を記録する。

## 2. リポジトリ調査

実装前にGit repository、remote、branch、未commit変更、`package.json`、Expo、React Native、TypeScript、Node.js、ESLint、Prettier、test、Expo Router、SQLite、directory、既存実装、仕様との差分を確認する。既存ファイルや実装を理由なく削除しない。

## 3. 技術調査

不確実なモバイル仕様を推測で実装しない。情報源は原則としてOpenAI、Expo、React Native、Apple Developer、Android Developers、ライブラリ公式GitHub、信頼できるOSSの順で優先する。

Expo、React Native、Expo Router、expo-sqlite、expo-notifications、Development Build、iOS、Android、AlarmKit、AlarmManager / Exact Alarm、ストア制約、TypeScript、Jest、React Native Testing LibraryはPhase開始時に必要な範囲を公式資料で再確認する。

## 4. Skills / 外部ツール

開発効率やレビュー品質を実質的に改善する場合だけ導入する。不要なSkillを大量導入せず、公式または信頼できる配布元、maintenance、権限、導入理由を記録する。

## 5. 主要依存追加ルール

仕様書にない主要packageを「便利だから」だけで追加しない。特にstate management、UI / form library、ORM、date/time library、navigation helper、native module、analytics、logging SDKを慎重に扱う。

追加前に次を確認し、主要依存追加はADRへ記録する。

- 目的と標準機能では不足する理由
- maintenance状況
- Expo SDK 57 / React Native互換性
- native依存
- 将来の削除しやすさ
- license
- 代替案

仕様書ですでに採用済みの依存も、Phase 1-Aで実際のversionと互換性を確認して固定する。

## 6. 開発サイクル

各Sub Phaseで次を完了する。

```text
PLAN -> IMPLEMENT -> FORMAT -> LINT -> TYPECHECK -> TEST
-> REVIEW -> FIX -> RETEST -> COMMIT -> 次のSub Phase
```

品質ゲート失敗状態で先へ進まない。

## 7. Phase 1-A追加品質ゲート

初期化後、最低限次を成功させる。

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npx expo-doctor
```

latest stable Expo SDK、pre-releaseではないこと、Node.js要件、React Native / React互換性、expo-doctorで重大問題がないことを確認する。

## 8. Planning Engine原則

- 純粋TypeScript
- React Native、Expo、SQLite、UI非依存
- 現在時刻を内部取得せず`now`を引数で受け取る
- 同じ入力に同じ結果を返し、副作用を持たない
- `any`禁止、TypeScript strict

## 9. Validation責務分離

Zod等の境界validationは、UI、DB、外部入力由来の負数duration、空文字、不正enum、不正日時文字列を拒否する。

Domain invariantは、朝ナビとして成立しない状態をDomainで防ぐ。

- `minimumDurationMin > normalDurationMin`
- required taskのskip
- route segment順序破損
- 予定計算上の不整合

Domain整合性をZodだけへ任せない。

## 10. 日付・時刻設計

Planning Engineで曜日や`HH:mm`を直接解釈しない。

```text
DB weekday template: 火曜日 08:50
  -> Application / Schedule Resolver
  -> 2026-10-06T08:50:00+09:00
  -> Planning Engine: 解決済み絶対日時
```

- weekday templateはDBへ`HH:mm`で保存する。
- date overrideは対象日と時刻として保存する。
- Schedule Resolverが具体日時へ変換する。
- Planning Engineは曜日を解釈しない。
- 日付跨ぎ、深夜0時跨ぎ、event開始済み、exactly 0分余裕、timezone変更後の復元、DST地域で壊れにくい設計をtestする。

## 11. アーキテクチャ

Local-first + Domain-firstを維持する。

```text
UI
-> Application / UseCases
-> Domain
-> Repository Interface
-> Infrastructure
```

UIからSQLite、DomainからSQLite / Expo / React Native、UseCaseからexpo-notifications、Planning EngineからRepositoryへの直接依存を禁止する。

## 12. アラーム設計

```text
AlarmService
|- ExpoNotificationAlarmService
|- IOSAlarmKitAdapter（製品版候補）
`- AndroidAlarmManagerAdapter（製品版候補）
```

MVPはExpo Notificationsで価値を検証する。Phase 1-Gで通知精度、強制力、Silent / Focus、background / terminated、UXを実機評価する。通常通知が要件を満たさない場合だけPhase 1-Hへ進み、着手前にユーザー確認を得る。

## 13. UI実装

画面フローを基に、iOS / Android、小型画面、Safe Area、Dynamic Type、accessibility、touch target、keyboard、将来のdark modeを考慮する。

```text
src/theme/
  colors.ts
  spacing.ts
  typography.ts
  radius.ts
```

## 14. リーダブルコード

短さより可読性を優先する。1関数1責務、1fileの責務限定、guard clause、domain用語、重複排除を重視し、深いnest、boolean引数乱用、magic number、巨大component / hookを避ける。コメントは主に「なぜ」を説明する。

## 15. エラー設計

`ValidationError`、`DomainError`、`RepositoryError`、`NotificationError`等を区別し、握りつぶさない。UIへ示す回復可能なエラーと開発ログを分離する。

## 16. DB

SQLiteを唯一の永続データ正本とする。Migration、Repository経由のアクセスを必須とし、UIへSQLを書かない。適用済みmigrationを変更しない。データ削除は明示操作と確認を必要とする。

## 17. テスト

| 対象 | 方法 |
| --- | --- |
| Domain | Unit test |
| Repository | SQLite integration test |
| UseCase | fake / mock repository |
| Component | React Native Testing Library |
| Navigation | 主要経路integration test |
| Notification | adapter test + 実機 |

バグ修正は再現testを先に追加する。

Planning EngineはTC-P01〜P10に加え、exactly 0分余裕、minimumとnormalが同値、optional 0件、requiredのみ、route 0件、route duration 0、複数区間、completed除外、event開始済み、日付跨ぎ、深夜0時跨ぎ、override cancel / replace、不正duration、同一入力と同一結果をtestする。

## 18. 自己レビュー

commit前にCorrectness、Readability、Architecture、Type Safety、Testing、Duplication、Complexity、Mobile、UX、Accessibility、Security、Performanceを確認する。問題を修正して再testしてからcommitする。

## 19. Git運用

GitHubを開発履歴として使い、1 commitを1つの説明可能な変更にする。意味のない`update`、`fix`、`various changes`や大量squashを避ける。

## 20. Branch / PR

`main`は動作可能に保ち、`feat/project-foundation`、`feat/planning-engine`等のPhase branchを使う。PRにはPurpose、Changes、Architecture decisions、Test results、Screenshots、Known limitations、Next stepを含める。force pushやmain履歴変更は事前確認を要する。

## 21. README

初学者向けに、製品概要、課題、主機能、技術とdirectory、必要環境、setup、Android / iOS、Expo Go / Development Build、test、lint / typecheck、SQLite / migration、architecture、Planning Engine、Git rule、実装済み、未実装、roadmap、troubleshootingを説明する。

## 22. 開発記録

`IMPLEMENTATION_PLAN.md`、`ARCHITECTURE.md`、`DEVELOPMENT_LOG.md`、`TEST_PLAN.md`、`MOBILE_NOTES.md`、`decisions/`を管理する。DEVELOPMENT_LOGには日付、Phase、実装、commit、test、問題、解決、次Phaseを記録する。

## 23. CI

GitHub Actionsを早期導入し、`npm ci`、format check、lint、typecheck、testを実行する。foundation phaseでは可能ならexpo-doctorも確認する。

## 24. Secret

`.env`、API key、signing credential、Apple / Google credentialをcommitしない。必要なら値を含まない`.env.example`を用意する。

## 25. 第1段階で勝手に追加しない機能

Calendar、天気、リアルタイム交通、GPS、PDF OCR、AI / LLM、cloud backend、login、cloud sync、本格AlarmKit / AlarmManagerを勝手に追加しない。

## 26. 外部API / サービス

導入前に必要性、無料枠、card登録、商用利用、rate limit、Terms、終了リスク、vendor lock-in、OS対応を確認する。無料、OSS、local-firstを優先し、Provider interfaceで交換可能にする。

## 27. 停止してユーザー確認する条件

仕様変更、有料service、card必須API、大規模DB変更、user data削除、force push、main履歴変更、大きなnative module、Store要件への大きな影響、MVP機能削除は事前確認を要する。

## 28. Phase終了報告

次の見出しで報告する。

```text
Phase
実装した内容
変更ファイル
設計判断
テスト（実行コマンド / 結果）
動作確認
Self Review
Commit（hash / message）
残課題
次に行う作業
```

## 29. 次の最小Sub Phase

`Phase 1-A-1: Expo + Router + TypeScriptプロジェクト初期化`。

開始前にExpo SDK 57 latest stable、Node互換性、pre-releaseではないこと、依存互換性を確認する。Phase 1-A全体ではformat check、lint、typecheck、test、expo-doctorを成功させる。

## 最重要原則

一度に全部作らず、常に動作確認可能な小さな完成状態を積み重ねる。実装速度より、品質、可読性、テスト可能性、Git履歴、変更容易性、OS差分への耐性を優先する。
