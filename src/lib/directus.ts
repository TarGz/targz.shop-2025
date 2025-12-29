const DIRECTUS_URL = import.meta.env.DIRECTUS_URL || 'http://167.86.73.162:8055';

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number; // in cents
  status: 'active' | 'sold' | 'hidden';
  medium: 'paper' | 'canvas';
  sku: string | null;
  image: string | null;
  gallery: { directus_files_id: string }[];
  created_at: string;
}

export interface DirectusFile {
  id: string;
  filename_disk: string;
  title: string | null;
  width: number;
  height: number;
}

async function fetchDirectus<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`Directus API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function getProducts(): Promise<Product[]> {
  return fetchDirectus<Product[]>(
    '/items/products?filter[status][_neq]=hidden&sort=status,sort,-created_at&fields=*,gallery.directus_files_id'
  );
}

export async function getProductsByMedium(medium: 'paper' | 'canvas', limit?: number): Promise<Product[]> {
  let url = `/items/products?filter[status][_neq]=hidden&filter[medium][_eq]=${medium}&sort=status,sort,-created_at&fields=*,gallery.directus_files_id`;
  if (limit) {
    url += `&limit=${limit}`;
  }
  return fetchDirectus<Product[]>(url);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await fetchDirectus<Product[]>(
    `/items/products?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=*,gallery.directus_files_id&limit=1`
  );
  return products[0] || null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await fetchDirectus<{ slug: string }[]>(
    '/items/products?filter[status][_neq]=hidden&fields=slug'
  );
  return products.map(p => p.slug);
}

export function getAssetURL(fileId: string | null, transforms?: { width?: number; height?: number; format?: string }): string {
  if (!fileId) return '';

  let url = `${DIRECTUS_URL}/assets/${fileId}`;

  if (transforms) {
    const params = new URLSearchParams();
    if (transforms.width) params.set('width', String(transforms.width));
    if (transforms.height) params.set('height', String(transforms.height));
    if (transforms.format) params.set('format', transforms.format);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }

  return url;
}

export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
