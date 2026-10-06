# 依存関係セキュリティ

更新日: 2026-10-06

## 方針

`npm audit`の件数だけで互換性を壊す自動更新は行わない。advisory、依存経路、朝ナビからの到達可能性、Expo SDKとの互換性を確認し、次の順で対処する。

1. Expo SDK 57互換の修正版へ更新する。
2. transitive dependencyに互換な修正版がある場合は、検証付きのnpm `overrides`を使用する。
3. 修正版がない場合は到達可能性と軽減策を記録し、上流releaseを追跡する。
4. `npm audit fix --force`がSDKやReact Nativeを非互換versionへ変更する場合は実行しない。

## 2026-10-06の対応

初回監査は11 moderate / 19 highだった。次のoverrideを適用し、11 moderateを解消した。

| Package                | Before | Override | 検証                                 |
| ---------------------- | ------ | -------- | ------------------------------------ |
| `decode-uri-component` | 0.2.2  | 0.5.0    | Expo Routerを含むWeb bundle成功      |
| `uuid`                 | 7.0.3  | 11.1.1   | `xcode`の読込と`uuid.v4()`呼出し成功 |

React Native Testing Library 14.0.1が許容する`test-renderer` 1.xのうち、最新1.3.0はReact 19.3を要求する。Expo SDK 57はReact 19.2.3であるため、peer dependencyを満たす`test-renderer` 1.2.0へoverrideし、testとクリーンインストールで検証する。

test環境導入前の適用結果は0 moderate / 19 highだった。これは`expo`が開発CLIをproduction dependencyとして内包するためであり、19個の独立したruntime脆弱性がアプリbundleに含まれるという意味ではない。

## Test tooling追加後の監査

Expo SDK 57公式の互換構成であるJest 29、`jest-expo`、React Native Testing Libraryを追加した後、2026-10-06時点の監査結果は次のとおり。

| 対象                             | moderate | high | 備考                                                       |
| -------------------------------- | -------: | ---: | ---------------------------------------------------------- |
| 全依存                           |        5 |   51 | `expo-notifications`追加後。Jest開発toolingを含む          |
| `--omit=dev --package-lock-only` |        5 |   46 | Expo / React Nativeがtest・build toolingを通常依存にも含む |

追加で確認された根本advisoryは`sprintf-js`のGHSA-hp3w-g68c-fv3cで、Jestのcoverage instrumentationから到達する。朝ナビのapplication runtimeやユーザー入力処理からは使用していない。2026-10-06時点では修正版がなく、npmの修正候補はExpo SDK 57公式構成のJest 29からJest 30へのmajor upgradeである。

`npm audit fix --dry-run`も実行したが、非breakingな修正候補はなかった。件数の増加は主に3件の根本advisory（`braces`、`node-forge`、`sprintf-js`）が依存元packageへ伝播したmeta vulnerabilityである。Jest 30やExpo 44を混在させず、Expo SDK互換releaseでまとめて更新する。

Phase 1-D-7で`expo-notifications ~57.0.21`を公式の`npx expo install`から追加した後も再監査した。表示件数は全依存56件、production lockfile 51件へ変化したが、根本advisoryは同じ3件であり、新しい根本脆弱性は確認されなかった。`npm audit fix --force`の提案はJest 30またはExpo 44への非互換変更を含むため適用していない。

## 残存advisory

### braces — GHSA-vfj7-8cjw-p6xm

- 影響version: `<=3.0.3`
- 状態: 2026-10-06時点で修正版なし
- 経路: Expo / Metro file map → `micromatch` → `braces`
- 内容: 深くnestしたbrace patternによるstack exhaustion
- 到達可能性の評価: 現在の朝ナビはユーザー入力をglob patternとしてMetroへ渡さない。したがって、現構成での主な対象は開発・CI時のfile matchingであり、モバイル利用者から直接到達する経路は確認されていない。
- 軽減策: CIで信頼できないrepository内容をbuildしない。修正版またはExpo SDK互換更新が公開されたら優先して適用する。

### node-forge — GHSA-86w9-cpqp-85rv

- 影響version: `<=1.4.0`
- 状態: 2026-10-06時点で修正版なし
- 経路: Expo CLI / code-signing certificates → `node-forge`
- 内容: 特定の不正なRSA PKCS#1 v1.5署名を受理する可能性
- 到達可能性の評価: 現在の朝ナビのapplication runtimeは`node-forge`をimportせず、Expo CLIの開発・code-signing toolingに存在する。ユーザーコンテンツから直接到達する経路は確認されていない。
- 軽減策: build・signingはExpo公式toolchainと信頼できる証明書だけを使用する。修正版またはExpo SDK互換更新が公開されたら優先して適用する。

### sprintf-js — GHSA-hp3w-g68c-fv3c

- 影響version: `<=1.1.3`
- 状態: 2026-10-06時点で修正版なし
- 経路: Jest coverage tooling → `js-yaml` → `argparse` → `sprintf-js`
- 内容: 無制限のprecision指定によるdenial of service
- 到達可能性の評価: test / coverage設定を読み込む開発toolingの経路であり、モバイルアプリの利用者入力から直接到達する経路は確認されていない。
- 軽減策: test設定とrepository内容を信頼できる変更だけに限定し、Expo SDKが対応するJest更新を追跡する。

上記の到達可能性は現在のdependency graphと実装からの推論であり、脆弱性が存在しないという意味ではない。外部入力、custom build pipeline、code-signing構成を追加した場合は再評価する。

## 定期確認

各Phase完了時とrelease前に次を実行する。

```powershell
npm audit
npm audit --omit=dev
npx expo install --check
npx expo-doctor
```

次の場合はこの文書とlockfileを更新する。

- `braces`または`node-forge`の修正版が公開された。
- Expo SDK 57互換packageが依存を更新した。
- Expo SDKをupgradeした。
- 新しいhigh / critical advisoryが検出された。
- application runtimeやbuild pipelineから新しい到達経路が生じた。

## 参照

- [braces advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [braces issue #70](https://github.com/micromatch/braces/issues/70)
- [node-forge advisory GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
- [sprintf-js advisory GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
- [Expo dependency validation](https://docs.expo.dev/more/expo-cli/#configuring-dependency-validation)
