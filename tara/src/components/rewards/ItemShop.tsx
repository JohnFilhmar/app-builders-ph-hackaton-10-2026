import { Alert, Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { BlockBar } from '@/components/tara/LevelBar';
import { newEventId } from '@/lib/game/completeQuest';
import { useT } from '@/lib/i18n/translate';
import { SHOP_ITEMS, type ShopItem } from '@/lib/store/items';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

const KIND_LABEL = { backdrop: ['Backdrop', 'Tanawin'], frame: ['Frame', 'Kuwadro'], aura: ['Aura', 'Aura'] } as const;

/** The item shop: backdrops, frames and auras bought with Sipag. Spending never lowers your level. */
export function ItemShop() {
  const t = useT();
  const balance = useGameStore((s) => s.state.pabuyaBalance);
  const owned = useGameStore((s) => s.state.ownedItems);
  const append = useGameStore((s) => s.append);

  const buy = (item: ShopItem) =>
    Alert.alert(
      t(`Buy ${item.name_en}?`, `Bilhin ang ${item.name_tl}?`),
      t(`This spends ${item.price} Sipag. Your level stays the same.`, `Gagastos ito ng ${item.price} Sipag. Hindi bababa ang level mo.`),
      [
        { text: t('Not yet', 'Hindi pa'), style: 'cancel' },
        { text: t('Buy', 'Bilhin'), onPress: () => append({ id: newEventId('evt'), type: 'item_bought', at: Date.now(), payload: { item_id: item.id, price: item.price } }) },
      ],
    );

  return (
    <View className="flex-row flex-wrap gap-2">
      {SHOP_ITEMS.map((item) => {
        const isOwned = owned.includes(item.id);
        const canBuy = !isOwned && balance >= item.price;
        return (
          <View key={item.id} className="w-[48.5%]">
            <PolyFrame cut={10} fill={isOwned ? PALETTE.leaf100 : PALETTE.white} stroke={canBuy ? PALETTE.sipag500 : PALETTE.banig300} strokeWidth={canBuy ? 3.5 : 2.5}>
              <View className="gap-2 p-3">
                <PolyFrame cut={8} fill={PALETTE.ink900}>
                  {/* placeholder until the item's art lands */}
                  <View className="h-20 items-center justify-center">
                    <PixelIcon name={item.icon} size={36} color={PALETTE.sipag400} />
                  </View>
                </PolyFrame>
                <Text className="font-pixel text-xs text-tara-700">{t(KIND_LABEL[item.kind][0], KIND_LABEL[item.kind][1])}</Text>
                <Text className="min-h-10 text-sm font-bold text-ink-900">{t(item.name_en, item.name_tl)}</Text>
                {isOwned ? (
                  <View className="h-10 flex-row items-center gap-1.5">
                    <PixelIcon name="check" size={16} color={PALETTE.leaf700} />
                    <Text className="font-pixel text-sm text-leaf-700">{t('Yours', 'Sa iyo na')}</Text>
                  </View>
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
