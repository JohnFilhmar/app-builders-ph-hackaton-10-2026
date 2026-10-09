import { Alert, Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { HeroFrame } from '@/components/scene/HeroFrame';
import { HeroFx } from '@/components/scene/HeroFx';
import { ShopBackdrop } from '@/components/scene/ShopBackdrop';
import { BlockBar } from '@/components/tara/LevelBar';
import { newEventId } from '@/lib/game/completeQuest';
import { useT } from '@/lib/i18n/translate';
import { SHOP_ITEMS, type ShopItem } from '@/lib/store/items';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

const KIND_LABEL = { backdrop: ['Backdrop', 'Tanawin'], frame: ['Frame', 'Kuwadro'], aura: ['Aura', 'Aura'] } as const;

/** What the item looks like, drawn with the same component that shows it on the hero. */
function ItemPreview({ item }: { item: ShopItem }) {
  if (item.kind === 'backdrop') return <ShopBackdrop itemId={item.id} />;
  if (item.kind === 'frame') return <HeroFrame itemId={item.id} />;
  return (
    <View className="absolute inset-0 items-center justify-center">
      <HeroFx slot="aura" size={80} auraItem={item.id} />
    </View>
  );
}

/**
 * The item shop: backdrops, frames and auras bought with Sipag. Spending never lowers your level. A purchase is put
 * on right away; an owned item toggles between equipped and off.
 */
export function ItemShop() {
  const t = useT();
  const balance = useGameStore((s) => s.state.pabuyaBalance);
  const owned = useGameStore((s) => s.state.ownedItems);
  const equipped = useGameStore((s) => s.state.equipped);
  const append = useGameStore((s) => s.append);

  const buy = (item: ShopItem) =>
    Alert.alert(
      t(`Buy ${item.name_en}?`, `Bilhin ang ${item.name_tl}?`),
      t(`This spends ${item.price} Sipag. Your level stays the same.`, `Gagastos ito ng ${item.price} Sipag. Hindi bababa ang level mo.`),
      [
        { text: t('Not yet', 'Hindi pa'), style: 'cancel' },
        {
          text: t('Buy', 'Bilhin'),
          onPress: () => {
            append({ id: newEventId('evt'), type: 'item_bought', at: Date.now(), payload: { item_id: item.id, price: item.price } });
            equip(item, true);
          },
        },
      ],
    );

  const equip = (item: ShopItem, isOn: boolean) =>
    append({ id: newEventId('evt'), type: 'item_equipped', at: Date.now(), payload: { slot: item.kind, item_id: isOn ? item.id : null } });

  return (
    <View className="flex-row flex-wrap gap-2">
      {SHOP_ITEMS.map((item) => {
        const isOwned = owned.includes(item.id);
        const canBuy = !isOwned && balance >= item.price;
        return (
          <View key={item.id} className="w-[48.5%]">
            <PolyFrame cut={10} fill={isOwned ? PALETTE.leaf100 : PALETTE.white} stroke={canBuy ? PALETTE.sipag500 : PALETTE.banig300} strokeWidth={canBuy ? 3.5 : 2.5}>
              <View className="gap-2 p-3">
                <View className="h-20 overflow-hidden bg-banig100">
                  <ItemPreview item={item} />
                </View>
                <Text className="font-pixel text-xs text-tara-700">{t(KIND_LABEL[item.kind][0], KIND_LABEL[item.kind][1])}</Text>
                <Text className="min-h-10 text-sm font-bold text-ink-900">{t(item.name_en, item.name_tl)}</Text>
                {isOwned ? (
                  <Pressable accessibilityRole="button" onPress={() => equip(item, equipped[item.kind] !== item.id)}>
                    <PolyFrame cut={6} fill={equipped[item.kind] === item.id ? PALETTE.leaf500 : PALETTE.white} stroke={PALETTE.leaf700}>
                      <View className="h-10 flex-row items-center justify-center gap-1.5">
                        {equipped[item.kind] === item.id ? <PixelIcon name="check" size={16} color={PALETTE.white} /> : null}
                        <Text className={`font-pixel text-sm ${equipped[item.kind] === item.id ? 'text-white' : 'text-leaf-700'}`}>
                          {equipped[item.kind] === item.id ? t('Wearing', 'Suot') : t('Wear', 'Isuot')}
                        </Text>
                      </View>
                    </PolyFrame>
                  </Pressable>
                ) : canBuy ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={t(`Buy for ${item.price} Sipag`, `Bilhin sa ${item.price} Sipag`)} onPress={() => buy(item)}>
                    <PolyFrame cut={6} fill={PALETTE.sipag400} stroke={PALETTE.sipag600}>
                      <Text className="py-2.5 text-center text-ink-900">
                        <Text className="font-num text-base">{item.price}</Text>
                        <Text className="font-pixel text-sm"> Sipag</Text>
                      </Text>
                    </PolyFrame>
                  </Pressable>
                ) : (
                  <View className="h-10 justify-center gap-1">
                    <BlockBar progress={balance / item.price} blocks={8} />
                    <Text className="font-num text-xs text-tara-700">
                      {balance} / {item.price}
                    </Text>
                  </View>
                )}
              </View>
            </PolyFrame>
          </View>
        );
      })}
    </View>
  );
}
