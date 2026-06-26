import { useCallback, useEffect, useState } from "react";
import { shelvesApi } from "../api/shelves";
import type { ShelfWithItems } from "../api/types";

export function useItems(shelfId: number) {
  const [shelf, setShelf] = useState<ShelfWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setShelf(await shelvesApi.get(shelfId));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [shelfId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { shelf, loading, error, refresh };
}
