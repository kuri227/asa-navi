# ADR-0003: SQLiteを使うWeb検証経路

日付: 2026-10-12
状態: 採用（開発検証用。Android / iOSのMVP要件は変更しない）

## 問題と理由

Web画面検証でwasm解決失敗を再現した。wasm設定後もstatic prerenderでworker chunkの解決が失敗した。さらにSDK 57の開発サーバーではMetroのenhanceMiddlewareとRouter headersを指定してもHTML応答にCOEP / COOPが付かず、SQLite初期化が失敗した。SQLiteのwithExclusiveTransactionAsyncはWeb非対応である。

## 選択肢

- Web検証を取り止め、すべてを実機に委ねる。
- 通常トランザクションを共有接続で使う。無関係なクエリが同じtransactionへ入るため採用しない。
- SPA exportを必要ヘッダー付きでローカル配信し、Webのtransactionだけ専用接続で実行する。

## 決定と影響

3番目を採用。web.outputはsingle、Metroはwasm対応、Router headersは公式設定を保持する。npm run web:export後、npm run web:previewで127.0.0.1:8090に配信する。previewはlocalhost限定で、公開用サーバーではない。npm run webのHTML応答には必要ヘッダーが付かなかったため、この環境ではexport previewを検証経路とする。

Web専用adapterはuseNewConnectionで開いた接続内のwithTransactionAsyncを使い、foreign_keysを有効にし、成功・失敗いずれでもcloseする。通常接続はtransaction内へ渡さない。Android / iOSは従来の排他transactionのまま。DB schema、migration、Domain、UseCase、依存packageは変更しない。

SQLite Webはalphaであり、複数タブ同時書込み、通知、OS固有機能の評価には使わない。Webの確認結果をAndroid / iOS実機の合格とは扱わない。

## 検証と根拠

- 専用接続・constraint有効化・失敗伝播・closeをunit test。
- Chromeで初回設定、保存、翌朝計画、reload後の復元を確認。
- 320×568と通常ブラウザ画面でホーム表示・主要操作を確認。
- [SDK 57 SQLite公式資料](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo Web output公式資料](https://docs.expo.dev/guides/publishing-websites/)

実装判断: Codex（既存の開発検証・不具合修正の依頼範囲）。
