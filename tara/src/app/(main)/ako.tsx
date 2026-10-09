import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { BlockBar } from '@/components/tara/LevelBar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SipagBalance } from '@/components/rewards/SipagBalance';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { aiReach, useAiStore } from '@/lib/ai/aiSources';
import { setNanayMode } from '@/lib/alerts/reminders';
import { newEventId } from '@/lib/game/completeQuest';
import { buildDemoEvents } from '@/lib/game/demoSeed';
import { useT, type Translate } from '@/lib/i18n/translate';
import { useGameStore } from '@/lib/stores/gameStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { PALETTE } from '@/lib/theme/palette';
import type { AchievementId } from '@/types/gameEvents';

const achievements = (t: Translate): { id: AchievementId; name: string; how: string; isHidden?: boolean }[] => [
  { id: 'unang_hakbang', name: 'Unang Hakbang', how: t('Finish your first quest', 'Tapusin ang unang Gawain') },
  { id: 'unang_patunay', name: 'Unang Patunay', how: t('Finish a quest with Proven (3x)', 'Tapusin ang Gawain na may Patunay (3x)') },
  { id: 'malinis_na_kwarto', name: 'Malinis na Kwarto', how: t('10 cleaning quests, Proven', '10 Linis na may Patunay') },
  { id: 'tatlong_araw', name: 'Tatlong Araw', how: t('3-day streak', '3 araw na sunod-sunod') },
  { id: 'isang_linggo', name: 'Isang Linggo', how: t('7-day streak', '7 araw na sunod-sunod') },
  { id: 'perpekto', name: 'Perpekto', how: t('Every question right on a study quiz', 'Perpekto sa Aral quiz') },
  { id: 'basa_bida', name: 'Basa Bida', how: t('30 minutes of reading aloud', '30 minutong pagbasa nang malakas') },
  { id: 'pabuya_natanggap', name: 'Pabuya Natanggap', how: t('Claim your first reward', 'Kunin ang unang Pabuya') },
  { id: 'walang_signal', name: 'Walang Signal', how: t('Proven in airplane mode', 'Patunay habang naka-airplane mode'), isHidden: true },
];

/** The Profile tab: who the player is and their stats, then treats bought with Sipag, badges earned, and settings. */
export default function Ako() {
  const t = useT();
  const state = useGameStore((s) => s.state);
  const append = useGameStore((s) => s.append);
  const replaceAll = useGameStore((s) => s.replaceAll);
  const { isNanayMode, setNanayMode: setIsNanay, language, setLanguage } = useSetupStore();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const isUnlocked = state.level.level >= 2;
  const reach = aiReach(useAiStore((s) => s.sources));

  const add = () => {
    const value = Number(price);
    if (!title.trim() || !Number.isInteger(value) || value <= 0) return;
    append({ id: newEventId('evt'), type: 'pabuya_created', at: Date.now(), payload: { pabuya_id: newEventId('pabuya'), title: title.trim(), price: value } });
    setTitle('');
    setPrice('');
  };

  const claim = (id: string, itemTitle: string) =>
    Alert.alert(t(`Claim ${itemTitle}?`, `Kunin na ang ${itemTitle}?`), t('This spends Sipag from your reward balance. Your level stays.', 'Gagastos ito ng Sipag sa Pabuya balance. Hindi bababa ang level mo.'), [
      { text: t('Not yet', 'Hindi pa'), style: 'cancel' },
      { text: t('Claim!', 'Kunin!'), onPress: () => append({ id: newEventId('evt'), type: 'pabuya_claimed', at: Date.now(), payload: { pabuya_id: id } }) },
    ]);

  const loadDemo = () =>
    Alert.alert('Load demo state?', "Replaces this phone's progress with the stage demo (370 Sipag, level 2).", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load', style: 'destructive', onPress: () => replaceAll(buildDemoEvents(Date.now())) },
    ]);

  return (
    <TaraScreen title={t('Profile', 'Ako')}>
      <ProfileHeader />

      <Text className="pt-2 font-pixel-bold text-xl text-ink-900">{t('Rewards', 'Pabuya')}</Text>
      <Text className="text-sm text-tara-700">{t('Spend Sipag on treats you set yourself.', 'Gastusin ang Sipag sa sariling premyo.')}</Text>
      <SipagBalance />

      <Text className="pt-2 font-pixel-bold text-xl text-ink-900">{t('Your own treats', 'Sariling premyo')}</Text>
      {!isUnlocked ? (
        <TaraBubble text={t('Rewards open at Level 2. Almost there!', 'Bubukas ang Pabuya sa Level 2. Malapit na!')} />
      ) : (
        <>
          {state.pabuya.length === 0 ? <TaraBubble text={t('What treat do you want? Try "30 min ML", "Merienda" or "1 episode".', 'Anong premyo ang gusto mo? Subukan ang "30 min ML", "Merienda" o "1 episode".')} /> : null}
          {state.pabuya.map((item) => {
            const canClaim = !item.claimed && state.pabuyaBalance >= item.price;
            return (
              <PolyFrame key={item.id} cut={12} fill={item.claimed ? PALETTE.leaf100 : PALETTE.white} stroke={canClaim ? PALETTE.sipag500 : PALETTE.banig300} strokeWidth={canClaim ? 3.5 : 2.5}>
                <View className="gap-2 p-3.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-ink-900">{item.title}</Text>
                      <Text className="font-pixel text-sm text-tara-700">{item.price} Sipag</Text>
                    </View>
                    {item.claimed ? (
                      <View className="flex-row items-center gap-1.5">
                        <PixelIcon name="check" size={16} color={PALETTE.leaf700} />
                        <Text className="font-pixel text-sm text-leaf-700">{t('Claimed', 'Natanggap')}</Text>
                      </View>
                    ) : canClaim ? (
                      <Pressable accessibilityRole="button" onPress={() => claim(item.id, item.title)}>
                        <PolyFrame cut={6} fill={PALETTE.sipag400}>
                          <Text className="px-3.5 py-2.5 font-pixel-bold text-sm text-ink-900">{t('Claim', 'Kunin')}</Text>
                        </PolyFrame>
                      </Pressable>
                    ) : null}
                  </View>
                  {!item.claimed && !canClaim ? <BlockBar progress={state.pabuyaBalance / item.price} blocks={12} /> : null}
                </View>
              </PolyFrame>
            );
          })}
          <Card title={t('New reward', 'Bagong Pabuya')}>
            <Field label={t('Treat', 'Premyo')} value={title} onChangeText={setTitle} placeholder="Milk tea" />
            <Field label={t('Price in Sipag', 'Presyo sa Sipag')} value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="500" />
            <Button label={t('Add reward', 'Idagdag')} variant="secondary" icon="plus" onPress={add} disabled={!title.trim() || !price} />
          </Card>
        </>
      )}

      <Text className="pt-2 font-pixel-bold text-xl text-ink-900">{t('Badges', 'Mga Badge')}</Text>
      <View className="flex-row flex-wrap gap-2">
        {achievements(t).map((a) => {
          const isEarned = state.achievements.includes(a.id);
          const isSecret = a.isHidden && !isEarned;
          return (
            <View key={a.id} className="w-[48.5%]">
              <PolyFrame cut={10} fill={isEarned ? PALETTE.sipag300 : PALETTE.white} stroke={isEarned ? PALETTE.sipag600 : PALETTE.banig300}>
                <View className="min-h-24 gap-1.5 p-3">
                  <PixelIcon name={isEarned ? 'star' : 'lock'} size={20} color={isEarned ? PALETTE.ink900 : PALETTE.tara300} />
                  <Text className="font-pixel text-sm text-ink-900">{isSecret ? '???' : a.name}</Text>
                  <Text className="text-xs text-tara-700">{isSecret ? t('Secret', 'Lihim') : a.how}</Text>
                </View>
              </PolyFrame>
            </View>
          );
        })}
      </View>

      <Card title={t('Settings', 'Settings')}>
        <View className="gap-2">
          <Text className="font-pixel text-sm text-tara-700">{t('Language', 'Wika')}</Text>
          <Segmented
            options={[
              { value: 'en', label: 'English', icon: 'globe' },
              { value: 'tl', label: 'Tagalog', icon: 'globe' },
            ]}
            value={language}
            onChange={setLanguage}
          />
        </View>
        <View className="flex-row items-center justify-between pt-2">
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-ink-900">Nanay Mode</Text>
            <Text className="text-sm text-tara-700">{t('Daily reminders at 6:30 and 19:00, even with the app closed.', 'Paalala araw-araw, 6:30 at 19:00, kahit sarado ang app.')}</Text>
          </View>
          <Switch
            value={isNanayMode}
            trackColor={{ true: PALETTE.sipag500, false: PALETTE.banig300 }}
            thumbColor={PALETTE.white}
            onValueChange={(on) => {
              void setNanayMode(on).then(setIsNanay);
            }}
          />
        </View>
        <Pressable onLongPress={loadDemo} delayLongPress={1200}>
          <Text className="pt-2 text-xs text-tara-500">{reach === 'offline' ? t('Tara 0.1.0 · offline · nothing leaves this phone', 'Tara 0.1.0 · offline · walang lumalabas sa phone') : t(`Tara 0.1.0 · AI runs on ${reach === 'cloud' ? 'the cloud' : 'a laptop'} for some jobs`, `Tara 0.1.0 · may AI na tumatakbo sa ${reach === 'cloud' ? 'cloud' : 'laptop'}`)}</Text>
        </Pressable>
      </Card>
    </TaraScreen>
  );
}
