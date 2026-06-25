# Frontend

## Stack

| Tool                   | Version target | Purpose                          |
|------------------------|----------------|----------------------------------|
| Expo SDK               | 54 (locked)    | React Native runtime + tooling   |
| React Native           | 0.81           | matches Expo SDK 54              |
| TypeScript             | ~5.3           | type checking                    |
| React Navigation       | v7             | navigation stack                 |
| native `fetch`         | —              | HTTP client (no axios)           |

### Why SDK 54 specifically

Expo Go on the App Store can lag behind the latest SDK. Locking to 54 avoids the "your project is incompatible with Expo Go" issue. When the App Store version moves to 55, we upgrade and re-test. Don't blindly upgrade.

## Project structure

```
frontend/
├── App.tsx                    # navigation stack root
├── app.json                   # Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
└── src/
    ├── api/
    │   ├── client.ts          # fetch wrapper, BASE_URL config
    │   ├── shelves.ts         # shelf endpoints
    │   ├── items.ts           # item endpoints
    │   ├── categories.ts      # categories endpoint
    │   └── types.ts           # shared TS types matching API schemas
    ├── screens/
    │   ├── HomeScreen.tsx     # list of shelves with item previews
    │   ├── ShelfScreen.tsx    # detail of one shelf, all items
    │   ├── ItemFormScreen.tsx # add or edit an item
    │   ├── ShelfFormScreen.tsx # add or rename a shelf
    │   └── SearchScreen.tsx   # search across all items
    ├── components/
    │   ├── ShelfCard.tsx
    │   ├── ItemRow.tsx
    │   ├── ExpirationBadge.tsx
    │   ├── CategoryIcon.tsx
    │   └── EmptyState.tsx
    ├── hooks/
    │   ├── useShelves.ts      # data fetching + state for shelves
    │   ├── useItems.ts
    │   └── useCategories.ts
    └── utils/
        ├── expiration.ts      # status computation from expires_at
        └── format.ts          # date and quantity formatting
```

## Conventions

### Component shape

```tsx
import { View, Text, StyleSheet } from "react-native";

type Props = {
  shelf: Shelf;
  onPress: (id: number) => void;
};

export function ShelfCard({ shelf, onPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{shelf.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
});
```

Rules:

- Named export for components (not default), so renames don't desync filenames
- Props typed as `type`, not `interface`
- `StyleSheet.create` at the bottom of the file
- No inline styles except for genuinely dynamic values (e.g. computed expiration color)
- Keep components under 200 lines

### Hooks

Custom hooks live in `src/hooks/` and follow this pattern:

```ts
export function useShelves() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shelvesApi.list();
      setShelves(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shelves, loading, error, refresh };
}
```

No global state library. `useState` + custom hooks are enough for v1.

### API client

`src/api/client.ts` is a thin fetch wrapper:

```ts
// Change this to your machine's LAN IP when testing on a physical device
// Example: "http://192.168.1.42:8000"
export const BASE_URL = "http://localhost:8000";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

Resource modules wrap it:

```ts
// src/api/shelves.ts
import { request } from "./client";
import type { Shelf, ShelfCreate } from "./types";

export const shelvesApi = {
  list: () => request<Shelf[]>("/shelves"),
  get: (id: number) => request<Shelf>(`/shelves/${id}`),
  create: (data: ShelfCreate) =>
    request<Shelf>("/shelves", { method: "POST", body: JSON.stringify(data) }),
  // ...
};
```

### Types

API types in `src/api/types.ts` mirror the backend Pydantic schemas. Keep them in sync manually for v1. If they drift often, add OpenAPI codegen in a later phase.

### Navigation

React Navigation v7 stack navigator. Define `RootStackParamList` in `App.tsx` and import it everywhere:

```ts
export type RootStackParamList = {
  Home: undefined;
  Shelf: { shelfId: number; shelfName: string };
  ItemForm: { shelfId: number; itemId?: number };
  ShelfForm: { shelfId?: number };
  Search: undefined;
};
```

Each screen typed:

```ts
type Props = NativeStackScreenProps<RootStackParamList, "Shelf">;
```

## Styling

No CSS-in-JS library, no Tailwind. Plain `StyleSheet.create` is enough for v1.

Color palette (define once in a constants file, reuse everywhere):

```ts
export const colors = {
  background: "#f7f7f9",
  card: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e0e0e0",
  primary: "#4a6cf7",
  // expiration colors
  fresh: "#22c55e",
  expiringSoon: "#f59e0b",
  expired: "#ef4444",
};
```

## Out of scope for the frontend in v1

- Tests
- Offline support
- State management library
- Theming or dark mode
- Internationalization
- Image picker, camera
- Push notifications
- Animations beyond what React Navigation provides by default
