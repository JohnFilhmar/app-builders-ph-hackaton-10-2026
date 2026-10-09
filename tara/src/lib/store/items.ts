import type { ItemSlot } from '@/types/gameEvents';

export type ShopItem = { id: string; kind: ItemSlot; name_en: string; name_tl: string; price: number };

/**
 * What the shop sells for Sipag. Every item is drawn behind or around the 2D hero (components/scene ShopBackdrop,
 * HeroFrame and HeroFx), never layered on the hero art, so it lines up at every level.
 */
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'bg_sari_sari', kind: 'backdrop', name_en: 'Sari-sari store', name_tl: 'Sari-sari store', price: 150 },
  { id: 'bg_palayan', kind: 'backdrop', name_en: 'Rice terraces', name_tl: 'Hagdan-hagdang palayan', price: 250 },
  { id: 'bg_sakayan', kind: 'backdrop', name_en: 'Jeepney stop', name_tl: 'Sakayan ng jeep', price: 300 },
  { id: 'bg_plaza', kind: 'backdrop', name_en: 'Plaza at night', name_tl: 'Plaza sa gabi', price: 450 },
  { id: 'frame_kawayan', kind: 'frame', name_en: 'Bamboo frame', name_tl: 'Kuwadrong kawayan', price: 120 },
  { id: 'frame_ginto', kind: 'frame', name_en: 'Gold frame', name_tl: 'Gintong kuwadro', price: 350 },
  { id: 'aura_alitaptap', kind: 'aura', name_en: 'Firefly aura', name_tl: 'Aura ng alitaptap', price: 150 },
  { id: 'aura_bahaghari', kind: 'aura', name_en: 'Rainbow aura', name_tl: 'Aura ng bahaghari', price: 400 },
];

/** Ids the shop still sells. A purchase of any other id is a retired item and its Sipag is refunded. */
export const SOLD_ITEM_IDS: ReadonlySet<string> = new Set(SHOP_ITEMS.map((i) => i.id));
