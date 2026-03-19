/**
 * Format a number as Indian currency (₹)
 */
export function formatPrice(price: number, unit: string = 'total'): string {
  const formatted = price.toLocaleString('en-IN');
  if (unit === 'per_sqft') return `₹${formatted}/sqft`;
  if (unit === 'per_month') return `₹${formatted}/mo`;
  if (unit === 'per_year') return `₹${formatted}/yr`;
  // For large numbers, use lakh/crore shorthand
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${formatted}`;
}

export function formatPriceFull(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

export function formatArea(value: number, unit: string): string {
  return `${value.toLocaleString('en-IN')} ${unit}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  flat: 'Flat',
  house: 'House',
  plot: 'Plot',
  commercial: 'Commercial',
  agricultural: 'Agricultural Land',
  farmhouse: 'Farmhouse',
  villa: 'Villa',
  independent_house: 'Independent House',
  pg: 'PG',
  warehouse: 'Warehouse',
  shop: 'Shop',
  office: 'Office',
};

export const CATEGORY_LABELS: Record<string, string> = {
  sale: 'For Sale',
  rent: 'For Rent',
  lease: 'Lease',
  pg: 'PG',
};
