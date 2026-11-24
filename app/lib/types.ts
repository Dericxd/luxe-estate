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
  images: string[];
  slug?: string;
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

export type UserRole = 'admin' | 'broker' | 'agent' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

