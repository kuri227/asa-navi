# ADR-0005: Expo Go実機確認のためSDK 58へ更新する

- 日付: 2026-11-15
- 状態: 採用

## 問題と制約

iPhoneがPCの開発サーバーへ到達した後、Expo GoがSDK 58専用のためSDK 57のプロジェクトを拒否した。iPhone実機には旧版Expo Goをインストールできず、WindowsにはiOS Simulatorがない。

## 選択肢と判断

- SDK 58正式版へ更新する: 現行のExpo Goで実機の起動確認ができる。既存Node 22.17.1は公式の要件内。Expo CLIでReact Native、React、Expo各モジュールの互換バージョンを揃える。
- SDK 57でDevelopment Buildを作る: SDKを固定できるが、iPhone向けbuildには署名と配布が必要。通知の最終検証では引き続き候補だが、今回の起動確認には不要。
- Webプレビューで確認する: 画面とSQLiteの補助確認はできるが、iOSの実機検証にはならない。

SDK 58への更新を採用する。Expo Goは起動と基本操作の確認に使用し、専用buildの通知挙動の合否には使わない。

## 影響と確認

- Planning Engineのルール、SQLite schema、ユーザー設定とデータ削除の挙動は変更しない。
- Androidの`compileSdkVersion`は公式構成で37へ変わるが、公式の最低サポートOSと`targetSdkVersion`はSDK 57と同じ。今回はネイティブbuild・署名・ストア提出を実行しない。
- 再現可能なnpm install、型・lint、回帰テスト、Expo Doctor、iOSバンドルを確認する。実機の起動・通知・保存の挙動は別途確認する。

## 参照資料

- [Expo SDK 58の変更点](https://expo.dev/changelog/sdk-58)
- [SDK 58の環境要件](https://docs.expo.dev/versions/v58.0.0/)
- [公式SDKアップグレード手順](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
