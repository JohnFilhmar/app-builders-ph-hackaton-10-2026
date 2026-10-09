import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { HoldToTalk } from '@/components/quest/HoldToTalk';
import { QuizPanel } from '@/components/quest/QuizPanel';
import { ResultPanel } from '@/components/quest/ResultPanel';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { checkBeforeAfter } from '@/lib/checks/beforeAfter';
import { prepareQuiz } from '@/lib/checks/notesQuiz';
import { highestCount, scoreReading } from '@/lib/checks/scoring';
import { completeQuest } from '@/lib/game/completeQuest';
import { COUNTING_PROMPT, PASSAGES, QUEST_INFO } from '@/lib/quests/questTypes';
import { useGameStore } from '@/lib/stores/gameStore';
import { useQuestStore } from '@/lib/stores/questStore';
import type { ProofTier } from '@/types/gameEvents';
import type { CheckOutcome } from '@/types/quest';
import { errorMessage } from '@/utils/errorMessage';

type Phase = 'start' | 'running' | 'proof' | 'checking' | 'result';

async function takePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  // camera only: proof photos never come from the gallery
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
  return shot.canceled ? null : (shot.assets[0]?.uri ?? null);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Runs one quest end to end: start step, timer, proof, Tara's check and the result. */
export default function QuestRun() {
  const { quest_id: questId } = useLocalSearchParams<{ quest_id: string }>();
  const openQuest = useGameStore((s) => s.state.openQuests.find((q) => q.quest_id === questId));
  // keep the quest after it completes, so the result screen can finish showing
  const snapshot = useRef(openQuest);
  if (openQuest) snapshot.current = openQuest;
  const quest = openQuest ?? snapshot.current;
  const events = useGameStore((s) => s.events);
  const multiplier = useGameStore((s) => s.state.streak.multiplier);
  const append = useGameStore((s) => s.append);
  const work = useQuestStore((s) => s.work[questId ?? ''] ?? {});
  const patch = useQuestStore((s) => s.patch);
  const clear = useQuestStore((s) => s.clear);

  const [phase, setPhase] = useState<Phase>(work.started_at ? 'running' : 'start');
  const [now, setNow] = useState(Date.now());
  const [stage, setStage] = useState('');
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [afterUri, setAfterUri] = useState<string | undefined>();
  const [liveText, setLiveText] = useState('');
  const [isCommitted, setIsCommitted] = useState(false);
  const [passageId, setPassageId] = useState(work.passage_id ?? PASSAGES[0]?.id ?? '');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMin = work.started_at ? Math.max(1, Math.round((now - work.started_at) / 60_000)) : 0;
  const tierOf = (o: CheckOutcome | null): ProofTier | null =>
    o && (o.verdict === 'patunay' || o.verdict === 'nakita' || o.verdict === 'sabi_ko') ? o.verdict : null;
  const preview = useMemo(() => {
    const tier = tierOf(outcome);
    if (!quest || !tier) return null;
    return completeQuest(events, { quest_id: quest.quest_id, quest_type: quest.quest_type, minutes: elapsedMin, tier, disputed: false, evidence: outcome?.evidence }, Date.now());
  }, [quest, outcome, events, elapsedMin]);

  if (!quest || !questId) {
    return (
      <TaraScreen title="Tapos na ito">
        <TaraBubble text="This Gawain is already done or was removed." />
        <Button label="Bumalik sa Bahay" onPress={() => router.replace('/bahay')} />
      </TaraScreen>
    );
  }
  const info = QUEST_INFO[quest.quest_type];
  const passage = PASSAGES.find((p) => p.id === passageId) ?? PASSAGES[0];

  const start = async () => {
    if (quest.quest_type === 'linis') {
      const uri = await takePhoto();
      if (!uri) return;
      patch(questId, { before_uri: uri });
    }
    if (quest.quest_type === 'aral') {
      const uri = await takePhoto();
      if (!uri) return;
      patch(questId, { notes_uri: uri, quiz_status: 'generating' });
      // the quiz is prepared now, while the user studies, so it is ready before the timer ends
      void prepareQuiz(uri)
        .then((quiz) => patch(questId, quiz ? { quiz, quiz_status: 'ready' } : { quiz_status: 'failed' }))
        .catch(() => patch(questId, { quiz_status: 'failed' }));
    }
    if (quest.quest_type === 'basa') patch(questId, { passage_id: passageId });
    if (quest.quest_type === 'ehersisyo') patch(questId, { rep_target: work.rep_target ?? 20 });
    patch(questId, { started_at: Date.now() });
    setPhase('running');
  };

  const finishTask = () => {
    if (quest.quest_type === 'sariling') {
      setOutcome({ verdict: 'sabi_ko', said: 'Salamat! Your word counts here. (Sabi Ko)', evidence: {} });
      setPhase('result');
    } else setPhase('proof');
  };

  const runBeforeAfter = async () => {
    const uri = await takePhoto();
    if (!uri || !work.before_uri) return;
    setAfterUri(uri);
    setPhase('checking');
    try {
      setOutcome(await checkBeforeAfter(quest.title, work.before_uri, uri, setStage));
    } catch (err) {
      setOutcome({ verdict: 'not_confirmed', said: `I had trouble looking at the photos (${errorMessage(err)}).`, evidence: {} });
    }
    setPhase('result');
  };

  const commit = (disputed: boolean) => {
    if (isCommitted) return;
    const tier = tierOf(outcome) ?? 'patunay';
    const event = completeQuest(events, { quest_id: questId, quest_type: quest.quest_type, minutes: elapsedMin, tier, disputed, evidence: outcome?.evidence }, Date.now());
    append(event);
    clear(questId);
    setIsCommitted(true);
    if (disputed && event.type === 'quest_completed') {
      const banked = event.payload.banked > 0 ? ` +${event.payload.banked} more lands tomorrow morning.` : '';
      setOutcome({ verdict: 'sabi_ko', said: `Naniniwala ako sa'yo. (I believe you.) +${event.payload.xp} Sipag.${banked}`, evidence: {} });
    } else router.replace('/bahay');
  };

  return (
    <TaraScreen title={quest.title} subtitle={`${info.label} (${info.english}) · ${quest.planned_minutes} min · ${info.proofHint}`}>
      {phase === 'start' ? (
        <View className="gap-4">
          {quest.quest_type === 'linis' ? <TaraBubble text="Take a Before photo of the spot, then start. Kaya mo 'yan!" /> : null}
          {quest.quest_type === 'aral' ? <TaraBubble text="Take a photo of your notes. I'll prepare a 5-question quiz while you study." /> : null}
          {quest.quest_type === 'basa' ? (
            <>
              <TaraBubble text="Pick a page to read aloud. Hold the button and read when the timer is done." />
              <Segmented options={PASSAGES.map((p) => ({ value: p.id, label: `${p.title} (${p.lang.toUpperCase()})` }))} value={passageId} onChange={setPassageId} />
            </>
          ) : null}
          {quest.quest_type === 'ehersisyo' ? (
            <>
              <TaraBubble text="How many reps? Count them aloud while holding the button at the end." />
              <Segmented options={[10, 20, 30, 60].map((n) => ({ value: String(n), label: `${n} reps` }))} value={String(work.rep_target ?? 20)} onChange={(v) => patch(questId, { rep_target: Number(v) })} />
            </>
          ) : null}
          {quest.quest_type === 'sariling' ? <TaraBubble text="Your own task. When you're done, tell me and it counts as Sabi Ko." /> : null}
          <Button label={quest.quest_type === 'linis' ? 'Kunan ang Before photo' : quest.quest_type === 'aral' ? 'Kunan ang notes' : 'Simulan'} onPress={() => void start()} />
        </View>
      ) : null}

      {phase === 'running' ? (
        <View className="items-center gap-4">
          <Text className="text-6xl font-black text-tara-900">
            {pad(Math.floor((now - (work.started_at ?? now)) / 60_000))}:{pad(Math.floor(((now - (work.started_at ?? now)) / 1000) % 60))}
          </Text>
          <Text className="text-base text-tara-500">of {quest.planned_minutes} minutes</Text>
          {work.before_uri ? <Image source={{ uri: work.before_uri }} className="h-40 w-full rounded-2xl" /> : null}
          {quest.quest_type === 'aral' ? (
            <TaraBubble
              text={work.quiz_status === 'ready' ? 'Your quiz is ready for when you finish.' : work.quiz_status === 'failed' ? "I couldn't read the notes well, so this one counts as Nakita (seen)." : 'Making your quiz from the notes...'}
              isThinking={work.quiz_status === 'generating'}
            />
          ) : (
            <TaraBubble text="Kaya mo 'yan! I'm right here." />
          )}
          <View className="w-full">
            <Button label="Tapos na! (Done)" onPress={finishTask} />
          </View>
        </View>
      ) : null}

      {phase === 'proof' && quest.quest_type === 'linis' ? (
        <View className="gap-4">
          <TaraBubble text="Take the After photo from the same spot." />
          <Button label="Kunan ang After photo" onPress={() => void runBeforeAfter()} />
        </View>
      ) : null}

      {phase === 'proof' && quest.quest_type === 'aral' ? (
        work.quiz_status === 'ready' && work.quiz ? (
          <QuizPanel
            quiz={work.quiz}
            onFinish={(correct) => {
              const total = work.quiz?.length ?? 5;
              setOutcome(
                correct >= 4
                  ? { verdict: 'patunay', said: `${correct} of ${total}! You really studied.`, evidence: { quiz_correct: correct, quiz_total: total } }
                  : { verdict: 'nakita', said: `${correct} of ${total}. Your notes count as Nakita (seen). Review and try again next time!`, evidence: { quiz_correct: correct, quiz_total: total } },
              );
              setPhase('result');
            }}
          />
        ) : work.quiz_status === 'generating' ? (
          <TaraBubble text="Still writing your quiz, almost there..." isThinking />
        ) : (
          <Button
            label="Tingnan ang resulta"
            onPress={() => {
              setOutcome({ verdict: 'nakita', said: 'I saw your notes but could not make a quiz from them. This counts as Nakita (seen).', evidence: {} });
              setPhase('result');
            }}
          />
        )
      ) : null}

      {phase === 'proof' && quest.quest_type === 'basa' && passage ? (
        <View className="gap-4">
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-lg leading-7 text-tara-900">{passage.text}</Text>
          </View>
          {liveText ? <Text className="text-sm italic text-tara-500">Heard: {liveText}</Text> : null}
          <HoldToTalk
            lang={passage.lang}
            label="Hold and read"
            onLiveText={setLiveText}
            onDone={({ text, seconds }) => {
              const score = scoreReading(passage.text, text);
              const wpm = seconds > 0 ? Math.round((score.matched / seconds) * 60) : 0;
              const skipped = score.skipped.slice(0, 3).join(', ');
              const evidence = { read_seconds: Math.round(seconds), words_read: score.matched, words_total: score.total };
              setOutcome(
                score.ratio >= 0.8
                  ? { verdict: 'patunay', said: `You read ${score.matched} of ${score.total} words at ${wpm} words per minute.${skipped ? ` Skipped: ${skipped}.` : ''} Hindi na-save ang boses mo. (Your voice was not saved.)`, evidence }
                  : score.ratio >= 0.4
                    ? { verdict: 'nakita', said: `I heard ${score.matched} of ${score.total} words. Nakita (seen)! Read the whole page next time for Patunay.`, evidence }
                    : { verdict: 'not_confirmed', said: `I only caught ${score.matched} of ${score.total} words. Try again closer to the phone?`, evidence },
              );
              setPhase('result');
            }}
          />
        </View>
      ) : null}

      {phase === 'proof' && quest.quest_type === 'ehersisyo' ? (
        <View className="gap-4">
          <Text className="text-center text-5xl font-black text-tara-900">
            {highestCount(liveText)} / {work.rep_target ?? 20}
          </Text>
          <HoldToTalk
            lang="auto"
            prompt={COUNTING_PROMPT}
            label="Hold and count"
            onLiveText={setLiveText}
            onDone={({ text }) => {
              const reps = highestCount(text);
              const target = work.rep_target ?? 20;
              const evidence = { reps, rep_target: target };
              setOutcome(
                reps >= target
                  ? { verdict: 'patunay', said: `${reps} reps! Isa pa? Ang lakas mo!`, evidence }
                  : reps > 0
                    ? { verdict: 'nakita', said: `I counted ${reps} of ${target}. Nakita (seen)! Keep counting aloud next time.`, evidence }
                    : { verdict: 'not_confirmed', said: "I didn't catch the counting. Try again, a bit louder?", evidence },
              );
              setPhase('result');
            }}
          />
        </View>
      ) : null}

      {phase === 'checking' ? <TaraBubble text={stage || 'Tara is looking...'} isThinking /> : null}

      {phase === 'result' && outcome ? (
        <ResultPanel
          outcome={outcome}
          xp={preview && preview.type === 'quest_completed' ? preview.payload.xp : null}
          minutes={Math.min(60, Math.max(10, elapsedMin))}
          multiplier={multiplier}
          beforeUri={work.before_uri}
          afterUri={afterUri}
          canRetry={outcome.verdict === 'person' || (quest.quest_type === 'linis' ? !work.retake_used : true)}
          retryLabel={quest.quest_type === 'linis' ? 'Kunan ulit (Retake)' : 'Subukan ulit (Try again)'}
          onAccept={() => (isCommitted ? router.replace('/bahay') : commit(false))}
          onRetry={() => {
            if (quest.quest_type === 'linis') patch(questId, { retake_used: true });
            setLiveText('');
            setOutcome(null);
            setPhase('proof');
          }}
          onDispute={() => commit(true)}
        />
      ) : null}
    </TaraScreen>
  );
}
