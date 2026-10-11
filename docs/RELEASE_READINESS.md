# 第1段階 リリース判定

更新日: 2026-10-12
判定: 実装済みコア機能は自動検証済み。実機検証と依存脆弱性対応が残るため、製品リリース可能とは判定しない。

## 確認済み

- Planning EngineとTC-P01〜P10、日時・境界値・決定性のテスト。
- SQLite migration、Repository、constraint、再openのintegration test。
- 初回設定、翌朝計画、朝session、再計画、タスク完了・省略、出発案内の自動テスト。
- 通知adapter、権限、予約同期、失敗補償、tap navigationの自動テスト。
- 全52 suites / 193 tests、format、lint、typecheck、migration check。
- Expo Doctor 21/21、Android / Web export。
- Chromeで初期設定の全経路、翌朝ホーム、reload後のSQLite復元。320×568と通常画面のホーム表示・主要操作。
- 当初の起床目安保持、タスク0件終了、復帰更新・秒単位表示、コアUseCase結合テストを追加。
- Development Build用依存 / EAS profile、WindowsとiPhoneのWi-Fi接続手順を準備。
- feature branchの[GitHub Quality run 38153544509](https://github.com/kuri227/asa-navi/actions/runs/38153544509)で全品質ゲート成功。npm ciのlockfile不整合を修復しnpm 11.6.2へ統一。PR時にも同じworkflowを実行する。

## リリース前に必要

| 項目                | 状態                            | 完了条件                                                                           |
| ------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| Android通知         | 未検証                          | MOBILE_NOTESのN-01〜N-12を実機で記録                                               |
| iOS通知             | 未検証                          | 同チェックリストをiPhoneのDevelopment Buildで記録                                  |
| OS accessibility    | 未検証                          | Dynamic Type / font scaling、TalkBack / VoiceOver、keyboard、Safe Areaを実機で確認 |
| 通知精度の適合      | 判断保留                        | 配信遅延、消音・Focus、省電力、terminated状態を測定し判断                          |
| dependency security | 既知advisory残存                | DEPENDENCY_SECURITYの修正版・SDK互換性・到達経路を再評価し、残存リスクの扱いを確定 |
| GitHub CI           | feature branch pushで全step成功 | PRでも全品質ゲート成功を確認                                                       |

実機の記録先はMOBILE_NOTES。端末・build・条件・実時刻・結果を必ず残す。Web結果でOS試験を置き換えない。Phase 1-Hは通知の実測結果が要件を満たさない場合だけ検討し、着手前にユーザー確認する。

## 再現方法

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:sqlite
npm run migration:check
npx expo-doctor
npm run web:export
npm run web:preview
```

Webプレビューは127.0.0.1:8090。架空のrouteとtaskを登録して保存とreloadを確認する。通知検証はAndroid / iOSで別途実施する。
