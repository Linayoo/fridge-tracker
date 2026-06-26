import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ShelfScreen } from "./src/screens/ShelfScreen";
import { ItemFormScreen } from "./src/screens/ItemFormScreen";
import { ShelfFormScreen } from "./src/screens/ShelfFormScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { colors } from "./src/utils/colors";

export type RootStackParamList = {
  Home: undefined;
  Shelf: { shelfId: number; shelfName: string };
  ItemForm: { shelfId: number; itemId?: number };
  ShelfForm: { shelfId?: number };
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "My Fridge" }} />
        <Stack.Screen name="Shelf" component={ShelfScreen} options={{ title: "" }} />
        <Stack.Screen name="ItemForm" component={ItemFormScreen} options={{ title: "" }} />
        <Stack.Screen name="ShelfForm" component={ShelfFormScreen} options={{ title: "" }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
