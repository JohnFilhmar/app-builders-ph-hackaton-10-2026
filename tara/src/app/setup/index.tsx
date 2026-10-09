import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { AvatarStage } from '@/components/avatar/AvatarStage';
import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { SceneBackdrop } from '@/components/scene/SceneBackdrop';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { useT } from '@/lib/i18n/translate';
import { useSetupStore } from '@/lib/stores/setupStore';
import { PALETTE } from '@/lib/theme/palette';
import type { Lang } from '@/types/chat';

type Step = 'welcome' | 'name' | 'hero';

function Choice({ label, isPicked, onPress }: { label: string; isPicked: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: isPicked }} onPress={onPress} className="flex-1">
      <PolyFrame cut={10} fill={isPicked ? PALETTE.sipag400 : PALETTE.white} stroke={isPicked ? PALETTE.sipag600 : PALETTE.banig300} strokeWidth={isPicked ? 3.5 : 2.5}>
        <Text className="py-4 text-center font-pixel-bold text-lg text-ink-900">{label}</Text>
      </PolyFrame>
    </Pressable>
  );
}

function Perk({ icon, text }: { icon: PixelIconName; text: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <PolyFrame cut={6} fill={PALETTE.ink900}>
        <View className="h-9 w-9 items-center justify-center">
          <PixelIcon name={icon} size={18} color={PALETTE.sipag400} />
        </View>
      </PolyFrame>
      <Text className="flex-1 text-base text-ink-900">{text}</Text>
    </View>
  );
}

const STEPS: Step[] = ['welcome', 'name', 'hero'];

/** First launch: language and welcome, the hero's name, then the hero. Model setup follows. */
export default function SetupWelcome() {
  const t = useT();
  const { language, setLanguage, heroName, setHeroName } = useSetupStore();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState(heroName);

  const dots = (
    <View className="flex-row justify-center gap-1.5">
      {STEPS.map((s) => (
        <View key={s} className={`h-2 ${s === step ? 'w-6 bg-ink-900' : 'w-2 bg-banig-300'}`} />
      ))}
    </View>
  );

  if (step === 'welcome') {
    return (
      <SafeAreaView className="flex-1 bg-banig-50">
        <View className="flex-1">
          <SceneBackdrop slot="onboarding_backdrop" tone="dusk" />
          <View className="items-center pt-10">
            <Text className="font-pixel-bold text-6xl text-ink-900">TARA</Text>
            <Text className="font-pixel text-lg tracking-widest text-sipag-600">LEVEL UP!</Text>
            <Text className="mt-2 text-base text-tara-700">{t('Your day, your adventure.', 'Ang araw mo, ang laro mo.')}</Text>
          </View>
          <AvatarStage className="flex-1" fx="aura" />
        </View>
        <View className="gap-4 bg-banig-50 px-5 pb-5 pt-4">
          <Text className="font-pixel-bold text-xl text-ink-900">{t('Turn your tasks into quests.', 'Gawing laro ang mga gawain mo.')}</Text>
          <View className="gap-2.5">
            <Perk icon="camera" text={t('Prove it with a photo, a quiz or your voice', 'Patunayan gamit ang litrato, quiz o boses')} />
            <Perk icon="star" text={t('Earn Sipag and level up your hero', 'Kumita ng Sipag at i-level up ang bida')} />
            <Perk icon="sparkle" text={t('Tara checks it on your phone, no signal needed', 'Sa phone mismo tumitingin si Tara, kahit walang signal')} />
          </View>
          <View className="gap-1.5">
            <Text className="font-pixel text-sm text-tara-700">{t('Language', 'Wika')}</Text>
            <View className="flex-row gap-2">
              {(['en', 'tl'] as const satisfies readonly Lang[]).map((l) => (
                <Choice key={l} label={l === 'en' ? 'English' : 'Tagalog'} isPicked={language === l} onPress={() => setLanguage(l)} />
              ))}
            </View>
          </View>
          <Button
            label={t('Get started', 'Magsimula')}
            onPress={() => {
              setLanguage(language);
              setStep('name');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-banig-50">
      <View className="flex-1 gap-5 p-5">
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" accessibilityLabel={t('Back', 'Bumalik')} onPress={() => setStep(step === 'hero' ? 'name' : 'welcome')} className="-ml-2 h-11 w-11 items-center justify-center">
            <PixelIcon name="back" size={22} color={PALETTE.ink900} />
          </Pressable>
          {dots}
          <View className="w-11" />
        </View>

        {step === 'name' ? (
          <>
            <Text className="font-pixel-bold text-3xl text-ink-900">{t('What should we call you?', 'Anong itatawag namin sa iyo?')}</Text>
            <Text className="text-base text-tara-700">{t('This is your journey. Your hero grows with you.', 'Ito ang paglalakbay mo. Kasabay mong lalakas ang bida.')}</Text>
            <Field label={t('Your name', 'Pangalan mo')} value={name} onChangeText={setName} placeholder="Gab" autoFocus maxLength={24} returnKeyType="next" />
            <Button
              label={t('Continue', 'Tuloy')}
              disabled={!name.trim()}
              onPress={() => {
                setHeroName(name);
                setStep('hero');
              }}
            />
          </>
        ) : (
          <>
            <TaraBubble text={t(`Hi ${heroName}! I'm Tara. I check that your tasks really happened, and you level up. Who's your hero?`, `Kumusta ${heroName}! Ako si Tara. Tinitingnan ko kung nagawa mo talaga, at nagle-level up ka. Sino ang bida mo?`)} />
            <View className="flex-1">
              <SceneBackdrop slot="onboarding_backdrop" />
              <AvatarStage className="flex-1" fx="aura" />
            </View>
            <Button label={t('Next: get Tara ready', 'Susunod: ihanda si Tara')} onPress={() => router.push('/setup/models')} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
