import { StyleSheet, Text } from "react-native";
import { getExpirationStatus } from "../utils/expiration";
import { formatDate } from "../utils/format";
import { colors } from "../utils/colors";

type Props = {
  expiresAt: string | null;
};

export function ExpirationBadge({ expiresAt }: Props) {
  if (expiresAt === null) return null;

  const status = getExpirationStatus(expiresAt);
  const color =
    status === "expired"
      ? colors.expired
      : status === "expiring_soon"
        ? colors.expiringSoon
        : colors.fresh;

  return <Text style={[styles.text, { color }]}>{formatDate(expiresAt)}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
