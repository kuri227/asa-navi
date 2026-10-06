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

## 2026-10-06 — Phase 1-A-3: ESLint / Prettier

### 実装内容

- Prettierをdevelopment dependencyとして追加。
- `npm run format`と`npm run format:check`を追加。
- dependency lockfileと生成物をformat対象から除外。
- repository内のsource、設定、Markdownを統一formatへ整形。

### 主なcommit

- この記録を含むformat tooling commit。hashはGit logを正本とする。

### テスト結果

- `npm run format:check`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npx expo-doctor`: 21/21 pass

### 発生した問題

- なし。

### 解決方法

- 追加対応なし。

### 次のPhase

- Phase 1-A-4: jest-expo / React Native Testing Libraryとsmoke testを設定する。

## 2026-10-06 — Phase 1-A-2: TypeScriptとlayer directory

### 実装内容

- Expo templateの`strict: true`と`@/*` path aliasが有効であることを確認。
- `npm run typecheck`を追加し、localとCIで同じcommandを利用可能にした。
- Domain、Application、Infrastructure、Features、Stores、Theme、Validationの基本directoryと責務を文書化。

### 主なcommit

- この記録を含むarchitecture foundation commit。hashはGit logを正本とする。

### テスト結果

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npx expo-doctor`: 21/21 pass

### 発生した問題

- Gitは空directoryを管理しないため、`.gitkeep`だけでは初学者が各層の責務を判断できない。

### 解決方法

- 各基本directoryに短いREADMEを置き、依存方向と将来配置するmoduleを明示した。

### 次のPhase

- Phase 1-A-3: ESLint / Prettier / format checkを設定する。

## 2026-10-06 — Phase 1-A-1補足: dependency audit hardening

### 実装内容

- local / globalのNode.js、npm、package構成を確認。
- `npm audit`の各依存経路と修正版の有無を調査。
- 互換性を検証した`decode-uri-component` 0.5.0と`uuid` 11.1.1をnpm `overrides`へ追加。
- 残存advisoryの到達可能性、軽減策、再確認条件を`DEPENDENCY_SECURITY.md`へ記録。

### 主なcommit

- この記録を含むdependency hardening commit。hashはGit logを正本とする。

### テスト結果

- `npm ci`: pass
- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npx expo-doctor`: 21/21 pass
- `npx expo export --platform web --output-dir dist`: pass
- `xcode`経由の`uuid.v4()`互換確認: pass
- `npm audit`: 11 moderateを解消、修正版未公開の2 advisoryに由来する19 highが残存

### 発生した問題

- `braces`と`node-forge`の最新公開versionがadvisory対象で、互換な修正版が存在しない。
- npmの自動修正候補はExpo 44 / React Native 0.72への非互換downgradeを含む。

### 解決方法

- 修正可能な依存だけをoverrideし、bundleとtoolingの互換性を検証した。
- `npm audit fix --force`は採用せず、残存リスクを追跡対象として明文化した。

### 次のPhase

- Phase 1-A-2: strict TypeScript、path alias、基本directoryをarchitectureへ合わせる。

## 2026-10-06 — Phase 1-A-1: Expoプロジェクト初期化

### 実装内容

- `feat/project-foundation` branchを作成。
- `create-expo-app` 5.0.0のdefault templateでExpo SDK 57プロジェクトを初期化。
- app name、slug、schemeを朝ナビ用に設定。
- Expo Router、TypeScript strict、公式ESLint設定を導入。
- CSS / CSS Modulesの型宣言を追加。
- React 19 lintに合わせ、Web hydration判定を`useSyncExternalStore`で実装。
- Expo templateのMIT noticeを第三者通知として保存。

### 主なcommit

- この記録を含むfoundation commit。hashはGit logを正本とする。

### テスト結果

- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npx expo-doctor`: 21/21 pass
- `npx expo export --platform web --output-dir dist`: pass

### 発生した問題

- 公式default templateのCSS importにTypeScript宣言がなく、typecheckが失敗した。
- Web hydration hookがReact 19の`react-hooks/set-state-in-effect`に抵触した。
- `npm audit`は11 moderate / 19 highを報告した。すべて公式Expo / React Native toolchainのtransitive dependencyで、自動修正案はSDK互換性を破壊するdowngrade / upgradeだった。

### 解決方法

- CSS / CSS Modulesへ型宣言を追加。
- hydration検知をeffect内の同期state更新から`useSyncExternalStore`へ置換。
- `npm audit fix --force`は実行せず、ADR-0001にリスクと追跡方針を記録。

### 次のPhase

- Phase 1-A-2: strict TypeScript、path alias、基本directoryを朝ナビのarchitectureへ合わせる。

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
