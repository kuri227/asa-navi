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

## 2026-10-06 — Phase 1-B-7: completed task replan

### 実装内容

- completedTaskIdsを残りtaskの必要時間、最適化、予定時刻から除外。
- `replan` APIを追加し、現在時刻から計画を再構築。
- 基本計画の推奨起床は元のroutine全体を基準に維持。
- TC-P05、全task完了、非mutationをtest。

### 主なcommit

- この記録を含むreplan commit。hashはGit logを正本とする。

### テスト結果

- `npm run format`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- replan tests: 4/4 pass

### 発生した問題

- なし。

### 解決方法

- 追加対応なし。

### 次のPhase

- Phase 1-B-8: weekday / date override resolverを実装する。

## 2026-10-06 — Phase 1-B-6: late calculation / status

### 実装内容

- 現在時刻、利用可能時間、最適化後taskから予想出発・到着を算出。
- slack 10分以上をcomfortable、0〜9分をtight、超過をlateとして判定。
- late adjustmentとtaskの予定開始・終了時刻を生成。
- TC-P01、TC-P04、exactly 0、event開始済み、秒境界をtest。

### 主なcommit

- この記録を含むstatus calculation commit。hashはGit logを正本とする。

### テスト結果

- `npm run format`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- plan status tests: 5/5 pass

### 発生した問題

- 仕様は分単位だが、端末の現在時刻には秒が含まれる。

### 解決方法

- 利用可能時間は切り捨て、遅刻時間は切り上げる安全側の丸め規則をarchitectureへ明記した。

### 次のPhase

- Phase 1-B-7: completed taskを除外するreplanを実装する。

## 2026-10-06 — Phase 1-B-5: optional task skipping

### 実装内容

- 短縮後に残るdeficitへoptional task省略を適用。
- skipPriority、sortOrder、IDの順で決定的に省略。
- required taskを省略候補から除外。
- TC-P03、requiredのみ、optional 0件、exactly 0 deficitをtest。

### 主なcommit

- この記録を含むoptional skip commit。hashはGit logを正本とする。

### テスト結果

- `npm run format`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- optimization tests: 4/4 pass

### 発生した問題

- なし。

### 解決方法

- 追加対応なし。

### 次のPhase

- Phase 1-B-6: late calculationとstatusを実装する。

## 2026-10-06 — Phase 1-B-4: task compression

### 実装内容

- deficitに応じてtaskをminimumDurationまで段階的に短縮。
- compressionPriority、sortOrder、IDの順で決定的に処理。
- 結果のtask表示順はsortOrder、IDで維持。
- disabled task除外、minimum同値、回収不足、TC-P02をtest。

### 主なcommit

- この記録を含むcompression commit。hashはGit logを正本とする。

### テスト結果

- `npm run format`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- compression tests: 5/5 pass

### 発生した問題

- なし。

### 解決方法

- 追加対応なし。

### 次のPhase

- Phase 1-B-5: optional task skippingを実装する。

## 2026-10-06 — Phase 1-B-3: recommended wake / base plan

### 実装内容

- enabled taskの通常時間を合計し、disabled taskを除外。
- 最終出発時刻から推奨起床時刻を逆算する基本計画を追加。
- TC-P01、task 0件、route 0分、決定性、非mutationをtest。

### 主なcommit

- この記録を含むbase plan commit。hashはGit logを正本とする。

### テスト結果

- `npm run format`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- base plan tests: 4/4 pass

### 発生した問題

- なし。

### 解決方法

- 追加対応なし。

### 次のPhase

- Phase 1-B-4: task compressionを実装する。

## 2026-10-06 — Phase 1-B-2: route duration / latest departure

### 実装内容

- 複数route segmentの所要時間を合計する純粋関数を追加。
- 予定開始、到着余裕、通学時間から最終出発時刻を算出。
- 空route、0分区間、日付跨ぎ、入力mutationなし、Date範囲外をtest。
- durationと合計値をsafe integerに制限。

### 主なcommit

- この記録を含むdeparture calculation commit。hashはGit logを正本とする。

### テスト結果

- `npm run format:check`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- departure tests: 7/7 pass

### 発生した問題

- 最初のDate上限test値がJavaScript Dateの有効範囲内だった。

### 解決方法

- 実際のDate上限を超えるsafe integerへ境界値を修正し、範囲外結果がDomainErrorになることを再検証した。

### 次のPhase

- Phase 1-B-3: recommended wake timeとbase planを実装する。

## 2026-10-06 — Phase 1-B-1: Planning domain typesとinvariant

### 実装内容

- PlanningInput、task、route、result、adjustment等のreadonly Domain型を追加。
- 負数・非整数duration、不正日時、重複ID、不正priority、最短時間超過をDomainErrorとして検出。
- route 0件、duration 0、minimumとnormalの同値を有効として維持。
- validationの境界値unit testを追加。

### 主なcommit

- この記録を含むdomain types commit。hashはGit logを正本とする。

### テスト結果

- `npm run lint`: pass
- `npm run typecheck`: pass
- Planning input tests: 5/5 pass

### 発生した問題

- なし。

### 解決方法

- 追加対応なし。

### 次のPhase

- Phase 1-B-2: route durationとlatest departureを実装する。

## 2026-10-06 — Phase 1-A-6: 初学者向けREADME

### 実装内容

- プロダクト目的、MVP機能、技術構成、directory、必要環境を説明。
- npmでのsetup、Android / iOS、Expo Go / Development Build、品質commandを手順化。
- DB、architecture、Planning Engine、Git運用、security、roadmap、troubleshootingを整理。
- 実装済みと未実装を分け、sample UIを製品機能として扱わないことを明記。

### 主なcommit

- この記録を含むREADME commit。hashはGit logを正本とする。

### テスト結果

- `npm run format:check`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: 1 suite / 1 test pass
- `npx expo-doctor`: 21/21 pass
- Android export bundle: pass
- Markdown link / command review: pass

### 発生した問題

- WindowsではiOS Simulatorを実行できない。

### 解決方法

- iPhoneのExpo Go、macOS、EAS Development Buildの選択肢と制約を明記した。

### 次のPhase

- Phase 1-A完了確認後、Phase 1-B-1: Planning EngineのDomain typesとvalidation方針。

## 2026-10-06 — Phase 1-A-5: GitHub Actions

### 実装内容

- Pull Request、main push、手動実行に対応するQuality workflowを追加。
- Node.js 22.17.1とnpm cacheを使用し、localと同じformat、lint、typecheck、test、expo-doctorを実行。
- 新規critical advisoryをCIで拒否し、既知の未修正highはdependency security文書で追跡。
- workflow権限をrepository contentのreadだけに制限。

### 主なcommit

- この記録を含むCI commit。hashはGit logを正本とする。

### テスト結果

- local quality gate: pass
- workflow syntax: Prettier parse / static review pass
- critical audit gate: pass（0 critical）
- GitHub Actions run: Pull Request作成後に確認

### 発生した問題

- 既知のhigh advisoryには上流修正版がないため、`npm audit`を全severityでblockingにすると全CIが恒常的に失敗する。

### 解決方法

- criticalをblockingにし、highは到達可能性と更新条件を明記してPhaseごとに追跡する。

### 次のPhase

- Phase 1-A-6: 初学者向けREADME初版を整備する。

## 2026-10-06 — Phase 1-A-4: Jest / React Native Testing Library

### 実装内容

- Expo SDK 57公式手順に沿ってJest 29、`jest-expo`、Jest型定義、React Native Testing Libraryを追加。
- CIでも終了する`npm test`と、local開発用`npm run test:watch`を追加。
- `jest-expo` presetとJest型定義を設定。
- path aliasを通して共有componentをrenderするsmoke testを追加。

### 主なcommit

- この記録を含むtest foundation commit。hashはGit logを正本とする。

### テスト結果

- `npm run format:check`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: 1 suite / 1 test pass
- `npx expo-doctor`: 21/21 pass

### 発生した問題

- test tooling追加後の全依存監査は、Jest 29のtransitive dependencyにより件数が増加した。
- React Native Testing Library 14.0.1が取得する最新`test-renderer` 1.3.0はReact 19.3を要求し、SDK 57のReact 19.2.3とpeer warningになった。

### 解決方法

- Expo SDK 57と互換性のないJest 30へ単独upgradeせず、本番依存と開発toolingを分けて監査・記録する。
- RNTLが許容する1.xのうちReact 19.2に対応する`test-renderer` 1.2.0をoverrideし、`npm ci`とtestで検証した。

### 次のPhase

- Phase 1-A-5: GitHub Actionsで同じ品質ゲートを実行する。

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
