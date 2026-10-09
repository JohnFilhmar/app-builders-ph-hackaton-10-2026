import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { CountRepsProof } from '@/components/quest/CountRepsProof';
import { QuizPanel } from '@/components/quest/QuizPanel';
import { QuizPrep } from '@/components/quest/QuizPrep';
import { ReadAloudProof } from '@/components/quest/ReadAloudProof';
import { ResultPanel } from '@/components/quest/ResultPanel';
import { BlockBar } from '@/components/tara/LevelBar';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { cancelQuestReminder } from '@/lib/alerts/questReminders';
import { checkBeforeAfter } from '@/lib/checks/beforeAfter';
import { checkReps } from '@/lib/checks/repCheck';
import { completeQuest } from '@/lib/game/completeQuest';
import { useT } from '@/lib/i18n/translate';
import { proofHint, QUEST_ICON, questName } from '@/lib/quests/questLook';
import { PASSAGES } from '@/lib/quests/questTypes';
import { useGameStore } from '@/lib/stores/gameStore';
import { useQuestStore, type QuestWork } from '@/lib/stores/questStore';
import { PALETTE } from '@/lib/theme/palette';
import type { ProofTier } from '@/types/gameEvents';
import type { CheckOutcome } from '@/types/quest';
import { errorMessage } from '@/utils/errorMessage';

type Phase = 'start' | 'preparing' | 'running' | 'proof' | 'checking' | 'result';

// reading and counting aloud ARE the task, so these skip the timer and go straight to the mic
const isVoiceQuest = (type: string) => type === 'basa' || type === 'ehersisyo';

async function takePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  // camera only: proof photos never come from the gallery
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, cameraType: ImagePicker.CameraType.back });
  return shot.canceled ? null : (shot.assets[0]?.uri ?? null);
}

const pad = (n: number) => String(n).padStart(2, '0');
// one shared empty value: a fresh {} per selector call would re-render forever
const NO_WORK: QuestWork = {};
const tierOf = (o: CheckOutcome | null): ProofTier | null => (o && (o.verdict === 'patunay' || o.verdict === 'nakita' || o.verdict === 'sabi_ko') ? o.verdict : null);

/** Runs one quest end to end: start step, timer, proof, Tara's check and the result. */
export default function QuestRun() {
  const t = useT();
  const { quest_id: questId } = useLocalSearchParams<{ quest_id: string }>();
  const openQuest = useGameStore((s) => s.state.openQuests.find((q) => q.quest_id === questId));
  // keep the quest after it completes, so the result screen can finish showing
  const snapshot = useRef(openQuest);
  if (openQuest) snapshot.current = openQuest;
  const quest = openQuest ?? snapshot.current;
  const events = useGameStore((s) => s.events);
  const multiplier = useGameStore((s) => s.state.streak.multiplier);
  const append = useGameStore((s) => s.append);
  const work = useQuestStore((s) => s.work[questId ?? ''] ?? NO_WORK);
  const patch = useQuestStore((s) => s.patch);
  const clear = useQuestStore((s) => s.clear);

  const [phase, setPhase] = useState<Phase>(() => (work.started_at ? (openQuest && isVoiceQuest(openQuest.quest_type) ? 'proof' : 'running') : 'start'));
  const [now, setNow] = useState(Date.now());
  const [stage, setStage] = useState('');
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [afterUri, setAfterUri] = useState<string | undefined>();
  const [isCommitted, setIsCommitted] = useState(false);
  const [passageId, setPassageId] = useState(work.passage_id ?? PASSAGES[0]?.id ?? '');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMs = work.started_at ? now - work.started_at : 0;
  const elapsedMin = work.started_at ? Math.max(1, Math.round(elapsedMs / 60_000)) : 0;
  const preview = useMemo(() => {
    const tier = tierOf(outcome);
    if (!quest || !tier) return null;
    return completeQuest(events, { quest_id: quest.quest_id, quest_type: quest.quest_type, minutes: elapsedMin, tier, disputed: false, evidence: outcome?.evidence }, Date.now());
  }, [quest, outcome, events, elapsedMin]);

  if (!quest || !questId) {
    return (
      <TaraScreen title={t('Already done', 'Tapos na ito')} canGoBack>
        <TaraBubble text={t('This quest is already done or was removed.', 'Tapos na o tinanggal na ang Gawain na ito.')} />
        <Button label={t('Back home', 'Bumalik sa Bahay')} onPress={() => router.replace('/bahay')} />
      </TaraScreen>
    );
  }
  const passage = PASSAGES.find((p) => p.id === passageId) ?? PASSAGES[0];
  const repTarget = work.rep_target ?? 10;

  const start = async () => {
    if (quest.quest_type === 'linis') {
      const uri = await takePhoto();
      if (!uri) return;
      patch(questId, { before_uri: uri });
    }
    if (quest.quest_type === 'aral') {
      const uri = await takePhoto();
      if (!uri) return;
      // the quiz is made now, before studying starts, so the timer only runs once it is ready
      patch(questId, { notes_uri: uri, quiz_status: 'generating' });
      setPhase('preparing');
      return;
    }
    if (quest.quest_type === 'basa') patch(questId, { passage_id: passageId });
    if (quest.quest_type === 'ehersisyo') patch(questId, { rep_target: repTarget });
    patch(questId, { started_at: Date.now() });
    setPhase(isVoiceQuest(quest.quest_type) ? 'proof' : 'running');
  };

  const startStudying = (patchWork: Partial<QuestWork>) => {
    patch(questId, { ...patchWork, started_at: Date.now() });
    setPhase('running');
  };

  const finishTask = () => {
    if (quest.quest_type === 'sariling') {
      setOutcome({ verdict: 'sabi_ko', said: t('Thank you! Your word counts here.', 'Salamat! Sapat ang salita mo dito.'), evidence: {} });
      setPhase('result');
    } else setPhase('proof');
  };

  const check = async (run: () => Promise<CheckOutcome>, firstStage: string) => {
    setStage(firstStage);
    setPhase('checking');
    try {
      setOutcome(await run());
    } catch (err) {
      setOutcome({ verdict: 'not_confirmed', said: t(`I had trouble checking (${errorMessage(err)}).`, `Nagkaproblema ako sa pag-check (${errorMessage(err)}).`), evidence: {} });
    }
    setPhase('result');
  };

  const runBeforeAfter = async () => {
    const uri = await takePhoto();
    const beforeUri = work.before_uri;
    if (!uri || !beforeUri) return;
    setAfterUri(uri);
    await check(() => checkBeforeAfter(quest.title, beforeUri, uri, setStage), t('Tara is looking...', 'Tumitingin si Tara...'));
  };

  const commit = (disputed: boolean) => {
    if (isCommitted) return;
    const tier = tierOf(outcome) ?? 'patunay';
    const event = completeQuest(events, { quest_id: questId, quest_type: quest.quest_type, minutes: elapsedMin, tier, disputed, evidence: outcome?.evidence }, Date.now());
    append(event);
    clear(questId);
    void cancelQuestReminder(questId);
    setIsCommitted(true);
    if (disputed && event.type === 'quest_completed') {
      const banked = event.payload.banked > 0 ? t(` +${event.payload.banked} more lands tomorrow morning.`, ` +${event.payload.banked} pa bukas ng umaga.`) : '';
      setOutcome({ verdict: 'sabi_ko', said: t(`I believe you. +${event.payload.xp} Sipag.${banked}`, `Naniniwala ako sa'yo. +${event.payload.xp} Sipag.${banked}`), evidence: {} });
    } else router.replace('/bahay');
  };

  return (
    <TaraScreen canGoBack={phase !== 'result'}>
      {phase !== 'result' ? (
        <PolyFrame cut={12} fill={PALETTE.white} stroke={PALETTE.banig300}>
          <View className="flex-row items-center gap-3 p-3.5">
            <PolyFrame cut={8} fill={PALETTE.ink900}>
              <View className="h-14 w-14 items-center justify-center">
                <PixelIcon name={QUEST_ICON[quest.quest_type]} size={28} color={PALETTE.sipag400} />
              </View>
            </PolyFrame>
            <View className="flex-1 gap-1">
              <Text className="font-pixel-bold text-xl text-ink-900" numberOfLines={2}>
                {quest.title}
              </Text>
              <Text className="text-sm text-tara-700">
                {questName(quest.quest_type, t)} · {quest.planned_minutes} min
              </Text>
              <Text className="text-sm text-tara-700">{proofHint(quest.quest_type, t)}</Text>
            </View>
          </View>
        </PolyFrame>
      ) : null}

      {phase === 'start' ? (
        <View className="gap-4">
          {quest.quest_type === 'linis' ? <TaraBubble text={t("Take a Before photo of the spot, then start. You've got this!", "Kunan ng Before photo ang lugar, tapos simulan. Kaya mo 'yan!")} /> : null}
          {quest.quest_type === 'aral' ? (
            <TaraBubble text={t("Take a photo of your notes. I'll make a 5-question quiz first, then your study timer starts.", 'Kunan ang notes mo. Gagawa muna ako ng 5-tanong na quiz, tapos magsisimula ang timer.')} />
          ) : null}
          {quest.quest_type === 'basa' ? (
            <>
              <TaraBubble text={t('Pick a page, then hold the button and read it aloud.', 'Pumili ng pahina, tapos pindutin at basahin nang malakas.')} />
              <Segmented options={PASSAGES.map((p) => ({ value: p.id, label: `${p.title} (${p.lang.toUpperCase()})` }))} value={passageId} onChange={setPassageId} />
            </>
          ) : null}
          {quest.quest_type === 'ehersisyo' ? (
            <>
              <TaraBubble
                text={t(
                  "How many reps? Hold the button and count aloud while you exercise. Warm-up counts are fine, I'll tell them apart.",
                  'Ilang reps? Pindutin at magbilang habang nag-eehersisyo. Okay lang ang warm-up, kaya kong ihiwalay.',
                )}
              />
              <Segmented options={[5, 10, 20, 30].map((n) => ({ value: String(n), label: `${n} reps` }))} value={String(repTarget)} onChange={(v) => patch(questId, { rep_target: Number(v) })} />
            </>
          ) : null}
          {quest.quest_type === 'sariling' ? <TaraBubble text={t("Your own task. When you're done, tell me and it counts as your word (1x).", 'Sariling Gawain. Pag tapos ka na, sabihin mo lang, bilang na (1x).')} /> : null}
          <Button
            label={quest.quest_type === 'linis' ? t('Take the Before photo', 'Kunan ang Before photo') : quest.quest_type === 'aral' ? t('Photograph my notes', 'Kunan ang notes') : t('Start', 'Simulan')}
            icon={quest.quest_type === 'linis' || quest.quest_type === 'aral' ? 'camera' : undefined}
            onPress={() => void start()}
          />
        </View>
      ) : null}

      {phase === 'preparing' && work.notes_uri ? (
        <QuizPrep notesUri={work.notes_uri} onReady={(quiz) => startStudying({ quiz, quiz_status: 'ready' })} onSkip={() => startStudying({ quiz_status: 'failed' })} />
      ) : null}

      {phase === 'running' ? (
        <View className="gap-4">
          <PolyFrame cut={18} fill={PALETTE.ink900} depth={5} depthColor={PALETTE.tara700}>
            <View className="items-center gap-3 px-5 py-7">
              <PixelIcon name="clock" size={24} color={PALETTE.sipag400} />
              <Text className="font-pixel-bold text-6xl text-banig-50">
                {pad(Math.floor(elapsedMs / 60_000))}:{pad(Math.floor((elapsedMs / 1000) % 60))}
              </Text>
              <Text className="font-pixel text-base text-sipag-300">{t(`of ${quest.planned_minutes} minutes`, `sa ${quest.planned_minutes} minuto`)}</Text>
              <View className="w-full">
                <BlockBar progress={elapsedMs / (quest.planned_minutes * 60_000)} blocks={20} />
              </View>
            </View>
          </PolyFrame>
          {work.before_uri ? <Image source={{ uri: work.before_uri }} className="h-40 w-full" /> : null}
          <TaraBubble
            text={
              quest.quest_type === 'aral'
                ? work.quiz_status === 'ready'
                  ? t('Your quiz is ready for when you finish. Study well!', 'Handa na ang quiz mo pag tapos ka. Mag-aral nang mabuti!')
                  : t('No quiz this time, so this one counts as Seen (2x).', 'Walang quiz ngayon, kaya Nakita (2x) ito.')
                : t("You've got this! I'm right here.", "Kaya mo 'yan! Nandito lang ako.")
            }
          />
          <Button label={t('Mark as done', 'Tapos na!')} icon="check" onPress={finishTask} />
        </View>
      ) : null}

      {phase === 'proof' && quest.quest_type === 'linis' ? (
        <View className="gap-4">
          <TaraBubble text={t('Take the After photo from the same spot.', 'Kunan ang After photo sa parehong puwesto.')} />
          <Button label={t('Take the After photo', 'Kunan ang After photo')} icon="camera" onPress={() => void runBeforeAfter()} />
        </View>
      ) : null}

      {phase === 'proof' && quest.quest_type === 'aral' ? (
        work.quiz_status === 'ready' && work.quiz ? (
          <QuizPanel
            quiz={work.quiz}
            onFinish={(correct) => {
              const total = work.quiz?.length ?? 5;
              const evidence = { quiz_correct: correct, quiz_total: total };
              setOutcome(
                correct >= 4
                  ? { verdict: 'patunay', said: t(`${correct} of ${total}! You really studied.`, `${correct} sa ${total}! Nag-aral ka talaga.`), evidence }
                  : { verdict: 'nakita', said: t(`${correct} of ${total}. Your notes count as Seen (2x). Review and try again next time!`, `${correct} sa ${total}. Nakita (2x) ang notes mo. Balikan at subukan ulit!`), evidence },
              );
              setPhase('result');
            }}
          />
        ) : (
          <Button
            label={t('See the result', 'Tingnan ang resulta')}
            onPress={() => {
              setOutcome({ verdict: 'nakita', said: t('I saw your notes. This counts as Seen (2x).', 'Nakita ko ang notes mo. Nakita (2x) ito.'), evidence: {} });
              setPhase('result');
            }}
          />
        )
      ) : null}

      {phase === 'proof' && quest.quest_type === 'basa' && passage ? (
        <ReadAloudProof
          passage={passage}
          onResult={(result) => {
            setOutcome(result);
            setPhase('result');
          }}
        />
      ) : null}

      {phase === 'proof' && quest.quest_type === 'ehersisyo' ? (
        <CountRepsProof target={repTarget} onCounted={(text) => void check(() => checkReps(quest.title, repTarget, text), t('Tara is checking your reps...', 'Tinitingnan ni Tara ang reps mo...'))} />
      ) : null}

      {phase === 'checking' ? <TaraBubble text={stage} isThinking /> : null}

      {phase === 'result' && outcome ? (
        <ResultPanel
          outcome={outcome}
          xp={preview && preview.type === 'quest_completed' ? preview.payload.xp : null}
          minutes={Math.min(60, Math.max(10, elapsedMin))}
          multiplier={multiplier}
          beforeUri={work.before_uri}
          afterUri={afterUri}
          canRetry={outcome.verdict === 'person' || (quest.quest_type === 'linis' ? !work.retake_used : true)}
          retryLabel={quest.quest_type === 'linis' ? t('Retake the photo', 'Kunan ulit') : t('Try again', 'Subukan ulit')}
          onAccept={() => (isCommitted ? router.replace('/bahay') : commit(false))}
          onRetry={() => {
            if (quest.quest_type === 'linis') patch(questId, { retake_used: true });
            setOutcome(null);
            setPhase('proof');
          }}
          onDispute={() => commit(true)}
        />
      ) : null}
    </TaraScreen>
  );
}
