import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../utils/colors";

type Props = {
  message: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ message, title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  action: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
});
