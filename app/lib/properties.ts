import { supabase } from './supabase';
import { PaginatedProperties, Property } from './types';

const PAGE_SIZE = 8;

/**
 * Fetches the 2 featured properties (is_featured = true).
 * Called from a Server Component — runs on the server only.
 */
export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getFeaturedProperties] Supabase error:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetches a paginated list of non-featured market properties.
 * Uses Supabase range-based pagination (server-side).
 *
 * @param page - 1-indexed page number (from the URL search param)
 */
export async function getMarketProperties(
  page: number = 1
): Promise<PaginatedProperties> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('is_featured', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[getMarketProperties] Supabase error:', error.message);
    return {
      properties: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: 0,
    };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    properties: data ?? [],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}
