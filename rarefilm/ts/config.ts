export interface PluginConfig {
  id: string;
  name: string;
  enabled: boolean;
  fallback: string;
  supportedTypes: readonly ('movie' | 'tv')[];
  searchOrder: readonly ('imdb' | 'title')[];
}

// Sağlayıcının temel kimliği ve desteklediği içerik kuralları.
export const config: PluginConfig = {
  id: 'rarefilm',
  name: 'RareFilm',
  enabled: true,
  fallback: 'https://rarefilmm.com',
  supportedTypes: ['movie'],
  searchOrder: ['title'],
};

export interface CatalogConfig { id: string; name: string; path: string; }

// Site kategorilerini NuvioTR raf kimlikleriyle eşler.
export const catalogs: readonly CatalogConfig[] = [
  { id: 'latest', name: 'Son Eklenenler', path: 'page' },
  { id: 'action', name: 'Aksiyon', path: 'category/action/page' },
  { id: 'adventure', name: 'Macera', path: 'category/adventure/page' },
  { id: 'animation', name: 'Animasyon', path: 'category/animation/page' },
  { id: 'camp', name: 'Kamp', path: 'category/camp/page' },
  { id: 'comedy', name: 'Komedi', path: 'category/comedy/page' },
  { id: 'documentary', name: 'Belgesel', path: 'category/documentary/page' },
  { id: 'drama', name: 'Dram', path: 'category/drama/page' },
  { id: 'erotic', name: 'Erotik', path: 'category/erotic/page' },
  { id: 'family', name: 'Aile', path: 'category/family/page' },
  { id: 'fantasy', name: 'Fantastik', path: 'category/fantasy/page' },
  { id: 'mystery', name: 'Gizem', path: 'category/mystery/page' },
  { id: 'theatre', name: 'Tiyatro', path: 'category/theatre/page' },
];
