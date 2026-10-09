import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Segmented } from '@/components/Segmented';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { ChatDrafts } from '@/components/tara/ChatDrafts';
import { TaraFace } from '@/components/tara/TaraFace';
import { startLiveTranscription, type LiveTranscription } from '@/lib/audio/liveTranscriber';
import { askTara, planQuests, type PlannedDraft } from '@/lib/chat/planQuests';
import { useT } from '@/lib/i18n/translate';
import { declareQuest } from '@/lib/quests/declareQuest';
import { QUEST_ICON, questName } from '@/lib/quests/questLook';
import { atTime, formatWhen, parseWhen, type When } from '@/lib/quests/schedule';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';
import { errorMessage } from '@/utils/errorMessage';

type Mode = 'plan' | 'ask';
type Msg = {
  id: number;
  from: 'user' | 'tara';
  text: string;
  drafts?: PlannedDraft[];
  day?: When['day'];
  status?: 'pending' | 'added' | 'dropped';
  /** which mode the message belongs to; only Ask messages form the open-chat history */
  mode: Mode;
};

let nextId = 1;

/**
 * Tara's chat on Home. "Plan" turns what you say into quest cards you confirm (points still come from the fixed
 * rules); a day without a time uses your usual time for that kind of quest, or Tara asks. "Ask" is open chat.
 */
export function TaraChat({ greeting, onFocusInput }: { greeting: string; /** lets Home scroll the chat above the keyboard */ onFocusInput?: () => void }) {
  const t = useT();
  const events = useGameStore((s) => s.events);
  const level = useGameStore((s) => s.state.level.level);
  const append = useGameStore((s) => s.append);
  const [mode, setMode] = useState<Mode>('plan');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isVoice, setIsVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const listening = useRef<LiveTranscription | null>(null);
  const scroller = useRef<ScrollView>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // hold to talk, release to send: the words show in the box while you speak, then go out as a normal message
  const startVoice = async () => {
    if (listening.current || isBusy) return;
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return;
    setInput('');
    listening.current = startLiveTranscription('auto', setInput);
    setIsListening(true);
  };
  const stopVoice = async () => {
    const session = listening.current;
    if (!session) return;
    listening.current = null;
    setIsListening(false);
    setIsFinishing(true);
    const { text } = await session.stop();
    setIsFinishing(false);
    if (text.trim()) await send(text);
    else push({ from: 'tara', text: t("I didn't catch that. Hold the button a bit longer while you talk?", 'Hindi ko narinig. Pindutin nang mas matagal habang nagsasalita?') });
  };

  const push = (msg: Omit<Msg, 'id' | 'mode'>) => setMessages((all) => [...all, { ...msg, mode, id: nextId++ }]);
  const update = (id: number, change: Partial<Msg>) => setMessages((all) => all.map((m) => (m.id === id ? { ...m, ...change } : m)));
  const pending = [...messages].reverse().find((m) => m.status === 'pending');

  const draftsReply = (drafts: PlannedDraft[]) => {
    const missing = drafts.find((d) => d.needs_time);
    return missing
      ? t(
          `What time do you usually do "${missing.title}"? I'll remember it next time.`,
          `Anong oras mo karaniwang ginagawa ang "${missing.title}"? Tatandaan ko sa susunod.`,
        )
      : t('Here is your plan. Add it?', 'Ito ang plano mo. Idagdag na?');
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || isBusy) return;
    setInput('');
    push({ from: 'user', text: message });
    setIsBusy(true);
    try {
      if (mode === 'ask') {
        const history = [...messages.filter((m) => m.mode === 'ask' && m.text), { from: 'user' as const, text: message }].map((m) => ({
          role: m.from === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));
        const id = nextId++;
        setMessages((all) => [...all, { id, mode: 'ask', from: 'tara', text: '' }]);
        try {
          const reply = await askTara(history, (soFar) => update(id, { text: soFar }));
          update(id, { text: reply });
        } catch (err) {
          update(id, { text: t(`Sorry, I got stuck (${errorMessage(err)}). Try again?`, `Pasensya, natigil ako (${errorMessage(err)}). Subukan ulit?`) });
        }
        return;
      }
      // a short time-only answer fills in or changes the time on the plan waiting for confirmation
      const when = parseWhen(message);
      if (pending?.drafts && when.time && message.length <= 30) {
        const time = when.time;
        const drafts = pending.drafts.map((d) => ({
          ...d,
          needs_time: false,
          scheduled_at: atTime(when.day ?? pending.day, time, Date.now()),
        }));
        update(pending.id, { drafts });
        push({ from: 'tara', text: draftsReply(drafts) });
        return;
      }
      if (pending) update(pending.id, { status: 'dropped' });
      const drafts = planQuests(message, events, level);
      push({
        from: 'tara',
        text: draftsReply(drafts),
        drafts,
        day: when.day,
        status: 'pending',
      });
    } catch (err) {
      push({
        from: 'tara',
        text: t(`Sorry, I got stuck (${errorMessage(err)}). Try again?`, `Pasensya, natigil ako (${errorMessage(err)}). Subukan ulit?`),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const confirm = (msg: Msg) => {
    if (!msg.drafts) return;
    for (const d of msg.drafts) declareQuest(append, d);
    update(msg.id, { status: 'added' });
    const timed = msg.drafts.find((d) => d.scheduled_at);
    push({
      from: 'tara',
      text: timed?.scheduled_at
        ? t(
            `Added! I'll remind you ${formatWhen(timed.scheduled_at, Date.now(), t)}.`,
            `Naidagdag! Ipapaalala ko ${formatWhen(timed.scheduled_at, Date.now(), t)}.`,
          )
        : t('Added to your quests!', 'Naidagdag sa Gawain mo!'),
    });
  };

  const removeDraft = (msg: Msg, index: number) => {
    const drafts = (msg.drafts ?? []).filter((_, i) => i !== index);
    update(msg.id, drafts.length ? { drafts } : { drafts, status: 'dropped' });
  };

  const holdLabel = isListening
    ? t('Listening... release to send', 'Nakikinig... bitawan para ipadala')
    : isFinishing
      ? t('Got it, sending...', 'Narinig ko, ipinapadala...')
      : isBusy
        ? t('Tara is thinking...', 'Nag-iisip si Tara...')
        : t('Hold to talk', 'Pindutin at magsalita');
  const hint = mode === 'plan' ? t("I'm going to the gym tomorrow", 'Magji-gym ako bukas') : t('Ask Tara anything', 'Magtanong kay Tara');

  return (
    <PolyFrame cut={14} fill={PALETTE.white} stroke={PALETTE.banig300} strokeWidth={2.5}>
      <View className="gap-3 p-3.5">
        <View className="flex-row items-start gap-3">
          <TaraFace size={44} />
          <Text className="flex-1 pt-1 text-base leading-6 text-ink-900">{greeting}</Text>
        </View>
        <Segmented
          options={[
            { value: 'plan', label: t('Plan quests', 'Magplano'), icon: 'scroll' },
            { value: 'ask', label: t('Ask Tara', 'Tanungin si Tara'), icon: 'sparkle' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {messages.length > 0 ? (
          <ScrollView
            ref={scroller}
            className="max-h-80"
            contentContainerClassName="gap-2.5"
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m) => (
              <View key={m.id} className={m.from === 'user' ? 'items-end' : 'items-start'}>
                <PolyFrame cut={8} fill={m.from === 'user' ? PALETTE.ink900 : PALETTE.banig100}>
                  <Text className={`max-w-72 px-3 py-2 text-base ${m.from === 'user' ? 'text-banig-50' : 'text-ink-900'}`}>{m.text || '...'}</Text>
                </PolyFrame>
                {m.drafts && (m.status === 'pending' || m.status === 'added') ? (
                  <ChatDrafts drafts={m.drafts} status={m.status} onRemove={(i) => removeDraft(m, i)} onPickTime={(c) => void send(c)} onConfirm={() => confirm(m)} />
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isVoice ? t('Type instead', 'Mag-type na lang') : t('Talk instead', 'Magsalita na lang')}
            onPress={() => setIsVoice((v) => !v)}
            className="h-12 w-10 items-center justify-center"
          >
            <PixelIcon name={isVoice ? 'keyboard' : 'mic'} size={22} color={PALETTE.tara500} />
          </Pressable>
          {isVoice ? (
            <View className="flex-1">
              <PolyFrame cut={8} fill={PALETTE.banig50} stroke={isListening ? PALETTE.leaf500 : PALETTE.banig300}>
                <Text className={`min-h-12 px-3 py-3 text-base ${input ? 'text-ink-900' : 'text-tara-300'}`} numberOfLines={3}>
                  {input || hint}
                </Text>
              </PolyFrame>
            </View>
          ) : (
            <>
              <View className="flex-1">
                <PolyFrame cut={8} fill={PALETTE.banig50} stroke={PALETTE.banig300}>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    onFocus={onFocusInput}
                    onSubmitEditing={() => void send(input)}
                    placeholder={hint}
                    placeholderTextColor={PALETTE.tara300}
                    cursorColor={PALETTE.ink900}
                    returnKeyType="send"
                    className="min-h-12 px-3 text-base text-ink-900"
                  />
                </PolyFrame>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Send', 'Ipadala')} disabled={isBusy || !input.trim()} onPress={() => void send(input)}>
                <PolyFrame cut={8} fill={PALETTE.ink900}>
                  <View className="h-12 w-12 items-center justify-center" style={{ opacity: isBusy || !input.trim() ? 0.5 : 1 }}>
                    {isBusy ? <ActivityIndicator color={PALETTE.sipag400} /> : <PixelIcon name="arrow" size={20} color={PALETTE.sipag400} />}
                  </View>
                </PolyFrame>
              </Pressable>
            </>
          )}
        </View>

        {isVoice ? (
          // the hold button sits on its own row, centered, so live words never move it under the thumb
          <View className="items-center gap-2 pt-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Hold to talk', 'Pindutin para magsalita')}
              disabled={isBusy || isFinishing}
              onPressIn={() => void startVoice()}
              onPressOut={() => void stopVoice()}
            >
              <PolyFrame cut={22} fill={isListening ? PALETTE.leaf500 : PALETTE.ink900} depth={isListening ? 0 : 5} depthColor={PALETTE.tara700}>
                <View className="h-20 w-20 items-center justify-center" style={{ marginTop: isListening ? 5 : 0, opacity: isBusy || isFinishing ? 0.6 : 1 }}>
                  {isBusy || isFinishing ? (
                    <ActivityIndicator size="large" color={PALETTE.sipag400} />
                  ) : (
                    <PixelIcon name="mic" size={36} color={isListening ? PALETTE.white : PALETTE.sipag400} />
                  )}
                </View>
              </PolyFrame>
            </Pressable>
            <Text className={`font-pixel text-base ${isListening ? 'text-leaf-700' : 'text-tara-700'}`}>{holdLabel}</Text>
          </View>
        ) : null}
      </View>
    </PolyFrame>
  );
}
