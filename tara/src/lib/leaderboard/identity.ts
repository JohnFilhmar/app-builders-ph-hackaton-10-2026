import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = 'tara_user_id';

/**
 * This install's leaderboard id: made once, kept in SecureStore, never editable. Uninstalling clears it (backups are
 * off in app.json), and that is the only way it changes.
 */
export async function getUserId(): Promise<string> {
  const saved = await SecureStore.getItemAsync(USER_ID_KEY);
  if (saved) return saved;
  const made = randomUUID();
  await SecureStore.setItemAsync(USER_ID_KEY, made);
  return made;
}
