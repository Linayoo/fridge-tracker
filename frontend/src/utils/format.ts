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

export function formatError(err: Error): string {
  if (err.message.includes("Network request failed")) {
    return "Couldn't connect. Check your Wi-Fi and try again.";
  }
  return err.message;
}
