import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { startLiveTranscription, type LiveTranscription } from '@/lib/audio/liveTranscriber';
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
  const session = useRef<LiveTranscription | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = async () => {
    if (session.current || isFinishing) return;
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Tara needs the microphone for this. Allow it in Settings.');
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

  return (
    <View className="items-center gap-2">
      {isListening ? <Text className="rounded-full bg-leaf-500 px-3 py-1 text-sm font-bold text-white">● Nakikinig (Listening)</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || isFinishing}
        onPressIn={() => void begin()}
        onPressOut={() => void end()}
        className={`h-36 w-36 items-center justify-center rounded-full ${isListening ? 'bg-leaf-500' : 'bg-sipag-500'} ${disabled || isFinishing ? 'opacity-50' : ''}`}
      >
        <Text className="px-3 text-center text-base font-extrabold text-tara-900">{isFinishing ? 'Sandali...' : isListening ? 'Release to stop' : label}</Text>
      </Pressable>
      {error ? <Text className="text-sm text-tara-700">{error}</Text> : null}
    </View>
  );
}
