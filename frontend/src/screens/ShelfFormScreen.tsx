import { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { shelvesApi } from "../api/shelves";
import { colors } from "../utils/colors";

type Props = NativeStackScreenProps<RootStackParamList, "ShelfForm">;

export function ShelfFormScreen({ navigation, route }: Props) {
  const { shelfId } = route.params;
  const isEdit = shelfId !== undefined;

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    shelvesApi.get(shelfId).then((shelf) => setName(shelf.name));
  }, [shelfId, isEdit]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? "Rename shelf" : "New shelf" });
  }, [navigation, isEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter a shelf name.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await shelvesApi.update(shelfId, { name: name.trim() });
      } else {
        await shelvesApi.create({ name: name.trim() });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete shelf",
      `Delete "${name}" and all its items? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await shelvesApi.remove(shelfId!);
              navigation.popToTop();
            } catch (e) {
              Alert.alert("Error", (e as Error).message);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Top shelf"
        placeholderTextColor={colors.textMuted}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
      </Pressable>

      {isEdit && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete shelf…</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  deleteBtn: {
    marginTop: 32,
    padding: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    color: colors.expired,
    fontSize: 16,
  },
});
