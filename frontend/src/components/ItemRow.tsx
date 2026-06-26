import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ItemSummary } from "../api/types";
import { CategoryIcon } from "./CategoryIcon";
import { ExpirationBadge } from "./ExpirationBadge";
import { colors } from "../utils/colors";

type Props = {
  item: ItemSummary;
  onPress: () => void;
};

export function ItemRow({ item, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <CategoryIcon slug={item.category} size={24} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <ExpirationBadge expiresAt={item.expires_at} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    color: colors.text,
  },
});
