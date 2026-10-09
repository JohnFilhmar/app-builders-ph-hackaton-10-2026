import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { startLiveTranscription, type LiveTranscription } from '@/lib/audio/liveTranscriber';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';
import type { Lang } from '@/types/chat';

type HoldToTalkProps = {
  lang: Lang | 'auto';
  prompt?: string;
  label: string;
  onLiveText: (textSoFar: string) => void;
  onDone: (result: { text: string; seconds: number }) => void;
  disabled?: boolean;
};

/**
 * The only way Tara listens: hold to talk, release to stop. A "Nakikinig" badge glows while held, words appear live,
 * and audio slices are deleted as soon as they are transcribed.
 */
export function HoldToTalk({ lang, prompt, label, onLiveText, onDone, disabled = false }: HoldToTalkProps) {
  const t = useT();
  const session = useRef<LiveTranscription | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = async () => {
    if (session.current || isFinishing) return;
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError(t('Tara needs the microphone for this. Allow it in Settings.', 'Kailangan ni Tara ang mikropono. Payagan ito sa Settings.'));
      return;
    }
    setError(null);
    session.current = startLiveTranscription(lang, onLiveText, prompt);
    setIsListening(true);
  };

  const end = async () => {
    const current = session.current;
    if (!current) return;
    session.current = null;
    setIsListening(false);
    setIsFinishing(true);
    const result = await current.stop();
    setIsFinishing(false);
    onDone(result);
  };

  const isOff = disabled || isFinishing;
  return (
    <View className="items-center gap-3">
      <Text className={`font-pixel text-sm ${isListening ? 'text-leaf-700' : 'text-tara-700'}`}>
        {isListening ? t('Listening...', 'Nakikinig...') : isFinishing ? t('One moment...', 'Sandali...') : ' '}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={isOff} onPressIn={() => void begin()} onPressOut={() => void end()} style={{ opacity: isOff ? 0.5 : 1 }}>
        <PolyFrame cut={44} fill={isListening ? PALETTE.leaf500 : PALETTE.ink900} depth={isListening ? 0 : 6} depthColor={PALETTE.tara700} stroke={isListening ? PALETTE.leaf700 : undefined} strokeWidth={4}>
          <View className="h-40 w-40 items-center justify-center gap-2" style={{ marginTop: isListening ? 6 : 0 }}>
            <PixelIcon name="mic" size={44} color={isListening ? PALETTE.white : PALETTE.sipag400} />
            <Text className="px-3 text-center font-pixel-bold text-base text-banig-50">{isListening ? t('Release to stop', 'Bitawan para tumigil') : label}</Text>
          </View>
        </PolyFrame>
      </Pressable>
      {error ? <Text className="text-center text-sm text-tara-700">{error}</Text> : null}
    </View>
  );
}
