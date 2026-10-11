# ADR-0004: Development Buildの検証準備

日付: 2026-10-12
状態: 採用（ローカル設定のみ。クラウドbuild・ストア公開は行わない）

## 目的と理由

仕様が通知段階で要求するDevelopment Buildを作れる構成にする。Expo Goには自分のappのnative設定・署名を反映できないため、製品の通知結果は専用buildで確定する。

Expo公式のexpo-dev-clientをexpo installでSDK 57互換versionに解決し、eas.jsonにinternal Android APK、iOS実機、iOS simulatorのdevelopment profileを用意する。ネイティブコードを独自追加せず、CNGに従いios / androidを手編集しない。

## 依存評価

- maintenance: Expo公式monorepo、SDK 57 versioned docsで提供。
- Expo / React Native互換性: expo install、expo-doctorで確認。
- native依存: 開発用launcher / menu。Planning Engine / Repository / UseCaseからimportしない。
- 削除容易性: app logicが直接importしないため依存とbuild profileを除去可能。
- license: Expo packageのMIT。
- 代替: expo-dev-clientなしのdebug build、またはExpo Go。Goは初期UI / local notification確認、専用buildは最終通知検証へ使い分ける。
- 新しいanalytics / 外部API / 本格alarm moduleは追加しない。

## 費用・認証・影響

ローカルAndroid buildはAndroid SDKが必要だがExpoアカウントは不要。WindowsではローカルiOS buildは不可。EASでiPhoneへ配布する場合はExpoアカウント・Apple署名環境が必要で、paid Apple Developer membershipやEASの利用枠を確認してから実行する。今回は認証、cloud project作成、署名情報生成、build依頼、支払いを実行しない。

ユーザーが用意できるiPhoneには、まず同じWi-FiとExpo Goで接続する。USBは不要。最終Development Build試験とは区別する。identifierはbuild初回時に確認するため、このADRでは製品のbundle IDを確定しない。

## 公式資料

- [SDK 57 DevClient](https://docs.expo.dev/versions/v57.0.0/sdk/dev-client/)
- [Development Build](https://docs.expo.dev/develop/development-builds/introduction/)
- [eas.json](https://docs.expo.dev/build/eas-json/)
