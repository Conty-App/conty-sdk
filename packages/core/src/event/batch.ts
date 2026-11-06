import { BATCH, EVENT } from "../config/constants";

export function chunkEvents<T>(events: T[]): T[][] {
  const encoder = new TextEncoder();
  const chunks: T[][] = [];
  let current: T[] = [];
  let bytes = 0;
  for (const event of events) {
    const size = encoder.encode(JSON.stringify(event)).byteLength + 1;
    if (current.length >= EVENT.batch.max || (current.length && bytes + size > BATCH.byteBudget)) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(event);
    bytes += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}
