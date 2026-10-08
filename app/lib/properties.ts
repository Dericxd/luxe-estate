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

export interface FilterOptions {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  type?: string;
  beds?: string;
  baths?: string;
}

/**
 * Fetches a paginated list of non-featured market properties.
 * Uses Supabase range-based pagination (server-side) and filters.
 *
 * @param page - 1-indexed page number (from the URL search param)
 * @param filters - Optional filters
 */
export async function getMarketProperties(
  page: number = 1,
  filters?: FilterOptions
): Promise<PaginatedProperties> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('is_featured', false);

  if (filters?.search) {
    query = query.ilike('location', `%${filters.search}%`);
  }
  
  if (filters?.minPrice) {
    query = query.gte('price', parseInt(filters.minPrice, 10));
  }
  
  if (filters?.maxPrice) {
    query = query.lte('price', parseInt(filters.maxPrice, 10));
  }
  
  if (filters?.type && filters.type !== "Any Type") {
    // Basic mapping or strictly matching the title/tag
    query = query.ilike('title', `%${filters.type}%`);
  }
  
  if (filters?.beds) {
    query = query.gte('beds', parseInt(filters.beds, 10));
  }
  
  if (filters?.baths) {
    query = query.gte('baths', parseInt(filters.baths, 10));
  }

  const { data, error, count } = await query
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

/**
 * Fetches a single property by slug or id.
 */
export async function getPropertyBySlugOrId(slugOrId: string): Promise<Property | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  
  let query = supabase.from('properties').select('*');
  
  if (isUuid) {
    query = query.eq('id', slugOrId);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('[getPropertyBySlugOrId] Supabase error:', error.message);
    return null;
  }

  return data;
}
