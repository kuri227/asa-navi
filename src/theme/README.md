# Theme

朝ナビの画面で共有するdesign tokenを管理する。画面フローの明るい朝の青を基準にしながら、色は用途を表すsemantic nameで参照する。

- `colors.ts`: light / dark双方のsurface、文字、操作、状態色
- `spacing.ts`: 4px系を基準にした余白
- `typography.ts`: Dynamic Typeへ追従するText role
- `radius.ts`: control、card、compact、pillの形状
- `layout.ts`: 48dp touch target、content幅、navigation inset

画面からraw colorを参照せず`useTheme()`を使う。同じ余白や文字組みを画面内へ再定義せず、意図に合うtokenを選ぶ。固有の一回限りの寸法まで無理にtoken化しない。

共通フォーム部品は`src/components/ui/`に置く。`AppButton`、`TextField`、`FormSection`、`ScreenContainer`を組み合わせ、screen固有の入力値やvalidationはfeature側が担当する。
