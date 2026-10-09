import * as Notifications from 'expo-notifications';

import { tr } from '@/lib/i18n/translate';

/**
 * Schedules a local notification for a planned quest, keyed by its quest id so finishing the quest can cancel it.
 * Fires with the app closed; no server involved. Returns false when the time has passed or permission is denied.
 * @param quest the quest's id, title and planned time
 */
export async function scheduleQuestReminder(quest: { quest_id: string; title: string; scheduled_at: number }): Promise<boolean> {
  if (quest.scheduled_at <= Date.now() + 5_000) return false;
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: quest.quest_id,
    content: {
      title: tr(`Time for: ${quest.title}`, `Oras na para sa: ${quest.title}`),
      body: tr("Tara's ready when you are. Tap to start.", 'Handa na si Tara. I-tap para simulan.'),
      data: { quest_id: quest.quest_id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(quest.scheduled_at) },
  });
  return true;
}

/** Cancels a quest's reminder, if one was scheduled. */
export async function cancelQuestReminder(questId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(questId);
}
