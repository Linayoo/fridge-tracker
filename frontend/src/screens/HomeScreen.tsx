import { useLayoutEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useShelves } from "../hooks/useShelves";
import { ShelfCard } from "../components/ShelfCard";
import { EmptyState } from "../components/EmptyState";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { shelves, loading, refresh } = useShelves();

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

  return (
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
        loading ? null : <EmptyState message="No shelves yet. Tap + to add one." />
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
