# 朝ナビ モバイル技術メモ

更新日: 2026-10-09
状態: 自動検証・実機手順整備済み。Android / iOS実機結果は未記録。

## Expo Notifications adapter（2026-10-09）

- Expo SDK 57の推奨`expo-notifications`は`~57.0.22`。日時指定は`SchedulableTriggerInputTypes.DATE`と`Date`を使う。
- `scheduleNotificationAsync`の戻り値identifierをDBへ保存し、取消時は`cancelScheduledNotificationAsync`へ渡す。tray表示を消す`dismissNotificationAsync`とは区別する。
- content dataへ`/morning/start?sessionId=...`のURLと型・session IDを含める。cold startと起動中のresponse observerはPhase 1-F-5で接続済み。
- foregroundではhandler未設定時に表示されないため、native platformでbanner / list / soundを許可するhandlerをrootで登録する。
- Android 8以上は`morning-alarm` channelを使う。Android 13のpermission prompt前のchannel作成は既存permission adapterが担う。
- local通知はExpo Goでも利用可能だが、通知精度、background / terminated、消音・Focus・省電力はDevelopment Build実機で検証する。
- 通常通知は時計アプリ相当の強制力を保証しない。本格AlarmKit / Exact AlarmへはPhase 1-Gの評価後、ユーザー確認を経て進む。

## 1. 現時点の技術判断

- Expo SDKは実装開始時点の最新安定版を使う。2026-10-06の公式表ではSDK 57がReact Native 0.86、React 19.2.3、Node 22.13以上を対象とする。
- 現在のNode 22.17.1はSDK 57の最低要件を満たす。
- `expo-sqlite`は永続DBとして利用でき、現在のSDK 57互換版は`~57.0.4`。ユーザー入力を含むSQLはbind parameter / prepared statementを使う。
- SDK 57推奨版`expo-notifications ~57.0.22`でlocal notificationを検証する。ただし通常通知と時計アプリ相当のアラームを同一視しない。
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
- Androidの通知権限要求前に、重要度MAXの`morning-alarm` channelを作成する。実際の音量・表示・遅延は実機で評価する。

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

### expo-sqliteの検証範囲

- SDK 57互換版`expo-sqlite ~57.0.4`を使用する。
- iOS / Androidではmigrationをexclusive transactionで実行し、WALとforeign key制約を有効にする。
- SDK 57時点のWeb対応はalphaで、exclusive transactionはWeb非対応。第1段階の永続化受入確認はiOS / Androidを対象にする。
- migration SQLは`.sql`を正本とし、Metro用TypeScript moduleはscriptで生成する。

## 6. Phase 1-F-6 自動検証結果

2026-10-09、commit `29fe763`を含む構成で次を確認した。

| 検証                                      | 結果                       |
| ----------------------------------------- | -------------------------- |
| 通知adapter / response observer unit test | pass                       |
| 全Jest test                               | 48 suites / 182 tests pass |
| format / lint / TypeScript                | pass                       |
| Expo Doctor                               | 21/21 pass                 |
| Android production bundle                 | pass                       |
| `expo-notifications`                      | 57.0.22                    |

自動testはDATE trigger、channel、content data、取消、permission、foreground handler、cold start、起動中tap、破損data無視、listener解除、Web分岐を対象とする。OSの通知配信時刻、音、Focus / Do Not Disturb、省電力、terminated状態は自動testでは保証しない。

### このPCの実機検証可否

- Windows環境に`adb`とAndroid Emulator commandが見つからず、接続端末を列挙できなかった。
- Windows単体ではiOS Simulatorを実行できない。
- したがってAndroid / iOSの実機項目は未検証であり、passとして扱わない。
- global npm packageも確認したが、Android SDK / EAS CLIのglobal installはなかった。project commandは固定versionを得るため`npx`を使う。

## 7. Android / iOS 実機チェックリスト

### 事前準備

1. `git checkout feat/project-foundation`後、`npm ci`と`npx expo-doctor`を実行する。
2. AndroidはExpo GoまたはDevelopment Build、iOSはiPhone上のExpo GoまたはDevelopment Buildを用意する。通知の最終評価はDevelopment Buildを優先する。
3. 初回設定で、明日の最初の予定、通学route、朝task、通知権限を登録する。
4. 前夜ホームに「起床通知を予約しました」と表示されることを確認する。
5. 端末、OS、commit / build、通知権限、Focus / Do Not Disturb、省電力条件を下のtemplateへ記録する。

### 必須ケース

| ID   | 条件                   | 操作                                              | 期待結果                                                         | 状態   |
| ---- | ---------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| N-01 | permission未決定       | 初期設定で理由説明後に許可する                    | OS promptが表示され、前夜ホームが予約済みを示す                  | 未検証 |
| N-02 | permission拒否         | OS promptで拒否して初期設定を完了                 | appは継続し、前夜ホームが未許可を文章で示す                      | 未検証 |
| N-03 | foreground             | appを開いたまま予約時刻を待つ                     | banner / listと音が提示される                                    | 未検証 |
| N-04 | background             | appをbackgroundへ移して予約時刻を待つ             | 通知が届き、tapで対象朝sessionを開始する                         | 未検証 |
| N-05 | terminated             | appを終了して予約時刻を待つ                       | 通知が届き、tapでcold start後に対象朝sessionを開始する           | 未検証 |
| N-06 | 予定時刻変更           | 予約後に明日の特別時間割を変更し、ホームへ戻る    | 古い通知が取消され、新時刻が表示・予約される                     | 未検証 |
| N-07 | 明日の予定取消         | 予約後に明日を休講・予定なしへ変更                | 予定なし表示になり、古い通知が届かない                           | 未検証 |
| N-08 | permission後変更       | OS設定で通知を拒否し、ホームを再表示              | 予約済みと誤表示せず、未許可と回復方法を示す                     | 未検証 |
| N-09 | Focus / Do Not Disturb | 集中モード等を有効にして予約時刻を待つ            | 実際の音・表示・遅延を記録し、時計alarmとの差を評価する          | 未検証 |
| N-10 | Android省電力          | battery optimizationの通常 / 制限ありで各1回実行  | 各条件の配信遅延を秒単位で記録する                               | 未検証 |
| N-11 | 端末再起動             | 予約後に端末を再起動し、appを開かず予約時刻を待つ | 配信有無・遅延を記録する                                         | 未検証 |
| N-12 | timezone変更           | 予約後にtimezoneを変更し、appを再表示             | 新しいtimezoneでの表示・再予約結果と、旧通知の残存有無を記録する | 未検証 |

N-09〜N-12の結果はPhase 1-Gで通常通知の限界を判断する根拠にする。OS設定を変更した場合は検証後に元へ戻す。

## 8. 実機記録テンプレート

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

## 9. 未確定事項

- Androidで採用する最終的なdelivery optionと通知精度。
- iOS実機 / macOS検証環境。
- 製品として許容する通知遅延。
- AlarmKit / exact alarmへ進む定量的な閾値。

これらはPhase 1-Gで事実を集めて確定する。大きなnative module導入はユーザー確認前に行わない。

## 10. 公式資料

- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/versions/latest/sdk/sqlite/
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://docs.expo.dev/develop/development-builds/introduction/
- https://developer.apple.com/documentation/alarmkit
- https://developer.apple.com/videos/play/wwdc2025/230/
- https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
- https://developer.android.com/reference/android/app/AlarmManager
