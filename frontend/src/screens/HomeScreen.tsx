import { useCallback, useLayoutEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useShelves } from "../hooks/useShelves";
import { ShelfCard } from "../components/ShelfCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { formatError } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { shelves, loading, error, refresh } = useShelves();

  // Refresh list whenever this screen comes back into focus (e.g. after adding a shelf)
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => navigation.navigate("Search")}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Text style={styles.headerBtnText}>🔍</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("ShelfForm", {})}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Text style={styles.headerBtnText}>＋</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  const hasData = shelves.length > 0;

  return (
    <View style={styles.flex}>
      {hasData && error ? <ErrorBanner onRetry={refresh} /> : null}
      <FlatList
        data={shelves}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ShelfCard
            shelf={item}
            onPress={() =>
              navigation.navigate("Shelf", { shelfId: item.id, shelfName: item.name })
            }
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
            <EmptyState message="No shelves yet. Tap + to add one." />
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
