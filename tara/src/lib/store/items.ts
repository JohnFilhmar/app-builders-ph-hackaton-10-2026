import type { PixelIconName } from '@/components/poly/PixelIcon';

export type ShopItem = { id: string; kind: 'companion' | 'aura' | 'outfit'; name_en: string; name_tl: string; price: number; icon: PixelIconName };

/**
 * What the shop sells for Sipag. Art is not in yet, so each item shows its pixel icon as a placeholder; buying records
 * ownership in the ledger so the items are already yours when the art lands.
 */
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'comp_mingming', kind: 'companion', name_en: 'Mingming the cat', name_tl: 'Si Mingming na pusa', price: 200, icon: 'heart' },
  { id: 'comp_bugoy', kind: 'companion', name_en: 'Bugoy the carabao calf', name_tl: 'Si Bugoy na kalabaw', price: 300, icon: 'heart' },
  { id: 'comp_haribon', kind: 'companion', name_en: 'Haribon the eaglet', name_tl: 'Si Haribon na agila', price: 500, icon: 'heart' },
  { id: 'aura_alitaptap', kind: 'aura', name_en: 'Firefly aura', name_tl: 'Aura ng alitaptap', price: 150, icon: 'sparkle' },
  { id: 'aura_bahaghari', kind: 'aura', name_en: 'Rainbow aura', name_tl: 'Aura ng bahaghari', price: 400, icon: 'sparkle' },
  { id: 'fit_salakot', kind: 'outfit', name_en: 'Salakot hat', name_tl: 'Salakot', price: 120, icon: 'star' },
  { id: 'fit_jersey', kind: 'outfit', name_en: 'Basketball jersey', name_tl: 'Jersey pang-basketball', price: 250, icon: 'star' },
  { id: 'fit_barong', kind: 'outfit', name_en: 'Barong', name_tl: 'Barong', price: 350, icon: 'star' },
];
