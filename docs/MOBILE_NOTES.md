# 朝ナビ モバイル技術メモ

更新日: 2026-10-06
状態: 調査初版。実機結果は未記録。

## 1. 現時点の技術判断

- Expo SDKは実装開始時点の最新安定版を使う。2026-10-06の公式表ではSDK 57がReact Native 0.86、React 19.2.3、Node 22.13以上を対象とする。
- 現在のNode 22.17.1はSDK 57の最低要件を満たす。
- `expo-sqlite`は永続DBとして利用でき、SDK 57推奨版は`~57.0.3`。ユーザー入力を含むSQLはbind parameter / prepared statementを使う。
- `expo-notifications`でlocal notificationを検証する。ただし通常通知と時計アプリ相当のアラームを同一視しない。
- 通知PhaseからDevelopment Buildを標準とする。

## 2. iOS

- ローカルnative buildにはmacOS / Xcodeが必要。WindowsではAndroidを主な早期検証先とする。
- AlarmKitはprominent alarm、繰り返し、snooze等を扱えるが、ユーザー許可と`NSAlarmKitUsageDescription`が必要。
- 許可拒否時はalarm scheduleが失敗するため、予約済み表示にしない。
- AlarmKitはExpo標準の抽象だけで完結すると仮定せず、採用時はDevelopment Buildとnative bridgeを独立PoCにする。
- Background Tasksを指定時刻実行の保証として使わない。

## 3. Android

- Android 12以降のexact alarmにはpermissionとplatform制約がある。
- Android 14では対象条件の新規installで`SCHEDULE_EXACT_ALARM`が既定拒否になり得る。
- `USE_EXACT_ALARM`はalarm / calendar用途向けだがGoogle Playの適格性制限があるため、manifestへ追加する前にpolicyを再確認する。
- schedule前に`canScheduleExactAlarms()`相当を確認し、拒否時にfallbackと説明を用意する。
- OEM省電力でdeliveryが遅れる可能性を端末別に記録する。
- `expo-notifications`でexact deliveryを要求する場合もmanifest、permission、delivery modeをSDK固定後に再確認する。

## 4. UI / UX観点

画面フローは12画面の意図を示す参考資料として扱う。

- 初回: splash -> onboarding -> route -> schedule / exception setup。
- 前夜: 翌日の例外、route、起床 / 出発の見通しを素早く確認。
- 当日: alarm -> wake summary -> current task -> recovery -> departure check。
- 朝の低覚醒状態でも、現在状況、次の行動、主CTAの順が明確であること。
- red / greenだけに依存せず、icon、text、headingで状態を伝える。
- Dynamic Type / font scaling時に固定高さcardへ文字を閉じ込めない。
- Safe Area、small screen、keyboard、landscapeで操作不能にならない。
- touch targetはiOS 44pt、Android 48dp相当を下限目安とする。
- countdownは視覚だけでなく読み上げ頻度を制御し、毎秒announcementしない。

## 5. Expo Go / Development Build

- Planning Engineと初期UIはExpo Goでも検証可能。
- local notificationはExpo Goで使える範囲があるが、app固有native設定と将来native moduleを含む最終検証にはDevelopment Buildを使う。
- remote pushは本MVP対象外。
- build料金やcloud availabilityを中核設計の前提にしない。

## 6. 実機記録テンプレート

```text
Date:
Device / model:
OS version:
App commit / build:
App state: foreground | background | terminated
Permission state:
Battery / focus setting:
Scheduled time:
Observed time:
Tap result:
Expected:
Actual:
Result: pass | fail | blocked
Notes:
```

## 7. 未確定事項

- SDK 57で採用する`expo-notifications`の固定versionとAndroid delivery option。
- iOS実機 / macOS検証環境。
- 製品として許容する通知遅延。
- AlarmKit / exact alarmへ進む定量的な閾値。

これらはPhase 1-Aまたは1-Gで事実を集めて確定する。大きなnative module導入はユーザー確認前に行わない。

## 8. 公式資料

- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/versions/latest/sdk/sqlite/
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://docs.expo.dev/develop/development-builds/introduction/
- https://developer.apple.com/documentation/alarmkit
- https://developer.apple.com/videos/play/wwdc2025/230/
- https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
- https://developer.android.com/reference/android/app/AlarmManager
