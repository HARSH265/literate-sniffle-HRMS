/** Extract { id, name } from a populated Mongoose sub-document or return null */
export function refToIdName(val: unknown): { id: string; name: string } | null {
  if (!val || typeof val !== 'object') return null;
  const doc = val as Record<string, unknown>;
  const id = doc._id ?? doc.id;
  const name = doc.name ?? '';
  if (!id) return null;
  return { id: String(id), name: String(name) };
}
