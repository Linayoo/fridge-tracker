import { request } from "./client";
import type { Shelf, ShelfWithItems, ShelfCreate, ShelfUpdate, ReorderRequest } from "./types";

export const shelvesApi = {
  list: () => request<ShelfWithItems[]>("/shelves"),
  get: (id: number) => request<ShelfWithItems>(`/shelves/${id}`),
  create: (data: ShelfCreate) =>
    request<Shelf>("/shelves", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: ShelfUpdate) =>
    request<Shelf>(`/shelves/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<void>(`/shelves/${id}`, { method: "DELETE" }),
  reorder: (data: ReorderRequest) =>
    request<ShelfWithItems[]>("/shelves/reorder", { method: "POST", body: JSON.stringify(data) }),
};
