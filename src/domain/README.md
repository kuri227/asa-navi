# Domain

朝ナビ固有のルールとPlanning Engineを置く。React、React Native、Expo、SQLite、Repository、端末APIには依存しない。

予定計算は呼び出し側から絶対日時と`now`を受け取り、同じ入力には同じ結果を返す純粋TypeScriptとして実装する。

予定しているmodule:

- `planning/`: 起床・出発時刻、短縮、省略、遅刻判定、再計画
- `route/`: 複数通学区間と所要時間
- `schedule/`: 解決済み予定と例外日のdomain model
