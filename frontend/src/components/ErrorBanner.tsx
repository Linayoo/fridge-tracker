import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../utils/colors";

type Props = {
  onRetry: () => void;
};

export function ErrorBanner({ onRetry }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Couldn't refresh. Showing last known data.</Text>
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={styles.retry}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.expiringSoon,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 13,
    color: "#ffffff",
    flex: 1,
    marginRight: 12,
  },
  retry: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
});
