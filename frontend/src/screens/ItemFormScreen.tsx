import { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { itemsApi } from "../api/items";
import { useCategories } from "../hooks/useCategories";
import { useShelves } from "../hooks/useShelves";
import { CategoryIcon } from "../components/CategoryIcon";
import { ErrorBanner } from "../components/ErrorBanner";
import { colors } from "../utils/colors";
import { formatDate } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "ItemForm">;

// today + 7 days: intentional default for the common case of "logged today, lasts a week"
const defaultPickerDate = (): Date => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const maxPickerDate = (): Date => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d;
};

export function ItemFormScreen({ navigation, route }: Props) {
  const { shelfId, itemId } = route.params;
  const isEdit = itemId !== undefined;
  const { categories, error: categoriesError, refresh: refreshCategories } = useCategories();
  const { shelves, error: shelvesError, refresh: refreshShelves } = useShelves();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pieces");
  const [category, setCategory] = useState("other");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [selectedShelfId, setSelectedShelfId] = useState<number>(shelfId);
  const [saving, setSaving] = useState(false);

  // pickerOpen drives both platforms. draftDate tracks the iOS spinner value before Done/Cancel.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    itemsApi.get(itemId).then((item) => {
      setName(item.name);
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setCategory(item.category);
      setExpiresAt(item.expires_at);
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

  const openPicker = () => {
    setDraftDate(expiresAt ?? defaultPickerDate().toISOString());
    setPickerOpen(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setPickerOpen(false);
    if (event.type === "set" && date) setExpiresAt(date.toISOString());
    // "dismissed" → no-op, expiresAt unchanged
  };

  const handleIOSDone = () => {
    setExpiresAt(draftDate);
    setPickerOpen(false);
  };

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
      if (isEdit) {
        await itemsApi.update(itemId, {
          name: name.trim(), quantity: qty, unit: unit.trim(), category,
          expires_at: expiresAt,
          shelf_id: selectedShelfId,
        });
      } else {
        await itemsApi.create(shelfId, {
          name: name.trim(), quantity: qty, unit: unit.trim(), category,
          expires_at: expiresAt,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const hasPickerError = categoriesError != null || (isEdit && shelvesError != null);
  const pickerValue = draftDate ? new Date(draftDate) : defaultPickerDate();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {hasPickerError ? (
        <ErrorBanner
          onRetry={() => {
            if (categoriesError) refreshCategories();
            if (isEdit && shelvesError) refreshShelves();
          }}
        />
      ) : null}
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

        <Text style={styles.label}>Expiry date</Text>

        {expiresAt === null ? (
          // STATE 1 — no date set
          <Pressable style={styles.dateInput} onPress={openPicker}>
            <Text style={styles.datePlaceholder}>Set expiration date</Text>
          </Pressable>
        ) : (
          // STATE 2 — date set; identical layout on both platforms
          <View style={styles.dateRow}>
            <Text style={styles.dateValue}>{formatDate(expiresAt)}</Text>
            <Pressable onPress={openPicker} hitSlop={8}>
              <Text style={styles.dateAction}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => setExpiresAt(null)} hitSlop={8}>
              <Text style={styles.dateAction}>Clear</Text>
            </Pressable>
          </View>
        )}

        {/* Android: DateTimePicker renders as a native modal dialog */}
        {pickerOpen && Platform.OS === "android" && (
          <DateTimePicker
            mode="date"
            value={pickerValue}
            maximumDate={maxPickerDate()}
            onChange={handleAndroidChange}
          />
        )}

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </ScrollView>

      {/* iOS: bottom sheet modal with spinner + Cancel/Done bar.
          Tapping the dimmed backdrop behaves like Cancel — closes without committing. */}
      {Platform.OS === "ios" && (
        <Modal visible={pickerOpen} transparent animationType="slide">
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
            {/* Stop backdrop tap from propagating into the sheet */}
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleIOSDone} hitSlop={8}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={pickerValue}
                maximumDate={maxPickerDate()}
                onChange={(_, date) => { if (date) setDraftDate(date.toISOString()); }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  // Expiry date field
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.card,
  },
  datePlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  dateValue: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dateAction: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  // iOS picker modal
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  modalDone: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  // Save button
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
