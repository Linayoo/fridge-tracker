import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ShelfWithItems } from "../api/types";
import { CategoryIcon } from "./CategoryIcon";
import { getExpirationStatus } from "../utils/expiration";
import { colors } from "../utils/colors";

type Props = {
  shelf: ShelfWithItems;
  onPress: () => void;
};

export function ShelfCard({ shelf, onPress }: Props) {
  const preview = shelf.items.slice(0, 3);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{shelf.name}</Text>
        <Text style={styles.count}>
          {shelf.items.length} {shelf.items.length === 1 ? "item" : "items"}
        </Text>
      </View>

      {preview.length > 0 && (
        <View style={styles.preview}>
          {preview.map((item) => {
            const status = getExpirationStatus(item.expires_at);
            const dotColor =
              status === "expired" ? colors.expired :
              status === "expiring_soon" ? colors.expiringSoon :
              null;
            return (
              <View key={item.id} style={styles.previewRow}>
                <CategoryIcon slug={item.category} size={14} />
                <Text style={styles.previewName} numberOfLines={1}>
                  {item.name}
                </Text>
                {dotColor !== null && (
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                )}
              </View>
            );
          })}
          {shelf.items.length > 3 && (
            <Text style={styles.more}>+{shelf.items.length - 3} more</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  count: {
    fontSize: 13,
    color: colors.textMuted,
  },
  preview: {
    gap: 4,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewName: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  more: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
