export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  price_label: string;
  listing_type: 'sale' | 'rent';
  beds: number;
  baths: number;
  area: string;
  image_url: string;
  images?: string[];
  tag: string;
  tag_color: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface PaginatedProperties {
  properties: Property[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
