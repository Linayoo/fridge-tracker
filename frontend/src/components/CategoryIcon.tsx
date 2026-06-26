import { Text } from "react-native";

const EMOJI: Record<string, string> = {
  vegetables: "🥦",
  fruits: "🍎",
  dairy: "🧀",
  meat: "🥩",
  fish: "🐟",
  leftovers: "🍱",
  condiments: "🫙",
  drinks: "🧃",
  frozen: "🧊",
  grains: "🌾",
  other: "📦",
};

type Props = {
  slug: string;
  size?: number;
};

export function CategoryIcon({ slug, size = 20 }: Props) {
  return <Text style={{ fontSize: size }}>{EMOJI[slug] ?? "📦"}</Text>;
}
