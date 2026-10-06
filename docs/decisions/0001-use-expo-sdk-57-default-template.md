# ADR-0001: Expo SDK 57 default templateを開発基盤にする

- Status: Accepted
- Date: 2026-10-06

## Context

朝ナビはReact Native + Expo + TypeScript + Expo Routerを採用する。初期化方法によって、Expo SDKとの依存整合性、初学者の追いやすさ、保守負荷が変わる。

## Constraints

- 2026-10-06時点のlatest stableを使い、canary / betaを使わない。
- Node.js 22.17.1で動作すること。
- Expo RouterとTypeScript strictを含むこと。
- iOS / Android / Webの公式toolchainから外れないこと。
- native directoryはまだ生成せず、Continuous Native Generationを維持すること。

## Options

1. `create-expo-app`のdefault templateを使用する。
2. blank TypeScript templateへExpo Routerを手作業で追加する。
3. React Native Community CLIからExpo modulesを追加する。

## Decision

公式`create-expo-app` 5.0.0のdefault templateを採用し、Expo SDK 57.0.26へ固定する。生成時点の主要versionは次のとおり。

- Expo: 57.0.26
- React Native: 0.86.3
- React: 19.2.3
- Expo Router: 57.0.24
- TypeScript: 6.0.3

default templateはExpo Router、TypeScript、`src/app`構成、platform設定を公式に整合させる。朝ナビ固有の実装へ移るまではsample codeを保持し、後続Sub Phaseで理由と検証を伴って置換する。

## Dependency review

- Purpose: Expo SDK 57上でiOS / Android共通アプリとfile-based routingを構築する。
- Standard alternative: blank templateへの手動追加は可能だが、初期設定の再現性が下がる。
- Maintenance: Expo公式のstable releaseと公式templateを使用する。
- Compatibility: `expo-doctor` 21/21 checks pass。
- Native dependency: default templateのExpo modulesはCNGで管理し、`ios/`と`android/`を手編集しない。
- Removal: sample UI固有packageは製品UIへ置換する時点で使用状況を確認し、別commitで削除可能。
- License: packageごとのOSS licenseに従い、Expo templateのMIT noticeを`THIRD_PARTY_NOTICES.md`へ保存する。

## Security observation

初期化直後の`npm audit`は11 moderate / 19 highを報告した。依存経路と実際のAPI互換性を確認し、修正版が公開されている次のtransitive dependencyをnpm `overrides`で固定した。

- `decode-uri-component`: 0.2.2から0.5.0
- `uuid`: 7.0.3から11.1.1

この変更後、moderate 11件は解消した。`npm ci`、lint、typecheck、`expo-doctor`、Web exportに加え、`xcode` packageから`uuid.v4()`を呼び出す互換確認も成功した。

残る19 highは、2026-10-06時点で修正版が公開されていない`braces`と`node-forge`の2件がExpo CLI、Metro、React Native等の依存関係へ波及して表示されている。npmが提示するExpo 44 / React Native 0.72への変更はSDK 57の互換性を壊すdowngradeであり、修正ではない。したがって`npm audit fix --force`は実行しない。詳細な到達可能性、確認手順、更新条件は`docs/DEPENDENCY_SECURITY.md`で管理する。

## Consequences

- 公式推奨構成から開発を開始できる。
- template由来のsample codeと依存が一時的に残る。
- npm auditを件数だけで自動修正せず、Expo互換性とadvisoryの到達可能性を合わせて判断する必要がある。
- SDK 58への更新は独立した検証可能な変更として扱う。

## User / data impact

初期化のみでユーザーデータは存在せず、既存機能への影響はない。有料サービス、native module、外部APIは追加しない。
