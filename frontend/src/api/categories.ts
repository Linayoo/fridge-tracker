import { request } from "./client";
import type { Category } from "./types";

export const categoriesApi = {
  list: () => request<Category[]>("/categories"),
};
