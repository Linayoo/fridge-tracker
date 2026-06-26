import { useCallback, useEffect, useState } from "react";
import { shelvesApi } from "../api/shelves";
import type { ShelfWithItems } from "../api/types";

export function useShelves() {
  const [shelves, setShelves] = useState<ShelfWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setShelves(await shelvesApi.list());
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
