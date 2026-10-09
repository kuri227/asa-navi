# 朝ナビ テスト計画

更新日: 2026-10-06

## 1. 方針

テストはレイヤ境界と重要な振る舞いを保証する。coverage率を目的化せず、Planning Engineの正しさ、永続化、再計画、通知境界、朝の主要導線を優先する。

## 2. 品質ゲート

各commit前:

```text
npm run format:check
npm run lint
npm run typecheck
npm test -- <related scope>
```

Phase完了時:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npx expo-doctor
```

`expo-doctor`はFoundationの完了ゲートとする。script名はPhase 1-Aで確定する。失敗理由を特定せずskipしない。

## 3. レイヤ別テスト

| Layer               | Test               | 主な対象                                     |
| ------------------- | ------------------ | -------------------------------------------- |
| Domain              | Unit               | 計算、優先順位、不変条件、決定性、境界値     |
| Schedule resolution | Unit               | date override > weekday > no schedule        |
| Repository          | SQLite integration | migration、CRUD、constraint、mapping、reopen |
| UseCase             | Unit with fakes    | orchestration、失敗伝播、保存順序、再予約    |
| Component           | RNTL               | 表示、入力、error、accessibility label、操作 |
| Navigation          | Integration        | onboarding、setup、morning、deep link        |
| Notification        | Adapter + device   | permission、schedule、cancel、delivery、tap  |

## 4. Planning Engine必須ケース

- TC-P01: 通常。09:00開始、余裕10、通学45、task60 -> 出発08:05、起床07:05、late 0。
- TC-P02: deficit 10、短縮余地15 -> compressでlate 0。
- TC-P03: deficit 20、短縮10、optional 15 -> compress + skipでlate 0。
- TC-P04: deficit 40、最大回収20 -> late 20。
- TC-P05: completed taskを残り計算へ含めない。
- TC-P06: minimumDuration未満へ短縮しない。
- TC-P07: required taskを省略しない。
- TC-P08: override cancel -> planなし、alarmなし。
- TC-P09: weekday 09:00、override 10:40 -> 10:40を採用。
- TC-P10: 8 + 12 + 6 + 5 -> route duration 31。

追加境界値:

- slackがexactly 0、9、10分。
- minimum = normal、圧縮余地0。
- optional 0件、requiredだけ、task 0件。
- disabled taskとcompleted taskの混在。
- priority同値、sortOrder同値時の決定性。
- route 0区間、duration 0、複数区間。
- nowが予定起床直後、最終出発exactly、最終出発後。
- first eventがすでに開始している。
- first event / wake / routeが日付を跨ぐ。
- 深夜0時を跨ぐ。
- timezone変更後に保存済みsessionを復元する。
- DSTのあるtimezoneでもlocal templateからの具体日時化が不整合を起こしにくい。
- input arrayとDateをmutationしない。
- 同じ入力を複数回呼んだ結果が同じ。
- 負のduration、不正priority、重複ID等のinvalid input。

## 5. Repository test

- 空DBに全migrationが順番に適用される。
- 同じDBを再openしてmigrationが二重適用されない。
- foreign key、unique、check constraintが機能する。
- ISO timestamp / HH:mm / boolean mappingを正しく往復する。
- 複数route segmentの順序が保持される。
- override cancel / replaceが正しく復元される。
- active sessionとtask executionsを再open後に復元できる。
- queryのユーザー入力がbindされる。
- migration途中の失敗でversionだけ進まない。

## 6. UseCase test

- 予定なしではsessionもalarmも作成しない。
- build成功時にsession保存とalarm recordが整合する。
- alarm schedule失敗を`NotificationError`として返し、UIが回復できる。
- task完了後、完了taskを除いて再計画し、次taskをactiveにする。
- 全task完了でsessionをcompletedにする。
- app復帰時に古いplanned timesを正とせず現在時刻で再計画する。
- 設定変更時に既存alarmを取消して再予約する。
- 同じsession・起床時刻のalarm同期を繰り返しても、取消・再予約を増やさない。
- OS予約後にDB保存が失敗した場合、端末側の予約を補償取消する。
- permission deniedで誤って「予約済み」と表示しない。
- cold startと起動中の通知tapから対象sessionを開く。
- morning alarm以外や空のsession IDをnavigationへ渡さない。
- notification response listenerをroot unmount時に解除する。

## 7. UI / accessibility test

- labelと入力が関連付く。
- validation errorが読み上げ可能で、入力値を失わず修正できる。
- icon-only操作にaccessible nameがある。
- 状態や遅刻警告を色だけで伝えない。
- 大きい文字でCTAと重要情報が欠落しない構造である。
- keyboard表示時に入力と主要操作へ到達できる。
- optional skipはrequired taskに表示されない。
- loading、empty、error、permission denied、restored sessionを確認する。

## 8. 実機test matrix

| 条件                          | Android | iOS        |
| ----------------------------- | ------- | ---------- |
| foreground notification       | 必須    | 必須       |
| background notification       | 必須    | 必須       |
| terminated app                | 必須    | 必須       |
| permission denied -> recovery | 必須    | 必須       |
| device reboot                 | 必須    | 可能な範囲 |
| battery saver / focus mode    | 必須    | 必須       |
| timezone / date boundary      | 必須    | 必須       |
| font scaling                  | 必須    | 必須       |
| TalkBack / VoiceOver          | 必須    | 必須       |

未実施項目は成功扱いにせず、環境と理由を記録する。

## 9. バグ修正手順

1. 失敗を再現するtestを追加。
2. testが期待どおり失敗することを確認。
3. 最小修正。
4. 関連testと全品質ゲートを再実行。
5. 原因と再発防止をcommit / DEVELOPMENT_LOGへ記録。
