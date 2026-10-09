import type { PixelIconName } from '@/components/poly/PixelIcon';

export type ShopItem = { id: string; kind: 'backdrop' | 'frame' | 'aura'; name_en: string; name_tl: string; price: number; icon: PixelIconName };

/**
 * What the shop sells for Sipag. Every item is one flat image drawn behind or around the 2D hero, so it lines up at
 * every level without layering on the hero art. Art is not in yet, so each item shows its pixel icon as a placeholder;
 * buying records ownership in the ledger so the items are already yours when the art lands.
 */
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'bg_sari_sari', kind: 'backdrop', name_en: 'Sari-sari store', name_tl: 'Sari-sari store', price: 150, icon: 'home' },
  { id: 'bg_palayan', kind: 'backdrop', name_en: 'Rice terraces', name_tl: 'Hagdan-hagdang palayan', price: 250, icon: 'globe' },
  { id: 'bg_sakayan', kind: 'backdrop', name_en: 'Jeepney stop', name_tl: 'Sakayan ng jeep', price: 300, icon: 'arrow' },
  { id: 'bg_plaza', kind: 'backdrop', name_en: 'Plaza at night', name_tl: 'Plaza sa gabi', price: 450, icon: 'star' },
  { id: 'frame_kawayan', kind: 'frame', name_en: 'Bamboo frame', name_tl: 'Kuwadrong kawayan', price: 120, icon: 'chest' },
  { id: 'frame_ginto', kind: 'frame', name_en: 'Gold frame', name_tl: 'Gintong kuwadro', price: 350, icon: 'star' },
  { id: 'aura_alitaptap', kind: 'aura', name_en: 'Firefly aura', name_tl: 'Aura ng alitaptap', price: 150, icon: 'sparkle' },
  { id: 'aura_bahaghari', kind: 'aura', name_en: 'Rainbow aura', name_tl: 'Aura ng bahaghari', price: 400, icon: 'sparkle' },
];

/** Ids the shop still sells. A purchase of any other id is a retired item and its Sipag is refunded. */
export const SOLD_ITEM_IDS: ReadonlySet<string> = new Set(SHOP_ITEMS.map((i) => i.id));
