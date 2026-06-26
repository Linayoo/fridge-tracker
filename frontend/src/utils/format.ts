export function formatDate(isoString: string | null): string {
  if (isoString === null) return "—";
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatQuantity(quantity: number, unit: string): string {
  const qty = quantity % 1 === 0 ? String(quantity) : quantity.toFixed(1);
  return `${qty} ${unit}`;
}
