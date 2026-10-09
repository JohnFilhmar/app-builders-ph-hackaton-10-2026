import { Screen } from '@/components/Screen';
import { SpeechToTextPanel } from '@/components/SpeechToTextPanel';
import { TextToSpeechPanel } from '@/components/TextToSpeechPanel';

export default function VoiceScreen() {
  return (
    <Screen title="Voice" subtitle="Speech recognition, voice commands, speech output">
      <SpeechToTextPanel />
      <TextToSpeechPanel />
    </Screen>
  );
}
