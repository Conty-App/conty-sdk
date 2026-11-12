import type { ContyResult } from "../client/types";
import type { Page } from "./types";

interface CursorPage {
  has_more?: boolean;
  next_cursor: string | null;
}

export async function* paginateBy<T, R extends CursorPage, P extends { cursor?: string }>(
  fetchPage: (params: P) => Promise<ContyResult<R>>,
  params: P,
  items: (page: R) => readonly T[],
): AsyncGenerator<T, void, undefined> {
  let cursor = params.cursor;
  for (;;) {
    const { data, error } = await fetchPage({ ...params, cursor });
    if (error) throw error;
    yield* items(data);
    if (data.has_more === false || !data.next_cursor || data.next_cursor === cursor) return;
    cursor = data.next_cursor;
  }
}

export function paginate<T, P extends { cursor?: string }>(
  fetchPage: (params: P) => Promise<ContyResult<Page<T>>>,
  params: P,
): AsyncGenerator<T, void, undefined> {
  return paginateBy(fetchPage, params, (page) => page.data);
}

export interface OffsetPage<T> {
  items: readonly T[];
  hasMore: boolean;
}

export async function* paginateOffset<T, R, P extends { offset?: number | null }>(
  fetchPage: (params: P) => Promise<ContyResult<R>>,
  params: P,
  read: (page: R, offset: number) => OffsetPage<T>,
): AsyncGenerator<T, void, undefined> {
  let offset = params.offset ?? 0;
  for (;;) {
    const { data, error } = await fetchPage({ ...params, offset });
    if (error) throw error;
    const { items, hasMore } = read(data, offset);
    yield* items;
    offset += items.length;
    if (items.length === 0 || !hasMore) return;
  }
}

export function byTotal<T>(items: readonly T[], total: number, offset: number): OffsetPage<T> {
  return { items, hasMore: offset + items.length < total };
}
