import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { itemsApi } from "../api/items";
import type { ItemSearchResult } from "../api/types";
import { CategoryIcon } from "../components/CategoryIcon";
import { ExpirationBadge } from "../components/ExpirationBadge";
import { EmptyState } from "../components/EmptyState";
import { colors } from "../utils/colors";
import { formatError } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retry uses the current query value at call time, not the value captured when the error occurred.
  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setSearchError(null);
    try {
      setResults(await itemsApi.search(q.trim()));
      setSearched(true);
    } catch (e) {
      setSearchError(e as Error);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (q: string) => {
    setQuery(q);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(q), 300);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={handleChange}
        placeholder="Search items…"
        placeholderTextColor={colors.textMuted}
        autoFocus
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("ItemForm", { shelfId: item.shelf_id, itemId: item.id })
            }
          >
            <CategoryIcon slug={item.category} size={24} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowShelf}>{item.shelf_name}</Text>
            </View>
            <ExpirationBadge expiresAt={item.expires_at} />
          </Pressable>
        )}
        ListEmptyComponent={
          searched && !loading ? (
            searchError ? (
              <EmptyState
                title="Search failed"
                message={formatError(searchError)}
                actionLabel="Retry"
                onAction={() => runSearch(query)}
              />
            ) : (
              <EmptyState message="No items match your search." />
            )
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInput: {
    margin: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
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
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 16, color: colors.text },
  rowShelf: { fontSize: 12, color: colors.textMuted },
});
