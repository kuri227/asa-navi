import { useState } from "react";
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";
import { layout, radius, spacing, typography } from "@/theme";

import { AppButton } from "./app-button";

type OrderItem = Readonly<{ id: string; label: string }>;

type ReorderPanelProps = Readonly<{
  title: string;
  items: readonly OrderItem[];
  initialItemId: string;
  onMove: (from: number, to: number) => void;
  onClose: () => void;
}>;

export function ReorderPanel({
  title,
  items,
  initialItemId,
  onMove,
  onClose,
}: ReorderPanelProps) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState(initialItemId);
  const [announcement, setAnnouncement] = useState("");
  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const selectedItem = items[selectedIndex];

  const move = (offset: -1 | 1) => {
    const destination = selectedIndex + offset;
    if (!selectedItem || destination < 0 || destination >= items.length) return;

    onMove(selectedIndex, destination);
    const message = `${selectedIndex + 1}番目 → ${destination + 1}番目：「${selectedItem.label}」`;
    setAnnouncement(message);
    if (Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(
        `「${selectedItem.label}」を${selectedIndex + 1}番目から${destination + 1}番目に移動しました`,
      );
    }
  };

  const content = (
    <SafeAreaView
      accessibilityViewIsModal
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            {title}
          </Text>
          <Text style={[styles.caption, { color: theme.textSecondary }]}>
            項目を選び、「上へ」「下へ」で移動します。
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.list} style={styles.scroll}>
          {items.map((item, index) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                accessibilityLabel={`${index + 1}番目、${item.label}${selected ? "、選択中" : ""}`}
                accessibilityRole="button"
                key={item.id}
                onPress={() => {
                  setSelectedId(item.id);
                  setAnnouncement("");
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor:
                      selected || pressed
                        ? theme.surfaceSelected
                        : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.position, { color: theme.textSecondary }]}>
                  {index + 1}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.itemLabel, { color: theme.text }]}
                >
                  {item.label}
                </Text>
                {selected ? (
                  <Text style={[styles.caption, { color: theme.text }]}>
                    選択中
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text
            accessibilityLiveRegion="polite"
            aria-live="polite"
            numberOfLines={2}
            style={[styles.status, { color: theme.text }]}
          >
            {announcement ||
              (selectedItem
                ? `選択中：${selectedIndex + 1}番目・${selectedItem.label}`
                : "項目を選んでください")}
          </Text>
          <View style={styles.actions}>
            <AppButton
              disabled={selectedIndex <= 0}
              label="上へ"
              onPress={() => move(-1)}
              style={styles.action}
              variant="secondary"
            />
            <AppButton
              disabled={selectedIndex < 0 || selectedIndex >= items.length - 1}
              label="下へ"
              onPress={() => move(1)}
              style={styles.action}
              variant="secondary"
            />
          </View>
          <AppButton label="完了" onPress={onClose} />
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <Modal accessibilityLabel={title} onRequestClose={onClose}>
      {Platform.OS === "web" ? (
        content
      ) : (
        // Native modals are measured in a different window from the route.
        <SafeAreaProvider testID="reorder-window-insets">
          {content}
        </SafeAreaProvider>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, alignItems: "center" },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  title: { ...typography.title },
  caption: { ...typography.caption },
  status: { ...typography.label },
  scroll: { flex: 1 },
  list: { gap: spacing.sm, paddingVertical: spacing.xs },
  row: {
    minHeight: layout.minimumTouchTarget,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  position: { ...typography.label, minWidth: spacing.xl },
  itemLabel: { ...typography.bodyStrong, flex: 1, minWidth: 0 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1, paddingHorizontal: spacing.sm },
});
