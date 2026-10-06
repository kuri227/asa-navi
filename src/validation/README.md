# Validation

UI、SQLite、外部入力との境界で使用するschemaと変換処理を置く。

負数、空文字、不正enum、不正日時等をここで拒否する。一方、`minimumDurationMin <= normalDurationMin`等の朝ナビ固有の整合性はDomainでも保証する。
