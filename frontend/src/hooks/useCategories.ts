import { useEffect, useState } from "react";
import { categoriesApi } from "../api/categories";
import type { Category } from "../api/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch((e: unknown) => setError(e as Error))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}
