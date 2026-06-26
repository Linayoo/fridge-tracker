import { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { itemsApi } from "../api/items";
import { useCategories } from "../hooks/useCategories";
import { useShelves } from "../hooks/useShelves";
import { CategoryIcon } from "../components/CategoryIcon";
import { colors } from "../utils/colors";

type Props = NativeStackScreenProps<RootStackParamList, "ItemForm">;

export function ItemFormScreen({ navigation, route }: Props) {
  const { shelfId, itemId } = route.params;
  const isEdit = itemId !== undefined;
  const { categories } = useCategories();
  const { shelves } = useShelves();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pieces");
  const [category, setCategory] = useState("other");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState<number>(shelfId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    itemsApi.get(itemId).then((item) => {
      setName(item.name);
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setCategory(item.category);
      setExpiresAt(item.expires_at ? item.expires_at.split("T")[0] : "");
      setSelectedShelfId(item.shelf_id);
    });
  }, [itemId, isEdit]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? "Edit item" : "Add item",
      headerRight: isEdit
        ? () => (
            <Pressable
              hitSlop={8}
              onPress={() =>
                Alert.alert("Delete item", `Delete "${name}"?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await itemsApi.remove(itemId!);
                        navigation.goBack();
                      } catch (e) {
                        Alert.alert("Error", (e as Error).message);
                      }
                    },
                  },
                ])
              }
            >
              <Text style={styles.deleteHeaderBtn}>Delete</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isEdit, name, itemId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter an item name.");
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid quantity", "Quantity must be a positive number.");
      return;
    }
    setSaving(true);
    try {
      const iso = expiresAt.trim() ? new Date(expiresAt.trim()).toISOString() : null;
      if (isEdit) {
        await itemsApi.update(itemId, {
          name: name.trim(), quantity: qty, unit: unit.trim(), category, expires_at: iso,
          shelf_id: selectedShelfId,
        });
      } else {
        await itemsApi.create(shelfId, {
          name: name.trim(), quantity: qty, unit: unit.trim(), category, expires_at: iso,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Yogurt"
          placeholderTextColor={colors.textMuted}
          autoFocus={!isEdit}
        />

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Unit</Text>
        <TextInput
          style={styles.input}
          value={unit}
          onChangeText={setUnit}
          placeholder="pieces, g, L…"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.slug}
              style={[styles.chip, category === cat.slug && styles.chipSelected]}
              onPress={() => setCategory(cat.slug)}
            >
              <CategoryIcon slug={cat.slug} size={14} />
              <Text style={[styles.chipText, category === cat.slug && styles.chipTextSelected]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isEdit && (
          <>
            <Text style={styles.label}>Shelf</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chips}
              keyboardShouldPersistTaps="handled"
            >
              {shelves.map((shelf) => (
                <Pressable
                  key={shelf.id}
                  style={[styles.chip, selectedShelfId === shelf.id && styles.chipSelected]}
                  onPress={() => setSelectedShelfId(shelf.id)}
                >
                  <Text style={[styles.chipText, selectedShelfId === shelf.id && styles.chipTextSelected]}>
                    {shelf.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.label}>Expiry date (YYYY-MM-DD, optional)</Text>
        <TextInput
          style={styles.input}
          value={expiresAt}
          onChangeText={setExpiresAt}
          placeholder="2026-07-01"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  chips: { marginVertical: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: "#ffffff" },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  deleteHeaderBtn: { color: colors.expired, fontSize: 16 },
});
