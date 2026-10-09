import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const LINES = [
  { hour: 6, minute: 30, title: 'Magandang umaga!', body: "Ano'ng plano natin today? Plan your Gawain with Tara." },
  { hour: 19, minute: 0, title: 'Isa pang Gawain?', body: 'One more quest before the day closes keeps your streak alive.' },
];

/**
 * Nanay Mode, simple version: two daily local reminders scheduled on the phone (no server, works offline,
 * fires with the app in the background). Turning it off cancels them.
 * @param isOn whether reminders should be scheduled
 */
export async function setNanayMode(isOn: boolean): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!isOn) return false;
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  for (const line of LINES) {
    await Notifications.scheduleNotificationAsync({
      content: { title: line.title, body: line.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: line.hour, minute: line.minute },
    });
  }
  return true;
}
