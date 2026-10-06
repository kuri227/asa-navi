# 朝ナビ 開発ログ

## 2026-10-06 — Phase 0: 調査・計画

### 実装内容

- 空のGitHub repositoryをlocalへclone。
- 仕様書v0.3と画面フローを確認。
- Git、Node.js、npm、Expo関連の現状を調査。
- 実装計画、アーキテクチャ、テスト計画、モバイル技術メモを作成。

### 主なcommit

- この記録を含む初回計画commit。hashはcommit後に確定するため、Git logを正本とする。

### テスト結果

- application code未作成のためformat / lint / typecheck / unit testは対象外。
- Markdown内の必須見出し、相対link、Git diff whitespaceを静的確認する。

### 発生した問題

- local workspaceとremoteが空で、既存実装はなかった。
- Codexの制限環境からユーザー領域のnpmを読むと失敗した。

### 解決方法

- 指定remoteをcloneし、`main`から初回履歴を開始する。
- ホスト環境ではnpm 11.6.2が正常であることを許可付き実行で確認。今後のnpm操作も必要な実行権限で行う。

### 次のPhase

- Phase 1-A-1: Expo + Router + TypeScriptプロジェクト初期化。

## 2026-10-06 — 開発指示書v1.1反映

### 実装内容

- `docs/DEVELOPMENT_GUIDE.md`として追加指示を永続化。
- expo-doctor、主要依存ADR、validation責務分離、Schedule Resolver、日時境界testを既存計画へ反映。

### 主なcommit

- この記録を含む文書commit。hashはGit logを正本とする。

### テスト結果

- Markdown差分、必須語句、Git whitespaceを確認する。

### 発生した問題

- 既存計画には主要依存のADR条件とexpo-doctor完了ゲートが明記されていなかった。

### 解決方法

- v1.1を開発運用の参照文書として追加し、計画・設計・テスト文書へ差分を統合した。

### 次のPhase

- Phase 1-A-1: Expo + Router + TypeScriptプロジェクト初期化。
