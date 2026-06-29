import { useCallback, useEffect, useLayoutEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useItems } from "../hooks/useItems";
import { ItemRow } from "../components/ItemRow";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { formatError } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Shelf">;

export function ShelfScreen({ navigation, route }: Props) {
  const { shelfId, shelfName } = route.params;
  const { shelf, loading, error, refresh } = useItems(shelfId);

  // Refresh when returning from ItemForm or ShelfForm
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Update title from fetched shelf name (handles rename)
  useEffect(() => {
    if (shelf?.name) navigation.setOptions({ title: shelf.name });
  }, [shelf?.name, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: shelfName,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => navigation.navigate("ShelfForm", { shelfId })}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Text style={styles.headerBtnText}>✏️</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("ItemForm", { shelfId })}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Text style={styles.headerBtnText}>＋</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, shelfId, shelfName]);

  const hasData = (shelf?.items ?? []).length > 0;

  return (
    <View style={styles.flex}>
      {hasData && error ? <ErrorBanner onRetry={refresh} /> : null}
      <FlatList
        data={shelf?.items ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onPress={() => navigation.navigate("ItemForm", { shelfId, itemId: item.id })}
          />
        )}
        ListEmptyComponent={
          loading ? null : error ? (
            <EmptyState
              title="Can't reach the server"
              message={formatError(error)}
              actionLabel="Retry"
              onAction={refresh}
            />
          ) : (
            <EmptyState message="No items yet. Tap + to add one." />
          )
        }
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    paddingBottom: 24,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    padding: 4,
  },
  headerBtnText: {
    fontSize: 20,
  },
});
