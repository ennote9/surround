export function createId(prefix?: string): string {
  const p = prefix ?? "id"
  const random = Math.random().toString(36).slice(2, 8)
  return `${p}_${random}_${Date.now()}`
}
