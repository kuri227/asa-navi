import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { NotificationError } from "@/application/errors/notification-error";
import type { AlarmPermissionState } from "@/application/ports/notifications";
import { AppButton, FormSection, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { radius, spacing, typography } from "@/theme";

type Props = Readonly<{
  onRequestPermission: () => Promise<AlarmPermissionState>;
  onComplete: () => Promise<void>;
  onCompleted: () => void;
}>;

export function NotificationSetupScreen({
  onRequestPermission,
  onComplete,
  onCompleted,
}: Props) {
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  const complete = async (): Promise<boolean> => {
    try {
      await onComplete();
      onCompleted();
      return true;
    } catch {
      setMessage("初期設定を完了できませんでした。もう一度お試しください。");
      return false;
    }
  };

  const handleAllow = async () => {
    setSaving(true);
    setMessage(undefined);
    try {
      const permission = await onRequestPermission();
      if (permission === "granted") {
        await complete();
        return;
      }
      setMessage(
        "通知は許可されませんでした。設定は完了できますが、起床通知は届きません。",
      );
    } catch (error) {
      setMessage(
        error instanceof NotificationError
          ? error.message
          : "通知権限を設定できませんでした。もう一度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    setMessage(undefined);
    try {
      await complete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      footer={
        <View style={styles.actions}>
          <AppButton
            label="通知を許可して完了"
            loading={saving}
            onPress={() => void handleAllow()}
          />
          <AppButton
            disabled={saving}
            label="今は許可せず完了"
            onPress={() => void handleSkip()}
            variant="ghost"
          />
        </View>
      }
    >
      <FormSection
        description="OSの確認画面は、下のボタンを押した後に一度だけ表示されます。"
        title="朝の通知を受け取りますか？"
      />
      <View style={[styles.notice, { backgroundColor: theme.surface }]}>
        <Text
          maxFontSizeMultiplier={1.6}
          style={[styles.noticeTitle, { color: theme.text }]}
        >
          通知を使う理由
        </Text>
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.noticeBody, { color: theme.textSecondary }]}
        >
          推奨起床時刻になったら、朝の予定を始められるよう端末へお知らせします。
        </Text>
      </View>
      <View
        style={[styles.caution, { backgroundColor: theme.warningContainer }]}
      >
        <Text
          maxFontSizeMultiplier={1.8}
          style={[styles.cautionText, { color: theme.warning }]}
        >
          通常の通知は、端末の消音・集中モード・省電力設定などにより表示や音が遅れる場合があります。標準時計と同等の保証はありません。
        </Text>
      </View>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          maxFontSizeMultiplier={1.8}
          style={[styles.message, { color: theme.error }]}
        >
          {message}
        </Text>
      ) : null}
      <Text
        maxFontSizeMultiplier={1.8}
        style={[styles.footnote, { color: theme.textSecondary }]}
      >
        許可しなくても設定内容は保存され、アプリを使えます。通知設定は端末の設定から後で変更できます。
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  notice: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  noticeTitle: { ...typography.bodyStrong },
  noticeBody: { ...typography.body },
  caution: { borderRadius: radius.card, padding: spacing.xl },
  cautionText: { ...typography.bodyStrong },
  message: { ...typography.bodyStrong },
  footnote: { ...typography.body },
});
