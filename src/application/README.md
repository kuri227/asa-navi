# Application

画面操作をUseCaseとして組み立てる層。Domainを呼び出し、Repository、Clock、AlarmService等のinterfaceを通して外部処理を調整する。

予定しているdirectory:

- `usecases/`: 1つの利用目的を実行する処理
- `ports/`: Repository、Clock、AlarmServiceのinterface
- `errors/`: UIが回復方法を判断できるapplication error

ExpoやSQLiteの具体実装はこの層へ置かない。
