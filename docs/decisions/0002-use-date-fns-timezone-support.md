# ADR-0002: Schedule Resolverにdate-fns公式timezone supportを使う

- Status: Accepted
- Date: 2026-10-06

## Context

曜日templateの`HH:mm`と対象日、IANA timezoneから、Planning Engineへ渡す絶対日時を生成する必要がある。端末timezone変更やDST地域でもsystem timezoneへ暗黙依存してはいけない。

## Options

1. `Intl.DateTimeFormat`とoffset探索を独自実装する。
2. 旧来の第三者package `date-fns-tz`を使う。
3. date-fns v4と公式`@date-fns/tz`を使う。

## Decision

date-fns 4.4.0と`@date-fns/tz` 1.5.0を採用する。`TZDate`で対象timezoneの暦日時を生成し、通常の`Date`へ変換してDomainへ渡す。

## Dependency review

- Purpose: 曜日・日付・`HH:mm`を明示timezoneの絶対日時へ変換する。
- Standard API limitation: `Date` constructorは実行環境のsystem timezoneへ暗黙依存し、IANA timezoneを指定できない。
- Maintenance: date-fns公式monorepoでfirst-class timezone supportとして保守されている。
- Expo SDK 57 / React Native: JavaScript packageでnative moduleを含まず、Expo SDKとのnative version couplingはない。bundle、test、実機で確認する。
- Removal: Schedule Resolver adapter内へ利用箇所を限定し、Domain APIは標準`Date`のまま保つ。
- License: 両packageともMIT。
- Alternative: 独自offset探索はDSTの曖昧・存在しない時刻で誤りやすい。第三者`date-fns-tz`ではなくv4公式packageを優先する。

## Consequences

- system timezoneと異なる対象timezoneを明示して解決できる。
- DST gap / overlapのlibrary挙動をtestし、UI入力時に曖昧さを扱う必要がある。
- Planning Engine自体はdate-fnsへ依存しない。
