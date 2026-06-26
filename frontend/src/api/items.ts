import { request } from "./client";
import type { Item, ItemCreate, ItemUpdate, ItemSearchResult, ReorderRequest } from "./types";

export const itemsApi = {
  get: (id: number) => request<Item>(`/items/${id}`),
  create: (shelfId: number, data: ItemCreate) =>
    request<Item>(`/shelves/${shelfId}/items`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: ItemUpdate) =>
    request<Item>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<void>(`/items/${id}`, { method: "DELETE" }),
  reorder: (shelfId: number, data: ReorderRequest) =>
    request<Item[]>(`/shelves/${shelfId}/items/reorder`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  search: (q: string) =>
    request<ItemSearchResult[]>(`/search/items?q=${encodeURIComponent(q)}`),
};
