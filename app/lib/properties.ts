import { supabase } from './supabase';
import { PaginatedProperties, Property } from './types';

const PAGE_SIZE = 8;

/**
 * Curated catalog of 36 distinct, high-resolution luxury real estate & architecture photos.
 * Used to guarantee every property has a unique cover photo and a complete 4-photo gallery.
 */
const UNIQUE_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=800',
];

function extractUnsplashId(url: string): string {
  const match = url.match(/photo-[a-z0-9-]+/i);
  return match ? match[0] : url;
}

/**
 * Builds a deterministic map of property ID -> unique images array across all properties
 * so no two properties ever display the same primary cover image.
 */
async function getUniqueImagesByPropertyId(): Promise<Map<string, string[]>> {
  const { data } = await supabase
    .from('properties')
    .select('id, images, is_featured, created_at')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  const imageMap = new Map<string, string[]>();
  if (!data) return imageMap;

  const usedPrimaryKeys = new Set<string>();
  let catalogIdx = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const currentImages: string[] = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
    const currentPrimary = currentImages[0];
    const currentKey = currentPrimary ? extractUnsplashId(currentPrimary) : '';

    // Check if the property already has a unique, non-broken primary image
    const isBrokenPlaceholder = currentKey === 'photo-1600607687931-cebf004f5195' || currentKey === 'photo-1600607687931-cebf00551068';
    let chosenPrimary = currentPrimary;

    if (!chosenPrimary || isBrokenPlaceholder || usedPrimaryKeys.has(currentKey)) {
      // Pick the next unused image from our curated catalog
      while (catalogIdx < UNIQUE_PROPERTY_IMAGES.length * 2) {
        const candidate = UNIQUE_PROPERTY_IMAGES[catalogIdx % UNIQUE_PROPERTY_IMAGES.length];
        const candidateKey = extractUnsplashId(candidate);
        catalogIdx++;
        if (!usedPrimaryKeys.has(candidateKey)) {
          chosenPrimary = candidate;
          break;
        }
      }
    }

    const finalPrimary = chosenPrimary || UNIQUE_PROPERTY_IMAGES[i % UNIQUE_PROPERTY_IMAGES.length];
    usedPrimaryKeys.add(extractUnsplashId(finalPrimary));

    // Build a 4-image gallery keeping distinct secondary images
    const gallery: string[] = [finalPrimary];
    const existingSecondaries = currentImages.slice(1).filter((img) => {
      const k = extractUnsplashId(img);
      return k !== extractUnsplashId(finalPrimary) && k !== 'photo-1600607687931-cebf004f5195' && k !== 'photo-1600607687931-cebf00551068';
    });

    for (const sec of existingSecondaries) {
      if (gallery.length < 4 && !gallery.some((g) => extractUnsplashId(g) === extractUnsplashId(sec))) {
        gallery.push(sec);
      }
    }

    let secOffset = i + 5;
    while (gallery.length < 4) {
      const candidate = UNIQUE_PROPERTY_IMAGES[secOffset % UNIQUE_PROPERTY_IMAGES.length];
      secOffset += 7;
      if (!gallery.some((g) => extractUnsplashId(g) === extractUnsplashId(candidate))) {
        gallery.push(candidate);
      }
    }

    imageMap.set(row.id, gallery);
  }

  return imageMap;
}

function applyUniqueImages(properties: Property[], imageMap: Map<string, string[]>): Property[] {
  return properties.map((prop) => {
    const mapped = imageMap.get(prop.id);
    return mapped ? { ...prop, images: mapped } : prop;
  });
}

/**
 * Fetches the 2 featured properties (is_featured = true).
 * Called from a Server Component — runs on the server only.
 */
export async function getFeaturedProperties(): Promise<Property[]> {
  const [{ data, error }, imageMap] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(2),
    getUniqueImagesByPropertyId(),
  ]);

  if (error) {
    console.error('[getFeaturedProperties] Supabase error:', error.message);
    return [];
  }

  return applyUniqueImages(data ?? [], imageMap);
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
    query = query.ilike('title', `%${filters.type}%`);
  }
  
  if (filters?.beds) {
    query = query.gte('beds', parseInt(filters.beds, 10));
  }
  
  if (filters?.baths) {
    query = query.gte('baths', parseInt(filters.baths, 10));
  }

  const [{ data, error, count }, imageMap] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, to),
    getUniqueImagesByPropertyId(),
  ]);

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
    properties: applyUniqueImages(data ?? [], imageMap),
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

  const [{ data, error }, imageMap] = await Promise.all([
    query.single(),
    getUniqueImagesByPropertyId(),
  ]);

  if (error || !data) {
    if (error) console.error('[getPropertyBySlugOrId] Supabase error:', error.message);
    return null;
  }

  return applyUniqueImages([data], imageMap)[0];
}
