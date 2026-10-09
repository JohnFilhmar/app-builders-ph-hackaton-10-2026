import { ActivityIndicator, Text, View } from 'react-native';

type TaraBubbleProps = { text: string; isThinking?: boolean };

/** Tara the tarsier speaking. While thinking, a spinner shows so a slow model never looks frozen. */
export function TaraBubble({ text, isThinking = false }: TaraBubbleProps) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-tara-500">
        <Text className="text-lg font-bold text-banig-50">T</Text>
      </View>
      <View className="flex-1 flex-row items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
        {isThinking ? <ActivityIndicator color="#8B5A2B" /> : null}
        <Text className="flex-1 text-base text-tara-900">{text}</Text>
      </View>
    </View>
  );
}
