# 朝ナビ モバイル開発ハーネス

対象: iOS・Androidを主対象とするExpo / React Nativeアプリ。Webは補助確認。参照時点: 2026-11-15（Expo SDK 58）。

この文書の「必須」は朝ナビのレビュー基準。OS・ストアの要件は別途、対象バージョンの公式資料で確認する。WebのWCAG 2.2はWeb検証の基準として参照し、ネイティブアプリの適合認定やストア審査の代わりにはしない。

## 1. 実装・レビューの必須ルール

| ID  | 領域                       | 朝ナビのルール                                                                                                                                                                                                                                                                          |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01 | セーフエリア               | 時刻・通信・電池、ノッチ、ホームインジケータ、Androidのシステムバーにタイトル・本文・操作を重ねない。固定のヘッダー高ではなく、端末・ウィンドウのinsetを使う。詳細は下記。                                                                                                              |
| M02 | 画面サイズ・文字           | 小型画面を先に設計する。文字拡大・長い日本語/英数字・入力エラーでも、情報・CTA・閉じる操作へ到達できること。固定の高さや文字の切り詰めで重要情報を失わせない。幅が足りなければ折り返すか縦に並べる。                                                                                    |
| M03 | 操作領域・可読性           | 主な操作のタップ領域は朝ナビ共通で48×48以上（iOS pt / Android dp）。アイコンの見た目の寸法ではなく押せる領域を測る。隣の操作と重ねない。ライト・ダーク両方で、Webは通常文字4.5:1、大きな文字3:1、必要な非テキスト表示3:1を基準とする。色だけでエラー・選択・遅刻を伝えない。            |
| M04 | ナビゲーション・ダイアログ | Expo Routerを使い、OS標準の戻る操作を妨げない。モーダルには目的と閉じる操作を用意し、背面は操作・読み上げ対象にしない。閉じた後は元の操作へ戻れること。通知やリンクからの直接起動では入力を検証し、対象なし・不正・失敗時に安全な戻り先を示す。                                         |
| M05 | キーボード・フォーム       | フォーカス中の入力とエラーをキーボード・固定ボタンで隠さない。最初／最後の欄、入力中のボタン操作、閉じた後を試す。プレースホルダーをラベルの代用にせず、エラーは対象と直し方を明示し、入力を保持する。                                                                                  |
| M06 | フィードバック             | 待ち中・成功・空・失敗・権限拒否を区別し、失敗から再試行できること。操作結果を視界内にテキストで示す。並べ替えは対象、前後の位置、上下端を明示し、ドラッグを必須にしない。重複タップで二重保存・予約しない。                                                                            |
| M07 | 支援技術・モーション       | VoiceOver／TalkBackで名前・役割・状態・順序・動的更新が分かること。Webはキーボードだけで操作でき、フォーカスが見え、固定UIに隠れないこと。操作結果をアニメーションだけに依存させず、OSのモーション軽減設定を尊重する。                                                                  |
| M08 | アプリ状態・オフライン     | 初回、再起動、バックグラウンド復帰、画面の再訪、通信なしを設計に含める。時刻表示や朝プランを古い状態のまま再開しない。リスナー・タイマーは不要になったら解除する。失敗時に保存済みデータを消さない。                                                                                    |
| M09 | データ・日時・境界         | SQLiteを永続データの正本とし、UIからSQLを呼ばない。適用済みmigrationは編集せず、更新・再実行・既存データ保持を検証する。外部入力は境界で検証し、Domainの制約はDomainでも守る。Planning Engineの時刻は引数で受け取り、日付跨ぎ・タイムゾーン変更・DSTを扱う。                            |
| M10 | 権限・通知・プライバシー   | 必要な時点で理由を示して最小限の権限を求め、拒否後も可能な操作は続けられること。OS通知を時計アプリ相当のアラームとは扱わない。権限・消音・集中モード/省電力・起動状態を分けて確認する。秘密情報、端末内の個人データ、実ユーザー情報をログやスクリーンショット、fixture、Gitに入れない。 |
| M11 | 性能・依存・品質           | 重い処理を操作と描画経路から外し、秒更新などは必要な範囲に閉じる。長い一覧は実測で遅ければ仮想化を検討する。依存追加前に必要性、SDK互換、保守、ライセンス、ネイティブ設定を確認し、主要な判断はADRに残す。CIの失敗をskipで回避しない。                                                  |
| M12 | ビルド・配布               | Expo SDKの版を先に確認し、対応する公式手順を使う。Expo Go、Development Build、リリース相当の結果を別扱いにする。配布前に署名、対象OS、ストア要件、権限説明、プライバシー申告、既知advisoryを最新の公式資料で再確認する。課金・署名作成・公開などは既存の承認ルールに従う。              |

### M01: セーフエリアの実装ルール

1. **OSのステータスバーとアプリのヘッダーは別物。** OS用の余白はinset、アプリ内の余白はDesign Tokenで扱う。`paddingTop: 44`、端末名での分岐、`StatusBar.currentHeight`だけの補正、ステータスバーを隠す対処は採用しない。
2. **各辺の担当を一つに決める。** ヘッダーを隠した通常画面は原則`ScreenContainer`に任せる。標準ヘッダー・タブが補正する画面では、自前の補正を足す前に、その辺をどちらが担当するか確認する。二重の余白も不具合として扱う。
3. **別ウィンドウと重ね表示は別に確認する。** `Modal`、全画面シート、固定フッター、絶対配置のタイトルなどは、表示されるコンテナでinsetが取得できるか検証する。必要な場合のみモーダル側で`SafeAreaProvider`を設置する。背景装飾は端まで延ばしてよいが、重要情報と操作は安全領域内に置く。スクロール末尾、開閉直後、キーボード表示中にも重ねない。
4. **OS差を確認する。** Android 15以降でtarget SDK 35以上のアプリはedge-to-edgeを前提にする。下部はジェスチャー／3ボタン両方を確認し、キーボードはシステムバーとは別の制約として扱う。Expo Router SDK 58のWebではSafe Area Contextの値がゼロのため、必要ならCSSの`env(safe-area-inset-*)`を使う。ブラウザーを狭くするだけでは実機のinset検証にならない。

現状の確認メモ: `src/app/_layout.tsx`は標準ヘッダーを非表示にし、通常画面の`ScreenContainer`と並べ替えの`ReorderPanel`には`SafeAreaView`がある。これはソース調査の結果で、端末での重なりがないことの証明ではない。報告された重なりは、画面名と開き方、端末・OS、スクロール／モーダル／キーボードの状態を記録し、通常画面とモーダルを分けて再現する。原因確定前に全画面へ一律パディングを追加しない。

## 2. 毎回の実行手順と合格条件

1. **実装前:** 対象画面/機能、利用者が完了したい操作、影響するM番号、失敗時の復帰方法、対象OS・ビルドをPRに記入する。表示の変更なら、ヘッダー、フッター、キーボード、スクロールをどこが管理するか決める。
2. **実装と自動検証:** 小さく実装し、`npm run format:check`、`npm run lint`、`npm run typecheck`、`npm test`を実行する。DB変更では`npm run migration:check`と`npm run test:sqlite`、SDK・依存・ネイティブ設定変更では`npx expo-doctor`と対象プラットフォームのビルド検証を追加する。バグは再現手順を先に残し、自動化できる部分は回帰テストにする。
3. **UIの観測:** Webに影響する変更では320×568と390×844などで補助確認する。ネイティブUI変更は、小型iPhone（ノッチ等あり）とedge-to-edgeのAndroidを優先し、通常文字・拡大文字、明暗、スクロール先頭/末尾を確認する。モーダル、キーボード、ジェスチャー/3ボタン、VoiceOver/TalkBack、復帰や通知は変更に応じて追加する。端末回転・大画面は製品がサポートする場合に検証する。
4. **判定と反復:** PRに各ケースの端末/OS、ビルド種別、画面/状態、期待値、実測、証跡を記入し、`成功 / 失敗 / 未実施 / 対象外`を区別する。重なり・操作不能・入力消失・誤案内・CI失敗は修正して再検証する。必須の実機検証が未実施ならリリース合格にしない。修正と再確認を小さく回し、未解決項目は次の作業として残す。

## 3. 参照資料

- Apple: [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)、[Safe areaの位置決め](https://developer.apple.com/documentation/uikit/positioning-content-relative-to-the-safe-area)、[HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)、[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)。44×44 ptはAppleの標準的な推奨サイズで、朝ナビの採用値とは区別する。
- Android: [Edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)、[アクセシビリティ](https://developer.android.com/guide/topics/ui/accessibility/apps)、[Core app quality](https://developer.android.com/docs/quality-guidelines/core-app-quality)。
- Expo / React Native: [SDK 58 Safe Area Context](https://docs.expo.dev/versions/v58.0.0/sdk/safe-area-context/)、[Webを含むSafe Area](https://docs.expo.dev/develop/user-interface/safe-areas/)、[SDK 58 Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)、[Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)、[React Native Accessibility](https://reactnative.dev/docs/accessibility)、[Performance](https://reactnative.dev/docs/performance)。
- W3C: [WCAG 2.2](https://www.w3.org/TR/WCAG22/)（コントラスト、フォーカス、リフロー、ドラッグの代替、状態通知など）。
- 事例集: [UI Pocket モバイル](https://www.ui-pocket.com/mobile)。画面パターンの参考。OS仕様・アクセシビリティ基準は公式資料を優先する。
