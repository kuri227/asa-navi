import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

const CHECKLIST_ITEMS = ["財布", "スマートフォン", "定期券", "学生証", "PC"];

type Props = Readonly<{
  departureTimeText: string;
  firstEventTitle: string;
  onDepart: () => void;
}>;

export function DepartureChecklist({
  departureTimeText,
  firstEventTitle,
  onDepart,
}: Props) {
  const theme = useTheme();
  const [checkedItems, setCheckedItems] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const toggleItem = (item: string) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.departureCard,
          { backgroundColor: theme.successContainer },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.success }]}
        >
          出発の時間です！
        </Text>
        <Text style={[styles.departureTime, { color: theme.text }]}>
          {departureTimeText}を目安に出発しましょう
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          最初の予定: {firstEventTitle}
        </Text>
      </View>

      <View style={styles.checklist}>
        <Text style={[styles.title, { color: theme.text }]}>
          持ち物チェック
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          必要なものだけ確認してください。すべての選択は必須ではありません。
        </Text>
        {CHECKLIST_ITEMS.map((item) => {
          const checked = checkedItems.has(item);
          return (
            <Pressable
              key={item}
              accessibilityLabel={item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => toggleItem(item)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: pressed
                    ? theme.surfaceSelected
                    : theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: checked ? theme.primary : "transparent",
                    borderColor: checked ? theme.primary : theme.borderStrong,
                  },
                ]}
              >
                <Text style={[styles.checkmark, { color: theme.onPrimary }]}>
                  {checked ? "✓" : ""}
                </Text>
              </View>
              <Text style={[styles.bodyStrong, { color: theme.text }]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <AppButton label="いってきます！" onPress={onDepart} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  departureCard: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  checklist: { gap: spacing.sm },
  item: {
    minHeight: layout.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: radius.compact,
  },
  checkmark: { ...typography.bodyStrong },
  title: { ...typography.title },
  departureTime: { ...typography.heading },
  body: { ...typography.body },
  bodyStrong: { ...typography.bodyStrong },
});
