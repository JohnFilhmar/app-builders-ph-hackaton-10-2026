import { cancelQuestReminder } from '@/lib/alerts/questReminders';
import { newEventId } from '@/lib/game/completeQuest';
import { resetBoard } from '@/lib/leaderboard/leaderboardApi';
import { useGameStore } from '@/lib/stores/gameStore';
import { useLeaderboardStore } from '@/lib/stores/leaderboardStore';
import { useQuestStore } from '@/lib/stores/questStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { errorMessage } from '@/utils/errorMessage';

/**
 * Starts the player over: an empty ledger (just a fresh profile, as right after setup), no quests in progress, no
 * pending quest reminders, and 0 on the leaderboard. Setup, downloaded models, AI settings, language and the
 * leaderboard name are kept.
 * @returns false when the leaderboard server could not be reached; the phone is reset either way
 */
export async function resetProgress(): Promise<boolean> {
  const { state, replaceAll } = useGameStore.getState();
  await Promise.all(state.openQuests.map((q) => cancelQuestReminder(q.quest_id).catch(() => undefined)));
  useQuestStore.setState({ work: {} });
  const base_avatar = state.baseAvatar ?? useSetupStore.getState().baseAvatar;
  replaceAll([{ id: newEventId('evt'), type: 'profile_created', at: Date.now(), payload: { base_avatar } }]);
  if (!useLeaderboardStore.getState().username) return true;
  try {
    await resetBoard(useSetupStore.getState().backendUrl);
    return true;
  } catch (err) {
    console.warn(`[reset] leaderboard not reset: ${errorMessage(err)}`);
    return false;
  }
}
