// ── Shelf ──────────────────────────────────────────────────────────────────

export type Shelf = {
  id: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

// Trimmed shape embedded in GET /shelves (matches backend ItemSummary)
export type ItemSummary = {
  id: number;
  name: string;
  category: string;
  position: number;
  expires_at: string | null;
};

// Returned by GET /shelves and GET /shelves/{id}
export type ShelfWithItems = Shelf & {
  items: ItemSummary[];
};

// ── Item ───────────────────────────────────────────────────────────────────

// Full item shape (matches backend ItemOut)
export type Item = {
  id: number;
  shelf_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  position: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// Returned by GET /search/items — includes denormalized shelf_name
export type ItemSearchResult = {
  id: number;
  shelf_id: number;
  shelf_name: string;
  name: string;
  category: string;
  expires_at: string | null;
};

// ── Category ───────────────────────────────────────────────────────────────

export type Category = {
  slug: string;
  label: string;
  emoji: string;
  suggested_units: string[];
};

// ── Request bodies ─────────────────────────────────────────────────────────

export type ShelfCreate = {
  name: string;
  position?: number;
};

export type ShelfUpdate = {
  name?: string;
};

export type ItemCreate = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expires_at?: string | null;
  position?: number;
};

export type ItemUpdate = {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expires_at?: string | null;
  position?: number;
  shelf_id?: number; // move item to a different shelf
};

export type ReorderEntry = { id: number; position: number };
export type ReorderRequest = { order: ReorderEntry[] };
