import { useCallback, useEffect, useLayoutEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useItems } from "../hooks/useItems";
import { ItemRow } from "../components/ItemRow";
import { EmptyState } from "../components/EmptyState";

type Props = NativeStackScreenProps<RootStackParamList, "Shelf">;

export function ShelfScreen({ navigation, route }: Props) {
  const { shelfId, shelfName } = route.params;
  const { shelf, loading, refresh } = useItems(shelfId);

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

  return (
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
        loading ? null : <EmptyState message="No items yet. Tap + to add one." />
      }
      refreshing={loading}
      onRefresh={refresh}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
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
